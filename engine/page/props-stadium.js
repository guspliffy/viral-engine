import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp, lerp, rng } from "./util.js";

// "There's a catch" EP07 "time travel" (storyboards/series/what-if/07-time-travel/BRIEF-T1.md): a night world final in a
// packed stadium in pouring rain, and the same stadium one year earlier, empty, at grey dawn. Metres, x right (runners run
// toward +x), y up, z toward the main camera, a prop faces +z at rot 0 (rot in degrees about y, as every prop). The world's
// numbers: the finish line x 0, six lanes 1.22 wide (z -3.66..+3.66, lane 1 nearest the stands), an apron z -5..-3.66 with a
// crowd barrier line at z -4.0, the first tier's front wall at z -5 (0.9 high), 28 tiers 0.8 deep and 0.42 high rising toward
// -z (tier i: tread top y 0.9 + 0.42 i, front edge z -5 - 0.8 i; the top tier's front edge z -26.6, y 12.24), an aisle stair
// 1.2 wide at x 4 (two steps per tier). Params arrive as prop tweens (`set`); keys propState (props3d.js) has no default for
// (wet, show, pic, cheer, boo, empty, flash, sway, snap, wave, crush) read spec.<name> until a tween sets it, and the first
// tween of such a key JUMPS: seed them with a dur-0 `set` at time 0 (lit and glow DO have spec defaults; cut is read as
// spec.cut only). Everything is unlit (painted, baked light) or lightly lit canvas painting drawn once from seeded numbers;
// every frame is a pure function of the params and the clip time (no random numbers, no clock). No letters except the cardsign.
//
//   stadium       origin = the finish line's middle on the ground (x 0, z 0). The track (x -70..+30, six lanes, white lane
//                 lines, a white start line at x spec.start and the white finish line at x 0, no numbers), the apron, the front
//                 wall, 28 tiers (bucket seats painted in big colour blocks), the aisle stair, a rear wall and a concourse behind
//                 the top tier, a roof canopy over the top 6 tiers (posts, sloping steel underside with lamp rows), end walls, a
//                 green infield (z 3.66..40), a far stand along z +45 and end stands at x -75 / +45 (cheap painted crowds, or empty
//                 seats at dawn), stand extensions beside the near stands, the ground and a sky dome (r 250, centred on the prop).
//                 Solid: tiers (treads and risers), aisle steps, front wall. Everything else is see-through (userData.steam).
//                 Spec: mood "night" (default: blue-black sky with rain haze, glossy shining track with painted floodlight
//                 reflections and puddles) | "dawn" (overcast grey-blue sky, wet dark concrete, every seat empty, no lamps lit),
//                 start -20 (the start line's x), seed 1.
//                 Param wet 0..1 (spec default 1): the track's shine and puddles (the overlay's strength; the track also darkens).
//   stadiumcrowd  seated potato spectators on the stadium's tiers (same tier numbers), golden skin, dot eyes, blush, a leaf,
//                 clothes in many colours, some under bright umbrellas, some in rain ponchos (about 0.72 m tall seated, sitting on
//                 the tread; the front row 0.85 standing on the apron at z -4.4). Origin (0, 0, 0) as the stadium. InstancedMesh in
//                 four x chunks, see-through (the cast never touches it). Spec: x0 -50, x1 50, rows 28, top 0 (top rows left
//                 empty), gap [3.4, 4.6] (the aisle), seed 1, umbrellas 0.35, ponchos 0.4, spacing 0.55, front false (true: a standing
//                 row on the apron), hole null (x of a 1.2 m gap in the front row), target [0, 0] ([x, z] boo points at), dim 0.8
//                 (brightness of the whole crowd). Params (spec defaults, 0 at rest): cheer 0..1 (arms up, a small bounce),
//                 boo 0..1 (one arm out toward target with a thumb down, the body leans and turns that way), empty 0..1 (spectators
//                 vanish in a seeded order until none are left), flash 0..1 (camera flashes twinkle across the stands with the clip
//                 time), sway 0..1 (idle sway).
//   floodlight    a 35 m steel lattice tower (origin: its foot's middle on the ground, 3.2 m square at the base, 1.6 at the top) with
//                 a tilted bank of 4 x 6 lamps facing +z at the top (rot turns it). Param lit 0..1 (spec default 0; 1 = blazing white
//                 lamps, a soft additive glow and a faint beam cone through the rain; 0 = dead grey lamps). See-through.
//   bigscreen     a 16 x 9 m video screen in a dark steel truss frame on two truss legs, facing +z; origin = the ground under its
//                 middle, the screen's bottom at y spec.bottom 13. Spec: photo, photo2 (paths as photoscreen takes them), fit "cover"
//                 (cropped to 16:9; focusY 0.5 = which part of a tall picture stays, 0 = its top). Params: show 0..1 (spec default 1;
//                 fades up from a dark screen), pic 0|1 (spec default 0: photo or photo2), glow 0..1 (spec default 0: screen light on
//                 the rain round it). See-through.
//   crowdbarrier  grey steel crowd-control barrier along x, spec.len 20 (posts every 2 m), 1.0 high, vertical bars every 0.11, feet
//                 0.62 along z; origin = the middle of its foot line on the ground. Solid.
//   startblock    a starting block pair on a rail, 0.6 long (along +x), 0.2 high; origin = the rail's back end on the track (x 0, z 0
//                 the rail's middle), the pads face +x. Solid, low.
//   finishtape    a red tape across spec.w 2.6 (along x) at y 0.85 on two thin posts 1.0 high at x +-w/2; origin = the middle on the
//                 ground. Turn it with rot 90 to lay it across the lanes. Params: snap 0..1 (spec default 0: the tape breaks at x
//                 spec.cut 0, both halves swing back toward -z and hang from their posts), wave (spec default 0: ripple, with the
//                 clip time). Tape see-through, posts solid.
//   cardsign      Chip's cardboard sign 0.42 x 0.30 (y 0.20..0.50) on a 0.35 m wooden stick (origin: the stick's bottom); hand-lettered
//                 spec.text "GO\nSPUD" (letters G O S P U D as marker strokes, any other letter in a handwriting font), spec.seed,
//                 rain-darkened edges. Param crush 0..1 (spec default 0): the stick bends at 0.2 and the board folds and crumples.
//                 Grip "stick" = [0, 0.1, 0]; its SIZE is in storyboards/lib/grips.mjs: cardsign { len 0.35, r 0.008 } (thin hold).
export const STADIUM_GRIPS = { cardsign: { stick: [0, 0.1, 0] } };

// ------------------------------------------------------------------------------------------------ numbers
const ST = { wall: 0.9, tiers: 28, depth: 0.8, rise: 0.42, x0: -50, x1: 50, aisle: 4, aisleW: 1.2 };
const tierY = (i) => ST.wall + ST.rise * i;       // tread top
const tierZf = (i) => -5 - ST.depth * i;          // front edge
const TRACK = { x0: -70, x1: 30, z: 3.66 };
const DEG = Math.PI / 180;
const hs = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };

// ------------------------------------------------------------------------------------------------ small things
const cvs = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; };
const tex = (c, aniso = 4) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t; };
const quiet = (m) => { m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; return m; };
const bas = (o = {}) => quiet(new THREE.MeshBasicMaterial({ fog: false, ...o }));
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
const addM = (o = {}) => bas({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, ...o });
// see-through for the checks, kept off the ground blobs and the light box
const ghost = (o, order = 0) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
function put(parent, geo, m, x = 0, y = 0, z = 0, solid = false) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = false; o.userData.solid = solid; parent.add(o); return o;
}
const radial = (stops, size = 128) => tex(cvs(size, size, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}));
const sprite = (parent, map, w, h, opacity, x, y, z, order = 8) => {
  const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), addM({ map, opacity }));
  s.position.set(x, y, z); ghost(s, order); parent.add(s); return s;
};
const tint = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return `#${c.getHexString()}`; };
const colorize = (geo, hex) => {
  const c = new THREE.Color(hex), n = geo.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  geo.setAttribute("color", new THREE.BufferAttribute(a, 3)); return geo;
};
const boxAt = (w, h, d, x, y, z, hex) => { const g = new THREE.BoxGeometry(w, h, d).toNonIndexed(); g.translate(x, y, z); return colorize(g, hex); };
// a thin strut between two points (4-sided), merged later
function strut(a, b, r, hex) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(r, r, L, 4, 1, true).toNonIndexed();
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
  g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); return colorize(g, hex);
}
// merge into one non-indexed geometry with position, normal, uv (and colour when every part has it)
const merge = (list) => mergeGeometries(list.map((g) => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (!["position", "normal", "uv", "color"].includes(k)) n.deleteAttribute(k); return n; }));

// hand-painted ground: blotches, specks and rain streaks in one canvas
function paintConcrete(g, W, H, base, seed, { blotch = 0.06, specks = 1, streak = 0.05, dark = "#000", light = "#fff" } = {}) {
  const r = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  const nb = Math.round(W * H / 9000);
  for (let i = 0; i < nb; i++) {
    const x = r() * W, y = r() * H, rx = (8 + r() * 40) * (W / 1024), ry = (6 + r() * 28) * (H / 256);
    g.fillStyle = r() < 0.5 ? dark : light; g.globalAlpha = blotch * (0.4 + r());
    g.beginPath(); g.ellipse(x, y, rx, ry, (r() - 0.5) * 0.5, 0, Math.PI * 2); g.fill();
  }
  const ns = Math.round(W * H / 500 * specks);
  for (let i = 0; i < ns; i++) { g.fillStyle = r() < 0.55 ? dark : light; g.globalAlpha = 0.08 + r() * 0.16; g.fillRect(r() * W, r() * H, 1 + r() * 2.2, 1 + r() * 2.2); }
  const nst = Math.round(W / 14);
  for (let i = 0; i < nst; i++) {
    const x = r() * W, y = r() * H, len = (0.1 + r() * 0.5) * H;
    const gr = g.createLinearGradient(0, y, 0, y + len); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(0.3, dark); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.globalAlpha = streak * (0.5 + r()); g.fillStyle = gr; g.fillRect(x, y, 1 + r() * 3, len);
  }
  g.globalAlpha = 1;
}

// ------------------------------------------------------------------------------------------------ the stadium's pictures
const MOODS = {
  night: { conc: "#323b55", concDark: "#10162a", concLight: "#6c7aa0", apron: "#3b4560", red: "#7b2a2d", line: "#e9edf4", ground: "#0d1322", grass: "#1b4a2a", grassB: "#245a33" },
  dawn: { conc: "#555d6b", concDark: "#2a303b", concLight: "#8b95a5", apron: "#4e5562", red: "#6c3b3c", line: "#c4c8cf", ground: "#3a414d", grass: "#3f5446", grassB: "#4a5f50" },
};
// the track (u across x -70..30, v down z -3.66..3.66): red rubber, white lines. canvas x px = (x + 70) / 100 * W, y px = (z + 3.66) / 7.32 * H
function trackTex(M, seed, start) {
  const W = 4096, H = 512, X = (x) => ((x - TRACK.x0) / 100) * W, Z = (z) => ((z + TRACK.z) / 7.32) * H;
  return tex(cvs(W, H, (g) => {
    const r = rng(seed + 11);
    g.fillStyle = M.red; g.fillRect(0, 0, W, H);
    for (let l = 0; l < 6; l++) { g.fillStyle = r() < 0.5 ? "rgba(255,120,90,0.05)" : "rgba(40,0,10,0.06)"; g.fillRect(0, Z(-3.66 + 1.22 * l), W, (1.22 / 7.32) * H); }
    for (let i = 0; i < 2600; i++) {
      const x = r() * W, y = r() * H, rx = 6 + r() * 36, ry = 2 + r() * 8;
      g.fillStyle = r() < 0.5 ? "rgba(255,150,120,0.07)" : "rgba(30,0,12,0.1)"; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill();
    }
    for (let i = 0; i < 26000; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,170,140,0.16)" : "rgba(20,0,10,0.18)"; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    for (let i = 0; i < 90; i++) { const x = r() * W, y = r() * H * 0.9; g.fillStyle = "rgba(15,0,8,0.1)"; g.fillRect(x, y, 2 + r() * 8, 20 + r() * 80); }   // scuffs
    // white lines: lane lines (5 cm), the start line (12 cm) and the finish line (12 cm), a little uneven like painted
    g.lineCap = "round";
    for (let k = 0; k <= 6; k++) {
      const y = k === 0 ? Z(-3.66) + 3.5 : k === 6 ? Z(3.66) - 3.5 : Z(-3.66 + 1.22 * k);
      for (let x = 0; x < W;) { const len = 60 + r() * 220; g.strokeStyle = M.line; g.globalAlpha = 0.82 + r() * 0.18; g.lineWidth = 3.4 + r() * 1.2; g.beginPath(); g.moveTo(x, y + (r() - 0.5) * 0.7); g.lineTo(x + len, y + (r() - 0.5) * 0.7); g.stroke(); x += len; }
    }
    for (const x0 of [start, 0]) {
      const x = X(x0);
      for (let y = 0; y < H;) { const len = 30 + r() * 80; g.fillStyle = M.line; g.globalAlpha = 0.85 + r() * 0.15; g.fillRect(x - 2.5 + (r() - 0.5) * 0.8, y, 5 + r() * 1.2, len); y += len; }
    }
    g.globalAlpha = 1;
  }), 8);
}
// the shine laid over the track (additive): floodlight streaks, puddles, rain glints (night), grey sky sheen (dawn)
function sheenTex(dawn, seed) {
  const W = 4096, H = 512;
  return tex(cvs(W, H, (g) => {
    const r = rng(seed + 23);
    g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
    const blob = (cx, cy, rx, ry, col, a) => {
      g.save(); g.translate(cx, cy); g.scale(rx, ry); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
      gr.addColorStop(0, col.replace("A", a)); gr.addColorStop(0.5, col.replace("A", a * 0.4)); gr.addColorStop(1, col.replace("A", 0));
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill(); g.restore();
    };
    if (!dawn) {
      for (let i = 0; i < 150; i++) { const x = r() * W; blob(x, r() * H, 3 + r() * 14, 60 + r() * 220, "rgba(190,215,255,A)", 0.16 + r() * 0.3); }   // streaks along z
      for (let i = 0; i < 26; i++) { const x = r() * W; blob(x, r() * H, 2 + r() * 5, 120 + r() * 200, "rgba(255,248,235,A)", 0.45 + r() * 0.4); }
      for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H, rx = 50 + r() * 190, ry = 14 + r() * 34; blob(x, y, rx, ry, "rgba(70,100,170,A)", 0.5); blob(x + (r() - 0.5) * rx * 0.4, y, rx * 0.5, ry * 0.45, "rgba(205,225,255,A)", 0.5); }   // puddles
      for (let i = 0; i < 4200; i++) { g.fillStyle = `rgba(${200 + r() * 55},${220 + r() * 35},255,${0.25 + r() * 0.5})`; g.beginPath(); g.ellipse(r() * W, r() * H, 1 + r() * 2.8, 0.8 + r() * 1.4, 0, 0, Math.PI * 2); g.fill(); }
      for (let i = 0; i < 700; i++) { const x = r() * W, y = r() * H, rr = 2 + r() * 5; g.strokeStyle = `rgba(190,215,255,${0.1 + r() * 0.25})`; g.lineWidth = 0.8; g.beginPath(); g.ellipse(x, y, rr * 1.6, rr * 0.6, 0, 0, Math.PI * 2); g.stroke(); }   // splash rings
    } else {
      for (let i = 0; i < 70; i++) { const x = r() * W; blob(x, r() * H, 10 + r() * 40, 50 + r() * 200, "rgba(150,170,195,A)", 0.07 + r() * 0.12); }
      for (let i = 0; i < 22; i++) { const x = r() * W, y = r() * H, rx = 60 + r() * 220, ry = 14 + r() * 36; blob(x, y, rx, ry, "rgba(130,150,180,A)", 0.4); blob(x, y, rx * 0.6, ry * 0.5, "rgba(200,212,228,A)", 0.4); }
      for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(190,205,225,${0.12 + r() * 0.3})`; g.beginPath(); g.ellipse(r() * W, r() * H, 1 + r() * 2, 0.7 + r() * 1.2, 0, 0, Math.PI * 2); g.fill(); }
    }
  }), 8);
}
// seats: 28 tier rows of 36 px, 0.5 m seats of 20.5 px across x -50..50, big colour blocks (two colours per group of 7 tiers)
const RH = 36, AH = 1024;
function seatAtlas(M, dawn, seed) {
  const W = 4096, H = AH;
  return tex(cvs(W, H, (g) => {
    const r = rng(seed + 31), pitch = W / 200;
    g.fillStyle = "#151b2b"; g.fillRect(0, 0, W, H);
    const PAL = dawn ? [["#7a3d44", "#3f5a86"], ["#6e4a38", "#3f6e6a"]] : [["#a0303c", "#2f58a8"], ["#8e3a30", "#2c7a78"], ["#b0762a", "#3a4f9e"]];
    for (let grp = 0; grp < 4; grp++) {
      const pal = PAL[Math.floor(r() * PAL.length)], blocks = []; let x = 0, c = r() < 0.5 ? 0 : 1;
      while (x < 200) { const w = 9 + Math.floor(r() * 12); blocks.push([x, Math.min(200, x + w), pal[c]]); x += w; c = 1 - c; }
      for (let row = grp * 7; row < grp * 7 + 7; row++) {
        const yy = row * RH;
        for (const [b0, b1, col] of blocks) for (let k = b0; k < b1; k++) {
          const xm = (k + 0.5) / 2 - 50;
          if (xm > 3.3 && xm < 4.7) continue;
          const v = 0.88 + r() * 0.24, x0 = k * pitch;
          g.fillStyle = tint(col, v * 0.82); g.beginPath(); g.roundRect(x0 + 2, yy + 2, pitch - 4, 15, 4); g.fill();   // the back
          g.fillStyle = tint(col, v * 1.05); g.beginPath(); g.roundRect(x0 + 2.5, yy + 19, pitch - 5, 13, 4); g.fill();   // the cushion
          if (r() < 0.25) { g.strokeStyle = "rgba(210,225,255,0.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x0 + 5, yy + 4); g.lineTo(x0 + pitch - 6, yy + 4); g.stroke(); }
        }
      }
    }
    const au = ((ST.aisle - ST.aisleW / 2 + 50) / 100) * W, aw = (ST.aisleW / 100) * W;   // the aisle: concrete
    g.fillStyle = M.conc; g.fillRect(au, 0, aw, H);
    g.globalAlpha = 0.12; for (let i = 0; i < 300; i++) { g.fillStyle = r() < 0.5 ? "#000" : "#fff"; g.fillRect(au + r() * aw, r() * H, 2 + r() * 8, 1 + r() * 3); } g.globalAlpha = 1;
    for (let row = 0; row < ST.tiers; row++) { g.fillStyle = "rgba(180,200,240,0.06)"; g.fillRect(0, row * RH + 17, W, 2); }   // wet sheen band
  }), 8);
}
// a far stand: painted crowd (night: heads, umbrellas, rain-lit) or empty seats (dawn)
function standTex(dawn, seed, W = 2048, H = 512) {
  return tex(cvs(W, H, (g) => {
    const r = rng(seed + 41);
    g.fillStyle = dawn ? "#2c3340" : "#0b1022"; g.fillRect(0, 0, W, H);
    const rowH = 12;
    for (let row = 0; row < H / rowH; row++) {
      const y = row * rowH + rowH / 2;
      for (let x = r() * 6; x < W; x += 9 + r() * 4) {
        if (dawn) {
          const c = r() < 0.5 ? "#5b3a46" : "#3d5478"; g.fillStyle = tint(c, 0.7 + r() * 0.5); g.fillRect(x, y - 5, 7, 8);
        } else if (r() < 0.34) {
          const hue = [["#2c4c96", "#5b7dd1"], ["#a02f3a", "#d96a62"], ["#2a7a76", "#58bdb2"], ["#c9962c", "#f1cf68"], ["#5a3a8a", "#9b7bd0"], ["#c0c8d8", "#eef2fa"]][Math.floor(r() * 6)];
          g.fillStyle = hue[0]; g.beginPath(); g.ellipse(x + 4, y - 3, 7.5, 5.2, 0, Math.PI, 0); g.fill();
          g.fillStyle = hue[1]; g.globalAlpha = 0.6; g.beginPath(); g.ellipse(x + 2.5, y - 5.2, 3, 1.4, 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
          g.fillStyle = "#8c6a3e"; g.beginPath(); g.arc(x + 4, y + 2, 2.8, 0, Math.PI * 2); g.fill();
        } else {
          g.fillStyle = tint(r() < 0.3 ? "#6d86b8" : "#c89a58", 0.5 + r() * 0.4); g.beginPath(); g.arc(x + 4, y, 3.6, 0, Math.PI * 2); g.fill();
          if (r() < 0.2) { g.fillStyle = "#3b7a35"; g.fillRect(x + 3.2, y - 6, 1.6, 2.4); }
        }
      }
    }
    if (!dawn) for (let i = 0; i < 160; i++) { g.fillStyle = "rgba(255,255,255,0.5)"; g.fillRect(r() * W, r() * H, 2, 2); }   // flashes
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, dawn ? "rgba(120,140,170,0.25)" : "rgba(30,50,100,0.25)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }), 4);
}
function skyTex(dawn, seed) {
  return tex(cvs(1024, 512, (g, W, H) => {
    const r = rng(seed + 51), gr = g.createLinearGradient(0, 0, 0, H);
    if (dawn) { gr.addColorStop(0, "#58677f"); gr.addColorStop(0.45, "#8f9db0"); gr.addColorStop(0.5, "#b5c0cc"); gr.addColorStop(1, "#7d8896"); }
    else { gr.addColorStop(0, "#03050d"); gr.addColorStop(0.3, "#0a1230"); gr.addColorStop(0.47, "#2a3f6e"); gr.addColorStop(0.5, "#30456f"); gr.addColorStop(1, "#141c33"); }
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 160; i++) {   // soft cloud masses
      const x = r() * W, y = r() * H * 0.5, rx = 40 + r() * 140, ry = 8 + r() * 26, c = dawn ? "230,236,245" : "70,90,150";
      g.save(); g.translate(x, y); g.scale(1, ry / rx);
      const rg = g.createRadialGradient(0, 0, 0, 0, 0, rx); rg.addColorStop(0, `rgba(${c},${dawn ? 0.18 : 0.16})`); rg.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = rg; g.fillRect(-rx, -rx, rx * 2, rx * 2); g.restore();
    }
  }), 2);
}
function concTex(M, seed, W = 1024, H = 256, k = 1) { return tex(cvs(W, H, (g) => paintConcrete(g, W, H, tint(M.conc, k), seed, { dark: M.concDark, light: M.concLight }))); }
function groundTex(M, seed, dawn) {
  return tex(cvs(1024, 1024, (g, W, H) => {
    paintConcrete(g, W, H, M.ground, seed + 61, { blotch: 0.12, dark: "#000", light: dawn ? "#99a5b6" : "#38496f", streak: 0.08 });
    const r = rng(seed + 62);
    for (let i = 0; i < 60; i++) { g.fillStyle = dawn ? "rgba(150,168,190,0.18)" : "rgba(80,110,180,0.14)"; g.beginPath(); g.ellipse(r() * W, r() * H, 20 + r() * 80, 6 + r() * 24, 0, 0, Math.PI * 2); g.fill(); }
  }), 4);
}
function grassTex(M, seed, dawn) {
  return tex(cvs(2048, 512, (g, W, H) => {
    const r = rng(seed + 71);
    g.fillStyle = M.grass; g.fillRect(0, 0, W, H);
    for (let x = 0; x < W;) { const w = 40 + r() * 70; g.fillStyle = r() < 0.5 ? M.grassB : M.grass; g.globalAlpha = 0.7; g.fillRect(x, 0, w, H); x += w; }   // mowing bands, uneven
    g.globalAlpha = 1;
    for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? "rgba(0,20,8,0.12)" : "rgba(170,230,160,0.06)"; g.beginPath(); g.ellipse(r() * W, r() * H, 8 + r() * 40, 3 + r() * 14, 0, 0, Math.PI * 2); g.fill(); }
    for (let i = 0; i < 9000; i++) { g.fillStyle = r() < 0.5 ? "rgba(0,25,10,0.28)" : "rgba(190,240,170,0.14)"; g.fillRect(r() * W, r() * H, 1, 2 + r() * 4); }
    for (let i = 0; i < 26; i++) { g.fillStyle = dawn ? "rgba(160,180,195,0.18)" : "rgba(90,130,200,0.14)"; g.beginPath(); g.ellipse(r() * W, r() * H, 40 + r() * 150, 8 + r() * 24, 0, 0, Math.PI * 2); g.fill(); }
  }), 4);
}
// the roof's underside: dark steel panels with rows of lamps (lit at night only)
function roofTex(dawn, seed) {
  return tex(cvs(1024, 256, (g, W, H) => {
    const r = rng(seed + 81);
    paintConcrete(g, W, H, dawn ? "#434a57" : "#1a2036", seed + 82, { dark: "#000", light: "#6b7690", blotch: 0.08 });
    g.strokeStyle = "rgba(0,0,0,0.5)"; g.lineWidth = 3; for (let x = 0; x < W; x += 64 + r() * 2) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let row = 0; row < 5; row++) for (let x = 20; x < W; x += 32 + r() * 3) {
      const y = 26 + row * 50;
      if (!dawn) { g.fillStyle = "rgba(255,240,200,0.18)"; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill(); g.fillStyle = "rgba(255,244,214,0.95)"; g.beginPath(); g.arc(x, y, 3.2, 0, Math.PI * 2); g.fill(); }
      else { g.fillStyle = "#5b6270"; g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill(); }
    }
  }), 4);
}

// ------------------------------------------------------------------------------------------------ the stadium
function buildStadium(P) {
  const S = P.spec, dawn = (S.mood ?? "night") === "dawn", M = MOODS[dawn ? "dawn" : "night"], seed = S.seed ?? 1, start = S.start ?? -20;
  const g = P.whole, X0 = ST.x0, X1 = ST.x1, XW = X1 - X0;
  const concM = bas({ map: concTex(M, seed + 1), color: dawn ? "#d5dae4" : "#c9d0e4" });
  const po = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
  // ---- sky and ground
  const sky = put(g, new THREE.SphereGeometry(250, 28, 14), bas({ map: skyTex(dawn, seed), side: THREE.BackSide, depthWrite: false }), 0, -10, 0); ghost(sky, -100);
  const gt = groundTex(M, seed, dawn); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(6, 6);
  const ground = put(g, new THREE.PlaneGeometry(600, 600), bas({ map: gt }), 0, -0.012, 0); ground.rotation.x = -Math.PI / 2; ghost(ground);
  // ---- track, apron, infield
  const trackM = bas({ map: trackTex(M, seed, start), color: "#ffffff", ...po });
  const track = put(g, new THREE.PlaneGeometry(100, 7.32), trackM, (TRACK.x0 + TRACK.x1) / 2, 0.004, 0); track.rotation.x = -Math.PI / 2; ghost(track, 1);
  const sheenM = addM({ map: sheenTex(dawn, seed), opacity: 1, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const sheen = put(g, new THREE.PlaneGeometry(100, 7.32), sheenM, (TRACK.x0 + TRACK.x1) / 2, 0.006, 0); sheen.rotation.x = -Math.PI / 2; ghost(sheen, 2);
  const apronMap = tex(cvs(4096, 128, (c, W, H) => {
    paintConcrete(c, W, H, M.apron, seed + 3, { dark: M.concDark, light: M.concLight, streak: 0.1 });
    const r = rng(seed + 4); for (let i = 0; i < 70; i++) { c.fillStyle = dawn ? "rgba(150,168,190,0.2)" : "rgba(110,140,210,0.2)"; c.beginPath(); c.ellipse(r() * W, r() * H, 20 + r() * 90, 3 + r() * 9, 0, 0, Math.PI * 2); c.fill(); }
  }), 8);
  const apron = put(g, new THREE.PlaneGeometry(125, 1.34), bas({ map: apronMap, ...po }), -12.5, 0.004, -4.33); apron.rotation.x = -Math.PI / 2; ghost(apron, 1);
  const infield = put(g, new THREE.PlaneGeometry(100, 36.34), bas({ map: grassTex(M, seed, dawn), ...po }), -20, 0.003, TRACK.z + 18.17); infield.rotation.x = -Math.PI / 2; ghost(infield, 1);

  // ---- the near stands: front wall, risers, treads, aisle steps (solid)
  const seatM = bas({ map: seatAtlas(M, dawn, seed), color: dawn ? "#aeb6c6" : "#b4bdd6" });
  const treads = [], wall = [];
  for (let i = 0; i < ST.tiers; i++) {
    const y = tierY(i), zf = tierZf(i), zb = zf - ST.depth;
    const vt = 1 - (i * RH) / AH, vb = 1 - ((i + 1) * RH) / AH;   // the atlas row i: the tread's back = the row's top
    const q = new THREE.BufferGeometry();   // two up-facing triangles A(X0,zb) D(X0,zf) C(X1,zf) / A C B(X1,zb)
    q.setAttribute("position", new THREE.Float32BufferAttribute([X0, y, zb, X0, y, zf, X1, y, zf, X0, y, zb, X1, y, zf, X1, y, zb], 3));
    q.setAttribute("uv", new THREE.Float32BufferAttribute([0, vt, 0, vb, 1, vb, 0, vt, 1, vb, 1, vt], 2));
    q.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
    treads.push(q);
    // the riser at the tier's front edge: tier 0 is the front wall (concrete); the others show the seat backs of the tier in front of them
    if (i === 0) { const rg = new THREE.PlaneGeometry(XW, ST.wall); rg.translate((X0 + X1) / 2, ST.wall / 2, zf); wall.push(rg.toNonIndexed()); continue; }
    const rg = new THREE.PlaneGeometry(XW, ST.rise); rg.translate((X0 + X1) / 2, y - ST.rise / 2, zf);
    const ru = rg.attributes.uv, yy = (i - 1) * RH;
    for (let k = 0; k < ru.count; k++) ru.setY(k, 1 - (yy + (ru.getY(k) > 0.5 ? 2 : 17)) / AH);
    treads.push(rg.toNonIndexed());
  }
  put(g, merge(treads), seatM, 0, 0, 0, true);
  put(g, merge(wall), bas({ map: concTex(M, seed + 7, 2048, 128, 0.9), color: dawn ? "#c2c8d4" : "#aab2c8" }), 0, 0, 0, true);
  // the aisle steps (two per tier: 0.21 rise, 0.4 deep) with pale nosings, one merged mesh with vertex colours
  const steps = [], stepC = dawn ? "#4d5461" : "#3a4360", nose = dawn ? "#9aa3b2" : "#8794b8";
  for (let i = 0; i < ST.tiers; i++) {
    const y = tierY(i), zf = tierZf(i), aw = ST.aisleW;
    steps.push(boxAt(aw, 0.21, 0.4, ST.aisle, y + 0.105, zf - 0.6, stepC), boxAt(aw, 0.012, 0.06, ST.aisle, y + 0.006, zf - 0.04, nose), boxAt(aw, 0.012, 0.06, ST.aisle, y + 0.216, zf - 0.44, nose));
  }
  put(g, merge(steps), bas({ vertexColors: true }), 0, 0, 0, true);
  // end walls (stepped profile) at x -50 and +50
  const prof = new THREE.Shape(); prof.moveTo(-5, 0);
  for (let i = 0; i < ST.tiers; i++) { prof.lineTo(tierZf(i), tierY(i)); prof.lineTo(tierZf(i) - ST.depth, tierY(i)); }
  prof.lineTo(-27.4, 12.24); prof.lineTo(-32, 12.24); prof.lineTo(-32, 0); prof.lineTo(-5, 0);
  const endMat = bas({ map: concTex(M, seed + 9, 512, 256, 0.75), side: THREE.DoubleSide });
  for (const sx of [X0, X1]) { const eg = new THREE.ShapeGeometry(prof); eg.rotateY(-Math.PI / 2); ghost(put(g, eg, endMat, sx, 0, 0)); }   // (shape x = z, y = y) onto the x = const plane
  // concourse and the rear wall behind the top tier
  const conc = put(g, new THREE.PlaneGeometry(XW, 4.6), bas({ map: concTex(M, seed + 10, 1024, 64, 0.8) }), 0, 12.245, -29.7); conc.rotation.x = -Math.PI / 2; ghost(conc);
  ghost(put(g, new THREE.PlaneGeometry(XW, 14), bas({ map: concTex(M, seed + 12, 2048, 256, 0.55), side: THREE.DoubleSide }), 0, 12.24 + 7, -32));
  // ---- the roof canopy over the top six tiers: posts, a sloping steel underside with lamp rows, a fascia
  const roofZ0 = -22.0, roofZ1 = -35, roofY0 = 21, roofY1 = 26.8, len = Math.hypot(roofZ0 - roofZ1, roofY1 - roofY0);
  const roof = put(g, new THREE.PlaneGeometry(XW + 1, len), bas({ map: roofTex(dawn, seed), side: THREE.DoubleSide }), 0, (roofY0 + roofY1) / 2, (roofZ0 + roofZ1) / 2);
  roof.rotation.x = Math.atan2(roofZ1 - roofZ0, roofY1 - roofY0); ghost(roof);
  ghost(put(g, new THREE.BoxGeometry(XW + 1, 1.1, 0.3), concM, 0, roofY0 - 0.35, roofZ0 + 0.1));
  const posts = [];
  for (let x = X0; x <= X1 + 0.1; x += 12.5) posts.push(strut([x, tierY(24), tierZf(24) - 0.1], [x, roofY0 - 0.4, roofZ0 - 0.6], 0.32, dawn ? "#444b59" : "#222a44"));
  ghost(put(g, merge(posts), bas({ vertexColors: true }), 0, 0, 0));
  // ---- the backdrop ring: a far stand along z +45, end stands at x -75 and +45, stand extensions beside the near stands
  const ramp = (w, l, x, y, z, rotY, rotX, map) => {
    const m = put(g, new THREE.PlaneGeometry(w, l), bas({ map, side: THREE.DoubleSide }), x, y, z);
    m.rotation.order = "YXZ"; m.rotation.set(rotX, rotY, 0); return ghost(m);
  };
  const far = standTex(dawn, seed + 1), endL = standTex(dawn, seed + 2), endR = standTex(dawn, seed + 3), ext = standTex(dawn, seed + 4, 1024, 512);
  const fa = Math.atan2(12, 17), fl = Math.hypot(12, 17);   // far and end stands: 17 m run, 12 m rise, up-slope = the plane's local y
  ramp(120, fl, -15, 6, 49.5, 0, Math.PI / 2 - fa, far);
  ghost(put(g, new THREE.BoxGeometry(120, 0.9, 0.3), concM, -15, 0.45, 41));
  ramp(77, fl, -83.5, 6, 6.5, -Math.PI / 2, Math.PI / 2 - fa, endL);
  ramp(48, fl, 53.5, 6, 21, Math.PI / 2, Math.PI / 2 - fa, endR);
  const ea = Math.atan2(12.2 - 0.9, 22), el = Math.hypot(22, 12.2 - 0.9);   // extensions of the near stands (rise toward -z)
  ramp(25, el, -62.5, 6.55, -16, 0, -Math.PI / 2 + ea, ext);
  ramp(15, el, 57.5, 6.55, -16, 0, -Math.PI / 2 + ea, ext);
  return { floorTint: (wet) => { trackM.color.setScalar(1 - 0.3 * wet); sheenM.opacity = wet; sheen.visible = wet > 0.003; } };
}

// ------------------------------------------------------------------------------------------------ the crowd
const POTATO = { rx: 0.25, ry: 0.3, rz: 0.22, cy: 0.3 };
let FACE = null;
// the skin and the face: the sphere's u 0.25 is +z (front); v in [0.06, 1] is the body, the bottom 6 % of the picture is the leaf's green
function faceTex() {
  return (FACE ||= tex(cvs(512, 256, (g, W, H) => {
    const r = rng(404);
    g.fillStyle = "#e2a95c"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.5 ? "rgba(150,90,30,0.18)" : "rgba(255,225,160,0.2)"; g.beginPath(); g.ellipse(r() * W, r() * H * 0.94, 3 + r() * 9, 2 + r() * 6, 0, 0, Math.PI * 2); g.fill(); }
    for (let i = 0; i < 260; i++) { g.fillStyle = "rgba(120,70,25,0.35)"; g.fillRect(r() * W, r() * H * 0.94, 2, 2); }
    g.fillStyle = "#4e9a2e"; g.fillRect(0, H * 0.94, W, H * 0.06);
    const v = 0.06 + 0.94 * (1 - Math.acos(0.08 / 0.3) / Math.PI), fx = W * 0.25, fy = (1 - v) * H;
    for (const s of [-1, 1]) {
      g.fillStyle = "#2a1608"; g.beginPath(); g.ellipse(fx + s * 35, fy, 7, 10.5, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#fff"; g.beginPath(); g.arc(fx + s * 35 + 2.5, fy - 4, 2.6, 0, Math.PI * 2); g.fill();
      g.fillStyle = "rgba(255,110,110,0.55)"; g.beginPath(); g.ellipse(fx + s * 62, fy + 20, 12, 7, 0, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = "#5a2a10"; g.lineWidth = 3.5; g.lineCap = "round"; g.beginPath(); g.arc(fx, fy + 15, 12, 0.3, Math.PI - 0.3); g.stroke();
  }), 4));
}
const CLOTH = ["#c23b3b", "#2f5fb3", "#e0b02e", "#2e8a66", "#7a3fa3", "#d9742a", "#2f9aa8", "#b03a7a", "#58636f", "#e8e2d2", "#3b3f8f", "#6a8f2c", "#a8421f", "#1f6f9f", "#d9a0a8", "#4a2f2a"];
const UMB = ["#d23a3a", "#2f63c8", "#e0b82e", "#2aa86a", "#9a4ad0", "#e07a2e", "#2aa8b8", "#d04a96", "#c9ced8", "#7ab83a"];
const PONCHO = ["#a9c3da", "#a9c3da", "#a9c3da", "#e5b72a", "#d64545", "#3f9a5a", "#4a7fd0", "#e87fb0"];

let BODY_GEO = null, CLOTH_GEO = null, PONCHO_GEO = null, UMB_GEO = null, ARM_GEO = null;
function crowdGeos() {
  if (BODY_GEO) return;
  const { rx, ry, rz, cy } = POTATO;
  const bg = new THREE.SphereGeometry(1, 8, 5); bg.scale(rx, ry, rz); bg.translate(0, cy, 0);
  { const uv = bg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 0.06 + uv.getY(i) * 0.94); }
  const leaf = new THREE.ConeGeometry(0.05, 0.13, 4); leaf.rotateZ(-0.5); leaf.translate(0.02, 0.66, 0);
  { const uv = leaf.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5, 0.03); }
  BODY_GEO = merge([bg, leaf]);
  const shade = (geo, y0, y1, lo) => { const p = geo.attributes.position, a = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { const k = lo + (1 - lo) * clamp((p.getY(i) - y0) / (y1 - y0)); a[i * 3] = a[i * 3 + 1] = a[i * 3 + 2] = k; } geo.setAttribute("color", new THREE.BufferAttribute(a, 3)); return geo; };
  shade(BODY_GEO, 0.02, 0.62, 0.55);
  CLOTH_GEO = new THREE.SphereGeometry(1, 8, 3, 0, Math.PI * 2, 1.58, Math.PI - 1.58); CLOTH_GEO.scale(rx * 1.07, ry * 1.07, rz * 1.07); CLOTH_GEO.translate(0, cy, 0);
  PONCHO_GEO = new THREE.SphereGeometry(1, 8, 3, 0, Math.PI * 2, 1.25, 1.2); PONCHO_GEO.scale(rx * 1.22, ry * 1.18, rz * 1.22); PONCHO_GEO.translate(0, cy - 0.02, 0);
  const dome = new THREE.SphereGeometry(0.4, 10, 2, 0, Math.PI * 2, 0, 1.05); dome.scale(1, 0.55, 1); dome.translate(0, 0.86, 0);
  const stick = new THREE.CylinderGeometry(0.012, 0.012, 0.3, 3, 1, true); stick.translate(0, 0.72, 0);
  UMB_GEO = merge([dome, stick]); shade(UMB_GEO, 0.7, 1.05, 0.7);
  shade(CLOTH_GEO, 0.0, 0.5, 0.45); shade(PONCHO_GEO, 0.05, 0.6, 0.55);
  const a = new THREE.CylinderGeometry(0.036, 0.03, 0.17, 5, 1, true); a.translate(0, -0.085, 0);   // the arm hangs along -y from the shoulder
  const hand = new THREE.OctahedronGeometry(0.05); hand.translate(0, -0.2, 0);
  const thumb = new THREE.TetrahedronGeometry(0.03); thumb.translate(0.045, -0.2, 0);
  ARM_GEO = merge([a, hand, thumb]);
}
function buildCrowd(P) {
  crowdGeos();
  const S = P.spec, g = P.whole, seed = S.seed ?? 1, sp = S.spacing ?? 0.55, rows = S.rows ?? 28, topEmpty = S.top ?? 0;
  const [g0, g1] = S.gap ?? [3.4, 4.6], x0 = S.x0 ?? -50, x1 = S.x1 ?? 50, umbShare = S.umbrellas ?? 0.35, ponShare = S.ponchos ?? 0.4;
  const target = S.target ?? [0, 0], dim = S.dim ?? 0.8;
  const list = [];
  const add = (x, y, z, s, key) => {
    const q = (i) => hs(key, i + seed * 7);
    list.push({ x, y, z, s, ph: q(1) * 6.283, rank: q(2), cloth: Math.floor(q(3) * CLOTH.length), umb: q(4) < umbShare ? Math.floor(q(5) * UMB.length) : -1, pon: q(6) < ponShare ? Math.floor(q(7) * PONCHO.length) : -1, hand: q(8) < 0.5 ? 1 : -1 });
  };
  const n = Math.floor((x1 - x0) / sp);
  for (let t = 0; t < Math.min(rows, ST.tiers) - topEmpty; t++) {
    for (let k = 0; k <= n; k++) {
      const x = x0 + k * sp + (t % 2 ? sp * 0.5 : 0) + (hs(t * 400 + k, seed) - 0.5) * 0.08;
      if (x > x1 || (x > g0 && x < g1)) continue;
      add(x, tierY(t), tierZf(t) - 0.42, 0.92 + hs(t * 400 + k, seed + 3) * 0.2, t * 400 + k + 1);
    }
  }
  if (S.front) for (let k = 0; k <= n; k++) {
    const x = x0 + k * sp + (hs(9000 + k, seed) - 0.5) * 0.1;
    if (S.hole != null && Math.abs(x - S.hole) < 0.6) continue;
    add(x, 0, -4.4, 1.2 + hs(9000 + k, seed + 3) * 0.08, 9000 + k + 1);
  }
  const CH = 25, d = new THREE.Color("#ffffff").multiplyScalar(dim);
  const skinM = bas({ map: faceTex(), color: d, vertexColors: true }), clothM = bas({ color: d.clone(), vertexColors: true }), ponM = bas({ color: d.clone(), side: THREE.DoubleSide, vertexColors: true }), umbM = bas({ color: d.clone(), side: THREE.DoubleSide, vertexColors: true }), armM = bas({ color: tint("#e2a95c", dim) });
  const chunks = new Map(), parts = [], col = new THREE.Color();
  for (const s of list) { const c = Math.floor((s.x - x0) / CH); (chunks.get(c) || chunks.set(c, []).get(c)).push(s); }
  for (const [, L] of chunks) {
    const mk = (geo, m, cnt) => { const im = new THREE.InstancedMesh(geo, m, Math.max(1, cnt)); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); ghost(im, 4); g.add(im); return im; };
    // cloth, poncho and umbrella meshes hold only the spectators that have them (ic / ip / iu = the index in their mesh)
    let nc = 0, np = 0, nu = 0; for (const s of L) { s.ic = s.pon < 0 ? nc++ : -1; s.ip = s.pon >= 0 ? np++ : -1; s.iu = s.umb >= 0 ? nu++ : -1; }
    const body = mk(BODY_GEO, skinM, L.length), cloth = mk(CLOTH_GEO, clothM, nc), pon = mk(PONCHO_GEO, ponM, np), umb = mk(UMB_GEO, umbM, nu), arms = mk(ARM_GEO, armM, L.length * 2);
    for (const s of L) { if (s.ic >= 0) cloth.setColorAt(s.ic, col.set(CLOTH[s.cloth])); if (s.ip >= 0) pon.setColorAt(s.ip, col.set(PONCHO[s.pon])); if (s.iu >= 0) umb.setColorAt(s.iu, col.set(UMB[s.umb])); }
    for (const [im, n] of [[cloth, nc], [pon, np], [umb, nu]]) { if (n === 0) im.setColorAt(0, col.set("#ffffff")); im.instanceColor.needsUpdate = true; if (n === 0) im.count = 0; }
    const xs = L.map((s) => s.x), cx = (Math.min(...xs) + Math.max(...xs)) / 2, hw = (Math.max(...xs) - Math.min(...xs)) / 2 + 2;
    for (const im of [body, cloth, pon, umb, arms]) { im.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, 6.5, -15), Math.hypot(hw, 14, 14)); im.frustumCulled = true; }
    parts.push({ L, body, cloth, pon, umb, arms, na: L.length * 2 });
  }
  // camera flashes: 150 small white stars over the stands, blinking with the clip time
  const FL = 150, starTex = radial([[0, "rgba(255,255,255,1)"], [0.12, "rgba(255,255,255,0.9)"], [0.4, "rgba(190,215,255,0.25)"], [1, "rgba(150,180,255,0)"]], 64);
  const flash = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), addM({ map: starTex }), FL); ghost(flash, 9); g.add(flash);
  const fl = [];
  for (let i = 0; i < FL; i++) { const t = Math.floor(hs(i, 91 + seed) * 26); fl.push({ x: x0 + hs(i, 92 + seed) * (x1 - x0), y: tierY(t) + 0.8, z: tierZf(t) - 0.4, rate: 5 + hs(i, 93) * 9, ph: hs(i, 94) * 20, sz: 0.5 + hs(i, 95) * 0.7 }); }
  flash.setColorAt(0, col.set("#fff"));

  const D = new THREE.Object3D(), Q = new THREE.Quaternion(), Qa = new THREE.Quaternion(), V = new THREE.Vector3(), AX = new THREE.Vector3(), Mz = new THREE.Matrix4().makeScale(0, 0, 0), Mb = new THREE.Matrix4();
  const dirv = new THREE.Vector3(), yb = new THREE.Vector3(), xb = new THREE.Vector3(), zb = new THREE.Vector3(), down = new THREE.Vector3(0, -1, 0);
  let last = "";
  return {
    grip: 0,
    apply(ps, t) {
      const cheer = clamp(ps.cheer ?? S.cheer ?? 0), boo = clamp(ps.boo ?? S.boo ?? 0), empty = clamp(ps.empty ?? S.empty ?? 0), fla = clamp(ps.flash ?? S.flash ?? 0), sway = clamp(ps.sway ?? S.sway ?? 0);
      const key = `${cheer},${boo},${empty},${cheer > 0 || sway > 0 ? t : 0}`;
      if (key !== last) {
        last = key;
        for (const { L, body, cloth, pon, umb, arms, na } of parts) {
          L.forEach((s, i) => {
            const sc = s.s * (s.rank >= empty ? 1 : 0), ph = s.ph, bounce = 0.05 * cheer * Math.abs(Math.sin(t * 8 + ph)) * s.s;
            let dx = 0, dz = 1;
            Q.identity();
            if (boo > 0) {
              dx = target[0] - s.x; dz = target[1] - s.z; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
              Q.setFromAxisAngle(V.set(0, 1, 0), boo * 0.55 * Math.atan2(dx, dz));
              Q.multiply(Qa.setFromAxisAngle(AX.set(dz, 0, -dx), 0.22 * boo));   // leans toward the target
            } else if (sway > 0) Q.multiply(Qa.setFromAxisAngle(AX.set(0, 0, 1), 3 * DEG * sway * Math.sin(t * 1.7 + ph)));
            D.position.set(s.x, s.y + bounce, s.z); D.quaternion.copy(Q); D.scale.setScalar(sc); D.updateMatrix(); Mb.copy(D.matrix);
            body.setMatrixAt(i, Mb);
            if (s.ic >= 0) cloth.setMatrixAt(s.ic, Mb); else pon.setMatrixAt(s.ip, Mb);
            if (s.iu >= 0) umb.setMatrixAt(s.iu, Mb);
            if (cheer === 0 && boo === 0) return;
            for (let a = 0; a < 2; a++) {   // arms: pivots at the shoulders (+-0.24 sideways, 0.42 up in the body's frame)
              const side = a === 0 ? -1 : 1, pv = V.set(side * 0.24 * sc, 0.42 * sc, 0.02 * sc).applyQuaternion(Q);
              D.position.set(s.x + pv.x, s.y + bounce + pv.y, s.z + pv.z); D.scale.setScalar(sc);
              D.quaternion.copy(Q).multiply(Qa.setFromAxisAngle(AX.set(0, 0, 1), side * (0.2 + 2.6 * cheer + 0.1 * cheer * Math.sin(t * 8 + ph + a))));
              if (boo > 0 && side === s.hand) {
                // out toward the target, a little raised: the arm's local -y points along dirv, the thumb (local +x) down
                dirv.set(dx, 0.18, dz).normalize(); yb.copy(dirv).negate(); xb.copy(down).addScaledVector(yb, -down.dot(yb)).normalize(); zb.crossVectors(xb, yb);
                Qa.setFromRotationMatrix(Mb.makeBasis(xb, yb, zb)); D.quaternion.slerp(Qa, boo); Mb.compose(D.position, D.quaternion, D.scale);
              }
              D.updateMatrix(); arms.setMatrixAt(i * 2 + a, D.matrix);
            }
          });
          for (const im of [body, cloth, pon, umb, arms]) im.instanceMatrix.needsUpdate = true;
          arms.count = cheer === 0 && boo === 0 ? 0 : na;
        }
      }
      flash.visible = fla > 0;
      if (fla > 0) {
        for (let i = 0; i < FL; i++) {
          const f = fl[i], u = (t * f.rate + f.ph) % 1, I = fla * (u < 0.07 ? 1 - u / 0.07 : 0);
          D.position.set(f.x, f.y, f.z); D.quaternion.identity(); D.scale.setScalar(f.sz * (0.4 + I * 1.4)); D.updateMatrix();
          flash.setMatrixAt(i, I > 0.01 ? D.matrix : Mz); flash.setColorAt(i, col.setScalar(I));
        }
        flash.instanceMatrix.needsUpdate = true; flash.instanceColor.needsUpdate = true;
      }
    },
  };
}

// ------------------------------------------------------------------------------------------------ the floodlight
function buildFloodlight(P) {
  const g = P.whole, H = 35, steel = "#34405a", dark = "#222a3e", hw = (y) => lerp(1.6, 0.8, y / H), parts = [], levels = 8;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) parts.push(strut([sx * hw(0), 0, sz * hw(0)], [sx * hw(H), H, sz * hw(H)], 0.14, steel));
  for (let l = 0; l < levels; l++) {
    const y0 = (H / levels) * l, y1 = (H / levels) * (l + 1), a = hw(y0), b = hw(y1);
    parts.push(strut([-a, y0, -a], [a, y0, -a], 0.06, dark), strut([a, y0, -a], [a, y0, a], 0.06, dark), strut([a, y0, a], [-a, y0, a], 0.06, dark), strut([-a, y0, a], [-a, y0, -a], 0.06, dark));
    parts.push(strut([-a, y0, -a], [b, y1, -b], 0.05, dark), strut([a, y0, -a], [-b, y1, -b], 0.05, dark), strut([-a, y0, a], [b, y1, b], 0.05, dark), strut([a, y0, a], [-b, y1, b], 0.05, dark));
    parts.push(strut([-a, y0, -a], [-b, y1, b], 0.05, dark), strut([-a, y0, a], [-b, y1, -b], 0.05, dark), strut([a, y0, -a], [b, y1, b], 0.05, dark), strut([a, y0, a], [b, y1, -b], 0.05, dark));
  }
  parts.push(boxAt(2.4, 0.3, 2.4, 0, H + 0.15, 0, steel), boxAt(0.3, 1.4, 0.3, 0, 0.7, 0, dark));
  ghost(put(g, merge(parts), bas({ vertexColors: true }), 0, 0, 0));
  const bank = new THREE.Group(); bank.position.set(0, H + 2.4, 0.8); bank.rotation.x = 0.28; g.add(bank);   // tilted down toward +z
  const COLS = 4, ROWS = 6, px = 1.0, py = 0.95;
  ghost(put(bank, new THREE.BoxGeometry(COLS * px + 0.5, ROWS * py + 0.5, 0.3), bas({ color: "#1a2132" }), 0, 0, -0.12));
  const lensM = bas({ color: "#505a6c", toneMapped: false }), housM = bas({ color: "#2b3347" });
  const lenses = new THREE.InstancedMesh(new THREE.CircleGeometry(0.4, 14), lensM, COLS * ROWS), hous = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.44, 0.38, 0.22, 14), housM, COLS * ROWS), D = new THREE.Object3D();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const i = r * COLS + c; D.position.set((c - (COLS - 1) / 2) * px, (r - (ROWS - 1) / 2) * py, 0.06); D.rotation.set(0, 0, 0); D.updateMatrix(); lenses.setMatrixAt(i, D.matrix);
    D.position.z = -0.03; D.rotation.x = Math.PI / 2; D.updateMatrix(); hous.setMatrixAt(i, D.matrix);
  }
  ghost(lenses, 1); ghost(hous, 0); bank.add(hous, lenses);
  const halo = radial([[0, "rgba(255,255,255,1)"], [0.12, "rgba(235,245,255,0.7)"], [0.35, "rgba(170,200,255,0.22)"], [1, "rgba(120,160,255,0)"]], 128);
  const big = sprite(bank, halo, 16, 16, 0, 0, 0, 0.5, 8), small = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) small.push(sprite(bank, halo, 2.6, 2.6, 0, (c - (COLS - 1) / 2) * px, (r - (ROWS - 1) / 2) * py, 0.3, 9));
  // the beam: an open cone from the bank along +z, fading with distance (vertex colours, additive)
  const BL = 60, cone = new THREE.ConeGeometry(11, BL, 20, 6, true); cone.rotateX(-Math.PI / 2); cone.translate(0, 0, BL / 2);
  { const p = cone.attributes.position, c = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { const dd = clamp(p.getZ(i) / BL), k = (1 - dd) ** 1.5 * 0.5; c.set([k * 0.62, k * 0.76, k], i * 3); } cone.setAttribute("color", new THREE.BufferAttribute(c, 3)); }
  const beam = new THREE.Mesh(cone, addM({ vertexColors: true, opacity: 1 })); ghost(beam, 5); bank.add(beam);
  const dead = new THREE.Color("#4a5264"), white = new THREE.Color("#ffffff");
  return {
    grip: 0,
    apply(ps) {
      const lit = clamp(ps.lit ?? P.spec.lit ?? 0);
      lensM.color.copy(dead).lerp(white, lit).multiplyScalar(1 + 0.4 * lit);
      big.material.opacity = 0.75 * lit; big.visible = lit > 0.003;
      for (const s of small) { s.material.opacity = 0.9 * lit; s.visible = lit > 0.003; }
      beam.material.opacity = 0.4 * lit; beam.visible = lit > 0.003;
    },
  };
}

// ------------------------------------------------------------------------------------------------ the big screen
let DARK_SCREEN = null;
const darkScreen = () => (DARK_SCREEN ||= tex(cvs(1024, 576, (g, W, H) => {
  const r = rng(77), gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, "#1b2438"); gr.addColorStop(0.5, "#0d1320"); gr.addColorStop(1, "#1a2236");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(120,150,210,0.05)"; g.beginPath(); g.ellipse(r() * W, r() * H, 30 + r() * 160, 6 + r() * 20, -0.5, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "rgba(160,190,255,0.07)"; g.beginPath(); g.moveTo(0, H * 0.7); g.lineTo(W * 0.5, 0); g.lineTo(W * 0.62, 0); g.lineTo(0, H); g.fill();   // a faint sheen
}), 4));
function buildScreen(P) {
  const S = P.spec, g = P.whole, b = S.bottom ?? 13, SW = 16, SH = 9, cy = b + SH / 2, steel = "#2a3246", steel2 = "#3a4560";
  const scrM = bas({ map: darkScreen(), color: "#ffffff", toneMapped: false });
  ghost(put(g, new THREE.PlaneGeometry(SW, SH), scrM, 0, cy, 0), 3);
  // the truss frame (0.6 m): chords with zig-zag, a back plate, two truss legs down to the ground
  const parts = [], fw = SW / 2 + 0.3, fb = b - 0.3, ft = b + SH + 0.3;
  for (const [y, z] of [[fb, -0.15], [fb, -0.5], [ft, -0.15], [ft, -0.5]]) parts.push(strut([-fw - 0.3, y, z], [fw + 0.3, y, z], 0.07, steel2));
  for (const [x, z] of [[-fw, -0.15], [-fw, -0.5], [fw, -0.15], [fw, -0.5]]) parts.push(strut([x, fb, z], [x, ft, z], 0.07, steel2));
  for (const y of [fb, ft]) for (let x = -fw; x < fw - 0.01; x += 0.6) parts.push(strut([x, y, -0.15], [x + 0.6, y, -0.5], 0.04, steel));
  for (const x of [-fw, fw]) for (let y = fb; y < ft - 0.01; y += 0.6) parts.push(strut([x, y, -0.15], [x, y + 0.6, -0.5], 0.04, steel));
  parts.push(boxAt(SW + 0.2, SH + 0.2, 0.1, 0, cy, -0.12, "#161c2b"));
  for (const sx of [-1, 1]) {
    const x = sx * (fw - 0.5);
    for (const z of [-1.0, -0.6]) parts.push(strut([x - 0.35, 0, z], [x - 0.35, fb, z], 0.06, steel2), strut([x + 0.35, 0, z], [x + 0.35, fb, z], 0.06, steel2));
    for (let y = 0; y < fb - 1; y += 1.4) parts.push(strut([x - 0.35, y, -1.0], [x + 0.35, y + 1.4, -0.6], 0.04, steel2));
    parts.push(strut([x, fb, -0.3], [x, fb, -0.8], 0.1, steel));
  }
  ghost(put(g, merge(parts), bas({ vertexColors: true }), 0, 0, 0));
  const halo = sprite(g, radial([[0, "rgba(190,215,255,0.9)"], [0.35, "rgba(120,160,240,0.35)"], [1, "rgba(80,110,220,0)"]], 128), 38, 26, 0, 0, cy, 0.4, 7);   // the screen's light on the rain
  const pics = [null, null], fit = S.fit ?? "cover", focus = S.focusY ?? 0.5;
  [S.photo, S.photo2].forEach((p, i) => {
    if (!p) return;
    (globalThis.__loads ||= []).push(new THREE.ImageLoader().loadAsync(`/${p.replace(/^\/+/, "")}`).then((img) => {
      const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
      const ar = img.width / img.height, sa = SW / SH;
      if (fit === "cover") {
        if (ar < sa) { t.repeat.y = ar / sa; t.offset.y = clamp(1 - focus - t.repeat.y / 2, 0, 1 - t.repeat.y); }
        else { t.repeat.x = sa / ar; t.offset.x = (1 - t.repeat.x) / 2; }
      }
      pics[i] = t;
    }));
  });
  return {
    grip: 0,
    apply(ps) {
      const show = clamp(ps.show ?? S.show ?? 1), pic = (ps.pic ?? S.pic ?? 0) >= 0.5 ? 1 : 0, glow = clamp(ps.glow ?? S.glow ?? 0), p = pics[pic] || pics[1 - pic];
      if (p && show > 0.01) { scrM.map = p; scrM.color.setScalar(show); } else { scrM.map = darkScreen(); scrM.color.setScalar(p ? 1 : 0.5 + 0.5 * show); }
      halo.material.opacity = 0.55 * glow; halo.visible = glow > 0.003;
    },
  };
}

// ------------------------------------------------------------------------------------------------ barrier, blocks, tape, sign
let STEEL = null;
const steelTex = () => (STEEL ||= tex(cvs(128, 128, (g, W, H) => {
  const r = rng(515), gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, "#6c7688"); gr.addColorStop(0.4, "#c0c9d8"); gr.addColorStop(1, "#7a8497"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.12)" : "rgba(20,30,50,0.2)"; g.fillRect(r() * W, r() * H, 1 + r() * 2, 4 + r() * 22); }
  for (let i = 0; i < 18; i++) { g.fillStyle = "rgba(150,70,30,0.25)"; g.beginPath(); g.arc(r() * W, r() * H, 1 + r() * 3, 0, Math.PI * 2); g.fill(); }   // a little rust
})));
function buildBarrier(P) {
  const L = P.spec.len ?? 20, g = P.whole, m = std("#ffffff", { map: steelTex(), roughness: 0.4, metalness: 0.35 });
  for (const [y, h] of [[0.96, 0.06], [0.9, 0.04], [0.5, 0.04], [0.1, 0.06]]) put(g, new THREE.BoxGeometry(L, h, 0.05), m, 0, y, 0, true);
  const secs = Math.max(1, Math.round(L / 2)), sl = L / secs;
  for (let s = 0; s <= secs; s++) { const x = -L / 2 + s * sl; put(g, new THREE.BoxGeometry(0.06, 1.0, 0.06), m, x, 0.5, 0, true); put(g, new THREE.BoxGeometry(0.05, 0.05, 0.62), m, x, 0.025, 0, true); }
  const nb = Math.round(L / 0.11), bars = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0125, 0.0125, 0.86, 6), m, nb), D = new THREE.Object3D();
  for (let i = 0; i < nb; i++) { D.position.set(-L / 2 + (i + 0.5) * (L / nb), 0.5, 0); D.updateMatrix(); bars.setMatrixAt(i, D.matrix); }
  bars.castShadow = bars.receiveShadow = false; bars.userData.solid = true; g.add(bars);
  return { grip: 0, apply() {} };
}
function buildBlock(P) {
  const g = P.whole, frame = std("#3a4152", { roughness: 0.45, metalness: 0.3 }), pad = std("#e0561c", { roughness: 0.7 }), pad2 = std("#f0841f", { roughness: 0.7 });
  put(g, new THREE.BoxGeometry(0.6, 0.025, 0.07), frame, 0.3, 0.0125, 0, true);
  for (const x of [0.01, 0.59]) for (const z of [-0.03, 0.03]) put(g, new THREE.ConeGeometry(0.012, 0.05, 6), frame, x, -0.01, z).rotation.x = Math.PI;   // spikes
  for (const [x, m] of [[0.16, pad], [0.42, pad2]]) {
    for (const z of [-0.05, 0.05]) {
      const w = new THREE.Shape(); w.moveTo(0, 0); w.lineTo(0.09, 0); w.lineTo(0, 0.13); w.closePath();
      const wg = new THREE.ExtrudeGeometry(w, { depth: 0.012, bevelEnabled: false }); wg.translate(-0.03, 0.025, z - 0.006); put(g, wg, frame, x, 0, 0, true);
    }
    put(g, new THREE.BoxGeometry(0.016, 0.15, 0.13), m, x - 0.005, 0.1, 0, true).rotation.z = -0.55;
    put(g, new THREE.BoxGeometry(0.02, 0.03, 0.14), frame, x - 0.05, 0.04, 0, true);
  }
  return { grip: 0, apply() {} };
}
let TAPE = null;
const tapeTex = () => (TAPE ||= tex(cvs(256, 32, (g, W, H) => {
  const r = rng(616); g.fillStyle = "#c92f2a"; g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(255,190,170,0.35)"; g.fillRect(0, 2, W, 3); g.fillStyle = "rgba(90,0,0,0.3)"; g.fillRect(0, H - 4, W, 4);
  for (let i = 0; i < 60; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,200,180,0.18)" : "rgba(80,0,10,0.2)"; g.fillRect(r() * W, r() * H, 3 + r() * 24, 1 + r() * 2); }
})));
function buildTape(P) {
  const S = P.spec, g = P.whole, w = S.w ?? 2.6, Y = 0.85, SEG = 30, post = std("#d7deea", { roughness: 0.4 }), baseM = std("#47506a", { roughness: 0.6 });
  for (const sx of [-1, 1]) { put(g, new THREE.CylinderGeometry(0.014, 0.016, 1.0, 10), post, sx * w / 2, 0.5, 0, true); put(g, new THREE.CylinderGeometry(0.06, 0.07, 0.02, 14), baseM, sx * w / 2, 0.01, 0, true); put(g, new THREE.SphereGeometry(0.022, 10, 8), post, sx * w / 2, 1.0, 0, true); }
  const tm = new THREE.MeshStandardMaterial({ map: tapeTex(), roughness: 0.45, side: THREE.DoubleSide });
  const mk = () => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.07, SEG, 1), tm); m.userData.base = m.geometry.attributes.position.array.slice(); ghost(m, 2); g.add(m); return m; };
  const A = mk(), B = mk();
  // a half hangs from its post (p0) and runs `len` toward the cut (dir +-1); snap swings it back (-z) and lets it hang
  const lay = (mesh, p0, dir, len, snap, wave, t) => {
    const pos = mesh.geometry.attributes.position, base = mesh.userData.base;   // read the flat strip, never the last frame's bend
    for (let i = 0; i < pos.count; i++) {
      const u = base[i * 3] + 0.5, vy = base[i * 3 + 1], dd = u * len, k = len > 0 ? dd / len : 0, ang = 1.2 * snap;
      const rip = wave * 0.05 * Math.sin(dd * 7 - t * 9) * (0.3 + 0.7 * k);
      pos.setXYZ(i, p0 + dir * dd * Math.cos(ang), Y + vy - snap * 0.5 * k * k + rip * 0.4, -dd * Math.sin(ang) + rip);
    }
    pos.needsUpdate = true; mesh.geometry.computeVertexNormals(); mesh.geometry.computeBoundingSphere();
  };
  let last = "";
  return {
    grip: 0,
    apply(ps, t) {
      const fin = (v, d) => (Number.isFinite(v) ? v : d);   // a param or the clock arriving undefined/NaN must not reach the vertices
      t = fin(t, 0);
      const snap = clamp(fin(ps.snap ?? S.snap, 0)), wave = fin(ps.wave ?? S.wave, 0), cut = fin(S.cut, 0), key = `${snap},${wave},${wave ? t : 0}`;
      if (key === last) return; last = key;
      lay(A, -w / 2, 1, cut + w / 2, snap, wave, t); lay(B, w / 2, -1, w / 2 - cut, snap, wave, t);
    },
  };
}

// the sign's lettering: marker strokes on a unit box (x right, y down), a little wobble added per letter
const GLYPH = {
  G: [[[0.85, 0.2], [0.6, 0.05], [0.3, 0.08], [0.1, 0.35], [0.1, 0.65], [0.3, 0.92], [0.6, 0.95], [0.88, 0.78], [0.88, 0.52], [0.55, 0.52]]],
  O: [Array.from({ length: 15 }, (_, i) => [0.5 + 0.4 * Math.cos((i / 14) * Math.PI * 2 - 1.2), 0.5 + 0.46 * Math.sin((i / 14) * Math.PI * 2 - 1.2)])],
  S: [[[0.85, 0.18], [0.6, 0.05], [0.3, 0.08], [0.15, 0.3], [0.3, 0.48], [0.65, 0.55], [0.85, 0.7], [0.7, 0.92], [0.4, 0.95], [0.12, 0.82]]],
  P: [[[0.15, 0.95], [0.15, 0.05], [0.65, 0.05], [0.85, 0.22], [0.68, 0.48], [0.15, 0.5]]],
  U: [[[0.15, 0.05], [0.15, 0.7], [0.3, 0.92], [0.6, 0.95], [0.82, 0.72], [0.85, 0.05]]],
  D: [[[0.15, 0.05], [0.15, 0.95]], [[0.15, 0.07], [0.6, 0.1], [0.88, 0.4], [0.85, 0.7], [0.55, 0.93], [0.15, 0.93]]],
};
function signTex(text, seed) {
  return tex(cvs(512, 366, (g, W, H) => {
    const r = rng(seed + 700);
    g.fillStyle = "#b98a55"; g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 7 + r() * 5) { g.fillStyle = r() < 0.5 ? "rgba(255,225,170,0.14)" : "rgba(90,55,20,0.12)"; g.fillRect(0, y, W, 2 + r() * 3); }   // corrugation lines
    for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,230,180,0.14)" : "rgba(90,55,20,0.16)"; g.beginPath(); g.ellipse(r() * W, r() * H, 6 + r() * 30, 4 + r() * 14, 0, 0, Math.PI * 2); g.fill(); }
    const lines = String(text).split("\n"), lh = (H - 70) / Math.max(lines.length, 2);
    g.strokeStyle = "#16120e"; g.lineCap = "round"; g.lineJoin = "round";
    lines.forEach((ln, li) => {
      const n = ln.length, bw = Math.min(lh * 0.78, (W - 80) / (Math.max(n, 1) * 1.12)), bh = lh * 0.86, x0 = (W - n * bw * 1.12) / 2 + bw * 0.06, y0 = 36 + li * lh + (lh - bh) / 2;
      for (let k = 0; k < n; k++) {
        const ch = ln[k].toUpperCase(), gx = x0 + k * bw * 1.12, jit = (v) => v + (r() - 0.5) * 0.06;
        g.save(); g.translate(gx + bw / 2, y0 + bh / 2); g.rotate((r() - 0.5) * 0.12);
        if (GLYPH[ch]) {
          for (let pass = 0; pass < 2; pass++) for (const st of GLYPH[ch]) {
            g.lineWidth = bh * 0.15 * (pass ? 0.8 : 1); g.globalAlpha = pass ? 0.8 : 1; g.beginPath();
            st.forEach(([px, py], i) => { const X = (jit(px) - 0.5) * bw + (pass ? 1.5 : 0), Y = (jit(py) - 0.5) * bh + (pass ? 1 : 0); i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.stroke();
          }
        } else if (ch.trim()) { g.fillStyle = "#16120e"; g.font = `900 ${bh * 0.95}px "Comic Sans MS", "Marker Felt", cursive`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(ch, 0, 0); }
        g.restore(); g.globalAlpha = 1;
      }
    });
    // the rain: dark soaked edges, then a few droplets
    for (const [x0, y0, x1, y1, w, h] of [[0, 0, 0, 46, W, 46], [0, H, 0, H - 46, W, 46], [0, 0, 46, 0, 46, H], [W, 0, W - 46, 0, 46, H]]) {
      const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, "rgba(40,25,12,0.65)"); gr.addColorStop(1, "rgba(40,25,12,0)");
      g.fillStyle = gr; g.fillRect(x0 === W ? W - w : x0, y0 === H ? H - h : y0, w, h);
    }
    for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(210,230,255,0.22)"; g.beginPath(); g.ellipse(r() * W, r() * H, 2 + r() * 3.5, 3 + r() * 5, 0, 0, Math.PI * 2); g.fill(); }
  }), 8);
}
function buildSign(P) {
  const S = P.spec, g = P.whole, W = 0.42, H = 0.3, wood = std("#a8793f", { roughness: 0.8 });
  put(g, new THREE.CylinderGeometry(0.008, 0.009, 0.2, 8), wood, 0, 0.1, -0.014);
  const up = new THREE.Group(); up.position.set(0, 0.2, 0); g.add(up);   // above the break: the rest of the stick and the board
  put(up, new THREE.CylinderGeometry(0.008, 0.008, 0.15, 8), wood, 0, 0.075, -0.014);
  const geo = new THREE.PlaneGeometry(W, H, 12, 8), base = geo.attributes.position.array.slice();
  const front = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: signTex(S.text ?? "GO\nSPUD", S.seed ?? 1), roughness: 0.85, side: THREE.FrontSide }));
  const back = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: "#8a6238", roughness: 0.9, side: THREE.BackSide }));
  front.position.set(0, 0.15, 0); back.position.set(0, 0.15, -0.006); front.castShadow = back.castShadow = false; up.add(front, back);
  let last = -1;
  return {
    grip: 0,
    apply(ps) {
      const cr = ps.crush ?? S.crush, c = clamp(Number.isFinite(cr) ? cr : 0); if (c === last) return; last = c;
      up.rotation.z = -0.7 * c; up.position.y = 0.2 - 0.02 * c;
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let x = base[i * 3], y = base[i * 3 + 1];
        const fold = Math.max(0, x * 0.8 + y * 0.6 - 0.02) * 3.2, z = c * (0.05 * Math.sin(x * 24 + y * 9) + 0.04 * Math.cos(y * 31 - x * 7) + 0.12 * fold * fold + 0.05 * Math.sin(x * 60 + 1.3) * Math.sin(y * 45));
        x *= 1 - 0.24 * c * (1 - 0.3 * Math.abs(y / (H / 2))); y *= 1 - 0.2 * c;
        p.setXYZ(i, x, y - 0.03 * c * Math.max(0, x * 4), z);
      }
      p.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
    },
  };
}

// ------------------------------------------------------------------------------------------------ kinds
export const STADIUM_KINDS = {
  stadium(P) { const st = buildStadium(P); return { grip: 0, apply(ps) { st.floorTint(clamp(ps.wet ?? P.spec.wet ?? 1)); } }; },
  stadiumcrowd: (P) => buildCrowd(P),
  floodlight: (P) => buildFloodlight(P),
  bigscreen: (P) => buildScreen(P),
  crowdbarrier: (P) => buildBarrier(P),
  startblock: (P) => buildBlock(P),
  finishtape: (P) => buildTape(P),
  cardsign: (P) => buildSign(P),
};
