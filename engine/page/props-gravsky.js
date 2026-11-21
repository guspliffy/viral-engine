import * as THREE from "three";
import { clamp } from "./util.js";

// props-gravsky.js: fact what-if 02 "What if gravity got stronger every five seconds?" (19 Nov 2026): the sky outside the window.
// Design: storyboards/series/facts/02-gravity/DESIGN.md sections 3 (sky, Moon, cracks, satellites) and 4 (clouds, sink).
// World metres, y up, the window looks toward -z (room window at z -2.65). Every kind is built in WORLD coordinates: place each
// one at x 0, y 0, z 0, rot 0, scale 1 (the stage origin). Every frame is a pure function of the params (seed 26031; no random,
// no clock). All four are self-lit (unlit materials), look-only (no shadow, no contact oval, no hand ray, not solid), no ink line.
// Needs the storyboard key "far": 6000 (the dome is r 4000, the Moon sits 2500 m from camera A).
// Drawing order: dome -1000, Moon -900, clouds 100-110, satellites 200. The dome and the Moon ignore depth (a backdrop behind the
// whole city); the clouds and the satellites are depth-tested against the city, so towers stand in front of them.
// Registry (already in props3d.js): import { GRAVSKY_KINDS } from "./props-gravsky.js"; Object.assign(KINDS, ..., GRAVSKY_KINDS);
//
//   gsky     the dusk dome (r 4000, seen from inside), centred on spec.from (default camera A [.05, 1.52, 3.18]): the colour by
//            elevation -12 / -2 / 2 / 8 / 18 / 35 / 75 deg = #786079 #D88070 #FFAB6D #C6787E #796285 #405A85 #293B65 (blended in
//            linear RGB, held beyond the ends) plus the sunset highlight (warm, gain .18, Gaussian over azimuth -18 deg, width 34
//            deg, strongest near the horizon). No params. Origin: spec.from. Not held.
//   gmoon    the Moon, a sphere with its own phase shading (light from the upper left, phase angle 24 deg; terminator #776579,
//            base #F0C799, maria #AD8176, lit rim #FFE1AC, 16 craters, wide maria) 2500 m from spec.from, radius 2500 x
//            sin(diameter / 2) (the angular size of the design's 30 km Moon). Params: `moon` 0..1 = the design table, interpolated:
//            angular diameter .52 / 26 / 96 deg, azimuth-elevation -9.5,13 / -4,10 / 0,8 (az 0 = -z, + toward +x), lit-side gain
//            1 / 1.13 / 1.23 (jumps between cuts, tweens between values); `cracks` 0..1: the crack web on the camera-facing side
//            in disc UV (u right, v up, the view from spec.from projected on the disc, the disc 0..1 while the Moon is under 74 deg and held at +-37 deg beyond, so the web stays in frame; origin .58,.61; three primary polylines, 11 daughter branches),
//            core #624752, rim #FFDDAD, core width 0 / .0018 / .0035 disc diameters, primaries revealed 0 / 65 / 100 %, branches
//            0 / 3 / 11 at cracks 0 / .5 / 1. spec.from, spec.dist 2500, spec.crackW 1 (multiplies the crack widths; the design's are thin, about 7 px at 1080 wide). The Moon is a backdrop: whatever is built later draws
//            over it. A faint halo shows round it while it is small (gone by moon .6).
//   gsats    the falling satellites: nine glowing streaks. Param `t` = seconds since the 30 g step (0..5; default -1 = nothing).
//            Trails launch at 0.03 0.17 0.33 0.60 0.90 1.27 1.70 2.37 3.33 s, live 0.7-1.4 s (the 4th 1.4 s), head #FFF1C4, core
//            #FFAD57, outer trail #EB683D, ember #AF5241, a tapered camera-facing ribbon behind a small 3D head; opacity 0 ->
//            .95 (at half life) -> 0, length 0 -> full -> 25 %. Direction down-left 25-41 deg below the screen horizontal,
//            3-12 deg long, depth 1.2-3.2 km, spawn az -6..20 deg, el 13..27 deg (seen from spec.from). The 4th trail's head is
//            a 3D satellite (body 3.2 x 1.8 x 1.6 m, two navy #314366 panels 8.5 x 2.0 x .10 m with a .5 m grid, rolling 0 -> 55
//            -> 110 deg) crossing az +11, el 18 at 1.2 km. spec.cam = { pos, look } the ribbons face (default camera C
//            [.21, 1.23, .40] -> [.16, 1.71, -2.65]), spec.satScale 1 (multiplies the satellite body and panels only; at 1.2 km
//            the real-size body is about 4 px tall, so raise it if panel 10 must show the satellite big).
//   gclouds  the clouds: 28 soft high streaks (y 110-240, z -650..-1500, elevation kept under 17 deg, radii 30-105 x 5-18 x 18-50,
//            colour #E3A28E, top light #FFC29A, shadow #9D7485, opacity .52, each a few soft sprites) and the cloud sea (a
//            horizontal deck under the crest plus 96 lobes of 2 sprites, x -650..650 but denser toward the middle, z -26..-1250
//            weighted toward the near side; fill #BDB2B6, crest #F2CCB4, shade #90879F). Params: `sink` 0..1 (high clusters drop
//            to y -38 by sink 1 and fade into the sea over sink .7-1; sea opacity 0 / .68 / .94 and crest y 15 / -9 / -33; billows up to 5 m over
//            the crest), `drift` 0..1 (everything moves x +14 m at 1). Cheap soft sprites in one mesh (far to near), no solids.
//   Bench: storyboards/series/facts/02-gravity/bench/make-sky-bench.mjs.

const SEED = 26031, TAU = Math.PI * 2, DEG = Math.PI / 180;
const CAM_A = [0.05, 1.52, 3.18];
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const fr = (x) => x - Math.floor(x);
function rngOf(seed) { let s = (seed >>> 0) || 1; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pw = (pts, k) => { for (let i = 1; i < pts.length; i++) if (k <= pts[i][0] || i === pts.length - 1) { const [a, va] = pts[i - 1], [b, vb] = pts[i]; return lerp(va, vb, clamp((k - a) / (b - a))); } return pts[0][1]; };
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const dirOf = (az, el) => new THREE.Vector3(Math.sin(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), -Math.cos(az * DEG) * Math.cos(el * DEG));
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function ctex(c, o = {}) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = o.aniso ?? 2;
  if (o.nomip) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  if (o.wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function lookOnly(me, order) { me.castShadow = me.receiveShadow = false; me.frustumCulled = false; me.userData.solid = false; me.userData.lookOnly = true; me.userData.steam = true; if (order != null) me.renderOrder = order; return me; }
const noLine = (m) => { m.userData.noOutline = true; m.userData.noHatch = true; return m; };
const memo = new Map(), once = (k, make) => { if (!memo.has(k)) memo.set(k, make()); return memo.get(k); };

// =============================================================================================================== sky dome
const SKY_EL = [-12, -2, 2, 8, 18, 35, 75], SKY_COL = ["#786079", "#D88070", "#FFAB6D", "#C6787E", "#796285", "#405A85", "#293B65"];
function skyDome(P) {
  const S = P.spec, from = S.from ?? CAM_A;
  const m = noLine(new THREE.ShaderMaterial({
    uniforms: { uEl: { value: SKY_EL }, uCol: { value: SKY_COL.map((h) => new THREE.Vector3(...lin(h))) }, uSun: { value: new THREE.Vector3(...lin("#FFAB6D")) } },
    vertexShader: "varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform float uEl[7]; uniform vec3 uCol[7]; uniform vec3 uSun; varying vec3 vD;
      void main(){
        vec3 d = normalize(vD); float el = degrees(asin(clamp(d.y, -1.0, 1.0))); float az = degrees(atan(d.x, -d.z));
        vec3 c = uCol[0];
        for (int i = 0; i < 6; i++) { float k = clamp((el - uEl[i]) / (uEl[i + 1] - uEl[i]), 0.0, 1.0); c = (el >= uEl[i]) ? mix(uCol[i], uCol[i + 1], k) : c; }
        if (el >= uEl[6]) c = uCol[6];
        float da = az + 18.0; da = mod(da + 180.0, 360.0) - 180.0; float sg = 17.0;
        float g = exp(-da * da / (2.0 * sg * sg)) * exp(-pow((el - 4.0) / 14.0, 2.0));
        c += uSun * 0.18 * g;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide, depthTest: false, depthWrite: false, fog: false,
  }));
  const dome = lookOnly(new THREE.Mesh(new THREE.SphereGeometry(4000, 48, 32), m), -1000); dome.position.set(...from); P.whole.add(dome);
  return { grip: 0 };
}

// =============================================================================================================== Moon
const MOON_ROWS = [[0, 0.52, -9.5, 13, 1], [0.5, 26, -4, 10, 1.13], [1, 96, 0, 8, 1.23]];
function moonAlbedo() {
  return once("moonAlbedo", () => {
    const N = 2048, [c, g] = canvas(N, N), R = rngOf(SEED + 11), cx = N / 2;
    g.fillStyle = "#F0C799"; g.fillRect(0, 0, N, N);
    // wide maria: soft blobs, opacity .22
    for (const [u, v, r] of [[0.38, 0.35, 0.16], [0.58, 0.28, 0.12], [0.66, 0.5, 0.14], [0.45, 0.58, 0.13], [0.3, 0.62, 0.09], [0.55, 0.74, 0.1], [0.78, 0.7, 0.07], [0.22, 0.42, 0.07]]) {
      const gr = g.createRadialGradient(u * N, v * N, 0, u * N, v * N, r * N * 1.15);
      gr.addColorStop(0, "rgba(173,129,118,0.22)"); gr.addColorStop(0.7, "rgba(173,129,118,0.16)"); gr.addColorStop(1, "rgba(173,129,118,0)"); g.fillStyle = gr; g.fillRect(0, 0, N, N);
    }
    // mottling
    for (let i = 0; i < 1100; i++) { const a = R() * TAU, rr = Math.sqrt(R()) * 0.5 * N, x = cx + Math.cos(a) * rr, y = cx + Math.sin(a) * rr, s = 3 + R() * 13; g.fillStyle = R() < 0.55 ? `rgba(173,129,118,${0.05 + R() * 0.07})` : `rgba(255,225,172,${0.05 + R() * 0.07})`; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill(); }
    // 16 craters, diameters .025-.18 of the disc
    for (let i = 0; i < 16; i++) {
      const a = R() * TAU, rr = Math.sqrt(R()) * 0.42 * N, x = cx + Math.cos(a) * rr, y = cx + Math.sin(a) * rr, d = (0.025 + (0.18 - 0.025) * R() ** 1.6) * N, r = d / 2;
      g.fillStyle = "rgba(173,129,118,0.34)"; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      g.fillStyle = "rgba(120,90,100,0.18)"; g.beginPath(); g.arc(x + r * 0.12, y + r * 0.12, r * 0.8, 0, TAU); g.fill();
      g.strokeStyle = "rgba(255,225,172,0.55)"; g.lineWidth = Math.max(2, r * 0.1); g.beginPath(); g.arc(x, y, r, 1.0 * Math.PI, 1.6 * Math.PI); g.stroke();   // lit rim on the upper left
      g.strokeStyle = "rgba(100,70,85,0.28)"; g.lineWidth = Math.max(2, r * 0.08); g.beginPath(); g.arc(x, y, r, 0.0, 0.55 * Math.PI); g.stroke();
    }
    return ctex(c, { nomip: false, aniso: 4 });
  });
}
// crack web in disc UV (u right, v up): primaries from the origin, jittered; daughters branch from the intermediate vertices
function crackPlan() {
  return once("crackPlan", () => {
    const R = rngOf(SEED + 23), O = [0.58, 0.61];
    const prim = [[O, [0.42, 0.49], [0.32, 0.32], [0.08, 0.15]], [O, [0.68, 0.67], [0.72, 0.84], [0.83, 0.97]], [O, [0.72, 0.53], [0.81, 0.52], [0.98, 0.33]]].map((pl) => {
      const pts = [pl[0]];
      for (let i = 1; i < pl.length; i++) {
        const a = pl[i - 1], b = pl[i], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
        for (let k = 1; k <= 3; k++) { const t = k / 3, j = k < 3 ? (R() - 0.5) * 0.022 : 0; pts.push([a[0] + dx * t + nx * j, a[1] + dy * t + ny * j]); }
      }
      let tot = 0; const acc = [0]; for (let i = 1; i < pts.length; i++) { tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); acc.push(tot); }
      return { pts, acc, tot };
    });
    // vertex indices of the design's intermediate vertices in the jittered polylines: 3 and 6
    const parents = [[0, 3], [1, 3], [2, 3], [0, 6], [1, 6], [2, 6], [0, 3], [1, 3], [2, 3], [0, 6], [1, 6]];
    const branches = parents.map(([pi, vi], i) => {
      const p = prim[pi], a = p.pts[vi - 1], b = p.pts[vi + 1], base = Math.atan2(b[1] - a[1], b[0] - a[0]), side = i < 6 ? (i % 2 ? 1 : -1) : (i % 2 ? -1 : 1);
      const ang0 = base + side * (25 + R() * 35) * DEG, len = 0.055 + R() * 0.115, pts = [p.pts[vi]];
      let ang = ang0; for (let k = 0; k < 3; k++) { const q = pts[pts.length - 1]; pts.push([q[0] + Math.cos(ang) * len / 3, q[1] + Math.sin(ang) * len / 3]); ang += (R() - 0.5) * 0.7; }
      return { pts, len, at: p.acc[vi] / p.tot, pi };
    });
    return { prim, branches };
  });
}
function strokePart(g, pts, frac, N) {   // a polyline from its start for `frac` of its length (frac 0..1), canvas px
  if (frac <= 0) return;
  let tot = 0; for (let i = 1; i < pts.length; i++) tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let need = tot * Math.min(1, frac); g.beginPath(); g.moveTo(pts[0][0] * N, (1 - pts[0][1]) * N);
  for (let i = 1; i < pts.length && need > 0; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]), k = Math.min(1, need / seg);
    g.lineTo((pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k) * N, (1 - (pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k)) * N); need -= seg;
  }
  g.stroke();
}
function drawCracks(g, N, k, cw) {
  g.clearRect(0, 0, N, N); if (k <= 0.001) return;
  const { prim, branches } = crackPlan(), reveal = pw([[0, 0], [0.5, 0.65], [1, 1]], k), w = pw([[0, 0], [0.5, 0.0018], [1, 0.0035]], k) * N * (cw ?? 1), nBr = pw([[0, 0], [0.5, 3], [1, 11]], k);
  g.lineCap = g.lineJoin = "round";
  for (const pass of [0, 1]) {
    g.strokeStyle = pass ? "#624752" : "#FFDDAD"; g.lineWidth = pass ? w : w * (1 + 2 * 0.45);
    for (const p of prim) strokePart(g, p.pts, reveal, N);
    branches.forEach((b, i) => { const grow = clamp(nBr - i); if (grow > 0 && reveal >= b.at) { g.lineWidth = (pass ? w : w * 1.9) * 0.7; strokePart(g, b.pts, grow, N); } });
  }
}
const MOON_VS = "varying vec3 vW; void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }";
// disc UV = the view from spec.from projected on the Moon's disc (u right, v up): 0.5 +- 0.5 x tan(view angle off the Moon's axis) / uTan,
// uTan = tan(its angular radius) while the Moon is small, held at .75 (37 deg) once it is bigger, so a Moon that fills the window keeps the
// crack web inside the frame
const MOON_FS = `uniform sampler2D uMap; uniform sampler2D uCrack; uniform float uGain; uniform float uHasCrack; uniform float uTan; uniform vec3 uTerm; uniform vec3 uBase; uniform vec3 uRim; uniform vec3 uLight;
  uniform vec3 uFrom; uniform vec3 uCenter; uniform vec3 uAx; uniform vec3 uAy; uniform vec3 uAz; varying vec3 vW;
  void main(){
    vec3 vd = normalize(vW - uFrom); vec2 p = vec2(dot(vd, uAx), dot(vd, uAy)) / max(-dot(vd, uAz), 0.05);
    vec2 uv = 0.5 + 0.5 * p / uTan;
    vec3 alb = texture2D(uMap, uv).rgb;
    if (uHasCrack > 0.5) { vec4 cr = texture2D(uCrack, uv); alb = mix(alb, cr.rgb, cr.a); }
    vec3 nw = normalize(vW - uCenter); vec3 n = vec3(dot(nw, uAx), dot(nw, uAy), dot(nw, uAz));
    float ndl = dot(n, normalize(uLight)); float sh = smoothstep(-0.2, 0.6, ndl);
    vec3 c = mix(alb * (uTerm / uBase), alb * uGain, sh);
    float f = clamp(dot(nw, normalize(uFrom - vW)), 0.0, 1.0);
    c += uRim * pow(1.0 - f, 3.0) * smoothstep(-0.1, 0.4, ndl) * 0.45;
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }`;
function haloTex() { return once("haloTex", () => { const [c, g] = canvas(128, 128), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,225,172,0.55)"); gr.addColorStop(0.25, "rgba(255,210,160,0.22)"); gr.addColorStop(1, "rgba(255,200,150,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return ctex(c, { nomip: true }); }); }
function moonKind(P) {
  const S = P.spec, from = new THREE.Vector3(...(S.from ?? CAM_A)), D = S.dist ?? 2500;
  const [cc, cg] = canvas(2048, 2048), crackTex = ctex(cc, { aniso: 4 });
  const mat = noLine(new THREE.ShaderMaterial({
    uniforms: { uMap: { value: moonAlbedo() }, uCrack: { value: crackTex }, uGain: { value: 1 }, uHasCrack: { value: 0 }, uTerm: { value: new THREE.Vector3(...lin("#776579")) }, uBase: { value: new THREE.Vector3(...lin("#F0C799")) }, uRim: { value: new THREE.Vector3(...lin("#FFE1AC")) }, uLight: { value: new THREE.Vector3(-0.407 * 0.7, 0.407 * 0.7, 0.914) }, uTan: { value: 0.1 }, uFrom: { value: from.clone() }, uCenter: { value: new THREE.Vector3() }, uAx: { value: new THREE.Vector3(1, 0, 0) }, uAy: { value: new THREE.Vector3(0, 1, 0) }, uAz: { value: new THREE.Vector3(0, 0, 1) } },
    vertexShader: MOON_VS, fragmentShader: MOON_FS, depthTest: false, depthWrite: false, fog: false, side: THREE.FrontSide,
  }));
  const moon = lookOnly(new THREE.Mesh(new THREE.SphereGeometry(1, 72, 48), mat), -900); P.whole.add(moon);
  const hm = noLine(new THREE.SpriteMaterial({ map: haloTex(), transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, toneMapped: false, fog: false }));
  const halo = new THREE.Sprite(hm); lookOnly(halo, -905); P.whole.add(halo);
  let drawn = -1;
  return {
    grip: 0,
    apply(ps) {
      const k = clamp(ps.moon ?? S.moon ?? 0), ck = clamp(ps.cracks ?? S.cracks ?? 0);
      const dia = pw(MOON_ROWS.map((r) => [r[0], r[1]]), k), az = pw(MOON_ROWS.map((r) => [r[0], r[2]]), k), el = pw(MOON_ROWS.map((r) => [r[0], r[3]]), k), gain = pw(MOON_ROWS.map((r) => [r[0], r[4]]), k);
      const rad = D * Math.sin(dia * DEG / 2), dir = dirOf(az, el);
      moon.position.copy(from).addScaledVector(dir, D); moon.scale.setScalar(rad); moon.lookAt(from);
      mat.uniforms.uGain.value = gain; mat.uniforms.uCenter.value.copy(moon.position); moon.updateMatrixWorld();
      mat.uniforms.uAx.value.set(1, 0, 0).applyQuaternion(moon.quaternion); mat.uniforms.uAy.value.set(0, 1, 0).applyQuaternion(moon.quaternion); mat.uniforms.uAz.value.set(0, 0, 1).applyQuaternion(moon.quaternion);
      mat.uniforms.uTan.value = Math.min(Math.tan(dia * DEG / 2), 0.75);
      const q = Math.round(ck * 400) / 400;
      if (q !== drawn) { drawn = q; drawCracks(cg, 2048, q, S.crackW); crackTex.needsUpdate = true; mat.uniforms.uHasCrack.value = q > 0.001 ? 1 : 0; }
      halo.position.copy(moon.position); halo.scale.setScalar(rad * 2.6 * 2); hm.opacity = 0.5 * (1 - sstep(0.1, 0.6, k)); halo.visible = hm.opacity > 0.003;
    },
  };
}

// =============================================================================================================== satellites
const SAT_T0 = [0.03, 0.17, 0.33, 0.60, 0.90, 1.27, 1.70, 2.37, 3.33];
const SAT_COL = [[0, "#FFF1C4"], [0.22, "#FFAD57"], [0.6, "#EB683D"], [1, "#AF5241"]].map(([k, h]) => [k, lin(h)]);
const colAt = (q) => { for (let i = 1; i < SAT_COL.length; i++) if (q <= SAT_COL[i][0]) { const [a, ca] = SAT_COL[i - 1], [b, cb] = SAT_COL[i], u = clamp((q - a) / (b - a)); return ca.map((v, j) => lerp(v, cb[j], u)); } return SAT_COL[SAT_COL.length - 1][1]; };
function glowTex() { return once("glowTex", () => { const [c, g] = canvas(64, 64), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,241,196,1)"); gr.addColorStop(0.3, "rgba(255,173,87,0.6)"); gr.addColorStop(1, "rgba(235,104,61,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return ctex(c, { nomip: true }); }); }
function panelTex() { return once("panelTex", () => { const [c, g] = canvas(256, 64); g.fillStyle = "#314366"; g.fillRect(0, 0, 256, 64); g.strokeStyle = "#5c78a8"; g.lineWidth = 1.5; for (let x = 0; x <= 256; x += 256 / 17) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 64); g.stroke(); } for (let y = 0; y <= 64; y += 64 / 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); } return ctex(c, { aniso: 4 }); }); }
const RIB_VS = "attribute vec4 aCol; attribute float aE; varying vec4 vC; varying float vE; void main(){ vC = aCol; vE = aE; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const RIB_FS = "varying vec4 vC; varying float vE; void main(){ float e = 1.0 - abs(vE); float a = vC.a * smoothstep(0.0, 0.75, e); gl_FragColor = vec4(vC.rgb * a, 1.0);\n#include <colorspace_fragment>\n }";
function satsKind(P) {
  const S = P.spec, from = new THREE.Vector3(...(S.from ?? CAM_A)), cam = S.cam ?? { pos: [0.21, 1.23, 0.4], look: [0.16, 1.71, -2.65] }, scl = S.satScale ?? 1;
  const f = new THREE.Vector3(...cam.look).sub(new THREE.Vector3(...cam.pos)).normalize(), rgt = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3().crossVectors(rgt, f).normalize();
  const R = rngOf(SEED + 41), NS = 14, N = SAT_T0.length;
  const trails = SAT_T0.map((t0, i) => {
    const four = i === 3, az = four ? 11 : -6 + 26 * R(), el = four ? 18 : 13 + 14 * R(), depth = four ? 1200 : 1300 + 1900 * R(), a = (25 + 16 * R()) * DEG, life = four ? 1.4 : 0.7 + 0.7 * R(), lenA = (3 + 9 * R()), pathA = 22 + 12 * R();
    const dirW = rgt.clone().multiplyScalar(-Math.cos(a)).addScaledVector(up, -Math.sin(a)), wv = new THREE.Vector3().crossVectors(f, dirW).normalize();
    return { t0, life, p0: from.clone().addScaledVector(dirOf(az, el), depth), dirW, wv, lenM: depth * Math.tan(lenA * DEG), pathM: depth * Math.tan(pathA * DEG), four };
  });
  // two ribbon layers (wide orange glow, narrow hot core), one buffer each: N trails x NS stations x 2 vertices
  const layers = [{ w: 0.1, a: 0.6, mix: 0.45 }, { w: 0.032, a: 1, mix: 0 }].map((L) => {
    const nv = N * NS * 2, pos = new Float32Array(nv * 3), col = new Float32Array(nv * 4), e = new Float32Array(nv), idx = [];
    for (let i = 0; i < N; i++) for (let j = 0; j < NS; j++) { const v = (i * NS + j) * 2; e[v] = -1; e[v + 1] = 1; if (j < NS - 1) idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("aCol", new THREE.BufferAttribute(col, 4)); geo.setAttribute("aE", new THREE.BufferAttribute(e, 1)); geo.setIndex(idx);
    const m = noLine(new THREE.ShaderMaterial({ vertexShader: RIB_VS, fragmentShader: RIB_FS, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
    const mesh = lookOnly(new THREE.Mesh(geo, m), 200); P.whole.add(mesh); return { ...L, pos, col, geo, mesh };
  });
  const heads = trails.map((tr) => {
    const sm = noLine(new THREE.SpriteMaterial({ map: glowTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true, toneMapped: false, fog: false }));
    const sp = new THREE.Sprite(sm); lookOnly(sp, 201); P.whole.add(sp);
    const ball = lookOnly(new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), noLine(new THREE.MeshBasicMaterial({ color: "#FFF1C4", toneMapped: false, fog: false }))), 202); P.whole.add(ball);
    return { sp, sm, ball };
  });
  // the 4th trail's satellite: body 3.2 x 1.8 x 1.6, panels 8.5 x 2.0 x .10 (x = along the path, y = the panel axis, z = view)
  const sat = new THREE.Group(); lookOnly(sat, 203); P.whole.add(sat);
  const bodyM = noLine(new THREE.MeshBasicMaterial({ color: "#B7B9C6", toneMapped: false, fog: false })), foil = noLine(new THREE.MeshBasicMaterial({ color: "#E0B36A", toneMapped: false, fog: false })), solar = noLine(new THREE.MeshBasicMaterial({ map: panelTex(), toneMapped: false, fog: false, side: THREE.DoubleSide }));
  const part = (geo, m, x, y, z) => { const o = lookOnly(new THREE.Mesh(geo, m), 203); o.position.set(x, y, z); sat.add(o); return o; };
  part(new THREE.BoxGeometry(3.2, 1.8, 1.6), bodyM, 0, 0, 0); part(new THREE.BoxGeometry(0.5, 1.82, 1.62), foil, 0.9, 0, 0);
  for (const s of [-1, 1]) { part(new THREE.BoxGeometry(2.0, 8.5, 0.1), solar, 0, s * (0.9 + 4.25), 0); part(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6), bodyM, 0, s * 1.25, 0); }
  sat.scale.setScalar(scl);
  const tmp = new THREE.Vector3(), bas = new THREE.Matrix4(), rollQ = new THREE.Quaternion();
  return {
    grip: 0,
    apply(ps) {
      const t = ps.t ?? S.t ?? -1;
      for (const L of layers) { L.pos.fill(0); L.col.fill(0); }
      trails.forEach((tr, i) => {
        const tau = (t - tr.t0) / tr.life, h = heads[i], on = tau > 0 && tau < 1;
        h.sp.visible = h.ball.visible = on; if (i === 3) sat.visible = on; if (!on) return;
        const lf = tau < 0.5 ? tau / 0.5 : lerp(1, 0.25, (tau - 0.5) / 0.5), op = (tau < 0.5 ? tau / 0.5 : (1 - tau) / 0.5) * 0.95;
        const headS = tau * tr.pathM, Lm = Math.min(headS, tr.lenM * Math.max(lf, 0.02));
        for (const L of layers) for (let j = 0; j < NS; j++) {
          const q = j / (NS - 1), s = headS - q * Lm, hw = tr.lenM * L.w * Math.pow(1 - q, 0.9) * (0.35 + 0.65 * Math.min(1, lf * 2)) + 0.4, c = colAt(q * (1 - L.mix) + L.mix * q * 0.6 + (L.mix ? 0.25 : 0)), al = op * L.a * Math.pow(1 - q, 1.15);
          tmp.copy(tr.p0).addScaledVector(tr.dirW, s);
          for (let sd = 0; sd < 2; sd++) { const v = (i * NS + j) * 2 + sd, sg = sd ? 1 : -1; L.pos[v * 3] = tmp.x + tr.wv.x * hw * sg; L.pos[v * 3 + 1] = tmp.y + tr.wv.y * hw * sg; L.pos[v * 3 + 2] = tmp.z + tr.wv.z * hw * sg; L.col.set([c[0], c[1], c[2], al], v * 4); }
        }
        tmp.copy(tr.p0).addScaledVector(tr.dirW, headS);
        h.ball.position.copy(tmp); h.ball.scale.setScalar(Math.max(tr.lenM * 0.012, 1.2) * (tr.four ? 0.6 : 1)); h.sp.position.copy(tmp); h.sp.scale.setScalar(Math.max(tr.lenM * 0.22, 14)); h.sm.opacity = clamp(op / 0.95);
        if (tr.four) { sat.position.copy(tmp); bas.makeBasis(tr.dirW, tr.wv, new THREE.Vector3().crossVectors(tr.dirW, tr.wv)); sat.quaternion.setFromRotationMatrix(bas); rollQ.setFromAxisAngle(new THREE.Vector3(1, 0, 0), 110 * tau * DEG); sat.quaternion.multiply(rollQ); h.ball.visible = false; }
      });
      for (const L of layers) { L.geo.attributes.position.needsUpdate = true; L.geo.attributes.aCol.needsUpdate = true; }
    },
  };
}

// =============================================================================================================== clouds
function puffTex(variant, pal) {
  return once(`puff${variant}${pal.name}`, () => {
    const W = 256, H = 96, [c, g] = canvas(W, H), R = rngOf(SEED + 100 + variant * 7 + (pal.name === "sea" ? 50 : 0));
    // 1 alpha: overlapping soft discs on a flat base, 2 colour: top light to shade, kept by source-in
    const n = 9 + variant;
    for (let i = 0; i < n; i++) {
      const u = 0.12 + 0.76 * (i + R() * 0.6) / n, rr = (0.16 + 0.18 * R()) * H * (1 - Math.abs(u - 0.5) * 0.9) + 10, x = u * W, y = H * (0.66 - 0.18 * R() * (1 - Math.abs(u - 0.5) * 1.4));
      const gr = g.createRadialGradient(x, y, 0, x, y, rr * 1.35); gr.addColorStop(0, "rgba(255,255,255,0.95)"); gr.addColorStop(0.55, "rgba(255,255,255,0.7)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr * 1.35, 0, TAU); g.fill();
    }
    const flat = g.createLinearGradient(0, H * 0.72, 0, H * 0.98); flat.addColorStop(0, "rgba(255,255,255,0)"); flat.addColorStop(1, "rgba(255,255,255,0)");
    g.globalCompositeOperation = "destination-in"; const fade = g.createLinearGradient(0, H * 0.58, 0, H); fade.addColorStop(0, "rgba(0,0,0,1)"); fade.addColorStop(1, "rgba(0,0,0,0.0)"); g.fillStyle = fade; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = "source-in"; const col = g.createLinearGradient(0, 0, 0, H); col.addColorStop(0, pal.top); col.addColorStop(0.45, pal.mid); col.addColorStop(0.85, pal.shade); col.addColorStop(1, pal.shade); g.fillStyle = col; g.fillRect(0, 0, W, H);
    void flat;
    return ctex(c, { nomip: false, aniso: 2 });
  });
}
const HIGH_PAL = { name: "high", top: "#FFC29A", mid: "#E3A28E", shade: "#9D7485" }, SEA_PAL = { name: "sea", top: "#F2CCB4", mid: "#BDB2B6", shade: "#90879F" };
function deckTex() {
  return once("deckTex", () => {
    const N = 256, [c, g] = canvas(N, N), R = rngOf(SEED + 77);
    g.fillStyle = "#BDB2B6"; g.fillRect(0, 0, N, N);
    for (let i = 0; i < 70; i++) {
      const x = R() * N, y = R() * N, r = 12 + R() * 34, kind = R(), col = kind < 0.4 ? "242,204,180" : kind < 0.75 ? "144,135,159" : "189,178,182", a = 0.1 + R() * 0.2;
      for (const [ox, oy] of [[0, 0], [-N, 0], [N, 0], [0, -N], [0, N]]) { const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x + ox - r, y + oy - r, 2 * r, 2 * r); }
    }
    return ctex(c, { wrap: true, aniso: 4 });
  });
}
function cloudsKind(P) {
  const S = P.spec, R = rngOf(SEED + 5), from = S.from ?? CAM_A;
  const puffs = [];   // { kind: 0 high | 1 sea, x, y, z, w, h, v (texture variant), a (alpha factor), top (sea) }
  // 28 high clusters, 3-4 sprites each
  for (let i = 0; i < 28; i++) {
    const z = -(650 + 850 * fr(i * 0.618 + 0.13)), dist = Math.abs(z - from[2]), ymax = Math.min(240, from[1] + Math.tan(16.5 * DEG) * dist), y0 = lerp(110, Math.max(111, ymax), R());
    const xc = (R() * 2 - 1) * Math.min(650, 0.62 * dist), rx = 30 + 75 * R(), ry = 5 + 13 * R(), rz = 18 + 32 * R(), n = 3 + (R() < 0.5 ? 1 : 0);
    for (let k = 0; k < n; k++) { const u = n === 1 ? 0 : k / (n - 1) - 0.5; puffs.push({ kind: 0, x: xc + u * rx * 1.15, y: y0 + (R() - 0.5) * ry * 0.7, z: z + (R() - 0.5) * rz, w: rx * (0.8 + 0.7 * R()) * 1.25, h: ry * 2 * (1.9 + 0.8 * R()), v: Math.floor(R() * 4), a: 0.85 + 0.15 * R() }); }
  }
  // the sea: 96 lobes of 2 sprites; denser toward the middle and the near side
  for (let i = 0; i < 96; i++) {
    const u = fr(i * 0.7548776662 + 0.31), zz = -(26 + 1224 * Math.pow(u, 1.7)), xr = Math.min(650, 55 + 0.85 * Math.abs(zz)), x = (fr(i * 0.5698402909 + 0.17) * 2 - 1) * xr;
    const rx = 16 + 54 * R(), ry = 4 + 5 * R(), rz = 12 + 28 * R(), bump = (i % 8 === 3 ? 3 + 2 * R() : -2 * R());
    for (let k = 0; k < 2; k++) { const h = Math.max(2 * ry * 3.4, 22); puffs.push({ kind: 1, x: x + (k ? 0.6 : -0.5) * rx, y: 0, z: zz + (k ? -1 : 1) * rz * 0.5, w: rx * (k ? 2.3 : 3.0), h, v: Math.floor(R() * 4), a: 0.82 + 0.18 * R(), top: bump + (k ? -1.5 : 0) }); }
  }
  puffs.sort((a, b) => a.z - b.z);   // far to near: the painter's order inside one mesh
  const n = puffs.length, pos = new Float32Array(n * 12), col = new Float32Array(n * 16), uv = new Float32Array(n * 8), idx = new Uint32Array(n * 6);
  for (let i = 0; i < n; i++) { uv.set([0, 0, 1, 0, 1, 1, 0, 1], i * 8); idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6); }
  // one mesh per texture variant would break the far-to-near order, so all variants live on one atlas: a 4 x 2 sheet (high 0-3 top row, sea 0-3 bottom row)
  const [ac, ag] = canvas(1024, 192), tiles = [];
  [HIGH_PAL, SEA_PAL].forEach((pal, row) => { for (let v = 0; v < 4; v++) { ag.drawImage(puffTex(v, pal).image, v * 256, row * 96); tiles.push([v * 0.25, 1 - (row + 1) * 0.5, 0.25, 0.5]); } });
  const atlas = ctex(ac, { aniso: 2 });
  puffs.forEach((p, i) => { const t = tiles[p.kind * 4 + p.v]; for (let k = 0; k < 4; k++) { const cu = k === 1 || k === 2 ? 1 : 0, cv = k >= 2 ? 1 : 0; uv[i * 8 + k * 2] = t[0] + cu * t[2]; uv[i * 8 + k * 2 + 1] = t[1] + cv * t[3]; } });
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 4)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
  const mat = noLine(new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true, transparent: true, depthWrite: false, depthTest: true, toneMapped: false, fog: false, side: THREE.DoubleSide }));
  const mesh = lookOnly(new THREE.Mesh(geo, mat), 110); P.whole.add(mesh);
  // the deck under the sea: a horizontal sheet at the crest, fading out at the far edge
  const ROWS = 20, dp = new Float32Array((ROWS + 1) * 2 * 3), dc = new Float32Array((ROWS + 1) * 2 * 4), du = new Float32Array((ROWS + 1) * 2 * 2), di = [];
  const zRow = (r) => -(26 + 1224 * Math.pow(r / ROWS, 1.6));
  for (let r = 0; r <= ROWS; r++) for (let s = 0; s < 2; s++) { const v = r * 2 + s; dp[v * 3] = s ? 650 : -650; dp[v * 3 + 2] = zRow(r); du[v * 2] = (s ? 650 : -650) / 150; du[v * 2 + 1] = zRow(r) / 150; if (r < ROWS) di.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); }
  const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute("position", new THREE.BufferAttribute(dp, 3)); dgeo.setAttribute("color", new THREE.BufferAttribute(dc, 4)); dgeo.setAttribute("uv", new THREE.BufferAttribute(du, 2)); dgeo.setIndex(di);
  const dmat = noLine(new THREE.MeshBasicMaterial({ map: deckTex(), vertexColors: true, transparent: true, depthWrite: true, depthTest: true, toneMapped: false, fog: false, side: THREE.DoubleSide }));
  const deck = lookOnly(new THREE.Mesh(dgeo, dmat), 100); P.whole.add(deck);
  let key = "";
  return {
    grip: 0,
    apply(ps) {
      const sink = clamp(ps.sink ?? S.sink ?? 0), drift = clamp(ps.drift ?? S.drift ?? 0), k = `${sink}|${drift}`;
      if (k === key) return; key = k;
      const crest = pw([[0, 15], [0.5, -9], [1, -33]], sink), seaOp = pw([[0, 0], [0.5, 0.68], [1, 0.94]], sink), dx = 14 * drift, highA = 0.52 * (1 - sstep(0.7, 1, sink));
      mesh.visible = seaOp > 0.002 || highA > 0.002; deck.visible = seaOp > 0.002;
      puffs.forEach((p, i) => {
        const cx = p.x + dx; let cy, a;
        if (p.kind === 0) { cy = p.y + (-38 - p.y) * sink; a = highA * p.a; } else { cy = crest + p.top - p.h / 2 + p.h * 0.12; a = seaOp * p.a; }
        const hw = p.w / 2, hh = p.h / 2, o = i * 12;
        pos.set([cx - hw, cy - hh, p.z, cx + hw, cy - hh, p.z, cx + hw, cy + hh, p.z, cx - hw, cy + hh, p.z], o);
        for (let j = 0; j < 4; j++) col.set([1, 1, 1, a], i * 16 + j * 4);
      });
      geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
      deck.position.y = crest - 4;
      for (let r = 0; r <= ROWS; r++) for (let s = 0; s < 2; s++) dc.set([1, 1, 1, seaOp * (1 - sstep(0.72, 1, r / ROWS)) * (r === 0 ? 1 : 1)], (r * 2 + s) * 4);
      dgeo.attributes.color.needsUpdate = true; deck.position.x = dx * 0;
    },
  };
}

export const GRAVSKY_KINDS = {
  gsky: skyDome,
  gmoon: moonKind,
  gsats: satsKind,
  gclouds: cloudsKind,
};
