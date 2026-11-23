import * as THREE from "three";
import { clamp } from "./util.js";
import { SHED } from "../shared/obstacles.js";

// Kid vs Dad 01 "BREAKING: Dad has told 4,000 dad jokes" (DESIGN.md section 6): the dad's own garden shed, with a door that opens.
// Its own file; props3d.js merges SHED_KINDS into KINDS. Use it with the backyard set's `shed: false` (the stock shed left out).
//   gardenshed  a pale-blue plank garden shed with a front gable. Box 1.90 wide (x) x 1.30 deep (z), eaves 1.50, ridge 1.90 running
//               front to back, roof overhang 0.10. ORIGIN: the floor under its middle; the door wall is +z (rot turns the front toward +x:
//               rot 40 = the film's shed). Doorway 1.20 wide x 1.40 tall from x -0.75 to +0.45, with the wall 0.50 wide beside it on +x
//               (one 0.26 x 0.22 window, centre y 1.00, frame 0.03 wide) and 0.20 of wall on the -x side. Inside: every inner face and a
//               floor plane dark (#2b2630), nothing else.
//               The DOOR LEAF is 1.20 x 1.35 x 0.035, its bottom edge at y 0.05, 5 plank lines, a Z brace of 0.08 boards on its inside face,
//               a ring handle on the free edge (both faces), 2 strap hinges 0.22 long (y 0.25 and 1.15). It is hinged on the doorway's -x
//               jamb (the side nearest a camera at +z looking in, the dad's right as he comes out) and opens OUTWARD (+z).
//   Params: open 0..1  0 shut, 1 = 105 degrees (at 105 the leaf stands out of the doorway at the -x side, edge-on from a camera on +z
//                      in front of it). Tween it with { do: "prop", id, set: { open }, dur, ease } (0.25 at frame 0, 1 by 0.8 s).
//   Spec (all optional): wall "#8fb7c9", plank "#6f98ab" (a line every 0.15), roof "#5b4a52", door "#f2efe8" (leaf + window frame), glass "#bfe3f5"
//                      (solid, not see-through), inside "#2b2630", rot (deg, the prop's own).
//   Grip: none (a set piece, not held). Solid: engine/shared/obstacles.js SHED lists its walls (as posts) for qa/clear.mjs; the doorway is open.
//   Size and origin so far: 1.90 x 1.30 footprint; walls 0.05 thick; the leaf pivots on (x -0.75, z +0.625) in the prop's frame.
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; parent.add(o); return o; }

export const SHED_KINDS = {
  gardenshed(P) {
    const S = P.spec, W = S.wall || "#8fb7c9", wallM = mat(W), plankM = mat(S.plank || "#6f98ab"), roofM = mat(S.roof || "#5b4a52", { roughness: 0.8 }), doorM = mat(S.door || "#f2efe8");
    const glassM = mat(S.glass || "#bfe3f5", { roughness: 0.2 }), darkM = mat(S.inside || "#2b2630", { roughness: 0.95 }), braceM = mat("#e4dfd4"), lineM = mat("#cfc9bd"), ironM = mat("#2b2630", { roughness: 0.5, metalness: 0.3 });
    const { w, d, eaves, ridge, doorX0, doorX1, doorH, wall: T } = SHED, hx = w / 2, hz = d / 2, over = 0.10;
    // a wall slab: outer face `out` (box face index 0 +x, 1 -x, 4 +z, 5 -z), the opposite face dark (the inside), edges in wall colour
    const slab = (sx, sy, sz, x, y, z, out, inner) => { const mm = [wallM, wallM, wallM, wallM, wallM, wallM]; mm[inner] = darkM; return mesh(new THREE.BoxGeometry(sx, sy, sz), mm, P.whole, x, y, z); };
    slab(w, eaves, T, 0, eaves / 2, -hz + T / 2, 5, 4);                                       // back
    slab(T, eaves, d, -hx + T / 2, eaves / 2, 0, 1, 0);                                       // the -x side
    slab(T, eaves, d, hx - T / 2, eaves / 2, 0, 0, 1);                                        // the +x side
    slab(doorX0 + hx, eaves, T, (-hx + doorX0) / 2, eaves / 2, hz - T / 2, 4, 5);             // front, left of the doorway (0.20)
    slab(hx - doorX1, eaves, T, (doorX1 + hx) / 2, eaves / 2, hz - T / 2, 4, 5);              // front, right of it (0.50): the window wall
    slab(doorX1 - doorX0, eaves - doorH, T, (doorX0 + doorX1) / 2, (doorH + eaves) / 2, hz - T / 2, 4, 5);   // the lintel over the doorway
    // the jambs' inner faces stay wall colour; the front and back gables (a triangle each) above the eaves
    const tri = new THREE.Shape(); tri.moveTo(-hx, 0); tri.lineTo(hx, 0); tri.lineTo(0, ridge - eaves); tri.closePath();
    for (const [z, m] of [[hz - T, wallM], [-hz, darkM]]) { const g = mesh(new THREE.ExtrudeGeometry(tri, { depth: T, bevelEnabled: false }), m, P.whole, 0, eaves, z); g.castShadow = true; }
    // plank lines every 0.15 on the outer faces (thin boards 0.012 wide, 0.006 proud)
    const pl = (sx, sy, sz, x, y, z) => mesh(new THREE.BoxGeometry(sx, sy, sz), plankM, P.whole, x, y, z, false);
    for (let k = 1; k * 0.15 < w - 1e-6; k++) {
      const x = -hx + k * 0.15;
      if (x < doorX0 - 0.01 || x > doorX1 + 0.01) pl(0.012, eaves, 0.006, x, eaves / 2, hz + 0.003);   // the front, beside the doorway
      pl(0.012, eaves, 0.006, x, eaves / 2, -hz - 0.003);                                              // the back
    }
    for (let k = 1; k * 0.15 < d - 1e-6; k++) { const z = -hz + k * 0.15; pl(0.006, eaves, 0.012, -hx - 0.003, eaves / 2, z); pl(0.006, eaves, 0.012, hx + 0.003, eaves / 2, z); }
    for (let k = 1; k * 0.15 < doorX1 - doorX0 - 1e-6; k++) pl(0.012, eaves - doorH, 0.006, doorX0 + k * 0.15, (doorH + eaves) / 2, hz + 0.003);   // the lintel's planks too (the leaf has its own)
    // the roof: two planes from the ridge down past the eaves by the overhang, dark underneath (the inside)
    const half = hx + over, drop = ((ridge - eaves) / hx) * half, a = Math.atan2(ridge - eaves, hx), Ls = Math.hypot(half, drop);
    for (const s of [-1, 1]) {
      const r = mesh(new THREE.BoxGeometry(Ls, 0.04, d + 2 * over), [roofM, roofM, roofM, darkM, roofM, roofM], P.whole, s * half / 2, ridge - drop / 2 + 0.01, 0);
      r.rotation.z = -s * a;
    }
    mesh(new THREE.BoxGeometry(0.1, 0.05, d + 2 * over), roofM, P.whole, 0, ridge + 0.02, 0);   // the ridge board
    // the floor: dark, so the doorway reads as a room
    const floor = mesh(new THREE.PlaneGeometry(w - 2 * T, d - 2 * T), darkM, P.whole, 0, 0.004, 0, false); floor.rotation.x = -Math.PI / 2;
    // the window in the wall beside the door: a 0.03 frame round a solid 0.26 x 0.22 pane, centre y 1.00
    { const wx = (doorX1 + hx) / 2; mesh(new THREE.BoxGeometry(0.26 + 0.06, 0.22 + 0.06, 0.012), doorM, P.whole, wx, 1.0, hz + 0.006, false); mesh(new THREE.BoxGeometry(0.26, 0.22, 0.018), glassM, P.whole, wx, 1.0, hz + 0.009, false); }
    // the door leaf, hinged on the -x jamb at the wall's middle plane, opening outward
    const leaf = new THREE.Group(); leaf.position.set(doorX0, 0, hz - T / 2); P.whole.add(leaf);
    const LW = doorX1 - doorX0, LH = 1.35, LT = 0.035, y0 = 0.05, zf = LT / 2;
    mesh(new THREE.BoxGeometry(LW, LH, LT), doorM, leaf, LW / 2, y0 + LH / 2, 0);
    for (let k = 1; k <= 5; k++) mesh(new THREE.BoxGeometry(0.008, LH - 0.02, 0.004), lineM, leaf, (LW / 6) * k, y0 + LH / 2, zf + 0.001, false);   // 5 plank lines, outside face
    for (const y of [1.28, 0.17]) mesh(new THREE.BoxGeometry(LW - 0.16, 0.08, 0.008), braceM, leaf, LW / 2, y, -zf - 0.003, false);   // the Z brace: two boards ...
    { const dx = LW - 0.2, dy = 1.28 - 0.17, br = mesh(new THREE.BoxGeometry(Math.hypot(dx, dy), 0.08, 0.008), braceM, leaf, LW / 2, (1.28 + 0.17) / 2, -zf - 0.004, false); br.rotation.z = Math.atan2(dy, dx); }   // ... and the diagonal
    for (const sz of [1, -1]) {
      const hx2 = LW - 0.06;   // ring handle on the free edge, both faces
      mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.008, 14), ironM, leaf, hx2, 0.70, sz * (zf + 0.004), false).rotation.x = Math.PI / 2;
      const ring = mesh(new THREE.TorusGeometry(0.036, 0.0065, 8, 18), ironM, leaf, hx2, 0.70 - 0.03, sz * (zf + 0.012), false); ring.rotation.y = 0;
      for (const y of [0.25, 1.15]) mesh(new THREE.BoxGeometry(0.22, 0.05, 0.008), ironM, leaf, 0.11, y, sz * (zf + 0.004), false);   // 2 strap hinges 0.22 long
    }
    return { grip: 0, apply(ps) { leaf.rotation.y = -clamp(ps.open ?? 0, -0.05, 1.1) * (105 * Math.PI) / 180; } };
  },
};
