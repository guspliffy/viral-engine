import * as THREE from "three";
import { clamp, rng } from "./util.js";
import { mat, mesh } from "./props-trend.js";

// Kid vs Dad 05 "Carrots" (design: storyboards/series/kid-vs-dad/05-carrots/DESIGN.md section 2). Metres before spec.scale. No letters or digits
// on any prop. Deterministic: fixed tables and a seeded rng, every animation a pure function of the prop's keys, no material opacity tweened.
//
// THE STICK (all four carrot kinds): a baton 0.11 long along its own x, section 0.022 (z) x 0.020 (y) at the thick end (-x) to 0.016 x 0.014 at the
// thin end, corners r 0.004, `#f2801f`, shade side (its underside) `#d9651a`, 3 pale length lines `#f7a54a` 0.003 wide on its top face, cut ends `#f59a3c`.
//
//   carrotstick  ONE stick, HELD (panel 04). Origin its middle, along x (thick end -x, thin end +x). Keys:
//     eaten 0..1   spec.eaten, default 0. The thin end shortens toward the grip: length x (1 - 0.65 eaten), cut square (a new cut end); at 1 it hides.
//                  Not a propState key: prime it once, c.prop(0, id, { eaten: 0 }, 0), then tween it (0 to 0.5 on the frame the tip is in his mouth).
//     up: true     spec.up, default false. Stands the stick on the thin hold's axis: origin its THICK end (it stands on it like any bottom-centre prop), the
//                  thin end up +y, 0.11 tall. USE THIS for the hold: grips.thin(c, who, spec, { from: 0.28 }) with SIZE carrotstick { len 0.11,
//                  r 0.009 } pinches it at y 0.031 (the design's 0.035 from the thick end; 0.32 fails the gate's thin-prop-hidden: the thick end hides in the glove), the thin 0.08 above the fist (len is the true length: the
//                  gate's thin-prop-hidden check measures both ends from it). Then tip / tilt / rot point it (tip leans its thin end toward +z, tilt
//                  toward +x): at his mouth from his side, tilt about 80 (to the side he holds it) with tip 0 reads best (panel 04).
//                  Without `up` it lies along x as the design says, origin its middle (nothing grips it).
//   carrotpile   14 sticks lying criss-cross in 3 layers (6 / 5 / 3), footprint r 0.12, 0.055 high, origin bottom centre: it sits on the `plate` at
//                  y 0.319 (the plate's top 0.30 + 0.019). Keys: n 0..14, spec.n, default 14, draws the first n of the fixed table (the 14th is the
//                  top one: n 13 = the held stick gone). A prop action may set n (a cut, it does not tween). The plate and the pile slide with the
//                  same x tween (their own x keys).
//   carrotbowl   white bowl `#f4f1ea` (inside `#d9d6cc`), rim r 0.16, foot r 0.07, 0.12 tall, wall 0.008, origin bottom centre; 30 sticks: 18 standing
//                  and leaning out 15..35 degrees round the rim, 12 lying as a mound; heap top y 0.19. Key fill 1..0 (spec.fill, default 1, tweens):
//                  hides sticks from the highest down (fill 0.6 = the top 12 gone, fill 0 = an empty bowl). Never taller than 0.19 above its base.
//   carrotbag    brown paper bag `#b98a5a` (sides `#94693f`, rolled top `#d2a877`), 0.22 wide x 0.30 tall x 0.14 deep, origin bottom centre, front +z,
//                  blank; a rolled open top 0.02 thick, 8 crease lines, 2 dented top corners, 9 stick tips 0.03 to 0.06 out of the top. Keys: fill 1..0
//                  (spec.fill, default 1, tweens: the tips sink and hide one by one, tip 0 first), crush 0..1 (spec.crush, default 0, PRIME it
//                  like eaten): the height x (1 - 0.35 crush), the sides bulge 0.015 (the last squeeze).
//     HELD         box hold, both palms on its two sides (grips.box, SIZE carrotbag { w 0.22, h 0.30, d 0.14 }): pass { height: 0.4 } for the design's palms at
//                  y 0.12 (the default 0.55 = y 0.165), gap about 0.03 for the kid's gloves; tip the prop 25 to the mouth, its top at his chin.
//   crumbs       WORN on Dad's moustache: 9 specks (boxes 0.008 to 0.014 across, 0.006 deep, 5 `#d9a55c`, 4 `#8a5a2e`) on its front face between b 0.38 and 0.47,
//                  x -0.17 to +0.15, each 0.004 proud of the hair. spec.wear "dad", x 0, y 0.63, z 0.39 = a point in his body frame (ground y 0, +z his front):
//                  the prop's origin is the skin at x 0, b 0.43 (underside 0.20 + 0.43 = 0.63; the skin there is z 0.390, computed from dad.json's body
//                  formula, and it recedes 0.016 x (x / 0.17)^3 at either side). The specks sit on the hair's own thickness (0.012 at its edge to 0.034 on
//                  its ridge, costumes-dad.js `thick`) and turn with the surface. Key on (0 hides, over 0.5 shows): propState keeps `on` at 0, so show
//                  it with a prop action { set: { on: 1 } } (a visibility cut, no tween).
export const CARROTS = {
  stick: { L: 0.11, thick: [0.022, 0.02], thin: [0.016, 0.014], r: 0.004, body: "#f2801f", shade: "#d9651a", line: "#f7a54a", cut: "#f59a3c", grip: 0.035 },
  crumbs: { y: 0.63, z: 0.39, proud: 0.004 },
};

const rad = (d) => (d * Math.PI) / 180;
const C3 = (hex) => new THREE.Color(hex);

// ---- one stick -----------------------------------------------------------------------------------------------------
// geometry of a stick along +x from x0 (the thick end), length 0.11 x (1 - 0.65 e), vertex colours (body on top, shade underneath, pale lines, cut ends)
function stickGeo(e = 0, x0 = -CARROTS.stick.L / 2) {
  const S = CARROTS.stick, L = S.L * (1 - 0.65 * clamp(e)), sec = (u) => [S.thick[0] + (S.thin[0] - S.thick[0]) * u, S.thick[1] + (S.thin[1] - S.thick[1]) * u];
  const ring = (u) => {   // 12 points, 4 corners of 3 (angles from +z toward +y), counter-clockwise seen from +x
    const [w, h] = sec(u), pts = [];
    [[1, 1, 0], [-1, 1, 90], [-1, -1, 180], [1, -1, 270]].forEach(([sz, sy, a0]) => {
      for (let k = 0; k < 3; k++) { const a = rad(a0 + 45 * k); pts.push([sz * (w / 2 - S.r) + S.r * Math.cos(a), sy * (h / 2 - S.r) + S.r * Math.sin(a)]); }
    });
    return pts;
  };
  const pos = [], col = [], idx = [], body = C3(S.body), shade = C3(S.shade), cut = C3(S.cut), line = C3(S.line);
  const push = (x, y, z, c) => { pos.push(x, y, z); col.push(c.r, c.g, c.b); return pos.length / 3 - 1; };
  const A = ring(0).map(([z, y]) => push(x0, y, z, y < 0 ? shade : body)), B = ring(L / S.L).map(([z, y]) => push(x0 + L, y, z, y < 0 ? shade : body));
  for (let i = 0; i < 12; i++) { const j = (i + 1) % 12; idx.push(A[i], B[i], A[j], A[j], B[i], B[j]); }
  // cut ends (flat): a fan round a centre
  for (const [x, u, flip] of [[x0, 0, 0], [x0 + L, L / S.L, 1]]) {
    const r = ring(u), c = push(x, 0, 0, cut), v = r.map(([z, y]) => push(x, y, z, cut));
    for (let i = 0; i < 12; i++) { const j = (i + 1) % 12; if (flip) idx.push(c, v[j], v[i]); else idx.push(c, v[i], v[j]); }
  }
  // 3 pale lines on the top face (0.003 wide, 0.0006 proud), inset 0.012 from either end, they narrow with the stick
  for (const f of [-0.28, 0, 0.28]) {
    const u0 = 0.012 / S.L, u1 = (L - 0.012) / S.L, z = (u) => (f * sec(u)[0]), y = (u) => sec(u)[1] / 2 + 0.0006;
    if (u1 <= u0) continue;
    const q = [[u0, -1], [u0, 1], [u1, -1], [u1, 1]].map(([u, s]) => push(x0 + u * S.L, y(u), z(u) + s * 0.0015, line));
    idx.push(q[0], q[1], q[2], q[2], q[1], q[3]);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
const stickMat = () => mat("#ffffff", { vertexColors: true, roughness: 0.55 });
const X = new THREE.Vector3(1, 0, 0), AX = new THREE.Vector3();
// a stick mesh by its middle and the direction of its thin end (roll: turn about its own length)
function stick(parent, geo, m, p, dir, roll = 0) {
  const o = mesh(geo, m, parent, p[0], p[1], p[2]);
  o.quaternion.setFromUnitVectors(X, AX.set(...dir).normalize()); o.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(X, roll)); return o;
}

// ---- the pile table: [x, z, yaw (deg), pitch (thin end up, deg), roll (deg)] per layer, y by layer ---------------------
const PILE = (() => {
  const r = rng(14), j = (a) => (r() - 0.5) * 2 * a, T = [];
  for (let i = 0; i < 6; i++) T.push({ p: [j(0.012), 0.010, -0.085 + i * 0.034 + j(0.003)], yaw: j(22), up: j(2), roll: j(40) });                // layer 1: along x
  for (let i = 0; i < 5; i++) T.push({ p: [-0.07 + i * 0.035 + j(0.004), 0.028, j(0.014)], yaw: 90 + j(20), up: j(2), roll: j(40) });          // layer 2: across
  for (const [x, z, y] of [[-0.03, -0.03, 35], [0.02, 0.025, -30], [0.005, -0.005, 70]]) T.push({ p: [x, 0.046, z], yaw: y + j(8), up: j(3), roll: j(40) });   // layer 3: diagonals, the last is the top one
  return T;
})();

// ---- the bowl table: 18 standing, 12 lying ------------------------------------------------------------------------------
const BOWL = (() => {
  const r = rng(30), j = (a) => (r() - 0.5) * 2 * a, T = [];
  for (let i = 0; i < 18; i++) {   // standing: bottom inside at y 0.09, leaning out 15..35 degrees, crossing the rim height 0.12 at radius 0.128 (the wall there is 0.152)
    const th = (i / 18) * Math.PI * 2 + j(0.12), a = 15 + 20 * ((i * 7) % 18) / 17, rb = 0.128 - 0.03 * Math.tan(rad(a)), k = Math.sin(rad(a));
    const c = [Math.sin(th), Math.cos(th)];
    T.push({ p: [c[0] * (rb + 0.055 * k), 0.09 + 0.055 * Math.cos(rad(a)), c[1] * (rb + 0.055 * k)], dir: [c[0] * k, Math.cos(rad(a)), c[1] * k], roll: j(3) });
  }
  for (let i = 0; i < 12; i++) {   // lying: 3 layers of 4 as a mound inside the rim radius 0.10, the top at 0.17
    const L = Math.floor(i / 4), th = (i % 4) * 1.57 + L * 0.7 + j(0.25), rr = 0.03 + 0.035 * ((i * 5) % 4) / 3 * (1 - 0.3 * L), ya = th + 1.1 + j(0.5);
    T.push({ p: [Math.sin(th) * rr, 0.115 + 0.022 * L + j(0.003), Math.cos(th) * rr], dir: [Math.cos(ya), 0.12 + j(0.1), Math.sin(ya)], roll: j(3) });
  }
  const top = (s) => s.p[1] + 0.055 * Math.abs(s.dir[1] / Math.hypot(...s.dir));
  return T.map((s, i) => ({ ...s, i })).sort((a, b) => top(a) - top(b)).map((s, rank) => ({ ...s, rank }));   // rank 0 = the lowest: hidden last
})();

// ---- the bag --------------------------------------------------------------------------------------------------------
const BAG = { W: 0.22, H: 0.3, D: 0.14, front: "#b98a5a", side: "#94693f", crease: "#7e5733", edge: "#d2a877", tips: [
  [-0.075, 0.010, 10, 0.045], [-0.052, -0.028, -8, 0.030], [-0.028, 0.022, 6, 0.055], [-0.006, -0.012, -12, 0.040], [0.016, 0.026, 9, 0.060],
  [0.040, -0.024, -6, 0.035], [0.060, 0.012, 11, 0.050], [0.076, -0.016, -9, 0.030], [0.002, 0.004, 4, 0.042]] };   // x, z, lean (deg toward +x), out

function bagGeo(crush) {
  const { W, D } = BAG, H = BAG.H * (1 - 0.35 * crush), b = 0.015 * crush, hw = W / 2, hd = D / 2;
  const front = C3(BAG.front), side = C3(BAG.side), dark = C3(BAG.crease);
  const pos = [], col = [], idx = [];
  const dent = (p) => {   // two dented top corners: (+x, +z) and (-x, -z), pushed in and down
    for (const [sx, sz] of [[1, 1], [-1, -1]]) {
      const d = Math.hypot(p.x - sx * hw, p.y - H, p.z - sz * hd), w = Math.exp(-((d / 0.045) ** 2));
      p.x -= sx * 0.012 * w; p.z -= sz * 0.008 * w; p.y -= 0.016 * w;
    }
    return p;
  };
  const deform = (p, u, v, n) => {   // crumple (zero at the vertical edges) and the squeeze's bulge (zero at the corners, top and bottom)
    const k = Math.sin(Math.PI * clamp(u)) ** 0.6, cr = 0.0028 * Math.sin(41 * p.x + 17 * p.y + 3 * p.z) * Math.sin(Math.PI * clamp(v)) ** 0.5 * k;
    p.addScaledVector(n, cr);
    p.x += Math.sign(p.x || 1) * b * Math.sin(Math.PI * v) * (1 - (p.z / hd) ** 2) * (Math.abs(n.x) > 0.5 ? 1 : 0);
    p.z += Math.sign(p.z || 1) * b * 0.4 * Math.sin(Math.PI * v) * (1 - (p.x / hw) ** 2) * (Math.abs(n.z) > 0.5 ? 1 : 0);
    return dent(p);
  };
  const wall = (nu, nv, at, n, c, flip) => {
    const o = pos.length / 3, N = new THREE.Vector3(...n);
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const u = i / nu, v = j / nv, p = deform(new THREE.Vector3(...at(u, v)), u, v, N);
      pos.push(p.x, p.y, p.z); col.push(c.r, c.g, c.b);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = o + j * (nu + 1) + i, d = a + nu + 1; if (flip) idx.push(a, a + 1, d, a + 1, d + 1, d); else idx.push(a, d, a + 1, a + 1, d, d + 1); }
  };
  wall(8, 10, (u, v) => [(u - 0.5) * W, v * H, hd], [0, 0, 1], front, false);
  wall(8, 10, (u, v) => [(u - 0.5) * W, v * H, -hd], [0, 0, -1], front, true);
  wall(5, 10, (u, v) => [hw, v * H, (u - 0.5) * -D], [1, 0, 0], side, false);
  wall(5, 10, (u, v) => [-hw, v * H, (u - 0.5) * D], [-1, 0, 0], side, false);
  wall(8, 5, (u, v) => [(u - 0.5) * W, 0.001, (v - 0.5) * D], [0, -1, 0], dark, false);
  // 8 crease lines 0.004 wide, a shade darker, 0.0008 proud of the paper: 4 on the front, 2 on the back, 2 on the sides (from, to in u, v of the wall)
  const creases = [
    [0, [0.12, 0.22], [0.40, 0.55]], [0, [0.30, 0.92], [0.55, 0.60]], [0, [0.62, 0.15], [0.74, 0.50]], [0, [0.78, 0.70], [0.92, 0.46]],
    [1, [0.25, 0.20], [0.50, 0.64]], [1, [0.60, 0.80], [0.80, 0.30]], [2, [0.20, 0.35], [0.70, 0.55]], [3, [0.30, 0.65], [0.76, 0.40]]];
  for (const [w, [u0, v0], [u1, v1]] of creases) {
    const at = (u, v) => (w === 0 ? [(u - 0.5) * W, v * H, hd + 0.0008] : w === 1 ? [(0.5 - u) * W, v * H, -hd - 0.0008] : w === 2 ? [hw + 0.0008, v * H, (0.5 - u) * D] : [-hw - 0.0008, v * H, (u - 0.5) * D]);
    const n = w === 0 ? [0, 0, 1] : w === 1 ? [0, 0, -1] : w === 2 ? [1, 0, 0] : [-1, 0, 0], N = new THREE.Vector3(...n), o = pos.length / 3;
    const pa = deform(new THREE.Vector3(...at(u0, v0)), u0, v0, N), pb = deform(new THREE.Vector3(...at(u1, v1)), u1, v1, N);
    const d = pb.clone().sub(pa), s = new THREE.Vector3().crossVectors(d, N).normalize().multiplyScalar(0.002);
    for (const p of [pa.clone().sub(s), pa.clone().add(s), pb.clone().sub(s), pb.clone().add(s)]) { pos.push(p.x, p.y, p.z); col.push(dark.r, dark.g, dark.b); }
    idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3, o, o + 1, o + 2, o + 1, o + 3, o + 2);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  // the rolled top: a closed tube r 0.01 through the wall tops (with the dents), lifted 0.004
  const pts = [], n = 32, top = (x, z) => dent(new THREE.Vector3(x, H + 0.004, z));
  for (let i = 0; i < n; i++) { const u = i / n; pts.push(top(-hw + 2 * hw * u, hd)); }
  for (let i = 0; i < n / 2; i++) { const u = i / (n / 2); pts.push(top(hw, hd - 2 * hd * u)); }
  for (let i = 0; i < n; i++) { const u = i / n; pts.push(top(hw - 2 * hw * u, -hd)); }
  for (let i = 0; i < n / 2; i++) { const u = i / (n / 2); pts.push(top(-hw, -hd + 2 * hd * u)); }
  const rim = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.1), 144, 0.01, 6, true);
  return { g, rim, H };
}

// ---- the crumbs -----------------------------------------------------------------------------------------------------
// the moustache's top and lower edge (b) at x (costumes-dad.js topC / lowC, straight between the knots) and its stand-off from the skin
const lin = (K, x) => { x = Math.abs(x); for (let i = 1; i < K.length; i++) if (x <= K[i][0]) { const [x0, y0] = K[i - 1], [x1, y1] = K[i]; return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0); } return K[K.length - 1][1]; };
const MTOP = [[0, 0.486], [0.055, 0.492], [0.115, 0.486], [0.17, 0.462]], MLOW = [[0, 0.436], [0.055, 0.424], [0.115, 0.404], [0.17, 0.374]];
const hairAt = (x, v) => { const T = 0.022 + 0.012 * clamp(Math.abs(x) / 0.05), ridge = Math.max(0, 1 - (2 * v - 1) ** 2) ** 0.8; return 0.012 + (T - 0.012) * ridge; };
// [x, v (0 = the hair's lower edge, 1 = its top edge), size, colour index, yaw (deg), width factor]
const SPECKS = [[-0.165, 0.45, 0.010, 0, 20, 1.2], [-0.125, 0.25, 0.012, 1, -35, 1.0], [-0.090, 0.80, 0.009, 0, 60, 0.8], [-0.045, 0.50, 0.014, 0, 10, 1.1],
  [-0.012, 0.85, 0.008, 1, -50, 1.0], [0.020, 0.30, 0.011, 0, 40, 0.9], [0.058, 0.62, 0.013, 1, -15, 1.2], [0.098, 0.35, 0.009, 0, 75, 1.0], [0.148, 0.55, 0.011, 1, -60, 0.9]];

export const CARROTS_KINDS = {
  carrotstick(P) {
    const m = stickMat(), g = new THREE.Group(); P.whole.add(g);
    const up = !!P.spec.up, o = new THREE.Mesh(stickGeo(0, 0), m); o.castShadow = o.receiveShadow = true; g.add(o);
    if (up) g.rotation.z = Math.PI / 2;   // x -> y: the thick end at the origin, the thin end up
    else o.position.x = -CARROTS.stick.L / 2;
    let last = 0;
    return {
      grip: 0,
      apply(ps) {
        const e = clamp(ps.eaten ?? P.spec.eaten ?? 0);
        if (e !== last) { last = e; o.geometry.dispose(); o.geometry = stickGeo(e, 0); }
        o.visible = e < 0.999;
      },
    };
  },

  carrotpile(P) {
    const m = stickMat(), g = stickGeo(0), sticks = PILE.map((s) => stick(P.whole, g, m, s.p, [Math.cos(rad(s.yaw)), Math.sin(rad(s.up)), -Math.sin(rad(s.yaw))], rad(s.roll)));
    return { grip: 0, apply(ps) { const n = Math.round(clamp(ps.n ?? P.spec.n ?? 14, 0, 14)); sticks.forEach((o, i) => { o.visible = i < n; }); } };
  },

  carrotbowl(P) {
    const white = mat("#f4f1ea", { roughness: 0.35 }), inner = mat("#d9d6cc", { roughness: 0.4 }), m = stickMat(), g = stickGeo(0);
    // outer wall (foot r 0.07, rim r 0.16, 0.12 tall), inner wall 0.008 in; a foot ring in shade
    const out = [[0, 0], [0.066, 0], [0.072, 0.012], [0.095, 0.04], [0.130, 0.082], [0.16, 0.12]], inn = [[0.152, 0.12], [0.125, 0.082], [0.09, 0.044], [0.06, 0.02], [0, 0.02]];
    mesh(new THREE.LatheGeometry([...out, [0.16, 0.12], [0.152, 0.12]].map(([r, y]) => new THREE.Vector2(r, y)), 48), white, P.whole, 0, 0, 0);
    mesh(new THREE.LatheGeometry(inn.map(([r, y]) => new THREE.Vector2(r, y)).reverse(), 48), inner, P.whole, 0, 0, 0).material.side = THREE.DoubleSide;
    mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.014, 32), inner, P.whole, 0, 0.007, 0);
    const sticks = BOWL.map((s) => stick(P.whole, g, m, s.p, s.dir, rad(s.roll * 20)));
    return { grip: 0, apply(ps) { const n = Math.round(clamp(ps.fill ?? P.spec.fill ?? 1) * 30); BOWL.forEach((s, k) => { sticks[k].visible = s.rank < n; }); } };
  },

  carrotbag(P) {
    const paper = mat("#ffffff", { vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }), edge = mat(BAG.edge, { roughness: 0.8 }), m = stickMat(), sg = stickGeo(0);
    const body = new THREE.Mesh(new THREE.BufferGeometry(), paper), rim = new THREE.Mesh(new THREE.BufferGeometry(), edge);
    body.castShadow = body.receiveShadow = rim.castShadow = true; P.whole.add(body, rim);
    const tips = BAG.tips.map(([x, z, lean]) => { const o = new THREE.Mesh(sg, m); o.castShadow = true; o.rotation.set(0, 0, Math.PI / 2 - rad(lean)); o.userData = { x, z, lean }; P.whole.add(o); return o; });
    let lastC = null, H = BAG.H;
    return {
      grip: 0,
      apply(ps) {
        const crush = clamp(ps.crush ?? P.spec.crush ?? 0), fill = clamp(ps.fill ?? P.spec.fill ?? 1);
        if (crush !== lastC) { lastC = crush; const r = bagGeo(crush); body.geometry.dispose(); rim.geometry.dispose(); body.geometry = r.g; rim.geometry = r.rim; H = r.H; }
        tips.forEach((o, i) => {   // tip i stands `out` over the top at fill 1, sinks 0.012 under it, then hides (one after another)
          const s = clamp(fill * 9 - i), out = BAG.tips[i][3], top = H - 0.012 + (out + 0.012) * s, ln = rad(o.userData.lean);
          o.visible = s > 0.01; o.position.set(o.userData.x - 0.055 * Math.sin(ln), top - 0.055 * Math.cos(ln), o.userData.z);
        });
      },
    };
  },

  crumbs(P) {
    const C = CARROTS.crumbs, ms = [mat("#d9a55c", { roughness: 0.8 }), mat("#8a5a2e", { roughness: 0.8 })], grp = new THREE.Group(); P.whole.add(grp);
    SPECKS.forEach(([x, v, s, ci, yaw, wf]) => {
      const b = lin(MLOW, x) + (lin(MTOP, x) - lin(MLOW, x)) * v, skin = -0.016 * (Math.abs(x) / 0.17) ** 3 - 0.15 * (b - 0.43);
      const o = new THREE.Mesh(new THREE.BoxGeometry(s * wf, s * 0.8, 0.006), ms[ci]); o.castShadow = true;
      o.position.set(x, b - 0.43, skin + hairAt(x, v) + C.proud + 0.003); o.rotation.order = "YXZ";
      o.rotation.set(0, Math.atan((0.048 * x * x * Math.sign(x)) / 0.17 ** 3), rad(yaw)); grp.add(o);
    });
    return { grip: 0, apply(ps) { grp.visible = (ps.on ?? 0) > 0.5; } };
  },
};
