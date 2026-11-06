import { EXPRESSIONS, blendExpr, lookProgress } from "./face.js";
import { clamp, lerp, lerp3, ease, prog, wobble, rng, armNow, hopCrouch, loopLen, loopRad, naturalOf, cruiseVel, cruiseDist, bump } from "./util.js";
import { planSyllables, mouthAt } from "../shared/syllables.js";
import { speechMouthAt } from "../shared/visemes.js";
import { isDance, applyDance } from "./dance.js";
import { SEAT_Y, propState, gripWorld, partPoint } from "./props3d.js";
import { CARD_REST } from "./costumes-card.js";

// syllable plans are pure functions of (action, voice): cache them per action object
const PLANS = new WeakMap();
const planFor = (a, voice) => { let p = PLANS.get(a); if (!p) { p = planSyllables(a, voice); PLANS.set(a, p); } return p; };

// Turns a storyboard into per-frame state. Everything is a pure function of time t:
// each actor starts from its cast entry and the actions up to t are applied in order.

const YAW = { camera: 0, front: 0, right: Math.PI / 2, left: -Math.PI / 2, "3q-right": 0.62, "3q-left": -0.62, back: Math.PI };
const yawOf = (v) => (typeof v === "number" ? (v * Math.PI) / 180 : YAW[v] ?? 0);

// hovering after a fly: a gentle bob that fades in, and a wing beat that settles from full to 60 %
// (D: the loop length when loop-safe idle is on, util.js loopLen)
const hoverBob = (u, D = 0) => 0.035 * Math.sin(u * loopRad(5.5, D)) * clamp(u / 0.3);
const hoverFlap = (u) => 0.6 + 0.4 * (1 - clamp(u / 0.25));

// Wing beats and a charged staff's sparkles speed up and slow down. Their phase is the integral of the speed over
// time: t × speed would jump whenever the speed changes. The integral is summed in fixed steps from 0 and cached,
// so it is the same whatever order frames are drawn in (stills, drafts and full renders agree).
// fine face controls on top of the expression (face.js Face.set): per-eye lid closing, per-side brow height and tilt,
// per-side mouth corners, pressed lips and tears (0 dry .. 0.5 wet lower lid .. 1 a tear gathered on it). All 0 by
// default; "face" actions blend them.
const neutralExpr = (def) => { const n = def.face?.neutral || {}, o = {}; for (const k in EXPRESSIONS.kind) if (n[k] != null) o[k] = n[k]; return o; };
export const FACE_KEYS = ["lidL", "lidR", "browL", "browR", "tiltL", "tiltR", "cornerL", "cornerR", "press", "tearL", "tearR", "fangs", "juiceL", "juiceR", "stainL", "stainR"];
const FACE_BOTH = { lid: ["lidL", "lidR"], brow: ["browL", "browR"], tilt: ["tiltL", "tiltR"], corner: ["cornerL", "cornerR"], tear: ["tearL", "tearR"] };
// mitten hand shapes (potato.js): curl of the fingers, the index finger and the thumb, 0 straight .. 1 closed
export const GRIPS = {
  open:  { curl: 0.15, index: 0.12, thumb: 0.1 },
  hold:  { curl: 0.95, index: 0.95, thumb: 0.85 },   // wrapped round a handle, a staff or a jar
  fist:  { curl: 1.2,  index: 1.2,  thumb: 1.0 },
  pinch: { curl: 0.7,  index: 0.85, thumb: 1.0 },    // thumb and index meet: a cup handle, a lid
  point: { curl: 1.15, index: 0.0,  thumb: 0.9 },
  cup:   { curl: 0.5,  index: 0.45, thumb: 0.35, up: 1 },   // palm up, cradling something from below: an orb, a jar's base
  flat:  { curl: 0.0,  index: 0.0,  thumb: 0.0 },    // open palm
  relaxed: { curl: 0.45, index: 0.35, thumb: 0.25 }, // a hand at rest: fingers gently bent
  paw:   { curl: 0.85, index: 0.8,  thumb: 0.85, down: 1, ahead: 0.75 },   // a paw resting on a table, palm down, knuckles to the front
  scroll: { curl: 0.95, index: 0.95, thumb: 0.45 },
  rim:   { curl: 0.55, index: 0.5,  thumb: 0.35 },   // a half-curled hand pressed on the edge of a seat or a board  // holding a phone, the thumb lifted off the screen to flick it
  // a teacup or mug handle: the fist closes round the handle's upright bar (axis: up), thumb on top of the handle, the
  // curled fingers under and round it, lying against the cup body in front
  thumb: { curl: 1.2,  index: 1.2,  thumb: 0.0 },   // thumbs up: a fist with the thumb straight (forearm forward, palm in: it points up)
  teacup: { curl: 0.95, index: 0.95, thumb: 0.9, axis: [0, 1, 0], fwd: 0.7 },
  // a thin slab held by its edge (a phone, a card): the fingers lie flat along its back, the thumb pad on its front by
  // the edge, the palm beside the edge (edge: the thumb moves to its place for this hold, potato.js). Used with a framed
  // arm pose whose `at` is PHONE_EDGE: the edge in the hand, past the top of the palm, a finger's thickness in front of
  // the fingers, by the thumb
  phoneEdge: { curl: 0.04, index: 0.04, thumb: 0.9, edge: 1 },
  phoneEdgeReady: { curl: 0.04, index: 0.04, thumb: 0.15, edge: 0 },   // the same, the thumb held off beside the edge
  // a hand reaching out over a tabletop, palm down, the index leading along the forearm (a reach for a plug)
  hover: { curl: 0.25, index: 0.02, thumb: 0.3, down: 1, ahead: 0 },
  // a hand closed from above round something thin (a wrist, a rail): palm down, the fingers curled down round it
  clasp: { curl: 0.8, index: 0.75, thumb: 0.7, down: 1, ahead: 0 },
  // carrying something from below its side (a bowl in both hands, storyboards/lib/grips.mjs): the palm half turned up
  // under it, the fingers gently curved along it
  carry: { curl: 0.45, index: 0.4, thumb: 0.3, up: 0.5 },
  // palms pressed flat on the two ends of a box, the thumb laid forward along the side instead of sticking up
  press: { curl: 0.18, index: 0.12, thumb: 0.75 },
  // a fingertip pinch on a thin upright thing (a straw): the thumb and index pads opposing on it, the other fingers
  // loosely curled, the palm beside it, the fingers running on along the forearm (glove hands; the prop is held at the
  // pinch with grab point "pinch"). roll turns the hand about the straw; thin: its radius in the hand's own units
  tip: { curl: 0.95, index: 0.35, thumb: 0.5, axis: [0, 1, 0], pinch: 1, lean: 30 },
};
export const PHONE_EDGE = [0.02, 0.04, 0.0215];
// up: how far the palm turns to face the sky (1 for a cupped hand carrying something from below); down, ahead: a paw
// palm down on a surface, its fingers turned that far from the forearm towards straight ahead
// axis: a handle held without a costume prop (the teacup), in the actor's root space; the fist only turns onto it once
// the hand is closing, so taking it from either end of the blend never pops. fwd: how far the fist turns its
// knuckles to face forward (0 along the forearm, 1 straight ahead)
const blendGrip = (a, b, t) => ({ curl: lerp(a.curl, b.curl, t), index: lerp(a.index, b.index, t), thumb: lerp(a.thumb, b.thumb, t), up: lerp(a.up || 0, b.up || 0, t), fwd: lerp(a.fwd || 0, b.fwd || 0, t), edge: lerp(a.edge || 0, b.edge || 0, t), down: lerp(a.down || 0, b.down || 0, t), ahead: lerp(a.ahead ?? 0.7, b.ahead ?? 0.7, t), axis: (t < 0.5 ? a.axis || b.axis : b.axis || a.axis) || null, ...((a.pinch || b.pinch) && { pinch: lerp(a.pinch || 0, b.pinch || 0, t), roll: lerp(a.roll || 0, b.roll || 0, t), lean: lerp(a.lean || 0, b.lean || 0, t), close: lerp(a.close ?? 1, b.close ?? 1, t), thin: b.thin ?? a.thin }) });

// a blink at 30 fps: closes over about 2.5 frames, shut for one, reopens over about 4 (u: seconds since it began)
export const BLINK_LEN = 0.26;
export const blinkAt = (u) => (u < 0 || u > BLINK_LEN ? 0 : u < 0.08 ? Math.sin((u / 0.08) * Math.PI / 2) : u < 0.11 ? 1 : 0.5 + 0.5 * Math.cos(((u - 0.11) / 0.15) * Math.PI));

const PHASES = new WeakMap(), STEP = 1 / 120;
function phases(sb, actor, def, t) {
  let per = PHASES.get(sb); if (!per) { per = new Map(); PHASES.set(sb, per); }
  let P = per.get(actor.id);
  if (!P) { P = { flap: [0], charge: [0], need: (sb.actions || []).some((a) => a.who === actor.id && ["fly", "hover", "drop", "land", "charge"].includes(a.do)) }; per.set(actor.id, P); }
  if (!P.need) { const LD = loopLen(sb); return { flapPhase: LD ? loopRad(7, LD) * t : 7 * t, chargePhase: 0 }; }
  const k = Math.max(0, Math.floor(t / STEP));
  const rate = (u) => { const s = actorState(sb, actor, def, u, true); return [7 + 17 * (s.flap || 0), s.charge || 0]; };
  for (let i = P.flap.length; i <= k; i++) { const [f, c] = rate((i - 1) * STEP); P.flap.push(P.flap[i - 1] + f * STEP); P.charge.push(P.charge[i - 1] + c * STEP); }
  const [f, c] = rate(k * STEP), r = t - k * STEP;
  return { flapPhase: P.flap[k] + f * r, chargePhase: P.charge[k] + c * r };
}

// Follow-through: soft parts on top (a hat's tip and brim, the sprout, a crest, a tail, a cape) trail the body and
// settle after it stops. The top of the head pulls a damped spring (about 2.2 Hz, a visible overshoot or two, settled
// within half a second); how far the spring lags, in the body's own frame, becomes the part's bend: st.ft = { f, s, u },
// in radians, f toward the front, s toward the actor's +x, u up. A turn adds a sideways lag of its own. Like the wing
// beat, the spring is stepped at a fixed rate from 0 and cached, so a frame comes out the same in a still, a draft or
// a full render. A hard cut or a jump of the body (a re-placement) resets it, so nothing swings at a cut.
// cast `sway` scales it per actor (0 turns it off); sb.followThrough: false turns it off for the clip.
const FT = { w: 2 * Math.PI * 2.2, z: 0.35, gain: 2.0, turn: 0.45, max: 0.35, dt: 1 / 120 };
const FTS = new WeakMap();
const soft = (x) => FT.max * Math.tanh(x / FT.max);
function headOf(st, H) {
  const h = H * st.squash * (st.scale ?? 1), p = st.pitch || 0, l = st.lean || 0, cy = Math.cos(st.yaw), sy = Math.sin(st.yaw);
  const x = -h * Math.sin(l), y = h * Math.cos(l) * Math.cos(p), z = h * Math.cos(l) * Math.sin(p);
  return [st.x + x * cy + z * sy, st.y + y, st.z - x * sy + z * cy, st.yaw, st.visible !== false];
}
function followThrough(sb, actor, def, t) {
  const amt = sb.followThrough === false ? 0 : actor.sway ?? 1;
  if (!amt || !def?.body) return { f: 0, s: 0, u: 0 };
  let per = FTS.get(sb); if (!per) { per = new Map(); FTS.set(sb, per); }
  let F = per.get(actor.id);
  if (!F) { F = { out: [], X: null, V: [0, 0, 0], Y: 0, VY: 0, prev: null }; per.set(actor.id, F); }
  const k = Math.max(0, Math.floor(t / FT.dt) + 1), { w, z, dt } = FT;
  for (let i = F.out.length; i <= k; i++) {
    const u = i * dt, P = headOf(actorState(sb, actor, def, u, true), def.body.height);
    // start at rest; a cut, a jump of more than 15 cm in one step (re-placed) or a hidden body starts it again
    if (!F.X || !P[4] || (F.prev && (Math.hypot(P[0] - F.prev[0], P[1] - F.prev[1], P[2] - F.prev[2]) > 0.15 || cutBetween(sb, u - dt, u)))) {
      F.X = P.slice(0, 3); F.V = [0, 0, 0]; F.Y = P[3]; F.VY = 0;
    }
    for (let j = 0; j < 3; j++) { F.V[j] += (w * w * (P[j] - F.X[j]) - 2 * z * w * F.V[j]) * dt; F.X[j] += F.V[j] * dt; }
    F.VY += (w * w * (P[3] - F.Y) - 2 * z * w * F.VY) * dt; F.Y += F.VY * dt;
    const L = [F.X[0] - P[0], F.X[1] - P[1], F.X[2] - P[2]], cy = Math.cos(P[3]), sy = Math.sin(P[3]);
    const lx = L[0] * cy - L[2] * sy, lz = L[0] * sy + L[2] * cy;
    F.out.push([soft(FT.gain * lz), soft(FT.gain * lx - FT.turn * (F.Y - P[3])), soft(FT.gain * L[1])]);
    F.prev = P;
  }
  const i = Math.floor(t / FT.dt), r = t / FT.dt - i, a = F.out[i], b = F.out[i + 1] || a;
  return { f: amt * lerp(a[0], b[0], r), s: amt * lerp(a[1], b[1], r), u: amt * lerp(a[2], b[2], r) };
}

// where the eyes look at time u, from the look actions alone (the body's follow reads it a little in the past)
function lookAt(looks, u) {
  let l = [0, 0];
  for (const a of looks) {
    if (a.at > u) break;
    const e = ease(a.ease || "inOut")(prog(u, a.at, a.dur ?? 0.3));
    l = [lerp(l[0], a.to[0], e), lerp(l[1], a.to[1], e)];
  }
  return l;
}

// where a "ride" action puts its rider at time u: the prop's position plus the offset turned with the prop
function rideAt(sb, a, u) {
  const spec = (sb.props || []).find((q) => q.id === a.prop); if (!spec) return { x: 0, y: 0, z: 0, yaw: 0, lean: 0 };
  const ps = propState(sb, spec, u), r = (ps.rot * Math.PI) / 180, s = ps.scale ?? 1;
  let [ox, oy, oz] = (a.off || [0, 0, 0]).map((v) => v * s), lean = 0;
  // tilt: true also follows the prop's tilt (a mattress tipped up like a lid): the offset turns with it about the
  // prop's own z, and the rider leans with it (for a rider facing along the prop's z)
  if (a.tilt) { const c = -((ps.tilt ?? 0) * Math.PI) / 180; [ox, oy] = [ox * Math.cos(c) - oy * Math.sin(c), ox * Math.sin(c) + oy * Math.cos(c)]; lean = c; }
  return { x: ps.x + Math.cos(r) * ox + Math.sin(r) * oz, y: ps.y + oy, z: ps.z - Math.sin(r) * ox + Math.cos(r) * oz, yaw: r + ((a.yaw ?? 0) * Math.PI) / 180, lean };
}

// Natural motion helpers (util.js naturalOf). natMove: a walk from where the body is to a.to with a cruise speed (ramps
// of up to 0.28 s at each end), footfalls paced by the distance covered so each standing foot stays put on the floor
// (step length from the cruise speed at the walk's own cadence, a.steps cycles a second; a.stride fixes it instead),
// and the gait the body shows on top (natApply).
// a toe tap's slap: this far into each tap cycle (timeline "tap"; engine/audio.mjs puts the footstep there)
export const TAP_AT = 0.6;
function natMove(st, a, t, d, nat) {
  const dx = a.to[0] - st.x, dz = a.to[1] - st.z, dist = Math.hypot(dx, dz), p = prog(t, a.at, d);
  const r = Math.min(0.28, 0.3 * d), q = d > 0 ? r / d : 0, s = cruiseDist(p, q);
  st.x += dx * s; st.z += dz * s;
  if (a.y != null) st.y += (a.y - st.y) * s;   // a move up or down a slope: `y` the height it ends at
  if (p >= 1 || dist < 1e-4 || d <= 0) return;
  const V = dist / (d * (1 - q)), sd = a.stride ?? clamp(V / (a.steps ?? 2.2) / 0.2, 0.5, 2.2), L = 0.2 * sd;
  const vn = cruiseVel(p, q), v = V * vn, cy = Math.cos(st.yaw), sy = Math.sin(st.yaw);
  // the walk's direction in the body's own frame (it may walk sideways or backwards: the feet step that way)
  const ux = dx / dist, uz = dz / dist, lx = ux * cy - uz * sy, lz = ux * sy + uz * cy;
  // the lean into the walk: with the speed, plus a little back while it sets off and forward while it slows (the stop
  // carries forward); sin humps over the ramps, so even a short shuffle's lean never steps between frames
  const ramp = (u) => Math.sin(Math.PI * clamp(u)), fwd = clamp(0.13 * v + 0.07 * V * (q > 0 ? ramp((p - (1 - q)) / q) - 0.5 * ramp(p / q) : 0), -0.08, 0.16);
  nat.gait = { ph: (dist * s) / L, amt: clamp(vn * 1.6), sd, dir: [lx, lz], v, fwd, bob: a.bob };
  st.walk = nat.gait.ph; st.walkAmt = nat.gait.amt; st.stride = sd; st.gait = nat.gait;
}
// natLead: the body starts a reach. It leans toward the front and the arm's side from about 2 frames before the hand
// moves, the lean peaks a little past the middle of the move and eases off after the hand arrives (a.lead scales it).
function natLead(a, t, d, nat) {
  const k = (typeof a.lead === "number" ? a.lead : 1) * bump(t, a.at - 0.07, a.at + 0.55 * d, a.at + d + 0.35);
  if (!k) return;
  const pose = a.pose, back = pose === "rest" || pose === "hips" || pose === "lap", up = pose === "up" || pose === "hat" || pose === "wave";
  const side = a.side === "L" ? 1 : a.side === "R" ? -1 : 0;
  if (back) { nat.squash -= 0.012 * k; return; }   // an arm coming home: only a small settle
  if (up) { nat.squash += 0.018 * k; nat.lean += side * 0.03 * k; return; }   // reaching up: the body stretches toward it
  nat.pitch += 0.06 * k; nat.lean += side * 0.035 * k; nat.squash -= 0.01 * k;
}
// natApply: the walk's bob (lowest just after each footfall), the weight shift and roll over the standing foot, the lean
// into the walk (more while slowing down, so the stop carries forward; less while setting off), then the reach leans,
// the turn's eyes and dip and the sit's lean
function natApply(st, nat) {
  const g = nat.gait;
  if (g) {
    const A = g.amt, w = 2 * Math.PI, B = (g.bob ?? 0.024 * clamp(g.sd, 0.6, 1.6)) * A;
    // a walk is lowest just after each footfall; a run lowest at mid-stance and highest in the air between steps
    const low = 0.5 + 0.5 * Math.cos(2 * w * (g.ph - (g.run ? 0.18 : 0.08)));
    st.y -= B * low; st.squash *= 1 - 0.025 * A * low;
    const sway = 0.018 * A * Math.cos(w * (g.ph - 0.29)), cy = Math.cos(st.yaw), sy = Math.sin(st.yaw);
    st.x -= sway * cy; st.z += sway * sy;   // the body's own -x is its right: over the right foot while it stands
    st.lean += 0.05 * A * Math.cos(w * (g.ph - 0.29));
    st.pitch = (st.pitch || 0) + g.fwd * g.dir[1]; st.lean -= g.fwd * g.dir[0];
    if (g.tip) { st.pitch += g.tip[1]; st.lean -= g.tip[0]; }   // planted gait: the body tips on with a stop, swings back, settles
  }
  st.pitch = (st.pitch || 0) + nat.pitch; st.lean += nat.lean; st.squash *= 1 + nat.squash;
  if (nat.look) st.look = [st.look[0] + nat.look, st.look[1]];
}

// Planted gait (quality plan item 10; storyboard "motion": { "feet": 2 }, opt-in until Jonny approves it). One gait for
// every move and run, whatever its ease: the body goes where the storyboard says, and the feet step after it. A
// standing foot stays exactly where it touched down; it lifts when the walk's rhythm says so, or, when the body only
// shuffles, turns or leans, as soon as staying would leave it more than 3 cm (or 20°) from where it belongs. Each step
// lands where the foot will be needed half way through its next stance (looked up in the body's own future, so a stop
// brings both feet together under it), steps are as long as the speed needs up to the longest stride (then the
// cadence rises), and a run (a "run", a long stride or a fast move) stands on each foot for only 36 % of the cycle, so
// it spends a moment in the air between steps. The rhythm of the steps also drives the bob, the weight shift over the
// standing foot and the arm swing (natApply, potato.js), and a damped spring tips the body on when it stops and back
// when it sets off. Beats from the walk study (docs/feet-study.md). Like the follow-through spring the plan is made
// once per storyboard and actor, stepped at a fixed rate from t = 0, so a frame never depends on the frame before.
export const feetOn = (sb) => !!(sb && sb.motion && typeof sb.motion === "object" && (sb.motion.feet ?? 0) >= 2);
export const GAIT = {
  dt: 1 / 120, pre: 0.6, hx: 0.13, hz: 0.04,   // the foot's home under the body (potato.js: x ±0.13, z 0.04)
  trig: 0.03, yawTrig: 0.35, settle: 0.012,   // a step when a foot would be 3 cm or 20° off; at home within 1.2 cm
  walkST: 0.58, runST: 0.36, cad: 2.2, runCad: 3, minCad: 1.8, maxCad: 7,   // stance share, cycles a second
  Lmin: 0.08, Lmax: 0.44, runLmax: 0.8, vRun: 1.5, ahead: 0.15, soft: 0.2, reach: 0.3,   // cycle length (metres), the speed a walk becomes a run
  tipHz: 2.4, tipZ: 0.4, tipGain: 3, tipMax: 0.06, leanMax: 0.12,
};
const GPLANS = new WeakMap();
let PLANNING = false;
const angD = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
const smooth = (u) => { u = clamp(u); return u * u * (3 - 2 * u); };
function footHome(s, x, z, yaw, sc) {
  const hx = (s === "R" ? -1 : 1) * GAIT.hx * sc, hz = GAIT.hz * sc, c = Math.cos(yaw), si = Math.sin(yaw);
  return [x + hx * c + hz * si, z - hx * si + hz * c];
}
// the body's path, sampled at GAIT.dt: where the feet stand from (st.plant), whether it is off its feet (in the air,
// sitting, riding, kneeling, a glide), its speed, turn rate and the stop/start spring
function gaitTrack(sb, actor, def) {
  // from PRE seconds before the clip: a body already on its way at t = 0 is extrapolated back, so frame 0 catches it
  // mid-stride instead of with both feet still at the start
  const dt = GAIT.dt, PRE = GAIT.pre, i0 = Math.round(PRE / dt), end = (sb.duration ?? 30) + 0.6, n = Math.ceil((end + PRE) / dt) + 2;
  const K = { n, x: new Float64Array(n), z: new Float64Array(n), y: new Float64Array(n), yaw: new Float64Array(n), sc: new Float64Array(n),
    off: new Uint8Array(n), run: new Uint8Array(n), steps: new Float64Array(n), v: new Float64Array(n), yr: new Float64Array(n),
    dx: new Float64Array(n), dz: new Float64Array(n), tx: new Float64Array(n), tz: new Float64Array(n) };
  PLANNING = true;
  try {
    const s0 = actorState(sb, actor, def, 0, true), s1 = actorState(sb, actor, def, 0.05, true);
    let v0 = [(s1.plant.x - s0.plant.x) / 0.05, (s1.plant.z - s0.plant.z) / 0.05];
    if (Math.hypot(v0[0], v0[1]) > 8 || s0.plant.w > 0.02) v0 = [0, 0];
    for (let i = 0; i < n; i++) {
      const u = (i - i0) * dt, st = actorState(sb, actor, def, Math.max(0, u), true), p = { ...st.plant }, h = st.gaitHint || {};
      if (u < 0) { p.x += v0[0] * u; p.z += v0[1] * u; }
      K.x[i] = p.x; K.z[i] = p.z; K.y[i] = p.y; K.yaw[i] = p.yaw; K.sc[i] = st.scale ?? 1;
      K.off[i] = p.w > 0.5 || (st.tuck || 0) > 0.35 || st.riding || (st.kneel || 0) > 0.5 || h.glide || st.visible === false ? 1 : 0;
      K.run[i] = h.run ? 1 : 0; K.steps[i] = h.steps || 0;
    }
  } finally { PLANNING = false; }
  // per-tick velocity (a jump of over 15 cm in one tick is a re-placement, not a walk), then a ±0.04 s average
  const vx = new Float64Array(n), vz = new Float64Array(n), vy = new Float64Array(n);
  for (let i = 1; i < n; i++) {
    const ddx = K.x[i] - K.x[i - 1], ddz = K.z[i] - K.z[i - 1];
    if (Math.hypot(ddx, ddz) > 0.15) continue;
    vx[i] = ddx / dt; vz[i] = ddz / dt; vy[i] = angD(K.yaw[i], K.yaw[i - 1]) / dt;
  }
  const W = 5;
  let lx = 0, lz = 1;
  for (let i = 0; i < n; i++) {
    let ax = 0, az = 0, ay = 0, m = 0;
    for (let j = Math.max(0, i - W); j <= Math.min(n - 1, i + W); j++) { ax += vx[j]; az += vz[j]; ay += vy[j]; m++; }
    ax /= m; az /= m; ay /= m;
    const v = Math.hypot(ax, az);
    K.v[i] = Math.min(8, v); K.yr[i] = ay;
    if (v > 0.02) { lx = ax / v; lz = az / v; }
    K.dx[i] = lx; K.dz[i] = lz;
  }
  // the tip: a damped spring pushed by the body's acceleration (on with a stop, back with a start), in the world
  const w = 2 * Math.PI * GAIT.tipHz, Z = GAIT.tipZ, X = [0, 0], V = [0, 0];
  for (let i = 0; i < n; i++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1), dd = (i1 - i0) * dt;
    const A = [(K.v[i1] * K.dx[i1] - K.v[i0] * K.dx[i0]) / dd, (K.v[i1] * K.dz[i1] - K.v[i0] * K.dz[i0]) / dd];
    if (K.off[i]) { X[0] = X[1] = V[0] = V[1] = 0; }
    for (let k = 0; k < 2; k++) { V[k] += (-w * w * X[k] - 2 * Z * w * V[k] - A[k]) * dt; X[k] += V[k] * dt; }
    K.tx[i] = X[0]; K.tz[i] = X[1];
  }
  return K;
}
// the step plan: per foot a list of steps { t0, t1 (lift, touch down), p0, p1 ([x, z]), y0, y1 (floor), a0, a1 (yaw),
// h (lift), q (the gait phase at touch down: R whole, L half) } and "off" spans where the feet go with the body
function gaitPlan(sb, actor, def) {
  let per = GPLANS.get(sb); if (!per) { per = new Map(); GPLANS.set(sb, per); }
  let P = per.get(actor.id); if (P) return P;
  const K = gaitTrack(sb, actor, def), n = K.n, dt = GAIT.dt, G = GAIT;
  const PRE = GAIT.pre, at = (arr, u) => { const f = clamp((u + PRE) / dt, 0, n - 1), i = Math.min(n - 2, Math.floor(f)), r = f - i; return arr[i] + (arr[i + 1] - arr[i]) * r; };
  const yawAt = (u) => { const f = clamp((u + PRE) / dt, 0, n - 1), i = Math.min(n - 2, Math.floor(f)), r = f - i; return K.yaw[i] + angD(K.yaw[i + 1], K.yaw[i]) * r; };
  const homeAt = (s, u) => footHome(s, at(K.x, u), at(K.z, u), yawAt(u), at(K.sc, u));
  // the last time from u up to v the body is still on its feet (a look ahead never steps toward a ride or a jump)
  const onUntil = (u, v) => { let j = Math.round((u + PRE) / dt); const J = Math.min(n - 1, Math.round((v + PRE) / dt)); while (j < J && !K.off[j + 1]) j++; return Math.max(u, j * dt - PRE); };
  const ev = { R: [], L: [] }, foot = {}, warn = [];
  for (const s of ["R", "L"]) foot[s] = { p: homeAt(s, -PRE), y: K.y[0], a: K.yaw[0], t1: -PRE - 1 };
  let next = null, nextLift = 0, bout = false, off = false;
  for (let i = 0; i < n; i++) {
    const u = i * dt - PRE, jump = i > 0 && Math.hypot(K.x[i] - K.x[i - 1], K.z[i] - K.z[i - 1]) > 0.15;
    if (K.off[i] || jump) {
      // off its feet (or re-placed): the feet go with the body until it stands again
      for (const s of ["R", "L"]) {
        if (!off) ev[s].push({ off: true, t0: u, t1: u });
        const e = ev[s][ev[s].length - 1]; e.t1 = u + dt; e.p1 = homeAt(s, u + dt); e.y1 = at(K.y, u + dt); e.a1 = yawAt(u + dt);
        foot[s] = { p: e.p1, y: e.y1, a: e.a1, t1: u + dt };
      }
      off = true; bout = false; next = null; continue;
    }
    off = false;
    // the pace: the fastest the body goes over the next quarter second (a dash gets quick steps from its first one)
    let ve = 0, rn = K.run[i];
    for (let j = i; j < Math.min(n, i + 30); j++) { ve = Math.max(ve, K.v[j] + G.hx * K.sc[j] * Math.abs(K.yr[j])); if (j < i + 12) rn = rn || K.run[j]; }
    const sc = K.sc[i], run = rn || ve > G.vRun * sc;
    const ST = run ? G.runST : G.walkST, c0 = K.steps[i] || (run ? G.runCad : G.cad);
    const L = clamp(ve / c0, G.Lmin * sc, (run ? G.runLmax : G.Lmax) * sc), cad = clamp(ve / L, G.minCad, G.maxCad);
    const Tsw = (1 - ST) / cad, Tst = ST / cad;
    // a standing foot left far behind (a move faster than the feet can follow): note it for the checks
    for (const s of ["R", "L"]) if (foot[s].t1 <= u) { const h = homeAt(s, u), e = Math.hypot(h[0] - foot[s].p[0], h[1] - foot[s].p[1]); if (e > G.reach * sc && (!warn.length || u - warn[warn.length - 1].t > 0.3)) warn.push({ t: u, foot: s, m: e }); }
    const swinging = (s) => foot[s].t1 > u + 1e-9;
    let c = null;
    if (bout) {
      if (u >= nextLift - 1e-9 && !swinging(next)) c = next;
      // a standing foot left over 20 cm behind (a dash outrunning the rhythm) scrambles after the body at once
      else for (const s of ["R", "L"]) if (!swinging(s)) { const h = homeAt(s, u); if (Math.hypot(h[0] - foot[s].p[0], h[1] - foot[s].p[1]) > G.soft * sc) c = s; }
    }
    else if (!swinging("R") && !swinging("L")) {
      // still: a foot steps when staying would leave it over 3 cm or 20° from its home a moment from now
      const look = onUntil(u, u + 0.5 * Tsw + 0.12);
      let best = 1;
      for (const s of ["R", "L"]) {
        const h = homeAt(s, look), e = Math.hypot(h[0] - foot[s].p[0], h[1] - foot[s].p[1]), ya = Math.abs(angD(yawAt(look), foot[s].a));
        const score = Math.max(e / (G.trig * sc), ya / G.yawTrig);
        if (score > best) { best = score; c = s; }
      }
    }
    if (!c) continue;
    const o = c === "R" ? "L" : "R", tt = u + Tsw, tm = onUntil(u, tt + 0.5 * Tst);
    // the touch down: where the foot is needed half way through its stance, but never further ahead of where the body
    // will be when it lands than a potato leg reaches (a dash's first step would otherwise land in the splits)
    const p1 = homeAt(c, tm), hl = homeAt(c, Math.min(tt, tm)), ahead = Math.hypot(p1[0] - hl[0], p1[1] - hl[1]), cap = G.ahead * sc;
    if (ahead > cap) { p1[0] = hl[0] + ((p1[0] - hl[0]) * cap) / ahead; p1[1] = hl[1] + ((p1[1] - hl[1]) * cap) / ahead; }
    const a1 = yawAt(tm), e = Math.hypot(p1[0] - foot[c].p[0], p1[1] - foot[c].p[1]), ya = Math.abs(angD(a1, foot[c].a));
    if (bout && e < G.settle * sc && ya < 0.06) {
      // this foot is already where it belongs: one more step for the other one, or the walk is over
      const po = homeAt(o, tm), eo = Math.hypot(po[0] - foot[o].p[0], po[1] - foot[o].p[1]), yo = Math.abs(angD(a1, foot[o].a));
      if (!swinging(o) && (eo > G.settle * sc || yo > 0.06)) { next = o; nextLift = u; } else if (!swinging(o)) bout = false;
      continue;
    }
    // the lift: a walking step about 6.5 cm at a normal stride, a shuffle barely clears the floor, a run lifts high
    const sd = L / (0.2 * sc), h = run ? 0.085 * sc : Math.min(0.065 * sc * Math.min(1.4, Math.max(0.6, sd)), 0.02 * sc + 0.45 * e);
    const y1 = at(K.y, tt);
    ev[c].push({ t0: u, t1: tt, p0: foot[c].p, p1, y0: foot[c].y, y1, a0: foot[c].a, a1, h, run, cad, ST, len: e, sd });
    foot[c] = { p: p1, y: y1, a: a1, t1: tt };
    bout = true; next = o;
    // a walk: the other foot lifts just after this one lands (both stand for a moment); a run: just before (both in the air)
    nextLift = run ? tt + (ST - 0.5) / cad : Math.max(tt, tt + (ST - 0.5) / cad);
  }
  // scripted steps (the move library, quality plan item 16; Jonny approved the sneak trial 5 Nov): a { do: "feet",
  // ev: { R: [{ t0, t1, p1: [x, z], h, a1 }], L } } action (storyboards/lib/moves play()) gives the steps recorded in
  // motion capture. Between its first lift and last touch down the planner's own steps give way; each scripted step
  // starts where the foot stood. Storyboards without one plan exactly as before.
  const FA = (sb.actions || []).find((q) => q.who === actor.id && q.do === "feet");
  if (FA) {
    for (const s of ["R", "L"]) {
      const S = FA.ev[s] || [];
      if (!S.length) continue;
      const a0 = S[0].t0, a1 = Math.max(...["R", "L"].map((q) => (FA.ev[q] || []).at(-1)?.t1 ?? 0));
      const keep = ev[s].filter((e) => e.t1 <= a0 + 1e-9 || e.t0 >= a1 - 1e-9);
      let prev = keep.filter((e) => e.t1 <= a0 + 1e-9).pop();
      let p = prev ? prev.p1 : homeAt(s, -PRE), y = prev ? prev.y1 : K.y[0], ya = prev ? prev.a1 : K.yaw[0];
      const mine = S.map((q) => {
        const p1 = q.p1, e = { t0: q.t0, t1: q.t1, p0: p, p1, y0: y, y1: at(K.y, q.t1), a0: ya, a1: q.a1 ?? yawAt(q.t1), h: q.h, run: false, cad: 0.5 / Math.max(0.1, q.t1 - q.t0), ST: 0.58, len: Math.hypot(p1[0] - p[0], p1[1] - p[1]) };
        e.sd = e.len / (0.2 * at(K.sc, q.t1));
        p = p1; y = e.y1; ya = e.a1;
        return e;
      });
      const after = keep.filter((e) => e.t0 >= a1 - 1e-9);
      if (after[0]) after[0] = { ...after[0], p0: p, y0: y, a0: ya };
      ev[s] = [...keep.filter((e) => e.t1 <= a0 + 1e-9), ...mine, ...after];
    }
  }
  // the gait phase: each touch down gets the next half cycle, R on a whole number and L on a half
  const steps = [...ev.R.map((e) => ({ ...e, s: "R" })), ...ev.L.map((e) => ({ ...e, s: "L" }))].filter((e) => !e.off).sort((a, b) => a.t1 - b.t1);
  let q = -0.5;
  for (const e of steps) { q += 0.5; if ((Math.round(q * 2) % 2 === 0) !== (e.s === "R")) q += 0.5; e.q = q; const src = ev[e.s].find((x) => x.t0 === e.t0 && !x.off); src.q = q; }
  // bouts: runs of steps less than 0.4 s apart (the bob, sway and arm swing ease in before and out after each)
  const bouts = [];
  for (const e of steps) { const b = bouts[bouts.length - 1]; if (b && e.t0 - b.t1 < 0.4) { b.t1 = Math.max(b.t1, e.t1); b.n++; } else bouts.push({ t0: e.t0, t1: e.t1, n: 1 }); e.b = bouts.length - 1; }
  P = { K, ev, steps, bouts, warn, at, yawAt, tune: (typeof sb.motion === "object" && sb.motion.feetTune) || {} };
  per.set(actor.id, P);
  return P;
}
// the gait that natApply and the arm swing read at time t: its phase from the touch downs, how much of it shows (eased
// in and out with each bout of steps, less for a shuffle), the stride, the direction in the body's frame, the lean
function planGait(P, t, yaw) {
  const { K, steps, bouts, at } = P;
  let amt = 0;
  for (const b of bouts) { if (t < b.t0 - 0.12 || t > b.t1 + 0.22) continue; amt = Math.max(amt, Math.min(smooth((t - (b.t0 - 0.12)) / 0.24), 1 - smooth((t - (b.t1 - 0.02)) / 0.24))); }
  const ux = at(K.dx, t), uz = at(K.dz, t), cy = Math.cos(yaw), sy = Math.sin(yaw);
  const tx = at(K.tx, t), tz = at(K.tz, t), tip = [GAIT.tipMax * Math.tanh((GAIT.tipGain * (tx * cy - tz * sy)) / GAIT.tipMax), GAIT.tipMax * Math.tanh((GAIT.tipGain * (tx * sy + tz * cy)) / GAIT.tipMax)];
  if (amt <= 0 && Math.abs(tip[0]) + Math.abs(tip[1]) < 1e-4) return null;
  // the phase: linear between touch downs, carried on at the nearest step's cadence before the first and after the last
  // the phase and the step size: linear between touch downs within a bout; before a bout's first and after its last
  // they carry on at that step's cadence (the switch between bouts falls where nothing shows: amt is 0 there)
  let ph = 0, len = 0.2, cur = steps[0];
  if (steps.length) {
    let k = 0; while (k < steps.length - 1 && steps[k + 1].t1 <= t) k++;
    const a = steps[k], b = steps[k + 1];
    if (t < a.t1) { cur = a; ph = a.q - (a.t1 - t) * a.cad; len = a.len; }
    else if (b && b.b === a.b) { const r = (t - a.t1) / (b.t1 - a.t1); cur = r < 0.5 ? a : b; ph = a.q + r * (b.q - a.q); len = lerp(a.len, b.len, r); }
    else if (b && t > 0.5 * (a.t1 + 0.22 + b.t0 - 0.12)) { cur = b; ph = b.q - (b.t1 - t) * b.cad; len = b.len; }
    else { cur = a; ph = a.q + (t - a.t1) * a.cad; len = a.len; }
  }
  const sd = Math.max(0.3, len / (0.2 * (at(K.sc, t) || 1)));
  amt *= clamp(sd / 0.8, 0.25, 1) * (P.tune.body ?? 1);
  const v = at(K.v, t), T = P.tune;
  tip[0] *= T.tip ?? 1; tip[1] *= T.tip ?? 1;
  return { ph, amt, sd: clamp(sd, 0.5, 2.2), dir: [ux * cy - uz * sy, ux * sy + uz * cy], v, fwd: clamp(0.13 * v, -0.08, GAIT.leanMax) * (T.lean ?? 1), run: !!cur?.run, tip };
}
// where each foot is at time t (potato.js st.feet): standing where it touched down, or on its way along a low arc that
// leaves and lands softly; with the body while it is off its feet. w fades it out in the air, sitting or kneeling.
function planFeet(P, t, st, plant) {
  // the feet tuck up in the air (a hop, a fly, a hover: st.tuck) and go with the body while it sits or kneels
  const sc = st.scale ?? 1, out = {}, w = clamp(1 - (plant.w || 0)) * (1 - clamp(st.kneel || 0)) * (1 - clamp((st.tuck || 0) / 0.5)) * (st.riding ? 0 : 1);
  for (const s of ["R", "L"]) {
    const E = P.ev[s];
    let lo = 0, hi = E.length - 1, k = -1;
    while (lo <= hi) { const m = (lo + hi) >> 1; if (E[m].t0 <= t) { k = m; lo = m + 1; } else hi = m - 1; }
    let x, y, z, yaw, lift = 0;
    const e = E[k];
    if (!e) { const h = footHome(s, P.K.x[0], P.K.z[0], P.K.yaw[0], P.K.sc[0]); [x, z] = h; y = P.K.y[0]; yaw = P.K.yaw[0]; }
    else if (e.off && t < e.t1) { [x, z] = footHome(s, plant.x, plant.z, plant.yaw, sc); y = plant.y; yaw = plant.yaw; }
    else if (!e.off && t < e.t1) {
      const k1 = (t - e.t0) / (e.t1 - e.t0), m = k1 - Math.sin(2 * Math.PI * k1) / (2 * Math.PI);
      x = lerp(e.p0[0], e.p1[0], m); z = lerp(e.p0[1], e.p1[1], m); y = lerp(e.y0, e.y1, m); yaw = e.a0 + angD(e.a1, e.a0) * m;
      lift = e.h * Math.sin(Math.PI * k1);
    } else { [x, z] = e.p1; y = e.y1; yaw = e.a1; }
    out[s] = { x, y: y + 0.035 * sc + lift, z, yaw, w };
  }
  return out;
}
// the touch downs of the planted gait (engine/audio.mjs puts a footstep on each): time, foot, step length, run
export function footfalls(sb, actor, def = {}) {
  return gaitPlan(sb, actor, def).steps.filter((e) => e.t1 >= 0).map((e) => ({ at: e.t1, foot: e.s, len: e.len, run: e.run }));
}
// what each foot is doing at story time t under the planted gait: "stand" (still on the floor), "step" (on its way
// to a new spot, however low it lifts) or "free" (going with the body: in the air, sitting, riding, a glide); null
// when the storyboard doesn't use it. For the checks (qa/rig.mjs foot-slide: a "step" is not a slide)
export function footPhase(sb, actor, t, def = {}) {
  if (!feetOn(sb)) return null;
  const P = gaitPlan(sb, actor, def), out = {};
  for (const s of ["R", "L"]) {
    const E = P.ev[s];
    let k = -1; for (let i = 0; i < E.length && E[i].t0 <= t; i++) k = i;
    const e = E[k];
    out[s] = !e || t >= e.t1 ? (e?.off && t < e.t1 + 1e-9 ? "free" : "stand") : e.off ? "free" : "step";
  }
  return out;
}
// a standing foot left more than 30 cm from its body (a move faster than the longest stride): [{ t, foot, m }]
export function gaitWarnings(sb, actor, def = {}) { return gaitPlan(sb, actor, def).warn; }

export function actorState(sb, actor, def, t, raw = false) {
  const c = actor, LD = loopLen(sb);   // LD: the loop length when loop-safe idle is on, else 0 (util.js)
  const st = {
    x: c.at[0], z: c.at[1], y: c.y ?? 0, yaw: yawOf(c.face ?? "camera"), lean: 0, pitch: 0, wings: 0, flap: 0, squash: 1, span: c.span ?? 1,
    // the character's designed neutral face (face.neutral in its file) sits on top of its default expression; an
    // explicit c.expr or an "expr" action is acting and replaces it
    expr: { ...(EXPRESSIONS[c.expr || (def.face && def.face.default) || "kind"] || EXPRESSIONS.kind), ...(c.expr ? {} : neutralExpr(def)) },
    look: [0, 0], blink: 0, talk: 0, round: 0,
    arms: { R: { from: c.arms?.R || def?.arms?.R || "rest", pose: c.arms?.R || def?.arms?.R || "rest", p: 1 }, L: { from: c.arms?.L || def?.arms?.L || "rest", pose: c.arms?.L || def?.arms?.L || "rest", p: 1 } },
    walk: 0, walkAmt: 0, tuck: 0, droop: 0, charge: 0, form: "potato", friesPop: 1, flip: 0, skin: 0, skinColor: null,
    hatOff: [0, 0, 0], hatSpin: [0, 0, 0], hatOn: true, visible: true, scale: c.scale ?? def?.scale ?? 1,   // def.scale: a character built at its own size (Pebble)
    face: Object.fromEntries(FACE_KEYS.map((k) => [k, def.face?.neutral?.[k] ?? 0])),
    grip: { R: { ...(GRIPS[c.grip?.R || def.hands?.grip?.R] || GRIPS.open) }, L: { ...(GRIPS[c.grip?.L || def.hands?.grip?.L] || GRIPS.open) } },
    hatTip: [0, 0], hatBrim: 0,
  };
  let autoBlink = true, airSince = null, riding = null, unsit = null;   // airSince: when the last fly or hover ended (it then hovers until a drop)
  let idle = 1, sink = 0, shakeDx = 0;   // a "still" turns the idle breathing and sway down (see below the loop)
  // natural motion (util.js naturalOf; null when the storyboard doesn't ask for it): what the walk, reaches, turns and
  // sitting add on top of the pose, applied below the loop (after the feet are planted, so they stay on the floor)
  const N = naturalOf(sb), nat = { gait: null, pitch: 0, lean: 0, squash: 0, look: 0 };
  const acts = (sb.actions || []).filter((a) => a.who === c.id && a.at <= t).sort((a, b) => a.at - b.at);
  for (const a of acts) {
    const d = a.dur ?? 0.3, p = prog(t, a.at, d), e = ease(a.ease || "inOut")(p);
    switch (a.do) {
      case "move": {
        // the planted gait reads the step rate, the stride and whether it's a glide (steps: 0) from the action
        if (p < 1) st.gaitHint = { steps: a.steps, run: (a.stride ?? 1) >= 1.7, glide: a.steps === 0 };
        if (N?.gait && (!a.ease || a.ease === "inOut")) { natMove(st, a, t, d, nat); break; }
        st.x = lerp(st.x, a.to[0], e); st.z = lerp(st.z, a.to[1], e); if (a.y != null) st.y = lerp(st.y, a.y, e);   // y: the height it ends at (a sloping street)
        // stride: how long and high the steps are (1 a walk; about 2 a run), bob: metres the body rises between footfalls
        if (p < 1) { st.walkAmt = Math.min(1, Math.min(p, 1 - p) * 8); st.walk = (t - a.at) * (a.steps ?? 2.2); st.stride = a.stride ?? 1; if (a.bob) st.y += a.bob * st.walkAmt * Math.abs(Math.sin(st.walk * Math.PI * 2)); }
        break;
      }
      // a run along a path with its own speed: pts [[t, x, z], ...] (times from the action's start; the body goes
      // straight from point to point, so give them densely for a smooth speed change), rate [[t, steps a second], ...]
      // (the footfalls follow it: a slow-motion stretch gets slow, long steps), stride (1 a walk, about 2 a run) and bob
      // (metres the body rises between footfalls). One action for the whole run, so the legs never stop between parts
      // (Don't Let Dragon Light the Pumpkin: a run that slows into slow motion and speeds up again)
      case "run": {
        const T = t - a.at, P = a.pts, n = P.length, end = P[n - 1][0];
        let k = 0; while (k < n - 2 && P[k + 1][0] <= T) k++;
        const q = clamp((T - P[k][0]) / Math.max(1e-6, P[k + 1][0] - P[k][0]));
        st.x = lerp(P[k][1], P[k + 1][1], q); st.z = lerp(P[k][2], P[k + 1][2], q);
        if (T < end) {
          // the footfall phase: the step rate integrated over time (linear between the rate keys)
          const R = a.rate || [[0, a.steps ?? 3]];
          let ph = 0;
          for (let i = 0; i < R.length && T > R[i][0]; i++) {
            const t0 = R[i][0], last = i + 1 >= R.length, t1 = last ? T : R[i + 1][0], u = Math.min(T, t1) - t0;
            ph += u * R[i][1] + (last ? 0 : ((R[i + 1][1] - R[i][1]) * u * u) / (2 * (t1 - t0)));
          }
          st.walk = ph; st.walkAmt = clamp(Math.min(T, end - T) / 0.15); st.stride = a.stride ?? 2;
          let j = 0; while (j < R.length - 1 && R[j + 1][0] <= T) j++;
          const rt = j < R.length - 1 ? lerp(R[j][1], R[j + 1][1], clamp((T - R[j][0]) / (R[j + 1][0] - R[j][0]))) : R[j][1];
          st.gaitHint = { steps: rt, run: (a.stride ?? 2) >= 1.7 };
          if (a.bob) st.y += a.bob * st.walkAmt * Math.abs(Math.sin(ph * Math.PI * 2));
        }
        break;
      }
      case "hop": {
        const n = a.count ?? 1, h = a.height ?? 0.3, local = clamp((t - a.at) / d) * n, k = Math.min(n - 1, Math.floor(local)), q = local - k;
        // anticipation: the body crouches on the ground first (at least 0.1 s, shallower when it is shorter than
        // 0.2 s), then takes off and lands at the hop's end. The crouch, the stretch in the air and the landing squash
        // are sin² curves that start and end at rest, so they join without a kink and no frame steps out, wherever
        // the frames fall
        const qa = hopCrouch(d, n), dip = 0.14 * Math.min(1, (qa * d) / n / 0.2);
        if (p < 1) {
          const air = q < qa ? 0 : (q - qa) / (1 - qa);
          st.y += h * 4 * air * (1 - air);
          st.squash *= q < qa ? 1 - dip * Math.sin((q / qa) * Math.PI) ** 2 : 1 + 0.1 * Math.sin(air * Math.PI) ** 2;
          st.tuck = Math.sin(air * Math.PI);
        } else {
          const after = t - (a.at + d);
          if (after < 0.2) st.squash *= 1 - 0.18 * Math.sin((after / 0.2) * Math.PI) ** 2;
        }
        break;
      }
      case "turn": {
        // the short way round (back to left is a quarter turn, not three quarters)
        let to = yawOf(a.to);
        while (to - st.yaw > Math.PI + 0.01) to -= 2 * Math.PI;
        while (to - st.yaw < -Math.PI - 0.01) to += 2 * Math.PI;
        // natural turn: the eyes go first (about 0.12 s ahead), the body dips a little on the way round and swings
        // about 4 % past the end before it settles (with a 4 % wind-up the other way first)
        if (N?.turn && (!a.ease || a.ease === "inOut") && Math.abs(to - st.yaw) > 0.35) {
          const big = clamp(Math.abs(to - st.yaw) / 1.2);
          nat.look += Math.sign(to - st.yaw) * 0.55 * big * bump(t, a.at - 0.12, a.at + 0.25 * d, a.at + d + 0.1);
          nat.squash -= 0.022 * big * (p < 1 ? Math.sin(Math.PI * p) : 0);
          st.yaw = lerp(st.yaw, to, ease("anticSettle")(p)); break;
        }
        st.yaw = lerp(st.yaw, to, e); break;
      }
      case "lean": st.lean = lerp(st.lean, ((a.to ?? 0) * Math.PI) / 180, e); break;
      // tip forward (+) or back about the body's middle; 360 is a flip (see the pivot below the loop)
      case "pitch": st.flip = lerp(st.flip, ((a.to ?? 0) * Math.PI) / 180, e); break;
      // set: change only some of the face's numbers (face.js), e.g. one brow up ({ raise }) or the mouth tightening
      // ({ curve, smirk }), on top of the named expression or of the face as it is
      case "expr": st.expr = blendExpr(st.expr, a.set ? { ...(EXPRESSIONS[a.expr] || st.expr), ...a.set } : EXPRESSIONS[a.expr] || st.expr, ease("out")(prog(t, a.at, a.dur ?? 0.15))); break;
      case "look": {
        // a big change of attention starts with a blink (a.blink: false turns it off)
        if (a.blink !== false && Math.hypot(a.to[0] - st.look[0], a.to[1] - st.look[1]) > 0.6) st.blink = Math.max(st.blink, blinkAt(t - a.at));
        const g = lookProgress(sb, a, t, e, st.look);   // a saccade with "rig": { "eyes": 2 } (face.js)
        st.look = [lerp(st.look[0], a.to[0], g), lerp(st.look[1], a.to[1], g)]; break;
      }
      case "talk": {
        // mouth follows the real speech's phonemes (engine/shared/visemes.js), or the same syllables the gibberish
        // synth speaks (engine/shared/syllables.js)
        if (t < a.at + (a.dur ?? 1)) {
          const m = a.speech ? speechMouthAt(a.speech.mouth, t - a.at) : mouthAt(planFor(a, typeof def.voice === "object" ? def.voice : {}), t);
          if (m.open * (a.amp ?? 1) > st.talk) { st.talk = m.open * 0.75 * (a.amp ?? 1); st.round = m.round; }
        }
        break;
      }
      case "arm": {
        // "rest" is the character's own resting pose when it has one (the Wizard's hand on his staff)
        const own = (s) => (a.pose === "rest" ? c.arms?.[s] || def?.arms?.[s] || "rest" : a.pose);
        for (const s of a.side === "both" ? ["R", "L"] : [a.side || "R"]) st.arms[s] = { from: armNow(st.arms[s]), pose: own(s), p: e };
        if (N?.lead && a.lead !== false && d >= 0.2) natLead(a, t, d, nat);
        break;
      }
      case "blink": if (p < 1) st.blink = a.dur ? Math.sin(p * Math.PI) : blinkAt(t - a.at); break;
      case "noblink": autoBlink = false; break;
      // purposeful stillness: idle breathing and sway fade down to `idle` (default 0.25, 0 = dead still) and back up
      // over `fade` s at either end, while the body sinks a little (`sink`) so the hold doesn't read as frozen;
      // blink: false also holds the automatic blinks
      case "still": {
        const f = a.fade ?? 0.15, dd = a.dur ?? 1, k = clamp((t - a.at) / f) * (1 - clamp((t - a.at - dd) / f));
        idle = Math.min(idle, lerp(1, a.idle ?? 0.25, k));
        sink = Math.max(sink, (a.sink ?? 0.008) * k * clamp((t - a.at) / dd));
        break;
      }
      case "charge": st.charge = lerp(st.charge, a.to ?? 1, e); break;
      // { do: "skin", color: "#8fa07a", to: 1, dur } fades the potato skin (body and eyelids) toward color: the zombie
      // turn in Then I'm a Zombie Too (stage.js skinTint); to: 0 fades it back
      case "skin": st.skinColor = a.color ?? st.skinColor; st.skin = lerp(st.skin, a.to ?? 1, e); break;
      case "droop": st.droop = lerp(st.droop, a.to ?? 1, e); break;
      case "swap": st.form = a.form || "fries"; st.friesPop = ease("back")(p); break;
      // { do: "hat", off, spin } tips or lifts the hat; on: false hides it (a costume pulled over it, the sheet ghost)
      case "hat": {
        if (a.on != null) st.hatOn = a.on;
        st.hatOff = lerp3(st.hatOff, a.off || [0, 0, 0], e);
        st.hatSpin = lerp3(st.hatSpin, (a.spin || [0, 0, 0]).map((x) => (x * Math.PI) / 180), e);
        break;
      }
      // { do: "face", lidL, lidR, browL, browR, tiltL, tiltR, cornerL, cornerR, press, tearL, tearR } (or lid, brow, tilt, corner, tear for
      // both sides): blends the given controls to the given values; the ones left out keep theirs
      case "face": {
        for (const k of FACE_KEYS) if (a[k] != null) st.face[k] = lerp(st.face[k], a[k], e);
        for (const k in FACE_BOTH) if (a[k] != null) for (const kk of FACE_BOTH[k]) st.face[kk] = lerp(st.face[kk], a[k], e);
        break;
      }
      // { do: "straw", hand: 0..1, side: "R" | "L", away: 0 | 1 } (Pebble's grass straw, costumes-pebble.js): hand 0 in the
      // lips at the mouth corner, 1 pinched in that hand, eased between over dur (a continuous hand-off, never a pop);
      // away 1 puts it out of sight (only while it is off screen or tucked away)
      case "straw": {
        const o = st.straw || { hand: 0, away: 0, side: "R" };
        st.straw = { hand: a.hand != null ? lerp(o.hand, a.hand, e) : o.hand, away: a.away != null ? (e >= 1 ? a.away : o.away) : o.away, side: a.side || o.side };
        break;
      }
      // { do: "grip", side: "R" | "L" | "both", shape: "open" | "hold" | "fist" | "pinch" | "point" } (mitten hands)
      case "grip": {
        for (const s of a.side === "both" ? ["R", "L"] : [a.side || "R"]) st.grip[s] = { ...blendGrip(st.grip[s], { ...(GRIPS[a.shape] || GRIPS.hold), ...(a.set || {}) }, e), since: a.at + (a.dur ?? 0.3) };
        break;
      }
      // the Wizard hat's secondary motion: tip: [forward, sideways] in degrees bends the top of the cone, brim tips the brim
      // (+ front up); "hatwobble" adds a decaying wobble (amount in degrees, freq in Hz) over its dur
      case "hatsway": {
        const tip = (a.tip || [0, 0]).map((x) => (x * Math.PI) / 180);
        st.hatTip = [lerp(st.hatTip[0], tip[0], e), lerp(st.hatTip[1], tip[1], e)]; st.hatBrim = lerp(st.hatBrim, a.brim ?? 0, e);
        break;
      }
      case "hatwobble": {
        if (p < 1) {
          const u = t - a.at, k = (1 - p) ** 2 * clamp(u / 0.06), w = ((a.amount ?? 8) * Math.PI / 180) * Math.sin(u * 6.283 * (a.freq ?? 3)) * k;
          st.hatTip = [st.hatTip[0] + 0.5 * w, st.hatTip[1] + w]; st.hatBrim += 0.6 * w;
        }
        break;
      }
      case "grow": st.scale = lerp(st.scale, a.to ?? 1, e); break;
      case "hide": st.visible = false; break;
      // first person (The Easy Trail): the camera rides inside this character's head, so the body, face and hat are not
      // drawn; the arms, hands and legs still are (the rider's gloves on the handlebar). { do: "pov", on: false } ends it
      case "pov": st.pov = a.on !== false; st.hatOn = !st.pov; break;
      case "show": st.visible = true; break;
      case "squash": if (p < 1) st.squash *= 1 - (a.amount ?? 0.2) * Math.sin(p * Math.PI); break;
      // Phoenix: 0 folded, 1 spread. side "R" | "L": only that wing, as an offset on top of both (-1 tucks it in, so one
      // wing can hang while the other is up)
      case "wings": if (a.side) { st.wingSide = { R: 0, L: 0, ...st.wingSide }; st.wingSide[a.side] = lerp(st.wingSide[a.side], a.to ?? 0, e); } else st.wings = lerp(st.wings, a.to ?? 1, e); break;
      // homemade cardboard wings (costume.cardWings, costumes-card.js): set { raise, fold, crook, flutter } on side
      // "R", "L" or "both"
      case "card": {
        st.card = st.card || { R: { ...CARD_REST }, L: { ...CARD_REST } };
        for (const s of a.side === "R" || a.side === "L" ? [a.side] : ["R", "L"]) {
          const w = { ...st.card[s] };
          for (const [k, v] of Object.entries(a.set || {})) w[k] = lerp(w[k] ?? 0, v, e);
          st.card = { ...st.card, [s]: w };
        }
        break;
      }
      // Phoenix: how far the wings may open at all, 0 tucked tight against the back .. 1 the model's own (half open at
      // rest, spread in flight). It caps what "wings", "fly" and the hover do (a half-open beat in a tight spot)
      case "span": st.span = lerp(st.span, a.to ?? 1, e); break;
      // a squat (to 0..1): the body drops and squashes a little while the feet stay planted on the floor, so the legs
      // bend; for a low reach (gripping a stool's rim) without kneeling
      case "crouch": st.crouch = lerp(st.crouch || 0, a.to ?? 1, e); break;
      // an impatient toe tap: the heel stays down and the toe of one foot (side, default R) lifts and slaps down `count`
      // times, one every `every` s (people tap 2 to 3 a second); each slap lands 60 % into its cycle (TAP_AT), where the
      // foley puts a soft footstep, and the body gives a tiny bob on it
      case "tap": {
        const n = a.count ?? 3, ev = a.every ?? 0.3, u = (t - a.at) / ev;
        if (u < n) {
          const w = u % 1, s = a.side === "L" ? "L" : "R";
          const up = w < 0.45 ? Math.sin((Math.PI / 2) * (w / 0.45)) : w < TAP_AT ? Math.cos((Math.PI / 2) * ((w - 0.45) / (TAP_AT - 0.45))) : 0;
          st.tap = { ...st.tap, [s]: Math.max(st.tap?.[s] || 0, up * (a.lift ?? 1)) };
          if (w >= TAP_AT) st.squash *= 1 - 0.008 * Math.sin(Math.PI * Math.min(1, (w - TAP_AT) / 0.3));
        }
        break;
      }
      // flying (Phoenix's wings flap; anyone else just floats): fly to { x, y }, hover in place, drop like a stone
      case "fly": {
        // already hovering (a fly after a fly): start from where the bob had it and from the wing beat it had
        const hov = airSince != null ? a.at - airSince : null;
        if (hov != null) st.y += hoverBob(hov, LD);
        const to = a.to || {}, k = ease(a.ease || "inOut")(p), dir = Math.sign((to.x ?? st.x) - st.x);
        st.x = lerp(st.x, to.x ?? st.x, k); st.y = lerp(st.y, to.y ?? st.y, k); st.z = lerp(st.z, to.z ?? st.z, k);
        // wings, wing beat and tucked feet ease in over a few frames (a step from one frame to the next reads as a glitch)
        const k0 = clamp((t - a.at) / 0.15);
        st.wings = Math.max(st.wings, Math.min(1, (t - a.at) / 0.12)); st.tuck = Math.max(st.tuck, 0.7 * k0);
        if (p < 1) { st.flap = Math.max(st.flap, lerp(hov != null ? hoverFlap(hov) : 0, 1, k0)); st.lean += -0.12 * Math.sin(Math.PI * p) * dir; airSince = null; } else airSince = a.at + d;
        break;
      }
      case "hover": {
        const k0 = clamp((t - a.at) / 0.15);
        st.wings = Math.max(st.wings, Math.min(1, (t - a.at) / 0.12)); st.flap = Math.max(st.flap, 0.6 * k0); st.tuck = Math.max(st.tuck, 0.7 * k0); airSince = airSince ?? a.at; break;
      }
      case "drop": {
        // it starts from where the hover bob had it, with the wing beat it had, and both fade out over 0.12 s
        const bob0 = airSince != null ? hoverBob(a.at - airSince, LD) : 0, f0 = airSince != null ? hoverFlap(a.at - airSince) : st.flap;
        const y0 = st.y + bob0, to = a.to ?? 0, k = clamp((t - a.at) / d), out = 1 - clamp((t - a.at) / 0.12);
        airSince = null; st.flap = f0 * out;
        st.y = lerp(y0, to, k * k);   // speeds up like a falling stone
        st.wings = st.wings * (1 - clamp((t - a.at) / 0.15));
        st.tuck = p < 1 ? lerp(st.tuck, 0.4, clamp((t - a.at) / 0.1)) : 0.4 * (1 - clamp((t - a.at - d) / 0.12));   // eases into the tuck (it used to snap from 0)
        if (p < 1) st.squash *= 1 + 0.08 * k; else { const after = t - (a.at + d); if (after < 0.22) st.squash *= 1 - 0.28 * Math.sin((after / 0.22) * Math.PI); }
        break;
      }
      // a gentle landing from a hover (onto a seat, or the floor at to: 0): it sinks from where the bob had it to y `to`
      // with the wings still beating softly, touches down, and only then folds the wings; a small settle at the end
      case "land": {
        const bob0 = airSince != null ? hoverBob(a.at - airSince, LD) : 0, f0 = airSince != null ? hoverFlap(a.at - airSince) : st.flap;
        const y0 = st.y + bob0, k = ease("inOut")(p), after = t - (a.at + d);
        airSince = null;
        st.y = lerp(y0, a.to ?? 0, k);
        st.flap = f0 * (1 - clamp((t - a.at - 0.6 * d) / (0.4 * d + 0.1)));
        st.wings = Math.max(st.wings, 1) * (1 - ease("inOut")(clamp(after / (a.fold ?? 0.45))));
        st.tuck = lerp(st.tuck, 0, ease("inOut")(clamp((t - a.at) / (d + 0.2))));
        if (after > 0 && after < 0.25) st.squash *= 1 - 0.04 * Math.sin((after / 0.25) * Math.PI);
        break;
      }
      // climbing hand over hand (a tree): to { y, x?, z? } in `steps` pulls (default 4), arms reaching up in turn; it
      // stays up there (no hover) until the next climb or a drop
      case "climb": {
        const to = a.to || {}, n = a.steps ?? 4, local = Math.min(p, 0.9999) * n, j = Math.floor(local), q = local - j;
        const k = p >= 1 ? 1 : (j + ease("inOut")(q)) / n;
        // from a hover it starts at the bob's height and the wing beat fades out (as a drop does)
        const bob0 = airSince != null ? hoverBob(a.at - airSince, LD) : 0, f0 = airSince != null ? hoverFlap(a.at - airSince) : st.flap;
        st.x = lerp(st.x, to.x ?? st.x, k); st.y = lerp(st.y + bob0, to.y ?? st.y, k); st.z = lerp(st.z, to.z ?? st.z, k);
        airSince = null; st.flap = f0 * (1 - clamp((t - a.at) / 0.12));
        if (p < 1) {
          const [up, dn] = j % 2 ? ["L", "R"] : ["R", "L"];
          st.arms[up] = { from: "hold", pose: "up", p: Math.sin(q * Math.PI * 0.5) };
          st.arms[dn] = { from: "up", pose: "hold", p: Math.sin(q * Math.PI * 0.5) };
          st.squash *= 1 - 0.05 * Math.sin(q * Math.PI);
        } else {   // keep the last pull's arms (one up, one holding) so the next "arm" tweens from there
          const [up, dn] = (n - 1) % 2 ? ["L", "R"] : ["R", "L"];
          st.arms[up] = { from: "up", pose: "up", p: 1 }; st.arms[dn] = { from: "hold", pose: "hold", p: 1 };
        }
        break;
      }
      // sitting on a chair prop (seat: its id) until "stand"; hands: lap, table, hold (the right hand holds) or keep.
      // height: the seat's top in metres when it isn't a chair's SEAT_Y (a low log); the body's bottom lands on it whatever
      // the legs' length (def.legs.height, the core build; the potatoes' LEG_H as before)
      case "sit": {
        const ch = (sb.props || []).find((q) => q.id === a.seat) || { x: st.x, z: st.z, rot: a.rot ?? 0, scale: 1 };   // rot: the facing of a sit on the ground (no seat)
        const k = ease("inOut")(prog(t, a.at, a.dur ?? 0.35)), sc = ch.scale ?? 1, yaw = ((ch.rot ?? 0) * Math.PI) / 180;
        // natural: the body tips forward over the feet while it lowers, then bounces once on the seat
        if (N?.sit) { const D = a.dur ?? 0.35, after = t - a.at - D; nat.pitch += 0.12 * Math.sin(Math.PI * k); if (after > 0 && after < 0.32) nat.squash -= 0.035 * Math.sin(Math.PI * after / 0.32) * (1 - after / 0.32); }
        const along = (a.along ?? 0) * sc;   // along the seat (its own x), e.g. at one end of a bench
        st.x = lerp(st.x, ch.x + Math.cos(yaw) * along + Math.sin(yaw) * 0.03, k); st.z = lerp(st.z, ch.z - Math.sin(yaw) * along + Math.cos(yaw) * 0.03, k);
        st.y = lerp(st.y, (ch.y ?? 0) + (a.height ?? SEAT_Y * sc) - ((def?.legs?.height ?? LEG_H) - 0.02) * (def?.build === "core" ? (st.scale ?? 1) : 1), k) + 0.08 * Math.sin(Math.PI * k); st.yaw = lerp(st.yaw, yaw, k); st.sit = k; st.seat = a.seat; if (a.feet) st.sitFeet = a.feet;
        const hands = a.hands || "lap", pose = { R: hands === "hold" ? "hold" : hands, L: hands === "hold" ? "lap" : hands };
        if (hands !== "keep") for (const s of ["R", "L"]) st.arms[s] = { from: armNow(st.arms[s]), pose: pose[s], p: k };   // "keep": the arms stay as they are
        break;
      }
      case "stand": {
        // natural: the body swings forward first to bring its weight over the feet (in a real chair rise the forward swing
        // takes about the first quarter), and only then rises
        const k = N?.sit ? ease("inOut")(clamp((p - 0.22) / 0.78)) : e;
        if (N?.sit) nat.pitch += 0.2 * bump(t, a.at, a.at + 0.35 * d, a.at + d + 0.08);
        st.y = lerp(st.y, 0, k) + 0.06 * Math.sin(Math.PI * k); st.sit = (st.sit || 0) * (1 - k); st.z = lerp(st.z, st.z + 0.12, k);
        for (const s of ["R", "L"]) st.arms[s] = { from: armNow(st.arms[s]), pose: c.arms?.[s] || def?.arms?.[s] || "rest", p: k };
        break;
      }
      // a single-hand grab lifts that arm to hold, or to its own pose; pose: null leaves the arm where it is (the hand
      // closes on the prop where it stands, and a later arm action lifts it). Both hands: use holdout or offer.
      // hand "tip": the prop hangs from the point of the character's own prop (Reaper's scythe); "hat": it sticks to
      // the hat (use keep: true); the arms stay as they are
      case "grab": if ((a.hand === "R" || a.hand === "L") && a.pose !== null) st.arms[a.hand] = { from: armNow(st.arms[a.hand]), pose: a.pose ?? "hold", p: ease("out")(prog(t, a.at, a.dur ?? 0.25)) }; break;
      case "release": break;
      // the held prop's angle in degrees, [forward, outward], instead of the one the arm pose gives; to: null hands it back
      case "tilt": st.propTilt = { from: st.propTilt || null, to: a.to ? a.to.map((d) => (d * Math.PI) / 180) : null, k: e }; break;
      // riding a prop (a car, a bike, a cart, a bus roof): from here on x / y / z / yaw follow the prop, at `off`
      // [x, y, z] in the prop's own frame and `yaw` degrees from its heading, eased in over dur; actions after it
      // (hops, turns) still add on top. { do: "ride", prop: null } gets off where the prop has carried it.
      case "ride": {
        if (riding) { const T = rideAt(sb, riding.a, a.at); [st.x, st.y, st.z, st.yaw] = [T.x, T.y + (st.y - riding.from.y), T.z, T.yaw]; if (riding.a.sit) unsit = a.at; riding = null; }
        if (a.prop) riding = { a, from: { x: st.x, y: st.y, z: st.z, yaw: st.yaw } };
        break;
      }
      default: if (isDance(a.do)) { const x0 = st.x; applyDance(sb, a, t, st); if (a.do === "shake") shakeDx += st.x - x0; }   // dance.js: moves on the music's beat
    }
  }
  // getting off a seat: the sitting pose eases out over 0.25 s instead of snapping to standing
  if (unsit != null && !(riding && riding.a.sit)) st.sit = Math.max(st.sit || 0, 1 - ease("inOut")(prog(t, unsit, 0.25)));
  if (riding) {
    const { a, from } = riding, T = rideAt(sb, a, t), k = ease(a.ease || "inOut")(prog(t, a.at, a.dur ?? 0.3));
    st.x = lerp(from.x, T.x, k) + (st.x - from.x); st.y = lerp(from.y, T.y, k) + (st.y - from.y); st.z = lerp(from.z, T.z, k) + (st.z - from.z);
    st.yaw = lerp(from.yaw, T.yaw, k) + (st.yaw - from.yaw); st.lean += T.lean * k;
    if (a.sit) st.sit = Math.max(st.sit || 0, k);
  }
  // planted feet: the feet stay where the last step left them (a move, a turn, a dance step). What the body does on
  // top of that (pitch, lean, the follow below, a shake, breathing) doesn't slide them. potato.js draws them there.
  const plant = { x: st.x - shakeDx, y: st.y - 0.1 * (st.kneel || 0), z: st.z, yaw: st.yaw };
  if (st.crouch) { st.y -= 0.09 * st.crouch; st.squash *= 1 - 0.04 * st.crouch; }   // after the plant: the feet stay down
  st.riding = !!riding;
  // the planted gait (motion.feet 2): the footfalls, bob, sway and lean come from the step plan, for every move and run
  const F2 = feetOn(sb) && !PLANNING ? gaitPlan(sb, c, def) : null;
  if (F2) { nat.gait = planGait(F2, t, st.yaw); st.gait = nat.gait; if (nat.gait) { st.walk = nat.gait.ph; st.walkAmt = nat.gait.amt; st.stride = nat.gait.sd; } }
  if (N || F2) natApply(st, nat);   // after the plant too: the walk's bob and weight shift move the body, not the feet
  if (N?.arcs) st.arcs = true;   // potato.js arcLerp
  // still in the air after a fly: hover with a gentle bob that fades in, wings beating slower
  if (airSince != null && st.y > 0.01) {
    st.y += hoverBob(t - airSince, LD); st.wings = Math.max(st.wings, 1); st.flap = Math.max(st.flap, hoverFlap(t - airSince)); st.tuck = Math.max(st.tuck, 0.7);
  }
  // the body follows the eyes (cast "follow", 0..1): it turns and tips toward where they look, by about a fifth of
  // the look, averaged over the last 0.3 s so it trails the eyes by a few frames and arrives softly
  if (c.follow) {
    const looks = acts.filter((a) => a.do === "look");
    let lx = 0, ly = 0;
    for (let i = 0; i < 6; i++) { const l = lookAt(looks, t - 0.05 - i * 0.05); lx += l[0] / 6; ly += l[1] / 6; }
    st.yaw += c.follow * 0.14 * lx; st.flip -= c.follow * 0.12 * ly;
  }
  // a pitch action turns the body about its middle, not its feet, so a flip in the air doesn't swing the head down
  // through whatever the character is jumping over (dance tips, like a nod, stay on the feet)
  if (st.flip) {
    const c = 0.5 * (st.scale ?? 1), f = c * Math.sin(st.flip);
    st.y += c * (1 - Math.cos(st.flip)); st.x -= f * Math.sin(st.yaw); st.z -= f * Math.cos(st.yaw);
    st.pitch += st.flip;
  }
  // in the air, sitting, or tipped far over (a flip) the feet go with the body instead, blended so nothing pops
  plant.w = Math.max(clamp(plant.y / 0.03), st.sit || 0, clamp((Math.abs(st.flip) - 0.5) / 0.3));
  st.plant = plant;
  if (F2) st.feet = planFeet(F2, t, st, plant);
  // idle life: breathing, a little sway, automatic blinks. With loop-safe idle each rhythm turns a whole number of
  // times over the clip (breathing about 0.8 Hz, the blink period about 2.6-3.8 s), so the loop closes exactly.
  const seed = c.seed ?? c.id.length * 3.1;
  st.squash *= (1 + 0.012 * idle * Math.sin(LD ? t * loopRad(2 * Math.PI * 0.8, LD) + seed : t * 6.283 * 0.8 + seed)) * (1 - sink);
  st.lean += 0.012 * idle * wobble(t, seed, 0.35, LD);
  if (autoBlink && st.blink === 0) {
    const r = rng(Math.floor(seed * 1000)), p0 = 2.6 + r() * 1.2, period = LD ? LD / Math.max(1, Math.round(LD / p0)) : p0, off = r() * period, ph = (t + off) % period;
    if (blinkFree(sb, c.id, t - ph)) st.blink = blinkAt(ph);
  }
  if (!raw) {
    Object.assign(st, phases(sb, actor, def, t)); st.ft = followThrough(sb, actor, def, t);
    // natural jiggle: when the body stops or lands, the follow-through spring overshoots and the body squashes with it
    if (N?.jiggle) st.squash *= 1 - 0.16 * st.ft.u;
    resolveArms(sb, st, def, t);
  }
  return st;
}

// an automatic blink starting at tb is skipped, whole, when it would land on a key beat: inside a still hold
// (unless it says blink: true), or on an expression change or a look (an eye-blink there kills the moment)
function blinkFree(sb, id, tb) {
  for (const a of sb.actions || []) {
    if (a.who !== id) continue;
    if (a.do === "still" && a.blink !== true && tb + 0.13 > a.at && tb < a.at + (a.dur ?? 1) + (a.fade ?? 0.15)) return false;
    if (a.do === "expr" && tb > a.at - 0.3 && tb < a.at + 0.25) return false;
    if (a.do === "look" && tb > a.at - 0.15 && tb < a.at + (a.dur ?? 0.3)) return false;
    // a line marked blink: false (clip.mjs, thread E): no automatic blink starts in it or runs into it
    if (a.do === "talk" && a.blink === false && tb + 0.13 > a.at && tb < a.at + (a.dur ?? 0.3)) return false;
  }
  return true;
}

// arm poses aimed at the world: { prop, grip, at?, off? } puts the hand on that grip point of the prop (where the prop
// stands, or where it would stand with its bottom at `at`: carrying it there), { world: [x, y, z] } on a point. They
// become ordinary local poses here, for the body as it is posed right now, so the hand stays on target while the
// body leans, turns or breathes.
const LEG_H = 0.14;   // potato.js
function resolveArms(sb, st, def, t) {
  const H = def.body.height, sc = st.scale ?? 1;
  const T = [st.x, st.y - 0.1 * (st.kneel || 0), st.z], yaw = st.yaw, pitch = st.pitch || 0, lean = st.lean || 0;
  const toLocal = (W) => {
    // potato.js turns the body by yaw, then pitch, then lean (Euler YXZ); undo them in the reverse order
    let [x, y, z] = [W[0] - T[0], W[1] - T[1], W[2] - T[2]];
    [x, z] = [x * Math.cos(yaw) - z * Math.sin(yaw), x * Math.sin(yaw) + z * Math.cos(yaw)];
    [y, z] = [y * Math.cos(pitch) + z * Math.sin(pitch), -y * Math.sin(pitch) + z * Math.cos(pitch)];
    [x, y] = [x * Math.cos(lean) + y * Math.sin(lean), -x * Math.sin(lean) + y * Math.cos(lean)];
    [x, y, z] = [x / sc, y / sc, z / sc];
    // potato.js squashes hand heights with the body; aim so the squashed hand lands on the point
    return { x: [x, (LEG_H + (y - LEG_H) / st.squash - LEG_H) / H, z] };
  };
  // part: a moving part of the prop (a foldphone's half, "L" or "R"); grip, palm and frame are then in that part's frame
  const onPart = (q, spec, ps, p, dir = false) => (q.part ? partPoint(spec, ps, q.part, p, dir) : p);
  const world = (q) => {
    if (q.world) return q.world;
    const spec = (sb.props || []).find((p) => p.id === q.prop);
    if (!spec) throw new Error(`arm pose aims at unknown prop: ${q.prop}`);
    const ps = propState(sb, spec, t), o = q.off || [0, 0, 0];
    const w = gripWorld(spec, onPart(q, spec, ps, q.grip ?? [0, 0.05, 0]), q.at || [ps.x, ps.y, ps.z], ps.rot, ps.scale, ps.tilt, ps.tip);
    return [w[0] + o[0], w[1] + o[1], w[2] + o[2]];
  };
  // frame: a hand locked to the prop (or part) in position AND rotation: { y, z, at } with y the way the fingers point
  // and z the way the palm faces, in the prop's (part's) frame, and at the point of the hand (in its own frame, before
  // the hand's size; potato.js _mitten: +y to the fingertips, +z out of the palm, +x to the thumb) that sits on the
  // grip point. The hand's centre is placed so that point lands on the grip, and potato.js turns the hand to the frame
  // instead of aiming it along the forearm, so it turns with what it holds and can't flip where the forearm lines up
  // with the palm. The left hand is the right's mirror image: the same frame puts its thumb on the other side.
  const rotLocal = (v) => {
    let [x, y, z] = v;
    [x, z] = [x * Math.cos(yaw) - z * Math.sin(yaw), x * Math.sin(yaw) + z * Math.cos(yaw)];
    [y, z] = [y * Math.cos(pitch) + z * Math.sin(pitch), -y * Math.sin(pitch) + z * Math.cos(pitch)];
    [x, y] = [x * Math.cos(lean) + y * Math.sin(lean), -x * Math.sin(lean) + y * Math.cos(lean)];
    return [x, y, z];
  };
  const unit = (v) => { const l = Math.hypot(...v) || 1; return v.map((c) => c / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const framed = (q, s) => {
    const spec = (sb.props || []).find((p) => p.id === q.prop), ps = propState(sb, spec, t);
    const dirW = (v) => gripWorld(spec, onPart(q, spec, ps, v, true), [0, 0, 0], ps.rot, 1, ps.tilt, ps.tip);
    const Z = unit(dirW(q.frame.z)), y0 = dirW(q.frame.y), d = y0[0] * Z[0] + y0[1] * Z[1] + y0[2] * Z[2];
    const Y = unit(y0.map((c, i) => c - d * Z[i])), X = cross(Y, Z), mx = s === "L" ? -1 : 1;
    const at = q.frame.at || [0, 0, 0], k = (def.hands?.size ?? 1.3) * sc, g = world(q);
    const hand = g.map((c, i) => c - k * (mx * at[0] * X[i] + at[1] * Y[i] + at[2] * Z[i]));
    return { ...toLocal(hand), frame: { y: rotLocal(Y), z: rotLocal(Z), ...(q.frame.elbow && { elbow: q.frame.elbow }) } };
  };
  // palm: the point the palm turns to face (mitten hands): true for the prop's own axis at the grip's height, or a point
  // on the prop ([x, y, z] in its own space; a world point for a world pose). "wrap": the axis too, with the fingers
  // going round it level (a jar held from the side or behind) instead of along the forearm
  const palmWorld = (q) => {
    if (q.world) return Array.isArray(q.palm) ? q.palm : null;
    const spec = (sb.props || []).find((p) => p.id === q.prop), ps = propState(sb, spec, t), g = q.grip ?? [0, 0.05, 0];
    return gripWorld(spec, onPart(q, spec, ps, Array.isArray(q.palm) ? q.palm : [0, g[1], 0]), q.at || [ps.x, ps.y, ps.z], ps.rot, ps.scale, ps.tilt, ps.tip);
  };
  // point "pinch": the grip point is where a glove's fingertip pinch goes, not the hand's centre (potato.js)
  const aim = (q, s) => {
    if (q.frame && !q.world) return framed(q, s);
    const w = q.palm ? palmWorld(q) : null, pt = q.point ? { point: q.point } : {};
    return w ? { ...toLocal(world(q)), palm: toLocal(w).x, ...(q.palm === "wrap" ? { wrap: true } : {}), ...pt } : { ...toLocal(world(q)), ...pt };
  };
  const res = (q, s) => (q && q.mix ? { mix: { ...q.mix, from: res(q.mix.from, s), pose: res(q.mix.pose, s) } } : q && (q.prop || q.world) ? aim(q, s) : q);
  // on: the props this hand is going from and to (stage.js handsInProps: a hand may hold what it is on)
  const on = (q) => (q && q.mix ? [...on(q.mix.from), ...on(q.mix.pose)] : q && q.prop ? [q.prop] : []);
  for (const s of ["R", "L"]) { const a = st.arms[s]; if (a) st.arms[s] = { ...a, from: res(a.from, s), pose: res(a.pose, s), on: [...on(a.from), ...on(a.pose)] }; }
}

// a camera path: sb.camera = [{ at, pos, look, fov, stop? }, ...] keys the camera through one continuous move. Between
// keys it follows a smooth curve (cubic Hermite, Catmull-Rom tangents in time), so a push, a tilt and a rise blend into
// each other with no corner; `stop: true` (and the first and last key) eases into and out of that key, as a hold.
// Two keys with the same pos/look in a row hold the camera still between them.
function pathAt(keys, t) {
  const K = [...keys].sort((a, b) => a.at - b.at);
  if (t <= K[0].at) return K[0];
  if (t >= K[K.length - 1].at) return K[K.length - 1];
  let i = 0; while (K[i + 1].at < t) i++;
  const a = K[i], b = K[i + 1], h = b.at - a.at, u = (t - a.at) / h;
  const tan = (j, f) => {
    const k = K[j]; if (k.stop || j === 0 || j === K.length - 1) return 0;
    const p = K[j - 1], n = K[j + 1]; return (f(n) - f(p)) / (n.at - p.at);
  };
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  const herm = (f) => h00 * f(a) + h10 * h * tan(i, f) + h01 * f(b) + h11 * h * tan(i + 1, f);
  const fov0 = (k) => k.fov ?? 32;
  return { pos: [0, 1, 2].map((c) => herm((k) => k.pos[c])), look: [0, 1, 2].map((c) => herm((k) => k.look[c])), fov: herm(fov0) };
}

// a hard cut between two frames (a new shot starts after t0, up to t1): anything may be re-placed behind it. A camera
// path (sb.camera) is one continuous move, so it never cuts.
export const cutBetween = (sb, t0, t1) => !(Array.isArray(sb.camera) && sb.camera.length) && (sb.shots || []).some((s) => s.at > t0 + 1e-6 && s.at <= t1 + 1e-6 && s.at > 0);

export function cameraState(sb, t) {
  const shots = (sb.shots || []).filter((s) => s.at <= t).sort((a, b) => a.at - b.at);
  const s = shots[shots.length - 1] || { pos: [0, 1, 6], look: [0, 0.7, 0], fov: 32 };
  let pos = s.pos, look = s.look, fov = s.fov ?? 32, roll = s.roll ?? 0;
  if (Array.isArray(sb.camera) && sb.camera.length) ({ pos, look, fov } = pathAt(sb.camera, t));
  else if (s.to) {
    const e = ease(s.ease || "inOut")(prog(t, s.at, s.dur ?? 1));
    pos = lerp3(s.pos, s.to.pos || s.pos, e); look = lerp3(s.look, s.to.look || s.look, e); fov = lerp(fov, s.to.fov ?? fov, e); roll = lerp(roll, s.to.roll ?? roll, e);
    // spin: the look turns round the camera (its heading and pitch eased, `spin` +1 / -1 the way round) instead of
    // sliding in a straight line, so a whip pan of 90° or more never swings through the lens (Real Footage of Hell)
    if (s.spin && s.to.look) {
      const dir = (p, l) => { const d = [l[0] - p[0], l[1] - p[1], l[2] - p[2]], h = Math.hypot(d[0], d[2]); return { yaw: Math.atan2(d[0], d[2]), pitch: Math.atan2(d[1], h), r: Math.hypot(h, d[1]) }; };
      const a = dir(s.pos, s.look), b = dir(s.to.pos || s.pos, s.to.look);
      let dy = b.yaw - a.yaw; while (s.spin > 0 && dy < 0) dy += 2 * Math.PI; while (s.spin < 0 && dy > 0) dy -= 2 * Math.PI;
      const yaw = a.yaw + dy * e, pitch = lerp(a.pitch, b.pitch, e), r = lerp(a.r, b.r, e);
      look = [pos[0] + Math.sin(yaw) * Math.cos(pitch) * r, pos[1] + Math.sin(pitch) * r, pos[2] + Math.cos(yaw) * Math.cos(pitch) * r];
    }
  }
  // yaw: { keys: [[t, degrees, x], ...] (clip time; eased inOut between keys unless ease: "linear"; + turns left; x
  // slides the lens sideways), pivot }: the view swings round a point `pivot` metres ahead of the lens (a rider's bike turning under him: a skid round a bend) while the move goes on
  if (s.yaw) {
    const K = s.yaw.keys || s.yaw, i = K.findIndex((k) => k[0] > t), E = ease(s.yaw.ease || "inOut");
    const at = (j) => (i === 0 ? K[0][j] ?? 0 : i < 0 ? K.at(-1)[j] ?? 0 : lerp(K[i - 1][j] ?? 0, K[i][j] ?? 0, E(prog(t, K[i - 1][0], K[i][0] - K[i - 1][0]))));
    const deg = at(1), dx = at(2);   // [t, degrees, x]: the third value slides the lens sideways (a rider following a bend)
    if (dx) { pos = [pos[0] + dx, pos[1], pos[2]]; look = [look[0] + dx, look[1], look[2]]; }
    if (deg) {
      const a = (deg * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a), d = [look[0] - pos[0], look[2] - pos[2]], h = Math.hypot(d[0], d[1]) || 1;
      const pv = s.yaw.pivot ?? 0, P = [pos[0] + (d[0] / h) * pv, pos[2] + (d[1] / h) * pv];
      // a turn of +a about y: (x, z) -> (x c + z s, -x s + z c), round the pivot
      const rot = ([x, y, z]) => { const u = x - P[0], w = z - P[1]; return [P[0] + u * c + w * sn, y, P[1] - u * sn + w * c]; };
      pos = rot(pos); look = rot(look);
    }
  }
  // handheld: a shot carried by someone walking or running ({ rate: footfalls a second, bob, sway: metres, roll:
  // degrees, dips: [[t, metres, dur], ...] a startled drop of the hands at clip time t}). The bob rises between
  // footfalls, the sway and roll swing once a stride, and a slow drift keeps it from looking mechanical; every wave is
  // under 15 Hz (faster aliases into jitter). Smooth from the shot's first frame (no jump on the cut).
  let hroll = 0;
  if (s.hand) {
    const H = s.hand, w = Math.PI * (H.rate ?? 3), u = t - s.at, k = Math.min(1, (u + (H.lead ?? 0.25)) / 0.25);
    const by = (H.bob ?? 0) * (Math.abs(Math.sin(w * t)) - 0.64) * k, sx = (H.sway ?? 0) * Math.sin(w * t * 0.5) * k;
    const dx = (H.drift ?? 0.006) * Math.sin(t * 1.7 + 0.4), dy = (H.drift ?? 0.006) * 0.7 * Math.sin(t * 2.3 + 1.9);
    let dip = 0;
    for (const [t0, amt, d = 0.35] of H.dips || []) if (t >= t0 && t < t0 + d) dip -= amt * Math.sin(((t - t0) / d) * Math.PI) ** 2;
    pos = [pos[0] + sx + dx, pos[1] + by + dy + dip, pos[2]];
    look = [look[0] + sx * 0.6 + dx * 2, look[1] + by * 0.5 + dy * 2 + dip * 1.6, look[2]];
    hroll = ((H.roll ?? 0) * Math.sin(w * t * 0.5 + 0.6) + (H.roll ?? 0) * 0.35 * Math.sin(t * 1.3)) * k + (H.tilt ?? 0);
  }
  let shake = [0, 0, 0];
  for (const f of sb.fx || []) {
    if (f.do !== "shake" || t < f.at || t > f.at + (f.dur ?? 0.3)) continue;
    const k = 1 - (t - f.at) / (f.dur ?? 0.3), amp = (f.amp ?? 0.05) * k;
    // two sines under 15 Hz: anything faster than half the frame rate aliases into random-looking jitter
    shake = [shake[0] + amp * (0.65 * Math.sin(t * 45.9 + 1.3) + 0.35 * Math.sin(t * 74.8 + 4.1)), shake[1] + amp * (0.65 * Math.sin(t * 52.2 + 2.7) + 0.35 * Math.sin(t * 69.1 + 0.6)), 0];
  }
  // focus: the world point a shot wants sharp (an insert's prop); looks.js depth of field focuses there when it is set
  // roll: a dutch tilt in degrees (+ turns the picture clockwise); stage.js turns camera.up by it. hroll: a handheld
  // shot's swaying horizon (degrees), stage.js turns the camera about its own axis by it
  const focus = !Array.isArray(sb.camera) && s.focus ? { focus: s.focus } : {}, tilt = !Array.isArray(sb.camera) && roll ? { roll } : {};
  return { pos: [pos[0] + shake[0], pos[1] + shake[1], pos[2]], look: [look[0] + shake[0] * 0.5, look[1] + shake[1] * 0.5, look[2]], fov, shotIndex: shots.length - 1, ...focus, ...tilt, ...(hroll && { hroll }) };
}

export function flashAt(sb, t) {
  let o = 0;
  for (const f of sb.fx || []) {
    if (f.do !== "flash" || t < f.at) continue;
    const d = f.dur ?? 0.35, k = (t - f.at) / d;
    // default peak 0.8: a full-white frame reads as a glitch and blanks the picture for a frame
    // a flash hits at full strength on its first frame (so a cut or a swap on that frame is covered) and fades out
    if (k <= 1) o = Math.max(o, (f.peak ?? 0.8) * (k < 0.15 ? 1 : 1 - (k - 0.15) / 0.85));
  }
  return clamp(o);
}

// the room's lights: "lights" effects fade the set's lights (to) and its lamp (lamp, else the same as to) to a level,
// 1 being as built. sb.set.lights starts the room at another level (0.1: the lights are off)
export function lightsAt(sb, t) {
  let room = sb.set?.lights ?? 1, lamp = room;
  for (const f of [...(sb.fx || [])].filter((q) => q.do === "lights" && q.at <= t).sort((a, b) => a.at - b.at)) {
    const e = ease(f.ease || "inOut")(prog(t, f.at, f.dur ?? 0.15));
    const r = f.to ?? room, l = f.lamp ?? f.to ?? lamp;
    room = lerp(room, r, e); lamp = lerp(lamp, l, e);
  }
  return { room, lamp };
}

export function captionsAt(sb, t) {
  return (sb.captions || []).filter((c) => t >= c.from && t < c.to).map((c) => {
    const k = t - c.from;
    const pop = c.pop === false ? 1 : k < 0.14 ? 0.82 + 0.18 * ease("back")(k / 0.14) : 1.0;
    return { ...c, scale: pop };
  });
}
