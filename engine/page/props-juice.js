import * as THREE from "three";
import { clamp } from "./util.js";
import { taperedTube } from "./geo.js";

// Props for "Vampire vs Juice Box" (Jonny's story library #02, 28 Oct 2026): one small white juice carton with a purple
// berry pictogram, and one white bendy straw.
//   juicebox    origin = its bottom centre, the pictogram on its front (+z), the foil straw port on top (JUICE.port).
//               `holes` 0..1 opens the two fang punctures high on the front (JUICE.holes); `squeeze` 0..1 presses its
//               sides in (two hands on its ±x faces: each side moves in JUICE.press metres at 1); `jet` 0..1 runs the two
//               short purple jets from the holes to spec.jets = [[x, y, z], [x, y, z]] (world points): 0..0.5 the heads
//               fly, 0.5..1 the tails follow and the jets are gone, each landing with a small splash; `port` 0..1 tears the
//               foil; `straw` 0..1 shows the inserted straw (a straw with the same shape as the bendystraw, its foot
//               JUICE.strawIn deep in the port, its bend turned spec.strawRot degrees about y: 0 bends toward +x;
//               spec.strawScale its size relative to the carton's, so a big carton can keep a straw a mouth can reach).
//   bendystraw  origin = its bottom end, standing up along +y; its bend near the top turns the short end toward +x.
//               Lying on a table: tip 90 (the long end toward +z, the bend flat), y = the table + JUICE.strawR.
//               Grip "mid" is on the long part just under the bend.
//   papercup    origin = its bottom centre: a striped paper cup (CUP) with spec.straws spare straws leaning in it.
// Swapping the held straw for the carton's own (straw 1, the loose one scaled to 0) is invisible when the loose straw
// stands upright at the carton's port with rot = the carton's rot + strawRot (storyboards/juice/make-vampire-vs-juice-box.mjs STRAW_FOOT).
export const JUICE = {
  w: 0.104, d: 0.064, h: 0.168, r: 0.007,
  port: [0.026, -0.014],                          // x, z on the top
  holes: [[-0.017, 0.15], [0.017, 0.15]],         // x, y on the front face
  press: 0.012,
  strawR: 0.0048, strawL: 0.16, strawTip: 0.045, strawBend: 62, strawIn: 0.03, strawGrip: 0.045,
  color: "#7a2aa8",
};
export const CUP = { h: 0.1, top: 0.042, bottom: 0.032 };   // the paper cup of spare straws
export const JUICE_GRIPS = {
  bendystraw: { mid: [0, JUICE.strawGrip, 0] },
};

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function roundRect(w, h, r) {
  const s = new THREE.Shape(), x = w / 2, y = h / 2;
  s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0); s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2);
  s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI); s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5);
  return s;
}

// the straw, its foot at the group's origin: the long part up +y, a few accordion ridges, the short part bent toward +x
function straw(parent, m) {
  const g = new THREE.Group(); parent.add(g);
  const { strawR: R, strawL: L, strawTip: T, strawBend: B } = JUICE, b = (B * Math.PI) / 180;
  mesh(new THREE.CylinderGeometry(R, R, L, 14), m, g, 0, L / 2, 0);
  const cap = mesh(new THREE.SphereGeometry(R, 14, 8), m, g, 0, L, 0);
  // the bend: ridges round the joint, then the short part turned about z toward +x
  for (let i = 0; i < 4; i++) { const t = mesh(new THREE.TorusGeometry(R * 1.06, R * 0.32, 6, 14), m, g, 0, L - 0.018 + i * 0.006, 0); t.rotation.x = Math.PI / 2; }
  const tip = new THREE.Group(); tip.position.set(0, L, 0); tip.rotation.z = -b; g.add(tip);
  mesh(new THREE.CylinderGeometry(R, R, T, 14), m, tip, 0, T / 2, 0);
  const end = mesh(new THREE.CircleGeometry(R * 0.72, 14), mat("#d9d4cf"), tip, 0, T + 0.0003, 0); end.rotation.x = -Math.PI / 2;
  cap.castShadow = false;
  return g;
}
// the straw's end in its own frame (the sip point), for a mouth aimed at it
export const strawEnd = () => {
  const { strawL: L, strawTip: T, strawBend: B } = JUICE, b = (B * Math.PI) / 180;
  return [Math.sin(b) * T, L + Math.cos(b) * T, 0];
};

// the pictogram: three purple berries with soft highlights, two leaves, on white card with a faint warm shade
function frontTexture() {
  const c = document.createElement("canvas"); c.width = 256; c.height = 416; const g = c.getContext("2d");
  const gr = g.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, "#f3efe9"); gr.addColorStop(0.5, "#fdfbf7"); gr.addColorStop(1, "#efeae2");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 416);
  const berry = (x, y, r) => {
    const b = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    b.addColorStop(0, "#b46ae0"); b.addColorStop(0.55, "#7d33b3"); b.addColorStop(1, "#4f1b78");
    g.fillStyle = b; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#3b1260"; g.lineWidth = 4; g.stroke();
    g.fillStyle = "rgba(255,255,255,0.85)"; g.beginPath(); g.ellipse(x - r * 0.38, y - r * 0.4, r * 0.2, r * 0.13, -0.6, 0, Math.PI * 2); g.fill();
  };
  const leaf = (x, y, a) => {
    g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = "#5daa33"; g.strokeStyle = "#2f6a1a"; g.lineWidth = 4;
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(26, -22, 52, 0); g.quadraticCurveTo(26, 22, 0, 0); g.fill(); g.stroke(); g.restore();
  };
  leaf(128, 228, -2.5); leaf(128, 228, -0.6);
  berry(98, 262, 30); berry(158, 262, 30); berry(128, 306, 30);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export const JUICE_KINDS = {
  juicebox(P) {
    const S = P.spec, { w: W, d: D, h: H, r: R } = JUICE;
    const card = mat(S.color ?? "#fbf9f5", { roughness: 0.62 });
    // the body squeezes inside its own group, so the inserted straw and the jets stay put
    const body = new THREE.Group(); P.whole.add(body);
    const shell = new THREE.ExtrudeGeometry(roundRect(W - 2 * R, D - 2 * R, R * 0.5), { depth: H - 2 * R, bevelEnabled: true, bevelThickness: R, bevelSize: R, bevelSegments: 3, curveSegments: 6 });
    shell.rotateX(-Math.PI / 2); shell.translate(0, R, 0);
    mesh(shell, card, body);
    // the top's folded seam: a thin ridge across the top, front to back, and the foil port
    mesh(new THREE.BoxGeometry(W * 0.86, 0.004, 0.006), card, body, 0, H + 0.001, D * 0.36);
    const foil = mesh(new THREE.CircleGeometry(0.0085, 20), mat("#cfd3d8", { roughness: 0.3, metalness: 0.6 }), body, JUICE.port[0], H + 0.0012, JUICE.port[1]); foil.rotation.x = -Math.PI / 2; foil.castShadow = false;
    const torn = mesh(new THREE.CircleGeometry(0.0062, 16), mat("#5a4a6a", { roughness: 0.6 }), body, JUICE.port[0], H + 0.0016, JUICE.port[1]); torn.rotation.x = -Math.PI / 2; torn.castShadow = false;
    // the pictogram on the front, a plain one on the back
    const tex = frontTexture(), face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
    const front = mesh(new THREE.PlaneGeometry(W - 0.006, H - 0.012), face, body, 0, H / 2, D / 2 + 0.0006); front.castShadow = false;
    const back = mesh(new THREE.PlaneGeometry(W - 0.006, H - 0.012), face, body, 0, H / 2, -D / 2 - 0.0006); back.rotation.y = Math.PI; back.castShadow = false;
    // the two fang holes: small dark punctures with a purple wet rim
    const holeM = mat("#2a1430", { roughness: 0.4 }), rimM = mat(JUICE.color, { roughness: 0.3 });
    const holes = JUICE.holes.map(([x, y]) => {
      const g = new THREE.Group(); g.position.set(x, y, D / 2 + 0.0014); body.add(g);
      const rim = mesh(new THREE.CircleGeometry(0.0062, 16), rimM, g); rim.castShadow = false;
      const hole = mesh(new THREE.CircleGeometry(0.0038, 14), holeM, g, 0, 0, 0.0004); hole.castShadow = false;
      return g;
    });
    // the inserted straw
    const strawM = mat(S.straw ?? "#ffffff", { roughness: 0.35 });
    const inStraw = straw(P.whole, strawM);
    const ss = S.strawScale ?? 1;
    inStraw.position.set(JUICE.port[0], H - JUICE.strawIn * ss, JUICE.port[1]); inStraw.rotation.y = ((S.strawRot ?? 0) * Math.PI) / 180; inStraw.scale.setScalar(ss);
    // the jets: built in world space each frame, then brought into this prop's frame
    const juiceM = mat(JUICE.color, { roughness: 0.18, emissive: "#3a0f55" }), jets = [0, 1].map(() => {
      const tube = mesh(new THREE.BufferGeometry(), juiceM, P.whole); tube.castShadow = false;
      const head = mesh(new THREE.SphereGeometry(1, 12, 10), juiceM, P.whole); head.castShadow = false;
      // trailing droplets behind the stream, and the splash thrown out round the target
      const trail = Array.from({ length: 3 }, () => { const d = mesh(new THREE.SphereGeometry(1, 10, 8), juiceM, P.whole); d.castShadow = false; return d; });
      const drops = Array.from({ length: 6 }, () => { const d = mesh(new THREE.SphereGeometry(1, 10, 8), juiceM, P.whole); d.castShadow = false; d.visible = false; return d; });
      return { tube, head, trail, drops };
    });
    const v = new THREE.Vector3(), q = new THREE.Vector3();
    return {
      grip: H * 0.5,
      apply(ps) {
        const sq = clamp(ps.squeeze ?? 0);
        body.scale.set(1 - (2 * JUICE.press * sq) / W, 1 + 0.02 * sq, 1 + 0.06 * sq);
        for (const h of holes) { const k = clamp(ps.holes); h.visible = k > 0.01; h.scale.setScalar(Math.max(0.001, k)); }
        torn.visible = clamp(ps.port) > 0.01; torn.scale.setScalar(Math.max(0.001, clamp(ps.port)));
        inStraw.visible = (ps.straw ?? 0) > 0.5;
        const J = clamp(ps.jet ?? 0), targets = S.jets || [];
        P.root.updateMatrixWorld(true);
        jets.forEach((jt, i) => {
          const live = J > 0 && J < 1 && targets[i];
          jt.tube.visible = jt.head.visible = !!live;
          if (!live) { for (const d of [...jt.drops, ...jt.trail]) d.visible = false; return; }
          // the path: a shallow arc from the hole (in the world) to the target
          const a = body.localToWorld(v.set(JUICE.holes[i][0], JUICE.holes[i][1], D / 2 + 0.004)).clone(), b = q.fromArray(targets[i]).clone();
          const m = a.clone().lerp(b, 0.5); m.y += 0.05 * a.distanceTo(b);
          const curve = new THREE.QuadraticBezierCurve3(a, m, b), sc = P.root.scale.x || 1;
          // the stream runs from its tail (thin) to its head (a round blob); it leaves the hole, lands, and the tail follows
          const head = clamp(J / 0.5), tail = clamp((J - 0.3) / 0.6), ok = head - tail > 0.01;
          const pts = [];
          for (let k = 0; k <= 16; k++) pts.push(P.whole.worldToLocal(curve.getPoint(tail + (head - tail) * (k / 16))));
          const R = (0.0034 + 0.0008 * i) / sc;
          jt.tube.geometry.dispose();
          jt.tube.geometry = ok ? taperedTube(new THREE.CatmullRomCurve3(pts), 0, 0, 24, 8, (u) => R * (0.35 + 0.65 * u)) : new THREE.BufferGeometry();
          jt.head.visible = ok && head < 1; jt.head.position.copy(pts[16]); jt.head.scale.setScalar(R * 1.35);
          jt.trail.forEach((d, k) => {
            const u = tail - 0.06 * (k + 1);
            d.visible = ok && u > 0 && J < 0.85;
            if (d.visible) { d.position.copy(P.whole.worldToLocal(curve.getPoint(u))); d.scale.setScalar(R * (0.8 - 0.18 * k)); }
          });
          // the splash: droplets thrown out round the target once the head lands, shrinking away
          const s = clamp((J - 0.5) / 0.35), land = P.whole.worldToLocal(b.clone());
          jt.drops.forEach((d, k) => {
            const ang = k * 1.05 + i * 0.5, r = (0.012 + 0.045 * s) / sc;
            d.visible = s > 0 && s < 1;
            d.position.set(land.x + Math.cos(ang) * r, land.y + Math.sin(ang) * r * 0.8 + 0.02 * s * (1 - s) / sc, land.z + 0.01 / sc);
            d.scale.setScalar(((0.006 - 0.001 * (k % 3)) * (1 - s)) / sc + 0.0001);
          });
        });
      },
    };
  },
  bendystraw(P) {
    straw(P.whole, mat(P.spec.color ?? "#ffffff", { roughness: 0.35 }));
    return { grip: JUICE.strawGrip };
  },
  // a striped paper cup that keeps the spare straws (the Wizard's: he came prepared). spec.straws: how many spares stand
  // in it, leaning on the rim; the one he takes is its own bendystraw prop, standing at the cup's centre
  papercup(P) {
    const c = document.createElement("canvas"); c.width = 128; c.height = 64; const x = c.getContext("2d");
    x.fillStyle = "#fbfaf6"; x.fillRect(0, 0, 128, 64); x.fillStyle = P.spec.stripe ?? "#7a2aa8";
    for (let i = 0; i < 8; i++) x.fillRect(i * 16 + 4, 0, 6, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping;
    const H = CUP.h, side = mesh(new THREE.CylinderGeometry(CUP.top, CUP.bottom, H, 28, 1, true), mat("#ffffff", { map: t, roughness: 0.7, side: THREE.DoubleSide }), P.whole, 0, H / 2, 0);
    side.material.side = THREE.DoubleSide;
    mesh(new THREE.CircleGeometry(CUP.bottom, 24), mat("#e8e2d6"), P.whole, 0, 0.004, 0).rotation.x = -Math.PI / 2;
    const rim = mesh(new THREE.TorusGeometry(CUP.top, 0.0028, 6, 28), mat("#fbfaf6"), P.whole, 0, H, 0); rim.rotation.x = Math.PI / 2;
    const sm = mat("#ffffff", { roughness: 0.35 });
    for (let i = 0; i < (P.spec.straws ?? 2); i++) {
      // each stands on the far side of the bottom and leans across against the rim (lean, radians), so its top end
      // is well out of the middle, where a hand reaches in for the one standing there
      const a = 2.2 + i * 2.1, L = P.spec.lean ?? 0.45, g = straw(P.whole, sm);
      g.position.set(-Math.cos(a) * CUP.bottom * 0.5, 0.006, -Math.sin(a) * CUP.bottom * 0.5);
      g.rotation.set(Math.sin(a) * L, a * 0.7, -Math.cos(a) * L);
      g.scale.setScalar(P.spec.strawScale ?? 1);
    }
    return {};
  },
};
