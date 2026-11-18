import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rng, clamp } from "./util.js";
import { canvas } from "./set-porch.js";

// "bankhall": the bank's counter hall in late-day sun. "Does money make you happy?" (happiness 01, draft 2, scene S3a: the hold-up
// at the teller window). DESIGN.md section 11.5 of storyboards/series/happiness/01-does-money-make-you-happy. Triangle budget 30k
// (measured at build, printed with spec diag: true). NO word, letter or number anywhere in the room (the clock has twelve plain ticks).
//
// USE: a swap room   { "at": 3.8, "room": { "type": "bankhall", "pos": [200, 0, 0], ...keys } }  (env swap, set-env.js), or the main set.
//   Everything below is in the HALL FRAME = the room's own origin, metres: a camera or cast member at world (x, y, z) stands at room
//   pos + (x, y, z). Floor y 0, +x is to the right of a lens standing at +z and looking toward -z, the counter runs along z at x 0.
//
// SIZES (DESIGN 11.5): hall x -2.8..+2.4, z -3.5..+2.5, 3.2 tall. Walls on x -2.8, x +2.4 and z -3.5 and the ceiling; NO wall at z +2.5
//   (the floor goes on to z +6.5 and the room's background is a warm dark, so a lens may stand out to z +6). The room is a stage set.
//   FLOOR      0.5 m checker, cream #e9e2d0 / sage #8fa39a, drawn veins (one 2 x 2 m canvas, 16 cells, tied to the hall frame: a cell edge
//              lies on x 0 and z 0). WALLS walnut wainscot to y 0.9 (#6a4426, 0.5 x 0.55 panels, cap rail), plaster #cfd8c8 above, a skirting,
//              a plain cornice 0.12 and a plain pale ceiling (the top third of the key shots stays calm for captions: no beams, no lamps).
//   COUNTER    x -0.25..+0.25, z -2.2..+1.2, top y 0.50: a marble slab 0.05 thick (#f1ece0, grey veins) overhanging to x +-0.29 and 0.02 at
//              the ends, a walnut body with 5 inset marble panels on the customer side (x < 0), a brass kick rail at x -0.355, y 0.13.
//              On the teller side the body stands on the platform.
//   PLATFORM   x 0..+2.4, z -3.5..+1.2, top y 0.30 (the tellers' floor), walnut, a brass nosing on the +z edge, a 0.15 step at z 1.2..1.5 x 1.2..2.0.
//   SCREEN     brass, in the plane x 0 along the counter (z -2.2..+1.2): bars r 0.012 every 0.10 from the slab (y 0.50) to the top rail
//              (y 1.30, r 0.02), 7 ball finials (r 0.04) on posts at both ends, at z -1.65, -1.1, +0.8 and on the two jambs of the
//              teller window. ONE open arch, the TELLER WINDOW: z -0.42..+0.42, y 0.50..1.30, NO bars below a shallow brass arch
//              (springs at y 1.10 on the jambs, crown y 1.30; a few short bars above it). The cashier shows in it from the waist up.
//              A brass sill plate lies flush on the slab in the window (0.003 proud of y 0.50).
//   BACK WALL  z -3.5: a riveted steel surround 3.0 x 2.8 (x -2.75..+0.25) with the VAULT DOOR SHUT in it: disc d 2.36, centre
//              VAULT_DOOR (-1.25, 1.18, -3.5) in x, y; its front (the wheel side) faces the hall: a trim ring, a stepped plate, a ship's
//              wheel d 0.90 with 8 spokes and knobs, a hub, a ribbed collar ring, a hinge pillar at x +0.05. A steel ring behind Spud.
//   DRESSING   a teller's desk (x 1.65..2.35, z -1.3..-0.1, top y 0.75 on the platform) with a blotter and a GREEN LAMP (lit) at LAMP
//              (1.9, 0.75, -0.7), a warm patch on the desk; a LOBBY CLOCK r 0.28 on the right wall at CLOCK (2.37, 2.05, 0.85) facing -x;
//              a queue line of 3 brass posts at (-2.1, z -2.0 / -0.8 / +0.4), scale 0.6 (0.57 tall), a blue velvet rope between them
//              (blue, not red: the alarm's red belongs to the vault). Built inside the room (the shared prop kinds greenlamp, lobbyclock
//              and exhibitrope are not needed in the clip's props list).
//   LIGHT      warm late day from behind the lens: the first directional light, key TO (-0.30, 0.62, 0.72) #ffe9c4 at 1.0, fill
//              hemisphere #8fa0b0 at 0.45 (ground #6b5e4a). The toon ramp reads only the first directional light's direction. Only the
//              hood and the gun are black: nothing in the room is.
//
// NAMED POINTS (exported as BANKHALL.*, hall frame): SPUD [-0.95, 0, 0] (face 90 = facing +x), CASHIER [0.72, 0.30, 0] (face -90), TOP 0.50
//   (the counter top), SLOT [0, 0.50, 0] (the arch's sill, where the sacks cross), BAG_WAIT [[0.15, 0.50, -0.62], [0.15, 0.50, -0.96]]
//   (teller ledge, behind the bars), BAG_OUT [[-0.15, 0.50, 0.18], [-0.15, 0.50, -0.18]] (customer ledge), GUN [-0.39, 0.62, 0.20] (the
//   revolver's handle centre in his right fist, `zrevolver` scale 0.9 level: muzzle x -0.10, never past -0.06), VAULT_DOOR, LAMP, CLOCK, CLOCK_FACE,
//   PLATFORM_Y 0.30, ROPE_POSTS, the hall box (HALL) and CAM.twoshot / CAM.overgun { pos, look, fov } (the DESIGN's start cameras; the director fits them).
//   Facing: rot 0 faces +z, rot 90 faces +x, rot -90 faces -x.
//
// SPEC { type: "bankhall", pos, ...   (every time key is a NUMBER, or a key list [[t, v], ...]: linear between keys, held outside)
//   clock: [4, 50]    the lobby clock's [hour, minute] (a pair), or [[t, h, m], ...] a key list (linear). Late day by default.
//   lamp: 1           the green lamp's glow 0..1 (number or key list; 0 = out).
//   light: 1          overall light scale (key and fill), number or key list.
//   diag: false       prints "diag: bankhall tris N" once at build.
// }
// Everything is a function of the story time (globalThis.__setTicks) and these keys: no Math.random, no clock.
export const BANKHALL = {
  HALL: { x0: -2.8, x1: 2.4, z0: -3.5, z1: 2.5, h: 3.2 },
  PLATFORM_Y: 0.3, TOP: 0.5,
  SPUD: [-0.95, 0, 0], SPUD_FACE: 90, CASHIER: [0.72, 0.3, 0], CASHIER_FACE: -90,
  SLOT: [0, 0.5, 0], BAG_WAIT: [[0.15, 0.5, -0.62], [0.15, 0.5, -0.96]], BAG_OUT: [[-0.15, 0.5, 0.18], [-0.15, 0.5, -0.18]],
  GUN: [-0.39, 0.62, 0.2],
  VAULT_DOOR: [-1.25, 1.18, -3.5], LAMP: [1.9, 0.75, -0.7], CLOCK: [2.37, 2.05, 0.85], CLOCK_FACE: [2.34, 2.05, 0.85],
  ROPE_POSTS: [[-2.1, -2.0], [-2.1, -0.8], [-2.1, 0.4]],
  CAM: {
    twoshot: { pos: [-0.1, 0.95, 5.0], look: [-0.12, 0.74, 0], fov: 50 },
    overgun: { pos: [-1.75, 0.9, 0.85], look: [0.72, 0.84, -0.04], fov: 42 },
  },
};

function keyAt(k, t, def = 0) {
  if (k == null) return def;
  if (typeof k === "number") return k;
  if (!k.length) return def;
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) { const [t0, v0] = k[i - 1], [t1, v1] = k[i]; return t1 === t0 ? v1 : v0 + (v1 - v0) * (t - t0) / (t1 - t0); }
  return k[k.length - 1][1];
}
// the clock key: [h, m] or [[t, h, m], ...]
function clockAt(k, t) {
  if (!k) return [4, 50];
  if (typeof k[0] === "number") return k;
  if (t <= k[0][0]) return [k[0][1], k[0][2]];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) { const [t0, h0, m0] = k[i - 1], [t1, h1, m1] = k[i], u = t1 === t0 ? 1 : (t - t0) / (t1 - t0); return [h0 + (h1 - h0) * u, m0 + (m1 - m0) * u]; }
  const l = k[k.length - 1]; return [l[1], l[2]];
}

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
const flat = (color, o = {}) => { const m = std(color, o); m.userData.noOutline = true; return m; };
const basic = (o) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; return m; };
const glowMat = (color, o = {}) => basic({ color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, ...o });
function steam(o, order = 5) { o.traverse((c) => { c.userData.steam = true; c.userData.solid = false; c.castShadow = false; c.receiveShadow = false; if (c.isMesh) c.renderOrder = order; }); return o; }

// merges geometry by material: one mesh per material, so the ink pass and the draw calls stay few
function Bag() {
  const per = new Map(), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), Sc = new THREE.Vector3();
  const api = {
    add(mat, geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
      E.set(rx, ry, rz); Q.setFromEuler(E); M.compose(V.set(x, y, z), Q, Sc.set(sx, sy, sz));
      const g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(M);
      for (const n of Object.keys(g.attributes)) if (n !== "position" && n !== "normal" && n !== "uv") g.deleteAttribute(n);
      if (!per.has(mat)) per.set(mat, []);
      per.get(mat).push(g);
    },
    box(mat, w, h, d, x, y, z, ry = 0, rx = 0, rz = 0) { api.add(mat, new THREE.BoxGeometry(w, h, d), x, y, z, rx, ry, rz); },
    cyl(mat, rt, rb, h, seg, x, y, z, rx = 0, ry = 0, rz = 0) { api.add(mat, new THREE.CylinderGeometry(rt, rb, h, seg), x, y, z, rx, ry, rz); },
    ball(mat, r, x, y, z, w = 12, h = 8) { api.add(mat, new THREE.SphereGeometry(r, w, h), x, y, z); },
    // a box from its two corners (min x, y, z -> max x, y, z)
    span(mat, x0, y0, z0, x1, y1, z1) { api.box(mat, x1 - x0, y1 - y0, z1 - z0, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); },
    flush(parent, cast = false) {
      const out = [];
      for (const [mat, list] of per) { const m = new THREE.Mesh(mergeGeometries(list), mat); m.castShadow = cast; m.receiveShadow = true; parent.add(m); out.push(m); list.forEach((g) => g.dispose()); }
      per.clear(); return out;
    },
  };
  return api;
}
function triCount(root) {
  let n = 0;
  root.traverse((o) => { if (!o.isMesh) return; const g = o.geometry; n += (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); });
  return Math.round(n);
}
const radialTex = (stops) => {
  const [c, g] = canvas(128, 128), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
const texOf = (c, repeat = false) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };

// ---- drawn textures
// one marble cell of `s` px: soft blotches and 3 veins, clipped to the cell
function marbleCell(g, x0, y0, s, base, vein, blot, rnd) {
  g.save(); g.beginPath(); g.rect(x0, y0, s, s); g.clip();
  g.fillStyle = base; g.fillRect(x0, y0, s, s);
  for (let i = 0; i < 12; i++) { g.fillStyle = blot(rnd); g.beginPath(); g.ellipse(x0 + rnd() * s, y0 + rnd() * s, s * (0.08 + rnd() * 0.2), s * (0.05 + rnd() * 0.12), rnd() * 3, 0, Math.PI * 2); g.fill(); }
  for (let v = 0; v < 3; v++) {
    g.strokeStyle = vein(rnd); g.lineWidth = 1 + rnd() * 2.4; g.beginPath();
    let x = x0 + rnd() * s, y = y0 - 8; g.moveTo(x, y);
    for (let k = 0; k < 5; k++) { x += (rnd() - 0.5) * s * 0.35; y += s * (0.2 + rnd() * 0.08); g.quadraticCurveTo(x + (rnd() - 0.5) * s * 0.16, y - s * 0.12, x, y); }
    g.stroke();
  }
  g.restore();
}
// the floor: 4 x 4 cells of 256 px (a cell = 0.5 m, the canvas = 2 m); cream / sage, grout lines
function floorCanvas(rnd) {
  const [c, g] = canvas(1024, 1024);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const cream = (i + j) % 2 === 0;
    marbleCell(g, i * 256, j * 256, 256, cream ? "#e9e2d0" : "#8fa39a",
      (r) => (cream ? `rgba(150,138,112,${0.3 + r() * 0.3})` : `rgba(226,236,230,${0.3 + r() * 0.3})`),
      (r) => (cream ? (r() < 0.5 ? `rgba(255,255,248,${0.05 + r() * 0.08})` : `rgba(160,146,118,${0.04 + r() * 0.06})`) : (r() < 0.5 ? `rgba(210,225,218,${0.05 + r() * 0.07})` : `rgba(60,82,74,${0.05 + r() * 0.08})`)), rnd);
  }
  g.fillStyle = "rgba(96,86,66,0.55)"; for (let i = 0; i <= 4; i++) { g.fillRect(i * 256 - 1.5, 0, 3, 1024); g.fillRect(0, i * 256 - 1.5, 1024, 3); }
  return c;
}
// white-grey counter marble
function slabCanvas(rnd) {
  const [c, g] = canvas(512, 512);
  marbleCell(g, 0, 0, 512, "#f1ece0", (r) => `rgba(120,120,126,${0.35 + r() * 0.35})`, (r) => (r() < 0.5 ? `rgba(255,255,255,${0.1 + r() * 0.1})` : `rgba(175,172,165,${0.05 + r() * 0.07})`), rnd);
  return c;
}
// walnut with long grain (grain runs along the texture's x)
function walnutCanvas(rnd) {
  const [c, g] = canvas(256, 256);
  g.fillStyle = "#6a4426"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) { const y = rnd() * 256; g.strokeStyle = rnd() < 0.5 ? `rgba(40,22,10,${0.1 + rnd() * 0.15})` : `rgba(150,100,56,${0.08 + rnd() * 0.12})`; g.lineWidth = 0.6 + rnd() * 1.6; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(80, y + (rnd() - 0.5) * 8, 170, y + (rnd() - 0.5) * 8, 256, y + (rnd() - 0.5) * 4); g.stroke(); }
  return c;
}

export function buildBankhall(scene, S = {}) {
  const root = new THREE.Group(); root.name = "set-bankhall"; scene.add(root);
  scene.background = new THREE.Color("#2b2620"); scene.fog = null;
  const rnd = rng(1151), B = BANKHALL, H = B.HALL, PY = B.PLATFORM_Y, TOP = B.TOP;
  const W = H.x1 - H.x0, D = H.z1 - H.z0;

  // ---- materials
  const plaster = flat("#cfd8c8", { roughness: 0.9 });
  const floorMap = texOf(floorCanvas(rnd), true), floorM = flat("#ffffff", { map: floorMap, roughness: 0.4 });
  const walnutMap = texOf(walnutCanvas(rnd), true);
  const walnut = std("#ffffff", { map: walnutMap, roughness: 0.55 }); walnut.color.set("#ffffff");
  const walnutWall = flat("#ffffff", { map: walnutMap, roughness: 0.6 });
  const walnutDk = std("#4e3119", { roughness: 0.6 }), walnutLt = std("#8a5f3a", { roughness: 0.55 });
  const marbleMap = texOf(slabCanvas(rnd)), marble = std("#ffffff", { map: marbleMap, roughness: 0.3 });
  const brass = std("#e2b84a", { roughness: 0.35, metalness: 0.25 }), brassDk = std("#9a7424", { roughness: 0.45, metalness: 0.25 });
  const steel = std("#8a9299", { roughness: 0.5, metalness: 0.12 }), steelDk = std("#555d66", { roughness: 0.6, metalness: 0.1 }), steelLt = std("#a5acb2", { roughness: 0.35, metalness: 0.2 }), rivetM = std("#aab2b8", { roughness: 0.4, metalness: 0.15 });
  const bag = Bag();

  // ---- floor: x -2.8..+2.4, z -3.5..+6.5 (a lens may stand out to z +6); uv in the hall frame so a checker cell edge lies on x 0, z 0
  { const x0 = H.x0, x1 = H.x1, z0 = H.z0, z1 = 6.5, g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([x0, 0, z1, x1, 0, z1, x1, 0, z0, x0, 0, z0], 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute([x0 / 2, -z1 / 2, x1 / 2, -z1 / 2, x1 / 2, -z0 / 2, x0 / 2, -z0 / 2], 2));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    const f = new THREE.Mesh(g, floorM); f.name = "bank-floor"; f.receiveShadow = true; root.add(f); }

  // ---- walls (planes facing in), ceiling
  const hh = H.h, zc = (H.z0 + H.z1) / 2, xc = (H.x0 + H.x1) / 2;
  const wallB = new THREE.Mesh(new THREE.PlaneGeometry(W, hh), plaster); wallB.position.set(xc, hh / 2, H.z0); wallB.name = "bank-wall-back"; root.add(wallB);
  const wallL = new THREE.Mesh(new THREE.PlaneGeometry(D, hh), plaster); wallL.rotation.y = Math.PI / 2; wallL.position.set(H.x0, hh / 2, zc); wallL.name = "bank-wall-left"; root.add(wallL);
  const wallR = new THREE.Mesh(new THREE.PlaneGeometry(D, hh), plaster); wallR.rotation.y = -Math.PI / 2; wallR.position.set(H.x1, hh / 2, zc); wallR.name = "bank-wall-right"; root.add(wallR);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), flat("#e6e4cf", { roughness: 0.95, emissive: "#8a8468", emissiveIntensity: 0.55 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(xc, hh, zc); ceil.name = "bank-ceiling"; root.add(ceil);
  // wainscot: walnut to y 0.9 (0.04 proud), 0.5 x 0.55 raised panels every 0.6, a cap rail, a skirting; cornice
  const wP = 0.04, cap = 0.9;
  const wain = (nx, nz, len, cx, cz, alongX) => {   // a wall run: centre (cx, cz), along x or z; the wall's inward normal (nx, nz)
    const ox = nx * wP / 2, oz = nz * wP / 2;
    if (alongX) bag.box(walnutWall, len, cap, wP, cx + ox, cap / 2, cz + oz); else bag.box(walnutWall, wP, cap, len, cx + ox, cap / 2, cz + oz);
    const n = Math.floor(len / 0.6), x0 = -(n - 1) * 0.3;
    for (let i = 0; i < n; i++) { const u = x0 + i * 0.6;
      if (alongX) bag.box(walnutDk, 0.5, 0.55, 0.016, cx + u + nx * (wP + 0.004), 0.5, cz + nz * (wP + 0.004)); else bag.box(walnutDk, 0.016, 0.55, 0.5, cx + nx * (wP + 0.004), 0.5, cz + u + nz * (wP + 0.004)); }
    if (alongX) { bag.box(walnutLt, len, 0.05, 0.075, cx + nx * 0.055, cap + 0.0, cz + nz * 0.055); bag.box(walnutDk, len, 0.12, 0.07, cx + nx * 0.05, 0.06, cz + nz * 0.05); }
    else { bag.box(walnutLt, 0.075, 0.05, len, cx + nx * 0.055, cap + 0.0, cz + nz * 0.055); bag.box(walnutDk, 0.07, 0.12, len, cx + nx * 0.05, 0.06, cz + nz * 0.05); }
  };
  wain(0, 1, W, xc, H.z0, true); wain(1, 0, D, H.x0, zc, false); wain(-1, 0, D, H.x1, zc, false);
  const cornice = flat("#e2e4d2", { roughness: 0.9, emissive: "#8a8468", emissiveIntensity: 0.4 });
  bag.box(cornice, W, 0.12, 0.12, xc, hh - 0.06, H.z0 + 0.06); bag.box(cornice, 0.12, 0.12, D, H.x0 + 0.06, hh - 0.06, zc); bag.box(cornice, 0.12, 0.12, D, H.x1 - 0.06, hh - 0.06, zc);

  // ---- platform (the tellers' floor): x 0..2.4, z -3.5..1.2, top y 0.30, brass nosing, a step
  bag.span(walnutDk, 0, 0, H.z0, H.x1, PY - 0.02, 1.2);
  bag.span(walnutLt, 0, PY - 0.02, H.z0, H.x1, PY, 1.2);
  bag.box(brass, H.x1, 0.025, 0.04, H.x1 / 2, PY - 0.012, 1.215);
  bag.span(walnutDk, 1.2, 0, 1.2, 2.0, 0.13, 1.5); bag.span(walnutLt, 1.2, 0.13, 1.2, 2.0, 0.15, 1.5); bag.box(brass, 0.8, 0.02, 0.03, 1.6, 0.14, 1.485);

  // ---- counter: body, slab, 5 inset panels, kick rail
  bag.span(walnut, -0.25, 0, -2.2, 0.25, TOP - 0.05, 1.2);
  bag.span(marble, -0.29, TOP - 0.05, -2.22, 0.29, TOP, 1.22);
  bag.box(brass, 0.02, 0.012, 3.44, -0.285, TOP - 0.056, -0.49);   // a brass lip under the slab edge, customer side
  { const pw = 0.56, gap = (3.4 - 5 * pw) / 6;
    for (let i = 0; i < 5; i++) { const z = -2.2 + gap + pw / 2 + i * (pw + gap);
      bag.box(walnutDk, 0.012, 0.37, pw + 0.05, -0.256, 0.24, z); bag.box(marble, 0.012, 0.31, pw - 0.01 + 0.0, -0.264, 0.24, z); } }
  bag.cyl(brass, 0.022, 0.022, 3.0, 10, -0.355, 0.13, -0.5, Math.PI / 2);
  for (const z of [-1.9, -0.5, 0.9]) bag.box(brassDk, 0.09, 0.03, 0.04, -0.31, 0.13, z);

  // ---- brass screen in the plane x 0
  { const bars = [], R = 0.541, cy = 1.30 - R;
    const archY = (z) => cy + Math.sqrt(R * R - z * z);
    for (let i = 0; i < 34; i++) { const z = -2.15 + i * 0.1;
      if (Math.abs(z) < 0.42) { const y0 = archY(z) + 0.004; if (1.30 - y0 > 0.02) bars.push([z, y0, 1.30]); } else bars.push([z, TOP, 1.30]); }
    for (const [z, y0, y1] of bars) bag.cyl(brass, 0.012, 0.012, y1 - y0, 6, 0, (y0 + y1) / 2, z);
    bag.cyl(brass, 0.02, 0.02, 3.44, 10, 0, 1.30, -0.5, Math.PI / 2);                    // top rail
    bag.box(brass, 0.04, 0.035, 3.44, 0, TOP + 0.02, -0.5);                               // the foot rail on the slab
    for (const z of [-0.42, 0.42]) bag.cyl(brass, 0.02, 0.02, 1.10 - TOP, 8, 0, (TOP + 1.10) / 2, z);   // the jambs
    const ang = Math.asin(0.42 / R);
    bag.add(brass, new THREE.TorusGeometry(R, 0.014, 6, 20, 2 * ang), 0, cy, 0, 0, Math.PI / 2, Math.PI / 2 - ang);   // the arch
    for (const z of [-2.2, -1.65, -1.1, 0.8, 1.2]) { bag.cyl(brass, 0.022, 0.022, 1.30 - TOP, 8, 0, (TOP + 1.30) / 2, z); bag.ball(brass, 0.04, 0, 1.30 + 0.045, z); }
    for (const z of [-0.42, 0.42]) bag.ball(brass, 0.04, 0, 1.10 + 0.045, z);
    bag.box(brass, 0.30, 0.004, 0.84, 0, TOP + 0.001, 0);                                  // the sill plate
  }

  // ---- back wall: riveted steel surround 3.0 x 2.8 with the vault door shut
  { const [dx, dy, dz] = B.VAULT_DOOR, sx = dx, sz = dz + 0.05, front = dz + 0.10;   // surround front face at z -3.40
    bag.box(steel, 3.0, 2.8, 0.10, sx, 1.4, sz);
    for (let r = 1; r < 4; r++) bag.box(steelDk, 3.0, 0.02, 0.012, sx, r * 0.7, front + 0.002);   // plate seams: rows 0.7
    for (const x of [-1.5, -0.5, 0.5, 1.5]) bag.box(steelDk, 0.02, 2.8, 0.012, sx + x * 0.98, 1.4, front + 0.002);
    const rv = []; for (let x = sx - 1.44; x <= sx + 1.44 + 1e-6; x += 0.24) for (const y of [0.07, 2.73]) rv.push([x, y]);
    for (let y = 0.31; y <= 2.5; y += 0.24) for (const x of [sx - 1.45, sx + 1.45]) rv.push([x, y]);
    const rg = new THREE.OctahedronGeometry(0.022, 0); for (const [x, y] of rv) bag.add(rivetM, rg, x, y, front + 0.006, 0, 0, 0, 1, 1, 0.6);
    // collar ring: r 1.20..1.38, 0.07 deep, with 36 ribs
    { const sh = new THREE.Shape(); sh.absarc(0, 0, 1.38, 0, Math.PI * 2, false); const hole = new THREE.Path(); hole.absarc(0, 0, 1.19, 0, Math.PI * 2, true); sh.holes.push(hole);
      bag.add(steelDk, new THREE.ExtrudeGeometry(sh, { depth: 0.07, bevelEnabled: false, curveSegments: 40 }), dx, dy, front); }
    for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; bag.box(steel, 0.17, 0.035, 0.03, dx + Math.cos(a) * 1.285, dy + Math.sin(a) * 1.285, front + 0.085, 0, 0, a); }
    const cz = dz + 0.20;   // the disc's centre: z -3.30, 0.30 thick (z -3.45..-3.15)
    bag.cyl(steelLt, 1.18, 1.18, 0.30, 56, dx, dy, cz, Math.PI / 2);
    bag.cyl(steel, 1.14, 1.14, 0.02, 56, dx, dy, cz + 0.16, Math.PI / 2);
    bag.add(steelLt, new THREE.TorusGeometry(0.98, 0.03, 6, 48), dx, dy, cz + 0.17);
    bag.cyl(steelDk, 0.62, 0.62, 0.05, 32, dx, dy, cz + 0.18, Math.PI / 2);
    bag.add(steelLt, new THREE.TorusGeometry(0.45, 0.03, 6, 32), dx, dy, cz + 0.28);
    bag.cyl(steelLt, 0.12, 0.12, 0.16, 16, dx, dy, cz + 0.25, Math.PI / 2);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; bag.box(steelLt, 0.34, 0.04, 0.04, dx + Math.cos(a) * 0.28, dy + Math.sin(a) * 0.28, cz + 0.28, 0, 0, a); bag.ball(steelLt, 0.05, dx + Math.cos(a) * 0.52, dy + Math.sin(a) * 0.52, cz + 0.28, 8, 6); }
    // hinge pillar at x +1.30 with three knuckles and three arms
    bag.cyl(steelDk, 0.07, 0.07, 2.5, 12, dx + 1.30, 1.25, dz + 0.20);
    for (const y of [0.55, 1.15, 1.75]) { bag.cyl(steel, 0.1, 0.1, 0.14, 12, dx + 1.30, y, dz + 0.20); bag.box(steelDk, 0.2, 0.12, 0.1, dx + 1.23, y, dz + 0.20); }
  }

  // ---- dressing: the desk, the blotter, the lamp, the clock, the queue posts
  { const dx0 = 1.65, dx1 = 2.35, dz0 = -1.3, dz1 = -0.1, dt = 0.75;
    bag.span(walnutLt, dx0, dt - 0.04, dz0, dx1, dt, dz1);
    for (const [x, z] of [[dx0 + 0.03, dz0 + 0.03], [dx0 + 0.03, dz1 - 0.03], [dx1 - 0.03, dz0 + 0.03], [dx1 - 0.03, dz1 - 0.03]]) bag.box(walnut, 0.06, dt - 0.04 - PY, 0.06, x, (PY + dt - 0.04) / 2, z);
    bag.span(walnutDk, dx0 + 0.06, dt - 0.30, dz0 + 0.02, dx0 + 0.08, dt - 0.04, dz1 - 0.02);   // a front apron
    bag.box(std("#33544a", { roughness: 0.9 }), 0.36, 0.008, 0.46, 1.95, dt + 0.004, -0.62);   // the blotter
    // the green lamp at LAMP: brass base, stem, green dome shade (open below), a warm bulb
    const [lx, ly, lz] = B.LAMP;
    bag.cyl(brass, 0.07, 0.08, 0.03, 14, lx, ly + 0.015, lz); bag.cyl(brass, 0.012, 0.012, 0.28, 8, lx, ly + 0.17, lz); bag.cyl(brass, 0.022, 0.022, 0.03, 8, lx, ly + 0.31, lz);
    bag.add(std("#2f6b45", { roughness: 0.4, side: THREE.DoubleSide }), new THREE.SphereGeometry(0.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), lx, ly + 0.30, lz, 0, 0, 0, 1, 0.8, 1);
  }
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), basic({ color: "#fff0b8" })); bulb.position.set(B.LAMP[0], B.LAMP[1] + 0.27, B.LAMP[2]); root.add(steam(bulb, 4));
  const patchM = glowMat("#ffd27a", { map: radialTex([[0, "rgba(255,255,255,0.8)"], [0.5, "rgba(255,255,255,0.25)"], [1, "rgba(255,255,255,0)"]]), opacity: 0 });
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), patchM); patch.rotation.x = -Math.PI / 2; patch.position.set(B.LAMP[0], B.LAMP[1] + 0.012, B.LAMP[2]); root.add(steam(patch, 4));
  // the queue line: 3 posts at scale 0.6 (0.57 tall, foot r 0.084, ball r 0.03) and a blue velvet rope with a sag
  { const rope = std("#2d4f7c", { roughness: 0.9 });
    for (const [x, z] of B.ROPE_POSTS) { bag.cyl(brass, 0.084, 0.096, 0.03, 16, x, 0.015, z); bag.cyl(brass, 0.018, 0.018, 0.5, 8, x, 0.28, z); bag.ball(brass, 0.03, x, 0.58, z, 10, 8); bag.box(brassDk, 0.03, 0.02, 0.02, x + 0.025, 0.48, z, 0); }
    for (let i = 0; i < 2; i++) { const [x, za] = B.ROPE_POSTS[i], [, zb] = B.ROPE_POSTS[i + 1], pts = [];
      for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push(new THREE.Vector3(x + 0.025, 0.48 - 0.1 * 4 * u * (1 - u), za + (zb - za) * u)); }
      bag.add(rope, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.014, 6, false)); } }
  bag.flush(root);

  // lobby clock on the right wall, facing -x: ring, cream face, 12 plain ticks, hour and minute hands (pivots, moved by `clock`)
  const clock = new THREE.Group(); clock.position.set(...B.CLOCK); clock.rotation.y = -Math.PI / 2; clock.name = "bank-clock"; root.add(clock);
  const hourP = new THREE.Group(), minP = new THREE.Group();
  { const cb = Bag(), face = std("#f6efdb", { roughness: 0.8 }), rim = std("#6a4426", { roughness: 0.5 }), ink = std("#3a342c", { roughness: 0.8 }), r = 0.28;
    cb.cyl(rim, r, r, 0.06, 32, 0, 0, 0, Math.PI / 2); cb.cyl(face, r - 0.03, r - 0.03, 0.02, 32, 0, 0, 0.032, Math.PI / 2);
    cb.add(brass, new THREE.TorusGeometry(r - 0.02, 0.012, 6, 32), 0, 0, 0.034);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, big = i % 3 === 0, d = r - 0.07 - (big ? 0.015 : 0); cb.box(ink, 0.014, big ? 0.06 : 0.035, 0.008, Math.sin(a) * d, Math.cos(a) * d, 0.042, 0, 0, -a); }
    cb.flush(clock);
    const hb = Bag(); hb.box(ink, 0.022, 0.15, 0.008, 0, 0.065, 0); hb.flush(hourP); hourP.position.z = 0.048;
    const mb = Bag(); mb.box(ink, 0.014, 0.22, 0.008, 0, 0.1, 0); mb.flush(minP); minP.position.z = 0.056;
    clock.add(hourP, minP); const hub = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), brass); hub.position.z = 0.058; clock.add(hub); }

  // ---- lights (inside this room's group): the first directional light is the late-day key, what the toon ramp reads
  const L0 = S.light ?? 1;
  const key = new THREE.DirectionalLight("#ffe9c4", 1.0), kt = new THREE.Object3D(); key.name = "bank-key"; key.castShadow = false; root.add(kt); key.target = kt;
  key.position.set(-0.30, 0.62, 0.72).normalize().multiplyScalar(20); root.add(key);
  const hemi = new THREE.HemisphereLight("#8fa0b0", "#6b5e4a", 0.45); hemi.name = "bank-fill"; root.add(hemi);

  const tris = triCount(root); B.counts = { tris };
  if (S.diag) console.log(`diag: bankhall tris ${tris}`);
  const tick = (t) => {
    const L = S.light != null ? keyAt(S.light, t, 1) : L0;
    key.intensity = 1.0 * L; hemi.intensity = 0.45 * L;
    const lamp = clamp(keyAt(S.lamp, t, 1));
    patchM.opacity = 0.55 * lamp; bulb.visible = lamp > 0.02; bulb.material.color.set("#fff0b8").multiplyScalar(0.4 + 0.6 * lamp);
    const [h, m] = clockAt(S.clock, t);
    minP.rotation.z = -(m / 60) * Math.PI * 2; hourP.rotation.z = -(((h % 12) + m / 60) / 12) * Math.PI * 2;
  };
  tick(0); (globalThis.__setTicks ||= []).push(tick);
  return root;
}
