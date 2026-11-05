import * as THREE from "three";
import { clamp } from "./util.js";
import { steamWisps } from "./steam.js";

// Props for "Bonfire Night" (London clips, 4 Nov 2026; Jonny's 8-panel board in
// /mnt/project-files/video-scripts/2026-11-04-london/): a London rooftop terrace at night over the Thames.
//   parapet      a low brick parapet with a stone coping (origin: its bottom middle; spec.w along x, spec.h, spec.d).
//                Its top is at spec.h + COPING.h: Phoenix stands on it.
//   stringlights warm festoon bulbs on a sagging wire through spec.points ([[x, y, z], ...] from the prop's origin);
//                lit 0..1 (set lit: 1 in the spec: the shared prop state starts at 0), wobble 0..1 swings the wire (the launch's gust).
//   deckchair    a striped canvas deck chair on a wooden frame, facing +z (spec.color, spec.stripe). "sit" works on it.
//   blanket      a tartan blanket over a seated lap (origin: the chair's origin; spec.color, spec.check). fall 0..1:
//                left behind on the chair when the sitter stands (it slumps onto the sling).
//   teamug       a white mug (campmug's size and handle, so the grip library's mug hold fits it); steam 0..1.
//   toffeeapple  a red toffee apple on a wooden stick: origin the stick's bottom, the apple on top (grips thin).
//   sandbucket   a red metal bucket of sand for used sparklers, with a wire bail (origin: its bottom middle). glow
//                0..1: an ember's orange light in the sand; rise 0..1 a small grey ash pile on the sand; open 0..1
//                the pile's two eyes (Phoenix's, blinking when it drops); over 0..1 a tiny black glove giving a thumb
//                up out of the pile's side.
//   firework     a firework burst in the sky (origin: its centre). burst 0..1 runs it: a flash, the stars flying out
//                and slowing, then hanging, drooping and fading. spec.shape: "feather" (a huge blooming crest of
//                curved flame-feather locks, Phoenix's own shape) or "peony" (a plain round shell); spec.size (m,
//                its radius), spec.colors [core, mid, tip].
//   sparktrail   a spiralling trail of golden sparks along spec.path ([[x, y, z], ...] from the origin): len 0..1 is
//                the head's place along it (move it with the flyer), the sparks behind it fade and fall; fade 0..1
//                dims all of it.
//   ember        one small glowing spark (origin its middle): glow 0..1. Move it with x / y / z tweens.
//   crowd        a row of small dark potato silhouettes watching from the embankment (spec.n, spec.w along x);
//                rise 0..1 throws their arms up.
// Lights, sparks, glows and steam are see-through for the checks (userData.steam); the parapet, chair, blanket, mug,
// apple and bucket are solid.
export const COPING = { h: 0.07, over: 0.03 };
export const BUCKET = { r: 0.13, h: 0.22, rim: 0.205 };   // radius at the rim, height, the sand's top

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const glowy = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
let DOT = null;   // a soft round light, shared by every spark sprite
const dotTex = () => (DOT ||= canvasTex(64, 64, (g) => {
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.22, "rgba(255,255,255,0.9)"); r.addColorStop(0.5, "rgba(255,255,255,0.28)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
}));
function spark(parent, color, size) {
  const m = new THREE.SpriteMaterial({ map: dotTex(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  m.userData.noOutline = true;
  const s = new THREE.Sprite(m); s.scale.setScalar(size); glowy(s, 4); parent.add(s); return s;
}
const lerp3 = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
// a point along a polyline at u 0..1 (by length)
function along(pts, u) {
  const L = []; let tot = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(...pts[i].map((v, k) => v - pts[i - 1][k])); L.push(d); tot += d; }
  let s = clamp(u) * tot;
  for (let i = 0; i < L.length; i++) { if (s <= L[i] || i === L.length - 1) return lerp3(pts[i], pts[i + 1], L[i] ? Math.min(1, s / L[i]) : 0); s -= L[i]; }
  return pts[pts.length - 1];
}

export const BONFIRE_KINDS = {
  parapet(P) {
    const S = P.spec, w = S.w ?? 4, h = S.h ?? 0.55, d = S.d ?? 0.3;
    const bricks = canvasTex(512, 256, (g, W, H) => {
      g.fillStyle = "#c9b8a2"; g.fillRect(0, 0, W, H);   // mortar
      const rows = 8, bh = H / rows, bw = W / 4;
      for (let r = 0; r < rows; r++) for (let c = -1; c < 5; c++) {
        const x = c * bw + (r % 2 ? bw / 2 : 0), k = rnd(r * 13 + c * 7 + 3);
        const col = ["#8e3f2c", "#9c4a33", "#83392a", "#a5553a", "#7a3526"][Math.floor(k * 5)];
        g.fillStyle = col; g.fillRect(x + 3, r * bh + 3, bw - 6, bh - 6);
        g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(x + 3, r * bh + bh - 8, bw - 6, 5);   // the shade under each brick
        g.fillStyle = "rgba(255,220,180,0.08)"; g.fillRect(x + 3, r * bh + 3, bw - 6, 4);
      }
    });
    bricks.wrapS = bricks.wrapT = THREE.RepeatWrapping; bricks.repeat.set(w / 0.9, h / 0.5);
    const wall = mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ map: bricks, roughness: 0.9 }), P.whole, 0, h / 2, 0);
    // bricks on the faces, the hidden top and bottom plain
    wall.material = [1, 1, 0, 0, 1, 1].map((k) => new THREE.MeshStandardMaterial({ map: k ? bricks : null, color: k ? "#ffffff" : "#8d4430", roughness: 0.9 }));
    mesh(new THREE.BoxGeometry(w + 2 * COPING.over, COPING.h, d + 2 * COPING.over), mat("#b9b2a6", { roughness: 0.85 }), P.whole, 0, h + COPING.h / 2, 0);
    return { grip: h + COPING.h };
  },

  stringlights(P) {
    const S = P.spec, pts = (S.points || [[-1, 1.2, 0], [1, 1.2, 0]]).map((p) => new THREE.Vector3(...p)), sag = S.sag ?? 0.12, per = S.bulbs ?? 6;
    const wireM = mat("#1c1a1e", { roughness: 0.6 }), bulbM = new THREE.MeshBasicMaterial({ color: S.color ?? "#ffd27a" }); bulbM.userData.noOutline = true;
    const spans = [];
    for (let i = 0; i + 1 < pts.length; i++) {
      const g = new THREE.Group(); P.whole.add(g);
      const a = pts[i], b = pts[i + 1];
      const curve = new THREE.CatmullRomCurve3(Array.from({ length: 13 }, (_, k) => { const u = k / 12; return a.clone().lerp(b, u).add(new THREE.Vector3(0, -sag * 4 * u * (1 - u), 0)); }));
      const wire = mesh(new THREE.TubeGeometry(curve, 24, 0.004, 5, false), wireM, g); wire.castShadow = false;
      const bulbs = [];
      for (let k = 0; k < per; k++) {
        const u = (k + 0.5) / per, p = curve.getPoint(u);
        const br = S.bulb ?? 0.03;
        const bulb = glowy(mesh(new THREE.SphereGeometry(br, 10, 8), bulbM, g, p.x, p.y - 0.03, p.z), 3); bulb.scale.y = 1.25;
        const halo = spark(g, S.color ?? "#ffb54a", br * 12); halo.position.set(p.x, p.y - 0.03, p.z); halo.material.opacity = 0.7;
        bulbs.push({ bulb, halo, u, phase: rnd(i * 31 + k) * 6.28 });
      }
      // a span swings about the line between its two ends
      g.userData.axis = b.clone().sub(a).normalize(); g.userData.pivot = a.clone().lerp(b, 0.5);
      spans.push({ g, bulbs, a });
    }
    // spec.poles: a thin black pole under each end point, down to spec.poleBase (the coping top), so the wire hangs
    // from something
    if (S.poles) for (const p of [pts[0], pts[pts.length - 1]]) { const len = p.y - (S.poleBase ?? 0); mesh(new THREE.CylinderGeometry(0.012, 0.014, len, 8), wireM, P.whole, p.x, p.y - len / 2, p.z); }
    return {
      grip: 0,
      apply(ps, t) {
        const lit = clamp(ps.lit ?? 1), w = clamp(ps.wobble);
        spans.forEach(({ g, bulbs, a }, i) => {
          const ang = w * 0.45 * Math.sin((t ?? 0) * 7.5 + i * 1.3);
          g.position.set(0, 0, 0); g.quaternion.setFromAxisAngle(g.userData.axis, ang);
          // keep the ends on their hooks: turn about the line through the span's ends
          const off = a.clone().sub(a.clone().applyQuaternion(g.quaternion)); g.position.copy(off);
          for (const b of bulbs) { const f = 0.88 + 0.12 * Math.sin((t ?? 0) * 2.1 + b.phase); b.bulb.visible = true; b.bulb.material.color.set(lit > 0.5 ? (S.color ?? "#ffd27a") : "#6b5a3a"); b.halo.visible = lit > 0.01; b.halo.material.opacity = 0.7 * lit * f; }
        });
      },
    };
  },

  deckchair(P) {
    const S = P.spec, wood = mat("#b07a45", { roughness: 0.65 });
    const W = 0.5, stripe = canvasTex(256, 64, (g, w, h) => {
      const cols = S.stripes || [S.color ?? "#c8362f", S.stripe ?? "#f2ebe0"];
      for (let i = 0; i < 8; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect((i * w) / 8, 0, w / 8 + 1, h); }
    });
    const cloth = new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.85, side: THREE.DoubleSide });
    // the sling: from the front rail (low, forward) down into a seat hollow at SEAT height and up the slanted back
    const prof = [[0.34, 0.47], [0.2, 0.42], [0.04, 0.4], [-0.1, 0.44], [-0.22, 0.62], [-0.32, 0.86]];
    const curve = new THREE.CatmullRomCurve3(prof.map(([z, y]) => new THREE.Vector3(0, y, z)));
    const geo = new THREE.PlaneGeometry(W - 0.06, 1, 1, 24), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const u = 0.5 - pos.getY(i), p = curve.getPoint(clamp(u)); pos.setXYZ(i, pos.getX(i), p.y, p.z); }
    geo.computeVertexNormals();
    const sling = mesh(geo, cloth, P.whole); sling.castShadow = true;
    for (const s of [-1, 1]) {
      // the back frame (rails up the back), the front legs, and the long arm-height side bar
      const back = mesh(new THREE.BoxGeometry(0.03, 1.0, 0.03), wood, P.whole, s * W / 2, 0.45, -0.18); back.rotation.x = -0.42;
      const front = mesh(new THREE.BoxGeometry(0.03, 0.62, 0.03), wood, P.whole, s * (W / 2 - 0.035), 0.3, 0.26); front.rotation.x = 0.55;
      const bar = mesh(new THREE.BoxGeometry(0.025, 0.025, 0.66), wood, P.whole, s * W / 2, 0.47, 0.04); bar.rotation.x = -0.12;
    }
    for (const [y, z] of [[0.47, 0.34], [0.86, -0.32], [0.04, -0.4]]) { const r = mesh(new THREE.CylinderGeometry(0.014, 0.014, W, 8), wood, P.whole, 0, y, z); r.rotation.z = Math.PI / 2; }
    return { grip: 0.42 };
  },

  blanket(P) {
    const S = P.spec, tartan = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = S.color ?? "#3c4a6b"; g.fillRect(0, 0, w, h);
      const lines = [[S.check ?? "#b0393a", 22, 0.85], ["#2a2f40", 46, 0.6], ["#d9c9a3", 6, 0.7]];
      for (const [c, wd, a] of lines) for (let k = 0; k < 4; k++) { g.globalAlpha = a * 0.6; g.fillStyle = c; g.fillRect(k * 64 + 20, 0, wd / 2, h); g.fillRect(0, k * 64 + 20, w, wd / 2); }
      g.globalAlpha = 1;
    });
    tartan.wrapS = tartan.wrapT = THREE.RepeatWrapping; tartan.repeat.set(2, 2);
    const m = new THREE.MeshStandardMaterial({ map: tartan, roughness: 0.95, side: THREE.DoubleSide });
    // the draped sheet: across the lap (a dome over the knees), then hanging off the front; fringe at the hem
    const geo = new THREE.PlaneGeometry(0.62, 0.62, 16, 20), pos = geo.attributes.position, base = [];
    for (let i = 0; i < pos.count; i++) base.push([pos.getX(i), pos.getY(i)]);
    const sheet = mesh(geo, m, P.whole);
    const shape = (f) => {
      for (let i = 0; i < pos.count; i++) {
        const [x, y] = base[i], u = 0.5 - y / 0.62;   // 0 at the waist .. 1 at the hem
        const xs = x * (1 + 0.15 * u);
        // on the lap: from the waist forward over the knees, then down the shins
        const lapY = 0.62 - 0.1 * Math.min(1, u * 2.2) - 0.42 * Math.max(0, u - 0.45) / 0.55, lapZ = 0.06 + 0.42 * Math.min(1, u * 1.6) - 0.05 * Math.max(0, u - 0.6);
        const dome = 0.06 * Math.cos(Math.min(1, Math.abs(xs) / 0.32) * Math.PI / 2) * Math.sin(Math.PI * Math.min(1, u * 1.5));
        // left behind: it slumps onto the sling and over the front rail
        const seatY = 0.47 - 0.02 * Math.min(1, u * 2) - 0.36 * Math.max(0, u - 0.55) / 0.45, seatZ = -0.05 + 0.42 * Math.min(1, u * 1.4);
        pos.setXYZ(i, xs, (lapY + dome) * (1 - f) + (seatY + dome * 0.3) * f, lapZ * (1 - f) + seatZ * f);
      }
      pos.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingBox(); geo.computeBoundingSphere();
    };
    let last = -1;
    return { grip: 0.5, apply(ps) { const f = clamp(ps.fall); if (f !== last) { shape(f); last = f; } } };
  },

  teamug(P) {
    const china = mat(P.spec.color ?? "#f4f1ea", { roughness: 0.35 }), tea = mat("#7a4a22", { roughness: 0.2 });
    const cup = mesh(new THREE.CylinderGeometry(0.045, 0.042, 0.085, 24, 1, true), china, P.whole, 0, 0.0425, 0); cup.material.side = THREE.DoubleSide;
    mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.004, 24), china, P.whole, 0, 0.002, 0);
    const top = mesh(new THREE.CircleGeometry(0.043, 24), tea, P.whole, 0, 0.07, 0); top.rotation.x = -Math.PI / 2; top.castShadow = false;
    const h = mesh(new THREE.TorusGeometry(0.026, 0.007, 8, 18, Math.PI), china, P.whole, 0.045, 0.045, 0); h.rotation.z = -Math.PI / 2;
    const steam = steamWisps(P.whole, 0.09);
    return { grip: 0.04, apply(ps, t) { steam(ps.steam, t); } };
  },

  toffeeapple(P) {
    const stick = mat("#c99a62", { roughness: 0.8 });
    mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 8), stick, P.whole, 0, 0.1, 0);
    const apple = mesh(new THREE.SphereGeometry(0.05, 20, 14), mat("#b3121c", { roughness: 0.12, metalness: 0.05 }), P.whole, 0, 0.235, 0); apple.scale.y = 0.92;
    // the toffee's glossy drip round the bottom and a bite out of one side
    const drip = mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 20), mat("#8f0d16", { roughness: 0.1 }), P.whole, 0, 0.198, 0); drip.rotation.x = Math.PI / 2;
    const bite = mesh(new THREE.SphereGeometry(0.022, 10, 8), mat("#f3e2b6", { roughness: 0.6 }), P.whole, 0.04, 0.25, 0.018); bite.scale.set(0.35, 1, 1); bite.visible = !!P.spec.bitten;
    return { grip: 0.1 };
  },

  // the roof terrace's paving: square concrete slabs in a staggered bond, each a slightly different grey, with dark
  // joints and a few stains (spec.w x spec.d, spec.tile: slab size in m); laid flat just above the set's floor
  paving(P) {
    const S = P.spec, w = S.w ?? 6, d = S.d ?? 4, tile = S.tile ?? 0.45;
    const nx = Math.round(w / tile), nz = Math.round(d / tile), px = 64;
    const tex = canvasTex(nx * px, nz * px, (g) => {
      g.fillStyle = "#1d1b26"; g.fillRect(0, 0, nx * px, nz * px);
      for (let j = 0; j < nz; j++) for (let i = -1; i <= nx; i++) {
        const off = j % 2 ? px / 2 : 0, v = rnd(i * 7 + j * 131) * 0.18 - 0.09;
        const base = [92, 88, 112].map((c) => Math.round(c * (1 + v)));
        g.fillStyle = `rgb(${base})`; g.fillRect(i * px + off + 2, j * px + 2, px - 4, px - 4);
        if (rnd(i * 13 + j * 17) > 0.8) { g.fillStyle = "rgba(20,18,30,0.18)"; g.beginPath(); g.ellipse(i * px + off + px * 0.5, j * px + px * 0.5, px * 0.3, px * 0.18, rnd(i + j) * 3, 0, 6.28); g.fill(); }
      }
    });
    const m = mat("#ffffff", { roughness: 0.95 }); m.map = tex;
    const floor = mesh(new THREE.PlaneGeometry(w, d), m, P.whole, 0, 0.002, 0); floor.rotation.x = -Math.PI / 2; floor.castShadow = false;
    floor.userData.steam = true;   // the floor itself: never something a hand or foot goes "into"
    return { grip: 0, apply() {} };
  },

  sandbucket(P) {
    const S = P.spec, { r, h } = BUCKET;
    const prof = [[0, 0], [r * 0.8, 0], [r * 0.82, 0.01], [r, h], [r + 0.008, h + 0.006], [r - 0.004, h + 0.006], [r * 0.8 - 0.006, 0.012], [0, 0.012]];
    const red = mat(S.color ?? "#c8261e", { roughness: 0.35, metalness: 0.35 });
    const body = mesh(new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 40), red, P.whole); body.material.side = THREE.DoubleSide;
    for (const y of [0.05, 0.16]) { const ring = mesh(new THREE.TorusGeometry(r * (0.8 + 0.2 * (y / h)) + 0.003, 0.004, 6, 40), red, P.whole, 0, y, 0); ring.rotation.x = Math.PI / 2; ring.castShadow = false; }
    // the sand, a few sparkler wires stuck in it
    const sand = mesh(new THREE.CircleGeometry(r - 0.012, 32), mat("#c9a46a", { roughness: 1 }), P.whole, 0, BUCKET.rim, 0); sand.rotation.x = -Math.PI / 2;
    const wireM = mat("#5a5a60", { roughness: 0.5, metalness: 0.6 }), wiresG = new THREE.Group(); P.whole.add(wiresG);
    for (let i = 0; i < 4; i++) { const a = 1.2 + i * 1.3, rr = 0.05 + rnd(i + 2) * 0.05; const w = mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.1, 5), wireM, wiresG, Math.cos(a) * rr, BUCKET.rim + 0.035, Math.sin(a) * rr * 0.7 - 0.04); w.rotation.set(0.2 * Math.sin(a), 0, 0.25 * Math.cos(a)); w.castShadow = false; }
    // the bail: a wire hoop over the top along x, resting folded down to the back unless held up
    const wire = mat("#2a2a30", { roughness: 0.35, metalness: 0.6 }), bail = new THREE.Group(); bail.position.set(0, h - 0.02, 0); P.whole.add(bail);
    mesh(new THREE.TorusGeometry(r + 0.01, 0.004, 6, 30, Math.PI), wire, bail).castShadow = false;
    bail.rotation.x = -1.2;
    for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.012, 8, 6), wire, P.whole, s * (r + 0.004), h - 0.02, 0);
    // the ash pile with Phoenix's eyes and a tiny thumb up
    const pileG = new THREE.Group(); pileG.position.set(0, BUCKET.rim, 0.01); P.whole.add(pileG);
    const ash = mat("#8f8b93", { roughness: 1 }), dark = mat("#66626c", { roughness: 1 });
    const pile = mesh(new THREE.SphereGeometry(0.095, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), ash, pileG); pile.scale.set(1, 0.9, 0.9);
    for (let i = 0; i < 6; i++) { const a = rnd(i + 9) * 6.28, rr = 0.06 + rnd(i + 4) * 0.03; mesh(new THREE.SphereGeometry(0.012 + rnd(i) * 0.008, 6, 4), i % 2 ? dark : ash, pileG, Math.cos(a) * rr, 0.004, Math.sin(a) * rr * 0.8); }
    const eyeTex = (open) => canvasTex(256, 128, (g) => {
      for (const s of [-1, 1]) {
        const cx = 128 + s * 46, cy = 66;
        if (open) {
          g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(cx, cy, 30, 40, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = "#3b1a0e"; g.beginPath(); g.ellipse(cx + 2, cy + 6, 22, 30, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = "#120806"; g.beginPath(); g.ellipse(cx + 2, cy + 8, 11, 15, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(cx - 7, cy - 6, 8, 10, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(cx + 10, cy + 18, 4, 4, 0, 0, Math.PI * 2); g.fill();
          g.strokeStyle = "#1a1416"; g.lineWidth = 7; g.beginPath(); g.ellipse(cx, cy, 30, 40, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
        } else { g.strokeStyle = "#1a1416"; g.lineWidth = 8; g.lineCap = "round"; g.beginPath(); g.arc(cx, cy - 4, 26, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
      }
    });
    const eyesOpen = eyeTex(true), eyesShut = eyeTex(false);
    const em = new THREE.MeshBasicMaterial({ map: eyesOpen, transparent: true, depthWrite: false }); em.userData.noOutline = true;
    // the face looks out of the bucket's -z side: held with rot = the holder's yaw + 180, that is the side away from the holder
    const eyes = mesh(new THREE.PlaneGeometry(0.15, 0.075), em, pileG, 0, 0.055, -0.07); eyes.castShadow = false; eyes.rotation.set(0.55, Math.PI, 0); eyes.renderOrder = 2;
    // the thumb: a tiny black glove, the fist out of the pile's side and the thumb pointing up
    const glove = mat("#1c1b22", { roughness: 0.5 }), thumbG = new THREE.Group(); thumbG.position.set(-0.088, 0.03, -0.035); pileG.add(thumbG);
    const fist = mesh(new THREE.SphereGeometry(0.026, 12, 10), glove, thumbG); fist.scale.set(1.1, 0.9, 0.9);
    const th = mesh(new THREE.CapsuleGeometry(0.0085, 0.022, 4, 8), glove, thumbG, -0.005, 0.032, 0.005);
    // the ember glow in the sand (point light-like halo + a hot core)
    const glow = spark(P.whole, "#ff8a2a", 0.34); glow.position.set(0, BUCKET.rim + 0.04, 0.02);
    const core = glowy(mesh(new THREE.SphereGeometry(0.018, 10, 8), new THREE.MeshBasicMaterial({ color: "#ffb347" }), P.whole, 0, BUCKET.rim + 0.012, 0.02), 4); core.material.userData.noOutline = true;
    return {
      grip: h,
      apply(ps, t) {
        const g = clamp(ps.glow), rise = clamp(ps.rise), o = clamp(ps.open), up = clamp(ps.over);
        glow.visible = g > 0.01; glow.material.opacity = 0.9 * g * (0.8 + 0.2 * Math.sin((t ?? 0) * 13) * Math.sin((t ?? 0) * 5.1)); glow.scale.setScalar(0.22 + 0.38 * g);
        core.visible = g > 0.05 && rise < 0.5; core.scale.setScalar(0.5 + 0.6 * g);
        pileG.visible = rise > 0.01; pileG.scale.setScalar(Math.max(0.01, rise)); wiresG.visible = rise < 0.3;   // the ember burnt the old sparklers away
        eyes.visible = o > 0.02; em.map = o > 0.5 ? eyesOpen : eyesShut; eyes.scale.y = 0.3 + 0.7 * Math.max(o, 0.4);
        thumbG.visible = up > 0.02; thumbG.scale.setScalar(Math.max(0.01, up * 1.6)); thumbG.position.y = 0.03 + 0.05 * up; thumbG.rotation.z = -0.6 * (1 - up);   // big enough to read on a phone, standing up out of the pile
      },
    };
  },

  firework(P) {
    const S = P.spec, size = S.size ?? 6, [cCore, cMid, cTip] = S.colors || ["#fff1b8", "#ffb13b", "#ff4a1c"], shape = S.shape || "peony", seed = S.seed ?? 1;
    const stars = []; let crest = null;
    const add = (dir, col, sz, delay = 0, droop = 1) => stars.push({ s: spark(P.whole, col, sz), dir, delay, droop, tw: rnd(seed * 97 + stars.length) * 6.28 });
    if (shape === "feather") {
      // seven curved flame-feather locks fanning up and out from the centre (Phoenix's crest, blown up into the sky),
      // each a dense ribbon of stars: gold at its root, orange along it, red at its curled tip
      const locks = 7;
      for (let l = 0; l < locks; l++) {
        const a0 = -1.25 + (2.5 * l) / (locks - 1), len = 0.75 + 0.25 * Math.cos(a0 * 0.9), curl = 0.55 * Math.sign(a0 || 0.1) + 0.15;
        for (let k = 0; k < 34; k++) {
          const u = (k + 0.5) / 34, ang = a0 + curl * u * u, rr = len * u;
          const w = 0.11 * Math.sin(Math.PI * Math.min(1, u * 1.2)) * len;   // the lock's width, widest in its middle
          for (const side of [-1, 0, 1]) {
            const off = side * w * (0.5 + 0.5 * rnd(seed + l * 300 + k * 3 + side));
            const x = Math.sin(ang) * rr + Math.cos(ang) * off, y = Math.cos(ang) * rr - Math.sin(ang) * off;
            add([x, y + 0.05, (rnd(l * 50 + k + side) - 0.5) * 0.15], u < 0.3 ? cCore : u < 0.75 ? cMid : cTip, (side ? 0.05 : 0.075) * size, u * 0.12, 0.6);
          }
        }
      }
      // red sparks scattered round it, and a short gold stem below (the rocket's last metre)
      for (let i = 0; i < 70; i++) { const a = rnd(seed * 3 + i) * 6.28, rr = 0.75 + 0.45 * rnd(seed * 5 + i); add([Math.cos(a) * rr, Math.sin(a) * rr * 0.85 + 0.2, (rnd(i + 2) - 0.5) * 0.3], i % 3 ? cTip : "#ff7ab0", 0.035 * size, 0.08 + 0.1 * rnd(i), 1.2); }
      for (let k = 0; k < 10; k++) add([0, -0.06 * k, 0], cCore, 0.04 * size, 0, 0);
      // the crest itself, drawn: broad flame-feather plumes sweeping up and to the right like Phoenix's wing (Jonny's
      // panel 5), so it reads as a shape and not as a round shell; the stars sparkle over it
      const tex = canvasTex(1024, 1024, (g) => {
        const base = [470, 820];
        const plumes = [[-62, 0.62, 0.55], [-40, 0.8, 0.62], [-18, 0.94, 0.7], [4, 1.0, 0.75], [24, 0.96, 0.78], [44, 0.86, 0.8], [62, 0.7, 0.78], [78, 0.52, 0.7]];
        g.globalCompositeOperation = "lighter";
        for (const [deg, len, curl] of plumes) {
          const a = (deg * Math.PI) / 180, L = 640 * len, wmax = 70 + 30 * len;
          const pts = [];
          for (let i = 0; i <= 40; i++) {
            const u = i / 40, ang = a + curl * u * u, rr = L * u;
            pts.push([base[0] + Math.sin(ang) * rr, base[1] - Math.cos(ang) * rr, ang, Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 0.8 * wmax * (1 - 0.35 * u)]);
          }
          const tip = pts[pts.length - 1], grad = g.createLinearGradient(base[0], base[1], tip[0], tip[1]);
          grad.addColorStop(0, "rgba(255,241,184,0.95)"); grad.addColorStop(0.35, "rgba(255,190,70,0.85)"); grad.addColorStop(0.75, "rgba(255,110,30,0.75)"); grad.addColorStop(1, "rgba(220,40,20,0.0)");
          g.fillStyle = grad; g.shadowColor = "rgba(255,150,40,0.9)"; g.shadowBlur = 40;
          g.beginPath();
          for (const [x, y, ang, w] of pts) g.lineTo(x + Math.cos(ang) * w * 0.5, y + Math.sin(ang) * w * 0.5);
          for (const [x, y, ang, w] of pts.slice().reverse()) g.lineTo(x - Math.cos(ang) * w * 0.5, y - Math.sin(ang) * w * 0.5);
          g.closePath(); g.fill();
          // the feather's vane lines: thin bright strokes along its middle
          g.shadowBlur = 0; g.strokeStyle = "rgba(255,248,214,0.55)"; g.lineWidth = 5; g.beginPath();
          for (const [x, y] of pts.slice(0, 34)) g.lineTo(x, y); g.stroke();
        }
      });
      const crestM = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide });
      crestM.userData.noOutline = true;
      crest = glowy(mesh(new THREE.PlaneGeometry(size * 2.3, size * 2.3), crestM, P.whole, 0.18 * size, 0.62 * size, -0.05), 3);
    } else {
      const n = S.n ?? 90;
      for (let i = 0; i < n; i++) {
        const u = rnd(seed * 11 + i) * 2 - 1, a = rnd(seed * 13 + i) * 6.28, q = Math.sqrt(1 - u * u);
        add([Math.cos(a) * q, u, Math.sin(a) * q * 0.4], i % 4 ? cMid : cTip, S.star ?? 0.06 * size, 0, 1);   // spec.star: the star's size (m), so a far, small shell still shows
      }
      for (let i = 0; i < 6; i++) add([0, 0, 0], cCore, (S.star ?? 0.06 * size) * 2, 0, 0);
    }
    const flash = spark(P.whole, cCore, size * 1.2);
    return {
      grip: 0,
      apply(ps, t) {
        const b = clamp(ps.burst), on = b > 0.001 && b < 0.999;
        flash.visible = on && b < 0.18; flash.material.opacity = 0.75 * (1 - b / 0.18);
        if (crest) {
          const grow = 1 - Math.pow(1 - clamp((b - 0.02) / 0.3), 3), fade = b < 0.05 ? b / 0.05 : 1 - clamp((b - 0.5) / 0.45);
          crest.visible = on && grow > 0.01; crest.scale.setScalar(Math.max(0.01, 0.15 + 0.85 * grow));
          crest.position.y = (0.62 * grow - Math.max(0, b - 0.45) ** 2 * 0.3) * size;
          crest.material.opacity = 0.95 * fade * (0.9 + 0.1 * Math.sin((t ?? 0) * 17)) * (1 - clamp(ps.fade));
        }
        for (const st of stars) {
          st.s.visible = on;
          if (!on) continue;
          const local = clamp((b - st.delay * 0.4) / (1 - st.delay * 0.4));
          const out = 1 - Math.pow(1 - clamp(local / 0.45), 3);   // flies out fast, slows to a hang
          const fall = Math.max(0, local - 0.35) ** 2 * 0.35 * st.droop;
          st.s.position.set(st.dir[0] * size * out, st.dir[1] * size * out - fall * size, st.dir[2] * size * out);
          const tw = 0.75 + 0.25 * Math.sin((t ?? 0) * 23 + st.tw), fade = local < 0.05 ? local / 0.05 : 1 - clamp((local - 0.55) / 0.45);
          st.s.material.opacity = Math.min(0.95, fade * tw * (1 - clamp(ps.fade)));
        }
      },
    };
  },

  sparktrail(P) {
    const S = P.spec, pts = S.path || [[0, 0, 0], [0, 3, 0]], n = S.n ?? 120, turns = S.turns ?? 3, rad = S.radius ?? 0.25, tail = S.tail ?? 0.5;
    const cols = S.colors || ["#fff3c2", "#ffc94a", "#ff8a1e"];
    const sp = Array.from({ length: n }, (_, i) => ({ s: spark(P.whole, cols[i % 3], (S.size ?? 0.12) * (0.6 + 0.6 * rnd(i + 5))), u: i / (n - 1), j: [rnd(i) - 0.5, rnd(i + 1) - 0.5, rnd(i + 2) - 0.5] }));
    return {
      grip: 0,
      apply(ps, t) {
        const head = clamp(ps.len), f = 1 - clamp(ps.fade);
        for (const p of sp) {
          const age = head - p.u, on = age >= 0 && age < tail && f > 0.01 && head > 0;
          p.s.visible = on; if (!on) continue;
          const c = along(pts, p.u), a = p.u * turns * Math.PI * 2, r = rad * (0.4 + 0.6 * Math.min(1, age * 6));
          // the spiral round the path, the sparks drifting out and down as they age
          p.s.position.set(c[0] + Math.cos(a) * r + p.j[0] * age * 0.6, c[1] - age * age * 1.4 + p.j[1] * age * 0.3, c[2] + Math.sin(a) * r * 0.6 + p.j[2] * age * 0.4);
          p.s.material.opacity = Math.min(0.95, f * (1 - age / tail) * (0.7 + 0.3 * Math.sin((t ?? 0) * 31 + p.u * 50)));
        }
      },
    };
  },

  ember(P) {
    const halo = spark(P.whole, "#ff9a3a", P.spec.size ?? 0.16), core = glowy(mesh(new THREE.SphereGeometry((P.spec.size ?? 0.16) * 0.075, 8, 6), new THREE.MeshBasicMaterial({ color: "#ffe2a0" }), P.whole), 4);
    core.material.userData.noOutline = true;
    return { grip: 0, apply(ps, t) { const g = clamp(ps.glow); halo.visible = core.visible = g > 0.01; halo.material.opacity = 0.9 * g * (0.8 + 0.2 * Math.sin((t ?? 0) * 19)); core.scale.setScalar(0.4 + 0.6 * g); } };
  },

  // the dark display barge out on the river (origin its waterline middle, length spec.w along x): a long low hull, a
  // flat deck with the launch racks, a few small work lights
  barge(P) {
    const S = P.spec, w = S.w ?? 3, dark = new THREE.MeshBasicMaterial({ color: "#0e1018" }); dark.userData.noOutline = true;
    const hull = new THREE.Mesh(new THREE.BoxGeometry(w, 0.28, 0.6), dark); hull.position.y = 0.1; P.whole.add(hull);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(w * 0.22, 0.22, 0.4), dark); cab.position.set(-w * 0.32, 0.35, 0); P.whole.add(cab);
    for (let i = 0; i < 5; i++) { const rack = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.3), dark); rack.position.set(-w * 0.1 + i * w * 0.11, 0.31, 0); P.whole.add(rack); }
    for (let i = 0; i < 4; i++) { const l = spark(P.whole, i % 2 ? "#ffd27a" : "#ff6a4a", 0.12); l.position.set(-w * 0.45 + i * w * 0.3, 0.3, 0.31); l.material.opacity = 0.7; }
    return { grip: 0 };
  },

  crowd(P) {
    const S = P.spec, n = S.n ?? 24, w = S.w ?? 8, dark = new THREE.MeshBasicMaterial({ color: S.color ?? "#12131f" }); dark.userData.noOutline = true;
    const people = [];
    for (let i = 0; i < n; i++) {
      const g = new THREE.Group(), x = -w / 2 + (w * (i + 0.5 + (rnd(i) - 0.5) * 0.7)) / n, s = 0.8 + 0.4 * rnd(i + 40);
      g.position.set(x, 0, (rnd(i + 80) - 0.5) * 0.4); g.scale.setScalar(s); P.whole.add(g);
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), dark); body.scale.set(0.95, 1.2, 0.8); body.position.y = 0.26; g.add(body);
      const sprout = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 6), dark); sprout.position.y = 0.55; g.add(sprout);
      const arms = [-1, 1].map((sd) => { const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.2, 3, 6), dark); a.geometry.translate(0, 0.12, 0); a.position.set(sd * 0.18, 0.3, 0); g.add(a); return [a, sd]; });
      people.push({ g, arms, ph: rnd(i + 7) * 6.28, cheer: 0.6 + 0.4 * rnd(i + 9) });
    }
    return {
      grip: 0,
      apply(ps, t) {
        const r = clamp(ps.rise);
        for (const p of people) {
          const k = r * p.cheer, bob = 0.03 * r * Math.max(0, Math.sin((t ?? 0) * 9 + p.ph));
          p.g.position.y = bob;
          for (const [a, sd] of p.arms) a.rotation.z = sd * (2.6 - 2.2 * k) + 0.15 * r * Math.sin((t ?? 0) * 8 + p.ph + sd);
        }
      },
    };
  },
};
