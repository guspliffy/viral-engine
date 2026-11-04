import * as THREE from "three";
import { clamp, rng } from "./util.js";
import { radialTexture } from "./geo.js";

// Props for "Then I'm a Zombie Too" (Jonny's eight-panel storyboard, 1 Nov 2026): a rainy ruined street at dusk and the
// one soggy fry.
//   soggyfry    one limp chip, spec.len long (default 0.16 m), square, golden with paler cut ends and an oily shine.
//               Origin: its bottom end; it rises along +y and its top part flops over toward +x by `limp` (0 straight,
//               1 bent about 100 degrees), with one oily drop hanging from the tip. Held with grips.thin (from 0.3).
//   rubble      broken concrete lying on the street: spec.items [[x, z, size, kind?, rot?], ...] where kind is "chunk"
//               (a lumpy block), "slab" (a flat broken piece of wall or pavement), "rebar" (bent rusty bars) or
//               "brick" (a few small bricks). Grey concrete, darker where it's wet. Solid.
//   ruinwall    a broken concrete wall stub (spec.w wide, spec.h high, spec.t thick, origin its bottom centre, facing +z)
//               with a jagged top, one or two dark window holes and rusty bars sticking out. Solid.
//   wetstreet   the wet street's surface: a big flat decal (spec.w x spec.d m, origin its centre) of dark glossy
//               asphalt patches and puddles that mirror the dusk glow (spec.glow colour) and the cold sky (spec.sky).
//               Lies 3 mm over the floor. See-through for the checks.
//   ripples     rain rings on the wet street and in the puddles: spec.n rings in a box [[x0, z0], [x1, z1]], each
//               growing and fading, looped from the clip time. `on` 0..1.
//   fogveil     drifting soft fog (sprites, so it reads from every camera): spec.n puffs in a box
//               [[x0, y0, z0], [x1, y1, z1]], spec.size m, spec.color, `on` 0..1 (its strength), drifting along
//               spec.drift [dx, dz] m/s. See-through for the checks.
// Fog, rings, the street decal and the fry's drop are see-through (steam) for the contact and caption checks.
const rr = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const steamy = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.userData.steam = true; return o; };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const seeThrough = (map, o = {}) => { const m = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false, ...o }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; return m; };

// a lumpy block: an icosahedron pushed about by a seeded noise, flattened a little
function lump(r, seed, flat = 0.7, rough = 0.35) {
  const g = new THREE.IcosahedronGeometry(r, 1), p = g.attributes.position, v = new THREE.Vector3(), R = rng(seed);
  const k = [R(), R(), R()].map((x) => 2 + x * 3);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = 1 + rough * (Math.sin(v.x * k[0] / r + seed) * Math.sin(v.y * k[1] / r) * Math.sin(v.z * k[2] / r + 1.3));
    p.setXYZ(i, v.x * n, Math.max(-r * 0.15, v.y * n * flat), v.z * n);
  }
  g.computeVertexNormals();
  return g.toNonIndexed();
}

export const ZOMBIE_KINDS = {
  soggyfry(P) {
    const S = P.spec, L = S.len ?? 0.16, r = S.r ?? 0.011;
    const fry = mat(S.color || "#e9b640", { roughness: 0.35 });
    const ends = mat("#f6dc8a", { roughness: 0.5 });
    const g = new THREE.Group(); P.whole.add(g);
    const body = mesh(new THREE.BufferGeometry(), fry, g);
    const capA = mesh(new THREE.BoxGeometry(r * 1.9, 0.004, r * 1.9), ends, g);
    const capB = mesh(new THREE.BoxGeometry(r * 1.9, 0.004, r * 1.9), ends, g);
    const dropM = new THREE.MeshStandardMaterial({ color: "#f3d27a", roughness: 0.1, transparent: true, opacity: 0.8 }); dropM.userData.noOutline = true;
    const drop = steamy(new THREE.Mesh(new THREE.SphereGeometry(0.006, 10, 8), dropM), 2); drop.scale.y = 1.5; g.add(drop);
    let last = null;
    const shape = (limp) => {
      // the bottom 40 % stays straight (the pinch), the rest bends over in an even arc
      const straight = 0.4 * L, bend = Math.max(1e-3, limp * 1.75), arcL = L - straight, R = arcL / bend;
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const s = (i / 24) * L;
        if (s <= straight) pts.push(new THREE.Vector3(0, s, 0));
        else { const a = (s - straight) / R; pts.push(new THREE.Vector3(R * (1 - Math.cos(a)), straight + R * Math.sin(a), 0)); }
      }
      return new THREE.CatmullRomCurve3(pts);
    };
    return {
      grip: 0.3 * L,
      apply(ps, t) {
        const limp = clamp(ps.limp ?? S.limp ?? 0.8) + 0.04 * Math.sin((t || 0) * 2.3);   // a soft wobble
        const key = limp.toFixed(3);
        if (key !== last) {
          last = key; const c = shape(limp);
          body.geometry.dispose(); body.geometry = new THREE.TubeGeometry(c, 24, r, 4, false);
          body.geometry.rotateY(Math.PI / 4);   // tube corners: the square section sits flat to the camera
          const p1 = c.getPoint(1), tg = c.getTangent(1);
          capA.position.set(0, 0, 0);
          capB.position.copy(p1); capB.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tg);
          drop.position.set(p1.x + 0.002, p1.y - 0.01, p1.z);
        }
        drop.visible = (S.drop ?? 1) > 0;
      },
    };
  },

  rubble(P) {
    const R = rng(P.spec.seed ?? 31), con = mat(P.spec.color || "#5d626c", { roughness: 0.95 }), dark = mat("#43464f", { roughness: 0.9 });
    const rust = mat("#6a3b26", { roughness: 0.7, metalness: 0.3 }), brick = mat("#7a4a3c", { roughness: 0.9 });
    for (const [i, [x, z, size = 1, kind = "chunk", rot = 0]] of (P.spec.items || []).entries()) {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = (rot * Math.PI) / 180; P.whole.add(g);
      if (kind === "chunk") {
        const n = 1 + Math.floor(R() * 3);
        for (let k = 0; k < n; k++) { const s = (k ? 0.45 + R() * 0.3 : 1) * 0.12 * size; const o = mesh(lump(s, i * 7 + k, 0.65), k % 2 ? dark : con, g, (R() - 0.5) * 0.25 * size, s * 0.35, (R() - 0.5) * 0.2 * size); o.rotation.y = R() * 6; }
      } else if (kind === "slab") {
        const w = 0.42 * size, d = 0.3 * size, o = mesh(new THREE.BoxGeometry(w, 0.06 * size, d, 4, 1, 3), con, g, 0, 0.05 * size, 0);
        const p = o.geometry.attributes.position; for (let k = 0; k < p.count; k++) { const xx = p.getX(k), zz = p.getZ(k); if (Math.abs(xx) > w * 0.45 || Math.abs(zz) > d * 0.45) p.setXYZ(k, xx * (0.8 + 0.3 * rr(k + i)), p.getY(k) + (rr(k * 3 + i) - 0.5) * 0.02 * size, zz * (0.8 + 0.3 * rr(k * 5 + i))); }
        o.geometry.computeVertexNormals(); o.rotation.set((R() - 0.5) * 0.4, R() * 6, 0.25 + R() * 0.3);
      } else if (kind === "rebar") {
        for (let k = 0; k < 3; k++) {
          const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.01, 0), new THREE.Vector3(0.08 * size, 0.06 * size, (R() - 0.5) * 0.05), new THREE.Vector3(0.12 * size, 0.2 * size * (0.6 + R()), (R() - 0.5) * 0.1)]);
          const o = mesh(new THREE.TubeGeometry(c, 10, 0.006 * Math.max(1, size * 0.8), 5), rust, g, (k - 1) * 0.04, 0, (R() - 0.5) * 0.05); o.rotation.y = R() * 6;
        }
        mesh(lump(0.09 * size, i * 13, 0.6), con, g, 0, 0.03 * size, 0);
      } else {
        for (let k = 0; k < 4; k++) { const o = mesh(new THREE.BoxGeometry(0.1, 0.035, 0.05), brick, g, (R() - 0.5) * 0.3 * size, 0.018 + (k === 3 ? 0.035 : 0), (R() - 0.5) * 0.2 * size); o.rotation.set(0, R() * 6, (R() - 0.5) * 0.3); }
      }
    }
    return { grip: 0 };
  },

  ruinwall(P) {
    const S = P.spec, w = S.w ?? 1.6, h = S.h ?? 1.4, t = S.t ?? 0.18, R = rng(S.seed ?? 5);
    const con = mat(S.color || "#4f5560", { roughness: 0.95 }), face = mat(S.face || "#5c6370", { roughness: 0.9 });
    const rust = mat("#5c3424", { roughness: 0.7, metalness: 0.3 });
    // the outline: a jagged top (high on one side, broken down on the other), with window holes cut through
    const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0);
    const n = 9;
    for (let i = 0; i <= n; i++) { const x = w / 2 - (i / n) * w, k = i / n; sh.lineTo(x, h * (0.45 + 0.55 * k) * (0.82 + 0.3 * R()) - (i % 3 === 1 ? 0.12 * h : 0)); }
    sh.lineTo(-w / 2, 0);
    for (const [cx, cy, ww, hh] of S.holes || [[-w * 0.18, h * 0.5, w * 0.2, h * 0.22]]) {
      const hole = new THREE.Path(); hole.moveTo(cx - ww / 2, cy - hh / 2); hole.lineTo(cx + ww / 2, cy - hh / 2); hole.lineTo(cx + ww / 2, cy + hh / 2 - 0.02); hole.lineTo(cx - ww / 2, cy + hh / 2); hole.closePath(); sh.holes.push(hole);
    }
    const g = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 2 }); g.translate(0, 0, -t / 2);
    const wall = mesh(g, [face, con], P.whole);
    void wall;
    for (let i = 0; i < (S.bars ?? 3); i++) {
      const x = -w * 0.35 + R() * w * 0.4, y = h * (0.6 + R() * 0.25);
      const c = new THREE.CatmullRomCurve3([new THREE.Vector3(x, y - 0.1, 0), new THREE.Vector3(x + 0.02, y + 0.12, 0.02), new THREE.Vector3(x + 0.08 * (R() - 0.3), y + 0.28, 0.06 * R())]);
      mesh(new THREE.TubeGeometry(c, 8, 0.007, 5), rust, P.whole);
    }
    return { grip: 0 };
  },

  wetstreet(P) {
    const S = P.spec, W = S.w ?? 10, D = S.d ?? 10, cv = document.createElement("canvas"); cv.width = cv.height = 1024;
    const g = cv.getContext("2d"), R = rng(S.seed ?? 9), glow = S.glow || "#ff9a6a", sky = S.sky || "#7d8cab";
    g.clearRect(0, 0, 1024, 1024);
    // glossy dark patches (wet asphalt), then puddles: an ellipse of the sky colour with a warm streak where the glow lies
    for (let i = 0; i < 60; i++) { const x = R() * 1024, y = R() * 1024, rx = 30 + R() * 120, ry = rx * (0.3 + R() * 0.4); g.fillStyle = `rgba(20,24,34,${0.12 + R() * 0.12})`; g.beginPath(); g.ellipse(x, y, rx, ry, R() * 3, 0, 6.3); g.fill(); }
    for (const [px, pz, pr, pk] of S.puddles || []) {
      const cx = ((px / W) + 0.5) * 1024, cy = ((pz / D) + 0.5) * 1024, rx = (pr / W) * 1024, ry = rx * (pk ?? 0.55);
      const gr = g.createRadialGradient(cx, cy, 1, cx, cy, rx);
      gr.addColorStop(0, sky); gr.addColorStop(0.75, sky); gr.addColorStop(1, "rgba(60,68,90,0)");
      g.globalAlpha = 0.55; g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 6.3); g.fill();
      g.globalAlpha = 0.6; g.fillStyle = glow; g.beginPath(); g.ellipse(cx + rx * 0.1, cy - ry * 0.2, rx * 0.5, ry * 0.18, 0, 0, 6.3); g.fill();
      g.globalAlpha = 1;
    }
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const m = seeThrough(tex, { opacity: S.opacity ?? 0.9, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
    const o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(W, D), m), 1); o.rotation.x = -Math.PI / 2; o.position.y = 0.003; o.receiveShadow = false; P.whole.add(o);
    return { grip: 0 };
  },

  ripples(P) {
    const S = P.spec, [[x0, z0], [x1, z1]] = S.box || [[-2, -2], [2, 2]], n = S.n ?? 60;
    const cv = document.createElement("canvas"); cv.width = cv.height = 64; const g = cv.getContext("2d");
    g.strokeStyle = "rgba(220,232,255,0.9)"; g.lineWidth = 3; g.beginPath(); g.arc(32, 32, 28, 0, 6.3); g.stroke();
    const tex = new THREE.CanvasTexture(cv);
    const geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
    const rings = Array.from({ length: n }, (_, i) => {
      const m = seeThrough(tex, { opacity: 0 }); const o = steamy(new THREE.Mesh(geo, m), 2); P.whole.add(o);
      return { o, m, x: x0 + rr(i) * (x1 - x0), z: z0 + rr(i + 0.5) * (z1 - z0), ph: rr(i + 0.3), sp: 1.3 + rr(i + 0.7) * 0.8 };
    });
    return { grip: 0, apply(ps, t) {
      const on = clamp(ps.on ?? 1);
      for (const q of rings) {
        const k = (t * q.sp + q.ph) % 1, s = 0.02 + 0.13 * k;
        q.o.visible = on > 0.02; q.o.position.set(q.x, 0.006, q.z); q.o.scale.set(s, 1, s * 0.9); q.m.opacity = 0.5 * on * (1 - k);
      }
    } };
  },

  fogveil(P) {
    const S = P.spec, [[x0, y0, z0], [x1, y1, z1]] = S.box || [[-3, 0, -3], [3, 1.2, 0]], n = S.n ?? 24, c = new THREE.Color(S.color || "#aab6c8");
    const rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;
    const tex = radialTexture([[0, `rgba(${rgb},0.9)`], [0.45, `rgba(${rgb},0.45)`], [1, `rgba(${rgb},0)`]]);
    const [dx, dz] = S.drift || [0.08, 0];
    const puffs = Array.from({ length: n }, (_, i) => {
      const m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0, fog: false }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false };
      const o = steamy(new THREE.Sprite(m), 5); P.whole.add(o);
      const s = (S.size ?? 1.6) * (0.6 + rr(i + 2) * 0.8); o.scale.set(s * 1.8, s, 1);
      return { o, m, x: x0 + rr(i) * (x1 - x0), y: y0 + rr(i + 0.4) * (y1 - y0), z: z0 + rr(i + 0.6) * (z1 - z0), ph: rr(i + 0.8) * 6.28 };
    });
    const span = x1 - x0;
    return { grip: 0, apply(ps, t) {
      const on = clamp(ps.on ?? 1);
      for (const q of puffs) {
        let x = q.x + dx * t; x = x0 + ((((x - x0) % span) + span) % span);
        const edge = Math.min(1, (x - x0) / (span * 0.15), (x1 - x) / (span * 0.15));
        q.o.visible = on > 0.02; q.o.position.set(x, q.y + 0.05 * Math.sin(t * 0.4 + q.ph), q.z + dz * t);
        q.m.opacity = (S.a ?? 0.35) * on * Math.max(0, edge) * (0.75 + 0.25 * Math.sin(t * 0.6 + q.ph));
      }
    } };
  },
};
