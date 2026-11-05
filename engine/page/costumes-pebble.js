import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rng } from "./util.js";

// PEBBLE, the calm old tortoise (Jonny's final sheet, 5 Nov 2026: characters/pebble/pebble.json, def.build "core",
// costume.type "pebble"). potato.js builds the torso (def.body, golden ochre skin), the big separate head with its snout
// (def.head.muzzle) and face, the short arms with three-finger gloves and the thick legs; this file adds what makes him
// Pebble: the brown newsboy cap (turns with the head), the cream belly plate, the open olive vest with tan trim and one
// button on his LEFT, the big domed shell of fitted stone scutes on his back with a tan rim, the moss cushion over its
// top and ONE fern growing from the upper rear of the shell (it sways), and wide flat feet with three toes.
// Sides are anatomical: his RIGHT is -x, LEFT +x, forward +z. Returns the object costumes.js buildCostume returns.

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...o });
const mesh = (g, m, shadow = true) => { const x = new THREE.Mesh(g, m); x.castShadow = shadow; x.receiveShadow = true; return x; };
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const col = (h) => new THREE.Color(h);

export function pebbleCostume(def, ch) {
  const C = def.costume || {};
  const out = { tip: null, prop: null, hat: null, hatBrim: null, helmet: null, propAxis: () => null, propLine: () => null, apply() {} };
  const live = [];
  const cap = buildCap(ch, C); out.hat = cap.group; out.hatBrim = { group: cap.group, r: cap.brimR };
  belly(ch, C);
  vest(ch, C);
  spots(ch, C);
  const shell = buildShell(ch, C);
  live.push(shell.update);
  feet(ch, C);
  out.shell = shell.group;
  out.apply = (st, t, hands, fries) => { for (const f of live) f(st, t, hands, fries); };
  return out;
}

// ---------------------------------------------------------------- the cap: a soft brown newsboy cap on the head
// (head group space: origin at the head's centre). A puffed crown leaning a little forward, a band, six soft panel
// seams to a cloth button on top, and a short curved brim over the eyes. children[0] is the brim (looks.js hat shade)
function buildCap(ch, C) {
  const H = ch.head, K = C.cap || {};
  const capM = std(K.color || "#9B613C", { roughness: 0.9 }); capM.userData.lookRole = "cloth";
  const darkM = std(new THREE.Color(K.color || "#9B613C").multiplyScalar(0.78), { roughness: 0.9 }); darkM.userData.lookRole = "cloth";
  const g = new THREE.Group(); g.name = "pebble-cap";
  // the band sits at yb on the head; its radii clear the head there by `gap`
  const yb = H.ry * (K.band ?? 0.42), gap = K.gap ?? 0.012;
  // the head's horizontal radii at the band's height (from headPoint on that ring)
  let bx = 0, bz = 0;
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2, el = Math.asin(Math.max(-1, Math.min(1, yb / H.ry)));
    const p = ch.headPoint(new THREE.Vector3(Math.sin(a) * Math.cos(el), Math.sin(el), Math.cos(a) * Math.cos(el)));
    bx = Math.max(bx, Math.abs(p.x)); bz = Math.max(bz, Math.abs(p.z));
  }
  const rx = bx + gap, rz = bz + gap;
  // the crown: an upper ellipsoid from the band up, puffed out over the band (a newsboy's soft overhang) and leaning
  // forward so its front sits over the brim
  const cr = K.crown || [1.12, 1.1], ch_ = H.ry - yb + (K.over ?? 0.07), lean = K.lean ?? 0.12;
  const cg = new THREE.SphereGeometry(1, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.62), P = cg.attributes.position, v = new THREE.Vector3();
  const cy0 = Math.cos(Math.PI * 0.62);   // the lowest row's y (negative: the crown tucks back in to the band)
  for (let i = 0; i < P.count; i++) {
    v.fromBufferAttribute(P, i);
    const up = (v.y - cy0) / (1 - cy0);                     // 0 at the band, 1 at the top
    const puff = 1 + (cr[0] - 1) * Math.sin(Math.PI * Math.min(1, up * 1.25)) ** 0.8;   // widest a little above the band
    const x = v.x * rx * puff, z = v.z * rz * puff * (cr[1] / cr[0]) + lean * ch_ * up, y = yb + up * ch_;
    P.setXYZ(i, x, y, z);
  }
  cg.computeVertexNormals();
  const crown = mesh(cg, capM);
  // the brim: a crescent in front, from the band out, curving down a little at its front
  const bw = K.brim ?? 0.085, ang = K.brimSpan ?? 1.2, sh = new THREE.Shape();
  const N = 24;
  for (let i = 0; i <= N; i++) { const a = -ang + (2 * ang * i) / N, k = Math.cos((a / ang) * Math.PI / 2); const x = Math.sin(a) * (rx + 0.004 + bw * 0.25 * k), z = Math.cos(a) * (rz + bw * k); i ? sh.lineTo(x, z) : sh.moveTo(x, z); }
  for (let i = N; i >= 0; i--) { const a = -ang + (2 * ang * i) / N; sh.lineTo(Math.sin(a) * (rx - 0.01), Math.cos(a) * (rz - 0.01)); }
  const brimG = new THREE.ExtrudeGeometry(sh, { depth: 0.011, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 4 });
  brimG.rotateX(Math.PI / 2);   // shape y -> z; the extrusion goes down
  const bp = brimG.attributes.position;
  for (let i = 0; i < bp.count; i++) { const z = bp.getZ(i), x = bp.getX(i); const out_ = Math.max(0, Math.hypot(x / rx, z / rz) - 1); bp.setY(i, bp.getY(i) - (K.droop ?? 0.35) * out_ * out_ * 0.25); }
  brimG.computeVertexNormals();
  const brim = mesh(brimG, darkM); brim.position.y = yb + 0.006;
  g.add(brim); g.add(crown);
  // the band: a soft roll round the bottom of the crown
  const band = mesh(new THREE.TorusGeometry(1, 0.012, 8, 64), darkM, false); band.rotation.x = Math.PI / 2; band.scale.set(rx + 0.002, rz + 0.002, 1); band.position.y = yb + 0.004; g.add(band);
  // six panel seams from the button down to the band, lying on the crown
  const seamM = std(new THREE.Color(K.color || "#9B613C").multiplyScalar(0.62), { roughness: 0.9 }); seamM.userData.noOutline = true;
  const top = new THREE.Vector3();
  for (let s = 0; s < 6; s++) {
    const a = (s / 6) * Math.PI * 2 + Math.PI / 6, pts = [];
    for (let k = 0; k <= 16; k++) {
      const pol = (k / 16) * Math.PI * 0.6, d = new THREE.Vector3(Math.sin(pol) * Math.sin(a), Math.cos(pol), Math.sin(pol) * Math.cos(a));
      const up = (d.y - cy0) / (1 - cy0), puff = 1 + (cr[0] - 1) * Math.sin(Math.PI * Math.min(1, up * 1.25)) ** 0.8;
      const p = new THREE.Vector3(d.x * rx * puff, yb + up * ch_, d.z * rz * puff * (cr[1] / cr[0]) + lean * ch_ * up);
      const n = p.clone().sub(new THREE.Vector3(0, yb, 0)).normalize(); p.addScaledVector(n, 0.003); pts.push(p);
      if (k === 0) top.copy(p);
    }
    g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.0028, 5), seamM, false));
  }
  const btn = mesh(new THREE.SphereGeometry(0.022, 16, 10), darkM, false); btn.scale.y = 0.5; btn.position.copy(top); g.add(btn);
  H.group.add(g);
  return { group: g, brimR: Math.max(rx, rz) + bw };
}

// ---------------------------------------------------------------- a sheet lying on the torso between two theta edges
// (thA(ph) .. thB(ph)) from ph0 to ph1, lift metres off it; hole(th, ph) true drops a triangle (the armholes)
function surfSheet(ch, thA, thB, ph0, ph1, lift, mat, { nu = 40, nv = 32, hole = null } = {}) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) {
    const ph = ph0 + (ph1 - ph0) * (j / nv);
    for (let i = 0; i <= nu; i++) {
      const th = thA(ph) + (thB(ph) - thA(ph)) * (i / nu), s = ch.surf(th, ph);
      const p = s.pos.addScaledVector(s.normal, lift); pos.push(p.x, p.y, p.z); uv.push(th, ph);
    }
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
    if (hole) { const th = (uv[a * 2] + uv[d * 2]) / 2, ph = (uv[a * 2 + 1] + uv[d * 2 + 1]) / 2; if (hole(th, ph)) continue; }
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return mesh(g, mat);
}
// a line on the torso through (th, ph) points, lift metres off it
function surfLine(ch, pts, lift, r, mat, closed = false) {
  const p = pts.map(([th, ph]) => { const s = ch.surf(th, ph); return s.pos.addScaledVector(s.normal, lift); });
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p, closed), Math.max(8, pts.length * 2), r, 6, closed), mat, false);
}

// a running stitch along (th, ph) torso points: short dashes with gaps, one merged mesh
function dashes(ch, pts, lift, len, mat) {
  const p = pts.map(([th, ph]) => { const s = ch.surf(th, ph); return s.pos.addScaledVector(s.normal, lift); });
  const curve = new THREE.CatmullRomCurve3(p), L = curve.getLength(), n = Math.max(2, Math.floor(L / (len * 1.9))), geos = [], yUp = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, c = curve.getPointAt(u), t = curve.getTangentAt(u), g = new THREE.CapsuleGeometry(len * 0.13, len * 0.75, 2, 5);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(yUp, t)); g.translate(c.x, c.y, c.z); g.deleteAttribute("uv"); geos.push(g);
  }
  return mesh(mergeGeometries(geos), mat, false);
}

// the sheet's soft darker spots on the skin: a few round patches over the temples, the back of the head and the sides
// of the neck (head group, they turn with it), drawn as thin flattened discs just over the skin
function spots(ch, C) {
  const K = C.spots || {}; if (K === false || !ch.head) return;
  const m = std(K.color || "#DE9845", { roughness: 0.8 }); m.userData.noOutline = true;
  const geos = [], R = rng(K.seed ?? 11), yUp = new THREE.Vector3(0, 1, 0);
  const at = K.at || [[1.25, 0.12, 0.034], [1.42, -0.02, 0.022], [1.18, -0.16, 0.026], [1.6, 0.2, 0.018], [-1.3, 0.08, 0.03], [-1.45, -0.12, 0.024], [-1.2, 0.24, 0.018], [-1.62, -0.02, 0.02], [2.6, 0.05, 0.03], [-2.7, -0.08, 0.026], [3.1, 0.18, 0.022]];
  for (const [th, ph, r] of at) {
    const s = ch.headSurf(th, ph), g = new THREE.SphereGeometry(1, 14, 8);
    g.scale(r * (K.size ?? 0.6) * (0.9 + 0.3 * R()), 0.0035, r * (K.size ?? 0.6) * (0.8 + 0.3 * R())); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(yUp, s.normal));
    const p = s.pos.clone().addScaledVector(s.normal, 0.001); g.translate(p.x, p.y, p.z); g.deleteAttribute("uv"); geos.push(g);
  }
  ch.head.group.add(mesh(mergeGeometries(geos), m, false));
}

// ---------------------------------------------------------------- the pale belly plate (plastron) with soft seams
function belly(ch, C) {
  const P = ch.potatoParts, B = C.belly || {};
  const m = std(B.color || "#F4D49A", { roughness: 0.8 });
  const w = (ph) => (B.width ?? 0.62) * (0.82 + 0.18 * Math.cos(ph * 1.2));
  P.add(surfSheet(ch, (ph) => -w(ph), (ph) => w(ph), B.from ?? -0.95, B.to ?? 0.75, 0.004, m, { nu: 24, nv: 24 }));
  const sm = std(B.seam || "#C9A46A", { roughness: 0.8 }); sm.userData.noOutline = true;
  const line = [];
  for (let k = 0; k <= 12; k++) line.push([0, (B.from ?? -0.95) + 0.08 + ((B.to ?? 0.75) - (B.from ?? -0.95) - 0.16) * (k / 12)]);
  P.add(surfLine(ch, line, 0.0075, 0.0032, sm));
  for (const ph of B.rows || [-0.55, -0.12, 0.3]) { const r = []; for (let k = 0; k <= 10; k++) r.push([-w(ph) * 0.88 + (2 * w(ph) * 0.88 * k) / 10, ph + 0.05 * Math.cos((k / 10 - 0.5) * Math.PI)]); P.add(surfLine(ch, r, 0.0075, 0.003, sm)); }
}

// ---------------------------------------------------------------- the open olive vest: two panels round the sides
// (the shell covers the back), the front edges standing open over the belly plate, armholes for the shoulders, tan
// trim, one warm-brown button on his LEFT near the lower front
function vest(ch, C) {
  const P = ch.potatoParts, V = C.vest || {};
  const m = std(V.color || "#777344", { roughness: 0.92 }); m.userData.lookRole = "cloth"; m.side = THREE.DoubleSide;
  const trimM = std(V.trim || "#C9A46A", { roughness: 0.85 }); trimM.userData.lookRole = "cloth";
  const threadM = std(V.thread || "#D9C08C", { roughness: 0.8 }); threadM.userData.lookRole = "cloth"; threadM.userData.noOutline = true;
  const ph0 = V.hem ?? -0.5, ph1 = V.top ?? 1.05, shPh = ch.def.limbs.shoulder ?? 0.5;
  const edge = (ph) => (V.edge ?? 0.5) + (V.flare ?? 0.16) * sstep(0.4, ph0, ph);   // the front edge's angle off centre
  const back = V.back ?? 2.5, ah = V.armhole ?? 0.42;
  for (const sd of [-1, 1]) {
    const hole = (th, ph) => Math.hypot(th - sd * 1.38, (ph - shPh) * 1.15) < ah;
    P.add(surfSheet(ch, sd > 0 ? edge : (ph) => -back, sd > 0 ? () => back : (ph) => -edge(ph), ph0, ph1, V.lift ?? 0.014, m, { nu: 48, nv: 36, hole }));
    // trim: down the front edge and along the hem, and round the armhole
    const fe = []; for (let k = 0; k <= 20; k++) { const ph = ph1 - (ph1 - ph0) * (k / 20); fe.push([sd * edge(ph), ph]); }
    for (let k = 1; k <= 16; k++) fe.push([sd * (edge(ph0) + (back - edge(ph0)) * (k / 16)), ph0]);
    P.add(surfLine(ch, fe, (V.lift ?? 0.014) + 0.004, V.trimR ?? 0.009, trimM));
    const ring = []; for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; ring.push([sd * 1.38 + Math.cos(a) * ah, shPh + (Math.sin(a) * ah) / 1.15]); }
    P.add(surfLine(ch, ring, (V.lift ?? 0.014) + 0.004, (V.trimR ?? 0.009) * 0.85, trimM, true));
    // a running stitch just inside the trim, down the front edge and along the hem (the sheet's sewn vest)
    const st = []; for (let k = 0; k <= 40; k++) { const ph = ph1 - 0.06 - (ph1 - 0.06 - ph0 - 0.05) * (k / 40); st.push([sd * (edge(ph) + 0.075), ph]); }
    for (let k = 1; k <= 30; k++) st.push([sd * (edge(ph0) + 0.075 + (back - 0.2 - edge(ph0)) * (k / 30)), ph0 + 0.05]);
    P.add(dashes(ch, st, (V.lift ?? 0.014) + 0.003, V.stitchLen ?? 0.014, threadM));
  }
  // a patch pocket low on his RIGHT front (-x): a flap of the vest's cloth with a trim edge and its stitching
  if (V.pocket !== false) {
    const [pt, pp] = V.pocket || [-(edge(-0.2) + 0.32), -0.22], pw = 0.17, phh = 0.16;
    P.add(surfSheet(ch, () => pt - pw, () => pt + pw, pp - phh, pp + phh, (V.lift ?? 0.014) + 0.006, m, { nu: 10, nv: 10 }));
    P.add(surfLine(ch, [[pt - pw, pp + phh], [pt, pp + phh + 0.01], [pt + pw, pp + phh]], (V.lift ?? 0.014) + 0.009, (V.trimR ?? 0.009) * 0.75, trimM));
    const ps = [[pt - pw + 0.03, pp + phh - 0.04], [pt - pw + 0.03, pp - phh + 0.03], [pt + pw - 0.03, pp - phh + 0.03], [pt + pw - 0.03, pp + phh - 0.04]], pl = [];
    for (let i = 0; i < 3; i++) for (let k = 0; k < 10; k++) { const a = ps[i], b = ps[i + 1]; pl.push([a[0] + (b[0] - a[0]) * (k / 10), a[1] + (b[1] - a[1]) * (k / 10)]); }
    P.add(dashes(ch, pl, (V.lift ?? 0.014) + 0.009, 0.011, threadM));
  }
  // the button: LEFT side (+x), on the vest just inside its front edge, low
  const bph = V.buttonAt ?? -0.28, s = ch.surf(edge(bph) + 0.1, bph);
  const btn = mesh(new THREE.CylinderGeometry(0.021, 0.022, 0.012, 20), std(V.button || "#8A5530", { roughness: 0.5 }), false);
  btn.position.copy(s.pos).addScaledVector(s.normal, (V.lift ?? 0.014) + 0.008); btn.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), s.normal); P.add(btn);
}

// ---------------------------------------------------------------- the shell: a domed cap of an ellipsoid on his back,
// cut open at the front by a plane that leans back at the top (so the head and the neck stay clear). Its surface is
// large irregular scutes like rounded stones fitted together (Voronoi cells on the dome: each swells a little, the
// grooves between them sink and show a lighter brown), a ring of lighter tan marginal scutes round the rim, a dark
// inside, moss cushions over the top and one fern from the upper rear that sways.
function buildShell(ch, C) {
  const P = ch.potatoParts, S = C.shell || {}, R = rng(S.seed ?? 7);
  const c = new THREE.Vector3(0, ch.cy + (S.dy ?? 0.02), -(S.dz ?? 0.12));
  const Rx = S.r?.[0] ?? ch.rx * 1.5, Ry = S.r?.[1] ?? ch.ry * 1.75, Rz = S.r?.[2] ?? ch.rz * 1.5;
  // the opening in the unit sphere's space: the shell is the cap round the axis ax (straight back, or tilted down by
  // `tilt`), out to a polar angle that depends on the side: alphaOf(ph), ph the azimuth (0 = his LEFT, pi/2 = up). It
  // wraps far forward round his sides (so from the front the rim stands close beside the body and the outside of the
  // shell shows, the sheet's front view) and stays back at the top (behind the head and the neck) and the bottom
  // (behind the legs)
  const ax = new THREE.Vector3(0, -(S.tilt ?? 0), -1).normalize(), t1 = new THREE.Vector3(1, 0, 0), t2 = new THREE.Vector3().crossVectors(t1, ax).normalize();
  const [aS, aT, aB] = (S.open || [125, 80, 86]).map((x) => (x * Math.PI) / 180);
  const alphaOf = (ph) => { const sn = Math.sin(ph); return aS + (aT - aS) * Math.max(0, sn) ** 2 + (aB - aS) * Math.max(0, -sn) ** 2; };
  const dirAt = (th, ph, o = new THREE.Vector3()) => o.copy(ax).multiplyScalar(Math.cos(th)).addScaledVector(t1, Math.sin(th) * Math.cos(ph)).addScaledVector(t2, Math.sin(th) * Math.sin(ph));
  const alpha = Math.min(aS, aT, aB);   // the seed rings are laid out on the smallest opening
  // the scute seeds (directions on the unit sphere): a crown scute, two rings of big ones, a ring of marginals
  const seeds = [];
  const jit = (v, k) => v + (R() - 0.5) * k;
  seeds.push({ d: dirAt(jit(0.12, 0.1), R() * 6.28), m: 0 });
  const rings = S.rings || [[0.36, 6, 0.0], [0.68, 10, 0.3]];
  for (const [f, cnt, off] of rings) for (let i = 0; i < cnt; i++) { const ph = jit(((i + off) / cnt) * Math.PI * 2, 0.25); seeds.push({ d: dirAt(jit((alphaOf(ph) - 0.12) * f, 0.08), ph), m: 0 }); }
  const nm = S.marginals ?? 24;
  for (let i = 0; i < nm; i++) { const ph = ((i + 0.5) / nm) * Math.PI * 2 + (R() - 0.5) * 0.1; seeds.push({ d: dirAt(alphaOf(ph) - 0.12, ph), m: 1 }); }
  const base = col(S.color || "#74503A"), groove = col(S.groove || "#9C7352"), marg = col(S.rim || "#B9875A"), margG = col(S.rimGroove || "#D2A574");
  // the sheet's plates (rich look, Jonny 5 Nov "very detailed"): each plate a rounded stone, lighter on its crown, a
  // pale band just inside its edge, two faint growth rings, and a dark seam where it meets the next
  const seamC = col(S.seam || "#3E2A1E"), lightC = col(S.light || "#8E6646"), edgeC = col(S.edge || "#A07A55");
  const tone = seeds.map((s) => (s.m ? 1 + (R() - 0.5) * 0.08 : 1 + (R() - 0.5) * 0.16));
  const cell = (u) => {
    let d1 = 9, d2 = 9, i1 = 0;
    for (let i = 0; i < seeds.length; i++) { const a = Math.acos(Math.max(-1, Math.min(1, u.dot(seeds[i].d)))); if (a < d1) { d2 = d1; d1 = a; i1 = i; } else if (a < d2) d2 = a; }
    return { i: i1, b: d2 - d1 };
  };
  const NT = S.nt ?? 150, NP = S.np ?? 240, pos = [], colr = [], idx = [], u = new THREE.Vector3();
  const pt = (u, r) => new THREE.Vector3(c.x + u.x * Rx * r, c.y + u.y * Ry * r, c.z + u.z * Rz * r);
  const bulge = S.bulge ?? 0.035, gw = S.grooveW ?? 0.045, ring = (x, at, w) => Math.exp(-(((x - at) / w) ** 2));
  for (let i = 0; i <= NT; i++) for (let j = 0; j <= NP; j++) {
    { const ph = (j / NP) * Math.PI * 2; dirAt((alphaOf(ph) * i) / NT, ph, u); }
    const q = cell(u), sd = seeds[q.i], k = sstep(0, gw * 2.4, q.b);
    const r = 1 + bulge * (sd.m ? 0.6 : 1) * Math.sqrt(k) * (0.75 + 0.25 * k) - 0.012 * (1 - k);
    const p = pt(u, r); pos.push(p.x, p.y, p.z);
    let cc;
    if (S.plates === false) cc = (sd.m ? marg : base).clone().multiplyScalar(tone[q.i]).lerp(sd.m ? margG : groove, 1 - sstep(0, gw, q.b));
    else {
      // q.b: how far inside its plate the point lies (0 on the seam). Crown light, pale edge band, growth rings, seam
      const own = (sd.m ? marg : base).clone().multiplyScalar(tone[q.i]);
      cc = own.clone().lerp(sd.m ? margG : lightC, 0.3 * sstep(gw * 2, gw * 5, q.b));
      cc.lerp(sd.m ? margG : edgeC, 0.5 * ring(q.b, gw * 0.62, gw * 0.22));
      if (!sd.m) cc.lerp(seamC, 0.32 * ring(q.b, gw * 1.45, gw * 0.12) + 0.22 * ring(q.b, gw * 2.3, gw * 0.12));
      cc.lerp(seamC, 0.85 * (1 - sstep(0, gw * 0.32, q.b)));
    }
    colr.push(cc.r, cc.g, cc.b);
  }
  for (let i = 0; i < NT; i++) for (let j = 0; j < NP; j++) { const a = i * (NP + 1) + j, b = a + 1, e = a + NP + 1, f = e + 1; idx.push(a, b, e, b, f, e); }
  // the winding faces out (the outline hull and the light need outward normals): test one row and flip if needed
  { const k = (Math.floor(NT / 2) * (NP + 1)) * 3, a = new THREE.Vector3(pos[k], pos[k + 1], pos[k + 2]), b = new THREE.Vector3(pos[k + 3], pos[k + 4], pos[k + 5]), e = new THREE.Vector3(pos[k + (NP + 1) * 3], pos[k + (NP + 1) * 3 + 1], pos[k + (NP + 1) * 3 + 2]);
    if (b.clone().sub(a).cross(e.clone().sub(a)).dot(a.clone().sub(c)) < 0) for (let i = 0; i < idx.length; i += 3) { const x = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = x; } }
  // vertex colours as a ratio of the base colour: the material keeps the base (the ink line is drawn from its colour)
  for (let i = 0; i < colr.length; i += 3) { colr[i] /= base.r; colr[i + 1] /= base.g; colr[i + 2] /= base.b; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(colr, 3)); g.setIndex(idx); g.computeVertexNormals();
  // the seam where phi wraps: one normal for both columns
  { const N = g.attributes.normal; for (let i = 0; i <= NT; i++) { const a = i * (NP + 1), b = a + NP; const x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); } }
  const shellM = new THREE.MeshStandardMaterial({ color: base, vertexColors: true, roughness: 0.85 });
  const group = new THREE.Group(); group.name = "pebble-shell";
  const outer = mesh(g, shellM); group.add(outer);
  // the inside: the same cap a little smaller, dark, seen only through the front opening
  const ig = new THREE.BufferGeometry(), ip = [];
  for (let i = 0; i <= NT; i++) for (let j = 0; j <= NP; j++) { const ph = (j / NP) * Math.PI * 2; dirAt((alphaOf(ph) * i) / NT, ph, u); const p = pt(u, 0.955); ip.push(p.x, p.y, p.z); }
  ig.setAttribute("position", new THREE.Float32BufferAttribute(ip, 3)); ig.setIndex(idx); ig.computeVertexNormals();
  const inner = mesh(ig, std(S.inside || "#4A3426", { side: THREE.BackSide, roughness: 1 }), false); inner.userData.noOutline = true; group.add(inner);
  // the rim: a rounded roll along the cut edge, joining outside and inside
  const rim = [];
  for (let j = 0; j < 96; j++) { const ph = (j / 96) * Math.PI * 2; dirAt(alphaOf(ph), ph, u); rim.push(pt(u, 0.978)); }
  group.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim, true), 160, S.rimR ?? 0.022, 10, true), std(S.rimEdge || "#C49465", { roughness: 0.8 })));
  P.add(group);
  // a point on the outside of the shell along direction w (unit space) and its outward normal (world-ish, bodyGroup space)
  const onShell = (w) => {
    const q = cell(w), k = sstep(0, gw * 2.4, q.b), r = 1 + bulge * k;
    const p = pt(w, r), nn = new THREE.Vector3(w.x / Rx, w.y / Ry, w.z / Rz).normalize();
    return { p, n: nn };
  };
  moss(group, onShell, dirAt, alphaOf, S, R);
  const fern = buildFern(group, onShell, S);
  // the shell as a solid for checks (bodyGroup space before the group's own transform): an arm or a prop inside the
  // wall between the inside (0.955) and the outside (1 + bulge) of the cap
  group.userData.shellSolid = { c, R: [Rx, Ry, Rz], ax, t1, t2, alphaOf, inner: 0.955, outer: 1 + bulge };
  return { group, update: (st, t, hands, fries) => fern(st, t) };
}

// moss: soft cushion lumps over the top of the shell (where its surface faces up), uneven edges from a few waves, a few
// tufts over the sides that hang toward the shoulders; one merged mesh with per-lump colours
function moss(group, onShell, dirAt, alphaOf, S, R) {
  const M = S.moss || {}, geos = [], cs = [col(M.color || "#8E9B36"), col(M.light || "#A9B548"), col(M.dark || "#6F7D2A")];
  const wave = (w) => 0.12 * Math.sin(w.x * 9.0 + 1.3) + 0.1 * Math.sin(w.z * 7.0 - 0.6) + 0.08 * Math.sin((w.x + w.z) * 13.0);
  const n = M.count ?? 260, fine = M.fine ?? 0, w = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion();
  for (let i = 0; i < n + fine; i++) {
    const tiny = i >= n;   // the fine layer: small fluffy bits over the cushions and their ragged edges
    const ph = R() * Math.PI * 2; dirAt(Math.acos(1 - R() * (1 - Math.cos(Math.min(Math.PI * 0.97, alphaOf(ph) * 0.97)))), ph, w);
    const { p, n: nn } = onShell(w);
    const cover = nn.y + wave(w) + (Math.abs(nn.x) > 0.55 ? 0.12 : 0);   // a little more over the sides (the tufts)
    if (cover < (M.from ?? 0.52) + (tiny ? 0.04 : 0)) continue;
    const r = (tiny ? (M.fineSize ?? 0.012) : (M.size ?? 0.034)) * (0.6 + 0.8 * R()) * (0.6 + 0.6 * sstep(M.from ?? 0.52, 0.95, cover));
    const s = new THREE.SphereGeometry(1, tiny ? 6 : 10, tiny ? 5 : 7);
    s.scale(r * 1.15, r * (tiny ? 0.5 : 0.55), r * 1.15);
    const out_ = tiny ? (M.size ?? 0.034) * 0.3 : r * 0.15;   // the fine bits sit on top of the cushions
    q.setFromUnitVectors(up, nn); s.applyQuaternion(q); s.translate(p.x + nn.x * out_, p.y + nn.y * out_, p.z + nn.z * out_);
    const k = R(), cc = (k < 0.5 ? cs[0] : k < 0.8 ? cs[1] : cs[2]).clone().multiplyScalar(0.94 + 0.12 * R()), a = new Float32Array(s.attributes.position.count * 3);
    for (let j = 0; j < a.length; j += 3) { a[j] = cc.r / cs[0].r; a[j + 1] = cc.g / cs[0].g; a[j + 2] = cc.b / cs[0].b; }   // a ratio of the base (see the shell)
    s.setAttribute("color", new THREE.Float32BufferAttribute(a, 3)); s.deleteAttribute("uv");
    geos.push(s);
  }
  if (!geos.length) return;
  const m = mesh(mergeGeometries(geos), new THREE.MeshStandardMaterial({ color: cs[0], vertexColors: true, roughness: 1 }));
  m.name = "pebble-moss"; group.add(m);
}

// the fern: one plant from the upper rear of the shell, fronds fanning up and out and arching over at their tips, each a
// thin stalk with paired leaflets that shrink toward the tip. Each frond sways on its own slow rhythm and the whole
// plant lags behind the body's moves (follow-through st.ft)
function buildFern(group, onShell, S) {
  const F = S.fern || {}, w = new THREE.Vector3(...(F.at || [-0.12, 0.92, -0.38])).normalize(), base = onShell(w);
  const root = new THREE.Group(); root.position.copy(base.p).addScaledVector(base.n, -0.01); group.add(root);
  const stalkM = std(F.stalk || "#6E8A2E", { roughness: 0.8 }), leafM = std(F.color || "#86A23A", { roughness: 0.8, side: THREE.DoubleSide }), leafL = std(F.light || "#9DB84A", { roughness: 0.8, side: THREE.DoubleSide });
  const fronds = [];
  const list = F.fronds || [[0, 0.3, 0.06], [1.05, 0.27, 0.42], [2.1, 0.24, 0.5], [3.15, 0.26, 0.46], [4.2, 0.25, 0.5], [5.25, 0.28, 0.42], [0.5, 0.2, 0.75], [3.7, 0.19, 0.78]];
  const leaf = new THREE.SphereGeometry(1, 8, 5);
  list.forEach(([az, len, out], i) => {
    const piv = new THREE.Group(); root.add(piv);
    // the frond's plane: up and out along az; it rises then arches over
    const o = new THREE.Vector3(Math.sin(az), 0, Math.cos(az)), pts = [];
    for (let k = 0; k <= 12; k++) { const s = k / 12, rise = Math.sin(s * Math.PI * 0.62) * len * (1 - out * 0.35), reach = s * len * (out + 0.18) + 0.25 * len * out * s * s; pts.push(o.clone().multiplyScalar(reach).add(new THREE.Vector3(0, rise - out * 0.18 * len * s * s, 0))); }
    const curve = new THREE.CatmullRomCurve3(pts);
    piv.add(mesh(new THREE.TubeGeometry(curve, 20, F.stalkR ?? 0.0042, 5), stalkM, false));
    const geos = [];
    const np = F.pairs ?? 11;
    for (let k = 0; k < np; k++) {
      const s = 0.14 + 0.84 * (k / (np - 1)), p = curve.getPointAt(s), tg = curve.getTangentAt(s), side = new THREE.Vector3().crossVectors(tg, new THREE.Vector3(0, 1, 0));
      if (side.lengthSq() < 1e-4) side.set(1, 0, 0); side.normalize();
      const L = (F.leaf ?? 0.05) * (1.05 - 0.75 * s) * (0.85 + 0.3 * Math.sin(k * 2.1 + i)), W = L * 0.4;
      for (const sd of [-1, 1]) {
        const dir = side.clone().multiplyScalar(sd).addScaledVector(tg, 0.55).normalize(), lg = leaf.clone();
        lg.scale(W, 0.0028, L / 2); lg.translate(0, 0, L / 2);
        const m4 = new THREE.Matrix4().lookAt(new THREE.Vector3(), dir, new THREE.Vector3(0, 1, 0)); lg.applyMatrix4(m4);
        // lookAt points -z at dir; flip so +z (the leaf's length) runs along dir
        lg.scale(-1, 1, -1); lg.translate(p.x, p.y, p.z); geos.push(lg);
      }
    }
    piv.add(mesh(mergeGeometries(geos), i % 2 ? leafL : leafM, false));
    fronds.push({ piv, az, ph: i * 1.7, f: 0.34 + 0.07 * (i % 3) });
  });
  // the base: a small clump of fiddleheads and moss where it grows out
  return (st, t) => {
    const ft = st.ft || { f: 0, s: 0 }, lag = F.lag ?? 0.5;
    for (const fr of fronds) {
      const sw = (F.sway ?? 0.05) * Math.sin(2 * Math.PI * fr.f * t + fr.ph);
      fr.piv.rotation.set(-ft.f * lag + sw * Math.cos(fr.az) * 0.6, 0, ft.s * lag + sw * Math.sin(fr.az + 1));
    }
  };
}

// ---------------------------------------------------------------- feet: wide, flat and round with three cream toes
function feet(ch, C) {
  const K = C.feet || {}, [w, h, d] = K.size || [0.088, 0.05, 0.11];
  const toeM = std(K.toe || "#F2DDB0", { roughness: 0.7 });
  for (const s of ["R", "L"]) {
    const f = ch.legs[s].foot;
    const g = new THREE.SphereGeometry(1, 28, 18); g.scale(w, h, d); g.translate(0, 0.012, 0.012);
    const P = g.attributes.position; for (let i = 0; i < P.count; i++) if (P.getY(i) < -0.03) P.setY(i, -0.03 + (P.getY(i) + 0.03) * 0.3);   // a flat sole
    g.computeVertexNormals();
    f.geometry.dispose(); f.geometry = g; f.scale.set(1, 1, 1);
    for (const x of [-0.042, 0, 0.042]) { const t = mesh(new THREE.SphereGeometry(0.019, 14, 10), toeM, false); t.scale.set(1, 0.8, 0.9); t.position.set(x * (w / 0.088), -0.014, d * 0.86 + 0.012 - Math.abs(x) * 0.25); f.add(t); }
  }
}
