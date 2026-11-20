import * as THREE from "three";
import { clamp } from "./util.js";

// Egypt myth 01 "Your heart vs. one feather" (storyboards/series/egypt-myth/01-heart/DESIGN.md section G): the SOUL, a built see-through
// figure (not a rig), crumbling from the feet to an ash pile. Metres, x right, y up, z toward the camera; a prop faces +z at rot 0.
// A pure function of spec, state and the clip time t: every mark is drawn once from its index and spec.seed; no random, no clock.
//
// ===== heartsoul   the stranger (also the 8 queue copies: spec.seed 1..8, spec.sway 0.02, spec.ash false)
//   ORIGIN: the floor between the feet. Body: an egg, narrower on top, 0.80 high x 0.66 wide x 0.58 deep (y 0.14..0.94) on two 0.14 legs
//   with small oval feet (0.94 standing), thin limbs 0.06 across, mitten hands, NO sprout. The whole figure is see-through (opacity 0.55)
//   with a cool edge #cfe6f0 at 0.85 (a fresnel rim in the shader, not an ink line: a transparent material has none), so the warm torch
//   behind it shows through. Body #e9e2d0, limbs #d9d2c0, 9 faint potato eyes (dimples) #d9d2c0 (never on the face), face ink #3a3a44:
//   eyes ovals 0.05 x 0.07, brows two short strokes, mouth a small worried line (scream 0) to an O 0.06 wide (scream 1).
//   WRAP: sheer linen #f7f4ea at 0.4 a layer: two layers wound round the body from y 0.10 to 0.62 (one rising to the left, one to the
//   right: they cross, and two layers read denser where they do) and a third band over one shoulder (the figure's RIGHT, x -0.3 at
//   rot 0) down the back to a loose end 0.25 long with a frayed end of 9 threads. 14 fold lines + 40 fine pleat lines #d9d4c4
//   (7 + 5 + 2 folds; 14 + 14 + 12 pleats), drawn once.
//   ASH PILE (grows with crumble, 1 = full): a low uneven cone r 0.34, h 0.11, 3 lobes, #8d8880, top flecks #b9b4aa (60), shade #55524d,
//   40 specks of 1-2.5 cm within r 0.6, a scrap of the wrap 0.08 lying on top (from crumble 0.92). It is built at the origin and stays.
//   spec  seed 0          0 = the design; 1.. varies shape, wrap winding and dimples by 6 % (the queue copies)
//         sway 0          metres of sideways sway at 0.5 Hz on t (the queue copies: 0.02); 0 = still
//         mirror false    true flips the reach side (the reaching arm becomes the figure's left, x +)
//         ash true        false builds no flakes, chips, dust or pile (a queue copy that never crumbles: far lighter)
//         reach 0, scream 0, crumble 0   the start of the state keys below
//   state (read ps.<key> ?? spec.<key> ?? default; none is a propState default, so seed each with a dur-0 set before the first tween:
//          c.prop(0, id, { reach: 0, scream: 0, crumble: 0 }, 0), or a later tween steps at its `at`)
//     reach 0..1 (0)     0 arms down, standing (the queue). 1 the whole figure leans 12 degrees toward +z (the pan: rot it to face the
//                        pan), the right hand up and forward (0.95 high, 0.5 ahead of the origin, 0.16 out), the left arm thrown back
//     scream 0..1 (0)    the eyes go wide, the brows rise, the mouth opens to an O
//     crumble 0..1 (0)   a front rises from the floor, height -0.05 + 1.15 x crumble; BELOW it nothing, above it the figure. The lower
//                        edge is a jagged saw of 2-4 cm chips (hanging 0.06 below the front) with 2-4 cm ash chips #8d8880 / #b9b4aa /
//                        #6e6a64 stuck on it. 140 flakes of 1-3 cm each come loose as the front passes (a function of crumble only),
//                        fall drifting 0.12 m out at most and land on the pile; 8 cel dust puffs #cfc9bd 0.15-0.35 m at the base from
//                        0.2 to 0.99. At 1 only the pile is left.
//   size  0.66 wide x 0.94 high (x 0.58 deep) standing; reach 1 about 1.0 wide, 1.05 high. Solid for the checks: the body, legs, arms;
//         flakes, chips, dust, pile and the scrap are not. HOLD POINTS: none (nobody holds a soul).
//   Cost: parts are rebuilt only while a crumble front crosses them (a body 17k vertices); a queue copy at ash:false is ~25k vertices.
export const HEART_SOUL_STATE = { heartsoul: { reach: 0, scream: 0, crumble: 0 } };

const rr = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const ss = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const DEG = Math.PI / 180, TAU = Math.PI * 2;
const V3 = THREE.Vector3;
const BY0 = 0.14, BH = 0.80, AX = 0.33, AZ = 0.29;   // the body: y 0.14..0.94, half width 0.33, half depth 0.29
const ASH = ["#8d8880", "#b9b4aa", "#6e6a64"];

function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const WHITE = (() => { const t = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); t.needsUpdate = true; t.colorSpace = THREE.SRGBColorSpace; return t; })();

// the see-through skin: a flat-shaded ghost with a cool fresnel rim. ShaderMaterial, so the look pass leaves it alone (no ink hull).
function ghostMat({ color, map = WHITE, op = 0.55, rimOp = 0.85, rimPow = 2.4, backK = 0.45 }) {
  const m = new THREE.ShaderMaterial({
    uniforms: { map: { value: map }, base: { value: new THREE.Color(color) }, rimC: { value: new THREE.Color("#cfe6f0") }, op: { value: op }, rimOp: { value: rimOp }, rimPow: { value: rimPow }, backK: { value: backK } },
    vertexShader: "varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }",
    fragmentShader: "uniform sampler2D map; uniform vec3 base; uniform vec3 rimC; uniform float op; uniform float rimOp; uniform float rimPow; uniform float backK; varying vec2 vUv; varying vec3 vN; varying vec3 vV;\n"
      + "void main(){ vec3 n = normalize(vN); bool fr = gl_FrontFacing; if (!fr) n = -n; float nv = abs(dot(n, normalize(vV))); float rim = pow(1.0 - nv, rimPow);\n"
      + " vec4 t = texture2D(map, vUv); float sh = 0.84 + 0.16 * clamp(dot(n, normalize(vec3(-0.35, 0.8, 0.55))), -1.0, 1.0);\n"
      + " vec3 col = mix(base * t.rgb * sh, rimC, rim); float a = mix(op, rimOp, rim) * t.a * (fr ? 1.0 : backK); gl_FragColor = vec4(col, a);\n#include <colorspace_fragment>\n}",
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  m.userData.noOutline = true; m.userData.noHatch = true; m.userData.outlineParameters = { visible: false };
  return m;
}
const inkMat = (color, o = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.95, ...o }); m.userData.lineColor = "#3a3733"; m.userData.noHatch = true; return m; };
const flatMat = (o) => { const m = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, ...o }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; return m; };
const steamy = (o, order = 5) => { o.castShadow = false; o.receiveShadow = false; o.renderOrder = order; o.userData.steam = true; o.userData.solid = false; o.frustumCulled = false; return o; };

// ---- a clippable grid part: a (NU+1) x (NV+1) surface from fn(i, j); cut(front) raises the saw-toothed floor y' = max(y, front + J(i))
function makePart({ NU, NV, teeth, seed, closed = true, fn, uvf }) {
  const n = (NU + 1) * (NV + 1), base = new Float32Array(n * 3), pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), J = new Float32Array(NU + 1);
  let minY = 1e9, maxY = -1e9;
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const k = j * (NU + 1) + i, p = fn(i, j, i / NU, j / NV), q = uvf ? uvf(i / NU, j / NV) : [i / NU, j / NV];
    base.set(p, k * 3); uv[k * 2] = q[0]; uv[k * 2 + 1] = q[1]; minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
  }
  for (let i = 0; i <= NU; i++) {   // the saw: `teeth` chips round the part, each a steep fin 0.4-1 x 0.06 high
    const u = (i / NU) * teeth, tI = Math.floor(u + 1e-9) % teeth, fr = i === NU ? 0 : u - Math.floor(u + 1e-9);
    J[i] = 0.06 * (0.4 + 0.6 * rr(seed * 5.3 + tI * 1.7)) * Math.pow(1 - fr, 0.9);
  }
  const idx = [];
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const orient = () => {   // wind the closed shapes outward (signed volume against the centroid)
    if (!closed) return;
    let cx = 0, cy = 0, cz = 0; for (let k = 0; k < n; k++) { cx += base[k * 3]; cy += base[k * 3 + 1]; cz += base[k * 3 + 2]; } cx /= n; cy /= n; cz /= n;
    let vol = 0; for (let t = 0; t < idx.length; t += 3) {
      const A = idx[t] * 3, B = idx[t + 1] * 3, C = idx[t + 2] * 3;
      const ax = base[A] - cx, ay = base[A + 1] - cy, az = base[A + 2] - cz, bx = base[B] - cx, by = base[B + 1] - cy, bz = base[B + 2] - cz, qx = base[C] - cx, qy = base[C + 1] - cy, qz = base[C + 2] - cz;
      vol += ax * (by * qz - bz * qy) + ay * (bz * qx - bx * qz) + az * (bx * qy - by * qx);
    }
    if (vol < 0) for (let t = 0; t < idx.length; t += 3) { const s = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = s; geo.index.array[t + 1] = idx[t + 1]; geo.index.array[t + 2] = idx[t + 2]; }
    geo.index.needsUpdate = true;
  };
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
  orient(); pos.set(base); geo.computeVertexNormals(); geo.boundingSphere = new THREE.Sphere(new V3(0, 0.5, 0.2), 2);
  const cpt = Math.max(1, Math.round(NU / teeth));
  const P = { geo, NU, NV, minY, maxY, mode: -1, key: "", anchors: [], maxAnchors: 6,
    // returns the part's state (0 gone, 1 whole, 2 cut) and fills P.anchors with points on the cut ring (kept while the front stays put)
    cut(front) {
      if (front - 0.06 >= P.maxY - 1e-4) { P.mode = 0; P.anchors.length = 0; return 0; }
      if (front <= P.minY) { if (P.mode !== 1) { pos.set(base); geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); } P.mode = 1; P.anchors.length = 0; return 1; }
      const f = Math.round(front * 4000) / 4000, key = String(f);
      if (P.mode === 2 && P.key === key) return 2;
      P.mode = 2; P.key = key; P.anchors.length = 0;
      for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const k = (j * (NU + 1) + i) * 3, fy = f - J[i]; pos[k] = base[k]; pos[k + 2] = base[k + 2]; pos[k + 1] = base[k + 1] < fy ? fy : base[k + 1]; }
      const stride = Math.max(1, Math.round(teeth / P.maxAnchors));
      for (let tt = 0; tt < teeth; tt += stride) {
        const i = tt * cpt; if (i >= NU) break;
        for (let j = 0; j < NV; j++) { const k = (j * (NU + 1) + i) * 3, k2 = ((j + 1) * (NU + 1) + i) * 3, fy = f - J[i]; if (base[k + 1] < fy && base[k2 + 1] >= fy) { P.anchors.push([pos[k], pos[k + 1], pos[k + 2]]); break; } }
      }
      geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); return 2;
    },
    reset(fn2) {
      let a = 1e9, b = -1e9;
      for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const p = fn2(i, j, i / NU, j / NV); base.set(p, (j * (NU + 1) + i) * 3); a = Math.min(a, p[1]); b = Math.max(b, p[1]); }
      P.minY = a; P.maxY = b; P.mode = -1; orient();
    },
  };
  return P;
}

// ---- the figure's shapes
// an egg: an ellipse skewed so the widest part sits low (k 0.14) and the top is narrower and still round
const eggR = (t, k = 0.14) => { const q = 2 * t - 1; return t <= 0 || t >= 1 ? 0 : (Math.sqrt(1 - q * q) * (1 - k * q)) / Math.sqrt(1 + k * k); };
// a tube through points with a rounded end at each side; radius r(v)
function tubeFn(pts, rA, rB, NV) {
  const cu = new THREE.CatmullRomCurve3(pts, false, "centripetal"), rows = [];
  const mean = cu.getTangentAt(0.5), ref = Math.abs(mean.y) > 0.8 ? new V3(0, 0, 1) : new V3(0, 1, 0);
  for (let j = 0; j <= NV; j++) { const v = j / NV, T = cu.getTangentAt(v), s = new V3().crossVectors(ref, T).normalize(), nr = new V3().crossVectors(T, s); rows.push({ p: cu.getPointAt(v), s, n: nr }); }
  return (i, j, u, v) => {
    const o = rows[j], th = u * TAU, e = Math.sqrt(clamp(Math.min(v, 1 - v) / 0.05)), r = (rA + (rB - rA) * v) * e;
    return [o.p.x + r * (o.s.x * Math.cos(th) + o.n.x * Math.sin(th)), o.p.y + r * (o.s.y * Math.cos(th) + o.n.y * Math.sin(th)), o.p.z + r * (o.s.z * Math.cos(th) + o.n.z * Math.sin(th))];
  };
}
// an ellipsoid at c, long axis d (a), side radius b, thickness c2, `up` picks the side
function ellFn(c, d, up, a, b, c2) {
  const dn = d.clone().normalize(), sd = new V3().crossVectors(up, dn).normalize(), nr = new V3().crossVectors(dn, sd);
  return (i, j, u, v) => { const th = u * TAU, ph = v * Math.PI, sp = Math.sin(ph); return [c.x + dn.x * a * Math.cos(ph) + sd.x * b * sp * Math.cos(th) + nr.x * c2 * sp * Math.sin(th), c.y + dn.y * a * Math.cos(ph) + sd.y * b * sp * Math.cos(th) + nr.y * c2 * sp * Math.sin(th), c.z + dn.z * a * Math.cos(ph) + sd.z * b * sp * Math.cos(th) + nr.z * c2 * sp * Math.sin(th)]; };
}
function ik(S, H, pole, L1, L2) {
  const d = H.clone().sub(S), dist = Math.min(d.length(), L1 + L2 - 1e-3), dn = d.normalize(), a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(L1 * L1 - a * a, 0));
  const pp = pole.clone().addScaledVector(dn, -pole.dot(dn)).normalize();
  return S.clone().addScaledVector(dn, a).addScaledVector(pp, h);
}

// ---- the face canvas (redrawn when scream changes; one pure function of scream)
function drawFace(g, w, h, sc, TH, Y0, Y1) {
  g.clearRect(0, 0, w, h);
  const X = (th) => ((th + TH) / (2 * TH)) * w, Y = (y) => (1 - (y - Y0) / (Y1 - Y0)) * h, SX = w / (2 * TH) / 0.255, SY = h / (Y1 - Y0);   // px per metre across (arc ~ 0.255 m/rad) and up
  const INK = "#3a3a44", at = (x) => Math.asin(Math.max(-0.99, Math.min(0.99, x / 0.255)));
  g.fillStyle = INK; g.strokeStyle = INK; g.lineCap = "round";
  const ey = 0.690 + 0.006 * sc, rx = 0.025 * (1 + 0.22 * sc), ry = 0.035 * (1 + 0.38 * sc);
  for (const s of [-1, 1]) {
    const cx = X(at(s * 0.085));
    g.beginPath(); g.ellipse(cx, Y(ey), rx * SX, ry * SY, 0, 0, TAU); g.fill();
    g.fillStyle = "#f4f6f8"; g.beginPath(); g.ellipse(cx + s * rx * SX * 0.28, Y(ey + ry * 0.38), rx * SX * 0.3, ry * SY * 0.26, 0, 0, TAU); g.fill(); g.fillStyle = INK;   // a glint, upper side
    // brows: two short strokes, lifted and tilted up toward the middle as the scream grows
    const by = ey + ry + 0.024 + 0.022 * sc, bx = s * 0.085, tl = (0.05 + 0.03 * sc) * 0.5;
    g.lineWidth = 0.0055 * SX + 1.5; g.beginPath(); g.moveTo(X(at(bx - s * tl)), Y(by + 0.008 + 0.014 * sc)); g.lineTo(X(at(bx + s * tl)), Y(by - 0.006 + 0.002 * sc)); g.stroke();
  }
  // the mouth: a small worried line (0) opening to an O 0.06 wide and 0.07 high (1)
  const my = 0.575, mx = X(0);
  if (sc < 0.12) { g.lineWidth = 0.006 * SX + 1.5; g.beginPath(); g.moveTo(mx - 0.016 * SX, Y(my - 0.004)); g.quadraticCurveTo(mx, Y(my + 0.006), mx + 0.016 * SX, Y(my - 0.004)); g.stroke(); }
  else { const k = ss((sc - 0.12) / 0.88); g.beginPath(); g.ellipse(mx, Y(my), (0.012 + 0.018 * k) * SX, (0.005 + 0.032 * k) * SY, 0, 0, TAU); g.fill(); g.fillStyle = "#7a5a62"; g.beginPath(); g.ellipse(mx, Y(my - 0.012 * k), (0.008 + 0.011 * k) * SX, 0.010 * k * SY, 0, 0, TAU); g.fill(); g.fillStyle = INK; }
}

// ---- the wrap strips' canvases: base colour is the material's (#f7f4ea); folds and pleats drawn as #dcdbd6 (= #d9d4c4 over the base)
function wrapTex(w, h, nFold, nPleat, seed) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h); g.lineCap = "round";
    const line = (v, lw, col, k) => {
      g.strokeStyle = col; g.lineWidth = lw; g.beginPath();
      const a1 = 1.5 + 2 * rr(k + 1), a2 = 0.6 + 1.2 * rr(k + 2), f1 = 2 + 3 * rr(k + 3), f2 = 5 + 6 * rr(k + 4), p1 = TAU * rr(k + 5), p2 = TAU * rr(k + 6);
      for (let x = 0; x <= w; x += 8) { const y = v * h + a1 * Math.sin((x / w) * TAU * f1 + p1) + a2 * Math.sin((x / w) * TAU * f2 + p2); g[x ? "lineTo" : "moveTo"](x, y); }
      g.stroke();
    };
    for (let k = 0; k < nFold; k++) line((k + 0.5 + (rr(seed + k) - 0.5) * 0.5) / nFold, 3.6, "#dad8d1", seed * 10 + k);   // 14 folds in all
    for (let k = 0; k < nPleat; k++) line((k + 0.3 + rr(seed + k * 2.3) * 0.4) / nPleat, 1.4, "#e2e1dc", seed * 20 + k + 50);   // 40 pleats in all
  });
}

// ---- the ash pile
const PILE_PHI = 0.7;
const pileR = (th) => 0.34 * (0.88 + 0.12 * Math.cos(3 * (th - PILE_PHI)) + 0.05 * Math.cos(5 * th + 1.1));
const lobe = (th) => { let m = 0; for (let k = 0; k < 3; k++) { let d = Math.atan2(Math.sin(th - PILE_PHI - (k * TAU) / 3), Math.cos(th - PILE_PHI - (k * TAU) / 3)); m = Math.max(m, Math.exp(-(d / 0.5) * (d / 0.5))); } return m; };
const pileH = (rho, th) => rho >= 1 ? 0 : 0.11 * Math.pow(1 - rho * rho, 1.25) * (1 - 0.28 * rho * (1 - lobe(th))) * (1 + 0.06 * Math.sin(th * 7 + rho * 9));

function pileGeo() {
  const NU = 96, NV = 22, pos = [], col = [], idx = [], c = new THREE.Color(), cB = new THREE.Color(ASH[0]), cL = new THREE.Color(ASH[1]), cS = new THREE.Color("#55524d");
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const th = (i / NU) * TAU, rho = (j / NV) ** 0.9, h = pileH(rho, th) * (1 + 0.04 * Math.sin(th * 13 + j)), r = rho * pileR(th);
    pos.push(r * Math.sin(th), h, r * Math.cos(th));
    const n = rr(i * 7.13 + j * 3.71), vall = (1 - lobe(th)) * ss((rho - 0.3) / 0.4);
    c.copy(cB); if (rho < 0.62 && n > 0.78) c.copy(cL); if (rho > 0.82 || vall > 0.6 || (rho > 0.55 && n < 0.16)) c.copy(cS); col.push(c.r, c.g, c.b);
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, cc = a + NU + 1, d = cc + 1; idx.push(a, cc, b, b, cc, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

// ---- dust puff: a cel cloud, flat light, one shade tone, a thin ink edge
function puffTex() {
  return canvasTex(128, 128, (g) => {
    const bl = [[0.50, 0.58, 0.30], [0.30, 0.62, 0.20], [0.70, 0.62, 0.21], [0.42, 0.42, 0.20], [0.62, 0.43, 0.18], [0.5, 0.72, 0.17]];
    const draw = (dx, dy, fill, grow) => { g.fillStyle = fill; g.beginPath(); for (const [x, y, r] of bl) { g.moveTo(128 * (x + dx) + 128 * (r + grow), 128 * (y + dy)); g.arc(128 * (x + dx), 128 * (y + dy), 128 * (r + grow), 0, TAU); } g.fill(); };
    draw(0, 0, "#6d675b", 0.022); draw(0, 0, "#a9a395", 0); draw(-0.018, -0.03, "#cfc9bd", -0.01); draw(-0.04, -0.07, "#e4dfd4", -0.07);
  });
}

// ===================================================================================================================================
export const HEART_SOUL_KINDS = {
  heartsoul(P) {
    const S = P.spec, seed = S.seed ?? 0, V = (k, a = 0.06) => (seed ? 1 + a * (rr(seed * 11.7 + k * 3.3) * 2 - 1) : 1), mir = S.mirror ? -1 : 1, withAsh = S.ash !== false;
    const sx = V(1), sy = V(2), sz = V(3), kE = seed ? 0.14 + 0.035 * (rr(seed * 4.4) * 2 - 1) : 0.14;
    const root = new THREE.Group(); P.whole.add(root);
    const lean = new THREE.Group(); root.add(lean);   // leans about the feet (origin)
    const shell = []; const addShell = (part, mat, order, solid = true) => { const m = new THREE.Mesh(part.geo, mat); m.renderOrder = order; m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; m.userData.solid = solid; lean.add(m); shell.push({ part, m }); return m; };
    const bodyY = (t) => BY0 + BH * sy * t;
    const surf = (th, y, off = 0) => { const t = clamp((y - BY0) / (BH * sy)), R = eggR(t, kE), a = AX * sx * R + off, b = AZ * sz * R + off; return new V3(a * Math.sin(th), y, b * Math.cos(th)); };

    // ---- body: an egg with the dimples painted once
    const dim = [];
    for (let k = 0; dim.length < 9 && k < 80; k++) {   // 9 dimples, never on the face
      const th = TAU * rr(seed * 9.1 + k * 2.17 + 0.3), y = 0.24 + 0.62 * rr(seed * 5.7 + k * 3.91 + 1.1), wrapA = Math.atan2(Math.sin(th), Math.cos(th));
      if (Math.abs(wrapA) < 0.8 && y > 0.44 && y < 0.88) continue;
      if (dim.some(([t2, y2]) => Math.hypot(Math.sin(th) - Math.sin(t2), Math.cos(th) - Math.cos(t2)) < 0.3 && Math.abs(y - y2) < 0.12)) continue;
      dim.push([th, y, 0.016 + 0.014 * rr(k * 1.9 + seed), 0.011 + 0.010 * rr(k * 2.7 + seed)]);
    }
    const bodyTex = canvasTex(1024, 512, (g, w, h) => {
      g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h);
      for (const [th, y, a, b] of dim) {
        const x = ((th / TAU) % 1 + 1) % 1 * w, py = (1 - (y - BY0) / (BH * sy)) * h, sxp = w / (TAU * 0.28), syp = h / (BH * sy);
        for (const xx of [x, x - w, x + w]) {
          g.fillStyle = "#ececeb"; g.beginPath(); g.ellipse(xx, py, a * sxp, b * syp, 0, 0, TAU); g.fill();   // #d9d2c0 over the body colour
          g.strokeStyle = "#dedcd6"; g.lineWidth = 2.2; g.beginPath(); g.ellipse(xx, py, a * sxp, b * syp, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
          g.strokeStyle = "#ffffff"; g.lineWidth = 1.6; g.beginPath(); g.ellipse(xx, py, a * sxp * 0.92, b * syp * 0.9, 0, Math.PI * 0.1, Math.PI * 0.85); g.stroke();
        }
      }
    });
    const bodyM = ghostMat({ color: "#e9e2d0", map: bodyTex }), limbM = ghostMat({ color: "#d9d2c0" });
    const body = makePart({ NU: 224, NV: 72, teeth: 56, seed: seed + 1, fn: (i, j, u, v) => { const t = 0.5 - 0.5 * Math.cos(v * Math.PI), p = surf(u * TAU, BY0 + BH * sy * t); return [p.x, p.y, p.z]; }, uvf: (u, v) => [u, 0.5 - 0.5 * Math.cos(v * Math.PI)] });
    body.maxAnchors = 40; addShell(body, bodyM, 2);

    // ---- legs, feet
    const legs = [];
    for (const s of [-1, 1]) {
      const leg = makePart({ NU: 24, NV: 14, teeth: 7, seed: 20 + s, fn: tubeFn([new V3(s * 0.12, 0.20, 0), new V3(s * 0.12, 0.09, 0.004), new V3(s * 0.12, 0.035, 0.012)], 0.036, 0.03, 14) });
      const foot = makePart({ NU: 24, NV: 14, teeth: 8, seed: 30 + s, fn: ellFn(new V3(s * 0.12, 0.034, 0.045), new V3(0, 0, 1), new V3(0, 1, 0), 0.078, 0.05, 0.034) });
      for (const p of [leg, foot]) p.maxAnchors = 5; addShell(leg, limbM, 2); addShell(foot, limbM, 2); legs.push(leg, foot);
    }

    // ---- arms (rebuilt when reach changes): shoulder, elbow, wrist by two-bone IK, mitten and thumb
    const arms = [];
    for (const side of ["R", "L"]) {
      const sg = (side === "R" ? -1 : 1) * mir;   // x side of this arm
      const arm = makePart({ NU: 24, NV: 24, teeth: 7, seed: 40 + sg, fn: () => [0, 0, 0] }), hand = makePart({ NU: 20, NV: 12, teeth: 6, seed: 50 + sg, fn: () => [0, 0, 0] }), thumb = makePart({ NU: 12, NV: 8, teeth: 4, seed: 60 + sg, fn: () => [0, 0, 0] });
      for (const p of [arm, hand, thumb]) p.maxAnchors = 5; addShell(arm, limbM, 2); addShell(hand, limbM, 2); addShell(thumb, limbM, 2);
      arms.push({ side, sg, arm, hand, thumb, key: "" });
    }
    const setArms = (reach, leanDeg) => {
      const e = ss(reach), a = leanDeg * DEG, ca = Math.cos(a), sa = Math.sin(a);
      for (const A of arms) {
        const S0 = new V3(A.sg * 0.255, 0.60, 0), isR = A.side === "R";
        const Hdown = S0.clone().add(new V3(A.sg * 0.095, -0.335, 0.05));
        // world targets -> lean frame (inverse of the lean about x)
        const toLean = (x, y, z) => new V3(x, y * ca + z * sa, -y * sa + z * ca);
        const Hup = isR ? toLean(A.sg * 0.16, 0.95, 0.5) : toLean(A.sg * 0.5, 0.85, -0.25);
        const H = Hdown.clone().lerp(Hup, e), poleD = new V3(A.sg * 0.8, -0.5, -0.2), poleU = isR ? new V3(A.sg * 0.8, -0.6, -0.1) : new V3(A.sg * 0.6, 0.5, -0.3);
        const E = ik(S0, H, poleD.clone().lerp(poleU, e), 0.30, 0.30), d = H.clone().sub(E).normalize();
        const up = Math.abs(d.y) > 0.85 ? new V3(0, 0, 1) : new V3(0, 1, 0);
        A.arm.reset(tubeFn([S0, E, H], 0.030, 0.024, 24));
        const hc = H.clone().addScaledVector(d, 0.036), inner = new V3(-A.sg, 0, 0.35).normalize();
        A.hand.reset(ellFn(hc, d, up, 0.052, 0.034, 0.024));
        const td = d.clone().multiplyScalar(0.8).addScaledVector(inner, 0.7).normalize();
        A.thumb.reset(ellFn(H.clone().addScaledVector(d, 0.022).addScaledVector(inner, 0.03), td, up, 0.026, 0.013, 0.012));
      }
    };

    // ---- face: a patch of the body surface with the canvas on it
    const FTH = 0.62, FY0 = 0.45, FY1 = 0.85;
    const faceCv = document.createElement("canvas"); faceCv.width = 512; faceCv.height = 512; const faceTex = new THREE.CanvasTexture(faceCv); faceTex.colorSpace = THREE.SRGBColorSpace; faceTex.anisotropy = 8;
    const faceM = ghostMat({ color: "#ffffff", map: faceTex, op: 0.92, rimOp: 0.92, rimPow: 6 });
    const face = makePart({ NU: 40, NV: 24, teeth: 1, seed: 70, closed: false, fn: (i, j, u, v) => { const p = surf((u - 0.5) * 2 * FTH, FY0 + (FY1 - FY0) * v, 0.003); return [p.x, p.y, p.z]; } });
    addShell(face, faceM, 4, false); let faceKey = -1;
    const redrawFace = (sc) => { const k = Math.round(sc * 40); if (k === faceKey) return; faceKey = k; drawFace(faceCv.getContext("2d"), 512, 512, k / 40, FTH, FY0, FY1); faceTex.needsUpdate = true; };

    // ---- the wrap: two crossing layers and a shoulder band, each a strip on the body surface
    const wrapM = [0, 1, 2].map((k) => ghostMat({ color: "#f7f4ea", map: wrapTex(k < 2 ? 1024 : 768, 128, [7, 5, 2][k], [14, 14, 12][k], k + seed * 3), op: 0.4, rimOp: 0.55, rimPow: 3, backK: 0.7 }));
    const layer = (k, dir, th0, turns, yA, yB, hw, off) => makePart({ NU: 240, NV: 10, teeth: 18, seed: 80 + k, closed: false, fn: (i, j, u, v) => {
      const th = th0 * V(k + 5) + dir * turns * TAU * u, yc = yA + (yB - yA) * u, p = surf(th, yc + (v - 0.5) * 2 * hw, off); return [p.x, p.y, p.z]; } });
    const wr1 = layer(1, 1, 0.5, 1.30, 0.245, 0.480, 0.145, 0.011), wr2 = layer(2, -1, -0.4, 1.20, 0.250, 0.470, 0.145, 0.019);
    addShell(wr1, wrapM[0], 3, false); addShell(wr2, wrapM[1], 3, false);
    // the shoulder band: a path in (angle, height, lift), over the right shoulder (x -) and down the back to the loose end
    const bpath = new THREE.CatmullRomCurve3([[1.0, 0.18, 0.027], [0.62, 0.34, 0.027], [0.15, 0.50, 0.028], [-0.45, 0.66, 0.029], [-1.1, 0.79, 0.030], [-1.85, 0.78, 0.032], [-2.6, 0.64, 0.038], [-3.05, 0.47, 0.060], [-3.14, 0.36, 0.095], [-3.2, 0.25, 0.120]].map(([a, y, o]) => new V3(a * mir, y, o)), false, "centripetal");
    const bandPt = (u, w) => {   // the band's edge at u, w -1..1: moved across the surface (in angle and height), so it stays on the egg
      const q = bpath.getPointAt(u), q2 = bpath.getPointAt(Math.min(1, u + 0.01)), q0 = bpath.getPointAt(Math.max(0, u - 0.01));
      const f = (c) => surf(c.x, c.y, c.z), T = f(q2).sub(f(q0)).normalize();
      const eT = surf(q.x + 0.01, q.y, q.z).sub(surf(q.x - 0.01, q.y, q.z)).multiplyScalar(50), eY = surf(q.x, q.y + 0.01, q.z).sub(surf(q.x, q.y - 0.01, q.z)).multiplyScalar(50);
      const N = new V3().crossVectors(eT, eY).normalize(), W = new V3().crossVectors(N, T).normalize();
      const a11 = eT.dot(eT), a12 = eT.dot(eY), a22 = eY.dot(eY), b1 = W.dot(eT), b2 = W.dot(eY), det = a11 * a22 - a12 * a12 || 1e-9;
      const al = (b1 * a22 - b2 * a12) / det, be = (a11 * b2 - a12 * b1) / det, d = w * (0.085 - 0.012 * ss((u - 0.8) / 0.2));
      return surf(q.x + al * d, q.y + be * d, q.z);
    };
    let sway = 0;
    const band = makePart({ NU: 200, NV: 8, teeth: 12, seed: 90, closed: false, fn: (i, j, u, v) => { const p = bandPt(u, (v - 0.5) * 2); return [p.x, p.y, p.z]; } });
    addShell(band, wrapM[2], 3, false);
    // the frayed end: 9 threads, each a thin tapering strip hanging off the band's last edge
    const threads = [];
    for (let k = 0; k < 9; k++) {
      const w = -0.9 + (1.8 * k) / 8, len = 0.025 + 0.03 * rr(seed + k * 1.7 + 4), tp = makePart({ NU: 2, NV: 6, teeth: 1, seed: 100 + k, closed: false, fn: (i, j, u, v) => {
        const e = bandPt(1, w), wob = 0.006 * Math.sin(v * 5 + k * 1.3), tw = (1 - 0.7 * v) * 0.0028 * (i - 1); return [e.x + wob + tw, e.y - v * len, e.z + 0.004 * Math.sin(v * 4 + k)]; } });
      addShell(tp, wrapM[2], 3, false); threads.push(tp);
    }

    // ---- ash: chips on the cut, flakes, dust, pile, specks, scrap (all built only when spec.ash is not false)
    let flakes, chips, specks, flecks, pile, scrap, puffs = [];
    const FL = 140, CH = 80, SP = 40, FK = 60, dummy = new THREE.Object3D(), col = new THREE.Color();
    const inst = (n, rad) => { const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), inkMat("#ffffff"), n); im.castShadow = false; im.receiveShadow = false; im.frustumCulled = false; im.userData.solid = false; im.userData.steam = true; im.renderOrder = 1; for (let i = 0; i < n; i++) { col.set(ASH[Math.floor(rr(i * 3.1 + rad) * 3) % 3]); im.setColorAt(i, col); } im.instanceColor.needsUpdate = true; return im; };
    const FD = [];   // per flake: height, angle, scale, release, land time, drift, spin
    if (withAsh) {
      flakes = inst(FL, 1); chips = inst(CH, 2); specks = inst(SP, 3); flecks = inst(FK, 4); P.whole.add(flakes, specks, flecks); lean.add(chips);   // the chips ride the figure, the rest is in the world
      for (let i = 0; i < FL; i++) {
        const y = 0.035 + 0.9 * ((i + 0.15 + 0.7 * rr(i * 1.31 + 7)) / FL), c0 = (y + 0.05) / 1.15, tf = Math.min(0.13 + 0.10 * Math.sqrt(y), 1 - c0);
        FD.push({ y, th: i * 2.39996 + rr(i) * 0.4, sc: 0.006 + 0.009 * rr(i * 2.3 + 1), c0, tf, dr: 0.12 * (0.35 + 0.65 * rr(i * 3.7 + 2)), sp: 4 + 6 * rr(i * 4.1), leg: y < 0.12 ? (i % 2 ? 1 : -1) : 0 });
      }
      pile = new THREE.Mesh(pileGeo(), inkMat("#ffffff", { vertexColors: true })); pile.castShadow = false; pile.receiveShadow = true; pile.userData.solid = false; pile.userData.steam = true; pile.visible = false; P.whole.add(pile);
      scrap = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.05, 8, 5), new THREE.MeshStandardMaterial({ color: "#f7f4ea", roughness: 0.9, side: THREE.DoubleSide })); scrap.userData.solid = false; scrap.userData.steam = true; scrap.castShadow = false; scrap.visible = false; scrap.userData.lineColor = "#a8a495";
      { const p = scrap.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.006 * Math.sin(p.getX(i) * 140) + 0.004 * Math.sin(p.getY(i) * 190 + 1)); scrap.geometry.computeVertexNormals(); } P.whole.add(scrap);
      const pt = puffTex(), sizes = [0.22, 0.30, 0.18, 0.35, 0.26, 0.15, 0.32, 0.24];
      for (let i = 0; i < 8; i++) { const m = new THREE.SpriteMaterial({ map: pt, transparent: true, depthWrite: false, opacity: 0, fog: false, rotation: (i * 1.3) % TAU }); m.userData.noOutline = true; const o = steamy(new THREE.Sprite(m), 6); o.visible = false; P.whole.add(o); puffs.push({ o, size: sizes[i], a: 0.8 + i * 0.7854, b: 0.2 + i * 0.07, r: 0.17 + 0.1 * rr(i * 2.2) }); }
    }
    const pileAt = (x, z, kR, kH) => { const r = Math.hypot(x, z) / kR; if (r >= 1.2) return 0; const th = Math.atan2(x, z), rho = r / pileR(th); return pileH(rho, th) * kH; };
    // an instance at (x,y,z) with a radius; a zero-size one is parked under the floor (its ink hull would still draw a dot)
    const put = (im, i, x, y, z, r0, r1, r2, ex, ey, ez) => { if (r0 <= 1e-4) { dummy.position.set(0, -9, 0); dummy.scale.setScalar(1e-4); } else { dummy.position.set(x, y, z); dummy.scale.set(r0, r1, r2); } dummy.rotation.set(ex, ey, ez); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); };
    const setPose = (reach, scream, crumble, t) => {
      const lk = `${Math.round(reach * 400)}`;
      if (lk !== arms[0].key) { arms[0].key = lk; setArms(reach, 12 * ss(reach)); }
      lean.rotation.x = 12 * DEG * ss(reach);
      lean.position.x = (S.sway ?? 0) * Math.sin(TAU * 0.5 * t + (seed || 0) * 1.7); root.rotation.z = -(S.sway ?? 0) * 0.12 * Math.sin(TAU * 0.5 * t + (seed || 0) * 1.7);
      redrawFace(scream);
      const front = -0.05 + 1.15 * crumble, anchors = [];
      for (const { part, m } of shell) {
        const st = part.cut(front);
        m.visible = st > 0; if (st === 2) for (const a of part.anchors) anchors.push(a);
      }
      if (!withAsh) return;
      for (const im of [flakes, specks, flecks]) im.visible = crumble > 1e-4; chips.visible = crumble > 1e-4;
      // pile
      const pk = ss((crumble - 0.02) / 0.93), kR = 0.55 + 0.45 * pk, kH = pk;
      pile.visible = crumble > 0.02; pile.scale.set(kR, Math.max(kH, 0.001), kR);
      // chips on the cut
      let n = 0;
      for (const a of anchors) { if (n >= CH) break; const s = 0.010 + 0.010 * rr(n * 5.1 + 3); put(chips, n, a[0], a[1] - 0.004, a[2], s, s * 0.55, s * 0.8, rr(n) * 6, rr(n + 9) * 6, rr(n + 4) * 6); n++; }
      for (let q = n; q < CH; q++) put(chips, q, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      chips.instanceMatrix.needsUpdate = true;
      // flakes: still, loosening, falling, landed
      for (let i = 0; i < FL; i++) {
        const f = FD[i], t0 = f.c0, tl = f.c0 + f.tf; let vis = 1, x, y, z, sc = f.sc, rx = 0;
        const bt = clamp((f.y - BY0) / BH), Rb = eggR(bt, kE), rad = f.leg ? 0.035 : AX * sx * Rb * 0.98, rz2 = f.leg ? 0.035 : AZ * sz * Rb * 0.98;
        const lx0 = (f.leg ? f.leg * 0.12 : 0) + rad * Math.sin(f.th), lz0 = rz2 * Math.cos(f.th), la = lean.rotation.x, wy = f.y * Math.cos(la) - lz0 * Math.sin(la);
        const sx0 = lx0 + lean.position.x, sz0 = f.y * Math.sin(la) + lz0 * Math.cos(la), sy0 = wy;
        if (crumble < t0 - 0.07) vis = 0;
        else if (crumble < t0) { const k = ss((crumble - (t0 - 0.07)) / 0.07); x = sx0 + 0.002 * Math.sin(i * 9 + crumble * 300); y = sy0; z = sz0; sc *= k; }
        else if (crumble < tl) {
          const s = (crumble - t0) / f.tf, lx = (sx0 * (1 - 0.35 * s) + Math.sin(f.th) * f.dr * s * (1 - 0.4 * s)), lz = (sz0 * (1 - 0.35 * s) + Math.cos(f.th) * f.dr * s * (1 - 0.4 * s));
          const yl = pileAt(lx, lz, kR, kH) + 0.004;
          x = lx; z = lz; y = sy0 - (sy0 - yl) * s * s; rx = s * f.sp;
        } else { const lx = sx0 * 0.65 + Math.sin(f.th) * f.dr * 0.6, lz = sz0 * 0.65 + Math.cos(f.th) * f.dr * 0.6; x = lx; z = lz; y = pileAt(lx, lz, kR, kH) + 0.004; rx = f.sp; }
        put(flakes, i, x, y, z, vis ? sc : 0, sc * 0.6, sc * 0.85, rx + i, rx * 0.7 + i * 0.5, i * 1.3);
      }
      flakes.instanceMatrix.needsUpdate = true;
      // specks (40 within r 0.6) and top flecks (60 on the pile)
      for (let i = 0; i < SP; i++) {
        const r = 0.12 + 0.48 * Math.sqrt(rr(i * 2.7 + 5)), th = i * 2.39996 + 0.5, land = 0.2 + 0.78 * rr(i * 1.9 + 3), k = ss((crumble - land) / 0.04), s = (0.005 + 0.0075 * rr(i * 3.3)) * k;
        const x = r * Math.sin(th), z = r * Math.cos(th); put(specks, i, x, Math.max(pileAt(x, z, kR, kH), 0) + 0.003, z, s, s * 0.45, s * 0.8, rr(i) * 6, rr(i + 3) * 6, rr(i + 7) * 6);
      }
      specks.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < FK; i++) {
        const rho = 0.62 * Math.sqrt(rr(i * 1.7 + 11)), th = i * 2.39996 + 1.3, r = rho * pileR(th) * kR, x = r * Math.sin(th), z = r * Math.cos(th), s = (0.003 + 0.004 * rr(i * 2.9)) * ss((crumble - 0.25 - 0.6 * rr(i)) / 0.1);
        put(flecks, i, x, pileH(rho, th) * kH + 0.002, z, s, s * 0.5, s * 0.8, rr(i + 1) * 6, rr(i + 5) * 6, rr(i + 8) * 6);
      }
      flecks.instanceMatrix.needsUpdate = true;
      // the scrap of wrap on top
      const sk = ss((crumble - 0.92) / 0.07); scrap.visible = sk > 0.01; scrap.scale.setScalar(Math.max(sk, 0.01)); scrap.rotation.set(-Math.PI / 2 + 0.05, 0, 0.6); scrap.position.set(0.035, pileH(0.15, 0.4) * kH + 0.004, 0.02);
      // dust puffs
      for (const p of puffs) {
        const k = (crumble - p.b) / 0.30, on = k > 0 && k < 1; p.o.visible = on;
        if (on) { const e = ss(k), r = p.r + 0.15 * e, y = 0.06 + (0.12 + p.size * 0.5) * e; p.o.position.set(r * Math.sin(p.a), y, r * Math.cos(p.a)); p.o.scale.setScalar(p.size * (0.55 + 0.45 * ss(k * 2.2))); p.o.material.opacity = 0.92 * ss(k / 0.18) * (1 - ss((k - 0.45) / 0.55)); }
      }
    };
    setPose(S.reach ?? 0, S.scream ?? 0, S.crumble ?? 0, 0);
    return {
      grip: 0,
      apply(ps, t) {
        const reach = clamp(ps.reach ?? S.reach ?? 0), scream = clamp(ps.scream ?? S.scream ?? 0), crumble = clamp(ps.crumble ?? S.crumble ?? 0);
        setPose(reach, scream, crumble, t);
      },
    };
  },
};

export const HEART_SOUL_GRIPS = {};
