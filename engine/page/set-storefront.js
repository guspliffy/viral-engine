import * as THREE from "three";
import { rng } from "./util.js";
import { drawPeach } from "./props-duo.js";

// "storefront": the bitten-peach phone store on launch morning, for DUO: Launch Day (Jonny's story library #10,
// 28 Oct 2026). A minimalist cream-and-glass facade along x at z STORE.wallZ, facing +z, with a bright store inside.
// The entrance (STORE.doorX, a doorway STORE.doorW wide; its sliding glass panels are the "storedoors" prop) is left of
// the main product window, which holds a standing poster of the mark and an open book-fold phone. The glowing mark and
// DUO sit on the dark sign band over the entrance. The pavement (pale stone slabs) runs along the facade toward +x,
// where the street goes on past a neighbour building and a row of trees; beyond the far end, a city backdrop.
// The ledge, tents, queue posts and boxes are props (props-duo.js), so they can be placed and timed.
// spec: { type: "storefront", seed }
export const STORE = { wallZ: -2.0, doorX: -2.4, doorW: 1.2, doorH: 2.2, winX: [-1.68, 1.95], storeX: [-4.6, 5.4], bandY: [2.45, 3.25], kerbZ: 3.4 };

function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8;
  return t;
}
const lam = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });
const unlit = (o) => { const m = new THREE.MeshBasicMaterial({ toneMapped: false, ...o }); m.userData.noOutline = true; return m; };
function box(g, w, h, d, m, x, y, z, cast = false) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = true; g.add(o); return o; }
function plane(g, w, h, m, x, y, z, ry = 0) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.y = ry; o.receiveShadow = true; g.add(o); return o; }

export function buildStorefront(scene, S = {}) {
  const rnd = rng((S.seed || 5) * 211), g = new THREE.Group(); scene.add(g);
  const Z = STORE.wallZ, [x0, x1] = STORE.storeX, [b0, b1] = STORE.bandY, dX = STORE.doorX, dW = STORE.doorW, dH = STORE.doorH;
  scene.background = new THREE.Color("#a9d4f2");
  scene.fog = new THREE.Fog("#f2dcc0", 16, 42);

  // the sky: blue overhead fading to a warm morning haze at the horizon
  const sky = new THREE.Mesh(new THREE.SphereGeometry(80, 32, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, map: canvasTex(8, 256, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#5aa6e6"); gr.addColorStop(0.42, "#a9d4f2"); gr.addColorStop(0.5, "#ffe2bd"); gr.addColorStop(1, "#ffe2bd");
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
  }) }));
  sky.material.userData.noOutline = true; g.add(sky);

  // ---------------------------------------------------------------- the pavement: pale stone slabs, a kerb, the road
  const slabs = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = "#e6ddd0"; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const v = 222 + Math.floor(rnd() * 16); c.fillStyle = `rgb(${v},${v - 6},${v - 16})`; c.fillRect(i * 128 + 2, j * 128 + 2, 124, 124);
      for (let k = 0; k < 40; k++) { const q = 200 + Math.floor(rnd() * 30); c.fillStyle = `rgba(${q},${q - 8},${q - 20},0.35)`; c.fillRect(i * 128 + rnd() * 124, j * 128 + rnd() * 124, 2, 2); }
    }
  }, 14, 3.4);
  const pave = new THREE.Mesh(new THREE.PlaneGeometry(56, 13.6), lam("#ffffff", { map: slabs }));
  pave.rotation.x = -Math.PI / 2; pave.position.set(6, 0, Z + 6.8 - 0.2); pave.receiveShadow = true; pave.material.userData.noOutline = true; g.add(pave);
  box(g, 56, 0.14, 0.16, lam("#c9c2b6"), 6, -0.06, STORE.kerbZ + 0.08);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(56, 12), lam("#6d6f75")); road.rotation.x = -Math.PI / 2; road.position.set(6, -0.13, STORE.kerbZ + 6.2); road.material.userData.noOutline = true; g.add(road);

  // ---------------------------------------------------------------- inside the store: bright, warm, simple
  const IN = Z - 4.2;
  const floorIn = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, Z - IN), lam("#e9d6b8")); floorIn.rotation.x = -Math.PI / 2; floorIn.position.set((x0 + x1) / 2, 0.002, (Z + IN) / 2); floorIn.material.userData.noOutline = true; g.add(floorIn);
  plane(g, x1 - x0, 3.2, unlit({ color: "#fff3df" }), (x0 + x1) / 2, 1.6, IN);
  plane(g, x1 - x0, Z - IN, unlit({ color: "#fffaf0" }), (x0 + x1) / 2, 3.0, (Z + IN) / 2).rotation.x = Math.PI / 2;
  // ceiling light strips and a row of display tables with lit devices on them
  for (let i = 0; i < 6; i++) { const l = plane(g, 0.12, 2.6, unlit({ color: "#ffffff" }), x0 + 0.9 + i * 1.75, 2.98, (Z + IN) / 2); l.rotation.set(Math.PI / 2, 0, 0); }
  const wood = lam("#d9b98d"), dev = unlit({ color: "#9fc4ff" }), dev2 = unlit({ color: "#ffd59a" });
  for (const [tx, tz] of [[-3.6, Z - 1.5], [-1.5, Z - 1.7], [0.6, Z - 1.5], [2.7, Z - 1.7], [4.6, Z - 1.5]]) {
    box(g, 1.5, 0.08, 0.7, wood, tx, 0.8, tz); box(g, 1.3, 0.8, 0.5, lam("#e8dcc8"), tx, 0.4, tz);
    for (let k = 0; k < 4; k++) { const d = plane(g, 0.16, 0.11, k % 2 ? dev : dev2, tx - 0.5 + k * 0.33, 0.9, tz + 0.05); d.rotation.x = -0.6; }
  }
  // shelves of boxes on the back wall
  for (let i = 0; i < 9; i++) { const sx = x0 + 0.6 + i * 1.1; box(g, 0.8, 0.04, 0.25, wood, sx, 1.5, IN + 0.15); for (let k = 0; k < 3; k++) box(g, 0.18, 0.22, 0.2, lam("#fbfaf6"), sx - 0.25 + k * 0.25, 1.63, IN + 0.15); }

  // ---------------------------------------------------------------- the facade
  const cream = lam("#efe3cf"), creamDark = lam("#e3d3b9"), alu = lam("#8c929a"), band = lam("#3a3d44");
  const glassM = new THREE.MeshStandardMaterial({ color: "#cfe7f2", roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.16, depthWrite: false });
  glassM.userData.noOutline = true;
  // a soft diagonal sheen on the glass (window reflections), the same direction everywhere
  const sheen = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, map: canvasTex(256, 256, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    for (const [o, a] of [[0.18, 0.18], [0.42, 0.08], [0.63, 0.13]]) {
      const gr = c.createLinearGradient(0, h, w, 0); gr.addColorStop(Math.max(0, o - 0.06), "rgba(255,255,255,0)"); gr.addColorStop(o, `rgba(255,250,240,${a})`); gr.addColorStop(Math.min(1, o + 0.06), "rgba(255,255,255,0)");
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
    }
  }) });
  sheen.userData.noOutline = true;
  const glassPane = (xa, xb, ya, yb) => {
    const p = plane(g, xb - xa, yb - ya, glassM, (xa + xb) / 2, (ya + yb) / 2, Z + 0.01); p.renderOrder = 3;
    const s = plane(g, xb - xa, yb - ya, sheen, (xa + xb) / 2, (ya + yb) / 2, Z + 0.015); s.renderOrder = 4;
    // the aluminium frame round it
    for (const [w, h, x, y] of [[xb - xa, 0.05, (xa + xb) / 2, yb], [xb - xa, 0.07, (xa + xb) / 2, ya], [0.05, yb - ya, xa, (ya + yb) / 2], [0.05, yb - ya, xb, (ya + yb) / 2]]) box(g, w, h, 0.06, alu, x, y, Z + 0.01);
  };
  // pilasters and the low base under the windows (where the facade isn't glass)
  const [w0, w1] = STORE.winX;
  box(g, 0.2, b0, 0.2, cream, x0 - 0.1, b0 / 2, Z + 0.05, true);
  box(g, 0.2, b0, 0.2, cream, dX - dW / 2 - 0.1, b0 / 2, Z + 0.05, true);
  box(g, 0.2, b0, 0.2, cream, dX + dW / 2 + 0.08, b0 / 2, Z + 0.05, true);
  box(g, 0.24, b0, 0.22, cream, w1 + 0.12, b0 / 2, Z + 0.05, true);
  box(g, 0.2, b0, 0.2, cream, x1 + 0.1, b0 / 2, Z + 0.05, true);
  for (const [xa, xb] of [[x0, dX - dW / 2 - 0.2], [w0, w1], [w1 + 0.24, x1]]) { box(g, xb - xa, 0.32, 0.16, creamDark, (xa + xb) / 2, 0.16, Z + 0.02); glassPane(xa, xb, 0.32, b0 - 0.05); }
  glassPane(dX - dW / 2, dX + dW / 2, dH, b0 - 0.05);   // the transom over the doorway
  // the door track along the top of the doorway and the threshold
  box(g, dW * 2.1, 0.08, 0.1, alu, dX, dH + 0.04, Z + 0.05);
  box(g, dW + 0.1, 0.012, 0.3, alu, dX, 0.006, Z);
  // the sign band, the glowing mark over the entrance and the word DUO
  box(g, x1 - x0 + 0.4, b1 - b0, 0.22, band, (x0 + x1) / 2, (b0 + b1) / 2, Z + 0.06);
  const mark = canvasTex(1024, 512, (c, w, h) => { c.clearRect(0, 0, w, h); drawPeach(c, w * 0.3, h * 0.5, h * 0.36, "glow"); c.fillStyle = "#fff6ea"; c.shadowColor = "rgba(255,200,150,0.9)"; c.shadowBlur = 18; c.font = `bold ${Math.round(h * 0.38)}px 'DejaVu Sans', Arial, sans-serif`; c.textBaseline = "middle"; c.fillText("DUO", w * 0.52, h * 0.53); });
  const sign = plane(g, 1.9, 0.95, unlit({ map: mark, transparent: true }), dX + 0.25, (b0 + b1) / 2, Z + 0.175); sign.renderOrder = 2;
  // the upper building: warm stone with a row of windows
  box(g, x1 - x0 + 0.4, 6, 0.3, lam("#e8dcc6"), (x0 + x1) / 2, b1 + 3, Z - 0.05);
  for (let i = 0; i < 6; i++) for (let k = 0; k < 2; k++) box(g, 0.9, 1.2, 0.05, lam("#9db8c9"), x0 + 0.9 + i * 1.7, b1 + 1.2 + k * 2.2, Z + 0.11);

  // ---------------------------------------------------------------- the window poster: the mark, DUO and an open phone
  const poster = canvasTex(512, 768, (c, w, h) => {
    c.fillStyle = "#fbfaf6"; c.fillRect(0, 0, w, h);
    drawPeach(c, w / 2, h * 0.15, w * 0.11);
    c.fillStyle = "#3d4fa3"; c.font = `bold ${Math.round(w * 0.1)}px 'DejaVu Sans', Arial, sans-serif`; c.textAlign = "center"; c.fillText("DUO", w / 2, h * 0.3);
    // a silver book-fold phone, open toward us, its two screens one picture
    c.save(); c.translate(w / 2, h * 0.64);
    for (const s of [-1, 1]) {
      c.save(); c.transform(1, s * 0.08, 0, 1, 0, 0);
      c.fillStyle = "#c9ced6"; c.beginPath(); c.roundRect(s > 0 ? 4 : -w * 0.36, -h * 0.26, w * 0.32, h * 0.52, 18); c.fill();
      const gr = c.createLinearGradient(-w * 0.3, -h * 0.25, w * 0.3, h * 0.25); gr.addColorStop(0, "#14246e"); gr.addColorStop(0.45, "#2d55d6"); gr.addColorStop(0.8, "#f2a24a"); gr.addColorStop(1, "#ffd27a");
      c.fillStyle = gr; c.beginPath(); c.roundRect(s > 0 ? 14 : -w * 0.36 + 10, -h * 0.25, w * 0.3 - 6, h * 0.5, 12); c.fill();
      c.restore();
    }
    c.fillStyle = "#aab0b8"; c.fillRect(-4, -h * 0.26, 8, h * 0.52);
    c.restore();
  });
  const pX = (w0 + w1) / 2 + 0.55;
  plane(g, 0.95, 1.42, lam("#ffffff", { map: poster }), pX, 1.25, Z - 0.25);
  box(g, 0.05, 0.55, 0.05, alu, pX, 0.27, Z - 0.28);

  // ---------------------------------------------------------------- the neighbours and the street beyond
  box(g, 0.3, 9, 0.3, lam("#d8c7ab"), x1 + 0.35, 4.5, Z);
  for (const [xa, xb, col, h] of [[x1 + 0.5, x1 + 6, "#d6b394", 9], [x0 - 6, x0 - 0.2, "#c9b8a2", 9.5], [x1 + 6, x1 + 12, "#b9c7cf", 12]]) {
    box(g, xb - xa, h, 0.3, lam(col), (xa + xb) / 2, h / 2, Z - 0.1);
    for (let i = 0; i < Math.floor((xb - xa) / 1.4); i++) for (let k = 0; k < 4; k++) box(g, 0.7, 0.9, 0.05, lam("#8eaabd"), xa + 0.8 + i * 1.4, 1.2 + k * 2.1, Z + 0.06);
  }
  // street trees in round planters past the store (out of the queue's lane), and city blocks at the far end
  const leaf = [lam("#6aa84f"), lam("#82bb5a"), lam("#9cc95f")], trunk = lam("#6b4f3a");
  for (const tx of [x1 + 8.5, x1 + 12, x1 + 15.5]) {
    const tz = STORE.kerbZ - 0.5;
    box(g, 0.08, 1.8, 0.08, trunk, tx, 0.9, tz);
    for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.45 + rnd() * 0.25, 16, 12), leaf[k % 3]); b.position.set(tx + (rnd() - 0.5) * 0.8, 2.0 + rnd() * 0.8, tz + (rnd() - 0.5) * 0.7); b.castShadow = true; g.add(b); }
  }
  for (let i = 0; i < 9; i++) {
    const bx = x1 + 15 + rnd() * 10, bz = Z - 4 + i * 2.6, h = 8 + rnd() * 14, w = 2 + rnd() * 2;
    box(g, w, h, 2.2, lam(["#c4b4a0", "#aebfcc", "#d7c3a5", "#9fb2c2"][i % 4]), bx, h / 2, bz);
  }
  return {};
}
