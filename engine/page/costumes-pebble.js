import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rng } from "./util.js";

// PEBBLE, the calm old tortoise (Jonny's final sheet, 5 Nov 2026: characters/pebble/pebble.json, def.build "core",
// costume.type "pebble"). potato.js builds the torso (def.body, golden ochre skin), the big separate head with its snout
// (def.head.muzzle) and face, the short arms with three-finger gloves and the thick legs; this file adds what makes him
// Pebble: the brown newsboy cap (turns with the head), the cream belly plate, the open olive vest with tan trim and one
// button on his RIGHT (Garden Guardian pack, 6 Nov 2026), the big domed shell of fitted stone scutes on his back with a
// ring of rim plates, the moss cushion over its top and ONE fern growing from the upper rear of the shell (it sways),
// wide flat feet with three toes, toasted spots on the face and limbs, and a short dry grass straw held in the LEFT
// corner of his mouth (it follows the lip corner as the mouth moves).
// Sides are anatomical: his RIGHT is -x, LEFT +x, forward +z. Returns the object costumes.js buildCostume returns.

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...o });
const mesh = (g, m, shadow = true) => { const x = new THREE.Mesh(g, m); x.castShadow = shadow; x.receiveShadow = true; return x; };
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const col = (h) => new THREE.Color(h);

export function pebbleCostume(def, ch) {
  const C = def.costume || {};
  const out = { tip: null, prop: null, hat: null, hatBrim: null, helmet: null, propAxis: () => null, propLine: () => null, apply() {} };
  const live = [];
  // costume.plain (look-dev only, tools/pebble/views.sh --plain): the bare forms: no cap, face, spots, vest, belly
  // plate, straw, moss or fern, so the head, neck, limbs and shell read as shapes first (Jonny 7 Nov 12:07)
  const PL = !!C.plain;
  const cap = buildCap(ch, C); out.hat = cap.group; out.hatBrim = { group: cap.group, r: cap.brimR }; if (PL) cap.group.visible = false;
  if (PL && ch.face) live.push(() => { ch.face.group.visible = false; });
  if (!PL) { belly(ch, C); vest(ch, C); spots(ch, C); }
  const ls = PL ? null : limbSpots(ch, C); if (ls) live.push(ls);
  const shell = buildShell(ch, PL ? { ...C, shell: { ...(C.shell || {}), moss: false, fern: false } } : C);
  live.push(shell.update);
  const straw = PL ? null : buildStraw(ch, C);
  if (straw) { live.push(straw.update); out.straw = straw.group; out.strawInfo = straw; }
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
    // a soft cloth crown (correction brief 6 Nov): fuller over the front and toward one side (cap.skew, + = his left),
    // flattened a little on top, so it reads as fabric slumped over the head rather than a rigid dome
    const az = Math.atan2(v.x, v.z), full = 1 + (K.front ?? 0) * Math.max(0, Math.cos(az)) ** 2 * Math.sin(Math.PI * Math.min(1, up * 1.4));
    const puff = (1 + (cr[0] - 1) * Math.sin(Math.PI * Math.min(1, up * 1.25)) ** 0.8) * full;   // widest a little above the band
    const x = v.x * rx * puff + (K.skew ?? 0) * ch_ * up * up, z = v.z * rz * puff * (cr[1] / cr[0]) + lean * ch_ * up, y = yb + up * ch_ * (1 - (K.flat ?? 0) * up * up);
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
  const band = mesh(new THREE.TorusGeometry(1, K.bandR ?? 0.012, 8, 64), darkM, false); band.rotation.x = Math.PI / 2; band.scale.set(rx + 0.002, rz + 0.002, 1); band.position.y = yb + 0.004; g.add(band);
  // six panel seams from the button down to the band, lying on the crown
  const seamM = std(new THREE.Color(K.color || "#9B613C").multiplyScalar(0.62), { roughness: 0.9 }); seamM.userData.noOutline = true;
  const top = new THREE.Vector3();
  for (let s = 0; s < 6; s++) {
    const a = (s / 6) * Math.PI * 2 + Math.PI / 6, pts = [];
    for (let k = 0; k <= 16; k++) {
      const pol = (k / 16) * Math.PI * 0.6, d = new THREE.Vector3(Math.sin(pol) * Math.sin(a), Math.cos(pol), Math.sin(pol) * Math.cos(a));
      const up = (d.y - cy0) / (1 - cy0), az = Math.atan2(d.x, d.z), full = 1 + (K.front ?? 0) * Math.max(0, Math.cos(az)) ** 2 * Math.sin(Math.PI * Math.min(1, up * 1.4));
      const puff = (1 + (cr[0] - 1) * Math.sin(Math.PI * Math.min(1, up * 1.25)) ** 0.8) * full;
      const p = new THREE.Vector3(d.x * rx * puff + (K.skew ?? 0) * ch_ * up * up, yb + up * ch_ * (1 - (K.flat ?? 0) * up * up), d.z * rz * puff * (cr[1] / cr[0]) + lean * ch_ * up);
      const n = p.clone().sub(new THREE.Vector3(0, yb, 0)).normalize(); p.addScaledVector(n, 0.003); pts.push(p);
      if (k === 0) top.copy(p);
    }
    g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.0028, 5), seamM, false));
  }
  const btn = mesh(new THREE.SphereGeometry(0.022, 16, 10), darkM, false); btn.scale.y = 0.5; btn.position.copy(top); g.add(btn);
  // the whole cap sits a little askew (cap.tilt, radians round the head's front axis) and pulled forward (cap.pitch)
  g.rotation.set(K.pitch ?? 0, 0, K.tilt ?? 0);
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
    idx.push(a, b, c, b, d, c);   // outward: ch.surf's normal is dTheta x dPhi (a +theta -> b, a +phi -> c)
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
  const m = std(K.color || "#DE9845", { roughness: 0.8 }); m.userData.noOutline = true; m.userData.decor = true;
  // spots.flat (opt-in, Jonny 7 Nov): painted marks, not raised discs: nearly no thickness, drawn over the skin by depth
  // offset; spots.n keeps only the first n of the list
  const FT = K.flat ? 0.0006 : 0.0035; if (K.flat) Object.assign(m, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  const geos = [], R = rng(K.seed ?? 11), yUp = new THREE.Vector3(0, 1, 0);
  const at = K.at || [[1.25, 0.12, 0.034], [1.42, -0.02, 0.022], [1.18, -0.16, 0.026], [1.6, 0.2, 0.018], [-1.3, 0.08, 0.03], [-1.45, -0.12, 0.024], [-1.2, 0.24, 0.018], [-1.62, -0.02, 0.02], [2.6, 0.05, 0.03], [-2.7, -0.08, 0.026], [3.1, 0.18, 0.022]];
  for (const [th, ph, r] of at.slice(0, K.n ?? at.length)) {
    const s = ch.headSurf(th, ph), g = new THREE.SphereGeometry(1, 14, 8);
    g.scale(r * (K.size ?? 0.6) * (0.9 + 0.3 * R()), FT, r * (K.size ?? 0.6) * (0.8 + 0.3 * R())); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(yUp, s.normal));
    const p = s.pos.clone().addScaledVector(s.normal, 0.001); g.translate(p.x, p.y, p.z); g.deleteAttribute("uv"); geos.push(g);
  }
  ch.head.group.add(mesh(mergeGeometries(geos), m, false));
  // two tiny nostrils on the top of the muzzle (Garden Guardian pack), in face coordinates [u, v] (spots.nostrils)
  if (K.nostrils !== false && ch.face) {
    const nm = std(K.nostril || "#7A4420", { roughness: 0.8 }); nm.userData.noOutline = true; const ng = [];
    for (const [u, v] of K.nostrils || [[-0.07, -0.08], [0.07, -0.08]]) {
      const s = ch.face.place(u, v), g = new THREE.SphereGeometry(1, 10, 6);
      g.scale(0.0075, 0.002, 0.0045); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(yUp, s.normal));
      const p = s.pos.clone().addScaledVector(s.normal, 0.001); g.translate(p.x, p.y, p.z); ng.push(g);
    }
    ch.head.group.add(mesh(mergeGeometries(ng), nm, false));
  }
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
  // the front edge's angle off centre; vest.corner (opt-in, review 7 Nov 2026): the lower front corner rounded off, a
  // quarter circle of that many radians up from the hem (square corners read as manufactured)
  const rc = V.corner ?? 0, rk = V.cornerK ?? 1.6;
  // vest.neck (opt-in, Jonny 7 Nov 12:07): the front edges also open out towards the top, round the neck, so the opening
  // runs wide at the neck, narrowest over the chest and wide again round the lower belly
  const edge = (ph) => (V.edge ?? 0.5) + (V.flare ?? 0.16) * sstep(0.4, ph0, ph) + (V.neck ?? 0) * sstep(ph1 - (V.neckH ?? 0.5), ph1, ph) ** 1.5 + (rc && ph < ph0 + rc ? rc * rk * (1 - Math.sqrt(Math.max(0, 1 - ((ph0 + rc - ph) / rc) ** 2))) : 0);
  const back = V.back ?? 2.5, ah = V.armhole ?? 0.42, av = V.armholeV ?? 1;   // armholeV (opt-in): the hole's height against its width (a wide hole for the shoulder that doesn't climb onto the top of the body)
  for (const sd of [-1, 1]) {
    // the armhole as the panel's own boundary (no dropped cells, so no staircase edge): the panel is two sheets, in
    // front of and behind the hole, whose inner edges follow the hole's ellipse exactly and meet above and below it
    const hw = (ph) => Math.sqrt(Math.max(0, ah * ah - ((ph - shPh) * 1.15 / av) ** 2)), hc = sd * 1.38;
    const lo = sd > 0 ? edge : () => -back, hi = sd > 0 ? () => back : (ph) => -edge(ph);
    P.add(surfSheet(ch, lo, (ph) => hc - hw(ph), ph0, ph1, V.lift ?? 0.014, m, { nu: 28, nv: 48 }));
    P.add(surfSheet(ch, (ph) => hc + hw(ph), hi, ph0, ph1, V.lift ?? 0.014, m, { nu: 20, nv: 48 }));
    // trim: down the front edge and along the hem, and round the armhole
    const fe = []; for (let k = 0; k <= 20; k++) { const ph = ph1 - (ph1 - ph0) * (k / 20); fe.push([sd * edge(ph), ph]); }
    for (let k = 1; k <= 16; k++) fe.push([sd * (edge(ph0) + (back - edge(ph0)) * (k / 16)), ph0]);
    P.add(surfLine(ch, fe, (V.lift ?? 0.014) + 0.004, V.trimR ?? 0.009, trimM));
    const ring = []; for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; ring.push([sd * 1.38 + Math.cos(a) * ah, shPh + (Math.sin(a) * ah * av) / 1.15]); }
    if (V.armTrim !== false) P.add(surfLine(ch, ring, (V.lift ?? 0.014) + 0.004, (V.trimR ?? 0.009) * 0.85, trimM, true));   // armTrim false (opt-in): no piping round the armhole (on a wide hole it stood off the shoulder as a hoop)
    // a running stitch just inside the trim, down the front edge and along the hem (the sheet's sewn vest)
    const st = []; for (let k = 0; k <= 40; k++) { const ph = ph1 - 0.06 - (ph1 - 0.06 - ph0 - 0.05) * (k / 40); st.push([sd * (edge(ph) + 0.075), ph]); }
    for (let k = 1; k <= 30; k++) st.push([sd * (edge(ph0) + 0.075 + (back - 0.2 - edge(ph0)) * (k / 30)), ph0 + 0.05]);
    P.add(dashes(ch, st, (V.lift ?? 0.014) + 0.003, V.stitchLen ?? 0.014, threadM));
  }
  // pocket slits (Garden Guardian pack): a short welt line low on each front panel, in the trim colour
  if (V.slits) for (const sd of [-1, 1]) {
    const [st0, sp0] = V.slits === true ? [edge(-0.15) + 0.28, -0.15] : V.slits, sl = [];
    for (let k = 0; k <= 6; k++) sl.push([sd * (st0 - 0.09 + 0.18 * (k / 6)), sp0 + 0.03 * (k / 6)]);
    P.add(surfLine(ch, sl, (V.lift ?? 0.014) + 0.006, (V.trimR ?? 0.009) * 0.45, trimM));
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
  // the button: on his RIGHT (-x) by default (Garden Guardian pack: viewer-left in a front view; buttonSide 1 = LEFT),
  // on the vest just inside its front edge, low
  const bph = V.buttonAt ?? -0.28, s = ch.surf((V.buttonSide ?? -1) * (edge(bph) + 0.1), bph);
  const btn = mesh(new THREE.CylinderGeometry(0.021, 0.022, 0.012, 20), std(V.button || "#8A5530", { roughness: 0.5 }), false);
  btn.position.copy(s.pos).addScaledVector(s.normal, (V.lift ?? 0.014) + 0.008); btn.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), s.normal); P.add(btn);
  // vest.sewn (opt-in): the button's thread, a small cross over its four holes, so it reads as sewn on
  if (V.sewn) { const tm = std(V.sewn === true ? "#E8CF9A" : V.sewn, { roughness: 0.8 }); tm.userData.noOutline = true;
    for (const a of [Math.PI / 4, -Math.PI / 4]) { const b = mesh(new THREE.BoxGeometry(0.026, 0.004, 0.0045), tm, false); b.rotation.y = a; b.position.y = 0.0065; btn.add(b); } }
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
  // shell.hug (opt-in, Jonny 7 Nov "an oversized open backpack framing a small torso"): near the opening the dome
  // curves in toward the body, so the rim lies close round the shoulders and the sides (a carapace margin turning
  // down) instead of standing off them with a deep dark gap. Over the last `band` radians before the rim, the part of a
  // point across the shell's axis shrinks so the rim lands on an ellipse round the axis, side x top (bottom: none by
  // default, the legs stay clear); the axial part stays, so the rim keeps its depth
  const HG = S.hug, hugK = (() => {
    if (!HG) return null;
    const NH = 180, k = new Float32Array(NH + 1), q = new THREE.Vector3();
    for (let j = 0; j <= NH; j++) {
      const ph = (j / NH) * Math.PI * 2, al = alphaOf(ph); dirAt(al, ph, q);
      const v = new THREE.Vector3(q.x * Rx, q.y * Ry, q.z * Rz), d0 = v.clone().addScaledVector(ax, -v.dot(ax)).length();
      const cp = Math.cos(ph), sp = Math.sin(ph), vt = sp >= 0 ? HG.top ?? 1e3 : HG.bottom ?? 1e3;
      const dT = 1 / Math.sqrt((cp / (HG.side ?? 1e3)) ** 2 + (sp / vt) ** 2);
      k[j] = Math.max(0, Math.min(HG.max ?? 0.6, 1 - dT / d0));
    }
    return (ph) => { const f = ((((ph / (Math.PI * 2)) % 1) + 1) % 1) * NH, i = Math.floor(f), w = f - i; return k[i] * (1 - w) + k[Math.min(NH, i + 1)] * w; };
  })();
  const hugAt = (u) => {
    if (!hugK) return 1;
    const th = Math.acos(Math.max(-1, Math.min(1, u.dot(ax)))), ph = Math.atan2(u.dot(t2), u.dot(t1)), al = alphaOf(ph), b = HG.band ?? 0.6;
    return 1 - hugK(ph) * sstep(al - b, al, th) ** (HG.ease ?? 1.5);
  };
  const pt = (u, r) => {
    const v = new THREE.Vector3(u.x * Rx * r, u.y * Ry * r, u.z * Rz * r);
    if (hugK) { const a = v.dot(ax), h = hugAt(u); v.addScaledVector(ax, -a).multiplyScalar(h).addScaledVector(ax, a); }
    return v.add(c);
  };
  // the outer surface's normal along unit direction w, from the drawn (hugged) surface itself
  const outN = (w) => {
    const e = 0.004, a = new THREE.Vector3(1, 0, 0).cross(w); if (a.lengthSq() < 1e-6) a.set(0, 1, 0).cross(w); a.normalize(); const b = w.clone().cross(a).normalize();
    const P = (d) => pt(d.normalize(), 1), pa = P(w.clone().addScaledVector(a, e)).sub(P(w.clone().addScaledVector(a, -e))), pb = P(w.clone().addScaledVector(b, e)).sub(P(w.clone().addScaledVector(b, -e)));
    const n = pa.cross(pb).normalize(); if (n.dot(pt(w, 1).sub(c)) < 0) n.negate(); return n;
  };
  const bulge = S.bulge ?? 0.035, gw = S.grooveW ?? 0.045, ring = (x, at, w) => Math.exp(-(((x - at) / w) ** 2));
  // the drawn surface's radius along unit direction u (scute swell, seam groove): the mesh, the moss and the fern's
  // root all use this one function, so nothing is seated on a surface that isn't drawn
  // shell.soft (opt-in, Jonny 7 Nov 12:07 "one smooth dome, shallow rounded seams"): each scute swells over soft x the
  // groove width as a smooth dome instead of a steep bevel and a flat top, so the outline reads as one curved shell
  const rOf = (u, q = cell(u)) => { const sd = seeds[q.i];
    if (S.soft) { const k = sstep(0, gw * S.soft, q.b), g = sstep(0, gw * 1.6, q.b); return 1 + bulge * (sd.m ? 0.6 : 1) * k - (S.grooveDepth ?? 0.012) * (1 - g); }
    const k = sstep(0, gw * 2.4, q.b); return 1 + bulge * (sd.m ? 0.6 : 1) * Math.sqrt(k) * (0.75 + 0.25 * k) - (S.grooveDepth ?? 0.012) * (1 - k); };
  for (let i = 0; i <= NT; i++) for (let j = 0; j <= NP; j++) {
    { const ph = (j / NP) * Math.PI * 2; dirAt((alphaOf(ph) * i) / NT, ph, u); }
    const q = cell(u), sd = seeds[q.i], k = sstep(0, gw * 2.4, q.b);
    const r = rOf(u, q);
    const p = pt(u, r); pos.push(p.x, p.y, p.z);
    let cc;
    if (S.plates === false) cc = (sd.m ? marg : base).clone().multiplyScalar(tone[q.i]).lerp(sd.m ? margG : groove, 1 - sstep(0, gw, q.b));
    else {
      // q.b: how far inside its plate the point lies (0 on the seam). Crown light, pale edge band, growth rings, seam
      const own = (sd.m ? marg : base).clone().multiplyScalar(tone[q.i]);
      cc = own.clone().lerp(sd.m ? margG : lightC, 0.3 * sstep(gw * 2, gw * 5, q.b));
      cc.lerp(sd.m ? margG : edgeC, 0.5 * ring(q.b, gw * 0.62, gw * 0.22));
      if (!sd.m && S.growth !== false) cc.lerp(seamC, 0.32 * ring(q.b, gw * 1.45, gw * 0.12) + 0.22 * ring(q.b, gw * 2.3, gw * 0.12));
      cc.lerp(seamC, (S.seamK ?? 0.85) * (1 - sstep(0, gw * 0.32, q.b)));
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
  const ig = new THREE.BufferGeometry(), ip = [], ic = [], deep = S.insideDeep;   // insideDeep (opt-in): brightness deep inside, 1 at the rim
  for (let i = 0; i <= NT; i++) for (let j = 0; j <= NP; j++) { const ph = (j / NP) * Math.PI * 2; dirAt((alphaOf(ph) * i) / NT, ph, u); const p = pt(u, 0.955); ip.push(p.x, p.y, p.z); if (deep != null) { const k = deep + (1 - deep) * (i / NT) ** 3; ic.push(k, k, k); } }
  ig.setAttribute("position", new THREE.Float32BufferAttribute(ip, 3)); if (deep != null) ig.setAttribute("color", new THREE.Float32BufferAttribute(ic, 3)); ig.setIndex(idx); ig.computeVertexNormals();
  const inner = mesh(ig, std(S.inside || "#4A3426", { side: THREE.BackSide, roughness: 1, ...(deep != null ? { vertexColors: true } : {}) }), false); inner.userData.noOutline = true; group.add(inner);
  // the lip (opt-in S.lip, 6 Nov 2026): the carapace margin turning in to meet the body, as on the pack's three-quarter
  // view, where the rim plates sit tight round the body and only a dark crease shows between them. A skin from the rim
  // to the body's surface (the body ellipsoid, S.lip deep inside it so no gap can open), sinking back a little in the
  // middle and darkening to the crease colour, so the shell's inner wall no longer shows as a pale band beside the body
  if (S.lip) {
    const lp = [], lc = [], li = [], K = 10, NJ = 192, rimC = col(S.rimEdge || "#A9632F"), dark = col(S.lipDark || "#3A2416");
    const bc = new THREE.Vector3(0, ch.cy + (S.lipDy ?? 0), 0), br = [ch.rx, ch.ry, ch.rz], d = new THREE.Vector3();
    for (let k = 0; k <= K; k++) for (let j = 0; j <= NJ; j++) {
      const s = k / K, ph = (j / NJ) * Math.PI * 2;
      const a = pt(dirAt(alphaOf(ph), ph, u), 0.975);
      d.copy(a).sub(bc); const m = Math.hypot(d.x / br[0], d.y / br[1], d.z / br[2]);
      const b = bc.clone().addScaledVector(d, (1 - S.lip) / m);
      const p = a.clone().lerp(b, s).addScaledVector(ax, (S.lipBack ?? 0.03) * Math.sin(s * Math.PI));
      lp.push(p.x, p.y, p.z);
      const cc = rimC.clone().lerp(dark, sstep(0, S.lipFade ?? 0.2, s) * (S.lipShade ?? 0.9)); lc.push(cc.r, cc.g, cc.b);
    }
    for (let k = 0; k < K; k++) for (let j = 0; j < NJ; j++) { const a = k * (NJ + 1) + j, b = a + 1, e = a + NJ + 1, f = e + 1; li.push(a, e, b, b, e, f); }
    // one-sided, facing out of the opening (forward, -ax): test one quad and flip the winding if it faces in
    { const v = (i) => new THREE.Vector3(lp[i * 3], lp[i * 3 + 1], lp[i * 3 + 2]), a = v(li[0]), b = v(li[1]), e = v(li[2]);
      if (b.clone().sub(a).cross(e.clone().sub(a)).dot(ax) > 0) for (let i = 0; i < li.length; i += 3) { const x = li[i + 1]; li[i + 1] = li[i + 2]; li[i + 2] = x; } }
    for (let i = 0; i < lc.length; i += 3) { lc[i] /= rimC.r; lc[i + 1] /= rimC.g; lc[i + 2] /= rimC.b; }
    const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(lp, 3)); lg.setAttribute("color", new THREE.Float32BufferAttribute(lc, 3)); lg.setIndex(li);
    // one even normal (out of the opening): a crease is a shadowed hollow, so it should not catch a highlight where the
    // skin bends round the neck
    { const nrm = []; for (let i = 0; i < lp.length; i += 3) nrm.push(-ax.x, -ax.y, -ax.z); lg.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3)); }
    const lipM = mesh(lg, std(S.rimEdge || "#A9632F", { roughness: 0.95, vertexColors: true }), false);
    lipM.userData.noOutline = true; lipM.name = "pebble-shell-lip"; group.add(lipM);
  }
  // the rim: a rounded roll along the cut edge, joining outside and inside
  const rim = [], rimDir = [];
  for (let j = 0; j < 96; j++) { const ph = (j / 96) * Math.PI * 2; dirAt(alphaOf(ph), ph, u); rimDir.push(u.clone()); rim.push(pt(u, 0.978)); }
  const rimCurve = new THREE.CatmullRomCurve3(rim, true);
  if (S.rimBand) {
    // the rim as one continuous rolled band (review 7 Nov 2026: separate capsules read as a necklace of beads): an
    // oval section, flatter outward and broader along the shell, swept round the cut edge; rimBand plates are marked
    // only by shallow joints (the section narrows a little and darkens there), as the pack's fitted marginal plates
    const n = S.rimBand, rr = S.rimR ?? 0.05, NS = 288, NR = 14, bp = [], bc = [], bi = [];
    const lightR = col(S.rimEdge || "#A9632F"), jointC = col(S.rimJoint || S.seam || "#4A2A18"), T = new THREE.Vector3(), Nn = new THREE.Vector3(), B = new THREE.Vector3();
    for (let k = 0; k <= NS; k++) {
      const s = (k % NS) / NS, p = rimCurve.getPointAt(s); rimCurve.getTangentAt(s, T);
      if (hugK) { let bi = 0, bd = 1e9; for (let i = 0; i < rim.length; i++) { const d = rim[i].distanceToSquared(p); if (d < bd) { bd = d; bi = i; } } Nn.copy(outN(rimDir[bi])); } else Nn.set((p.x - c.x) / (Rx * Rx), (p.y - c.y) / (Ry * Ry), (p.z - c.z) / (Rz * Rz)).normalize(); B.crossVectors(T, Nn).normalize(); Nn.crossVectors(B, T).normalize();
      const f = (s * n) % 1, jd = Math.exp(-(((Math.min(f, 1 - f)) / 0.045) ** 2));   // 1 at a joint
      const sw = 1 - 0.18 * jd, a = rr * (S.rimOut ?? 0.75) * sw, b = rr * (S.rimWide ?? 1.25) * sw;
      for (let q = 0; q <= NR; q++) {
        const th = (q / NR) * Math.PI * 2, x = Math.cos(th), y = Math.sin(th);
        bp.push(p.x + Nn.x * a * x + B.x * b * y, p.y + Nn.y * a * x + B.y * b * y, p.z + Nn.z * a * x + B.z * b * y);
        const cc = lightR.clone().multiplyScalar(0.94 + 0.08 * x).lerp(jointC, 0.75 * jd); bc.push(cc.r / lightR.r, cc.g / lightR.g, cc.b / lightR.b);
      }
    }
    for (let k = 0; k < NS; k++) for (let q = 0; q < NR; q++) { const a = k * (NR + 1) + q, b = a + 1, e = a + NR + 1, f = e + 1; bi.push(a, e, b, b, e, f); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute("position", new THREE.Float32BufferAttribute(bp, 3)); bg.setAttribute("color", new THREE.Float32BufferAttribute(bc, 3)); bg.setIndex(bi);
    // winding out: the first section's outermost vertex must face away from the curve
    { const P = bg.attributes.position, v = (i) => new THREE.Vector3().fromBufferAttribute(P, i), A = v(bi[0]), Bv = v(bi[1]), E = v(bi[2]), ctr = rimCurve.getPointAt(0);
      if (Bv.clone().sub(A).cross(E.clone().sub(A)).dot(A.clone().sub(ctr)) < 0) for (let i = 0; i < bi.length; i += 3) { const x = bi[i + 1]; bi[i + 1] = bi[i + 2]; bi[i + 2] = x; } bg.setIndex(bi); }
    bg.computeVertexNormals();
    { const Nm = bg.attributes.normal, W = NR + 1; for (let q = 0; q <= NR; q++) { const a = q, b = NS * W + q; const x = Nm.getX(a) + Nm.getX(b), y = Nm.getY(a) + Nm.getY(b), z = Nm.getZ(a) + Nm.getZ(b), l = Math.hypot(x, y, z) || 1; Nm.setXYZ(a, x / l, y / l, z / l); Nm.setXYZ(b, x / l, y / l, z / l); }
      for (let k = 0; k <= NS; k++) { const a = k * W, b = a + NR; const x = Nm.getX(a) + Nm.getX(b), y = Nm.getY(a) + Nm.getY(b), z = Nm.getZ(a) + Nm.getZ(b), l = Math.hypot(x, y, z) || 1; Nm.setXYZ(a, x / l, y / l, z / l); Nm.setXYZ(b, x / l, y / l, z / l); } }
    const band = mesh(bg, std(S.rimEdge || "#A9632F", { roughness: 0.9, vertexColors: true })); band.name = "pebble-shell-rim"; group.add(band);
  } else if (S.rimPlates) {
    // the rim as a ring of rounded marginal plates (Garden Guardian pack: a thick ring of separate lighter-brown plates
    // round the opening, each a fat capsule along a chord of the rim, small gaps between them)
    const n = S.rimPlates, rr = S.rimR ?? 0.05, geos = [], yAx = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < n; i++) {
      const a = rimCurve.getPointAt(i / n), b = rimCurve.getPointAt((i + 1) / n), len = a.distanceTo(b);
      const gC = new THREE.CapsuleGeometry(rr * (0.92 + 0.12 * R()), Math.max(0.001, len - rr * 2 - 0.006), 6, 12);
      gC.scale(1, 1, 0.8);
      const dir = b.clone().sub(a).normalize(), mid = a.clone().lerp(b, 0.5);
      gC.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(yAx, dir)); gC.translate(mid.x, mid.y, mid.z); gC.deleteAttribute("uv"); geos.push(gC);
    }
    group.add(mesh(mergeGeometries(geos), std(S.rimEdge || "#A9632F", { roughness: 0.85 })));
  } else group.add(mesh(new THREE.TubeGeometry(rimCurve, 160, S.rimR ?? 0.022, 10, true), std(S.rimEdge || "#C49465", { roughness: 0.8 })));
  P.add(group);
  // a point on the outside of the shell along direction w (unit space) and its outward normal (world-ish, bodyGroup space)
  const onShell = (w) => {
    const p = pt(w, rOf(w)), nn = new THREE.Vector3(w.x / Rx, w.y / Ry, w.z / Rz).normalize();
    if (hugK) nn.copy(outN(w));
    return { p, n: nn };
  };
  // the fern's root (correction brief 6 Nov): a direction INSIDE the clipped dome (fern.th: polar angle from the shell's
  // axis as a share of the opening there, fern.ph: azimuth, pi/2 = straight up), on the drawn surface. The old fern.at
  // direction lay past the top opening, on the ellipsoid's extension, so the plant stood in the air above the rim
  const F = S.fern || {}, fph = F.ph ?? Math.PI / 2, fw = dirAt(alphaOf(fph) * (F.th ?? 0.62), fph, new THREE.Vector3());
  const cushion = moss(group, onShell, dirAt, alphaOf, S, R, fw);
  const fern = S.fern === false ? () => {} : buildFern(group, onShell, S, fw, cushion);
  // the shell as a solid for checks (bodyGroup space before the group's own transform): an arm or a prop inside the
  // wall between the inside (0.955) and the outside (1 + bulge) of the cap
  // toUnit(p): a point (bodyGroup space) -> its unit-space vector q (|q| = 1 on the plain cap), undoing the hug
  const toUnit = (p) => {
    const v = p.clone().sub(c), a = v.dot(ax), perp = v.clone().addScaledVector(ax, -a); let h = 1, q = new THREE.Vector3();
    for (let i = 0; i < 4; i++) { const w = perp.clone().divideScalar(h).addScaledVector(ax, a); q.set(w.x / Rx, w.y / Ry, w.z / Rz); h = hugAt(q.clone().normalize()); }
    return q;
  };
  group.userData.shellSolid = { c, R: [Rx, Ry, Rz], ax, t1, t2, alphaOf, inner: 0.955, outer: 1 + bulge, toUnit };
  return { group, update: (st, t, hands, fries) => fern(st, t) };
}

// moss (correction brief 6 Nov 2026): ONE continuous low cushion following the drawn shell over its top, a few broad
// lobes, an irregular ragged edge, thickest round the fern's root; colour varies softly across it (vertex colours,
// no inner ink). A fringe of short tapered strands hangs from its lower edge over the sides (no outline: the cushion
// keeps the silhouette). Returns thick(w): the cushion's height over the shell along w (the fern root sits inside it)
function moss(group, onShell, dirAt, alphaOf, S, R, fw) {
  const M = S.moss === false ? false : S.moss || {}; if (M === false) return () => 0;
  const cs = [col(M.color || "#8E9B36"), col(M.light || "#A9B548"), col(M.dark || "#6F7D2A")];
  // review 7 Nov 2026: only a few broad low lobes (the old 31/97/83 terms made sharp folds and noisy normals); the fine
  // texture is colour, not shape
  const wave = (w) => 0.12 * Math.sin(w.x * 6.0 + 1.3) + 0.1 * Math.sin(w.z * 5.0 - 0.6) + 0.06 * Math.sin((w.x + w.z) * 9.0 + 0.8);
  const from = M.from ?? 0.45, Hm = M.thick ?? 0.05, root = (w) => Math.exp(-(w.distanceTo(fw) ** 2) / 0.06);
  // how much a direction is "top": the surface faces up, the waves break the edge into lobes, and the fern's root pulls it in
  const cover = (w, nn) => nn.y + wave(w) + 0.45 * root(w);
  const thick = (w) => { const { n } = onShell(w), cv = cover(w, n); return Hm * Math.pow(sstep(from, from + 0.3, cv), 0.6) * (0.86 + 0.14 * Math.sin(w.x * 7 + w.z * 5 + 0.3)); };
  const NT = M.nt ?? 70, NP = M.np ?? 200, pos = [], colr = [], idx = [], live = [], nrm = [], w = new THREE.Vector3();
  // the cushion's surface runs a little UNDER the shell where it thins out (sink), so its edge is the smooth line where it
  // leaves the shell, never the grid's cell edges
  const sink = M.sink ?? 0.006;
  for (let i = 0; i <= NT; i++) for (let j = 0; j <= NP; j++) {
    const ph = (j / NP) * Math.PI * 2; dirAt((alphaOf(ph) * 0.985 * i) / NT, ph, w);
    const { p, n } = onShell(w), h = thick(w);
    p.addScaledVector(n, h - sink); pos.push(p.x, p.y, p.z); nrm.push(n.x, n.y, n.z); live.push(h > sink * 0.5);
    const k = 0.5 + 0.5 * Math.sin(w.x * 41 + w.y * 13) * Math.sin(w.z * 37 - w.y * 11), c = cs[0].clone().lerp(k > 0.6 ? cs[1] : cs[2], Math.abs(k - 0.5) * 1.2).multiplyScalar(0.92 + 0.16 * (h / Hm));
    colr.push(c.r / cs[0].r, c.g / cs[0].g, c.b / cs[0].b);
  }
  const W = NP + 1;
  for (let i = 0; i < NT; i++) for (let j = 0; j < NP; j++) { const a = i * W + j, b = a + 1, e = a + W, f = e + 1; if (live[a] || live[b] || live[e] || live[f]) idx.push(a, b, e, b, f, e); }
  // winding out: compare one live triangle's normal with the shell's outward normal there (a world-up test is wrong on
  // a curved side)
  { const A = new THREE.Vector3(), B = new THREE.Vector3(), E = new THREE.Vector3(), V = (q, o) => o.set(pos[q * 3], pos[q * 3 + 1], pos[q * 3 + 2]);
    for (let k = 0; k < idx.length; k += 3) { V(idx[k], A); V(idx[k + 1], B); V(idx[k + 2], E); const nn = B.clone().sub(A).cross(E.clone().sub(A)); if (nn.lengthSq() < 1e-12) continue;
      if (nn.dot(new THREE.Vector3(nrm[idx[k] * 3], nrm[idx[k] * 3 + 1], nrm[idx[k] * 3 + 2])) < 0) for (let q = 0; q < idx.length; q += 3) { const x = idx[q + 1]; idx[q + 1] = idx[q + 2]; idx[q + 2] = x; }
      break; } }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(colr, 3)); g.setIndex(idx);
  g.computeVertexNormals();
  // smooth shading: half the cushion's own normal, half the shell's (a soft cushion, no facet light), one normal on both
  // columns of the wrap seam
  { const Nm = g.attributes.normal; for (let q = 0; q < Nm.count; q++) { const x = Nm.getX(q) + nrm[q * 3], y = Nm.getY(q) + nrm[q * 3 + 1], z = Nm.getZ(q) + nrm[q * 3 + 2], l = Math.hypot(x, y, z) || 1; Nm.setXYZ(q, x / l, y / l, z / l); }
    for (let i = 0; i <= NT; i++) { const a = i * W, b = a + NP; const x = Nm.getX(a) + Nm.getX(b), y = Nm.getY(a) + Nm.getY(b), z = Nm.getZ(a) + Nm.getZ(b), l = Math.hypot(x, y, z) || 1; Nm.setXYZ(a, x / l, y / l, z / l); Nm.setXYZ(b, x / l, y / l, z / l); } }
  const m = mesh(g, new THREE.MeshStandardMaterial({ color: cs[0], vertexColors: true, roughness: 1 })); m.name = "pebble-moss"; group.add(m);
  // the fringe: short strands hanging from the cushion's lower edge (where it thins out over steep sides), wide at the
  // root, tapering to a point below
  const geos = [], nF = M.strands ?? 160;
  for (let i = 0, tries = 0; i < nF && tries < nF * 30; tries++) {
    const ph = R() * Math.PI * 2; dirAt(alphaOf(ph) * 0.985 * R() ** 0.5, ph, w);
    const h = thick(w); if (h < Hm * 0.15 || h > Hm * 0.6) continue;
    const { p, n } = onShell(w); if (n.y > 0.75) continue;
    const L = (M.strand ?? 0.07) * (0.4 + 0.9 * R()), cg = new THREE.ConeGeometry((M.strandR ?? 0.005) * (0.6 + 0.8 * R()), L, 4);
    cg.rotateX(Math.PI); cg.translate(0, -L / 2, 0);   // base (wide) at the root, the point hanging down
    const down = new THREE.Vector3(0, -1, 0).addScaledVector(n, 0.35).normalize();
    cg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), down));
    p.addScaledVector(n, h * 0.6); cg.translate(p.x, p.y, p.z); cg.deleteAttribute("uv"); cg.deleteAttribute("normal"); geos.push(cg); i++;
  }
  if (geos.length) { const fm = mesh(mergeGeometries(geos), std(cs[0].clone().lerp(cs[1], 0.3).getStyle(), { roughness: 1 }), false); fm.material.userData.noOutline = true; fm.geometry.computeVertexNormals(); group.add(fm); }
  return thick;
}

// the fern: one plant from the upper rear of the shell, fronds fanning up and out and arching over at their tips, each a
// thin stalk with paired leaflets that shrink toward the tip. Each frond sways on its own slow rhythm and the whole
// plant lags behind the body's moves (follow-through st.ft)
function buildFern(group, onShell, S, w, cushion = () => 0) {
  const F = S.fern || {}, base = onShell(w);
  // the root sits half way into the moss cushion over the drawn shell (shell group space = body space: the group has
  // no transform of its own), so every frond leaves the moss, never the air
  const root = new THREE.Group(); root.position.copy(base.p).addScaledVector(base.n, cushion(w) * 0.45); root.name = "pebble-fern-root"; group.add(root);
  const stalkM = std(F.stalk || "#6E8A2E", { roughness: 0.8 }), leafM = std(F.color || "#86A23A", { roughness: 0.8, side: THREE.DoubleSide }), leafL = std(F.light || "#9DB84A", { roughness: 0.8, side: THREE.DoubleSide });
  leafM.userData.noOutline = true; leafL.userData.noOutline = true;   // thin leaflets: an ink hull per leaflet drew them as thick bars
  const fronds = [];
  const list = F.fronds || [[0, 0.3, 0.06], [1.05, 0.27, 0.42], [2.1, 0.24, 0.5], [3.15, 0.26, 0.46], [4.2, 0.25, 0.5], [5.25, 0.28, 0.42], [0.5, 0.2, 0.75], [3.7, 0.19, 0.78]];
  // a leaflet (pinna): an oblong oval with a rounded tip (pack: rows of short rounded leaflets), its length along +z, flat
  // in x-z (its normal +y), curling gently down at the tip and cupped a little across (a shallow trough reads as a leaf
  // from the side, where a flat plate would vanish edge-on). Width: fern.leafW x its length
  const leaf = (() => { const sh = new THREE.Shape(), N = 12; sh.moveTo(0, 0);
    for (let k = 1; k <= N; k++) { const t = k / N; sh.lineTo(0.5 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.02)), 0.75) * (1 - 0.25 * t), t); }
    for (let k = N - 1; k >= 1; k--) { const t = k / N; sh.lineTo(-0.5 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.02)), 0.75) * (1 - 0.25 * t), t); }
    const g = new THREE.ShapeGeometry(sh, 2); g.rotateX(Math.PI / 2);   // shape y -> +z (length), flat in x-z
    const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const z = P.getZ(i), x = P.getX(i); P.setY(i, -0.1 * z * z + 0.35 * x * x); }
    g.deleteAttribute("uv"); return g; })();
  // the leaflet's frame (review 7 Nov 2026): one right-handed basis per leaflet, Z = base-to-tip, Y = the frond blade's
  // normal (so every leaflet lies in its frond's blade), X = Y x Z; no lookAt and no world-space flip afterwards (that
  // sent +z to [dir.x, -dir.y, dir.z])
  const bX = new THREE.Vector3(), bY = new THREE.Vector3(), bZ = new THREE.Vector3(), basis = new THREE.Matrix4();
  const frame = (dir, blade) => {
    bZ.copy(dir).normalize(); bY.copy(blade).addScaledVector(bZ, -blade.dot(bZ));
    if (bY.lengthSq() < 1e-6) bY.set(0, 1, 0).addScaledVector(bZ, -bZ.y);   // fallback: nearly parallel
    bY.normalize(); bX.crossVectors(bY, bZ).normalize(); bY.crossVectors(bZ, bX);
    return basis.makeBasis(bX, bY, bZ);
  };
  list.forEach(([az, len, out, off = 0], i) => {
    const piv = new THREE.Group(); root.add(piv);
    // a frond's 4th value (opt-in, Jonny 7 Nov 12:07 "stagger their roots across a small patch"): its root sits that far
    // (m) from the plant's centre along its own azimuth, a little down into the moss, so the stems don't all meet at one point
    if (off) piv.position.set(Math.sin(az) * off, -off * 0.35, Math.cos(az) * off);
    // the frond's plane: up and out along az; it rises then arches over
    const o = new THREE.Vector3(Math.sin(az), 0, Math.cos(az)), pts = [];
    if (F.arch) {
      // arch (Garden Guardian pack): the frond leaves the root steeply, then bends out along its length, so the tip
      // hangs out over the side. out 0..1: how far it leans and bends (a0 from vertical at the root, a1 at the tip)
      const a0 = (10 + 28 * out) * Math.PI / 180, a1 = a0 + (F.bend ?? 1) * (45 + 55 * out) * Math.PI / 180;   // bend: how far the tips arch over
      let x = 0, y = 0; pts.push(new THREE.Vector3());
      for (let k = 1; k <= 12; k++) { const s = (k - 0.5) / 12, a = a0 + (a1 - a0) * s ** 1.4; x += Math.sin(a) * len / 12; y += Math.cos(a) * len / 12; pts.push(o.clone().multiplyScalar(x).add(new THREE.Vector3(0, y, 0))); }
    } else for (let k = 0; k <= 12; k++) { const s = k / 12, rise = Math.sin(s * Math.PI * 0.62) * len * (1 - out * 0.35), reach = s * len * (out + 0.18) + 0.25 * len * out * s * s; pts.push(o.clone().multiplyScalar(reach).add(new THREE.Vector3(0, rise - out * 0.18 * len * s * s, 0))); }
    const curve = new THREE.CatmullRomCurve3(pts);
    piv.add(mesh(new THREE.TubeGeometry(curve, 20, F.stalkR ?? 0.0042, 5), stalkM, false));
    const geos = [];
    const np = F.pairs ?? 11;
    // the frond's blade lies in the plane its stalk arches in (up and out along az), as a feather: seen across that plane
    // the whole frond shows face-on, along it edge-on, and fronds at different azimuths keep the plant leafy from every
    // side (pack turnaround: each frond reads as a feather in its own plane). bn: the blade's normal
    const bn = new THREE.Vector3(Math.cos(az), 0, -Math.sin(az));
    for (let k = 0; k < np; k++) {
      const s = 0.12 + 0.86 * (k / (np - 1)), p = curve.getPointAt(s), tg = curve.getTangentAt(s);
      const side = new THREE.Vector3().crossVectors(bn, tg).normalize(), blade = bn;
      // leaflets shrink toward the tip (tapered, the last few small), with a little size variation
      const L = (F.leaf ?? 0.05) * (1.0 - 0.7 * s ** 1.3) * (0.92 + 0.16 * Math.sin(k * 2.1 + i)), Wd = L * (F.leafW ?? 0.42);
      for (const sd of [-1, 1]) {
        const dir = side.clone().multiplyScalar(sd).addScaledVector(tg, F.leafFwd ?? 0.45).normalize();
        // a pair forms a shallow V across the stalk (each leaflet tilted up a little about its own length)
        const bl = blade.clone().applyAxisAngle(dir, sd * (F.leafV ?? 0.25)), lg = leaf.clone();
        lg.scale(Wd, L, L); lg.applyMatrix4(frame(dir, bl)); lg.translate(p.x, p.y, p.z); geos.push(lg);
      }
    }
    const lm = mesh(mergeGeometries(geos), i % 2 ? leafL : leafM, false); lm.geometry.computeVertexNormals(); piv.add(lm);
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

// ---------------------------------------------------------------- the straw (Garden Guardian pack, 6 Nov 2026): a short
// thin dry grass stem, gently bent, with a small seed head, held in the LEFT corner of his mouth (+u on the face: toward
// the viewer's right in a front view). Its root sits a little inside the lips at the corner and follows the corner every
// frame (face.js corners: the corner moves in when the mouth opens or puckers, up with a smile), the free end points out
// and a little down and forward. It lives in the head group, so it turns with the head and never swaps sides with the
// camera. costume.straw false: no straw (straw.side -1: the right corner).
function buildStraw(ch, C) {
  const K = C.straw; if (!K || !ch.head || !ch.face) return null;
  const side = K.side ?? 1, len = K.length ?? 0.16, r = K.r ?? 0.0032;
  const m = std(K.color || "#D9AE5C", { roughness: 0.9 }), seedM = std(K.seed || "#C99A45", { roughness: 0.9 });
  const g = new THREE.Group(); g.name = "pebble-straw";
  // the stem along +x (out of the corner), bowing up a little then drooping; a seed head of small grains on its last fifth
  const pts = [];
  for (let k = 0; k <= 10; k++) { const s = k / 10; pts.push(new THREE.Vector3(-0.012 + s * len, 0.018 * Math.sin(s * Math.PI * 0.8) - (K.droop ?? 0.03) * s * s, 0)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  g.add(mesh(new THREE.TubeGeometry(curve, 24, r, 6), m, false));
  const geos = [], grain = new THREE.SphereGeometry(1, 8, 6);
  for (let k = 0; k < (K.grains ?? 9); k++) {
    const s = 0.8 + 0.19 * (k / ((K.grains ?? 9) - 1)), p = curve.getPointAt(s), tg = curve.getTangentAt(s), sd = k % 2 ? 1 : -1;
    const gg = grain.clone(); gg.scale(0.0085 * (1.15 - 0.4 * (s - 0.8) * 5), 0.0034, 0.0034);
    const dir = tg.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), sd * 0.45).normalize();
    gg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir));
    gg.translate(p.x + dir.x * 0.006, p.y + dir.y * 0.006, p.z); geos.push(gg);
  }
  const tipG = grain.clone(); tipG.scale(0.008, 0.003, 0.003); const pe = curve.getPointAt(1); tipG.translate(pe.x + 0.005, pe.y, pe.z); geos.push(tipG);
  g.add(mesh(mergeGeometries(geos), seedM, false));
  ch.root.add(g);
  const yaw = (K.yaw ?? 35) * Math.PI / 180, dip = (K.dip ?? 12) * Math.PI / 180;
  // its pose in the lips (head group space) and in a hand (the hand's space: the root at the index finger's pad, the
  // stem out past the fingertips and a little toward the thumb), both turned into the character root's space every
  // frame; the "straw" action (timeline.js) blends them, so a hand-off is a continuous move, never a pop
  const inv = new THREE.Matrix4(), mM = new THREE.Matrix4(), hM = new THREE.Matrix4(), tmp = new THREE.Matrix4(), e = new THREE.Euler();
  const pa = new THREE.Vector3(), pb = new THREE.Vector3(), qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), sc = new THREE.Vector3();
  // in a hand (correction brief 6 Nov): held by the hand's pinch point (between the index and thumb pads) at the grip
  // point, straw.grip metres along the stem (outside the lips, so the pads close on a visible piece of stem). straw.hold
  // { p, q } is the straw's pose in the pinch point's space, calibrated once at the contact pose (tools/pebble/
  // straw-cal.mjs: L = inverse(pinch at contact) x straw-in-lips at contact), so at the hand-over the two owners agree in
  // position AND direction and the short blend between them moves nothing. Deterministic: a constant, no frame history
  const H0 = K.hold, gripX = K.grip ?? 0.055;
  // (a full matrix: the left glove is mirrored and sized, so its pinch point's space has a negative, non-unit scale that a
  // position + quaternion can't hold)
  const handLocal = H0 ? new THREE.Matrix4().fromArray(H0.m)
    : new THREE.Matrix4().compose(new THREE.Vector3(-gripX, 0, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2 - 0.35)), one);
  const update = (st) => {
    const S = st.straw || { hand: 0, away: 0, side: "R" };
    g.visible = !S.away;
    const cn = ch.face.corners?.[side > 0 ? "L" : "R"]; if (!cn || !g.visible) return;
    ch.root.updateMatrixWorld(true); inv.copy(ch.root.matrixWorld).invert();
    // in the lips: into the lips along the surface normal; the stem leaves sideways (+x on his left), turned forward by yaw
    const p = ch.face.place(cn[0], cn[1]);
    e.set(0, side > 0 ? -yaw : Math.PI + yaw, side > 0 ? -dip : dip, "YXZ");
    tmp.compose(p.pos.clone().addScaledVector(p.normal, -(K.inset ?? 0.004)), qa.setFromEuler(e), one);
    mM.multiplyMatrices(inv, ch.head.group.matrixWorld).multiply(tmp);
    mM.decompose(pa, qa, sc);
    const k = Math.max(0, Math.min(1, S.hand || 0));
    if (k > 0) {
      const hand = ch.arms[S.side || "R"].hand, own = hand.userData.pinchPt || hand.userData.pad || hand;
      hand.updateMatrixWorld(true);
      hM.multiplyMatrices(inv, own.matrixWorld).multiply(handLocal); hM.decompose(pb, qb, sc);
      // the hand-over happens while the hand holds still at the lips (strawOut / strawIn), where both owners agree, so
      // a plain eased blend (no arc: the arc lifted it off both) is all the move there is
      const u = k * k * (3 - 2 * k);
      pa.lerp(pb, u); qa.slerp(qb, u);
    }
    g.position.copy(pa); g.quaternion.copy(qa);
    // the root's scale (the character's own size) is in ch.root, so the straw keeps its size in the root's space
  };
  return { group: g, update, gripLocal: new THREE.Vector3(gripX, curve.getPointAt(Math.min(1, (gripX + 0.012) / len)).y, 0) };
}

// toasted spots on the arms and legs (Garden Guardian pack): soft-edged patches on the thighs and the upper arms, flat
// discs that ride on the leg and arm tubes (re-placed every frame from the limb curves potato.js keeps). spots.legs /
// .arms: [t along the limb (0 hip/shoulder .. 1 foot/hand), angle round it (0 front, + toward his outside), radius]
function limbSpots(ch, C) {
  const K = C.spots || {}; if (K === false || K.limbs === false) return null;
  const m = std(K.color || "#D27A30", { roughness: 0.8 }); m.userData.noOutline = true; m.userData.decor = true;
  if (K.flat) Object.assign(m, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  const legs = K.legs || [[0.3, 0.7, 0.032], [0.48, 1.35, 0.024], [0.22, -0.2, 0.02], [0.62, 0.35, 0.02]];
  const arms = K.arms || [[0.2, 0.9, 0.026], [0.32, 1.6, 0.019], [0.12, 0.2, 0.017], [0.45, 1.1, 0.015]];
  const disc = new THREE.SphereGeometry(1, 14, 8);
  const make = (list) => list.slice(0, K.nLimb ?? list.length).map(([t, a, r]) => { const x = mesh(disc, m, false); x.scale.set(r, K.flat ? 0.0006 : 0.0035, r * 0.85); x.userData.spot = [t, a]; x.userData.skin = true; ch.root.add(x); return x; });
  const set = { R: { leg: make(legs), arm: make(arms) }, L: { leg: make(legs), arm: make(arms) } };
  const fwd = new THREE.Vector3(), side = new THREE.Vector3(), n = new THREE.Vector3(), yUp = new THREE.Vector3(0, 1, 0);
  const place = (list, curve, w, sx, show, radius) => {
    for (const x of list) {
      x.visible = show; if (!show || !curve) continue;
      const [t, a] = x.userData.spot, p = curve.getPointAt(t), tg = curve.getTangentAt(t);
      fwd.set(0, 0, 1).addScaledVector(tg, -tg.z).normalize(); side.crossVectors(tg, fwd).normalize();
      if (side.x * sx < 0) side.negate();
      n.copy(fwd).multiplyScalar(Math.cos(a)).addScaledVector(side, Math.sin(a)).normalize();
      x.position.copy(p).addScaledVector(n, radius(t, w) + 0.0015); x.quaternion.setFromUnitVectors(yUp, n);
    }
  };
  return (st) => {
    const show = ch.legs.R.mesh?.visible !== false;
    for (const s of ["R", "L"]) {
      const sx = s === "R" ? -1 : 1, L = ch.legs[s], A = ch.arms[s], Ch = ch.constructor;
      const legC = L.hip && L.knee ? Ch.armCurve(L.hip, L.knee, L.foot.position) : null;
      place(set[s].leg, legC, ch.def.legs?.width ?? ch.limbW * 1.1, sx, show && !!legC, (t, w) => w);
      const armC = A.elbow ? Ch.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint) : null;
      place(set[s].arm, armC, ch.limbW, sx, show && !!armC && A.mesh?.visible !== false, (t, w) => Ch.armRadius(t, w, ch.def.limbs?.armTaper));
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
    // feet.blend (opt-in, m: the leg's radius at the ankle; Jonny 7 Nov "remove the abrupt cuff"): the upper half of the
    // foot draws in to the leg's round section, so the leg widens into the foot in one flowing shape instead of standing
    // on a separate swollen pad; the front stays long below for the toes
    if (K.blend) for (let i = 0; i < P.count; i++) {
      const y = P.getY(i), k = Math.min(1, Math.max(0, (y - 0.012 * 0 - (K.blendFrom ?? -0.01)) / (h * 0.9 + 0.012 - (K.blendFrom ?? -0.01)))), e = k * k * (3 - 2 * k);
      if (e <= 0) continue; const x = P.getX(i), z = P.getZ(i), L = Math.hypot(x, z); if (L < 1e-6) continue;
      const m = (L + (K.blend - L) * e) / L; P.setX(i, x * m); P.setZ(i, z * m);
    }
    g.computeVertexNormals();
    f.geometry.dispose(); f.geometry = g; f.scale.set(1, 1, 1);
    // three broad cream toe tips (correction brief 6 Nov: the old tiny beads read as pearls): flattened rounded nails
    // growing out of the front of the foot along its front arc, half sunk into it, their undersides on the sole
    let sole = 0; for (let i = 0; i < P.count; i++) sole = Math.min(sole, P.getY(i));
    const tw = K.toeW ?? 0.3, geos = [];
    for (const k of [-1, 0, 1]) {
      const rx = w * tw * (k ? 0.9 : 1), ry = h * (K.toeH ?? 0.62), rz = d * (K.toeD ?? 0.3), x = k * w * 0.58, z = d * ((K.toeZ ?? 0.86) - 0.25 * k * k) + 0.012;   // toeH/toeD/toeZ: flatter nails set further into the foot (review 7 Nov)
      const t = new THREE.SphereGeometry(1, 18, 12); t.scale(rx, ry, rz); t.rotateY(-k * 0.35); t.translate(x, sole + ry * 0.92, z);
      const TP = t.attributes.position; for (let i = 0; i < TP.count; i++) if (TP.getY(i) < sole + 0.002) TP.setY(i, sole + 0.002);
      t.deleteAttribute("uv"); geos.push(t);
    }
    const tg = mergeGeometries(geos);
    // feet.out (opt-in, radians): each foot turns its toes out a little (Jonny 7 Nov: a slight natural outward set)
    if (K.out) { const a = (s === "L" ? 1 : -1) * K.out; g.rotateY(a); tg.rotateY(a); g.computeVertexNormals(); }
    tg.computeVertexNormals(); f.add(mesh(tg, toeM, false));
  }
}
