import * as THREE from "three";
import { clamp, rng } from "./util.js";
import { mat, mesh, canvasTex } from "./props-trend.js";
import { steamWisps } from "./steam.js";

// "That one friend who always orders potatoes… at the burger place" (always orders potatoes, episode 1, 7 Nov 2026): a
// sunny neighbourhood burger bar. Jonny's eight panels: a red leather booth with brass studs, a warm wooden table, a
// wooden tray with a red-and-white checked paper cone of fries and two dip pots (ketchup, mayo), Gunslinger's salad,
// Reaper's tomato soup, Phoenix's pink milkshake with a striped straw.
// Jonny's rule (7 Nov 17:53): every potato that gets eaten in this series is alive, so the fries are characters
// (characters/always-orders-potatoes/fry.json) standing in the cone; the cone itself holds only crumbs.
//   burgertable  a warm wooden table along x (spec.w, spec.d, spec.h), plank top with a rounded front edge. Origin: the
//                floor under its middle. Grip: its top (h).
//   boothback    the back of a red leather booth along x (spec.w, spec.h, spec.d): tufted cushion, brass studs, a
//                wooden cap rail. Origin: the floor under its middle.
//   burgertray   a wooden serving tray (spec.w, spec.d) with a low rim, 2.5 cm high. Origin: its bottom.
//   frycone      a red-and-white checked paper cone in a wire stand (top r 0.15, bottom r 0.11, h 0.2), open at the top, a few crumbs
//                inside. A body: it tips over when knocked. Origin: its bottom.
//   dippot       a small white ramekin (r 0.05) of spec.sauce "ketchup" | "mayo", a swirl on top; `splash` 0..1 rings a
//                little wave out from the middle (a fry hopping in). Origin: its bottom.
//   tomatosoup   a white bowl (r 0.11) of tomato soup with a cream swirl and a basil leaf; `ripple` 0..1 rings out from
//                spec.at ([x, z] in the bowl, from the middle) and `steam` 0..1. Origin: its bottom.
//   fullshake    a tall pink milkshake in a flared soda glass, whipped cream, a cherry and one striped straw (h 0.3).
//                Origin: its bottom.
export const FRIES = { table: { h: 0.18 }, tray: { h: 0.025 }, cone: { r: 0.15, h: 0.2 }, pot: { r: 0.05, h: 0.045 }, soup: { r: 0.11, h: 0.075 } };

const food = (c, o = {}) => { const m = mat(c, { roughness: 0.55, ...o }); m.userData.noHatch = true; return m; };
const woodTex = (seed, base = "#9a6436", dark = "rgba(70,38,18,0.35)", light = "rgba(255,220,170,0.12)") => canvasTex(512, 256, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  const r = rng(seed);
  for (let i = 0; i < 140; i++) { g.strokeStyle = i % 3 ? dark : light; g.lineWidth = 0.6 + r() * 1.6; const y = r() * h; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * 0.02 + i) * (2 + r() * 3)); g.stroke(); }
  for (let i = 1; i < 5; i++) { g.fillStyle = "rgba(50,26,10,0.55)"; g.fillRect(0, (i * h) / 5, w, 2); }   // the plank joints
});

export const FRIES_KINDS = {
  burgertable(P) {
    const S = P.spec, W = S.w ?? 3.0, D = S.d ?? 1.1, H = S.h ?? FRIES.table.h, T = 0.035;
    const top = mat("#ffffff", { map: woodTex(7), roughness: 0.55 });
    mesh(new THREE.BoxGeometry(W, T, D), top, P.whole, 0, H - T / 2, 0);
    // the rounded front edge and a darker apron under it
    const edge = mesh(new THREE.CylinderGeometry(T / 2, T / 2, W, 12), mat("#8a5530", { roughness: 0.5 }), P.whole, 0, H - T / 2, D / 2); edge.rotation.z = Math.PI / 2;
    mesh(new THREE.BoxGeometry(W - 0.06, H - T, 0.03), mat("#5e3a22", { roughness: 0.7 }), P.whole, 0, (H - T) / 2, D / 2 - 0.04);
    return { grip: H };
  },

  boothback(P) {
    const S = P.spec, W = S.w ?? 3.2, H = S.h ?? 0.72, D = S.d ?? 0.16;
    const leather = mat("#a8262a", { roughness: 0.42 }), seam = mat("#6e1418", { roughness: 0.6 }), brass = mat("#d6a23c", { roughness: 0.25, metalness: 0.8 });
    // the frame and the cushion: vertical tufted channels, puffed out between the seams
    mesh(new THREE.BoxGeometry(W, H, D * 0.6), seam, P.whole, 0, H / 2, -D * 0.2);
    const n = Math.round(W / 0.22), cw = W / n;
    for (let i = 0; i < n; i++) {
      const x = -W / 2 + cw * (i + 0.5);
      const c = mesh(new THREE.CapsuleGeometry(cw * 0.46, H - 0.12 - cw * 0.92, 4, 12), leather, P.whole, x, H / 2 + 0.01, D * 0.12);
      c.scale.z = 0.45;
    }
    // brass studs along the top and the sides of the cushion, a wooden cap rail
    for (let i = 0; i <= n * 3; i++) mesh(new THREE.SphereGeometry(0.008, 8, 6), brass, P.whole, -W / 2 + (i * W) / (n * 3), H - 0.05, D * 0.24).castShadow = false;
    mesh(new THREE.BoxGeometry(W + 0.04, 0.035, D + 0.02), mat("#6b4024", { roughness: 0.5 }), P.whole, 0, H + 0.0175, 0);
    return { grip: H };
  },

  burgertray(P) {
    const S = P.spec, W = S.w ?? 0.62, D = S.d ?? 0.4, h = FRIES.tray.h, t = 0.014;
    const wood = mat("#ffffff", { map: woodTex(11, "#b07a46"), roughness: 0.55 });
    mesh(new THREE.BoxGeometry(W, 0.01, D), wood, P.whole, 0, 0.005, 0);
    for (const s of [-1, 1]) {
      mesh(new THREE.BoxGeometry(W, h, t), wood, P.whole, 0, h / 2, s * (D / 2 - t / 2));
      mesh(new THREE.BoxGeometry(t, h, D), wood, P.whole, s * (W / 2 - t / 2), h / 2, 0);
    }
    // a sheet of checked paper on it
    const check = canvasTex(128, 128, (x, w, hh) => { x.fillStyle = "#fbf6ee"; x.fillRect(0, 0, w, hh); x.fillStyle = "rgba(206,44,40,0.75)"; const k = w / 8; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2 === 0) x.fillRect(i * k, j * k, k, k); });
    check.wrapS = check.wrapT = THREE.RepeatWrapping; check.repeat.set(2.2, 1.4);
    const paper = mesh(new THREE.PlaneGeometry(W * 0.7, D * 0.72), food("#ffffff", { map: check, roughness: 0.9 }), P.whole, -0.02, 0.0105, 0.01); paper.rotation.set(-Math.PI / 2, 0, 0.08); paper.castShadow = false;
    return { grip: 0.01 };
  },

  frycone(P) {
    const { r: R, h: H } = FRIES.cone, r0 = 0.11;
    // red and white checks, a little crumpled at the rim
    const check = canvasTex(256, 128, (x, w, hh) => { x.fillStyle = "#ffffff"; x.fillRect(0, 0, w, hh); x.fillStyle = "#d1302b"; const k = w / 16; for (let i = 0; i < 16; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2 === 0) x.fillRect(i * k, j * k, k, k); });
    const paper = food("#ffffff", { map: check, roughness: 0.85, side: THREE.DoubleSide });
    const geo = new THREE.CylinderGeometry(R, r0, H, 32, 6, true), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)), y = p.getY(i), k = (y + H / 2) / H; p.setX(i, p.getX(i) * (1 + 0.025 * Math.sin(a * 7) * k)); p.setZ(i, p.getZ(i) * (1 + 0.025 * Math.sin(a * 7) * k)); if (k > 0.98) p.setY(i, y + 0.012 * Math.sin(a * 3 + 1)); }
    geo.computeVertexNormals();
    mesh(geo, paper, P.whole, 0, H / 2, 0);
    mesh(new THREE.CircleGeometry(r0, 24), paper, P.whole, 0, 0.004, 0).rotation.x = -Math.PI / 2;
    // the wire stand round its foot
    const wire = mat("#7d838c", { roughness: 0.3, metalness: 0.7 });
    for (const y of [0.01, 0.07]) { const o = mesh(new THREE.TorusGeometry(r0 + 0.004 + y * ((R - r0) / H), 0.003, 6, 32), wire, P.whole, 0, y, 0); o.rotation.x = Math.PI / 2; }
    // a few golden crumbs at the bottom
    const r = rng(P.spec.seed ?? 4), crumbM = food("#e9b343", { roughness: 0.6 });
    for (let i = 0; i < 8; i++) { const a = r() * 6.28, d = r() * r0 * 0.8, c = mesh(new THREE.BoxGeometry(0.008, 0.006, 0.012), crumbM, P.whole, Math.cos(a) * d, 0.008, Math.sin(a) * d); c.rotation.y = r() * 3; c.castShadow = false; }
    return { grip: H * 0.5 };
  },

  dippot(P) {
    const { r: R, h: H } = FRIES.pot, sauce = P.spec.sauce === "mayo" ? "#f6efcf" : "#c7231c";
    const white = mat("#f7f5f0", { roughness: 0.3 });
    const prof = [[0.001, 0], [R * 0.82, 0], [R * 0.86, 0.004], [R, H], [R - 0.005, H], [R * 0.8, 0.008], [0.001, 0.008]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh(new THREE.LatheGeometry(prof, 32), white, P.whole);
    const sm = food(sauce, { roughness: 0.22 });
    const top = mesh(new THREE.CylinderGeometry(R - 0.006, R * 0.8, H - 0.012, 28), sm, P.whole, 0, (H - 0.012) / 2 + 0.006, 0); top.castShadow = false;
    // a soft swirl on top
    const sw = mesh(new THREE.TorusGeometry(R * 0.45, 0.006, 8, 24), sm, P.whole, 0, H - 0.004, 0); sw.rotation.x = Math.PI / 2; sw.castShadow = false;
    const ring = mesh(new THREE.TorusGeometry(R * 0.5, 0.004, 6, 28), sm, P.whole, 0, H - 0.003, 0); ring.rotation.x = Math.PI / 2; ring.visible = false; ring.castShadow = false;
    return { grip: H * 0.6, apply(ps) { const s = clamp(ps.splash ?? 0); ring.visible = s > 0.01 && s < 0.99; ring.scale.setScalar(0.4 + 1.3 * s); ring.position.y = H - 0.003 + 0.01 * Math.sin(Math.PI * s); } };
  },

  tomatosoup(P) {
    const { r: R, h: H } = FRIES.soup, at = P.spec.at ?? [0, 0];
    const white = mat("#f7f5f0", { roughness: 0.3 });
    const prof = [[0.001, 0], [R * 0.5, 0], [R * 0.55, 0.006], [R * 0.95, H * 0.8], [R, H], [R - 0.006, H], [R * 0.9, H * 0.78], [R * 0.5, 0.012], [0.001, 0.012]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh(new THREE.LatheGeometry(prof, 36), white, P.whole);
    const soupY = H * 0.78;
    const soup = mesh(new THREE.CircleGeometry(R * 0.9, 36), food("#d8452a", { roughness: 0.25 }), P.whole, 0, soupY, 0); soup.rotation.x = -Math.PI / 2; soup.castShadow = false;
    const cream = mesh(new THREE.TorusGeometry(R * 0.32, 0.005, 6, 28, Math.PI * 1.5), food("#fbefe0", { roughness: 0.4 }), P.whole, -0.015, soupY + 0.002, 0.01); cream.rotation.x = -Math.PI / 2; cream.castShadow = false;
    const leaf = mesh(new THREE.SphereGeometry(0.014, 10, 6), food("#3f8f2c", { roughness: 0.5 }), P.whole, 0.035, soupY + 0.003, -0.02); leaf.scale.set(1, 0.18, 0.6); leaf.castShadow = false;
    const rings = [0, 1].map(() => { const o = mesh(new THREE.TorusGeometry(0.03, 0.0035, 6, 28), food("#e8634a", { roughness: 0.25 }), P.whole, at[0], soupY + 0.002, at[1]); o.rotation.x = Math.PI / 2; o.visible = false; o.castShadow = false; return o; });
    const st = new THREE.Group(); P.whole.add(st); const wisps = steamWisps(st, soupY);
    return {
      grip: H * 0.6,
      apply(ps, t) {
        const q = clamp(ps.ripple ?? 0);
        rings.forEach((o, i) => { const k = clamp(q * 1.4 - i * 0.4); o.visible = k > 0.01 && k < 0.99; o.scale.setScalar(0.5 + 2.2 * k); });
        wisps(clamp(ps.steam ?? 0.6), t);
      },
    };
  },

  fullshake(P) {
    const h = 0.2;
    const glass = new THREE.MeshPhysicalMaterial({ color: "#eef9ff", roughness: 0.05, transparent: true, opacity: 0.3, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide });
    glass.userData.glass = true;
    const prof = [[0.001, 0], [0.045, 0], [0.047, 0.006], [0.014, 0.016], [0.012, 0.045], [0.03, 0.065], [0.04, 0.13], [0.05, h], [0.047, h], [0.037, 0.13], [0.027, 0.07], [0.001, 0.063]].map(([x, y]) => new THREE.Vector2(x, y));
    const g = mesh(new THREE.LatheGeometry(prof, 32), glass, P.whole); g.castShadow = false; g.renderOrder = 3;
    // pink to the rim, a cloud of whipped cream, a cherry
    const pinkP = [[0.001, 0.064], [0.026, 0.07], [0.036, 0.13], [0.045, h - 0.004], [0.001, h - 0.004]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh(new THREE.LatheGeometry(pinkP, 32), food("#f4a9bd", { roughness: 0.4 }), P.whole).castShadow = false;
    const cream = food("#fffaf2", { roughness: 0.6 });
    [[0, 0.012, 0.04], [0.016, 0.008, 0.028], [-0.015, 0.009, 0.028], [0, 0.03, 0.026], [0.003, 0.046, 0.015]].forEach(([x, y, s]) => mesh(new THREE.SphereGeometry(s, 14, 10), cream, P.whole, x, h + y, 0));
    mesh(new THREE.SphereGeometry(0.013, 14, 10), food("#c4121c", { roughness: 0.2 }), P.whole, 0.004, h + 0.066, 0);
    const stem = mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.03, 5), food("#5a7a2a"), P.whole, 0.01, h + 0.085, 0); stem.rotation.z = -0.4;
    const t = canvasTex(16, 128, (x, w, hh) => { x.fillStyle = "#ffffff"; x.fillRect(0, 0, w, hh); x.fillStyle = "#d6342e"; for (let i = 0; i < 8; i++) { x.save(); x.translate(0, i * 16); x.transform(1, 0.5, 0, 1, 0, 0); x.fillRect(-8, 0, w + 16, 7); x.restore(); } });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    const s = mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.24, 10), mat("#ffffff", { map: t, roughness: 0.5 }), P.whole, -0.018, 0.17, 0.0); s.rotation.set(0, 0, 0.22); s.castShadow = false;
    return { grip: 0.12 };
  },
};
