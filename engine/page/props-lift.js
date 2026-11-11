import * as THREE from "three";

// Survive it EP2 "Stuck in a lift" (11 Nov 2026): the lift's own props, six kinds. Task T1, see
// storyboards/series/survive-it/03-lift/briefs/T1-lift-props.md. World metres, "elevator" set (set-elevator.js): the
// car's walls x +-2.05, back wall z -1.6, front z 1.25, ceiling y 3.4. Every kind is a pure function of its spec and
// its state (no clock, no random: every brick, rivet and button is hashed from its index and spec.seed), none of the
// six reads the clip time. State keys that propState (props3d.js) does not list start undefined: each kind reads
// ps.<key> ?? spec.<key> ?? default, so a spec value works too.
//
//   liftpanel   the button wall: a brass plate, 20 columns x 50 rows of round 3.6 cm buttons (number 1 bottom left, row by
//               row, 1000 top right), instanced, plus a 16 cm round door-close button on its own small plate.
//               Origin: bottom centre of the plate; at rot 0 it faces +z, the plate's front face is at z 0 and it is 2 cm
//               thick behind that (rot -90 faces -x: put it at x 2.03 on the right wall). Local +x is the door end then
//               (+z world). Size spec.w 2.6 x spec.h 3.2 (fixed art: the grid is 0.12 m across x 0.06 m up, buttons are
//               glow-haloed so lit rows merge into a gold wall), spec.seed 1, spec.close [dx, y] [1.05, 0.72] (the
//               close button's centre, metres from the plate's centre line and up from its bottom; no button sits
//               within 0.2 m of it).  State: lit 0..1000 (default 0: that many buttons in order glow gold, the rest are dull
//               brass; the engine's own `lit` key, so a tween works), hot 0..1 (0: brass; 1: white-hot, thin
//               orange cracks, the buttons white), dead 0..1 (0: whole; 1: scorched black, ragged edges and holes,
//               ~96 % of the buttons gone, a few ember-red dots; lit is ignored from dead 0.15 on), punch 0..1 (steps at
//               0.5: 0 the close button whole; 1 the button gone and a ragged 30 cm hole, bent brass petals on the
//               front, dark inside). All parts solid = false (wall dressing, a hand or staff may touch it).
//   liftcable   the car's cable. Origin: where the bundle meets the car roof (the director puts it at [0, 3.4, -0.2],
//               but the ceiling skin of liftshell tops at y 3.53: use y 3.53 to see all of the 25 cm anchor). A steel anchor
//               block 0.5 x 0.25 x 0.5 (y 0..0.25), a collar, and 12 strands of 4.5 cm (bundle 22 cm across, 0.16 rad/m twist)
//               running straight up spec.len 8 m. spec.seed 1 (which strand goes first, every curl).
//               State: strands 12..0 (default 12; the whole part = strands still whole; a snapped one is a 0.5 m curl at
//               the anchor and a 1.2 m curled end hanging from spec.len, nothing between), whip 0..1 (default 0: the
//               newest snapped strand's two ends spring apart (1 just snapped, wide and open) and settle (0, tight)),
//               glow 0..1 (default 0: the whole strands glow orange-hot).
//   liftspring  the red coil spring under the car. Origin: bottom centre (y 0 = the base disc's underside). Faces
//               nowhere (round). spec.r 1.3 (coil radius), spec.h 2.4 (free height of the coil), 5 turns, wire 0.16;
//               a base disc (0..0.12) and a dark steel top disc (radius r + 0.2, 0.12 thick) at y 0.12 + H .. 0.24 + H,
//               H = the coil's height. State: squash 0..1 (default 0): H = 2.4 -> 0.35 m, coils stacked flat, radius
//               +8 %. (Top of the top disc is y 2.64 at squash 0, 0.59 at squash 1.) This kind draws its own squash: the
//               engine's generic squash scale of the whole prop is cancelled, `scale` still works.
//   liftshell   the car seen from outside, round the set's car (origin = the set's origin: x 0, y 0, z 0). Steel skin 8 cm
//               outside the walls, back, floor and ceiling (outer faces x +-2.18, z -1.73, y -0.13 and 3.53), steel ribs and a
//               roof beam (z 0.55) on the roof, and at the front (z 1.25..1.5) a 0.25 m thick steel rim round the
//               4.1 x 3.4 m opening (rim band x +-1.8..2.3, y -0.25..0.25 and 3.15..3.65, 0.25 inside the opening so the set's side planes and ceiling do not hide it from the front). NO front wall. Floor sign: dark glass 0.7 x 0.26 m
//               in the middle of the top rim (front face z 1.5), green digits. Two steel door panels 0.62 x 2.05 m
//               thrown open, bent, hanging off the left and right rim (hinges x +-2.34, z 1.56). Faces +z (the open side).
//               spec.sign "9999", spec.seed 1. State: scorch 0..1 (default 0: dark steel, soot and burn streaks on the
//               rim, ribs, roof and sides), count (default 0: when above 0 the sign shows its whole part instead of
//               spec.sign). All parts solid = false (the cast stands inside).
//   shaftpit    a dark brick lift shaft seen from the front. Origin: the pit floor's centre. Back wall z -2.6, side walls
//               x +-3.3 (they run to z +10), concrete floor (y 0, x +-3.3, z -2.6..10), two steel guide rails (x +-1.35) with
//               brackets and pipes up the back wall, walls spec.h 40 m tall (y 0..40) built in 10 m tiles of bricks (each brick
//               hashed: darker, lighter, burnt, stains and drips, floor marks with a number every 4 m at x +-2.3, which
//               the director may hide by sliding the prop in y), a riveted plate 1.1 m with a "0" (0.9 m, spec.sign) on the
//               back wall at spec.signY 5.2. spec.seed 1. No state. Faces +z (toward the camera). solid = false.
//   shaftpass   what shows through the open doorway while the car shoots up. Origin: centre bottom of a flat brick
//               wall facing -z (toward a camera inside the car; the director puts it at z 1.9). spec.w 3.4, spec.h 60,
//               spec.floors [{ y, label }] (default [{ y: 30, label: "800" }]): y is the bottom of a door-sized (1.3 x
//               2.1 m) opening with a bright warm hotel hallway (carpet, wall lamps, a brass plaque with the label).
//               State: blur 0..1 (default 0; 1: the bricks are vertical streaks, the hallway smears and stretches 25 %
//               taller). Unlit painted card, solid = false, noOutline.
// Draft stills of the bench: storyboards/series/survive-it/03-lift/make-bench-props.mjs

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, Number.isFinite(x) ? x : a));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const val = (ps, S, k, d) => (typeof ps[k] === "number" ? ps[k] : typeof S[k] === "number" ? S[k] : d);

// an integer hash to 0..1: the same inputs give the same number, everywhere
function hash(a, b = 0, c = 0) {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul((b | 0) + 0x165667b1, 0x85ebca6b) ^ Math.imul((c | 0) + 0x9e3779b9, 0xc2b2ae35);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s, o = 3) { let t = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { t += a * vnoise(x * f, y * f, s + i * 17); a *= 0.5; f *= 2.03; } return t / (1 - 0.5 ** o); }

const cv = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return [c, c.getContext("2d")]; };
const texOf = (c, repeat = false) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
const basic = (o) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; return m; };
const flat = (m) => { m.userData.noOutline = true; if (m.material) m.material.userData.noOutline = true; return m; };
const box = (parent, w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.receiveShadow = true; parent.add(m); return m; };
const FAR = new THREE.Box3(new THREE.Vector3(0, -1000, 0), new THREE.Vector3(0, -1000, 0));
// an instanced part: never culled, no ink hull (it would turn inside out), not solid; its geometry box is put far away
// so the body-in-prop check never meets one unit box at the origin (props-whatif-blast.js does the same)
const inst = (o) => { o.userData.solid = false; o.frustumCulled = false; o.geometry.boundingBox = FAR.clone(); o.material.userData.noOutline = true; return o; };
const notSolid = (root) => root.traverse((n) => { n.userData.solid = false; });
const rgb = (c) => `rgb(${Math.round(clamp(c[0], 0, 255))},${Math.round(clamp(c[1], 0, 255))},${Math.round(clamp(c[2], 0, 255))})`;
const radial = (g, x, y, r, c0, c1) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
let GLOW = null;
const glowTex = () => {   // a soft white round blob, tinted by the material colour
  if (GLOW) return GLOW;
  const [c, g] = cv(64, 64), x = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  x.addColorStop(0, "rgba(255,255,255,1)"); x.addColorStop(0.45, "rgba(255,255,255,0.55)"); x.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = x; g.fillRect(0, 0, 64, 64);
  return (GLOW = texOf(c));
};

// ------------------------------------------------------------------------------------------------ painted brick
// bricks 0.23 x 0.08 m in running bond, each hashed (darker, lighter, burnt, a little tint); rows are numbered from the
// world's y, so tiles that stack (and their overscan) match. topY: world y of the canvas's top edge (a multiple of 0.08).
function paintBricks(g, Wpx, Hpx, ppm, seed, topY, o = {}) {
  const BH = 0.08, BL = 0.23, base = o.base || [96, 52, 42], wM = Wpx / ppm, rTop = Math.round(topY / BH), nR = Math.ceil(Hpx / (BH * ppm)) + 1;
  g.fillStyle = o.mortar || "#2a211e"; g.fillRect(0, 0, Wpx, Hpx);
  for (let ri = 0; ri <= nR; ri++) {
    const r = rTop - 1 - ri, py = ri * BH * ppm, sh = r & 1 ? BL / 2 : 0;
    for (let k = -1; k * BL - sh < wM; k++) {
      const x0 = k * BL - sh, h = hash(k, r, seed), h2 = hash(k, r, seed + 71), tint = (hash(k, r, seed + 3) - 0.5) * 0.14;
      let f = (o.lo ?? 0.66) + h * (o.span ?? 0.52); if (h2 < 0.07) f *= 0.55; else if (h2 > 0.94) f *= 1.35;
      g.fillStyle = rgb([base[0] * f * (1 + tint), base[1] * f * (1 - tint * 0.5), base[2] * f * (1 - tint)]);
      g.fillRect(x0 * ppm + 0.5, py + 0.5, BL * ppm - 1.2, BH * ppm - 1);
    }
  }
}
// damp streaks running down from the top of a wall piece, soft blotches, and white salt patches
function stainBricks(g, Wpx, Hpx, ppm, seed, n) {
  for (let i = 0; i < n; i++) {
    const x = hash(i, seed, 1) * Wpx, y = hash(i, seed, 2) * Hpx, w = (0.15 + hash(i, seed, 3) * 0.45) * ppm, l = (0.8 + hash(i, seed, 4) * 2.6) * ppm, a = 0.18 + hash(i, seed, 5) * 0.3;
    const gr = g.createLinearGradient(0, y, 0, y + l); gr.addColorStop(0, `rgba(8,8,10,${a})`); gr.addColorStop(1, "rgba(8,8,10,0)"); g.fillStyle = gr; g.fillRect(x - w / 2, y, w, l);
  }
  for (let i = 0; i < n * 0.8; i++) {
    const x = hash(i, seed, 11) * Wpx, y = hash(i, seed, 12) * Hpx, r = (0.3 + hash(i, seed, 13) * 0.9) * ppm, dark = hash(i, seed, 14) < 0.7;
    radial(g, x, y, r, dark ? `rgba(12,8,8,${0.18 + hash(i, seed, 15) * 0.2})` : `rgba(200,190,170,${0.05 + hash(i, seed, 15) * 0.08})`, "rgba(0,0,0,0)");
  }
}

// ------------------------------------------------------------------------------------------------ liftpanel
const PW = 512, PH = 640, PLATE = { w: 2.6, h: 3.2 };
let AUX = null;
// per-pixel maps of the plate, made once: rag (what the fire eats first: low near the edge and where the noise is low),
// soot, and cracks (level lines of a noise: thin and joined up)
function plateAux() {
  if (AUX) return AUX;
  const rag = new Float32Array(PW * PH), soot = new Float32Array(PW * PH), crack = new Float32Array(PW * PH);
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
    const u = x / PW, v = y / PH, i = y * PW + x, e = clamp(Math.min(Math.min(u, 1 - u) * PLATE.w, Math.min(v, 1 - v) * PLATE.h) / 0.3);
    rag[i] = 0.62 * e + 0.38 * fbm(u * 13, v * 16, 5, 3);
    soot[i] = fbm(u * 28, v * 34, 9, 3);
    const r = Math.abs(fbm(u * 5.5, v * 7, 11, 2) - 0.5), r2 = Math.abs(fbm(u * 9 + 3, v * 11 + 5, 13, 2) - 0.5);
    crack[i] = Math.max(1 - smooth(0.006, 0.017, r), (1 - smooth(0.004, 0.012, r2)) * 0.85);
  }
  return (AUX = { rag, soot, crack });
}
const bx = (c, i, seed) => -1.14 + 0.12 * c + (hash(i, seed, 1) - 0.5) * 0.006;
const by = (r, i, seed) => 0.13 + 0.06 * r + (hash(i, seed, 2) - 0.5) * 0.006;
const pxOf = (x, y) => [Math.min(PW - 1, Math.max(0, Math.round((x / PLATE.w + 0.5) * PW))), Math.min(PH - 1, Math.max(0, Math.round((1 - y / PLATE.h) * PH)))];

const PLATE_BASE = new Map();
function plateBase(seed, pos, skip) {
  const ck = `${seed}|${skip.join("")}`;
  if (PLATE_BASE.has(ck)) return PLATE_BASE.get(ck);
  const [c, g] = cv(PW, PH);
  g.fillStyle = "#b4852f"; g.fillRect(0, 0, PW, PH);
  const sheen = g.createLinearGradient(0, 0, PW, PH); sheen.addColorStop(0, "rgba(255,226,150,0.22)"); sheen.addColorStop(0.5, "rgba(255,226,150,0)"); sheen.addColorStop(1, "rgba(60,30,0,0.2)"); g.fillStyle = sheen; g.fillRect(0, 0, PW, PH);
  for (let i = 0; i < 90; i++) radial(g, hash(i, seed, 21) * PW, hash(i, seed, 22) * PH, 30 + hash(i, seed, 23) * 90, hash(i, seed, 24) < 0.5 ? `rgba(226,176,84,${0.1 + hash(i, seed, 25) * 0.12})` : `rgba(110,72,22,${0.1 + hash(i, seed, 25) * 0.12})`, "rgba(0,0,0,0)");
  for (let i = 0; i < 260; i++) { g.fillStyle = hash(i, seed, 26) < 0.5 ? `rgba(255,236,170,${0.04 + hash(i, seed, 27) * 0.05})` : `rgba(70,40,8,${0.04 + hash(i, seed, 27) * 0.05})`; g.fillRect(hash(i, seed, 28) * PW, hash(i, seed, 29) * PH, 1, 30 + hash(i, seed, 30) * 120); }
  g.lineWidth = 1;
  for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(255,240,190,${0.1 + hash(i, seed, 31) * 0.12})`; g.beginPath(); const x = hash(i, seed, 32) * PW, y = hash(i, seed, 33) * PH; g.moveTo(x, y); g.lineTo(x + (hash(i, seed, 34) - 0.5) * 120, y + (hash(i, seed, 35) - 0.5) * 60); g.stroke(); }
  // a dark well under every button (the button itself is a prop; the well stays when it is gone)
  for (let i = 0; i < 1000; i++) { if (skip[i]) continue; const [x, y] = pxOf(pos[i * 2], pos[i * 2 + 1]); g.fillStyle = "rgba(70,42,8,0.5)"; g.beginPath(); g.arc(x, y, 5.6, 0, 7); g.fill(); g.fillStyle = "rgba(255,226,150,0.16)"; g.beginPath(); g.arc(x + 0.8, y + 0.9, 5.6, 0, 7); g.fill(); g.fillStyle = "rgba(90,56,12,0.6)"; g.beginPath(); g.arc(x, y, 4.6, 0, 7); g.fill(); }
  // the frame: a dark bevel, a bright line, rivets round it
  g.strokeStyle = "rgba(70,40,6,0.85)"; g.lineWidth = 12; g.strokeRect(6, 6, PW - 12, PH - 12);
  g.strokeStyle = "rgba(255,232,160,0.55)"; g.lineWidth = 2; g.strokeRect(13, 13, PW - 26, PH - 26);
  let n = 0;
  const rivet = (x, y) => { n++; g.fillStyle = "rgba(60,34,6,0.7)"; g.beginPath(); g.arc(x + 1, y + 1.4, 4, 0, 7); g.fill(); g.fillStyle = `rgb(${196 + hash(n, seed, 41) * 30 | 0},${146 + hash(n, seed, 42) * 24 | 0},${64})`; g.beginPath(); g.arc(x, y, 3.6, 0, 7); g.fill(); g.fillStyle = "rgba(255,246,206,0.7)"; g.beginPath(); g.arc(x - 1, y - 1.2, 1.3, 0, 7); g.fill(); };
  for (let x = 24; x < PW - 20; x += 40) { rivet(x + (hash(x, seed, 43) - 0.5) * 3, 24); rivet(x + (hash(x, seed, 44) - 0.5) * 3, PH - 24); }
  for (let y = 64; y < PH - 40; y += 40) { rivet(24, y + (hash(y, seed, 45) - 0.5) * 3); rivet(PW - 24, y + (hash(y, seed, 46) - 0.5) * 3); }
  const img = g.getImageData(0, 0, PW, PH); PLATE_BASE.set(ck, img); return img;
}

// the plate's pixels for one state: brass, white-hot with cracks, scorched and eaten at the edges, with a punched hole
function paintPlate(g, out, base, hot, dead, hole) {
  const A = plateAux(), s = base.data, d = out.data, thr = dead * 0.7, tS = smooth(0, 0.45, dead), emb = smooth(0.2, 0.6, dead);
  for (let y = 0; y < PH; y++) {
    const my = (1 - y / PH) * PLATE.h;
    for (let x = 0; x < PW; x++) {
      const i = y * PW + x, o = i * 4, mx = (x / PW - 0.5) * PLATE.w;
      let r = s[o], gg = s[o + 1], b = s[o + 2], a = 255;
      if (dead > 0 && A.rag[i] < thr) a = 0;
      if (hole && a) {
        const dx = mx - hole[0], dy = my - hole[1];
        if (Math.abs(dx) < 0.28 && Math.abs(dy) < 0.28) {
          const ang = Math.atan2(dy, dx), R = 0.15 * (1 + 0.2 * Math.sin(5 * ang + 1) + 0.12 * Math.sin(9 * ang + 2.3) + 0.06 * Math.sin(17 * ang)), dd = Math.hypot(dx, dy);
          if (dd < R) a = 0; else if (dd < R + 0.012) { r = 70; gg = 44; b = 12; } else if (dd < R + 0.04) { const k = 1 - (dd - R - 0.012) / 0.028; r = lerp(r, 238, k * 0.7); gg = lerp(gg, 196, k * 0.7); b = lerp(b, 110, k * 0.7); }
        }
      }
      if (a) {
        if (hot > 0) {
          r = lerp(r, 250, 0.62 * hot); gg = lerp(gg, 226, 0.62 * hot); b = lerp(b, 186, 0.6 * hot);
          const c = A.crack[i] * hot; if (c > 0.01) { r = lerp(r, 238, c); gg = lerp(gg, 84, c); b = lerp(b, 10, c); }
        }
        if (dead > 0) {
          const sv = 9 + A.soot[i] * 30; r = lerp(r, sv * 1.1, tS * 0.96); gg = lerp(gg, sv, tS * 0.96); b = lerp(b, sv * 0.9, tS * 0.96);
          const q = A.rag[i] - thr;
          if (q < 0.035) { const k = (1 - q / 0.035) * emb * (A.soot[i] > 0.5 ? 1 : 0.25); r = lerp(r, 255, k); gg = lerp(gg, 72, k); b = lerp(b, 14, k); }
        }
      } else { r = gg = b = 0; }
      d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = a;
    }
  }
  g.putImageData(out, 0, 0);
}

function closeArt() {
  const [c, g] = cv(128, 128);
  g.fillStyle = "#2a2118"; g.fillRect(0, 0, 128, 128); radial(g, 64, 64, 64, "rgba(255,200,90,0.28)", "rgba(0,0,0,0)");
  g.fillStyle = "#ffcf5a";
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(64 + s * 8, 64); g.lineTo(64 + s * 42, 36); g.lineTo(64 + s * 42, 92); g.closePath(); g.fill(); }   // two arrows pointing at each other
  g.fillRect(60, 34, 8, 60);
  return texOf(c);
}

function buildLiftpanel(P) {
  const S = P.spec, seed = S.seed ?? 1, close = S.close || [1.05, 0.72], CR = 0.2;
  const pos = new Float32Array(2000), skip = new Uint8Array(1000);
  for (let i = 0; i < 1000; i++) { const cc = i % 20, rr = Math.floor(i / 20); pos[i * 2] = bx(cc, i, seed); pos[i * 2 + 1] = by(rr, i, seed); skip[i] = Math.hypot(pos[i * 2] - close[0], pos[i * 2 + 1] - close[1]) < CR ? 1 : 0; }
  const A = plateAux(), base = plateBase(seed, pos, skip), [pc, pg] = cv(PW, PH), out = pg.createImageData(PW, PH);
  const ptex = texOf(pc), pmat = std("#ffffff", { map: ptex, emissiveMap: ptex, emissive: "#000000", roughness: 0.5, metalness: 0.2, alphaTest: 0.5, side: THREE.DoubleSide });
  pmat.userData.noOutline = true;
  const pgeo = new THREE.PlaneGeometry(PLATE.w, PLATE.h); pgeo.translate(0, PLATE.h / 2, 0);
  const plate = new THREE.Mesh(pgeo, pmat); plate.receiveShadow = true; P.whole.add(plate);
  const back = flat(box(P.whole, 2.58, 3.18, 0.018, std("#6b4a18", { roughness: 0.6, metalness: 0.2 }), 0, 1.6, -0.011));
  // the buttons: a rim (every one), a dull brass face or a gold lamp, and a soft halo that makes lit rows merge
  const rimG = new THREE.CylinderGeometry(0.0215, 0.0215, 0.008, 14).rotateX(Math.PI / 2).translate(0, 0, 0.004);
  const faceG = new THREE.CylinderGeometry(0.0165, 0.018, 0.016, 14).rotateX(Math.PI / 2).translate(0, 0, 0.008);
  const rim = inst(new THREE.InstancedMesh(rimG, std("#ffffff", { roughness: 0.5, metalness: 0.2 }), 1000));
  const dull = inst(new THREE.InstancedMesh(faceG, std("#ffffff", { roughness: 0.45, metalness: 0.25, emissive: "#000000" }), 1000));
  const lamp = inst(new THREE.InstancedMesh(faceG, basic({ color: "#ffffff" }), 1000));
  const haloG = new THREE.PlaneGeometry(0.28, 0.135).translate(0, 0, 0.022);
  const halo = inst(new THREE.InstancedMesh(haloG, basic({ color: "#ffffff", map: glowTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 }), 1000));
  halo.renderOrder = 4;
  for (const m of [rim, dull, lamp, halo]) { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); P.whole.add(m); }
  // the door-close button on its own plate, and what a punch leaves
  const [cx, cy] = close, cb = new THREE.Group(); cb.position.set(cx, cy, 0); P.whole.add(cb);
  const cp = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.016, 28).rotateX(Math.PI / 2).translate(0, 0, 0.008), std("#5a5148", { roughness: 0.45, metalness: 0.5 })); cb.add(cp);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.092, 0.034, 28).rotateX(Math.PI / 2).translate(0, 0, 0.033), std("#d2a04a", { roughness: 0.35, metalness: 0.5 })); cb.add(ring);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.074, 28).translate(0, 0, 0.0505), basic({ map: closeArt() })); cb.add(face);
  const hole = new THREE.Group(); hole.position.set(cx, cy, 0); P.whole.add(hole);
  hole.add(flat(new THREE.Mesh(new THREE.CircleGeometry(0.215, 24).translate(0, 0, -0.015), basic({ color: "#0a0605" }))));
  const brassP = std("#d6a64a", { roughness: 0.4, metalness: 0.4, side: THREE.DoubleSide });
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + hash(k, seed, 51) * 0.3, w = 0.2 + hash(k, seed, 52) * 0.1, L = 0.06 + hash(k, seed, 53) * 0.07, lift = 0.05 + hash(k, seed, 54) * 0.07, R = 0.15 * (1 + 0.2 * Math.sin(5 * a + 1) + 0.12 * Math.sin(9 * a + 2.3));
    const pt = (rad, da, z) => [Math.cos(a + da) * rad, Math.sin(a + da) * rad, z];
    const v = [...pt(R - 0.01, -w, 0.003), ...pt(R - 0.01, w, 0.003), ...pt(R + L * 0.5, -w * 0.55, lift * 0.5), ...pt(R + L * 0.5, w * 0.55, lift * 0.5), ...pt(R + L, hash(k, seed, 55) * 0.2 - 0.1, lift)];
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); g.setIndex([0, 1, 3, 0, 3, 2, 2, 3, 4]); g.computeVertexNormals();
    const pm = new THREE.Mesh(g, brassP); pm.rotation.z = 0; hole.add(pm);
  }
  const hotCol = new THREE.Color(), tmpC = new THREE.Color(), M = new THREE.Matrix4(), V = new THREE.Vector3(), Q = new THREE.Quaternion(), Sc = new THREE.Vector3();
  let key = "";
  const mix = (hex, to, k) => hotCol.set(hex).lerp(tmpC.set(to), clamp(k));
  function rebuild(lit, hot, dead, punch) {
    paintPlate(pg, out, base, hot, dead, punch ? [cx, cy] : null); ptex.needsUpdate = true;
    pmat.emissive.setRGB(1, 0.8, 0.6).multiplyScalar(hot * 0.32); dull.material.emissive.setRGB(1, 0.6, 0.3).multiplyScalar(hot * 0.4);
    let nr = 0, nd = 0, nl = 0;
    for (let i = 0; i < 1000; i++) {
      if (skip[i]) continue;
      const x = pos[i * 2], y = pos[i * 2 + 1], [px, py] = pxOf(x, y);
      if (dead > 0 && (A.rag[py * PW + px] < dead * 0.7 + 0.03 || hash(i, seed, 7) < dead * 0.94)) continue;
      const rs = 0.94 + hash(i, seed, 3) * 0.12, z = hash(i, seed, 4) * 0.002;
      Sc.set(rs, rs, 1); V.set(x, y, z); M.compose(V, Q, Sc);
      rim.setMatrixAt(nr, M); mix("#5d3f16", "#ffe9c0", hot * 0.8).lerp(tmpC.set("#120d0a"), smooth(0, 0.4, dead)); rim.setColorAt(nr, hotCol); nr++;
      const ember = dead > 0.15 && hash(i, seed, 9) < 0.28, on = dead < 0.15 ? i < lit : ember;
      if (on) {
        lamp.setMatrixAt(nl, M);
        if (ember) hotCol.set("#ff3a14").lerp(tmpC.set("#ffb02a"), hash(i, seed, 10)); else mix("#ffc936", "#fff2d0", hot * 0.9).lerp(tmpC.set("#ffe27a"), hash(i, seed, 8) * 0.5 * (1 - hot));
        lamp.setColorAt(nl, hotCol);
        Sc.set(ember ? 0.5 : 1, ember ? 0.5 : 1, 1); M.compose(V, Q, Sc); halo.setMatrixAt(nl, M);
        if (ember) hotCol.set("#ff2208").multiplyScalar(0.8); else mix("#ff9a22", "#ffd6a0", hot).multiplyScalar(0.9); halo.setColorAt(nl, hotCol); nl++;
      } else {
        dull.setMatrixAt(nd, M);
        mix("#a97a30", "#fff0d0", hot * 0.85).multiplyScalar(0.82 + hash(i, seed, 6) * 0.3).lerp(tmpC.set("#1a1411"), smooth(0, 0.4, dead)); dull.setColorAt(nd, hotCol); nd++;
      }
    }
    rim.count = nr; dull.count = nd; lamp.count = nl; halo.count = nl;
    for (const m of [rim, dull, lamp, halo]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
    halo.material.opacity = 0.5 * (1 - 0.55 * hot);
    for (const [m, c] of [[cp, "#5a5148"], [ring, "#d2a04a"], [face, "#ffffff"]]) m.material.color.set(c).multiplyScalar(1 - 0.85 * smooth(0, 0.5, dead));
    back.visible = dead < 0.02 && !punch; cb.visible = !punch; hole.visible = !!punch;
  }
  P.whole.traverse((n) => { n.userData.solid = false; });
  return {
    apply(ps) {
      const lit = clamp(Math.floor(clamp(ps.lit ?? 0, 0, 1000) + 1e-6), 0, 1000), hot = clamp(val(ps, S, "hot", 0)), dead = clamp(val(ps, S, "dead", 0)), punch = val(ps, S, "punch", 0) >= 0.5 ? 1 : 0;
      const k = `${lit}|${hot}|${dead}|${punch}`;
      if (k !== key) { key = k; rebuild(lit, hot, dead, punch); }
    },
  };
}

// ------------------------------------------------------------------------------------------------ liftcable
function curlPts(p0, d0, uIn, L, turn, grow, lift, splay) {
  const d = d0.clone().normalize(), u = uIn.clone().addScaledVector(d, -uIn.dot(d)).normalize();
  const dd = d.clone().multiplyScalar(Math.cos(splay)).addScaledVector(u, Math.sin(splay)).normalize();
  const uu = u.clone().multiplyScalar(Math.cos(splay)).addScaledVector(d, -Math.sin(splay)).normalize(), w = new THREE.Vector3().crossVectors(dd, uu).normalize();
  const pts = [p0.clone()], p = p0.clone(), n = 26, step = L / n, t = new THREE.Vector3();
  for (let k = 0; k < n; k++) { const s = (k + 0.5) / n, th = turn * Math.pow(s, grow); t.copy(dd).multiplyScalar(Math.cos(th)).addScaledVector(uu, Math.sin(th)).addScaledVector(w, lift).normalize(); p.addScaledVector(t, step); pts.push(p.clone()); }
  return pts;
}
function tubeOf(pts, r, lay) {
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(12, pts.length * 3), r, 6, false), uv = g.attributes.uv;
  let L = 0; for (let i = 1; i < pts.length; i++) L += pts[i].distanceTo(pts[i - 1]);
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * L / lay);
  return g;
}
function wireTex() {
  const [c, g] = cv(64, 32);
  g.fillStyle = "#9aa0a6"; g.fillRect(0, 0, 64, 32);
  for (let i = -2; i < 6; i++) { g.fillStyle = "rgba(30,34,40,0.55)"; g.beginPath(); g.moveTo(i * 16, 32); g.lineTo(i * 16 + 6, 32); g.lineTo(i * 16 + 22, 0); g.lineTo(i * 16 + 16, 0); g.fill(); g.fillStyle = "rgba(255,255,255,0.22)"; g.fillRect(i * 16 + 7, 0, 3, 32); }
  const t = texOf(c, true); return t;
}

function buildLiftcable(P) {
  const S = P.spec, seed = S.seed ?? 1, LEN = S.len ?? 8, R = 0.0225, TW = 0.16, LAY = 0.07;
  const steel = std("#a3a9af", { roughness: 0.55, metalness: 0.35 });
  box(P.whole, 0.5, 0.25, 0.5, std("#5a6068", { roughness: 0.6, metalness: 0.3 }), 0, 0.125, 0);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 6), std("#8a9096", { metalness: 0.5 })); b.position.set(x * 0.2, 0.26, z * 0.2); P.whole.add(b); }
  box(P.whole, 0.54, 0.04, 0.54, std("#3c4249", { roughness: 0.6, metalness: 0.3 }), 0, 0.02, 0);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.09, 18), std("#454c54", { roughness: 0.5, metalness: 0.4 })); collar.position.y = 0.295; P.whole.add(collar);
  const wire = wireTex(), offs = [[0, 0]];
  for (let k = 0; k < 6; k++) offs.push([Math.cos((k * 60 + 15) * Math.PI / 180) * 0.0455, Math.sin((k * 60 + 15) * Math.PI / 180) * 0.0455]);
  for (let k = 0; k < 5; k++) offs.push([Math.cos((k * 72 + 20) * Math.PI / 180) * 0.088, Math.sin((k * 72 + 20) * Math.PI / 180) * 0.088]);
  const at = (k, y) => { const a = TW * y, c = Math.cos(a), s = Math.sin(a); return new THREE.Vector3(offs[k][0] * c - offs[k][1] * s, y, offs[k][0] * s + offs[k][1] * c); };
  const mats = offs.map((_, k) => { const m = steel.clone(); m.map = wire; m.color.setHSL(0.58, 0.05, 0.56 + (hash(k, seed, 61) - 0.5) * 0.14); m.emissive = new THREE.Color("#000000"); return m; });
  const capG = new THREE.SphereGeometry(R * 1.05, 8, 6), capM = std("#d8dce0", { roughness: 0.4, metalness: 0.3 });
  const whole = offs.map((_, k) => {
    const pts = []; for (let j = 0; j <= 32; j++) pts.push(at(k, 0.3 + ((LEN - 0.3) * j) / 32));
    const m = new THREE.Mesh(tubeOf(pts, R, LAY), mats[k]); m.castShadow = false; P.whole.add(m); return m;
  });
  const order = offs.map((_, k) => k); const rn = (i, j) => hash(i, seed, 100 + j);
  for (let i = 11; i > 0; i--) { const j = Math.floor(rn(i, 0) * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }   // order[0] snaps first
  const rank = []; order.forEach((k, j) => { rank[k] = j; });
  const snaps = new THREE.Group(); P.whole.add(snaps);
  let key = "";
  const add = (pts, k) => { const m = new THREE.Mesh(tubeOf(pts, R, LAY), mats[k]); m.userData.solid = false; snaps.add(m); const c = new THREE.Mesh(capG, capM); c.position.copy(pts[pts.length - 1]); c.userData.solid = false; snaps.add(c); };
  function rebuild(n, whip) {
    for (const o of snaps.children.slice()) { snaps.remove(o); if (o.geometry && o.geometry !== capG) o.geometry.dispose(); }
    const gone = 12 - n, newest = gone > 0 ? order[gone - 1] : -1;
    whole.forEach((m, k) => { m.visible = rank[k] >= gone; });
    for (let j = 0; j < gone; j++) {
      const k = order[j], isNew = k === newest, w = isNew ? whip : 0, az = hash(k, seed, 71) * Math.PI * 2, az2 = hash(k, seed, 72) * Math.PI * 2;
      const rad = offs[k][0] || offs[k][1] ? Math.atan2(offs[k][1], offs[k][0]) : az, mixAz = rad + (az - rad) * 0.4;
      const u1 = new THREE.Vector3(Math.cos(mixAz), 0, Math.sin(mixAz)), u2 = new THREE.Vector3(Math.cos(az2), 0, Math.sin(az2));
      const t1 = (1.5 + hash(k, seed, 73) * 1.0) * Math.PI * lerp(1, 0.6, w), t2 = (1.6 + hash(k, seed, 74) * 1.1) * Math.PI * lerp(1, 0.6, w);
      add(curlPts(at(k, 0.34), new THREE.Vector3(0, 1, 0), u1, 0.5, t1, 1.4, 0.22, 0.12 + hash(k, seed, 75) * 0.18 + w * 0.8), k);
      add(curlPts(at(k, LEN), new THREE.Vector3(0, -1, 0), u2, 1.2, t2, 2.2, 0.2, 0.1 + hash(k, seed, 76) * 0.15 + w * 0.65), k);
    }
  }
  notSolid(P.whole);
  return {
    apply(ps) {
      const n = clamp(Math.floor(clamp(val(ps, S, "strands", 12), 0, 12) + 1e-6), 0, 12), whip = clamp(val(ps, S, "whip", 0)), glow = clamp(ps.glow ?? 0);
      const k = `${n}|${whip}`; if (k !== key) { key = k; rebuild(n, whip); }
      for (const m of mats) { m.emissive.setRGB(1, 0.32, 0.04).multiplyScalar(glow * 0.95); }
    },
  };
}

// ------------------------------------------------------------------------------------------------ liftspring
// a coil of elliptic wire (a wide, a flat one when squashed): rings of a helix, normals from the ellipse
function coilGeo(R, a, bv, H, turns, seg = 44, around = 12) {
  const n = Math.round(turns * seg), pos = [], nor = [], idx = [], span = Math.max(0.0001, H - 2 * bv);
  for (let i = 0; i <= n; i++) {
    const t = i / n, ph = t * turns * Math.PI * 2, cx = Math.cos(ph), sz = Math.sin(ph), y = bv + span * t;
    for (let j = 0; j < around; j++) {
      const th = (j / around) * Math.PI * 2, ct = Math.cos(th), st = Math.sin(th);
      pos.push(cx * (R + a * ct), y + bv * st, sz * (R + a * ct));
      const nx = ct / a, ny = st / bv, l = Math.hypot(nx, ny); nor.push((cx * nx) / l, ny / l, (sz * nx) / l);
    }
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < around; j++) { const p = i * around + j, q = i * around + ((j + 1) % around); idx.push(p, p + around, q, q, p + around, q + around); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g;
}

function buildLiftspring(P) {
  const S = P.spec, R0 = S.r ?? 1.3, H0 = S.h ?? 2.4, W = 0.16, DT = 0.12;
  const red = std("#cf2a1e", { roughness: 0.38, metalness: 0.08, emissive: "#3a0804" }), steel = std("#3a414b", { roughness: 0.5, metalness: 0.45 });
  const coil = new THREE.Mesh(new THREE.BufferGeometry(), red); coil.castShadow = true; P.whole.add(coil);
  const baseD = new THREE.Mesh(new THREE.CylinderGeometry(R0 + 0.2, R0 + 0.22, DT, 40), steel); baseD.position.y = DT / 2; P.whole.add(baseD);
  const topD = new THREE.Mesh(new THREE.CylinderGeometry(R0 + 0.2, R0 + 0.2, DT, 40), steel); P.whole.add(topD);
  const bolts = (parent, y) => { for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2 + hash(k, 1, 5) * 0.05, b = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 6), std("#7b828b", { metalness: 0.5, roughness: 0.4 })); b.position.set(Math.cos(a) * (R0 + 0.1), y, Math.sin(a) * (R0 + 0.1)); b.scale.set(1, 1, 1); parent.add(b); } };
  bolts(P.whole, DT + 0.012);
  const topBolts = new THREE.Group(); P.whole.add(topBolts); bolts(topBolts, 0);
  let key = "";
  return {
    apply(ps) {
      const sq = clamp(ps.squash ?? 0), sc = Math.max(ps.scale, 0.0001);
      P.root.scale.set(sc, sc, sc);   // the engine's generic squash would squash the whole prop: this kind draws its own
      const k = `${sq}`; if (k === key) return; key = k;
      const H = lerp(H0, 0.35, sq), R = R0 * (1 + 0.08 * sq), a = W / 2, bv = Math.min(a, (H / 5) * 0.5 * 0.98);
      coil.geometry.dispose(); coil.geometry = coilGeo(R, a, bv, H, 5);
      coil.position.y = DT; topD.position.y = DT + H + DT / 2; topBolts.position.y = DT + H + DT + 0.012; topD.scale.set((R0 + 0.2 + 0.08 * sq * R0) / (R0 + 0.2), 1, (R0 + 0.2 + 0.08 * sq * R0) / (R0 + 0.2));
      topBolts.scale.set(topD.scale.x, 1, topD.scale.z);
    },
  };
}

// ------------------------------------------------------------------------------------------------ liftshell
function steelTex(seed, wM, hM, tone = [141, 149, 156]) {
  const ppm = 100, W = Math.round(wM * ppm), H = Math.round(hM * ppm), [c, g] = cv(W, H);
  g.fillStyle = rgb(tone); g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) radial(g, hash(i, seed, 1) * W, hash(i, seed, 2) * H, 30 + hash(i, seed, 3) * 80, hash(i, seed, 4) < 0.5 ? `rgba(255,255,255,${0.04 + hash(i, seed, 5) * 0.07})` : `rgba(20,24,30,${0.06 + hash(i, seed, 5) * 0.1})`, "rgba(0,0,0,0)");
  for (let i = 0; i < 90; i++) { g.fillStyle = hash(i, seed, 6) < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(20,24,30,0.07)"; g.fillRect(hash(i, seed, 7) * W, 0, 1, H); }
  const seams = [], nx = Math.max(1, Math.round(wM / 1.0)), ny = Math.max(1, Math.round(hM / 1.4));
  for (let i = 1; i < nx; i++) seams.push([0, (i / nx + (hash(i, seed, 8) - 0.5) * 0.06) * W]);
  for (let j = 1; j < ny; j++) seams.push([1, (j / ny + (hash(j, seed, 9) - 0.5) * 0.06) * H]);
  let n = 0;
  for (const [dir, p] of seams) {
    g.fillStyle = "rgba(24,28,34,0.7)"; if (dir) g.fillRect(0, p - 1, W, 3); else g.fillRect(p - 1, 0, 3, H);
    g.fillStyle = "rgba(255,255,255,0.18)"; if (dir) g.fillRect(0, p + 2, W, 1); else g.fillRect(p + 2, 0, 1, H);
    for (let q = 8; q < (dir ? W : H) - 6; q += 13) { n++; if (hash(n, seed, 10) < 0.04) continue; const a = q + (hash(n, seed, 11) - 0.5) * 3, x = dir ? a : p + 7, y = dir ? p + 7 : a; g.fillStyle = "rgba(20,24,30,0.55)"; g.beginPath(); g.arc(x + 0.8, y + 1, 2.2, 0, 7); g.fill(); g.fillStyle = rgb([tone[0] * 1.1, tone[1] * 1.1, tone[2] * 1.1]); g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); g.fillStyle = "rgba(255,255,255,0.6)"; g.beginPath(); g.arc(x - 0.6, y - 0.7, 0.8, 0, 7); g.fill(); }
  }
  g.strokeStyle = "rgba(255,255,255,0.2)"; g.lineWidth = 1;
  for (let i = 0; i < 16; i++) { const x = hash(i, seed, 12) * W, y = hash(i, seed, 13) * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (hash(i, seed, 14) - 0.5) * 70, y + (hash(i, seed, 15) - 0.5) * 30); g.stroke(); }
  return texOf(c);
}
function sootTex(seed, w, h) {
  const [c, g] = cv(w, h);
  for (let i = 0; i < 28; i++) {
    const x = hash(i, seed, 1) * w, wd = 8 + hash(i, seed, 2) * 34, ln = h * (0.35 + hash(i, seed, 3) * 0.65), a = 0.5 + hash(i, seed, 4) * 0.42;
    const gr = g.createLinearGradient(0, h, 0, h - ln); gr.addColorStop(0, `rgba(14,9,8,${a})`); gr.addColorStop(1, "rgba(14,9,8,0)"); g.fillStyle = gr; g.fillRect(x - wd / 2, h - ln, wd, ln);
  }
  const base = g.createLinearGradient(0, h, 0, 0); base.addColorStop(0, "rgba(14,9,8,0.55)"); base.addColorStop(0.7, "rgba(14,9,8,0.12)"); base.addColorStop(1, "rgba(14,9,8,0)"); g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 12; i++) radial(g, hash(i, seed, 5) * w, hash(i, seed, 6) * h, 20 + hash(i, seed, 7) * 60, `rgba(10,7,6,${0.35 + hash(i, seed, 8) * 0.35})`, "rgba(0,0,0,0)");
  return texOf(c);
}
function signTex(text) {
  const [c, g] = cv(512, 190);
  g.fillStyle = "#0b1210"; g.fillRect(0, 0, 512, 190);
  const gr = g.createLinearGradient(0, 0, 0, 190); gr.addColorStop(0, "rgba(255,255,255,0.1)"); gr.addColorStop(0.5, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 512, 190);
  let fs = 170; g.font = `bold ${fs}px 'DejaVu Sans Mono', 'DejaVu Sans', Arial, sans-serif`; const w = g.measureText(text).width; if (w > 470) { fs = Math.floor((fs * 470) / w); g.font = `bold ${fs}px 'DejaVu Sans Mono', 'DejaVu Sans', Arial, sans-serif`; }
  g.textAlign = "center"; g.textBaseline = "middle"; g.shadowColor = "rgba(90,255,170,0.9)"; g.shadowBlur = 22; g.fillStyle = "#7dffc2"; g.fillText(text, 256, 98); g.shadowBlur = 8; g.fillText(text, 256, 98);
  return texOf(c);
}
function doorGeo(s, seed) {
  const g = new THREE.PlaneGeometry(0.62, 2.05, 10, 24), p = g.attributes.position, h1 = hash(seed, 1, 1), h2 = hash(seed, 2, 2);
  for (let i = 0; i < p.count; i++) {
    const u = (p.getX(i) + 0.31) / 0.62, v = (p.getY(i) + 1.025) / 2.05;
    const z = 0.16 * Math.sin(Math.PI * v * (1.1 + 0.4 * h1) + seed) * u * u + 0.22 * v * v * u * (0.6 + 0.8 * h2) + 0.34 * smooth(0.72, 1, v) * smooth(0.35, 1, u) - 0.05 * Math.sin(v * 9 + seed) * u;
    p.setXYZ(i, s * u * 0.62, v * 2.05 - 0.12 * u * u * (0.5 + h1), z);
  }
  g.computeVertexNormals(); return g;
}

function buildLiftshell(P) {
  const S = P.spec, seed = S.seed ?? 1, hw = 2.05, G = 0.08, T = 0.05, zB = -1.6, zF = 1.25, H = 3.4;
  const matsAll = [], mk = (tex, o = {}) => { const m = std("#ffffff", { map: tex, roughness: 0.5, metalness: 0.2, ...o }); matsAll.push(m); return m; };
  const dz = zF - (zB - G - T), cz = (zF + zB - G - T) / 2, ox = hw + G + T;
  // the skin: back, floor, ceiling, two sides; ribs on the sides, a beam on the roof
  box(P.whole, 2 * ox, H + 2 * (G + T), T, mk(steelTex(seed + 1, 2 * ox, H + 2 * (G + T))), 0, H / 2, zB - G - T / 2);
  box(P.whole, 2 * ox, T, dz, mk(steelTex(seed + 2, 2 * ox, dz)), 0, -G - T / 2, cz);
  box(P.whole, 2 * ox, T, dz, mk(steelTex(seed + 3, 2 * ox, dz, [128, 135, 142])), 0, H + G + T / 2, cz);
  for (const s of [-1, 1]) box(P.whole, T, H + 2 * (G + T), dz, mk(steelTex(seed + 4 + s, dz, H + 2 * (G + T))), s * (hw + G + T / 2), H / 2, cz);
  const ribM = mk(steelTex(seed + 9, 0.3, 3.7, [118, 125, 133]));
  for (const s of [-1, 1]) for (const z of [-0.85, 0.2 + hash(seed, s, 5) * 0.1]) box(P.whole, 0.07, H + 2 * G, 0.13, ribM, s * (ox + 0.035), H / 2, z);
  const beamM = mk(steelTex(seed + 10, 4.8, 0.3, [104, 110, 118]));
  box(P.whole, 2 * ox + 0.3, 0.025, 0.3, beamM, 0, H + G + T + 0.1625, 0.55); box(P.whole, 2 * ox + 0.3, 0.14, 0.04, beamM, 0, H + G + T + 0.08, 0.55); box(P.whole, 2 * ox + 0.3, 0.025, 0.3, beamM, 0, H + G + T + 0.0125, 0.55);
  // the rim: a 0.25 m steel frame (z 1.25..1.5) round the opening, rivets along its face
  const rimM = mk(steelTex(seed + 11, 4.6, 0.5, [122, 130, 138]), { roughness: 0.45 }), RZ = zF + 0.125, ro = 2.3;   // the band is 0.5 wide: 0.25 inside the opening (the set's own side planes and ceiling hide a band outside it from the front) and 0.25 outside
  box(P.whole, 2 * ro, 0.5, 0.25, rimM, 0, H, RZ); box(P.whole, 2 * ro, 0.5, 0.25, rimM, 0, 0, RZ);
  for (const s of [-1, 1]) box(P.whole, 0.5, H - 0.5, 0.25, rimM, s * (hw), H / 2, RZ);
  const rg = new THREE.SphereGeometry(0.02, 8, 6), riv = inst(new THREE.InstancedMesh(rg, std("#aab1b8", { roughness: 0.4, metalness: 0.4 }), 140)), Mx = new THREE.Matrix4();
  let nr = 0;
  const rv = (x, y) => { Mx.makeTranslation(x + (hash(nr, seed, 1) - 0.5) * 0.012, y + (hash(nr, seed, 2) - 0.5) * 0.012, zF + 0.25 + 0.004); riv.setMatrixAt(nr++, Mx); };
  for (let x = -ro + 0.1; x < ro - 0.05; x += 0.17) { rv(x, H + 0.17); rv(x, H - 0.17); rv(x, 0.17); rv(x, -0.17); }
  for (let y = 0.5; y < H - 0.4; y += 0.2) for (const s of [-1, 1]) rv(s * hw, y);
  riv.count = nr; P.whole.add(riv);
  // the floor sign in the middle of the top rim
  const signs = new Map(), signOf = (t) => signs.get(t) || (signs.set(t, signTex(t)), signs.get(t));
  box(P.whole, 0.78, 0.31, 0.05, std("#2a2f36", { roughness: 0.5, metalness: 0.4 }), 0, H - 0.125, zF + 0.25 + 0.025);
  const glass = flat(new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.26), basic({ map: signOf(String(S.sign ?? "9999")) }))); glass.position.set(0, H - 0.125, zF + 0.25 + 0.0515); P.whole.add(glass);
  // the doors: thrown open, bent, hanging off the rim
  const doorM = mk(null, { roughness: 0.4, side: THREE.DoubleSide }); doorM.map = steelTex(seed + 12, 0.62, 2.05, [176, 180, 184]);
  const doors = [-1, 1].map((s) => {
    const m = new THREE.Mesh(doorGeo(s, seed + (s > 0 ? 3 : 7)), doorM); m.position.set(s * (ro + 0.04), 0.05, zF + 0.31); m.rotation.set(0.04 * s, -s * (1.0 + 0.2 * hash(seed, s, 9)), s * 0.07); P.whole.add(m);
    return m;
  });
  // soot and burn streaks over the rim, ribs and skin: flat sheets whose opacity is the state
  const soot = [], sheet = (w, h, x, y, z, ry, rx, sd) => { const m = flat(new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic({ map: sootTex(sd, 256, Math.max(64, Math.round(256 * h / w))), transparent: true, depthWrite: false, opacity: 0 }))); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); m.renderOrder = 3; P.whole.add(m); soot.push(m); return m; };
  sheet(2 * ro, 0.5, 0, H, zF + 0.25 + 0.003, 0, 0, seed + 20); sheet(2 * ro, 0.5, 0, 0, zF + 0.25 + 0.003, 0, 0, seed + 21);
  for (const s of [-1, 1]) {
    sheet(0.5, H - 0.5, s * hw, H / 2, zF + 0.25 + 0.003, 0, 0, seed + 22 + s);
    sheet(dz, H + 2 * (G + T), s * (ox + 0.003), H / 2, cz, s * Math.PI / 2, 0, seed + 30 + s);
  }
  sheet(2 * ox, dz, 0, H + G + T + 0.003, cz, 0, -Math.PI / 2, seed + 40);
  notSolid(P.whole);
  let shown = null;
  return {
    apply(ps) {
      const sc = clamp(ps.scorch ?? 0), cnt = ps.count ?? 0, text = cnt > 0 ? String(Math.floor(cnt + 1e-6)) : String(S.sign ?? "9999");
      if (text !== shown) { shown = text; glass.material.map = signOf(text); glass.material.needsUpdate = true; }
      const dark = 1 - 0.62 * sc; for (const m of matsAll) m.color.setScalar(dark);
      for (const m of soot) { m.material.opacity = clamp(sc * 1.1); m.visible = sc > 0.004; }
    },
  };
}

// ------------------------------------------------------------------------------------------------ shaftpit
const TILE = 10, OVER = 1.2;
function buildShaftpit(P) {
  const S = P.spec, seed = S.seed ?? 1, HH = S.h ?? 40, signY = S.signY ?? 5.2, PPM = 64, X = 3.3, ZB = -2.6, ZF = 10, tiles = Math.ceil(HH / TILE);
  const walls = new THREE.Group(); P.whole.add(walls);
  const tileTex = (wM, seedT, t, marks) => {
    const W = Math.round(wM * PPM), Hh = Math.round((TILE + 2 * OVER) * PPM), [c, g] = cv(W, Hh), topY = (t + 1) * TILE + OVER;
    paintBricks(g, W, Hh, PPM, seedT, topY, { base: [98, 54, 44] }); stainBricks(g, W, Hh, PPM, seedT, 26);
    if (marks) for (const k of marks) {
      const y = k * 4, py = (topY - y) * PPM; if (py < -40 || py > Hh + 40) continue;
      for (const sx of [0.5 - 2.3 / wM, 0.5 + 2.3 / wM]) {
        const x = sx * W; g.fillStyle = "rgba(235,215,150,0.75)"; g.fillRect(x - 0.3 * PPM, py - 0.03 * PPM, 0.6 * PPM, 0.06 * PPM);
        g.font = `bold ${0.5 * PPM}px 'DejaVu Sans', Arial, sans-serif`; g.textAlign = "center"; g.textBaseline = "bottom"; g.fillStyle = "rgba(235,215,150,0.8)"; g.fillText(String(k), x, py - 0.05 * PPM);
      }
    }
    const tx = texOf(c); tx.repeat.set(1, TILE / (TILE + 2 * OVER)); tx.offset.set(0, OVER / (TILE + 2 * OVER)); return tx;
  };
  const marks = Array.from({ length: Math.floor(HH / 4) }, (_, i) => i + 1);
  for (let t = 0; t < tiles; t++) {
    const mid = t * TILE + TILE / 2;
    const back = new THREE.Mesh(new THREE.PlaneGeometry(2 * X, TILE), std("#ffffff", { map: tileTex(2 * X, seed * 31 + t * 7, t, marks), roughness: 0.95 })); back.position.set(0, mid, ZB); walls.add(back);
    for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(ZF - ZB, TILE), std("#ffffff", { map: tileTex(ZF - ZB, seed * 31 + t * 7 + (s > 0 ? 3 : 5), t, null), roughness: 0.95 })); m.rotation.y = -s * Math.PI / 2; m.position.set(s * X, mid, (ZF + ZB) / 2); walls.add(m); }
  }
  walls.traverse((o) => { if (o.isMesh) flat(o); });
  // the floor: concrete, cracked and stained
  const [fc, fg] = cv(512, 1024);
  fg.fillStyle = "#68645f"; fg.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 120; i++) radial(fg, hash(i, seed, 1) * 512, hash(i, seed, 2) * 1024, 20 + hash(i, seed, 3) * 80, hash(i, seed, 4) < 0.6 ? `rgba(30,28,26,${0.1 + hash(i, seed, 5) * 0.2})` : `rgba(160,155,148,${0.08 + hash(i, seed, 5) * 0.1})`, "rgba(0,0,0,0)");
  fg.strokeStyle = "rgba(20,18,16,0.55)"; fg.lineWidth = 1.4;
  for (let i = 0; i < 9; i++) { let x = hash(i, seed, 6) * 512, y = hash(i, seed, 7) * 1024; fg.beginPath(); fg.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (hash(i, seed, 20 + k) - 0.5) * 60; y += (hash(i, seed, 40 + k) - 0.3) * 60; fg.lineTo(x, y); } fg.stroke(); }
  radial(fg, 330, 700, 70, "rgba(10,10,12,0.6)", "rgba(0,0,0,0)");
  const floor = flat(new THREE.Mesh(new THREE.PlaneGeometry(2 * X, ZF - ZB), std("#ffffff", { map: texOf(fc), roughness: 0.95 }))); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, (ZF + ZB) / 2); walls.add(floor);
  // two guide rails with brackets
  const rail = std("#6e757d", { roughness: 0.45, metalness: 0.5 }), brk = std("#4d535a", { roughness: 0.55, metalness: 0.4 });
  for (const x of [-1.35, 1.35]) { box(P.whole, 0.04, HH, 0.1, rail, x, HH / 2, ZB + 0.08); box(P.whole, 0.14, HH, 0.03, rail, x, HH / 2, ZB + 0.135); }
  const bn = Math.floor(HH / 1.8), bracket = inst(new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.08, 0.14), brk, bn * 2)), Mb = new THREE.Matrix4();
  for (let i = 0; i < bn; i++) for (let k = 0; k < 2; k++) { Mb.makeTranslation((k ? 1.35 : -1.35), 0.9 + i * 1.8 + (hash(i, k, seed) - 0.5) * 0.08, ZB + 0.07); bracket.setMatrixAt(i * 2 + k, Mb); }
  P.whole.add(bracket);
  // pipes: three tall ones in the corners, two across the back wall, with collars
  const pipeMats = ["#7a4a30", "#3d5a4a", "#5d6068"].map((c) => std(c, { roughness: 0.6, metalness: 0.3 }));
  [[-3.05, ZB + 0.12, 0.07, 0, HH, 0], [3.05, ZB + 0.12, 0.06, 2.5, HH, 1], [-3.2, -0.8, 0.05, 6, 28, 2]].forEach(([x, z, r, y0, y1, m]) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, y1 - y0, 12), pipeMats[m]); p.position.set(x, (y0 + y1) / 2, z); P.whole.add(p);
    for (let y = y0 + 1.5; y < y1; y += 3.3 + hash(Math.round(y), m, seed)) { const c = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.35, r * 1.35, 0.07, 12), brk); c.position.set(x, y, z); P.whole.add(c); }
  });
  for (const [y, m] of [[7.4, 0], [13.9, 2]]) { const L = 3.3 - 1.5; const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, L, 10), pipeMats[m]); p.rotation.z = Math.PI / 2; p.position.set(-1.5 - L / 2 - 0.0, y, ZB + 0.16); P.whole.add(p); }
  // the "0" plate: riveted, dark steel with a cream numeral
  const [pc, pg] = cv(512, 512);
  pg.fillStyle = "#3a3633"; pg.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 30; i++) radial(pg, hash(i, seed, 61) * 512, hash(i, seed, 62) * 512, 30 + hash(i, seed, 63) * 60, hash(i, seed, 64) < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.15)", "rgba(0,0,0,0)");
  pg.strokeStyle = "#d9c9a0"; pg.lineWidth = 8; pg.strokeRect(34, 34, 444, 444);
  pg.font = "bold 400px 'DejaVu Sans', Arial, sans-serif"; pg.textAlign = "center"; pg.textBaseline = "middle"; pg.lineWidth = 14; pg.strokeStyle = "#16120f"; pg.strokeText(String(S.sign ?? "0"), 256, 276); pg.fillStyle = "#f0e2b8"; pg.fillText(String(S.sign ?? "0"), 256, 276);
  for (const [x, y] of [[14, 14], [498, 14], [14, 498], [498, 498], [256, 12], [256, 500], [12, 256], [500, 256]]) { pg.fillStyle = "rgba(0,0,0,0.55)"; pg.beginPath(); pg.arc(x + 1.5, y + 2, 8, 0, 7); pg.fill(); pg.fillStyle = "#8a847b"; pg.beginPath(); pg.arc(x, y, 7.4, 0, 7); pg.fill(); pg.fillStyle = "rgba(255,255,255,0.5)"; pg.beginPath(); pg.arc(x - 2, y - 2.4, 2.6, 0, 7); pg.fill(); }
  const plate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 0.04), [0, 1, 2, 3, 4, 5].map((f) => (f === 4 ? std("#ffffff", { map: texOf(pc), roughness: 0.5, metalness: 0.2 }) : std("#4a4642")))); plate.position.set(0, signY, ZB + 0.02); P.whole.add(plate);
  notSolid(P.whole);
  return { apply() {} };
}

// ------------------------------------------------------------------------------------------------ shaftpass
function hallArt(label) {
  const W = 320, H = 520, [c, g] = cv(W, H);
  const bl = 0.17 * W, br = 0.83 * W, bt = 0.24 * H, bb = 0.7 * H;
  const poly = (pts, fill) => { g.fillStyle = fill; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); };
  g.fillStyle = "#f6dfae"; g.fillRect(0, 0, W, H);
  poly([[bl, bt], [br, bt], [br, bb], [bl, bb]], "#f8e4b4");
  poly([[0, 0], [bl, bt], [bl, bb], [0, H]], "#e8bf82"); poly([[W, 0], [br, bt], [br, bb], [W, H]], "#e8bf82");
  const gl = g.createLinearGradient(0, 0, bl, 0); gl.addColorStop(0, "rgba(120,60,10,0.25)"); gl.addColorStop(1, "rgba(255,240,200,0.1)"); poly([[0, 0], [bl, bt], [bl, bb], [0, H]], gl);
  const gr = g.createLinearGradient(W, 0, br, 0); gr.addColorStop(0, "rgba(120,60,10,0.25)"); gr.addColorStop(1, "rgba(255,240,200,0.1)"); poly([[W, 0], [br, bt], [br, bb], [W, H]], gr);
  poly([[0, 0], [W, 0], [br, bt], [bl, bt]], "#fff2d2");
  g.fillStyle = "#fffbe8"; g.fillRect(W * 0.38, 0.05 * H, W * 0.24, 6); poly([[W * 0.4, bt * 0.62], [W * 0.6, bt * 0.62], [W * 0.56, bt * 0.85], [W * 0.44, bt * 0.85]], "#fffbe0");
  poly([[0, H], [W, H], [br, bb], [bl, bb]], "#a8302a");
  poly([[W * 0.36, H], [W * 0.64, H], [W * 0.54, bb], [W * 0.46, bb]], "#7e2220");
  g.strokeStyle = "#e3b24c"; g.lineWidth = 4; for (const [a, b] of [[0.05, 0.3], [0.95, 0.7]]) { g.beginPath(); g.moveTo(a * W, H); g.lineTo(b * W, bb); g.stroke(); }
  for (const s of [-1, 1]) {   // the wainscot: a dark wood band along the bottom third of each side wall, a chair rail on top
    const f = (q, end) => { const nearY = H * (1 - q), farY = bb - q * (bb - bt); return end ? [s < 0 ? bl : br, farY] : [s < 0 ? 0 : W, nearY]; };
    poly([f(0, 0), f(0, 1), f(0.33, 1), f(0.33, 0)], "#7a4b2a"); g.strokeStyle = "#f2d9a0"; g.lineWidth = 3; g.beginPath(); g.moveTo(...f(0.33, 0)); g.lineTo(...f(0.33, 1)); g.stroke();
  }
  // wall lamps: a warm shade and its glow, two a side
  for (const [x, y, r] of [[0.07, 0.4, 16], [0.93, 0.4, 16], [0.14, 0.43, 9], [0.86, 0.43, 9]]) { radial(g, x * W, y * H, r * 3.2, "rgba(255,226,140,0.7)", "rgba(255,210,120,0)"); g.fillStyle = "#fff3bd"; g.beginPath(); g.ellipse(x * W, y * H, r * 0.5, r * 0.8, 0, 0, 7); g.fill(); g.fillStyle = "#b9863a"; g.fillRect(x * W - r * 0.22, y * H + r * 0.7, r * 0.44, r * 0.3); }
  // the plaque on the far wall: brass, with the label
  g.fillStyle = "#6b4a1c"; g.fillRect(W * 0.5 - 66, 0.385 * H - 29, 132, 58); g.fillStyle = "#d9a94c"; g.fillRect(W * 0.5 - 62, 0.385 * H - 25, 124, 50); g.fillStyle = "rgba(255,240,170,0.5)"; g.fillRect(W * 0.5 - 62, 0.385 * H - 25, 124, 6);
  let fs = 44; g.font = `bold ${fs}px 'DejaVu Sans', Arial, sans-serif`; const tw = g.measureText(label).width; if (tw > 112) { fs = Math.floor((fs * 112) / tw); g.font = `bold ${fs}px 'DejaVu Sans', Arial, sans-serif`; }
  g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#2c1a06"; g.fillText(label, W * 0.5, 0.385 * H + 2);
  // a picture and a plant for life
  g.fillStyle = "#7d6a8c"; g.fillRect(bl + 12, bt + 14, 26, 34); g.fillStyle = "#4e7a3c"; g.beginPath(); g.ellipse(br - 22, bb - 18, 14, 22, 0, 0, 7); g.fill(); g.fillStyle = "#a35a34"; g.fillRect(br - 30, bb - 6, 16, 8);
  // the door frame: brass jambs and a lintel
  g.strokeStyle = "#8a5f22"; g.lineWidth = 12; g.strokeRect(6, 6, W - 12, H - 12); g.strokeStyle = "rgba(255,230,150,0.7)"; g.lineWidth = 2; g.strokeRect(13, 13, W - 26, H - 26);
  return c;
}
// a vertical smear: the sharp painting stretched about its middle and averaged over a run of offsets
function smear(src, w, h, run, stretch) {
  const [c, g] = cv(w, h), n = 18; g.fillStyle = "#6a3a2a"; g.fillRect(0, 0, w, h);
  for (let k = 0; k < n; k++) { const off = (k / (n - 1) - 0.5) * run * h; g.globalAlpha = 1 / (k + 1); g.drawImage(src, 0, 0, src.width, src.height, 0, h * (1 - stretch) / 2 + off, w, h * stretch); }
  g.globalAlpha = 1; return c;
}

function buildShaftpass(P) {
  const S = P.spec, seed = S.seed ?? 1, W = S.w ?? 3.4, HH = S.h ?? 60, floors = S.floors || [{ y: 30, label: "800" }], PPM = 110, tiles = Math.ceil(HH / TILE);
  const wall = new THREE.Group(); P.whole.add(wall);
  const sharp = [], blurred = [];
  const crop = (c) => { const tx = texOf(c); tx.repeat.set(1, TILE / (TILE + 2 * OVER)); tx.offset.set(0, OVER / (TILE + 2 * OVER)); return tx; };
  const sharpC = [];
  for (let t = 0; t < tiles; t++) {
    const Wp = Math.round(W * PPM), Hp = Math.round((TILE + 2 * OVER) * PPM), [c, g] = cv(Wp, Hp), topY = (t + 1) * TILE + OVER;
    paintBricks(g, Wp, Hp, PPM, seed * 53 + t * 11, topY, { base: [112, 62, 50], lo: 0.7, span: 0.5 }); stainBricks(g, Wp, Hp, PPM, seed * 53 + t, 9);
    sharpC.push(c);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W, TILE), basic({ map: crop(c) })); m.rotation.y = Math.PI; m.position.set(0, t * TILE + TILE / 2, 0); wall.add(m); sharp.push(m);
  }
  // the streak version of every tile, made the first time it is needed
  let made = false;
  const makeBlur = () => {
    if (made) return; made = true;
    sharpC.forEach((c, t) => {
      const sm = smear(c, Math.round(c.width / 3), Math.round(c.height / 3), (1.3 / (TILE + 2 * OVER)), 1);
      const tx = crop(sm); const m = new THREE.Mesh(new THREE.PlaneGeometry(W, TILE), basic({ map: tx, transparent: true, opacity: 0, depthWrite: false }));
      m.rotation.y = Math.PI; m.position.set(0, t * TILE + TILE / 2, -0.002); m.renderOrder = 1; wall.add(m); blurred.push(m);
    });
  };
  const halls = floors.map((f, i) => {
    const y = f.y + 1.05, label = String(f.label ?? ""), grp = new THREE.Group(); grp.position.set(0, y, 0); P.whole.add(grp);
    const glow = flat(new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.8), basic({ map: glowTex(), color: "#ffb250", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.4 }))); glow.position.z = -0.003; glow.renderOrder = 2; grp.add(glow);
    const src = hallArt(label), sharpM = flat(new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.1), basic({ map: texOf(src) }))); sharpM.rotation.y = Math.PI; sharpM.position.z = -0.005; sharpM.renderOrder = 3; grp.add(sharpM);
    return { grp, src, sharpM, blurM: null, glow, y, i };
  });
  notSolid(P.whole);
  return {
    apply(ps) {
      const b = clamp(val(ps, S, "blur", 0));
      if (b > 0.001) makeBlur();
      blurred.forEach((m) => { m.material.opacity = b; m.visible = b > 0.001; });
      for (const h of halls) {
        if (b > 0.001 && !h.blurM) { const c = smear(h.src, 160, 260, 0.3, 1); h.blurM = flat(new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.1), basic({ map: texOf(c), transparent: true, opacity: 0, depthWrite: false }))); h.blurM.rotation.y = Math.PI; h.blurM.position.z = -0.007; h.blurM.renderOrder = 4; h.blurM.userData.solid = false; h.grp.add(h.blurM); }
        if (h.blurM) { h.blurM.material.opacity = b; h.blurM.visible = b > 0.001; h.blurM.scale.set(1 - 0.04 * b, 1 + 0.25 * b, 1); }
        h.sharpM.scale.set(1, 1, 1); h.glow.scale.set(1, 1 + 0.25 * b, 1);
      }
    },
  };
}

export const LIFT_KINDS = {
  liftpanel: buildLiftpanel,
  liftcable: buildLiftcable,
  liftspring: buildLiftspring,
  liftshell: buildLiftshell,
  shaftpit: buildShaftpit,
  shaftpass: buildShaftpass,
};
