import * as THREE from "three";
import { band, garment, clothMat, liningMat, foldInk, inkMesh, sstep } from "./costumes-art.js";
import { texOf, wash, ribTexture, gridUv, hash2 } from "./costumes-art-cast.js";

// ANCIENT ALIENS cast (series kit, 13 Nov 2026, BOARD.md sections 1-2, DESIGNS.md section 1): the alien potato crew and the
// Egyptian worker potatoes. Two costume types, both through castCostume (costumes-cast.js); the character files are in
// characters/ancient-aliens/*.json. Their faces come from characters/sheet-cast.json "types" (aliencrew, egyptworker).
//
//   aliencrew    costume.variant "crew" (default) | "foreman" | "lifter". Body: skin #9fb3c4 with slate freckles (body.speckColor
//                #6f8496), cool lilac cheeks, teal iris, big ROUND eyes (face.size 0.8, eye.oval 1), small curved mouth, no sprout
//                (sprout.placement "none"). The costume adds:
//                - two short rubbery antennae on top: 0.16 long, r 0.018 -> 0.012, 0.11 apart, leaning 12 deg outward, each with a
//                  matte dark-teal knob r 0.04 (no glow). They lag behind head moves (ft, as softFollow, but rooted at the head:
//                  the root stays on the skin, only the tip trails) and never pass through the body.
//                - a burnt-orange one-piece coverall over the lower body (neckline at -0.34 rad at the front, up to 0.38 at the back),
//                  a cream rolled collar ring on its top edge, a centre zip, hand-stitched seams (side, back, darts), one chest
//                  pocket with a flap and button on the wearer's left (+x), two knee-height patches with cross stitches low on the
//                  front, brush fold ink; sleeves that end a fixed distance before the hand (as Spud's) with one twist-free
//                  frame; limbs = coverall orange; cream 3-finger gloves; cream stubby boots with a cuff, a toe line and a sole.
//                - foreman: the same coverall and one white band 0.07 high round the chest. Body 1.05 x 0.58 x 0.52, taper 0.12.
//                - lifter: a boxy cream backpack 0.34 w x 0.30 h x 0.16 d on the back (its front face stands exactly on the back of
//                  the body, never inside it), flap, two buckles, seams, scuffs; two orange straps over the shoulders.
//                  Body 0.75 x 0.85 x 0.66.
//                Bodies: crew 0.60 x 0.60 x 0.54 (round), foreman, lifter as above (characters/ancient-aliens/alien-*.json).
//                costume keys (default): variant "crew" | coverall "#c8581f" | trim "#efe6cf" (collar, gloves, boots) |
//                  knob "#1f6f6b" | stalk (antenna stalk, default 0.93 x the skin) | band "#f6f3ec" (foreman's chest band) |
//                  pack "#efe6cf" | strap "#c8581f" | hands "#efe6cf" (glove) | cuffGap 0.062 (sleeve ends this far before the hand)
//   egyptworker  worker-a (0.82 x 0.60) and worker-b (0.95 x 0.52): Spud's golden skin, eyes, face and hands, no sprout. Bare golden
//                arms, bare brown-tan stub feet. Costume: a white linen kilt from the waist (ph -0.20) down to just above the feet,
//                wrapped right over left (the lapping panel's diagonal leading edge crosses the front), a hanging front fold
//                (a pleated apron that stands off the cloth toward its hem), a belt with a knot and two ends that swing; hand-drawn
//                fold lines; a plain white linen khat, ONE draped cloth: over the crown 1.2 cm off the skin, a thin tan band at the
//                forehead, then a curtain round the sides and back of the head (2.5 cm off at the band, 5 cm at its wavy edge, half the
//                standing height, lower behind), open in front from cheek to cheek, inside #cfc7b4. NOT a striped nemes.
//                costume keys (default): linen "#f1ece0" | fold "#cfc7b4" | band "#c9a15a" | belt "#e6dec8" | feet "#b98a5a" |
//                  hands "#f9b75c" (the glove skin; bare arms and hands are one colour = limbs.color in the character file)
// Hand-drawn rules as everywhere (costumes-everyday.js): each mark has its own place, width and strength from a hash of its index
// (no repeating pattern, no Math.random, no clock); coloured limbs take no ink hull; a roll mesh is wound facing out.

const TAU = Math.PI * 2;
const mesh = (g, m, shadow = true) => { const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = shadow; return o; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const shade = (hex, k) => `#${new THREE.Color(hex).multiplyScalar(k).getHexString()}`;
const hs = (i, n = 0) => hash2(i * 3.17 + n * 11.3, i * 0.71 + n * 1.7);   // a hash 0..1 for mark i, channel n
const smooth = (a, b, x) => sstep(a, b, x);

// ---------- hand-painted cloth maps (a grey multiplier on the garment colour) ---------------------------------------------
// a soft wash and strokes on it, each with its own place, length, width and strength: draw(stroke, h), stroke(x0, y0, x1, y1, w0, w1,
// val, dark) in pixels (w = radius), dark strokes darken, light ones lift. Wraps in x.
function paintTex(W, H, seed, base, washAmp, draw, swap = false) {
  const buf = wash(W, H, 90, seed, washAmp), lift = new Float32Array(W * H);
  for (let k = 0; k < buf.length; k++) buf[k] += base;
  const stroke = (x0, y0, x1, y1, w0, w1, val, dark) => {
    const pad = Math.max(w0, w1) + 1.5, xa = Math.floor(Math.min(x0, x1) - pad), xb = Math.ceil(Math.max(x0, x1) + pad), ya = Math.max(0, Math.floor(Math.min(y0, y1) - pad)), yb = Math.min(H - 1, Math.ceil(Math.max(y0, y1) + pad));
    const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1;
    for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
      const u = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / l2)), d = Math.hypot(x - (x0 + dx * u), y - (y0 + dy * u)), w = w0 + (w1 - w0) * u;
      const a = 1 - sstep(w - 1, w + 0.8, d); if (a <= 0) continue;
      const q = y * W + (((x % W) + W) % W);
      if (dark) lift[q] = Math.min(lift[q], -a * val); else if (lift[q] >= 0) lift[q] = Math.max(lift[q], a * val);
    }
  };
  draw(stroke, (i, n) => hash2(i * 3.17 + n * 11.3 + seed, i * 0.71 + n * 1.7 + seed * 0.37));
  for (let k = 0; k < buf.length; k++) buf[k] += lift[k];
  return texOf(buf, W, H, swap);
}
// a stitched line along a polyline (pixels): dashes, each with its own length, gap, width and strength; a few left out
function dashed(stroke, seed, pts, w, val) {
  let n = 0, carry = 0;
  for (let s = 0; s < pts.length - 1; s++) {
    const [x0, y0] = pts[s], [x1, y1] = pts[s + 1], L = Math.hypot(x1 - x0, y1 - y0); if (L < 1e-6) continue;
    let d = carry;
    while (d < L) {
      const len = 7 + 6 * hs(n, seed), gap = 3 + 3 * hs(n, seed + 1), b = Math.min(L, d + len); n++;
      if (hs(n, seed + 2) > 0.06) stroke(x0 + (x1 - x0) * d / L, y0 + (y1 - y0) * d / L, x0 + (x1 - x0) * b / L, y0 + (y1 - y0) * b / L, w * (0.8 + 0.5 * hs(n, seed + 3)), w * 0.7, val * (0.7 + 0.6 * hs(n, seed + 4)), true);
      d = b + gap;
    }
    carry = d - L;
  }
}
// a line from p to q with a little hand wobble, sampled as a polyline
const wob = (seed, p, q, amp, n = 14) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, a = Math.sin(t * Math.PI); o.push([p[0] + (q[0] - p[0]) * t + amp * (hs(i, seed) - 0.5) * 2 * a, p[1] + (q[1] - p[1]) * t + amp * (hs(i, seed + 1) - 0.5) * 2 * a]); } return o; };

// ---------- geometry helpers ------------------------------------------------------------------------------------------
// grids of points -> one geometry. G: { nu, nv, pt(u, v) -> Vector3, uv(u, v)?, flip? }. With u running along +theta and v down the
// body the faces look OUT (the ink hull needs it); flip reverses that.
function geoOf(grids) {
  const pos = [], uv = [], idx = []; let base = 0;
  for (const G of grids) {
    for (let j = 0; j <= G.nv; j++) for (let i = 0; i <= G.nu; i++) { const u = i / G.nu, v = j / G.nv, p = G.pt(u, v), q = G.uv ? G.uv(u, v) : [u, v]; pos.push(p.x, p.y, p.z); uv.push(q[0], q[1]); }
    for (let j = 0; j < G.nv; j++) for (let i = 0; i < G.nu; i++) { const a = base + j * (G.nu + 1) + i, b = a + 1, c = a + G.nu + 1, d = c + 1; if (G.flip) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d); }
    base += (G.nu + 1) * (G.nv + 1);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// a cloth piece with a real edge: at(u, v, off) -> the point `off` m out from the cloth's inner face; thick = its thickness.
// Outer face, inner face and the four edges. The texture takes the same (u, v) on both faces.
function slab(nu, nv, at, thick, flip = false) {
  const outer = { nu, nv, flip, pt: (u, v) => at(u, v, thick) }, inner = { nu, nv, flip: !flip, pt: (u, v) => at(u, v, 0) };
  const edge = (f) => ({ nu: 24, nv: 1, pt: (s, k) => f(s, k ? 0 : thick), flip: false, uv: (s) => [s, 0.5] });
  return geoOf([outer, inner, edge((s, o) => at(s, 0, o)), edge((s, o) => at(s, 1, o)), edge((s, o) => at(0, s, o)), edge((s, o) => at(1, s, o))]);
}
// a tube along a path of the body: P(t) -> [th, ph, lift]; radius r(t); closed at its ends by r going to nothing
function tubeOn(ch, P, n, r, radial = 8) {
  const pts = []; for (let i = 0; i <= n; i++) { const [th, ph, lift] = P(i / n), s = ch.surf(th, ph); pts.push(s.pos.clone().addScaledVector(s.normal, lift)); }
  const c = new THREE.CatmullRomCurve3(pts), g = new THREE.TubeGeometry(c, n * 2, 1, radial, false), p = g.attributes.position, q = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i <= n * 2; i++) { c.getPointAt(i / (n * 2), q); const k = r(i / (n * 2)); for (let j = 0; j <= radial; j++) { const m = i * (radial + 1) + j; v.fromBufferAttribute(p, m).sub(q).multiplyScalar(k).add(q); p.setXYZ(m, v.x, v.y, v.z); } }
  g.computeVertexNormals(); g.userData.end = pts[n]; return g;
}
// a rounded box: the box's own vertices pushed out to radius r round the inner box (uv and the six faces stay)
function roundedBox(w, h, d, r, seg = 6) {
  const g = new THREE.BoxGeometry(w, h, d, seg, seg, seg), P = g.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3(), hw = V(w / 2 - r, h / 2 - r, d / 2 - r);
  for (let i = 0; i < P.count; i++) {
    v.fromBufferAttribute(P, i); c.set(Math.max(-hw.x, Math.min(hw.x, v.x)), Math.max(-hw.y, Math.min(hw.y, v.y)), Math.max(-hw.z, Math.min(hw.z, v.z)));
    v.sub(c); const l = v.length() || 1; v.multiplyScalar(r / l).add(c); P.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}
const lenTh = (ch, m, ph) => m / (ch.rx * Math.max(0.3, Math.cos(ph)));   // m metres along the body's width as an angle at elevation ph
const lenPh = (ch, m) => m / ch.ry;

// ---------- sleeves, gloves, boots (as Spud's and Chip's: costumes-art-cast.js spud, costumes-everyday.js) -------------------
// a tube along the arm's own curve, rebuilt every frame, ending SL.gap metres before the hand's centre, carrying one frame along the
// arm without twist; the cuff is its own piece (the last SL.cuffAt..1 of the tube)
function sleeves(ch, armM, cuffM, SL) {
  const slv = {}, cuf = {};
  for (const s of ["L", "R"]) for (const [set, m] of [[slv, armM], [cuf, cuffM]]) { set[s] = new THREE.Mesh(new THREE.BufferGeometry(), m); set[s].castShadow = true; set[s].frustumCulled = false; ch.root.add(set[s]); }
  const _up = V(0, 1, 0), _fw = V(0, 0, 1), _r = V(0, 0, 0), _n = V(0, 0, 0), _b = V(0, 0, 0), R = SL.radial ?? 16, N = SL.n ?? 16, NC = Math.max(2, Math.round(N * (1 - SL.cuffAt)));
  const radius = (t) => t < SL.cuffAt ? SL.r0 + (SL.r1 - SL.r0) * (t / SL.cuffAt) : (SL.rc + SL.cuff * Math.sin(Math.PI * (t - SL.cuffAt) / (1 - SL.cuffAt))) * (1 - 0.22 * sstep(0.9, 1, t));
  const tube = (curve, ua, ub, ta, tb, n) => {
    const pos = new Float32Array((n + 1) * (R + 1) * 3), uv = new Float32Array((n + 1) * (R + 1) * 2), idx = [];
    for (let i = 0; i <= n; i++) {
      const t = ta + (tb - ta) * (i / n), u = ua + (ub - ua) * (i / n), p = curve.getPointAt(u), T = curve.getTangentAt(u);
      _n.addScaledVector(T, -_n.dot(T)).normalize(); _b.crossVectors(T, _n);
      const r = radius(t);
      for (let k = 0; k <= R; k++) {
        const a = (k / R) * TAU, c = Math.cos(a) * r, d = Math.sin(a) * r, q = i * (R + 1) + k;
        pos[q * 3] = p.x + c * _n.x + d * _b.x; pos[q * 3 + 1] = p.y + c * _n.y + d * _b.y; pos[q * 3 + 2] = p.z + c * _n.z + d * _b.z;
        uv[q * 2] = i / n; uv[q * 2 + 1] = k / R;
      }
    }
    for (let i = 0; i < n; i++) for (let k = 0; k < R; k++) { const a = i * (R + 1) + k, b = a + R + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const NN = g.attributes.normal; for (let i = 0; i <= n; i++) { const a = i * (R + 1), b = a + R, x = NN.getX(a) + NN.getX(b), y = NN.getY(a) + NN.getY(b), z = NN.getZ(a) + NN.getZ(b), l = Math.hypot(x, y, z) || 1; NN.setXYZ(a, x / l, y / l, z / l); NN.setXYZ(b, x / l, y / l, z / l); }
    return g;
  };
  return () => {
    for (const s of ["L", "R"]) {
      const A = ch.arms?.[s]; if (!A?.shoulder || !A.elbow || !A.hand) { slv[s].visible = cuf[s].visible = false; continue; }
      const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), L = Math.max(0.05, curve.getLength());
      const to = Math.max(SL.from + 0.3, Math.min(0.92, 1 - SL.gap / L)), mid = SL.from + (to - SL.from) * SL.cuffAt;
      const T0 = curve.getTangentAt(SL.from), w = sstep(0.75, 0.95, Math.abs(T0.y)); _r.copy(_up).multiplyScalar(1 - w).addScaledVector(_fw, w); _n.copy(_r);
      const g1 = tube(curve, SL.from, mid, 0, SL.cuffAt, N - NC), g2 = tube(curve, mid, to, SL.cuffAt, 1, NC);
      slv[s].geometry.dispose(); slv[s].geometry = g1; slv[s].visible = true;
      cuf[s].geometry.dispose(); cuf[s].geometry = g2; cuf[s].visible = true;
    }
  };
}
// the glove's skin, the wrist and the hand's own meshes take one colour; no ink hull on coloured limbs
function handColour(ch, pale) {
  if (ch.skinMat) ch.skinMat.color.set(pale);
  if (ch.armMat && ch.armMat !== ch.limbMat) ch.armMat.color.set(pale);
  if (ch.limbMat) { const hm = ch.limbMat.clone(); hm.color.set(pale); hm.userData = { ...ch.limbMat.userData };
    for (const s of ["L", "R"]) ch.arms?.[s]?.hand?.traverse?.((o) => { if (o.isMesh && o.material === ch.limbMat) o.material = hm; }); }
  if (ch.limbMat) ch.limbMat.userData.noOutline = true;
}
// the foot ball made taller by `k` without lifting its sole off the floor the rig puts it on (the sphere is shifted up inside its scale)
function stubFoot(f, kx, ky, kz) {
  f.geometry = new THREE.SphereGeometry(0.075, 24, 16).translate(0, 0.075 - 0.0375 / (0.5 * ky), 0);
  f.scale.set(0.9 * kx, 0.5 * ky, 1.25 * kz);
}
function boots(ch, cream) {
  const sm = ch.limbMat.clone(); sm.color.set(cream); sm.userData = { ...ch.limbMat.userData, noOutline: true };
  const cuffM = clothMat(shade(cream, 0.93), { roughness: 0.9 }), lineM = clothMat(shade(cream, 0.78)), soleM = clothMat(shade(cream, 0.8));
  for (const m of [cuffM, lineM, soleM]) m.userData.noOutline = true;
  for (const s of ["L", "R"]) {
    const f = ch.legs?.[s]?.foot; if (!f) continue;
    stubFoot(f, 1.1, 1.5, 0.92); f.material = sm;
    // in the ball's own space: a rolled top (the leg goes into it), a toe line across the front, a darker sole rim
    const k = 0.5 * 1.5, top = new THREE.Mesh(new THREE.TorusGeometry(0.047, 0.014, 8, 24), cuffM); top.rotation.x = Math.PI / 2; top.position.y = 0.075 - 0.0375 / k + 0.036; top.scale.z = 1; f.add(top);
    const toe = new THREE.Mesh(new THREE.TorusGeometry(0.064, 0.0045, 6, 24, Math.PI * 0.9), lineM); toe.position.set(0, 0.075 - 0.0375 / k - 0.012, 0.03); toe.rotation.set(0.1, 0, Math.PI * 0.05); toe.scale.z = 1.4; f.add(toe);
    const so = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.011, 8, 36), soleM); so.rotation.x = Math.PI / 2; so.position.y = -0.0375 / k; f.add(so);
  }
}

// ======================================================================================================================
// the aliens
// ======================================================================================================================
const VARIANT = {
  crew:    { seed: 11.3, folds: 5, r0: 0.066, r1: 0.052, collar: 0.028, packUp: 0 },
  foreman: { seed: 23.7, folds: 5, r0: 0.06, r1: 0.048, collar: 0.027, packUp: 0 },
  lifter:  { seed: 37.1, folds: 6, r0: 0.082, r1: 0.062, collar: 0.034, packUp: 0.04 },
};
const FRONT = -0.34, BACK = 0.38, HEM = -1.32;   // the coverall's neckline: low under the mouth, rising to the back; its hem near the legs

// the coverall's map: a painted wash, sparse short weave flecks, and dashed stitched seams (centre back, two sides, two darts beside
// the zip, a yoke line across the back), each stitch its own. Pixel x = theta round (0..1024), y = elevation from the hem up (512).
function coverallTex(seed, hmax) {
  const W = 1024, H = 512, px = (th, ph) => [((th / TAU) % 1 + 1) % 1 * W, (ph - HEM) / hmax * H];
  return paintTex(W, H, seed, 0.9, 0.04, (stroke, h) => {
    for (let i = 0; i < 360; i++) {   // weave flecks: short, most running down the cloth, a third pencil-dark
      const x = h(i, 1) * W, y = h(i, 2) * H, len = 4 + 8 * h(i, 3), a = (h(i, 4) - 0.5) * 0.9, w = 0.9 + 1.0 * h(i, 5), dark = h(i, 6) < 0.34;
      stroke(x, y, x + Math.sin(a) * len, y + Math.cos(a) * len, w, w * 0.5, dark ? 0.06 + 0.06 * h(i, 7) : 0.04 + 0.05 * h(i, 7), dark);
    }
    const seam = (k, th0, ph0, th1, ph1, off = 0, amp = 1.2) => {   // a doubled stitched seam: two dashed lines 3.5 px apart
      const a = px(th0, ph0), b = px(th1, ph1);
      for (const o of [-1.75 + off, 1.75 + off]) dashed(stroke, seed + k * 7 + o, wob(seed + k, [a[0] + o, a[1]], [b[0] + o, b[1]], amp), 0.8, 0.2);
    };
    const bt = (th) => FRONT + (BACK - FRONT) * 0.5 * (1 - Math.cos(th));   // the neckline at theta
    seam(1, Math.PI, bt(Math.PI) - 0.1, Math.PI, HEM + 0.02);               // the centre back seam
    seam(2, 1.9, bt(1.9) - 0.12, 1.84, HEM + 0.02); seam(3, -1.9, bt(-1.9) - 0.12, -1.84, HEM + 0.02);   // the side seams, just behind the arms
    seam(4, 0.33, -0.62, 0.4, HEM + 0.12, 0, 1.6); seam(5, -0.33, -0.62, -0.4, HEM + 0.12, 0, 1.6);       // the darts beside the zip
    seam(6, 2.45, 0.1, -2.45 + TAU, 0.1, 0, 2.2);   // the yoke across the back (th 2.45 .. 3.84)
    // a few pencil crease lines across the lap (hand-drawn wrinkles by the hips), each its own length and strength
    for (let i = 0; i < 11; i++) { const th = (h(i, 11) * 2 - 1) * 2.6 + (i % 2 ? 0 : 0), ph = -0.85 + 0.35 * h(i, 12), a = px(th, ph), b = px(th + 0.1 + 0.12 * h(i, 13), ph - 0.05 - 0.05 * h(i, 14)); stroke(a[0], a[1], b[0], b[1], 0.9, 0.35, 0.07 + 0.07 * h(i, 15), true); }
  });
}
// a small patch (a pocket, a flap, a knee patch): wash, a stitched border `m` px in, optional cross stitches (each leg its own), a few flecks
function patchTex(seed, W, H, o = {}) {
  const m = o.margin ?? 6;
  return paintTex(W, H, seed, 0.92, 0.03, (stroke, h) => {
    const box = [[m, m], [W - m, m], [W - m, H - m], [m, H - m], [m, m]];
    if (o.skipTop) box.splice(0, 2, [m, H - m * 0 - m], [m, m]);
    for (let s = 0; s < 4; s++) { if (o.border === false) break; const a = box[s], b = box[s + 1]; dashed(stroke, seed + s * 3, wob(seed + s, a, b, 0.8, 8), 0.7, 0.2); }
    if (o.cross) for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) {   // small x stitches over the middle, one drawn by hand each
      const cx = W * (0.2 + 0.15 * i) + (h(i * 4 + j, 1) - 0.5) * 3, cy = H * (0.22 + 0.19 * j) + (h(i * 4 + j, 2) - 0.5) * 3, r = 3 + 1.2 * h(i * 4 + j, 3);
      if (h(i * 4 + j, 4) < 0.08) continue;
      stroke(cx - r, cy - r, cx + r, cy + r, 0.7, 0.5, 0.17 * (0.7 + 0.6 * h(i * 4 + j, 5)), true); stroke(cx - r, cy + r, cx + r, cy - r, 0.7, 0.5, 0.17 * (0.7 + 0.6 * h(i * 4 + j, 6)), true);
    }
    for (let i = 0; i < 40; i++) { const x = h(i, 21) * W, y = h(i, 22) * H, l = 3 + 6 * h(i, 23); stroke(x, y, x + l * (h(i, 24) - 0.5), y + l, 0.8, 0.4, 0.05 + 0.05 * h(i, 25), h(i, 26) < 0.4); }
  });
}
// the cloth of a sleeve (swap: columns along the arm): flecks only
function sleeveTex(seed) {
  return paintTex(256, 256, seed, 0.9, 0.04, (stroke, h) => { for (let i = 0; i < 70; i++) { const x = h(i, 1) * 256, y = h(i, 2) * 256, len = 4 + 7 * h(i, 3), dark = h(i, 6) < 0.34; stroke(x, y, x + 1.5 * (h(i, 4) - 0.5), y + len, 0.9, 0.5, dark ? 0.07 : 0.05, dark); } }, true);
}

// two antennae: a rubbery stalk (r 0.018 -> 0.012, 0.16 long) leaning 12 deg outward, a few ridges drawn on it, a matte knob r 0.04; they lag
// behind the head (ft: f toward the front, s toward +x, in rad, as softFollow) by bending about the root, so the root stays on the skin and
// the length stays the same
function antennae(C, ch, skin) {
  const col = C.stalk || shade(skin, 0.8), stalkM = new THREE.MeshStandardMaterial({ color: col, roughness: 0.75 }), ridgeM = new THREE.MeshStandardMaterial({ color: shade(col, 0.78), roughness: 0.8 }), knobM = new THREE.MeshStandardMaterial({ color: C.knob || "#1f6f6b", roughness: 0.78 });
  stalkM.userData.lookRole = ridgeM.userData.lookRole = knobM.userData.lookRole = "char";
  const group = new THREE.Group(), items = [], LEN = 0.16, lean = 12 * Math.PI / 180;
  for (const s of [-1, 1]) {
    const d = V((s * 0.055) / ch.rx, 1, 0.012 / ch.rz).normalize(), root = ch.bodyPoint(d), up = V(s * Math.sin(lean), Math.cos(lean), 0);   // the stalk's own direction: outward 12 deg
    const bow = V(0, 0, 0.012), pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(root.clone().addScaledVector(up, -0.01 + (LEN + 0.01) * t).addScaledVector(bow, Math.sin(t * Math.PI))); }
    const c = new THREE.CatmullRomCurve3(pts), g = new THREE.TubeGeometry(c, 20, 1, 10, false), P = g.attributes.position, q = V(0, 0, 0), v = V(0, 0, 0), N = 20, tR = (t) => 0.018 - 0.006 * Math.max(0, (t - 0.06) / 0.94);
    for (let i = 0; i <= N; i++) { c.getPointAt(i / N, q); for (let j = 0; j <= 10; j++) { const m = i * 11 + j; v.fromBufferAttribute(P, m).sub(q).multiplyScalar(i === 0 ? 0.001 : tR(i / N) * (1 + 0.45 * (1 - Math.min(1, (i / N) / 0.12)))).add(q); P.setXYZ(m, v.x, v.y, v.z); } }
    g.computeVertexNormals(); items.push({ g, y0: root.y, L: LEN, rigid: false }); group.add(mesh(g, stalkM));
    // a base: the stalk swells where it leaves the skin; three ridges (each its own height, tilt and weight) along it
    const base = new THREE.SphereGeometry(0.026, 14, 8).scale(1, 0.5, 1).translate(root.x, root.y + 0.003, root.z); items.push({ g: base, y0: root.y, L: LEN, rigid: true, at: root.y }); group.add(mesh(base, stalkM));
    for (let k = 0; k < 2; k++) {
      const t = 0.38 + 0.26 * k + 0.05 * (hs(k, s + 3) - 0.5), p = c.getPointAt(t), T = c.getTangentAt(t), r = tR(t) + 0.0016 + 0.0012 * hs(k, s + 4);
      const rg = new THREE.TorusGeometry(r - 0.001, 0.0026 + 0.0012 * hs(k, s + 5), 6, 14); rg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), T)); rg.translate(p.x, p.y, p.z);
      items.push({ g: rg, y0: root.y, L: LEN, rigid: true, at: p.y }); group.add(mesh(rg, ridgeM, false));
    }
    const tip = c.getPointAt(1), T1 = c.getTangentAt(1), kc = tip.clone().addScaledVector(T1, 0.028);
    const knob = new THREE.SphereGeometry(0.04, 24, 16).scale(1, 0.95, 1).translate(kc.x, kc.y, kc.z); items.push({ g: knob, y0: root.y, L: LEN, rigid: true, at: kc.y }); group.add(mesh(knob, knobM));
  }
  ch.potatoParts.add(group);
  for (const it of items) it.rest = it.g.attributes.position.array.slice();
  let last = "";
  (ch.softParts ??= []).push((ft) => {
    const f = (ft?.f || 0) * 0.9, sd = (ft?.s || 0) * 0.9, u = (ft?.u || 0) * 0.9, key = `${f}|${sd}|${u}`;
    if (key === last) return; last = key;
    for (const it of items) {
      const P = it.g.attributes.position, R = it.rest;
      for (let i = 0; i < P.count; i++) {
        const x = R[i * 3], y = R[i * 3 + 1], z = R[i * 3 + 2], h = Math.max(0, Math.min(1, ((it.rigid ? it.at : y) - it.y0) / (it.L + 0.03))), w = h ** 1.5 * (it.L + 0.03);
        const dx = sd * w, dz = f * w, dy = -0.5 * (dx * dx + dz * dz) / (it.L + 0.03) - u * w * 0.3;   // a rod swung about its root drops as it swings
        P.setXYZ(i, x + dx, y + dy, z + dz);
      }
      P.needsUpdate = true; it.g.computeBoundingSphere();
    }
  });
}

// the lifter's pack: its front face stands exactly on the most backward point of the body over its footprint, so it never cuts in
function backpack(C, ch, P) {
  const W = 0.34, Hh = 0.30, D = 0.16, cream = C.pack || "#efe6cf", cyP = ch.cy + P.packUp;
  let zf = 0;
  for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) { const x = (i / 8 - 0.5) * W, y = (j / 8 - 0.5) * Hh; zf = Math.min(zf, ch.bodyPoint(V(x, cyP + y - ch.cy, -1).normalize()).z); }
  zf -= 0.004;
  const g = roundedBox(W, Hh, D, 0.034), faces = [], seeds = [3.3, 4.7, 5.9, 6.1, 7.7, 8.3];   // +x, -x, +y, -y, +z (against the body), -z (the back)
  const back = (stroke, h) => {   // 192 x 192 px for 0.34 x 0.30 (y up): a stitched margin, the flap's lower edge, the lower pocket, a vertical seam, scuffs
    const Wp = 192, Hp = 192, FL = 114;
    dashed(stroke, 31, wob(1, [10, 12], [Wp - 10, 12], 0.8), 0.8, 0.2); dashed(stroke, 32, wob(2, [10, Hp - 12], [Wp - 10, Hp - 12], 0.8), 0.8, 0.2); dashed(stroke, 33, wob(3, [10, 12], [10, Hp - 12], 0.8), 0.8, 0.2); dashed(stroke, 34, wob(4, [Wp - 10, 12], [Wp - 10, Hp - 12], 0.8), 0.8, 0.2);
    stroke(8, FL, Wp - 8, FL, 1.1, 1.2, 0.3, true);   // the flap's lower edge: one heavier line, a stitch line under it
    dashed(stroke, 35, wob(5, [12, FL - 8], [Wp - 12, FL - 8], 0.8), 0.7, 0.18);
    dashed(stroke, 36, wob(6, [26, 28], [26, FL - 22], 0.8), 0.7, 0.18); dashed(stroke, 37, wob(7, [Wp - 26, 28], [Wp - 26, FL - 22], 0.8), 0.7, 0.18); dashed(stroke, 38, wob(8, [26, 28], [Wp - 26, 28], 0.8), 0.7, 0.18);
    stroke(Wp / 2, 24, Wp / 2, FL - 26, 0.9, 0.9, 0.12, true);   // a seam up the middle of the pocket
    for (let i = 0; i < 16; i++) { const x = 12 + h(i, 1) * (Wp - 24), y = 12 + h(i, 2) * (Hp - 24), l = 8 + 22 * h(i, 3); stroke(x, y, x + l * (h(i, 4) - 0.5), y + l * 0.6, 1.4 + 2 * h(i, 5), 0.8, 0.04 + 0.07 * h(i, 6), true); }   // scuffs and smudges
  };
  const side = (k) => (stroke, h) => {
    const Wp = 128, Hp = 128;
    dashed(stroke, 40 + k, wob(k, [8, 8], [Wp - 8, 8], 0.6, 8), 0.7, 0.18); dashed(stroke, 44 + k, wob(k + 1, [8, Hp - 8], [Wp - 8, Hp - 8], 0.6, 8), 0.7, 0.18);
    for (let i = 0; i < 8; i++) { const x = h(i, 1) * Wp, y = h(i, 2) * Hp, l = 6 + 14 * h(i, 3); stroke(x, y, x + l * (h(i, 4) - 0.5), y + l * 0.6, 1.2 + 1.6 * h(i, 5), 0.8, 0.04 + 0.06 * h(i, 6), true); }
  };
  const mats = seeds.map((sd, k) => { const m = clothMat(cream, { roughness: 0.92 }); m.map = k === 5 ? paintTex(192, 192, sd, 0.92, 0.03, back) : paintTex(128, 128, sd, 0.92, 0.03, side(k)); return m; });
  const pack = new THREE.Mesh(g, mats); pack.castShadow = pack.receiveShadow = true; pack.position.set(0, cyP, zf - D / 2); ch.potatoParts.add(pack);
  // two orange tabs hanging from the flap's lower edge, each ending in a graphite buckle plate
  const gm = new THREE.MeshStandardMaterial({ color: "#3a3d42", roughness: 0.5, metalness: 0.2 }); gm.userData.lookRole = "cloth";
  for (const s of [-1, 1]) { const t = mesh(roundedBox(0.026, 0.07, 0.007, 0.003, 2), clothMat(C.strap || "#c8581f")); t.position.set(s * 0.085, cyP + 0.004, zf - D - 0.003); pack.parent.add(t); const b = mesh(roundedBox(0.036, 0.026, 0.012, 0.004, 2), gm); b.position.set(s * 0.085, cyP - 0.03, zf - D - 0.005); pack.parent.add(b); }
  // the two shoulder straps: padded orange bands from the pack's top corners over the shoulder (above the arm's root) down the chest
  const sm = clothMat(C.strap || "#c8581f", { side: THREE.DoubleSide }); sm.map = paintTex(256, 64, 9.1, 0.9, 0.04, (stroke, h) => {
    dashed(stroke, 51, wob(1, [4, 10], [252, 10], 0.5, 10), 0.7, 0.2); dashed(stroke, 52, wob(2, [4, 54], [252, 54], 0.5, 10), 0.7, 0.2);
    for (let i = 0; i < 24; i++) { const x = h(i, 1) * 256, y = 14 + 36 * h(i, 2), l = 4 + 9 * h(i, 3); stroke(x, y, x + l, y + 1.5 * (h(i, 4) - 0.5), 0.8, 0.4, 0.06, h(i, 5) < 0.4); }
  });
  const collarPh = (th) => FRONT + (BACK - FRONT) * 0.5 * (1 - Math.cos(th));
  for (const s of [-1, 1]) {
    const cp = [[2.84, 0.3], [2.4, 0.22], [1.95, 0.15], [1.5, 0.08], [1.15, -0.1], [0.95, -0.35], [0.85, -0.62]].map(([th, ph]) => V(s * th, ph, 0)), cur = new THREE.CatmullRomCurve3(cp, false, "centripetal");
    const pathAt = (u) => { const p = cur.getPointAt(u); return [p.x, p.y]; };
    const at = (u, v, off) => {
      const [th, ph] = pathAt(u), [t2, p2] = pathAt(Math.min(1, u + 0.01)), [t1, p1] = pathAt(Math.max(0, u - 0.01)), sf = ch.surf(th, ph), a = ch.surf(t2, p2).pos.sub(ch.surf(t1, p1).pos).normalize(), sd = a.clone().cross(sf.normal).normalize();
      const over = Math.exp(-(((ph - collarPh(th)) / 0.1) ** 2)), lift = 0.045 + 0.026 * over;   // rides up and over the collar roll
      return sf.pos.addScaledVector(sf.normal, lift + off).addScaledVector(sd, (v - 0.5) * 0.036 * (1 - 0.15 * smooth(0.8, 1, u)));
    };
    ch.potatoParts.add(mesh(slab(40, 3, at, 0.01, s > 0), sm));
    const e = at(1, 0.5, 0.02), tab = mesh(roundedBox(0.05, 0.016, 0.012, 0.004, 2), gm); tab.position.copy(e); tab.lookAt(e.clone().add(ch.surf(s * 0.8, -0.62).normal)); ch.potatoParts.add(tab);
  }
}

// the coverall, its collar, zip, pocket, knee patches and sleeves; returns the per-frame sleeve update
function coverall(C, ch, P, out) {
  const parts = ch.potatoParts, orange = C.coverall || "#c8581f", cream = C.trim || "#efe6cf", NU = 180, NV = 36, hmax = Math.max(FRONT, BACK) - HEM;
  const neck = (th) => FRONT + (BACK - FRONT) * 0.5 * (1 - Math.cos(th));
  const G = garment(ch, { topFn: neck, top: FRONT, hem: HEM, folds: P.folds, depth: 0.012, flare: 0.01, lift: 0.024, lift0: 0.02, wave: 0.004, thick: 0.016, phase: 0.9 + P.seed * 0.01, grad: 0.2, segs: NU, rows: NV });
  gridUv(G.outer, NU, NV, (i, j) => { const th = (i / NU) * TAU, tp = neck(th); return [i / NU, (tp + (HEM - tp) * (j / NV) - HEM) / hmax]; });
  const m = clothMat(orange, { side: THREE.DoubleSide, vertexColors: true }); m.map = coverallTex(P.seed, hmax);
  parts.add(mesh(G.outer, m)); parts.add(mesh(G.inner, liningMat(shade(orange, 0.6)), false)); parts.add(mesh(G.hem, clothMat(orange, { side: THREE.DoubleSide }), false));
  { const ig = foldInk(G, { width: 0.006 }); if (ig) parts.add(inkMesh(ig, orange)); }
  // the cloth point at (th, ph), `off` m out from the lining (off = thick 0.016 is the cloth's face): pockets and patches ride on it
  const onCloth = (th, ph, off) => { const tp = neck(th); return G.at(th, Math.max(0, Math.min(1, (ph - tp) / (HEM - tp))), off); };
  // the rolled cream collar ring on the top edge, ribbed by hand
  { const bn = 160, bv = 16, g = band(ch, { ph: FRONT, tilt: BACK - FRONT, w: P.collar, t: P.collar * 0.95, lift: 0.014, round: 1, segs: bn }); gridUv(g, bn, bv, (i, j) => [i / bn, j / bv]);
    const rm = clothMat(cream, { side: THREE.DoubleSide }); rm.map = ribTexture(46, 1024, 64, P.seed + 1.9); parts.add(mesh(g, rm)); }
  // the zip down the front: a tape a shade darker, a pale line of teeth, a pull under the collar
  { const from = FRONT - P.collar / ch.ry * 0.5, to = HEM + 0.06;
    const tapeG = tubeOn(ch, (t) => [0, from + (to - from) * t, 0.043], 24, () => 0.009), teethG = tubeOn(ch, (t) => [0, from + (to - from) * t, 0.05], 24, () => 0.0035);
    const tape = mesh(tapeG, clothMat(shade(orange, 0.72)), false); tape.userData.flat = 0.4; parts.add(tape);
    const tm = new THREE.MeshStandardMaterial({ color: "#d8d0b8", roughness: 0.45, metalness: 0.4 }); tm.userData.lookRole = "cloth"; parts.add(mesh(teethG, tm, false));
    const s = ch.surf(0, from - 0.02), pull = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.034, 0.006), tm); pull.position.copy(s.pos).addScaledVector(s.normal, 0.058); pull.lookAt(s.pos.clone().addScaledVector(s.normal, 1)); parts.add(pull); }
  // the chest pocket (wearer's left, +x): a stitched pouch and a flap over its top with a button
  { const th0 = P.pocketTh, ph0 = P.pocketPh, w = lenTh(ch, P.pocketW, ph0), h = lenPh(ch, P.pocketH), fl = lenPh(ch, P.pocketH * 0.42);
    const pm = clothMat(shade(orange, 0.96), { side: THREE.DoubleSide }); pm.map = patchTex(P.seed + 3.1, 128, 128);
    parts.add(mesh(slab(10, 8, (u, v, off) => onCloth(th0 + (u - 0.5) * w, ph0 - v * h, 0.016 + 0.003 + off), 0.006), pm, false));
    const fm = clothMat(shade(orange, 0.9), { side: THREE.DoubleSide }); fm.map = patchTex(P.seed + 4.7, 128, 64, { skipTop: false });
    parts.add(mesh(slab(10, 5, (u, v, off) => onCloth(th0 + (u - 0.5) * (w * 1.06), ph0 + lenPh(ch, 0.004) - v * fl * (1 + 0.3 * (1 - Math.abs(u - 0.5) * 2)), 0.016 + 0.007 + off), 0.006), fm, false));
    const bt = onCloth(th0, ph0 - fl * 0.98, 0.016 + 0.017), btn = mesh(new THREE.SphereGeometry(0.0095, 10, 8).scale(1, 1, 0.5), clothMat(shade(orange, 0.7), { roughness: 0.6 }), false); btn.position.copy(bt); parts.add(btn); }
  // two knee-height patches low on the front, a stitched border and cross stitches each
  for (const s of [-1, 1]) { const th0 = s * 0.56, ph0 = P.kneePh, w = lenTh(ch, 0.075, ph0), h = lenPh(ch, 0.085);
    const km = clothMat(shade(orange, 0.86), { side: THREE.DoubleSide }); km.map = patchTex(P.seed + 6.3 + s, 128, 128, { cross: true, margin: 8 });
    parts.add(mesh(slab(8, 8, (u, v, off) => onCloth(th0 + (u - 0.5) * w, ph0 - (v - 0.5) * h, 0.016 + 0.003 + off), 0.005), km, false)); }
  // foreman: one white band 0.07 high round the chest, with a stitched edge each side
  if (P.band) { const bm = clothMat(C.band || "#f6f3ec", { side: THREE.DoubleSide }); bm.map = paintTex(1024, 32, P.seed + 8.2, 0.94, 0.03, (stroke, h) => {
      dashed(stroke, 61, wob(1, [0, 5], [1024, 5], 0.6, 40), 0.7, 0.16); dashed(stroke, 62, wob(2, [0, 27], [1024, 27], 0.6, 40), 0.7, 0.16);
      for (let i = 0; i < 40; i++) { const x = h(i, 1) * 1024, l = 6 + 14 * h(i, 3); stroke(x, 9 + 14 * h(i, 2), x + l, 9 + 14 * h(i, 2) + 1.5 * (h(i, 4) - 0.5), 0.9, 0.4, 0.06, h(i, 5) < 0.5); } });
    const bn = 160, g = band(ch, { ph: P.bandPh, w: 0.035, t: 0.008, lift: 0.04, round: 0.3, segs: bn }); gridUv(g, bn, 16, (i, j) => [i / bn, j / 16]); parts.add(mesh(g, bm, false)); }
  const armM = clothMat(orange, { side: THREE.DoubleSide }); armM.map = sleeveTex(P.seed + 2.2);
  const cuffM = clothMat(shade(orange, 0.9), { side: THREE.DoubleSide }); cuffM.map = ribTexture(14, 256, 64, P.seed + 2.7); cuffM.map.repeat.set(1, 1);
  return sleeves(ch, armM, cuffM, { from: 0.04, gap: C.cuffGap ?? 0.062, r0: P.r0, r1: P.r1, rc: P.r1 * 0.96, cuff: 0.011, cuffAt: 0.8 });
}

function aliencrew(C, ch, out) {
  const v = C.variant || "crew", P = { ...(VARIANT[v] || VARIANT.crew) };
  Object.assign(P, v === "foreman" ? { pocketTh: 0.55, pocketPh: -0.55, pocketW: 0.075, pocketH: 0.085, kneePh: -1.0, band: true, bandPh: -0.43 }
    : v === "lifter" ? { pocketTh: 0.62, pocketPh: -0.62, pocketW: 0.1, pocketH: 0.1, kneePh: -1.0 }
    : { pocketTh: 0.6, pocketPh: -0.6, pocketW: 0.085, pocketH: 0.085, kneePh: -1.0 });
  const sl = coverall(C, ch, P, out);
  antennae(C, ch, ch.def.body.color);
  if (v === "lifter") backpack(C, ch, P);
  handColour(ch, C.hands || C.trim || "#efe6cf");
  boots(ch, C.trim || "#efe6cf");
  freckles(ch, P.seed);
  return sl;
}
// larger slate marks on the brow and the cheeks, each its own place, size and strength (the face's own freckles and the body's specks
// are the small ones); flat discs lying on the skin where the face puts its cheeks and brow
function freckles(ch, seed) {
  const pl = ch.face?.place; if (!pl) return;
  const m = new THREE.MeshStandardMaterial({ color: ch.def.body.speckColor || "#6f8496", roughness: 0.9 }); m.userData.noOutline = true;
  const spots = [];
  for (let i = 0; i < 5; i++) spots.push([(i % 2 ? 1 : -1) * (0.1 + 0.5 * hs(i, seed + 1)), 1.32 + 0.22 * hs(i, seed + 2), 0.008 + 0.006 * hs(i, seed + 3)]);   // brow (above the brows)
  for (let i = 0; i < 6; i++) spots.push([(i % 2 ? 1 : -1) * (0.64 + 0.26 * hs(i, seed + 4)), -0.12 + 0.3 * hs(i, seed + 5), 0.006 + 0.006 * hs(i, seed + 6)]);   // cheeks
  spots.forEach(([u, v, r], i) => {
    const q = pl(u, v), d = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), m); d.scale.set(1, 0.8 + 0.5 * hs(i, 9), 0.12); d.position.copy(q.pos).addScaledVector(q.normal, -0.0012); d.lookAt(q.pos.clone().add(q.normal)); d.rotation.z += hs(i, 8) * 3; ch.potatoParts.add(d);
  });
}

// ======================================================================================================================
// the Egyptian workers
// ======================================================================================================================
const KFRONT = -0.4, KHEM = -1.5;   // the kilt's waist (40 % of the standing height, floor to crown) and the elevation its hem is reached at
// the kilt hangs from the waist ring instead of following the belly: above elevation phJ the body itself, below it a bell that drops straight to
// the height yHem and opens out to `flare` times the waist's radius (ph runs on from phJ to phEnd for garment())
function skirtSurface(ch, phJ, phEnd, yHem, flare) {
  const pt = (th, ph) => {
    if (ph >= phJ) return ch.surf(th, ph).pos;
    const s0 = ch.surf(th, phJ).pos, t = Math.min(1.3, (phJ - ph) / (phJ - phEnd)), f = 1 + (flare - 1) * Math.sin(Math.min(1, t) * Math.PI / 2) ** 1.6;
    return V(s0.x * f, s0.y + (yHem - s0.y) * t, s0.z * f);
  };
  return Object.assign(Object.create(ch), { surf(th, ph) {
    if (ph >= phJ + 0.004) return ch.surf(th, ph);
    const p = pt(th, ph), e = 2e-3, a = pt(th + e, ph).sub(pt(th - e, ph)), b = pt(th, ph + e).sub(pt(th, ph - e)), n = a.cross(b).normalize();
    if (n.x * p.x + n.z * p.z < 0) n.negate();
    return { pos: p, normal: n };
  } });
}

// linen: a painted wash, fine fibre flecks and the fold lines in the fold shade, each its own place, length and strength. Pixel x runs across the cloth's width
// (th for the kilt, the khat's round-the-head), y from the cloth's top edge (0) down (H); `lines` fold lines run down it.
function linenTex(seed, W, H, lines, o = {}) {
  return paintTex(W, H, seed, 0.965, 0.025, (stroke, h) => {
    for (let i = 0; i < 260; i++) { const x = h(i, 1) * W, y = h(i, 2) * H, l = 3 + 7 * h(i, 3), dark = h(i, 6) < 0.3; stroke(x, y, x + 1.4 * (h(i, 4) - 0.5), y + l, 0.8 + 0.6 * h(i, 5), 0.4, dark ? 0.05 + 0.04 * h(i, 7) : 0.03, dark); }
    for (let k = 0; k < lines; k++) {
      const x0 = (o.span ? o.span[0] + (o.span[1] - o.span[0]) * (k + 0.2 + 0.6 * hs(k, seed)) / lines : (k + 0.2 + 0.6 * hs(k, seed)) / lines * W), y0 = H * (o.top ?? 0.08) + H * 0.35 * hs(k, seed + 1) * (o.top2 ?? 1), y1 = H * (0.7 + 0.28 * hs(k, seed + 2)), bend = (hs(k, seed + 3) - 0.5) * 14;
      if (hs(k, seed + 4) < 0.1) continue;
      const w = 1.1 + 1.6 * hs(k, seed + 5), val = (0.1 + 0.1 * hs(k, seed + 6)) * (o.k ?? 1);
      let px = x0, py = y0; for (let i = 1; i <= 6; i++) { const t = i / 6, nx = x0 + bend * Math.sin(t * 2.4 + k), ny = y0 + (y1 - y0) * t; stroke(px, py, nx, ny, w * (1 - 0.5 * t), w * (1 - 0.5 * (t + 1 / 6)), val * (1 - 0.35 * t), true); px = nx; py = ny; }
    }
  });
}
function egyptworker(C, ch, out) {
  const parts = ch.potatoParts, linen = C.linen || "#f1ece0", fold = C.fold || "#cfc7b4", seed = 7.7 + ch.def.body.height * 3;
  const linenM = (tex, o = {}) => { const m = clothMat(linen, { side: THREE.DoubleSide, ...o }); m.map = tex; return m; };
  void fold;   // the fold shade is the linen map's darkest value (0.857 x linen = #cfc7b4)
  // --- the kilt: hangs from the waist to just above the feet, wrapped right over left
  const NU = 180, NV = 30, kneck = () => KFRONT;
  const hyb = skirtSurface(ch, KFRONT, KHEM, ch.legH - 0.03, 1.06);
  const KT = 0.008, G = garment(hyb, { topFn: kneck, top: KFRONT, hem: KHEM, folds: 10, depth: 0.011, flare: 0.006, lift: 0.014, lift0: 0.01, wave: 0.004, thick: KT, phase: 0.6, grad: 0.16, segs: NU, rows: NV });
  gridUv(G.outer, NU, NV, (i, j) => [i / NU, j / NV]);
  const km = linenM(linenTex(seed, 1024, 512, 54, { top: 0.03, k: 1.3 }), { vertexColors: true });
  parts.add(mesh(G.outer, km)); parts.add(mesh(G.inner, liningMat(shade(linen, 0.78)), false)); parts.add(mesh(G.hem, clothMat(linen, { side: THREE.DoubleSide }), false));
  { const ig = foldInk(G, { width: 0.0065 }); if (ig) parts.add(inkMesh(ig, shade(linen, 0.8))); }
  const onK = (th, ph, off) => G.at(th, Math.max(0, Math.min(1, (ph - KFRONT) / (KHEM - KFRONT))), off);
  // the lapping panel (right over left, so the right = -x side lies on top): a second layer over the front from the right hip across to a
  // diagonal leading edge on the wearer's left (+x), which runs from the belt out and down to the hem
  { const th0 = -1.25, edge = (v) => 0.12 + 0.38 * v, pph = (v) => KFRONT - 0.02 + (KHEM - KFRONT + 0.02) * v;
    const panel = (u, v, off) => onK(th0 + (edge(v) - th0) * u, pph(v), KT + 0.0005 + 0.005 * smooth(0, 0.35, u) + off);
    const pm = linenM(linenTex(seed + 2.3, 1024, 512, 26, { top: 0.02 })), pg = slab(36, 18, panel, 0.006);
    parts.add(mesh(pg, pm, true));
    // the leading edge's ink: one brush line down it
    const lm = clothMat(shade(linen, 0.66), { roughness: 1 }); lm.userData.noOutline = true;
    parts.add(new THREE.Mesh(tubeLine((v) => panel(1, v, 0.0066), 24, (t) => 0.0017 * Math.sin(Math.PI * (0.1 + 0.8 * t)) + 0.0006), lm)); }
  // the hanging front fold: a pleated apron that stands off the cloth toward its hem, hung from the belt left of the middle
  { const thc = 0.16, aph = (v) => KFRONT - 0.03 + (KHEM + 0.22 - KFRONT + 0.03) * v;
    const am = linenM(linenTex(seed + 4.1, 512, 256, 10, { top: 0.06 }));
    const ag = slab(18, 14, (u, v, off) => { const hw = lenTh(ch, 0.028 + 0.028 * v, aph(v)), p = onK(thc + (u - 0.5) * 2 * hw, aph(v), KT + 0.003 + off), n = hyb.surf(thc, aph(v)).normal; const pleat = 0.006 * Math.sin((u - 0.5) * 2 * 5.4 + 0.3) * v; return p.addScaledVector(n, 0.008 + 0.018 * Math.pow(v, 1.3) + pleat); }, 0.006);
    parts.add(mesh(ag, am, true)); }
  // the belt, its knot and the two ends
  { const belt = clothMat(C.belt || "#e6dec8", { side: THREE.DoubleSide }); belt.map = linenTex(seed + 6.1, 1024, 32, 6, { top: 0.1, top2: 0.1 });
    const bn = 160, g = band(ch, { ph: KFRONT + 0.012, w: 0.014, t: 0.012, lift: 0.01, round: 1, segs: bn }); gridUv(g, bn, 16, (i, j) => [i / bn, j / 16]); parts.add(mesh(g, belt));
    const bm = clothMat(C.belt || "#e6dec8", { roughness: 0.95 }), kq = ch.surf(0.16, KFRONT + 0.015), knot = new THREE.Mesh(new THREE.SphereGeometry(0.028, 14, 10), bm);
    knot.position.copy(kq.pos).addScaledVector(kq.normal, 0.03); knot.scale.set(1.2, 0.95, 0.8); knot.lookAt(kq.pos.clone().addScaledVector(kq.normal, 1)); knot.castShadow = true; parts.add(knot);
    const ends = new THREE.Group();
    for (const s of [-1, 1]) {
      const e = mesh(tubeOn(ch, (t) => [0.16 + s * 0.05 * Math.sin(t * 2.4), KFRONT - 0.03 - 0.17 * t * (s > 0 ? 1 : 0.8), 0.034 + 0.012 * t * t], 14, (t) => 0.011 * (1 - 0.25 * t) * (t > 0.92 ? 0.5 : 1)), bm); e.userData.flat = 0.4; ends.add(e);
    }
    parts.add(ends); softFollow(ch, ends, 0.9); }
  // --- the khat: ONE draped piece of linen. It lies on the crown 1.2 cm off the skin; from the thin tan band at the forehead it goes on as a
  // hanging curtain round the sides and the back of the head (2.5 cm off the body at the band, 5 cm at its wavy lower edge, half the standing
  // height, a little lower behind), open in front from cheek to cheek. The band lies on the cloth (+2 mm) all the way round and dips a little behind.
  const BF = 0.58, BB = 0.4, bph = (th) => BF + (BB - BF) * 0.5 * (1 - Math.cos(th)), BW = 0.0125, rim = (th) => bph(th) - 0.4 * BW / ch.ry, CT = 0.004;
  const TH0 = 1.0, HEMY = 0.5 * (ch.legH + ch.H), SCALLOPS = 6, PHR = Math.PI / 2 + 0.35;
  const fr = (th) => Math.abs((((th + Math.PI) % TAU) + TAU) % TAU - Math.PI);   // the angle from the front, 0 .. pi
  const Lb = (th) => 0.012 + 0.013 * smooth(0.9, 1.6, fr(th));                   // the cloth's height off the skin at the band
  const crownAt = (u, v, off) => { const th = u * TAU, ph = Math.PI / 2 - (Math.PI / 2 - rim(th)) * v, s = ch.surf(th, ph); return s.pos.addScaledVector(s.normal, 0.012 + (Lb(th) - 0.012) * smooth(0.4, 1, v) + off); };
  const hemCache = new Map();
  const hemPh = (u) => { const k = Math.round(u * 4096); if (hemCache.has(k)) return hemCache.get(k); const th = TH0 + u * (TAU - 2 * TH0);
    const y = HEMY - 0.035 * Math.pow(Math.max(0, -Math.cos(th)), 0.7) - 0.022 * (0.5 - 0.5 * Math.cos(TAU * SCALLOPS * u));
    let lo = -1.4, hi = rim(th); for (let i = 0; i < 28; i++) { const mid = (lo + hi) / 2; if (ch.surf(th, mid).pos.y > y) hi = mid; else lo = mid; }
    hemCache.set(k, (lo + hi) / 2); return (lo + hi) / 2; };
  const curtAt = (u, w, off) => { const th = TH0 + u * (TAU - 2 * TH0), p0 = rim(th), ph = p0 + (hemPh(u) - p0) * w, s = ch.surf(th, ph), lb = Lb(th);
    const lift = lb + (0.05 - lb) * Math.pow(w, 1.15) + (0.004 + 0.009 * w) * Math.sin(th * 3.5 + 0.4) * smooth(0.04, 0.4, w); return s.pos.addScaledVector(s.normal, lift + off); };
  const crownV = (u, v) => (Math.PI / 2 - rim(u * TAU)) * v / PHR, curtV = (u, w) => { const th = TH0 + u * (TAU - 2 * TH0), p0 = rim(th); return (Math.PI / 2 - p0 + (p0 - hemPh(u)) * w) / PHR; };
  { const cm = linenM(linenTex(seed + 8.3, 1024, 512, 30, { top: 0.02, top2: 0.2, k: 1.6 })), lm = liningMat("#cfc7b4");
    const crown = { nu: 96, nv: 22, pt: (u, v) => crownAt(u, v, CT), uv: (u, v) => [u, crownV(u, v)] };
    const cw = (u) => TH0 / TAU + u * (1 - 2 * TH0 / TAU);
    const curt = { nu: 120, nv: 24, pt: (u, w) => curtAt(u, w, CT), uv: (u, w) => [cw(u), curtV(u, w)] };
    const edge = (f, uvf) => ({ nu: 24, nv: 1, pt: (s, k) => f(s, k ? 0 : CT), uv: uvf });
    const g = geoOf([crown, curt, edge((s, o) => curtAt(s, 1, o), (s) => [cw(s), curtV(s, 1)]), edge((s, o) => curtAt(0, s, o), (s) => [cw(0), curtV(0, s)]), edge((s, o) => curtAt(1, s, o), (s) => [cw(1), curtV(1, s)])]);
    parts.add(mesh(g, cm, true));
    // the inside of the cloth: a slightly darker linen, seen through the open front
    parts.add(mesh(geoOf([{ nu: 96, nv: 22, pt: (u, v) => crownAt(u, v, 0) }, { nu: 120, nv: 24, pt: (u, w) => curtAt(u, w, 0) }]), lm, false));
    // the tan band, 2 mm over the cloth's outer face wherever it runs
    const tm = clothMat(C.band || "#c9a15a", { side: THREE.DoubleSide }), pr = 2 / (2 + 6 * 0.2);
    const bg = geoOf([{ nu: 160, nv: 16, uv: (u, v) => [u, v], pt: (u, v) => { const th = u * TAU, ph = bph(th), a = v * TAU, cu = Math.cos(a), su = Math.sin(a), U = Math.sign(cu) * Math.abs(cu) ** pr, Vv = Math.sign(su) * Math.abs(su) ** pr;
      const c = ch.surf(th, ph), up = ch.surf(th, ph + 0.01).pos.sub(ch.surf(th, ph - 0.01).pos).normalize();
      return c.pos.clone().addScaledVector(up, U * BW).addScaledVector(c.normal, Lb(th) + CT + 0.002 + (Vv * 0.5 + 0.5) * 0.004); } }]);
    { const N = bg.attributes.normal; for (let j = 0; j <= 16; j++) { const a = j * 161, b = a + 160, x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); } N.needsUpdate = true; }
    tm.map = linenTex(seed + 9.2, 1024, 32, 3, { top: 0.1, top2: 0.1 }); parts.add(mesh(bg, tm)); }
  // --- bare feet: brown-tan stubs; the arms and hands are the limbs' golden skin
  handColour(ch, C.hands || "#f9b75c");
  { const fm = ch.limbMat.clone(); fm.color.set(C.feet || "#b98a5a"); fm.userData = { ...ch.limbMat.userData, noOutline: true };
    for (const s of ["L", "R"]) { const f = ch.legs?.[s]?.foot; if (f) f.material = fm; } }
  return () => {};
}
// a thin brush-line tube along P(v) -> Vector3
function tubeLine(P, n, r) {
  const pts = []; for (let i = 0; i <= n; i++) pts.push(P(i / n));
  const c = new THREE.CatmullRomCurve3(pts), g = new THREE.TubeGeometry(c, n * 2, 1, 5, false), p = g.attributes.position, q = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i <= n * 2; i++) { c.getPointAt(i / (n * 2), q); const k = r(i / (n * 2)); for (let j = 0; j <= 5; j++) { const m = i * 6 + j; v.fromBufferAttribute(p, m).sub(q).multiplyScalar(k).add(q); p.setXYZ(m, v.x, v.y, v.z); } }
  g.computeVertexNormals(); return g;
}

// ---- the sash ends sway with the body: the engine's follow-through (ft) applied to a group, held at its top (as softFollow, costumes-art.js)
function softFollow(ch, group, amount) {
  const geos = []; group.traverse((m) => { if (m.isMesh && m.geometry?.attributes?.position) geos.push(m.geometry); });
  if (!geos.length) return;
  let yTop = -Infinity, yBot = Infinity;
  for (const g of geos) { const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const y = P.getY(i); if (y > yTop) yTop = y; if (y < yBot) yBot = y; } }
  const L = Math.max(0.05, yTop - yBot), rest = geos.map((g) => g.attributes.position.array.slice());
  let last = "";
  (ch.softParts ??= []).push((ft) => {
    const f = (ft?.f || 0) * amount, sd = (ft?.s || 0) * amount, u = (ft?.u || 0) * amount, key = `${f}|${sd}|${u}`;
    if (key === last) return; last = key;
    geos.forEach((g, gi) => {
      const P = g.attributes.position, R = rest[gi];
      for (let i = 0; i < P.count; i++) {
        const x = R[i * 3], y = R[i * 3 + 1], z = R[i * 3 + 2], d = Math.max(0, Math.min(1, (yTop - y) / L)), w = d ** 1.5 * L;
        let dx = sd * w, dz = f * w;
        const r = Math.hypot(x, z) || 1, nx = x / r, nz = z / r, into = dx * nx + dz * nz;
        if (into < 0) { dx -= nx * into * 0.85; dz -= nz * into * 0.85; }
        const dy = 0.35 * (Math.hypot(dx, dz) ** 2) / Math.max(0.05, w) - u * w * 0.3;
        P.setXYZ(i, x + dx, y + dy, z + dz);
      }
      P.needsUpdate = true; g.computeBoundingSphere();
    });
  });
}

export const ALIEN_TYPES = ["aliencrew", "egyptworker"];
export function aliens(C, ch, out) {
  const sl = C.type === "aliencrew" ? aliencrew(C, ch, out) : egyptworker(C, ch, out);
  const base = out.apply;
  out.apply = (st, t, ...r) => { base && base(st, t, ...r); sl(); };
  out.sitDepth = 0;
  return out;
}
