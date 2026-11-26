import * as THREE from "three";
import { clamp } from "./util.js";
import { mat, mesh, canvasTex } from "./props-trend.js";

// Kid vs Dad 04 "Dad jokes at the waiter" (25 Nov 2026): the family restaurant's furniture. Potato furniture is LOW (a seat
// at 0.24, a table top at 0.386) so a seated dad's crown sits under the standing waiter's. Sizes: storyboards/series/
// kid-vs-dad/04-waiter-jokes/DESIGN.md sections 1, 2 and 7. Metres; the prop's `y` is its bottom (the floor).
//   roundtable  a round wooden table under a white cloth, origin: the floor under its middle. No stripes, no checks.
//               spec: r 0.45 (the cloth's radius; the wood top is 0.02 smaller), h 0.38 (the wood top's upper face; the
//               cloth top is at h + 0.006), drape 0.22 (the skirt hangs this far below the cloth top, flaring 0.02, 14
//               soft folds, a wavy hem, one stitch line 0.012 above it), legs true (4 round legs at +-0.6 r; false for
//               the cheat table of panel 13: { r: 0.80, h: 1.30, drape: 0.68, legs: false }), dress false | [x, z]
//               (x, z on the cloth from the table's middle: a bud vase with 5 flowers, 0.15 tall, and, 0.09 to its +x
//               side, a salt shaker with the pepper shaker 0.033 toward -z of it). Grip: h + 0.006 (the cloth top).
//               Solid: the wood top and legs (the director gives qa/clear its footprint, round, `r`). The cloth is ghost.
//   hoopchair   a wooden chair with a round seat and a bent hoop back; origin: the floor under the seat's middle; it
//               faces +z (rotate with `rot`), the hoop is behind it at -z. spec: pad "#7d3a44" (the seat pad's colour).
//               Seat top 0.24 (sit with `height: 0.24`), 0.42 wide, hoop top at 0.64. A sitter's body middle is
//               0.5 Dp - 0.20 in front of the seat's middle (Tato 0.02, the reporter 0.14, the dad 0.18).
//               Grip: 0.24. Solid.
//   dinecarpet  the dining room's carpet: a thin sheet 0.002 above the floor, spec w 8.3, d 7.4, centred on the ORIGIN (the
//               director places it at (0.85, 0.7)); burgundy with a 0.36 diamond lattice, a four-petal mark at every second
//               crossing and 14 worn patches, each placed once. A lattice crossing (and a mark) lies at the origin.
//               `dim` 0..1 (spec, or a prop tween) multiplies every colour by 1 - 0.7 dim (panel 11 night copy). Ghost.
// No hands hold any of these. All numbers are fixed tables: no Math.random, no clock.
export const EATERY = { top: 0.386, seat: 0.24 };
export const EATERY_GRIPS = {};

const CLOTH = "#f7f4ec", CLOTH_IN = "#cfc8bd", FOLD = "#dcd6ca", STITCH = "#e6e0d4";
const D2R = Math.PI / 180;
// the cloth's 14 soft folds: angle (degrees), depth (mm), fixed once
const FOLDS = [[6, 14], [31, 9], [58, 20], [79, 11], [104, 17], [133, 8], [151, 22], [178, 12], [203, 16], [229, 10], [247, 19], [276, 13], [301, 21], [334, 9]];

// the skirt of the cloth: a surface from the rim (v 0) to the hem (v 1), flared 0.02, grooved by the folds, hem wave +-0.008.
// Vertex colours go from the cloth white to the fold shade down each fold. Returns { geo, hemY(theta), at(theta, v) }.
function skirtGeo(r, top, drape) {
  const NA = 144, NV = 8;
  const pos = [], col = [], idx = [], cw = new THREE.Color(CLOTH), cf = new THREE.Color(FOLD), cc = new THREE.Color();
  const bump = (th) => {   // the fold groove at angle th: depth in metres (>= 0) and its 0..1 weight
    let d = 0, k = 0;
    for (const [a, mm] of FOLDS) {
      let dd = (th / D2R - a) % 360; if (dd > 180) dd -= 360; if (dd < -180) dd += 360;
      const g = Math.exp(-((dd / 4.5) ** 2)); d += g * mm * 0.001; k = Math.max(k, g);
    }
    return [d, k];
  };
  const at = (th, v) => {
    const [d] = bump(th), wave = 0.008 * Math.sin(5 * th + 0.7) * v * v;
    const rr = r + 0.02 * v - d * (0.15 + 0.85 * v);
    return [rr * Math.sin(th), top - v * drape + wave, rr * Math.cos(th)];
  };
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NA; i++) {
    const th = (i / NA) * Math.PI * 2, v = j / NV, [, k] = bump(th);
    pos.push(...at(th, v)); cc.copy(cw).lerp(cf, k * (0.2 + 0.8 * v)); col.push(cc.r, cc.g, cc.b);
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NA; i++) {
    const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx);
  geo.computeVertexNormals();
  return { geo, at };
}

// a ribbon along the cloth 0.012 above the hem: the stitch line (a flat strip 3 mm tall, 1.5 mm out of the cloth)
function stitchGeo(at, drape) {
  const NA = 144, pos = [], idx = [], v = 1 - 0.012 / drape;
  for (let i = 0; i <= NA; i++) {
    const th = (i / NA) * Math.PI * 2, p = at(th, v), ox = Math.sin(th) * 0.0015, oz = Math.cos(th) * 0.0015;
    pos.push(p[0] + ox, p[1] + 0.0015, p[2] + oz, p[0] + ox, p[1] - 0.0015, p[2] + oz);
  }
  for (let i = 0; i < NA; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  return geo;
}

// the bud vase, its five flowers and the two shakers, standing on the cloth at (x, z); `y0` is the cloth top
function dressTable(parent, x, z, y0) {
  const g = new THREE.Group(); g.position.set(x, y0, z); parent.add(g);
  const glass = mat("#d9eef0", { roughness: 0.18 }), stem = mat("#5f9a45", { roughness: 0.7, side: THREE.DoubleSide }), leafM = mat("#4f8a3a", { roughness: 0.7, side: THREE.DoubleSide });
  // vase: foot r 0.022, belly 0.030, neck 0.014, 0.085 tall, solid glass (no see-through)
  const prof = [[0.001, 0], [0.022, 0], [0.022, 0.006], [0.028, 0.02], [0.030, 0.034], [0.026, 0.052], [0.016, 0.07], [0.014, 0.078], [0.016, 0.085], [0.011, 0.085], [0.001, 0.083]].map(([a, b]) => new THREE.Vector2(a, b));
  const vase = mesh(new THREE.LatheGeometry(prof, 20), glass, g); vase.material.side = THREE.DoubleSide;
  // five flowers: heads at fixed spots (relative to the vase's middle; the tallest 0.15 up with its petals)
  const heads = [[0, 0.139, 0, "#f08fb0"], [-0.034, 0.124, 0.008, "#f08fb0"], [0.033, 0.12, -0.012, "#f6b3c8"], [0.012, 0.116, 0.036, "#f08fb0"], [-0.018, 0.112, -0.032, "#fbf3ee"]];
  const ZUP = new THREE.Vector3(0, 0, 1), base = new THREE.Vector3(0, 0.082, 0);
  const petalG = new THREE.SphereGeometry(1, 10, 8), centreM = mat("#f2c230", { roughness: 0.6 });
  heads.forEach(([hx, hy, hz, col], n) => {
    const head = new THREE.Vector3(hx, hy, hz), dir = head.clone().sub(base).normalize(), len = head.distanceTo(base);
    const s = mesh(new THREE.CylinderGeometry(0.0022, 0.0028, len, 5), stem, g, (hx + base.x) / 2, (hy + base.y) / 2, (hz + base.z) / 2);
    s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); s.castShadow = false;
    const f = new THREE.Group(); f.position.copy(head); f.quaternion.setFromUnitVectors(ZUP, dir.clone().lerp(new THREE.Vector3(0, 1, 0), 0.5).normalize()); g.add(f);
    const pm = mat(col, { roughness: 0.7 });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + n * 0.5, p = mesh(petalG, pm, f, Math.cos(a) * 0.0105, Math.sin(a) * 0.0105, 0);
      p.scale.set(0.0085, 0.0085, 0.0035); p.castShadow = false;
    }
    const c = mesh(petalG, centreM, f, 0, 0, 0.0025); c.scale.set(0.0058, 0.0058, 0.004); c.castShadow = false;
  });
  // three leaves on short stems low on the bunch
  [[-0.026, 0.1, 0.012, -0.9], [0.026, 0.098, 0.014, 0.9], [0.004, 0.096, -0.026, 2.6]].forEach(([lx, ly, lz, ry], i) => {
    const e = new THREE.Vector3(lx, ly, lz), dir = e.clone().sub(base).normalize();
    const s = mesh(new THREE.CylinderGeometry(0.0018, 0.0022, e.distanceTo(base), 5), stem, g, lx / 2, (ly + base.y) / 2, lz / 2);
    s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); s.castShadow = false;
    const lf = mesh(new THREE.SphereGeometry(1, 10, 6), leafM, g, lx, ly + 0.004, lz); lf.scale.set(0.011, 0.0016, 0.022); lf.rotation.set(0.2 * (i - 1), ry, 0.3 * (i - 1)); lf.castShadow = false;
  });
  // salt (white, steel cap) 0.09 to the vase's +x, pepper (brown) 0.033 toward -z of it: r 0.014, 0.05 tall
  const steel = mat("#b9c0c6", { roughness: 0.3, metalness: 0.6 });
  [[0.09, 0, "#eef2f2"], [0.09, -0.033, "#5a4a3a"]].forEach(([sx, sz, c]) => {
    mesh(new THREE.CylinderGeometry(0.014, 0.0145, 0.04, 14), mat(c, { roughness: 0.4 }), g, sx, 0.02, sz);
    mesh(new THREE.CylinderGeometry(0.0125, 0.014, 0.012, 14), steel, g, sx, 0.046, sz);
    mesh(new THREE.SphereGeometry(0.0035, 6, 4), steel, g, sx, 0.0525, sz).castShadow = false;
  });
  return g;
}

// the carpet's tile: 0.36 m square, a diamond lattice (lines at 45 degrees through the corners and the middle), a
// four-petal mark at the corners (every second crossing), drawn so the repeat is seamless
function carpetTile(dim = 0) {
  void dim;
  return canvasTex(256, 256, (g, w, h) => {
    const k = w / 0.36;   // pixels per metre
    g.fillStyle = "#7b4650"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#8f5a66"; g.lineWidth = 0.012 * k; g.lineCap = "butt";
    for (const [x0, y0, x1, y1] of [[-0.1, -0.1, 1.1, 1.1], [-0.1, 1.1, 1.1, -0.1], [-1.1, -0.1, 0.1, 1.1], [0.9, -0.1, 2.1, 1.1], [-1.1, 1.1, 0.1, -0.1], [0.9, 1.1, 2.1, -0.1]]) {
      g.beginPath(); g.moveTo(x0 * w, y0 * h); g.lineTo(x1 * w, y1 * h); g.stroke();
    }
    g.fillStyle = "#9a6672";
    for (const [cx, cy] of [[0, 0], [w, 0], [0, h], [w, h]]) {
      for (let i = 0; i < 4; i++) {
        g.save(); g.translate(cx, cy); g.rotate((i * Math.PI) / 2); g.beginPath(); g.ellipse(0.015 * k, 0, 0.015 * k, 0.0085 * k, 0, 0, Math.PI * 2); g.fill(); g.restore();
      }
    }
  });
}
// the 14 worn patches, each once: x, z (metres from the carpet's middle), half-width, half-depth, turn (degrees)
const WORN = [[-1.9, 1.3, 0.36, 0.22, 20], [-0.6, 0.9, 0.28, 0.18, -35], [0.4, 1.6, 0.42, 0.2, 10], [1.7, 0.4, 0.3, 0.2, 60], [2.6, -0.8, 0.34, 0.18, -15], [-2.9, -0.4, 0.3, 0.16, 80],
  [-1.2, -1.5, 0.4, 0.22, -50], [0.1, -0.6, 0.26, 0.16, 25], [1.0, -1.9, 0.32, 0.2, 0], [3.1, 1.9, 0.28, 0.18, 40], [-3.4, 2.4, 0.3, 0.2, -20], [-0.2, 2.8, 0.38, 0.18, 70], [2.2, 2.7, 0.3, 0.16, -65], [-2.2, -2.6, 0.34, 0.2, 35]];

export const EATERY_KINDS = {
  roundtable(P) {
    const S = P.spec, R = S.r ?? 0.45, H = S.h ?? 0.38, DR = S.drape ?? 0.22, legs = S.legs ?? true;
    const wood = mat("#8a5a36", { roughness: 0.6 }), under = mat("#6b4326", { roughness: 0.7 }), leg = mat("#7a4a28", { roughness: 0.6 });
    wood.userData.lookRole = under.userData.lookRole = leg.userData.lookRole = "wood";
    // the wood top: disc r - 0.02, 0.035 thick, its underside drawn (the cloth's hem hides it from the side)
    mesh(new THREE.CylinderGeometry(R - 0.02, R - 0.02, 0.035, 40), [wood, wood, under], P.whole, 0, H - 0.0175, 0);
    if (legs) for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.CylinderGeometry(0.02, 0.02, H - 0.035, 12), leg, P.whole, sx * 0.6 * R, (H - 0.035) / 2, sz * 0.6 * R);
    // the cloth: 0.006 thick, top at h + 0.006, white; its inside (seen from below, through the hem) a shade darker
    const top = H + 0.006, clothM = mat(CLOTH, { roughness: 0.85 }), inM = mat(CLOTH_IN, { roughness: 0.9, side: THREE.BackSide });
    const disc = mesh(new THREE.CylinderGeometry(R, R, 0.006, 48), [clothM, clothM, mat(CLOTH_IN, { roughness: 0.9 })], P.whole, 0, H + 0.003, 0); disc.castShadow = false;
    const { geo, at } = skirtGeo(R, top, DR);
    const skirtM = mat("#ffffff", { roughness: 0.85, vertexColors: true });
    const sk = mesh(geo, skirtM, P.whole); sk.castShadow = false;
    const sk2 = mesh(geo, inM, P.whole); sk2.castShadow = false;
    const st = mesh(stitchGeo(at, DR), mat(STITCH, { roughness: 0.9, side: THREE.DoubleSide }), P.whole); st.castShadow = false;
    if (Array.isArray(S.dress)) dressTable(P.whole, S.dress[0], S.dress[1], top);
    return { grip: top };
  },

  hoopchair(P) {
    const wood = mat("#8a5a36", { roughness: 0.6 }), pad = mat(P.spec.pad ?? "#7d3a44", { roughness: 0.8 }), leg = mat("#7a4a28", { roughness: 0.6 });
    wood.userData.lookRole = leg.userData.lookRole = "wood";
    // seat: the wood ring r 0.21 and the pad r 0.17, 0.02 thick, top at 0.24
    mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.03, 36), wood, P.whole, 0, 0.215, 0);
    mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 32), pad, P.whole, 0, 0.23, 0);
    // legs: r 0.016, feet at (+-0.19, +-0.19), tops under the ring's rim (+-0.15, +-0.15); a stretcher ring where they cross y 0.09
    const UP = new THREE.Vector3(0, 1, 0), topY = 0.2, T = (0.2 - 0.09) / 0.2;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const a = new THREE.Vector3(sx * 0.15, topY, sz * 0.15), b = new THREE.Vector3(sx * 0.19, 0, sz * 0.19), d = a.clone().sub(b);
      const l = mesh(new THREE.CylinderGeometry(0.016, 0.016, d.length(), 10), leg, P.whole, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
      l.quaternion.setFromUnitVectors(UP, d.clone().normalize());
    }
    const sr = Math.hypot(0.15 + 0.04 * T, 0.15 + 0.04 * T);   // the legs' distance from the middle at y 0.09
    const ring = mesh(new THREE.TorusGeometry(sr, 0.009, 6, 36), leg, P.whole, 0, 0.09, 0); ring.rotation.x = Math.PI / 2;
    // the back: a bent hoop (tube r 0.014) from (+-0.17, 0.22, -0.20) to its top (0, 0.64, -0.26), a second one 0.06 inside it
    // (narrower by 0.06 each side, top 0.56), and one highlight line along the outer hoop's upper front
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const hoop = (pts, r, m) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5), 48, r, 8), m, P.whole);
    const outer = [V(-0.17, 0.22, -0.2), V(-0.18, 0.4, -0.222), V(-0.125, 0.56, -0.248), V(0, 0.64, -0.26), V(0.125, 0.56, -0.248), V(0.18, 0.4, -0.222), V(0.17, 0.22, -0.2)];
    const inner = [V(-0.11, 0.22, -0.2), V(-0.12, 0.36, -0.218), V(-0.08, 0.5, -0.238), V(0, 0.56, -0.25), V(0.08, 0.5, -0.238), V(0.12, 0.36, -0.218), V(0.11, 0.22, -0.2)];
    hoop(outer, 0.014, wood); hoop(inner, 0.014, wood);
    const hl = [V(-0.176, 0.42, -0.214), V(-0.126, 0.56, -0.24), V(0, 0.64, -0.252), V(0.126, 0.56, -0.24), V(0.176, 0.42, -0.214)];
    const hm = mat("#b07a4c", { roughness: 0.5 }); hoop(hl, 0.0035, hm).castShadow = false;
    // caps on the hoop's feet, so they end in the seat's rim and not in the air
    for (const sx of [-1, 1]) mesh(new THREE.SphereGeometry(0.014, 8, 6), wood, P.whole, sx * 0.17, 0.22, -0.2);
    return { grip: EATERY.seat };
  },

  dinecarpet(P) {
    const S = P.spec, W = S.w ?? 8.3, D = S.d ?? 7.4, TILE = 0.36;
    const tex = carpetTile(); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    const rx = W / TILE, rz = D / TILE; tex.repeat.set(rx, rz);
    tex.offset.set((((-rx / 2) % 1) + 1) % 1, (((-rz / 2) % 1) + 1) % 1);   // a lattice crossing (with a mark) at the middle
    const sheetM = mat("#ffffff", { map: tex, roughness: 0.95 });
    const sheet = mesh(new THREE.PlaneGeometry(W, D), sheetM, P.whole, 0, 0.002, 0); sheet.rotation.x = -Math.PI / 2; sheet.castShadow = false;
    // worn patches: soft dark ellipses, a hair above the sheet (polygon offset, no depth write)
    const soft = canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(0.6, "rgba(255,255,255,0.55)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const wornC = new THREE.Color("#6c3d47"), patchMs = [], pg = new THREE.PlaneGeometry(1, 1);
    for (const [x, z, a, b, rot] of WORN) {
      const m = new THREE.MeshStandardMaterial({ color: wornC, map: soft, transparent: true, depthWrite: false, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      const p = mesh(pg, m, P.whole, x, 0.003, z); p.rotation.set(-Math.PI / 2, 0, (rot * Math.PI) / 180); p.scale.set(a * 2, b * 2, 1); p.castShadow = false; patchMs.push(m);
    }
    let last = -1;
    return {
      grip: 0.002,
      apply(ps) {
        const d = clamp(ps.dim ?? S.dim ?? 0), k = 1 - 0.7 * d;
        if (k === last) return; last = k;
        sheetM.color.setScalar(k);
        for (const m of patchMs) m.color.copy(wornC).multiplyScalar(k);
      },
    };
  },
};
