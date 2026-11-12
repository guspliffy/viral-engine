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
  popcornbowl: { rim: 0.088, wall: [[0, 0.062], [0.02, 0.092], [0.046, 0.128], [0.074, 0.146], [0.088, 0.15]] }, // props-ufo.js: the snack bowl's shape
  soupbowl: { rim: 0.1, wall: [[0, 0.07], [0.02, 0.1], [0.05, 0.142], [0.084, 0.162], [0.1, 0.165]] },           // props-chef.js
  parcel: { w: 0.42, h: 0.26, d: 0.3 },            // props-package.js PARCEL
  gift: { w: 0.3, h: 0.24, d: 0.3 },
  pencil: { len: 0.255, r: 0.011 },                // props3d.js pencil (len 1): eraser at the bottom, point at the top
  soggyfry: { len: 0.16, r: 0.011 },               // props-zombie.js soggyfry: the bottom end at the origin, the top flops over
  orangefeather: { len: 0.34, r: 0.0065 },            // props-prank.js FEATHER: the quill at the bottom, the vane up to the tip
  foamcan: { r: 0.034, h: 0.15 },                  // props-prank.js FOAMCAN: held round its body like a mug
  hotsauce: { r: 0.023, h: 0.112 },                // props-copycat.js: a small sauce bottle, held round its label like a mug
  phone: { w: 0.078, h: 0.155, t: 0.012 },         // props3d.js phone (and style "iphone")
  sscardfan: { w: 0.44, h: 0.3, t: 0.02 },        // props-sos.js: SHARE and STEAL fanned about the bottom middle (the pivot = the origin; 0.32 wide, spec.solid 0.44): the phone hold on the lower edge
  ravenphoto: { w: 0.1, h: 0.13, t: 0.004 },       // props-raven.js photo print: held with the phone hold, its picture (-z) faces away from the holder
  // a small thing pinched by the thin hold (Candy Bodyguard): len = the height the pinch's `from` is measured on, r =
  // the half-width the pads close on
  candy: { len: 0.04, r: 0.024 },                  // props-halloween.js candy (big 1.3): the sweet's middle is 0.02 up
  wallcalendar: { w: 0.26, h: 0.34, t: 0.008 },    // props-notyet.js CALENDAR: held with the phone hold, its grid (-z) faces away from the holder
  gamepad: { w: 0.17, h: 0.045, d: 0.1 },
  rubberstamp: { r: 0.018, h: 0.13 },             // props-busy.js: held round its wooden neck like a mug (a real stamp's fist hold), the pad below
  deskplate: { w: 0.36, h: 0.1, d: 0.1 },          // props-busy.js MANAGER sign: both palms on its two ends (box hold)          // props-notyet.js PAD: held in both hands with the box hold (palms on its two grips)
  clambox: { w: 0.26, h: 0.12, d: 0.2 },            // props-winter.js takeaway clamshell (closed: tray + lid): both palms on its two ends (box hold)
  cocoacup: { r: 0.045, h: 0.115 },                // props-winter.js hot chocolate to go: the mug hold round the sleeve
  teamug: { r: 0.045, h: 0.085 },                  // props-bonfire.js: campmug's size and handle, white china with steam
  papercup: { r: 0.039, h: 0.1 },                  // props-juice.js CUP (0.032 at the foot, 0.042 at the rim): held round its body like a mug
  toffeeapple: { len: 0.2, r: 0.006 },             // props-bonfire.js: the stick (the apple sits on its top): the thin pinch on the stick
  mallowstick: { len: 0.9, r: 0.01 },              // props-dino.js: a long green toasting stick, marshmallows at the tip; the thin pinch near its butt
  // props-bonfire.js sandbucket (BUCKET r 0.13 at the rim, h 0.22): carried at the chest in both hands like a full bowl
  sandbucket: { rim: 0.22, wall: [[0, 0.104], [0.22, 0.13]] },
  manual: { w: 0.34, h: 0.24, t: 0.004 },          // props-ikea.js instruction sheet: held with the phone hold (spec.away: its drawings face away from the holder)
  allenkey: { len: 0.2, r: 0.011 },                // props-ikea.js Allen key: the thin pinch on its long arm, the short arm at the top
  waterglass: { r: 0.038, h: 0.1 },               // props-bistro.js tumbler of water: the mug hold round its middle
  cardreader: { w: 0.078, h: 0.155, t: 0.03 },     // props-bistro.js card machine: held with the phone hold, its screen to the holder
  milkshake: { r: 0.03, h: 0.21 },               // props-diner.js soda glass: the mug hold round its middle (narrow there, flared at the rim)
  button: { len: 0.064, r: 0.004 },                // props-diner.js big button standing on its edge: pinched at its rim (thin hold, from ~0.9)
  fry: { len: 0.1, r: 0.006 },                     // props-diner.js one fry standing on its end: the thin pinch near its top
  paycard: { w: 0.054, h: 0.086, t: 0.003 },       // props-diner.js bank card: the phone hold, its face away from the holder
  coffeecup: { r: 0.045, h: 0.115 },               // props-coffee.js takeaway cup (the cocoacup's size): the mug hold round the sleeve
  iounote: { w: 0.16, h: 0.16, t: 0.002 },         // props-coffee.js sticky note: the phone hold (its writing is on the back: it faces whoever he shows it to)
  feltpen: { len: 0.13, r: 0.009 },                // props-coffee.js marker, its felt tip at the bottom: the thin pinch high on the body
  milkbottle: { r: 0.04, h: 0.2 },                 // props-coffee.js glass milk bottle: the mug hold round its body
  fork: { len: 0.25, r: 0.006 },                   // props-roast.js dinner fork standing on its tines: the thin pinch on its handle
  tablespoon: { len: 0.3, r: 0.007 },              // props-steak.js big spoon standing on its bowl's tip: the thin pinch on its handle
  corncob: { w: 0.24, h: 0.092, d: 0.092 },        // props-steak.js corn on the cob lying along x: both gloves on its two ends (box hold)
  moneybag: { w: 0.3, h: 0.34, d: 0.26 },          // props-heist.js sack: both gloves hug its sides (box hold; widest at 0.16 up)
  policetorch: { r: 0.028, h: 0.2 },               // props-heist.js torch's body: a fist round it (mug hold; build it upright with spec up: true, tip it 90 to point it)
  producecrate: { w: 0.5, h: 0.3, d: 0.36 },       // props-heistset.js the SMALL crate (spec w 0.5, d 0.36, h 0.3): both gloves on its two short ends (box hold)
  coin: { len: -0.1417, r: 0.008 },                // props-money.js gold coin r 0.085, origin its CENTRE: thin hold, the default from 0.6 lands on the rim's bottom (0.6 x -0.1417 = -0.085), the pads on the two faces (half thickness 0.008)
  banknote: { len: 0.2, r: 0.002 },                // props-money.js one note standing on its short edge (0.1 wide, 0.2 tall), origin its bottom edge's middle: the thin pinch low on it (from 0.15)
  cashbrick: { w: 0.34, h: 0.11, d: 0.2 },         // props-money.js three bundles side by side, origin bottom centre: box hold (two palms on the ends); a one-hand top carry uses grips.rest(top: 0.11)
  wheelbarrow: { r: -0.76, h: 0.74 },              // props-twist.js: ONE handle for the mug hold with the right glove; r < 0 (like coin's len) turns its point toward the handles: (0.966, 0.66h, 0.259) x (r + 0.05) = (-0.686, 0.488, -0.184), the left handle 0.03 before its end; a clip puts both gloves on TWIST_GRIPS.wheelbarrow.handleL / handleR
  // props-survive-snow.js (Survive it 01, snowed in)
  firewood: { w: 0.5, h: 0.18, d: 0.18 },          // the one log (len 0.5, r 0.09, lying along x): both gloves on its two ends (box hold); firelog (props-dino.js) has the same size
  firelog: { w: 0.5, h: 0.18, d: 0.18 },
  kindlingarmful: { w: 0.55, h: 0.14, d: 0.25 },   // the sticks across both arms: both gloves on the bundle's two ends (box hold)
  boardplank: { len: 1.1, r: 0.0175 },             // a plank standing on its bottom end (the long side up y): the thin pinch at one end (from ~0.07)
  hammer: { len: 0.32, r: 0.017, h: 0.2 },         // a claw hammer, handle up y from its butt: the mug hold (a fist round the handle, 0.13 up) or the thin pinch
  woodchair: { w: 0.45, h: 0.9, d: 0.45 },         // a chair facing -z, its back rail on z 0 at 0.8: both gloves on the rail's ends (box hold, height 0.88)
  // props-hotpotato.js (Hot Potato 01): the coal's origin is its CENTRE, so heights run from -r up: rim -0.0375 puts the bowl hold's
  // default height (0.8) 3 cm under its middle, the gloves cupped on its lower sides (wall = [height from the centre, radius]); the proof is
  // make-grip-tests.mjs --prop hpcoal --hold bowl (the wall is the glove's reach: radius 0.08 + gap 0.07 puts its middle 15 cm off the axis). The tongs lie along +z from the hinge: no stock hold turns that axis, so they take
  // HP_GRIPS.hptongs through an arm pose (len 0.55, handle bundle r 0.06); the proof is make-hotpotato-bench.mjs
  hpcoal: { rim: -0.0375, wall: [[-0.1, 0.02], [-0.07, 0.06], [-0.03, 0.08], [0.03, 0.084], [0.1, 0.02]] },
  hptongs: { len: 0.55, r: 0.06 },
  // props-bearcamp.js (Fight, Flight or Freeze 02, bear in the camp). cookpot: the steel pot's ONE handle lies along +x (its grip
  // "handle" at x 0.28, y 0.115): w / h / t are chosen so the phone hold's defaults (x = w / 2 + 0.035, y = 0.42 h, z -0.01) land
  // on the handle, a fist round it like a frying pan (the proof: make-grip-tests.mjs --prop cookpot --hold phone); r / h do the same
  // for the mug hold when it is called with { angle: 90, height: 0.42 } (x = r + 0.05 = 0.28, y = 0.42 h = 0.115).
  cookpot: { w: 0.49, h: 0.274, t: 0.02, r: 0.23 },
  // burnbranch: the dry pine branch up +y from the held end, r 0.03 there: the mug hold's fist at 0.66 h = 0.08 up the stick
  burnbranch: { r: 0.03, h: 0.121 },
};
// a bowl's outside radius at height y (before scale)
const wallAt = (wall, y) => { for (let i = 1; i < wall.length; i++) if (y <= wall[i][0]) { const [y0, r0] = wall[i - 1], [y1, r1] = wall[i]; return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0); } return wall[wall.length - 1][1]; };
const size = (spec) => { const s = SIZE[spec.kind]; if (!s) throw new Error(`grips: no size for prop kind "${spec.kind}"`); return s; };

// the turn each kind adds to rot = yaw + 180: a mug's handle (+x) goes to the holder's left and back toward the body,
// away from the right hand and from a camera in front
const TURN = { campmug: -125, teamug: -125 };
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
    sides, hand, hands,
    // 01 approach: the hand opens on the way and stops a few centimetres off its grip, on the side it closes from
    // (at: where the prop's bottom centre is now, when someone else holds it there: a pass)
    approach(t, dur = 0.3, at = null) {
      const w = at ? { at: at.map(r3) } : {};
      each((s) => { c.A(t, who, "grip", { side: s, ...shp(ready), dur: Math.min(0.2, dur) }); c.arm(t, who, s, pose(s, { off: hands[s].away, ...w }), dur, "inOut"); });
      return r3(t + dur);
    },
    // 02 secure: onto the grip (contact), then the fingers close; the grab comes once they have, so the prop never
    // moves before the hand is on it. A pinch lands without the settle's overshoot, which pushes the pads through a
    // thin shaft
    secure(t, dur = 0.2, at = null) {
      const w = at ? { at: at.map(r3) } : {};
      each((s) => { c.arm(t, who, s, pose(s, w), dur, point ? "out" : "settle"); c.A(t + dur * 0.6, who, "grip", { side: s, ...shp(shape), dur: 0.12 }); });
      // a hand locked to the prop (frame) holds it exactly where it touched it (keep), not at the middle of the hand; a
      // pinch holds it at the pinch (point)
      c.A(t + dur + 0.06, who, "grab", { prop: id, hand, grip: grab, dur: 0, pose: null, ...(point ? { point } : sides.some((s) => hands[s].frame) && { keep: true }) });
      return r3(t + dur + 0.1);
    },
    take(t, { reach = 0.3, settle = 0.2 } = {}) { const e = h.secure(h.approach(t, reach), settle); return take ? take(h, e) : e; },
    // take it from someone else's hand where they hold it out (at: its bottom centre there). With "rig": { "hold": 2 }
    // the prop blends from the giver's hand to this one over at least 0.15 s; the giver then lets go with handOff()
    takeFrom(t, at, { reach = 0.35, settle = 0.2 } = {}) { return h.secure(h.approach(t, reach, at), settle, at); },
    // let go after a pass: the fingers open and the hand backs off, without a release (the prop is the taker's now)
    handOff(t, { rest = "rest", back = 0.2 } = {}) {
      each((s) => { c.A(t, who, "grip", { side: s, ...shp(ready), dur: 0.15 }); c.arm(t + 0.04, who, s, rest, back + 0.3, "inOut"); });
      return r3(t + 0.34 + back);
    },
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
// edge: which edge the hand closes on, in the hold frame ("R": +x; default the hand's own side). A pass takes the
// edge nearest the taker, which for a taker on the giver's right is the hold frame's other edge (make-holds.mjs pass)
export function phone(c, who, spec, { side = "R", edge: closeOn = side, gap = 0.035, height = 0.42, flat = (spec.tip ?? 0) <= -60 } = {}) {
  const { w, h, t: th } = size(spec), k = spec.scale ?? 1, sx = closeOn === "R" ? 1 : -1;
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

// REST (a hand pin, quality plan item 7 (e)): a palm flat on a surface (a table top, a counter, a door), pinned there in
// the world while the body leans, turns or breathes: the arm pose aims at a point on the prop, so it stays put when the
// body moves. The glove's middle sits a palm's half-thickness over the surface (the split the bill hands sank 5 cm
// into the table with the grip on its top): lift is that, in metres of the world, for the crisp/sheet gloves.
//   grips.rest(c, "rea", "R", TABLE, [0.45, 0.3], 1.0)     // x and z on the prop (its own frame), the top from SIZE or h
export function rest(c, who, side, spec, [x, z], t, { dur = 0.35, ease = "settle", top = spec.h ?? SIZE[spec.kind]?.h ?? 0, lift = 0.055, palm = true } = {}) {
  const k = spec.scale ?? 1, y = r3(top + lift / k);
  c.arm(t, who, side, { prop: spec.id, grip: [x, y, z], ...(palm && { palm: [x, r3(top - 1), z] }) }, dur, ease);
  return r3(t + dur);
}

export const HOLDS = { mug, bowl, bowlPush, box, thin, phone, staff, rest };
