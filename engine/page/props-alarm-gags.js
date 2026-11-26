import * as THREE from "three";
import { clamp } from "./util.js";
import { flameMesh, glowMesh } from "./props-candle.js";

// How you invented 01 "The alarm clock": the gag machines (task B of storyboards/series/how-you-invented/01-alarm-clock/DESIGN.md,
// sections 2.4 to 2.7). Metres, +x screen right, +y up, +z toward the camera. Everything is a pure function of the keys and
// the clip time: no Math.random, no wall clock, nothing keeps a mesh between frames except by exact inputs. Nothing tweens a
// material opacity: things appear by `visible` or by scale. The falls (water, anvil, the two nails, the whipping rope) are
// designed paths INSIDE each kind, not engine physics: the director drives them with one number each (seconds since).
//
// HOW THE KEYS REACH A KIND. A key the engine already holds (burn, fall, bend, on, tip, tilt, fill, pull, lit, scale ...) is
// tweened by a `prop` action as usual. A key the engine does not hold (swing, flip, snap, pour, nailA, nailB, flare, h, hitY)
// must be seeded first by a duration-0 `prop` action with `set` (c.prop(t, id, { snap: -1 }, 0)), then it tweens like any other;
// until then the spec value (or the default) is read. NOTE the engine's own `tip` is the whole prop's lean about its origin;
// the bucket's tipping about its ear pins is therefore called `flip` (0..180), not `tip`. Do not tween `tip` on a bucket.
// A prop's `rot` must stay 0 and `scale` 1 for all six kinds (their parts are placed in world metres).
//
// KINDS (origin; keys with defaults; size)
//   beamrope    Origin: the world origin (its points are absolute). One hemp rope r 0.012 over the ceiling beam (underside y 2.05,
//               0.22 x 0.22, centred z -0.70): a load leg, one 3/4 turn round the beam at xa, a run along the beam, one 3/4 turn
//               at xb, a tail leg. Spec: xa 0.55, xb -0.25 (x of the two turns), load [x,y,z] the load end (default
//               [xa, 1.66, -0.70]), to "<prop id>" (the rope's load end follows that prop's `ring` anchor every frame: the
//               waterbucket's rim ring or the anvil's ring; this wins over `load`), tail [x,y,z] the tail end (default
//               [xb, 0.30, -0.70]), bridle true (the tail ends in a knot r 0.03 at `knot`, default [xb, 0.85, -0.25], and
//               two 0.014 strands go to two iron staples on the stool top (0.27, 0.425, -0.25) and (0.47, 0.425, -0.25)),
//               runOn "front" (default: the run lies on the beam's FRONT face so a lens below sees it; "top" is the design's
//               original, invisible from any lens under y 2.27), hang 1|-1 (after it parts the dangling piece hangs above
//               the load, 1 = the anvil, or below it, -1 = the bucket; default -1 when `to` names a waterbucket, else 1),
//               hangLen 0.45 (0.30 for a bucket). Keys: pull 0..0.30 m (tail end down by it), slack 0..1 (the load leg bows), burn 0..1 (0..0.5
//               the knot darkens and 3 fibres curl, 0.5..0.9 an ember ring creeps round it and a smoke thread rises 0.25,
//               1 parts), snap = seconds since it parted (< 0 or unseeded = intact): the tail end whips back up the tail leg,
//               over the beam and along the run (the tail leg is gone in 0.25 s, the whole rope at 0.36 s), then the
//               piece hangs from the load and its free end swings 0.3 m at 2 Hz damped; the two strands fall onto the stool.
//               Held by gloves: the rope is marked not solid (a glove closes round it).
//   waterbucket Origin: its top pivot on the beam's underside (director: (0.90, 2.05, -0.70)). Spec: hang 0.25 (rope pivot to
//               bail apex; apex -0.25, rim -0.37, underside -0.63 from the pivot), round 2|3 (picks the pour defaults below),
//               pourSwing / pourFlip (pose at which the water leaves; round 2: -55 / 115, round 3: 0 / 160), hitY (1.02 round
//               2, 0.97 round 3), landZ (z the stream aims at; round 2 -1.13 = Spud, round 3 -0.5). Keys: swing degrees about
//               the pivot (rotation about z; negative = toward -x), flip 0..180 degrees about the ear pins (mouth toward -x;
//               the design calls this `tip`), fill 0..1 (water disc; scale 0 at 0; it also vanishes by itself between flip 70
//               and 105), pour = seconds since the water left (< = 0 none; 24 blobs + a ribbon leave over 0.35 s at 1.6 m/s
//               along the mouth axis, ballistic g 9.8, end on hitY in a crown of 10 drops, all gone at 1.1 s).
//               Anchor `ring` (root.userData.ring and anchors.ring): the rim ring the trip rope ties to.
//   mouthjet    Origin: the prop's own origin; the jet stands at Mash's mouth. Spec: mouth "mash" and target "<this prop's own id>"
//               (REQUIRED: stage.js then calls aim() every frame with the mouth's world point; `wear` is not needed and not
//               used). The column stands along WORLD up whatever his pitch. Keys: on 0|1, h 0..1 (default 1; column
//               0.35 x h tall, r 0.016 at the mouth to 0.028 at the top, a crown of 9 arcs, 14 drops); it breathes with the
//               snore: x (0.75 + 0.25 sin(2 pi 0.45 t)). See-through for the checks.
//   anvil       Origin: the CENTRE OF ITS BASE, on the floor under it: put the prop at (-0.40, 0, -0.70) and the kind lifts itself
//               to hangY (spec, default 1.28; ring 0.37 over the base). 0.56 long (horn 0.20 toward -x, heel 0.10 toward +x), top
//               face 0.26 x 0.13, waist 0.11, base 0.26 x 0.20, 0.34 tall. Key fall = seconds since release (<= 0 hangs and sways 1
//               degree): base y = hangY - 4.9 t^2, the floor at 0.51 s, on through it, rest at 0.59 s with the base at y -0.44, tipped
//               14 degrees (horn down), then two frames of 0.01 bounce. Anchor `ring`.
//   nailcandle  Origin: bottom centre, on the stool top: (0.37, 0.42, -0.25). Tallow r 0.03, height 0.40 - 0.26 x burn, melted
//               lip, pool dip, wick, 7 wax runs (0.02 to 0.12), a foot of spilled wax (r 0.035 to 0.045). Keys: lit 0..1 (kit
//               flame), bend -1..1, flare 0..1 (or fire), burn 0..1. Nails point along D = (-0.6, 0, 0.8), 0.13 long. nailA = seconds since
//               it let go (0 stuck, 0.162 up the side, 0.035 in the wax): droops 20 degrees for 0.12 s, slides out at 0.5 m/s,
//               flicks clear of the stool rim (0.24 from the axis) and falls 0.57 m onto the floor plate at spec.plate
//               [0.17, 0.012, 0.03] (WORLD, the plate's top) at 0.46 s, one hop of 0.02, lies still. nailB: -1 absent, 0..1 pushed in
//               (0.152 up; at 1 its head is 0.125 from the axis), 1 + seconds since it let go: tips 0.10 s, slides out 0.035,
//               falls onto the bell (spec.bell [0.286, 0.432, -0.138] WORLD, spec.bellScale 1.15 = the kit callbell), its head
//               strikes at 0.21 s, skips once and lies leaning on the dome with its tip on the plate. No hold.
//   tinplate    Origin: bottom centre. Lathe r 0.10, flat middle r 0.07 (top y 0.012), rim to 0.020, dull tin, 3 dents. ONE prop:
//               (0.17, 0, 0.03) on the floor, then (0.286, 0.42, -0.138) on the stool.
// Nothing here is held (the gloves on the rope and the nail are director rest pins), so ALARM_GAGS_GRIPS is empty.
export const ALARM_GAGS_GRIPS = {};

const G = 9.8, DEG = Math.PI / 180;
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sm = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const AX_Z = V(0, 0, 1), UP = V(0, 1, 0);
const num = (ps, P, k, d) => ps[k] ?? P.spec[k] ?? d;
const lerpV = (a, b, k) => a.clone().lerp(b, k);
const steamy = (o) => { o.userData.steam = true; o.userData.solid = false; o.castShadow = false; o.frustumCulled = false; return o; };

// ------------------------------------------------------------------------------------------------------------------
// a tube along a moving polyline (rope, strands, water ribbon, smoke): fixed vertex budget, rewritten per frame
class Tube {
  constructor(parent, maxSec, sides, material, colored = false) {
    this.maxSec = maxSec; this.sides = sides; this.colored = colored;
    const nv = maxSec * sides;
    this.pos = new Float32Array(nv * 3); this.nor = new Float32Array(nv * 3); this.col = colored ? new Float32Array(nv * 3) : null;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3)); g.setAttribute("normal", new THREE.BufferAttribute(this.nor, 3));
    if (colored) g.setAttribute("color", new THREE.BufferAttribute(this.col, 3));
    const idx = [];
    for (let i = 0; i < maxSec - 1; i++) for (let j = 0; j < sides; j++) { const a = i * sides + j, b = i * sides + ((j + 1) % sides), c = a + sides, d = b + sides; idx.push(a, c, b, b, c, d); }
    g.setIndex(idx); this.geo = g;
    this.mesh = new THREE.Mesh(g, material); this.mesh.frustumCulled = false; this.mesh.castShadow = false; this.mesh.receiveShadow = true;
    parent.add(this.mesh);
    this.len = 0; this.end = V(); this.endDir = V(0, 1, 0);
  }
  // pts: Vector3[]; radius: number or (u) => r; step: the spacing of the sections; ca, cb: the two strand colours
  set(pts, radius, step = 0.025, ca = null, cb = null) {
    const n0 = pts.length, cum = [0];
    for (let i = 1; i < n0; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    const total = cum[n0 - 1];
    if (n0 < 2 || total < 1e-4) { this.mesh.visible = false; this.len = 0; return; }
    this.mesh.visible = true; this.len = total;
    const n = Math.min(this.maxSec, Math.max(2, Math.ceil(total / step) + 1));
    const S = [], T = []; let k = 0;
    for (let i = 0; i < n; i++) {
      const s = (total * i) / (n - 1);
      while (k < n0 - 2 && cum[k + 1] < s) k++;
      const seg = cum[k + 1] - cum[k], f = seg > 1e-9 ? (s - cum[k]) / seg : 0;
      S.push(lerpV(pts[k], pts[k + 1], clamp(f)));
    }
    for (let i = 0; i < n; i++) T.push(S[Math.min(n - 1, i + 1)].clone().sub(S[Math.max(0, i - 1)]).normalize());
    this.end.copy(S[n - 1]); this.endDir.copy(T[n - 1]);
    const N = new THREE.Vector3(), B = new THREE.Vector3(), q = new THREE.Vector3();
    N.crossVectors(T[0], Math.abs(T[0].z) < 0.9 ? V(0, 0, 1) : V(1, 0, 0)).normalize();
    const sides = this.sides, pos = this.pos, nor = this.nor, col = this.col;
    for (let i = 0; i < this.maxSec; i++) {
      const j0 = i < n ? i : n - 1;
      if (i < n) {
        const t = T[i];
        N.addScaledVector(t, -N.dot(t)); if (N.lengthSq() < 1e-8) N.crossVectors(t, V(1, 0, 0)); N.normalize();
      }
      B.crossVectors(T[j0], N);
      const u = j0 / (n - 1), s = total * u;
      let r = typeof radius === "function" ? radius(u) : radius;
      r *= Math.min(1, 0.25 + 0.75 * sm(Math.min(s, total - s) / 0.01));   // a blunt rounded end
      if (i >= n) r = 0;
      for (let j = 0; j < sides; j++) {
        const a = (j / sides) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a), o = (i * sides + j) * 3;
        q.set(N.x * c + B.x * sn, N.y * c + B.y * sn, N.z * c + B.z * sn);
        const rr = this.twist ? r * (1 + 0.16 * Math.cos(2 * a - 1.25 * i)) : r;   // a strand mark every 2 sections: twisted ridges
        pos[o] = S[j0].x + q.x * rr; pos[o + 1] = S[j0].y + q.y * rr; pos[o + 2] = S[j0].z + q.z * rr;
        nor[o] = q.x; nor[o + 1] = q.y; nor[o + 2] = q.z;
        if (col) { const cc = ((i + j) & 1) ? cb : ca; col[o] = cc.r; col[o + 1] = cc.g; col[o + 2] = cc.b; }
      }
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.normal.needsUpdate = true;
    if (col) this.geo.attributes.color.needsUpdate = true;
    this.geo.setDrawRange(0, (n - 1) * sides * 6);
  }
}
const polyLen = (p) => { let s = 0; for (let i = 1; i < p.length; i++) s += p[i].distanceTo(p[i - 1]); return s; };
// the first `s` metres of a polyline
function cutPoly(p, s) {
  const out = [p[0].clone()]; let acc = 0;
  for (let i = 1; i < p.length; i++) {
    const d = p[i].distanceTo(p[i - 1]);
    if (acc + d >= s) { out.push(lerpV(p[i - 1], p[i], d > 1e-9 ? (s - acc) / d : 0)); return out; }
    out.push(p[i].clone()); acc += d;
  }
  return out;
}
// corners (z, y) joined by straight runs with rounded corners of radius c
function rounded(corners, c) {
  const out = [corners[0].slice()];
  for (let i = 1; i < corners.length - 1; i++) {
    const p = corners[i], a = corners[i - 1], b = corners[i + 1];
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]), r = Math.min(c, 0.45 * la, 0.45 * lb);
    const p0 = [p[0] + ((a[0] - p[0]) / la) * r, p[1] + ((a[1] - p[1]) / la) * r], p1 = [p[0] + ((b[0] - p[0]) / lb) * r, p[1] + ((b[1] - p[1]) / lb) * r];
    for (let k = 0; k <= 4; k++) { const u = k / 4, w = 1 - u; out.push([w * w * p0[0] + 2 * w * u * p[0] + u * u * p1[0], w * w * p0[1] + 2 * w * u * p[1] + u * u * p1[1]]); }
  }
  out.push(corners[corners.length - 1].slice());
  return out;
}
// 2D (z, y) points -> 3D with x advancing from x0 to x1 along the loop's length
function loop3(pts2, x0, x1) {
  const cum = [0];
  for (let i = 1; i < pts2.length; i++) cum.push(cum[i - 1] + Math.hypot(pts2[i][0] - pts2[i - 1][0], pts2[i][1] - pts2[i - 1][1]));
  const L = cum[cum.length - 1] || 1;
  return pts2.map(([z, y], i) => V(x0 + (x1 - x0) * (cum[i] / L), y, z));
}

// ------------------------------------------------------------------------------------------------------------------
// the bucket's own geometry, shared by the bucket and by the rope's ring (a point q in the ear-pin frame -> the prop frame)
const BK = { rimR: 0.16, botR: 0.13, h: 0.26, pinUp: 0.09, ringR: 0.022 };
function bucketPoint(q, swing, flip, hang, out = V()) {
  out.copy(q).applyAxisAngle(AX_Z, flip * DEG); out.y -= hang + 0.29; return out.applyAxisAngle(AX_Z, swing * DEG);
}

// ------------------------------------------------------------------------------------------------------------------
export const ALARM_GAGS_KINDS = {
  // ================================================================================================================
  beamrope(P) {
    const S = P.spec, Z0 = -0.70, YU = 2.05, YT = 2.27, HZ = 0.11, R = 0.012, YM = 2.16;
    const xa = S.xa ?? 0.55, xb = S.xb ?? -0.25, bridle = !!S.bridle, runOn = S.runOn ?? "front";
    const tail0 = S.tail ?? [xb, 0.30, -0.70], knot0 = S.knot ?? [xb, 0.85, -0.25], load0 = S.load ?? [xa, 1.66, -0.70];
    const staples = [V(0.27, 0.425, -0.25), V(0.47, 0.425, -0.25)];
    const hempM = mat("#b9975a", { roughness: 0.92 });
    const rope = new Tube(P.whole, 340, 8, hempM, false); rope.mesh.userData.solid = false; rope.twist = true;
    const strandM = mat("#a88a52", { roughness: 0.92 });
    const strands = staples.map(() => { const t = new Tube(P.whole, 40, 5, strandM); t.mesh.userData.solid = false; return t; });
    // two iron staples on the stool top
    const iron = mat("#2b2b30", { roughness: 0.45, metalness: 0.5 });
    const stapleG = new THREE.Group(); P.whole.add(stapleG);
    for (const s of staples) { const t = mesh(new THREE.TorusGeometry(0.011, 0.0032, 6, 12, Math.PI), iron, stapleG, s.x, s.y + 0.0, s.z); t.rotation.set(0, 0, 0); t.scale.set(1, 1, 1); }
    // the knot: a lumpy hemp ball with 3 fibres, an ember ring and a smoke thread
    const knotG = new THREE.Group(); P.whole.add(knotG);
    const kgeo = new THREE.IcosahedronGeometry(0.03, 1);
    { const p = kgeo.attributes.position; for (let i = 0; i < p.count; i++) { const k = 0.88 + 0.26 * rnd(Math.round(p.getX(i) * 5000) * 3 + Math.round(p.getY(i) * 7000) * 5 + Math.round(p.getZ(i) * 9000) * 7); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.95, p.getZ(i) * k); } kgeo.computeVertexNormals(); }
    const knotM = mat("#b9975a", { roughness: 0.95 });
    mesh(kgeo, knotM, knotG);
    // the char: a dark shell that grows from the flame side over the knot (a material colour change would be lost to the look's cached copy)
    const charG = new THREE.Group(); charG.position.y = -0.03; knotG.add(charG);
    mesh(kgeo.clone().scale(1.04, 1.04, 1.04), mat("#3a2a1c", { roughness: 0.95 }), charG, 0, 0.03, 0);
    for (const [i, a] of [[0, 0.5], [1, 2.6], [2, 4.4]]) {   // curling fibres: two bent segments each
      const f = new THREE.Group(); f.position.set(Math.cos(a) * 0.018, 0.022, Math.sin(a) * 0.018); f.rotation.set(0, -a, 0); f.userData.i = i; knotG.add(f);
      const m1 = mesh(new THREE.CylinderGeometry(0.0018, 0.0026, 0.026, 5), knotM, f, 0.008, 0.01, 0); m1.rotation.z = -0.6;
      const m2 = mesh(new THREE.CylinderGeometry(0.001, 0.0018, 0.02, 5), knotM, f, 0.026, 0.026, 0); m2.rotation.z = -1.5;
      f.userData.fib = true;
    }
    const emberM = new THREE.MeshBasicMaterial({ color: "#ff8a2a" });
    const embers = Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2, e = mesh(new THREE.SphereGeometry(0.0058, 8, 6), emberM, knotG, Math.cos(a) * 0.031, -0.004, Math.sin(a) * 0.031); e.castShadow = false; e.userData.solid = false; return e; });
    const smokeM = new THREE.MeshBasicMaterial({ color: "#d4cfc8", transparent: true, opacity: 0.4, depthWrite: false });
    const smoke = new Tube(P.whole, 16, 5, smokeM); steamy(smoke.mesh); smoke.mesh.renderOrder = 3;
    knotG.visible = bridle; stapleG.visible = bridle; strands.forEach((s) => (s.mesh.visible = bridle));
    // the fixed part of the path, from the load leg's top on, for a pull (tail end lowered by it)
    const fixedPath = (pull) => {
      const c = 0.03, zb = Z0 - HZ - R, zf = Z0 + HZ + R, yb = YU - R, yt = YT + R;
      const dir = xb >= xa ? 1 : -1, adv = Math.min(0.045, Math.abs(xb - xa) / 2.6) * dir;
      const A = runOn === "top" ? [[Z0, yb], [zb, yb], [zb, yt], [Z0, yt]] : [[Z0, yb], [zb, yb], [zb, yt], [zf, yt], [zf, YM + 0.05]];
      const Bc = runOn === "top" ? [[Z0, yt], [zf, yt], [zf, yb]] : [[zf, YM - 0.05], [zf, yt], [zb, yt], [zb, yb], [zf, yb]];
      const la = loop3(rounded(A, c), xa, xa + adv), lb = loop3(rounded(Bc, c), xb - adv, xb);
      const runZ = runOn === "top" ? Z0 : zf, runY = runOn === "top" ? yt : YM, x0 = xa + adv, x1 = xb - adv, nr = Math.max(4, Math.ceil(Math.abs(x1 - x0) / 0.04));
      const run = [];
      for (let i = 0; i <= nr; i++) { const u = i / nr; run.push(V(x0 + (x1 - x0) * u, runY - 0.03 * Math.pow(Math.sin(2 * Math.PI * u), 2), runZ)); }
      const tailEnd = bridle ? V(...knot0) : V(...tail0).add(V(0, -pull, 0));
      return [...la, ...run, ...lb, tailEnd];
    };
    const kv = new THREE.Vector3(), tmp = new THREE.Vector3();
    let st = { burn: 0, snap: -1, pull: 0, slack: 0, t: 0 }, toKind = S.toKind ?? null;
    const build = (load) => {
      const { burn, snap, pull, slack, t } = st;
      const F = fixedPath(pull), e0 = polyLen(F), ringHang = toKind === "waterbucket" ? -1 : 1;
      let vis, kpos = null, parted = snap >= 0;
      const loadPt = load.clone(); if (!S.to) loadPt.y += pull;
      const bowLeg = (a, b) => { const o = []; const sl = clamp(slack); for (let i = 0; i <= 12; i++) { const u = i / 12, b4 = Math.sin(Math.PI * u); o.push(lerpV(a, b, u).add(V(0.05 * sl * b4, -0.03 * sl * b4, 0.12 * sl * b4))); } return o; };
      let ropeEnd;
      if (!parted) {
        vis = [...bowLeg(loadPt, F[0]), ...F.slice(1)]; ropeEnd = F[F.length - 1];
      } else {
        const a = 46, d = 0.5 * a * snap * snap, tc = Math.sqrt((2 * e0) / a);
        if (d < e0) { vis = [...bowLeg(loadPt, F[0]), ...cutPoly(F, e0 - d).slice(1)]; ropeEnd = vis[vis.length - 1]; }
        else {
          // the whole rope has run over the beam: it hangs from the load, its free end swinging
          const w = snap - tc, k = sm(w / 0.2), hl = S.hangLen ?? (ringHang < 0 ? 0.3 : 0.45), hd = S.hang ?? ringHang;
          const target = loadPt.clone().add(V(0, hd * hl, 0));
          const sway = 0.3 * Math.exp(-w / 0.35) * Math.sin(2 * Math.PI * 2 * w) * k;
          const top = lerpV(F[0], target, k).add(V(sway, 0, 0.3 * sway * 0.4));
          const mid = lerpV(loadPt, top, 0.5).add(V(sway * 0.45, 0, 0));
          vis = [loadPt.clone(), mid, top]; ropeEnd = top;
        }
      }
      rope.set(vis, R, 0.024);
      // the knot and its strands
      if (bridle) {
        const bu = clamp(burn);
        if (!parted) kpos = V(...knot0); else kpos = ropeEnd.clone();
        knotG.position.copy(kpos);
        knotG.visible = true;
        { const k = sm(bu / 0.5); charG.visible = k > 0.01; charG.scale.setScalar(Math.max(0.01, k)); }
        for (const f of knotG.children) if (f.userData.fib) { const k = sm((bu - 0.05 - f.userData.i * 0.12) / 0.3); f.visible = k > 0.01; f.scale.setScalar(Math.max(0.01, k)); }
        embers.forEach((e, i) => { e.visible = !parted && bu > 0.5 + 0.4 * (i / 14) && bu > 0.5; });
        const sk = !parted ? sm((bu - 0.5) / 0.1) : 0;
        if (sk > 0.01 && bu < 1.0001) {
          const pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push(V(kpos.x + Math.sin(u * 5 - t * 2.4) * 0.012 * u + 0.008 * u * u, kpos.y + 0.03 + 0.25 * sk * u, kpos.z + Math.sin(u * 3.4 - t * 1.7 + 0.7) * 0.01 * u)); }
          smoke.set(pts, (u) => 0.004 + 0.007 * u, 0.03);
        } else smoke.mesh.visible = false;
        staples.forEach((sp, si) => {
          const pts = [], lie = [];
          const side = si === 0 ? -1 : 1, n = 14;
          for (let i = 0; i <= n; i++) {
            const u = i / n, straight = lerpV(sp, V(...knot0), u);
            // sag a little while taut: it hangs from the knot
            let p = straight;
            if (parted) {
              const tau = snap, w = Math.pow(u, 1.0);
              // lying shape: a wavy line across the stool top, toward the open floor
              const lz = sp.z + 0.14 * u, lx = sp.x + side * 0.02 * Math.sin(u * 14) + side * 0.03 * u;
              const lying = V(lx, 0.432 + 0.003 * Math.sin(u * 20), lz);
              const kxz = sm(tau / 0.3) * w, ky = Math.min(1, Math.pow(tau / 0.3, 2)) * w;
              p = V(straight.x + (lying.x - straight.x) * kxz, straight.y + (lying.y - straight.y) * ky, straight.z + (lying.z - straight.z) * kxz);
            }
            pts.push(p);
          }
          strands[si].set(pts, 0.007, 0.03);
        });
      }
    };
    return {
      grip: 0,
      apply(ps, t) {
        st = { burn: ps.burn ?? 0, snap: num(ps, P, "snap", -1), pull: clamp(ps.pull ?? S.pull ?? 0, 0, 0.3), slack: clamp(num(ps, P, "slack", 0)), t };
        build(V(...load0));
      },
      // stage.js calls this with the target prop's root every frame (spec.to): the load end rides its ring
      link(world, root) {
        const ring = root.userData.ring; if (!ring) return;
        ring.updateWorldMatrix(true, false); ring.getWorldPosition(kv);
        P.root.updateWorldMatrix(true, false); tmp.copy(kv); P.root.worldToLocal(tmp);
        toKind = root.userData.kind || toKind;
        build(tmp.clone());
      },
    };
  },

  // ================================================================================================================
  waterbucket(P) {
    const S = P.spec, hang = S.hang ?? 0.25, pinY = -(hang + 0.29);
    const wood = [mat("#8a6238", { roughness: 0.8 }), mat("#6b4a2c", { roughness: 0.85 })], ironM = mat("#3a3a40", { roughness: 0.5, metalness: 0.5 });
    const ropeM = mat("#b9975a", { roughness: 0.9 }), dark = mat("#4a331e", { roughness: 0.9, side: THREE.DoubleSide });
    const waterM = mat("#8fc4dc", { roughness: 0.18, emissive: "#2c4d5e", emissiveIntensity: 0.55 });
    const swingG = new THREE.Group(); P.whole.add(swingG);
    // the hang rope, the bail and its two legs to the ear pins (all fixed in the swing frame)
    const cyl = (a, b, r, m, parent) => { const d = b.clone().sub(a), o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 6), m); o.position.copy(a).add(b).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(UP, d.clone().normalize()); o.castShadow = true; parent.add(o); return o; };
    cyl(V(0, 0, 0), V(0, -hang, 0), 0.011, ropeM, swingG);
    mesh(new THREE.SphereGeometry(0.017, 8, 6), ropeM, swingG, 0, -hang, 0);
    for (const s of [-1, 1]) { cyl(V(0, -hang, 0), V(0, pinY, s * 0.142), 0.0075, ropeM, swingG); }
    const tipG = new THREE.Group(); tipG.position.y = pinY; swingG.add(tipG);
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.012, 8), ironM, tipG, 0, 0, s * 0.141).rotation.x = Math.PI / 2;
    const bk = new THREE.Group(); bk.position.y = -BK.pinUp; tipG.add(bk);   // bucket bottom at bk y 0
    const rAt = (y) => BK.botR + (BK.rimR - BK.botR) * (y / BK.h), tilt = Math.atan2(BK.rimR - BK.botR, BK.h);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, g = new THREE.Group(); g.rotation.y = a; bk.add(g);
      const st = mesh(new THREE.BoxGeometry(0.0745, BK.h / Math.cos(tilt) + 0.002, 0.012), wood[i & 1], g, rAt(BK.h / 2), BK.h / 2 + 0.007, 0); st.rotation.z = -tilt;
    }
    mesh(new THREE.CylinderGeometry(BK.botR - 0.003, BK.botR - 0.003, 0.016, 24), wood[1], bk, 0, 0.008, 0);
    const lining = mesh(new THREE.CylinderGeometry(rAt(BK.h) - 0.012, rAt(0.01) - 0.012, BK.h - 0.012, 24, 1, true), dark, bk, 0, BK.h / 2 + 0.01, 0); lining.castShadow = false;
    for (const y of [0.05, 0.20]) { const h = mesh(new THREE.CylinderGeometry(rAt(y + 0.01) + 0.0065, rAt(y - 0.01) + 0.0065, 0.02, 24, 1, true), ironM, bk, 0, y, 0); h.material.side = THREE.DoubleSide; }
    // the ring on the rim's -x side (the trip rope ties to it)
    const ringG = new THREE.Group(); ringG.position.set(-(BK.rimR + 0.014), BK.h - 0.012, 0); bk.add(ringG);
    mesh(new THREE.TorusGeometry(BK.ringR, 0.0055, 6, 16), ironM, ringG);
    mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.02, 6), ironM, ringG, 0.014, 0.0, 0).rotation.z = Math.PI / 2;
    P.root.userData.ring = ringG; P.root.userData.kind = "waterbucket";
    // the water: a disc 0.03 under the rim, two highlight arcs; it stays level while the bucket swings
    const waterG = new THREE.Group(); waterG.position.y = BK.h - 0.03; bk.add(waterG);
    const disc = mesh(new THREE.CylinderGeometry(0.151, 0.151, 0.03, 28), waterM, waterG, 0, -0.015, 0);
    for (const [r0, a0, len] of [[0.075, 0.5, 1.1], [0.115, 3.4, 0.7]]) { const h = new THREE.Mesh(new THREE.RingGeometry(r0, r0 + 0.007, 14, 1, a0, len), new THREE.MeshBasicMaterial({ color: "#dff1f8", side: THREE.DoubleSide })); h.rotation.x = -Math.PI / 2; h.position.y = 0.0012; waterG.add(h); }
    // the pour: 24 blobs, a ribbon, a crown of 10 drops (world frame of the prop: swingG's parent)
    const pourG = new THREE.Group(); P.whole.add(pourG);
    const NB = 24, blobGeo = new THREE.SphereGeometry(1, 10, 8);
    const blobs = Array.from({ length: NB }, (_, i) => { const m = new THREE.Mesh(blobGeo, waterM); m.castShadow = false; pourG.add(m); return { m, r: 0.02 + 0.03 * rnd(i + 5), d: (0.35 * (i + 0.6 * rnd(i + 11))) / NB, sp: 0.62 + 0.33 * rnd(i + 40), lat: rnd(i + 80) - 0.5, jit: rnd(i + 120) - 0.5, up: rnd(i + 160) - 0.5 }; });
    const ribbon = new Tube(pourG, 24, 6, waterM); ribbon.mesh.userData.solid = false;
    const crown = Array.from({ length: 10 }, (_, j) => { const m = new THREE.Mesh(blobGeo, waterM); m.castShadow = false; pourG.add(m); return { m, a: (j / 10) * Math.PI * 2 + 0.3, vh: 0.25 + 0.22 * rnd(j + 200), vy: 0.9 + 0.5 * rnd(j + 220), r: 0.012 + 0.008 * rnd(j + 240), d: 0.012 + 0.34 * (j / 10) + 0.06 * rnd(j + 260) }; });
    const lipQ = V(-BK.rimR, BK.h - BK.pinUp, 0);
    return {
      grip: 0, anchors: { ring: ringG },
      apply(ps) {
        const round = num(ps, P, "round", 2), sw = num(ps, P, "swing", 0), fl = clamp(num(ps, P, "flip", 0), 0, 200), fill = clamp(ps.fill ?? S.fill ?? 1), pourT = num(ps, P, "pour", 0);
        swingG.rotation.z = sw * DEG; tipG.rotation.z = fl * DEG;
        // the water stays level (tilt of the bucket in the world), to 18 degrees, then rides with it; gone as the mouth passes 70..105
        const tau = sw + fl, al = -18 * Math.tanh(tau / 18) * DEG;
        waterG.rotation.z = al; waterG.scale.set(0.9, 1, 0.9);
        const gone = 1 - sm((fl - 70) / 35), wk = fill * gone;
        waterG.visible = wk > 0.02; waterG.scale.multiplyScalar(Math.max(wk, 0.001));
        waterG.scale.y = Math.max(wk, 0.001);
        // pour
        const pw = S.pourSwing ?? (round === 3 ? 0 : -55), pf = S.pourFlip ?? (round === 3 ? 160 : 115), hitY = num(ps, P, "hitY", S.hitY ?? (round === 3 ? 0.97 : 1.02));
        const landZ = S.landZ ?? (round === 3 ? -0.5 : -1.13), hitL = hitY - (ps.y ?? 0), lz = landZ == null ? null : landZ - (ps.z ?? 0);
        const on = pourT > 0 && pourT < 1.1;
        pourG.visible = on;
        if (!on) return;
        const lip = bucketPoint(lipQ, pw, pf, hang, V());
        const ang = (pw + pf) * DEG, axis = V(-Math.sin(ang), Math.cos(ang), 0);
        const hitT = (y0, vy) => { const c = y0 - hitL; return (vy + Math.sqrt(vy * vy + 19.6 * c)) / 9.8; };   // time to fall to hitL
        for (const b of blobs) {
          const u = pourT - b.d, v = axis.clone().multiplyScalar(1.6 * b.sp); v.y += 0.15 * b.up;
          const p0 = lip.clone(); p0.z += b.lat * 0.18;
          const th = hitT(p0.y, v.y); v.z = lz == null ? 0.12 * b.jit : (lz - p0.z) / th + 0.1 * b.jit;
          const y = p0.y + v.y * u - 0.5 * G * u * u;
          const vis = u >= 0 && y > hitL;
          b.m.visible = vis; if (!vis) continue;
          b.m.position.set(p0.x + v.x * u, y, p0.z + v.z * u);
          const vv = V(v.x, v.y - G * u, v.z), sp = vv.length();
          b.m.quaternion.setFromUnitVectors(UP, vv.normalize()); b.m.scale.set(b.r, b.r * (1 + 0.4 * Math.min(1, sp / 3)), b.r);
        }
        // the ribbon: the middle path from the stream's tail to its head, ending on hitY
        const c0 = lip.clone(), cv = axis.clone().multiplyScalar(1.6 * 0.78); const cth = hitT(c0.y, cv.y);
        cv.z = lz == null ? 0 : (lz - c0.z) / cth;
        const cp = (u) => V(c0.x + cv.x * u, c0.y + cv.y * u - 0.5 * G * u * u, c0.z + cv.z * u);
        const uh = Math.min(pourT, cth), ut = Math.min(Math.max(0, pourT - 0.35), cth);
        if (uh - ut > 0.02) { const pts = []; for (let i = 0; i <= 12; i++) pts.push(cp(ut + ((uh - ut) * i) / 12)); ribbon.set(pts, (u) => 0.007 + 0.009 * Math.sin(Math.PI * Math.min(1, u * 1.15)), 0.02); } else ribbon.mesh.visible = false;
        // the crown of drops where it lands
        const land = cp(cth); land.y = hitL;
        for (const c of crown) {
          const w = pourT - cth - c.d, ok = w >= 0 && w < 0.5;
          const x = ok ? land.x + Math.cos(c.a) * c.vh * w : 0, y = ok ? land.y + c.vy * w - 0.5 * G * w * w : 0, z = ok ? land.z + Math.sin(c.a) * c.vh * w : 0;
          c.m.visible = ok && y >= hitL;
          if (c.m.visible) { c.m.position.set(x, y, z); c.m.scale.setScalar(c.r * (1 - 0.5 * w / 0.5)); }
        }
      },
    };
  },

  // ================================================================================================================
  mouthjet(P) {
    const S = P.spec, waterM = mat("#8fc4dc", { roughness: 0.15, emissive: "#2c4d5e", emissiveIntensity: 0.6 }), lightM = new THREE.MeshBasicMaterial({ color: "#dff1f8" });
    const jet = new THREE.Group(); P.whole.add(jet);
    const colGeo = new THREE.CylinderGeometry(0.028, 0.016, 1, 14); colGeo.translate(0, 0.5, 0);
    const col = steamy(mesh(colGeo, waterM, jet)); col.receiveShadow = false;
    const hi = steamy(mesh(new THREE.BoxGeometry(0.006, 1, 0.003), lightM, jet, -0.009, 0.5, 0.019));
    const top = steamy(mesh(new THREE.SphereGeometry(0.03, 12, 8), waterM, jet));
    const crownG = new THREE.Group(); jet.add(crownG);
    const arcs = Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2, run = 0.10 + 0.06 * rnd(i + 3), cv = new THREE.QuadraticBezierCurve3(V(0, 0, 0), V(run * 0.6, 0.06 + 0.02 * rnd(i + 9), 0), V(run, -0.12, 0));
      const m = steamy(new THREE.Mesh(new THREE.TubeGeometry(cv, 8, 0.0065, 5, false), i % 3 === 0 ? lightM : waterM)); m.rotation.y = a; crownG.add(m); return m;
    });
    const drops = Array.from({ length: 14 }, (_, i) => ({ m: steamy(mesh(new THREE.SphereGeometry(1, 8, 6), waterM, jet)), r: 0.008 + 0.005 * rnd(i + 30), a: rnd(i + 50) * Math.PI * 2, o: rnd(i + 70), f: 0.8 + 0.5 * rnd(i + 90), vr: 0.05 + 0.13 * rnd(i + 110) }));
    const wq = new THREE.Quaternion(), loc = V();
    let state = { on: 0, h: 1, t: 0 };
    const layout = () => {
      const on = state.on > 0.5 && state.h > 0.02;
      jet.visible = on; if (!on) return;
      const breath = 0.75 + 0.25 * Math.sin(2 * Math.PI * 0.45 * state.t), H = 0.35 * state.h * breath;
      col.scale.y = H; hi.scale.y = H * 0.8; hi.position.y = H * 0.45; top.position.y = H; top.scale.setScalar(0.9);
      crownG.position.y = H; crownG.scale.setScalar(0.45 + 0.55 * state.h);
      for (const d of drops) {
        const ph = (state.t * 0.9 * d.f + d.o) % 1, out = d.vr * (0.2 + ph) + 0.03;
        d.m.position.set(Math.cos(d.a) * out, H + 0.1 * ph - (0.1 + 0.35 * state.h) * ph * ph + 0.02, Math.sin(d.a) * out);
        d.m.scale.setScalar(d.r * (1 - 0.3 * ph)); d.m.visible = true;
      }
    };
    return {
      grip: 0,
      apply(ps, t) { state = { on: ps.on ?? S.on ?? 0, h: clamp(num(ps, P, "h", 1)), t }; layout(); },
      // the mouth's world point (stage.js, because spec.mouth is set): stand the jet there along world up
      aim(mouth) {
        P.root.updateMatrixWorld(true);
        loc.copy(mouth); P.root.worldToLocal(loc); jet.position.copy(loc);
        P.root.getWorldQuaternion(wq); jet.quaternion.copy(wq.invert());
      },
    };
  },

  // ================================================================================================================
  anvil(P) {
    const S = P.spec, hangY = S.hangY ?? 1.28, HX = 0.13;
    const iron = mat("#2b2b30", { roughness: 0.42, metalness: 0.55 }), face = mat("#55565e", { roughness: 0.35, metalness: 0.6 }), streak = new THREE.MeshBasicMaterial({ color: "#8a8c96" }), rust = mat("#5a3a2a", { roughness: 0.9 });
    const body = new THREE.Group(); P.whole.add(body);   // the whole anvil, base centre at its origin
    const swayG = new THREE.Group(); body.add(swayG);
    // base 0.26 x 0.20, slightly tapered; waist 0.11; face body from an extruded side profile; horn a cone
    mesh(new THREE.BoxGeometry(0.26, 0.07, 0.20), iron, swayG, 0, 0.035, 0);
    mesh(new THREE.BoxGeometry(0.2, 0.025, 0.17), iron, swayG, 0, 0.0825, 0);
    const prof = new THREE.Shape(); const pts = [[-0.055, 0.095], [0.055, 0.095], [0.075, 0.2], [0.14, 0.275], [0.23, 0.3], [0.23, 0.34], [-0.13, 0.34], [-0.13, 0.285], [-0.075, 0.2]];
    pts.forEach(([x, y], i) => (i ? prof.lineTo(x, y) : prof.moveTo(x, y)));
    const eg = new THREE.ExtrudeGeometry(prof, { depth: 0.13, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1 }); eg.translate(0, 0, -0.065);
    mesh(eg, iron, swayG);
    const waistW = mesh(new THREE.BoxGeometry(0.1, 0.11, 0.11), iron, swayG, 0, 0.15, 0); waistW.castShadow = true;
    const horn = mesh(new THREE.ConeGeometry(0.058, 0.2, 14), iron, swayG, -0.23, 0.3, 0); horn.rotation.z = Math.PI / 2;
    mesh(new THREE.BoxGeometry(0.255, 0.004, 0.13), face, swayG, 0.0, 0.3445, 0);
    { const h = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.008, 0.002), streak); h.position.set(0.02, 0.325, 0.0715); swayG.add(h); }
    for (let i = 0; i < 11; i++) { const r = mesh(new THREE.CircleGeometry(0.004 + 0.004 * rnd(i + 3), 7), rust, swayG, -0.2 + 0.4 * rnd(i + 9), 0.03 + 0.3 * rnd(i + 17), i % 2 ? 0.0715 : -0.0715); r.castShadow = false; r.rotation.y = i % 2 ? 0 : Math.PI; r.position.z += i % 2 ? 0.001 : -0.001; }
    const ringG = new THREE.Group(); ringG.position.set(0, 0.37, 0); swayG.add(ringG);
    mesh(new THREE.TorusGeometry(0.03, 0.0065, 7, 18), iron, ringG);
    P.root.userData.ring = ringG; P.root.userData.kind = "anvil";
    const pivot = V(0, 0.77, 0);   // the beam point the rope hangs from, for the sway
    return {
      grip: 0, anchors: { ring: ringG },
      apply(ps, t) {
        const f = num(ps, P, "fall", 0);
        let y = hangY, tip = 0, bounce = 0;
        swayG.rotation.set(0, 0, 0); swayG.position.set(0, 0, 0);
        if (f <= 0) {   // hanging: a sway of 1 degree about the beam point 0.77 over the base
          const a = 1 * DEG * Math.sin(t * 1.1);
          swayG.position.set(pivot.y * Math.sin(a), pivot.y * (1 - Math.cos(a)), 0); swayG.rotation.z = a;
        } else {
          y = Math.max(hangY - 0.5 * G * f * f, -0.44);
          tip = 14 * sm((f - 0.511) / 0.079);
          const b = (f - 0.59) / 0.067; bounce = b > 0 && b < 1 ? 0.01 * Math.sin(Math.PI * b) : 0;
        }
        body.position.y = y + bounce; body.rotation.z = tip * DEG;
      },
    };
  },

  // ================================================================================================================
  nailcandle(P) {
    const S = P.spec, L = 0.13, D = V(-0.6, 0, 0.8), R = 0.03;
    const wax = mat("#f3ead2", { roughness: 0.45 }), shade = mat("#d9cba6", { roughness: 0.55 }), wickM = mat("#2a211c", { roughness: 0.9 });
    const cyl = new THREE.CylinderGeometry(R, R, 1, 28, 1); cyl.translate(0, 0.5, 0);
    const bodyM = mesh(cyl, wax, P.whole);
    const lip = mesh(new THREE.TorusGeometry(R, 0.0042, 8, 28), wax, P.whole); lip.rotation.x = Math.PI / 2;
    const pool = mesh(new THREE.CylinderGeometry(R * 0.72, R * 0.78, 0.004, 24), shade, P.whole); pool.castShadow = false;
    const wick = mesh(new THREE.CylinderGeometry(0.0013, 0.0016, 0.016, 6), wickM, P.whole); wick.castShadow = false;
    const footGeo = new THREE.LatheGeometry([[0.001, 0], [0.045, 0], [0.043, 0.005], [0.038, 0.011], [0.0308, 0.017], [0.001, 0.017]].map(([x, y]) => new THREE.Vector2(x, y)), 28);
    const foot = mesh(footGeo, wax, P.whole);
    const runs = Array.from({ length: 7 }, (_, i) => { const a = ((i + 0.3 * rnd(i + 1)) / 7) * Math.PI * 2, m = mesh(new THREE.SphereGeometry(1, 10, 8), wax, P.whole); return { m, a, k: 0.55 + 0.45 * rnd(i + 20), w: 0.0058 + 0.0022 * rnd(i + 30) }; });
    const flame = flameMesh(P.whole, 0.4), glow = glowMesh(P.whole, 0.42);
    const light = new THREE.PointLight("#ffb36b", 0, 1.6, 1.8); P.whole.add(light);
    // the two nails: shaft from the tip along +y to the head
    const ironM = mat("#3a3a40", { roughness: 0.45, metalness: 0.6 }), headM = mat("#55565e", { roughness: 0.4, metalness: 0.6 });
    const mkNail = () => { const g = new THREE.Group(); mesh(new THREE.CylinderGeometry(0.004, 0.004, L - 0.004, 8), ironM, g, 0, (L - 0.004) / 2, 0); mesh(new THREE.ConeGeometry(0.004, 0.008, 8), ironM, g, 0, -0.004, 0).rotation.x = Math.PI; mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.004, 14), headM, g, 0, L - 0.002, 0); P.whole.add(g); return g; };
    const nA = mkNail(), nB = mkNail();
    const place = (g, tip, n) => { g.position.copy(tip); g.quaternion.setFromUnitVectors(UP, n); };
    const plateW = S.plate ?? [0.17, 0.012, 0.03], bell = S.bell ?? [0.286, 0.432, -0.138], bsc = S.bellScale ?? 1.15, yA = 0.162, yB = 0.152;
    // the dome's surface height over the bell's origin, at horizontal distance rho (metres, scaled): the kit callbell's own numbers
    const domeTop = (rho) => { const u = rho / bsc; if (u < 0.0092) return 0.0675 * bsc; if (u < 0.014) return 0.0605 * bsc; return (0.012 + Math.sqrt(Math.max(0, 0.045 * 0.045 - u * u))) * bsc; };
    const pitchN = (u, theta) => u.clone().multiplyScalar(Math.cos(theta)).add(V(0, Math.sin(theta), 0)).normalize();   // u horizontal unit; theta > 0 up
    const rotY = (v, a) => V(v.x * Math.cos(a) + v.z * Math.sin(a), v.y, -v.x * Math.sin(a) + v.z * Math.cos(a));
    const nailAState = (tau, pl, ps) => {
      const tip0 = D.clone().multiplyScalar(-0.005).add(V(0, yA, 0));
      if (tau <= 0) return [tip0, D.clone()];
      const th = -20 * DEG * sm(tau / 0.12), n1 = pitchN(D, -20 * DEG);
      if (tau < 0.12) { const n = pitchN(D, th); return [tip0, n]; }
      const c1 = tip0.clone().addScaledVector(n1, L / 2), s = tau - 0.12;
      const yl = pl.y + 0.007, T = Math.sqrt(Math.max(0.01, (ps.y + c1.y - yl) / (0.5 * G)));
      const tgt = V(pl.x - ps.x, 0, pl.z - ps.z), h1 = V(c1.x, 0, c1.z), dv = tgt.clone().sub(h1), Lh = dv.length(), u = dv.clone().normalize();
      const sc = Math.min(s, T), k = sc / T, xh = 0.5 * sc + (Lh - 0.5 * T) * (1 - Math.pow(1 - k, 3));
      const c = V(c1.x + u.x * xh, c1.y - 0.5 * G * sc * sc, c1.z + u.z * xh);
      if (s > T) { const w = (s - T) / 0.12; if (w < 1) c.y += 0.02 * 4 * w * (1 - w); }
      const yaw = 0.5 * sm(sc / T), th2 = (-20 - 160 * Math.min(1, sc / T)) * DEG, n = pitchN(rotY(D, yaw), th2);
      return [c.clone().addScaledVector(n, -L / 2), n];
    };
    const nailBState = (nb, bl, ps) => {
      const k = clamp(nb), tau = nb - 1, dh = 0.16 + (0.125 - 0.16) * k;
      if (nb <= 1) return [D.clone().multiplyScalar(dh - L).add(V(0, yB, 0)), D.clone()];
      const tipA = D.clone().multiplyScalar(0.125 - L).add(V(0, yB, 0));
      let tip, n;
      if (tau < 0.10) { const e = sm(tau / 0.10); tip = tipA.clone().addScaledVector(D, 0.035 * e); n = pitchN(D, -10 * DEG * e); return [tip, n]; }
      tip = tipA.clone().addScaledVector(D, 0.035); const headAfter = tip.clone().addScaledVector(pitchN(D, -10 * DEG), L);
      // strike geometry
      const bl0 = V(bl.x - ps.x, bl.y - ps.y, bl.z - ps.z), hz = V(headAfter.x - bl0.x, 0, headAfter.z - bl0.z), rho = hz.length();
      const strikeY = bl0.y + domeTop(rho) + 0.011, F = Math.max(0.01, headAfter.y - strikeY);
      const v = Math.min(1, (tau - 0.10) / 0.11), drop = F * v * v, th2 = (-10 - 4 * Math.min(1, v)) * DEG;
      const n2 = pitchN(D, th2), tip2 = tip.clone().add(V(0, -drop, 0));
      if (tau < 0.21) return [tip2, n2];
      // after the strike: settle leaning on the dome, its tip on the plate
      const H1 = tip2.clone().addScaledVector(n2, L);
      const dirOut = V(-D.x, 0, -D.z), Hf = V(bl0.x + dirOut.x * 0.045, 0, bl0.z + dirOut.z * 0.045); Hf.y = bl0.y + domeTop(0.045) + 0.012;
      const a = 65 * DEG, Tg = V(bl0.x + 0.09 * Math.cos(a), bl0.y + 0.0175, bl0.z + 0.09 * Math.sin(a)), nf = Hf.clone().sub(Tg).normalize(), Tf = Hf.clone().addScaledVector(nf, -L);
      const e = sm((tau - 0.21) / 0.24), eT = Math.pow(clamp((tau - 0.21) / 0.20), 2);
      const H = lerpV(H1, Hf, e), T = lerpV(tip2, Tf, eT);
      const bw = (tau - 0.21) / 0.10; if (bw > 0 && bw < 1) H.y += 0.012 * Math.sin(Math.PI * bw);
      const rhoH = Math.hypot(H.x - bl0.x, H.z - bl0.z); H.y = Math.max(H.y, bl0.y + domeTop(rhoH) + 0.011);
      const nn = H.clone().sub(T).normalize(), cc = H.clone().add(T).multiplyScalar(0.5);
      return [cc.addScaledVector(nn, -L / 2), nn];
    };
    return {
      grip: 0,
      apply(ps, t) {
        const burn = clamp(ps.burn ?? 0), h = 0.40 - 0.26 * burn, l = clamp(ps.lit ?? S.lit ?? 0), f = clamp(num(ps, P, "flare", ps.fire ?? 0));
        bodyM.scale.y = h; lip.position.y = h; pool.position.y = h - 0.0035; wick.position.y = h + 0.006;
        const fr = 0.035 + 0.01 * burn; foot.scale.set(fr / 0.045, 1, fr / 0.045);
        for (const r of runs) { const len = 0.02 + 0.10 * burn * r.k, y = h - len / 2 + 0.003; r.m.position.set(Math.cos(r.a) * (R + 0.0012), y, Math.sin(r.a) * (R + 0.0012)); r.m.scale.set(r.w, len / 2 + 0.003, r.w); r.m.quaternion.setFromAxisAngle(UP, -r.a); }
        const wt = h + 0.012, fl = 1 + 0.06 * Math.sin(t * 0.229) + 0.04 * Math.sin(t * 0.379 + 1);
        flame.position.y = wt - 0.002; glow.position.y = wt + 0.014; light.position.set(0, wt + 0.03, 0.03);
        const u = flame.material.uniforms; u.uTime.value = t; u.uFire.value = f; u.uBend.value = ps.bend ?? 0;
        u.uH.value = 0.045 * Math.pow(l, 0.7) * (1 + 4 * f) * fl; u.uW.value = 0.015 * Math.pow(l, 0.5) * (1 + 2.5 * f); u.uA.value = clamp(l * 1.6); flame.visible = l > 0.01;
        const g = glow.material.uniforms; g.uR.value = 0.06 * (1 + 0.8 * f) * (0.6 + 0.4 * l); g.uA.value = 0.36 * l * fl; g.uLift.value = 0.05 * f; glow.visible = l > 0.01;
        light.intensity = 0.7 * l * (1 + 2 * f) * fl;
        const pl = V(...plateW), bl = V(...bell), pp = V(ps.x ?? 0, ps.y ?? 0, ps.z ?? 0);
        const [ta, na] = nailAState(num(ps, P, "nailA", 0), pl, pp); place(nA, ta, na);
        const nb = num(ps, P, "nailB", -1); nB.visible = nb > -0.5;
        if (nB.visible) { const [tb, nbv] = nailBState(nb, bl, pp); place(nB, tb, nbv); }
      },
    };
  },

  // ================================================================================================================
  tinplate(P) {
    const tin = mat("#9aa3a8", { roughness: 0.45, metalness: 0.5 }), ring = mat("#7d868b", { roughness: 0.5, metalness: 0.5 });
    const prof = [[0.001, 0], [0.074, 0], [0.098, 0.006], [0.1, 0.02], [0.097, 0.02], [0.094, 0.012], [0.07, 0.012], [0.001, 0.012]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh(new THREE.LatheGeometry(prof, 40), tin, P.whole);
    const rg = mesh(new THREE.RingGeometry(0.044, 0.052, 32), ring, P.whole, 0, 0.0124, 0); rg.rotation.x = -Math.PI / 2; rg.castShadow = false;
    for (const [x, z, r] of [[0.03, 0.035, 0.012], [-0.045, -0.02, 0.016], [0.01, -0.058, 0.01]]) { const d = mesh(new THREE.CircleGeometry(r, 14), ring, P.whole, x, 0.0126, z); d.rotation.x = -Math.PI / 2; d.castShadow = false; }
    return { grip: 0 };
  },
};
