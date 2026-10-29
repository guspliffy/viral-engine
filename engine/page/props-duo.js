import * as THREE from "three";
import { clamp, rng } from "./util.js";

// Props for "DUO: Launch Day" (Jonny's story library #10, 28 Oct 2026): a phone-launch queue outside the bitten-peach
// store, two foldable phones that fail in two different ways, their boxes, and the queue's camping gear.
//   foldphone   a silver book-fold phone: two rigid halves on one hinge. Origin = the bottom of the hinge; open flat,
//               the halves stand in the prop's x-y plane (left x -W..0, right 0..W) with their screens facing +z.
//               `open` 0..1 swings both halves the same amount about the hinge, like a book opened toward the viewer:
//               at 0 both point along +z, screen to screen (the closed phone, its spine at the origin, its free edge
//               at z W), at 1 flat. `gap` (metres) snaps the hinge: each half slides gap/2 outward and keeps its half
//               of the barrel. `crack` 0..1 breaks both screens (branching cracks, dead ink-bleed patches, static
//               cyan/magenta/white bands) in four steps. `glow` 0..1 lights the display (default 1).
//               Lying in its box: tilt -90 (the length along -x, the back of the right half up).
//               foldPoint(open, gap, side, u, v, out) gives a point on a half for the clip to aim a hand at.
//   duobox      the white box's base with its fitted tray: origin the bottom centre, open at the top (BOX.H).
//   duolid      the lid with the peach mark and "DUO" on top: origin the bottom of its skirt. On the base its bottom sits
//               at BOX.H - BOX.SKIRT.
//   ledge       the pale stone display ledge outside the store: spec.w (along x), spec.h (top), spec.d.
//   storedoors  two sliding glass panels, the doorway's middle at the floor; `open` 0..1 slides each one out sideways.
//   tent        a small dome tent (spec.color, spec.w along x, spec.d, spec.h), its zipped door facing +z.
//   sleepingbag an unrolled quilted bag lying along x (spec.color, spec.w, spec.d); `cover` 0..1 is its top half folded
//               up over the lap of someone sitting at its head end (x -), 0 kicked off flat.
//   campmug     a steel camping mug with a wire handle.     campchair  a folding camp chair facing +z.
//   stanchions  queue posts with black belts between them: spec.posts = [[x, z], ...] in the prop's frame.
//   seatmark    nothing visible: a seat for `sit` on the ground (put it at y -0.35 for a body sitting on the floor).
// a big cartoon phone: two gloves (13 cm each) fit on it closed without meeting
export const FOLD = { W: 0.19, H: 0.24, T: 0.0048 };
// the box leaves a glove's width (7 cm) round the closed phone and stands taller than a glove's half height, so hands
// carrying it by its ends, or taking the phone out, stay clear of its walls and of the surface under it
export const BOX = { W: 0.38, D: 0.33, H: 0.08, SKIRT: 0.035, TRAY: 0.0744 };
export const DUO_GRIPS = {};

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o });
const basic = (o) => { const m = new THREE.MeshBasicMaterial(o); m.userData.noOutline = true; return m; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
// a box with rounded vertical edges (an extruded rounded rectangle), centred, w x h x d
function roundBox(w, h, d, r, seg = 6) {
  const s = new THREE.Shape(), x = w / 2 - r, z = d / 2 - r;
  s.moveTo(-x, -d / 2); s.lineTo(x, -d / 2); s.absarc(x, -z, r, -Math.PI / 2, 0); s.lineTo(w / 2, z); s.absarc(x, z, r, 0, Math.PI / 2);
  s.lineTo(-x, d / 2); s.absarc(-x, z, r, Math.PI / 2, Math.PI); s.lineTo(-w / 2, -z); s.absarc(-x, -z, r, Math.PI, Math.PI * 1.5);
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: seg });
  g.rotateX(Math.PI / 2); g.translate(0, h / 2, 0); return g;
}

// ---------------------------------------------------------------- the bitten-peach mark (one drawing, reused everywhere)
// centred on (cx, cy), r = half its width. A round peach with a soft cleft, one leaf on a short stem, and a bite taken
// out of its right edge. tone "glow" is the backlit sign version.
export function drawPeach(g, cx, cy, r, tone = "print") {
  const c = document.createElement("canvas"), S = Math.ceil(r * 2.6); c.width = c.height = S;
  const p = c.getContext("2d"), o = S / 2, R = r * 0.98;
  // the fruit: two overlapping lobes and a rounder bottom, slightly taller than wide
  const gr = p.createRadialGradient(o - R * 0.35, o - R * 0.25, R * 0.08, o, o + R * 0.1, R * 1.25);
  gr.addColorStop(0, tone === "glow" ? "#fff0d8" : "#ffd9b0"); gr.addColorStop(0.45, "#ffa46e"); gr.addColorStop(1, "#f06a78");
  p.fillStyle = gr; p.beginPath();
  p.moveTo(o, o - R * 0.62);
  p.bezierCurveTo(o + R * 0.55, o - R * 1.02, o + R * 1.05, o - R * 0.5, o + R * 0.98, o + R * 0.12);
  p.bezierCurveTo(o + R * 0.92, o + R * 0.78, o + R * 0.38, o + R * 1.08, o, o + R * 1.06);
  p.bezierCurveTo(o - R * 0.38, o + R * 1.08, o - R * 0.92, o + R * 0.78, o - R * 0.98, o + R * 0.12);
  p.bezierCurveTo(o - R * 1.05, o - R * 0.5, o - R * 0.55, o - R * 1.02, o, o - R * 0.62);
  p.fill();
  // the cleft: a soft darker curve down the middle, from the dip at the top
  p.strokeStyle = "rgba(214,72,88,0.55)"; p.lineWidth = R * 0.07; p.lineCap = "round"; p.beginPath();
  p.moveTo(o + R * 0.02, o - R * 0.55); p.bezierCurveTo(o - R * 0.16, o - R * 0.1, o - R * 0.12, o + R * 0.45, o + R * 0.06, o + R * 0.78); p.stroke();
  // the bite: three overlapping round tooth marks out of the right edge
  p.globalCompositeOperation = "destination-out";
  for (const [dx, dy, rr] of [[1.04, -0.12, 0.2], [1.1, 0.12, 0.19], [0.98, 0.32, 0.15]]) { p.beginPath(); p.arc(o + R * dx, o + R * dy, R * rr, 0, Math.PI * 2); p.fill(); }
  p.globalCompositeOperation = "source-over";
  // stem and one leaf, up and to the right of the dip
  p.strokeStyle = "#6b4a2b"; p.lineWidth = R * 0.07; p.beginPath(); p.moveTo(o, o - R * 0.6); p.quadraticCurveTo(o + R * 0.02, o - R * 0.82, o + R * 0.1, o - R * 0.92); p.stroke();
  p.save(); p.translate(o + R * 0.12, o - R * 0.9); p.rotate(-0.45);
  const lg = p.createLinearGradient(0, -R * 0.2, R * 0.6, R * 0.1); lg.addColorStop(0, "#7fd04e"); lg.addColorStop(1, "#3e9a36");
  p.fillStyle = lg; p.beginPath(); p.moveTo(0, 0); p.quadraticCurveTo(R * 0.25, -R * 0.26, R * 0.58, -R * 0.06); p.quadraticCurveTo(R * 0.3, R * 0.16, 0, 0); p.fill();
  p.strokeStyle = "rgba(40,110,40,0.7)"; p.lineWidth = R * 0.025; p.beginPath(); p.moveTo(R * 0.04, -R * 0.01); p.lineTo(R * 0.48, -R * 0.06); p.stroke();
  p.restore();
  if (tone === "glow") { g.save(); g.shadowColor = "rgba(255,170,120,0.9)"; g.shadowBlur = r * 0.35; g.drawImage(c, cx - o, cy - o); g.restore(); }
  g.drawImage(c, cx - o, cy - o);
}

// the wallpaper both phones ship with: deep blue to amber in soft waves, one picture across the two halves (the left
// half shows u 0..0.5, the right half 0.5..1)
function wallpaper(g, w, h) {
  const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, "#14246e"); bg.addColorStop(0.45, "#2d55d6"); bg.addColorStop(0.75, "#f2a24a"); bg.addColorStop(1, "#ffd27a");
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  for (let k = 0; k < 5; k++) {
    g.fillStyle = `rgba(${k % 2 ? "255,200,120" : "120,170,255"},${0.16 + 0.04 * k})`; g.beginPath();
    g.moveTo(0, h * (0.35 + k * 0.13));
    g.bezierCurveTo(w * 0.3, h * (0.18 + k * 0.13), w * 0.6, h * (0.62 + k * 0.1), w, h * (0.3 + k * 0.14));
    g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill();
  }
  // a soft clock-like glow and a row of dots: a lock screen without words
  const gl = g.createRadialGradient(w * 0.3, h * 0.24, 4, w * 0.3, h * 0.24, w * 0.22); gl.addColorStop(0, "rgba(255,255,255,0.5)"); gl.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gl; g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(255,255,255,0.85)"; g.font = `bold ${Math.round(h * 0.09)}px 'DejaVu Sans', Arial, sans-serif`; g.textAlign = "center"; g.fillText("9:41", w * 0.27, h * 0.27);
}

// a broken screen at stage k (1..4): cracks branch from an impact point, dead black patches bleed out from the cracks,
// and static bands of corrupted cyan / magenta / white run across. Seeded, so the same every frame and every render.
function brokenScreen(g, w, h, k, seed, side) {
  const r = rng(seed);
  wallpaper(g, w * 2, h);   // only the half's own part is drawn below via the caller's translate
  // dead patches: blobby black ink with ragged edges
  const blobs = [[0.55, 0.42, 0.34], [0.3, 0.7, 0.26], [0.75, 0.82, 0.2], [0.2, 0.2, 0.18]];
  for (let i = 0; i < Math.min(blobs.length, k); i++) {
    const [bx, by, br] = blobs[(i + side) % blobs.length], cx = (side ? w : 0) + bx * w, cy = by * h, R = br * w * (0.6 + 0.25 * k);
    g.fillStyle = "#06060a"; g.beginPath();
    for (let a = 0; a <= 24; a++) { const t = (a / 24) * Math.PI * 2, q = R * (0.65 + 0.5 * r()); g.lineTo(cx + Math.cos(t) * q, cy + Math.sin(t) * q * 1.2); }
    g.fill();
    // ink fingers running down from it
    for (let f = 0; f < 3; f++) { const fx = cx + (r() - 0.5) * R * 1.4; g.fillRect(fx, cy, R * 0.12 * (0.5 + r()), R * (0.8 + r() * 1.6)); }
  }
  // corrupted bands: thin horizontal streaks of cyan, magenta and white, grouped
  if (k >= 2) {
    const n = 6 + k * 5;
    for (let i = 0; i < n; i++) {
      const y = h * (0.15 + 0.7 * r()), x0 = (side ? w : 0) + w * r() * 0.5, len = w * (0.25 + 0.7 * r());
      g.fillStyle = ["rgba(60,255,255,1)", "rgba(255,60,220,1)", "rgba(255,255,255,1)", "rgba(150,110,255,1)"][i % 4];
      g.fillRect(x0, y, len, 4 + r() * 9);
    }
  }
  // cracks: branching jagged lines from an impact point near the hinge side
  const ix = (side ? w : 0) + (side ? 0.22 : 0.78) * w, iy = h * (0.35 + 0.2 * r());
  const lines = 5 + k * 4;
  g.lineCap = "round";
  const branch = (x, y, a, len, wdt, depth) => {
    let px = x, py = y;
    const steps = 5;
    g.beginPath(); g.moveTo(px, py);
    for (let s = 0; s < steps; s++) { a += (r() - 0.5) * 0.9; px += Math.cos(a) * len / steps; py += Math.sin(a) * len / steps; g.lineTo(px, py); if (depth < 2 && r() < 0.35) branch(px, py, a + (r() - 0.5) * 2, len * 0.5, wdt * 0.6, depth + 1); }
    g.strokeStyle = "rgba(235,245,255,0.95)"; g.lineWidth = wdt; g.stroke();
    g.strokeStyle = "rgba(20,20,30,0.6)"; g.lineWidth = wdt * 0.45; g.stroke();
  };
  for (let i = 0; i < lines; i++) branch(ix, iy, (i / lines) * Math.PI * 2 + r() * 0.4, w * (0.35 + 0.6 * r()) * (0.5 + k / 8), 7, 0);
  // the impact star
  g.fillStyle = "rgba(240,248,255,0.9)"; g.beginPath(); g.arc(ix, iy, w * 0.05, 0, Math.PI * 2); g.fill();
}

// a point on a phone half in the prop's frame: side -1 (the left half) or +1 (the right half), u 0 at the hinge .. 1
// at its free edge, v 0 bottom .. 1 top, out = metres off its back (+) or its screen (-)
export function foldPoint(open, gap, side, u, v, out = 0) {
  return onHalf(open, gap, side, [side * u * FOLD.W, v * FOLD.H, -FOLD.T - out]);
}
// a point (or with dir, a direction) in a half's own frame -> the prop's frame: the one transform the half's pivot
// gets in the mesh (apply below), so a hand on a half and the half itself never disagree. The half's own frame: x
// across the phone (the right half's free edge at +W, the left half's at -W), y up from its bottom, z out of its screen
export function onHalf(open, gap, side, [x, y, z], dir = false) {
  const a = -side * (Math.PI / 2) * (1 - clamp(open)), c = Math.cos(a), s = Math.sin(a);
  return [x * c + z * s + (dir ? 0 : (side * gap) / 2), y, -x * s + z * c];
}
// the parts of a duo prop a hand can hold (props3d.js partPoint): a foldphone's halves, "L" and "R"
export const DUO_PARTS = {
  foldphone: (ps, part, p, dir) => onHalf(ps.open ?? 0, ps.gap ?? 0, part === "L" ? -1 : 1, p, dir),
};

export const DUO_KINDS = {
  foldphone(P) {
    const { W, H, T } = FOLD, S = P.spec;
    const frame = mat("#d9dde3", { roughness: 0.22, metalness: 0.75 }), back = mat("#c9ced6", { roughness: 0.3, metalness: 0.65 }), bezel = mat("#0b0c10", { roughness: 0.2 });
    const wp = canvasTex(1024, 768, wallpaper);
    const halfTex = (t, s) => { const c = t.clone(); c.needsUpdate = true; c.repeat.set(0.5, 1); c.offset.set(s > 0 ? 0.5 : 0, 0); return c; };
    const broken = [1, 2, 3, 4].map((k) => halfTex(canvasTex(1024, 768, (g, w, h) => brokenScreen(g, w / 2, h, k, (S.seed ?? 5) * 31 + k, 0)), -1));
    const brokenR = [1, 2, 3, 4].map((k) => halfTex(canvasTex(1024, 768, (g, w, h) => brokenScreen(g, w / 2, h, k, (S.seed ?? 5) * 57 + k, 1)), 1));
    const halves = [-1, 1].map((s) => {
      const piv = new THREE.Group(); P.whole.add(piv);
      // the body: a thin rounded slab, its screen side at z 0, its back at -T
      const body = mesh(roundBox(W, T, H, 0.012), frame, piv); body.rotation.x = Math.PI / 2; body.position.set(s * W / 2, H / 2, -T / 2);
      const bk = mesh(new THREE.PlaneGeometry(W - 0.01, H - 0.01), back, piv, s * W / 2, H / 2, -T - 0.0004); bk.rotation.y = Math.PI; bk.castShadow = false;
      const bz = mesh(new THREE.PlaneGeometry(W - 0.006, H - 0.006), bezel, piv, s * W / 2, H / 2, 0.0004); bz.castShadow = false;
      const scrM = basic({ map: halfTex(wp, s), toneMapped: false });
      const scr = mesh(new THREE.PlaneGeometry(W - 0.016, H - 0.018), scrM, piv, s * (W / 2 + 0.002), H / 2, 0.0008); scr.castShadow = false;
      // the hinge barrel's half on this side, and (left) the cameras on the back
      const barrel = mesh(new THREE.CylinderGeometry(T * 0.62, T * 0.62, H * 0.97, 14, 1, false, s > 0 ? 0 : Math.PI, Math.PI), frame, piv, 0, H / 2, -T / 2);
      if (s < 0) for (const dy of [0.82, 0.72]) { const lens = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.003, 18), bezel, piv, -W * 0.78, H * dy, -T - 0.0015); lens.rotation.x = Math.PI / 2; }
      if (s > 0) {   // a small peach on the back of the right half: the closed phone shows it
        const lg = canvasTex(128, 128, (g) => drawPeach(g, 64, 66, 40));
        const logo = mesh(new THREE.PlaneGeometry(0.06, 0.06), new THREE.MeshStandardMaterial({ map: lg, transparent: true, roughness: 0.3, metalness: 0.3 }), piv, W * 0.5, H * 0.55, -T - 0.0009);
        logo.rotation.y = Math.PI; logo.castShadow = false; logo.material.userData.noOutline = true;
      }
      return { s, piv, scrM, intact: scrM.map, barrel };
    });
    return {
      grip: 0,
      apply(ps) {
        const gap = ps.gap ?? 0, k = Math.min(4, Math.floor(clamp(ps.crack ?? 0) * 4 + 1e-6)), glow = ps.glow ?? 1;
        for (const h of halves) {
          h.piv.position.x = (h.s * gap) / 2;
          h.piv.rotation.y = -h.s * (Math.PI / 2) * (1 - clamp(ps.open));   // the same turn as onHalf
          h.scrM.map = k > 0 ? (h.s < 0 ? broken : brokenR)[k - 1] : h.intact;
          h.scrM.color.setScalar(0.35 + 0.65 * glow);
        }
      },
    };
  },

  duobox(P) {
    const { W, D, H, TRAY } = BOX, white = mat("#f7f6f2", { roughness: 0.6 }), tray = mat("#e9e7e1", { roughness: 0.7 }), well = mat("#d8d5cd", { roughness: 0.8 });
    const t = 0.008;
    mesh(new THREE.BoxGeometry(W, 0.006, D), white, P.whole, 0, 0.003, 0);
    for (const s of [-1, 1]) { mesh(new THREE.BoxGeometry(t, H, D), white, P.whole, s * (W / 2 - t / 2), H / 2, 0); mesh(new THREE.BoxGeometry(W, H, t), white, P.whole, 0, H / 2, s * (D / 2 - t / 2)); }
    // the fitted tray: a raised insert with a phone-shaped well in it
    const tr = mesh(new THREE.BoxGeometry(W - 2 * t, 0.004, D - 2 * t), tray, P.whole, 0, TRAY, 0); tr.castShadow = false;
    const w = mesh(new THREE.BoxGeometry(BOX.W * 0.8, 0.003, BOX.D * 0.72), well, P.whole, 0, TRAY + 0.0012, 0); w.castShadow = false;
    return { grip: H / 2 };
  },

  duolid(P) {
    const { W, D, SKIRT } = BOX, t = 0.007, L = 0.012, white = mat("#fbfaf6", { roughness: 0.55 });
    const top = canvasTex(640, 512, (g, w, h) => {
      g.fillStyle = "#fbfaf6"; g.fillRect(0, 0, w, h);
      drawPeach(g, w / 2, h * 0.4, h * 0.24);
      g.fillStyle = "#3d4fa3"; g.font = `bold ${Math.round(h * 0.15)}px 'DejaVu Sans', Arial, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("DUO", w / 2, h * 0.78);
    });
    const tw = W + 2 * L, td = D + 2 * L;
    const lid = mesh(new THREE.BoxGeometry(tw, t, td), [white, white, mat("#ffffff", { map: top, roughness: 0.55 }), white, white, white], P.whole, 0, SKIRT + t / 2, 0);
    for (const s of [-1, 1]) { mesh(new THREE.BoxGeometry(t, SKIRT, td), white, P.whole, s * (tw / 2 - t / 2), SKIRT / 2, 0); mesh(new THREE.BoxGeometry(tw, SKIRT, t), white, P.whole, 0, SKIRT / 2, s * (td / 2 - t / 2)); }
    lid.castShadow = true;
    return { grip: SKIRT };
  },

  ledge(P) {
    const S = P.spec, w = S.w ?? 2, h = S.h ?? 0.4, d = S.d ?? 0.46, rnd = rng(17);
    const stone = canvasTex(512, 256, (g, cw, ch) => {
      g.fillStyle = "#efe6d8"; g.fillRect(0, 0, cw, ch);
      for (let i = 0; i < 1400; i++) { const v = 200 + Math.floor(rnd() * 50); g.fillStyle = `rgba(${v},${v - 12},${v - 26},0.25)`; g.fillRect(rnd() * cw, rnd() * ch, 2 + rnd() * 3, 1 + rnd() * 2); }
      g.strokeStyle = "rgba(160,140,120,0.35)"; g.lineWidth = 2; for (const x of [0.33, 0.66]) { g.beginPath(); g.moveTo(cw * x, 0); g.lineTo(cw * x, ch); g.stroke(); }
    });
    const m = mat("#ffffff", { map: stone, roughness: 0.75 }), cap = mat("#f6efe4", { roughness: 0.5 });
    mesh(new THREE.BoxGeometry(w, h - 0.04, d - 0.04), m, P.whole, 0, (h - 0.04) / 2, 0);
    mesh(roundBox(w + 0.04, 0.04, d, 0.015), cap, P.whole, 0, h - 0.02, 0);
    return { grip: h };
  },

  storedoors(P) {
    const hw = P.spec.hw ?? 0.6, h = P.spec.h ?? 2.2;
    const glass = new THREE.MeshStandardMaterial({ color: "#bfe0ee", roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.22, depthWrite: false });
    glass.userData.noOutline = true;
    const frame = mat("#7b8088", { roughness: 0.35, metalness: 0.6 });
    const panels = [-1, 1].map((s) => {
      const g = new THREE.Group(); P.whole.add(g);
      const p = new THREE.Mesh(new THREE.BoxGeometry(hw - 0.04, h - 0.06, 0.012), glass); p.position.set(s * hw / 2, h / 2, 0); p.renderOrder = 3; g.add(p);
      for (const [w, hh, x, y] of [[hw, 0.04, s * hw / 2, h - 0.02], [hw, 0.05, s * hw / 2, 0.025], [0.035, h, s * 0.018, h / 2], [0.035, h, s * (hw - 0.018), h / 2]]) mesh(new THREE.BoxGeometry(w, hh, 0.03), frame, g, x, y, 0);
      // a long vertical pull bar beside the meeting edge
      mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.7, 10), frame, g, s * 0.1, h * 0.48, 0.035);
      return [s, g];
    });
    return { apply(ps) { const k = clamp(ps.open); for (const [s, g] of panels) g.position.x = s * hw * 0.98 * k; } };
  },

  tent(P) {
    const S = P.spec, w = S.w ?? 1.3, d = S.d ?? 0.8, h = S.h ?? 0.75;
    const fly = mat(S.color ?? "#2aa6c9", { roughness: 0.7, side: THREE.DoubleSide }), dark = mat("#1d2a33", { roughness: 0.9 }), trim = mat(S.trim ?? "#e9edf0", { roughness: 0.7 });
    // a dome: a half ellipsoid with flattened sides
    const dome = mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), fly, P.whole); dome.scale.set(w / 2, h, d / 2);
    // the door: a dark zipped-half-open arch on the front
    const door = mesh(new THREE.CircleGeometry(1, 32, 0, Math.PI), dark, P.whole, -w * 0.08, 0.004, d / 2 * 0.92); door.scale.set(w * 0.2, h * 0.62, 1); door.castShadow = false;
    door.rotation.x = -0.32;
    const flap = mesh(new THREE.CircleGeometry(1, 24, 0, Math.PI / 2), trim, P.whole, -w * 0.08, 0.006, d / 2 * 0.95); flap.scale.set(w * 0.22, h * 0.64, 1); flap.rotation.x = -0.3; flap.castShadow = false;
    // two crossing poles over the top
    const pole = mat("#3a3f45", { roughness: 0.4 });
    for (const s of [-1, 1]) {
      const pts = []; for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI; pts.push(new THREE.Vector3(Math.cos(a) * w / 2 * 1.005, Math.sin(a) * h * 1.005, s * Math.cos(a) * d / 2 * 0.45)); }
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.008, 6, false), pole, P.whole);
    }
    // a groundsheet edge
    const gs = mesh(new THREE.CylinderGeometry(1, 1, 0.01, 40), dark, P.whole, 0, 0.005, 0); gs.scale.set(w / 2 + 0.04, 1, d / 2 + 0.04); gs.castShadow = false;
    return { grip: 0 };
  },

  sleepingbag(P) {
    const S = P.spec, w = S.w ?? 1.1, d = S.d ?? 0.5, th = 0.07;
    const quilt = canvasTex(512, 256, (g, cw, ch) => {
      g.fillStyle = S.color ?? "#2f62b8"; g.fillRect(0, 0, cw, ch);
      for (let i = 1; i < 7; i++) { g.fillStyle = "rgba(10,20,60,0.25)"; g.fillRect((cw * i) / 7 - 3, 0, 6, ch); g.fillStyle = "rgba(255,255,255,0.08)"; g.fillRect((cw * i) / 7 + 6, 0, 22, ch); }
    });
    const m = mat("#ffffff", { map: quilt, roughness: 0.8 }), lining = mat(S.lining ?? "#f0b23c", { roughness: 0.85 });
    const base = mesh(roundBox(w, th, d, 0.12, 8), m, P.whole, 0, th / 2, 0); base.castShadow = false;
    // the top layer: lies flat on the base (cover 0) or is pulled up over the lap toward the head end (cover 1)
    const top = new THREE.Group(); P.whole.add(top);
    const hump = mesh(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), m, top); hump.scale.set(w * 0.36, 0.2, d * 0.56);
    const rim = mesh(new THREE.TorusGeometry(1, 0.06, 8, 28, Math.PI), lining, top, -w * 0.36 * 0.96, 0, 0); rim.scale.set(0.1, 0.2, d * 0.56); rim.rotation.set(0, Math.PI / 2, Math.PI / 2); rim.castShadow = false;
    return {
      grip: th,
      apply(ps) { const k = clamp(ps.cover ?? S.cover ?? 0); top.position.set(w * 0.12 - w * 0.06 * k, th, 0); top.scale.set(1, 0.18 + 0.82 * k, 1); },
    };
  },

  campmug(P) {
    const steel = mat("#c7ccd2", { roughness: 0.3, metalness: 0.7 }), dark = mat("#1b1d22", { roughness: 0.6 });
    const cup = mesh(new THREE.CylinderGeometry(0.045, 0.042, 0.085, 24, 1, true), steel, P.whole, 0, 0.0425, 0); cup.material.side = THREE.DoubleSide;
    mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.004, 24), steel, P.whole, 0, 0.002, 0);
    const coffee = mesh(new THREE.CircleGeometry(0.043, 24), dark, P.whole, 0, 0.07, 0); coffee.rotation.x = -Math.PI / 2; coffee.castShadow = false;
    const h = mesh(new THREE.TorusGeometry(0.026, 0.005, 8, 18, Math.PI), steel, P.whole, 0.045, 0.045, 0); h.rotation.z = -Math.PI / 2;
    return { grip: 0.04 };
  },

  campchair(P) {
    const cloth = mat(P.spec.color ?? "#1f5f8b", { roughness: 0.8, side: THREE.DoubleSide }), leg = mat("#30343a", { roughness: 0.4, metalness: 0.4 });
    const seat = mesh(new THREE.BoxGeometry(0.42, 0.02, 0.36), cloth, P.whole, 0, 0.36, 0.02);
    const back = mesh(new THREE.BoxGeometry(0.42, 0.34, 0.02), cloth, P.whole, 0, 0.55, -0.17); back.rotation.x = -0.15;
    for (const s of [-1, 1]) for (const f of [-1, 1]) { const l = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 8), leg, P.whole, s * 0.2, 0.2, 0); l.rotation.x = f * 0.75; }
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.03, 0.02, 0.36), leg, P.whole, s * 0.22, 0.48, -0.02);
    return { grip: 0.36 };
  },

  stanchions(P) {
    const posts = P.spec.posts || [[0, 0], [1, 0]], black = mat("#1f2126", { roughness: 0.35, metalness: 0.4 }), chrome = mat("#d7dbe0", { roughness: 0.15, metalness: 0.9 }), belt = mat("#22242b", { roughness: 0.6 });
    const H = P.spec.h ?? 0.62;
    for (const [x, z] of posts) {
      mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.025, 24), black, P.whole, x, 0.0125, z);
      mesh(new THREE.CylinderGeometry(0.022, 0.022, H, 12), black, P.whole, x, H / 2, z);
      mesh(new THREE.SphereGeometry(0.03, 14, 10), chrome, P.whole, x, H + 0.01, z);
    }
    for (let i = 0; i + 1 < posts.length; i++) {
      const [x0, z0] = posts[i], [x1, z1] = posts[i + 1], len = Math.hypot(x1 - x0, z1 - z0), y = H - 0.05;
      const pts = []; for (let k = 0; k <= 12; k++) { const u = k / 12; pts.push(new THREE.Vector3(x0 + (x1 - x0) * u, y - 0.05 * Math.sin(u * Math.PI) * Math.min(1, len), z0 + (z1 - z0) * u)); }
      const b = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.012, 6, false), belt, P.whole); b.scale.y = 1;
    }
    return { grip: H };
  },

  seatmark() { return { grip: 0 }; },
};
