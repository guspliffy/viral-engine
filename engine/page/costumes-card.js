import * as THREE from "three";

// Homemade cardboard wings ("Your Costume Is Better Than Mine", 29 Oct 2026): a copy of Phoenix's wings cut from
// orange-painted card, strapped over the costume with two brown shoulder straps, tape on the seams. Any character gets
// them with costume.cardWings: true (or { size, color, tip, edge }); buildCostume (costumes.js) adds them.
//
// Each wing hangs from a pivot on the back, behind the shoulder: an inner panel (the "arm" of the wing, two short
// feathers under it), a taped hinge, and an outer group of three long feathers. All of it is flat card (1 cm thick,
// painted on both faces, brown cut edges). The "card" action (timeline.js) drives four numbers per side, R and L:
//   raise   0 hangs down beside the body (the tip near the feet), 1 lifted up and out like a spread wing
//   fold    0 flat, 1 the hinge has given way: the outer feathers fold down and back, the inner panel sags
//   crook   0 straight, 1 the top outer feather bent down at its middle (a crumpled tip)
//   flutter 0 still, 1 the card shivers in a gust (deterministic: a function of the frame time)
// The card never turns into feathers or fire: it is the same pieces of card all the way through.
export const CARD_REST = { raise: 0.12, fold: 0, crook: 0, flutter: 0 };

const sstep = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

// painted card: orange from the root to a yellow tip, a marker quill and barbs, an unpainted brown band at the cut
// edge (the paint never quite reaches it), in the piece's own shape coordinates (x 0..L along it, y -W/2..W/2)
function paintTex(L, W, C, outline, quill = true) {
  const px = 220, c = document.createElement("canvas"); c.width = Math.round(px * L * 4); c.height = Math.round(px * W * 4);
  const g = c.getContext("2d"), sx = c.width / L, sy = c.height / W, P = (x, y) => [x * sx, (W / 2 - y) * sy];
  g.fillStyle = C.edge; g.fillRect(0, 0, c.width, c.height);
  g.save(); g.beginPath(); outline.forEach(([x, y], i) => { const [u, v] = P(x, y); if (i) g.lineTo(u, v); else g.moveTo(u, v); }); g.closePath();
  g.clip();
  // the paint: a gradient along the piece, laid on a little short of the edge
  const gr = g.createLinearGradient(0, 0, c.width, 0); gr.addColorStop(0, C.color); gr.addColorStop(0.55, C.color); gr.addColorStop(1, C.tip);
  g.lineJoin = "round"; g.strokeStyle = C.edge; g.lineWidth = 0.022 * sy;
  g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
  // brush streaks: the paint is uneven, as poster paint on card is
  for (let i = 0; i < 26; i++) {
    const y = (i / 26) * c.height, a = 0.06 + 0.05 * Math.sin(i * 2.3);
    g.fillStyle = `rgba(190,70,10,${a})`; g.fillRect(0, y, c.width, c.height / 60);
  }
  if (quill) {
    // a marker quill down the middle and a few barbs, a hand-drawn dark orange line
    g.strokeStyle = "rgba(150,58,18,0.85)"; g.lineWidth = 0.008 * sy; g.lineCap = "round";
    g.beginPath(); g.moveTo(...P(0.02, 0)); g.quadraticCurveTo(...P(L * 0.5, 0.004), ...P(L * 0.9, 0)); g.stroke();
    g.lineWidth = 0.005 * sy;
    for (let i = 1; i < 6; i++) {
      const x = (L * 0.85 * i) / 6;
      for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(...P(x, 0)); g.lineTo(...P(x + L * 0.07, sg * W * 0.3)); g.stroke(); }
    }
  }
  g.restore();
  // the cut edge: the paint stops a few millimetres in, so a band of brown card shows all round
  g.beginPath(); outline.forEach(([x, y], i) => { const [u, v] = P(x, y); if (i) g.lineTo(u, v); else g.moveTo(u, v); }); g.closePath();
  g.strokeStyle = C.edge; g.lineWidth = 0.02 * sy; g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.repeat.set(1 / L, 1 / W); t.offset.set(0, 0.5);
  return t;
}

// a feather's outline: a strip of width W from the root (x 0) that ends in a rounded, slightly pointed tip at x L,
// with one small notch cut into its lower edge (scissors)
function featherOutline(L, W) {
  const pts = [], N = 10;
  pts.push([0, -W / 2], [L * 0.45, -W / 2], [L * 0.5, -W * 0.34], [L * 0.55, -W / 2], [L * 0.72, -W / 2]);
  for (let i = 0; i <= N; i++) { const a = -Math.PI / 2 + (i / N) * Math.PI, r = W / 2; pts.push([L * 0.72 + Math.cos(a) * (L * 0.28), Math.sin(a) * r * (1 - 0.15 * Math.cos(a))]); }
  pts.push([L * 0.72, W / 2], [0, W / 2]);
  return pts;
}
// the inner panel: a trapezoid, taller at its outer end, the top edge rising gently (the wing's leading edge)
const panelOutline = (L, W0, W1) => [[0, -W0 / 2], [L, -W1 / 2 - 0.02], [L, W1 / 2], [L * 0.5, W0 / 2 + (W1 - W0) * 0.35], [0, W0 / 2]];

function cardMesh(outline, from, to, C, tex) {
  const s = new THREE.Shape(); outline.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  // only the part between x from..to (a feather cut in two at its bend): clip the outline by x
  let shape = s;
  if (from > 0 || to < 1e9) {
    const pts = clipX(outline, from, to); shape = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  }
  const T = 0.01, geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, curveSegments: 6 });
  geo.translate(-from, 0, -T / 2);   // the piece starts at its own origin (its bend); the texture stays in shape coordinates
  const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), side = new THREE.MeshStandardMaterial({ color: C.edge, roughness: 0.95 });
  const m = new THREE.Mesh(geo, [face, side]); m.castShadow = true; m.receiveShadow = true;
  return m;
}
// Sutherland-Hodgman against the two vertical lines x = a and x = b
function clipX(poly, a, b) {
  const cut = (P, keep, X) => {
    const out = [];
    for (let i = 0; i < P.length; i++) {
      const p = P[i], q = P[(i + 1) % P.length], kp = keep(p[0]), kq = keep(q[0]);
      if (kp) out.push(p);
      if (kp !== kq) { const k = (X - p[0]) / (q[0] - p[0]); out.push([X, p[1] + (q[1] - p[1]) * k]); }
    }
    return out;
  };
  return cut(cut(poly, (x) => x >= a, a), (x) => x <= b, b);
}

// a strip of parcel tape: pale, a little see-through, a hair in front of the card face (both faces)
function tape(parent, w, h, x, y, ang, depth = 0.0062) {
  const m = new THREE.MeshStandardMaterial({ color: "#efe7d2", roughness: 0.35, transparent: true, opacity: 0.88, polygonOffset: true, polygonOffsetFactor: -2 });
  m.userData.noOutline = true;
  for (const z of [depth, -depth]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.z = ang;
    if (z < 0) p.rotation.y = Math.PI;
    parent.add(p);
  }
}

export function cardWings(C0, ch) {
  const C = { color: "#f08a2c", tip: "#ffc246", edge: "#a8743f", strap: "#7a4a26", size: 1.6, ...(typeof C0 === "object" ? C0 : {}) };
  const S = C.size, wings = {};
  for (const [side, s] of [["R", -1], ["L", 1]]) {
    // the pivot: on the back behind the shoulder, just outside the costume
    const n = new THREE.Vector3(s * 0.62, 0.08, -0.75).normalize(), q = ch.bodyPoint(n);
    const pivot = new THREE.Group(); pivot.position.set(q.x * 1.12, ch.cy + (q.y - ch.cy) * 1.12, q.z * 1.12); ch.bodyGroup.add(pivot);
    const yawG = new THREE.Group(); yawG.rotation.y = s > 0 ? 0.42 : Math.PI - 0.42; pivot.add(yawG);   // swept back a little, clear of the arms
    const raiseG = new THREE.Group(); yawG.add(raiseG);
    // the inner panel and the two short feathers under it
    const PL = 0.24 * S, PW0 = 0.12 * S, PW1 = 0.2 * S, po = panelOutline(PL, PW0, PW1);
    raiseG.add(cardMesh(po, 0, 1e9, C, paintTex(PL, PW1 + 0.06 * S, C, po.map(([x, y]) => [x, y]), false)));
    for (const [k, ang, L] of [[0.35, -1.25, 0.17], [0.72, -1.05, 0.2]]) {
      const fo = featherOutline(L * S, 0.07 * S), m = cardMesh(fo, 0, 1e9, C, paintTex(L * S, 0.07 * S, C, fo));
      m.position.set(PL * k, -PW0 * 0.25, -0.012); m.rotation.z = ang; raiseG.add(m);
    }
    tape(raiseG, 0.1 * S, 0.035 * S, 0.03 * S, 0.0, 0.5);    // over the root, where the card is taped to the strap
    // the hinge: a strip of tape across the join, then the outer feathers, which fold here
    const hinge = new THREE.Group(); hinge.position.set(PL, 0, 0); raiseG.add(hinge);
    tape(raiseG, 0.035 * S, PW1 * 0.7, PL - 0.005, 0.0, 0.12, 0.0068);
    const feathers = [];
    [[0.36, 0.42, 0.024], [0.31, 0.0, 0.012], [0.26, -0.42, 0.0]].forEach(([L, ang, dz], i) => {
      const Lm = L * S, W = 0.085 * S, fo = featherOutline(Lm, W), tex = paintTex(Lm, W, C, fo), bendAt = Lm * 0.5;
      const g = new THREE.Group(); g.position.set(-0.025 * S, (0.05 - 0.05 * i) * S, dz - 0.012); g.rotation.z = ang; hinge.add(g);
      g.add(cardMesh(fo, 0, bendAt, C, tex));
      const tipG = new THREE.Group(); tipG.position.set(bendAt, 0, 0); g.add(tipG);
      tipG.add(cardMesh(fo, bendAt, 1e9, C, tex));
      if (i === 1) tape(g, 0.07 * S, 0.03 * S, Lm * 0.3, 0.0, -0.6, 0.0068);   // a patched tear
      feathers.push({ g, tipG });
    });
    wings[side] = { s, pivot, raiseG, hinge, feathers, phase: s > 0 ? 0.0 : 1.7 };
  }
  // two shoulder straps: brown bands from the wing roots over the shoulders, down the front beside the face and back
  // under the arms (closed loops, a little outside the costume)
  const strapM = new THREE.MeshStandardMaterial({ color: C.strap, roughness: 0.7 });
  for (const s of [-1, 1]) {
    const dirs = [[2.62, 0.3], [2.1, 0.62], [1.45, 0.55], [1.12, 0.2], [1.05, -0.2], [1.12, -0.58], [1.7, -0.7], [2.35, -0.35]];
    const pts = dirs.map(([az, el]) => {
      const d = new THREE.Vector3(s * Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)), p = ch.bodyPoint(d), k = 1.14;
      return new THREE.Vector3(p.x * k, ch.cy + (p.y - ch.cy) * k, p.z * k);
    });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 96, 0.016, 8, true), strapM);
    tube.scale.set(1, 1, 1); tube.castShadow = true; ch.bodyGroup.add(tube);
  }
  return {
    apply(st, t) {
      for (const side of ["R", "L"]) {
        const W = wings[side], k = { ...CARD_REST, ...(st.card?.[side] || {}) };
        const fl = k.flutter * (Math.sin(t * 23 + W.phase) * 0.6 + Math.sin(t * 37.3 + 2 * W.phase) * 0.4);
        // raise: from hanging (-1.3 rad at 0, straight down below 0, the tip by the feet) to lifted up and out (+0.9 at 1); the fold lets the whole wing sag
        W.raiseG.rotation.set(0, 0, -1.3 + 2.2 * k.raise - 0.3 * sstep(0, 1, k.fold) + 0.12 * fl);
        // the hinge gives: the outer feathers drop down
        const f = sstep(0, 1, k.fold);
        W.hinge.rotation.set(0, -0.18 * f, -1.2 * f + 0.2 * fl);   // down, and only a little back, so a folded wing still shows at the side
        W.feathers.forEach((F, i) => { F.tipG.rotation.z = (i === 0 ? -1.1 * k.crook : 0) - 0.18 * f * (i + 1) / 3 + 0.08 * fl * (i - 1); });
      }
    },
  };
}
