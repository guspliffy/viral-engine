import * as THREE from "three";
import { clamp, lerp, EASE } from "./util.js";
import { mat, mesh, smooth } from "./props-trend.js";

// "Your broke friend can copy money. There's a catch." (There's a catch, episode 4, 10 Nov 2026): the money. Jonny's
// eight panels (storyboard-eight-panels.png: 02 the coins, 04 the wallets, 05-08 the notes and bundles) stand on these
// props. Metres, origin on the ground (bottom centre) unless said, front +z, every param 0..1 unless said. Params arrive
// as prop tweens (`set`); a param that propState (props3d.js) has no default for (flat, shine, n, build, grow) reads
// spec.<name> until a tween sets it, and the first tween of such a key JUMPS: seed it with a dur-0 `set` at time 0, then
// tween. The prop's own `scale` (every prop has it) scales all of it. Nothing here is a real currency: a note carries
// only a potato emblem (no text, no numbers).
// Shared look: note green #7fae6a, border #4f7f4a, a cream oval with a golden potato and a green two-leaf sprout; paper
// bands cream #f3ead2; gold #f2c230. `noteTexture()` (exported) returns a new THREE.CanvasTexture of one note face, 2:1
// (512 x 256, long side along u), drawn once and shared by every kind here, so other files can reuse the same note.
//   coin        a gold coin, r 0.085 (fixed, not spec.r), 0.016 thick, a raised rim, a ring and the potato in relief on both
//               faces. Origin: its CENTRE; it stands on edge, a face to +z. Params: flat (0, 1 lies it face up, still about
//               its centre: stand its centre 0.008 above the surface), shine (0, 1: a gold glow halo, an additive 4-point
//               star at its top right and a warm glow on the gold; see-through for the checks, userData.steam), spin
//               (degrees about y; propState default spec.spin).
//               HELD: MONEY_GRIPS.coin.pinch = [0, -0.085, 0], the rim's bottom point: a glove pinches it there with the
//               thumb in front (grips.mjs thin hold, SIZE.coin: len -0.1417 makes its default from 0.6 land there).
//   cashbrick   three banded bundles side by side, 0.34 wide (x) x 0.2 deep (z) x 0.11 tall: each bundle a stack of notes
//               (note edges on the sides, the note face on top, its long side along z) with one cream band across carrying
//               the potato. Origin: bottom centre. Param squash (0..1, propState default 0): 8 % flatter and 6 % wider.
//               HELD: MONEY_GRIPS.cashbrick.top = [0, 0.11, 0], the middle of its top face: one glove lies flat on it and
//               carries it from above, fingers over the front edge (grips.rest(.., top: 0.11) pins a palm there).
//   cashthrone  an armchair of cash bricks facing +z: spec.w 1.25 (arms outside to outside), spec.d 1.0, spec.seat 0.42 (the
//               seat's top: use `sit` with seat: <id>), spec.back 1.7 (top of the backrest), arms 0.68 high and 0.22 wide, the
//               seat 0.81 wide and 0.6 deep. Origin: the floor under the middle of the SEAT (the back is behind it, the arms'
//               fronts 0.08 ahead of it). The backrest is stepped like a crown (5 columns of bricks, the middle the highest),
//               one gold coin (r 0.12) on its front as the jewel, loose notes and coins round the foot. Param build 0..1:
//               the bricks stack up from the floor row by row, each with a little overshoot (0 nothing, 1 complete; below
//               0.15 only a low pile of bricks shows; the jewel and the loose money pop in last). Solid (real meshes).
//   banknote    one note standing on its short edge: 0.1 wide (x), 0.2 tall (y), a little curled, the face to +z and to -z.
//               Origin: the middle of its bottom edge. HELD: the thin pinch near its bottom edge (grips.mjs SIZE.banknote).
//   walletheap  (spec.look "cash": banded bundles of banknotes in place of the wallets, same sizes and motion) spec.n (100: a number above 1 is the count; or spec.count) brown wallets (the diner wallet's look, 0.12 x 0.085
//               x 0.02, a little colour variety from a hash) heaped in a potato's arms: a wide fan of three layers standing like
//               a hand of cards plus a leaning tower of wallets laid flat above it, 0.9 wide, 0.95 tall, 0.35 deep. Origin:
//               bottom centre of the heap (the generator puts it at the holder's chest, y about 0.3). Params: n 0..1 (how many
//               have popped in, bottom to top, each with a small bounce; spec.n 0..1 is its start), spill 0..1 (propState
//               default 0: the heap bursts forward, every wallet flies its own arc to a point on the floor in a fan 2.2 wide
//               and 0.6 to 2.4 m in front, +z, tumbling, and lies flat at 1; the floor is spec.floor metres below the origin,
//               default the prop's y), wobble (degrees: the tower sways). One InstancedMesh (so not solid for the checks).
//   cashheap    a loose mound of notes and a few bundles: spec.w 0.6, spec.d 0.5, spec.h 0.36 at grow 1. Param grow 0..1 raises
//               it from nothing, the notes sliding down its sides from the top. Instanced note cards, each a little bent,
//               over a pale dome (solid); five bundles sit on it from grow 0.6.
// Never solid: the coin's glow (userData.steam).
export const MONEY = { coin: { r: 0.085, t: 0.016 }, brick: { w: 0.34, d: 0.2, h: 0.11 }, throne: { w: 1.25, d: 1.0, seat: 0.42, back: 1.7 }, wallet: { w: 0.12, h: 0.085, t: 0.02 }, heap: { w: 0.6, d: 0.5, h: 0.36 } };
// props3d.js reads GRIPS from here (Object.assign(GRIPS, MONEY_GRIPS)); a generator can pass the point itself meanwhile
export const MONEY_GRIPS = {
  coin: { pinch: [0, -MONEY.coin.r, 0] },
  cashbrick: { top: [0, MONEY.brick.h, 0] },
};

const DEG = Math.PI / 180;
const C = { green: "#7fae6a", border: "#4f7f4a", cream: "#f3ead2", gold: "#f2c230", potato: "#e9a93a", sprout: "#5aa23a" };
// a pure hash of an index (and a channel): the only source of variety
const hash = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const back = EASE.back;   // 0 -> 1 with a 10 % overshoot
const par = (ps, S, k, d) => ps[k] ?? S[k] ?? d;

// ------------------------------------------------------------------------------------------------ canvases
const cvs = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; };
const toTex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

// the potato emblem: a golden potato with eyes and a two-leaf sprout, centred on (cx, cy), about 1.25 s tall
function drawPotato(g, cx, cy, s) {
  g.save(); g.translate(cx, cy); g.scale(s, s); g.lineJoin = "round"; g.lineCap = "round";
  g.fillStyle = C.potato; g.strokeStyle = "#8f5f18"; g.lineWidth = 0.07;
  g.beginPath(); g.ellipse(0, 0.1, 0.5, 0.56, 0.28, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = "rgba(255,225,140,0.85)"; g.beginPath(); g.ellipse(-0.17, -0.02, 0.13, 0.2, 0.5, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#a8741f";
  for (const [x, y] of [[0.13, 0.14], [-0.1, 0.32], [0.22, 0.38]]) { g.beginPath(); g.ellipse(x, y, 0.055, 0.037, 0.3, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = "#3f7a2a"; g.lineWidth = 0.06; g.beginPath(); g.moveTo(0.09, -0.4); g.lineTo(0.11, -0.56); g.stroke();
  g.fillStyle = C.sprout; g.strokeStyle = "#2f6a22"; g.lineWidth = 0.04;
  for (const sx of [-1, 1]) { g.save(); g.translate(0.11, -0.56); g.rotate(sx * 0.6); g.beginPath(); g.ellipse(sx * 0.17, -0.03, 0.2, 0.09, 0, 0, Math.PI * 2); g.fill(); g.stroke(); g.restore(); }
  g.restore();
}
// one banknote face, 512 x 256
const drawNote = (g, w, h) => {
  g.fillStyle = C.border; g.fillRect(0, 0, w, h);
  g.fillStyle = C.green; g.fillRect(10, 10, w - 20, h - 20);
  g.save(); g.beginPath(); g.rect(10, 10, w - 20, h - 20); g.clip();
  g.strokeStyle = "rgba(255,255,255,0.12)"; g.lineWidth = 1.5;
  for (let i = -h; i < w; i += 9) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); }
  g.strokeStyle = "rgba(40,90,40,0.18)"; g.lineWidth = 2;
  for (let k = 0; k < 3; k++) { g.beginPath(); for (let x = 10; x <= w - 10; x += 4) { const y = 38 + k * 90 + Math.sin(x * 0.05 + k) * 10; if (x === 10) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke(); }
  g.restore();
  g.strokeStyle = "#b9d9a2"; g.lineWidth = 4; g.strokeRect(24, 24, w - 48, h - 48);
  for (const [cx, cy] of [[58, 58], [w - 58, 58], [58, h - 58], [w - 58, h - 58]]) {
    g.fillStyle = "#a8cf94"; g.strokeStyle = C.border; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, 24, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = C.cream; g.beginPath(); g.arc(cx, cy, 9, 0, Math.PI * 2); g.fill();
  }
  // "100" left and right of the emblem (Jonny 10 Nov: he copies 100 $ bills): a play note's number, no real currency
  g.fillStyle = "#2f6a2c"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `900 66px "DejaVu Sans Condensed","Arial Narrow","Liberation Sans Narrow",Arial,sans-serif`;
  for (const x of [93, w - 93]) g.fillText("100", x, h / 2 + 4, 120);
  g.fillStyle = C.cream; g.strokeStyle = C.border; g.lineWidth = 7; g.beginPath(); g.ellipse(w / 2, h / 2, 96, 92, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.strokeStyle = "#d8c9a0"; g.lineWidth = 3; g.beginPath(); g.ellipse(w / 2, h / 2, 86, 82, 0, 0, Math.PI * 2); g.stroke();
  drawPotato(g, w / 2, h / 2 + 4, 70);
};
let NOTE_CANVAS = null;
const noteCanvas = () => NOTE_CANVAS || (NOTE_CANVAS = cvs(512, 256, drawNote));
// the one note face, shared by every kind here (and other files): a new texture each call over one drawn canvas
export function noteTexture() { return toTex(noteCanvas()); }

// the cream paper band with a border line and the emblem, w x h px
const bandCanvas = (w, h) => cvs(w, h, (g) => {
  g.fillStyle = C.cream; g.fillRect(0, 0, w, h); g.strokeStyle = "#cdbd91"; g.lineWidth = 4; g.strokeRect(5, 5, w - 10, h - 10);
  drawPotato(g, w / 2, h / 2 + 2, Math.min(w, h) * 0.72);
});
// the edge of a stack of notes (alternating pale and green sheets), 256 x 128; kind: "plain", "long" (the end of a brick
// of three bundles: dividing lines at the thirds), "end" (the long side of a bundle: a cream band round the middle)
const edgeCanvas = (kind) => cvs(256, 128, (g, w, h) => {
  const n = 14, sh = h / n;
  for (let i = 0; i < n; i++) {
    const t = hash(i, 5); g.fillStyle = t < 0.45 ? "#eef1da" : t < 0.8 ? "#c7dcae" : "#a3c78a"; g.fillRect(0, i * sh, w, sh + 0.5);
    g.fillStyle = "rgba(40,90,40,0.3)"; g.fillRect(0, i * sh, w, 1.4);
  }
  if (kind === "long") { g.fillStyle = C.border; for (const x of [w / 3, (2 * w) / 3]) g.fillRect(x - 2.5, 0, 5, h); }
  if (kind === "end") { g.drawImage(bandCanvas(Math.round(w * 0.3), h), Math.round(w * 0.35), 0, Math.round(w * 0.3), h); }
});
// the top of a brick of three bundles: three notes (long side along v) with a band across each, 768 x 512
const brickTopCanvas = () => cvs(768, 512, (g) => {
  for (let i = 0; i < 3; i++) {
    g.save(); g.translate(i * 256 + 256, 0); g.rotate(Math.PI / 2); g.drawImage(noteCanvas(), 0, 0, 512, 256); g.restore();
    g.drawImage(bandCanvas(256, 166), i * 256, 173, 256, 166);
  }
  g.strokeStyle = "rgba(40,70,40,0.5)"; g.lineWidth = 3; for (const x of [256, 512]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
});
// the textures the bricks share (made on first use, then kept)
let TEX = null;
function tex() {
  if (TEX) return TEX;
  const rot = (c) => cvs(c.height, c.width, (g, w) => { g.translate(w, 0); g.rotate(Math.PI / 2); g.drawImage(c, 0, 0); });   // a note's long side along v
  TEX = {
    noteTop: toTex(rot(noteCanvas())), plain: toTex(edgeCanvas("plain")), long: toTex(edgeCanvas("long")), end: toTex(edgeCanvas("end")), brickTop: toTex(brickTopCanvas()),
    bandTop: toTex(bandCanvas(384, 168)), bandSide: toTex(bandCanvas(120, 256)), note: toTex(noteCanvas()),
  };
  return TEX;
}
const tm = (map, o = {}) => mat("#ffffff", { map, roughness: 0.85, ...o });
const GOLD = (o = {}) => mat(C.gold, { metalness: 0.8, roughness: 0.3, ...o });

// ------------------------------------------------------------------------------------------------ glows (additive)
const glowy = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
function glowMat(vs, fs, uniforms, test = true) {
  const m = new THREE.ShaderMaterial({ uniforms, vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, depthTest: test, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  m.toneMapped = false; m.userData.noOutline = true; m.userData.outlineParameters = { visible: false };
  return m;
}
const BILL_VS = `uniform float uSize; varying vec2 vP; void main() { vP = position.xy * 2.0; float k = length(modelMatrix[0].xyz); vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); mv.xy += position.xy * uSize * k; gl_Position = projectionMatrix * mv; }`;
const HALO_FS = `uniform float uA; varying vec2 vP; void main() { float f = 1.0 - smoothstep(0.0, 1.0, length(vP)); f *= f; gl_FragColor = vec4(mix(vec3(1.0, 0.72, 0.2), vec3(1.0, 0.95, 0.6), f * f), f * uA); }`;
const STAR_FS = `uniform float uA; varying vec2 vP; void main() {
  vec2 p = abs(vP); float d = pow(p.x, 0.5) + pow(p.y, 0.5);
  float st = clamp(1.0 - d, 0.0, 1.0), core = clamp(1.0 - length(vP) * 3.2, 0.0, 1.0), I = st * st * 1.7 + core * core;
  gl_FragColor = vec4(vec3(1.0, 0.96, 0.78), clamp(I, 0.0, 1.0) * uA); }`;

// ------------------------------------------------------------------------------------------------ the coin
// builds a coin of r 0.085 centred on `parent` (face to +z); returns the gold material (for the shine's warm glow)
function buildCoin(parent, gold) {
  const R = MONEY.coin.r, prof = [[0.0001, -0.0055], [0.07, -0.0055], [0.0725, -0.008], [0.0835, -0.008], [R, -0.0065], [R, 0.0065], [0.0835, 0.008], [0.0725, 0.008], [0.07, 0.0055], [0.0001, 0.0055]].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.LatheGeometry(prof, 48); body.rotateX(Math.PI / 2);
  mesh(body, gold, parent);
  const emb = mat("#d48a14", { metalness: 0.55, roughness: 0.38 }), embLeaf = mat("#8fbf3a", { metalness: 0.2, roughness: 0.5 }), dent = mat("#8a5a0c", { metalness: 0.3, roughness: 0.6 });
  const potato = new THREE.Shape(); potato.absellipse(0, 0, 0.031, 0.038, 0, Math.PI * 2, false, 0);
  const leaf = new THREE.Shape(); leaf.absellipse(0, 0, 0.0145, 0.0068, 0, Math.PI * 2, false, 0);
  const ex = (s, d) => new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: 0.0007, bevelSize: 0.0007, bevelSegments: 1, curveSegments: 18 });
  const potatoG = ex(potato, 0.0028); potatoG.rotateZ(0.3); potatoG.translate(0, -0.006, 0);
  const leafG = ex(leaf, 0.0022);
  for (const s of [1, -1]) {
    const face = new THREE.Group(); face.position.z = s * 0.0055; face.rotation.y = s > 0 ? 0 : Math.PI; parent.add(face);
    mesh(potatoG, emb, face);
    for (const lx of [-1, 1]) { const l = mesh(leafG, embLeaf, face, lx * 0.0145, 0.0405, 0); l.rotation.z = lx * 0.5; l.castShadow = false; }
    for (const [x, y] of [[0.006, -0.002], [-0.009, -0.016], [0.013, -0.014]]) { const d = mesh(new THREE.CircleGeometry(0.0034, 10), dent, face, x, y, 0.0035); d.castShadow = false; }
    const ring = mesh(new THREE.TorusGeometry(0.0615, 0.0022, 6, 48), gold, face, 0, 0, 0.0004); ring.castShadow = false;
  }
}

// ------------------------------------------------------------------------------------------------ bundles and bricks
// one bundle of notes (w x d x h; origin its bottom centre, the note's long side along z) with a cream band across it
function bundle(parent, x, w, d, h) {
  const T = tex(), g = new THREE.Group(); g.position.x = x; parent.add(g);
  const side = tm(T.plain), top = tm(T.noteTop);
  mesh(new THREE.BoxGeometry(w, h, d), [side, side, top, tm(T.plain), side, side], g, 0, h / 2, 0);
  const bw = 0.05, bm = tm(T.bandSide), bt = tm(T.bandTop), bp = mat(C.cream, { roughness: 0.8 });
  mesh(new THREE.BoxGeometry(w + 0.004, h + 0.004, bw), [bm, bm, bt, bp, bp, bp], g, 0, h / 2, 0);
  return g;
}
// three bundles side by side: the cash brick (w x d x h), origin its bottom centre
function brickOfBundles(parent) {
  const { w, d, h } = MONEY.brick, g = new THREE.Group(); parent.add(g);
  const bw = (w - 0.008) / 3;
  for (const i of [-1, 0, 1]) bundle(g, i * (bw + 0.004), bw, d, h);
  return g;
}

export const MONEY_KINDS = {
  // ---------------------------------------------------------------------------------------------- coin
  coin(P) {
    const S = P.spec, R = MONEY.coin.r, gold = GOLD({ emissive: new THREE.Color("#ffb420"), emissiveIntensity: 0 });
    const piv = new THREE.Group(); piv.rotation.order = "YXZ"; P.whole.add(piv);
    buildCoin(piv, gold);
    // the shine: a halo behind it and a 4-point star at its top right (camera-facing, additive, see-through for the checks)
    const haloM = glowMat(BILL_VS, HALO_FS, { uSize: { value: 0.5 }, uA: { value: 0 } }), starM = glowMat(BILL_VS, STAR_FS, { uSize: { value: 0.26 }, uA: { value: 0 } }, false);
    const halo = glowy(mesh(new THREE.PlaneGeometry(1, 1), haloM, P.whole, 0, 0, 0), 3), star = glowy(mesh(new THREE.PlaneGeometry(1, 1), starM, P.whole, R * 0.78, R * 0.78, 0.02), 4);
    return {
      grip: 0,
      apply(ps) {
        const flat = clamp(par(ps, S, "flat", 0)), sh = clamp(par(ps, S, "shine", 0));
        piv.rotation.set(-flat * Math.PI / 2, (ps.spin ?? 0) * DEG, 0);
        halo.visible = star.visible = sh > 0.01;
        haloM.uniforms.uA.value = 0.85 * sh; haloM.uniforms.uSize.value = 0.34 + 0.2 * sh;
        starM.uniforms.uA.value = clamp(sh * 1.6); starM.uniforms.uSize.value = 0.09 + 0.17 * sh;
        gold.emissiveIntensity = 0.5 * sh;
      },
    };
  },

  // ---------------------------------------------------------------------------------------------- cashbrick
  cashbrick(P) {
    const g = brickOfBundles(P.whole), H = MONEY.brick.h;
    return {
      grip: H,
      apply(ps) {
        const q = clamp(ps.squash ?? 0);
        g.scale.set(1 + 0.06 * q, 1 - 0.08 * q, 1 + 0.06 * q);
      },
    };
  },

  // ---------------------------------------------------------------------------------------------- banknote
  banknote(P) {
    const T = tex();
    for (const back of [0, 1]) {
      const g = new THREE.PlaneGeometry(0.1, 0.2, 1, 8), pa = g.attributes.position;
      for (let i = 0; i < pa.count; i++) { const y = pa.getY(i) / 0.1; pa.setZ(i, (back ? -1 : 1) * 0.008 * y * y); }
      g.computeVertexNormals(); g.translate(0, 0.1, back ? 0.0006 : 0); if (back) g.rotateY(Math.PI);
      mesh(g, mat("#ffffff", { map: T.noteTop, roughness: 0.85 }), P.whole);
    }
    return { grip: 0, apply() {} };
  },

  // ---------------------------------------------------------------------------------------------- cashthrone
  cashthrone(P) {
    const S = P.spec, T = tex(), W = S.w ?? 1.25, D = S.d ?? 1.0, SEAT = S.seat ?? 0.42, BACK = S.back ?? 1.7;
    const ARMW = 0.22, ARMH = 0.68, SEATD = 0.6, FRONT = SEATD / 2 + 0.08, BACKD = D - (SEATD / 2 + FRONT), Z0 = -SEATD / 2 - BACKD;
    // one brick: three bundles side by side (0.25 x 0.1 x 0.16), the same look as the cash brick; shared by every brick
    const BL = 0.25, BH = 0.1, BW = 0.16;
    const geo = new THREE.BoxGeometry(BL, BH, BW), bot = tm(T.plain);
    const mats = [tm(T.end), tm(T.end), tm(T.brickTop), bot, tm(T.long), tm(T.long)];
    const bricks = [];
    // fill a block of the chair with bricks: its box, which way the bricks run, how many across, how many rows
    const fillBlock = (x0, x1, z0, z1, y0, y1, along, nl, nw, rows, hollow, seed) => {
      const lenA = along === "x" ? x1 - x0 : z1 - z0, widA = along === "x" ? z1 - z0 : x1 - x0, cl = lenA / nl, cw = widA / nw, hr = (y1 - y0) / rows;
      for (let r = 0; r < rows; r++) for (let i = 0; i < nl; i++) for (let j = 0; j < nw; j++) {
        if (hollow && r < rows - 1 && i > 0 && i < nl - 1 && j > 0 && j < nw - 1) continue;
        const k = bricks.length + seed, u = x0 + (along === "x" ? (i + 0.5) * cl : (j + 0.5) * cw), v = z0 + (along === "x" ? (j + 0.5) * cw : (i + 0.5) * cl);
        bricks.push({ x: u + (hash(k, 1) - 0.5) * 0.008, y: y0 + (r + 0.5) * hr, z: v + (hash(k, 2) - 0.5) * 0.008, ry: (along === "x" ? 0 : Math.PI / 2) + (hash(k, 3) - 0.5) * 0.05, s: [cl / BL, hr / BH * 0.985, cw / BW], key: y0 + r * hr + hash(k, 4) * 0.03 });
      }
    };
    // the seat block (ring of bricks, a full top row), two arms, and the backrest's five columns (the crown)
    fillBlock(-W / 2 + ARMW, W / 2 - ARMW, -SEATD / 2, SEATD / 2, 0, SEAT, "x", 3, 4, 4, true, 0);
    for (const sx of [-1, 1]) fillBlock(sx > 0 ? W / 2 - ARMW : -W / 2, sx > 0 ? W / 2 : -W / 2 + ARMW, -SEATD / 2, FRONT, 0, ARMH, "z", 3, 1, 6, false, 100 + sx * 50);
    const colH = [0.765, 0.882, 1, 0.882, 0.765].map((f) => Math.round((BACK * f) / BH));
    colH.forEach((rows, c) => fillBlock(-W / 2 + c * (W / 5), -W / 2 + (c + 1) * (W / 5), Z0, -SEATD / 2, 0, rows * BH, "x", 1, 2, rows, false, 300 + c * 40));
    const order = bricks.map((b, i) => i).sort((a, b) => bricks[a].key - bricks[b].key);
    const N = bricks.length;
    order.forEach((i, rank) => { bricks[i].t0 = 0.15 + (rank / (N - 1)) * 0.78; });
    for (const b of bricks) { const o = new THREE.Mesh(geo, mats); o.castShadow = o.receiveShadow = true; o.rotation.y = b.ry; P.whole.add(o); b.o = o; }
    // the low pile (build below 0.15): nine bricks heaped on the floor over the seat's place
    const pile = [[-0.2, 0.05, 0.0, 0.2], [0.03, 0.05, -0.04, 1.7], [0.24, 0.05, 0.03, 0.4], [-0.08, 0.05, 0.19, 1.3], [0.16, 0.05, 0.2, 2.5], [-0.12, 0.145, 0.04, 0.9], [0.1, 0.145, 0.08, 2.1], [0.0, 0.24, 0.07, 0.5], [-0.3, 0.05, -0.2, 1.1]].map(([x, y, z, ry], i) => {
      const o = new THREE.Mesh(geo, mats); o.castShadow = o.receiveShadow = true; o.rotation.y = ry; P.whole.add(o); return { o, x, y, z, ry, i };
    });
    // the jewel: a gold coin (r 0.12) on the crown's front, and loose notes and coins round the foot
    const jewelS = 0.12 / MONEY.coin.r, jewel = new THREE.Group(); jewel.position.set(0, BACK - 0.19, -SEATD / 2 + 0.008 * jewelS + 0.006); P.whole.add(jewel);
    const jc = new THREE.Group(); jewel.add(jc); jc.scale.setScalar(jewelS); buildCoin(jc, GOLD());
    const loose = [];
    const noteM = [tm(T.plain), tm(T.plain), tm(T.note), tm(T.plain), tm(T.plain), tm(T.plain)];
    [[-0.85, 0.2], [0.82, 0.35], [-0.76, 0.58], [0.95, 0.02], [0.7, 0.62], [-0.98, -0.3]].forEach(([x, z], i) => {
      const o = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.0018, 0.1), noteM); o.castShadow = false; o.receiveShadow = true; P.whole.add(o);
      loose.push({ o, x, y: 0.0012 + i * 0.0003, z, ry: hash(i, 7) * 6.28, s: 1 });
    });
    [[-0.66, 0.42], [0.62, 0.18], [-0.93, 0.02], [0.86, 0.5]].forEach(([x, z], i) => {
      const gr = new THREE.Group(); P.whole.add(gr); const cg = new THREE.Group(); cg.scale.setScalar(0.6); gr.add(cg); buildCoin(cg, GOLD());
      cg.rotation.x = -Math.PI / 2; cg.position.y = 0.0048;
      loose.push({ o: gr, x, y: 0, z, ry: hash(i, 9) * 6.28, s: 1 });
    });
    const place = (o, x, y, z, ry, s) => { o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(Math.max(s, 0.0001)); o.visible = s > 0.001; };
    return {
      grip: SEAT,
      apply(ps) {
        const b = clamp(par(ps, S, "build", 1));
        for (const k of bricks) {
          const u = clamp((b - k.t0) / 0.07), s = u <= 0 ? 0 : back(u);
          k.o.visible = u > 0; k.o.position.set(k.x, k.y + (1 - Math.min(u, 1)) * 0.05, k.z); k.o.scale.set(k.s[0] * s, k.s[1] * s, k.s[2] * s);
        }
        // the pile rises in the first tenth, then the rows swallow it between 0.15 and 0.2
        for (const p of pile) {
          const up = clamp((b - p.i * 0.009) / 0.03), down = 1 - smooth(clamp((b - 0.15) / 0.05)), s = (up <= 0 ? 0 : back(up)) * down;
          p.o.visible = s > 0.001; p.o.position.set(p.x, p.y, p.z); p.o.rotation.y = p.ry; p.o.scale.setScalar(Math.max(s, 0.0001));
        }
        const uj = clamp((b - 0.9) / 0.07), sj = uj <= 0 ? 0 : back(uj);
        jewel.visible = sj > 0.001; jewel.scale.setScalar(Math.max(sj, 0.0001));
        loose.forEach((l, i) => { const u = clamp((b - 0.92 - i * 0.006) / 0.07), s = u <= 0 ? 0 : back(u); place(l.o, l.x, l.y, l.z, l.ry, s); });
      },
    };
  },

  // ---------------------------------------------------------------------------------------------- walletheap
  walletheap(P) {
    const S = P.spec, { w: WW, h: WH, t: WT } = MONEY.wallet;
    const N = Math.round(S.count ?? (S.n > 1 ? S.n : 100));
    // one wallet (the diner's look: brown leather, a darker spine, stitching, a flap and a gold snap), vertex colours
    const parts = [];
    const add = (g, col, x = 0, y = 0, z = 0) => {
      g.translate(x, y, z); const c = new THREE.Color(col), n = g.attributes.position.count, a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
      g.setAttribute("color", new THREE.BufferAttribute(a, 3)); parts.push(g);
    };
    // look "cash": every item is a banded bundle of banknotes instead of a wallet (Jonny 10 Nov: he copies money, not wallets)
    const cash = S.look === "cash";
    if (cash) {
      add(new THREE.BoxGeometry(WW, WH, WT), "#8fc27a");
      add(new THREE.BoxGeometry(WW + 0.0016, WH * 0.9, WT * 0.5), "#eef1da");
      add(new THREE.BoxGeometry(WW * 0.24, WH + 0.002, WT + 0.002), C.cream);
      for (const sz of [1, -1]) for (const x of [-WW * 0.32, WW * 0.32]) add(new THREE.BoxGeometry(WW * 0.2, WH * 0.5, 0.0012), "#4f7f4a", x, 0, sz * (WT / 2 + 0.0006));
    } else add(new THREE.BoxGeometry(WW, WH, WT), "#7a4a26");
    if (!cash) add(new THREE.BoxGeometry(0.009, WH, WT + 0.0012), "#4e2c14", -WW / 2 + 0.0045, 0, 0);
    if (!cash) for (const sz of [1, -1]) {
      const z = sz * (WT / 2 + 0.0006);
      add(new THREE.BoxGeometry(WW * 0.86, WH * 0.3, 0.0012), "#9a6236", 0.004, WH * 0.2, z);
      for (const y of [WH * 0.42, -WH * 0.42]) add(new THREE.BoxGeometry(WW * 0.88, 0.0016, 0.0014), "#e0c28a", 0.004, y, z + sz * 0.0006);
      for (const x of [-WW * 0.42 + 0.01, WW * 0.44]) add(new THREE.BoxGeometry(0.0016, WH * 0.84, 0.0014), "#e0c28a", x, 0, z + sz * 0.0006);
      const sn = new THREE.CylinderGeometry(0.0065, 0.0065, 0.003, 12); sn.rotateX(Math.PI / 2); add(sn, "#d8b04a", 0.03, WH * 0.05, z + sz * 0.0012);
    }
    const geo = mergeGeo(parts);
    const m = mat("#ffffff", { roughness: 0.75 }); m.vertexColors = true;
    const im = new THREE.InstancedMesh(geo, m, N); im.frustumCulled = false; im.castShadow = true; im.receiveShadow = true; P.whole.add(im);
    // the layout: a fan of three layers (a hand of cards) and a tower of wallets laid flat, two per layer, turned a
    // quarter every layer; each item has its final place, a start for the spill and a hash for its own arc
    const F = Math.round(N * 0.52), items = [], cnt = [Math.ceil(F / 3), Math.ceil((F - Math.ceil(F / 3)) / 2), 0]; cnt[2] = F - cnt[0] - cnt[1];
    const RAD = [0.47, 0.42, 0.37], ZL = [-0.12, 0, 0.12];
    cnt.forEach((c, l) => { for (let j = 0; j < c; j++) {
      const th = (-68 + (136 * j) / Math.max(c - 1, 1) + (hash(items.length, 1) - 0.5) * 4) * DEG, mid = c / 2 - Math.abs(j - (c - 1) / 2);
      // an arc flatter than a circle (a third lower than wide), each wallet along its normal
      const ex = RAD[l], ey = RAD[l] * 0.62, ph = Math.atan2(Math.sin(th) / ex, Math.cos(th) / ey);
      items.push({ x: ex * Math.sin(th), y: ey * Math.cos(th), z: ZL[l] + mid * 0.004, rx: (hash(items.length, 2) - 0.5) * 0.06, ry: (hash(items.length, 3) - 0.5) * 0.08, rz: Math.PI / 2 - ph, tower: 0 });
    } });
    const TN = N - F, TL = Math.ceil(TN / 2), TY0 = 0.38;
    for (let k = 0; k < TN; k++) {
      const layer = Math.floor(k / 2), side = k % 2 ? 1 : -1, quarter = layer % 2, f = layer / Math.max(TL - 1, 1), lean = 0.2 * f * f + (hash(layer, 5) - 0.5) * 0.012;
      const off = side * 0.062 + (hash(k, 6) - 0.5) * 0.008, jit = (hash(k, 8) - 0.5) * 0.012;
      items.push({ x: (quarter ? jit : off) + 0.2 + lean, y: TY0 + layer * (0.0225 + hash(layer, 4) * 0.001), z: -0.03 + (quarter ? off : jit), rx: -Math.PI / 2, ry: (quarter ? Math.PI / 2 : 0) + (hash(k, 9) - 0.5) * 0.14, rz: 0, tower: f + 0.0001 });
    }
    items.forEach((it, i) => { it.i = i; it.h = [hash(i, 11), hash(i, 12), hash(i, 13), hash(i, 14)]; });
    const rankOf = items.map((it, i) => i).sort((a, b) => items[a].y - items[b].y + (hash(a, 15) - hash(b, 15)) * 0.01);
    rankOf.forEach((i, r) => { items[i].t0 = (r / Math.max(N - 1, 1)) * 0.8; });
    const tint = new THREE.Color();
    items.forEach((it, i) => { tint.setRGB(1 + (hash(i, 21) - 0.5) * 0.4, 1 + (hash(i, 22) - 0.5) * 0.32, 1 + (hash(i, 23) - 0.5) * 0.4); im.setColorAt(i, tint); });
    const dummy = new THREE.Object3D(); dummy.rotation.order = "YXZ";
    return {
      grip: 0,
      apply(ps) {
        const nP = clamp(ps.n ?? (S.n != null && S.n <= 1 ? S.n : 1)), sp = clamp(ps.spill ?? 0), wob = (ps.wobble ?? 0) * DEG;
        const floor = S.floor ?? S.y ?? 0.3;
        for (const it of items) {
          const u = clamp((nP - it.t0) / 0.2), s = u <= 0 ? 0 : back(u);
          let x = it.x, y = it.y + (1 - Math.min(back(clamp(u)), 1.2)) * -0.08, z = it.z, rx = it.rx, ry = it.ry, rz = it.rz;
          if (it.tower && wob) { const dy = it.y - TY0; x += dy * Math.tan(wob) * (0.4 + it.tower); rz -= wob * it.tower * 0.5; }
          if (sp > 0) {
            // its own arc to a spot on the floor in the fan in front: tumbling, flat at the end
            const d = it.h[0] * 0.3, k = clamp((sp - d) / (1 - d)), e = smooth(k), dist = 0.6 + it.h[1] * 1.8, tx = (it.h[2] - 0.5) * 2.2 * (0.35 + 0.65 * (dist - 0.6) / 1.8), fy = -floor + 0.011 + it.i * 0.00006;
            x = lerp(x, tx, e); z = lerp(z, dist, e); y = lerp(y, fy, k * k * (3 - 2 * k) * 0.35 + k * k * k * 0.65) + 4 * (0.35 + 0.6 * it.h[3]) * k * (1 - k);
            const turns = Math.round(it.h[3] * 4 - 2) * 2 * Math.PI;
            rx = lerp(rx, -Math.PI / 2 + turns, e); rz = lerp(rz, 0, e); ry = lerp(ry, it.h[0] * 6.28, e);
          }
          dummy.position.set(x, y, z); dummy.rotation.set(rx, ry, rz); dummy.scale.setScalar(Math.max(s, 0.0001)); dummy.updateMatrix(); im.setMatrixAt(it.i, dummy.matrix);
        }
        im.instanceMatrix.needsUpdate = true;
      },
    };
  },

  // ---------------------------------------------------------------------------------------------- cashheap
  cashheap(P) {
    const S = P.spec, T = tex(), A = (S.w ?? 0.6) / 2, Cz = (S.d ?? 0.5) / 2, Hh = S.h ?? 0.36, N = 120;
    // the pale dome under the notes (what shows between them, and what the checks take as solid)
    const dome = mesh(new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat("#8fbf7a", { roughness: 0.9 }), P.whole);
    // one bent note card: 0.2 x 0.1, curved along its length
    const ng = new THREE.PlaneGeometry(0.2, 0.1, 8, 1); const pa = ng.attributes.position;
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i) / 0.1; pa.setZ(i, 0.014 * x * x - 0.006 * pa.getY(i) / 0.05 * x); }
    ng.computeVertexNormals();
    const nm = mat("#ffffff", { map: T.note, roughness: 0.85, side: THREE.DoubleSide });
    const im = new THREE.InstancedMesh(ng, nm, N); im.frustumCulled = false; im.castShadow = true; im.receiveShadow = true; P.whole.add(im);
    const notes = Array.from({ length: N }, (_, i) => ({ i, phi: 0.12 + 1.5 * Math.sqrt(hash(i, 1)), th: i * 2.39996, d: hash(i, 2), yaw: hash(i, 3) * 6.28, tx: (hash(i, 4) - 0.5) * 0.22, ty: (hash(i, 5) - 0.5) * 0.22, lift: (i % 11) * 0.0013 }));
    // five bundles on the mound
    const bund = [[0.08, 0.2, 0.5], [0.6, 1.9, 2.4], [0.7, 4.2, 0.3], [0.55, 3.2, 1.6], [0.9, 0.5, 2.9]].map(([phi, th, yaw]) => {
      const g = new THREE.Group(); g.scale.setScalar(0.5); P.whole.add(g); brickOfBundles(g); return { g, phi, th, yaw };
    });
    const dummy = new THREE.Object3D(), q = new THREE.Quaternion(), qy = new THREE.Quaternion(), qt = new THREE.Quaternion(), up = new THREE.Vector3(0, 0, 1), nv = new THREE.Vector3(), ax = new THREE.Vector3(), yv = new THREE.Vector3(0, 0, 1);
    // a point on the ellipsoid at lat phi (0 the top) and angle th, and its outward normal
    const surf = (phi, th, s, out) => {
      const pc = Math.min(phi, Math.PI / 2), sx = Math.sin(pc) * Math.cos(th), sz = Math.sin(pc) * Math.sin(th), cy = Math.cos(pc);
      out.set(sx / (A * s + 1e-4), cy / (Hh * s + 1e-4), sz / (Cz * s + 1e-4)).normalize();
      return [A * s * sx * (phi > pc ? 1 + (phi - pc) * 0.6 : 1), Math.max(Hh * s * cy, 0.003), Cz * s * sz * (phi > pc ? 1 + (phi - pc) * 0.6 : 1)];
    };
    return {
      grip: 0,
      apply(ps) {
        const g = clamp(par(ps, S, "grow", 1)), sg = smooth(g);
        dome.visible = g > 0.01; dome.scale.set(A * sg * 0.96, Hh * sg * 0.9, Cz * sg * 0.96);
        for (const n of notes) {
          const vis = g > 0.03 + n.d * 0.3, e = smooth(clamp((g - 0.04 - n.d * 0.3) / 0.62)), phi = lerp(0.05, n.phi, e), pop = vis ? Math.min(1, (g - 0.03 - n.d * 0.3) / 0.08) : 0;
          const p = surf(phi, n.th, sg, nv);
          q.setFromUnitVectors(up, nv); qy.setFromAxisAngle(yv, n.yaw); q.multiply(qy);
          ax.set(Math.cos(n.yaw + 1), Math.sin(n.yaw + 1), 0); qt.setFromAxisAngle(ax, n.tx); q.multiply(qt);
          dummy.position.set(p[0] + nv.x * (0.004 + n.lift), p[1] + nv.y * (0.004 + n.lift), p[2] + nv.z * (0.004 + n.lift)); dummy.quaternion.copy(q);
          dummy.scale.setScalar(Math.max(smooth(clamp(pop)), 0.0001)); dummy.updateMatrix(); im.setMatrixAt(n.i, dummy.matrix);
        }
        im.instanceMatrix.needsUpdate = true;
        for (const b of bund) {
          const u = clamp((g - 0.6) / 0.25), s = u <= 0 ? 0 : back(u) * 0.5, p = surf(b.phi, b.th, sg, nv);
          b.g.visible = s > 0.001; b.g.position.set(p[0], p[1] - 0.012, p[2]);
          q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), nv); qy.setFromAxisAngle(new THREE.Vector3(0, 1, 0), b.yaw); q.multiply(qy); b.g.quaternion.copy(q); b.g.scale.setScalar(Math.max(s, 0.0001));
        }
      },
    };
  },
};

// merge boxes that share the same attributes into one geometry (every part indexed with position, normal, uv, color)
function mergeGeo(parts) {
  const geo = new THREE.BufferGeometry(), att = ["position", "normal", "uv", "color"], idx = [];
  let base = 0;
  for (const k of att) geo.setAttribute(k, new THREE.BufferAttribute(new Float32Array(parts.reduce((s, p) => s + p.attributes[k].array.length, 0)), parts[0].attributes[k].itemSize));
  const off = Object.fromEntries(att.map((k) => [k, 0]));
  for (const p of parts) {
    for (const k of att) { geo.attributes[k].array.set(p.attributes[k].array, off[k]); off[k] += p.attributes[k].array.length; }
    for (const i of p.index.array) idx.push(i + base);
    base += p.attributes.position.count;
  }
  geo.setIndex(idx); return geo;
}
