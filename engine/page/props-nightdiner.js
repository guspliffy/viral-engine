import * as THREE from "three";
import { clamp, lerp } from "./util.js";
import { noteTexture } from "./props-money.js";

// "Your broke friend can copy money. There's a catch." (There's a catch, episode 4, 10 Nov 2026): the night ending (v2
// panel 08, the hard cut after the twist): the same diner, dead and shut in the snow, and the friend who had every dollar
// in the city burning bundles of his banknotes in an oil barrel to keep warm. Cold blue night, one warm fire.
// Metres, origin on the ground, the street side is +z, every param 0..1 unless said. Params arrive as prop tweens (`set`):
// propState (props3d.js) has a default for fire (0), glow and feed (spec.glow, spec.feed) but none for clock and flicker,
// which read spec.<name> until a tween sets it, and the first tween of such a key JUMPS: seed fire / clock / flicker with
// a dur-0 `set` at time 0 (spec.fire is NOT read: fire starts at 0). The prop's own `scale` scales all of it. All unlit or
// lightly lit and deterministic: every frame is a pure function of the params (no random numbers, no clock).
//   dinerfront  the diner's street front at night, a backdrop for a 9:16 frame from a camera 6 to 8 m in front of it
//               (cams at 9.7 m with fov 48 fit too). Spec: w 9 (the wall, roof, cornice and pavement width; the windows,
//               door and sign stand at fixed x for w 9), d 9 (the snow pavement's depth toward +z). Origin: the wall's
//               front face on the ground at its middle, x 0, z 0 (the wall is 0.3 deep behind it, 3.3 tall).
//               - a low red wall #7a2a2a with a chrome band along its bottom (y 0..0.09) and its top (y 0.77..0.84), four
//                 tall dark windows (red frames, 2 x 3 panes, near-black glass with a faint cold reflection and the dim
//                 shapes of stools and a lamp inside) at x -3.5, -1.95, -0.4, 1.15 (1.25 wide, y 0.9..2.85), one pane
//                 with a paper notice "CLOSED" hanging askew (window 3, x -0.4), a double glass door at x 2.6 (1.3 wide,
//                 y 0.12..2.87) with a chain and a padlock across its two push bars, on a snow-capped step (z 0..0.5);
//               - a flat roof edge (y 3.34..3.42) with a rounded chrome cornice (y 3.27) and, standing on it at x -1.0, the
//                 dead diner sign: a rounded board 1.6 x 1.0 (y 3.64..4.64, 0.1 deep) with a brown cowboy hat with a
//                 green sprout on a cream face gone grey-blue, a dark unlit neon border and one letter-less bulb row;
//               - snow 6..10 cm on the roof edge, the sign's top, every window sill and the door step, icicles under the
//                 cornice (0.08..0.38 long), drifts against the wall, a snow pavement (spec.w x spec.d, y 0) with darker
//                 footprints from x +3 (z 0.8) to the barrel spot x 0, z 2.4 and a tramped patch there (a soft shadow of
//                 whatever stands on it lands on it);
//               - behind: a night sky card 14 x 10 (z -6, y 0..10, #0e1630 above to #1b2748 low, 45 dim stars, no
//                 moon), two dark building silhouettes (z -2) with three small warm lit windows, and one street lamp at
//                 x -3.4, z 1.0 (2.6 tall, its head 0.33 toward +x), lit: a soft warm cone and a glow disc on the snow.
//               Param flicker 0..1 (clock-free): the sign's neon border glows dull red with a halo and the bulbs warm
//               up a little; 0 is dead. Solid for the checks: only the wall (everything else userData.solid false).
//   oilbarrel   a 200-litre steel drum, r 0.29 (rim 0.30), 0.86 tall, origin: the middle of its bottom on the ground;
//               dented, rust-brown #6b4a3a with two rolled hoops (y 0.29, 0.57), a faded stripe and eight punched
//               holes near the top (y 0.69..0.81) that glow orange, an open top with a bed of nine burning banknote
//               bundles (0.2 x 0.09 x 0.055, green notes, cream bands, charred black at the edges, from the money
//               pack's note) rising to y 1.0, over the rim (0.86). Params:
//               fire 0..1 (propState default 0): flame height: at 1 nine cel-style flame tongues (billboards: yellow
//                 core #ffe27a, orange #ff9a3d, red tips #e2502e) with the tallest 0.55 above the rim (y 1.41); it also
//                 lights the holes, the inside wall, the ember bed and the rising embers (20 of them, up to 1.4 m above
//                 the rim, 3 s each) and seven burnt note scraps tumbling up (5 s each);
//               clock (seconds, default 0): everything moves with it (sway, flicker, embers, scraps): tween it 1:1 with
//                 the clip time or slower for slow motion;
//               feed 0..1 (default spec.feed 0): the flare for a bundle going in: the flames jump 40 % higher and wider,
//                 20 bright sparks rise (their size follows feed: tween it up fast and down slower);
//               glow 0..1 (default spec.glow 0): the warm light: an additive pool on the ground r 1.6, a warm aura
//                 sprite r 1.6 round the fire (additive, brightens what stands behind it) and a warm point light
//                 (reach 3.6 m) on what stands within 1.5 m.
//               Solid for the checks: the drum and what is in it; flames, glows, sparks, embers and scraps are
//               see-through (userData.steam).
export const NIGHTDINER = {
  wall: { w: 9, h: 3.3, d: 0.3 }, pave: { d: 9 }, spot: [0, 2.4],
  window: { xs: [-3.5, -1.95, -0.4, 1.15], w: 1.25, y0: 0.9, y1: 2.85 }, door: { x: 2.6, w: 1.3 },
  sign: { x: -1.0, w: 1.6, h: 1.0, y0: 3.64 }, lamp: { x: -3.4, z: 1.0, h: 2.6 },
  barrel: { r: 0.29, h: 0.86, flame: 0.55 },
};
export const NIGHTDINER_GRIPS = {};

const hs = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const frac = (x) => x - Math.floor(x);

// ------------------------------------------------------------------------------------------------ small things
const cvs = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; };
const tex = (c, repeat) => {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
};
// an unlit material with no ink line
const bas = (o = {}) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; return m; };
const addm = (map, color = "#ffffff", opacity = 1) => bas({ map, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });
function put(parent, geo, m, x = 0, y = 0, z = 0, solid = false) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = false; o.userData.solid = solid; parent.add(o); return o;
}
const box = (parent, w, h, d, m, x, y, z, solid = false) => put(parent, new THREE.BoxGeometry(w, h, d), m, x, y, z, solid);
// see-through for the checks, drawn after the solid things (glows, flames, sparks, embers)
const glowy = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
const radial = (stops, size = 128) => tex(cvs(size, size, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}));
const WARM = [[0, "rgba(255,206,120,1)"], [0.22, "rgba(255,160,70,0.6)"], [0.55, "rgba(255,118,40,0.18)"], [1, "rgba(255,100,30,0)"]];
const DOT = [[0, "rgba(255,246,206,1)"], [0.35, "rgba(255,176,74,0.95)"], [0.7, "rgba(255,112,40,0.35)"], [1, "rgba(255,90,30,0)"]];
const sprite = (parent, map, opacity, order = 6) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, opacity }));
  s.material.userData.noOutline = true; glowy(s, order); parent.add(s); return s;
};

// lying snow: a squashed ball, light on top and blue-grey on its flanks (vertex colours), half sunk into what it lies on
const SNOW_TOP = new THREE.Color("#d3ddee"), SNOW_SIDE = new THREE.Color("#8896b2"), tmpC = new THREE.Color();
function snowGeo(rx, ry, rz, seg = 14) {
  const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.6)), n = g.attributes.normal, col = new Float32Array(n.count * 3);
  for (let i = 0; i < n.count; i++) { tmpC.copy(SNOW_SIDE).lerp(SNOW_TOP, clamp(n.getY(i) * 0.5 + 0.5) ** 1.3); col.set([tmpC.r, tmpC.g, tmpC.b], i * 3); }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.scale(rx, ry, rz); return g;
}
// a ridge of snow along x: lumps 6..10 cm high (h is the mean), depth d (z), its surface at y
function snowStrip(parent, snowM, x0, x1, y, z, h, d, seed) {
  const n = Math.max(1, Math.ceil((x1 - x0) / 0.42));
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1), x = lerp(x0, x1, t), k = hs(i, seed);
    put(parent, snowGeo(Math.max(0.2, ((x1 - x0) / n) * (0.75 + 0.35 * hs(i, seed + 5))), h * (0.8 + 0.4 * k), (d / 2) * (0.88 + 0.12 * hs(i, seed + 9))), snowM, x, y, z + (hs(i, seed + 3) - 0.5) * d * 0.08);
  }
}
const rrShape = (w, h, r) => {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
};
function rrPoints(w, h, r, n = 8) {
  const pts = [], hw = w / 2 - r, hh = h / 2 - r;
  for (const [cx, cy, a0] of [[hw, hh, 0], [-hw, hh, Math.PI / 2], [-hw, -hh, Math.PI], [hw, -hh, Math.PI * 1.5]]) {
    for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * (Math.PI / 2); pts.push(new THREE.Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0)); }
  }
  return pts;
}

// ------------------------------------------------------------------------------------------------ dinerfront canvases
// the chrome: a gradient round a cylinder (along u) or down a flat band (along v)
const chromeRound = () => tex(cvs(64, 8, (g, w) => {
  const gr = g.createLinearGradient(0, 0, w, 0);
  [[0, "#3b4254"], [0.16, "#a9b1c1"], [0.3, "#c4cbd8"], [0.48, "#8b93a3"], [0.72, "#566073"], [0.86, "#9aa2b3"], [1, "#3b4254"]].forEach(([o, c]) => gr.addColorStop(o, c));
  g.fillStyle = gr; g.fillRect(0, 0, w, 8);
}));
const chromeFlat = () => tex(cvs(8, 64, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  [[0, "#6a7285"], [0.16, "#b4bccb"], [0.4, "#8b93a3"], [0.7, "#566073"], [0.9, "#7d869a"], [1, "#3f4658"]].forEach(([o, c]) => gr.addColorStop(o, c));
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}));
// the red wall, 2 m x 1 m tile: panel seams, grime streaks, wet dirt along the bottom
const wallTex = (w, h) => tex(cvs(512, 256, (g, W, H) => {
  g.fillStyle = "#7a2a2a"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) { const x = hs(i, 1) * W; g.fillStyle = `rgba(${hs(i, 2) < 0.5 ? "30,8,10" : "170,80,80"},${0.05 + 0.07 * hs(i, 3)})`; g.fillRect(x, 0, 2 + hs(i, 4) * 9, H * (0.35 + 0.65 * hs(i, 5))); }
  for (let y = 64; y < H; y += 64) { g.fillStyle = "rgba(40,10,12,0.5)"; g.fillRect(0, y, W, 3); g.fillStyle = "rgba(160,70,70,0.22)"; g.fillRect(0, y + 3, W, 2); }
  const gr = g.createLinearGradient(0, H * 0.7, 0, H); gr.addColorStop(0, "rgba(20,8,10,0)"); gr.addColorStop(1, "rgba(20,8,10,0.28)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
}), [w / 2, h / 1]);
// a pane of black glass: a faint cold reflection and the dim shapes of stools and a lamp inside
const glassTex = (seed) => tex(cvs(256, 400, (g, W, H) => {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#141a2a"); gr.addColorStop(1, "#0c1019"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = "#171c2c"; g.beginPath(); g.arc(W * (0.3 + 0.4 * hs(seed, 1)), H * 0.1, 22, 0, Math.PI * 2); g.fill(); g.fillRect(W * (0.3 + 0.4 * hs(seed, 1)) - 1.5, 0, 3, H * 0.1);   // a pendant lamp
  for (let k = 0; k < 3; k++) { const x = W * (0.2 + 0.3 * k + 0.08 * hs(seed, k + 4)); g.fillStyle = "#1c141b"; g.beginPath(); g.ellipse(x, H * 0.8, 24, 8, 0, 0, Math.PI * 2); g.fill(); g.fillRect(x - 3, H * 0.8, 6, H * 0.14); g.fillRect(x - 16, H * 0.94, 32, 4); }   // stools
  g.fillStyle = "#151a26"; g.fillRect(0, H * 0.72, W, 5);   // the counter edge
  g.save(); g.fillStyle = "rgba(150,175,230,0.035)"; const o = 40 * hs(seed, 9);
  g.beginPath(); g.moveTo(W * 0.1 + o, 0); g.lineTo(W * 0.38 + o, 0); g.lineTo(W * 0.78 + o * 0.4, H); g.lineTo(W * 0.5 + o * 0.4, H); g.fill();
  g.fillStyle = "rgba(150,175,230,0.025)"; g.beginPath(); g.moveTo(W * 0.5 + o, 0); g.lineTo(W * 0.6 + o, 0); g.lineTo(W * 1.0, H * 0.78); g.lineTo(W * 0.9, H * 0.78); g.fill();
  const lg = g.createRadialGradient(W * 0.2, H * 0.18, 0, W * 0.2, H * 0.18, W * 0.6); lg.addColorStop(0, "rgba(130,160,230,0.06)"); lg.addColorStop(1, "rgba(130,160,230,0)"); g.fillStyle = lg; g.fillRect(0, 0, W, H);
  const fr = g.createRadialGradient(W, H, 0, W, H, W * 0.7); fr.addColorStop(0, "rgba(190,210,240,0.12)"); fr.addColorStop(1, "rgba(190,210,240,0)"); g.fillStyle = fr; g.fillRect(0, 0, W, H);   // frost in the corner
  g.restore();
}));
const noticeTex = () => tex(cvs(192, 144, (g, W, H) => {
  g.fillStyle = "#b7b4a4"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(80,70,50,${0.04 + 0.05 * hs(i, 2)})`; g.fillRect(hs(i, 3) * W, hs(i, 4) * H, 4 + hs(i, 5) * 20, 2); }
  g.strokeStyle = "rgba(60,50,40,0.5)"; g.lineWidth = 3; g.strokeRect(2, 2, W - 4, H - 4);
  g.fillStyle = "#9c2a28"; g.font = "900 40px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("CLOSED", W / 2, 54);
  g.fillStyle = "rgba(50,45,40,0.7)"; for (const [y, w] of [[96, 120], [112, 96], [127, 110]]) g.fillRect((W - w) / 2, y, w, 5);
}));
// the sign's face: cream gone grey-blue, grime, the brown cowboy hat with a green sprout
const signTex = () => tex(cvs(640, 400, (g, W, H) => {
  g.beginPath(); g.roundRect(0, 0, W, H, 70); g.clip();
  const gr = g.createRadialGradient(W / 2, H * 0.45, 20, W / 2, H * 0.45, W * 0.62); gr.addColorStop(0, "#7f8ca8"); gr.addColorStop(1, "#58647f"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(30,36,60,${0.03 + 0.06 * hs(i, 1)})`; g.fillRect(hs(i, 2) * W, hs(i, 3) * H * 0.5, 2 + hs(i, 4) * 6, 40 + hs(i, 5) * 160); }
  const sag = g.createLinearGradient(0, H * 0.7, 0, H); sag.addColorStop(0, "rgba(20,26,44,0)"); sag.addColorStop(1, "rgba(20,26,44,0.35)"); g.fillStyle = sag; g.fillRect(0, 0, W, H);
  g.lineJoin = "round"; g.lineCap = "round"; g.lineWidth = 7; g.strokeStyle = "#231810";
  // the sprout
  g.strokeStyle = "#1e3a1e"; g.lineWidth = 15; g.beginPath(); g.moveTo(320, 112); g.quadraticCurveTo(318, 85, 324, 62); g.stroke();
  g.strokeStyle = "#3f6a39"; g.lineWidth = 9; g.beginPath(); g.moveTo(320, 112); g.quadraticCurveTo(318, 85, 324, 62); g.stroke();
  for (const s of [-1, 1]) { g.save(); g.translate(324, 62); g.rotate(s * 0.62); g.fillStyle = "#4b8444"; g.strokeStyle = "#1e3a1e"; g.lineWidth = 5; g.beginPath(); g.ellipse(s * 30, -4, 34, 15, 0, 0, Math.PI * 2); g.fill(); g.stroke(); g.restore(); }
  // the crown, with a pinch in its top
  g.fillStyle = "#5c3c29"; g.strokeStyle = "#231810"; g.lineWidth = 7;
  g.beginPath(); g.moveTo(214, 222); g.bezierCurveTo(206, 162, 220, 120, 252, 100); g.quadraticCurveTo(286, 86, 320, 112); g.quadraticCurveTo(354, 86, 388, 100); g.bezierCurveTo(420, 120, 434, 162, 426, 222); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "rgba(255,230,200,0.08)"; g.beginPath(); g.moveTo(236, 205); g.bezierCurveTo(232, 160, 244, 130, 262, 116); g.lineTo(276, 124); g.bezierCurveTo(262, 140, 252, 170, 256, 205); g.fill();
  // the band and a dull buckle
  g.fillStyle = "#2f1d14"; g.beginPath(); g.moveTo(213, 196); g.quadraticCurveTo(320, 214, 427, 196); g.lineTo(426, 222); g.quadraticCurveTo(320, 238, 214, 222); g.closePath(); g.fill();
  g.fillStyle = "#7f7048"; g.fillRect(306, 204, 30, 22); g.fillStyle = "#2f1d14"; g.fillRect(313, 210, 16, 10);
  // the wide brim, its ends curling up
  g.fillStyle = "#4b3022"; g.strokeStyle = "#231810"; g.lineWidth = 7;
  g.beginPath(); g.moveTo(104, 214); g.quadraticCurveTo(210, 276, 320, 276); g.quadraticCurveTo(430, 276, 536, 214); g.quadraticCurveTo(566, 196, 546, 172); g.quadraticCurveTo(512, 226, 320, 232); g.quadraticCurveTo(128, 226, 94, 172); g.quadraticCurveTo(74, 196, 104, 214); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "rgba(0,0,0,0.22)"; g.beginPath(); g.ellipse(320, 252, 190, 14, 0, 0, Math.PI); g.fill();
  // the socket line of the bulb row
  g.fillStyle = "rgba(15,20,34,0.55)"; g.fillRect(70, 332, 500, 6);
}));
const neonGlowTex = () => tex(cvs(320, 200, (g, W, H) => {
  g.shadowColor = "rgba(255,70,50,1)"; g.shadowBlur = 26; g.strokeStyle = "rgba(255,70,50,0.9)"; g.lineWidth = 9;
  g.beginPath(); g.roundRect(W / 2 - 122, H / 2 - 72, 244, 144, 30); g.stroke(); g.stroke();
}));
const skyTex = () => tex(cvs(1024, 732, (g, W, H) => {
  const gr = g.createLinearGradient(0, 0, 0, H);
  [[0, "#0e1630"], [0.55, "#121b38"], [1, "#1b2748"]].forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 45; i++) {
    const x = hs(i, 1) * W, y = (0.04 + 0.5 * hs(i, 2)) * H, r = 0.7 + 1.0 * hs(i, 3), a = 0.35 + 0.45 * hs(i, 4);
    g.fillStyle = `rgba(${200 + 40 * hs(i, 5)},${214 + 20 * hs(i, 5)},245,${a})`; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
}));
const bldgTex = () => tex(cvs(128, 256, (g, W, H) => {
  g.fillStyle = "#0b1022"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${hs(i, 1) < 0.5 ? "30,40,70" : "2,4,12"},${0.1 + 0.12 * hs(i, 2)})`; g.fillRect(hs(i, 3) * W, hs(i, 4) * H, 4 + hs(i, 5) * 22, 3 + hs(i, 6) * 8); }
  for (let y = 0; y < H; y += 32) { g.fillStyle = "rgba(30,40,70,0.22)"; g.fillRect(0, y, W, 2); }
}));
// the snow pavement, 160 px per metre: soft blue-white with blotches and speckle, a tramped patch at the barrel spot and
// darker boot prints leading from the door side to it. Canvas top = the wall (z 0), left = -x.
const paveTex = (w, d, spot) => tex(cvs(Math.round(w * 160), Math.round(d * 160), (g, W, H) => {
  const px = (x) => ((x + w / 2) / w) * W, pz = (z) => (z / d) * H, S = 160;
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#b6c5df"); gr.addColorStop(0.35, "#cfd9ea"); gr.addColorStop(1, "#c4d0e4"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const cols = ["rgba(232,239,250,0.35)", "rgba(160,176,206,0.3)", "rgba(190,203,226,0.4)"];
  for (let i = 0; i < 260; i++) {
    const x = hs(i, 1) * W, y = hs(i, 2) * H, r = 18 + 80 * hs(i, 3), b = g.createRadialGradient(x, y, 0, x, y, r), c = cols[i % 3];
    b.addColorStop(0, c); b.addColorStop(1, c.replace(/[\d.]+\)$/, "0)")); g.fillStyle = b; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 5200; i++) { g.fillStyle = hs(i, 6) < 0.5 ? "rgba(255,255,255,0.22)" : "rgba(110,128,166,0.18)"; const s = 1 + 1.6 * hs(i, 7); g.fillRect(hs(i, 4) * W, hs(i, 5) * H, s, s); }
  const vg = g.createLinearGradient(0, pz(3), 0, H); vg.addColorStop(0, "rgba(50,64,100,0)"); vg.addColorStop(1, "rgba(50,64,100,0.5)"); g.fillStyle = vg; g.fillRect(0, pz(3), W, H - pz(3));
  // the tramped patch where he has stood a while
  const [sx, sz] = spot, tr = g.createRadialGradient(px(sx), pz(sz), 0, px(sx), pz(sz), 0.95 * S);
  tr.addColorStop(0, "rgba(104,122,160,0.5)"); tr.addColorStop(0.6, "rgba(104,122,160,0.28)"); tr.addColorStop(1, "rgba(104,122,160,0)"); g.fillStyle = tr; g.fillRect(px(sx) - S, pz(sz) - S, 2 * S, 2 * S);
  // the boot prints, door side -> barrel: 0.4 m strides, left and right 0.1 m off the line
  const a = [3.0, 0.8], b = [sx + 0.5, sz - 0.12], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), n = Math.floor(L / 0.4), ang = Math.atan2(dz, dx);
  for (let i = 0; i <= n; i++) {
    const t = i / n, side = i % 2 ? 1 : -1, x = a[0] + dx * t - Math.sin(ang) * 0.1 * side, z = a[1] + dz * t + Math.cos(ang) * 0.1 * side;
    g.save(); g.translate(px(x), pz(z)); g.rotate(ang);
    g.fillStyle = "rgba(92,110,150,0.62)"; g.beginPath(); g.ellipse(0, 0, 0.145 * S, 0.055 * S, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(60,76,112,0.4)"; g.beginPath(); g.ellipse(-0.012 * S, 0.004 * S, 0.12 * S, 0.04 * S, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "rgba(236,243,252,0.55)"; g.lineWidth = 2; g.beginPath(); g.ellipse(0.006 * S, -0.008 * S, 0.15 * S, 0.06 * S, 0, Math.PI * 1.05, Math.PI * 1.85); g.stroke();
    g.restore();
  }
}));

// ------------------------------------------------------------------------------------------------ the oil barrel's canvases
const drumTex = () => tex(cvs(512, 512, (g, W, H) => {   // canvas top = the drum's top
  g.fillStyle = "#6b4a3a"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 170; i++) { const x = hs(i, 1) * W, y = hs(i, 2) * H, r = 10 + 46 * hs(i, 3), c = ["rgba(122,79,56,0.4)", "rgba(88,58,46,0.4)", "rgba(138,80,48,0.3)", "rgba(70,46,38,0.32)"][i % 4], b = g.createRadialGradient(x, y, 0, x, y, r); b.addColorStop(0, c); b.addColorStop(1, c.replace(/[\d.]+\)$/, "0)")); g.fillStyle = b; g.fillRect(x - r, y - r, r * 2, r * 2); }
  for (let i = 0; i < 46; i++) { g.fillStyle = `rgba(120,58,28,${0.18 + 0.2 * hs(i, 8)})`; g.fillRect(hs(i, 9) * W, hs(i, 10) * H * 0.7, 2 + 4 * hs(i, 11), 30 + 150 * hs(i, 12)); }   // rust runs
  g.fillStyle = "rgba(96,124,132,0.55)"; g.fillRect(0, H * 0.44, W, H * 0.12);       // the faded stripe
  for (let i = 0; i < 70; i++) { g.fillStyle = "rgba(107,74,58,0.85)"; g.fillRect(hs(i, 13) * W, H * 0.44 + (hs(i, 14) > 0.5 ? 0 : H * 0.12 - 6) + hs(i, 15) * 8 - 3, 8 + 30 * hs(i, 16), 4 + 6 * hs(i, 17)); g.fillStyle = "rgba(110,60,34,0.5)"; g.fillRect(hs(i, 18) * W, H * 0.44 + hs(i, 19) * H * 0.12, 5 + 14 * hs(i, 20), 3 + 5 * hs(i, 21)); }   // chips
  for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(200,160,128,${0.1 + 0.14 * hs(i, 22)})`; g.lineWidth = 1; const x = hs(i, 23) * W, y = hs(i, 24) * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (hs(i, 25) - 0.5) * 60, y + (hs(i, 26) - 0.5) * 12); g.stroke(); }
  const soot = g.createLinearGradient(0, 0, 0, H * 0.26); soot.addColorStop(0, "rgba(14,10,8,0.8)"); soot.addColorStop(1, "rgba(14,10,8,0)"); g.fillStyle = soot; g.fillRect(0, 0, W, H * 0.26);
  g.fillStyle = "rgba(30,20,16,0.6)"; g.fillRect(W * 0.04, 0, 3, H);   // the weld seam
}));
const innerTex = () => tex(cvs(4, 64, (g, W, H) => {
  const gr = g.createLinearGradient(0, 0, 0, H);   // top = the rim
  [[0, "#ff8a30"], [0.3, "#b8481a"], [0.6, "#5a2210"], [1, "#1a0c08"]].forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
}));
const bedTex = () => tex(cvs(128, 128, (g, W, H) => {
  g.fillStyle = "#2a120a"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { const x = hs(i, 1) * W, y = hs(i, 2) * H, r = 6 + 14 * hs(i, 3), b = g.createRadialGradient(x, y, 0, x, y, r); b.addColorStop(0, "rgba(255,150,50,0.9)"); b.addColorStop(1, "rgba(255,90,20,0)"); g.fillStyle = b; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
}));
// the face of a burning bundle: the money pack's note, charred black at the edges with ember cracks. kind: top | side | end
function bundleTex(kind, seed) {
  const W = kind === "end" ? 64 : 256, H = kind === "top" ? 128 : 48;
  return tex(cvs(W, H, (g) => {
    if (kind === "top") g.drawImage(noteTexture().image, 0, 0, W, H);
    else { for (let i = 0; i < 12; i++) { const t = hs(i, seed + 3); g.fillStyle = t < 0.45 ? "#e4e8d0" : t < 0.8 ? "#b9d0a0" : "#97bd7e"; g.fillRect(0, (i * H) / 12, W, H / 12 + 0.5); g.fillStyle = "rgba(40,90,40,0.3)"; g.fillRect(0, (i * H) / 12, W, 1); } }
    if (kind === "side") { g.fillStyle = "#ddd2b0"; g.fillRect(W * 0.38, 0, W * 0.24, H); g.fillStyle = "rgba(100,80,40,0.35)"; g.fillRect(W * 0.38, 0, 2, H); g.fillRect(W * 0.62 - 2, 0, 2, H); }
    for (const [x, y, r] of [[0, 0, 0.5], [W, 0, 0.45], [0, H, 0.45], [W, H, 0.55], [W / 2, 0, 0.3], [W / 2, H, 0.3], [0, H / 2, 0.25], [W, H / 2, 0.25]]) {   // charred corners and edges
      const rr = r * Math.min(W, H * 2) * (0.5 + 0.4 * hs(seed + x + y, 4)), b = g.createRadialGradient(x, y, 0, x, y, rr);
      b.addColorStop(0, "rgba(8,6,5,1)"); b.addColorStop(0.6, "rgba(18,12,10,0.9)"); b.addColorStop(1, "rgba(18,12,10,0)"); g.fillStyle = b; g.fillRect(0, 0, W, H);
    }
    g.strokeStyle = "rgba(255,140,50,0.9)"; g.lineWidth = 1.6;
    for (let i = 0; i < 4; i++) { const x = hs(seed + i, 5) * W, y = hs(seed + i, 6) * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (hs(seed + i, 7) - 0.5) * 40, y + (hs(seed + i, 8) - 0.5) * 20); g.stroke(); }
  }));
}

// ------------------------------------------------------------------------------------------------ flames: cel billboards
// one tongue on a camera-facing quad (uW x uH metres, its base at the origin): a teardrop with three hard bands, yellow
// core, orange, red tips, swaying and curling with the clock
function flameMat(seed) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSeed: { value: seed }, uW: { value: 0.3 }, uH: { value: 0.5 } },
    vertexShader: `uniform float uW, uH; varying vec2 vUv;
      void main() {
        vUv = uv; float s = length(modelMatrix[0].xyz);
        vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        c.xy += vec2((uv.x - 0.5) * uW, uv.y * uH) * s;
        gl_Position = projectionMatrix * c;
      }`,
    fragmentShader: `uniform float uTime, uSeed; varying vec2 vUv;
      float st(float e, float x) { float w = fwidth(x) * 0.8 + 0.004; return smoothstep(e - w, e + w, x); }
      void main() {
        float v = vUv.y, x = (vUv.x - 0.5) * 2.0;
        float sway = (sin(uTime * 7.0 + uSeed * 6.28 + v * 3.2) * 0.2 + sin(uTime * 11.3 + uSeed * 3.1 + v * 5.5) * 0.09) * v * v;
        x -= sway;
        float w = smoothstep(0.0, 0.2, v) * pow(max(1.0 - v, 0.0), 0.8) * 1.05;
        float d = abs(x) / max(w, 1e-3);
        if (d > 1.0 || v > 0.995) discard;
        float k = d * 0.75 + v * 0.55;
        vec3 col = mix(vec3(1.0, 0.84, 0.34), vec3(1.0, 0.5, 0.12), st(0.3, k));
        col = mix(col, vec3(0.8, 0.2, 0.1), st(0.62, k));
        gl_FragColor = vec4(col, 1.0);
      }`,
    transparent: true, depthWrite: false, opacity: 0.45,
  });
  m.userData.noOutline = true; m.userData.outlineParameters = { visible: false };
  return m;
}
// x, z, height share, width, sway speed
const TONGUES = [[0, -0.07, 1, 0.34, 6], [-0.1, -0.05, 0.78, 0.27, 7.3], [0.12, -0.09, 0.72, 0.26, 8.1], [-0.18, -0.11, 0.5, 0.21, 9.6], [0.19, -0.06, 0.46, 0.2, 10.4], [0.02, -0.02, 0.58, 0.23, 7.9], [-0.05, -0.17, 0.58, 0.22, 8.8], [0.0, -0.22, 0.34, 0.18, 11.2], [-0.13, 0.0, 0.3, 0.17, 10.1]];

// ------------------------------------------------------------------------------------------------ kinds
export const NIGHTDINER_KINDS = {
  dinerfront(P) {
    const W = P.spec.w ?? NIGHTDINER.wall.w, D = P.spec.d ?? NIGHTDINER.pave.d, H = NIGHTDINER.wall.h, g = P.whole;
    const redM = bas({ color: "#b4b4b4", map: wallTex(W, H) }), frameM = bas({ color: "#8c2f2f" }), roofM = bas({ color: "#5e2022" });
    const flatC = bas({ map: chromeFlat(), color: "#d8d8d8" }), roundC = bas({ map: chromeRound(), color: "#d8d8d8" });
    const snowM = bas({ vertexColors: true, color: "#939aae" }), iceM = bas({ color: "#9db9d8" }), ironM = bas({ color: "#222735" });
    const notOnWall = { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 };
    const SZ = NIGHTDINER;

    // ---- the wall (solid), its chrome bands, the cornice and the roof edge
    box(g, W, H, SZ.wall.d, redM, 0, H / 2, -SZ.wall.d / 2, true);
    box(g, W, 0.09, 0.03, flatC, 0, 0.045, 0.015); box(g, W, 0.07, 0.03, flatC, 0, 0.805, 0.015);
    box(g, W, 0.08, 0.04, flatC, 0, 3.1, 0.02);
    const cornice = put(g, new THREE.CylinderGeometry(0.075, 0.075, W + 0.2, 20), roundC, 0, 3.27, 0.05); cornice.rotation.z = Math.PI / 2;
    box(g, W + 0.2, 0.1, 0.42, roofM, 0, 3.37, -0.1);
    snowStrip(g, snowM, -W / 2 - 0.1, W / 2 + 0.1, 3.42, 0.0, 0.085, 0.46, 1);
    // icicles under the cornice
    for (let i = 0; i < 38; i++) {
      const L = 0.08 + 0.3 * hs(i, 2) ** 2, r = 0.014 + 0.014 * hs(i, 3), x = -W / 2 + 0.15 + ((W - 0.3) * (i + 0.5 * hs(i, 1))) / 38;
      const ic = put(g, new THREE.ConeGeometry(r, L, 6), iceM, x, 3.215 - L / 2, 0.1 + 0.03 * hs(i, 4)); ic.rotation.x = Math.PI;
    }

    // ---- the windows: red frames with mullions, near-black glass, snow on the sills
    SZ.window.xs.forEach((cx, wi) => {
      const ww = SZ.window.w, y0 = SZ.window.y0 + 0.02, y1 = SZ.window.y1, hh = y1 - y0, cy = (y0 + y1) / 2;
      put(g, new THREE.PlaneGeometry(ww - 0.1, hh - 0.1), bas({ map: glassTex(wi + 1), color: "#a8a8a8", ...notOnWall }), cx, cy, 0.02);
      box(g, 0.07, hh, 0.07, frameM, cx - ww / 2 + 0.035, cy, 0.035); box(g, 0.07, hh, 0.07, frameM, cx + ww / 2 - 0.035, cy, 0.035);
      box(g, ww, 0.08, 0.07, frameM, cx, y1 - 0.04, 0.035); box(g, ww, 0.08, 0.07, frameM, cx, y0 + 0.04, 0.035);
      box(g, 0.04, hh, 0.05, frameM, cx, cy, 0.03);
      for (const f of [1 / 3, 2 / 3]) box(g, ww, 0.035, 0.05, frameM, cx, y0 + hh * f, 0.03);
      box(g, ww + 0.16, 0.05, 0.17, roofM, cx, SZ.window.y0 - 0.005, 0.085);
      snowStrip(g, snowM, cx - ww / 2 - 0.05, cx + ww / 2 + 0.05, SZ.window.y0 + 0.02, 0.09, 0.07, 0.18, 10 + wi);
    });
    // the notice, hanging by one corner on the glass of window 3
    const cxN = SZ.window.xs[2] + 0.2, notice = put(g, new THREE.PlaneGeometry(0.34, 0.255), bas({ map: noticeTex(), color: "#8c8c8c", ...notOnWall }), cxN, 1.62, 0.035);
    notice.rotation.z = -0.3; put(g, new THREE.PlaneGeometry(0.1, 0.035), bas({ color: "#8a8368", transparent: true, opacity: 0.8 }), cxN - 0.09, 1.78, 0.04).rotation.z = 0.5;

    // ---- the door: double glass leaves in a red frame, push bars, a chain and a padlock, on a snow-capped step
    const dx = SZ.door.x, DW = SZ.door.w;
    box(g, 1.5, 0.12, 0.5, bas({ color: "#3f4354" }), dx, 0.06, 0.25);
    snowStrip(g, snowM, dx - 0.75, dx + 0.75, 0.12, 0.28, 0.07, 0.52, 20);
    for (const sx of [-1, 1]) {
      put(g, new THREE.PlaneGeometry(0.5, 1.82), bas({ map: glassTex(7 + sx), color: "#a8a8a8", ...notOnWall }), dx + sx * 0.28, 1.2, 0.02);
      box(g, 0.07, 2.75, 0.07, frameM, dx + sx * (DW / 2 - 0.035), 1.495, 0.035);
    }
    put(g, new THREE.PlaneGeometry(1.1, 0.6), bas({ map: glassTex(9), color: "#a8a8a8", ...notOnWall }), dx, 2.5, 0.02);
    box(g, 0.05, 2.03, 0.06, frameM, dx, 1.135, 0.03); box(g, DW, 0.08, 0.07, frameM, dx, 2.83, 0.035); box(g, DW, 0.08, 0.07, frameM, dx, 2.17, 0.035);
    box(g, DW, 0.16, 0.07, frameM, dx, 0.2, 0.035);
    const BX = [dx - 0.17, dx + 0.17];
    for (const x of BX) {
      put(g, new THREE.CylinderGeometry(0.017, 0.017, 0.55, 10), flatC.clone(), x, 1.13, 0.1);
      for (const y of [0.9, 1.36]) put(g, new THREE.CylinderGeometry(0.01, 0.01, 0.06, 6), flatC, x, y, 0.07).rotation.x = Math.PI / 2;
    }
    const linkG = new THREE.TorusGeometry(0.03, 0.0085, 6, 12), linkM = bas({ map: chromeRound(), color: "#b8b8b8" });
    const chain = (xa, xb, ya, sag, za) => {
      const n = 9;
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = lerp(xa, xb, t), y = ya - sag * 4 * t * (1 - t), l = put(g, linkG, linkM, x, y, za);
        l.scale.set(1.15, 0.7, 1); l.rotation.set(i % 2 ? Math.PI / 2 : 0, 0, -sag * 4 * (1 - 2 * t) * 0.5);
      }
    };
    chain(BX[0], BX[1], 1.2, 0.07, 0.135); chain(BX[0] - 0.02, BX[1] + 0.02, 1.08, 0.09, 0.14);
    for (let i = 0; i < 2; i++) { const l = put(g, linkG, linkM, dx, 1.0 - i * 0.045, 0.145); l.scale.set(1.0, 0.7, 1); l.rotation.y = i ? Math.PI / 2 : 0; }
    const brass = bas({ color: "#9a7a2c" });
    put(g, new THREE.TorusGeometry(0.03, 0.007, 6, 12, Math.PI), flatC, dx, 0.94, 0.15);
    box(g, 0.09, 0.1, 0.04, brass, dx, 0.87, 0.15); box(g, 0.02, 0.02, 0.005, ironM, dx, 0.87, 0.172);

    // ---- the dead diner sign on the roof
    const sx = SZ.sign.x, sw = SZ.sign.w, sh = SZ.sign.h, cy = SZ.sign.y0 + sh / 2;
    for (const k of [-1, 1]) box(g, 0.07, 0.26, 0.07, ironM, sx + k * 0.55, 3.55, -0.05);
    const body = put(g, new THREE.ExtrudeGeometry(rrShape(sw, sh, 0.22), { depth: 0.1, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 10 }), bas({ color: "#161b2c" }), sx, cy, -0.1);
    body.userData.solid = false;
    put(g, new THREE.PlaneGeometry(1.5, 0.9375), bas({ map: signTex(), color: "#8e8e8e", transparent: true, ...notOnWall }), sx, cy, 0.012).renderOrder = 1;
    const neonM = bas({ color: "#2b2230" });
    put(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rrPoints(1.46, 0.88, 0.19, 8), true, "centripetal"), 220, 0.02, 6, true), neonM, sx, cy, 0.03);
    const halo = glowy(put(g, new THREE.PlaneGeometry(1.9, 1.19), addm(neonGlowTex(), "#ffffff", 0), sx, cy, 0.05), 3);
    const bulbM = bas({ color: "#39456a" });
    for (let i = 0; i < 9; i++) { put(g, new THREE.SphereGeometry(0.03, 10, 8), bulbM, sx - 0.56 + i * 0.14, cy - 0.37, 0.05); }
    snowStrip(g, snowM, sx - sw / 2 + 0.1, sx + sw / 2 - 0.1, SZ.sign.y0 + sh - 0.01, -0.05, 0.08, 0.2, 30);

    // ---- the pavement: snow with prints, a soft shadow layer on it, drifts against the wall
    const pave = put(g, new THREE.PlaneGeometry(W, D), bas({ map: paveTex(W, D, SZ.spot), color: "#929eb8", polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), 0, 0.006, D / 2); pave.rotation.x = -Math.PI / 2;
    const sh2 = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.ShadowMaterial({ opacity: 0.4, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
    sh2.rotation.x = -Math.PI / 2; sh2.position.set(0, 0.01, D / 2); sh2.receiveShadow = true; sh2.userData.solid = false; sh2.material.userData.noOutline = true; g.add(sh2);
    for (let i = 0; i < 14; i++) {
      const x = -4.25 + i * 0.6 + 0.3 * hs(i, 2); if (x > 1.9 && x < 3.4) continue;
      put(g, snowGeo(0.5 + 0.35 * hs(i, 3), 0.1 + 0.14 * hs(i, 4), 0.3 + 0.15 * hs(i, 5)), snowM, x, 0.0, 0.12 + 0.18 * hs(i, 6));
    }
    put(g, snowGeo(0.7, 0.16, 0.5), snowM, SZ.lamp.x - 0.1, 0, SZ.lamp.z + 0.1);

    // ---- behind and above: the sky card, two dark buildings with three small lit windows
    put(g, new THREE.PlaneGeometry(14, 10), bas({ map: skyTex(), color: "#9a9a9a" }), 0, 5, -6);
    const bM = bas({ map: bldgTex(), color: "#8a8a8a" }), litM = bas({ color: "#c98a42" });
    put(g, new THREE.BoxGeometry(4.6, 6.2, 1.2), bM, -4.3, 3.1, -2.6); put(g, new THREE.BoxGeometry(4.1, 5.0, 1.2), bM, 4.55, 2.5, -2.6);
    box(g, 0.5, 0.7, 0.5, bM, 3.6, 5.3, -2.6);
    for (const [x, y] of [[-2.75, 4.35], [-3.4, 5.25], [3.0, 4.0]]) put(g, new THREE.PlaneGeometry(0.28, 0.38), litM, x, y, -1.99);

    // ---- the street lamp, lit: a warm cone and a glow disc on the snow
    const lx = SZ.lamp.x, lz = SZ.lamp.z, LH = SZ.lamp.h;
    put(g, new THREE.CylinderGeometry(0.085, 0.11, 0.36, 12), ironM, lx, 0.18, lz); put(g, new THREE.CylinderGeometry(0.035, 0.045, LH - 0.1, 10), ironM, lx, LH / 2 + 0.05, lz);
    box(g, 0.36, 0.05, 0.05, ironM, lx + 0.17, LH - 0.04, lz);   // the arm toward +x
    put(g, new THREE.ConeGeometry(0.2, 0.15, 14, 1, true), bas({ color: "#1d2130", side: THREE.DoubleSide }), lx + 0.34, LH - 0.07, lz);
    put(g, new THREE.SphereGeometry(0.065, 12, 10), bas({ color: "#ffe9b0" }), lx + 0.34, LH - 0.17, lz);
    snowStrip(g, snowM, lx + 0.16, lx + 0.52, LH + 0.0, lz, 0.04, 0.3, 40);
    const coneG = new THREE.ConeGeometry(1.45, LH - 0.2, 28, 1, true), cp = coneG.attributes.position, cc = new Float32Array(cp.count * 3);
    for (let i = 0; i < cp.count; i++) { const k = clamp((cp.getY(i) + (LH - 0.2) / 2) / (LH - 0.2)); cc.set([1 * k * k, 0.84 * k * k, 0.5 * k * k], i * 3); }
    coneG.setAttribute("color", new THREE.BufferAttribute(cc, 3));
    glowy(put(g, coneG, bas({ vertexColors: true, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }), lx + 0.34, (LH - 0.2) / 2 + 0.05, lz), 2);
    const lg = radial([[0, "rgba(255,226,150,1)"], [0.2, "rgba(255,200,110,0.6)"], [0.55, "rgba(255,170,80,0.16)"], [1, "rgba(255,150,60,0)"]]);
    const lampGlow = sprite(g, lg, 0.9, 5); lampGlow.position.set(lx + 0.34, LH - 0.17, lz); lampGlow.scale.set(1.1, 1.1, 1);
    const disc = glowy(put(g, new THREE.PlaneGeometry(3.6, 3.6), addm(lg, "#ffffff", 0.4), lx + 0.34, 0.02, lz), 2); disc.rotation.x = -Math.PI / 2;

    return {
      grip: 0,
      apply(ps) {
        const f = clamp(ps.flicker ?? P.spec.flicker ?? 0);
        neonM.color.set("#2b2230").lerp(new THREE.Color("#c4362c"), f);
        halo.material.opacity = 0.55 * f; halo.visible = f > 0.01;
        bulbM.color.set("#39456a").lerp(new THREE.Color("#b08a4c"), f * 0.5);
      },
    };
  },

  oilbarrel(P) {
    const R = NIGHTDINER.barrel.r, BH = NIGHTDINER.barrel.h, RIM = BH, FL = NIGHTDINER.barrel.flame, g = P.whole;
    const rust = new THREE.MeshStandardMaterial({ color: "#ffffff", map: drumTex(), roughness: 0.78, metalness: 0.25 });
    const hoopM = new THREE.MeshStandardMaterial({ color: "#5d4033", roughness: 0.7, metalness: 0.3 });
    const solid = (m) => { m.castShadow = m.receiveShadow = true; m.userData.solid = true; return m; };

    // ---- the drum: a dented wall (vertices pushed in by a few soft dents), rolled rim and hoops, the glowing inside
    const wallG = new THREE.CylinderGeometry(R, R, BH, 48, 24, true), pos = wallG.attributes.position;
    const DENTS = [[Math.PI + 0.45, 0.52, 0.02, 0.26, 0.09], [Math.PI - 0.9, 0.22, 0.016, 0.3, 0.08], [Math.PI + 1.6, 0.66, 0.012, 0.3, 0.07], [Math.PI - 0.1, 0.4, 0.013, 0.55, 0.15], [Math.PI + 2.6, 0.38, 0.011, 0.35, 0.1]];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), y = pos.getY(i) + BH / 2, a = Math.atan2(x, z);
      let dep = 0;
      for (const [da, dy, k, sa, sy] of DENTS) { let d = Math.abs(a - da) % (Math.PI * 2); d = Math.min(d, Math.PI * 2 - d); dep += k * Math.exp(-((d / sa) ** 2 + ((y - dy) / sy) ** 2) / 2); }
      const s = (R - dep) / R; pos.setXYZ(i, x * s, pos.getY(i), z * s);
    }
    wallG.computeVertexNormals();
    const wall = solid(put(g, wallG, rust, 0, BH / 2, 0)); wall.rotation.y = Math.PI;   // the seam to the back
    const innerM = bas({ map: innerTex(), color: "#3a2a24", side: THREE.BackSide });
    solid(put(g, new THREE.CylinderGeometry(R - 0.012, R - 0.012, BH - 0.08, 32, 1, true), innerM, 0, BH / 2 + 0.04, 0));
    for (const y of [RIM, 0.012]) solid(put(g, new THREE.TorusGeometry(R + 0.002, 0.016, 8, 48), hoopM, 0, y, 0)).rotation.x = Math.PI / 2;
    for (const y of [0.29, 0.57]) solid(put(g, new THREE.TorusGeometry(R + 0.004, 0.015, 8, 48), hoopM, 0, y, 0)).rotation.x = Math.PI / 2;
    solid(put(g, new THREE.CircleGeometry(R - 0.01, 32), bas({ color: "#120a07" }), 0, 0.02, 0)).rotation.x = -Math.PI / 2;
    const bedM = bas({ map: bedTex(), color: "#3a2a24" });
    solid(put(g, new THREE.CircleGeometry(R - 0.02, 28), bedM, 0, 0.79, 0)).rotation.x = -Math.PI / 2;

    // ---- eight punched holes near the top that glow orange
    const holeDark = bas({ color: "#140c08" }), holeLit = bas({ color: "#4a2a1a" }), holeGlowT = radial(WARM), holes = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.3 * hs(i, 1), y = 0.69 + 0.12 * hs(i, 2), r = 0.017 + 0.011 * hs(i, 3), rr = R + 0.006;
      const h = new THREE.Group(); h.position.set(Math.sin(a) * rr, y, Math.cos(a) * rr); h.rotation.y = a; g.add(h);
      solid(put(h, new THREE.CircleGeometry(r * 1.55, 10), holeDark, 0, 0, 0));
      const lit = put(h, new THREE.CircleGeometry(r, 10), holeLit, 0, 0, 0.002); lit.userData.solid = true;
      const gl = sprite(h, holeGlowT, 0, 6); gl.position.set(0, 0, 0.02); gl.scale.set(0.16, 0.16, 1);
      holes.push({ lit, gl });
    }

    // ---- the bed of burning banknote bundles (the note from the money pack, charred), over the rim
    const L = 0.2, Wd = 0.09, Ht = 0.055, bundleGeo = new THREE.BoxGeometry(L, Ht, Wd), bandGeo = new THREE.BoxGeometry(L * 0.2, Ht + 0.008, Wd + 0.008);
    const BUNDLES = [[0.1, 0.84, 0.02, 0.3, 0.05, 0.1], [0.0, 0.84, 0.11, 1.9, -0.1, 0.12], [-0.1, 0.84, -0.02, 0.1, 0.08, -0.12], [0.02, 0.84, -0.11, 1.3, 0.1, 0.05],
      [0.05, 0.895, 0.05, 0.9, 0.12, 0.2], [-0.05, 0.895, 0.04, 2.4, -0.15, 0.1], [0.0, 0.895, -0.06, 0.2, 0.05, -0.2],
      [0.0, 0.955, 0.0, 0.7, 0.3, 0.1], [0.04, 0.96, 0.05, 2.1, -0.35, 0.2]];
    const bandM = [bas({ map: bundleTex("end", 41), color: "#e8d8c0" })];
    BUNDLES.forEach(([x, y, z0, ry, rx, rz], i) => {
      const z = z0 + 0.03;
      const s = i * 7, mats = [bundleTex("end", s), bundleTex("end", s + 1), bundleTex("top", s + 2), bundleTex("side", s + 3), bundleTex("side", s + 4), bundleTex("side", s + 5)].map((t, k) => bas({ map: t, color: "#f2e2d0" }));
      const b = solid(put(g, bundleGeo, mats, x, y, z)); b.rotation.set(rx, ry, rz);
      const band = solid(put(b, bandGeo, bandM[0], 0, 0, 0)); band.position.x = (hs(i, 9) - 0.5) * 0.04;
    });

    // ---- flames: cel billboards on the rim
    const flames = TONGUES.map(([x, z, hh, w, sp], i) => {
      const m = flameMat(hs(i, 3)), q = glowy(put(g, new THREE.PlaneGeometry(1, 1), m, x, RIM + 0.02, z), 4 + (i % 3));
      return { q, m, x, z, hh, w, sp, ph: hs(i, 5) * 6.28 };
    });
    // glows: the bed's light at the rim, the ground pool r 1.6, the aura round the fire, the point light
    const rimGlow = glowy(put(g, new THREE.CircleGeometry(R - 0.01, 28), addm(radial(WARM), "#ffffff", 0), 0, RIM + 0.004, 0), 3); rimGlow.rotation.x = -Math.PI / 2;
    const pool = glowy(put(g, new THREE.PlaneGeometry(3.2, 3.2), addm(radial([[0, "rgba(255,190,100,0.8)"], [0.3, "rgba(255,140,60,0.4)"], [0.65, "rgba(255,110,40,0.12)"], [1, "rgba(255,100,30,0)"]]), "#ffffff", 0), 0, 0.02, 0), 2); pool.rotation.x = -Math.PI / 2;
    const aura = sprite(g, radial([[0, "rgba(255,170,80,0.7)"], [0.3, "rgba(255,140,60,0.32)"], [0.7, "rgba(255,110,40,0.07)"], [1, "rgba(255,100,30,0)"]]), 0, 2); aura.position.set(0, 1.1, 0.1); aura.scale.set(3.2, 3.2, 1);
    const light = new THREE.PointLight("#ff9a4a", 0, 3.6, 1.6); light.position.set(0, 1.05, 0.15); g.add(light);

    // ---- embers, feed sparks and burnt scraps, all from the clock
    const dotT = radial(DOT, 64);
    const embers = Array.from({ length: 20 }, (_, i) => ({ s: sprite(g, dotT, 1, 7), ph: hs(i, 1), sp: 0.3 + 0.3 * hs(i, 2), x: (hs(i, 3) - 0.5) * 0.34, z: (hs(i, 4) - 0.5) * 0.34, dr: (hs(i, 5) - 0.5) * 0.6, sz: 0.026 + 0.026 * hs(i, 6), i }));
    const sparks = Array.from({ length: 20 }, (_, i) => ({ s: sprite(g, dotT, 1, 7), ph: hs(i + 30, 1), sp: 0.9 + 0.9 * hs(i + 30, 2), x: (hs(i + 30, 3) - 0.5) * 0.3, z: (hs(i + 30, 4) - 0.5) * 0.3, dr: (hs(i + 30, 5) - 0.5) * 1.1, up: 0.9 + 0.5 * hs(i + 30, 6), sz: 0.045 + 0.03 * hs(i + 30, 7), i }));
    const scrapG = new THREE.PlaneGeometry(0.07, 0.045), scrapM = [bas({ color: "#1f1b18", side: THREE.DoubleSide }), bas({ color: "#3c5a33", side: THREE.DoubleSide }), bas({ color: "#cdbf98", side: THREE.DoubleSide })];
    const scraps = Array.from({ length: 7 }, (_, i) => ({ q: glowy(put(g, scrapG, scrapM[i % 3], 0, RIM, 0), 5), ph: hs(i + 60, 1), x: (hs(i + 60, 2) - 0.5) * 0.3, z: (hs(i + 60, 3) - 0.5) * 0.3, dr: (hs(i + 60, 4) - 0.5) * 0.9, spin: 2 + 3 * hs(i + 60, 5), i }));

    return {
      grip: 0,
      apply(ps) {
        const fire = clamp(ps.fire ?? 0), feed = clamp(ps.feed ?? 0), glow = clamp(ps.glow ?? 0), ck = ps.clock ?? P.spec.clock ?? 0;
        const on = fire > 0.01, fl = 0.92 + 0.08 * Math.sin(ck * 13.1) * Math.sin(ck * 5.3 + 1), gate = clamp(fire * 3);
        // the tongues
        for (const f of flames) {
          f.q.visible = on;
          const k = 0.9 + 0.1 * Math.sin(ck * f.sp + f.ph);
          f.m.uniforms.uTime.value = ck; f.m.uniforms.uH.value = Math.max(0.001, FL * fire * f.hh * k * (1 + 0.4 * feed));
          f.m.uniforms.uW.value = f.w * (0.7 + 0.3 * fire) * (1 + 0.18 * feed);
          f.q.position.set(f.x, RIM + 0.02, f.z);
        }
        // the lit things follow the fire
        innerM.color.set("#3a2a24").lerp(new THREE.Color("#ffffff"), fire); bedM.color.copy(innerM.color);
        for (const h of holes) { h.lit.material.color.set("#4a2a1a").lerp(new THREE.Color("#ffb04a"), fire); h.gl.material.opacity = 0.9 * fire * fl; h.gl.visible = on; }
        rimGlow.material.opacity = 0.85 * fire * fl; rimGlow.visible = on;
        pool.material.opacity = clamp(glow * fl * (1 + 0.25 * feed)); pool.visible = glow > 0.01;
        aura.material.opacity = clamp(glow * 0.55 * (0.94 + 0.06 * fl) * (1 + 0.35 * feed)); aura.visible = glow > 0.01;
        light.intensity = 3.0 * glow * fl * (1 + 0.35 * feed);
        // embers: rise 1.4 m over about three seconds, shrinking
        for (const e of embers) {
          const u = frac(ck * e.sp + e.ph), s = e.sz * (1 - u) ** 0.6 * gate;
          e.s.visible = gate > 0.02; e.s.position.set(e.x + e.dr * u + Math.sin(ck * 1.7 + e.i * 2.1) * 0.06 * u, RIM + 0.08 + u * 1.4, e.z); e.s.scale.set(s, s, 1);
        }
        // the feed flare's sparks
        const fg = clamp(feed * 1.5);
        for (const e of sparks) {
          const u = frac(ck * e.sp + e.ph), s = e.sz * (1 - u) ** 0.5 * fg;
          e.s.visible = fg > 0.02; e.s.position.set(e.x + e.dr * u, RIM + 0.15 + u * e.up, e.z * (1 + u)); e.s.scale.set(s, s, 1);
        }
        // burnt scraps tumbling up and out, 1.5 m in five seconds
        for (const e of scraps) {
          const u = frac(ck * 0.2 + e.ph), k = Math.min(1, u * 8) * Math.min(1, (1 - u) * 4) * gate;
          e.q.visible = gate > 0.02; e.q.position.set(e.x + e.dr * u * 0.6 + Math.sin(ck * 1.3 + e.i) * 0.08 * u, RIM + 0.1 + u * 1.45, e.z);
          e.q.rotation.set(ck * e.spin, ck * e.spin * 0.7, ck * e.spin * 0.4); e.q.scale.setScalar(Math.max(0.001, k));
        }
      },
    };
  },
};
