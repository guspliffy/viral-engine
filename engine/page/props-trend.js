import * as THREE from "three";
import { clamp, lerp, rng as rngOf } from "./util.js";

// Props for the trend clips of 25 Oct (props3d.js merges these into its KINDS and GRIPS):
//   coffin    an upright coffin against a wall (HAUNTED HOUSE). Its door is hinged on the right shoulder and swings
//             toward the camera: `open` 0 shut .. 1 open (110°). `ring` 0..1 rattles it (something inside wants out),
//             `glow` 0..1 lights the satin lining, `smash` 0..1 blows it apart (door, sides and lid tumble away).
//   screen    a phone held up to be read: a big rounded body with a drawn screen. spec.mode: "call" (an unknown
//             number calling), "likes" (a post with 0 likes), "voice" (a 4:37 voice message), "text" (spec.text).
//             `glow` lights it, `ring` buzzes it, `split` cuts it in two (the halves tip apart).
//   letter    a big envelope stamped spec.text (default "SENT TO: EVERYONE")
//   letters   a burst of small envelopes from the prop's spot: `burst` 0..1 throws them up and out, and they flutter
//             down to the floor (spec.floor, metres below the prop, default its y) by 1. Pure function of burst.
//   confetti  the same with paper squares in party colours
//   balloons  three balloons on strings, bobbing (pop them in with scale)
//   printer   an office printer with a red blinking JAM light (spec.jam), `print` 0..1 pushes one sheet out of its
//             slot (spec.sheet, default "PAPER JAM"), `scorch` 0..1 chars it, `smash` 0..1 squashes it
//   flatpack  a flat-pack box leaning on a wall with its instruction booklet in front: `unfold` 0..1 unfolds the
//             booklet page after page, up and up (spec.pages, default 14), `smash` 0..1 blows box and booklet apart
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
const basic = (o) => { const m = new THREE.MeshBasicMaterial(o); m.userData.noOutline = true; return m; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const smooth = (k) => k * k * (3 - 2 * k);
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }

export const TREND_GRIPS = {};

// the coffin's outline (x, y): narrow at the foot, widest at the shoulders, a flat head
const COFFIN = { foot: 0.21, shoulder: 0.31, shoulderY: 1.12, head: 0.24, H: 1.62, D: 0.3, T: 0.045 };
function coffinShape(k = 1) {
  const { foot, shoulder, shoulderY, head, H } = COFFIN, s = new THREE.Shape();
  s.moveTo(-foot * k, 0); s.lineTo(foot * k, 0); s.lineTo(shoulder * k, shoulderY); s.lineTo(head * k, H - (1 - k) * 0.05); s.lineTo(-head * k, H - (1 - k) * 0.05); s.lineTo(-shoulder * k, shoulderY); s.closePath();
  return s;
}

// a flock of small flat pieces thrown from the origin; each flies up and out, then flutters down to the floor.
// Returns apply(burst, t). Pieces are hidden at burst 0 (and a reset to 0 hides them again).
function flock(P, { count, make, spread = 1, up = 0.9, floor = 0.9, seed = 5, depth = 0.6 }) {
  const rnd = rngOf(seed), pieces = [];
  for (let i = 0; i < count; i++) {
    const o = make(i, rnd); o.rotation.order = "YXZ"; P.whole.add(o);
    const a = (rnd() - 0.5) * Math.PI * 1.1;   // mostly up and to the sides, a few toward the camera
    pieces.push({ o, vx: Math.sin(a) * spread * (0.5 + rnd() * 0.7), vz: (0.25 + rnd() * 0.9) * depth, peak: up * (0.6 + rnd() * 0.6),
      land: [Math.sin(a) * spread * (0.7 + rnd() * 0.8), -floor + 0.004 + rnd() * 0.01, (0.15 + rnd()) * depth], delay: rnd() * 0.12,
      spin: [(rnd() - 0.5) * 14, (rnd() - 0.5) * 8, (rnd() - 0.5) * 14], sway: 0.6 + rnd() * 0.8, ph: rnd() * 6.28 });
  }
  return (b, t) => {
    for (const q of pieces) {
      const k = clamp((b - q.delay) / (1 - q.delay)), on = b > 0.001;
      q.o.visible = on;
      if (!on) continue;
      // first 35%: out and up fast; then a slow flutter down with a side to side sway
      const k1 = clamp(k / 0.35), k2 = clamp((k - 0.35) / 0.65);
      const ox = q.vx * smooth(k1) * 0.55, oz = q.vz * smooth(k1) * 0.5, oy = q.peak * (1 - (1 - k1) * (1 - k1));
      const x = lerp(ox, q.land[0], smooth(k2)) + Math.sin(k2 * 9 + q.ph) * 0.06 * q.sway * (1 - k2);
      const y = lerp(oy, q.land[1], k2 * k2 * 0.4 + k2 * 0.6), z = lerp(oz, q.land[2], smooth(k2));
      q.o.position.set(x, y, z);
      // tumbling in the air, landing flat
      const air = 1 - k2;
      q.o.rotation.set(-Math.PI / 2 * k2 + q.spin[0] * k * air * 0.3, q.spin[1] * k * 0.4, q.spin[2] * k * air * 0.3);
    }
  };
}

export const TREND_KINDS = {
  coffin(P) {
    const wood = mat("#4a2c22", { roughness: 0.7 }), woodLight = mat("#6b4030", { roughness: 0.65 }), brass = mat("#c9a043", { roughness: 0.35, metalness: 0.6 });
    const satin = mat("#8e1f33", { roughness: 0.45, emissive: new THREE.Color("#ff3a5a"), emissiveIntensity: 0 });
    const { D, T, shoulder, shoulderY } = COFFIN;
    // the shell: the outline with the inner outline cut out, extruded to the depth (sides), plus a back panel
    const parts = new THREE.Group(); P.whole.add(parts);
    const outer = coffinShape(1), inner = coffinShape(0.86); outer.holes.push(new THREE.Path(inner.getPoints()));
    const sides = new THREE.Group(); parts.add(sides);
    mesh(new THREE.ExtrudeGeometry(outer, { depth: D, bevelEnabled: false }), wood, sides);
    const back = new THREE.Group(); parts.add(back);
    mesh(new THREE.ExtrudeGeometry(coffinShape(1), { depth: T, bevelEnabled: false }), wood, back);
    // the lining: a satin panel just in front of the back, tufted with buttons
    const lining = mesh(new THREE.ShapeGeometry(coffinShape(0.86)), satin, back, 0, 0, T + 0.002); lining.castShadow = false;
    for (let i = 0; i < 4; i++) for (let j = -1; j <= 1; j++) mesh(new THREE.SphereGeometry(0.012, 8, 6), mat("#6d1626", { roughness: 0.4 }), back, j * 0.12, 0.35 + i * 0.3, T + 0.006);
    // the door, hinged on the right shoulder (it swings open to the right, away from whoever stands at its left);
    // a raised panel and a brass handle on the left
    const hinge = new THREE.Group(); hinge.position.set(shoulder, 0, D); parts.add(hinge);
    const door = new THREE.Group(); door.position.set(-shoulder, 0, 0); hinge.add(door);
    mesh(new THREE.ExtrudeGeometry(coffinShape(1), { depth: T, bevelEnabled: false }), wood, door);
    mesh(new THREE.ExtrudeGeometry(coffinShape(0.8), { depth: 0.012, bevelEnabled: false }), woodLight, door, 0, 0.12, T);
    mesh(new THREE.BoxGeometry(0.035, 0.12, 0.03), brass, door, -shoulder * 0.72, shoulderY - 0.25, T + 0.02);
    for (const y of [0.25, shoulderY - 0.05]) mesh(new THREE.BoxGeometry(0.05, 0.07, 0.02), brass, door, shoulder * 0.86, y, T + 0.01);
    // a soft light from inside when it's open
    const light = new THREE.PointLight("#ff8aa0", 0, 3, 1.6); light.position.set(0, 1.0, 0.4); P.whole.add(light);
    return {
      grip: 0,
      apply(ps, t) {
        const o = clamp(ps.open ?? 0), r = clamp(ps.ring ?? 0), q = clamp(ps.smash ?? 0), gl = clamp(ps.glow ?? 0);
        // a rattle: the door knocks against its frame and the whole box shudders
        const rat = r * Math.sin((t ?? 0) * 46), rat2 = r * Math.sin((t ?? 0) * 31 + 1.3);
        hinge.rotation.y = (o * 110 * Math.PI) / 180 + Math.abs(rat) * 0.07;
        parts.rotation.z = rat2 * 0.012; parts.position.y = Math.abs(rat) * 0.008;
        satin.emissiveIntensity = 0.35 * gl; light.intensity = 2.2 * gl * (1 - q);
        // smash: the door flies off to the right and spins, the sides fall apart left, the back tips over
        const e = smooth(q);
        door.position.set(-shoulder + e * 0.5, e * 0.25 - q * q * 0.5, e * 0.6); door.rotation.set(e * 1.2, e * 0.8, -e * 2.6);
        sides.position.set(-e * 0.5, -q * q * 0.2, e * 0.3); sides.rotation.set(0, e * 0.5, e * 1.25);
        back.rotation.x = -e * 1.1; back.position.set(e * 0.15, 0, -e * 0.1);
        P.whole.visible = q < 0.999;
      },
    };
  },

  screen(P) {
    const mode = P.spec.mode || "call", W = 0.12, H = 0.24;
    const tex = canvasTex(360, 720, (g, w, h) => {
      const bg = g.createLinearGradient(0, 0, 0, h);
      if (mode === "call") {
        bg.addColorStop(0, "#2b3a55"); bg.addColorStop(1, "#141a28"); g.fillStyle = bg; g.fillRect(0, 0, w, h);
        g.fillStyle = "#cfd6e4"; g.beginPath(); g.arc(w / 2, 210, 70, 0, 7); g.fill();
        g.fillStyle = "#2b3a55"; g.beginPath(); g.arc(w / 2, 190, 26, 0, 7); g.fill(); g.beginPath(); g.ellipse(w / 2, 262, 44, 30, 0, Math.PI, 0); g.fill();
        g.fillStyle = "#ffffff"; g.textAlign = "center"; g.font = "800 46px sans-serif"; g.fillText("Unknown", w / 2, 345); g.fillText("number", w / 2, 395);
        g.fillStyle = "#9fb0cc"; g.font = "600 30px sans-serif"; g.fillText("incoming call...", w / 2, 445);
        g.fillStyle = "#e5484d"; g.beginPath(); g.arc(95, 600, 46, 0, 7); g.fill(); g.fillStyle = "#30c26a"; g.beginPath(); g.arc(w - 95, 600, 46, 0, 7); g.fill();
        g.strokeStyle = "#fff"; g.lineWidth = 9; g.lineCap = "round"; for (const x of [95, w - 95]) { g.beginPath(); g.arc(x, 610, 20, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
      } else if (mode === "likes") {
        g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h);
        g.fillStyle = "#ffb36b"; g.fillRect(20, 90, w - 40, 330);
        g.fillStyle = "#d9a35c"; g.beginPath(); g.ellipse(w / 2, 270, 80, 100, 0, 0, 7); g.fill();
        g.fillStyle = "#2a1a12"; g.beginPath(); g.arc(w / 2 - 28, 250, 9, 0, 7); g.arc(w / 2 + 28, 250, 9, 0, 7); g.fill();
        g.strokeStyle = "#2a1a12"; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, 285, 26, 0.2, Math.PI - 0.2); g.stroke();
        g.fillStyle = "#222"; g.font = "800 30px sans-serif"; g.textAlign = "left"; g.fillText("my best angle", 24, 60);
        // an empty heart and a big 0
        g.strokeStyle = "#e5484d"; g.lineWidth = 10; g.beginPath(); const hx = 110, hy = 540;
        g.moveTo(hx, hy + 40); g.bezierCurveTo(hx - 70, hy - 10, hx - 30, hy - 60, hx, hy - 25); g.bezierCurveTo(hx + 30, hy - 60, hx + 70, hy - 10, hx, hy + 40); g.stroke();
        g.fillStyle = "#111"; g.font = "900 120px sans-serif"; g.fillText("0", 200, 585);
        g.font = "700 36px sans-serif"; g.fillStyle = "#666"; g.fillText("likes", 200, 640);
      } else if (mode === "voice") {
        bg.addColorStop(0, "#1f6f5c"); bg.addColorStop(1, "#0f3b31"); g.fillStyle = bg; g.fillRect(0, 0, w, h);
        g.fillStyle = "#ffffff"; g.textAlign = "center"; g.font = "800 40px sans-serif"; g.fillText("Voice message", w / 2, 150);
        roundRect(g, 30, 270, w - 60, 150, 40); g.fillStyle = "#dcf8c6"; g.fill();
        g.fillStyle = "#1f6f5c"; g.beginPath(); g.moveTo(62, 315); g.lineTo(62, 375); g.lineTo(108, 345); g.closePath(); g.fill();
        const r = rngOf(3); for (let x = 125; x < w - 50; x += 9) { const a = 8 + r() * 44; g.fillRect(x, 345 - a / 2, 5, a); }
        g.fillStyle = "#ffffff"; g.font = "900 110px sans-serif"; g.fillText("4:37", w / 2, 580);
      } else {
        g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h); g.fillStyle = "#111"; g.textAlign = "center"; g.font = "900 64px sans-serif";
        String(P.spec.text || "").split("\n").forEach((l, i) => g.fillText(l, w / 2, 300 + i * 80));
      }
    });
    const body = mat("#23242c", { roughness: 0.35, metalness: 0.3 }), screenM = basic({ map: tex, color: "#ffffff" });
    const halves = [];
    for (const [s, h] of P.halves) {
      // each half is half the phone (cut down the middle), so a slice splits it cleanly
      const shape = new THREE.Shape(); const x0 = s > 0 ? 0 : -W / 2, x1 = s > 0 ? W / 2 : 0, r = 0.018;
      shape.moveTo(x0, 0); shape.lineTo(x1 - (s > 0 ? r : 0), 0); if (s > 0) shape.quadraticCurveTo(x1, 0, x1, r); shape.lineTo(x1, H - (s > 0 ? r : 0)); if (s > 0) shape.quadraticCurveTo(x1, H, x1 - r, H);
      shape.lineTo(x0 + (s < 0 ? r : 0), H); if (s < 0) shape.quadraticCurveTo(x0, H, x0, H - r); shape.lineTo(x0, s < 0 ? r : 0); if (s < 0) shape.quadraticCurveTo(x0, 0, x0 + r, 0);
      const b = mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.014, bevelEnabled: false }), body, h, 0, 0, -0.007);
      const sg = new THREE.PlaneGeometry(W / 2 - 0.008, H - 0.016), uv = sg.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setX(k, (s > 0 ? 0.5 : 0) + uv.getX(k) * 0.5);
      const sc = new THREE.Mesh(sg, screenM); sc.position.set(s * (W / 4 - 0.002), H / 2, 0.0075); h.add(sc);
      halves.push(b);
    }
    return {
      grip: H / 2, splitApart: 0.08, splitTip: 0.9, splitDrop: 0.25,
      apply(ps, t) {
        const r = clamp(ps.ring ?? 0), gl = clamp(ps.glow ?? 1);
        P.whole.rotation.z = r * 0.06 * Math.sin((t ?? 0) * 60); P.whole.position.x = r * 0.006 * Math.sin((t ?? 0) * 83);
        screenM.color.setScalar(0.25 + 0.75 * gl);
      },
    };
  },

  letter(P) {
    const W = 0.34, H = 0.22;
    const tex = canvasTex(512, 332, (g, w, h) => {
      g.fillStyle = "#f6efe0"; g.fillRect(0, 0, w, h);
      g.strokeStyle = "#cbbd9e"; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(w / 2, h * 0.55); g.lineTo(w, 0); g.stroke();
      g.save(); g.translate(w / 2, h * 0.62); g.rotate(-0.12);
      g.strokeStyle = "#d12f3a"; g.lineWidth = 9; roundRect(g, -205, -62, 410, 124, 14); g.stroke();
      g.fillStyle = "#d12f3a"; g.textAlign = "center"; g.font = "900 44px sans-serif"; g.fillText(P.spec.text || "SENT TO:", 0, -8);
      g.font = "900 54px sans-serif"; g.fillText(P.spec.text2 ?? "EVERYONE", 0, 46); g.restore();
    });
    mesh(new THREE.BoxGeometry(W, H, 0.008), mat("#f6efe0", { roughness: 0.85 }), P.whole, 0, H / 2, 0);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.004, H - 0.004), mat("#ffffff", { map: tex, roughness: 0.85 })); f.position.set(0, H / 2, 0.0045); P.whole.add(f);
    return { grip: H / 2 };
  },

  letters(P) {
    const m = mat("#f6efe0", { roughness: 0.85, side: THREE.DoubleSide }), flap = mat("#d9cbb0", { roughness: 0.85, side: THREE.DoubleSide });
    const go = flock(P, { count: P.spec.count ?? 26, spread: P.spec.spread ?? 1.3, up: P.spec.up ?? 0.9, floor: P.spec.floor ?? P.spec.y ?? 0.9, seed: P.spec.seed ?? 11, depth: 0.7,
      make: () => { const g = new THREE.Group(); const b = mesh(new THREE.PlaneGeometry(0.11, 0.07), m, g); b.castShadow = true; const t = mesh(new THREE.CircleGeometry(0.04, 3), flap, g, 0, 0.012, 0.001); t.rotation.z = -Math.PI / 2; t.scale.set(0.6, 1.3, 1); t.castShadow = false; return g; } });
    return { grip: 0, apply(ps, t) { go(clamp(ps.burst ?? 0), t); } };
  },

  confetti(P) {
    const cols = ["#e0475b", "#ffd23f", "#3d8fb0", "#6cbf3a", "#f07fa6", "#ffffff"].map((c) => { const m = mat(c, { roughness: 0.6, side: THREE.DoubleSide }); m.userData.noOutline = true; return m; });
    const go = flock(P, { count: P.spec.count ?? 70, spread: P.spec.spread ?? 1.4, up: P.spec.up ?? 1.0, floor: P.spec.floor ?? P.spec.y ?? 0.9, seed: P.spec.seed ?? 7, depth: 0.8,
      make: (i) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.02), cols[i % cols.length]); o.castShadow = false; return o; } });
    return { grip: 0, apply(ps, t) { go(clamp(ps.burst ?? 0), t); } };
  },

  balloons(P) {
    const cols = ["#e0475b", "#ffd23f", "#3d8fb0"], items = [];
    cols.forEach((c, i) => {
      const g = new THREE.Group(); g.position.set((i - 1) * 0.16, 0, (i % 2) * 0.05); P.whole.add(g);
      const b = mesh(new THREE.SphereGeometry(0.085, 20, 14), mat(c, { roughness: 0.25 }), g, 0, 0.42 + (i % 2) * 0.08, 0); b.scale.set(1, 1.18, 1);
      mesh(new THREE.ConeGeometry(0.014, 0.025, 8), mat(c, { roughness: 0.3 }), g, 0, 0.42 + (i % 2) * 0.08 - 0.105, 0).rotation.x = Math.PI;
      const s = mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.33 + (i % 2) * 0.08, 4), mat("#f4f1ea"), g, 0, (0.33 + (i % 2) * 0.08) / 2, 0); s.castShadow = false;
      items.push({ g, ph: i * 1.7 });
    });
    return { grip: 0, apply(ps, t) { for (const q of items) { q.g.rotation.z = 0.08 * Math.sin((t ?? 0) * 2.1 + q.ph); q.g.rotation.x = 0.05 * Math.sin((t ?? 0) * 1.6 + q.ph * 2); } } };
  },

  printer(P) {
    const shell = mat("#e9e4d8", { roughness: 0.5 }), dark = mat("#3b3d46", { roughness: 0.5 }), W = 0.46, H = 0.26, D = 0.36;
    mesh(new THREE.BoxGeometry(W, H, D), shell, P.whole, 0, H / 2, 0);
    mesh(new THREE.BoxGeometry(W - 0.04, 0.03, D - 0.06), dark, P.whole, 0, H + 0.012, -0.01);           // the scanner lid seam
    mesh(new THREE.BoxGeometry(W * 0.7, 0.012, 0.012), dark, P.whole, 0, H * 0.62, D / 2 + 0.002);        // the output slot
    mesh(new THREE.BoxGeometry(W * 0.62, 0.02, 0.16), shell, P.whole, 0, H * 0.3, D / 2 + 0.07);           // the paper tray
    // the little panel with a red light that blinks JAM
    const panel = canvasTex(256, 96, (g, w, h) => { g.fillStyle = "#1a1c22"; g.fillRect(0, 0, w, h); g.fillStyle = "#ff3b3b"; g.font = "900 64px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("JAM", w / 2, h / 2 + 4); });
    const lightM = basic({ map: panel, color: "#ffffff" });
    const pn = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.05), lightM); pn.position.set(W * 0.27, H * 0.84, D / 2 + 0.002); P.whole.add(pn);
    // the sheet it prints
    const sheetTex = canvasTex(256, 330, (g, w, h) => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h); g.fillStyle = "#111"; g.textAlign = "center"; g.font = "900 50px sans-serif"; String(P.spec.sheet ?? "PAPER\nJAM").split("\n").forEach((l, i) => g.fillText(l, w / 2, 120 + i * 62)); });
    const ss = P.spec.sheetScale ?? 1;   // a bigger page, to read at phone size
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.2 * ss, 0.26 * ss), mat("#ffffff", { map: sheetTex, roughness: 0.9, side: THREE.DoubleSide })); sheet.castShadow = true; P.whole.add(sheet);
    const mats = [shell, dark], base = mats.map((m) => m.color.clone());
    return {
      grip: H,
      apply(ps, t) {
        const pr = clamp(ps.print ?? 0), sc = clamp(ps.scorch ?? 0), q = clamp(ps.smash ?? 0);
        const blink = P.spec.jam === false ? 0 : (Math.floor((t ?? 0) * 3) % 2 === 0 ? 1 : 0.25);
        lightM.color.setScalar(blink * (1 - sc * 0.7));
        // the sheet slides out of the slot, then flops down over the tray
        sheet.visible = pr > 0.01; const out = smooth(clamp(pr / 0.7)), flop = smooth(clamp((pr - 0.7) / 0.3));
        sheet.position.set(0, H * 0.62 + 0.13 * ss * out - 0.1 * ss * flop, D / 2 + 0.005 + 0.06 * ss * flop); sheet.rotation.x = -0.25 - 1.1 * flop;
        sheet.scale.set(1, Math.max(0.02, out), 1);
        mats.forEach((m, i) => m.color.copy(base[i]).lerp(new THREE.Color("#1d1714"), sc * 0.8));
        P.whole.scale.set(1 + 0.4 * q, Math.max(0.05, 1 - 0.85 * q), 1 + 0.3 * q);
      },
    };
  },

  flatpack(P) {
    const card = mat("#c8955c", { roughness: 0.8 }), BW = 0.62, BH = 0.86, BD = 0.07;
    const label = canvasTex(256, 356, (g, w, h) => {
      g.fillStyle = "#c8955c"; g.fillRect(0, 0, w, h); g.fillStyle = "#2d4f8a"; g.fillRect(0, 0, w, 64);
      g.fillStyle = "#ffd23f"; g.font = "900 34px sans-serif"; g.textAlign = "center"; g.fillText("SHELF", w / 2, 45);
      g.strokeStyle = "#3a2a1a"; g.lineWidth = 6; g.strokeRect(70, 100, 116, 170); for (const y of [155, 212]) { g.beginPath(); g.moveTo(70, y); g.lineTo(186, y); g.stroke(); }
      g.fillStyle = "#3a2a1a"; g.font = "800 26px sans-serif"; g.fillText("1 OF 6", w / 2, 318);
    });
    const box = new THREE.Group(); P.whole.add(box); box.position.set(0, 0, 0); box.rotation.x = -0.12;   // leaning back on the wall
    mesh(new THREE.BoxGeometry(BW, BH, BD), card, box, 0, BH / 2, 0);
    const lf = new THREE.Mesh(new THREE.PlaneGeometry(BW - 0.02, BH - 0.02), mat("#ffffff", { map: label, roughness: 0.85 })); lf.position.set(0, BH / 2, BD / 2 + 0.002); box.add(lf);
    // the booklet: pages joined in a zigzag that unfolds upward, each page with a drawing and a question mark
    const n = P.spec.pages ?? 14, PW = 0.2, PH = 0.13;
    const pageTex = (i) => canvasTex(200, 130, (g, w, h) => {
      g.fillStyle = "#fbfaf4"; g.fillRect(0, 0, w, h); g.strokeStyle = "#222"; g.lineWidth = 3;
      g.strokeRect(20 + (i * 13) % 40, 25, 60, 50); g.beginPath(); g.moveTo(100, 50); g.lineTo(140, 50); g.lineTo(130, 40); g.moveTo(140, 50); g.lineTo(130, 60); g.stroke();
      g.fillStyle = "#222"; g.font = "900 44px sans-serif"; g.fillText(i % 3 === 2 ? "?!" : "?", 150, 95); g.font = "700 16px sans-serif"; g.fillText(`step ${i + 1}`, 18, 115);
    });
    const book = new THREE.Group(); book.position.set(0.05, 0.0, 0.22); P.whole.add(book);
    const pages = [];
    let parent = book;
    for (let i = 0; i < n; i++) {
      const hinge = new THREE.Group(); parent.add(hinge); if (i > 0) hinge.position.y = PH;
      const pg = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), mat("#ffffff", { map: pageTex(i), roughness: 0.9, side: THREE.DoubleSide })); pg.position.y = PH / 2; pg.castShadow = true; hinge.add(pg);
      pages.push(hinge); parent = hinge;
    }
    return {
      grip: 0,
      apply(ps, t) {
        const u = clamp(ps.unfold ?? 0), q = clamp(ps.smash ?? 0);
        // closed: the pages stacked flat on the floor; unfolding opens one hinge after the next, so the strip climbs
        // and sways like a snake
        book.rotation.x = -Math.PI / 2 * (1 - smooth(clamp(u * n)));
        pages.forEach((h, i) => {
          if (i === 0) return;
          const k = smooth(clamp(u * n - i));
          h.rotation.x = (i % 2 ? 1 : -1) * Math.PI * (1 - k) * 0.98 + 0.06 * Math.sin((t ?? 0) * 3 + i) * k;
          h.visible = u * n > i - 1;
        });
        const e = smooth(q);
        box.position.set(-e * 0.6, -q * q * 0.3, e * 0.2); box.rotation.set(-0.12 - e * 1.3, 0, e * 1.6);
        book.position.set(0.05 + e * 0.7, -q * q * 0.2, 0.22 + e * 0.3); book.rotation.z = -e * 1.4;
        P.whole.visible = q < 0.999;
      },
    };
  },
};
export { mat, basic, mesh, canvasTex, smooth, roundRect, flock };
