import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mat, mesh, canvasTex } from "./props-trend.js";
import { ROBBED_KINDS } from "./props-robbed.js";

// Props for "What Raven?" (eight trend tests #04, 29 Oct 2026), in their own file so the clips made in parallel never
// edit the same one (props3d.js merges these into its KINDS):
//   ravenfeather the black feather of props-robbed.js under its own name (props-prank.js has an orange "feather")
//   redarmchair one plush red armchair facing +z, for one sitter (sit works on it: seat at SEAT_Y 0.42). Rounded
//               cushions, a high back at z -0.42 and two broad padded arms at x +-ARMCHAIR.armX whose flat tops
//               (y ARMCHAIR.armY) are wide enough for a small bird to perch on. spec.color for the fabric.
//   ravenphoto  a small photo print (10 x 13 cm, 4 mm card) standing upright: a white border round a pale sky with ONE
//               black raven silhouette on a branch, no writing. The picture is on the prop's -z face, so held with
//               the grip library's phone hold (its +z toward the holder) it faces whoever the holder shows it to; the
//               back is plain off-white card. Its origin is its bottom centre.
export const ARMCHAIR = { armX: 0.58, armY: 0.66, armW: 0.2, seatFront: 0.3 };
export const RAVENPHOTO = { w: 0.1, h: 0.13, t: 0.004 };
const SEAT_Y = 0.42;   // props3d.js SEAT_Y (not imported: props3d imports this file)

export const RAVEN_GRIPS = {};

export const RAVEN_KINDS = {
  // the black raven feather from props-robbed.js under its own name: props-prank.js (30 Oct) has an orange "feather"
  ravenfeather: ROBBED_KINDS.feather,
  redarmchair(P) {
    const fab = mat(P.spec.color || "#b33a2c", { roughness: 0.9 }), fab2 = mat(P.spec.color2 || "#c4473a", { roughness: 0.92 });
    const wood = mat("#5a3520", { roughness: 0.6 });
    const rb = (w, h, d, r, m, x, y, z) => mesh(new RoundedBoxGeometry(w, h, d, 4, r), m, P.whole, x, y, z);
    const { armX, armY, armW } = ARMCHAIR, D = 0.78, z0 = -0.12;
    rb(2 * armX - armW + 0.02, SEAT_Y - 0.16, D, 0.05, fab, 0, 0.08 + (SEAT_Y - 0.16) / 2, z0);          // the base
    rb(2 * armX - armW - 0.02, 0.13, D - 0.12, 0.06, fab2, 0, SEAT_Y - 0.06, z0 + 0.05);                 // the seat cushion
    rb(2 * armX + armW, 0.86, 0.22, 0.09, fab, 0, SEAT_Y + 0.2, z0 - D / 2 + 0.05);                      // the high back
    const back = rb(2 * armX - armW - 0.04, 0.56, 0.12, 0.06, fab2, 0, SEAT_Y + 0.3, z0 - D / 2 + 0.19); back.rotation.x = -0.1;
    for (const s of [-1, 1]) rb(armW, armY - 0.08, D, 0.08, fab, s * armX, 0.08 + (armY - 0.08) / 2, z0);   // the arms
    for (const s of [-1, 1]) for (const z of [z0 + D / 2 - 0.08, z0 - D / 2 + 0.08]) mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.08, 10), wood, P.whole, s * (armX + armW / 2 - 0.06), 0.04, z);
    return { grip: SEAT_Y };
  },

  ravenphoto(P) {
    const { w, h, t } = RAVENPHOTO;
    const pic = canvasTex(400, 520, (g, W, H) => {
      g.fillStyle = "#f7f3ea"; g.fillRect(0, 0, W, H);                 // the white border
      const sky = g.createLinearGradient(0, 30, 0, H - 70); sky.addColorStop(0, "#9cc6e4"); sky.addColorStop(1, "#e9eef0");
      g.fillStyle = sky; g.fillRect(28, 28, W - 56, H - 110);
      g.fillStyle = "#3b2a20"; g.beginPath(); g.moveTo(28, 330); g.quadraticCurveTo(200, 300, W - 28, 345); g.lineTo(W - 28, 360); g.quadraticCurveTo(200, 318, 28, 346); g.fill();   // the branch
      // one raven, side on, perched on the branch facing right: body, head, beak, tail, folded wing, legs
      g.fillStyle = "#15141a"; g.strokeStyle = "#15141a"; g.lineWidth = 7; g.lineCap = "round";
      g.beginPath(); g.ellipse(195, 250, 78, 46, -0.35, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(262, 196, 34, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(286, 180); g.lineTo(338, 202); g.lineTo(288, 214); g.fill();
      g.beginPath(); g.moveTo(135, 268); g.lineTo(62, 318); g.lineTo(84, 326); g.lineTo(150, 292); g.fill();
      g.beginPath(); g.moveTo(180, 300); g.lineTo(176, 330); g.moveTo(206, 298); g.lineTo(210, 326); g.stroke();
      g.fillStyle = "#f2ecd8"; g.beginPath(); g.arc(270, 190, 6, 0, Math.PI * 2); g.fill();   // its eye glint
      g.fillStyle = "#2a2833"; g.beginPath(); g.ellipse(180, 246, 54, 24, -0.4, 0, Math.PI * 2); g.fill();   // the folded wing
    });
    const card = mat("#f4efe4", { roughness: 0.7 }), face = new THREE.MeshStandardMaterial({ map: pic, roughness: 0.55 });
    const m = mesh(new THREE.BoxGeometry(w, h, t), [card, card, card, card, card, face], P.whole, 0, h / 2, 0);   // box faces: +x -x +y -y +z -z
    m.castShadow = true;
    return { grip: h / 2 };
  },
};
