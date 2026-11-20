// Potato Desk 11 "Thermostat war": the room's two climates (storyboards/series/potato-desk/11-thermostat/DESIGN.md section 4).
// Metres; x right, y up, +z toward the camera; every size and hex colour is the DESIGN's. Deterministic: spins, tumbles and the
// flakes are pure functions of story time (the `t` the stage passes) and spec.seed; no Math.random, no clock.
// Bench: storyboards/lookdev/make-climate-bench.mjs -> climate-bench.json (wide off / on, window close, lunch window).
// Colour rule: orange #FF7A1A is heat only (the heater); ice blue is cold only (the window's sky, in props-lunch.js blindwindow).
// Lettering rule: no letters or digits on any of these.
//
//   deskfan       A fan on a stand or a floor box. Origin: the bottom centre; the airflow (front) is +z before `rot`. Colour #9FB4C6, wires #9FB4C6.
//                 spec.style "desk" (default) | "twin"
//                   "desk": 0.36 high. Cage O 0.26 x 0.10 (16 front wires, 2 rings, back spokes, hub cap) centred at y 0.23, a stem up from the base,
//                     base O 0.18 x 0.03 on the origin, one red button O 0.03 #D8452F on the base's front (z +0.045).
//                   "twin": the box 0.62 x 0.36 x 0.16 (x, y, z; y 0.02..0.38 on two feet 0.02 tall, so 0.38 in all), two rotors O 0.26 at x +-0.155, y 0.20, each in a
//                     bezel 0.03 proud of the front face (z +0.08..+0.11) with its own wire cage, and a plug socket at the back.
//                     spec.cableTo [x, y, z]: a WORLD point (the desk fan's base): a cable #2E3338 O 0.012 from the back socket, sagging along the floor, up to
//                     there (follows the prop's x, y, z and rot; none given: no cable). Rebuilt when the prop moves.
//                 param on 0..1 (a propState key: tween it; spec.on is NOT read): three blades (two rotors on the twin) spin from story time x on (about 6 turns
//                   a second at 1) and blur into a disc #DDE6EE at 35 % by about on 0.6; the cage shivers 0.002 at on 1.
//                   The spin phase is t x on, so it jumps while `on` is moving (the blades are blurred by then): tween `on` in 0.3 s or more.
//                 Grip point `button` (desk style): the red button's top, [0, 0.040, 0.045] in the prop frame (a fingertip point lands here).
//   spaceheater   0.30 x 0.34 x 0.18 (x, y, z). Origin: the bottom centre; front +z. Shell #B9BEC4 on two dark feet, y 0.02..0.34. A dark handle slot 0.12 x 0.04
//                 sunk in the top, grille opening 0.22 x 0.20 at y 0.19 with 5 bars (0.22 x 0.014) in front of a core 0.20 x 0.18, a wire guard of 7 vertical
//                 wires #8E959B, a dial O 0.036 at the front's lower right.
//                 param on 0..1: bars #3A3D42 -> #FF7A1A, core #2B2E33 -> #FFD27A, halo (soft additive #FF7A1A, 0.12 beyond the grille) to 0.55. See-through halo.
//                 Grip point `top`: the handle slot's middle, [0, 0.34, 0].
//   paperflurry   14 sheets 0.16 x 0.22 #F6F3EA with three grey bars #B5B0A4, each tumbling on its own, leaving the prop's origin (Spud's paper stack top) and
//                 crossing in 1.1 s, staggered (an even spread of phases; any share is even), looping every 1.5 s. One sheet shrinks from 0.55 as it clears the
//                 stack and to nothing in its last 10 %. spec.to dx metres along x (a number, or [dx]; default -1.44: from x -0.31 to -1.75),
//                 spec.band [y0, y1] WORLD heights (1.00, 1.80), spec.zBand [z0, z1] WORLD depth (-0.25, 0.45), spec.seed 5.
//                 param amount 0..1 (a propState key: spec.amount is its start value): the share of the 14 in the air.
//                 Keep-out, built in: a sheet is hidden while its bounding circle (0.136) is below y 1.05 at |x| < 0.45, or within 0.10 of the LCD box
//                 (x -0.17..0.17, y 1.20..1.52, on the wall z -1.30; spec.lcd [x0, x1, y0, y1], spec.wallZ) seen from the eyes at (0.17, 1.75, 8.6), (-0.25, 1.55, 8.4),
//                 (0, 1.4, 6) and (0, 1.4, 3) or straight on. So the first 0.12 s of a flight (the sheet crossing x +-0.586 over the desk) is hidden and each
//                 sheet appears at the edge of Spud's silhouette: use a camera that sees the stack from the side or accept the pop.
//                 No rot and no scale (the band is world space): place it, do not turn it. See-through for the checks (userData.steam).
import * as THREE from "three";
import { clamp } from "./util.js";
import { mat, basic, mesh, canvasTex } from "./props-trend.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const CLIMATE_GRIPS = {
  deskfan: { button: [0, 0.04, 0.045] },
  spaceheater: { top: [0, 0.34, 0] },
};

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const sm = (k) => k * k * (3 - 2 * k);
const lerp = (a, b, t) => a + (b - a) * t;
const flat = (m) => { m.userData.noOutline = true; return m; };
const decor = (o) => { o.userData.solid = false; o.castShadow = false; return o; };
// see-through for the checks and the light: no contact, no shadow, no outline
const fx = (o) => { o.traverse((c) => { c.castShadow = c.receiveShadow = false; c.userData.steam = true; c.userData.solid = false; c.frustumCulled = false; if (c.material) c.material.userData.noOutline = true; }); return o; };
// a deterministic value 0..1 from three integers
const hash = (a, b = 0, c = 0) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177) + 0x9e3779b9) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; h = Math.imul(h, 2246822519); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
const box = (w, h, d, parent, m, x = 0, y = 0, z = 0) => mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z);
// a cylinder along z (front +z)
const cylZ = (rt, rb, d, parent, m, x = 0, y = 0, z = 0, seg = 20) => { const g = new THREE.CylinderGeometry(rt, rb, d, seg); g.rotateX(Math.PI / 2); return mesh(g, m, parent, x, y, z); };
const cylY = (rt, rb, h, parent, m, x = 0, y = 0, z = 0, seg = 20) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m, parent, x, y, z);

// a thin wire from p to q (Vector3s)
const _up = new THREE.Vector3(0, 1, 0);
function wire(p, q, r) {
  const d = q.clone().sub(p), L = d.length(), g = new THREE.CylinderGeometry(r, r, L, 5, 1);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(_up, d.normalize())); g.translate((p.x + q.x) / 2, (p.y + q.y) / 2, (p.z + q.z) / 2); return g;
}
const ring = (R, r, z) => { const g = new THREE.TorusGeometry(R, r, 5, 40); g.translate(0, 0, z); return g; };
// the fan cage on the z axis: the front dome of `n` wires (apex zA at the hub, zF at the rim), two rings on it; optionally the back (spokes at zB, rim at zB)
function cageGeo(R, { n = 16, zA = 0.055, zF = 0.03, zB = -0.045, back = true, r = 0.002 } = {}) {
  const gs = [], V = (x, y, z) => new THREE.Vector3(x, y, z), zAt = (q) => zA - (zA - zF) * Math.pow(q, 1.5);
  for (let j = 0; j < n; j++) {
    const a = (j / n) * TAU, ca = Math.cos(a), sa = Math.sin(a);
    for (let k = 0; k < 4; k++) { const q0 = k / 4 * 0.86 + 0.14, q1 = (k + 1) / 4 * 0.86 + 0.14; gs.push(wire(V(ca * R * q0, sa * R * q0, zAt(q0)), V(ca * R * q1, sa * R * q1, zAt(q1)), r)); }
  }
  for (const q of [0.4, 0.7]) gs.push(ring(R * q, r * 1.1, zAt(q)));
  gs.push(ring(R, r * 1.5, zF));
  if (back) {
    gs.push(ring(R, r * 1.5, zB));
    for (let j = 0; j < 8; j++) { const a = (j / 8) * TAU + 0.2, ca = Math.cos(a), sa = Math.sin(a); gs.push(wire(V(ca * R * 0.14, sa * R * 0.14, zB), V(ca * R, sa * R, zB), r)); gs.push(wire(V(ca * R, sa * R, zB), V(ca * R, sa * R, zF), r)); }
  }
  return mergeGeometries(gs);
}
// three blades in a spinning group (z axis), a blur disc, a hub; returns { spin, set(on, ang) }
function rotor(parent, R, bladeColor) {
  const g = new THREE.Group(); parent.add(g);
  const sh = new THREE.Shape(); sh.absellipse(R * 0.52, 0, R * 0.44, 0.034, 0, TAU, false);
  const bm = mat(bladeColor, { roughness: 0.5, side: THREE.DoubleSide, transparent: true });
  const blades = [0, 1, 2].map((i) => { const b = new THREE.Group(); b.rotation.z = (i / 3) * TAU; const m = mesh(new THREE.ShapeGeometry(sh, 12), bm, b); m.rotation.x = 0.5; m.castShadow = false; g.add(b); return b; });
  const hub = cylZ(0.024, 0.024, 0.03, g, mat("#7C8DA0", { roughness: 0.5 }), 0, 0, 0.005, 14);
  const dm = flat(new THREE.MeshBasicMaterial({ color: "#dde6ee", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  const disc = fx(mesh(new THREE.CircleGeometry(R * 0.93, 36), dm, parent, 0, 0, 0.004));
  return { g, disc, set(on, ang) { const k = sm(clamp(on * 1.6)); g.rotation.z = ang; bm.opacity = 1 - 0.82 * k; dm.opacity = 0.35 * sm(clamp(on * 1.6 - 0.15)); disc.visible = dm.opacity > 0.004; } };
}

const SHELL = "#9FB4C6";

export const CLIMATE_KINDS = {
  // ------------------------------------------------------------------------------------------------ deskfan
  deskfan(P) {
    const S = P.spec, twin = S.style === "twin", shell = mat(SHELL, { roughness: 0.5 });
    const cageM = mat(SHELL, { roughness: 0.4 });
    const heads = [];   // the shivering parts: { o, x, y, z }
    let cable = null;
    if (!twin) {
      cylY(0.075, 0.09, 0.03, P.whole, shell, 0, 0.015, 0, 28);
      cylY(0.012, 0.012, 0.075, P.whole, shell, 0, 0.0675, -0.01, 10);
      box(0.05, 0.03, 0.05, P.whole, shell, 0, 0.1, -0.01);
      const btn = cylY(0.015, 0.015, 0.012, P.whole, mat("#d8452f", { roughness: 0.4 }), 0, 0.034, 0.045, 14); btn.castShadow = false;
      const head = new THREE.Group(); head.position.set(0, 0.23, 0); P.whole.add(head);
      cylZ(0.04, 0.04, 0.06, head, mat("#8296A8", { roughness: 0.5 }), 0, 0, -0.03, 16);
      const cage = mesh(cageGeo(0.13), cageM, head); cage.castShadow = false;
      cylZ(0.024, 0.026, 0.02, head, mat("#8296A8", { roughness: 0.4 }), 0, 0, 0.056, 14);
      const rot = new THREE.Group(); head.add(rot); rot.position.z = 0.0;
      const r = rotor(rot, 0.115, "#c9d4de");
      // rotor() adds the group and the disc to `rot`
      heads.push({ head, r, cage });
    } else {
      const BW = 0.62, BH = 0.36, BD = 0.16, Y0 = 0.02;
      const dark = mat("#3a3d42", { roughness: 0.7 });
      box(BW, BH, BD, P.whole, shell, 0, Y0 + BH / 2, 0);
      for (const s of [-1, 1]) box(0.1, Y0, 0.12, P.whole, dark, s * 0.22, Y0 / 2, 0);
      box(0.04, 0.03, 0.012, P.whole, dark, 0.24, 0.12, -BD / 2 - 0.006);   // the plug socket at the back
      for (const s of [-1, 1]) {
        const head = new THREE.Group(); head.position.set(s * 0.155, Y0 + 0.18, BD / 2); P.whole.add(head);
        cylZ(0.135, 0.135, 0.002, head, mat("#5c6e80", { roughness: 0.7 }), 0, 0, 0.001, 32).castShadow = false;
        const bez = mesh(new THREE.TorusGeometry(0.133, 0.006, 6, 40), mat("#8296A8", { roughness: 0.5 }), head, 0, 0, 0.03); bez.castShadow = false;
        const cage = mesh(cageGeo(0.13, { zA: 0.045, zF: 0.03, back: false }), cageM, head); cage.castShadow = false;
        const rot = new THREE.Group(); head.add(rot); rot.position.z = 0.016;
        const r = rotor(rot, 0.115, "#c9d4de");
        heads.push({ head, r, cage, side: s, z0: 0 });
      }
      if (S.cableTo) {
        const m = flat(mat("#2e3338", { roughness: 0.7 })), o = decor(mesh(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0.001, 0, 0.001, 0], 3)), m, P.whole)); o.visible = false;
        cable = { o, key: "" };
      }
    }
    const rebuildCable = (ps) => {
      const [tx, ty, tz] = S.cableTo, a = (ps.rot ?? 0) * DEG, c = Math.cos(a), s = Math.sin(a), k = ps.scale || 1;
      const dx = tx - ps.x, dy = ty - ps.y, dz = tz - ps.z;
      const ex = (dx * c - dz * s) / k, ey = dy / k, ez = (dx * s + dz * c) / k;   // world -> the prop's frame (rot about y)
      const key = [ex, ey, ez].map((v) => v.toFixed(3)).join();
      if (key === cable.key) return; cable.key = key;
      const p0 = new THREE.Vector3(0.24, 0.12, -0.092), p1 = new THREE.Vector3(0.27, 0.05, -0.17), end = new THREE.Vector3(ex, ey, ez);
      const mid = p1.clone().lerp(end, 0.45); mid.y = Math.max(0.01, Math.min(mid.y, 0.04));
      const mid2 = p1.clone().lerp(end, 0.8); mid2.y = Math.max(0.012, lerp(mid2.y, ey, 0.5) - 0.1 * Math.min(1, Math.abs(ey) / 0.5));
      const curve = new THREE.CatmullRomCurve3([p0, p1, mid, mid2, end], false, "catmullrom", 0.5);
      cable.o.geometry.dispose(); cable.o.geometry = new THREE.TubeGeometry(curve, 40, 0.006, 6, false); cable.o.visible = true;
    };
    return {
      grip: 0,
      apply(ps, t = 0) {
        const on = clamp(ps.on ?? 0), shiv = 0.002 * sm(on);
        heads.forEach((h, i) => {
          h.r.set(on, -t * on * 38 - i * 1.7);
          const j = (n) => Math.sin(t * 61 + i * 2.3 + n) * shiv;
          h.cage.position.set(j(0), j(1.7), 0); h.r.g.position.set(j(3.1) * 0.6, j(4.4) * 0.6, h.r.g.position.z);
        });
        if (cable) rebuildCable(ps);
      },
    };
  },

  // ------------------------------------------------------------------------------------------------ spaceheater
  spaceheater(P) {
    const shell = mat("#b9bec4", { roughness: 0.45 }), dark = mat("#3a3d42", { roughness: 0.7 }), W = 0.3, H = 0.34, D = 0.18, Y0 = 0.02;
    box(W, H - Y0, D, P.whole, shell, 0, Y0 + (H - Y0) / 2, 0);
    for (const s of [-1, 1]) box(0.07, Y0, 0.12, P.whole, dark, s * 0.095, Y0 / 2, 0);
    // handle slot sunk in the top
    decor(box(0.12, 0.004, 0.04, P.whole, flat(mat("#2b2e33", { roughness: 0.8 })), 0, H + 0.0005, 0));
    box(0.14, 0.006, 0.006, P.whole, mat("#9aa0a7", { roughness: 0.5 }), 0, H + 0.001, 0.026).castShadow = false;
    // the grille: recess, core, 5 bars, guard
    const GY = 0.19, GW = 0.22, GH = 0.2, zf = D / 2;
    decor(box(GW + 0.014, GH + 0.014, 0.004, P.whole, mat("#9aa0a7", { roughness: 0.5 }), 0, GY, zf + 0.001));
    const recess = flat(mat("#2b2e33", { roughness: 0.9 }));
    decor(box(GW, GH, 0.004, P.whole, recess, 0, GY, zf + 0.0025));
    const coreM = new THREE.MeshBasicMaterial({ color: "#2b2e33" }); coreM.userData.noOutline = true;
    decor(box(0.2, 0.18, 0.004, P.whole, coreM, 0, GY, zf + 0.0045));
    const barM = new THREE.MeshBasicMaterial({ color: "#3a3d42" });
    const bars = [-2, -1, 0, 1, 2].map((i) => { const b = box(GW, 0.014, 0.012, P.whole, barM, 0, GY + i * 0.045, zf + 0.012); b.castShadow = false; return b; });
    const guardM = mat("#8e959b", { roughness: 0.4 });
    for (let i = 0; i < 7; i++) decor(box(0.003, GH, 0.003, P.whole, guardM, (i / 6 - 0.5) * GW * 0.96, GY, zf + 0.022));
    for (const y of [-0.5, 0.5]) decor(box(GW, 0.004, 0.004, P.whole, guardM, 0, GY + y * GH * 0.98, zf + 0.022));
    // dial
    cylZ(0.018, 0.018, 0.016, P.whole, dark, 0.095, 0.05, zf + 0.008, 16).castShadow = false;
    decor(box(0.004, 0.014, 0.004, P.whole, mat("#d9dde0", { roughness: 0.5 }), 0.095, 0.058, zf + 0.017));
    // halo: soft additive, 0.12 beyond the grille
    const HW = GW + 0.24, HH = GH + 0.24;
    const tx = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.5, "rgba(255,255,255,0.55)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const haloM = new THREE.MeshBasicMaterial({ map: tx, color: "#ff7a1a", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const halo = fx(mesh(new THREE.PlaneGeometry(HW * 1.15, HH * 1.15), haloM, P.whole, 0, GY, zf + 0.03));
    halo.renderOrder = 3;
    const cOff = new THREE.Color("#3a3d42"), cOn = new THREE.Color("#ff7a1a"), kOff = new THREE.Color("#2b2e33"), kOn = new THREE.Color("#ffd27a");
    return {
      grip: 0,
      apply(ps) {
        const on = clamp(ps.on ?? 0), e = sm(on);
        barM.color.copy(cOff).lerp(cOn, e); coreM.color.copy(kOff).lerp(kOn, e);
        haloM.opacity = 0.55 * e; halo.visible = e > 0.004;
      },
    };
  },

  // ------------------------------------------------------------------------------------------------ paperflurry
  paperflurry(P) {
    const S = P.spec, N = 14, seed = S.seed ?? 5, SW = 0.16, SH = 0.22, RHO = Math.hypot(SW, SH) / 2;
    const dx = Array.isArray(S.to) ? S.to[0] : (S.to ?? -1.44), [b0, b1] = S.band ?? [1.0, 1.8], [z0, z1] = S.zBand ?? [-0.25, 0.45];
    const [lx0, lx1, ly0, ly1] = S.lcd ?? [-0.17, 0.17, 1.2, 1.52], wallZ = S.wallZ ?? -1.3, FLY = 1.1, PERIOD = 1.5;
    const EYES = [[0.17, 1.75, 8.6], [-0.25, 1.55, 8.4], [0, 1.4, 6], [0, 1.4, 3]];
    const tx = canvasTex(128, 176, (g, w, h) => {
      g.fillStyle = "#f6f3ea"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#b5b0a4"; for (const [y, l] of [[34, 0.72], [62, 0.86], [90, 0.56]]) g.fillRect(w * 0.14, y, w * 0.72 * l, 8);
      g.strokeStyle = "rgba(160,154,140,0.5)"; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
    });
    const sm0 = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.9, side: THREE.DoubleSide }); sm0.userData.noOutline = true;
    const geo = new THREE.PlaneGeometry(SW, SH);
    const sheets = Array.from({ length: N }, (_, i) => { const o = mesh(geo, sm0, P.whole); o.rotation.order = "YXZ"; o.visible = false; return { o, off: (i * 0.6180339887 + 0.07 + 0.03 * hash(seed, i, 1)) % 1 }; });
    fx(P.whole);
    const keep = (x, y, z) => {   // true if a sheet at the world point (x, y, z) must be hidden
      if (y - RHO < 1.05 && Math.abs(x) - RHO < 0.45) return true;
      const hit = (px, py, r) => px > lx0 - 0.1 - r && px < lx1 + 0.1 + r && py > ly0 - 0.1 - r && py < ly1 + 0.1 + r;
      if (hit(x, y, RHO)) return true;
      for (const [ex, ey, ez] of EYES) { const k = (ez - wallZ) / (ez - z); if (k > 0 && hit(ex + (x - ex) * k, ey + (y - ey) * k, RHO * k)) return true; }
      return false;
    };
    return {
      grip: 0,
      apply(ps, t = 0) {
        const amount = clamp(ps.amount ?? 0), [ox, oy, oz] = [ps.x, ps.y, ps.z];
        sheets.forEach((s, i) => {
          const share = sm(clamp(amount * N - i));
          const c = t / PERIOD + s.off, cyc = Math.floor(c), p = (c - cyc) * PERIOD / FLY;
          if (share <= 0 || p >= 1 || p < 0) { s.o.visible = false; return; }
          const ty = lerp(b0 + 0.09, b1 - 0.09, hash(seed + 1, i, cyc)), tz = lerp(z0 + 0.06, z1 - 0.06, hash(seed + 2, i, cyc)), ph = hash(seed + 3, i, cyc) * TAU, f = 1.4 + 1.6 * hash(seed + 4, i, cyc);
          const rise = 1 - Math.pow(1 - clamp(p / 0.55), 2), fl = Math.sin(TAU * f * p + ph) * Math.sin(Math.PI * p);
          const x = ox + dx * (1 - Math.pow(1 - p, 1.8));
          const y = lerp(oy + 0.03, ty, rise) + 0.07 * fl, z = lerp(oz, tz, sm(clamp(p / 0.5))) + 0.05 * Math.sin(TAU * f * 0.7 * p + ph * 2);
          const sc = (0.55 + 0.45 * sm(clamp((p - 0.08) / 0.17))) * (1 - sm(clamp((p - 0.9) / 0.1))) * share;
          if (sc <= 0.001 || keep(x, y, z)) { s.o.visible = false; return; }
          const tau = p * FLY, q = sm(clamp(p / 0.25));
          s.o.visible = true; s.o.position.set(x - ox, y - oy, z - oz); s.o.scale.setScalar(sc);
          s.o.rotation.set(-Math.PI / 2 * (1 - q) + q * (hash(seed + 5, i, cyc) * 2 - 1) * 1.3 + q * 4.5 * tau * (hash(seed + 6, i, cyc) - 0.5) * 2,
            ph + 3.5 * tau * (hash(seed + 7, i, cyc) - 0.3), q * (0.8 * Math.sin(TAU * f * p + ph * 3) + 3 * tau * (hash(seed + 8, i, cyc) - 0.5)));
        });
      },
    };
  },
};
