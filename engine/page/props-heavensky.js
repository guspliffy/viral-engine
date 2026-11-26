import * as THREE from "three";
import { clamp, rng } from "./util.js";

// Potato Desk "heaven steps": THE SKY, THE ZONE CLOUDS, HELL'S FLOOR, THE HATCH, THE PARASOL (storyboards/series/potato-desk/heaven-steps/DESIGN.md
// sections 2 "Sky and cloud" + "Hell's floor", 4). Axes: x right, y up, +z toward the camera = DOWNHILL, metres. Station B = the world origin (y 0 = hell's
// floor); every size and hex colour is the DESIGN's. Every mark (crack, rust smear, scallop, crag) is placed once from a fixed seed. Everything animated is a
// pure function of the prop state and the clip time t (no clock, no Math.random). Nothing here is hand-held: HSKY_GRIPS is empty (the small demon only
// stands on the hatch's rung and holds its lid; the lid is not a prop of its own).
// STATE KEYS. propState tweens `open` and `glow` (known numbers); anything else is spec only. The director may set `spec.loop` (seconds, e.g. the clip
// length) on stairsky / zoneclouds / hellhatch: drift, bob and flicker then close on the last frame (same pose at t = 0 and t = loop).
//
// stairsky     the backdrop drum. Origin: the WORLD origin (place at x 0, y 0, z 0). Unlit, open drum r 90 round (0, -28), y -10..+45, ONE vertical gradient
//              by world height: -6 #1f0f12, 2 #8f2f22, 7 #d9652e, 12 #b9806a, 16 #7f8399, 20 #9fb9d6, 23 #9fd0f0, 30 #d9eefb, 40 #eef8ff (flat caps #1f0f12
//              below, #eef8ff above). No sun, no lettering, no keys. The far plane must reach 135 m from any camera (sb.far 160 as the DESIGN says; the
//              engine default 300 does too). See-through for every check.
// zoneclouds   108 OPAQUE two-tone puffs (unlit vertex colours, no alpha), 4 instanced draws by zone: 26 white r 0.8-2.2 y 19.5-24 (#fbfdff / #dbe7ef, sunlit
//              edge #fff1c2), 34 grey r 1.2-3.0 y 15-20 (#8b8fa3 / #5f6378, pale tops #a9adbf), 40 orange r 1.2-3.2 y 4.5-15 (#f0935a / #b9502e, deep
//              #7a2f24), 8 dark smoke low y 1.4-5 (#5a2a24 / #3a1f22). Origin: the WORLD origin (place at 0, 0, 0): the puffs are built in world coordinates
//              from the stair's layout (riser n z = -0.50 (n - 2) - 0.70 floor((n - 1) / 10), tread y 0.22 n, decade offsets 0 0 +1.3 0 -1.3 0 +1.3 0 -1.3 0):
//              every puff stays 0.9 m outside the parapets (3D, ellipsoid vs the 100 step boxes + landings + terrace), out of the sight line of the 32
//              camera entries of DESIGN section 0 (camera to subject, narrower cone than the lens), and off the strip |x| < 4 behind the terrace (rows 200-610
//              of the T shots are sky and rays only). 3 grey puffs dip into the orange band and 3 orange rise into the grey (y 13.5-17), 3 white dip into the
//              grey band and 3 grey rise into the white (y 18-21.5): the interleave at the two borders. Each puff has its own size, flattening and turn. Drift
//              0.03 m/s toward -x, bob 0.02 m at 0.2 Hz, phase by index. Keys (spec): loop 0 (s; > 0 = drift is a sine of that period with the same peak
//              speed, bob frequency snaps to a whole number of cycles), speed 1 (drift x), seed 1. Clouds cast no shadow, see-through for every check.
// hellfloor    hell's floor. Origin: the world origin = station B (place at 0, 0, 0). Rock slab x -4.5..+4.5, z -3.0 (spec.z0; the DESIGN's slab starts at +0.5,
//              this one runs 3.5 m under the stair's foot so nothing floats) .. +6.5, top y 0, 0.50 thick, #5a2320, 9 glowing cracks #ff7a1c (core #ffd23f,
//              emissive map) each its own path, faint plate lines; a round hole r 0.60 at (-0.65, 1.30) (spec.hole [x, z, r], [] = none) for the hatch's
//              shaft; 7 crags #3a1f22 with lit edges #8f2f22, 1.2-3.4 high, all at |x| >= 2.6 (4 left, 3 right, z -2.5..+5). The slab and crags are solid for the
//              contact checks (a body sits on them). The 6 smokewisp + 1 embers boxes are the existing kinds: the bench places them (coordinates in
//              make-sky-bench.mjs: wisps at x -3.4 -2.8 -1.9 2.3 3.0 3.6, embers box [[-3.5,0.3,-2],[3.5,3.2,4]]). No keys.
// hellhatch    hell's door. Origin: the CENTRE of the ring on the floor (place at -0.65, 0, 1.30), faces +z, hinge at the BACK (-z). Iron ring r 0.585 inner /
//              0.72 outer, 0.10 high #3a2f30, 8 rivets r 0.03 #55484a, 4 clamps + the hinge brackets; the ring's inner wall continues 1.4 m down as the shaft
//              (lit orange at the top, dark at the bottom). Lid r 0.55, 0.06 thick, domed 0.015 #4b3b3b, edge #6a5552, 4-spoke handwheel r 0.20 #2b2228
//              (top 0.17), 5 rust smears #7a3a22. Seam between lid and ring #ff7a1c, core #ffd23f, flicker 10 % on 12 arc segments with fixed phases; 6 lava
//              cracks 0.4-0.9 long on the floor round the ring (card 3.4 x 3.4 at y 0.004). `open` 0..1 (TWEENS, default 0): the lid lifts open x 35 deg on its
//              back hinge (range -0.05..1.15 for overshoot), an orange light fan (card 2.6 x 1.8, additive) rises from the opening, a rung is revealed: top at
//              y -0.36 (width 0.95, the small demon stands on it at local (0, -0.36, +0.32) = world (-0.65, -0.36, 1.62)), a second rung at -0.80. `glow` 0..1
//              (TWEENS, default 1): seam + cracks + floor pool r 1.6 at 40 % (card 3.2 x 3.2 at y 0.006). Ring and lid are solid; pool, cracks, fan see-through.
//              `fall` 0..1 (TWEENS, default 0 = nothing changes; Heaven's terms, DESIGN section 6): the lid swings DOWN 85 x fall degrees about the same back hinge
//              into the shaft (it hangs against the back wall, handwheel toward the lens); with it a glow disc r 0.55 at local y -1.30 in the shaft (#ffb21c, core
//              r 0.30 #ffe46a, unlit, shown from fall 0.02) and the light fan (as for `open`). Set it with { do: "prop", set: { fall: 1 }, dur } (the DESIGN: dur
//              0.1 s = 3 frames, ease "in"); the 1-frame 4 degree rebound is a second set { fall: 0.953 } for 1 frame, then 1. While fall > 0 `glow` may go to 1.5
//              (1 -> 1.4 for 6 frames): above 1 the pool and the fan brighten, the seam stays at its full colour. Range -0.05..1.1 (overshoot).
// parasol      origin: the base centre on the floor (place at 1.60, 0, 0.60). Round base r 0.18 (0.04 high, #f4f1e8), pole diameter 0.03 #f4f1e8 to y 1.75, a
//              finial ball. Canopy r 0.65, 8 gores red #d3261e / cream #f2ebe0 (two-sided), scalloped rim (0.05 sag per gore), apex 0.20 above the rim, hung on
//              the pole top (y 1.75 = apex 1.78, rim ~1.58) and tilted spec.tilt degrees (default 12, the screen-LEFT side drops, toward the chair). Not held.
//              Only its pole and a sliver of canopy may show at the right edge of cameras 21 and 25: it is never whole in frame.

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
const basic = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, ...o }); m.fog = false; m.toneMapped = false; return m; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const box = (w, h, d, m, parent, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z);
function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const ss = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const flat = (o, shadow = false) => { o.castShadow = shadow; o.userData.solid = false; o.userData.steam = true; return o; };
const see = (root) => root.traverse((o) => { if (o.isMesh) { o.userData.solid = false; o.userData.steam = true; o.castShadow = false; } });
const noHatch = (...ms) => { for (const m of ms) m.userData.noHatch = true; return ms[0]; };
const noLine = (...ms) => { for (const m of ms) { m.userData.noHatch = true; m.userData.noOutline = true; } return ms[0]; };
// an unlit see-through light card (fog off, no outline)
const glowMat = (tex, o = {}) => { const m = basic("#ffffff", { map: tex, transparent: true, depthWrite: false, ...o }); m.userData.noOutline = true; m.userData.noHatch = true; m.userData.glow = true; return m; };
function plane(w, h, m, parent, x, y, z, rx = 0) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.x = rx; o.castShadow = false; o.receiveShadow = false; parent.add(o); return o; }
const hexRGB = (c) => { const k = new THREE.Color(c); return [k.r * 255, k.g * 255, k.b * 255]; };
// a loop-safe frequency: a whole number of cycles in `loop` seconds (loop 0 = as asked)
const snapHz = (hz, loop) => (loop > 0 ? Math.max(1, Math.round(hz * loop)) / loop : hz);

// ---- the sky -----------------------------------------------------------------------------------------------------------------------------------------
const SKY = [[-6, "#1f0f12"], [2, "#8f2f22"], [7, "#d9652e"], [12, "#b9806a"], [16, "#7f8399"], [20, "#9fb9d6"], [23, "#9fd0f0"], [30, "#d9eefb"], [40, "#eef8ff"]];
const SKY_Y0 = -10, SKY_Y1 = 45;

// ---- the stair's layout, as far as the clouds need it ----------------------------------------------------------------------------------------------------
const OFF = [0, 0, 1.3, 0, -1.3, 0, 1.3, 0, -1.3, 0];   // decade offsets of the flights (steps 1-10, 11-20 ... 91-100)
const zr = (n) => -0.5 * (n - 2) - 0.7 * Math.floor((n - 1) / 10);
const xo = (n) => OFF[Math.floor((n - 1) / 10)];
function stairBoxes() {   // [x0, x1, y0, y1, z0, z1] of every step with its parapets (flights 2.54 wide, landings both flights together), + the terrace
  const out = [];
  for (let n = 1; n <= 100; n++) {
    const land = n % 10 === 0 && n < 100, y = 0.22 * n;
    if (land) { const a = OFF[n / 10 - 1], b = OFF[n / 10]; out.push([Math.min(a, b) - 1.27, Math.max(a, b) + 1.27, y - 0.3, y + 0.5, zr(n) - 1.2, zr(n)]); }
    else out.push([xo(n) - 1.27, xo(n) + 1.27, y - 0.3, y + 0.5, zr(n) - 0.5, zr(n)]);
  }
  out.push([-2.7, 2.7, 21.6, 24.0, -59.7, -55.7]);   // the terrace with the gate and the podium
  return out;
}
// the camera entries of DESIGN section 0 in world coordinates (station origin + local), camera -> subject, fov (28, the ride, is a path: left out)
const ST = { T: [0, 22.0, -55.3], N: [-0.7, 19.8, -49.6], M: [1.2, 13.42, -33.7], B: [0, 0, 0] };
const CAMS = [
  ["T", [0.45, 0.89, 9.6], [0.45, 0.89, 0], 26], ["T", [-0.15, 0.22, 5.9], [-0.15, 0.22, 0.25], 24], ["T", [-0.4, -0.05, 8.4], [-0.4, -0.05, 0.5], 26],
  ["T", [0.2, 0.8, 10.6], [0.2, 0.8, 0], 26], ["T", [-0.4, 0.75, 6.6], [-0.4, 0.75, -1], 26], ["T", [0.55, 0.72, 7], [0.55, 0.72, -0.25], 26],
  ["T", [0.85, 0.72, 5.2], [1.15, 0.72, -1.1], 26], ["T", [2.1, 1.3, 4.8], [0.15, 0.15, 0.3], 30], ["T", [0.3, -1.45, 5.9], [-0.3, 0.45, -1], 32],
  ["N", [2.5, 0.75, 5.6], [-0.3, 0.38, -0.75], 26], ["N", [2, 0.6, 4.3], [-0.38, 0.42, -0.8], 26], ["T", [1.6, 2.45, -0.25], [1.05, 0.46, -0.8], 40],
  ["N", [1.9, 1.75, 2.4], [0, 0.35, -1.3], 30], ["N", [6.7, -2.8, 20.6], [0.7, -3.2, 7.6], 40], ["M", [-1.6, 0.9, 5.2], [-0.1, 0.4, -0.3], 26],
  ["M", [-1.45, 0.8, 5.35], [0.25, 0.55, -0.3], 26], ["T", [0.75, 0.9, 3.6], [1.1, 0.9, -1.15], 24], ["M", [1.9, 1.9, 2.6], [0.05, 0.7, -0.8], 30],
  ["M", [0.9, 2.1, -1.2], [-0.4, -3.6, 9.5], 34], ["B", [0.5, 3, 7.8], [-0.1, 0.5, 0.6], 30], ["B", [0.1, 1.6, 8.2], [0.05, 0.62, 0], 26],
  ["B", [-0.95, 0.95, 4.6], [-0.5, 0.72, -0.2], 24], ["T", [-0.7, 0.75, 4.4], [0.75, 0.62, -0.6], 26], ["B", [-0.9, 1.2, 1.2], [-0.35, 3.1, -6], 34],
  ["B", [0.1, 1.05, 7.2], [0.05, 0.95, 0], 26], ["T", [0.7, 0.88, 4.3], [1.06, 0.88, -1.1], 24], ["B", [1.3, 1.1, 6.4], [-0.2, 1.2, -0.8], 30],
  ["T", [0.9, 0.95, 7.6], [0.45, 0.75, -0.5], 26], ["T", [0.2, 0.62, 6.4], [0.62, 0.62, -0.5], 26], ["T", [-0.1, 0.6, 4.3], [0.05, 0.6, -0.3], 24],
  ["T", [0.85, 0.74, 5.2], [1.15, 0.74, -1.1], 26], ["T", [0.15, 0.89, 9.6], [0.15, 0.89, 0], 26],
].map(([s, p, l, f]) => {
  const P = new THREE.Vector3(p[0] + ST[s][0], p[1] + ST[s][1], p[2] + ST[s][2]), L = new THREE.Vector3(l[0] + ST[s][0], l[1] + ST[s][1], l[2] + ST[s][2]);
  const d = L.clone().sub(P), D = d.length(); return { P, dir: d.divideScalar(D), D, tan: Math.tan((f * DEG) / 2) * 0.7 };
});

const ZONES = [
  // name, count, r range, y band, top, shade, hi (a colour on the very top / the sunlit side), deep (the underside), seed
  { id: "white", n: 26, r: [0.8, 2.2], y: [19.5, 24], top: "#fbfdff", shade: "#dbe7ef", hi: "#fff1c2", deep: null, seed: 11 },
  { id: "grey", n: 34, r: [1.2, 3.0], y: [15, 20], top: "#8b8fa3", shade: "#5f6378", hi: "#a9adbf", deep: null, seed: 23 },
  { id: "orange", n: 40, r: [1.2, 3.2], y: [4.5, 15], top: "#f0935a", shade: "#b9502e", hi: null, deep: "#7a2f24", seed: 37 },
  { id: "smoke", n: 8, r: [1.0, 2.2], y: [1.4, 5.0], top: "#5a2a24", shade: "#3a1f22", hi: null, deep: "#2b1418", seed: 51 },
];
// the puffs that sit across a zone border: [zone, y band] for the first three puffs of the zone (3 of each colour interleave)
const BORDER = { white: [18.0, 20.0], grey: [13.5, 15.5], orange: [15.0, 17.0] };
const BORDER_UP = { grey: [20.0, 21.5] };   // the 3 grey puffs that rise into the white band (the last three of the zone)
// puffs that must stand behind a station's marks (DESIGN section 0: shot 10 / 11 grey cloud behind landing 90's open edge, shots 15 / 16 orange cloud at tread 61's left):
// [zone id, x, y, z, r, side] first choices, pushed outward (side) until the 0.9 m clearance holds; they are puffs 3, 4, 5 of their zone
const HEROES = {
  grey: [[-6.5, 18.6, -56.5, 2.9, -1], [-5.0, 16.6, -62.5, 3.0, -1], [-9.5, 19.4, -50.5, 2.6, -1]],
  orange: [[-6.5, 13.4, -34.5, 2.6, -1], [-6.0, 11.4, -40.5, 3.0, -1], [-8.5, 14.4, -29.5, 2.4, -1]],
};
const LUMPS = [[0, 0, 0, 1.0], [0.85, -0.12, 0.1, 0.72], [-0.8, -0.1, -0.15, 0.68], [0.2, 0.42, 0.1, 0.62], [-0.35, 0.3, 0.35, 0.5], [0.45, -0.05, 0.55, 0.5]];

// one merged two-tone cluster of spheres (unit radius), colours baked by the normal: top / shade with a crisp terminator, `hi` on the lit upper left, `deep` underneath
function puffGeo(Z) {
  const cT = new THREE.Color(Z.top), cS = new THREE.Color(Z.shade), cH = Z.hi ? new THREE.Color(Z.hi) : null, cD = Z.deep ? new THREE.Color(Z.deep) : null;
  const pos = [], nor = [], col = [], idx = []; let base = 0; const c = new THREE.Color();
  for (const [dx, dy, dz, k] of LUMPS) {
    const g = new THREE.SphereGeometry(1, 14, 10), p = g.attributes.position, n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      const nx = n.getX(i), ny = n.getY(i);
      c.copy(cS).lerp(cT, ss((ny + 0.12) / 0.34));
      if (cH) c.lerp(cH, Z.id === "white" ? 0.7 * ss((ny * 0.55 - nx * 0.6 - 0.3) / 0.3) : 0.8 * ss((ny - 0.62) / 0.2));
      if (cD) c.lerp(cD, 0.6 * ss((-ny - 0.35) / 0.4));
      pos.push(p.getX(i) * k + dx, p.getY(i) * k + dy, p.getZ(i) * k + dz); nor.push(nx, ny, n.getZ(i)); col.push(c.r, c.g, c.b);
    }
    for (const j of g.index.array) idx.push(base + j);
    base += p.count; g.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx); return geo;
}

// where every puff goes: deterministic, one pass, at module load per prop (rng seeds are fixed)
function placePuffs(seed) {
  const boxes = stairBoxes(), out = [];
  const fits = (x, y, z, rx, ry, rz) => {
    for (const [x0, x1, y0, y1, z0, z1] of boxes) {
      const gx = Math.max(x0 - x, 0, x - x1) / (rx + 0.9), gy = Math.max(y0 - y, 0, y - y1) / (ry + 0.9), gz = Math.max(z0 - z, 0, z - z1) / (rz + 0.9);
      if (gx * gx + gy * gy + gz * gz < 1) return false;
    }
    return true;
  };
  const clearOfCams = (x, y, z, R) => {
    const v = new THREE.Vector3();
    for (const C of CAMS) {
      v.set(x, y, z).sub(C.P); const al = v.dot(C.dir); if (al < -R || al > C.D + R * 0.5) continue;
      const lat = Math.sqrt(Math.max(0, v.lengthSq() - al * al)); if (lat < R + 0.25 + Math.max(al, 0) * C.tan) return false;
    }
    return true;
  };
  ZONES.forEach((Z, zi) => {
    const R = rng(Z.seed * 131 + seed * 7919), list = [];
    for (let j = 0; j < Z.n; j++) {
      // the y band of this puff: golden-ratio stratified over the zone's band; the first and last three cross the border
      let [y0, y1] = Z.y; if (j < 3 && BORDER[Z.id]) [y0, y1] = BORDER[Z.id]; else if (j >= Z.n - 3 && BORDER_UP[Z.id]) [y0, y1] = BORDER_UP[Z.id];
      const fy = (j * 0.6180339887 + 0.13 * zi) % 1;
      let placed = null;
      const hero = HEROES[Z.id]?.[j - 3];   // puffs 3..5 of the zone (0..2 are the border crossers)
      if (hero) {   // a hero puff: its own place, pushed away from the stair in 0.4 m steps until it clears the parapets and the camera lines
        const [hx, hy, hz, hr, hs] = hero, sx = 1.15 + 0.2 * R(), sy = 0.6 + 0.15 * R(), sz = 1.0 + 0.2 * R(), turn = R() * TAU;
        for (let k = 0; k < 40 && !placed; k++) {
          const x = hx + hs * 0.4 * k, rx = hr * sx * 1.6, ry = hr * sy * 1.2, rz = hr * sz * 1.6;
          if (fits(x, hy, hz, rx, ry, rz) && clearOfCams(x, hy, hz, Math.max(rx, rz))) placed = { x, y: hy, z: hz, r: hr, sx, sy, sz, turn };
        }
      }
      for (let tr = 0; tr < 120 && !placed; tr++) {
        const r = Z.r[0] + (Z.r[1] - Z.r[0]) * R(), sx = 1.0 + 0.45 * R(), sy = 0.52 + 0.3 * R(), sz = 0.85 + 0.35 * R(), turn = R() * TAU;
        const y = y0 + (y1 - y0) * (tr < 40 ? fy : R()), rx = r * sx * 1.6, ry = r * sy * 1.2, rz = r * sz * 1.6;   // the lumps reach 1.6 x r sideways, 1.2 up
        let x, z;
        if (Z.id === "smoke") { const side = R() < 0.5 ? -1 : 1; x = side * (3.7 + rx + 7 * R()); z = -7 + 12 * R(); }
        else {
          const n = clamp(Math.round(y / 0.22), 1, 100), side = R() < 0.5 ? -1 : 1, extra = (R() < 0.62 ? 4 * R() : 4 + 13 * R()) + (tr > 60 ? 6 : 0);
          x = xo(n) + side * (1.27 + 0.9 + rx + extra); z = zr(n) + (R() - 0.5) * 12 - (R() < 0.15 ? 8 * R() : 0);
        }
        if (z < -57 && Math.abs(x) < 4 + rx) continue;   // the strip behind the terrace stays sky and rays
        if (!fits(x, y, z, rx, ry, rz) || !clearOfCams(x, y, z, Math.max(rx, rz))) continue;
        placed = { x, y, z, r, sx, sy, sz, turn };
      }
      if (!placed) throw new Error(`zoneclouds: no place for ${Z.id} puff ${j}`);
      placed.ph = R() * TAU; list.push(placed);
    }
    out.push(list);
  });
  return out;
}

export const HSKY_KINDS = {
  // ---- the sky ---------------------------------------------------------------------------------------------------------------------------------------
  stairsky(P) {
    const H = 1024, hOf = (v) => SKY_Y1 - (SKY_Y1 - SKY_Y0) * v;   // canvas row v (0 = top) -> world height
    const tex = canvasTex(4, H, (g, w, h) => {
      const im = g.createImageData(w, h);
      for (let j = 0; j < h; j++) {
        const y = hOf(j / (h - 1)); let a = SKY[0], b = SKY[0];
        if (y >= SKY[SKY.length - 1][0]) a = b = SKY[SKY.length - 1]; else if (y > SKY[0][0]) for (let i = 0; i < SKY.length - 1; i++) if (y >= SKY[i][0] && y <= SKY[i + 1][0]) { a = SKY[i]; b = SKY[i + 1]; break; }
        const k = a === b ? 0 : (y - a[0]) / (b[0] - a[0]), A = hexRGB(a[1]), B = hexRGB(b[1]);
        for (let i = 0; i < w; i++) { const o = (j * w + i) * 4; im.data[o] = A[0] + (B[0] - A[0]) * k; im.data[o + 1] = A[1] + (B[1] - A[1]) * k; im.data[o + 2] = A[2] + (B[2] - A[2]) * k; im.data[o + 3] = 255; }
      }
      g.putImageData(im, 0, 0);
    });
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
    const wall = basic("#ffffff", { map: tex, side: THREE.BackSide }), up = basic("#eef8ff", { side: THREE.DoubleSide }), dn = basic("#1f0f12", { side: THREE.DoubleSide });   // (depthWrite false hides them: the stage paints its background over a sky that writes no depth)
    for (const m of [wall, up, dn]) { m.userData.noOutline = true; m.userData.noHatch = true; }
    // three single-material pieces (a material array on one mesh is not drawn by the stage): the wall, the lid, the floor
    const R0 = 90, CZ = -28, part = (geo, m, y) => { const o = new THREE.Mesh(geo, m); o.position.set(0, y, CZ); o.renderOrder = -10; o.frustumCulled = false; flat(o); P.whole.add(o); return o; };
    part(new THREE.CylinderGeometry(R0, R0, SKY_Y1 - SKY_Y0, 64, 1, true), wall, (SKY_Y0 + SKY_Y1) / 2);
    part(new THREE.CircleGeometry(R0, 64).rotateX(Math.PI / 2), up, SKY_Y1); part(new THREE.CircleGeometry(R0, 64).rotateX(-Math.PI / 2), dn, SKY_Y0);
    return { grip: 0 };
  },

  // ---- the clouds ------------------------------------------------------------------------------------------------------------------------------------
  zoneclouds(P) {
    const S = P.spec, loop = S.loop ?? 0, spd = S.speed ?? 1, places = placePuffs(S.seed ?? 1), bobHz = snapHz(0.2, loop);
    const draws = ZONES.map((Z, zi) => {
      const m = basic("#ffffff", { vertexColors: true }); m.userData.noOutline = true; m.userData.noHatch = true; m.userData.glow = true;
      const im = new THREE.InstancedMesh(puffGeo(Z), m, Z.n); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.castShadow = im.receiveShadow = false; flat(im);
      im.renderOrder = zi; const R = rng(Z.seed * 17 + 5), c = new THREE.Color();
      for (let i = 0; i < Z.n; i++) { const k = 0.93 + 0.12 * R(); im.setColorAt(i, c.setRGB(k, k, k)); }   // a touch of brightness each, so no two puffs match
      P.whole.add(im); return { Z, im, list: places[zi] };
    });
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    const drift = (t) => (loop > 0 ? -((0.03 * spd * loop) / TAU) * Math.sin((TAU * t) / loop) : -0.03 * spd * t);
    return { grip: 0, apply(ps, t) {
      const dx = drift(t || 0);
      for (const { im, list } of draws) {
        for (let i = 0; i < list.length; i++) {
          const c = list[i];
          p.set(c.x + dx, c.y + 0.02 * Math.sin(TAU * bobHz * (t || 0) + c.ph), c.z); q.setFromAxisAngle(up, c.turn); s.set(c.r * c.sx, c.r * c.sy, c.r * c.sz);
          im.setMatrixAt(i, M.compose(p, q, s));
        }
        im.instanceMatrix.needsUpdate = true;
      }
    } };
  },

  // ---- hell's floor ----------------------------------------------------------------------------------------------------------------------------------
  hellfloor(P) {
    const S = P.spec, X0 = -4.5, X1 = 4.5, Z0 = S.z0 ?? -3.0, Z1 = 6.5, W = X1 - X0, D = Z1 - Z0, PPM = 100, hole = S.hole ?? [-0.65, 1.30, 0.60], TH = 0.5;
    const R = rng(7);
    // nine glowing cracks, each its own jagged path (start, heading, 6-9 legs): placed once, drawn into the colour map and (alone) into the emissive map
    const cracks = [[-3.6, 5.6, -70], [-2.2, 3.4, -20], [-0.6, 5.9, 35], [1.9, 4.6, 110], [3.4, 2.4, 150], [2.6, 0.9, 205], [-3.1, 1.1, 250], [0.9, 2.9, 300], [-1.4, 2.4, 80]].map(([x, z, hd], i) => {
      const pts = [[x, z]]; let h = hd * DEG; const legs = 6 + (i % 4);
      for (let k = 0; k < legs; k++) { h += (R() - 0.5) * 1.1; const L = 0.35 + 0.35 * R(); const [px, pz] = pts[pts.length - 1]; pts.push([clamp(px + Math.cos(h) * L, X0 + 0.1, X1 - 0.1), clamp(pz + Math.sin(h) * L, 0.55, Z1 - 0.1)]); }
      return pts;
    });
    const plates = Array.from({ length: 12 }, () => { const x = X0 + W * R(), z = Z0 + D * R(), a = R() * TAU, L = 0.9 + 1.6 * R(); return [x, z, x + Math.cos(a) * L, z + Math.sin(a) * L, x + Math.cos(a + 0.5) * L * 0.5, z + Math.sin(a + 0.5) * L * 0.5]; });
    const px = (x) => (x - X0) * PPM, pz = (z) => (z - Z0) * PPM;
    const paint = (g, glowOnly) => {
      g.lineCap = g.lineJoin = "round";
      if (!glowOnly) {
        g.fillStyle = "#5a2320"; g.fillRect(0, 0, W * PPM, D * PPM);
        for (const [x, z, x2, z2, cx, cz] of plates) { g.strokeStyle = "rgba(58,24,22,0.55)"; g.lineWidth = 0.025 * PPM; g.beginPath(); g.moveTo(px(x), pz(z)); g.quadraticCurveTo(px(cx), pz(cz), px(x2), pz(z2)); g.stroke(); g.strokeStyle = "rgba(122,52,44,0.30)"; g.lineWidth = 0.012 * PPM; g.beginPath(); g.moveTo(px(x) + 3, pz(z) + 3); g.quadraticCurveTo(px(cx) + 3, pz(cz) + 3, px(x2) + 3, pz(z2) + 3); g.stroke(); }
      } else { g.fillStyle = "#5a2320"; g.fillRect(0, 0, W * PPM, D * PPM); }   // the emissive map: the rock colour again, so the rock reads red so the rock reads red under the warm key, the cracks full
      for (const pts of cracks) {
        for (const [lw, col] of [[0.075, "#ff7a1c"], [0.028, "#ffd23f"]]) {
          g.strokeStyle = col; g.lineWidth = lw * PPM * (glowOnly ? 1.1 : 1);
          g.beginPath(); g.moveTo(px(pts[0][0]), pz(pts[0][1])); for (const [x, z] of pts.slice(1)) g.lineTo(px(x), pz(z)); g.stroke();
        }
      }
    };
    const colorTex = canvasTex(Math.round(W * PPM), Math.round(D * PPM), (g) => paint(g, false)), glowTex = canvasTex(Math.round(W * PPM), Math.round(D * PPM), (g) => paint(g, true));
    const topM = noHatch(mat("#ffffff", { map: colorTex, roughness: 0.9, emissive: new THREE.Color("#ffffff"), emissiveMap: glowTex, emissiveIntensity: 1.4 })), sideM = noHatch(mat("#3a1816", { roughness: 0.95 }));
    // the slab: a rectangle with the hatch's round hole, extruded 0.5 down; its caps carry the map (uv from x and z)
    const sh = new THREE.Shape(); sh.moveTo(X0, -Z0); sh.lineTo(X1, -Z0); sh.lineTo(X1, -Z1); sh.lineTo(X0, -Z1); sh.closePath();
    if (hole.length === 3) { const hp = new THREE.Path(); hp.absarc(hole[0], -hole[1], hole[2], 0, TAU, true); sh.holes.push(hp); }
    const geo = new THREE.ExtrudeGeometry(sh, { depth: TH, bevelEnabled: false, curveSegments: 40 }); geo.rotateX(-Math.PI / 2); geo.translate(0, -TH, 0);
    const pp = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < pp.count; i++) uv.setXY(i, (pp.getX(i) - X0) / W, 1 - (pp.getZ(i) - Z0) / D);
    const slab = mesh(geo, [topM, sideM], P.whole); slab.castShadow = false; slab.receiveShadow = true;
    // seven crags: lumpy low-poly rocks (flat faces), lit on the upper-left faces; all at |x| >= 2.6
    const cragM = noHatch(new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.85, flatShading: true }));
    const cT = new THREE.Color("#3a1f22"), cL = new THREE.Color("#8f2f22"), key = new THREE.Vector3(-0.55, 0.7, 0.45).normalize(), v3 = new THREE.Vector3();
    const fract = (x) => x - Math.floor(x);
    [[-3.5, 1.5, 3.4, 1.6, 31], [-4.0, 0.2, 2.6, 1.4, 32], [-3.2, 3.2, 1.8, 1.0, 33], [-3.9, 4.8, 1.2, 1.1, 34], [3.5, 3.2, 2.9, 1.5, 35], [4.0, 1.0, 2.0, 1.2, 36], [3.2, 4.3, 1.4, 1.0, 37]].forEach(([x, z, h, wd, sd]) => {
      const r = rng(sd), g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position;
      for (let k = 0; k < p.count; k++) {   // the same lump for every copy of a corner: keyed by the rounded position, so the faces stay closed
        v3.set(p.getX(k), p.getY(k), p.getZ(k)); const f = 0.76 + 0.46 * fract(Math.sin(Math.round(v3.x * 50) * 12.9898 + Math.round(v3.y * 50) * 78.233 + Math.round(v3.z * 50) * 37.719 + sd) * 43758.5453);
        p.setXYZ(k, v3.x * f, Math.max(v3.y * f, -0.15), v3.z * f);
      }
      const g2 = g.clone(); g2.deleteAttribute("uv"); g2.computeVertexNormals(); const q = g2.attributes.position, cols = new Float32Array(q.count * 3), c = new THREE.Color();
      for (let k = 0; k < q.count; k += 3) {
        const nx = g2.attributes.normal.getX(k), ny = g2.attributes.normal.getY(k), nz = g2.attributes.normal.getZ(k), lit = ss((nx * key.x + ny * key.y + nz * key.z - 0.15) / 0.55);
        c.copy(cT).lerp(cL, lit * 0.95); for (let j = 0; j < 3; j++) { cols[(k + j) * 3] = c.r; cols[(k + j) * 3 + 1] = c.g; cols[(k + j) * 3 + 2] = c.b; }
      }
      g2.setAttribute("color", new THREE.BufferAttribute(cols, 3));
      const rock = new THREE.Mesh(g2, cragM); rock.scale.set(wd * (0.9 + 0.3 * r()), h * 0.85, wd * (0.9 + 0.3 * r())); rock.position.set(x, 0.13 * h, z); rock.rotation.y = r() * TAU; rock.castShadow = rock.receiveShadow = true; P.whole.add(rock);
    });
    return { grip: 0 };
  },

  // ---- the hatch -------------------------------------------------------------------------------------------------------------------------------------
  hellhatch(P) {
    if (P.spec.glow === undefined) P.spec.glow = 1;   // propState starts glow at spec.glow ?? 0: make the default 1
    const S = P.spec, loop = S.loop ?? 0, RI = 0.585, RO = 0.72, RL = 0.55, RH = 0.10, SHAFT = 1.4;
    const iron = noHatch(mat("#3a2f30", { roughness: 0.6, metalness: 0.4, side: THREE.DoubleSide })), rivetM = noHatch(mat("#55484a", { roughness: 0.5, metalness: 0.4 })), wheelM = noHatch(mat("#2b2228", { roughness: 0.55, metalness: 0.4 }));
    // ring: a lathe (iron) with the shaft wall as its own unlit piece, lit orange at the top and dark at the bottom
    const ring = mesh(new THREE.LatheGeometry([[RI, -0.05], [RI, RH], [RO, RH], [RO, 0]].map(([x, y]) => new THREE.Vector2(x, y)), 48), iron, P.whole); ring.castShadow = false;
    const cA = new THREE.Color("#ff9a3c"), cB = new THREE.Color("#c8441c"), cC = new THREE.Color("#2b1418"), c = new THREE.Color();
    { const shaftM = basic("#ffffff", { vertexColors: true, side: THREE.DoubleSide }); shaftM.userData.noOutline = true; shaftM.userData.noHatch = true;
      const wallGeo = new THREE.CylinderGeometry(RI - 0.004, RI - 0.004, SHAFT, 40, 8, true).translate(0, -SHAFT / 2, 0), wp = wallGeo.attributes.position, wc = new Float32Array(wp.count * 3);
      for (let i = 0; i < wp.count; i++) { const y = wp.getY(i); if (y > -0.5) c.copy(cA).lerp(cB, -y / 0.5); else c.copy(cB).lerp(cC, clamp((-y - 0.5) / (SHAFT - 0.5))); wc[i * 3] = c.r; wc[i * 3 + 1] = c.g; wc[i * 3 + 2] = c.b; }
      wallGeo.setAttribute("color", new THREE.BufferAttribute(wc, 3)); P.whole.add(flat(new THREE.Mesh(wallGeo, shaftM)));
      const botM = basic("#2b1418"); botM.userData.noOutline = true; const bot = new THREE.Mesh(new THREE.CircleGeometry(RI, 32), botM); bot.rotation.x = -Math.PI / 2; bot.position.y = -SHAFT; P.whole.add(flat(bot)); }
    // 8 rivets (between the clamps), 4 clamps, the hinge brackets at the back
    for (let k = 0; k < 8; k++) { const a = (22.5 + 45 * k) * DEG, o = mesh(new THREE.SphereGeometry(0.03, 10, 6), rivetM, P.whole, Math.sin(a) * 0.655, RH + 0.004, Math.cos(a) * 0.655); o.scale.y = 0.6; o.castShadow = false; }
    for (const ad of [0, 90, 270, 135]) {   // a hasp on the ring top, over the edge and down the outer wall
      const a = ad * DEG, g = new THREE.Group(); g.position.set(0, 0, 0); g.rotation.y = a; P.whole.add(g);
      box(0.085, 0.02, 0.15, iron, g, 0, RH + 0.008, 0.655).castShadow = false; box(0.085, 0.13, 0.02, iron, g, 0, RH - 0.05, RO + 0.002).castShadow = false; mesh(new THREE.SphereGeometry(0.018, 8, 6), rivetM, g, 0, RH + 0.024, 0.655).castShadow = false;
    }
    for (const s of [-1, 1]) { const g = new THREE.Group(); g.rotation.y = Math.PI + s * 0.2; P.whole.add(g); box(0.09, 0.07, 0.12, iron, g, 0, RH + 0.018, 0.66).castShadow = false; }
    // the lid on its back hinge (pivot at the ring's top rim, z -0.55): the lid's own parts sit +0.55 in front of the pivot
    const hinge = new THREE.Group(); hinge.position.set(0, RH - 0.06, -RL); P.whole.add(hinge); const lid = new THREE.Group(); lid.position.z = RL; hinge.add(lid);
    const lidTex = canvasTex(512, 512, (g, w, h) => {
      const q = rng(61), cx = w / 2, rr = w / 2; g.fillStyle = "#4b3b3b"; g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(30,20,22,0.55)"; g.lineWidth = 5; g.beginPath(); g.arc(cx, cx, rr * 0.88, 0, TAU); g.stroke(); g.strokeStyle = "rgba(110,90,86,0.45)"; g.lineWidth = 3; g.beginPath(); g.arc(cx, cx, rr * 0.88 + 5, 0, TAU); g.stroke();
      g.strokeStyle = "rgba(30,20,22,0.45)"; g.lineWidth = 4; g.beginPath(); g.moveTo(cx - rr * 0.86, cx); g.lineTo(cx + rr * 0.86, cx); g.moveTo(cx, cx - rr * 0.86); g.lineTo(cx, cx + rr * 0.86); g.stroke();
      for (let i = 0; i < 5; i++) {   // five rust smears, each its own place, length and lean
        const x = cx + (q() - 0.5) * rr * 1.2, y = cx + (q() - 0.5) * rr * 1.2, L = 40 + 70 * q(), a = q() * TAU; const gr = g.createLinearGradient(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L);
        gr.addColorStop(0, "rgba(122,58,34,0.75)"); gr.addColorStop(1, "rgba(122,58,34,0)"); g.strokeStyle = gr; g.lineCap = "round"; g.lineWidth = 12 + 12 * q(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
      }
    });
    const lidTopM = noHatch(mat("#ffffff", { map: lidTex, roughness: 0.55, metalness: 0.2 })), edgeM = noHatch(mat("#6a5552", { roughness: 0.5, metalness: 0.3 }));
    const topGeo = new THREE.RingGeometry(0.001, RL, 48, 8), tp = topGeo.attributes.position; for (let i = 0; i < tp.count; i++) tp.setZ(i, 0.015 * (1 - (Math.hypot(tp.getX(i), tp.getY(i)) / RL) ** 2)); topGeo.rotateX(-Math.PI / 2);
    mesh(topGeo, lidTopM, lid, 0, 0.06, 0).castShadow = false; mesh(new THREE.CylinderGeometry(RL, RL, 0.06, 48), edgeM, lid, 0, 0.03, 0);
    { const uM = basic("#e0651f", { side: THREE.DoubleSide }); uM.userData.noOutline = true; const u = new THREE.Mesh(new THREE.CircleGeometry(RL - 0.01, 32).rotateX(Math.PI / 2), uM); u.position.y = -0.001; flat(u); lid.add(u); }   // the lid's underside, lit by the shaft
    const wheel = new THREE.Group(); wheel.position.y = 0.06 + 0.012; lid.add(wheel);
    mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.045, 14), wheelM, wheel, 0, 0.022, 0); const rim = mesh(new THREE.TorusGeometry(0.20, 0.016, 8, 36), wheelM, wheel, 0, 0.058, 0); rim.rotation.x = Math.PI / 2; rim.castShadow = false;
    for (const a of [0, 90]) { const sp = box(0.40, 0.022, 0.022, wheelM, wheel, 0, 0.056, 0); sp.rotation.y = a * DEG; sp.castShadow = false; }
    for (const a of [0, 90, 180, 270]) { const kn = mesh(new THREE.SphereGeometry(0.026, 8, 6), wheelM, wheel, Math.sin(a * DEG) * 0.215, 0.058, Math.cos(a * DEG) * 0.215); kn.castShadow = false; }
    // the seam between lid and ring: 12 arcs on fixed phases, the glow's core inside; lava cracks on the floor and the pool are cards (see-through)
    const SEG = 12, seam = [], phs = [0.0, 0.58, 0.21, 0.83, 0.37, 0.95, 0.12, 0.66, 0.45, 0.78, 0.29, 0.52];
    for (let k = 0; k < SEG; k++) {
      const t0 = (k / SEG) * TAU, dl = TAU / SEG + 0.01, mo = basic("#ff7a1c"), mc = basic("#ffd23f"); mo.userData.noOutline = mc.userData.noOutline = true; mo.userData.glow = mc.userData.glow = true;
      const a = new THREE.Mesh(new THREE.RingGeometry(RL + 0.001, RI + 0.001, 6, 1, t0, dl), mo), b = new THREE.Mesh(new THREE.RingGeometry(RL + 0.012, RL + 0.026, 6, 1, t0, dl), mc);
      for (const o of [a, b]) { o.rotation.x = -Math.PI / 2; o.position.y = RH + 0.003; flat(o); P.whole.add(o); } b.position.y = RH + 0.005;
      seam.push({ mo, mc, ph: phs[k] });
    }
    const cr = rng(83), crackTex = canvasTex(680, 680, (g, w, h) => {
      const cx = w / 2; g.lineCap = g.lineJoin = "round";
      [[12, 0.55], [71, 0.9], [118, 0.4], [205, 0.7], [262, 0.5], [330, 0.8]].forEach(([ad, L]) => {   // six cracks 0.4-0.9 long, from just under the ring's edge
        let a = ad * DEG, x = cx + Math.sin(a) * (RO - 0.04) * 200, y = cx - Math.cos(a) * (RO - 0.04) * 200; const pts = [[x, y]], legs = 4; for (let k = 0; k < legs; k++) { a += (cr() - 0.5) * 0.9; const l = (L / legs) * 200; x += Math.sin(a) * l; y -= Math.cos(a) * l; pts.push([x, y]); }
        for (const [lw, col] of [[0.05, "#ff7a1c"], [0.018, "#ffd23f"]]) { g.strokeStyle = col; g.lineWidth = lw * 200; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.stroke(); }
      });
    }), poolTex = canvasTex(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(255,122,28,1)"); gr.addColorStop(0.55, "rgba(255,122,28,0.55)"); gr.addColorStop(1, "rgba(255,122,28,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const crackM = glowMat(crackTex), poolM = glowMat(poolTex);
    const crackCard = flat(plane(3.4, 3.4, crackM, P.whole, 0, 0.004, 0, -Math.PI / 2)), poolCard = flat(plane(3.2, 3.2, poolM, P.whole, 0, 0.006, 0, -Math.PI / 2));
    poolCard.renderOrder = 1; crackCard.renderOrder = 2;
    // the light fan above the opening (additive, shown with `open`): 7 rays from the bottom centre, none alike
    const fanTex = canvasTex(256, 176, (g, w, h) => {
      const sx = w / 2, sy = h, rr = rng(97);
      try { g.filter = "blur(2px)"; } catch (e) { /* no canvas filter */ }
      for (const ang of [-58, -38, -20, 0, 18, 37, 57]) {
        const hw = 3 + 4 * rr(), l = (0.55 + 0.4 * rr()) * h * 1.15, a0 = (ang - hw) * DEG, a1 = (ang + hw) * DEG, gr = g.createRadialGradient(sx, sy, 4, sx, sy, l);
        gr.addColorStop(0, "rgba(255,190,90,0.95)"); gr.addColorStop(1, "rgba(255,122,28,0)"); g.fillStyle = gr; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + l * 1.1 * Math.sin(a0), sy - l * 1.1 * Math.cos(a0)); g.lineTo(sx + l * 1.1 * Math.sin(a1), sy - l * 1.1 * Math.cos(a1)); g.closePath(); g.fill();
      }
    });
    const fanM = glowMat(fanTex, { blending: THREE.AdditiveBlending }), fan = flat(plane(2.6, 1.8, fanM, P.whole, 0, 0.9 + 0.12, 0.5)); fan.renderOrder = 3; fan.visible = false;
    // the rungs: only seen with the lid up
    const rungs = new THREE.Group(); rungs.visible = false; P.whole.add(rungs);
    for (const [y, z] of [[-0.36, 0.32], [-0.80, 0.32]]) { const half = Math.sqrt(RI * RI - z * z) - 0.01, r = mesh(new THREE.CylinderGeometry(0.025, 0.025, half * 2, 10), wheelM, rungs, 0, y - 0.025, z); r.rotation.z = Math.PI / 2; r.castShadow = false; }
    for (const s of [-1, 1]) { const rail = box(0.03, 0.55, 0.05, wheelM, rungs, s * 0.46, -0.6, 0.32); rail.castShadow = false; }
    const f1 = snapHz(1.7, loop), f2 = snapHz(2.9, loop), flick = (t, ph) => 0.5 + 0.25 * Math.sin(TAU * (f1 * t + ph)) + 0.25 * Math.sin(TAU * (f2 * t + ph * 3.1 + 0.2));
    const dark = new THREE.Color("#3a2f30"), orange = new THREE.Color("#ff7a1c"), core = new THREE.Color("#ffd23f"), cc = new THREE.Color();
    // `fall` (Heaven's terms): the glow disc at the bottom of the shaft, unlit, hidden until the lid starts down
    const fallDisc = new THREE.Group(); fallDisc.visible = false; P.whole.add(fallDisc);
    for (const [r, col, y] of [[RI - 0.03, "#ffb21c", -1.30], [0.30, "#ffe46a", -1.298]]) { const m = basic(col, { side: THREE.DoubleSide }); m.userData.noOutline = m.userData.noHatch = true; const d = new THREE.Mesh(new THREE.CircleGeometry(r, 40).rotateX(-Math.PI / 2), m); d.position.y = y; fallDisc.add(flat(d)); }
    return { grip: 0, apply(ps, t) {
      const fall = Math.max(-0.05, Math.min(1.1, ps.fall ?? 0)), open = Math.max(-0.05, Math.min(1.15, ps.open ?? 0)), glow = fall > 0 ? Math.max(0, Math.min(1.5, ps.glow ?? 1)) : clamp(ps.glow ?? 1), gk = Math.min(1, glow), tt = t || 0;
      hinge.rotation.x = -open * 35 * DEG + fall * 85 * DEG;
      fallDisc.visible = fall > 0.02;
      const seamOn = gk > 0.01 && open < 0.35 && fall < 0.02;
      for (const s of seam) {
        const f = flick(tt, s.ph), k = gk * (0.9 + 0.1 * f);   // 10 % flicker
        s.mo.color.copy(dark).lerp(cc.copy(orange), k); s.mc.color.copy(dark).lerp(cc.copy(core), k); s.mo.visible = s.mc.visible = seamOn;
      }
      crackM.opacity = gk * (0.9 + 0.1 * flick(tt, 0.3)); crackCard.visible = gk > 0.01; poolM.opacity = 0.4 * glow * (0.93 + 0.07 * flick(tt, 0.7)); poolCard.visible = gk > 0.01;   // (glow above 1 only brightens the pool and the fan)
      const o = Math.max(ss(open * 1.6), ss(fall * 1.6)), fk = ss(open * 1.6) >= ss(fall * 1.6) ? 1 : 0.55; fanM.opacity = 0.42 * o * fk * Math.max(1, glow);   // (a falling lid: a thinner fan, so the lid and the disc read through it) fan.visible = o > 0.02; rungs.visible = open > 0.05;
    } };
  },

  // ---- the parasol -----------------------------------------------------------------------------------------------------------------------------------
  parasol(P) {
    const S = P.spec, tilt = (S.tilt ?? 12) * DEG, RC = 0.65, RIM = 0.02, APEX = 0.20, POLE = 1.75, GORES = 8, SEGS = 4, RINGS = 7;
    const cream = noHatch(mat("#f4f1e8", { roughness: 0.5 }));
    mesh(new THREE.CylinderGeometry(0.18, 0.19, 0.04, 32), cream, P.whole, 0, 0.02, 0);
    mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.09, 14), cream, P.whole, 0, 0.085, 0);
    mesh(new THREE.CylinderGeometry(0.015, 0.015, POLE, 10), cream, P.whole, 0, POLE / 2, 0);
    mesh(new THREE.SphereGeometry(0.028, 10, 8), cream, P.whole, 0, POLE + 0.06, 0);
    // canopy: a shallow dome from the apex out to the rim, coloured per gore (hard edges: non-indexed), the rim sags between the ribs (scallops 0.05)
    const pts = [], cols = [], cR = new THREE.Color("#d3261e"), cC = new THREE.Color("#f2ebe0");
    const vtx = (g, k) => {   // gore g (0..GORES*SEGS), ring k (0 = apex .. RINGS)
      const u = k / RINGS, a = (g / (GORES * SEGS)) * TAU, r = RC * Math.sin(u * 1.35) / Math.sin(1.35), fr = (g % SEGS) / SEGS, sag = u === 1 ? 0.05 * Math.sin(Math.PI * fr) : 0;
      return [Math.sin(a) * r, APEX * (1 - u ** 2.2) - sag, Math.cos(a) * r];
    };
    for (let g = 0; g < GORES * SEGS; g++) {
      const col = Math.floor(g / SEGS) % 2 ? cC : cR;
      for (let k = 0; k < RINGS; k++) {
        const A = vtx(g, k), B = vtx(g + 1, k), C = vtx(g, k + 1), D = vtx(g + 1, k + 1);
        const tri = k === 0 ? [[A, D, C]] : [[A, B, C], [B, D, C]];
        for (const t3 of tri) for (const v of t3) { pts.push(...v); cols.push(col.r, col.g, col.b); }
      }
    }
    const cg = new THREE.BufferGeometry(); cg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); cg.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3)); cg.computeVertexNormals();
    const canopyM = noHatch(new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }));
    const hang = new THREE.Group(); hang.position.set(0, POLE - 0.17, 0); hang.rotation.z = tilt; P.whole.add(hang);
    mesh(cg, canopyM, hang, 0, 0, 0);
    // 8 ribs (thin cream rods from the apex to the rim) under the canopy, so the underside reads
    for (let g = 0; g < GORES; g++) {
      const e = vtx(g * SEGS, RINGS), d = new THREE.Vector3(e[0], e[1] - (APEX - 0.01), e[2]), L = d.length(), rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, L, 5).translate(0, L / 2, 0), cream);
      rod.position.set(0, APEX - 0.01, 0); rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); rod.castShadow = false; hang.add(rod);
    }
    return { grip: 0 };
  },
};

export const HSKY_GRIPS = {};
