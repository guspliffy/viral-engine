import * as THREE from "three";
import { clamp } from "./util.js";

// Fire bending (the anime person's firebending scene, 7 Nov 2026): fire thrown from a fist, a palm or a foot.
//
//   firebend    every flame in the clip, one prop at the world origin (x, y, z 0, rot 0, scale 1). spec.blasts is the
//               list of throws; each is worked out from the time alone (no state carried from frame to frame), so any
//               frame draws the same on its own (shards, the frame cache, stills):
//                 { at, end,                          the seconds the source pours fire
//                   kind: "jet" | "arc" | "burst",    a jet streams along the limb; an arc is laid along the swing of a
//                                                     kick (the fire leaves the foot sideways and trails it, a crescent);
//                                                     a burst is one round flare at the source (a hit, a puff); a
//                                                     hold is a small flame licking up off a fist that holds it
//                   src: [[t, x, y, z, dx, dy, dz], ...]   the source (the fist or the foot, world metres) and the
//                                                     limb's pointing direction, sampled through [at, end] (tools/human/
//                                                     firebend.mjs measures them on the drawn body, so the fire leaves the
//                                                     knuckles wherever the hand is)
//                   rate 150 (flames a second), speed 7 (m/s), spread 0.1 (rad), life 0.5 (s), size 0.16 (m),
//                   grow 2.6 (how much a flame swells over its life), drag 3 (1/s), lift 1.2 (m/s^2 upward),
//                   reach (m): the jet stops there and splashes out sideways (it hit something), hot: "orange" | "blue",
//                   splash (m): how far that splash spreads at most (it eases out toward it; unset: no limit),
//                   taper (s): the stream thins and slows over its last seconds,
//                   sizeTo (m): flames born later in the pour grow toward this size (a fireball gathering),
//                   show (s): nothing is drawn before then (a stream poured from before a cut, already in flight on it),
//                   cut (s): its flames and embers vanish then (the shot ends: they must not hang in the next one)
//                 }
//               The flames are flat, hand-drawn-looking tongues, camera facing and stretched along their flight: a white
//               core, yellow, orange and a red rim in hard cel bands, cooling to a dark red and a thin brown smoke as
//               they die. A warm point light rides at the young flames, so the fire lights its thrower and the ground.
//               See-through for the checks (userData.steam): nothing is ever "inside" a flame.
//               Embers: every throw also sheds small glowing sparks (embers: per second of pouring, default rate x 0.2,
//               a hold x 0.04)
//               that fly out with the fire, slow, then float up and wink out over a second or two, after the flames
//               have gone (research: the show's fire ends in smoke and embers, never a clean cut).
const MAXN = 2400, MAXE = 600;
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

function srcAt(src, t) {
  if (t <= src[0][0]) return src[0];
  const last = src[src.length - 1]; if (t >= last[0]) return last;
  let i = 1; while (i < src.length - 1 && src[i][0] < t) i++;
  const a = src[i - 1], b = src[i], k = (t - a[0]) / Math.max(1e-6, b[0] - a[0]);
  return a.map((v, j) => v + (b[j] - v) * k);
}

// one flame's state at time t: centre, flight direction, size, age 0..1 (null when not born or dead)
function flame(B, i, ts, t, out) {
  const life = (B.life ?? 0.5) * (0.75 + 0.5 * hash(i * 3.1 + B.seed));
  const a = t - ts; if (a < 0 || a > life) return false;
  const s = srcAt(B.src, ts), p0 = new THREE.Vector3(s[1], s[2], s[3]);
  const d = new THREE.Vector3(s[4], s[5], s[6]); if (d.lengthSq() < 1e-8) d.set(0, 0, 1); d.normalize();
  const kind = B.kind || "jet", spread = B.spread ?? 0.1;
  // a random direction inside the cone round d
  const u1 = hash(i * 7.3 + B.seed + 1), u2 = hash(i * 9.7 + B.seed + 2), ang = spread * Math.sqrt(u1), phi = u2 * Math.PI * 2;
  const side = new THREE.Vector3(0, 1, 0).cross(d); if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize();
  const up = d.clone().cross(side).normalize();
  let v = d.clone().multiplyScalar(Math.cos(ang)).addScaledVector(side, Math.sin(ang) * Math.cos(phi)).addScaledVector(up, Math.sin(ang) * Math.sin(phi));
  let speed = (B.speed ?? 7) * (0.8 + 0.4 * hash(i * 5.1 + B.seed + 3));
  // taper (s): over the last seconds of pouring the stream thins and slows, so it dies into smoke instead of stopping
  const tap = B.taper ? Math.max(0, Math.min(1, (B.end - ts) / B.taper)) : 1;
  speed *= 0.35 + 0.65 * tap;
  if (kind === "arc") {
    // along the swing: the flame leaves where the foot was, carried a little along the swing and out along the leg
    const s2 = srcAt(B.src, ts + 0.02), sw = new THREE.Vector3(s2[1] - s[1], s2[2] - s[2], s2[3] - s[3]);
    const sl = sw.length(); if (sl > 1e-5) sw.multiplyScalar(1 / sl);
    v = sw.multiplyScalar(0.55).addScaledVector(v, 0.6).normalize();
    speed *= 0.5;
  } else if (kind === "hold") {
    // a flame held in the fist: it licks up off the knuckles and stays small
    v.set((hash(i + B.seed + 21) - 0.5) * 0.5, 1, (hash(i + B.seed + 22) - 0.5) * 0.5).normalize(); speed *= 0.18;
  } else if (kind === "burst") { v.set(hash(i + B.seed + 11) - 0.5, hash(i + B.seed + 12) - 0.3, hash(i + B.seed + 13) - 0.5).normalize(); speed *= 0.35; }
  const k = B.drag ?? 3, travel = speed * (1 - Math.exp(-k * a)) / k;
  const reach = B.reach ?? Infinity;
  out.pos.copy(p0).addScaledVector(v, Math.min(travel, reach));
  if (travel > reach) {
    // hit: the flame splashes out across the face it met, as a ring round the line of the jet
    const sp = B.splash ? B.splash * (1 - Math.exp(-(travel - reach) / B.splash)) : travel - reach, ca = Math.cos(phi + hash(i + 4) * 2), sa = Math.sin(phi + hash(i + 4) * 2);
    out.pos.addScaledVector(side, sp * 1.4 * ca).addScaledVector(up, sp * 1.4 * sa).addScaledVector(v, -sp * 0.25);
    v = side.clone().multiplyScalar(ca).addScaledVector(up, sa);
  }
  out.pos.y += 0.5 * (B.lift ?? 1.2) * a * a;
  // a slow curl, so the stream is never a ruler line
  const w = 0.04 * a * (1 + 3 * a);
  out.pos.x += w * Math.sin(ts * 23 + i * 1.7); out.pos.z += w * Math.cos(ts * 19 + i * 2.3); out.pos.y += w * 0.6 * Math.sin(ts * 29 + i);
  out.dir.copy(v);
  const age = a / life;
  out.age = age;
  // (sizeTo: the flames born later in the pour are bigger, up to sizeTo at its end: a fireball gathering between palms)
  const sz0 = B.sizeTo != null ? (B.size ?? 0.16) + (B.sizeTo - (B.size ?? 0.16)) * Math.max(0, Math.min(1, (ts - B.at) / Math.max(1e-6, B.end - B.at))) : (B.size ?? 0.16);
  out.size = sz0 * (0.7 + 0.6 * hash(i * 2.9 + B.seed + 5)) * (0.45 + (B.grow ?? 2.6) * Math.pow(age, 0.6)) * (kind === "burst" ? 1.6 : 1) * (0.25 + 0.75 * tap);
  out.speed = Math.exp(-k * a) * speed;
  out.seed = hash(i * 1.37 + B.seed + 7);
  out.hot = B.hot === "blue" ? 1 : 0;
  out.stretch = kind === "hold" ? 0.6 : 0;
  if (kind === "hold") out.seed = -0.01 - out.seed;   // (a held flame makes no smoke: it would veil the face behind it)   // a held flame is a tongue licking up, never a round disc (a disc drew as a target)
  return true;
}

// one ember's place at time t (false when not born or gone): it leaves the source with the fire, slows hard, then
// rises and drifts on the warm air
function ember(B, i, ts, t, out) {
  const life = 1.0 + 1.0 * hash(i * 4.3 + B.seed + 31);
  const a = t - ts; if (a < 0 || a > life) return false;
  const s = srcAt(B.src, ts), d = new THREE.Vector3(s[4], s[5], s[6]); if (d.lengthSq() < 1e-8) d.set(0, 0, 1); d.normalize();
  const side = new THREE.Vector3(0, 1, 0).cross(d); if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize();
  const up = d.clone().cross(side).normalize(), sp = (B.spread ?? 0.1) * 2.5 + 0.15;
  const u1 = hash(i * 6.1 + B.seed + 33), u2 = hash(i * 8.9 + B.seed + 34), ang = sp * Math.sqrt(u1), phi = u2 * Math.PI * 2;
  const v = d.multiplyScalar(Math.cos(ang)).addScaledVector(side, Math.sin(ang) * Math.cos(phi)).addScaledVector(up, Math.sin(ang) * Math.sin(phi));
  const kind = B.kind || "jet", base = (B.speed ?? 7) * (kind === "hold" ? 0.12 : kind === "arc" ? 0.45 : 0.55);
  const speed = base * (0.5 + 0.9 * hash(i * 2.2 + B.seed + 35)), k = 2.6;
  out.pos.set(s[1], s[2], s[3]).addScaledVector(v, speed * (1 - Math.exp(-k * a)) / k);
  const rise = 0.25 + 0.3 * hash(i * 3.3 + B.seed + 36);
  out.pos.y += rise * a + 0.05 * a * a;
  out.pos.x += 0.08 * a * Math.sin(a * 5 + i * 1.9); out.pos.z += 0.08 * a * Math.cos(a * 4 + i * 2.7);
  out.age = a / life;
  out.size = 0.007 + 0.008 * hash(i * 5.7 + B.seed + 37);
  out.seed = hash(i * 1.9 + B.seed + 38);
  return true;
}

export const FIRE_KINDS = {
  firebend(P) {
    const blasts = (P.spec.blasts || []).map((b, j) => ({ ...b, seed: b.seed ?? j * 17.3 + 1 }));
    const quad = new THREE.PlaneGeometry(1, 1);
    const geo = new THREE.InstancedBufferGeometry(); geo.index = quad.index; geo.attributes.position = quad.attributes.position; geo.attributes.uv = quad.attributes.uv;
    const aPos = new THREE.InstancedBufferAttribute(new Float32Array(MAXN * 3), 3), aDir = new THREE.InstancedBufferAttribute(new Float32Array(MAXN * 3), 3);
    const aInfo = new THREE.InstancedBufferAttribute(new Float32Array(MAXN * 4), 4);   // size, age, seed, stretch
    for (const a of [aPos, aDir, aInfo]) a.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("aPos", aPos); geo.setAttribute("aDir", aDir); geo.setAttribute("aInfo", aInfo);
    geo.instanceCount = 0;
    // drawn as five passes over every flame, outermost first: smoke, red, orange, yellow, the white core. Each pass draws
    // every flame as a disc of its own band's size, so the discs of one band melt into one shape and the bands nest
    // inside each other like painted cels: one fire, not a pile of leaves (the first try, flames shaded one by one,
    // read as feathers)
    const BANDS = [
      { r: 0.8, col: [0.24, 0.15, 0.13], a: 0.28, smoke: 1 },
      { r: 1.0, col: [0.72, 0.1, 0.05], a: 1 },
      { r: 0.8, col: [0.99, 0.36, 0.07], a: 1 },
      { r: 0.58, col: [1.0, 0.7, 0.16], a: 1 },
      { r: 0.3, col: [1.0, 0.96, 0.76], a: 1 },
    ];
    const BLUE = [[0.2, 0.2, 0.3], [0.08, 0.16, 0.6], [0.14, 0.38, 0.95], [0.45, 0.72, 1.0], [0.9, 0.97, 1.0]];
    const mats = BANDS.map((bd, k) => {
      const m = new THREE.ShaderMaterial({
        uniforms: { uR: { value: bd.r }, uCol: { value: new THREE.Color(...bd.col) }, uA: { value: bd.a }, uSmoke: { value: bd.smoke ? 1 : 0 }, uK: { value: k } },
        vertexShader: `attribute vec3 aPos, aDir; attribute vec4 aInfo; uniform float uR; varying vec2 vUv; varying float vAge, vSeed;
          void main() {
            vUv = uv * 2.0 - 1.0; vAge = aInfo.y; vSeed = aInfo.z;
            vec4 c = modelViewMatrix * vec4(aPos, 1.0);
            vec3 dv = (modelViewMatrix * vec4(aPos + aDir, 1.0)).xyz - c.xyz;
            vec2 d = dv.xy; float dl = length(d);
            d = dl > 1e-4 ? d / dl : vec2(0.0, 1.0);
            d = normalize(mix(d, vec2(0.0, 1.0), clamp(vAge * 0.9, 0.0, 0.75)));   // cooling flames turn up
            vec2 q = vec2(-d.y, d.x);
            float L = aInfo.x * (1.0 + aInfo.w) * 1.3, W = aInfo.x * 1.3;
            c.xy += d * (position.y * L) + q * (position.x * W);
            gl_Position = projectionMatrix * c;
          }`,
        fragmentShader: `uniform float uR, uA, uSmoke, uK; uniform vec3 uCol; varying vec2 vUv; varying float vAge, vSeed;
          void main() {
            // y: tail (-1) .. head (+1). A round head and a tail that licks to a point
            float y = vUv.y, x = vUv.x;
            float prof = sqrt(clamp(1.0 - pow(max(0.0, y), 2.0), 0.0, 1.0)) * mix(0.35, 1.0, smoothstep(-1.0, 0.2, y));
            // this band's size: the hot inner bands shrink first as the flame cools; smoke grows as it dies
            float heat = clamp(1.0 - vAge * (0.6 + 0.55 * uK), 0.0, 1.0);
            float R = uSmoke > 0.5 ? smoothstep(0.4, 0.85, vAge) * uR : uR * mix(0.25, 1.0, heat) * (uK > 0.5 ? step(0.02, heat) : 1.0);
            if (R < 0.02) discard;   // (a band of zero size would leave its spine as a hairline)
            // ragged rim: outer bands lick more
            float lick = (0.16 - 0.025 * uK) * sin(y * 6.0 + x * 3.0 + vSeed * 40.0 + vAge * 12.0) + 0.07 * sin(y * 15.0 - vSeed * 21.0);
            float rr = min(0.97, R * prof * (1.0 + lick));
            if (rr < 0.06) discard;   // (the tip of the tail, thinner than a pixel, would draw as a dotted hairline)
            float e = length(vec2(x, max(0.0, -y) * 0.15)) / max(rr, 1e-3);
            float w = fwidth(e) * 0.75 + 0.002;
            float a = (1.0 - smoothstep(1.0 - w, 1.0 + w, e)) * uA;
            if (uSmoke > 0.5) a *= (1.0 - smoothstep(0.85, 1.0, vAge)) * step(0.0, vSeed);
            if (a < 0.01) discard;
            gl_FragColor = vec4(uCol, a);
          }`,
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
      });
      m.userData.noOutline = true;
      const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; mesh.renderOrder = 6 + k; mesh.castShadow = false; mesh.userData.steam = true;
      P.whole.add(mesh);
      return { m, mesh };
    });
    // the embers: little glowing dots, a hot yellow heart in an orange ring that dims to red, twinkling as they go
    const egeo = new THREE.InstancedBufferGeometry(); egeo.index = quad.index; egeo.attributes.position = quad.attributes.position; egeo.attributes.uv = quad.attributes.uv;
    const ePos = new THREE.InstancedBufferAttribute(new Float32Array(MAXE * 3), 3), eInfo = new THREE.InstancedBufferAttribute(new Float32Array(MAXE * 3), 3);
    for (const a of [ePos, eInfo]) a.setUsage(THREE.DynamicDrawUsage);
    egeo.setAttribute("aPos", ePos); egeo.setAttribute("aInfo", eInfo); egeo.instanceCount = 0;
    const emat = new THREE.ShaderMaterial({
      vertexShader: `attribute vec3 aPos, aInfo; varying vec2 vUv; varying float vAge, vSeed;
        void main() { vUv = uv * 2.0 - 1.0; vAge = aInfo.y; vSeed = aInfo.z;
          vec4 c = modelViewMatrix * vec4(aPos, 1.0); float s = aInfo.x * (1.0 - 0.5 * vAge);
          c.xy += position.xy * s * 2.0; gl_Position = projectionMatrix * c; }`,
      fragmentShader: `varying vec2 vUv; varying float vAge, vSeed;
        void main() { float r = length(vUv); if (r > 1.0) discard;
          float tw = 0.65 + 0.35 * sin(vAge * 40.0 + vSeed * 60.0);
          vec3 col = mix(mix(vec3(1.0, 0.86, 0.45), vec3(1.0, 0.5, 0.12), smoothstep(0.0, 0.5, vAge)), vec3(0.75, 0.16, 0.05), smoothstep(0.5, 0.95, vAge));
          float a = (1.0 - smoothstep(0.85, 1.0, r)) * tw * (1.0 - smoothstep(0.7, 1.0, vAge));
          if (a < 0.02) discard; gl_FragColor = vec4(col, a); }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });
    emat.userData.noOutline = true;
    const emesh = new THREE.Mesh(egeo, emat); emesh.frustumCulled = false; emesh.renderOrder = 11; emesh.castShadow = false; emesh.userData.steam = true;
    P.whole.add(emesh);
    const light = new THREE.PointLight("#ff8a3a", 0, 7, 1.6); P.whole.add(light);
    const f = { pos: new THREE.Vector3(), dir: new THREE.Vector3(), age: 0, size: 0, speed: 0, seed: 0, stretch: 0 };
    const list = [];
    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0; list.length = 0;
        let lw = 0; const lp = new THREE.Vector3();
        for (const B of blasts) {
          if (tt < B.at || tt > B.end + 2.2 || (B.cut != null && tt >= B.cut) || (B.show != null && tt < B.show)) continue;
          const rate = B.rate ?? 150, n0 = 0, n1 = Math.floor((Math.min(tt, B.end) - B.at) * rate);
          for (let i = n0; i <= n1; i++) {
            const ts = B.at + i / rate; if (ts > B.end) break;
            if (!flame(B, i, ts, tt, f)) continue;
            list.push([f.pos.x, f.pos.y, f.pos.z, f.dir.x, f.dir.y, f.dir.z, f.size, f.age, f.seed, Math.max(f.stretch, Math.min(2.2, f.speed * 0.18)), ts]);
            const w = Math.max(0, 1 - f.age * 1.6); lw += w; lp.addScaledVector(f.pos, w);
          }
        }
        // embers (their own count per second, the same seeds every frame)
        let ne = 0;
        for (const B of blasts) {
          if (tt < B.at || tt > B.end + 2.2 || (B.cut != null && tt >= B.cut) || (B.show != null && tt < B.show)) continue;
          const er = B.embers ?? (B.rate ?? 150) * (B.kind === "hold" ? 0.04 : 0.2), m1 = Math.floor((Math.min(tt, B.end) - B.at) * er);
          for (let i = 0; i <= m1 && ne < MAXE; i++) {
            const ts = B.at + i / Math.max(1e-6, er); if (ts > B.end) break;
            if (!ember(B, i, ts, tt, f)) continue;
            ePos.setXYZ(ne, f.pos.x, f.pos.y, f.pos.z); eInfo.setXYZ(ne, f.size, f.age, f.seed); ne++;
          }
        }
        egeo.instanceCount = ne; emesh.visible = ne > 0; ePos.needsUpdate = eInfo.needsUpdate = true;
        // the oldest drawn first, so the fresh fire near the hand lies on top
        list.sort((a, b) => a[10] - b[10]);
        const n = Math.min(MAXN, list.length);
        for (let i = 0; i < n; i++) { const q = list[list.length - n + i]; aPos.setXYZ(i, q[0], q[1], q[2]); aDir.setXYZ(i, q[3], q[4], q[5]); aInfo.setXYZW(i, q[6], q[7], q[8], q[9]); }
        geo.instanceCount = n; aPos.needsUpdate = aDir.needsUpdate = aInfo.needsUpdate = true;
        const blue = blasts.some((B) => B.hot === "blue" && tt >= B.at && tt <= B.end + 1);
        mats.forEach((q, k) => { q.mesh.visible = n > 0; q.m.uniforms.uCol.value.setRGB(...(blue ? BLUE[k] : BANDS[k].col)); });
        if (lw > 0) { light.position.copy(lp.multiplyScalar(1 / lw)); light.intensity = clamp(lw / 25, 0, 1) * (P.spec.light ?? 6); } else light.intensity = 0;
      },
    };
  },
};
