import * as THREE from "three";
import { clamp, rng } from "./util.js";

// Props for "Moving One Sofa" (Jonny's four friend comedies #22, 30 Oct 2026), on the "landing" set (set-landing.js).
//   sofahalf     one half of a teal two-seat sofa, cut between its seats (spec.side "L" or "R": which half). Two of
//                them side by side (L at x - SOFA.half / 2, R at x + SOFA.half / 2, same z) are the whole sofa: their
//                inner faces meet at the seam and nothing shows there until the cut. Origin: the half's bottom centre,
//                the seat facing +z. Each half has its OWN outside arm, its seat and back cushion, its share of the
//                base and backrest, and two legs under its outer side and two under its inner edge (the whole sofa
//                stands on six legs: four corners and a centre pair), so a cut half still stands without new legs.
//                cut 0..1: the raw cut face shows on the inner side (pale foam through the backrest, cushions and base,
//                a strip of the wooden frame at the bottom). bump 0..1: the seat and back cushions squash in (a body hits
//                them). plaster: 1 lays a few plaster crumbs on its top (after the ceiling gag). sit works on it.
//   ceilingbreak one patch of plaster ceiling that the sofa hits: its origin on the ceiling's underside (y = the
//                ceiling), facing down. smash 0..1: the cracked dark hole opens; fall 0..1 (tween it linearly over
//                the fall's real time): the chunks drop from the hole and land at spec.lands ([x, z] relative to the
//                origin, on the floor spec.floor below the ceiling), then lie there.
//   spellaura    the Wizard's compact golden lift spell round the sofa: a few thin glowing rings and sparkles,
//                spec.w / spec.d its size. glow 0..1 fades it; it turns slowly on its own. Carry it on a half.
export const SOFA = { half: 0.84, d: 0.82, legH: 0.09, baseTop: 0.39, seat: 0.445, back: 0.9, arm: 0.16, armTop: 0.66 };

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
// a box with softly rounded edges (cushions, the arm): a box whose corners are pulled in a little
function softBox(w, h, d, r = 0.03) {
  const g = new THREE.BoxGeometry(w, h, d, 6, 4, 6), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const ex = Math.max(0, Math.abs(v.x) - (w / 2 - r)) / r, ey = Math.max(0, Math.abs(v.y) - (h / 2 - r)) / r, ez = Math.max(0, Math.abs(v.z) - (d / 2 - r)) / r;
    const k = Math.min(1, Math.hypot(ex, ey, ez)) * r * 0.45;
    if (k > 0) { v.x -= Math.sign(v.x) * k * (ex > 0 ? 1 : 0); v.y -= Math.sign(v.y) * k * (ey > 0 ? 1 : 0); v.z -= Math.sign(v.z) * k * (ez > 0 ? 1 : 0); }
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}
// open-cell foam: pale cream with small darker pores
function foamTex(seed) {
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"), rnd = rng(seed);
  g.fillStyle = "#f4e7b6"; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? "196,170,110" : "255,250,226"},${0.25 + rnd() * 0.3})`; g.beginPath(); g.arc(rnd() * 128, rnd() * 128, 0.8 + rnd() * 1.8, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

export const SOFA_KINDS = {
  sofahalf(P) {
    const S = P.spec, sx = S.side === "R" ? 1 : -1, W = SOFA.half, D = SOFA.d, inner = (sx * -W) / 2, outer = (sx * W) / 2;
    const fab = mat(S.color ?? "#2f8f93", { roughness: 0.9 }), cush = mat(S.color2 ?? "#38a2a4", { roughness: 0.92 }), wood = mat("#6b4428", { roughness: 0.6 });
    const B = SOFA.baseTop, L = SOFA.legH, A = SOFA.arm;
    // the base (seat box) and the backrest frame, each the half's full width from the seam to the outside
    mesh(new THREE.BoxGeometry(W, B - L, D), fab, P.whole, 0, (B + L) / 2, 0);
    mesh(softBox(W, SOFA.back - B, 0.2, 0.04), fab, P.whole, 0, (SOFA.back + B) / 2, -D / 2 + 0.1);
    // the outside arm: from the base up to the arm top, the whole depth, rounded on top
    mesh(softBox(A, SOFA.armTop - B + 0.02, D, 0.05), fab, P.whole, outer - (sx * A) / 2, (SOFA.armTop + B) / 2, 0.005);
    // the seat cushion and the back cushion, between the arm and the seam (a little gap at the seam: two cushions)
    const cw = W - A - 0.025, cx = (outer - sx * A + inner + sx * 0.025) / 2;
    const seat = new THREE.Group(); seat.position.set(cx, B, D / 2 - 0.02); P.whole.add(seat);
    const sc = mesh(softBox(cw, SOFA.seat - B + 0.02, D - 0.24, 0.04), cush, seat, 0, (SOFA.seat - B + 0.02) / 2, -(D - 0.24) / 2);
    const backC = new THREE.Group(); backC.position.set(cx, B + 0.04, -D / 2 + 0.2); P.whole.add(backC);
    const bc = mesh(softBox(cw, 0.4, 0.13, 0.05), cush, backC, 0, 0.2, 0.065); bc.rotation.x = -0.12;
    // legs: two under the outer side, two under the inner edge (the centre pair of the whole sofa)
    for (const x of [outer - sx * 0.06, inner + sx * 0.05]) for (const z of [D / 2 - 0.07, -D / 2 + 0.07]) mesh(new THREE.CylinderGeometry(0.026, 0.02, L, 10), wood, P.whole, x, L / 2, z);
    // the cut face on the inner side (shown from cut > 0): foam through backrest, cushions and base, the frame's wood
    // (a plane faces +z; turned so it faces out of the cut, toward where the other half was: its x runs along the sofa's z)
    const faceG = new THREE.Group(); faceG.position.x = inner - sx * 0.002; faceG.rotation.y = -sx * Math.PI / 2; P.whole.add(faceG);
    const foam = mat("#ffffff", { map: foamTex(S.side === "R" ? 7 : 3), roughness: 0.95 }), raw = mat("#c08a52", { roughness: 0.7 });
    const plane = (w, h, x, y, m) => { const q = mesh(new THREE.PlaneGeometry(w, h), m, faceG, x, y, 0.001); q.castShadow = false; return q; };
    const fx = (z) => sx * z;   // the sofa's z -> the face's x
    plane(D, B - L - 0.06, fx(0), (B + L) / 2 + 0.03, foam);                                         // the base's foam
    plane(D, 0.06, fx(0), L + 0.03, raw);                                                              // the frame's wood at the bottom
    plane(0.2, SOFA.back - B, fx(-D / 2 + 0.1), (SOFA.back + B) / 2, foam);                            // the backrest
    plane(D - 0.24, SOFA.seat - B + 0.02, fx(D / 2 - 0.02 - (D - 0.24) / 2), (SOFA.seat + B + 0.02) / 2, foam);   // the seat cushion
    plane(0.13, 0.38, fx(-D / 2 + 0.265), B + 0.24, foam);                                             // the back cushion
    for (const [z, y] of [[0.12, 0.2], [-0.2, 0.3], [0.25, 0.32]]) { const k = mesh(new THREE.BoxGeometry(0.035, 0.025, 0.02), raw, faceG, fx(z), y, 0.01); k.castShadow = false; }   // staple-ish frame bits
    faceG.visible = false;
    // plaster crumbs on top (after the ceiling gag)
    const crumbs = new THREE.Group(); P.whole.add(crumbs); crumbs.visible = false;
    const crumbM = mat("#efe6d6", { roughness: 0.95 }), rnd = rng(S.side === "R" ? 41 : 17);
    for (let i = 0; i < 7; i++) { const c = mesh(new THREE.DodecahedronGeometry(0.018 + rnd() * 0.02, 0), crumbM, crumbs, (rnd() - 0.5) * (W - 0.2), SOFA.back + 0.005, -D / 2 + 0.05 + rnd() * 0.1); c.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); c.scale.y = 0.6; }
    for (let i = 0; i < 4; i++) { const c = mesh(new THREE.DodecahedronGeometry(0.02 + rnd() * 0.015, 0), crumbM, crumbs, cx + (rnd() - 0.5) * cw * 0.7, SOFA.seat + 0.02, 0.05 + rnd() * 0.2); c.scale.y = 0.6; }
    return {
      grip: SOFA.seat - 0.025,
      apply(ps) {
        faceG.visible = clamp(ps.cut ?? 0) > 0.02;
        const b = clamp(ps.bump ?? 0);
        seat.scale.set(1 + 0.04 * b, 1 - 0.35 * b, 1 - 0.18 * b); backC.position.z = -D / 2 + 0.2 - 0.05 * b; backC.scale.z = 1 - 0.35 * b;
        crumbs.visible = !!ps.plaster;
      },
    };
  },

  ceilingbreak(P) {
    const S = P.spec, fl = S.floor ?? 2.5, R = S.r ?? 0.42, rnd = rng(S.seed ?? 5);
    // the hole: a dark ragged patch with a lighter broken rim, and cracks running out of it (all just under the ceiling)
    const hole = new THREE.Group(); hole.rotation.x = Math.PI / 2; hole.position.y = -0.004; P.whole.add(hole);
    const sh = new THREE.Shape(), n = 14;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, r = R * (0.7 + 0.3 * rnd()); (i ? sh.lineTo : sh.moveTo).call(sh, Math.cos(a) * r, Math.sin(a) * r * 0.8); }
    const dark = new THREE.MeshBasicMaterial({ color: "#3a2c22", side: THREE.DoubleSide }); dark.userData.noOutline = true;
    const holeM = new THREE.Mesh(new THREE.ShapeGeometry(sh), dark); hole.add(holeM);
    const rimM = new THREE.MeshStandardMaterial({ color: "#d9c7a6", roughness: 0.95, side: THREE.DoubleSide });
    const rimMesh = new THREE.Mesh(new THREE.RingGeometry(R * 0.85, R * 1.08, 18, 1), rimM); rimMesh.position.z = -0.001; rimMesh.scale.y = 0.8; hole.add(rimMesh);
    const crackM = new THREE.MeshBasicMaterial({ color: "#6b5440", side: THREE.DoubleSide }); crackM.userData.noOutline = true;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + rnd() * 0.5, len = R * (0.6 + rnd() * 0.9);
      const g = new THREE.PlaneGeometry(len, 0.012); g.translate(len / 2, 0, 0);
      const c = new THREE.Mesh(g, crackM); c.position.set(Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.72, -0.002); c.rotation.z = a + (rnd() - 0.5) * 0.4; hole.add(c);
    }
    hole.visible = false;
    // the falling chunks: from inside the hole down to their landing spots on the floor
    const chunkM = mat("#efe3cf", { roughness: 0.95 }), lands = S.lands ?? [[0, 0.3], [0.3, 0.5], [-0.3, 0.6], [0.5, 0.2], [-0.1, 0.8]];
    const chunks = lands.map(([lx, lz], i) => {
      const s = 0.05 + rnd() * 0.05, m = mesh(new THREE.DodecahedronGeometry(s, 0), chunkM, P.whole, 0, 0, 0);
      m.scale.set(1.3, 0.7, 1); const from = [(rnd() - 0.5) * R, -0.04, (rnd() - 0.5) * R * 0.8], to = [lx, -fl + s * 0.6, lz], spin = [rnd() * 6, rnd() * 6, rnd() * 6], delay = i * 0.06;
      return { m, from, to, spin, delay };
    });
    return {
      grip: 0,
      apply(ps) {
        hole.visible = clamp(ps.smash ?? 0) > 0.01;
        const f = clamp(ps.fall ?? 0);
        for (const c of chunks) {
          c.m.visible = hole.visible;
          const u = clamp((f - c.delay) / (1 - c.delay)), k = u * u;   // accelerating, like a falling stone
          c.m.position.set(c.from[0] + (c.to[0] - c.from[0]) * u, c.from[1] + (c.to[1] - c.from[1]) * k, c.from[2] + (c.to[2] - c.from[2]) * u);
          c.m.rotation.set(c.spin[0] * u, c.spin[1] * u, c.spin[2] * u);
        }
      },
    };
  },

  spellaura(P) {
    const S = P.spec, w = S.w ?? 2.0, d = S.d ?? 1.1, col = new THREE.Color(S.color ?? "#ffd25a");
    const ringM = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }); ringM.userData.noOutline = true;
    const rings = [];
    for (const [y, tilt, k] of [[0.18, 0.18, 1.0], [0.5, -0.12, 0.92], [0.82, 0.22, 0.8]]) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.012, 6, 64), ringM); r.scale.set((w / 1.0) * k * 0.55, (d / 1.0) * k * 0.55, 1); r.rotation.x = Math.PI / 2 + tilt; r.position.y = y; r.castShadow = false; P.whole.add(r); rings.push(r);
    }
    const sparkM = new THREE.MeshBasicMaterial({ color: "#fff3b0", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }); sparkM.userData.noOutline = true;
    const rnd = rng(9), sparks = [];
    for (let i = 0; i < 18; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.018 + rnd() * 0.015, 0), sparkM); s.castShadow = false; P.whole.add(s); sparks.push({ s, a: rnd() * 6.28, y: rnd() * 1.0, sp: 0.6 + rnd() * 0.8 }); }
    return {
      grip: 0,
      apply(ps, t = 0) {
        const g = clamp(ps.glow ?? 0);
        ringM.opacity = 0.85 * g; sparkM.opacity = g; P.whole.visible = g > 0.01;
        rings.forEach((r, i) => { r.rotation.z = (i % 2 ? -1 : 1) * t * 1.6 + i; });
        for (const q of sparks) { const a = q.a + t * q.sp * 2.2; q.s.position.set(Math.cos(a) * w * 0.55, (q.y + t * 0.4 * q.sp) % 1.0, Math.sin(a) * d * 0.55); }
      },
    };
  },
};
