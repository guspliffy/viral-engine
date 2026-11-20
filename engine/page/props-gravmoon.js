import * as THREE from "three";

// props-gravmoon.js: fact what-if 02 gravity v2 (20 Nov 2026): the Moon falls (45-50 g), hits behind the city, a fire wall sweeps to the
// window and the room blows in on Spud. Design: storyboards/series/facts/02-gravity/DESIGN-v2.md "Rendering and continuity" and section D.
// Panels P7 (the cracked Moon sheds burning chunks), P8 (contact glare, fire wall racing at the camera), P9 (the window bursts inward).
// Bench: storyboards/series/facts/02-gravity/bench/make-moon-bench.mjs (sheet: moon-sheet.jpg).
//
// USAGE HEADER (the director reads only this).  World metres, +y up, the window looks toward -z (room window plane z -2.65, city
// ground y -60). Place every kind at x 0, y 0, z 0, rot 0, scale 1: every number below is a world number. Look-only (not solid, no shadow,
// steam, no ink line) except the bookshelf in groomhit, which is a normal lit room prop. Needs the storyboard key "far": 6000.
// ONE TIME PARAM for every kind: `t` = clip seconds. Tween it with the clip clock (seed it first so it never jumps):
//     c.prop(0, id, { t: 0 }, 0, "linear");  c.prop(0, id, { t: 64 }, 64, "linear");
// Default t = -1 = before everything (hidden / intact). Every DESIGN track P(a,b) is read off t with the DESIGN's absolute times (table TL
// below). Pure function of t: any frame in any order is the same picture (seed 26031; no Math.random, no clock).
//
//   gmoonfall  the falling Moon. Draws only while 48 <= t < 60.5 (the director shows the clean v1 gmoon before 48 and hides it at 60.5).
//              A real sphere (depth-tested, so ruins and the fire wall stand in front of it) on x -52, z -2500; fall = P(48,56) keys 0 / .5 / 1:
//              centre Y 1750 / 1660 / 1540, radius 266 / 953 / 1600 (10 / 37 / 66 deg seen from (0,0,0)); holds the fall = 1 transform to 60.5.
//              Atlas: 16 craters + maria + mottling in #CF9E83 lit / #A67F7E maria / #6A556A shade / #FFD5A9 rim, three diffuse bands
//              (.50 / .76 / 1.00 at N.L .18 / .58), lit from the upper left; the underside warms with the fire after 56 s. Fracture network in
//              atlas UV: 5 primaries from (.53,.58) to (.18,.35) (.39,.08) (.78,.12) (.91,.54) (.63,.94) with 3 bends each + 15 children,
//              revealed parent to child 8 / 60 / 100 %, width .001 / .005 / .012 of the disc, core #4E3A47, heated rim #F18454 -> #FFC890.
//              10 silhouette notches (depth .025-.06 of the radius, reached at the chunk release); 28 chunks released 48.55..55.20
//              (diameter 18-98 m x spec.chunkScale, life .75-1.7 s, down 0 / 140-310 / 380-790 m, outward 0 / 45-190 / 110-420 m, roll 0 / 55 / 150
//              deg, trail 0 / 180-440 / 60 m, alpha 0 / .97 / 0, core #FFF1C3, shell #FFAD55 / #E8592B) with a hot head glow, a 3-layer
//              ribbon, 3 smoke puffs, and a ground ember where one lands (end Y >= -60); 18 cloud wisps within 900 m of the axis, lifted
//              0 / 160 / 410 m x (1 - r / 900) and pulled .25 x toward the axis, burned off by the wave.
//              spec: from [.2,1.5,0] (fixes the atlas frame), chunkScale 2 (the design's 18-98 m chunks are 3-9 px at 2500 m; this
//              multiplies their size and glow only, 1 = design), cam { pos } for the painter's order of the sprites (default P7 [.34,1.12,.94]),
//              crackW .5 (multiplies the crack width; the design's .012 is 1.2 % of the disc, a 40 px stripe when the Moon fills P8).
//   gfirewall  the impact wave. Draws only while 56 <= t < 60.5. impact = P(56,60.5), front r = 3420 x impact m (760 m/s) from the contact
//              (-52,-60,-2500). contact glare P(56,56.48): flare diameters 40 / 460 / 160 m, alpha 1 / .95 / 0, core #FFFDF4, ring #FFC174, plus a
//              horizontal flare bar (the blinding contact line). 32-segment opaque ground sweep band (front edge #FFF8E7, inner wall #FFD58C,
//              trailing burn #FF733F / #91372F, fading into the scorched ground #37252D) 3 x width deep behind the front, lifted 1.5 m
//              (depth precision at 2500 m), polygon-offset; 64 flame cards x 3 tongues (32 x 64 two-tone flame sprites, flicker scale .84 -> 1.10
//              -> .84 every .46 s), 20 of them held across the part of the ring P8 sees (they ride the same radial speed and follow the visible
//              width), wall height 22 / 155 / 215 m, radial width 8 / 94 / 180 m, edge alpha 1 / .96 / .60 at impact 0 / .5 / 1; hot smoke behind
//              the front (#886063 / #2E222C), a smoke column at the contact, 40 embers, a hot-horizon glow. Needs gruin underneath (the erase
//              of the city is gruin's). spec: cam { pos } default the P8 camera [.15,1.91,-2.58] (visible-arc width + painter's order),
//              fov 53, glare 2 (multiplies the contact glare diameters; 1 = the design's 40 / 460 / 160 m, which is a 40 px dot at 2500 m).
//   groomhit   the room hit at spec.troom (default 59.287). Hidden from 60.5 on. Before troom ONLY the bookshelf shows.
//              Bookshelf .65 x 1.35 x .26, wood #75513E, 5 boards, 4 bays of books, origin = the floor under its middle, default at
//              spec.shelf [-1.53, .675, -1.90] (x, centre y, z; it faces +z); spec.shelfOn false hides it. roomHit = P(troom, 60.5): it is
//              thrown by (+.10,-.10,+.65) at .5 and (+.27,-.32,+1.28) at 1 (x, y, z of the shelf centre) and tips about its bottom edge 24 / 58 deg
//              (top toward +z; the y offset keeps its lowest corner on the floor).
//              96 glass shards from the opening (24 hero .11-.29 m, 72 small .025-.11 m; #D3E1E8, strokes #F1FAF7, inner opacity .26): start points
//              spread from gglass's crack points (.78,.61) (.14,.78) (.13,.19) (.56,.70) (.42,.66) (.29,.33) (.42,.28) (.58,.42) (.38,.72) and
//              across the opening (a .013 strip along the edges and the mullions stay clear), vz 6-17, vx -4..4, vy .5-6.2 m/s, drop 4.9 tau^2,
//              spin 0 / 95-170 / 190-340 deg, alpha .85 / .68 / 0 over shardAge = P(troom, troom + .72), fading where they first meet floor, ceiling,
//              side wall or sofa; planned so none passes within .45 m of Spud's face (.46,.75,-1.45) in front of it or within .3 m of the P9 camera.
//              28 wood pieces (#75513E) from the frame and mullions, 12 stuffing tufts (#D5C5B1) from the sofa, 12 dust sprites (#B9A099), moving
//              with roomHit: offsets 0 / .3-.8 m into the room and .1-.5 up / .7-1.8 into the room and on the floor or the sofa; deflection
//              0 / 55-120 / 110-240 deg; 5 rows x 8 dust puffs covering .75 of the opening by 60.5.
//              Needs the sofa param `brk` (below) and the plant and lamp tweens by the director, over roomHit = P(troom, 60.5) (c.prop at troom
//              to x/y/z at 60.5, linear; the middle key at the half time (troom + 60.5) / 2 = 59.89):
//                 gplant (placed at (-1.40,.09,-2.48)): x/y/z offsets (+.22,+.20,+.64) at .5 and (+.38,-.05,+1.45) at 1 (the design's exact numbers).
//                 glamp (origin on the floor at (1.45,0,-2.12); shade at (1.16,2.01,-2.12) = the origin + (-.29,2.01)): the design moves the SHADE by
//                   (-.24,+.30,+.70) at .5 and (-.48,-.38,+1.60) at 1 with roll 38 / 82 deg (roll is about the origin, prop key `roll`, positive tips the top
//                   toward -x). The origin offsets that put the shade there: (+.94,+.91,+.70) at .5 and (+1.26,+1.64,+1.60) at 1.
//   gflash     a camera-attached white card like gtunnel: spec.cam = { pos, look, fov, aspect } (the P9 camera, static shot), drawn over
//              everything (renderOrder 1000), colour #FFFDF4, alpha = P(troom, troom + .52) keys 0 / .8 at .12 / .4 at .4 / .2 at .70 / .12 at 1 (director: below the design, so the shards show),
//              then it decays .12 -> .04 to 60.5 (so Spud's silhouette shows through it); 0 before troom and from 60.5 on. spec.troom as above.
//   gsofa (props-gravroom.js)  new param brk 0..1 = roomHit (seed it c.prop(0,"sofa",{brk:0},0), then brk 1 at 60.5): the back drops .24 / .43,
//              the back panel splits in two, the back cushions tip about their lower edge, the split seat cushions flare outward .25 m (inner
//              edges stay under Spud), the arms splay. brk 0 renders exactly as before.
// Cost (720 x 1280 draft, on top of the set): gmoonfall one sphere (14k tris, one full-screen fragment pass) + about 140 sprites and 28 rocks;
// gfirewall one ground band + about 300 sprites; groomhit 96 + 28 instances, 64 sprites and a 100-box bookshelf; every buffer is updated
// in place (no allocation, no per-particle lights, no shadows except the bookshelf in the room's own lights).

const SEED = 26031, TAU = Math.PI * 2, DEG = Math.PI / 180, GY = -60;
// ---- the DESIGN's absolute times and numbers (one table)
const TL = {
  fall: [48, 56], end: 60.5, troom: 59.287,
  mx: -52, mz: -2500, Y: [1750, 1660, 1540], R: [266, 953, 1600],
  reveal: [0.08, 0.6, 1], wid: [0.001, 0.005, 0.012], lift: [0, 160, 410], liftR: 900,
  chunkT: [48.55, 55.2], chunkL: [0.75, 1.7], chunkEnd: 56.5, nChunks: 28, nNotch: 10, nWisps: 18, dia: [18, 98],
  impact: [56, 60.5], v: 760, contact: [56, 56.48], flareD: [40, 460, 160], flareA: [1, 0.95, 0], glareAt: [-52, -38, -2500],
  H: [22, 155, 215], W: [8, 94, 180], eA: [1, 0.96, 0.6], cycle: 0.46,
  shard: 0.72, hit: [0.24, 0.43], whiteKeys: [[0, 0], [0.12, 0.8], [0.4, 0.4], [0.7, 0.2], [1, 0.12]], whiteLen: 0.52,   // director: lower than the design's .96/.86, which hid the shards for .3 s
};
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const Pk = (a, b, t) => clamp((t - a) / (b - a));
const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const fr = (x) => x - Math.floor(x);
const tri = (x) => 1 - Math.abs(2 * fr(x) - 1);
const pw = (pts, k) => { for (let i = 1; i < pts.length; i++) if (k <= pts[i][0] || i === pts.length - 1) { const [a, va] = pts[i - 1], [b, vb] = pts[i]; return lerp(va, vb, clamp((k - a) / (b - a))); } return pts[0][1]; };
const k3 = (a, b, c, u) => (u < 0.5 ? lerp(a, b, u * 2) : lerp(b, c, (u - 0.5) * 2));   // keys at 0 / .5 / 1, linear between
const q3 = (a, b, c, x) => a * 2 * (x - 0.5) * (x - 1) + b * -4 * x * (x - 1) + c * 2 * x * (x - 0.5);   // quadratic through (0,a) (.5,b) (1,c)
function rngOf(seed) { let s = (seed >>> 0) || 1; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mix3 = (o, a, b, k) => { o[0] = a[0] + (b[0] - a[0]) * k; o[1] = a[1] + (b[1] - a[1]) * k; o[2] = a[2] + (b[2] - a[2]) * k; return o; };
function lookOnly(me, order) { me.castShadow = me.receiveShadow = false; me.frustumCulled = false; me.userData.solid = false; me.userData.lookOnly = true; me.userData.steam = true; if (order != null) me.renderOrder = order; return me; }
const noLine = (m) => { m.userData.noOutline = true; m.userData.noHatch = true; return m; };
const memo = new Map(), once = (k, make) => { if (!memo.has(k)) memo.set(k, make()); return memo.get(k); };
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
// director (Sol r1 item 1): after contact the Moon keeps going down into the ground (the opaque ground hides what is below it),
// so the disc's lower edge never hangs above the flash; 300 m/s from 56 s
const moonAt = (t) => { const f = Pk(TL.fall[0], TL.fall[1], t); return { f, Y: k3(...TL.Y, f) - 300 * Math.max(0, Math.min(t, TL.end) - TL.fall[1]), R: k3(...TL.R, f) }; };
const tmpA = [0, 0, 0], tmpB = [0, 0, 0];

// ============================================================================================================== sprite atlas
// 256 x 384: top 256 x 256 = four 128 px three-lobe billows (R light, G alpha), bottom = four 64 x 128 two-tone flames (R heat, G alpha).
function atlas() {
  return once("atlas", () => {
    const W = 256, H = 384, [c, g] = canvas(W, H), img = g.createImageData(W, H), d = img.data;
    for (let i = 0; i < W * H; i++) { d[i * 4 + 2] = 255; d[i * 4 + 3] = 255; }
    for (let v = 0; v < 4; v++) {   // billows
      const R = rngOf(SEED + 900 + v * 13), lobes = [];
      for (let k = 0; k < 4; k++) lobes.push([0.5 + (k - 1.5) * 0.17 + (R() - 0.5) * 0.06, 0.5 + (R() - 0.5) * 0.14 - (k === 1 || k === 2 ? 0.07 : 0), 0.22 + R() * 0.07, R() * TAU]);
      lobes.push([0.5 + (R() - 0.5) * 0.1, 0.42 + R() * 0.05, 0.2, R() * TAU]);
      const ox = (v % 2) * 128, oy = Math.floor(v / 2) * 128;
      for (let py = 0; py < 128; py++) for (let px = 0; px < 128; px++) {
        const x = (px + 0.5) / 128, y = 1 - (py + 0.5) / 128;
        let dens = 0, best = 0, nx = 0, ny = 0;
        for (const [cx, cy, r, ph] of lobes) {
          const dx = (x - cx) / r, dy = (y - cy) / r, ang = Math.atan2(dy, dx), rr = Math.hypot(dx, dy) / (1 + 0.14 * Math.sin(ang * 3 + ph) + 0.07 * Math.sin(ang * 7 + ph * 2));
          const val = clamp((1 - rr) / 0.7), s = val * val * (3 - 2 * val);
          dens = 1 - (1 - dens) * (1 - s);
          if (s > best) { best = s; nx = dx; ny = dy; }
        }
        const nl = Math.hypot(nx, ny) || 1, lit = clamp(0.5 + 0.5 * ((nx / nl) * -0.55 + (ny / nl) * 0.83) * clamp(nl * 1.2)) * (0.78 + 0.22 * y) + 0.12 * (1 - clamp(nl * 1.5));
        const i = ((oy + py) * W + ox + px) * 4; d[i] = Math.min(255, lit * 255); d[i + 1] = clamp(dens) * 255;
      }
    }
    for (let v = 0; v < 4; v++) {   // flames: a main tongue and two lower side tongues, wavy edges
      const R = rngOf(SEED + 940 + v * 7), tg = [[0.5 + (R() - 0.5) * 0.06, 1, 0.36, R() * TAU], [0.27 + R() * 0.08, 0.6 + R() * 0.1, 0.24, R() * TAU], [0.72 - R() * 0.08, 0.5 + R() * 0.12, 0.22, R() * TAU]];
      const ox = v * 64, oy = 256;
      for (let py = 0; py < 128; py++) for (let px = 0; px < 64; px++) {
        const x = (px + 0.5) / 64, y = 1 - (py + 0.5) / 128;
        let al = 0, heat = 0;
        for (const [c0, hh, w0, ph] of tg) {
          const yy = y / hh; if (yy > 1) continue;
          const cx = c0 + 0.1 * Math.sin(yy * 5.5 + ph) * yy, half = w0 * Math.pow(1 - yy, 0.78) * (1 + 0.14 * Math.sin(yy * 16 + ph * 2)) * sstep(0, 0.07, y) * 0.5 + 0.0001;
          const a = clamp(1 - Math.abs(x - cx) / half), s = sstep(0, 0.45, a);
          al = Math.max(al, s); heat = Math.max(heat, a * (1 - yy * 0.62));
        }
        const i = ((oy + py) * W + ox + px) * 4; d[i] = clamp(heat) * 255; d[i + 1] = clamp(al) * 255;
      }
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 2; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t;
  });
}

// One instanced draw of camera-facing quads. attributes: aC centre, aS size (w,h m), aR roll, aA alpha, aD / aL two colours (linear), aP
// (profile, min size as a fraction of the screen height). Profiles 0-3: billow (aD dark > aL lit by the texture's R); 4-7: flame (aD outer,
// aL core, banded by heat); 10: radial glow (aD core, aL fringe); 11: horizontal flare. Normal blend = straight alpha, ADD = rgb x alpha added.
// put() stages a sprite, commit() sorts the staged sprites far to near from o.cam and uploads them.
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
vec2 cellUv(vec2 org, vec2 size, vec2 uv){ vec2 px = org + vec2(uv.x, 1.0 - uv.y) * size; return vec2(px.x / 256.0, 1.0 - px.y / 384.0); }
void main(){
  vec2 q = vUv * 2.0 - 1.0; float r = length(q); vec3 col; float a;
  if (vP < 3.5) {
    float v = floor(vP + 0.5); vec2 cell = vec2(mod(v, 2.0), floor(v / 2.0)) * 128.0;
    vec4 t = texture2D(uMap, cellUv(cell, vec2(128.0), vUv * 0.97 + 0.015));
    a = t.g * vA;
#ifdef ADD
    col = mix(vD, vL, t.r);
#else
    col = mix(vD, vL, pow(t.r, 2.3));
#endif
  } else if (vP < 7.5) {
    float v = floor(vP - 4.0 + 0.5);
    vec4 t = texture2D(uMap, cellUv(vec2(v * 64.0, 256.0), vec2(64.0, 128.0), vUv * 0.97 + 0.015));
    a = smoothstep(0.1, 0.34, t.g) * vA;
    col = mix(vD * 0.78, mix(vD, vL, smoothstep(0.38, 0.5, t.r)), smoothstep(0.02, 0.22, t.r));
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
  gl_FragColor = vec4(col, min(a, 1.0));
#endif
  #include <colorspace_fragment>
}`;
function makeBB(root, cap, o) {
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  const NAMES = [["aC", 3], ["aS", 2], ["aR", 1], ["aA", 1], ["aD", 3], ["aL", 3], ["aP", 2]], STR = 15, A = {}, ats = [];
  for (const [n, k] of NAMES) { const at = new THREE.InstancedBufferAttribute(new Float32Array(cap * k), k); at.setUsage(THREE.DynamicDrawUsage); geo.setAttribute(n, at); A[n] = at.array; ats.push(at); }
  geo.instanceCount = 0;
  const stg = new Float32Array(cap * STR), dist = new Float32Array(cap), ord = new Uint16Array(cap), cam = o.cam ?? [0, 0, 0];
  const mat = noLine(new THREE.ShaderMaterial({
    uniforms: { uMap: { value: atlas() }, uFade: { value: new THREE.Vector2(o.near?.[0] ?? -1, o.near?.[1] ?? 0) } }, vertexShader: BB_VS, fragmentShader: BB_FS, defines: o.add ? { ADD: 1 } : {},
    transparent: true, depthWrite: false, depthTest: o.depth !== false, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide, fog: false,
  }));
  const mesh = lookOnly(new THREE.Mesh(geo, mat), o.order); mesh.visible = false; root.add(mesh);
  return {
    n: 0, mesh,
    reset() { this.n = 0; },
    // x y z, size w h, roll, dark/outer colour, lit/core colour, alpha, profile, min size (fraction of the screen height)
    put(x, y, z, sx, sy, rot, cd, cl, a, prof, minf) {
      if (this.n >= cap || a <= 0.002) return;
      const i = this.n++, b = i * STR;
      stg[b] = x; stg[b + 1] = y; stg[b + 2] = z; stg[b + 3] = sx; stg[b + 4] = sy; stg[b + 5] = rot; stg[b + 6] = a;
      stg[b + 7] = cd[0]; stg[b + 8] = cd[1]; stg[b + 9] = cd[2]; stg[b + 10] = cl[0]; stg[b + 11] = cl[1]; stg[b + 12] = cl[2]; stg[b + 13] = prof; stg[b + 14] = minf;
      dist[i] = (x - cam[0]) ** 2 + (y - cam[1]) ** 2 + (z - cam[2]) ** 2;
    },
    commit() {
      const n = this.n; for (let i = 0; i < n; i++) ord[i] = i;
      if (o.sort !== false && n > 1) ord.subarray(0, n).sort((p, q) => (dist[q] - dist[p]) || (p - q));
      for (let j = 0; j < n; j++) {
        const b = ord[j] * STR;
        A.aC[j * 3] = stg[b]; A.aC[j * 3 + 1] = stg[b + 1]; A.aC[j * 3 + 2] = stg[b + 2]; A.aS[j * 2] = stg[b + 3]; A.aS[j * 2 + 1] = stg[b + 4]; A.aR[j] = stg[b + 5]; A.aA[j] = stg[b + 6];
        A.aD[j * 3] = stg[b + 7]; A.aD[j * 3 + 1] = stg[b + 8]; A.aD[j * 3 + 2] = stg[b + 9]; A.aL[j * 3] = stg[b + 10]; A.aL[j * 3 + 1] = stg[b + 11]; A.aL[j * 3 + 2] = stg[b + 12];
        A.aP[j * 2] = stg[b + 13]; A.aP[j * 2 + 1] = stg[b + 14];
      }
      geo.instanceCount = n; for (const at of ats) at.needsUpdate = true; mesh.visible = n > 0;
    },
  };
}

// camera-facing ribbons: slots x 3 layers x NS stations x 2 vertices, one draw, additive
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
  const mesh = lookOnly(new THREE.Mesh(geo, mat), order); mesh.visible = false; root.add(mesh);
  const LW = [1.6, 0.8, 0.3], LA = [0.55, 0.85, 1.0], C0 = [lin("#E8592B"), lin("#FFAD55"), lin("#FFF1C3")], C1 = [lin("#7A2A24"), lin("#E8592B"), lin("#FFAD55")];
  return {
    mesh,
    clear() { pos.fill(0); hw.fill(0); col.fill(0); },
    // a tapered streak in the slot: head (x,y,z), unit travel direction d (the trail lies behind it), trail length L, half-width at the head h0, opacity op
    streak(slot, x, y, z, dx, dy, dz, L, h0, op) {
      if (op <= 0.003 || L <= 0.01) return;
      for (let l = 0; l < LAY; l++) for (let j = 0; j < NS; j++) {
        const q = j / (NS - 1), v = ((slot * LAY + l) * NS + j) * 2, s = L * q, k = Math.pow(1 - q, 0.9);
        mix3(tmpA, C0[l], C1[l], q); const a = op * LA[l] * Math.pow(1 - q, 1.15), w = h0 * LW[l] * k;
        for (let sd = 0; sd < 2; sd++) { const p = v + sd; pos[p * 3] = x - dx * s; pos[p * 3 + 1] = y - dy * s; pos[p * 3 + 2] = z - dz * s; dir[p * 3] = dx; dir[p * 3 + 1] = dy; dir[p * 3 + 2] = dz; hw[p] = w; col[p * 4] = tmpA[0]; col[p * 4 + 1] = tmpA[1]; col[p * 4 + 2] = tmpA[2]; col[p * 4 + 3] = a; }
      }
    },
    commit() { for (const [n] of attrs) geo.getAttribute(n).needsUpdate = true; },
  };
}

// ============================================================================================================== Moon: atlas, cracks
function moonAlbedo() {
  return once("moonAlbedo", () => {
    const N = 2048, [c, g] = canvas(N, N), R = rngOf(SEED + 11), cx = N / 2;
    g.fillStyle = "#CF9E83"; g.fillRect(0, 0, N, N);
    for (const [u, v, r, a] of [[0.38, 0.35, 0.17, 0.75], [0.6, 0.27, 0.13, 0.7], [0.7, 0.5, 0.15, 0.65], [0.46, 0.6, 0.14, 0.75], [0.28, 0.64, 0.1, 0.65], [0.56, 0.78, 0.1, 0.65], [0.8, 0.7, 0.07, 0.6], [0.22, 0.42, 0.08, 0.6], [0.5, 0.45, 0.09, 0.45], [0.35, 0.18, 0.08, 0.55]]) {
      const gr = g.createRadialGradient(u * N, v * N, 0, u * N, v * N, r * N * 1.15);
      gr.addColorStop(0, `rgba(166,127,126,${a})`); gr.addColorStop(0.7, `rgba(166,127,126,${a * 0.75})`); gr.addColorStop(1, "rgba(166,127,126,0)"); g.fillStyle = gr; g.fillRect(0, 0, N, N);
    }
    for (let i = 0; i < 1700; i++) { const a = R() * TAU, rr = Math.sqrt(R()) * 0.5 * N, x = cx + Math.cos(a) * rr, y = cx + Math.sin(a) * rr, s = 3 + R() * 16; g.fillStyle = R() < 0.55 ? `rgba(150,112,116,${0.07 + R() * 0.1})` : `rgba(255,213,169,${0.06 + R() * 0.09})`; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill(); }
    // 16 big craters (diameters .03-.2 of the disc) and 110 small ones; lit rim on the upper left, shade lower right
    const crater = (x, y, r, k) => {
      g.fillStyle = `rgba(150,112,116,${0.5 * k})`; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      g.fillStyle = `rgba(106,85,106,${0.32 * k})`; g.beginPath(); g.arc(x + r * 0.14, y + r * 0.14, r * 0.8, 0, TAU); g.fill();
      g.strokeStyle = `rgba(255,213,169,${0.62 * k})`; g.lineWidth = Math.max(2, r * 0.1); g.beginPath(); g.arc(x, y, r, 1.0 * Math.PI, 1.6 * Math.PI); g.stroke();
      g.strokeStyle = `rgba(90,62,80,${0.34 * k})`; g.lineWidth = Math.max(2, r * 0.09); g.beginPath(); g.arc(x, y, r, 0, 0.55 * Math.PI); g.stroke();
    };
    for (let i = 0; i < 16; i++) { const a = R() * TAU, rr = Math.sqrt(R()) * 0.43 * N, d = (0.03 + 0.17 * R() ** 1.6) * N; crater(cx + Math.cos(a) * rr, cx + Math.sin(a) * rr, d / 2, 1); }
    for (let i = 0; i < 110; i++) { const a = R() * TAU, rr = Math.sqrt(R()) * 0.46 * N, d = (0.008 + 0.03 * R() ** 1.4) * N; crater(cx + Math.cos(a) * rr, cx + Math.sin(a) * rr, d / 2, 0.8); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  });
}
// the fracture network in atlas UV (u right, v up). Texture: R = s x a, G = a, where s = reveal order (parent to child, 0..1) and a = layered
// coverage (thin layers drawn last carry the higher a), so the shader can read the crack width by thresholding a and the order by R / G.
const CR_PRIM = [[0.18, 0.35], [0.39, 0.08], [0.78, 0.12], [0.91, 0.54], [0.63, 0.94]], CR_O = [0.53, 0.58], CR_LAYERS = 8, CR_W0 = 0.012 * 2.4 * 2048, CR_RATIO = 0.62;
function crackPlan() {
  return once("crackPlan", () => {
    const R = rngOf(SEED + 23), paths = [];
    const jag = (a, b, n, amp, s0, s1, sOf) => {   // n sub-segments between a and b, perpendicular jitter
      const out = [], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      for (let k = 0; k <= n; k++) { const t = k / n, j = k === 0 || k === n ? 0 : (R() - 0.5) * 2 * amp; out.push([a[0] + dx * t + nx * j, a[1] + dy * t + ny * j, lerp(s0, s1, t)]); }
      return out;
    };
    const prim = CR_PRIM.map((T) => {
      const verts = [CR_O]; for (let k = 1; k <= 3; k++) { const t = k / 4, nx = -(T[1] - CR_O[1]), ny = T[0] - CR_O[0], nl = Math.hypot(nx, ny) || 1, j = (R() - 0.5) * 0.09; verts.push([lerp(CR_O[0], T[0], t) + (nx / nl) * j, lerp(CR_O[1], T[1], t) + (ny / nl) * j]); } verts.push(T);
      let tot = 0; const acc = [0]; for (let i = 1; i < verts.length; i++) { tot += Math.hypot(verts[i][0] - verts[i - 1][0], verts[i][1] - verts[i - 1][1]); acc.push(tot); }
      const pts = []; for (let i = 1; i < verts.length; i++) { const seg = jag(verts[i - 1], verts[i], 6, 0.0045, 0.62 * acc[i - 1] / tot, 0.62 * acc[i] / tot); if (i > 1) seg.shift(); pts.push(...seg); }
      paths.push({ pts }); return { verts, acc, tot };
    });
    for (let i = 0; i < 15; i++) {   // 15 children, three per primary, off the bends and the middle of the first and last legs
      const p = prim[i % 5], vi = [1, 2, 3][Math.floor(i / 5)], a = p.verts[vi - 1], b = p.verts[vi + 1], base = Math.atan2(b[1] - a[1], b[0] - a[0]), side = (i % 2 ? 1 : -1) * (Math.floor(i / 5) % 2 ? -1 : 1);
      const s0 = 0.62 * p.acc[vi] / p.tot + 0.03, len = 0.08 + 0.13 * R(), pts = [], q0 = p.verts[vi]; let ang = base + side * (28 + R() * 34) * DEG, x = q0[0], y = q0[1];
      const nseg = 3, vs = [[x, y]]; for (let k = 0; k < nseg; k++) { x += Math.cos(ang) * len / nseg; y += Math.sin(ang) * len / nseg; ang += (R() - 0.5) * 0.9; vs.push([x, y]); }
      for (let k = 1; k <= nseg; k++) { const seg = jag(vs[k - 1], vs[k], 4, 0.003, lerp(s0, Math.min(1, s0 + 0.4), (k - 1) / nseg), lerp(s0, Math.min(1, s0 + 0.4), k / nseg)); if (k > 1) seg.shift(); pts.push(...seg); }
      paths.push({ pts });
    }
    return paths;
  });
}
function crackTexture() {
  return once("crackTex", () => {
    const N = 2048, [c, g] = canvas(N, N), paths = crackPlan();
    g.fillStyle = "#000"; g.fillRect(0, 0, N, N); g.lineCap = "round"; g.lineJoin = "round";
    for (let l = 0; l < CR_LAYERS; l++) {
      const w = CR_W0 * Math.pow(CR_RATIO, l), a = (l + 1) / CR_LAYERS; g.lineWidth = Math.max(w, 1.2);
      for (const { pts } of paths) for (let i = 1; i < pts.length; i++) {
        const s = (pts[i][2] + pts[i - 1][2]) / 2, R8 = Math.round(255 * s * a), G8 = Math.round(255 * a);
        g.strokeStyle = `rgb(${R8},${G8},0)`; g.beginPath(); g.moveTo(pts[i - 1][0] * N, (1 - pts[i - 1][1]) * N); g.lineTo(pts[i][0] * N, (1 - pts[i][1]) * N); g.stroke();
      }
    }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t;
  });
}
const crackThr = (wpx) => clamp((Math.log(Math.max(wpx, 0.5) / CR_W0) / Math.log(CR_RATIO) + 1) / CR_LAYERS - 0.03, 0.04, 0.985);   // coverage threshold for a crack this wide (px at 2048)

const MOON_VS = `uniform vec4 uNotch[10]; uniform float uSig[10]; uniform vec3 uAx; uniform vec3 uAy; uniform vec3 uAz;
varying vec3 vN; varying vec3 vNw; varying vec3 vW; varying float vNd;
void main(){
  vec3 n = normalize(position); float dsp = 0.0;
  for (int i = 0; i < 10; i++) { float a = acos(clamp(dot(n, uNotch[i].xyz), -1.0, 1.0)); dsp += uNotch[i].w * exp(-a * a / (2.0 * uSig[i] * uSig[i])); }
  vNd = dsp; vec4 wp = modelMatrix * vec4(n * (1.0 - dsp), 1.0);
  vW = wp.xyz; vNw = n; vN = vec3(dot(n, uAx), dot(n, uAy), dot(n, uAz));
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const MOON_FS = `uniform sampler2D uAlb; uniform sampler2D uCrk; uniform vec3 uLd; uniform vec3 uShade; uniform vec3 uRim; uniform vec3 uCoreC; uniform vec3 uHot0; uniform vec3 uHot1; uniform vec3 uFire; uniform vec3 uHaze;
uniform float uReveal; uniform float uThrC; uniform float uThrR; uniform float uHeat; uniform float uUp;
varying vec3 vN; varying vec3 vNw; varying vec3 vW; varying float vNd;
void main(){
  vec2 uv = 0.5 + 0.5 * vN.xy;
  vec3 alb = texture2D(uAlb, uv).rgb;
  float nl = dot(vN, uLd);
  float band = 0.5 + 0.26 * smoothstep(0.15, 0.21, nl) + 0.24 * smoothstep(0.55, 0.61, nl);
  vec3 c = alb * band;
  c = mix(c, uShade * (0.7 + 0.3 * band), (1.0 - smoothstep(-0.08, 0.2, nl)) * 0.75);
  float f = clamp(dot(vNw, normalize(cameraPosition - vW)), 0.0, 1.0);
  c += uRim * pow(1.0 - f, 3.0) * smoothstep(-0.1, 0.45, nl) * 0.42;
  // fire light from the ground under the contact, and dusk haze low down
  float g = 1.0 - smoothstep(-60.0, 2300.0, vW.y);
  c = mix(c, c * vec3(1.7, 0.7, 0.38) + uFire * 0.34 * g, clamp((0.25 + 0.75 * g) * uUp, 0.0, 1.0));
  c = mix(c, uHaze, 0.2 * (1.0 - smoothstep(-60.0, 450.0, vW.y)) * (1.0 - uUp));
  // the fracture network
  vec4 ck = texture2D(uCrk, uv); float a = ck.g; float s = ck.r / max(a, 0.004);
  float vis = 1.0 - smoothstep(uReveal - 0.025, uReveal + 0.005, s);
  float rim = smoothstep(uThrR - 0.07, uThrR + 0.03, a) * vis, core = smoothstep(uThrC - 0.07, uThrC + 0.03, a) * vis;
  vec3 hot = mix(uHot0, uHot1, uHeat);
  c = mix(c, hot * 1.15, rim * 0.9);
  c = mix(c, mix(uCoreC, hot, 0.04 + 0.08 * uHeat), core);
  // freshly broken notches glow
  c = mix(c, hot * 1.05, smoothstep(0.012, 0.045, vNd) * 0.7);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;
const DUST = { lit: lin("#DEBFB0"), mid: lin("#A3959B"), dark: lin("#756C7A") }, SMOKE = { dark: lin("#2E222C"), lit: lin("#886063"), dark2: lin("#5E464A") };
const FIRE_C = { core: lin("#FFF8E7"), wall: lin("#FFD58C"), mid: lin("#FF733F"), back: lin("#91372F"), scorch: lin("#37252D"), yel: lin("#FFF1B4"), orange: lin("#FFAB52"), red: lin("#D95831") };

// ============================================================================================================== gmoonfall
function rockGeo() {
  return once("rockGeo", () => {
    const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position, R = rngOf(SEED + 77), cache = new Map();
    for (let i = 0; i < p.count; i++) {
      const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`; if (!cache.has(key)) cache.set(key, 0.72 + 0.5 * R());
      const k = cache.get(key); p.setXYZ(i, p.getX(i) * k * (1 + 0.15), p.getY(i) * k * 0.82, p.getZ(i) * k);
    }
    const ng = g.toNonIndexed(); ng.computeVertexNormals(); return ng;
  });
}
const ROCK_VS = `varying vec3 vN; varying float vH;
void main(){
  mat4 im = instanceMatrix; vN = normalize(mat3(modelMatrix) * mat3(im) * normal);
#ifdef USE_INSTANCING_COLOR
  vH = instanceColor.r;
#else
  vH = 0.0;
#endif
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * im * vec4(position, 1.0);
}`;
const ROCK_FS = `uniform vec3 uL; uniform vec3 uLit; uniform vec3 uDark; uniform vec3 uHot; varying vec3 vN; varying float vH;
void main(){
  float nl = dot(normalize(vN), uL); float band = 0.5 + 0.26 * smoothstep(0.15, 0.21, nl) + 0.24 * smoothstep(0.55, 0.61, nl);
  vec3 c = mix(uDark, uLit, band); float up = clamp(-vN.y * 0.7 + 0.3, 0.0, 1.0);
  c = mix(c, uHot, clamp(vH * (0.3 + 0.7 * up), 0.0, 1.0)); c += uHot * 0.25 * vH;
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;
function moonKind(P_) {
  const S = P_.spec, G = P_.whole, cs = S.chunkScale ?? 2, camP = S.cam?.pos ?? [0.34, 1.12, 0.94];
  const from = new THREE.Vector3(...(S.from ?? [0.2, 1.5, 0]));
  // the Moon's frame (fixed): az toward the observer from the mid-fall centre, ay = up projected, ax = ay x az
  const az = from.clone().sub(new THREE.Vector3(TL.mx, TL.Y[1], TL.mz)).normalize(), ay = new THREE.Vector3(0, 1, 0).addScaledVector(az, -az.y).normalize(), ax = new THREE.Vector3().crossVectors(ay, az);
  // 28 chunks: anchors on the camera-facing lower hemisphere within 48 deg of the projected nadir
  const Rc = rngOf(SEED + 501), nd = az.clone().multiplyScalar(Math.cos(40 * DEG)).addScaledVector(ay, -Math.sin(40 * DEG)).normalize();
  const e1 = new THREE.Vector3().crossVectors(nd, ay).normalize(), e2 = new THREE.Vector3().crossVectors(nd, e1).normalize();
  const chunks = [];
  for (let k = 0; k < TL.nChunks; k++) {
    const T = lerp(TL.chunkT[0], TL.chunkT[1], k / (TL.nChunks - 1)), L = Math.min(lerp(TL.chunkL[0], TL.chunkL[1], Rc()), TL.chunkEnd - T);
    const th = 48 * DEG * Math.sqrt(Rc()), ph = TAU * Rc(), dir = nd.clone().multiplyScalar(Math.cos(th)).addScaledVector(e1, Math.sin(th) * Math.cos(ph)).addScaledVector(e2, Math.sin(th) * Math.sin(ph)).normalize();
    const m = moonAt(T), p = new THREE.Vector3(TL.mx, m.Y, TL.mz).addScaledVector(dir, m.R), dia = lerp(TL.dia[0], TL.dia[1], Math.pow(Rc(), 1.3));
    const d1 = lerp(140, 310, Rc()), d2 = Math.max(lerp(380, 790, Rc()), d1 + 80), r1 = lerp(45, 190, Rc()), r2 = Math.max(lerp(110, 420, Rc()), r1 + 30), t50 = lerp(180, 440, Rc());
    let ox = p.x - TL.mx, oz = p.z - TL.mz; const ol = Math.hypot(ox, oz); if (ol < 8) { ox = 0.2; oz = 1; } else { ox /= ol; oz /= ol; }
    const ol2 = Math.hypot(ox, oz); ox /= ol2; oz /= ol2;
    const axis = new THREE.Vector3(Rc() - 0.5, Rc() - 0.5, Rc() - 0.5).normalize();
    chunks.push({ T, L, p, dia: dia * cs, d1, d2, r1, r2, t50, ox, oz, axis, dir, ph: Rc() * TAU });
  }
  const notchK = Array.from({ length: TL.nNotch }, (_, j) => Math.round(j * (TL.nChunks - 1) / (TL.nNotch - 1))), Rn = rngOf(SEED + 502);
  const notches = notchK.map((k) => ({ k, depth: lerp(0.025, 0.06, Rn()), sig: lerp(0.03, 0.055, Rn()) }));
  // wisps: 18 within 900 m of the axis
  const Rw = rngOf(SEED + 503), wisps = Array.from({ length: TL.nWisps }, () => { const r = 60 + 840 * Math.sqrt(Rw()), a = TAU * Rw(); return { r, a, y: GY + 4 + 30 * Rw(), w: 300 + 300 * Rw(), v: Math.floor(Rw() * 4), ph: Rw() }; });

  const U = {
    uAlb: { value: moonAlbedo() }, uCrk: { value: crackTexture() }, uAx: { value: ax }, uAy: { value: ay }, uAz: { value: az },
    uLd: { value: new THREE.Vector3(-0.68, 0.5, 0.54).normalize() }, uShade: { value: new THREE.Vector3(...lin("#6A556A")) }, uRim: { value: new THREE.Vector3(...lin("#FFD5A9")) },
    uCoreC: { value: new THREE.Vector3(...lin("#4E3A47")) }, uHot0: { value: new THREE.Vector3(...lin("#F18454")) }, uHot1: { value: new THREE.Vector3(...lin("#FFC890")) },
    uFire: { value: new THREE.Vector3(...lin("#FF8A3C")) }, uHaze: { value: new THREE.Vector3(...lin("#7a5c76")) },
    uReveal: { value: 0.08 }, uThrC: { value: 0.9 }, uThrR: { value: 0.8 }, uHeat: { value: 0 }, uUp: { value: 0 },
    uNotch: { value: Array.from({ length: 10 }, () => new THREE.Vector4()) }, uSig: { value: new Array(10).fill(0.06) },
  };
  const moon = lookOnly(new THREE.Mesh(new THREE.SphereGeometry(1, 144, 96), noLine(new THREE.ShaderMaterial({ uniforms: U, vertexShader: MOON_VS, fragmentShader: MOON_FS, depthTest: true, depthWrite: false, fog: false }))), 10);   // after the opaque city and room (they cover it), no depth written: the fire, glare and flames of the wave draw over it
  moon.visible = false; G.add(moon);
  notches.forEach((n, i) => { U.uNotch.value[i].set(chunks[n.k].dir.x, chunks[n.k].dir.y, chunks[n.k].dir.z, 0); U.uSig.value[i] = n.sig; });
  // chunks: rocks, ribbons, sprites
  const rockM = noLine(new THREE.ShaderMaterial({ uniforms: { uL: { value: new THREE.Vector3(-0.68, 0.5, 0.54).normalize() }, uLit: { value: new THREE.Vector3(...lin("#A07C7A")) }, uDark: { value: new THREE.Vector3(...lin("#3F3040")) }, uHot: { value: new THREE.Vector3(...lin("#FF7A30")) } }, vertexShader: ROCK_VS, fragmentShader: ROCK_FS, fog: false }));
  const rocks = new THREE.InstancedMesh(rockGeo(), rockM, TL.nChunks); rocks.instanceMatrix.setUsage(THREE.DynamicDrawUsage); rocks.setColorAt(0, new THREE.Color(1, 0, 0)); rocks.instanceColor.setUsage(THREE.DynamicDrawUsage);
  lookOnly(rocks, 20); rocks.visible = false; G.add(rocks);
  const rib = makeRibbons(G, TL.nChunks, 10, 30, 0.0016), smoke = makeBB(G, 160, { order: 25, cam: camP }), glow = makeBB(G, 320, { order: 35, cam: camP, add: true });
  const q = new THREE.Quaternion(), m4 = new THREE.Matrix4(), sc = new THREE.Vector3(), pos = new THREE.Vector3(), nxt = new THREE.Vector3(), dv = new THREE.Vector3(), td = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  const C_CORE = lin("#FFF1C3"), C_SHELL = lin("#FFAD55"), C_RED = lin("#E8592B");
  const chunkPos = (c, a, out) => { const dn = k3(0, c.d1, c.d2, a), rd = k3(0, c.r1, c.r2, a); out.set(c.p.x + c.ox * rd, c.p.y - dn, c.p.z + c.oz * rd); return out; };
  return {
    grip: 0,
    apply(ps) {
      const t = ps.t ?? S.t ?? -1, on = t >= TL.fall[0] && t < TL.end;
      moon.visible = on; smoke.reset(); glow.reset(); rib.clear();
      if (!on) { rocks.visible = false; smoke.commit(); glow.commit(); rib.mesh.visible = false; return; }
      const { f, Y, R } = moonAt(t);
      moon.position.set(TL.mx, Y, TL.mz); moon.scale.setScalar(R);
      U.uReveal.value = k3(...TL.reveal, f);
      const wf = k3(...TL.wid, f) * (S.crackW ?? 0.5);
      U.uThrC.value = crackThr(wf * 2048); U.uThrR.value = crackThr(wf * 1.5 * 2048); U.uHeat.value = f;
      U.uUp.value = 0.1 * f + 0.85 * sstep(56, 56.5, t) - 0.12 * Pk(58.5, 60.5, t);
      notches.forEach((n, i) => { const c = chunks[n.k]; U.uNotch.value[i].w = n.depth * sstep(c.T - 0.45, c.T + 0.08, t); });
      // chunks
      let nr = 0; rocks.visible = true;
      for (let k = 0; k < chunks.length; k++) {
        const c = chunks[k], a = Pk(c.T, c.T + c.L, t);
        if (t < c.T || a >= 1) { sc.set(0, 0, 0); m4.compose(pos.set(0, -9999, 0), q.identity(), sc); rocks.setMatrixAt(k, m4); continue; }
        chunkPos(c, a, pos); const buried = pos.y <= GY + c.dia * 0.15; if (buried) pos.y = GY + c.dia * 0.15;
        chunkPos(c, Math.min(1, a + 0.02), nxt); dv.copy(nxt).sub(pos); if (dv.lengthSq() < 1e-6) dv.set(0, -1, 0); dv.normalize(); td.set(dv.x * 0.5, dv.y, dv.z * 0.25).normalize();   // the trail leans on the fall, not on the move toward the camera (end-on ribbons are wedges)
        const op = pw([[0, 0], [0.5, 0.97], [1, 0]], a), trail = pw([[0, 0], [0.5, c.t50], [1, 60]], a), rad = c.dia * 0.5 * (1 - 0.55 * sstep(0.8, 1, a));
        q.setFromAxisAngle(c.axis, k3(0, 55, 150, a) * DEG); sc.setScalar(buried ? rad * (1 - sstep(0.0, 0.2, a - 0.6)) : rad);
        m4.compose(pos, q, sc); rocks.setMatrixAt(k, m4); rocks.instanceColor.setXYZ(k, 0.38 + 0.1 * Math.sin(t * 17 + c.ph), 0, 0);
        const w = c.dia * 0.62;
        if (!buried) {
          rib.streak(k, pos.x, pos.y, pos.z, td.x, td.y, td.z, trail * cs * 1.5, w * 1.1, op);
          for (let j = 0; j < 3; j++) { const s2 = trail * cs * (0.25 + 0.3 * j), off = c.dia * 0.5 * Math.sin(c.ph * 3 + j * 2.1 + t * 9); glow.put(pos.x - td.x * s2 + off, pos.y - td.y * s2 + off * 0.3, pos.z - td.z * s2, c.dia * 0.5, c.dia * 0.5, 0, C_RED, C_CORE, op * 0.8, 10, 0.006); }
          glow.put(pos.x, pos.y, pos.z, c.dia * 2.6, c.dia * 2.6, 0, C_SHELL, C_CORE, op * 0.55, 10, 0.009);
          for (let j = 0; j < 3; j++) { const s = trail * (0.3 + 0.32 * j); smoke.put(pos.x - td.x * s, pos.y - td.y * s, pos.z - td.z * s, c.dia * (2.4 + 0.8 * j), c.dia * (2.4 + 0.8 * j), c.ph + j, SMOKE.dark2, C_RED, 0.7 * op * (1 - j * 0.22), j % 4, 0.006); }
        } else glow.put(pos.x, GY + 4, pos.z, c.dia * 4.5, c.dia * 3, 0, C_RED, C_CORE, 0.95 * (1 - sstep(0.62, 1, a)) * sstep(0.55, 0.64, a), 10, 0.012);
      }
      rocks.instanceMatrix.needsUpdate = true; rocks.instanceColor.needsUpdate = true; rib.commit(); rib.mesh.visible = true;
      // wisps: lifted and pulled to the axis, then burned by the wave
      const lift = k3(...TL.lift, f), fire = sstep(55.4, 56.6, t);
      for (const w of wisps) {
        const lf = lift * (1 - w.r / TL.liftR), r2 = Math.max(0, w.r - 0.25 * lf), wave = Pk(56 + w.r / TL.v, 56 + w.r / TL.v + 0.3, t);
        const al = 0.72 * sstep(48, 49.2, t) * (1 - wave) * (1 - 0.15 * Math.sin(w.ph * TAU));
        mix3(tmpA, DUST.lit, lin("#FFB070"), fire); mix3(tmpB, DUST.dark, lin("#8A3C2E"), fire * 0.7);
        smoke.put(TL.mx + Math.sin(w.a) * r2, w.y + lf, TL.mz + Math.cos(w.a) * r2, w.w, w.w * 0.42, 0, tmpB, tmpA, al, w.v, 0.01);
      }
      smoke.commit(); glow.commit();
    },
  };
}

// ============================================================================================================== gfirewall
const SEG = 32, ROWS = 6, BAND_U = [0, 0.1, 0.3, 0.55, 0.8, 1];
const BAND_VS = `attribute vec3 aCol; attribute vec2 aAU; varying vec3 vC; varying vec2 vAU; void main(){ vC = aCol; vAU = aAU; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const BAND_FS = `varying vec3 vC; varying vec2 vAU;
void main(){ float lick = sin(vAU.x * 52.0 + vAU.y * 9.0) * sin(vAU.x * 17.0 - vAU.y * 4.0); vec3 c = mix(vC, vC * vec3(1.3, 1.08, 0.8), lick * 0.28 * (1.0 - vAU.y));
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;
function fireKind(P_) {
  const S = P_.spec, G = P_.whole, cam = S.cam?.pos ?? [0.15, 1.91, -2.58], fov = S.fov ?? 53, tanH = Math.tan(fov * DEG / 2) * (9 / 16), glare = S.glare ?? 2, CX = TL.mx, CZ = TL.mz, YB = GY + 1.5;
  const Rf = rngOf(SEED + 601);
  // band
  const nv = (SEG + 1) * ROWS, bpos = new Float32Array(nv * 3), bcol = new Float32Array(nv * 3), bau = new Float32Array(nv * 2), bidx = [];
  for (let j = 0; j < ROWS; j++) for (let i = 0; i <= SEG; i++) { bau[(j * (SEG + 1) + i) * 2] = (i / SEG) * TAU; bau[(j * (SEG + 1) + i) * 2 + 1] = BAND_U[j]; if (j < ROWS - 1 && i < SEG) { const a = j * (SEG + 1) + i, b = a + SEG + 1; bidx.push(a, b, a + 1, a + 1, b, b + 1); } }
  const bgeo = new THREE.BufferGeometry(); bgeo.setAttribute("position", new THREE.BufferAttribute(bpos, 3)); bgeo.setAttribute("aCol", new THREE.BufferAttribute(bcol, 3)); bgeo.setAttribute("aAU", new THREE.BufferAttribute(bau, 2)); bgeo.setIndex(bidx);
  const bmat = noLine(new THREE.ShaderMaterial({ vertexShader: BAND_VS, fragmentShader: BAND_FS, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6, fog: false }));
  const band = lookOnly(new THREE.Mesh(bgeo, bmat), 5); band.visible = false; G.add(band);
  const smoke = makeBB(G, 160, { order: 40, cam }), fire = makeBB(G, 320, { order: 45, cam }), add = makeBB(G, 160, { order: 60, cam, add: true }), flare = makeBB(G, 16, { order: 62, cam, add: true, depth: false });
  // cards: 64, the first 20 biased to the visible arc
  const cards = Array.from({ length: 64 }, (_, i) => ({ biased: i < 20, f: i < 20 ? (i / 19) * 2 - 1 + (Rf() - 0.5) * 0.08 : 0, ang: (i - 20) / 44 * TAU + (Rf() - 0.5) * 0.12, u: Rf(), hs: 0.7 + 0.55 * Rf(), ws: 0.8 + 0.5 * Rf(), v: Math.floor(Rf() * 4), ph: Rf(), side: Rf() }));
  const puffs = Array.from({ length: 44 }, (_, i) => ({ biased: i < 20, f: i < 20 ? (i / 19) * 2 - 1 + (Rf() - 0.5) * 0.15 : 0, ang: Rf() * TAU, u: 1.4 + 4.6 * Rf(), vv: Rf(), sz: 0.8 + 1.2 * Rf(), v: Math.floor(Rf() * 4), rot: Rf() * TAU }));
  const plume = Array.from({ length: 14 }, (_, i) => ({ a: Rf() * TAU, r: 120 * Math.sqrt(Rf()), vv: 0.35 + 0.65 * (i / 13), sz: 0.7 + 0.6 * Rf(), v: Math.floor(Rf() * 4), rot: Rf() * TAU }));
  const field = Array.from({ length: 64 }, (_, i) => ({ biased: true, f: ((i * 0.618034) % 1) * 2 - 1, k: Rf(), hs: 0.35 + 0.65 * Rf(), v: Math.floor(Rf() * 4), ph: Rf() }));
  const embers = Array.from({ length: 40 }, (_, i) => ({ biased: i < 24, f: i < 24 ? (i / 23) * 2 - 1 + (Rf() - 0.5) * 0.2 : 0, ang: Rf() * TAU, u: Rf() * 2.5, hh: 0.3 + 1.7 * Rf(), sz: 2 + 4 * Rf(), ph: Rf() }));
  const wallPt = (rr, c, out) => {   // a point on the ring at radius rr: biased cards keep to the width the camera sees there
    if (c.biased) {
      const dz = cam[2] - (CZ + rr), vis = tanH * Math.max(dz, 30) * 1.35 + 30, xl = c.f * vis, xline = cam[0] + (CX - cam[0]) * ((cam[2] - (CZ + rr)) / (cam[2] - CZ)), dx = clamp(xline + xl - CX, -0.97 * rr, 0.97 * rr);
      out[0] = CX + dx; out[1] = CZ + Math.sqrt(Math.max(rr * rr - dx * dx, 0)); out[2] = vis;
    } else { out[0] = CX + rr * Math.sin(c.ang); out[1] = CZ + rr * Math.cos(c.ang); out[2] = 0; }
    return out;
  };
  const xz = [0, 0, 0];
  return {
    grip: 0,
    apply(ps) {
      const t = ps.t ?? S.t ?? -1, on = t >= TL.impact[0] && t < TL.impact[1];
      smoke.reset(); fire.reset(); add.reset(); flare.reset(); band.visible = on;
      if (!on) { smoke.commit(); fire.commit(); add.commit(); flare.commit(); return; }
      const I = Pk(TL.impact[0], TL.impact[1], t), r = TL.v * (t - TL.impact[0]), H = k3(...TL.H, I), W = k3(...TL.W, I), eA = k3(...TL.eA, I), span = Math.max(3 * W, 2);
      // ground band
      for (let j = 0; j < ROWS; j++) {
        const u = BAND_U[j], rr = Math.max(0, r - span * u);
        if (u < 0.1) mix3(tmpA, FIRE_C.core, FIRE_C.wall, u / 0.1); else if (u < 0.3) mix3(tmpA, FIRE_C.wall, FIRE_C.mid, (u - 0.1) / 0.2); else if (u < 0.55) mix3(tmpA, FIRE_C.mid, FIRE_C.back, (u - 0.3) / 0.25); else mix3(tmpA, FIRE_C.back, FIRE_C.scorch, (u - 0.55) / 0.45);
        const br = 0.65 + 0.35 * eA;
        for (let i = 0; i <= SEG; i++) {
          const a = (i / SEG) * TAU, v = j * (SEG + 1) + i, jag = 1 + 0.06 * Math.sin(i * 5.1 + j) * (1 - u);
          bpos[v * 3] = CX + rr * jag * Math.sin(a); bpos[v * 3 + 1] = YB; bpos[v * 3 + 2] = CZ + rr * jag * Math.cos(a);
          bcol[v * 3] = tmpA[0] * br; bcol[v * 3 + 1] = tmpA[1] * br; bcol[v * 3 + 2] = tmpA[2] * br;
        }
      }
      bgeo.attributes.position.needsUpdate = true; bgeo.attributes.aCol.needsUpdate = true;
      // smoke behind the front (painter's order: far first)
      const ramp = sstep(56, 56.7, t);
      for (const p of puffs) {
        const rr = Math.max(8, r - p.u * W * 1.0 - 20), pt = wallPt(rr, p, xz), h = H * (0.5 + 1.5 * p.vv) + (t - 56) * 5 * p.vv, sz = H * (1.1 + 0.9 * p.sz) + 40 * ramp;
        smoke.put(pt[0], GY + h, pt[1], sz, sz * 0.75, p.rot, SMOKE.dark, SMOKE.lit, 0.7 * ramp * (0.8 + 0.2 * p.vv), p.v, 0.012);
      }
      for (const p of plume) {   // the column over the contact: rises and widens
        const g = t - 56, h = (40 + 190 * g * p.vv) * Math.min(1, 0.3 + g), sz = (110 + 105 * g) * p.sz, rr = p.r * (0.4 + 0.2 * g);
        smoke.put(CX + Math.sin(p.a) * rr, GY + 10 + h, CZ + Math.cos(p.a) * rr, sz, sz * 0.9, p.rot, SMOKE.dark, SMOKE.lit, 0.82 * ramp, p.v, 0.012);
      }
      // flame cards: three tongues each
      for (const c of cards) {
        const rr = Math.max(6, r - c.u * W * 2.2), pt = wallPt(rr, c, xz), cyc = fr(t / TL.cycle + c.ph), flick = 0.84 + 0.26 * (1 - Math.abs(2 * cyc - 1));
        const h = Math.max(H * c.hs, 12) * flick, w0 = Math.max(h * 0.6 * c.ws, c.biased ? Math.min(pt[2] * 2 / 20 * 2.6, h * 1.7) : 0);
        const u = c.u; mix3(tmpA, FIRE_C.core, FIRE_C.wall, sstep(0, 0.25, u)); mix3(tmpA, tmpA, FIRE_C.mid, sstep(0.3, 1, u)); mix3(tmpB, FIRE_C.mid, FIRE_C.red, sstep(0, 0.7, u)); mix3(tmpB, tmpB, FIRE_C.back, sstep(0.6, 1, u));
        const al = clamp(eA * (1 - 0.38 * u), 0, 1) * sstep(56, 56.12, t);
        for (let k = 0; k < 3; k++) {
          const dh = k === 0 ? 1 : k === 1 ? 0.72 : 0.6, dx = k === 0 ? 0 : k === 1 ? -0.34 : 0.4, hh = h * dh * (0.9 + 0.2 * tri(c.ph * 7 + k + t * 2.1)), ww = w0 * (k === 0 ? 1 : 0.8);
          fire.put(pt[0] + dx * w0, YB + hh * 0.5, pt[1] - k * 2, ww, hh, 0, tmpB, tmpA, al, 4 + ((c.v + k) & 3), 0.004);
        }
      }
      // the burning field behind the front: smaller flames spread over the swept ground the camera sees
      for (const c of field) {
        const rr = r * (0.28 + 0.72 * Math.pow(c.k, 0.7)); if (rr > r - 2.4 * W - 20 || rr < 30) continue;
        const pt = wallPt(rr, c, xz), cyc = fr(t / TL.cycle + c.ph), flick = 0.84 + 0.26 * (1 - Math.abs(2 * cyc - 1)), h = (30 + 70 * c.hs) * flick * (0.6 + 0.4 * I), u = clamp((r - rr) / Math.max(r, 1));
        mix3(tmpA, FIRE_C.wall, FIRE_C.mid, u); mix3(tmpB, FIRE_C.red, FIRE_C.back, u * 0.8);
        fire.put(pt[0], YB + h * 0.5, pt[1], h * 0.62, h, 0, tmpB, tmpA, 0.92 * sstep(56.15, 56.6, t) * (1 - 0.3 * u), 4 + c.v, 0.0035);
      }
      // embers and the hot horizon
      for (const e of embers) {
        const rr = Math.max(4, r - e.u * W), pt = wallPt(rr, e, xz), spark = 0.55 + 0.45 * tri(e.ph * 9 + t * 6.3);
        add.put(pt[0], GY + H * e.hh + (t - 56) * 8 * e.ph, pt[1], e.sz * 1.6, e.sz * 1.6, 0, FIRE_C.red, FIRE_C.yel, 0.9 * spark * sstep(56.1, 56.5, t), 10, 0.0042);
      }
      const hot = 0.34 - 0.12 * I; flare.put(CX, GY + 150, CZ, 2600, 620, 0, FIRE_C.red, FIRE_C.orange, hot * sstep(56, 56.4, t), 10, 0);
      flare.put(CX, GY + 40, CZ, 1700 * (0.5 + I), 90 + 70 * I, 0, FIRE_C.wall, FIRE_C.mid, 0.55 * sstep(56, 56.3, t), 11, 0);
      // contact glare
      const gp = Pk(TL.contact[0], TL.contact[1], t);
      if (gp < 1) {
        const D = k3(...TL.flareD, gp) * glare, A = k3(...TL.flareA, gp), gx = TL.glareAt[0], gy = TL.glareAt[1], gz = TL.glareAt[2];
        flare.put(gx, gy, gz, D * 2.4, D * 2.4, 0, lin("#FFC174"), lin("#FFC174"), 0.5 * A, 10, 0.05);
        flare.put(gx, gy, gz, D, D, 0, lin("#FFFDF4"), lin("#FFC174"), 1.3 * A, 10, 0.07);
        flare.put(gx, gy, gz, D * 6.5, D * 0.22, 0, lin("#FFFDF4"), lin("#FFC174"), 1.0 * A, 11, 0.012);
      }
      smoke.commit(); fire.commit(); add.commit(); flare.commit();
    },
  };
}

// ============================================================================================================== groomhit
const OPEN = { x0: -1.95, x1: 1.95, y0: 0.09, y1: 3.43, z: -2.64, strip: 0.013 }, MULL = [[-1.69, 0.043], [-0.48, 0.06], [0.94, 0.054], [1.69, 0.043]];
const FACE = [0.46, 0.75, -1.45], SPUD = [0.46, 0.55, -1.5], P9CAM = [0.48, 1.39, 0.21];
const CRACK_UV = [[0.78, 0.61], [0.14, 0.78], [0.13, 0.19], [0.56, 0.7], [0.42, 0.66], [0.29, 0.33], [0.42, 0.28], [0.58, 0.42], [0.38, 0.72]];
const ROOM = { x: 2.08, y1: 3.52, front: 3.4 };
const onSofaTop = (x, z) => (x > -0.82 && x < 1.22 && z > -2.06 && z < -1.15 ? (z < -1.85 ? 0.9 : 0.5) : 0.03);
const inMull = (x, pad) => MULL.some(([m, w]) => Math.abs(x - m) < w / 2 + pad);
function shardPlan() {
  return once("shardPlan", () => {
    const out = [], P3 = new THREE.Vector3(), cam = new THREE.Vector3(...P9CAM), fc = new THREE.Vector3(...FACE), toF = fc.clone().sub(cam), dF = toF.length(), angF = Math.asin(0.4 / dF);
    for (let i = 0; i < 96; i++) {
      const R = rngOf(SEED + 1000 + i * 31), hero = i < 24;
      const w = hero ? lerp(0.11, 0.29, R()) : lerp(0.025, 0.11, R() ** 0.8), asp = R() < 0.5 ? 0.4 + 0.6 * R() : 1 + 1.3 * R();
      let best = null, ok = false;
      for (let tries = 0; tries < 60 && !ok; tries++) {
        let x, y;
        if (R() < 0.5) { const cp = CRACK_UV[Math.floor(R() * CRACK_UV.length)]; x = lerp(OPEN.x0, OPEN.x1, cp[0]) + (R() + R() + R() - 1.5) * 1.1; y = lerp(OPEN.y0, OPEN.y1, cp[1]) + (R() + R() + R() - 1.5) * 1.0; }
        else { x = lerp(-0.85, 1.75, R()); y = lerp(0.2, 2.9, R()); }
        x = clamp(x, OPEN.x0 + OPEN.strip, OPEN.x1 - OPEN.strip); y = clamp(y, OPEN.y0 + OPEN.strip, OPEN.y1 - OPEN.strip);
        if (inMull(x, 0.03) || Math.abs(x) > 1.86) continue;
        const v = [lerp(-4, 4, R()), lerp(0.5, 6.2, R()), lerp(6, 17, R())], s = [x, y, OPEN.z];
        // walk the flight; first wall / floor / ceiling / sofa hit ends it
        let hit = TL.shard, bad = false;
        for (let tau = 0.01; tau <= TL.shard + 1e-6; tau += 0.01) {
          P3.set(s[0] + v[0] * tau, s[1] + v[1] * tau - 4.9 * tau * tau, s[2] + v[2] * tau);
          if (P3.y <= 0.02 || P3.y >= ROOM.y1 || Math.abs(P3.x) >= ROOM.x || P3.z >= ROOM.front || (P3.y < onSofaTop(P3.x, P3.z) && P3.z > -2.06 && P3.z < -1.15 && onSofaTop(P3.x, P3.z) > 0.1)) { hit = tau; break; }
          if (P3.distanceTo(cam) < 0.34) { bad = true; break; }
          const toS = P3.clone().sub(cam), ds = toS.length();
          if (P3.distanceTo(fc) < 0.5 || (ds < dF + 0.3 && toS.angleTo(toF) < angF + 0.07 + w / ds)) { bad = true; break; }
        }
        best = { s, v, hit }; if (!bad) ok = true;
      }
      const axis = new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize(), base = new THREE.Quaternion().setFromEuler(new THREE.Euler((R() - 0.5) * 1.2, (R() - 0.5) * 1.2, R() * TAU));
      out.push({ hero, w, h: w * asp, s: best.s, v: best.v, hit: best.hit, ok, axis, base, a1: lerp(95, 170, R()), a2: lerp(190, 340, R()), delay: R() * 0.03, seed: R() * 50 });
    }
    return out;
  });
}
// wood (28), stuffing (12) and dust (12) pieces: positions through three keys (start, roomHit .5, roomHit 1), kept out of Spud's body
function pieceKeys(R, x0, y0, z0, size) {
  const sph = new THREE.Vector3(...SPUD), tmp = new THREE.Vector3(); let k = null;
  for (let tries = 0; tries < 40; tries++) {
    const dx1 = lerp(-0.6, 0.6, R()), dz1 = lerp(0.3, 0.8, R()), dy1 = lerp(0.1, 0.5, R()), dx2 = dx1 * 2 + lerp(-0.3, 0.3, R()), dz2 = lerp(0.7, 1.8, R());
    const xe = x0 + dx2, ze = z0 + dz2, ye = onSofaTop(xe, ze) + size * 0.5;
    k = [[x0, y0, z0], [x0 + dx1, y0 + dy1, z0 + dz1], [xe, ye, ze]];
    let bad = false; for (let h = 0.05; h <= 1.001; h += 0.05) { tmp.set(q3(k[0][0], k[1][0], k[2][0], h), q3(k[0][1], k[1][1], k[2][1], h), q3(k[0][2], k[1][2], k[2][2], h)); if (tmp.distanceTo(sph) < 0.62 + size * 0.5) { bad = true; break; } }
    if (!bad) break;
  }
  return k;
}
function debrisPlan() {
  return once("debrisPlan", () => {
    const wood = [], stuff = [];
    for (let i = 0; i < 28; i++) {
      const R = rngOf(SEED + 2000 + i * 17), horiz = i % 7 === 6, m = [-1.69, -0.48, 0.94, 1.69, -1.9, 1.9][Math.floor(R() * 6)];
      const len = horiz ? lerp(0.5, 1.1, R()) : lerp(0.3, 0.9, R()), th = lerp(0.035, 0.065, R());
      const x0 = horiz ? lerp(-0.7, 1.6, R()) : m + (R() - 0.5) * 0.04, y0 = horiz ? (R() < 0.5 ? 0.12 : 3.38) : lerp(0.3, 3.2, R()), z0 = -2.58;
      wood.push({ len, th, k: pieceKeys(R, x0, y0, z0, 0.1), axis: new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize(), a1: lerp(55, 120, R()) * (R() < 0.5 ? -1 : 1), a2: lerp(110, 240, R()) * (R() < 0.5 ? -1 : 1), horiz, ph: R() });
    }
    for (let i = 0; i < 24; i++) {
      const R = rngOf(SEED + 3000 + i * 13), tuft = i < 12;
      const x0 = tuft ? lerp(-0.8, 1.2, R()) : lerp(-1.0, 1.6, R()), y0 = tuft ? lerp(0.55, 0.95, R()) : lerp(0.3, 2.4, R()), z0 = tuft ? lerp(-1.95, -1.6, R()) : -2.5;
      stuff.push({ tuft, k: pieceKeys(R, x0, y0, z0, 0.2), sz: tuft ? lerp(0.12, 0.28, R()) : lerp(0.45, 0.95, R()), v: Math.floor(R() * 4), rot: R() * TAU, at: R() * 0.1 });
    }
    const rows = [], Rr = rngOf(SEED + 4000);
    for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) rows.push({ r, x: lerp(-1.85, 1.85, (c + 0.5 + (Rr() - 0.5) * 0.6) / 8), y: OPEN.y0 + (r + 0.5) * (3.34 * 0.75 / 5) + (Rr() - 0.5) * 0.25, z: -2.45 + (Rr() - 0.5) * 0.3, sz: 1.0 + 0.7 * Rr(), v: Math.floor(Rr() * 4), rot: Rr() * TAU });
    return { wood, stuff, rows };
  });
}
const SHARD_VS = `attribute float kv; attribute float edge; uniform vec3 uL; varying float vE; varying float vA; varying float vG;
void main(){
  float seed = instanceColor.g; float j = 1.0 + 0.7 * (fract(sin(seed * 37.0 + kv * 11.3) * 43758.5453) - 0.5);
  vec4 wp = modelMatrix * instanceMatrix * vec4(position.xy * j, 0.0, 1.0);
  vec3 n = normalize((modelMatrix * instanceMatrix * vec4(0.0, 0.0, 1.0, 0.0)).xyz);
  vec3 v = normalize(cameraPosition - wp.xyz); vec3 h = normalize(uL + v);
  vG = pow(abs(dot(n, h)), 22.0); vE = edge;
  vA = instanceColor.r * smoothstep(0.22, 0.7, length(cameraPosition - wp.xyz));
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const SHARD_FS = `uniform vec3 uFill; uniform vec3 uStroke; uniform vec3 uLine; varying float vE; varying float vA; varying float vG;
void main(){
  float st = smoothstep(0.66, 0.9, vE), ol = smoothstep(0.92, 0.99, vE);
  vec3 c = mix(uFill, uStroke, st); c = mix(c, uLine, ol * 0.8); c += vG * 0.5;
  float a = clamp(0.26 + st * 0.5 + ol * 0.5 + vG * 0.55, 0.0, 1.0) * vA;
  if (a < 0.004) discard;
  gl_FragColor = vec4(c, a);
  #include <colorspace_fragment>
}`;
const WOOD_VS = `varying vec3 vN; void main(){ vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0); }`;
const WOOD_FS = `uniform vec3 uL; uniform vec3 uCol; uniform vec3 uDark; varying vec3 vN;
void main(){ float nl = dot(normalize(vN), uL); float band = 0.5 + 0.26 * smoothstep(0.15, 0.21, nl) + 0.24 * smoothstep(0.55, 0.61, nl); gl_FragColor = vec4(mix(uDark, uCol, band), 1.0);
  #include <colorspace_fragment>
}`;
function mat(c, o = {}) { return new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, ...o }); }
function shelfGeos() {
  return once("shelf", () => {
    const R = rngOf(SEED + 5000), parts = [], boards = [], W = 0.65, H = 1.35, D = 0.26, t = 0.03;
    const box = (w, h, d, x, y, z, col, arr) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); const n = g.attributes.position.count, cA = new Float32Array(n * 3), c = new THREE.Color(col); for (let i = 0; i < n; i++) { cA[i * 3] = c.r; cA[i * 3 + 1] = c.g; cA[i * 3 + 2] = c.b; } g.setAttribute("color", new THREE.BufferAttribute(cA, 3)); arr.push(g); };
    const WOOD = "#75513E";
    box(t, H, D, -W / 2 + t / 2, H / 2, 0, WOOD, boards); box(t, H, D, W / 2 - t / 2, H / 2, 0, WOOD, boards); box(W, H, 0.012, 0, H / 2, -D / 2 + 0.006, "#5E4132", boards);
    const ys = [t / 2, 0.33, 0.63, 0.93, H - t / 2]; ys.forEach((y) => box(W - 2 * t, t, D, 0, y, 0, y < 0.1 || y > 1.3 ? WOOD : "#7C573F", boards));
    const COLS = ["#8C4A3C", "#2F5D62", "#D9A441", "#6C5B7B", "#B5654A", "#4F6D3A", "#C9B28E", "#3E4C7A", "#A34A5C"];
    for (let b = 0; b < 4; b++) {
      let x = -W / 2 + t + 0.01; const y0 = ys[b] + t / 2;
      while (x < W / 2 - t - 0.05) {
        const w = lerp(0.02, 0.05, R()), h = lerp(0.19, 0.27, R()), d = lerp(0.16, 0.2, R()), col = COLS[Math.floor(R() * COLS.length)];
        if (R() < 0.1) { x += 0.05; continue; }
        box(w, h, d, x + w / 2, y0 + h / 2, 0.02, col, parts); x += w + 0.002;
      }
    }
    const merge = (arr) => { const n = arr.reduce((s, g) => s + g.attributes.position.count, 0), pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), idx = []; let o = 0; for (const g of arr) { const c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); col.set(g.attributes.color.array, o * 3); for (const i of g.index.array) idx.push(i + o); o += c; } const m = new THREE.BufferGeometry(); m.setAttribute("position", new THREE.BufferAttribute(pos, 3)); m.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); m.setAttribute("color", new THREE.BufferAttribute(col, 3)); m.setIndex(idx); return m; };
    return { frame: merge(boards), books: merge(parts), H, D };
  });
}
function roomHitKind(P_) {
  const S = P_.spec, G = P_.whole, troom = S.troom ?? TL.troom, camP = S.cam?.pos ?? P9CAM, plan = shardPlan(), deb = debrisPlan();
  // shelf
  const sg = shelfGeos(), shelf = new THREE.Group(), sm = mat("#ffffff", { vertexColors: true, roughness: 0.75 });
  for (const g of [sg.frame, sg.books]) { const m = new THREE.Mesh(g, sm); m.castShadow = m.receiveShadow = true; shelf.add(m); }
  G.add(shelf); const sp = S.shelf ?? [-1.53, 0.675, -1.9];
  // glass shards
  const sgeo = new THREE.InstancedBufferGeometry(); { const pos = [0, 0, 0], kv = [0], ed = [0]; for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + 0.3; pos.push(Math.cos(a), Math.sin(a), 0); kv.push(k + 1); ed.push(1); } const idx = []; for (let k = 0; k < 5; k++) idx.push(0, 1 + k, 1 + ((k + 1) % 5)); sgeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3)); sgeo.setAttribute("kv", new THREE.BufferAttribute(new Float32Array(kv), 1)); sgeo.setAttribute("edge", new THREE.BufferAttribute(new Float32Array(ed), 1)); sgeo.setIndex(idx); }
  const shm = noLine(new THREE.ShaderMaterial({ uniforms: { uL: { value: new THREE.Vector3(-0.2, 0.35, -1).normalize() }, uFill: { value: new THREE.Vector3(...lin("#D3E1E8")) }, uStroke: { value: new THREE.Vector3(...lin("#F1FAF7")) }, uLine: { value: new THREE.Vector3(...lin("#6C8794")) } }, vertexShader: SHARD_VS, fragmentShader: SHARD_FS, transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide, fog: false }));
  const shards = new THREE.InstancedMesh(sgeo, shm, plan.length); shards.instanceMatrix.setUsage(THREE.DynamicDrawUsage); shards.setColorAt(0, new THREE.Color(1, 0, 0)); shards.instanceColor.setUsage(THREE.DynamicDrawUsage); lookOnly(shards, 70); shards.visible = false; G.add(shards);
  // wood
  const wm = noLine(new THREE.ShaderMaterial({ uniforms: { uL: { value: new THREE.Vector3(-0.58, 0.4, -0.71).normalize().negate().setY(0.55).normalize() }, uCol: { value: new THREE.Vector3(...lin("#75513E")) }, uDark: { value: new THREE.Vector3(...lin("#3E2A22")) } }, vertexShader: WOOD_VS, fragmentShader: WOOD_FS, fog: false }));
  const woods = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), wm, deb.wood.length); woods.instanceMatrix.setUsage(THREE.DynamicDrawUsage); lookOnly(woods, 20); woods.visible = false; G.add(woods);
  const puff = makeBB(G, 96, { order: 65, cam: camP });
  const q = new THREE.Quaternion(), qs = new THREE.Quaternion(), m4 = new THREE.Matrix4(), pos = new THREE.Vector3(), sc = new THREE.Vector3(), ax = new THREE.Vector3(0, 0, 1);
  const STUFF = { dark: lin("#B8A794"), lit: lin("#E9DCC8") }, DUSTC = { dark: lin("#D2B6A0"), lit: lin("#FFF0D8") };
  const eul = new THREE.Euler();
  return {
    grip: 0,
    apply(ps) {
      const t = ps.t ?? S.t ?? -1, on = t < TL.end, hit = on && t >= troom, h = Pk(troom, TL.end, t), tau = t - troom;
      shelf.visible = on && S.shelfOn !== false; puff.reset();
      // shelf: bottom-centre pivot, thrown by the table, tips toward +z; y keeps the lowest corner on the floor
      const ox = k3(0, 0.1, 0.27, h), oz = k3(0, 0.65, 1.28, h), tilt = k3(0, 24, 58, h) * DEG, base = sp[1] - sg.H / 2;
      shelf.position.set(sp[0] + ox, base + sg.D / 2 * Math.sin(tilt), sp[2] + oz); shelf.rotation.set(tilt, 0, 0);
      shards.visible = woods.visible = hit;
      if (!hit) { puff.commit(); return; }
      // shards
      for (let i = 0; i < plan.length; i++) {
        const s = plan[i], tt = tau - s.delay, age = Pk(0, TL.shard, tt), life = Math.min(tt, s.hit);
        if (tt <= 0 || age >= 1) { sc.set(0, 0, 0); m4.compose(pos.set(0, -999, 0), q.identity(), sc); shards.setMatrixAt(i, m4); shards.instanceColor.setXYZ(i, 0, s.seed, 0); continue; }
        pos.set(s.s[0] + s.v[0] * life, s.s[1] + s.v[1] * life - 4.9 * life * life, s.s[2] + s.v[2] * life);
        const spin = (age < 0.5 ? lerp(0, s.a1, age * 2) : lerp(s.a1, s.a2, (age - 0.5) * 2)) * DEG * (s.seed > 25 ? -1 : 1), fade = tt > s.hit ? 1 - clamp((tt - s.hit) / 0.1) : 1;
        qs.setFromAxisAngle(s.axis, spin); q.copy(s.base).multiply(qs); sc.set(s.w, s.h, 1); m4.compose(pos, q, sc); shards.setMatrixAt(i, m4);
        shards.instanceColor.setXYZ(i, (s.ok ? 1 : 0) * pw([[0, 1], [0.5, 0.8], [1, 0]], age) * fade, s.seed, 0);
      }
      shards.instanceMatrix.needsUpdate = true; shards.instanceColor.needsUpdate = true;
      // wood
      deb.wood.forEach((w, i) => {
        pos.set(q3(w.k[0][0], w.k[1][0], w.k[2][0], h), q3(w.k[0][1], w.k[1][1], w.k[2][1], h), q3(w.k[0][2], w.k[1][2], w.k[2][2], h));
        const ang = q3(0, w.a1, w.a2, h) * DEG; qs.setFromAxisAngle(w.axis, ang); q.setFromEuler(eul.set(w.horiz ? 0 : 0, 0, w.horiz ? Math.PI / 2 : 0)); q.premultiply(qs);
        sc.set(w.th, w.len, w.th); m4.compose(pos, q, sc); woods.setMatrixAt(i, m4);
      });
      woods.instanceMatrix.needsUpdate = true;
      // stuffing, dust and the dust rows
      for (const p of deb.stuff) {
        const hh = Pk(p.at, 1, h); pos.set(q3(p.k[0][0], p.k[1][0], p.k[2][0], hh), q3(p.k[0][1], p.k[1][1], p.k[2][1], hh), q3(p.k[0][2], p.k[1][2], p.k[2][2], hh));
        const c = p.tuft ? STUFF : DUSTC, al = sstep(0, 0.06, hh) * (p.tuft ? 0.95 : 0.55 * (1 - 0.3 * sstep(0.6, 1, hh))), grow = 0.5 + 0.5 * sstep(0, 0.5, hh);
        puff.put(pos.x, pos.y, pos.z, p.sz * grow, p.sz * grow, p.rot + hh * 2, c.dark, c.lit, al, p.v, p.tuft ? 0.012 : 0);
      }
      for (const d of deb.rows) {
        const start = d.r * 0.1, a = sstep(start, start + 0.3, h) * 0.6, sz = d.sz * (0.7 + 0.5 * sstep(start, 1, h));
        puff.put(d.x, d.y, d.z + 0.5 * h, sz, sz * 0.8, d.rot, DUSTC.dark, DUSTC.lit, a, d.v, 0);
      }
      puff.commit();
    },
  };
}

// ============================================================================================================== gflash
function flashKind(P_) {
  const S = P_.spec, cam = S.cam || {}, troom = S.troom ?? TL.troom, pos = new THREE.Vector3(...(cam.pos || P9CAM)), look = new THREE.Vector3(...(cam.look || [0.37, 0.78, -2.3])), fov = cam.fov ?? 71, asp = cam.aspect ?? 9 / 16;
  const f = look.clone().sub(pos).normalize(), r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize(), u = new THREE.Vector3().crossVectors(r, f).normalize();
  const halfH = 0.5 * Math.tan((fov * DEG) / 2) * 1.15, halfW = halfH * asp;
  const m = new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 }, uC: { value: new THREE.Vector3(...lin("#FFFDF4")) } }, vertexShader: "void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }", fragmentShader: "uniform float uA; uniform vec3 uC; void main(){ gl_FragColor = vec4(uC, uA);\n#include <colorspace_fragment>\n}", transparent: true, depthTest: true, depthFunc: THREE.AlwaysDepth, depthWrite: true, side: THREE.DoubleSide });
  m.userData.noOutline = true;
  const card = lookOnly(new THREE.Mesh(new THREE.PlaneGeometry(2 * halfW, 2 * halfH), m), 1000);
  card.matrixAutoUpdate = false; card.matrix.makeBasis(r, u, f.clone().negate()).setPosition(pos.clone().addScaledVector(f, 0.5)); card.matrixWorldNeedsUpdate = true; card.visible = false;
  P_.whole.add(card);
  return {
    grip: 0,
    apply(ps) {
      const t = ps.t ?? S.t ?? -1, k = Pk(troom, troom + TL.whiteLen, t);
      let a = t < troom || t >= TL.end ? 0 : t < troom + TL.whiteLen ? pw(TL.whiteKeys, k) : lerp(0.12, 0.04, Pk(troom + TL.whiteLen, TL.end, t));
      m.uniforms.uA.value = a; card.visible = a > 0.002;
    },
  };
}

export const GRAVMOON_KINDS = { gmoonfall: moonKind, gfirewall: fireKind, groomhit: roomHitKind, gflash: flashKind };
