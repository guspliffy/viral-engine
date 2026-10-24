import * as THREE from "three";
import { rng } from "./util.js";

// "hills": a sunny meadow with a hand-painted background, the way anime backgrounds are made: a painted sky with
// cumulus clouds and painted hill layers on flat cards at different depths (they still give parallax when the camera
// moves), then a real 3D ground with grass tufts and flowers for the characters to stand on and cast shadows on.
// Everything is painted with canvas 2D from a seed, so it is the same in every render.
// spec: { type: "hills", seed: 3 }

function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rx !== 1 || ry !== 1) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); }
  return t;
}
// a flat painted card facing the camera (unlit: the painting already has its light)
function card(scene, c, w, h, x, y, z) {
  const m = new THREE.MeshBasicMaterial({ map: tex(c), transparent: true, depthWrite: false, fog: false });
  m.userData.noOutline = true;
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.renderOrder = -10 - Math.round(-z); scene.add(p);
  return p;
}

// one anime cumulus: a mound of puffs with a cool shadow underside, a lit top-left and a flat, soft base
function cloud(g, cx, cy, w, rnd) {
  const puffs = [], n = 7 + Math.floor(rnd() * 6);
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1) - 0.5, r = w * (0.11 + 0.13 * (1 - Math.abs(u) * 1.6) + rnd() * 0.05);
    puffs.push([cx + u * w * 0.9, cy - r * (0.4 + rnd() * 0.5), Math.max(r, w * 0.06)]);
  }
  // a few puffs stacked on top: the towering part
  for (let i = 0; i < 3; i++) { const p = puffs[1 + Math.floor(rnd() * (n - 2))]; puffs.push([p[0] + (rnd() - 0.5) * w * 0.15, p[1] - p[2] * 0.7, p[2] * (0.6 + rnd() * 0.25)]); }
  // small puffs along the upper edge give the scalloped outline of a painted cumulus
  for (const [x, y, r] of puffs.slice()) for (let k = 0; k < 4; k++) {
    const a = -Math.PI * (0.15 + rnd() * 0.7), rr = r * (0.22 + rnd() * 0.18);
    puffs.push([x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92, rr]);
  }
  const base = cy + w * 0.02;
  // painted on its own small canvas and blurred once when placed (a canvas filter on every fill is very slow)
  const x0 = Math.floor(Math.min(...puffs.map(([x, , r]) => x - r)) - 4), y0 = Math.floor(Math.min(...puffs.map(([, y, r]) => y - r)) - 4);
  const x1 = Math.ceil(Math.max(...puffs.map(([x, , r]) => x + r)) + 4), y1 = Math.ceil(base + w * 0.05);
  const [c, h] = canvas(x1 - x0, y1 - y0); h.translate(-x0, -y0);
  const fill = (dx, dy, k, col) => { h.fillStyle = col; for (const [x, y, r] of puffs) { h.beginPath(); h.arc(x + dx * r, y + dy * r, r * k, 0, Math.PI * 2); h.fill(); } };
  fill(0, 0, 1, "#b7c6e0");                // shadow body
  fill(-0.06, -0.1, 0.9, "#dbe5f4");       // half light
  fill(-0.12, -0.18, 0.78, "#f4f7fc");     // lit
  fill(-0.2, -0.28, 0.55, "#ffffff");      // brightest top-left
  // flat base: cut everything below the base line, with a soft edge
  h.globalCompositeOperation = "destination-out";
  const gr = h.createLinearGradient(0, base - w * 0.03, 0, base + w * 0.02); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)");
  h.fillStyle = gr; h.fillRect(cx - w, base - w * 0.03, w * 2, w);
  h.globalCompositeOperation = "source-over";
  g.filter = "blur(1.2px)"; g.drawImage(c, x0, y0); g.filter = "none";
  // wisps trailing off the sides
  g.fillStyle = "rgba(255,255,255,0.55)";
  for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(cx + (rnd() < 0.5 ? -1 : 1) * w * (0.5 + rnd() * 0.3), base - w * (0.02 + rnd() * 0.05), w * (0.12 + rnd() * 0.15), w * 0.012, 0, 0, Math.PI * 2); g.fill(); }
}

function paintSky(rnd) {
  const [c, g] = canvas(2048, 1024), W = 2048, H = 1024;
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#2f86e0"); gr.addColorStop(0.55, "#5aa9f0"); gr.addColorStop(0.85, "#a8d4f8"); gr.addColorStop(1, "#d6ecfb");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // big clouds high up, smaller ones towards the horizon
  for (let i = 0; i < 4; i++) cloud(g, 120 + i * 540 + rnd() * 160, 420 + rnd() * 100, 300 + rnd() * 180, rnd);
  for (let i = 0; i < 8; i++) cloud(g, rnd() * W, 540 + rnd() * 70, 120 + rnd() * 110, rnd);
  return c;
}

// a hill layer: a rolling ridge, painted light from the left, with sunlit and shaded patches and a tree line
function paintHills(rnd, o) {
  const W = 2048, H = 512, [c, g] = canvas(W, H);
  const ridge = (x) => o.top + Math.sin(x * o.f1 + o.p1) * o.a1 + Math.sin(x * o.f2 + o.p2) * o.a2;
  const path = () => { g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 8) g.lineTo(x, ridge(x)); g.lineTo(W, H); g.closePath(); };
  path();
  const gr = g.createLinearGradient(0, o.top - o.a1 - o.a2, 0, H); gr.addColorStop(0, o.light); gr.addColorStop(1, o.dark);
  g.fillStyle = gr; g.fill();
  g.save(); path(); g.clip();
  const [pc, pg] = canvas(W, H);
  for (let i = 0; i < 22; i++) {
    const x = rnd() * W, y = ridge(x) + 20 + rnd() * (H - ridge(x));
    pg.fillStyle = rnd() < 0.55 ? `rgba(255,255,190,${0.1 + rnd() * 0.12})` : `rgba(20,70,30,${0.1 + rnd() * 0.12})`;
    pg.beginPath(); pg.ellipse(x, y, 80 + rnd() * 200, 12 + rnd() * 26, (rnd() - 0.5) * 0.3, 0, Math.PI * 2); pg.fill();
  }
  g.filter = "blur(6px)"; g.drawImage(pc, 0, 0); g.filter = "none";
  // brush strokes along the slope
  for (let i = 0; i < 260; i++) {
    const x = rnd() * W, y = ridge(x) + rnd() * (H - ridge(x));
    g.strokeStyle = rnd() < 0.5 ? "rgba(255,255,200,0.12)" : "rgba(30,80,30,0.12)"; g.lineWidth = 2 + rnd() * 3;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 + rnd() * 40, y - 3 + rnd() * 6); g.stroke();
  }
  g.restore();
  // tree line along parts of the ridge
  if (o.trees) {
    for (let x = 0; x < W; x += 9) {
      if (Math.sin(x * 0.004 + o.p2 * 3) < 0.35) continue;
      const y = ridge(x), r = 8 + rnd() * 12;
      g.fillStyle = o.trees; g.beginPath(); g.arc(x, y - r * 0.5, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = "rgba(255,255,200,0.12)"; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.8, r * 0.5, 0, Math.PI * 2); g.fill();
    }
  }
  return c;
}

function paintGround(rnd) {
  const [c, g] = canvas(512, 512);
  g.fillStyle = "#88bd5a"; g.fillRect(0, 0, 512, 512);
  const [pc, pg] = canvas(512, 512);
  for (let i = 0; i < 40; i++) { pg.fillStyle = rnd() < 0.5 ? "rgba(170,220,90,0.35)" : "rgba(60,130,50,0.3)"; pg.beginPath(); pg.ellipse(rnd() * 512, rnd() * 512, 40 + rnd() * 80, 20 + rnd() * 40, rnd() * 3, 0, Math.PI * 2); pg.fill(); }
  g.filter = "blur(10px)"; g.drawImage(pc, 0, 0); g.filter = "none";
  for (let i = 0; i < 900; i++) {
    const x = rnd() * 512, y = rnd() * 512, l = 5 + rnd() * 9;
    g.strokeStyle = rnd() < 0.5 ? "rgba(190,235,120,0.4)" : "rgba(50,120,45,0.4)"; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 4, y - l); g.stroke();
  }
  return c;
}

export function buildHills(scene, S = {}) {
  const rnd = rng((S.seed || 3) * 389 + 11), group = new THREE.Group(); scene.add(group);
  scene.background = new THREE.Color("#d6ecfb"); scene.fog = null;
  card(group, paintSky(rnd), 90, 50, 0, 20, -90);
  // each layer's card stands on y = -2; its ridge (painted `top` px down a 512 px card) lands at about `ridge` m
  const layers = [
    { z: -60, w: 80, ridge: 15, top: 200, a1: 95, a2: 30, f1: 0.003, f2: 0.011, light: "#9fd47e", dark: "#6aa85a", trees: "#4c8a4a" },
    { z: -34, w: 50, ridge: 6.6, top: 200, a1: 110, a2: 30, f1: 0.0026, f2: 0.009, light: "#8fd263", dark: "#58a046", trees: "#3c7a3a" },
    { z: -18, w: 32, ridge: 2.3, top: 200, a1: 80, a2: 20, f1: 0.002, f2: 0.008, light: "#a3d66c", dark: "#6aa850", trees: "#4a8a40" },
  ];
  for (const L of layers) { const h = (L.ridge + 2) / (1 - L.top / 512); card(group, paintHills(rnd, { ...L, p1: rnd() * 6, p2: rnd() * 6 }), L.w, h, 0, h / 2 - 2, L.z); }

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshLambertMaterial({ map: tex(paintGround(rnd), 14, 9) }));
  ground.rotation.x = -Math.PI / 2; ground.position.z = -8; ground.receiveShadow = true; ground.material.userData.noOutline = true; group.add(ground);

  // grass tufts and a few flowers, kept off the middle of the stage
  const bladeM = [new THREE.MeshLambertMaterial({ color: "#5fae3f", side: THREE.DoubleSide }), new THREE.MeshLambertMaterial({ color: "#7cc94e", side: THREE.DoubleSide })];
  for (const m of bladeM) m.userData.noOutline = true;
  const blade = new THREE.ConeGeometry(0.025, 1, 4); blade.translate(0, 0.5, 0);
  for (let i = 0; i < 120; i++) {
    const x = (rnd() - 0.5) * 12, z = -6 + rnd() * 8.5;
    if (Math.abs(x) < 1.6 && z > -1.2 && z < 1.4) continue;
    const g = new THREE.Group(), n = 4 + Math.floor(rnd() * 4), hgt = 0.14 + rnd() * 0.16;
    for (let k = 0; k < n; k++) {
      const b = new THREE.Mesh(blade, bladeM[k % 2]); b.scale.set(1, hgt * (0.7 + rnd() * 0.6), 1);
      b.position.set((rnd() - 0.5) * 0.12, 0, (rnd() - 0.5) * 0.1); b.rotation.set((rnd() - 0.5) * 0.7, rnd() * 3, (rnd() - 0.5) * 0.7); b.castShadow = true; g.add(b);
    }
    g.position.set(x, 0, z); group.add(g);
  }
  return group;
}
