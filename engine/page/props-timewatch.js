import * as THREE from "three";
import { clamp } from "./util.js";

// "Your competitive friend has a time-travel watch. There's a catch." (There's a catch, episode 7, brief
// storyboards/series/what-if/07-time-travel/BRIEF-T2.md): the power and what it does to the weather. Metres, params
// arrive as prop tweens (`set`). propState (props3d.js) has defaults for crack (0), burst (spec.burst 0), splash (0),
// glow (spec.glow) and time (spec.time, else 2.75); every other param below reads spec.<name> until a tween sets it, and
// the first tween of such a key JUMPS, so seed hands / wind / shake / glint / streak / snow / leaves / rain / swing with
// a dur-0 `set` at time 0. Everything is a pure function of the params and the clip time (no random numbers, no clock).
//   pocketwatch  a brass hunter pocket watch, 0.075 across, 0.022 thick. Origin: the case centre. The face looks +z at rot 0,
//                12 o'clock is +y, the crown + bow ring stand on top (y to 0.0615) and a 0.22 brass chain leaves the bow in
//                a loose loop that hangs on the -x side (the hand holds it from +x). Spec: floor -1.0 (where burst parts land,
//                metres relative to the origin). Params (all default 0):
//                hands (turns of the minute hand, any number, negative runs backward; hour hand at 1/12; rest pose 10:10; the
//                  little seconds hand turns 12 x as fast),
//                crack 0..1 (propState default 0: a crack grows over the glass from the 2 o'clock edge: a main line, then 3
//                  branches), wind (degrees the crown has turned: its 12 knurl ridges rotate),
//                shake 0..1 (a fast small tremble from the clip time), glint 0..1 (a 4-point star on the glass),
//                burst 0..1 (propState default spec.burst 0): 0.0-0.15 the glass shatters into 14 shards and the back pops
//                  open (hinged at 6 o'clock); 0.15-1 about 10 gears, 5 coil springs, 3 hands and the shards fly out in
//                  deterministic arcs up to 0.6 m and fall under gravity to spec.floor, spinning, and lie there from burst
//                  ~0.8. The case, crown, bow and chain stay.
//                Grip "case" (TIMEWATCH_GRIPS, [x, y, z] in the prop's frame): a fist 7.5 cm under the case's centre and 3.5 cm behind it, so the
//                  case sits on top of the glove with the face, hands, crown and bow all free (grab it with a fist grip). Grips library: kind
//                pocketwatch SIZE { r 0.0375, h 0, len 0.062 }: hold "mug" closes round the case at its centre height from the
//                +x side (the director turns it with placeFor(..., { turn: 180 }) to show the face to the camera); hold "thin"
//                pinches the top (0.6 of len = the crown) between thumb and finger. Solid for the checks: the case only.
//   watchwreck   the broken watch lying in a puddle (panel 15). Origin on the ground, flat-ish, all within a 0.35 m circle: the
//                empty case open like a clam (back leaf open ~110 degrees, face plate bare of hands), a bent chain, 6 gears,
//                3 springs, 8 glass shards. Spec: rot via the prop's own rot. No params. See-through (ghost) for the checks.
//   rainbox      rain that time can run backward. Origin: the middle of the box's BOTTOM on the ground; the box is spec.box
//                [w, h, d] (default [8, 6, 8]) from y 0 to h, centred in x and z. Spec: n 1500 drops, speed 9 m/s, slant
//                [0.08, 0] (m along x, z per metre fallen), alpha 0.55, seed 0. Params:
//                time (seconds, default: the clip time; every drop's place is a pure function of it; tween it down to make
//                  the rain RISE, hold it to freeze it; a drop falls through h in h / speed / (0.8..1.2) seconds),
//                streak 0..1 (default 1; 1 = 0.34 m falling streaks, 0 = round drops 2.4 cm across),
//                splash 0..1 (propState default 0: the ring and crown on the ground, from time too; 1 = full, runs backward
//                  with time: a rising drop pulls its crown back in). Bright blue-white, see-through (ghost).
//   seasonswirl  the seasons flashing past (panel 12): a cylinder of snowflakes, orange-red autumn leaves and rain streaks
//                swirling round the origin (bottom centre on the ground) in spec.r 6, spec.h 8, spec.n 600 (a third each),
//                spec.swirl 1.5 (rad/s). Params: time (as rainbox), snow, leaves, rain 0..1 (each kind's share of its third;
//                default spec value, else 1). Ghost.
//   goldmedal    a worn medal: red-white-blue ribbon V and a 0.075 gold disc with a laurel wreath (no letters). Worn with
//                wear: "<id>", x, y, z = a point on the body's FRONT surface where the ribbon's top centre is (the neck in
//                front; the V's arms start 0.13 each side of it, the disc hangs 0.24 below). The ribbon follows a ball of
//                spec.r (0.36) behind that point. Param swing 0..1 (default 0): the disc swings from the clip time. Ghost.
const D2R = Math.PI / 180;
const hs = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const ghostAll = (g) => { g.traverse((o) => { if (o.isMesh || o.isLine) { o.frustumCulled = false; o.castShadow = o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; } }); return g; };
const ghost = (o, order = 0) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
const flag = (m) => { m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; return m; };
const bas = (o) => new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.1, ...o });
const cvs = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; };
const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mesh = (geo, m, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
// time: spec.time, else the clip time (propState's own default for time is 2.75, which nothing tweens to by chance)
const timeOf = (ps, S, t) => (S.time === undefined && ps.time === 2.75 ? (t ?? 0) : ps.time);

export const TIMEWATCH_GRIPS = {
  pocketwatch: { case: [0, -0.075, -0.035] },
};

// ------------------------------------------------------------------------------------------------ textures
const BRASS = "#d4a03c";
function brassTex(seed = 0, rings = false) {
  return tex(cvs(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#f0c86a"); gr.addColorStop(0.45, "#d4a03c"); gr.addColorStop(1, "#a8741f");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {                       // brushed streaks and a few scratches, each drawn once
      const y = hs(i, seed) * h, x = hs(i, seed + 1) * w, l = 20 + hs(i, seed + 2) * 90;
      g.strokeStyle = hs(i, seed + 3) > 0.5 ? "rgba(255,236,170,0.22)" : "rgba(110,70,10,0.2)"; g.lineWidth = 0.6 + hs(i, seed + 4) * 1.4;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (hs(i, seed + 5) - 0.5) * 5); g.stroke();
    }
    if (rings) { g.strokeStyle = "rgba(110,70,10,0.45)"; g.lineWidth = 2; for (const r of [100, 88, 58]) { g.beginPath(); g.arc(128, 128, r, 0, Math.PI * 2); g.stroke(); } }
  }));
}
function faceTex() {
  return tex(cvs(512, 512, (g, w, h) => {
    const gr = g.createRadialGradient(256, 256, 20, 256, 256, 256); gr.addColorStop(0, "#f4ebcd"); gr.addColorStop(0.8, "#e9dcb4"); gr.addColorStop(1, "#cdb988");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#2a1d12"; g.lineCap = "round";
    g.lineWidth = 5; g.beginPath(); g.arc(256, 256, 236, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.arc(256, 256, 190, 0, Math.PI * 2); g.stroke();
    for (let m = 0; m < 60; m++) {                        // minute track, a hand-set jitter on every tick
      const a = (m / 60) * Math.PI * 2 + (hs(m, 7) - 0.5) * 0.012, big = m % 5 === 0;
      if (big) continue;
      g.lineWidth = 2.4; g.beginPath(); g.moveTo(256 + Math.sin(a) * 214, 256 - Math.cos(a) * 214); g.lineTo(256 + Math.sin(a) * 232, 256 - Math.cos(a) * 232); g.stroke();
    }
    for (let k = 0; k < 12; k++) {                        // the 12 bold ticks: tapered wedges, no numerals
      const a = (k / 12) * Math.PI * 2 + (hs(k, 9) - 0.5) * 0.01, ca = Math.cos(a), sa = Math.sin(a), r0 = 168, r1 = 232, w0 = k % 3 === 0 ? 17 : 12, w1 = w0 * 0.55;
      g.fillStyle = "#1f150d"; g.beginPath();
      g.moveTo(256 + sa * r0 - ca * w0 / 2, 256 - ca * r0 - sa * w0 / 2); g.lineTo(256 + sa * r0 + ca * w0 / 2, 256 - ca * r0 + sa * w0 / 2);
      g.lineTo(256 + sa * r1 + ca * w1 / 2, 256 - ca * r1 + sa * w1 / 2); g.lineTo(256 + sa * r1 - ca * w1 / 2, 256 - ca * r1 - sa * w1 / 2); g.closePath(); g.fill();
    }
    const cx = 256, cy = 256 + 0.0155 / 0.033 * 256 * 1.0, R = 0.0095 / 0.033 * 256;   // the small seconds dial at 6 o'clock
    g.fillStyle = "rgba(255,248,224,0.7)"; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#2a1d12"; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; g.lineWidth = k % 3 === 0 ? 3.5 : 2; g.beginPath(); g.moveTo(cx + Math.sin(a) * R * 0.72, cy - Math.cos(a) * R * 0.72); g.lineTo(cx + Math.sin(a) * R * 0.95, cy - Math.cos(a) * R * 0.95); g.stroke(); }
    g.fillStyle = "rgba(120,90,50,0.1)"; for (let i = 0; i < 60; i++) { g.beginPath(); g.arc(hs(i, 31) * w, hs(i, 32) * h, 1 + hs(i, 33) * 2.5, 0, Math.PI * 2); g.fill(); }   // age spots
  }));
}
function movementTex() {
  return tex(cvs(256, 256, (g, w, h) => {
    g.fillStyle = "#8a5f1c"; g.fillRect(0, 0, w, h);
    const gears = [[128, 128, 62, 12], [60, 88, 38, 9], [196, 80, 34, 9], [70, 190, 40, 10], [188, 190, 42, 11]];
    gears.forEach(([x, y, r, n], gi) => {
      g.fillStyle = gi % 2 ? "#d9ab4a" : "#bf8f30"; g.beginPath();
      for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, rr = i % 2 ? r * 0.82 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      g.closePath(); g.fill(); g.fillStyle = "#4b2f0c"; g.beginPath(); g.arc(x, y, r * 0.22, 0, Math.PI * 2); g.fill();
    });
    g.fillStyle = "#c8323c"; for (const [x, y] of [[128, 128], [60, 88], [196, 80], [188, 190]]) { g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill(); }   // jewels
  }));
}
function glintTex() {
  return tex(cvs(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,0.85)"); gr.addColorStop(0.12, "rgba(255,246,210,0.35)"); gr.addColorStop(0.5, "rgba(255,230,160,0)"); gr.addColorStop(1, "rgba(255,230,160,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    g.fillStyle = "rgba(255,255,255,0.95)";
    g.beginPath(); g.moveTo(64, 2); g.quadraticCurveTo(68, 60, 126, 64); g.quadraticCurveTo(68, 68, 64, 126); g.quadraticCurveTo(60, 68, 2, 64); g.quadraticCurveTo(60, 60, 64, 2); g.fill();
  }));
}

// ------------------------------------------------------------------------------------------------ small parts
function gearGeo(teeth, ro, ri, holes = 0, thick = 0.002) {
  const s = new THREE.Shape();
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2, st = (Math.PI * 2) / teeth, pts = [[0.0, ri], [0.18, ro], [0.52, ro], [0.7, ri]];
    for (const [f, r] of pts) { const a = a0 + st * f; i === 0 && f === 0 ? s.moveTo(Math.cos(a) * r, Math.sin(a) * r) : s.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  }
  s.closePath();
  const hole = new THREE.Path(); hole.absarc(0, 0, ri * 0.28, 0, Math.PI * 2, true); s.holes.push(hole);
  for (let k = 0; k < holes; k++) { const a = (k / holes) * Math.PI * 2, p = new THREE.Path(); p.absarc(Math.cos(a) * ri * 0.62, Math.sin(a) * ri * 0.62, ri * 0.2, 0, Math.PI * 2, true); s.holes.push(p); }
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false, curveSegments: 6 }); g.translate(0, 0, -thick / 2); return g;
}
function springGeo(turns = 6, r = 0.0045, len = 0.026, wire = 0.0007) {
  const pts = []; for (let i = 0; i <= turns * 10; i++) { const a = (i / 10) * Math.PI * 2; pts.push(new THREE.Vector3((i / (turns * 10) - 0.5) * len, Math.cos(a) * r, Math.sin(a) * r)); }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 14, wire, 5);
}
function handGeo(len, tail, wBase, spade) {
  const s = new THREE.Shape();
  s.moveTo(0, -tail); s.lineTo(wBase / 2, -tail * 0.2); s.lineTo(wBase / 2, 0);
  if (spade) { s.lineTo(spade, len * 0.55); s.lineTo(wBase * 0.4, len * 0.7); } else s.lineTo(wBase * 0.35, len * 0.6);
  s.lineTo(0, len); s.lineTo(-wBase * 0.35, spade ? len * 0.7 : len * 0.6);
  if (spade) { s.lineTo(-spade, len * 0.55); s.lineTo(-wBase / 2, 0); } else s.lineTo(-wBase / 2, 0);
  s.lineTo(-wBase / 2, -tail * 0.2); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.0006, bevelEnabled: false }); return g;
}
function shardGeo(i, size = 0.012) {
  const n = 3 + Math.floor(hs(i, 1) * 2), s = new THREE.Shape();
  for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + hs(i, 2 + k) * 0.5, r = size * (0.45 + hs(i, 9 + k) * 0.8); k ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  s.closePath(); return new THREE.ExtrudeGeometry(s, { depth: 0.0006, bevelEnabled: false });
}
const brassMat = (seed = 0, o = {}) => bas({ color: "#ffffff", map: brassTex(seed), metalness: 0.45, roughness: 0.32, emissive: "#4a2c06", emissiveIntensity: 0.55, ...o });
const glassMat = () => flag(new THREE.MeshStandardMaterial({ color: "#d6ecff", transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0, depthWrite: false, side: THREE.DoubleSide, emissive: "#6f8fb0", emissiveIntensity: 0.35 }));
const darkM = () => bas({ color: "#1c140e", roughness: 0.5 });
// links along a curve, each turned 90 degrees to the last about the path; total length is scaled to `len`
function addChain(parent, pts, len, m, linkLen = 0.0085, r = 0.0033) {
  const cur = new THREE.CatmullRomCurve3(pts), k = len / cur.getLength(), N = Math.round(len / linkLen);
  const geo = new THREE.TorusGeometry(r, 0.0011, 6, 12); geo.scale(1.35, 0.8, 1);
  const X = new THREE.Vector3(1, 0, 0), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), out = [];
  for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N, p = cur.getPointAt(u).multiplyScalar(k), tg = cur.getTangentAt(u);
    q.setFromUnitVectors(X, tg); q2.setFromAxisAngle(X, (i % 2) * Math.PI / 2); q.multiply(q2);
    const o = mesh(geo, m, parent, p.x, p.y, p.z); o.quaternion.copy(q); out.push(o);
  }
  const end = cur.getPointAt(1).multiplyScalar(k), bar = mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.016, 8), m, parent, end.x, end.y, end.z); bar.rotation.z = Math.PI / 2 + 0.4;
  return out;
}

// ------------------------------------------------------------------------------------------------ rain and swirl shaders
const RAIN_VS = `
uniform float uTime, uH, uSpeed, uStreak, uLen, uWidth, uAspect;
uniform vec3 uBox, uSlant;
attribute vec4 aSeed;
varying vec2 vUv; varying float vA;
void main() {
  vUv = uv;
  float sv = 0.8 + 0.4 * aSeed.w, d = uSpeed * sv * uTime + aSeed.z * uH, m = mod(d, uH);
  vec3 c = vec3((aSeed.x - 0.5) * uBox.x + uSlant.x * m, uH - m, (aSeed.y - 0.5) * uBox.z + uSlant.z * m);
  vec4 vp = viewMatrix * modelMatrix * vec4(c, 1.0);
  float sc = length(modelMatrix[0].xyz);
  vec3 vd = mat3(viewMatrix) * mat3(modelMatrix) * normalize(vec3(uSlant.x, -1.0, uSlant.z));
  vec2 t2 = length(vd.xy) < 0.02 ? vec2(0.0, 1.0) : normalize(vd.xy), n2 = vec2(-t2.y, t2.x);
  float L = mix(uWidth * 1.7, uLen, uStreak) * sc, W = uWidth * sc * mix(1.0, 0.8, uStreak);
  vec2 off = t2 * position.y * L + n2 * position.x * W;
  vp.xy += off;
  vA = 0.55 + 0.45 * aSeed.z;
  gl_Position = projectionMatrix * vp;
}`;
const RAIN_FS = `
uniform float uAlpha, uStreak; varying vec2 vUv; varying float vA;
void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float e = length(vec2(p.x, p.y * mix(1.0, 0.9, uStreak)));
  float body = 1.0 - smoothstep(0.55, 1.0, e), core = 1.0 - smoothstep(0.0, 0.5, e);
  float fadeTail = mix(1.0, 0.45 + 0.55 * (p.y * 0.5 + 0.5), uStreak);
  vec3 col = mix(vec3(0.62, 0.8, 1.0), vec3(0.95, 0.98, 1.0), core);
  float a = body * fadeTail * uAlpha * vA;
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}`;
const RING_VS = `
uniform float uTime, uH, uSpeed, uSplash, uLife; uniform vec3 uBox, uSlant;
attribute vec4 aSeed; varying vec2 vUv; varying float vA;
void main() {
  vUv = uv;
  float sv = 0.8 + 0.4 * aSeed.w, Tf = uH / (uSpeed * sv), d = uSpeed * sv * uTime + aSeed.z * uH, c = mod(d, uH) / uH, age = c * Tf;
  float k = age / uLife;                                   // 0 at the landing, 1 when it is gone
  float live = (k < 1.0 ? 1.0 : 0.0) * step(0.001, uSplash);
  vec3 ctr = vec3((aSeed.x - 0.5) * uBox.x + uSlant.x * uH, 0.012, (aSeed.y - 0.5) * uBox.z + uSlant.z * uH);
  float r = (0.018 + 0.16 * sqrt(k)) * (0.6 + 0.6 * aSeed.w) * (0.5 + 0.5 * uSplash);
  vec3 lp = ctr + vec3(position.x * r, 0.0, -position.y * r) * live;
  vA = (1.0 - k) * (1.0 - k) * live * uSplash;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(lp, 1.0);
}`;
const RING_FS = `
varying vec2 vUv; varying float vA;
void main() {
  float e = length((vUv - 0.5) * 2.0);
  float ring = smoothstep(0.62, 0.84, e) * (1.0 - smoothstep(0.9, 1.0, e));
  gl_FragColor = vec4(0.82, 0.92, 1.0, ring * vA * 0.9);
  #include <colorspace_fragment>
}`;
const CROWN_VS = `
uniform float uTime, uH, uSpeed, uSplash, uLife; uniform vec3 uBox, uSlant;
attribute vec4 aSeed; attribute float aK; varying vec2 vUv; varying float vA;
void main() {
  vUv = uv;
  float sv = 0.8 + 0.4 * aSeed.w, Tf = uH / (uSpeed * sv), d = uSpeed * sv * uTime + aSeed.z * uH, c = mod(d, uH) / uH, age = c * Tf;
  float k = age / (uLife * 0.8), live = (k < 1.0 ? 1.0 : 0.0) * step(0.001, uSplash);
  float a = aK * 6.2831853 + aSeed.x * 6.28, rr = 0.07 * (0.5 + aSeed.w) * k * (0.5 + 0.5 * uSplash);
  vec3 ctr = vec3((aSeed.x - 0.5) * uBox.x + uSlant.x * uH, 0.012, (aSeed.y - 0.5) * uBox.z + uSlant.z * uH);
  vec3 wp = ctr + vec3(cos(a) * rr, 0.16 * (0.6 + 0.5 * aSeed.w) * 4.0 * k * (1.0 - k) * (0.5 + 0.5 * uSplash), sin(a) * rr);
  vec4 vp = viewMatrix * modelMatrix * vec4(wp, 1.0);
  vp.xy += position.xy * 0.011 * length(modelMatrix[0].xyz) * live;
  vA = live * uSplash * (1.0 - 0.6 * k);
  gl_Position = projectionMatrix * vp;
}`;
const CROWN_FS = `
varying vec2 vUv; varying float vA;
void main() { float e = length((vUv - 0.5) * 2.0); float a = (1.0 - smoothstep(0.55, 1.0, e)) * vA; gl_FragColor = vec4(0.9, 0.96, 1.0, a);
  #include <colorspace_fragment>
}`;
const SW_VS = `
uniform float uTime, uR, uH, uSwirl, uShare0, uShare1, uShare2;
attribute vec4 aSeed; attribute vec4 aKind;               // aKind: x kind 0 snow 1 leaf 2 rain, y rank 0..1, z cell, w size
varying vec2 vUv; varying float vA; varying float vCell;
void main() {
  float kind = aKind.x, share = kind < 0.5 ? uShare0 : (kind < 1.5 ? uShare1 : uShare2);
  float on = aKind.y < share ? 1.0 : 0.0;
  float vy = kind < 0.5 ? 1.1 : (kind < 1.5 ? 0.9 : 10.0);
  float y = mod(aSeed.z * uH - vy * (0.8 + 0.4 * aSeed.w) * uTime, uH);
  float ang = aSeed.x * 6.2831853 + uSwirl * (0.6 + 0.8 * aSeed.y) * uTime * (kind > 1.5 ? 0.5 : 1.0);
  float rr = uR * (0.12 + 0.88 * sqrt(aSeed.y)) * (1.0 + 0.06 * sin(uTime * 1.3 + aSeed.w * 20.0));
  vec3 c = vec3(cos(ang) * rr, y, sin(ang) * rr);
  vec4 vp = viewMatrix * modelMatrix * vec4(c, 1.0);
  float sc = length(modelMatrix[0].xyz), sz = aKind.w * sc;
  float spin = (aSeed.w * 6.28) + uTime * (kind < 0.5 ? 1.5 : 3.2) * (0.5 + aSeed.x);
  vec2 q = position.xy;
  if (kind > 1.5) { q = vec2(position.x * 0.07, position.y * 1.0); float tl = (y > -1.0 ? 1.0 : 1.0); vec3 vd = mat3(viewMatrix) * mat3(modelMatrix) * vec3(-sin(ang) * 0.4, -1.0, cos(ang) * 0.4); vec2 t2 = length(vd.xy) < 0.02 ? vec2(0.0, 1.0) : normalize(vd.xy); q = t2 * q.y + vec2(-t2.y, t2.x) * q.x; q *= 1.0; }
  else { float cs = cos(spin), sn = sin(spin); q = vec2(q.x * (kind > 0.5 ? cos(spin * 0.7) : 1.0), q.y); q = vec2(cs * q.x - sn * q.y, sn * q.x + cs * q.y); }
  vp.xy += q * sz;
  vUv = vec2((uv.x + aKind.z) / 4.0, uv.y); vCell = aKind.z;
  vA = on;
  gl_Position = projectionMatrix * vp;
}`;
const SW_FS = `
uniform sampler2D uMap; varying vec2 vUv; varying float vA; varying float vCell;
void main() { vec4 c = texture2D(uMap, vUv); if (c.a * vA < 0.02) discard; gl_FragColor = vec4(c.rgb, c.a * vA);
  #include <colorspace_fragment>
}`;

function instGeo(base, n, fill) {
  const g = new THREE.InstancedBufferGeometry(); g.copy(base); g.instanceCount = n; fill(g); return g;
}
const seedAttr = (n, seed) => { const a = new Float32Array(n * 4); for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) a[i * 4 + k] = hs(i + seed * 977, k + 40); return new THREE.InstancedBufferAttribute(a, 4); };

// ------------------------------------------------------------------------------------------------ the kinds
export const TIMEWATCH_KINDS = {
  pocketwatch(P) {
    const S = P.spec, g = P.whole, FLOOR = S.floor ?? -1.0, R = 0.0375, DOMEC = 0.0883, DOMER = 0.0993;
    const body = new THREE.Group(); g.add(body);
    const brass = brassMat(1), brassB = brassMat(5, { color: "#f4d27a" }), dark = darkM();
    // case shell (open at the back, hinged back plate behind it)
    const prof = [[0.0325, -0.011], [0.0355, -0.0105], [0.0372, -0.008], [R, -0.003], [R, 0.003], [0.0368, 0.0055], [0.0345, 0.0066], [0.0328, 0.0058], [0.0322, 0.0], [0.0322, -0.009]].map(([r, z]) => new THREE.Vector2(r, z));
    const shell = new THREE.LatheGeometry(prof, 56); shell.rotateX(Math.PI / 2);
    mesh(shell, brass, body);
    const bezel = mesh(new THREE.TorusGeometry(0.0337, 0.0014, 8, 56), brassB, body, 0, 0, 0.0068);
    mesh(new THREE.CylinderGeometry(0.0322, 0.0322, 0.002, 48).rotateX(Math.PI / 2), bas({ color: "#ffffff", map: movementTex(), roughness: 0.5, metalness: 0.2, emissive: "#3a2205", emissiveIntensity: 0.4 }), body, 0, 0, -0.007);
    const faceM = bas({ color: "#ffffff", map: faceTex(), roughness: 0.8 }), face = mesh(new THREE.CircleGeometry(0.0328, 56), faceM, body, 0, 0, 0.0012);
    // back plate: hinged at 6 o'clock, opens to 110 degrees
    const hinge = new THREE.Group(); hinge.position.set(0, -0.0345, -0.0102); body.add(hinge);
    const backM = bas({ color: "#ffffff", map: brassTex(9, true), metalness: 0.45, roughness: 0.32, emissive: "#4a2c06", emissiveIntensity: 0.5 });
    const back = mesh(new THREE.CylinderGeometry(0.0352, 0.0352, 0.0028, 48).rotateX(Math.PI / 2), backM, hinge, 0, 0.0345, 0);
    mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.004, 10).rotateX(Math.PI / 2), brass, hinge, 0, 0.0005, 0.0006);
    // hands: outer group flies in the burst, the pivot inside carries the hands turn
    const hands = [];
    const mkHand = (geo, z, name) => { const outer = new THREE.Group(), pivot = new THREE.Group(); outer.add(pivot); const m = mesh(geo, dark, pivot, 0, 0, 0); m.castShadow = false; outer.position.set(0, 0, z); body.add(outer); hands.push({ outer, pivot, name, x0: 0, y0: 0, z0: z }); return { outer, pivot }; };
    const hour = mkHand(handGeo(0.0185, 0.004, 0.0031, 0.0028), 0.0024, "hour"), minute = mkHand(handGeo(0.0285, 0.006, 0.0022, 0), 0.0032, "minute");
    const secM = bas({ color: "#b3262e", roughness: 0.5 }), secOuter = new THREE.Group(), secPivot = new THREE.Group(); secOuter.add(secPivot); secOuter.position.set(0, -0.0155, 0.0021); body.add(secOuter);
    mesh(handGeo(0.0072, 0.0016, 0.0009, 0), secM, secPivot).castShadow = false; hands.push({ outer: secOuter, pivot: secPivot, name: "sec", x0: 0, y0: -0.0155, z0: 0.0021 });
    mesh(new THREE.CylinderGeometry(0.0023, 0.0023, 0.0016, 14).rotateX(Math.PI / 2), brassB, body, 0, 0, 0.0043);
    // crown (12 ridges, turns with wind) and bow ring
    const crown = new THREE.Group(); crown.position.set(0, R + 0.0001, 0); body.add(crown);
    mesh(new THREE.CylinderGeometry(0.0055, 0.0065, 0.004, 14), brass, crown, 0, 0.002, 0);
    const knurl = new THREE.Group(); knurl.position.y = 0.0068; crown.add(knurl);
    mesh(new THREE.CylinderGeometry(0.0078, 0.0078, 0.0058, 24), dark, knurl);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r = mesh(new THREE.BoxGeometry(0.0034, 0.0064, 0.0024), brassB, knurl, Math.sin(a) * 0.0086, 0, Math.cos(a) * 0.0086); r.rotation.y = a; }
    mesh(new THREE.CylinderGeometry(0.0062, 0.0075, 0.0022, 16), brass, crown, 0, 0.0108, 0);
    const bow = mesh(new THREE.TorusGeometry(0.0088, 0.0018, 8, 24), brassB, body, 0, R + 0.0188, 0);
    // chain: hangs from the bow on the -x side
    const chain = new THREE.Group(); body.add(chain);
    addChain(chain, [[0, 0.0615, 0], [-0.012, 0.075, 0.004], [-0.035, 0.078, 0.01], [-0.06, 0.062, 0.012], [-0.075, 0.035, 0.01], [-0.078, 0, 0.006], [-0.072, -0.035, 0.002], [-0.055, -0.065, -0.002], [-0.035, -0.085, -0.004]].map(([x, y, z]) => new THREE.Vector3(x, y, z)), 0.22, brass);
    // glass dome (a cap of a sphere, 0.006 high over the bezel), its crack lines, and the glint
    const gm = glassMat(), dome = mesh(new THREE.SphereGeometry(DOMER, 40, 8, 0, Math.PI * 2, 0, Math.asin(0.034 / DOMER)).rotateX(Math.PI / 2).translate(0, 0, -DOMEC), gm, body); dome.castShadow = false; dome.renderOrder = 5;
    const domeZ = (x, y) => -DOMEC + Math.sqrt(Math.max(0, DOMER * DOMER - x * x - y * y));
    const crackLines = [[[0.0294, 0.017], [0.0225, 0.0118], [0.0165, 0.007], [0.009, 0.005], [0.002, -0.002], [-0.0075, -0.006], [-0.0145, -0.015]], [[0.0165, 0.007], [0.015, 0.015], [0.01, 0.0215], [0.007, 0.029]], [[0.009, 0.005], [0.0115, -0.004], [0.0105, -0.0135], [0.016, -0.0225], [0.019, -0.029]], [[0.002, -0.002], [-0.004, 0.0045], [-0.0125, 0.007], [-0.021, 0.016], [-0.029, 0.018]]];
    const windows = [[0, 0.55], [0.14, 0.8], [0.17, 0.95], [0.25, 1.0]];
    const crackM = flag(new THREE.MeshBasicMaterial({ color: "#f2f8ff", transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false })), crackD = flag(new THREE.MeshBasicMaterial({ color: "#40556a", transparent: true, opacity: 0.8, depthWrite: false }));
    const unit = new THREE.PlaneGeometry(1, 1).translate(0.5, 0, 0);
    const segs = [];
    crackLines.forEach((pl, li) => {
      const lens = pl.slice(1).map((p, i) => Math.hypot(p[0] - pl[i][0], p[1] - pl[i][1])), tot = lens.reduce((a, b) => a + b, 0); let acc = 0;
      lens.forEach((L, i) => {
        const [a, b] = [pl[i], pl[i + 1]], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), zc = domeZ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) + 0.0004;
        const s = { a, ang, L, c0: windows[li][0] + (windows[li][1] - windows[li][0]) * (acc / tot), c1: windows[li][0] + (windows[li][1] - windows[li][0]) * ((acc + L) / tot), parts: [] };
        for (const [m, w, dz] of [[crackD, 0.0026, 0], [crackM, 0.0011, 0.0001]]) { const o = mesh(unit, m, body, a[0], a[1], zc + dz); o.rotation.z = ang; o.castShadow = false; o.frustumCulled = false; o.renderOrder = 6; s.parts.push([o, w]); }
        segs.push(s); acc += L;
      });
    });
    const glintM = flag(new THREE.MeshBasicMaterial({ map: glintTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    const glint = ghost(mesh(new THREE.PlaneGeometry(0.02, 0.02), glintM, body, -0.0165, 0.0165, 0.0128), 8);
    // burst parts: 14 shards (rest on the glass), 10 gears and 5 springs (rest inside), the 3 hands
    const parts = [];
    const gearGeos = [gearGeo(14, 0.0125, 0.0105, 3), gearGeo(10, 0.0085, 0.0072, 0), gearGeo(18, 0.0165, 0.0142, 4)], springG = springGeo();
    const shardM = flag(new THREE.MeshStandardMaterial({ color: "#d9efff", transparent: true, opacity: 0.45, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false, emissive: "#7aa0c4", emissiveIntensity: 0.5 }));
    const addPart = (o, i, rest, kind) => { o.userData.steam = true; o.userData.solid = false; o.castShadow = false; parts.push({ o, i, kind, p0: new THREE.Vector3(...rest), r0: o.rotation.clone() }); };
    for (let i = 0; i < 14; i++) {
      const a = hs(i, 61) * Math.PI * 2, rr = 0.004 + 0.027 * Math.sqrt(hs(i, 62)), x = Math.cos(a) * rr, y = Math.sin(a) * rr, o = mesh(shardGeo(i), shardM, body, x, y, domeZ(x, y)); o.rotation.z = hs(i, 63) * 6.28; o.renderOrder = 6; addPart(o, i, [x, y, domeZ(x, y)], "shard");
    }
    for (let i = 0; i < 10; i++) {
      const gi = i % 3, a = hs(i, 71) * 6.28, rr = 0.004 + 0.016 * hs(i, 72), x = Math.cos(a) * rr, y = Math.sin(a) * rr, z = -0.0045 - 0.0012 * (i % 2), o = mesh(gearGeos[gi], i % 2 ? brass : brassB, body, x, y, z); o.visible = false; addPart(o, i + 20, [x, y, z], "gear");
    }
    for (let i = 0; i < 5; i++) { const a = hs(i, 81) * 6.28, x = Math.cos(a) * 0.012, y = Math.sin(a) * 0.012, o = mesh(springG, bas({ color: "#c6cdd6", metalness: 0.6, roughness: 0.35, emissive: "#202830", emissiveIntensity: 0.4 }), body, x, y, -0.0035); o.rotation.z = a; o.visible = false; addPart(o, i + 40, [x, y, -0.0035], "spring"); }
    hands.forEach((h, i) => addPart(h.outer, i + 60, [h.outer.position.x, h.outer.position.y, h.outer.position.z], "hand"));
    for (const p of parts) {
      const i = p.i, d = new THREE.Vector3(p.p0.x + (hs(i, 91) - 0.5) * 0.03, p.p0.y + (hs(i, 92) - 0.5) * 0.03, (p.kind === "shard" ? 0.7 : p.kind === "hand" ? 0.4 : 0.25) + (hs(i, 93) - 0.5) * 1.2);
      d.normalize(); p.dir = d;
      p.vy = 0.9 + 1.5 * hs(i, 94); p.reach = 0.22 + 0.38 * hs(i, 95);
      const y0 = p.p0.y + 0.0, fall = Math.max(0, y0 - FLOOR);
      p.tl = (p.vy + Math.sqrt(p.vy * p.vy + 19.6 * fall)) / 9.8;
      const hz = Math.hypot(d.x, d.z) || 1; p.hv = (p.reach / p.tl) / hz;
      p.w = new THREE.Vector3((hs(i, 96) - 0.5) * 16, (hs(i, 97) - 0.5) * 16, (hs(i, 98) - 0.5) * 16);
    }
    return {
      grip: 0,
      apply(ps, t) {
        const T = t ?? 0, hd = ps.hands ?? S.hands ?? 0, cr = clamp(ps.crack), wd = ps.wind ?? S.wind ?? 0, sh = clamp(ps.shake ?? S.shake ?? 0), gl = clamp(ps.glint ?? S.glint ?? 0), b = clamp(ps.burst);
        minute.pivot.rotation.z = -(60 * D2R + hd * Math.PI * 2); hour.pivot.rotation.z = -(300 * D2R + hd * Math.PI * 2 / 12); secPivot.rotation.z = -hd * Math.PI * 24;
        knurl.rotation.y = -wd * D2R;
        body.position.set(sh * 0.0014 * Math.sin(T * 83.1), sh * 0.0011 * Math.sin(T * 71.7 + 1.3), 0); body.rotation.z = sh * 0.045 * Math.sin(T * 61.3 + 0.7); body.rotation.x = sh * 0.03 * Math.sin(T * 47.9);
        for (const s of segs) {
          const v = clamp((cr - s.c0) / (s.c1 - s.c0)) * (b > 0 ? 0 : 1);
          for (const [o, w] of s.parts) { o.visible = v > 0.001; o.scale.set(Math.max(1e-4, s.L * v), w, 1); }
        }
        dome.visible = b <= 0.0001; glint.visible = gl > 0.01 && b < 0.05; glint.material.opacity = gl; glint.scale.setScalar(0.4 + 0.5 * gl);
        hinge.rotation.x = -(110 * D2R) * smooth(0, 0.15, b) * (1 + 0.06 * Math.sin(smooth(0.1, 0.2, b) * 3.14));
        const u = clamp((b - 0.15) / 0.85), tau = u * 1.0, pop = smooth(0, 0.15, b);
        for (const p of parts) {
          const o = p.o, isShard = p.kind === "shard";
          if (p.kind === "gear" || p.kind === "spring") o.visible = b > 0.02;
          if (isShard) o.visible = b > 0.0001;
          if (b <= 0.0001 && p.kind !== "hand") { o.position.copy(p.p0); o.rotation.copy(p.r0); continue; }
          if (b <= 0.0001) { o.position.copy(p.p0); o.rotation.set(0, 0, 0); continue; }
          const pop0 = isShard ? 0.012 * pop : 0, tt = Math.min(tau, p.tl);
          const x = p.p0.x + p.dir.x * pop0 + p.dir.x * p.hv * tt, z = p.p0.z + p.dir.z * pop0 * 1.2 + p.dir.z * p.hv * tt, y0 = p.p0.y + p.dir.y * pop0;
          const y = Math.max(FLOOR + 0.002, y0 + p.vy * tt - 4.9 * tt * tt);
          o.position.set(x, y, z);
          if (p.kind === "hand") { o.rotation.set(p.w.x * tt * 0.5, p.w.y * tt * 0.5, p.w.z * tt); } else o.rotation.set(p.r0.x + p.w.x * tt, p.r0.y + p.w.y * tt, p.r0.z + p.w.z * tt);
        }
      },
    };
  },

  watchwreck(P) {
    const g = P.whole, brass = brassMat(3), brassB = brassMat(6, { color: "#f4d27a" }), glass = glassMat(), steel = bas({ color: "#c6cdd6", metalness: 0.6, roughness: 0.35, emissive: "#202830", emissiveIntensity: 0.4 });
    const Y = 0.006, pr = [[0.0325, -0.011], [0.0355, -0.0105], [0.0372, -0.008], [0.0375, -0.003], [0.0375, 0.003], [0.0368, 0.0055], [0.0345, 0.0066], [0.0328, 0.0058], [0.0322, 0.0], [0.0322, -0.009]].map(([r, z]) => new THREE.Vector2(r, z));
    // the case: the front half lies on its back-open side, tilted, the back leaf swung open beside it like a clam
    const shell = new THREE.LatheGeometry(pr, 40); shell.rotateX(Math.PI / 2);
    const cs = new THREE.Group(); cs.position.set(-0.02, 0.014, 0.01); cs.rotation.set(-1.2, 0.2, 0.5); g.add(cs);
    mesh(shell, brass, cs); mesh(new THREE.CircleGeometry(0.0328, 40), bas({ color: "#ffffff", map: faceTex(), roughness: 0.8 }), cs, 0, 0, 0.0012);
    mesh(new THREE.TorusGeometry(0.0337, 0.0014, 8, 40), brassB, cs, 0, 0, 0.0068);
    const crown = mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.009, 14), brassB, cs, 0, 0.041, 0);
    const leaf = new THREE.Group(); leaf.position.set(0.058, 0.007, 0.03); leaf.rotation.set(-1.45, 0.0, -0.55); g.add(leaf);
    mesh(new THREE.CylinderGeometry(0.0352, 0.0352, 0.0028, 40).rotateX(Math.PI / 2), bas({ color: "#ffffff", map: brassTex(9, true), metalness: 0.45, roughness: 0.32, emissive: "#4a2c06", emissiveIntensity: 0.5 }), leaf);
    // bent chain: a squiggle on the ground
    const chain = new THREE.Group(); g.add(chain);
    addChain(chain, [[-0.19, Y, -0.1], [-0.14, Y + 0.002, -0.14], [-0.09, Y, -0.1], [-0.07, Y + 0.003, -0.15], [-0.02, Y, -0.17], [0.05, Y + 0.002, -0.13], [0.09, Y, -0.17], [0.15, Y + 0.002, -0.12]].map(([x, y, z]) => new THREE.Vector3(x, y, z)), 0.3, brass);
    // gears, springs, shards scattered inside a 0.35 circle
    const gg = [gearGeo(18, 0.0165, 0.0142, 4), gearGeo(14, 0.0125, 0.0105, 3), gearGeo(10, 0.0085, 0.0072, 0)];
    [[0.12, 0.05, 0], [0.2, -0.06, 1], [-0.16, 0.12, 2], [0.04, 0.17, 1], [-0.07, -0.05, 2], [0.15, 0.16, 0]].forEach(([x, z, gi], i) => {
      const o = mesh(gg[gi], i % 2 ? brass : brassB, g, x * 0.9, Y + 0.001 + 0.002 * (i % 3), z * 0.9); o.rotation.set(-Math.PI / 2 + (hs(i, 3) - 0.5) * 0.3, 0, hs(i, 4) * 6.28);
    });
    const sg = springGeo(6, 0.0045, 0.026);
    [[-0.12, -0.03], [0.07, -0.1], [-0.04, 0.2]].forEach(([x, z], i) => { const o = mesh(sg, steel, g, x, Y + 0.004, z); o.rotation.y = hs(i, 5) * 6.28; o.rotation.z = (hs(i, 6) - 0.5) * 0.3; });
    for (let i = 0; i < 8; i++) { const a = hs(i, 11) * 6.28, r = 0.04 + 0.24 * Math.sqrt(hs(i, 12)), o = mesh(shardGeo(i + 100, 0.014), glass, g, Math.cos(a) * r, Y, Math.sin(a) * r); o.rotation.x = -Math.PI / 2 + (hs(i, 13) - 0.5) * 0.4; o.rotation.z = hs(i, 14) * 6.28; o.renderOrder = 4; }
    ghostAll(g);
    return { grip: 0, apply() {} };
  },

  rainbox(P) {
    const S = P.spec, [W, H, D] = S.box || [8, 6, 8], n = S.n ?? 1500, speed = S.speed ?? 9, sl = S.slant || [0.08, 0], alpha = S.alpha ?? 0.55, seed = S.seed ?? 0;
    const U = { uTime: { value: 0 }, uH: { value: H }, uSpeed: { value: speed }, uStreak: { value: 1 }, uLen: { value: 0.34 }, uWidth: { value: 0.012 }, uAlpha: { value: alpha }, uBox: { value: new THREE.Vector3(W, H, D) }, uSlant: { value: new THREE.Vector3(sl[0], 0, sl[1]) }, uSplash: { value: 0 }, uLife: { value: 0.28 } };
    const mk = (vs, fs) => flag(new THREE.ShaderMaterial({ uniforms: U, vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide }));
    const sd = seedAttr(n, seed), quad = new THREE.PlaneGeometry(1, 1);
    const drops = ghost(new THREE.Mesh(instGeo(quad, n, (ig) => ig.setAttribute("aSeed", sd)), mk(RAIN_VS, RAIN_FS)), 4); P.whole.add(drops);
    const ns = Math.min(n, 600), ringG = new THREE.PlaneGeometry(2, 2);
    const rings = ghost(new THREE.Mesh(instGeo(ringG, ns, (ig) => ig.setAttribute("aSeed", seedAttr(ns, seed))), mk(RING_VS, RING_FS)), 3); P.whole.add(rings);
    const crownN = ns * 3, ck = new Float32Array(crownN), cs = new Float32Array(crownN * 4);
    for (let i = 0; i < crownN; i++) { const s = Math.floor(i / 3); ck[i] = (i % 3) / 3; for (let k = 0; k < 4; k++) cs[i * 4 + k] = sd.array[s * 4 + k]; }
    const crown = ghost(new THREE.Mesh(instGeo(quad, crownN, (ig) => { ig.setAttribute("aSeed", new THREE.InstancedBufferAttribute(cs, 4)); ig.setAttribute("aK", new THREE.InstancedBufferAttribute(ck, 1)); }), mk(CROWN_VS, CROWN_FS)), 5); P.whole.add(crown);
    return {
      grip: 0,
      apply(ps, t) {
        U.uTime.value = timeOf(ps, S, t); U.uStreak.value = clamp(ps.streak ?? S.streak ?? 1); U.uSplash.value = clamp(ps.splash);
        U.uWidth.value = 0.012 + 0.014 * (1 - U.uStreak.value);
        rings.visible = crown.visible = U.uSplash.value > 0.001;
      },
    };
  },

  seasonswirl(P) {
    const S = P.spec, R = S.r ?? 6, H = S.h ?? 8, n = S.n ?? 600, sw = S.swirl ?? 1.5;
    const atlas = tex(cvs(1024, 256, (g) => {
      const C = 256;
      // cell 0: a snowflake, six arms with side twigs, blue-grey outline so it holds on a white track
      g.save(); g.translate(128, 128); g.lineCap = "round";
      for (const [col, lw] of [["#6f8fbf", 20], ["#f4f9ff", 11]]) { g.strokeStyle = col; g.lineWidth = lw; for (let a = 0; a < 6; a++) { g.save(); g.rotate((a * Math.PI) / 3); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -100); g.moveTo(0, -48); g.lineTo(-26, -72); g.moveTo(0, -48); g.lineTo(26, -72); g.moveTo(0, -78); g.lineTo(-14, -92); g.moveTo(0, -78); g.lineTo(14, -92); g.stroke(); g.restore(); } }
      g.restore();
      // cells 1 and 2: an autumn leaf (pointed lobes, a stem and veins), orange and red; each drawn once
      [["#e8751a", "#f2a23a", 1], ["#c4301c", "#e86a2c", 2]].forEach(([c0, c1, cell]) => {
        g.save(); g.translate(C * cell + 128, 134);
        const gr = g.createLinearGradient(-60, -90, 60, 90); gr.addColorStop(0, c1); gr.addColorStop(1, c0); g.fillStyle = gr; g.strokeStyle = "#4a1a08"; g.lineWidth = 6; g.lineJoin = "round";
        g.beginPath(); const lob = [[0, -104], [26, -62], [64, -70], [46, -26], [84, -6], [38, 18], [46, 62], [10, 44], [0, 86], [-10, 44], [-46, 62], [-38, 18], [-84, -6], [-46, -26], [-64, -70], [-26, -62]];
        lob.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); g.stroke();
        g.strokeStyle = "rgba(80,24,8,0.8)"; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -90); g.lineTo(0, 110); for (const [x, y] of [[-44, -36], [44, -36], [-34, 6], [34, 6]]) { g.moveTo(0, y > -10 ? 30 : -6); g.lineTo(x, y); } g.stroke();
        g.restore();
      });
      // cell 3: a rain streak, pale blue with a bright core
      const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(190,220,255,0)"); gr.addColorStop(0.5, "rgba(214,236,255,1)"); gr.addColorStop(1, "rgba(190,220,255,0)");
      g.fillStyle = gr; g.fillRect(C * 3 + 112, 0, 32, 256);
    }));
    const kinds = new Float32Array(n * 4), per = Math.floor(n / 3);
    for (let i = 0; i < n; i++) {
      const kind = Math.min(2, Math.floor(i / per)), j = i - kind * per;
      kinds[i * 4] = kind; kinds[i * 4 + 1] = (j + 0.5) / per; kinds[i * 4 + 2] = kind === 1 ? 1 + (hs(i, 5) > 0.5 ? 1 : 0) : kind === 0 ? 0 : 3; kinds[i * 4 + 3] = kind === 0 ? 0.13 + 0.12 * hs(i, 6) : kind === 1 ? 0.3 + 0.2 * hs(i, 7) : 0.9 + 0.5 * hs(i, 8);
    }
    const U = { uTime: { value: 0 }, uR: { value: R }, uH: { value: H }, uSwirl: { value: sw }, uShare0: { value: 1 }, uShare1: { value: 1 }, uShare2: { value: 1 }, uMap: { value: atlas } };
    const m = flag(new THREE.ShaderMaterial({ uniforms: U, vertexShader: SW_VS, fragmentShader: SW_FS, transparent: true, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide }));
    const seeds = seedAttr(n, S.seed ?? 3), o = ghost(new THREE.Mesh(instGeo(new THREE.PlaneGeometry(1, 1), n, (ig) => { ig.setAttribute("aSeed", seeds); ig.setAttribute("aKind", new THREE.InstancedBufferAttribute(kinds, 4)); }), m), 5); P.whole.add(o);
    return {
      grip: 0,
      apply(ps, t) {
        U.uTime.value = timeOf(ps, S, t);
        U.uShare0.value = clamp(ps.snow ?? S.snow ?? 1); U.uShare1.value = clamp(ps.leaves ?? S.leaves ?? 1); U.uShare2.value = clamp(ps.rain ?? S.rain ?? 1);
      },
    };
  },

  goldmedal(P) {
    const S = P.spec, g = P.whole, BR = S.r ?? 0.36, surf = (x, y) => Math.sqrt(Math.max(0.0004, BR * BR - x * x - y * y)) - BR;
    const rib = bas({ color: "#ffffff", roughness: 0.75, side: THREE.DoubleSide, map: tex(cvs(96, 64, (c, w, h) => {
      const cols = ["#b8222e", "#b8222e", "#f1efe8", "#f1efe8", "#2a4a9a", "#2a4a9a"]; cols.forEach((col, i) => { c.fillStyle = col; c.fillRect((i * w) / 6, 0, w / 6 + 1, h); });
      c.strokeStyle = "rgba(60,30,20,0.55)"; c.lineWidth = 3; c.strokeRect(1.5, 0, w - 3, h);
      for (let i = 0; i < 90; i++) { c.strokeStyle = hs(i, 4) > 0.5 ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"; c.lineWidth = 1; const x = hs(i, 5) * w, y = hs(i, 6) * h; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 3, y + 8 + hs(i, 7) * 10); c.stroke(); }
    })) });
    // two arms of the V, each a band of 12 segments lying on the ball, from (+-0.13, 0.02) down to the disc's bail (0, -0.2)
    for (const sx of [-1, 1]) {
      const N = 12, pos = [], uv = [], idx = [], bw = 0.019;
      const pt = (f) => { const x = sx * (0.13 * (1 - f) + 0.004), y = 0.02 - 0.22 * f; return [x + sx * 0.012 * Math.sin(f * Math.PI) * 0, y]; };
      for (let i = 0; i <= N; i++) {
        const f = i / N, [x, y] = pt(f), [x2, y2] = pt(Math.min(1, f + 0.02)), [x1, y1] = pt(Math.max(0, f - 0.02)), tx = x2 - x1, ty = y2 - y1, l = Math.hypot(tx, ty) || 1, nx = -ty / l, ny = tx / l;
        for (const s of [-1, 1]) { const px = x + nx * bw * s, py = y + ny * bw * s; pos.push(px, py, surf(px, py) + 0.006); uv.push(s < 0 ? 0 : 1, f * 4); }
        if (i < N) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      g.add(new THREE.Mesh(geo, rib));
    }
    const bailY = -0.2, bailZ = surf(0, bailY) + 0.012, pivot = new THREE.Group(); pivot.position.set(0, bailY, bailZ); g.add(pivot);
    const tilt = Math.asin(clamp(-bailY / BR, 0, 0.95)); pivot.rotation.x = tilt;
    const goldM = bas({ color: "#ffffff", map: brassTex(11), metalness: 0.5, roughness: 0.28, emissive: "#6a4208", emissiveIntensity: 0.6 });
    const face = tex(cvs(256, 256, (c, w, h) => {
      const gr = c.createRadialGradient(100, 100, 10, 128, 128, 128); gr.addColorStop(0, "#fbe08a"); gr.addColorStop(0.7, "#e2ac3e"); gr.addColorStop(1, "#b9801f"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.strokeStyle = "#8a5a14"; c.lineWidth = 6; c.beginPath(); c.arc(128, 128, 120, 0, Math.PI * 2); c.stroke();
      for (let k = 0; k < 2; k++) for (let i = 0; i < 12; i++) {   // the laurel: two branches of 12 leaves from the bottom up round both sides
        const a = Math.PI / 2 + (k ? -1 : 1) * (0.2 + (i / 12) * 2.5), r = 88 + (hs(i, k + 3) - 0.5) * 6, x = 128 + Math.cos(a) * r, y = 128 + Math.sin(a) * r;
        c.save(); c.translate(x, y); c.rotate(a + (k ? 1 : -1) * 1.2 + Math.PI / 2 * 0); c.fillStyle = i % 2 ? "#f6d56e" : "#cf9830"; c.strokeStyle = "#8a5a14"; c.lineWidth = 3;
        c.beginPath(); c.ellipse(0, 0, 9, 21, 0, 0, Math.PI * 2); c.fill(); c.stroke(); c.restore();
      }
      c.fillStyle = "#f6d56e"; c.strokeStyle = "#8a5a14"; c.lineWidth = 4; c.beginPath();   // a five-point star in the middle
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 24 : 54; c.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke();
    }));
    const disc = mesh(new THREE.CylinderGeometry(0.0375, 0.0375, 0.007, 40).rotateX(Math.PI / 2), goldM, pivot, 0, -0.0425, 0);
    const front = mesh(new THREE.CircleGeometry(0.0352, 40), bas({ color: "#ffffff", map: face, metalness: 0.4, roughness: 0.3, emissive: "#6a4208", emissiveIntensity: 0.5, bumpMap: face, bumpScale: 1.5 }), pivot, 0, -0.0425, 0.0036);
    mesh(new THREE.TorusGeometry(0.0365, 0.0026, 8, 40), goldM, pivot, 0, -0.0425, 0.0034);
    mesh(new THREE.TorusGeometry(0.0055, 0.0014, 8, 14), goldM, pivot, 0, -0.0035, 0);
    ghostAll(g);
    return {
      grip: 0,
      apply(ps, t) { const sw = clamp(ps.swing ?? S.swing ?? 0); pivot.rotation.z = sw * 0.38 * Math.sin((t ?? 0) * 6.3); },
    };
  },
};
