import * as THREE from "three";
import { clamp } from "./util.js";

// Props for "Don't Touch the Charger" (Jonny's story library #08, 28 Oct 2026): a small white power bank charging the
// Wizard's phone over a cream cable, and a pale-blue bowl of round biscuits that Dragon steals from.
//   chargebank  a small matte white power bank lying flat (its bottom centre at the origin, long side along x, front
//               +z), four soft charge lights on the front. Its one port is in its LEFT side wall (-x), and the cable's
//               plug housing sits in it for the whole clip (it never comes out). spec.to names the phone: the cable runs
//               from the plug out to the left, lies in a slack curve on the tabletop and rises into the phone's bottom
//               edge (stage.js calls link() with the phone's position and root every frame, so it follows the hand).
//               spec.slack bows the tabletop curve toward the camera (metres, default 0.05); spec.cable its colour.
//               No power button is modelled, so a reaching hand can only be aiming for the plug.
//   snackbowl   a pale-blue ceramic bowl (origin = its bottom centre) with spec.biscuits (default 2) round biscuits
//               seated inside, leaning on each other and showing above the rim.
//   biscuit     one round golden biscuit (origin = its centre, faces along z), the one that leaves the bowl. Grip
//               "edge" holds it by its top rim, "side" by its -x rim (the fingers beside it, its face clear). `eaten`
//               0..1: it hides at 1 (tween it to 1 while it is inside the mouth, behind the face, so it is occluded,
//               never vanishing in the air).
export const CHARGER = {
  bank: { w: 0.12, h: 0.028, d: 0.07 },   // the power bank's size before scale
  plugOut: 0.026,                          // how far the plug housing stands out of the left wall
  bowlRim: 0.088,                          // the bowl's rim height
  biscuitR: 0.042,                         // a biscuit's radius
  // where biscuit A sits in the bowl before it is taken (in the bowl's frame, before its scale), and its lean (deg)
  seatA: [-0.01, 0.095, 0.045], leanA: -15,
};
export const CHARGER_GRIPS = {
  biscuit: { edge: [0, CHARGER.biscuitR * 0.75, 0], side: [-CHARGER.biscuitR * 1.35, 0, 0] },
};

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }

// a box with rounded vertical edges (w along x, h up, d along z), its bottom at y 0
function softBox(w, h, d, r) {
  const s = new THREE.Shape(), x = w / 2, z = d / 2;
  s.moveTo(-x + r, -z); s.lineTo(x - r, -z); s.absarc(x - r, -z + r, r, -Math.PI / 2, 0); s.lineTo(x, z - r); s.absarc(x - r, z - r, r, 0, Math.PI / 2);
  s.lineTo(-x + r, z); s.absarc(-x + r, z - r, r, Math.PI / 2, Math.PI); s.lineTo(-x, -z + r); s.absarc(-x + r, -z + r, r, Math.PI, Math.PI * 1.5);
  const b = Math.min(0.004, h * 0.2);
  const g = new THREE.ExtrudeGeometry(s, { depth: h - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b * 0.8, bevelSegments: 3, curveSegments: 8 });
  g.rotateX(-Math.PI / 2); g.translate(0, b, 0);   // the shape lies in x/z, extruded upward
  return g;
}

// a round biscuit: a short, soft-edged disc with a ring of docking holes and a darker baked rim, facing +z
function biscuitMesh(parent) {
  const R = CHARGER.biscuitR, T = 0.013, dough = mat("#e2a85a", { roughness: 0.85 }), rim = mat("#c98a3e", { roughness: 0.85 }), dot = mat("#a86a2c", { roughness: 0.9 });
  const g = new THREE.Group(); parent.add(g);
  const body = mesh(new THREE.CylinderGeometry(R, R, T, 32), dough, g); body.rotation.x = Math.PI / 2;
  const edge = mesh(new THREE.TorusGeometry(R - T * 0.15, T * 0.52, 8, 36), rim, g); edge.scale.z = 0.95;
  for (const [x, y] of [[0, 0], [0.018, 0.012], [-0.018, 0.012], [0.018, -0.012], [-0.018, -0.012], [0, 0.024], [0, -0.024]])
    for (const s of [1, -1]) { const d = mesh(new THREE.SphereGeometry(0.0032, 8, 6), dot, g, x, y, s * T * 0.5); d.scale.z = 0.35; d.castShadow = false; }
  return g;
}

export const CHARGER_KINDS = {
  chargebank(P) {
    const S = P.spec, { w, h, d } = CHARGER.bank, white = mat(S.color ?? "#f3f1ec", { roughness: 0.62 });
    const cream = mat(S.cable ?? "#efe6d2", { roughness: 0.55 }), R = S.thick ?? 0.0055, slack = S.slack ?? 0.05;
    mesh(softBox(w, h, d, 0.012), white, P.whole);
    // a faint seam round the middle, and the four charge lights on the front
    const seam = mesh(new THREE.BoxGeometry(w * 0.985, 0.0012, d * 0.985), mat("#dedbd3", { roughness: 0.7 }), P.whole, 0, h * 0.5, 0); seam.castShadow = false;
    const led = new THREE.MeshBasicMaterial({ color: "#bfe6ff" });
    for (let i = 0; i < 4; i++) mesh(new THREE.CircleGeometry(0.0022, 12), led, P.whole, -0.012 + i * 0.008, h * 0.5, d / 2 + 0.0006).castShadow = false;
    // the port in the left wall: a dark slot, and the cable's plug housing pushed into it (a slim cream block with a
    // strain-relief boot), standing out along -x
    mesh(new THREE.BoxGeometry(0.002, 0.009, 0.02), mat("#2a2a2e", { roughness: 0.4 }), P.whole, -w / 2 - 0.0005, h * 0.5, 0).castShadow = false;
    mesh(new THREE.BoxGeometry(0.016, 0.011, 0.018), cream, P.whole, -w / 2 - 0.008, h * 0.5, 0);
    const boot = mesh(new THREE.CylinderGeometry(R * 1.25, R * 1.7, CHARGER.plugOut - 0.016, 12), cream, P.whole, -w / 2 - 0.016 - (CHARGER.plugOut - 0.016) / 2, h * 0.5, 0);
    boot.rotation.z = Math.PI / 2;
    const plugEnd = new THREE.Vector3(-w / 2 - CHARGER.plugOut, h * 0.5, 0);
    // the phone end: a small cream boot out of the phone's bottom edge
    const phoneBoot = mesh(new THREE.CylinderGeometry(R * 1.3, R * 1.3, 0.016, 12), cream, P.whole); phoneBoot.visible = false;
    let tube = null;
    const build = (e, down) => {
      if (tube) { P.whole.remove(tube); tube.geometry.dispose(); }
      const F = R;                                                    // lying on the tabletop
      const e1 = e.clone().addScaledVector(down, 0.016), e2 = e.clone().addScaledVector(down, 0.06);
      const s1 = plugEnd.clone().add(new THREE.Vector3(-0.035, 0, 0)); s1.y = F + 0.004;
      const foot = new THREE.Vector3(e.x + 0.03, F, Math.max(e.z, plugEnd.z) + 0.02);
      const mid = s1.clone().lerp(foot, 0.5); mid.y = F; mid.z += slack;
      const pts = [plugEnd, s1, mid, foot];
      // rise from the table toward the phone; the last stretch hangs straight out of its bottom edge
      if (e2.y > F + 0.06) pts.push(new THREE.Vector3((foot.x + e2.x) / 2, F + 0.03, (foot.z + e2.z) / 2 + 0.01));
      pts.push(e2, e1);
      tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, "centripetal"), 72, R, 8, false), cream);
      tube.castShadow = true; tube.receiveShadow = true; P.whole.add(tube);
      phoneBoot.visible = true; phoneBoot.position.copy(e).addScaledVector(down, 0.008);
      phoneBoot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), down);
    };
    return {
      grip: h,
      link(world, root) {
        P.root.updateMatrixWorld(true);
        const e = P.root.worldToLocal(world.clone());
        // the phone's own "down" (its -y), in this prop's frame
        let down = new THREE.Vector3(0, -1, 0);
        if (root) {
          const qp = root.getWorldQuaternion(new THREE.Quaternion()), qb = P.root.getWorldQuaternion(new THREE.Quaternion());
          down.applyQuaternion(qp).applyQuaternion(qb.invert()).normalize();
        }
        build(e, down);
      },
    };
  },
  snackbowl(P) {
    const S = P.spec, china = mat(S.color ?? "#a9cfe8", { roughness: 0.38 }), inner = mat(S.inner ?? "#d9ecf7", { roughness: 0.36 });
    const RIM = CHARGER.bowlRim, prof = [[0, 0], [0.062, 0], [0.066, 0.006], [0.062, 0.013], [0.092, 0.02], [0.128, 0.046], [0.146, 0.074], [0.15, RIM], [0.146, RIM + 0.005],
      [0.139, RIM - 0.002], [0.128, 0.06], [0.1, 0.032], [0.06, 0.022], [0, 0.02]].map(([x, y]) => new THREE.Vector2(x, y));
    const outer = mesh(new THREE.LatheGeometry(prof.slice(0, 9), 56), china, P.whole); outer.material.side = THREE.DoubleSide;
    const well = mesh(new THREE.LatheGeometry(prof.slice(8), 56), inner, P.whole); well.material.side = THREE.DoubleSide; well.castShadow = false;
    // the biscuits that stay: leaning back against the far wall, their tops above the rim
    const seats = [[[-0.045, 0.062, -0.03], -18, 14], [[0.048, 0.06, -0.026], -20, -12], [[0.0, 0.064, -0.058], -10, 3]];
    for (let i = 0; i < (S.biscuits ?? 2); i++) {
      const [p, lean, roll] = seats[i], b = biscuitMesh(P.whole);
      b.position.set(...p); b.rotation.set((lean * Math.PI) / 180, 0, (roll * Math.PI) / 180);
    }
    return { grip: RIM };
  },
  biscuit(P) {
    const b = biscuitMesh(P.whole);
    return { grip: 0, apply(ps) { b.visible = clamp(ps.eaten ?? 0) < 0.999; } };
  },
};
