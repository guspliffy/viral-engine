import * as THREE from "three";
import { clamp } from "./util.js";

// Props for "Never Prank the Quiet Friend" (eight trend tests #08, 29 Oct 2026), in their own file so the clips made in
// parallel never edit the same one (props3d.js merges these into its KINDS and GRIPS):
//   armchair  a deep, soft sage-green armchair facing +z, its origin on the floor under the middle of the seat; the
//             cushion's top is at SEAT_Y (0.42) so `sit` works on it. Two rolled arms (their flat tops at
//             ARMCHAIR.armY, centred at x +-ARMCHAIR.armX, the front roll at z ARMCHAIR.armFront), a tall padded back and
//             short dark wooden feet. A woven blanket hangs over the left arm (the sitter's right) like the board.
//             spec.color / spec.color2 (fabric / cushion), spec.throw: false leaves the blanket off.
//   orangefeather one clean orange feather (not "feather": that is the black raven feather in props-robbed.js), origin at the bottom of its bare quill, pointing up +y (FEATHER.len long): a
//             cream quill, a stiff rachis and a soft orange vane (yellow toward the tip) in the x/y plane, both sides
//             drawn. Lean it with tilt (top toward +x) and tip (top toward +z). A thin prop: the grip library's `thin`
//             hold pinches its quill (grips.mjs SIZE.orangefeather).
//   foam      one dollop of white shaving foam, a soft-serve swirl FOAM.r wide, origin at its bottom centre (it sits on
//             a cupped palm). `flat` 0..1 presses it down and out into a smear (the palm pressed onto a cheek);
//             `scale` (every prop has it) makes it smaller.
//   foampatch the foam left on a cheek: a cluster of soft round blobs in the x/y plane, bulging out along +z (put it on
//             a body with spec.wear, stage.js). Shown by `scale` 0 -> 1 on the frame the palm presses; `drip` 0..1
//             lets one small blob slide down from its lower edge (spec.r: its radius, default 0.075).
//   foamcan   a shaving-foam can, origin at its bottom centre, FOAMCAN.h tall and FOAMCAN.r round: a blue and white
//             body, a domed shoulder and a white push-button head whose spout points along +x. The grip library holds
//             it like a mug body (grips.mjs SIZE.foamcan). `spray` 0..1 shows a short curl of foam leaving the spout.
// The foam is one matte white; no see-through parts, so the contact checks treat every piece as solid.
export const ARMCHAIR = { armX: 0.53, armY: 0.64, armW: 0.2, armFront: 0.3, seatW: 0.86, seatD: 0.66, backZ: -0.4 };
export const FEATHER = { len: 0.34, quill: 0.11, r: 0.0065 };
export const FOAM = { r: 0.06, h: 0.085 };
export const FOAMCAN = { r: 0.034, h: 0.15 };
export const PRANK_GRIPS = {};

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
// a box with soft, rounded edges (r metres), centred on its middle
function softBox(w, h, d, r, seg = 3) {
  const s = new THREE.Shape(), x = w / 2 - r, y = h / 2 - r;
  s.moveTo(-x, -h / 2); s.lineTo(x, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -y); s.lineTo(w / 2, y); s.quadraticCurveTo(w / 2, h / 2, x, h / 2);
  s.lineTo(-x, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, y); s.lineTo(-w / 2, -y); s.quadraticCurveTo(-w / 2, -h / 2, -x, -h / 2);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r * 0.98, bevelSegments: seg, curveSegments: 6 });
  g.translate(0, 0, -(d - 2 * r) / 2);
  return g;
}

export const PRANK_KINDS = {
  armchair(P) {
    const S = P.spec, A = ARMCHAIR, SY = 0.42;
    const fab = mat(S.color || "#7f9a6e", { roughness: 0.92 }), cush = mat(S.color2 || "#8daa7b", { roughness: 0.95 }), wood = mat("#4a3120", { roughness: 0.6 });
    // the base under the seat cushion, between the arms
    mesh(softBox(A.seatW + 0.02, 0.2, A.seatD, 0.04), fab, P.whole, 0, 0.17, A.backZ / 2 + 0.02 + 0.06);
    // the seat cushion, its top at SY
    mesh(softBox(A.seatW - 0.02, 0.16, A.seatD - 0.06, 0.06), cush, P.whole, 0, SY - 0.08, 0.0);
    // the back: a tall padded panel behind the sitter, leaning back a little, and a cushion on its front
    const back = mesh(softBox(A.seatW + 2 * A.armW, 0.95, 0.2, 0.08), fab, P.whole, 0, 0.62, A.backZ - 0.1); back.rotation.x = -0.08;
    const bc = mesh(softBox(A.seatW - 0.06, 0.62, 0.14, 0.07), cush, P.whole, 0, SY + 0.33, A.backZ + 0.02); bc.rotation.x = -0.1;
    // the arms: a block up to the arm's top, and a fat roll along its top that curls over the front
    for (const s of [-1, 1]) {
      const x = s * A.armX, len = A.armFront - A.backZ + 0.06;
      mesh(softBox(A.armW, A.armY - 0.1, len, 0.05), fab, P.whole, x, (A.armY - 0.1) / 2 + 0.07, (A.armFront + A.backZ) / 2 - 0.03);
      const roll = mesh(new THREE.CapsuleGeometry(A.armW * 0.55, len - A.armW * 0.6, 6, 16), fab, P.whole, x, A.armY - A.armW * 0.5, (A.armFront + A.backZ) / 2 - 0.03);
      roll.rotation.x = Math.PI / 2; roll.scale.set(1, 1, 0.82);
      // the round end of the roll on the front face
      const cap = mesh(new THREE.CylinderGeometry(A.armW * 0.42, A.armW * 0.42, 0.02, 24), cush, P.whole, x, A.armY - A.armW * 0.52, A.armFront + 0.06);
      cap.rotation.x = Math.PI / 2;
    }
    for (const x of [-1, 1]) for (const z of [A.armFront - 0.05, A.backZ - 0.12]) mesh(new THREE.CylinderGeometry(0.035, 0.025, 0.08, 10), wood, P.whole, x * (A.armX + 0.04), 0.04, z);
    // a woven throw over the left arm (the sitter's right arm side: -x), hanging down its outer side and front
    if (S.throw !== false) {
      const tex = canvasTex(128, 128, (g, w, h) => {
        g.fillStyle = "#c98f55"; g.fillRect(0, 0, w, h);
        for (let i = 0; i < w; i += 8) { g.fillStyle = i % 16 ? "rgba(255,236,200,0.35)" : "rgba(120,70,30,0.3)"; g.fillRect(i, 0, 3, h); g.fillRect(0, i, w, 3); }
      });
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2, 2);
      const wool = mat("#ffffff", { map: tex, roughness: 0.98 }), x = -A.armX - A.armW * 0.62;
      // draped down the outer side, behind the front roll, so the top of the arm stays clear for the hand
      mesh(softBox(0.035, A.armY - 0.08, 0.42, 0.015), wool, P.whole, x, (A.armY - 0.08) / 2 + 0.07, A.backZ + 0.3);
      for (let i = 0; i < 7; i++) mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.05, 5), wool, P.whole, x, 0.05, A.backZ + 0.12 + i * 0.06);
    }
    return { grip: SY };
  },

  orangefeather(P) {
    const F = FEATHER, L = F.len;
    const quillM = mat("#f3e6c8", { roughness: 0.5 });
    // the bare quill and the rachis up the middle of the vane (thinning to the tip)
    mesh(new THREE.CylinderGeometry(F.r * 0.8, F.r, F.quill, 10), quillM, P.whole, 0, F.quill / 2, 0);
    mesh(new THREE.CylinderGeometry(F.r * 0.25, F.r * 0.8, L - F.quill, 8), quillM, P.whole, 0, F.quill + (L - F.quill) / 2, 0);
    // the vane: a soft leaf outline, wider on one side, barbs painted on, orange to yellow at the tip
    const y0 = F.quill - 0.02, H = L - y0, s = new THREE.Shape();
    const wR = 0.045, wL = 0.036;
    s.moveTo(0, 0);
    s.bezierCurveTo(wR * 0.9, H * 0.1, wR * 1.15, H * 0.55, wR * 0.35, H * 0.93);
    s.quadraticCurveTo(0.004, H * 1.02, -0.002, H);
    s.bezierCurveTo(-wL * 0.6, H * 0.88, -wL * 1.2, H * 0.5, 0, 0);
    const geo = new THREE.ShapeGeometry(s, 24);
    // map u/v over the vane's box so the texture follows it
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + wL * 1.3) / (wR * 1.3 + wL * 1.3), pos.getY(i) / H);
    const tex = canvasTex(64, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, h, 0, 0);
      gr.addColorStop(0, "#e2551c"); gr.addColorStop(0.55, "#ff8a2a"); gr.addColorStop(1, "#ffc04a");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      // barbs: thin lines sweeping up and out from the middle
      const mid = w * (wL * 1.3) / (wR * 1.3 + wL * 1.3);
      g.lineWidth = 1.2;
      for (let y = 8; y < h + 40; y += 7) {
        g.strokeStyle = "rgba(150,50,10,0.28)";
        g.beginPath(); g.moveTo(mid, y); g.quadraticCurveTo(mid + w * 0.3, y - 14, w, y - 30); g.stroke();
        g.beginPath(); g.moveTo(mid, y); g.quadraticCurveTo(mid - w * 0.25, y - 12, 0, y - 26); g.stroke();
      }
      // a couple of gaps where the barbs split, as on a real feather
      g.fillStyle = "rgba(255,240,220,0.0)";
    });
    const vane = mesh(geo, mat("#ffffff", { map: tex, roughness: 0.85, side: THREE.DoubleSide }), P.whole, 0, y0, 0);
    vane.castShadow = true;
    return { grip: 0 };
  },

  foam(P) {
    const white = mat("#fbfbf8", { roughness: 0.95 }), R = FOAM.r;
    const g = new THREE.Group(); P.whole.add(g);
    // a soft-serve swirl: a wide soft base, two smaller rings and a curled peak
    const base = mesh(new THREE.SphereGeometry(R, 24, 16), white, g, 0, R * 0.42, 0); base.scale.set(1, 0.48, 1);
    const ring = mesh(new THREE.TorusGeometry(R * 0.58, R * 0.3, 12, 28), white, g, 0, R * 0.62, 0); ring.rotation.x = Math.PI / 2;
    const ring2 = mesh(new THREE.TorusGeometry(R * 0.32, R * 0.24, 10, 24), white, g, 0, R * 0.98, 0); ring2.rotation.x = Math.PI / 2;
    const mid = mesh(new THREE.SphereGeometry(R * 0.5, 18, 12), white, g, 0, R * 0.8, 0); mid.scale.set(1, 0.8, 1);
    const peak = mesh(new THREE.ConeGeometry(R * 0.26, R * 0.5, 14), white, g, R * 0.04, R * 1.3, 0); peak.rotation.z = -0.35;
    return {
      grip: 0,
      apply(ps) {
        const f = clamp(ps.flat || 0);
        g.scale.set(1 + 0.55 * f, 1 - 0.7 * f, 1 + 0.55 * f);
        peak.visible = f < 0.5; ring2.visible = f < 0.8;
      },
    };
  },

  foamcan(P) {
    const C = FOAMCAN, body = canvasTex(256, 128, (g, w, h) => {
      g.fillStyle = "#f4f7fb"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#2f6fd0"; g.fillRect(0, h * 0.18, w, h * 0.5);
      g.fillStyle = "#ffffff"; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(w * (0.12 + i * 0.25), h * 0.43, h * 0.11, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = "#1d4a94"; g.fillRect(0, h * 0.86, w, h * 0.14);
    });
    const can = mesh(new THREE.CylinderGeometry(C.r, C.r, C.h * 0.82, 28, 1), mat("#ffffff", { map: body, roughness: 0.35, metalness: 0.2 }), P.whole, 0, C.h * 0.41, 0);
    const dome = mesh(new THREE.SphereGeometry(C.r, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat("#c9d2dc", { roughness: 0.3, metalness: 0.6 }), P.whole, 0, C.h * 0.82, 0);
    dome.scale.y = 0.45;
    const white = mat("#fbfbf8", { roughness: 0.6 });
    mesh(new THREE.CylinderGeometry(C.r * 0.42, C.r * 0.46, C.h * 0.1, 18), white, P.whole, 0, C.h * 0.93, 0);
    const spout = mesh(new THREE.BoxGeometry(C.r * 0.9, C.r * 0.28, C.r * 0.34), white, P.whole, C.r * 0.55, C.h * 0.95, 0);
    spout.castShadow = false; void can;
    // the foam leaving the spout: a soft curl that grows out and down while `spray` is on
    const curl = new THREE.Group(); curl.position.set(C.r * 1.0, C.h * 0.95, 0); P.whole.add(curl);
    const fm = mat("#fbfbf8", { roughness: 0.95 });
    const blobs = [0, 1, 2, 3].map((i) => mesh(new THREE.SphereGeometry(C.r * (0.32 - 0.03 * i), 12, 10), fm, curl, C.r * 0.35 * i, -C.r * 0.3 * i * i * 0.5, 0));
    return {
      grip: 0,
      apply(ps) {
        const s = clamp(ps.spray || 0);
        curl.visible = s > 0.02;
        blobs.forEach((b, i) => { const k = clamp(s * 4 - i); b.visible = k > 0.02; b.scale.setScalar(Math.max(0.01, k)); });
      },
    };
  },

  foampatch(P) {
    const white = mat("#fbfbf8", { roughness: 0.95 }), R = P.spec.r ?? 0.075;
    // blobs in the x/y plane (x, y, size), flattened along z so the patch hugs the cheek
    const blobs = [[0, 0, 1], [0.45, 0.25, 0.7], [-0.4, 0.3, 0.65], [0.3, -0.4, 0.72], [-0.35, -0.3, 0.6], [0.05, 0.5, 0.55], [0.6, -0.1, 0.5], [-0.62, 0.0, 0.45]];
    for (const [x, y, k] of blobs) { const b = mesh(new THREE.SphereGeometry(R * 0.42 * k, 16, 12), white, P.whole, x * R, y * R, 0); b.scale.set(1, 1, 0.55); }
    const drop = mesh(new THREE.SphereGeometry(R * 0.2, 14, 10), white, P.whole, 0.15 * R, -0.62 * R, 0.005); drop.scale.set(1, 1.2, 0.6);
    return {
      grip: 0,
      apply(ps) { const d = clamp(ps.drip || 0); drop.position.y = (-0.62 - 0.9 * d) * R; drop.scale.set(1 - 0.2 * d, 1.2 + 0.4 * d, 0.6); },
    };
  },
};
