import * as THREE from "three";
import { rng } from "./util.js";
import { roadDistance, dividerZ } from "./vehicle.js";

// "road": a sunny empty coastal road for the car clips (Still Scrolling — Car Crash). The road runs along z and is a
// treadmill: the car (a rig, vehicle.js) stays near the origin facing +z while the road, its lines, the walls and the
// trees scroll toward -z by the distance the set's speed has covered. Everything that scrolls repeats every PERIOD
// metres, so a clip whose total distance is a whole number of periods loops seamlessly (set.speed is chosen for that).
// The driver's side (+x) has a tall cream retaining wall with greenery on top; the passenger side (-x) a low stone
// parapet, and beyond it a far-off hill town, cypresses and hills under a blue sky with soft clouds.
//   spec: { type: "road", speed: m/s or [[t, v], ...], divider: { x, width, height, length, bevel, hit: [t, z] },
//           dust: [{ at, x, z, y?, n?, size?, dur?, color? }] (puffs left on the road that scroll away with it) }
export const PERIOD = 24;
export const ROAD = { right: -2.9, left: 4.4, wallX: 4.7, parapetX: -3.4, centre: 1.25 };

function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8;
  return t;
}
const lam = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });
function put(g, geo, m, x, y, z, shadow = true) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; g.add(o); return o; }
const flat = (o) => { o.material.userData.noOutline = true; o.receiveShadow = true; o.castShadow = false; return o; };

function sky(scene) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color("#3f8fe0") }, hor: { value: new THREE.Color("#cfe9f7") }, bot: { value: new THREE.Color("#d9ecf3") } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "uniform vec3 top; uniform vec3 hor; uniform vec3 bot; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(hor, top, pow(clamp(h*1.9,0.0,1.0), 0.65)) : bot; gl_FragColor = vec4(c,1.0);\n#include <colorspace_fragment>\n}",
  });
  m.userData.outlineParameters = { visible: false };
  const s = new THREE.Mesh(new THREE.SphereGeometry(95, 32, 24), m); s.name = "set-sky"; scene.add(s);
}

// a soft painted cloud: overlapping white blobs, lit from above (emissive so they stay bright), no lines
function cloud(rnd, m) {
  const g = new THREE.Group();
  const n = 5 + Math.floor(rnd() * 4);
  for (let k = 0; k < n; k++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), m);
    const u = k / (n - 1) - 0.5; b.scale.set(1.1 + rnd() * 0.9, 0.75 + rnd() * 0.6, 0.8);
    b.position.set(u * 4.2 + rnd() * 0.5, (0.5 - Math.abs(u)) * 1.4 + rnd() * 0.3, rnd() * 0.4); g.add(b);
  }
  return g;
}

// a cypress (a tall dark flame) and a round umbrella pine / bush
function cypress(g, m, trunk, x, y, z, h) {
  const c = put(g, new THREE.SphereGeometry(1, 14, 12), m, x, y + h * 0.55, z); c.scale.set(h * 0.13, h * 0.55, h * 0.13);
  put(g, new THREE.CylinderGeometry(0.06, 0.08, h * 0.25, 6), trunk, x, y + h * 0.1, z);
  return c;
}
function bushTree(g, m, m2, trunk, x, y, z, r, rnd) {
  put(g, new THREE.CylinderGeometry(r * 0.08, r * 0.12, r * 1.4, 7), trunk, x, y + r * 0.6, z);
  for (let k = 0; k < 5; k++) {
    const b = put(g, new THREE.SphereGeometry(1, 14, 10), k % 2 ? m2 : m, x + (rnd() - 0.5) * r * 1.1, y + r * 1.4 + (rnd() - 0.3) * r * 0.5, z + (rnd() - 0.5) * r * 0.7);
    b.scale.set(r * (0.55 + rnd() * 0.3), r * (0.45 + rnd() * 0.2), r * (0.5 + rnd() * 0.25));
  }
}

// a far-off hill town: cream and peach houses with terracotta roofs stacked on a green hill
function town(g, rnd, x0, z0, hill) {
  const walls = ["#f3e6cf", "#f6dcc0", "#efe1c8", "#f8eadb", "#ead2b0"].map((c) => lam(c)), roof = lam("#d1714a"), roof2 = lam("#bf6040");
  const hm = put(g, new THREE.SphereGeometry(1, 30, 16), lam("#7fa858"), x0, -hill * 0.15, z0, false); hm.scale.set(hill * 2.4, hill, hill * 1.4);
  for (let i = 0; i < 46; i++) {
    const a = (rnd() - 0.5) * 2.1, r = 0.15 + rnd() * 0.78;
    const x = x0 + Math.sin(a) * hill * 2.0 * r, z = z0 + Math.cos(a) * hill * 1.0 * r * 0.6 + hill * 0.3;
    const top = hill * Math.sqrt(Math.max(0, 1 - ((x - x0) / (hill * 2.4)) ** 2 - ((z - z0) / (hill * 1.4)) ** 2)) - hill * 0.15;
    const w = 1.6 + rnd() * 1.8, h = 1.4 + rnd() * 1.6, d = 1.6 + rnd() * 1.4;
    const b = put(g, new THREE.BoxGeometry(w, h, d), walls[i % walls.length], x, top + h / 2 - 0.4, z, false);
    b.rotation.y = (rnd() - 0.5) * 0.4;
    const r2 = put(g, new THREE.ConeGeometry(Math.max(w, d) * 0.74, 0.9, 4), i % 3 ? roof : roof2, x, top + h - 0.4 + 0.44, z, false);
    r2.rotation.y = Math.PI / 4 + b.rotation.y; r2.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
  }
  // a bell tower at the top
  put(g, new THREE.BoxGeometry(1.6, 6, 1.6), walls[0], x0 + 2, hill * 0.83 + 2.2, z0, false);
  put(g, new THREE.ConeGeometry(1.3, 1.6, 4), roof, x0 + 2, hill * 0.83 + 6, z0, false).rotation.y = Math.PI / 4;
}

// the raised lane divider: a low concrete island, bevelled down to the road at both ends, with yellow and black
// chevrons painted on the bevels so its end reads as the thing the tyre hits
function divider(spec) {
  const d = spec.divider, w = d.width ?? 0.5, h = d.height ?? 0.18, b = d.bevel ?? 0.5, L = d.length ?? 4;
  const g = new THREE.Group(); g.name = "set-divider";
  // side profile in (z, y), extruded across x
  const sh = new THREE.Shape([[0, 0], [b, h], [L - b, h], [L, 0]].map(([z, y]) => new THREE.Vector2(z, y)));
  const geo = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
  geo.rotateY(-Math.PI / 2); geo.translate(w / 2, 0, 0);   // shape x -> world z, extruded along -x... centred on x
  const conc = lam("#d9d6cc"); put(g, geo, conc, 0, 0, 0);
  const chev = canvasTex(256, 128, (c, W, H) => {
    c.fillStyle = "#ffd23a"; c.fillRect(0, 0, W, H); c.fillStyle = "#1d1d22";
    for (let i = -4; i < 8; i++) { c.beginPath(); c.moveTo(i * 48, H); c.lineTo(i * 48 + 24, H); c.lineTo(i * 48 + 24 + 64, 0); c.lineTo(i * 48 + 64, 0); c.closePath(); c.fill(); }
  });
  const len = Math.hypot(b, h), ang = Math.atan2(h, b);
  for (const end of [0, 1]) {
    const p = flat(new THREE.Mesh(new THREE.PlaneGeometry(w * 0.98, len * 0.96), lam("#ffffff", { map: chev })));
    p.rotation.order = "YXZ"; p.rotation.x = end ? -(Math.PI / 2 - ang) : -(Math.PI / 2 + ang) + Math.PI;
    if (end) p.rotation.y = Math.PI;
    p.position.set(0, h / 2 + 0.006, end ? L - b / 2 + 0.004 : b / 2 - 0.004); g.add(p);
  }
  return g;
}

export function buildRoad(scene, S = {}) {
  const rnd = rng((S.seed || 5) * 131);
  scene.background = new THREE.Color("#cfe9f7");
  scene.fog = new THREE.Fog("#d4eaf4", 34, 88);
  sky(scene);
  const fixed = new THREE.Group(); scene.add(fixed);
  const tread = new THREE.Group(); tread.name = "set-tread"; scene.add(tread);
  const N = 6, Z0 = -84, Z1 = 36;   // modules from Z0, enough to cover Z1 after scrolling one period

  // the road: warm grey asphalt with fine grit, an edge line on the passenger side and a dashed centre line
  const asphalt = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = "#7d8088"; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { const v = 95 + Math.floor(rnd() * 70); c.fillStyle = `rgba(${v},${v},${v + 6},0.35)`; c.fillRect(rnd() * w, rnd() * h, 1.5, 1.5); }
    for (let i = 0; i < 26; i++) { c.fillStyle = `rgba(70,72,80,${0.08 + rnd() * 0.08})`; c.beginPath(); c.ellipse(rnd() * w, rnd() * h, 20 + rnd() * 60, 8 + rnd() * 20, rnd() * 3, 0, 7); c.fill(); }
  }, 1, PERIOD / 8);
  const roadW = ROAD.left - ROAD.right + 1.2, roadLen = (Z1 - Z0) + PERIOD;
  const road = flat(new THREE.Mesh(new THREE.PlaneGeometry(roadW, roadLen), lam("#ffffff", { map: asphalt })));
  asphalt.repeat.set(roadW / 8, roadLen / 8);
  road.rotation.x = -Math.PI / 2; road.position.set((ROAD.left + ROAD.right) / 2, 0, (Z0 + Z1 + PERIOD) / 2); road.name = "set-floor"; tread.add(road);
  const paint = lam("#f4f1e8"); paint.userData.noOutline = true;
  const edge = flat(new THREE.Mesh(new THREE.PlaneGeometry(0.14, roadLen), paint)); edge.rotation.x = -Math.PI / 2; edge.position.set(ROAD.right + 0.35, 0.004, road.position.z); tread.add(edge);
  for (let z = Z0; z < Z1 + PERIOD; z += 6) { const d = flat(new THREE.Mesh(new THREE.PlaneGeometry(0.14, 3), paint)); d.rotation.x = -Math.PI / 2; d.position.set(ROAD.centre, 0.004, z); tread.add(d); }

  // the driver's side: a tall cream retaining wall of big stone blocks, greenery spilling over the top, trees behind
  const stone = canvasTex(512, 256, (c, w, h) => {
    c.fillStyle = "#e9dcc3"; c.fillRect(0, 0, w, h);
    const rows = 4;
    for (let r = 0; r < rows; r++) {
      let x = r % 2 ? -40 : 0;
      while (x < w) {
        const bw = 90 + rnd() * 70, v = rnd() * 16 - 8;
        c.fillStyle = `rgb(${233 + v},${220 + v},${195 + v})`; c.fillRect(x + 2, r * (h / rows) + 2, bw - 4, h / rows - 4);
        c.fillStyle = "rgba(160,140,110,0.35)"; c.fillRect(x, r * (h / rows), 2, h / rows);
        x += bw;
      }
      c.fillStyle = "rgba(160,140,110,0.4)"; c.fillRect(0, r * (h / rows), w, 2);
    }
    for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(150,130,100,${0.05 + rnd() * 0.07})`; c.fillRect(rnd() * w, rnd() * h, 10 + rnd() * 40, 3 + rnd() * 10); }
  }, PERIOD / 6, 1);
  const wallH = 3.0;
  const wall = new THREE.Mesh(new THREE.BoxGeometry(0.6, wallH, roadLen), lam("#ffffff", { map: stone }));
  stone.repeat.set(roadLen / 6, 1);
  wall.position.set(ROAD.wallX + 0.3, wallH / 2, road.position.z); wall.receiveShadow = true; tread.add(wall);
  const cap = put(tread, new THREE.BoxGeometry(0.75, 0.14, roadLen), lam("#f1e7d4"), ROAD.wallX + 0.3, wallH + 0.07, road.position.z);
  cap.castShadow = false;
  const green = [lam("#5e9e43"), lam("#4f8b3a"), lam("#73b24f")], trunk = lam("#6b4a2e"), dark = lam("#2f5a2c");
  // modules: the same pattern every PERIOD (bushes along the wall top, a tree and a cypress behind it, parapet tufts)
  const mod = new THREE.Group();
  const mr = rng(77);
  for (let k = 0; k < 9; k++) {
    const b = put(mod, new THREE.SphereGeometry(1, 14, 10), green[k % 3], ROAD.wallX + 0.1 + mr() * 0.5, wallH + 0.15, (k / 9) * PERIOD + mr() * 1.5);
    b.scale.set(0.5 + mr() * 0.3, 0.45 + mr() * 0.3, 0.9 + mr() * 0.9);
  }
  bushTree(mod, green[0], green[2], trunk, ROAD.wallX + 2.2, wallH, 4, 1.6, mr);
  bushTree(mod, green[1], green[0], trunk, ROAD.wallX + 3.0, wallH, 15, 2.0, mr);
  cypress(mod, dark, trunk, ROAD.wallX + 1.6, wallH, 10, 5.5);
  cypress(mod, dark, trunk, ROAD.wallX + 2.4, wallH, 20.5, 6.5);
  // the passenger side: a low cream parapet with tufts of green along it
  const parH = 0.55;
  const par = new THREE.Mesh(new THREE.BoxGeometry(0.45, parH, roadLen), lam("#ffffff", { map: stone.clone() }));
  par.material.map.repeat.set(roadLen / 6, 0.25); par.position.set(ROAD.parapetX, parH / 2, road.position.z); par.receiveShadow = true; par.castShadow = true; tread.add(par);
  put(tread, new THREE.BoxGeometry(0.55, 0.08, roadLen), lam("#f1e7d4"), ROAD.parapetX, parH + 0.04, road.position.z).castShadow = false;
  for (let k = 0; k < 7; k++) {
    const b = put(mod, new THREE.SphereGeometry(1, 12, 8), green[(k + 1) % 3], ROAD.parapetX - 0.35 - mr() * 0.4, parH + 0.05, (k / 7) * PERIOD + mr() * 2);
    b.scale.set(0.45 + mr() * 0.3, 0.35 + mr() * 0.3, 0.7 + mr() * 0.8);
  }
  cypress(mod, dark, trunk, ROAD.parapetX - 1.6, -0.6, 7, 5.0);
  bushTree(mod, green[2], green[1], trunk, ROAD.parapetX - 2.8, -1.0, 17, 1.7, mr);
  // the grass verge below the parapet, falling away to the view
  const verge = flat(new THREE.Mesh(new THREE.PlaneGeometry(9, roadLen), lam("#86b25a"))); verge.rotation.x = -Math.PI / 2; verge.position.set(ROAD.parapetX - 4.7, -1.1, road.position.z); tread.add(verge);
  for (let i = -Math.ceil(-Z0 / PERIOD) - 1; i * PERIOD < Z1 + PERIOD; i++) { const c = mod.clone(); c.position.z = i * PERIOD; tread.add(c); }

  // far away (it doesn't scroll: at this distance it barely moves): hills, a hill town, cypresses, clouds
  const hillM = [lam("#93bb6a"), lam("#7fa858"), lam("#a6c47a")];
  for (let i = 0; i < 6; i++) {
    const h = put(fixed, new THREE.SphereGeometry(1, 32, 16), hillM[i % 3], -30 - rnd() * 30, -4, -10 - i * 14 - rnd() * 6, false);
    h.scale.set(16 + rnd() * 10, 7 + rnd() * 6, 10 + rnd() * 6);
  }
  town(fixed, rnd, -46, -30, 14);
  for (let i = 0; i < 14; i++) cypress(fixed, dark, trunk, -22 - rnd() * 16, -1 + rnd() * 3, -6 - rnd() * 40, 4 + rnd() * 3);
  // the far end of the road: hills where it disappears
  for (let i = 0; i < 4; i++) { const h = put(fixed, new THREE.SphereGeometry(1, 32, 16), hillM[(i + 1) % 3], -8 + i * 12, -3, -82 - rnd() * 6, false); h.scale.set(14, 8 + rnd() * 6, 6); }
  const cloudM = new THREE.MeshLambertMaterial({ color: "#ffffff", emissive: "#f4f8ff", emissiveIntensity: 0.6, fog: false }); cloudM.userData.noOutline = true;
  for (let i = 0; i < 9; i++) {
    const c = cloud(rnd, cloudM), a = -Math.PI * 0.95 + (i / 8) * Math.PI * 1.25;
    c.position.set(Math.cos(a) * 70, 16 + rnd() * 18, Math.sin(a) * 60 - 10); c.scale.setScalar(2.4 + rnd() * 2); c.lookAt(0, c.position.y, 0); fixed.add(c);
  }

  // the divider and the dust puffs: they scroll with the road from where they are
  const div = S.divider ? divider(S) : null;
  if (div) { div.position.x = S.divider.x; scene.add(div); }
  const puffTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.55, "rgba(255,255,255,0.7)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const puffs = (S.dust || []).map((d, j) => {
    const r = rng(500 + j * 31), n = d.n ?? 14;
    return Array.from({ length: n }, () => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: d.color || "#e9dcc2", transparent: true, depthWrite: false }));
      s.material.userData.outlineParameters = { visible: false }; s.userData.lookOnly = true; scene.add(s);
      const a = r() * Math.PI * 2;
      return { s, d, dir: [Math.cos(a) * (0.6 + r() * 0.6), 0.25 + r() * 0.5, Math.sin(a) * 0.5 - 0.2], size: (d.size ?? 0.45) * (0.6 + r() * 0.8), delay: r() * 0.12 };
    });
  }).flat();

  (globalThis.__setTicks ||= []).push((t) => {
    const s = roadDistance(S, t);
    tread.position.z = -(((s % PERIOD) + PERIOD) % PERIOD);
    if (div) div.position.z = dividerZ(S, t);
    for (const p of puffs) {
      const d = p.d, dur = d.dur ?? 1.6, k = (t - d.at - p.delay) / dur;
      p.s.visible = k > 0 && k < 1; if (!p.s.visible) continue;
      const out = 1 - Math.exp(-k * 4), back = roadDistance(S, t) - roadDistance(S, d.at + p.delay);
      p.s.position.set(d.x + p.dir[0] * out, (d.y ?? 0.15) + p.dir[1] * out + 0.1 * k, d.z + p.dir[2] * out - back);
      p.s.scale.setScalar(p.size * (0.4 + 1.3 * out));
      p.s.material.opacity = Math.min(1, k * 10) * (1 - k) ** 1.5 * (d.opacity ?? 0.9);
    }
  });
  return { tread, divider: div };
}
