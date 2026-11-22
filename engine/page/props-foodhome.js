import * as THREE from "three";
import { clamp, rng } from "./util.js";
import { mat, basic, mesh, canvasTex } from "./props-trend.js";

// Kid vs Dad 02 "food at home" (design: storyboards/series/kid-vs-dad/02-food-at-home/DESIGN.md sections 6, 7 and 10 Q4).
// Metres before spec.scale. Deterministic: seeded rng only, every animation a pure function of the prop's keys, no material
// opacity ever tweened (see-through parts have a FIXED opacity; strokes, beads and the burger's paper change by scale,
// visibility or rebuild-on-key-change only).
//
//   wrapburger   a burger in paper (panels 14, 15). Origin: bottom centre (the bun's underside), 0.24 across, 0.155 tall.
//                Stack (y): bun base 0..0.032 `#e09a3a`, patty to 0.062 (r 0.118) `#5a3220`, cheese to 0.070 `#ffc933` (a square
//                0.172 on a side turned 45 degrees, its 4 corners droop 0.02), tomato to 0.082 `#d8452e`, lettuce to 0.094 `#6fb23a` (a wavy
//                frill 0.012 past the bun), bun top to 0.155 `#d9933a` (dome r 0.115, 16 seeds `#f6e6b8`). Paper `#f6f3ea`
//                with 8 creases `#d9d5c8` and a faint diamond grid `#e3dfd2`, blank. Front +z.
//     wrap 0..1  FIXED per prop (the spec's `wrap`; the unwrapping is the cut, never a tween): 1 = a paper cup up to y 0.085
//                in front (+z) and 0.115 behind, 6 points up to 0.15 at the back; 0.35 = paper down to 0.045 all round, the
//                points splayed 40 degrees out; 0 = only a flat sheet under the burger. Give `wrap` in the spec (a spec with
//                none draws wrap 1). The paper is rebuilt only when the number changes.
//     HELD         box hold, both palms on the paper (storyboards/lib/grips.mjs SIZE wrapburger { w: 0.24, h: 0.155, d: 0.24 }:
//                palms at x +-(0.12 + gap), y = height x 0.155; the design's y 0.05 = height 0.32, gap 0.03). Two copies for
//                the pass (burgerM wrap 1, burgerD wrap 0.35), no hand-to-hand.
//
//   fogglass     the fogged rear side window on the car's RIGHT (kerb side, -x): place it at the car's origin with `rig` (x 0,
//                y 0, z 0), it draws in car space. Pane x -0.985, z -1.10..-0.42, y 0.92..1.97 (the kit's glass `#d8eef8`,
//                opacity 0.1). Fog: ONE 512 x 790 canvas drawn once on a plane 0.002 outside the pane (milky `#e6eef2`, alpha
//                0.62 feathering to 0.25 within 0.08 of the edges along 7 uneven lobes; material opacity fixed at 1, all the
//                see-through is in the texture), a porthole (oval 0.34 x 0.38 at z -0.95, y 1.30, alpha 0.15, feather 0.06) and
//                26 drops (6 with a run). Marks: 4 strokes `#27313f`, 0.020 wide, round ends, each its own mesh 0.0015 outside the
//                fog (centres z -0.640 -0.585 -0.530 -0.475, tops y 1.47 1.46 1.475 1.455, lengths 0.20 0.19 0.21 0.185, leans
//                -4 +3 -2 +5 degrees, positive = the top toward +z = screen right from outside; each bends up to 0.006), a bead
//                r 0.008 and a 0.04 run under each, shown once the stroke is drawn.
//     marks 0..4   stroke i is drawn from its top down to length x clamp(marks - (i-1)); scale and visibility only. Not a
//                propState key: prime it once, c.prop(0, "fog", { marks: 0 }, 0), then tween it (0.35 s a stroke), or give
//                spec.marks for a still.
//     anchors.tip  (ride [id, "tip"] or read it in a pin): the growing end of the stroke being drawn on the INNER face (x -0.975),
//                where his left index tip is pinned (hand shape `point`).
//     spec.opaque: true  the fallback if the alpha texture dies in the toon pass: an opaque pane `#cfdbe2` with the porthole cut
//                out as a real hole (marks and drops stay).
//
//   cablight     the cabin dome lamp: a lens 0.10 x 0.06 `#fff1cf` in a lining-coloured frame, facing DOWN; origin the lens
//                centre (place it at car (0, 1.94, -0.10) with `rig`), one real light `#ffe6c0` (range 2.4) 0.12 below it.
//     lit 0..1   the lens colour (grey-cream to `#fff1cf`) and the light (default spec.lit or 0: give lit 1 at dusk).
//
//   sweatbead    the dad's single bead of sweat (Q4): a teardrop 0.03 tall x 0.02 wide `#d4ecff` (flattened to 0.012 deep, tip
//                up) with a 0.006 highlight. A WORN prop: spec.wear = "dad", x y z a point in his body frame (the right temple,
//                0.80 Hh outside the brow); tween y down 0.16 over 1.1 s, then scale 0 (position only). Origin: its middle.
export const FOODHOME = {
  burger: { w: 0.24, h: 0.155, d: 0.24, r: 0.118 },
  glass: { x: -0.985, z0: -1.1, z1: -0.42, y0: 0.92, y1: 1.97 },
  strokes: [{ z: -0.64, top: 1.47, len: 0.2, lean: -4, bend: 0.004 }, { z: -0.585, top: 1.46, len: 0.19, lean: 3, bend: -0.005 }, { z: -0.53, top: 1.475, len: 0.21, lean: -2, bend: 0.006 }, { z: -0.475, top: 1.455, len: 0.185, lean: 5, bend: -0.003 }],
  lamp: [0, 1.94, -0.1],
};

const rad = (d) => (d * Math.PI) / 180;
const lerp = (a, b, t) => a + (b - a) * t;

// ---- the burger -------------------------------------------------------------------------------------------------
const PAPER_R = (y) => 0.117 + 0.11 * y;                           // the paper's radius at height y (clear of the patty and the lettuce)

function paperTexture() {
  // one eighth of the way round and 0.098 up: a crease on its left edge and the faint diamond grid
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = "#f6f3ea"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#e3dfd2"; g.lineWidth = 4;
    g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w / 2, 0); g.lineTo(w, h / 2); g.lineTo(w / 2, h); g.closePath(); g.stroke();
    g.fillStyle = "#d9d5c8"; g.fillRect(0, 0, 3, h);
  });
}

function buildPaper(group, wrap, paperM) {
  for (const c of [...group.children]) { group.remove(c); c.geometry?.dispose(); }
  const w = clamp(wrap, 0, 1), s = clamp((w - 0.35) / 0.65), u = clamp(w / 0.35);
  const front = w >= 0.35 ? lerp(0.045, 0.085, s) : 0.045 * u, back = w >= 0.35 ? lerp(0.045, 0.115, s) : 0.045 * u;
  const L = w >= 0.35 ? lerp(0.05, 0.035, s) : 0.05 * u, splay = w >= 0.35 ? lerp(40, 0, s) : lerp(90, 40, u);
  const H = (th) => (front + back) / 2 + ((back - front) / 2) * -Math.cos(th);   // th 0 = +z (front), pi = -z (back)
  // the base sheet under the burger (a bigger flat sheet when it is unwrapped)
  const disc = new THREE.Mesh(new THREE.CircleGeometry(w >= 0.35 ? 0.121 : lerp(0.17, 0.121, u), 40), paperM); disc.rotation.x = Math.PI / 2; disc.position.y = -0.0006; disc.castShadow = false; group.add(disc);
  if (w < 0.004) return;
  // the wall: NU slices round, 3 rows up; radius follows PAPER_R plus a little crinkle
  const NU = 64, NR = 3, pos = [], uv = [], idx = [];
  for (let j = 0; j <= NR; j++) for (let i = 0; i <= NU; i++) {
    const th = (i / NU) * Math.PI * 2, y = (H(th) * j) / NR, r = PAPER_R(y) + 0.0022 * Math.sin(th * 8) * (j / NR);
    pos.push(Math.sin(th) * r, y, Math.cos(th) * r); uv.push((i / NU) * 8, y / 0.098);
  }
  for (let j = 0; j < NR; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + NU + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const wall = new THREE.Mesh(g, paperM); wall.castShadow = wall.receiveShadow = true; group.add(wall);
  // 6 points at the back, hinged on the top edge, splayed outward
  for (let k = 0; k < 6; k++) {
    const th = Math.PI + (k - 2.5) * 0.36, h = H(th), r = PAPER_R(h);
    const tri = new THREE.BufferGeometry(); tri.setAttribute("position", new THREE.Float32BufferAttribute([-0.026, 0, 0, 0.026, 0, 0, 0, L, 0], 3)); tri.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2)); tri.computeVertexNormals();
    const p = new THREE.Group(); p.position.set(Math.sin(th) * r, h - 0.001, Math.cos(th) * r); p.rotation.set(0, th, 0);
    const m = new THREE.Mesh(tri, paperM); m.rotation.x = rad(splay); m.castShadow = false; p.add(m); group.add(p);
  }
}

// builds one burger's food (the same for every wrap)
function buildFood(parent) {
  const rnd = rng(9), R = FOODHOME.burger.r;
  const bunM = mat("#e09a3a", { roughness: 0.6 }), topM = mat("#d9933a", { roughness: 0.55 });
  const add = (geo, m, y) => mesh(geo, m, parent, 0, y, 0);
  // bun base 0..0.032 (a rounded-bottom puck, r 0.115)
  add(new THREE.CylinderGeometry(0.115, 0.108, 0.032, 40), bunM, 0.016);
  // patty to 0.062 (r 0.118)
  add(new THREE.CylinderGeometry(0.118, 0.118, 0.03, 40), mat("#5a3220", { roughness: 0.85 }), 0.047);
  // cheese: a square turned 45 degrees (side 0.19: corners at r 0.134), its 4 corners droop 0.02
  const cg = new THREE.PlaneGeometry(0.172, 0.172, 12, 12); cg.rotateX(-Math.PI / 2); cg.rotateY(Math.PI / 4);
  const cp = cg.attributes.position;
  for (let i = 0; i < cp.count; i++) { const r = Math.hypot(cp.getX(i), cp.getZ(i)), d = clamp((r - 0.1) / 0.022); cp.setY(i, 0.0685 - 0.02 * d * d); }
  cg.computeVertexNormals();
  const cheese = add(cg, mat("#ffc933", { roughness: 0.4, side: THREE.DoubleSide }), 0); cheese.castShadow = false;
  // tomato 0.070..0.082
  add(new THREE.CylinderGeometry(0.112, 0.112, 0.012, 40), mat("#d8452e", { roughness: 0.45 }), 0.076);
  // lettuce 0.082..0.094: a wavy frill 0.012 past the bun (r up to 0.127)
  const lg = new THREE.CylinderGeometry(1, 1, 0.012, 56, 1), lp = lg.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < lp.count; i++) {
    v.fromBufferAttribute(lp, i); const a = Math.atan2(v.z, v.x), r = 0.113 + 0.014 * (0.5 + 0.5 * Math.sin(a * 9)) * (0.75 + 0.25 * Math.sin(a * 4 + 1));
    lp.setXYZ(i, Math.cos(a) * r * (Math.hypot(v.x, v.z) > 0.5 ? 1 : 0.6), v.y + 0.003 * Math.sin(a * 9 + 1) * (v.y > 0 ? 1 : 0.5), Math.sin(a) * r * (Math.hypot(v.x, v.z) > 0.5 ? 1 : 0.6));
  }
  lg.computeVertexNormals();
  add(lg, mat("#6fb23a", { roughness: 0.6, side: THREE.DoubleSide }), 0.088);
  // bun top 0.094..0.155: a dome, r 0.115 wide, 0.061 tall
  const dome = mesh(new THREE.SphereGeometry(1, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2), topM, parent, 0, 0.094, 0); dome.scale.set(0.115, 0.061, 0.115);
  const rim = mesh(new THREE.CylinderGeometry(0.115, 0.113, 0.006, 40), topM, parent, 0, 0.097, 0); void rim;
  // 16 seeds 0.012 x 0.006 `#f6e6b8` on the upper dome
  const seedM = mat("#f6e6b8", { roughness: 0.5 }); seedM.userData.noOutline = true;
  for (let i = 0; i < 16; i++) {
    const phi = 0.12 + 0.95 * Math.sqrt((i + 0.5) / 16), a = i * 2.399 + rnd() * 0.3;       // phi from the top
    const nx = Math.sin(phi) * Math.cos(a), nz = Math.sin(phi) * Math.sin(a), ny = Math.cos(phi);
    const sd = mesh(new THREE.SphereGeometry(0.5, 8, 6), seedM, parent, nx * 0.115 * 1.005, 0.094 + ny * 0.061 * 1.005, nz * 0.115 * 1.005);
    sd.scale.set(0.012, 0.006, 0.006); sd.castShadow = false;
    sd.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(nx / 0.115, ny / 0.061, nz / 0.115).normalize());
    sd.rotateY(rnd() * 3);
  }
}

// ---- the fog texture --------------------------------------------------------------------------------------------
const FW = 512, FH = 790, PXM = FW / 0.68;                          // px per metre
const fx = (z) => (z - FOODHOME.glass.z0) * PXM, fy = (y) => (FOODHOME.glass.y1 - y) * PXM;

function fogTexture() {
  const rnd = rng(31);
  return canvasTex(FW, FH, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    // the edge band: alpha 0.25 everywhere, then the milky field alpha 0.62 inside, its boundary on 7 uneven lobes about 0.08 m in
    g.fillStyle = "rgba(230,238,242,0.25)"; g.fillRect(0, 0, w, h);
    const inner = new THREE.Vector2(); void inner;
    const cx = w / 2, cy = h / 2, ph = 0.7, pts = [];
    for (let i = 0; i < 160; i++) {
      const a = (i / 160) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), inset = 0.08 * PXM * (0.8 + 0.4 * (0.5 + 0.5 * Math.sin(7 * a + ph)) * (0.65 + 0.35 * Math.sin(3 * a + 1.9)));
      const ex = (w / 2 - inset), ey = (h / 2 - inset);
      pts.push([cx + ex * Math.sign(ca) * Math.abs(ca) ** (2 / 6), cy + ey * Math.sign(sa) * Math.abs(sa) ** (2 / 6)]);
    }
    g.save(); g.filter = "blur(16px)"; g.fillStyle = "rgba(230,238,242,0.493)";   // 0.25 under it, so 0.62 on top
    g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); g.restore();
    // a few soft uneven patches in the fog (thicker where nobody wiped)
    for (let i = 0; i < 7; i++) { const x = rnd() * w, y = rnd() * h, r = 40 + rnd() * 70; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(240,246,248,0.12)"); gr.addColorStop(1, "rgba(240,246,248,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    // the porthole: the sleeve's oval, 0.34 x 0.38 at z -0.95, y 1.30; alpha 0.15 (erase 0.758 of 0.62), feather 0.06
    g.save(); g.globalCompositeOperation = "destination-out"; g.filter = "blur(13px)"; g.fillStyle = "rgba(0,0,0,0.758)";
    g.beginPath(); g.ellipse(fx(-0.95), fy(1.3), 0.17 * PXM, 0.19 * PXM, 0, 0, Math.PI * 2); g.fill(); g.restore();
    // 26 drops (r 0.004..0.009), 6 with a run 0.03..0.07 below
    for (let i = 0; i < 26; i++) {
      const r = (0.004 + 0.005 * rnd()) * PXM, x = 30 + rnd() * (w - 60), y = 30 + rnd() * (h - 60);
      if (i < 6) { const run = (0.03 + 0.04 * rnd()) * PXM; g.strokeStyle = "rgba(244,251,255,0.32)"; g.lineWidth = r * 0.8; g.lineCap = "round"; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 3, y + run); g.stroke(); }
      g.fillStyle = "rgba(244,251,255,0.92)"; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "rgba(110,140,160,0.55)"; g.lineWidth = Math.max(1, r * 0.25); g.beginPath(); g.arc(x, y, r * 0.9, 0.2, 1.7); g.stroke();
      g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, Math.max(1, r * 0.28), 0, Math.PI * 2); g.fill();
    }
  });
}

export const FOODHOME_KINDS = {
  wrapburger(P) {
    const food = new THREE.Group(); P.whole.add(food); buildFood(food);
    const paperG = new THREE.Group(); P.whole.add(paperG);
    const tex = paperTexture(); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    const paperM = mat("#ffffff", { map: tex, roughness: 0.85, side: THREE.DoubleSide });
    const first = P.spec.wrap ?? 1; let last = first; buildPaper(paperG, first, paperM);
    return {
      grip: 0.05,
      apply(ps) { const w = P.spec.wrap == null ? 1 : ps.wrap ?? P.spec.wrap; if (w !== last) { last = w; buildPaper(paperG, w, paperM); } },
    };
  },

  fogglass(P) {
    const G = FOODHOME.glass, PW = G.z1 - G.z0, PH = G.y1 - G.y0, zc = (G.z0 + G.z1) / 2, yc = (G.y0 + G.y1) / 2, X = G.x;
    const pane = (geo, m, dx) => { const o = new THREE.Mesh(geo, m); o.rotation.y = -Math.PI / 2; o.position.set(X + dx, yc, zc); P.whole.add(o); return o; };
    if (P.spec.opaque) {
      // the fallback: an opaque pane with the porthole cut out as a real hole
      const sh = new THREE.Shape(); sh.moveTo(-PW / 2, -PH / 2); sh.lineTo(PW / 2, -PH / 2); sh.lineTo(PW / 2, PH / 2); sh.lineTo(-PW / 2, PH / 2); sh.closePath();
      // (the oval reaches 0.02 past the pane's edge at z -1.10: its points are clamped inside the rectangle)
      const hole = new THREE.Path(), hp = [];
      for (let i = 0; i < 48; i++) { const a = -(i / 48) * Math.PI * 2; hp.push([Math.max(-PW / 2 + 0.004, -0.95 - zc + 0.17 * Math.cos(a)), 1.3 - yc + 0.19 * Math.sin(a)]); }
      hp.forEach(([x, y], i) => (i ? hole.lineTo(x, y) : hole.moveTo(x, y))); hole.closePath(); sh.holes.push(hole);
      const op = pane(new THREE.ShapeGeometry(sh, 24), mat("#cfdbe2", { roughness: 0.6, side: THREE.DoubleSide }), -0.002); op.castShadow = false; op.material.userData.noOutline = true;
    }
    const glass = new THREE.MeshStandardMaterial({ color: "#d8eef8", roughness: 0.08, transparent: true, opacity: 0.1, depthWrite: false }); glass.userData.noOutline = true;
    pane(new THREE.PlaneGeometry(PW, PH), glass, 0).renderOrder = 3;
    if (!P.spec.opaque) {
      const fogM = new THREE.MeshBasicMaterial({ map: fogTexture(), transparent: true, opacity: 1, depthWrite: false, side: THREE.DoubleSide }); fogM.userData.noOutline = true;
      pane(new THREE.PlaneGeometry(PW, PH), fogM, -0.002).renderOrder = 4;
    }
    // the marks: each stroke its own mesh, pivot at its top, flat (0.0006 thick), round ends, a slight bend
    const ink = basic({ color: "#27313f", side: THREE.DoubleSide }), beadM = basic({ color: "#dcecf5" }), runM = basic({ color: "#dcecf5", transparent: true, opacity: 0.4, depthWrite: false });
    const XM = X - 0.002 - 0.0015, strokes = FOODHOME.strokes.map((S) => {
      const r = 0.01, cg = new THREE.CapsuleGeometry(r, S.len - 2 * r, 4, 14); cg.translate(0, -S.len / 2, 0); cg.scale(0.03, 1, 1);
      const cp = cg.attributes.position; for (let i = 0; i < cp.count; i++) cp.setZ(i, cp.getZ(i) + S.bend * Math.sin(Math.PI * clamp(-cp.getY(i) / S.len)));
      const pv = new THREE.Group(), la = rad(S.lean); pv.position.set(XM, S.top, S.z + (S.len / 2) * Math.sin(la)); pv.rotation.x = la;
      const m = new THREE.Mesh(cg, ink); m.castShadow = false; m.frustumCulled = false; pv.add(m); P.whole.add(pv);
      // the end of the stroke: its bead and its run (drawn once the stroke is complete)
      const ez = S.z + (S.len / 2) * Math.sin(la) - S.len * Math.sin(la), ey = S.top - S.len * Math.cos(la);
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.008, 10, 8), beadM); bead.scale.set(0.12, 1, 1); bead.position.set(XM - 0.0003, ey - 0.004, ez); bead.castShadow = false; P.whole.add(bead);
      const run = new THREE.Mesh(new THREE.CapsuleGeometry(0.0028, 0.034, 3, 6), runM); run.scale.set(0.1, 1, 1); run.position.set(XM - 0.0003, ey - 0.012 - 0.02, ez); run.castShadow = false; run.renderOrder = 5; P.whole.add(run);
      return { pv, bead, run, S, la };
    });
    const tip = new THREE.Object3D(); P.whole.add(tip);
    return {
      grip: 0, anchors: { tip },
      apply(ps) {
        const marks = clamp(ps.marks ?? P.spec.marks ?? 0, 0, 4); let cur = 0;
        strokes.forEach((s, i) => {
          const k = clamp(marks - i); s.pv.visible = k > 0.001; s.pv.scale.y = Math.max(k, 0.001);
          s.bead.visible = s.run.visible = k > 0.999; if (k > 0.001) cur = i;
        });
        const s = strokes[cur], k = clamp(marks - cur), L = s.S.len * k;
        tip.position.set(X + 0.01, s.S.top - L * Math.cos(s.la), s.S.z + (s.S.len / 2) * Math.sin(s.la) - L * Math.sin(s.la));
      },
    };
  },

  cablight(P) {
    const frame = mat("#d9d0bb", { roughness: 0.7 }), off = new THREE.Color("#b7ad96"), on = new THREE.Color("#fff1cf");
    mesh(new THREE.BoxGeometry(0.116, 0.008, 0.076), frame, P.whole, 0, 0.004, 0).castShadow = false;
    const lensM = basic({ color: "#b7ad96" }), lens = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.06), lensM); lens.rotation.x = Math.PI / 2; lens.position.y = -0.0005; P.whole.add(lens);
    const light = new THREE.PointLight("#ffe6c0", 0, 2.4, 1.3); light.position.set(0, -0.12, 0); P.whole.add(light);
    return {
      grip: 0,
      apply(ps) { const lit = clamp(ps.lit ?? P.spec.lit ?? 0); lensM.color.copy(off).lerp(on, lit); light.intensity = (P.spec.lamp ?? 1.1) * lit; light.visible = lit > 0.001; },
    };
  },

  sweatbead(P) {
    // a teardrop, tip up: a round bottom (r 0.01, centre y -0.005) and a tapering top to y +0.015
    const pr = [];
    for (let a = 0; a <= 8; a++) { const t = (a / 8) * Math.PI / 2; pr.push(new THREE.Vector2(Math.sin(t) * 0.01, -0.005 - Math.cos(t) * 0.01)); }
    for (let s = 1; s <= 8; s++) { const t = s / 8; pr.push(new THREE.Vector2(0.01 * Math.pow(1 - t, 1.12), -0.005 + 0.02 * t)); }
    pr[pr.length - 1].x = 0.0003;
    const beadM = new THREE.MeshStandardMaterial({ color: "#d4ecff", roughness: 0.12, metalness: 0 }); beadM.userData.noOutline = true;
    const b = new THREE.Mesh(new THREE.LatheGeometry(pr, 16), beadM); b.scale.set(1, 1, 0.6); b.castShadow = false; P.whole.add(b);
    const hi = new THREE.Mesh(new THREE.SphereGeometry(0.003, 8, 6), basic({ color: "#ffffff" })); hi.scale.set(0.8, 1.1, 0.5); hi.position.set(-0.0035, -0.003, 0.0062); P.whole.add(hi);
    return { grip: 0 };
  },
};
