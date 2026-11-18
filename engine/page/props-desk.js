import * as THREE from "three";
import { clamp } from "./util.js";

// Props for the Potato Desk series' service counter set (storyboards/series/potato-desk/DESIGN.md section 1, 2): a bored
// office counter that reads in one still wide shot; Reaper serves Chip here in episode 1, and the same counter comes
// back as a bank and a registry office. Axes: x right, y up, z toward the camera, metres. Every size below is the
// director's number. Marks are drawn once (no tiled textures); text is canvas text, drawn once, no mipmapped repeats.
// Animatable keys (`typed`, `press`, `age`) are not in props3d.js propState: a clip seeds them at 0 with a duration-0
// `prop` action (like the bear-camp bench) and then tweens them; a plain spec value works too (the same key on the spec).
//
//   officesign   a wall sign. Origin: the CENTRE of its BACK face; it is mounted on a wall and faces +z (0.04 deep).
//                spec.w 1.5, spec.h 0.42; spec.lines [[text, capHeight], ...] default [["AFTERLIFE", 0.13],
//                ["CUSTOMER SERVICE", 0.085]] (lines stack centred, gap = half the smallest cap height; a line too wide
//                for the plate is squeezed, never cut); spec.plate "#24323f", spec.ink "#f3ead2" (the letters),
//                spec.frame "#b08a3c", spec.frameW 0.03. Not held.
//   crtmonitor   a beige CRT on its foot: box 0.30 wide x 0.28 high x 0.30 deep (front toward +z, the back tapering to 0.20
//                wide). Origin: the bottom centre. Shell "#d8d2c0", screen 0.22 x 0.17 "#12261c" with 5 green lines
//                "#9fe0b0" of different lengths. `typed` 0..1 (default 0) types a sixth line, "> NEXT, PLEASE", letter by
//                letter, with a blinking cursor. Turn it with rot (the set turns it 45 degrees). Not held.
//   keyboard     0.36 wide (x) x 0.13 deep (z) x 0.025 high at the back, tilted 6 degrees (low at the front, +z).
//                Origin: the bottom centre. Shell "#d8d2c0", 4 key rows "#f1ede2" of uneven keys, one key "#b43a23".
//                Turn it with rot to lay its long side along z. Not held.
//   callbell     a hotel bell: base r 0.05 "#3b2a20", brass dome r 0.045 "#c9a23c", a brass button on top; 0.07 high.
//                Origin: the bottom centre. `press` 0..1 (default 0) dips the button 4 mm. The palm slaps it from above:
//                grips.rest(c, who, side, spec, [0, 0], t, { top: 0.069 }) (a flat palm on the button). Not otherwise held.
//   ticketsnail  the take-a-number dispenser: a red disc r 0.09, 0.07 thick, "#c8352b" with a drawn spiral, on a grey
//                bracket "#9aa3a8", a paper tongue 0.03 x 0.04 "#fbf6ea" hanging from its bottom. Origin: the middle of the
//                disc's BACK face on the wall (the bracket is 6 mm of that); it faces +z. Not held.
//   ticket       one paper ticket 0.06 wide x 0.11 high, standing on its bottom edge (origin: the bottom centre, faces
//                +z), "#fbf6ea", a 3-digit number "#b43a23", cap height 0.03. spec.num (string, default "417").
//                `age` 0..1 (default 0) turns the paper "#d9c79a" and curls its top right corner back 30 degrees.
//                HELD with the THIN pinch (grips.thin, SIZE ticket { len 0.11, r 0.002 }): thumb and finger on its
//                bottom edge, from 0.15 (1.6 cm up), the number clear above the hand.
//   cobweb       a corner web: spec.pts three [x, y, z] points in the prop's own space: pts[0] the corner it hangs from,
//                pts[1] and pts[2] the ends of the two edges it spans. 6 spokes, 5 rings, every strand 3 mm and bent a little
//                by its index; "#e8ecee" at spec.opacity (default 0.7). Origin: the prop's origin (pts are relative to
//                it), so give it x y z 0 and absolute corners, or place it at the corner and give small offsets.
//   officewall   the counter room's back wall (DESIGN.md section 1): a painted plaster wall facing +z, origin its bottom middle
//                on the floor. spec.w 4.0, spec.h 4.0; bands from the floor: dado 0..0.80 spec.dado "#5f7a85", a rail 0.04
//                spec.rail "#e6e2d6", wall to 2.15 spec.wall "#c3ccd0", a second rail, above it spec.top "#aab6bc". A few
//                scuffs and chair marks on the dado, each drawn once by index. Not held.
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
// the ratio of a font's capital height to its size, measured (so a cap height in metres is exact)
const capRatio = (g, font) => { g.font = font(100); return (g.measureText("H").actualBoundingBoxAscent || 73) / 100; };
// a closed solid from quads (each given in any order; flipped to face away from `centre`)
function solid(quads, centre) {
  const pos = [], a = new THREE.Vector3(), b = new THREE.Vector3(), n = new THREE.Vector3(), mid = new THREE.Vector3();
  for (const q of quads) {
    let [p0, p1, p2, p3] = q.map((p) => new THREE.Vector3(...p));
    n.crossVectors(a.subVectors(p1, p0), b.subVectors(p2, p0));
    mid.copy(p0).add(p1).add(p2).add(p3).multiplyScalar(0.25).sub(centre);
    if (n.dot(mid) < 0) [p1, p3] = [p3, p1];
    for (const p of [p0, p1, p2, p0, p2, p3]) pos.push(p.x, p.y, p.z);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
}
const key = (ps, P, k) => clamp(ps[k] ?? P.spec[k] ?? 0);   // an animatable key: the tweened value, else the spec's

export const DESK_KINDS = {
  officewall(P) {
    const S = P.spec, W = S.w ?? 4.0, H = S.h ?? 4.0, rail = S.rail ?? "#e6e2d6";
    const tex = canvasTex(1024, Math.round(1024 * H / W), (g, w, h) => {
      const k = h / H, Y = (m) => h - m * k;
      g.fillStyle = S.top ?? "#aab6bc"; g.fillRect(0, 0, w, h);
      g.fillStyle = S.wall ?? "#c3ccd0"; g.fillRect(0, Y(2.15), w, (2.15 - 0.8) * k);
      g.fillStyle = S.dado ?? "#5f7a85"; g.fillRect(0, Y(0.8), w, 0.8 * k);
      g.fillStyle = rail; g.fillRect(0, Y(0.84), w, 0.04 * k); g.fillRect(0, Y(2.17), w, 0.04 * k);
      g.fillStyle = "rgba(40, 55, 62, 0.35)"; g.fillRect(0, Y(0.8), w, 0.012 * k); g.fillRect(0, Y(2.13), w, 0.01 * k);
      g.fillStyle = "#4e6670"; g.fillRect(0, Y(0.1), w, 0.1 * k);   // skirting
      for (let i = 0; i < 14; i++) {   // scuffs on the dado and faint marks on the wall, each placed once by index
        const x = rnd(i + 1) * w, y = Y(0.15 + rnd(i + 21) * 0.55), l = (0.04 + rnd(i + 41) * 0.1) * k;
        g.strokeStyle = i % 3 ? "rgba(40, 52, 58, 0.28)" : "rgba(230, 236, 238, 0.25)"; g.lineWidth = 2 + (i % 3);
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (rnd(i + 61) - 0.5) * 0.03 * k); g.stroke();
      }
      for (let i = 0; i < 9; i++) {   // soft uneven patches in the paint
        g.fillStyle = `rgba(${i % 2 ? "255,255,255" : "70,85,95"}, 0.05)`;
        g.beginPath(); g.ellipse(rnd(i + 81) * w, Y(0.9 + rnd(i + 91) * 1.2), (0.2 + rnd(i + 101) * 0.4) * k, (0.15 + rnd(i + 111) * 0.3) * k, 0, 0, Math.PI * 2); g.fill();
      }
    });
    const wall = mesh(new THREE.PlaneGeometry(W, H), mat("#ffffff", { map: tex, roughness: 0.9 }), P.whole, 0, H / 2, 0); wall.castShadow = false;
    return { grip: 0 };
  },
  officesign(P) {
    const S = P.spec, W = S.w ?? 1.5, H = S.h ?? 0.42, T = 0.04, F = S.frameW ?? 0.03;
    const lines = S.lines ?? [["AFTERLIFE", 0.13], ["CUSTOMER SERVICE", 0.085]];
    const plateC = S.plate ?? "#24323f", inkC = S.ink ?? "#f3ead2", frameC = S.frame ?? "#b08a3c";
    const frame = mat(frameC, { roughness: 0.45, metalness: 0.2 });
    mesh(new THREE.BoxGeometry(W, F, T), frame, P.whole, 0, H / 2 - F / 2, T / 2);
    mesh(new THREE.BoxGeometry(W, F, T), frame, P.whole, 0, -H / 2 + F / 2, T / 2);
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(F, H - 2 * F, T), frame, P.whole, s * (W / 2 - F / 2), 0, T / 2);
    const pw = W - 2 * F, ph = H - 2 * F;
    mesh(new THREE.BoxGeometry(pw, ph, T - 0.012), mat(plateC, { roughness: 0.6 }), P.whole, 0, 0, (T - 0.012) / 2);
    const ppm = 1400, cw = Math.round(pw * ppm), chh = Math.round(ph * ppm);
    const tex = canvasTex(cw, chh, (g) => {
      g.fillStyle = plateC; g.fillRect(0, 0, cw, chh);
      g.strokeStyle = inkC; g.globalAlpha = 0.5; g.lineWidth = 0.003 * ppm; g.strokeRect(0.012 * ppm, 0.012 * ppm, cw - 0.024 * ppm, chh - 0.024 * ppm); g.globalAlpha = 1;
      const font = (f) => `800 ${f}px "DejaVu Sans", "Liberation Sans", Arial, sans-serif`;
      const k = capRatio(g, font), gap = 0.5 * Math.min(...lines.map((l) => l[1])), total = lines.reduce((s, l) => s + l[1], 0) + gap * (lines.length - 1);
      g.fillStyle = inkC; g.textAlign = "center"; g.textBaseline = "alphabetic";
      let y = (chh / ppm - total) / 2;
      for (const [text, cap] of lines) {
        const fs = (cap * ppm) / k; g.font = font(fs); try { g.letterSpacing = `${(0.05 * fs).toFixed(1)}px`; } catch (e) { /* older canvas: no tracking */ }
        const wide = g.measureText(text).width, room = cw - 0.07 * ppm, sx = Math.min(1, room / wide);
        y += cap; g.save(); g.translate(cw / 2, y * ppm); g.scale(sx, 1); g.fillText(text, 0, 0); g.restore(); y += gap;
      }
    });
    const faceM = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: new THREE.Color("#ffffff"), emissiveMap: tex, emissiveIntensity: 0.12 }); faceM.userData.noHatch = true;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), faceM); face.position.z = T - 0.012 + 0.0008; face.receiveShadow = true; P.whole.add(face);
    return { grip: 0 };
  },

  crtmonitor(P) {
    const shellC = "#d8d2c0", shell = mat(shellC, { roughness: 0.6 }), dim = mat("#bdb7a4", { roughness: 0.6 });
    const cy = 0.16;   // the screen's centre height
    mesh(new THREE.BoxGeometry(0.2, 0.025, 0.2), dim, P.whole, 0, 0.0125, 0.0);   // foot
    mesh(new THREE.BoxGeometry(0.1, 0.015, 0.1), dim, P.whole, 0, 0.0325, 0.0);   // neck
    mesh(new THREE.BoxGeometry(0.3, 0.24, 0.12), shell, P.whole, 0, cy, 0.09);    // the front housing, z 0.03 .. 0.15
    // the tapering back: 0.30 x 0.24 at z 0.03 down to 0.20 x 0.16 at z -0.15
    const zF = 0.03, zB = -0.15, ctr = new THREE.Vector3(0, cy, (zF + zB) / 2), fw = 0.15, fh = 0.12, bw = 0.1, bh = 0.08;
    const F = [[-fw, cy - fh, zF], [fw, cy - fh, zF], [fw, cy + fh, zF], [-fw, cy + fh, zF]], B = [[-bw, cy - 0.01 - bh, zB], [bw, cy - 0.01 - bh, zB], [bw, cy - 0.01 + bh, zB], [-bw, cy - 0.01 + bh, zB]];
    const back = new THREE.Mesh(solid([[F[0], F[1], B[1], B[0]], [F[1], F[2], B[2], B[1]], [F[2], F[3], B[3], B[2]], [F[3], F[0], B[0], B[3]], [B[0], B[1], B[2], B[3]]], ctr), shell);
    back.castShadow = back.receiveShadow = true; P.whole.add(back);
    // the screen in a dark bezel lip
    mesh(new THREE.BoxGeometry(0.236, 0.186, 0.004), mat("#262a28", { roughness: 0.5 }), P.whole, 0, cy, 0.1505);
    const SW = 0.22, SH = 0.17, cw = 660, chh = 510, pitch = 74, mid = (i) => 28 + pitch / 2 + i * pitch;
    const font = '700 36px "DejaVu Sans Mono", "Liberation Mono", monospace', text = ["> NEW SOUL RECEIVED", "NAME: CHIP", "STATUS: STILL WAITING", "QUEUE: 4,081,220", "PLEASE HOLD..."], sixth = "> NEXT, PLEASE";
    const tex = canvasTex(cw, chh, (g) => {
      g.fillStyle = "#12261c"; g.fillRect(0, 0, cw, chh);
      g.fillStyle = "#9fe0b0"; g.font = font; g.textAlign = "left"; g.textBaseline = "middle";
      text.forEach((s, i) => g.fillText(s, 30, mid(i)));
    });
    const sm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, emissive: new THREE.Color("#ffffff"), emissiveMap: tex, emissiveIntensity: 0.55 }); sm.userData.noHatch = true;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), sm); screen.position.set(0, cy, 0.1527); P.whole.add(screen);
    // the sixth line: its own strip, cropped from the left by `typed` (the texture's repeat, not a squashed texture)
    const rowH = (pitch / chh) * SH, rowY = cy + SH / 2 - (mid(5) / chh) * SH;
    const tex6 = canvasTex(cw, pitch, (g) => { g.fillStyle = "#9fe0b0"; g.font = font; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(sixth, 30, pitch / 2); });
    const textEnd = 30 + sixth.length * 21.6 + 10, frac = textEnd / cw;
    const m6 = new THREE.MeshBasicMaterial({ map: tex6, transparent: true, depthWrite: false, toneMapped: false }); m6.userData.noOutline = true;
    const line6 = new THREE.Mesh(new THREE.PlaneGeometry(1, rowH), m6); line6.position.set(0, rowY, 0.1532); line6.renderOrder = 2; line6.castShadow = false; P.whole.add(line6);
    const curM = new THREE.MeshBasicMaterial({ color: "#9fe0b0", toneMapped: false }); curM.userData.noOutline = true;
    const cursor = new THREE.Mesh(new THREE.PlaneGeometry(0.0115, 0.0185), curM); cursor.position.z = 0.1533; cursor.castShadow = false; P.whole.add(cursor);
    // a small button on the lower bezel
    mesh(new THREE.BoxGeometry(0.014, 0.007, 0.006), mat("#a9a38f", { roughness: 0.5 }), P.whole, 0.1, 0.057, 0.153);
    return {
      grip: 0,
      apply(ps, t) {
        const ty = key(ps, P, "typed"), u = Math.max(0.0001, ty * frac);
        tex6.repeat.x = u; line6.scale.x = SW * u; line6.position.x = -SW / 2 + (SW * u) / 2; line6.visible = ty > 0.005;
        cursor.visible = ty > 0.005 && Math.floor((t ?? 0) * 2.5) % 2 === 0; cursor.position.set(-SW / 2 + SW * u + 0.006, rowY, 0.1533);
      },
    };
  },

  keyboard(P) {
    const W = 0.36, D = 0.13, Hf = 0.0113, Hb = 0.025, shell = mat("#d8d2c0", { roughness: 0.6 });
    const g = new THREE.BoxGeometry(W, Hb, D); g.translate(0, Hb / 2, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) > Hb / 2) p.setY(i, Hf + (Hb - Hf) * ((D / 2 - p.getZ(i)) / D));   // the top slopes up toward the back
    g.computeVertexNormals();
    mesh(g, shell, P.whole, 0, 0, 0);
    const slope = Math.atan2(Hb - Hf, D), len = Math.hypot(D, Hb - Hf), kw = W - 0.028, kh = len - 0.016, ppm = 4000;
    const cw = Math.round(kw * ppm), chh = Math.round(kh * ppm);
    const rows = [{ n: 12, x0: 0.0 }, { n: 11, x0: 0.016, enter: true }, { n: 10, x0: 0.032 }, { n: 0 }], pitch = chh / 4, ky = pitch * 0.82;
    const tex = canvasTex(cw, chh, (c) => {
      c.fillStyle = "#d8d2c0"; c.fillRect(0, 0, cw, chh);
      rows.forEach((row, ri) => {
        const y = ri * pitch + (pitch - ky) / 2, x0 = (row.x0 ?? 0) * ppm, span = cw - x0 - (ri === 3 ? 0 : (0.008 + ri * 0.004) * ppm);
        // uneven widths that add up to the row: the keys are never a clean grid
        let ws = row.n ? Array.from({ length: row.n }, (_, i) => 0.85 + 0.3 * rnd(ri * 31 + i)) : [1.3, 1, 5.2, 1, 1.3];
        const sum = ws.reduce((a, b) => a + b, 0), gap = 0.0016 * ppm;
        let x = x0;
        ws.forEach((w, i) => {
          const kwid = (w / sum) * span, red = row.enter && i === ws.length - 1;
          c.fillStyle = red ? "#b43a23" : "#f1ede2"; c.fillRect(x + gap, y, kwid - 2 * gap, ky);
          c.fillStyle = red ? "#8f2c1a" : "#cfc8b4"; c.fillRect(x + gap, y + ky * 0.8, kwid - 2 * gap, ky * 0.2);   // the lit top and the shaded lower lip
          x += kwid;
        });
      });
    });
    const km = mat("#ffffff", { map: tex, roughness: 0.65 }); km.userData.noHatch = true;
    const keys = new THREE.Mesh(new THREE.PlaneGeometry(kw, kh), km); keys.receiveShadow = true;
    keys.rotation.x = -Math.PI / 2 + slope; keys.position.set(0, (Hf + Hb) / 2 + 0.0006, 0.002); P.whole.add(keys);
    return { grip: 0 };
  },

  callbell(P) {
    const dark = mat("#3b2a20", { roughness: 0.55 }), brass = mat("#c9a23c", { roughness: 0.3, metalness: 0.5 }), brass2 = mat("#e0be5a", { roughness: 0.3, metalness: 0.5 });
    mesh(new THREE.CylinderGeometry(0.048, 0.05, 0.012, 28), dark, P.whole, 0, 0.006, 0);
    mesh(new THREE.SphereGeometry(0.045, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), brass, P.whole, 0, 0.012, 0);
    mesh(new THREE.CylinderGeometry(0.013, 0.014, 0.006, 16), brass, P.whole, 0, 0.0575, 0);   // the collar the button sits in
    const btn = mesh(new THREE.CylinderGeometry(0.008, 0.009, 0.01, 16), brass2, P.whole, 0, 0.0625, 0);
    return { grip: 0.069, apply(ps) { btn.position.y = 0.0625 - 0.004 * key(ps, P, "press"); } };
  },

  ticketsnail(P) {
    const R = 0.09, T = 0.07, B = 0.006, red = mat("#c8352b", { roughness: 0.45 }), grey = mat("#9aa3a8", { roughness: 0.4, metalness: 0.4 });
    mesh(new THREE.BoxGeometry(0.05, 0.22, B), grey, P.whole, 0, 0, B / 2);   // the bracket plate, flush on the wall
    for (const y of [-0.1, 0.1]) mesh(new THREE.SphereGeometry(0.005, 10, 8), mat("#7d868b", { metalness: 0.5, roughness: 0.4 }), P.whole, 0, y, B + 0.0015);
    const disc = mesh(new THREE.CylinderGeometry(R, R, T, 40), red, P.whole, 0, 0, B + T / 2); disc.rotation.x = Math.PI / 2;
    const cv = 512, spiral = canvasTex(cv, cv, (g) => {
      g.fillStyle = "#c8352b"; g.beginPath(); g.arc(cv / 2, cv / 2, cv / 2, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "#8f241c"; g.lineCap = "round"; g.lineWidth = 9; g.beginPath();
      for (let i = 0; i <= 220; i++) { const a = (i / 220) * Math.PI * 4.6, r = 22 + (i / 220) * (cv / 2 - 52); const x = cv / 2 + Math.cos(a) * r, y = cv / 2 - Math.sin(a) * r; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
      g.fillStyle = "#8f241c"; g.beginPath(); g.arc(cv / 2, cv / 2, 14, 0, Math.PI * 2); g.fill();
    });
    const fm = mat("#ffffff", { map: spiral, roughness: 0.45 }); fm.userData.noHatch = true;
    const front = new THREE.Mesh(new THREE.CircleGeometry(R * 0.985, 40), fm); front.position.z = B + T + 0.0008; P.whole.add(front);
    const tongue = mesh(new THREE.BoxGeometry(0.03, 0.04, 0.0015), mat("#fbf6ea", { roughness: 0.8 }), P.whole, 0, -0.095, B + T / 2); tongue.rotation.x = 0.1;   // its top end is inside the rim
    return { grip: 0 };
  },

  ticket(P) {
    const S = P.spec, W = 0.06, H = 0.11, D = 0.0012, c = 0.022, num = String(S.num ?? "417"), cr = 0.03;
    const paperM = mat("#fbf6ea", { roughness: 0.85 }), c0 = new THREE.Color("#fbf6ea"), c1 = new THREE.Color("#d9c79a");
    const sh = new THREE.Shape(); sh.moveTo(-W / 2, 0); sh.lineTo(W / 2, 0); sh.lineTo(W / 2, H - c); sh.lineTo(W / 2 - c, H); sh.lineTo(-W / 2, H); sh.closePath();
    const bodyG = new THREE.ExtrudeGeometry(sh, { depth: D, bevelEnabled: false }); bodyG.translate(0, 0, -D / 2);
    mesh(bodyG, paperM, P.whole);
    // the corner: a triangle that folds back on the cut's diagonal (a to b)
    const a = new THREE.Vector3(W / 2, H - c, 0), b = new THREE.Vector3(W / 2 - c, H, 0), axis = b.clone().sub(a).normalize();
    const flapG = new THREE.Shape(); flapG.moveTo(0, 0); flapG.lineTo(-c, c); flapG.lineTo(0, c); flapG.closePath();
    const fg = new THREE.ExtrudeGeometry(flapG, { depth: D, bevelEnabled: false }); fg.translate(0, 0, -D / 2);
    const flap = new THREE.Group(); flap.position.copy(a); P.whole.add(flap); mesh(fg, paperM, flap);
    const ppm = 4000, cw = Math.round(W * ppm), chh = Math.round(H * ppm);
    const tex = canvasTex(cw, chh, (g) => {
      g.clearRect(0, 0, cw, chh); g.fillStyle = "#b43a23"; g.textAlign = "center"; g.textBaseline = "alphabetic";
      const font = (f) => `800 ${f}px "DejaVu Sans Condensed", "DejaVu Sans", "Liberation Sans Narrow", Arial, sans-serif`, k = capRatio(g, font), fs = (cr * ppm) / k;
      g.font = font(fs); const wide = g.measureText(num).width, sx = Math.min(1, (W - 0.008) * ppm / wide);
      g.save(); g.translate(cw / 2, chh * 0.5 + (cr * ppm) / 2); g.scale(sx, 1); g.fillText(num, 0, 0); g.restore();
      g.globalAlpha = 0.6; g.fillRect(0.006 * ppm, 0.012 * ppm, cw - 0.012 * ppm, 0.0015 * ppm); g.fillRect(0.006 * ppm, chh - 0.0135 * ppm, cw - 0.012 * ppm, 0.0015 * ppm);
    });
    const nm = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }); nm.userData.noOutline = true; nm.userData.noHatch = true;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(W, H), nm); face.position.set(0, H / 2, D / 2 + 0.0002); face.renderOrder = 2; face.castShadow = false; P.whole.add(face);
    return {
      grip: 0.017,
      apply(ps) {
        const age = key(ps, P, "age");
        paperM.color.copy(c0).lerp(c1, age);
        flap.quaternion.setFromAxisAngle(axis, (-30 * Math.PI / 180) * age);
      },
    };
  },

  cobweb(P) {
    const S = P.spec, [p0, p1, p2] = (S.pts ?? [[0, 0, 0], [0.3, 0, 0], [0, -0.3, 0]]).map((p) => new THREE.Vector3(...p));
    const op = S.opacity ?? 0.7, M = new THREE.MeshBasicMaterial({ color: "#e8ecee", transparent: true, opacity: op, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }); M.userData.noOutline = true; M.userData.noHatch = true;
    const N = 6, R = 5, FR = [0.2, 0.38, 0.56, 0.75, 0.94], nrm = new THREE.Vector3().crossVectors(p1.clone().sub(p0), p2.clone().sub(p0)).normalize();
    const end = (i) => p1.clone().lerp(p2, i / (N - 1));
    const at = (i, k) => p0.clone().lerp(end(i), FR[k] * (1 + 0.07 * (rnd(i * 13 + k * 5 + 1) - 0.5)));
    let n = 0;
    // a strand of three points: its middle is pushed off the straight line by an amount fixed by its index, and a ring's toward the corner
    const strand = (a, b, sag, towards) => {
      const m = a.clone().lerp(b, 0.5), len = a.distanceTo(b), j = rnd(++n * 7.3) - 0.5;
      m.addScaledVector(nrm, j * 0.05 * len).addScaledVector(towards.clone().sub(m).normalize(), sag * len);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, m, b]), 6, 0.0015, 3, false), M);
      tube.castShadow = false; tube.frustumCulled = false; P.whole.add(tube);
    };
    for (let i = 0; i < N; i++) strand(p0, at(i, R - 1), 0, p0);
    for (let k = 0; k < R; k++) for (let i = 0; i < N - 1; i++) strand(at(i, k), at(i + 1, k), 0.09, p0);
    return { grip: 0 };
  },
};
