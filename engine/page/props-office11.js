// Potato Desk 11 "Thermostat war": the office dressing and the worn / hand pieces (storyboards/series/potato-desk/11-thermostat/DESIGN.md sections 2, 5, 6).
// Metres; x right, y up, +z toward the camera; every size and hex colour is the DESIGN's. Deterministic: seeded drawing only, no clock (the folder's fan and
// the pleats read the clip clock t the engine passes to apply(ps, t)). No letters or digits anywhere (the Lettering rule): scribble marks and bars only.
// Bench: storyboards/lookdev/make-office11-bench.mjs -> office11-bench.json (stills in storyboards/lookdev/out/).
// Origins are the bottom centre unless the line says otherwise.
//
// SET
//   workdesk    A desk closed to the floor (DESIGN calls it `officedesk`; that name is taken). spec.w 0.90, spec.h 0.50 (the top's face: props sit on it at y = h), spec.d 0.55.
//               Top 0.03 #B58E63 over an edge-band #8C6B48 (the slab's sides, 0.004 of it shows on the face), front / side / back panels to the floor #6C6660 with a
//               darker inset line, plinth 0.05 #4A4642 set back 0.01. Origin: the footprint's middle on the floor (design: x -1 / 0 / +1, z +0.255 for z -0.02..+0.53).
//               Solid: plain opaque meshes are solid like every furniture kind (the top takes props, the body is a box bodies stay out of).
//               spec.top "#B58E63", spec.edge "#8C6B48", spec.panel "#6C6660", spec.plinth "#4A4642" override the colours.
//   officechair LOOK-ONLY dressing (no mesh is solid): back 0.40 x 0.42 x 0.06 #4A5560 with its top at y 0.90 (0.48..0.90), seat 0.42 x 0.06 x 0.30 #4A5560 with its TOP at y 0.44,
//               a gas stem and a five-star base #2E3338 on five casters. Origin: the base's middle on the floor; it faces +z (the back is at z -0.17).
//               spec.patch false (default) | true: a patch 0.10 x 0.12 #A9794A, a little crooked, with 6 stitches, on the back's upper left (screen-left, front face; panel 01).
//               spec.color "#4A5560" the upholstery.
//   wallnotes   Paper notes pinned and stuck on the wall, one prop: spec.notes [[x, y, w, h, paper, pin], ...] in the prop frame ON the wall plane, facing +z; x, y = the
//               note's middle from the origin; paper a hex; pin a hex or null (a pin 0.022 round at the top middle). Each note leans +-3 degrees by its index.
//               Default = the DESIGN's 7 notes relative to the origin (0, 0): the director places the prop at (0, 0, -1.285) so a note's world x, y are its listed numbers
//               (-1.55, 1.50) (-1.42, 1.22) (-0.78, 1.66) (-0.70, 0.98) (+0.52, 1.02) (+0.80, 1.55) (+1.10, 1.20); papers #FDF3A6, #EFE2A0, #F6F3EA; pins #2F6FB5, #F2C94C, #4E9A5A.
//               Marks are scribbles (wavy rules, bars, a tick box, an arrow, a zigzag, a bar chart): never a letter. Notes are not solid. spec.ink "#2C4A9A" the pen.
//   paperstack  0.22 x 0.09 x 0.30 of 40 sheets #F6F3EA (sheet edges drawn once on the four sides), the top sheet with 4 grey bars #B5B0A4. Origin: the bottom centre.
//               `amount` 1..0.3 lowers it (height 0.09 x amount, fewer sheets). PUT spec.amount 1 IN THE SPEC: propState's default for `amount` is 0 (a spec without it reads as
//               0.3, the lowest); below 0.3 it is held at 0.3. Not solid.
//
// HAND PROP (SIZE entry in storyboards/lib/grips.mjs)
//   manilafolder 0.24 x 0.32 x 0.008 #E2C48A card (body 0.30 high plus a cut tab 0.075 x 0.02 on the top edge, right of the middle), a crease line near the foot, two scribble bars
//               on BOTH faces (so it reads from either side), a darker edge. Origin: the middle of its bottom edge, standing upright, faces +-z. Hold: grips.phone (SIZE as
//               clipboard: w 0.24, h 0.32, t 0.008), the hand on the lower edge; DESIGN: lower edge at y <= 0.75, 0.24 to the side of the face's middle.
//               `fan` 0..1 (spec.fan, or tween it with a prop action): while > 0 the folder tips +-18 degrees x fan at 4 Hz about its bottom edge (the x axis through the origin),
//               a top edge fanning toward and away from the face; at 0 it is still. On a desk (not held) it simply lies where the director puts it (tilt 90 lays it flat, tab to -z).
//
// WORN / LOOSE
//   icebag      spec.part "worn" (default) | "loose". Colours: bag #4F7FD0 (pleats in two tones), screw cap #F1F1EC.
//               "worn"   spec.wear "mash" (a cast id: spud | chip | wedge | mash; default "mash"), x 0, y 0, z 0 at the wearer's place like bobblehat. A slumped pleated bag Ø0.26 x 0.11
//                        (12 pleats gathering into a screw cap Ø0.075 x 0.03) lying on the crown on the screen-left side (-x) of the sprout, its base conformed to the skin, leaning a
//                        little toward the screen-left and forward. Built on the real skin (the AA_BODIES maths, as bobblehat); rides the body's place and turn only. All meshes
//                        are see-through for the contact checks (userData.steam), like the knitwear. spec.at [x, z] the bag's middle on the crown (default [-0.14, 0.0] for mash,
//                        scaled by the body's width), spec.color, spec.cap, spec.lean 1 (the slump), spec.fit overrides the body as bobblehat's does.
//   icebag       "loose"  0.24 (x) x 0.20 (y) x 0.09 (z): the same bag standing up flat against a wall, the back FLAT (the plane z = 0), the front pleated, the cap Ø0.075 at the
//                        top. Origin: the middle of the flat back; faces +z. A prop frame y range -0.10..+0.10. (Design: wrapped on the thermostat cover's right edge at
//                        (+0.29, 1.34, -1.20): the director sets the numbers.) Not solid.
import * as THREE from "three";
import { clamp } from "./util.js";
import { mat, mesh, canvasTex } from "./props-trend.js";
import { AA_BODIES } from "./props-aa-items.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const DEG = Math.PI / 180, TAU = Math.PI * 2;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const decor = (o) => { o.userData.solid = false; return o; };            // paper, thread, look-only: no contact
const flat = (m) => { m.userData.noHatch = true; return m; };
function box(w, h, d, parent, m, x = 0, y = 0, z = 0) { return mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z); }
const rbox = (w, h, d, r, parent, m, x = 0, y = 0, z = 0) => mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4)), m, parent, x, y, z);
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;

// ------------------------------------------------------------------------------------------------ the ice bag (shared by worn and loose)
const BAG = "#4F7FD0", CAPW = "#F1F1EC";
const shade = (hex, k) => "#" + new THREE.Color(hex).multiplyScalar(k).getHexString();
// A pleated body of revolution about y from a profile [[y, r], ...]: 12 pleats (cos 12 theta) that deepen toward the neck; theta from a0 to a1; tone alternates per pleat through vertex colours
function pleatedGeo(prof, a0, a1, nth, color, zk = 1, pleat = 12) {
  const rows = prof.length, pos = [], col = [], idx = [], c1 = new THREE.Color(color), c2 = new THREE.Color(shade(color, 0.86)), c3 = new THREE.Color(shade(color, 1.1));
  const yMin = prof[0][0], yMax = prof[rows - 1][0];
  for (let j = 0; j < rows; j++) for (let i = 0; i <= nth; i++) {
    const th = lerp(a0, a1, i / nth), s = (prof[j][0] - yMin) / (yMax - yMin), amp = 0.022 + 0.1 * sstep(0.35, 1, s), p = Math.cos(pleat * th), r = prof[j][1] * (1 + amp * p) * (j === 0 || j === rows - 1 ? 1 : 1);
    pos.push(r * Math.cos(th), prof[j][0], r * Math.sin(th) * zk);
    const c = p > 0.35 ? c3 : p < -0.35 ? c2 : c1; col.push(c.r, c.g, c.b);
  }
  for (let j = 0; j < rows - 1; j++) for (let i = 0; i < nth; i++) { const a = j * (nth + 1) + i, b = a + 1, c = a + nth + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const bagMat = (extra = {}) => { const m = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.55, side: THREE.DoubleSide, ...extra }); m.userData.noHatch = true; return m; };
// the screw cap: a flange and a ridged cylinder, its axis y, bottom at y0
function capParts(parent, y0, color, r = 0.0375, h = 0.03) {
  const m = mat(color, { roughness: 0.4 }); m.userData.noHatch = true;
  mesh(new THREE.CylinderGeometry(r * 1.2, r * 1.2, 0.006, 20), m, parent, 0, y0 + 0.003, 0);
  mesh(new THREE.CylinderGeometry(r, r, h - 0.006, 20), m, parent, 0, y0 + 0.006 + (h - 0.006) / 2, 0);
  for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU, rib = box(0.004, h - 0.012, 0.004, parent, m, Math.cos(a) * r, y0 + 0.006 + (h - 0.006) / 2, Math.sin(a) * r); rib.rotation.y = -a; rib.castShadow = false; }
}

const worn = (P) => P.whole.traverse((o) => { if (o.isMesh) o.userData.steam = true; });   // see-through for the contact checks, like the knitwear
const SPROUT_RX = { spud: 1, chip: 1.25, wedge: 2.2, mash: 2.2 };
function wornDef(S) {
  const f = S.fit ?? S.wear ?? "mash";
  if (f && typeof f === "object") return { ...AA_BODIES.mash, ...f };
  const key = String(f).replace(/^.*\//, "");
  return { ...(AA_BODIES[key] || AA_BODIES.mash), key };
}
// the skin: potato.js bodyPoint (as bobblehat's wornBody): direction d (unit) -> the point on the body's surface in the body frame
function skin(B) {
  const rx = B.width / 2, ry = B.height / 2, rz = B.depth / 2, cy = 0.14 + ry;
  let sd = (B.seed || 1) * 7919 >>> 0 || 1;
  const rg = () => { sd = (sd + 0x6d2b79f5) >>> 0; let t = sd; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const lumps = Array.from({ length: 9 }, () => { const d = V(rg() * 2 - 1, rg() * 2 - 1, rg() * 2 - 1).normalize(); return { d, a: (rg() * 2 - 1) * B.lump, k: 3 + rg() * 5 }; });
  const point = (d) => {
    let r = 1; for (const L of lumps) r += L.a * Math.exp(-L.k * (1 - d.dot(L.d)));
    const taper = 1 - (B.taper ?? 0.07) * d.y;
    if (B.square) { const q = B.square; r /= Math.pow(Math.abs(d.x) ** q + Math.abs(d.y) ** q + Math.abs(d.z) ** q, 1 / q); }
    return V(d.x * rx * taper * r, cy + d.y * ry * r, d.z * rz * taper * r);
  };
  // the skin point under a plan position (x, z) on the upper half: bisection on the elevation of the direction (the plan radius shrinks as it rises)
  const topAt = (x, z) => {
    const th = Math.atan2(z / rz, x / rx), want = Math.hypot(x, z);
    let a = 0, b = 1;
    for (let i = 0; i < 30; i++) {
      const m = (a + b) / 2, e = Math.sqrt(1 - m * m), p = point(V(Math.cos(th) * e, m, Math.sin(th) * e));
      if (Math.hypot(p.x, p.z) > want) a = m; else b = m;   // the plan radius shrinks as the elevation rises
    }
    const m = (a + b) / 2, e = Math.sqrt(1 - m * m);
    return point(V(Math.cos(th) * e, m, Math.sin(th) * e));
  };
  const normalAt = (x, z) => { const e = 0.006, a = topAt(x + e, z).y - topAt(x - e, z).y, b = topAt(x, z + e).y - topAt(x, z - e).y; return V(-a / (2 * e), 1, -b / (2 * e)).normalize(); };
  return { rx, ry, rz, cy, point, topAt, normalAt, crown: point(V(0, 1, 0)).y };
}

// ------------------------------------------------------------------------------------------------ scribble notes (marks only: no letters, no digits)
const NOTE_INK = new Map();
function scribbleTex(hand, paper, ink) {
  const key = `${hand}|${paper}|${ink}`;
  if (!NOTE_INK.has(key)) {
    const t = canvasTex(192, 192, (g, w, h) => {
      g.fillStyle = paper; g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(150,110,20,0.09)"; g.fillRect(0, 0, w, h * 0.14);                 // the glue strip
      const gr = g.createLinearGradient(0, h * 0.6, 0, h); gr.addColorStop(0, "rgba(150,110,20,0)"); gr.addColorStop(1, "rgba(150,110,20,0.12)"); g.fillStyle = gr; g.fillRect(0, h * 0.6, w, h * 0.4);
      g.strokeStyle = ink; g.fillStyle = ink; g.lineCap = "round"; g.lineJoin = "round"; g.lineWidth = w * 0.045;
      const X = (u) => u * w, Y = (v) => v * h, jit = (i, a) => (hash(hand * 91 + i * 7.3) - 0.5) * a * w;
      const line = (x0, y0, x1, y1, i = 0) => { g.beginPath(); g.moveTo(X(x0) + jit(i, 0.02), Y(y0) + jit(i + 1, 0.02)); g.lineTo(X(x1) + jit(i + 2, 0.02), Y(y1) + jit(i + 3, 0.02)); g.stroke(); };
      const wavy = (x0, x1, y, amp, n, i = 0) => { g.beginPath(); for (let k = 0; k <= 24; k++) { const u = k / 24, px = X(x0 + (x1 - x0) * u), py = Y(y) + Math.sin(u * n * TAU + i) * amp * h; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); };
      switch (hand % 7) {
        case 0: wavy(0.16, 0.84, 0.32, 0.035, 2.2, 0); wavy(0.16, 0.8, 0.54, 0.035, 2.6, 1); wavy(0.16, 0.7, 0.76, 0.035, 1.8, 2); break;
        case 1: line(0.16, 0.3, 0.82, 0.31, 1); line(0.16, 0.48, 0.7, 0.47, 5); line(0.16, 0.68, 0.6, 0.68, 9); line(0.16, 0.8, 0.5, 0.8, 13); break;
        case 2: g.strokeRect(X(0.2), Y(0.26), w * 0.2, h * 0.2); line(0.24, 0.35, 0.3, 0.42, 3); line(0.3, 0.42, 0.4, 0.22, 7); wavy(0.5, 0.86, 0.34, 0.03, 1.5, 3); g.strokeRect(X(0.2), Y(0.58), w * 0.2, h * 0.2); wavy(0.5, 0.8, 0.68, 0.03, 1.8, 5); break;
        case 3: for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(X(0.2), Y(0.3 + k * 0.2), w * 0.035, 0, TAU); g.fill(); wavy(0.32, 0.8 - k * 0.1, 0.3 + k * 0.2, 0.025, 1.5 + k * 0.4, k * 2); } break;
        case 4: for (let k = 0; k < 4; k++) { const hh = [0.22, 0.4, 0.3, 0.52][k]; g.fillRect(X(0.18 + k * 0.17), Y(0.78 - hh), w * 0.11, h * hh); } line(0.12, 0.8, 0.88, 0.8, 4); break;
        case 5: g.beginPath(); for (let k = 0; k <= 7; k++) { const px = X(0.12 + k * 0.109), py = Y(k % 2 ? 0.62 : 0.3); k ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); line(0.2, 0.78, 0.7, 0.8, 8); break;
        default: line(0.16, 0.26, 0.4, 0.26, 3); line(0.16, 0.42, 0.62, 0.42, 6); line(0.16, 0.58, 0.82, 0.58, 9); wavy(0.16, 0.7, 0.78, 0.03, 2, 4); break;
      }
    });
    const m = mat("#ffffff", { map: t, roughness: 0.9 }); flat(m);
    NOTE_INK.set(key, m);
  }
  return NOTE_INK.get(key);
}
const NOTES11 = [   // [x, y, w, h, paper, pin]: the DESIGN's seven notes, world x, y when the prop sits at (0, 0, -1.285)
  [-1.55, 1.50, 0.15, 0.15, "#FDF3A6", null], [-1.42, 1.22, 0.15, 0.21, "#F6F3EA", "#2F6FB5"], [-0.78, 1.66, 0.14, 0.14, "#EFE2A0", null],
  [-0.70, 0.98, 0.15, 0.21, "#F6F3EA", "#F2C94C"], [0.52, 1.02, 0.13, 0.13, "#FDF3A6", null], [0.80, 1.55, 0.15, 0.21, "#F6F3EA", "#4E9A5A"], [1.10, 1.20, 0.17, 0.17, "#EFE2A0", null],
];

// ------------------------------------------------------------------------------------------------ the kinds
export const OFFICE11_KINDS = {
  // ---------------------------------------------------------------------------------------------- workdesk
  workdesk(P) {
    const S = P.spec, W = S.w ?? 0.9, H = S.h ?? 0.5, D = S.d ?? 0.55, TT = 0.03, PL = 0.05;
    const top = mat(S.top ?? "#B58E63", { roughness: 0.7 }), edge = mat(S.edge ?? "#8C6B48", { roughness: 0.75 }), panel = mat(S.panel ?? "#6C6660", { roughness: 0.8 }), plinth = mat(S.plinth ?? "#4A4642", { roughness: 0.85 });
    const slab = box(W, TT, D, P.whole, edge, 0, H - TT / 2, 0); slab.userData.solid = true;                    // the edge band: the slab's sides
    const face = mesh(new THREE.PlaneGeometry(W - 0.008, D - 0.008), top, P.whole, 0, H + 0.0006, 0); face.rotation.x = -Math.PI / 2; decor(face).castShadow = false; flat(top);   // the top face, 0.004 in from each edge
    const body = box(W - 0.004, H - TT - PL, D - 0.004, P.whole, panel, 0, PL + (H - TT - PL) / 2, 0); body.userData.solid = true;   // front, side and back panels to the floor
    box(W - 0.02, PL, D - 0.02, P.whole, plinth, 0, PL / 2, 0).userData.solid = true;                         // the plinth, set back 0.01
    // the panels' inset lines (a darker frame on the front and both sides), paint not geometry
    const line = mat(shade(S.panel ?? "#6C6660", 0.72), { roughness: 0.9 }); flat(line);
    const fy = PL + (H - TT - PL) / 2, fh = H - TT - PL - 0.07, bar = (w, h, x, y, z, ry = 0) => { const o = box(w, h, 0.0016, P.whole, line, x, y, z); o.rotation.y = ry; decor(o).castShadow = false; return o; };
    for (const [fw, fz, ry, px] of [[W - 0.1, D / 2 + 0.0002, 0, 0], [D - 0.1, 0, Math.PI / 2, W / 2 + 0.0002], [D - 0.1, 0, Math.PI / 2, -W / 2 - 0.0002]]) {
      const cx = ry ? px : 0, cz = ry ? 0 : fz;
      for (const s of [-1, 1]) { const horiz = bar(fw, 0.004, 0, 0, 0, ry); horiz.position.set(cx, fy + s * fh / 2, cz); const vert = bar(0.004, fh, 0, 0, 0, ry); vert.position.set(cx + (ry ? 0 : s * fw / 2), fy, cz + (ry ? s * fw / 2 : 0)); }
    }
    return { grip: H };
  },

  // ---------------------------------------------------------------------------------------------- officechair
  officechair(P) {
    const S = P.spec, up = mat(S.color ?? "#4A5560", { roughness: 0.85 }), base = mat("#2E3338", { roughness: 0.5, metalness: 0.2 });
    const look = (o) => { o.userData.solid = false; return o; };
    look(rbox(0.42, 0.06, 0.30, 0.025, P.whole, up, 0, 0.41, 0.02));                                           // the seat: top at y 0.44
    const back = look(rbox(0.40, 0.42, 0.06, 0.03, P.whole, up, 0, 0.69, -0.17)); back.rotation.x = -0.06;     // 0.48..0.90
    look(box(0.05, 0.14, 0.03, P.whole, base, 0, 0.47, -0.14));                                                // the back's bracket
    look(mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.28, 12), base, P.whole, 0, 0.25, 0));                 // the gas stem
    look(mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.05, 12), base, P.whole, 0, 0.375, 0));
    look(mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.04, 12), base, P.whole, 0, 0.105, 0));                // the hub
    for (let k = 0; k < 5; k++) {                                                                               // the five-star base
      const a = (k / 5) * TAU + 0.31, L = 0.27, arm = look(box(L, 0.028, 0.04, P.whole, base, Math.cos(a) * L / 2, 0.075, Math.sin(a) * L / 2)); arm.rotation.y = -a;
      look(mesh(new THREE.SphereGeometry(0.026, 10, 8), base, P.whole, Math.cos(a) * (L + 0.005), 0.03, Math.sin(a) * (L + 0.005)));   // the caster
    }
    if (S.patch) {                                                                                              // panel 01: a patch with six stitches on the back's upper left
      const pt = canvasTex(128, 160, (g, w, h) => {
        g.fillStyle = "#A9794A"; g.fillRect(0, 0, w, h);
        g.fillStyle = "rgba(60,36,16,0.18)"; g.fillRect(0, h - 10, w, 10);
        g.strokeStyle = "#3C2A18"; g.lineWidth = 5; g.lineCap = "round";
        for (const [x0, y0, x1, y1] of [[22, 12, 46, 12], [82, 12, 106, 12], [22, 148, 46, 148], [82, 148, 106, 148], [8, 62, 8, 96], [120, 62, 120, 96]]) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
      });
      const pm = mat("#ffffff", { map: pt, roughness: 0.95 }); flat(pm);
      const patch = look(mesh(new THREE.PlaneGeometry(0.10, 0.12), pm, P.whole, -0.095, 0.79, -0.17 + 0.0305 + 0.002)); patch.rotation.set(-0.06, 0, -0.1); patch.castShadow = false;
    }
    return { grip: 0 };
  },

  // ---------------------------------------------------------------------------------------------- wallnotes
  wallnotes(P) {
    const S = P.spec, list = S.notes ?? NOTES11, ink = S.ink ?? "#2C4A9A";
    list.forEach(([x, y, w, h, paper, pin], i) => {
      const g = new THREE.Group(); g.position.set(x, y, 0.003 + 0.0004 * (i % 3)); g.rotation.z = (hash(i * 3.7 + 1) - 0.5) * 6 * DEG; P.whole.add(g);
      const edgeM = mat(paper, { roughness: 0.9 }); flat(edgeM);
      const note = mesh(new THREE.BoxGeometry(w, h, 0.003), [edgeM, edgeM, edgeM, edgeM, scribbleTex(i * 3 + Math.floor(hash(i + 20) * 5), paper, ink), edgeM], g, 0, 0, 0);
      decor(note).castShadow = false;
      if (pin) { const pm = mat(pin, { roughness: 0.4 }); const p = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.008, 14), pm, g, 0, h / 2 - 0.022, 0.006); p.rotation.x = Math.PI / 2; decor(p).castShadow = false;
        const hi = mesh(new THREE.SphereGeometry(0.004, 8, 6), mat("#ffffff", { roughness: 0.3 }), g, -0.003, h / 2 - 0.019, 0.011); decor(hi).castShadow = false; }
    });
    return { grip: 0 };
  },

  // ---------------------------------------------------------------------------------------------- paperstack
  paperstack(P) {
    const S = P.spec, W = 0.22, H = 0.09, D = 0.30, N = 40;
    const sides = canvasTex(64, 256, (g, w, h) => {                   // the sheets' edges, drawn once: 40 sheets, each its own tone and a little ragged
      g.fillStyle = "#F6F3EA"; g.fillRect(0, 0, w, h);
      for (let k = 0; k < N; k++) {
        const y = h - ((k + 1) / N) * h;
        g.fillStyle = `rgba(150,142,122,${0.16 + 0.14 * hash(k * 1.9)})`; g.fillRect(0, y + h / N - 1.6, w, 1.6);
        if (hash(k * 4.1 + 2) > 0.7) { g.fillStyle = "rgba(255,255,255,0.5)"; g.fillRect(w * hash(k + 9) * 0.5, y + 1, w * 0.4, 1.2); }
      }
    });
    const tp = canvasTex(160, 220, (g, w, h) => {                      // the top sheet: four grey bars (no letters)
      g.fillStyle = "#F6F3EA"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#B5B0A4";
      for (const [x, y, bw] of [[0.14, 0.22, 0.7], [0.14, 0.38, 0.62], [0.14, 0.54, 0.7], [0.14, 0.7, 0.4]]) g.fillRect(w * x, h * y, w * bw, h * 0.07);
      g.strokeStyle = "rgba(150,142,122,0.5)"; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
    });
    const sm = mat("#ffffff", { map: sides, roughness: 0.9 }), tm = mat("#ffffff", { map: tp, roughness: 0.9 }), bm = mat("#F6F3EA", { roughness: 0.9 }); flat(sm); flat(tm);
    const stack = mesh(new THREE.BoxGeometry(W, 1, D), [sm, sm, tm, bm, sm, sm], P.whole, 0, 0, 0);
    stack.userData.solid = false;
    return { grip: H, apply(ps) {
      const a = clamp(ps.amount ?? S.amount ?? 1, 0.3, 1), h = H * a;
      stack.scale.y = h; stack.position.y = h / 2; sides.repeat.set(1, a);
    } };
  },

  // ---------------------------------------------------------------------------------------------- manilafolder
  manilafolder(P) {
    const S = P.spec, W = 0.24, BH = 0.30, T = 0.008, TABW = 0.075, TABH = 0.02;
    const card = mat("#E2C48A", { roughness: 0.85 }), dark = mat("#C9A96B", { roughness: 0.85 });
    const tipG = new THREE.Group(); P.whole.add(tipG);                  // the fan swings this about the bottom edge
    rbox(W, BH, T, 0.004, tipG, card, 0, BH / 2, 0);
    rbox(TABW, TABH + 0.008, T, 0.004, tipG, dark, 0.05, BH + TABH / 2 - 0.004, 0);                   // the cut tab on the top edge, right of the middle
    const mark = canvasTex(240, 300, (g, w, h) => {                      // two scribble bars and the crease, no letters
      g.clearRect(0, 0, w, h);
      g.fillStyle = "#7A6338"; g.globalAlpha = 0.85;
      for (const [x, y, bw] of [[0.16, 0.3, 0.55], [0.16, 0.42, 0.42]]) { g.beginPath(); for (let k = 0; k <= 20; k++) { const u = k / 20, px = w * (x + bw * u), py = h * y + Math.sin(u * 7 + x * 9) * 3; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.lineWidth = 9; g.strokeStyle = "#7A6338"; g.lineCap = "round"; g.stroke(); }
      g.globalAlpha = 0.5; g.fillStyle = "#B4935A"; g.fillRect(0, h * 0.82, w, 3);                         // the crease near the foot
      g.globalAlpha = 1;
    });
    const mm = new THREE.MeshStandardMaterial({ map: mark, transparent: true, roughness: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); flat(mm); mm.userData.noOutline = true;
    for (const s of [1, -1]) { const p = mesh(new THREE.PlaneGeometry(W * 0.96, BH * 0.96), mm, tipG, 0, BH / 2, s * (T / 2 + 0.0006)); if (s < 0) p.rotation.y = Math.PI; decor(p).castShadow = false; }
    return { grip: BH * 0.42, apply(ps, t) {
      const f = clamp(num(ps, S, "fan"));
      tipG.rotation.x = f > 0 ? 18 * DEG * f * Math.sin(TAU * 4 * (t || 0)) : 0;
    } };
  },

  // ---------------------------------------------------------------------------------------------- icebag
  icebag(P) {
    const S = P.spec, part = S.part ?? "worn", C = S.color ?? BAG, CAP = S.cap ?? CAPW;
    if (part === "loose") {
      // standing flat against a wall: a half body of revolution (theta 0..pi), x +-0.12, y -0.10..+0.07, z 0..0.09 (the back is the plane z = 0), the cap above
      const prof = [[-0.1, 0], [-0.098, 0.04], [-0.085, 0.085], [-0.06, 0.113], [-0.02, 0.12], [0.02, 0.11], [0.045, 0.08], [0.06, 0.05], [0.072, 0.036]];
      const body = new THREE.Mesh(pleatedGeo(prof, 0, Math.PI, 48, C, 0.09 / 0.12), bagMat()); body.castShadow = true; body.receiveShadow = true; P.whole.add(body); body.userData.solid = false;
      const back = new THREE.Shape(); prof.forEach(([y, r], j) => { j ? back.lineTo(r * 0.99, y) : back.moveTo(0, y); }); for (let j = prof.length - 1; j >= 0; j--) back.lineTo(-prof[j][1] * 0.99, prof[j][0]);
      const bm = new THREE.MeshStandardMaterial({ color: shade(C, 0.8), roughness: 0.8, side: THREE.DoubleSide }); flat(bm);
      const bk = new THREE.Mesh(new THREE.ShapeGeometry(back), bm); bk.position.z = 0.0008; bk.userData.solid = false; bk.castShadow = false; P.whole.add(bk);
      const cg = new THREE.Group(); cg.position.set(0, 0.07, 0.026); cg.rotation.z = 0.0; P.whole.add(cg); capParts(cg, 0, CAP, 0.0375, 0.03); cg.traverse((o) => { if (o.isMesh) o.userData.solid = false; });
      return { grip: 0 };
    }
    // worn: slumped on the crown, screen-left of the sprout
    const BD = wornDef(S), B = skin(BD), k = BD.width / 0.54;
    const [ax, az] = S.at ?? [-0.14 * k, 0.0], lean = S.lean ?? 1;
    const base = B.topAt(ax, az), n = B.normalAt(ax, az), upv = n.clone().multiplyScalar(0.5).add(V(0, 0.5, 0)).normalize();
    const root = new THREE.Group(); root.position.copy(base).addScaledVector(n, -0.012);
    root.quaternion.setFromUnitVectors(V(0, 1, 0), upv); P.whole.add(root);
    // profile: base disc 0.26, belly, gathered neck at 0.082, then the cap 0.08..0.11
    const prof = [[0, 0], [0, 0.1], [0.005, 0.127], [0.028, 0.13], [0.048, 0.115], [0.064, 0.08], [0.076, 0.045], [0.082, 0.034]];
    const bodyG = pleatedGeo(prof, 0, TAU, 96, C, 1);
    const pa = bodyG.attributes.position, mw = new THREE.Matrix4().compose(root.position, root.quaternion, V(1, 1, 1));
    const slump = (y) => { const u = clamp(y / 0.11); return u * u; };
    for (let i = 0; i < pa.count; i++) {       // slump: the upper bag leans toward the screen-left and a little forward and sags wider; the base is conformed to the skin
      const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), s = slump(y);
      let X = x * (1 + 0.1 * s * lean) - 0.032 * s * lean, Y = y * (1 - 0.1 * s * lean), Z = z + 0.012 * s * lean;
      if (y < 0.012) {   // the base follows the head's curve: the world point is pushed up to the skin under it
        const w = V(X, Y, Z).applyMatrix4(mw), sk = B.topAt(w.x, w.z), under = w.y - (sk.y + 0.0015);
        if (Math.hypot(w.x, w.z) < B.rx * 0.97 && under < 0) { const lw = V(w.x, w.y - under, w.z).applyMatrix4(mw.clone().invert()); X = lw.x; Y = lw.y; Z = lw.z; }
      }
      pa.setXYZ(i, X, Y, Z);
    }
    bodyG.computeVertexNormals();
    const body = new THREE.Mesh(bodyG, bagMat()); body.castShadow = true; body.receiveShadow = true; root.add(body);
    const cg = new THREE.Group(); const sc = slump(0.082); cg.position.set(-0.032 * sc * lean, 0.082 * (1 - 0.1 * sc * lean) - 0.002, 0.012 * sc * lean); cg.rotation.z = 0.2 * lean; cg.rotation.x = 0.08 * lean; root.add(cg);
    capParts(cg, 0, CAP, 0.0375, 0.03);
    worn(P);
    return { grip: 0 };
  },
};
