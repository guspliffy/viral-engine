import * as THREE from "three";
import { clamp, rng } from "./util.js";

// For "Not Even Magic — DUO Unboxing" (Jonny's story library #11, 29 Oct 2026): ONE fixed damage map per phone half,
// drawn three ways so the broken screens never change shape between states (the brief: "one stable damage map per
// slab ... after shutdown, change the emissive fault layer, not the crack geometry").
//   damageMap(seed, side)   the map itself: impact points, branching cracks that run to the edges, big ragged dead
//                           (ink-bleed) regions, broken pixel blocks and corrupted bands. Pure data, seeded.
//   drawDamage(g, w, h, map, mode)
//                           "lit"   the broken display still lit: dimmed wallpaper, muted bands, black dead regions
//                           "fault" the failed boot: broad bright white / cyan / magenta / green bands, pixel blocks
//                           "off"   powered off: dark glass, the dead regions blacker, the cracks pale in room light
// The foldphone (props-duo.js) uses them when its spec says `damage: "map"`.

const BAND = ["#ffffff", "#3ff5ff", "#ff3fd8", "#62ff6a", "#a58bff", "#ffe066"];

// every coordinate is 0..1 across the half's screen (u from the hinge side outward, v from the top down); the
// drawing mirrors u for the left half so the hinge side is always u 0
export function damageMap(seed, side) {
  const r = rng(seed);
  const impacts = [[0.22 + 0.12 * r(), 0.3 + 0.12 * r()], [0.62 + 0.2 * r(), 0.68 + 0.18 * r()]];
  // cracks: from each impact, long jagged lines (most reach an edge), each with a branch or two, plus a web ring
  const cracks = [];
  const walk = (x, y, a, len, w, depth) => {
    const pts = [[x, y]], n = 6;
    for (let s = 0; s < n; s++) { a += (r() - 0.5) * 0.7; x += (Math.cos(a) * len) / n; y += (Math.sin(a) * len) / n; pts.push([x, y]); if (depth < 2 && r() < 0.3) walk(x, y, a + (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.8), len * 0.45, w * 0.6, depth + 1); }
    cracks.push({ pts, w });
  };
  impacts.forEach(([x, y], i) => {
    const n = i ? 9 : 13;
    for (let k = 0; k < n; k++) walk(x, y, (k / n) * Math.PI * 2 + r() * 0.35, (i ? 0.55 : 0.85) * (0.6 + 0.6 * r()), i ? 0.0055 : 0.0075, 0);
    for (const rad of i ? [0.05, 0.1] : [0.05, 0.1, 0.17]) {   // the spider web: short chords round the impact
      const m = 9 + Math.floor(r() * 4), off = r();
      for (let k = 0; k < m; k++) if (r() < 0.8) {
        const a0 = ((k + off) / m) * Math.PI * 2, a1 = ((k + 1 + off) / m) * Math.PI * 2, q = rad * (0.85 + 0.3 * r());
        cracks.push({ pts: [[x + Math.cos(a0) * q, y + Math.sin(a0) * q * 0.8], [x + Math.cos(a1) * q, y + Math.sin(a1) * q * 0.8]], w: 0.0035 });
      }
    }
  });
  // dead regions: big ragged blobs with ink fingers, about 40 % of the screen
  const dead = [[0.45, 0.42, 0.24], [0.2, 0.78, 0.16], [0.78, 0.2, 0.15], [0.72, 0.62, 0.13]].map(([x, y, s]) => {
    const pts = [], n = 28;
    for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, q = s * (0.55 + 0.6 * r()) * (k % 3 ? 1 : 1.35); pts.push([x + Math.cos(a) * q, y + Math.sin(a) * q * 1.15]); }
    const fingers = Array.from({ length: 4 }, () => [x + (r() - 0.5) * s * 1.4, y, s * (0.08 + 0.08 * r()), s * (0.7 + r() * 1.4)]);
    return { pts, fingers };
  });
  // broken pixel blocks on a coarse grid, and vertical bands
  const blocks = Array.from({ length: 34 }, () => [Math.floor(r() * 16) / 16, Math.floor(r() * 20) / 20, (1 + Math.floor(r() * 3)) / 16, (1 + Math.floor(r() * 2)) / 20, Math.floor(r() * BAND.length)]);
  const bands = Array.from({ length: 22 }, () => [r(), 0.02 + 0.07 * r(), r() * 0.4, 0.35 + 0.65 * r(), Math.floor(r() * BAND.length)]);
  return { side, impacts, cracks, dead, blocks, bands };
}

export function drawDamage(g, w, h, m, mode, under) {
  const X = (u) => (m.side < 0 ? 1 - u : u) * w, Y = (v) => v * h;
  // the background
  if (mode === "lit") { under(g, w, h); g.fillStyle = "rgba(10,10,24,0.35)"; g.fillRect(0, 0, w, h); }
  else if (mode === "fault") { g.fillStyle = "#14102a"; g.fillRect(0, 0, w, h); }
  else { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#2a2e37"); gr.addColorStop(0.55, "#1b1e25"); gr.addColorStop(1, "#262a32"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
  // bands: muted when lit, broad and bright on the failed boot, a grey striation when off
  for (const [u, bw, v0, len, ci] of m.bands) {
    const x = Math.min(X(u), X(u + bw)), bwPx = Math.abs(X(u + bw) - X(u));
    g.fillStyle = mode === "off" ? `rgba(70,74,84,${0.35 + 0.25 * (ci % 2)})` : BAND[ci];
    g.globalAlpha = mode === "lit" ? 0.55 : 1;
    g.fillRect(x, Y(v0), mode === "fault" ? bwPx * 1.8 : bwPx, Y(len));
  }
  for (const [u, v, bw, bh, ci] of m.blocks) {
    g.fillStyle = mode === "off" ? "#3a3e47" : mode === "lit" ? ["#6a5c9a", "#2d2f45", "#9a9ab8"][ci % 3] : BAND[ci];
    g.globalAlpha = mode === "fault" ? 1 : 0.85;
    g.fillRect(Math.min(X(u), X(u + bw)), Y(v), Math.abs(X(u + bw) - X(u)), Y(bh));
  }
  g.globalAlpha = 1;
  // dead regions: black ink with fingers running down
  g.fillStyle = mode === "off" ? "#07080b" : "#050508";
  for (const d of m.dead) {
    g.beginPath(); d.pts.forEach(([u, v], i) => (i ? g.lineTo(X(u), Y(v)) : g.moveTo(X(u), Y(v)))); g.closePath(); g.fill();
    for (const [u, v, fw, fl] of d.fingers) g.fillRect(Math.min(X(u), X(u + fw)), Y(v), Math.abs(X(u + fw) - X(u)), Y(fl));
  }
  // cracks: pale lines with a dark core (paler and thinner off, where only the room light catches them)
  g.lineCap = "round"; g.lineJoin = "round";
  for (const c of m.cracks) {
    g.beginPath(); c.pts.forEach(([u, v], i) => (i ? g.lineTo(X(u), Y(v)) : g.moveTo(X(u), Y(v))));
    g.strokeStyle = mode === "off" ? "rgba(214,224,236,0.8)" : "rgba(238,246,255,0.95)"; g.lineWidth = c.w * w; g.stroke();
    g.strokeStyle = "rgba(15,15,25,0.35)"; g.lineWidth = c.w * w * 0.35; g.stroke();
  }
  for (const [u, v] of m.impacts) {
    const gl = g.createRadialGradient(X(u), Y(v), 0, X(u), Y(v), w * 0.07);
    gl.addColorStop(0, mode === "off" ? "rgba(225,232,242,0.85)" : "rgba(250,252,255,1)"); gl.addColorStop(1, "rgba(250,252,255,0)");
    g.fillStyle = gl; g.beginPath(); g.arc(X(u), Y(v), w * 0.07, 0, Math.PI * 2); g.fill();
  }
}

// three textures of one half's damage map, same shapes in each
export function damageTextures(seed, side, under, canvasTex) {
  const m = damageMap(seed, side);
  return Object.fromEntries(["lit", "fault", "off"].map((mode) => [mode, canvasTex(512, 652, (g, w, h) => drawDamage(g, w, h, m, mode, under))]));
}

// the small golden repair glow along the hinge (`mend` 0..1): a soft additive strip and a brighter core, drawn into
// the foldphone's own frame so it stays on the hinge whatever the camera does
export function mendGlow(parent, H) {
  const tex = (() => {
    const c = document.createElement("canvas"); c.width = 64; c.height = 256; const g = c.getContext("2d");
    const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, "rgba(255,200,80,0)"); gr.addColorStop(0.5, "rgba(255,226,140,1)"); gr.addColorStop(1, "rgba(255,200,80,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    const fade = g.createLinearGradient(0, 0, 0, 256); fade.addColorStop(0, "rgba(0,0,0,1)"); fade.addColorStop(0.15, "rgba(0,0,0,0)"); fade.addColorStop(0.85, "rgba(0,0,0,0)"); fade.addColorStop(1, "rgba(0,0,0,1)");
    g.globalCompositeOperation = "destination-out"; g.fillStyle = fade; g.fillRect(0, 0, 64, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 });
  m.userData.noOutline = true;
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.06, H * 1.15), m); strip.position.set(0, H / 2, 0.006); strip.renderOrder = 5; strip.castShadow = false;
  parent.add(strip);
  return (k, gap) => { m.opacity = 0.9 * clamp(k); strip.visible = k > 0.005; strip.scale.x = 1 + (gap || 0) * 18; };
}
