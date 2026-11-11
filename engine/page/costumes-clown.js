import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { taperedTube } from "./geo.js";
import { clothMat, liningMat, garment, sstep } from "./costumes-art.js";
import { lowerShell } from "./costumes-cast.js";

// MR. CRISP (Hot Potato, 11 Nov 2026): the evil clown potato who hosts the show. costume.type "clown", cast id
// hot-potato/mr-crisp. His COSTUME is the sweet pastel kids' show, his FACE is not. Same look in every castLook (like Spud's
// sweater: costumes-cast.js castCostume builds it for any look). Built from the character's own surface, so it follows any
// body size and squashes with it. Nothing here repeats like a texture: the stripes, the frill lobes, the pompom clumps and
// the paint edge each come from a hash of the costume seed, so every mark is drawn once and the same in every render.
//
// BODY (characters/hot-potato/mr-crisp.json): golden #e9b04f, 1.12 x 0.9 x 0.76 m (Viking is 1.02), body.keepSkin so no
// look repaints it. Hands: the rig's seamless 3-finger glove, white, size 1.3.
//
// COSTUME KEYS (all optional; default in brackets)
//   seed 7             the hash seed of every irregular mark (stripe edges, frill lobes, pompom lumps, paint edge)
//   hair "#f29ab8"     the two cotton-candy puffs at the sides of the head (about 0.3 m across, lumpy clusters)
//   hat "#f6e27a"      the lemon cone party hat (0.2 m tall, tilted, on the top of the head, sits 0.04 m into it)
//   pompom "#f29ab8"   the pompom on the hat's tip
//   stem "#5d6b2c", leaf "#3f5a2a"   his sprout: one wilted leaf on a bent stem beside the hat (sprout.placement is "none")
//   paint "#f6efe2"    the white greasepaint, a soft heart on the face round the eyes, brows and mouth (also the lids)
//   diamond "#4f8fd6"  the small blue diamonds above and below each eye
//   smile "#c8262c"    the painted red smile band that runs past the mouth corners up onto the cheeks
//   nose "#d92b2b"     the round shiny red nose (r 0.055)
//   collar ["#9cc4ee", "#a8dcc0", "#f4a6c0"]   the three ruffle layers, top to lowest: blue, mint, pink
//   stripeA "#f08aa8", stripeB "#fbf0d8"       candy pink and cream: the waistcoat's wide stripes and the sleeves'
//   buttons ["#f6d24a", "#a8dcc0", "#d92b2b"]  three fluffy pompom buttons down the front, each r 0.06
//   cuff "#fbf0d8"     the small frill where each sleeve ends at the wrist
//   trousers "#7fa6d8" the lower shell under the waistcoat (hidden behind the balcony wall in the clip)
//   shoes "#c8262c"    the big round-toed shoes (the rig's feet, scaled up)
//   glove "#fbfbf8"    the gloves, the wrist and the rig's own hand parts
//   cuffGap 0.062      how far before the hand's centre the sleeve ends
//   Not keys: the body colour (body.color), the legs' colour (limbs.color: the trousers' blue), the eye and brow design.
//   What the clip may recolour: every colour key above (a variation of the same costume); do not change shapes or sizes.
//
// FACE CONTROLS the character file sets (face.*, applied the same in every castLook through face.final + lockLayout)
//   layout   eyeU 0.46, eyeV 0.15, browV 0.7, mouthV -0.27, mouthW 0.36: eyes wide apart, a wide mouth, brows high enough
//            for the blue diamond between brow and eye
//   eye      iris "#f2c21a" yellow, iris 0.7, oval 1.0 (a lower, wider eye), flick 0.5, lash 1.8 (the heavy lid line), tilt 0.15 (outer corners up), pupilZ 0.12 (the small dark pupil shows in the yellow)
//   browShape thick 1.9, arch 0.02, inner 0.15, outer 0.66: thick dark brows, angled down toward the nose by the face
//   mouth.sharp 1   a row of small pointed teeth (face.js, opt-in, default 0; shows whenever the mouth is open)
//   neutral  the EVIL GRIN as the resting face (default "evil"; tilt -0.5, curve 0.8, open 0.35, smirk 0.3, pupil 0.75) with
//            lidL / lidR 0.5 (lids about a half down over the iris). The clip's stock expr names ("evil", "delighted", "furious", a laugh)
//            replace the neutral numbers but the two lid controls stay: set { do: "face", lid: 0 } for the TV smile.
//
// ORIGINS: hat.group stands on the top of the head (its base 0.04 m inside the head), y up. The head, collar, waistcoat and
// trousers are children of the body (ch.potatoParts); sleeves, cuff frills and the nose-less limbs ride the arms (ch.root).
// No held prop (out.prop null). out.sitDepth 0.04.

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const hash = (x) => { const v = Math.sin(x * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const lerp = (a, b, k) => a + (b - a) * k;
const mesh = (g, m, shadow = true) => { const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = shadow; return o; };
const flat = (m) => { m.userData.noOutline = true; m.side = THREE.DoubleSide; return m; };
const onTop = (m, k = 1) => { m.polygonOffset = true; m.polygonOffsetFactor = -2 * k; m.polygonOffsetUnits = -4 * k; return m; };   // paint over paint: never z-fights   // thin paint and the limbs' coloured materials: the ink hull blows up on them

// a lumpy clump (cotton-candy hair, a pompom): a core and n lumps round it, each its own size and place, vertex colours a little
// lighter outward and up and darker in the hollows. One merged geometry, material vertexColors.
function puff(r, color, seed, n = 15) {
  const base = new THREE.Color(color), gs = [];
  for (let i = 0; i <= n; i++) {
    const core = i === 0, y = 1 - (2 * (i - 0.5)) / n, ra = Math.sqrt(Math.max(0, 1 - y * y)), ph = i * 2.399963 + hash(seed + i) * 0.9;
    const d = core ? V(0, 0, 0) : V(Math.cos(ph) * ra, y, Math.sin(ph) * ra);
    const lr = core ? r * 0.7 : r * (0.36 + 0.14 * hash(seed + i * 1.7)), dist = core ? 0 : r * (0.6 + 0.14 * hash(seed + i * 2.3));
    const g = new THREE.SphereGeometry(lr, 12, 9); g.translate(d.x * dist, d.y * dist, d.z * dist);
    const k = core ? 0.88 : 0.95 + 0.12 * hash(seed + i * 3.1) + 0.06 * d.y, cols = new Float32Array(g.attributes.position.count * 3);
    for (let j = 0; j < cols.length; j += 3) { cols[j] = base.r * k; cols[j + 1] = base.g * k; cols[j + 2] = base.b * k; }
    g.setAttribute("color", new THREE.BufferAttribute(cols, 3)); gs.push(g);
  }
  return mergeGeometries(gs);
}
const puffMat = () => { const m = std("#ffffff", { vertexColors: true, roughness: 0.95 }); m.userData.lookRole = "cloth"; return m; };

// a (nu+1) x (nv+1) grid of points as a mesh with vertex colours; closed: the last column joins the first (normals welded)
function grid(P, nu, nv, cols, closed) {
  const pos = new Float32Array(P.length * 3), col = new Float32Array(P.length * 3), idx = [];
  P.forEach((p, i) => { pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; const c = cols(i % (nu + 1), Math.floor(i / (nu + 1))); col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; });
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  if (closed) { const N = g.attributes.normal; for (let j = 0; j <= nv; j++) { const a = j * (nu + 1), b = a + nu, x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); } }
  return g;
}

// one frill of the collar, lying on the body round elevation `ph`: from the body out `w` metres, hanging `drop` lower at its
// free edge. The lobes are cut by a hash: each has its own width and wave height, so no two ruffles match.
function frill(ch, o) {
  const NU = 420, NV = 8, K = o.lobes, base = new THREE.Color(o.color), P = [], seed = o.seed;
  const widths = Array.from({ length: K }, (_, i) => 0.6 + 0.8 * hash(seed + i * 3.7)), sum = widths.reduce((a, b) => a + b, 0), edge = [0];
  widths.forEach((w, i) => edge.push(edge[i] + (w / sum) * Math.PI * 2));
  const amps = Array.from({ length: K }, (_, i) => o.amp * (0.7 + 0.6 * hash(seed + i * 7.3 + 1)));
  const lobeAt = (th) => { const t = ((th % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); let i = 0; while (i < K - 1 && edge[i + 1] <= t) i++; return [i, (t - edge[i]) / (edge[i + 1] - edge[i])]; };
  const wave = [], bright = [];
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const th = (i / NU) * Math.PI * 2, v = j / NV, s = ch.surf(th, o.ph + (o.dip || 0) * Math.cos(th)), n = s.normal, h = V(n.x, 0, n.z).normalize(), [li, x] = lobeAt(th);
    const w = Math.sin(2 * Math.PI * x) * amps[li], scallop = 1 + 0.1 * Math.cos(2 * Math.PI * x) * v, out = o.w * v * scallop;
    const p = s.pos.clone().addScaledVector(n, o.lift).addScaledVector(h, out);
    p.y += o.rise * Math.sin(Math.PI * Math.min(1, v * 1.5)) * (1 - v) - o.drop * v ** 1.6 + w * v ** 1.3;
    P.push(p); wave.push(w / o.amp * v);
  }
  return grid(P, NU, NV, (i, j) => { const k = 0.82 + 0.18 * sstep(0, 0.5, j / NV) + 0.07 * wave[j * (NU + 1) + i]; return [base.r * k, base.g * k, base.b * k]; }, true);
}

// the waistcoat's stripes: wide candy-pink and cream bands across the front, a little uneven (each edge leans and wobbles by
// its own amount, each stripe its own width and shade), fading to plain cream behind. Returns a colour for (th, v)
function stripes(seed, A, B, lim = 1.95, K = 9) {
  const pa = new THREE.Color(A), cr = new THREE.Color(B), w = Array.from({ length: K }, (_, i) => 0.78 + 0.44 * hash(seed + i * 2.9)), sum = w.reduce((a, b) => a + b, 0);
  const b0 = [-lim]; w.forEach((x, i) => b0.push(b0[i] + (x / sum) * 2 * lim));
  const tint = w.map((_, i) => 0.95 + 0.1 * hash(seed + i * 5.3 + 2)), lean = b0.map((_, i) => (hash(seed + i * 4.1 + 3) - 0.5) * 0.16), wob = b0.map((_, i) => 0.012 + 0.02 * hash(seed + i * 6.7 + 4));
  const c = new THREE.Color();
  return (th, v) => {
    const t = Math.atan2(Math.sin(th), Math.cos(th)); c.copy(cr);
    for (let i = 0; i < K; i++) {
      const e0 = b0[i] + lean[i] * (v - 0.5) + wob[i] * Math.sin(v * 7 + i * 2.1), e1 = b0[i + 1] + lean[i + 1] * (v - 0.5) + wob[i + 1] * Math.sin(v * 7 + (i + 1) * 2.1), f = 0.03;
      const k = sstep(e0 - f, e0 + f, t) - sstep(e1 - f, e1 + f, t); if (k <= 0) continue;
      const src = i % 2 ? cr : pa; c.lerp(src.clone().multiplyScalar(tint[i]), k);
    }
    return c;
  };
}

// the party hat, with his sprout beside it: a cone on y (base at 0, tip at 0.2), a pompom on the tip, a bent stem rising from the
// head and drooping, a small dark leaf hanging from its end, wilted (it curls down along its length)
function partyHat(C) {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const seed = C.seed ?? 7, hatM = std(C.hat || "#f6e27a", { roughness: 0.6 }), cone = new THREE.ConeGeometry(0.088, 0.2, 32, 8, false);
  { const p = cone.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i) + 0.1, k = y / 0.2; p.setX(i, p.getX(i) + 0.022 * k * k); p.setY(i, y); } cone.computeVertexNormals(); }
  inner.add(mesh(cone, hatM));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.007, 8, 32), std("#e8c93f", { roughness: 0.6 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.004; inner.add(rim);
  const pom = mesh(puff(0.034, C.pompom || "#f29ab8", seed + 40, 11), puffMat()); pom.position.set(0.022, 0.208, 0); inner.add(pom);
  inner.rotation.set(-0.05, 0, -0.2); inner.position.set(-0.03, 0, 0.02);
  // the sprout: leaves the head's top just behind the hat on the other side, arches out over it and hangs
  const stemM = flat(std(C.stem || "#5d6b2c", { roughness: 0.7 })), leafM = std(C.leaf || "#3f5a2a", { roughness: 0.6, side: THREE.DoubleSide });
  const curve = new THREE.CatmullRomCurve3([V(0.075, -0.03, 0.0), V(0.08, 0.04, -0.005), V(0.1, 0.1, -0.01), V(0.14, 0.145, -0.01), V(0.19, 0.145, -0.005), V(0.22, 0.115, 0.0), V(0.228, 0.085, 0.0)]);
  g.add(mesh(taperedTube(curve, 0, 0, 28, 8, (t) => 0.0085 - 0.0038 * t), stemM));
  const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.quadraticCurveTo(0.036, 0.034, 0, 0.098); shape.quadraticCurveTo(-0.034, 0.034, 0, 0);
  const lg = new THREE.ShapeGeometry(shape, 10), lp = lg.attributes.position;
  for (let i = 0; i < lp.count; i++) { const y = lp.getY(i); lp.setZ(i, -1.7 * y * y + 0.2 * Math.abs(lp.getX(i)) * (1 - y * 6)); lp.setX(i, lp.getX(i) + 0.1 * y * y); }   // the wilt: it bends over along its length and the edges cup
  lg.computeVertexNormals();
  const leaf = mesh(lg, leafM); leaf.position.copy(curve.getPoint(1)); leaf.rotation.set(0.1, 0.5, Math.PI - 0.45); g.add(leaf);
  const rib = mesh(taperedTube(new THREE.CatmullRomCurve3([V(0, 0, 0.001), V(0.003, 0.05, -0.0015), V(0.008, 0.095, -0.012)]), 0, 0, 8, 5, (t) => 0.0032 * (1 - 0.7 * t)), flat(std("#2c4220", { roughness: 0.7 }))); leaf.add(rib);
  return { group: g, height: 0.2 };
}

// a flat decal on the face along (u, v) points: a ribbon of constant or tapered half-width `hw(t)` (face units) about the
// polyline, laid on the skin `lift` m up
function ribbon(face, pts, hw, lift, mat, n = 40) {
  const cur = new THREE.CatmullRomCurve3(pts.map(([u, v]) => V(u, v, 0))), A = [], B = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = cur.getPoint(t), d = cur.getTangent(t), nx = -d.y, ny = d.x, w = hw(t);
    A.push([p.x + nx * w, p.y + ny * w]); B.push([p.x - nx * w, p.y - ny * w]);
  }
  const a = face._surfLine(A, lift), b = face._surfLine(B, lift), pos = [], idx = [];
  for (let i = 0; i <= n; i++) pos.push(a[i].x, a[i].y, a[i].z, b[i].x, b[i].y, b[i].z);
  for (let i = 0; i < n; i++) { const q = i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.renderOrder = 2; return m;
}
// a polygon on the face (u, v), as rings from its middle `c` out to the outline: a soft-edged paint patch
function patch(face, outline, c, lift, mat, k = 1) {
  const NA = outline.length, NR = 7, pos = [], idx = [];
  for (let r = 0; r <= NR; r++) {
    const s = (r / NR) * k, pts = outline.map(([u, v]) => [c[0] + (u - c[0]) * s, c[1] + (v - c[1]) * s]);
    for (const q of face._surfLine(pts, lift)) pos.push(q.x, q.y, q.z);
  }
  for (let r = 0; r < NR; r++) for (let i = 0; i < NA; i++) { const a = r * NA + i, b = r * NA + (i + 1) % NA, d = (r + 1) * NA + i, e = (r + 1) * NA + (i + 1) % NA; idx.push(a, d, b, b, d, e); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.renderOrder = 1; return m;
}

export function clown(C, ch, out) {
  const parts = ch.potatoParts, seed = C.seed ?? 7, face = ch.face, L = face.layout;
  const paintC = C.paint || "#f6efe2", skinC = ch.skin.color.clone(), mixC = skinC.clone().lerp(new THREE.Color(paintC), 0.5);

  // ---------------------------------------------------------------------------------------------- hair: two cotton-candy puffs
  for (const s of [-1, 1]) {
    const m = mesh(puff(0.152, C.hair || "#f29ab8", seed + (s > 0 ? 11 : 31), 17), puffMat());
    const q = ch.surf(s * 1.18, 0.46); m.position.copy(q.pos).addScaledVector(q.normal, 0.085); m.position.y += 0.02;
    m.scale.set(1.0, 0.95, 0.92); parts.add(m);
  }

  // ---------------------------------------------------------------------------------------------- greasepaint, diamonds, smile band, nose
  // the white heart: two lobes up over the brows, a notch between them, the cheeks widest at the eyes, a point at the chin
  { const jit = (i, a) => (hash(seed + i * 9.1 + 5) - 0.5) * a;
    const R = [[0.0, 0.62], [0.2, 0.86], [0.5, 0.92], [0.74, 0.8], [0.84, 0.5], [0.82, 0.2], [0.7, -0.1], [0.52, -0.38], [0.3, -0.55], [0.0, -0.64]];
    const hp = []; R.forEach(([u, v], i) => hp.push([u + jit(i, 0.05), v + jit(i + 20, 0.05)]));
    const Lh = R.slice(1, -1).reverse().map(([u, v], i) => [-u + jit(i + 50, 0.05), v + jit(i + 70, 0.05)]);
    const cur = new THREE.CatmullRomCurve3([...hp, ...Lh].map(([u, v]) => V(u, v, 0)), true, "centripetal"), outline = Array.from({ length: 120 }, (_, i) => { const p = cur.getPointAt(i / 120); return [p.x, p.y]; });
    const c = [0, 0.1], pm = flat(std(paintC, { roughness: 0.85 })), edge = flat(std(`#${mixC.getHexString()}`, { roughness: 0.85 }));
        parts.add(patch(face, outline, c, 0.0020, edge, 1.045)); parts.add(patch(face, outline, c, 0.0028, pm, 1.0));
  }
  // lids in the paint's colour (the golden lids over white paint read as dirty)
  { const lm = ch.skin.clone(); lm.color.set(paintC); lm.userData = { ...ch.skin.userData };
    for (const e of face.eyes) for (const pv of [e.lidPivot, e.lowPivot]) { const sh = pv?.children?.find((o) => o.isMesh && o.material === ch.skin); if (sh) sh.material = lm; } }
  // small blue diamonds above and below each eye, each its own size and lean
  { const dm = onTop(flat(std(C.diamond || "#4f8fd6", { roughness: 0.6 })), 0.6);
    const dia = (u, v, w, h, lean) => { const p = face._surfLine([[u, v + h], [u + w + lean, v], [u, v - h], [u - w + lean, v]], 0.0046), g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(p.flatMap((q) => [q.x, q.y, q.z]), 3)); g.setIndex([0, 3, 1, 1, 3, 2]); g.computeVertexNormals(); const m = new THREE.Mesh(g, dm); m.material.side = THREE.DoubleSide; m.renderOrder = 2; return m; };
    for (const s of [-1, 1]) {
      const j = (n) => hash(seed + n + (s > 0 ? 3 : 8));
      parts.add(dia(s * (L.eyeU + 0.16), L.eyeV + 0.37, 0.075 + 0.01 * j(1), 0.15 + 0.02 * j(2), s * 0.01 * (j(3) - 0.5)));
      parts.add(dia(s * (L.eyeU + 0.12), L.eyeV - 0.33, 0.07 + 0.01 * j(4), 0.14 + 0.02 * j(5), s * 0.01 * (j(6) - 0.5)));
    } }
  // the painted red smile: from a curl on one cheek, under the mouth, to a curl on the other, thin at the ends
  { const sm = onTop(flat(std(C.smile || "#c8262c", { roughness: 0.5 })), 0.6), mv = L.mouthV, w = L.mouthW;
    const pts = [[-w - 0.4, mv + 0.3], [-w - 0.36, mv + 0.14], [-w - 0.22, mv - 0.06], [-w * 0.65, mv - 0.2], [-w * 0.3, mv - 0.29], [0.01, mv - 0.31], [w * 0.3, mv - 0.29], [w * 0.65, mv - 0.2], [w + 0.22, mv - 0.07], [w + 0.37, mv + 0.15], [w + 0.4, mv + 0.31]];
    parts.add(ribbon(face, pts, (t) => 0.016 + 0.038 * Math.pow(Math.sin(Math.PI * (0.03 + 0.94 * t)), 0.7), 0.0044, sm, 60)); }
  // the nose: a round shiny red ball, r 0.055, sitting out of the face
  { const nm = new THREE.MeshPhysicalMaterial({ color: C.nose || "#d92b2b", roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15 });
    const nose = mesh(new THREE.SphereGeometry(0.055, 28, 20), nm), p = face.place(0, L.eyeV - 0.2); nose.position.copy(p.pos).addScaledVector(p.normal, 0.03); parts.add(nose);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), flat(new THREE.MeshBasicMaterial({ color: "#fff5ee" }))); gl.scale.set(1.3, 0.8, 0.5);
    gl.position.copy(nose.position).add(V(-0.02, 0.025, 0.04)); parts.add(gl); }

  // ---------------------------------------------------------------------------------------------- collar: three ruffles
  { const cols = C.collar || ["#9cc4ee", "#a8dcc0", "#f4a6c0"];
    const spec = [   // blue on top, mint, pink lowest and widest: the outer radius about 1.25 x the body's
      { ph: -0.46, w: 0.085, drop: 0.035, rise: 0.014, amp: 0.016, lobes: 19, lift: 0.032 },
      { ph: -0.53, w: 0.108, drop: 0.045, rise: 0.008, amp: 0.012, lobes: 22, lift: 0.024 },
      { ph: -0.6, w: 0.132, drop: 0.055, rise: 0.006, amp: 0.013, lobes: 25, lift: 0.016 },
    ];
    spec.forEach((o, i) => { const m = clothMat("#ffffff", { side: THREE.DoubleSide, vertexColors: true }); parts.add(mesh(frill(ch, { ...o, color: cols[i], seed: seed + i * 17 + 2, dip: i === 0 ? 0.02 : 0 }), m)); }); }

  // ---------------------------------------------------------------------------------------------- waistcoat, buttons, trousers
  { const top = -0.5, hem = -1.08, NU = 360, NV = 24, st = stripes(seed + 60, C.stripeA || "#f08aa8", C.stripeB || "#fbf0d8");
    const G = garment(ch, { top, hem, folds: 5, depth: 0.008, flare: 0.03, lift: 0.02, lift0: 0.012, wave: 0.012, thick: 0.014, phase: 0.9, segs: NU, rows: NV });
    const n = G.outer.attributes.position.count, cols = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) { const i = k % (NU + 1), j = Math.floor(k / (NU + 1)), c = st((i / NU) * Math.PI * 2, j / NV), sh = 1.04 - 0.2 * (j / NV) ** 1.2; cols[k * 3] = c.r * sh; cols[k * 3 + 1] = c.g * sh; cols[k * 3 + 2] = c.b * sh; }
    G.outer.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    parts.add(mesh(G.outer, clothMat("#ffffff", { side: THREE.DoubleSide, vertexColors: true })));
    parts.add(mesh(G.inner, liningMat("#c9bd9f"), false));
    parts.add(mesh(G.hem, clothMat(C.stripeB || "#fbf0d8", { side: THREE.DoubleSide }), false));
    const bc = C.buttons || ["#f6d24a", "#a8dcc0", "#d92b2b"];
    bc.forEach((col, i) => { const ph = -0.66 - 0.17 * i, q = ch.surf(0, ph), b = mesh(puff(0.06, col, seed + 90 + i * 13, 12), puffMat()); b.position.copy(q.pos).addScaledVector(q.normal, 0.058 + 0.012 * i); parts.add(b); }); }
  parts.add(mesh(lowerShell(ch, -1.0, 1.055), clothMat(C.trousers || "#7fa6d8", { side: THREE.DoubleSide })));

  // ---------------------------------------------------------------------------------------------- gloves, legs, shoes
  { const white = C.glove || "#fbfbf8";
    if (ch.skinMat) ch.skinMat.color.set(white);   // the seamless glove's skin
    if (ch.armMat && ch.armMat !== ch.limbMat) ch.armMat.color.set(white);   // and the wrist that shows past the cuff
    if (ch.limbMat) { const hm = ch.limbMat.clone(); hm.color.set(white); hm.userData = { ...ch.limbMat.userData };
      for (const s of ["L", "R"]) ch.arms?.[s]?.hand?.traverse?.((o) => { if (o.isMesh && o.material === ch.limbMat) o.material = hm; }); }
    if (ch.limbMat) ch.limbMat.userData.noOutline = true;   // the legs (limbs.color: the trousers' blue)
    const shoe = flat(std(C.shoes || "#c8262c", { roughness: 0.35 }));
    for (const s of ["L", "R"]) { const f = ch.legs?.[s]?.foot; if (!f) continue; f.material = shoe; f.scale.set(1.75, 1.0, 2.5); } }

  // ---------------------------------------------------------------------------------------------- sleeves: puffy, striped, ending at the wrist in a small frill
  // built like Spud's (costumes-art-cast.js): one frame carried down the arm without twist, rebuilt every frame on the arm's own curve
  const SL = { from: 0.04, gap: C.cuffGap ?? 0.062, n: 16, radial: 40 };
  const slvM = clothMat("#ffffff", { side: THREE.DoubleSide, vertexColors: true }), cuffM = clothMat(C.cuff || "#fbf0d8", { side: THREE.DoubleSide });
  const sleeveRadius = (t) => (0.062 + 0.024 * Math.sin(Math.PI * Math.min(1, t * 1.05) ** 0.85)) * (1 - 0.34 * sstep(0.8, 0.95, t));   // shoulder, a puff in the middle, gathered at the wrist
  const slv = {}, cf = {}, stripeAt = {};
  const cuffEdge = (s) => { const K = 11, w = Array.from({ length: K }, (_, i) => 0.6 + 0.8 * hash(seed + (s === "L" ? 5 : 9) + i * 3.3)), sum = w.reduce((a, b) => a + b, 0), e = [0]; w.forEach((x, i) => e.push(e[i] + (x / sum) * Math.PI * 2)); return { K, e, amp: w.map((_, i) => 0.0045 * (0.7 + 0.6 * hash(seed + i * 4.4 + (s === "L" ? 2 : 6)))) }; };
  const cuffs = { L: cuffEdge("L"), R: cuffEdge("R") };
  for (const s of ["L", "R"]) {
    slv[s] = new THREE.Mesh(new THREE.BufferGeometry(), slvM); slv[s].castShadow = true; slv[s].frustumCulled = false; ch.root.add(slv[s]);
    cf[s] = new THREE.Mesh(new THREE.BufferGeometry(), cuffM); cf[s].castShadow = true; cf[s].frustumCulled = false; ch.root.add(cf[s]);
    const Ks = 10, w = Array.from({ length: Ks }, (_, i) => 0.7 + 0.6 * hash(seed + (s === "L" ? 21 : 27) + i * 2.6)), sum = w.reduce((a, b) => a + b, 0), e = [0]; w.forEach((x, i) => e.push(e[i] + (x / sum) * Math.PI * 2));
    stripeAt[s] = { e, lean: e.map((_, i) => (hash(seed + i * 3.9 + (s === "L" ? 12 : 16)) - 0.5) * 0.3), tint: w.map((_, i) => 0.95 + 0.1 * hash(seed + i * 5.1 + 9)) };
  }
  const pink = new THREE.Color(C.stripeA || "#f08aa8"), cream = new THREE.Color(C.stripeB || "#fbf0d8"), _c = new THREE.Color();
  const sleeveCol = (s, a, t) => {   // the stripe round the sleeve at angle a, a little different along it
    const S = stripeAt[s]; _c.copy(cream);
    for (let i = 0; i < S.e.length - 1; i++) {
      const lo = S.e[i] + S.lean[i] * (t - 0.5), hi = S.e[i + 1] + S.lean[i + 1] * (t - 0.5), f = 0.05;
      let k = 0; for (const sh of [-Math.PI * 2, 0, Math.PI * 2]) k = Math.max(k, sstep(lo - f, lo + f, a + sh) - sstep(hi - f, hi + f, a + sh));
      if (k > 0 && i % 2 === 0) _c.lerp(pink.clone().multiplyScalar(S.tint[i]), k);
    }
    const sh = 1 - 0.14 * sstep(0.7, 1, t); return [_c.r * sh, _c.g * sh, _c.b * sh];
  };
  const _up = V(0, 1, 0), _fw = V(0, 0, 1), _r = V(0, 0, 0), _n = V(0, 0, 0), _b = V(0, 0, 0);
  const sl = () => {
    for (const s of ["L", "R"]) {
      const A = ch.arms?.[s]; if (!A?.shoulder || !A.elbow || !A.hand) { slv[s].visible = false; cf[s].visible = false; continue; }
      const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), Ln = Math.max(0.05, curve.getLength());
      const to = Math.max(SL.from + 0.3, Math.min(0.92, 1 - SL.gap / Ln)), n = SL.n, R = SL.radial;
      const pos = new Float32Array((n + 1) * (R + 1) * 3), col = new Float32Array((n + 1) * (R + 1) * 3), idx = [];
      let pe = null, Te = null, ne = null, be = null;
      for (let i = 0; i <= n; i++) {
        const t = i / n, u = SL.from + (to - SL.from) * t, p = curve.getPointAt(u), T = curve.getTangentAt(u);
        if (i === 0) { const w = sstep(0.75, 0.95, Math.abs(T.y)); _r.copy(_up).multiplyScalar(1 - w).addScaledVector(_fw, w); _n.copy(_r); }
        _n.addScaledVector(T, -_n.dot(T)).normalize(); _b.crossVectors(T, _n);
        const r = sleeveRadius(t);
        for (let k = 0; k <= R; k++) {
          const a = (k / R) * Math.PI * 2, c = Math.cos(a) * r, d = Math.sin(a) * r, q = i * (R + 1) + k, cc = sleeveCol(s, a, t);
          pos[q * 3] = p.x + c * _n.x + d * _b.x; pos[q * 3 + 1] = p.y + c * _n.y + d * _b.y; pos[q * 3 + 2] = p.z + c * _n.z + d * _b.z;
          col[q * 3] = cc[0]; col[q * 3 + 1] = cc[1]; col[q * 3 + 2] = cc[2];
        }
        if (i === n) { pe = p.clone(); Te = T.clone(); ne = _n.clone(); be = _b.clone(); }
      }
      for (let i = 0; i < n; i++) for (let k = 0; k < R; k++) { const a = i * (R + 1) + k, b = a + R + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
      { const N = g.attributes.normal; for (let i = 0; i <= n; i++) { const a = i * (R + 1), b = a + R, x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); } }
      slv[s].geometry.dispose(); slv[s].geometry = g; slv[s].visible = true;
      // the cuff frill: from the gathered end out and a little forward, its edge a row of lobes each its own width and wave
      { const E = cuffs[s], FU = 72, FV = 3, r0 = sleeveRadius(1) * 0.98, FP = new Float32Array((FU + 1) * (FV + 1) * 3), fi = [];
        for (let j = 0; j <= FV; j++) for (let i = 0; i <= FU; i++) {
          const th = (i / FU) * Math.PI * 2; let li = 0; while (li < E.K - 1 && E.e[li + 1] <= th) li++;
          const x = (th - E.e[li]) / (E.e[li + 1] - E.e[li]), v = j / FV, rr = r0 + 0.026 * v * (1 + 0.1 * Math.cos(2 * Math.PI * x)), along = 0.006 + 0.016 * v + E.amp[li] * Math.sin(2 * Math.PI * x) * v;
          const k = (j * (FU + 1) + i) * 3, cs = Math.cos(th) * rr, sn = Math.sin(th) * rr;
          FP[k] = pe.x + cs * ne.x + sn * be.x + Te.x * along; FP[k + 1] = pe.y + cs * ne.y + sn * be.y + Te.y * along; FP[k + 2] = pe.z + cs * ne.z + sn * be.z + Te.z * along;
        }
        for (let j = 0; j < FV; j++) for (let i = 0; i < FU; i++) { const a = j * (FU + 1) + i, b = a + FU + 1; fi.push(a, b, a + 1, a + 1, b, b + 1); }
        const fg = new THREE.BufferGeometry(); fg.setAttribute("position", new THREE.BufferAttribute(FP, 3)); fg.setIndex(fi); fg.computeVertexNormals();
        cf[s].geometry.dispose(); cf[s].geometry = fg; cf[s].visible = true; }
    }
  };

  // ---------------------------------------------------------------------------------------------- the hat and the costume's hooks
  const base = out.apply;
  out.apply = (st, t, ...r) => { base && base(st, t, ...r); sl(); };
  out.hat = partyHat({ ...C, seed });
  out.sitDepth = 0.04;
  return out;
}
