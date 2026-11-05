// Holds 2 (quality plan item 7, "rig": { "hold": 2 }): one attachment model for props in hands.
//
// A held prop is a child of its hold's grip frame: its pose (position AND turn) relative to that frame is captured once,
// at the grab, and from then on it moves and turns with the frame, so it can't drift, slip or float in the hand. The
// frame is
//   - one hand ("R" / "L"): the hand's own frame (the glove's centre, or its fingertip pinch for point "pinch"); a rigid
//     hold turns with the hand, an upright one (cups, glasses, bowls: CLAUDE.md grip rule 2, "a cup stays level") keeps
//     its tilt and takes only the hand's heading. A grab's `upright: true | false` overrides the kind's default.
//   - both hands: the point between them, with the holder's heading (a box carried in both hands turns with the body);
//   - "hat" / "tip": the costume part's frame, rigid.
// The prop's own turn tweened while it is held ("prop" set rot / tip / tilt) turns it about the hand, on top.
//
// Each hold has one owner. A regrip (the same hand, another grip point) or a pass (another hand, or another character
// taking it) blends from the old hold to the new one over at least 0.15 s; a grab of a loose prop glides it in over the
// grab's dur (0: at once, as today), and `keep` holds it exactly where it is (nothing to blend).
//
// A release without `to` drops the prop: it leaves the hand with the hand's last speed, falls (9.81 m/s²) onto the
// surface under it, bounces (a quarter of the speed, twice at most), slides to a stop and settles on its most stable
// side (a phone lands flat, a cup on its foot). `keep: "air"` with a reason leaves it where the hand let go (staged).
// A release with `to` glides there as before, turning back to the prop's own turn.
//
// Everything is a pure function of the time: offsets are measured with the holder posed at the grab (and the release),
// memoised by exact keys, and the surfaces a drop lands on come from the set as built (frozen at init) and the props'
// own tweens at the release time, never from the frame drawn before. support() reports, for the layout, whether each
// prop is held, riding, in flight, resting (within 1 cm of a surface), staged with a reason, or unsupported.
import * as THREE from "three";
import { propState, gripWorld, FX_KINDS } from "./props3d.js";
import { actorState } from "./timeline.js";
import { ease, prog } from "./util.js";

// kinds held level by default (they hold a liquid or something loose on top)
export const UPRIGHT = /mug|cup|glass|bowl|jar|plate|tray|saucer|bottle|candle|juice|coffee|tea|soda|drink|wine|beer|cake|pizza|^pot$/i;
export const HOLD2 = { blend: 0.15, g: 9.81, bounce: 0.25, minBounce: 0.35, friction: 0.5, maxV: 5, rest: 0.01, rock: 3 };

const UP = new THREE.Vector3(0, 1, 0);
const V = () => new THREE.Vector3(), Q = () => new THREE.Quaternion();
const smooth = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const easeOut = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : 1 - (1 - u) * (1 - u));
// the part of a turn about the world's up (a heading): continuous except at a half turn about a level axis
function twistY(q) { const t = new THREE.Quaternion(0, q.y, 0, q.w), l = Math.hypot(t.y, t.w); return l < 1e-9 ? t.identity() : t.set(0, t.y / l, 0, t.w / l); }
// a prop's own turn from its state (props3d.js buildProp: tip about x, rot about y, tilt / roll about z, order YXZ)
export function ownQ(ps) { return Q().setFromEuler(new THREE.Euler((ps.tip * Math.PI) / 180, (ps.rot * Math.PI) / 180, ((-(ps.tilt ?? 0) + (ps.roll ?? 0)) * Math.PI) / 180, "YXZ")); }
const holdKey = (h) => `${h.who}/${h.hand}/${h.point || ""}@${h.at}/${JSON.stringify(h.grip)}/${h.keep ? 1 : 0}/${JSON.stringify(h.off || 0)}`;

// env: { sb, scene, props, states: () => stage pose states, setMeshes: the set's meshes, fps }
export function makeAttach(env) {
  const { sb } = env, fps = sb.fps ?? 30;
  // the set as built, frozen: rays for a drop's landing never see the set as some other frame left it
  const frozen = [];
  for (const o of env.setMeshes || []) {
    o.updateMatrixWorld(true);
    o.traverse((m) => {
      if (!m.isMesh || m.isSkinnedMesh || m.isInstancedMesh || !m.geometry || !m.visible) return;
      const f = new THREE.Mesh(m.geometry, m.material); f.matrixAutoUpdate = false; f.matrixWorld.copy(m.matrixWorld); f.matrix.copy(m.matrixWorld);
      frozen.push(f);
    });
  }
  // each prop's own box (scale 1, no turn), for its lowest point in a turn
  const boxes = new Map();
  const boxOf = (p) => {
    if (boxes.has(p)) return boxes.get(p);
    const r = p.root, keep = [r.position.clone(), r.quaternion.clone(), r.scale.clone()], par = r.parent;
    r.position.set(0, 0, 0); r.quaternion.identity(); r.scale.set(1, 1, 1);
    if (par) par.remove(r);
    r.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(r, true);
    if (par) par.add(r);
    r.position.copy(keep[0]); r.quaternion.copy(keep[1]); r.scale.copy(keep[2]); r.updateMatrixWorld(true);
    const out = b.isEmpty() ? new THREE.Box3(V().set(-0.05, 0, -0.05), V().set(0.05, 0.1, 0.05)) : b;
    boxes.set(p, out); return out;
  };
  const corners = (b) => [0, 1, 2, 3, 4, 5, 6, 7].map((i) => V().set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z));
  // how far the prop's lowest point is below its origin, in this turn and scale
  const lowest = (p, q, s) => Math.min(...corners(boxOf(p)).map((c) => c.multiplyScalar(s).applyQuaternion(q).y));

  let T = 0, cur = null;   // the time being posed, and the props' states at it
  const st = () => env.states();
  // pose a holder at another moment, run fn, put it back (the holder is posed at T by stage.js)
  const at = (who, time, fn) => {
    const A = st()[who];
    if (!A || Math.abs(time - T) < 1e-9) return fn();
    A.a.ch.apply(actorState(sb, A.a.c, A.a.def, time), time);
    try { return fn(); } finally { A.a.ch.apply(A.st, T); }
  };
  const upright = (p, h) => (h.hand === "hat" || h.hand === "tip" ? false : h.upright ?? (h.hand === "both" || UPRIGHT.test(p.spec.kind)));
  // the hold's frame on the holder as posed now
  const frameNow = (h) => {
    const A = st()[h.who]; if (!A) return null;
    const ch = A.a.ch; ch.root.updateMatrixWorld(true);
    if (h.hand === "hat" || h.hand === "tip") { const o = h.hand === "hat" ? ch.costume?.hat : ch.costume?.tip; return o ? { pos: o.getWorldPosition(V()), q: o.getWorldQuaternion(Q()) } : null; }
    if (h.hand === "both") return { pos: ch.arms.R.hand.getWorldPosition(V()).add(ch.arms.L.hand.getWorldPosition(V())).multiplyScalar(0.5), q: ch.root.getWorldQuaternion(Q()) };
    const hand = ch.arms[h.hand]?.hand; if (!hand) return null;
    const pin = h.point === "pinch" && hand.userData.pinchPt;
    return { pos: (pin ? hand.userData.pinchPt : hand).getWorldPosition(V()), q: hand.getWorldQuaternion(Q()) };
  };
  const frameAt = (h, time) => at(h.who, time, () => frameNow(h));
  const stateAt = (p, time) => (Math.abs(time - T) < 1e-9 && cur.has(p) ? cur.get(p) : propState(sb, p.spec, time));

  // how much a hand follows the prop rather than carrying it (0..1): arm poses aimed at the prop ({ prop } poses, the
  // grip library's carry) make the prop's own turn the truth and the hand follows it; any other pose (a named pose, a
  // gesture, sitting, standing) carries it, and it turns with the hand. Replays the arm-setting actions as actorState
  // nests them (each new pose mixes from the one before by its own progress at t), so nothing switches in one frame.
  const ARMS = new Map();
  const armActs = (who) => {
    if (!ARMS.has(who)) ARMS.set(who, (sb.actions || []).filter((a) => a.who === who && (a.do === "arm" || a.do === "climb" || a.do === "stand" || (a.do === "sit" && a.hands !== "keep") || (a.do === "grab" && a.pose !== null && (a.hand === "R" || a.hand === "L")))).sort((a, b) => a.at - b.at));
    return ARMS.get(who);
  };
  const aims = (q, id) => !!q && typeof q === "object" && (q.prop === id || (q.mix && (aims(q.mix.pose, id))));
  const followW = (who, side, id, time) => {
    let w = 0;
    for (const a of armActs(who)) {
      if (a.at > time) break;
      const sides = a.do === "arm" ? (a.side === "both" ? ["R", "L"] : [a.side || "R"]) : a.do === "grab" ? [a.hand] : ["R", "L"];
      if (!sides.includes(side)) continue;
      const on = (a.do === "arm" || a.do === "grab") && aims(a.pose, id) ? 1 : 0, d = a.do === "grab" ? a.dur ?? 0.25 : a.dur ?? 0.3;
      w += (on - w) * (d > 0 ? smooth((time - a.at) / d) : 1);
    }
    return w;
  };
  const follow = (p, h, time) => (h.hand === "both" ? (followW(h.who, "R", p.spec.id, time) + followW(h.who, "L", p.spec.id, time)) / 2 : h.hand === "R" || h.hand === "L" ? followW(h.who, h.hand, p.spec.id, time) : 0);

  // the seat: the prop's pose in the hold's frame, measured once when the hold takes it
  const seats = new Map();
  const seat = (p, h) => {
    const key = `${p.spec.id}|${holdKey(h)}`;
    if (seats.has(key)) return seats.get(key);
    let s = null;
    // a glide from a loose spot seats at its end; a keep or a pass seats at the grab
    const glide = !h.keep && !h.was && !h.grip && (h.dur ?? 0.25) > 0, ts = glide ? h.at + (h.dur ?? 0.25) : h.at;
    const F = frameAt(h, ts);
    if (F) {
      let P, Qp;
      if (h.keep) ({ P, Q: Qp } = before(p, h, h.at));
      else {
        // as today's anchor: the grip point (or the prop's own grip height) in the hand, plus off; the prop's own turn
        const ps = stateAt(p, ts), g = h.grip ? gripWorld(p.spec, h.grip, [0, 0, 0], ps.rot, ps.scale, ps.tilt, ps.tip) : [0, p.grip * ps.scale, 0], o = h.off || [0, 0, 0];
        P = V().set(F.pos.x - g[0] + o[0], F.pos.y - g[1] + o[1], F.pos.z - g[2] + o[2]); Qp = ownQ(ps);
      }
      const own = ownQ(stateAt(p, ts));
      // gl: the hand's point in the prop's own (turned, unscaled) frame: the pivot for its own turns while held
      s = { qsInv: F.q.clone().invert(), Qp: Qp.clone(), ownInv: own.invert(), gl: F.pos.clone().sub(P).applyQuaternion(Qp.clone().invert()), up: upright(p, h) };
    }
    seats.set(key, s); return s;
  };
  // the pose a hold gives at `time`, without blends
  // The turn has one owner at a time, blended by follow(): carried, it turns with the hand since the seat (rigid) or
  // takes the hand's heading (upright), with the prop's own tweened turn on top; followed (the arm aims at the prop),
  // it is the prop's own turn, which the hand is already aiming at. The hand's point stays on the same spot of the prop
  // either way (its position is always the hand's).
  const attached = (p, h, time) => {
    const s = seat(p, h), F = s && frameAt(h, time); if (!F) return null;
    const own = ownQ(stateAt(p, time)), w = follow(p, h, time);
    let q = own;
    if (w < 1) {
      const R = F.q.clone().multiply(s.qsInv), Rh = s.up ? twistY(R) : R;
      const carried = Rh.multiply(s.Qp).multiply(s.ownInv.clone().multiply(own));
      q = w > 0 ? carried.slerp(own, w) : carried;
    }
    return { P: F.pos.clone().sub(s.gl.clone().applyQuaternion(q)), Q: q };
  };
  // where the prop was just before this hold took it, at `time`: in the hand it came from, where it fell, or its own spot
  const before = (p, h, time) => {
    if (h.was) return pose(p, h.was, time) ?? loose(p, h, time);
    if (h.prev) return dropped(p, h.prev, time);
    return loose(p, h, time);
  };
  const loose = (p, h) => {
    const r = h.fromRot || [p.spec.rot ?? 0, p.spec.tip ?? 0, p.spec.tilt ?? 0, p.spec.roll ?? 0];
    return { P: V().fromArray(h.from), Q: ownQ({ rot: r[0], tip: r[1], tilt: r[2], roll: r[3] }) };
  };
  const blend = (A, B, e) => ({ P: A.P.clone().lerp(B.P, e), Q: A.Q.clone().slerp(B.Q, e) });
  // the pose a hold gives at `time`, with its grab's blend in
  const pose = (p, h, time) => {
    const A = attached(p, h, time); if (!A) return null;
    if (h.keep) return A;
    const d = h.was ? Math.max(h.dur ?? 0.25, HOLD2.blend) : h.grip ? 0 : h.dur ?? 0.25;
    if (d > 0 && time < h.at + d) return blend(before(p, h, h.was ? time : h.at), A, h.was ? smooth((time - h.at) / d) : easeOut((time - h.at) / d));
    return A;
  };

  // surfaces under a point: the frozen set and every prop not in a hand, where its own tweens put it at `time`
  const ray = new THREE.Raycaster();
  const surfaceBelow = (x, z, yFrom, time, self) => {
    ray.set(V().set(x, yFrom, z), V().set(0, -1, 0)); ray.far = yFrom + 50;
    let y = -Infinity;
    for (const h of ray.intersectObjects(frozen, false)) { y = Math.max(y, h.point.y); break; }
    for (const q of env.props) {
      if (q === self || !q.root.visible || q.spec.wear || (q.root.parent && q.root.parent !== env.scene)) continue;
      const ps = propState(sb, q.spec, time); if (ps.hold || ps.left || ps.carry || ps.scale <= 0.002) continue;
      const r = q.root, keep = [r.position.clone(), r.quaternion.clone(), r.scale.clone()];
      r.position.set(ps.x, ps.y, ps.z); r.quaternion.copy(ownQ(ps)); r.scale.setScalar(ps.scale); r.updateMatrixWorld(true);
      for (const hit of ray.intersectObject(r, true)) { if (hit.object.visible && hit.point.y <= yFrom) { y = Math.max(y, hit.point.y); break; } }
      r.position.copy(keep[0]); r.quaternion.copy(keep[1]); r.scale.copy(keep[2]); r.updateMatrixWorld(true);
    }
    return y === -Infinity ? 0 : y;
  };
  // the side a dropped prop comes to rest on: the one nearest up, favouring its broad sides (a phone lands flat)
  const restQ = (p, q) => {
    const b = boxOf(p), ext = [b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z], mx = Math.max(...ext);
    let best = null, bs = -Infinity;
    for (let i = 0; i < 3; i++) for (const sg of [1, -1]) {
      const a = V().setComponent(i, sg).applyQuaternion(q), sc = a.y - 1.5 * (ext[i] / mx);
      if (sc > bs) { bs = sc; best = a; }
    }
    return Q().setFromUnitVectors(best, UP).multiply(q);
  };
  // a drop: from the hand's pose and speed at the let-go to rest on the surface under it
  const drops = new Map();
  const dropOf = (p, left) => {
    const key = `${p.spec.id}|${holdKey(left)}|${left.at}`;
    if (drops.has(key)) return drops.get(key);
    const h = { ...left, at: left.grabAt ?? left.at }, tr = left.at, dt = 1 / fps;
    const X0 = pose(p, h, tr), X1 = pose(p, h, tr - dt);
    let D = null;
    if (X0) {
      const v = X1 ? X0.P.clone().sub(X1.P).divideScalar(dt) : V();
      if (v.length() > HOLD2.maxV) v.setLength(HOLD2.maxV);
      const s = stateAt(p, tr).scale ?? 1, Qr = restQ(p, X0.Q), b0 = lowest(p, X0.Q, s), br = lowest(p, Qr, s);
      // flight: the body falls from the let-go; it lands when its lowest point (in its rest turn) meets the surface
      const land = (yS) => { const c = X0.P.y + br - yS, g = HOLD2.g; return (v.y + Math.sqrt(Math.max(0, v.y * v.y + 2 * g * c))) / g; };
      let yS = surfaceBelow(X0.P.x, X0.P.z, X0.P.y + b0 + 0.02, tr, p), t1 = land(yS);
      const yS2 = surfaceBelow(X0.P.x + v.x * t1, X0.P.z + v.z * t1, X0.P.y + b0 + 0.02, tr, p);
      if (Math.abs(yS2 - yS) > 1e-4) { yS = yS2; t1 = land(yS); }
      // bounces: up at a quarter of the landing speed while it is fast enough, the slide slowing at each
      const hops = []; let vy = HOLD2.g * t1 - v.y, vx = v.x * HOLD2.friction, vz = v.z * HOLD2.friction;
      for (let i = 0; i < 2; i++) { const u = vy * HOLD2.bounce; if (u < HOLD2.minBounce) break; hops.push({ u, d: (2 * u) / HOLD2.g }); vy = u; }
      D = { tr, P0: X0.P.clone(), v, Q0: X0.Q.clone(), Qr, br, yS, t1, hops, vx, vz, s };
    }
    drops.set(key, D); return D;
  };
  // where a dropped prop is at `time`
  const dropped = (p, left, time) => {
    const D = dropOf(p, left); if (!D) return null;
    const tau = Math.max(0, time - D.tr);
    if (tau < D.t1) {
      const P = V().set(D.P0.x + D.v.x * tau, D.P0.y + D.v.y * tau - 0.5 * HOLD2.g * tau * tau, D.P0.z + D.v.z * tau);
      return { P, Q: D.Q0.clone().slerp(D.Qr, smooth(tau / D.t1)), phase: "flight" };
    }
    // after the landing: hops along, then the slide's last bit; the rest sits its lowest point on the surface
    let u = tau - D.t1, x = D.P0.x + D.v.x * D.t1, z = D.P0.z + D.v.z * D.t1, y = D.yS - D.br, vx = D.vx, vz = D.vz, phase = "rest";
    for (const hp of D.hops) {
      if (u < hp.d) return { P: V().set(x + vx * u, y + hp.u * u - 0.5 * HOLD2.g * u * u, z + vz * u), Q: D.Qr.clone(), phase: "flight" };
      u -= hp.d; x += vx * hp.d; z += vz * hp.d; vx *= HOLD2.friction; vz *= HOLD2.friction;
    }
    // slide to a stop (friction 0.6 g) and a small rock as it settles
    const sp = Math.hypot(vx, vz), a = 0.6 * HOLD2.g, ts = sp / a, w = Math.min(u, ts), k = sp > 1e-6 ? (sp * w - 0.5 * a * w * w) / sp : 0;
    x += vx * k; z += vz * k;
    const rk = u - ts, q = D.Qr.clone();
    // (rocking on its edge: the lowest point stays on the surface)
    if (rk > 0 && rk < 0.4) { const ang = ((HOLD2.rock * Math.PI) / 180) * Math.exp(-rk * 9) * Math.sin(rk * 40); q.premultiply(Q().setFromAxisAngle(V().set(Math.cos(D.tr * 7), 0, Math.sin(D.tr * 7)), ang)); y = D.yS - lowest(p, q, D.s); phase = "settle"; }
    else if (rk <= 0) phase = "slide";
    return { P: V().set(x, y, z), Q: q, phase };
  };

  // place every prop for time t (stage.js calls begin, then place per prop after its p.apply)
  return {
    begin(t) { T = t; cur = new Map(); },
    // ps: the prop's state at t; p.apply(ps, t) has run (its size, parts and own turn). Returns true when it placed it.
    place(p, ps) {
      cur.set(p, ps);
      p.attach = null;
      const par = p.root.parent, inRig = par && par !== env.scene;
      let X = null, state = null;
      if (ps.hold) {
        const h = ps.hold;
        X = pose(p, h, T);
        // a release with `to`: the hand's pose glides to that spot and the prop's own turn
        // (it has left the hand: not held, so the slip checks don't read the toss as a slip)
        if (X && h.to && h.k != null && h.k < 1) { X = blend({ P: V().fromArray(h.to).add(V().set(0, h.arc || 0, 0)), Q: ownQ(ps) }, X, h.k); p.held = false; state = "flight"; }
        else state = "held";
      } else if (ps.left && !inRig) {
        if (ps.left.air != null) { X = pose(p, { ...ps.left, at: ps.left.grabAt ?? ps.left.at }, ps.left.at); state = ps.left.air ? "staged" : "unsupported"; }
        else {
          X = dropped(p, ps.left, T); state = X?.phase === "flight" || X?.phase === "slide" ? "flight" : "dropped";
          // a "prop" tween that moves it after the let-go places it (the stick laid on the ground): from where the drop
          // has it when the tween starts to the tween's spot, turning to the prop's own turn
          const tw = posTweens(p).filter((a) => a.at >= ps.left.at - 1e-6 && a.at <= T).at(-1);
          if (tw) {
            const X0 = dropped(p, ps.left, tw.at), e = ease(tw.ease || "inOut")(prog(T, tw.at, tw.dur ?? 0.3));
            if (X0) {
              const to = V().set("x" in tw.set ? tw.set.x : X0.P.x, "y" in tw.set ? tw.set.y : X0.P.y, "z" in tw.set ? tw.set.z : X0.P.z);
              X = { P: X0.P.clone().lerp(to, e), Q: X0.Q.clone().slerp(ownQ(ps), e) };
              if (tw.arc && e < 1) X.P.y += 4 * tw.arc * e * (1 - e);
              state = e < 1 ? "flight" : "placed";
            }
          }
        }
      }
      if (!X) return false;
      if (inRig) { par.updateMatrixWorld(true); const m = new THREE.Matrix4().compose(X.P, X.Q, V().set(1, 1, 1)).premultiply(par.matrixWorld.clone().invert()); m.decompose(p.root.position, p.root.quaternion, V()); }
      else { p.root.position.copy(X.P); p.root.quaternion.copy(X.Q); }
      p.attach = { state, ...(ps.left?.air && { reason: ps.left.air }) };
      return true;
    },
    // the layout's support record for a prop (every frame it is posed): held, riding, flight, resting (within 1 cm of
    // what is under it), staged (with a reason) or unsupported, with the gap in mm
    support(p, ps) {
      if (!p.root.visible) return null;
      if (ps.hold && p.attach?.state === "flight") return { state: "flight" };
      if (ps.hold) return { state: "held", ...(twoWriters(p, T) && { writers: 2 }) };
      if (p.spec.wear || ps.carry || (p.root.parent && p.root.parent !== env.scene)) return { state: "riding" };
      if (p.attach?.state === "flight") return { state: "flight" };
      // moved by its own tween right now (tossed, slid, swung by the story): in flight
      if (tweening(p, T)) return { state: "flight" };
      // not a thing that stands on anything (roar lines, bursts, glows: props3d.js FX_KINDS) or hung by its spec
      if (FX_KINDS.test(p.spec.kind)) return { state: "staged", reason: "an effect or a set piece" };
      if (p.attach?.state === "staged") return { state: "staged", reason: p.attach.reason };
      if (p.spec.staged) return { state: "staged", reason: String(p.spec.staged) };
      p.root.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(p.root, true); if (b.isEmpty()) return null;
      const c = b.getCenter(V());
      ray.set(V().set(c.x, b.min.y + 0.05, c.z), V().set(0, -1, 0)); ray.far = 60;
      // what it could stand on: the set as it is now and every other prop (meshes only: sprites need a camera)
      const under = [];
      const solid = (m) => !(m.material && !Array.isArray(m.material) && m.material.transparent && m.material.opacity < 0.6);
      const take = (o) => o.traverseVisible((m) => { if (m.isMesh && !m.isSprite && m.geometry && solid(m)) under.push(m); });
      for (const o of env.setMeshes || []) take(o);
      for (const q of env.props) if (q !== p && q.root.visible) take(q.root);
      let y = null;
      for (const hit of ray.intersectObjects(under, false)) { y = hit.point.y; break; }
      const gap = b.min.y - (y ?? 0);
      return { state: gap <= HOLD2.rest ? "resting" : "unsupported", gap: Math.round(gap * 1000) };
    },
  };
  // the "prop" tweens that move a prop (x, y or z)
  function posTweens(p) {
    if (!p._posTw) p._posTw = (sb.actions || []).filter((a) => a.do === "prop" && a.id === p.spec.id && a.set && ["x", "y", "z"].some((k) => k in a.set)).sort((a, b) => a.at - b.at);
    return p._posTw;
  }
  function tweening(p, t) { return posTweens(p).some((a) => t >= a.at && t < a.at + (a.dur ?? 0.3)); }
  // a held prop that a "prop" tween also moves (two writers: the hand and the tween)
  function twoWriters(p, t) { return tweening(p, t); }
}
