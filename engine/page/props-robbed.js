import * as THREE from "three";
import { clamp } from "./util.js";
import { mat, mesh } from "./props-trend.js";

// Props for TOO BUSY TO NOTICE (25 Oct), merged into props3d.js KINDS:
//   raven     the Allfather's second raven (the one on his shoulder is part of his costume), as a prop that flies: move
//             it with x/y/z tweens (an `arc` curves the flight), turn it with rot (it faces +z at rot 0). `flap` 0..1
//             spreads the wings and beats them (0: folded, perched), `peck` 0..1 dips the head (taking something),
//             `tug` 0..1 makes it strain backwards with fast beats (trying to lift something too heavy), `happy` 0..1
//             a little hop of joy while perched. Its origin is between its feet.
//   feather   one black feather that drifts down: `fall` 0..1 from where it is to spec.drop metres lower (default the
//             prop's y), swaying side to side and landing flat. Hidden at fall 0.
export const ROBBED_GRIPS = {};

export const ROBBED_KINDS = {
  raven(P) {
    const black = mat("#1b1a22", { roughness: 0.45 }), sheen = mat("#2b3350", { roughness: 0.3, metalness: 0.2 }), beakM = mat("#3d3c44", { roughness: 0.4 });
    const bird = new THREE.Group(); P.whole.add(bird);
    const body = mesh(new THREE.SphereGeometry(0.075, 20, 14), black, bird, 0, 0.07, 0); body.scale.set(0.85, 1.0, 1.4);
    const neck = new THREE.Group(); neck.position.set(0, 0.12, 0.05); bird.add(neck);
    mesh(new THREE.SphereGeometry(0.052, 18, 12), black, neck, 0, 0.03, 0.02);
    const beak = mesh(new THREE.ConeGeometry(0.019, 0.075, 8), beakM, neck, 0, 0.022, 0.085); beak.rotation.x = Math.PI / 2;
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), new THREE.MeshBasicMaterial({ color: "#f6ecc8" })); eye.position.set(s * 0.034, 0.045, 0.05); neck.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), new THREE.MeshBasicMaterial({ color: "#0b0b10" })); pupil.position.set(s * 0.037, 0.046, 0.058); neck.add(pupil);
    }
    // wings: a flat feathered shape from the shoulder, folded along the body when still, spread and beating in flight
    const wingShape = new THREE.Shape(); wingShape.moveTo(0, 0.03); wingShape.quadraticCurveTo(0.12, 0.07, 0.24, 0.03); wingShape.lineTo(0.27, -0.01);
    for (let i = 0; i < 4; i++) { const x = 0.27 - i * 0.065; wingShape.lineTo(x - 0.02, -0.06); wingShape.lineTo(x - 0.05, -0.02); }
    wingShape.lineTo(0, -0.04); wingShape.closePath();
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.008, bevelEnabled: false }); wingGeo.rotateX(-Math.PI / 2); wingGeo.translate(0, 0, 0.0);
    const wings = [-1, 1].map((s) => {
      const pivot = new THREE.Group(); pivot.position.set(s * 0.05, 0.1, 0.01); bird.add(pivot);
      const w = new THREE.Mesh(wingGeo, s > 0 ? black : sheen); w.castShadow = true; w.scale.x = s; pivot.add(w);
      return { pivot, s };
    });
    const tail = mesh(new THREE.ConeGeometry(0.045, 0.13, 4), black, bird, 0, 0.05, -0.13); tail.rotation.x = -Math.PI / 2 - 0.35; tail.scale.set(1.5, 1, 0.3);
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.045, 4), beakM, bird, s * 0.022, 0.0, 0.01);
    return {
      grip: 0.02,
      apply(ps, t) {
        const fl = clamp(ps.flap ?? 0), pk = clamp(ps.peck ?? 0), tg = clamp(ps.tug ?? 0), hp = clamp(ps.happy ?? 0), tt = t ?? 0;
        const beat = Math.sin(tt * (18 + 14 * tg));
        for (const { pivot, s } of wings) {
          // folded: the wing turned back along the body and down; spread: out to the side, beating up and down
          const fold = 1 - fl;
          pivot.rotation.set(0, s * fold * 1.35, s * (fl * (0.15 + 0.75 * beat) - fold * 1.2));
        }
        bird.rotation.x = 0.35 * fl - 0.5 * tg + 0.55 * pk * (1 - fl);   // leans into flight, back when tugging, dips to peck
        neck.rotation.x = 0.7 * pk;
        bird.position.y = hp * 0.06 * Math.abs(Math.sin(tt * 9)) + fl * 0.012 * beat;
      },
    };
  },

  feather(P) {
    const g = new THREE.Group(); P.whole.add(g);
    const vane = new THREE.Shape(); vane.moveTo(0, 0); vane.quadraticCurveTo(0.03, 0.06, 0.012, 0.15); vane.quadraticCurveTo(0, 0.17, -0.012, 0.15); vane.quadraticCurveTo(-0.03, 0.06, 0, 0);
    const v = mesh(new THREE.ShapeGeometry(vane), mat("#1d1c24", { roughness: 0.5, side: THREE.DoubleSide }), g, 0, 0, 0); v.castShadow = false;
    const drop = P.spec.drop ?? P.spec.y ?? 1;
    return {
      grip: 0,
      apply(ps) {
        const f = clamp(ps.fall ?? 0); g.visible = f > 0.001;
        g.position.set(Math.sin(f * 9) * 0.12 * (1 - f), -drop * f + 0.004, Math.cos(f * 7) * 0.04 * (1 - f));
        g.rotation.set(-Math.PI / 2 * f + 0.6 * Math.sin(f * 9) * (1 - f), f * 2, 0.8 * Math.sin(f * 9) * (1 - f));
      },
    };
  },
};
