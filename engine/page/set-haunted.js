import * as THREE from "three";
import { rng } from "./util.js";

// "haunted": a haunted-house corridor at night, for HAUNTED HOUSE (25 Oct). Seen side-on: dusty plum damask wallpaper
// over a dark wooden wainscot, two candle sconces, a crooked portrait, an arched window on a moonlit sky, cobwebs in
// the top corners, dark floorboards with a long red runner, and low mist. The corridor runs left to right past the
// camera, so fighters walk in from the left edge and out at the right. The coffin is a prop (props-trend.js) that
// stands against the wall at HAUNTED.coffinX. Use it with `night: true` so look C picks its night colours.
// spec: { type: "haunted", seed: 4, night: true }
export const HAUNTED = { wallZ: -1.6, coffinX: 0.35, runnerZ: [-1.05, 0.15], pumpkin: [1.02, 0.5] };

function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rx !== 1 || ry !== 1) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); }
  return t;
}
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });
const basic = (o) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; return m; };
function box(parent, w, h, d, m, x, y, z) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; parent.add(b); return b; }
function glow(parent, color, size, x, y, z, strength = 0.6) {
  const [c, g] = canvas(128, 128), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.45)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const m = basic({ map: tex(c), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: strength });
  const s = new THREE.Mesh(new THREE.PlaneGeometry(size, size), m); s.position.set(x, y, z); s.renderOrder = 2; parent.add(s);
  return s;
}

// damask: a repeating diamond of curls on dusty plum, with a few stains and a torn patch showing the plaster
function wallpaperTex(rnd) {
  const [c, g] = canvas(512, 512);
  g.fillStyle = "#5b3f5e"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "rgba(40,24,48,0.55)";
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    const cx = x * 128 + (y % 2) * 64, cy = y * 128 + 64;
    g.beginPath(); g.ellipse(cx, cy, 20, 34, 0, 0, Math.PI * 2); g.fill();
    for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * 22, cy - 18, 12, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(cx + s * 22, cy + 18, 12, 0, Math.PI * 2); g.fill(); }
    g.fillRect(cx - 2, cy - 56, 4, 112);
  }
  // faint vertical stripes and grime toward the bottom
  for (let x = 0; x < 512; x += 64) { g.fillStyle = "rgba(120,90,120,0.12)"; g.fillRect(x, 0, 6, 512); }
  for (let i = 0; i < 9; i++) { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 60 + rnd() * 60); gr.addColorStop(0, "rgba(30,20,20,0.18)"); gr.addColorStop(1, "rgba(30,20,20,0)"); g.save(); g.translate(rnd() * 512, rnd() * 512); g.fillStyle = gr; g.fillRect(-120, -120, 240, 240); g.restore(); }
  return c;
}
function wainscotTex() {
  const [c, g] = canvas(512, 256);
  g.fillStyle = "#3a231c"; g.fillRect(0, 0, 512, 256);
  for (let x = 0; x < 512; x += 128) {
    g.fillStyle = "#4a2e24"; g.fillRect(x + 16, 26, 96, 200);
    g.strokeStyle = "#24140f"; g.lineWidth = 6; g.strokeRect(x + 16, 26, 96, 200);
    g.strokeStyle = "rgba(160,110,80,0.25)"; g.lineWidth = 2; g.strokeRect(x + 22, 32, 84, 188);
  }
  return c;
}
function boardsTex(rnd) {
  const [c, g] = canvas(512, 512), n = 8, h = 512 / n;
  for (let i = 0; i < n; i++) {
    const v = 0.88 + rnd() * 0.18;
    g.fillStyle = `rgb(${Math.round(78 * v)},${Math.round(56 * v)},${Math.round(50 * v)})`; g.fillRect(0, i * h, 512, h);
    g.fillStyle = "rgba(15,8,8,0.7)"; g.fillRect(0, i * h, 512, 3); g.fillRect(rnd() * 512, i * h, 3, h);
    for (let k = 0; k < 6; k++) { g.strokeStyle = `rgba(40,25,20,${0.15 + rnd() * 0.1})`; g.lineWidth = 1 + rnd(); g.beginPath(); const y = i * h + 6 + rnd() * (h - 12); g.moveTo(0, y); g.bezierCurveTo(170, y + 2, 340, y - 2, 512, y + 1); g.stroke(); }
  }
  return c;
}
function runnerTex() {
  const [c, g] = canvas(512, 128);
  g.fillStyle = "#7a1d26"; g.fillRect(0, 0, 512, 128);
  g.strokeStyle = "#c9a043"; g.lineWidth = 5; g.strokeRect(10, 10, 492, 108);
  g.strokeStyle = "rgba(201,160,67,0.5)"; g.lineWidth = 2; for (let x = 40; x < 512; x += 60) { g.beginPath(); g.moveTo(x, 64); g.lineTo(x + 20, 34); g.lineTo(x + 40, 64); g.lineTo(x + 20, 94); g.closePath(); g.stroke(); }
  return c;
}
function portraitTex() {
  const [c, g] = canvas(256, 320), W = 256, H = 320;
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#2c3a33"); bg.addColorStop(1, "#151d19"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // a stern old potato in a high collar, its eyes a little too alive
  g.fillStyle = "#1b1b22"; g.beginPath(); g.moveTo(40, H); g.quadraticCurveTo(W / 2, 170, W - 40, H); g.fill();
  g.fillStyle = "#c79a5a"; g.beginPath(); g.ellipse(W / 2, 150, 66, 82, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#f3eee0"; g.beginPath(); g.ellipse(W / 2 - 24, 140, 12, 9, 0, 0, 7); g.ellipse(W / 2 + 24, 140, 12, 9, 0, 0, 7); g.fill();
  g.fillStyle = "#1a1012"; g.beginPath(); g.arc(W / 2 - 20, 141, 5, 0, 7); g.arc(W / 2 + 28, 141, 5, 0, 7); g.fill();
  g.strokeStyle = "#3a2618"; g.lineWidth = 4; g.beginPath(); g.moveTo(W / 2 - 38, 122); g.lineTo(W / 2 - 12, 128); g.moveTo(W / 2 + 38, 122); g.lineTo(W / 2 + 12, 128); g.stroke();
  g.beginPath(); g.moveTo(W / 2 - 16, 190); g.quadraticCurveTo(W / 2, 184, W / 2 + 16, 190); g.stroke();
  g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(0, 0, W, H);
  return c;
}
function skyTex(rnd) {
  const [c, g] = canvas(256, 384), W = 256, H = 384;
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#151a3d"); gr.addColorStop(0.7, "#3a2d66"); gr.addColorStop(1, "#6b4778"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,240,${0.3 + rnd() * 0.6})`; g.fillRect(rnd() * W, rnd() * H * 0.6, 1.6, 1.6); }
  const mx = W * 0.58, my = H * 0.3, halo = g.createRadialGradient(mx, my, 30, mx, my, 120); halo.addColorStop(0, "rgba(255,240,210,0.5)"); halo.addColorStop(1, "rgba(255,240,210,0)");
  g.fillStyle = halo; g.fillRect(0, 0, W, H); g.fillStyle = "#fbf1cf"; g.beginPath(); g.arc(mx, my, 40, 0, Math.PI * 2); g.fill();
  // bare branches across the moon
  g.strokeStyle = "#140f22"; g.lineCap = "round";
  const branch = (x, y, a, l, w) => { if (l < 8) return; const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke(); branch(x2, y2, a - 0.45 - rnd() * 0.3, l * 0.68, w * 0.7); branch(x2, y2, a + 0.35 + rnd() * 0.3, l * 0.62, w * 0.7); };
  branch(0, H * 0.75, -0.6, 90, 10);
  g.fillStyle = "#140f22"; g.fillRect(0, H * 0.86, W, H * 0.14);
  return c;
}
function cobwebTex() {
  const [c, g] = canvas(256, 256);
  g.strokeStyle = "rgba(235,235,245,0.75)"; g.lineWidth = 2;
  // spokes from the top-left corner and sagging rings between them
  const spokes = 7, R = 250;
  for (let i = 0; i <= spokes; i++) { const a = (i / spokes) * Math.PI / 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * R, Math.sin(a) * R); g.stroke(); }
  for (let r = 40; r < R; r += 38) { g.beginPath(); for (let i = 0; i <= spokes; i++) { const a = (i / spokes) * Math.PI / 2, a0 = ((i - 0.5) / spokes) * Math.PI / 2; if (i === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r); else g.quadraticCurveTo(Math.cos(a0) * r * 0.9, Math.sin(a0) * r * 0.9, Math.cos(a) * r, Math.sin(a) * r); } g.stroke(); }
  return c;
}
function mistTex(rnd) {
  const [c, g] = canvas(512, 128);
  for (let i = 0; i < 18; i++) { const x = rnd() * 512, y = 64 + (rnd() - 0.5) * 50, r = 40 + rnd() * 70; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(255,255,255,0.5)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 512, 128); }
  return c;
}

function sconce(room, x, y, z) {
  const brass = std("#b08a3c", { roughness: 0.4, metalness: 0.6 });
  box(room, 0.06, 0.18, 0.03, brass, x, y - 0.05, z + 0.015);
  const arm = box(room, 0.03, 0.03, 0.16, brass, x, y - 0.12, z + 0.09);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.04, 16), brass); cup.position.set(x, y - 0.1, z + 0.17); room.add(cup);
  const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.14, 12), std("#efe6cf", { roughness: 0.5 })); wax.position.set(x, y - 0.01, z + 0.17); wax.castShadow = true; room.add(wax);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.06, 10), basic({ color: "#ffd36b" })); flame.position.set(x, y + 0.09, z + 0.17); flame.name = "set-flame"; room.add(flame);
  glow(room, "#ffb04a", 0.9, x, y + 0.08, z + 0.05, 0.55);
  // the warm pool the candle paints on the wallpaper
  glow(room, "#ff9a3a", 1.8, x, y, z + 0.005, 0.22);
  void arm;
}

export function buildHaunted(scene, S = {}) {
  const rnd = rng((S.seed || 4) * 811), room = new THREE.Group(); scene.add(room);
  scene.background = new THREE.Color("#150f1f"); scene.fog = null;
  const Z = HAUNTED.wallZ;

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), std("#ffffff", { map: tex(boardsTex(rnd), 6, 5), roughness: 0.7 }));
  floor.rotation.x = -Math.PI / 2; floor.position.z = 2.4; floor.receiveShadow = true; floor.material.userData.noOutline = true; floor.name = "set-floor"; room.add(floor);
  const [r0, r1] = HAUNTED.runnerZ;
  const runner = new THREE.Mesh(new THREE.PlaneGeometry(14, r1 - r0), std("#ffffff", { map: tex(runnerTex(), 7, 1), roughness: 0.9 }));
  runner.rotation.x = -Math.PI / 2; runner.position.set(0, 0.003, (r0 + r1) / 2); runner.receiveShadow = true; runner.material.userData.noOutline = true; room.add(runner);

  // the wall: wallpaper above a wainscot, a chair rail, a skirting board and a crown moulding
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.6), std("#ffffff", { map: tex(wallpaperTex(rnd), 9, 2.4), roughness: 0.9 }));
  wall.position.set(0, 1.8 + 0.75 / 2, Z); wall.receiveShadow = true; wall.material.userData.noOutline = true; room.add(wall);
  const wain = new THREE.Mesh(new THREE.PlaneGeometry(14, 0.78), std("#ffffff", { map: tex(wainscotTex(), 14, 1), roughness: 0.7 }));
  wain.position.set(0, 0.39, Z + 0.012); wain.receiveShadow = true; wain.material.userData.noOutline = true; room.add(wain);
  const trim = std("#2a1712", { roughness: 0.6 });
  box(room, 14, 0.05, 0.05, trim, 0, 0.79, Z + 0.03); box(room, 14, 0.1, 0.03, trim, 0, 0.05, Z + 0.02); box(room, 14, 0.12, 0.08, trim, 0, 3.45, Z + 0.04);

  // the portrait, hung crooked, left of the coffin
  const pf = new THREE.Group(); pf.position.set(-0.98, 1.62, Z + 0.03); pf.rotation.z = 0.06; room.add(pf);
  const gold = std("#a07b33", { roughness: 0.45, metalness: 0.5 });
  box(pf, 0.52, 0.64, 0.04, gold, 0, 0, 0);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.54), std("#ffffff", { map: tex(portraitTex()), roughness: 0.8 })); pic.position.z = 0.022; pic.material.userData.noOutline = true; pf.add(pic);

  // the arched window on the right, a moonlit sky behind it
  const wx = 1.58, wy = 1.75, ww = 0.62, wh = 1.0;
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), basic({ map: tex(skyTex(rnd)) })); sky.position.set(wx, wy, Z + 0.006); room.add(sky);
  const frame = std("#24140f", { roughness: 0.6 });
  box(room, ww + 0.08, 0.05, 0.05, frame, wx, wy - wh / 2, Z + 0.03); box(room, 0.05, wh, 0.05, frame, wx - ww / 2, wy, Z + 0.03); box(room, 0.05, wh, 0.05, frame, wx + ww / 2, wy, Z + 0.03);
  box(room, 0.03, wh, 0.03, frame, wx, wy, Z + 0.03); box(room, ww, 0.03, 0.03, frame, wx, wy + 0.05, Z + 0.03);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(ww / 2, 0.03, 8, 24, Math.PI), frame); arch.position.set(wx, wy + wh / 2, Z + 0.03); room.add(arch);
  const archSky = new THREE.Mesh(new THREE.CircleGeometry(ww / 2, 24, 0, Math.PI), basic({ color: "#1a1d44" })); archSky.position.set(wx, wy + wh / 2, Z + 0.006); room.add(archSky);
  glow(room, "#b9b0ff", 1.4, wx, wy + 0.2, Z + 0.02, 0.18);

  // candles either side of where the coffin stands
  sconce(room, HAUNTED.coffinX - 0.62, 1.5, Z);
  sconce(room, HAUNTED.coffinX + 0.66, 1.5, Z);

  // cobwebs in the top corners of the frame
  const webM = basic({ map: tex(cobwebTex()), transparent: true, depthWrite: false, opacity: 0.7 });
  for (const [x, s] of [[-1.2, 1], [1.5, -1]]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.75), webM); w.position.set(x + s * 0.0, 3.05, Z + 0.05); w.scale.x = s; room.add(w); }

  // low mist drifting over the floor at the back (painted, additive)
  const mistM = basic({ map: tex(mistTex(rnd)), color: "#9f8fd6", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.25 });
  for (const [z, y, s] of [[Z + 0.2, 0.12, 1], [Z + 0.6, 0.06, 0.8]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.5 * s), mistM); m.position.set(0, y, z); m.renderOrder = 1; room.add(m); }

  // a jack-o'-lantern on the floor at the front right, glowing
  const pk = new THREE.Group(); const [px, pz] = HAUNTED.pumpkin; pk.position.set(px, 0, pz); room.add(pk);
  const pumpkin = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 14), std("#e8742a", { roughness: 0.5, emissive: new THREE.Color("#ff7a1a"), emissiveIntensity: 0.15 })); pumpkin.scale.set(1.2, 0.85, 1.1); pumpkin.position.y = 0.11; pumpkin.castShadow = true; pk.add(pumpkin);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.05, 8), std("#4f6b2a")); stem.position.y = 0.23; pk.add(stem);
  const faceM = basic({ color: "#ffd36b" });
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.CircleGeometry(0.025, 3), faceM); e.position.set(s * 0.05, 0.14, 0.142); e.rotation.z = Math.PI / 2; pk.add(e); }
  const mouth = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.022), faceM); mouth.position.set(0, 0.08, 0.14); pk.add(mouth);
  glow(room, "#ff9a3a", 0.8, px, 0.15, pz + 0.2, 0.35);

  return room;
}
