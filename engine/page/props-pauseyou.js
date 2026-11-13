import * as THREE from "three";
import { clamp } from "./util.js";
import { radialTexture } from "./geo.js";
import { COOKIE } from "./props-cookie.js";

// There's a catch EP08 "What if your friend could pause YOU?" (13 Nov 2026), T2. Numbers are
// storyboards/series/what-if/08-pause-you/DESIGN.md sections 1, 2 and 5. Every state key below is read as `ps.key ?? spec.key ?? default`,
// so a clip can put it in the spec or tween it ("prop" action); a key that is NOT in propState's own list (press, glint,
// hit, crumbs, rise is) has no baseline: its FIRST tween jumps to the value (give it a dur-0 tween at 0 to seed it).
//
//   magicremote  Wizard's magic remote (DESIGN 1): a cream rounded slab 0.34 long (z) x 0.10 wide (x) x 0.04 thick (y), the
//                top face (+y) flat, ONE round cyan pause button (0.076 across, raised 0.008, two dark bars), an emitter
//                lens (a dome 0.034 across, 0.012 proud) on the tip end and ONE purple band 0.03 behind the tip.
//                ORIGIN = where the fist holds it: the centre of the rear grip zone (0.07 from the butt, mid thickness,
//                mid width). Long axis along local -z, the lens tip at z -0.282 (the body ends at -0.27, the butt at +0.07),
//                the button face up (+y), centre 0.235 from the butt = z -0.165. A fist wraps z 0..+0.07 (the rear 0.14).
//                press 0..1  the button sinks 0.005 and its face goes #3fd0ff -> #bff3ff (the bars sink with it).
//                lit   0..1  the lens lights (#8fb9c9 -> #bff3ff) with a small additive halo. Both default 0.
//                REMOTE (exported) = the grip points in the prop's own frame (metres, x scale):
//                  hold [0,0,0] (the fist), button [0, 0.028, -0.165] (its top centre, for another hand's fingertip),
//                  tip [0, 0, -0.282] (the lens apex: where the ray starts), butt [0, 0, 0.07].
//                Held by the Wizard's LEFT glove: grips.mjs SIZE.magicremote is the phone hold's size (w 0.1, h 0 so the
//                hold's height lands on the origin, t 0.04); the proof holds it long axis up (spec tip 90: lens up, button
//                toward the holder): node storyboards/lookdev/make-grip-tests.mjs --prop magicremote --hold phone
//                --spec '{"tip":90}' (see the bench report for the picked hold). With tip 0 it lies on a table, button up.
//
//   pauseray     the ray (DESIGN 2): a white-cyan core with a cyan glow, ADDITIVE, no outline, no shadow, drawn as camera-
//                facing screen-space quads, so the widths are CONSTANT ON SCREEN (px at 1080x1920; any smaller render
//                scales with the frame): core 6 px #eafcff, glow 22 px #58d8ff (55 % at the middle to 0 at the edge).
//                ORIGIN = the start point (the remote's lens: world = remote origin + REMOTE.tip, rotated with it).
//                spec.to [x,y,z]   the end point, an OFFSET from the origin (default [0,0,-1]).
//                spec.via [x,y,z]  optional bounce point, an offset: the ray runs origin -> via -> to (two legs, the
//                                  second is the return leg: its head blob is 20 px, the first leg's 16 px).
//                rise 0..1 (default 0)  the head's place along the whole path, linear in LENGTH (via is reached first):
//                                  the lit ray is everything from the origin up to the head. A white soft head blob
//                                  (80 %) shows only while 0 < rise < 1.
//                glow 0..1  fades the whole ray (core, glow, blob). NOTE: the engine's default for glow is 0, so put
//                                  glow: 1 in the spec (the bench does) or the ray is invisible.
//                glint 0..1 the bloom at via (#ffffff 90 %, #58d8ff edge, round): 0.06 m across at 0, 0.16 m from 0.35 on,
//                                  its opacity = min(1, glint / 0.35): tween 0 -> 1 in 2 frames, hold, tween back to 0.
//                hit 0..1   the soft disc at the end point, 0.10 m across, #bff3ff 70 % x hit (world size).
//                spec.core / spec.glowPx override the px widths (6 / 22), spec.depth false draws the ray over everything.
//                The ray is depth-tested (a glove in front of it hides it): end `to` a hair in front of the body it hits.
//                Not in FX_KINDS (props3d.js): give it a `staged` reason if the support check asks.
//
//   cookiehalf   one half of the chunkcookie (props-cookie.js: same outline, baked top, chips, 0.026 thick, r 0.075 and
//                spec.r), broken along a 5-segment zigzag (each tooth 0.0095..0.011 deep) that bends round two chips;
//                the broken face is lighter (#e9c98a) with 2 chip cross-sections (#4a2c1a). spec.side "L" = 52 % of the
//                cookie (the larger one), "R" = 48 % (default "L"). ORIGIN = the half's centre of mass, lying flat (+y up).
//                BOTH halves are built with the BREAK EDGE FACING +x and the round rim toward -x (the R half is the whole
//                cookie's right half turned 180 degrees about y), so one grip serves both: `edge`, a point just outside
//                the round rim (about 0.05 behind the origin along -x), for the hand that holds it. COOKIEHALF (exported)
//                = where each half's origin sits in the WHOLE cookie's frame (metres, cookie centre = [0,0,0], flat on +y):
//                L at COOKIEHALF.L.at, R at COOKIEHALF.R.at AND turned yaw + 180: put the L half at C + rotY(yaw) * at.L,
//                the R half at C + rotY(yaw) * at.R with rot yaw + 180, and the zigzags meet (the bench shows it).
//                cut 0..1   a bite like chunkcookie's: below 0.5 whole, from 0.5 one bite out of the round rim at
//                           spec.biteAt (degrees, half-local, default 150 for L, 30 for R: 0 = +x, 90 = -z; tween across 0.5).
//                crumbs 0..1 the 7 crumbs (0.004..0.009, #d9b071) lying flat beside the BREAK edge on the table (the
//                           i-th shows when crumbs > i/7, so 1 = all 7); put them on ONE half. They sit in half-local
//                           coordinates, so they turn with it: use them while it lies flat (tip 0).
//                Sizes: a half is about 0.12 x 0.15 across at r 0.075. The halves' broken faces carry the "0.018 thick"
//                of DESIGN as the 0.026 of chunkcookie (same thickness as the whole one was asked for).
export const REMOTE = { tip: [0, 0, -0.282], button: [0, 0.028, -0.165], hold: [0, 0, 0], butt: [0, 0, 0.07] };
const BODY = { w: 0.1, l: 0.34, t: 0.04, r: 0.022, butt: 0.07 };   // the butt end at z +0.07, the tip end at z -0.27

// ---- the cookie halves: the outline maths (the same rim and bite as props-cookie.js, which keeps them private) ----
const rim = (R, q) => R * (1 + 0.035 * Math.sin(5 * q + 0.7) + 0.02 * Math.sin(9 * q + 2.1) + 0.012 * Math.sin(17 * q));
function bitten(R, q, b) {
  let r = rim(R, q);
  const u = [Math.cos(q), Math.sin(q)];
  for (const [da, d, rho] of [[0, 1.0, 0.44], [0.42, 1.04, 0.3], [-0.42, 1.04, 0.3]]) {
    const c = [Math.cos(b + da) * d * R, Math.sin(b + da) * d * R], uc = u[0] * c[0] + u[1] * c[1];
    const disc = uc * uc - (c[0] * c[0] + c[1] * c[1]) + (rho * R) ** 2;
    if (disc > 0) { const rin = uc - Math.sqrt(disc); if (rin > 0) r = Math.min(r, rin); }
  }
  return r;
}
const HALF_BEV = 0.006, HALF_BEVSIZE = HALF_BEV * 0.9;
const ZIG = [0.0045, -0.005, 0.006, -0.005, 0.0055, -0.005];   // the break line's x at six stations along y (m at r 0.075): teeth 0.0095..0.011
// the break line x at height y (shape plane), x0 its mean, R the cookie radius
function lineX(R, x0, y) {
  const Y = 1.06 * R, u = (clamp(y, -Y, Y) / Y + 1) * 2.5, k = Math.min(4, Math.floor(u)), f = u - k, s = R / 0.075;
  return x0 + s * (ZIG[k] + (ZIG[k + 1] - ZIG[k]) * f);
}
const stationY = (R, k) => 1.06 * R * (-1 + (2 * k) / 5);
// one half's outline in the whole cookie's frame: { pts (polygon), zig (the break edge, bottom to top) }. shift moves the
// break line toward the half's own side (the bevel grows the shape by its bevelSize, so the wall lands on the line)
function halfOutline(R, x0, side, bite, shift) {
  const r = (q) => (bite == null ? rim(R, q) : bitten(R, q, bite)), s = R / 0.075, sh = shift * (side === "L" ? -1 : 1);
  const P = (q) => [r(q) * Math.cos(q), r(q) * Math.sin(q)];
  const f = (q) => { const p = P(q); return p[0] - (lineX(R, x0, p[1]) + sh); };
  const N = 720, TAU = Math.PI * 2, F = []; for (let i = 0; i <= N; i++) F.push(f((i / N) * TAU));
  let iT = -1, iB = -1;
  for (let i = 0; i < N; i++) { if (iT < 0 && F[i] >= 0 && F[i + 1] < 0) iT = i; else if (iT >= 0 && iB < 0 && F[i] < 0 && F[i + 1] >= 0) iB = i; }
  const root = (i) => { let a = (i / N) * TAU, b = ((i + 1) / N) * TAU; const fa = f(a) >= 0; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if ((f(m) >= 0) === fa) a = m; else b = m; } return (a + b) / 2; };
  const qT = root(iT), qB = root(iB), pT = P(qT), pB = P(qB);
  const st = (k) => [x0 + sh + s * ZIG[k], stationY(R, k)];
  const mid = [st(1), st(2), st(3), st(4)];
  const pts = [], rimPts = (qa, qb) => { const n = Math.max(2, Math.ceil(((qb - qa) / TAU) * 360)); for (let i = 1; i < n; i++) pts.push(P(qa + ((qb - qa) * i) / n)); };
  if (side === "L") { pts.push(pT); rimPts(qT, qB); pts.push(pB, ...mid); }
  else { pts.push(pB); rimPts(qB, qT + TAU); pts.push(pT, ...mid.slice().reverse()); }
  return { pts, zig: [pB, ...mid, pT] };
}
function areaCentroid(pts) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length], c = x0 * y1 - x1 * y0; a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c; }
  a /= 2; return { area: Math.abs(a), c: [cx / (6 * a), cy / (6 * a)] };
}
// the break line's mean x that makes the L half 52 % of the cookie (bisection on the area), and each half's centre of mass
const HALF_CACHE = new Map();
function halfMaths(R) {
  if (HALF_CACHE.has(R)) return HALF_CACHE.get(R);
  let lo = -0.4 * R, hi = 0.4 * R, x0 = 0;
  for (let i = 0; i < 40; i++) {
    x0 = (lo + hi) / 2;
    const aL = areaCentroid(halfOutline(R, x0, "L", null, 0).pts).area, aR = areaCentroid(halfOutline(R, x0, "R", null, 0).pts).area;
    if (aL / (aL + aR) < 0.52) lo = x0; else hi = x0;
  }
  const out = { x0, L: areaCentroid(halfOutline(R, x0, "L", null, 0).pts).c, R: areaCentroid(halfOutline(R, x0, "R", null, 0).pts).c };
  HALF_CACHE.set(R, out); return out;
}
// the grip point of a half: just outside its round rim, opposite the break (both halves are built break toward +x)
function halfEdge(R, side, out = 0.004) {
  const m = halfMaths(R), c = m[side], q = side === "L" ? Math.PI : 0, r = rim(R, q) + HALF_BEVSIZE + out;
  const x = r * Math.cos(q) - c[0], z = c[1];   // cookie z = -shape y; the rim point has y 0
  const o = side === "L" ? [x, 0, z] : [-x, 0, -z];   // the R half turns 180 degrees about y
  return o.map((v) => Math.round(v * 1000) / 1000);
}
const HM = halfMaths(COOKIE.r);
export const COOKIEHALF = {
  L: { at: [Math.round(HM.L[0] * 10000) / 10000, 0, Math.round(-HM.L[1] * 10000) / 10000], edge: halfEdge(COOKIE.r, "L") },
  R: { at: [Math.round(HM.R[0] * 10000) / 10000, 0, Math.round(-HM.R[1] * 10000) / 10000], edge: halfEdge(COOKIE.r, "R"), yaw: 180 },
};
export const PAUSEYOU_GRIPS = {
  magicremote: { hold: REMOTE.hold, button: REMOTE.button, tip: REMOTE.tip, butt: REMOTE.butt },
  // the mean of the two sides' edge points (they differ by about 5 mm: the cookie's rim is lumpy); COOKIEHALF.L / R have the exact ones
  cookiehalf: { edge: [0, 1, 2].map((i) => Math.round(((COOKIEHALF.L.edge[i] + COOKIEHALF.R.edge[i]) / 2) * 1000) / 1000), edgeL: COOKIEHALF.L.edge, edgeR: COOKIEHALF.R.edge },
};

// ---- helpers ----
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function noInk(m) { m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; return m; }
const addM = (o) => noInk(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, ...o }));
function rrect(w, h, r) {
  const s = new THREE.Shape(), x = w / 2, y = h / 2;
  s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0); s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2);
  s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI); s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5);
  return s;
}
const lerpHex = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), clamp(k));

// ---- the ray's quads: a screen-space line (constant px width) and a screen-space round blob, additive ----
const RES = [1080, 1920];
const LINE_VS = `
uniform vec3 uA; uniform vec3 uB; uniform vec2 uRes; uniform float uGlow;
attribute vec2 aCorner; varying vec2 vP; varying float vLen;
void main() {
  vec4 ca = projectionMatrix * modelViewMatrix * vec4(uA, 1.0), cb = projectionMatrix * modelViewMatrix * vec4(uB, 1.0);
  vec3 na = ca.xyz / max(ca.w, 1e-3), nb = cb.xyz / max(cb.w, 1e-3);
  vec2 pa = na.xy * uRes * 0.5, pb = nb.xy * uRes * 0.5, d = pb - pa;
  float L = length(d); vec2 dir = L > 1e-3 ? d / L : vec2(1.0, 0.0), nrm = vec2(-dir.y, dir.x);
  float h = uGlow * 0.5 + 1.5, along = aCorner.x * 2.0 - 1.0;
  vec2 p = mix(pa, pb, aCorner.x) + dir * along * h + nrm * aCorner.y * h;
  vP = vec2(along * h + aCorner.x * L, aCorner.y * h); vLen = L;
  gl_Position = vec4(p / (uRes * 0.5), mix(na.z, nb.z, aCorner.x), 1.0);
}`;
const LINE_FS = `
uniform float uCore; uniform float uGlow; uniform float uK; uniform vec3 uCoreCol; uniform vec3 uGlowCol; varying vec2 vP; varying float vLen;
void main() {
  float dx = max(max(-vP.x, vP.x - vLen), 0.0), r = length(vec2(dx, vP.y));
  float core = 1.0 - smoothstep(uCore * 0.5 - 0.75, uCore * 0.5 + 0.75, r);
  float g = 0.55 * clamp(1.0 - r / (uGlow * 0.5), 0.0, 1.0);
  gl_FragColor = vec4(min(uCoreCol * core + uGlowCol * g * (1.0 - core), vec3(1.0)) * uK, 1.0);
}`;
const DOT_VS = `
uniform vec3 uP; uniform vec2 uRes; uniform float uSize; attribute vec2 aCorner; varying vec2 vC;
void main() {
  vec4 c = projectionMatrix * modelViewMatrix * vec4(uP, 1.0); vec3 n = c.xyz / max(c.w, 1e-3);
  vC = aCorner * 1.0;
  gl_Position = vec4(n.xy + aCorner * uSize * 0.5 / (uRes * 0.5), n.z, 1.0);
}`;
const DOT_FS = `
uniform float uK; uniform vec3 uCol; varying vec2 vC;
void main() { float r = length(vC); float a = 1.0 - smoothstep(0.35, 1.0, r); gl_FragColor = vec4(uCol * a * uK, 1.0); }`;
function shader(vs, fs, uniforms, depth) {
  const m = new THREE.ShaderMaterial({ uniforms, vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, depthTest: depth, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });
  return noInk(m);
}
function quad(material, parent, order) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(12), 3));
  g.setAttribute("aCorner", new THREE.Float32BufferAttribute([0, -1, 1, -1, 0, 1, 1, 1], 2));
  g.setIndex([0, 1, 2, 1, 3, 2]);
  const o = new THREE.Mesh(g, material); o.frustumCulled = false; o.castShadow = o.receiveShadow = false; o.renderOrder = order; parent.add(o); return o;
}
// the dot's quad corners run -1..1 on both axes
function dotQuad(material, parent, order) {
  const o = quad(material, parent, order);
  o.geometry.setAttribute("aCorner", new THREE.Float32BufferAttribute([-1, -1, 1, -1, -1, 1, 1, 1], 2));
  return o;
}

export const PAUSEYOU_KINDS = {
  magicremote(P) {
    const S = P.spec, g = new THREE.Group(); P.whole.add(g);
    const bodyM = mat("#f1e9d8", { roughness: 0.55 }), bandM = mat("#7a4fc2", { roughness: 0.5 });
    const faceM = mat("#3fd0ff", { roughness: 0.4 }), sideM = mat("#1f8fc4", { roughness: 0.5 }), barM = mat("#1c2340", { roughness: 0.5 });
    const lensM = noInk(new THREE.MeshBasicMaterial({ color: "#8fb9c9" }));
    // the slab: a rounded plan extruded up y with a soft bevel (the corner radius 0.022 is the plan's)
    const bev = 0.007, geo = new THREE.ExtrudeGeometry(rrect(BODY.w - 2 * bev, BODY.l - 2 * bev, BODY.r - bev), { depth: BODY.t - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 10 });
    geo.translate(0, 0, -(BODY.t - 2 * bev) / 2); geo.rotateX(-Math.PI / 2);   // plan x/y -> x/-z, thickness along y
    mesh(geo, bodyM, g, 0, 0, BODY.butt - BODY.l / 2);
    // the band: a ring a little bigger than the body's cross-section, 0.014 wide, its middle 0.03 behind the tip end
    const bandG = new THREE.ExtrudeGeometry(rrect(BODY.w + 0.004, BODY.t + 0.004, 0.012), { depth: 0.014, bevelEnabled: false, curveSegments: 8 });
    bandG.translate(0, 0, -0.007);
    mesh(bandG, bandM, g, 0, 0, BODY.butt - BODY.l + 0.03 + 0.007 - 0.007);
    // the button: a short round cylinder (side #1f8fc4, face #3fd0ff) with two dark pause bars
    const btn = new THREE.Group(); btn.position.set(0, BODY.t / 2, REMOTE.button[2]); g.add(btn);
    const cyl = mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.008, 36), [sideM, faceM, sideM], btn, 0, 0.004, 0);
    void cyl;
    for (const sx of [-1, 1]) { const b = mesh(new THREE.BoxGeometry(0.014, 0.0012, 0.036), barM, btn, sx * 0.013, 0.0086, 0); b.castShadow = false; }
    // the lens: a dome 0.034 across standing 0.012 proud on the tip end, with a soft halo when lit
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.017, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), lensM);
    lens.scale.y = 0.012 / 0.017; lens.rotation.x = -Math.PI / 2; lens.position.set(0, 0, BODY.butt - BODY.l); lens.castShadow = false; g.add(lens);
    const halo = new THREE.Sprite(addM({ map: radialTexture([[0, "rgba(191,243,255,1)"], [0.3, "rgba(120,225,255,0.5)"], [1, "rgba(88,216,255,0)"]]), opacity: 0 }));
    halo.scale.setScalar(0.1); halo.position.set(0, 0, REMOTE.tip[2] - 0.004); halo.renderOrder = 4; g.add(halo);
    return {
      grip: 0,
      apply(ps) {
        const pr = clamp(ps.press ?? S.press ?? 0), lt = clamp(ps.lit ?? S.lit ?? 0);
        btn.position.y = BODY.t / 2 - 0.005 * pr;
        faceM.color.copy(lerpHex("#3fd0ff", "#bff3ff", pr));
        lensM.color.copy(lerpHex("#8fb9c9", "#bff3ff", lt));
        halo.material.opacity = 0.75 * lt; halo.visible = lt > 0.01;
      },
    };
  },

  pauseray(P) {
    const S = P.spec, A = new THREE.Vector3(0, 0, 0), V = S.via ? new THREE.Vector3(...S.via) : null, B = new THREE.Vector3(...(S.to || [0, 0, -1]));
    const depth = S.depth !== false, coreCol = new THREE.Color("#eafcff"), glowCol = new THREE.Color("#58d8ff");
    const legs = [[A, V || B], V ? [V, B] : null].filter(Boolean);
    const L1 = legs[0][0].distanceTo(legs[0][1]), L2 = legs[1] ? legs[1][0].distanceTo(legs[1][1]) : 0, Lall = Math.max(L1 + L2, 1e-6);
    const mk = (a, b) => {
      const u = { uA: { value: a.clone() }, uB: { value: b.clone() }, uRes: { value: new THREE.Vector2(...RES) }, uCore: { value: S.core ?? 6 }, uGlow: { value: S.glowPx ?? 22 }, uK: { value: 1 }, uCoreCol: { value: coreCol }, uGlowCol: { value: glowCol } };
      return { u, o: quad(shader(LINE_VS, LINE_FS, u, depth), P.whole, 6) };
    };
    const line = legs.map(([a, b]) => mk(a, b));
    const mkDot = (px) => { const u = { uP: { value: new THREE.Vector3() }, uRes: { value: new THREE.Vector2(...RES) }, uSize: { value: px }, uK: { value: 0.8 }, uCol: { value: new THREE.Color("#ffffff") } }; return { u, o: dotQuad(shader(DOT_VS, DOT_FS, u, depth), P.whole, 7) }; };
    const heads = legs.map((_, i) => mkDot(i ? 20 : 16));
    const glint = new THREE.Sprite(addM({ map: radialTexture([[0, "rgba(255,255,255,0.9)"], [0.35, "rgba(255,255,255,0.75)"], [0.7, "rgba(88,216,255,0.45)"], [1, "rgba(88,216,255,0)"]]), depthTest: false, opacity: 0 }));
    glint.renderOrder = 8; if (V) glint.position.copy(V); glint.visible = false; P.whole.add(glint);
    const hitS = new THREE.Sprite(addM({ map: radialTexture([[0, "rgba(191,243,255,0.7)"], [0.6, "rgba(191,243,255,0.62)"], [1, "rgba(191,243,255,0)"]]), depthTest: false, opacity: 0 }));
    hitS.renderOrder = 8; hitS.position.copy(B); hitS.scale.setScalar(0.1); hitS.visible = false; P.whole.add(hitS);
    const pt = new THREE.Vector3();
    return {
      grip: 0,
      apply(ps) {
        const k = clamp(ps.rise ?? S.rise ?? 0), gl = clamp(ps.glow ?? S.glow ?? 0), s = k * Lall;
        const lens = [clamp(s / Math.max(L1, 1e-6)), clamp((s - L1) / Math.max(L2, 1e-6))];
        legs.forEach(([a, b], i) => {
          const on = gl > 0.002 && k > 0.0005 && (i === 0 || (L2 > 0 && s > L1 + 1e-6));
          line[i].o.visible = on; heads[i].o.visible = false;
          if (!on) return;
          pt.copy(a).lerp(b, lens[i]); line[i].u.uB.value.copy(pt); line[i].u.uK.value = gl;
          const travelling = k < 0.999 && (i === 1 || !legs[1] || s <= L1), h = heads[i];
          h.o.visible = travelling; if (travelling) { h.u.uP.value.copy(pt); h.u.uK.value = 0.8 * gl; }
        });
        const gk = clamp(ps.glint ?? S.glint ?? 0), hk = clamp(ps.hit ?? S.hit ?? 0);
        glint.visible = !!V && gk > 0.003; if (glint.visible) { glint.material.opacity = clamp(gk / 0.35); glint.scale.setScalar(0.06 + 0.1 * clamp(gk / 0.35)); }
        hitS.visible = hk > 0.003; if (hitS.visible) hitS.material.opacity = hk;
      },
    };
  },

  cookiehalf(P) {
    const S = P.spec, side = S.side === "R" ? "R" : "L", R = S.r ?? COOKIE.r, T = COOKIE.t, s = R / 0.075;
    const bite = (((S.biteAt ?? (side === "L" ? 150 : 30)) * Math.PI) / 180);
    const M = halfMaths(R), cen = M[side];
    const top = canvasTex(256, 256, (g, w, h) => {   // the chunkcookie's baked top, the same canvas
      const r = rnd(5); g.fillStyle = "#d9984a"; g.fillRect(0, 0, w, h);
      const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
      gr.addColorStop(0, "rgba(246,196,112,0.9)"); gr.addColorStop(0.65, "rgba(232,170,86,0.5)"); gr.addColorStop(1, "rgba(160,92,36,0.9)");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,224,160,0.18)" : "rgba(150,86,30,0.16)"; g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 16, 4 + r() * 10, r() * 3, 0, Math.PI * 2); g.fill(); }
      g.strokeStyle = "rgba(128,70,24,0.5)"; g.lineWidth = 2; g.lineCap = "round";
      for (let i = 0; i < 6; i++) { let x = w * (0.25 + r() * 0.5), y = h * (0.25 + r() * 0.5); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 34; y += (r() - 0.5) * 34; g.lineTo(x, y); } g.stroke(); }
    });
    top.repeat.set(1 / (2.2 * R), 1 / (2.2 * R)); top.offset.set(0.5, 0.5); top.wrapS = top.wrapT = THREE.ClampToEdgeWrapping;
    const face = mat("#ffffff", { map: top, roughness: 0.9 }), sideM = mat("#b8763a", { roughness: 0.9 }), chipM = mat("#3a2215", { roughness: 0.55 });
    const crumbM = mat("#e9b46a", { roughness: 0.95 }), breakM = mat("#e9c98a", { roughness: 0.9, side: THREE.DoubleSide }), cutM = mat("#4a2c1a", { roughness: 0.6 });
    const crumbDust = mat("#d9b071", { roughness: 0.95 });
    const make = (biteA) => {
      const out = new THREE.Group(); P.whole.add(out); out.rotation.y = side === "R" ? Math.PI : 0;
      const { pts, zig } = halfOutline(R, M.x0, side, biteA, HALF_BEVSIZE * 1.04);
      const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
      const depth = T - 2 * HALF_BEV, geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: HALF_BEV, bevelSize: HALF_BEVSIZE, bevelSegments: 3, curveSegments: 1 });
      geo.translate(-cen[0], -cen[1], -depth / 2); geo.rotateX(-Math.PI / 2);   // whole-cookie x / y -> x / -z, thickness along y
      mesh(geo, [face, sideM], out);
      // the broken face: a ribbon laid over the bevelled wall along the zigzag, lighter than the baked top
      const sgn = side === "L" ? 1 : -1, np = zig.length, prof = [];
      for (let j = 0; j <= 3; j++) { const t = j / 3; prof.push([HALF_BEVSIZE * Math.sin((t * Math.PI) / 2) + 0.0004, depth / 2 + HALF_BEV * Math.cos((t * Math.PI) / 2)]); }
      for (let j = 3; j >= 0; j--) prof.push([prof[j][0], -prof[j][1]]);
      const nrm = zig.map((p, i) => { const a = zig[Math.max(0, i - 1)], b = zig[Math.min(np - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [(sgn * dy) / l, (-sgn * dx) / l]; });
      const vp = [], idx = [];
      zig.forEach((p, i) => prof.forEach(([off, yy]) => { vp.push(p[0] + nrm[i][0] * off - cen[0], yy, -(p[1] + nrm[i][1] * off - cen[1])); }));
      for (let i = 0; i < np - 1; i++) for (let j = 0; j < prof.length - 1; j++) { const a = i * prof.length + j, b = (i + 1) * prof.length + j; idx.push(a, b, a + 1, b, b + 1, a + 1); }
      const rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.Float32BufferAttribute(vp, 3)); rg.setIndex(idx); rg.computeVertexNormals();
      const rib = new THREE.Mesh(rg, breakM); rib.castShadow = false; rib.receiveShadow = true; out.add(rib);
      // two chip cross-sections on the broken face, in the pockets between the zigzag's teeth
      for (const [i0, i1] of [[1, 2], [3, 4]]) {
        const a = zig[i0], b = zig[i1], mx = (a[0] + b[0]) / 2 + nrm[i0][0] * 0.0006, my = (a[1] + b[1]) / 2 + nrm[i0][1] * 0.0006;
        const c = mesh(new THREE.IcosahedronGeometry(0.0075 * s, 0), cutM, out, mx - cen[0], 0.001, -(my - cen[1]));
        c.scale.set(1.5, 0.8, 0.28); c.rotation.y = Math.atan2(b[1] - a[1], b[0] - a[0]); c.castShadow = false;
      }
      // the baked-in chips of the whole cookie (chunkcookie's own sequence), the ones on this half and clear of the break
      const r = rnd(11);
      for (const sy of [1, -1]) for (let i = 0; i < 8; i++) {
        const q = r() * Math.PI * 2, d = R * (0.12 + 0.68 * Math.sqrt(r())), sz = 0.0085 + r() * 0.004, rot = r() * 3;
        const x = Math.cos(q) * d, y = Math.sin(q) * d, lx = lineX(R, M.x0, y);
        if (side === "L" ? x > lx - 0.016 * s : x < lx + 0.016 * s) continue;
        if (biteA != null && d > bitten(R, q, biteA) - 0.012) continue;
        const c = mesh(new THREE.IcosahedronGeometry(sz, 0), chipM, out, x - cen[0], sy * (T / 2 - 0.001), -(y - cen[1]));
        c.scale.set(1, 0.55, 1.15); c.rotation.y = rot; c.castShadow = false;
      }
      // the bite's torn edge: a few lighter crumbs of dough stuck along it
      if (biteA != null) for (let i = 0; i < 6; i++) {
        const q = biteA + (i / 5 - 0.5) * 0.9, d = bitten(R, q, biteA) - 0.003;
        const k = mesh(new THREE.IcosahedronGeometry(0.0045 + (i % 3) * 0.0015, 0), crumbM, out, Math.cos(q) * d - cen[0], ((i % 2) - 0.5) * T * 0.5, -(Math.sin(q) * d - cen[1]));
        k.castShadow = false;
      }
      return out;
    };
    const whole = make(null), eaten = make(bite); eaten.visible = false;
    // the 7 crumbs of the snap: lying flat on the table beside the break edge (half-local; the break faces +x)
    const rc = rnd(23), crumbs = [];
    const CR = [[0.016, 0.022], [0.024, -0.034], [0.037, 0.047], [0.012, -0.062], [0.045, 0.004], [0.031, -0.012], [0.054, -0.05]];
    const wallX = side === "L" ? M.x0 - cen[0] : cen[0] - M.x0;   // the break face in half-local x (the R half is turned 180 degrees)
    CR.forEach(([dx, dz], i) => {
      const sz = 0.004 + (0.005 * ((i * 5) % 7)) / 6;
      const c = mesh(new THREE.IcosahedronGeometry(sz, 0), crumbDust, P.whole, wallX + dx * s, -T / 2 + sz * 0.45, dz * s);
      c.scale.set(1, 0.55, 1 + rc() * 0.25); c.rotation.y = rc() * 6; c.castShadow = false; c.visible = false; crumbs.push(c);
    });
    return {
      grip: 0,
      apply(ps) {
        const kcut = (ps.cut || S.cut || 0) >= 0.5; whole.visible = !kcut; eaten.visible = kcut;
        const k = clamp(ps.crumbs ?? S.crumbs ?? 0);
        crumbs.forEach((c, i) => { c.visible = k > i / 7 + 1e-6; });
      },
    };
  },
};
