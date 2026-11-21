import * as THREE from "three";
import { clamp, lerp } from "./util.js";
import { makeScarab, SCARAB_GREENS } from "./props-heart-heart.js";

// Egypt myth 01 "Your heart vs. one feather" (storyboards/series/egypt-myth/01-heart/DESIGN.md section I): the MUSEUM CASE of panel 22
// (without hosts, visitors or plaques). The only cool, white picture of the film: greens on white. NO TEXT anywhere: pictures only.
// Metres, x right, y up, z toward the default camera; every mark is drawn once from its index; no Math.random, no clock.
//
// KIND
//   heartcase   Origin: the floor under the case's CENTRE; the show side is +z. Stand it 300 m or more from the hall (e.g. x 400): it
//               brings its OWN wall, floor and lights (3 lights, range 12 m, intensity 0 while the prop is hidden: scale 0).
//               Parts (DESIGN numbers):
//                 plinth   1.60 x 0.60 x 0.80 high #eef0f2 (the sides in shade #c5cad0), a shadow gap 0.02 at the floor
//                 glass    1.60 x 0.60 x 1.10 (y 0.80..1.90), tint #dff0f5 at 0.10; steel edges 0.015 #9aa3aa, 8 corner clamps; 2 diagonal
//                          reflection streaks at 0.12 and a soft reflection of the lid strip on the front pane; a lid with the light strip
//                 risers   4 steps (rise 0.16, run 0.12) in pale linen #f4f6f7 with a stitched edge line (the lowest is the front)
//                 scarabs  4 rows of 6 = 24 on the 4 steps (x -0.625..+0.625 every 0.25), 0.060-0.095 long (by index), each on a block
//                          0.10 x 0.03 x 0.08 leaning back 25 degrees to the viewer, yaw up to +-8 degrees, a soft shadow under each.
//                          Every one is the charm of props-heart-heart.js (head notches, seam, grooves, legs, 30 flecks). 3 lie underside
//                          up (index 4, 13, 20) with their 3 registers; 5 greens by index #2f5a3c #3a6b47 #27503a #4a7a52 #5d8a5a;
//                          4 have a chipped rim (index 2, 9, 15, 22), 2 a GOLD band round the body (index 7, 18)
//                 wall     6.0 x 5.2 at z -1.2 (x -3..3, y 0..5.2) #dfe3e6; a niche 1.6 x 1.0 at y 2.3-3.3, 0.08 deep, with a pale stone
//                          relief #e9e4d6 of a bird with spread wings (3 rows of 9 feathers, 20 % old paint traces in LAPIS and OCHRE RED);
//                          a cornice line at y 4.6; 2 hanging lamps (white cones 0.3) at x +-1.35, y 4.2
//                 floor    6.0 x 5.0 (x -3..3, z -1.2..3.8) stone #c9ccd0, slabs 1.0 m, a soft reflection of the case in front of it
//                 lights   a strip in the lid #f2f8ff (a point light under it: one white highlight on every scarab), 2 cool spots #eaf4ff
//                          from above the camera, aimed at the case
//               spec / state keys (default): glint 0..1 (0) one highlight pass across the front glass (tween 0 -> 1); light 0..1 (1) the lights'
//               strength; spec.lamps false hides the hanging lamps. The prop's `scale` is the usual engine scale about the origin.
//               Cameras (start, from DESIGN): the whole case (0, 1.45, 3.9) -> (0, 1.30, 0.3) fov 50 (the frame is 1.89 m wide, the case 915 px,
//               a scarab 46 px); push in to 2 rows at (0, 1.5, 1.9): a scarab 92 px. With the prop at x 400 add 400 to every x.
//
// Nothing here is held: HEART_CASE_GRIPS is empty.

const DEG = Math.PI / 180;
const rr = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const ss = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
function canvasTex(w, h, draw, rep = false) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
const decal = (tex, o = {}) => { const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, ...o }); m.userData.noOutline = true; m.userData.noHatch = true; return m; };
const soft = (o = {}) => { const m = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, ...o }); m.userData.noOutline = true; return m; };
function box(w, h, d, m, parent, x, y, z) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function plane(w, h, m, parent, x, y, z, rx = 0) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.x = rx; o.castShadow = false; o.receiveShadow = true; parent.add(o); return o; }
const flat = (o) => { o.castShadow = false; o.userData.solid = false; o.userData.steam = true; return o; };

const NSTEP = 4, RISE = 0.16, RUN = 0.12, PLINTH = 0.8, STEPW = 1.5;
const SCAR = (() => {   // the 24 scarabs: index = row * 6 + col; length, green, underside-up, chipped, gold band, yaw, all by index
  const out = [];
  for (let i = 0; i < 24; i++) {
    const row = Math.floor(i / 6), col = i % 6;
    out.push({ i, row, col, len: 0.060 + 0.035 * ((rr(i * 3.7 + 1) + (i % 4) / 3) / 2), green: (i * 2 + row) % 5, under: [4, 13, 20].includes(i), chip: [2, 9, 15, 22].includes(i), band: [7, 18].includes(i), yaw: (rr(i * 5.3 + 9) - 0.5) * 16 });
  }
  return out;
})();

// ---- canvases
function floorTex() {
  return canvasTex(1536, 1280, (g, W, H) => {   // 6.0 x 5.0 m, 256 px per m; slabs of 1 m, x from the left, z from the far edge (-1.2)
    for (let a = 0; a < 6; a++) for (let b = 0; b < 5; b++) { const k = rr(a * 7 + b * 13 + 2); g.fillStyle = `rgb(${Math.round(201 + 6 * (k - 0.5))},${Math.round(204 + 6 * (k - 0.5))},${Math.round(208 + 6 * (k - 0.5))})`; g.fillRect(a * 256, b * 256, 256, 256); }
    g.strokeStyle = "#a9adb3"; g.lineWidth = 3; for (let a = 0; a <= 6; a++) { g.beginPath(); g.moveTo(a * 256, 0); g.lineTo(a * 256, H); g.stroke(); } for (let b = 0; b <= 5; b++) { g.beginPath(); g.moveTo(0, b * 256); g.lineTo(W, b * 256); g.stroke(); }
    g.strokeStyle = "rgba(255,255,255,0.5)"; g.lineWidth = 2; for (let a = 0; a <= 6; a++) { g.beginPath(); g.moveTo(a * 256 + 3, 0); g.lineTo(a * 256 + 3, H); g.stroke(); } for (let b = 0; b <= 5; b++) { g.beginPath(); g.moveTo(0, b * 256 + 3); g.lineTo(W, b * 256 + 3); g.stroke(); }
    // a few hairline veins and flecks of the stone, drawn from the slab index
    for (let n = 0; n < 60; n++) { g.fillStyle = `rgba(150,156,164,${0.08 + 0.1 * rr(n * 3.1)})`; g.beginPath(); g.ellipse(rr(n * 1.9 + 4) * W, rr(n * 2.3 + 8) * H, 3 + 9 * rr(n), 1 + 2 * rr(n + 5), rr(n + 2) * 3, 0, 6.2832); g.fill(); }
  });
}
function wallTex() {
  return canvasTex(1024, 888, (g, W, H) => {   // faint plaster mottling over the flat wall colour (transparent elsewhere)
    g.clearRect(0, 0, W, H);
    for (let n = 0; n < 90; n++) { const r = 30 + 90 * rr(n * 2.1 + 1), x = rr(n * 1.7 + 3) * W, y = rr(n * 2.9 + 5) * H, q = g.createRadialGradient(x, y, 0, x, y, r); const c = rr(n + 9) < 0.5 ? "255,255,255" : "176,184,192"; q.addColorStop(0, `rgba(${c},0.10)`); q.addColorStop(1, `rgba(${c},0)`); g.fillStyle = q; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  });
}
const stitchTex = (wm, hm, edge) => canvasTex(2048, Math.round(2048 * hm / wm), (g, W, H) => {   // linen with a stitched edge line (edge "top": along the upper edge; "front": the same)
  g.fillStyle = "#f4f6f7"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(205,212,216,0.22)"; g.lineWidth = 1; for (let x = 0; x < W; x += 6) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  const px = W / wm, inset = 0.012 * px; g.strokeStyle = "#aeb6bb"; g.lineWidth = Math.max(2, 0.0018 * px); g.lineCap = "round";
  const y0 = edge === "top" ? H - inset : inset; for (let x = 0.03 * px; x < W - 0.03 * px; x += 0.011 * px) { g.beginPath(); g.moveTo(x, y0); g.lineTo(x + 0.0062 * px, y0); g.stroke(); }
  g.strokeStyle = "rgba(190,198,203,0.8)"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, edge === "top" ? H - 1.5 : H - 1.5); g.lineTo(W, H - 1.5); g.stroke();
});
const blobTex = () => canvasTex(128, 64, (g, w, h) => { const q = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); q.addColorStop(0, "rgba(40,52,62,0.45)"); q.addColorStop(0.6, "rgba(40,52,62,0.16)"); q.addColorStop(1, "rgba(40,52,62,0)"); g.save(); g.translate(w / 2, h / 2); g.scale(1, h / w); g.translate(-w / 2, -w / 2); g.fillStyle = q; g.fillRect(0, 0, w, w); g.restore(); });
const streakTex = () => canvasTex(512, 512, (g, W, H) => {   // two diagonal reflection streaks on the front pane (1.6 x 1.1)
  g.clearRect(0, 0, W, H);
  for (const [x0, w, a] of [[0.28, 0.07, 0.12], [0.46, 0.028, 0.12]]) { const q = g.createLinearGradient((x0 - w) * W, 0, (x0 + w) * W, 0); q.addColorStop(0, "rgba(255,255,255,0)"); q.addColorStop(0.5, `rgba(255,255,255,${a * 3})`); q.addColorStop(1, "rgba(255,255,255,0)"); g.save(); g.translate(W / 2, H / 2); g.rotate(-0.55); g.translate(-W / 2, -H / 2); g.fillStyle = q; g.fillRect(-W, -H, 3 * W, 3 * H); g.restore(); }
});
const lidTex = () => canvasTex(512, 128, (g, W, H) => { g.clearRect(0, 0, W, H); const q = g.createLinearGradient(0, 0, 0, H); q.addColorStop(0, "rgba(255,255,255,0.5)"); q.addColorStop(0.45, "rgba(255,255,255,0.32)"); q.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = q; g.fillRect(W * 0.06, 0, W * 0.88, H); });
const glintBand = () => { const t = canvasTex(256, 256, (g, W, H) => { g.clearRect(0, 0, W, H); const q = g.createLinearGradient(W * 0.25, 0, W * 0.75, 0); q.addColorStop(0, "rgba(255,255,255,0)"); q.addColorStop(0.5, "rgba(255,255,255,0.7)"); q.addColorStop(1, "rgba(255,255,255,0)"); g.save(); g.translate(W / 2, H / 2); g.rotate(-0.5); g.translate(-W / 2, -H / 2); g.fillStyle = q; g.fillRect(-W, -H, 3 * W, 3 * H); g.restore(); }); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; };
const reflTex = () => canvasTex(512, 256, (g, W, H) => {   // the case on the floor: x across the plinth, v = height reflected (near edge at the bottom of the canvas)
  g.clearRect(0, 0, W, H);
  const q = g.createLinearGradient(0, H, 0, 0); q.addColorStop(0, "rgba(238,240,242,0.55)"); q.addColorStop(0.42, "rgba(238,240,242,0.22)"); q.addColorStop(1, "rgba(238,240,242,0)"); g.fillStyle = q; g.fillRect(0, 0, W, H);
  for (const s of SCAR) { const x = W / 2 + (s.col - 2.5) * 0.25 / 1.6 * W, y = H * (1 - (0.06 + 0.07 * s.row)); const c = new THREE.Color(SCARAB_GREENS[s.green]), q2 = g.createRadialGradient(x, y, 0, x, y, 16); q2.addColorStop(0, `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},0.20)`); q2.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = q2; g.fillRect(x - 16, y - 16, 32, 32); }
  const f = g.createLinearGradient(0, 0, W, 0); f.addColorStop(0, "rgba(0,0,0,0)"); f.addColorStop(0.5, "rgba(0,0,0,0)"); g.globalCompositeOperation = "destination-in"; const e = g.createLinearGradient(0, 0, W, 0); e.addColorStop(0, "rgba(0,0,0,0.3)"); e.addColorStop(0.06, "rgba(0,0,0,1)"); e.addColorStop(0.94, "rgba(0,0,0,1)"); e.addColorStop(1, "rgba(0,0,0,0.3)"); g.fillStyle = e; g.fillRect(0, 0, W, H); g.globalCompositeOperation = "source-over";
});
const traceTex = (col) => canvasTex(64, 128, (g, W, H) => { g.clearRect(0, 0, W, H); g.fillStyle = col; for (let k = 0; k < 4; k++) { const y = 14 + k * 28; g.globalAlpha = 0.55 + 0.3 * rr(k * 3 + col.length); g.fillRect(6, y, W - 12, 14); } g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000"; for (let n = 0; n < 14; n++) { g.globalAlpha = 0.7; g.beginPath(); g.ellipse(rr(n * 2.7) * W, rr(n * 4.1 + 1) * H, 2 + 5 * rr(n + 3), 2 + 4 * rr(n + 7), 0, 0, 6.2832); g.fill(); } });

// ---- the relief: a bird with spread wings, 3 rows of 9 feathers
function featherShape(L, Wd) {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(Wd * 0.62, L * 0.1, Wd * 0.58, L * 0.78, 0, L); s.bezierCurveTo(-Wd * 0.58, L * 0.78, -Wd * 0.62, L * 0.1, 0, 0); return s;
}
function buildBird(parent) {
  const stone = mat("#e9e4d6", { roughness: 0.92 }), shade = mat("#d3ccb9", { roughness: 0.95 }), lapis = decal(traceTex("#2b4fa2")), ochre = decal(traceTex("#b4472e"));
  const ext = (shape, depth, z, m, x, y, rz = 0) => { const o = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.0035, bevelThickness: 0.0035, bevelSegments: 2, curveSegments: 14 }), m); o.position.set(x, y, z); o.rotation.z = rz; o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const ell = (rx, ry) => { const s = new THREE.Shape(); s.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0); return s; };
  // body, head in profile (to the right), beak, tail
  ext(ell(0.12, 0.23), 0.012, 0.0, stone, 0, -0.03); ext(ell(0.06, 0.065), 0.014, 0.0, stone, 0.004, 0.27);
  const beak = new THREE.Shape(); beak.moveTo(0, 0.04); beak.lineTo(0.075, 0); beak.lineTo(0, -0.04); beak.closePath(); ext(beak, 0.012, 0.0, stone, 0.048, 0.26, -0.12);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.007, 10, 8), mat("#5a5546", { roughness: 0.6 })); eye.position.set(0.026, 0.285, 0.026); parent.add(eye);
  // 3 rows x 9 feathers: row 0 the short coverts (on top), 1 the secondaries, 2 the long primaries; 4 a side on each wing + 1 tail feather
  const ROWS = [{ L: 0.22, Wd: 0.070, z: 0.012, a0: 20, a1: -22 }, { L: 0.38, Wd: 0.076, z: 0.0075, a0: 12, a1: -36 }, { L: 0.54, Wd: 0.082, z: 0.003, a0: 5, a1: -52 }];
  let n = 0;
  ROWS.forEach((R, r) => {
    for (let k = 0; k < 9; k++) {
      const side = k < 4 ? -1 : k > 4 ? 1 : 0, kk = k < 4 ? 3 - k : k - 5, f = kk / 3;
      let ang, bx, by, L = R.L;
      if (side === 0) { ang = -90; bx = 0.0; by = -0.12 - 0.02 * r; L = R.L * 0.7; }   // the tail feather points down
      else { ang = lerp(R.a0, R.a1, f); L = R.L * (1 - 0.18 * f); bx = side * (0.09 + 0.012 * r); by = 0.15 - 0.02 * r - 0.012 * kk; }
      const a = ang * DEG, dx = side === 0 ? 0 : side * Math.cos(a), dy = side === 0 ? -1 : Math.sin(a), rot = Math.atan2(dy, dx) - Math.PI / 2;
      const m = ext(featherShape(L, R.Wd), 0.007, R.z, rr(n * 3 + 1) < 0.5 ? stone : shade, bx, by, rot); m.position.z = R.z;
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.003, L * 0.92, 0.002), shade); shaft.position.set(0, L * 0.5, 0.0105); m.add(shaft);
      if (rr(n * 5.7 + 2) < 0.2) { const t = new THREE.Mesh(new THREE.PlaneGeometry(R.Wd * 0.75, L * 0.5), rr(n + 1) < 0.5 ? lapis : ochre); t.position.set(0, L * 0.45, 0.0118); m.add(t); }
      n++;
    }
  });
  return n;
}

function heartcase(P) {
  const S = P.spec, W = P.whole, root = new THREE.Group(); W.add(root);
  const white = mat("#eef0f2", { roughness: 0.55 }), shadeM = mat("#c5cad0", { roughness: 0.6 });
  // floor
  const ftex = floorTex(), floorM = new THREE.MeshStandardMaterial({ map: ftex, roughness: 0.4, metalness: 0.0, emissive: new THREE.Color("#ffffff"), emissiveMap: ftex, emissiveIntensity: 0.8 });   // the look dims up-facing surfaces: the floor holds its colour by itself floorM.userData.noHatch = true;
  const floor = plane(6, 5, floorM, root, 0, 0, 1.3, -Math.PI / 2); floor.receiveShadow = true;
  const refl = plane(1.6, 1.0, soft({ map: reflTex(), opacity: 0.9 }), root, 0, 0.004, 0.3 + 0.5, -Math.PI / 2); flat(refl).renderOrder = 2;
  // wall: 6.0 x 5.2 with the niche cut out, depth 0.08 behind z -1.2
  const ws = new THREE.Shape(); ws.moveTo(-3, 0); ws.lineTo(3, 0); ws.lineTo(3, 5.2); ws.lineTo(-3, 5.2); ws.closePath();
  const hole = new THREE.Path(); hole.moveTo(-0.8, 2.3); hole.lineTo(-0.8, 3.3); hole.lineTo(0.8, 3.3); hole.lineTo(0.8, 2.3); hole.closePath(); ws.holes.push(hole);
  const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(ws, { depth: 0.08, bevelEnabled: false }), mat("#dfe3e6", { roughness: 0.92 })); wall.position.set(0, 0, -1.28); wall.castShadow = false; wall.receiveShadow = true; root.add(wall);
  plane(6, 5.2, decal(wallTex(), { opacity: 1 }), root, 0, 2.6, -1.1985);
  const nb = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), mat("#d6d0be", { roughness: 0.95 })); nb.position.set(0, 2.8, -1.2); nb.receiveShadow = true; root.add(nb);
  const bird = new THREE.Group(); bird.position.set(0, 2.8, -1.2); root.add(bird); const nFeathers = buildBird(bird); void nFeathers;
  box(6, 0.07, 0.13, mat("#e9ecee"), root, 0, 4.6, -1.135); box(6, 0.025, 0.17, mat("#c5cad0"), root, 0, 4.555, -1.115); box(6, 0.012, 0.03, mat("#cfd4d8"), root, 0, 4.6 - 0.075, -1.05);
  const lampLights = [];
  const lamps = new THREE.Group(); root.add(lamps);
  for (const sx of [-1.35, 1.35]) {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 1.0, 6), mat("#9aa3aa")); cord.position.set(sx, 4.2 + 0.15 + 0.5, -0.2); lamps.add(cord);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 40, 1, true), mat("#f8fafb", { roughness: 0.6, side: THREE.DoubleSide, emissive: "#ffffff", emissiveIntensity: 0.18 })); cone.position.set(sx, 4.2, -0.2); cone.castShadow = false; lamps.add(cone);
    const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.14, 32), new THREE.MeshBasicMaterial({ color: "#f2f8ff", toneMapped: false })); bulb.material.userData.noOutline = true; bulb.rotation.x = Math.PI / 2; bulb.position.set(sx, 4.2 - 0.147, -0.2); bulb.rotation.x = Math.PI / 2; flat(bulb); lamps.add(bulb);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 10), mat("#9aa3aa")); knob.position.set(sx, 4.2 + 0.165, -0.2); lamps.add(knob);
  }
  lamps.visible = S.lamps !== false;
  // plinth: the shadow gap 0.02 at the floor, shaded sides
  box(1.56, 0.02, 0.56, mat("#8e959c"), root, 0, 0.01, 0);
  const pl = new THREE.Mesh(new THREE.BoxGeometry(1.6, PLINTH - 0.02, 0.6), [shadeM, shadeM, white, white, white, shadeM]); pl.position.set(0, 0.02 + (PLINTH - 0.02) / 2, 0); pl.castShadow = pl.receiveShadow = true; root.add(pl);
  box(1.62, 0.012, 0.62, mat("#dfe3e6"), root, 0, PLINTH - 0.006, 0);   // the lip under the glass
  // risers in linen with a stitched edge line: the lowest (k 0) in front
  const topT = stitchTex(STEPW, RUN, "top"), frontT = stitchTex(STEPW, RISE, "front"), linen = mat("#f4f6f7", { roughness: 0.95 });
  const stepZ = (k) => 0.20 - RUN * k;   // the front edge of step k
  for (let k = 0; k < NSTEP; k++) {
    const h = RISE * (k + 1), z = stepZ(k);
    box(STEPW, h, RUN, linen, root, 0, PLINTH + h / 2, z - RUN / 2);
    const tp = new THREE.Mesh(new THREE.PlaneGeometry(STEPW, RUN), new THREE.MeshStandardMaterial({ map: topT, roughness: 0.95 })); tp.rotation.x = -Math.PI / 2; tp.position.set(0, PLINTH + h + 0.0005, z - RUN / 2); tp.receiveShadow = true; tp.material.userData.noHatch = true; root.add(tp);
    const fp = new THREE.Mesh(new THREE.PlaneGeometry(STEPW, RISE), new THREE.MeshStandardMaterial({ map: frontT, roughness: 0.95 })); fp.position.set(0, PLINTH + h - RISE / 2, z + 0.0005); fp.receiveShadow = true; fp.material.userData.noHatch = true; root.add(fp);
  }
  // the scarabs, each on its block
  const blobM = soft({ map: blobTex(), opacity: 1 }), blockM = mat("#e6e9eb", { roughness: 0.5 });
  for (const s of SCAR) {
    const k = s.row, x = (s.col - 2.5) * 0.25, hTop = PLINTH + RISE * (k + 1), zf = stepZ(k);
    const slab = new THREE.Group(); slab.position.set(x, hTop, zf - 0.02 - 0.012); slab.rotation.x = -25 * DEG; root.add(slab);   // leans back: its up axis goes up and back, its normal up and to the viewer
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.08, 0.03), blockM); b.position.set(0, 0.04, -0.015); b.castShadow = b.receiveShadow = true; slab.add(b);   // 0.10 wide x 0.08 along the slant x 0.03 thick
    const holder = new THREE.Group(); holder.position.set(0, Math.max(0.04, s.len / 2 + 0.002), 0); holder.rotation.z = s.yaw * DEG; slab.add(holder);
    const flip = new THREE.Group(); if (s.under) flip.rotation.y = Math.PI; holder.add(flip);
    const sc = makeScarab({ green: s.green, res: 0.72, chip: s.chip, band: s.band, under: s.under }); sc.scale.setScalar(s.len / 0.085); flip.add(sc);
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.085), blobM); blob.rotation.x = -Math.PI / 2; blob.position.set(x, hTop + 0.001, zf - 0.075); flat(blob).renderOrder = 2; root.add(blob);
  }
  // the glass case: tint, steel edges 0.015 #9aa3aa, 8 corner clamps, the lid with the light strip
  const gy0 = PLINTH, gy1 = PLINTH + 1.10, gm = new THREE.MeshStandardMaterial({ color: "#dff0f5", roughness: 0.05, transparent: true, opacity: 0.10, depthWrite: false, side: THREE.DoubleSide }); gm.userData.glass = true; gm.userData.noHatch = true;
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.6), gm); glass.position.set(0, (gy0 + gy1) / 2, 0); glass.castShadow = false; glass.userData.solid = false; root.add(glass);
  const steel = mat("#9aa3aa", { roughness: 0.3, metalness: 0.6 }), clamp_ = mat("#7d868d", { roughness: 0.35, metalness: 0.6 });
  for (const sy of [gy0, gy1]) for (const sz of [-0.3, 0.3]) box(1.6, 0.015, 0.015, steel, root, 0, sy, sz);   // 4 along x
  for (const sy of [gy0, gy1]) for (const sx of [-0.8, 0.8]) box(0.015, 0.015, 0.6, steel, root, sx, sy, 0);   // 4 along z
  for (const sx of [-0.8, 0.8]) for (const sz of [-0.3, 0.3]) box(0.015, 1.1, 0.015, steel, root, sx, (gy0 + gy1) / 2, sz);   // 4 up
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const [sy, dy] of [[gy0, 1], [gy1, -1]]) {   // 8 corner clamps: a block with a small plate each way
    box(0.04, 0.04, 0.04, clamp_, root, sx * 0.79, sy + dy * 0.015, sz * 0.29);
  }
  const lid = box(1.64, 0.05, 0.64, mat("#e4e8ea", { roughness: 0.5 }), root, 0, gy1 + 0.0325, 0);
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.05), new THREE.MeshBasicMaterial({ color: "#f2f8ff", toneMapped: false })); strip.material.userData.noOutline = true; strip.rotation.x = Math.PI / 2; strip.position.set(0, gy1 - 0.0005, 0.14); flat(strip); root.add(strip); void lid;
  const lidGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.12), soft({ map: lidTex(), opacity: 1 })); lidGlow.rotation.x = Math.PI / 2; lidGlow.position.set(0, gy1 - 0.002, 0.14); flat(lidGlow).renderOrder = 2; root.add(lidGlow);
  // reflections on the front pane: the lid strip (soft), 2 diagonal streaks, the glint pass
  const lidRefl = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 0.16), soft({ map: lidTex(), opacity: 0.8 })); lidRefl.position.set(0, gy1 - 0.12, 0.3015); lidRefl.rotation.x = Math.PI; flat(lidRefl).renderOrder = 3; root.add(lidRefl);
  const streaks = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), soft({ map: streakTex(), opacity: 1 })); streaks.position.set(0, (gy0 + gy1) / 2, 0.302); flat(streaks).renderOrder = 3; root.add(streaks);
  const gband = glintBand(), gmat = soft({ map: gband, opacity: 0.0, blending: THREE.AdditiveBlending }); gband.repeat.set(4, 1);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), gmat); gl.position.set(0, (gy0 + gy1) / 2, 0.303); flat(gl).renderOrder = 4; gl.visible = false; root.add(gl);
  // lights: the lid strip (one white highlight on every scarab) and two cool spots above the camera
  const stripL = new THREE.PointLight("#f2f8ff", 0, 12, 1.2); stripL.position.set(0, gy1 - 0.1, 0.35); root.add(stripL);
  const spots = [-1, 1].map((sx) => { const s = new THREE.SpotLight("#eaf4ff", 0, 12, 0.5, 0.7, 1.2); s.position.set(sx * 1.1, 3.0, 3.4); s.target.position.set(0, 1.2, 0); s.castShadow = false; root.add(s); root.add(s.target); return s; });
  const fill = new THREE.PointLight("#eaf4ff", 0, 12, 1.2); fill.position.set(0, 2.4, 1.6); root.add(fill);
  return {
    grip: 0,
    apply(ps) {
      const on = ps.scale > 0.002 ? clamp(ps.light ?? S.light ?? 1, 0, 1.5) : 0, g = clamp(ps.glint ?? S.glint ?? 0);
      stripL.intensity = 3 * on; for (const s of spots) s.intensity = 14 * on; fill.intensity = 4 * on;
      gl.visible = g > 0.001 && g < 0.999; gmat.opacity = 0.38 * ss(Math.min(g, 1 - g) * 6);
      gband.offset.x = 0.5 - 4 * (1.4 * g - 0.2);
    },
  };
}

export const HEART_CASE_KINDS = { heartcase };
export const HEART_CASE_GRIPS = {};
export const HEART_CASE_STATE = { heartcase: { glint: 0, light: 1 } };
