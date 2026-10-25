import * as THREE from "three";
import { clamp, lerp, ease, prog } from "./util.js";

// Props for the comedy clips, in the engine's soft 3D style: table, chair, teacup, pickle jar, cookie, plate, wall
// clock, gift box, phone, cake, banner and a pickle that can leave its jar. The first seven have the same names and
// settings as the puppet props (puppet/page/props.js), so a puppet storyboard ports over.
//   sb.props[]: { id, kind, x, y (the prop's bottom), z, rot (degrees about y; a chair at 90 faces right), scale }
//   { do: "prop", id, at, dur, ease, set: { split, glow, lid, twist, fill, spill, lit, spin, x, y, z, rot, scale } } tweens the numbers
//   { who, do: "grab", prop, hand: R | L | both, off: [x, y, z] } the prop follows the hand (it lifts its arm to "hold")
//   { who, do: "release", prop, to: [x, y, z], dur, arc } puts it down at `to` (or leaves it where the hand let go);
//   arc (metres) throws it in a curve instead of a straight line, and works on a prop tween's x, y, z too
// Splitting: each prop that can split is built as a left and a right half that slide and tip apart.
export const SEAT_Y = 0.42;   // a chair's seat height (timeline.js sits a character on it)
export const TABLE_Y = 0.62;  // a table's top
// grip points: where a hand closes on a prop, in the prop's own frame (metres from its bottom centre, before rot and
// scale). A grab or an arm pose names one ("grip": "handle") or gives its own point ("grip": [x, y, z]).
const GRIPS = {
  teacup: { handle: [0.12, 0.07, 0] },   // the hand round the outside of the handle (cup on its saucer; -0.012 without)
};
export function gripPoint(spec, grip) {
  if (Array.isArray(grip)) return grip;
  const g = (GRIPS[spec.kind] || {})[grip];
  if (!g) throw new Error(`prop ${spec.id} (${spec.kind}) has no grip "${grip}"`);
  return spec.kind === "teacup" && spec.saucer === false ? [g[0], g[1] - 0.012, g[2]] : g;
}
// a grip point in the world for a prop whose bottom centre is at `at` (its rot about y and its scale applied)
export function gripWorld(spec, grip, at, rot = spec.rot ?? 0, scale = spec.scale ?? 1) {
  const [gx, gy, gz] = gripPoint(spec, grip), r = (rot * Math.PI) / 180;
  return [at[0] + scale * (gx * Math.cos(r) + gz * Math.sin(r)), at[1] + scale * gy, at[2] + scale * (-gx * Math.sin(r) + gz * Math.cos(r))];
}

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
// a half of a round thing: theta 0..PI is the right half (x >= 0), PI..2PI the left
const TH = (s) => (s > 0 ? 0 : Math.PI);

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
  table(P) {
    const top = mat("#c98a4b", { roughness: 0.55 }), leg = mat("#8a5a2e");
    const W = 1.1, D = 0.7;
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
    return {
      grip: 0.05, splitApart: 0.06, splitTip: 0.5, splitDrop: 0,
      apply(ps) {
        const f = clamp(ps.fill) * (1 - clamp(ps.split * 2)), y = 0.02 + 0.072 * f, r = 0.045 + 0.018 * f;
        tea.visible = f > 0.02; tea.position.y = y; tea.scale.setScalar(r);
        puddle.visible = ps.spill > 0.01; puddle.position.set(0.04, 0.003, 0.03); puddle.scale.set(0.05 + 0.2 * ps.spill, 0.04 + 0.15 * ps.spill, 1);
      },
    };
  },
  saucer(P) {
    mesh(new THREE.CylinderGeometry(0.11, 0.085, 0.012, 32), mat("#f4f1ea", { roughness: 0.35 }), P.whole, 0, 0.006, 0);
    return { grip: 0.006 };
  },
  jar(P) {
    const glass = new THREE.MeshPhysicalMaterial({ color: "#dff3ea", roughness: 0.08, transmission: 0, transparent: true, opacity: 0.32, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false });
    // see-through parts get a fixed draw order (brine, then glass): sorted by distance they swap from frame to frame
    // as things move, and the jar flickers
    const body = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.28, 36, 1, true), glass, P.whole, 0, 0.14, 0); body.castShadow = false; body.renderOrder = 2;
    const base = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.01, 36), glass, P.whole, 0, 0.005, 0); base.castShadow = false; base.renderOrder = 2;
    const brine = new THREE.MeshStandardMaterial({ color: "#c9d97a", transparent: true, opacity: 0.35, roughness: 0.3, depthWrite: false });
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
    const m = mat("#5f9a3a", { roughness: 0.5 }), tumble = new THREE.Group(); tumble.position.y = 0.115; P.whole.add(tumble);
    const pk = mesh(new THREE.CapsuleGeometry(0.045, 0.14, 8, 16), m, tumble, 0, 0, 0); pk.rotation.z = 0.25;
    for (let i = 0; i < 6; i++) { const b = mesh(new THREE.SphereGeometry(0.009, 8, 6), m, pk, Math.cos(i * 2.1) * 0.042, -0.06 + i * 0.024, Math.sin(i * 2.1) * 0.042); b.castShadow = false; }
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
  // a phone, its screen facing +z (rot 180 turns the screen to the holder for a selfie); `glow` lights the screen
  phone(P) {
    const body = mat("#23242c", { roughness: 0.35, metalness: 0.4 });
    mesh(new THREE.BoxGeometry(0.078, 0.155, 0.012), body, P.whole, 0, 0.0775, 0);
    const screenM = new THREE.MeshStandardMaterial({ color: "#1c3a52", roughness: 0.2, emissive: new THREE.Color("#8fd0ff"), emissiveIntensity: 0.25 });
    mesh(new THREE.PlaneGeometry(0.068, 0.138), screenM, P.whole, 0, 0.0775, 0.0062).castShadow = false;
    // the camera bump on the back
    mesh(new THREE.BoxGeometry(0.03, 0.03, 0.006), mat("#3a3c46", { roughness: 0.3 }), P.whole, -0.016, 0.13, -0.008);
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.004, 16), mat("#0b0b10", { roughness: 0.1, metalness: 0.6 }), P.whole, -0.016, 0.13, -0.012).rotation.x = Math.PI / 2;
    return { grip: 0.05, apply(ps) { screenM.emissiveIntensity = 0.25 + 1.2 * clamp(ps.glow); } };
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
    const red = mat("#c0392b", { roughness: 0.5 }), face = mat("#f4efe2", { roughness: 0.6 }), ink = mat("#11101c");
    for (const [s, h] of P.halves) {
      const r = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 40, 1, false, TH(s), Math.PI), red, h); r.rotation.x = Math.PI / 2;
      const f = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.062, 40, 1, false, TH(s), Math.PI), face, h); f.rotation.x = Math.PI / 2;
      // hour hand on the left half, minute hand on the right
      const [a, l, w] = s < 0 ? [((2.75 % 12) / 12) * Math.PI * 2, 0.1, 0.02] : [(0.75 % 1) * Math.PI * 2, 0.16, 0.012];
      const hnd = new THREE.Mesh(new THREE.BoxGeometry(w, l, 0.006), ink); hnd.geometry.translate(0, l / 2, 0); hnd.rotation.z = -a; hnd.position.z = 0.036; h.add(hnd);
    }
    return { grip: 0, splitApart: 0.08, splitTip: 0.6, splitDrop: 0.35 };
  },
};

export function buildProp(spec) {
  const root = new THREE.Group(), whole = new THREE.Group(); root.add(whole);
  const halves = [1, -1].map((s) => { const h = new THREE.Group(); whole.add(h); return [s, h]; });
  const P = { root, whole, halves, spec };
  const kind = KINDS[spec.kind];
  if (!kind) throw new Error(`unknown prop kind: ${spec.kind}`);
  const def = kind(P);
  return {
    spec, root, grip: def.grip ?? 0,
    apply(ps, t) {
      root.position.set(ps.x, ps.y, ps.z); root.rotation.set(0, (ps.rot * Math.PI) / 180, 0);
      // squash: a cartoon compression toward the bottom (a cup touching down), the volume kept
      const sc = Math.max(ps.scale, 0.0001), q = ps.squash || 0;
      root.scale.set(sc * (1 + q / 2), sc * (1 - q), sc * (1 + q / 2)); root.visible = ps.scale > 0.002;
      const sp = clamp(ps.split);
      for (const [s, h] of halves) { h.position.set(s * (def.splitApart ?? 0) * sp, -(def.splitDrop ?? 0) * sp * sp, 0); h.rotation.z = -s * (def.splitTip ?? 0) * sp; }
      if (def.apply) def.apply(ps, t);
    },
  };
}

// a prop's state at time t: its numbers after the "prop" tweens, and who holds it (grab / release)
export function propState(sb, spec, t) {
  const ps = { x: spec.x ?? 0, y: spec.y ?? 0, z: spec.z ?? 0, rot: spec.rot ?? 0, scale: spec.scale ?? 1, split: 0, glow: spec.glow ?? 0, lid: spec.lid ?? 0, twist: spec.twist ?? 0, lit: spec.lit ?? 0, spin: spec.spin ?? 0, fill: spec.fill ?? 1, spill: 0, squash: 0, hold: null, left: null };
  const acts = (sb.actions || []).filter((a) => a.at <= t && ((a.do === "prop" && a.id === spec.id) || ((a.do === "grab" || a.do === "release") && a.prop === spec.id))).sort((a, b) => a.at - b.at);
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
      const k = a.keep || a.grip ? 1 : ease("out")(prog(t, a.at, a.dur ?? 0.25));
      ps.hold = { who: a.who, hand: a.hand || "R", off: a.off || [0, 0, 0], k, at: a.at, grip: a.grip ?? null, keep: !!a.keep, from: [ps.x, ps.y, ps.z], ...(k < 1 ? { to: [ps.x, ps.y, ps.z] } : {}) };
      ps.left = null;
    }
    else if (a.do === "release") {
      if (p < 1 && ps.hold) ps.hold = { ...ps.hold, to: a.to, k: a.to ? 1 - e : 1, arc: a.to && a.arc ? 4 * a.arc * e * (1 - e) : 0 };
      // without "to" it stays where the hand let go (stage.js works out where that was)
      else { if (!a.to && ps.hold) ps.left = { ...ps.hold, at: a.at + (a.dur ?? 0.3) }; ps.hold = null; if (a.to) [ps.x, ps.y, ps.z] = a.to; }
    }
  }
  return ps;
}
