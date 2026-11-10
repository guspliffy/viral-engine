import * as THREE from "three";
import { rng } from "./util.js";
import { canvas, tex, glow } from "./set-porch.js";
import { FIRE_U } from "./firelight.js";
import { buildSnowWorld } from "./set-snowslope.js";

// "snowcottage": the snowed-in mountain cottage room for Survive it EP1 "Snowed in with your friends for 100 days"
// (task T1, 9 Nov 2026; Jonny's panels 01-05). The xmasroom made plain and bigger where it must be: the same honey
// boards, dark floor, red rug and ceiling beams, a ceiling, a big grey stone chimney breast back right (floor to
// ceiling, an arched fire opening, a raised hearth step, a dark mantel beam above the cast's heads with five candles),
// a window back left packed with snow behind the glass, and a plank door in the left wall that swings into the room.
// The side walls and the ceiling run forward to z 3.6, so no camera inside the room sees past them; every wall is
// solid both ways (a thin shell behind each painted face).
// Keys (each [[t, v], ...], eased between keys, a step at equal times; a plain number holds; all story time):
//   fire       0 cold ashes, 0.25 embers (one glowing crumb), 1 a cosy cel fire, 2 the flare: a flame column filling
//              the opening and licking up the breast past the mantel to about 2 m, an orange flash on the room and the cast
//   candles    0..1 the mantel candles' flames and glow (default 1)
//   snowWindow the packed snow behind the glass, from the sill up to this share of the window (0.8 a strip of white
//              sky above it, 1.0 no sky, 0.6 spring; default 0.8)
//   door       0..1 open, swung into the room to 100 degrees (default 0)
//   dark       0 day .. 1 night: the window's light and the room's cool fill go down, the fire and candles carry the
//              room (deliberately not "night", which flips the anime-pro look's colours for the whole clip)
//   world      true: the snowy mountain world all round (set-snowslope.js buildSnowWorld, sharing `dark`), for clips
//              that go outside; the cottage's outside is the cottagesled prop (props-avalanche.js)
//   outside    false: nothing behind the door opening (the outside world is another set's job); default a plain sky
//              and snow card for benches
// The fire's light on the cast and room goes through the anime-pro look's shared fire light (firelight.js FIRE_U),
// plus a point light for the other looks. Night darkens the cast a little (a cool multiply over the frame drawn after
// the opaque picture; the fire, candles and glows are drawn after it), never under 60 % of the day.
// Everything keyed is a function of story time (globalThis.__setTicks): no Math.random, no wall clock.
// spec: { type: "snowcottage", light: "golden", windows: false, seed, fire, candles, snowWindow, door, dark, world, outside }
// plus the clip template's look flags. SNOWCOTTAGE has the layout for the generator.
export const SNOWCOTTAGE = {
  back: -2.3, left: -2.7, right: 2.7, front: 3.6, ceil: 3.0,
  hearth: { x: 1.05, w: 1.7, d: 0.45, open: { w: 1.1, h: 1.0 }, step: { w: 1.9, h: 0.12, d: 0.5 }, mantel: 1.55 },   // step: d metres out from the breast's face
  win: { x: -1.4, w: 1.4, y0: 1.0, y1: 2.4 },
  door: { x: -2.7, z: -0.4, w: 1.0, h: 2.0, hinge: -0.9, open: 100, drift: 0.1 },   // hinge: the hinge side's z; open: degrees at 1
  rug: { x: 0.05, z: 0.1, w: 3.6, d: 2.6 },
};

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
const flat = (color, o = {}) => { const m = std(color, o); m.userData.noOutline = true; return m; };
const basic = (o) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; return m; };
function box(parent, w, h, d, m, x, y, z, cast = false) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = cast; b.receiveShadow = true; parent.add(b); return b; }
function cyl(parent, r0, r1, h, m, x, y, z, seg = 16) { const b = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), m); b.position.set(x, y, z); b.receiveShadow = true; parent.add(b); return b; }
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// a keyed value at story time t: [[t, v], ...] eased (smoothstep) between keys, a step where two keys share a time
export function keyAt(K, t, def) {
  if (K == null) return def;
  if (typeof K === "number") return K;
  if (!Array.isArray(K) || !K.length) return def;
  if (t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) {
    const [t0, v0] = K[i - 1], [t1, v1] = K[i];
    if (t < t1) { if (t1 - t0 < 1e-9) return v1; const u = (t - t0) / (t1 - t0); return v0 + (v1 - v0) * u * u * (3 - 2 * u); }
  }
  return K[K.length - 1][1];
}
// flicker: a function of story time only, held for a drawing (12 a second) like a hand-drawn flame
const flick = (t, s) => { const q = Math.floor(t * 12 + 1e-6) / 12; return 1 + 0.07 * Math.sin(q * 9.7 + s) + 0.05 * Math.sin(q * 15.3 + s * 2.1) + 0.03 * Math.sin(q * 23.9 + s * 0.7); };

// the xmasroom's painters (set-xmasroom.js keeps them private and must stay byte-identical, so they are repeated here):
// honey wood boards running up the wall, uneven widths and tones, knots, a few darker boards
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
// dark, worn floorboards running across the room
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
// the big red patterned rug
function rugTex(rnd) {
  const W = 1024, H = 768, [c, g] = canvas(W, H);
  g.fillStyle = "#9c2a22"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? "60,10,10" : "200,80,60"},${0.04 + rnd() * 0.05})`; g.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 10, 2 + rnd() * 3); }
  const band = (m, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.strokeRect(m, m, W - 2 * m, H - 2 * m); };
  band(22, 26, "#1f2a4a"); band(46, 8, "#e8d6a8"); band(64, 22, "#1f2a4a"); band(84, 5, "#d9a441");
  for (let x = 40; x < W - 30; x += 46) for (const y of [22, H - 22]) { g.fillStyle = "#d9a441"; g.beginPath(); g.moveTo(x, y - 8); g.lineTo(x + 8, y); g.lineTo(x, y + 8); g.lineTo(x - 8, y); g.fill(); }
  for (let y = 40; y < H - 30; y += 46) for (const x of [22, W - 22]) { g.fillStyle = "#d9a441"; g.beginPath(); g.moveTo(x, y - 8); g.lineTo(x + 8, y); g.lineTo(x, y + 8); g.lineTo(x - 8, y); g.fill(); }
  const cx = W / 2, cy = H / 2;
  for (const [r, col] of [[200, "#1f2a4a"], [170, "#c8873a"], [140, "#7a1c18"], [96, "#e8d6a8"], [60, "#1f2a4a"], [26, "#d9a441"]]) { g.fillStyle = col; g.beginPath(); for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, rr = k % 2 ? r * 0.82 : r; g.lineTo(cx + Math.cos(a) * rr * 1.3, cy + Math.sin(a) * rr); } g.closePath(); g.fill(); }
  for (let y = 130; y < H - 110; y += 64) for (let x = 130; x < W - 110; x += 72) {
    if (Math.hypot((x - cx) / 1.3, y - cy) < 230) continue;
    const col = ["#e8d6a8", "#d9a441", "#1f2a4a"][Math.floor(rnd() * 3)];
    g.fillStyle = col; for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; g.beginPath(); g.arc(x + Math.cos(a) * 7, y + Math.sin(a) * 7, 5, 0, Math.PI * 2); g.fill(); }
  }
  return c;
}
// grey fieldstone in rough courses with dark mortar (the chimney breast)
function stoneTex(rnd) {
  const [c, g] = canvas(512, 512);
  g.fillStyle = "#4a443e"; g.fillRect(0, 0, 512, 512);
  for (let r = 0; r < 8; r++) {
    let x = -rnd() * 50;
    while (x < 512) {
      const w = 56 + rnd() * 60, h = 64, v = 0.78 + rnd() * 0.34, y = r * 64;
      g.fillStyle = `rgb(${Math.round(150 * v)},${Math.round(146 * v)},${Math.round(140 * v)})`; g.beginPath(); g.roundRect(x + 4, y + 4, w - 8, h - 8, 14); g.fill();
      g.fillStyle = "rgba(255,255,255,0.12)"; g.beginPath(); g.roundRect(x + 8, y + 7, w - 18, 10, 5); g.fill();   // the lit top of the stone
      g.fillStyle = "rgba(30,26,22,0.18)"; g.beginPath(); g.roundRect(x + 8, y + h - 18, w - 16, 9, 4); g.fill();
      x += w;
    }
  }
  return c;
}
// a cel flame: tongues in four hard-edged tones (red-orange, orange, yellow, a pale core), one drawing per variant
function flameTex(rnd, W, H, n, tall) {
  const [c, g] = canvas(W, H);
  const T = [];
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, x = W * (0.1 + 0.8 * u + (rnd() - 0.5) * 0.06);
    const mid = 1 - Math.abs(u - 0.5) * (tall ? 0.9 : 1.1);
    T.push({ x, w: W * (0.1 + rnd() * 0.07) * (tall ? 1.15 : 1), h: H * (0.42 + rnd() * 0.22 + 0.36 * mid), lean: (rnd() - 0.5) * W * 0.08 });
  }
  for (const [col, k] of [["#e04a1a", 1.0], ["#ff9020", 0.8], ["#ffcf3c", 0.58], ["#fff3c0", 0.32]]) {
    g.fillStyle = col;
    for (const q of T) {
      const w = q.w * (0.45 + 0.55 * k), h = q.h * Math.pow(k, 0.8);
      g.beginPath(); g.moveTo(q.x - w, H); g.quadraticCurveTo(q.x - w * 0.95, H - h * 0.5, q.x + q.lean * k, H - h); g.quadraticCurveTo(q.x + w * 0.95, H - h * 0.5, q.x + w, H); g.fill();
    }
    g.fillRect(W * (0.5 - 0.42 * k), H - H * 0.06 * k, W * 0.84 * k, H * 0.06 * k);
  }
  return c;
}

// the window's outside: the packed snow wall from the sill up to uFill of the window, a soft blue top edge, a strip of
// sky above it (white by day, night blue in the dark), a few flakes falling (story time)
function snowWallMat(P) {
  return new THREE.ShaderMaterial({
    uniforms: { uFill: { value: 0.8 }, uDark: { value: 0 }, uT: { value: 0 }, uY0: { value: P.y0 }, uY1: { value: P.y1 } },
    vertexShader: `varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uFill, uDark, uT, uY0, uY1; varying vec3 vW;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        float x = vW.x, y = vW.y, top = uY0 + uFill * (uY1 - uY0);
        // the top edge of the pack: lumpy, a little lower in the middle of each pane
        float edge = top + 0.045 * sin(x * 7.0 + 1.3) + 0.025 * sin(x * 19.0 + 0.4) - 0.015;
        vec3 skyD = mix(vec3(0.66, 0.74, 0.87), vec3(0.78, 0.84, 0.93), clamp((y - uY0) / (uY1 - uY0), 0.0, 1.0));
        vec3 skyN = mix(vec3(0.13, 0.2, 0.42), vec3(0.06, 0.1, 0.26), clamp((y - uY0) / (uY1 - uY0), 0.0, 1.0));
        vec3 col = mix(skyD, skyN, uDark);
        if (y < edge) {
          // packed snow pressed to the glass: a bright crest, a soft blue band under it, then bluish white with blue
          // layers, bluer deeper down
          float d = edge - y, layer = smoothstep(0.55, 0.95, sin(y * 34.0 + sin(x * 4.0) * 1.8));
          vec3 snD = mix(vec3(0.84, 0.9, 1.0), vec3(0.68, 0.77, 0.96), clamp(d / 1.2, 0.0, 1.0));
          vec3 snN = mix(vec3(0.33, 0.39, 0.54), vec3(0.24, 0.3, 0.46), clamp(d / 1.2, 0.0, 1.0));
          vec3 sn = mix(snD, snN, uDark);
          sn = mix(sn, mix(vec3(0.6, 0.7, 0.93), vec3(0.26, 0.32, 0.48), uDark), layer * 0.7 * smoothstep(0.1, 0.2, d));
          sn = mix(sn, mix(vec3(0.45, 0.58, 0.9), vec3(0.2, 0.27, 0.46), uDark), (smoothstep(0.015, 0.035, d) - smoothstep(0.07, 0.16, d)) * 0.9);
          sn = mix(sn, mix(vec3(0.99, 1.0, 1.0), vec3(0.45, 0.52, 0.68), uDark), 1.0 - smoothstep(0.012, 0.022, d));
          col = sn;
        }
        // a few flakes drifting down in front of it all (cells of 9 cm, about one in three holds a flake)
        vec2 q = vec2(x + 0.06 * sin(uT * 0.9 + y * 2.0), y + uT * 0.22) / 0.08, cell = floor(q), f = fract(q) - 0.5;
        float h = hash(cell);
        if (h > 0.74) { vec2 o = vec2(hash(cell + 3.1) - 0.5, hash(cell + 7.7) - 0.5) * 0.6; float r = length(f - o); col = mix(col, mix(vec3(1.0), vec3(0.72, 0.8, 0.95), uDark), 1.0 - smoothstep(0.035, 0.06, r)); }
        gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);   // authored in sRGB
        #include <colorspace_fragment>
      }`,
  });
}

export function buildSnowcottage(scene, S = {}) {
  const P = SNOWCOTTAGE, rnd = rng((S.seed || 7) * 613 + 11), set = new THREE.Group(); set.name = "set-snowcottage"; scene.add(set);
  scene.background = new THREE.Color("#1c130c"); scene.fog = null;
  const L = P.left, R = P.right, BZ = P.back, FZ = P.front, H = P.ceil, W = R - L, T = 0.1;   // T: the walls' shell
  const wt = wallTex(rnd), shell = flat("#4a2c1a", { roughness: 0.9 }), dark = std("#5a3420", { roughness: 0.6 }), beamM = std("#3e2416", { roughness: 0.7 });
  // a painted wall face (u along the wall, v up, metres; the boards' texture runs on across pieces) and its shell
  const face = (w, h, u0, v0, ry, x, y, z, tint = "#ffffff") => {
    const m = flat(tint, { map: tex(wt, w / 2.2, h / 1.6), roughness: 0.75 }); m.map.offset.set(u0 / 2.2, v0 / 1.6);
    const q = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); q.rotation.y = ry; q.position.set(x, y, z); q.receiveShadow = true; set.add(q); return q;
  };
  // ---- the back wall, with the window's hole: four pieces, a shell behind
  const Wn = P.win, wx0 = Wn.x - Wn.w / 2, wx1 = Wn.x + Wn.w / 2;
  for (const [x0, x1, y0, y1] of [[L, wx0, 0, H], [wx1, R, 0, H], [wx0, wx1, 0, Wn.y0], [wx0, wx1, Wn.y1, H]]) {
    face(x1 - x0, y1 - y0, x0 - L, y0, 0, (x0 + x1) / 2, (y0 + y1) / 2, BZ);
    box(set, x1 - x0 + (x0 === L ? T : 0) + (x1 === R ? T : 0), y1 - y0, T, shell, (x0 + x1) / 2 + (x0 === L ? -T / 2 : 0) + (x1 === R ? T / 2 : 0), (y0 + y1) / 2, BZ - T / 2 - 0.002);
  }
  // ---- the right wall (solid) and the left wall round the door
  face(FZ - BZ, H, 0, 0, -Math.PI / 2, R, H / 2, (BZ + FZ) / 2);
  box(set, T, H, FZ - BZ + T, shell, R + T / 2 + 0.002, H / 2, (BZ + FZ) / 2 - T / 2);
  const D = P.door, dz0 = D.z - D.w / 2, dz1 = D.z + D.w / 2;
  for (const [z0, z1, y0, y1] of [[BZ, dz0, 0, H], [dz1, FZ, 0, H], [dz0, dz1, D.h, H]]) {
    face(z1 - z0, y1 - y0, FZ - z1, y0, Math.PI / 2, L, (y0 + y1) / 2, (z0 + z1) / 2);
    box(set, T, y1 - y0, z1 - z0 + (z0 === BZ ? T : 0), shell, L - T / 2 - 0.002, (y0 + y1) / 2, (z0 + z1) / 2 - (z0 === BZ ? T / 2 : 0));
  }
  // the doorway's reveal: jambs and head lining the wall's thickness, so the opening has no gap round its frame
  for (const z of [dz0 - 0.03, dz1 + 0.03]) box(set, T + 0.04, D.h + 0.02, 0.06, dark, L - T / 2 + 0.01, (D.h + 0.02) / 2, z);
  box(set, T + 0.04, 0.06, D.w + 0.12, dark, L - T / 2 + 0.01, D.h + 0.03, D.z);
  box(set, T + 0.06, 0.03, D.w + 0.06, std("#3a2416", { roughness: 0.8 }), L - T / 2, 0.015, D.z);   // the threshold
  // ---- the ceiling and its beams (no shadows: the key comes from up and to the right)
  { const c = flat("#c79a72", { map: tex(wt, W / 2.2, (FZ - BZ) / 1.6), roughness: 0.8 });
    const q = new THREE.Mesh(new THREE.PlaneGeometry(W, FZ - BZ), c); q.rotation.x = Math.PI / 2; q.position.set(0, H, (BZ + FZ) / 2); set.add(q);
    box(set, W + 2 * T, T, FZ - BZ + T, shell, 0, H + T / 2 + 0.002, (BZ + FZ) / 2 - T / 2);
    for (const z of [BZ + 0.12, -1.25, 0.15, 1.55, 2.95]) box(set, W, 0.2, 0.22, beamM, 0, H - 0.1, z);
    for (const x of [L + 0.11, R - 0.11]) box(set, 0.22, 0.2, FZ - BZ, beamM, x, H - 0.1, (BZ + FZ) / 2);   // wall plates
    for (const x of [L + 0.09, R - 0.09]) box(set, 0.18, H, 0.18, beamM, x, H / 2, BZ + 0.09);   // corner posts
  }
  // skirting boards
  box(set, W, 0.12, 0.03, dark, 0, 0.06, BZ + 0.015); box(set, 0.03, 0.12, FZ - BZ, dark, R - 0.015, 0.06, (BZ + FZ) / 2);
  box(set, 0.03, 0.12, dz0 - 0.06 - BZ, dark, L + 0.015, 0.06, (BZ + dz0 - 0.06) / 2); box(set, 0.03, 0.12, FZ - dz1 - 0.06, dark, L + 0.015, 0.06, (dz1 + 0.06 + FZ) / 2);
  // ---- the floor and the rug
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, FZ - BZ), flat("#ffffff", { map: tex(floorTex(rnd), W / 2.4, (FZ - BZ) / 2.4), roughness: 0.55 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, (BZ + FZ) / 2); floor.receiveShadow = true; floor.name = "set-floor"; set.add(floor);
  box(set, W + 2 * T, T, FZ - BZ + T, shell, 0, -T / 2 - 0.002, (BZ + FZ) / 2 - T / 2);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(P.rug.w, P.rug.d), flat("#ffffff", { map: tex(rugTex(rnd)), roughness: 1 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(P.rug.x, 0.004, P.rug.z); rug.receiveShadow = true; set.add(rug);

  const ticks = [];   // (t, k) => ... : k holds the frame's keyed values

  // ---- the window, back left: the snow wall behind the glass, a wooden cross frame (4 panes), a sill, red curtains
  const winLight = [];
  { const wh = Wn.y1 - Wn.y0, cx = Wn.x, cy = (Wn.y0 + Wn.y1) / 2;
    const sm = snowWallMat(Wn); sm.userData.noOutline = true;
    const out = new THREE.Mesh(new THREE.PlaneGeometry(Wn.w + 0.6, wh + 0.6), sm); out.position.set(cx, cy, BZ - T - 0.04); set.add(out);
    ticks.push((t, k) => { sm.uniforms.uFill.value = k.snow; sm.uniforms.uDark.value = k.dark; sm.uniforms.uT.value = t; });
    const fw = std("#6e4428", { roughness: 0.6 });
    for (const s of [-1, 1]) box(set, 0.08, wh + 0.16, 0.06, fw, cx + s * (Wn.w / 2 + 0.04), cy, BZ + 0.03);   // the casing
    box(set, Wn.w + 0.16, 0.08, 0.06, fw, cx, Wn.y1 + 0.04, BZ + 0.03);
    box(set, Wn.w + 0.3, 0.06, 0.24, fw, cx, Wn.y0 - 0.03, BZ + 0.06, true);   // the sill
    box(set, 0.06, wh, 0.05, fw, cx, cy, BZ - T / 2); box(set, Wn.w, 0.06, 0.05, fw, cx, cy, BZ - T / 2);   // the cross: 4 panes
    for (const s of [-1, 1]) box(set, 0.05, wh, T, fw, cx + s * (Wn.w / 2 - 0.025), cy, BZ - T / 2);   // the frame in the reveal
    box(set, Wn.w, 0.05, T, fw, cx, Wn.y1 - 0.025, BZ - T / 2); box(set, Wn.w, 0.05, T, fw, cx, Wn.y0 + 0.025, BZ - T / 2);
    // a little frost in the panes' corners
    const [fc, fg] = canvas(256, 256); const fr = fg.createRadialGradient(128, 128, 70, 128, 128, 180); fr.addColorStop(0, "rgba(255,255,255,0)"); fr.addColorStop(1, "rgba(235,242,255,0.35)"); fg.fillStyle = fr; fg.fillRect(0, 0, 256, 256);
    const frost = basic({ map: tex(fc), transparent: true, depthWrite: false });
    for (const [px, py] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const fm = new THREE.Mesh(new THREE.PlaneGeometry(Wn.w / 2, wh / 2), frost); fm.position.set(cx + px * Wn.w / 4, cy + py * wh / 4, BZ - T / 2 + 0.03); fm.renderOrder = 1; set.add(fm); }
    ticks.push((t, k) => { frost.opacity = 1 - 0.75 * k.dark; });
    // the cool window light: a soft blue glow round it and a pale patch on the floor below (both go down with the dark)
    const g1 = glow(set, "#8fb0ff", 2.4, cx, cy, BZ + 0.05, 0.1);
    const patch = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0), basic({ color: "#7894dc", transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending }));
    patch.rotation.x = -Math.PI / 2; patch.position.set(cx + 0.2, 0.007, BZ + 0.8); patch.renderOrder = 1; set.add(patch);
    winLight.push([g1, 0.1], [patch, 0.18]);
    // curtains: deep red, gathered, tied back, on a dark rod
    cyl(set, 0.018, 0.018, Wn.w + 0.8, std("#3a2416", { roughness: 0.4 }), cx, Wn.y1 + 0.16, BZ + 0.1).rotation.z = Math.PI / 2;
    const cm = std("#8e2420", { roughness: 0.9 });
    for (const s of [-1, 1]) {
      const pts = []; for (let i = 0; i <= 12; i++) { const v = i / 12; pts.push(new THREE.Vector2(0.12 + 0.06 * Math.sin(v * Math.PI) - (v > 0.55 && v < 0.75 ? 0.05 : 0), (1 - v) * (Wn.y1 + 0.16))); }
      const cu = new THREE.Mesh(new THREE.LatheGeometry(pts, 14), cm); cu.scale.set(1, 1, 0.45); cu.position.set(cx + s * (Wn.w / 2 + 0.18), 0, BZ + 0.14); cu.castShadow = true; set.add(cu);
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.018, 6, 18), std("#d9a441", { roughness: 0.4, metalness: 0.4 })); tie.rotation.x = Math.PI / 2; tie.scale.set(1, 0.5, 1); tie.position.set(cx + s * (Wn.w / 2 + 0.18), (Wn.y1 + 0.16) * 0.35, BZ + 0.14); set.add(tie);
    }
  }

  // ---- the hearth, back right: a stone chimney breast floor to ceiling with an arched opening, a raised step, the
  // mantel beam with five candles, logs on a grate
  const Hh = P.hearth, hx = Hh.x, fz = BZ + Hh.d, ow = Hh.open.w, oh = Hh.open.h, sh = Hh.step.h;
  const fireO = [], fireP = { emb: null, small: [], col: [], glow: null, flash: null, warm: null };
  { const st = tex(stoneTex(rnd)); st.wrapS = st.wrapT = THREE.RepeatWrapping; st.repeat.set(1 / 1.1, 1 / 1.1);
    const stone = flat("#ffffff", { map: st, roughness: 0.95 });
    // the breast: a shape with the arch cut up from the step, extruded out from the back wall (UVs in metres)
    const s = new THREE.Shape(), hw = Hh.w / 2, r = ow / 2, spring = sh + oh - r;
    s.moveTo(-hw, 0); s.lineTo(-r, 0); s.lineTo(-r, spring); s.absarc(0, spring, r, Math.PI, 0, true); s.lineTo(r, 0); s.lineTo(hw, 0); s.lineTo(hw, H); s.lineTo(-hw, H); s.lineTo(-hw, 0);
    const br = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: Hh.d, bevelEnabled: false, curveSegments: 24 }), stone);
    br.position.set(hx, 0, BZ); br.castShadow = true; br.receiveShadow = true; br.name = "snowcottage-breast"; set.add(br);
    // the sooty firebox: a dark back and floor inside the arch
    const fb = new THREE.Shape(); fb.moveTo(-r, sh); fb.lineTo(-r, spring); fb.absarc(0, spring, r, Math.PI, 0, true); fb.lineTo(r, sh); fb.lineTo(-r, sh);
    const back = new THREE.Mesh(new THREE.ShapeGeometry(fb, 24), flat("#1a110c")); back.position.set(hx, 0, BZ + 0.06); set.add(back);
    // the arch's keystone ring: a band of bigger, lighter stones round the opening
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 0.06, 0.07, 6, 24, Math.PI), flat("#9a948c", { roughness: 0.95 }));
    ring.scale.set(1, 1, 0.4); ring.position.set(hx, spring, fz + 0.005); set.add(ring);
    for (const sx of [-1, 1]) box(set, 0.13, spring - sh, 0.04, flat("#9a948c", { roughness: 0.95 }), hx + sx * (r + 0.06), sh + (spring - sh) / 2, fz + 0.01);
    // the raised hearth step: stone slabs 0.12 m high reaching out from the breast
    const sd = Hh.step.d + Hh.d - 0.06;
    const slab = flat("#8a847c", { roughness: 0.95 });
    box(set, Hh.step.w, sh, sd, slab, hx, sh / 2, BZ + 0.06 + sd / 2, true);
    for (let i = 0; i < 4; i++) box(set, 0.012, 0.004, Hh.step.d, flat("#4a443e"), hx - Hh.step.w / 2 + Hh.step.w * (i + 1) / 5, sh + 0.001, fz + Hh.step.d / 2);
    // the mantel: a dark wood beam centred at 1.55 m, on two stone corbels
    const my = Hh.mantel, mb = 0.12, md = 0.26, mtop = my + mb / 2;
    box(set, Hh.w + 0.2, mb, md, std("#3a2214", { roughness: 0.55 }), hx, my, fz + md / 2, true);
    for (const sx of [-1, 1]) box(set, 0.12, 0.16, 0.14, stone, hx + sx * (hw - 0.2), my - mb / 2 - 0.08, fz + 0.07);
    // five candles on the mantel (wax lit by the room; the flame and its glow shine and follow "candles")
    const cmat = std("#f1e6cc", { roughness: 0.6 });
    for (const [dx, h, dz, ph] of [[-0.74, 0.22, 0.12, 0.3], [-0.6, 0.14, 0.16, 1.7], [-0.47, 0.18, 0.1, 2.9], [0.1, 0.2, 0.13, 4.1], [0.24, 0.13, 0.15, 5.3]]) {
      const x = hx + dx, z = fz + dz;
      cyl(set, 0.028, 0.031, h, cmat, x, mtop + h / 2, z, 14);
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), basic({ color: "#ffd27a", transparent: true, depthWrite: false }));
      fl.position.set(x, mtop + h + 0.034, z); fl.renderOrder = 902; set.add(fl);
      const gl = glow(set, "#ffb55a", 0.26, x, mtop + h + 0.04, z + 0.01, 0.6); gl.renderOrder = 903;
      ticks.push((t, k) => { const c = k.candles, f = flick(t, ph); fl.visible = gl.visible = c > 0.01; fl.scale.set(c, 2.1 * c * (0.9 + 0.5 * (f - 1)), c); gl.material.opacity = 0.6 * c * f; });
    }
    // the grate, the logs on it and the ashes under them
    const iron = std("#24201e", { roughness: 0.5, metalness: 0.4 }), gz = BZ + 0.24;
    for (const dx of [-0.3, 0.3]) box(set, 0.03, 0.1, 0.3, iron, hx + dx, sh + 0.05, gz);
    for (const dz of [-0.09, 0, 0.09]) box(set, 0.66, 0.02, 0.02, iron, hx, sh + 0.1, gz + dz);
    const ash = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 8), flat("#5e5650", { roughness: 1 })); ash.scale.set(1.3, 0.08, 0.55); ash.position.set(hx, sh, gz); set.add(ash);
    const logM = std("#4a2a18", { roughness: 0.9 }), endM = std("#b88a58", { roughness: 0.9 });
    for (const [dx, y, ry, rl] of [[-0.1, 0.17, 0.25, 0.062], [0.12, 0.17, -0.3, 0.058], [0.0, 0.27, 0.05, 0.055]]) {
      const lg = cyl(set, rl, rl, 0.52, logM, hx + dx, sh + y - 0.04, gz, 12); lg.rotation.set(0, ry, Math.PI / 2); lg.material = [logM, endM, endM];
    }
    // the embers: one glowing crumb on the logs, and its faint glow
    const emb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.03, 0), basic({ color: "#ff7a2a", transparent: true, depthWrite: false }));
    emb.position.set(hx + 0.06, sh + 0.2, gz + 0.12); emb.renderOrder = 904; set.add(emb); fireP.emb = emb;
    const eg = glow(set, "#ff6a20", 0.45, hx + 0.06, sh + 0.2, gz + 0.16, 0.5); eg.renderOrder = 905; fireP.embGlow = eg;
    // the cosy fire (three drawings, swapped 8 times a second) and the flare's column (three more)
    const fr = rng((S.seed || 7) * 31 + 5);
    const mk = (w, h, cw, ch, n, tall, x, y, z) => {
      const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2, 0);
      return [0, 1, 2].map(() => { const m = new THREE.Mesh(geo, basic({ map: tex(flameTex(fr, cw, ch, n, tall)), transparent: true, depthWrite: false })); m.position.set(x, y, z); m.renderOrder = 906; m.visible = false; set.add(m); return m; });
    };
    fireP.small = mk(0.95, 0.8, 256, 256, 6, false, hx, sh + 0.06, gz + 0.06);
    fireP.col = mk(1.5, 2.05, 256, 384, 7, true, hx, sh - 0.02, fz + 0.32);   // in front of the mantel
    fireP.glow = glow(set, "#ff9a3a", 1.9, hx, sh + 0.45, fz + 0.25, 0.5); fireP.glow.renderOrder = 907;
    fireP.flash = glow(set, "#ff8a30", 6.5, hx - 0.3, 1.3, fz + 0.9, 0); fireP.flash.renderOrder = 908;
    fireP.warm = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.0), basic({ color: "#ff9a4a", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    fireP.warm.rotation.x = -Math.PI / 2; fireP.warm.position.set(hx - 0.2, 0.008, fz + 1.0); fireP.warm.renderOrder = 909; set.add(fireP.warm);
    fireO.push(fireP);
  }

  // ---- the plank door in the left wall: five planks, two battens and a brace inside, iron strap hinges and a latch;
  // it swings into the room round its hinge side. A drift of snow along its foot (the snow that came in under it).
  { const wood = std("#7a4a2c", { roughness: 0.85 }), wood2 = std("#6a3e24", { roughness: 0.85 }), iron = std("#26221f", { roughness: 0.45, metalness: 0.5 });
    const piv = new THREE.Group(); piv.position.set(L - 0.025, 0, D.hinge); set.add(piv); piv.name = "snowcottage-door";
    const y0 = D.drift, h = D.h - y0, n = 5, pw = D.w / n;
    for (let i = 0; i < n; i++) box(piv, 0.045, h, pw - 0.006, i % 2 ? wood2 : wood, 0, y0 + h / 2, pw * (i + 0.5), true);
    for (const yy of [0.4, 1.6]) box(piv, 0.03, 0.14, D.w - 0.08, wood2, 0.037, yy, D.w / 2);   // the battens, inside
    { const len = Math.hypot(1.2, D.w - 0.16), b = box(piv, 0.03, 0.12, len, wood2, 0.037, 1.0, D.w / 2); b.rotation.x = Math.atan2(1.2, D.w - 0.16); }   // the brace
    for (const yy of [0.4, 1.6]) { box(piv, 0.012, 0.05, 0.62, iron, 0.058, yy, 0.31); const nb = cyl(piv, 0.03, 0.03, 0.012, iron, 0.06, yy, 0.6, 10); nb.rotation.z = Math.PI / 2; }   // strap hinges
    box(piv, 0.05, 0.16, 0.05, iron, 0.02, 1.6, 0.0); box(piv, 0.05, 0.16, 0.05, iron, 0.02, 0.4, 0.0);   // the hinge knuckles
    box(piv, 0.014, 0.04, 0.3, iron, 0.06, 1.0, D.w - 0.2);   // the latch bar
    { const hd = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 6, 14, Math.PI), iron); hd.rotation.set(0, Math.PI / 2, -Math.PI / 2); hd.position.set(0.07, 0.86, D.w - 0.14); piv.add(hd); }
    box(set, 0.05, 0.08, 0.06, iron, L + 0.03, 1.0, D.z + D.w / 2 + 0.06);   // the keeper on the frame
    // the casing round the opening, inside
    for (const z of [dz0 - 0.07, dz1 + 0.07]) box(set, 0.03, D.h + 0.1, 0.1, wood2, L + 0.015, (D.h + 0.1) / 2, z);
    box(set, 0.03, 0.1, D.w + 0.24, wood2, L + 0.015, D.h + 0.05, D.z);
    ticks.push((t, k) => { piv.rotation.y = (P.door.open * Math.PI / 180) * clamp01(k.door); });
    // the drift: a low white ridge along the door's foot, inside
    const dg = new THREE.CapsuleGeometry(0.1, D.w - 0.1, 4, 12); dg.rotateX(Math.PI / 2);
    const dr = new THREE.Mesh(dg, std("#eef3ff", { roughness: 1 })); dr.scale.set(1.4, D.drift / 0.1, 1); dr.position.set(L + 0.1, 0, D.z); dr.receiveShadow = true; set.add(dr);
  }

  // ---- outside: `world: true` builds the snowy mountain round the cottage (set-snowslope.js, the same `dark` keys);
  // without it, a plain sky and snow card behind the door for benches
  if (S.world) buildSnowWorld(scene, { seed: S.seed, dark: S.dark });
  const outside = S.outside !== false && !S.world ? (() => {
    const g = new THREE.Group(); g.name = "snowcottage-outside"; set.add(g);
    const [c, cg] = canvas(64, 256); const gr = cg.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#5b8fe0"); gr.addColorStop(0.75, "#bcd6f6"); gr.addColorStop(1, "#eef4ff"); cg.fillStyle = gr; cg.fillRect(0, 0, 64, 256);
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(30, 14), basic({ map: tex(c) })); sky.rotation.y = Math.PI / 2; sky.position.set(L - 9, 5, D.z); g.add(sky);
    const sn = new THREE.Mesh(new THREE.PlaneGeometry(9, 30), basic({ color: "#eef3ff" })); sn.rotation.x = -Math.PI / 2; sn.position.set(L - 4.6, 0.02, D.z); g.add(sn);
    return [sky.material, sn.material];
  })() : [];

  // ---- night: a cool multiply over the whole opaque picture (cast included), drawn before the fire, candles and glows
  const nightM = new THREE.MeshBasicMaterial({ color: "#ffffff", side: THREE.BackSide, depthTest: false, depthWrite: false, transparent: true, opacity: 0.9, fog: false, toneMapped: false,
    blending: THREE.CustomBlending, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor });
  nightM.userData.noOutline = true; nightM.userData.outlineParameters = { visible: false };
  const nightS = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), nightM);   // r 6: every inside camera sits in it, the ride cameras outside never see it nightS.position.set(0, 1.5, 0.6); nightS.renderOrder = 900; nightS.frustumCulled = false; nightS.userData.lookOnly = true; nightS.visible = false; nightS.name = "snowcottage-night"; set.add(nightS);

  // the flare's flash: a warm screen over the whole picture (room and faces), drawn before the flames
  const flashM = new THREE.MeshBasicMaterial({ color: "#000000", side: THREE.BackSide, depthTest: false, depthWrite: false, transparent: true, opacity: 0.9, fog: false, toneMapped: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneMinusDstColorFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor });
  flashM.userData.noOutline = true; flashM.userData.outlineParameters = { visible: false };
  const flashS = new THREE.Mesh(nightS.geometry, flashM); flashS.position.copy(nightS.position); flashS.renderOrder = 901; flashS.frustumCulled = false; flashS.userData.lookOnly = true; flashS.visible = false; flashS.name = "snowcottage-flash"; set.add(flashS);
  const FLASH = new THREE.Color(0.1, 0.04, 0.0);

  // the fire's light for the looks that light with lights (anime-pro uses FIRE_U)
  const pl = new THREE.PointLight("#ff9a3c", 0, 7, 2); pl.position.set(hx, 0.6, fz + 0.4); set.add(pl);

  // the room's own colours, kept once per mesh (the look may swap a mesh's material for its toon twin: the twin gets
  // the same tint from the same base, so any frame in any order draws the same)
  const tinted = [];
  set.traverse((o) => {
    if (!o.isMesh || o === nightS || o === flashS) return;
    const ms = [].concat(o.material);
    if (ms.some((m) => m.isMeshBasicMaterial || m.isShaderMaterial)) return;
    tinted.push([o, ms.map((m) => m.color.clone())]);
  });
  const tint = new THREE.Color(), tmp = new THREE.Color(), NIGHT = new THREE.Color(0.12, 0.14, 0.26), WARM = new THREE.Color(1.0, 0.5, 0.2), CAST = new THREE.Color(0.62, 0.66, 0.85);
  const cFire = new THREE.Color("#ff9a3c"), cFlare = new THREE.Color("#ff7a26"), cCandle = new THREE.Color("#ffb866");
  const firePos = new THREE.Vector3(hx, sh + 0.35, fz + 0.15), candlePos = new THREE.Vector3(hx, Hh.mantel + 0.3, fz + 0.2);
  (globalThis.__setTicks ||= []).push((t) => {
    const k = { fire: keyAt(S.fire, t, 1), candles: keyAt(S.candles, t, 1), snow: keyAt(S.snowWindow, t, 0.8), door: keyAt(S.door, t, 0), dark: clamp01(keyAt(S.dark, t, 0)) };
    const lv = Math.max(0, k.fire), f = flick(t, 0.6), d = k.dark, flare = clamp01(lv - 1), cosy = clamp01((lv - 0.25) / 0.75), c = clamp01(k.candles);
    for (const fn of ticks) fn(t, k);
    // the fire
    const F = fireO[0], frame = Math.floor(t * 8 + 1e-6) % 3;
    F.emb.visible = F.embGlow.visible = lv > 0.02 && cosy < 0.95;
    F.emb.material.opacity = clamp01(lv * 4) * (0.85 + 0.15 * (f - 1) * 4); F.embGlow.material.opacity = 0.45 * clamp01(lv * 4) * f * (1 - cosy);
    F.small.forEach((m, i) => { m.visible = i === frame && cosy > 0.01; m.scale.set(0.75 + 0.25 * cosy, cosy * f, 1); });
    F.col.forEach((m, i) => { m.visible = i === frame && flare > 0.01; m.scale.set(0.8 + 0.2 * flare, Math.pow(flare, 0.7) * (0.96 + 0.5 * (f - 1)), 1); });
    F.glow.material.opacity = (0.5 * cosy + 0.5 * flare) * f;
    F.flash.material.opacity = 0.42 * flare * f;
    F.warm.material.opacity = (0.1 * cosy + 0.22 * flare) * f;
    // the window's light goes down with the dark
    for (const [m, o] of winLight) m.material.opacity = o * (1 - d);
    for (const m of outside) m.color.setRGB(1 - 0.78 * d, 1 - 0.72 * d, 1 - 0.5 * d);
    // the room: the night's blue-grey, plus the fire's warmth (the flare floods it orange) and the candles' at night
    const warm = ((0.1 * cosy + 0.03 * clamp01(lv * 4)) * (0.4 + 0.6 * d) + 0.45 * flare) * f + 0.05 * c * d;
    tint.setRGB(1 + (NIGHT.r - 1) * d, 1 + (NIGHT.g - 1) * d, 1 + (NIGHT.b - 1) * d);
    tint.r += WARM.r * warm; tint.g += WARM.g * warm; tint.b += WARM.b * warm;
    for (const [o, base] of tinted) { const ms = [].concat(o.material); ms.forEach((m, i) => { if (m.color && base[i]) m.color.copy(base[i]).multiply(tint); }); }
    // the cast at night: a little cooler and darker (the fire and candles light the planes turned to them)
    nightS.visible = d > 0.002; nightM.color.setRGB(1 + (CAST.r - 1) * d, 1 + (CAST.g - 1) * d, 1 + (CAST.b - 1) * d);
    flashS.visible = flare > 0.002; flashM.color.copy(FLASH).multiplyScalar(flare * f);
    // the fire's light: the young flames, plus the candles (their share grows at night); one light for the look
    const kf = (0.35 * clamp01(lv * 4) * (1 - cosy) + 1.3 * cosy + 5.5 * flare) * f, kc = c * (0.25 + 0.75 * d) * 0.9;
    const K = kf + kc;
    FIRE_U.uFireK.value = K;
    if (K > 0) {
      FIRE_U.uFirePos.value.copy(firePos).multiplyScalar(kf / K).addScaledVector(candlePos, kc / K);
      FIRE_U.uFirePos.value.y += 0.6 * flare * (kf / K);
      tmp.copy(cFire).lerp(cFlare, flare); FIRE_U.uFireCol.value.copy(tmp).lerp(cCandle, kc / K);
    }
    pl.intensity = (3 * cosy + 14 * flare) * f + 0.6 * clamp01(lv * 4) * (1 - cosy) + 0.8 * c * d;
  });
  return set;
}
