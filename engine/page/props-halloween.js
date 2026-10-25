import * as THREE from "three";
import { clamp } from "./util.js";

// Props for the trick-or-treat clip (props3d.js merges these into its KINDS and GRIPS):
//   door     the front door, hinged on its left edge at the prop's x (set-porch.js PORCH lines it up with the doorway);
//            `open` 0 shut .. 1 swung open (spec.angle, default 115°) toward the porch (swing "in": into the house). spec: { w, h }
//   bowl     a candy bowl heaped with wrapped sweets; held from below (grip "base")
//   candy    one wrapped sweet
//   bucket   a trick-or-treat bucket with a wire bail; style "pumpkin" | "cauldron" | "ghost". grip "bail"
//   tproll   a toilet roll on its side (axis along x) with a loose sheet; it splits into two short rolls (`split`), and
//            `tail` 0..1 is how much of the loose sheet hangs out
//   popghost a haunted-house pop-up (Nothing Scares Reaper): a black crate with "BOO" stencilled on it and a flat,
//            friendly cut-out ghost on a rod inside. `rise` 0 hidden in the crate .. 1 up (spec.lift, default 0.62 m, higher); `wobble`
//            sways the cut-out on its rod (degrees, it rocks about 1.3 times a second). Rigid: no cloth anywhere.
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

export const HALLOWEEN_GRIPS = {
  bowl: { base: [0, 0, 0] },
  bucket: { bail: [0, 0.205, 0] },
  tproll: { side: [0, 0.06, -0.075] },
};

// a wrapped sweet: a round middle with a twist of wrapper either side
function sweet(parent, color, x, y, z, ry = 0, s = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.set(0.3 * Math.sin(ry * 3), ry, 0.2 * Math.cos(ry * 5)); g.scale.setScalar(s); parent.add(g);
  const m = mat(color, { roughness: 0.3, metalness: 0.25 });
  const mid = mesh(new THREE.SphereGeometry(0.022, 14, 10), m, g); mid.scale.set(1.25, 0.85, 0.85);
  for (const k of [-1, 1]) { const c = mesh(new THREE.ConeGeometry(0.016, 0.026, 8), m, g, k * 0.036, 0, 0); c.rotation.z = k * Math.PI / 2; }
  return g;
}

export const HALLOWEEN_KINDS = {
  door(P) {
    const W = P.spec.w ?? 1.0, H = P.spec.h ?? 1.75, T = 0.055;
    const paint = mat(P.spec.color || "#5b1e33", { roughness: 0.55 }), dark = mat("#3e1222", { roughness: 0.6 });
    const brass = mat("#d9a640", { roughness: 0.25, metalness: 0.85 });
    const leaf = new THREE.Group(); P.whole.add(leaf);   // the swinging part, hinged at x 0
    // the slab as six upright strips: each part's box stays tight however the door turns (the clipping check boxes parts)
    for (let i = 0; i < 6; i++) mesh(new THREE.BoxGeometry((W - 0.01) / 6 + 0.001, H - 0.01, T), paint, leaf, (W - 0.01) * (i + 0.5) / 6 + 0.005, H / 2, 0);
    // four raised panels on both faces, a little darker in the recess round them
    for (const zs of [1, -1]) for (const [px, py, pw, ph] of [[0.27, 0.37, 0.34, 0.5], [0.73, 0.37, 0.34, 0.5], [0.27, 0.77, 0.34, 0.32], [0.73, 0.77, 0.34, 0.32]]) {
      mesh(new THREE.BoxGeometry(W * pw + 0.03, H * ph + 0.03, 0.006), dark, leaf, W * px, H * py, zs * (T / 2 + 0.002));
      mesh(new THREE.BoxGeometry(W * pw, H * ph, 0.016), paint, leaf, W * px, H * py, zs * (T / 2 + 0.006));
    }
    // brass knob on both sides, a ring knocker and a peephole on the outside
    for (const zs of [1, -1]) { const k = mesh(new THREE.SphereGeometry(0.035, 16, 12), brass, leaf, W - 0.1, H * 0.5, zs * (T / 2 + 0.04)); mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 14), brass, leaf, W - 0.1, H * 0.5, zs * (T / 2 + 0.015)).rotation.x = Math.PI / 2; k.castShadow = false; }
    const ring = mesh(new THREE.TorusGeometry(0.05, 0.009, 8, 24), brass, leaf, W / 2, H * 0.6, T / 2 + 0.022); ring.castShadow = false;
    mesh(new THREE.SphereGeometry(0.018, 10, 8), brass, leaf, W / 2, H * 0.6 + 0.05, T / 2 + 0.016);
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 10), brass, leaf, W / 2, H * 0.84, T / 2 + 0.005).rotation.x = Math.PI / 2;
    // a Halloween wreath: dark leaves with orange berries round a ring, and a little bat on top
    const wreath = new THREE.Group(); wreath.position.set(W / 2, H * 0.72, T / 2 + 0.03); leaf.add(wreath);
    const lm = [mat("#1f2a22", { roughness: 0.7 }), mat("#2e3b2c", { roughness: 0.7 })], bm = mat("#ff7a1a", { roughness: 0.4, emissive: new THREE.Color("#ff6a00"), emissiveIntensity: 0.25 });
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2, r = 0.13;
      const l = mesh(new THREE.SphereGeometry(0.035, 8, 6), lm[i % 2], wreath, Math.cos(a) * r, Math.sin(a) * r, 0.01 * (i % 3)); l.scale.set(1.5, 0.6, 0.5); l.rotation.z = a + Math.PI / 2; l.castShadow = false;
      if (i % 3 === 0) { const b = mesh(new THREE.SphereGeometry(0.014, 8, 6), bm, wreath, Math.cos(a + 0.1) * (r + 0.02), Math.sin(a + 0.1) * (r + 0.02), 0.03); b.castShadow = false; }
    }
    const bat = new THREE.Group(); bat.position.set(0, 0.16, 0.035); wreath.add(bat);
    const bk = mat("#16141c", { roughness: 0.6 }); mesh(new THREE.SphereGeometry(0.025, 10, 8), bk, bat).castShadow = false;
    for (const s of [-1, 1]) { const w = mesh(new THREE.ConeGeometry(0.03, 0.08, 3), bk, bat, s * 0.05, 0.005, 0); w.rotation.z = s * Math.PI / 2; w.scale.set(1, 1, 0.25); w.castShadow = false; }
    return {
      grip: 1.0,
      // swing: "out" (the default) opens toward the porch, so whoever opens it can stand right behind it
      apply(ps) { leaf.rotation.y = (P.spec.swing === "in" ? 1 : -1) * clamp(ps.open ?? 0, -0.2, 1.2) * ((P.spec.angle ?? 115) * Math.PI) / 180; },
    };
  },
  popghost(P) {
    const crate = mat("#2a2230", { roughness: 0.7 }), edge = mat("#4a3a52", { roughness: 0.6 }), rodM = mat("#5d5a66", { roughness: 0.35, metalness: 0.6 });
    const CW = 0.5, CH = 0.62, CD = 0.4, T = 0.03;
    // an open-topped crate: four walls and a floor (so the ghost can sit inside it), with a lighter rim and corner posts
    for (const [w, d, x, z] of [[CW, T, 0, CD / 2 - T / 2], [CW, T, 0, -CD / 2 + T / 2], [T, CD, CW / 2 - T / 2, 0], [T, CD, -CW / 2 + T / 2, 0]]) mesh(new THREE.BoxGeometry(w, CH, d), crate, P.whole, x, CH / 2, z);
    mesh(new THREE.BoxGeometry(CW, T, CD), crate, P.whole, 0, T / 2, 0);
    for (const [w, d, x, z] of [[CW + 0.02, 0.04, 0, CD / 2], [CW + 0.02, 0.04, 0, -CD / 2], [0.04, CD, CW / 2, 0], [0.04, CD, -CW / 2, 0]]) mesh(new THREE.BoxGeometry(w, 0.04, d), edge, P.whole, x, CH - 0.02, z);
    const boo = canvasTex(256, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = "#ff8a2a"; g.font = "900 92px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("BOO", w / 2, h / 2 + 4); });
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.18), new THREE.MeshBasicMaterial({ map: boo, transparent: true })); label.position.set(0, CH * 0.5, CD / 2 + 0.002); label.material.userData.noOutline = true; P.whole.add(label);
    // the cut-out: a rounded head, two stubby arms and a scalloped hem, extruded thin, with a fixed friendly face
    const GW = 0.42, GH = 0.58, sh = new THREE.Shape();
    sh.moveTo(-GW / 2, 0.06);
    sh.lineTo(-GW / 2, GH - GW / 2);
    sh.absarc(0, GH - GW / 2, GW / 2, Math.PI, 0, true);
    sh.lineTo(GW / 2, 0.24); sh.quadraticCurveTo(GW / 2 + 0.08, 0.2, GW / 2 + 0.02, 0.15); sh.lineTo(GW / 2, 0.06);
    for (let i = 0; i < 3; i++) { const x0 = GW / 2 - (i * GW) / 3, x1 = x0 - GW / 3; sh.quadraticCurveTo((x0 + x1) / 2, -0.04, x1, 0.06); }
    sh.lineTo(-GW / 2, 0.15); sh.quadraticCurveTo(-GW / 2 - 0.08, 0.2, -GW / 2, 0.24);
    const ghost = new THREE.Group(); P.whole.add(ghost);
    const body = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 18 }), mat("#f5f3fb", { roughness: 0.65 }), ghost, 0, 0, -0.02);
    body.userData.noShine = true;
    const ink = mat("#221c2a", { roughness: 0.5 });
    for (const s of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(0.03, 14, 10), ink, ghost, s * 0.075, GH - 0.21, 0.03); e.scale.set(0.8, 1.15, 0.3); e.castShadow = false; }
    for (const s of [-1, 1]) { const c = mesh(new THREE.CircleGeometry(0.03, 16), new THREE.MeshBasicMaterial({ color: "#f4a3b8", transparent: true, opacity: 0.8 }), ghost, s * 0.13, GH - 0.27, 0.031); c.material.userData.noOutline = true; c.castShadow = false; }
    const smile = mesh(new THREE.TorusGeometry(0.045, 0.009, 8, 20, Math.PI * 0.8), ink, ghost, 0, GH - 0.265, 0.031); smile.rotation.z = Math.PI + Math.PI * 0.1; smile.castShadow = false;
    // the rod it rides on, from the crate floor to the ghost's middle (only seen once it has risen above the rim)
    const rod = mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 10), rodM, P.whole, 0, 0, -0.03); rod.castShadow = false;
    return {
      grip: 0,
      apply(ps, t) {
        const y = CH - GH - 0.03 + (P.spec.lift ?? 0.62) * Math.max(0, ps.rise ?? 0);
        ghost.position.y = y; ghost.rotation.z = ((ps.wobble ?? 0) * Math.PI / 180) * Math.sin(t * 8.2);
        const top = y + 0.2; rod.scale.y = Math.max(0.01, top - T); rod.position.y = T + (top - T) / 2;
      },
    };
  },
  bowl(P) {
    const prof = [[0.0, 0.0], [0.07, 0.0], [0.075, 0.012], [0.13, 0.05], [0.165, 0.1], [0.172, 0.108], [0.16, 0.104], [0.122, 0.056], [0.066, 0.016], [0.0, 0.016]].map(([x, y]) => new THREE.Vector2(x, y));
    const b = mesh(new THREE.LatheGeometry(prof, 40), mat("#ef7d22", { roughness: 0.4 }), P.whole); b.material.side = THREE.DoubleSide;
    const rim = mesh(new THREE.TorusGeometry(0.168, 0.008, 8, 48), mat("#1d1820", { roughness: 0.4 }), P.whole, 0, 0.106, 0); rim.rotation.x = Math.PI / 2;
    // a little bat painted round the side: two dark marks
    for (const a of [0.4, 2.5, 4.6]) { const m = mesh(new THREE.SphereGeometry(0.02, 8, 6), mat("#1d1820"), P.whole, Math.sin(a) * 0.15, 0.06, Math.cos(a) * 0.15); m.scale.set(1.6, 0.5, 0.3); m.lookAt(0, 0.06, 0); m.castShadow = false; }
    const cols = ["#e8b53a", "#8e3fd1", "#e2372f", "#2fa86a", "#f2f2f2", "#ff8a1a"];
    let k = 0;
    for (const [r, y, n] of [[0.11, 0.07, 9], [0.06, 0.09, 6], [0.0, 0.105, 1]]) for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + y * 9; sweet(P.whole, cols[k++ % cols.length], Math.cos(a) * r, y, Math.sin(a) * r, a); }
    return { grip: 0 };
  },
  candy(P) {
    sweet(P.whole, P.spec.color || "#e8b53a", 0, 0.02, 0, 0, P.spec.big ?? 1.3);
    return { grip: 0.02 };
  },
  bucket(P) {
    const style = P.spec.style || "pumpkin";
    const col = { pumpkin: "#f07a1c", cauldron: "#25222c", ghost: "#f2f0f5" }[style];
    const prof = style === "cauldron"
      ? [[0, 0], [0.07, 0], [0.105, 0.04], [0.112, 0.1], [0.098, 0.15], [0.104, 0.16], [0.094, 0.162], [0.088, 0.15], [0.1, 0.1], [0.094, 0.04], [0.065, 0.012], [0, 0.012]]
      : [[0, 0], [0.075, 0], [0.1, 0.03], [0.108, 0.09], [0.098, 0.15], [0.1, 0.158], [0.09, 0.158], [0.088, 0.15], [0.096, 0.09], [0.088, 0.03], [0.068, 0.012], [0, 0.012]];
    const body = mesh(new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 36), mat(col, { roughness: style === "cauldron" ? 0.45 : 0.4, metalness: style === "cauldron" ? 0.3 : 0 }), P.whole);
    body.material.side = THREE.DoubleSide;
    if (style === "pumpkin") for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const r = mesh(new THREE.BoxGeometry(0.006, 0.12, 0.006), mat("#c45a10"), P.whole, Math.sin(a) * 0.104, 0.085, Math.cos(a) * 0.104); r.rotation.y = a; r.castShadow = false; }
    // a face on the front (pumpkin: carved triangles, ghost: two eyes and an "o")
    if (style !== "cauldron") {
      const face = canvasTex(128, 96, (g) => {
        g.fillStyle = style === "pumpkin" ? "#1e1210" : "#2a2633";
        if (style === "pumpkin") { for (const s of [-1, 1]) { g.beginPath(); g.moveTo(64 + s * 14, 40); g.lineTo(64 + s * 40, 40); g.lineTo(64 + s * 27, 18); g.fill(); } g.beginPath(); g.moveTo(26, 56); for (let i = 0; i <= 6; i++) g.lineTo(26 + i * 12.7, i % 2 ? 66 : 56); g.quadraticCurveTo(64, 96, 26, 56); g.fill(); }
        else { for (const s of [-1, 1]) { g.beginPath(); g.ellipse(64 + s * 20, 34, 9, 13, 0, 0, Math.PI * 2); g.fill(); } g.beginPath(); g.ellipse(64, 66, 10, 13, 0, 0, Math.PI * 2); g.fill(); }
      });
      const fm = new THREE.MeshStandardMaterial({ map: face, transparent: true, roughness: 0.5 }); fm.userData.noOutline = true;
      const f = new THREE.Mesh(new THREE.CylinderGeometry(0.1095, 0.1095, 0.09, 24, 1, true, -0.7, 1.4), fm); f.position.y = 0.088; P.whole.add(f);
    }
    // the wire bail, across the top along x, and its two lugs
    const wire = mat("#2a2a30", { roughness: 0.35, metalness: 0.6 });
    const bail = mesh(new THREE.TorusGeometry(0.098, 0.0055, 6, 28, Math.PI), wire, P.whole, 0, 0.152, 0); bail.castShadow = true;
    for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.011, 8, 6), wire, P.whole, s * 0.1, 0.15, 0);
    // a dark inside, so nothing below the rim shows
    const inside = mesh(new THREE.CircleGeometry(0.088, 24), mat("#120e14", { roughness: 0.9 }), P.whole, 0, 0.11, 0); inside.rotation.x = -Math.PI / 2; inside.castShadow = false; inside.visible = P.spec.inside !== false;
    return { grip: 0.205 };
  },
  tproll(P) {
    const R = 0.062, r = 0.022, L = 0.118, paper = mat("#f7f5f0", { roughness: 0.85 }), core = mat("#b98a5a", { roughness: 0.8 });
    for (const [s, h] of P.halves) {
      // each half is its own short roll: a tube of paper, a cardboard core and the end faces
      const tube = mesh(new THREE.CylinderGeometry(R, R, L / 2, 32, 1, true), paper, h, s * L / 4, R, 0); tube.rotation.z = Math.PI / 2;
      for (const e of [0, 1]) {
        const x = s * (e ? L / 2 : 0.0005), ringG = new THREE.RingGeometry(r, R, 32);
        const face = mesh(ringG, mat(e ? "#ecebe4" : "#e2ddd0", { roughness: 0.9, side: THREE.DoubleSide }), h, x, R, 0); face.rotation.y = Math.PI / 2;
        // the paper's wound layers: faint rings on the end face
        const lines = mesh(new THREE.RingGeometry(r + 0.012, r + 0.0135, 32), mat("#d8d2c4", { side: THREE.DoubleSide }), h, x + s * 0.0005, R, 0); lines.rotation.y = Math.PI / 2; lines.castShadow = false;
      }
      const c = mesh(new THREE.CylinderGeometry(r, r, L / 2, 20, 1, true), core, h, s * L / 4, R, 0); c.rotation.z = Math.PI / 2; c.material.side = THREE.DoubleSide;
    }
    // the loose sheet: a strip leaving the roll at the back and curling down, a few segments that sway
    // it hangs from the right half, so a cut roll keeps its sheet on one piece
    const segs = 6, sw = L * 0.4, sl = 0.05, strip = new THREE.Group(); strip.position.set(L / 4, R, -R); P.halves[0][1].add(strip);
    const parts = [];
    let parent = strip;
    for (let i = 0; i < segs; i++) { const g = new THREE.Group(); g.position.y = i ? -sl : 0; parent.add(g); const m = mesh(new THREE.PlaneGeometry(sw, sl), mat("#f7f5f0", { roughness: 0.85, side: THREE.DoubleSide }), g, 0, -sl / 2, 0); m.castShadow = true; parts.push(g); parent = g; }
    return {
      grip: R, splitApart: 0.07, splitTip: 0.55, splitDrop: 0,
      apply(ps, t) {
        const n = Math.round(clamp(ps.tail ?? 1) * segs);
        parts.forEach((g, i) => { g.visible = i < n; g.rotation.x = (i ? 0.32 : 0.15) + 0.18 * Math.sin(t * 7 + i * 0.9 + (P.spec.phase ?? 0)); });
      },
    };
  },
};
