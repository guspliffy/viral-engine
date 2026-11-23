import * as THREE from "three";
import { clothMat, liningMat, sstep } from "./costumes-art.js";

// The reporter's pieces (Kid vs Dad 01, 22 Nov 2026; storyboards/series/kid-vs-dad/01-dad-jokes-news/DESIGN.md sections 1 and 2).
// Metres, deterministic (every mark is placed by hand, no random, no clock). Two parts:
//
//   1. The padded vest on the `teller` costume (costumes-everyday.js calls vestExtras): keys on costume, ALL OFF by default, so Tot, Rosti and
//      the agent render exactly as before.
//        padded true   the vest stands 0.06 off the shirt (teller: 0.042); a navy roll r 0.016 along its neckline, thinning to nothing at the V
//        quilt  true   3 seams "#18274a", 0.006 wide, round the vest at y 0.19, 0.25, 0.31, each drawn once, wandering up to 0.004
//        zip    true   one line "#18274a", 0.008 wide, from the V point to the hem (replaces the 3 brass buttons)
//        patch  true   a blank "#f4f1ea" rectangle 0.11 x 0.07 (corner r 0.008) on the left chest, centre x +0.17 (his left), y 0.40 or, where the vest's V edge is lower than 0.40 + 0.057 there (the reporter: y 0.31), the highest
//                      place on the cloth; a quilt seam under it stops short of it; one stitch
//                      line "#c9c6bd" 0.004 inside its edge, broken twice. No letters.
//        (colours: costume.seam "#18274a", costume.patchColor "#f4f1ea", costume.stitch "#c9c6bd", costume.vestRoll "#18274a")
//
//   2. The helmet, `costume.helm` true (or "#hex" for the shell colour; default "#3f72b8"), a hat on the engine's hat mount, so the `hat` action
//      ({ do: "hat", off, spin, on }) tilts, slides and hides it. Build it for a body by shares of its own Hh (k = Hh / 0.80):
//        shell     round dome over the whole top of the head, 0.018 off the skin at its lower edge and 0.045 at the crown, hollow (inside "#2b2f38");
//                  lower edge 0.90 / 0.825 / 0.775 Hh above the floor-to-belly line at the front / sides / back (y 0.86 / 0.80 / 0.76 on the reporter)
//        rim       a rolled edge r 0.008 "#2f5a96", flaring 0.012 all round and 0.020 across the front 100 degrees; no brim
//        colour    "#3f72b8", shade side "#335f9c" (his left); marks, each drawn once: highlight "#8fb3e0" 0.09 x 0.018 (viewer's left), dent line
//                  "#2f5a96" 0.05 (his right), two scuffs "#a9c4e6" 0.03 / 0.018 by the front rim
//        strap     "#2b2f38" 0.016 wide, from the rim 74 degrees each side of the front, behind the cheek blush, under the mouth (centre 0.045
//                  below the mouth line); steel buckle "#9aa0a8" 0.022 x 0.016 on his left cheek. UNDONE whenever the helmet's roll (hatSpin z)
//                  is 6 degrees or more: the under-mouth strap hides and two ends hang from the rim 74 degrees each side, 0.13 (buckle) on his
//                  left, 0.09 on his right, straight down in the world whatever the roll
//      the hat mount's origin is set at the body's centre (sitDepth = top - centre) so `hat` rolls and yaws turn the dome round the skull.
//      sprout.placement "none" in the character file (bald under it). `buildHelmet` is shared with the prop `rephelmet` (props-reporter.js).

const PI = Math.PI, TAU = PI * 2, V = (x, y, z) => new THREE.Vector3(x, y, z), D2R = PI / 180;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const mesh = (g, m, shadow = true) => { const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = shadow; return o; };
const steel = (c) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.32, metalness: 0.75 }); m.userData.lookRole = "cloth"; m.userData.noOutline = true; return m; };
const flat = (c, o = {}) => { const m = clothMat(c, { roughness: 0.8, side: THREE.DoubleSide, ...o }); m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; m.userData.noOutline = true; return m; };

// a mesh from a (nu+1) x (nv+1) grid of points (row after row); weld: join the last column to the first
function gridGeo(pts, nu, nv, weld, colors) {
  const pos = new Float32Array(pts.length * 3), idx = [];
  pts.forEach((p, i) => { pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; });
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  if (weld) { const N = g.attributes.normal; for (let j = 0; j <= nv; j++) { const a = j * (nu + 1), b = a + nu, x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); } }
  if (colors) g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return g;
}
// a flat strip lying along points P (normals N), w wide
function ribbon(P, N, w) {
  const pos = [], idx = [], n = P.length - 1;
  for (let i = 0; i <= n; i++) {
    const d = P[Math.min(n, i + 1)].clone().sub(P[Math.max(0, i - 1)]).normalize(), sd = d.cross(N[i]).normalize(), wi = typeof w === "function" ? w(i / n) : w;
    for (const k of [-1, 1]) { const q = P[i].clone().addScaledVector(sd, (k * wi) / 2); pos.push(q.x, q.y, q.z); }
  }
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// the elevation at which the surface (meridian th) is y metres up
function phAtY(surf, th, y, lo = -1.45, hi = 1.55) { let a = lo, b = hi; for (let i = 0; i < 28; i++) { const m = (a + b) / 2; if (surf(th, m).pos.y < y) a = m; else b = m; } return (a + b) / 2; }
// a Catmull-Rom curve through [x, y] control pairs, sampled n + 1 times
function curve2(pts, n) { const c = new THREE.CatmullRomCurve3(pts.map(([a, b]) => V(a, b, 0)), false, "centripetal"); return Array.from({ length: n + 1 }, (_, i) => c.getPointAt(i / n)); }

// ============================================================================================================================================
// the helmet. o: { surf(th, ph) -> { pos, normal } (the skin: the body's own, or the prop's stand-in ellipsoid), edgeY(th) (the lower edge's height
// in the same frame), k (size share, Hh / 0.80), color, strap: { mouthY, cheek: [th, y] } (the worn strap, costume only) }
// returns { group, shellAt(th, v) (a point on the shell: v 0 lower edge .. 1 crown), edge(th), phE(th) }
// ============================================================================================================================================
export function buildHelmet(o) {
  const { surf, edgeY } = o, k = o.k ?? 1, group = new THREE.Group(), NU = 112, NV = 22, PH_TOP = 1.5;
  const shell = o.color || "#3f72b8", shade = "#335f9c", lining = "#2b2f38", rimC = "#2f5a96";
  const phE = (th) => phAtY(surf, th, edgeY(th));
  const offAt = (v) => (0.018 + 0.027 * Math.pow(v, 1.5)) * k;   // off the skin: 0.018 at the lower edge, 0.045 at the crown
  const phOf = (th, v) => { const e = phE(th); return e + (PH_TOP - e) * v; };
  const shellAt = (th, v, extra = 0) => { const s = surf(th, phOf(th, v)); return { pos: s.pos.clone().addScaledVector(s.normal, offAt(v) + extra), n: s.normal }; };
  // ---- the dome: outside, a lighter blue on his right and a darker one on his left (+x); inside, the dark lining
  const outer = [], inner = [], col = new Float32Array((NU + 1) * (NV + 1) * 3), cA = new THREE.Color(shell), cB = new THREE.Color(shade), tmp = new THREE.Color();
  const crown = surf(0, PI / 2).pos.clone(), crownN = V(0, 1, 0); crown.x = crown.z = 0;
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const th = -PI + TAU * (i / NU), v = j / NV, q = j === NV ? { pos: crown.clone().addScaledVector(crownN, offAt(1)), n: crownN } : shellAt(th, v);
    outer.push(q.pos); inner.push(j === NV ? crown.clone().addScaledVector(crownN, offAt(1) - 0.012 * k) : surf(th, phOf(th, v)).pos.clone().addScaledVector(q.n, offAt(v) - 0.012 * k));
    const w = clamp01(0.9 * sstep(-0.15, 0.85, q.n.x) + 0.25 * sstep(0.1, -0.8, q.n.z) + 0.15 * sstep(0.3, -0.5, q.n.y));
    tmp.copy(cA).lerp(cB, w); const c = (j * (NU + 1) + i) * 3; col[c] = tmp.r; col[c + 1] = tmp.g; col[c + 2] = tmp.b;
  }
  const dome = mesh(gridGeo(outer, NU, NV, true, col), clothMat("#ffffff", { vertexColors: true, roughness: 0.55, side: THREE.DoubleSide })); dome.userData.helmetShell = true; group.add(dome);
  group.add(mesh(gridGeo(inner, NU, NV, true), liningMat(lining), false));
  // ---- the rim: a rolled edge r 0.008, its outer face 0.012 (0.020 across the front 100 degrees) beyond the shell
  { const pts = [], flare = (th) => (0.012 + 0.008 * (1 - sstep(40 * D2R, 60 * D2R, Math.abs(th)))) * k;
    for (let i = 0; i < 96; i++) { const th = -PI + TAU * (i / 96), e = surf(th, phE(th)), hz = V(e.normal.x, 0, e.normal.z).normalize();
      pts.push(e.pos.clone().addScaledVector(e.normal, offAt(0)).addScaledVector(hz, flare(th) - 0.008 * k).add(V(0, -0.002 * k, 0))); }
    group.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 192, 0.008 * k, 7, true), clothMat(rimC, { roughness: 0.5 }))); }
  // ---- the marks, each drawn once: flat strips just above the shell
  const mark = (color, w, path, n = 14) => {
    const P = [], N = [];
    for (let i = 0; i <= n; i++) { const [th, v] = path(i / n), q = shellAt(th, v, 0.0016 * k); P.push(q.pos); N.push(q.n); }
    const m = mesh(ribbon(P, N, (t) => w * (0.45 + 0.55 * Math.sin(PI * Math.min(1, 0.1 + t * 0.85)))), flat(color), false); group.add(m); return m;
  };
  mark("#8fb3e0", 0.018 * k, (t) => [-0.74 + 0.5 * t, 0.46 + 0.2 * t], 16);   // highlight streak 0.09 x 0.018, upper front, viewer's left
  mark("#2f5a96", 0.0042 * k, (t) => [-1.53 + 0.13 * t, 0.36 + 0.3 * t], 10);   // the dent line 0.05 long on his right side
  mark("#a9c4e6", 0.0045 * k, (t) => [0.32 + 0.1 * t, 0.2 + 0.03 * t], 8);       // scuff 0.03 by the front rim
  mark("#a9c4e6", 0.0038 * k, (t) => [-0.12 + 0.065 * t, 0.12 - 0.03 * t], 6);   // scuff 0.018
  return { group, shellAt, phE, offAt, k };
}

// ---- the strap: a ribbon of the given colour along skin points, lifted `lift` off the skin; path(t) -> [th, y]
function strapRibbon(surf, pts, w, lift, n) {
  const P = [], N = [];
  for (const c of curve2(pts, n)) { const th = c.x, y = c.y, s = surf(th, phAtY(surf, th, y)); P.push(s.pos.clone().addScaledVector(s.normal, lift)); N.push(s.normal); }
  return ribbon(P, N, w);
}

// ---- the helmet on a character (costume.helm): returns the engine's hat record { group, height } and a per-frame apply(st)
export function reporterHelmet(ch, C) {
  const Hh = ch.ry * 2, base = ch.cy - ch.ry, k = Hh / 0.8, surf = (th, ph) => ch.surf(th, ph), topY = ch.topY();
  const edgeY = (th) => base + Hh * (0.83125 + 0.0625 * Math.cos(th) + 0.00625 * Math.cos(2 * th));   // 0.90 front / 0.825 sides / 0.775 back
  const H = buildHelmet({ surf, edgeY, k, color: typeof C.helm === "string" ? C.helm : undefined });
  // the hat mount turns the hat about its own origin: put that origin at the body's centre (sitDepth = topY - cy, returned below) so a roll or a
  // yaw slides the dome round the skull like a real helmet, instead of swinging it about the crown and lifting it off the head
  const body = new THREE.Group(); body.position.y = -ch.cy; body.add(H.group);
  const hat = new THREE.Group(); hat.add(body);
  // ---- the worn strap: out of the rim at +-74 degrees, behind the cheek blush, under the mouth line
  const mouthY = ch.face?.place ? ch.face.place(0, ch.face.layout.mouthV).pos.y : base + 0.45 * Hh, strapC = "#2b2f38", wS = 0.016 * k, lift = 0.012 * k, rimTh = 74 * D2R;
  const yRim = (th) => edgeY(th) - 0.004 * k, uy = mouthY - 0.045 * k;
  const half = (s) => [[s * rimTh, yRim(s * rimTh)], [s * 1.06, base + Hh * 0.55], [s * 0.86, base + Hh * 0.42], [s * 0.6, uy + 0.006 * k], [s * 0.3, uy + 0.001 * k], [0, uy]];
  const worn = new THREE.Group(); body.add(worn);
  { const pts = [...half(-1), ...half(1).reverse().slice(1)];   // right cheek -> under the mouth -> left cheek, one ribbon
    worn.add(mesh(strapRibbon(surf, pts, wS, lift, 90), flat(strapC, { roughness: 0.7 }), false)); }
  const buckleAt = (th, y, parent, along) => {   // a steel buckle 0.022 across x 0.016 along the strap, 0.006 thick, lying on the skin
    const s = surf(th, phAtY(surf, th, y)), n = s.normal.clone(), T = along.clone().addScaledVector(n, -along.dot(n)).normalize(), X = new THREE.Vector3().crossVectors(T, n).normalize();
    const b = mesh(new THREE.BoxGeometry(0.022 * k, 0.016 * k, 0.006 * k), steel("#9aa0a8")); b.position.copy(s.pos).addScaledVector(n, lift + 0.004 * k);
    b.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, T, n)); parent.add(b); return b;
  };
  { const c = curve2(half(1), 20)[7]; buckleAt(c.x, c.y, worn, V(0, -1, 0.1)); }   // on the strap's left cheek run
  // ---- the undone strap: two ends hanging from the rim, 0.13 (with the buckle) on his left (+x), 0.09 on his right
  const ends = new THREE.Group(); body.add(ends); ends.visible = false;
  const endOf = (s, len, withBuckle) => {
    const th = s * rimTh, y0 = yRim(th), g = new THREE.Group(), at = surf(th, phAtY(surf, th, y0)).pos.clone().addScaledVector(surf(th, phAtY(surf, th, y0)).normal, 0.016 * k);
    const L = withBuckle ? len - 0.016 * k : len, pts = [[th, y0], [th, y0 - L * 0.5], [th, y0 - L]];
    const geo = strapRibbon(surf, pts, wS, lift, 12); geo.translate(-at.x, -at.y, -at.z);
    g.add(mesh(geo, flat(strapC, { roughness: 0.7 }), false)); g.position.copy(at); ends.add(g);
    if (withBuckle) { const b = buckleAt(th, y0 - L - 0.008 * k, g, V(0, -1, 0)); b.position.sub(at); }
    return g;
  };
  const endL = endOf(1, 0.13 * k, true), endR = endOf(-1, 0.09 * k, false);
  const _e = new THREE.Euler(), _q = new THREE.Quaternion();
  const apply = (st) => {
    hat.rotation.set(0, 0, 0);   // costumes.js sets a default 4 degree tilt on every hat group: the helmet sits level
    const sp = st?.hatSpin || [0, 0, 0], undone = Math.abs(sp[2]) >= 6 * D2R;
    worn.visible = !undone; ends.visible = undone;
    if (undone) { _q.setFromEuler(_e.set(sp[0], sp[1], sp[2])).invert(); endL.quaternion.copy(_q); endR.quaternion.copy(_q); }
  };
  return { hat: { group: hat, height: 0.06 * k, helmet: true }, sitDepth: topY - ch.cy, apply };
}

// ============================================================================================================================================
// the padded vest (teller): G = the vest's garment (G.at(th, v, off): v 0 the neckline .. 1 the hem), neck(th) its neckline elevation
// ============================================================================================================================================
const thickOf = (G) => G.fold.thick;
// th and v at which the vest's outside surface is at world x, y (3 sweeps of two bisections)
function solveXY(G, x, y, off) {
  let th = Math.asin(Math.max(-0.99, Math.min(0.99, x / 0.4))), v = 0.5;
  for (let r = 0; r < 3; r++) {
    let a = 0, b = 1.2; for (let i = 0; i < 18; i++) { const m = (a + b) / 2; if (G.at(th, m, off).y > y) a = m; else b = m; } v = (a + b) / 2;
    let c = -1.5, d = 1.5; for (let i = 0; i < 18; i++) { const m = (c + d) / 2; if (G.at(m, v, off).x < x) c = m; else d = m; } th = (c + d) / 2;
  }
  return { th, v };
}
const vWhereY = (G, th, y, off) => { let a = 0, b = 1; for (let i = 0; i < 18; i++) { const m = (a + b) / 2; if (G.at(th, m, off).y > y) a = m; else b = m; } return (a + b) / 2; };
const tube = (pts, r, closed, n) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, closed, "centripetal"), n, r, 5, closed);

export function vestExtras(ch, C, G, vest) {
  const parts = ch.potatoParts, th0 = thickOf(G), seamC = C.seam || "#18274a", seamM = clothMat(seamC, { roughness: 0.85 });
  if (C.padded) {   // the roll along the neckline: r 0.016, thinning to nothing at the V point, lying on the vest's top edge
    const N = 140, pts = []; for (let i = 0; i <= N; i++) { const th = 0.04 + (TAU - 0.08) * (i / N); pts.push(G.at(th, 0, th0 * 0.55).add(V(0, 0.004, 0))); }
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal"), frames = curve.computeFrenetFrames(N * 2, false), pos = [], idx = [], R = 10, r = (t) => 0.016 * sstep(0, 0.07, Math.min(t, 1 - t)) + 0.0025;
    for (let i = 0; i <= N * 2; i++) { const t = i / (N * 2), p = curve.getPointAt(t), Nn = frames.normals[i], B = frames.binormals[i]; for (let j = 0; j <= R; j++) { const a = (j / R) * TAU; pos.push(p.x + r(t) * (Math.cos(a) * Nn.x + Math.sin(a) * B.x), p.y + r(t) * (Math.cos(a) * Nn.y + Math.sin(a) * B.y), p.z + r(t) * (Math.cos(a) * Nn.z + Math.sin(a) * B.z)); } }
    for (let i = 0; i < N * 2; i++) for (let j = 0; j < R; j++) { const a = i * (R + 1) + j, b = a + R + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    parts.add(mesh(g, clothMat(C.vestRoll || vest, { side: THREE.DoubleSide })));
  }
  // the patch's place: centre x +0.17; y 0.40 if the vest's neckline leaves room there, else as high as the cloth allows (the V's edge at
  // x 0.115 / 0.225 is y 0.367 / 0.400 on the reporter, so the 0.07 tall patch sits at y 0.31, 0.022 clear of the edge and its roll)
  const PW = { cx: 0.17, hw: 0.055, hh: 0.035, rc: 0.008, off: th0 + 0.0012 };
  if (C.patch) {
    const edgeAt = (x) => { let c = 0, d = 1.5; for (let i = 0; i < 22; i++) { const m = (c + d) / 2; if (G.at(m, 0, PW.off).x < x) c = m; else d = m; } return G.at((c + d) / 2, 0, PW.off).y; };
    PW.cy = Math.min(0.4, Math.min(edgeAt(PW.cx - PW.hw), edgeAt(PW.cx + PW.hw)) - 0.022 - PW.hh);
  }
  if (C.quilt) {   // 3 seams, each its own hand-drawn wander up to 0.004; a seam under the patch stops short of it (the patch is sewn over it)
    [0.19, 0.25, 0.31].forEach((y, s) => {
      const N = 120, pts = [], keep = [];
      for (let i = 0; i < N; i++) {
        const th = -PI + TAU * (i / N), w = 0.004 * (0.6 * Math.sin(th * (3 + s) + 1.7 * s + 0.4) + 0.4 * Math.sin(th * 7 + 2.3 * s + 1.1)), q = G.at(th, vWhereY(G, th, y + w, th0 + 0.0012), th0 + 0.0012);
        pts.push(q); keep.push(!(C.patch && Math.abs(q.y - PW.cy) < PW.hh + 0.008 && q.z > 0 && Math.abs(q.x - PW.cx) < PW.hw + 0.008));
      }
      if (keep.every(Boolean)) { parts.add(mesh(tube(pts, 0.003, true, 240), seamM, false)); return; }
      let st = 0; while (!(keep[st] && !keep[(st - 1 + N) % N])) st++;   // the first point after the gap, then round to the one before it
      const run = []; for (let i = 0; i < N && keep[(st + i) % N]; i++) run.push(pts[(st + i) % N]);
      parts.add(mesh(tube(run, 0.003, false, 240), seamM, false));
    });
  }
  if (C.zip) {   // one line from the V point to the hem
    const pts = []; for (let i = 0; i <= 24; i++) pts.push(G.at(0, i / 24, th0 + 0.0016));
    parts.add(mesh(tube(pts, 0.004, false, 48), seamM, false));
  }
  if (C.patch) {   // blank patch 0.11 x 0.07, corner r 0.008, centre x +0.17, y 0.40; one stitch line 0.004 inside its edge, broken twice
    const { cx, cy, hw, hh, rc, off } = PW;
    // the rounded rectangle as a closed loop of points (u, w), resampled evenly along its length
    const outline = (a, b, rr, M = 72) => {
      const p = [], corner = (ox, oy, a0) => { for (let i = 0; i <= 8; i++) { const t = a0 + (PI / 2) * (i / 8); p.push([ox + rr * Math.cos(t), oy + rr * Math.sin(t)]); } };
      corner(a - rr, b - rr, 0); corner(-a + rr, b - rr, PI / 2); corner(-a + rr, -b + rr, PI); corner(a - rr, -b + rr, 1.5 * PI);
      const dense = []; for (let i = 0; i < p.length; i++) { const A = p[i], B = p[(i + 1) % p.length]; for (let j = 0; j < 8; j++) dense.push([A[0] + (B[0] - A[0]) * (j / 8), A[1] + (B[1] - A[1]) * (j / 8)]); }
      const len = [0]; for (let i = 1; i <= dense.length; i++) { const A = dense[i - 1], B = dense[i % dense.length]; len.push(len[i - 1] + Math.hypot(B[0] - A[0], B[1] - A[1])); }
      return Array.from({ length: M }, (_, m) => { const d = (len[len.length - 1] * m) / M; let i = 1; while (i < len.length - 1 && len[i] < d) i++; const f = (d - len[i - 1]) / ((len[i] - len[i - 1]) || 1), A = dense[i - 1], B = dense[i % dense.length]; return [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f]; });
    };
    const to3 = (u, w, extra = 0) => { const s = solveXY(G, cx + u, cy + w, off + extra); return G.at(s.th, s.v, off + extra); };
    const out = outline(hw, hh, rc), rings = [0, 0.34, 0.67, 1], pos = [], idx = [], M = out.length;
    for (const f of rings) for (const [u, w] of out) { const p = to3(u * f, w * f); pos.push(p.x, p.y, p.z); }
    for (let r = 0; r < rings.length - 1; r++) for (let i = 0; i < M; i++) { const a = r * M + i, b = r * M + ((i + 1) % M), c = (r + 1) * M + i, d = (r + 1) * M + ((i + 1) % M); idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const pm = clothMat(C.patchColor || "#f4f1ea", { roughness: 0.9, side: THREE.DoubleSide }); pm.polygonOffset = true; pm.polygonOffsetFactor = -1; pm.polygonOffsetUnits = -1;
    parts.add(mesh(g, pm, false));
    // the stitch line: the outline 0.004 inside the edge, a gap on the top edge and one on the right edge
    const st = outline(hw - 0.004, hh - 0.004, rc - 0.004, 120), L = st.length, gaps = [[0.15, 0.19], [0.92, 0.96]];   // fractions of the loop: the middle of the top edge, the right edge
    let run = []; const runs = [];
    for (let i = 0; i <= L; i++) { const f = i / L, inGap = gaps.some(([a, b]) => f >= a && f <= b); if (inGap || i === L) { if (run.length > 2) runs.push(run); run = []; } else run.push(st[i % L]); }
    for (const rn of runs) parts.add(mesh(tube(rn.map(([u, w]) => to3(u, w, 0.0016)), 0.0012, false, rn.length * 2), clothMat(C.stitch || "#c9c6bd", { roughness: 0.9 }), false));
  }
}
