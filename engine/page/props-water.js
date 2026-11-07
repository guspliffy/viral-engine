import * as THREE from "three";
import { clamp } from "./util.js";

// Water bending (Pebble by the lake, Jonny 7 Nov 2026: "the bending should look really really good"; study:
// /mnt/project-files/videos/pebble/waterbend-01/STUDY.md). Water lifted out of a lake, led round by the hands, and put
// back. Every frame is worked out from the time alone (no state carried between frames), so shards, the frame cache
// and stills draw it the same.
//
//   waterbend   all the bent water in a clip, one prop at the world origin (x, y, z 0, rot 0, scale 1):
//     spec.level      the water surface's height (m, default 0): water below it is the lake and is not drawn
//     spec.streams    [{ path: [[t, x, y, z], ...],   where the stream's head is (world m, seconds). Start the track under
//                                                    the surface (it rises out of the lake) and end it under the surface
//                                                    (it drains back in)
//                       from: [x, y, z]              where it is drawn out of the water (under the surface): the stream
//                                                    is one tendril from there to the head, bent the way the head came
//                                                    (it trails where the head was `tail` seconds ago), so it is always
//                                                    joined to the lake while it is up
//                       tail 0.7 (s), r 0.07 (m: the radius at the stream's typical speed), v0 1.0 (m/s: that speed),
//                       drops 12 (a second, shed off the tendril), seed }]
//                     The stream keeps its volume: it thickens where it slows and thins and stretches where it speeds
//                     up, it widens where it leaves the surface (the water pulled up after it), and small waves run
//                     down its length. Two flat cel tones, a darker rim and a hard white highlight that slides along
//                     the flow; white flecks of foam where it is fast.
//     spec.rings      [[t, x, z, size], ...]: ripple rings on the surface (three spreading circles that fade); the
//                     streams add their own where they leave and enter the water, and a drop adds a small one where it
//                     lands
//     spec.pool       { x, z, r, seed }: a still pool on the ground the water comes out of (a flat cel water patch with
//                     a soft, uneven bank and a foam lip; its surface is `level`, so give level ~0.004 on a dry floor).
//                     Leave it out where the set's own painting is the water
//     spec.wet        [[x0, z0, x1, z1], ...]: where the surface is water (a painted lake beside a dry bank): rings and
//                     drop ripples only there (default: everywhere)
//     spec.light      a cool point light that rides with the water (default 2.4; 0 = none)
//     spec.colors     { deep, mid, light, foam } (CSS colours)
//   See-through for the checks (userData.steam), like steam and fire: nothing is "inside" the water.
const NS = 140, NR = 18, MAXD = 300, MAXR = 48;
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const smooth = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };

// a stream's head track at time u (clamped to its ends), into out
function at(path, u, out) {
  if (u <= path[0][0]) return out.set(path[0][1], path[0][2], path[0][3]);
  const L = path[path.length - 1]; if (u >= L[0]) return out.set(L[1], L[2], L[3]);
  let lo = 0, hi = path.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (path[m][0] <= u) lo = m; else hi = m; }
  const a = path[lo], b = path[hi], k = (u - a[0]) / Math.max(1e-6, b[0] - a[0]);
  // Catmull-Rom through the neighbours, so the track has no corners between its samples
  const p0 = path[Math.max(0, lo - 1)], p3 = path[Math.min(path.length - 1, hi + 1)];
  const cr = (j) => { const P0 = p0[j], P1 = a[j], P2 = b[j], P3 = p3[j], k2 = k * k, k3 = k2 * k; return 0.5 * (2 * P1 + (-P0 + P2) * k + (2 * P0 - 5 * P1 + 4 * P2 - P3) * k2 + (-P0 + 3 * P1 - 3 * P2 + P3) * k3); };
  return out.set(cr(1), cr(2), cr(3));
}
const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
function speedAt(path, u) { at(path, u - 0.02, tmpA); at(path, u + 0.02, tmpB); return tmpA.distanceTo(tmpB) / 0.04; }
// the times a track crosses the surface (rising out of it: up true)
function crossings(path, level) {
  const out = [];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    if ((a[2] - level) * (b[2] - level) < 0) { const k = (level - a[2]) / (b[2] - a[2]); out.push({ t: a[0] + k * (b[0] - a[0]), x: a[1] + k * (b[1] - a[1]), z: a[3] + k * (b[3] - a[3]), up: b[2] > a[2] }); }
  }
  return out;
}

// the tendril at time t: a cubic from the head (s 0) to where it leaves the water (s 1); the first control is where
// the head was a third of `tail` ago (the near part follows the head's path), the second leans over the source toward
// where the head was further back (the lower part is pulled after it)
const K = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], kTmp = new THREE.Vector3();
function controls(q, t, ctl = K) {
  const tail = q.tail ?? 0.7, A = q.from || [q.path[0][1], q.path[0][2], q.path[0][3]];
  at(q.path, t, ctl[0]); at(q.path, t - tail * 0.35, ctl[1]); at(q.path, t - tail, kTmp);
  ctl[3].set(A[0], A[1], A[2]);
  const up = Math.max(0, ctl[0].y - A[1]);
  ctl[2].set(A[0], A[1] + 0.55 * up, A[2]).lerp(kTmp, 0.35);
  // the first control never above the head by much, so the tendril doesn't loop over its own head
  return ctl;
}
function bez(c, s, out) {
  const u = 1 - s, a = u * u * u, b = 3 * u * u * s, d = 3 * u * s * s, e = s * s * s;
  return out.set(a * c[0].x + b * c[1].x + d * c[2].x + e * c[3].x, a * c[0].y + b * c[1].y + d * c[2].y + e * c[3].y, a * c[0].z + b * c[1].z + d * c[2].z + e * c[3].z);
}
const K2 = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];

const VERT = `attribute float aS, aV; uniform float uLevel; varying vec3 vN, vW; varying float vS, vV;
  void main() { vS = aS; vV = aV; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w; }`;
const FRAG = `uniform vec3 uDeep, uMid, uLight, uFoam, uKey; uniform float uLevel, uT, uSeed; varying vec3 vN, vW; varying float vS, vV;
  float h21(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
  void main() {
    if (vW.y < uLevel) discard;   // under the surface it is the lake
    vec3 n = normalize(vN), v = normalize(cameraPosition - vW), l = normalize(uKey);
    if (dot(n, v) < 0.0) n = -n;
    float ndl = dot(n, l), f = 1.0 - abs(dot(n, v));
    // two flat tones from the light, the deep tone round the rim (the edge of a body of water reads darker)
    vec3 col = ndl > 0.1 ? uLight : (ndl > -0.45 ? uMid : uDeep);
    col = mix(col, uDeep, step(0.8, f));                                   // a thin dark edge, like an ink line
    col = mix(col, mix(uLight, uFoam, 0.6), step(0.62, f) * step(f, 0.8) * step(0.0, ndl));   // a pale rim inside it on the lit side
    // the hard highlight: long white streaks where the light glances off, sliding down the flow
    vec3 hv = normalize(l + v); float sp = pow(max(dot(n, hv), 0.0), 7.0);
    float streak = step(0.42, fract(vS * 5.0 - uT * 1.1 + uSeed));
    col = mix(col, uFoam, step(0.6, sp) * streak);
    // foam flecks where the water is fast, and a white lip where it meets the surface
    float fast = smoothstep(0.9, 2.2, vV);
    vec2 cell = floor(vec2(vS * 140.0 - uT * 6.0, atan(n.z, n.x) * 5.0));
    col = mix(col, uFoam, step(1.0 - 0.12 * fast, h21(cell + uSeed)) * step(0.3, f));
    col = mix(col, uFoam, 1.0 - smoothstep(0.0, 0.035, vW.y - uLevel));
    gl_FragColor = vec4(col, mix(0.72, 0.95, step(0.62, f)));
  }`;
const DVERT = `attribute vec3 aPos, aVel; attribute vec2 aInfo; varying vec2 vUv;
  void main() { vUv = uv * 2.0 - 1.0; vec4 c = modelViewMatrix * vec4(aPos, 1.0);
    vec3 d3 = (modelViewMatrix * vec4(aPos + aVel * 0.02, 1.0)).xyz - c.xyz; vec2 d = length(d3.xy) > 1e-5 ? normalize(d3.xy) : vec2(0.0, 1.0), q = vec2(-d.y, d.x);
    float s = aInfo.x, st = 1.0 + aInfo.y;   // a drop stretches along its fall
    c.xy += d * (position.y * s * st) + q * (position.x * s); gl_Position = projectionMatrix * c; }`;
const DFRAG = `uniform vec3 uMid, uLight, uFoam; varying vec2 vUv;
  void main() { float y = vUv.y, x = vUv.x;
    float w = y > 0.0 ? sqrt(max(0.0, 1.0 - y * y)) : 1.0 - (-y);   // a round head, a pointed tail (a teardrop)
    if (abs(x) > w * 0.95 || w <= 0.0) discard;
    vec3 col = abs(x) > w * 0.62 ? uMid : uLight;
    if (length(vec2(x + 0.3, y - 0.35)) < 0.22) col = uFoam;
    gl_FragColor = vec4(col, 0.95); }`;
const RFRAG = `uniform vec3 uFoam, uMid; uniform float uR, uA; varying vec2 vUv;
  void main() { float r = length(vUv) * 2.0; float w = fwidth(r) * 1.2 + 0.004;
    float line = 1.0 - smoothstep(0.018, 0.018 + w, abs(r - uR));
    float under = 1.0 - smoothstep(0.03, 0.03 + w, abs(r - uR + 0.045));
    if (line + under < 0.02) discard;
    gl_FragColor = vec4(mix(uMid, uFoam, line), (line * 0.95 + under * 0.4) * uA); }`;

export const WATER_KINDS = {
  waterbend(P) {
    const S = P.spec, level = S.level ?? 0, streams = (S.streams || []).filter((q) => q.path?.length > 1);
    const C = { deep: "#3a7f9c", mid: "#68b2c9", light: "#b4e2ec", foam: "#f6feff", ...(S.colors || {}) };
    const uni = () => ({ uDeep: { value: new THREE.Color(C.deep) }, uMid: { value: new THREE.Color(C.mid) }, uLight: { value: new THREE.Color(C.light) }, uFoam: { value: new THREE.Color(C.foam) },
      uKey: { value: new THREE.Vector3(...(S.key || [0.45, 0.85, 0.55])) }, uLevel: { value: level }, uT: { value: 0 }, uSeed: { value: 0 } });
    const steam = (o, order) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.userData.steam = true; o.material.userData.noOutline = true; P.whole.add(o); return o; };

    // ---------------------------------------------------------------- the streams: one tube each, rebuilt per frame
    const tubes = streams.map((q, k) => {
      const g = new THREE.BufferGeometry(), N = (NS + 1) * NR;
      const pos = new THREE.BufferAttribute(new Float32Array(N * 3), 3), aS = new THREE.BufferAttribute(new Float32Array(N), 1), aV = new THREE.BufferAttribute(new Float32Array(N), 1);
      for (const a of [pos, aV]) a.setUsage(THREE.DynamicDrawUsage);
      for (let i = 0; i <= NS; i++) for (let j = 0; j < NR; j++) aS.setX(i * NR + j, i / NS);
      const idx = [];
      for (let i = 0; i < NS; i++) for (let j = 0; j < NR; j++) { const a = i * NR + j, b = i * NR + ((j + 1) % NR), c = a + NR, d = b + NR; idx.push(a, c, b, b, c, d); }
      // the head's cap: a fan to the tip point
      g.setIndex(idx); g.setAttribute("position", pos); g.setAttribute("aS", aS); g.setAttribute("aV", aV);
      const m = new THREE.ShaderMaterial({ uniforms: uni(), vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: true, side: THREE.DoubleSide });
      m.uniforms.uSeed.value = hash(k + 3.7);
      const mesh = steam(new THREE.Mesh(g, m), 6);
      return { q, g, pos, aV, m, mesh, cross: crossings(q.path, level) };
    });

    // ---------------------------------------------------------------- drops: camera-facing teardrops
    const quad = new THREE.PlaneGeometry(1, 1);
    const dg = new THREE.InstancedBufferGeometry(); dg.index = quad.index; dg.attributes.position = quad.attributes.position; dg.attributes.uv = quad.attributes.uv;
    const dPos = new THREE.InstancedBufferAttribute(new Float32Array(MAXD * 3), 3), dVel = new THREE.InstancedBufferAttribute(new Float32Array(MAXD * 3), 3), dInfo = new THREE.InstancedBufferAttribute(new Float32Array(MAXD * 2), 2);
    for (const a of [dPos, dVel, dInfo]) a.setUsage(THREE.DynamicDrawUsage);
    dg.setAttribute("aPos", dPos); dg.setAttribute("aVel", dVel); dg.setAttribute("aInfo", dInfo); dg.instanceCount = 0;
    const dm = new THREE.ShaderMaterial({ uniforms: uni(), vertexShader: DVERT, fragmentShader: DFRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const dmesh = steam(new THREE.Mesh(dg, dm), 7);

    // ---------------------------------------------------------------- ripple rings: flat circles on the surface
    const rgeo = new THREE.PlaneGeometry(1, 1); rgeo.rotateX(-Math.PI / 2);
    const rings = Array.from({ length: MAXR }, () => {
      const m = new THREE.ShaderMaterial({ uniforms: { ...uni(), uR: { value: 0.5 }, uA: { value: 0 } }, vertexShader: `varying vec2 vUv; void main() { vUv = uv - 0.5; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`, fragmentShader: RFRAG, transparent: true, depthWrite: false });
      const o = steam(new THREE.Mesh(rgeo, m), 5); o.visible = false; return { o, m };
    });

    // ---------------------------------------------------------------- the pool: an uneven disc lying on the floor
    let poolMat = null;
    if (S.pool) {
      const PL = S.pool, n = 96, sd = PL.seed ?? 1, pts = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        // the bank: a few long bays and points (low harmonics), never a regular wobble
        const r = PL.r * (1 + 0.09 * Math.sin(2 * a + sd) + 0.06 * Math.sin(3 * a + 2.1 * sd) + 0.035 * Math.sin(5 * a + 0.7 * sd) + 0.02 * Math.sin(9 * a + 3.3 * sd));
        pts.push(new THREE.Vector2(Math.cos(a) * r * (PL.sx ?? 1), Math.sin(a) * r));
      }
      // a polar mesh (centre, then rings out to the bank), so the shading can go from deep in the middle to the bank
      const NRG = 14, pos = [0, 0, 0], rr = [0], idx = [];
      for (let k = 1; k <= NRG; k++) for (let i = 0; i < n; i++) { const f = k / NRG; pos.push(pts[i].x * f, 0, -pts[i].y * f); rr.push(f); }
      for (let i = 0; i < n; i++) idx.push(0, 1 + ((i + 1) % n), 1 + i);
      for (let k = 1; k < NRG; k++) for (let i = 0; i < n; i++) { const a = 1 + (k - 1) * n + i, b = 1 + (k - 1) * n + ((i + 1) % n), c = a + n, d = b + n; idx.push(a, b, c, b, d, c); }
      const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); pg.setIndex(idx);
      pg.setAttribute("aR", new THREE.Float32BufferAttribute(rr, 1));
      const pm = new THREE.ShaderMaterial({ uniforms: { ...uni(), uPoolZ: { value: PL.z ?? 0 }, uPoolR: { value: PL.r } },
        vertexShader: `attribute float aR; varying float vR; varying vec3 vW; void main() { vR = aR; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: `uniform vec3 uDeep, uMid, uLight, uFoam; uniform float uT, uPoolZ, uPoolR; varying float vR; varying vec3 vW;
          void main() {
            // the sky in it: light on the far half, the water's own colour on the near half, a dark band under the far
            // bank (its reflection), slow wavering white glints, and a pale lip at the edge
            float far = clamp((uPoolZ - vW.z) / uPoolR, -1.0, 1.0);
            vec3 col = far > 0.15 ? uLight : uMid;
            col = mix(col, uDeep, step(0.72, far) * step(vR, 0.9));
            float wv = vW.x * 7.0 + sin(uT * 0.7 + vW.z * 9.0) * 0.6;
            float glint = step(0.86, sin(wv * 3.0) * sin(vW.z * 31.0 + uT * 0.9));
            col = mix(col, uFoam, glint * step(vR, 0.88) * 0.85);
            col = mix(col, mix(uLight, uFoam, 0.55), step(0.95, vR));
            gl_FragColor = vec4(col, 1.0 - smoothstep(0.97, 1.0, vR) * 0.6);
          }`, transparent: true, depthWrite: false, side: THREE.DoubleSide });
      const pool = steam(new THREE.Mesh(pg, pm), 2); pool.position.set(PL.x ?? 0, level, PL.z ?? 0); pool.receiveShadow = false;
      poolMat = pm;
    }

    const light = new THREE.PointLight("#9fdcff", 0, 4, 1.6); P.whole.add(light);

    // the stream's drops at time t: shed off the tail while it is above the water, then they fall
    const G = 9.8, c0 = new THREE.Vector3(), c1 = new THREE.Vector3();
    function drops(q, k, t, emit, ringOut) {
      const rate = q.drops ?? 12, tail = q.tail ?? 0.7, t0 = q.path[0][0], t1 = q.path[q.path.length - 1][0] + tail;
      const i0 = Math.max(0, Math.floor((t - 1.4 - t0) * rate)), i1 = Math.floor((Math.min(t, t1) - t0) * rate);
      for (let i = i0; i <= i1; i++) {
        const ts = t0 + i / rate, a = t - ts; if (a < 0) continue;
        const sd = (q.seed ?? k) * 17.3 + i, s = 0.1 + 0.9 * hash(sd + 1);
        bez(controls(q, ts, K2), s * 0.85, c0); if (c0.y < level + 0.02) continue;   // only off water that is out of the lake
        bez(controls(q, ts - 0.03, K2), s * 0.85, c1);
        const vx = (c0.x - c1.x) / 0.03 * 0.55 + (hash(sd + 2) - 0.5) * 0.5, vy = (c0.y - c1.y) / 0.03 * 0.55 + hash(sd + 3) * 0.4, vz = (c0.z - c1.z) / 0.03 * 0.55 + (hash(sd + 4) - 0.5) * 0.5;
        const R = q.r ?? 0.07, ang = hash(sd + 5) * Math.PI * 2;
        const x0 = c0.x + Math.cos(ang) * R * 0.8, y0 = c0.y + Math.sin(ang) * R * 0.8, z0 = c0.z;
        // where it meets the surface: y0 + vy a - G a^2 / 2 = level
        const disc = vy * vy + 2 * G * (y0 - level), tl = (vy + Math.sqrt(Math.max(0, disc))) / G;
        if (a > tl) { if (a < tl + 1.2) ringOut.push([ts + tl, x0 + vx * tl, z0 + vz * tl, 0.07 + 0.05 * hash(sd + 6), 1]); continue; }
        emit(x0 + vx * a, y0 + vy * a - 0.5 * G * a * a, z0 + vz * a, vx, vy - G * a, vz, 0.012 + 0.014 * hash(sd + 7));
      }
    }

    const fr = Array.from({ length: NS + 1 }, () => ({ p: new THREE.Vector3(), t: new THREE.Vector3(), n: new THREE.Vector3(), b: new THREE.Vector3(), r: 0, v: 0 }));
    const nrm = new THREE.Vector3(), vtx = new THREE.Vector3();
    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, ringList = [...(S.rings || [])];
        let lw = 0; const lp = new THREE.Vector3();
        let nd = 0;
        const emit = (x, y, z, vx, vy, vz, size) => { if (nd >= MAXD) return; dPos.setXYZ(nd, x, y, z); dVel.setXYZ(nd, vx, vy, vz); dInfo.setXY(nd, size, clamp(Math.hypot(vx, vy, vz) * 0.25, 0, 2.5)); nd++; };
        for (const [k, T] of tubes.entries()) {
          const q = T.q, tail = q.tail ?? 0.7, R = q.r ?? 0.07, v0 = q.v0 ?? 1.0;
          for (const c of T.cross) ringList.push([c.t, c.x, c.z, c.up ? 0.55 : 0.45], [c.t + 0.22, c.x, c.z, c.up ? 0.4 : 0.35]);
          drops(q, k, tt, emit, ringList);
          // the centre line: the head now, the body where the head was, back to `tail` seconds ago
          let any = false;
          for (let i = 0; i <= NS; i++) {
            const s = i / NS, u = tt - s * tail, F = fr[i];
            if (i === 0) controls(q, tt);
            bez(K, s, F.p); F.v = speedAt(q.path, u);
            if (F.p.y > level) any = true;
          }
          T.mesh.visible = any;
          if (!any) continue;
          // tangents and a frame carried along the line (parallel transport: no twist)
          for (let i = 0; i <= NS; i++) { const a = fr[Math.max(0, i - 1)].p, b = fr[Math.min(NS, i + 1)].p; fr[i].t.subVectors(a, b); if (fr[i].t.lengthSq() < 1e-12) fr[i].t.copy(i ? fr[i - 1].t : nrm.set(0, 1, 0)); fr[i].t.normalize(); }
          const t0v = fr[0].t, ref = Math.abs(t0v.y) < 0.9 ? nrm.set(0, 1, 0) : nrm.set(1, 0, 0);
          fr[0].n.crossVectors(t0v, ref).normalize(); fr[0].b.crossVectors(t0v, fr[0].n).normalize();
          for (let i = 1; i <= NS; i++) { const F = fr[i], E = fr[i - 1]; F.n.copy(E.n).addScaledVector(F.t, -E.n.dot(F.t)); if (F.n.lengthSq() < 1e-10) F.n.copy(E.n); F.n.normalize(); F.b.crossVectors(F.t, F.n).normalize(); }
          for (let i = 0; i <= NS; i++) {
            const s = i / NS, F = fr[i];
            // the profile: a round head, a body that tapers to a thin tail; volume kept (thicker slow, thinner fast);
            // wider where it leaves the surface; small waves running down it
            // a tendril: a thin rounded tip that swells smoothly toward the water (never a bulb on a neck)
            const head = s < 0.035 ? Math.sqrt(Math.max(0, 1 - ((0.035 - s) / 0.035) ** 2)) : 1;
            const body = 0.42 + 0.58 * smooth(s / 0.55) + 0.12 * smooth((s - 0.7) / 0.3);
            const vol = clamp(Math.sqrt(v0 / Math.max(0.08, F.v)), 0.62, 1.4);
            const base = 1 + 1.1 * Math.exp(-Math.max(0, F.p.y - level) / 0.06) * smooth((s - 0.55) / 0.45);   // only the root widens where it leaves the water
            const wave = 1 + smooth(s / 0.15) * (0.035 * Math.sin(s * 17 - tt * 6 + k) + 0.02 * Math.sin(s * 41 + tt * 4.3 + 2 * k));   // ripples run down it, none at the tip
            F.r = R * head * body * vol * base * wave;
            if (i === 0) F.r = 0.001;   // the very tip closes the tube
            lw += F.p.y > level ? 1 : 0; if (F.p.y > level) lp.add(F.p);
          }
          for (let i = 0; i <= NS; i++) {
            const F = fr[i];
            for (let j = 0; j < NR; j++) {
              const a = (j / NR) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
              vtx.copy(F.p).addScaledVector(F.n, ca * F.r).addScaledVector(F.b, sa * F.r);
              T.pos.setXYZ(i * NR + j, vtx.x, vtx.y, vtx.z); T.aV.setX(i * NR + j, F.v);
            }
          }
          T.pos.needsUpdate = T.aV.needsUpdate = true; T.g.computeVertexNormals(); T.g.computeBoundingSphere();
          T.m.uniforms.uT.value = tt;
        }
        dg.instanceCount = nd; dmesh.visible = nd > 0; dPos.needsUpdate = dVel.needsUpdate = dInfo.needsUpdate = true;
        // the ripples: each event three rings, 0.25 s apart, spreading and fading over 1.8 s
        let nr = 0;
        const wet = (x, z) => !S.wet || S.wet.some(([x0, z0, x1, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1);
        for (const [t0, x, z, size, nw = 2] of ringList) if (wet(x, z)) for (let w = 0; w < nw && nr < MAXR; w++) {
          const a = tt - t0 - w * 0.25; if (a < 0 || a > 1.8) continue;
          const R = rings[nr++]; R.o.visible = true;
          const rad = size * (0.25 + 0.95 * (1 - Math.exp(-1.6 * a))) * (1 - 0.2 * w);
          R.o.position.set(x, level + 0.004, z); R.o.scale.set(rad * 2.4, 1, rad * 2.4);
          R.m.uniforms.uR.value = 1 / 1.2; R.m.uniforms.uA.value = (1 - smooth(a / 1.8)) * (w ? 0.5 : 0.8) * (nw === 1 ? 0.6 : 1);
        }
        for (let i = nr; i < MAXR; i++) rings[i].o.visible = false;
        if (poolMat) poolMat.uniforms.uT.value = tt;
        if (lw > 0 && (S.light ?? 2.4) > 0) { light.position.copy(lp.multiplyScalar(1 / lw)); light.intensity = clamp(lw / 40, 0, 1) * (S.light ?? 2.4); } else light.intensity = 0;
      },
    };
  },
};
