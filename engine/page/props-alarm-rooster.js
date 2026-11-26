// How you invented 01 "The alarm clock": the creatures (task C). Design: storyboards/series/how-you-invented/01-alarm-clock/DESIGN.md
// section 2.8; bench: .../bench/bench-rooster.mjs. Metres. Every mark (lock, barb, bar, scale, scallop) comes from a hash of its own
// index: no Math.random, no wall clock. Motion only from the keys below and the clip clock t that apply(ps, t) gets.
//
//   rooster  a real bird, origin on the floor between its feet, facing +z; 0.42 to the top of the comb, 0.17 wide, body 0.30 long,
//            the tail sickles 0.22 behind it up to 0.40. Small head (0.06 with the beak), a real eye (dark pupil in an amber ring, a skin
//            lid that closes), red face, 5-point comb, wattles, cream ear lobe, yellow beak with nostrils and a red tongue, ONE lofted
//            skin for body, neck and head, ~120 hackle locks (merged, #e08a2e to #f0b24a at the tips) over neck, shoulders and rump,
//            wings of coverts (barred) and flight feathers, 7 green tail sickles with a sheen line, scaled legs, toes, spurs. ~6 000 tris.
//            Keys (all 0..1, default 0, a spec value is the start value; a "prop" action tweens them once the kind's state is in
//            KIT_STATE, see ALARM_ROOSTER_STATE at the bottom):
//              crow   neck up 0.05, head back 35 deg, beak open 28 deg with a red tongue, chest +8 %, tail fanned 20 deg more; at 1 a
//                     shiver of 0.004 at 4 Hz from t (fades in from 0.85).
//              sleep  legs fold, body sinks 0.11, the head turns back onto its right shoulder, lids shut (from 0.3 to 0.75), a breath
//                     swell of 0.01 at 0.4 Hz from t. 0.35 = legs half tucked (the carried pose).
//              flap   wings spread, beating at 9 Hz from t while above 0 (the beat grows with the key).
//              walk   legs step (2.2 steps a second on t), body bobs, the head bobs forward and back. Move it with x, z tweens (about
//                     0.5 m/s matches the stride).
//              peek   neck 40 deg forward and down, head cocked 20 deg.
//              headY  -1..1 turns the head 75 deg each way (+1 toward +x, the bird's left).   lid 0..1 closes the lids alone.
//            Held: the box hold (grips.box, SIZE rooster { w 0.17, h 0.20, d 0.30 }): both gloves on its flanks at y 0.11 above the
//            origin, 0.13 from the axis; sleep 0.35. No spec keys besides the animation keys. Nothing is gripped by a point (grip 0).
//
//   fly      a house fly, twice life size on purpose: body 0.022 long, dark head with two dark red eyes, 2 wings 0.014 long, 6 legs.
//            Origin = the plane under its feet (the body is 0.009 above it), facing +z; move it with x, y, z tweens. Key buzz 0..1:
//            while above 0 the wings flip between two poses every frame (frame = round(t x 30)), the body trembles by 0.0004; at 0 the
//            wings lie folded flat over the back. ~130 tris.
//
// The bench drops each piece in its own group far from the next (bench-rooster.mjs).
import * as THREE from "three";
import { clamp } from "./util.js";
import { makeLoft } from "./geo.js";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; if (parent) parent.add(o); return o; }
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const memo = new Map();   // every drawn texture is made once per page (a pure function of its key)
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const C3 = (hex) => new THREE.Color(hex);
const tubeGeo = (pts, r, seg = 6, n = 0) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => V(...p))), n || Math.max(6, pts.length * 3), r, seg, false);
const cr4 = (a, b, c, d, f) => 0.5 * (2 * b + (c - a) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (3 * b - a - 3 * c + d) * f * f * f);

// ------------------------------------------------------------------------------------------------ ribbons
// n feather cards of one size (seg segments long, across 2 = flat or 3 = a raised middle) merged in ONE geometry whose points are
// rewritten by set(i, pts, hws, side, rise) and whose colours are fixed by colorAt(i, k along, a across -1..1).
function ribbons(n, seg, across, colorAt, material) {
  const rows = seg + 1, per = rows * across, pos = new Float32Array(n * per * 3), col = new Float32Array(n * per * 3), uv = new Float32Array(n * per * 2), idx = [];
  for (let i = 0; i < n; i++) {
    const b = i * per;
    for (let r = 0; r < rows; r++) for (let a = 0; a < across; a++) {
      const v = b + r * across + a, c = colorAt(i, r / seg, across > 1 ? (a / (across - 1)) * 2 - 1 : 0);
      col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b; uv[v * 2] = across > 1 ? a / (across - 1) : 0.5; uv[v * 2 + 1] = r / seg;
    }
    for (let r = 0; r < seg; r++) for (let a = 0; a < across - 1; a++) { const v00 = b + r * across + a, v10 = v00 + across; idx.push(v00, v00 + 1, v10 + 1, v00, v10 + 1, v10); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  const m = new THREE.Mesh(g, material); m.castShadow = true; m.frustumCulled = false;
  const T = V(), Nn = V(), tmp = V(), pts = Array.from({ length: rows }, () => V()), hw = new Array(rows).fill(0);
  const put = (i, pts_, hws, side, rise = 0) => {
    for (let r = 0; r < rows; r++) {
      const p = pts_[r], a0 = pts_[Math.max(0, r - 1)], a1 = pts_[Math.min(seg, r + 1)], sd = Array.isArray(side) ? side[r] : side;
      T.subVectors(a1, a0).normalize(); Nn.crossVectors(T, sd).normalize();
      for (let a = 0; a < across; a++) {
        const v = (i * per + r * across + a) * 3;
        if (a === 0) tmp.copy(p).addScaledVector(sd, hws[r]); else if (a === across - 1) tmp.copy(p).addScaledVector(sd, -hws[r]); else tmp.copy(p).addScaledVector(Nn, rise);
        pos[v] = tmp.x; pos[v + 1] = tmp.y; pos[v + 2] = tmp.z;
      }
    }
  };
  // a card from a root p along d for len, bending by bend (a vector scaled by len, quadratic), half width w x prof(k)
  const card = (i, p, d, len, w, bend, side, prof, rise = 0) => {
    for (let r = 0; r < rows; r++) { const k = r / seg; pts[r].set(p.x + d.x * len * k + bend.x * len * k * k, p.y + d.y * len * k + bend.y * len * k * k, p.z + d.z * len * k + bend.z * len * k * k); hw[r] = w * prof(k); }
    put(i, pts, hw, side, rise);
  };
  const flush = () => { g.attributes.position.needsUpdate = true; g.computeVertexNormals(); };
  return { mesh: m, geo: g, put, card, flush, seg };
}
const pLock = (k) => Math.pow(1 - k, 1.05) * Math.min(1, 0.3 + 2.8 * k);
const pVane = (k) => Math.sqrt(Math.max(0, 1 - Math.pow(k, 3.2))) * (0.8 + 0.2 * Math.min(1, k * 3));
const pSick = (k) => (0.78 + 0.22 * Math.sin(Math.PI * Math.min(1, k * 1.1))) * Math.sqrt(Math.max(0, 1 - Math.pow(k, 4.5)));

// ------------------------------------------------------------------------------------------------ textures
// the barb texture of every feather: a pale shaft down the middle and fine barbs leaving it (multiplied by the vertex colour);
// barred: the wing coverts' dark bars (about 0.55 of the base colour)
const featherTex = (barred) => once("ar-feather" + barred, () => {
  const [c, g] = canvas(64, 128); g.fillStyle = "#f4f4f4"; g.fillRect(0, 0, 64, 128);
  for (let i = 0; i < 46; i++) { const y = 4 + i * 2.7, x = 2 + 60 * rnd(i * 3 + 1), l = 8 + 12 * rnd(i * 3 + 2); g.strokeStyle = rnd(i * 3 + 3) > 0.5 ? "#dadada" : "#e8e8e8"; g.globalAlpha = 0.5; g.lineWidth = 1; g.beginPath(); g.moveTo(32, y + l); g.lineTo(x, y); g.stroke(); }
  g.globalAlpha = 1;
  if (barred) { g.fillStyle = "#a8a8a8"; for (const [y0, y1] of [[22, 38], [66, 82]]) { g.beginPath(); g.moveTo(0, y0); g.quadraticCurveTo(32, y0 - 7, 64, y0); g.lineTo(64, y1); g.quadraticCurveTo(32, y1 - 7, 0, y1); g.fill(); } }
  g.strokeStyle = "#bdbdbd"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(32, 0); g.lineTo(32, 128); g.stroke();
  return tex(c);
});
const featherMat = (barred, o = {}) => new THREE.MeshStandardMaterial({ color: "#ffffff", map: featherTex(barred), vertexColors: true, roughness: 0.62, side: THREE.DoubleSide, ...o });
// the body skin: rows of overlapping feather scallops, lighter on the back, darker under the belly (u along the body, v round it, 0 and 1 the belly line)
const bodyTex = () => once("ar-body", () => {
  const [c, g] = canvas(512, 256); g.fillStyle = "#8a4a22"; g.fillRect(0, 0, 512, 256);
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(60,30,12,0.55)"); gr.addColorStop(0.22, "rgba(60,30,12,0)"); gr.addColorStop(0.5, "rgba(190,110,50,0.18)"); gr.addColorStop(0.78, "rgba(60,30,12,0)"); gr.addColorStop(1, "rgba(60,30,12,0.55)");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  for (let r = 0; r < 18; r++) for (let i = 0; i < 44; i++) {
    const x = (i + 0.5 * (r % 2)) * 11.8 + (rnd(r * 91 + i) - 0.5) * 3, y = r * 14.4 + 6, l = rnd(r * 57 + i + 5);
    g.fillStyle = l > 0.62 ? "#9a5528" : l > 0.3 ? "#8a4a22" : "#7a4020"; g.globalAlpha = 0.85; g.beginPath(); g.ellipse(x, y, 7.2, 8.2, 0, 0, Math.PI); g.fill();
    g.strokeStyle = l > 0.5 ? "#b06a32" : "#5e3016"; g.globalAlpha = 0.22 + 0.3 * rnd(r * 31 + i + 9); g.lineWidth = 1; g.beginPath(); g.arc(x, y, 7.4, 0.2, Math.PI - 0.2); g.stroke(); g.globalAlpha = 1;
  }
  return tex(c);
});

// ------------------------------------------------------------------------------------------------ the rooster's numbers
// body skin sections [z, cy, w, up, dn, n]; the bird stands with its back sloping down toward the front and the tail high
const BODY = [
  [-0.150, 0.265, 0.010, 0.012, 0.012, 2.1], [-0.115, 0.262, 0.040, 0.040, 0.040, 2.1], [-0.070, 0.245, 0.064, 0.058, 0.066, 2.1], [-0.015, 0.228, 0.078, 0.068, 0.078, 2.1],
  [0.040, 0.225, 0.078, 0.070, 0.080, 2.1], [0.090, 0.232, 0.066, 0.070, 0.075, 2.1], [0.128, 0.245, 0.048, 0.060, 0.060, 2.1], [0.152, 0.258, 0.020, 0.030, 0.030, 2.1],
];
const BC = 0.225, DY = 0.02;   // DY: the body block (skin, thighs, wings, tail, hackle on the back) sits this far lower than the tables below say, so the neck is longer and the legs shorter   // the body pivot's height: sink, breath and bob turn about it
const secAt = (z) => {
  let k = BODY.length - 2; for (let i = 0; i < BODY.length - 1; i++) if (z <= BODY[i + 1][0]) { k = i; break; }
  const f = clamp((z - BODY[k][0]) / (BODY[k + 1][0] - BODY[k][0])), p = (j) => BODY[Math.max(0, Math.min(BODY.length - 1, j))];
  const m = (q) => cr4(p(k - 1)[q], p(k)[q], p(k + 1)[q], p(k + 2)[q], f);
  return { cy: m(1), w: Math.max(0.008, m(2)), up: Math.max(0.008, m(3)), dn: Math.max(0.008, m(4)) };
};
const surf = (z, ang, out = 0) => {   // a point on the body skin: ang 0 the +x flank, pi/2 the back, -pi/2 the belly; out along the normal
  const pt = (zz, a) => { const s = secAt(zz), e = 2 / 2.1, co = Math.cos(a), si = Math.sin(a); return V(Math.sign(co) * Math.abs(co) ** e * s.w, s.cy + Math.sign(si) * Math.abs(si) ** e * (si > 0 ? s.up : s.dn), zz); };
  const p = pt(z, ang), t = pt(z, ang + 0.01).sub(p).normalize(), tz = pt(z + 0.01, ang).sub(pt(z - 0.01, ang)).normalize(), n = V().crossVectors(t, tz).normalize();
  if (n.dot(V(p.x, p.y - secAt(z).cy, 0)) < 0) n.negate();
  return { p: p.addScaledVector(n, out), n };
};
const flankX = (z, y) => { const s = secAt(z), u = (y - s.cy) / (y > s.cy ? s.up : s.dn); return s.w * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 2.1)), 1 / 2.1); };
const SHOULDER = [0.066, 0.262, 0.04];   // the right wing's pivot (the left is its mirror)
// neck spines (5 control points: x, y, z from the breast to the head's pivot) and the head's turn (pitch down +, yaw, roll) per pose
const NECK = {
  stand: { p: [[0, 0.240, 0.06], [0, 0.280, 0.112], [0, 0.325, 0.143], [0, 0.355, 0.152], [0, 0.372, 0.158]], h: [0.08, 0, 0] },
  crow: { p: [[0, 0.240, 0.055], [0, 0.288, 0.100], [0, 0.352, 0.118], [0, 0.400, 0.122], [0, 0.428, 0.124]], h: [-0.53, 0, 0] },
  sleep: { p: [[0, 0.240, 0.06], [0, 0.288, 0.112], [0.022, 0.335, 0.095], [0.046, 0.335, 0.040], [0.052, 0.318, -0.004]], h: [0.30, 2.75, 0.55] },
  peek: { p: [[0, 0.240, 0.07], [0, 0.272, 0.130], [0, 0.300, 0.190], [0, 0.300, 0.240], [0, 0.292, 0.272]], h: [0.50, 0, 0.35] },
};
const NECK_R = [[0, 0.041], [0.2, 0.035], [0.45, 0.027], [0.75, 0.0205], [1, 0.0132]];   // the neck's radius along it
const neckR = (s) => { let i = 0; while (i < NECK_R.length - 2 && s > NECK_R[i + 1][0]) i++; const [a, ra] = NECK_R[i], [b, rb] = NECK_R[i + 1]; return lerp(ra, rb, clamp((s - a) / (b - a))); };
const TAIL = { base: [0, 0.272, -0.112], len: [0.72, 0.85, 0.95, 1, 0.95, 0.85, 0.72] };

function rooster(P) {
  const S = P.spec, G = new THREE.Group(); P.whole.add(G);
  const skinM = mat("#ffffff", { map: bodyTex(), roughness: 0.7 }), redM = mat("#c8372d", { roughness: 0.5 }), beakM = mat("#e6b84a", { roughness: 0.4 }), legM = mat("#d9a53a", { roughness: 0.55 });
  const bodyG = new THREE.Group(); bodyG.position.y = BC; G.add(bodyG);
  const inner = new THREE.Group(); inner.position.y = -BC; bodyG.add(inner);   // floor coordinates, sunk / swelled / shivered about the body's middle
  const blk = new THREE.Group(); blk.position.y = -DY; inner.add(blk);   // the body block

  // ---- the body: one lofted skin
  const secs = () => BODY.map(([z, cy, w, up, dn, n]) => ({ c: [0, cy, z], w, up, dn, n }));
  const bl = makeLoft(secs(), { sub: 3, radial: 20, ref: [0, 1, 0] }); mesh(bl, skinM, blk);
  // thighs: feathered ellipsoids at the hips (the legs come out of them)
  for (const sd of [-1, 1]) { const th = mesh(new THREE.SphereGeometry(1, 9, 7), skinM, blk, sd * 0.052, 0.178, -0.012); th.scale.set(0.03, 0.052, 0.046); th.rotation.x = 0.25; }

  // ---- neck (one loft) and head (a second loft, rigid on the neck's end)
  const nSecs = (sp) => [0, 0.2, 0.42, 0.65, 0.85, 1].map((s) => { const p = sp(s); return { c: [p.x, p.y, p.z], w: neckR(s), up: neckR(s), dn: neckR(s), n: 2 }; });
  const spineOf = (pts) => (s) => { const f = clamp(s) * 4, i = Math.min(3, Math.floor(f)), u = f - i, a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[i + 1], d = pts[Math.min(4, i + 2)]; return V(cr4(a[0], b[0], c[0], d[0], u), cr4(a[1], b[1], c[1], d[1], u), cr4(a[2], b[2], c[2], d[2], u)); };
  const neckLoft = makeLoft(nSecs(spineOf(NECK.stand.p)), { sub: 2, radial: 12, ref: [0, 0, 1] }); mesh(neckLoft, skinM, inner);
  const headG = new THREE.Group(); headG.rotation.order = "YXZ"; inner.add(headG);
  const HEAD = [[-0.024, 0.0005, 0.0095, 0.0115, 0.0105, 2.2], [-0.0145, 0.002, 0.0142, 0.0165, 0.0145, 2.2], [0.0, 0.002, 0.0155, 0.0172, 0.0138, 2.2], [0.0115, 0.0, 0.0128, 0.0148, 0.0108, 2.2], [0.0205, -0.0012, 0.0088, 0.0105, 0.0088, 2.2]];
  const hS = HEAD.map(([z, y, w, up, dn, n]) => ({ c: [0, y, z], w, up, dn, n }));
  mesh(makeLoft(hS, { sub: 2, radial: 12, ref: [0, 1, 0] }), redM, headG);
  const bkS = [[0.010, -0.0005, 0.0100, 0.0085, 0.0060, 2.2], [0.018, -0.0015, 0.0078, 0.0068, 0.0045, 2.3], [0.027, -0.0030, 0.0045, 0.0045, 0.0030, 2.3], [0.034, -0.0052, 0.0016, 0.0018, 0.0014, 2.2], [0.0378, -0.0074, 0.0004, 0.0006, 0.0005, 2]].map(([z, y, w, up, dn, n]) => ({ c: [0, y, z], w, up, dn, n }));
  mesh(makeLoft(bkS, { sub: 2, radial: 8, ref: [0, 1, 0] }), beakM, headG);
  for (const sd of [-1, 1]) { const nos = mesh(new THREE.SphereGeometry(1, 6, 4), mat("#5a4318", { roughness: 0.8 }), headG, sd * 0.0036, 0.0030, 0.0165); nos.scale.set(0.0012, 0.0008, 0.0028); nos.castShadow = false; }
  const jaw = new THREE.Group(); jaw.position.set(0, -0.0075, 0.004); headG.add(jaw);
  const lwS = [[0, 0, 0.0085, 0.0035, 0.004], [0.010, -0.0005, 0.0075, 0.0030, 0.0038], [0.020, -0.0010, 0.0048, 0.0025, 0.003], [0.028, -0.0016, 0.0020, 0.0016, 0.002], [0.0315, -0.0022, 0.0005, 0.0006, 0.0006]].map(([z, y, w, up, dn]) => ({ c: [0, y, z], w, up, dn, n: 2.2 }));
  mesh(makeLoft(lwS, { sub: 2, radial: 8, ref: [0, 1, 0] }), beakM, jaw);
  const gape = mesh(new THREE.SphereGeometry(1, 10, 6), mat("#7a2428", { roughness: 0.6 }), jaw, 0, 0.0026, 0.012); gape.scale.set(0.0062, 0.0016, 0.016); gape.castShadow = false;
  const tongue = mesh(new THREE.SphereGeometry(1, 10, 6), mat("#d4535c", { roughness: 0.55 }), jaw, 0, 0.0036, 0.012); tongue.scale.set(0.0030, 0.0011, 0.0125); tongue.castShadow = false;
  for (const sd of [-1, 1]) {
    const wt = mesh(new THREE.SphereGeometry(1, 8, 6), redM, headG, sd * 0.0038, -0.0175, 0.0195); wt.scale.set(0.0028, 0.0100, 0.0042); wt.rotation.x = -0.12;   // wattles
    const ear = mesh(new THREE.SphereGeometry(1, 8, 5), mat("#e8dcc4", { roughness: 0.6 }), headG, sd * 0.0147, -0.0045, -0.0105); ear.scale.set(0.0028, 0.0050, 0.0040); ear.castShadow = false;   // the cream ear lobe
  }
  // the comb: a flat 5-point blade, extruded 0.0055 thick; outline in (z, y) of the head, drawn as x = -z so the turn puts it along +z
  { const val = [[0.0128, 0.0235], [0.0080, 0.0275], [0.0025, 0.0295], [-0.0035, 0.0300], [-0.0095, 0.0285], [-0.0142, 0.0230]], pk = [[0.0106, 0.0350], [0.0054, 0.0425], [-0.0005, 0.0480], [-0.0066, 0.0425], [-0.0120, 0.0355]], sh = new THREE.Shape();
    sh.moveTo(-0.0165, 0.010); sh.lineTo(-val[0][0], val[0][1] - 0.008); sh.lineTo(-val[0][0], val[0][1]);
    for (let i = 0; i < pk.length; i++) sh.quadraticCurveTo(-pk[i][0], 2 * pk[i][1] - (val[i][1] + val[i + 1][1]) / 2, -val[i + 1][0], val[i + 1][1]);
    sh.lineTo(-val[5][0], val[5][1] - 0.010); sh.lineTo(0.0145, 0.010); sh.lineTo(-0.0165, 0.010);
    const eg = new THREE.ExtrudeGeometry(sh, { depth: 0.0055, bevelEnabled: true, bevelThickness: 0.0009, bevelSize: 0.0008, bevelSegments: 1, curveSegments: 3 });
    eg.translate(0, 0, -0.00275); eg.rotateY(Math.PI / 2); mesh(eg, mat("#c8372d", { roughness: 0.42 }), headG).castShadow = true; }
  // the cap: ten gold locks over the nape, pointing back and down (they turn with the head)
  { const rs = ribbons(10, 2, 2, (i, k) => C3("#e08a2e").lerp(C3("#f0b24a"), k), featherMat(false)); const side = V(1, 0, 0);
    for (let i = 0; i < 10; i++) { const a = (i - 4.5) / 4.5, p = V(a * 0.011, 0.011 - 0.006 * Math.abs(a), -0.0115 - 0.003 * (i % 2)); rs.card(i, p, V(a * 0.35, -0.45, -0.85).normalize(), 0.022 + 0.008 * rnd(i + 40), 0.0042, V(0, -0.2, 0), side, pLock); }
    rs.flush(); headG.add(rs.mesh); }
  // the eyes: an amber ring, a dark pupil with a glint, a red skin lid that swings over it
  const lids = [];
  for (const sd of [-1, 1]) {
    const eg = new THREE.Group(); eg.position.set(sd * 0.0128, 0.003, 0.0); eg.quaternion.setFromUnitVectors(V(0, 0, 1), V(sd, 0.12, 0.38).normalize()); headG.add(eg);
    const ring = mesh(new THREE.SphereGeometry(1, 12, 6), mat("#d98a1e", { roughness: 0.35 }), eg); ring.scale.set(0.0088, 0.0088, 0.0034); ring.castShadow = false;
    const pup = mesh(new THREE.SphereGeometry(0.006, 10, 7), mat("#1a1208", { roughness: 0.15 }), eg, 0, 0, 0.0014); pup.castShadow = false;
    const gl = new THREE.Mesh(new THREE.CircleGeometry(0.0016, 8), new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false })); gl.position.set(-0.0018, 0.0021, 0.0072); gl.material.userData.noOutline = true; eg.add(gl);
    const lid = new THREE.Group(); eg.add(lid); const dome = mesh(new THREE.SphereGeometry(0.0098, 10, 5, 0, TAU, 0, Math.PI / 2), redM, lid); dome.castShadow = false; lids.push(lid);
  }

  // ---- hackle: ~120 locks (merged), on the neck (66), shoulders (30) and rump (24)
  const hackle = ribbons(120, 3, 2, (i, k) => C3("#b8661c").lerp(C3(i % 3 === 0 ? "#d97d26" : "#e08a2e"), Math.min(1, k * 2.2)).lerp(C3("#f0b24a"), Math.pow(k, 1.6)), featherMat(false)); blk.add(hackle.mesh);
  // ---- tail: 7 sickles (a raised sheen line) and 5 short stiff main feathers beneath
  const sick = ribbons(7, 10, 3, (i, k, a) => C3("#1f5a44").lerp(C3("#2f8a6a"), (1 - Math.abs(a)) * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, k * 1.1)))), featherMat(false)); blk.add(sick.mesh);
  const mainT = ribbons(5, 5, 2, (i, k) => C3("#17402f").lerp(C3("#1f5a44"), k), featherMat(false)); blk.add(mainT.mesh);
  // ---- wings: right wing built, the left is its mirror. Each feather has a folded place (on the flank, tip on the skin) and a spread one
  const WF = [];   // { fr: [x, y, z] root, ft: tip (folded), sr, sa (deg), sl, w, tint, cov }
  const fold = (zr, yr, zt, yt, off) => [[flankX(zr, yr) + off - SHOULDER[0], yr - SHOULDER[1], zr - SHOULDER[2]], [flankX(zt, yt) + off + 0.0025 - SHOULDER[0], yt - SHOULDER[1], zt - SHOULDER[2]]];
  for (let r = 0; r < 3; r++) for (let i = 0; i < 8; i++) {   // coverts: three rows of short wide feathers over the wing's front half
    const k = i / 7, zr = 0.046 - 0.088 * k - 0.004 * r, yr = 0.292 - 0.033 * r - 0.012 * k, [a, b] = fold(zr, yr, zr - 0.036 - 0.004 * r, yr - 0.038 - 0.003 * r, 0.003 + 0.0015 * r);
    WF.push({ cov: 1, fr: a, ft: b, sr: [lerp(0.015, 0.145, k) - 0.002 * r, 0.004 * r, -0.012 * r], sa: lerp((k - 0.5) * 6, 84, 1), sl: 0.06 - 0.012 * r + 0.012 * rnd(r * 9 + i), w: 0.0125 - 0.001 * r, tint: C3("#6b3518").lerp(C3("#7c4220"), rnd(r * 9 + i + 3) * 0.7) });
  }
  for (let i = 0; i < 8; i++) {   // secondaries along the arm's trailing edge: hang back and down over the flank
    const k = i / 7, zr = 0.034 - 0.078 * k, yr = 0.266 - 0.006 * k, [a, b] = fold(zr, yr, zr - 0.072 - 0.012 * k, 0.196 + 0.020 * k, 0.003);
    WF.push({ cov: 0, fr: a, ft: b, sr: [lerp(0.115, 0.012, k), 0.003 + 0.0008 * i, -0.02], sa: 78 + 14 * k, sl: 0.112 + 0.02 * Math.sin(Math.PI * Math.min(1, k * 1.1)), w: 0.0138, tint: C3("#5c2e15").lerp(C3("#7a4120"), rnd(i + 70) * 0.6) });
  }
  for (let i = 0; i < 8; i++) {   // primaries from the wrist: folded under the secondaries, their tips lie over the tail's root
    const k = i / 7, zr = -0.018 - 0.058 * k, yr = 0.262 - 0.010 * k, [a, b] = fold(zr, yr, zr - 0.100 - 0.024 * (1 - Math.abs(k - 0.4)), 0.205 + 0.016 * k, 0.0);
    WF.push({ cov: 0, fr: a, ft: b, sr: [0.12 - 0.004 * i, 0.0006 * i, 0], sa: lerp(-6, 62, k), sl: 0.172 - 0.026 * Math.abs(k - 0.25) * 3.2 + 0.005, w: 0.0112, tint: C3("#4e2713").lerp(C3("#6a381b"), rnd(i + 90) * 0.6) });
  }
  const wingTints = (flag) => WF.filter((f) => !!f.cov === flag);
  const wings = [];
  for (const sd of [1, -1]) {
    const mir = new THREE.Group(); mir.scale.x = sd; blk.add(mir);
    const hold = new THREE.Group(); hold.position.set(...SHOULDER); mir.add(hold);
    const cov = wingTints(true), fl = wingTints(false);
    const covR = ribbons(cov.length, 3, 2, (i, k) => cov[i].tint, featherMat(true)), flR = ribbons(fl.length, 3, 2, (i, k) => fl[i].tint.clone().multiplyScalar(0.95 + 0.1 * k), featherMat(false));
    hold.add(covR.mesh, flR.mesh); wings.push({ hold, covR, flR });
  }
  const buildWing = (w) => {
    const dF = V(), dS = V(), rr = V(), tt = V(), nrm = V(0, 0, 0), sd = V(), tipV = V(), bend = V();
    for (const W of wings) for (const [R, list] of [[W.covR, wingTints(true)], [W.flR, wingTints(false)]]) {
      list.forEach((f, i) => {
        const sr = V(...f.sr), a = f.sa * DEG, spreadTip = V(sr.x + Math.cos(a) * f.sl, sr.y, sr.z - Math.sin(a) * f.sl);
        rr.set(...f.fr).lerp(sr, w); tipV.set(...f.ft).lerp(spreadTip, w); dF.subVectors(tipV, rr); const len = dF.length(); dF.divideScalar(len || 1);
        nrm.set(1 - w, w, 0).normalize(); sd.crossVectors(dF, nrm).normalize(); if (sd.y < 0 || (w < 0.5 && sd.y < 0)) sd.negate();
        bend.set(0.05 * (1 - w), -0.1 - 0.05 * w, 0); R.card(i, rr, dF, len * 1.04, f.w * (1 + 0.7 * w), bend, sd.clone(), pVane);
      }); R.flush();
    }
  };
  buildWing(0);

  // ---- legs: scaled tarsi, 3 toes forward + 1 back, spurs, pivoting at the hips (the thighs are in the body)
  const HIP = 0.13, legs = [];
  for (const sd of [-1, 1]) {
    const lg = new THREE.Group(); lg.position.set(sd * 0.045, HIP, -0.006); G.add(lg);
    mesh(tubeGeo([[0, -0.02, 0], [0, -0.065, 0.004], [0, -0.105, 0.010], [0, -0.121, 0.014]], 0.0075, 6, 8), legM, lg);
    for (let i = 0; i < 4; i++) { const sc = mesh(new THREE.TorusGeometry(0.0079, 0.0013, 3, 6), mat("#b9862a", { roughness: 0.6 }), lg, 0, -0.045 - i * 0.019, 0.0032 + 0.0032 * i); sc.rotation.x = Math.PI / 2 - 0.12; sc.castShadow = false; }
    const sp = mesh(new THREE.ConeGeometry(0.0038, 0.02, 6), mat("#c9ae7a", { roughness: 0.5 }), lg, sd * -0.002, -0.075, -0.0085); sp.rotation.x = -Math.PI / 2 + 0.55;
    for (const [a, len] of [[-30, 0.040], [0, 0.046], [30, 0.040], [180, 0.028]]) {
      const tg = new THREE.Group(); tg.position.set(0, -0.1245, 0.014); tg.rotation.y = a * DEG; lg.add(tg);
      const t = mesh(new THREE.CylinderGeometry(0.0040, 0.0058, len, 6), legM, tg, 0, 0, len / 2); t.rotation.x = Math.PI / 2;
      const cl = mesh(new THREE.ConeGeometry(0.0032, 0.011, 6), mat("#c9ae7a", { roughness: 0.45 }), tg, 0, -0.0012, len + 0.003); cl.rotation.x = Math.PI / 2 + 0.35;
    }
    legs.push(lg);
  }

  // ---- the pose: neck, hackle, tail, body skin and wings are rewritten when the keys change (and per frame while walking); the
  // sink, breath, shiver, flap and leg swing are transforms of the clip clock
  let gkey = "";
  const P0 = V(), P1 = V(), sideV = V(), e1 = V(), e2 = V(), dirV = V(), dd = V();
  const rebuild = (crow, sleep, peek, spinePts, w) => {
    // body skin: chest +8 % with the crow, the belly lifted when it sleeps
    const ss = secs(); for (const s of ss) { const ch = sstep(0.05, 0.16, s.c[2]) * crow * 0.08; s.w *= 1 + ch; s.up *= 1 + ch; s.dn *= 1 + ch - 0.06 * sleep; } bl.userData.set(ss);
    const sp = spineOf(spinePts); neckLoft.userData.set(nSecs(sp));
    // hackle: neck locks hug the neck and fall toward the shoulders
    let n = 0; const neckN = 66;
    for (let i = 0; i < neckN; i++) {
      const s = 0.1 + 0.88 * ((i * 0.618034) % 1), a = ((i * 0.381966 + 0.17 * rnd(i + 11)) % 1) * TAU;
      P0.copy(sp(s)); P1.copy(sp(Math.min(1, s + 0.02))); dd.subVectors(P1, P0).normalize();
      e1.set(1, 0, 0).addScaledVector(dd, -dd.x).normalize(); e2.crossVectors(dd, e1).normalize();
      dirV.copy(e1).multiplyScalar(Math.cos(a)).addScaledVector(e2, Math.sin(a));
      const r = neckR(s), p = P0.clone().addScaledVector(dirV, r * 1.12).add(V(0, DY, 0)), d = V().copy(dd).multiplyScalar(-0.92).addScaledVector(dirV, 0.32).add(V(0, -0.1, 0)).normalize();
      sideV.crossVectors(d, dirV).normalize();
      hackle.card(n++, p, d, (0.040 + 0.040 * (1 - s) + 0.012 * rnd(i + 21)) * (a > Math.PI * 0.5 && a < Math.PI * 1.5 ? 0.85 : 1), 0.0100, dirV.clone().multiplyScalar(-0.03).add(V(0, -0.05, 0)), sideV.clone(), pLock);
    }
    const lay = (z0, z1, a, hw, k) => {   // one lock lying along the skin from z0 back to z1 at angle a
      const q0 = surf(z0, a, 0.005), q1 = surf(z1, a, 0.005), d = V().subVectors(q1.p, q0.p), len = d.length() * k; d.normalize();
      sideV.crossVectors(d, q0.n).normalize(); hackle.card(n++, q0.p, d, len, hw, q0.n.clone().multiplyScalar(0.0), sideV.clone(), pLock);
    };
    for (let i = 0; i < 30; i++) lay(0.112 - 0.15 * ((i * 0.618034) % 1), 0.112 - 0.15 * ((i * 0.618034) % 1) - 0.07, Math.PI / 2 + (((i * 0.381966) % 1) - 0.5) * 2.4, 0.0068, 1.0 + 0.3 * rnd(i + 51));   // shoulders
    for (let i = 0; i < 24; i++) lay(-0.045 - 0.07 * ((i * 0.618034) % 1), -0.045 - 0.07 * ((i * 0.618034) % 1) - 0.08, Math.PI / 2 + (((i * 0.381966) % 1) - 0.5) * 2.0, 0.0068, 1.0 + 0.25 * rnd(i + 81));   // saddle
    hackle.flush();
    // tail: 7 sickles in a fan (wider with the crow), drooped when asleep
    const fan = 1 + 0.9 * crow, L = TAIL.len, bp = TAIL.base, sides = Array.from({ length: 11 }, () => V());
    for (let i = 0; i < 7; i++) {
      const u = (i - 3) / 3, pts = [], hws = [], f = 0.4 + 0.1 * Math.abs(u);
      for (let r = 0; r <= 10; r++) {
        const k = r / 10, up = (0.150 - 0.02 * Math.abs(u)) * Math.sin(Math.PI * Math.pow(k, 0.85) * 0.92) * (1 - 0.4 * sleep) * L[i] ** 0.6, back = 0.222 * L[i] * Math.pow(k, 0.95);
        pts.push(V(bp[0] + u * (0.012 + 0.07 * k ** 1.3) * fan, bp[1] + up - 0.04 * sleep * k * k, bp[2] - back)); hws.push(0.019 * pSick(k));
      }
      for (let r = 0; r <= 10; r++) { const a0 = pts[Math.max(0, r - 1)], a1 = pts[Math.min(10, r + 1)]; dd.subVectors(a1, a0).normalize(); sides[r].set(0.30 * u + 0.08, 0.95, 0); sides[r].addScaledVector(dd, -sides[r].dot(dd)).normalize(); }
      sick.put(i, pts, hws, sides.map((v) => v.clone()), 0.0045);
    }
    sick.flush();
    for (let i = 0; i < 5; i++) {
      const u = (i - 2) / 2, d = V(u * 0.35 * fan, 0.55 - 0.15 * sleep, -0.82).normalize();
      mainT.card(i, V(bp[0] + u * 0.01, bp[1] - 0.012, bp[2] + 0.012), d, 0.12 - 0.01 * Math.abs(u), 0.0125, V(0, -0.28, 0), V(0.3, 0.9, 0).normalize(), pSick);
    }
    mainT.flush();
    buildWing(w);
  };
  const pose = (ps, t) => {
    const crow = clamp(num(ps, S, "crow")), sleep = clamp(num(ps, S, "sleep")), flap = clamp(num(ps, S, "flap")), walk = clamp(num(ps, S, "walk")), peek = clamp(num(ps, S, "peek"));
    const hy = clamp(num(ps, S, "headY"), -1, 1), lidK = clamp(num(ps, S, "lid"));
    const ph = TAU * 2.2 * t, w = Math.round(flap * 200) / 200;
    // the neck's control points: stand + each pose's difference, and a forward-back bob while walking
    const sp = [], A = NECK.stand, wts = [["crow", crow], ["sleep", sleep], ["peek", peek]];
    const bob = walk * 0.011 * Math.sin(ph - 0.7), lift = walk * 0.003 * Math.abs(Math.sin(ph));
    for (let i = 0; i < 5; i++) {
      const q = [0, 1, 2].map((m) => A.p[i][m] + wts.reduce((s, [n, v]) => s + v * (NECK[n].p[i][m] - A.p[i][m]), 0));
      const f = i / 4; q[2] += bob * f; q[1] += lift * f; sp.push(q);
    }
    const key = [crow, sleep, peek, w, walk > 0 ? Math.round(t * 600) : 0, walk > 0 ? walk : 0].map((v) => Number(v).toFixed(3)).join("|");
    if (key !== gkey) { gkey = key; rebuild(crow, sleep, peek, sp, w); }
    const head = sp[4]; headG.position.set(head[0], head[1], head[2]);
    const hh = [0, 1, 2].map((m) => A.h[m] + wts.reduce((s, [n, v]) => s + v * (NECK[n].h[m] - A.h[m]), 0));
    headG.rotation.set(hh[0], hh[1] + hy * 75 * DEG, hh[2]);
    // jaw: 28 deg open with the crow; lids: closed by the lid key or by sleep (0.3 to 0.75)
    jaw.rotation.x = 0.49 * crow; gape.visible = tongue.visible = crow > 0.05;
    const close = Math.max(lidK, sstep(0.3, 0.75, sleep)); for (const L of lids) L.rotation.x = lerp(-1.0, 1.5708, close);
    // body: sinks 0.11 with the sleep, breathes 0.01 at 0.4 Hz while asleep, shivers 0.004 at 4 Hz at crow 1, bobs while walking
    const breath = 0.01 * sleep * Math.sin(TAU * 0.4 * t), shiver = 0.004 * sstep(0.85, 1, crow) * Math.sin(TAU * 4 * t);
    const bobY = walk * 0.005 * Math.abs(Math.sin(ph)), sink = 0.11 * sleep;
    bodyG.position.set(shiver + walk * 0.002 * Math.sin(ph), BC - sink + bobY, 0); bodyG.scale.set(1 + breath, (1 - 0.07 * sleep) * (1 + breath), 1 + breath); bodyG.rotation.z = walk * 0.04 * Math.sin(ph);
    // legs: fold with the sleep (the foot stays on the floor), step with the walk (the two out of step)
    const hip = HIP - sink;
    legs.forEach((lg, j) => {
      const sw = walk * 0.5 * Math.sin(ph + (j ? Math.PI : 0)), up = walk * 0.012 * Math.max(0, -Math.cos(ph + (j ? Math.PI : 0)));
      lg.position.y = hip + up; lg.scale.set(1, hip / HIP, 1); lg.rotation.x = -sw;
    });
    // wings: spread by flap, beating at 9 Hz from t
    const beat = flap > 0 ? flap * (0.28 + 0.62 * Math.sin(TAU * 9 * t)) : 0;
    for (const W of wings) { W.hold.rotation.z = beat; W.hold.rotation.y = 0; W.hold.rotation.x = 0.5 * w; }
  };
  pose({}, 0);
  return { grip: 0, apply(ps, t) { pose(ps, t); } };
}

// ------------------------------------------------------------------------------------------------ the fly
function fly(P) {
  const S = P.spec, G = new THREE.Group(); P.whole.add(G);
  const dark = mat("#141418", { roughness: 0.35, metalness: 0.2 }), eyeM = mat("#5a1a1a", { roughness: 0.3 }), wingM = new THREE.MeshStandardMaterial({ color: "#cfd8e6", roughness: 0.2, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
  const body = new THREE.Group(); body.position.y = 0.0095; G.add(body);
  // one loft: abdomen (back), thorax, head (front): z from -0.011 to 0.011
  const bs = [[-0.0110, 0.0, 0.0008, 0.0008, 0.0008], [-0.0075, 0.0004, 0.0042, 0.0038, 0.0034], [-0.0020, 0.0006, 0.0040, 0.0040, 0.0036], [0.0020, 0.0014, 0.0044, 0.0046, 0.0038], [0.0062, 0.0004, 0.0030, 0.0032, 0.0028], [0.0092, -0.0004, 0.0030, 0.0032, 0.0030], [0.0112, -0.0006, 0.0010, 0.0012, 0.0012]].map(([z, y, w, up, dn]) => ({ c: [0, y, z], w, up, dn, n: 2 }));
  const bl = makeLoft(bs, { sub: 1, radial: 8, ref: [0, 1, 0] }); mesh(bl, dark, body).castShadow = false;
  for (const sd of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(1, 5, 3), eyeM, body, sd * 0.0030, 0.0012, 0.0086); e.scale.set(0.0020, 0.0026, 0.0026); e.castShadow = false; }
  // legs: six flat thin strips (2 tris each), three a side, down to the foot plane
  for (const sd of [-1, 1]) for (const [z, o] of [[0.006, 0.8], [0.0015, 1.0], [-0.0030, 1.3]]) {
    const lg = new THREE.Mesh(new THREE.PlaneGeometry(0.0007, 0.0095), dark); lg.geometry.translate(0, -0.00475, 0); lg.position.set(sd * 0.0030, -0.0006, z); lg.rotation.z = -sd * 0.55 * o; lg.rotation.y = sd * 0.5; lg.castShadow = false; body.add(lg);
  }
  // wings: two pairs of poses (folded flat over the back / raised), each a 2-triangle blade pivoting at the thorax
  const wings = [];
  for (const sd of [-1, 1]) {
    const pv = new THREE.Group(); pv.position.set(sd * 0.0026, 0.0040, -0.0012); body.add(pv);
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0.0042, 0.0032); sh.lineTo(0.0036, 0.0138); sh.lineTo(-0.0008, 0.0085); sh.lineTo(0, 0);   // chord x, length y
    const wg = new THREE.ShapeGeometry(sh), wm = new THREE.Mesh(wg, wingM); wm.castShadow = false; wm.scale.x = sd; pv.add(wm); wings.push({ pv, sd, wm });
  }
  const pose = (ps, t) => {
    const buzz = clamp(num(ps, S, "buzz")), fr = Math.round(t * 30), flip = fr % 2;
    for (const W of wings) {
      W.wm.rotation.set(-Math.PI / 2, 0, 0);   // lying flat, pointing back (+y of the shape -> -z)
      if (buzz > 0) { W.pv.rotation.set(0, -W.sd * lerp(0, flip ? 0.4 : -0.15, buzz), W.sd * lerp(0.1, flip ? 1.0 : 0.15, buzz)); } else W.pv.rotation.set(0, 0, W.sd * 0.1);
    }
    body.position.set(buzz > 0 ? 0.0004 * (flip ? 1 : -1) : 0, 0.0095 + (buzz > 0 ? 0.0004 * (flip ? -1 : 1) : 0), 0);
  };
  pose({}, 0);
  return { grip: 0, apply(ps, t) { pose(ps, t); } };
}

export const ALARM_ROOSTER_KINDS = { rooster, fly };
export const ALARM_ROOSTER_GRIPS = {};
// the kinds' own state keys, so a "prop" action TWEENS them (props3d.js builds ps from KIT_STATE; without these a key jumps to its value):
// the director adds `...ALARM_ROOSTER_STATE` to KIT_STATE there. Defaults 0.
export const ALARM_ROOSTER_STATE = { rooster: { crow: 0, sleep: 0, walk: 0, peek: 0 }, fly: { buzz: 0 } };
