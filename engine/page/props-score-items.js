import * as THREE from "three";
import { clamp } from "./util.js";

// "I could see everyone's happiness score" (Happiness 03, 16 Nov 2026), builder task P4: the hilltop bench, the kettle, the wall mirror and the reflection card.
// Design: storyboards/series/happiness/03-happiness-score/DESIGN.md section 2 (the reflections), section 8-9 (registry rows), section 10 (bench). Panels 13, 14, 15, 39-48.
// Metres, y up, front +z. Every number below is the design's; nothing random (hashed from the item's index and seed). Glass and reflections are userData.steam (no shadow, no refraction).
// No word or numeral in 3D: the newspaper's lines are grey scribble rows.
// Exports SCORE_ITEMS_KINDS, SCORE_ITEMS_GRIPS, HILLBENCH, wallmirrorTape. Registry line for props3d.js (the director adds it):
//   import { SCORE_ITEMS_KINDS, SCORE_ITEMS_GRIPS } from "./props-score-items.js"; Object.assign(KINDS, SCORE_ITEMS_KINDS); Object.assign(GRIPS, SCORE_ITEMS_GRIPS);
//
//   hillbench     The hilltop's weathered plank bench (not the iron `parkbench`: 45 is a macro of this wood). 1.9 long, seat top y 0.30 (the potato `parkbench` height), 0.42 deep (3 planks of
//                 0.13, gaps 0.015), back 2 planks 0.13 high at y 0.44-0.57 and 0.59-0.72, leaning back 4 degrees, their front face 0.13-0.15 behind the seat's rear edge (z -0.34 to -0.36): the potatoes' bodies overhang the seat at the back (Spud 0.66 deep, his rolled collar 0.72, sits 0.03 forward: his rear is at z -0.30..-0.33), so a back set against the seat would cut into them; Mash (0.50 deep) sits clear of it and can lean back. Wood #8a7358, lit #a88e6c,
//                 shade #5f4e3d, grain drawn once per plank (hashed, with knots and cracks), 6 nail heads #3a3028 (the seat's front and rear planks and the top back plank, over the
//                 posts), one split end (the front seat plank's +x end: the last 0.20 splits lengthwise and opens). Square posts 0.07 at x +-0.83, rails, a stretcher.
//                 Origin: the floor under the middle of the seat, facing +z; the seat's front edge at z +0.21. Solid, no params. Spec: none.
//                 SITTING (timeline.js "sit" with seat: <bench id>, height: 0.30): the sitter's z is the bench's z + 0.03. HILLBENCH below: mash.along -0.48, spud.along +0.47 (along = the
//                 bench's own x, so +x; facing +z, the sitter's right hand is -x). Spud 0.76 wide spans +0.09..+0.85, Mash 0.54 wide spans -0.75..-0.21: 0.30 apart. Ends at +-0.95.
//                 Hand grips: the seat top is y 0.30; a hand laid flat on it (41: Mash's L glove) rests at y 0.30 + the glove's own thickness.
//                 Glasses lying folded (45, 48): y = 0.30 + 0.097 (props-score.js), x -0.60 (0.35 from the seat's right end, the sitter's right = -x).
//   kettle        A steel stovetop kettle: base r 0.13, body to y 0.15, a lid dome to 0.184, a black knob to 0.200, a black arch handle over the lid (x-y plane, apex y 0.222), a spout
//                 toward -x (screen-left seen from +z, as panel 14). A lathe with UVs: u runs round the body from +z (0) through +x (0.25), -z (0.5) to -x (0.75), v up the profile.
//                 Steel #c3c9d0 with a baked sky streak and a dark foot (the hob). Origin: the middle of the base, standing on the hob (y 0), front +z. Solid.
//                 Params (propState; start = the spec value): reflect 0..1 (default spec.reflect, 0): the reflection of Spud's bench render (reflectcard art) mapped on the dome with the mirror-ball
//                 mapping, opacity 0.85 x reflect: the curve gives panel 14's fish-eye (the face spans about 55 % of the kettle's width at the defaults, the limb fades out).
//                 Spec: reflectView "front" | "side" (default "front"), reflectYaw degrees (default 0; turns the picture round the kettle: aim it at the camera when the kettle is turned),
//                 reflectFov degrees (the card's full angle seen from the kettle, default 150; smaller = smaller face), reflectLift (v shift, default -0.12: the face sits mid-dome), reflectFlip (default true: a mirror).
//   wallmirror    An arched wall mirror, wooden frame 0.55 wide x 0.80 high (a 0.55 x 0.525 body with a semicircle r 0.275 on top), frame #4e3522 0.045 wide, 0.035 deep, glass #9fb1c2 (steam,
//                 glass 0.46 x 0.71). Origin: the middle of the frame on the wall plane (back at z 0, front +z 0.035), hung where you put it. Solid frame.
//                 Param cover 0..1 (propState, default spec.cover, 0): a newspaper sheet taped over the glass, hanging from the top edge down by cover x 0.734 (grey scribble rows, a block
//                 headline bar, a grey photo box: no letters), paper #e9e4d6, 4 tape strips #d9c58f (top left, top right, left edge, and the last one on the sheet's bottom right corner,
//                 which moves with the sheet's bottom). 13 uses cover 0.7: Spud's R hand presses the last strip, SCORE_ITEMS_GRIPS.wallmirror.tape4 = [0.17, -0.122, 0.041] at cover 0.7 (the
//                 hand lays flat on it from +z); for any cover use wallmirrorTape(cover).
//                 Param reflect 0..1 (default spec.reflect, 0): Spud's reflection in the glass (opacity 0.85 x reflect), life-size: the glass shows the card's middle strip at spec.reflectAt
//                 (the card height share at the glass centre, default 0.55: the eyes are at 0.52), spec.reflectView "front" | "side", spec.reflectFlip (default true).
//   reflectcard   A card showing a bench render of the engine's own Spud wearing the scoreglasses (assets/props/score/spud-reflect-front.png and -side.png, 1024 px square, transparent).
//                 Origin: the card's middle, the picture facing +z, 1.4 x 1.4 m (spec.w, default 1.4: life-size; Spud stands 1.21 m from the soles to the leaf tip, the soles at 6 % of the height, the leaf tip
//                 at 91 %, the eyes at 52 %, the body 12 %..88 % of the width with his hands out). `front`: Spud faces the camera, his scratched rim on the picture's right; `side`: seen from Spud's right, he faces the picture's
//                 right, feet at the same height. A mirror flips the picture left to right (spec.flipX, default true for every `as` except "puddle"); a puddle flips it top to bottom
//                 (spec.flipY, default true for "puddle" only).
//                 spec.as sets the opacity (spec.opacity overrides it): van 0.45 (boxvan's cab window), window 0.35 (a bare window, 35), puddle 0.70, mirror 0.85, kettle 0.85. The `puddle`
//                 card also wobbles: its rows slide sideways by spec.wob (default 0.008 m, about 3 px at 400 px per metre) along a sine at 0.8 Hz (spec.wobHz), 3 waves over its height;
//                 any card wobbles when spec.wob is given. Lay a puddle card on the ground with tip -90 (face up); stand the others against the glass with a 1 cm gap (z).
//                 Param op 0..1 (propState, default spec.op, 1) multiplies the opacity: fade it in and out. See-through for the checks.
//                 The two PNGs come from storyboards in the builder's scratch (set none, a black and a white background, difference matte): see "THE RENDERS" at the foot of this header.
//
// THE RENDERS: Spud (potatobrawl/spud, expr "sad", arms at rest, a `scoreglasses` wear: "spud" at the SCORE_FITS nose pose) stands at the origin on a `set: { type: "plain", floor: "none" }`, a camera 6 m
// away at y 0.62 with fov 13.3 degrees (a 1.4 m square: a long lens), 1920 x 1080 stills (the middle 1080 square, resized to 1024), each on a #000000 and on a #ffffff `set.floor none`
// background, plus the same two with nobody in: alpha = 1 - (white - black) / (empty white - empty black), colour = (black - (1 - alpha) x empty black) / alpha (the look's grade and vignette cancel).
// The ground shadow is cut (only the opaque body and a 5 px skin round it stay).
// Front: the camera at +z. Side: the camera at -x (Spud's right), Spud facing +z so he faces the picture's right.
//
// Triangles: bench about 0.5k, kettle about 1.8k, mirror about 0.5k, card 0.1k.

const DEG = Math.PI / 180, CARD = 1.4;   // the reflection card's size: the bench render frames 1.4 m square
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
// see-through for the checks, no shadow (glass, reflections)
const thru = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

export const HILLBENCH = { seat: 0.30, mash: { along: -0.48 }, spud: { along: 0.47 }, len: 1.9, depth: 0.42, backTop: 0.72, glassesX: -0.60, glassesY: 0.30 + 0.097 };

// the wall mirror's sheet and tape numbers (glass 0.46 x 0.71: half width 0.23, the arch centre y 0.125, the paper 0.012 wider all round)
const MIR = { w: 0.55, hRect: 0.525, frame: 0.045, depth: 0.035, cy: 0.125, paper: 0.012 };
const PAPER_TOP = MIR.cy + MIR.w / 2 - MIR.frame + MIR.paper, PAPER_H = PAPER_TOP - (-0.40 + MIR.frame - MIR.paper);   // 0.367, 0.734
export const wallmirrorTape = (cover = 0.7) => [0.17, PAPER_TOP - PAPER_H * clamp(cover) + 0.025, MIR.depth + 0.006];

export const SCORE_ITEMS_GRIPS = {
  wallmirror: { tape4: wallmirrorTape(0.7) },
  kettle: { handle: [0, 0.222, 0], knob: [0, 0.2, 0] },
};

// ------------------------------------------------------------------------------------------------ wood
const WOOD = { base: "#8a7358", lit: "#a88e6c", shade: "#5f4e3d", ink: "#3d3226" };
// one plank's face, drawn once: the colour from lit (canvas top) through base to shade, broad tone patches, long wavy grain lines, knots with rings, a few cracks and pale weathering flecks
function woodTex(seed, W = 1536, H = 128, { knots = 2, cracks = 4 } = {}) {
  return canvasTex(W, H, (x) => {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, WOOD.lit); g.addColorStop(0.4, WOOD.base); g.addColorStop(1, WOOD.shade); x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 16; i++) { const s = seed * 211 + i * 7; x.fillStyle = i % 2 ? "rgba(168,142,108,0.16)" : "rgba(80,64,46,0.14)"; x.beginPath(); x.ellipse(rnd(s + 1) * W, rnd(s + 2) * H, 60 + rnd(s + 3) * 220, 5 + rnd(s + 4) * 22, 0, 0, 7); x.fill(); }
    // grain: long wavy lines along the plank
    for (let i = 0; i < 38; i++) {
      const s = seed * 331 + i * 11, y0 = rnd(s + 1) * H, x0 = (rnd(s + 2) - 0.2) * W * 0.6, len = W * (0.3 + rnd(s + 3) * 0.7), amp = 1 + rnd(s + 4) * 3.5, fr = 0.004 + rnd(s + 5) * 0.01, ph = rnd(s + 6) * 6.28;
      x.strokeStyle = i % 4 ? `rgba(61,50,38,${0.16 + rnd(s + 7) * 0.3})` : `rgba(210,190,160,${0.1 + rnd(s + 7) * 0.14})`; x.lineWidth = 0.8 + rnd(s + 8) * 1.8; x.beginPath();
      for (let k = 0; k <= len; k += 14) { const px = x0 + k, py = y0 + amp * Math.sin(px * fr + ph) + k * (rnd(s + 9) - 0.5) * 0.02; k ? x.lineTo(px, py) : x.moveTo(px, py); }
      x.stroke();
    }
    // knots: dark core and rings
    for (let i = 0; i < knots; i++) {
      const s = seed * 97 + i * 13, kx = (0.1 + rnd(s + 1) * 0.8) * W, ky = (0.25 + rnd(s + 2) * 0.5) * H, kr = 6 + rnd(s + 3) * 9;
      for (let r = 4; r >= 1; r--) { x.fillStyle = r % 2 ? "rgba(74,59,44,0.55)" : "rgba(122,98,72,0.5)"; x.beginPath(); x.ellipse(kx, ky, kr * r * 0.55 * 1.7, kr * r * 0.55, 0, 0, 7); x.fill(); }
      x.fillStyle = "#3a2d20"; x.beginPath(); x.ellipse(kx, ky, kr * 0.5, kr * 0.34, 0, 0, 7); x.fill();
    }
    // cracks: short dark lines with a lighter lip
    for (let i = 0; i < cracks; i++) {
      const s = seed * 53 + i * 17, cx0 = rnd(s + 1) * W, cy0 = rnd(s + 2) * H, l = 40 + rnd(s + 3) * 130;
      x.strokeStyle = "rgba(38,28,20,0.8)"; x.lineWidth = 1.8; x.beginPath(); x.moveTo(cx0, cy0); x.quadraticCurveTo(cx0 + l / 2, cy0 + (rnd(s + 4) - 0.5) * 6, cx0 + l, cy0 + (rnd(s + 5) - 0.5) * 8); x.stroke();
      x.strokeStyle = "rgba(190,168,136,0.4)"; x.lineWidth = 1; x.beginPath(); x.moveTo(cx0, cy0 + 2.5); x.quadraticCurveTo(cx0 + l / 2, cy0 + 2.5 + (rnd(s + 4) - 0.5) * 6, cx0 + l, cy0 + 2.5 + (rnd(s + 5) - 0.5) * 8); x.stroke();
    }
    for (let i = 0; i < 90; i++) { const s = seed * 17 + i; x.fillStyle = `rgba(214,198,170,${0.12 + rnd(s + 3) * 0.22})`; x.fillRect(rnd(s + 1) * W, rnd(s + 2) * H, 2 + rnd(s + 4) * 6, 1 + rnd(s + 5) * 1.5); }
    // an edge line top and bottom (a worn arris)
    x.fillStyle = "rgba(61,50,38,0.4)"; x.fillRect(0, 0, W, 2); x.fillRect(0, H - 3, W, 3);
  });
}
// the sawn end: a darker face with a few growth rings
const endTex = (seed) => canvasTex(128, 128, (x, W, H) => {
  x.fillStyle = "#6f5b44"; x.fillRect(0, 0, W, H);
  for (let r = 1; r < 7; r++) { x.strokeStyle = `rgba(52,40,29,${0.2 + r * 0.05})`; x.lineWidth = 1.5; x.beginPath(); x.ellipse(W * (0.3 + 0.1 * rnd(seed + r)), H * 0.5, 10 + r * 12, 6 + r * 7, 0, 0, 7); x.stroke(); }
  x.fillStyle = "rgba(30,22,15,0.4)"; x.fillRect(0, H - 6, W, 6);
});

function hillbench(P) {
  const L = HILLBENCH.len, SEAT = HILLBENCH.seat, PD = 0.13, GAP = 0.015, PT = 0.035, lean = 4 * DEG;
  const dark = mat("#4a3c2d", { roughness: 0.95 }), nailM = mat(WOOD.ink, { roughness: 0.5, metalness: 0.4 }), splitM = mat("#2a2018", { roughness: 1 });
  let n = 0;
  // a plank: ends (the sawn grain), the top and both long faces drawn from one canvas, the underside dark; a hashed tilt (under half a degree) and sag
  const plank = (len, h, d, parent, x, y, z, { endsOpen = false, seed = n + 1 } = {}) => {
    const tex = woodTex(seed, len > 1 ? 1536 : 256, 128), end = new THREE.MeshStandardMaterial({ color: "#ffffff", map: endTex(seed), roughness: 0.95 }), face = new THREE.MeshStandardMaterial({ color: "#ffffff", map: tex, roughness: 0.92 });
    const m = mesh(new THREE.BoxGeometry(len, h, d), [end, end, face, dark, face, face], parent, x, y, z);
    m.rotation.z = (rnd(seed * 3 + 1) - 0.5) * 0.012; m.rotation.y = (rnd(seed * 3 + 2) - 0.5) * 0.008; n++; return m;
  };
  const SX = L / 2 - 0.12, BACKZ = -0.41;   // the rear posts' z: the sitters' bodies (Spud 0.66 deep, his rolled collar about 0.72, sitting 0.03 forward) overhang the seat's rear edge (-0.21) by 0.09-0.12; checked with a section at y 0.62   // post centres at +-0.83
  // seat: front, middle, rear (z from the front edge +0.21)
  const zs = [0.21 - PD / 2, 0.21 - PD * 1.5 - GAP, 0.21 - PD * 2.5 - GAP * 2];
  zs.forEach((z, i) => {
    if (i === 0) {   // the split end: the +x last 0.20 is two halves, the front half stays, the rear half drops 6 mm and turns 2.5 degrees away
      const body = L - 0.20; plank(body, PT, PD, P.whole, -L / 2 + body / 2, SEAT - PT / 2, z, { seed: 21 });
      const hl = 0.20, halfD = (PD - 0.012) / 2, bx = L / 2 - hl / 2;
      const a = plank(hl, PT, halfD, P.whole, bx, SEAT - PT / 2, z + (PD - halfD) / 2, { seed: 22 });
      const b = plank(hl, PT, halfD, P.whole, bx + 0.004, SEAT - PT / 2 - 0.006, z - (PD - halfD) / 2, { seed: 23 }); b.rotation.y = 2.5 * DEG;
      mesh(new THREE.BoxGeometry(hl - 0.01, 0.002, 0.014), splitM, P.whole, bx, SEAT - 0.0005, z - 0.001).castShadow = false;   // the gap's dark floor, seen from above
    } else plank(L, PT, PD, P.whole, 0, SEAT - PT / 2, z, { seed: 31 + i });
  });
  // back: 2 planks on a group leaning 4 degrees about the posts' line (z BACKZ + 0.04, y = the seat's underside)
  const back = new THREE.Group(); back.position.set(0, SEAT - PT, BACKZ + 0.04); back.rotation.x = -lean; P.whole.add(back);
  const BH = 0.13, BT = 0.03, c = Math.cos(lean);
  [[0.44, 41], [0.59, 42]].forEach(([y0, sd]) => plank(L - 0.04, BH, BT, back, 0, (y0 - (SEAT - PT)) / c + BH / 2, 0, { seed: sd }));
  // posts: front leg, rear lower, rear upper (leaning), a side rail; a stretcher along x
  for (const sx of [-1, 1]) {
    const x = sx * SX, post = (h, z, y, sd) => { const m = plank(h, 0.07, 0.07, P.whole, x, y, z, { seed: sd }); m.rotation.z = Math.PI / 2; return m; };
    post(SEAT - PT, 0.15, (SEAT - PT) / 2, 51 + sx);
    post(SEAT - PT, BACKZ, (SEAT - PT) / 2, 53 + sx);
    const up = new THREE.Group(); up.position.set(x, SEAT - PT, BACKZ); up.rotation.x = -lean; P.whole.add(up);
    const u = plank(0.47, 0.06, 0.045, up, 0, 0.235, 0, { seed: 55 + sx }); u.rotation.z = Math.PI / 2;
    const rail = plank(0.56, 0.05, 0.05, P.whole, x, 0.215, -0.13, { seed: 57 + sx }); rail.rotation.y = Math.PI / 2;
  }
  const st = plank(2 * SX - 0.07, 0.05, 0.045, P.whole, 0, 0.19, -0.2, { seed: 59 });
  // 6 nail heads, hashed 1 mm off the post's middle: the front and rear seat planks over each post, the top back plank over each post
  const nail = (x, y, z, flat = true) => { const m = mesh(new THREE.CylinderGeometry(0.0072, 0.0072, 0.004, 6), nailM, P.whole, x, y, z); if (!flat) m.rotation.x = Math.PI / 2; return m; };
  [0, 2].forEach((zi, k) => [-1, 1].forEach((sx, j) => nail(sx * SX + (rnd(k * 5 + j) - 0.5) * 0.006, SEAT + 0.001, zs[zi] + (rnd(k * 5 + j + 9) - 0.5) * 0.008)));
  [-1, 1].forEach((sx, j) => { const m = nail(0, 0, 0, false); P.whole.remove(m); back.add(m); m.position.set(sx * SX + (rnd(j + 60) - 0.5) * 0.006, (0.59 - (SEAT - PT)) / c + BH / 2 + (rnd(j + 70) - 0.5) * 0.01, BT / 2 + 0.001); });
  return { grip: SEAT };
}

// ------------------------------------------------------------------------------------------------ the reflection picture
const memo = new Map(), once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
const queueLoad = (p) => (globalThis.__loads ||= []).push(p);
function reflectTex(view) {
  const file = view === "side" ? "spud-reflect-side.png" : "spud-reflect-front.png";
  return once("score-reflect:" + file, () => {
    let ok, bad; const job = new Promise((res, rej) => { ok = res; bad = rej; });
    const t = new THREE.TextureLoader().load(`/assets/props/score/${file}`, () => ok(), undefined, () => bad(new Error(`props-score-items: assets/props/score/${file} is missing (render the Spud reflection benches: see the header)`)));
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.premultiplyAlpha = false; queueLoad(job); return t;
  });
}
const REFLECT_OPACITY = { van: 0.45, window: 0.35, puddle: 0.70, mirror: 0.85, kettle: 0.85 };
function basicThru(map, opacity) {
  const m = new THREE.MeshBasicMaterial({ map, transparent: true, opacity, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  m.userData.noOutline = true; m.userData.glass = true; return m;
}

function reflectcard(P) {
  const S = P.spec, as = S.as ?? "mirror", w = S.w ?? CARD, base = S.opacity ?? REFLECT_OPACITY[as] ?? 0.85;
  const flipX = S.flipX ?? (as !== "puddle"), flipY = S.flipY ?? (as === "puddle");
  const wob = S.wob ?? (as === "puddle" ? 0.008 : 0), wobHz = S.wobHz ?? 0.8, ROWS = 48;
  const geo = new THREE.PlaneGeometry(w, w, 1, ROWS), uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) { if (flipX) uv.setX(i, 1 - uv.getX(i)); if (flipY) uv.setY(i, 1 - uv.getY(i)); }
  const pos = geo.attributes.position, x0 = Float32Array.from(pos.array);
  const m = basicThru(reflectTex(S.view ?? "front"), base);
  const o = thru(new THREE.Mesh(geo, m), 4); P.whole.add(o);
  let last = null;
  return {
    grip: 0,
    apply(ps, t) {
      const op = clamp(ps.op ?? S.op ?? 1), tt = t ?? 0, key = op + "|" + (wob ? tt : 0); if (key === last) return; last = key;
      m.opacity = base * op; o.visible = op > 0.004;
      if (wob) for (let i = 0; i < pos.count; i++) pos.setX(i, x0[i * 3] + wob * Math.sin(2 * Math.PI * (wobHz * tt + 3 * (pos.getY(i) / w + 0.5))));
      if (wob) pos.needsUpdate = true;
    },
  };
}

// ------------------------------------------------------------------------------------------------ the kettle
const KET = { r: 0.13, seamY: 0.150, lidTop: 0.184, knobY: 0.188, knobR: 0.012, handleTop: 0.222, segs: 32 };
function steelTex() {
  // u round the body from +z (0), +x 0.25, -z 0.5, -x 0.75; v up the profile (canvas top = the top of the body)
  return canvasTex(512, 256, (x, W, H) => {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#e4e8ec"); g.addColorStop(0.5, "#c3c9d0"); g.addColorStop(0.86, "#9aa1aa"); g.addColorStop(1, "#6b7078"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    // the limbs (sides at u 0.25 and 0.75) reflect the dark room
    for (const u of [0.25, 0.75]) { const g2 = x.createLinearGradient((u - 0.14) * W, 0, (u + 0.14) * W, 0); g2.addColorStop(0, "rgba(60,66,76,0)"); g2.addColorStop(0.5, "rgba(60,66,76,0.62)"); g2.addColorStop(1, "rgba(60,66,76,0)"); x.fillStyle = g2; x.fillRect((u - 0.14) * W, 0, 0.28 * W, H); }
    // a tall window streak right of the front, and a thinner one left
    const streak = (u, wu, a) => { const g3 = x.createLinearGradient((u - wu) * W, 0, (u + wu) * W, 0); g3.addColorStop(0, "rgba(255,255,255,0)"); g3.addColorStop(0.5, `rgba(255,255,255,${a})`); g3.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g3; x.fillRect((u - wu) * W, H * 0.08, 2 * wu * W, H * 0.7); };
    streak(0.09, 0.025, 0.7); streak(0.93, 0.012, 0.45); streak(0.5, 0.03, 0.2);
    // fine brushed lines round the body, the hob's glow under the belly
    x.strokeStyle = "rgba(255,255,255,0.12)"; x.lineWidth = 1; for (let i = 0; i < 40; i++) { const y = rnd(i + 5) * H; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y + (rnd(i + 80) - 0.5) * 3); x.stroke(); }
    const gl = x.createLinearGradient(0, H * 0.82, 0, H); gl.addColorStop(0, "rgba(255,170,90,0)"); gl.addColorStop(1, "rgba(255,150,70,0.3)"); x.fillStyle = gl; x.fillRect(0, H * 0.82, W, H * 0.18);
  });
}
// a lathe from a smooth curve through the key points [r, y] (first and last on the axis or close to it)
function lathe(keys, n, segs) {
  const c = new THREE.CatmullRomCurve3(keys.map(([r, y]) => new THREE.Vector3(r, y, 0)), false, "centripetal"), pts = c.getPoints(n).map((p) => new THREE.Vector2(Math.max(0, p.x), p.y));
  return new THREE.LatheGeometry(pts, segs);
}
const BODY = [[0, 0], [0.112, 0], [0.126, 0.007], [0.1305, 0.022], [0.1295, 0.05], [0.1215, 0.086], [0.105, 0.12], [0.0875, 0.1455], [0.0845, KET.seamY]];
const LID = [[0.0845, KET.seamY], [0.079, 0.1605], [0.062, 0.1735], [0.036, 0.1815], [0.012, 0.1838], [0, KET.lidTop]];

// the picture on a dome: the mirror-ball mapping. A viewer on +z sees, at a point with normal n, the direction r = 2 (n.z) n - z; the card stands in front (+z) with `fov` degrees across: u/v follow r.xy / r.z
function reflectOverlay(geo, S) {
  const g = geo.clone(), p = g.attributes.position, nm = g.attributes.normal, uv = new Float32Array(p.count * 2), col = new Float32Array(p.count * 4);
  const yaw = (S.reflectYaw ?? 0) * DEG, cy = Math.cos(yaw), sy = Math.sin(yaw), k = 0.5 / Math.tan(((S.reflectFov ?? 150) / 2) * DEG), lift = S.reflectLift ?? -0.12, mirror = S.reflectFlip ?? true;
  for (let i = 0; i < p.count; i++) {
    let nx = nm.getX(i), ny = nm.getY(i), nz = nm.getZ(i);
    p.setXYZ(i, p.getX(i) + nx * 0.0012, p.getY(i) + ny * 0.0012, p.getZ(i) + nz * 0.0012);
    const mx = nx * cy - nz * sy, mz = nx * sy + nz * cy;   // the normal turned by -yaw about y: the picture turns with +yaw
    const rx = 2 * mz * mx, ry = 2 * mz * ny, rz = 2 * mz * mz - 1;
    const a = smooth(0.03, 0.28, rz);
    uv[i * 2] = 0.5 + (mirror ? -1 : 1) * k * (rx / Math.max(rz, 0.03)) ; uv[i * 2 + 1] = 0.5 + lift + k * (ry / Math.max(rz, 0.03));
    col[i * 4] = col[i * 4 + 1] = col[i * 4 + 2] = 1; col[i * 4 + 3] = a;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setAttribute("color", new THREE.BufferAttribute(col, 4)); p.needsUpdate = true;
  return g;
}

function kettle(P) {
  const S = P.spec, steel = new THREE.MeshStandardMaterial({ color: "#ffffff", map: steelTex(), roughness: 0.25, metalness: 0.35 }), black = mat("#1b1b1e", { roughness: 0.45 });
  const body = lathe(BODY, 16, KET.segs), lid = lathe(LID, 8, KET.segs);
  // the lid's texture rows: its own v 0..1 over the lid; the body's over the body (both draw the same sky streak: fine, the lid is small)
  mesh(body, steel, P.whole); mesh(lid, steel, P.whole);
  mesh(new THREE.TorusGeometry(0.0848, 0.0028, 6, KET.segs), mat("#7f858d", { roughness: 0.4, metalness: 0.4 }), P.whole, 0, KET.seamY, 0).rotation.x = Math.PI / 2;
  const kn = mesh(new THREE.SphereGeometry(KET.knobR, 12, 8), black, P.whole, 0, KET.knobY, 0); kn.scale.y = 0.95;
  mesh(new THREE.CylinderGeometry(0.0065, 0.008, 0.008, 8), black, P.whole, 0, KET.lidTop + 0.002, 0);
  // the spout toward -x: a tapered tube from the body's shoulder out and up
  const sp = new THREE.CatmullRomCurve3([[-0.118, 0.045, 0], [-0.15, 0.08, 0], [-0.178, 0.125, 0], [-0.196, 0.168, 0]].map((q) => new THREE.Vector3(...q)));
  const spout = mesh(new THREE.TubeGeometry(sp, 8, 0.019, 8), steel.clone(), P.whole); spout.material.map = null; spout.material.color.set("#b6bcc4");
  mesh(new THREE.TorusGeometry(0.0128, 0.003, 6, 12), mat("#8d939b", { metalness: 0.4, roughness: 0.4 }), P.whole, -0.196, 0.168, 0).rotation.set(Math.PI / 2 - 0.35, 0, 0.3);
  // the handle: a black arch over the lid in the x-y plane, 0.014 thick, fixed at two small lugs on the shoulders
  const hd = new THREE.CatmullRomCurve3([[-0.112, 0.118, 0], [-0.118, 0.17, 0], [-0.06, 0.212, 0], [0, KET.handleTop - 0.007, 0], [0.06, 0.212, 0], [0.118, 0.17, 0], [0.112, 0.118, 0]].map((q) => new THREE.Vector3(...q)));
  mesh(new THREE.TubeGeometry(hd, 20, 0.007, 6), black, P.whole);
  for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.016, 0.02, 0.022), black, P.whole, sx * 0.109, 0.118, 0);
  // the reflection: overlays on the body and the lid, see-through; reflect 0..1
  const tex = reflectTex(S.reflectView ?? "front"), rm = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  rm.userData.noOutline = true; rm.userData.glass = true;
  const ob = thru(new THREE.Mesh(reflectOverlay(body, S), rm), 4), ol = thru(new THREE.Mesh(reflectOverlay(lid, S), rm), 4); P.whole.add(ob, ol);
  let last = null;
  return {
    grip: 0,
    apply(ps) {
      const r = clamp(ps.reflect ?? S.reflect ?? 0); if (r === last) return; last = r;
      rm.opacity = REFLECT_OPACITY.kettle * r; ob.visible = ol.visible = r > 0.004;
    },
  };
}

// ------------------------------------------------------------------------------------------------ the wall mirror
// the arch outline (counter-clockwise from the bottom left): half width hw, the rect from y0 up to cy, a semicircle of radius hw above it
function archPoints(hw, y0, cy, n = 20) {
  const pts = [[-hw, y0], [hw, y0], [hw, cy]];
  for (let i = 1; i < n; i++) { const a = (i / n) * Math.PI; pts.push([hw * Math.cos(a), cy + hw * Math.sin(a)]); }
  pts.push([-hw, cy]); return pts;
}
const shapeOf = (pts) => { const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))); return s; };
function paperTex() {
  return canvasTex(512, 1024, (x, W, H) => {
    x.fillStyle = "#e9e4d6"; x.fillRect(0, 0, W, H);
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "rgba(255,255,255,0.15)"); g.addColorStop(1, "rgba(160,140,100,0.22)"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    // a block headline bar, a grey photo box with a diagonal hatch, three columns of grey scribble rows (no letters)
    x.fillStyle = "#4f4d49"; x.fillRect(46, 70, W - 92, 58); x.fillRect(120, 140, W - 240, 14);
    x.fillStyle = "#b9b5ab"; x.fillRect(46, 190, 140, 150); x.save(); x.beginPath(); x.rect(46, 190, 140, 150); x.clip(); x.strokeStyle = "#8e8a80"; x.lineWidth = 2; for (let i = -150; i < 140; i += 14) { x.beginPath(); x.moveTo(46 + i, 340); x.lineTo(46 + i + 150, 190); x.stroke(); } x.restore();
    x.strokeStyle = "#8c8a85"; x.lineCap = "round";
    for (let col = 0; col < 3; col++) {
      const cx0 = 46 + col * 150, y0 = col === 0 ? 360 : 190;
      for (let r = 0; y0 + r * 15 < H - 70; r++) {
        const s = col * 400 + r, y = y0 + r * 15; if (rnd(s + 5) < 0.06) continue;
        x.lineWidth = 3.2 + rnd(s) * 1.4; x.beginPath(); x.moveTo(cx0, y);
        const len = 130 * (r % 7 === 6 ? 0.55 : 0.92 + rnd(s + 1) * 0.08), steps = Math.floor(len / 9);
        for (let k = 1; k <= steps; k++) x.lineTo(cx0 + (k * len) / steps, y + (k % 2 ? -2.2 : 2.2) * (0.6 + rnd(s + k) * 0.8));
        x.stroke();
      }
    }
    // folds: a cross crease, faint
    x.strokeStyle = "rgba(120,106,80,0.25)"; x.lineWidth = 3; x.beginPath(); x.moveTo(0, H * 0.5); x.lineTo(W, H * 0.5 + 6); x.stroke(); x.beginPath(); x.moveTo(W * 0.5, 0); x.lineTo(W * 0.5 - 4, H); x.stroke();
  });
}
function mirrorGlassTex() {
  return canvasTex(256, 512, (x, W, H) => {
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#b3c3d1"); g.addColorStop(0.5, "#9fb1c2"); g.addColorStop(1, "#8a9db0"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = "rgba(255,255,255,0.28)"; x.beginPath(); x.moveTo(W * 0.15, 0); x.lineTo(W * 0.3, 0); x.lineTo(W * 0.85, H); x.lineTo(W * 0.7, H); x.closePath(); x.fill();
    x.fillStyle = "rgba(255,255,255,0.14)"; x.beginPath(); x.moveTo(W * 0.38, 0); x.lineTo(W * 0.43, 0); x.lineTo(W * 0.98, H * 0.9); x.lineTo(W * 0.93, H * 0.9); x.closePath(); x.fill();
  });
}
function frameTex() {
  return canvasTex(256, 512, (x, W, H) => {
    x.fillStyle = "#4e3522"; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) { const s = i + 900, xx = rnd(s) * W; x.strokeStyle = i % 3 ? `rgba(30,19,11,${0.2 + rnd(s + 1) * 0.3})` : `rgba(130,98,64,${0.15 + rnd(s + 1) * 0.2})`; x.lineWidth = 1 + rnd(s + 2) * 2; x.beginPath(); x.moveTo(xx, 0); x.quadraticCurveTo(xx + (rnd(s + 3) - 0.5) * 30, H / 2, xx + (rnd(s + 4) - 0.5) * 20, H); x.stroke(); }
  });
}

function wallmirror(P) {
  const S = P.spec, hw = MIR.w / 2, y0 = -0.40, iw = hw - MIR.frame;
  const outer = shapeOf(archPoints(hw, y0, MIR.cy)), inner = archPoints(iw, y0 + MIR.frame, MIR.cy);
  outer.holes.push(new THREE.Path(inner.slice().reverse().map(([x, y]) => new THREE.Vector2(x, y))));
  const ft = frameTex(); ft.wrapS = ft.wrapT = THREE.ClampToEdgeWrapping; ft.repeat.set(1 / MIR.w, 1 / 0.8); ft.offset.set(0.5, 0.5);
  mesh(new THREE.ExtrudeGeometry(outer, { depth: MIR.depth, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 1, curveSegments: 12 }), mat("#ffffff", { map: ft, roughness: 0.7 }), P.whole);
  // the glass, set back 0.012 inside the frame
  const gt = mirrorGlassTex(); gt.repeat.set(1 / (2 * iw), 1 / 0.71); gt.offset.set(0.5, 0.5);
  const glassG = new THREE.ShapeGeometry(shapeOf(inner), 12), glass = thru(new THREE.Mesh(glassG, mat("#ffffff", { map: gt, roughness: 0.12, metalness: 0.35 })), 1); glass.position.z = MIR.depth - 0.024; glass.receiveShadow = true; P.whole.add(glass); glass.userData.steam = true;
  // Spud's reflection in the glass: a window of the card (life-size, the 1.4 m card), u mirrored, v from the glass's y
  const rg = new THREE.ShapeGeometry(shapeOf(inner), 12), ruv = rg.attributes.uv, rp = rg.attributes.position, at = S.reflectAt ?? 0.55, flip = S.reflectFlip ?? true;
  for (let i = 0; i < rp.count; i++) { ruv.setXY(i, 0.5 + (flip ? -1 : 1) * rp.getX(i) / CARD, at + rp.getY(i) / CARD); }
  const rm = basicThru(reflectTex(S.reflectView ?? "front"), 0), refl = thru(new THREE.Mesh(rg, rm), 2); refl.position.z = MIR.depth - 0.0225; P.whole.add(refl);
  // the newspaper: a sheet hanging from the top, cut to the arch, a slightly sagging bottom edge; 4 tape strips
  const sheet = new THREE.Group(); sheet.position.z = MIR.depth + 0.003; P.whole.add(sheet);
  const pm = mat("#ffffff", { map: paperTex(), roughness: 0.95, side: THREE.DoubleSide }), tapeM = new THREE.MeshStandardMaterial({ color: "#d9c58f", roughness: 0.5, transparent: true, opacity: 0.78, depthWrite: false, side: THREE.DoubleSide });
  const pw = iw + MIR.paper, pTop = MIR.cy + pw, pBot = y0 + MIR.frame - MIR.paper, big = archPoints(pw, pBot, MIR.cy, 24), tapes = [];
  const tapeMesh = (x, y, rot, i) => { const t = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.024), tapeM); t.position.set(x, y, 0.004); t.rotation.z = rot * DEG; t.userData.steam = true; t.castShadow = false; sheet.add(t); return t; };
  tapes.push(tapeMesh(-0.17, 0.30, 38), tapeMesh(0.17, 0.30, -38), tapeMesh(-0.236, 0.02, 90));
  const tape4 = tapeMesh(0.17, 0, 14); tapes.push(tape4);
  let paper = null, lastC = null;
  function setCover(c) {
    if (paper) { sheet.remove(paper); paper.geometry.dispose(); paper = null; }
    sheet.visible = c > 0.004; if (c <= 0.004) return;
    const yb = pTop - PAPER_H * c, pts = [];
    // clip the outline to y >= yb (Sutherland-Hodgman against one line), then sag the bottom edge by hashed 4 mm
    for (let i = 0; i < big.length; i++) {
      const a = big[i], b = big[(i + 1) % big.length], ain = a[1] >= yb, bin = b[1] >= yb;
      if (ain) pts.push(a);
      if (ain !== bin) { const t = (yb - a[1]) / (b[1] - a[1]); pts.push([a[0] + (b[0] - a[0]) * t, yb]); }
    }
    const poly = pts.map(([x, y], i) => (Math.abs(y - yb) < 1e-6 ? [x, y - 0.004 * (0.5 + 0.5 * Math.sin(x * 21 + 1.3)) - 0.002 * rnd(i + 31)] : [x, y]));
    const g = new THREE.ShapeGeometry(shapeOf(poly), 12), uvs = g.attributes.uv, ps = g.attributes.position;
    for (let i = 0; i < ps.count; i++) uvs.setXY(i, (ps.getX(i) + pw) / (2 * pw), (ps.getY(i) - pBot) / (pTop - pBot));
    paper = mesh(g, pm, sheet); paper.castShadow = false;
    tape4.position.set(wallmirrorTape(c)[0], wallmirrorTape(c)[1], 0.004);
  }
  return {
    grip: 0,
    apply(ps) {
      const c = clamp(ps.cover ?? S.cover ?? 0), r = clamp(ps.reflect ?? S.reflect ?? 0), key = c + "|" + r; if (key === lastC) return; lastC = key;
      setCover(c); rm.opacity = REFLECT_OPACITY.mirror * r; refl.visible = r > 0.004;
    },
  };
}

export const SCORE_ITEMS_KINDS = { hillbench, kettle, wallmirror, reflectcard };
