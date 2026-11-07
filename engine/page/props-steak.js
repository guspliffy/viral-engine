import * as THREE from "three";
import { clamp, rng } from "./util.js";
import { mat, mesh, canvasTex } from "./props-trend.js";
import { steamWisps } from "./steam.js";

// "That one friend who always orders potatoes… at the steakhouse" (always orders potatoes, episode 3, 7 Nov 2026): a
// rustic Western steakhouse table and a giant loaded baked potato. Jonny's eight panels: a warm wooden table with a red
// cloth along its front, a row of five small white topping bowls, Viking's board with a foil-wrapped baked potato the
// size of his head, Gunslinger's steak on a black cast-iron plate, Reaper's corn on the cob, a lemonade.
// The food is ordinary food: no faces, no sprouts (the series' "cute, never gross" rule).
//   steaktable   a rustic wooden table along x (spec.w, spec.d, spec.h), a red cloth along its front edge (spec.cloth
//                deep) hanging over it. Origin: the floor under its middle. Grip: its top (h).
//   servingboard a wooden serving board (spec.w, spec.d), 3 cm thick, a handle at +x. Origin: its bottom.
//   bakedpotato  a big baked potato in crinkled foil (L 0.52, W 0.33, H 0.24). `empty`: the foil alone, for a potato
//                character sitting in it. `open` 0..1 folds the foil's top back
//                (0.25 tears a gap at the top, 1 a foil boat round it), the split top with its fluffy inside rising as it
//                opens; `steam` 0..1. Origin: its bottom.
//   spudsplit    the split top of a baked potato character (worn at the top of its head): fluffy potato in a slit and a
//                small melting butter pat. `len` the split's length (0.16). Origin: the slit's middle.
//   toppingbowl  a small white bowl (r 0.055) of one topping: spec.food "butter" | "cream" | "cheese" | "chives" | "bacon".
//   butterpat    a pat of butter (5.6 x 2.4 x 4.2 cm), `melt` 0..1 softens and sags it. Origin: its bottom. A body.
//   creamdollop  a swirled dollop of sour cream (r 0.045), chives on it when spec.chives. Origin: its bottom. A body.
//   cheeseslice  a slice of orange cheese (9 cm square), `melt` 0..1 drapes its corners down. Origin: its middle bottom.
//   baconbits    a little heap of crispy bacon bits (r 0.04), or spec.n 1: one bit (the shower), or spec.chives: a pinch
//                of chopped chives. Origin: its bottom.
//   tablespoon   a big steel spoon standing on the tip of its bowl (origin), the handle up +y (len 0.3); the thin hold
//                pinches it near the top. `food` 0..1 shows a spoonful of `fk`: 0 potato, 1 butter, 2 sour cream,
//                3 cheese, 4 chives, 5 bacon, 6 a loaded spoonful (potato, cream, cheese, bacon).
//   skilletsteak a black cast-iron steak plate (r 0.14) on a round wooden underliner, a grilled steak with a rosemary
//                sprig; `steam` 0..1 (the sizzle). Origin: its bottom.
//   corncob      a buttered corn on the cob lying along x (len 0.24, r 0.046), the kernels in rows. Origin: its bottom.
//                Held in both hands with the box hold (gloves on its two ends).
//   lemonade     a tall glass of lemonade with ice, a lemon slice on the rim and a straw. Origin: its bottom.
//   barcounter   the end of a wooden bar (spec.w, spec.d, spec.h) with a plank front and a dark top. Origin: the floor.
export const STEAK = { table: { h: 0.34 }, potato: { L: 0.52, W: 0.33, H: 0.24 }, spoon: { len: 0.3 }, corn: { len: 0.24, r: 0.046 } };

const food = (c, o = {}) => { const m = mat(c, { roughness: 0.55, ...o }); m.userData.noHatch = true; return m; };
const BUTTER = "#f6dc6a", CREAM = "#f8f4ea", CHEESE = "#f2a42a", CHIVE = "#4f9a2a", BACON = ["#9a3a22", "#b5482a", "#7a2c1a", "#c86a44"];

// a crumpled lump of bacon bits (one bit: a small irregular chunk)
function baconGeo(seed, s = 0.012) {
  const r = rng(seed), g = new THREE.IcosahedronGeometry(s, 0), p = g.attributes.position, v = new THREE.Vector3();
  const k = [0.7 + r() * 0.6, 0.45 + r() * 0.3, 0.7 + r() * 0.6];
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); p.setXYZ(i, v.x * k[0] * (0.85 + r() * 0.3), v.y * k[1], v.z * k[2] * (0.85 + r() * 0.3)); }
  g.computeVertexNormals(); return g;
}
function bits(parent, n, R, seed, y0 = 0) {
  const r = rng(seed), ms = BACON.map((c) => food(c, { roughness: 0.5 }));
  for (let i = 0; i < n; i++) {
    const a = r() * 6.28, d = Math.sqrt(r()) * R, h = (1 - d / (R + 1e-6)) * R * 0.7 * r();
    const o = mesh(baconGeo(seed * 31 + i, 0.009 + r() * 0.006), ms[(r() * 4) | 0], parent, Math.cos(a) * d, y0 + 0.004 + h, Math.sin(a) * d);
    o.rotation.set(r() * 3, r() * 6, r() * 3);
  }
}
function chives(parent, n, R, seed, y) {
  const r = rng(seed), m = food(CHIVE, { roughness: 0.45 });
  for (let i = 0; i < n; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * R; const c = mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.008 + r() * 0.006, 6), m, parent, Math.cos(a) * d, y(d), Math.sin(a) * d); c.rotation.set(Math.PI / 2 + (r() - 0.5) * 0.8, r() * 6, 0); c.castShadow = false; }
}
function cheeseShreds(parent, n, R, seed, y0) {
  const r = rng(seed), ms = [food(CHEESE), food("#f7b844")];
  for (let i = 0; i < n; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * R, h = (1 - d / R) * R * 0.5 * r(); const c = mesh(new THREE.BoxGeometry(0.003, 0.003, 0.022 + r() * 0.012), ms[i % 2], parent, Math.cos(a) * d, y0 + h, Math.sin(a) * d); c.rotation.set((r() - 0.5) * 0.9, r() * 6, (r() - 0.5) * 0.9); c.castShadow = false; }
}
// a sour cream swirl: a lathe with a wavy profile, a little twisted tip
function creamGeo(R = 0.045) {
  const prof = []; for (let i = 0; i <= 14; i++) { const u = i / 14, y = u * R * 1.15, rr = R * Math.sqrt(Math.max(0, 1 - u * u)) * (1 + 0.08 * Math.sin(u * 18)); prof.push(new THREE.Vector2(Math.max(0.001, rr), y)); }
  const g = new THREE.LatheGeometry(prof, 28), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const a = Math.atan2(v.z, v.x), tw = Math.sin(a * 3 + v.y * 90) * 0.06 * (v.y / R); p.setXYZ(i, v.x * (1 + tw), v.y, v.z * (1 + tw)); }
  g.computeVertexNormals(); return g;
}

export const STEAK_KINDS = {
  steaktable(P) {
    const S = P.spec, W = S.w ?? 3.0, D = S.d ?? 0.8, H = S.h ?? STEAK.table.h, T = 0.05;
    const plank = canvasTex(1024, 256, (g, w, h) => {
      g.fillStyle = "#8a5a32"; g.fillRect(0, 0, w, h);
      const r = rng(11);
      for (let i = 0; i < 4; i++) { g.fillStyle = ["#8f5d33", "#82532c", "#946238", "#7d4f2a"][i]; g.fillRect(0, (i * h) / 4, w, h / 4); }
      g.strokeStyle = "rgba(40,20,8,0.6)"; g.lineWidth = 3; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(0, (i * h) / 4); g.lineTo(w, (i * h) / 4); g.stroke(); }
      g.strokeStyle = "rgba(60,30,12,0.28)"; g.lineWidth = 1.2;
      for (let i = 0; i < 80; i++) { const y = r() * h; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 28) g.lineTo(x, y + Math.sin(x * 0.012 + i) * 4); g.stroke(); }
      for (let i = 0; i < 9; i++) { g.fillStyle = "rgba(50,25,10,0.35)"; g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 6, 3 + r() * 2, 0, 0, 6.28); g.fill(); }   // knots
    });
    const top = mat("#ffffff", { roughness: 0.6, map: plank }); top.userData.lookRole = "wood";
    const wood = mat("#5a3a20", { roughness: 0.65 }); wood.userData.lookRole = "wood";
    mesh(new THREE.BoxGeometry(W, T, D), top, P.whole, 0, H - T / 2, 0);
    for (const x of [-1, 1]) for (const z of [-1, 1]) mesh(new THREE.BoxGeometry(0.08, H - T, 0.08), wood, P.whole, x * (W / 2 - 0.12), (H - T) / 2, z * (D / 2 - 0.1));
    // the red cloth along the front edge: on the top, then hanging down the front, a darker hem
    const CD = S.cloth ?? 0.32, OVER = S.over ?? 0.16;
    const weave = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = "#a82a24"; g.fillRect(0, 0, w, h);
      g.globalAlpha = 0.18; for (let i = 0; i < w; i += 8) { g.fillStyle = i % 16 ? "#7e1b18" : "#c2403a"; g.fillRect(i, 0, 3, h); g.fillRect(0, i, w, 3); } g.globalAlpha = 1;
    });
    weave.wrapS = weave.wrapT = THREE.RepeatWrapping; weave.repeat.set(W * 3, CD * 3);
    const cloth = mat("#ffffff", { roughness: 0.9, map: weave }); cloth.userData.noHatch = true;
    const lay = mesh(new THREE.PlaneGeometry(W + 0.02, CD), cloth, P.whole, 0, H + 0.002, D / 2 - CD / 2 + 0.005); lay.rotation.x = -Math.PI / 2; lay.castShadow = false;
    // the hanging part: a few soft folds
    const hg = new THREE.PlaneGeometry(W + 0.02, OVER, 60, 4), hp = hg.attributes.position;
    for (let i = 0; i < hp.count; i++) { const x = hp.getX(i), y = hp.getY(i), k = (OVER / 2 - y) / OVER; hp.setZ(i, 0.012 * k * Math.sin(x * 9 + Math.sin(x * 2.3) * 2)); }
    hg.computeVertexNormals();
    const hang = mesh(hg, cloth, P.whole, 0, H - OVER / 2 + 0.002, D / 2 + 0.006); hang.castShadow = false; hang.material.side = THREE.DoubleSide;
    const hem = mesh(new THREE.BoxGeometry(W + 0.02, 0.014, 0.006), mat("#6e1714", { roughness: 0.9 }), P.whole, 0, H - OVER + 0.007, D / 2 + 0.008); hem.castShadow = false;
    return { grip: H };
  },

  servingboard(P) {
    const S = P.spec, W = S.w ?? 0.62, D = S.d ?? 0.38, T = 0.03;
    const grain = canvasTex(512, 256, (g, w, h) => {
      g.fillStyle = "#a5703f"; g.fillRect(0, 0, w, h);
      const r = rng(5); g.strokeStyle = "rgba(90,50,20,0.35)"; g.lineWidth = 1.5;
      for (let i = 0; i < 40; i++) { const y = r() * h; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 20) g.lineTo(x, y + Math.sin(x * 0.02 + i) * 3); g.stroke(); }
    });
    const wood = mat("#ffffff", { roughness: 0.55, map: grain }); wood.userData.lookRole = "wood";
    const shape = new THREE.Shape(); const rr = 0.04, w = W / 2, d = D / 2;
    shape.moveTo(-w + rr, -d); shape.lineTo(w - rr, -d); shape.quadraticCurveTo(w, -d, w, -d + rr); shape.lineTo(w, d - rr); shape.quadraticCurveTo(w, d, w - rr, d); shape.lineTo(-w + rr, d); shape.quadraticCurveTo(-w, d, -w, d - rr); shape.lineTo(-w, -d + rr); shape.quadraticCurveTo(-w, -d, -w + rr, -d);
    const g = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.006, bevelSegments: 2 });
    g.rotateX(Math.PI / 2); g.translate(0, T, 0);
    mesh(g, wood, P.whole, 0, 0, 0);
    // a juice groove round the edge
    const groove = mesh(new THREE.TorusGeometry(1, 0.004, 4, 48), mat("#7a4c26", { roughness: 0.7 }), P.whole, 0, T + 0.002, 0); groove.rotation.x = Math.PI / 2; groove.scale.set(w - 0.035, d - 0.035, 1); groove.castShadow = false;
    return { grip: T };
  },

  bakedpotato(P) {
    const S = P.spec, { L, W, H } = STEAK.potato, a = L / 2, b = W / 2, cH = H / 2, cy = cH;
    // the potato: a squashed ellipsoid, flat underneath, golden-brown skin with darker freckles
    const pg = new THREE.SphereGeometry(1, 40, 24), pp = pg.attributes.position, col = [], r = rng(S.seed ?? 3), cc = new THREE.Color();
    for (let i = 0; i < pp.count; i++) {
      const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i), n = 1 + 0.035 * Math.sin(x * 7 + z * 5) * Math.cos(y * 6);
      pp.setXYZ(i, x * a * 0.97 * n, cy + Math.max(-0.92, y) * cH * n, z * b * 0.97 * n);
      cc.set(r() < 0.12 ? "#7a4a1e" : r() < 0.5 ? "#b9793a" : "#c98a45"); col.push(cc.r, cc.g, cc.b);
    }
    pg.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); pg.computeVertexNormals();
    const skin = mat("#ffffff", { roughness: 0.75, vertexColors: true }); skin.userData.noHatch = true;
    const potatoMesh = mesh(pg, skin, P.whole, 0, 0, 0);
    // the split top: a fluffy white mound in the slit, rising as the foil opens (buttery yellow at its edges)
    const fluff = new THREE.Group(); fluff.position.set(0, cy + cH * 0.55, 0); P.whole.add(fluff);
    const fg = new THREE.SphereGeometry(1, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2), fp = fg.attributes.position, fc = [];
    for (let i = 0; i < fp.count; i++) {
      const x = fp.getX(i), y = fp.getY(i), z = fp.getZ(i), k = 1 + 0.12 * Math.sin(x * 23 + z * 17) * Math.sin(z * 19 - x * 11) * y;
      fp.setXYZ(i, x * a * 0.78, y * 0.075 * k, z * b * 0.72); cc.set(y < 0.25 ? "#f3dc8c" : r() < 0.3 ? "#fbf3dc" : "#f7ecc9"); fc.push(cc.r, cc.g, cc.b);
    }
    fg.setAttribute("color", new THREE.Float32BufferAttribute(fc, 3)); fg.computeVertexNormals();
    const fm = mat("#ffffff", { roughness: 0.85, vertexColors: true }); fm.userData.noHatch = true;
    mesh(fg, fm, fluff, 0, 0, 0);
    // the foil: a crumpled shell round it, each triangle on its own (flat, a little out of line), the top folding back
    // outward about the rim, triangle by triangle (so it tears open at the top and peels down into a boat)
    const A = a + 0.014, B = b + 0.014, C = cH + 0.03, rimY = cy + cH * 0.22;
    const sg = new THREE.IcosahedronGeometry(1, 2).toNonIndexed(), sp = sg.attributes.position, base = new Float32Array(sp.count * 3);
    const rf = rng(S.seed ?? 7);
    for (let i = 0; i < sp.count; i += 3) {
      const j = 0.975 + rf() * 0.045;   // one triangle a little in or out: crumples (small, or the potato shows through the gaps)
      for (let k = 0; k < 3; k++) { const q = i + k, x = sp.getX(q), y = sp.getY(q), z = sp.getZ(q); base[q * 3] = x * A * j; base[q * 3 + 1] = cy - 0.012 + Math.max(-0.95, y) * C * j; base[q * 3 + 2] = z * B * j; }
    }
    const tri = [];
    for (let i = 0; i < sp.count; i += 3) {
      const cx = (base[i * 3] + base[i * 3 + 3] + base[i * 3 + 6]) / 3, cyy = (base[i * 3 + 1] + base[i * 3 + 4] + base[i * 3 + 7]) / 3, cz = (base[i * 3 + 2] + base[i * 3 + 5] + base[i * 3 + 8]) / 3;
      if (cyy <= rimY) { tri.push(null); continue; }
      const phi = Math.atan2(cz / B, cx / A), u = Math.sqrt(Math.max(0.05, 1 - ((rimY - cy) / C) ** 2));
      const R = new THREE.Vector3(Math.cos(phi) * A * u, rimY, Math.sin(phi) * B * u);
      const out = new THREE.Vector3(Math.cos(phi) / A, 0, Math.sin(phi) / B).normalize();
      const axis = new THREE.Vector3(0, 1, 0).cross(out).normalize();   // turning about it takes the top outward
      tri.push({ R, axis, wob: (rf() - 0.5) * 0.35, lag: rf() * 0.25 });
    }
    const foilM = new THREE.MeshStandardMaterial({ color: "#dfe3e8", roughness: 0.3, metalness: 0.55, flatShading: true, side: THREE.DoubleSide }); foilM.userData.noHatch = true;
    const foil = mesh(sg, foilM, P.whole, 0, 0, 0);
    const steam = steamWisps(P.whole, H + 0.05);
    const v = new THREE.Vector3(), q = new THREE.Quaternion();
    const shape = (open) => {
      for (let i = 0; i < sp.count; i += 3) {
        const T = tri[i / 3];
        for (let k = 0; k < 3; k++) {
          const n = i + k; v.set(base[n * 3], base[n * 3 + 1], base[n * 3 + 2]);
          if (T && open > 0) {
            // a top-down tear: the triangles near the top go first (lag), each turned outward about its rim point
            const o = clamp((open - T.lag * (1 - open)) / 1), ang = o * (2.55 + T.wob * 0.4);   // peeled right down over the outside, like a present's paper
            q.setFromAxisAngle(T.axis, ang); v.sub(T.R).multiplyScalar(1 - 0.45 * o).applyQuaternion(q).add(T.R);
          }
          sp.setXYZ(n, v.x, v.y, v.z);
        }
      }
      sp.needsUpdate = true; sg.computeVertexNormals(); sg.computeBoundingSphere();
    };
    let last = -1;
    shape(0);
    return {
      grip: H,
      apply(ps, t) {
        const open = clamp(ps.open ?? 0);
        if (Math.abs(open - last) > 1e-6) { shape(open); last = open; }
        fluff.scale.set(1, 0.15 + 0.85 * Math.min(1, open * 1.6), 1); fluff.visible = !S.empty && open > 0.01;
        potatoMesh.visible = !S.empty;   // empty: only the foil (a potato character sits in it)
        steam(ps.steam ?? 0, t);
        void foil;
      },
    };
  },

  // the split top of a baked potato character (worn, spec.wear, at the top of its head): fluffy potato bulging out of a
  // slit, buttery at its edges, and a small butter pat melting in it. len: the split's length (m). Origin: the slit's middle.
  spudsplit(P) {
    const S = P.spec, L = S.len ?? 0.16, r = rng(S.seed ?? 4), g = new THREE.Group(); P.whole.add(g);
    const fluffM = mat("#fbf0cf", { roughness: 0.9 }); fluffM.userData.noHatch = true;
    const edgeM = mat("#f2d77e", { roughness: 0.7 }); edgeM.userData.noHatch = true;
    for (let i = 0; i < 9; i++) { const u = i / 8 - 0.5, k = 0.8 + 0.4 * r(); const b = mesh(new THREE.SphereGeometry(L * 0.17 * k, 12, 10), i % 3 === 1 ? edgeM : fluffM, g, u * L * 0.75, L * (0.03 - 0.1 * u * u) + L * 0.02 * r(), (r() - 0.5) * L * 0.1); b.scale.set(1.2, 0.7, 0.95); b.castShadow = false; }
    const butM = mat("#ffd64a", { roughness: 0.35, emissive: new THREE.Color("#7a5a00"), emissiveIntensity: 0.15 }); butM.userData.noHatch = true;
    const pat = mesh(new THREE.BoxGeometry(L * 0.3, L * 0.1, L * 0.24), butM, g, L * 0.05, L * 0.1, 0); pat.rotation.y = 0.35; pat.castShadow = false;
    return { grip: 0.02, apply() {} };
  },

  toppingbowl(P) {
    const S = P.spec, R = 0.055, kind = S.food ?? "butter";
    const china = mat("#f6f4ee", { roughness: 0.3 });
    const prof = [[0.001, 0], [R * 0.6, 0], [R * 0.62, 0.006], [R * 0.95, 0.03], [R, 0.04], [R - 0.004, 0.041], [R * 0.9, 0.028], [R * 0.55, 0.008], [0.001, 0.008]].map(([x, y]) => new THREE.Vector2(x, y));
    const bw = mesh(new THREE.LatheGeometry(prof, 32), china, P.whole, 0, 0, 0); bw.material.side = THREE.DoubleSide;
    const top = 0.03, g = new THREE.Group(); g.position.y = top; P.whole.add(g);
    const fill = (c) => { const d = mesh(new THREE.SphereGeometry(R * 0.86, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2), food(c), g, 0, -0.006, 0); d.scale.y = 0.18; d.castShadow = false; };
    if (kind === "butter") { fill("#f3d46a"); for (const [x, z, ry] of [[-0.016, 0.004, 0.3], [0.017, -0.006, -0.4]]) { const p = mesh(new THREE.BoxGeometry(0.028, 0.012, 0.022), food(BUTTER, { roughness: 0.35 }), g, x, 0.006, z); p.rotation.y = ry; } }
    if (kind === "cream") { fill(CREAM); mesh(creamGeo(0.028), food(CREAM, { roughness: 0.4 }), g, 0, -0.002, 0); }
    if (kind === "cheese") { fill("#eea53a"); cheeseShreds(g, 40, R * 0.8, 9, 0.004); }
    if (kind === "chives") { fill("#3f8a24"); chives(g, 40, R * 0.8, 4, () => 0.006); }
    if (kind === "bacon") { fill("#7a2c1a"); bits(g, 22, R * 0.75, 8, 0.0); }
    return { grip: 0.04 };
  },

  butterpat(P) {
    const g = new THREE.BoxGeometry(0.056, 0.024, 0.042, 6, 2, 6), p = g.attributes.position, base = Float32Array.from(p.array);
    g.translate(0, 0.012, 0); base.set(p.array);
    const m = mesh(g, food(BUTTER, { roughness: 0.3 }), P.whole, 0, 0, 0);
    let last = -1;
    return {
      grip: 0.024,
      apply(ps) {
        const melt = clamp(ps.melt ?? 0); if (melt === last) return; last = melt;
        for (let i = 0; i < p.count; i++) { const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2], e = Math.max(Math.abs(x) / 0.028, Math.abs(z) / 0.021); p.setXYZ(i, x * (1 + 0.25 * melt * (y < 0.005 ? 1 : 0.4)), y * (1 - 0.35 * melt * e * e), z * (1 + 0.25 * melt * (y < 0.005 ? 1 : 0.4))); }
        p.needsUpdate = true; g.computeVertexNormals(); void m;
      },
    };
  },

  creamdollop(P) {
    const R = 0.045;
    mesh(creamGeo(R), food(CREAM, { roughness: 0.35 }), P.whole, 0, 0, 0);
    if (P.spec.chives) chives(P.whole, 22, R * 0.8, 6, (d) => Math.sqrt(Math.max(0, 1 - (d / R) ** 2)) * R * 1.12 + 0.002);
    return { grip: R };
  },

  cheeseslice(P) {
    const N = 10, g = new THREE.BoxGeometry(0.09, 0.005, 0.09, N, 1, N), p = g.attributes.position;
    g.translate(0, 0.0025, 0); const base = Float32Array.from(p.array);
    const m = mesh(g, food(CHEESE, { roughness: 0.4 }), P.whole, 0, 0, 0);
    let last = -1;
    return {
      grip: 0.005,
      apply(ps) {
        const melt = clamp(ps.melt ?? 0); if (melt === last) return; last = melt;
        // the corners droop over whatever is under it
        for (let i = 0; i < p.count; i++) { const x = base[i * 3], z = base[i * 3 + 2], d = Math.max(0, Math.hypot(x, z) - 0.02); p.setXYZ(i, x * (1 - 0.1 * melt), base[i * 3 + 1] - melt * 0.9 * d * d * 20 - melt * 0.6 * d * 0.4, z * (1 - 0.1 * melt)); }
        p.needsUpdate = true; g.computeVertexNormals(); void m;
      },
    };
  },

  baconbits(P) {
    const n = P.spec.n ?? 16;
    if (P.spec.chives) { chives(P.whole, 22, 0.03, P.spec.seed ?? 7, () => 0.004); return { grip: 0.008 }; }   // a pinch of chives (spec.chives)
    if (n === 1) { mesh(baconGeo(P.spec.seed ?? 3, 0.013), food(BACON[(P.spec.seed ?? 3) % 4], { roughness: 0.5 }), P.whole, 0, 0.007, 0); return { grip: 0.014 }; }
    bits(P.whole, n, 0.035, P.spec.seed ?? 5, 0);
    return { grip: 0.025 };
  },

  tablespoon(P) {
    const L = STEAK.spoon.len, steel = mat("#d3d8df", { roughness: 0.22, metalness: 0.78 });
    // the bowl at the bottom (its tip at the origin), the neck, the handle up +y
    const bowl = mesh(new THREE.SphereGeometry(0.026, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), steel, P.whole, 0, 0.032, 0); bowl.scale.set(0.85, 1.25, 0.4); bowl.rotation.x = -Math.PI / 2; bowl.material.side = THREE.DoubleSide;
    mesh(new THREE.BoxGeometry(0.008, 0.04, 0.004), steel, P.whole, 0, 0.074, -0.004);
    mesh(new THREE.BoxGeometry(0.014, L - 0.094, 0.005), steel, P.whole, 0, 0.094 + (L - 0.094) / 2, -0.004);
    mesh(new THREE.SphereGeometry(0.01, 10, 8), steel, P.whole, 0, L - 0.004, -0.004).scale.set(1, 1.3, 0.4);
    // a spoonful in the bowl (on its open side, +z): one of the toppings or the fluffy potato
    const fg = new THREE.Group(); fg.position.set(0, 0.032, 0.004); P.whole.add(fg);
    const make = [];
    const lone = (geo, m, z) => { const o = new THREE.Mesh(geo, m); o.position.set(0, 0, z); return o; };
    const lump = (c, s = 1) => { const m = lone(new THREE.SphereGeometry(0.019 * s, 14, 10), food(c), 0.004); m.scale.set(1, 1.3, 0.75); return m; };
    make[0] = () => lump("#f6ebc6");
    make[1] = () => lone(new THREE.BoxGeometry(0.028, 0.034, 0.014), food(BUTTER, { roughness: 0.3 }), 0.008);
    make[2] = () => lump(CREAM, 1.05);
    make[3] = () => { const g = new THREE.Group(); g.add(lump("#f2a42a", 0.9)); return g; };
    make[4] = () => { const g = new THREE.Group(); chives(g, 14, 0.012, 2, () => 0.006); g.rotation.x = -Math.PI / 2; return g; };
    make[5] = () => { const g = new THREE.Group(); bits(g, 7, 0.013, 3, 0); g.rotation.x = -Math.PI / 2; return g; };
    make[6] = () => { const g = new THREE.Group(); g.add(lump("#f6ebc6", 1.05)); const c = lump(CREAM, 0.6); c.position.set(0.004, 0.008, 0.016); g.add(c); const ch = lump(CHEESE, 0.45); ch.position.set(-0.008, -0.004, 0.018); g.add(ch); const bb = new THREE.Group(); bits(bb, 4, 0.01, 6, 0); bb.rotation.x = -Math.PI / 2; bb.position.z = 0.02; g.add(bb); return g; };
    const foods = make.map((f) => { const o = f(); o.visible = false; fg.add(o); o.traverse((x) => { if (x.isMesh) x.castShadow = true; }); return o; });
    return {
      grip: L * 0.75,
      apply(ps) { const f = clamp(ps.food ?? 0), k = Math.round(ps.fk ?? 0); foods.forEach((o, i) => { o.visible = f > 0.01 && i === k; }); fg.scale.setScalar(Math.max(0.01, f)); },
    };
  },

  skilletsteak(P) {
    const S = P.spec, R = 0.14;
    const wood = mat("#7b4a26", { roughness: 0.6 }); wood.userData.lookRole = "wood";
    mesh(new THREE.CylinderGeometry(R + 0.03, R + 0.03, 0.018, 40), wood, P.whole, 0, 0.009, 0);
    const iron = mat("#26252a", { roughness: 0.45, metalness: 0.5 });
    const prof = [[0.001, 0], [R * 0.9, 0], [R, 0.006], [R + 0.004, 0.026], [R - 0.004, 0.028], [R * 0.9, 0.01], [0.001, 0.01]].map(([x, y]) => new THREE.Vector2(x, y));
    const pan = mesh(new THREE.LatheGeometry(prof, 40), iron, P.whole, 0, 0.018, 0); pan.material.side = THREE.DoubleSide;
    // the steak: a thick rounded slab, dark seared with grill marks
    const sear = canvasTex(256, 192, (g, w, h) => {
      g.fillStyle = "#6b3417"; g.fillRect(0, 0, w, h);
      const r = rng(2); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${40 + r() * 60},${18 + r() * 20},8,0.35)`; g.fillRect(r() * w, r() * h, 3, 3); }
      g.strokeStyle = "#2a130a"; g.lineWidth = 10; for (let i = -2; i < 7; i++) { g.beginPath(); g.moveTo(i * 44, 0); g.lineTo(i * 44 + 90, h); g.stroke(); }
    });
    const sg = new THREE.CylinderGeometry(1, 1, 1, 32, 2); sg.scale(0.095, 0.03, 0.068);
    { const p = sg.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setX(i, x * (1 + 0.15 * Math.sin(Math.atan2(z, x) * 2 + 0.5))); } sg.computeVertexNormals(); }
    const meat = mat("#ffffff", { roughness: 0.55, map: sear }); meat.userData.noHatch = true;
    mesh(sg, meat, P.whole, -0.01, 0.028 + 0.015, 0.0);
    // a rosemary sprig on top and a few peppercorns
    const herb = food("#3f6b2a", { roughness: 0.6 });
    const stem = mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.07, 5), food("#5a4a2a"), P.whole, 0.01, 0.062, -0.01); stem.rotation.set(Math.PI / 2, 0.6, 0);
    const r = rng(4); for (let i = 0; i < 12; i++) { const t = (i / 11 - 0.5) * 0.065, l = mesh(new THREE.BoxGeometry(0.0025, 0.0015, 0.014), herb, P.whole, 0.01 + Math.sin(0.6) * t + (i % 2 ? 0.005 : -0.005), 0.063, -0.01 + Math.cos(0.6) * t); l.rotation.y = 0.6 + (i % 2 ? 0.7 : -0.7) + (r() - 0.5) * 0.2; l.castShadow = false; }
    const steam = steamWisps(P.whole, 0.08);
    return { grip: 0.06, apply(ps, t) { steam(ps.steam ?? S.steam ?? 0.5, t); } };
  },

  corncob(P) {
    const { len, r: R } = STEAK.corn, k = P.spec.kernels ?? 1, g = new THREE.Group(); g.position.y = R; P.whole.add(g);
    mesh(new THREE.CylinderGeometry(R * 0.82, R * 0.82, len * 0.98, 16), food("#e8c75a"), g, 0, 0, 0).rotation.z = Math.PI / 2;
    // the kernels: rows round the cob, bigger in the middle, smaller at the ends
    const kern = new THREE.SphereGeometry(1, 6, 5), ms = [food("#ffd23a", { roughness: 0.35 }), food("#f7c62e", { roughness: 0.35 }), food("#ffe066", { roughness: 0.35 })];
    const rows = 14, per = 15, r = rng(2);
    for (let i = 0; i < rows; i++) for (let j = 0; j < per; j++) {
      const u = (j + 0.5) / per - 0.5, taper = 1 - 1.6 * u * u, a = (i / rows) * Math.PI * 2 + (j % 2) * 0.2, s = 0.0065 * (R / 0.034) * taper * k;
      const o = mesh(kern, ms[(r() * 3) | 0], g, u * len, Math.cos(a) * R * 0.86 * taper, Math.sin(a) * R * 0.86 * taper); o.scale.set(s * 0.9, s, s); o.castShadow = false;
    }
    // a melting pat of butter on top
    mesh(new THREE.BoxGeometry(0.04, 0.008, 0.027), food(BUTTER, { roughness: 0.3 }), g, 0.01, R * 0.95, 0.0);
    return { grip: R };
  },

  lemonade(P) {
    const R = 0.042, H = 0.17;
    const glass = new THREE.MeshPhysicalMaterial({ color: "#f4fbff", roughness: 0.05, transparent: true, opacity: 0.32, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide }); glass.userData.glass = true;
    const prof = [[0.001, 0], [R * 0.85, 0], [R * 0.88, 0.012], [R, H], [R - 0.003, H], [R * 0.84, 0.014], [0.001, 0.014]].map(([x, y]) => new THREE.Vector2(x, y));
    const sh = mesh(new THREE.LatheGeometry(prof, 32), glass, P.whole); sh.castShadow = false; sh.renderOrder = 3;
    const juice = new THREE.MeshStandardMaterial({ color: "#f7d74a", transparent: true, opacity: 0.8, roughness: 0.15, depthWrite: false }); juice.userData.liquid = true;
    const lv = H * 0.82, j = mesh(new THREE.CylinderGeometry(R * 0.95, R * 0.84, lv - 0.014, 28), juice, P.whole, 0, 0.014 + (lv - 0.014) / 2, 0); j.renderOrder = 2; j.castShadow = false;
    const top = mesh(new THREE.CircleGeometry(R * 0.94, 28), food("#ffe27a", { emissive: new THREE.Color("#c99a10"), emissiveIntensity: 0.2 }), P.whole, 0, lv, 0); top.rotation.x = -Math.PI / 2; top.castShadow = false;
    const ice = mat("#ffffff", { roughness: 0.1, transparent: true, opacity: 0.55 });
    for (const [x, z, ry] of [[-0.014, 0.008, 0.4], [0.012, -0.01, 1.1]]) { const c = mesh(new THREE.BoxGeometry(0.02, 0.018, 0.02), ice, P.whole, x, lv - 0.004, z); c.rotation.set(0.3, ry, 0.2); c.castShadow = false; }
    // a lemon slice on the rim, toward the camera, and a striped straw
    const lemon = new THREE.Group(); lemon.position.set(0.0, H - 0.008, R); lemon.rotation.set(0, 0, 0); P.whole.add(lemon);
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.006, 24), food("#f4d03a"), lemon, 0, 0, 0).rotation.x = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.0065, 24), food("#fbeaa0"), lemon, 0, 0, 0).rotation.x = Math.PI / 2;
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, s = mesh(new THREE.BoxGeometry(0.0015, 0.022, 0.007), food("#f6f0d0"), lemon, Math.cos(a) * 0.012, Math.sin(a) * 0.012, 0); s.rotation.z = a + Math.PI / 2; s.castShadow = false; }
    const straw = mesh(new THREE.CylinderGeometry(0.0035, 0.0035, H * 0.95, 8), food("#ffffff"), P.whole, -0.016, H * 0.62, -0.006); straw.rotation.z = 0.22;
    for (let i = 0; i < 5; i++) { const st = mesh(new THREE.CylinderGeometry(0.0037, 0.0037, 0.012, 8), food("#e04848"), straw, 0, -H * 0.4 + i * 0.04, 0); st.castShadow = false; }
    return { grip: H / 2 };
  },

  barcounter(P) {
    const S = P.spec, W = S.w ?? 0.9, D = S.d ?? 0.14, H = S.h ?? 0.4;
    const front = canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#6a4024"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(30,15,6,0.7)"; g.lineWidth = 4; for (let x = 32; x < w; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } });
    const wood = mat("#ffffff", { roughness: 0.65, map: front }); wood.userData.lookRole = "wood";
    mesh(new THREE.BoxGeometry(W, H - 0.04, D), wood, P.whole, 0, (H - 0.04) / 2, 0);
    const topM = mat("#3e2414", { roughness: 0.4 }); topM.userData.lookRole = "wood";
    mesh(new THREE.BoxGeometry(W + 0.06, 0.04, D + 0.06), topM, P.whole, 0, H - 0.02, 0);
    return { grip: H };
  },
};
