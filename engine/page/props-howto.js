import * as THREE from "three";

// Props for "How to…" episode 2, jump super high (8 Nov 2026; brief in
// /mnt/project-files/video-scripts/2026-11-08-how-to/02-jump-super-high-ENGINE-PROMPT.md): a home-made seesaw on a meadow.
//   seesawplank a long, old scaffold board (spec.len along local x, spec.w wide, spec.t thick; origin the middle of its
//              underside, so it pivots there when it sits on a log): weathered grey-brown wood, grain, two dark knots,
//              a split at one end and rusty nail heads where it was once nailed down. tilt turns it about its own
//              middle (the "tilt" every prop has: + lifts the -x end). Solid.
//   drystone   a field wall of dry-laid stones (spec.w along x, spec.h high, spec.d deep, origin its bottom middle):
//              as in nature, big flat stones low and smaller ones higher, every course breaking the joints of the one
//              under it, a row of upright cap stones on top (a flat walking line about 4 cm under spec.h), moss and lichen
//              on the shaded side and the tops, a few gaps. Solid.
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

// a rough stone: a box whose corners are pulled in and its faces bulged a little (deterministic by seed)
function stoneGeo(w, h, d, seed) {
  const g = new THREE.BoxGeometry(w, h, d, 3, 2, 3), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const cx = Math.abs(v.x) / (w / 2), cy = Math.abs(v.y) / (h / 2), cz = Math.abs(v.z) / (d / 2), corner = cx * cy * cz;
    const k = 1 - 0.16 * corner - 0.05 * rnd(seed * 31 + i);
    v.x *= k; v.y *= 1 - 0.1 * corner * rnd(seed + i * 3); v.z *= k;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

export const HOWTO_KINDS = {
  seesawplank(P) {
    const L = P.spec.len ?? 3.0, W = P.spec.w ?? 0.24, T = P.spec.t ?? 0.045;
    const wood = canvasTex(1024, 96, (g, w, h) => {
      g.fillStyle = "#8f7a5f"; g.fillRect(0, 0, w, h);
      // long grain lines that wander a little, darker toward the edges (an old board greys and cups)
      for (let i = 0; i < 46; i++) {
        const y0 = rnd(i) * h, a = 2 + rnd(i + 5) * 5, f = 0.004 + rnd(i + 9) * 0.01;
        g.strokeStyle = `rgba(${70 + rnd(i + 2) * 40},${55 + rnd(i + 3) * 30},${38 + rnd(i + 4) * 20},${0.25 + rnd(i + 6) * 0.4})`; g.lineWidth = 1 + rnd(i + 8) * 2;
        g.beginPath(); for (let x = 0; x <= w; x += 16) g.lineTo(x, y0 + a * Math.sin(x * f + i)); g.stroke();
      }
      for (const [x, y, r] of [[0.31, 0.45, 9], [0.72, 0.6, 6]]) {   // knots, the grain bending round them
        g.fillStyle = "#4a3824"; g.beginPath(); g.ellipse(x * w, y * h, r * 1.6, r, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = "rgba(60,44,28,0.5)"; g.lineWidth = 1.5; for (let k = 1; k < 4; k++) { g.beginPath(); g.ellipse(x * w, y * h, r * 1.6 + k * 5, r + k * 3, 0, 0, Math.PI * 2); g.stroke(); }
      }
      g.strokeStyle = "rgba(40,30,20,0.8)"; g.lineWidth = 2; g.beginPath(); g.moveTo(w, h * 0.42); g.lineTo(w * 0.93, h * 0.47); g.lineTo(w * 0.9, h * 0.44); g.stroke();   // a split at the +x end
      for (const x of [0.12, 0.88]) for (const y of [0.25, 0.75]) { g.fillStyle = "#5b3a22"; g.beginPath(); g.arc(x * w, y * h, 3.2, 0, Math.PI * 2); g.fill(); }   // old nail heads
      g.fillStyle = "rgba(160,150,135,0.25)"; g.fillRect(0, 0, w, h * 0.12); g.fillRect(0, h * 0.88, w, h * 0.12);
    });
    const top = mat("#ffffff", { map: wood, roughness: 0.85 }), side = mat("#7a6650", { roughness: 0.9 }), end = mat("#a58d6a", { roughness: 0.9 });
    const board = mesh(new THREE.BoxGeometry(L, T, W), [end, end, top, side, side, side], P.whole, 0, T / 2, 0);
    board.userData.solid = true;
    return { grip: T };
  },

  drystone(P) {
    const W = P.spec.w ?? 2.0, H = P.spec.h ?? 1.0, D = P.spec.d ?? 0.55;
    const tones = ["#8e8a80", "#7d7a72", "#9c968a", "#86817a", "#6f6d68", "#a39e92"].map((c) => mat(c, { roughness: 0.95 }));
    const moss = mat("#5d7a3a", { roughness: 1 }), lichen = mat("#c8c09a", { roughness: 1 });
    const g = new THREE.Group(); P.whole.add(g);
    let y = 0, row = 0, s = 1;
    const capH = 0.2, body = H - capH;
    // courses: tall flat stones at the bottom, getting smaller toward the top; each course starts at a different offset
    while (y < body - 0.02) {
      const ch = Math.min(body - y, 0.22 - 0.1 * (y / body) + 0.04 * rnd(row + 3));
      let x = -W / 2 - rnd(row + 11) * 0.18;
      while (x < W / 2) {
        const sw = Math.min(W / 2 - x, 0.22 + rnd(s * 7 + row) * 0.32 * (1 - 0.4 * y / body)); if (sw < 0.05) break;
        const st = mesh(stoneGeo(sw * 0.97, ch * 0.95, D * (0.92 + 0.08 * rnd(s + 2)), s), tones[Math.floor(rnd(s * 3 + 1) * tones.length)], g, x + sw / 2, y + ch / 2, (rnd(s + 9) - 0.5) * 0.03);
        st.rotation.z = (rnd(s + 4) - 0.5) * 0.06;
        // moss on the back (shaded) half of some stones, lichen spots on a few faces
        if (rnd(s + 21) > 0.62) mesh(new THREE.SphereGeometry(0.035 + 0.03 * rnd(s), 7, 5), moss, g, x + sw * rnd(s + 5), y + ch * 0.9, -D * 0.42).scale.set(1.8, 0.45, 1);
        if (rnd(s + 23) > 0.8) mesh(new THREE.CircleGeometry(0.025 + 0.02 * rnd(s + 1), 9), lichen, g, x + sw * (0.3 + 0.4 * rnd(s + 6)), y + ch * (0.3 + 0.4 * rnd(s + 8)), D * 0.475 + 0.002);
        x += sw; s++;
      }
      y += ch; row++;
    }
    // cap stones on edge across the top, leaning a little, with a flat walking line along their tops
    let x = -W / 2;
    while (x < W / 2 - 0.04) {
      const cw = Math.min(W / 2 - x, 0.09 + 0.07 * rnd(s * 5)), ch = capH * (0.85 + 0.15 * rnd(s + 3));
      const c = mesh(stoneGeo(cw * 0.95, ch, D * 0.95, s), tones[Math.floor(rnd(s * 2 + 7) * tones.length)], g, x + cw / 2, y + ch / 2, 0);
      c.rotation.z = (rnd(s + 13) - 0.5) * 0.12;
      if (rnd(s + 17) > 0.55) mesh(new THREE.SphereGeometry(0.04, 7, 5), moss, g, x + cw / 2, y + ch + 0.005, -0.08 + 0.16 * rnd(s + 19)).scale.set(1.2, 0.35, 1.6);
      x += cw; s++;
    }
    g.traverse((o) => { if (o.isMesh) o.userData.solid = true; });
    return { grip: H };
  },
};
