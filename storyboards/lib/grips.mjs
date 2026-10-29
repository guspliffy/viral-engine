// The grip library (clip lessons item 3, Jonny 29 Oct): one tested, natural hold per kind of prop, so a clip picks a
// hold instead of inventing one. Every hold runs in the order of Jonny's handling sheets ("contact before motion",
// 28 Oct: approach, secure, lift, hold, place, release): the hand arrives open beside its grip, touches, closes, and
// only then does the prop move; it is put down first and let go after.
//
//   import * as grips from "../lib/grips.mjs";
//   const MUG = { id: "mug", kind: "campmug", ...grips.placeFor("mug", [0.1, 0.42, 0.5], WIZ_YAW) };   // a prop spec
//   const h = grips.mug(c, "wiz", MUG, { side: "R" });
//   let t = h.take(1.0);                       // approach + secure: returns when the fingers have closed
//   t = h.carry(t + 0.05, [0.1, 0.62, 0.32], 0.5);   // lift to the chest (the prop's bottom centre goes there)
//   t = h.put(t + 0.6, MUG_SPOT);              // place + release: returns when the hand is off
//
// The hold frame: each hold is written for a holder who stands on the prop's +z side, facing it, with the right hand
// toward +x (the prop's rot = the holder's yaw + 180, as the parcel in Package). placeFor() gives that rot (plus the
// kind's own turn: a mug's handle away from the hand), and the grips are turned into the prop's own frame from there.
// Gaps are in metres of world space for the crisp cast's gloves (hands.size 1.7: the palm is about 5 cm thick from
// its middle), so a prop's scale never pushes a hand into it.
// Each hold names what it follows: CLAUDE.md grip rules 1-3 and 13-16, and docs/STORYBOARD.md "Contact".
import { r3 } from "./clip.mjs";

const rad = (d) => (d * Math.PI) / 180;
const rotY = ([x, y, z], d) => { const a = rad(d); return [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)]; };
const add = (a, b) => a.map((v, i) => v + b[i]);
const mirror = ([x, y, z]) => [-x, y, z];

// the sizes the holds need, per prop kind (metres before the prop's scale; engine/page/props*.js)
const SIZE = {
  campmug: { r: 0.045, h: 0.085 },                 // props-duo.js campmug: its handle on +x
  // a bowl's outside, [height, radius] from the foot up to the rim
  snackbowl: { rim: 0.088, wall: [[0, 0.062], [0.02, 0.092], [0.046, 0.128], [0.074, 0.146], [0.088, 0.15]] },   // props-charger.js
  soupbowl: { rim: 0.1, wall: [[0, 0.07], [0.02, 0.1], [0.05, 0.142], [0.084, 0.162], [0.1, 0.165]] },           // props-chef.js
  parcel: { w: 0.42, h: 0.26, d: 0.3 },            // props-package.js PARCEL
  gift: { w: 0.3, h: 0.24, d: 0.3 },
  pencil: { len: 0.255, r: 0.011 },                // props3d.js pencil (len 1): eraser at the bottom, point at the top
  feather: { len: 0.34, r: 0.0065 },               // props-prank.js FEATHER: the quill at the bottom, the vane up to the tip
  phone: { w: 0.078, h: 0.155, t: 0.012 },         // props3d.js phone (and style "iphone")
};
// a bowl's outside radius at height y (before scale)
const wallAt = (wall, y) => { for (let i = 1; i < wall.length; i++) if (y <= wall[i][0]) { const [y0, r0] = wall[i - 1], [y1, r1] = wall[i]; return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0); } return wall[wall.length - 1][1]; };
const size = (spec) => { const s = SIZE[spec.kind]; if (!s) throw new Error(`grips: no size for prop kind "${spec.kind}"`); return s; };

// the turn each kind adds to rot = yaw + 180: a mug's handle (+x) goes to the holder's left and back toward the body,
// away from the right hand and from a camera in front
const TURN = { campmug: -125 };
// the crisp cast's glove size (hands.size): a grip shape's sizes are in the glove's own units
const HAND = 1.7;

// the prop's place for a holder facing `yaw` (degrees, cast "face"): { x, y, z, rot }
export function placeFor(kind, at, yaw, { turn = 0 } = {}) {
  return { x: r3(at[0]), y: r3(at[1]), z: r3(at[2]), rot: r3(yaw + 180 + (TURN[kind] ?? 0) + turn) };
}

// The shared six steps, for one hand or two. hands: { R: { grip, palm, away } } in the prop's own frame (away: where
// the hand waits before it touches and goes back to after, an offset from the grip in the world, for the prop's rot
// when the hold is made), shape: the closed
// hand, ready: the open hand on the way in.
function holder(c, who, spec, { hands, shape, ready = "open", grab, point, take }) {
  const id = spec.id, sides = Object.keys(hands), hand = sides.length > 1 ? "both" : sides[0];
  const pose = (s, o = {}) => ({ prop: id, grip: hands[s].grip, ...(hands[s].palm != null && { palm: hands[s].palm }), ...(hands[s].frame && { frame: hands[s].frame }), ...(point && { point }), ...o });
  // a grip shape: a GRIPS name, or { shape, set } with the shape's fields overridden (a pinch's roll, its thumb open)
  const shp = (x) => (typeof x === "string" ? { shape: x } : x);
  const each = (f) => sides.forEach(f);
  const h = {
    sides, hand,
    // 01 approach: the hand opens on the way and stops a few centimetres off its grip, on the side it closes from
    approach(t, dur = 0.3) {
      each((s) => { c.A(t, who, "grip", { side: s, ...shp(ready), dur: Math.min(0.2, dur) }); c.arm(t, who, s, pose(s, { off: hands[s].away }), dur, "inOut"); });
      return r3(t + dur);
    },
    // 02 secure: onto the grip (contact), then the fingers close; the grab comes once they have, so the prop never
    // moves before the hand is on it. A pinch lands without the settle's overshoot, which pushes the pads through a
    // thin shaft
    secure(t, dur = 0.2) {
      each((s) => { c.arm(t, who, s, pose(s), dur, point ? "out" : "settle"); c.A(t + dur * 0.6, who, "grip", { side: s, ...shp(shape), dur: 0.12 }); });
      // a hand locked to the prop (frame) holds it exactly where it touched it (keep), not at the middle of the hand; a
      // pinch holds it at the pinch (point)
      c.A(t + dur + 0.06, who, "grab", { prop: id, hand, grip: grab, dur: 0, pose: null, ...(point ? { point } : sides.some((s) => hands[s].frame) && { keep: true }) });
      return r3(t + dur + 0.1);
    },
    take(t, { reach = 0.3, settle = 0.2 } = {}) { const e = h.secure(h.approach(t, reach), settle); return take ? take(h, e) : e; },
    // 03 lift / 04 hold / carry: the prop's bottom centre to `at` (world), the hands staying on their grips. rot turns
    // the prop on the way (the hands turn with it); keep turns slow and small, a held prop is rigid in the hand.
    carry(t, at, dur, ease = "inOut", { rot, tip } = {}) {
      each((s) => c.arm(t, who, s, pose(s, { at: at.map(r3) }), dur, ease));
      if (rot != null || tip != null) c.prop(t, id, { ...(rot != null && { rot: r3(rot) }), ...(tip != null && { tip: r3(tip) }) }, dur, ease);
      return r3(t + dur);
    },
    // a new hold on the prop while it is held, the prop staying where it is at `at` (world): the hand rolls round it
    // onto the new grip (a phone picked up by its edge turning into the palm). next: { R: { grip, palm } }, grab: the
    // new grab point (the hands' middle for two)
    regrip(t, at, next, nextGrab, dur = 0.25, { tip } = {}) {
      each((s) => { Object.assign(hands[s], next[s]); c.arm(t, who, s, pose(s, { at: at.map(r3) }), dur, "inOut"); });
      c.A(t, who, "grab", { prop: id, hand, grip: nextGrab, dur, pose: null });
      if (tip != null) c.prop(t, id, { tip: r3(tip) }, dur, "inOut");
      grab = nextGrab;
      return r3(t + dur);
    },
    // 05 place: down onto `at` (the surface under it), easing in, with a two-frame squash on contact
    place(t, at, dur = 0.35) {
      const e = h.carry(t, at, dur, "out");
      c.prop(e, id, { squash: 0.05 }, 0.05, "out"); c.prop(e + 0.05, id, { squash: 0 }, 0.15, "settle");
      return e;
    },
    // 06 release: let go where it stands, the fingers open, the hand backs off the way it came; rest: "rest" (or a
    // pose) for the arm afterwards, false to leave it waiting beside the prop
    release(t, { rest = "rest", back = 0.2 } = {}) {
      c.A(t, who, "release", { prop: id, dur: 0 });
      each((s) => { c.A(t, who, "grip", { side: s, ...shp(ready), dur: 0.15 }); c.arm(t + 0.04, who, s, pose(s, { off: hands[s].away }), back, "out"); });
      if (rest) { each((s) => { c.arm(t + 0.04 + back, who, s, rest, 0.4, "settle"); c.A(t + 0.04 + back, who, "grip", { side: s, shape: "relaxed", dur: 0.3 }); }); return r3(t + 0.44 + back); }
      return r3(t + 0.04 + back);
    },
    put(t, at, { dur = 0.35, rest = "rest" } = {}) { return h.release(h.place(t, at, dur) + 0.1, { rest }); },
  };
  return h;
}

// a point in the hold frame (holder at +z, right hand at +x; metres in the world) -> the prop's own frame
const toProp = (spec, p) => rotY(p, -(TURN[spec.kind] ?? 0)).map((v) => r3(v / (spec.scale ?? 1)));
// a direction in the hold frame -> the world (arm pose `off` is in the world), for the prop's rot at the start
const toWorld = (spec, p) => rotY(p, (spec.rot ?? 0) - (TURN[spec.kind] ?? 0)).map(r3);

// MUG (campmug): one hand round the body from the holder's side, behind it as the camera sees it, the thumb up and
// the fingers round the far side; the handle turned away from the hand and the camera (the teacup test, 25 Oct: a
// glove closed on a small handle reads as a lump stuck to the cup). It stays level until a sip.
export function mug(c, who, spec, { side = "R", angle = 75, gap = 0.05, height = 0.66 } = {}) {
  const { r, h } = size(spec), k = spec.scale ?? 1, sx = side === "R" ? 1 : -1;
  const at = [sx * Math.sin(rad(angle)) * (r * k + gap), height * h * k, Math.cos(rad(angle)) * (r * k + gap)];
  const away = toWorld(spec, rotY([0, 0.02, 0.07], sx * angle));
  const grip = toProp(spec, at);
  return holder(c, who, spec, { hands: { [side]: { grip, palm: "wrap", away } }, shape: "hold", grab: grip });
}

// BOWL (snackbowl, soupbowl): both hands carry it from below its sides, the way a full bowl is carried: palms half up
// under the outside of the wall, fingers along it, the thumbs by the rim. The palms rest on the china and the fingers
// lie along it without curling into it, high enough on the wall that they stay off the table (Charger 29 Oct: a glove
// inside the bowl it pushed; grip library v1: fingers through the bowl and the table). push(): one hand flat on its
// far side, for a slide along a table.
export function bowl(c, who, spec, { gap = 0.07, height = 0.8, angle = 85 } = {}) {
  const { rim, wall } = size(spec), k = spec.scale ?? 1, y = height * rim * k, d = wallAt(wall, height * rim) * k + gap;
  const at = (sx) => [sx * Math.sin(rad(angle)) * d, y, Math.cos(rad(angle)) * d];
  const hands = {};
  for (const [s, sx] of [["R", 1], ["L", -1]]) hands[s] = { grip: toProp(spec, at(sx)), palm: true, away: toWorld(spec, [sx * 0.06, 0.08, 0.03]) };
  return holder(c, who, spec, { hands, shape: "carry", ready: "relaxed", grab: toProp(spec, [0, y, Math.cos(rad(angle)) * d]) });
}
export function bowlPush(c, who, spec, { side = "R", gap = 0.05, height = 0.6, angle = 70 } = {}) {
  const { rim, wall } = size(spec), k = spec.scale ?? 1, sx = side === "R" ? 1 : -1, d = wallAt(wall, height * rim) * k + gap;
  const grip = toProp(spec, [sx * Math.sin(rad(angle)) * d, height * rim * k, Math.cos(rad(angle)) * d]);
  return holder(c, who, spec, { hands: { [side]: { grip, palm: true, away: toWorld(spec, [sx * 0.07, 0.04, 0.03]) } }, shape: "relaxed", grab: grip });
}

// BOX (parcel, gift): both palms flat on the two ends, at half height, fingers open up the ends, the box between them
// (Package 29 Oct). Lifted to the chest it stays square to the holder; a body turn turns it with rot.
export function box(c, who, spec, { gap = 0.045, height = 0.55 } = {}) {
  const { w, h } = size(spec), k = spec.scale ?? 1, y = height * h * k;
  const hands = {};
  for (const [s, sx] of [["R", 1], ["L", -1]]) hands[s] = { grip: toProp(spec, [sx * (w / 2 * k + gap), y, 0]), palm: true, away: toWorld(spec, [sx * 0.08, 0.02, 0.03]) };
  return holder(c, who, spec, { hands, shape: "press", ready: "open", grab: toProp(spec, [0, y, 0]) });
}

// THIN (pencil; the same for a straw, a pen): a fingertip pinch (Jonny's straw sheet and his artist's pencil and straw
// boards, 29 Oct). The thumb and index pads close on opposite sides of the shaft at the same height, in its upper
// third (a straw: below its bend); the palm stays beside it and the other fingers curl loosely out of the way, so the
// shaft shows clearly above and below the hand and never runs through the palm. The hand points along the forearm
// (grip "tip", arm poses with point "pinch": the pinch, not the hand's centre, goes on the grip), so the wrist always
// stays on the arm. roll: degrees the hand turns about the shaft to show the thumb to the camera. from: where on the
// shaft the pinch is (0 bottom .. 1 top).
export function thin(c, who, spec, { side = "R", from = 0.6, roll = 20, lean = 30, readyRoll = roll - 40 } = {}) {
  const { len, r } = size(spec), k = spec.scale ?? 1, sx = side === "R" ? 1 : -1;
  const grip = toProp(spec, [0, from * len * k, 0]);
  const set = { roll, lean, thin: r3((r * k) / HAND) };
  const hands = { [side]: { grip, away: toWorld(spec, [sx * 0.07, 0.07, 0.04]) } };
  return holder(c, who, spec, { hands, shape: { shape: "tip", set }, ready: { shape: "tip", set: { ...set, roll: readyRoll, close: 0, curl: 0.7, index: 0.5 } }, grab: grip, point: "pinch" });
}

// PHONE in one hand (phone, iphone): upright in the palm, screen to the holder, the fingers round its far edge and the
// thumb free over the screen (the Charger's scrolling hand). flat: it starts lying on its back on a table (spec tip
// -90, its top away from the holder): the hand takes its right edge from above, lifts it a little as it tips up, and
// it rolls into the palm (the hand goes round the edge, the phone stays where it is). Put it back down with put().
export function phone(c, who, spec, { side = "R", gap = 0.035, height = 0.42, flat = (spec.tip ?? 0) <= -60 } = {}) {
  const { w, h, t: th } = size(spec), k = spec.scale ?? 1, sx = side === "R" ? 1 : -1;
  const hold = toProp(spec, [sx * (w / 2 * k + gap), height * h * k, -0.01]);
  const away = toWorld(spec, [sx * 0.06, 0.02, 0.04]);
  if (!flat) return holder(c, who, spec, { hands: { [side]: { grip: hold, palm: true, away } }, shape: "hold", grab: hold });
  // on its back: the grip is in the phone's own frame (its +z, the screen, is up), on the edge and over the screen
  const edge = [r3(sx * (w / 2 + 0.012 / k)), r3(0.5 * h), r3(th / 2 + 0.065 / k)];
  const up = (p, dy) => [p[0], p[1] + dy, p[2]];
  const H = holder(c, who, spec, {
    hands: { [side]: { grip: edge, palm: true, away: toWorld(spec, [sx * 0.05, 0.07, 0]) } }, shape: "hold", grab: edge,
    take(H, t) {
      const lift = up([spec.x, spec.y, spec.z], 0.05);
      t = H.carry(t + 0.04, lift, 0.25, "inOut", { tip: -50 });
      return H.regrip(t, up(lift, 0.02), { [side]: { grip: hold } }, hold, 0.25, { tip: -12 });
    },
  });
  // put it back on its back: over the spot, it rolls back onto the edge grip as it tips down, then lies flat
  H.put = (t, at, { dur = 0.3, rest = "rest" } = {}) => {
    t = H.carry(t, up(at, 0.07), dur);
    t = H.regrip(t, up(at, 0.05), { [side]: { grip: edge } }, edge, 0.25, { tip: -50 });
    c.prop(t, spec.id, { tip: -90 }, 0.25, "inOut");
    return H.release(H.place(t, at, 0.25) + 0.1, { rest });
  };
  return H;
}

// STAFF (a costume staff, the classic Wizard's): Jonny's staff sheet (28 Oct, "keep the grip"): planted, ready, lift,
// carry, lower, settle. The fist never changes its hold on the shaft; the shaft stays in front of the arm, the forearm
// rising into the fist (CLAUDE.md grip rule 3). rest: the character's own staff pose (arm pose o, the Wizard's arms.L);
// the engine keeps the foot on the floor while the hand is low (costumes.js plant) and carries it once lifted.
export function staff(c, who, { side = "L", rest = [0.24, 0.36, 0.08] } = {}) {
  const at = (d) => ({ o: rest.map((v, i) => r3(v + d[i])) });
  return {
    // 02 ready: the fist tightens on the shaft (a small squeeze), nothing moves yet
    ready(t) { c.A(t, who, "grip", { side, shape: "fist", dur: 0.12 }); return r3(t + 0.15); },
    // 03 lift: straight up, the foot clear of the floor
    lift(t, { dy = 0.07, dur = 0.25 } = {}) { c.arm(t, who, side, at([0, dy, 0.02]), dur, "out"); return r3(t + dur); },
    // 04 carry: the top leans out from the body and the foot swings in under the fist (tilt: [forward, outward] deg)
    carry(t, { dy = 0.07, tilt = [4, 16], dur = 0.3 } = {}) {
      c.arm(t, who, side, at([0.02, dy, 0.04]), dur, "inOut"); c.A(t, who, "tilt", { to: tilt, dur }); return r3(t + dur);
    },
    // 05 lower: upright again, coming down; 06 settle: the foot back on the floor, the fist back to its hold
    lower(t, { dy = 0.025, dur = 0.3 } = {}) { c.A(t, who, "tilt", { to: null, dur }); c.arm(t, who, side, at([0, dy, 0.01]), dur, "inOut"); return r3(t + dur); },
    settle(t, { dur = 0.25 } = {}) { c.arm(t, who, side, "rest", dur, "settle"); c.A(t + dur * 0.5, who, "grip", { side, shape: "hold", dur: 0.15 }); return r3(t + dur); },
  };
}

export const HOLDS = { mug, bowl, bowlPush, box, thin, phone, staff };
