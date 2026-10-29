import * as THREE from "three";
import { clamp, lerp, ease, prog, rng as rngOf } from "./util.js";
import { TREND_KINDS, TREND_GRIPS } from "./props-trend.js";
import { CATCH_KINDS, CATCH_GRIPS } from "./props-catch.js";
import { ROBBED_KINDS, ROBBED_GRIPS } from "./props-robbed.js";
import { HALLOWEEN_KINDS, HALLOWEEN_GRIPS } from "./props-halloween.js";
import { HOME_KINDS, HOME_GRIPS } from "./props-home.js";
import { ELEVATOR_KINDS, ELEVATOR_GRIPS } from "./props-elevator.js";
import { ROAD_KINDS, ROAD_GRIPS } from "./props-road.js";
import { MAKEUP_KINDS, MAKEUP_GRIPS } from "./props-makeup.js";
import { CHEF_KINDS, CHEF_GRIPS } from "./props-chef.js";
import { PACKAGE_KINDS, PACKAGE_GRIPS } from "./props-package.js";
import { steamWisps } from "./steam.js";
import { DUO_KINDS, DUO_GRIPS, DUO_PARTS } from "./props-duo.js";
import { CHARGER_KINDS, CHARGER_GRIPS } from "./props-charger.js";
import { COOKIE_KINDS, COOKIE_GRIPS } from "./props-cookie.js";
import { CANDLE_KINDS, CANDLE_GRIPS } from "./props-candle.js";

// Props for the comedy clips, in the engine's soft 3D style: table, chair, teacup, pickle jar, cookie, plate, wall
// clock, gift box, phone, cake, banner, a pickle that can leave its jar, and an office desk, a report that a sword
// cuts into confetti (shred) and a desk nameplate that splits in two. The first seven have the same names and
// settings as the puppet props (puppet/page/props.js), so a puppet storyboard ports over.
//   sb.props[]: { id, kind, x, y (the prop's bottom), z, rot (degrees about y; a chair at 90 faces right), scale }
//   { do: "prop", id, at, dur, ease, set: { split, shred, glow, lid, twist, fill, spill, lit, spin, x, y, z, rot, scale } } tweens the numbers
//   { who, do: "grab", prop, hand: R | L | both, off: [x, y, z] } the prop follows the hand (it lifts its arm to "hold")
//   { who, do: "release", prop, to: [x, y, z], dur, arc } puts it down at `to` (or leaves it where the hand let go);
//   arc (metres) throws it in a curve instead of a straight line, and works on a prop tween's x, y, z too
// Splitting: each prop that can split is built as a left and a right half that slide and tip apart.
export const SEAT_Y = 0.42;   // a chair's seat height (timeline.js sits a character on it)
export const TABLE_Y = 0.62;  // a table's top
export const DESK_Y = 0.42;   // an office desk's top: a standing potato's resting hand height
// grip points: where a hand closes on a prop, in the prop's own frame (metres from its bottom centre, before rot and
// scale). A grab or an arm pose names one ("grip": "handle") or gives its own point ("grip": [x, y, z]).
const GRIPS = {
  teacup: { handle: [0.12, 0.07, 0] },   // the hand round the outside of the handle (cup on its saucer; -0.012 without)
  nameplate: { back: [0, 0.06, -0.05] },   // a hand behind its top edge (grabbed from behind, fingers over the front)
  ...TREND_GRIPS, ...CATCH_GRIPS, ...ROBBED_GRIPS,
  ...HALLOWEEN_GRIPS, ...HOME_GRIPS, ...ELEVATOR_GRIPS, ...ROAD_GRIPS, ...MAKEUP_GRIPS, ...CHEF_GRIPS, ...DUO_GRIPS, ...PACKAGE_GRIPS, ...CHARGER_GRIPS, ...COOKIE_GRIPS, ...CANDLE_GRIPS,
};
export function gripPoint(spec, grip) {
  if (Array.isArray(grip)) return grip;
  const g = (GRIPS[spec.kind] || {})[grip];
  if (!g) throw new Error(`prop ${spec.id} (${spec.kind}) has no grip "${grip}"`);
  return spec.kind === "teacup" && spec.saucer === false ? [g[0], g[1] - 0.012, g[2]] : g;
}
// a point (dir: a direction) on a moving part of a prop (a foldphone's half) -> the prop's own frame, for the part's
// state at that moment (ps: propState). Hands that hold a part follow it through gripWorld from there.
const PARTS = { ...DUO_PARTS };
export function partPoint(spec, ps, part, p, dir = false) {
  const f = PARTS[spec.kind];
  if (!f) throw new Error(`prop ${spec.id} (${spec.kind}) has no parts to hold`);
  return f(ps, part, p, dir);
}
// a grip point in the world for a prop whose bottom centre is at `at`: its scale, then its tilt (about its own z),
// tip (about its own x) and rot (about y) applied, the same order as the prop's root (YXZ)
export function gripWorld(spec, grip, at, rot = spec.rot ?? 0, scale = spec.scale ?? 1, tilt = spec.tilt ?? 0, tip = spec.tip ?? 0) {
  let [x, y, z] = gripPoint(spec, grip).map((v) => v * scale);
  const c = -(tilt * Math.PI) / 180, k = (tip * Math.PI) / 180, r = (rot * Math.PI) / 180;
  [x, y] = [x * Math.cos(c) - y * Math.sin(c), x * Math.sin(c) + y * Math.cos(c)];
  [y, z] = [y * Math.cos(k) - z * Math.sin(k), y * Math.sin(k) + z * Math.cos(k)];
  [x, z] = [x * Math.cos(r) + z * Math.sin(r), -x * Math.sin(r) + z * Math.cos(r)];
  return [at[0] + x, at[1] + y, at[2] + z];
}

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
// a half of a round thing: theta 0..PI is the right half (x >= 0), PI..2PI the left
const TH = (s) => (s > 0 ? 0 : Math.PI);

// a 36 degree pizza slice (tip at the origin, from +z towards +x): crust, sauce edge, cheese and three pepperoni
const R_PIZZA = 0.3;
function sliceMesh() {
  const g = new THREE.Group(), a = (36 * Math.PI) / 180;
  const cheese = mat("#f7c84a", { roughness: 0.55 }), crust = mat("#d9954a", { roughness: 0.75 }), pep = mat("#c0392b", { roughness: 0.5 });
  mesh(new THREE.CylinderGeometry(R_PIZZA, R_PIZZA, 0.03, 12, 1, false, 0.01, a - 0.02), crust, g, 0, 0.015, 0);       // the crust band
  mesh(new THREE.CylinderGeometry(R_PIZZA - 0.03, R_PIZZA - 0.03, 0.034, 12, 1, false, 0.012, a - 0.024), cheese, g, 0, 0.017, 0);
  for (const [r, f] of [[0.1, 0.5], [0.19, 0.3], [0.2, 0.72]]) { const q = mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.008, 16), pep, g, Math.sin(a * f) * r, 0.035, Math.cos(a * f) * r); q.castShadow = false; }
  return g;
}

function appleMesh(red, stemM, leafM) {
  const g = new THREE.Group();
  const b = mesh(new THREE.SphereGeometry(0.07, 18, 14), red, g); b.scale.y = 0.92;
  mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.05, 6), stemM, g, 0, 0.075, 0);
  const l = mesh(new THREE.SphereGeometry(0.025, 10, 6), leafM, g, 0.025, 0.09, 0); l.scale.set(1.2, 0.3, 0.6);
  return g;
}

// each builder adds its meshes to the half groups (or to `whole` when it never splits) and returns its parts
// a jar lid: red, with grip ridges and one white stripe round its edge, so a turning lid reads as turning
function jarLid(parent) {
  const lid = new THREE.Group(); parent.add(lid);
  mesh(new THREE.CylinderGeometry(0.118, 0.118, 0.045, 36), mat("#c7372f", { roughness: 0.4, metalness: 0.3 }), lid, 0, 0, 0);
  const ridgeM = mat("#9e2a24", { roughness: 0.45, metalness: 0.3 });
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, r = mesh(new THREE.BoxGeometry(0.008, 0.038, 0.006), ridgeM, lid, 0.119 * Math.sin(a), 0, 0.119 * Math.cos(a)); r.rotation.y = a; r.castShadow = false; }
  const stripe = mesh(new THREE.BoxGeometry(0.03, 0.04, 0.008), mat("#f4f1ea", { roughness: 0.5 }), lid, 0, 0, 0.121); stripe.castShadow = false;
  return lid;
}

const KINDS = {
  // spec: color (the top), legs (their colour), w and d (metres; 1.1 x 0.7)
  table(P) {
    const top = mat(P.spec.color ?? "#c98a4b", { roughness: 0.55 }), leg = mat(P.spec.legs ?? "#8a5a2e");
    const W = P.spec.w ?? 1.1, D = P.spec.d ?? 0.7;
    for (const [s, h] of P.halves) {
      mesh(new THREE.BoxGeometry(W / 2, 0.06, D), top, h, (s * W) / 4, TABLE_Y - 0.03, 0);
      for (const z of [-1, 1]) mesh(new THREE.CylinderGeometry(0.03, 0.025, TABLE_Y - 0.06, 12), leg, h, s * (W / 2 - 0.08), (TABLE_Y - 0.06) / 2, z * (D / 2 - 0.08));
    }
    return { grip: TABLE_Y, splitApart: 0.12, splitTip: 0.35, splitDrop: 0.08 };
  },
  chair(P) {
    const wood = mat("#a8693a", { roughness: 0.6 }), pad = mat("#d6574a", { roughness: 0.8 });
    mesh(new THREE.BoxGeometry(0.46, 0.05, 0.44), wood, P.whole, 0, SEAT_Y - 0.045, 0);
    mesh(new THREE.BoxGeometry(0.42, 0.03, 0.4), pad, P.whole, 0, SEAT_Y - 0.008, 0);
    for (const x of [-1, 1]) for (const z of [-1, 1]) mesh(new THREE.CylinderGeometry(0.022, 0.02, SEAT_Y - 0.07, 10), wood, P.whole, x * 0.19, (SEAT_Y - 0.07) / 2, z * 0.18);
    // the back rest, behind the seat (the chair faces +z)
    for (const x of [-1, 1]) mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.5, 10), wood, P.whole, x * 0.19, SEAT_Y + 0.22, -0.2);
    mesh(new THREE.BoxGeometry(0.44, 0.12, 0.035), wood, P.whole, 0, SEAT_Y + 0.4, -0.2);
    return { grip: SEAT_Y };
  },
  // saucer: false is the cup on its own (put it on a saucer prop, 0.012 up, to lift it off and put it back)
  teacup(P) {
    const china = mat("#f4f1ea", { roughness: 0.35 }), band = mat("#3d8fb0", { roughness: 0.4 }), noSaucer = P.spec.saucer === false;
    if (noSaucer) P.whole.position.y = -0.012;
    const prof = [[0.0, 0.0], [0.045, 0.0], [0.05, 0.012], [0.062, 0.06], [0.07, 0.1], [0.064, 0.1], [0.056, 0.062], [0.042, 0.016], [0.0, 0.016]].map(([x, y]) => new THREE.Vector2(x, y));
    for (const [s, h] of P.halves) {
      if (!noSaucer) mesh(new THREE.CylinderGeometry(0.11, 0.085, 0.012, 32, 1, false, TH(s), Math.PI), china, h, 0, 0.006, 0);
      mesh(new THREE.LatheGeometry(prof, 32, TH(s), Math.PI), china, h, 0, 0.012, 0).material.side = THREE.DoubleSide;
      mesh(new THREE.CylinderGeometry(0.0675, 0.0675, 0.012, 32, 1, true, TH(s), Math.PI), band, h, 0, 0.098, 0).material.side = THREE.DoubleSide;
      if (s > 0) { const hd = mesh(new THREE.TorusGeometry(0.03, 0.009, 8, 20, Math.PI * 1.3), china, h, 0.075, 0.07, 0); hd.rotation.z = -Math.PI * 0.65; }
    }
    // the tea, its surface rises and falls with `fill`, and a puddle that spreads with `spill`
    // mended: true draws gold seams where it broke (down the front and back of the cup and across the saucer), like
    // a cup repaired with gold lacquer
    if (P.spec.mended) {
      const gold = mat("#e8b53a", { roughness: 0.28, metalness: 0.85, emissive: new THREE.Color("#6b4a08"), emissiveIntensity: 0.5 });
      const rOut = (y) => { for (let i = 1; i < 5; i++) { const [x0, y0] = [prof[i - 1].x, prof[i - 1].y], [x1, y1] = [prof[i].x, prof[i].y]; if (y <= y1) return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0 || 1); } return 0.07; };
      for (const side of [0, Math.PI]) {
        const pts = [];
        for (let i = 0; i <= 7; i++) { const y = 0.004 + (0.094 * i) / 7, a = side + (i % 2 ? 0.11 : -0.06) * (i === 0 || i === 7 ? 0.3 : 1), r = rOut(y) + 0.0015; pts.push(new THREE.Vector3(r * Math.sin(a), 0.012 + y, r * Math.cos(a))); }
        mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.2), 40, 0.0042, 6), gold, P.whole).castShadow = false;
      }
      mesh(new THREE.BoxGeometry(0.004, 0.003, 0.2), gold, P.whole, 0.006, 0.0125, 0).rotation.y = 0.08;
    }
    const tea = mesh(new THREE.CircleGeometry(1, 32), mat("#8a4a1c", { roughness: 0.2 }), P.whole); tea.rotation.x = -Math.PI / 2; tea.castShadow = false;
    const puddle = mesh(new THREE.CircleGeometry(1, 40), mat("#8a4a1c", { roughness: 0.15 }), P.root); puddle.rotation.x = -Math.PI / 2; puddle.castShadow = false;
    const steam = steamWisps(P.whole, 0.115);
    return {
      grip: 0.05, splitApart: 0.06, splitTip: 0.5, splitDrop: 0,
      apply(ps, t) {
        const f = clamp(ps.fill) * (1 - clamp(ps.split * 2)), y = 0.02 + 0.072 * f, r = 0.045 + 0.018 * f;
        tea.visible = f > 0.02; tea.position.y = y; tea.scale.setScalar(r);
        puddle.visible = ps.spill > 0.01; puddle.position.set(0.04, 0.003, 0.03); puddle.scale.set(0.05 + 0.2 * ps.spill, 0.04 + 0.15 * ps.spill, 1);
        steam(ps.steam * f, t);
      },
    };
  },
  saucer(P) {
    mesh(new THREE.CylinderGeometry(0.11, 0.085, 0.012, 32), mat("#f4f1ea", { roughness: 0.35 }), P.whole, 0, 0.006, 0);
    return { grip: 0.006 };
  },
  jar(P) {
    const glass = new THREE.MeshPhysicalMaterial({ color: "#dff3ea", roughness: 0.08, transmission: 0, transparent: true, opacity: 0.32, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false });
    glass.userData.glass = true;   // looks can draw it as stylised glass
    // see-through parts get a fixed draw order (brine, then glass): sorted by distance they swap from frame to frame
    // as things move, and the jar flickers
    const body = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.28, 36, 1, true), glass, P.whole, 0, 0.14, 0); body.castShadow = false; body.renderOrder = 2;
    const base = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.01, 36), glass, P.whole, 0, 0.005, 0); base.castShadow = false; base.renderOrder = 2;
    const brine = new THREE.MeshStandardMaterial({ color: "#c9d97a", transparent: true, opacity: 0.35, roughness: 0.3, depthWrite: false });
    brine.userData.liquid = true;
    // the jar's open mouth: a thicker glass rim and the screw thread under it
    const rim = mesh(new THREE.TorusGeometry(0.108, 0.006, 8, 48), glass, P.whole, 0, 0.28, 0); rim.rotation.x = Math.PI / 2; rim.castShadow = false; rim.renderOrder = 2;
    const thread = mesh(new THREE.CylinderGeometry(0.113, 0.113, 0.018, 36, 1, true), glass, P.whole, 0, 0.262, 0); thread.castShadow = false; thread.renderOrder = 2;
    const liquid = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 32), brine, P.whole, 0, 0.11, 0); liquid.castShadow = false; liquid.renderOrder = 1;
    const pickleM = mat("#5f9a3a", { roughness: 0.5, emissive: new THREE.Color("#b8ff6a"), emissiveIntensity: 0 });
    const pk = mesh(new THREE.CapsuleGeometry(0.045, 0.14, 8, 16), pickleM, P.whole, 0, 0.13, 0); pk.rotation.z = 0.25;
    pk.visible = !P.spec.empty;   // empty: the pickle is a prop of its own (kind pickle) so it can leave the jar
    for (let i = 0; i < 6; i++) { const b = mesh(new THREE.SphereGeometry(0.009, 8, 6), pickleM, pk, Math.cos(i * 2.1) * 0.042, -0.06 + i * 0.024, Math.sin(i * 2.1) * 0.042); b.castShadow = false; }
    const lid = jarLid(P.whole); lid.visible = !P.spec.noLid;   // noLid: the lid is a prop of its own (kind lid) so it can fall
    const light = new THREE.PointLight("#c8ff7a", 0, 1.6, 2); light.position.set(0, 0.15, 0.05); P.whole.add(light);
    return {
      grip: 0.14,
      apply(ps, t) {
        const g = clamp(ps.glow), pulse = 1 + 0.12 * Math.sin(t * 9);
        pickleM.emissiveIntensity = 1.4 * g * pulse; light.intensity = 2.2 * g * pulse;
        // the lid hops off and comes to rest on its edge against the jar (it used to stay 0.5 m up in the air, where
        // it went through the face of whoever stood next to the jar)
        const l = clamp(ps.lid);
        // twist: degrees the lid has turned on the thread (positive is anticlockwise seen from above, the way it opens)
        // lidSide: -1 puts it down on the jar's left instead of its right
        const sd = P.spec.lidSide ?? 1;
        lid.position.set(sd * 0.155 * l, 0.3 + (0.12 - 0.3) * l + 0.22 * Math.sin(l * Math.PI), 0.02 * l); lid.rotation.set(0.2 * l, ((ps.twist || 0) * Math.PI) / 180, -sd * 1.45 * l);
      },
    };
  },
  // the jar's lid on its own, for a { noLid: true } jar: grabbed with the jar (same hand, no offset) it sits on the
  // jar's thread; released, it can fly off and land flat on the ground (y 0). twist turns it on the thread, lid
  // (0..1) lifts it a little off the thread (a rattle), spin (degrees) flips it end over end
  lid(P) {
    const flip = new THREE.Group(); flip.position.y = 0.0225; P.whole.add(flip);
    const lid = jarLid(flip);
    return { grip: -0.1375, apply(ps) { flip.position.y = 0.0225 + 0.05 * clamp(ps.lid); flip.rotation.set(((ps.spin || 0) * Math.PI) / 180, 0, -0.3 * clamp(ps.lid)); lid.rotation.y = ((ps.twist || 0) * Math.PI) / 180; } };
  },
  // the jar's pickle on its own, to fly out of an { empty: true } jar; spin (degrees) tumbles it end over end
  pickle(P) {
    // a deeper green with lighter warts all round, so it still reads as a pickle when it is small or seen flat
    const m = mat("#4c8a2c", { roughness: 0.5 }), wart = mat("#7cb64a", { roughness: 0.5 }), tumble = new THREE.Group(); tumble.position.y = 0.115; P.whole.add(tumble);
    const pk = mesh(new THREE.CapsuleGeometry(0.045, 0.14, 8, 16), m, tumble, 0, 0, 0); pk.rotation.z = 0.25;
    for (let i = 0; i < 14; i++) { const y = -0.075 + (i / 13) * 0.15, r = 0.044 - 0.012 * Math.max(0, Math.abs(y) - 0.06) / 0.015; const b = mesh(new THREE.SphereGeometry(0.0085, 8, 6), wart, pk, Math.cos(i * 2.4) * r, y, Math.sin(i * 2.4) * r); b.castShadow = false; }
    return { grip: 0.115, apply(ps) { tumble.rotation.x = ((ps.spin || 0) * Math.PI) / 180; } };
  },
  cookie(P) {
    const dough = mat("#d39a52", { roughness: 0.85 }), chip = mat("#3b2416", { roughness: 0.7 });
    const chips = [[0.03, 0.02], [-0.04, 0.03], [0.01, -0.04], [-0.02, -0.01], [0.05, -0.02], [-0.05, -0.03]];
    for (const [s, h] of P.halves) {
      mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.022, 32, 1, false, TH(s), Math.PI), dough, h, 0, 0.011, 0);
      for (const [x, z] of chips) if (Math.sign(x) === s) mesh(new THREE.SphereGeometry(0.011, 8, 6), chip, h, x, 0.022, z).scale.y = 0.5;
    }
    return { grip: 0.01, splitApart: 0.04, splitTip: 0.25, splitDrop: 0 };
  },
  plate(P) {
    const china = mat("#f7f5ef", { roughness: 0.35 }), rim = mat("#3d8fb0", { roughness: 0.4 });
    for (const [s, h] of P.halves) {
      mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.018, 40, 1, false, TH(s), Math.PI), china, h, 0, 0.009, 0);
      mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.004, 40, 1, true, TH(s), Math.PI), rim, h, 0, 0.019, 0).material.side = THREE.DoubleSide;
    }
    return { grip: 0.01, splitApart: 0.06, splitTip: 0.3, splitDrop: 0 };
  },
  // a wrapped present with a ribbon and bow; `lid` 0..1 lifts the lid off and puts it down beside the box (hinge: true
  // flips it open on its back edge instead, which works while someone holds the box). The box is open under the lid,
  // so a prop placed inside (at the box's y + 0.008) is hidden until it opens.
  // spec: { w: 0.24 (width and depth), h: 0.18, color, ribbon, hinge }
  gift(P) {
    const w = P.spec.w ?? 0.24, hgt = P.spec.h ?? 0.18, T = 0.008;
    const paper = mat(P.spec.color || "#e0475b", { roughness: 0.55 }), band = mat(P.spec.ribbon || "#ffd23f", { roughness: 0.35, metalness: 0.15 });
    const inside = mat("#f2e6cf", { roughness: 0.9 });
    mesh(new THREE.BoxGeometry(w, T, w), paper, P.whole, 0, T / 2, 0);
    for (const [x, z, bw, bd] of [[0, w / 2 - T / 2, w, T], [0, -w / 2 + T / 2, w, T], [w / 2 - T / 2, 0, T, w], [-w / 2 + T / 2, 0, T, w]]) {
      mesh(new THREE.BoxGeometry(bw, hgt, bd), paper, P.whole, x, hgt / 2, z);
      // the ribbon runs up the middle of each side; the inside of the walls is plain card
      mesh(new THREE.BoxGeometry(bw > T ? 0.036 : T + 0.003, hgt, bd > T ? 0.036 : T + 0.003), band, P.whole, x, hgt / 2, z);
      mesh(new THREE.BoxGeometry(bw > T ? bw - 2 * T : 0.002, hgt - T, bd > T ? bd - 2 * T : 0.002), inside, P.whole, x - Math.sign(x) * (T / 2 + 0.001), hgt / 2 + T / 2, z - Math.sign(z) * (T / 2 + 0.001)).castShadow = false;
    }
    const LW = w + 0.02, LH = 0.05, hinge = !!P.spec.hinge;
    // the lid's parts sit in `top`; a hinged lid turns about its back edge (the `lid` group sits on that edge)
    const lid = new THREE.Group(), top = new THREE.Group(); P.whole.add(lid); lid.add(top);
    if (hinge) { lid.position.set(0, hgt - LH * 0.4, -LW / 2); top.position.z = LW / 2; }
    mesh(new THREE.BoxGeometry(LW, LH, LW), paper, top, 0, LH / 2, 0);
    mesh(new THREE.BoxGeometry(0.036, LH + 0.003, LW + 0.003), band, top, 0, LH / 2, 0);
    mesh(new THREE.BoxGeometry(LW + 0.003, LH + 0.003, 0.036), band, top, 0, LH / 2, 0);
    for (const s of [-1, 1]) { const loop = mesh(new THREE.TorusGeometry(0.045, 0.014, 8, 20), band, top, s * 0.04, LH + 0.035, 0); loop.rotation.set(0, Math.PI / 2, s * 0.5); loop.scale.set(1, 0.75, 1); }
    mesh(new THREE.SphereGeometry(0.022, 12, 8), band, top, 0, LH + 0.012, 0);
    return {
      grip: hgt * 0.5,
      apply(ps) {
        const l = clamp(ps.lid);
        if (hinge) { lid.rotation.x = -1.95 * l; return; }
        // up, over to the right and down onto whatever the box stands on, with a little tip on the way
        lid.position.set((w / 2 + LW / 2 + 0.03) * l, (hgt - LH * 0.4) * (1 - l) + 0.2 * Math.sin(l * Math.PI), 0.02 * l);
        lid.rotation.set(0, 0.3 * l, -0.5 * Math.sin(l * Math.PI));
      },
    };
  },
  // a phone, its screen facing +z (rot 180 turns the screen to the holder for a selfie); `glow` lights the screen;
  // spec.case colours its back and sides (a phone case), so it reads against dark mitten hands. style "iphone" builds
  // a modern iPhone instead (iphone() below), the one that can play pictures on its screen
  phone(P) {
    if (P.spec.style === "iphone") return iphone(P);
    const BODY = P.spec.case ?? "#23242c", body = mat(BODY, { roughness: P.spec.case ? 0.6 : 0.35, metalness: P.spec.case ? 0 : 0.4 });
    mesh(new THREE.BoxGeometry(0.078, 0.155, 0.012), body, P.whole, 0, 0.0775, 0);
    const screenM = new THREE.MeshStandardMaterial({ color: "#1c3a52", roughness: 0.2, emissive: new THREE.Color("#8fd0ff"), emissiveIntensity: 0.25 });
    mesh(new THREE.PlaneGeometry(0.068, 0.138), screenM, P.whole, 0, 0.0775, 0.0062).castShadow = false;
    // the camera bump on the back
    mesh(new THREE.BoxGeometry(0.03, 0.03, 0.006), mat("#3a3c46", { roughness: 0.3 }), P.whole, -0.016, 0.13, -0.008);
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.004, 16), mat("#0b0b10", { roughness: 0.1, metalness: 0.6 }), P.whole, -0.016, 0.13, -0.012).rotation.x = Math.PI / 2;
    return { grip: 0.05, apply(ps) { const bu = clamp(ps.burn ?? 0); screenM.emissiveIntensity = (0.25 + 1.2 * clamp(ps.glow)) * (1 - bu); body.color.set(BODY).lerp(new THREE.Color("#0c0a09"), bu); screenM.color.set("#1c3a52").lerp(new THREE.Color("#050505"), bu); } };
  },
  // a round cake with icing, drips, berries and candles; `lit` 0..1 lights the candles (their flames light the
  // faces round it: in a dark room they are the only light). It splits into two halves (a cut)
  cake(P) {
    const sponge = mat("#e9b97a", { roughness: 0.8 }), icing = mat("#fff3e4", { roughness: 0.5 }), drip = mat("#f07fa6", { roughness: 0.4 });
    const berry = mat("#c4213f", { roughness: 0.3 }), wax = [mat("#7ec8e3", { roughness: 0.5 }), mat("#ffd23f", { roughness: 0.5 }), mat("#f07fa6", { roughness: 0.5 })];
    const R0 = 0.16, H0 = 0.1;
    for (const [s, h] of P.halves) {
      mesh(new THREE.CylinderGeometry(R0, R0, H0, 40, 1, false, TH(s), Math.PI), icing, h, 0, H0 / 2, 0);
      // the cut face: sponge with a layer of cream (only seen once it is cut)
      const face = mesh(new THREE.PlaneGeometry(2 * R0 - 0.004, H0 - 0.004), sponge, h, s * 0.001, H0 / 2, 0); face.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2; face.castShadow = false;
      const cream = mesh(new THREE.PlaneGeometry(2 * R0 - 0.01, 0.016), icing, h, s * 0.0015, H0 * 0.5, 0); cream.rotation.y = face.rotation.y; cream.castShadow = false;
      mesh(new THREE.CylinderGeometry(R0 + 0.006, R0 + 0.006, 0.026, 40, 1, false, TH(s), Math.PI), drip, h, 0, H0 - 0.012, 0);
      for (let i = 0; i < 7; i++) { const a = TH(s) + ((i + 0.5) / 7) * Math.PI, d = mesh(new THREE.CapsuleGeometry(0.009, 0.018 + 0.012 * ((i * 7) % 3), 4, 8), drip, h, (R0 + 0.004) * Math.sin(a), H0 - 0.035, (R0 + 0.004) * Math.cos(a)); d.castShadow = false; }
      for (let i = 0; i < 5; i++) { const a = TH(s) + ((i + 0.5) / 5) * Math.PI; mesh(new THREE.SphereGeometry(0.016, 10, 8), berry, h, 0.12 * Math.sin(a), H0 + 0.012, 0.12 * Math.cos(a)); }
    }
    // candles stand on one half or the other (x != 0), so a cut never goes through one
    const flameM = new THREE.MeshBasicMaterial({ color: "#ffd27a" }), coreM = new THREE.MeshBasicMaterial({ color: "#fff6dc" }), flames = [];
    [[-0.07, 0.03], [0.07, 0.03], [-0.035, -0.06], [0.035, -0.06], [0.0, 0.075]].forEach(([x, z], i) => {
      const h = P.halves[x < 0 || (x === 0 && i % 2) ? 1 : 0][1];
      mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.075, 10), wax[i % 3], h, x + (x === 0 ? 0.012 : 0), H0 + 0.037, z);
      const fl = new THREE.Group(); fl.position.set(x + (x === 0 ? 0.012 : 0), H0 + 0.09, z); h.add(fl);
      const outer = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), flameM); outer.scale.set(1, 1.9, 1); fl.add(outer);
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), coreM); core.position.y = -0.004; core.scale.set(1, 1.6, 1); fl.add(core);
      flames.push(fl);
    });
    const light = new THREE.PointLight("#ffb36b", 0, 3.2, 1.6); light.position.set(0, H0 + 0.16, 0.06); P.whole.add(light);
    return {
      grip: H0 * 0.5, splitApart: 0.05, splitTip: 0.12, splitDrop: 0,
      apply(ps, t) {
        const l = clamp(ps.lit), fl = 1 + 0.08 * Math.sin(t * 13.1) + 0.05 * Math.sin(t * 21.7 + 1);
        flames.forEach((f, i) => { f.visible = l > 0.02; f.scale.set(l, l * (1 + 0.1 * Math.sin(t * 17 + i * 2.1)), l); });
        light.intensity = 3.2 * l * fl;
      },
    };
  },
  // a string of bunting with one letter per flag, hung across at height y (spec: text, width: 1.6, sag: 0.12)
  banner(P) {
    const text = [...(P.spec.text ?? "SURPRISE!")], W0 = P.spec.width ?? 1.6, sag = P.spec.sag ?? 0.12, n = text.length;
    const cols = ["#e0475b", "#ffd23f", "#3d8fb0", "#6cbf3a", "#f07fa6"];
    const at = (u) => new THREE.Vector3((u - 0.5) * W0, -sag * 4 * u * (1 - u), 0);
    const pts = Array.from({ length: 21 }, (_, i) => at(i / 20));
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.005, 6), mat("#f4f1ea"), P.whole).castShadow = false;
    const fw = Math.min(0.17, (W0 / (n + 1)) * 0.92), fh = fw * 1.3;
    const tri = new THREE.Shape(); tri.moveTo(-fw / 2, 0); tri.lineTo(fw / 2, 0); tri.lineTo(0, -fh); tri.closePath();
    text.forEach((ch, i) => {
      const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
      g.fillStyle = cols[i % cols.length]; g.fillRect(0, 0, 128, 128);
      g.fillStyle = "#ffffff"; g.font = "900 64px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(ch, 64, 40);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const geo = new THREE.ShapeGeometry(tri), uv = geo.attributes.uv, pos = geo.attributes.position;
      for (let k = 0; k < pos.count; k++) uv.setXY(k, (pos.getX(k) + fw / 2) / fw, 1 + pos.getY(k) / fw);
      const f = mesh(geo, mat("#ffffff", { map: tex, roughness: 0.8, side: THREE.DoubleSide }), P.whole);
      const p = at((i + 1) / (n + 1)); f.position.copy(p); f.rotation.z = (((i * 37) % 5) - 2) * 0.03; f.castShadow = false;
    });
    return { grip: 0 };
  },
  // a wall clock (it faces +z). Its y is the clock's middle
  clock(P) {
    const hands = [];
    const red = mat("#c0392b", { roughness: 0.5 }), face = mat("#f4efe2", { roughness: 0.6 }), ink = mat("#11101c");
    for (const [s, h] of P.halves) {
      const r = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 40, 1, false, TH(s), Math.PI), red, h); r.rotation.x = Math.PI / 2;
      const f = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.062, 40, 1, false, TH(s), Math.PI), face, h); f.rotation.x = Math.PI / 2;
      // hour hand on the left half, minute hand on the right
      const [l, w] = s < 0 ? [0.1, 0.02] : [0.16, 0.012];
      const hnd = new THREE.Mesh(new THREE.BoxGeometry(w, l, 0.006), ink); hnd.geometry.translate(0, l / 2, 0); hnd.position.z = 0.036; h.add(hnd);
      hands.push([s, hnd]);
    }
    // time (hours, default 2.75) sets the hands; tween it to make them race
    return { grip: 0, splitApart: 0.08, splitTip: 0.6, splitDrop: 0.35, apply(ps) { const tm = ps.time ?? 2.75; for (const [s, hnd] of hands) hnd.rotation.z = -(s < 0 ? ((tm % 12) / 12) : (tm % 1)) * Math.PI * 2; } };
  },
  // a wooden garden gate of two leaves hinged on posts at x = ±0.75 (it faces +z, the camera side), for the GATE clip.
  //   open 0..1: both leaves swing open towards the camera; latch 0..1: the latch bar is shot off and spins away;
  //   slice 0..1: the top of both leaves slides off a diagonal cut and drops; smash 0..1: the leaves blow back and
  //   tumble with splinters; scorch 0..1: the wood chars black. Reset a beat with a "prop" set at dur 0.
  gate(P) {
    const wood = mat("#c98a55", { roughness: 0.75 }), dark = mat("#8a5530", { roughness: 0.8 }), iron = mat("#2c2a30", { metalness: 0.5, roughness: 0.4 });
    const W = 0.75, Hh = 0.72, CUT = 0.4;
    const woods = [wood, dark], base = woods.map((m) => m.color.clone());
    const leaves = [];
    for (const [s, h] of P.halves) {
      // the post, then the leaf on its hinge; the leaf's top part is a separate group so it can slide off
      mesh(new THREE.BoxGeometry(0.12, Hh + 0.2, 0.12), dark, h, s * (W + 0.06), (Hh + 0.2) / 2, 0);
      mesh(new THREE.SphereGeometry(0.08, 12, 8), dark, h, s * (W + 0.06), Hh + 0.24, 0);
      const hinge = new THREE.Group(); hinge.position.set(s * W, 0, 0); h.add(hinge);
      const lower = new THREE.Group(), upper = new THREE.Group(); hinge.add(lower, upper);
      for (let i = 0; i < 4; i++) {
        const x = -s * (0.09 + i * 0.185);
        mesh(new THREE.BoxGeometry(0.17, CUT - 0.08, 0.05), wood, lower, x, 0.08 + (CUT - 0.08) / 2, 0);
        mesh(new THREE.BoxGeometry(0.17, Hh - CUT, 0.05), wood, upper, x, CUT + (Hh - CUT) / 2, 0);
      }
      mesh(new THREE.BoxGeometry(W - 0.02, 0.1, 0.05), dark, lower, -s * W / 2, 0.18, 0.04);
      mesh(new THREE.BoxGeometry(W - 0.02, 0.1, 0.05), dark, upper, -s * W / 2, Hh - 0.15, 0.04);
      for (const y of [0.18, Hh - 0.15]) mesh(new THREE.BoxGeometry(0.16, 0.05, 0.06), iron, y < CUT ? lower : upper, -s * 0.06, y, 0.06);
      if (s < 0) {   // a little "KEEP OUT" sign on the left leaf (it goes wherever the leaf's top goes)
        const c = document.createElement("canvas"); c.width = 256; c.height = 128; const g = c.getContext("2d");
        g.fillStyle = "#f4ead2"; g.fillRect(0, 0, 256, 128); g.strokeStyle = "#b8332a"; g.lineWidth = 10; g.strokeRect(5, 5, 246, 118);
        g.fillStyle = "#b8332a"; g.font = "900 54px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("KEEP OUT", 128, 66);
        const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
        const sign = mesh(new THREE.PlaneGeometry(0.34, 0.17), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }), upper, -s * W / 2, CUT + 0.1, 0.065); sign.rotation.z = 0.05;
      }
      leaves.push({ s, hinge, lower, upper });
    }
    const latch = new THREE.Group(); latch.position.set(0, 0.36, 0.08); P.whole.add(latch);
    mesh(new THREE.BoxGeometry(0.3, 0.05, 0.04), iron, latch); mesh(new THREE.BoxGeometry(0.05, 0.12, 0.05), iron, latch, 0.13, 0, 0);
    // splinters: hidden until the gate is smashed
    const r = (k) => ((Math.sin(k * 127.1) * 43758.5453) % 1 + 1) % 1;
    const bits = Array.from({ length: 16 }, (_, i) => {
      const m = mesh(new THREE.BoxGeometry(0.05 + r(i) * 0.08, 0.2 + r(i + 9) * 0.3, 0.03), i % 3 ? wood : dark, P.root);
      return { m, vx: (r(i + 3) - 0.5) * 4, vy: 2.5 + r(i + 5) * 3, vz: -1.5 - r(i + 7) * 2.5, spin: (r(i + 11) - 0.5) * 20, y0: 0.1 + r(i + 13) * 0.55 };
    });
    return {
      grip: 0.6,
      apply(ps) {
        const op = clamp(ps.open ?? 0), sm = clamp(ps.smash ?? 0), sl = clamp(ps.slice ?? 0), la = clamp(ps.latch ?? 0), sc = clamp(ps.scorch ?? 0);
        for (const { s, hinge, upper } of leaves) {
          hinge.rotation.set(0, s * 1.75 * op, 0); hinge.position.set(s * W, 0, 0);
          if (sm > 0) {   // blown back from the middle in one tumble, landing flat on the lawn behind (and staying there)
            const k = ease("out")(sm);
            hinge.position.set(s * (W + 1.1 * k), 0.03 + 1.6 * sm * (1 - sm), -2.3 * k);
            hinge.rotation.set(-(Math.PI / 2 + Math.PI * 2) * k, s * 0.5 * k, 0);
          }
          // the cut runs down towards the middle: the top slides along it, then tips over backwards and lies flat
          const k1 = clamp(sl * 2), k2 = ease("in")(clamp(sl * 2 - 1));
          upper.position.set(-s * 0.2 * k1, -0.06 * k1 * (1 - k2) + 0.03 * k2, -0.05 * k2);
          upper.rotation.set(-(Math.PI / 2) * k2, 0, s * 0.3 * k1 * (1 - k2));
        }
        // the latch is shot up and away, out of frame
        latch.visible = la < 1 && sm === 0;
        latch.position.set(1.5 * la, 0.36 + 2.6 * la, 0.08 + 0.3 * la); latch.rotation.z = 9 * la;
        // splinters fly, land and stay where they land
        for (const b of bits) {
          const land = (b.vy + Math.sqrt(b.vy * b.vy + 4 * 4.9 * (b.y0 - 0.02))) / (2 * 4.9), tt = Math.min(sm * 1.1, land);
          b.m.visible = sm > 0;
          b.m.position.set(b.vx * tt, Math.max(0.02, b.y0 + b.vy * tt - 4.9 * tt * tt), b.vz * tt); b.m.rotation.set(b.spin * tt, b.spin * 0.6 * tt, b.spin * 0.3 * tt);
        }
        woods.forEach((m, i) => m.color.copy(base[i]).lerp(new THREE.Color("#2a1d16"), sc * 0.85));
      },
    };
  },
  // a glowing green portal standing upright (it faces +z); open 0..1 grows it from a point
  portal(P) {
    const glowM = new THREE.MeshBasicMaterial({ color: "#7dff6a" }), coreM = new THREE.MeshBasicMaterial({ color: "#1c5e2a", transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    const g = new THREE.Group(); g.position.y = 0.6; P.whole.add(g);
    const ring = mesh(new THREE.TorusGeometry(0.55, 0.06, 12, 48), glowM, g); ring.castShadow = false;
    const core = mesh(new THREE.CircleGeometry(0.55, 48), coreM, g); core.castShadow = false;
    const swirl = mesh(new THREE.TorusGeometry(0.32, 0.025, 8, 40, Math.PI * 1.4), glowM, g); swirl.castShadow = false;
    const light = new THREE.PointLight("#8dff7a", 0, 3, 2); light.position.set(0, 0, 0.3); g.add(light);
    return {
      grip: 0,
      apply(ps, t) {
        const o = clamp(ps.open ?? 0); g.visible = o > 0.01; g.scale.set(o, o * (0.9 + 0.1 * Math.sin(t * 7)), o);
        swirl.rotation.z = t * 6; light.intensity = 0.3 * o;
      },
    };
  },
  // a lightning bolt from the sky down to the prop's spot; on 0..1 (it flickers while on)
  bolt(P) {
    const m = new THREE.MeshBasicMaterial({ color: "#e9f6ff" }), halo = new THREE.MeshBasicMaterial({ color: "#7fc8ff", transparent: true, opacity: 0.5 });
    const pts = [[0, 4.5], [0.25, 3.7], [-0.15, 3.0], [0.3, 2.2], [-0.1, 1.4], [0.2, 0.7], [0, 0]];
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], len = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(x1 - x0, y1 - y0);
      for (const [mm, rr] of [[m, 0.035], [halo, 0.1]]) { const c = mesh(new THREE.CylinderGeometry(rr, rr, len, 8), mm, P.whole, (x0 + x1) / 2, (y0 + y1) / 2, 0); c.rotation.z = -ang; c.castShadow = false; segs.push(c); }
    }
    const light = new THREE.PointLight("#bfe4ff", 0, 6, 1.5); light.position.set(0, 1, 0.5); P.whole.add(light);
    // steady while on: a flickering bolt reads as a render glitch
    return { grip: 0, apply(ps) { const on = clamp(ps.on ?? 0) > 0.5; P.whole.visible = on; light.intensity = on ? 5 : 0; } };
  },
  // flames licking up from the prop's spot (put it on the hedge top); fire 0..1 grows them
  flames(P) {
    // many slim tongues in three colours, each flickering on its own phase, inner ones taller
    const cols = ["#ff5a1f", "#ff8a2a", "#ffc23d", "#ffe27a"].map((c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.88, depthWrite: false }));
    const r = (k) => ((Math.sin(k * 91.7) * 43758.5453) % 1 + 1) % 1;
    const fl = Array.from({ length: 22 }, (_, i) => {
      const x = (r(i) - 0.5) * 0.9, z = (r(i + 40) - 0.5) * 0.35, inner = 1 - Math.abs(x) / 0.45;
      const c = mesh(new THREE.ConeGeometry(0.035 + 0.03 * r(i + 7), 1, 8), cols[i % 4], P.whole, x, 0, z); c.castShadow = false;
      return { c, h: 0.18 + 0.32 * inner * (0.6 + 0.4 * r(i + 3)), ph: r(i + 9) * 6.28, sp: 9 + r(i + 11) * 8 };
    });
    const light = new THREE.PointLight("#ff8a3a", 0, 4, 1.6); light.position.set(0, 0.4, 0.3); P.whole.add(light);
    return {
      grip: 0,
      apply(ps, t) {
        const f = clamp(ps.fire ?? 0); P.whole.visible = f > 0.01; light.intensity = 2.5 * f;
        for (const q of fl) { const k = Math.max(0.01, f * q.h * (0.8 + 0.25 * Math.sin(t * q.sp + q.ph))); q.c.scale.set(1, k, 1); q.c.position.y = k / 2; }
      },
    };
  },
  // a pizza on a wooden board, cut in 10 slices; slices 0..10 is how many are still on it (slice i sits at i*36 degrees,
  // so a "slice" prop with rot i*36 at the same spot covers the one that was just taken, without a pop)
  pizza(P) {
    const board = mat("#c48a52", { roughness: 0.7 });
    mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.025, 48), board, P.whole, 0, 0.0125, 0);
    const handle = mesh(new THREE.BoxGeometry(0.1, 0.025, 0.16), board, P.whole, 0, 0.0125, 0.42);
    const slices = Array.from({ length: 10 }, (_, i) => { const g = sliceMesh(); g.rotation.y = (i * 36 * Math.PI) / 180; g.position.y = 0.025; P.whole.add(g); return g; });
    return {
      grip: 0.03,
      apply(ps) { const n = Math.round(clamp(ps.slices ?? 10, 0, 10)); slices.forEach((g, i) => (g.visible = i < n)); handle.visible = true; },
    };
  },
  // one slice, its tip at the origin: with rot -18 it points straight at +z (the camera), with rot i*36 it covers slice i;
  // toast 0..1 browns it (a dragon's breath)
  slice(P) {
    const g = sliceMesh(); P.whole.add(g);
    const mats = []; g.traverse((o) => { if (o.material && !mats.includes(o.material)) mats.push(o.material); });
    const base = mats.map((m) => m.color.clone());
    return { grip: 0.0, apply(ps) { mats.forEach((m, i) => m.color.copy(base[i]).lerp(new THREE.Color("#5a2f12"), clamp(ps.toast ?? 0) * 0.55)); } };
  },
  // a red-and-white checked tablecloth for a table prop at the same spot (same scale): it drapes over the top's edges
  cloth(P) {
    const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
    x.fillStyle = "#ffffff"; x.fillRect(0, 0, 128, 128); x.fillStyle = "rgba(200,40,40,0.9)";
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2 === 0) x.fillRect(i * 16, j * 16, 16, 16);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2);
    const m = mat("#ffffff", { map: t, roughness: 0.8 });
    mesh(new THREE.BoxGeometry(1.16, 0.012, 0.76), m, P.whole, 0, TABLE_Y + 0.006, 0);
    for (const s of [-1, 1]) { mesh(new THREE.BoxGeometry(1.16, 0.16, 0.012), m, P.whole, 0, TABLE_Y - 0.07, s * 0.38); mesh(new THREE.BoxGeometry(0.012, 0.16, 0.76), m, P.whole, s * 0.58, TABLE_Y - 0.07, 0); }
    return { grip: 0 };
  },
  // a string of melted cheese from its origin (at the mouth) `len` metres along +z, turned with rot/tilt like any prop
  cheese(P) {
    const c = mesh(new THREE.CylinderGeometry(0.012, 0.018, 1, 8), mat("#f7c84a", { roughness: 0.5 }), P.whole, 0, 0, 0.5);
    c.rotation.x = Math.PI / 2; c.castShadow = false;
    return { grip: 0, apply(ps) { const L = Math.max(ps.len ?? 0, 0.0001); c.scale.set(1, L, 1); c.position.z = L / 2; c.visible = L > 0.002; } };
  },
  tree(P) {
    const bark = mat("#8b5e3c", { roughness: 0.85 }), barkD = mat("#6f4a2e", { roughness: 0.9 }), leaf = ["#5cbf55", "#6fcd5e", "#4eae52"].map((c) => mat(c, { roughness: 0.8 }));
    mesh(new THREE.CylinderGeometry(0.15, 0.21, 2.15, 18), bark, P.whole, 0, 1.075, 0);
    for (let k = 0; k < 5; k++) { const r = mesh(new THREE.SphereGeometry(0.11, 12, 8), barkD, P.whole, Math.cos(k * 1.3) * 0.18, 0.03, Math.sin(k * 1.3) * 0.18); r.scale.set(1.3, 0.45, 1.3); }   // roots
    for (const [y, a] of [[0.7, 0.4], [1.3, 2.6], [0.45, 4.2]]) mesh(new THREE.TorusGeometry(0.05, 0.015, 8, 14), barkD, P.whole, Math.cos(a) * 0.19, y, Math.sin(a) * 0.19).lookAt(Math.cos(a) * 2, y, Math.sin(a) * 2);   // knots
    const crown = [[0, 2.45, -0.12, 0.62], [-0.48, 2.2, -0.05, 0.42], [0.5, 2.22, -0.08, 0.45], [-0.25, 2.75, -0.2, 0.45], [0.3, 2.78, -0.15, 0.42], [0.05, 2.25, 0.2, 0.38]];
    crown.forEach(([x, y, z, r], i) => mesh(new THREE.SphereGeometry(r, 22, 16), leaf[i % 3], P.whole, x, y, z));
    const red = mat("#e2322b", { roughness: 0.35 }), stemM = mat("#5a3b1f"), leafM = mat("#5cbf55");
    const apples = TREE_APPLES.map(([x, y, z]) => { const a = appleMesh(red, stemM, leafM); a.position.set(x, y, z); P.whole.add(a); return a; });
    const steps = TREE_STEPS.map((y) => { const b = mesh(new THREE.BoxGeometry(0.16, 0.035, 0.2), mat("#c79a64", { roughness: 0.7 }), P.whole, -0.2, y, 0); return b; });
    return {
      grip: 0,
      apply(ps) {
        const n = clamp(ps.apples ?? 10, 0, 10);
        apples.forEach((a, i) => { const k = clamp(n - i); a.visible = k > 0.002; a.scale.setScalar(Math.max(k, 0.001)); });
        const st = clamp(ps.steps ?? 0);
        steps.forEach((b, k) => { const q = clamp(st * 5 - k); b.visible = q > 0.002; b.scale.set(Math.max(q, 0.001), 1, 1); b.position.x = -0.15 - 0.06 * q; });
      },
    };
  },
  // one apple (its middle at the origin), the size of the tree's
  apple(P) { P.whole.add(appleMesh(mat("#e2322b", { roughness: 0.35 }), mat("#5a3b1f"), mat("#5cbf55"))); return { grip: 0 }; },
  // a city bus for the BUS clip, seen from its near (+z) side. Its origin is on the ground at the middle of the front
  // door, on the near side: the bus runs from x -3.35 (rear) to +0.55 (front, facing +x) and from z 0 back to z -1.
  //   open 0..1 slides the door's two leaves apart; full 0..1 fills the windows with squashed passengers;
  //   bulge 0..1 puffs the body out (too many on board); the wheels turn with the bus's x (drive it with "prop" x tweens)
  bus(P) {
    const paint = mat("#f2b51f", { roughness: 0.45 }), white = mat("#f7f4ec", { roughness: 0.5 }), dark = mat("#2d3340", { roughness: 0.6 });
    const glass = mat("#3a5a78", { roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.82 }), tyre = mat("#22232a", { roughness: 0.9 }), hub = mat("#c9ccd3", { metalness: 0.4, roughness: 0.35 });
    const body = new THREE.Group(); P.whole.add(body);
    const X0 = -3.35, X1 = 0.55, L = X1 - X0, XC = (X0 + X1) / 2, B = 0.2, T = 1.6, D = 1.0;
    mesh(new THREE.BoxGeometry(L, T - B - 0.05, D), paint, body, XC, (T + B) / 2 - 0.025, -D / 2);
    mesh(new THREE.BoxGeometry(L - 0.06, 0.08, D - 0.06), white, body, XC, T - 0.01, -D / 2);              // the roof
    mesh(new THREE.BoxGeometry(L + 0.02, 0.1, D + 0.02), dark, body, XC, B + 0.04, -D / 2);              // the bumper skirt
    mesh(new THREE.BoxGeometry(L + 0.01, 0.07, 0.02), white, body, XC, 0.72, 0.005);                     // a white stripe
    // the near side's windows: a glass band split by pillars, with squashed passengers behind it (full)
    const win = mesh(new THREE.BoxGeometry(L - 0.9, 0.5, 0.02), glass, body, XC - 0.42, 1.12, 0.012); win.castShadow = false;
    const pax = [];
    const paxM = mat("#e8b878", { roughness: 0.6 }), eyeM = mat("#1c1a24");
    for (let k = 0; k < 6; k++) {
      const x = X0 + 0.45 + k * 0.5;
      if (k < 5) mesh(new THREE.BoxGeometry(0.06, 0.52, 0.03), paint, body, x + 0.25, 1.12, 0.014);
      const f = new THREE.Group(); f.position.set(x, 1.1, 0.004); body.add(f);
      const head = new THREE.Mesh(new THREE.CircleGeometry(0.17, 20), paxM); head.scale.set(1.15, 1, 1); f.add(head);
      for (const ex of [-0.05, 0.05]) { const e = new THREE.Mesh(new THREE.CircleGeometry(0.022, 10), eyeM); e.position.set(ex, 0.03, 0.001); f.add(e); }
      pax.push(f);
    }
    // the windscreen and lights on the front, a dark back window on the rear
    mesh(new THREE.BoxGeometry(0.02, 0.62, D - 0.16), glass, body, X1 + 0.005, 1.08, -D / 2);
    mesh(new THREE.BoxGeometry(0.02, 0.42, D - 0.2), glass, body, X0 - 0.005, 1.12, -D / 2);
    const lamp = new THREE.MeshBasicMaterial({ color: "#fff3b0" }), red = new THREE.MeshBasicMaterial({ color: "#e0352b" });
    for (const z of [-0.12, -D + 0.12]) { mesh(new THREE.SphereGeometry(0.05, 12, 8), lamp, body, X1 + 0.01, 0.42, z); mesh(new THREE.BoxGeometry(0.03, 0.12, 0.06), red, body, X0 - 0.01, 0.48, z); }
    // the route sign above the windows: "10" in orange LEDs
    const c = document.createElement("canvas"); c.width = 256; c.height = 48; const x = c.getContext("2d");
    x.fillStyle = "#15161c"; x.fillRect(0, 0, 256, 48); x.fillStyle = "#ffae2b"; x.font = "900 36px sans-serif"; x.textBaseline = "middle"; x.fillText("10  CITY", 12, 26);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.17), new THREE.MeshBasicMaterial({ map: tx })); sign.position.set(-1.6, 1.47, 0.006); body.add(sign);
    // the front door: a dark doorway and two glass leaves that slide apart
    mesh(new THREE.BoxGeometry(0.58, 1.18, 0.012), dark, body, 0, 0.26 + 0.59, 0.003);
    const leaves = [-1, 1].map((s) => { const l = mesh(new THREE.BoxGeometry(0.28, 1.14, 0.02), glass, body, s * 0.145, 0.85, 0.016); l.castShadow = false; mesh(new THREE.BoxGeometry(0.28, 0.06, 0.022), paint, l, 0, 0.32, 0); return [s, l]; });
    // wheels (with dark arches)
    const wheels = [-0.55, -2.65].map((wx) => {
      mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.02, 24, 1, false, 0, Math.PI), dark, body, wx, 0.26, 0.002).rotation.set(Math.PI / 2, 0, Math.PI / 2);
      const w = new THREE.Group(); w.position.set(wx, 0.26, 0.0); P.whole.add(w);
      const tr = mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.2, 24), tyre, w, 0, 0, -0.08); tr.rotation.x = Math.PI / 2;
      const hb = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 16), hub, w, 0, 0, 0.025); hb.rotation.x = Math.PI / 2;
      for (let k = 0; k < 5; k++) { const n = mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), dark, w, Math.cos(k * 1.2566) * 0.07, Math.sin(k * 1.2566) * 0.07, 0.04); n.castShadow = false; }
      return w;
    });
    return {
      grip: 0,
      apply(ps) {
        const o = clamp(ps.open ?? 0), b = clamp(ps.bulge ?? 0, 0, 1.5), n = clamp(ps.full ?? 0);
        for (const [s, l] of leaves) l.position.x = s * (0.145 + 0.27 * o);
        pax.forEach((f, k) => { f.visible = n > 0.01; f.scale.set(1 + 0.25 * n, 1 - 0.1 * n, 1); f.rotation.z = (k % 2 ? 1 : -1) * 0.12 * n; });
        body.scale.set(1 + 0.04 * b, 1 + 0.18 * b, 1 + 0.3 * b); body.position.y = -0.02 * b;   // puffs up and back (its near side stays put)
        const turn = -(ps.x ?? 0) / (0.26 * Math.max(ps.scale ?? 1, 0.01));
        for (const w of wheels) w.rotation.z = turn;
      },
    };
  },
  // a twin-bell alarm clock (its bottom at the origin, face to +z), built in halves so a blade can split it.
  //   ring 0..1 rattles it on its feet (the hammer blurs between the bells); smash 0..1 squashes it flat
  alarm(P) {
    const red = mat("#d8433a", { roughness: 0.4 }), face = mat("#fbf6ea", { roughness: 0.5 }), metal = mat("#c9ccd3", { roughness: 0.3, metalness: 0.6 }), ink = mat("#1b1a22");
    const halves = [];
    for (const [s, h] of P.halves) {
      const b = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.07, 32, 1, false, TH(s), Math.PI), red, h, 0, 0.14, 0); b.rotation.x = Math.PI / 2;
      const f = mesh(new THREE.CylinderGeometry(0.092, 0.092, 0.072, 32, 1, false, TH(s), Math.PI), face, h, 0, 0.14, 0.002); f.rotation.x = Math.PI / 2;
      const bell = mesh(new THREE.SphereGeometry(0.055, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), metal, h, s * 0.075, 0.245, 0); bell.rotation.z = -s * 0.5;
      mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 6), metal, h, s * 0.08, 0.035, 0).rotation.z = s * 0.4;   // a foot
      const hnd = new THREE.Mesh(new THREE.BoxGeometry(0.012, s > 0 ? 0.07 : 0.05, 0.004), ink); hnd.geometry.translate(0, (s > 0 ? 0.07 : 0.05) / 2, 0);
      hnd.position.set(0, 0.14, 0.04); hnd.rotation.z = s > 0 ? 0.3 : -2.2; h.add(hnd);
      halves.push(h);
    }
    const hammer = new THREE.Group(); hammer.position.set(0, 0.25, 0); P.whole.add(hammer);
    mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 6), metal, hammer, 0, 0.035, 0);
    mesh(new THREE.SphereGeometry(0.014, 8, 6), metal, hammer, 0, 0.07, 0);
    return {
      grip: 0.14, splitApart: 0.1, splitTip: 0.7, splitDrop: 0.1,
      apply(ps, t) {
        const r = clamp(ps.ring ?? 0), q = clamp(ps.smash ?? 0);
        P.whole.rotation.z = r * 0.12 * Math.sin((t ?? 0) * 70); P.whole.position.y = r * 0.012 * Math.abs(Math.sin((t ?? 0) * 35));
        hammer.rotation.z = r * 0.6 * Math.sin((t ?? 0) * 140); hammer.visible = ps.split < 0.05;
        const pulse = 1 + 0.1 * r * Math.abs(Math.sin((t ?? 0) * 22));   // it swells on each rattle, so a ring reads in a still
        P.whole.scale.set((1 + 0.5 * q) * pulse, (1 - 0.75 * q) * pulse, (1 + 0.3 * q) * pulse);
      },
    };
  },
  // a single bed seen from its foot: the origin is where its sleeper sits up (against the pillow), the mattress top is at
  // SEAT_Y so "sit" works, and the bed runs 1.6 m towards +z (the camera). cover 0..1 pulls the blanket up to the
  // sleeper's chest; over 0..1 throws it over their head (a lump); smash 0..1 breaks the legs (it drops, tipped)
  bed(P) {
    const wood = mat("#a8744a", { roughness: 0.7 }), sheet = mat("#f4f1ea", { roughness: 0.8 }), pillowM = mat("#ffffff", { roughness: 0.8 });
    const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
    x.fillStyle = "#5b8fd6"; x.fillRect(0, 0, 128, 128); x.fillStyle = "#ffd75e";
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.beginPath(); x.arc(16 + i * 32 + (j % 2) * 16, 16 + j * 32, 6, 0, 7); x.fill(); }
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(3, 3);
    const blanketM = mat("#ffffff", { map: tx, roughness: 0.85 });
    const top = SEAT_Y, W = 1.1, L = 1.95, Z0 = -0.35;
    const frame = new THREE.Group(); P.whole.add(frame);
    mesh(new THREE.BoxGeometry(W + 0.08, 0.16, L), wood, frame, 0, top - 0.2, Z0 + L / 2);
    mesh(new THREE.BoxGeometry(W, 0.14, L - 0.04), sheet, frame, 0, top - 0.07, Z0 + L / 2);
    mesh(new THREE.BoxGeometry(W + 0.12, 0.95, 0.08), wood, frame, 0, 0.48, Z0 - 0.02);                  // headboard
    mesh(new THREE.BoxGeometry(W + 0.12, 0.42, 0.07), wood, frame, 0, 0.21, Z0 + L);                     // footboard
    const pil = mesh(new THREE.SphereGeometry(0.3, 18, 10), pillowM, frame, 0, top + 0.06, Z0 + 0.14); pil.scale.set(1.45, 0.32, 0.6);
    const legs = [[-1, 0], [1, 0], [-1, 1], [1, 1]].map(([sx, k]) => mesh(new THREE.BoxGeometry(0.08, top - 0.28, 0.08), wood, frame, sx * (W / 2), (top - 0.28) / 2, Z0 + 0.06 + k * (L - 0.12)));
    // the blanket: flat over the bed, and its turned-down top edge that rises to the sleeper's chest
    mesh(new THREE.BoxGeometry(W + 0.06, 0.06, L - 0.5), blanketM, frame, 0, top + 0.02, Z0 + 0.5 + (L - 0.5) / 2);
    const edge = new THREE.Group(); edge.position.set(0, top, 0.16); frame.add(edge);
    const flap = mesh(new THREE.BoxGeometry(W + 0.06, 1, 0.07), blanketM, edge, 0, 0.5, 0);
    const lump = mesh(new THREE.SphereGeometry(0.5, 22, 14), blanketM, frame, 0, top + 0.05, 0.05);
    return {
      grip: 0,
      apply(ps) {
        const cv = clamp(ps.cover ?? 0), ov = clamp(ps.over ?? 0), sm = clamp(ps.smash ?? 0);
        flap.scale.y = Math.max(0.05, 0.08 + 0.32 * cv); flap.position.y = flap.scale.y / 2; edge.visible = cv > 0.02 && ov < 0.98;
        lump.visible = ov > 0.02; lump.scale.set(1.05 * ov, 1.25 * ov, 0.95 * ov);
        for (const l of legs) l.scale.y = Math.max(0.05, 1 - sm);
        frame.position.y = -(top - 0.28) * 0.95 * sm; frame.rotation.z = 0.06 * sm;
      },
    };
  },
  // a bedside table (its top at 0.5) with a drawer; smash 0..1 flattens it
  nightstand(P) {
    const wood = mat("#c58f5e", { roughness: 0.7 }), knob = mat("#6b4423");
    const g = new THREE.Group(); P.whole.add(g);
    mesh(new THREE.BoxGeometry(0.46, 0.5, 0.4), wood, g, 0, 0.25, 0);
    mesh(new THREE.BoxGeometry(0.4, 0.16, 0.02), mat("#d9a676", { roughness: 0.7 }), g, 0, 0.36, 0.205);
    mesh(new THREE.SphereGeometry(0.02, 8, 6), knob, g, 0, 0.36, 0.22);
    return { grip: 0.5, apply(ps) { const q = clamp(ps.smash ?? 0); g.scale.set(1 + 0.3 * q, Math.max(0.05, 1 - 0.85 * q), 1 + 0.2 * q); } };
  },
  // a window's curtains (their middle at the origin, hung at the top y 0.7, 1.4 wide), open 0..1 draws them aside
  curtains(P) {
    const m = mat("#e86f6f", { roughness: 0.85, side: THREE.DoubleSide });
    const panels = [-1, 1].map((s) => { const g = new THREE.Group(); P.whole.add(g); for (let k = 0; k < 4; k++) { const f = mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.4, 10), m, g, s * (0.09 + k * 0.08), 0, 0.03 * (k % 2)); f.castShadow = false; } return [s, g]; });
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.7, 8), mat("#6b4423"), P.whole, 0, 0.72, 0).rotation.z = Math.PI / 2;
    return { grip: 0, apply(ps) { const o = clamp(ps.open ?? 0); for (const [s, g] of panels) { g.position.x = s * (0.0 + 0.5 * o); g.scale.x = 1 - 0.45 * o; } } };
  },
  // a bus-stop bench (its seat at SEAT_Y, like a chair, so "sit" works), facing +z
  bench(P) {
    const slat = mat("#b97a45", { roughness: 0.7 }), metal = mat("#3b4250", { roughness: 0.5, metalness: 0.3 });
    for (let k = 0; k < 3; k++) mesh(new THREE.BoxGeometry(1.2, 0.035, 0.11), slat, P.whole, 0, SEAT_Y - 0.02, 0.13 - k * 0.13);
    for (let k = 0; k < 2; k++) mesh(new THREE.BoxGeometry(1.2, 0.1, 0.03), slat, P.whole, 0, SEAT_Y + 0.2 + k * 0.14, -0.24);
    for (const x of [-0.52, 0.52]) { mesh(new THREE.BoxGeometry(0.05, SEAT_Y - 0.04, 0.4), metal, P.whole, x, (SEAT_Y - 0.04) / 2, -0.03); mesh(new THREE.BoxGeometry(0.04, 0.42, 0.04), metal, P.whole, x, SEAT_Y + 0.18, -0.26); }
    return { grip: 0 };
  },
  // a school desk with its chair: the origin is the chair seat (at SEAT_Y, so "sit" works; the pupil faces +z), the
  // desk top (TABLE_Y) runs from z 0.28 to 0.78 with a front panel facing the camera. Built in halves; smash 0..1
  // breaks the desk top in the middle (both halves fold down into a V)
  schooldesk(P) {
    const top = mat("#e2b36f", { roughness: 0.55 }), metal = mat("#5a6b7d", { roughness: 0.45, metalness: 0.3 }), seat = mat("#4f86cf", { roughness: 0.6 });
    const W = 1.0, Z0 = 0.28, D = 0.5;
    const parts = [];
    for (const [s, h] of P.halves) {
      const g = new THREE.Group(); g.position.set(0, TABLE_Y, Z0 + D / 2); h.add(g); parts.push([s, g]);
      mesh(new THREE.BoxGeometry(W / 2, 0.05, D), top, g, (s * W) / 4, -0.025, 0);
      mesh(new THREE.BoxGeometry(W / 2 - 0.02, 0.3, 0.025), metal, g, (s * W) / 4, -0.2, D / 2 - 0.03);   // the front panel
      mesh(new THREE.BoxGeometry(0.035, TABLE_Y - 0.05, D - 0.08), metal, g, s * (W / 2 - 0.04), -(TABLE_Y - 0.05) / 2 - 0.05, 0);
    }
    mesh(new THREE.BoxGeometry(0.46, 0.04, 0.42), seat, P.whole, 0, SEAT_Y - 0.03, 0);
    mesh(new THREE.BoxGeometry(0.46, 0.32, 0.04), seat, P.whole, 0, SEAT_Y + 0.26, -0.22);
    for (const x of [-0.2, 0.2]) for (const z of [-0.18, 0.18]) mesh(new THREE.CylinderGeometry(0.018, 0.018, SEAT_Y - 0.05, 8), metal, P.whole, x, (SEAT_Y - 0.05) / 2, z);
    return {
      grip: TABLE_Y, splitApart: 0.12, splitTip: 0.3, splitDrop: 0.1,
      apply(ps) { const q = clamp(ps.smash ?? 0); for (const [s, g] of parts) { g.rotation.z = s * 0.55 * q; g.position.y = TABLE_Y - 0.3 * q; g.position.x = -s * 0.04 * q; } },
    };
  },
  // a test paper lying flat (its middle at the origin, 0.34 x 0.46, the top edge towards -z, so it reads from the
  // camera side of a desk): "TEST", a name line and five questions. write 0..1 fills the answers in one by one,
  // magic 0..1 makes them glow green, name 0..1 grows a big pink signature with a heart over the page, holes 0..6
  // punches bullet holes, blot 0..1 spreads an ink splat, burn 0..1 chars it to black ash and shrinks it, stack 0..3
  // piles extra sheets beside it. It splits in two (a rip down the middle)
  paper(P) {
    const W = 0.34, L = 0.46;
    const tex = (draw) => { const c = document.createElement("canvas"); c.width = 256; c.height = 346; draw(c.getContext("2d"), 256, 346); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
    const page = tex((c, w, h) => {
      c.fillStyle = "#fdfcf6"; c.fillRect(0, 0, w, h); c.fillStyle = "#1f2a44"; c.font = "900 44px sans-serif"; c.textAlign = "center"; c.fillText("TEST", w / 2, 50);
      c.font = "600 18px sans-serif"; c.textAlign = "left"; c.fillText("Name:", 18, 86); c.fillRect(80, 88, 150, 2);
      for (let i = 0; i < 5; i++) { const y = 128 + i * 44; c.fillText(`${i + 1}.`, 18, y); c.fillStyle = "#9aa6bf"; c.fillRect(50, y + 4, 180, 2); c.fillStyle = "#1f2a44"; }
    });
    const paperM = new THREE.MeshStandardMaterial({ map: page, roughness: 0.9 });
    const answers = [], holesArr = [], sheets = [];
    for (const [s, h] of P.halves) {
      const geo = new THREE.PlaneGeometry(W / 2, L); const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setX(i, s > 0 ? 0.5 + uv.getX(i) / 2 : uv.getX(i) / 2);
      const m = mesh(geo, paperM, h, (s * W) / 4, 0.003, 0); m.rotation.x = -Math.PI / 2; m.castShadow = false;
    }
    // the answers: blue scribbles on the lines (they become meshes on the half they fall on)
    const ink = new THREE.MeshBasicMaterial({ color: "#2346a8" });
    for (let i = 0; i < 5; i++) {
      const g = new THREE.Group(), z = -L / 2 + ((128 + i * 44) / 346) * L, x0 = -W / 2 + (60 / 256) * W;
      for (let k = 0; k < 6; k++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.002, 0.008), ink); d.position.set(x0 + k * 0.024, 0.006, z - 0.006 + (k % 2) * 0.006); d.rotation.y = (k % 2 ? 0.5 : -0.5); g.add(d); }
      P.whole.add(g); answers.push(g);
    }
    // the signature: a pink swirl and a heart, big
    const sig = new THREE.Group(); P.whole.add(sig);
    const pink = new THREE.MeshBasicMaterial({ color: "#ff4fa0" });
    for (let k = 0; k < 14; k++) { const a = k * 0.55, d = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.002, 0.012), pink); d.position.set(-0.1 + k * 0.015, 0.007, -0.02 + Math.sin(a) * 0.05); d.rotation.y = Math.cos(a); sig.add(d); }
    const heart = new THREE.Mesh(new THREE.CircleGeometry(0.035, 3), pink); heart.rotation.x = -Math.PI / 2; heart.position.set(0.12, 0.008, 0.05); sig.add(heart);
    // bullet holes, the ink blot, and the ash
    for (let k = 0; k < 6; k++) { const hl = new THREE.Mesh(new THREE.CircleGeometry(0.018, 10), new THREE.MeshBasicMaterial({ color: "#1a1410" })); hl.rotation.x = -Math.PI / 2; hl.position.set(-0.08 + (k % 3) * 0.08, 0.008, -0.12 + Math.floor(k / 3) * 0.16 + (k % 2) * 0.03); P.whole.add(hl); holesArr.push(hl); }
    const blot = new THREE.Group(); P.whole.add(blot);
    for (let k = 0; k < 7; k++) { const b = new THREE.Mesh(new THREE.CircleGeometry(k ? 0.035 : 0.09, 14), new THREE.MeshBasicMaterial({ color: "#14121f" })); b.rotation.x = -Math.PI / 2; const a = k * 0.9; b.position.set(k ? Math.cos(a) * 0.09 : 0, 0.009, k ? Math.sin(a) * 0.1 : 0); blot.add(b); }
    const ash = mesh(new THREE.PlaneGeometry(W, L), new THREE.MeshStandardMaterial({ color: "#2b2624", roughness: 1, transparent: true }), P.whole, 0, 0.01, 0); ash.rotation.x = -Math.PI / 2; ash.castShadow = false;
    for (let k = 0; k < 3; k++) { const sh = mesh(new THREE.BoxGeometry(W, 0.004, L), mat("#fdfcf6", { roughness: 0.9 }), P.whole, W + 0.04, 0.003 + k * 0.012, -0.02 * k); sh.rotation.y = 0.12 * (k - 1); sheets.push(sh); }
    return {
      grip: 0.005, splitApart: 0.08, splitTip: 0.25, splitDrop: 0,
      apply(ps) {
        const wr = clamp(ps.write ?? 0) * 5, mg = clamp(ps.magic ?? 0);
        answers.forEach((g, i) => { const k = clamp(wr - i); g.visible = k > 0.02 && ps.split < 0.05; g.scale.set(k, 1, 1); });
        ink.color.set(mg > 0.5 ? "#3cff6a" : "#2346a8");
        const nm = clamp(ps.name ?? 0); sig.visible = nm > 0.02; sig.scale.setScalar(Math.max(0.01, nm));
        holesArr.forEach((hl, i) => { hl.visible = (ps.holes ?? 0) > i + 0.5; });
        const bl = clamp(ps.blot ?? 0); blot.visible = bl > 0.02; blot.scale.setScalar(Math.max(0.01, bl * 1.4));
        const bu = clamp(ps.burn ?? 0); ash.visible = bu > 0.02; ash.material.opacity = bu; ash.scale.set(1, 1, 1);
        P.whole.scale.set(1 - 0.35 * bu, 1, 1 - 0.45 * bu);
        sheets.forEach((sh, i) => { const k = clamp((ps.stack ?? 0) - i); sh.visible = k > 0.02; sh.position.y = 0.003 + i * 0.012 + (1 - k) * 0.25; });
      },
    };
  },
  // a toilet facing +z: the origin is where its sitter sits (the seat at SEAT_Y, so "sit" works), the cistern behind
  // against the wall. lid 0..1 lifts the lid up behind the sitter; smash 0..1 cracks it apart (both halves tip out)
  toilet(P) {
    const china = mat("#fbfbf8", { roughness: 0.25 }), seatM = mat("#f4f1e6", { roughness: 0.35 }), chrome = mat("#c9ccd3", { roughness: 0.2, metalness: 0.8 });
    for (const [s, h] of P.halves) {
      const bowl = mesh(new THREE.CylinderGeometry(0.24, 0.17, SEAT_Y - 0.06, 24, 1, false, TH(s), Math.PI), china, h, 0, (SEAT_Y - 0.06) / 2, 0.08); bowl.scale.z = 1.25;
      const seat = mesh(new THREE.TorusGeometry(0.19, 0.045, 10, 24, Math.PI), seatM, h, 0, SEAT_Y - 0.03, 0.08); seat.rotation.x = Math.PI / 2; seat.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2; seat.scale.y = 1.25;
      mesh(new THREE.BoxGeometry(0.25, 0.42, 0.2), china, h, s * 0.125, SEAT_Y + 0.2, -0.27);   // the cistern
      mesh(new THREE.BoxGeometry(0.27, 0.04, 0.22), china, h, s * 0.125, SEAT_Y + 0.43, -0.27);
    }
    mesh(new THREE.BoxGeometry(0.07, 0.02, 0.02), chrome, P.whole, -0.15, SEAT_Y + 0.34, -0.16);   // the flush lever
    const lidG = new THREE.Group(); lidG.position.set(0, SEAT_Y + 0.0, -0.13); P.whole.add(lidG);
    const lid = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.025, 24), seatM, lidG, 0, 0, 0.22); lid.scale.z = 1.2;
    return {
      grip: SEAT_Y, splitApart: 0.15, splitTip: 0.5, splitDrop: 0.05,
      apply(ps) { lidG.rotation.x = -(Math.PI / 2) * (0.92 * clamp(ps.lid ?? 1)); const q = clamp(ps.smash ?? 0); if (q > 0) for (const [s, h] of P.halves) { h.position.x += s * 0.2 * q; h.rotation.z -= s * 0.6 * q; } },
    };
  },
  // a standing toilet-roll holder (its foot at the origin): a chrome pole with the roll on an arm at y 0.62, sticking
  // out along +x. stock 0..1 is how much paper is left (0: the bare cardboard tube); spin turns it (degrees)
  tpholder(P) {
    const chrome = mat("#c9ccd3", { roughness: 0.2, metalness: 0.8 }), paper = mat("#ffffff", { roughness: 0.9 }), card = mat("#c28a52", { roughness: 0.9 });
    mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.025, 24), chrome, P.whole, 0, 0.0125, 0);
    mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.75, 10), chrome, P.whole, 0, 0.375, 0);
    mesh(new THREE.SphereGeometry(0.025, 10, 8), chrome, P.whole, 0, 0.76, 0);
    const bar = mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.15, 8), chrome, P.whole, 0.07, 0.62, 0); bar.rotation.z = Math.PI / 2;
    const spin = new THREE.Group(); spin.position.set(0.085, 0.62, 0); P.whole.add(spin);
    const tube = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.11, 16, 1, true), card, spin, 0, 0, 0); tube.rotation.z = Math.PI / 2; tube.material.side = THREE.DoubleSide;
    const rollM = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.105, 24), paper, spin, 0, 0, 0); rollM.rotation.z = Math.PI / 2;
    const tail = mesh(new THREE.BoxGeometry(0.1, 0.12, 0.003), paper, spin, 0, -0.07, 0.06);
    return { grip: 0.62, apply(ps) { const r = clamp(ps.stock ?? 1); rollM.visible = r > 0.02; rollM.scale.set(0.42 + 0.58 * r, 1, 0.42 + 0.58 * r); tail.visible = r > 0.02; tail.position.z = 0.025 + 0.035 * r; spin.rotation.x = ((ps.spin || 0) * Math.PI) / 180; } };
  },
  // a loose toilet roll (its bottom at the origin, standing up); unroll 0..1 trails a long paper streamer down
  // from it (towards -y from the roll, so it streams from a high shelf or from a hand)
  troll(P) {
    const paper = mat("#ffffff", { roughness: 0.9 }), card = mat("#b88b5a", { roughness: 0.9 });
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.11, 24), paper, P.whole, 0, 0.055, 0);
    mesh(new THREE.CylinderGeometry(0.023, 0.023, 0.112, 12), card, P.whole, 0, 0.055, 0);
    const strip = mesh(new THREE.BoxGeometry(0.1, 1, 0.004), paper, P.whole, 0, 0, 0.06);
    return { grip: 0.055, apply(ps) { const u = clamp(ps.unroll ?? 0); strip.visible = u > 0.02; strip.scale.y = Math.max(0.01, u * 1.2); strip.position.y = 0.06 - 0.6 * u; } };
  },
  // a shower curtain on a rail (the rail's middle at the origin, y 0 at the rail; it hangs 1.6 down, 1.1 wide, facing
  // +z). cut 0..1: a blade takes its lower half off in neat squares that fall into a tidy stack at its foot
  curtain(P) {
    const c = document.createElement("canvas"); c.width = 128; c.height = 192; const x = c.getContext("2d");
    x.fillStyle = "#bfe6f2"; x.fillRect(0, 0, 128, 192); x.fillStyle = "#ffe17a";
    for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) { x.beginPath(); x.arc(16 + i * 32 + (j % 2) * 16, 16 + j * 32, 7, 0, 7); x.fill(); }
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    const m = mat("#ffffff", { map: tx, roughness: 0.8, side: THREE.DoubleSide });
    mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.3, 8), mat("#c9ccd3", { metalness: 0.7, roughness: 0.3 }), P.whole, 0, 0, 0).rotation.z = Math.PI / 2;
    const upper = new THREE.Group(), lowerG = new THREE.Group(); P.whole.add(upper, lowerG);
    // folds: a row of slim panels at alternating depth
    for (let k = 0; k < 8; k++) {
      const top = mesh(new THREE.PlaneGeometry(0.15, 0.8), m, upper, -0.525 + k * 0.15, -0.42, (k % 2) * 0.04); top.castShadow = false;
      const low = mesh(new THREE.PlaneGeometry(0.15, 0.8), m, lowerG, -0.525 + k * 0.15, -1.22, (k % 2) * 0.04); low.castShadow = false;
    }
    const squares = [];
    for (let k = 0; k < 6; k++) { const q = mesh(new THREE.BoxGeometry(0.2, 0.012, 0.2), m, P.whole, 0, 0, 0.12); squares.push(q); }
    return {
      grip: 0,
      apply(ps) {
        const u = clamp(ps.cut ?? 0);
        lowerG.visible = u < 0.15;
        squares.forEach((q, k) => { const f = clamp((u - 0.1 - k * 0.05) / 0.5); q.visible = u > 0.1; q.position.set(0.2 * Math.sin(k * 2.1) * (1 - f), lerp(-1.0 - k * 0.05, -1.58 + k * 0.012, f), 0.12); q.rotation.set((1 - f) * (k + 1) * 1.3, (1 - f) * k * 0.9, 0); });
      },
    };
  },
  // a small open-top cartoon car (its front towards +z, origin on the ground under its middle; rot 90 drives it to the
  // right). A driver rides it: { do: "ride", prop, off: [0, 0.2, -0.08], sit: true }. spec.color paints it. The wheels
  // turn with the distance it moves along its heading. split 0..1 cuts it in two across the middle (the halves part
  // front and back); smash 0..1 crumples it flat; bump 0..1 rocks it on its springs; tiny 0..1 shrinks the car to a
  // toy around its seat (the driver stays put); chop 0..1 cuts the front half off (it drops away forwards)
  car(P) {
    const paint = mat(P.spec.color || "#e85d4f", { roughness: 0.35, metalness: 0.15 }), dark = mat("#2d3340", { roughness: 0.6 }), chrome = mat("#d7dbe2", { roughness: 0.2, metalness: 0.8 });
    const tyre = mat("#22232a", { roughness: 0.9 }), seatM = mat("#f4efe2", { roughness: 0.7 }), glass = mat("#bfe3f7", { roughness: 0.1, transparent: true, opacity: 0.6 });
    const lamp = new THREE.MeshBasicMaterial({ color: "#fff3b0" }), red = new THREE.MeshBasicMaterial({ color: "#e0352b" });
    const body = new THREE.Group(); P.whole.add(body);
    const halves = [[1, new THREE.Group()], [-1, new THREE.Group()]]; for (const [, h] of halves) body.add(h);   // front (+z) and back
    const wheels = [];
    for (const [s, h] of halves) {
      const zc = s * 0.35;
      mesh(new THREE.BoxGeometry(0.8, 0.26, 0.7), paint, h, 0, 0.3, zc);                                   // the tub
      const nose = mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.26, 20, 1, false, s > 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI), paint, h, 0, 0.3, s * 0.7); nose.scale.z = 0.45;
      mesh(new THREE.BoxGeometry(0.84, 0.05, 0.72), chrome, h, 0, 0.15, zc);                               // the sill
      for (const x of [-0.27, 0.27]) mesh(new THREE.SphereGeometry(0.055, 12, 8), s > 0 ? lamp : red, h, x, 0.36, s * 0.86);
      mesh(new THREE.BoxGeometry(0.6, 0.06, 0.04), chrome, h, 0, 0.2, s * 0.88);                            // bumper
      for (const x of [-0.42, 0.42]) {
        const w = new THREE.Group(); w.position.set(x, 0.16, s * 0.5); h.add(w);
        const tr = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 20), tyre, w, 0, 0, 0); tr.rotation.z = Math.PI / 2;
        const hb = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.125, 12), chrome, w, 0, 0, 0); hb.rotation.z = Math.PI / 2;
        wheels.push(w);
      }
    }
    // the seat, the steering wheel and a small windscreen (front half)
    const front = halves[0][1], back = halves[1][1];
    mesh(new THREE.BoxGeometry(0.62, 0.08, 0.4), seatM, back, 0, 0.45, -0.12);
    mesh(new THREE.BoxGeometry(0.62, 0.32, 0.08), seatM, back, 0, 0.6, -0.32);
    const sw = mesh(new THREE.TorusGeometry(0.1, 0.018, 8, 20), dark, front, 0, 0.6, 0.18); sw.rotation.x = -0.9;
    const ws = mesh(new THREE.BoxGeometry(0.66, 0.2, 0.02), glass, front, 0, 0.55, 0.42); ws.rotation.x = -0.35; ws.castShadow = false;
    return {
      grip: 0.45,
      apply(ps, t) {
        const sp = clamp(ps.split ?? 0), sm = clamp(ps.smash ?? 0), bu = clamp(ps.bump ?? 0), ti = clamp(ps.tiny ?? 0);
        for (const [s, h] of halves) { h.position.set(0, -0.12 * sp * sp, s * 0.35 * sp); h.rotation.x = s * 0.35 * sp; }
        // chop: the front half is cut off and drops away forwards, tumbling (the seat is in the back half)
        const ch = clamp(ps.chop ?? 0), fr = halves[0][1]; if (ch > 0) { fr.position.z += 0.5 * ch; fr.position.y -= 0.25 * ch * ch; fr.rotation.x += 1.2 * ch; }
        body.scale.set((1 + 0.25 * sm) * (1 - 0.7 * ti), (1 - 0.65 * sm) * (1 - 0.7 * ti), (1 - 0.1 * sm) * (1 - 0.7 * ti));
        body.position.y = 0.3 * 0.7 * ti;   // shrinks towards its seat height, so the driver is left sitting on a toy
        body.rotation.z = bu * 0.06 * Math.sin((t ?? 0) * 30); body.rotation.x = bu * 0.04 * Math.sin((t ?? 0) * 23 + 1);
        const r = ((ps.rot ?? 0) * Math.PI) / 180, dist = (ps.x ?? 0) * Math.sin(r) + (ps.z ?? 0) * Math.cos(r);
        for (const w of wheels) w.rotation.x = dist / (0.16 * Math.max(ps.scale ?? 1, 0.01));
      },
    };
  },
  // a pencil (its eraser end at the origin, pointing along +y): len 0..1 sharpens it shorter from the tip end
  pencil(P) {
    const g = new THREE.Group(); P.whole.add(g);
    const wood = mat("#ffc83d", { roughness: 0.5 }), tipM = mat("#f1d1a6"), lead = mat("#2a2a2a"), eraser = mat("#f08aa0"), band = mat("#c9ccd3", { metalness: 0.5, roughness: 0.3 });
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.025, 10), eraser, g, 0, 0.0125, 0);
    mesh(new THREE.CylinderGeometry(0.0125, 0.0125, 0.015, 10), band, g, 0, 0.032, 0);
    const body = mesh(new THREE.CylinderGeometry(0.011, 0.011, 1, 6), wood, g, 0, 0, 0);
    const tip = new THREE.Group(); g.add(tip);
    mesh(new THREE.ConeGeometry(0.011, 0.035, 6), tipM, tip, 0, 0.0175, 0);
    mesh(new THREE.ConeGeometry(0.004, 0.012, 6), lead, tip, 0, 0.035 - 0.004, 0);
    return { grip: 0.08, apply(ps) { const l = 0.02 + 0.16 * clamp(ps.len ?? 1); body.scale.y = l; body.position.y = 0.04 + l / 2; tip.position.y = 0.04 + l; } };
  },

  // a free-standing cooker for the EGG clip (its foot at the origin, the front towards +z): white enamel, a black hob
  // at TABLE_Y with two burners at x -0.18 (back, z -0.1: the one in use) and +0.2, knobs and an oven window on the front. The cook stands
  // behind it facing the camera. on 0..1 lights blue flames under the left burner, fire 0..1 turns them into tall
  // orange ones (max heat); smash 0..1 crushes it (the hob caves in, the sides bulge, knobs pop)
  stove(P) {
    const enamel = mat("#f4f1ea", { roughness: 0.35 }), hob = mat("#1d1f24", { roughness: 0.2, metalness: 0.3 }), steel = mat("#b9bec8", { roughness: 0.3, metalness: 0.7 });
    const W = 0.8, D = 0.55, H = TABLE_Y - 0.03;
    const body = new THREE.Group(); P.whole.add(body);
    mesh(new THREE.BoxGeometry(W, H, D), enamel, body, 0, H / 2, 0);
    const top = mesh(new THREE.BoxGeometry(W + 0.02, 0.03, D + 0.02), hob, body, 0, H + 0.015, 0);
    const win = mesh(new THREE.BoxGeometry(0.5, 0.26, 0.01), mat("#3a2a24", { roughness: 0.15, metalness: 0.2 }), body, 0, 0.26, D / 2 + 0.006);
    mesh(new THREE.BoxGeometry(0.46, 0.025, 0.03), steel, body, 0, 0.44, D / 2 + 0.03);   // the door handle
    const knobs = [-0.25, -0.08, 0.09, 0.26].map((x) => { const k = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 14), mat("#2b2d33"), body, x, H - 0.06, D / 2 + 0.02); k.rotation.x = Math.PI / 2; return k; });
    for (const [x, z] of [[-0.18, -0.1], [0.2, 0.08]]) { const r = mesh(new THREE.TorusGeometry(0.1, 0.012, 6, 24), steel, body, x, H + 0.035, z); r.rotation.x = Math.PI / 2; }
    const flames = new THREE.Group(); flames.position.set(-0.18, H + 0.04, -0.1); body.add(flames);
    const blue = new THREE.MeshBasicMaterial({ color: "#5ab0ff", transparent: true, opacity: 0.9 }), orange = new THREE.MeshBasicMaterial({ color: "#ff8a1f", transparent: true, opacity: 0.95 });
    const tongues = Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2, f = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 6), blue); f.position.set(Math.cos(a) * 0.16, 0.025, Math.sin(a) * 0.16); f.userData.noOutline = true; flames.add(f); return f; });
    const big = Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * Math.PI * 2, f = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 7), orange); f.position.set(Math.cos(a) * 0.17, 0.15, Math.sin(a) * 0.17); flames.add(f); return f; });
    return {
      grip: TABLE_Y,
      apply(ps, t) {
        const on = clamp(ps.on ?? 0), fi = clamp(ps.fire ?? 0), q = clamp(ps.smash ?? 0);
        tongues.forEach((f, i) => { f.visible = on > 0.02; f.scale.set(1, on * (0.85 + 0.25 * Math.sin((t || 0) * 23 + i * 1.7)), 1); });
        big.forEach((f, i) => { f.visible = fi > 0.02; f.scale.set(fi, fi * (0.8 + 0.3 * Math.sin((t || 0) * 17 + i * 2.1)), fi); });
        body.scale.set(1 + 0.25 * q, 1 - 0.55 * q, 1 + 0.15 * q); top.rotation.z = 0.25 * q; win.rotation.z = -0.2 * q;
        knobs.forEach((k, i) => { k.position.z = D / 2 + 0.02 + 0.25 * q * (1 + (i % 2)); k.position.y = H - 0.06 + 0.2 * q * (i % 3); });
      },
    };
  },
  // a frying pan (its bottom at the origin, the handle along +x) with what's in it: fried 0..1 spreads a fried egg in
  // it, yolks 1..6 how many (they fill the pan), burn 0..1 browns them to charcoal, big 0..1 grows them into one giant
  // egg spilling over the rim, flip 0..1 tosses them up in an arc with a double spin and back down
  pan(P) {
    const iron = mat("#2c2e33", { roughness: 0.35, metalness: 0.5 }), wood = mat("#7a4a2a", { roughness: 0.6 });
    mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.02, 28), iron, P.whole, 0, 0.01, 0);
    const wall = mesh(new THREE.CylinderGeometry(0.18, 0.17, 0.05, 28, 1, true), iron, P.whole, 0, 0.035, 0); wall.material.side = THREE.DoubleSide;
    mesh(new THREE.BoxGeometry(0.12, 0.018, 0.03), iron, P.whole, 0.23, 0.05, 0);
    const handle = mesh(new THREE.BoxGeometry(0.18, 0.03, 0.04), wood, P.whole, 0.37, 0.06, 0); handle.rotation.z = 0.12;
    const food = new THREE.Group(); food.position.y = 0.025; P.whole.add(food);
    const white = mat("#fbfaf4", { roughness: 0.5, emissive: "#4a4a44" }), yolkM = mat("#ffb31a", { roughness: 0.25 });   // (emissive: its underside reads in a flip)
    const SLOTS = [[0, 0], [-0.07, -0.05], [0.07, 0.05], [0.07, -0.06], [-0.07, 0.06], [0, 0.0]];
    const eggs = SLOTS.map(([x, z], i) => {
      const g = new THREE.Group(); g.position.set(x, 0.002 * i, z); food.add(g);
      const geo = new THREE.CircleGeometry(0.09, 20), pos = geo.attributes.position;
      for (let k = 1; k < pos.count; k++) { const a = Math.atan2(pos.getY(k), pos.getX(k)); const r = 1 + 0.12 * Math.sin(a * 3 + i) + 0.06 * Math.sin(a * 5 + 2 * i); pos.setX(k, pos.getX(k) * r); pos.setY(k, pos.getY(k) * r); }
      const w = mesh(geo, white, g, 0, 0.004, 0); w.rotation.x = -Math.PI / 2; w.material.side = THREE.DoubleSide;
      const y = mesh(new THREE.SphereGeometry(0.035, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), yolkM, g, 0.01, 0.004, 0.005); y.scale.y = 0.75;
      return g;
    });
    return {
      grip: 0.06,
      apply(ps) {
        const fr = clamp(ps.fried ?? 0), n = Math.max(1, Math.round(ps.yolks ?? 1)), bu = clamp(ps.burn ?? 0), bg = clamp(ps.big ?? 0), fl = clamp(ps.flip ?? 0);
        eggs.forEach((g, i) => { const on = i < n; g.visible = on && fr > 0.02; const k = n === 1 ? 1 : 0.62; g.scale.set(fr * k, 1, fr * k); if (n === 1) g.position.set(0, 0, 0); else g.position.set(SLOTS[(i + 1) % 6][0] * 1.4, 0.002 * i, SLOTS[(i + 1) % 6][1] * 1.4); });
        if (n > 1 && eggs[n - 1]) eggs[n - 1].position.set(0, 0.012, 0);
        white.color.set("#fbfaf4").lerp(new THREE.Color("#2a1d16"), bu); yolkM.color.set("#ffb31a").lerp(new THREE.Color("#1d1512"), bu);
        food.scale.set(1 + 2.6 * bg, 1 + 1.5 * bg, 1 + 2.6 * bg);
        food.position.y = 0.025 + 4 * fl * (1 - fl) * 0.5; food.rotation.x = fl * Math.PI * 2;   // tips towards the camera first: the yolk faces it a quarter of the way up
      },
    };
  },
  // a whole egg (its bottom at the origin); crack 0..1 splits the shell into two halves that tip apart, the yolk drops
  // out of the bottom and is gone by 1 (it lands in the pan as the pan's fried)
  egg(P) {
    const shell = mat("#f6ead6", { roughness: 0.45 }), yolkM = mat("#ffb31a", { roughness: 0.25 });
    const halves = [[1, 0, Math.PI / 2], [-1, Math.PI / 2, Math.PI / 2]].map(([s, th0, thL]) => {
      const g = new THREE.Group(); g.position.y = 0.065; P.whole.add(g);
      const m = mesh(new THREE.SphereGeometry(0.05, 18, 12, 0, Math.PI * 2, th0, thL), shell, g, 0, 0, 0); m.scale.y = 1.3; m.material.side = THREE.DoubleSide;
      return [s, g];
    });
    const yolk = mesh(new THREE.SphereGeometry(0.03, 14, 10), yolkM, P.whole, 0, 0.06, 0);
    return {
      grip: 0.06,
      apply(ps) {
        const c = clamp(ps.crack ?? 0);
        for (const [s, g] of halves) { g.position.set(0.05 * c, 0.065 + s * 0.04 * c, 0); g.rotation.z = s * 1.1 * c; g.position.x = s * 0.04 * c; }
        yolk.visible = c > 0.05 && c < 0.95; yolk.position.y = 0.06 - 0.25 * c * c;
      },
    };
  },

  // a sofa for two facing +z: the origin is the middle of its seat front edge less 0.05 (sit works on it: one sitter
  // in the middle); cushions at SEAT_Y, a back at z -0.35, arms at x +-0.78. spec.color for the fabric
  couch(P) {
    const fab = mat(P.spec.color || "#4f86cf", { roughness: 0.85 }), cush = mat(P.spec.color2 || "#6a9be0", { roughness: 0.9 }), wood = mat("#6b4428", { roughness: 0.6 });
    mesh(new THREE.BoxGeometry(1.6, SEAT_Y - 0.17, 0.75), fab, P.whole, 0, (SEAT_Y - 0.17) / 2 + 0.08, -0.15);
    for (const x of [-0.36, 0.36]) mesh(new THREE.BoxGeometry(0.7, 0.1, 0.62), cush, P.whole, x, SEAT_Y - 0.05, -0.1);
    mesh(new THREE.BoxGeometry(1.6, 0.55, 0.2), fab, P.whole, 0, SEAT_Y + 0.2, -0.45);
    for (const x of [-0.36, 0.36]) { const b = mesh(new THREE.BoxGeometry(0.68, 0.38, 0.12), cush, P.whole, x, SEAT_Y + 0.22, -0.32); b.rotation.x = -0.12; }
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.16, 0.32, 0.75), fab, P.whole, s * 0.78, SEAT_Y + 0.02, -0.15);
    for (const x of [-0.7, 0.7]) for (const z of [0.15, -0.45]) mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.08, 8), wood, P.whole, x, 0.04, z);
    return { grip: SEAT_Y };
  },
  // a wall socket plate facing +z (its middle at the origin; put it on a wall): two holes, and behind it a chunk of
  // plaster that comes away with it when it is ripped out (tween its x, y, z, roll). spec.hole: true draws the jagged
  // hole it leaves instead (keep that one at scale 0 until the rip)
  socket(P) {
    if (P.spec.hole) {
      const g = new THREE.Shape(); [[-0.11, -0.09], [-0.04, -0.12], [0.05, -0.1], [0.12, -0.05], [0.1, 0.06], [0.03, 0.12], [-0.06, 0.1], [-0.12, 0.03]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      const h = mesh(new THREE.ShapeGeometry(g), new THREE.MeshBasicMaterial({ color: "#2a211c" }), P.whole, 0, 0, 0.003); h.castShadow = false;
      const w1 = mesh(new THREE.BoxGeometry(0.012, 0.012, 0.18), mat("#c9442e"), P.whole, 0.02, -0.02, 0.06); w1.rotation.x = 0.6;   // two loose wires
      const w2 = mesh(new THREE.BoxGeometry(0.012, 0.012, 0.16), mat("#3a6fc9"), P.whole, -0.03, -0.01, 0.05); w2.rotation.x = 0.9;
      return { grip: 0 };
    }
    const white = mat("#f7f5ef", { roughness: 0.35 });
    mesh(new THREE.BoxGeometry(0.11, 0.13, 0.015), white, P.whole, 0, 0, 0.008);
    for (const x of [-0.022, 0.022]) { const o = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.005, 10), mat("#2a2a2a"), P.whole, x, 0, 0.016); o.rotation.x = Math.PI / 2; }
    const chunk = mesh(new THREE.DodecahedronGeometry(0.1, 0), mat(P.spec.wall || "#f3d9b1", { roughness: 0.9 }), P.whole, 0, 0, -0.06); chunk.scale.set(1.1, 1.1, 0.45);
    return { grip: 0 };
  },
  // a phone charger: the wall plug at the origin (facing +z, put it on a socket) and its cable, which runs down to the
  // floor (spec.floor: the floor's y relative to the plug, default: where the floor is now) and on to the prop named in spec.to (its plug
  // end, held or lying somewhere): stage.js calls link() with that prop's position every frame. unplug 0..1 drops the
  // wall plug out to the floor; knot 0..1 ties a tangle in the cable (spec.knotAt: how far along, default the middle;
  // spec.knotSize); cut 0..1 cuts it there (both ends fall). spec.cable: its colour, spec.thick: its radius
  charger(P) {
    const white = mat("#f4f4f2", { roughness: 0.4 }), cableM = mat(P.spec.cable || "#f4f4f2", { roughness: 0.5 }), R = P.spec.thick ?? 0.009, KA = P.spec.knotAt ?? 0.5;
    const plug = new THREE.Group(); P.whole.add(plug);
    mesh(new THREE.BoxGeometry(0.06, 0.07, 0.045), white, plug, 0, 0, 0.03);
    const knot = mesh(new THREE.TorusKnotGeometry(0.045, 0.012, 48, 6, 2, 3), cableM, P.whole, 0, 0, 0); knot.visible = false;
    let tubes = [], st = { unplug: 0, knot: 0, cut: 0 }, end = null;
    const build = () => {
      for (const t of tubes) { P.whole.remove(t); t.geometry.dispose(); } tubes = [];
      if (!end) return;
      const floor = P.spec.floor ?? -P.root.position.y;   // (it follows the plug when the plug is moved)
      const u = st.unplug, s = new THREE.Vector3(0.12 * u, (floor + 0.03) * u, 0.05 + 0.25 * u), e = end.clone();
      plug.position.set(s.x, s.y, s.z - 0.05 * (1 - u) - 0.0); plug.rotation.x = -1.2 * u;
      const F = floor + 0.015, a = new THREE.Vector3(s.x + 0.02, Math.max(F, s.y - 0.15), s.z + 0.08), b = new THREE.Vector3(s.x + 0.08, F, s.z + 0.2);
      const d = new THREE.Vector3(e.x, F, e.z), c = b.clone().lerp(d, 0.5); c.y = F;
      const pts = [s, a, b, c, d.clone().lerp(b, 0.1), e];
      if (e.y < F + 0.05) pts.splice(4, 1);
      const curve = new THREE.CatmullRomCurve3(pts), q = curve.getPoints(40), mid = Math.round(40 * KA), ct = clamp(st.cut);
      knot.visible = st.knot > 0.02 && ct < 0.02; knot.scale.setScalar(Math.max(0.01, st.knot * (P.spec.knotSize ?? 1))); knot.position.copy(q[mid]); knot.position.y = Math.max(knot.position.y, F + 0.05);
      const segs = ct > 0.02 ? [q.slice(0, mid - 2), q.slice(mid + 2)] : [q];
      segs.forEach((seg, i) => {
        if (ct > 0.02) { const k = i ? 0 : seg.length - 1, p = seg[k]; seg[k] = p.clone().setY(p.y + (F - p.y) * ct); }
        const tg = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seg), 40, R, 6, false), cableM); tg.castShadow = true; P.whole.add(tg); tubes.push(tg);
      });
    };
    return {
      grip: 0,
      apply(ps) { st = { unplug: clamp(ps.unplug ?? 0), knot: clamp(ps.knot ?? 0), cut: clamp(ps.cut ?? 0) }; },
      link(world) { P.root.updateMatrixWorld(true); end = P.root.worldToLocal(world.clone()); build(); },
    };
  },
  // the plug end of a charger cable (a small grey connector, its tip at the origin pointing +y); a charger's spec.to
  // names it, and its cable runs to here. Grab it to plug a phone in
  plugend(P) {
    mesh(new THREE.BoxGeometry(0.022, 0.05, 0.012), mat("#f4f4f2", { roughness: 0.4 }), P.whole, 0, -0.025, 0);
    mesh(new THREE.BoxGeometry(0.012, 0.012, 0.006), mat("#b9bec8", { metalness: 0.7, roughness: 0.3 }), P.whole, 0, 0.004, 0);
    return { grip: 0.02 };
  },
  // a power bank (its bottom at the origin): a dark blue brick with four green charge lights; glow 0..1 lights them
  powerbank(P) {
    mesh(new THREE.BoxGeometry(0.08, 0.14, 0.028), mat("#25407a", { roughness: 0.4, metalness: 0.2 }), P.whole, 0, 0.07, 0);
    const led = new THREE.MeshBasicMaterial({ color: "#3cff6a" });
    const leds = [0, 1, 2, 3].map((i) => mesh(new THREE.BoxGeometry(0.012, 0.008, 0.004), led, P.whole, -0.021 + i * 0.014, 0.022, 0.015));
    return { grip: 0.07, apply(ps) { leds.forEach((l, i) => { l.visible = (ps.glow ?? 0) * 4 > i + 0.1; }); } };
  },

  // a barbell lying along x (its bar's middle at the origin, the plates' rims touching y -0.2 when it's on the floor:
  // put it at y 0.2). plates 0..3 is how many plates each end carries (red, blue, yellow; fractional ones grow in),
  // bend 0..1 droops both ends (too much weight), balloon 0..1 swaps the plates for red balloons (it floats). It splits
  // in the middle into two short bars (two dumbbells), each end keeping its plates
  barbell(P) {
    const steel = mat("#c4cad3", { roughness: 0.25, metalness: 0.8 }), cols = ["#d9433a", "#2f6fd1", "#f2c14e"];
    const ends = [];
    for (const [s, h] of P.halves) {
      mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 10), steel, h, s * 0.15, 0, 0).rotation.z = Math.PI / 2;
      const arm = new THREE.Group(); arm.position.x = s * 0.3; h.add(arm);   // the outer part, from the hand out (it droops)
      mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 10), steel, arm, s * 0.06, 0, 0).rotation.z = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 14), steel, arm, s * 0.13, 0, 0).rotation.z = Math.PI / 2;   // the collar
      mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.32, 12), steel, arm, s * 0.3, 0, 0).rotation.z = Math.PI / 2;    // the sleeve
      const plates = cols.map((col, i) => { const r = 0.2 - i * 0.035, p = mesh(new THREE.CylinderGeometry(r, r, 0.05, 28), mat(col, { roughness: 0.5 }), arm, s * (0.18 + i * 0.06), 0, 0); p.rotation.z = Math.PI / 2; return p; });
      const bal = new THREE.Group(); bal.position.set(s * 0.33, 0, 0); arm.add(bal);
      mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.4, 4), mat("#ffffff"), bal, 0, 0.2, 0);
      const ball = mesh(new THREE.SphereGeometry(0.17, 18, 14), mat("#ff4a5a", { roughness: 0.2 }), bal, 0, 0.5, 0); ball.scale.y = 1.15;
      ends.push({ s, arm, plates, bal });
    }
    return {
      grip: 0, splitApart: 0.06, splitTip: 0, splitDrop: 0,
      apply(ps) {
        const n = Math.max(0, Math.min(3, ps.plates ?? 2)), bd = clamp(ps.bend ?? 0), bl = clamp(ps.balloon ?? 0);
        for (const { s, arm, plates, bal } of ends) {
          arm.rotation.z = s * -0.45 * bd;
          plates.forEach((p, i) => { const k = clamp(n - i) * (1 - bl); p.visible = k > 0.02; p.scale.set(Math.max(0.01, k), 1, Math.max(0.01, k)); });
          bal.visible = bl > 0.02; bal.scale.setScalar(Math.max(0.01, bl)); bal.rotation.z = -arm.rotation.z;
        }
      },
    };
  },
  // a flat padded weight bench along x (the origin is the middle of the pad, at SEAT_Y, so "sit" works on it)
  weightbench(P) {
    const pad = mat("#22252b", { roughness: 0.6 }), steel = mat("#c4cad3", { roughness: 0.3, metalness: 0.7 });
    mesh(new THREE.BoxGeometry(1.0, 0.08, 0.3), pad, P.whole, 0, SEAT_Y - 0.04, 0);
    for (const x of [-0.4, 0.4]) { mesh(new THREE.BoxGeometry(0.05, SEAT_Y - 0.08, 0.05), steel, P.whole, x, (SEAT_Y - 0.08) / 2, 0); mesh(new THREE.BoxGeometry(0.05, 0.04, 0.34), steel, P.whole, x, 0.02, 0); }
    return { grip: SEAT_Y };
  },

  // a supermarket trolley, its front towards +z and its handle at the back (z -0.36, y 0.72), the basket a see-through
  // wire mesh on four castor wheels. spec.color for the plastic handle and bumpers. smash 0..1 crumples it; bump 0..1
  // rocks it. Ride it at off [0, 0.42, 0.02] (sit: in the basket)
  cart(P) {
    const steel = mat("#c9ced6", { roughness: 0.3, metalness: 0.7 }), plastic = mat(P.spec.color || "#e8402f", { roughness: 0.5 }), rubber = mat("#2a2a2e");
    const wire = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"); g.strokeStyle = "#dfe3e8"; g.lineWidth = 3; for (let i = 0; i <= 64; i += 12.8) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 64); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(64, i); g.stroke(); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); return t; })();
    const mesh_ = new THREE.MeshStandardMaterial({ map: wire, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.3, metalness: 0.6 });
    mesh_.userData.noOutline = true;
    const body = new THREE.Group(); P.whole.add(body);
    const W = 0.44, L = 0.62, H = 0.3, Y0 = 0.42;
    for (const [w, h, x, y, z, ry] of [[L, H, -W / 2, Y0 + H / 2, 0, Math.PI / 2], [L, H, W / 2, Y0 + H / 2, 0, Math.PI / 2], [W, H, 0, Y0 + H / 2, L / 2, 0], [W, H, 0, Y0 + H / 2, -L / 2, 0]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mesh_); m.position.set(x, y, z); m.rotation.y = ry; body.add(m); }
    const floorM = new THREE.Mesh(new THREE.PlaneGeometry(W, L), mesh_); floorM.rotation.x = -Math.PI / 2; floorM.position.y = Y0; body.add(floorM);
    for (const [x, z] of [[-W / 2, -L / 2], [W / 2, -L / 2], [-W / 2, L / 2], [W / 2, L / 2]]) mesh(new THREE.CylinderGeometry(0.012, 0.012, H, 6), steel, body, x, Y0 + H / 2, z);
    mesh(new THREE.BoxGeometry(W + 0.03, 0.025, 0.025), plastic, body, 0, Y0 + H, L / 2);   // the bumper rail
    mesh(new THREE.BoxGeometry(W + 0.06, 0.035, 0.035), plastic, body, 0, Y0 + H + 0.02, -L / 2 - 0.06);   // the handle
    for (const x of [-W / 2, W / 2]) { const a = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.1, 6), steel, body, x, Y0 + H, -L / 2 - 0.03); a.rotation.x = 1.1; }
    for (const x of [-0.16, 0.16]) mesh(new THREE.BoxGeometry(0.02, 0.02, L * 0.9), steel, body, x, 0.08, 0);   // the base frame
    for (const z of [-L / 2 + 0.05, L / 2 - 0.05]) { mesh(new THREE.BoxGeometry(0.36, 0.02, 0.02), steel, body, 0, 0.08, z); for (const x of [-0.16, 0.16]) { mesh(new THREE.CylinderGeometry(0.01, 0.01, Y0 - 0.08, 6), steel, body, x, (Y0 + 0.08) / 2, z * 0.92); const w = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12), rubber, body, x, 0.04, z); w.rotation.z = Math.PI / 2; } }
    return {
      grip: Y0 + H + 0.02,
      apply(ps) {
        const q = clamp(ps.smash ?? 0), bu = clamp(ps.bump ?? 0);
        body.scale.set(1 + 0.2 * q, 1 - 0.5 * q, 1 - 0.3 * q); body.rotation.z = 0.25 * q; body.rotation.x = -0.12 * bu;
      },
    };
  },
  // a trolley bay: two rails along x on posts (1.7 long, the open end at +x), a blue "CARTS" sign on a post at the
  // closed end (spec.sign: its x instead, then just behind the back rail), and `count` 0..6 trolleys nested inside, front towards -x (the first at the closed end). smash 0..1
  // knocks it flat (the rails fall outwards, the sign tips, the trolleys scatter)
  corral(P) {
    const steel = mat("#c9ced6", { roughness: 0.3, metalness: 0.7 }), blue = mat("#2f6fd1", { roughness: 0.5 });
    const rails = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.z = s * 0.3; P.whole.add(g); mesh(new THREE.BoxGeometry(1.7, 0.035, 0.035), steel, g, 0, 0.7, 0); mesh(new THREE.BoxGeometry(1.7, 0.03, 0.03), steel, g, 0, 0.35, 0); for (const x of [-0.82, 0, 0.82]) mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.7, 8), steel, g, x, 0.35, 0); return [s, g]; });
    const signG = new THREE.Group(); signG.position.set(P.spec.sign ?? -0.9, 0, P.spec.sign != null ? -0.34 : 0); P.whole.add(signG);
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 8), steel, signG, 0, 0.7, 0);
    const tex = (() => { const c = document.createElement("canvas"); c.width = 128; c.height = 80; const g = c.getContext("2d"); g.fillStyle = "#2f6fd1"; g.fillRect(0, 0, 128, 80); g.fillStyle = "#fff"; g.font = "900 30px sans-serif"; g.textAlign = "center"; g.fillText("CARTS", 64, 52); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    mesh(new THREE.BoxGeometry(0.42, 0.26, 0.02), blue, signG, 0, 1.3, 0.02); mesh(new THREE.PlaneGeometry(0.4, 0.24), new THREE.MeshBasicMaterial({ map: tex }), signG, 0, 1.3, 0.035);
    const nest = Array.from({ length: 6 }, (_, i) => { const g = new THREE.Group(); g.position.x = -0.55 + i * 0.2; P.whole.add(g); const c = KINDS.cart({ root: g, whole: g, halves: [], spec: { color: P.spec.color } }); g.rotation.y = -Math.PI / 2; g.scale.setScalar(0.98); return [g, c]; });
    return {
      grip: 0,
      apply(ps) {
        const n = ps.count ?? 0, q = clamp(ps.smash ?? 0);
        nest.forEach(([g], i) => { g.visible = n > i + 0.5; g.position.y = 0.6 * q * Math.sin(i * 1.7 + 1) ** 2; g.position.z = q * 0.9 * Math.sin(i * 2.3); g.rotation.z = q * (i % 2 ? 1.2 : -0.9); });
        for (const [s, g] of rails) { g.rotation.x = s * 1.4 * q; }
        signG.rotation.z = 1.3 * q;
      },
    };
  },

  // a bicycle, its front towards +z: wheels (radius 0.2) at z -0.36 and 0.36, the saddle at y 0.62, the handlebar at
  // y 0.76. Ride it at off [0, 0.5, -0.16] (sit). spec.color paints the frame; spec.training adds training wheels;
  // spec.uni builds only the back wheel, the seat post and the saddle (a unicycle). Params: spin (wheel turns: tween it
  // with the travel, distance / 1.257 per turn), wheelie 0..1 (front up, about the back wheel), broken 0..1 (the frame
  // and the front wheel fall away, the back wheel stays)
  bike(P) {
    const R = 0.2, frameM = mat(P.spec.color || "#2f8fe0", { roughness: 0.35, metalness: 0.3 }), rubber = mat("#24242a", { roughness: 0.8 });
    const steel = mat("#c9ced6", { roughness: 0.3, metalness: 0.7 }), black = mat("#1e1e22", { roughness: 0.6 });
    const tube = (a, b, r, m, parent) => {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
      const o = mesh(new THREE.CylinderGeometry(r, r, len, 8), m, parent); o.position.copy(A).add(B).multiplyScalar(0.5);
      o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return o;
    };
    const wheel = (parent, z, r = R) => {
      const g = new THREE.Group(); g.position.set(0, r, z); parent.add(g);
      const tyre = mesh(new THREE.TorusGeometry(r, r * 0.11, 8, 28), rubber, g); tyre.rotation.y = Math.PI / 2;
      const rim = mesh(new THREE.TorusGeometry(r * 0.86, r * 0.03, 6, 24), steel, g); rim.rotation.y = Math.PI / 2;
      for (let i = 0; i < 4; i++) { const sp = mesh(new THREE.CylinderGeometry(0.004, 0.004, r * 1.72, 4), steel, g); sp.rotation.x = (i * Math.PI) / 4; }
      const hub = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.06, 10), steel, g); hub.rotation.z = Math.PI / 2;
      return g;
    };
    const pivot = new THREE.Group(); pivot.position.z = -0.36; P.whole.add(pivot);   // the back wheel's contact point
    const bike = new THREE.Group(); bike.position.z = 0.36; pivot.add(bike);
    const back = wheel(bike, -0.36);
    const rest = new THREE.Group(); bike.add(rest);   // everything but the back wheel (it falls away when broken)
    const BB = [0, 0.24, -0.02], SEAT = [0, 0.58, -0.15], HEAD = [0, 0.62, 0.27], HEADB = [0, 0.48, 0.3];
    let front = null, crank = null;
    if (P.spec.uni) {
      tube([0, R, -0.36], [0, 0.58, -0.36], 0.018, frameM, bike);
      mesh(new THREE.BoxGeometry(0.09, 0.035, 0.17), black, bike, 0, 0.6, -0.36);
    } else {
      for (const [a, b] of [[BB, SEAT], [SEAT, HEAD], [BB, HEADB], [BB, [0, R, -0.36]], [SEAT, [0, R, -0.36]]]) tube(a, b, 0.017, frameM, rest);
      front = wheel(rest, 0.36);
      tube(HEAD, [0, R, 0.36], 0.014, frameM, rest); tube(HEAD, [0, 0.76, 0.24], 0.014, steel, rest);
      const bar = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.44, 8), steel, rest, 0, 0.76, 0.24); bar.rotation.z = Math.PI / 2;
      for (const x of [-0.2, 0.2]) { const gr = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.08, 8), black, rest, x, 0.76, 0.24); gr.rotation.z = Math.PI / 2; }
      tube(SEAT, [0, 0.62, -0.17], 0.012, steel, rest); mesh(new THREE.BoxGeometry(0.09, 0.035, 0.17), black, rest, 0, 0.635, -0.18);
      crank = new THREE.Group(); crank.position.set(...BB); rest.add(crank);
      for (const s of [-1, 1]) { const arm = new THREE.Group(); arm.position.x = s * 0.06; arm.rotation.x = s > 0 ? 0 : Math.PI; crank.add(arm); mesh(new THREE.BoxGeometry(0.015, 0.12, 0.025), steel, arm, 0, -0.06, 0); mesh(new THREE.BoxGeometry(0.07, 0.015, 0.04), black, arm, s * 0.03, -0.12, 0); }
      if (P.spec.training) for (const s of [-1, 1]) { tube([0, R, -0.36], [s * 0.2, 0.08, -0.4], 0.008, steel, rest); const tw = wheel(rest, -0.4, 0.07); tw.position.x = s * 0.2; }
    }
    return {
      grip: 0.76,
      apply(ps) {
        const sp = (ps.spin ?? 0) * Math.PI * 2, wh = clamp(ps.wheelie ?? 0), br = clamp(ps.broken ?? 0);
        back.rotation.x = sp; if (front) front.rotation.x = sp; if (crank) crank.rotation.x = sp * 0.55;
        pivot.rotation.x = -0.5 * wh;
        rest.position.set(0.25 * br, -0.12 * br, -0.35 * br); rest.rotation.set(0.5 * br, 0, 1.35 * br);
        if (front) front.position.z = 0.36 + 0.5 * br;
      },
    };
  },
  // a puddle on the ground, about 1.1 x 0.7 m (long along z: put it at rot 90 for a path along x). Params: level 0..1
  // (1 full; it shrinks away), splash 0..1 (droplets burst out and fall back: tween 0 -> 1, then set 0), split parts it
  // into two halves along its long side (the Samurai's cut)
  puddle(P) {
    const water = mat("#62aee0", { roughness: 0.08, metalness: 0.1, emissive: new THREE.Color("#1d4a6a") }), edge = mat("#4f8fbd", { roughness: 0.3 });
    const discs = [];
    for (const [s, h] of P.halves) {
      const d = new THREE.Group(); h.add(d); d.scale.set(0.35, 1, 0.55);
      const a0 = s > 0 ? -Math.PI / 2 : Math.PI / 2;
      const rim = mesh(new THREE.CircleGeometry(1.06, 32, a0, Math.PI), edge, d, 0, 0.008, 0); rim.rotation.x = -Math.PI / 2;
      const top = mesh(new THREE.CircleGeometry(1, 32, a0, Math.PI), water, d, 0, 0.012, 0); top.rotation.x = -Math.PI / 2;
      const hi = mesh(new THREE.CircleGeometry(0.25, 16), mat("#d8f0ff", { roughness: 0.1, emissive: new THREE.Color("#6a8fa6") }), d, s * 0.35, 0.014, 0.2); hi.rotation.x = -Math.PI / 2; hi.scale.set(0.5, 1, 1);
      for (const m of [rim, top, hi]) { m.castShadow = false; m.material.userData.noOutline = true; }
      discs.push(d);
    }
    const drops = Array.from({ length: 16 }, (_, i) => { const o = mesh(new THREE.SphereGeometry(0.02 + 0.01 * (i % 3), 8, 6), water, P.whole); o.castShadow = false; return o; });
    return {
      grip: 0, splitApart: 0.3,
      apply(ps) {
        const lv = clamp(ps.level ?? 1), sp = clamp(ps.splash ?? 0);
        for (const d of discs) { d.visible = lv > 0.02; d.scale.set(0.35 * lv, 1, 0.55 * lv); }
        drops.forEach((o, i) => {
          const a = (i / drops.length) * Math.PI * 2 + 0.3 * (i % 2), r = (0.15 + 0.5 * sp) * (0.7 + 0.3 * ((i * 7) % 5) / 4);
          o.visible = sp > 0.01 && sp < 0.99; o.position.set(Math.cos(a) * r * 0.7, 0.02 + (0.35 + 0.15 * (i % 3)) * 4 * sp * (1 - sp), Math.sin(a) * r);
        });
      },
    };
  },

  // an office desk with a front panel (it hides the legs of whoever stands behind it), top at DESK_Y
  officedesk(P) {
    const top = mat(P.spec.color || "#d9c3a0", { roughness: 0.55 }), side = mat(P.spec.panel || "#7d6a55", { roughness: 0.7 });
    const W = P.spec.w ?? 1.3, D = P.spec.d ?? 0.5;
    mesh(new THREE.BoxGeometry(W, 0.05, D), top, P.whole, 0, DESK_Y - 0.025, 0);
    mesh(new THREE.BoxGeometry(W - 0.06, DESK_Y - 0.08, 0.03), side, P.whole, 0, (DESK_Y - 0.05) / 2, D / 2 - 0.06);
    for (const x of [-1, 1]) mesh(new THREE.BoxGeometry(0.04, DESK_Y - 0.05, D - 0.04), side, P.whole, x * (W / 2 - 0.03), (DESK_Y - 0.05) / 2, 0);
    return { grip: DESK_Y };
  },
  // a report lying flat: a title and grey lines on a white sheet, cut into pieces. shred 0..1 frees the pieces in a
  // fixed order; each freed piece hops up and turns over (a slice through it) and lands in a pile where the sheet was,
  // so one "prop" tween of shred per sword stroke sends a batch of paper flying. Pure function of shred: no memory.
  report(P) {
    const W = 0.34, D = 0.46, NX = 5, NZ = 7, rnd = rngOf(P.spec.seed ?? 7);
    const cv = document.createElement("canvas"); cv.width = 300; cv.height = 400;
    const g = cv.getContext("2d"); g.fillStyle = "#fbfaf6"; g.fillRect(0, 0, 300, 400);
    g.fillStyle = "#26324a"; g.font = "900 46px sans-serif"; g.textAlign = "center"; g.fillText(P.spec.title || "REPORT", 150, 70);
    g.fillStyle = "#b9c0cc"; for (let y = 110; y < 380; y += 26) g.fillRect(34, y, y % 78 === 32 ? 150 : 232, 9);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const paper = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, side: THREE.DoubleSide });
    const pieces = [];
    for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
      const w = W / NX, d = D / NZ, geo = new THREE.PlaneGeometry(w, d);
      const uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, (i + uv.getX(k)) / NX, 1 - (j + 1 - uv.getY(k)) / NZ);
      const o = new THREE.Mesh(geo, paper); o.castShadow = o.receiveShadow = true; o.rotation.order = "YXZ"; P.whole.add(o);   // laid flat, then turned about the vertical
      const home = [-W / 2 + (i + 0.5) * w, 0.003, -D / 2 + (j + 0.5) * d], a = rnd() * Math.PI * 2, r = 0.02 + rnd() * 0.07;
      pieces.push({ o, home, pile: [Math.cos(a) * r * 1.4, 0.004 + rnd() * 0.012, Math.sin(a) * r], at: rnd(),
        hop: 0.18 + rnd() * 0.22, spin: [(rnd() - 0.5) * 9, (rnd() - 0.5) * 6, (rnd() - 0.5) * 9], yaw: (rnd() - 0.5) * 3 });
    }
    // the pieces go in batches (spec.batches, default 5): tween shred from b/B to (b+1)/B for stroke b and that batch
    // flies and lands completely within the tween, a little staggered, so nothing hangs in the air between strokes
    const B = P.spec.batches ?? 5;
    pieces.sort((x, y) => x.at - y.at).forEach((q, n) => { q.batch = Math.floor((n * B) / pieces.length); q.delay = rnd() * 0.25; });
    return {
      grip: 0,
      apply(ps) {
        for (const q of pieces) {
          const k = clamp((ps.shred * B - q.batch) * 1.25 - q.delay), e = k * k * (3 - 2 * k), up = 4 * q.hop * k * (1 - k);
          q.o.position.set(lerp(q.home[0], q.pile[0], e), lerp(q.home[1], q.pile[1], e) + up, lerp(q.home[2], q.pile[2], e));
          // whole half-turns over the flight, so it lands flat (face up or down) with no snap
          q.o.rotation.set(-Math.PI / 2 + Math.round(q.spin[0] / Math.PI) * Math.PI * e, q.yaw * e + q.spin[1] * k * (1 - k), q.spin[2] * k * (1 - k));
        }
      },
    };
  },
  // a desk nameplate: a dark wooden wedge with a brass plate and one word (spec.text, default MANAGER), facing +z.
  // split 0..1 cuts it in the middle: each half tips outward over its outer bottom edge (it stays on the desk) and slides
  nameplate(P) {
    const W = P.spec.w ?? 0.4, H = 0.1, D = 0.08, wood = mat("#3b2a20", { roughness: 0.5 });
    const sh = new THREE.Shape(); sh.moveTo(-D / 2, 0); sh.lineTo(D / 2, 0); sh.lineTo(D * 0.1, H); sh.lineTo(-D * 0.35, H); sh.closePath();
    const cv = document.createElement("canvas"); cv.width = 512; cv.height = 112;
    const g = cv.getContext("2d"); const gr = g.createLinearGradient(0, 0, 0, 112); gr.addColorStop(0, "#f3d27a"); gr.addColorStop(1, "#c79a3a");
    g.fillStyle = gr; g.fillRect(0, 0, 512, 112); g.fillStyle = "#2a1d10"; g.font = "900 70px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(P.spec.text || "MANAGER", 256, 60);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const brass = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.4 }); brass.userData.noOutline = true;
    const slope = Math.atan2(D * 0.4, H), pivots = [];   // the front face runs from z D/2 at the bottom to 0.1 D at the top
    for (const s of [1, -1]) {
      // the pivot sits on the outer bottom edge; the half hangs off it toward the middle
      const pv = new THREE.Group(); pv.position.x = (s * W) / 2; P.whole.add(pv); pivots.push([s, pv]);
      const body = new THREE.ExtrudeGeometry(sh, { depth: W / 2, bevelEnabled: false }); body.rotateY(-Math.PI / 2);
      mesh(body, wood, pv, s > 0 ? 0 : W / 2, 0, 0);
      // the two halves of the brass meet in the middle, each with its half of the word
      const pl = new THREE.PlaneGeometry(W * 0.46, H * 0.8), uv = pl.attributes.uv;
      for (let k = 0; k < uv.count; k++) uv.setX(k, (s > 0 ? 0.5 : 0) + uv.getX(k) * 0.5);
      const plate = new THREE.Mesh(pl, brass); plate.rotation.x = -slope; plate.position.set(-s * W * 0.27, H / 2 + 0.003 * Math.sin(slope), D * 0.3 + 0.003 * Math.cos(slope)); pv.add(plate);   // on the face, just off it
    }
    return {
      grip: H,
      apply(ps) { const k = clamp(ps.split); for (const [s, pv] of pivots) { pv.rotation.z = -s * 0.5 * k; pv.position.x = (s * W) / 2 + s * 0.04 * k; } },
    };
  },
};


// the apple tree of the TREE clip (its origin at the foot of the trunk): a trunk, a leafy crown from y 1.95, and
// 10 apples hanging under the crown's front edge. apples 0..10 is how many still hang (slot i shows while i < apples,
// fractional counts grow the next one in, so apples can regrow one by one); an "apple" prop placed at
// TREE_APPLES[i] (times the tree's scale) covers slot i, like a slice on the pizza. steps 0..1 pops out five ledges
// up the left side of the trunk (cut by a blade); roll -90 lays the tree down to the right, scale shrinks it to its foot.
// (slots are taken from 9 down to 0; most hang at the left, where a climber on the trunk's left side can reach them)
export const TREE_APPLES = [[0.55, 1.88, 0.3], [-0.28, 1.84, 0.3], [-0.55, 1.8, 0.25], [0.32, 1.86, 0.36], [-0.22, 1.88, 0.4],
  [-0.36, 1.8, 0.38], [0.05, 1.85, 0.4], [-0.5, 1.98, 0.22], [-0.3, 1.95, 0.36], [-0.42, 1.86, 0.3]];
export const TREE_STEPS = Array.from({ length: 5 }, (_, k) => 0.22 + k * 0.2);

Object.assign(KINDS, TREND_KINDS, CATCH_KINDS, ROBBED_KINDS, HALLOWEEN_KINDS, HOME_KINDS, ELEVATOR_KINDS, ROAD_KINDS, MAKEUP_KINDS, CHEF_KINDS, DUO_KINDS, PACKAGE_KINDS, CHARGER_KINDS, COOKIE_KINDS, CANDLE_KINDS);   // coffin, screen, letters, confetti, printer, flatpack... (props-trend.js), door, bowl, candy, bucket, toilet roll (props-halloween.js), stool (props-home.js), bubblehelmet, brush, paintpot, handmirror (props-makeup.js), soupbowl, spoon, ladle (props-chef.js), foldphone, duobox, duolid, ledge, storedoors, tent, sleepingbag... (props-duo.js), frontdoor, parcel (props-package.js), chargebank, snackbowl, biscuit (props-charger.js), chunkcookie, floorcushion (props-cookie.js), dessertplate, cupcake, cakedome, breath (props-candle.js)

// a rounded rectangle centred on the origin (w x h, corner radius r)
function roundRect(w, h, r) {
  const s = new THREE.Shape(), x = w / 2, y = h / 2;
  s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0); s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2);
  s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI); s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5);
  return s;
}
// a flat shape whose texture spans its bounding box (ShapeGeometry's own UVs are its raw coordinates)
function shapeGeo(shape, seg = 12) {
  const g = new THREE.ShapeGeometry(shape, seg); g.computeBoundingBox();
  const b = g.boundingBox, uv = g.attributes.uv, pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - b.min.x) / (b.max.x - b.min.x), (pos.getY(i) - b.min.y) / (b.max.y - b.min.y));
  return g;
}

// A modern iPhone (proportions of a 6.1-inch Pro: 146.6 x 70.6 x 8.25 mm, 1.55 mm screen border, the Dynamic Island,
// a square camera plateau with three lenses, flash and sensor), built at 0.078 wide like the old phone, its middle at
// y 0.0775 and the screen facing +z. spec.color is the back glass (white titanium by default), spec.frame the rounded
// metal band. The screen is unlit and never outlined: it looks like the picture on it. Seen from the back, the plateau
// sits top left.
// spec.screen { src, cols, rows, next? } plays pictures: src is an atlas of video frames (cols x rows tiles, row by
// row), drawn as a 9:16 video across the screen's width, between a status bar (9:41, signal, battery) and the home
// bar; `feed` picks the tile (tween it to play them), a swipe (`scroll` 0..1) slides the video up and the `nextFeed`
// tile in from below; `next` is a full-size picture used for that tile instead (a shot locked to the phone, shots
// `prop`, can end with the video filling the frame: it is IPHONE.videoH tall, centred on the screen).
export const IPHONE = { w: 0.078, h: 0.162, d: 0.0091, screenW: 0.0717, screenH: 0.1546, cy: 0.0775 };
IPHONE.videoH = (IPHONE.screenW * 16) / 9;
function iphone(P) {
  const { w: W, h: H, d: D, screenW: SW, screenH: SH, cy: CY } = IPHONE, R = 0.0115, B = 0.0016;
  const frameM = mat(P.spec.frame ?? "#d6d3cd", { roughness: 0.32, metalness: 0.75 });
  const backM = mat(P.spec.color ?? "#ebe8e2", { roughness: 0.55, metalness: 0.05 });
  const blackM = new THREE.MeshStandardMaterial({ color: "#07070a", roughness: 0.12, metalness: 0.2 });
  // the metal band: a rounded slab with rounded edges
  const band = new THREE.ExtrudeGeometry(roundRect(W - 2 * B, H - 2 * B, R - B), { depth: D - 2 * B, bevelEnabled: true, bevelThickness: B, bevelSize: B, bevelSegments: 4, curveSegments: 18 });
  band.translate(0, 0, -(D - 2 * B) / 2);
  mesh(band, frameM, P.whole, 0, CY, 0);
  // back glass, and on it the camera plateau (seen from the back: top left, the phone's +x) with its lenses
  const back = mesh(shapeGeo(roundRect(W - 0.0024, H - 0.0024, R - 0.0012), 18), backM, P.whole, 0, CY, -D / 2 - 0.0002); back.rotation.y = Math.PI;
  const PW = 0.0385, px = W / 2 - 0.0035 - PW / 2, py = CY + H / 2 - 0.0035 - PW / 2;
  const plat = new THREE.ExtrudeGeometry(roundRect(PW, PW, 0.0085), { depth: 0.0008, bevelEnabled: true, bevelThickness: 0.0004, bevelSize: 0.0004, bevelSegments: 2, curveSegments: 12 });
  mesh(plat, mat(P.spec.color ?? "#ebe8e2", { roughness: 0.25, metalness: 0.1 }), P.whole, px, py, -D / 2 - 0.0012);
  const ringM = mat(P.spec.frame ?? "#d6d3cd", { roughness: 0.3, metalness: 0.8 }), glassM = new THREE.MeshStandardMaterial({ color: "#10131c", roughness: 0.05, metalness: 0.4 });
  const lens = (x, y) => {
    const ring = mesh(new THREE.CylinderGeometry(0.0072, 0.0075, 0.0022, 28), ringM, P.whole, px + x, py + y, -D / 2 - 0.0022); ring.rotation.x = Math.PI / 2;
    const gl = mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.0004, 28), glassM, P.whole, px + x, py + y, -D / 2 - 0.0034); gl.rotation.x = Math.PI / 2;
    const glint = mesh(new THREE.CircleGeometry(0.0013, 12), new THREE.MeshBasicMaterial({ color: "#9fb4ff" }), P.whole, px + x - 0.0018, py + y + 0.0018, -D / 2 - 0.0037); glint.rotation.y = Math.PI; glint.castShadow = false;
  };
  // from the back, the two lenses on the outer edge (the phone's +x) are stacked, the third sits between them inward
  lens(0.0088, 0.0094); lens(0.0088, -0.0094); lens(-0.0088, 0);
  mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.0008, 18), mat("#fff6dc", { roughness: 0.3 }), P.whole, px - 0.0105, py + 0.0118, -D / 2 - 0.0016).rotation.x = Math.PI / 2;   // flash
  mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.0008, 18), blackM, P.whole, px - 0.0105, py - 0.0118, -D / 2 - 0.0016).rotation.x = Math.PI / 2;      // sensor
  // side buttons: action button and volume on one side, the side button on the other
  for (const [x, y, h] of [[-1, 0.046, 0.007], [-1, 0.031, 0.012], [-1, 0.015, 0.012], [1, 0.024, 0.018]]) mesh(new THREE.BoxGeometry(0.0016, h, 0.0034), frameM, P.whole, x * (W / 2 + 0.0004), CY + y, 0);
  // the front: black glass to the edge, the screen inside a thin border, the Dynamic Island over it
  mesh(shapeGeo(roundRect(W - 0.0024, H - 0.0024, R - 0.0012), 18), blackM, P.whole, 0, CY, D / 2 + 0.0002);
  const island = mesh(shapeGeo(roundRect(0.0232, 0.0068, 0.0034)), new THREE.MeshStandardMaterial({ color: "#000000", roughness: 0.08, metalness: 0.5 }), P.whole, 0, CY + SH / 2 - 0.0022 - 0.0034, D / 2 + 0.0007);
  island.castShadow = false;
  const SC = P.spec.screen, CW = 1080, CH = Math.round((CW * SH) / SW);
  const cv = document.createElement("canvas"); cv.width = CW; cv.height = CH;
  const g = cv.getContext("2d"), tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const sm = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, fog: false }); sm.userData.noOutline = true;
  mesh(shapeGeo(roundRect(SW, SH, R - 0.0026), 18), sm, P.whole, 0, CY, D / 2 + 0.0004).castShadow = false;
  const VY = (CH - 1920) / 2;   // the video's top on the canvas: centred, so a shot can end with it filling the frame
  const pics = {};
  if (SC) (globalThis.__loads ||= []).push(Promise.all([SC.src, SC.next].map((src) => src && new THREE.ImageLoader().loadAsync(`/${src.replace(/^\/+/, "")}`))).then(([a, n]) => { pics.atlas = a; pics.next = n; }));
  const tile = (i, y) => {
    if (SC.next && i === SC.cols * SC.rows) { g.drawImage(pics.next, 0, y, 1080, 1920); return; }
    const tw = pics.atlas.width / SC.cols, th = pics.atlas.height / SC.rows;
    g.drawImage(pics.atlas, (i % SC.cols) * tw, Math.floor(i / SC.cols) * th, tw, th, 0, y, 1080, 1920);
  };
  // the status bar and the home bar, white on black like an app playing a video
  const chrome = () => {
    g.fillStyle = "#fff"; g.font = "600 58px Helvetica, Arial, sans-serif"; g.textBaseline = "middle"; g.fillText("9:41", 96, 92);
    for (let i = 0; i < 4; i++) g.fillRect(CW - 300 + i * 22, 112 - 14 - i * 9, 14, 14 + i * 9);   // signal
    g.lineWidth = 5; g.strokeStyle = "rgba(255,255,255,0.55)"; g.beginPath(); g.roundRect(CW - 190, 70, 96, 46, 13); g.stroke();
    g.fillRect(CW - 182, 78, 66, 30); g.fillStyle = "rgba(255,255,255,0.55)"; g.fillRect(CW - 90, 84, 6, 18);   // battery
    g.fillStyle = "#fff"; g.beginPath(); g.roundRect(CW / 2 - 190, CH - 46, 380, 15, 8); g.fill();   // home bar
  };
  let drawn = "";
  const draw = (f, n, sc) => {
    g.fillStyle = "#000"; g.fillRect(0, 0, CW, CH);
    if (SC && pics.atlas) {
      g.save(); g.beginPath(); g.rect(0, VY, CW, 1920); g.clip();
      const e = ease("inOut")(sc);
      if (e < 1) tile(f, VY - 1920 * e);
      if (e > 0) tile(n, VY + 1920 * (1 - e));
      g.restore();
    } else { const gr = g.createLinearGradient(0, 0, CW, CH); gr.addColorStop(0, "#3d6fd6"); gr.addColorStop(1, "#b04ad8"); g.fillStyle = gr; g.fillRect(0, 0, CW, CH); }
    chrome(); tex.needsUpdate = true;
  };
  return { grip: 0.05, apply(ps) {
    const f = Math.max(0, Math.floor(ps.feed + 1e-6)), n = Math.floor(ps.nextFeed + 1e-6), sc = clamp(ps.scroll), key = `${f}|${n}|${sc.toFixed(4)}|${!!pics.atlas}`;
    if (key !== drawn) { drawn = key; draw(f, n, sc); }
  } };
}

export function buildProp(spec) {
  const root = new THREE.Group(), whole = new THREE.Group(); root.add(whole);
  root.rotation.order = "YXZ";   // rot (about y) first, then tip and tilt in the prop's own frame, as gripWorld
  const halves = [1, -1].map((s) => { const h = new THREE.Group(); whole.add(h); return [s, h]; });
  const P = { root, whole, halves, spec };
  const kind = KINDS[spec.kind];
  if (!kind) throw new Error(`unknown prop kind: ${spec.kind}`);
  const def = kind(P);
  return {
    spec, root, grip: def.grip ?? 0,
    link: def.link, aim: def.aim,
    apply(ps, t) {
      // tip leans the top toward +z, tilt toward +x (both about the bottom centre); roll is the activity clips' older
      // name for a lean the other way about z (roll = -tilt)
      root.position.set(ps.x, ps.y, ps.z); root.rotation.set((ps.tip * Math.PI) / 180, (ps.rot * Math.PI) / 180, ((-(ps.tilt ?? 0) + (ps.roll ?? 0)) * Math.PI) / 180);
      // squash: a cartoon compression toward the bottom (a cup touching down), the volume kept
      const sc = Math.max(ps.scale, 0.0001), q = ps.squash || 0;
      root.scale.set(sc * (1 + q / 2), sc * (1 - q), sc * (1 + q / 2)); root.visible = ps.scale > 0.002;
      const sp = clamp(ps.split);
      for (const [s, h] of halves) { h.position.set(s * (def.splitApart ?? 0) * sp * (ps.apart ?? 1), -(def.splitDrop ?? 0) * sp * sp, 0); h.rotation.z = -s * (def.splitTip ?? 0) * sp; }
      if (def.apply) def.apply(ps, t);
    },
  };
}

// a prop's state at time t: its numbers after the "prop" tweens, and who holds it (grab / release)
export function propState(sb, spec, t) {
  const ps = { x: spec.x ?? 0, y: spec.y ?? 0, z: spec.z ?? 0, rot: spec.rot ?? 0, tilt: spec.tilt ?? 0, tip: spec.tip ?? 0, squash: 0, steam: spec.steam ?? 0, roll: spec.roll ?? 0, scale: spec.scale ?? 1, slices: spec.slices ?? 10, burst: spec.burst ?? 0, drop: spec.drop ?? 0, char: spec.char ?? 0, burn: 0, flap: spec.flap ?? 0, peck: 0, tug: 0, happy: 0, fall: 0, unfold: spec.unfold ?? 0, print: spec.print ?? 0, toast: 0, len: spec.len ?? 0, apples: spec.apples ?? 10, steps: spec.steps ?? 0, split: 0, open: spec.open ?? 0, latch: 0, slice: 0, smash: 0, scorch: 0, on: 0, fire: 0, glow: spec.glow ?? 0, lid: spec.lid ?? 0, fill: spec.fill ?? 1, spill: 0, twist: spec.twist ?? 0, lit: spec.lit ?? 0, spin: spec.spin ?? 0, shred: spec.shred ?? 0, bulge: 0, ring: 0, cover: spec.cover ?? 0, over: 0, time: spec.time ?? 2.75, write: spec.write ?? 0, stock: spec.stock ?? 1, unroll: 0, cut: 0, bump: 0, tiny: 0, chop: 0, fried: spec.fried ?? 0, yolks: spec.yolks ?? 1, big: 0, flip: 0, crack: 0, unplug: spec.unplug ?? 0, knot: 0, plates: spec.plates ?? 2, bend: 0, balloon: 0, count: spec.count ?? 0, wheelie: 0, broken: 0, level: spec.level ?? 1, splash: 0, magic: 0, name: 0, holes: 0, blot: 0, stack: 0, full: spec.full ?? 0, tail: spec.tail ?? 1, apart: spec.apart ?? 1, rise: spec.rise ?? 0, wobble: spec.wobble ?? 0, puff: spec.puff ?? 0, fade: spec.fade ?? 0, gap: spec.gap ?? 0, feed: spec.feed ?? 0, nextFeed: spec.nextFeed ?? 0, scroll: 0, hold: null, left: null, carry: null };
  const acts = (sb.actions || []).filter((a) => a.at <= t && ((a.do === "prop" && a.id === spec.id) || ((a.do === "grab" || a.do === "release" || a.do === "carry") && a.prop === spec.id))).sort((a, b) => a.at - b.at);
  for (const a of acts) {
    const p = prog(t, a.at, a.dur ?? 0.3), e = ease(a.ease || "inOut")(p);
    if (a.do === "prop") {
      for (const [k, v] of Object.entries(a.set || {})) ps[k] = typeof v === "number" && typeof ps[k] === "number" ? lerp(ps[k], v, e) : v;
      if (a.arc && p < 1) ps.y += 4 * a.arc * e * (1 - e);   // arc: metres it rises above the straight line, mid-flight
    }
    // a grab glides the prop from where it is into the hand while the arm comes up (it never jumps into the hand)
    // grip: the hand holds it at that grip point; keep: it stays exactly where it is and from then on moves with the
    // holder (stage.js measures the offset at the grab), so nothing jumps on the handoff
    else if (a.do === "grab") {
      // a new grip by the hand that already holds it: the prop slides in the hand from the old grip point to the new
      // one over dur (from the side of a jar to under it, say), so nothing jumps
      const h = ps.hold;
      if (h && a.grip && h.grip && h.who === a.who && h.hand === (a.hand || "R") && !h.keep && (a.dur ?? 0) > 0) {
        const g0 = gripPoint(spec, h.grip), g1 = gripPoint(spec, a.grip), e1 = ease(a.ease || "inOut")(prog(t, a.at, a.dur));
        ps.hold = { ...h, grip: g0.map((v, i) => v + (g1[i] - v) * e1) };
        continue;
      }
      const k = a.keep || a.grip ? 1 : ease("out")(prog(t, a.at, a.dur ?? 0.25));
      ps.hold = { who: a.who, hand: a.hand || "R", off: a.off || [0, 0, 0], k, at: a.at, grip: a.grip ?? null, keep: !!a.keep, from: [ps.x, ps.y, ps.z], ...(k < 1 ? { to: [ps.x, ps.y, ps.z] } : {}) };
      ps.left = null;
    }
    else if (a.do === "release") {
      if (p < 1 && ps.hold) ps.hold = { ...ps.hold, to: a.to, k: a.to ? 1 - e : 1, arc: a.to && a.arc ? 4 * a.arc * e * (1 - e) : 0 };
      // without "to" it stays where the hand let go (stage.js works out where that was)
      else { if (!a.to && ps.hold) ps.left = { ...ps.hold, at: a.at + (a.dur ?? 0.3) }; ps.hold = null; if (a.to) [ps.x, ps.y, ps.z] = a.to; }
    }
    // carried by another prop (a raven's beak): { do: "carry", prop, by, off: [x, y, z] (in the carrier's own turned,
    // scaled frame), at } and from then on it rides along; { do: "carry", prop, at } with no `by` lets go of it there
    // (later prop tweens carry on from that spot). Put the carrier where the prop is at the handover: nothing jumps
    else if (a.do === "carry") {
      if (a.by) { ps.carry = { by: a.by, off: a.off || [0, 0, 0] }; ps.hold = null; ps.left = null; }
      else if (ps.carry) { [ps.x, ps.y, ps.z] = carriedAt(sb, ps.carry, a.at); ps.carry = null; }
    }
  }
  if (ps.carry) [ps.x, ps.y, ps.z] = carriedAt(sb, ps.carry, t);
  return ps;
}
function carriedAt(sb, c, t) {
  const spec = (sb.props || []).find((p) => p.id === c.by);
  if (!spec) return [0, 0, 0];
  const r = propState(sb, spec, t), a = (r.rot * Math.PI) / 180, s = r.scale ?? 1, [ox, oy, oz] = c.off;
  return [r.x + (ox * Math.cos(a) + oz * Math.sin(a)) * s, r.y + oy * s, r.z + (-ox * Math.sin(a) + oz * Math.cos(a)) * s];
}
