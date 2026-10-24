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
  teacup(P) {
    const china = mat("#f4f1ea", { roughness: 0.35 }), band = mat("#3d8fb0", { roughness: 0.4 });
    const prof = [[0.0, 0.0], [0.045, 0.0], [0.05, 0.012], [0.062, 0.06], [0.07, 0.1], [0.064, 0.1], [0.056, 0.062], [0.042, 0.016], [0.0, 0.016]].map(([x, y]) => new THREE.Vector2(x, y));
    for (const [s, h] of P.halves) {
      mesh(new THREE.CylinderGeometry(0.11, 0.085, 0.012, 32, 1, false, TH(s), Math.PI), china, h, 0, 0.006, 0);
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
    const lid = new THREE.Group(); P.whole.add(lid);
    mesh(new THREE.CylinderGeometry(0.118, 0.118, 0.045, 36), mat("#c7372f", { roughness: 0.4, metalness: 0.3 }), lid, 0, 0, 0);
    // grip ridges and one white stripe round the lid's edge, so a turning lid reads as turning
    const ridgeM = mat("#9e2a24", { roughness: 0.45, metalness: 0.3 });
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, r = mesh(new THREE.BoxGeometry(0.008, 0.038, 0.006), ridgeM, lid, 0.119 * Math.sin(a), 0, 0.119 * Math.cos(a)); r.rotation.y = a; r.castShadow = false; }
    const stripe = mesh(new THREE.BoxGeometry(0.03, 0.04, 0.008), mat("#f4f1ea", { roughness: 0.5 }), lid, 0, 0, 0.121); stripe.castShadow = false;
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
  // a bus-stop bench (its seat at SEAT_Y, like a chair, so "sit" works), facing +z
  bench(P) {
    const slat = mat("#b97a45", { roughness: 0.7 }), metal = mat("#3b4250", { roughness: 0.5, metalness: 0.3 });
    for (let k = 0; k < 3; k++) mesh(new THREE.BoxGeometry(1.2, 0.035, 0.11), slat, P.whole, 0, SEAT_Y - 0.02, 0.13 - k * 0.13);
    for (let k = 0; k < 2; k++) mesh(new THREE.BoxGeometry(1.2, 0.1, 0.03), slat, P.whole, 0, SEAT_Y + 0.2 + k * 0.14, -0.24);
    for (const x of [-0.52, 0.52]) { mesh(new THREE.BoxGeometry(0.05, SEAT_Y - 0.04, 0.4), metal, P.whole, x, (SEAT_Y - 0.04) / 2, -0.03); mesh(new THREE.BoxGeometry(0.04, 0.42, 0.04), metal, P.whole, x, SEAT_Y + 0.18, -0.26); }
    return { grip: 0 };
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
      root.position.set(ps.x, ps.y, ps.z); root.rotation.set(((ps.tilt ?? 0) * Math.PI) / 180, (ps.rot * Math.PI) / 180, ((ps.roll ?? 0) * Math.PI) / 180, "YXZ");
      root.scale.setScalar(Math.max(ps.scale, 0.0001)); root.visible = ps.scale > 0.002;
      const sp = clamp(ps.split);
      for (const [s, h] of halves) { h.position.set(s * (def.splitApart ?? 0) * sp, -(def.splitDrop ?? 0) * sp * sp, 0); h.rotation.z = -s * (def.splitTip ?? 0) * sp; }
      if (def.apply) def.apply(ps, t);
    },
  };
}

// a prop's state at time t: its numbers after the "prop" tweens, and who holds it (grab / release)
export function propState(sb, spec, t) {
  const ps = { x: spec.x ?? 0, y: spec.y ?? 0, z: spec.z ?? 0, rot: spec.rot ?? 0, tilt: spec.tilt ?? 0, roll: spec.roll ?? 0, scale: spec.scale ?? 1, slices: spec.slices ?? 10, toast: 0, len: spec.len ?? 0, apples: spec.apples ?? 10, steps: spec.steps ?? 0, split: 0, open: 0, latch: 0, slice: 0, smash: 0, scorch: 0, on: 0, fire: 0, glow: spec.glow ?? 0, lid: spec.lid ?? 0, fill: spec.fill ?? 1, spill: 0, twist: spec.twist ?? 0, lit: spec.lit ?? 0, spin: spec.spin ?? 0, bulge: 0, full: spec.full ?? 0, hold: null, left: null };
  const acts = (sb.actions || []).filter((a) => a.at <= t && ((a.do === "prop" && a.id === spec.id) || ((a.do === "grab" || a.do === "release") && a.prop === spec.id))).sort((a, b) => a.at - b.at);
  for (const a of acts) {
    const p = prog(t, a.at, a.dur ?? 0.3), e = ease(a.ease || "inOut")(p);
    if (a.do === "prop") {
      for (const [k, v] of Object.entries(a.set || {})) ps[k] = typeof v === "number" && typeof ps[k] === "number" ? lerp(ps[k], v, e) : v;
      if (a.arc && p < 1) ps.y += 4 * a.arc * e * (1 - e);   // arc: metres it rises above the straight line, mid-flight
    }
    // a grab glides the prop from where it is into the hand while the arm comes up (it never jumps into the hand)
    else if (a.do === "grab") { const k = ease("out")(prog(t, a.at, a.dur ?? 0.25)); ps.hold = { who: a.who, hand: a.hand || "R", off: a.off || [0, 0, 0], k, ...(k < 1 ? { to: [ps.x, ps.y, ps.z] } : {}) }; ps.left = null; }
    else if (a.do === "release") {
      if (p < 1 && ps.hold) ps.hold = { ...ps.hold, to: a.to, k: a.to ? 1 - e : 1, arc: a.to && a.arc ? 4 * a.arc * e * (1 - e) : 0 };
      // without "to" it stays where the hand let go (stage.js works out where that was)
      else { if (!a.to && ps.hold) ps.left = { ...ps.hold, at: a.at + (a.dur ?? 0.3) }; ps.hold = null; if (a.to) [ps.x, ps.y, ps.z] = a.to; }
    }
  }
  return ps;
}
