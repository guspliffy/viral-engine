import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { PLANE_KINDS } from "./props-plane.js";
import { clamp } from "./util.js";

// You wake up mid, EP01 plane crash (11 Nov 2026; brief storyboards/series/you-wake-up-mid/01-plane-crash/briefs/T1-cabin.md):
// the whole inside of a single-aisle airliner cabin as ONE prop, built to Jonny's panels 02-04 and 07-08 (dark blue seats
// with white headrest covers, pale grey walls and bins, oval windows, warm ceiling light panels, a dark blue carpet, a
// green lit EXIT sign over the door at the front). No cast, no smoke, no fire, no bags, no exterior skin.
//
//   cabinhall   the hall. ORIGIN: on the floor, in the middle of the aisle, at Spud's row (row 0). x right, y up, z toward the
//               plane's nose; metres. NOTHING for a hand to hold (grip 0). Everything is one-sided and faces inward, so a camera
//               outside a wall sees into the cabin. The whole hall is see-through for the contact checks (userData.steam) and
//               casts and receives no shadows.
//   SIZES       aisle |x| <= 0.5. Seat centres x = +2.09 (A, port window), +1.03 (B), -1.03 (C), -2.09 (D), each 0.96 wide,
//               facing +z. 11 rows k = -3..7 at z = 1.35 * k (z -4.05 .. 9.45); Spud's row is k 0, the door is seven rows
//               ahead. Side walls: inner face at x = +-2.65 up to y 1.9, curving in to the bins. Bins: underside y 2.35 from |x| 0.62
//               to 2.6, lids (the front faces) up to y 2.75; flat ceiling y 2.75 with one warm light panel per row (z = 1.35 k + 0.2).
//               Windows: 22 ovals, 0.44 x 0.6, centre y 1.3, one per row per side at z = 1.35 k + 0.4. Floor y 0 (the carpet
//               top sits 4 mm above it and wins the depth test, so it never fights the snowy ground the set draws at y 0),
//               pale strips at |x| 0.5. Front bulkhead z 10.5, doorway x -0.5..0.5, y 0..2.0, the EXIT sign (0.72 x 0.3 m) centred
//               (0, 2.2, 10.44) facing -z; back bulkhead z -4.95. Doorway daylight plane at z 10.62 (behind the door).
//   spec        omit    seats left out: [[row, "A".."D"], ...], default [[0,"A"],[0,"B"],[1,"B"]]: put real `planeseat`
//                       props there (w 0.96, arms "both", color HALL_SEAT, cover 0.34); the hall's own seats are all one merged
//                       mesh per material, so a hole costs nothing. No mask hangs over an omitted seat.
//               seat    the hall's seat colour, default "#2f4d8c" (use the same colour on the real planeseat props)
//               feed, level, drop, lid, open, fill   the start values of the keys below (a `prop` action tweens each one)
//   KEYS        (existing propState keys, tweened by { do: "prop", id, set: {...} })
//               feed  0..2  the VIEW out of every window (default 0): 0 cold grey-white high cloud drifting slowly; 1 snowy pine
//                           treetops rushing past toward -z at 60 m/s (streaked, close, fills the pane; panel 04); 2 a still
//                           snowy pine forest with smoke drifting (panel 09). Between whole numbers the views blend.
//               level 0..1  the cabin LIGHTS (default 1): the ceiling and reading-light panels and the brightness of every
//                           cabin surface; at 0 the cabin is dim grey and only the window views (and the EXIT sign, the
//                           door's daylight) stay bright. Quantised to eighths (a variant material per step), so a tween steps.
//               drop  0..1  the oxygen MASKS: a yellow mask on a white hose drops from the bin underside over every drawn
//                           seat (0 stowed and hidden, 1 hanging 0.5 m, cup open toward +z); they swing a little, a pure
//                           function of the story time.
//               lid   0..1  the bin LIDS: every lid (22) swings up on its top hinge (to about 75 degrees) and shows the dark
//                           inside.
//               open  0..1  the front DOOR: a grey panel with a small round window, hinged at x -0.5, swinging out through
//                           the bulkhead; at 1 the panel is gone and flat bright cold daylight (white-blue) fills the doorway.
//               fill  0..1  the EXIT SIGN's brightness (default 1) = its opacity (material transparent, depthWrite false,
//                           renderOrder 20, so smoke at renderOrder 10 never hides it).
//   HALL_SEAT   exported: the seat colour above.
export const HALL_SEAT = "#2f4d8c";

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mk = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
const quiet = (m) => { m.userData.noOutline = true; return m; };   // big plain surfaces take no ink line
const basic = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, ...o }); m.userData.noOutline = true; return m; };
const ZP = 1.35, ROWS = [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7], X_OF = { A: 2.09, B: 1.03, C: -1.03, D: -2.09 };
const Z0 = -4.95, Z1 = 10.5, W = 2.65, ZC = (Z0 + Z1) / 2, LEN = Z1 - Z0;
const WIN_Y = 1.3, WIN_RX = 0.22, WIN_RY = 0.3;

// ---- lights: the dimmable surfaces. A material converted by the look is cached by the material object, so a colour change
// after the first frame never reaches it; instead each standard material has a few pre-dimmed variants and apply() swaps
// every mesh to the variant for the light level (a swap only when the step changes).
const STEPS = 8;
function dimKit() {
  const fams = new Map(), ents = []; let cur = STEPS;
  const variant = (f, k) => {
    if (k >= STEPS) return f.m;
    if (!f.v[k]) {
      const lv = k / STEPS, v = f.m.clone(), c = v.color, g = c.r * 0.3 + c.g * 0.59 + c.b * 0.11, d = 0.45 * (1 - lv), s = 0.2 + 0.8 * lv;
      c.r += (g - c.r) * d; c.g += (g - c.g) * d; c.b += (g - c.b) * d; c.multiplyScalar(s); f.v[k] = v;
    }
    return f.v[k];
  };
  return {
    track(o) {
      const m = o.material;
      if (!m || !m.isMeshStandardMaterial) return o;
      let f = fams.get(m); if (!f) fams.set(m, f = { m, v: [] });
      ents.push({ o, f }); return o;
    },
    set(level) {
      const k = Math.round(clamp(level) * STEPS);
      if (k === cur) return; cur = k;
      for (const e of ents) e.o.material = variant(e.f, k);
    },
  };
}

// a canvas texture, drawn the same every time (no random, no clock)
function canvasTex(w, h, draw, repeat = false) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; }
  return t;
}
const carpetTex = () => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = "#18214a"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { const x = rnd(i) * w, y = rnd(i + 500) * h; g.fillStyle = rnd(i + 900) > 0.5 ? "#26346a" : "#10173a"; g.fillRect(x, y, 2, 2); g.fillRect(x - w * (x + 2 > w), y, 2, 2); }
}, true);
const signTex = () => canvasTex(256, 104, (g, w, h) => {
  g.fillStyle = "#1faa55"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#ffffff"; g.lineWidth = 3; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = "#ffffff"; g.font = "bold 74px Arial, Helvetica, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("EXIT", w / 2, h / 2 + 4);
});
const dayTex = () => canvasTex(8, 64, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#8fb4ec"); gr.addColorStop(0.55, "#c4dbf8"); gr.addColorStop(1, "#e8f2ff");
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});

const toNI = (g) => (g.index ? g.toNonIndexed() : g);
const merged = (geos) => mergeGeometries(geos.map(toNI), false);
const planeAt = (w, h, rx, ry, x, y, z) => { const g = new THREE.PlaneGeometry(w, h); if (rx) g.rotateX(rx); if (ry) g.rotateY(ry); g.translate(x, y, z); return g; };

// ---- the window views: one shader on 22 cards just outside the wall (never a hole to the world)
const VIEW_VS = `attribute float aZ; varying vec2 vP;
void main() { vP = vec2(position.z - aZ, position.y - ${WIN_Y.toFixed(2)}); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const VIEW_FS = `uniform float uTime, uView; varying vec2 vP;
float h1(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h1(i.x + i.y * 57.0), h1(i.x + 1.0 + i.y * 57.0), f.x), mix(h1(i.x + (i.y + 1.0) * 57.0), h1(i.x + 1.0 + (i.y + 1.0) * 57.0), f.x), f.y); }
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + vec2(13.1, 7.7); a *= 0.5; } return s; }
// one row of snowy pines: x = coverage, y = 1 on the snowy upper half of a tier
vec2 pine(float x, float y, float cell, float seed, float base, float hmax, float fl) {
  if (y < base) return fl > 0.5 ? vec2(1.0, step(0.9, h1(floor(x * 2.0) * 7.0 + floor(y) * 13.0 + seed))) : vec2(0.0);   // fl: a solid canopy below the trees' feet
  float i = floor(x / cell); vec2 r = vec2(0.0);
  for (int d = -1; d <= 1; d++) {
    float ci = i + float(d);
    float cx = (ci + 0.2 + 0.6 * h1(ci * 5.1 + seed * 1.7)) * cell, H = hmax * (0.65 + 0.35 * h1(ci * 3.7 + seed)), ty = (y - base) / H;
    if (ty > 0.0 && ty < 1.0) {
      float tier = fract(ty * 4.0), w = (1.0 - ty) * 0.55 * cell * (0.5 + 0.5 * (1.0 - tier));
      if (abs(x - cx) < w) r = vec2(1.0, step(0.5, tier));
    }
  }
  return r;
}
const vec3 PINE = vec3(0.14, 0.27, 0.22), SNOW = vec3(0.90, 0.94, 0.98);
vec3 layer(vec3 col, vec2 a, vec3 dark, float haze, vec3 sky) { vec3 c = mix(dark, SNOW, a.y * 0.85); return mix(col, mix(c, sky, haze), a.x); }
// view 1: treetops close under the wing, 60 m/s (world metres: x along the plane toward -z, y up)
vec3 rush(float x, float y) {
  vec3 sky = mix(vec3(0.78, 0.84, 0.91), vec3(0.93, 0.96, 0.99), smoothstep(-2.0, 7.0, y)), col = sky;
  col = layer(col, pine(x * 0.8 + 17.0, y, 2.4, 3.1, -4.0, 9.0, 1.0), PINE * 1.25, 0.45, sky);
  col = layer(col, pine(x + 5.0, y, 3.2, 7.3, -5.0, 10.0, 1.0), PINE * 1.1, 0.25, sky);
  col = layer(col, pine(x * 1.15, y, 4.4, 1.9, -6.0, 11.5, 1.0), PINE * 0.85, 0.0, sky);
  return col;
}
// view 2: the crash forest, still: farther trees, snow on the ground, smoke drifting up
vec3 forest(float x, float y, float t) {
  vec3 sky = mix(vec3(0.62, 0.66, 0.72), vec3(0.84, 0.87, 0.91), smoothstep(-6.0, 12.0, y)), col = sky;
  col = layer(col, pine(x * 1.3 + 3.0, y, 2.2, 5.3, -5.5, 12.0, 0.0), PINE * 1.5, 0.55, sky);
  col = layer(col, pine(x + 11.0, y, 3.1, 8.1, -8.0, 15.0, 0.0), PINE * 1.2, 0.3, sky);
  col = layer(col, pine(x * 0.8, y, 4.3, 2.4, -10.0, 19.0, 0.0), PINE * 0.9, 0.0, sky);
  col = mix(col, mix(vec3(0.86, 0.9, 0.95), vec3(0.74, 0.8, 0.88), smoothstep(-14.0, -9.0, y)), 1.0 - smoothstep(-9.8, -8.2, y + 0.4 * sin(x * 0.7)));
  float sm = fbm(vec2(x * 0.07 + uTime * 0.12, y * 0.06 - uTime * 0.22 + 2.0));
  return mix(col, vec3(0.22, 0.22, 0.25), smoothstep(0.4, 0.78, sm) * (0.4 + 0.5 * smoothstep(-8.0, 10.0, y)) * 0.9);
}
vec3 cloud(vec2 p, float t) {
  float c = fbm(vec2(p.x * 4.0 + t * 0.05, p.y * 6.0 - t * 0.012)), c2 = fbm(vec2(p.x * 9.0 - t * 0.03, p.y * 11.0 + 4.0));
  vec3 base = mix(vec3(0.60, 0.67, 0.77), vec3(0.78, 0.83, 0.90), smoothstep(-0.3, 0.3, p.y));
  return mix(mix(base, vec3(0.86, 0.90, 0.95), smoothstep(0.35, 0.7, c)), vec3(0.50, 0.57, 0.68), smoothstep(0.55, 0.8, c2) * 0.35);
}
void main() {
  float w0 = max(0.0, 1.0 - abs(uView)), w1 = max(0.0, 1.0 - abs(uView - 1.0)), w2 = max(0.0, 1.0 - abs(uView - 2.0));
  vec3 col = vec3(0.0);
  if (w0 > 0.0) col += w0 * cloud(vP, uTime);
  if (w1 > 0.0) {   // 60 m/s: the world slides toward -z, so what is at z now was at z + 60 t before; smeared over about a 60th of a second
    vec3 s = vec3(0.0); float x0 = vP.x * 20.0 + 60.0 * uTime, y = vP.y * 20.0;
    for (int i = 0; i < 7; i++) s += rush(x0 + (float(i) - 3.0) * 0.4, y);
    col += w1 * s / 7.0;
  }
  if (w2 > 0.0) col += w2 * forest(vP.x * 36.0, vP.y * 36.0, uTime);
  gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);   // the colours above are meant as they show: undo the final sRGB encode
}`;

export const WAKECABIN_KINDS = {
  cabinhall(P) {
    const S = P.spec, hall = P.whole, dim = dimKit();
    const omit = new Set((S.omit ?? [[0, "A"], [0, "B"], [1, "B"]]).map(([k, l]) => `${k}${l}`));
    const seatColor = S.seat ?? HALL_SEAT;
    const add = (geo, m, parent = hall) => { const o = new THREE.Mesh(geo, m); parent.add(o); return dim.track(o); };

    // materials
    const wallM = quiet(mk("#e4e8ee")), ceilM = quiet(mk("#e8ebf0")), binM = mk("#dfe4ea", { roughness: 0.6 }), binDark = quiet(mk("#24242c", { roughness: 1 })),
      trimM = mk("#cdd3dc", { roughness: 0.7 }), bulkM = quiet(mk("#dfe3ea")), doorM = mk("#aab2bd", { roughness: 0.6 }), panelM = mk("#c9ced6", { roughness: 0.6 }),
      stripM = quiet(mk("#c3cde4")), shoulderM = quiet(mk("#e4e8ee", { side: THREE.FrontSide }));
    const carpet = carpetTex(), floorM = quiet(mk("#ffffff", { map: carpet, roughness: 1, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 }));

    // floor (4 mm above the set's ground), the aisle edge strips, the ceiling, the bin undersides
    { const g = planeAt(2 * W, LEN, -Math.PI / 2, 0, 0, 0.004, ZC), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2 * W / 0.7, uv.getY(i) * LEN / 0.7); add(g, floorM); }
    add(merged([-1, 1].map((s) => planeAt(0.08, LEN, -Math.PI / 2, 0, s * 0.5, 0.006, ZC))), Object.assign(stripM, { polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -12 }));
    add(planeAt(2 * W, LEN, Math.PI / 2, 0, 0, 2.75, ZC), ceilM);
    add(merged([-1, 1].map((s) => planeAt(1.98, LEN, Math.PI / 2, 0, s * 1.61, 2.35, ZC))), ceilM);

    // side walls (an inner face with the window holes) and the shoulder that curves in to the bins
    const winZ = ROWS.map((k) => ZP * k + 0.4);
    for (const s of [1, -1]) {
      const sh = new THREE.Shape(), u0 = s > 0 ? Z0 : -Z1, u1 = s > 0 ? Z1 : -Z0;
      sh.moveTo(u0, 0); sh.lineTo(u1, 0); sh.lineTo(u1, 1.9); sh.lineTo(u0, 1.9); sh.lineTo(u0, 0);
      for (const z of winZ) { const h = new THREE.Path(); h.absellipse(s * z, WIN_Y, WIN_RX, WIN_RY, 0, Math.PI * 2, true); sh.holes.push(h); }
      const wall = add(new THREE.ShapeGeometry(sh, 24), wallM); wall.rotation.y = -s * Math.PI / 2; wall.position.x = s * W;
      // the shoulder: x from 2.65 to 2.6 and y from 1.9 to 2.35 in a smooth bend; quads facing -s x
      const pos = [], idx = [], N = 6;
      for (let j = 0; j <= N; j++) { const f = j / N, e = f * f * (3 - 2 * f); for (const z of [Z0, Z1]) pos.push(s * (W - 0.05 * e), 1.9 + 0.45 * f, z); }
      for (let j = 0; j < N; j++) { const a = j * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, c, b, b, c, d); }
      const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); sg.setIndex(idx); sg.computeVertexNormals();
      // the winding must face the aisle (-s x): flip it when the normal says otherwise
      if (sg.attributes.normal.getX(0) * s > 0) { sg.setIndex(idx.map((v, i, a) => (i % 3 === 1 ? a[i + 1] : i % 3 === 2 ? a[i - 1] : v))); sg.computeVertexNormals(); }
      add(sg, shoulderM);
    }

    // window frames (a thick oval ring on the cabin side of each hole)
    { const fs = new THREE.Shape(); fs.absellipse(0, 0, 0.3, 0.38, 0, Math.PI * 2, false);
      const ho = new THREE.Path(); ho.absellipse(0, 0, WIN_RX + 0.012, WIN_RY + 0.012, 0, Math.PI * 2, true); fs.holes.push(ho);
      const base = new THREE.ExtrudeGeometry(fs, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 20 }), list = [];
      for (const s of [1, -1]) for (const z of winZ) { const g = base.clone(); g.rotateY(-s * Math.PI / 2); g.translate(s * W, WIN_Y, z); list.push(g); }
      add(merged(list), trimM); }

    // the window views
    const viewU = { uTime: { value: 0 }, uView: { value: 0 } };
    { const list = [];
      for (const s of [1, -1]) for (const z of winZ) {
        const g = planeAt(0.8, 1.0, 0, -s * Math.PI / 2, s * (W + 0.05), WIN_Y, z);   // faces the aisle
        g.setAttribute("aZ", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(z), 1)); list.push(g);
      }
      const vm = new THREE.ShaderMaterial({ uniforms: viewU, vertexShader: VIEW_VS, fragmentShader: VIEW_FS }); vm.userData.noOutline = true;
      add(merged(list), vm); }

    // the seats: one built seat (the real planeseat, plus a white cover band on the back of the headrest), merged over every drawn seat
    const seatList = [];
    for (const k of ROWS) for (const l of "ABCD") if (!omit.has(`${k}${l}`)) seatList.push([X_OF[l], ZP * k, k, l]);
    { const proto = new THREE.Group(); PLANE_KINDS.planeseat({ whole: proto, spec: { w: 0.96, arms: "both", color: seatColor, cover: 0.34 } });
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.02), mk("#eef0f2", { roughness: 0.8 })); band.position.set(0, 1.16, -0.475); band.rotation.x = -8 * Math.PI / 180; proto.add(band);
      proto.updateMatrixWorld(true);
      const byMat = new Map();
      proto.traverse((o) => { if (o.isMesh) { const g = o.geometry.clone().applyMatrix4(o.matrixWorld); (byMat.get(o.material) ?? byMat.set(o.material, []).get(o.material)).push(toNI(g)); } });
      for (const [m, gs] of byMat) { const all = []; for (const [x, z] of seatList) for (const g of gs) all.push(g.clone().translate(x, 0, z)); add(mergeGeometries(all, false), m); } }

    // the bins: a dark inside behind the lids, one lid per row per side hinged on its top edge
    add(merged([-1, 1].map((s) => planeAt(LEN, 0.4, 0, -s * Math.PI / 2, s * 0.65, 2.55, ZC))), binDark);
    // (a plane's width runs along its own x; turned about y by +-90 degrees it runs along z)
    const lids = [];
    for (const s of [1, -1]) for (const k of ROWS) {
      const hg = new THREE.Group(); hg.position.set(s * 0.62, 2.75, ZP * k); hall.add(hg);
      const lid = add(new THREE.BoxGeometry(0.025, 0.4, ZP - 0.05), binM, hg); lid.position.set(s * 0.0125, -0.2, 0);
      lids.push([hg, s]);
    }

    // the ceiling light panels and the reading lights (the cabin's lit parts)
    const lightM = basic("#ffe3a6");
    add(merged(ROWS.map((k) => planeAt(0.62, 0.4, Math.PI / 2, 0, 0, 2.7485, ZP * k + 0.2))), quiet(mk("#8e9399", { roughness: 0.8 })));
    add(merged(ROWS.map((k) => planeAt(0.5, 0.28, Math.PI / 2, 0, 0, 2.7465, ZP * k + 0.2))), lightM);
    { const dots = [], pans = []; for (const [x, z] of seatList) { pans.push(new THREE.BoxGeometry(0.3, 0.012, 0.2).translate(x, 2.344, z + 0.05)); }
      add(merged(pans), panelM);
      for (const k of ROWS) for (const l of "ABCD") dots.push(new THREE.CircleGeometry(0.028, 12).rotateX(Math.PI / 2).translate(X_OF[l] + (l < "C" ? -0.2 : 0.2), 2.348, ZP * k - 0.2));
      add(merged(dots), lightM); }

    // the oxygen masks over every drawn seat
    const hoseM = mk("#f2f1ec", { roughness: 0.6 }), yel = mk("#f2bd12", { roughness: 0.45 }), clear = mk("#f6f1d8", { roughness: 0.2, transparent: true, opacity: 0.8 });
    const hoseG = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0, 0, 0], [0.025, -0.1, 0.015], [-0.025, -0.21, 0.03], [0.02, -0.34, 0.02], [0, -0.5, 0.03]].map((a) => new THREE.Vector3(...a))), 24, 0.0075, 5, false);
    const cupG = new THREE.CylinderGeometry(0.075, 0.045, 0.07, 16, 1, true), rimG = new THREE.TorusGeometry(0.075, 0.011, 6, 16), capG = new THREE.CircleGeometry(0.046, 14), bagG = new THREE.SphereGeometry(0.04, 10, 8);
    const masks = seatList.map(([x, z], i) => {
      const g = new THREE.Group(); g.position.set(x, 2.35, z + 0.05); hall.add(g);
      const hose = add(hoseG, hoseM, g), cup = new THREE.Group(); g.add(cup); cup.rotation.x = 0.35;
      add(cupG, yel, cup).rotation.x = Math.PI / 2; add(rimG, clear, cup).position.z = 0.035;
      const cap = add(capG, yel, cup); cap.position.z = -0.035; cap.rotation.y = Math.PI;
      const bag = add(bagG, clear, cup); bag.position.set(0, -0.08, -0.02); bag.scale.set(1, 1.2, 0.7);
      return { g, hose, cup, ph: rnd(i + 3) };
    });

    // the front bulkhead (a doorway cut in it), the door frame, the door, the daylight behind it, the EXIT sign
    { const sh = new THREE.Shape(); sh.moveTo(-W, 0); sh.lineTo(-0.5, 0); sh.lineTo(-0.5, 2.0); sh.lineTo(0.5, 2.0); sh.lineTo(0.5, 0); sh.lineTo(W, 0); sh.lineTo(W, 2.75); sh.lineTo(-W, 2.75); sh.lineTo(-W, 0);
      const b = add(new THREE.ShapeGeometry(sh), bulkM); b.rotation.y = Math.PI; b.position.z = Z1; }
    { const b = add(new THREE.PlaneGeometry(2 * W, 2.75), bulkM); b.position.set(0, 1.375, Z0); }   // back bulkhead (faces +z)
    add(merged([new THREE.BoxGeometry(0.06, 2.07, 0.08).translate(-0.53, 1.035, 10.46), new THREE.BoxGeometry(0.06, 2.07, 0.08).translate(0.53, 1.035, 10.46), new THREE.BoxGeometry(1.12, 0.07, 0.08).translate(0, 2.035, 10.46)]), trimM);
    const door = new THREE.Group(); door.position.set(-0.5, 0, 10.485); hall.add(door);
    add(new THREE.BoxGeometry(1.0, 2.0, 0.04), doorM, door).position.set(0.5, 1.0, 0);
    { const win = new THREE.Mesh(new THREE.CircleGeometry(0.085, 20), basic("#c5dbee")); win.position.set(0.5, 1.5, -0.0205); win.rotation.y = Math.PI; door.add(win);
      add(new THREE.TorusGeometry(0.095, 0.014, 6, 20), trimM, door).position.set(0.5, 1.5, -0.022); }
    const day = new THREE.Mesh(planeAt(4, 3, 0, Math.PI, 0, 1.5, 10.62), basic("#ffffff", { map: dayTex() })); hall.add(day); day.visible = false;
    const signM = basic("#ffffff", { map: signTex(), transparent: true, depthWrite: false });
    { const body = add(new THREE.BoxGeometry(0.74, 0.32, 0.06), mk("#26332b", { roughness: 0.6 })); body.position.set(0, 2.2, 10.47);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.3), signM); face.rotation.y = Math.PI; face.position.set(0, 2.2, 10.434); face.renderOrder = 20; hall.add(face); }

    // see-through for the contact checks, no shadows either way
    hall.traverse((o) => { o.userData.steam = true; o.castShadow = false; o.receiveShadow = false; });
    const mixC = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);

    return {
      grip: 0,
      apply(ps, t = 0) {
        viewU.uView.value = clamp(ps.feed ?? 0, 0, 2); viewU.uTime.value = t;
        const lv = clamp(ps.level ?? 1);
        dim.set(lv); lightM.color.copy(mixC("#3a3836", "#ffe3a6", lv * lv));
        const d = clamp(ps.drop ?? 0);
        for (const m of masks) {
          m.g.visible = d > 0.01; if (d <= 0.01) continue;
          m.hose.scale.y = d; m.cup.position.set(0, -0.5 * d, 0.03);
          m.g.rotation.set(0.05 * Math.sin(t * 1.5 + m.ph * 9), 0, 0.06 * Math.sin(t * 1.9 + m.ph * 6.28) + 0.025 * Math.sin(t * 3.1 + m.ph * 13));
        }
        const o = clamp(ps.lid ?? 0), e = o * o * (3 - 2 * o);
        for (const [h, s] of lids) h.rotation.z = -s * 1.3 * e;
        const dr = clamp(ps.open ?? 0); door.rotation.y = -dr * 1.5; door.visible = dr < 0.999; day.visible = dr > 0.001;
        const sg = clamp(ps.fill ?? 1); signM.opacity = sg; signM.visible = sg > 0.004;
      },
    };
  },
};
