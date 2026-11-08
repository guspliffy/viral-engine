import * as THREE from "three";
import { clamp } from "./util.js";

// Props for Never Looks Up 07 "roller coaster" (8 Nov 2026, Jonny: "a keeps scrolling roller coaster short").
// Brief: /mnt/project-files/video-scripts/2026-11-04-never-looks-up/07-roller-coaster-ENGINE-PROMPT.md
//   coastertrack  a steel coaster track along a centreline. spec.pts [[x, y, z, ux, uy, uz], ...] in the prop's own
//                 frame: the line the wheels ride on (the middle between the rail tops) and the track's up there. The
//                 generator samples the same spline for the car's rig keys, so the car never leaves the rails.
//                 spec.gauge (m between the rails, 1.2), spec.color (rails and spine), spec.ties (m between cross ties,
//                 0.75), spec.supports (m between support columns, 3.5; 0 = none): white columns from the spine straight
//                 down to the ground (y 0) wherever the track is upright and over 1 m up.
//   coastercar    an open two-row car (its seats are carseat props riding the same rig, so "sit" works as usual).
//                 Origin on the rail line under the car's middle, front +z, up +y. spec.color (the body), spec.trim,
//                 spec.seatX ([-0.5, 0.5]: the seats' x), spec.rowZ ([0.55, -0.75]), spec.rise (0.25: the back row
//                 sits higher, like real coaster rows). `bar` 0..1 the lap bars (1 = down on the laps, 0 = up).
//                 Exports COASTER (its numbers) so a generator can seat the cast.
//   photopost     the trackside ride-photo camera: a white post, a dark camera box looking down the track (+z), a
//                 round "SMILE!" sign beside it. Origin at the post's foot. `flash` 0..1 lights the flash panel (it is
//                 additive and flagged steam: no check or body touches it).
//   photoscreen   the exit screen: a wooden kiosk frame with "YOUR RIDE PHOTO" on a header board and the photo on the
//                 screen. Origin at its foot, the screen faces +z. spec.photo (a picture's path, e.g. a still of the
//                 clip at the flash), spec.w (screen width, 2.4). `show` 0..1 fades the photo in from a dark screen.

export const COASTER = { floor: 0.34, seatX: [-0.5, 0.5], rowZ: [0.55, -0.75], rise: 0.25, gauge: 1.2, wheel: 0.11 };

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

// a tube swept along a polyline with our own frames (side, up), so it never twists the way a Frenet frame does on a
// loop. pts: Vector3[], ups: Vector3[], r: radius, off: [side, up] offset of the tube's centre from the line
function sweep(pts, ups, r, off = [0, 0], seg = 10) {
  const n = pts.length, pos = [], idx = [];
  for (let i = 0; i < n; i++) {
    const T = pts[Math.min(n - 1, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize();
    const U = ups[i].clone().sub(T.clone().multiplyScalar(ups[i].dot(T))).normalize(), S = new THREE.Vector3().crossVectors(T, U).normalize();
    const c = pts[i].clone().addScaledVector(S, off[0]).addScaledVector(U, off[1]);
    for (let j = 0; j <= seg; j++) {
      const a = (j / seg) * Math.PI * 2, p = c.clone().addScaledVector(S, Math.cos(a) * r).addScaledVector(U, Math.sin(a) * r);
      pos.push(p.x, p.y, p.z);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < seg; j++) {
    const a = i * (seg + 1) + j, b = a + seg + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// a box with rounded edges (a superellipsoid): seats, pads, the car's tub
function pad(w, h, d, n = 5) {
  const g = new THREE.SphereGeometry(1, 28, 18), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const f = (q) => Math.sign(q) * Math.abs(q) ** (2 / n); p.setXYZ(i, f(v.x) * w / 2, f(v.y) * h / 2, f(v.z) * d / 2); }
  g.computeVertexNormals(); return g;
}
// text painted on a canvas, as a texture (signs: plain words, no brand)
function textTexture(lines, { w = 512, h = 128, bg = "#fff6df", fg = "#c8352c", font = "900 72px sans-serif", round = false } = {}) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d");
  x.fillStyle = bg;
  if (round) { x.beginPath(); x.arc(w / 2, h / 2, Math.min(w, h) / 2 - 2, 0, Math.PI * 2); x.fill(); } else x.fillRect(0, 0, w, h);
  x.fillStyle = fg; x.font = font; x.textAlign = "center"; x.textBaseline = "middle";
  lines.forEach((s, i) => x.fillText(s, w / 2, h * (i + 1) / (lines.length + 1)));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const steamy = (o) => { o.frustumCulled = false; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.noOutline = true; return o; };

export const COASTER_KINDS = {
  coastertrack(P) {
    const S = P.spec, raw = S.pts || [[0, 0, 0, 0, 1, 0], [0, 0, 1, 0, 1, 0]];
    const pts = raw.map((q) => V3(q)), ups = raw.map((q) => new THREE.Vector3(q[3] ?? 0, q[4] ?? 1, q[5] ?? 0).normalize());
    const g2 = (S.gauge ?? COASTER.gauge) / 2, red = mat(S.color || "#e2453a", { roughness: 0.35, metalness: 0.3 });
    const white = mat(S.support || "#f3efe6", { roughness: 0.6 }), grey = mat("#7d838e", { roughness: 0.5, metalness: 0.3 });
    for (const s of [-1, 1]) mesh(sweep(pts, ups, 0.065, [s * g2, -0.065]), red, P.whole);   // the two running rails
    mesh(sweep(pts, ups, 0.17, [0, -0.42], 12), red, P.whole);                                 // the spine tube under them
    // cross ties: a flat bar between the rails and a web down to the spine, every S.ties metres along the track
    const every = S.ties ?? 0.75, tie = new THREE.BoxGeometry(g2 * 2 + 0.16, 0.07, 0.1), web = new THREE.BoxGeometry(0.08, 0.34, 0.08);
    let run = 0, nextSupport = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = pts[i].distanceTo(pts[i - 1]); run += d;
      if (run < every) continue; run = 0;
      const T = pts[Math.min(pts.length - 1, i + 1)].clone().sub(pts[i - 1]).normalize();
      const U = ups[i].clone().sub(T.clone().multiplyScalar(ups[i].dot(T))).normalize(), Sd = new THREE.Vector3().crossVectors(T, U).normalize();
      const M = new THREE.Matrix4().makeBasis(Sd, U, T), q = new THREE.Quaternion().setFromRotationMatrix(M);
      const a = mesh(tie, grey, P.whole); a.position.copy(pts[i]).addScaledVector(U, -0.13); a.quaternion.copy(q);
      for (const s of [-1, 1]) { const b = mesh(web, grey, P.whole); b.position.copy(pts[i]).addScaledVector(U, -0.3).addScaledVector(Sd, s * g2 * 0.55); b.quaternion.copy(q); b.rotateZ(s * 0.55); }
    }
    // support columns, measured along the track in the world frame of the prop (it stands with its origin on the ground)
    const gap = S.supports ?? 3.5; let along = 0;
    if (gap > 0) for (let i = 1; i < pts.length; i++) {
      along += pts[i].distanceTo(pts[i - 1]);
      if (along < nextSupport) continue;
      const U = ups[i], base = pts[i].clone().addScaledVector(U, -0.55);
      if (U.y < 0.6 || base.y < 1) continue;
      nextSupport = along + gap;
      const h = base.y, col = mesh(new THREE.CylinderGeometry(0.11, 0.15, h, 12), white, P.whole, base.x, h / 2, base.z);
      col.userData.support = true;
      mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.12, 14), grey, P.whole, base.x, 0.06, base.z);   // the footing on the grass
    }
    return { grip: 0 };
  },

  coastercar(P) {
    const S = P.spec, C = COASTER, body = mat(S.color || "#f3c13a", { roughness: 0.4, metalness: 0.15 }), trim = mat(S.trim || "#d8402f", { roughness: 0.45 });
    const dark = mat("#2b2d34", { roughness: 0.6 }), padM = mat("#25262c", { roughness: 0.8 });
    const sx = S.seatX || C.seatX, rz = S.rowZ || C.rowZ, rise = S.rise ?? C.rise, F = C.floor;
    const W = Math.abs(sx[1] - sx[0]) + 1.0, L = Math.abs(rz[0] - rz[1]) + 1.7, zMid = (rz[0] + rz[1]) / 2;
    // the chassis and bogies: wheels hug the two rails under the car (they never touch anything else)
    mesh(new THREE.BoxGeometry(W * 0.62, 0.12, L * 0.92), dark, P.whole, 0, F - 0.1, zMid);
    for (const zz of [rz[0] + 0.45, rz[1] - 0.25]) for (const s of [-1, 1]) {
      const w = mesh(new THREE.CylinderGeometry(C.wheel, C.wheel, 0.09, 16), dark, P.whole, s * C.gauge / 2, C.wheel - 0.02, zz); w.rotation.z = Math.PI / 2;
    }
    // the floor pan, then a rounded tub round both rows: low side walls (the riders' chests and faces stay clear), a
    // rounded nose with a trim stripe, a tall back with a little fin
    mesh(new THREE.BoxGeometry(W, 0.08, L), body, P.whole, 0, F, zMid);
    for (const s of [-1, 1]) { const side = mesh(pad(0.16, 0.62, L, 6), body, P.whole, s * (W / 2 - 0.08), F + 0.3, zMid); side.userData.coasterSide = true; }
    const nose = mesh(pad(W, 0.78, 0.7, 4), body, P.whole, 0, F + 0.3, rz[0] + 0.85); nose.scale.z = 1;
    mesh(pad(W * 0.94, 0.08, 0.5, 4), trim, P.whole, 0, F + 0.58, rz[0] + 0.88);                 // the stripe over the nose
    mesh(pad(W, 0.95, 0.3, 5), body, P.whole, 0, F + 0.45 + rise, rz[1] - 0.62);                  // the back wall behind row 2
    mesh(pad(0.1, 0.55, 0.42, 4), trim, P.whole, 0, F + 1.05 + rise, rz[1] - 0.66);                // the fin
    // the back row stands on a step, so its seats sit higher
    mesh(new THREE.BoxGeometry(W - 0.32, rise, 0.9), body, P.whole, 0, F + rise / 2, rz[1]);
    // lap bars: a padded U across each lap on an arm from the floor in front of the seat; `bar` swings them up
    const bars = [];
    rz.forEach((z, row) => sx.forEach((x) => {
      const g = new THREE.Group(); g.position.set(x, F + 0.12 + row * rise, z + 0.62); P.whole.add(g);
      mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.36, 10), dark, g, 0, 0.18, 0);                // the post
      const top = new THREE.Group(); top.position.set(0, 0.36, 0); g.add(top);
      const lap = mesh(pad(0.62, 0.11, 0.13, 4), padM, top, 0, 0.02, -0.16); lap.userData.lapbar = true;
      mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 8), dark, top, 0, 0.02, -0.06).rotation.x = Math.PI / 2;
      bars.push(top);
    }));
    return {
      grip: 0,
      apply(ps) { const k = clamp(ps.bar ?? 1); for (const b of bars) b.rotation.x = -(1 - k) * 1.2; },
    };
  },

  photopost(P) {
    const white = mat("#f3efe6"), dark = mat("#26272d", { roughness: 0.5 }), glassM = mat("#0e1016", { roughness: 0.1, metalness: 0.4 });
    mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.2, 12), white, P.whole, 0, 1.1, 0);
    const cam = new THREE.Group(); cam.position.set(0, 2.25, 0); cam.rotation.x = 0.12; P.whole.add(cam);
    mesh(pad(0.42, 0.3, 0.36, 4), dark, cam);
    mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.12, 18), glassM, cam, -0.06, 0, 0.22).rotation.x = Math.PI / 2;   // the lens
    const flashM = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const fl = steamy(new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.09), flashM)); fl.position.set(0.12, 0.08, 0.19); cam.add(fl);
    const glow = steamy(new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), flashM.clone())); glow.position.set(0.12, 0.08, 0.22); cam.add(glow);
    // the sign: a round board on its own arm, "SMILE!" (plain word, no brand)
    const sign = new THREE.Mesh(new THREE.CircleGeometry(0.34, 40), new THREE.MeshStandardMaterial({ map: textTexture(["SMILE!"], { w: 256, h: 256, font: "900 60px sans-serif", round: true }), transparent: true, roughness: 0.7 }));
    sign.position.set(0.5, 1.75, 0.02); P.whole.add(sign);
    mesh(new THREE.BoxGeometry(0.42, 0.05, 0.05), white, P.whole, 0.25, 1.75, -0.02);
    return {
      grip: 0,
      apply(ps) { const k = clamp(ps.flash ?? 0); flashM.opacity = k; glow.material.opacity = 0.55 * k * k; glow.scale.setScalar(0.4 + 0.6 * k); },
    };
  },

  photoscreen(P) {
    const S = P.spec, w = S.w ?? 2.4, h = w * 9 / 16, wood = mat("#8a5a36", { roughness: 0.8 }), frame = mat("#2b2d34", { roughness: 0.5 });
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.14, 1.2 + h + 0.7, 0.14), wood, P.whole, s * (w / 2 + 0.2), (1.2 + h + 0.7) / 2, -0.05);
    mesh(new THREE.BoxGeometry(w + 0.2, h + 0.2, 0.12), frame, P.whole, 0, 1.2 + h / 2, -0.06);
    const head = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.5, 0.42), new THREE.MeshStandardMaterial({ map: textTexture(["YOUR RIDE PHOTO"], { w: 1024, h: 160, font: "900 92px sans-serif", bg: "#c8352c", fg: "#fff6df" }), roughness: 0.7 }));
    head.position.set(0, 1.2 + h + 0.38, 0.03); P.whole.add(head);
    // the screen: the photo when it has loaded, eased in by `show` (an unlit picture, like a real display)
    const scrM = new THREE.MeshBasicMaterial({ color: "#000000" }), scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), scrM);
    scr.position.set(0, 1.2 + h / 2, 0.005); scr.userData.noOutline = true; P.whole.add(scr);
    const pic = { tex: null };
    if (S.photo) (globalThis.__loads ||= []).push(new THREE.ImageLoader().loadAsync(`/${S.photo.replace(/^\/+/, "")}`).then((img) => {
      const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; pic.tex = t; scrM.map = t; scrM.needsUpdate = true;
    }));
    return {
      grip: 0,
      apply(ps) { const k = clamp(ps.show ?? 1); scrM.color.setScalar(pic.tex ? k : 0.05); },
    };
  },
};
