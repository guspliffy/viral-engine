import * as THREE from "three";
import { rng } from "./util.js";

// Phase 2, living world (31 Oct 2026): the air of a set, on top of what the set builds. Opt-in per storyboard:
//   set.air: { shafts: 7 (sunbeams slanting through the canopy), motes: 160 (dust and pollen drifting in the light),
//              box: [[x0, z0], [x1, z1]] (where they hang), color: "#ffe6a8", seed }
// Everything moves as a function of the frame time (globalThis.__setTicks), so renders stay deterministic. The beams
// are additive and see-through: the drawn lines and the caption check ignore them.
export function addAir(scene, A, ctx = {}) {
  if (!A) return;
  const r = rng(A.seed ?? 7), [[x0, z0], [x1, z1]] = A.box || [[-4, 12], [4, -8]], col = new THREE.Color(A.color || "#ffe6a8");
  const now = { t: 0 }; (globalThis.__setTicks ||= []).push((t) => { now.t = t; });
  const g = new THREE.Group(); g.name = "set-air"; scene.add(g);
  // a beam: a tall quad, bright down its middle and soft at the sides and ends, turned round its own axis to face the
  // lens, leaning with the sun
  const tex = (() => { const c = document.createElement("canvas"); c.width = 64; c.height = 256; const x = c.getContext("2d");
    const h = x.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, "rgba(255,255,255,0)"); h.addColorStop(0.5, "rgba(255,255,255,1)"); h.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = h; x.fillRect(0, 0, 64, 256); x.globalCompositeOperation = "destination-in";
    const v = x.createLinearGradient(0, 0, 0, 256); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(0.2, "rgba(0,0,0,0.9)"); v.addColorStop(0.75, "rgba(0,0,0,0.6)"); v.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = v; x.fillRect(0, 0, 64, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const lean = new THREE.Vector3(...(A.dir || [0.35, -1, -0.25])).normalize().negate();   // up the beam, toward the sun
  const beams = [];
  for (let i = 0; i < (A.shafts ?? 7); i++) {
    const m = new THREE.MeshBasicMaterial({ map: tex, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide });
    m.userData.noOutline = true;
    const w = 0.35 + r() * 0.6, L = 7 + r() * 4, q = new THREE.Mesh(new THREE.PlaneGeometry(w, L).translate(0, L / 2, 0), m);
    q.position.set(x0 + r() * (x1 - x0), -0.2, z0 + r() * (z1 - z0)); q.renderOrder = 3; q.frustumCulled = false; g.add(q);
    beams.push({ q, m, k: 0.07 + r() * 0.08, ph: r() * 6.3, sp: 0.4 + r() * 0.5 });
  }
  // motes: tiny bright specks drifting slowly and twinkling where the light catches them
  const N = A.motes ?? 160, P = new Float32Array(N * 3), seeds = [];
  for (let i = 0; i < N; i++) seeds.push([x0 + r() * (x1 - x0), 0.2 + r() * 2.4, z0 + r() * (z1 - z0), r() * 6.3, 0.03 + r() * 0.05]);
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(P, 3));
  const dot = (() => { const c = document.createElement("canvas"); c.width = c.height = 32; const x = c.getContext("2d"), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.4, "rgba(255,255,255,0.5)"); gr.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
  const pm = new THREE.PointsMaterial({ map: dot, color: col, size: A.moteSize ?? 0.035, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const pts = new THREE.Points(geo, pm); pts.frustumCulled = false; pts.renderOrder = 3; g.add(pts);
  const v = new THREE.Vector3(), up = new THREE.Vector3(), bx = new THREE.Vector3(), bz = new THREE.Vector3(), M = new THREE.Matrix4();
  // each beam turns round its own axis to face the lens, and breathes slowly (clouds passing the sun)
  for (const B of beams) B.q.onBeforeRender = (rd, s, cam) => {
    up.copy(lean); v.copy(cam.position).sub(B.q.position); v.addScaledVector(up, -v.dot(up)).normalize();
    bx.crossVectors(up, v).normalize(); bz.crossVectors(bx, up);
    B.q.quaternion.setFromRotationMatrix(M.makeBasis(bx, up, bz)); B.q.updateMatrixWorld();
    B.m.opacity = B.k * (0.65 + 0.35 * Math.sin(now.t * B.sp + B.ph));
  };
  pts.onBeforeRender = () => {
    const t = now.t;
    for (let i = 0; i < N; i++) { const [x, y, z, ph, sp] = seeds[i]; P[i * 3] = x + Math.sin(t * sp * 7 + ph) * 0.15 + t * 0.04; P[i * 3 + 1] = y + Math.sin(t * sp * 5 + ph * 1.7) * 0.1; P[i * 3 + 2] = z + Math.cos(t * sp * 6 + ph) * 0.12; }
    geo.attributes.position.needsUpdate = true;
  };
  return g;
}
