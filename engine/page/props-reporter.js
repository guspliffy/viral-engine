import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { buildHelmet } from "./costumes-reporter.js";

// The reporter's two props (Kid vs Dad 01, 22 Nov 2026; storyboards/series/kid-vs-dad/01-dad-jokes-news/DESIGN.md sections 1 and 2).
// Registered in props3d.js as REPORTER_KINDS / REPORTER_GRIPS. Metres, deterministic (every pore and mark is placed by index, no random, no clock).
//
//   newsmic     the news microphone: a black handle, a bright red station cube round it (blank on every face) and a grey foam ball on top.
//               USAGE   { id: "mic", kind: "newsmic" }   spec keys (default): scale (1); lean (0, degrees 0..45, a number you can tween with the
//                       prop action: { lean: 40 }). `tint` ("#e3262e") recolours the cube.
//               ORIGIN  the butt end (the lowest point); the mic stands along +y, 0.32 long (0.34 of the reporter's 0.94).
//               SIZE    handle y 0 .. 0.20 r 0.016 "#1d1e22", butt cap r 0.019 x 0.012 tall; station cube 0.075, y 0.1125 .. 0.1875, "#e3262e" with
//                       a 0.006 bevel in "#f0646a", nothing printed on it; steel collar y 0.19 .. 0.20 r 0.022 "#9aa0a8"; foam ball centre y 0.255
//                       r 0.065 "#4a4d55" with 40 pores "#3a3d44" r 0.004 (the top of the ball is at 0.32).
//               HAND    the MUG hold, his RIGHT fist, all film: SIZE newsmic { r 0.016, h 0.085 } in storyboards/lib/grips.mjs puts the fist at
//                       0.66 x 0.085 = y 0.056, on the handle between the butt cap and the cube (glove gap 0.035: the glove stays 0.035 clear of
//                       the handle and the cube); the ball's centre is 0.20 above the fist. GRIPS newsmic.hold = [0, 0.056, 0].
//                       Proof: node storyboards/lookdev/make-grip-tests.mjs --prop newsmic --hold mug (CHAR=potatobrawl/reporter for his glove).
//               LEAN    spec/prop key `lean` tips the mic about the GRIP POINT (y 0.056) away from the holder (-z in the prop's own frame, the
//                       holder stands at +z as grips.placeFor turns it), so the fist never slides: ball centre y = 0.056 + 0.199 cos(lean).
//                       DESIGN section 2 table: lean 30 in cover (ball 0.89 at fist 0.72), 0 to the camera (0.58 at fist 0.38), 40 to the kid / dad.
//
//   rephelmet   the reporter's helmet standing dome up on the grass (panel 13), after it comes off on a cut.
//               USAGE   { id: "helm", kind: "rephelmet", x, z }   spec keys (default): scale (1), strap (true: the two strap ends lie on the grass
//                       beside it, 0.13 with the buckle on the +x side, 0.09 on the -x side); no other key. `tint` ("#3f72b8") recolours the shell.
//               ORIGIN  the middle of its OPEN UNDERSIDE, on the grass (y 0): the rim is one flat ring at y 0; the dome stands 0.225 up (crown), 0.63
//                       wide x 0.49 deep with the shell at its stock 0.018 (rim) .. 0.045 (crown) off an imaginary head; hollow, the inside "#2b2f38".
//                       The front (the face side, the +z side) carries the 0.02 rim flare and the highlight streak on the viewer's left.
//               SIZE    the same shell, rim "#2f5a96", colour "#3f72b8" / "#335f9c", marks (highlight, dent line, two scuffs) as the worn helmet
//                       (costume.helm, engine/page/costumes-reporter.js). Rim ring about 0.67 wide x 0.52 deep.
//               HAND    none: both gloves REST on the dome (rest pins, no grip). A pose that wants a surface point: the crown is at (0, 0.225, 0).
//               It stands over his outstretched legs (they are inside the hollow); put its back rim 0.02 from his vest (rot 0 = front +z).

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function add(parent, geo, m, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = shadow; parent.add(o); return o; }
const D2R = Math.PI / 180;

// ---------------------------------------------------------------- newsmic
const GRIP_Y = 0.056;   // the mug hold's fist: 0.66 x SIZE.h (0.085)

function buildNewsmic(P) {
  const g = P.whole, spec = P.spec;
  const black = std("#1d1e22", { roughness: 0.45 }), steel = std("#9aa0a8", { roughness: 0.32, metalness: 0.75 }), foam = std("#4a4d55", { roughness: 0.95 }), pore = std("#3a3d44", { roughness: 1 });
  steel.userData.lookRole = "cloth";
  const root = new THREE.Group(); g.add(root);   // `lean` turns this about the grip point
  const body = new THREE.Group(); body.position.y = -GRIP_Y; root.position.y = GRIP_Y; root.add(body);
  add(body, new THREE.CylinderGeometry(0.016, 0.016, 0.2, 20, 1), black, 0, 0.1, 0);                  // the handle y 0 .. 0.20
  add(body, new THREE.CylinderGeometry(0.019, 0.019, 0.012, 20, 1), black, 0, 0.006, 0);              // the butt cap
  // the station cube: a rounded 0.075 box in red, its rounded edges and corners drawn in the lighter red (vertex colours), blank on every face
  { const cube = new RoundedBoxGeometry(0.075, 0.075, 0.075, 3, 0.006), pos = cube.attributes.position, col = new Float32Array(pos.count * 3), a = new THREE.Color(spec.tint || "#e3262e"), b = new THREE.Color("#f0646a"), h = 0.0375 - 0.006 - 1e-4;
    for (let i = 0; i < pos.count; i++) { const n = (Math.abs(pos.getX(i)) > h) + (Math.abs(pos.getY(i)) > h) + (Math.abs(pos.getZ(i)) > h), c = n >= 2 ? b : n === 1 ? a.clone().lerp(b, 0.12) : a; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    cube.setAttribute("color", new THREE.BufferAttribute(col, 3));
    add(body, cube, std("#ffffff", { roughness: 0.4, vertexColors: true }), 0, 0.15, 0); }          // y 0.1125 .. 0.1875
  add(body, new THREE.CylinderGeometry(0.022, 0.022, 0.01, 22, 1), steel, 0, 0.195, 0);               // the collar y 0.19 .. 0.20
  add(body, new THREE.SphereGeometry(0.065, 28, 20), foam, 0, 0.255, 0);                              // the foam ball, centre 0.255, top 0.32
  // 40 pores r 0.004, each placed once: a golden-angle spiral over the ball (no two alike), squashed into the foam
  for (let i = 0; i < 40; i++) {
    const f = (i + 0.5) / 40, y = 1 - 1.86 * f + 0.07 * Math.sin(i * 2.7), a = i * 2.39996 + 0.35 * Math.sin(i * 1.3), r = Math.sqrt(Math.max(0, 1 - y * y));
    if (y < -0.62) continue;   // not on the underside, under the collar
    const nx = r * Math.cos(a), nz = r * Math.sin(a), p = add(body, new THREE.SphereGeometry(0.004, 8, 6), pore, nx * 0.0645, 0.255 + y * 0.0645, nz * 0.0645, false);
    p.scale.set(1, 1, 0.45); p.lookAt(new THREE.Vector3(nx, y, nz).multiplyScalar(2).add(p.position)); p.userData.noOutline = true;
  }
  return {
    grip: GRIP_Y,
    apply(ps) { root.rotation.x = -(ps.lean || 0) * D2R; },   // the head tips away from the holder (-z), about the grip point
  };
}

// ---------------------------------------------------------------- rephelmet
// the stand-in skin: an ellipsoid whose dome, built by the worn helmet's own code, comes out 0.63 x 0.49 x 0.225: centre 0.22 below the rim plane
const HELM = { rx: 0.36, ry: 0.4, rz: 0.27, cy: -0.22 };
function helmSurf(th, ph) {
  const s = V(Math.sin(th) * Math.cos(ph), Math.sin(ph), Math.cos(th) * Math.cos(ph));
  return { pos: V(s.x * HELM.rx, HELM.cy + s.y * HELM.ry, s.z * HELM.rz), normal: V(s.x / HELM.rx, s.y / HELM.ry, s.z / HELM.rz).normalize() };
}
function V(x, y, z) { return new THREE.Vector3(x, y, z); }

function buildRephelmet(P) {
  const g = P.whole, spec = P.spec;
  const H = buildHelmet({ surf: helmSurf, edgeY: () => 0, k: 1, color: spec.tint });
  g.add(H.group);
  if (spec.strap !== false) {   // two strap ends lying on the grass from the rim at 74 degrees each side of the front: 0.13 (buckle) on +x, 0.09 on -x
    const strapM = std("#2b2f38", { roughness: 0.7 }), steel = std("#9aa0a8", { roughness: 0.32, metalness: 0.75 });
    steel.userData.lookRole = "cloth";
    for (const [s, len, buckle, yaw] of [[1, 0.13, true, 10], [-1, 0.09, false, -14]]) {
      const th = s * 74 * D2R, e = helmSurf(th, 0), out = V(e.normal.x, 0, e.normal.z).normalize(), a = Math.atan2(out.x, out.z) + yaw * D2R;
      const L = buckle ? len - 0.016 : len, grp = new THREE.Group(); grp.position.set(e.pos.x + out.x * 0.012, 0.0035, e.pos.z + out.z * 0.012); grp.rotation.y = a; g.add(grp);
      add(grp, new THREE.BoxGeometry(0.016, 0.003, L), strapM, 0, 0, L / 2, false);
      if (buckle) add(grp, new THREE.BoxGeometry(0.022, 0.006, 0.016), steel, 0, 0.002, L + 0.008, false);
    }
  }
  return { grip: 0 };
}

export const REPORTER_GRIPS = { newsmic: { hold: [0, GRIP_Y, 0] } };
export const REPORTER_KINDS = { newsmic: buildNewsmic, rephelmet: buildRephelmet };
