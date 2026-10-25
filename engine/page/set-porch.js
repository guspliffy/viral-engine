import * as THREE from "three";
import { rng } from "./util.js";

// "porch": a house's front porch on Halloween night, for the trick-or-treat clip. A dark blue clapboard front with a
// white-trimmed doorway (the door itself is a prop, so it can open: props3d.js "door"), a warm lit hallway behind it,
// a wall lamp, a house number, a "go away" doormat, jack-o'-lanterns and a string of orange lights along the eave.
// Right of the house the night garden opens up as painted cards in the anime-background way (set-painted.js): a big
// moon in a violet sky, clouds, a bare tree, a fence and the neighbours' lit windows.
// The stage is the porch floor (y 0) in front of the door; the lawn is a step lower (y -0.42).
// spec: { type: "porch", seed: 7 }. Layout constants are exported so storyboards and props can line up with them.
export const PORCH = { wallZ: -0.72, wallT: 0.14, doorX: -0.38, doorW: 1.15, doorH: 1.8, corner: 1.05, lawnY: -0.42, deckFront: 1.5, deckRight: 2.2 };

function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rx !== 1 || ry !== 1) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); }
  return t;
}
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });
const basic = (o) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; return m; };
function box(parent, w, h, d, m, x, y, z) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; parent.add(b); return b; }
// a flat painted card facing the camera (unlit: the painting already has its light)
function card(parent, c, w, h, x, y, z, order = -10) {
  const m = basic({ map: tex(c), transparent: true, depthWrite: false });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.renderOrder = order; parent.add(p);
  return p;
}
// a soft round glow (lamps, windows, the moon's halo), additive
function glow(parent, color, size, x, y, z, strength = 0.6) {
  const [c, g] = canvas(128, 128), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.45)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const m = basic({ map: tex(c), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: strength });
  const s = new THREE.Mesh(new THREE.PlaneGeometry(size, size), m); s.position.set(x, y, z); s.renderOrder = 2; parent.add(s);
  return s;
}

// clapboard siding: horizontal boards, each with a lit top edge and a shadow line under its lap
function sidingTex(rnd) {
  const [c, g] = canvas(256, 256), n = 8, h = 256 / n;
  for (let i = 0; i < n; i++) {
    const v = 0.94 + rnd() * 0.1, y = i * h;
    const gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, `rgb(${Math.round(70 * v)},${Math.round(86 * v)},${Math.round(128 * v)})`); gr.addColorStop(1, `rgb(${Math.round(52 * v)},${Math.round(64 * v)},${Math.round(100 * v)})`);
    g.fillStyle = gr; g.fillRect(0, y, 256, h);
    g.fillStyle = "rgba(20,24,44,0.55)"; g.fillRect(0, y + h - 3, 256, 3);
    g.fillStyle = "rgba(150,170,220,0.18)"; g.fillRect(0, y, 256, 2);
    // a few faint grain strokes
    for (let k = 0; k < 6; k++) { g.strokeStyle = "rgba(30,36,70,0.12)"; g.lineWidth = 1; g.beginPath(); const yy = y + 4 + rnd() * (h - 8); g.moveTo(rnd() * 256, yy); g.lineTo(rnd() * 256, yy + (rnd() - 0.5) * 2); g.stroke(); }
  }
  return c;
}
// porch planks running toward the camera, warm grey-brown
function plankTex(rnd) {
  const [c, g] = canvas(512, 512), n = 8, w = 512 / n;
  for (let i = 0; i < n; i++) {
    const v = 0.9 + rnd() * 0.16;
    g.fillStyle = `rgb(${Math.round(122 * v)},${Math.round(98 * v)},${Math.round(84 * v)})`; g.fillRect(i * w, 0, w, 512);
    g.fillStyle = "rgba(30,20,20,0.6)"; g.fillRect(i * w, 0, 3, 512);
    const cut = rnd() * 512; g.fillRect(i * w, cut, w, 3);
    for (let k = 0; k < 8; k++) { g.strokeStyle = `rgba(60,40,30,${0.12 + rnd() * 0.1})`; g.lineWidth = 1 + rnd(); g.beginPath(); const x = i * w + 6 + rnd() * (w - 12); g.moveTo(x, 0); g.bezierCurveTo(x + 3, 170, x - 3, 340, x + 1, 512); g.stroke(); }
  }
  return c;
}
// the hallway seen through the door: warm striped wallpaper, a wainscot, a framed picture and a hall lamp glow
function hallBackTex() {
  const [c, g] = canvas(512, 640), W = 512, H = 640;
  g.fillStyle = "#e8a65c"; g.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 40) { g.fillStyle = "rgba(190,110,50,0.35)"; g.fillRect(x, 0, 14, H); }
  g.fillStyle = "#8a4f2c"; g.fillRect(0, H * 0.62, W, H * 0.38); g.fillStyle = "#6e3c22"; g.fillRect(0, H * 0.62, W, 10);
  for (let x = 20; x < W; x += 90) { g.strokeStyle = "rgba(60,30,15,0.5)"; g.lineWidth = 4; g.strokeRect(x, H * 0.67, 70, H * 0.26); }
  // a picture frame: a little potato portrait
  g.fillStyle = "#3a2416"; g.fillRect(W * 0.36, H * 0.18, W * 0.28, H * 0.26); g.fillStyle = "#f3d9a8"; g.fillRect(W * 0.38, H * 0.2, W * 0.24, H * 0.22);
  g.fillStyle = "#d9a35c"; g.beginPath(); g.ellipse(W * 0.5, H * 0.33, W * 0.07, H * 0.075, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#2a1a12"; g.beginPath(); g.arc(W * 0.48, H * 0.31, 4, 0, 7); g.arc(W * 0.52, H * 0.31, 4, 0, 7); g.fill();
  // light falling from a lamp above: brighter in the middle and top, darker in the corners
  const gr = g.createRadialGradient(W * 0.5, H * 0.1, 20, W * 0.5, H * 0.3, W * 0.9);
  gr.addColorStop(0, "rgba(255,240,200,0.55)"); gr.addColorStop(0.5, "rgba(255,200,140,0.1)"); gr.addColorStop(1, "rgba(60,20,10,0.55)");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  return c;
}
function hallSideTex(dark) {
  const [c, g] = canvas(512, 320);
  const gr = g.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, dark ? "#a8642f" : "#c47d3e"); gr.addColorStop(1, dark ? "#d68f4b" : "#e9a75e");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 320);
  g.fillStyle = "rgba(90,45,20,0.6)"; g.fillRect(0, 200, 512, 120);
  return c;
}

// the night garden behind the house, painted: sky, moon, clouds, a far ridge of rooftops and trees
function paintNight(rnd) {
  const W = 2048, H = 1152, [c, g] = canvas(W, H);
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, "#141a3e"); gr.addColorStop(0.45, "#2c2a63"); gr.addColorStop(0.75, "#5a3f7d"); gr.addColorStop(1, "#8a5a7e");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 160; i++) { const y = rnd() * H * 0.6; g.fillStyle = `rgba(255,255,240,${0.25 + rnd() * 0.6})`; const s = rnd() < 0.1 ? 3 : 1.6; g.fillRect(rnd() * W, y, s, s); }
  // the moon: big, warm white, with soft craters and a halo
  const mx = W * 0.62, my = H * 0.3, mr = 120;
  const halo = g.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 3.2); halo.addColorStop(0, "rgba(255,240,210,0.5)"); halo.addColorStop(1, "rgba(255,240,210,0)");
  g.fillStyle = halo; g.fillRect(0, 0, W, H);
  const mg = g.createRadialGradient(mx - 30, my - 30, 10, mx, my, mr); mg.addColorStop(0, "#fffbea"); mg.addColorStop(1, "#f3dfae");
  g.fillStyle = mg; g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.fill();
  for (const [dx, dy, r] of [[-30, 20, 22], [35, -25, 14], [20, 45, 18], [-50, -40, 10], [55, 20, 9]]) { g.fillStyle = "rgba(210,180,130,0.35)"; g.beginPath(); g.arc(mx + dx, my + dy, r, 0, Math.PI * 2); g.fill(); }
  // long thin clouds crossing the moon, lit underneath by it
  for (let i = 0; i < 7; i++) {
    const y = H * (0.18 + rnd() * 0.3), x = rnd() * W, w = 300 + rnd() * 500, h = 14 + rnd() * 18;
    g.fillStyle = "rgba(60,50,110,0.75)"; g.beginPath(); g.ellipse(x, y, w / 2, h, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(230,200,220,0.35)"; g.beginPath(); g.ellipse(x - w * 0.05, y + h * 0.4, w * 0.42, h * 0.35, 0, 0, Math.PI * 2); g.fill();
  }
  // far ridge: rooftops and round trees as one dark violet silhouette
  g.fillStyle = "#2a2148"; g.beginPath(); g.moveTo(0, H);
  let x = 0;
  while (x < W) {
    const kind = rnd(), y0 = H * 0.78;
    if (kind < 0.4) { const w = 90 + rnd() * 120, h = 60 + rnd() * 70; g.lineTo(x, y0); g.lineTo(x, y0 - h); g.lineTo(x + w / 2, y0 - h - 50 - rnd() * 30); g.lineTo(x + w, y0 - h); g.lineTo(x + w, y0); x += w; }
    else { const r = 40 + rnd() * 70; g.lineTo(x, y0); g.arc(x + r, y0 - r * 0.4, r, Math.PI, 0); x += 2 * r; }
  }
  g.lineTo(W, H); g.closePath(); g.fill();
  // a few warm windows in the far houses
  for (let i = 0; i < 14; i++) { g.fillStyle = rnd() < 0.5 ? "#ffcf7a" : "#ffb35a"; g.fillRect(rnd() * W, H * (0.72 + rnd() * 0.05), 10, 14); }
  return c;
}
// the near garden: a picket fence, a bare twisting tree and bushes, dark against the sky, lit at the edges by the moon
function paintGarden(rnd) {
  const W = 2048, H = 1024, [c, g] = canvas(W, H);
  // bushes along the bottom
  for (let i = 0; i < 26; i++) { const x = rnd() * W, r = 50 + rnd() * 80; g.fillStyle = "#1c2238"; g.beginPath(); g.arc(x, H - 60 + rnd() * 30, r, 0, Math.PI * 2); g.fill(); g.fillStyle = "rgba(160,150,220,0.18)"; g.beginPath(); g.arc(x - r * 0.25, H - 70 - r * 0.5, r * 0.4, 0, Math.PI * 2); g.fill(); }
  // picket fence
  for (let xx = 0; xx < W; xx += 46) { g.fillStyle = "#3a3658"; g.beginPath(); g.moveTo(xx, H - 40); g.lineTo(xx, H - 230); g.lineTo(xx + 15, H - 255); g.lineTo(xx + 30, H - 230); g.lineTo(xx + 30, H - 40); g.fill(); g.fillStyle = "rgba(200,190,255,0.22)"; g.fillRect(xx + 2, H - 230, 5, 190); }
  g.fillStyle = "#3a3658"; g.fillRect(0, H - 200, W, 18); g.fillRect(0, H - 110, W, 18);
  // the bare tree: a trunk and recursive branches
  const branch = (x, y, a, len, w, d) => {
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    g.strokeStyle = "#151628"; g.lineWidth = w; g.lineCap = "round"; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo((x + x2) / 2 + (rnd() - 0.5) * len * 0.3, (y + y2) / 2, x2, y2); g.stroke();
    if (d > 0) for (let k = 0; k < 2 + (rnd() < 0.4 ? 1 : 0); k++) branch(x2, y2, a + (rnd() - 0.5) * 1.3, len * (0.62 + rnd() * 0.15), w * 0.62, d - 1);
  };
  branch(W * 0.74, H, -Math.PI / 2 - 0.08, 330, 46, 6);
  // a jack-o'-lantern on the neighbour's fence post
  g.fillStyle = "#f28a1c"; g.beginPath(); g.ellipse(W * 0.3, H - 270, 40, 32, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#ffe08a"; g.beginPath(); g.moveTo(W * 0.3 - 22, H - 278); g.lineTo(W * 0.3 - 10, H - 290); g.lineTo(W * 0.3 - 4, H - 274); g.fill(); g.beginPath(); g.moveTo(W * 0.3 + 22, H - 278); g.lineTo(W * 0.3 + 10, H - 290); g.lineTo(W * 0.3 + 4, H - 274); g.fill();
  g.fillRect(W * 0.3 - 18, H - 262, 36, 8);
  return c;
}
// the lawn: dark blue-green with painted grass strokes and a few fallen leaves
function paintLawn(rnd) {
  const [c, g] = canvas(512, 512);
  g.fillStyle = "#26363c"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 700; i++) { const x = rnd() * 512, y = rnd() * 512, l = 5 + rnd() * 9; g.strokeStyle = rnd() < 0.5 ? "rgba(90,120,120,0.35)" : "rgba(15,25,30,0.4)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 4, y - l); g.stroke(); }
  for (let i = 0; i < 26; i++) { g.fillStyle = ["#b8572a", "#d98a2b", "#8c3a24"][i % 3]; g.beginPath(); g.ellipse(rnd() * 512, rnd() * 512, 7, 4, rnd() * 3, 0, Math.PI * 2); g.fill(); }
  return c;
}
// a carved jack-o'-lantern face: triangle eyes, a nose and a jagged grin, glowing
function lanternFaceTex() {
  const [c, g] = canvas(256, 256);
  g.fillStyle = "#ffd36a";
  const tri = (pts) => { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); g.fill(); };
  tri([[60, 110], [100, 60], [112, 115]]); tri([[196, 110], [156, 60], [144, 115]]); tri([[128, 120], [116, 145], [140, 145]]);
  g.beginPath(); g.moveTo(50, 160); for (let i = 0; i <= 8; i++) g.lineTo(50 + i * 19.5, i % 2 ? 175 : 160); g.lineTo(206, 160); g.quadraticCurveTo(128, 240, 50, 160); g.fill();
  return c;
}
function jackOLantern(parent, x, z, r, rot, y = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot; parent.add(g);
  const geo = new THREE.SphereGeometry(r, 48, 24), p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const a = Math.atan2(v.z, v.x), k = 1 - 0.07 * Math.abs(Math.sin(a * 4)); p.setXYZ(i, v.x * k, v.y * 0.78, v.z * k); }
  geo.computeVertexNormals();
  const body = new THREE.Mesh(geo, std("#e8761c", { roughness: 0.55 })); body.position.y = r * 0.78; body.castShadow = body.receiveShadow = true; g.add(body);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.09, r * 0.13, r * 0.35, 8), std("#5a6b2a")); stem.position.y = r * 1.62; stem.rotation.z = 0.25; g.add(stem);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(r * 1.3, r * 1.3), basic({ map: tex(lanternFaceTex()), transparent: true, color: new THREE.Color(1.6, 1.25, 0.7) }));
  face.position.set(0, r * 0.8, r * 0.9); g.add(face);
  glow(g, "#ff9a3a", r * 3.2, 0, r * 0.8, r * 0.95, 0.35);
  return g;
}

export function buildPorch(scene, S = {}) {
  const P = PORCH, rnd = rng((S.seed || 7) * 613 + 5), set = new THREE.Group(); set.name = "set-porch"; scene.add(set);
  scene.background = new THREE.Color("#141a3e"); scene.fog = null;
  const z0 = P.wallZ, zb = P.wallZ - P.wallT, dl = P.doorX - P.doorW / 2, dr = P.doorX + P.doorW / 2, top = 2.9, left = -3.4;

  // the night garden behind and right of the house
  card(set, paintNight(rnd), 48, 27, 6, 6.5, -24, -30);
  card(set, paintGarden(rnd), 22, 11, 7.2, P.lawnY + 2.6, -8, -20);
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), std("#ffffff", { map: tex(paintLawn(rnd), 16, 16), roughness: 0.9 }));
  lawn.rotation.x = -Math.PI / 2; lawn.position.set(4, P.lawnY, -8); lawn.receiveShadow = true; lawn.material.userData.noOutline = true; set.add(lawn);

  // the house front: siding round the doorway, cut into pieces so the doorway stays open
  const sid = sidingTex(rnd), wallM = (w, h) => std("#ffffff", { map: tex(sid, w / 1.2, h / 1.2), roughness: 0.8 });
  const piece = (x0, x1, y0, y1) => { const w = x1 - x0, h = y1 - y0; const b = box(set, w, h, P.wallT, wallM(w, h), (x0 + x1) / 2, (y0 + y1) / 2, z0 - P.wallT / 2); b.material.userData.noOutline = true; return b; };
  piece(left, dl, 0, top); piece(dr, P.corner, 0, top); piece(dl, dr, P.doorH, top);
  // the corner board and a band under the eave
  const trim = std("#eae4d8", { roughness: 0.6 });
  box(set, 0.12, top, 0.18, trim, P.corner - 0.04, top / 2, z0 - 0.05);
  box(set, P.corner - left + 0.1, 0.16, 0.2, trim, (P.corner + left) / 2, top - 0.08, z0 - 0.04);
  // the door casing: two jambs and a head with a small crown, the threshold, and the jamb depth inside the opening
  box(set, 0.11, P.doorH + 0.06, 0.05, trim, dl - 0.055, (P.doorH + 0.06) / 2, z0 + 0.02);
  box(set, 0.11, P.doorH + 0.06, 0.05, trim, dr + 0.055, (P.doorH + 0.06) / 2, z0 + 0.02);
  box(set, P.doorW + 0.34, 0.14, 0.06, trim, P.doorX, P.doorH + 0.1, z0 + 0.025);
  box(set, P.doorW + 0.42, 0.04, 0.09, trim, P.doorX, P.doorH + 0.19, z0 + 0.04);
  box(set, P.doorW, 0.025, P.wallT + 0.04, std("#6b5a4a"), P.doorX, 0.0125, z0 - P.wallT / 2);
  for (const x of [dl + 0.012, dr - 0.012]) box(set, 0.024, P.doorH, P.wallT, trim, x, P.doorH / 2, z0 - P.wallT / 2);
  box(set, P.doorW, 0.024, P.wallT, trim, P.doorX, P.doorH - 0.012, z0 - P.wallT / 2);

  // the hallway behind the door: painted, unlit and warm, so whoever stands in the doorway is seen against the light
  const hallD = 2.6, hallW = 1.9, hallH = 2.3, hz = zb - hallD / 2;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(hallW, hallH), basic({ map: tex(hallBackTex()) })); back.position.set(P.doorX, hallH / 2, zb - hallD); set.add(back);
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(hallD, hallH), basic({ map: tex(hallSideTex(s < 0)), side: THREE.DoubleSide }));
    w.rotation.y = s * Math.PI / 2 * -1; w.position.set(P.doorX + s * hallW / 2, hallH / 2, hz); set.add(w);
  }
  const hfloor = new THREE.Mesh(new THREE.PlaneGeometry(hallW, hallD), std("#9a5a34", { roughness: 0.5 })); hfloor.rotation.x = -Math.PI / 2; hfloor.position.set(P.doorX, 0.001, hz); hfloor.receiveShadow = true; hfloor.material.userData.noOutline = true; set.add(hfloor);
  const runner = new THREE.Mesh(new THREE.PlaneGeometry(0.7, hallD), std("#7a2430", { roughness: 0.9 })); runner.rotation.x = -Math.PI / 2; runner.position.set(P.doorX, 0.004, hz); runner.receiveShadow = true; runner.material.userData.noOutline = true; set.add(runner);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(hallW, hallD), basic({ color: "#c8834a", side: THREE.DoubleSide })); ceil.rotation.x = Math.PI / 2; ceil.position.set(P.doorX, hallH, hz); set.add(ceil);
  glow(set, "#ffd9a0", 1.8, P.doorX, 1.45, zb - 0.4, 0.28);

  // the porch deck, its front edge and steps down to the lawn on the right
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(P.deckRight - left, P.deckFront - z0), std("#ffffff", { map: tex(plankTex(rnd), (P.deckRight - left) / 1.1, (P.deckFront - z0) / 1.1), roughness: 0.7 }));
  deck.rotation.x = -Math.PI / 2; deck.position.set((P.deckRight + left) / 2, 0, (P.deckFront + z0) / 2); deck.receiveShadow = true; deck.material.userData.noOutline = true; deck.name = "set-floor"; set.add(deck);
  // the skirt under the deck: dark lattice over the crawl space; the steps get plank treads
  const [lc, lg] = canvas(256, 128); lg.fillStyle = "#1c1a24"; lg.fillRect(0, 0, 256, 128); lg.fillStyle = "#6a5648"; lg.fillRect(0, 0, 256, 14);
  lg.strokeStyle = "#7a6556"; lg.lineWidth = 9; for (let x = -128; x < 384; x += 32) { lg.beginPath(); lg.moveTo(x, 14); lg.lineTo(x + 114, 128); lg.stroke(); lg.beginPath(); lg.moveTo(x + 114, 14); lg.lineTo(x, 128); lg.stroke(); }
  const fascia = std("#ffffff", { map: tex(lc, (P.deckRight - left) / 0.8, 1), roughness: 0.85 }); fascia.userData.noOutline = true;
  box(set, P.deckRight - left, -P.lawnY, 0.06, fascia, (P.deckRight + left) / 2, P.lawnY / 2, P.deckFront);
  box(set, 0.06, -P.lawnY, P.deckFront - z0, fascia, P.deckRight, P.lawnY / 2, (P.deckFront + z0) / 2);
  box(set, P.deckRight - P.corner, -P.lawnY, 0.06, fascia, (P.deckRight + P.corner) / 2, P.lawnY / 2, z0);
  const stepM = std("#ffffff", { map: tex(plankTex(rnd), 1.2, 0.35), roughness: 0.7 }); stepM.userData.noOutline = true;
  box(set, 1.2, 0.21, 0.32, stepM, 0.9, -0.105, P.deckFront + 0.16); box(set, 1.2, 0.21, 0.32, stepM, 0.9, -0.315, P.deckFront + 0.48);

  // the eave: a beam along the porch front on two posts, with a string of orange and violet lights
  const postM = std("#eae4d8", { roughness: 0.6 });
  box(set, 0.14, top, 0.14, postM, -1.75, top / 2, P.deckFront - 0.1);
  box(set, 0.14, top, 0.14, postM, P.corner + 0.6, top / 2, P.deckFront - 0.1);
  box(set, P.corner + 0.7 - left, 0.2, 0.16, postM, (P.corner + 0.7 + left) / 2, top - 0.1, P.deckFront - 0.1);
  const soffit = new THREE.Mesh(new THREE.PlaneGeometry(P.corner + 0.7 - left, P.deckFront - z0), std("#3c3d5a", { side: THREE.DoubleSide })); soffit.rotation.x = Math.PI / 2; soffit.position.set((P.corner + 0.7 + left) / 2, top, (P.deckFront + z0) / 2); soffit.material.userData.noOutline = true; set.add(soffit);
  const bulbG = new THREE.SphereGeometry(0.028, 12, 8), cols = [new THREE.Color(2.2, 1.0, 0.25), new THREE.Color(1.3, 0.55, 2.0)];
  const wire = []; const x0 = -1.7, x1 = P.corner + 0.55;
  for (let i = 0; i <= 64; i++) { const k = i / 64, x = x0 + (x1 - x0) * k, sag = 0.16 * Math.sin(Math.PI * ((k * 3) % 1)); wire.push(new THREE.Vector3(x, top - 0.22 - sag, P.deckFront - 0.06)); }
  const wm = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wire), 128, 0.004, 4), std("#1a1a22")); set.add(wm);
  for (let i = 0; i < 22; i++) { const p = wire[Math.round((i + 0.5) / 22 * 64)]; const b = new THREE.Mesh(bulbG, basic({ color: cols[i % 2] })); b.position.copy(p).add(new THREE.Vector3(0, -0.03, 0)); set.add(b); glow(set, i % 2 ? "#b46cff" : "#ff9a3a", 0.22, b.position.x, b.position.y, b.position.z + 0.01, 0.4); }

  // the wall lamp right of the door (its light is painted: a warm glow on the wall), the house number below it
  const lampX = dr + 0.38, lampY = 1.62;
  box(set, 0.1, 0.18, 0.04, std("#1d1b22", { metalness: 0.5, roughness: 0.4 }), lampX, lampY - 0.04, z0 + 0.02);
  const lampGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.18, 12), basic({ color: new THREE.Color(1.9, 1.5, 0.9) })); lampGlass.position.set(lampX, lampY, z0 + 0.1); set.add(lampGlass);
  box(set, 0.16, 0.03, 0.16, std("#1d1b22", { metalness: 0.5, roughness: 0.4 }), lampX, lampY + 0.105, z0 + 0.1);
  glow(set, "#ffc98a", 1.4, lampX, lampY, z0 + 0.03, 0.55);
  const [nc, ng] = canvas(128, 96); ng.fillStyle = "#1d1b22"; ng.fillRect(0, 0, 128, 96); ng.fillStyle = "#e9c46a"; ng.font = "bold 70px Georgia, serif"; ng.textAlign = "center"; ng.textBaseline = "middle"; ng.fillText("13", 64, 52);
  const num = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.15), std("#ffffff", { map: tex(nc), roughness: 0.5 })); num.position.set(lampX, lampY - 0.32, z0 + 0.006); num.material.userData.noOutline = true; set.add(num);

  // the doormat
  const [mc, mg] = canvas(256, 128); mg.fillStyle = "#3b2f2a"; mg.fillRect(0, 0, 256, 128); mg.strokeStyle = "#7a5a3a"; mg.lineWidth = 6; mg.strokeRect(8, 8, 240, 112);
  mg.fillStyle = "#c9a26a"; mg.font = "bold 46px sans-serif"; mg.textAlign = "center"; mg.textBaseline = "middle"; mg.fillText("GO AWAY", 128, 66);
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), std("#ffffff", { map: tex(mc), roughness: 0.95 })); mat.rotation.x = -Math.PI / 2; mat.position.set(P.doorX, 0.006, z0 + 0.32); mat.receiveShadow = true; mat.material.userData.noOutline = true; set.add(mat);

  // jack-o'-lanterns: a pair at the left of the door and one by the steps; a big one on the lawn
  jackOLantern(set, -1.95, z0 + 0.3, 0.17, 0.25); jackOLantern(set, -1.55, z0 + 0.17, 0.11, 0.1);   // clear of the open door, even flung wide
  jackOLantern(set, 1.65, P.deckFront - 0.25, 0.15, -0.4);
  // a window left of the door, warm behind curtains
  const winX = -2.25;
  const [wc, wg] = canvas(128, 160); const wgr = wg.createLinearGradient(0, 0, 0, 160); wgr.addColorStop(0, "#ffd99a"); wgr.addColorStop(1, "#f0a050"); wg.fillStyle = wgr; wg.fillRect(0, 0, 128, 160);
  wg.fillStyle = "#9c2f3a"; wg.fillRect(0, 0, 30, 160); wg.fillRect(98, 0, 30, 160);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.0), basic({ map: tex(wc) })); win.position.set(winX, 1.45, z0 + 0.004); set.add(win);
  box(set, 0.92, 0.08, 0.08, trim, winX, 1.98, z0 + 0.03); box(set, 0.96, 0.06, 0.12, trim, winX, 0.92, z0 + 0.05);
  for (const s of [-1, 1]) box(set, 0.06, 1.06, 0.06, trim, winX + s * 0.43, 1.45, z0 + 0.03);
  box(set, 0.04, 1.0, 0.04, trim, winX, 1.45, z0 + 0.03); box(set, 0.8, 0.04, 0.04, trim, winX, 1.45, z0 + 0.03);
  return set;
}
