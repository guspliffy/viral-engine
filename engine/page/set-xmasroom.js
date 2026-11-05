import * as THREE from "three";
import { rng } from "./util.js";
import { canvas, tex, glow } from "./set-porch.js";

// "xmasroom": a warm, cosy living room on a snowy December evening, for "My friend group trying to put up one Christmas
// tree" (friends try to, episode 7, Jonny's eight panels, 4 Nov 2026). One front view: honey wood-board walls, a dark
// wooden floor with a big red patterned rug, a snowy window at the back left with red curtains, the tree's spot in the
// middle (the tree, its stand, the star and the lights are props: they move), a stone fireplace at the back right with a
// fire, a mantel with candles, a garland and three stockings, a bookcase beside it (the cat sits on top), a wall shelf
// of books above the mantel, a wall socket low on the back wall left of the fireplace, presents under the tree and in
// the front left corner, and the cat's basket on the hearth rug. Warm light from the fire (the golden look's key from
// the right), cool blue from the window.
// spec: { type: "xmasroom", light: "golden", windows: false, seed }. XMASROOM has the layout for the storyboard.
export const XMASROOM = {
  back: -2.3, w: 5.4, h: 4.8,
  tree: [0, -1.5],
  win: { x: -1.4, y0: 0.82, y1: 2.2, w: 1.1 },
  fire: { x: 1.05, w: 0.96, h: 1.02, d: 0.34 },
  shelf: { x: 1.83, w: 0.5, h: 1.62, d: 0.34 },   // the bookcase: the cat sits on its top
  socket: [0.47, 0.26],                          // on the back wall: x, y
  basket: [1.2, 0.35],                         // the cat's basket (floor x, z)
};

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
const flat = (color, o = {}) => { const m = std(color, o); m.userData.noOutline = true; return m; };
const basic = (o) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; return m; };
function box(parent, w, h, d, m, x, y, z, cast = false) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = cast; b.receiveShadow = true; parent.add(b); return b; }
function cyl(parent, r0, r1, h, m, x, y, z, seg = 16) { const b = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), m); b.position.set(x, y, z); b.receiveShadow = true; parent.add(b); return b; }

// honey wood boards running up the wall, uneven widths and tones, knots, a few darker boards (an old house)
function wallTex(rnd) {
  const [c, g] = canvas(1024, 512);
  let x = 0;
  while (x < 1024) {
    const w = 46 + rnd() * 40, v = 0.82 + rnd() * 0.24;
    g.fillStyle = `rgb(${Math.round(186 * v)},${Math.round(124 * v)},${Math.round(74 * v)})`; g.fillRect(x, 0, w, 512);
    for (let k = 0; k < 6; k++) { g.strokeStyle = `rgba(90,50,20,${0.08 + rnd() * 0.1})`; g.lineWidth = 1 + rnd() * 2; const xx = x + 4 + rnd() * (w - 8); g.beginPath(); g.moveTo(xx, 0); g.bezierCurveTo(xx + 6, 170, xx - 6, 340, xx + 3, 512); g.stroke(); }
    if (rnd() < 0.35) { g.fillStyle = "rgba(80,40,16,0.45)"; g.beginPath(); g.ellipse(x + w / 2, rnd() * 512, 5, 9, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = "rgba(50,24,8,0.75)"; g.fillRect(x, 0, 3, 512); g.fillStyle = "rgba(255,210,150,0.18)"; g.fillRect(x + 3, 0, 2, 512);
    x += w;
  }
  return c;
}
// dark, worn floorboards running across the room (u along the boards)
function floorTex(rnd) {
  const [c, g] = canvas(1024, 1024), n = 12, h = 1024 / n;
  for (let i = 0; i < n; i++) {
    const v = 0.8 + rnd() * 0.22;
    g.fillStyle = `rgb(${Math.round(112 * v)},${Math.round(66 * v)},${Math.round(38 * v)})`; g.fillRect(0, i * h, 1024, h);
    for (let k = 0; k < 6; k++) { g.strokeStyle = `rgba(40,20,8,${0.12 + rnd() * 0.1})`; g.lineWidth = 1 + rnd(); const y = i * h + 4 + rnd() * (h - 8); g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(340, y + 4, 680, y - 4, 1024, y + 2); g.stroke(); }
    g.fillStyle = "rgba(25,12,4,0.8)"; g.fillRect(0, i * h, 1024, 3);
    for (let j = 0; j < 2; j++) { const cut = rnd() * 1024; g.fillRect(cut, i * h, 3, h); }
  }
  return c;
}
// the big red patterned rug: a deep red field, a navy and cream border with a running motif, a medallion, small flowers
function rugTex(rnd) {
  const W = 1024, H = 768, [c, g] = canvas(W, H);
  g.fillStyle = "#9c2a22"; g.fillRect(0, 0, W, H);
  // worn, slightly patchy pile
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? "60,10,10" : "200,80,60"},${0.04 + rnd() * 0.05})`; g.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 10, 2 + rnd() * 3); }
  const band = (m, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.strokeRect(m, m, W - 2 * m, H - 2 * m); };
  band(22, 26, "#1f2a4a"); band(46, 8, "#e8d6a8"); band(64, 22, "#1f2a4a"); band(84, 5, "#d9a441");
  // a running motif in the border
  for (let x = 40; x < W - 30; x += 46) for (const y of [22, H - 22]) { g.fillStyle = "#d9a441"; g.beginPath(); g.moveTo(x, y - 8); g.lineTo(x + 8, y); g.lineTo(x, y + 8); g.lineTo(x - 8, y); g.fill(); }
  for (let y = 40; y < H - 30; y += 46) for (const x of [22, W - 22]) { g.fillStyle = "#d9a441"; g.beginPath(); g.moveTo(x, y - 8); g.lineTo(x + 8, y); g.lineTo(x, y + 8); g.lineTo(x - 8, y); g.fill(); }
  // the medallion
  const cx = W / 2, cy = H / 2;
  for (const [r, col] of [[200, "#1f2a4a"], [170, "#c8873a"], [140, "#7a1c18"], [96, "#e8d6a8"], [60, "#1f2a4a"], [26, "#d9a441"]]) { g.fillStyle = col; g.beginPath(); for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, rr = k % 2 ? r * 0.82 : r; g.lineTo(cx + Math.cos(a) * rr * 1.3, cy + Math.sin(a) * rr); } g.closePath(); g.fill(); }
  // little flowers scattered in the field, in rows but not perfectly
  for (let y = 130; y < H - 110; y += 64) for (let x = 130; x < W - 110; x += 72) {
    if (Math.hypot((x - cx) / 1.3, y - cy) < 230) continue;
    const col = ["#e8d6a8", "#d9a441", "#1f2a4a"][Math.floor(rnd() * 3)];
    g.fillStyle = col; for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; g.beginPath(); g.arc(x + Math.cos(a) * 7, y + Math.sin(a) * 7, 5, 0, Math.PI * 2); g.fill(); }
  }
  return c;
}
// the night outside: deep blue, snowy firs on a slope, a few warm windows far off, snowflakes
function snowTex(rnd) {
  const [c, g] = canvas(768, 1024);
  const sky = g.createLinearGradient(0, 0, 0, 1024); sky.addColorStop(0, "#1a2a5c"); sky.addColorStop(0.6, "#3a5592"); sky.addColorStop(1, "#7f97c8");
  g.fillStyle = sky; g.fillRect(0, 0, 768, 1024);
  g.fillStyle = "#dfe8f6"; g.beginPath(); g.moveTo(0, 760); g.bezierCurveTo(260, 700, 520, 780, 768, 720); g.lineTo(768, 1024); g.lineTo(0, 1024); g.fill();
  const fir = (x, y, s, col) => {
    g.fillStyle = col; for (let k = 0; k < 4; k++) { const w = s * (0.9 - k * 0.18), yy = y - k * s * 0.42; g.beginPath(); g.moveTo(x - w, yy); g.lineTo(x, yy - s * 0.7); g.lineTo(x + w, yy); g.fill(); }
    g.fillStyle = "rgba(240,246,255,0.85)"; for (let k = 0; k < 4; k++) { const w = s * (0.9 - k * 0.18), yy = y - k * s * 0.42; g.beginPath(); g.moveTo(x - w * 0.7, yy - s * 0.12); g.lineTo(x, yy - s * 0.66); g.lineTo(x + w * 0.5, yy - s * 0.2); g.fill(); }
  };
  const firs = [[90, 760, 120], [210, 720, 70], [600, 740, 150], [700, 760, 90], [380, 700, 50], [470, 715, 60], [30, 700, 60]];
  for (const [x, y, s] of firs) fir(x, y, s, "#1d3442");
  g.fillStyle = "#ffcf7a"; for (const [x, y] of [[300, 690], [318, 690], [520, 700]]) g.fillRect(x, y, 10, 12);
  for (let i = 0; i < 420; i++) { const r = 1 + rnd() * 3.2; g.fillStyle = `rgba(255,255,255,${0.5 + rnd() * 0.5})`; g.beginPath(); g.arc(rnd() * 768, rnd() * 1024, r, 0, Math.PI * 2); g.fill(); }
  return c;
}
// book spines in a row: varied widths, heights and colours, a few leaning
function books(parent, rnd, x0, x1, y, z, d, maxH) {
  const cols = ["#7a2a24", "#2e4a6a", "#3e6a3a", "#c89a3a", "#5a3a6a", "#a8562e", "#2a2a3a", "#d8cfb0", "#8a3a4a"];
  let x = x0 + 0.01;
  while (x < x1 - 0.03) {
    const w = 0.025 + rnd() * 0.035, h = maxH * (0.62 + rnd() * 0.36);
    if (rnd() < 0.08) { x += 0.04 + rnd() * 0.05; continue; }   // a gap
    const b = box(parent, w, h, d * (0.75 + rnd() * 0.2), std(cols[Math.floor(rnd() * cols.length)], { roughness: 0.7 }), x + w / 2, y + h / 2, z);
    if (rnd() < 0.1 && x + w + 0.06 < x1) { b.rotation.z = -0.25; b.position.x += 0.02; x += 0.03; }
    x += w + 0.003;
  }
}
// a Christmas stocking: an L-shaped sock with a white cuff, hanging from a hook (origin: the top of the cuff)
function stocking(parent, col, stripe, x, y, z, flip = 1) {
  const s = new THREE.Shape();
  s.moveTo(-0.07, 0); s.lineTo(0.07, 0); s.lineTo(0.07, -0.22); s.quadraticCurveTo(0.07, -0.3, 0.15, -0.31); s.lineTo(0.17, -0.31);
  s.quadraticCurveTo(0.22, -0.31, 0.21, -0.36); s.quadraticCurveTo(0.2, -0.41, 0.12, -0.41); s.lineTo(-0.02, -0.41); s.quadraticCurveTo(-0.08, -0.4, -0.08, -0.33); s.lineTo(-0.07, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2 });
  const m = new THREE.Mesh(g, std(col, { roughness: 0.9 })); m.position.set(x, y, z); m.scale.x = flip; m.castShadow = true; parent.add(m);
  if (stripe) for (const yy of [-0.12, -0.22]) box(parent, 0.15, 0.03, 0.082, std(stripe, { roughness: 0.9 }), x, y + yy, z + 0.025);
  const cuff = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.12, 4, 10), std("#f4efe6", { roughness: 1 })); cuff.rotation.z = Math.PI / 2; cuff.position.set(x, y - 0.02, z + 0.03); parent.add(cuff);
  return m;
}
// a candle with a soft flame (the flame and its glow are unlit, they shine)
function candle(parent, x, y, z, h) {
  cyl(parent, 0.028, 0.03, h, std("#f1e6cc", { roughness: 0.6 }), x, y + h / 2, z, 14);
  const fl = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), basic({ color: "#ffd27a" })); fl.scale.set(1, 2.1, 1); fl.position.set(x, y + h + 0.03, z); parent.add(fl);
  glow(parent, "#ffb55a", 0.22, x, y + h + 0.035, z + 0.01, 0.55);
}
// a wrapped present with a ribbon both ways and a bow
function present(parent, w, h, d, col, rib, x, z, r = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = r; parent.add(g);
  box(g, w, h, d, std(col, { roughness: 0.6 }), 0, h / 2, 0, true);
  const rm = std(rib, { roughness: 0.4 });
  box(g, 0.03, h + 0.004, d + 0.004, rm, 0, h / 2, 0); box(g, w + 0.004, h + 0.004, 0.03, rm, 0, h / 2, 0);
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 6, 14), rm); l.position.set(s * 0.035, h + 0.025, 0); l.rotation.y = Math.PI / 2; l.scale.set(1, 0.8, 1); g.add(l); }
  return g;
}

export function buildXmasroom(scene, S = {}) {
  const P = XMASROOM, rnd = rng((S.seed || 7) * 613 + 11), set = new THREE.Group(); set.name = "set-xmasroom"; scene.add(set);
  scene.background = new THREE.Color("#2a1a12"); scene.fog = null;
  const hw = P.w / 2, H = P.h, BZ = P.back;
  // walls: wood boards above, a darker wainscot below a chair rail
  const wt = wallTex(rnd), wall = (w, h) => flat("#ffffff", { map: tex(wt, w / 2.2, h / 1.6), roughness: 0.75 });
  const dark = std("#5a3420", { roughness: 0.6 }), trim = std("#e9dcc4", { roughness: 0.5 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(P.w, H), wall(P.w, H)); back.position.set(0, H / 2, BZ); back.receiveShadow = true; set.add(back);
  for (const s of [-1, 1]) { const sw = new THREE.Mesh(new THREE.PlaneGeometry(6, H), wall(6, H)); sw.rotation.y = -s * Math.PI / 2; sw.position.set(s * hw, H / 2, BZ + 3); sw.receiveShadow = true; set.add(sw); }
  box(set, P.w, 0.14, 0.03, dark, 0, 0.07, BZ + 0.015); box(set, P.w, 0.05, 0.05, dark, 0, 0.82, BZ + 0.025);
  
  // no ceiling (the camera is high, above where it would be): the walls run up into the dark under the roof, a beam
  // along the back wall at the room's height
  box(set, P.w, 0.18, 0.2, std("#3e2416", { roughness: 0.7 }), 0, 2.85, BZ + 0.1);
  const dim = new THREE.Mesh(new THREE.PlaneGeometry(P.w + 6, H - 2.9), basic({ color: "#140a06", transparent: true, opacity: 0.55, depthWrite: false })); dim.position.set(0, 2.9 + (H - 2.9) / 2, BZ + 0.02); set.add(dim);
  // the floor and the rug
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(P.w, 9), flat("#ffffff", { map: tex(floorTex(rnd), P.w / 2.4, 9 / 2.4), roughness: 0.55 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, BZ + 4.5); floor.receiveShadow = true; floor.name = "set-floor"; set.add(floor);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 3.0), flat("#ffffff", { map: tex(rugTex(rnd)), roughness: 1 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(0.05, 0.004, 0.0); rug.receiveShadow = true; set.add(rug);
  // ---- the window, back left: snowy night outside, a cream frame with bars, a deep sill, red curtains
  { const W = P.win, wh = W.y1 - W.y0, cx = W.x, cy = (W.y0 + W.y1) / 2;
    const out = new THREE.Mesh(new THREE.PlaneGeometry(W.w * 1.9, wh * 1.9), basic({ map: tex(snowTex(rnd)) })); out.position.set(cx, cy, BZ - 0.9); set.add(out);
    // the wall round the opening: the back wall plane has no hole, so the window is a "cut" drawn by the outside plane
    // in front of a dark reveal: hide the wall behind it with the reveal box sides
    back.visible = false;
    const pieces = [[-hw, cx - W.w / 2, 0, H], [cx + W.w / 2, hw, 0, H], [cx - W.w / 2, cx + W.w / 2, 0, W.y0], [cx - W.w / 2, cx + W.w / 2, W.y1, H]];
    for (const [x0, x1, y0, y1] of pieces) { const pw = x1 - x0, ph = y1 - y0, m = flat("#ffffff", { map: tex(wt, pw / 2.2, ph / 1.6), roughness: 0.75 }); m.map.offset.set((x0 + hw) / 2.2, y0 / 1.6); const q = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), m); q.position.set((x0 + x1) / 2, (y0 + y1) / 2, BZ); q.receiveShadow = true; set.add(q); }
    for (const s of [-1, 1]) box(set, 0.06, wh, 0.22, trim, cx + s * (W.w / 2 + 0.0), cy, BZ - 0.08);
    box(set, W.w + 0.12, 0.06, 0.22, trim, cx, W.y1 + 0.03, BZ - 0.08);
    box(set, W.w + 0.26, 0.05, 0.3, trim, cx, W.y0 - 0.025, BZ + 0.02, true);   // the sill
    // the sashes: bars in a 2 x 3 grid, a little frost in the corners
    const bar = std("#f2ead8", { roughness: 0.5 });
    box(set, 0.04, wh, 0.04, bar, cx, cy, BZ - 0.1); for (const f of [1 / 3, 2 / 3]) box(set, W.w, 0.035, 0.04, bar, cx, W.y0 + wh * f, BZ - 0.1);
    const [fc, fg] = canvas(256, 256); const fr = fg.createRadialGradient(128, 128, 60, 128, 128, 180); fr.addColorStop(0, "rgba(255,255,255,0)"); fr.addColorStop(1, "rgba(235,242,255,0.55)"); fg.fillStyle = fr; fg.fillRect(0, 0, 256, 256);
    const frost = new THREE.Mesh(new THREE.PlaneGeometry(W.w, wh), basic({ map: tex(fc), transparent: true, depthWrite: false })); frost.position.set(cx, cy, BZ - 0.11); set.add(frost);
    // cool window light: a soft blue glow round the window and a pale patch on the floor below
    glow(set, "#7fa0ff", 2.2, cx, cy, BZ - 0.05, 0.22);
    const patch = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.9), basic({ color: "#6a86d0", transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending }));
    patch.rotation.x = -Math.PI / 2; patch.position.set(cx + 0.15, 0.007, BZ + 0.7); patch.renderOrder = 1; set.add(patch);
    // curtains: deep red, gathered, tied back, on a dark rod
    cyl(set, 0.018, 0.018, W.w + 0.8, std("#3a2416", { roughness: 0.4 }), cx, W.y1 + 0.16, BZ + 0.1).rotation.z = Math.PI / 2;
    const cm = std("#8e2420", { roughness: 0.9 });
    for (const s of [-1, 1]) {
      const pts = []; for (let i = 0; i <= 12; i++) { const v = i / 12; pts.push(new THREE.Vector2(0.12 + 0.06 * Math.sin(v * Math.PI) - (v > 0.55 && v < 0.75 ? 0.05 : 0), (1 - v) * (W.y1 + 0.16))); }
      const cu = new THREE.Mesh(new THREE.LatheGeometry(pts, 14), cm); cu.scale.set(1, 1, 0.45); cu.position.set(cx + s * (W.w / 2 + 0.18), 0, BZ + 0.14); cu.castShadow = true; set.add(cu);
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.018, 6, 18), std("#d9a441", { roughness: 0.4, metalness: 0.4 })); tie.rotation.x = Math.PI / 2; tie.scale.set(1, 0.5, 1); tie.position.set(cx + s * (W.w / 2 + 0.18), (W.y1 + 0.16) * 0.35, BZ + 0.14); set.add(tie);
    }
  }
  // ---- the fireplace, back right: stone surround, a fire, a hearth, the mantel with candles, a garland and stockings
  { const F = P.fire, fz = BZ + F.d / 2;
    const [sc, sg] = canvas(512, 512);
    sg.fillStyle = "#8f8478"; sg.fillRect(0, 0, 512, 512);
    for (let r = 0; r < 9; r++) { let x = -rnd() * 40; while (x < 512) { const w = 50 + rnd() * 50, v = 0.8 + rnd() * 0.35; sg.fillStyle = `rgb(${Math.round(150 * v)},${Math.round(138 * v)},${Math.round(124 * v)})`; sg.beginPath(); sg.roundRect(x + 3, r * 57 + 3, w - 6, 51, 10); sg.fill(); x += w; } }
    const stone = flat("#ffffff", { map: tex(sc), roughness: 0.95 });
    const sw = (F.w - 0.62) / 2;
    for (const s of [-1, 1]) box(set, sw, F.h, F.d, stone, F.x + s * (F.w / 2 - sw / 2), F.h / 2, fz, true);
    box(set, 0.62, F.h - 0.55, F.d, stone, F.x, 0.55 + (F.h - 0.55) / 2, fz, true);
    box(set, 0.62, 0.55, 0.05, flat("#1a0e08"), F.x, 0.275, BZ + 0.03);   // the dark back of the firebox
    for (const s of [-1, 1]) box(set, 0.02, 0.55, F.d, flat("#2a1a10"), F.x + s * 0.3, 0.275, fz);
    box(set, F.w + 0.4, 0.05, 0.6, std("#6e6258", { roughness: 0.9 }), F.x, 0.025, BZ + 0.3, true);   // hearth
    // the fire: logs, flame shapes that shine, an orange glow
    for (const [dx, r] of [[-0.08, 0.2], [0.09, -0.25]]) cyl(set, 0.045, 0.045, 0.42, std("#4a2a18"), F.x + dx, 0.09, fz, 10).rotation.set(Math.PI / 2, 0, r);
    const [fcv, fcg] = canvas(256, 256); const fgr = fcg.createLinearGradient(0, 256, 0, 0); fgr.addColorStop(0, "#fff2b0"); fgr.addColorStop(0.4, "#ffae3a"); fgr.addColorStop(1, "rgba(230,80,20,0)");
    fcg.fillStyle = fgr; for (const [x, w, h] of [[70, 50, 200], [120, 60, 240], [175, 46, 180], [100, 36, 150], [150, 40, 160]]) { fcg.beginPath(); fcg.moveTo(x - w, 256); fcg.quadraticCurveTo(x - w * 0.6, 256 - h * 0.5, x, 256 - h); fcg.quadraticCurveTo(x + w * 0.6, 256 - h * 0.5, x + w, 256); fcg.fill(); }
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.4), basic({ map: tex(fcv), transparent: true, depthWrite: false })); fl.position.set(F.x, 0.27, fz - 0.02); fl.renderOrder = 2; set.add(fl);
    glow(set, "#ff9a3a", 1.6, F.x, 0.35, fz + 0.2, 0.5);
    const warm = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), basic({ color: "#ff9a4a", transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending }));
    warm.rotation.x = -Math.PI / 2; warm.position.set(F.x, 0.008, BZ + 1.1); warm.renderOrder = 1; set.add(warm);
    // the mantel
    box(set, F.w + 0.3, 0.07, F.d + 0.12, std("#5a3420", { roughness: 0.5 }), F.x, F.h + 0.035, fz + 0.04, true);
    candle(set, F.x - 0.5, F.h + 0.07, fz, 0.2); candle(set, F.x - 0.42, F.h + 0.07, fz + 0.04, 0.13); candle(set, F.x + 0.47, F.h + 0.07, fz, 0.17);
    // a small clock and a frame on the mantel (no numbers, no faces)
    { const ck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 24), std("#c9a24a", { metalness: 0.5, roughness: 0.3 })); ck.rotation.x = Math.PI / 2; ck.position.set(F.x + 0.05, F.h + 0.17, fz - 0.05); set.add(ck);
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.07, 24), flat("#f4ead2")); face.position.set(F.x + 0.05, F.h + 0.17, fz - 0.02); set.add(face);
      box(set, 0.05, 0.1, 0.05, std("#3e2416"), F.x + 0.05, F.h + 0.12, fz - 0.05); }
    // the garland: a rope of dark green clumps along the mantel's front, sagging between three ties, red berries
    const gm = std("#2f5a32", { roughness: 0.9 }), gm2 = std("#3f6e3a", { roughness: 0.9 }), berry = std("#c2241e", { roughness: 0.4 });
    const gx0 = F.x - (F.w + 0.3) / 2, gx1 = F.x + (F.w + 0.3) / 2;
    for (let i = 0; i <= 44; i++) {
      const u = i / 44, x = gx0 + (gx1 - gx0) * u, sag = 0.07 * Math.abs(Math.sin(u * Math.PI * 2));
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.045 + rnd() * 0.02, 0), rnd() < 0.5 ? gm : gm2); b.position.set(x, F.h + 0.01 - sag, fz + F.d / 2 + 0.11); b.rotation.set(rnd() * 3, rnd() * 3, 0); set.add(b);
      if (rnd() < 0.3) { const be = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), berry); be.position.set(x + 0.02, F.h + 0.0 - sag, fz + F.d / 2 + 0.15); set.add(be); }
    }
    // three stockings hanging from the mantel front
    stocking(set, "#b8261e", null, F.x - 0.38, F.h - 0.03, fz + F.d / 2 + 0.08, 1);
    stocking(set, "#2f6a3a", "#f4efe6", F.x, F.h - 0.05, fz + F.d / 2 + 0.08, 1);
    stocking(set, "#c23a2a", "#f2c14e", F.x + 0.38, F.h - 0.03, fz + F.d / 2 + 0.08, -1);
    // a wall shelf of books above the mantel, and a little framed winter picture
    box(set, 0.9, 0.04, 0.22, std("#5a3420", { roughness: 0.5 }), F.x - 0.1, 1.72, BZ + 0.11, true);
    books(set, rnd, F.x - 0.55, F.x + 0.05, 1.74, BZ + 0.11, 0.18, 0.26);
    { const pf = box(set, 0.3, 0.24, 0.03, std("#c9a24a", { metalness: 0.4, roughness: 0.4 }), F.x + 0.22, 1.86, BZ + 0.05); pf.rotation.x = -0.1;
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.18), flat("#ffffff", { map: tex(snowTex(rng(5))) })); pic.position.set(F.x + 0.22, 1.86, BZ + 0.07); pic.rotation.x = -0.1; set.add(pic); }
  }
  // ---- the bookcase right of the fireplace: four shelves of books, a plant on top beside the cat's spot
  { const B = P.shelf, bz = BZ + B.d / 2, wood = std("#6a3e24", { roughness: 0.55 });
    box(set, B.w, B.h, 0.02, std("#3e2416"), B.x, B.h / 2, BZ + 0.01);
    for (const s of [-1, 1]) box(set, 0.04, B.h, B.d, wood, B.x + s * (B.w / 2 - 0.02), B.h / 2, bz, true);
    const shelves = [0.06, 0.45, 0.84, 1.22, B.h - 0.02];
    for (const y of shelves) box(set, B.w, 0.035, B.d, wood, B.x, y, bz, true);
    for (let i = 0; i < 4; i++) books(set, rnd, B.x - B.w / 2 + 0.04, B.x + B.w / 2 - 0.04, shelves[i] + 0.018, bz, B.d * 0.85, shelves[i + 1] - shelves[i] - 0.06);
  }
  // ---- the wall socket, low on the back wall left of the fireplace
  { const [x, y] = P.socket;
    box(set, 0.11, 0.11, 0.015, std("#f2ede2", { roughness: 0.4 }), x, y, BZ + 0.008);
    for (const dx of [-0.018, 0.018]) { const h = new THREE.Mesh(new THREE.CircleGeometry(0.007, 10), flat("#2a2420")); h.position.set(x + dx, y, BZ + 0.017); set.add(h); }
  }
  // ---- the cat's basket on the floor by the hearth: a woven round basket with a plaid cushion
  { const [x, z] = P.basket, g = new THREE.Group(); g.position.set(x, 0, z); set.add(g);
    const [bc, bg] = canvas(256, 64); bg.fillStyle = "#b5874a"; bg.fillRect(0, 0, 256, 64); for (let i = 0; i < 32; i++) { bg.fillStyle = i % 2 ? "#8a6234" : "#caa060"; for (let j = 0; j < 4; j++) bg.fillRect(i * 8, j * 16 + (i % 2) * 8, 8, 8); }
    const wm = std("#ffffff", { map: tex(bc, 4, 1), roughness: 0.9, side: THREE.DoubleSide });
    const wallB = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.14, 28, 1, true), wm); wallB.position.y = 0.07; wallB.castShadow = true; g.add(wallB);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.022, 8, 28), std("#a8783e", { roughness: 0.8 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.14; g.add(rim);
    const [pc, pg] = canvas(128, 128); pg.fillStyle = "#3a5a8a"; pg.fillRect(0, 0, 128, 128); pg.fillStyle = "rgba(200,60,50,0.6)"; for (let i = 0; i < 4; i++) { pg.fillRect(i * 32 + 10, 0, 8, 128); pg.fillRect(0, i * 32 + 10, 128, 8); }
    const cush = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 28), std("#ffffff", { map: tex(pc, 2, 2), roughness: 1 })); cush.position.y = 0.06; g.add(cush);
  }
  // ---- presents: a few under the tree (left and back of the stand), a stack in the front left corner
  { const [tx, tz] = P.tree;
    present(set, 0.3, 0.2, 0.26, "#c23a2a", "#f2c14e", tx - 0.62, tz + 0.1, 0.3);
    present(set, 0.22, 0.26, 0.22, "#2f6a8a", "#f4efe6", tx - 0.48, tz - 0.38, -0.2);
    present(set, 0.34, 0.16, 0.24, "#e8d6a8", "#c2241e", tx + 0.2, tz - 0.62, 0.15);
    present(set, 0.4, 0.26, 0.34, "#2f6a3a", "#c2241e", -1.45, 1.75, 0.2);
    present(set, 0.26, 0.2, 0.24, "#c23a2a", "#f4efe6", -1.42, 1.75, -0.1).position.y = 0.26;
    present(set, 0.24, 0.18, 0.2, "#8a5ab0", "#f2c14e", -1.05, 1.95, 0.5);
  }
  // a warm lamp glow at the far right (the second warm source the panels show) and a little ambient warmth up high
  glow(set, "#ffb86a", 3.0, 1.6, 1.9, BZ + 0.15, 0.12);
  return set;
}
