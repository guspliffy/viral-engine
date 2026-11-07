// Human test character 01 (rig "human-v1"): an ORIGINAL design for the first movement test, not a copy of any
// existing character. A slim young woman about 1.6 m tall (6.8 heads), sage-green loose T-shirt, rolled denim
// trousers, cream canvas sneakers with orange soles, dark chestnut hair in a low short ponytail with side-swept
// bangs. Modelled in the skeleton's rest pose (T pose, facing +z, left = +x) with signed-distance shapes, each tagged
// with the bone that carries it. Units: metres, root (pelvis) at the origin.
import { restPose } from "../../engine/page/rigs/human-skel.js";

const R = restPose();
const at = (b, u = 1) => R[b].start.map((v, i) => v + (R[b].end[i] - v) * u);
const add = (p, d) => p.map((v, i) => v + d[i]);
// a point given in a bone's own frame (its start, the T pose's axes turned with the bone in the bind pose)
const pt = (b, l) => { const W = R[b].W; return [0, 1, 2].map((i) => R[b].start[i] + W[3 * i] * l[0] + W[3 * i + 1] * l[1] + W[3 * i + 2] * l[2]); };
const mir = (p) => [-p[0], p[1], p[2]];
const cone = (a, b, ra, rb, bone, o = {}) => ({ t: "cone", a, b, ra, rb, bone, ...o });
const ell = (c, r, bone, o = {}) => ({ t: "ell", c, r, bone, ...o });
const box = (c, h, round, bone, o = {}) => ({ t: "box", c, h, round, bone, ...o });
const both = (fn) => [...fn("l", 1), ...fn("r", -1)];
const rotX = (a) => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; };
const rotZ = (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; };

export const COLORS = {
  skin: "#f4cfb1", shirt: "#97ad86", denim: "#56708f", shoe: "#efe6d4", sole: "#e0673f", hair: "#4a2c24", band: "#e2a743",
};

// ---------- skin: head, neck, arms, hands (the rest is under the clothes) ----------
const HEAD_C = [0, 0.607, -0.004];
function head() {
  return [
    ell(HEAD_C, [0.081, 0.098, 0.096], "head"),                                   // the skull
    ell([0, 0.575, 0.024], [0.07, 0.072, 0.074], "head", { k: 0.03 }),             // the face's mass
    cone([0, 0.57, 0.035], [0, 0.493, 0.058], 0.058, 0.02, "head", { k: 0.035 }),  // jaw to a small soft chin
    ...[1, -1].map((s) => ell([s * 0.043, 0.548, 0.052], [0.03, 0.03, 0.03], "head", { k: 0.03 })),   // cheeks
    cone([0, 0.574, 0.094], [0, 0.55, 0.101], 0.006, 0.0075, "head", { k: 0.012 }),   // a small nose
    ...[1, -1].map((s) => ell([s * 0.08, 0.57, -0.003], [0.011, 0.025, 0.016], "head", { k: 0.008 })),   // ears
    cone([0, 0.392, -0.018], [0, 0.522, -0.008], 0.05, 0.044, "upperneck", { k: 0.02 }),   // neck
    ell([0, 0.405, -0.015], [0.07, 0.03, 0.05], "lowerneck", { k: 0.03 }),          // the neck's root under the collar
  ];
}
function arm(s, sx) {
  const sh = at(`${s}humerus`, 0), el = at(`${s}humerus`), wr = at(`${s}wrist`, 0.97);
  const mid = at(`${s}radius`, 0.47);
  return [
    cone(at(`${s}humerus`, 0.3), el, 0.04, 0.032, `${s}humerus`, { k: 0.015 }),   // starts inside the sleeve: no skin pokes through the shoulder when the arm lifts
    cone(el, mid, 0.032, 0.033, `${s}radius`, { k: 0.015 }),
    cone(mid, wr, 0.033, 0.021, `${s}wrist`, { k: 0.02 }),
  ];
}
function hand(s, sx) {
  const hb = `${s}hand`, out = [];
  // palm: four metacarpals melted into one flat, gently cupped plate; the thenar mound under the thumb
  const zs = [0.024, 0.008, -0.009, -0.025];
  for (const z of zs) out.push(cone(pt(hb, [sx * 0.008, 0.001, z * 0.6 - 0.001]), pt(hb, [sx * 0.082, -0.001, z]), 0.0125, 0.0105, `${s}hand`, { k: 0.016 }));
  out.push(ell(pt(hb, [sx * 0.03, -0.007, 0.02]), [0.024, 0.011, 0.016], hb, { k: 0.012, m: R[hb].W }));
  for (const f of ["index", "middle", "ring", "pinky"]) {
    const r0 = f === "pinky" ? 0.0078 : 0.0092;
    for (let i = 1; i <= 3; i++) {
      const b = `${s}${f}${i}`, ra = r0 * (1 - 0.1 * (i - 1)), rb = r0 * (1 - 0.1 * i) * (i === 3 ? 0.92 : 1);
      out.push(cone(at(b, 0), at(b, 1), ra, rb, b, { k: i === 1 ? 0.012 : 0.004 }));
    }
  }
  for (let i = 1; i <= 3; i++) { const b = `${s}thumb${i}`; out.push(cone(at(b, 0), at(b, 1), [0.013, 0.0105, 0.0095][i - 1], [0.0105, 0.0095, 0.0078][i - 1], b, { k: i === 1 ? 0.014 : 0.004 })); }
  return out;
}

// ---------- clothes ----------
function shirt() {
  return [
    ell([0, 0.27, -0.008], [0.152, 0.15, 0.108], "thorax"),                         // chest
    ell([0, 0.398, -0.016], [0.078, 0.04, 0.066], "thorax", { k: 0.04 }),            // a crew neck up round the neck's root
    ...[1, -1].map((s) => ell([s * 0.058, 0.255, 0.06], [0.06, 0.055, 0.05], "thorax", { k: 0.05 })),   // bust under the loose shirt
    ell([0, 0.15, -0.012], [0.138, 0.12, 0.1], "upperback", { k: 0.06 }),            // ribs to waist, loose
    ell([0, 0.03, -0.005], [0.15, 0.1, 0.112], "lowerback", { k: 0.05 }),           // waist, hanging loose over the belt
    cone([0, -0.02, 0], [0, -0.075, 0.004], 0.152, 0.158, "root", { k: 0.04 }),      // the hem, a little flared
    ...both((s, sx) => [ell(add(at(`${s}clavicle`), [-sx * 0.015, 0.0, 0]), [0.054, 0.048, 0.056], `${s}clavicle`, { k: 0.04 })]),   // shoulder caps
    ...both((s, sx) => [cone(add(at(`${s}humerus`, 0), [-sx * 0.01, -0.004, 0]), add(at(`${s}humerus`, 0.5), [0, -0.004, 0]), 0.053, 0.05, `${s}humerus`, { k: 0.03 })]),   // short loose sleeves
    { t: "plane", n: [0, 1, 0], d: -0.09, op: "int", k: 0.006 },                     // cut the hem flat
  ];
}
function trousers() {
  return [
    ell([0, -0.05, 0.0], [0.135, 0.1, 0.11], "root"),
    box([0, 0.0, 0.0], [0.12, 0.03, 0.095], 0.03, "lowerback", { k: 0.02 }),       // waistband
    ...both((s, sx) => {
      const hip = at(`${s}femur`, 0), kn = at(`${s}femur`), an = at(`${s}tibia`);
      return [
        cone(at(`${s}femur`, 0.16), kn, 0.072, 0.062, `${s}femur`, { k: 0.04 }),
        cone(kn, an, 0.064, 0.06, `${s}tibia`, { k: 0.02 }),
        cone(add(an, [0, 0.055, 0]), add(an, [0, 0.01, 0]), 0.066, 0.066, `${s}tibia`, { k: 0.004 }),   // rolled cuff
      ];
    }),
  ];
}
const SOLE_Y = -0.857;
function shoes(s, sx) {
  const an = at(`${s}foot`, 0), ball = at(`${s}foot`), toe = at(`${s}toes`);
  return [
    ell(add(an, [0, -0.032, -0.012]), [0.041, 0.045, 0.06], `${s}foot`),
    cone(add(an, [0, -0.04, 0.02]), add(toe, [0, -0.026, 0.02]), 0.042, 0.033, `${s}foot`, { k: 0.03 }),
    cone(add(ball, [0, -0.025, 0]), add(toe, [0, -0.028, 0.018]), 0.037, 0.03, `${s}toes`, { k: 0.02 }),
    cone(add(an, [0, 0.02, -0.01]), add(an, [0, -0.02, 0]), 0.043, 0.045, `${s}tibia`, { k: 0.015 }),   // the collar round the ankle
    { t: "plane", n: [0, 1, 0], d: SOLE_Y + 0.012, op: "int", k: 0.004 },
  ];
}
function soles(s, sx) {
  const an = at(`${s}foot`, 0), toe = at(`${s}toes`);
  const c = [(an[0] + toe[0]) / 2, SOLE_Y + 0.011, (an[2] - 0.075 + toe[2] + 0.05) / 2], L = (toe[2] + 0.05 - (an[2] - 0.075)) / 2;
  return [
    box(c, [0.046, 0.0125, L], 0.011, `${s}foot`),
    box(add(c, [0, 0, L * 0.55]), [0.044, 0.0125, L * 0.45], 0.011, `${s}toes`, { k: 0.01 }),
  ];
}

// ---------- hair: a cap over the skull, side-swept bangs, face-framing locks, a low short ponytail ----------
function hair() {
  const out = [
    ell(add(HEAD_C, [0, 0.014, -0.012]), [0.099, 0.114, 0.112], "head"),
    // hairline: forehead at y 0.64 in front, round the temples, down to the nape behind
    { t: "plane", n: [0, 0.82, -0.57], d: 0.82 * 0.6 - 0.57 * 0.03, op: "int", k: 0.02 },
  ];
  // bangs: locks from the crown's front, swept to her right (−x), tips just above the brows
  const bangs = [[0.046, 0.605, 0.021, 0.07], [0.012, 0.593, 0.023, 0.09], [-0.026, 0.592, 0.022, 0.09], [-0.06, 0.6, 0.019, 0.07]];
  for (const [x, y, r, z] of bangs) out.push(cone([x * 0.5 + 0.012, 0.69, 0.075], [x, y, z + 0.024], r, 0.004, "head", { k: 0.018 }));
  // face-framing locks in front of the ears
  for (const s of [1, -1]) out.push(cone([s * 0.088, 0.645, 0.035], [s * 0.084, 0.512, 0.05], 0.023, 0.006, "head", { k: 0.022 }));
  // back: hair gathered down to the nape, a tie, the ponytail
  out.push(ell([0, 0.56, -0.07], [0.08, 0.08, 0.06], "head", { k: 0.04 }));
  out.push(cone([0, 0.53, -0.1], [0.005, 0.415, -0.122], 0.03, 0.012, "head", { k: 0.02 }));
  out.push(cone([0.004, 0.47, -0.117], [-0.008, 0.40, -0.11], 0.016, 0.005, "head", { k: 0.015 }));
  return out;
}
function band() { return [{ t: "cone", a: [0, 0.535, -0.094], b: [0.0, 0.515, -0.105], ra: 0.024, rb: 0.024, bone: "head" }]; }

export const PARTS = [
  { name: "skin", role: "skin", color: COLORS.skin, h: 0.004, k: 0.012, shapes: [...head(), ...both(arm)] },
  { name: "handL", role: "skin", color: COLORS.skin, h: 0.0024, k: 0.006, shapes: hand("l", 1) },
  { name: "handR", role: "skin", color: COLORS.skin, h: 0.0024, k: 0.006, shapes: hand("r", -1) },
  { name: "shirt", role: "cloth", color: COLORS.shirt, h: 0.007, k: 0.03, shapes: shirt() },
  { name: "trousers", role: "cloth", color: COLORS.denim, h: 0.007, k: 0.03, shapes: trousers() },
  { name: "shoes", role: "cloth", color: COLORS.shoe, h: 0.0045, k: 0.02, shapes: both(shoes) },
  { name: "soles", role: "cloth", color: COLORS.sole, h: 0.004, k: 0.01, shapes: both(soles) },
  { name: "hair", role: "hair", color: COLORS.hair, h: 0.0035, k: 0.015, shapes: hair() },
  { name: "band", role: "cloth", color: COLORS.band, h: 0.003, k: 0.005, shapes: band() },
];
// the face (face.js) sits on the "skin" part's head: these shapes alone make the head field the page ray-casts
export const FACE_SHAPES = head().slice(0, 5);
export const HEAD_CENTRE = HEAD_C;
