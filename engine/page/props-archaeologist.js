import * as THREE from "three";

// The archaeologist's conservation brush (Egypt debate shorts, 19 Nov 2026; design: references/cast/archaeologist-design-2026-11-19.md
// section 4, look: her reference sheet, where the brush is 0.42 of her height). Registered in props3d.js as ARCH_KINDS / ARCH_GRIPS.
// Metres, deterministic (every mark is placed by index, no random, no clock).
//
//   archbrush   a conservation brush, 0.316 long (0.42 x her body height 0.757, the sheet's size: it reads in her hand), a pale tan bristle
//               head, a silver ferrule with two crimp rings, a thick tapered walnut handle with a belly in its lower middle and a rounded butt.
//               Nothing else in it moves; it is a plain rigid prop.
//               USAGE   { id: "brush", kind: "archbrush" }  (no other spec key; spec.scale scales the whole brush, default 1)
//               ORIGIN  the bristle TIP's middle (the brush's lowest point), the brush stands along +y, bristles DOWN, butt UP: that is
//                       how she carries it at her hip (bristles down). Flat of the bristle head faces +z / -z (the head is 0.052 wide
//                       along x, 0.030 thick along z); the two hair strokes are on the +z face.
//               SIZE    0.316 long: bristles y 0 .. 0.062 (pale tan #D5BA91, two uneven strokes), ferrule y 0.062 .. 0.100 (silver #A7A19A,
//                       r 0.0165 -> 0.0155, two crimp rings), handle y 0.100 .. 0.316 (walnut #513B34, r 0.0115 at the ferrule, belly
//                       r 0.0148 at y 0.22, r 0.0112 at the rounded butt, a darker end band).
//               HAND    a closed fist on the lower middle of the handle, y 0.165 (GRIPS archbrush.hold = [0, 0.165, 0]; the handle is 0.029 thick
//                       there). Hold it with the MUG hold: grips.mug(c, who, BRUSH, { side: "R" }) (SIZE archbrush { r 0.0148, h 0.25 } in
//                       storyboards/lib/grips.mjs: the fist at 0.66 x 0.25 = y 0.165): the butt shows 0.12 above the fist and the ferrule and
//                       bristles below it. The thin pinch (SIZE len 0.275) also works.
//                       Proof: make-grip-tests.mjs --prop archbrush --hold mug (CHAR=ancient-aliens/archaeologist for her glove).
//               CARRY   at rest: the hand by her right hip, bristles down and about 25 degrees forward. The prop is already built bristles-down,
//                       so give it spec tip 25 together with the hold frame's rot (grips.placeFor: yaw + 180): the tip is a turn about the prop's own
//                       x axis, and with that rot it puts the butt back and the bristles forward (the proof in make-archaeologist-test.mjs, lamp test).
//                       To point: lift the forearm until the brush is near horizontal and roll the wrist, the bristles aimed at the mark.
//               Size 0.052 x 0.316 x 0.030; about 0.6k triangles.

const TAU = Math.PI * 2;
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function add(parent, geo, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = shadow; parent.add(o); return o; }

const BR = { len: 0.316, bristle: 0.062, ferrule: 0.038, wide: 0.052, thick: 0.030 };

function buildArchbrush(P) {
  const g = P.whole, k = P.spec.scale ?? 1;
  const root = new THREE.Group(); root.scale.setScalar(k); g.add(root);
  const wood = std("#513B34", { roughness: 0.55 }), dark = std("#3a2a25", { roughness: 0.6 }), silver = std("#A7A19A", { roughness: 0.35, metalness: 0.55 }), hair = std("#D5BA91", { roughness: 0.95 }), stroke = std("#b99a6c", { roughness: 0.95 });
  silver.userData.lookRole = "cloth";
  // bristles: a flattened rounded block, wider at its tip than where it enters the ferrule
  const bg = new THREE.CylinderGeometry(BR.wide * 0.34, BR.wide * 0.5, BR.bristle, 24, 5);   // radius wide x 0.5 at the tip (y 0), 0.34 at the ferrule
  const bp = bg.attributes.position;
  for (let i = 0; i < bp.count; i++) { const t = (bp.getY(i) + BR.bristle / 2) / BR.bristle; bp.setZ(i, bp.getZ(i) * (BR.thick / BR.wide) * (0.85 + 0.15 * (1 - t))); bp.setY(i, bp.getY(i) + BR.bristle / 2); }
  bg.computeVertexNormals();
  add(root, bg, hair, 0, 0, 0);
  // three uneven hair strokes down the bristles, on the +z face
  for (const [x, y0, y1, w] of [[-0.011, 0.006, 0.048, 0.0026], [0.004, 0.008, 0.038, 0.0022], [0.014, 0.006, 0.03, 0.0018]]) {
    const s = add(root, new THREE.BoxGeometry(w, y1 - y0, 0.0012), stroke, x, (y0 + y1) / 2, BR.thick * 0.5 * 0.88, false);
    s.rotation.z = (rnd(y1 * 977) - 0.5) * 0.12; s.userData.noOutline = true;
  }
  // ferrule: a silver cylinder with two crimp rings
  add(root, new THREE.CylinderGeometry(0.0155, 0.0165, BR.ferrule, 22), silver, 0, BR.bristle + BR.ferrule / 2, 0);
  const ringM = std("#85807a", { roughness: 0.4, metalness: 0.5 });
  for (const f of [0.25, 0.72]) add(root, new THREE.TorusGeometry(0.0162 - 0.0007 * f, 0.0017, 6, 22), ringM, 0, BR.bristle + BR.ferrule * f, 0, false).rotation.x = Math.PI / 2;
  // the walnut handle: a lathe, slim at the ferrule, a belly in the lower middle, slimmer to a rounded butt
  const y0 = BR.bristle + BR.ferrule, prof = [[0.0, 0.0115], [0.02, 0.0124], [0.07, 0.0140], [0.12, 0.0148], [0.16, 0.0142], [0.19, 0.0128], [0.205, 0.0112]];
  const hr = (y) => { for (let i = 1; i < prof.length; i++) if (y <= prof[i][0]) { const u = (y - prof[i - 1][0]) / (prof[i][0] - prof[i - 1][0]); return prof[i - 1][1] + (prof[i][1] - prof[i - 1][1]) * u; } return prof[prof.length - 1][1]; };
  add(root, new THREE.LatheGeometry(prof.map(([y, r]) => new THREE.Vector2(r, y)), 24), wood, 0, y0, 0);
  add(root, new THREE.SphereGeometry(0.0112, 16, 12), wood, 0, y0 + 0.205, 0);   // the rounded butt (a closed lathe pole draws a spike of ink)
  add(root, new THREE.CylinderGeometry(hr(0.176) + 0.0003, hr(0.166) + 0.0003, 0.008, 18), dark, 0, y0 + 0.17, 0, false);   // a darker band by the butt
  // grain: three thin darker streaks along the handle's +z side, uneven, inside the handle's skin
  for (let i = 0; i < 3; i++) {
    const a = 0.25 + (i - 1) * 0.5 + (rnd(i + 4) - 0.5) * 0.2, yy = y0 + 0.025 + 0.03 * i + 0.006 * rnd(i), l = 0.022 + 0.014 * rnd(i + 9), r = hr(yy + l / 2) * 0.97;
    const s = add(root, new THREE.BoxGeometry(0.0012, l, 0.0006), dark, Math.sin(a) * r, yy + l / 2, Math.cos(a) * r, false);
    s.rotation.y = a; s.userData.noOutline = true;
  }
  return { grip: 0.165 };
}

// where a hand closes on it (the prop's own frame, before scale): the lower middle of the handle
export const ARCH_GRIPS = { archbrush: { hold: [0, 0.165, 0] } };
export const ARCH_KINDS = { archbrush: buildArchbrush };
void TAU;
