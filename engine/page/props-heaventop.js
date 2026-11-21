import * as THREE from "three";
import { clamp, rng } from "./util.js";

// Potato Desk "heaven steps", THE TOP: terrace, pearl gate, podium, ledger, gate rays (storyboards/series/potato-desk/heaven-steps/DESIGN.md
// sections 2 "Top terrace" and 4). Axes: x right, y up, +z toward the camera, metres; every size and hex colour is the DESIGN's. All of it is
// built in STATION T's frame (origin = top edge of riser 100, y 0 = the terrace), placed at the marks below. Every mark (vein, flute, flourish,
// scroll, star) is placed once from a fixed seed; the only numerals anywhere are the ledger's. Nothing is hand-held: HTOP_GRIPS is empty (the
// quill, goldquill, is another builder's). Everything animated is a pure function of the prop state: no clock, no Math.random.
// STATE KEYS. propState tweens `open`, `count`, `glow`; anything else (rim, seed) is spec only.
//
// heaventerrace  the top slab. Origin = station T (place at x 0, y 0, z 0). Slab x -2.60..+2.60, z -0.50..-4.30, top y 0, 0.30 thick, sides #ebe3d0,
//                top #f7f2e6 drawn once on a canvas (tile seams #e3dccb 1.30 x 0.95, 4 veins, one gold inlay ring r 1.05, 0.04 wide at (-0.20, -1.40);
//                the ring is cut by the slab's front edge), a gold trim 0.03 round the front and both sides. The fogveil (0.08 deep #f7fafc at 50 %)
//                and the 9 cloudpuffs are the existing kinds: the bench shows the numbers (box [[-2.6,0.01,-4.3],[2.6,0.09,-0.5]]). No keys. Floor
//                (not solid for the contact checks, like the lobby floor).
// pearlgate      origin = the threshold centre on the floor (place at x -0.20, y 0, z -2.30), faces +z. 1.90 wide, top y 1.89 (the pearls): two marble
//                pillars 0.30 x 0.30 x 1.55 at x +-0.80 (#f6f1e4, shade #e3dccb), gold base band 0.08 and capital 0.06, a gold collar and a pearl r 0.15.
//                Two leaves 0.65 wide hinged on the pillars' inner faces (x +-0.65), 1.30 high at the hinge rising to 1.62 at the meeting stile, gold
//                frame tube 0.04, white kick panel y 0..0.45 with a gold 4-point star each, 6 bars per leaf (Ø0.018, pitch 0.10) with 5 pearls each,
//                2 S-scrolls per leaf; the crest (disc r 0.09, star, 7 rays, top 1.81) rides the LEFT leaf's stile. Nothing here is above 1.89.
//                open 0..1 (default 0, TWEENS): both leaves swing inward (toward -z) open x 100 deg; the director's ease gives the settle: tween to 1.04
//                with ease "settle" and back to 1 (4 deg), shut with a 2-frame rebound to -0.03 (3 deg). Range -0.05..1.10. From open ~0.05 on, light
//                fades in (full at 0.6): a light plane 1.30 x 1.70 at z -0.70 (#fffbe8 -> #ffe9a8), a ray fan card (7 wedges 2.5 long, 30 %) at z -0.74,
//                3 cloud puffs at the foot, a light pool 1.6 x 2.2 on the terrace in front (#fff6d0, 60 %). All the light is unlit and see-through.
// cloudpodium    origin = the floor under the drum's centre (place at x 1.05, y 0, z -0.80). Marble drum r 0.32 (#f6f1e4, 5 drawn flutes), gold base
//                ring r 0.35 x 0.06, gold top rim 0.05, collar of 5 cloud puffs r 0.14-0.20 at y 0.14-0.26 (none in the front 38 deg: the ribbon hangs
//                there). Top y 0.42. Solid. No keys. Nobody holds it.
// ledger         0.56 x 0.07 x 0.36, origin = the podium top, bottom centre of the book (place at x 1.05, y 0.42, z -0.80), front toward +z. Open
//                book tilted 8 deg toward the lens (back edge top at y 0.514 on the podium = 0.52, front corners sink 0.025 into the cap), gold-edged
//                gold cover, cream pages with 9 ruled lines each and a gold corner flourish, a red ribbon 0.04 x 0.22 #b3261e lying over the rim and
//                hanging down the podium's front (spec.rim, default 0.335 = the drum's gold rim). count 0..4 (default 0, TWEENS): entry i (-10, -30,
//                -60, -1) is written on the RIGHT page, in #8a5a12 ink, cap 0.085, stroke 0.014, stroke by stroke (the minus first, then each digit's
//                stroke) while count goes i -> i+1 (the director sets 8 frames, ease linear); count = k at rest shows entry k-1 whole on the right and
//                the earlier ones small (cap 0.035) stacked on the LEFT page. Numerals only. The right page is readable from a top camera only.
// gaterays       origin = the card's centre (place at x -0.20, y 2.2, z -6.0), faces +z: 6.0 x 5.0 plane, 9 soft rays #fff1c2 at 35 % fanning up and out
//                from the gate's centre (world y 0.95 for that place), unlit. glow 0..1 (default 1, TWEENS) scales them.
// HELD: nothing in this file is hand-held (HTOP_GRIPS is empty).

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
const basic = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, ...o }); m.fog = false; return m; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const box = (w, h, d, m, parent, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z);
function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const ss = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const flat = (o, shadow = false) => { o.castShadow = shadow; o.userData.solid = false; o.userData.steam = true; return o; };
const see = (root) => root.traverse((o) => { if (o.isMesh) { o.userData.solid = false; o.userData.steam = true; o.castShadow = false; } });
const noHatch = (...ms) => { for (const m of ms) m.userData.noHatch = true; return ms[0]; };
// a see-through canvas laid on a face (page, kick panel): lit like the surface under it
const overlay = (tex) => {
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  m.userData.noOutline = true; m.userData.noHatch = true; return m;
};
// an unlit, see-through light card (fog off, no outline)
const glowMat = (tex, o = {}) => { const m = basic("#ffffff", { map: tex, transparent: true, depthWrite: false, ...o }); m.userData.noOutline = true; m.userData.noHatch = true; return m; };
function plane(w, h, m, parent, x, y, z, rx = 0) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.x = rx; o.castShadow = false; o.receiveShadow = true; parent.add(o); return o; }
// vertex colours by a function of the vertex (top-lit pearls and puffs)
function tintGeo(geo, fn) {
  const p = geo.attributes.position, n = geo.attributes.normal, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const k = fn(n.getY(i)); c[i * 3] = k.r; c[i * 3 + 1] = k.g; c[i * 3 + 2] = k.b; }
  geo.setAttribute("color", new THREE.BufferAttribute(c, 3)); return geo;
}
const lerpCol = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), clamp(t));
const vmat = (o = {}) => new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.55, ...o });
// a straight rod from a to b in the x-y plane (z = zz), radius r
function rod(parent, a, b, r, m, zz = 0) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1e-6) return null;
  const o = mesh(new THREE.CylinderGeometry(r, r, L, 8), m, parent, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, zz);
  o.rotation.z = -Math.atan2(b[0] - a[0], b[1] - a[1]); return o;
}
const tube = (parent, pts, r, m, segs = 64) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2] ?? 0)), false, "centripetal"), segs, r, 6, false), m, parent);

// ---- numerals: hand-written strokes (unit box: width w, height 1, y down) so a number can be written stroke by stroke --------------------------------
const arc = (cx, cy, rx, ry, a0, a1, n = 14) => { const o = []; for (let i = 0; i <= n; i++) { const a = (a0 + ((a1 - a0) * i) / n) * DEG; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; };
const quad = (a, c, b, n = 10) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); } return o; };
const GLYPH = {
  "-": { w: 0.56, strokes: [[[0.02, 0.52], [0.28, 0.505], [0.54, 0.49]]] },
  "1": { w: 0.46, strokes: [[[0.05, 0.28], [0.18, 0.15], [0.30, 0.02], [0.30, 0.35], [0.30, 0.68], [0.30, 1.0]]] },
  "3": { w: 0.60, strokes: [[...arc(0.30, 0.26, 0.26, 0.25, 200, 450), ...arc(0.30, 0.75, 0.29, 0.25, 270, 520).slice(1)]] },
  "6": { w: 0.54, strokes: [[...quad([0.50, 0.02], [0.10, 0.18], [0.06, 0.72]), ...arc(0.29, 0.72, 0.23, 0.28, 180, -180, 22).slice(1)]] },
  "0": { w: 0.60, strokes: [arc(0.30, 0.5, 0.27, 0.5, 275, 640, 26)] },
};
const GAP = 0.20;
function inkWidth(str, cap) { let w = 0; for (const ch of str) w += (GLYPH[ch].w + GAP) * cap; return w - GAP * cap; }
// write `str` (cap = glyph height, metres) with its left baseline at (x0, base) px on g (ppm px per metre); prog 0..1 = how much of the pen path is down
function inkEntry(g, str, x0, base, cap, prog, ppm, ang = 0, ink = "#8a5a12") {
  if (prog <= 0) return;
  const strokes = []; let ax = 0;
  for (const ch of str) { const gl = GLYPH[ch]; for (const s of gl.strokes) strokes.push(s.map(([x, y]) => [(ax + x * 1) * cap * ppm, (y - 1) * cap * ppm])); ax += gl.w + GAP; }
  const len = (s) => { let L = 0; for (let i = 1; i < s.length; i++) L += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]); return L; };
  let remain = clamp(prog) * strokes.reduce((a, s) => a + len(s), 0);
  g.save(); g.translate(x0, base); g.rotate(ang); g.strokeStyle = ink; g.lineWidth = 0.014 * (cap / 0.085) * ppm; g.lineCap = "round"; g.lineJoin = "round";
  for (const s of strokes) {
    if (remain <= 0) break;
    g.beginPath(); g.moveTo(s[0][0], s[0][1]);
    for (let i = 1; i < s.length && remain > 0; i++) {
      const d = Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]);
      if (d <= remain) { g.lineTo(s[i][0], s[i][1]); remain -= d; }
      else { const k = remain / d; g.lineTo(s[i - 1][0] + (s[i][0] - s[i - 1][0]) * k, s[i - 1][1] + (s[i][1] - s[i - 1][1]) * k); remain = 0; }
    }
    g.stroke();
  }
  g.restore();
}

export const HTOP_KINDS = {
  // ---- the terrace ---------------------------------------------------------------------------------------------------------------------------------
  heaventerrace(P) {
    const X0 = -2.60, X1 = 2.60, Z0 = -4.30, Z1 = -0.50, W = X1 - X0, D = Z1 - Z0, PPM = 200;
    const side = noHatch(mat("#ebe3d0", { roughness: 0.8, emissive: new THREE.Color("#ebe3d0"), emissiveIntensity: 0.22 })), gold = mat("#e8b93a", { roughness: 0.4, metalness: 0.3, emissive: new THREE.Color("#e8b93a"), emissiveIntensity: 0.15 });
    flat(box(W, 0.30, D, side, P.whole, 0, -0.15 - 0.002, (Z0 + Z1) / 2), false).receiveShadow = true;
    // the top, drawn once: tile seams 1.30 x 0.95, 4 veins, the gold inlay ring (the front edge cuts it)
    const tex = canvasTex(Math.round(W * PPM), Math.round(D * PPM), (g, w, h) => {
      const px = (x) => (x - X0) * PPM, pz = (z) => (z - Z0) * PPM;   // canvas top = far edge (z -4.30)
      g.fillStyle = "#f7f2e6"; g.fillRect(0, 0, w, h);
      const r = rng(41);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? "rgba(235,227,208,0.30)" : "rgba(255,255,255,0.18)"; g.fillRect(px(X0 + 1.30 * i), pz(Z0 + 0.95 * j), 1.30 * PPM, 0.95 * PPM); }
      g.strokeStyle = "#e3dccb"; g.lineWidth = 0.008 * PPM;
      for (const x of [-1.30, 0, 1.30]) { g.beginPath(); g.moveTo(px(x), 0); g.lineTo(px(x), h); g.stroke(); }
      for (const z of [-3.35, -2.40, -1.45]) { g.beginPath(); g.moveTo(0, pz(z)); g.lineTo(w, pz(z)); g.stroke(); }
      g.lineCap = "round"; g.lineWidth = 0.012 * PPM;
      for (const [x, z, dx, dz] of [[-2.2, -3.9, 0.9, 0.35], [1.0, -4.1, 0.8, -0.2], [-1.6, -0.85, 0.7, 0.18], [1.7, -1.9, -0.6, 0.5]]) {   // one vein each, placed once
        const mx = x + dx / 2 + (r() - 0.5) * 0.15, mz = z + dz / 2 + (r() - 0.5) * 0.15;
        g.beginPath(); g.moveTo(px(x), pz(z)); g.quadraticCurveTo(px(mx), pz(mz), px(x + dx), pz(z + dz)); g.stroke();
      }
      g.strokeStyle = "#e8b93a"; g.lineWidth = 0.04 * PPM; g.beginPath(); g.arc(px(-0.20), pz(-1.40), 1.05 * PPM, 0, TAU); g.stroke();
      g.strokeStyle = "#ffe89a"; g.lineWidth = 0.008 * PPM; g.beginPath(); g.arc(px(-0.20), pz(-1.40), 1.05 * PPM - 0.012 * PPM, 0, TAU); g.stroke();
    });
    const topM = noHatch(mat("#ffffff", { map: tex, roughness: 0.6, emissive: new THREE.Color("#ffffff"), emissiveMap: tex, emissiveIntensity: 0.22 }));
    flat(plane(W, D, topM, P.whole, 0, 0.0015, (Z0 + Z1) / 2, -Math.PI / 2)).receiveShadow = true;
    // gold trim 0.03 round the front and both sides (proud of the top by 0.012)
    flat(box(W, 0.012, 0.03, gold, P.whole, 0, 0.006, Z1 - 0.015)); for (const s of [-1, 1]) flat(box(0.03, 0.012, D, gold, P.whole, s * (W / 2 - 0.015), 0.006, (Z0 + Z1) / 2));
    return { grip: 0 };
  },

  // ---- the gate ------------------------------------------------------------------------------------------------------------------------------------
  pearlgate(P) {
    const lift = (c, k) => ({ emissive: new THREE.Color(c), emissiveIntensity: k });   // a little self-light: the warm key must not turn white marble peach
    const marble = noHatch(mat("#f6f1e4", { roughness: 0.6, ...lift("#f6f1e4", 0.28) })), shade = noHatch(mat("#e3dccb", { roughness: 0.7, ...lift("#e3dccb", 0.28) }));
    const gold = mat("#e8b93a", { roughness: 0.35, metalness: 0.3, emissive: new THREE.Color("#e8b93a"), emissiveIntensity: 0.18 });
    const goldHi = mat("#ffe89a", { roughness: 0.35, emissive: new THREE.Color("#ffe89a"), emissiveIntensity: 0.2 });
    const pearlM = vmat({ roughness: 0.3, emissive: new THREE.Color("#fbf8f2"), emissiveIntensity: 0.22 }); noHatch(pearlM);
    const pearlTint = (ny) => lerpCol("#d9d2e0", "#fbf8f2", (ny + 0.45) / 1.1);
    const bigPearl = tintGeo(new THREE.SphereGeometry(0.15, 24, 16), pearlTint), bead = tintGeo(new THREE.SphereGeometry(0.022, 10, 8), pearlTint);
    // pillars: x +-0.80, 0.30 x 1.55 x 0.30, shade on the side faces; base band, capital, collar, pearl (top y 1.89)
    for (const s of [-1, 1]) {
      const g = new THREE.Group(); g.position.x = s * 0.80; P.whole.add(g);
      const sh = new THREE.Mesh(new THREE.BoxGeometry(0.30, 1.55, 0.30), [shade, shade, marble, marble, marble, marble]); sh.position.y = 0.775; sh.castShadow = sh.receiveShadow = true; g.add(sh);
      box(0.325, 0.08, 0.325, gold, g, 0, 0.04, 0); box(0.325, 0.06, 0.325, gold, g, 0, 1.52, 0); box(0.335, 0.012, 0.335, goldHi, g, 0, 1.556, 0);
      mesh(new THREE.CylinderGeometry(0.10, 0.12, 0.04, 20), gold, g, 0, 1.58, 0);   // collar 1.56..1.60? centre 1.58: the pearl sits on it
      mesh(bigPearl, pearlM, g, 0, 1.74, 0);   // r 0.15: top 1.89
    }
    // a leaf: u from the hinge (0) to the stile (0.65), x = dir * u; the top rises from 1.30 to 1.62 (a domed curve, flat at the stile)
    const topY = (u) => 1.30 + 0.32 * (1 - Math.pow(1 - clamp(u / 0.65), 2));
    const star = (g, cx, cy, R, r0, jit) => {   // a 4-point star, concave sides, hand-drawn once
      g.beginPath();
      for (let i = 0; i < 8; i++) { const a = (i * 45 - 90 + jit * (i % 2 ? 1 : 0.4)) * DEG, rr = i % 2 ? r0 : R; const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      g.closePath();
    };
    const SC = [
      { u0: 0.15, y0: 0.62, w: 0.19, h: 0.27, R1: 0.055, R2: 0.045, flip: 1 },
      { u0: 0.27, y0: 1.04, w: 0.20, h: 0.29, R1: 0.050, R2: 0.060, flip: -1 },
      { u0: 0.16, y0: 0.64, w: 0.21, h: 0.26, R1: 0.048, R2: 0.052, flip: -1 },
      { u0: 0.30, y0: 1.02, w: 0.17, h: 0.30, R1: 0.058, R2: 0.044, flip: 1 },
    ];
    const scrollPts = (o, dir) => {   // an S: curl 1 (inner end -> out, counter-clockwise), a sweep down, curl 2 (in, clockwise)
      const c1 = [o.u0, o.y0 + o.h - o.R1], c2 = [o.u0 + o.w, o.y0 + o.R2], pts = [], n = 12, fx = (u) => dir * u;
      for (let i = 0; i <= n; i++) { const k = i / n, a = (-90 - 480 * (1 - k)) * DEG, r = o.R1 * (0.22 + 0.78 * k); pts.push([fx(c1[0] + r * Math.cos(a)), c1[1] + r * Math.sin(a)]); }
      for (let i = 0; i <= n; i++) { const k = i / n, a = (90 - 480 * k) * DEG, r = o.R2 * (1 - 0.78 * k); pts.push([fx(c2[0] + r * Math.cos(a)), c2[1] + r * Math.sin(a)]); }
      return pts;
    };
    const leaves = [-1, 1].map((s, li) => {
      const dir = -s;   // the left leaf (s -1) runs toward +x
      const g = new THREE.Group(); g.position.set(s * 0.65, 0, 0); P.whole.add(g);
      const X = (u) => dir * u, T = 0.02;
      // frame: hinge and meeting stiles, bottom rail, rail over the kick panel, the curved top rail
      rod(g, [X(0.02), 0.02], [X(0.02), topY(0.02) - T], T, gold); rod(g, [X(0.63), 0.02], [X(0.63), topY(0.63) - T], T, gold);
      rod(g, [X(0.02), 0.02], [X(0.63), 0.02], T, gold); rod(g, [X(0.02), 0.47], [X(0.63), 0.47], T, gold);
      tube(g, Array.from({ length: 14 }, (_, i) => { const u = 0.02 + (0.61 * i) / 13; return [X(u), topY(u) - T, 0]; }), T, gold, 40);
      for (const [u, y] of [[0.02, 0.02], [0.63, 0.02], [0.02, 0.47], [0.63, 0.47]]) mesh(new THREE.SphereGeometry(T * 1.1, 10, 8), gold, g, X(u), y, 0);
      // the kick panel: pearl white, one gold star (own canvas, own small turn), 0.026 thick
      const kt = canvasTex(342, 246, (c, w, h) => {
        c.fillStyle = "#f8f5ec"; c.fillRect(0, 0, w, h); c.strokeStyle = "#e8b93a"; c.lineWidth = 5; c.strokeRect(10, 10, w - 20, h - 20);
        c.strokeStyle = "#e3dccb"; c.lineWidth = 2; c.strokeRect(20, 20, w - 40, h - 40);
        c.fillStyle = "#e8b93a"; star(c, w / 2, h / 2, 88 + 3 * li, 20 - 2 * li, 4 * (li ? -1 : 1)); c.fill();
        c.fillStyle = "#ffe89a"; star(c, w / 2 - 3, h / 2 - 3, 36, 10, 0); c.fill();
      });
      const front = noHatch(mat("#ffffff", { map: kt, roughness: 0.5 })), plain = noHatch(mat("#f8f5ec", { roughness: 0.6 }));
      const kp = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.41, 0.026), [plain, plain, plain, plain, front, plain]); kp.position.set(X(0.325), 0.245, 0); kp.castShadow = kp.receiveShadow = true; g.add(kp);
      // 6 bars (Ø0.018, pitch 0.10), each strung with 5 pearls r 0.022
      for (let k = 0; k < 6; k++) {
        const u = 0.07 + 0.10 * k, y0 = 0.49, y1 = topY(u) - T;
        rod(g, [X(u), y0], [X(u), y1], 0.009, gold);
        for (let j = 0; j < 5; j++) mesh(bead, pearlM, g, X(u), y0 + ((y1 - y0) * (j + 0.5)) / 5, 0).castShadow = false;
      }
      // 2 S-scrolls, each its own curve, a little in front of the bars
      for (const o of [SC[li * 2], SC[li * 2 + 1]]) { const t = tube(g, scrollPts(o, dir).map(([x, y]) => [x, y, 0.016]), 0.0075, gold, 90); t.castShadow = false; }
      return g;
    });
    // the crest on the LEFT leaf's stile: disc r 0.09, a star, 7 rays; top 1.81 (centre 1.72)
    const crestTex = canvasTex(256, 256, (c, w, h) => {
      const cx = w / 2, cy = h / 2, R = w / 2 - 2;
      c.fillStyle = "#e8b93a"; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
      c.strokeStyle = "#b8862a"; c.lineWidth = 5; c.beginPath(); c.arc(cx, cy, R - 3, 0, TAU); c.stroke();
      c.fillStyle = "#ffe89a";
      for (let i = 0; i < 7; i++) { const a = (-90 + i * (360 / 7) + 10) * DEG, a0 = a - 0.19, a1 = a + 0.19; c.beginPath(); c.moveTo(cx + R * 0.50 * Math.cos(a0), cy + R * 0.50 * Math.sin(a0)); c.lineTo(cx + R * 0.93 * Math.cos(a), cy + R * 0.93 * Math.sin(a)); c.lineTo(cx + R * 0.50 * Math.cos(a1), cy + R * 0.50 * Math.sin(a1)); c.closePath(); c.fill(); }
      c.fillStyle = "#fbf8f0"; star(c, cx, cy, R * 0.50, R * 0.15, 0); c.fill(); c.strokeStyle = "#b8862a"; c.lineWidth = 3; c.stroke();
    });
    const crest = plane(0.18, 0.18, noHatch(mat("#ffffff", { map: crestTex, roughness: 0.4, transparent: true, alphaTest: 0.5 })), leaves[0], 0.65, 1.72, 0.012);
    crest.userData.solid = true;
    // light for the open gate (unlit, see-through): plane, ray fan, foot puffs, floor pool
    const lightG = new THREE.Group(); P.whole.add(lightG);
    const lp = canvasTex(260, 340, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#fffbe8"); gr.addColorStop(1, "#ffe9a8"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      const hl = c.createRadialGradient(w / 2, h * 0.55, 0, w / 2, h * 0.55, w * 0.7); hl.addColorStop(0, "rgba(255,255,255,0.85)"); hl.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = hl; c.fillRect(0, 0, w, h);
      c.globalCompositeOperation = "destination-in";   // alpha: full in the middle, soft at the top and sides
      const va = c.createLinearGradient(0, 0, 0, h); va.addColorStop(0, "rgba(0,0,0,0)"); va.addColorStop(0.45, "rgba(0,0,0,1)"); va.addColorStop(1, "rgba(0,0,0,1)"); c.fillStyle = va; c.fillRect(0, 0, w, h);
      const ha = c.createLinearGradient(0, 0, w, 0); ha.addColorStop(0, "rgba(0,0,0,0.5)"); ha.addColorStop(0.15, "rgba(0,0,0,1)"); ha.addColorStop(0.85, "rgba(0,0,0,1)"); ha.addColorStop(1, "rgba(0,0,0,0.5)"); c.fillStyle = ha; c.fillRect(0, 0, w, h);
    });
    const lpM = glowMat(lp), lpO = flat(plane(1.30, 1.70, lpM, lightG, 0, 0.85, -0.70)); lpO.renderOrder = 2;
    const fan = canvasTex(500, 500, (c, w, h) => {
      const sx = w / 2, sy = h / 2, ppm = 100, L = 2.5 * ppm, r = rng(77);
      const rays = [[-78, 5], [-52, 4], [-26, 6], [0, 5], [26, 6], [52, 4], [78, 5]];
      c.fillStyle = "#fff1c2";
      for (const [a, hw] of rays) {
        const l = L * (0.86 + 0.14 * r()), gr = c.createRadialGradient(sx, sy, 0.15 * ppm, sx, sy, l); gr.addColorStop(0, "rgba(255,246,208,0.30)"); gr.addColorStop(1, "rgba(255,241,194,0)");
        c.fillStyle = gr; c.beginPath(); c.moveTo(sx, sy);
        const a0 = (a - hw) * DEG, a1 = (a + hw) * DEG; c.lineTo(sx + l * Math.sin(a0) * 1.05, sy - l * Math.cos(a0) * 1.05); c.lineTo(sx + l * Math.sin(a1) * 1.05, sy - l * Math.cos(a1) * 1.05); c.closePath(); c.fill();
      }
    });
    const fanM = glowMat(fan), fanO = flat(plane(5, 5, fanM, lightG, 0, 0.85, -0.74)); fanO.renderOrder = 1;
    const puffM = basic("#f7fafc"), puffs = [[-0.38, 0.10, -0.52, 0.10], [0.04, 0.12, -0.46, 0.13], [0.40, 0.09, -0.55, 0.09]].map(([x, y, z, r]) => {
      const o = flat(mesh(new THREE.SphereGeometry(1, 14, 10), puffM, lightG, x, y, z)); o.scale.set(r * 1.5, r * 0.8, r * 1.1); return { o, r, y };
    });
    const poolT = canvasTex(256, 352, (c, w, h) => {   // the pool: bright at the threshold (top), gone at 2.2 m
      c.save(); c.translate(w / 2, 0); c.scale(1, h / (w * 0.5 * 1.0)); const gr = c.createRadialGradient(0, 0, 0, 0, 0, w * 0.5); gr.addColorStop(0, "rgba(255,246,208,1)"); gr.addColorStop(0.6, "rgba(255,246,208,0.55)"); gr.addColorStop(1, "rgba(255,246,208,0)");
      c.fillStyle = gr; c.fillRect(-w / 2, 0, w, w * 0.5); c.restore();
    });
    const poolM = glowMat(poolT, { opacity: 0.6 }), poolO = flat(plane(1.6, 2.2, poolM, lightG, 0, 0.006, 1.10 - 0.55, -Math.PI / 2)); poolO.renderOrder = 1;
    see(lightG);
    return {
      grip: 0,
      apply(ps) {
        const o = clamp(ps.open ?? 0, -0.05, 1.10), a = o * 100 * DEG, k = ss(o / 0.6);
        leaves[0].rotation.y = a; leaves[1].rotation.y = -a;   // both swing inward (-z)
        lightG.visible = k > 0.01; lpM.opacity = k; fanM.opacity = k; poolM.opacity = 0.6 * k;
        for (const q of puffs) q.o.scale.set(q.r * 1.5 * (0.3 + 0.7 * k), q.r * 0.8 * k, q.r * 1.1 * (0.3 + 0.7 * k));
      },
    };
  },

  // ---- the podium ----------------------------------------------------------------------------------------------------------------------------------
  cloudpodium(P) {
    const marble = noHatch(mat("#f6f1e4", { roughness: 0.6, emissive: new THREE.Color("#f6f1e4"), emissiveIntensity: 0.28 }));
    const gold = mat("#e8b93a", { roughness: 0.35, metalness: 0.3, emissive: new THREE.Color("#e8b93a"), emissiveIntensity: 0.18 });
    // 5 flutes, each its own width and length, drawn once on the drum (u = 0 is the +z front)
    const fl = canvasTex(512, 128, (c, w, h) => {
      c.fillStyle = "#f6f1e4"; c.fillRect(0, 0, w, h);
      for (const [u, wd, y0, y1] of [[0.045, 16, 8, 118], [0.255, 12, 14, 112], [0.47, 18, 6, 120], [0.665, 13, 12, 114], [0.865, 15, 9, 119]]) {
        const x = u * w; c.fillStyle = "#e3dccb"; c.beginPath(); c.moveTo(x, y0); c.quadraticCurveTo(x + wd, (y0 + y1) / 2, x, y1); c.quadraticCurveTo(x - wd, (y0 + y1) / 2, x, y0); c.fill();
        c.fillStyle = "#fbf8f0"; c.beginPath(); c.moveTo(x - wd * 0.4, y0 + 10); c.lineTo(x - wd * 0.4, y1 - 10); c.lineTo(x - wd * 0.2, y1 - 10); c.lineTo(x - wd * 0.2, y0 + 10); c.fill();
      }
    });
    const drum = noHatch(mat("#ffffff", { map: fl, roughness: 0.6, emissive: new THREE.Color("#f6f1e4"), emissiveMap: fl, emissiveIntensity: 0.28 }));
    mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.35, 40), drum, P.whole, 0, 0.235, 0);   // y 0.06..0.41 (the rim covers 0.37..0.42: no shared top face)
    mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.06, 40), gold, P.whole, 0, 0.03, 0);
    mesh(new THREE.CylinderGeometry(0.335, 0.335, 0.05, 40), gold, P.whole, 0, 0.395, 0);   // top rim to y 0.42
    const cap = new THREE.Mesh(new THREE.CircleGeometry(0.30, 40), marble); cap.rotation.x = -Math.PI / 2; cap.position.y = 0.4205; cap.receiveShadow = true; P.whole.add(cap);
    // a collar of 5 cloud puffs, none in the front 38 deg (the ribbon hangs there); each its own size and height
    const cm = vmat({ roughness: 0.9, emissive: new THREE.Color("#f7fafc"), emissiveIntensity: 0.3 }); noHatch(cm); cm.userData.noOutline = true;
    const g = tintGeo(new THREE.SphereGeometry(1, 20, 14), (ny) => lerpCol("#dbe7ef", "#f7fafc", (ny + 0.3) / 0.9));
    [[40, 0.14, 0.20], [112, 0.20, 0.17], [182, 0.17, 0.24], [250, 0.19, 0.15], [320, 0.14, 0.26]].forEach(([deg, r, y]) => {   // (angle from +z, radius, centre height)
      const a = deg * DEG, o = mesh(g, cm, P.whole, 0.31 * Math.sin(a), y, 0.31 * Math.cos(a)); o.scale.set(r, r * 0.9, r);
    });
    return { grip: 0 };
  },

  // ---- the ledger ----------------------------------------------------------------------------------------------------------------------------------
  ledger(P) {
    const S = P.spec, RIM = S.rim ?? 0.335, PPM = 1400, PW = 0.27, PH = 0.34, LINES = 9;
    const gold = mat("#e8b93a", { roughness: 0.35, metalness: 0.3, emissive: new THREE.Color("#e8b93a"), emissiveIntensity: 0.18 });
    const cover = mat("#b8862a", { roughness: 0.55 }), ribbonM = noHatch(mat("#b3261e", { roughness: 0.6 }));
    const under = noHatch(mat("#eadfc6", { roughness: 0.8 })), pageM = noHatch(mat("#fbf6ea", { roughness: 0.8 }));
    const book = new THREE.Group(); book.rotation.x = 8 * DEG; P.whole.add(book);   // tilted 8 deg toward the lens about the book's bottom centre
    box(0.59, 0.008, 0.39, gold, book, 0, 0.004, 0); box(0.58, 0.012, 0.38, cover, book, 0, 0.014, 0);
    for (const s of [-1, 1]) { box(0.275, 0.032, 0.35, under, book, s * 0.1375, 0.036, 0); box(0.272, 0.018, 0.346, pageM, book, s * 0.1375, 0.061, 0); }
    box(0.012, 0.07, 0.36, gold, book, 0, 0.035, 0).castShadow = false;   // the spine's gold hinge strip between the pages (reads as the gutter)
    // the pages: one canvas each, redrawn when the written count changes (a pure function of count)
    const mk = (s) => { const cv = document.createElement("canvas"); cv.width = Math.round(PW * PPM); cv.height = Math.round(PH * PPM); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return { cv, t, s }; };
    const pages = [mk(-1), mk(1)], keys = ["", ""];
    pages.forEach((p) => { const o = plane(PW, PH, overlay(p.t), book, p.s * 0.1375, 0.0705, 0, -Math.PI / 2); o.userData.solid = false; o.renderOrder = 3; });
    const yl = (k) => 0.05 + 0.032 * k;   // ruled line k (0..8), metres from the page top
    const flourish = (g, s, seed) => {   // a gold corner flourish at the outer bottom corner, drawn once per page
      const r = rng(seed), cx = s > 0 ? (PW - 0.03) * PPM : 0.03 * PPM, cy = (PH - 0.03) * PPM, d = s > 0 ? -1 : 1;
      g.strokeStyle = "#e8b93a"; g.lineWidth = 0.0035 * PPM; g.lineCap = "round";
      g.beginPath(); g.moveTo(cx, cy - 0.05 * PPM); g.bezierCurveTo(cx, cy, cx + d * 0.02 * PPM, cy, cx + d * 0.06 * PPM, cy); g.stroke();
      g.beginPath(); g.arc(cx + d * 0.014 * PPM, cy - 0.014 * PPM, (0.011 + 0.003 * r()) * PPM, 0, TAU * 0.78); g.stroke();
      g.beginPath(); g.moveTo(cx, cy - 0.05 * PPM); g.quadraticCurveTo(cx + d * 0.012 * PPM, cy - 0.05 * PPM, cx + d * 0.014 * PPM, cy - 0.038 * PPM); g.stroke();
      g.fillStyle = "#e8b93a"; g.beginPath(); g.arc(cx + d * 0.06 * PPM, cy, 0.0045 * PPM, 0, TAU); g.fill();
      const cy2 = 0.03 * PPM; g.beginPath(); g.moveTo(cx, cy2 + 0.035 * PPM); g.quadraticCurveTo(cx, cy2, cx + d * (0.035 + 0.01 * r()) * PPM, cy2); g.stroke();
    };
    const SMALL = [[0.040, 0.003, -0.012], [0.052, -0.004, 0.015], [0.036, 0.006, -0.008]];   // left page entries: x, y nudge, turn (rad), each its own
    const ENT = ["-10", "-30", "-60", "-1"], BIGX = [0.150, 0.142, 0.153, 0.160], BIGT = [-0.030, 0.022, -0.018, 0.012];
    const draw = (p, cnt) => {
      const g = p.cv.getContext("2d"), w = p.cv.width, h = p.cv.height;
      g.fillStyle = "#fbf6ea"; g.fillRect(0, 0, w, h);
      const sp = p.s > 0 ? 0 : w, gr = g.createLinearGradient(sp, 0, sp + (p.s > 0 ? 1 : -1) * 0.06 * PPM, 0); gr.addColorStop(0, "rgba(201,184,140,0.55)"); gr.addColorStop(1, "rgba(201,184,140,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = "#d9cfb8"; g.lineWidth = 0.0016 * PPM; for (let k = 0; k < LINES; k++) { g.beginPath(); g.moveTo(0.012 * PPM, yl(k) * PPM); g.lineTo(w - 0.012 * PPM, yl(k) * PPM); g.stroke(); }
      flourish(g, p.s, p.s > 0 ? 501 : 502);
      const ci = cnt > 0 ? Math.ceil(cnt - 1e-6) - 1 : -1, pc = clamp(cnt - ci);
      if (p.s > 0 && ci >= 0) { const wd = inkWidth(ENT[ci], 0.085); inkEntry(g, ENT[ci], (BIGX[ci] - wd / 2) * PPM, (yl(5) - 0.004) * PPM, 0.085, pc, PPM, BIGT[ci]); }
      if (p.s < 0) for (let j = 0; j < ci; j++) { const [x, dy, a] = SMALL[j]; inkEntry(g, ENT[j], x * PPM, (yl(2 + 2 * j) - 0.003 + dy) * PPM, 0.035, 1, PPM, a); }
      p.t.needsUpdate = true;
    };
    draw(pages[0], 0); draw(pages[1], 0);
    // the ribbon: out from under the book over the cap and the rim, then hanging 0.22 down the podium's front (untilted, in the prop's frame)
    const rt = box(0.04, 0.003, RIM - 0.13, ribbonM, P.whole, 0, 0.0016, (RIM + 0.13) / 2); rt.castShadow = false;
    box(0.04, 0.22, 0.004, ribbonM, P.whole, 0, -0.11, RIM + 0.002).castShadow = false;
    box(0.04, 0.012, 0.012, ribbonM, P.whole, 0, 0.003, RIM).castShadow = false;
    return {
      grip: 0,
      apply(ps) {
        const cnt = clamp(ps.count ?? S.count ?? 0, 0, 4), q = Math.round(cnt * 64);
        for (let i = 0; i < 2; i++) { const key = `${q}`; if (keys[i] !== key) { keys[i] = key; draw(pages[i], q / 64); } }
      },
    };
  },

  // ---- the rays ------------------------------------------------------------------------------------------------------------------------------------
  gaterays(P) {
    if (P.spec.glow === undefined) P.spec.glow = 1;   // propState starts glow at spec.glow ?? 0: make the default 1
    const PPM = 128, W = 6, H = 5, SX = 3.0, SY = 2.5 + 1.25;   // the source: the gate's centre (world y 0.95 when placed at y 2.2)
    const tex = canvasTex(W * PPM, H * PPM, (c, w, h) => {
      const sx = SX * PPM, sy = SY * PPM, r = rng(91);
      try { c.filter = "blur(2px)"; } catch (e) { /* no canvas filter */ }
      const a = [-82, -63, -46, -30, -13, 4, 21, 39, 61];   // 9 rays, none alike
      for (const ang of a) {
        const hw = 2.2 + 2.6 * r(), l = (3.6 + 2.2 * r()) * PPM, a0 = (ang - hw) * DEG, a1 = (ang + hw) * DEG;
        const gr = c.createRadialGradient(sx, sy, 0.25 * PPM, sx, sy, l); gr.addColorStop(0, "rgba(255,241,194,0.35)"); gr.addColorStop(1, "rgba(255,241,194,0)");
        c.fillStyle = gr; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + l * 1.1 * Math.sin(a0), sy - l * 1.1 * Math.cos(a0)); c.lineTo(sx + l * 1.1 * Math.sin(a1), sy - l * 1.1 * Math.cos(a1)); c.closePath(); c.fill();
      }
    });
    const m = glowMat(tex); const card = flat(plane(W, H, m, P.whole, 0, 0, 0)); card.renderOrder = 0;
    return { grip: 0, apply(ps) { m.opacity = clamp(ps.glow ?? 1); card.visible = m.opacity > 0.01; } };
  },
};

export const HTOP_GRIPS = {};
