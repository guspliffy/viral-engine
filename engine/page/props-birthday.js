import * as THREE from "three";
import { clamp, rng } from "./util.js";
import { mat, basic, mesh, canvasTex } from "./props-trend.js";

// "That one friend who never has money… at your birthday" (never has money, episode 4, 8 Nov 2026): Viking's party in
// a cosy wooden living room. Jonny's eight panels: a huge purple present with a gold bow (a little smiley on its knot),
// a small black box with a silver ribbon, paper party cones (Viking's blue with yellow dots, Gunslinger's red and yellow
// stripes on top of his cowboy hat), a gold rosette on Viking's chest, a hand-made "FREE HUG" coupon, a cake on a side
// table with a purple cloth.
//   giftbox    a wrapped present (w 0.3, h 0.24, d 0.3 before its scale: the grip library's size): glossy paper
//              (spec.color) with glitter flecks, a ribbon cross (spec.ribbon), a big bow on top: two loops, two tails, a
//              knot (spec.smile: a little smiley face on the knot). spec.top: a second box stacked on it ({ w, h, d, color,
//              ribbon, rot } in metres of the scaled box), shown by `stack` 0..1: it stands in for a real box prop while
//              the stack is carried (the same size and look, swapped on one frame). Origin: its bottom middle.
//   partyhat   a paper party cone (spec.r 0.075 at the rim, spec.h 0.2) in spec.color with spec.color2 stripes or dots
//              (spec.pattern), a pompom on its tip (spec.pom). Worn (spec.wear) in the wearer's body frame; its origin is
//              the middle of its rim.
//   coupon     a hand-made coupon: a sheet of cream paper (spec.w 0.24, spec.h 0.19) standing on its bottom edge (origin:
//              the middle of that edge), its drawing on +z: a wobbly red border, "FREE HUG" in brown marker capitals and a
//              doodle of two potatoes hugging between two hearts. `write` 0..1 draws it stroke by stroke (the scribble);
//              `unfold` 0..1 opens it from folded in half (0: folded, as it comes out of his bandana). spec.away:
//              the drawing on -z (away from a holder who holds it the grip library's way).
//   blowout    a paper party blower in the Wizard's mouth: a mouthpiece at the origin pointing +z, and a purple and gold
//              striped paper tube that unrolls straight out along +z with `len` 0..1 (0: a tight curl under it).
//   rosette    a gold rosette (a pleated ring, a button with a star, two ribbon tails), facing +z (worn on Viking's chest).
//   sidetable  a small round wooden side table (spec.r 0.3, spec.h 0.4) under a cloth (spec.cloth) with a lace hem.
//   floorscrap a little paper offcut lying on the rug (spec.r: a few paper bits and confetti, the party's leftovers).
export const BIRTHDAY = { gift: { w: 0.3, h: 0.24, d: 0.3 }, coupon: { w: 0.24, h: 0.19 }, hat: { r: 0.075, h: 0.2 } };

// glossy wrapping paper: the colour with a soft diagonal sheen and glitter flecks
function paperTex(color, { seed = 3, glitter = 1 } = {}) {
  return canvasTex(256, 256, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "rgba(255,255,255,0.10)"); gr.addColorStop(0.45, "rgba(255,255,255,0)"); gr.addColorStop(0.55, "rgba(0,0,0,0.06)"); gr.addColorStop(1, "rgba(255,255,255,0.08)");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260 * glitter; i++) { const a = 0.25 + r() * 0.6; g.fillStyle = r() < 0.7 ? `rgba(255,236,190,${a})` : `rgba(255,255,255,${a})`; const s = 1 + r() * 2.2; g.fillRect(r() * w, r() * h, s, s); }
  });
}

// a box of wrapped paper with a ribbon cross and a bow, built into `parent` at y 0 (bottom middle)
function wrapped(parent, { w, h, d, color, ribbon, seed, glitter = 1, bow = 1, smile = false, rot = 0 }) {
  const g = new THREE.Group(); g.rotation.y = (rot * Math.PI) / 180; parent.add(g);
  const pm = mat("#ffffff", { map: paperTex(color, { seed, glitter }), roughness: 0.38, metalness: 0.08 });
  const rm = mat(ribbon, { roughness: 0.3, metalness: 0.35 });
  mesh(new THREE.BoxGeometry(w, h, d), pm, g, 0, h / 2, 0);
  const bw = Math.min(w, d) * 0.16, t = 0.004;
  mesh(new THREE.BoxGeometry(w + t, h + t, bw), rm, g, 0, h / 2, 0);
  mesh(new THREE.BoxGeometry(bw, h + t, d + t), rm, g, 0, h / 2, 0);
  // the bow: two loops leaning out, two tails lying on the lid, the knot in the middle
  const s = bow * Math.min(w, d) / 0.3;
  for (const sd of [-1, 1]) {
    const loop = mesh(new THREE.TorusGeometry(0.06 * s, 0.017 * s, 10, 24), rm, g, sd * 0.055 * s, h + 0.05 * s, 0);
    loop.rotation.set(0, Math.PI / 2, sd * 0.55); loop.scale.set(1, 0.8, 0.55);
    const tail = mesh(new THREE.BoxGeometry(0.11 * s, 0.006, 0.045 * s), rm, g, sd * 0.07 * s, h + 0.006, sd * 0.05 * s);
    tail.rotation.set(0, sd * 0.6, 0);
  }
  const knot = mesh(new THREE.SphereGeometry(0.03 * s, 14, 10), rm, g, 0, h + 0.022 * s, 0); knot.scale.set(1.15, 0.9, 1.0);
  if (smile) {
    // a tiny happy face on the knot (Jonny's panel 1): two dot eyes and a smile, on a little disc facing +z
    const ft = canvasTex(64, 64, (c, W, H) => { c.clearRect(0, 0, W, H); c.fillStyle = "#5a3a10"; c.beginPath(); c.arc(W * 0.36, H * 0.42, 4, 0, 7); c.arc(W * 0.64, H * 0.42, 4, 0, 7); c.fill(); c.strokeStyle = "#5a3a10"; c.lineWidth = 4; c.lineCap = "round"; c.beginPath(); c.arc(W / 2, H * 0.5, 13, 0.35, Math.PI - 0.35); c.stroke(); });
    const fm = basic({ map: ft, transparent: true, depthWrite: false }); fm.userData.noOutline = true;
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.05 * s, 0.05 * s), fm); f.position.set(0, h + 0.024 * s, 0.031 * s); f.castShadow = false; f.userData.solid = false; g.add(f);
  }
  return g;
}

// a stroke-drawn capital (unit box: x 0..1 right, y 0..1 down) as polylines; the hand draws them in this order
const LETTERS = {
  F: [[[0.05, 0], [0.05, 1]], [[0.05, 0.02], [0.82, 0.02]], [[0.05, 0.48], [0.62, 0.48]]],
  R: [[[0.05, 1], [0.05, 0]], [[0.05, 0.01], [0.55, 0.01], [0.78, 0.12], [0.8, 0.3], [0.6, 0.47], [0.05, 0.48]], [[0.38, 0.48], [0.85, 1]]],
  E: [[[0.8, 0.02], [0.05, 0.02], [0.05, 0.98], [0.82, 0.98]], [[0.05, 0.5], [0.62, 0.5]]],
  H: [[[0.05, 0], [0.05, 1]], [[0.8, 0], [0.8, 1]], [[0.05, 0.5], [0.8, 0.5]]],
  U: [[[0.05, 0], [0.05, 0.68], [0.15, 0.92], [0.42, 1.0], [0.68, 0.92], [0.8, 0.68], [0.8, 0]]],
  G: [[...Array.from({ length: 14 }, (_, i) => { const a = (-40 - (i * 290) / 13) * (Math.PI / 180); return [0.45 + 0.42 * Math.cos(a), 0.5 - 0.5 * Math.sin(a)]; })], [[0.84, 0.66], [0.84, 0.56], [0.5, 0.56]]],
};

// the coupon's drawing at ink 0..1 (the text first, then the doodle, then the border, as a hand would)
function drawCoupon(g, w, h, ink) {
  const r = rng(11);
  g.fillStyle = "#f6ecd6"; g.fillRect(0, 0, w, h);
  // the paper: a soft fold line down the middle and a little grain
  g.fillStyle = "rgba(150,110,60,0.10)"; g.fillRect(w / 2 - 1, 0, 2, h);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(140,100,60,${0.03 + r() * 0.05})`; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
  const strokes = [];
  const brown = "#4a2614", red = "#d2384a", pink = "#e2687a";
  // FREE / HUG: big wobbly marker capitals (each letter a little tilted, as a hand writes)
  const word = (txt, y0, lh, lw, gap) => {
    const tot = txt.length * lw + (txt.length - 1) * gap; let x = (w - tot) / 2;
    for (const ch of txt) {
      const x0 = x, tilt = (r() - 0.5) * 0.08, dy = (r() - 0.5) * lh * 0.06;
      for (const line of LETTERS[ch]) strokes.push({ color: brown, width: lw * 0.2, pts: line.map(([u, v]) => [x0 + u * lw + v * lh * tilt + (r() - 0.5) * 2, y0 + dy + v * lh + (r() - 0.5) * 2]) });
      x += lw + gap;
    }
  };
  word("FREE", h * 0.12, h * 0.22, w * 0.15, w * 0.035);
  word("HUG", h * 0.39, h * 0.22, w * 0.15, w * 0.035);
  // the doodle: two little potatoes hugging, sprouts on top, between two hearts
  const cy = h * 0.79, pr = h * 0.095;
  const potato = (cx, sx) => {
    const pts = Array.from({ length: 17 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return [cx + Math.cos(a) * pr * 0.78 * (1 + 0.05 * Math.sin(a * 3)), cy + Math.sin(a) * pr]; });
    strokes.push({ color: brown, width: w * 0.012, pts, fill: "#e9c27a" });
    strokes.push({ color: brown, width: w * 0.014, pts: [[cx - pr * 0.25, cy - pr * 0.12], [cx - pr * 0.24, cy - pr * 0.1]] });
    strokes.push({ color: brown, width: w * 0.014, pts: [[cx + pr * 0.25, cy - pr * 0.12], [cx + pr * 0.26, cy - pr * 0.1]] });
    strokes.push({ color: brown, width: w * 0.009, pts: [[cx - pr * 0.22, cy + pr * 0.18], [cx, cy + pr * 0.32], [cx + pr * 0.22, cy + pr * 0.18]] });
    strokes.push({ color: "#4f9a2c", width: w * 0.012, pts: [[cx, cy - pr], [cx + sx * pr * 0.25, cy - pr * 1.45], [cx + sx * pr * 0.55, cy - pr * 1.35]] });
  };
  potato(w * 0.42, -1); potato(w * 0.58, 1);
  // the arms round each other
  strokes.push({ color: brown, width: w * 0.011, pts: [[w * 0.47, cy + pr * 0.35], [w * 0.55, cy + pr * 0.42], [w * 0.62, cy + pr * 0.25]] });
  strokes.push({ color: brown, width: w * 0.011, pts: [[w * 0.53, cy + pr * 0.3], [w * 0.45, cy + pr * 0.4], [w * 0.38, cy + pr * 0.22]] });
  const heart = (hx, hy, s) => strokes.push({ color: red, width: w * 0.011, fill: pink, pts: Array.from({ length: 21 }, (_, i) => { const a = (i / 20) * Math.PI * 2, X = 16 * Math.pow(Math.sin(a), 3), Y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a); return [hx + (X * s) / 17, hy - (Y * s) / 17]; }) });
  heart(w * 0.2, cy - h * 0.02, w * 0.05); heart(w * 0.8, cy - h * 0.04, w * 0.045);
  // the wobbly border, last
  const bpts = [], m = w * 0.045;
  const edge = (x0, y0, x1, y1, n) => { for (let i = 0; i < n; i++) { const k = i / n; bpts.push([x0 + (x1 - x0) * k + (r() - 0.5) * 4, y0 + (y1 - y0) * k + (r() - 0.5) * 4]); } };
  edge(m, m, w - m, m, 10); edge(w - m, m, w - m, h - m, 8); edge(w - m, h - m, m, h - m, 10); edge(m, h - m, m, m, 8); bpts.push(bpts[0]);
  strokes.push({ color: red, width: w * 0.012, pts: bpts });
  const n = strokes.length, done = ink * n;
  g.lineCap = "round"; g.lineJoin = "round";
  for (let i = 0; i < n && done > i; i++) {
    const s = strokes[i], k = Math.min(1, done - i), m2 = Math.max(2, Math.ceil(s.pts.length * k));
    g.strokeStyle = s.color; g.lineWidth = s.width;
    g.beginPath(); s.pts.slice(0, m2).forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y)));
    if (s.fill && k >= 1) { g.fillStyle = s.fill; g.fill(); }
    g.stroke();
  }
}

export const BIRTHDAY_KINDS = {
  giftbox(P) {
    const S = P.spec, { w, h, d } = BIRTHDAY.gift;
    wrapped(P.whole, { w, h, d, color: S.color ?? "#7b3fb8", ribbon: S.ribbon ?? "#f2bf3a", seed: S.seed ?? 3, glitter: S.glitter ?? 1, bow: S.bow ?? 1, smile: !!S.smile });
    let top = null;
    if (S.top) { top = wrapped(P.whole, { w: S.top.w, h: S.top.h, d: S.top.d, color: S.top.color ?? "#1d1c22", ribbon: S.top.ribbon ?? "#cfd3da", seed: (S.seed ?? 3) + 7, glitter: 0.25, bow: S.top.bow ?? 0.55, rot: S.top.rot ?? 0 }); top.position.y = h; top.visible = false; }
    return { grip: h * 0.5, apply(ps) { if (top) top.visible = (ps.stack ?? 0) > 0.5; } };
  },

  partyhat(P) {
    const S = P.spec, R = S.r ?? BIRTHDAY.hat.r, H = S.h ?? BIRTHDAY.hat.h;
    const tx = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = S.color ?? "#3d7fd0"; g.fillRect(0, 0, w, h);
      g.fillStyle = S.color2 ?? "#ffd23f";
      if ((S.pattern ?? "dots") === "stripes") { g.save(); g.translate(w / 2, h / 2); g.rotate(-0.6); for (let x = -w * 1.5; x < w * 1.5; x += w / 3.2) g.fillRect(x, -h, w / 6.4, h * 2); g.restore(); }
      else { const r = rng(5); for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(((i + (j % 2) * 0.5) / 6) * w, ((j + 0.4) / 4) * h * 0.9, 9 + r() * 3, 0, 7); g.fill(); } }
      g.fillStyle = "rgba(0,0,0,0.10)"; g.fillRect(0, h - 10, w, 10);
    });
    const m = mat("#ffffff", { map: tx, roughness: 0.75, side: THREE.DoubleSide });
    const cone = new THREE.Group(); P.whole.add(cone);
    mesh(new THREE.ConeGeometry(R, H, 36, 1, true), m, cone, 0, H / 2, 0);
    // the paper's rolled rim and the pompom
    mesh(new THREE.TorusGeometry(R, 0.004, 6, 36), mat(S.color2 ?? "#ffd23f", { roughness: 0.6 }), cone, 0, 0.002, 0).rotation.x = Math.PI / 2;
    const pom = mat(S.pom ?? "#ffe27a", { roughness: 0.95 }), pr = R * 0.38, rr = rng(9);
    mesh(new THREE.IcosahedronGeometry(pr, 1), pom, cone, 0, H + pr * 0.55, 0);
    for (let i = 0; i < 9; i++) { const a = rr() * 6.28, e = rr() * 1.2 - 0.3; mesh(new THREE.IcosahedronGeometry(pr * 0.45, 0), pom, cone, Math.cos(a) * Math.cos(e) * pr * 0.75, H + pr * 0.55 + Math.sin(e) * pr * 0.75, Math.sin(a) * Math.cos(e) * pr * 0.75); }
    return { grip: 0 };
  },

  coupon(P) {
    const S = P.spec, W = S.w ?? BIRTHDAY.coupon.w, H = S.h ?? BIRTHDAY.coupon.h, steps = 14, front = [];
    for (let i = 0; i <= steps; i++) front.push(canvasTex(512, Math.round((512 * H) / W), (g, w, h) => drawCoupon(g, w, h, i / steps)));
    const plain = canvasTex(64, 64, (g, w, h) => { g.fillStyle = "#f1e6cc"; g.fillRect(0, 0, w, h); });
    // two halves hinged on the middle line (x 0); each shows its half of the drawing on +z and plain paper behind
    // (spec.away: the drawing on -z instead, so a holder holding it the grip library's way, +z to the holder, shows it)
    const halves = [], inner = new THREE.Group(); P.whole.add(inner); if (S.away) inner.rotation.y = Math.PI;
    for (const sd of [-1, 1]) {
      const hinge = new THREE.Group(); inner.add(hinge);
      const geo = new THREE.PlaneGeometry(W / 2, H); geo.translate((sd * W) / 4, H / 2, 0);
      const uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setX(k, sd < 0 ? uv.getX(k) * 0.5 : 0.5 + uv.getX(k) * 0.5);
      // one face per ink step, shown one at a time (the look's materials are built from these once, so a texture
      // swapped later would not show: the step shows by visibility)
      const faces = front.map((tx) => { const mf = mat("#ffffff", { map: tx, roughness: 0.9, side: THREE.FrontSide }); mf.userData.noHatch = true; const f = mesh(geo, mf, hinge); f.castShadow = true; f.visible = false; return f; });
      const b = mesh(geo, mat("#ffffff", { map: plain, roughness: 0.9, side: THREE.BackSide }), hinge); b.castShadow = true;
      halves.push({ hinge, sd, faces });
    }
    let last = -1;
    return {
      grip: H / 2,
      apply(ps) {
        const k = Math.round(clamp(ps.write ?? 1) * steps);
        if (k !== last) { for (const q of halves) q.faces.forEach((f, i) => { f.visible = i === k; }); last = k; }
        // folded: the left half lies over the back of the right one (the drawing inside)
        const u = clamp(ps.unfold ?? 1);
        halves[0].hinge.rotation.y = -(1 - u) * Math.PI * 0.97; halves[0].hinge.position.z = -0.002 * (1 - u);
      },
    };
  },

  blowout(P) {
    const S = P.spec, L = S.L ?? 0.26, N = 22, seg = L / N, R = 0.011;
    const cols = [mat(S.color ?? "#8a4fd0", { roughness: 0.6 }), mat(S.color2 ?? "#f2bf3a", { roughness: 0.6 })];
    mesh(new THREE.CylinderGeometry(0.009, 0.011, 0.035, 12), mat("#f4efe2", { roughness: 0.4 }), P.whole, 0, 0, 0.0175).rotation.x = Math.PI / 2;
    // a chain of short tube pieces: each one turns on its parent by the curl, so a rolled-up tail is a tight spiral
    const links = []; let parent = new THREE.Group(); parent.position.z = 0.035; P.whole.add(parent);
    for (let i = 0; i < N; i++) {
      const j = new THREE.Group(); parent.add(j); if (i) j.position.z = seg;
      const piece = mesh(new THREE.CylinderGeometry(R, R, seg * 1.04, 10), cols[Math.floor(i / 2) % 2], j, 0, 0, seg / 2); piece.rotation.x = Math.PI / 2; piece.scale.set(1, 1, 0.45);
      links.push(j); parent = j;
    }
    const tip = mesh(new THREE.SphereGeometry(R * 0.9, 8, 6), cols[1], parent, 0, 0, seg); tip.scale.set(1, 0.45, 1);
    return {
      grip: 0,
      apply(ps) {
        const out = clamp(ps.len ?? 0) * N;
        for (let i = 0; i < N; i++) { const curl = clamp(i + 1 - out); links[i].rotation.x = curl * 0.62; }
      },
    };
  },

  rosette(P) {
    const gold = mat("#e7b53c", { roughness: 0.35, metalness: 0.45 }), deep = mat("#c98f22", { roughness: 0.4, metalness: 0.4 }), R = P.spec.r ?? 0.055;
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, p = mesh(new THREE.BoxGeometry(R * 0.42, R * 0.62, 0.008), i % 2 ? gold : deep, P.whole, Math.cos(a) * R * 0.66, Math.sin(a) * R * 0.66, 0.002); p.rotation.z = a - Math.PI / 2; }
    const btn = mesh(new THREE.CylinderGeometry(R * 0.5, R * 0.5, 0.014, 24), gold, P.whole, 0, 0, 0.009); btn.rotation.x = Math.PI / 2;
    const st = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? R * 0.14 : R * 0.32; st[i ? "lineTo" : "moveTo"](Math.cos(a) * rr, Math.sin(a) * rr); }
    mesh(new THREE.ShapeGeometry(st), mat("#fff1b8", { roughness: 0.3, metalness: 0.3 }), P.whole, 0, 0, 0.0165).castShadow = false;
    for (const sd of [-1, 1]) { const t = mesh(new THREE.BoxGeometry(R * 0.5, R * 1.5, 0.006), sd < 0 ? gold : deep, P.whole, sd * R * 0.3, -R * 1.15, -0.002); t.rotation.z = sd * 0.25; }
    return { grip: 0 };
  },

  sidetable(P) {
    const S = P.spec, R = S.r ?? 0.3, H = S.h ?? 0.4;
    const wood = mat("#8a5a34", { roughness: 0.7 }), cloth = mat(S.cloth ?? "#7d4bb0", { roughness: 0.85, side: THREE.DoubleSide }), lace = mat("#f6efe0", { roughness: 0.9, side: THREE.DoubleSide });
    mesh(new THREE.CylinderGeometry(R, R, 0.03, 40), wood, P.whole, 0, H - 0.015, 0);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5; mesh(new THREE.CylinderGeometry(0.02, 0.016, H - 0.03, 10), wood, P.whole, Math.cos(a) * R * 0.6, (H - 0.03) / 2, Math.sin(a) * R * 0.6); }
    // the cloth: a disc on the top and a skirt hanging over the edge in soft folds, a lace hem
    mesh(new THREE.CylinderGeometry(R + 0.01, R + 0.01, 0.006, 40), cloth, P.whole, 0, H + 0.003, 0);
    const sk = new THREE.CylinderGeometry(R + 0.012, R + 0.05, 0.14, 48, 1, true), sp = sk.attributes.position;
    for (let i = 0; i < sp.count; i++) { const x = sp.getX(i), z = sp.getZ(i), a = Math.atan2(z, x), lo = sp.getY(i) < 0 ? 1 : 0, k = 1 + lo * 0.05 * Math.sin(a * 11); sp.setX(i, x * k); sp.setZ(i, z * k); }
    sk.computeVertexNormals(); mesh(sk, cloth, P.whole, 0, H - 0.07, 0);
    const hem = new THREE.TorusGeometry(R + 0.05, 0.008, 6, 64); const hm = mesh(hem, lace, P.whole, 0, H - 0.14, 0); hm.rotation.x = Math.PI / 2;
    return { grip: H };
  },

  floorscrap(P) {
    const r = rng(P.spec.seed ?? 4), n = P.spec.n ?? 18, spread = P.spec.r ?? 0.6;
    const cols = ["#e0475b", "#ffd23f", "#3d8fb0", "#6cbf3a", "#f07fa6", "#8a4fd0", "#ffffff"].map((c) => { const m = mat(c, { roughness: 0.6, side: THREE.DoubleSide }); m.userData.noOutline = true; return m; });
    for (let i = 0; i < n; i++) {
      const a = r() * 6.28, d = Math.sqrt(r()) * spread, o = new THREE.Mesh(new THREE.PlaneGeometry(0.03 + r() * 0.02, 0.018 + r() * 0.012), cols[i % cols.length]);
      o.position.set(Math.cos(a) * d, 0.006 + r() * 0.003, Math.sin(a) * d); o.rotation.set(-Math.PI / 2 + (r() - 0.5) * 0.3, 0, r() * 6.28); o.castShadow = false; o.userData.solid = false; P.whole.add(o);
    }
    return { grip: 0 };
  },
};
