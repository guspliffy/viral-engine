import * as THREE from "three";
import { clamp } from "./util.js";

// Props for "Ok I Lied" (Jonny's holiday-photo storyboard, 1 Nov 2026): the weather and wear that change from photo to
// photo on a locked group pose, and Dragon's tiny sun hat.
//   sunhat     a tiny straw sun hat (brim spec.r, default 0.12 m) with a red band and a green leaf. Origin: the brim's
//              underside at its centre. Worn with spec.wear (stage.js) on top of a head.
//   sandpit    a low lumpy mound of sand (spec.w x spec.d, spec.h high, origin its bottom centre), spec.color; the sand
//              tipped out under the trio in the car park.
//   drips      water running off a soaked character: beads on the skin (spec.beads: [[x, y, z], ...]) and drops falling
//              from spec.at points ([[x, y, z], ...]) to spec.floor (metres below each point), looped from the clip
//              time. `on` 0..1 shows it (worn: points are in the body's frame).
//   rainfall   rain streaks falling through a box (spec.box [[x0, y0, z0], [x1, y1, z1]]), spec.n streaks, looped from
//              the clip time. `on` 0..1 its strength, spec.alpha the streaks' opacity (default 0.32).
//   smokewisp  a thin grey smoke trail rising from the origin (spec.h metres high), looped. `on` 0..1.
//   embers     glowing orange sparks drifting up through a box (spec.box), looped. `on` 0..1.
//   blotch     a soft round colour patch (spec.color, spec.size m, spec.alpha) on a flat decal facing +z: sunburn on a
//              cheek. Shown by `scale` 0 -> 1.
// Drops, rain, smoke, embers and blotches are see-through (steam) for the contact and caption checks; the hat and the
// sand are solid.
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const steamy = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.userData.steam = true; return o; };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function softDot(stops, w = 64, h = 64) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"), gr = g.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
  for (const [k, col] of stops) gr.addColorStop(k, col);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const seeThrough = (map, o = {}) => { const m = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false, ...o }); m.userData.noOutline = true; return m; };

export const OKILIED_KINDS = {
  sunhat(P) {
    const S = P.spec, r = S.r ?? 0.12, straw = mat(S.color || "#e9c27a", { roughness: 0.9 });
    const brim = mesh(new THREE.CylinderGeometry(r, r * 1.02, r * 0.07, 32), straw, P.whole, 0, r * 0.035, 0);
    brim.scale.z = 0.96;
    const crown = mesh(new THREE.SphereGeometry(r * 0.52, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), straw, P.whole, 0, r * 0.06, 0);
    crown.scale.y = 0.9;
    mesh(new THREE.CylinderGeometry(r * 0.53, r * 0.54, r * 0.13, 24, 1, true), mat(S.band || "#c8322c", { side: THREE.DoubleSide }), P.whole, 0, r * 0.13, 0);
    // a leaf on the band, like the cast's sprouts
    const leaf = mesh(new THREE.SphereGeometry(r * 0.16, 12, 8), mat("#58b947"), P.whole, r * 0.42, r * 0.2, r * 0.22);
    leaf.scale.set(1.5, 0.45, 0.8); leaf.rotation.z = 0.5;
    return { grip: 0 };
  },

  sandpit(P) {
    const S = P.spec, w = S.w ?? 2.4, d = S.d ?? 1.2, h = S.h ?? 0.08;
    const g = new THREE.CircleGeometry(0.5, 64, 0, Math.PI * 2), p = g.attributes.position;
    // a disc lifted into a low mound: high and lumpy in the middle, a ragged spilled edge
    const geo = new THREE.SphereGeometry(0.5, 64, 18, 0, Math.PI * 2, 0, Math.PI / 2), q = geo.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < q.count; i++) {
      v.fromBufferAttribute(q, i);
      const a = Math.atan2(v.z, v.x), edge = 1 + 0.12 * Math.sin(a * 5 + 1.3) + 0.07 * Math.sin(a * 11 + 0.4) + 0.04 * Math.sin(a * 23);
      const lump = 1 + 0.25 * Math.sin(v.x * 9 + 2) * Math.sin(v.z * 7 + 1);
      q.setXYZ(i, v.x * edge * w, Math.max(0, v.y) * 2 * h * lump, v.z * edge * d);
    }
    geo.computeVertexNormals(); g.dispose();
    mesh(geo, mat(S.color || "#cfae74", { roughness: 1 }), P.whole);
    // a few clumps tipped out round the edge (many small, a few big, in groups)
    const cm = mat(S.color2 || "#c19d62", { roughness: 1 });
    for (let i = 0; i < 9; i++) {
      const a = rnd(i + 3) * 6.283, k = 0.5 + rnd(i + 7) * 0.12, s = (0.04 + rnd(i + 11) * 0.07) * (i % 4 === 0 ? 1.8 : 1);
      const c = mesh(new THREE.SphereGeometry(s, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), cm, P.whole, Math.cos(a) * w * k, 0, Math.sin(a) * d * k);
      c.scale.y = 0.6;
    }
    return { grip: 0 };
  },

  drips(P) {
    const S = P.spec, beadM = new THREE.MeshStandardMaterial({ color: "#dff3ff", roughness: 0.05, metalness: 0, transparent: true, opacity: 0.45, emissive: "#9fd4ff", emissiveIntensity: 0.25 });
    beadM.userData.noOutline = true;
    const beads = (S.beads || []).map(([x, y, z], i) => { const b = steamy(new THREE.Mesh(new THREE.SphereGeometry(S.bead ?? 0.016, 10, 8), beadM), 2); b.position.set(x, y, z); b.scale.set(0.8, 1.15 + rnd(i) * 0.4, 0.6); P.whole.add(b); return b; });
    const dropM = beadM.clone(); dropM.opacity = 0.42; dropM.userData.noOutline = true;
    const drops = (S.at || []).map(([x, y, z], i) => { const b = steamy(new THREE.Mesh(new THREE.SphereGeometry(S.drop ?? 0.014, 8, 6), dropM), 2); b.scale.set(0.75, 1.6, 0.75); P.whole.add(b); return { b, x, y, z, ph: rnd(i + 17), sp: 0.55 + rnd(i + 21) * 0.3 }; });
    const fall = S.floor ?? 0.35;
    return { grip: 0, apply(ps, t) {
      const on = clamp(ps.on ?? 1);
      for (const b of beads) b.visible = on > 0.02;
      for (const d of drops) {
        const k = (t / d.sp + d.ph) % 1;
        d.b.visible = on > 0.02 && k < 0.85;
        d.b.position.set(d.x, d.y - fall * k * k, d.z);
      }
    } };
  },

  rainfall(P) {
    const S = P.spec, [[x0, y0, z0], [x1, y1, z1]] = S.box || [[-2, 0, -1], [2, 3, 1]], n = S.n ?? 160;
    const m = seeThrough(null, { color: S.color || "#d4dde8", opacity: S.alpha ?? 0.32 });
    const geo = new THREE.PlaneGeometry(S.width ?? 0.006, S.len ?? 0.22);
    const streaks = Array.from({ length: n }, (_, i) => {
      const o = steamy(new THREE.Mesh(geo, m), 4); o.rotation.z = S.slant ?? 0.12; P.whole.add(o);
      return { o, x: x0 + rnd(i) * (x1 - x0), z: z0 + rnd(i + 0.5) * (z1 - z0), ph: rnd(i + 0.25) };
    });
    const H = y1 - y0, sp = S.speed ?? 7;
    return { grip: 0, apply(ps, t) {
      const on = clamp(ps.on ?? 1); m.opacity = (S.alpha ?? 0.32) * on;
      for (const s of streaks) { const k = ((t * sp) / H + s.ph) % 1; s.o.visible = on > 0.02; s.o.position.set(s.x - k * H * 0.12, y1 - k * H, s.z); }
    } };
  },

  smokewisp(P) {
    const S = P.spec, n = S.n ?? 7, h = S.h ?? 0.35, tex = softDot([[0, "rgba(120,116,112,0.75)"], [0.5, "rgba(140,136,132,0.4)"], [1, "rgba(150,146,142,0)"]]);
    const puffs = Array.from({ length: n }, (_, i) => { const m = seeThrough(tex, { opacity: 0.5 }); const o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), 3); P.whole.add(o); return { o, m, ph: i / n }; });
    return { grip: 0, apply(ps, t) {
      const on = clamp(ps.on ?? 1);
      for (const p of puffs) {
        const k = (t * 0.7 + p.ph) % 1, s = (S.size ?? 0.05) * (1 + 2.2 * k);
        p.o.visible = on > 0.02; p.o.position.set(Math.sin(k * 5 + p.ph * 6) * 0.03 * (1 + 2 * k), h * k, 0);
        p.o.scale.set(s, s, 1); p.m.opacity = 0.55 * on * Math.sin(Math.PI * Math.min(1, k * 1.25));
      }
    } };
  },

  embers(P) {
    const S = P.spec, [[x0, y0, z0], [x1, y1, z1]] = S.box || [[-2, 0, -2], [2, 3, -1]], n = S.n ?? 50;
    const tex = softDot([[0, "rgba(255,240,170,1)"], [0.35, "rgba(255,150,40,0.9)"], [1, "rgba(255,80,10,0)"]], 32, 32);
    const m = seeThrough(tex, { opacity: 0.45, blending: THREE.AdditiveBlending });
    const sparks = Array.from({ length: n }, (_, i) => {
      const o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), 4); const s = (S.size ?? 0.035) * (0.5 + rnd(i + 2) * 1.0); o.scale.set(s, s, 1); P.whole.add(o);
      return { o, x: x0 + rnd(i) * (x1 - x0), z: z0 + rnd(i + 0.5) * (z1 - z0), ph: rnd(i + 0.25), sp: 0.25 + rnd(i + 0.75) * 0.35 };
    });
    const H = y1 - y0;
    return { grip: 0, apply(ps, t) {
      const on = clamp(ps.on ?? 1); m.opacity = 0.45 * on;
      for (const s of sparks) { const k = (t * s.sp + s.ph) % 1; s.o.visible = on > 0.02; s.o.position.set(s.x + Math.sin(k * 7 + s.ph * 9) * 0.15, y0 + k * H, s.z); }
    } };
  },

  blotch(P) {
    const S = P.spec, c = new THREE.Color(S.color || "#e2483a"), rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`, a = S.alpha ?? 0.6;
    const m = seeThrough(softDot([[0, `rgba(${rgb},${a})`], [0.55, `rgba(${rgb},${a * 0.6})`], [1, `rgba(${rgb},0)`]]), { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    const s = S.size ?? 0.08, o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(s, s * 0.75), m), 2); P.whole.add(o);
    return { grip: 0 };
  },
};
