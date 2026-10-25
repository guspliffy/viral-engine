import { buildHills } from "./set-painted.js";
import * as THREE from "three";
import { rng } from "./util.js";
import { buildKitchen } from "./set-kitchen.js";
import { buildPorch } from "./set-porch.js";
import { buildCottage } from "./set-cottage.js";

function skyDome(top, horizon, bottom) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(top) }, hor: { value: new THREE.Color(horizon) }, bot: { value: new THREE.Color(bottom) } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: [
      "uniform vec3 top; uniform vec3 hor; uniform vec3 bot; varying vec3 vP;",
      "void main(){ float h = vP.y;",
      "  vec3 c = h > 0.0 ? mix(hor, top, pow(clamp(h*1.6,0.0,1.0), 0.7)) : mix(hor, bot, clamp(-h*4.0,0.0,1.0));",
      "  gl_FragColor = vec4(c,1.0);",
      "  #include <colorspace_fragment>",
      "}",
    ].join("\n"),
  });
  return new THREE.Mesh(new THREE.SphereGeometry(90, 32, 24), m);
}

function groundTexture(inner, outer) {
  const c = document.createElement("canvas"); c.width = c.height = 512;
  const g = c.getContext("2d"); const gr = g.createRadialGradient(256, 256, 10, 256, 256, 256);
  gr.addColorStop(0, inner); gr.addColorStop(0.35, inner); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}

// Every set object must be added here: stage.js treats whatever buildSet adds as scenery (hidden in impact frames
// and in the caption-coverage silhouette). The stage is around x -1..1, z 0; cameras look from +z.
export function buildSet(scene, spec = {}, palette = null) {
  const type = spec.type || "meadow";
  if (type === "kitchen") return buildKitchen(scene, spec);   // set-kitchen.js
  if (type === "hills") return buildHills(scene, spec);       // set-painted.js
  if (type === "porch") return buildPorch(scene, spec);       // set-porch.js
  if (type === "cottage") return buildCottage(scene, spec);   // set-cottage.js
  if (type === "party") return party(scene, { seed: 3, ...spec });
  if (type === "office") return office(scene, { seed: 3, ...spec });
  if (type === "rooftop") return rooftop(scene, { seed: 3, ...spec });
  if (type === "plain") return plain(scene, spec);
  return meadow(scene, spec, palette);
}

// "plain": a model-sheet backdrop, a warm paper colour with a floor of the same tone that takes the shadows (for
// turnarounds and construction sheets, where the scenery must not distract)
function plain(scene, spec) {
  const S = { color: "#efe4d2", floor: "#e6d8c2", ...spec };
  scene.background = new THREE.Color(S.color);
  scene.add(skyDome(S.color, S.color, S.floor));
  const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 96), new THREE.MeshLambertMaterial({ color: S.floor }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.material.userData.noOutline = true; scene.add(ground);
}

// "meadow": a soft grassy stage under a warm sky, rolling hills and a few clouds.
function meadow(scene, spec, palette) {
  const S = { sky: ["#7fc8ff", "#ffe9bf"], ground: ["#8fd16a", "#4f9a45"], seed: 3, ...spec, ...(palette || {}) };
  const rnd = rng(S.seed * 131);
  scene.background = new THREE.Color(S.sky[1]);
  scene.fog = new THREE.Fog(S.sky[1], 22, 70);
  scene.add(skyDome(S.sky[0], S.sky[1], S.ground[1]));

  const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 96), new THREE.MeshLambertMaterial({ map: groundTexture(S.ground[0], S.ground[1]) }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.material.userData.noOutline = true; scene.add(ground);

  const hillM = [new THREE.MeshLambertMaterial({ color: "#6fbf5a" }), new THREE.MeshLambertMaterial({ color: "#5aa84f" })];
  for (let i = 0; i < 7; i++) {
    const h = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20), hillM[i % 2]);
    const x = -26 + i * 9 + rnd() * 4, z = -22 - rnd() * 16, sx = 7 + rnd() * 6;
    h.scale.set(sx, 2.2 + rnd() * 2.6, 5 + rnd() * 3); h.position.set(x, -0.6, z); scene.add(h);
  }
  const cloudM = new THREE.MeshLambertMaterial({ color: "#ffffff", emissive: "#eef6ff", emissiveIntensity: 0.55, fog: false });
  for (let i = 0; i < 6; i++) {
    const cg = new THREE.Group();
    for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), cloudM); b.scale.setScalar(0.9 + rnd() * 0.9); b.position.set(k * 1.1 - 2.2, rnd() * 0.6, rnd() * 0.5); cg.add(b); }
    cg.position.set(-24 + i * 9 + rnd() * 5, 7 + rnd() * 6, -40 - rnd() * 10); cg.scale.setScalar(1.2 + rnd()); scene.add(cg);
  }
  // grass tufts and flowers, kept out of the middle of the stage
  const tuftM = new THREE.MeshLambertMaterial({ color: "#4f9a3f" }); tuftM.userData.noOutline = true;
  const petal = ["#ffffff", "#ffd1e8", "#fff3a0"].map((c) => new THREE.MeshLambertMaterial({ color: c }));
  const centre = new THREE.MeshLambertMaterial({ color: "#f2b33d" }); centre.userData.noOutline = true;
  for (const m of petal) m.userData.noOutline = true;
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2, r = 2.6 + rnd() * 9;
    const x = Math.cos(a) * r, z = Math.sin(a) * r * 0.8 - 1.5;
    if (z > 2.2) continue;
    if (rnd() < 0.65) {
      const g = new THREE.Group();
      for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.22 + rnd() * 0.12, 5), tuftM); b.position.set((rnd() - 0.5) * 0.12, 0.1, (rnd() - 0.5) * 0.12); b.rotation.set((rnd() - 0.5) * 0.6, 0, (rnd() - 0.5) * 0.6); g.add(b); }
      g.position.set(x, 0, z); scene.add(g);
    } else {
      const f = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 5), tuftM); stem.position.y = 0.11; f.add(stem);
      const pm = petal[Math.floor(rnd() * petal.length)];
      for (let k = 0; k < 5; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), pm); const aa = (k / 5) * Math.PI * 2; p.position.set(Math.cos(aa) * 0.035, 0.23, Math.sin(aa) * 0.035); p.scale.set(1, 0.4, 1); f.add(p); }
      const cc = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), centre); cc.position.y = 0.235; f.add(cc);
      f.position.set(x, 0, z); scene.add(f);
    }
  }
  // hand-placed flower clumps for close-ups ("flowers": [[x, z], ...]); the random ones avoid the stage centre
  for (const [x, z] of spec.flowers || []) {
    for (let k = 0; k < 4; k++) {
      const f = new THREE.Group(), s = 0.9 + rnd() * 0.5;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 5), tuftM); stem.position.y = 0.11; f.add(stem);
      const pm = petal[Math.floor(rnd() * petal.length)];
      for (let j = 0; j < 5; j++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), pm); const aa = (j / 5) * Math.PI * 2; p.position.set(Math.cos(aa) * 0.035, 0.23, Math.sin(aa) * 0.035); p.scale.set(1, 0.4, 1); f.add(p); }
      const cc = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), centre); cc.position.y = 0.235; f.add(cc);
      f.scale.setScalar(s); f.position.set(x + (rnd() - 0.5) * 0.3, 0, z + (rnd() - 0.5) * 0.25); scene.add(f);
    }
  }
}

// ---------- shared pieces for the other sets ----------
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
const quiet = (m) => { m.userData.noOutline = true; return m; };
function box(scene, w, h, d, m, x, y, z, ry = 0) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.rotation.y = ry;
  b.castShadow = true; b.receiveShadow = true; scene.add(b); return b;
}
function floor(scene, color, size = 40) {
  const f = new THREE.Mesh(new THREE.PlaneGeometry(size, size), quiet(new THREE.MeshLambertMaterial({ color })));
  f.rotation.x = -Math.PI / 2; f.receiveShadow = true; scene.add(f); return f;
}
function backWall(scene, color, z = -2.4, h = 7) {
  const w = new THREE.Mesh(new THREE.PlaneGeometry(24, h), quiet(new THREE.MeshLambertMaterial({ color })));
  w.position.set(0, h / 2, z); w.receiveShadow = true; scene.add(w);
  box(scene, 24, 0.12, 0.04, quiet(mat(new THREE.Color(color).multiplyScalar(0.75))), 0, 0.06, z + 0.02);
  return w;
}
// a sagging line of lights between two points; returns the bulb positions
function stringLights(scene, a, b, sag, colors, n, rnd) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const k = i / n; pts.push(new THREE.Vector3().lerpVectors(a, b, k).add(new THREE.Vector3(0, -sag * 4 * k * (1 - k), 0))); }
  const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 4, 0.006, 4), quiet(mat("#2a2630")));
  scene.add(wire);
  const ms = colors.map((c) => quiet(new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.6 })));
  pts.forEach((p, i) => { if (i === 0 || i === n) return; const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), ms[Math.floor(rnd() * ms.length)]); m.position.copy(p).add(new THREE.Vector3(0, -0.04, 0)); scene.add(m); });
  return pts;
}
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// "party": a living room at night. Purple wall, couch, string lights, bunting and balloons.
function party(scene, S) {
  const rnd = rng(S.seed * 173);
  const wallC = S.wall || "#5b3f8c";
  scene.background = new THREE.Color("#2a1d40"); scene.fog = new THREE.Fog("#2a1d40", 14, 40);
  floor(scene, S.floor || "#a8714a");
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.9, 48), quiet(new THREE.MeshLambertMaterial({ color: "#e7b65a" })));
  rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.004, -0.2); rug.scale.set(1.3, 0.8, 1); rug.receiveShadow = true; scene.add(rug);
  backWall(scene, wallC);
  // couch
  const cloth = mat("#e0785a"), dark = mat("#b9573f");
  box(scene, 2.6, 0.38, 0.8, cloth, 0, 0.3, -1.85); box(scene, 2.6, 0.7, 0.22, dark, 0, 0.7, -2.2);
  for (const sx of [-1, 1]) box(scene, 0.24, 0.6, 0.8, dark, sx * 1.36, 0.42, -1.85);
  for (const sx of [-0.62, 0.62]) { const c = box(scene, 1.15, 0.14, 0.62, mat("#f08b6b"), sx, 0.55, -1.8); c.rotation.z = sx * 0.01; }
  const pillow = box(scene, 0.34, 0.34, 0.1, mat("#ffd25a"), -0.95, 0.78, -1.98); pillow.rotation.z = 0.3;
  // picture frames on the wall
  const frames = [[-1.9, 2.0, 0.7, 0.55, "#7fd0e6"], [1.8, 2.15, 0.55, 0.7, "#ffb3c8"], [0.0, 2.55, 0.5, 0.36, "#9be37a"]];
  for (const [x, y, w, h, c] of frames) { box(scene, w + 0.08, h + 0.08, 0.03, mat("#f3e6c8"), x, y, -2.38); box(scene, w, h, 0.032, quiet(mat(c)), x, y, -2.37); }
  // lights and bunting across the wall
  const bulbs = ["#ffd56b", "#ff7fb0", "#7fe3ff", "#b6ff7a"];
  stringLights(scene, new THREE.Vector3(-3.2, 3.0, -2.3), new THREE.Vector3(3.2, 3.0, -2.3), 0.55, bulbs, 26, rnd);
  stringLights(scene, new THREE.Vector3(-3.2, 2.4, -2.25), new THREE.Vector3(3.2, 2.5, -2.25), 0.35, bulbs, 22, rnd);
  const flagC = ["#ff5d73", "#ffd166", "#06d6a0", "#4cc9f0"].map((c) => quiet(new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide })));
  const tri = new THREE.BufferGeometry(); tri.setAttribute("position", new THREE.Float32BufferAttribute([-0.09, 0, 0, 0.09, 0, 0, 0, -0.18, 0], 3)); tri.computeVertexNormals();
  for (let i = 0; i < 18; i++) { const k = (i + 0.5) / 18, x = -2.8 + 5.6 * k, y = 1.95 - 0.3 * 4 * k * (1 - k); const f = new THREE.Mesh(tri, flagC[i % 4]); f.position.set(x, y, -2.3); f.rotation.z = (rnd() - 0.5) * 0.2; scene.add(f); }
  // balloon bunches in both back corners
  const bc = ["#ff4d6d", "#ffd23f", "#3ec1d3", "#9b5de5", "#ff8fab"];
  for (const [cx, cz] of [[-1.85, -1.55], [1.9, -1.45]]) {
    for (let i = 0; i < 4; i++) {
      const col = bc[Math.floor(rnd() * bc.length)];
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 18), new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.25, clearcoat: 0.8 }));
      b.scale.set(1, 1.18, 1); const x = cx + (rnd() - 0.5) * 0.45, y = 1.25 + rnd() * 0.55, z = cz + (rnd() - 0.5) * 0.3;
      b.position.set(x, y, z); b.castShadow = true; scene.add(b);
      const str = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, y - 0.2, 4), quiet(mat("#f0f0f0"))); str.position.set((x + cx) / 2, (y - 0.2) / 2, (z + cz) / 2); str.rotation.z = (cx - x) * 0.25; scene.add(str);
    }
  }
  // a side table with snacks and cups
  box(scene, 0.5, 0.5, 0.4, mat("#6a4a7a"), 2.25, 0.25, -0.9);
  for (const [x, c] of [[2.12, "#ff4d6d"], [2.3, "#3ec1d3"], [2.42, "#ffd23f"]]) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.12, 14), mat(c)); cup.position.set(x, 0.56, -0.86); scene.add(cup); }
}

// "office": open-plan office by day. Pale wall, big window, desks with monitors, a clock and a plant.
function office(scene, S) {
  const rnd = rng(S.seed * 191);
  scene.background = new THREE.Color("#cfd8e3"); scene.fog = new THREE.Fog("#cfd8e3", 14, 40);
  floor(scene, S.floor || "#8b95a5");
  backWall(scene, S.wall || "#e4e9f0");
  // window with a city view
  const view = canvasTex(512, 384, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#6fb6f2"); gr.addColorStop(1, "#d8eefc"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) { const bw = 30 + rnd() * 50, bh = 80 + rnd() * 200, x = i * 38 - 10; g.fillStyle = ["#9fb4c8", "#8aa1b8", "#b3c4d4"][i % 3]; g.fillRect(x, h - bh, bw, bh); g.fillStyle = "rgba(255,255,255,0.45)"; for (let y = h - bh + 10; y < h - 8; y += 16) for (let xx = x + 6; xx < x + bw - 8; xx += 12) g.fillRect(xx, y, 6, 8); }
  });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.5), quiet(new THREE.MeshBasicMaterial({ map: view })));
  win.position.set(-1.25, 1.75, -2.385); scene.add(win);
  const frameM = mat("#f7f9fb");
  for (const [w, h, x, y] of [[2.12, 0.07, -1.25, 2.5], [2.12, 0.07, -1.25, 1.0], [0.07, 1.57, -2.28, 1.75], [0.07, 1.57, -0.22, 1.75], [0.05, 1.5, -1.25, 1.75]]) box(scene, w, h, 0.05, frameM, x, y, -2.37);
  // wall clock
  const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.04, 40), mat("#ffffff")); clock.rotation.x = Math.PI / 2; clock.position.set(1.15, 2.3, -2.36); scene.add(clock);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.02, 8, 40), mat("#333a44")); rim.position.set(1.15, 2.3, -2.34); scene.add(rim);
  for (const [len, a] of [[0.13, 0.5], [0.19, -1.9]]) { const hnd = new THREE.Mesh(new THREE.BoxGeometry(0.014, len, 0.01), quiet(mat("#222"))); hnd.geometry.translate(0, len / 2, 0); hnd.position.set(1.15, 2.3, -2.33); hnd.rotation.z = a; scene.add(hnd); }
  // desks with monitors behind the stage
  const deskM = mat("#d9c3a0"), legM = mat("#5a6270"), scr = quiet(new THREE.MeshStandardMaterial({ color: "#7cc4ff", emissive: "#5ab0f0", emissiveIntensity: 0.9 }));
  for (const [x, z] of [[-1.55, -1.5], [1.6, -1.55]]) {
    box(scene, 1.3, 0.05, 0.6, deskM, x, 0.74, z);
    for (const lx of [-0.6, 0.6]) box(scene, 0.04, 0.72, 0.55, legM, x + lx, 0.36, z);
    box(scene, 0.55, 0.36, 0.04, mat("#2b2f36"), x, 1.03, z - 0.14); box(scene, 0.5, 0.31, 0.01, scr, x, 1.03, z - 0.115);
    box(scene, 0.05, 0.16, 0.05, mat("#2b2f36"), x, 0.83, z - 0.16);
    box(scene, 0.4, 0.04, 0.15, mat("#3a3f48"), x - 0.05, 0.78, z + 0.12);
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 14), mat(x < 0 ? "#ff6b6b" : "#ffd166")); mug.position.set(x + 0.45, 0.82, z + 0.05); scene.add(mug);
    box(scene, 0.5, 0.06, 0.5, mat("#3d4452"), x, 0.48, z + 0.55); box(scene, 0.5, 0.5, 0.06, mat("#3d4452"), x, 0.75, z + 0.82);
  }
  // cubicle divider and a plant
  box(scene, 0.06, 1.2, 1.1, mat("#9fb1c9"), 2.35, 0.6, -1.4);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.35, 20), mat("#f2efe8")); pot.position.set(-2.2, 0.175, -1.0); pot.castShadow = true; scene.add(pot);
  const leafM = mat("#4f9a45");
  for (let i = 0; i < 9; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), leafM); const a = i * 0.7; l.scale.set(0.05, 0.28, 0.12); l.position.set(-2.2 + Math.cos(a) * 0.12, 0.6 + rnd() * 0.15, -1.0 + Math.sin(a) * 0.12); l.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5); l.castShadow = true; scene.add(l); }
  // a ceiling light strip glow on the wall
  box(scene, 6, 0.06, 0.4, quiet(new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 1 })), 0, 3.6, -1.6);
}

// "rooftop": a city rooftop at dusk. Parapet, railing, string lights, a water tower and a skyline with lit windows.
function rooftop(scene, S) {
  const rnd = rng(S.seed * 211);
  const sky = S.sky || ["#3a2f73", "#ff9d6e"];
  scene.background = new THREE.Color(sky[1]); scene.fog = new THREE.Fog(sky[1], 25, 85);
  scene.add(skyDome(sky[0], sky[1], "#3a2f50"));
  floor(scene, S.floor || "#8a8590", 30);
  const tiles = new THREE.GridHelper(30, 30, "#77727d", "#77727d"); tiles.position.y = 0.003; tiles.material.userData.noOutline = true; scene.add(tiles);
  // parapet and railing at the back edge
  const conc = mat("#9a94a0");
  box(scene, 14, 0.5, 0.25, conc, 0, 0.25, -2.0);
  const railM = mat("#3b3646", { metalness: 0.4, roughness: 0.5 });
  box(scene, 14, 0.04, 0.04, railM, 0, 1.0, -2.0);
  for (let x = -6; x <= 6; x += 0.5) box(scene, 0.03, 0.5, 0.03, railM, x, 0.75, -2.0);
  // skyline: boxes with lit windows
  const winTex = canvasTex(128, 256, (g, w, h) => {
    g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
    const r = rng(99);
    for (let y = 6; y < h - 6; y += 14) for (let x = 6; x < w - 6; x += 14) if (r() < 0.45) { g.fillStyle = r() < 0.7 ? "#ffd27a" : "#9fd8ff"; g.fillRect(x, y, 7, 9); }
  });
  winTex.wrapS = winTex.wrapT = THREE.RepeatWrapping;
  const bodies = ["#3d3560", "#463a6b", "#2f2a52", "#55447a"];
  for (let i = 0; i < 26; i++) {
    const w = 3 + rnd() * 4, h = 3 + rnd() * 9, d = 2 + rnd() * 3;
    const x = -40 + i * 3.2 + rnd() * 2, z = -30 - rnd() * 18;
    const t = winTex.clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 4)));
    const m = new THREE.MeshStandardMaterial({ color: bodies[i % 4], emissive: "#ffffff", emissiveMap: t, emissiveIntensity: 0.9, roughness: 0.9 });
    m.userData.noOutline = true;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, h / 2 - 3, z); scene.add(b);
  }
  // water tower on the right
  const wood = mat("#8a5a3c");
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.9, 24), wood); tank.position.set(2.6, 1.75, -3.2); tank.castShadow = true; scene.add(tank);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.4, 24), mat("#4a4050")); roof.position.set(2.6, 2.4, -3.2); scene.add(roof);
  for (const [dx, dz] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]]) box(scene, 0.06, 1.3, 0.06, mat("#4a4050"), 2.6 + dx, 0.65, -3.2 + dz);
  // string lights on two poles
  for (const x of [-2.3, 2.3]) box(scene, 0.05, 2.4, 0.05, railM, x, 1.2, -1.6);
  stringLights(scene, new THREE.Vector3(-2.3, 2.35, -1.6), new THREE.Vector3(2.3, 2.35, -1.6), 0.45, ["#ffd56b", "#ffe6a8"], 20, rnd);
  // a couple of stars
  const starM = new THREE.MeshBasicMaterial({ color: "#fff7e0", fog: false });
  for (let i = 0; i < 40; i++) { const a = rnd() * Math.PI * 2, e = 0.35 + rnd() * 0.9; const s = new THREE.Mesh(new THREE.SphereGeometry(0.12 + rnd() * 0.1, 6, 4), starM); s.position.set(Math.cos(a) * Math.cos(e) * 80, Math.sin(e) * 80, Math.sin(a) * Math.cos(e) * 80 - 10); scene.add(s); }
}

export function buildLights(scene, spec = {}) {
  scene.add(new THREE.HemisphereLight("#d6ecff", "#7a6a3a", 0.9));
  const key = new THREE.DirectionalLight("#fff0d4", 2.6);
  key.position.set(-3.5, 6, 5); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 20 });
  scene.add(key);
  const fill = new THREE.DirectionalLight("#c4dcff", 0.7); fill.position.set(4, 2.5, 4); scene.add(fill);
  const rim = new THREE.DirectionalLight("#fff6e8", 1.6); rim.position.set(1, 3.5, -5); scene.add(rim);
}
