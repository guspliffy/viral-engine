// Prop physics (quality plan item 17, trial): deterministic rigid bodies for loose props that hit each other (flying
// baggage, a pile, things knocked over). Holds 2's analytic fall (attach.js) still does a single drop; this is for
// props that tumble into the set, the cast and each other.
//
// Opt-in: a storyboard turns it on by using a "physics" action. Each one names a mode:
//   { "do": "physics", "prop": "case", "mode": "throw", "at": 2.6, "v": [x, y, z], "spin": [x, y, z] }
//       the prop leaves its own tween at `at` and becomes a rigid body: v (m/s) and spin (rad/s, about the world axes)
//       default to the speed its tween had there, so "throw" without v just lets go of a sliding or flying prop
//       "to": [x, y, z] with "in": seconds instead of v aims it: the speed that gets it there in that time under the
//       gravity and drag of the moment (what it hits on the way still counts)
//   mode "drop"   the same, from rest (v and spin default to 0)
//   mode "knock"  sets a body's speed at `at` (a kick in zero-g, a bump from the plane), or starts it like "throw"
//   mode "settle" freezes the body where it is (it stays put from then on)
//   { "do": "physics", "mode": "float", "at": 5, "g": 0, "dur": 0.3 }
//       the world's gravity (m/s², up is +) eases to g over dur: 0 is zero-g, -9.81 normal (the default), a bigger
//       pull a plane dropping out from under everyone; "damp" (per second) is the air's drag from then on, so things
//       drifting in zero-g slow down (0 again with the next float that leaves it out)
// A prop's own spec can tune its body: "body": { "density": 300, "bounce": 0.3, "friction": 0.6, "shape": "hull" | "box" },
// and "settle": true makes it a body from a second before the clip, so a pile or a shelf of things has come to rest by
// frame 0 (no prop sunk into the table it stands on, nothing hovering).
//
// The whole clip is baked once at init, at a fixed step (1/120 s) with Rapier's deterministic build: the set's meshes
// and the other props (where they stand at the start, or following their own tweens) are solid, each character is a
// capsule following their body, and the bodies collide with all of it and with each other. A frame is then a lookup
// (positions and turns interpolated between steps), so any frame, a cache hit or a farm shard gives the same pose. The
// bake has a hash (FNV-1a over every stored number) in the layout: the same storyboard gives the same hash everywhere.
import * as THREE from "three";
import { propState } from "./props3d.js";
import { actorState } from "./timeline.js";
import { handTarget } from "./potato.js";

export const PHYS = { dt: 1 / 120, sample: 1 / 60, g: -9.81, density: 300, bounce: 0.3, friction: 0.6, hullPts: 1500, rest: 0.05, preroll: 1, prerollDamp: 8, maxV: 5 };

const V = () => new THREE.Vector3(), Q = () => new THREE.Quaternion();
// kinds that are light, air or weather (never solid); the set pieces holds 2 calls staged (cabin walls, bins) are solid here
const AIR = /^(roarlines|bubbles|confetti|dustmotes|fogveil|lightbeam|torchbeam|shadowpool|spellaura|splash|wakefoam|windleaves|xstar|fleck|sum|blob|fairylights|stringlights|flagway)$|burst|puff|smoke|spark|glow|beam|zap|poof|steam|halo|rain|snow|ripple/i;
const smooth = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));

// the world-space vertices of every solid mesh under `root` (index triangles too when tris is set); skips sprites,
// lines, glows and see-through veils (opacity under 0.6: light and air, never solid)
function solidMeshes(root) {
  const out = [];
  root.updateMatrixWorld(true);
  root.traverse((m) => {
    if (!m.isMesh || m.isSprite || !m.geometry?.attributes?.position) return;
    let vis = true; for (let o = m; o; o = o.parent) if (o.visible === false) { vis = false; break; }
    if (!vis) return;
    const ms = Array.isArray(m.material) ? m.material : [m.material];
    if (ms.every((x) => !x || (x.transparent && (x.opacity ?? 1) < 0.6) || x.blending === THREE.AdditiveBlending || x.visible === false)) return;
    out.push(m);
  });
  return out;
}
function trisOf(m, toLocal = null, maxInst = 64) {
  const g = m.geometry, pos = g.attributes.position, idx = g.index, verts = [], inds = [];
  const mats = m.isInstancedMesh ? Array.from({ length: Math.min(m.count, maxInst) }, (_, i) => { const a = new THREE.Matrix4(); m.getMatrixAt(i, a); return a.premultiply(m.matrixWorld); }) : [m.matrixWorld];
  const v = V();
  for (const M of mats) {
    const base = verts.length / 3, MM = toLocal ? M.clone().premultiply(toLocal) : M;
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(MM); verts.push(v.x, v.y, v.z); }
    if (idx) for (let i = 0; i + 2 < idx.count; i += 3) inds.push(base + idx.getX(i), base + idx.getX(i + 1), base + idx.getX(i + 2));
    else for (let i = 0; i + 2 < pos.count; i += 3) inds.push(base + i, base + i + 1, base + i + 2);
  }
  return { verts, inds };
}

// env: { sb, scene, props, actors, setMeshes }
export async function makePhysics(env) {
  const { sb } = env;
  const acts = (sb.actions || []).filter((a) => a.do === "physics").sort((a, b) => a.at - b.at);
  if (!acts.length && !sb.physics && !env.props.some((p) => p.spec.body?.settle)) return null;
  const { default: RAPIER } = await import("/node_modules/@dimforge/rapier3d-deterministic-compat/dist/rapier.mjs");
  await RAPIER.init();
  const t0w = performance.now(), diag = [];
  const end = sb.storyDuration ?? sb.duration;
  const byId = new Map(env.props.map((p) => [p.spec.id, p]));
  // the props that become bodies, and when the bake owns each: segments from a start (a physics action, a let-go of a
  // clip with "physics" on, a settling pile's pre-roll) to the next grab of it (a hand takes it back)
  const auto = !!sb.physics && !!env.attach;
  const lets = auto ? (sb.actions || []).filter((a) => a.do === "release" && a.prop && byId.has(a.prop) && a.keep !== "air" && !(a.to && (a.dur ?? 0) < 0.1) && !AIR.test(byId.get(a.prop).spec.kind) && !byId.get(a.prop).spec.wear) : [];
  const ev = [
    ...env.props.filter((p) => p.spec.body?.settle).map((p) => ({ prop: p.spec.id, at: -PHYS.preroll, start: { do: "physics", prop: p.spec.id, mode: "drop", at: -PHYS.preroll } })),
    ...acts.filter((a) => a.prop && a.mode !== "settle").map((a) => { if (!byId.has(a.prop)) throw new Error(`physics: unknown prop ${a.prop}`); return { prop: a.prop, at: a.at, start: a }; }),
    ...lets.map((a) => ({ prop: a.prop, at: a.at, start: { mode: "release", prop: a.prop, at: a.at, rel: a } })),
    ...(sb.actions || []).filter((a) => a.do === "grab" && a.prop && byId.has(a.prop)).map((a) => ({ prop: a.prop, at: a.at, grab: true })),
  ].sort((a, b) => a.at - b.at || (a.grab ? -1 : 0) - (b.grab ? -1 : 0));
  const segs = new Map(), opener = new Set();
  for (const e of ev) {
    const L = segs.get(e.prop) || [], open = L.length && L.at(-1).end === Infinity;
    if (e.grab) { if (open) L.at(-1).end = e.at; }
    else if (!open) { L.push({ start: e.start, end: Infinity }); opener.add(e.start); }
    segs.set(e.prop, L);
  }
  for (const [id, L] of segs) if (!L.length) segs.delete(id);
  if (!segs.size) return null;
  const tStart = Math.min(...[...segs.values()].map((L) => L[0].start.at));
  const nSteps = Math.max(1, Math.ceil((end - tStart) / PHYS.dt) + 1);

  // a prop's world pose from its own state at t (its tween), unscaled
  const propPose = (p, t) => {
    p.apply(propState(sb, p.spec, t), t); p.root.updateMatrixWorld(true);
    const P = V(), R = Q(), S = V(); p.root.matrixWorld.decompose(P, R, S); return { P, R, S };
  };
  const moving = (spec) => (sb.actions || []).some((a) => a.do === "prop" && a.id === spec.id && a.set && ["x", "y", "z", "rot", "tip", "tilt", "roll"].some((k) => k in a.set));
  const heldEver = (spec) => (sb.actions || []).some((a) => a.do === "grab" && a.prop === spec.id);

  const world = new RAPIER.World({ x: 0, y: PHYS.g, z: 0 });
  world.timestep = PHYS.dt;
  // the floor (y 0), and the set as built: fixed triangle meshes
  world.createCollider(RAPIER.ColliderDesc.cuboid(50, 0.5, 50).setTranslation(0, -0.5, 0).setFriction(PHYS.friction));
  let tris = 0;
  for (const top of env.setMeshes || []) for (const m of solidMeshes(top)) {
    const { verts, inds } = trisOf(m); if (!inds.length) continue;
    world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(verts), new Uint32Array(inds)).setFriction(PHYS.friction)); tris += inds.length / 3;
  }
  // the other props: fixed where they stand at the start, or kinematic on their own tweens; never ones a hand takes
  // (a hand would have to carry the body), effects or wearables
  const kin = [];
  for (const p of env.props) {
    if (segs.has(p.spec.id) || AIR.test(p.spec.kind) || p.spec.wear || heldEver(p.spec)) continue;
    const { P, R } = propPose(p, Math.max(0, tStart)), inv = new THREE.Matrix4().compose(P, R, V().set(1, 1, 1)).invert();
    const bodyDesc = moving(p.spec) ? RAPIER.RigidBodyDesc.kinematicPositionBased() : RAPIER.RigidBodyDesc.fixed();
    const body = world.createRigidBody(bodyDesc.setTranslation(P.x, P.y, P.z).setRotation({ x: R.x, y: R.y, z: R.z, w: R.w }));
    let n = 0;
    for (const m of solidMeshes(p.root)) { const { verts, inds } = trisOf(m, inv); if (inds.length) { world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(verts), new Uint32Array(inds)).setFriction(PHYS.friction), body); n += inds.length / 3; } }
    tris += n;
    if (moving(p.spec)) kin.push({ p, body });
  }
  // the cast: a capsule each, along the body's own up, following the body. The body's place in the character's root
  // is measured once (posed at the start); after that the root's own transform comes straight from the actor's state
  // (as Character.apply sets it), so a sample costs no posing
  function castAt0(x, t) {
    const st = actorState(sb, x.a.c, x.a.def, Math.max(0, t)), M = x.par.clone().multiply(rootM(st)).multiply(x.rel);
    const P = x.c.clone().applyMatrix4(M), R = Q(); M.decompose(V(), R, V());
    const rx = (x.a.def.body?.width ?? 0.6) / 2, H = x.a.def.body?.height ?? 0.7, RM = x.par.clone().multiply(rootM(st)), limbs = [];
    for (const [s, sx] of [["R", -1], ["L", 1]]) {
      const arm = st.arms?.[s]; let hp = null;
      try { const f = handTarget(arm.from, sx, rx, H, t), g = handTarget(arm.pose, sx, rx, H, t); if (f?.length === 3 && g?.length === 3) hp = f.map((q, j) => q + (g[j] - q) * (arm.p ?? 1)); } catch { hp = null; }
      const sh = [sx * rx * 0.9, 0.14 + H * 0.55, 0];   // the shoulder (potato.js LEG_H + 55 % of the body)
      limbs.push(hp && hp.every(Number.isFinite) ? { R: V().fromArray(hp).applyMatrix4(RM), M: V().fromArray(sh).lerp(V().fromArray(hp), 0.5).applyMatrix4(RM) } : null);
    }
    return { P, R, hidden: st.visible === false, limbs };
  }
  const cast = [], rootM = (st) => new THREE.Matrix4().compose(V().set(st.x, st.y - 0.1 * (st.kneel || 0), st.z), Q().setFromEuler(new THREE.Euler(st.pitch || 0, st.yaw, st.lean, "YXZ")), V().setScalar(st.scale ?? 1));
  for (const a of env.actors) {
    const b = a.ch.body; if (!b?.geometry) continue;
    const st = actorState(sb, a.c, a.def, Math.max(0, tStart)); a.ch.apply(st, Math.max(0, tStart)); a.ch.root.updateMatrixWorld(true);
    const g = b.geometry, bb = g.boundingBox || (g.computeBoundingBox(), g.boundingBox), S = V(); b.matrixWorld.decompose(V(), Q(), S);
    const h = bb.getSize(V()).multiply(S).multiplyScalar(0.5), r = (h.x + h.z) / 2, c = bb.getCenter(V());
    const par = a.ch.root.parent && a.ch.root.parent !== env.scene ? a.ch.root.parent.matrixWorld.clone() : new THREE.Matrix4();
    const rel = rootM(st).invert().multiply(par.clone().invert()).multiply(b.matrixWorld);
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased());
    world.createCollider(RAPIER.ColliderDesc.capsule(Math.max(0.01, h.y - r), r).setFriction(PHYS.friction), body);
    // the hat rides on the body (a hull of it in the body's frame, as it sits at the start): a floating Wizard's brim
    // knocks bags aside instead of passing through them
    const hat = a.ch.costume?.hat;
    if (hat) {
      const Rb = Q(); b.matrixWorld.decompose(V(), Rb, V());
      const inv = new THREE.Matrix4().compose(c.clone().applyMatrix4(b.matrixWorld), Rb, V().set(1, 1, 1)).invert(), pts = [];
      for (const m of solidMeshes(hat)) pts.push(...trisOf(m, inv).verts);
      if (pts.length >= 12) { const k = Math.max(1, Math.floor(pts.length / 3 / PHYS.hullPts)), sub = []; for (let i = 0; i < pts.length; i += 3 * k) sub.push(pts[i], pts[i + 1], pts[i + 2]); const d = RAPIER.ColliderDesc.convexHull(new Float32Array(sub)); if (d) world.createCollider(d.setFriction(PHYS.friction), body); }
    }
    // the arms: a ball at each hand and one halfway from the shoulder, from the storyboard's hand targets in the
    // character's own frame (as qa/motion.mjs follows them; no posing), so a bag drifting into a waving arm bumps it
    const limbs = ["R", "L"].flatMap((side) => [0.5, 1].map((k) => {
      const lb = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased());
      world.createCollider(RAPIER.ColliderDesc.ball(k === 1 ? 0.07 : 0.055).setFriction(PHYS.friction), lb);
      return { side, k, body: lb };
    }));
    cast.push({ a, body, c, rel, par, limbs });
    // (it starts where the character is: a capsule moved in from the origin on the first step would sweep through
    // everything in between and fling it)
    { const x = cast.at(-1), s0 = castAt0(x, tStart); body.setTranslation(s0.P, true); body.setRotation(s0.R, true); }
    if (globalThis.__DIAG?.physics) diag.push(`cast ${a.c.id}: r ${r.toFixed(3)} half ${h.y.toFixed(3)} at`, JSON.stringify(c.clone().applyMatrix4(b.matrixWorld).toArray().map((x) => +x.toFixed(2))));
  }
  const castAt = castAt0;

  // the bodies: a convex hull of the prop's own solid mesh (or its box), kinematic on its tween until its start
  const bodies = [];
  for (const [id, L] of segs) {
    const a = L[0].start, p = byId.get(id), B = p.spec.body || {};
    const { P, R } = propPose(p, Math.max(0, a.at)), inv = new THREE.Matrix4().compose(P, R, V().set(1, 1, 1)).invert();
    const pts = []; for (const m of solidMeshes(p.root)) pts.push(...trisOf(m, inv).verts);
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(P.x, P.y, P.z).setRotation({ x: R.x, y: R.y, z: R.z, w: R.w }).setCcdEnabled(true));
    let desc = null;
    if (B.shape !== "box" && pts.length >= 12) {
      // every k-th vertex, a fixed thinning (deterministic), enough for the hull's shape
      const k = Math.max(1, Math.floor(pts.length / 3 / PHYS.hullPts)), sub = []; for (let i = 0; i < pts.length; i += 3 * k) sub.push(pts[i], pts[i + 1], pts[i + 2]);
      desc = RAPIER.ColliderDesc.convexHull(new Float32Array(sub));
    }
    if (!desc) { const bx = new THREE.Box3(); for (let i = 0; i < pts.length; i += 3) bx.expandByPoint(V().set(pts[i], pts[i + 1], pts[i + 2])); const s = bx.getSize(V()).multiplyScalar(0.5), c = bx.getCenter(V()); desc = RAPIER.ColliderDesc.cuboid(Math.max(s.x, 0.01), Math.max(s.y, 0.01), Math.max(s.z, 0.01)).setTranslation(c.x, c.y, c.z); }
    world.createCollider(desc.setDensity(B.density ?? PHYS.density).setRestitution(B.bounce ?? PHYS.bounce).setFriction(B.friction ?? PHYS.friction), body);
    if (globalThis.__DIAG?.physics) { const bx = new THREE.Box3(); for (let i = 0; i < pts.length; i += 3) bx.expandByPoint(V().set(pts[i], pts[i + 1], pts[i + 2])); diag.push(`body ${id}: at ${P.toArray().map((x) => x.toFixed(2))} local box ${bx.min.toArray().map((x) => x.toFixed(2))} .. ${bx.max.toArray().map((x) => x.toFixed(2))}, ${pts.length / 3} points`); }
    // a settling prop starts with its lowest point on its spec's height (the surface the author stood it on: a prop's
    // y is its bottom, but a turned one can reach below it), so the pre-roll never starts sunk into a table
    let lift = 0;
    if (a.at < 0) { let lo = Infinity; const w = V(); for (let i = 0; i < pts.length; i += 3) lo = Math.min(lo, w.set(pts[i], pts[i + 1], pts[i + 2]).applyQuaternion(R).y + P.y); if (lo < Infinity) lift = Math.max(0, (p.spec.y ?? 0) + 0.003 - lo); }
    bodies.push({ id, p, body, pts, segs: L, seg: -1, start: a, lift, live: false, frozen: false, track: new Float32Array(nSteps * 7) });
  }

  // gravity over time (float actions), eased
  const gAt = (t) => {
    let g = PHYS.g;
    for (const a of acts) { if (a.mode !== "float" || a.at > t) continue; const to = a.g ?? 0, d = a.dur ?? 0.3; g += (to - g) * (d > 0 ? smooth((t - a.at) / d) : 1); }
    return g;
  };
  const dampAt = (t) => { let d = 0; for (const a of acts) if (a.mode === "float" && a.at <= t) d = a.damp ?? 0; return d; };
  // the speed that takes a body from p to `to` in `in` seconds, under the gravity and air drag of that moment (an aimed
  // throw: the bag lands where the story needs it, on the beat its sound is on; what it hits on the way still counts)
  const aim = (p, a) => {
    const T = Math.max(0.05, a.in ?? 0.5), g = gAt(a.at + T / 2), d = dampAt(a.at + T / 2), k = d > 1e-6 ? (1 - Math.exp(-d * T)) / d : T;
    const free = (dx, gg) => (d > 1e-6 ? (dx - (gg / d) * (T - k)) / k : (dx - 0.5 * gg * T * T) / T);
    return { x: free(a.to[0] - p.x, 0), y: free(a.to[1] - p.y, g), z: free(a.to[2] - p.z, 0) };
  };
  const vec = (x) => ({ x: x[0], y: x[1], z: x[2] });
  const at = (i) => tStart + i * PHYS.dt;
  // a quaternion step as an angular speed (rad/s about the world axes)
  const spinOf = (R0, R1, dt) => { const d = R0.clone().invert().premultiply(R1), ang = 2 * Math.acos(Math.min(1, Math.abs(d.w))), s = Math.sqrt(Math.max(1e-12, 1 - d.w * d.w)) * Math.sign(d.w || 1); return ang > 1e-6 ? { x: (d.x / s) * ang / dt, y: (d.y / s) * ang / dt, z: (d.z / s) * ang / dt } : { x: 0, y: 0, z: 0 }; };
  // where a body starts and how fast: a let-go from the hand's pose and speed (holds 2 places it in the hand; aimed at
  // the release's `to` when it has one), a physics action from the prop's own tween (or its v / to), a pre-roll lifted
  // onto its spec height; never starting sunk into what is under it
  const startOf = (b, A) => {
    let P, R, v, w;
    if (A.mode === "release") {
      const tr = A.at, dt = 1 / (sb.fps ?? 30), X0 = env.releasePose(b.p, tr, tr), X1 = env.releasePose(b.p, tr - dt, tr) || X0;
      if (X0) { P = X0.P; R = X0.Q; } else { const k = propPose(b.p, tr); P = k.P; R = k.R; }
      if (A.rel.to) v = aim(P, { to: A.rel.to, in: A.rel.dur, at: tr });
      else { const u = X1 ? P.clone().sub(X1.P).divideScalar(dt) : V(); if (u.length() > PHYS.maxV) u.setLength(PHYS.maxV); v = vec(u.toArray()); }
      w = X1 ? spinOf(X1.Q, R, dt) : { x: 0, y: 0, z: 0 };
    } else {
      const now = propPose(b.p, Math.max(0, A.at)), was = propPose(b.p, Math.max(0, A.at - PHYS.dt));
      P = now.P.clone().add(V().set(0, b.lift, 0)); R = now.R;
      v = A.to ? aim(P, A) : A.v ? vec(A.v) : A.mode === "drop" ? { x: 0, y: 0, z: 0 } : vec(now.P.clone().sub(was.P).divideScalar(PHYS.dt).toArray());
      w = A.spin ? vec(A.spin) : A.mode === "drop" ? { x: 0, y: 0, z: 0 } : spinOf(was.R, now.R, PHYS.dt);
    }
    if (A.spin) w = vec(A.spin);
    return { P: unsink(b, P, R), R, v, w };
  };
  // lifted out of what is under it (a mug let go on the table it was put down on, its foot 1 cm into the top): a ray
  // down from above its lowest point, at most 5 cm
  const unsink = (b, P, R) => {
    let lo = Infinity, at = null; const w = V();
    for (let i = 0; i < b.pts.length; i += 3) { w.set(b.pts[i], b.pts[i + 1], b.pts[i + 2]).applyQuaternion(R).add(P); if (w.y < lo) { lo = w.y; at = w.clone(); } }
    if (!at) return P;
    const hit = world.castRay(new RAPIER.Ray({ x: at.x, y: lo + 0.06, z: at.z }, { x: 0, y: -1, z: 0 }), 0.06, true, undefined, undefined, undefined, b.body);
    if (!hit) return P;
    const y = lo + 0.06 - hit.timeOfImpact, lift = y - lo;
    return lift > 0 && lift <= 0.05 ? P.clone().add(V().set(0, lift + 0.002, 0)) : P;
  };

  const owned = new Map(bodies.map((b) => [b.p, b]));
  const poseAt = (b, t) => {
    const f = Math.max(0, Math.min(nSteps - 1, done, (t - tStart) / PHYS.dt)), i = Math.min(nSteps - 2, Math.floor(f)), u = nSteps < 2 ? 0 : f - i, T = b.track;
    if (nSteps < 2) return { P: V().set(T[0], T[1], T[2]), R: Q().set(T[3], T[4], T[5], T[6]) };
    const a = i * 7, c = a + 7;
    return { P: V().set(T[a], T[a + 1], T[a + 2]).lerp(V().set(T[c], T[c + 1], T[c + 2]), u), R: Q().set(T[a + 3], T[a + 4], T[a + 5], T[a + 6]).slerp(Q().set(T[c + 3], T[c + 4], T[c + 5], T[c + 6]), u) };
  };
  // the bake's pose of a prop at t, as propState numbers (props3d.js setPhysicsPose): a hand reaching for a prop the bake
  // dropped reaches where it landed, and a grab takes it from there. Only steps already baked (a let-go later in the
  // bake starts from a hold that was measured on the bake so far)
  const asState = (id, t) => {
    const b = byId.has(id) && owned.get(byId.get(id)); if (!b || !b.segs.some((g) => t + 1e-9 >= g.start.at && t + 1e-9 < g.end) || (t - tStart) / PHYS.dt > done + 1e-6) return null;
    const { P, R } = poseAt(b, t), e = new THREE.Euler().setFromQuaternion(R, "YXZ"), D = 180 / Math.PI;
    return { x: P.x, y: P.y, z: P.z, tip: e.x * D, rot: e.y * D, tilt: -e.z * D };
  };
  env.setPose?.(asState);
  let done = -1;
  // the bake. Kinematic targets (the cast, moving props, bodies before their start) are sampled at 60 Hz and eased
  // in between, so posing a character costs once per sample, not per step.
  const sampleEvery = Math.max(1, Math.round(PHYS.sample / PHYS.dt));
  let castS = null, castN = null, kinS = null, kinN = null;
  const pending = acts.filter((a) => a.prop && !opener.has(a));
  let pi = 0, lastG = PHYS.g, lastD = 0;
  for (let i = 0; i < nSteps; i++) {
    const t = at(i);
    if (i % sampleEvery === 0) {
      castS = castN || cast.map((x) => castAt(x, t)); castN = cast.map((x) => castAt(x, Math.min(end, t + sampleEvery * PHYS.dt)));
      kinS = kinN || kin.map((x) => propPose(x.p, Math.max(0, t))); kinN = kin.map((x) => propPose(x.p, Math.max(0, Math.min(end, t + sampleEvery * PHYS.dt))));
    }
    const u = (i % sampleEvery + 1) / sampleEvery;
    cast.forEach((x, j) => {
      const P = castS[j].P.clone().lerp(castN[j].P, u), R = castS[j].R.clone().slerp(castN[j].R, u); x.body.setNextKinematicTranslation(P); x.body.setNextKinematicRotation(R);
      for (let c = 0; c < x.body.numColliders(); c++) x.body.collider(c).setEnabled(!castN[j].hidden);
      for (const L of x.limbs) {
        const i = L.side === "R" ? 0 : 1, a = castS[j].limbs[i], b = castN[j].limbs[i], on = !!(a && b) && !castN[j].hidden;
        L.body.collider(0).setEnabled(on);
        // (switched on again: put it there, never sweep it in from where it was)
        if (on) { const k = L.k === 1 ? "R" : "M", q = a[k].clone().lerp(b[k], u); if (!L.on) L.body.setTranslation(q, true); else L.body.setNextKinematicTranslation(q); }
        L.on = on;
      }
    });
    kin.forEach((x, j) => { const P = kinS[j].P.clone().lerp(kinN[j].P, u), R = kinS[j].R.clone().slerp(kinN[j].R, u); x.body.setNextKinematicTranslation(P); x.body.setNextKinematicRotation(R); });
    // bodies start (their tween's own speed, the action's, or the hand's at a let-go) and stop (a hand takes them)
    for (const b of bodies) {
      const k = b.segs.findIndex((g) => t + 1e-9 >= g.start.at && t + 1e-9 < g.end);
      if (k === b.seg) continue;
      if (k < 0) { b.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, false); b.body.collider(0).setEnabled(false); b.live = false; b.seg = -1; continue; }
      b.seg = k; b.start = b.segs[k].start; b.body.collider(0).setEnabled(true); b.frozen = false;
      const A = b.start, X = startOf(b, A), v = X.v, w = X.w;
      b.body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
      b.body.setTranslation(X.P, true); b.body.setRotation(X.R, true); b.body.setLinvel(v, true); b.body.setAngvel(w, true);
      // a pile settling before the clip moves through thick air: overlaps in the start poses ease apart instead of
      // flinging things off the table (back to free air at frame 0)
      if (A.at < 0) { b.body.setLinearDamping(PHYS.prerollDamp); b.body.setAngularDamping(PHYS.prerollDamp); }
      else { b.body.setLinearDamping(lastD); b.body.setAngularDamping(lastD * 0.5); }
      b.live = true;
    }
    if (t >= 0 && t - PHYS.dt < 0) for (const b of bodies) if (b.live && b.start.at < 0) { b.body.setLinearDamping(0); b.body.setAngularDamping(0); }
    while (pi < pending.length && pending[pi].at <= t + 1e-9) {
      const a = pending[pi++], b = bodies.find((x) => x.id === a.prop); if (!b || !b.live) continue;
      if (a.mode === "settle") { b.body.setBodyType(RAPIER.RigidBodyType.Fixed, true); b.frozen = true; }
      else { if (a.to) b.body.setLinvel(aim(V().copy(b.body.translation()), a), true); else if (a.v) b.body.setLinvel(vec(a.v), true); if (a.spin) b.body.setAngvel(vec(a.spin), true); }
    }
    // (a change of gravity wakes every body: one asleep on the floor floats up in zero-g)
    // air drag (a float's "damp", per second): things drifting in zero-g slow down instead of sailing off forever
    const dr = dampAt(t); if (dr !== lastD) { for (const b of bodies) if (b.live && !b.frozen && !(b.start.at < 0 && t < 0)) { b.body.setLinearDamping(dr); b.body.setAngularDamping(dr * 0.5); } lastD = dr; }
    const g = gAt(t); if (g !== lastG) { world.gravity = { x: 0, y: g, z: 0 }; for (const b of bodies) if (b.live && !b.frozen) b.body.wakeUp(); lastG = g; }
    // record this step's pose (the step's start), then step
    for (const b of bodies) { const p = b.body.translation(), q = b.body.rotation(); b.track.set([p.x, p.y, p.z, q.x, q.y, q.z, q.w], i * 7); }
    done = i;
    world.step();
    if (globalThis.__DIAG?.physics && i % 12 === 0 && t < 0.1) diag.push(`t ${t.toFixed(2)} ` + bodies.map((b) => `${b.id} ${Object.values(b.body.translation()).map((x) => x.toFixed(2))}`).join("  "));
  }
  // the bake hash: FNV-1a over every stored number
  let hash = 2166136261 >>> 0;
  for (const b of bodies) { const u8 = new Uint8Array(b.track.buffer); for (let i = 0; i < u8.length; i++) { hash ^= u8[i]; hash = Math.imul(hash, 16777619) >>> 0; } }
  const info = { hash: hash.toString(16).padStart(8, "0"), bodies: bodies.map((b) => b.id), steps: nSteps, dt: PHYS.dt, tris, ms: Math.round(performance.now() - t0w), ...(diag.length && { diag }) };
  console.log(`physics: baked ${bodies.length} bodies, ${nSteps} steps over ${tris} solid triangles in ${info.ms} ms, hash ${info.hash}`);
  world.free();

  return {
    info,
    // does the bake place this prop at t (from its start on)
    owns(p, t) { const b = owned.get(p); return !!b && b.segs.some((g) => t + 1e-9 >= g.start.at && t + 1e-9 < g.end); },
    // the prop's pose at t (after p.apply(ps, t) gave it its size and parts); the world pose into its parent's frame
    place(p, t) {
      const b = owned.get(p); if (!b) return false;
      const { P, R } = poseAt(b, t), par = p.root.parent;
      if (par && par !== env.scene) { par.updateMatrixWorld(true); const m = new THREE.Matrix4().compose(P, R, V().set(1, 1, 1)).premultiply(par.matrixWorld.clone().invert()); m.decompose(p.root.position, p.root.quaternion, V()); }
      else { p.root.position.copy(P); p.root.quaternion.copy(R); }
      return true;
    },
    // the layout's support record: in flight while it moves, else resting (it lies on whatever the bake put it on)
    support(p, t) {
      const b = owned.get(p); if (!b || !this.owns(p, t)) return null;
      const A = poseAt(b, t - 1 / 30), B = poseAt(b, t), sp = A.P.distanceTo(B.P) * 30;
      return { state: sp > PHYS.rest ? "flight" : "resting", physics: true };
    },
  };
}
