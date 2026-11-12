import * as THREE from "three";
import { clamp } from "./util.js";
import { HATCH } from "./car-hatchback.js";
import { rigToWorld } from "./vehicle.js";

// You wake up mid, EP02 "mid sinking car" (12 Nov 2026): the cabin props of the sinking hatchback (task T2, DESIGN.md section 3,
// section 2 "Bubbles" and "Headlights"; briefs/T2-sinkcar.md). World: x right, y up, z = the car's heading, metres; the lake is
// y 0. Every number comes from a key and story time (no Math.random, no clock, no memory between frames). All water, glass,
// light and foam is userData.steam (see-through for the contact checks), casts no shadow and has no ink outline.
//
// THE CAR'S NUMBERS, MEASURED in car-hatchback.js (front +z, driver +x; 12 Nov). DESIGN's assumed ones differ: the cabin is a
// tub, not a 1.0 m box:
//   floor            y 0.36 flat for z -1.30..0.69 and |x| < 0.85 (the body's FLOOR; DESIGN assumed 0.32)
//   tub walls        x +-0.927 at y 0.45, +-0.961 at 0.60, +-0.992 at 0.75, about +-1.0 at the sill; the glass is at x +-0.99
//   tub front wall   z 0.69 (floor) .. 0.715 (y 0.47) .. 0.77 (y 0.82) .. 0.80 (sill); the dash pad sits on it (z 0.48..0.80)
//   tub rear wall    z -1.30 (floor) .. -1.375 (y 0.73), rear shelf under the hatch glass at y 0.86
//   sill (belt)      y 0.90 (the glass seal's bottom 0.92); roof centre 2.06, the roof pad's UNDERSIDE y 1.96 (water is drawn up to 1.94)
//   side openings    front: z -0.30..0.72 at the sill, top y 1.97 from z -0.30 to 0.34 (A pillar slants); rear: z -1.10..-0.42 at the sill,
//                    top y 1.97 (B pillar z -0.42..-0.30, C pillar z -1.43..-1.13); windscreen foot y 0.92, z 0.78, leaning back 19 degrees
//   seat cushion top = the carseat prop's y + 0.425 (props-road.js: pad at SEAT_Y-0.06, 0.13 thick). DESIGN's 0.72 needs seat y 0.295
//                    (EP01 used 0.12 -> cushion 0.545); its own headrest top is y + 0.42 + 0.92 + 0.12, 0.24 tall pad at z -0.53
//   inner box DESIGN assumed x +-0.50: it is x +-0.93..0.99, z -1.33..0.72. The seats are 0.78 / 0.86 wide at x +-0.55.
//
// All kinds ride the car: put "rig": "<id>" on them like carseat/steer, and place them at x 0, y 0, z 0 (they draw in car space).
// Keys that propState (props3d.js) does not know (dim agit hiss pour lamps) take effect from their first action: prime each with
// { dur 0 } at t 0 (the EP01 bench does the same); until then the default below holds. Known keys tween as usual (level, on, drop, burst).
//
//   cabinwater  the water inside the cabin: a surface that stays LEVEL IN THE WORLD under the rig's pitch and roll (it reads the rig's
//               world matrix), drawn in car space over x +-0.985, z -1.38..0.80 and cut by the seats, bodies and tub (depth test).
//               KEY level (propState's own, default 1.0 unless spec.level): the surface in car-frame y at the cabin's middle (0, level, -0.3):
//               the exported LEVELS table gives DESIGN's (0.44 at 4.5 s instead of 0.40: 8 cm over the measured floor); drawn up to 1.94.
//               KEY dim 0..1 (default 0): the three tones down to 55 %. KEY agit 0..1 (default 0): slosh amplitude up to 3x.
//               KEY hiss 0..1 (default 0; DESIGN: 1 from 4.5 s, 0 at 13.5 s): the 3 jets under the dash (x +0.30, 0, -0.30, source y 0.55 at
//               the tub's front wall z 0.735 (DESIGN's 0.85 is inside the bonnet), 25 degrees down, 0.35 m long, shortened to the surface) with
//               a foam patch r 0.18 where each lands, a dribble at the foot of each front door; a source the level covers (from level 0.55)
//               becomes a boiling foam patch r 0.25 with 6 bubbles a second. 3 cel tones (troughs #1d312b, body #2e4a40, lit facets #55766a)
//               at 0.85 from above; from below (the air pocket) a silver mirror #9fc9b0 at 0.6. Slosh 1.2 cm / 1.1 s / 1.0 m across, 2.0 cm /
//               1.7 s / 2.2 m along, ripple facets 0.25 m. spec.rings [{ x, z, rx, rz }] (car space, up to 8; default the 3 bodies at
//               (0.55, 0.20), (-0.55, 0.20), (0, -0.85) and the two front seat backs at z -0.27): foam line 1.5 cm #cfdcd6 at 0.8 and a dark
//               line #14241f 1 cm outside it; the same along the four tub walls. Size 1.97 x 2.18 m, at 0.0 / level / 0.0.
//   carglass    the panes (spec.panes, default ["drvF","drvR","pasF","pasR","wind","hatch"]: driver front/rear on +x, passenger on -x,
//               windscreen, hatch glass; the side shapes follow the seal curves of car-hatchback.js, 2 cm inside them): tint #9fb4b0 at
//               0.14, 1.5 mm ink edge, 2 reflection streaks (35 degrees, 4 cm and 1.5 cm, white 0.10), rain drops outside above the lake
//               (40 per side pane, 160 windscreen, 100 hatch; radius 2-5 mm; 1 in 5 runs down 0.15-0.4 m/s) and, seen from INSIDE only,
//               the lake outside: murky green #2f5a48 -> #1c3a30 0.5 m under the world line y 0 (0.88), foam line 1.5 cm wavering +-1.5 cm /
//               0.8 s, 12 bubbles of 4-10 mm per pane climbing 0.3 m/s. KEY drop (metres, default 0): slides pane spec.dropPane (default
//               "drvF") down. THE BURST at spec.t0 (default 13.5 s) on pane spec.burstPane (default "drvF") when KEY burst is 1 (propState's
//               own, spec.burst; the generator sets burst 1 at t0): frames 0-2 the pane crazes (9 radial cracks, a net of 1.5 cm cells, white
//               0.75, a frosty haze), speed lines frames 0-5 round spec.hit [z, y] (default: the lower rear corner, 6 cm in from both edges),
//               from frame 3 the pane is gone and 300 cubes fly into the cabin (260 of 1-2 cm, 40 clumps of 3-5 cm, cone +-35 degrees about
//               -x, 1.5-4.5 m/s, gravity in the world, 2-6 turns a second, #dff2ee at 0.8, one face white, one #2a3a36; each a ring of 3 cm
//               where it reaches the cabin water; none after t0 + 0.9 s) and 30 cubes of 1-2 cm stay as a rim along the bottom and rear edge.
//               THE POUR (KEY pour 0..1 multiplies the schedule, default 1; DESIGN: in over 6 frames from t0 + 3 frames, until spec.pourEnd 17.0,
//               out by 17.5): a thick sheet from the sill (0.60 m wide growing to 0.80, 0.30 m thick growing to 0.45 by 15 s) arcing 0.7 m
//               toward -x onto the cabin water, body #3f6b5a, highlight #8fb8a6, foam streaks 35 %, 2 px ink edges, a churning foot r 0.45 and
//               10 drops of 2-4 cm up to 0.3 m. It lies at z spec.pourZ (default 0.0). Once the level passes the sill + 0.15 the sheet is under
//               water: only the foot churns. KEY level: give carglass the SAME level key as cabinwater (cubes and the pour land on it).
//   dashglow    two dial faces of 9 cm (amber ring and needle #ffb347 on #14181b) in a binnacle on the dash at x 0.55, a hazard triangle 3 cm
//               #e0362c on the dash face at x 0, a window button with a 1 cm amber dot on the driver's door (x 0.97, y 0.82, z 0.18) and ONE
//               amber point light in the binnacle (colour scaled by on: the engine rescales intensity every frame). KEY on 0..1 (propState's
//               own, default 0) scales all of it. DASH_FRAMES / dashKeys() below are the flicker of 11.5 s.
//   headrest    the held headrest: pad 0.28 wide x 0.18 tall x 0.10 deep (3 cm corners), #2b2e33 (spec.color: the seat's colour), a seam
//               1 cm in from the edge, two steel prongs 0.12 long, 0.14 apart, 1.4 cm thick (white stripe, 2 notches 2 cm from the pad on one,
//               rounded tips). ORIGIN: the pad's centre; the prongs toward -y; the front face +z. Hold: grips.box, both palms on the short
//               sides (x +-0.14): SIZE headrest { w 0.28, h 0, d 0.10 } in storyboards/lib/grips.mjs (h 0 = the hold's height is the origin).
//   headbeams   (rides the rig) the headlamps' light: per lamp (x +-0.66, y 0.78, z 1.63 from car-hatchback.js) an additive cone 4.5 m long,
//               radius 0.08 -> 1.2 m (14 degrees), #f2e9a8 at 0.38 (1 - u)^2, an inner cone of half the angle adds 0.25, a lamp disc of 16 cm
//               #fff6c8 and a halo of 0.5 m at 0.5. Not fogged. KEY lamps 0..1 (default 1; DESIGN: 1.0 at 19 s, 0.8 at 24.0, dips to 0.2 at 25.0 and
//               25.4 for 3 frames, 0.15 at 26.5, 0 at 27; prime it): the cones fade out below about 0.3, the two dots stay to 0.
//   lakebubbles the underwater bubbles of DESIGN section 2 (the shark's `bubbles` takes no rate, size or rise): a clear ball, 2 px ring #dff5e8
//               at 0.8, fill #bfe8cf at 0.12, a white crescent; they rise in the WORLD at 0.25 + 7 x diameter m/s, wobble +-3 cm at 2.5 Hz, flatten
//               over 6 cm, vanish at y 0 and fade with the underwater fog f(d) = 1 - exp(-(d/5.4)^1.7) when the camera is under y 0. Place it at
//               0, 0, 0 (world). spec.mode:
//                 "stream" (default): spec.rates [[t, per second], ...] (default [[19,45],[22,45],[24,12],[26,0]]); 70 % 2-4 cm, 25 % 4-6, 5 %
//                   7-9, the column widens 0.15 m per metre; spec.car = the rig's spec object (id, pivot, keys: the generator passes the same
//                   object) and spec.at [x, y, z] in the car's frame (default the driver's window [0.99, 1.4, 0.2]) make the source ride the
//                   car: a bubble keeps the place where it was born (default: spec.at is a world point). spec.seams: another prop with
//                   mode "stream", spec.sizes [1, 2] (cm) and rates 8/s for the bonnet seam and the wheel arches.
//                 "mouth": a burst of 5-8 bubbles of 1-3 cm every 0.8 s from spec.from (default 0) to spec.to (default 1e9), 0.32-0.46 m/s, gone
//                   after 2.5 s, at spec.at or along spec.path [[t, x, y, z], ...] (world).
//                 "kick": 6 bubbles of 1-2 cm at each time of spec.kicks [t, ...], at spec.at or along spec.path.
//               spec.max (default 900) is the instance count. See-through (steam).
//   Sizes: cabinwater 1.97 x 2.18 m; carglass the car's glasshouse (2.0 x 3.2 x 1.2 m, 6 panes); dashglow 0.4 m; headrest 0.28 x 0.30 x 0.10 m;
//   headbeams 2.4 x 1.2 x 4.5 m; lakebubbles 900 billboards.

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sm = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const C = (hex) => new THREE.Color(hex);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o });
const basic = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, ...o }); m.userData.noOutline = true; return m; };
const steamy = (o, order = 5) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
const steamAll = (g) => { g.traverse((c) => { c.userData.steam = true; c.castShadow = false; c.receiveShadow = false; }); return g; };
const IDENT = new THREE.Matrix4().elements;
// the rig's world matrix (the prop sits in the rig at 0,0,0); an unrigged prop reads the identity
const carE = (P) => (P.root.parent ? P.root.parent.matrixWorld.elements : IDENT);
const D2R = Math.PI / 180;

// ---------------------------------------------------------------- numbers the generator shares
export const CABIN = { floor: 0.36, sill: HATCH.belt, roofInside: 1.96, glassX: 0.985, z0: -1.38, z1: 0.80, cushionAboveSeat: 0.425 };
// DESIGN 3.1 (time, level in car-frame y); 4.5 s is 0.44 here (8 cm over the measured floor 0.36; DESIGN: 0.40 over a floor it assumed at 0.32)
export const LEVELS = [[4.5, 0.44], [7.0, 0.52], [9.0, 0.72], [11.5, 0.82], [13.5, 0.90], [14.5, 1.05], [16.0, 1.25], [17.5, 1.60], [19.0, 2.06]];
export function levelAt(t, table = LEVELS) {
  if (t <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) if (t <= table[i][0]) { const [t0, a] = table[i - 1], [t1, b] = table[i]; return a + (b - a) * sm((t - t0) / (t1 - t0)); }
  return table[table.length - 1][1];
}
// DESIGN 3.3: the dashboard's death at 11.5 s, in frames (30 fps, frame 345 = 11.5 s). [frame, on] from that frame to the next entry.
export const DASH_FRAMES = [[0, 1.0], [360, 0], [363, 0.7], [367, 0], [371, 0.45], [373, 0], [378, 0.25], [379, 0]];
export const DASH_OFF_FRAME = 379;   // from here cabinwater `dim` is 1 (and the key light drops to 55 %)
export const dashOn = (frame) => { let on = 1; for (const [f, v] of DASH_FRAMES) if (frame >= f) on = v; return on; };
// the prop actions for the flicker: [[t, { on }], ...] (call prop(t, id, set, 0, "linear") on each)
export const dashKeys = (fps = 30) => DASH_FRAMES.map(([f, on]) => [f / fps, { on }]);

// ---------------------------------------------------------------- shared GLSL
const BAND = `float bandStep(float e, float x) { float w = fwidth(x) * 0.9 + 0.004; return smoothstep(e - w, e + w, x); }`;
const HASH = `
  float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec2 h22(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
  float vn2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
  vec4 over(vec4 d, vec3 c, float a) { float oa = a + d.a * (1.0 - a); vec3 oc = oa > 0.0001 ? (c * a + d.rgb * d.a * (1.0 - a)) / oa : vec3(0.0); return vec4(oc, oa); }`;

const shader = (o, order = 6) => {
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, ...o });
  m.userData.noOutline = true; m.userData.order = order; return m;
};

// ---------------------------------------------------------------- bubbles: one instanced mesh of camera-facing rings
function bubbleSwarm(parent, n, { order = 9, fog: fogOn = false } = {}) {
  const geo = new THREE.PlaneGeometry(1, 1), info = new Float32Array(n * 3);
  const attr = new THREE.InstancedBufferAttribute(info, 3); attr.setUsage(THREE.DynamicDrawUsage); geo.setAttribute("aInfo", attr);
  const m = shader({
    uniforms: { uFog: { value: fogOn ? 1 : 0 } },
    vertexShader: `attribute vec3 aInfo; varying vec2 vUv; varying float vA; varying float vD;
      void main() { vUv = uv; vA = aInfo.y; vec4 c = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); vD = -c.z; vec2 q = (uv - 0.5) * 2.0; q.y *= aInfo.z; c.xy += q * aInfo.x; gl_Position = projectionMatrix * c; }`,
    fragmentShader: `uniform float uFog; varying vec2 vUv; varying float vA; varying float vD; ${HASH}
      void main() {
        vec2 q = (vUv - 0.5) * 2.0; float r = length(q); if (r > 1.0 || vA < 0.003) discard;
        float px = max(fwidth(r), 0.002);
        float ring = smoothstep(1.0 - 3.0 * px, 1.0 - 2.0 * px, r) * (1.0 - smoothstep(1.0 - px, 1.0, r));
        float hl = (1.0 - smoothstep(0.26, 0.31, length(q - vec2(-0.36, 0.36)))) * smoothstep(0.26, 0.31, length(q - vec2(-0.26, 0.27)));
        vec4 c = vec4(0.749, 0.91, 0.812, 0.12);
        c = over(c, vec3(0.875, 0.961, 0.91), ring * 0.8);
        c = over(c, vec3(1.0), hl * 0.9);
        float a = c.a * vA;
        if (uFog > 0.5 && cameraPosition.y < 0.0) a *= exp(-pow(vD / 5.4, 1.7));
        if (a < 0.003) discard;
        gl_FragColor = vec4(c.rgb, a);
      }`,
  }, order);
  const mesh = new THREE.InstancedMesh(geo, m, n);
  const arr = mesh.instanceMatrix.array;
  for (let i = 0; i < n; i++) arr[i * 16] = arr[i * 16 + 5] = arr[i * 16 + 10] = arr[i * 16 + 15] = 1;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  steamy(mesh, order); parent.add(mesh);
  return {
    mesh, n,
    set(i, x, y, z, r, a = 1, flat = 1) { arr[i * 16 + 12] = x; arr[i * 16 + 13] = y; arr[i * 16 + 14] = z; info[i * 3] = r; info[i * 3 + 1] = a; info[i * 3 + 2] = flat; },
    clear(i) { info[i * 3] = 0; info[i * 3 + 1] = 0; },
    done() { mesh.instanceMatrix.needsUpdate = true; attr.needsUpdate = true; },
  };
}

// a ragged foam disc lying in the xz plane, centre at the origin of its mesh (scale = radius)
function foamPatch(parent, seed, order = 7) {
  const geo = new THREE.CircleGeometry(1, 32); geo.rotateX(-Math.PI / 2);
  const m = shader({
    uniforms: { uT: { value: 0 }, uSeed: { value: seed }, uA: { value: 1 }, uLit: { value: C("#e6f0ec") }, uMid: { value: C("#cfdcd6") }, uDark: { value: C("#9fc4b4") } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uT, uSeed, uA; uniform vec3 uLit, uMid, uDark; varying vec2 vUv; ${HASH} ${BAND}
      void main() {
        vec2 q = (vUv - 0.5) * 2.0; float r = length(q), a = atan(q.y, q.x);
        float edge = 0.84 + 0.09 * sin(a * 7.0 + uT * 5.0 + uSeed * 6.0) + 0.06 * sin(a * 13.0 - uT * 7.0 + uSeed * 3.0);
        if (r > edge) discard;
        float v = vn2(q * 4.5 + vec2(uT * 2.1, -uT * 1.7) + uSeed * 9.0) * 0.7 + vn2(q * 9.0 - uT * 3.0) * 0.3;
        vec3 col = mix(uDark, uMid, bandStep(0.32, v)); col = mix(col, uLit, bandStep(0.58, v));
        gl_FragColor = vec4(col, (1.0 - smoothstep(edge - 0.08, edge, r)) * 0.95 * uA);
      }`,
  }, order);
  const o = steamy(new THREE.Mesh(geo, m), order); parent.add(o);
  return { o, m };
}

// ---------------------------------------------------------------- cabinwater
const WATER_VS = `uniform vec3 uPl; uniform float uT, uAmp; varying vec3 vP; ${HASH}
  void main() {
    vec3 p = position; vec2 s = p.xz;
    float h = 0.012 * sin(6.2832 * (s.x / 1.0 - uT / 1.1)) + 0.020 * sin(6.2832 * (s.y / 2.2 - uT / 1.7)) + 0.007 * (vn2(s / 0.25 + vec2(uT * 0.9, -uT * 0.7)) - 0.5);
    p.y = uPl.x + uPl.y * p.x + uPl.z * p.z + uAmp * h;
    vP = p; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
const WATER_FS = `uniform vec3 uUp, uLd, uTr, uBo, uLi, uSil, uFoam, uInk; uniform float uDim, uT, uNR; uniform vec4 uRing[8]; varying vec3 vP; ${BAND} ${HASH}
  // the tub walls as the surface meets them (measured in car-hatchback.js): x at height y, z front and rear
  float wallX(float y) { return min(0.985, 0.927 + 0.255 * max(y - 0.45, 0.0)); }
  float wallZf(float y) { return 0.69 + 0.11 * pow(clamp((y - 0.36) / 0.54, 0.0, 1.0), 0.8); }
  float wallZr(float y) { return -1.30 - 0.075 * clamp((y - 0.36) / 0.37, 0.0, 1.0); }
  void main() {
    vec3 n = normalize(cross(dFdx(vP), dFdy(vP))); if (dot(n, uUp) < 0.0) n = -n;
    float s = (dot(n, uLd) - dot(uUp, uLd)) * 9.0;
    vec3 col = mix(uTr, uBo, bandStep(-0.3, s)); col = mix(col, uLi, bandStep(0.3, s));
    col *= mix(1.0, 0.55, uDim);
    float a = 0.85;
    if (!gl_FrontFacing) { gl_FragColor = vec4(uSil, 0.6); return; }
    vec4 d = vec4(col, a);
    // foam where the surface meets things: lines 1.5 cm wide (dark 1 cm outside), wavering +-1 cm every 0.9 s
    float wob = 0.01 * sin(6.2832 * uT / 0.9);
    float f = 9.0, df = 9.0;
    for (int i = 0; i < 8; i++) {
      if (float(i) >= uNR) break;
      vec2 q = (vP.xz - uRing[i].xy) / uRing[i].zw; float e = length(q);
      float dist = (e - 1.0) * min(uRing[i].z, uRing[i].w) - 0.004 * sin(atan(q.y, q.x) * 5.0 + uT * 7.0) - wob * 0.5;
      df = min(df, dist);
    }
    df = min(df, wallX(vP.y) - abs(vP.x) - wob * 0.5);
    df = min(df, wallZf(vP.y) - vP.z - wob * 0.5);
    df = min(df, vP.z - wallZr(vP.y) - wob * 0.5);
    float foam = (1.0 - smoothstep(0.015 - 0.002, 0.015, df)) * smoothstep(-0.004, 0.0, df);
    float dark = (1.0 - smoothstep(0.025 - 0.002, 0.025, df)) * smoothstep(0.015 - 0.002, 0.015, df);
    d = over(d, uInk, dark * 0.85);
    d = over(d, uFoam, foam * 0.8);
    gl_FragColor = d;
  }`;
// a prism 1 m long (+z), width w0 -> w1 (x), thickness th (y): the jets
function prism(w0, w1, th) {
  const P = [[-w0 / 2, th / 2, 0], [w0 / 2, th / 2, 0], [w1 / 2, th / 2, 1], [-w1 / 2, th / 2, 1], [-w0 / 2, -th / 2, 0], [w0 / 2, -th / 2, 0], [w1 / 2, -th / 2, 1], [-w1 / 2, -th / 2, 1]];
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P.flat(), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(P.flatMap(([x, , z], i) => [0.5 + (x / (z ? w1 : w0)), z]), 2));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 0, 3, 7, 0, 7, 4, 1, 2, 6, 1, 6, 5, 0, 1, 5, 0, 5, 4, 3, 2, 6, 3, 6, 7]);
  return g;
}
const JET_FS = `uniform float uT, uA; uniform vec3 uCore, uEdge; varying vec2 vUv;
  void main() {
    float across = abs(vUv.x - 0.5) * 2.0;
    vec3 c = mix(uCore, uEdge, smoothstep(0.3, 0.95, across));
    float st = 0.5 + 0.5 * sin(6.2832 * ((vUv.y * 0.35 - uT * 3.0) / 0.1 + vUv.x * 2.0));
    c = mix(c, uCore, st * 0.4 * (1.0 - across));
    gl_FragColor = vec4(c, 0.9 * uA);
  }`;
const PLAIN_VS = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const CAR_KEY = new THREE.Vector3(-0.30, 0.87, 0.40).normalize();   // DESIGN 1.3 key, toward the light (world)

// ---------------------------------------------------------------- carglass: pane shapes from the rig's own seal curves
const BT = HATCH.belt, RF = HATCH.roof, XW = HATCH.W * 0.9, [CB0, CB1] = HATCH.cabin;
const A_BASE = CB1 - 0.02, A_TOP = 0.38, C_BASE = CB0 + 0.02;
function sealLoop(front) {
  const pts = front
    ? [[A_BASE - 0.06, BT + 0.02], [A_TOP - 0.04, RF - 0.08], [-0.3, RF - 0.09], [-0.3, BT + 0.02]]
    : [[-0.42, BT + 0.02], [-0.42, RF - 0.09], [C_BASE + 0.3, RF - 0.09], [C_BASE + 0.3, BT + 0.02]];   // [z, y], the seal tubes of car-hatchback.js
  const curve = new THREE.CatmullRomCurve3(pts.map(([z, y]) => new THREE.Vector3(0, y, z)), true, "catmullrom", 0.1);
  const loop = curve.getPoints(64).slice(0, -1).map((v) => [v.z, v.y]);
  const cz = loop.reduce((s, p) => s + p[0], 0) / loop.length, cy = loop.reduce((s, p) => s + p[1], 0) / loop.length;
  return loop.map(([z, y]) => { const dz = z - cz, dy = y - cy, d = Math.hypot(dz, dy), k = (d - 0.022) / d; return [cz + dz * k, cy + dy * k]; });   // 2 cm inside the seal
}
// a pane: basis O (origin), U across, V up, N out (U x V = N); poly in (u, v)
function paneDef(id) {
  const side = (sx, front) => {
    const U = new THREE.Vector3(0, 0, -sx), V = new THREE.Vector3(0, 1, 0), O = new THREE.Vector3(sx * CABIN.glassX, 0, 0);
    const poly = sealLoop(front).map(([z, y]) => [-sx * z, y]);
    return { id, O, U, V, N: new THREE.Vector3(sx, 0, 0), poly, side: true, sx, front };
  };
  if (id === "drvF") return side(1, true);
  if (id === "drvR") return side(1, false);
  if (id === "pasF") return side(-1, true);
  if (id === "pasR") return side(-1, false);
  if (id === "wind") {
    const a = Math.atan2(A_BASE - A_TOP, RF - BT), L = Math.hypot(RF - BT, A_BASE - A_TOP) - 0.05, W = XW * 2 - 0.04;
    const U = new THREE.Vector3(1, 0, 0), V = new THREE.Vector3(0, Math.cos(a), -Math.sin(a)), N = new THREE.Vector3(0, Math.sin(a), Math.cos(a));
    const O = new THREE.Vector3(0, (BT + RF) / 2, (A_BASE + A_TOP) / 2 + 0.03).addScaledVector(N, -0.006);
    const hw = W / 2 - 0.03, hl = L / 2 - 0.03;
    return { id, O, U, V, N, poly: [[-hw, -hl], [hw, -hl], [hw, hl], [-hw, hl]], side: false };
  }
  const U = new THREE.Vector3(-1, 0, 0), V = new THREE.Vector3(0, 1, 0), N = new THREE.Vector3(0, 0, -1);
  const O = new THREE.Vector3(0, (BT + RF) / 2, C_BASE - 0.01 + 0.006);
  const hw = (XW * 2 - 0.1) / 2 - 0.03, hl = (RF - BT - 0.12) / 2 - 0.03;
  return { id: "hatch", O, U, V, N, poly: [[-hw, -hl], [hw, -hl], [hw, hl], [-hw, hl]], side: false };
}
const toCar = (d, u, v, off = 0) => d.O.clone().addScaledVector(d.U, u).addScaledVector(d.V, v).addScaledVector(d.N, off);
const inPoly = (poly, u, v) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > v) !== (yj > v) && u < ((xj - xi) * (v - yi)) / (yj - yi) + xi) c = !c; } return c; };
// the pane's v range at u (vertical line through the polygon)
function colRange(poly, u) {
  let lo = 1e9, hi = -1e9;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [x0, y0] = poly[j], [x1, y1] = poly[i];
    if ((x0 > u) !== (x1 > u)) { const v = y0 + ((y1 - y0) * (u - x0)) / (x1 - x0); lo = Math.min(lo, v); hi = Math.max(hi, v); }
  }
  return [lo, hi];
}
// the pane's u range at v (horizontal line through the polygon)
function rowRange(poly, v) {
  let lo = 1e9, hi = -1e9;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [x0, y0] = poly[j], [x1, y1] = poly[i];
    if ((y0 > v) !== (y1 > v)) { const u = x0 + ((x1 - x0) * (v - y0)) / (y1 - y0); lo = Math.min(lo, u); hi = Math.max(hi, u); }
  }
  return [lo, hi];
}
function paneGeometry(d) {
  const shp = new THREE.Shape(d.poly.map(([u, v]) => new THREE.Vector2(u, v)));
  const sg = new THREE.ShapeGeometry(shp), p = sg.attributes.position, pos = [], loc = [];
  for (let i = 0; i < p.count; i++) { const u = p.getX(i), v = p.getY(i), q = toCar(d, u, v); pos.push(q.x, q.y, q.z); loc.push(u, v); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("aLoc", new THREE.Float32BufferAttribute(loc, 2));
  g.setIndex(sg.index ? Array.from(sg.index.array) : Array.from({ length: p.count }, (_, i) => i));
  return g;
}
function ribbon(d, w = 0.003) {
  const pos = [], idx = [], n = d.poly.length;
  for (let i = 0; i < n; i++) {
    const a = d.poly[i], b = d.poly[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = (-dy / L) * w, ny = (dx / L) * w;
    const q = [toCar(d, a[0] - nx, a[1] - ny, 0.002), toCar(d, a[0] + nx, a[1] + ny, 0.002), toCar(d, b[0] + nx, b[1] + ny, 0.002), toCar(d, b[0] - nx, b[1] - ny, 0.002)];
    const k = pos.length / 3; for (const v of q) pos.push(v.x, v.y, v.z); idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
}
const PANE_VS = `attribute vec2 aLoc; varying vec2 vLoc; varying vec3 vW; void main() { vLoc = aLoc; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const PANE_FS = `uniform float uT, uCraze, uSeed; uniform vec2 uHit, uC; uniform vec3 uTint, uLake1, uLake2, uFoam;
  varying vec2 vLoc; varying vec3 vW; ${HASH}
  float net(vec2 p, float w) {
    vec2 g = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 o = vec2(float(i), float(j)); vec2 r = o + h22(g + o) * 0.8 + 0.1 - f; float d = dot(r, r); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
    return 1.0 - smoothstep(0.0, w, sqrt(d2) - sqrt(d1));
  }
  void main() {
    bool inside = !gl_FrontFacing;
    vec4 d = vec4(uTint, 0.14);
    // two reflection streaks fixed to the pane, 35 degrees from vertical
    vec2 q = vLoc - uC; float c35 = 0.8192, s35 = 0.5736;
    float x = q.x * c35 - q.y * s35;
    float st = max(1.0 - smoothstep(0.018, 0.02, abs(x - (0.12 + 0.1 * uSeed))), 1.0 - smoothstep(0.006, 0.0075, abs(x + (0.2 + 0.1 * uSeed))));
    d = over(d, vec3(1.0), st * 0.10);
    float wl = 0.015 * sin(6.2832 * uT / 0.8 + vW.x * 6.0 + vW.z * 5.0);
    if (inside) {
      float h = vW.y - wl;
      if (h < 0.0) d = over(d, mix(uLake1, uLake2, clamp(-h / 0.5, 0.0, 1.0)), 0.88);
      d = over(d, uFoam, (1.0 - smoothstep(0.0075 - 0.002, 0.0075, abs(h))) * 0.95);
    }
    if (uCraze > 0.5) {
      vec2 v = vLoc - uHit; float r = length(v), ang = atan(v.y, v.x), cr = 0.0;
      for (int i = 0; i < 9; i++) {
        float fi = float(i), a0 = (fi + 0.5 * h21(vec2(fi, 3.0))) / 9.0 * 6.2832 - 3.1416, len = 0.55 + 0.7 * h21(vec2(fi, 7.0));
        float da = abs(mod(ang - a0 + 3.1416, 6.2832) - 3.1416 + 0.05 * sin(r * 38.0 + fi * 2.0));
        float w = 0.011 * (1.0 - r / len) + 0.0035;
        cr = max(cr, (1.0 - smoothstep(w * 0.4, w, r * sin(min(da, 1.5)))) * step(r, len) * step(da, 1.5));
      }
      float nt = net(vLoc / 0.015, 0.22) * (1.0 - smoothstep(0.5, 1.1, r));
      d = over(d, vec3(0.933, 0.965, 0.957), 0.28);
      d = over(d, vec3(0.933, 0.965, 0.957), 0.75 * max(cr, nt));
    }
    gl_FragColor = d;
  }`;
const DROP_VS = `attribute vec2 aDrop; varying vec2 vUv; varying vec2 vR; varying float vWY;
  void main() { vUv = uv; vR = aDrop; vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0); vWY = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).y; gl_Position = projectionMatrix * viewMatrix * w; }`;
const DROP_FS = `varying vec2 vUv; varying vec2 vR; varying float vWY; uniform float uWater;
  void main() {
    if (vWY < uWater) discard;
    float r0 = vR.x, tail = vR.y;
    float lx = (vUv.x - 0.5) * 3.0 * r0, ly = vUv.y * (3.0 * r0 + tail) - 1.5 * r0;
    float d = length(vec2(lx, ly)) / r0, px = max(fwidth(d), 0.01);
    float ring = smoothstep(0.62, 0.62 + px * 1.5, d) * (1.0 - smoothstep(1.0 - px, 1.0, d));
    float low = step(ly, -0.35 * r0) * smoothstep(0.5, 0.9, d);
    vec3 col = mix(vec3(0.875, 0.91, 0.918), vec3(0.16, 0.2, 0.2), low);
    float a = ring * 0.55 + (1.0 - smoothstep(0.0, 0.62, d)) * 0.12;
    float tl = step(r0 * 0.7, ly) * (1.0 - smoothstep(0.0, 0.3 * r0, abs(lx))) * 0.3 * (1.0 - smoothstep(r0, r0 + tail, ly));
    a = max(a, tl);
    if (a < 0.01) discard;
    gl_FragColor = vec4(col, a);
  }`;

// ---------------------------------------------------------------- the registry
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _ax = new THREE.Vector3();
const Z = new THREE.Vector3(0, 0, 1);

export const SINKCAR_KINDS = {
  // ------------------------------------------------------------------ the water inside the cabin
  cabinwater(P) {
    const S = P.spec, NX = 28, NZ = 32, X = CABIN.glassX, Z0 = CABIN.z0, Z1 = CABIN.z1;
    const pos = [], idx = [];
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) pos.push(-X + (2 * X * i) / NX, 0, Z0 + ((Z1 - Z0) * j) / NZ);
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + NX + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
    const rings = S.rings || [{ x: 0.55, z: 0.2, rx: 0.27, rz: 0.25 }, { x: -0.55, z: 0.2, rx: 0.27, rz: 0.25 }, { x: 0, z: -0.85, rx: 0.22, rz: 0.2 }, { x: 0.55, z: -0.27, rx: 0.43, rz: 0.1 }, { x: -0.55, z: -0.27, rx: 0.43, rz: 0.1 }];
    const U = {
      uPl: { value: new THREE.Vector3() }, uUp: { value: new THREE.Vector3(0, 1, 0) }, uLd: { value: CAR_KEY.clone() }, uT: { value: 0 }, uAmp: { value: 1 }, uDim: { value: 0 }, uNR: { value: Math.min(8, rings.length) },
      uRing: { value: Array.from({ length: 8 }, (_, i) => { const r = rings[i]; return r ? new THREE.Vector4(r.x, r.z, r.rx, r.rz) : new THREE.Vector4(0, 0, 1, 1); }) },
      uTr: { value: C("#1d312b") }, uBo: { value: C("#2e4a40") }, uLi: { value: C("#55766a") }, uSil: { value: C("#9fc9b0") }, uFoam: { value: C("#cfdcd6") }, uInk: { value: C("#14241f") },
    };
    const water = steamy(new THREE.Mesh(geo, shader({ uniforms: U, vertexShader: WATER_VS, fragmentShader: WATER_FS, side: THREE.DoubleSide }, 6)), 6); P.whole.add(water);
    // the jets under the dash: three flat fans and a dribble at the foot of each front door
    const jetM = () => shader({ uniforms: { uT: { value: 0 }, uA: { value: 1 }, uCore: { value: C("#dfeee6") }, uEdge: { value: C("#9fc4b4") } }, vertexShader: PLAIN_VS, fragmentShader: JET_FS, side: THREE.DoubleSide }, 7);
    const DOWN = 25 * D2R, ZS = 0.735;
    const src = [[0.30, 0.55, ZS], [0, 0.55, ZS], [-0.30, 0.55, ZS]].map(([x, y, z], i) => {
      const fan = steamy(new THREE.Mesh(prism(0.06, 0.12, 0.02), jetM()), 7); fan.quaternion.setFromUnitVectors(Z, new THREE.Vector3(0, -Math.sin(DOWN), -Math.cos(DOWN))); fan.position.set(x, y, z); P.whole.add(fan);
      return { x, y, z, fan, foam: foamPatch(P.whole, 0.13 + i * 0.31), dir: [0, -Math.sin(DOWN), -Math.cos(DOWN)], len: 0.35, ph: i / 3 };
    });
    const dribs = [1, -1].map((sx, i) => {
      const dir = new THREE.Vector3(-sx * Math.cos(40 * D2R), -Math.sin(40 * D2R), 0), fan = steamy(new THREE.Mesh(prism(0.2, 0.2, 0.01), jetM()), 7);
      fan.quaternion.setFromUnitVectors(Z, dir); P.whole.add(fan);
      return { sx, x: sx * 0.9, y: 0.5, z: 0.15, fan, foam: foamPatch(P.whole, 0.6 + i * 0.2), dir: dir.toArray(), len: 0.15 };
    });
    const bub = bubbleSwarm(P.whole, 36, { order: 9 });
    const surf = (a, b, c, x, z) => a + b * x + c * z;
    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, e = carE(P), L = Math.min(ps.level, 1.94), e5 = e[5] || 1;
        const a = L - (0.3 * e[9]) / e5, b = -e[1] / e5, c = -e[9] / e5;
        U.uPl.value.set(a, b, c); U.uUp.value.set(e[1], e[5], e[9]);
        U.uLd.value.set(e[0] * CAR_KEY.x + e[1] * CAR_KEY.y + e[2] * CAR_KEY.z, e[4] * CAR_KEY.x + e[5] * CAR_KEY.y + e[6] * CAR_KEY.z, e[8] * CAR_KEY.x + e[9] * CAR_KEY.y + e[10] * CAR_KEY.z);
        U.uT.value = tt; U.uAmp.value = 1 + 2 * clamp(ps.agit ?? 0); U.uDim.value = clamp(ps.dim ?? 0);
        water.visible = ps.level > 0.2;
        const hiss = clamp(ps.hiss ?? 0);
        let nb = 0; bub.mesh.visible = false;
        for (const s of src) {
          const A = surf(a, b, c, s.x, s.z), sunk = A >= s.y - 0.005;
          s.fan.visible = hiss > 0.01 && !sunk && water.visible; s.foam.o.visible = hiss > 0.01 && water.visible;
          s.fan.material.uniforms.uT.value = tt; s.foam.m.uniforms.uT.value = tt;
          if (!s.fan.visible && !s.foam.o.visible) continue;
          if (sunk) {
            // submerged: a boiling patch r 0.25 over the source, 6 bubbles a second rising 0.4 m/s
            const ys = surf(a, b, c, s.x, s.z - 0.08);
            s.foam.o.position.set(s.x, ys + 0.01, s.z - 0.08); s.foam.o.scale.set(0.25, 1, 0.25); s.foam.o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-b, 1, -c).normalize());
            const life = Math.max(0.05, (ys - s.y) / 0.4);
            for (let m = 0; m < 12; m++) {
              const k = Math.floor(tt * 6 - s.ph) - m, age = tt - (k + s.ph) / 6, idx = nb++;
              if (age < 0 || age >= life || nb > 36) { bub.clear(idx); continue; }
              bub.set(idx, s.x + (rnd(k + src.indexOf(s) * 50) - 0.5) * 0.14, s.y + age * 0.4, s.z - 0.08 + (rnd(k + 9) - 0.5) * 0.1, 0.01 + 0.005 * rnd(k + 3), 1, 1);
            }
            bub.mesh.visible = true;
            continue;
          }
          // the fan: pointing back and 25 degrees down, shortened where the surface cuts it
          const hitS = (s.y - surf(a, b, c, s.x, s.z)) / (Math.sin(DOWN) - c * Math.cos(DOWN));
          const Lf = clamp(hitS > 0.02 ? hitS : 0.35, 0.05, 0.35);
          s.fan.scale.set(1, 1, Lf);
          const lx = s.x, lz = s.z - Lf * Math.cos(DOWN);
          s.foam.o.position.set(lx, surf(a, b, c, lx, lz) + 0.01, lz); s.foam.o.scale.set(0.18, 1, 0.18);
          s.foam.o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-b, 1, -c).normalize());
        }
        for (const dr of dribs) {
          const on = hiss > 0.01 && water.visible, ys = surf(a, b, c, dr.x - dr.sx * 0.1, dr.z);
          dr.fan.visible = dr.foam.o.visible = on && ys < dr.y - 0.01;
          if (!dr.fan.visible) continue;
          const Lf = clamp((dr.y - ys) / Math.sin(40 * D2R), 0.03, 0.15);
          dr.fan.position.set(dr.x, dr.y, dr.z); dr.fan.scale.set(1, 1, Lf); dr.fan.material.uniforms.uT.value = tt; dr.foam.m.uniforms.uT.value = tt;
          const lx = dr.x - dr.sx * Lf * Math.cos(40 * D2R);
          dr.foam.o.position.set(lx, surf(a, b, c, lx, dr.z) + 0.01, dr.z); dr.foam.o.scale.set(0.1, 1, 0.1);
          dr.foam.o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-b, 1, -c).normalize());
        }
        for (let i = nb; i < 36; i++) bub.clear(i);
        bub.done();
      },
    };
  },

  // ------------------------------------------------------------------ the glass, the lake outside, the burst, the pour
  carglass(P) {
    const S = P.spec, ids = S.panes || ["drvF", "drvR", "pasF", "pasR", "wind", "hatch"], T0 = S.t0 ?? 13.5, BP = S.burstPane || "drvF", DP = S.dropPane || "drvF", POUR_END = S.pourEnd ?? 17.0, PZ = S.pourZ ?? 0.0;
    const F3 = 1 / 30;
    const panes = ids.map((id, pi) => {
      const d = paneDef(id), g = new THREE.Group(); P.whole.add(g);
      const poly = d.poly, us = poly.map((p) => p[0]), vs = poly.map((p) => p[1]);
      const uC = (Math.min(...us) + Math.max(...us)) / 2, vC = (Math.min(...vs) + Math.max(...vs)) / 2;
      let hit = null;
      if (d.id === BP && d.side) {
        if (S.hit) hit = [-d.sx * S.hit[0], S.hit[1]];
        else {
          // the lower rear corner, 6 cm in from both edges (the rear edge is the smallest z)
          const zs = poly.map((q) => -d.sx * q[0]), zmin = Math.min(...zs), near = poly.filter((q) => -d.sx * q[0] < zmin + 0.15);
          hit = [-d.sx * (zmin + 0.06), Math.min(...near.map((q) => q[1])) + 0.06];
        }
      }
      const mat = shader({
        uniforms: { uT: { value: 0 }, uCraze: { value: 0 }, uSeed: { value: rnd(pi + 5) }, uHit: { value: new THREE.Vector2(...(hit || [0, 0])) }, uC: { value: new THREE.Vector2(uC, vC) }, uTint: { value: C("#9fb4b0") }, uLake1: { value: C("#2f5a48") }, uLake2: { value: C("#1c3a30") }, uFoam: { value: C("#dfe8e4") } },
        vertexShader: PANE_VS, fragmentShader: PANE_FS, side: THREE.DoubleSide,
      }, 8);
      const mesh = steamy(new THREE.Mesh(paneGeometry(d), mat), 8); g.add(mesh);
      const edge = steamy(new THREE.Mesh(ribbon(d), basic("#1c2422", { side: THREE.DoubleSide })), 8); g.add(edge);
      return { d, g, mesh, edge, mat, hit, uC, vC };
    });
    const byId = Object.fromEntries(panes.map((p) => [p.d.id, p]));
    // rain drops on the outside: ONE instanced mesh; static, or running down (1 in 5)
    const nDrops = (p) => (p.d.id === "wind" ? 160 : p.d.id === "hatch" ? 100 : 40);
    const drops = []; let di = 0;
    for (const p of panes) {
      for (let k = 0; k < nDrops(p); k++) {
        let u, v, tries = 0; const us = p.d.poly.map((q) => q[0]), vs = p.d.poly.map((q) => q[1]);
        do { u = Math.min(...us) + rnd(di * 7 + tries * 3 + 1) * (Math.max(...us) - Math.min(...us)); v = Math.min(...vs) + rnd(di * 7 + tries * 3 + 2) * (Math.max(...vs) - Math.min(...vs)); tries++; } while (!inPoly(p.d.poly, u, v) && tries < 40);
        const run = k % 5 === 0, [lo, hi] = colRange(p.d.poly, u);
        drops.push({ p, u, v, r: 0.002 + 0.003 * rnd(di * 11 + 4), run, sp: 0.15 + 0.25 * rnd(di * 11 + 5), ph: rnd(di * 11 + 6), tail: run ? 0.03 + 0.03 * rnd(di * 11 + 7) : 0, lo, hi });
        di++;
      }
    }
    const dGeo = new THREE.PlaneGeometry(1, 1), dInfo = new Float32Array(drops.length * 2);
    drops.forEach((d, i) => { dInfo[i * 2] = d.r; dInfo[i * 2 + 1] = d.tail; });
    dGeo.setAttribute("aDrop", new THREE.InstancedBufferAttribute(dInfo, 2));
    const dMat = shader({ uniforms: { uWater: { value: 0 } }, vertexShader: DROP_VS, fragmentShader: DROP_FS, side: THREE.DoubleSide }, 8);
    const dMesh = new THREE.InstancedMesh(dGeo, dMat, drops.length); dMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); steamy(dMesh, 8); P.whole.add(dMesh);
    const placeDrop = (i, d, t, gone) => {
      let v = d.v;
      if (d.run) { const H = Math.max(0.05, d.hi - d.lo); v = d.hi - (((t * d.sp + d.ph * H) % H) + H) % H; }
      const q = toCar(d.p.d, d.u, v, 0.006 + 0.001 * (i % 3));
      // the quad stands in the pane: its x -> pane U, y -> V; its bottom at the drop's lower edge
      _m.makeBasis(d.p.d.U, d.p.d.V, d.p.d.N); _q.setFromRotationMatrix(_m);
      const w = 3 * d.r, h = 3 * d.r + d.tail; _s.set(w, h, 1);
      _p.copy(q).addScaledVector(d.p.d.V, -1.5 * d.r + h / 2);
      if (d.p === B && gone) _s.set(0, 0, 0);
      _m.compose(_p, _q, _s); dMesh.setMatrixAt(i, _m);
      // vertex shader reads the centre of the DROP: shift so instance origin is the quad middle; the tail's frame is y from the bottom
    };
    // bubbles climbing the glass (12 of 4-10 mm per pane)
    const bubs = bubbleSwarm(P.whole, panes.length * 12, { order: 9 });
    // burst: the cubes, the rim, the speed lines
    const NC = 300, NR = 30, B = byId[BP];
    const cubeG = new THREE.BoxGeometry(1, 1, 1), cc = [], base = new THREE.Color("#dff2ee"), wht = new THREE.Color("#ffffff"), drk = new THREE.Color("#2a3a36");
    // box face order: +x, -x, +y, -y, +z, -z (4 vertices each)
    for (let f = 0; f < 6; f++) { const c = f === 0 ? wht : f === 1 ? drk : base; for (let k = 0; k < 4; k++) cc.push(c.r, c.g, c.b); }
    cubeG.setAttribute("color", new THREE.Float32BufferAttribute(cc, 3));
    const cubeM = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false }); cubeM.userData.noOutline = true;
    const cubes = new THREE.InstancedMesh(cubeG, cubeM, NC + NR); cubes.instanceMatrix.setUsage(THREE.DynamicDrawUsage); steamy(cubes, 9); P.whole.add(cubes);
    const CB = [];
    if (B) {
      const poly = B.d.poly, us = poly.map((q) => q[0]), vs = poly.map((q) => q[1]);
      for (let i = 0; i < NC; i++) {
        let u, v, tries = 0;
        do { u = Math.min(...us) + rnd(i * 5 + tries * 3 + 91) * (Math.max(...us) - Math.min(...us)); v = Math.min(...vs) + rnd(i * 5 + tries * 3 + 92) * (Math.max(...vs) - Math.min(...vs)); tries++; } while (!inPoly(poly, u, v) && tries < 40);
        const th = 35 * D2R * Math.sqrt(rnd(i * 13 + 1)), ph = 6.2832 * rnd(i * 13 + 2), sp = i < 260 ? 1.5 + 3.0 * rnd(i * 13 + 3) : 1.5 + 1.7 * rnd(i * 13 + 3);
        const into = -B.d.sx;   // into the cabin
        const dir = new THREE.Vector3(into * Math.cos(th), Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph));
        CB.push({ p0: toCar(B.d, u, v, -0.004), v: dir.multiplyScalar(sp), size: i < 260 ? 0.01 + 0.01 * rnd(i * 13 + 4) : 0.03 + 0.02 * rnd(i * 13 + 4), ax: new THREE.Vector3(rnd(i * 13 + 5) - 0.5, rnd(i * 13 + 6) - 0.5, rnd(i * 13 + 7) - 0.5).normalize(), w: 6.2832 * (2 + 4 * rnd(i * 13 + 8)), ph: 6.2832 * rnd(i * 13 + 9), birth: 0.1 * rnd(i * 13 + 10), life: 0.3 + 0.4 * rnd(i * 13 + 11) });
      }
      // the rim: 30 cubes along the bottom edge and the rear edge (the smallest z) of the pane, 1-2 cm, jagged
      const sx = B.d.sx, rear = (v) => { const [lo, hi] = rowRange(poly, v); return sx > 0 ? hi : lo; }, zmin = Math.min(...poly.map((q) => -sx * q[0])), pts = [], half = NR / 2;
      for (let i = 0; i < NR; i++) {
        let u, v;
        if (i < half) { const f = (i + 0.5) / half; u = -sx * (zmin + 0.03 + f * 0.9); v = colRange(poly, u)[0] + 0.006 + 0.012 * rnd(i + 210); }
        else { const f = (i - half + 0.5) / half; v = colRange(poly, -sx * (zmin + 0.04))[0] + 0.03 + f * 0.9; u = rear(v) - sx * (-0.004 + 0.012 * rnd(i + 220)); }
        pts.push(toCar(B.d, u, v, -0.004));
      }
      CB.rim = pts.map((q, i) => ({ q, size: 0.01 + 0.01 * rnd(i + 230), ax: new THREE.Vector3(rnd(i + 240) - 0.5, rnd(i + 241) - 0.5, rnd(i + 242) - 0.5).normalize(), ang: 6.2832 * rnd(i + 250) }));
    }
    const rings = bubbleSwarm(P.whole, NC, { order: 9 });
    // speed lines: 8 strokes round the hit point, in the pane plane
    let lines = null;
    if (B && B.hit) {
      const pos = [], idx = [];
      for (let i = 0; i < 8; i++) {
        const a = ((i + 0.3 * rnd(i + 300)) / 8) * 6.2832, r0 = 0.05 + 0.07 * rnd(i + 310), len = 0.10 + 0.15 * rnd(i + 320), w = 0.0035, dx = Math.cos(a), dy = Math.sin(a);
        const q = [[r0, -w], [r0, w], [r0 + len, w * 0.4], [r0 + len, -w * 0.4]].map(([r, o]) => toCar(B.d, B.hit[0] + dx * r - dy * o, B.hit[1] + dy * r + dx * o, -0.005));
        const k = pos.length / 3; for (const v of q) pos.push(v.x, v.y, v.z); idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      lines = steamy(new THREE.Mesh(g, basic("#ffffff", { side: THREE.DoubleSide, transparent: true, opacity: 0.95, depthWrite: false })), 9); P.whole.add(lines);
    }
    // the pour
    const NS = 20, NCR = 16, pg = new THREE.BufferGeometry(), ppos = new Float32Array((NS + 1) * NCR * 3), puv = new Float32Array((NS + 1) * NCR * 2), pidx = [];
    for (let i = 0; i <= NS; i++) for (let j = 0; j < NCR; j++) { puv[(i * NCR + j) * 2] = i / NS; puv[(i * NCR + j) * 2 + 1] = j / NCR; }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NCR; j++) { const a = i * NCR + j, b = i * NCR + ((j + 1) % NCR), c2 = (i + 1) * NCR + j, d2 = (i + 1) * NCR + ((j + 1) % NCR); pidx.push(a, c2, b, b, c2, d2); }
    pg.setAttribute("position", new THREE.BufferAttribute(ppos, 3)); pg.setAttribute("aUv", new THREE.BufferAttribute(puv, 2)); pg.setIndex(pidx);
    const pourM = shader({
      uniforms: { uT: { value: 0 }, uA: { value: 1 }, uBody: { value: C("#3f6b5a") }, uHi: { value: C("#8fb8a6") }, uFoam: { value: C("#e6f0ec") }, uInk: { value: C("#14241f") } },
      vertexShader: `attribute vec2 aUv; varying vec2 vS; void main() { vS = aUv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uT, uA; uniform vec3 uBody, uHi, uFoam, uInk; varying vec2 vS; ${HASH} ${BAND}
        void main() {
          float ph = vS.y * 6.2832, cz = cos(ph), sy = sin(ph);
          vec3 col = uBody;
          col = mix(col, uHi, bandStep(0.78, sy) * (1.0 - smoothstep(0.55, 1.0, vS.x)));
          float fs = vn2(vec2(cz * 7.0 + 3.0, vS.x * 4.0 - uT * 3.0 / 0.35)); col = mix(col, uFoam, step(0.65, fs) * 0.9);
          float e = 1.0 - abs(cz), w = fwidth(e) * 2.0 + 0.003;
          col = mix(col, uInk, 1.0 - smoothstep(0.0, w, e));
          gl_FragColor = vec4(col, 0.92 * uA);
        }`,
      side: THREE.DoubleSide,
    }, 7);
    const pour = steamy(new THREE.Mesh(pg, pourM), 7); P.whole.add(pour);
    const foot = foamPatch(P.whole, 0.77, 7);
    const NDR = 10, pdrops = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), basic("#e6f0ec"), NDR); pdrops.instanceMatrix.setUsage(THREE.DynamicDrawUsage); steamy(pdrops, 9); P.whole.add(pdrops);

    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, e = carE(P), e5 = e[5] || 1, L = Math.min(ps.level, 1.94), Yw = e[5] * L - 0.3 * e[9] + e[13];
        const surfY = (x, z) => (Yw - e[13] - e[1] * x - e[9] * z) / e5;
        const bursting = !!B && (ps.burst ?? 0) > 0.5 && tt >= T0 - 1e-6, af = bursting ? (tt - T0) / F3 : -1;   // frames since the burst
        const gone = bursting && af >= 3 - 1e-6;
        // panes
        for (const p of panes) {
          p.mat.uniforms.uT.value = tt;
          const isB = p === B, isDrop = p.d.id === DP;
          p.g.position.y = isDrop ? -(ps.drop ?? 0) : 0;
          const show = !(isB && gone);
          p.mesh.visible = show; p.edge.visible = show;
          p.mat.uniforms.uCraze.value = isB && bursting && af < 3 ? 1 : 0;
        }
        dMat.uniforms.uWater.value = 0;
        for (let i = 0; i < drops.length; i++) placeDrop(i, drops[i], tt, gone);
        dMesh.instanceMatrix.needsUpdate = true;
        // bubbles on the glass, in the lake below world y 0
        let bi = 0;
        for (const p of panes) {
          for (let k = 0; k < 12; k++, bi++) {
            const d = p.d, us = d.poly.map((q) => q[0]), u = Math.min(...us) + (0.1 + 0.8 * rnd(bi * 9 + 1)) * (Math.max(...us) - Math.min(...us)), [lo, hi] = colRange(d.poly, u);
            const q0 = toCar(d, u, lo, 0.01), q1 = toCar(d, u, hi, 0.01);
            // world y of the pane's points along v: e1 x + e5 y + e9 z + e13 (y 0 is the lake)
            const w0 = e[1] * q0.x + e[5] * q0.y + e[9] * q0.z + e[13], dw = (e[5] * (q1.y - q0.y) + e[9] * (q1.z - q0.z));
            const frac = clamp(-w0 / (dw || 1e-6), 0, 1), H = frac * (hi - lo);
            const hide = (p === B && gone) || H < 0.03 || dw === 0;
            if (hide) { bubs.clear(bi); continue; }
            const v = lo + ((0.3 * tt + rnd(bi * 9 + 2) * 3) % H);
            const q = toCar(d, u + 0.003 * Math.sin(tt * 5 + bi), v, 0.014);
            bubs.set(bi, q.x, q.y, q.z, 0.002 + 0.003 * rnd(bi * 9 + 3), 0.9, 1);
          }
        }
        bubs.done();
        // the burst
        const up = _ax.set(e[1], e[5], e[9]);
        if (B) {
          const tc = bursting ? tt - T0 : -1;
          lines && (lines.visible = bursting && af < 6);
          cubes.visible = bursting && gone; rings.mesh.visible = bursting && gone;
          if (bursting && gone) {
            // the world's gravity in the car's frame: -9.8 along the world up
            const g = new THREE.Vector3(-9.8 * e[1], -9.8 * e[5], -9.8 * e[9]);
            for (let i = 0; i < NC; i++) {
              const c = CB[i], age = tc - c.birth;
              if (age < 0 || age > Math.min(c.life, 0.9 - c.birth)) { _m.makeScale(0, 0, 0); cubes.setMatrixAt(i, _m); rings.clear(i); continue; }
              // when it reaches the cabin water: -4.9 a^2 + (up . v) a + (hw0 - Yw) = 0, world heights
              const hw0 = up.dot(c.p0) + e[13], vu = up.dot(c.v), disc = vu * vu + 19.6 * (hw0 - Yw);
              const ah = hw0 > Yw && disc >= 0 ? (vu + Math.sqrt(disc)) / 9.8 : 0;
              const pa = (a) => _p.copy(c.p0).addScaledVector(c.v, a).addScaledVector(g, 0.5 * a * a);
              if (age >= ah) {
                _m.makeScale(0, 0, 0); cubes.setMatrixAt(i, _m);
                const ra = age - ah;
                if (ra < 0.18 && hw0 > Yw) { pa(ah); rings.set(i, _p.x, _p.y, _p.z, 0.015 + 0.015 * (ra / 0.18), 0.8 * (1 - ra / 0.18), 1); } else rings.clear(i);
                continue;
              }
              rings.clear(i);
              pa(age); _q.setFromAxisAngle(c.ax, c.ph + c.w * age); _s.set(c.size, c.size, c.size); _m.compose(_p, _q, _s); cubes.setMatrixAt(i, _m);
            }
          } else for (let i = 0; i < NC; i++) { _m.makeScale(0, 0, 0); cubes.setMatrixAt(i, _m); rings.clear(i); }
          // the rim stays from frame 3 on
          for (let i = 0; i < NR; i++) {
            const r = CB.rim?.[i];
            if (!r || !gone) { _m.makeScale(0, 0, 0); cubes.setMatrixAt(NC + i, _m); continue; }
            _q.setFromAxisAngle(r.ax, r.ang); _s.set(r.size, r.size, r.size); _m.compose(r.q, _q, _s); cubes.setMatrixAt(NC + i, _m);
          }
          cubes.visible = bursting && gone;
          cubes.instanceMatrix.needsUpdate = true; rings.done();
        }
        // the pour: in over 6 frames from frame 3, until pourEnd, out by +0.5 s; the sheet is under water once the level passes the sill + 0.15
        const k = !!B && (ps.burst ?? 0) > 0.5 ? sm((tt - T0 - 3 * F3) / (6 * F3)) * (1 - sm((tt - POUR_END) / 0.5)) * clamp(ps.pour ?? 1) : 0;
        pour.visible = k > 0.01; foot.o.visible = k > 0.01; pdrops.visible = k > 0.01;
        if (k > 0.01) {
          const T = (0.30 + 0.15 * clamp((tt - T0) / 1.5)) * k, W0 = 0.6 * (0.5 + 0.5 * k), XS = CABIN.glassX, XL = XS - 0.7;
          const y0 = BT + 0.02 + T / 2, yE = surfY(XL, PZ) + 0.02, vis = sm((y0 + 0.05 - yE) / 0.2);
          pour.visible = vis > 0.02;
          pourM.uniforms.uT.value = tt; pourM.uniforms.uA.value = 1;
          const Te = T * vis;
          for (let i = 0; i <= NS; i++) {
            const s = i / NS, x = XS - 0.7 * s, ya = y0 + 0.14 * s - (y0 + 0.14 - Math.min(yE, y0)) * s * s, dy = 0.14 - 2 * (y0 + 0.14 - Math.min(yE, y0)) * s, dx = -0.7, dl = Math.hypot(dx, dy), nx = -dy / dl * -1, ny = (dx / dl) * -1;
            const W = W0 + 0.2 * s, Ts = Te * (1 - 0.35 * s);
            for (let j = 0; j < NCR; j++) {
              const ph = (j / NCR) * 6.2832, c = Math.cos(ph), sn = Math.sin(ph);
              const zc = PZ + (W / 2) * Math.sign(c) * Math.pow(Math.abs(c), 0.35), nn = (Ts / 2) * Math.sign(sn) * Math.pow(Math.abs(sn), 0.6);
              const o = (i * NCR + j) * 3; ppos[o] = x + nx * nn; ppos[o + 1] = ya + ny * nn; ppos[o + 2] = zc;
            }
          }
          pg.attributes.position.needsUpdate = true;
          // the foot: foam r 0.45 on the water where it lands, 10 drops a frame up to 0.3 m
          const ys = surfY(XL, PZ);
          foot.o.position.set(XL, ys + 0.012, PZ); foot.o.scale.set(0.45 * k, 1, 0.45 * k); foot.m.uniforms.uT.value = tt;
          foot.o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-e[1] / e5, 1, -e[9] / e5).normalize());
          for (let i = 0; i < NDR; i++) {
            const ph = (tt / 0.35 + rnd(i + 400)) % 1, a = rnd(i + 410) * 6.2832, rr = 0.38 * rnd(i + 420) + 0.02, tau = ph * 0.49, y = 2.42 * tau - 4.9 * tau * tau, sz = 0.01 + 0.01 * rnd(i + 430);
            _p.set(XL + Math.cos(a) * rr, ys + 0.02 + Math.max(0, y), PZ + Math.sin(a) * rr); _q.identity(); _s.set(sz * k, sz * k, sz * k); _m.compose(_p, _q, _s); pdrops.setMatrixAt(i, _m);
          }
          pdrops.instanceMatrix.needsUpdate = true;
        }
      },
    };
  },

  // ------------------------------------------------------------------ the dashboard that dies at 11.5 s
  dashglow(P) {
    const AMB = C("#ffb347"), face = std("#14181b", { roughness: 0.9 }), red = new THREE.Color("#e0362c");
    const amb = basic("#ffb347"), tri = basic("#e0362c"), dot = basic("#ffb347");
    const g = new THREE.Group(); P.whole.add(g);
    // the binnacle: a dark hood on the dash in front of the driver, its face toward the cabin (-z)
    const bz = 0.55, bx = 0.55, by = 1.0;   // above the lake at the dash: with 9 degrees of pitch the surface at z 0.5 is 0.13 over its level at z -0.3
    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.11, 0.1), std("#1b1f23", { roughness: 0.8 })); hood.position.set(bx, by, bz + 0.01); g.add(hood);
    const needles = [];
    for (const dx of [-0.075, 0.075]) {
      const d = new THREE.Group(); d.position.set(bx + dx, by, bz - 0.042); d.rotation.y = Math.PI; g.add(d);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.045, 28), face); d.add(disc);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.036, 0.042, 28), amb); ring.position.z = 0.001; d.add(ring);
      for (let k = 0; k < 9; k++) { const a = (-120 + 30 * k) * D2R, tk = new THREE.Mesh(new THREE.PlaneGeometry(0.003, 0.008), amb); tk.position.set(Math.sin(a) * 0.029, Math.cos(a) * 0.029, 0.001); tk.rotation.z = -a; d.add(tk); }
      const nd = new THREE.Mesh(new THREE.PlaneGeometry(0.004, 0.034), amb); nd.position.set(0, 0.012, 0.002); nd.rotation.z = (dx < 0 ? -30 : 20) * D2R; d.add(nd); needles.push(nd);
      const hub = new THREE.Mesh(new THREE.CircleGeometry(0.006, 12), amb); hub.position.z = 0.003; d.add(hub);
    }
    // the hazard triangle on the dash face, the window button with its amber dot on the driver's door
    const hz = new THREE.Group(); hz.position.set(0, 0.79, 0.468); hz.rotation.y = Math.PI; g.add(hz);
    const ts = new THREE.Shape(); ts.moveTo(0, 0.015); ts.lineTo(-0.0173, -0.0075); ts.lineTo(0.0173, -0.0075); ts.closePath();
    hz.add(new THREE.Mesh(new THREE.ShapeGeometry(ts), tri));
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.02, 0.03), std("#1b1f23", { roughness: 0.7 })); plate.position.set(0.97, 0.82, 0.18); g.add(plate);
    const dt = new THREE.Mesh(new THREE.CircleGeometry(0.005, 12), dot); dt.rotation.y = -Math.PI / 2; dt.position.set(0.961, 0.822, 0.18); g.add(dt);
    const wb = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.012), basic("#3a4046")); wb.rotation.y = -Math.PI / 2; wb.position.set(0.9615, 0.808, 0.18); g.add(wb);
    // one amber light: its colour carries `on` (the engine sets every room light's intensity from its build value each frame)
    const light = new THREE.PointLight("#000000", 1.1, 2.6, 1.4); light.position.set(bx, by + 0.03, bz - 0.12); g.add(light);
    g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
    return {
      grip: 0,
      apply(ps) {
        const on = clamp(ps.on ?? 0);
        for (const m of [amb, dot]) m.color.copy(AMB).multiplyScalar(on);
        tri.color.copy(red).multiplyScalar(on);
        light.color.copy(AMB).multiplyScalar(on);
        needles[0].rotation.z = (-30 + 30 * on) * D2R; needles[1].rotation.z = (20 + 10 * on) * D2R;
      },
    };
  },

  // ------------------------------------------------------------------ the held headrest (EP02 panel 08)
  headrest(P) {
    const col = P.spec.color || "#2b2e33", shade = "#1a1c20";
    const fab = std(col, { roughness: 0.85 }), seam = std("#3c4046", { roughness: 0.8 });
    const g = new THREE.Group(); P.whole.add(g);
    const W = 0.28, H = 0.18, D = 0.10, R = 0.03, BV = 0.015;   // the bevel adds BV round the shape: the shape is W - 2 BV x H - 2 BV
    // the pad: a rounded slab (3 cm corners across the front, a soft edge all round)
    const sh = new THREE.Shape(); const x = W / 2 - BV, y = H / 2 - BV, R2 = R - BV + 0.0;
    sh.moveTo(-x + R2, -y); sh.lineTo(x - R2, -y); sh.quadraticCurveTo(x, -y, x, -y + R2); sh.lineTo(x, y - R2); sh.quadraticCurveTo(x, y, x - R2, y); sh.lineTo(-x + R2, y); sh.quadraticCurveTo(-x, y, -x, y - R2); sh.lineTo(-x, -y + R2); sh.quadraticCurveTo(-x, -y, -x + R2, -y);
    const pg = new THREE.ExtrudeGeometry(sh, { depth: D - 0.03, bevelEnabled: true, bevelThickness: BV, bevelSize: BV, bevelSegments: 4, curveSegments: 8 }); pg.translate(0, 0, -(D - 0.03) / 2);
    const pad = new THREE.Mesh(pg, fab); g.add(pad);
    // a shaded underside, so the charcoal has two tones
    const under = new THREE.Mesh(new THREE.BoxGeometry(W - 0.03, 0.012, D - 0.03), std(shade, { roughness: 0.9 })); under.position.y = -H / 2 + 0.002; g.add(under);
    // the seam, 1 cm in from the edge, on the front and the back
    const rr = (w, h, r) => { const s2 = new THREE.Shape(); const a = w / 2, b = h / 2; s2.moveTo(-a + r, -b); s2.lineTo(a - r, -b); s2.quadraticCurveTo(a, -b, a, -b + r); s2.lineTo(a, b - r); s2.quadraticCurveTo(a, b, a - r, b); s2.lineTo(-a + r, b); s2.quadraticCurveTo(-a, b, -a, b - r); s2.lineTo(-a, -b + r); s2.quadraticCurveTo(-a, -b, -a + r, -b); return s2.getPoints(10).map((p) => new THREE.Vector3(p.x, p.y, 0)); };
    for (const sz of [1, -1]) { const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rr(W - 0.04, H - 0.04, 0.02), true), 80, 0.0028, 6, true), seam); t.position.z = sz * (D / 2 + 0.0005); g.add(t); }
    // the prongs: steel, 1.4 cm thick, 0.12 long, 0.14 apart, a white stripe on one side, two notches on one
    for (const [i, px] of [-0.07, 0.07].entries()) {
      const cg = new THREE.CylinderGeometry(0.007, 0.007, 0.12, 16, 1, true), pa = cg.attributes.position, cl = [];
      for (let v = 0; v < pa.count; v++) { const a = Math.atan2(pa.getZ(v), pa.getX(v)), c = Math.cos(a - 0.9); const k = c > 0.88 ? [1, 1, 1] : c > -0.2 ? [0.79, 0.82, 0.83] : [0.35, 0.38, 0.41]; cl.push(...k); }
      cg.setAttribute("color", new THREE.Float32BufferAttribute(cl, 3));
      const pr = new THREE.Mesh(cg, std("#ffffff", { vertexColors: true, roughness: 0.35, metalness: 0.6 })); pr.position.set(px, -H / 2 - 0.06, 0); g.add(pr);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.007, 12, 8), std("#c9d0d4", { roughness: 0.35, metalness: 0.6 })); tip.position.set(px, -H / 2 - 0.12, 0); g.add(tip);
      if (i === 0) for (const nz of [0.02, 0.036]) { const n = new THREE.Mesh(new THREE.TorusGeometry(0.0072, 0.0026, 6, 16), std("#3a4145", { roughness: 0.6 })); n.rotation.x = Math.PI / 2; n.position.set(px, -H / 2 - nz, 0); g.add(n); }
    }
    return { grip: 0 };
  },

  // ------------------------------------------------------------------ the headlamps' light
  headbeams(P) {
    const LAMPS = [[0.66, 0.78, 1.64], [-0.66, 0.78, 1.64]];   // car-hatchback.js: x +-0.66, y 0.78, the lens' front at z nose - 0.03 + 0.07
    const LEN = 4.5, R0 = 0.08, R1 = 1.2, SEG = 28;
    const pos = [], aK = [], idx = [];
    for (const [k, a, b] of [[0, R0, R1], [1, R0 * 0.5, R1 * 0.5]]) for (let i = 0; i <= 1; i++) for (let j = 0; j <= SEG; j++) {
      const th = (j / SEG) * 6.2832, r = a + (b - a) * i; pos.push(Math.cos(th) * r, Math.sin(th) * r, LEN * i); aK.push(k);
    }
    for (const k of [0, 1]) for (let j = 0; j < SEG; j++) { const o = k * 2 * (SEG + 1), a = o + j, b = o + j + 1, c = o + SEG + 1 + j, d = o + SEG + 2 + j; idx.push(a, c, b, b, c, d); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("aK", new THREE.Float32BufferAttribute(aK, 1)); geo.setIndex(idx);
    const slope = (R1 - R0) / LEN;
    const coneM = shader({
      uniforms: { uA: { value: 1 }, uCol: { value: C("#f2e9a8") } },
      vertexShader: `attribute float aK; uniform float uA; varying float vU; varying float vK; varying float vF;
        void main() {
          vU = position.z / ${LEN.toFixed(2)}; vK = aK;
          vec3 radial = vec3(position.xy, 0.0); float rl = length(radial); radial = rl > 1e-5 ? radial / rl : vec3(0.0);
          vec3 nrm = normalize(vec3(radial.xy, -${slope.toFixed(4)}));
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vF = abs(dot(normalize(normalMatrix * nrm), normalize(-mv.xyz)));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `uniform float uA; uniform vec3 uCol; varying float vU; varying float vK; varying float vF;
        void main() {
          float k = 1.0 - vU; float a = (vK < 0.5 ? 0.38 : 0.25) * k * k * uA * mix(0.4, 1.0, vF);
          gl_FragColor = vec4(uCol, a);
        }`,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    }, 4);
    const glowM = () => shader({
      uniforms: { uA: { value: 0 }, uC: { value: C("#f2e9a8") } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); c.xy += (uv - 0.5) * 2.0 * 0.25; gl_Position = projectionMatrix * c; }`,
      fragmentShader: `uniform float uA; uniform vec3 uC; varying vec2 vUv; void main() { float r = length(vUv - 0.5) * 2.0; gl_FragColor = vec4(uC, pow(max(0.0, 1.0 - r), 1.6) * uA); }`,
      blending: THREE.AdditiveBlending,
    }, 5);
    const lamps = LAMPS.map(([x, y, z]) => {
      const cone = steamy(new THREE.Mesh(geo, coneM), 4); cone.position.set(x, y, z); P.whole.add(cone);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.08, 24), basic("#fff6c8")); disc.position.set(x, y, z - 0.004); steamy(disc, 5); P.whole.add(disc);
      const halo = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glowM()), 5); halo.position.set(x, y, z + 0.01); P.whole.add(halo);
      return { cone, disc, halo };
    });
    return {
      grip: 0,
      apply(ps) {
        const l = clamp(ps.lamps ?? 1), k = l * sm((l - 0.1) / 0.4), dotK = Math.sqrt(l);
        coneM.uniforms.uA.value = k;
        for (const q of lamps) {
          q.cone.visible = k > 0.005; q.disc.visible = dotK > 0.02; q.halo.visible = dotK > 0.02;
          q.disc.material.color.set("#fff6c8").multiplyScalar(dotK); q.halo.material.uniforms.uA.value = 0.5 * dotK;
        }
      },
    };
  },

  // ------------------------------------------------------------------ underwater bubbles (DESIGN section 2)
  lakebubbles(P) {
    const S = P.spec, mode = S.mode || "stream", MAX = S.max ?? 900;
    const swarm = bubbleSwarm(P.whole, MAX, { order: 9, fog: true });
    const car = S.car || null, at = S.at || (car ? [0.99, 1.4, 0.2] : [0, 0, 0]);
    const sizes = S.sizes || null;
    // where the source is in the world at time t (the car's frame through its own key table, or a path, or a point)
    const where = (t) => {
      if (S.path) { const p = S.path; if (t <= p[0][0]) return p[0].slice(1); for (let i = 1; i < p.length; i++) if (t <= p[i][0]) { const a = p[i - 1], b = p[i], u = (t - a[0]) / (b[0] - a[0] || 1); return [1, 2, 3].map((j) => a[j] + (b[j] - a[j]) * u); } return p[p.length - 1].slice(1); }
      return car ? rigToWorld(car, t, at) : at;
    };
    let births = [];   // [birth time, hashed id]
    const rates = S.rates || (sizes ? [[19, 8], [22, 8], [24, 3], [26, 0]] : [[19, 45], [22, 45], [24, 12], [26, 0]]);
    if (mode === "stream") {
      // bubble k is born when the integral of the rate reaches k (piecewise linear rate)
      let cum = 0, k = 0, nxt = 0.5;
      for (let i = 1; i < rates.length && births.length < 6000; i++) {
        const [t0, r0] = rates[i - 1], [t1, r1] = rates[i], dur = t1 - t0, area = 0.5 * (r0 + r1) * dur;
        while (nxt <= cum + area && births.length < 6000) {
          const need = nxt - cum; let u;   // solve r0 u + 0.5 (r1 - r0) u^2 / dur = need
          const a = 0.5 * (r1 - r0) / (dur || 1), b = r0;
          u = Math.abs(a) < 1e-9 ? need / (b || 1e-9) : (-b + Math.sqrt(Math.max(0, b * b + 4 * a * need))) / (2 * a);
          births.push([t0 + u, k++]); nxt += 1;
        }
        cum += area;
      }
    } else if (mode === "mouth") {
      for (let tb = S.from ?? 0, k = 0; tb < Math.min(S.to ?? 1e9, (S.from ?? 0) + 600) && births.length < 6000; tb += 0.8) { const n = 5 + Math.floor(rnd(k * 3 + 1) * 4); for (let j = 0; j < n; j++) births.push([tb + 0.02 * j, k * 10 + j]); k++; }
    } else {
      (S.kicks || []).forEach((tk, k) => { for (let j = 0; j < 6; j++) births.push([tk + 0.03 * j, k * 10 + j]); });
    }
    const diaOf = (id) => {
      if (mode === "mouth") return 0.01 + 0.02 * rnd(id * 3 + 5);
      if (mode === "kick") return 0.01 + 0.01 * rnd(id * 3 + 5);
      if (sizes) return (sizes[0] + (sizes[1] - sizes[0]) * rnd(id * 3 + 5)) / 100;
      const q = rnd(id * 3 + 4); return q < 0.7 ? 0.02 + 0.02 * rnd(id * 3 + 5) : q < 0.95 ? 0.04 + 0.02 * rnd(id * 3 + 5) : 0.07 + 0.02 * rnd(id * 3 + 5);
    };
    const speedOf = (id, d) => (mode === "mouth" ? 0.32 + 0.14 * rnd(id * 3 + 6) : 0.25 + 7 * d);
    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0; let n = 0;
        for (const [tb, id] of births) {
          if (tb > tt) break;
          const d = diaOf(id), v = speedOf(id, d), age = tt - tb, maxLife = mode === "mouth" ? 2.5 : 40;
          if (age > maxLife) continue;
          const o = where(tb), y = o[1] + v * age;
          if (y >= 0 || n >= MAX) continue;
          const wide = 0.15 * (y - o[1]), a = rnd(id * 7 + 11) * 6.2832, rr = (0.03 + 0.02 * rnd(id * 7 + 12)) + wide * rnd(id * 7 + 13);
          const wob = 0.03 * Math.sin(6.2832 * 2.5 * age + rnd(id * 7 + 14) * 6.2832);
          swarm.set(n++, o[0] + Math.cos(a) * rr + wob, y, o[2] + Math.sin(a) * rr + wob * 0.6, d / 2, mode === "mouth" ? clamp(1 - (age - 1.8) / 0.7) : 1, d > 0.06 ? 0.7 : 1);
        }
        for (let i = n; i < MAX; i++) swarm.clear(i);
        swarm.done();
      },
    };
  },
};
