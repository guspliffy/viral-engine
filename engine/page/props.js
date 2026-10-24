import * as THREE from "three";
import { Face } from "./face.js";
import { rng } from "./util.js";

// The "fries" form: the character as a red box of fries, keeping its eyes and hat.
export function buildFries(def, ch) {
  const g = new THREE.Group();
  const H = 0.62, rTop = 0.43, rBot = 0.31; // corner radii of a 4-sided frustum
  const box = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, H, 4, 1, true), new THREE.MeshStandardMaterial({ color: "#d8262c", roughness: 0.45, side: THREE.DoubleSide }));
  box.rotation.y = Math.PI / 4; box.position.y = H / 2; box.castShadow = true; g.add(box);
  const bottom = new THREE.Mesh(new THREE.CylinderGeometry(rBot, rBot, 0.01, 4), box.material); bottom.rotation.y = Math.PI / 4; bottom.position.y = 0.005; g.add(bottom);
  // a white stripe across the front, plain on purpose (no brand marks)
  const hwTop = rTop * Math.SQRT1_2, hwBot = rBot * Math.SQRT1_2, slope = (hwTop - hwBot) / H;
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(hwBot * 2 + 0.05, 0.05), new THREE.MeshStandardMaterial({ color: "#fff3e0", roughness: 0.5 }));
  stripe.position.set(0, 0.11, hwBot + slope * 0.11 + 0.003); stripe.rotation.x = -Math.atan(slope); g.add(stripe);
  const fryM = new THREE.MeshStandardMaterial({ color: "#f4c542", roughness: 0.55 });
  const fryDark = new THREE.MeshStandardMaterial({ color: "#e0a830", roughness: 0.6 });
  const rnd = rng(99);
  for (let i = 0; i < 34; i++) {
    const len = 0.5 + rnd() * 0.28;
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.055, len, 0.055), rnd() < 0.3 ? fryDark : fryM);
    const x = (rnd() * 2 - 1) * (hwTop - 0.07), z = (rnd() * 2 - 1) * (hwTop - 0.09);
    f.position.set(x, H - 0.12 + len / 2 - 0.15 + rnd() * 0.1, z - 0.02);
    f.rotation.set((rnd() * 2 - 1) * 0.22, rnd() * 1.5, (rnd() * 2 - 1) * 0.25 + x * 0.6);
    f.castShadow = true; g.add(f);
  }
  const top = H + 0.36;
  // face on the front panel: z = front plane at that height, normal tilted by the panel slope
  const n = new THREE.Vector3(0, -slope, 1).normalize();
  const face = new Face({
    size: 0.9, iris: (def.face || {}).iris, cheeks: (def.face || {}).cheeks,
    place: (u, v) => { const y = 0.36 + v * 0.17; const hw = hwBot + slope * y; return { pos: new THREE.Vector3(u * hw * 0.85, y, hw + 0.002), normal: n.clone() }; },
  });
  face.layout = { ...face.layout, eyeU: 0.42, eyeV: 0.55, browV: 1.15, mouthV: -0.45, mouthW: 0.3, cheekU: 0.75, cheekV: -0.15 };
  g.add(face.group);
  return {
    group: g,
    topY: () => top,
    apply(st) {
      const s = st.friesPop;
      g.scale.set(s, s, s);
      face.set({ ...st.expr, open: Math.max(st.expr.open, st.talk || 0) }, st.look, st.blink);
    },
  };
}
