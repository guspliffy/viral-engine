import * as THREE from "three";
import { rng } from "./util.js";
import { canvas, tex } from "./set-porch.js";

// "apartment": a bright apartment on a sunny afternoon, for Still Scrolling (Jonny's storyboard, 25 Oct 2026). Cream
// walls, a pale wooden floor, two tall windows in the back wall (a painted view of sky, trees and far-off houses),
// sheer curtains, a framed leaf print between them, potted plants, and a bookcase at the right. Warm sunlight comes in
// through the windows: soft window-shaped patches lie on the floor in front of them (painted, so every look shows them).
// The stage is the open floor around x -1..1.2, z 0; the back wall is at APARTMENT.wallZ.
// spec: { type: "apartment", seed }. Nothing seasonal.
export const APARTMENT = { wallZ: -1.75, winL: [-1.55, -0.65], winR: [0.75, 1.65], winY: [0.72, 2.45], shelfX: 1.95 };

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
const basic = (o) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; return m; };
function box(parent, w, h, d, m, x, y, z) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; parent.add(b); return b; }
const flat = (o) => { o.material.userData.noOutline = true; o.receiveShadow = true; return o; };

// pale oak boards running toward the camera, each a slightly different tone, with soft seams and a little grain
function floorTex(rnd) {
  const [c, g] = canvas(512, 512), n = 8, bw = 512 / n;
  for (let i = 0; i < n; i++) {
    const v = 0.95 + rnd() * 0.08;
    g.fillStyle = `rgb(${Math.round(232 * v)},${Math.round(203 * v)},${Math.round(160 * v)})`; g.fillRect(i * bw, 0, bw, 512);
    g.strokeStyle = "rgba(160,110,60,0.10)"; g.lineWidth = 2;
    for (let k = 0; k < 3; k++) { const x = i * bw + 10 + rnd() * (bw - 20); g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 6, 170, x - 6, 340, x + 3, 512); g.stroke(); }
    g.fillStyle = "rgba(140,95,55,0.30)"; g.fillRect(i * bw, 0, 2, 512);
    const cut = rnd() * 512; g.fillRect(i * bw, cut, bw, 2);   // a board end
  }
  return tex(c, 3, 3);
}

// the view through a window: a clear afternoon sky with soft clouds, a leafy tree and pale houses far off
function viewTex(rnd, side) {
  const W = 256, H = 512, [c, g] = canvas(W, H);
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#8cc4ee"); sky.addColorStop(0.65, "#cfe8f7"); sky.addColorStop(1, "#f4ecd6");
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(255,255,255,0.85)";
  for (let i = 0; i < 4; i++) { const x = rnd() * W, y = 40 + rnd() * 160; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + k * 18 - 36, y - Math.sin(k) * 8, 26, 14, 0, 0, Math.PI * 2); g.fill(); } }
  // far houses: pale blocks with little windows
  for (let i = 0; i < 6; i++) {
    const x = i * 48 - 20 + rnd() * 16, w = 40 + rnd() * 20, h = 60 + rnd() * 70, y = H * 0.74 - h;
    g.fillStyle = ["#e9d8c0", "#d9c4b0", "#efe2cf", "#cdbba8"][i % 4]; g.fillRect(x, y, w, h + 200);
    g.fillStyle = "rgba(120,140,170,0.45)"; for (let yy = y + 10; yy < y + h; yy += 18) for (let xx = x + 6; xx < x + w - 8; xx += 13) g.fillRect(xx, yy, 6, 9);
  }
  // a big tree close by, on the window's outer side
  const tx = side < 0 ? W * 0.3 : W * 0.7;
  g.fillStyle = "#7a5a3a"; g.fillRect(tx - 8, H * 0.55, 16, H * 0.45);
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, r = rnd() * 90, x = tx + Math.cos(a) * r, y = H * 0.42 + Math.sin(a) * r * 0.75;
    g.fillStyle = ["#5f9e4c", "#78b85a", "#4f8a40", "#8cc66a"][i % 4]; g.beginPath(); g.arc(x, y, 30 + rnd() * 20, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = "#9cc77a"; g.fillRect(0, H * 0.88, W, H * 0.12);   // a strip of lawn
  return tex(c);
}

// a framed print of a single leaf on cream paper
function printTex() {
  const [c, g] = canvas(160, 210);
  g.fillStyle = "#f6efe2"; g.fillRect(0, 0, 160, 210);
  g.strokeStyle = "#6f8f5a"; g.lineWidth = 3; g.beginPath(); g.moveTo(80, 180); g.lineTo(80, 40); g.stroke();
  g.fillStyle = "#86a96b";
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const y = 60 + i * 20; g.beginPath(); g.ellipse(80 + s * 22, y, 22, 8, s * -0.5, 0, Math.PI * 2); g.fill(); }
  return tex(c);
}

// a soft warm patch of sunlight on the floor (or a wall): additive, painted, so the drawn look keeps it
function sunPatch(parent, w, d, x, z, skew, strength = 0.32) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color("#ffd9a0") }, uK: { value: strength } },
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 uColor; uniform float uK; varying vec2 vUv; void main() { vec2 q = abs(vUv - 0.5) * 2.0; float a = (1.0 - smoothstep(0.55, 1.0, q.x)) * (1.0 - smoothstep(0.45, 1.0, q.y)); gl_FragColor = vec4(uColor * uK * a, 1.0); }",
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2,
  });
  m.userData.outlineParameters = { visible: false };
  const g = new THREE.PlaneGeometry(w, d); g.applyMatrix4(new THREE.Matrix4().makeShear(0, 0, skew, 0, 0, 0));
  const p = new THREE.Mesh(g, m); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.006, z); p.renderOrder = 0; parent.add(p);
  return p;
}

// a potted plant: a round pot and a crown of long leaves (soft ovals), like the storyboard's corner plants
function plant(parent, rnd, x, z, h, pot = "#efe6d8") {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.32, 20), std(pot, { roughness: 0.6 })); p.position.y = 0.16; p.castShadow = p.receiveShadow = true; g.add(p);
  const soil = new THREE.Mesh(new THREE.CircleGeometry(0.155, 20), std("#6b4a33")); soil.rotation.x = -Math.PI / 2; soil.position.y = 0.3; g.add(soil);
  const greens = ["#5e9a4a", "#74b25a", "#4f8a3e"].map((c) => std(c, { roughness: 0.7 }));
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + rnd() * 0.4, tilt = 0.35 + rnd() * 0.5, L = h * (0.45 + rnd() * 0.35);
    const stem = new THREE.Group(); stem.position.y = 0.3; stem.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt); g.add(stem);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), greens[i % 3]); leaf.scale.set(0.55, L / 0.18, 0.22); leaf.position.y = L / 2; leaf.castShadow = true; stem.add(leaf);
  }
  return g;
}

export function buildApartment(scene, S = {}) {
  const rnd = rng((S.seed || 5) * 389), g = new THREE.Group(); scene.add(g);
  const A = APARTMENT, WZ = A.wallZ;
  scene.background = new THREE.Color("#f6ecd9");
  scene.fog = new THREE.Fog("#f6ecd9", 14, 30);

  const floor = flat(new THREE.Mesh(new THREE.PlaneGeometry(14, 12), std("#ffffff", { map: floorTex(rnd), roughness: 0.55 })));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 4.25); g.add(floor);

  // the cream back wall, with holes for the two windows (a shape with holes, so the frames sit in real openings)
  const wallM = std("#f3e6cc"), [wl, wr] = [-6, 6], wallH = 4.6;
  const sh = new THREE.Shape(); sh.moveTo(wl, 0); sh.lineTo(wr, 0); sh.lineTo(wr, wallH); sh.lineTo(wl, wallH); sh.lineTo(wl, 0);
  for (const [a, b] of [A.winL, A.winR]) { const h = new THREE.Path(); h.moveTo(a, A.winY[0]); h.lineTo(a, A.winY[1]); h.lineTo(b, A.winY[1]); h.lineTo(b, A.winY[0]); h.lineTo(a, A.winY[0]); sh.holes.push(h); }
  const wall = flat(new THREE.Mesh(new THREE.ShapeGeometry(sh), wallM)); wall.position.z = WZ; g.add(wall);
  // skirting board and a picture rail
  const trim = std("#fbf6ec", { roughness: 0.6 });
  box(g, 12, 0.11, 0.03, trim, 0, 0.055, WZ + 0.015);
  box(g, 12, 0.04, 0.03, trim, 0, 2.85, WZ + 0.015);
  // side walls far out, so a wide shot never sees past the room
  for (const s of [-1, 1]) { const w = flat(new THREE.Mesh(new THREE.PlaneGeometry(12, wallH), std("#efdfc2"))); w.rotation.y = -s * Math.PI / 2; w.position.set(s * 4.2, wallH / 2, 4); g.add(w); }

  // the windows: the painted view behind, white frames with a cross bar, a deep sill, sheer curtains either side
  for (const [k, [a, b]] of [A.winL, A.winR].entries()) {
    const side = k ? 1 : -1, cx = (a + b) / 2, w = b - a, y0 = A.winY[0], y1 = A.winY[1], cy = (y0 + y1) / 2, h = y1 - y0;
    const view = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.1, h + 0.1), basic({ map: viewTex(rnd, side) })); view.position.set(cx, cy, WZ - 0.18); g.add(view);
    // the reveal (the wall's thickness) round the opening
    const rev = std("#f7ecd8");
    box(g, w, 0.02, 0.18, rev, cx, y1 + 0.01, WZ - 0.09); box(g, 0.02, h, 0.18, rev, a - 0.01, cy, WZ - 0.09); box(g, 0.02, h, 0.18, rev, b + 0.01, cy, WZ - 0.09);
    const fr = std("#fffaf0", { roughness: 0.5 });
    box(g, w + 0.12, 0.07, 0.07, fr, cx, y1 + 0.035, WZ + 0.02); box(g, 0.07, h, 0.07, fr, a - 0.035, cy, WZ + 0.02); box(g, 0.07, h, 0.07, fr, b + 0.035, cy, WZ + 0.02);
    box(g, 0.045, h, 0.05, fr, cx, cy, WZ - 0.1); box(g, w, 0.045, 0.05, fr, cx, y0 + h * 0.62, WZ - 0.1);
    box(g, w + 0.24, 0.05, 0.22, fr, cx, y0 - 0.025, WZ + 0.08);   // the sill
    // sheer curtains: pale, gathered panels at the window's sides
    const cur = std("#fffdf6", { roughness: 0.9, transparent: true, opacity: 0.92 });
    for (const s of [-1, 1]) {
      const pts = []; for (let i = 0; i <= 12; i++) pts.push(new THREE.Vector3((i / 12) * 0.36, 0, 0.025 * Math.sin(i * 1.7)));
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.36, h + 0.5, 12, 1), cur);
      const p = panel.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.03 * Math.sin(p.getX(i) * 26));
      panel.geometry.computeVertexNormals();
      panel.position.set(s < 0 ? a - 0.2 : b + 0.2, cy + 0.15, WZ + 0.12); panel.castShadow = false; g.add(panel);
    }
    box(g, w + 1.0, 0.03, 0.03, std("#c9a477"), cx, y1 + 0.35, WZ + 0.12);   // the curtain rod
    // sunlight: a soft patch in front of each window, reaching toward the room (the sun is to the right)
    sunPatch(g, w * 1.05, 1.5, cx + 0.2, WZ + 0.95, 0.25, k ? 0.34 : 0.28);
  }
  // a little extra warmth on the wall beside each window
  // the framed leaf print between the windows
  const px = (A.winL[1] + A.winR[0]) / 2;
  box(g, 0.56, 0.72, 0.035, std("#d6b88e", { roughness: 0.5 }), px, 1.9, WZ + 0.02);
  const pr = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.62), basic({ map: printTex() })); pr.position.set(px, 1.9, WZ + 0.04); g.add(pr);

  // the bookcase at the right: pale wood, four shelves of books and a small plant
  const shelfM = std("#d8b07c", { roughness: 0.6 }), sx = A.shelfX, sz = WZ + 0.2, sw = 0.8, sd = 0.32, shH = 1.75;
  box(g, 0.03, shH, sd, shelfM, sx - sw / 2, shH / 2, sz); box(g, 0.03, shH, sd, shelfM, sx + sw / 2, shH / 2, sz);
  box(g, sw, 0.03, sd, shelfM, sx, shH, sz); box(g, sw, 0.012, 0.02, std("#c9a06c"), sx, shH / 2, sz - sd / 2 + 0.01);
  const bookC = ["#d97b5c", "#6f9bc4", "#e8c066", "#8fb37a", "#c48fb0", "#f0e2c6", "#5e7d9c"];
  for (let j = 0; j < 4; j++) {
    const y = 0.02 + j * (shH / 4); box(g, sw, 0.025, sd, shelfM, sx, y, sz);
    let x = sx - sw / 2 + 0.03; const end = sx + sw / 2 - 0.03 - (j === 2 ? 0.25 : 0);
    while (x < end - 0.04) { const bw = 0.035 + rnd() * 0.03, bh = 0.24 + rnd() * 0.12; box(g, bw, bh, 0.22, std(bookC[Math.floor(rnd() * bookC.length)], { roughness: 0.7 }), x + bw / 2, y + 0.0125 + bh / 2, sz); x += bw + 0.004; }
    if (j === 2) plant(g, rnd, sx + sw / 2 - 0.14, sz, 0.25, "#e8d9c4").scale.setScalar(0.55);
  }
  // potted plants: a tall one in front of the left window, a smaller one at the right window
  plant(g, rnd, A.winL[0] + 0.15, WZ + 0.45, 0.75);
  plant(g, rnd, A.winR[0] - 0.12, WZ + 0.35, 0.5, "#d9c2a3").scale.setScalar(0.8);
  // a round pale rug for the stage, very subtle
  const rug = flat(new THREE.Mesh(new THREE.CircleGeometry(1.0, 48), std("#efe1c8", { roughness: 0.95 }))); rug.rotation.x = -Math.PI / 2; rug.scale.set(1.5, 0.8, 1); rug.position.set(0.1, 0.004, -0.15); g.add(rug);
  return g;
}
