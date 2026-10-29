import * as THREE from "three";
import { clamp } from "./util.js";
import { jackOLantern } from "./set-porch.js";

// Props for "Your Costume Is Better Than Mine" (eight-trend-tests 02, 29 Oct 2026), in their own file so clips made in
// parallel never edit the same one (props3d.js merges these into its KINDS and GRIPS):
//   pavement  an autumn town pavement: warm stone pavers in rows with darker joints, a few fallen leaves painted in.
//             spec.w, spec.d (metres; 7 x 6), spec.seed. Lies flat at y 0 (a hair above the floor), centred on x / z.
//   leaves    loose autumn leaves lying on the ground in a patch (spec.w x spec.d round x / z, spec.n of them, spec.seed)
//             that a gust blows along x: `rise` 0..1 is the gust's progress (tween it with the wingbeat), spec.dir the
//             direction (+1 toward +x, -1 toward -x), spec.reach how far they travel (m). Each leaf lifts, tumbles and
//             settles again a little later than the one before, so the gust reads as a wave moving across.
//   pumpkin   a softly lit jack-o'-lantern (the porch set's), spec.r its radius (0.16), spec.rot its turn (radians).
export const COSTUME_GRIPS = {};

function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const LEAF_COLS = ["#e8641e", "#f29a2e", "#d9441c", "#f5c043", "#c0571f", "#e57a24"];

// a maple-ish leaf outline on a canvas (for the painted ground and the loose leaves)
function leafPath(g, x, y, r, a) {
  g.save(); g.translate(x, y); g.rotate(a); g.beginPath();
  for (let i = 0; i <= 40; i++) {
    const q = (i / 40) * Math.PI * 2, lobe = 0.62 + 0.38 * Math.abs(Math.cos(q * 2.5)), rr = r * lobe;
    const px = Math.cos(q) * rr, py = Math.sin(q) * rr * 0.92;
    if (i) g.lineTo(px, py); else g.moveTo(px, py);
  }
  g.closePath(); g.restore();
}

export const COSTUME_KINDS = {
  pavement(P) {
    const S = P.spec, W = S.w ?? 7, D = S.d ?? 6, r = rnd((S.seed ?? 3) * 977 + 1), px = 300;
    const c = document.createElement("canvas"); c.width = Math.round(W * px); c.height = Math.round(D * px);
    const g = c.getContext("2d");
    g.fillStyle = "#8a7462"; g.fillRect(0, 0, c.width, c.height);   // the joints
    // pavers: rows 16 cm deep, stones 20-32 cm long, each a slightly different warm grey-brown, rounded corners
    const rowH = 0.16 * px;
    for (let y = 0, row = 0; y < c.height; y += rowH, row++) {
      let x = -r() * 0.3 * px;
      while (x < c.width) {
        const w = (0.2 + r() * 0.12) * px, k = r();
        const col = `hsl(${24 + k * 14}, ${16 + k * 12}%, ${62 + r() * 12}%)`;   // light stone, so dark feet read against it
        g.fillStyle = col; g.beginPath(); g.roundRect(x + 3, y + 3, w - 6, rowH - 6, 10); g.fill();
        // a soft lighter top and a worn spot, so the stones aren't flat colour
        const gr = g.createLinearGradient(0, y, 0, y + rowH); gr.addColorStop(0, "rgba(255,240,215,0.16)"); gr.addColorStop(1, "rgba(60,40,25,0.12)");
        g.fillStyle = gr; g.beginPath(); g.roundRect(x + 3, y + 3, w - 6, rowH - 6, 10); g.fill();
        for (let i = 0; i < 3; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "90,70,55" : "235,220,195"},0.10)`; g.beginPath(); g.ellipse(x + r() * w, y + r() * rowH, 6 + r() * 18, 4 + r() * 8, r() * 3, 0, Math.PI * 2); g.fill(); }
        x += w;
      }
    }
    // fallen leaves painted flat into the stone, more toward the edges than the middle of the pavement
    for (let i = 0; i < 260; i++) {
      const u = r(), v = r(), edge = Math.abs(u - 0.5) * 2;
      if (r() > 0.25 + 0.75 * edge) continue;
      g.fillStyle = LEAF_COLS[Math.floor(r() * LEAF_COLS.length)]; leafPath(g, u * c.width, v * c.height, (0.03 + r() * 0.03) * px, r() * 6.3); g.fill();
      g.strokeStyle = "rgba(120,50,20,0.35)"; g.lineWidth = 2; g.stroke();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }); m.userData.noOutline = true;
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(W, D), m); plane.rotation.x = -Math.PI / 2; plane.position.y = 0.002; plane.receiveShadow = true;
    P.whole.add(plane);
    return { grip: 0 };
  },
  leaves(P) {
    const S = P.spec, N = S.n ?? 26, W = S.w ?? 1.6, D = S.d ?? 1.0, dir = S.dir ?? 1, reach = S.reach ?? 1.4, r = rnd((S.seed ?? 5) * 389 + 7);
    const mats = LEAF_COLS.map((col) => {
      const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d");
      g.fillStyle = col; leafPath(g, 32, 32, 28, 0); g.fill(); g.strokeStyle = "rgba(110,45,15,0.6)"; g.lineWidth = 2; g.beginPath(); g.moveTo(8, 32); g.lineTo(56, 32); g.stroke();
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 }); m.userData.noOutline = true; return m;
    });
    const leaves = [];
    for (let i = 0; i < N; i++) {
      const size = 0.1 + r() * 0.06, m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mats[i % mats.length]);
      m.castShadow = true; m.rotation.order = "YXZ"; P.whole.add(m);   // turn about the vertical first, then lie flat
      // leaves nearer the gust's source go first (a wave)
      const x0 = (r() - 0.5) * W, z0 = (r() - 0.5) * D, delay = 0.45 * ((x0 / W + 0.5) * (dir > 0 ? 1 : -1) + (dir > 0 ? 0 : 1)) + 0.08 * r();
      leaves.push({ m, x0, z0, a0: r() * 6.3, delay, far: reach * (0.6 + 0.6 * r()), lift: 0.12 + 0.25 * r(), spin: 3 + r() * 5, tip: r() * 6.3 });
    }
    return {
      grip: 0,
      apply(ps) {
        const gst = clamp(ps.rise || 0);
        for (const L of leaves) {
          const k = clamp((gst - L.delay) / 0.5), e = k * k * (3 - 2 * k);
          L.m.position.set(L.x0 + dir * L.far * e, 0.004 + L.lift * Math.sin(Math.PI * k), L.z0 + 0.1 * Math.sin(Math.PI * k));
          // flat on the ground at rest; tumbling while in the air
          const air = Math.sin(Math.PI * k);
          L.m.rotation.set(-Math.PI / 2 + air * L.spin * k, L.a0 + 2 * e, air * Math.sin(L.tip + 6 * k));
        }
      },
    };
  },
  pumpkin(P) {
    const S = P.spec;
    jackOLantern(P.whole, 0, 0, S.r ?? 0.16, S.rot ?? 0);
    return { grip: 0 };
  },
};
