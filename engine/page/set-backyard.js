import * as THREE from "three";
import { rng } from "./util.js";
import { buildHills } from "./set-painted.js";

// "backyard": a sunny back garden for HOW TO CATCH ME (25 Oct): look C's painted meadow ("hills") with a white picket
// fence across the back, a garden shed on the left, a round tree on the right, flower beds along the fence and
// stepping stones. The fence has a gap at BACKYARD.gapX (BACKYARD.gap wide) where a breakable `fence` prop stands,
// so the Viking can smash that stretch. spec: { type: "backyard", seed: 3 }
export const BACKYARD = { fenceZ: -2.6, gapX: 0.3, gap: 1.6 };   // the fence clear of the propped box trap's back

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function box(parent, w, h, d, m, x, y, z) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; parent.add(b); return b; }

function fenceRun(parent, x0, x1, z, paint) {
  const n = Math.max(1, Math.round((x1 - x0) / 0.16)), step = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const x = x0 + (i + 0.5) * step;
    box(parent, 0.1, 0.78, 0.025, paint, x, 0.39, z);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0, 0.072, 0.07, 4), paint); tip.position.set(x, 0.815, z); tip.rotation.y = Math.PI / 4; tip.scale.z = 0.35; parent.add(tip);
  }
  for (const y of [0.22, 0.6]) box(parent, x1 - x0, 0.06, 0.03, paint, (x0 + x1) / 2, y, z - 0.025);
}

export function buildBackyard(scene, S = {}) {
  const group = buildHills(scene, { seed: S.seed ?? 3 }), rnd = rng((S.seed ?? 3) * 71 + 5);
  const { fenceZ: Z, gapX, gap } = BACKYARD, paint = std("#f7f4ee", { roughness: 0.6 });
  fenceRun(group, -4.5, gapX - gap / 2, Z, paint);
  fenceRun(group, gapX + gap / 2, 4.5, Z, paint);
  for (const x of [gapX - gap / 2, gapX + gap / 2]) box(group, 0.09, 0.92, 0.09, paint, x, 0.46, Z - 0.01);   // posts either side of the gap

  // the shed, back left: plank walls, a dark roof, a door with a little window
  const shed = new THREE.Group(); shed.position.set(-2.05, 0, Z - 1.1); shed.rotation.y = 0.35; group.add(shed);
  box(shed, 1.3, 1.25, 1.0, std("#8fb7c9"), 0, 0.625, 0);
  for (let i = 0; i < 9; i++) box(shed, 0.012, 1.25, 0.01, std("#6f98ab"), -0.6 + i * 0.15, 0.625, 0.505);
  for (const s of [-1, 1]) { const roof = box(shed, 0.82, 0.05, 1.15, std("#5b4a52"), s * 0.36, 1.43, 0); roof.rotation.z = -s * 0.5; }
  box(shed, 0.42, 0.85, 0.02, std("#f2efe8"), 0.25, 0.43, 0.51);
  box(shed, 0.2, 0.16, 0.025, std("#bfe3f5", { roughness: 0.2 }), 0.25, 0.68, 0.515);

  // a round tree, back right
  const tree = new THREE.Group(); tree.position.set(2.1, 0, Z - 1.3); group.add(tree);
  box(tree, 0.16, 1.3, 0.16, std("#8a5a3a"), 0, 0.65, 0);
  const leaf = [std("#6cbf4a"), std("#58a83c"), std("#7fd05a")];
  for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.32 + rnd() * 0.18, 18, 14), leaf[i % 3]); b.position.set((rnd() - 0.5) * 0.8, 1.45 + rnd() * 0.5, (rnd() - 0.5) * 0.5); b.castShadow = true; tree.add(b); }

  // flower beds along the fence (not in the gap) and a few stepping stones
  const petals = ["#ff7aa8", "#ffd23f", "#ffffff", "#b58cff", "#ff8a4a"].map((c) => std(c, { roughness: 0.5 })), stem = std("#4f9a3a");
  for (let i = 0; i < 36; i++) {
    const x = -3.6 + rnd() * 7.2; if (Math.abs(x - gapX) < gap / 2 + 0.1) continue;
    const z = Z + 0.12 + rnd() * 0.22, h = 0.14 + rnd() * 0.16;
    box(group, 0.012, h, 0.012, stem, x, h / 2, z);
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.04 + rnd() * 0.02, 10, 8), petals[i % 5]); f.position.set(x, h, z); f.castShadow = true; group.add(f);
  }
  const stoneM = std("#d9d3c8", { roughness: 0.9 });
  for (const [x, z] of [[-1.25, 0.55], [-0.75, 0.75], [0.8, 0.7], [1.3, 0.45]]) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.03, 18), stoneM); s.scale.z = 0.7; s.position.set(x, 0.015, z); s.receiveShadow = true; group.add(s); }
  return group;
}
