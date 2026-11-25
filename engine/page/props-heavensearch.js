import * as THREE from "three";
import { clamp, rng } from "./util.js";

// Potato Desk 14 "Heaven reads your search history": the NEW pieces (storyboards/series/potato-desk/14-heaven-search/DESIGN.md section 2). Axes: x right, y up,
// +z toward the camera = DOWNHILL, metres; every size and hex colour is the DESIGN's. Station T = heaven-steps' T (origin = top edge of riser 100, y 0 = the terrace).
// Every mark (scuff, dent, soot, rivet, crust spot, chip) is placed once from a fixed seed. Everything animated is a pure function of the prop state and the
// clip time t the engine passes (seconds); the one blink is read off the frame number round(t x 30). No Math.random, no wall clock.
//
// STATE KEYS. propState already tweens: on, alarm, crack, open, lid. NOT known to it: type, row, press, typing: seed each with a dur-0 set at 0
// (c.prop(0, id, { type: 0 }, 0)) and a later tween blends; without the seed a tween steps at its `at`. A string key (text) always steps.
//
// searchscreen  origin the PANEL'S CENTRE. Place at T (-0.20, 4.64, -5.40), 0.6 in front of the gaterays card; it is pitched 15 deg forward (top toward +z)
//               INSIDE the prop (spec.pitch, default 15, degrees; 0 = upright): do not tip it again. Panel 4.40 x 1.20, gold tube frame 0.12 (outer 4.64 x 1.44, y 3.92..5.36
//               when placed), plain back #b8862a, 4 corner pearls r 0.09, the gate's crest top centre, a white wing at each upper corner (0.62 high, each its own drawing,
//               flutter 5 deg at 0.5 Hz), the whole screen bobs 0.03 at 0.25 Hz (phases 0 at t 0). The page, bar and magnifier are unlit paint (no bloom).
//               Keys: spec.text (default "") or the state key `text` (a string with ONE "\n", at most 2 lines x 24 characters, lower case; a c.prop set steps it);
//               `type` 0..1 (seed it at 0; default spec.type 0): letters shown = floor(type x letter count) (the "\n" is not a letter);
//               `on` 0..1 (propState starts it at 0 = standby, spec.on is NOT read: tween 0 -> 1 linear over 6 frames = the flicker 0.6, 0.2, 1);
//               `alarm` 0..1 (outline #b9c4d0 -> #d3261e, 0.022 -> 0.05 wide); `typing` (optional, seed at 0, step it to 1 while the line is typed and back to 0 at the end:
//               the cursor is solid while typing 1, else 12 frames on / 12 off from the frame number; without the key the cursor is solid while 0 < type < 1, blinking at 0 and 1).
//               Cap height = min(0.26, 3.30 / (0.76 x chars of the longer line)), line pitch 1.55 cap, left-aligned in a 3.30 x 0.72 box 0.66 in from the bar's left end;
//               a line wider than the box is squeezed to fit. Not solid, not hand-held.
// gatetrap      origin the OPENING'S CENTRE on the terrace top (y 0). Place at T (-0.20, 0, -1.40) = the centre of the terrace's inlay ring. Gold rim ring r 0.52..0.62, 0.015 proud,
//               6 rivets, hinge knuckles front (+z) and back (-z); two half-disc leaves r 0.52 x 0.04 hinged on the rim at +z / -z, seam along x (a 0.006 dark line when shut).
//               `crack` 0..1 (propState tweens, default 0): each leaf draws back crack x 0.05 under the rim (slot 0.006 -> 0.10), slot light #ffd23f / #ff7a1c, leak band
//               inside the rim, halo r 0.45 -> 0.70 + 0.25 crack (12 segments, 8 % flicker), light fan standing in the slot, floor pool r 0.8 + 0.6 crack. The leaves stay flat.
//               `open` 0..1 (range -0.05..1.10, tweens, default 0): both leaves swing DOWN 86 deg on their rim hinges; the shaft (r 0.52, 1.80 deep, drawn on its inside only),
//               a floor disc, light fan 1.3 x 1.5 and pool r 1.5 show from open 0.02; the slot light fades out by open 0.25. The leaves are solid only while open < 0.05.
//               The terrace needs its hole: heaventerrace spec hole [-0.20, -1.40, 0.52] (the shaft is drawn 0.004 inside it). The `embers` box over the opening is NOT part of this prop: the clip places the existing `embers` kind there.
// searchtablet  the gold wordless LANDSCAPE tablet 0.40 x 0.28 x 0.018 (x, z, thickness). Origin the CENTRE OF ITS UNDERSIDE, lying; screen up (+y), page top toward -z; the 14 deg tilt
//               to the lens (back edge raised, tipped about the front bottom edge so it never sinks into the podium: back edge top y 0.505) is INSIDE the prop (spec.tilt14 default 14). Place at podium-local (-0.07, 0.42, +0.02) = T (0.98, 0.42, -0.78).
//               Gold bezel #e8b93a (0.018 wide), edge light #ffe89a, raised halo ring r 0.06 on the back, page #fffbe8, 6 rows pitch 0.038. `row` 0..6 (seed it at 0, default spec.row):
//               a highlight bar #ffd76a 0.034 high on that row, the rows it has left at 35 %; a fraction slides the bar between rows. Row 6 is red #c8362f. No grips.
// casserole     0.31 across the ears x 0.15 high (knob top), origin the BOTTOM CENTRE of the dish. Dish r 0.12 x 0.085, blue enamel #3f7fb5 (shade #2c5d8a), cream rim band #f3ead2,
//               two ear handles (x +-0.155 tips, y 0.065, 0.06 wide), lid dome 0.04 with a cream knob (top 0.15), a red heart on the lid centre toward -z (the lens side of a held prop,
//               R-POV sees it from above), one enamel chip on the rim. `lid` 0..1 (tweens, default spec.lid 0): the lid slides 0.03 toward +z and tips 18 deg (its -z edge up),
//               showing the crust #d9a441 with 4 spots. HELD by both gloves on the ears all clip: box hold, SIZE casserole { w 0.31, h 0.118, d 0.24 } (grips.mjs):
//               grips.box(c, "chip", spec, { gap: 0.03 }) puts the palms on the ear tips (y 0.065 = height 0.55 x 0.118). HSEARCH_GRIPS.casserole: earL, earR.
// hellbutton    origin the BASE'S BOTTOM CENTRE (place at podium-local (+0.21, 0.42, -0.08) = T (1.26, 0.42, -0.88)). Base ring r 0.105 x 0.03 #8f1f1c with a gold lip #e8b93a, dome r 0.085 x 0.05
//               #f6c744 (light #fff3b0, shade #b8862a). `press` 0..1 (seed it at 0; default spec.press): the dome sinks 0.028 and a ring 0.012 wide #ff3b22 lights round it. Not held.

const DEG = Math.PI / 180, TAU = Math.PI * 2;
const FONTC = (f) => `800 ${f}px "DejaVu Sans Condensed", "DejaVu Sans", "Liberation Sans Narrow", Arial, sans-serif`;
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
const gold = (c = "#e8b93a", k = 0.18) => mat(c, { roughness: 0.4, metalness: 0.3, emissive: new THREE.Color(c), emissiveIntensity: k });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const ss = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const lerpC = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), clamp(t));
const hex = (c) => `#${c.getHexString()}`;
const see = (root) => root.traverse((o) => { if (o.isMesh) { o.userData.solid = false; o.userData.steam = true; o.castShadow = false; } });
// unlit paint on a face: no bloom, no outline, fog off
const paint = (o = {}) => { const m = new THREE.MeshBasicMaterial({ toneMapped: false, polygonOffset: true, ...o }); m.fog = false; m.userData.noOutline = true; m.userData.noHatch = true; m.userData.outlineParameters = { visible: false }; return m; };
// light and air: see-through, unlit, normal blending (additive vanishes on cream marble)
const lightMat = (o = {}) => { const m = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, ...o }); m.fog = false; m.userData.noOutline = true; m.userData.noHatch = true; m.userData.outlineParameters = { visible: false }; return m; };
const flat = (o, order = 3) => { o.castShadow = false; o.receiveShadow = false; o.renderOrder = order; o.userData.solid = false; o.userData.steam = true; return o; };
function plane(w, h, m, parent, x, y, z, rx = 0, order = 3) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.x = rx; o.renderOrder = order; parent.add(o); return o; }
function tint(geo, fn) {
  const p = geo.attributes.position, n = geo.attributes.normal, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const k = fn(p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i)); c[i * 3] = k.r; c[i * 3 + 1] = k.g; c[i * 3 + 2] = k.b; }
  geo.setAttribute("color", new THREE.BufferAttribute(c, 3)); return geo;
}
const vmat = (o = {}) => new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.55, ...o });
const lathe = (prof, seg = 48) => new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), seg);
// a rounded rectangle centred on the origin drawn into a Shape or a Path
function rrPath(s, w, h, r) {
  const x = w / 2, y = h / 2;
  s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0, false); s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2, false);
  s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI, false); s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5, false); return s;
}
function rrCanvas(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const star4 = (g, cx, cy, R, r0) => { g.beginPath(); for (let i = 0; i < 8; i++) { const a = (i * 45 - 90) * DEG, rr = i % 2 ? r0 : R; g[i ? "lineTo" : "moveTo"](cx + rr * Math.cos(a), cy + rr * Math.sin(a)); } g.closePath(); };
const pearlGeo = (r) => tint(new THREE.SphereGeometry(r, 20, 14), (x, y, z, nx, ny) => lerpC("#d9d2e0", "#fbf8f2", (ny + 0.45) / 1.1));

// ================================================================= searchscreen
const FLICK = [[0, 0], [1 / 3, 0.6], [2 / 3, 0.2], [1, 1]];   // `on` -> brightness: tweened linearly over 6 frames it reads 0.6, 0.2, 1
const flicker = (o) => { o = clamp(o); for (let i = 1; i < FLICK.length; i++) if (o <= FLICK[i][0]) { const [a, b] = FLICK[i - 1], [c, d] = FLICK[i]; return b + ((d - b) * (o - a)) / (c - a); } return 1; };

function wingMesh(sd, seed) {
  const r = rng(seed), H = 0.62;
  const ROWS = [   // [angle from "out", length] shingled: primaries at the back, secondaries, coverts in front
    [[26, 0.58], [38, 0.60], [50, 0.62], [62, 0.61], [74, 0.57], [85, 0.50]],
    [[32, 0.40], [44, 0.42], [56, 0.43], [68, 0.41], [80, 0.37]],
    [[40, 0.24], [52, 0.25], [64, 0.25], [76, 0.23], [86, 0.20]],
  ];
  const F = [];
  ROWS.forEach((row, layer) => row.forEach(([deg, L0]) => {
    const ang = (deg + (r() - 0.5) * 5) * DEG, L = L0 * (0.97 + 0.06 * r()), W = [0.10, 0.092, 0.08][layer] * (0.92 + 0.16 * r()), curl = (r() - 0.5) * 0.12, left = [], right = [], m = 10;
    for (let j = 0; j <= m; j++) { const u = j / m, w = (W / 2) * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.6)), 0.4), cc = curl * L * u * u; left.push([u * L, cc - w]); right.push([u * L, cc + w]); }
    const loc = [...left, ...right.reverse()], ca = Math.cos(ang), sa = Math.sin(ang), j0 = F.filter((f) => f.layer === layer).length * 0.03;
    F.push({ layer, pts: loc.map(([s, t]) => [j0 + s * ca - t * sa, 0.0 + s * sa + t * ca]), base: [j0, 0], tip: [j0 + L * ca, L * sa] });
  }));
  let a1 = 0, b1 = 0; for (const f of F) for (const [a, b] of f.pts) { a1 = Math.max(a1, a); b1 = Math.max(b1, b); }
  const k = H / b1, WA = a1 * k, pad = 0.01, CWm = WA + 2 * pad, CHm = H + 2 * pad, PPM = 700, W = Math.round(CWm * PPM), Hh = Math.round(CHm * PPM);
  const X = (a) => (sd > 0 ? (a * k + pad) : (WA - a * k + pad)) * PPM, Y = (b) => (CHm - pad - b * k) * PPM;
  const tex = canvasTex(W, Hh, (g) => {
    g.lineJoin = "round"; g.lineCap = "round";
    for (const f of [...F].sort((p, q) => p.layer - q.layer)) {
      g.beginPath(); f.pts.forEach(([a, b], j) => g[j ? "lineTo" : "moveTo"](X(a), Y(b))); g.closePath();
      const gr = g.createLinearGradient(X(f.base[0]), Y(f.base[1]), X(f.tip[0]), Y(f.tip[1])); gr.addColorStop(0, f.layer === 2 ? "#f1eee8" : "#dfe3ee"); gr.addColorStop(f.layer === 2 ? 0.5 : 0.8, f.layer === 2 ? "#fbf8f0" : "#f1f1f4"); gr.addColorStop(1, "#fbf8f0");
      g.fillStyle = gr; g.fill(); g.lineWidth = 2.4; g.strokeStyle = "#cfc6b0"; g.stroke();
      const ux = f.tip[0] - f.base[0], uy = f.tip[1] - f.base[1];
      g.lineWidth = 2.4; g.beginPath(); g.moveTo(X(f.base[0] + ux * 0.06), Y(f.base[1] + uy * 0.06)); g.lineTo(X(f.base[0] + ux * 0.9), Y(f.base[1] + uy * 0.9)); g.stroke();
    }
  });
  const m = paint({ map: tex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, polygonOffsetFactor: -1 });
  const grp = new THREE.Group(), o = new THREE.Mesh(new THREE.PlaneGeometry(CWm, CHm), m);
  o.position.set(sd * (WA / 2 + (sd > 0 ? 0 : 0)), CHm / 2 - pad, 0); o.userData.solid = false; o.renderOrder = 1; grp.add(o);   // the root (the planform's inner bottom corner) is the group's origin
  return grp;
}

function searchscreen(P) {
  const S = P.spec, PPM = 300, PW = 4.40, PH = 1.20, CW = Math.round(PW * PPM), CH = Math.round(PH * PPM);
  const pit = new THREE.Group(); pit.rotation.x = (S.pitch ?? 15) * DEG; P.whole.add(pit);
  const bob = new THREE.Group(); pit.add(bob);
  // glow card behind the frame (lit: 30 % x on)
  const glowT = canvasTex(256, 112, (g, w, h) => { g.save(); g.scale(1, h / w); const q = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); q.addColorStop(0, "rgba(255,246,208,1)"); q.addColorStop(0.55, "rgba(255,246,208,0.7)"); q.addColorStop(1, "rgba(255,246,208,0)"); g.fillStyle = q; g.fillRect(0, 0, w, w); g.restore(); });
  const glowM = lightMat({ map: glowT, opacity: 0 }), glow = flat(plane(5.6, 2.4, glowM, bob, 0, 0, -0.12, 0, 1));
  // frame: tube r 0.06 round the 4.40 x 1.20 page (outer 4.64 x 1.44), shade back, pearls, crest, wings
  const G = gold(), GS = mat("#b8862a", { roughness: 0.6 }), GL = gold("#ffe89a", 0.2);
  const HX = PW / 2 + 0.06, HY = PH / 2 + 0.06, RT = 0.06;
  for (const sy of [-1, 1]) { const o = mesh(new THREE.CylinderGeometry(RT, RT, 2 * HX, 20), G, bob, 0, sy * HY, 0); o.rotation.z = Math.PI / 2; const l = mesh(new THREE.CylinderGeometry(0.008, 0.008, 2 * HX - 0.2, 6), GL, bob, 0, sy * HY + 0.012, 0.054); l.rotation.z = Math.PI / 2; l.castShadow = false; }
  for (const sx of [-1, 1]) { mesh(new THREE.CylinderGeometry(RT, RT, 2 * HY, 20), G, bob, sx * HX, 0, 0); const l = mesh(new THREE.CylinderGeometry(0.008, 0.008, 2 * HY - 0.2, 6), GL, bob, sx * HX - 0.012, 0, 0.054); l.castShadow = false; }
  const pearlM = vmat({ roughness: 0.3, emissive: new THREE.Color("#fbf8f2"), emissiveIntensity: 0.22 }); pearlM.userData.noHatch = true;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) { mesh(new THREE.SphereGeometry(RT, 14, 10), G, bob, sx * HX, sy * HY, 0); mesh(pearlGeo(0.09), pearlM, bob, sx * HX, sy * HY, 0.05); }
  const back = mesh(new THREE.BoxGeometry(2 * HX + 0.12, 2 * HY + 0.12, 0.02), GS, bob, 0, 0, -0.05); back.userData.solid = false;
  const crestT = canvasTex(256, 256, (c, w, h) => {
    const cx = w / 2, cy = h / 2, R = w / 2 - 2;
    c.fillStyle = "#e8b93a"; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill(); c.strokeStyle = "#b8862a"; c.lineWidth = 5; c.beginPath(); c.arc(cx, cy, R - 3, 0, TAU); c.stroke();
    c.fillStyle = "#ffe89a";
    for (let i = 0; i < 7; i++) { const a = (-90 + i * (360 / 7) + 10) * DEG, a0 = a - 0.19, a1 = a + 0.19; c.beginPath(); c.moveTo(cx + R * 0.5 * Math.cos(a0), cy + R * 0.5 * Math.sin(a0)); c.lineTo(cx + R * 0.93 * Math.cos(a), cy + R * 0.93 * Math.sin(a)); c.lineTo(cx + R * 0.5 * Math.cos(a1), cy + R * 0.5 * Math.sin(a1)); c.closePath(); c.fill(); }
    c.fillStyle = "#fbf8f0"; star4(c, cx, cy, R * 0.5, R * 0.15); c.fill(); c.strokeStyle = "#b8862a"; c.lineWidth = 3; c.stroke();
  });
  const crest = plane(0.26, 0.26, paint({ map: crestT, transparent: true, alphaTest: 0.5, polygonOffsetFactor: -2 }), bob, 0, HY, 0.066, 0, 4); crest.userData.solid = false;
  const wings = [-1, 1].map((sd) => { const w = wingMesh(sd, sd > 0 ? 311 : 523); w.position.set(sd * (HX - 0.02), HY - 0.34, -0.075); bob.add(w); return { w, sd }; });
  // the page, drawn on a canvas: redrawn only when its inputs change
  const pageT = canvasTex(CW, CH, () => {}), cv = pageT.image, g = cv.getContext("2d");
  const pageM = paint({ map: pageT, polygonOffsetFactor: -1 }); const page = plane(PW, PH, pageM, bob, 0, 0, -0.038, 0, 0); page.userData.solid = false;
  const px = (x) => (x + PW / 2) * PPM, py = (y) => (PH / 2 - y) * PPM;
  g.font = FONTC(100); const CAPR = g.measureText("H").actualBoundingBoxAscent / 100 || 0.729;
  let drawn = null;
  const draw = (eff, alarm, text, n, cursor) => {
    const pg = lerpC("#3b4660", "#e9eef5", eff), k = 0.25 + 0.75 * eff;
    g.clearRect(0, 0, CW, CH); g.fillStyle = hex(pg); g.fillRect(0, 0, CW, CH);
    const bar = hex(pg.clone().lerp(new THREE.Color("#ffffff"), k)), edge = lerpC("#b9c4d0", "#d3261e", alarm);
    rrCanvas(g, px(-2.05), py(0.46), 4.10 * PPM, 0.92 * PPM, 0.22 * PPM); g.fillStyle = bar; g.fill();
    g.lineWidth = (0.022 + 0.028 * alarm) * PPM; g.strokeStyle = hex(pg.clone().lerp(edge, k)); g.stroke();
    // the magnifier: ring r 0.14 stroke 0.045, handle 0.16 at 45 deg, 0.34 from the bar's left end
    g.save(); g.globalAlpha = k; g.strokeStyle = "#5a6b7a"; g.lineCap = "round"; g.lineWidth = 0.045 * PPM;
    const mx = -2.05 + 0.34 - 0.04, my = 0.035; g.beginPath(); g.arc(px(mx), py(my), 0.14 * PPM, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(px(mx + 0.14 * Math.SQRT1_2), py(my - 0.14 * Math.SQRT1_2)); g.lineTo(px(mx + (0.14 + 0.16) * Math.SQRT1_2), py(my - (0.14 + 0.16) * Math.SQRT1_2)); g.stroke(); g.restore();
    if (eff < 0.5) return;
    const lines = text.split("\n").slice(0, 2), longest = Math.max(1, ...lines.map((l) => l.length));
    const cap = Math.min(0.26, 3.30 / (0.76 * longest)), fpx = (cap * PPM) / CAPR, pitch = 1.55 * cap, block = cap + (lines.length - 1) * pitch, x0 = px(-2.05 + 0.66);
    g.font = FONTC(fpx); g.textAlign = "left"; g.textBaseline = "alphabetic";
    const xs = Math.min(1, (3.30 * PPM) / Math.max(1, ...lines.map((l) => g.measureText(l).width)));
    const base = (i) => py(block / 2 - cap - pitch * i);
    g.save(); g.globalAlpha = clamp((eff - 0.5) / 0.5); g.fillStyle = "#1f2a36";
    const offs = [0, (lines[0] || "").length], subs = lines.map((l, i) => l.slice(0, Math.max(0, Math.min(l.length, n - offs[i])))), ci = lines.length > 1 && n > lines[0].length ? 1 : 0;
    subs.forEach((sub, i) => { if (sub) { g.save(); g.translate(x0, base(i)); g.scale(xs, 1); g.fillText(sub, 0, 0); g.restore(); } });
    if (cursor) g.fillRect(x0 + g.measureText(subs[ci]).width * xs + 0.004 * PPM, base(ci) - 1.075 * cap * PPM, 0.035 * PPM, 1.15 * cap * PPM);
    g.restore();
  };
  draw(0, 0, "", 0, false);
  return {
    grip: 0,
    apply(ps, t) {
      const eff = flicker(ps.on ?? 0), alarm = clamp(ps.alarm ?? 0), text = typeof ps.text === "string" ? ps.text : (S.text ?? ""), type = clamp(ps.type ?? S.type ?? 0);
      const count = text.replace(/\n/g, "").length, n = Math.min(count, Math.floor(type * count + 1e-9)), moving = ps.typing != null ? ps.typing > 0.5 : type > 0.001 && type < 0.999;
      const fr = Math.round(t * 30), cursor = eff >= 0.5 && (moving || fr % 24 < 12);
      const key = `${Math.round(eff * 24)}|${Math.round(alarm * 24)}|${text}|${n}|${cursor}`;
      if (key !== drawn) { drawn = key; draw(Math.round(eff * 24) / 24, Math.round(alarm * 24) / 24, text, n, cursor); pageT.needsUpdate = true; }
      glowM.opacity = 0.30 * eff; glow.visible = eff > 0.01;
      bob.position.y = 0.03 * Math.sin(TAU * 0.25 * t);
      for (const { w, sd } of wings) w.rotation.z = -sd * 5 * DEG * Math.sin(TAU * 0.5 * t);
    },
  };
}

// ================================================================= gatetrap
const RT = 0.52, LEAF_T = 0.04, LEAF_TOP = 0.0138, RIM_H = 0.015;
function leafGeo(front) {   // a half disc r 0.52, seam edge on z 0, top face y 0, 0.04 thick downward; the cap UVs cover the canvas (x -R..R, z 0..R | -R..0)
  const s = new THREE.Shape(); s.moveTo(RT, 0); s.absarc(0, 0, RT, 0, Math.PI, false); s.lineTo(RT, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: LEAF_T, bevelEnabled: false, curveSegments: 40 });
  g.rotateX(Math.PI / 2);   // shape y -> +z, the extrusion down; the back leaf is the same half turned 180 about y (arc toward -z)
  if (!front) g.rotateY(Math.PI);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + RT) / (2 * RT), front ? 1 - p.getZ(i) / RT : 1 - (p.getZ(i) + RT) / RT);
  return g;
}
function gatetrap(P) {
  const r = rng(1414);
  const rimG = gold("#d9a93a", 0.15), lightG = gold("#ffe89a", 0.2), shadeG = mat("#b8862a", { roughness: 0.6 });
  // rim ring r 0.52..0.62, 0.015 proud, inner bevel light, outer wall shade
  const ring = new THREE.Group(); P.whole.add(ring);
  const dbl = (m) => { m.side = THREE.DoubleSide; return m; }, ns = (o) => { o.userData.solid = false; return o; };
  ns(mesh(lathe([[0.54, RIM_H], [0.62, RIM_H]], 64), dbl(rimG), ring));
  ns(mesh(lathe([[0.54, RIM_H], [0.52, 0.006], [0.52, 0]], 64), dbl(lightG), ring));
  ns(mesh(lathe([[0.62, RIM_H], [0.62, 0]], 64), dbl(shadeG), ring));
  for (const a of [14, 71, 128, 203, 262, 321]) ns(mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.004, 10), lightG, ring, 0.575 * Math.sin(a * DEG), RIM_H + 0.002, 0.575 * Math.cos(a * DEG))).castShadow = false;
  for (const sz of [-1, 1]) { const o = ns(mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.16, 12), rimG, ring, 0, RIM_H + 0.010, sz * 0.57)); o.rotation.z = Math.PI / 2; }
  // leaves: each its own canvas (sheen, engraved line, scuffs / soot / dent placed once)
  const PPM = 300, mkLeaf = (front, seed) => {
    const rr = rng(seed), W = Math.round(2 * RT * PPM), H = Math.round(RT * PPM);
    const tex = canvasTex(W, H, (g) => {   // canvas top = the seam (front) / the far rim (back: top is z -R, the seam is the bottom)
      g.fillStyle = "#e8b93a"; g.fillRect(0, 0, W, H);
      const X = (x) => (x + RT) * PPM, Z = (z) => (front ? z : RT + z) * PPM;   // z in 0..R (front) or -R..0 (back)
      const sgn = front ? 1 : -1;
      g.save(); g.strokeStyle = "rgba(255,232,154,0.12)"; g.lineWidth = 0.03 * PPM; g.lineCap = "round"; g.beginPath(); g.arc(X(0), Z(0), (0.30 + 0.04 * rr()) * PPM, (front ? 0.25 : Math.PI + 0.45) , (front ? 0.95 : Math.PI + 1.15)); g.stroke(); g.restore();
      { const ex = front ? -(RT - 0.06) : (RT - 0.06); g.strokeStyle = "#b8862a"; g.lineWidth = 0.01 * PPM; g.beginPath(); g.arc(X(0), Z(0), (RT - 0.06) * PPM, front ? 0 : Math.PI, front ? Math.PI : TAU); g.lineTo(X(ex), Z(sgn * 0.06)); g.lineTo(X(-ex), Z(sgn * 0.06)); g.closePath(); g.stroke(); }
      if (front) for (const [x, z, a, l] of [[-0.20, 0.22, 0.4, 0.07], [0.12, 0.31, -0.3, 0.06], [0.24, 0.14, 0.9, 0.05]]) { g.strokeStyle = "#c99a2e"; g.lineWidth = 0.012 * PPM; g.lineCap = "round"; g.beginPath(); g.moveTo(X(x), Z(z)); g.lineTo(X(x + l * Math.cos(a)), Z(z + l * Math.sin(a))); g.stroke(); }   // 3 sole scuffs
      else { const q = g.createRadialGradient(X(0.19), Z(-0.20), 0, X(0.19), Z(-0.20), 0.045 * PPM); q.addColorStop(0, "rgba(184,134,42,0.55)"); q.addColorStop(0.7, "rgba(255,232,154,0.3)"); q.addColorStop(1, "rgba(232,185,58,0)"); g.fillStyle = q; g.beginPath(); g.arc(X(0.19), Z(-0.20), 0.045 * PPM, 0, TAU); g.fill(); }   // one dent
      g.fillStyle = "rgba(107,74,43,0.25)"; g.beginPath(); g.ellipse(X(0), Z(0), 0.15 * PPM, 0.045 * PPM, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); g.fill();   // the soot crescent on the seam's middle 0.30
    });
    const top = paint({ map: tex, polygonOffsetFactor: 0 });   // unlit gold paint: a lit one goes olive under the look's tone map
    const edge = gold("#b8862a", 0.1), m = mesh(leafGeo(front), [top, edge], new THREE.Group());
    m.receiveShadow = false;
    return m;
  };
  const hinges = [1, -1].map((sz, i) => {
    const h = new THREE.Group(); P.whole.add(h);
    const lf = mkLeaf(sz > 0, i ? 902 : 901); lf.removeFromParent(); lf.position.set(0, 0, -sz * RT); h.add(lf);   // leaf geometry has its seam on z 0: hang it so the seam is -sz * R from the hinge
    return { h, lf, sz };
  });
  // slot, leak band, halo, fan, pool (all unlit, see-through)
  const slotDark = flat(plane(1.12, 1, lightMat({ color: "#6b4a2b", opacity: 1 }), P.whole, 0, 0.0100, 0, -Math.PI / 2, 2));
  const slotGlowT = canvasTex(4, 32, (g, w, h) => { const q = g.createLinearGradient(0, 0, 0, h); q.addColorStop(0, "#ff7a1c"); q.addColorStop(0.3, "#ffd23f"); q.addColorStop(0.7, "#ffd23f"); q.addColorStop(1, "#ff7a1c"); g.fillStyle = q; g.fillRect(0, 0, w, h); });
  const slotGlowM = lightMat({ map: slotGlowT, opacity: 0 }), slotGlow = flat(plane(1.12, 1, slotGlowM, P.whole, 0, 0.0104, 0, -Math.PI / 2, 2));
  const leakM = lightMat({ color: "#ff7a1c", opacity: 0 }); let leakW = -1, leak = null;
  const fanT = canvasTex(64, 64, (g, w, h) => { const q = g.createLinearGradient(0, h, 0, 0); q.addColorStop(0, "rgba(255,177,74,1)"); q.addColorStop(0.5, "rgba(255,177,74,0.45)"); q.addColorStop(1, "rgba(255,177,74,0)"); g.fillStyle = q; g.fillRect(0, 0, w, h); g.globalCompositeOperation = "destination-in"; const e = g.createLinearGradient(0, 0, w, 0); e.addColorStop(0, "rgba(0,0,0,0)"); e.addColorStop(0.18, "rgba(0,0,0,1)"); e.addColorStop(0.82, "rgba(0,0,0,1)"); e.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = e; g.fillRect(0, 0, w, h); });
  const fanM = lightMat({ map: fanT, color: "#ffffff", opacity: 0, side: THREE.DoubleSide }), fanG = new THREE.PlaneGeometry(1.04, 1).translate(0, 0.5, 0), fan = flat(new THREE.Mesh(fanG, fanM), 5); P.whole.add(fan);
  const poolT = canvasTex(128, 128, (g, w, h) => { const q = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); q.addColorStop(0, "rgba(255,255,255,1)"); q.addColorStop(0.6, "rgba(255,255,255,0.5)"); q.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = q; g.fillRect(0, 0, w, h); });
  const poolM = lightMat({ map: poolT, color: "#ff9a2e", opacity: 0 }), pool = flat(plane(2, 2, poolM, P.whole, 0, 0.0028, 0, -Math.PI / 2, 1));
  // halo: 12 sectors, radial profile 0 at r 0.45, full at the rim, fading out; its outer radius follows crack
  const profT = canvasTex(4, 128, (g, w, h) => { const im = g.createImageData(w, h); for (let j = 0; j < h; j++) { const v = j / (h - 1), a = v < 0.2 ? ss(v / 0.2) : 0.5 + 0.5 * Math.cos(Math.PI * ((v - 0.2) / 0.8)); for (let i = 0; i < w; i++) im.data.set([255, 255, 255, Math.round(a * 255)], (j * w + i) * 4); } g.putImageData(im, 0, 0); });
  const NS = 12, NA = 6, haloRad = (outer) => [0.45, 0.50, 0.54, ...[1, 2, 3, 4, 5].map((k) => 0.54 + ((outer - 0.54) * k) / 5)], haloV = [0, 0.1, 0.2, 0.36, 0.52, 0.68, 0.84, 1];
  const halo = Array.from({ length: NS }, (_, s) => {
    const geo = new THREE.BufferGeometry(), nv = 8 * (NA + 1), pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = [];
    for (let j = 0; j < 8; j++) for (let a = 0; a <= NA; a++) uv.set([a / NA, haloV[j]], (j * (NA + 1) + a) * 2);
    for (let j = 0; j < 7; j++) for (let a = 0; a < NA; a++) { const i0 = j * (NA + 1) + a, i1 = i0 + 1, i2 = i0 + NA + 1, i3 = i2 + 1; idx.push(i0, i2, i1, i1, i2, i3); }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
    const m = lightMat({ map: profT, color: "#ff7a1c", opacity: 0, side: THREE.DoubleSide }), o = flat(new THREE.Mesh(geo, m), 6); o.position.y = RIM_H + 0.0015; o.frustumCulled = false; P.whole.add(o);
    return { geo, m, a0: (s / NS) * TAU, f: 1.3 + 1.8 * r(), ph: TAU * r(), outer: -1 };
  });
  const setHalo = (h, outer) => {
    if (Math.abs(h.outer - outer) < 1e-4) return; h.outer = outer; const p = h.geo.attributes.position, rad = haloRad(outer);
    for (let j = 0; j < 8; j++) for (let a = 0; a <= NA; a++) { const an = h.a0 + (a / NA) * (TAU / NS) * 1.0; p.setXYZ(j * (NA + 1) + a, rad[j] * Math.sin(an), 0, rad[j] * Math.cos(an)); }
    p.needsUpdate = true;
  };
  // the open trapdoor: shaft (inside only), floor, fan, pool
  const shaft = new THREE.Group(); shaft.visible = false; P.whole.add(shaft);
  const shaftT = canvasTex(8, 128, (g, w, h) => { const q = g.createLinearGradient(0, 0, 0, h); q.addColorStop(0, "#ffb14a"); q.addColorStop(0.6, "#ff6a13"); q.addColorStop(1, "#8f1f1c"); g.fillStyle = q; g.fillRect(0, 0, w, h); });
  const wallM = new THREE.MeshBasicMaterial({ map: shaftT, side: THREE.BackSide, toneMapped: false }); wallM.fog = false; wallM.userData.noOutline = true; wallM.userData.outlineParameters = { visible: false };
  const sw = new THREE.Mesh(new THREE.CylinderGeometry(RT - 0.004, RT - 0.004, 1.8, 48, 1, true), wallM); sw.position.y = -0.9; sw.userData.solid = false; shaft.add(sw);
  const floorT = canvasTex(64, 64, (g, w, h) => { const q = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); q.addColorStop(0, "#ffd23f"); q.addColorStop(1, "#ff7a1c"); g.fillStyle = q; g.fillRect(0, 0, w, h); });
  const fl = new THREE.Mesh(new THREE.CircleGeometry(RT, 40), paint({ map: floorT })); fl.rotation.x = -Math.PI / 2; fl.position.y = -1.79; fl.userData.solid = false; shaft.add(fl);
  const ofanM = lightMat({ map: fanT, color: "#ffffff", opacity: 0, side: THREE.DoubleSide }), ofan = flat(new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.5).translate(0, 0.75, 0), ofanM), 5); P.whole.add(ofan);
  const opoolT = canvasTex(128, 128, (g, w, h) => { const q = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); q.addColorStop(0, "rgba(255,255,255,1)"); q.addColorStop(0.6, "rgba(255,255,255,0.5)"); q.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = q; g.fillRect(0, 0, w, h); g.globalCompositeOperation = "destination-out"; g.beginPath(); g.arc(w / 2, h / 2, 0.36 * (w / 2), 0, TAU); g.fill(); });   // the pool r 1.5 with the opening left clear
  const opoolM = lightMat({ map: opoolT, color: "#ff9a2e", opacity: 0 }), opool = flat(plane(3, 3, opoolM, P.whole, 0, 0.0027, 0, -Math.PI / 2, 1));
  return {
    grip: 0,
    apply(ps, t) {
      const cr = clamp(ps.crack ?? 0), op = clamp(ps.open ?? 0, -0.05, 1.10), ok = ss(op / 0.25), shift = 0.003 + 0.047 * cr;
      for (const { h, lf, sz } of hinges) { h.position.set(0, LEAF_TOP, sz * (RT + shift)); h.rotation.x = -sz * op * 86 * DEG; lf.userData.solid = op < 0.05; }
      const sl = 1 - ok;   // the slot's light, leak band and fan stand only while the leaves lie near shut
      const sw2 = 2 * shift; slotDark.scale.set(1, sw2, 1); slotDark.visible = sl > 0.01; slotDark.material.opacity = sl;
      slotGlow.scale.set(1, sw2, 1); slotGlowM.opacity = ss(cr / 0.1) * sl; slotGlow.visible = slotGlowM.opacity > 0.01;
      const lw = 0.004 + 0.026 * cr; if (Math.abs(lw - leakW) > 1e-5) { leakW = lw; if (leak) { leak.removeFromParent(); leak.geometry.dispose(); } leak = flat(new THREE.Mesh(new THREE.RingGeometry(RT - lw, RT, 56), leakM), 2); leak.rotation.x = -Math.PI / 2; leak.position.y = LEAF_TOP + 0.0015; P.whole.add(leak); }
      leakM.opacity = ss(cr / 0.08) * sl; leak.visible = leakM.opacity > 0.01;
      const fh = 0.08 + 0.42 * cr; fan.scale.set(1, fh, 1); fanM.opacity = 0.5 * cr * sl; fan.visible = fanM.opacity > 0.005;
      const pr = 0.8 + 0.6 * cr; pool.scale.set(2 * pr / 2, 2 * pr / 2, 1); poolM.opacity = 0.30 * cr; pool.visible = cr > 0.005;
      const hk = 0.12 + 0.38 * cr;
      halo.forEach((h) => { setHalo(h, 0.70 + 0.25 * cr); h.m.opacity = hk * (1 + 0.08 * Math.sin(TAU * h.f * t + h.ph)); });
      shaft.visible = op > 0.02;
      ofanM.opacity = 0.45 * ss(op / 0.5); ofan.visible = ofanM.opacity > 0.005; opoolM.opacity = 0.40 * ss(op / 0.5); opool.visible = opoolM.opacity > 0.005;
    },
  };
}

// ================================================================= searchtablet
function searchtablet(P) {
  const S = P.spec, W = 0.40, D = 0.28, T = 0.018, BZ = 0.018, PW = W - 2 * BZ, PD = D - 2 * BZ, PPM = 2000, PITCH = 0.038;
  const pivot = new THREE.Group(); pivot.position.z = D / 2; pivot.rotation.x = (S.tilt14 ?? 14) * DEG; P.whole.add(pivot);   // tipped about the FRONT bottom edge (back edge top y 0.505)
  const tilt = new THREE.Group(); tilt.position.z = -D / 2; pivot.add(tilt);
  const flatten = (geo) => { geo.rotateX(-Math.PI / 2); return geo; };   // shape y -> -z, the extrusion up +y
  const bez = mesh(flatten(new THREE.ExtrudeGeometry(rrPath(new THREE.Shape(), W, D, 0.03), { depth: T, bevelEnabled: false, curveSegments: 10 })), gold("#e8b93a", 0.2), tilt);
  bez.userData.solid = true;
  const lhole = rrPath(new THREE.Path(), W - 0.007, D - 0.007, 0.0265), lshape = rrPath(new THREE.Shape(), W, D, 0.03); lshape.holes.push(lhole);
  const edge = mesh(flatten(new THREE.ExtrudeGeometry(lshape, { depth: 0.0016, bevelEnabled: false, curveSegments: 10 })), gold("#ffe89a", 0.25), tilt, 0, T - 0.0006, 0); edge.castShadow = false; edge.userData.solid = false;
  const halo = mesh(new THREE.TorusGeometry(0.06, 0.005, 8, 40), gold("#ffe89a", 0.2), tilt, 0, -0.004, 0); halo.rotation.x = Math.PI / 2; halo.userData.solid = false;   // the raised ring on the back
  const LEN = [0.24, 0.30, 0.33, 0.19, 0.25, 0.27], rowY = (i) => 0.008 + PITCH * (i - 0.5);   // i 1..6, metres from the page top
  const pageT = canvasTex(Math.round(PW * PPM), Math.round(PD * PPM), () => {}), cv = pageT.image, g = cv.getContext("2d");
  const pageM = paint({ map: pageT, polygonOffsetFactor: -1 }), page = plane(PW, PD, pageM, tilt, 0, T + 0.0004, 0, -Math.PI / 2, 0); page.userData.solid = false;
  let drawn = null;
  const draw = (row) => {
    g.fillStyle = "#fffbe8"; g.fillRect(0, 0, cv.width, cv.height);
    const y = (m) => m * PPM;
    if (row > 0) {   // earlier rows leave a 35 % bar behind; the bar itself is at `row` (1..6), a fraction slides it
      for (let i = 1; i <= 6; i++) { const a = 0.35 * clamp(row - i); if (a > 0) { g.fillStyle = `rgba(255,215,106,${a})`; g.fillRect(0, y(rowY(i) - 0.017), cv.width, y(0.034)); } }
      g.fillStyle = `rgba(255,215,106,${clamp(row)})`; const yc = rowY(1) + (clamp(row, 1, 6) - 1) * PITCH; g.fillRect(0, y(yc - 0.017), cv.width, y(0.034));
    }
    for (let i = 1; i <= 6; i++) {
      const red = i === 6; g.fillStyle = red ? "#c8362f" : "#8a8f96"; g.beginPath(); g.arc(y(0.014), y(rowY(i)), y(0.009), 0, TAU); g.fill();
      g.fillStyle = red ? "#c8362f" : "#b9b2a0"; g.fillRect(y(0.026), y(rowY(i) - 0.008), y(LEN[i - 1]), y(0.016));
    }
  };
  draw(0);
  return { grip: 0, apply(ps) { const row = Math.round(clamp(ps.row ?? S.row ?? 0, 0, 6) * 16) / 16, key = `${row}`; if (key !== drawn) { drawn = key; draw(row); pageT.needsUpdate = true; } } };
}

// ================================================================= casserole
function casserole(P) {
  const S = P.spec, BLUE = "#3f7fb5", SHADE = "#2c5d8a", CREAM = "#f3ead2";
  const base = new THREE.Color(BLUE), shade = new THREE.Color(SHADE);
  const body = tint(lathe([[0, 0], [0.098, 0], [0.108, 0.010], [0.116, 0.034], [0.12, 0.070], [0.12, 0.085]], 48), (x, y, z, nx, ny) => shade.clone().lerp(base, ss((y - 0.005) / 0.05)));
  mesh(body, vmat({ roughness: 0.3, side: THREE.DoubleSide }), P.whole).userData.solid = true;
  const inner = mesh(new THREE.CylinderGeometry(0.1135, 0.099, 0.077, 40, 1, true), mat(SHADE, { roughness: 0.4, side: THREE.BackSide }), P.whole, 0, 0.0425, 0); inner.userData.solid = false;
  const band = mesh(new THREE.CylinderGeometry(0.1215, 0.1215, 0.012, 48, 1, true), mat(CREAM, { roughness: 0.4, side: THREE.DoubleSide }), P.whole, 0, 0.079, 0);   // the cream rim band
  band.userData.solid = false;
  for (const s of [-1, 1]) { const e = mesh(new THREE.BoxGeometry(0.040, 0.022, 0.060), mat(SHADE, { roughness: 0.35 }), P.whole, s * 0.135, 0.065, 0); e.userData.solid = true; mesh(new THREE.BoxGeometry(0.040, 0.004, 0.056), mat(BLUE, { roughness: 0.35 }), P.whole, s * 0.135, 0.0775, 0).castShadow = false; }
  const chip = mesh(new THREE.SphereGeometry(0.0065, 10, 8), mat("#34414f", { roughness: 0.6 }), P.whole, 0.1215 * Math.sin(212 * DEG), 0.0835, 0.1215 * Math.cos(212 * DEG)); chip.scale.set(1, 0.5, 1); chip.userData.solid = false;   // one enamel chip on the rim
  // the crust under the lid: shown when the lid slides and tips
  const crustT = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = "#d9a441"; g.fillRect(0, 0, w, h); g.fillStyle = "#a8752a";
    for (const [u, v, rr] of [[0.30, 0.34, 20], [0.62, 0.27, 15], [0.72, 0.62, 22], [0.36, 0.72, 17]]) { g.beginPath(); g.ellipse(u * w, v * h, rr, rr * 0.8, 0.5 * u, 0, TAU); g.fill(); }
  });
  const crust = new THREE.Mesh(new THREE.CircleGeometry(0.114, 40), new THREE.MeshStandardMaterial({ map: crustT, roughness: 0.8 })); crust.rotation.x = -Math.PI / 2; crust.position.y = 0.074; crust.userData.solid = false; P.whole.add(crust);
  // the lid: a low dome 0.04 with a cream knob (top 0.15), pivoting on its +z edge; a red heart on the top toward -z (planar UVs: seen from above)
  const LR = 0.126, pivot = new THREE.Group(); pivot.position.set(0, 0.085, LR); P.whole.add(pivot);
  const lidG = lathe([[LR, 0], [LR, 0.008], [0.112, 0.022], [0.085, 0.032], [0.05, 0.0385], [0.018, 0.0402], [0, 0.0405]], 48), lp = lidG.attributes.position, luv = lidG.attributes.uv;
  for (let i = 0; i < lp.count; i++) luv.setXY(i, lp.getX(i) / (2 * LR) + 0.5, 1 - (lp.getZ(i) + LR) / (2 * LR));
  const lidT = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = BLUE; g.fillRect(0, 0, w, h);
    const cx = w / 2, s = (0.045 / (2 * LR)) * w;   // the heart at z -0.062 (canvas y grows toward +z), point toward the camera side
    g.save(); g.translate(cx, ((LR - 0.062) / (2 * LR)) * h); g.rotate(Math.PI); g.fillStyle = "#d3261e"; g.beginPath(); g.moveTo(0, s * 0.5);
    g.bezierCurveTo(-s * 0.15, s * 0.3, -s * 0.55, s * 0.1, -s * 0.5, -s * 0.2); g.bezierCurveTo(-s * 0.45, -s * 0.5, -s * 0.05, -s * 0.5, 0, -s * 0.2);
    g.bezierCurveTo(s * 0.05, -s * 0.5, s * 0.45, -s * 0.5, s * 0.5, -s * 0.2); g.bezierCurveTo(s * 0.55, s * 0.1, s * 0.15, s * 0.3, 0, s * 0.5); g.fill(); g.restore();
  });
  const lid = mesh(lidG, new THREE.MeshStandardMaterial({ map: lidT, roughness: 0.3, side: THREE.DoubleSide }), pivot, 0, 0, -LR); lid.userData.solid = true;
  const knob = mesh(new THREE.SphereGeometry(0.018, 16, 12), mat(CREAM, { roughness: 0.35 }), pivot, 0, 0.0465, -LR); knob.userData.solid = true;
  const rimLine = mesh(new THREE.CylinderGeometry(LR + 0.0005, LR + 0.0005, 0.005, 48, 1, true), mat(CREAM, { roughness: 0.4, side: THREE.DoubleSide }), pivot, 0, 0.0035, -LR); rimLine.userData.solid = false;
  return {
    grip: 0.065,
    apply(ps) { const l = clamp(ps.lid ?? S.lid ?? 0); pivot.position.z = LR + 0.03 * l; pivot.rotation.x = 18 * DEG * l; },
  };
}

// ================================================================= hellbutton
function hellbutton(P) {
  const S = P.spec, RED = "#8f1f1c";
  const baseG = lathe([[0.088, 0.0], [0.105, 0], [0.105, 0.03], [0.088, 0.03], [0.088, 0.004]], 48);
  mesh(baseG, mat(RED, { roughness: 0.5, side: THREE.DoubleSide }), P.whole).userData.solid = true;
  const lipT = mesh(new THREE.TorusGeometry(0.0985, 0.0048, 8, 48), gold("#e8b93a", 0.22), P.whole, 0, 0.0305, 0); lipT.rotation.x = Math.PI / 2; lipT.userData.solid = true;
  const floor = mesh(new THREE.CircleGeometry(0.088, 36), mat("#3a0f0d", { roughness: 0.9 }), P.whole, 0, 0.0008, 0); floor.rotation.x = -Math.PI / 2; floor.userData.solid = false;
  const cH = 0.05, R = 0.085, prof = []; for (let i = 0; i <= 16; i++) { const a = (i / 16) * (Math.PI / 2); prof.push([R * Math.cos(a), cH * Math.sin(a)]); }
  const dome = tint(lathe(prof, 48), (x, y, z, nx, ny) => { const c = lerpC("#b8862a", "#f6c744", ss(ny * 1.1 + 0.15)); return c.lerp(new THREE.Color("#fff3b0"), ss((ny - 0.7) / 0.3) * 0.7); });
  const domeO = mesh(dome, vmat({ roughness: 0.3, side: THREE.DoubleSide }), P.whole, 0, 0.03, 0); domeO.userData.solid = true;
  const ringM = lightMat({ color: "#ff3b22", opacity: 0, side: THREE.DoubleSide }), ring = flat(new THREE.Mesh(new THREE.RingGeometry(0.0885, 0.1005, 48), ringM), 4); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.0312; P.whole.add(ring);
  return {
    grip: 0.08,
    apply(ps) { const p = clamp(ps.press ?? S.press ?? 0); domeO.position.y = 0.03 - 0.028 * p; ringM.opacity = ss(p / 0.3); ring.visible = p > 0.01; },
  };
}

export const HSEARCH_KINDS = { searchscreen, gatetrap, searchtablet, casserole, hellbutton };
// named hand points in each prop's own frame (metres from its bottom centre, before rot and scale): the casserole's two ear tips
export const HSEARCH_GRIPS = { casserole: { earL: [-0.155, 0.065, 0], earR: [0.155, 0.065, 0] } };
