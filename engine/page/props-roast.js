import * as THREE from "three";
import { clamp, rng } from "./util.js";
import { mat, mesh, canvasTex } from "./props-trend.js";
import { steamWisps } from "./steam.js";

// "That one friend who always orders potatoes… at Sunday roast" (always orders potatoes, episode 2, 6 Nov 2026): an old
// London pub's dining table and a Sunday roast. Jonny's eight panels: a dark oak table with a red tartan runner, blue-rimmed
// white plates (two roast potatoes, carrots, peas, a Yorkshire pudding and gravy on each friend's plate), Viking's big plate
// heaped with golden roast potatoes, a gravy boat, a wooden pepper mill and a glass salt shaker.
// The food was ordinary food in the first cut. Jonny, 7 Nov 2026: in this series every potato that gets eaten is alive,
// so a spec with `alive: true` gives each roast potato a little face (two eyes that blink, a mouth): `mood` 0 a smile ..
// 1 a scared round "O" (eyes wider), `joy` 0..1 squeezes the eyes shut with happiness (^ ^). On a fork the same keys
// are `fmood` / `fjoy`. Cute, never gross: they smile at Viking, they never get bitten on screen.
//   pubtable    a long dark oak table along x (spec.w, spec.d, spec.h) with a red tartan runner down its middle toward the
//               camera, hanging over the front edge. Origin: the floor under its middle. Grip: its top (h).
//   roastie     one roast potato (about 6 cm): craggy golden-brown crust, a paler fluffy cut face; spec.seed shapes it.
//               Origin: its bottom. A loose rigid body for the physics (it rolls).
//   roastheap   Viking's heap: spec.n roast potatoes piled on a big plate (r spec.r 0.2, the plate included); `more`
//               0..1 pops a second layer in (spec.m more of them, the Wizard's spell doubling it), the top ones
//               spilling to the rim. `steam` 0..1.
//   roastplate  a friend's roast dinner on a blue-rimmed plate (r 0.15): carrots, peas, a Yorkshire pudding, a pool of
//               gravy. The two roast potatoes on it are roastie props. `steam` 0..1.
//   gravyboat   a white china gravy boat on its saucer, brown gravy inside, its spout toward -x.
//   mills       a wooden pepper mill and a glass salt shaker (table dressing).
//   pubstep     a raised wooden floor (spec.w, spec.d, spec.h) the back row stands on.
//   hopbeam     a dark oak ceiling beam along x (spec.w) with bunches of dried hops hanging off it (spec.n, spec.seed).
//   fork        a steel dinner fork standing on its tine tips (origin), the handle up +y (len 0.19); the thin hold pinches
//               it near the top. `food` 0..1 shows a roast potato on the tines (spec.foodSeed shapes it).
export const ROAST = { table: { h: 0.4 }, roastie: { r: 0.034 }, fork: { len: 0.25 } };

const CRUST = ["#d98f2b", "#e6a83c", "#c9781f", "#efbb52"];
// one roast potato's geometry: a chunky, faceted lump (cut with a knife, then roasted), flat-ish underneath, the crust
// coloured per vertex (deeper brown on the sharp edges, golden on the faces, one paler fluffy cut face)
function roastieGeo(seed = 1, R = ROAST.roastie.r) {
  const r = rng(seed), g = new THREE.IcosahedronGeometry(R, 1), p = g.attributes.position, v = new THREE.Vector3();
  // a few flat cut planes (a chunk of a bigger potato), then a little craggy noise
  const cuts = Array.from({ length: 4 }, () => { const n = new THREE.Vector3(r() - 0.5, (r() - 0.5) * 0.6, r() - 0.5).normalize(); return { n, d: R * (0.62 + r() * 0.18) }; });
  cuts.push({ n: new THREE.Vector3(0, -1, 0), d: R * 0.62 });   // it sits on a flat side
  const sx = 1 + (r() - 0.5) * 0.35, sz = 1 + (r() - 0.5) * 0.35;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); v.x *= sx; v.z *= sz;
    for (const c of cuts) { const d = v.dot(c.n); if (d > c.d) v.addScaledVector(c.n, c.d - d); }
    const k = 1 + (Math.sin(v.x * 211 + seed) * Math.cos(v.z * 173 - seed * 0.7) + Math.sin(v.y * 157 + seed * 1.3)) * 0.035;
    v.multiplyScalar(k); p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeBoundingBox(); g.translate(0, -g.boundingBox.min.y, 0);
  const geo = g.toNonIndexed(); geo.computeVertexNormals();
  const n = geo.attributes.normal, col = [], cc = new THREE.Color(), pale = new THREE.Color("#f6dc8f"), dark = new THREE.Color("#9a5514");
  const cut = cuts[0].n;
  for (let i = 0; i < n.count; i += 3) {
    const nx = (n.getX(i) + n.getX(i + 1) + n.getX(i + 2)) / 3, ny = (n.getY(i) + n.getY(i + 1) + n.getY(i + 2)) / 3, nz = (n.getZ(i) + n.getZ(i + 1) + n.getZ(i + 2)) / 3;
    const face = new THREE.Vector3(nx, ny, nz).normalize();
    cc.set(CRUST[Math.floor(r() * CRUST.length)]);
    if (face.dot(cut) > 0.9) cc.lerp(pale, 0.55);   // the fluffy cut face
    else if (r() < 0.22) cc.lerp(dark, 0.45);       // a crispy dark edge
    for (let k = 0; k < 3; k++) col.push(cc.r, cc.g, cc.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  return geo;
}
// a roast potato's face, on the side toward the camera (+z), at the lump's middle height: two eyes (white, a black
// pupil with a highlight) and a mouth (a smile, or a round "O" when scared). Returns set(mood, joy, t) for apply():
// it blinks on its own (deterministic, from the seed and the time).
function roastFace(parent, R, seed = 1, at = [0, R * 0.62, 0]) {
  const white = mat("#fffdf6", { roughness: 0.3 }), black = mat("#1a0f08", { roughness: 0.4 }), shine = mat("#ffffff", { roughness: 0.2 });
  for (const m of [white, black, shine]) m.userData.noHatch = true;
  const f = new THREE.Group(); f.position.set(at[0], at[1], at[2] + R * 0.88); parent.add(f);
  const eyes = [-1, 1].map((sx) => {
    const g = new THREE.Group(); g.position.set(sx * R * 0.3, R * 0.16, 0); f.add(g);
    const w = mesh(new THREE.SphereGeometry(R * 0.21, 14, 10), white, g, 0, 0, 0); w.scale.set(1, 1.15, 0.55);
    const p = mesh(new THREE.SphereGeometry(R * 0.125, 12, 8), black, g, 0, R * 0.03, R * 0.07); p.scale.set(1, 1.1, 0.6);
    const h = mesh(new THREE.SphereGeometry(R * 0.045, 8, 6), shine, g, R * 0.04, R * 0.08, R * 0.12);
    // the happy squint (^): a dark arc, shown when the eye shuts with joy
    const arc = mesh(new THREE.TorusGeometry(R * 0.15, R * 0.032, 6, 14, Math.PI), black, g, 0, -R * 0.04, R * 0.08);
    for (const m of [w, p, h, arc]) m.castShadow = false;
    return { g, w, p, h, arc };
  });
  const smile = mesh(new THREE.TorusGeometry(R * 0.15, R * 0.035, 6, 14, Math.PI), black, f, 0, -R * 0.12, R * 0.02); smile.rotation.z = Math.PI; smile.castShadow = false;
  const oh = mesh(new THREE.SphereGeometry(R * 0.11, 12, 8), black, f, 0, -R * 0.2, R * 0.01); oh.scale.set(0.85, 1.1, 0.4); oh.castShadow = false;
  const per = 2.4 + ((seed * 0.37) % 1.4), ph = (seed * 1.618) % per;
  return (mood = 0, joy = 0, t = 0) => {
    const blink = ((t + ph) % per) < 0.09, wide = 1 + 0.55 * mood;   // scared: big round eyes (what reads at phone size)
    for (const e of eyes) {
      const shut = joy > 0.5;
      e.w.visible = e.p.visible = e.h.visible = !shut; e.arc.visible = shut;
      e.g.scale.set(wide, shut ? 1 : blink ? 0.12 : wide, 1);
    }
    smile.visible = mood < 0.5; oh.visible = mood >= 0.5; oh.scale.set(0.85 * (1 + 0.4 * mood), 1.1 * (1 + 0.4 * mood), 0.4);
    smile.scale.setScalar(1 + 0.25 * joy);
  };
}
const crustMat = () => { const m = mat("#ffffff", { roughness: 0.55, vertexColors: true }); m.userData.noHatch = true; return m; };

// a blue-rimmed white plate (the panels' plates): a lathe with a well and a raised rim, a thin blue band
function plate(parent, r = 0.15) {
  const china = mat("#f7f5ef", { roughness: 0.32 }), rim = mat("#2f6fa8", { roughness: 0.4 });
  const prof = [[0.001, 0], [r * 0.62, 0], [r * 0.66, 0.008], [r * 0.7, 0.008], [r, 0.02], [r - 0.006, 0.022], [r * 0.7, 0.012], [0.001, 0.012]].map(([x, y]) => new THREE.Vector2(x, y));
  const p = mesh(new THREE.LatheGeometry(prof, 44), china, parent, 0, 0, 0); p.material.side = THREE.DoubleSide;
  const band = mesh(new THREE.TorusGeometry(r - 0.014, 0.0032, 6, 44), rim, parent, 0, 0.0195, 0); band.rotation.x = Math.PI / 2; band.castShadow = false;
  return 0.012;   // the well's floor
}

export const ROAST_KINDS = {
  pubtable(P) {
    const S = P.spec, W = S.w ?? 3.0, D = S.d ?? 0.9, H = S.h ?? ROAST.table.h, T = 0.045;
    const oak = canvasTex(1024, 256, (g, w, h) => {
      g.fillStyle = "#5e3b20"; g.fillRect(0, 0, w, h);
      const r = rng(7);
      for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? "#563519" : "#64401f"; g.fillRect(0, (i * h) / 5, w, h / 5); }   // planks
      g.strokeStyle = "rgba(30,16,6,0.55)"; g.lineWidth = 2; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(0, (i * h) / 5); g.lineTo(w, (i * h) / 5); g.stroke(); }
      g.strokeStyle = "rgba(40,22,10,0.25)"; g.lineWidth = 1;
      for (let i = 0; i < 70; i++) { const y = r() * h; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * 0.01 + i) * 3); g.stroke(); }
    });
    const top = mat("#ffffff", { roughness: 0.55, map: oak }); top.userData.lookRole = "wood";
    const wood = mat("#4a2d17", { roughness: 0.6 }); wood.userData.lookRole = "wood";
    mesh(new THREE.BoxGeometry(W, T, D), top, P.whole, 0, H - T / 2, 0);
    for (const x of [-1, 1]) for (const z of [-1, 1]) mesh(new THREE.BoxGeometry(0.07, H - T, 0.07), wood, P.whole, x * (W / 2 - 0.1), (H - T) / 2, z * (D / 2 - 0.1));
    mesh(new THREE.BoxGeometry(W - 0.2, 0.08, 0.03), wood, P.whole, 0, H - T - 0.04, D / 2 - 0.1);   // the apron rail
    // the tartan runner: red with dark green and navy bands and a thin yellow line, down the middle toward the camera
    const RW = S.runner ?? 0.36, OVER = 0.1;
    const tartan = canvasTex(256, 512, (g, w, h) => {
      g.fillStyle = "#a61e22"; g.fillRect(0, 0, w, h);
      const band = (horiz, at, size, col) => { g.fillStyle = col; if (horiz) g.fillRect(0, at, w, size); else g.fillRect(at, 0, size, h); };
      g.globalAlpha = 0.55;
      for (const horiz of [false, true]) {
        const L = horiz ? h : w;
        for (let o = 0; o < L; o += 96) { band(horiz, o + 10, 26, "#173a2a"); band(horiz, o + 46, 12, "#1b2440"); band(horiz, o + 70, 3, "#e8c23a"); band(horiz, o + 84, 3, "#f2efe6"); }
      }
      g.globalAlpha = 1;
    });
    tartan.wrapS = tartan.wrapT = THREE.RepeatWrapping; tartan.repeat.set(1, 1.6);
    const cloth = mat("#ffffff", { roughness: 0.85, map: tartan }); cloth.userData.noHatch = true;
    const L = D;
    const run = mesh(new THREE.PlaneGeometry(RW, L), cloth, P.whole, S.runnerX ?? 0, H + 0.002, 0); run.rotation.x = -Math.PI / 2; run.castShadow = false;
    const hang = mesh(new THREE.PlaneGeometry(RW, OVER), cloth, P.whole, S.runnerX ?? 0, H - OVER / 2 + 0.001, D / 2 + 0.003); hang.castShadow = false;
    // a fringe at its end
    const fr = mat("#7d1416", { roughness: 0.9 });
    for (let i = 0; i < 16; i++) mesh(new THREE.BoxGeometry(0.004, 0.025, 0.002), fr, P.whole, (S.runnerX ?? 0) - RW / 2 + 0.01 + (i * (RW - 0.02)) / 15, H - OVER - 0.012, D / 2 + 0.004).castShadow = false;
    return { grip: H };
  },

  roastie(P) {
    const k = P.spec.size ?? 1;
    const m = mesh(roastieGeo(P.spec.seed ?? 1, ROAST.roastie.r * k), crustMat(), P.whole, 0, 0, 0);
    m.rotation.y = ((P.spec.seed ?? 1) * 1.7) % 6.28;
    const face = P.spec.alive ? roastFace(P.whole, ROAST.roastie.r * k, P.spec.seed ?? 1) : null;
    return { grip: ROAST.roastie.r * k, ...(face && { apply(ps, t) { face(ps.mood ?? 0, ps.joy ?? 0, t); } }) };
  },

  roastheap(P) {
    const S = P.spec, R = S.r ?? 0.2, n = S.n ?? 12, m = S.m ?? 12, r = rng(S.seed ?? 5), RR = ROAST.roastie.r;
    const well = plate(P.whole, R), M = crustMat();
    // a mound: rings of roast potatoes, each layer smaller and higher (deterministic), the first `n` there from the
    // start, the next `m` (the spell's) popping in from the top down to the rim
    const spots = [];
    const ring = (count, rad, y) => { for (let i = 0; i < count; i++) { const a = (i / count) * Math.PI * 2 + r() * 0.5, d = rad * (0.9 + r() * 0.2); spots.push([Math.cos(a) * d, y, Math.sin(a) * d]); } };
    ring(7, R * 0.52, well); ring(4, R * 0.26, well + RR * 1.1); spots.push([0, well + RR * 2.1, 0]);
    // the second heap: a taller mound and a few spilling over the rim
    ring(8, R * 0.62, well + RR * 1.3); ring(5, R * 0.38, well + RR * 2.3); ring(3, R * 0.18, well + RR * 3.2); spots.push([0, well + RR * 4.0, 0.01]);
    ring(4, R * 1.02, 0.0);
    const parts = spots.map(([x, y, z], i) => {
      const o = new THREE.Mesh(roastieGeo(40 + i * 7, RR * (0.9 + r() * 0.25)), M); o.position.set(x, y, z); o.rotation.set((r() - 0.5) * 0.6, r() * 6.28, (r() - 0.5) * 0.6); o.castShadow = o.receiveShadow = true; P.whole.add(o);
      // alive: a face on each one, held in its own group at the lump (not turned with it), so every face looks at us
      let face = null, fg = null;
      if (S.alive) { fg = new THREE.Group(); fg.position.set(x, y, z); P.whole.add(fg); face = roastFace(fg, RR * 0.95, 40 + i * 7, [0, RR * 0.55, 0]); }
      return { o, fg, face, base: i < n ? 0 : 1 + (i - n) / Math.max(1, Math.min(m, spots.length - n)) };
    });
    const steam = steamWisps(P.whole, 0.14);
    return {
      grip: well + RR * 2.4,
      apply(ps, t) {
        const more = clamp(ps.more ?? 0);
        for (const q of parts) {
          if (q.face) q.face(ps.mood ?? 0, ps.joy ?? 0, t);
          if (q.base === 0) { q.o.visible = true; q.o.scale.setScalar(1); continue; }
          // each pops in over its own slice of `more` with a small overshoot
          const u = clamp((more * 1.4 - (q.base - 1)) / 0.4), s = u <= 0 ? 0 : u < 1 ? Math.sin(u * Math.PI * 0.75) / Math.sin(Math.PI * 0.75) : 1;
          q.o.visible = s > 0.01; q.o.scale.setScalar(Math.max(0.01, Math.min(1.12, s)));
          if (q.fg) { q.fg.visible = q.o.visible; q.fg.scale.setScalar(Math.max(0.01, Math.min(1.12, s))); }
        }
        steam(ps.steam ?? 0.6, t);
      },
    };
  },

  roastplate(P) {
    const S = P.spec, r = rng(S.seed ?? 3), well = plate(P.whole, 0.15);
    // a pool of gravy
    const gravy = mesh(new THREE.CircleGeometry(1, 28), mat("#6b3a17", { roughness: 0.25 }), P.whole, -0.02, well + 0.002, 0.02); gravy.rotation.x = -Math.PI / 2; gravy.scale.set(0.07, 0.055, 1); gravy.castShadow = false;
    // carrot batons
    const carrot = mat("#f07a1e", { roughness: 0.45 }); carrot.userData.noHatch = true;
    for (let i = 0; i < 4; i++) { const c = mesh(new THREE.CylinderGeometry(0.008, 0.007, 0.06, 8), carrot, P.whole, 0.045 + i * 0.012, well + 0.009, 0.045 + (r() - 0.5) * 0.02); c.rotation.set(Math.PI / 2, 0, 0.4 + r() * 0.3); }
    // peas
    const pea = mat("#5fae2e", { roughness: 0.4 }); pea.userData.noHatch = true;
    for (let i = 0; i < 14; i++) { const a = r() * 6.28, d = r() * 0.03; mesh(new THREE.SphereGeometry(0.0075, 8, 6), pea, P.whole, -0.06 + Math.cos(a) * d, well + 0.007, 0.06 + Math.sin(a) * d * 0.7).castShadow = false; }
    // a Yorkshire pudding: a golden puffed cup, hollow in the middle
    const yp = mat("#d99a3c", { roughness: 0.6 }); yp.userData.noHatch = true;
    const prof = [[0.001, 0], [0.035, 0], [0.05, 0.02], [0.054, 0.04], [0.046, 0.046], [0.04, 0.03], [0.026, 0.014], [0.001, 0.012]].map(([x, y]) => new THREE.Vector2(x, y));
    const y = mesh(new THREE.LatheGeometry(prof, 20), yp, P.whole, 0.055, well, -0.05); y.material.side = THREE.DoubleSide;
    const steam = steamWisps(P.whole, 0.06);
    return { grip: well, apply(ps, t) { steam(ps.steam ?? 0.5, t); } };
  },

  gravyboat(P) {
    const china = mat("#f7f5ef", { roughness: 0.3 });
    mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.008, 28), china, P.whole, 0, 0.004, 0);   // the saucer
    const bowl = mesh(new THREE.SphereGeometry(0.05, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), china, P.whole, 0, 0.055, 0); bowl.scale.set(1.35, 0.9, 0.85); bowl.material.side = THREE.DoubleSide;
    mesh(new THREE.CylinderGeometry(0.02, 0.026, 0.012, 16), china, P.whole, 0, 0.014, 0);
    const spout = mesh(new THREE.ConeGeometry(0.02, 0.05, 12, 1, true), china, P.whole, -0.075, 0.055, 0); spout.rotation.z = Math.PI / 2 + 0.35; spout.material.side = THREE.DoubleSide;
    const h = mesh(new THREE.TorusGeometry(0.02, 0.006, 8, 16, Math.PI * 1.2), china, P.whole, 0.07, 0.055, 0); h.rotation.z = -0.9;
    const g = mesh(new THREE.CircleGeometry(0.045, 24), mat("#6b3a17", { roughness: 0.2 }), P.whole, 0, 0.05, 0); g.rotation.x = -Math.PI / 2; g.scale.set(1.3, 0.8, 1); g.castShadow = false;
    return { grip: 0.05 };
  },

  mills(P) {
    const wood = mat("#6b4022", { roughness: 0.45 }); wood.userData.lookRole = "wood";
    const prof = [[0.001, 0], [0.022, 0], [0.024, 0.01], [0.018, 0.05], [0.021, 0.075], [0.014, 0.09], [0.008, 0.1], [0.001, 0.104]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh(new THREE.LatheGeometry(prof, 20), wood, P.whole, -0.035, 0, 0);
    const glass = new THREE.MeshPhysicalMaterial({ color: "#eef6f4", roughness: 0.08, transparent: true, opacity: 0.45, clearcoat: 1 }); glass.userData.glass = true;
    mesh(new THREE.CylinderGeometry(0.017, 0.019, 0.06, 16), glass, P.whole, 0.03, 0.03, 0);
    mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.035, 16), mat("#fbfbf8", { roughness: 0.9 }), P.whole, 0.03, 0.018, 0);
    mesh(new THREE.SphereGeometry(0.018, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat("#c9ced6", { roughness: 0.25, metalness: 0.7 }), P.whole, 0.03, 0.06, 0);
    return { grip: 0.05 };
  },

  fork(P) {
    const L = ROAST.fork.len, steel = mat("#d3d8df", { roughness: 0.25, metalness: 0.75 });
    // the tines at the bottom (origin at their tips), the neck, the handle up +y
    for (let k = -1.5; k <= 1.5; k++) mesh(new THREE.BoxGeometry(0.003, 0.045, 0.003), steel, P.whole, k * 0.0055, 0.0225, 0);
    mesh(new THREE.BoxGeometry(0.024, 0.012, 0.0035), steel, P.whole, 0, 0.05, 0);
    mesh(new THREE.BoxGeometry(0.008, 0.04, 0.004), steel, P.whole, 0, 0.075, 0);
    mesh(new THREE.BoxGeometry(0.012, L - 0.095, 0.005), steel, P.whole, 0, 0.095 + (L - 0.095) / 2, 0);
    // a roast potato on the tines
    const food = new THREE.Mesh(roastieGeo(P.spec.foodSeed ?? 9, ROAST.roastie.r * 0.95), crustMat()); food.castShadow = true;
    const fg = new THREE.Group(); fg.position.set(0, -0.012, 0); fg.add(food); P.whole.add(fg);
    // alive (Jonny 7 Nov): the speared one's face, on the tines' front side (the fork's +z)
    // (a face on both sides: the fork turns in the fist, and a speared one always looks out at us)
    const faces = P.spec.alive ? [0, Math.PI].map((ry) => { const g = new THREE.Group(); g.rotation.y = ry; fg.add(g); return roastFace(g, ROAST.roastie.r * 0.95, P.spec.foodSeed ?? 9, [0, ROAST.roastie.r * 0.5, 0]); }) : [];
    return { grip: L * 0.75, apply(ps, t) { const f = clamp(ps.food ?? 0); fg.visible = f > 0.01; fg.scale.setScalar(Math.max(0.01, f)); for (const face of faces) face(ps.fmood ?? 0, ps.fjoy ?? 0, t); } };
  },

  // a dark oak ceiling beam along x (spec.w) with bunches of dried hops tied on along it, hanging down (spec.n bunches,
  // spaced unevenly, of different sizes: hops are hung as they come, in loose garlands). Origin: the beam's middle.
  hopbeam(P) {
    const S = P.spec, W = S.w ?? 3.0, n = S.n ?? 7, r = rng(S.seed ?? 3);
    const wood = mat("#3b2414", { roughness: 0.7 }); wood.userData.lookRole = "wood";
    mesh(new THREE.BoxGeometry(W, 0.16, 0.18), wood, P.whole, 0, 0, 0);
    const cone = [mat("#b9b35a", { roughness: 0.8 }), mat("#a3a04a", { roughness: 0.8 }), mat("#c7bd6b", { roughness: 0.8 }), mat("#8f8f42", { roughness: 0.85 })];
    const leaf = mat("#6f7a35", { roughness: 0.85, side: THREE.DoubleSide }), twine = mat("#8a6a42", { roughness: 0.9 });
    // bunch positions: clumps and gaps, never a rhythm
    const xs = []; let x = -W / 2 + 0.1 + r() * 0.2;
    while (xs.length < n && x < W / 2 - 0.1) { xs.push(x); x += 0.12 + r() * r() * 0.6; }
    for (const bx of xs) {
      const k = 0.6 + r() * 0.6, drop = 0.06 + r() * 0.12, g = new THREE.Group(); g.position.set(bx, -0.08, 0.08 + (r() - 0.5) * 0.04); P.whole.add(g);
      mesh(new THREE.CylinderGeometry(0.003, 0.003, drop, 4), twine, g, 0, -drop / 2, 0).castShadow = false;
      const m = Math.round(6 + r() * 8 * k);
      for (let i = 0; i < m; i++) {
        const a = r() * 6.28, rr = (0.02 + r() * 0.05) * k, y = -drop - r() * 0.16 * k;
        const c = mesh(new THREE.ConeGeometry(0.014 * (0.8 + r() * 0.5), 0.04 * (0.8 + r() * 0.5), 6), cone[(r() * 4) | 0], g, Math.cos(a) * rr, y, Math.sin(a) * rr);
        c.rotation.set(Math.PI + (r() - 0.5) * 0.8, r() * 6, (r() - 0.5) * 0.8);
      }
      for (let i = 0; i < 3 + ((r() * 3) | 0); i++) {
        const l = mesh(new THREE.PlaneGeometry(0.05 * k, 0.07 * k), leaf, g, (r() - 0.5) * 0.08 * k, -drop - r() * 0.12 * k, (r() - 0.5) * 0.06);
        l.rotation.set((r() - 0.5) * 1.2, r() * 6, (r() - 0.5) * 1.2); l.castShadow = false;
      }
    }
    return { grip: 0 };
  },

  // a raised wooden floor (the step up to the pub's back booths) the back row stands on: spec.w x spec.d, spec.h high,
  // dark boards with a lighter nosing along its front. Origin: the floor under its middle.
  pubstep(P) {
    const S = P.spec, W = S.w ?? 2.4, D = S.d ?? 0.8, H = S.h ?? 0.3;
    const wood = mat("#3f2716", { roughness: 0.75 }); wood.userData.lookRole = "wood";
    const nose = mat("#6a4527", { roughness: 0.6 }); nose.userData.lookRole = "wood";
    mesh(new THREE.BoxGeometry(W, H, D), wood, P.whole, 0, H / 2, 0);
    mesh(new THREE.BoxGeometry(W, 0.03, 0.05), nose, P.whole, 0, H - 0.015, D / 2 - 0.02);
    return { grip: H };
  },
};
