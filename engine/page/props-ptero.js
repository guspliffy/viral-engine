import * as THREE from "three";
import { clamp } from "./util.js";
import { makeLoft } from "./geo.js";

// Real-anatomy Pteranodon for There's a catch EP05 "back to life" (12 Nov 2026; storyboards/series/what-if/05-back-to-life/BRIEF-R3.md).
// Registered AFTER props-iceage.js in props3d.js, so kind `pterosaur` here REPLACES the cartoon one there. Same params, same
// origin, same wingspan: the clip's staging holds. Drawn like a natural-history illustrator would (long toothless beak, long
// back-swept crest, small eye, tiny body, huge narrow wings of one bony arm and ONE very long wing finger, membrane to the
// ankle, legs trailing) in the engine's clean 3D cartoon rendering. Every body part is one lofted skin (geo.js makeLoft): the
// trunk (tail stub, pelvis, belly, chest, neck) is ONE loft, the head (beak tip to crest tip) ONE loft, the lower beak ONE loft
// hinged for `jaw`, each leg ONE loft, each bony arm ONE loft (shoulder, elbow, wrist, wing finger). The joints are worked out
// in apply() from the params and the lofts are re-set on them, so neck, legs, arms and finger bend as one skin.
//
// KIND  pterosaur    (spec: x, y, z, rot, scale, as any prop; spec.flap / bank / fold / glow / jaw / brow / squint / headY / headP /
//                     lookX / lookY / breath / drool seed the params like the old kind)
//   Size (scale 1): 2.6 m wingspan (1.3 per side, level), torso 0.55 long (tail stub tip z -0.36, chest front z +0.2), 0.17 deep,
//   0.16 wide; neck up and forward; head pivot (the back of the skull) at z +0.575, y +0.255; beak tip z +1.10, y +0.19 at head
//   0/0; crest tip z +0.08, y +0.39 (0.5 m behind the pivot). Wing finger 0.8 m = 61 % of a wing. Wing chord at the wrist about
//   0.55 m. Legs trail behind (feet z -0.6, y -0.2), 0.46 m long, hanging down to about y -0.56 at fold 1.
//   Origin: the middle of the torso (z 0 = between the wings' roots), faces +z at rot 0, flies toward +z. Left wing = +x.
//   Colours: slate grey-brown #6d6258 back and top of the wings, cream #e8dcc0 underside, crest orange-red #c8552e fading to
//   yellow at its base, horn-yellow beak with a dark tip, thin dark finger lines painted along the bones, eyes amber.
//
// PARAMS (plain numbers; 0 at rest). propState (props3d.js) has defaults for flap, glow, jaw, squint, brow, lookX, lookY, headY,
// headP, breath and bank, but NOT for blink, fold and drool: seed those with a dur-0 `set` at time 0 or the first tween JUMPS.
//   flap   a count of wingbeats. Fraction 0 and 0.5 = wings level, 0.25 = wings up, 0.75 = down (about 40 deg at the finger).
//          The wing is a chain: the shoulder (humerus) leads, the elbow and wrist follow, the wing finger trails (its peak
//          comes about a tenth of a cycle after the arm's, more toward the tip: the membrane billows) and the membrane follows
//          every joint. The body bobs 5 cm against the wings. A whole number is level.
//   bank   degrees roll of the whole animal, + lifts the left wing (+x)
//   fold   0..1 folds the wing finger back along the forearm and the arm back and down along the body (hanging / perched);
//          the membrane gathers into a drape from the folded finger to the ankle; the legs reach down. Flap stops at fold 1.
//   glow   0..1 every material turns toward #b8ff9a by emissive (1 = a flat glowing silhouette) plus an additive halo sprite
//   jaw    0..1 lower beak drops (29 deg at 1; the palate shows red)
//   brow   -1..1 brow ridge: - angry (slants down toward the beak, drops on the eye), + raised
//   squint 0..1 upper lids (0.7 = about half closed)       blink 0..1 closes the lids fully
//   lookX / lookY  -1..1 the pupils (+lookX toward the animal's left, +x; lookY -1 looks down)
//   headY / headP  degrees, + turns the head to the animal's left (+x), + nods it down (the neck bends along)
//   drool  0..1 three thin pale blue-white strands (0.25-0.35 m at 1) from the lower beak, hanging straight down in the world
//   breath 0..1 the chest heaves (more with more breath)
// Where things are (scale 1, y 0 = origin, the animal level): eye (left) at about x +0.05, y +0.26, z +0.70 (r 0.02); shoulders
// x +-0.06, y +0.045, z +0.11; wrists x +-0.55; wing tips x +-1.3, z -0.11; ankles x +-0.075, z -0.46; beak tip z +1.10.
// The bodies are solid for the checks; drool and the glow halo are see-through (userData.steam, solid false). Pure function of
// the params and the clip time t (breath, a slow leg and wing sway): no random numbers, no clock.

const TAU = Math.PI * 2;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const rad = (d) => (d * Math.PI) / 180;
const GLOW = new THREE.Color("#b8ff9a");
const X_AXIS = new THREE.Vector3(1, 0, 0), Z_AXIS = new THREE.Vector3(0, 0, 1);

function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const ghost = (o, order = 2) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
function cvs(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const memo = new Map();   // every drawn texture is made once per page and shared (a pure function of its key)
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };

// ---------------------------------------------------------------- materials (one palette per prop so glow reaches them all)
function palette() {
  const list = [];
  const reg = (m) => { m.userData.c0 = m.color.clone(); list.push(m); return m; };
  return {
    m: (color, o = {}) => reg(new THREE.MeshStandardMaterial({ color, roughness: 0.8, emissive: GLOW, emissiveIntensity: 0, ...o })),
    b: (color) => reg(new THREE.MeshBasicMaterial({ color })),
    glow(g) { for (const m of list) { if (m.isMeshBasicMaterial) m.color.copy(m.userData.c0).lerp(GLOW, g); else m.emissiveIntensity = 1.0 * g; } },
  };
}

// ---------------------------------------------------------------- painting: colours as [r,g,b], filled in small blocks from f(u, v)
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const css = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hx = (i, j, sd) => { const x = Math.sin(i * 12.9898 + j * 78.233 + sd * 37.719) * 43758.5453; return x - Math.floor(x); };
const vn = (x, y, sd = 0) => { const i = Math.floor(x), j = Math.floor(y), a = sm(0, 1, x - i), b = sm(0, 1, y - j); return (hx(i, j, sd) * (1 - a) + hx(i + 1, j, sd) * a) * (1 - b) + (hx(i, j + 1, sd) * (1 - a) + hx(i + 1, j + 1, sd) * a) * b; };
// v is up the canvas: v = 1 at the top row. For a loft that is the belly line (v 0 and 1 both), v 0.5 the back (the middle row)
function paint(g, W, H, step, f) { for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) { g.fillStyle = css(f((x + step / 2) / W, 1 - (y + step / 2) / H)); g.fillRect(x, y, step, step); } }
// n small strokes (hair, fuzz, scale marks), each drawn once from the seeded rnd: pick(u, v) -> [colour, alpha] or null
function strokes(g, W, H, n, seed, len, pick, region = [0, 1]) {
  for (let i = 0; i < n; i++) {
    const u = region[0] + rnd(seed + i) * (region[1] - region[0]), v = rnd(seed + i + 4000), p = pick(u, v, i); if (!p) continue;
    const a = (rnd(seed + i + 8000) - 0.5) * 1.1, L = len * (0.6 + 0.8 * rnd(seed + i + 12000)), x = u * W, y = (1 - v) * H;
    g.strokeStyle = css(p[0], p[1]); g.lineWidth = 1 + rnd(seed + i + 16000) * 1.3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + L * Math.cos(a), y + L * Math.sin(a)); g.stroke();
  }
}
const SLATE = hex("#6d6258"), SLATE_D = hex("#554b42"), SLATE_L = hex("#85796b"), CREAM = hex("#e8dcc0"), CREAM_D = hex("#cdbf9f");
const HORN = hex("#dcb55c"), HORN_P = hex("#efe0b0"), TIPC = hex("#40301f"), RED = hex("#c8552e"), RED_D = hex("#a8431f"), YEL = hex("#e9bd47"), MOUTH = hex("#8c2d3b");

// the trunk: tail tip (u 0) to the back of the skull (u 1). Dark slate back, pale cream belly and throat with a soft uneven edge,
// a darker back stripe, mottling, and short fuzz strokes (dense on the neck), all drawn once
const trunkTex = () => once("ptTrunk", () => cvs(1024, 256, (g, W, H) => {
  paint(g, W, H, 2, (u, v) => {
    const d = Math.abs(v - 0.5) * 2;                                      // 0 on the back, 1 on the belly line
    const edge = 0.55 + 0.1 * (vn(u * 26, 0.5, 3) - 0.5) * 2 + 0.05 * (vn(u * 90, 1.5, 4) - 0.5);
    const belly = sm(edge - 0.07, edge + 0.07, d);
    let c = mixc(mixc(SLATE, SLATE_L, sm(0.2, 0.55, d) * 0.7), CREAM, belly);
    c = mixc(c, SLATE_D, (1 - sm(0.0, 0.3, d)) * 0.55);                    // the darker back stripe
    const mot = vn(u * 60, v * 14, 9) - 0.5; return mixc(c, belly > 0.5 ? CREAM_D : SLATE_D, clamp(mot * 0.5 + 0.12) * 0.6);
  });
  strokes(g, W, H, 1500, 100, 7, (u, v) => (Math.abs(v - 0.5) * 2 > 0.62 ? [CREAM_D, 0.45] : [rnd(u * 997) > 0.5 ? SLATE_D : SLATE_L, 0.4]));
  strokes(g, W, H, 1400, 5000, 9, (u, v) => (Math.abs(v - 0.5) * 2 > 0.62 ? [CREAM_D, 0.5] : [rnd(u * 331) > 0.5 ? SLATE_D : hex("#8a7c68"), 0.5]), [0.56, 1]);   // short fuzz on the neck
}));
// the head loft: beak tip (u 0) to crest tip (u 1). Horn-yellow beak, dark tip, palate red along the belly line, slate cheek and
// skull, crest yellow at its base through orange to red, a painted nostril slit on each side
const HEAD_N = 12;
const headTex = () => once("ptHead", () => cvs(1024, 256, (g, W, H) => {
  paint(g, W, H, 2, (u, v) => {
    const d = Math.abs(v - 0.5) * 2, uu = u * (HEAD_N - 1);              // uu = the section index
    let c = mixc(HORN, HORN_P, sm(0.45, 1, d));
    c = mixc(c, mixc(SLATE, CREAM, sm(0.35, 0.75, d)), sm(4.0, 5.6, uu) * (1 - sm(7.2, 7.8, uu)));          // the skull behind the beak: slate over cream
    const crest = sm(6.6, 7.4, uu), kc = sm(7.0, 10.6, uu);
    c = mixc(c, mixc(YEL, mixc(RED, RED_D, sm(0.5, 1, d) * 0.6), kc), crest);
    c = mixc(c, TIPC, 1 - sm(0.2, 0.85, uu));                           // the dark tip
    c = mixc(c, MOUTH, sm(0.86, 0.97, d) * (1 - sm(5.0, 6.0, uu)));     // the palate
    return mixc(c, SLATE_D, clamp(vn(u * 80, v * 12, 21) - 0.35) * 0.18);
  });
  const slit = (cx, cy) => { g.fillStyle = "rgba(48,34,24,0.85)"; g.beginPath(); g.ellipse(cx, cy, 20, 3.2, -0.12, 0, TAU); g.fill(); };
  slit((2.9 / (HEAD_N - 1)) * W, (1 - 0.27) * H); slit((2.9 / (HEAD_N - 1)) * W, (1 - 0.73) * H);
  strokes(g, W, H, 500, 300, 8, (u, v) => (u > 0.4 && u < 0.62 ? [SLATE_D, 0.4] : u > 0.62 ? [RED_D, 0.35] : null));
}));
// the lower beak: hinge (u 0) to tip (u 1): horn-yellow, cream under, a pink inside band on top, dark tip
const jawTex = () => once("ptJaw", () => cvs(256, 128, (g, W, H) => {
  paint(g, W, H, 2, (u, v) => {
    const d = Math.abs(v - 0.5) * 2;
    let c = mixc(HORN, CREAM, sm(0.4, 1, d) * 0.8);
    c = mixc(c, hex("#d8707e"), (1 - sm(0.0, 0.2, d)) * 0.9);
    return mixc(c, TIPC, sm(0.82, 0.97, u));
  });
}));
// legs, feet: slate over cream
const limbTex = () => once("ptLimb", () => cvs(128, 128, (g, W, H) => {
  paint(g, W, H, 2, (u, v) => { const d = Math.abs(v - 0.5) * 2; return mixc(mixc(SLATE, SLATE_L, 0.3 + 0.3 * vn(u * 20, v * 6, 2)), CREAM_D, sm(0.45, 0.8, d)); });
}));
// the wing's bony arm and finger: slate over a duller cream
const boneTex = () => once("ptBone", () => cvs(512, 64, (g, W, H) => {
  paint(g, W, H, 2, (u, v) => { const d = Math.abs(v - 0.5) * 2; return mixc(mixc(SLATE, SLATE_D, 0.25 + 0.45 * vn(u * 40, v * 3, 7)), CREAM_D, sm(0.5, 0.85, d)); });
}));
// the membrane: u along the wing (shoulder to tip), v from the leading edge (arm and finger, v 0, at the bottom of the canvas) to the
// trailing edge (v 1). Top: slate-brown going lighter between the bones; under: cream. A thin dark line runs along the bones only
// (v 0); fine soft blotches, drawn once, keep it from being flat
const wingTex = (top) => once(top ? "ptWingTop" : "ptWingUnder", () => cvs(512, 256, (g, W, H) => {
  const base = top ? SLATE : CREAM, lite = top ? hex("#9a8d7a") : hex("#f4ecd6");
  paint(g, W, H, 2, (u, v) => {
    const c = mixc(mixc(base, lite, sm(0.0, 0.8, v)), mixc(base, lite, 0.5), 0.0);
    return mixc(c, top ? SLATE_D : CREAM_D, clamp((vn(u * 5, v * 2.5, 31) - 0.35) * 0.9) * 0.45);
  });
  g.fillStyle = css(top ? hex("#2f2823") : hex("#7a6a55"), 0.9); g.fillRect(0, H - 7, W, 7);                    // the arm and finger line
  g.fillStyle = css(top ? hex("#2f2823") : hex("#7a6a55"), 0.6); g.fillRect(0, H - 9, W, 2);
}));

// ---------------------------------------------------------------- vector helpers (plain arrays)
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const mix3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const nrm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const rz = (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]]; };
const crf = (a, b, c, d, f) => 0.5 * (2 * b + (c - a) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (3 * b - a - 3 * c + d) * f * f * f);
function crSample(P, u) {   // Catmull-Rom through the points P, u 0..1 (the same curve a loft draws through its sections)
  const n = P.length, f = clamp(u) * (n - 1), i = Math.min(n - 2, Math.floor(f)), t = f - i, at = (k) => P[Math.max(0, Math.min(n - 1, k))];
  const a = at(i - 1), b = at(i), c = at(i + 1), d = at(i + 2);
  return [crf(a[0], b[0], c[0], d[0], t), crf(a[1], b[1], c[1], d[1], t), crf(a[2], b[2], c[2], d[2], t)];
}
const bez = (a, b, c, d, t) => { const m = 1 - t, k0 = m * m * m, k1 = 3 * m * m * t, k2 = 3 * m * t * t, k3 = t * t * t; return [0, 1, 2].map((i) => a[i] * k0 + b[i] * k1 + c[i] * k2 + d[i] * k3); };
const S3 = (c, w, up, dn, n) => ({ c, w, up, dn, ...(n && { n }) });
const hang = (...qs) => { const q = new THREE.Quaternion(); for (const x of qs) q.multiply(x); return q.invert(); };
const qE = (x, y, z, order = "YXZ") => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, order));
const qX = (a) => new THREE.Quaternion().setFromAxisAngle(X_AXIS, a);
const qZ = (a) => new THREE.Quaternion().setFromAxisAngle(Z_AXIS, a);

// ---------------------------------------------------------------- the glow halo and the drool (as the other ice-age animals)
const HALO = () => once("ptHalo", () => cvs(128, 128, (g, W, H) => {
  const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
  gr.addColorStop(0, "rgba(214,255,176,0.95)"); gr.addColorStop(0.4, "rgba(170,255,130,0.45)"); gr.addColorStop(0.75, "rgba(150,255,110,0.1)"); gr.addColorStop(1, "rgba(150,255,110,0)");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}));
function halo(parent, size, x, y, z) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: HALO(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, opacity: 0 }));
  s.material.userData.noOutline = true; ghost(s, 6); s.position.set(x, y, z); s.scale.set(size, size, 1); s.visible = false; parent.add(s); return s;
}
function makeDrool(parent, pts) {
  const m = new THREE.MeshStandardMaterial({ color: "#dff1f7", roughness: 0.1, transparent: true, opacity: 0.5, depthWrite: false }); m.userData.noOutline = true;
  const strandG = new THREE.CylinderGeometry(0.01, 0.003, 1, 8, 1, true).translate(0, -0.5, 0), dropG = new THREE.SphereGeometry(1, 10, 8);
  const items = pts.map((p, i) => {
    const g = new THREE.Group(); g.position.set(...p); parent.add(g);
    const s = ghost(new THREE.Mesh(strandG, m)), d = ghost(new THREE.Mesh(dropG, m));
    g.add(s, d);
    return { g, s, d, len: 0.35 * (0.72 + 0.28 * rnd(i + 3)), ph: rnd(i + 9) * 6 };
  });
  return {
    apply(k, t, invQ) {
      for (const it of items) {
        it.g.visible = k > 0.01; it.g.quaternion.copy(invQ);
        const L = it.len * k * (1 + 0.04 * Math.sin(t * 3 + it.ph));
        it.s.scale.set(1, L, 1); it.d.position.y = -L - 0.006; it.d.scale.set(0.0065, 0.0095, 0.0065);
      }
    },
  };
}

// ---------------------------------------------------------------- the skeleton at rest (metres; the wing in its own frame: x outward, y up, z forward)
const SH = [0.06, 0.045, 0.11];                                           // the shoulder
const L_HUM = 0.196, L_FORE = 0.32, L_SEG = 0.2667;                      // humerus, forearm, a third of the wing finger (0.8 m in all)
const D_HUM = nrm([0.19, -0.005, -0.05]), D_FORE = nrm([0.30, -0.005, 0.04]);
const D_SEG = [nrm([0.975, 0, -0.22]), nrm([0.95, 0, -0.31]), nrm([0.91, 0, -0.41])];
const F_HUM = nrm([0.22, -0.45, -0.85]), F_FORE = nrm([0.35, 0.25, 0.9]), F_SEG = [nrm([0.10, -0.25, -0.96]), nrm([0.12, -0.28, -0.95]), nrm([0.14, -0.30, -0.94])];
// the leg: hip, thigh, shin, foot, flying (trailing straight back) and folded (hanging down)
const HIP = [0.045, -0.07, -0.09], L_THIGH = 0.12, L_SHIN = 0.17, L_FOOT = 0.065;
const D_LEG = [nrm([0.12, -0.10, -1]), nrm([0.04, -0.07, -1]), nrm([0, -0.18, -1])], F_LEG = [nrm([0.10, -0.85, -0.5]), nrm([0, -1, 0.12]), nrm([0, -0.45, 0.9])];
const NU = 28, NV = 8, NUP = 10, NVP = 3;   // membrane grid: along the wing, across the chord; the front membrane's

export const PTERO_KINDS = {
  pterosaur(P) {
    const S = palette();
    const slate = S.m("#ffffff", { map: trunkTex(), roughness: 0.85 }), headM = S.m("#ffffff", { map: headTex(), roughness: 0.7 }), jawM = S.m("#ffffff", { map: jawTex(), roughness: 0.65 });
    const limbM = S.m("#ffffff", { map: limbTex(), roughness: 0.8 }), boneM = S.m("#ffffff", { map: boneTex(), roughness: 0.75 });
    const topM = S.m("#ffffff", { map: wingTex(true), roughness: 0.6, side: THREE.FrontSide }), underM = S.m("#ffffff", { map: wingTex(false), roughness: 0.6, side: THREE.BackSide });
    const clawM = S.m("#3b3028", { roughness: 0.5 }), lidM = S.m("#6d6258", { roughness: 0.8 }), browM = S.m("#554b42", { roughness: 0.8 });
    const root = new THREE.Group(); P.whole.add(root);
    const body = new THREE.Group(); root.add(body);

    // ---- trunk: tail stub, pelvis, belly, chest, neck up and forward to the back of the skull: ONE loft (13 sections)
    const TR = [   // [z, y, w, up, dn]; sections 0..6 are the body, 7..12 the neck (re-set each frame along the bent neck)
      [-0.36, -0.040, 0.004, 0.004, 0.004], [-0.29, -0.030, 0.014, 0.015, 0.014], [-0.19, -0.015, 0.052, 0.052, 0.050], [-0.08, 0.000, 0.076, 0.080, 0.078],
      [0.02, 0.012, 0.080, 0.088, 0.088], [0.12, 0.030, 0.074, 0.084, 0.082], [0.20, 0.055, 0.050, 0.058, 0.056],
      [0.24, 0.105, 0.037, 0.041, 0.041], [0.30, 0.175, 0.031, 0.035, 0.035], [0.34, 0.225, 0.029, 0.031, 0.031], [0.41, 0.255, 0.028, 0.030, 0.030], [0.50, 0.262, 0.027, 0.029, 0.029], [0.575, 0.255, 0.022, 0.024, 0.024],
    ];
    const trunkGeo = makeLoft(TR.map(([z, y, w, up, dn]) => S3([0, y, z], w, up, dn)), { sub: 5, radial: 24 });
    mesh(trunkGeo, slate, body);
    const NECK0 = 7, NECK_F = [0.1, 0.25, 0.45, 0.7, 0.9];   // the neck bends toward the head by these shares of headP / headY, segment by segment

    // ---- head: beak tip to crest tip: ONE loft; the lower beak a second thin loft hinged at the back of the mouth
    const head = new THREE.Group(); head.rotation.order = "YXZ"; body.add(head);
    const HD = [   // [z, y, w, up, dn, n] in the head's own frame (origin = the back of the skull, +z forward)
      [0.52, -0.062, 0.004, 0.004, 0.004], [0.47, -0.058, 0.010, 0.011, 0.009], [0.38, -0.052, 0.015, 0.018, 0.014], [0.29, -0.043, 0.021, 0.025, 0.020], [0.20, -0.030, 0.029, 0.034, 0.026],
      [0.12, -0.012, 0.038, 0.046, 0.031, 2.4], [0.04, 0.004, 0.040, 0.060, 0.034, 2.5], [-0.05, 0.028, 0.030, 0.058, 0.030, 2.6], [-0.15, 0.062, 0.016, 0.048, 0.022, 2.6],
      [-0.30, 0.104, 0.010, 0.034, 0.010, 2.5], [-0.42, 0.132, 0.006, 0.018, 0.004, 2.5], [-0.50, 0.146, 0.003, 0.006, 0.002],
    ];
    mesh(makeLoft(HD.map(([z, y, w, up, dn, n]) => S3([0, y, z], w, up, dn, n)), { sub: 5, radial: 20 }), headM, head);
    const JX = [0, -0.04, 0.06];   // the jaw hinge in the head's frame
    const jaw = new THREE.Group(); jaw.position.set(...JX); head.add(jaw);
    const JW = [[0.02, -0.032, 0.016, 0.012, 0.014], [0.08, -0.048, 0.020, 0.012, 0.014], [0.20, -0.068, 0.017, 0.011, 0.012], [0.30, -0.073, 0.013, 0.009, 0.010], [0.40, -0.077, 0.009, 0.007, 0.008], [0.47, -0.0815, 0.005, 0.004, 0.005], [0.50, -0.0805, 0.003, 0.003, 0.003]];
    mesh(makeLoft(JW.map(([z, y, w, up, dn]) => S3([0, y - JX[1], z - JX[2]], w, up, dn)), { sub: 5, radial: 14 }), jawM, jaw);

    // ---- eyes: small, set into the head under a brow ridge (an eyeball, iris, pupil, glint, an upper lid that closes)
    const face = (() => {
      const R = 0.02, EX = 0.030, EY = 0.004, EZ = 0.125, spread = 0.9;
      const white = S.b("#dccfa8"), irisM = S.b("#d9a21c"), pupilM = S.b("#1a120c"), glintM = S.b("#fdfcf6");
      const eyes = [-1, 1].map((s) => {
        const g = new THREE.Group(); g.position.set(s * EX, EY, EZ); g.rotation.y = s * spread; head.add(g);
        mesh(new THREE.SphereGeometry(R * 1.08, 20, 14), lidM, g, 0, 0, -R * 0.3).castShadow = false;   // the socket rim
        const w = new THREE.Mesh(new THREE.SphereGeometry(R, 24, 18), white); w.scale.set(1, 1.05, 0.95); g.add(w);
        const pup = new THREE.Group(); g.add(pup);
        const iris = new THREE.Mesh(new THREE.CircleGeometry(R * 0.8, 24), irisM); iris.position.z = R * 0.92; pup.add(iris);
        const pupil = new THREE.Mesh(new THREE.CircleGeometry(R * 0.4, 20), pupilM); pupil.position.z = R * 0.925; pup.add(pupil);
        const gl = new THREE.Mesh(new THREE.CircleGeometry(R * 0.13, 12), glintM); gl.position.set(R * 0.22, R * 0.26, R * 0.93); pup.add(gl);
        const lid = new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, 24, 12, 0, TAU, 0, Math.PI / 2), lidM); lid.scale.set(1, 1.05, 0.98);
        const lidP = new THREE.Group(); lidP.add(lid); g.add(lidP); lid.rotation.x = -Math.PI / 2; lid.castShadow = false;
        // the brow ridge: a small lofted bar along the top of the eye (front to back)
        const bg = new THREE.Group(); head.add(bg);
        const brow = mesh(makeLoft([S3([0, 0, -0.028], 0.003, 0.003, 0.002), S3([0, 0, -0.014], 0.008, 0.005, 0.004), S3([0, 0, 0.014], 0.008, 0.005, 0.004), S3([0, 0, 0.03], 0.003, 0.003, 0.002)], { sub: 4, radial: 12 }), browM, bg);
        brow.castShadow = false;
        return { pup, lidP, bg, s };
      });
      return {
        apply(ps) {
          const lx = clamp(ps.lookX ?? 0, -1, 1), ly = clamp(ps.lookY ?? 0, -1, 1), lidK = Math.max(clamp(ps.squint ?? 0) * 0.55, clamp(ps.blink ?? 0)), bw = clamp(ps.brow ?? 0, -1, 1);
          for (const e of eyes) {
            e.pup.rotation.set(-ly * 0.38, lx * 0.42 - e.s * 0.08, 0);
            e.lidP.rotation.x = rad(35 + 140 * lidK);
            e.bg.position.set(e.s * (EX - 0.001), EY + R * (0.84 + 0.5 * Math.max(0, bw) - 0.3 * Math.max(0, -bw)), EZ - R * 0.05);
            e.bg.rotation.set(-0.4 * bw, 0, 0);
          }
        },
      };
    })();
    const drool = makeDrool(jaw, [[-0.012, -0.045, 0.37], [0.012, -0.045, 0.34], [0, -0.04, 0.27]]);

    // ---- legs: ONE loft each from inside the body through knee and ankle to the foot, three small toe claws
    const legs = [-1, 1].map((s) => {
      const geo = makeLoft([0, 1, 2, 3, 4, 5, 6, 7].map(() => S3([0, 0, 0], 0.01, 0.01, 0.01)), { sub: 4, radial: 12, ref: [1, 0, 0] });
      mesh(geo, limbM, body);
      const toes = [-1, 0, 1].map((k) => { const m = mesh(new THREE.ConeGeometry(0.0055, 0.034, 6), clawM, body); m.castShadow = false; return { m, k }; });
      return { s, geo, toes };
    });
    // ---- wings: the bony arm loft (shoulder, elbow, wrist, the finger in thirds), the membrane (one smooth grid, drawn both sides), the front membrane, three wrist claws
    const wings = [-1, 1].map((s) => {
      const arm = makeLoft([0, 1, 2, 3, 4, 5, 6, 7].map(() => S3([0, 0, 0], 0.01, 0.01, 0.01)), { sub: 4, radial: 12 });
      mesh(arm, boneM, body);
      const mk = (nu, nv, flip) => {
        const g = new THREE.BufferGeometry(), uv = [], idx = [];
        for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) uv.push(i / nu, j / nv);
        for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
          const a = i * (nv + 1) + j, b = a + nv + 1;
          if (flip) idx.push(a, a + 1, b, a + 1, b + 1, b); else idx.push(a, b, a + 1, a + 1, b, b + 1);
        }
        g.setAttribute("position", new THREE.BufferAttribute(new Float32Array((nu + 1) * (nv + 1) * 3), 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
        for (const m of [topM, underM]) { const o = mesh(g, m, body); o.castShadow = false; o.frustumCulled = false; }
        return g;
      };
      const memb = mk(NU, NV, s < 0), front = mk(NUP, NVP, s > 0);
      const claws = [-1, 0, 1].map((k) => { const m = mesh(new THREE.ConeGeometry(0.0055, 0.03, 6), clawM, body); m.castShadow = false; return { m, k }; });
      return { s, arm, memb, front, claws };
    });
    const haloS = halo(P.whole, 3.0, 0, 0.1, 0.1);
    const setPos = (g, nu, nv, fn) => {
      const p = g.attributes.position.array;
      for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const v = fn(i / nu, j / nv), o = (i * (nv + 1) + j) * 3; p[o] = v[0]; p[o + 1] = v[1]; p[o + 2] = v[2]; }
      g.attributes.position.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere();
    };
    const tmpQ = new THREE.Quaternion(), tmpV = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
    const aim = (o, p, dir) => { o.position.set(p[0], p[1], p[2]); tmpV.set(dir[0], dir[1], dir[2]).normalize(); o.quaternion.setFromUnitVectors(UP, tmpV); };

    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, fl = ps.flap ?? 0, fo = clamp(ps.fold ?? 0), br = clamp(ps.breath ?? 0), th = TAU * fl, k = 1 - fo;
        root.rotation.z = rad(ps.bank ?? 0);
        body.position.y = -0.05 * Math.sin(th) * k;
        // ---- legs: hip, thigh, shin, foot by plain forward kinematics, trailing at fold 0 and hanging down at fold 1
        const ankles = [];
        for (const l of legs) {
          const sway = 0.05 * Math.sin(tt * 1.7 + l.s) * k, dirs = D_LEG.map((d, i) => { let v = nrm(mix3(d, F_LEG[i], fo)); const c = Math.cos(sway * (i + 1) * 0.5), n = Math.sin(sway * (i + 1) * 0.5); return [v[0], v[1] * c - v[2] * n, v[1] * n + v[2] * c]; });
          const H0 = [l.s * HIP[0], HIP[1], HIP[2]], dd = dirs.map((d) => [l.s * d[0], d[1], d[2]]);
          const Hin = [l.s * 0.02, HIP[1] + 0.03, HIP[2] + 0.05], Kn = add(H0, sc(dd[0], L_THIGH)), An = add(Kn, sc(dd[1], L_SHIN)), Ft = add(An, sc(dd[2], L_FOOT));
          l.geo.userData.set([S3(Hin, 0.03, 0.03, 0.03), S3(H0, 0.026, 0.026, 0.026), S3(mix3(H0, Kn, 0.5), 0.022, 0.022, 0.022), S3(Kn, 0.018, 0.018, 0.018), S3(mix3(Kn, An, 0.5), 0.0125, 0.0125, 0.0125), S3(An, 0.011, 0.011, 0.011), S3(mix3(An, Ft, 0.55), 0.0095, 0.008, 0.008), S3(Ft, 0.0085, 0.006, 0.006)]);
          ankles.push([l.s, An]);
          for (const o of l.toes) { const d = nrm([dd[2][0] + o.k * 0.35 * l.s, dd[2][1], dd[2][2]]); aim(o.m, add(Ft, sc(d, 0.012)), d); }
        }
        // ---- wings
        const wave = (phi) => Math.sin(th - phi * Math.sin(th) ** 2);   // 0 at every whole and half beat; phi = how far the joint trails (rad at the peaks)
        const idle = 0.02 * Math.sin(tt * 1.3) * k;
        const aH = 0.34 * wave(0.2) * k + idle, aF = 0.48 * wave(0.45) * k + idle, aG = [0.60 * wave(0.7), 0.68 * wave(0.85), 0.76 * wave(1.0)].map((a) => a * k + idle * 1.5);
        for (const w of wings) {
          const dH = rz(nrm(mix3(D_HUM, F_HUM, fo)), aH), dF = rz(nrm(mix3(D_FORE, F_FORE, fo)), aF), dG = D_SEG.map((d, i) => rz(nrm(mix3(d, F_SEG[i], fo)), aG[i]));
          const E = add(SH, sc(dH, L_HUM)), Wr = add(E, sc(dF, L_FORE)), F1 = add(Wr, sc(dG[0], L_SEG)), F2 = add(F1, sc(dG[1], L_SEG)), T = add(F2, sc(dG[2], L_SEG)), Mf = mix3(E, Wr, 0.5);
          const X = (p) => [w.s * p[0], p[1], p[2]];   // wing frame -> body frame
          const Sin = [0.01, SH[1], SH[2] - 0.01];
          w.arm.userData.set([S3(X(Sin), 0.03, 0.028, 0.028), S3(X(SH), 0.030, 0.028, 0.028), S3(X(E), 0.025, 0.024, 0.024), S3(X(Mf), 0.019, 0.019, 0.019), S3(X(Wr), 0.023, 0.022, 0.022), S3(X(F1), 0.0115, 0.0115, 0.0115), S3(X(F2), 0.0075, 0.0075, 0.0075), S3(X(T), 0.0025, 0.0025, 0.0025)]);
          const chain = [SH, E, Mf, Wr, F1, F2, T];
          // the trailing edge: from the ankle out to the finger tip as one smooth Bezier, its two controls carried by the forearm and the finger
          const an = ankles.find((a) => a[0] === w.s)[1], A = [w.s * an[0], an[1], an[2]], chord = 1 - 0.8 * fo;
          const C1 = add(mix3(A, T, 0.34), [0, -0.01, -0.03 * chord]), C2 = add(mix3(A, T, 0.68), [0, -0.005, -0.02 * chord]);
          setPos(w.memb, NU, NV, (u, v) => {
            const Lp = crSample(chain, u), Rp = bez(A, C1, C2, T, u), p = add(Lp, sc([Rp[0] - Lp[0], Rp[1] - Lp[1], Rp[2] - Lp[2]], v * (1 - 0.7 * fo)));   // folded: the membrane gathers along the bones
            p[1] -= 0.03 * Math.sin(Math.PI * v) * Math.sqrt(Math.sin(Math.PI * u)); return X(p);
          });
          // the front membrane: from the neck-shoulder to the wrist, in front of the arm
          const Nf = [0.015, 0.075, 0.235], Wf = add(Wr, [0, 0.005, 0.03]), arm3 = [SH, E, Mf, Wr];
          setPos(w.front, NUP, NVP, (u, v) => {
            const Bp = crSample(arm3, u), Fp = mix3(Nf, Wf, u); Fp[2] += 0.03 * Math.sin(Math.PI * u);
            return X(add(Bp, sc([Fp[0] - Bp[0], Fp[1] - Bp[1], Fp[2] - Bp[2]], v)));
          });
          // three tiny free claws at the wrist, pointing forward and out
          for (const c of w.claws) { const d = nrm([0.25 * c.k, -0.1, 1]); aim(c.m, X(add(Wr, [0.0, 0.0, 0.02])), [w.s * d[0], d[1], d[2]]); }
        }
        // ---- trunk and neck: the neck bends toward the head by shares of headP / headY, the chest heaves with the breath
        const hy = ps.headY ?? 0, hp = ps.headP ?? 0, jw = clamp(ps.jaw ?? 0), hv = 1 + 0.025 * (1 + 2 * br) * Math.sin(tt * 2.4);
        const sec = TR.map(([z, y, w, up, dn], i) => S3([0, y, z], w, up * (i >= 3 && i <= 6 ? hv : 1), dn * (i >= 3 && i <= 6 ? hv : 1)));
        let pt = [0, TR[NECK0][1], TR[NECK0][0]];
        sec[NECK0].c = pt;
        for (let i = NECK0; i < TR.length - 1; i++) {
          const f = NECK_F[i - NECK0], v = tmpV.set(0, TR[i + 1][1] - TR[i][1], TR[i + 1][0] - TR[i][0]).applyQuaternion(tmpQ.setFromEuler(new THREE.Euler(rad(hp * f), rad(hy * f), 0, "YXZ")));
          pt = [pt[0] + v.x, pt[1] + v.y, pt[2] + v.z]; sec[i + 1].c = pt;
        }
        trunkGeo.userData.set(sec);
        head.position.set(pt[0], pt[1], pt[2]); head.rotation.set(rad(hp), rad(hy), 0); jaw.rotation.x = 0.5 * jw;
        face.apply(ps);
        drool.apply(clamp(ps.drool ?? 0), tt, hang(qZ(rad(ps.bank ?? 0)), qE(rad(hp), rad(hy), 0), qX(0.5 * jw)));
        const gl = clamp(ps.glow ?? 0); S.glow(gl); haloS.visible = gl > 0.01; haloS.material.opacity = 0.32 * gl;
      },
    };
  },
};
