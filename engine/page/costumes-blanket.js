import * as THREE from "three";
import { clothMat, liningMat, sstep } from "./costumes-art.js";
import { texOf, wash, hash2 } from "./costumes-art-cast.js";

// Chip's SHOCK BLANKET (Kid vs Dad 01 "BREAKING: Dad has told 4,000 dad jokes", DESIGN.md section 5): a grey wool blanket
// round his shoulders like a disaster survivor's, a costume piece on a Chip variant (characters/potatobrawl/chip-blanket.json),
// NOT the `huddleblanket` prop (a fixed cape for adult bodies). Not a prop: nothing grips it.
//
// USAGE (costume keys on the chip costume; everything has a default, nothing here runs without `blanket`)
//   blanket   true | 1 | { ... }   the cape is on. An object may override: color "#8b9098" (wool), fold "#6c717a" (shade), lit "#a9aeb5",
//             stripe "#59606b"
//   slip      0..1, driven by the timeline's `wings` action ({ "do": "wings", "to": 0..1 }; st.slip is read first, as the teller's
//             glasses slip). Plain numbers of DESIGN section 5; heights are above his underside, Hh = his body height (0.53):
//               0     wrapped (panels 01, 04): roll round the shoulders (0.66 Hh at the back, 0.57 at the sides, ending 42 degrees each
//                     side of the front at 0.47 Hh; the yellow V and both drawstrings stay in view), a bell hanging from it (0.022 off the
//                     hoodie at the roll, 0.05 halfway, 0.075 at the hem), 5 soft folds 0.014 deep, hem 0.05 Hh at the back and sides and
//                     0.20 Hh across the front 120 degrees so gloves and a mug in the `lap` pose sit under it; the front edges fall from
//                     the roll's ends to the hem 30 degrees each side of the front (a 0.30 gap); a 0.11 bulge over each arm root (side,
//                     0.33 Hh) so the arms rest inside. Cloth 0.016 thick, two stripe lines 0.05 above the hem breaking at each fold.
//               0.4   both front panels swung back to 100 degrees each side, roll ends at 60 degrees, the whole cape 0.03 lower and his
//                     right (-x) side 0.02 lower again, no arm bulge (0..0.4 blends there, set it on a cut)
//               0.4-1 slides down his back, hem first, stacking (0.6 s = the director's timing of the `wings` action); never a fade
//               1     a heap 0.50 x 0.34 x 0.09 on the grass, centre 0.32 BEHIND him (his root x, z and yaw), 5 ridges. It keeps its
//                     place: none of his squash, lean, pitch or hop (the heap is counter-transformed every frame; ground is y 0)
//   Chip's arms use only rest and `lap` while slip < 0.3; he sits 0.09 further forward than without it; he does not walk after slip > 0.7
//   (acting, the director's call). The cape meets a bench back 0.20 behind the seat's middle (body centre 0.13 forward of it).
// Everything is built once and re-filled only when its inputs change (slip, and for slip > 0.4 his root transform); the same inputs
// give the same cloth, no random numbers, no clock.

const DEG = Math.PI / 180, TAU = Math.PI * 2;
const NU = 120, NV = 26, ROLL_R = 0.022, THICK = 0.016, FOLDS = 5, HEAP = { x: 0.25, z: 0.17, h: 0.09, behind: 0.32 };
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (a, b, x) => sstep(a, b, x);
const lerp = (a, b, k) => a + (b - a) * k;

// the wool: flecks (160, each its own place, length, angle and weight), a soft wash, and the two stripe lines 0.05 above the hem,
// each a gap at the fold crests. u = angle round (0..1), v = metres from the hem / VSPAN.
const TW = 1024, TH = 512, VSPAN = 0.4;
const fold = (th) => Math.sin(FOLDS * th + 0.6 + 0.45 * Math.sin(2 * th + 1.1));   // 5 uneven soft folds round the cape, -1..1
function woolTexture(stripeCol, hemEdge) {
  const buf = wash(TW, TH, 90, 6.3, 0.028);
  for (let k = 0; k < buf.length; k++) buf[k] += 0.93;
  const lift = new Float32Array(TW * TH);
  const stroke = (x0, y0, x1, y1, w, val, dark) => {
    const pad = w + 1.5, xa = Math.floor(Math.min(x0, x1) - pad), xb = Math.ceil(Math.max(x0, x1) + pad), ya = Math.max(0, Math.floor(Math.min(y0, y1) - pad)), yb = Math.min(TH - 1, Math.ceil(Math.max(y0, y1) + pad));
    const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1;
    for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
      const u = cl(((x - x0) * dx + (y - y0) * dy) / l2), d = Math.hypot(x - (x0 + dx * u), y - (y0 + dy * u)), a = 1 - sm(w - 1, w + 0.8, d); if (a <= 0) continue;
      const q = y * TW + (((x % TW) + TW) % TW);
      if (dark) lift[q] = Math.min(lift[q], -a * val); else if (lift[q] >= 0) lift[q] = Math.max(lift[q], a * val);
    }
  };
  for (let i = 0; i < 160; i++) {
    const h = (n) => hash2(i * 3.17 + n * 11.3 + 6.3, i * 0.71 + n * 1.7 + 2.33);
    const x = h(1) * TW, y = h(2) * TH, len = 8 + 14 * h(3), a = (h(4) - 0.5) * 1.3, w = 1.6 + 1.8 * h(5), dark = h(6) < 0.45;
    stroke(x, y, x + Math.sin(a) * len * 1.7, y + Math.cos(a) * len * 0.7, w, dark ? 0.09 + 0.07 * h(7) : 0.045 + 0.04 * h(7), dark);
  }
  for (let k = 0; k < buf.length; k++) buf[k] += lift[k];
  // the stripes: 2 lines 0.012 wide, 0.012 apart, the first from 0.05 above the hem; no line across a fold crest
  const sv = stripeCol;
  for (let x = 0; x < TW; x++) {
    const th = hemEdge + (TAU - 2 * hemEdge) * (x / TW);
    if (fold(th) > 0.86) continue;
    for (const [d0, d1] of [[0.05, 0.062], [0.074, 0.086]]) for (let y = Math.round((d0 / VSPAN) * TH); y < Math.round((d1 / VSPAN) * TH); y++) buf[y * TW + x] = Math.min(buf[y * TW + x], sv);
  }
  return texOf(buf, TW, TH, false);
}

export function blanket(C, ch, out) {
  const O = C.blanket && typeof C.blanket === "object" ? C.blanket : {};
  const parts = ch.potatoParts; if (!parts) return out;
  const Hh = ch.H, y0 = ch.cy - ch.ry;   // his underside
  // ---- one shape function: the worn cape in his body's frame, parametrised (i along, j down) for a given blend s0 (0..0.4 -> 0..1)
  const wornAt = (i, v, s0, T) => {
    const e0 = lerp(42, 60, s0) * DEG, e1 = lerp(30, 100, s0) * DEG;
    const edge = (vv) => lerp(e0, e1, vv);
    const thAt = (vv) => { const e = edge(vv); return e + (TAU - 2 * e) * (i / NU); };
    const wrap = (t) => (t > Math.PI ? t - TAU : t);
    // top and hem heights are fixed by the column: the top where the column leaves the roll, the hem where it ends
    const thT = wrap(thAt(0)), thH = wrap(thAt(1)), A = (t) => Math.abs(t);
    const topH = (t) => (A(t) >= 90 * DEG ? 0.57 + 0.09 * sm(90 * DEG, Math.PI, A(t)) : 0.57 - 0.10 * cl((90 * DEG - A(t)) / (48 * DEG)));
    const hemH = (t) => 0.05 + 0.15 * sm(75 * DEG, 45 * DEG, A(t));
    const drop = (t) => s0 * (0.03 + 0.02 * sm(0, 0.8, -Math.sin(t)));
    const yT = y0 + topH(thT) * Hh - drop(thT), yH = Math.max(y0 + hemH(thH) * Hh - drop(thH), y0 - 0.012);
    const th = wrap(thAt(v)), y = lerp(yT, yH, v);
    const ph = y > ch.cy ? Math.asin(cl((y - ch.cy) / ch.ry, -1, 0.97)) : 0, S = ch.surf(th, ph);
    const nx = S.normal.x, nz = S.normal.z, nl = Math.hypot(nx, nz) || 1;
    // offset from the body: the bell (0.022 at the roll, 0.05 halfway, 0.075 at the hem), clear of the rolled cowl just under the roll
    let off = 0.022 + 0.059 * v - 0.006 * v * v + 0.03 * (1 - sm(0, 0.25, v));
    const arm = Math.exp(-(((A(th) - 79 * DEG) / (24 * DEG)) ** 2)) * Math.exp(-(((y - (y0 + 0.33 * Hh)) / 0.11) ** 2));
    off += Math.max(0, 0.11 - off) * arm * (1 - s0);
    const f = fold(th), fs = 0.7 * f + 0.3 * Math.sign(f) * Math.abs(f) ** 0.4;
    off += 0.014 * Math.pow(v, 1.2) * fs;
    const shade = (f > 0 ? 1 + 0.54 * f : 1 + 0.41 * f) * (1.04 - 0.1 * v);
    const dist = (1 - v) * (y0 + topH(wrap(e0 + (TAU - 2 * e0) * (i / NU))) * Hh - Math.max(y0 + hemH(wrap(e1 + (TAU - 2 * e1) * (i / NU))) * Hh, y0 - 0.012));   // metres from the hem along the worn cloth at rest
    T.pos.set(S.pos.x + (nx / nl) * off, y, S.pos.z + (nz / nl) * off); T.shade = shade; T.dist = dist; T.th = th;
    return T;
  };
  // ---- the heap, in its own frame (x across, z away from him is -z, y up from the grass): the cloth bunched round a centre,
  // hem on the outside, roll on top, 5 ridges; both of its faces are given with a lift (outer = +THICK)
  const heapAt = (i, v, T) => {
    const phi = (i / NU) * TAU, a = (0.04 + (HEAP.x - 0.04) * Math.pow(v, 0.9)), b = a * (HEAP.z / HEAP.x);
    const ridge = Math.cos(FOLDS * phi + 0.4 + 0.5 * Math.sin(2 * phi + 0.7)), h0 = 0.012 + (HEAP.h - 0.045) * Math.pow(1 - v, 0.75);
    const k = 1 + 0.08 * Math.sin(3 * phi + 1.3) * v;
    T.set(Math.sin(phi) * a * k, h0 + 0.022 * ridge * (1 - 0.3 * v) * (0.5 + 0.5 * v) + 0.006 * ridge, Math.cos(phi) * b * k);
    return T;
  };
  // ---- grids: outer (0..N-1), inner (N..2N-1), plus the roll
  const N = (NU + 1) * (NV + 1), RN = 14, RU = NU + 1;
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 2 * 3), col = new Float32Array(N * 2 * 3), uv = new Float32Array(N * 2 * 2);
  const idxOuter = [], idxInner = [], idxEdge = [];
  const id = (i, j) => j * (NU + 1) + i;
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) {
    const a = id(i, j), b = id(i + 1, j), c = id(i, j + 1), d = id(i + 1, j + 1);
    idxOuter.push(a, c, b, b, c, d); idxInner.push(N + a, N + c, N + b, N + b, N + c, N + d);
  }
  const quad = (o1, o2, i1, i2) => idxEdge.push(o1, o2, N + i1, o2, N + i2, N + i1);   // an edge strip between the two faces: o1-o2 on the outer face
  for (let i = 0; i < NU; i++) { const a = id(i, NV), b = id(i + 1, NV); quad(a, b, a, b); }   // the hem
  for (let j = 0; j < NV; j++) { for (const i of [0, NU]) { const a = id(i, j), b = id(i, j + 1); quad(a, b, a, b); } }   // the two front edges
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  const all = [...idxOuter, ...idxInner, ...idxEdge]; geo.setIndex(all);
  geo.addGroup(0, idxOuter.length, 0); geo.addGroup(idxOuter.length, idxInner.length, 1); geo.addGroup(idxOuter.length + idxInner.length, idxEdge.length, 2);
  const wool = clothMat(O.color || "#8b9098", { side: THREE.FrontSide, vertexColors: true }); wool.map = woolTexture(0.66, 30 * DEG);
  const inside = clothMat(O.fold || "#6c717a", { side: THREE.BackSide, role: "lining" }); inside.vertexColors = true;
  const edgeM = clothMat(O.fold || "#6c717a", { side: THREE.DoubleSide, vertexColors: true });
  const cape = new THREE.Mesh(geo, [wool, inside, edgeM]); cape.castShadow = cape.receiveShadow = true; cape.frustumCulled = false;
  // the roll
  const rgeo = new THREE.BufferGeometry(), rpos = new Float32Array(RU * RN * 3), rcol = new Float32Array(RU * RN * 3), ruv = new Float32Array(RU * RN * 2), ridx = [];
  for (let i = 0; i < NU; i++) for (let k = 0; k < RN; k++) { const a = i * RN + k, b = i * RN + ((k + 1) % RN), c = (i + 1) * RN + k, d = (i + 1) * RN + ((k + 1) % RN); ridx.push(a, c, b, b, c, d); }
  for (let i = 0; i < RU; i++) for (let k = 0; k < RN; k++) { const q = i * RN + k; ruv[q * 2] = i / NU; ruv[q * 2 + 1] = 0.55 + 0.3 * (k / RN); rcol[q * 3] = rcol[q * 3 + 1] = rcol[q * 3 + 2] = 1; }
  rgeo.setAttribute("position", new THREE.BufferAttribute(rpos, 3)); rgeo.setAttribute("color", new THREE.BufferAttribute(rcol, 3)); rgeo.setAttribute("uv", new THREE.BufferAttribute(ruv, 2)); rgeo.setIndex(ridx);
  const roll = new THREE.Mesh(rgeo, wool); roll.castShadow = true; roll.frustumCulled = false;
  const grp = new THREE.Group(); grp.add(cape, roll); grp.visible = true; parts.add(grp);

  // static texture coordinates and colours: from the cape at rest (slip 0) so they do not slide when the edge angle moves
  const T = { pos: new THREE.Vector3(), shade: 1, dist: 0, th: 0 };
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    wornAt(i, j / NV, 0, T); const q = id(i, j);
    uv[q * 2] = i / NU; uv[q * 2 + 1] = T.dist / VSPAN; uv[(N + q) * 2] = uv[q * 2]; uv[(N + q) * 2 + 1] = uv[q * 2 + 1];
    for (const o of [q, N + q]) col[o * 3] = col[o * 3 + 1] = col[o * 3 + 2] = T.shade;
  }
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _h = new THREE.Vector3(), _n = new THREE.Vector3(), _t = new THREE.Vector3(), _bb = new THREE.Vector3(), _c = new THREE.Vector3(), _M = new THREE.Matrix4(), _Td = new THREE.Matrix4(), _L = new THREE.Matrix4(), _Q = new THREE.Quaternion(), _E = new THREE.Euler(0, 0, 0, "YXZ");
  const ease = (p) => p * p * (3 - 2 * p);
  let last = null;
  const fill = (slip, st) => {
    const s0 = cl(slip / 0.4), u = cl((slip - 0.4) / 0.6), slide = u > 0;
    // the heap's frame in his root's parent: his root x, z and yaw, the grass at y 0; counter-transform it into his parts' frame
    if (slide) {
      const R = ch.root, BG = ch.bodyGroup; R.updateMatrix(); BG.updateMatrix(); parts.updateMatrix();
      _L.copy(R.matrix).multiply(BG.matrix).multiply(parts.matrix);
      const yaw = st.yaw || 0;
      _Td.compose(_a.set(R.position.x - HEAP.behind * Math.sin(yaw), 0, R.position.z - HEAP.behind * Math.cos(yaw)), _Q.setFromEuler(_E.set(0, yaw, 0)), _b.set(1, 1, 1));
      _M.copy(_L).invert().multiply(_Td);
    }
    const pose = (i, j, lift, o) => {
      const v = j / NV; wornAt(i, v, s0, T); _n.copy(T.pos);
      // the thickness: outward by lift along the horizontal normal of the cape (cheaply: along the body's radial direction)
      const rl = Math.hypot(_n.x, _n.z) || 1; _n.x += (_n.x / rl) * lift; _n.z += (_n.z / rl) * lift;
      if (slide) {
        const p = ease(cl((u - 0.4 * (1 - v)) / 0.6)); heapAt(i, v, _h); _h.y += lift; _h.applyMatrix4(_M);
        const ky = 1 - (1 - p) * (1 - p), kx = p * p * (3 - 2 * p) * p;
        _n.set(lerp(_n.x, _h.x, kx), lerp(_n.y, _h.y, ky), lerp(_n.z, _h.z, kx));
      }
      o[0] = _n.x; o[1] = _n.y; o[2] = _n.z;
    };
    const buf = [0, 0, 0];
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
      const q = id(i, j);
      pose(i, j, THICK, buf); pos[q * 3] = buf[0]; pos[q * 3 + 1] = buf[1]; pos[q * 3 + 2] = buf[2];
      pose(i, j, 0, buf); pos[(N + q) * 3] = buf[0]; pos[(N + q) * 3 + 1] = buf[1]; pos[(N + q) * 3 + 2] = buf[2];
    }
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
    // the roll: along the top row (the same path, centre half way through the cloth), a tube of ROLL_R, rounded at both ends
    const C = []; for (let i = 0; i <= NU; i++) { pose(i, 0, THICK * 0.5, buf); C.push(new THREE.Vector3(buf[0], buf[1], buf[2])); }
    for (let i = 0; i <= NU; i++) {
      _t.subVectors(C[Math.min(NU, i + 1)], C[Math.max(0, i - 1)]).normalize();
      _bb.set(0, 1, 0).addScaledVector(_t, -_t.y).normalize(); _c.crossVectors(_t, _bb).normalize();
      const e = Math.min(i, NU - i) / 7, r = ROLL_R * (e >= 1 ? 1 : Math.sqrt(Math.max(0, 1 - (1 - e) * (1 - e))));
      for (let k = 0; k < RN; k++) { const al = (k / RN) * TAU, q = i * RN + k; rpos[q * 3] = C[i].x + r * (Math.cos(al) * _c.x + Math.sin(al) * _bb.x); rpos[q * 3 + 1] = C[i].y + r * (Math.cos(al) * _c.y + Math.sin(al) * _bb.y); rpos[q * 3 + 2] = C[i].z + r * (Math.cos(al) * _c.z + Math.sin(al) * _bb.z); }
    }
    rgeo.attributes.position.needsUpdate = true; rgeo.computeVertexNormals();
  };
  const base = out.apply;
  out.apply = (st, t, ...r) => {
    base && base(st, t, ...r);
    const slip = cl(st.slip ?? st.wings ?? 0), slide = slip > 0.4;
    let key = `${slip}`;
    if (slide) { const R = ch.root; key += `|${R.position.x},${R.position.y},${R.position.z},${st.yaw || 0},${st.pitch || 0},${st.lean || 0},${st.scale ?? 1},${ch.bodyGroup.scale.x},${ch.bodyGroup.scale.y},${ch.bodyGroup.scale.z}`; }
    if (key !== last) { last = key; fill(slip, st); }
  };
  return out;
}
