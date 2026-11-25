import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { clamp } from "./util.js";

// Potato Desk 13 "Who's in your hell?" (storyboards/series/potato-desk/13-whos-in-your-hell/DESIGN.md sections 2, 3): the hell waiting room's couch,
// the hero's notification phone and the Wizard's crystal ball. Axes: x right, y up, +z toward the camera, metres; every size and hex colour is the
// DESIGN's. Everything animated is a pure function of the prop state and the clip time t (no clock, no Math.random). Nothing fades by material.opacity
// (a tween of it keeps its first frame in a sequential render): glows are additive planes whose COLOUR is scaled, pops are scales.
//
// hellcouch    origin: the floor at the couch's middle, UNDER THE SITTERS' LINE (a body sits at z +0.03); faces +z. 3.12 wide (x -1.56..+1.56) x 0.84 high
//              (back top) x 0.76 deep (z -0.50..+0.26). Four seats, centres x -1.05 / -0.35 / +0.35 / +1.05 (pitch 0.70, seams at -0.70 / 0 / +0.70),
//              SEAT TOP y 0.32 (cushions 0.68 x 0.13 x 0.56, z -0.32..+0.24, velvet #a3202e, sheen 1.18 at the top to 0.82; the prop's grip is 0.32).
//              Arms' inner faces x -1.40 / +1.40 (0.16 wide, top 0.56); back frame z -0.50..-0.36, top roll top 0.84, four back cushions (face z -0.30,
//              leaning back 8 deg, two stitched grooves each). SIT on it with `sit` { seat: <id>, height: 0.32, feet: [0.32, 0], along: x from the middle }.
//              Star A on seat 4 (0.34 across, centre (1.05, 0.321, -0.04), one point toward -z), star B on back cushion 4 (0.30 across, centre (1.05, 0.56),
//              one point up), each its own canvas. Both stars' gold border is drawn from its own mask.
//              spec keys: glow 0..1 (default 0; TWEENS; gold border goes emissive #ffd23f x 1.6 and a halo 0.55 across #ff7a1c x 0.35 x glow lies over each),
//                         step true|false (default false; steps: the Wizard's step 1.70 x 0.40 x 0.36, centre (0.65, 0.20, -0.87), top y 0.40, wood #3a2418,
//                         felt #6f1620). Solid (a body is placed ON the cushions and arms).
//              Hold: not hand-held (HELLWAIT_GRIPS has no couch).
// pingphone    the phone body of `phone` (0.078 x 0.155 x 0.012, origin bottom centre of the body's edge: y 0 = the bottom, screen faces +z), screen #16263a
//              lit; use scale 1.8. Held like `phone`: grips.phone(c, who, spec, { side, edge }) (SIZE pingphone in storyboards/lib/grips.mjs).
//              Letterless notification bubbles (rounded bar 0.058 x 0.019 #f3ead2, a coloured dot r 0.006 and two grey lines, pitch 0.024, the newest at
//              y 0.128 from the phone's bottom, older ones one pitch lower each).
//              spec keys: count 0..5 (default 0; TWEENS: bubble i appears as count goes i-1 -> i and pops from scale 1.4 to 1 over that tween: tween it
//                         with dur 0.133 = 4 frames per bubble; the older ones slide down one pitch over the same tween),
//                         pops [t1, t2, ...] (optional, clip seconds: with it bubble i appears at its own time and pops over 4 frames of the clip clock,
//                         `count` is then ignored: give the times so a cut or a stepped set keeps the pop),
//                         glow 0..1 (default 1; screen light and halo), halo (0.30 metres across, #a9dcff; +30 % for 3 frames on each pop),
//                         case (body colour, default "#23242c" as `phone`).
// crystalball  r 0.10 glass ball #b9c8ff, ORIGIN = THE BALL'S CENTRE. Three swirl strokes (#7f6bff, #e9f1ff) turn 0.3 turn/s on the clip clock; a dish
//              base and rim #5b4bd6 under it (stand bottom y -0.14, rim ring y -0.085), a white highlight, a halo #9fb4ff 0.42 across at 0.55 x glow.
//              spec keys: glow 0..1.4 (default 1; TWEENS; halo and glass emissive). Solid glass and base.
//              Hold: it rests on a cupped palm-up glove (glove shape `cup`): grip "cup" = (0, -0.12, 0) under the stand (HELLWAIT_GRIPS). The
//              grips.mjs proof is the `bowl` hold (both gloves cupped on its lower sides, SIZE crystalball).

const DEG = Math.PI / 180, TAU = Math.PI * 2;
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
const basic = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, ...o }); m.fog = false; return m; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const box = (w, h, d, m, parent, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z);
function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const ss = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const SEE = (o) => { o.userData.solid = false; o.userData.steam = true; o.castShadow = false; o.receiveShadow = false; return o; };   // a glow / overlay: nothing to touch
// a see-through canvas overlay laid on a face (the star, the spiral); `emissive` is an optional { color, map } light
const overlayMat = (tex, o = {}) => {
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, transparent: true, alphaTest: 0.02, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, ...o });
  m.userData.noOutline = true; m.userData.noHatch = true; return m;
};
// a soft additive glow disc: white radial gradient, tinted by the material colour (scaled colour = intensity, no opacity)
const GLOW_TEX = () => canvasTex(128, 128, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.4, "rgba(255,255,255,0.5)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
const glowMat = (tex) => { const m = new THREE.MeshBasicMaterial({ map: tex, color: "#000000", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }); m.fog = false; m.userData.noOutline = true; m.userData.noHatch = true; m.userData.glow = true; return m; };

// ---- the couch's stars ------------------------------------------------------------------------------------------------------------------------------
// One star on its own canvas. size = the star's width across its two side points (0.34 / 0.30), the canvas covers 1.15 x that. mode "color": the red satin
// star with its gold border and stitch dashes; mode "mask": the gold parts only, in white on black (the emissive map). hatch = the satin lines' angle and
// spacing, so two stars are two drawings. Point up in the canvas; the caller turns the plane.
function starCanvas(size, mode, { hatch, gap }) {
  const N = 512, cover = size * 1.15, ppm = N / cover, R = (size / (2 * Math.sin(72 * DEG))) * ppm, RI = R * 0.47, C = N / 2, cy = C;
  const pts = (k) => Array.from({ length: 10 }, (_, i) => { const a = -90 * DEG + i * 36 * DEG, r = (i % 2 ? RI : R) * k; return [C + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  const path = (g, p) => { g.beginPath(); p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
  return canvasTex(N, N, (g) => {
    const mask = mode === "mask";
    if (mask) { g.fillStyle = "#000000"; g.fillRect(0, 0, N, N); }
    const outer = pts(1), bw = 0.035 * ppm;
    g.lineJoin = "round"; g.lineCap = "round";
    if (!mask) {
      path(g, outer); g.fillStyle = "#c8352b"; g.fill();
      g.save(); path(g, outer); g.clip();
      g.strokeStyle = "#a82a22"; g.lineWidth = 3; g.beginPath();
      const ca = Math.cos(hatch * DEG), sa = Math.sin(hatch * DEG);
      for (let d = -N; d <= N; d += gap) { g.moveTo(C + d * ca - N * sa, cy + d * sa + N * ca); g.lineTo(C + d * ca + N * sa, cy + d * sa - N * ca); }
      g.stroke(); g.restore();
    }
    // the border: 0.035 wide, centred on the star's edge inset by half its width
    const edge = pts(1 - (bw / 2) / (R * 0.8));
    path(g, edge); g.strokeStyle = mask ? "#ffffff" : "#f2c94c"; g.lineWidth = bw; g.stroke();
    // 22 stitch dashes at equal steps along an inner outline
    const inner = pts(1 - (bw * 1.45) / (R * 0.8)), seg = [], len = [];
    let tot = 0; for (let i = 0; i < 10; i++) { const a = inner[i], b = inner[(i + 1) % 10], l = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push([a, b]); len.push(l); tot += l; }
    g.strokeStyle = mask ? "#ffffff" : "#c79a2a"; g.lineWidth = 0.007 * ppm;
    for (let k = 0; k < 22; k++) {
      let s = ((k + 0.5) / 22) * tot, i = 0; while (s > len[i]) { s -= len[i]; i++; }
      const [a, b] = seg[i], ux = (b[0] - a[0]) / len[i], uy = (b[1] - a[1]) / len[i], px = a[0] + ux * s, py = a[1] + uy * s, h = 0.011 * ppm;
      g.beginPath(); g.moveTo(px - ux * h, py - uy * h); g.lineTo(px + ux * h, py + uy * h); g.stroke();
    }
  });
}
// the scroll disc on an arm's front: a spiral drawn once (dir +-1, turns, seed offset make the two arms two drawings)
function spiralTex(dir, turns, phase) {
  return canvasTex(256, 256, (g, w) => {
    g.fillStyle = "#8a1c27"; g.fillRect(0, 0, w, w); g.strokeStyle = "#6f1620"; g.lineWidth = 7; g.lineCap = "round"; g.beginPath();
    for (let i = 0; i <= 90; i++) { const u = i / 90, a = phase + dir * u * turns * TAU, r = (0.06 + 0.82 * u) * (w / 2); const x = w / 2 + Math.cos(a) * r, y = w / 2 + Math.sin(a) * r; i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  });
}
// velvet: a gradient 1.18 at the top to 0.82 at the bottom of the face
function velvet(color) {
  const base = new THREE.Color(color), css = (k) => `rgb(${[base.r, base.g, base.b].map((v) => Math.round(Math.min(1, v * k) * 255)).join(",")})`;
  return canvasTex(64, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, css(1.18)); gr.addColorStop(0.5, css(1)); gr.addColorStop(1, css(0.82)); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
}

export const HELLWAIT_KINDS = {
  hellcouch(P) {
    const S = P.spec, XS = [-1.05, -0.35, 0.35, 1.05];
    const frame = mat("#8a1c27", { roughness: 0.9 }), cush = mat("#a3202e", { roughness: 0.92 }), pipe = mat("#7a1822", { roughness: 0.9 }), seam = mat("#5c121b", { roughness: 0.95 });
    const velvetT = velvet("#a3202e"), seatM = new THREE.MeshStandardMaterial({ map: velvetT, roughness: 0.92, emissive: new THREE.Color("#ffffff"), emissiveMap: velvetT, emissiveIntensity: 0.7 }), wood = mat("#5a3520", { roughness: 0.55 }), feet = mat("#3a2418", { roughness: 0.5 });
    const goldM = mat("#d9a93a", { roughness: 0.4, metalness: 0.3 }), groove = mat("#6f1620", { roughness: 0.95 });
    for (const m of [frame, cush, seam, wood, feet, groove]) m.userData.noHatch = true;
    // feet and plinth
    for (const x of [-1.40, 0, 1.40]) for (const z of [0.16, -0.42]) { const f = mesh(new THREE.SphereGeometry(0.035, 14, 10), feet, P.whole, x, 0.025, z); f.scale.y = 0.05 / 0.07; }
    box(3.08, 0.06, 0.70, wood, P.whole, 0, 0.08, -0.09);
    { const b = mesh(new THREE.CylinderGeometry(0.006, 0.006, 3.08, 8), goldM, P.whole, 0, 0.11, 0.26); b.rotation.z = Math.PI / 2; b.castShadow = false; }
    box(2.80, 0.08, 0.56, frame, P.whole, 0, 0.15, -0.08);   // base, y 0.11..0.19
    // seat cushions: velvet gradient, a thin piping along the front and back top edges, a dark seam between neighbours
    for (const x of XS) {
      mesh(new RoundedBoxGeometry(0.68, 0.13, 0.56, 3, 0.055), seatM, P.whole, x, 0.255, -0.04);
      for (const z of [0.205, -0.285]) { const p = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.60, 6), pipe, P.whole, x, 0.311, z); p.rotation.z = Math.PI / 2; p.castShadow = false; }
    }
    for (const x of [-0.70, 0, 0.70]) box(0.02, 0.12, 0.54, seam, P.whole, x, 0.25, -0.04);
    // back: frame, the rolled top, four cushions with soft arched tops and two stitched grooves each
    box(2.80, 0.67, 0.14, frame, P.whole, 0, 0.445, -0.43);
    { const r = mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.80, 20), frame, P.whole, 0, 0.78, -0.43); r.rotation.z = Math.PI / 2; }
    const shape = new THREE.Shape(), HW = 0.33, HH = 0.44, RC = 0.09;   // 0.66 x 0.44, grown 0.01 all round by the bevel = 0.68 x 0.46
    shape.moveTo(-HW, 0); shape.lineTo(HW, 0); shape.lineTo(HW, HH - RC); shape.absarc(HW - RC, HH - RC, RC, 0, Math.PI / 2, false);
    shape.lineTo(-HW + RC, HH); shape.absarc(-HW + RC, HH - RC, RC, Math.PI / 2, Math.PI, false); shape.lineTo(-HW, 0);
    const bg = new THREE.ExtrudeGeometry(shape, { depth: 0.10, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 10 });
    bg.translate(0, 0.01, -0.05);
    const backs = XS.map((x, i) => {
      const g = new THREE.Group(); g.position.set(x, 0.32, -0.36); g.rotation.x = -8 * DEG; P.whole.add(g);
      mesh(bg, cush, g);
      for (const [gx, gl] of [[-0.22, 0.30 + 0.01 * i], [0.22, 0.32 - 0.012 * i]]) { const gr = box(0.012, gl, 0.004, groove, g, gx, 0.04 + gl / 2 + 0.01 * (i % 2), 0.062); gr.castShadow = false; }
      return g;
    });
    // arms: half-round top (top 0.56), front scroll disc with its own spiral
    [[-1, spiralTex(1, 2.6, 0.4)], [1, spiralTex(-1, 3.1, 2.2)]].forEach(([s, sp]) => {
      const ax = s * 1.48;
      box(0.16, 0.37, 0.76, frame, P.whole, ax, 0.295, -0.12);
      { const t = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.76, 20), frame, P.whole, ax, 0.48, -0.12); t.rotation.x = Math.PI / 2; }
      { const d = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 24), frame, P.whole, ax, 0.48, 0.275); d.rotation.x = Math.PI / 2; }
      const face = mesh(new THREE.CircleGeometry(0.075, 28), new THREE.MeshStandardMaterial({ map: sp, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 }), P.whole, ax, 0.48, 0.2912);
      face.castShadow = false; face.material.userData.noHatch = true;
    });
    // the two stars (own canvases) and their halos; the gold border is lit by `glow` through its mask
    // each star: the lit satin star (its own colour canvas, a little self-lit so it reads on a seat top the key light barely reaches) and, over it, an additive
    // gold plane from the border mask that `glow` brightens (colour scaled: no opacity)
    const starMats = (size, spec) => {
      const colorT = starCanvas(size, "color", spec), maskT = starCanvas(size, "mask", spec);
      const lit = new THREE.MeshStandardMaterial({ map: colorT, roughness: 0.55, transparent: true, alphaTest: 0.02, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
        emissive: new THREE.Color("#ffffff"), emissiveMap: colorT, emissiveIntensity: 0.75 });
      const gl = new THREE.MeshBasicMaterial({ map: maskT, color: "#000000", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3 });
      for (const m of [lit, gl]) { m.userData.noOutline = true; m.userData.noHatch = true; m.fog = false; }
      gl.userData.glow = true; return { lit, gl };
    };
    const SA = starMats(0.34, { hatch: 40, gap: 14 }), SB = starMats(0.30, { hatch: -52, gap: 12 }), gold = new THREE.Color("#ffd23f");
    const star = (m, w, parent, x, y, z, rx) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.15, w * 1.15), m); o.rotation.x = rx; o.position.set(x, y, z); SEE(o); parent.add(o); return o; };
    star(SA.lit, 0.34, P.whole, 1.05, 0.321, -0.04, -Math.PI / 2); star(SA.gl, 0.34, P.whole, 1.05, 0.3225, -0.04, -Math.PI / 2).renderOrder = 3;
    star(SB.lit, 0.30, backs[3], 0, 0.24, 0.0615, 0); star(SB.gl, 0.30, backs[3], 0, 0.24, 0.0625, 0).renderOrder = 3;
    const hTex = GLOW_TEX(), hA = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), glowMat(hTex)), hB = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), glowMat(hTex));
    hA.rotation.x = -Math.PI / 2; hA.position.set(1.05, 0.328, -0.04); SEE(hA); hA.renderOrder = 3; P.whole.add(hA);
    hB.position.set(0, 0.24, 0.068); SEE(hB); hB.renderOrder = 3; backs[3].add(hB);
    const orange = new THREE.Color("#ff7a1c");
    // the Wizard's step (opt-in): wood sides, red felt top
    const stepG = new THREE.Group(); P.whole.add(stepG);
    { const w = mat("#3a2418", { roughness: 0.6 }), top = mat("#6f1620", { roughness: 0.95 }); w.userData.noHatch = true; top.userData.noHatch = true;
      mesh(new THREE.BoxGeometry(1.70, 0.40, 0.36), [w, w, top, w, w, w], stepG, 0.65, 0.20, -0.87); }
    return {
      grip: 0.32,
      apply(ps) {
        const gl = clamp(ps.glow ?? S.glow ?? 0);
        SA.gl.color.copy(gold).multiplyScalar(0.9 * gl); SB.gl.color.copy(gold).multiplyScalar(0.9 * gl);   // the gold border: emissive #ffd23f, x 1.6 of its own colour
        for (const h of [hA, hB]) { h.visible = gl > 0.01; h.material.color.copy(orange).multiplyScalar(0.35 * gl); }
        stepG.visible = !!(S.step || ps.step);
      },
    };
  },

  pingphone(P) {
    const S = P.spec, BODY = S.case ?? "#23242c", body = mat(BODY, { roughness: S.case ? 0.6 : 0.35, metalness: S.case ? 0 : 0.4 });
    mesh(new THREE.BoxGeometry(0.078, 0.155, 0.012), body, P.whole, 0, 0.0775, 0);
    const screenM = new THREE.MeshStandardMaterial({ color: "#16263a", roughness: 0.2, emissive: new THREE.Color("#3f7fb8"), emissiveIntensity: 0.3 });
    mesh(new THREE.PlaneGeometry(0.068, 0.138), screenM, P.whole, 0, 0.0775, 0.0062).castShadow = false;
    mesh(new THREE.BoxGeometry(0.03, 0.03, 0.006), mat("#3a3c46", { roughness: 0.3 }), P.whole, -0.016, 0.13, -0.008);
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.004, 16), mat("#0b0b10", { roughness: 0.1, metalness: 0.6 }), P.whole, -0.016, 0.13, -0.012).rotation.x = Math.PI / 2;
    // the bubbles: each its own canvas (rounded bar, one coloured dot, two grey lines, no letter), a flat unlit plane just over the screen
    const BW = 0.058, BH = 0.019, PITCH = 0.024, Y0 = 0.128, PPM = 4400, DOTS = ["#e0261c", "#ff8a1c", "#3f8fb0", "#6cbf3a", "#c9a0e8"];
    const bubbles = DOTS.map((dot, i) => {
      const tex = canvasTex(Math.round(BW * PPM), Math.round(BH * PPM), (g, w, h) => {
        const r = h / 2; g.fillStyle = "#f3ead2"; g.beginPath(); g.moveTo(r, 0); g.lineTo(w - r, 0); g.arc(w - r, r, r, -Math.PI / 2, Math.PI / 2); g.lineTo(r, h); g.arc(r, r, r, Math.PI / 2, Math.PI * 1.5); g.closePath(); g.fill();
        g.fillStyle = dot; g.beginPath(); g.arc(0.0115 * PPM, h / 2, 0.006 * PPM, 0, TAU); g.fill();
        g.strokeStyle = "#8a8f96"; g.lineWidth = 0.003 * PPM; g.lineCap = "round";
        for (const [dy, len] of [[-0.0042, 0.026], [0.0042, 0.016]]) { g.beginPath(); g.moveTo(0.024 * PPM, h / 2 + dy * PPM); g.lineTo((0.024 + len) * PPM, h / 2 + dy * PPM); g.stroke(); }
      });
      const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.05, toneMapped: false }); m.fog = false; m.userData.noOutline = true; m.userData.noHatch = true;
      const o = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), m); o.castShadow = o.receiveShadow = false; o.userData.solid = false; o.visible = false; o.renderOrder = 4; o.position.z = 0.0075; P.whole.add(o);
      return o;
    });
    const HALO = S.halo ?? 0.30, hm = glowMat(GLOW_TEX()), halo = new THREE.Mesh(new THREE.PlaneGeometry(HALO, HALO), hm), cA = new THREE.Color("#a9dcff");
    halo.position.set(0, 0.0775, 0.03); SEE(halo); halo.renderOrder = 3; P.whole.add(halo);
    return {
      grip: 0.05,
      apply(ps, tt) {
        const t = tt ?? 0, glow = clamp(ps.glow ?? S.glow ?? 1, 0, 1.4), pops = ps.pops ?? S.pops;
        // u_i 0..1: how far bubble i is into its appearing (0 = not there yet); the stack position is the sum, so older bubbles slide as a new one lands
        const u = bubbles.map((_, i) => (Array.isArray(pops) ? (pops[i] == null ? 0 : clamp(((t - pops[i]) * 30) / 4)) : clamp((ps.count ?? S.count ?? 0) - i)));
        const eff = u.reduce((a, b) => a + b, 0);
        let pulse = 0;
        bubbles.forEach((o, i) => {
          const ui = u[i], shown = Array.isArray(pops) ? pops[i] != null && t >= pops[i] : ui > 0;
          o.visible = shown;
          if (!shown) return;
          const k = 1 + 0.4 * (1 - ss(ui));   // 1.4 -> 1 over the pop
          o.scale.setScalar(k); o.position.y = Y0 - Math.max(0, eff - (i + 1)) * PITCH;
          if (ui > 0 && ui <= 0.75) pulse = 1;   // the halo's +30 % for the first 3 of the 4 pop frames
        });
        screenM.emissiveIntensity = 0.3 * glow;
        halo.visible = glow > 0.01; halo.scale.setScalar(1 + 0.3 * pulse); hm.color.copy(cA).multiplyScalar(0.5 * glow);
      },
    };
  },

  crystalball(P) {
    const S = P.spec, R = 0.10;
    // the glass: base #b9c8ff with 3 swirl strokes drawn once on the equirect map; the strokes are periodic in u, so the mesh turning about y keeps them seamless
    const tex = canvasTex(512, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#d4deff"); gr.addColorStop(0.5, "#b9c8ff"); gr.addColorStop(1, "#9fb0f2"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.lineCap = "round"; g.lineJoin = "round";
      [["#7f6bff", 0.42, 0.20, 0.0, 26], ["#e9f1ff", 0.55, 0.16, 2.1, 20], ["#7f6bff", 0.66, 0.18, 4.2, 16]].forEach(([c, y0, amp, ph, lw]) => {
        g.strokeStyle = c; g.lineWidth = lw; g.beginPath();
        for (let i = 0; i <= 120; i++) { const u = i / 120, x = u * w, y = (y0 + amp * Math.sin(u * TAU + ph) * (0.7 + 0.3 * Math.sin(u * TAU * 2 + ph))) * h; i ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.stroke();
      });
    });
    const glassM = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.12, metalness: 0.0, emissive: new THREE.Color("#b9c8ff"), emissiveMap: tex, emissiveIntensity: 1.0 }); glassM.userData.noHatch = true;
    const ball = mesh(new THREE.SphereGeometry(R, 40, 28), glassM, P.whole);
    // dish base and rim #5b4bd6 (lathe from the stand's bottom y -0.14 up to the rim, ring at y -0.085)
    const dark = mat("#5b4bd6", { roughness: 0.4, metalness: 0.2 });
    mesh(new THREE.LatheGeometry([[0.0, -0.14], [0.066, -0.14], [0.085, -0.126], [0.07, -0.108], [0.055, -0.09], [0.0, -0.09]].map(([x, y]) => new THREE.Vector2(x, y)), 32), dark, P.whole).material.side = THREE.DoubleSide;
    { const rim = mesh(new THREE.TorusGeometry(0.064, 0.012, 10, 36), dark, P.whole, 0, -0.082, 0); rim.rotation.x = Math.PI / 2; }
    // one highlight (upper left, toward the front)
    { const hl = mesh(new THREE.SphereGeometry(0.012, 10, 8), basic("#ffffff"), P.whole, -0.04, 0.045, 0.078); hl.scale.set(1.5, 0.8, 0.4); hl.rotation.z = 0.5; SEE(hl); hl.material.userData.noOutline = true; }
    // the halo: a camera-facing additive sprite 0.42 across, behind the glass
    const sm = new THREE.SpriteMaterial({ map: GLOW_TEX(), color: "#000000", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }); sm.userData.noOutline = true;
    const halo = new THREE.Sprite(sm); halo.scale.setScalar(0.42); halo.frustumCulled = false; halo.renderOrder = 3; SEE(halo); P.whole.add(halo);
    const cH = new THREE.Color("#9fb4ff");
    return {
      grip: -0.12,
      apply(ps, tt) {
        const t = tt ?? 0, gl = clamp(ps.glow ?? S.glow ?? 1, 0, 1.4);
        ball.rotation.y = -TAU * 0.3 * t;   // 0.3 turn/s on the clip clock
        glassM.emissiveIntensity = 0.25 + 0.15 * gl;
        halo.visible = gl > 0.01; sm.color.copy(cH).multiplyScalar(0.55 * gl);
      },
    };
  },
};

// named hand points in each prop's own frame (metres from its origin, before rot and scale), for arm poses { prop, grip: "name" }
export const HELLWAIT_GRIPS = {
  crystalball: { cup: [0, -0.12, 0] },
};
