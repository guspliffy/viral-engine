import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// Props for "That one friend with too much energy", episode 2: the cinema (Jonny's eight panels, 5 Nov 2026), in their
// own file so parallel clips never edit the same one (props3d.js merges CINEMA_KINDS and CINEMA_GRIPS on their own
// line). The back wall and the far tiers are a painted plate (assets/plates/cinema-hall.png). No lettering, no film.
//   cinemaseat   one red velvet cinema seat facing +z (origin: its floor centre). spec.w (0.96: a potato wide), color,
//                arms "both" | "L" | "R" | "none" (L: the seat's own left, +x), cups ["L", "R"]: a cup holder in the
//                front of that armrest. The cushion (top at SEAT_Y 0.42, so "sit" works) is hinged at its back on two
//                steel brackets: open 0..1 flips it up against the back (a real cinema seat's spring).
//   cinemarow    the seat tiers' floor: a dark red carpeted step for each row (spec.rows: [[z, y], ...] the front edge
//                and height of each tier; spec.w the width) with a strip of warm step light along each front edge.
//   cinemabucket a giant red-and-white striped popcorn bucket heaped over the rim (origin: its foot centre). spec.h
//                (0.44), r (0.21 at the rim), rb (0.15 at the foot). fill 0..1 the heap (0: empty), puff 0..1 makes the
//                top kernels hop. Grips "sideR" / "sideL": its two sides at half height.
//   popcornrain  loose popcorn in flight: spec.ks [[fx, fy, fz, tx, ty, tz, delay, flight, h, hide], ...] (metres from
//                the origin, seconds): each piece leaves f at delay and lands on t after flight, on a ballistic arc that
//                rises h above the straight line (constant sideways speed under gravity), tumbling; hide 1: it is gone
//                on landing (it landed in a heap that grows there). burst 0..1 is the time over spec.len seconds:
//                tween it linearly. Never solid (light popcorn: nothing catches on it).
//   popcornpile  a heap of popcorn sitting on a head or a seat (origin: its base centre, up +y): spec.r (0.16), n (22),
//                h (0.07), seed. fill 0..1 shows the pieces one by one (the rain landing). Stuck on a head with a grab
//                hand "hat", keep: true. Never solid.
//   kernel       one piece of popcorn (Reaper eats it): fill 0..1 (0 = eaten).
//   cinemaglow   a soft additive glow (origin: its centre): spec.color, size; glow 0..1. Light, never solid.
export const CINEMA_GRIPS = {
  cinemabucket: { sideR: [-0.205, 0.22, 0], sideL: [0.205, 0.22, 0] },
};

const clamp = (x) => Math.min(1, Math.max(0, x ?? 0));
const rad = (d) => (d * Math.PI) / 180;
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function rng(seed) { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const see = (o) => { o.traverse((c) => { c.userData.steam = true; c.castShadow = false; }); return o; };   // light and loose popcorn: see-through for the contact checks

// velvet: channel stitching down the fabric, a soft sheen at the top
function velvet(color, channels = 5) {
  const [c, g] = canvas(256, 256), base = new THREE.Color(color);
  const css = (k) => `rgb(${[base.r, base.g, base.b].map((v) => Math.round(Math.min(1, v * k) * 255)).join(",")})`;
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, css(1.18)); gr.addColorStop(0.5, css(1)); gr.addColorStop(1, css(0.82)); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  for (let i = 1; i < channels; i++) {
    const x = (i * 256) / channels;
    const sh = g.createLinearGradient(x - 10, 0, x + 10, 0); sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(0.5, "rgba(40,0,8,0.45)"); sh.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = sh; g.fillRect(x - 10, 0, 20, 256);
  }
  return tex(c);
}

// one popcorn piece: three to four lumpy puffs merged, cream with a little yellow
const KGEO = (() => {
  const out = [];
  for (let v = 0; v < 4; v++) {
    const r = rng(40 + v), parts = [];
    for (let i = 0; i < 3 + (v % 2); i++) {
      const g = new THREE.IcosahedronGeometry(0.011 + r() * 0.006, 1);
      g.translate((r() - 0.5) * 0.018, (r() - 0.5) * 0.014, (r() - 0.5) * 0.018); parts.push(g);
    }
    out.push(mergeGeometries(parts));
  }
  return out;
})();
const KMATS = () => [mat("#fff4d6", { roughness: 0.8 }), mat("#ffeab0", { roughness: 0.8 }), mat("#f2cf6e", { roughness: 0.75 })];
function piece(i, mats, parent, scale = 1) {
  const k = new THREE.Mesh(KGEO[i % 4], mats[i % 7 === 3 ? 2 : i % 3 === 1 ? 1 : 0]); k.castShadow = false; k.receiveShadow = true;
  k.scale.setScalar(scale * (0.9 + ((i * 37) % 10) / 30)); k.rotation.set(i * 1.3, i * 2.1, i * 0.7); parent.add(k); return k;
}

export const CINEMA_KINDS = {
  cinemaseat(P) {
    const S = P.spec, W = S.w ?? 0.96, fab = new THREE.MeshStandardMaterial({ map: velvet(S.color ?? "#a3202e"), roughness: 0.92 });
    const plain = mat(S.color ?? "#a3202e", { roughness: 0.92 }), dark = mat("#2a1c22", { roughness: 0.6 }), steel = mat("#8d9096", { roughness: 0.35, metalness: 0.7 }), wood = mat("#3a2418", { roughness: 0.45 });
    // the back: a padded panel with channels on a dark shell, leaning back 10 degrees
    const back = new THREE.Group(); back.position.set(0, 0.36, -0.25); back.rotation.x = rad(-10); P.whole.add(back);
    mesh(new RoundedBoxGeometry(W - 0.1, 0.7, 0.13, 3, 0.05), fab, back, 0, 0.36, 0.0);
    mesh(new RoundedBoxGeometry(W - 0.06, 0.74, 0.05, 2, 0.02), dark, back, 0, 0.36, -0.08);
    mesh(new RoundedBoxGeometry(W - 0.12, 0.09, 0.15, 3, 0.04), plain, back, 0, 0.72, 0.0);   // the rolled top edge
    // the cushion on its hinge (at the back, just under its top): folded down it sits level, its top at 0.42
    const hinge = new THREE.Group(); hinge.position.set(0, 0.36, -0.2); P.whole.add(hinge);
    mesh(new RoundedBoxGeometry(W - 0.12, 0.12, 0.52, 3, 0.045), fab, hinge, 0, 0.0, 0.26);
    mesh(new THREE.BoxGeometry(W - 0.16, 0.02, 0.48), dark, hinge, 0, -0.065, 0.25);   // its underside, seen when it is up
    for (const sx of [-1, 1]) {
      mesh(new THREE.BoxGeometry(0.02, 0.08, 0.2), steel, hinge, sx * (W / 2 - 0.075), -0.02, 0.06);   // the bracket on the cushion
      const pin = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.035, 12), steel, P.whole, sx * (W / 2 - 0.075), 0.36, -0.2); pin.rotation.z = Math.PI / 2;
      mesh(new THREE.BoxGeometry(0.018, 0.2, 0.06), steel, P.whole, sx * (W / 2 - 0.075), 0.27, -0.21);   // the bracket down to the frame
    }
    mesh(new THREE.BoxGeometry(W - 0.14, 0.05, 0.08), dark, P.whole, 0, 0.17, -0.2);   // the frame bar under the hinge
    // the armrests on their dark side standards, a cup holder at the front of the ones in spec.cups
    const arms = S.arms ?? "both", cups = S.cups || [];
    for (const [sx, side] of [[1, "L"], [-1, "R"]]) {
      if (arms === "none" || (arms === "L" && side === "R") || (arms === "R" && side === "L")) continue;
      const x = sx * (W / 2);
      mesh(new RoundedBoxGeometry(0.06, 0.62, 0.56, 2, 0.02), dark, P.whole, x, 0.31, -0.03);
      mesh(new RoundedBoxGeometry(0.085, 0.055, 0.58, 3, 0.022), wood, P.whole, x, 0.645, -0.03);
      if (cups.includes(side)) {
        const ring = mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 24), dark, P.whole, x, 0.66, 0.3); ring.rotation.x = Math.PI / 2;
        mesh(new THREE.CylinderGeometry(0.046, 0.04, 0.1, 18, 1, true), dark, P.whole, x, 0.61, 0.3).material.side = THREE.DoubleSide;
        mesh(new THREE.BoxGeometry(0.03, 0.03, 0.07), dark, P.whole, x, 0.645, 0.24);
      }
    }
    return { grip: 0.42, apply(ps) { hinge.rotation.x = -clamp(ps.open) * rad(84); } };
  },

  cinemarow(P) {
    const S = P.spec, W = S.w ?? 8, rows = S.rows || [], carpet = mat(S.color ?? "#4a1820", { roughness: 0.95 }), nose = mat("#2a0e14", { roughness: 0.8 });
    const lightM = new THREE.MeshBasicMaterial({ color: "#ffc77a" }); lightM.userData.noOutline = true;
    rows.forEach(([z, y, d], i) => {
      const depth = d ?? 1.05;
      mesh(new THREE.BoxGeometry(W, y, depth), carpet, P.whole, 0, y / 2, z - depth / 2);
      mesh(new THREE.BoxGeometry(W, 0.03, 0.04), nose, P.whole, 0, y - 0.015, z - 0.02);
      for (const x of S.lights ?? [-1.45, 1.45]) { const l = mesh(new THREE.BoxGeometry(0.12, 0.025, 0.01), lightM, P.whole, x, y * 0.5, z + 0.006); l.castShadow = false; }
    });
    // the floor of the front row
    const f = mesh(new THREE.PlaneGeometry(W, S.floorD ?? 6), carpet, P.whole, 0, 0.002, (S.floorZ ?? 2)); f.rotation.x = -Math.PI / 2; f.castShadow = false;
    return {};
  },

  cinemabucket(P) {
    const S = P.spec, h = S.h ?? 0.44, r = S.r ?? 0.21, rb = S.rb ?? 0.15;
    const [c, g] = canvas(512, 128); for (let i = 0; i < 14; i++) { g.fillStyle = i % 2 ? "#fbf5ea" : "#d8262f"; g.fillRect((i * 512) / 14, 0, 512 / 14 + 1, 128); }
    g.fillStyle = "rgba(255,255,255,0.0)"; const stripes = tex(c);
    const side = new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.55, side: THREE.DoubleSide }), inner = mat("#e9dcc4", { roughness: 0.7, side: THREE.DoubleSide }), white = mat("#fbf5ea", { roughness: 0.5 });
    mesh(new THREE.CylinderGeometry(r, rb, h, 40, 1, true), side, P.whole, 0, h / 2, 0);
    mesh(new THREE.CircleGeometry(rb, 24), inner, P.whole, 0, 0.004, 0).rotation.x = -Math.PI / 2;
    const lip = mesh(new THREE.TorusGeometry(r, 0.012, 8, 40), white, P.whole, 0, h, 0); lip.rotation.x = Math.PI / 2;
    const foot = mesh(new THREE.TorusGeometry(rb, 0.008, 6, 32), white, P.whole, 0, 0.006, 0); foot.rotation.x = Math.PI / 2;
    // the heap: a dome of pieces over the rim
    const heap = new THREE.Group(); P.whole.add(heap);
    const ms = KMATS(), R = rng(S.seed ?? 7), ks = [];
    for (let i = 0; i < 90; i++) {
      const a = R() * Math.PI * 2, d = Math.sqrt(R()) * (r - 0.02), y = h - 0.03 + 0.11 * (1 - (d / r) ** 2) + R() * 0.02;
      const k = piece(i, ms, heap, 1.35); k.position.set(Math.cos(a) * d, y, Math.sin(a) * d);
      ks.push({ k, y, top: y > h + 0.05, ph: R() });
    }
    return {
      grip: h,
      apply(ps) {
        const f = clamp(ps.fill), pf = clamp(ps.puff);
        heap.visible = f > 0.02; heap.scale.set(1, 0.3 + 0.7 * f, 1); heap.position.y = -(1 - f) * (h - 0.06) * 0.0;
        for (const k of ks) k.k.position.y = k.y + (k.top ? pf * (0.06 + 0.1 * k.ph) * Math.sin(Math.PI * Math.min(1, pf)) : 0);
      },
    };
  },

  popcornrain(P) {
    const S = P.spec, ms = KMATS(), len = S.len ?? 1, G = 9.81;
    const ks = (S.ks || []).map((q, i) => ({ q, k: piece(i + (S.seed ?? 0), ms, P.whole, S.size ?? 1.3) }));
    see(P.whole);
    return {
      grip: 0,
      apply(ps) {
        const T = clamp(ps.burst) * len;
        for (const { q, k } of ks) {
          const [fx, fy, fz, tx, ty, tz, d, fl, hh, hide] = q, u = Math.min(1, Math.max(0, (T - d) / fl));
          k.visible = T > d && !(hide && u >= 1);
          if (!k.visible) continue;
          // constant speed sideways, a parabola up and down (it rises hh over the straight line between f and t)
          k.position.set(fx + (tx - fx) * u, fy + (ty - fy) * u + 4 * hh * u * (1 - u), fz + (tz - fz) * u);
          k.rotation.set(d * 7 + u * 9, d * 3 + u * 6, u * 4);
        }
      },
    };
  },

  popcornpile(P) {
    const S = P.spec, r = S.r ?? 0.16, n = S.n ?? 22, h = S.h ?? 0.07, R = rng(S.seed ?? 3), ms = KMATS();
    const ks = Array.from({ length: n }, (_, i) => {
      const a = R() * Math.PI * 2, d = Math.sqrt(R()) * r, k = piece(i + 3, ms, P.whole, S.size ?? 1.3);
      // a low heap that follows a round head down at its edge
      k.position.set(Math.cos(a) * d, h * (1 - (d / r) ** 2) - (S.curve ?? 0.05) * (d / r) ** 2 + 0.012, Math.sin(a) * d);
      return { k, at: R() };
    }).sort((a, b) => a.at - b.at);
    see(P.whole);
    return { grip: 0, apply(ps) { const f = clamp(ps.fill); ks.forEach(({ k }, i) => { k.visible = (i + 0.5) / n < f; }); } };
  },

  kernel(P) {
    const k = piece(P.spec.seed ?? 2, KMATS(), P.whole, P.spec.size ?? 1.6);
    see(P.whole);
    return { grip: 0, apply(ps) { k.visible = clamp(ps.fill) > 0.5; } };
  },

  cinemaglow(P) {
    const S = P.spec, [c, g] = canvas(128, 128), col = new THREE.Color(S.color ?? "#ff9a3a");
    const rgb = [col.r, col.g, col.b].map((v) => Math.round(v * 255)).join(",");
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, `rgba(${rgb},0.85)`); gr.addColorStop(0.45, `rgba(${rgb},0.35)`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const m = new THREE.SpriteMaterial({ map: tex(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }); m.userData.noOutline = true;
    const s = new THREE.Sprite(m); s.scale.setScalar(S.size ?? 2); P.whole.add(s); see(P.whole);
    return { grip: 0, apply(ps) { const k = clamp(ps.glow); m.opacity = k * (S.peak ?? 0.6); s.visible = k > 0.005; s.scale.setScalar((S.size ?? 2) * (0.7 + 0.3 * k)); } };
  },
};
