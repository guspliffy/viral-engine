import * as THREE from "three";
import { clamp, rng } from "./util.js";
import { mat, basic, mesh, canvasTex } from "./props-trend.js";

// "That one friend who never has money… at dinner" (never has money, episode 1, 6 Nov 2026): a sunny 1950s diner
// counter and what lies on it. Jonny's eight panels: a chrome-edged counter with a pale top, red stools, a salad, an
// empty plate with the tower burger's pick, a tall glass with three striped straws, red-checked fry baskets, a dark
// tray, a big four-hole button, a glass tip jar, a desk card terminal, a paper soda-jerk hat. The moth is props-mott.js
// with a palette; the wallet is here.
//   dinercounter  a counter along x (spec.w, spec.d, spec.h): a pale speckled top with a chrome edge band all round, a
//                 red front panel with chrome trim and a foot rail on the customers' side (-z), steel cabinet doors on the
//                 server's side (+z). Origin: the floor under its middle. Grip: its top (h).
//   milkshake     a tall flared soda glass, a pink rim of milkshake left at the bottom, three striped straws (h 0.21).
//   frybasket     a red oval wire basket lined with red-and-white checked paper; spec.n fries left in it (0: crumbs).
//   fry           one golden fry (len 0.1), standing on its end at the origin; the thin hold pinches it.
//   saladbowl     a white bowl of green salad with tomato and cucumber.
//   burgerpick    the tower burger's long wooden pick with a little red frill, standing in the crumbs (on a plate).
//   button        a big four-hole button (r spec.r 0.032), standing on its edge, its face toward +z (held up in a pinch);
//                 `flat` 0..1 lays it on its back.
//   tipjar        a small glass jar with a paper potato label and a few coins inside (r 0.06, h 0.14).
//   cardterminal  a desk card terminal: a dark base and a tilted screen with the contactless waves (screen toward +z);
//                 `paid` 0..1 turns the screen green with a tick.
//   paycard       a black bank card with a little potato emblem (0.054 x 0.086), standing up, its face toward +z.
//   wallet        a worn brown leather bifold (closed 0.12 x 0.095 x 0.022, open 0.24 wide). Origin: the spine; the back
//                 half lies on -x, closed the front half lies over it; `open` 0..1 swings the front half over the +z side
//                 onto +x (both insides face +z when open: the empty card pockets show); `puff` 0..1 a puff of dust.
//   paperhat      a white paper soda-jerk cap with a red stripe (worn: spec.wear, in the body's frame, on the head).
//   checkerfloor  the black-and-white checker floor: a thin tiled sheet on the ground (spec.w, spec.d, spec.tile).
//   pendant       a copper dome lamp hanging on a cord (spec.len, spec.r), its warm bulb lit; not solid (over the heads).
//   condiments    a ketchup and a mustard squeeze bottle and a steel napkin holder (counter dressing).
export const DINER = { counter: { h: 0.44 }, shake: { h: 0.21 }, fry: { len: 0.1 }, wallet: { w: 0.12, h: 0.095, t: 0.022 } };

const steel = (o = {}) => mat("#c9ced6", { roughness: 0.25, metalness: 0.75, ...o });

export const DINER_KINDS = {
  dinercounter(P) {
    const S = P.spec, W = S.w ?? 3.2, D = S.d ?? 0.6, H = S.h ?? DINER.counter.h, T = 0.04;
    // the top: pale cream with soft grey-pink speckles (a 50s laminate)
    const topTex = canvasTex(512, 128, (g, w, h) => {
      g.fillStyle = "#f3ece0"; g.fillRect(0, 0, w, h);
      const r = rng(5); for (let i = 0; i < 900; i++) { g.fillStyle = ["rgba(170,150,150,0.35)", "rgba(200,120,120,0.25)", "rgba(120,130,150,0.25)"][i % 3]; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 1.5); }
    });
    const top = mesh(new THREE.BoxGeometry(W, T, D), mat("#ffffff", { map: topTex, roughness: 0.35 }), P.whole, 0, H - T / 2, 0);
    void top;
    // the chrome edge band round the top
    for (const s of [-1, 1]) {
      mesh(new THREE.BoxGeometry(W + 0.012, T + 0.012, 0.012), steel(), P.whole, 0, H - T / 2, s * (D / 2 + 0.006));
      mesh(new THREE.BoxGeometry(0.012, T + 0.012, D + 0.024), steel(), P.whole, s * (W / 2 + 0.006), H - T / 2, 0);
    }
    // the customers' side (-z): a red panel with two chrome trims and a foot rail
    const body = H - T, red = mat("#b8322e", { roughness: 0.55 });
    mesh(new THREE.BoxGeometry(W - 0.04, body, 0.04), red, P.whole, 0, body / 2, -D / 2 + 0.08);
    for (const y of [body * 0.35, body * 0.8]) mesh(new THREE.BoxGeometry(W - 0.03, 0.014, 0.012), steel(), P.whole, 0, y, -D / 2 + 0.055);
    const rail = mesh(new THREE.CylinderGeometry(0.012, 0.012, W - 0.1, 12), steel(), P.whole, 0, 0.09, -D / 2 - 0.02); rail.rotation.z = Math.PI / 2;
    // the server's side (+z): brushed steel cabinet doors with handles, a dark kick plate
    const doors = Math.max(2, Math.round(W / 0.5)), dw = (W - 0.04) / doors;
    for (let i = 0; i < doors; i++) {
      const x = -W / 2 + 0.02 + dw * (i + 0.5);
      mesh(new THREE.BoxGeometry(dw - 0.012, body - 0.08, 0.02), steel({ roughness: 0.4, metalness: 0.6 }), P.whole, x, 0.06 + (body - 0.08) / 2, D / 2 - 0.06);
      mesh(new THREE.BoxGeometry(0.08, 0.012, 0.016), steel({ roughness: 0.2 }), P.whole, x, body - 0.06, D / 2 - 0.042);
    }
    mesh(new THREE.BoxGeometry(W - 0.04, 0.06, 0.02), mat("#2b2a2e", { roughness: 0.8 }), P.whole, 0, 0.03, D / 2 - 0.07);
    return { grip: H };
  },

  milkshake(P) {
    const h = DINER.shake.h;
    const glass = new THREE.MeshPhysicalMaterial({ color: "#eef9ff", roughness: 0.05, transparent: true, opacity: 0.3, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide });
    glass.userData.glass = true;
    // a soda glass: a round foot, a short stem, a bowl that flares out to the rim
    const prof = [[0.001, 0], [0.04, 0], [0.042, 0.006], [0.012, 0.014], [0.011, 0.04], [0.028, 0.06], [0.036, 0.12], [0.045, h], [0.042, h], [0.032, 0.12], [0.024, 0.065], [0.001, 0.058]].map(([x, y]) => new THREE.Vector2(x, y));
    const g = mesh(new THREE.LatheGeometry(prof, 32), glass, P.whole); g.castShadow = false; g.renderOrder = 3;
    const rim = mesh(new THREE.TorusGeometry(0.0435, 0.0018, 6, 32), mat("#ffffff", { roughness: 0.2 }), P.whole, 0, h, 0); rim.rotation.x = Math.PI / 2; rim.castShadow = false;
    // the last of the milkshake: a pink pool in the bottom and a few streaks up the side
    const pink = mat("#f3b6c4", { roughness: 0.5 });
    mesh(new THREE.CylinderGeometry(0.026, 0.022, 0.02, 24), pink, P.whole, 0, 0.069, 0).castShadow = false;
    for (let i = 0; i < 5; i++) { const a = i * 1.3 + 0.4, s = mesh(new THREE.CapsuleGeometry(0.003, 0.03 + 0.02 * (i % 2), 3, 6), pink, P.whole, Math.cos(a) * 0.029, 0.095, Math.sin(a) * 0.029); s.castShadow = false; }
    // three striped straws leaning out of it
    const stripes = (c) => { const t = canvasTex(16, 128, (x, w, hh) => { x.fillStyle = "#ffffff"; x.fillRect(0, 0, w, hh); x.fillStyle = c; for (let i = 0; i < 8; i++) { x.save(); x.translate(0, i * 16); x.transform(1, 0.5, 0, 1, 0, 0); x.fillRect(-8, 0, w + 16, 7); x.restore(); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return mat("#ffffff", { map: t, roughness: 0.5 }); };
    [["#d6342e", -0.012, 0.01, 0.18, -0.12], ["#3a7bd5", 0.013, -0.004, -0.2, -0.05], ["#f08a24", 0.0, -0.014, 0.05, 0.2]].forEach(([c, x, z, rz, rx]) => {
      const s = mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.26, 10), stripes(c), P.whole, x, 0.07 + 0.13, z); s.rotation.set(rx, 0, rz); s.castShadow = false;
    });
    return { grip: 0.12 };
  },

  frybasket(P) {
    const S = P.spec, n = S.n ?? 0, r = rng(S.seed ?? 3);
    const red = mat("#c8302c", { roughness: 0.5 });
    const g = new THREE.Group(); g.scale.set(1.35, 1, 1); P.whole.add(g);   // oval
    // the wire basket: a floor ring, a rim ring and slanted wires between them
    const ring = (rad, y, t = 0.0035) => { const o = mesh(new THREE.TorusGeometry(rad, t, 6, 32), red, g, 0, y, 0); o.rotation.x = Math.PI / 2; return o; };
    ring(0.05, 0.004); ring(0.068, 0.055, 0.004); ring(0.06, 0.03, 0.0025);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, w = mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.056, 4), red, g, Math.cos(a) * 0.059, 0.029, Math.sin(a) * 0.059); w.rotation.set(Math.sin(a) * 0.32, 0, -Math.cos(a) * 0.32); }
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.004, 24), red, g, 0, 0.004, 0);
    // the checked paper: a liner that rises in the middle and folds over the rim in four soft points
    const check = canvasTex(128, 128, (x, w, h) => { x.fillStyle = "#ffffff"; x.fillRect(0, 0, w, h); x.fillStyle = "rgba(214,52,46,0.85)"; const k = w / 8; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2 === 0) x.fillRect(i * k, j * k, k, k); x.fillStyle = "rgba(214,52,46,0.4)"; for (let i = 0; i < 8; i++) { x.fillRect(i * k, 0, k, h); } });
    const paperM = mat("#ffffff", { map: check, roughness: 0.85, side: THREE.DoubleSide }); paperM.userData.noHatch = true;
    const geo = new THREE.CylinderGeometry(0.075, 0.048, 0.06, 24, 3, true), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)), top = p.getY(i) > 0.02; if (top) p.setY(i, p.getY(i) + 0.022 * Math.max(0, Math.cos(a * 4)) + 0.004 * Math.sin(a * 9)); }
    geo.computeVertexNormals();
    mesh(geo, paperM, g, 0, 0.033, 0).castShadow = false;
    mesh(new THREE.CircleGeometry(0.048, 24), paperM, g, 0, 0.007, 0).rotation.x = -Math.PI / 2;
    // fries lying in it (or only crumbs)
    const fryM = mat("#f2c14e", { roughness: 0.6 }); fryM.userData.noHatch = true;
    for (let i = 0; i < n; i++) { const f = mesh(new THREE.BoxGeometry(0.011, 0.011, 0.09), fryM, g, (r() - 0.5) * 0.04, 0.02 + i * 0.008, (r() - 0.5) * 0.03); f.rotation.set(r() * 0.4, r() * 3, r() * 0.3); }
    for (let i = 0; i < 9; i++) { const c = mesh(new THREE.BoxGeometry(0.006, 0.004, 0.006), fryM, g, (r() - 0.5) * 0.07, 0.01, (r() - 0.5) * 0.05); c.rotation.y = r() * 3; c.castShadow = false; }
    return { grip: 0.03 };
  },

  fry(P) {
    const L = DINER.fry.len, fryM = mat("#f2c14e", { roughness: 0.6 }); fryM.userData.noHatch = true;
    const f = mesh(new THREE.BoxGeometry(0.012, L, 0.012), fryM, P.whole, 0, L / 2, 0); f.rotation.y = 0.3;
    mesh(new THREE.BoxGeometry(0.0125, 0.012, 0.0125), mat("#c98e2c", { roughness: 0.7 }), P.whole, 0, L - 0.005, 0).rotation.y = 0.3;   // a crispy brown tip
    return { grip: L * 0.6, apply(ps) { const b = clamp(ps.bite ?? 0); f.scale.y = 1 - 0.55 * b; f.position.y = (L * f.scale.y) / 2; P.whole.children[1].visible = b < 0.05; } };
  },

  saladbowl(P) {
    const white = mat("#f6f4ef", { roughness: 0.35 });
    const prof = [[0.001, 0], [0.04, 0], [0.042, 0.006], [0.07, 0.045], [0.075, 0.05], [0.07, 0.05], [0.04, 0.012], [0.001, 0.012]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh(new THREE.LatheGeometry(prof, 32), white, P.whole);
    const r = rng(P.spec.seed ?? 9), greens = ["#6fbf3f", "#4f9a2e", "#8fd05a"];
    for (let i = 0; i < 16; i++) { const a = r() * 6.28, d = r() * 0.05, l = mesh(new THREE.SphereGeometry(0.022, 8, 6), mat(greens[i % 3], { roughness: 0.8 }), P.whole, Math.cos(a) * d, 0.04 + r() * 0.015, Math.sin(a) * d); l.scale.set(1, 0.35, 0.8); l.rotation.set(r(), r() * 3, r()); }
    for (let i = 0; i < 4; i++) { const a = r() * 6.28, d = r() * 0.04; mesh(new THREE.SphereGeometry(0.011, 10, 8), mat("#e0412e", { roughness: 0.4 }), P.whole, Math.cos(a) * d, 0.056, Math.sin(a) * d); }
    for (let i = 0; i < 3; i++) { const a = r() * 6.28, d = r() * 0.04, c = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.004, 12), mat("#cfe8a0", { roughness: 0.6 }), P.whole, Math.cos(a) * d, 0.057, Math.sin(a) * d); c.rotation.x = 0.3; }
    return { grip: 0.03 };
  },

  burgerpick(P) {
    const wood = mat("#d9b27a", { roughness: 0.7 });
    mesh(new THREE.CylinderGeometry(0.0025, 0.0015, 0.17, 6), wood, P.whole, 0, 0.085, 0);
    const frill = mesh(new THREE.CylinderGeometry(0.009, 0.006, 0.02, 10), mat("#d6342e", { roughness: 0.6 }), P.whole, 0, 0.165, 0); frill.castShadow = false;
    return { grip: 0.1 };
  },

  button(P) {
    const R = P.spec.r ?? 0.032, T = 0.008;
    const g = new THREE.Group(); P.whole.add(g); g.position.y = R;   // standing on its edge, its middle R up
    const brown = mat(P.spec.color ?? "#a8703a", { roughness: 0.45 }), dark = mat("#5a3518", { roughness: 0.6 });
    const prof = [[0.001, -T / 2], [R * 0.92, -T / 2], [R, -T * 0.2], [R, T * 0.2], [R * 0.92, T / 2], [R * 0.78, T / 2], [R * 0.72, T * 0.15], [0.001, T * 0.15]].map(([x, y]) => new THREE.Vector2(x, y));
    const b = mesh(new THREE.LatheGeometry(prof, 36), brown, g); b.rotation.x = Math.PI / 2;
    const b2 = mesh(new THREE.LatheGeometry(prof, 36), brown, g); b2.rotation.x = -Math.PI / 2;
    for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const h = mesh(new THREE.CylinderGeometry(R * 0.11, R * 0.11, T * 1.05, 10), dark, g, x * R * 0.22, y * R * 0.22, 0); h.rotation.x = Math.PI / 2; h.castShadow = false; }
    return { grip: R, apply(ps) { const f = clamp(ps.flat ?? 0); g.rotation.x = -f * Math.PI / 2; g.position.y = R * (1 - f) + T / 2 * f; } };
  },

  tipjar(P) {
    const R = 0.06, H = 0.14;
    const glass = new THREE.MeshPhysicalMaterial({ color: "#e6f4ee", roughness: 0.06, transparent: true, opacity: 0.32, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide });
    glass.userData.glass = true;
    const body = mesh(new THREE.CylinderGeometry(R, R, H, 32, 1, true), glass, P.whole, 0, H / 2, 0); body.castShadow = false; body.renderOrder = 3;
    mesh(new THREE.CylinderGeometry(R, R, 0.008, 32), glass, P.whole, 0, 0.004, 0).castShadow = false;
    const lip = mesh(new THREE.TorusGeometry(R * 0.97, 0.004, 6, 32), mat("#f2f6f4", { roughness: 0.2 }), P.whole, 0, H, 0); lip.rotation.x = Math.PI / 2; lip.castShadow = false;
    // the paper label with a potato on it
    const label = canvasTex(128, 96, (g, w, h) => { g.fillStyle = "#f4ead2"; g.fillRect(0, 0, w, h); g.strokeStyle = "#8a6a44"; g.lineWidth = 3; g.strokeRect(4, 4, w - 8, h - 8); g.fillStyle = "#e3a24a"; g.beginPath(); g.ellipse(w / 2, h / 2 + 6, 22, 28, 0.2, 0, Math.PI * 2); g.fill(); g.fillStyle = "#5a3a1a"; for (const [x, y] of [[-6, 0], [5, 10], [-2, 18]]) { g.beginPath(); g.arc(w / 2 + x, h / 2 + y, 2, 0, 6.3); g.fill(); } g.fillStyle = "#6cbf3a"; g.beginPath(); g.ellipse(w / 2 + 4, h / 2 - 26, 10, 5, -0.5, 0, 6.3); g.fill(); });
    const lb = mesh(new THREE.CylinderGeometry(R * 1.005, R * 1.005, 0.07, 32, 1, true, -0.7, 1.4), mat("#ffffff", { map: label, roughness: 0.85, side: THREE.DoubleSide }), P.whole, 0, 0.07, 0); lb.castShadow = false;
    // a few coins and a note lying in the bottom
    const r = rng(7), gold = mat("#d8b04a", { roughness: 0.35, metalness: 0.6 }), silver = steel();
    for (let i = 0; i < 7; i++) { const c = mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.003, 14), i % 3 ? gold : silver, P.whole, (r() - 0.5) * 0.07, 0.01 + i * 0.0035, (r() - 0.5) * 0.07); c.rotation.set(r() * 0.5, 0, r() * 0.5); c.castShadow = false; }
    return { grip: H / 2 };
  },

  cardterminal(P) {
    const dark = mat("#2b2d33", { roughness: 0.45 });
    mesh(new THREE.BoxGeometry(0.1, 0.03, 0.12), dark, P.whole, 0, 0.015, 0);
    const head = new THREE.Group(); head.position.set(0, 0.03, -0.02); head.rotation.x = -0.55; P.whole.add(head);
    mesh(new THREE.BoxGeometry(0.1, 0.11, 0.022), dark, head, 0, 0.055, 0);
    const mk = (paid) => canvasTex(128, 96, (g, w, h) => {
      g.fillStyle = paid ? "#5cc98a" : "#3d63d9"; g.fillRect(0, 0, w, h);
      g.strokeStyle = "#ffffff"; g.lineWidth = 6; g.lineCap = "round";
      if (paid) { g.beginPath(); g.moveTo(w * 0.3, h * 0.52); g.lineTo(w * 0.45, h * 0.7); g.lineTo(w * 0.72, h * 0.3); g.stroke(); }
      else for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(w * 0.38, h / 2, 14 + i * 12, -0.7, 0.7); g.stroke(); }
    });
    const scrM = new THREE.MeshBasicMaterial({ map: mk(false) }), paidM = new THREE.MeshBasicMaterial({ map: mk(true) });
    scrM.userData.noOutline = paidM.userData.noOutline = true;
    const scr = mesh(new THREE.PlaneGeometry(0.082, 0.062), scrM, head, 0, 0.065, 0.0115); scr.castShadow = false;
    return { grip: 0.06, apply(ps) { scr.material = clamp(ps.paid ?? 0) > 0.5 ? paidM : scrM; } };
  },

  paycard(P) {
    const tex = canvasTex(86, 128, (g, w, h) => { g.fillStyle = "#1d1c22"; g.fillRect(0, 0, w, h); g.fillStyle = "#d8b04a"; g.fillRect(10, 18, 18, 14); g.fillStyle = "#e3a24a"; g.beginPath(); g.ellipse(w * 0.62, h * 0.66, 13, 16, 0.2, 0, 6.3); g.fill(); g.fillStyle = "#6cbf3a"; g.beginPath(); g.ellipse(w * 0.66, h * 0.5, 6, 3, -0.5, 0, 6.3); g.fill(); });
    const m = mat("#ffffff", { map: tex, roughness: 0.4 });
    mesh(new THREE.BoxGeometry(0.054, 0.086, 0.003), [mat("#1d1c22"), mat("#1d1c22"), mat("#1d1c22"), mat("#1d1c22"), m, mat("#1d1c22")], P.whole, 0, 0.043, 0);
    return { grip: 0.043 };
  },

  wallet(P) {
    const { w, h, t } = DINER.wallet, half = w;   // w: one half (the closed wallet); open it is 2w wide
    const leather = mat("#7a4a26", { roughness: 0.75 }), inner = mat("#9a6236", { roughness: 0.8 }), edge = mat("#4e2c14", { roughness: 0.8 }), stitch = mat("#e0c28a", { roughness: 0.7 });
    // two halves hinged at the spine (x = 0 in the hinge group); closed, the front half lies over the back one
    const back = new THREE.Group(), front = new THREE.Group(); P.whole.add(back); P.whole.add(front);
    for (const [grp, sd] of [[back, 1], [front, 1]]) {
      const slab = new THREE.Group(); grp.add(slab);
      mesh(new THREE.BoxGeometry(half, h, t / 2), leather, slab, sd * half / 2, 0, 0);
      // the inside: two card pockets (empty) and a stitched edge
      mesh(new THREE.BoxGeometry(half * 0.86, h * 0.36, 0.003), inner, slab, half / 2, h * 0.16, t / 4 + 0.0015);
      mesh(new THREE.BoxGeometry(half * 0.86, h * 0.36, 0.003), inner, slab, half / 2, -h * 0.2, t / 4 + 0.0015);
      for (const y of [h / 2 - 0.006, -h / 2 + 0.006]) mesh(new THREE.BoxGeometry(half * 0.92, 0.0015, 0.002), stitch, slab, half / 2, y, t / 4 + 0.002);
      mesh(new THREE.BoxGeometry(0.004, h, t / 2 + 0.002), edge, slab, half - 0.002, 0, 0);
    }
    // the spine at x = 0: the back half lies on -x, the front half on +x (both inner faces to +z when open)
    back.children[0].scale.x = -1;
    const dust = []; const dm = basic({ color: "#d9cbb0", transparent: true, opacity: 0.8, depthWrite: false });
    for (let i = 0; i < 14; i++) { const o = mesh(new THREE.SphereGeometry(0.008 + 0.008 * ((i * 37) % 10) / 10, 8, 6), dm, P.whole); o.castShadow = false; o.renderOrder = 4; dust.push({ o, a: i * 2.4, e: 0.3 + ((i * 53) % 10) / 14 }); }
    return {
      grip: 0,
      apply(ps) {
        // open 1: flat, the back half on -x, the front on +x, both insides to +z; open 0: the front half swung over
        // about the spine onto the back one (leather out), stacked half a thickness apart
        const o = clamp(ps.open ?? 0);
        front.rotation.y = -(1 - o) * Math.PI * 0.985; front.position.z = (t / 2) * (1 - o);   // it swings over the +z side
        const p = clamp(ps.puff ?? 0);
        for (const d of dust) { d.o.visible = p > 0.01 && p < 0.99; const r = 0.12 * Math.sqrt(p); d.o.position.set(Math.cos(d.a) * r * 0.8, d.e * r + 0.02, 0.03 + Math.abs(Math.sin(d.a)) * r * 0.6); d.o.scale.setScalar(0.6 + p); }
        dm.opacity = 0.8 * (1 - p);
      },
    };
  },

  paperhat(P) {
    const white = mat("#fbfaf6", { roughness: 0.8, side: THREE.DoubleSide }), red = mat("#c8302c", { roughness: 0.7, side: THREE.DoubleSide });
    // a folded paper garrison cap: a band round the head and a ridge on top, a red stripe along it
    const band = mesh(new THREE.CylinderGeometry(0.2, 0.215, 0.1, 32, 1, true), white, P.whole, 0, 0.05, 0); band.scale.z = 0.88;
    const ridge = new THREE.Shape(); ridge.moveTo(-0.2, 0); ridge.quadraticCurveTo(-0.16, 0.07, 0, 0.075); ridge.quadraticCurveTo(0.16, 0.07, 0.2, 0); ridge.lineTo(-0.2, 0);
    for (const s of [-1, 1]) { const r = mesh(new THREE.ShapeGeometry(ridge, 12), white, P.whole, 0, 0.1, s * 0.03); r.rotation.x = s * 0.18; }
    const st = mesh(new THREE.CylinderGeometry(0.212, 0.212, 0.018, 32, 1, true), red, P.whole, 0, 0.075, 0); st.scale.z = 0.88;
    return { grip: 0 };
  },

  // the diner's black-and-white checker floor (the panels): a thin tiled sheet on the ground, spec.w x spec.d, tiles
  // spec.tile across, slightly worn
  checkerfloor(P) {
    const S = P.spec, W = S.w ?? 7, D = S.d ?? 5, k = S.tile ?? 0.3;
    const tex = canvasTex(256, 256, (g, w, h) => {
      const n = 4, q = w / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? "#2a2626" : "#efe9dd"; g.fillRect(i * q, j * q, q, q); }
      g.strokeStyle = "rgba(120,110,100,0.35)"; g.lineWidth = 2; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * q, 0); g.lineTo(i * q, h); g.stroke(); g.beginPath(); g.moveTo(0, i * q); g.lineTo(w, i * q); g.stroke(); }
    });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(W / (4 * k), D / (4 * k));
    const m = mat("#ffffff", { map: tex, roughness: 0.55 }); m.userData.noHatch = true;
    const o = mesh(new THREE.BoxGeometry(W, 0.004, D), m, P.whole, 0, 0.002, 0); o.castShadow = false;
    o.userData.solid = false;   // the ground itself: feet stand on it, the contact checks leave it out
    return { grip: 0.004 };
  },

  pendant(P) {
    // a copper dome lamp on a cord: the shade's rim at the origin, the cord spec.len up to the ceiling; a warm bulb
    // glowing under it. Hung over everyone's heads, so the contact checks leave it out.
    const S = P.spec, L = S.len ?? 0.8, R = S.r ?? 0.17;
    const copper = mat("#b8673a", { roughness: 0.35, metalness: 0.6 }), dark = mat("#3a2a22", { roughness: 0.6 });
    const shade = mesh(new THREE.SphereGeometry(R, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), copper, P.whole, 0, 0, 0);
    shade.material.side = THREE.DoubleSide;
    mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.05, 12), copper, P.whole, 0, R + 0.02, 0);
    mesh(new THREE.CylinderGeometry(0.004, 0.004, L, 6), dark, P.whole, 0, R + 0.04 + L / 2, 0);
    const bulbM = new THREE.MeshBasicMaterial({ color: "#ffd98a" }); bulbM.userData.noHatch = true;
    mesh(new THREE.SphereGeometry(R * 0.32, 14, 10), bulbM, P.whole, 0, R * 0.25, 0);
    P.whole.traverse((o) => { if (o.isMesh) { o.userData.solid = false; o.castShadow = false; } });
    return { grip: R };
  },

  condiments(P) {
    const red = mat("#d33a2c", { roughness: 0.35 }), yel = mat("#f2c230", { roughness: 0.35 }), cap = mat("#f4f1ea", { roughness: 0.5 });
    for (const [x, m] of [[-0.05, red], [0.01, yel]]) {
      mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.13, 16), m, P.whole, x, 0.065, 0);
      mesh(new THREE.ConeGeometry(0.018, 0.04, 14), cap, P.whole, x, 0.15, 0);
      mesh(new THREE.CylinderGeometry(0.002, 0.004, 0.03, 6), cap, P.whole, x, 0.18, 0);
    }
    // a steel napkin holder with napkins
    mesh(new THREE.BoxGeometry(0.08, 0.09, 0.05), steel(), P.whole, 0.09, 0.045, 0);
    mesh(new THREE.BoxGeometry(0.07, 0.03, 0.04), mat("#ffffff", { roughness: 0.9 }), P.whole, 0.09, 0.1, 0);
    return { grip: 0.07 };
  },
};
