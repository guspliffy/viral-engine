// props-krampus-cat.js - Krampus myth 01: the lofted grey tabby, kind `ktabby` (DESIGN.md section 10 item 17; story rule "animals look real")
// Exports: KRAMPUS_CAT_KINDS, KRAMPUS_CAT_GRIPS ({}: nothing is held by a cast hand), KRAMPUS_CAT_STATE (defaults below), ktabbyPoints(params) -> places for staging (pure, Node-safe).
//
// ktabby    A fluffy grey silver tabby, 0.25 m at the shoulder blades (Chip is 0.67). ORIGIN: on the floor between the four paws (stand), the cat faces +z (rot turns it), +x is its left.
//           SIZE  stand: shoulder top 0.250, back 0.236, crown 0.310, ear tips 0.345, nose 0.275 ahead of the origin (z), tail tip about 0.30 up the back, body 0.34 long, 0.12 wide.
//                 `scale` (the prop's own) multiplies everything; 1 is the story's cat. Nothing is held in a hand, there is no grip and no in-hand proof.
//           BUILD ONE lofted skin of the torso and neck (9 sections), a lofted head (7), four lofted legs (7 sections each, the hind with knee and hock), a lofted tail (9),
//                 every skin painted: silver-grey strand fur (thousands of single hairs along the body), tabby bars on the flanks, a dark spine line, a butterfly on the
//                 shoulders, ringed legs and a ringed tail with a dark tip, an "M" and cheek lines on the face, a white chin and a white bib, a lighter belly; amber eyes with
//                 a slit pupil, pink nose, 2 x 5 whiskers, two ears with pink inner and 3 hair tufts each, cheek ruffs. The look is hand-drawn (ink on hard edges), not a toy ball.
//   spec    seed 0       varies the stripes a little (integer); everything else is a state key
//   state   (every key can also be set in the spec; state wins), range 0..1 unless said
//           run 0        0 = standing, 1 = the full bound (a gallop in two flights: stretch, front paws land, gather with the back arched, hind paws land, push off). Between: a trot-like mix
//           streak 0     the bolt: the body stretches to 1.18 x its length and thins 15 %, all four legs reach out, the back goes flat, ears lie back, the tail streams straight behind;
//                        use it with run 1. No speed lines are ever drawn (DESIGN: no symbols).
//           bound 0      the bound cycle's phase offset in cycles (0..1 is a whole cycle); the cycle also runs on t
//           rate 3.4     bound cycles a second while `run` > 0 (0 freezes the cycle at `bound`)
//           tail 0.5     0 = low and trailing .. 1 = up in a question mark (the stand tail)
//           lookX 0      -1..1 head turn (+x = its left), lookY -1..1 (up positive)       ears 0   -1 = flat back, 0 = up, 1 = forward alert      blink 0  0..1 eyes shut
//           crouch 0     0..1 body low to the floor, paws tucked (a cat about to spring)
//   points  ktabbyPoints(params, {x,y,z,rot,scale}) -> {shoulder, back, crown, nose, tailTip, paws:[fl, fr, hl, hr]} in world metres for the same params (for the director's marks).
import * as THREE from "three";
import { clamp } from "./util.js";
import { makeLoft } from "./geo.js";

const TAU = Math.PI * 2;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const frac = (x) => x - Math.floor(x);
const cr = (a, b, c, d, f) => 0.5 * (2 * b + (c - a) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (3 * b - a - 3 * c + d) * f * f * f);   // periodic Catmull-Rom through 4 keys
const memo = new Map();
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
const rgbOf = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixHex = (a, b, t) => { const A = rgbOf(a), B = rgbOf(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
function cvs(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function palette() { const reg = (m) => { m.userData.c0 = m.color.clone(); return m; }; return { m: (color, o = {}) => reg(new THREE.MeshStandardMaterial({ color, roughness: 0.92, ...o })), b: (color, o = {}) => reg(new THREE.MeshBasicMaterial({ color, ...o })) }; }

// ---------------------------------------------------------------- the coat (shared palette: a silver tabby)
const C = {
  base: "#8b8f99", mid: "#a2a6b0", light: "#bfc3cc", dark: "#4a4d57", deep: "#2f3139", belly: "#d3d5db", white: "#f4f3ef", pink: "#e39aa4", pinkDk: "#b8606c", nose: "#d98a92",
  amber: "#e0a62c", amberLt: "#ffd86a", amberDk: "#9a6414", pupil: "#14100c", whisker: "#eef0f4", line: "#1a1418", ear: "#e8a8b0",
};

// ---------------------------------------------------------------- the textures: strand fur painted from the index (a pure function of kind and seed)
// A loft's uv: u along the spine, v round it (0 and 1 = the belly line, 0.25 = the cat's +x side, 0.5 = the back, 0.75 = -x). The canvas is flipped: v 1 at the top.
function furTexture(kind, seed) {
  const W = { body: 1024, head: 512, leg: 256, thigh: 256, tail: 512 }[kind], H = { body: 512, head: 256, leg: 128, thigh: 256, tail: 128 }[kind];
  return once(`ktTex${kind}${seed}`, () => cvs(W, H, (g) => {
    const X = (u) => u * W, Y = (v) => (1 - v) * H, r = (i) => rnd(i * 3.7 + seed * 101 + kind.length * 13);
    g.lineCap = "round"; g.lineJoin = "round";
    // ground: dark along the back and the top of the head, light on the belly side
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, C.belly); gr.addColorStop(0.1, C.light); gr.addColorStop(0.3, C.mid); gr.addColorStop(0.5, C.base); gr.addColorStop(0.7, C.mid); gr.addColorStop(0.9, C.light); gr.addColorStop(1, C.belly);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const stripe = (u0, v0, u1, v1, w0, col, a = 0.85, bow = 0) => {   // a tapered stripe from (u0,v0) to (u1,v1), width in pixels, slightly bowed
      const x0 = X(u0), y0 = Y(v0), x1 = X(u1), y1 = Y(v1), dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, mx = (x0 + x1) / 2 + nx * bow, my = (y0 + y1) / 2 + ny * bow;
      g.beginPath(); g.moveTo(x0 + nx * w0, y0 + ny * w0); g.quadraticCurveTo(mx + nx * w0 * 0.6, my + ny * w0 * 0.6, x1, y1); g.quadraticCurveTo(mx - nx * w0 * 0.6, my - ny * w0 * 0.6, x0 - nx * w0, y0 - ny * w0); g.closePath();
      g.globalAlpha = a; g.fillStyle = col; g.fill(); g.globalAlpha = 1;
    };
    if (kind === "body") {
      // the tabby: 26 bars down each flank, forked here and there, 3 breaks; a dark spine line; a butterfly over the shoulders; an unbarred pale belly; a white bib at the chest
      for (const side of [0.25, 0.75]) {
        const dir = side < 0.5 ? -1 : 1;   // toward the belly: v down on the +x side (0.5 -> 0), up on the -x side (0.5 -> 1)
        for (let i = 0; i < 26; i++) {
          const u = 0.07 + (i / 25) * 0.74 + (r(i + side * 50) - 0.5) * 0.012, reach = 0.2 + 0.1 * r(i + 9 + side * 30), wob = (r(i + 31) - 0.5) * 0.02, wd = (H * 0.022) * (0.8 + 0.5 * r(i + 4));
          stripe(u, 0.5, u + wob + 0.012, 0.5 + dir * reach, wd, C.dark, 0.88, (r(i + 17) - 0.5) * 10);
          if (i % 4 === 1) stripe(u + 0.006, 0.5 + dir * reach * 0.55, u + 0.026, 0.5 + dir * reach * 0.95, wd * 0.6, C.dark, 0.8);   // a fork
          if (i % 5 === 2) stripe(u + 0.012, 0.5 + dir * 0.02, u + 0.016, 0.5 + dir * reach * 0.45, wd * 0.5, C.deep, 0.5);
        }
        // the ghost rings that hold the flank: a second, paler row between the bars
        for (let i = 0; i < 25; i++) stripe(0.1 + (i / 24) * 0.7, 0.5 + dir * 0.03, 0.105 + (i / 24) * 0.7, 0.5 + dir * (0.1 + 0.08 * r(i + 77)), H * 0.012, C.mid, 0.6);
        // the butterfly: 2 dark wing stripes on each shoulder blade (u 0.82-0.95)
        for (let k = 0; k < 3; k++) stripe(0.80 + 0.04 * k, 0.5, 0.78 + 0.05 * k, 0.5 + dir * (0.12 + 0.03 * k), H * 0.03, C.deep, 0.8, dir * 4);
      }
      g.fillStyle = C.deep; g.globalAlpha = 0.85; g.beginPath(); g.moveTo(X(0.0), Y(0.505)); g.lineTo(X(1), Y(0.505)); g.lineTo(X(1), Y(0.495)); g.lineTo(X(0), Y(0.495)); g.fill();
      for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(X(0.04 + 0.9 * i / 39), Y(0.5), W * 0.013, H * 0.034, 0, 0, TAU); g.fill(); } g.globalAlpha = 1;   // the spine line, broken into 40 dashes
      const bib = g.createRadialGradient(X(0.97), Y(0.0), 4, X(0.97), Y(0.0), H * 0.3); bib.addColorStop(0, C.white); bib.addColorStop(1, "rgba(244,243,239,0)"); g.fillStyle = bib; g.fillRect(X(0.78), 0, W * 0.22, H); g.fillRect(X(0.78), 0, W * 0.22, 1);
      g.save(); g.translate(0, H); g.scale(1, -1); g.fillStyle = bib; g.fillRect(X(0.78), 0, W * 0.22, H); g.restore();
    } else if (kind === "head") {
      // M on the brow, 3 lines running back from each eye, cheek lines, a pale muzzle and a white chin
      for (const side of [0.25, 0.75]) { const dir = side < 0.5 ? -1 : 1;
        for (let i = 0; i < 7; i++) stripe(0.12 + i * 0.045, 0.5, 0.15 + i * 0.04, 0.5 + dir * (0.1 + 0.02 * i), H * 0.02, C.dark, 0.85);
        stripe(0.42, 0.5 + dir * 0.13, 0.12, 0.5 + dir * 0.24, H * 0.022, C.deep, 0.9, 2); stripe(0.4, 0.5 + dir * 0.19, 0.1, 0.5 + dir * 0.33, H * 0.02, C.dark, 0.85, 2); stripe(0.4, 0.5 + dir * 0.25, 0.14, 0.5 + dir * 0.38, H * 0.016, C.dark, 0.8, 2); }
      for (const [a, b, c2, d2] of [[0.38, 0.5, 0.2, 0.5], [0.36, 0.55, 0.22, 0.58], [0.36, 0.45, 0.22, 0.42]]) stripe(a, b, c2, d2, H * 0.02, C.deep, 0.9);
      const pale = g.createLinearGradient(X(0.55), 0, X(0.8), 0); pale.addColorStop(0, "rgba(211,213,219,0)"); pale.addColorStop(1, "rgba(211,213,219,0.95)"); g.fillStyle = pale; g.fillRect(X(0.55), 0, X(0.45), H);
      const ch = g.createLinearGradient(0, 0, 0, H * 0.3); ch.addColorStop(0, C.white); ch.addColorStop(1, "rgba(244,243,239,0)"); g.fillStyle = ch; g.fillRect(X(0.45), 0, X(0.55), H * 0.3); g.save(); g.translate(0, H); g.scale(1, -1); g.fillStyle = ch; g.fillRect(X(0.45), 0, X(0.55), H * 0.3); g.restore();
    } else if (kind === "leg") {
      // rings: 5 dark bands down the leg, a pale paw end
      for (let i = 0; i < 4; i++) { const u = 0.34 + i * 0.15; g.globalAlpha = 0.6 - 0.05 * i; g.fillStyle = C.dark; g.fillRect(X(u), 0, W * 0.035, H); }
      g.globalAlpha = 1; const pw = g.createLinearGradient(X(0.82), 0, X(1), 0); pw.addColorStop(0, "rgba(211,213,219,0)"); pw.addColorStop(1, "rgba(211,213,219,0.9)"); g.fillStyle = pw; g.fillRect(X(0.82), 0, W * 0.18, H);
    } else if (kind === "thigh") {
      for (let i = 0; i < 5; i++) { const v = 0.22 + i * 0.13; stripe(0.0, v, 1.0, v + (i % 2 ? 0.03 : -0.03), H * 0.03, C.dark, 0.38, 3); }
    } else if (kind === "tail") {
      // 9 rings, wider near the base, the last 3 cm dark
      for (let i = 0; i < 9; i++) { const u = 0.08 + i * 0.09; g.globalAlpha = 0.85; g.fillStyle = C.dark; g.fillRect(X(u), 0, W * (0.046 - i * 0.002), H); }
      g.globalAlpha = 1; g.fillStyle = C.deep; g.fillRect(X(0.9), 0, W * 0.1, H);
    }
    // the hair: thousands of single strands along u with a slight lean, light and dark, thin
    const n = { body: 5200, head: 1500, leg: 700, thigh: 900, tail: 900 }[kind];
    for (let i = 0; i < n; i++) {
      const u = r(i * 5 + 1), v = r(i * 5 + 2), len = (kind === "body" ? 0.035 : 0.05) * (0.5 + r(i * 5 + 3)), lean = (r(i * 5 + 4) - 0.5) * 0.02, lt = r(i * 5 + 5);
      g.strokeStyle = lt < 0.4 ? C.light : lt < 0.55 ? C.white : lt < 0.8 ? C.dark : C.deep; g.globalAlpha = lt < 0.55 ? 0.34 : 0.26; g.lineWidth = 0.9 + 0.8 * r(i * 5 + 6);
      g.beginPath(); g.moveTo(X(u), Y(v)); g.lineTo(X(u + len), Y(v + lean)); g.stroke();
    }
    g.globalAlpha = 1;
  }));
}
// the eye: an almond of amber with a darker rim, a vertical slit and a painted glint, on a transparent card
function eyeTexture() {
  return once("ktEye", () => cvs(128, 96, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const almond = () => { g.beginPath(); g.moveTo(8, h / 2 + 6); g.quadraticCurveTo(w / 2, -6, w - 8, h / 2 - 6); g.quadraticCurveTo(w / 2, h + 8, 8, h / 2 + 6); g.closePath(); };
    almond(); g.fillStyle = C.line; g.fill();
    g.save(); almond(); g.clip();
    const q = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w * 0.42); q.addColorStop(0, C.amberLt); q.addColorStop(0.45, C.amber); q.addColorStop(1, C.amberDk); g.fillStyle = q; g.fillRect(0, 0, w, h);
    const up = g.createLinearGradient(0, 0, 0, h * 0.5); up.addColorStop(0, "rgba(20,12,8,0.7)"); up.addColorStop(1, "rgba(20,12,8,0)"); g.fillStyle = up; g.fillRect(0, 0, w, h * 0.5);   // the upper lid's shade
    g.fillStyle = C.pupil; g.beginPath(); g.ellipse(w / 2, h / 2, 9, 34, 0, 0, TAU); g.fill();
    g.fillStyle = "rgba(255,255,255,0.95)"; g.beginPath(); g.ellipse(w / 2 - 14, h / 2 - 12, 7, 5, -0.5, 0, TAU); g.fill(); g.beginPath(); g.arc(w / 2 + 12, h / 2 + 12, 3, 0, TAU); g.fill();   // the glint and a small second one
    g.restore(); almond(); g.strokeStyle = C.line; g.lineWidth = 5; g.stroke();
    g.beginPath(); g.moveTo(8, h / 2 + 6); g.quadraticCurveTo(0, h / 2 + 8, -6, h / 2 + 4); g.strokeStyle = C.line; g.lineWidth = 3; g.stroke();   // the little tail of the liner
  }));
}

// ---------------------------------------------------------------- the pose (pure): sagittal numbers in metres, z forward, y up
// key poses of the bound at phase 0, 0.25, 0.5, 0.75 (stretch, front lands, gather, push off), the stand, and the streak
const STAND = { hy: 0.172, hz: -0.165, sy: 0.178, sz: 0.165, arch: 0.0, fz: 0.175, fy: 0, fpsi: 0.3, hpz: -0.145, hpy: 0, hpsi: 0.38, head: 0.0, neck: 0.7, tail: 0.5, ears: 0, tailW: 0.02 };
const KEYS = [
  { hy: 0.218, hz: -0.205, sy: 0.205, sz: 0.19, arch: -0.012, fz: 0.37, fy: 0.12, fpsi: 0.9, hpz: -0.38, hpy: 0.14, hpsi: -1.15, head: -0.12, neck: 0.5, tail: 0.1, ears: -0.4 },
  { hy: 0.2, hz: -0.2, sy: 0.17, sz: 0.19, arch: 0.0, fz: 0.31, fy: 0.0, fpsi: 0.5, hpz: -0.31, hpy: 0.07, hpsi: -0.8, head: 0.05, neck: 0.55, tail: 0.25, ears: -0.2 },
  { hy: 0.19, hz: -0.115, sy: 0.19, sz: 0.125, arch: 0.05, fz: 0.07, fy: 0.012, fpsi: 0.3, hpz: -0.03, hpy: 0.0, hpsi: 0.6, head: 0.1, neck: 0.7, tail: 0.5, ears: 0.1 },
  { hy: 0.205, hz: -0.14, sy: 0.2, sz: 0.15, arch: 0.025, fz: 0.15, fy: 0.08, fpsi: 0.7, hpz: -0.2, hpy: 0.025, hpsi: 0.1, head: 0.0, neck: 0.6, tail: 0.3, ears: -0.1 },
];
const STREAK = { hy: 0.205, hz: -0.235, sy: 0.19, sz: 0.215, arch: -0.014, fz: 0.4, fy: 0.115, fpsi: 1.05, hpz: -0.42, hpy: 0.12, hpsi: -1.25, head: -0.2, neck: 0.4, tail: 0.0, ears: -1 };
const LF = 0.85;   // body length factor: every z of the key poses below is drawn for 0.33 m and scaled to 0.28
for (const o of [STAND, ...KEYS, STREAK]) for (const k of ["hz", "sz", "fz", "hpz"]) o[k] *= LF;
const POSE_KEYS = Object.keys(STAND).filter((k) => k !== "tailW");
function mixPose(a, b, t) { const o = {}; for (const k of POSE_KEYS) o[k] = lerp(a[k], b[k], t); return o; }
function catPose(ps, spec, t) {
  const g = (k, d = 0) => ps[k] ?? spec[k] ?? d, run = clamp(g("run")), streak = clamp(g("streak")), crouch = clamp(g("crouch")), tailP = clamp(g("tail", 0.5));
  const rate = g("rate", 3.4), phi = frac(g("bound") + (run > 0.001 ? rate * t : 0)), sub = (off) => {   // a pose at a phase (the two paws of a pair lag a little)
    const f = frac(phi + off) * 4, i = Math.floor(f), u = f - i, o = {};
    for (const k of POSE_KEYS) o[k] = cr(KEYS[(i + 3) % 4][k], KEYS[i % 4][k], KEYS[(i + 1) % 4][k], KEYS[(i + 2) % 4][k], u);
    return o;
  };
  const body = sub(0), lagF = sub(0.05), lagH = sub(-0.04);
  const mixR = (p) => mixPose(STAND, p, sstep(run * 1.15)), B = mixR(body), F = mixR(lagF), Hn = mixR(lagH);
  const S = mixPose(B, STREAK, streak), SF = mixPose(F, STREAK, streak), SH = mixPose(Hn, STREAK, streak);
  const stretch = 1 + 0.18 * streak;
  let hz = S.hz, sz = S.sz; const mid = (hz + sz) / 2; hz = mid + (hz - mid) * stretch; sz = mid + (sz - mid) * stretch;
  const ck = crouch * (1 - run);
  const o = {
    run, streak, phi, hy: S.hy - 0.07 * ck, hz: hz - 0.03 * ck, sy: S.sy - 0.095 * ck, sz: sz + 0.03 * ck, arch: S.arch + 0.02 * ck, neck: S.neck - 0.4 * ck,
    fz: [SF.fz, SF.fz + 0.025 * (1 - streak) * run * Math.sin(TAU * phi + 1)], fy: [SF.fy, SF.fy], fpsi: SF.fpsi, hpz: [SH.hpz, SH.hpz + 0.02 * run * (1 - streak)], hpy: [SH.hpy, SH.hpy], hpsi: SH.hpsi,
    head: S.head + 0.05 * ck, ears: clamp(S.ears + g("ears"), -1, 1), tailBase: lerp(lerp(0.15, 1.0, tailP), S.tail * 0.8 + 0.1, run), thin: 1 - 0.15 * streak, flat: 1 - 0.1 * streak, stretch,
    lookX: clamp(g("lookX"), -1, 1), lookY: clamp(g("lookY"), -1, 1), blink: clamp(g("blink")), tailP, tailRun: run, tailStreak: streak, crouch: ck, t,
  };
  return o;
}
// 2D two-bone IK in the sagittal plane: hip -> target, the middle joint on the +z side (bend = +1, a knee) or the -z side (bend = -1, an elbow)
function ik2(h, f, L1, L2, bend) {
  const dz = f[0] - h[0], dy = f[1] - h[1], d0 = Math.hypot(dz, dy) || 1e-6, d = clamp(d0, Math.abs(L1 - L2) + 0.002, (L1 + L2) * 0.999), a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const ux = dz / d0, uy = dy / d0, px = -uy, py = ux, sg = (px * bend) >= 0 ? 1 : -1;
  return { E: [h[0] + ux * a + sg * px * hh, h[1] + uy * a + sg * py * hh], F: [h[0] + ux * d, h[1] + uy * d] };
}
const FLEG = { x: 0.04, L1: 0.088, L2: 0.088, foot: 0.045 }, HLEG = { x: 0.05, L1: 0.098, L2: 0.098, foot: 0.088 };
const SPINE = [   // s along hips -> shoulders (1 = shoulders); w half width, up / dn half depth, n superellipse power (the flank tucks up toward the hips, the chest is deepest)
  [-0.16, 0.032, 0.042, 0.046, 2.3], [-0.06, 0.056, 0.064, 0.062, 2.3], [0.08, 0.064, 0.070, 0.058, 2.3], [0.30, 0.050, 0.058, 0.046, 2.3], [0.52, 0.054, 0.060, 0.056, 2.3],
  [0.78, 0.064, 0.074, 0.084, 2.3], [1.0, 0.060, 0.070, 0.082, 2.3], [1.15, 0.048, 0.054, 0.056, 2.2], [1.32, 0.042, 0.046, 0.046, 2.2]];
// the whole skeleton for a pose: spine centres, leg joints (x, y, z), tail points, head frame
function skeleton(P) {
  const Lb = Math.hypot(P.sz - P.hz, P.sy - P.hy), sec = [], c = [];
  const neckV = [0.06 + 0.035 * P.neck, 0.07 + 0.01 * (1 - P.neck)];   // the neck's rise and reach beyond the shoulder line
  SPINE.forEach(([s, w, up, dn, n]) => {
    let y, z;
    if (s <= 1) { const q = clamp(s); z = lerp(P.hz, P.sz, s); y = lerp(P.hy, P.sy, s) + P.arch * 4 * q * (1 - q) - (s < 0 ? 0.03 * Math.abs(s) : 0); }
    else { const f = (s - 1) / 0.32; z = P.sz + neckV[1] * f * (1 - 0.1 * f); y = P.sy + neckV[0] * f * (0.7 + 0.3 * f); }
    c.push([0, y, z]); sec.push({ c: [0, y, z], w: w * P.thin * (s > 1 ? 1 : 1), up: up * P.flat, dn: dn * P.flat, n });
  });
  const hipJ = (s) => [P.hz + 0.005, P.hy - 0.012 + P.arch * 0.0, s], shJ = [P.sz - 0.015, P.sy - 0.03];
  const legs = [];
  for (const side of [1, -1]) {
    const k = side > 0 ? 0 : 1, fx = side * FLEG.x * P.thin * (1 + 0.15 * P.streak), hx = side * HLEG.x * P.thin;
    // front: shoulder joint, elbow (backward), wrist, paw
    const pawF = [P.fz[k], Math.max(0, P.fy[k])], wr = [pawF[0] - FLEG.foot * Math.sin(P.fpsi), pawF[1] + FLEG.foot * Math.cos(P.fpsi)], sh = [P.sz - 0.012, P.sy - 0.04];
    const ikF = ik2(sh, wr, FLEG.L1, FLEG.L2, -1);
    legs.push({ x: fx, pts: [sh, [(sh[0] + ikF.E[0]) / 2, (sh[1] + ikF.E[1]) / 2], ikF.E, [(ikF.E[0] + ikF.F[0]) / 2, (ikF.E[1] + ikF.F[1]) / 2], ikF.F, [(ikF.F[0] + pawF[0]) / 2, (ikF.F[1] + pawF[1]) / 2], pawF], paw: pawF, front: true, psi: P.fpsi });
    // hind: hip joint, knee (forward), hock (back), paw
    const pawH = [P.hpz[k], Math.max(0, P.hpy[k])], hock = [pawH[0] - HLEG.foot * Math.sin(P.hpsi), pawH[1] + HLEG.foot * Math.cos(P.hpsi)], hp = [P.hz + 0.01, P.hy - 0.015];
    const ikH = ik2(hp, hock, HLEG.L1, HLEG.L2, 1);
    legs.push({ x: hx, pts: [hp, [(hp[0] + ikH.E[0]) / 2, (hp[1] + ikH.E[1]) / 2], ikH.E, [(ikH.E[0] + ikH.F[0]) / 2, (ikH.E[1] + ikH.F[1]) / 2], ikH.F, [(ikH.F[0] + pawH[0]) / 2, (ikH.F[1] + pawH[1]) / 2], pawH], paw: pawH, front: false, psi: P.hpsi });
  }
  // the tail: 9 points from the rump, angle up from straight back; a question mark when held up, a wave when it runs
  const tail = [], r0 = SPINE[0], T0 = [0, c[0][1] + 0.012, c[0][2] + 0.0]; let ang = P.tailBase * 0.7, px = 0, py = T0[1], pz = T0[2], wob = 0.02 * (0.4 + P.tailRun) * (1 - P.tailStreak * 0.8);
  const curl = lerp(0.04, 0.27, P.tailP) * (1 - P.tailRun) + 0.02 * P.tailRun;
  for (let i = 0; i < 9; i++) {
    tail.push([px + wob * Math.sin(TAU * 0.5 * (P.phi * 2 + i * 0.12)) * (i / 8) + 0.045 * (i / 8) ** 1.4 * (1 - P.tailRun) * Math.sin(1.0 + P.tailP * 2), py, pz]);   // the stand tail also bends a little sideways, so it never lines up behind the head
    const seg = 0.034; pz -= Math.cos(ang) * seg; py += Math.sin(ang) * seg; ang += curl * (0.2 + 3.0 * (i / 8) ** 2.5) - 0.05 * P.tailRun * Math.sin(TAU * P.phi + i * 0.7);
  }
  // the head: origin at the neck's top, nose pitch from the pose, +z forward
  const N = c[c.length - 1], headO = [0, N[1] + 0.012, N[2] + 0.018];
  return { sec, c, legs, tail, headO, Lb };
}

const TAIL_R = [0.019, 0.0215, 0.0225, 0.022, 0.0205, 0.0185, 0.0155, 0.0115, 0.006];
const LEG_RF = [0.025, 0.0205, 0.0155, 0.0125, 0.0108, 0.0105, 0.0095], LEG_RH = [0.034, 0.026, 0.0195, 0.0155, 0.0115, 0.0105, 0.0095];
const HEAD_S = [[-0.05, 0.030, 0.034, 0.030, 2.2], [-0.025, 0.042, 0.040, 0.035, 2.3], [0.0, 0.046, 0.041, 0.037, 2.4], [0.02, 0.042, 0.038, 0.035, 2.5], [0.037, 0.030, 0.030, 0.026, 2.4], [0.052, 0.020, 0.022, 0.018, 2.3], [0.063, 0.011, 0.013, 0.010, 2.2]];

// the world places for staging (pure)
export function ktabbyPoints(params = {}, at = {}) {
  const P = catPose(params, params, params.t ?? 0), K = skeleton(P), sc = at.scale ?? 1, r = ((at.rot ?? 0) * Math.PI) / 180, co = Math.cos(r), si = Math.sin(r);
  const place = (x, y, z) => [(at.x ?? 0) + (x * co + z * si) * sc, (at.y ?? 0) + y * sc, (at.z ?? 0) + (-x * si + z * co) * sc];
  const sh = K.c[6], hd = K.headO;
  return { shoulder: place(0, P.sy + 0.07, P.sz - 0.02), back: place(0, K.c[3][1] + SPINE[3][3], K.c[3][2]), crown: place(0, hd[1] + 0.034, hd[2]), nose: place(0, hd[1] - 0.004, hd[2] + 0.063), tailTip: place(K.tail[8][0], K.tail[8][1], K.tail[8][2]), paws: K.legs.map((l) => place(l.x, l.paw[1], l.paw[0])), earTip: place(0.03, hd[1] + 0.07, hd[2] - 0.01) };
}

// ================================================================================================ the kind
export const KRAMPUS_CAT_STATE = { ktabby: { run: 0, streak: 0, bound: 0, rate: 3.4, tail: 0.5, lookX: 0, lookY: 0, ears: 0, blink: 0, crouch: 0, show: 1 } };
export const KRAMPUS_CAT_GRIPS = {};
export const KRAMPUS_CAT_KINDS = {
  ktabby(P) {
    const S = palette(), spec = P.spec || {}, seed = Math.round(spec.seed ?? 0), root = new THREE.Group(); P.whole.add(root);
    const mesh = (geo, m, par = root) => { const o = new THREE.Mesh(geo, m); o.castShadow = o.receiveShadow = true; par.add(o); return o; };
    const furM = (k) => S.m("#ffffff", { map: furTexture(k, seed), roughness: 0.95 });
    const bodyM = furM("body"), headM = furM("head"), legM = furM("leg"), tailM = furM("tail");
    const whiteM = S.m(C.white, { roughness: 0.95 }), pinkM = S.m(C.ear, { roughness: 0.8 }), noseM = S.m(C.nose, { roughness: 0.6 }), lineM = S.b(C.line);
    const P0 = skeleton(catPose({}, spec, 0));
    const bodyG = makeLoft(P0.sec.map((q) => ({ c: q.c, w: q.w, up: q.up, dn: q.dn, n: 2.3 })), { sub: 5, radial: 28, ref: [0, 1, 0] }); mesh(bodyG, bodyM);
    const legG = P0.legs.map((l) => { const g = makeLoft(l.pts.map((p, i) => ({ c: [l.x, p[1], p[0]], w: 0.01, up: 0.01, dn: 0.01 })), { sub: 4, radial: 16, ref: [0, 0, 1] }); mesh(g, legM); return g; });
    const tailG = makeLoft(P0.tail.map((p) => ({ c: p, w: 0.01, up: 0.01, dn: 0.01 })), { sub: 4, radial: 14, ref: [1, 0, 0] }); mesh(tailG, tailM);
    const thighM = furM("thigh"), hauns = [0, 1].map(() => { const h = mesh(new THREE.SphereGeometry(1, 16, 12), thighM); return h; });
    // paws: a ball with 3 toe bumps and a darker pad line, one per leg
    const paws = P0.legs.map((l) => { const g = new THREE.Group(); root.add(g); const pw = mesh(new THREE.SphereGeometry(1, 12, 9), mixPawM()); pw.scale.set(0.0135, 0.0105, 0.0235); pw.position.set(0, 0.0105, 0.01);
      for (let i = -1; i <= 1; i++) { const t = mesh(new THREE.SphereGeometry(1, 8, 6), mixPawM(), g); t.scale.set(0.0058, 0.0055, 0.0075); t.position.set(i * 0.0085, 0.007, 0.0275 - 0.002 * Math.abs(i)); t.castShadow = false; if (i === 0) { t.position.z += 0.001; } g.add(t); }
      g.add(pw); return g; });
    function mixPawM() { return once("ktPaw", () => S.m(mixHex(C.light, C.white, 0.35), { roughness: 0.95 })); }
    // the head
    const headG = new THREE.Group(); root.add(headG);
    const hl = makeLoft(HEAD_S.map(([z, w, up, dn, n]) => ({ c: [0, z > 0.03 ? -0.004 * ((z - 0.03) / 0.033) : 0, z], w, up, dn, n })), { sub: 5, radial: 28, ref: [0, 1, 0] }); mesh(hl, headM, headG);
    hl.userData.set(HEAD_S.map(([z, w, up, dn, n]) => ({ c: [0, z > 0.03 ? -0.004 * ((z - 0.03) / 0.033) : 0, z], w, up, dn, n })));
    const chin = mesh(new THREE.SphereGeometry(1, 12, 8), whiteM, headG); chin.scale.set(0.0145, 0.0095, 0.02); chin.position.set(0, -0.0225, 0.043);
    const lip = mesh(new THREE.SphereGeometry(1, 10, 8), whiteM, headG); lip.scale.set(0.017, 0.007, 0.0105); lip.position.set(0, -0.012, 0.054);   // the muzzle pads
    for (const s of [-1, 1]) { const pad = mesh(new THREE.SphereGeometry(1, 10, 8), whiteM, headG); pad.scale.set(0.0105, 0.009, 0.012); pad.position.set(s * 0.0085, -0.011, 0.053); }
    const nose = mesh(new THREE.SphereGeometry(1, 10, 8), noseM, headG); nose.scale.set(0.0068, 0.0052, 0.005); nose.position.set(0, 0.0055, 0.0625);
    // the mouth: the philtrum and two curves, drawn as thin tubes
    { const t1 = new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(0, 0.0035, 0.0635), new THREE.Vector3(0, -0.0065, 0.0645)), 2, 0.0007, 4); mesh(t1, lineM, headG).castShadow = false;
      for (const s of [-1, 1]) { const cv = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, -0.0065, 0.0645), new THREE.Vector3(s * 0.005, -0.0125, 0.0615), new THREE.Vector3(s * 0.0105, -0.0105, 0.0555)); mesh(new THREE.TubeGeometry(cv, 8, 0.0007, 4), lineM, headG).castShadow = false; } }
    // eyes: almond cards on the skull, the lids scale down with blink; ears with pink inside and 3 hair tufts; cheek ruffs; whiskers
    const eyeMat = new THREE.MeshBasicMaterial({ map: eyeTexture(), transparent: true, alphaTest: 0.08, side: THREE.DoubleSide, toneMapped: false }); eyeMat.userData.c0 = eyeMat.color.clone(); eyeMat.userData.noOutline = true;
    const eyes = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(s * 0.0225, 0.0095, 0.0225); g.rotation.set(0.0, s * 0.62, 0); headG.add(g); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.0235, 0.0176), eyeMat); m.position.z = 0.0145; m.rotation.z = s * -0.18; m.castShadow = false; m.userData.noOutline = true; g.add(m); return { g, m }; });
    const earG = (() => { const g = new THREE.ConeGeometry(0.0205, 0.0415, 4, 1); g.translate(0, 0.02, 0); g.scale(1, 1, 0.42); return g; })(), earIn = (() => { const g = new THREE.ConeGeometry(0.0135, 0.0295, 4, 1); g.translate(0, 0.0135, 0); g.scale(1, 1, 0.3); return g; })();
    const ears = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(s * 0.0275, 0.034, -0.012); headG.add(g); const o = mesh(earG, headM, g); const inn = mesh(earIn, pinkM, g); inn.position.z = 0.0042; inn.castShadow = false;
      for (let k = 0; k < 3; k++) { const tf = mesh(new THREE.ConeGeometry(0.0022, 0.0125, 3, 1), whiteM, g); tf.position.set((k - 1) * 0.0045, 0.0075, 0.0085); tf.rotation.z = (k - 1) * 0.35; tf.castShadow = false; }
      return { g, s }; });
    for (const s of [-1, 1]) for (let k = 0; k < 6; k++) { const tf = mesh(new THREE.ConeGeometry(0.0042, 0.0225 - 0.0015 * k, 4, 1), mixRuff(k), headG); tf.position.set(s * (0.0415 - 0.002 * k), -0.011 - 0.0028 * k, 0.0 + 0.0035 * k - 0.012); tf.rotation.set(0.35 - 0.1 * k, 0, s * (-1.75 + 0.12 * k)); tf.castShadow = false; }
    function mixRuff(k) { return once(`ktRuff${k}`, () => S.m(mixHex(C.light, C.white, 0.2 + 0.1 * k), { roughness: 0.95 })); }
    const whiskM = S.b(C.whisker, { transparent: true, opacity: 0.92 }); whiskM.userData.noOutline = true;
    for (const s of [-1, 1]) for (let k = 0; k < 5; k++) { const a = (k - 2) * 0.17, base = new THREE.Vector3(s * 0.0125, -0.009 + 0.0022 * (k - 2) * -1, 0.052), tip = new THREE.Vector3(s * (0.0125 + 0.056 * Math.cos(a)), base.y + 0.056 * Math.sin(a) * -1 + 0.004, 0.052 + 0.014 - 0.01 * Math.abs(a)), mid = base.clone().lerp(tip, 0.5); mid.y += 0.006; mid.z += 0.01;
      const w = mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(base, mid, tip), 8, 0.00055, 3), whiskM, headG); w.castShadow = false; w.userData.noOutline = true; }
    const brows = [-1, 1].map((s) => { const b = mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(s * 0.015, 0.022, 0.03), new THREE.Vector3(s * 0.024, 0.026, 0.03), new THREE.Vector3(s * 0.033, 0.02, 0.022)), 6, 0.0006, 3), whiskM, headG); b.castShadow = false; return b; });

    const update = (ps, tm) => {
      {
        const t = tm ?? 0, Pz = catPose(ps, spec, t), K = skeleton(Pz);
        bodyG.userData.set(K.sec);
        K.legs.forEach((l, i) => { const R = l.front ? LEG_RF : LEG_RH, th = Pz.thin; legG[i].userData.set(l.pts.map((p, j) => ({ c: [l.x, p[1], p[0]], w: R[j] * 0.95 * th, up: R[j] * (l.front ? 1.0 : 1.25), dn: R[j] * (l.front ? 1.0 : 1.25) })));
          // the paw ball sits on the paw point, turned to the foot's angle
          const pw = paws[i], pawPt = l.paw, dd = l.psi; pw.position.set(l.x, pawPt[1], pawPt[0] + 0.004); pw.rotation.x = -clamp(l.front ? 0.5 * (dd - 0.3) : 0.4 * (-dd), -0.9, 0.9) * (pawPt[1] > 0.01 ? 1.2 : 0.2) + (l.front ? 0 : 0.0); });
        { const hl = K.legs.filter((l) => !l.front); hl.forEach((l, i) => { const a = l.pts[0], b = l.pts[2], dz = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dz, dy), h = hauns[i];
            h.position.set(l.x * 0.95, (a[1] + b[1]) / 2 - 0.004, (a[0] + b[0]) / 2 + 0.004); h.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, dy, dz).normalize()); h.scale.set(0.027 * Pz.thin, 0.5 * len + 0.035, 0.046 * Pz.flat); }); }
        tailG.userData.set(K.tail.map((p, i) => ({ c: p, w: TAIL_R[i] * Pz.thin, up: TAIL_R[i] * Pz.thin, dn: TAIL_R[i] * Pz.thin })));
        // the head: pitch from the pose and the look, a turn about the neck
        headG.position.set(K.headO[0], K.headO[1], K.headO[2]);
        headG.rotation.set(Pz.head + 0.25 * -Pz.lookY, 0.75 * Pz.lookX, -0.12 * Pz.lookX * 0 + 0.0, "YXZ");
        const e = Pz.ears; ears.forEach((E) => { E.g.rotation.x = e < 0 ? -1.2 * -e - 0.1 : -0.12 + 0.16 * e; E.g.rotation.z = E.s * (-0.38 + (e < 0 ? -0.5 * -e : 0)); });
        const bl = Pz.blink; eyes.forEach((E) => { E.m.scale.y = Math.max(0.06, 1 - 0.94 * bl); });
      }
    };
    update({}, 0);
    // show 0: the cat is off (hidden, not posed) until its shot
    return { grip: 0, apply(ps, t) { const on = (ps.show ?? spec.show ?? 1) > 0.5; P.whole.visible = on; if (on) update(ps, t); } };
  },
};
