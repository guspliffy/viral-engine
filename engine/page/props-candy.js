import * as THREE from "three";

// Props for "The Candy Bodyguard" (Jonny's story library #12, 29 Oct 2026), in their own file so the clips made in
// parallel never edit the same one (props3d.js merges these into its KINDS and GRIPS):
//   toyspider  a tiny rigid rubber toy spider, the size of a wrapped sweet (leg span spec.span, default 0.13 m): a
//              smooth dark moulded body with a faint seam round its middle, a small head at its front (+z), and eight
//              rounded legs, four a side, each bent up at the knee and down to a rounded foot on the table. No fur,
//              fangs, web or face: a prop, not a character. Its origin is the bottom centre, where the feet stand.
//              Grip "body": the top of its back. spec.color: the plastic (default near-black); spec.mark: a small two-dot
//              mark on its back in that colour (a colour accent that separates it from a dark glove at phone size).
//   jambwall   the hall's right-hand wall with the open doorway beside it: a cream wall panel (spec.w wide, spec.h tall,
//              spec.t thick) whose LEFT edge is the doorway's pale wooden jamb, at the prop's x; the wall runs to +x.
//              Behind the opening a dim violet-blue room (spec.room: { w, d, color }; d = how far behind the wall its
//              back wall stands) so a character tucked behind the jamb is seen against the cool room, as the brief's
//              lighting asks. The door leaf is not there (the brief: it never moves). A skirting board at the foot.
export const SPIDER = { span: 0.13, body: 0.03, h: 0.032 };
export const JAMB = { w: 1.6, h: 2.6, t: 0.14, trim: 0.075 };
export const CANDY_GRIPS = {
  toyspider: { body: [0, SPIDER.h + 0.004, 0] },
};

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
// a rounded rod from a to b (radius r): a capsule turned onto the segment
function rod(parent, m, a, b, r) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
  const o = mesh(new THREE.CapsuleGeometry(r, Math.max(0.0001, len), 4, 8), m, parent);
  o.position.copy(A).add(B).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  return o;
}

export const CANDY_KINDS = {
  toyspider(P) {
    const S = P.spec, k = (S.span ?? SPIDER.span) / SPIDER.span;
    const g = new THREE.Group(); g.scale.setScalar(k); P.whole.add(g);
    // moulded matte plastic: dark, one soft highlight, no gloss
    const plastic = mat(S.color ?? "#1d1b22", { roughness: 0.42, metalness: 0.05 });
    const seamM = mat("#34313d", { roughness: 0.5 });
    const R = SPIDER.body, Y = 0.024;   // the body's centre height: the legs lift it clear of the table
    const body = mesh(new THREE.SphereGeometry(R, 24, 16), plastic, g, 0, Y, -0.008); body.scale.set(1, 0.62, 1.25);
    const head = mesh(new THREE.SphereGeometry(R * 0.55, 18, 12), plastic, g, 0, Y - 0.002, 0.03); head.scale.set(1, 0.72, 0.9);
    // the mould seam: a thin ring round the body's widest line
    const seam = mesh(new THREE.TorusGeometry(R * 1.0, 0.0012, 6, 40), seamM, g, 0, Y, -0.008); seam.rotation.x = Math.PI / 2; seam.scale.set(1, 1.25, 1); seam.castShadow = false;
    // spec.mark: a small painted mark on its back (a colour accent so it separates from a dark glove at phone size)
    if (S.mark) for (const dz of [-0.012, 0.004]) { const m = mesh(new THREE.SphereGeometry(0.0075, 12, 8), mat(S.mark, { roughness: 0.5 }), g, 0, Y + R * 0.6, -0.008 + dz); m.scale.set(1, 0.35, 1); m.castShadow = false; }
    // eight legs, four a side: from the body's side up to a knee, then down to a rounded foot on the table (y 0)
    const half = SPIDER.span / 2, legR = 0.0038;
    const angles = [52, 18, -14, -46];   // degrees from straight out to the side, front (+z) first
    for (const sx of [-1, 1]) angles.forEach((a, i) => {
      const q = (a * Math.PI) / 180, dir = [sx * Math.cos(q), 0, Math.sin(q)];
      const hip = [dir[0] * R * 0.85, Y + 0.002, -0.008 + dir[2] * R * 1.0];
      const reach = half * (i === 0 || i === 3 ? 0.98 : 0.9);
      const knee = [dir[0] * reach * 0.55, Y + 0.022, -0.008 + dir[2] * reach * 0.55];
      const foot = [dir[0] * reach, legR, -0.008 + dir[2] * reach];
      rod(g, plastic, hip, knee, legR); rod(g, plastic, knee, foot, legR);
      mesh(new THREE.SphereGeometry(legR * 1.35, 8, 6), plastic, g, ...foot);
    });
    return { grip: SPIDER.h };
  },

  jambwall(P) {
    const S = P.spec, W = S.w ?? JAMB.w, H = S.h ?? JAMB.h, T = S.t ?? JAMB.t, TR = JAMB.trim;
    const wallM = mat(S.color ?? "#efdcbc", { roughness: 0.9 }), trimM = mat(S.trim ?? "#f3e8d6", { roughness: 0.7 });
    const skirtM = mat(S.skirt ?? "#e6d2b0", { roughness: 0.75 });
    // the wall panel, its left edge at x 0, front face at z +T/2
    mesh(new THREE.BoxGeometry(W, H, T), wallM, P.whole, W / 2, H / 2, 0);
    // the jamb: a pale casing round the wall's left edge (front, edge and a little of the back), proud of the wall
    mesh(new THREE.BoxGeometry(TR, H, T + 0.03), trimM, P.whole, TR / 2 - 0.004, H / 2, 0);
    mesh(new THREE.BoxGeometry(0.022, H, 0.02), trimM, P.whole, TR + 0.011, H / 2, T / 2 + 0.01);
    mesh(new THREE.BoxGeometry(W - TR, 0.1, 0.02), skirtM, P.whole, TR + (W - TR) / 2, 0.05, T / 2 + 0.01);
    // the room beyond the doorway: a dim cool back wall and its side, so whoever hides there stands against it
    const room = S.room ?? {}, RW = room.w ?? 2.4, RD = room.d ?? 1.1;
    const roomM = mat(room.color ?? "#40406a", { roughness: 0.95 });
    const back = mesh(new THREE.BoxGeometry(RW, H, 0.05), roomM, P.whole, (room.x ?? -0.6) + RW / 2, H / 2, -RD);
    back.castShadow = false;
    return { grip: 0 };
  },
};
