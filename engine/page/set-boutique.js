import * as THREE from "three";
// Happiness 01 money redo (15 Nov 2026): STUB wired by the director; the builder replaces it (DESIGN.md section 12).
export function buildBoutique(scene, spec = {}) { const root = new THREE.Group(); root.name = "set-boutique"; scene.add(root); return root; }
