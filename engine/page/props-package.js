import * as THREE from "three";
import { clamp } from "./util.js";

// Props for "Just Hand Me the Package" (Jonny's story library #04, 28 Oct 2026), in their own file so parallel clips
// never edit the same one (props3d.js merges these into its KINDS and GRIPS):
//   frontdoor  a plain house door, muted blue with six raised panels, a brass knob and latch on both faces, no
//              wreath or knocker. Hinged at the prop's x on its LEFT edge (spec.hinge "right": the right edge, the leaf
//              spanning -x). It stands with its outside face toward +z. `open` 0 shut .. 1 swung open by spec.angle
//              (default 95 deg) INTO the house (-z; spec.swing "out" swings it toward +z). `latch` 0..1 pushes the
//              latch tongue home (it springs back into the edge while the door swings and shoots out on the latch).
//              spec: { w, h, color }
//   parcel     a kraft cardboard box with one tape seam along the top and down the two ends, no label. Origin = its
//              bottom centre, its long side along x. Grip "middle" = its centre (held between two hands, `both`);
//              "lside" / "rside" = the middle of its -x / +x end (a hand on each end). spec: { w, h, d }
export const PARCEL = { w: 0.42, h: 0.26, d: 0.3 };
export const PACKAGE_GRIPS = {
  parcel: { middle: [0, PARCEL.h / 2, 0], lside: [-PARCEL.w / 2, PARCEL.h / 2, 0], rside: [PARCEL.w / 2, PARCEL.h / 2, 0] },
};

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

// kraft board: warm tan with faint fibres and a slightly darker edge, so the faces read as cardboard at phone size
const kraft = (seed) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#c79a62"; g.fillRect(0, 0, w, h);
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(${r() < 0.5 ? "120,82,40" : "236,206,160"},${0.08 + r() * 0.1})`; g.lineWidth = 1; g.beginPath(); const x = r() * w, y = r() * h; g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 30, y + (r() - 0.5) * 6); g.stroke(); }
  const gr = g.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.75); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(90,55,20,0.22)");
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});

export const PACKAGE_KINDS = {
  parcel(P) {
    const W = P.spec.w ?? PARCEL.w, H = P.spec.h ?? PARCEL.h, D = P.spec.d ?? PARCEL.d, R = 0.012;
    const board = mat("#ffffff", { map: kraft(7), roughness: 0.85 }); board.userData.noShine = true;
    // the box: a slightly rounded slab (the corners catch a line), built from boxes so the clipping check keeps it tight
    mesh(new THREE.BoxGeometry(W, H - 2 * R, D), board, P.whole, 0, H / 2, 0);
    mesh(new THREE.BoxGeometry(W - 2 * R, R * 2, D - 2 * R), board, P.whole, 0, H - R, 0);
    mesh(new THREE.BoxGeometry(W - 2 * R, R * 2, D - 2 * R), board, P.whole, 0, R, 0);
    // the flap seam across the top (a dark line where the two flaps meet) under one strip of tape that runs the
    // length of the top and down both ends
    const seam = mesh(new THREE.BoxGeometry(W - 0.02, 0.002, 0.004), mat("#7a5228", { roughness: 0.9 }), P.whole, 0, H + 0.001, 0); seam.castShadow = false;
    const tape = mat("#d9b98a", { roughness: 0.35, transparent: true, opacity: 0.92 }); tape.userData.noOutline = true;
    const TW = 0.055;
    mesh(new THREE.BoxGeometry(W + 0.004, 0.003, TW), tape, P.whole, 0, H + 0.0025, 0).castShadow = false;
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.003, H * 0.42, TW), tape, P.whole, s * (W / 2 + 0.0015), H - H * 0.21, 0).castShadow = false;
    return { grip: H / 2 };
  },

  frontdoor(P) {
    const W = P.spec.w ?? 1.0, H = P.spec.h ?? 1.8, T = 0.05, side = P.spec.hinge === "right" ? -1 : 1;
    const paint = mat(P.spec.color || "#53698f", { roughness: 0.5 }), recess = mat(P.spec.recess || "#435677", { roughness: 0.55 });
    const brass = mat("#d9a640", { roughness: 0.25, metalness: 0.85 });
    const leaf = new THREE.Group(); P.whole.add(leaf);   // the swinging part, hinged at x 0
    const u = (k) => side * k * W;   // k 0..1 across the door from the hinge
    // the slab as six upright strips (each part's box stays tight however the door turns: the clipping check boxes parts)
    for (let i = 0; i < 6; i++) mesh(new THREE.BoxGeometry((W - 0.01) / 6 + 0.001, H - 0.01, T), paint, leaf, u(((W - 0.01) * (i + 0.5)) / 6 / W + 0.005 / W), H / 2, 0);
    // six raised panels on both faces (two tall, two square, two short on top), a darker recess round each
    const panels = [[0.27, 0.22, 0.32, 0.3], [0.73, 0.22, 0.32, 0.3], [0.27, 0.56, 0.32, 0.28], [0.73, 0.56, 0.32, 0.28], [0.27, 0.85, 0.32, 0.18], [0.73, 0.85, 0.32, 0.18]];
    for (const zs of [1, -1]) for (const [px, py, pw, ph] of panels) {
      mesh(new THREE.BoxGeometry(W * pw + 0.03, H * ph + 0.03, 0.006), recess, leaf, u(px), H * py, zs * (T / 2 + 0.002)).castShadow = false;
      mesh(new THREE.BoxGeometry(W * pw, H * ph, 0.014), paint, leaf, u(px), H * py, zs * (T / 2 + 0.006)).castShadow = false;
    }
    // a round brass knob on a rose on both faces, near the free edge, at a potato's hand height
    const KY = P.spec.knobY ?? 0.52;
    for (const zs of [1, -1]) {
      const rose = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 18), brass, leaf, u(1) - side * 0.09, KY, zs * (T / 2 + 0.006)); rose.rotation.x = Math.PI / 2; rose.castShadow = false;
      const neck = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.04, 10), brass, leaf, u(1) - side * 0.09, KY, zs * (T / 2 + 0.03)); neck.rotation.x = Math.PI / 2; neck.castShadow = false;
      const knob = mesh(new THREE.SphereGeometry(0.032, 18, 14), brass, leaf, u(1) - side * 0.09, KY, zs * (T / 2 + 0.055)); knob.scale.set(1, 1, 0.75); knob.castShadow = false;
    }
    // the latch tongue in the free edge: in while the door swings, out when it latches (a tiny brass block)
    const tongue = mesh(new THREE.BoxGeometry(0.02, 0.025, 0.018), brass, leaf, u(1), KY, 0); tongue.castShadow = false;
    return {
      grip: 0,
      apply(ps) {
        leaf.rotation.y = (P.spec.swing === "out" ? -1 : 1) * side * clamp(ps.open ?? 0, -0.1, 1.2) * ((P.spec.angle ?? 95) * Math.PI) / 180;
        const out = (ps.open ?? 0) > 0.02 ? clamp(ps.latch ?? 0) : 1;   // shut: the tongue is home in the frame
        tongue.position.x = u(1) + side * 0.008 * out;
      },
    };
  },
};
