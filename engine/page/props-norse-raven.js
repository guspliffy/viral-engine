// Norse myth 01 "One eye for one sip" (Wednesday), DESIGN.md section B: THE TWO RAVENS, kind `norseraven`.
// A real raven built by the crow's method (props-sh-items.js): ONE lofted skin for body and neck, a lofted head, lofted beak halves, a feather
// card for every feather (120 wing feathers, 12 tail, 150 contour marks, 60 crown marks, 16 throat hackles, 14 bristles, 14 thigh feathers),
// a hinged lower beak, legs and toes that WRAP the perch. Metres, degrees. A pure function of the spec, the state and the clip time t: every
// mark comes from an index (no Math.random, no wall clock); the idle life (breath, head snaps, tail flick, third lid) is hashed on t.
//
//   KIND norseraven   ORIGIN: between the feet, y 0 = the TOP of the perch (the toes curl down round it), facing +z (his LEFT = +x).
//     Size: 0.50 beak tip to tail tip, 0.26 to the crown when perched, body 0.125 wide, span 1.00 (wings 1). The body is held 40 degrees from
//     level (breast up), the tail rides 12 degrees under level. `who` 1 is x 0.96, `who` 2 x 1.04 (the model is built at 1.0, scaled inside).
//     The perch axis is the prop's x: the toes wrap a cylinder along x with its top at y 0 (rot the prop to put it across a bracer or a shelf).
//   SPEC KEYS (any STATE key may also be a spec key = its start value). scale / rot / x / y / z / tip / tilt as every prop.
//     who 1        1 = HIS RIGHT shoulder, the spear side: sleek (x 0.96), BLUE sheen, a notch in the 6th secondary (S1 = next to the hand) of its
//                  left wing. 2 = HIS LEFT, the blind side (x 1.04), VIOLET sheen, 3 crown feathers standing 0.008, a pale scar line 0.012 on the
//                  right of the beak, the 4th tail feather bent 10 degrees, hackles 15 % longer; at rest it keeps its head turned outward (+x).
//     perchR 0.03  radius of the perch the toes wrap (fur shelf 0.05, bracer 0.03); also a state key, so it can be changed at a hop.
//     idle 1       0 switches the idle life off (breath, head snaps, tail flick); the third lid still crosses.
//     seed         0 shifts the hashed timings (default: who), so the two birds never snap together.
//   STATE (tween with c.prop; read ps.<key> ?? spec.<key> ?? default; seed with a dur-0 set at 0 what you tween)
//     wings 0     0 folded (tips cross over the rump, 0.03 short of the tail tip) .. 1 spread (60 feathers a wing unfold from the wrist)
//     flap 0      a COUNT: one wingbeat per whole number (phase = fractional part), tween it linearly 0 -> n for n beats. Downstroke 55 %, the tips
//                 travel +50 to -35 degrees, primaries bend up 12 degrees going down and open like fingers coming up, the body bobs 0.015 the other
//                 way. At every whole number the wings are in the glide position (5 degrees up). Needs wings 1 (it scales with wings, and by
//                 0.4 in the brake: those are the 2 small settling beats). Director: 3.5 a second cruising, 5 at take-off and braking.
//     glide 0     wings held out, 5 degrees up, finger tips flexing 4 degrees (a slow hashed shimmer); needs no flap
//     brake 0     the landing: body 55 degrees up, wings cupped forward and up, tail fanned 70 and down 30, legs forward, toes spread.
//                 Director: 0 -> 1 in 0.25 s, 2 small settling beats (flap 2), then wings 1 -> 0 in 0.35 s (and grip 1 as the toes close)
//     grip 1      1 toes curled round the perch of radius perchR; 0 the feet tucked up in the belly feathers (flight), toes curled
//     lean 0      -1..1, the whisper: the body pitches 35 degrees forward and turns 40 toward that side (+ = toward its left, +x), the neck
//                 stretches 0.03. The head turns with the body: add headYaw toward the ear. The beak tip ends 0.03 from the ear (staging)
//     headYaw 0   -1..1, 100 degrees, + = toward its left (+x); a raven turns its head in 2 frames and holds: tween it with dur 0.07
//     headPitch 0 -1..1, 35 degrees, + = beak DOWN (looking down at Chip); headRoll 0 -1..1, 30 degrees, + = the top of the head tips toward
//                 its left (the tilt of panel 22). "Looks sideways at Chip" = headYaw 1 (one eye turned to him)
//     talk 0      0..1: the beak opens up to 28 degrees (inside #8a3a40, tongue #b0646a), hackles lift 45 %, the tail dips 6 degrees. One
//                 syllable = 0 -> 1 -> 0 (35.0 s, 37.0 s)
//     ruff 0      0..1: the 16 throat hackles lift up to 35 degrees          shake 0  0 -> 1 over 0.4 s: a body shake, feathers 12 % fuller,
//                 then settle        hop 0  0 -> 1: a 0.05 hop, legs stretch, wings lift a little        blink 0  0..1: the third lid (#b9c2c9)
//     tint 0      BENCH ONLY: 1 paints the wing feathers by class for counting (primaries red, secondaries blue, tertials green, coverts amber,
//                 thumb feathers pink; neighbours alternate light and dark)
//   ALWAYS ALIVE when perched (grip 1, idle 1): breath 0.002 at 0.8 Hz; a head snap every 1.4-3.1 s (hashed) to one of 5 directions; a tail
//     flick of 8 degrees about every 5 s; a third lid crossing in 2 frames every 2.5-4 s. Whispering reads at a frame 1.2 m wide (beak 61 px).
//   HOLD POINTS: none. The raven is never held by a hand (it sits on a shoulder shelf or a bracer); NORSE_RAVEN_GRIPS is empty, so there is no
//     in-hand proof. The costume rides it as a child: perch points are in DESIGN section A.
//   COUNTS (the bench prints ravenCounts()): wing 60 = 10 primaries / 11 secondaries / 3 tertials / 33 coverts (9 + 11 + 13) / 3 thumb; 4 of
//     them split (6.7 %); tail 12; hackles 16; bristles 14; contour marks 150 in 11 rows; crown marks 60; thigh feathers 14; neck marks 24
//     (extra, over the joint); scale rings 7 a leg; toes 3 + 1 a foot.
import * as THREE from "three";
import { clamp } from "./util.js";
import { makeLoft } from "./geo.js";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; if (parent) parent.add(o); return o; }
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const memo = new Map();
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
// small vector helpers on plain arrays (the layout code runs every frame)
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const rz = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]]; };   // about z: +x tilts up
const planeDir = (psi) => [Math.cos(psi * DEG), 0, -Math.sin(psi * DEG)];   // a direction in the wing plane: psi degrees from +x toward -z (back)

// ---------------------------------------------------------------------------------------------------- palette (DESIGN shared palette RAVEN)
const C = {
  black: "#15151b", black2: "#1d1d28", black3: "#0f0f14", deep: "#0b0b10", blue: "#3a4f9a", violet: "#5b3f8a",
  beak: "#1c1c22", beakLight: "#5a5f6c", beakTip: "#3a3a42", mouth: "#8a3a40", tongue: "#b0646a",
  eye: "#2a1a12", lid: "#2a2a33", third: "#b9c2c9", leg: "#2a2930", claw: "#101014", scar: "#a9a6b4",
};

// ---------------------------------------------------------------------------------------------------- feather textures
// flight atlas: 15 tiles of 64 x 512, the tip at the TOP of the canvas. tiles 0-4 flight feathers (8-12 barb ticks a side), 5-9 coverts (matte),
// 10-14 tail (violet stripes). The shaft of a flight feather is at u 0.60 (a narrower leading web, u grows toward the leading edge).
const TW = 64, TH = 512, NTILE = 15;
const flightTex = (sheen) => once("nr-flight" + sheen, () => {
  const [c, g] = canvas(TW * NTILE, TH);
  for (let t = 0; t < NTILE; t++) {
    const x0 = t * TW, type = Math.floor(t / 5), nb = 8 + (t % 5), xs = type === 0 ? TW * 0.6 : TW * 0.5, sd = t * 37 + (sheen === C.blue ? 0 : 500);
    const gr = g.createLinearGradient(0, 0, 0, TH); gr.addColorStop(0, "#272735"); gr.addColorStop(0.5, "#1d1d28"); gr.addColorStop(1, "#111118");
    g.fillStyle = gr; g.fillRect(x0, 0, TW, TH);
    for (let side = 0; side < 2; side++) {   // the barbs: ticks leaving the shaft, slanting toward the tip
      const xe = side ? x0 + TW - 2 : x0 + 2, xsh = x0 + xs;
      for (let i = 0; i < nb; i++) {
        const y = TH * (0.08 + 0.88 * (i + 0.5) / nb) + (rnd(sd + i * 3 + side) - 0.5) * 8, l = 90 + 50 * rnd(sd + i + 20 + side * 9);
        g.globalAlpha = 0.75; g.strokeStyle = (i + side) % 2 ? "#454560" : "#07070b"; g.lineWidth = 1.8;
        g.beginPath(); g.moveTo(xsh, y); g.lineTo(xe, y - l * 0.35); g.stroke();
      }
    }
    g.globalAlpha = 1;
    if (type === 2) {   // the tail: two violet sheen stripes on each side of the shaft
      for (const [ux, wd, al] of [[0.22, 0.14, 0.5], [0.5, 0.1, 0.38], [0.78, 0.14, 0.5]]) {
        const gs = g.createLinearGradient(0, 0, 0, TH); gs.addColorStop(0, "rgba(91,63,138,0)"); gs.addColorStop(0.12, `rgba(91,63,138,${al})`); gs.addColorStop(0.7, `rgba(91,63,138,${al * 0.8})`); gs.addColorStop(1, "rgba(91,63,138,0)");
        g.fillStyle = gs; g.fillRect(x0 + TW * (ux - wd / 2), 0, TW * wd, TH);
      }
    } else {   // the sheen stripe on the outer (leading) web
      const sc = sheen === C.blue ? "70,100,206" : "128,88,204", a = type === 0 ? 1.0 : 0.7;
      const gs = g.createLinearGradient(0, 0, 0, TH); gs.addColorStop(0, `rgba(${sc},0)`); gs.addColorStop(0.1, `rgba(${sc},${a})`); gs.addColorStop(0.6, `rgba(${sc},${a * 0.85})`); gs.addColorStop(1, `rgba(${sc},0)`);
      g.fillStyle = gs; g.fillRect(x0 + xs + 3, 0, TW * (type === 0 ? 0.38 : 0.45), TH);
      if (type === 0) { const gt = g.createLinearGradient(0, 0, 0, TH); gt.addColorStop(0, `rgba(${sc},0)`); gt.addColorStop(0.15, `rgba(${sc},${a * 0.38})`); gt.addColorStop(0.7, `rgba(${sc},${a * 0.3})`); gt.addColorStop(1, `rgba(${sc},0)`); g.fillStyle = gt; g.fillRect(x0 + 2, 0, xs - 3, TH); }
      g.globalAlpha = 0.5; g.fillStyle = sheen === C.blue ? "#6f86d8" : "#9a78d0"; g.fillRect(x0 + xs + 14, TH * 0.12, 2, TH * 0.55); g.globalAlpha = 1;
    }
    g.strokeStyle = "#07070a"; g.lineWidth = 2.2; g.globalAlpha = 0.85; g.beginPath(); g.moveTo(x0 + xs, 0); g.lineTo(x0 + xs + (t % 3 - 1) * 0.8, TH); g.stroke();   // the shaft
    g.strokeStyle = "#4a4a5e"; g.lineWidth = 1; g.globalAlpha = 0.6; g.beginPath(); g.moveTo(x0 + xs + 2, 4); g.lineTo(x0 + xs + 2, TH * 0.9); g.stroke(); g.globalAlpha = 1;
  }
  return tex(c);
});
// contour marks: 6 tiles of 128 x 128 = 3 tones x (sheen arc or not)
const MARK_TONES = [C.black, C.black2, C.black3];
const markTex = (sheen) => once("nr-mark" + sheen, () => {
  const [c, g] = canvas(128 * 6, 128), sc = sheen === C.blue ? "58,79,154" : "91,63,138";
  for (let t = 0; t < 6; t++) {
    const x0 = t * 128, tone = MARK_TONES[t >> 1], arc = t & 1;
    const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, tone === C.black3 ? "#222230" : "#2e2e40"); gr.addColorStop(0.5, tone); gr.addColorStop(1, tone === C.black3 ? "#0c0c11" : "#121219");
    g.fillStyle = gr; g.fillRect(x0, 0, 128, 128);
    g.strokeStyle = "#070709"; g.globalAlpha = 0.7; g.lineWidth = 2; g.beginPath(); g.moveTo(x0 + 64, 4); g.lineTo(x0 + 64, 128); g.stroke();
    if (arc) { g.globalAlpha = 1; g.strokeStyle = `rgba(${sc},1)`; g.lineWidth = 11; g.beginPath(); g.arc(x0 + 64, 70, 40, Math.PI * 1.12, Math.PI * 1.88); g.stroke(); g.globalAlpha = 0.5; g.strokeStyle = sheen === C.blue ? "#7f95e6" : "#a88ae0"; g.lineWidth = 2; g.beginPath(); g.arc(x0 + 64, 70, 36, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); }
    g.globalAlpha = 0.35; g.strokeStyle = "#3a3a4a"; g.lineWidth = 1.2; for (let i = 0; i < 4; i++) { const y = 30 + i * 22; g.beginPath(); g.moveTo(x0 + 64, y); g.lineTo(x0 + 18 + i * 3, y - 14); g.moveTo(x0 + 64, y); g.lineTo(x0 + 110 - i * 3, y - 14); g.stroke(); }
    g.globalAlpha = 1;
  }
  return tex(c);
});

// the skin under the marks: rows of small overlapping feather tips, each its own tone, a few with a sheen arc (u along the spine, v round)
const skinTex = (sheen) => once("nr-skin" + sheen, () => {
  const [c, g] = canvas(512, 256), sc = sheen === C.blue ? "74,94,176" : "112,80,168"; g.fillStyle = C.black; g.fillRect(0, 0, 512, 256);
  for (let r = 0; r < 24; r++) for (let i = 0; i < 44; i++) {
    const x = (i + 0.5 * (r % 2)) * (512 / 44) + (rnd(r * 77 + i) - 0.5) * 3, y = r * 10.8 + 6, l = rnd(r * 53 + i + 5);
    g.fillStyle = l > 0.62 ? "#242432" : l > 0.25 ? C.black2 : C.black3; g.globalAlpha = 0.95; g.beginPath(); g.ellipse(x, y, 6.5, 6.8, 0, 0, Math.PI); g.fill();
    if (rnd(r * 31 + i + 9) < 0.28) { g.strokeStyle = `rgba(${sc},0.6)`; g.globalAlpha = 1; g.lineWidth = 1.4; g.beginPath(); g.arc(x, y, 5.6, 0.25, Math.PI - 0.25); g.stroke(); }
    g.globalAlpha = 0.5; g.strokeStyle = "#08080b"; g.lineWidth = 0.8; g.beginPath(); g.arc(x, y, 6.6, 0.1, Math.PI - 0.1); g.stroke(); g.globalAlpha = 1;
  }
  return tex(c);
});

// ---------------------------------------------------------------------------------------------------- the feather card set
// Every feather is a ribbon of N rows from a root along d (u the vane normal), bent by bU (up) and bS (sideways) radians at the tip, in TWO strips
// (leading and trailing half) so a feather can split. Positions are rewritten in place (set), normals are analytic. kind: 0 flight (rounded tip),
// 1 finger (outer primary: the outer 60 % narrows to 45 %), 2 covert (rounded), 3 tail (broad, blunt), 4 hackle / bristle (pointed), 5 contour mark.
function profile(kind, k) {
  const root = 0.32 + 0.68 * sstep(0, 0.2, k), e = (a, b) => Math.pow(Math.max(0, 1 - Math.pow((k - a) / (b - a), 2.4)), 0.5);
  switch (kind) {
    case 0: return root * (k > 0.66 ? e(0.66, 1) : 1) * (1 - 0.1 * Math.sin(Math.PI * k));
    case 1: return root * (1 - 0.55 * sstep(0.4, 0.58, k)) * (k > 0.72 ? e(0.72, 1) : 1);
    case 2: return (0.5 + 0.5 * sstep(0, 0.15, k)) * (k > 0.62 ? e(0.62, 1) : 1);
    case 3: return (0.45 + 0.55 * sstep(0, 0.2, k)) * (k > 0.88 ? Math.pow(Math.max(0, 1 - Math.pow((k - 0.88) / 0.12, 3)), 1 / 3) : 1);
    case 4: return (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, k * 0.8 + 0.1))) * Math.pow(Math.max(0, 1 - Math.pow(k, 1.8)), 0.8);
    default: return Math.pow(Math.max(0, Math.sin(Math.PI * (0.06 + 0.94 * k))), 0.5);
  }
}
class FeatherSet {
  constructor(n, N, material) {
    this.n = n; this.N = N; const per = (N + 1) * 4, nv = n * per;
    this.pos = new Float32Array(nv * 3); this.nor = new Float32Array(nv * 3); this.uv = new Float32Array(nv * 2); this.col = new Float32Array(nv * 3).fill(1);
    const idx = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < N; j++) { const a = i * per + j * 4, b = a + 4; for (const s of [0, 2]) idx.push(a + s, a + s + 1, b + s, a + s + 1, b + s + 1, b + s); }
    const g = new THREE.BufferGeometry();
    this.pa = new THREE.BufferAttribute(this.pos, 3); g.setAttribute("position", this.pa); this.na = new THREE.BufferAttribute(this.nor, 3); g.setAttribute("normal", this.na);
    g.setAttribute("uv", new THREE.BufferAttribute(this.uv, 2)); this.ca = new THREE.BufferAttribute(this.col, 3); g.setAttribute("color", this.ca); g.setIndex(idx);
    this.geo = g; this.mesh = new THREE.Mesh(g, material); this.mesh.frustumCulled = false; this.mesh.castShadow = false;
  }
  // F: { r, d, u, len, w (full width), lead (leading share), bU, bS, kind, tile: [u0, u1], gap, gapAt, notch, notchAt, col }
  set(i, F) {
    const N = this.N, per = (N + 1) * 4, d = norm(F.d);
    const u = norm(sub(F.u, mul(d, dot(F.u, d)))), side = cross(d, u), L = F.len, lead = F.lead ?? 0.5, bU = F.bU ?? 0, bS = F.bS ?? 0, W = F.w;
    for (let j = 0; j <= N; j++) {
      const k = j / N, p = add(add(add(F.r, mul(d, L * k)), mul(u, L * bU * k * k / 2)), mul(side, L * bS * k * k / 2));
      const t = norm(add(add(d, mul(u, bU * k)), mul(side, bS * k))), ld = norm(cross(t, u)), nn = cross(ld, t), s = profile(F.kind, k);
      let hl = W * lead * s, ht = W * (1 - lead) * s;
      if (F.notch) { const q = Math.abs(k - F.notchAt) / 0.07; if (q < 1) ht *= 1 - F.notch * (1 - q); }
      const g = (F.gap || 0) * sstep(F.gapAt ?? 0.4, (F.gapAt ?? 0.4) + 0.12, k) * (k > 0.97 ? 0 : 1), gl = Math.min(g / 2, hl * 0.8), gt = Math.min(g / 2, ht * 0.8);
      const pts = [add(p, mul(ld, gl)), add(p, mul(ld, hl)), sub(p, mul(ld, gt)), sub(p, mul(ld, ht))], offs = [gl, hl, -gt, -ht];
      for (let v = 0; v < 4; v++) {
        const o = (i * per + j * 4 + v), q = pts[v];
        this.pos[o * 3] = q[0]; this.pos[o * 3 + 1] = q[1]; this.pos[o * 3 + 2] = q[2]; this.nor[o * 3] = nn[0]; this.nor[o * 3 + 1] = nn[1]; this.nor[o * 3 + 2] = nn[2];
        const uu = (offs[v] + W * (1 - lead)) / W; this.uv[o * 2] = F.tile[0] + clamp(uu) * (F.tile[1] - F.tile[0]); this.uv[o * 2 + 1] = k;
        if (F.col) { this.col[o * 3] = F.col[0]; this.col[o * 3 + 1] = F.col[1]; this.col[o * 3 + 2] = F.col[2]; }
      }
    }
  }
  done() { this.pa.needsUpdate = true; this.na.needsUpdate = true; this.ca.needsUpdate = true; }
}
const flightTile = (i) => { const u0 = (i * TW + 1) / (TW * NTILE), u1 = ((i + 1) * TW - 1) / (TW * NTILE); return [u0, u1]; };
const markTile = (i) => [(i * 128 + 2) / (128 * 6), ((i + 1) * 128 - 2) / (128 * 6)];

// ---------------------------------------------------------------------------------------------------- the body and head sections
const BODY = [[-0.128, 0.000, 0.014, 0.016, 0.015], [-0.118, 0.002, 0.030, 0.032, 0.030], [-0.095, 0.004, 0.048, 0.050, 0.048], [-0.055, 0.004, 0.060, 0.062, 0.062], [-0.005, 0.002, 0.0625, 0.064, 0.066], [0.040, 0.004, 0.060, 0.062, 0.062], [0.085, 0.008, 0.051, 0.053, 0.051], [0.115, 0.010, 0.041, 0.043, 0.041], [0.130, 0.012, 0.034, 0.036, 0.034]];
const HEAD = [[-0.031, 0.021, -0.018, 0.0165], [-0.020, 0.0225, -0.021, 0.0225], [-0.005, 0.0225, -0.0205, 0.0250], [0.010, 0.0215, -0.0185, 0.0245], [0.022, 0.0190, -0.0155, 0.0215], [0.034, 0.0160, -0.0120, 0.0175]];   // z, top, bottom, half width
const UPPER = [[0.026, 0.0165, 0.0010, 0.0108], [0.050, 0.0130, 0.0005, 0.0098], [0.072, 0.0088, -0.0010, 0.0078], [0.090, 0.0040, -0.0022, 0.0048], [0.100, 0.0008, -0.0034, 0.0018]];
const LOWER = [[0.008, 0.0020, -0.0160, 0.0130], [0.031, 0.0010, -0.0100, 0.0098], [0.055, 0.0000, -0.0098, 0.0082], [0.075, -0.0012, -0.0088, 0.0060], [0.088, -0.0024, -0.0078, 0.0036], [0.0955, -0.0030, -0.0068, 0.0015]];
const HINGE = [0, -0.004, 0.008];
const crSec = (A, z, m) => {   // Catmull-Rom through rows [z, ...]: value m at z
  let k = A.length - 2; for (let i = 0; i < A.length - 1; i++) if (z <= A[i + 1][0]) { k = i; break; }
  const f = clamp((z - A[k][0]) / (A[k + 1][0] - A[k][0])), p = (j) => A[Math.max(0, Math.min(A.length - 1, j))][m];
  const a = p(k - 1), b = p(k), c = p(k + 1), d = p(k + 2);
  return 0.5 * (2 * b + (c - a) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (3 * b - a - 3 * c + d) * f * f * f);
};
// the body skin point at section z, angle ang (0 = +x flank, pi/2 the back, -pi/2 the belly)
function bodySkin(z, ang) {
  const cy = crSec(BODY, z, 1), w = Math.max(0.006, crSec(BODY, z, 2)), up = Math.max(0.006, crSec(BODY, z, 3)), dn = Math.max(0.006, crSec(BODY, z, 4)), e = 2 / 2.15, co = Math.cos(ang), si = Math.sin(ang);
  return [Math.sign(co) * Math.abs(co) ** e * w, cy + Math.sign(si) * Math.abs(si) ** e * (si > 0 ? up : dn), z];
}
function headSkin(z, ang) {
  const top = crSec(HEAD, z, 1), bot = crSec(HEAD, z, 2), w = crSec(HEAD, z, 3), cy = (top + bot) / 2, h = (top - bot) / 2, e = 2 / 2.2, co = Math.cos(ang), si = Math.sin(ang);
  return [Math.sign(co) * Math.abs(co) ** e * w, cy + Math.sign(si) * Math.abs(si) ** e * h, z];
}
// a mark standing on a skin: root, direction (tailward along the skin, tilted off it by `tilt`), vane up = the outward normal
function skinMark(skin, z, ang, dz, tilt) {
  const p = skin(z, ang), pz = skin(z + dz, ang), pa = skin(z, ang + 0.02), pb = skin(z, ang - 0.02);
  const tz = norm(sub(pz, skin(z - dz, ang))), ta = norm(sub(pa, pb)); let n = norm(cross(ta, tz)); if (dot(n, sub(p, [0, p[1] * 0.5, 0])) < 0) n = mul(n, -1);
  return { p, n, back: norm(add(mul(tz, -1), mul(n, tilt))) };
}

// ---------------------------------------------------------------------------------------------------- wing layout
// Wing plane: +x outward, +z the leading edge, -z back, +y the vane normal. Right-wing numbers; the left wing is this mirrored by the group's scale.
// Three key poses blend: fold (wings 0), spread (1), brake (the landing cup). Positions are the wrist W and the hand tip H from the shoulder.
const POSES = {
  fold: { W: [0.034, 0.020, 0.050], H: [0.016, 0.012, -0.088], roll: -46, tip: 0.0 },
  spread: { W: [0.142, 0.0, 0.048], H: [0.254, 0.0, 0.024], roll: 5 },
  brake: { W: [0.112, 0.040, 0.090], H: [0.178, 0.095, 0.136], roll: 30 },
};
const PSI = {   // absolute plane angles per feather (deg from +x toward -z) for fold / spread / brake
  P: { fold: [117, 117, 116, 116, 115, 115, 114, 114, 113, 113], spr: [86, 76, 66, 56, 47, 39, 32, 26, 20, 15], brk: [58, 46, 34, 23, 12, 2, -8, -16, -24, -32] },
  S: { fold: [96, 98, 100, 102, 104, 106, 108, 110, 112, 114, 116], spr: [80, 81.5, 83, 84.5, 86, 87.5, 89, 90.5, 92, 93.5, 95], brk: [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70] },
  T: { fold: [108, 109, 110], spr: [100, 106, 112], brk: [80, 85, 90] },
  TH: { fold: [112, 112, 112], spr: [-42, -26, -10], brk: [-62, -46, -30] },
};
const P_LEN = [0.160, 0.190, 0.215, 0.240, 0.255, 0.265, 0.270, 0.262, 0.225, 0.175];
const S_LEN = [0.130, 0.134, 0.138, 0.142, 0.145, 0.148, 0.150, 0.149, 0.146, 0.141, 0.136];
const T_LEN = [0.140, 0.130, 0.120];
const TH_LEN = [0.050, 0.058, 0.066];
// count of the classes in the order the layout writes them
const WING_N = { P: 10, S: 11, T: 3, PC: 9, GC: 11, MC: 13, TH: 3 };
const WING_TOTAL = 60;
// which 4 of the 60 feathers split (6.7 %): the lowest hashes, the same for both wings of a bird
const splitSet = (who, sd) => { const h = []; for (let i = 0; i < WING_TOTAL; i++) h.push([rnd(who * 131 + sd * 17 + i * 3.7 + 9), i]); h.sort((a, b) => a[0] - b[0]); return new Set(h.slice(0, 4).map((x) => x[1])); };
const TINT = { P: [[0.95, 0.2, 0.2], [0.6, 0.08, 0.08]], S: [[0.3, 0.55, 1], [0.1, 0.28, 0.7]], T: [[0.25, 0.9, 0.4], [0.1, 0.55, 0.2]], PC: [[1, 0.8, 0.2], [0.75, 0.55, 0.08]], GC: [[1, 0.8, 0.2], [0.75, 0.55, 0.08]], MC: [[1, 0.8, 0.2], [0.75, 0.55, 0.08]], TH: [[1, 0.45, 0.85], [0.7, 0.2, 0.55]] };

// o: { w, br, roll (deg), rollH (deg, extra at the wrist), open (0..1 fingers), bend (rad on primaries), flex (deg amplitude), t, who, sd, tint }
function wingLayout(o) {
  const w = clamp(o.w), b = clamp(o.br), F = [];
  const bl = (a, key) => { const pa = mix(a.fold, a.spr, w); return b > 0 ? mix(pa, a.brk, b) : pa; };
  const pose = (k) => { const a = mix(POSES.fold[k], POSES.spread[k], w); return b > 0 ? mix(a, POSES.brake[k], b) : a; };
  const Wp = pose("W"), Hp = pose("H");
  const roll0 = lerp(lerp(POSES.fold.roll, POSES.spread.roll, w), POSES.brake.roll, b) + o.roll;
  const sdN = o.sd, split = splitSet(o.who, sdN);
  const psiOf = (cls, i) => { const t = PSI[cls], a = lerp(t.fold[i], t.spr[i], w); return b > 0 ? lerp(a, t.brk[i], b) : a; };
  const rollS = roll0 * DEG, rollH = o.rollH * DEG;
  // a feather attached on the arm (rotates with the shoulder) or the hand (also rotates round the wrist)
  const place = (root, psi, onHand, lift) => {
    let r = add(root, [0, lift, 0]), d = planeDir(psi), u = [0, 1, 0];
    if (onHand) { r = add(Wp, rz(sub(r, Wp), rollH)); d = rz(d, rollH); u = rz(u, rollH); }
    return { r: rz(r, rollS), d: rz(d, rollS), u: rz(u, rollS) };
  };
  let n = 0;
  const push = (cls, i, root, psi, onHand, lift, len, wd, kind, lead, bU, tileBase, extra = {}) => {
    const pl = place(root, psi, onHand, lift), idx = n++;
    const tile = flightTile(tileBase + Math.floor(rnd(o.who * 53 + sdN * 7 + idx * 1.3 + 4) * 5));
    const f = { ...pl, len, w: wd, lead, bU, bS: extra.bS ?? 0, kind, tile, ...extra };
    if (split.has(idx)) { f.gap = 0.0034; f.gapAt = 0.38 + 0.12 * rnd(idx + 60); }
    { const b = 0.82 + 0.4 * rnd(o.who * 91 + sdN * 13 + idx * 2.1 + 6); f.col = o.tint ? TINT[cls][i % 2] : [b, b, b * 1.04]; }
    F.push(f); return f;
  };
  const arm = (t) => mul(Wp, t), hand = (t) => add(Wp, mul(sub(Hp, Wp), t));
  const bendP = o.bend, flexJ = (i) => o.flex * Math.sin(TAU * (0.35 * o.t + 0.37 * i + 0.11 * sdN)) * DEG;
  // thumb feathers (alula) first in the draw order does not matter: the layout order is the count order below
  for (let i = 0; i < 10; i++) {   // primaries, inner to outer; the outer 5 are the fingers
    const t = 0.03 + 0.95 * i / 9, open = o.open * (i >= 4 ? (i - 3) * 2.4 : 0);
    push("P", i, add(hand(t), [0, 0, -0.004]), psiOf("P", i) + open + (flexJ(i) / DEG), true, -0.0018 - 0.00012 * i, P_LEN[i], 0.0275 - 0.0012 * (i % 3), i >= 5 ? 1 : 0, 0.40, bendP * (0.55 + 0.45 * i / 9) + flexJ(i) * 0.35 + 0.05 * w, 0);
  }
  for (let i = 0; i < 11; i++) {   // secondaries, S1 next to the hand to S11 next to the body (the notch is in S6 of the left wing of who 1)
    const t = lerp(0.93, 0.22, i / 10), ex = (o.who === 1 && sdN > 0 && i === 5) ? { notch: 0.9, notchAt: 0.86 } : {};
    push("S", i, add(arm(t), [0, 0, -0.008]), psiOf("S", i), false, -0.0004 + 0.0001 * i, S_LEN[i], 0.031, 0, 0.45, bendP * 0.45 + 0.03 * w, 0, ex);
  }
  for (let i = 0; i < 3; i++) push("T", i, add(arm([0.12, 0.06, 0.0][i]), [0, 0, -0.012]), psiOf("T", i), false, 0.0016 + 0.0003 * i, T_LEN[i], 0.036, 0, 0.5, bendP * 0.3 + 0.02 * w, 5);
  for (let i = 0; i < 9; i++) {   // primary coverts over the primaries' bases
    const t = 0.05 + 0.9 * i / 8; push("PC", i, add(hand(t), [0, 0, 0]), psiOf("P", i), true, 0.0036, 0.098 - 0.002 * i, 0.0225, 2, 0.5, bendP * 0.3, 5);
  }
  for (let i = 0; i < 11; i++) {   // greater secondary coverts
    const t = lerp(0.93, 0.22, i / 10); push("GC", i, add(arm(t), [0, 0, 0.002]), psiOf("S", i), false, 0.0042, 0.078 - 0.002 * (i % 4), 0.0265, 2, 0.5, bendP * 0.2, 5);
  }
  for (let i = 0; i < 13; i++) {   // median and lesser coverts along the leading half of the arm
    const t = 0.10 + 0.86 * i / 12; push("MC", i, add(arm(t), [0, 0, 0.014]), lerp(psiOf("S", 0), psiOf("S", 10), i / 12), false, 0.0056, 0.05 + 0.004 * (i % 3), 0.023, 2, 0.5, bendP * 0.1, 5);
  }
  for (let i = 0; i < 3; i++) push("TH", i, add(Wp, [0.004 * i, 0, 0.007]), psiOf("TH", i), true, 0.0075, TH_LEN[i], 0.0145, 1, 0.5, 0.05 + bendP * 0.2, 5);
  return F;
}
export function ravenCounts() {
  return {
    wing: { total: WING_TOTAL, ...WING_N, coverts: WING_N.PC + WING_N.GC + WING_N.MC, split: 4 }, tail: 12, hackles: 16, bristles: 14,
    contour: ROW_COUNTS.reduce((a, b) => a + b, 0), rows: ROW_COUNTS.length, crown: 60, thigh: 14, neck: 24, rings: 7, toes: "3 + 1 a foot",
  };
}
const ROW_COUNTS = [10, 12, 14, 15, 16, 16, 15, 14, 13, 12, 13];

// ---------------------------------------------------------------------------------------------------- hashed idle life
// events at cumulative hashed gaps: returns { k, T } with T the start of the event active at t (T_0 = first)
function eventAt(t, seed, lo, hi, salt) {
  let T = lo * (0.3 + rnd(seed + salt)), k = 0, prev = 0;
  for (; k < 400; k++) { const g = lo + (hi - lo) * rnd(seed * 3.1 + salt * 7.7 + k + 1); if (T + g > t) return { k, T, prev: prev, next: T + g }; prev = T; T += g; }
  return { k, T, prev, next: T + 3 };
}
const SNAP_DIRS = {
  1: [[0.0, 0.0], [0.30, 0.05], [-0.34, -0.1], [0.12, 0.38], [-0.14, -0.3]],
  2: [[0.62, 0.0], [0.86, 0.1], [0.4, -0.12], [0.7, 0.32], [0.34, 0.24]],
};

// ---------------------------------------------------------------------------------------------------- the kind
export const NORSE_RAVEN_KINDS = {
  norseraven(P) {
    const S = P.spec || {}, who = S.who === 2 ? 2 : 1, whoK = who === 2 ? 1.04 : 0.96, seed = S.seed ?? who * 17.3, sheen = who === 2 ? C.violet : C.blue;
    const G = new THREE.Group(); P.whole.add(G); G.scale.setScalar(whoK);
    const DS = THREE.DoubleSide, ink = (m) => { m.userData.lineColor = "#07070c"; m.userData.noShine = true; m.userData.krimK = 0; return m; };
    const fTex = flightTex(sheen), mTex = markTex(sheen);
    const bodyM = ink(mat("#ffffff", { map: mTex, roughness: 0.34, metalness: 0.05, side: DS })), skinM = ink(mat("#ffffff", { map: skinTex(sheen), roughness: 0.4 }));
    const wingM = ink(mat("#ffffff", { map: fTex, roughness: 0.3, side: DS, vertexColors: true })), tailM = ink(mat("#ffffff", { map: fTex, roughness: 0.34, side: DS, vertexColors: true })); wingM.userData.noHatch = tailM.userData.noHatch = true;
    const tintM = new THREE.MeshBasicMaterial({ vertexColors: true, side: DS, toneMapped: false }); tintM.userData.noOutline = true;
    const beakM = ink(mat(C.beak, { roughness: 0.28 })), beakLM = mat(C.beakLight, { roughness: 0.9 }), tipM = mat(C.beakTip, { roughness: 0.4 });
    const legM = ink(mat(C.leg, { roughness: 0.6 })), clawM = mat(C.claw, { roughness: 0.4 });

    // ---- the body: one skin, breast to rump; marks and thigh feathers ride the same group (torsoG breathes and shakes)
    const bodyG = new THREE.Group(); bodyG.rotation.order = "YXZ"; bodyG.position.set(0, 0.112, -0.004); G.add(bodyG);
    const torsoG = new THREE.Group(); bodyG.add(torsoG);
    const bSecs = BODY.map(([z, cy, w, up, dn]) => ({ c: [0, cy, z], w, up, dn, n: 2.15 }));
    const bl = makeLoft(bSecs, { sub: 4, radial: 28, ref: [0, 1, 0] }); mesh(bl, skinM, torsoG);
    // 150 contour marks in 11 rows, 0.012-0.022 long, 3 tones, a sheen arc on 40 %
    { const nM = ROW_COUNTS.reduce((a, b) => a + b, 0), set = new FeatherSet(nM, 3, bodyM); let q = 0;
      ROW_COUNTS.forEach((cnt, r) => {
        const z = 0.108 - r * 0.0216;
        for (let i = 0; i < cnt; i++) {
          const jit = (rnd(r * 91 + i * 7 + 1) - 0.5) * 0.5, ang = -Math.PI / 2 + ((i + 0.5 * (r % 2) + jit) / cnt) * TAU, len = 0.012 + 0.010 * rnd(r * 53 + i * 3 + 2);
          const m = skinMark(bodySkin, z, ang, 0.004, 0.06 + 0.10 * rnd(q + 8)), tone = Math.floor(rnd(q * 1.7 + 11) * 3), arc = rnd(q * 2.3 + 17) < 0.4 ? 1 : 0;
          set.set(q, { r: add(add(m.p, mul(m.back, -len * 0.45)), mul(m.n, 0.0016)), d: m.back, u: m.n, len, w: len * 0.78, lead: 0.5, bU: 0.18, kind: 2, tile: markTile(tone * 2 + arc) }); q++;
        }
      });
      set.done(); torsoG.add(set.mesh); P.marks = set; }
    // 14 loose thigh feathers hanging over the legs
    { const set = new FeatherSet(14, 3, bodyM);
      for (let i = 0; i < 14; i++) {
        const sd = i % 2 ? 1 : -1, j = i >> 1, z = -0.05 + j * 0.016 + 0.006 * rnd(i + 3), ang = sd > 0 ? -0.35 - 0.1 * rnd(i + 5) : -Math.PI + 0.35 + 0.1 * rnd(i + 5), p = bodySkin(z, ang), len = 0.026 + 0.014 * rnd(i + 6);
        set.set(i, { r: add(p, [0, 0.004, 0]), d: norm([sd * 0.2, -0.75, -0.45 - 0.1 * rnd(i + 7)]), u: norm([sd, 0.1, 0]), len, w: 0.026, lead: 0.5, bU: -0.15, bS: 0, kind: 2, tile: markTile(Math.floor(rnd(i + 30) * 3) * 2) });
      }
      set.done(); torsoG.add(set.mesh); }

    // ---- the tail: 12 feathers, a wedge (centre pair 0.20, outer pair 0.145), pivot at the rump
    const tailG = new THREE.Group(); tailG.position.set(0, 0.004, -0.105); bodyG.add(tailG);
    const tail = new FeatherSet(12, 7, tailM); tailG.add(tail.mesh);
    const tailPose = (fan, key) => {
      for (let k = 0; k < 12; k++) {
        const o = k - 5.5, j = Math.abs(o) - 0.5, len = 0.200 - 0.055 * Math.pow(j / 5, 1.15), a = (o / 5.5) * (Math.max(fan, 5) / 2) * DEG;
        const bent = who === 2 && k === 3 ? 10 * DEG : 0, d = [Math.sin(a), 0, -Math.cos(a)];
        { const b = 0.85 + 0.35 * rnd(who * 71 + k * 3.3); var tcol = [b, b, b * 1.04]; }
        tail.set(k, { col: tcol, r: [o * 0.0046, 0.0016 * (5 - j), 0], d, u: [0, 1, 0], len, w: 0.034, lead: 0.5, bU: 0.06 + 0.0006 * fan, bS: bent, kind: 3, tile: flightTile(10 + (k % 5)) });
      }
      tail.done(); void key;
    };

    // ---- the neck and head. The neck is a lofted skin in G (from the breast to the back of the skull); the head is its own group.
    const neckSecs = 6, neckLoft = makeLoft(Array.from({ length: neckSecs }, () => ({ c: [0, 0, 0], w: 0.03, up: 0.03, dn: 0.03, n: 2.1 })), { sub: 3, radial: 18, ref: [0, 1, 0] });
    mesh(neckLoft, skinM, G);
    const headG = new THREE.Group(); headG.rotation.order = "YXZ"; G.add(headG);
    { const s = HEAD.map(([z, top, bot, w]) => ({ c: [0, (top + bot) / 2, z], w, up: (top - bot) / 2, dn: (top - bot) / 2, n: 2.2 })), hl = makeLoft(s, { sub: 4, radial: 24, ref: [0, 1, 0] }); mesh(hl, skinM, headG); }
    // the beak: upper half fixed to the head, lower half hinged; matte ridge light, a paler tip, nostril grooves, 14 bristles
    const sec = (A) => A.map(([z, top, bot, w]) => ({ c: [0, (top + bot) / 2, z], w, up: (top - bot) / 2, dn: (top - bot) / 2, n: 2.4 }));
    mesh(makeLoft(sec(UPPER), { sub: 5, radial: 16, ref: [0, 1, 0] }), beakM, headG);
    const lowerG = new THREE.Group(); lowerG.position.set(...HINGE); headG.add(lowerG);
    mesh(makeLoft(sec(LOWER).map((s) => ({ ...s, c: [s.c[0] - HINGE[0], s.c[1] - HINGE[1], s.c[2] - HINGE[2]] })), { sub: 5, radial: 14, ref: [0, 1, 0] }), beakM, lowerG);
    { const pts = UPPER.map(([z, top]) => new THREE.Vector3(0, top + 0.0004, z)); const rd = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, 0.0017, 5), beakLM, headG); rd.castShadow = false; rd.material.userData.noOutline = true; }
    { const tp = mesh(new THREE.SphereGeometry(1, 10, 8), tipM, headG, 0, -0.0012, 0.0965); tp.scale.set(0.0026, 0.0034, 0.0056); tp.castShadow = false; tp.material.userData.noOutline = true;
      const tl = mesh(new THREE.SphereGeometry(1, 8, 6), tipM, lowerG, 0.0, -0.0049 - HINGE[1], 0.0925 - HINGE[2]); tl.scale.set(0.0012, 0.0016, 0.0032); tl.castShadow = false; }
    const nostM = mat(C.deep, { roughness: 0.9 });
    for (const sd of [-1, 1]) { const ns = mesh(new THREE.SphereGeometry(1, 8, 6), nostM, headG, sd * 0.0071, 0.0071, 0.0415); ns.scale.set(0.0011, 0.0016, 0.0068); ns.rotation.y = -sd * 0.12; ns.castShadow = false; ns.material.userData.noOutline = true; }
    { const set = new FeatherSet(14, 2, mat(C.deep, { roughness: 0.6, side: DS }));   // 14 bristles over the first 40 % of the beak (z 0.031 .. 0.058)
      for (let i = 0; i < 14; i++) {
        const sd = i % 2 ? 1 : -1, j = i >> 1, z = 0.0325 + j * 0.0036, x = sd * (0.0062 + 0.0006 * j), y = 0.0112 - 0.0012 * j + 0.001 * rnd(i + 70);
        set.set(i, { r: [x, y, z], d: norm([sd * (0.3 + 0.05 * j), 0.12 - 0.02 * j, 0.95]), u: [0, 1, 0], len: 0.016 + 0.009 * rnd(i + 72), w: 0.0024, lead: 0.5, bU: 0.1, kind: 4, tile: [0, 1] });
      }
      set.done(); set.mesh.material.userData.noOutline = true; headG.add(set.mesh); }
    if (who === 2) { const sc = mesh(new THREE.SphereGeometry(1, 8, 6), mat(C.scar, { roughness: 0.7 }), headG, -0.0088, 0.0006, 0.0535); sc.scale.set(0.0007, 0.0009, 0.006); sc.rotation.set(0.0, 0.0, 0.0); sc.rotation.x = -0.05; sc.castShadow = false; sc.material.userData.noOutline = true; }
    // the inside of the mouth: a roof under the upper beak, a floor and the tongue on the lower half (only seen open)
    const gape = mesh(new THREE.SphereGeometry(1, 10, 6), mat(C.mouth, { roughness: 0.55 }), lowerG, 0, -0.0012 - HINGE[1], 0.052 - HINGE[2]); gape.scale.set(0.0074, 0.0016, 0.036); gape.castShadow = false; gape.material.userData.noOutline = true;
    const tongue = mesh(new THREE.SphereGeometry(1, 10, 6), mat(C.tongue, { roughness: 0.5 }), lowerG, 0, -0.0004 - HINGE[1], 0.060 - HINGE[2]); tongue.scale.set(0.0036, 0.0013, 0.030); tongue.castShadow = false; tongue.material.userData.noOutline = true;
    const roof = mesh(new THREE.SphereGeometry(1, 10, 6), mat(C.mouth, { roughness: 0.55 }), headG, 0, 0.0004, 0.056); roof.scale.set(0.0066, 0.0012, 0.032); roof.castShadow = false; roof.material.userData.noOutline = true;
    // eyes: dark brown r 0.0055, a catch-light 0.002, a lid ring, the pale third lid
    const third = [], thirdM = mat(C.third, { roughness: 0.5, side: DS });
    for (const sd of [-1, 1]) {
      const eg = new THREE.Group(); eg.position.set(sd * 0.0236, 0.0050, -0.0040); eg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(sd, 0.06, 0.34).normalize()); headG.add(eg);
      mesh(new THREE.SphereGeometry(0.0055, 14, 10), mat(C.eye, { roughness: 0.15 }), eg).castShadow = false;
      const ring = mesh(new THREE.TorusGeometry(0.0064, 0.0012, 6, 16), mat(C.lid, { roughness: 0.7 }), eg, 0, 0, 0.0008); ring.castShadow = false; ring.material.userData.noOutline = true;
      const cl = new THREE.Mesh(new THREE.CircleGeometry(0.002, 8), new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false })); cl.position.set(-sd * 0.0016, 0.0022, 0.0054); cl.material.userData.noOutline = true; eg.add(cl);
      const tl = mesh(new THREE.SphereGeometry(0.0059, 12, 8, 0, TAU, 0, Math.PI / 2), thirdM, eg); tl.castShadow = false; tl.material.userData.noOutline = true; tl.visible = false; third.push(tl);
    }
    // 60 crown marks over the skull (3 of them stand 0.008 on who 2); 16 throat hackles in 3 rows (5, 5, 6)
    const standing = who === 2 ? new Set([24, 33, 41]) : new Set();
    { const set = new FeatherSet(60, 3, bodyM); let q = 0;
      for (let r = 0; r < 6; r++) for (let i = 0; i < 10; i++) {
        const z = -0.027 + r * 0.0105, ang = lerp(0.35, Math.PI - 0.35, (i + 0.5 * (r % 2) + (rnd(r * 31 + i + 3) - 0.5) * 0.4) / 10), len = 0.008 + 0.004 * rnd(r * 17 + i * 5 + 2);
        const m = skinMark(headSkin, z, ang, 0.003, 0.05), st = standing.has(q);
        set.set(q, { r: add(add(m.p, mul(m.back, -len * 0.4)), mul(m.n, st ? 0.003 : 0.001)), d: st ? norm(add(m.n, mul(m.back, 0.55))) : m.back, u: st ? m.back : m.n, len: st ? 0.008 + 0.002 : len, w: len * 0.85, lead: 0.5, bU: 0.1, kind: 2, tile: markTile(Math.floor(rnd(q + 3) * 3) * 2 + (rnd(q + 9) < 0.3 ? 1 : 0)) }); q++;
      }
      set.done(); headG.add(set.mesh); }
    const hackle = new FeatherSet(16, 3, bodyM); headG.add(hackle.mesh);
    const HK = []; { let q = 0; for (const [row, cnt, z] of [[0, 5, 0.024], [1, 5, 0.008], [2, 6, -0.008]]) for (let i = 0; i < cnt; i++) {
      const ang = -Math.PI / 2 + (((i + 0.5) / cnt) - 0.5) * 2.2, lenB = 0.022 + 0.016 * rnd(row * 13 + i * 3 + 40) * (row === 2 ? 1 : 0.8) + 0.004 * row;
      HK.push({ z, ang, len: lenB * (who === 2 ? 1.15 : 1), q: q++ }); } }
    const hackleSet = (lift) => {
      for (const h of HK) {
        const p = headSkin(h.z, h.ang), n = norm([Math.cos(h.ang), Math.sin(h.ang), 0]), d0 = norm([-0.12 * Math.cos(h.ang), -0.28 * Math.max(0, -Math.sin(h.ang)) - 0.05, -1]), a = lift * 35 * DEG;
        const d = norm(add(mul(d0, Math.cos(a)), mul(n, Math.sin(a)))), uu = cross(d, [1, 0, 0]);
        hackle.set(h.q, { r: add(p, mul(n, 0.0008)), d, u: norm(uu), len: h.len, w: 0.0066, lead: 0.5, bU: 0.12, kind: 4, tile: markTile(Math.floor(rnd(h.q + 50) * 3) * 2) });
      }
      hackle.done();
    };
    // 24 neck marks over the joint of neck and body (extra, they hide the seam)
    const neckMarks = new FeatherSet(24, 3, bodyM); G.add(neckMarks.mesh);

    // ---- the wings: 60 feathers each (own FeatherSet), hold groups on the body's shoulders
    const wings = [];
    for (const sd of [1, -1]) {
      const hold = new THREE.Group(); hold.scale.x = sd; hold.position.set(sd * 0.056, 0.044 + (sd > 0 ? 0.0035 : 0), 0.022); bodyG.add(hold);
      const set = new FeatherSet(WING_TOTAL, 7, wingM); hold.add(set.mesh); wings.push({ set, sd });
    }
    // ---- legs and toes
    const legs = [];
    for (const sd of [1, -1]) {
      const lg = new THREE.Group(); G.add(lg);
      const tar = new THREE.Group(); lg.add(tar);
      const shaft = mesh(new THREE.CylinderGeometry(0.0038, 0.0043, 1, 8), legM, tar); shaft.position.y = 0.5; shaft.castShadow = false;
      const rings = []; for (let i = 0; i < 7; i++) { const r = mesh(new THREE.TorusGeometry(0.0044, 0.0008, 4, 10), mat("#1a191d"), tar, 0, 0.005 + i * 0.0075, 0); r.rotation.x = Math.PI / 2; r.castShadow = false; r.material.userData.noOutline = true; rings.push(r); }
      const ankle = mesh(new THREE.SphereGeometry(0.0052, 8, 6), legM, lg); ankle.castShadow = false;
      const toeG = new THREE.Group(); lg.add(toeG);
      legs.push({ sd, lg, tar, shaft, rings, toeG, key: "" });
    }
    const toeMat = legM;
    const buildToes = (L, perchR, grip, spread, curl) => {
      for (let i = L.toeG.children.length - 1; i >= 0; i--) { const c = L.toeG.children[i]; c.geometry && c.geometry.dispose(); L.toeG.remove(c); }
      const Rc = perchR + 0.0034, kap = lerp(lerp(1 / 0.028, 1 / 0.2, spread), 1 / Rc, grip) * (1 + curl * 0.0);
      const toes = [[-13 * L.sd, 0.036], [0, 0.042], [13 * L.sd, 0.036], [180, 0.030]];
      for (const [yaw, len] of toes) {
        const ya = (yaw * (1 + spread * 0.8)) * DEG, dir = [Math.sin(ya), 0, Math.cos(ya)], pts = [];
        const a = Math.min(len * kap, 2.2), segs = 7;
        for (let s = 0; s <= segs; s++) { const f = s / segs, ph = a * f, r = 1 / kap, hh = r * Math.sin(ph), vv = r * (Math.cos(ph) - 1); pts.push(new THREE.Vector3(dir[0] * hh, 0.0032 + vv, dir[2] * hh)); }
        const tube = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.0033, 5), toeMat, L.toeG); tube.castShadow = false;
        for (const f of [0.38, 0.72]) { const q = pts[Math.round(f * segs)], pad = mesh(new THREE.SphereGeometry(0.0041, 6, 5), toeMat, L.toeG, q.x, q.y, q.z); pad.castShadow = false; pad.material.userData.noOutline = true; }
        const e = pts[segs], pe = pts[segs - 1], tg = new THREE.Vector3().subVectors(e, pe).normalize(), cd = tg.clone().add(new THREE.Vector3(0, -0.45, 0)).normalize();
        const claw = mesh(new THREE.ConeGeometry(0.0029, 0.012, 6), clawM, L.toeG, e.x + cd.x * 0.005, e.y + cd.y * 0.005, e.z + cd.z * 0.005); claw.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), cd); claw.castShadow = false; claw.material.userData.noOutline = true;
      }
    };

    // ---- state -> pose
    const STATE = NORSE_RAVEN_STATE.norseraven; let neckKey = "", wingKey = "", tailKey = "", hackKey = "", toeKey = "";
    const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
    const pose = (ps, t) => {
      const g = (k) => num(ps, S, k, STATE[k]);
      const wings_ = clamp(g("wings")), flap = g("flap"), glide = clamp(g("glide")), br = clamp(g("brake")), grip = clamp(g("grip")), lean = clamp(g("lean"), -1, 1);
      const hY = clamp(g("headYaw"), -1.2, 1.2), hP = clamp(g("headPitch"), -1.2, 1.2), hR = clamp(g("headRoll"), -1.2, 1.2), talk = clamp(g("talk")), ruff = clamp(g("ruff")), shake = clamp(g("shake")), hop = clamp(g("hop")), blink = clamp(g("blink")), tint = g("tint");
      const idle = S.idle === 0 ? 0 : 1, alive = idle * grip * (1 - br), perchR = g("perchR"), sd0 = seed;
      const wEff = Math.max(wings_, glide, 0.32 * Math.sin(Math.PI * hop) ** 1.5, br);
      // wing beat
      const q = (((flap + 0.2855) % 1) + 1) % 1, stroke = (qq) => { qq = ((qq % 1) + 1) % 1; if (qq < 0.55) { const s = qq / 0.55; return [7.5 + 42.5 * Math.cos(Math.PI * s), Math.sin(Math.PI * s)]; } const s = (qq - 0.55) / 0.45; return [7.5 - 42.5 * Math.cos(Math.PI * s), -0.35 * Math.sin(Math.PI * s)]; };
      const A = sstep(0.4, 0.9, wings_) * (1 - 0.6 * br), [a0, v0] = stroke(q), [a1] = stroke(q - 0.07), dA = A * (a0 - 4.2), dH = A * (a1 - 4.2);
      const roll = dA * 0.62, rollH = dH * 0.38;   // the shoulder carries 62 % of the stroke, the wrist the rest, 0.07 of a beat late
      const open = A * (q >= 0.55 ? Math.sin(Math.PI * (q - 0.55) / 0.45) : 0), bend = A * (v0 > 0 ? 0.2094 * v0 : 0.08 * v0) + 0.1 * wEff;
      const bob = -0.015 * clamp((a0 - 7.5) / 42.5, -1.1, 1.1) * A;
      // body pose
      const flightK = 1 - grip, leanA = Math.abs(lean), sh = shake > 0 && shake < 1 ? Math.sin(Math.PI * shake) : 0;
      let pitch = lerp(40, 14, flightK); pitch = lerp(pitch, 55, br); pitch -= 35 * leanA;
      const yawB = 40 * lean * DEG, breath = alive * 0.002 * Math.sin(TAU * 0.8 * t + sd0) / 0.065;
      const hh = 0.05 * Math.sin(Math.PI * hop);
      G.position.y = hh + bob;
      bodyG.rotation.set(-pitch * DEG + (shake > 0 ? 0.04 * Math.sin(TAU * 5 * shake) * sh : 0), yawB, (shake > 0 ? 0.07 * Math.sin(TAU * 6 * shake + 1) * sh : 0));
      torsoG.scale.setScalar(1 + breath + 0.12 * sh);
      bodyG.updateMatrix(); bodyG.updateMatrixWorld(true);
      const toG = (p) => { const v = V3(p).applyMatrix4(bodyG.matrix); return [v.x, v.y, v.z]; };   // a point in the body's frame -> G (an array)
      // ---- idle: head snap, tail flick, third lid
      let idleY = 0, idleP = 0;
      if (alive > 0.001) {
        const e = eventAt(t, sd0, 1.4, 3.1, 11), dirs = SNAP_DIRS[who], pick = (k) => dirs[Math.floor(rnd(sd0 * 5.3 + k * 2.9 + 3) * 5)], cur = pick(e.k), prv = pick(e.k - 1), pr = e.k === 0 ? 1 : sstep(0, 1, (t - e.T) * 30 / 2);
        idleY = lerp(prv[0], cur[0], pr); idleP = lerp(prv[1], cur[1], pr);
      }
      const yawAll = clamp(idleY * alive + hY, -1.25, 1.25), pitchAll = clamp(idleP * alive + hP, -1.25, 1.25);
      let flick = 0; if (alive > 0.001) { const e = eventAt(t, sd0 + 4, 4.2, 5.8, 21), dt = t - e.T; if (dt < 0.32) flick = Math.sin(Math.PI * dt / 0.32) * (e.k % 2 ? 1 : -1); }
      // ---- tail
      const fan = lerp(lerp(0, 22, wEff * flightK), 70, br), tailRot = (13 - 6 * talk + (flick * 8) * alive - 30 * br + 4 * flightK) * DEG;
      tailG.rotation.x = tailRot; const tk = fan.toFixed(1); if (tk !== tailKey) { tailKey = tk; tailPose(fan, tk); }
      // ---- wings
      const wk = [wEff.toFixed(3), br.toFixed(3), roll.toFixed(2), rollH.toFixed(2), open.toFixed(2), bend.toFixed(3), glide > 0 ? t.toFixed(3) : "x", glide.toFixed(2), tint > 0 ? 1 : 0].join("|");
      if (wk !== wingKey) {
        wingKey = wk;
        for (const W of wings) { const F = wingLayout({ w: wEff, br, roll, rollH, open, bend, flex: glide * 4, t, who, sd: W.sd, tint: tint > 0 }); F.forEach((f, i) => W.set.set(i, f)); W.set.done(); W.set.mesh.material = tint > 0 ? tintM : wingM; }
      }
      for (const W of wings) { /* hold groups sit on the shoulders; nothing moves them but the layout */ }
      // ---- head and neck
      const N0 = toG([0, 0.012, 0.104]), hdYaw = yawB + yawAll * 100 * DEG, hdPitch = (8 + 8 * leanA - 10 * flightK * 0) * DEG + pitchAll * 35 * DEG + (br > 0 ? -6 * br * DEG : 0), hdRoll = -hR * 30 * DEG + (talk > 0 ? 0 : 0);
      const stretch = 0.03 * leanA, jRel = mix(mix([0, 0.0425, 0.045], [0, 0.016, 0.085], flightK), [0, 0.07, 0.045], br), J = add(add(N0, [Math.sin(yawB) * (jRel[2] + stretch * 1.5), jRel[1] + stretch * 0.4, Math.cos(yawB) * (jRel[2] + stretch * 1.5)]), [Math.sin(hdYaw) * 0.006, 0, 0]);
      headG.position.set(J[0], J[1], J[2]); headG.rotation.set(hdPitch, hdYaw, hdRoll);
      headG.updateMatrix();
      const hf = V3([0, 0, 1]).applyQuaternion(headG.quaternion), hdBack = [J[0] - hf.x * 0.026, J[1] - hf.y * 0.026 - 0.002, J[2] - hf.z * 0.026];
      const nk = [J.map((v) => v.toFixed(4)).join(), hdYaw.toFixed(3), hdPitch.toFixed(3), N0[0].toFixed(4)].join("|");
      if (nk !== neckKey) {
        neckKey = nk;
        const ax = V3([0, 0.5, 1]).applyQuaternion(bodyG.quaternion), axA = norm([ax.x, ax.y, ax.z]), ctl = add(N0, mul(axA, 0.045 + stretch * 0.6)), sections = [];
        for (let i = 0; i < neckSecs; i++) {
          const f = i / (neckSecs - 1), p = add(add(mul(N0, (1 - f) * (1 - f)), mul(ctl, 2 * f * (1 - f))), mul(hdBack, f * f)), wd = lerp(0.046, 0.021, Math.pow(f, 0.8));
          sections.push({ c: p, w: wd, up: wd, dn: wd * 0.95, n: 2.1 });
        }
        neckLoft.userData.set(sections);
        // 24 neck marks laid over the neck skin
        for (let i = 0; i < 24; i++) {
          const f = 0.08 + 0.8 * ((i % 6) / 5), ang = (Math.floor(i / 6) + (rnd(i + 5) - 0.5) * 0.5) / 4 * TAU, pt = (ff) => { const s = Math.min(neckSecs - 1.001, ff * (neckSecs - 1)), j = Math.floor(s), u = s - j, a = sections[j], b = sections[j + 1]; return { c: mix(a.c, b.c, u), w: lerp(a.w, b.w, u) }; };
          const a0 = pt(f), a1 = pt(Math.min(1, f + 0.04)), tg = norm(sub(a1.c, a0.c)), sv = norm(cross(tg, [0, 1, 0])), uv = cross(sv, tg), nrm = add(mul(sv, Math.cos(ang)), mul(uv, Math.sin(ang))), len = 0.014 + 0.007 * rnd(i + 70);
          neckMarks.set(i, { r: add(add(a0.c, mul(nrm, a0.w * 0.96)), mul(tg, -len * 0.4)), d: norm(add(mul(tg, -1), mul(nrm, 0.3))), u: nrm, len, w: len * 0.68, lead: 0.5, bU: 0.3, kind: 5, tile: markTile(Math.floor(rnd(i + 80) * 3) * 2 + (rnd(i + 90) < 0.4 ? 1 : 0)) });
        }
        neckMarks.done();
      }
      const hk = (ruff + 0.45 * talk).toFixed(3); if (hk !== hackKey) { hackKey = hk; hackleSet(clamp(ruff + 0.45 * talk)); }
      lowerG.rotation.x = 28 * DEG * talk; const open_ = talk > 0.04; gape.visible = tongue.visible = open_; roof.visible = open_;
      // third lid: 2 frames every 2.5-4 s, or the blink state
      { const e = eventAt(t, sd0 + 7, 2.5, 4.0, 31), dt = t - e.T, auto = dt >= 0 && dt < 2 / 30 ? (dt < 1 / 30 ? 0.5 : 1) : 0, cov = Math.max(auto, blink); third.forEach((m) => { m.visible = cov > 0.05; m.position.z = -0.0032 * (1 - Math.min(1, cov)); }); }
      // ---- legs: the feet stay planted while the body moves; tucked in flight, forward in the brake
      const hipB = (sd) => V3(toG([sd * 0.03, -0.040, -0.012])), plant = (sd) => V3([sd * 0.03, 0.007, -0.006 + 0.004 * lean]);
      for (const L of legs) {
        const hip = hipB(L.sd), tuckP = V3([L.sd * 0.026, 0.0, 0.0]).add(hip).add(V3([0, -0.012, -0.03])), brkP = hip.clone().add(V3([L.sd * 0.012, -0.05, 0.06]));
        const foot = plant(L.sd).lerp(tuckP, 1 - grip).lerp(brkP, br), dir = hip.clone().sub(foot), len = Math.max(0.01, dir.length() - 0.004);
        L.lg.position.copy(foot); L.tar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()); L.shaft.scale.set(1, len, 1); L.shaft.position.y = len / 2;
        L.rings.forEach((r, i) => { r.visible = 0.005 + i * 0.0075 < len + 0.002; });
        const tk2 = [perchR.toFixed(3), grip.toFixed(2), br.toFixed(2)].join(); if (tk2 !== L.key) { L.key = tk2; buildToes(L, perchR, grip, br, 0); }
      }
      void toeKey;
    };
    pose({}, 0);
    return { grip: 0, apply(ps, t) { pose(ps, t); } };
  },
};
export const NORSE_RAVEN_GRIPS = {};
export const NORSE_RAVEN_STATE = { norseraven: { wings: 0, flap: 0, glide: 0, brake: 0, grip: 1, lean: 0, headYaw: 0, headPitch: 0, headRoll: 0, talk: 0, ruff: 0, shake: 0, hop: 0, blink: 0, tint: 0, perchR: 0.03 } };
