import * as THREE from "three";
import { ring } from "./costumes-cast.js";
import { clothMat, dirOf } from "./costumes-art.js";

// The human friends (Jonny, 19 Nov 2026; characters/human-friends/*.json, def.build "core"): the four everyday friends
// as big-headed humans, drawn from the Codex Sol sheets (line-up "Mix 1" + a turnaround and a faces sheet each).
// potato.js builds the torso (def.body), the separate head with its face (def.head) and the limbs; this file adds the
// hair, the clothes' parts and the shoes. Sides are anatomical: the character's RIGHT is -x, LEFT +x, forward +z.
// Returns the same object costumes.js buildCostume returns.

const sstep = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const wrap = (a) => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI; };
const mesh = (g, m, shadow = true) => { const x = new THREE.Mesh(g, m); x.castShadow = shadow; x.receiveShadow = true; return x; };
const flat = (c, rough = 0.7) => new THREE.MeshStandardMaterial({ color: c, roughness: rough });
const _y = new THREE.Vector3(0, 1, 0);
function bandAt(m, a, b, r) { const dir = b.clone().sub(a).normalize(); m.position.copy(a); m.quaternion.setFromUnitVectors(_y, dir); m.scale.setScalar(r); }

// a tube along a curve whose radius changes along it (r(u)), its ends closed with a cap ring pulled to the centre line
function taperTube(curve, nu, nr, r) {
  const fr = curve.computeFrenetFrames(nu, false), pos = [], idx = [];
  for (let i = 0; i <= nu; i++) {
    const u = i / nu, c = curve.getPointAt(u), N = fr.normals[i], B = fr.binormals[i], R = r(u);
    for (let j = 0; j <= nr; j++) { const a = (j / nr) * Math.PI * 2; pos.push(c.x + R * (Math.cos(a) * N.x + Math.sin(a) * B.x), c.y + R * (Math.cos(a) * N.y + Math.sin(a) * B.y), c.z + R * (Math.cos(a) * N.z + Math.sin(a) * B.z)); }
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nr; j++) { const a = i * (nr + 1) + j, b = a + nr + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  // wound to face OUT whichever way the curve's frames turn (a tube wound inward shows the limb through its near side)
  { const c0 = curve.getPointAt(0), A = new THREE.Vector3(pos[0], pos[1], pos[2]), B2 = new THREE.Vector3(pos[(nr + 1) * 3], pos[(nr + 1) * 3 + 1], pos[(nr + 1) * 3 + 2]), C2 = new THREE.Vector3(pos[3], pos[4], pos[5]);
    const n = B2.sub(A).cross(C2.sub(A)); if (n.dot(A.clone().sub(c0)) < 0) for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// a piecewise-linear table [[x, y], ...] read at x
const table = (T, x) => { if (x <= T[0][0]) return T[0][1]; for (let i = 1; i < T.length; i++) if (x <= T[i][0]) { const k = (x - T[i - 1][0]) / (T[i][0] - T[i - 1][0]); return T[i - 1][1] + (T[i][1] - T[i - 1][1]) * k; } return T.at(-1)[1]; };

// HAIR as one closed shell over the skull (head-local, turns with the head). For every direction from the head's
// centre the shell sits `thick` outside the skull where there is hair and just inside it where there is none, so the
// hairline is where the shell dives into the head. Where the hair ends:
//   line   [[|azimuth|, elevation], ...]: the hairline round the head (azimuth 0 = the face's middle, pi = the nape)
//   locks  [[azimuth, halfWidth, length, out], ...]: pointed locks reaching `length` (rad) below the hairline; `out`
//          lifts a lock off the skin toward its tip (a fringe that overhangs the forehead)
//   tufts  [[azimuth, elevation, height, width], ...]: soft bumps that break the round outline
//   thick, crown (extra on top), hang (how far the lower hair stands off the neck instead of following the skull in)
function hairShell(ch, P, mat) {
  const NU = 220, NV = 130, pos = new Float32Array((NU + 1) * (NV + 1) * 3), idx = [], v = new THREE.Vector3();
  const R0 = Math.min(ch.head.rx, ch.head.rz);
  for (let j = 0; j <= NV; j++) {
    const el = -Math.PI / 2 + (Math.PI * j) / NV;
    for (let i = 0; i <= NU; i++) {
      const az = -Math.PI + (2 * Math.PI * i) / NU, d = dirOf(az, el), s = ch.headPoint(d);
      let reach = 0, lift = 0;
      for (const [a, w, L, out = 0] of P.locks) { const k = Math.max(0, 1 - Math.abs(wrap(az - a)) / w); if (k * L > reach) { reach = k * L; lift = out; } }
      const edge = table(P.line, Math.abs(az)) + (P.lean ?? 0) * Math.sin(az) - reach;
      const m = sstep(edge - 0.015, edge + 0.06, el), near = 1 - sstep(edge, edge + 0.5, el);
      let t = P.thick + (P.crown ?? 0) * sstep(0.1, 1.2, el) + lift * near * (reach > 0.05 ? 1 : 0);
      for (const [a, e, h, w] of P.tufts || []) { const da = wrap(az - a) * Math.cos(el), de = el - e; t += h * Math.exp(-(da * da + de * de) / (w * w)); }
      if (el < 0) t += (P.hang ?? 0) * (1 - Math.cos(el)) * R0;
      const off = m * t - (1 - m) * 0.035;
      v.copy(s).addScaledVector(d, off);
      pos.set([v.x, v.y, v.z], (j * (NU + 1) + i) * 3);
    }
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + NU + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  // the seam at the nape (azimuth -pi = pi): average the two columns' normals so no line shows
  const n = g.attributes.normal; for (let j = 0; j <= NV; j++) { const a = j * (NU + 1), b = a + NU; const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1; n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l); }
  return mesh(g, mat);
}
// one free lock of hair: a tapered tube along points (head-local), thick at its root and pointed at its tip
function lock(points, r0, mat, flatK = 1) {
  const c = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const g = taperTube(c, 20, 10, (u) => r0 * (u < 0.15 ? 0.6 + 0.4 * (u / 0.15) : Math.max(0.04, 1 - ((u - 0.15) / 0.85) ** 1.4)));
  const m = mesh(g, mat); if (flatK !== 1) m.scale.z = flatK; return m;
}

// trainers: the foot becomes a rounded shoe with its own sole standing on the floor (the foot's centre stays 3.5 cm up)
function shoes(ch, upper, sole, stripe, size = [0.07, 0.05, 0.115]) {
  const [w, h, d] = size;
  for (const s of ["R", "L"]) {
    const f = ch.legs[s].foot;
    const g = new THREE.SphereGeometry(1, 28, 18); g.scale(w, h, d); g.translate(0, 0.02, 0.03);
    f.geometry.dispose(); f.geometry = g; f.material = upper; f.scale.set(1, 1, 1);
    const sl = mesh(new THREE.CylinderGeometry(1, 1, 1, 28), sole); sl.scale.set(w * 1.08, 0.024, d * 1.06); sl.position.set(0, -0.023, 0.03); f.add(sl);
    const cap = mesh(new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), sole, false); cap.scale.set(w * 0.82, h * 0.62, d * 0.4); cap.position.set(0, 0.0, 0.03 + d * 0.66); f.add(cap);
    if (stripe) for (const k of [0, 1]) { const b = mesh(new THREE.TorusGeometry(1, 0.1, 6, 20, Math.PI), stripe, false); b.scale.set(w * 0.92, h * 1.02, 0.02); b.position.set(0, 0.02, 0.045 + k * 0.035); f.add(b); }
  }
}

// what every friend shares: sleeves over the arms to the wrist with a cuff, trousers over the legs to the ankle
function limbsCloth(ch, o) {
  const sl = {}, tr = {};
  for (const s of ["R", "L"]) {
    sl[s] = { tube: mesh(new THREE.BufferGeometry(), o.sleeve), cuff: mesh(new THREE.TorusGeometry(1, 0.2, 8, 24), o.cuff) };
    tr[s] = { tube: mesh(new THREE.BufferGeometry(), o.trouser) };
    for (const m of [sl[s].tube, tr[s].tube]) m.frustumCulled = false;
    sl[s].cuff.geometry.rotateX(Math.PI / 2);
    ch.root.add(sl[s].tube); ch.root.add(sl[s].cuff); ch.root.add(tr[s].tube);
  }
  const lw = ch.def.legs?.width ?? ch.limbW * 1.1;
  return (st, t, hands, fries) => {
    for (const s of ["R", "L"]) {
      const A = ch.arms[s], Lg = ch.legs[s], on = !fries && !!A.elbow && !!Lg.knee;
      sl[s].tube.visible = sl[s].cuff.visible = tr[s].tube.visible = on;
      if (!on) continue;
      const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), Lc = curve.getLength(), u1 = Math.max(0.5, 1 - (o.cuffAt ?? 0.075) / Lc);
      const pts = []; for (let i = 0; i <= 12; i++) pts.push(curve.getPointAt(0.02 + (u1 - 0.02) * (i / 12)));
      sl[s].tube.geometry.dispose(); sl[s].tube.geometry = taperTube(new THREE.CatmullRomCurve3(pts), 14, 14, (u) => ch.limbW * (o.sleeveR ?? 1.5) * (1 + (o.sleeveFlare ?? 0.12) * u));
      bandAt(sl[s].cuff, curve.getPointAt(u1), curve.getPointAt(Math.min(1, u1 + 0.04)), ch.limbW * (o.cuffR ?? 1.45));
      // the trouser leg follows the leg's own curve (potato.js draws the leg along it) from inside the hem to the ankle
      const lc0 = ch.constructor.armCurve(Lg.hip, Lg.knee, Lg.foot.position, false), lp = [Lg.hip.clone().add(new THREE.Vector3(0, 0.06, 0))];
      for (let i = 0; i <= 10; i++) lp.push(lc0.getPoint((o.hemU ?? 0.9) * (i / 10)));
      tr[s].tube.geometry.dispose(); tr[s].tube.geometry = taperTube(new THREE.CatmullRomCurve3(lp), 16, 14, (u) => lw * (o.trouserR ?? 1.3) * (1 - (o.trouserTaper ?? 0.06) * u));
    }
  };
}

const HUMAN = {
  // MASH: the tallest, thin. Big blue-black mop with a long fringe lock falling between the eyes and a flick on the
  // crown; charcoal pullover hoodie (collar roll, hood lying on the back, pouch pocket, ribbed hem and cuffs); big
  // light-blue headphones round the neck; grey-blue straight jeans; dark canvas shoes with cream soles.
  "human-mash"(C, ch) {
    const P = ch.potatoParts, H = ch.head, top = ch.cy + ch.ry;
    const hairM = clothMat(C.hair || "#57506f", { roughness: 0.85 }), hood = clothMat(C.hoodie || "#4a4950"), rib = clothMat(C.rib || "#3f3e45");
    const denim = clothMat(C.denim || "#929bb6"), blue = flat(C.phones || "#86bde6", 0.45), blueD = flat(C.phonesDark || "#5c9bcb", 0.6);
    // hair
    H.group.add(hairShell(ch, {
      thick: 0.055, crown: 0.055, hang: 0.9, lean: 0,
      line: [[0, 0.74], [0.7, 0.7], [0.95, 0.6], [1.2, 0.5], [1.5, 0.42], [1.75, 0.1], [2.0, -0.25], [2.5, -0.5], [3.1416, -0.56]],
      locks: [[-0.14, 0.4, 0.62, 0.035], [0.22, 0.22, 0.34, 0.03], [0.5, 0.2, 0.26, 0.015], [0.84, 0.17, 0.36, 0.015], [-0.72, 0.16, 0.26, 0.015], [-0.97, 0.15, 0.4, 0.015],
        [1.2, 0.12, 0.42, 0.008], [-1.2, 0.12, 0.42, 0.008], [1.8, 0.2, 0.3, 0.05], [-1.8, 0.2, 0.3, 0.05], [2.05, 0.22, 0.3, 0.05], [-2.05, 0.22, 0.3, 0.05], [2.6, 0.24, 0.26, 0.04], [-2.6, 0.24, 0.26, 0.04], [3.1416, 0.26, 0.36, 0.03]],
      tufts: [[1.45, 0.75, 0.04, 0.3], [-1.45, 0.75, 0.04, 0.3], [1.75, 0.3, 0.05, 0.3], [-1.75, 0.3, 0.05, 0.3], [2.4, 0.35, 0.035, 0.35], [-2.4, 0.35, 0.035, 0.35], [0.6, 1.05, 0.03, 0.3], [-0.5, 1.15, 0.03, 0.3], [3.1, 0.2, 0.04, 0.4], [0.35, 0.8, 0.025, 0.25]],
    }, hairM));
    // free spikes round the lower edge: they break the mop's outline (his sheet's jagged, flared silhouette)
    { const at = (az, el, out) => { const d = dirOf(az, el), q = ch.headPoint(d).addScaledVector(d, out); return [q.x, q.y, q.z]; };
      for (const [az, el, len, out, r] of C.spikes || [[1.36, 0.52, 0.3, 0.09, 0.042], [1.85, 0.2, 0.55, 0.13, 0.055], [2.2, 0.02, 0.5, 0.13, 0.055], [2.68, -0.1, 0.42, 0.11, 0.05], [1.05, 0.95, -0.35, 0.1, 0.045], [2.0, 0.85, -0.3, 0.09, 0.045]])
        for (const sd of [-1, 1]) { const a = sd * az + (sd < 0 ? 0.07 : 0); H.group.add(lock([at(a, el + 0.12 * Math.sign(len), 0.0), at(a, el, 0.045), at(a, el - len * 0.5, 0.045 + (out - 0.045) * 0.7), at(a + sd * 0.05, el - len, out)], r, hairM)); } }
    const hy = H.ry + 0.085;
    H.group.add(lock([[0.01, hy - 0.03, -0.03], [0.015, hy + 0.045, -0.02], [0.03, hy + 0.085, 0.02], [0.06, hy + 0.08, 0.06], [0.075, hy + 0.05, 0.075]], 0.022, hairM));
    // hoodie: the collar roll round the neck (lower in front), the hood lying on the back, the pouch pocket, the hem
    { const pts = []; for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2, fr = (1 + Math.cos(a)) / 2; pts.push(new THREE.Vector3(Math.sin(a) * 0.112, top + 0.004 - 0.03 * fr * fr, Math.cos(a) * 0.1 - 0.012)); }
      P.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 72, 0.03, 12, true), hood)); }
    { const g = new THREE.SphereGeometry(1, 40, 28), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), low = sstep(0.2, -1, y); p.setXYZ(i, x * 0.16 * (1 - 0.55 * low), y * 0.115 - 0.02 * low, z * 0.06 * (1 - 0.3 * low)); }
      g.computeVertexNormals(); const m = mesh(g, hood); m.position.set(0, top - 0.105, -ch.rz * 0.72 - 0.03); m.rotation.x = 0.12; P.add(m);
      const lip = mesh(new THREE.TorusGeometry(0.105, 0.024, 10, 28, Math.PI), hood); lip.rotation.set(Math.PI / 2 + 0.25, 0, Math.PI); lip.position.set(0, top - 0.035, -ch.rz * 0.62); lip.scale.set(1.15, 1, 0.8); P.add(lip); }
    { const NUp = 24, NVp = 10, pos = [], idx = [], th1 = 0.78, ph0 = -0.7, ph1 = -0.16;
      for (let j = 0; j <= NVp; j++) for (let i = 0; i <= NUp; i++) {
        const u = i / NUp * 2 - 1, vv = j / NVp, w = th1 * (1 - 0.42 * sstep(0.35, 1, vv)), s = ch.surf(u * w, ph0 + (ph1 - ph0) * vv);
        const edge = Math.min(1, (1 - Math.abs(u)) * 5, vv * 6, (1 - vv) * 6), lift = 0.004 + 0.012 * sstep(0, 1, edge);
        s.pos.addScaledVector(s.normal, lift); pos.push(s.pos.x, s.pos.y, s.pos.z);
      }
      for (let j = 0; j < NVp; j++) for (let i = 0; i < NUp; i++) { const a = j * (NUp + 1) + i, b = a + NUp + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); const pm = hood.clone(); pm.side = THREE.DoubleSide; pm.userData = { ...hood.userData }; P.add(mesh(g, pm));
      const edge = [], at = (u, vv) => { const w = th1 * (1 - 0.42 * sstep(0.35, 1, vv)), q = ch.surf(u * w, ph0 + (ph1 - ph0) * vv); return q.pos.addScaledVector(q.normal, 0.012); };
      for (let i = 0; i <= 8; i++) edge.push(at(-1, i / 8)); for (let i = 1; i <= 10; i++) edge.push(at(-1 + (2 * i) / 10, 1)); for (let i = 1; i <= 8; i++) edge.push(at(1, 1 - i / 8)); for (let i = 1; i < 10; i++) edge.push(at(1 - (2 * i) / 10, 0));
      const em = flat(C.line || "#2c2b33", 0.9); em.userData.noOutline = true; P.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge, true, "catmullrom", 0.2), 120, 0.0045, 6, true), em, false)); }
    P.add(ring(ch, -1.0, 0.03, rib, 0.0));
    // jeans seat under the hem
    { const seat = mesh(new THREE.SphereGeometry(1, 28, 18), denim); seat.scale.set(ch.rx * 0.8, 0.075, ch.rz * 0.82); seat.position.set(0, ch.legH + 0.03, 0); P.add(seat); }
    // headphones round the neck: the band behind, a cup in front of each shoulder
    { const y0 = top + 0.03, pts = [];
      for (let i = 0; i <= 20; i++) { const a = (62 + (236 * i) / 20) * Math.PI / 180, fr = Math.max(0, Math.cos(a)); pts.push(new THREE.Vector3(Math.sin(a) * 0.15, y0 - 0.1 * fr, Math.cos(a) * (0.13 + 0.06 * fr) - 0.01)); }
      P.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.017, 10), blueD));
      for (const sd of [-1, 1]) {
        const cup = new THREE.Group(), n = new THREE.Vector3(sd * 0.3, 0.12, 0.95).normalize();
        const shell = mesh(new THREE.SphereGeometry(1, 28, 18), blue); shell.scale.set(0.082, 0.034, 0.082); cup.add(shell);
        const base = mesh(new THREE.CylinderGeometry(0.078, 0.082, 0.034, 28), blue); base.position.y = -0.014; cup.add(base);
        const pad = mesh(new THREE.TorusGeometry(0.06, 0.024, 10, 28), blueD); pad.rotation.x = Math.PI / 2; pad.position.y = -0.036; cup.add(pad);
        const dot = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.006, 24), blueD, false); dot.position.y = 0.032; cup.add(dot);
        cup.position.set(sd * 0.135, top - 0.085, ch.rz * 0.72 + 0.055); cup.quaternion.setFromUnitVectors(_y, n); P.add(cup);
      } }
    shoes(ch, flat(C.shoe || "#45435c", 0.8), flat(C.sole || "#f2e3c6", 0.8), null, C.shoeSize);
    return [limbsCloth(ch, { sleeve: hood, cuff: rib, trouser: denim, sleeveR: 1.32, cuffR: 1.42, trouserR: 1.3 })];
  },
};

export const isHumanFriend = (def) => !!HUMAN[def.costume?.type];
export function humanFriendCostume(def, ch) {
  const C = def.costume || {};
  const out = { tip: null, prop: null, hat: null, hatBrim: null, helmet: null, propAxis: () => null, propLine: () => null, apply() {} };
  const live = HUMAN[C.type](C, ch, out) || [];
  out.apply = (st, t, hands, fries) => { for (const f of live) f(st, t, hands, fries); };
  return out;
}
