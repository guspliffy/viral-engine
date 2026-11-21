import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp } from "./util.js";

// props-gravstrike.js: fact what-if 02 "What if gravity got stronger every five seconds?" v2 (20 Nov 2026): satellites and the
// space station burning in at 30 g, the three city strikes and the cracking window glass. Design: storyboards/series/facts/
// 02-gravity/DESIGN-v2.md "Rendering and continuity" and section B. Panels P3 (entry) and P4 (strike + cracked glass).
// World metres, y up, window looks toward -z (room window plane z -2.65, city ground y -60). Place every kind at x 0, y 0,
// z 0, rot 0, scale 1. All look-only (not solid, no shadow, steam, no ink line), every material unlit or self-banded, every
// frame a pure function of `t` (seed 26031, no Math.random, no clock): any frame in any order gives the same picture.
// Needs the storyboard key "far": 6000. Registry (already in props3d.js): GRAVSTRIKE_KINDS.
//
// ONE PARAM: `t` = clip seconds, default -1 (before everything: nothing drawn). Tween it with the clip clock:
//   c.prop(0, id, { t: 0 }, 0, "linear"); c.prop(0, id, { t: 64 }, 64, "linear");   (seed it at 0 so it never jumps)
// Every DESIGN track P(a,b) = clamp((t-a)/(b-a)) lives in the table TAB below with the design's absolute times.
//
//   gentry   satellite entry. Draws only while 33 <= t < 38.6. 29 streaks (26 minor + the 3 impactors) and the station.
//            Minor streaks: 8 at 33.00+.07i, 12 at 33.55+.13i, 6 at 35.10+.18i; life .65-1.45 s; heads 2-9 m, envelope 7-28 m,
//            trails 90-430 m x 4-20 m wide at the head, depth z -850..-2200, az -12..+29 deg, el 13..32 deg, 280-880 m travel,
//            25-39 deg below the screen horizontal, down-left (as seen from spec.cam). Impactors start 34.30 / 34.82 / 35.87 and
//            end exactly at the strike points at 36.00 / 36.36 / 37.22 (path from strike + (260,300,-450) x 1 / .83 / 1.15), head
//            22 / 15 / 17 m at contact, bright through the contact frame. Palette: core #FFF4CF, band #FFD083, outer #F77F3D, ember #AE4B39.
//            Each streak = 3 additive tapered ribbons (glow, band, white core) + 3 head quads (halo, glow, white core) + 10 ember sparks;
//            each minor streak also flies with 2 smaller parallel fragment streaks (the sky fills up: the design's 26 minor lifetimes are
//            short, only 8-12 are alive at once).
//            The station: body 31 x 12 x 11 (nose toward travel), 4 panel assemblies 53 x 11 x .4 (span 128, grid 3.2 m, #374A6D / #91A0B6,
//            hull #B5BBC1, exposed #FFD491), core path (330,345,-790) -> (112,190,-630) -> (-275,29,-590) over 33.13-35.45 (quadratic
//            through the 3 keys), roll -18 / +23 / +112 deg about the travel axis, wing A leaves at stationAge .34 (21 m at .5), wing B at
//            .62, 12 pieces fly off (4 + 4 + 4 hull pieces; offset 0 / 18-45 / 45-110 m, roll 0 / 65 / 145 deg, trail 0 / 120 / 35 m,
//            alpha 0 / .86 / 0), plasma trail up to 520 m x 47 m, 6 ember quads. The plasma glow sits behind the station so the nose
//            and panels keep their silhouette.
//            spec: cam { pos, look } (default the P3 camera [.34,1.18,.94] -> [.55,2.34,-8]: it fixes the screen slope of the streaks
//                  and the station's facing), stationScale 1.6 (multiplies the station's size; 1 = the design's 128 m span), glow 1.7
//                  (multiplies head glows and trail widths; the design numbers read small at 1500 m. Screen-size floors keep a head
//                  glow >= ~30 px and a spark >= ~6 px tall at 1080 x 1920).
//   gstrike  the 3 strikes (36.00 (-22,-60,-335), 36.36 (102,-60,-585), 37.22 (-175,-60,-820)). Everything above the ground:
//            flash (diameter 4 / D / .45D over .20 s, D 104 / 72 / 86 m, core #FFF8EB, fringe #FFD29B) with two flares; fire billows
//            (fireball 22 / 15 / 17 m growing and cooling #FFF1B4 > #FFAB52 > #D95831); the smoke column over 1.6 s (height 3 / 58 / 115 m,
//            radius 4 / 18 / 30 m, opacity .1 / .82 / .64, base #74585A, rim #DAB2A1; the other two scaled by D/104; it holds, leans
//            +x and thins a little 38-46 s); ejecta 64 / 40 / 44 pieces (12/8/8 blocks .4-2.2 m + stones .18-.8 m, radial d 20-95 m,
//            arc 4h e(1-e) with h 14-62 m, roll 0 / 100 / 200 deg over 2.0 s, they stay as rubble) with hot glows; the ground ring over
//            2.4 s (radius = v x time, v 338 / 325 / 335, 32 ground-facing segments, width 4 / 12 / 24 m, alpha .94 / .66 / 0, #F2D1B8 /
//            #916C67) with a dust wall of 32 upright puffs on the ring and 18 upright sprays; fire beds (6 glows each) that stay lit.
//            Clipped for the room: ring pieces nearer than z -4 are dropped and smoke quads fade out between 30 and 140 m from the camera. Everything is hidden at spec.endAt.
//            spec: from [.34,1.30,-.02] (the camera, for the painter's order and the near fade), debrisScale 2.2 (multiplies the
//                  rubble: the design's .18-2.2 m pieces are 1-8 px at 335 m), endAt 56 (s, hides the prop; the wave erase starts then),
//                  size 1 (multiplies the flash, fire, column and wall; the design numbers are size 1).
//   gglass   the crack overlay on the room glass (plane z -2.64, opening x -1.95..1.95, y .09..3.43, UV bottom-left origin). Starts
//            (.78,.61) (.14,.78) (.13,.19), 5 rays each toward the nearest one or two frame edges (3-5 angular segments, clipped at the
//            opening), the two links (.78,.61)>(.56,.70)>(.42,.66) and (.13,.19)>(.29,.33)>(.42,.28), 12 side branches .12-.38 m.
//            glassCrack = P(37.01, 37.36): rays and links 0 / 60 / 100 % of their length, branches 0 / 3 / 12, core width 0 / .0013 / .0025 m
//            (x spec.crackW, default 3.2: the design's 2.5 mm strokes are 1-2 px on the phone), core #493D46, rim #E9DBCF on the key (upper-left) side. Holds at 1 until spec.breakAt
//            (default 59.287, the room-hit shards replace the pane); hidden before 37.01. Extra: the P4 camera sees only x -.66..1.04 of the 3.9 m opening, so
//            two extra starts (spec.extraStarts, default (.58,.42) and (.38,.72); [] gives the design's three only) put 10 more rays across
//            the visible glass, and every ray forks 2 fine twigs (.05-.12 m) once it is mostly drawn. The frame, jambs and mullions are the SET's:
//            the plane sits inside their depth (z -2.64 vs front faces at -2.6175) so the depth test clips the cracks at them
//            (the design lists mullions at x +-1.08; the set's are at -1.69 / -.48 / .94 / 1.69, the depth test follows whichever the set has).
//   Bench: storyboards/series/facts/02-gravity/bench/make-strike-bench.mjs (no intact city behind: by 33 g it is rubble; the bench has the
//   ground and the horizon only, so the flash and the column are not hidden by buildings the gruin builder will have flattened).
// Budget: one draw call per family (ribbons, additive quads, smoke quads, ring band, 2 instanced rubble, cracks) plus 12 station pieces; about 8000
// ribbon vertices, <= 400 additive quads, <= 360 smoke quads, 148 rubble instances per frame, all buffers updated in place.

const SEED = 26031, TAU = Math.PI * 2, DEG = Math.PI / 180, GY = -60;
const TAB = {
  entry: [33, 38], station: [33.13, 35.45],
  minor: [[33.0, 0.07, 8], [33.55, 0.13, 12], [35.1, 0.18, 6]],   // start, step, count
  impactT0: [34.3, 34.82, 35.87], impactOff: [260, 300, -450], impactScale: [1, 0.83, 1.15], impactTrail: [380, 260, 300],
  life: [0.65, 1.45],
  stPath: [[330, 345, -790], [112, 190, -630], [-275, 29, -590]], stRoll: [-18, 23, 112], wingAt: [0.34, 0.62], wingA21: 21,
  plasmaLen: 520, plasmaDia: 47,
  strikes: [
    { T: 36.0, at: [-22, GY, -335], fire: 22, flash: 104, debris: 64, blocks: 12, v: 338 },
    { T: 36.36, at: [102, GY, -585], fire: 15, flash: 72, debris: 40, blocks: 8, v: 325 },
    { T: 37.22, at: [-175, GY, -820], fire: 17, flash: 86, debris: 44, blocks: 8, v: 335 },
  ],
  flash: 0.2, column: 1.6, eject: 2.0, ring: 2.4,
  glass: [37.01, 37.36], breakAt: 59.287,
};
const P3CAM = { pos: [0.34, 1.18, 0.94], look: [0.55, 2.34, -8] };
const P4CAM = [0.34, 1.3, -0.02];
const lerp = (a, b, k) => a + (b - a) * k;
const P = (a, b, t) => clamp((t - a) / (b - a));
const k3 = (a, b, c, u) => (u < 0.5 ? lerp(a, b, u * 2) : lerp(b, c, (u - 0.5) * 2));
const q3 = (a, b, c, x) => a * 2 * (x - 0.5) * (x - 1) + b * -4 * x * (x - 1) + c * 2 * x * (x - 0.5);   // quadratic through (0,a) (.5,b) (1,c)
const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const fr = (x) => x - Math.floor(x);
function rngOf(seed) { let s = (seed >>> 0) || 1; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mix3 = (o, a, b, k) => { o[0] = a[0] + (b[0] - a[0]) * k; o[1] = a[1] + (b[1] - a[1]) * k; o[2] = a[2] + (b[2] - a[2]) * k; return o; };
const dirOf = (az, el) => new THREE.Vector3(Math.sin(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), -Math.cos(az * DEG) * Math.cos(el * DEG));
function lookOnly(me, order) { me.castShadow = me.receiveShadow = false; me.frustumCulled = false; me.userData.solid = false; me.userData.lookOnly = true; me.userData.steam = true; if (order != null) me.renderOrder = order; return me; }
const noLine = (m) => { m.userData.noOutline = true; m.userData.noHatch = true; return m; };
const memo = new Map(), once = (k, make) => { if (!memo.has(k)) memo.set(k, make()); return memo.get(k); };
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }

const C_CORE = lin("#FFF4CF"), C_BAND = lin("#FFD083"), C_OUT = lin("#F77F3D"), C_EMB = lin("#AE4B39");
const C_FLASH_CORE = lin("#FFF8EB"), C_FLASH_FR = lin("#FFD29B");
const FIRE = [lin("#FFF1B4"), lin("#FFAB52"), lin("#D95831"), lin("#5A2A2C")];
const SMOKE_DARK = lin("#5E464A"), SMOKE_RIM = lin("#DAB2A1"), DUST_LIT = lin("#F2D1B8"), DUST_DARK = lin("#916C67");
const tmpA = [0, 0, 0], tmpB = [0, 0, 0];

// ============================================================================================================== puff atlas
// 2 x 2 atlas of premultiplied-style three-lobe billows (DESIGN: 64 x 64 sprites; 128 here): R = light (upper left lit), G = alpha. Opaque
// canvas so the texels never darken at the edges; the shader reads R and G.
function puffAtlas() {
  return once("puffAtlas", () => {
    const N = 128, W = N * 2, [c, g] = canvas(W, W), img = g.createImageData(W, W), d = img.data;
    for (let v = 0; v < 4; v++) {
      const R = rngOf(SEED + 900 + v * 13), lobes = [];
      for (let k = 0; k < 3; k++) lobes.push([0.5 + (k - 1) * 0.2 + (R() - 0.5) * 0.08, 0.52 + (R() - 0.5) * 0.14 - (k === 1 ? 0.08 : 0), 0.26 + R() * 0.07, R() * TAU]);
      lobes.push([0.5 + (R() - 0.5) * 0.12, 0.42 + R() * 0.06, 0.2, R() * TAU]);
      const ox = (v % 2) * N, oy = Math.floor(v / 2) * N;
      for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
        const x = (px + 0.5) / N, y = 1 - (py + 0.5) / N;   // y up (canvas top = uv v 1)
        let dens = 0, best = 0, nx = 0, ny = 0;
        for (const [cx, cy, r, ph] of lobes) {
          const dx = (x - cx) / r, dy = (y - cy) / r, ang = Math.atan2(dy, dx), rr = Math.hypot(dx, dy) / (1 + 0.14 * Math.sin(ang * 3 + ph) + 0.07 * Math.sin(ang * 7 + ph * 2));
          const val = clamp((1 - rr) / 0.7); const s = val * val * (3 - 2 * val);
          dens = 1 - (1 - dens) * (1 - s);
          if (s > best) { best = s; nx = dx; ny = dy; }
        }
        const nl = Math.hypot(nx, ny) || 1, lit = clamp(0.5 + 0.5 * ((nx / nl) * -0.55 + (ny / nl) * 0.83) * clamp(nl * 1.2)) * (0.78 + 0.22 * y) + 0.12 * (1 - clamp(nl * 1.5));
        const i = ((oy + py) * W + ox + px) * 4; d[i] = Math.min(255, lit * 255); d[i + 1] = clamp(dens) * 255; d[i + 2] = 255; d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 2; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t;
  });
}

// ============================================================================================================== billboard quads
// One instanced draw: aC centre, aS size (w, h m), aR roll, aA alpha, aD / aL two colours (linear), aP (profile, min size as a fraction of the
// screen height). Profiles 0-3: textured puff variant (aD dark > aL lit by the texture's R, alpha G); 10 radial glow (aD core, aL fringe);
// 11 flare (a stretched quad). Additive material: rgb x alpha added; normal material: straight alpha.
const BB_VS = `attribute vec3 aC; attribute vec2 aS; attribute float aR; attribute float aA; attribute vec3 aD; attribute vec3 aL; attribute vec2 aP;
uniform vec2 uFade; varying vec2 vUv; varying float vA; varying vec3 vD; varying vec3 vL; varying float vP;
void main(){
  vec4 mv = modelViewMatrix * vec4(aC, 1.0);
  float d = max(-mv.z, 0.05);
  vec2 s = aS; float m = max(s.x, s.y); float minW = aP.y * 2.0 * d / projectionMatrix[1][1];
  if (m < minW) s *= minW / max(m, 0.0001);
  float c = cos(aR), sn = sin(aR); vec2 q = position.xy * s; q = vec2(c * q.x - sn * q.y, sn * q.x + c * q.y);
  mv.xy += q;
  vUv = position.xy + 0.5; vA = aA * smoothstep(uFade.x, uFade.y, d); vD = aD; vL = aL; vP = aP.x;
  gl_Position = projectionMatrix * mv;
}`;
const BB_FS = `uniform sampler2D uMap; varying vec2 vUv; varying float vA; varying vec3 vD; varying vec3 vL; varying float vP;
void main(){
  vec2 q = vUv * 2.0 - 1.0; float r = length(q); vec3 col; float a;
  if (vP < 3.5) {
    float v = floor(vP + 0.5); vec2 cell = vec2(mod(v, 2.0), floor(v / 2.0));
    vec4 t = texture2D(uMap, (vUv * 0.985 + 0.0075 + cell) * 0.5);
    a = t.g * vA;
#ifdef ADD
    col = mix(vD, vL, t.r);
#else
    col = mix(vD, vL, pow(t.r, 2.3));
#endif
  } else if (vP < 10.5) {
    float g = pow(max(1.0 - r, 0.0), 2.2); float core = exp(-r * r * 10.0);
    col = mix(vL, vD, clamp(core * 1.5, 0.0, 1.0)); a = vA * clamp(g * 0.85 + core, 0.0, 1.4);
  } else {
    float gx = pow(max(1.0 - abs(q.x), 0.0), 2.4); float gy = exp(-q.y * q.y * 6.0);
    col = mix(vL, vD, clamp(gx * 1.2, 0.0, 1.0)); a = vA * gx * gy;
  }
  if (a < 0.002) discard;
#ifdef ADD
  gl_FragColor = vec4(col * a, 1.0);
#else
  gl_FragColor = vec4(col, a);
#endif
  #include <colorspace_fragment>
}`;
function makeBB(root, cap, o) {
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  const A = {}, ats = [];
  for (const [n, k] of [["aC", 3], ["aS", 2], ["aR", 1], ["aA", 1], ["aD", 3], ["aL", 3], ["aP", 2]]) { const at = new THREE.InstancedBufferAttribute(new Float32Array(cap * k), k); at.setUsage(THREE.DynamicDrawUsage); geo.setAttribute(n, at); A[n] = at.array; ats.push(at); }
  geo.instanceCount = 0;
  const mat = noLine(new THREE.ShaderMaterial({
    uniforms: { uMap: { value: puffAtlas() }, uFade: { value: new THREE.Vector2(o.near?.[0] ?? -1, o.near?.[1] ?? 0) } }, vertexShader: BB_VS, fragmentShader: BB_FS, defines: o.add ? { ADD: 1 } : {},
    transparent: true, depthWrite: false, depthTest: true, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide, fog: false,
  }));
  const mesh = lookOnly(new THREE.Mesh(geo, mat), o.order); root.add(mesh);
  const bb = {
    n: 0, mesh,
    reset() { this.n = 0; },
    // x y z, size w h, roll, dark/core colour, lit/fringe colour, alpha, profile, min size (fraction of screen height)
    put(x, y, z, sx, sy, rot, cd, cl, a, prof, minf) {
      if (this.n >= cap || a <= 0.002) return;
      const i = this.n++;
      A.aC[i * 3] = x; A.aC[i * 3 + 1] = y; A.aC[i * 3 + 2] = z; A.aS[i * 2] = sx; A.aS[i * 2 + 1] = sy; A.aR[i] = rot; A.aA[i] = a;
      A.aD[i * 3] = cd[0]; A.aD[i * 3 + 1] = cd[1]; A.aD[i * 3 + 2] = cd[2]; A.aL[i * 3] = cl[0]; A.aL[i * 3 + 1] = cl[1]; A.aL[i * 3 + 2] = cl[2];
      A.aP[i * 2] = prof; A.aP[i * 2 + 1] = minf;
    },
    commit() { geo.instanceCount = this.n; for (const at of ats) at.needsUpdate = true; mesh.visible = this.n > 0; },
  };
  return bb;
}

// ============================================================================================================== camera-facing ribbons
const RB_VS = `attribute vec3 aDir; attribute float aSide; attribute float aHW; attribute vec4 aCol; uniform float uMin; varying vec4 vC; varying float vE;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0); vec3 v = normalize(cameraPosition - wp.xyz); vec3 w = cross(aDir, v);
  float wl = length(w); w = wl > 0.0001 ? w / wl : vec3(0.0, 1.0, 0.0);
  float d = length(cameraPosition - wp.xyz); float hw = max(aHW, uMin * 2.0 * d / projectionMatrix[1][1]) * step(0.0001, aCol.a);
  vC = aCol; vE = aSide; gl_Position = projectionMatrix * viewMatrix * vec4(wp.xyz + w * aSide * hw, 1.0);
}`;
const RB_FS = `varying vec4 vC; varying float vE;
void main(){ float e = 1.0 - abs(vE); float a = vC.a * smoothstep(0.0, 0.7, e); gl_FragColor = vec4(vC.rgb * a, 1.0);
#include <colorspace_fragment>
}`;
function makeRibbons(root, slots, NS, order, minHW) {
  const LAY = 3, nv = slots * LAY * NS * 2, pos = new Float32Array(nv * 3), dir = new Float32Array(nv * 3), side = new Float32Array(nv), hw = new Float32Array(nv), col = new Float32Array(nv * 4), idx = [];
  for (let s = 0; s < slots * LAY; s++) for (let j = 0; j < NS; j++) { const v = (s * NS + j) * 2; side[v] = -1; side[v + 1] = 1; if (j < NS - 1) idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); }
  const geo = new THREE.BufferGeometry(), attrs = [["position", pos, 3], ["aDir", dir, 3], ["aHW", hw, 1], ["aCol", col, 4]];
  for (const [n, a, k] of attrs) { const at = new THREE.BufferAttribute(a, k); at.setUsage(THREE.DynamicDrawUsage); geo.setAttribute(n, at); }
  geo.setAttribute("aSide", new THREE.BufferAttribute(side, 1)); geo.setIndex(idx);
  const mat = noLine(new THREE.ShaderMaterial({ uniforms: { uMin: { value: minHW } }, vertexShader: RB_VS, fragmentShader: RB_FS, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
  const mesh = lookOnly(new THREE.Mesh(geo, mat), order); root.add(mesh);
  const LW = [1.7, 0.8, 0.26], LA = [0.55, 0.85, 1.0];
  return {
    NS, mesh,
    clear() { pos.fill(0); hw.fill(0); col.fill(0); },
    // a tapered streak in the slot: head (x,y,z), unit travel direction d (the trail lies behind it), trail length L, half-width at the head h0 (m), opacity op
    streak(slot, x, y, z, dx, dy, dz, L, h0, op, taper = 0.9) {
      if (op <= 0.003 || L <= 0.01) return;
      for (let l = 0; l < LAY; l++) for (let j = 0; j < NS; j++) {
        const q = j / (NS - 1), v = ((slot * LAY + l) * NS + j) * 2, s = L * q, k = Math.pow(1 - q, taper);
        if (l === 0) mix3(tmpA, C_OUT, C_EMB, q); else if (l === 1) mix3(tmpA, C_BAND, C_OUT, q); else mix3(tmpA, C_CORE, C_BAND, q * 0.8);
        const a = op * LA[l] * Math.pow(1 - q, 1.15), w = h0 * LW[l] * k;
        for (let sd = 0; sd < 2; sd++) { const o = v + sd; pos[o * 3] = x - dx * s; pos[o * 3 + 1] = y - dy * s; pos[o * 3 + 2] = z - dz * s; dir[o * 3] = dx; dir[o * 3 + 1] = dy; dir[o * 3 + 2] = dz; hw[o] = w; col[o * 4] = tmpA[0]; col[o * 4 + 1] = tmpA[1]; col[o * 4 + 2] = tmpA[2]; col[o * 4 + 3] = a; }
      }
    },
    // one ribbon sample written by hand (a curved trail): layer l, station j
    sample(slot, l, j, x, y, z, dx, dy, dz, w, r, g, b, a) {
      const v = ((slot * LAY + l) * NS + j) * 2;
      for (let sd = 0; sd < 2; sd++) { const o = v + sd; pos[o * 3] = x; pos[o * 3 + 1] = y; pos[o * 3 + 2] = z; dir[o * 3] = dx; dir[o * 3 + 1] = dy; dir[o * 3 + 2] = dz; hw[o] = w; col[o * 4] = r; col[o * 4 + 1] = g; col[o * 4 + 2] = b; col[o * 4 + 3] = a; }
    },
    LW, LA,
    commit() { for (const [n] of attrs) geo.getAttribute(n).needsUpdate = true; },
  };
}

// ============================================================================================================== station geometry
const COL_PANEL = lin("#374A6D"), COL_HULL = lin("#B5BBC1"), COL_HULL2 = lin("#8C929C"), COL_RAD = lin("#D5D7DB"), COL_GOLD = lin("#C9A25F");
function gridTex() {
  return once("gridTex", () => {
    const [c, g] = canvas(64, 64);
    g.fillStyle = "#374A6D"; g.fillRect(0, 0, 64, 64);
    const gr = g.createLinearGradient(0, 0, 64, 64); gr.addColorStop(0, "rgba(120,150,200,0.22)"); gr.addColorStop(1, "rgba(0,0,0,0.12)"); g.fillStyle = gr; g.fillRect(3, 3, 58, 58);
    g.strokeStyle = "#91A0B6"; g.lineWidth = 4; g.strokeRect(0, 0, 64, 64);
    g.strokeStyle = "rgba(145,160,182,0.45)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(32, 3); g.lineTo(32, 61); g.moveTo(3, 32); g.lineTo(61, 32); g.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  });
}
function partGeo(g, col, hot, uvScale) {   // add the attributes the station shader reads
  const n = g.attributes.position.count, cs = new Float32Array(n * 3), hs = new Float32Array(n);
  for (let i = 0; i < n; i++) { cs[i * 3] = col[0]; cs[i * 3 + 1] = col[1]; cs[i * 3 + 2] = col[2]; hs[i] = typeof hot === "function" ? hot(i) : (hot || 0); }
  g.setAttribute("aCol", new THREE.BufferAttribute(cs, 3)); g.setAttribute("aHot", new THREE.BufferAttribute(hs, 1));
  if (uvScale) { const uv = g.attributes.uv; for (let i = 0; i < n; i++) { uv.setXY(i, uv.getX(i) * uvScale[Math.floor(i / 4)][0], uv.getY(i) * uvScale[Math.floor(i / 4)][1]); } }
  return g;
}
function box(w, h, d, x, y, z, col, hot = 0, grid = false) {   // BoxGeometry faces: +x -x +y -y +z -z, 4 vertices each
  const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z);
  const us = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]].map(([a, b]) => [a / 3.2, b / 3.2]);
  const hf = typeof hot === "object" ? (i) => hot[Math.floor(i / 4)] || 0 : hot;
  return partGeo(g, col, hf, grid ? us : null);
}
function cyl(rTop, rBot, len, zc, col, sy = 1, hotEnd = 0) {   // axis along z, +z end = rTop
  const g = new THREE.CylinderGeometry(rTop, rBot, len, 12, 1, false); g.rotateX(Math.PI / 2); g.scale(1, sy, 1); g.translate(0, 0, zc);
  return partGeo(g, col, hotEnd ? (i) => (g.attributes.normal.getZ(i) < -0.9 ? hotEnd : 0) : 0);
}
function stationPieces(S) {
  const out = [], mk = (name, grp, rel, anchor, geos, extra = {}) => { const g = mergeGeometries(geos.map((q) => q.toNonIndexed())); g.translate(-anchor[0], -anchor[1], -anchor[2]); out.push({ name, grp, rel, anchor, geo: g, ...extra }); };
  // wings: 4 assemblies (inner/outer x z+/z-) on each side of the truss x, 53 long in two halves of 26.5, 11 wide in z, .4 thick in y
  const wing = (grp, sgn, rel, id) => {
    let n = 0;
    for (const zs of [1, -1]) for (const half of [0, 1]) {
      const cx = sgn * (11 + 13.25 + half * 26.5), cz = zs * 8.5, hf = half === 0 ? { [sgn > 0 ? 1 : 0]: grp === "A" ? 1 : 2 } : { [sgn > 0 ? 1 : 0]: 3 };   // inner end face (toward the mast) hot
      mk(`${id}${++n}`, grp, rel, [cx, 0, cz], [box(26.5, 0.4, 11, cx, 0, cz, COL_PANEL, hf, true)], { half, sgn });
    }
  };
  wing("A", 1, TAB.wingAt[0], "A"); wing("B", -1, TAB.wingAt[1], "B");
  mk("H1", "H", 0.7, [0, 0, 10.5], [cyl(5.2, 5.2, 7, 12.0, COL_HULL), cyl(2.6, 5.2, 4.5, 16.3 - 0.8, COL_HULL2), cyl(5.45, 5.45, 0.9, 8.0, COL_GOLD), cyl(1.0, 1.0, 1.2, 19.3 - 0.8, COL_HULL2), cyl(5.2, 5.2, 0.6, 7.2, COL_HULL, 1, 3)]);
  mk("H2", "H", 0.82, [0, 0, 0], [cyl(6.0, 6.0, 11, 0, COL_HULL, 0.92), cyl(6.2, 6.2, 1.2, 3.8, COL_HULL2, 0.92), cyl(6.2, 6.2, 1.2, -3.8, COL_HULL2, 0.92), box(22.4, 1.5, 1.5, 0, 0, 0, COL_HULL2, { 0: 1, 1: 2 })]);
  mk("H3", "H", 0.74, [0, 0, -10.0], [cyl(5.2, 5.2, 7, -9.0, COL_HULL), cyl(5.2, 3.0, 3, -13.0, COL_HULL2), cyl(2.4, 2.4, 1.0, -14.9, COL_GOLD), cyl(5.2, 5.2, 0.6, -5.7, COL_HULL, 1, 3)]);
  mk("H4", "H", 0.66, [0, 0, 0], [box(1.0, 16, 1.0, 0, 0, 0, COL_HULL2), box(10, 0.25, 6, 0, 7.5, 0, COL_RAD, 3), box(10, 0.25, 6, 0, -7.5, 0, COL_RAD, 3)]);
  for (const p of out) { p.dirL = null; }
  return out;
}

const ST_VS = `attribute vec3 aCol; attribute float aHot; varying vec3 vN; varying vec3 vCol; varying vec3 vW; varying vec2 vUv; varying float vHot;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vCol = aCol; vUv = uv; vHot = aHot; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const ST_FS = `uniform sampler2D uMap; uniform float uGrid; uniform vec3 uMove; uniform float uHeat; uniform vec3 uExp; uniform float uAlpha; uniform vec3 uL;
varying vec3 vN; varying vec3 vCol; varying vec3 vW; varying vec2 vUv; varying float vHot;
void main(){
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 base = uGrid > 0.5 ? texture2D(uMap, vUv).rgb : vCol;
  float ndl = dot(n, uL); float gain = ndl < 0.18 ? 0.50 : (ndl < 0.58 ? 0.76 : 1.0);
  vec3 c = base * gain * (ndl < 0.18 ? vec3(0.78, 0.84, 1.0) : vec3(1.0));
  vec3 vd = normalize(cameraPosition - vW);
  float front = clamp(dot(n, uMove), 0.0, 1.0); float rim = pow(1.0 - abs(dot(n, vd)), 2.0);
  vec3 orange = vec3(0.93, 0.26, 0.06), yellow = vec3(1.0, 0.72, 0.30);
  c += uHeat * (front * 0.95 + rim * 0.65 + 0.16) * mix(orange, yellow, front) * (uGrid > 0.5 ? 0.55 : 1.0);
  float ex = vHot > 2.5 ? uExp.z : (vHot > 1.5 ? uExp.y : (vHot > 0.5 ? uExp.x : 0.0));
  c = mix(c, vec3(1.0, 0.70, 0.29), clamp(ex, 0.0, 1.0) * 0.92); c += ex * vec3(0.55, 0.18, 0.04);
  gl_FragColor = vec4(c, uAlpha);
  #include <colorspace_fragment>
}`;

// ============================================================================================================== gentry
function planStreaks(cam) {
  const pos = new THREE.Vector3(...cam.pos), f = new THREE.Vector3(...cam.look).sub(pos).normalize(), rgt = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3().crossVectors(rgt, f).normalize();
  const list = [], t0s = [];
  for (const [a, dt, n] of TAB.minor) for (let i = 0; i < n; i++) t0s.push(a + dt * i);
  const sparks = (R) => Array.from({ length: 10 }, () => ({ q: 0.06 + 0.88 * R(), side: R() * 2 - 1, sz: 1.2 + 2.2 * R(), ph: R() * TAU, drift: 0.5 + R() }));
  t0s.forEach((t0, i) => {
    const R = rngOf(SEED + 41 + i * 97), early = i < 20;
    const az = early ? -11 + 28 * R() : -12 + 41 * R(), el = 13 + 19 * R(), depth = 850 + 1350 * R(), near = 1 - (depth - 850) / 1350, big = clamp(0.5 * near + 0.5 * R());
    const a = (25 + 14 * R()) * DEG, life = TAB.life[0] + (TAB.life[1] - TAB.life[0]) * R(), travel = 280 + 600 * R();
    const dirW = rgt.clone().multiplyScalar(-Math.cos(a)).addScaledVector(up, -Math.sin(a)).normalize();
    const p0 = pos.clone().addScaledVector(dirOf(az, el), depth / (Math.cos(az * DEG) * Math.cos(el * DEG)));
    list.push({ i, t0, life, p0, dir: dirW, travel, maxLen: lerp(90, 430, big ** 1.1), w: lerp(4, 20, big), env: lerp(7, 28, big ** 1.2), dia: lerp(2, 9, big ** 1.3), impact: -1, az, el, depth, sparks: sparks(R), T: t0 + life, comp: [0, 1].map((c) => ({ lag: 0.04 + 0.08 * R(), side: (c ? 1 : -1) * (1.2 + 1.8 * R()), k: 0.45 + 0.25 * R() })) });
  });
  TAB.impactT0.forEach((t0, s) => {
    const S = TAB.strikes[s], R = rngOf(SEED + 61 + s * 53), at = new THREE.Vector3(...S.at), p0 = new THREE.Vector3(...TAB.impactOff).multiplyScalar(TAB.impactScale[s]).add(at), len = at.distanceTo(p0);
    list.push({ i: 26 + s, t0, life: S.T - t0, p0, dir: at.clone().sub(p0).normalize(), travel: len, maxLen: TAB.impactTrail[s], w: 18 - s * 2, env: S.fire * 1.4, dia: S.fire, impact: s, T: S.T, sparks: sparks(R) });
  });
  return list;
}

function entryKind(P_) {
  const S = P_.spec, cam = S.cam ?? P3CAM, SC = S.stationScale ?? 1.6, GK = S.glow ?? 1.7, camPos = new THREE.Vector3(...cam.pos);
  const root = new THREE.Group(); lookOnly(root); P_.whole.add(root);
  const streaks = planStreaks(cam), NSL = 29 + 1 + 12 + 52;
  const rib = makeRibbons(root, NSL, 14, 200, 0.0007), bb = makeBB(root, 420, { add: true, order: 210 });
  // station pieces: one mesh each (12 of them)
  const pieces = stationPieces(SC), gridT = gridTex(), uL = new THREE.Vector3(-0.58, 0.4, -0.71).normalize();
  const baseMat = (grid) => noLine(new THREE.ShaderMaterial({ uniforms: { uMap: { value: gridT }, uGrid: { value: grid ? 1 : 0 }, uMove: { value: new THREE.Vector3(1, 0, 0) }, uHeat: { value: 0.5 }, uExp: { value: new THREE.Vector3() }, uAlpha: { value: 1 }, uL: { value: uL } }, vertexShader: ST_VS, fragmentShader: ST_FS, transparent: true, depthWrite: true, depthTest: true, side: THREE.DoubleSide, fog: false }));
  const stGroup = new THREE.Group(); lookOnly(stGroup); root.add(stGroup);
  const wingPieces = pieces.filter((p) => p.grp !== "H"), hullPieces = pieces.filter((p) => p.grp === "H");
  pieces.forEach((p, i) => {
    const R = rngOf(SEED + 211 + i * 31), isW = p.grp !== "H";
    p.mat = baseMat(isW); p.mesh = lookOnly(new THREE.Mesh(p.geo, p.mat), 190); p.mesh.scale.setScalar(SC); stGroup.add(p.mesh);
    // fragment flight: seeded offsets and axes. offset 0 / d1 (18-45) / d2 (45-110) m at the flight's 0 / .5 / 1
    p.d1 = 18 + 27 * R(); p.d2 = 45 + 65 * R(); p.ax = new THREE.Vector3(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1).normalize();
    p.dl = new THREE.Vector3(isW ? p.sgn * 0.85 : R() * 2 - 1, isW ? (R() - 0.5) * 0.8 : R() * 2 - 1, isW ? (R() - 0.5) * 0.7 : R() * 0.6 - 0.1 + (p.name === "H1" ? 0.5 : p.name === "H3" ? -0.5 : 0)).normalize();
    if (p.grp === "A") p.d1 = TAB.wingA21 / ((P(p.rel, 1, 0.5)) / 0.5);   // 21 m at stationAge .5 for wing A
    if (p.grp === "A" && p.half === 1) { p.d1 *= 1.0; p.d2 *= 1.15; }
    p.rollMax = 145; p.trailAlpha = 0.86;
  });
  void wingPieces; void hullPieces;
  const tp = new THREE.Vector3(), tq = new THREE.Vector3(), mv = new THREE.Vector3(), vv = new THREE.Vector3(), X = new THREE.Vector3(), Y = new THREE.Vector3(), M = new THREE.Matrix4(), Qb = new THREE.Quaternion(), Qf = new THREE.Quaternion(), vtmp = new THREE.Vector3();
  const corePos = (age, out) => out.set(q3(TAB.stPath[0][0], TAB.stPath[1][0], TAB.stPath[2][0], age), q3(TAB.stPath[0][1], TAB.stPath[1][1], TAB.stPath[2][1], age), q3(TAB.stPath[0][2], TAB.stPath[1][2], TAB.stPath[2][2], age));
  const basis = (age, outM, outMove) => {   // station frame: z = travel (nose), x = the truss, y = z cross x, rolled about z
    corePos(age, tp); corePos(age + 0.01, tq); outMove.copy(tq).sub(tp).normalize();
    vv.copy(camPos).sub(tp).normalize(); X.crossVectors(outMove, vv).normalize();
    if (X.dot(vtmp.set(1, 0, 0)) < 0) X.negate();
    Y.crossVectors(outMove, X);
    const rl = q3(TAB.stRoll[0], TAB.stRoll[1], TAB.stRoll[2], age) * DEG, c = Math.cos(rl), s = Math.sin(rl);
    const Xr = tq.copy(X).multiplyScalar(c).addScaledVector(Y, s), Yr = vtmp.copy(Y).multiplyScalar(c).addScaledVector(X, -s);
    outM.makeBasis(Xr, Yr, outMove); return outM;
  };
  // fragment flight directions are fixed at the release basis: world vectors
  const Mrel = pieces.map((p) => basis(p.rel, new THREE.Matrix4(), new THREE.Vector3()));
  pieces.forEach((p, i) => { p.dirW = p.dl.clone().applyMatrix4(new THREE.Matrix4().extractRotation(Mrel[i])); p.Qrel = new THREE.Quaternion().setFromRotationMatrix(Mrel[i]); });
  const move = new THREE.Vector3(), headP = new THREE.Vector3(), mvq = new THREE.Vector3(), up0 = new THREE.Vector3(), tmpV = new THREE.Vector3(), Mc = new THREE.Matrix4(), anch = new THREE.Vector3(), Qc = new THREE.Quaternion();
  const embers = Array.from({ length: 6 }, (_, k) => { const R = rngOf(SEED + 333 + k * 7); return { lx: (R() - 0.5) * 36, ly: (R() - 0.5) * 20, lz: (R() - 0.5) * 24, back: 30 + 90 * R(), ph: R() * TAU, sz: 3 + 4 * R() }; });
  return {
    grip: 0,
    apply(ps) {
      const t = ps.t ?? S.t ?? -1, on = t >= 33 && t < 38.6; root.visible = on; if (!on) return;
      rib.clear(); bb.reset();
      // ---- the 29 streaks
      for (const s of streaks) {
        let tau = (t - s.t0) / s.life; const imp = s.impact >= 0;
        if (tau <= 0 || (!imp && tau >= 1) || (imp && t > s.T + 0.7)) continue;
        const after = imp && tau > 1 ? (t - s.T) / 0.45 : 0, tc = Math.min(tau, 1);
        const lf = imp ? lerp(0, 1, clamp(tc / 0.5)) * (1 - 0.6 * clamp(after)) : (tc < 0.5 ? tc / 0.5 : lerp(1, 0.25, (tc - 0.5) / 0.5));
        let op = imp ? Math.min(1, tc / 0.5) * 0.96 + 0.04 * clamp((tc - 0.5) / 0.5) : (tc < 0.5 ? tc / 0.5 : (1 - tc) / 0.5) * 0.96;
        if (imp) op *= 1 - clamp(after) ** 1.5;
        const hx = s.p0.x + s.dir.x * s.travel * tc, hy = s.p0.y + s.dir.y * s.travel * tc, hz = s.p0.z + s.dir.z * s.travel * tc;
        const Lm = s.maxLen * lf * GK ** 0.4, hw = (s.w / 2) * GK;
        rib.streak(s.i, hx, hy, hz, s.dir.x, s.dir.y, s.dir.z, Lm, hw * (0.35 + 0.65 * Math.min(1, lf * 2)), op);
        // head: glow + hot core (the impactor's head grows to the fireball's diameter at contact)
        const grow = imp ? 0.4 + 0.6 * tc ** 1.5 : 1, env = (imp ? s.dia * 1.6 * grow : s.env) * GK, dia = (imp ? s.dia * grow : s.dia) * GK;
        const hot = imp && tau > 1 ? 0 : Math.pow(op / 0.96, 0.6);
        bb.put(hx, hy, hz, env * 5.0, env * 5.0, 0, C_OUT, C_EMB, 0.5 * hot, 10, 0.03);
        bb.put(hx, hy, hz, env * 2.4, env * 2.4, 0, C_BAND, C_OUT, 0.9 * hot, 10, 0.016);
        bb.put(hx, hy, hz, dia * 2.6, dia * 2.6, 0, C_CORE, C_BAND, 1.0 * hot, 10, 0.0075);
        // ember sparks along the trail, flickering, drifting off the axis
        mvq.set(s.dir.x, s.dir.y, s.dir.z); vtmp.copy(camPos).sub(headP.set(hx, hy, hz)).normalize(); up0.crossVectors(mvq, vtmp).normalize();
        if (!imp) for (let c = 0; c < 2; c++) {   // two fragments fly with it: smaller parallel streaks a little behind
          const cp = s.comp[c], ct = Math.max(0, tc - cp.lag), cl = Math.max(0, (ct < 0.5 ? ct / 0.5 : lerp(1, 0.25, (ct - 0.5) / 0.5))), co = (ct < 0.5 ? ct / 0.5 : (1 - ct) / 0.5) * 0.8;
          if (ct <= 0.01 || co <= 0.01) continue;
          const sd2 = cp.side * s.env * GK * 0.9, cx = s.p0.x + s.dir.x * s.travel * ct + up0.x * sd2, cy = s.p0.y + s.dir.y * s.travel * ct + up0.y * sd2, cz = s.p0.z + s.dir.z * s.travel * ct + up0.z * sd2;
          rib.streak(42 + s.i * 2 + c, cx, cy, cz, s.dir.x, s.dir.y, s.dir.z, s.maxLen * 0.55 * cl * GK ** 0.4, hw * cp.k * 0.8, co);
          bb.put(cx, cy, cz, s.env * GK * 2.0 * cp.k, s.env * GK * 2.0 * cp.k, 0, C_BAND, C_OUT, 0.85 * co, 10, 0.012);
          bb.put(cx, cy, cz, s.dia * GK * 1.6 * cp.k, s.dia * GK * 1.6 * cp.k, 0, C_CORE, C_BAND, co, 10, 0.006);
        }
        for (let k = 0; k < s.sparks.length; k++) {
          const sp = s.sparks[k], q = sp.q * lf; if (lf < 0.05) break;
          const dd = s.maxLen * q * GK ** 0.4, off = sp.side * (hw * (1 - q) ** 0.8 * 1.3 + 2 + sp.drift * 5 * tc);
          const fl = 0.55 + 0.45 * Math.sin(t * 47 + sp.ph * 3 + k), a = op * fl * (1 - q) * 0.95;
          mix3(tmpB, C_BAND, C_EMB, q);
          bb.put(hx - s.dir.x * dd + up0.x * off, hy - s.dir.y * dd + up0.y * off, hz - s.dir.z * dd + up0.z * off, sp.sz * GK, sp.sz * GK, 0, C_CORE, tmpB, a, 10, 0.0032);
        }
      }
      // ---- the station
      const age = P(TAB.station[0], TAB.station[1], t), live = t >= TAB.station[0];
      stGroup.visible = live; for (const p of pieces) p.mesh.visible = false;
      if (live && age < 1.0001) {
        corePos(age, headP); basis(age, Mc, move);
        const heat = lerp(0.42, 1, P(0, 0.4, age)), fadeAll = 1 - sstep(0.93, 1.0, age);
        // plasma behind the station: ribbon along the real path, big glow quad pushed away from the camera
        const plen = TAB.plasmaLen * Math.pow(P(0, 0.3, age), 0.7) * (1 - 0.5 * P(0.8, 1, age)) * GK ** 0.4, pw = TAB.plasmaDia / 2 * (0.4 + 0.6 * P(0, 0.35, age)) * GK, pa = P(0, 0.12, age) * fadeAll;
        const slot = 29;
        if (plen > 1 && pa > 0.003) for (let l = 0; l < 3; l++) for (let j = 0; j < rib.NS; j++) {
          const q = j / (rib.NS - 1), aq = age - (plen * q) / 300 / 2.32;
          corePos(aq, tmpV); corePos(aq + 0.01, mvq); mvq.sub(tmpV).normalize();
          if (l === 0) mix3(tmpA, C_OUT, C_EMB, q); else if (l === 1) mix3(tmpA, C_BAND, C_OUT, q); else mix3(tmpA, C_CORE, C_BAND, q * 0.8);
          rib.sample(slot, l, j, tmpV.x, tmpV.y, tmpV.z, mvq.x, mvq.y, mvq.z, pw * rib.LW[l] * Math.pow(1 - q, 0.8), tmpA[0], tmpA[1], tmpA[2], pa * rib.LA[l] * Math.pow(1 - q, 1.1));
        }
        vtmp.copy(camPos).sub(headP).normalize();
        bb.put(headP.x - vtmp.x * 40, headP.y - vtmp.y * 40, headP.z - vtmp.z * 40, TAB.plasmaDia * 2.3 * GK, TAB.plasmaDia * 2.3 * GK, 0, C_BAND, C_OUT, 0.8 * pa, 10, 0.02);
        bb.put(headP.x - vtmp.x * 40, headP.y - vtmp.y * 40, headP.z - vtmp.z * 40, TAB.plasmaDia * 0.9 * GK, TAB.plasmaDia * 0.9 * GK, 0, C_CORE, C_BAND, 0.75 * pa, 10, 0.01);
        for (let k = 1; k <= 4; k++) { const q = k * 0.14, aq = age - (plen * q) / 300 / 2.32; corePos(aq, tmpV); bb.put(tmpV.x - vtmp.x * 30, tmpV.y - vtmp.y * 30, tmpV.z - vtmp.z * 30, TAB.plasmaDia * (1.6 - q) * GK, TAB.plasmaDia * (1.6 - q) * GK, 0, C_OUT, C_EMB, 0.55 * pa * (1 - q), 10, 0.0); }
        // 6 ember quads: molten pieces that stream behind the nose
        for (const e of embers) { const dist = e.back * P(0, 0.2, age); anch.set(e.lx, e.ly, e.lz).applyMatrix4(Mc).sub(tmpV.set(0, 0, 0)); bb.put(headP.x + anch.x - move.x * dist, headP.y + anch.y - move.y * dist, headP.z + anch.z - move.z * dist, e.sz * GK, e.sz * GK, 0, C_CORE, C_OUT, pa * (0.5 + 0.5 * Math.sin(t * 31 + e.ph)) * 0.9, 10, 0.0035); }
        // pieces
        for (let i = 0; i < pieces.length; i++) {
          const p = pieces[i], m = p.mesh, u = P(p.rel, 1, age), det = age >= p.rel;
          if (!det) {
            anch.set(p.anchor[0] * SC, p.anchor[1] * SC, p.anchor[2] * SC).applyMatrix4(Mc);
            m.position.set(headP.x + anch.x - 0, headP.y + anch.y, headP.z + anch.z); Qb.setFromRotationMatrix(Mc); m.quaternion.copy(Qb);
          } else {
            const off = k3(0, p.d1, p.d2, u), pp = 1.0;
            anch.set(p.anchor[0] * SC, p.anchor[1] * SC, p.anchor[2] * SC).applyQuaternion(p.Qrel);
            m.position.set(headP.x + anch.x + p.dirW.x * off * pp, headP.y + anch.y + p.dirW.y * off * pp, headP.z + anch.z + p.dirW.z * off * pp);
            Qf.setFromAxisAngle(p.ax, k3(0, 65, 145, u) * DEG); m.quaternion.copy(p.Qrel).multiply(Qf);
          }
          // Mc has no translation; headP is the station core. anchors are metres x SC
          const alpha = det ? 1 - sstep(0.72, 1, u) : 1, ex = det ? 1 : 0;
          m.visible = alpha > 0.01 && fadeAll > 0; p.mat.uniforms.uAlpha.value = alpha * (p.grp === "H" || !det ? 1 : 1);
          const heatP = det ? heat * (1 - 0.65 * P(0.4, 1, u)) + 0.25 * (1 - u) : heat;
          p.mat.uniforms.uHeat.value = heatP; p.mat.uniforms.uMove.value.copy(move);
          const e = p.mat.uniforms.uExp.value; e.set(age >= TAB.wingAt[0] ? P(TAB.wingAt[0], TAB.wingAt[0] + 0.1, age) : 0, age >= TAB.wingAt[1] ? P(TAB.wingAt[1], TAB.wingAt[1] + 0.1, age) : 0, det && p.grp === "H" ? P(p.rel, p.rel + 0.1, age) : (det ? P(p.rel, p.rel + 0.06, age) * 0.7 : 0));
          void ex;
          if (det && alpha > 0.02) {   // the flying piece's trail and head glow
            const tl = k3(0, 120, 35, u) * GK ** 0.4, ta = k3(0, 0.86, 0, u), wsz = p.grp === "H" ? 7 : 11;
            rib.streak(30 + i, m.position.x, m.position.y, m.position.z, move.x, move.y, move.z, tl, wsz * 0.5 * GK, ta);
            bb.put(m.position.x, m.position.y, m.position.z, wsz * 3.2 * GK, wsz * 3.2 * GK, 0, C_BAND, C_OUT, ta * 0.9 * alpha, 10, 0.012);
          }
        }
        if (age < 0.12) bb.put(headP.x - vtmp.x * 40, headP.y - vtmp.y * 40, headP.z - vtmp.z * 40, 90 * GK, 6 * GK, Math.atan2(-move.y, -move.x) * 0, C_CORE, C_BAND, 0, 11, 0);
      }
      rib.commit(); bb.commit();
    },
  };
}

// ============================================================================================================== gstrike
const BAND_VS = `attribute vec4 aCol; attribute float aE; varying vec4 vC; varying float vE; varying vec3 vW; void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vC = aCol; vE = aE; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const BAND_FS = `varying vec4 vC; varying float vE; varying vec3 vW; uniform float uClipZ; uniform vec3 uCam;
void main(){ if (vW.z > uClipZ) discard; float a = vC.a * (1.0 - pow(abs(vE), 2.0)) * smoothstep(25.0, 90.0, distance(vW, uCam)); if (a < 0.003) discard; gl_FragColor = vec4(vC.rgb, a);
#include <colorspace_fragment>
}`;
const RK_VS = `attribute vec3 aCol; attribute float aHot; varying vec3 vW; varying vec3 vC; varying float vH;
void main(){ vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0); vW = wp.xyz; vC = aCol; vH = aHot; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const RK_FS = `uniform vec3 uL; varying vec3 vW; varying vec3 vC; varying float vH;
void main(){
  vec3 n = normalize(cross(dFdx(vW), dFdy(vW))); if (dot(n, cameraPosition - vW) < 0.0) n = -n;
  float ndl = dot(n, uL); float g = ndl < 0.18 ? 0.50 : (ndl < 0.58 ? 0.76 : 1.0);
  vec3 c = vC * g * (ndl < 0.18 ? vec3(0.78, 0.84, 1.0) : vec3(1.0)) + vH * vec3(1.0, 0.45, 0.14) * (0.55 + 0.45 * g);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;
function jitterGeo(g, seed) {
  const p = g.attributes.position, R = (x, y, z) => fr(Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 0.72 + 0.5 * R(Math.round(x * 100) / 100, Math.round(y * 100) / 100, Math.round(z * 100) / 100); p.setXYZ(i, x * k, y * k, z * k); }
  return g;
}
const ROCK_COLS = ["#8D7C73", "#6F6260", "#9A8478", "#5F5058", "#7B6A63", "#A08E7F"].map(lin);

function strikeKind(P_) {
  const S = P_.spec, from = new THREE.Vector3(...(S.from ?? P4CAM)), DS = S.debrisScale ?? 2.2, endAt = S.endAt ?? 56, SZ = S.size ?? 1;
  const root = new THREE.Group(); lookOnly(root); P_.whole.add(root);
  const smoke = makeBB(root, 460, { add: false, order: 150, near: [30, 140] }), fire = makeBB(root, 520, { add: true, order: 160, near: [20, 60] });
  // ---- plan per strike
  const st = TAB.strikes.map((Sx, s) => {
    const R = rngOf(SEED + 300 + s * 17), dr = Sx.flash / 104;
    const pcs = [];
    for (let k = 0; k < Sx.debris; k++) { const blk = k < Sx.blocks; pcs.push({ blk, size: blk ? 0.4 + 1.8 * R() ** 1.4 : 0.18 + 0.62 * R() ** 1.2, phi: R() * TAU, d: 20 + 75 * R(), h: 14 + 48 * R(), ax: new THREE.Vector3(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1).normalize(), q0: new THREE.Quaternion().setFromEuler(new THREE.Euler(R() * TAU, R() * TAU, R() * TAU)), sc: [0.7 + 0.7 * R(), 0.6 + 0.6 * R(), 0.7 + 0.7 * R()], col: ROCK_COLS[Math.floor(R() * ROCK_COLS.length)], idx: 0 }); }
    const billows = Array.from({ length: Math.round(14 * (0.6 + 0.4 * dr)) }, () => ({ ang: R() * TAU, off: R() * 0.45, delay: R() * 0.3, rise: 0.25 + 0.55 * R(), sz: 0.7 + 0.6 * R(), v: Math.floor(R() * 4), rot: (R() - 0.5) * 1.2 }));
    const nCol = Math.round(22 * (0.65 + 0.35 * dr)), col = Array.from({ length: nCol }, (_, j) => ({ f: j / (nCol - 1), jx: (R() - 0.5), jz: (R() - 0.5), sz: 0.8 + 0.5 * R(), v: Math.floor(R() * 4), rot: (R() - 0.5) * 0.6, ph: R() * TAU }));
    const wall = Array.from({ length: 32 }, (_, j) => ({ th: ((j + (R() - 0.5) * 0.5) / 32) * TAU, rn: R(), v: Math.floor(R() * 4), rot: (R() - 0.5) * 0.5, hs: 0.8 + 0.5 * R() }));
    const sprays = Array.from({ length: 18 }, (_, j) => ({ th: ((j + R() * 0.8) / 18) * TAU, rn: R(), v: Math.floor(R() * 4), hs: 0.7 + 0.8 * R(), off: R() - 0.5 }));
    const beds = Array.from({ length: 6 }, () => ({ ang: R() * TAU, off: R() * 0.46, sz: 0.5 + 0.5 * R(), ph: R() * TAU, v: Math.floor(R() * 4) }));
    return { ...Sx, dr, pcs, billows, col, wall, sprays, beds, at: new THREE.Vector3(...Sx.at) };
  });
  // ---- ring band: 3 strikes x 32 segments x 4 vertices
  const NB = 3 * 32, bp = new Float32Array(NB * 4 * 3), bc = new Float32Array(NB * 4 * 4), be = new Float32Array(NB * 4), bi = [];
  for (let q = 0; q < NB; q++) { be.set([-1, 1, 1, -1], q * 4); bi.push(q * 4, q * 4 + 1, q * 4 + 2, q * 4, q * 4 + 2, q * 4 + 3); }
  const bgeo = new THREE.BufferGeometry(); bgeo.setAttribute("position", new THREE.BufferAttribute(bp, 3).setUsage(THREE.DynamicDrawUsage)); bgeo.setAttribute("aCol", new THREE.BufferAttribute(bc, 4).setUsage(THREE.DynamicDrawUsage)); bgeo.setAttribute("aE", new THREE.BufferAttribute(be, 1)); bgeo.setIndex(bi);
  const bmat = noLine(new THREE.ShaderMaterial({ uniforms: { uClipZ: { value: -4 }, uCam: { value: from } }, vertexShader: BAND_VS, fragmentShader: BAND_FS, transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide, fog: false }));
  const band = lookOnly(new THREE.Mesh(bgeo, bmat), 120); root.add(band);
  // ---- rubble: two instanced meshes
  const nBlk = st.reduce((a, s) => a + s.blocks, 0), nStn = st.reduce((a, s) => a + s.debris - s.blocks, 0);
  const mkRock = (geo, n) => {
    geo.setAttribute("aCol", new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute("aHot", new THREE.InstancedBufferAttribute(new Float32Array(n), 1).setUsage(THREE.DynamicDrawUsage));
    const m = noLine(new THREE.ShaderMaterial({ uniforms: { uL: { value: new THREE.Vector3(-0.58, 0.4, -0.71).normalize() } }, vertexShader: RK_VS, fragmentShader: RK_FS, side: THREE.DoubleSide, fog: false }));
    const im = new THREE.InstancedMesh(geo, m, n); lookOnly(im, 100); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.count = 0; root.add(im); return im;
  };
  const blocks = mkRock(jitterGeo(new THREE.BoxGeometry(1, 1, 1), 1.7).toNonIndexed(), nBlk), stones = mkRock(jitterGeo(new THREE.IcosahedronGeometry(0.7, 0), 3.1), nStn);
  let bi_ = 0, si_ = 0; for (const s of st) for (const p of s.pcs) { p.idx = p.blk ? bi_++ : si_++; const im = p.blk ? blocks : stones; im.geometry.attributes.aCol.setXYZ(p.idx, p.col[0], p.col[1], p.col[2]); }
  // painter's order of the smoke quads: far strike first; within a strike, the far side of the ring, the column, the near side
  const order = st.map((s, i) => i).sort((a, b) => st[b].at.distanceTo(from) - st[a].at.distanceTo(from));
  const dummyPos = new THREE.Vector3(), dummyQ = new THREE.Quaternion(), dummyS = new THREE.Vector3(), mtx = new THREE.Matrix4(), qr = new THREE.Quaternion();
  const fcol = [0, 0, 0], fcol2 = [0, 0, 0], sd = [0, 0, 0], sl = [0, 0, 0];
  const fireCol = (u, out) => { const x = u * 3, i = Math.min(2, Math.floor(x)); return mix3(out, FIRE[i], FIRE[i + 1], x - i); };
  return {
    grip: 0,
    apply(ps) {
      const t = ps.t ?? S.t ?? -1, first = TAB.strikes[0].T;
      const on = t >= first && t < endAt; root.visible = on; if (!on) return;
      smoke.reset(); fire.reset(); bc.fill(0); let nb = 0, nBk = 0, nSt = 0;
      const glowK = 1 - 0.35 * P(40, 56, t);
      for (const si of order) {
        const s = st[si], u = t - s.T; if (u < 0) continue;
        const C = s.at, D = s.flash * SZ, dr = s.dr * SZ, Df = s.fire * SZ;
        // ---- flash + flares
        const fl = P(0, TAB.flash, u), fd = k3(4, D, 0.45 * D, fl), fa = k3(0.95, 1, 0, fl);
        if (fl < 1) {
          const cy = C.y + 0.28 * fd;
          fire.put(C.x, cy, C.z, fd * 1.25, fd * 1.25, 0, C_FLASH_CORE, C_FLASH_FR, fa, 10, 0.02);
          fire.put(C.x, cy, C.z, fd * 3.4, fd * 0.16, 0, C_FLASH_CORE, C_FLASH_FR, fa * 0.8, 11, 0);
          fire.put(C.x, cy + fd * 0.35, C.z, fd * 2.6, fd * 0.13, Math.PI / 2, C_FLASH_CORE, C_FLASH_FR, fa * 0.55, 11, 0);
        }
        // ---- fire billows: the fireball rising and cooling
        for (const b of s.billows) {
          const uu = P(b.delay, b.delay + 1.5, u); if (uu <= 0 || uu >= 1) continue;
          fireCol(0.12 + 0.88 * uu, fcol); fireCol(Math.min(1, 0.12 + 0.88 * uu + 0.25), fcol2);
          const H = k3(3, 58, 115, P(0, TAB.column, u)) * SZ, sz = Df * (0.9 + 2.3 * Math.sqrt(uu)) * b.sz * (0.6 + 0.4 * dr), a = Math.pow(1 - uu, 1.3) * 0.7;
          fire.put(C.x + Math.cos(b.ang) * b.off * Df * 2.2 * uu, C.y + 4 + b.rise * H * 0.7 * Math.sqrt(uu) + sz * 0.2, C.z + Math.sin(b.ang) * b.off * Df * 2.2 * uu, sz, sz * 0.9, b.rot, fcol2, fcol, a, b.v, 0.0);
        }
        // ---- fire beds: stay lit
        const bedA = 0.62 * P(0.1, 1.0, u) * glowK;
        for (const b of s.beds) {
          const fk = 0.75 + 0.25 * Math.sin(t * 9 + b.ph) * Math.sin(t * 5.3 + b.ph * 1.7);
          const sz = (22 + 30 * b.sz) * dr * (0.5 + 0.5 * P(0, 1.5, u));
          mix3(fcol, FIRE[2], FIRE[1], 0.4 + 0.3 * Math.sin(t * 7 + b.ph));
          fire.put(C.x + Math.cos(b.ang) * b.off * D, C.y + sz * 0.22, C.z + Math.sin(b.ang) * b.off * D, sz * 1.5, sz * 0.8, 0, FIRE[2], fcol, bedA * fk, b.v, 0.0);
        }
        // ---- the smoke column (normal blend)
        const cu = P(0, TAB.column, u), H = k3(3, 58, 115, cu) * SZ * (0.75 + 0.25 * dr), Rr = k3(4, 18, 30, cu) * SZ * (0.7 + 0.3 * dr), opc = k3(0.1, 0.82, 0.64, cu) * (1 - 0.4 * P(38, 46, t)), after = Math.max(0, u - TAB.column);
        const lean = 0.3 * H + 1.3 * after;
        // ring wall behind the column first (far side), then the column, then the near side
        const ru = P(0, TAB.ring, u), rad = s.v * u * (ru < 1 ? 1 : 1), W = k3(4, 12, 24, ru), ra = k3(0.94, 0.66, 0, ru), hw = k3(8, 52, 40, ru) * SZ * (0.7 + 0.3 * dr);
        const ringOn = ru < 1 && rad > 2;
        const wallPut = (w, near) => {
          const wx = C.x + Math.cos(w.th) * rad, wz = C.z + Math.sin(w.th) * rad; if (wz > -4 || (Math.sin(w.th) > 0) !== near) return;
          const seg = (TAU * rad / 32) * 1.5 + W, hh = hw * w.hs, a = ra * (0.7 + 0.3 * w.rn);
          mix3(sd, DUST_DARK, FIRE[2], 0.35 * (1 - ru) * (1 - P(0, 0.9, u) * 0.5)); mix3(sl, DUST_DARK, DUST_LIT, 0.55 + 0.45 * w.rn);
          smoke.put(wx, C.y + hh * 0.42, wz, seg, hh * 1.2, w.rot, sd, sl, a, w.v, 0);
        };
        if (ringOn) for (const w of s.wall) wallPut(w, false);
        // column puffs, bottom up
        for (const c of s.col) {
          const f = c.f, y = C.y + f * H + Rr * 0.35, ph = c.ph, wob = Math.sin(ph + t * 0.9) * Rr * 0.25 * f, rr = Rr * (0.82 + 0.55 * f * f) * c.sz * (1 + 0.04 * Math.sin(t * 1.3 + ph));
          const ap = opc * (0.6 + 0.4 * (1 - f * 0.6)) * clamp(1.4 * cu + 0.1);
          mix3(sd, SMOKE_DARK, FIRE[2], 0.45 * (1 - f) * (1 - P(0.2, 2.4, u))); mix3(sl, SMOKE_RIM, FIRE[1], 0.25 * (1 - f) * (1 - P(0.2, 2.4, u)));
          smoke.put(C.x + lean * f ** 1.5 + c.jx * Rr * 1.1 + wob, y, C.z + c.jz * Rr * 0.8, rr * 2.1, rr * 1.9, c.rot, sd, sl, ap, c.v, 0);
        }
        if (ringOn) for (const w of s.wall) wallPut(w, true);
        if (ringOn) for (const p of s.sprays) {
          const rr = rad + (p.off * W), sx = C.x + Math.cos(p.th) * rr, sz = C.z + Math.sin(p.th) * rr; if (sz > -4) continue;
          const hh = k3(14, 46, 34, ru) * p.hs * SZ * (0.7 + 0.3 * dr); mix3(sl, DUST_DARK, DUST_LIT, 0.4 + 0.6 * p.rn);
          smoke.put(sx, -54 + hh * 0.45, sz, Math.max(W * 2.4, 12), hh, 0, DUST_DARK, sl, ra * 0.7 * (0.6 + 0.4 * p.rn), p.v, 0);
        }
        // ---- ring band on the ground (32 ground-facing segments)
        for (let j = 0; j < 32; j++) {
          const q = si * 32 + j, w = s.wall[j], a0 = (j / 32) * TAU, a1 = ((j + 1) / 32) * TAU, r1 = rad, r0 = Math.max(0, rad - W);
          const vis = ringOn ? 1 : 0, y = GY + 0.4;
          const P4 = [[r0, a0], [r1, a0], [r1, a1], [r0, a1]];
          for (let k = 0; k < 4; k++) {
            const [r, a] = P4[k], o = (q * 4 + k);
            bp[o * 3] = C.x + Math.cos(a) * r; bp[o * 3 + 1] = y; bp[o * 3 + 2] = C.z + Math.sin(a) * r;
            mix3(sl, DUST_DARK, DUST_LIT, 0.3 + 0.7 * w.rn); bc[o * 4] = sl[0]; bc[o * 4 + 1] = sl[1]; bc[o * 4 + 2] = sl[2]; bc[o * 4 + 3] = vis * ra * (0.25 + 0.4 * w.rn);
          }
        }
        // ---- rubble
        const eu = P(0, TAB.eject, u);
        for (const p of s.pcs) {
          const e = eu, rad2 = p.d * e, y = 4 * p.h * e * (1 - e), sc = p.size * DS * (0.5 + 0.5 * sstep(0, 0.05, u)), roll = k3(0, 100, 200, e) * DEG;
          dummyPos.set(C.x + Math.cos(p.phi) * rad2, C.y + (p.blk ? 0.5 : 0.35) * sc + 1.0 + y, C.z + Math.sin(p.phi) * rad2);
          qr.setFromAxisAngle(p.ax, roll); dummyQ.copy(qr).multiply(p.q0); dummyS.set(sc * p.sc[0], sc * p.sc[1], sc * p.sc[2]);
          mtx.compose(dummyPos, dummyQ, dummyS); const im = p.blk ? blocks : stones; im.setMatrixAt(p.idx, mtx);
          const hot = Math.pow(clamp(1 - e / 0.7), 1.5); im.geometry.attributes.aHot.setX(p.idx, hot * 0.9);
          if (hot > 0.02 && u < 2.0) fire.put(dummyPos.x, dummyPos.y, dummyPos.z, sc * 5.5 + 2, sc * 5.5 + 2, 0, FIRE[0], FIRE[1], hot * 0.85 * (0.7 + 0.3 * Math.sin(t * 40 + p.phi * 9)), 10, 0.003);
          if (p.blk) nBk = Math.max(nBk, p.idx + 1); else nSt = Math.max(nSt, p.idx + 1);
        }
        void nb;
      }
      blocks.count = nBk; stones.count = nSt;
      for (const im of [blocks, stones]) { im.instanceMatrix.needsUpdate = true; im.geometry.attributes.aHot.needsUpdate = true; im.geometry.attributes.aCol.needsUpdate = true; im.visible = im.count > 0; }
      bgeo.attributes.position.needsUpdate = true; bgeo.attributes.aCol.needsUpdate = true;
      smoke.commit(); fire.commit();
    },
  };
}

// ============================================================================================================== gglass
const GL = { x0: -1.95, x1: 1.95, y0: 0.09, y1: 3.43, z: -2.64 };
const gx = (u) => GL.x0 + (GL.x1 - GL.x0) * u, gy = (v) => GL.y0 + (GL.y1 - GL.y0) * v;
function clipSeg(a, b) {   // clip a segment to the opening: returns the part inside from a, or null; flags if it left
  const inside = (p) => p[0] >= GL.x0 && p[0] <= GL.x1 && p[1] >= GL.y0 && p[1] <= GL.y1;
  if (inside(b)) return [b, false];
  let tmin = 1;
  for (const [axis, lim] of [[0, GL.x0], [0, GL.x1], [1, GL.y0], [1, GL.y1]]) { const d = b[axis] - a[axis]; if (Math.abs(d) < 1e-9) continue; const tt = (lim - a[axis]) / d; if (tt > 0 && tt < tmin) tmin = tt; }
  return [[a[0] + (b[0] - a[0]) * tmin, a[1] + (b[1] - a[1]) * tmin], true];
}
function clipPoly(pts) { const out = [pts[0]]; for (let i = 1; i < pts.length; i++) { const [p, left] = clipSeg(out[out.length - 1], pts[i]); out.push(p); if (left) break; } return out; }
function glassPlan(starts) {
  const R = rngOf(SEED + 700), polys = [];
  const starts_m = starts.map(([u, v]) => [gx(u), gy(v)]);
  const edgeDist = (p) => [[GL.x1 - p[0], 0], [p[0] - GL.x0, 180], [GL.y1 - p[1], 90], [p[1] - GL.y0, 270]];
  const rayEnd = (p, ang) => { const dx = Math.cos(ang * DEG), dy = Math.sin(ang * DEG); let tm = 1e9; for (const [axis, lim] of [[0, GL.x0], [0, GL.x1], [1, GL.y0], [1, GL.y1]]) { const d = axis ? dy : dx; if (Math.abs(d) < 1e-9) continue; const tt = (lim - p[axis]) / d; if (tt > 1e-6 && tt < tm) tm = tt; } return [p[0] + dx * tm, p[1] + dy * tm, tm]; };
  starts_m.forEach((s, si) => {
    const e = edgeDist(s).sort((a, b) => a[0] - b[0]), e1 = e[0][1], e2 = e[1][1];
    const spread = [[e1, 0], [e2, -14], [e1, -36], [e2, 22], [e1, 38]];
    spread.forEach(([base, off], k) => {
      const ang = base + off + (R() - 0.5) * 10, [ex, ey, L] = rayEnd(s, ang), n = 3 + Math.floor(R() * 3), perp = [-Math.sin(ang * DEG), Math.cos(ang * DEG)], pts = [s];
      let walk = 0;
      for (let j = 1; j < n; j++) { walk = walk * 0.25 + (R() - 0.5) * 0.5 * (L / n) * 1.5; const f = j / n; pts.push([s[0] + (ex - s[0]) * f + perp[0] * walk, s[1] + (ey - s[1]) * f + perp[1] * walk]); }
      pts.push([ex, ey]); polys.push({ pts: clipPoly(pts), kind: 0, start: si });
    });
  });
  const links = [[[0.78, 0.61], [0.56, 0.7], [0.42, 0.66]], [[0.13, 0.19], [0.29, 0.33], [0.42, 0.28]]];
  for (const l of links) {
    const m = l.map(([u, v]) => [gx(u), gy(v)]), pts = [m[0]];
    for (let i = 1; i < m.length; i++) { const a = m[i - 1], b = m[i], len = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len, j = (R() - 0.5) * 0.09 * len; pts.push([(a[0] + b[0]) / 2 + nx * j, (a[1] + b[1]) / 2 + ny * j]); pts.push(b); }
    polys.push({ pts: clipPoly(pts), kind: 1 });
  }
  // 12 side branches off the rays and links (every other one in the part of the glass the P4 camera sees)
  const cand = []; polys.forEach((p, pi) => p.pts.forEach((q, vi) => { if (vi > 0 && vi < p.pts.length - 1) cand.push({ pi, vi, q }); }));
  const inView = cand.filter((c) => c.q[0] > -0.7 && c.q[0] < 1.0 && c.q[1] > 0.2 && c.q[1] < 2.5);
  for (let b = 0; b < 12; b++) {
    const pool = b % 2 === 0 && inView.length ? inView : cand, c = pool[Math.floor(R() * pool.length)], p = polys[c.pi], a = p.pts[c.vi - 1], n = p.pts[c.vi + 1];
    const base = Math.atan2(n[1] - a[1], n[0] - a[0]) / DEG, ang = base + (R() < 0.5 ? 1 : -1) * (30 + 35 * R()), len = 0.12 + 0.26 * R(), pts = [c.q];
    let aa = ang; for (let k = 0; k < 2; k++) { const q = pts[pts.length - 1]; pts.push([q[0] + Math.cos(aa * DEG) * len / 2, q[1] + Math.sin(aa * DEG) * len / 2]); aa += (R() - 0.5) * 50; }
    const cp = clipPoly(pts); let at = 0, tot = 0; for (let i = 1; i <= c.vi; i++) at += Math.hypot(p.pts[i][0] - p.pts[i - 1][0], p.pts[i][1] - p.pts[i - 1][1]); for (let i = 1; i < p.pts.length; i++) tot += Math.hypot(p.pts[i][0] - p.pts[i - 1][0], p.pts[i][1] - p.pts[i - 1][1]);
    polys.push({ pts: cp, kind: 2, parent: c.pi, at: at / tot, idx: b });
  }
  // fine twigs: two short forks (.05-.12 m) on every ray, revealed with it
  const nRay = polys.length; for (let pi = 0; pi < nRay; pi++) { const p = polys[pi]; if (p.kind !== 0 || p.pts.length < 3) continue;
    for (let k = 0; k < 2; k++) { const vi = 1 + Math.floor(R() * (p.pts.length - 2)), a = p.pts[vi - 1], n = p.pts[vi + 1], q = p.pts[vi], base = Math.atan2(n[1] - a[1], n[0] - a[0]) / DEG, ang = base + (k ? 1 : -1) * (35 + 40 * R()), len = 0.05 + 0.07 * R();
      let at = 0, tot = 0; for (let i = 1; i <= vi; i++) at += Math.hypot(p.pts[i][0] - p.pts[i - 1][0], p.pts[i][1] - p.pts[i - 1][1]); for (let i = 1; i < p.pts.length; i++) tot += Math.hypot(p.pts[i][0] - p.pts[i - 1][0], p.pts[i][1] - p.pts[i - 1][1]);
      polys.push({ pts: clipPoly([q, [q[0] + Math.cos(ang * DEG) * len, q[1] + Math.sin(ang * DEG) * len]]), kind: 3, parent: pi, at: at / tot }); } }
  for (const p of polys) { let tot = 0; p.cum = [0]; for (let i = 1; i < p.pts.length; i++) { tot += Math.hypot(p.pts[i][0] - p.pts[i - 1][0], p.pts[i][1] - p.pts[i - 1][1]); p.cum.push(tot); } p.tot = tot; }
  return polys;
}
const GL_VS = `attribute float aSide; attribute float aHW; attribute vec3 aDir; attribute vec4 aCol; uniform float uMin; varying vec4 vC; varying float vE;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); float d = length(cameraPosition - wp.xyz); float hw = max(aHW, uMin * 2.0 * d / projectionMatrix[1][1]) * step(0.0001, aCol.a);
  vec3 n = vec3(-aDir.y, aDir.x, 0.0); vC = aCol; vE = aSide; gl_Position = projectionMatrix * viewMatrix * vec4(wp.xyz + n * aSide * hw, 1.0); }`;
const GL_FS = `varying vec4 vC; varying float vE; void main(){ float a = vC.a * smoothstep(0.0, 0.5, 1.0 - abs(vE)); gl_FragColor = vec4(vC.rgb, a);
#include <colorspace_fragment>
}`;
function glassKind(P_) {
  const S = P_.spec, CW = S.crackW ?? 3.2, breakAt = S.breakAt ?? TAB.breakAt;
  const polys = once(`glass${JSON.stringify(S.extraStarts ?? 0)}`, () => glassPlan([[0.78, 0.61], [0.14, 0.78], [0.13, 0.19], ...(S.extraStarts ?? [[0.58, 0.42], [0.38, 0.72]])]));
  const KMAX = 7, LAYERS = 2, nv = polys.length * LAYERS * KMAX * 2, pos = new Float32Array(nv * 3), dir = new Float32Array(nv * 3), hw = new Float32Array(nv), col = new Float32Array(nv * 4), side = new Float32Array(nv), idx = [];
  for (let s = 0; s < polys.length * LAYERS; s++) for (let j = 0; j < KMAX; j++) { const v = (s * KMAX + j) * 2; side[v] = -1; side[v + 1] = 1; if (j < KMAX - 1) idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); }
  const geo = new THREE.BufferGeometry();
  for (const [n, a, k] of [["position", pos, 3], ["aDir", dir, 3], ["aHW", hw, 1], ["aCol", col, 4]]) geo.setAttribute(n, new THREE.BufferAttribute(a, k).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute("aSide", new THREE.BufferAttribute(side, 1)); geo.setIndex(idx);
  const mat = noLine(new THREE.ShaderMaterial({ uniforms: { uMin: { value: 0.0005 } }, vertexShader: GL_VS, fragmentShader: GL_FS, transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide, fog: false }));
  const mesh = lookOnly(new THREE.Mesh(geo, mat), 900); P_.whole.add(mesh); mesh.visible = false;
  const CORE = lin("#493D46"), RIM = lin("#E9DBCF");
  let drawn = -1;
  const pointAt = (p, s, out) => { for (let i = 1; i < p.pts.length; i++) if (s <= p.cum[i] || i === p.pts.length - 1) { const k = p.cum[i] - p.cum[i - 1] > 0 ? clamp((s - p.cum[i - 1]) / (p.cum[i] - p.cum[i - 1])) : 0; out[0] = lerp(p.pts[i - 1][0], p.pts[i][0], k); out[1] = lerp(p.pts[i - 1][1], p.pts[i][1], k); return out; } out[0] = p.pts[0][0]; out[1] = p.pts[0][1]; return out; };
  const tmp = [0, 0], vtx = Array.from({ length: KMAX }, () => [0, 0]);
  return {
    grip: 0,
    apply(ps) {
      const t = ps.t ?? S.t ?? -1, g = P(TAB.glass[0], TAB.glass[1], t), on = t >= TAB.glass[0] && t < breakAt; mesh.visible = on; if (!on) return;
      const key = Math.round(g * 500); if (key === drawn) return; drawn = key;   // redrawn only while the cracks grow
      const reveal = k3(0, 0.6, 1, g), w = k3(0, 0.0013, 0.0025, g) * CW, nBr = k3(0, 3, 12, g);
      pos.fill(0); hw.fill(0); col.fill(0);
      polys.forEach((p, pi) => {
        let f = reveal, wm = 1;
        if (p.kind === 2) { f = clamp(nBr - p.idx); if (reveal < p.at) f = 0; wm = 0.7; } else if (p.kind === 3) { f = clamp((reveal - p.at) * 6) * (g > 0.5 ? clamp((g - 0.5) * 4) : 0); wm = 0.55; }
        if (f <= 0.001 || p.pts.length < 2) return;
        const target = p.tot * f;
        for (let j = 0; j < KMAX; j++) { const jj = Math.min(j, p.pts.length - 1); pointAt(p, Math.min(p.cum[jj], target), vtx[j]); }
        for (let l = 0; l < LAYERS; l++) for (let j = 0; j < KMAX; j++) {
          const v = ((pi * LAYERS + l) * KMAX + j) * 2, a = vtx[Math.max(0, j - 1)], b = vtx[Math.min(KMAX - 1, j + 1)], dx = b[0] - a[0], dy = b[1] - a[1], dl = Math.hypot(dx, dy) || 1;
          const along = p.tot > 0 ? Math.min(p.cum[Math.min(j, p.pts.length - 1)], target) / p.tot : 0, taper = (1.3 - 0.85 * along) * (p.kind === 0 || p.kind === 1 ? 1 : 0.9) * (1 - 0.7 * sstep(0.85, 1, along));
          const nx = -dy / dl, ny = dx / dl, keySide = nx * -0.7 + ny * 0.7 >= 0 ? 1 : -1, core = l === 1, hwv = (core ? w : w * 1.9) * 0.5 * taper * wm, off = core ? 0 : hwv * 0.45 * keySide;
          const c = core ? CORE : RIM, al = core ? 0.95 : 0.85 * 0.8;
          for (let sd = 0; sd < 2; sd++) { const o = v + sd; pos[o * 3] = vtx[j][0] + nx * off; pos[o * 3 + 1] = vtx[j][1] + ny * off; pos[o * 3 + 2] = GL.z; dir[o * 3] = dx / dl; dir[o * 3 + 1] = dy / dl; hw[o] = hwv; col[o * 4] = c[0]; col[o * 4 + 1] = c[1]; col[o * 4 + 2] = c[2]; col[o * 4 + 3] = al * (j > 0 && p.tot * f < 0.0001 ? 0 : 1); }
        }
      });
      void tmp;
      for (const n of ["position", "aDir", "aHW", "aCol"]) geo.getAttribute(n).needsUpdate = true;
    },
  };
}

export const GRAVSTRIKE_KINDS = { gentry: entryKind, gstrike: strikeKind, gglass: glassKind };
export const GRAVSTRIKE_TEST = { planStreaks, TAB, P3CAM };
