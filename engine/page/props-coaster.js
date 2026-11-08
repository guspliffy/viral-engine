import * as THREE from "three";
import { clamp } from "./util.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Props for Never Looks Up 07 "roller coaster" (8 Nov 2026, Jonny: "a keeps scrolling roller coaster short").
// Brief: /mnt/project-files/video-scripts/2026-11-04-never-looks-up/07-roller-coaster-ENGINE-PROMPT.md
//   coastertrack  a steel coaster track along a centreline. spec.pts [[x, y, z, ux, uy, uz], ...] in the prop's own
//                 frame: the line the wheels ride on (the middle between the rail tops) and the track's up there. The
//                 generator samples the same spline for the car's rig keys, so the car never leaves the rails.
//                 spec.gauge (m between the rails, 1.2), spec.color (rails and spine), spec.ties (m between cross ties,
//                 0.75), spec.supports (m between support columns, 3.5; 0 = none): white columns from the spine straight
//                 down to the ground (y 0) wherever the track is upright and over 1 m up. spec.chunk (5 m) and spec.bend
//                 (12 deg): the longest straight piece and the most a piece may turn; each piece is its own mesh in its
//                 own frame, so its box hugs the rails (the contact checks read boxes first).
//   coastercar    an open two-row car (its seats are carseat props riding the same rig, so "sit" works as usual).
//                 Origin on the rail line under the car's middle, front +z, up +y. spec.color (the body), spec.trim,
//                 spec.seatX ([-0.5, 0.5]: the seats' x), spec.rowZ ([0.55, -0.75]), spec.rise (0.42: the back row
//                 sits higher, like real coaster rows, so all four faces show: Jonny's panels), spec.seatY (0.3: the front carseats' origin, a pedestal under
//                 each), spec.barUp / barZ (the T-bar's height over the cushion and its distance in front of the seat).
//                 `bar` 0..1 the lap bars (1 = down on the laps, 0 = up).
//                 Exports COASTER (its numbers) so a generator can seat the cast.
//   photopost     the trackside ride-photo camera: a white post (spec.h, 2.2 m), a dark camera box looking down the track (+z). Origin at the post's foot. `flash` 0..1 lights the flash panel (it is
//                 additive and flagged steam: no check or body touches it).
//   photoscreen   the exit kiosk (Jonny's panel 08): a dark monitor showing the ride photo, a red marquee over it ringed
//                 with bulbs (a camera icon, "YOUR RIDE PHOTO"), gold posts with red pennants, a red-and-cream striped
//                 awning over the booth under it. Origin at its foot, the screen faces +z. spec.photo (a picture's path,
//                 a still of the clip at the flash, cropped to the screen), spec.w / spec.h (the screen, 1.9 x 2.2 m).
//                 `show` 0..1 fades the photo in from a dark screen.
//   smilesign     the wooden "SMILE!" board with a camera icon on a short post (panel 06). Origin at the post's foot,
//                 the board faces +z; spec.w its width (0.95), spec.board the height of its lower edge (0.95).
//   farplate      a painting hung on one shot camera's rays far away (the fair far below, for panels 01, 04, 05): from
//                 spec.eye looking at spec.look, spec.dist metres out (160), spec.vfov the picture's own vertical field of
//                 view (46), spec.shift [x, y] slides it across the view (shares of its width / height), spec.fade the top
//                 share that fades into the set's sky (0.3). The set's hill hides it below the brink. `show` 0/1.
//   pennant       a red triangle flag on a white pole (spec.h 4 m, spec.color); `wave` (any number, keyed on the clock)
//                 ripples it in the wind.
//   popcornfly    loose popcorn on computed paths (the generator integrates gravity, the car's own acceleration and the
//                 wind in the car's frame): spec.ks [{ t0, dt, p: [x, y, z, x, y, z, ...] }] samples every dt seconds
//                 from t0, in the prop's frame (ride it on the car's rig), on the clip's clock (or a keyed `t`);
//                 a piece shows from its first sample to its last. Never solid.
//   headsprout    a potato sprout to stick on a head (the Wizard's, once his hat is gone): spec.color. Never solid.
//   gulls         spec.n gulls circling high up (spec.at [x, y, z] the middle of their circle, spec.r 14 m), wings
//                 flapping and gliding; `t` (seconds, keyed on the clock) moves them. Background only.

export const COASTER = { floor: 0.34, seatX: [-0.5, 0.5], rowZ: [0.55, -0.75], rise: 0.42, gauge: 1.2, wheel: 0.11, seatY: 0.3, barUp: 0.24, barZ: 0.44 };

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
function canvasTex2(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const steamy = (o) => { o.frustumCulled = false; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.noOutline = true; return o; };

export const COASTER_KINDS = {
  coastertrack(P) {
    const S = P.spec, raw = S.pts || [[0, 0, 0, 0, 1, 0], [0, 0, 1, 0, 1, 0]];
    const pts = raw.map((q) => V3(q)), ups = raw.map((q) => new THREE.Vector3(q[3] ?? 0, q[4] ?? 1, q[5] ?? 0).normalize());
    const g2 = (S.gauge ?? COASTER.gauge) / 2, red = mat(S.color || "#d23a30", { roughness: 0.35, metalness: 0.3 });
    const white = mat(S.support || "#f3efe6", { roughness: 0.6 }), grey = mat("#7d838e", { roughness: 0.5, metalness: 0.3 }), tieM = mat(S.tie || "#a92a25", { roughness: 0.5 });
    // the track is drawn in pieces (up to 5 m, shorter where it bends), each one mesh per material built in the piece's
    // own frame (along, up, side of the track): thousands of loose boxes would swamp the drawn lines, and a mesh built in
    // world space has a box that holds the car above it on a slope or round the loop, so the contact checks measured the
    // riders as inside the track and every triangle of it against every hand part, every frame
    const CH = S.chunk ?? 5, BEND = ((S.bend ?? 12) * Math.PI) / 180, chunkOf = [0];
    { let run = 0, k = 0, t0 = null;
      for (let i = 1; i < pts.length; i++) {
        const T = pts[i].clone().sub(pts[i - 1]).normalize(); if (!t0) t0 = T;
        run += pts[i].distanceTo(pts[i - 1]);
        if (run >= CH || T.angleTo(t0) > BEND || ups[i].angleTo(ups[chunkOf.indexOf(k)]) > BEND) { run = 0; k++; t0 = T; }
        chunkOf.push(k);
      } }
    const nChunks = chunkOf.at(-1) + 1, frames = [];
    for (let k = 0; k < nChunks; k++) {
      const i0 = chunkOf.indexOf(k), i1 = chunkOf.lastIndexOf(k), im = Math.round((i0 + i1) / 2);
      const T = pts[Math.min(pts.length - 1, im + 1)].clone().sub(pts[Math.max(0, im - 1)]).normalize();
      const U = ups[im].clone().sub(T.clone().multiplyScalar(ups[im].dot(T))).normalize(), Sd = new THREE.Vector3().crossVectors(T, U).normalize();
      const Mk = new THREE.Matrix4().makeBasis(Sd, U, T).setPosition(pts[im]);
      frames.push({ M: Mk, inv: Mk.clone().invert() });
    }
    // a geometry built in world space, moved into piece k's frame, as a mesh placed back where it was
    const placed = (geo, m, k) => { geo.applyMatrix4(frames[k].inv); geo.computeBoundingBox(); geo.computeBoundingSphere(); const o = mesh(geo, m, P.whole); frames[k].M.decompose(o.position, o.quaternion, o.scale); return o; };
    for (let k = 0; k < nChunks; k++) {
      const i0 = Math.max(0, chunkOf.indexOf(k) - 1), i1 = chunkOf.lastIndexOf(k) + 1, cp = pts.slice(i0, i1 + 1), cu = ups.slice(i0, i1 + 1);
      if (cp.length < 2) continue;
      for (const s of [-1, 1]) placed(sweep(cp, cu, 0.065, [s * g2, -0.065]), red, k);   // the two running rails
      placed(sweep(cp, cu, 0.17, [0, -0.42], 12), red, k);                                 // the spine tube under them
    }
    const parts = { tie: [], web: [], white: [], foot: [] }, M = new THREE.Matrix4(), Q = new THREE.Quaternion(), ONE = new THREE.Vector3(1, 1, 1);
    const tieChunks = Array.from({ length: nChunks }, () => ({ tie: [], web: [] }));
    const put = (list, geo, pos, quat, extra = null) => { const g = geo.clone(); if (extra) g.applyMatrix4(extra); g.applyMatrix4(M.compose(pos, quat, ONE)); list.push(g); };
    // cross ties: a flat bar between the rails and a web down to the spine, every S.ties metres along the track
    const every = S.ties ?? 0.75, tie = new THREE.BoxGeometry(g2 * 2 + 0.16, 0.07, 0.1), web = new THREE.BoxGeometry(0.08, 0.34, 0.08);
    let run = 0;
    for (let i = 1; i < pts.length; i++) {
      run += pts[i].distanceTo(pts[i - 1]);
      if (run < every) continue; run = 0;
      const T = pts[Math.min(pts.length - 1, i + 1)].clone().sub(pts[i - 1]).normalize();
      const U = ups[i].clone().sub(T.clone().multiplyScalar(ups[i].dot(T))).normalize(), Sd = new THREE.Vector3().crossVectors(T, U).normalize();
      Q.setFromRotationMatrix(new THREE.Matrix4().makeBasis(Sd, U, T));
      const tc = tieChunks[chunkOf[i]];
      put(tc.tie, tie, pts[i].clone().addScaledVector(U, -0.13), Q);
      for (const s of [-1, 1]) put(tc.web, web, pts[i].clone().addScaledVector(U, -0.3).addScaledVector(Sd, s * g2 * 0.55), Q, new THREE.Matrix4().makeRotationZ(s * 0.55));
    }
    // white steel lattice towers (Jonny's panels): four legs and X bracing every ~1.2 m, square to the track, from the
    // spine straight down to the ground (y 0) wherever the track is upright and over 1 m up; spec.supports m apart
    const gap = S.supports ?? 3.5; let along = 0, nextSupport = 0;
    if (gap > 0) for (let i = 1; i < pts.length; i++) {
      along += pts[i].distanceTo(pts[i - 1]);
      if (along < nextSupport) continue;
      const U = ups[i], base = pts[i].clone().addScaledVector(U, -0.55);
      if (U.y < 0.6 || base.y < 1) continue;
      nextSupport = along + gap;
      parts.white = []; parts.foot = [];   // each tower is its own mesh
      const h = base.y, half = 0.32, T = pts[Math.min(pts.length - 1, i + 1)].clone().sub(pts[i - 1]); T.y = 0; T.normalize();
      const Sd = new THREE.Vector3(T.z, 0, -T.x), tq = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(Sd, new THREE.Vector3(0, 1, 0), T));
      const at = (x, y, z) => new THREE.Vector3(x, y, z).applyQuaternion(tq).add(new THREE.Vector3(base.x, 0, base.z));
      for (const [a, b] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) put(parts.white, new THREE.BoxGeometry(0.07, h, 0.07), at(a * half, h / 2, b * half), tq);
      const n = Math.max(1, Math.round(h / 1.2)), dh = h / n, diag = Math.hypot(2 * half, dh), brace = new THREE.BoxGeometry(0.04, diag, 0.04);
      for (let k = 0; k < n; k++) for (const [ax, face] of [["x", -1], ["x", 1], ["z", -1], ["z", 1]]) for (const sgn of [-1, 1]) {
        const r = ax === "x" ? new THREE.Matrix4().makeRotationX(sgn * Math.atan2(2 * half, dh)) : new THREE.Matrix4().makeRotationZ(sgn * Math.atan2(2 * half, dh));
        put(parts.white, brace, at(ax === "x" ? face * half : 0, (k + 0.5) * dh, ax === "z" ? face * half : 0), tq, r);
      }
      for (let k = 1; k <= n; k++) for (const ax of ["x", "z"]) for (const face of [-1, 1])   // the horizontal rings
        put(parts.white, new THREE.BoxGeometry(ax === "x" ? 2 * half : 0.05, 0.05, ax === "z" ? 2 * half : 0.05), at(ax === "z" ? face * half : 0, Math.min(h, k * dh), ax === "x" ? face * half : 0), tq);
      put(parts.foot, new THREE.BoxGeometry(2 * half + 0.3, 0.12, 2 * half + 0.3), at(0, 0.06, 0), tq);   // the footing on the grass
      mesh(mergeGeometries(parts.white), white, P.whole); mesh(mergeGeometries(parts.foot), grey, P.whole);
    }
    tieChunks.forEach((tc, k) => { for (const [n, m] of [["tie", tieM], ["web", grey]]) if (tc[n].length) placed(mergeGeometries(tc[n]), m, k); });
    return { grip: 0 };
  },

  coastercar(P) {
    // Jonny's panels: a deep red tub with a gold rim, gold leaf scrolls on the nose and sides, grey tubular lap bars
    const S = P.spec, C = COASTER, body = mat(S.color || "#b3242b", { roughness: 0.42, metalness: 0.1 }), gold = mat(S.trim || "#e3a83a", { roughness: 0.35, metalness: 0.45 });
    const dark = mat("#2b2d34", { roughness: 0.6 }), barM = mat("#8f949c", { roughness: 0.35, metalness: 0.6 });
    const sx = S.seatX || C.seatX, rz = S.rowZ || C.rowZ, rise = S.rise ?? C.rise, F = C.floor;
    const W = Math.abs(sx[1] - sx[0]) + 1.0, L = Math.abs(rz[0] - rz[1]) + 1.7, zMid = (rz[0] + rz[1]) / 2;
    // the chassis and bogies: wheels hug the two rails under the car (they never touch anything else)
    mesh(new THREE.BoxGeometry(W * 0.62, 0.12, L * 0.92), dark, P.whole, 0, F - 0.1, zMid);
    for (const zz of [rz[0] + 0.45, rz[1] - 0.25]) for (const s of [-1, 1]) {
      const w = mesh(new THREE.CylinderGeometry(C.wheel, C.wheel, 0.09, 16), dark, P.whole, s * C.gauge / 2, C.wheel - 0.02, zz); w.rotation.z = Math.PI / 2;
    }
    // gold leaf scrolls painted on a canvas (a decal on the nose and the sides)
    const leaf = textTexture([], { w: 512, h: 256, bg: "rgba(0,0,0,0)" });
    { const c = leaf.image, x = c.getContext("2d"); x.clearRect(0, 0, 512, 256); x.fillStyle = "#e9b143"; x.strokeStyle = "#a8701e"; x.lineWidth = 5;
      const frond = (cx, cy, dir, sc) => { x.save(); x.translate(cx, cy); x.scale(dir * sc, sc);
        x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(60, -10, 120, -60, 190, -40); x.bezierCurveTo(140, -30, 110, 10, 60, 20); x.closePath(); x.fill(); x.stroke();
        for (let i = 0; i < 4; i++) { x.beginPath(); const a = 40 + i * 38; x.ellipse(a, -18 - i * 6, 26, 10, -0.5, 0, Math.PI * 2); x.fill(); x.stroke(); }
        x.restore(); };
      frond(256, 150, 1, 1.0); frond(256, 150, -1, 1.0);
      x.beginPath(); x.moveTo(256, 60); x.bezierCurveTo(290, 120, 280, 170, 256, 200); x.bezierCurveTo(232, 170, 222, 120, 256, 60); x.fill(); x.stroke();
      leaf.needsUpdate = true; }
    const decal = (w, h, x, y, z, ry = 0) => { const d = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: leaf, transparent: true, roughness: 0.4, metalness: 0.3, polygonOffset: true, polygonOffsetFactor: -2 })); d.position.set(x, y, z); d.rotation.y = ry; d.userData.noOutline = true; d.castShadow = false; P.whole.add(d); return d; };
    // the floor pan, then the tub: side walls up to the lap bars, a tall rounded nose in front of row 1, a back wall
    mesh(new THREE.BoxGeometry(W, 0.08, L), body, P.whole, 0, F, zMid);
    for (const s of [-1, 1]) {
      const side = mesh(pad(0.18, 0.62, L, 6), body, P.whole, s * (W / 2 - 0.09), F + 0.3, zMid); side.userData.coasterSide = true;
      mesh(pad(0.22, 0.07, L + 0.02, 4), gold, P.whole, s * (W / 2 - 0.09), F + 0.62, zMid);                 // the gold rim along its top
      decal(L * 0.55, L * 0.24, s * (W / 2 + 0.005), F + 0.3, zMid, s * Math.PI / 2);
    }
    // the nose: about as high as the lap bars, so every face shows over it (Jonny's panels 01-07)
    const nose = mesh(pad(W, 0.7, 0.62, 4), body, P.whole, 0, F + 0.3, rz[0] + 0.86); nose.userData.coasterNose = true;
    mesh(pad(W + 0.02, 0.08, 0.66, 4), gold, P.whole, 0, F + 0.65, rz[0] + 0.86);                                  // gold rim over the nose
    decal(W * 0.8, W * 0.34, 0, F + 0.3, rz[0] + 1.175);
    mesh(pad(W, 1.0, 0.28, 5), body, P.whole, 0, F + 0.5 + rise, rz[1] - 0.62);                                    // the back wall behind row 2
    mesh(pad(W + 0.02, 0.08, 0.32, 4), gold, P.whole, 0, F + 1.0 + rise, rz[1] - 0.62);
    // the back row stands on a step, so its seats sit higher
    mesh(new THREE.BoxGeometry(W - 0.36, rise, 0.9), body, P.whole, 0, F + rise / 2, rz[1]);
    // a pedestal under each seat (the carseat props ride the same rig: their origin at seatY, cushion top seatY + 0.42)
    const seatY = S.seatY ?? C.seatY, ped = mat("#5a1418", { roughness: 0.7 });
    rz.forEach((z, row) => sx.forEach((x) => { const y0 = F + 0.04 + row * rise, y1 = seatY + row * rise + 0.3; if (y1 > y0 + 0.02) mesh(new THREE.BoxGeometry(0.6, y1 - y0, 0.5), ped, P.whole, x, (y0 + y1) / 2, z + 0.02); }));
    // lap bars: a T-bar per seat, a post up from the floor in front of the seat and a grey tube across in front of the
    // belly at hand height (the gloves rest on it); `bar` swings them forward and up off the laps (0)
    const bars = [];
    rz.forEach((z, row) => sx.forEach((x) => {
      const sit = seatY + 0.42 + row * rise, by = sit + (S.barUp ?? C.barUp), bz = z + (S.barZ ?? C.barZ), base = F + 0.04 + row * rise;
      const g = new THREE.Group(); g.position.set(x, base, bz + 0.08); P.whole.add(g);
      mesh(new THREE.CylinderGeometry(0.04, 0.05, by - base, 10), dark, g, 0, (by - base) / 2, -0.04);   // the post
      const cross = mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.62, 12), barM, g, 0, by - base, -0.08); cross.rotation.z = Math.PI / 2; cross.userData.lapbar = true;
      for (const s of [-1, 1]) { const end = mesh(new THREE.SphereGeometry(0.045, 12, 8), barM, g, s * 0.31, by - base, -0.08); end.userData.lapbar = true; }
      mesh(new THREE.BoxGeometry(0.1, 0.08, 0.1), dark, g, 0, by - base - 0.02, -0.06);   // the clamp
      bars.push(g);
    }));
    return {
      grip: 0,
      apply(ps) { const k = clamp(ps.bar ?? 1); for (const b of bars) b.rotation.x = -(1 - k) * 1.2; },
    };
  },

  photopost(P) {
    const white = mat("#f3efe6"), dark = mat("#26272d", { roughness: 0.5 }), glassM = mat("#0e1016", { roughness: 0.1, metalness: 0.4 });
    const h = P.spec.h ?? 2.2;   // the camera box's height: at the riders' faces (they pass on rails above the grass)
    mesh(new THREE.CylinderGeometry(0.07, 0.09, h, 12), white, P.whole, 0, h / 2, 0);
    const cam = new THREE.Group(); cam.position.set(0, h + 0.05, 0); cam.rotation.x = 0.12; P.whole.add(cam);
    mesh(pad(0.42, 0.3, 0.36, 4), dark, cam);
    mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.12, 18), glassM, cam, -0.06, 0, 0.22).rotation.x = Math.PI / 2;   // the lens
    const flashM = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const fl = steamy(new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.09), flashM)); fl.position.set(0.12, 0.08, 0.19); cam.add(fl);
    const glow = steamy(new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), flashM.clone())); glow.position.set(0.12, 0.08, 0.22); cam.add(glow);
    return {
      grip: 0,
      apply(ps) { const k = clamp(ps.flash ?? 0); flashM.opacity = k; glow.material.opacity = 0.55 * k * k; glow.scale.setScalar(0.4 + 0.6 * k); },
    };
  },

  photoscreen(P) {
    const S = P.spec, w = S.w ?? 1.9, h = S.h ?? 2.2, yb = S.base ?? 1.45;
    const gold = mat("#e0a63c", { roughness: 0.3, metalness: 0.55 }), frameM = mat("#3b3e46", { roughness: 0.45, metalness: 0.2 }), red = mat("#9d2026", { roughness: 0.55 });
    const cream = mat("#f4e6c8", { roughness: 0.7 }), darkM = mat("#2a1b1d", { roughness: 0.8 });
    // the monitor: a thick dark bezel round the screen
    mesh(pad(w + 0.34, h + 0.34, 0.24, 6), frameM, P.whole, 0, yb + h / 2, -0.12);
    const scrM = new THREE.MeshBasicMaterial({ color: "#000000", toneMapped: false }), scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), scrM);
    scr.position.set(0, yb + h / 2, 0.005); scr.userData.noOutline = true; P.whole.add(scr);
    const pic = { tex: null };
    if (S.photo) (globalThis.__loads ||= []).push(new THREE.ImageLoader().loadAsync(`/${S.photo.replace(/^\/+/, "")}`).then((img) => {
      const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; pic.tex = t; scrM.map = t; scrM.needsUpdate = true;
    }));
    // gold posts either side, ball tops, collars, a red pennant from each top
    const px = w / 2 + 0.45, ph = yb + h + 1.45;
    for (const s of [-1, 1]) {
      mesh(new THREE.CylinderGeometry(0.075, 0.09, ph, 16), gold, P.whole, s * px, ph / 2, -0.1);
      mesh(new THREE.SphereGeometry(0.13, 18, 12), gold, P.whole, s * px, ph + 0.1, -0.1);
      for (const y of [0.25, yb - 0.05, yb + h + 0.1]) mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), gold, P.whole, s * px, y, -0.1);
      const fl = new THREE.Shape(); fl.moveTo(0, 0); fl.lineTo(s * 0.62, -0.17); fl.lineTo(0, -0.34); fl.closePath();
      const f = mesh(new THREE.ShapeGeometry(fl), mat("#d43a32", { side: THREE.DoubleSide }), P.whole, s * px, ph - 0.05, -0.1); f.castShadow = false;
    }
    // the marquee: an arched red board with a gold rim, the words and a camera icon painted on, real bulbs round it
    const mw = w + 0.75, mh = 1.0, arch = 0.3, my = yb + h + 0.2;
    const outline = (k = 0) => { const sh = new THREE.Shape(), a = mw / 2 - k, b = mh - k, c = arch;
      sh.moveTo(-a, k); sh.lineTo(a, k); sh.lineTo(a, b - c * 0.4); sh.quadraticCurveTo(a, b - c * 0.1, a * 0.55, b - c * 0.15);
      sh.quadraticCurveTo(0, b + c * 1.1, -a * 0.55, b - c * 0.15); sh.quadraticCurveTo(-a, b - c * 0.1, -a, b - c * 0.4); sh.closePath(); return sh; };
    const body = mesh(new THREE.ExtrudeGeometry(outline(), { depth: 0.14, bevelEnabled: false }), gold, P.whole, 0, my, -0.18);
    const face = new THREE.ShapeGeometry(outline(0.07), 24), fp = face.attributes.position, fu = face.attributes.uv;
    for (let i = 0; i < fp.count; i++) fu.setXY(i, (fp.getX(i) + mw / 2) / mw, fp.getY(i) / (mh + arch));
    const sign = canvasTex2(1024, Math.round(1024 * (mh + arch) / mw), (x, W, H) => {
      x.fillStyle = "#8c1b22"; x.fillRect(0, 0, W, H);
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "rgba(255,255,255,0.08)"); g.addColorStop(1, "rgba(0,0,0,0.18)"); x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.fillStyle = "#fbefd2"; x.textAlign = "center"; x.textBaseline = "middle";
      { let fs = 118; x.font = `900 ${fs}px sans-serif`; const wd = x.measureText("YOUR RIDE PHOTO").width; if (wd > W * 0.84) { fs = Math.floor(fs * (W * 0.84) / wd); x.font = `900 ${fs}px sans-serif`; } }   // fits inside the board
      x.fillText("YOUR RIDE PHOTO", W / 2, H * 0.68);
      // the camera icon in the arch, with little rays
      const cx = W / 2, cy = H * 0.3; x.strokeStyle = "#fbefd2"; x.lineWidth = 10; x.lineJoin = "round";
      x.beginPath(); x.roundRect(cx - 62, cy - 34, 124, 82, 12); x.stroke(); x.beginPath(); x.arc(cx, cy + 7, 24, 0, Math.PI * 2); x.stroke();
      x.beginPath(); x.moveTo(cx - 26, cy - 34); x.lineTo(cx - 16, cy - 50); x.lineTo(cx + 16, cy - 50); x.lineTo(cx + 26, cy - 34); x.stroke();
      for (const a of [-2.4, -1.57, -0.74]) { x.beginPath(); x.moveTo(cx + Math.cos(a) * 82, cy + Math.sin(a) * 62); x.lineTo(cx + Math.cos(a) * 104, cy + Math.sin(a) * 80); x.stroke(); }
    });
    const fm = new THREE.Mesh(face, new THREE.MeshStandardMaterial({ map: sign, roughness: 0.6 })); fm.position.set(0, my, -0.035); fm.userData.noOutline = true; P.whole.add(fm);
    const bulbM = new THREE.MeshBasicMaterial({ color: "#fff3c4", toneMapped: false }), bulbG = new THREE.SphereGeometry(0.035, 10, 8);
    const ring = outline(0.035).getSpacedPoints(64);
    ring.forEach((q, i) => { if (i % 2) return; const b = new THREE.Mesh(bulbG, bulbM); b.position.set(q.x, my + q.y, -0.02); b.userData.noOutline = true; P.whole.add(b); });
    // the booth under the screen: a cream counter front with a dark hatch, a striped awning sloping out over it
    mesh(new THREE.BoxGeometry(w + 0.5, yb - 0.2, 0.7), cream, P.whole, 0, (yb - 0.2) / 2, -0.4);
    mesh(new THREE.BoxGeometry(w - 0.2, (yb - 0.2) * 0.55, 0.02), darkM, P.whole, 0, (yb - 0.2) * 0.5, -0.04);
    mesh(new THREE.BoxGeometry(w + 0.6, 0.07, 0.8), red, P.whole, 0, 0.035, -0.4);
    const stripes = canvasTex2(512, 160, (x, W, H) => {
      x.clearRect(0, 0, W, H); const n = 9, sw = W / n;
      for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? "#f6ead2" : "#c9302c"; x.fillRect(i * sw, 0, sw, H * 0.78);
        x.beginPath(); x.arc(i * sw + sw / 2, H * 0.78, sw / 2, 0, Math.PI); x.fill(); }   // the scalloped hem
    });
    const aw = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.6, 0.62), new THREE.MeshStandardMaterial({ map: stripes, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.75 }));
    aw.position.set(0, yb - 0.32, 0.18); aw.rotation.x = 0.85; aw.castShadow = true; P.whole.add(aw);
    return {
      grip: 0,
      apply(ps) { const k = clamp(ps.show ?? 1); scrM.color.setScalar(pic.tex ? k : 0.04); },
    };
  },

  smilesign(P) {
    // Jonny's panel 06: a wooden board on a post, "SMILE!" in dark brown, a camera icon with little red rays
    const wood = mat("#a87a4a", { roughness: 0.85 }), w = P.spec.w ?? 0.95, h = w * 0.82, y = P.spec.board ?? 0.95;   // (spec.y is where the prop stands)
    mesh(new THREE.BoxGeometry(0.1, y + h * 0.5, 0.1), wood, P.whole, 0, (y + h * 0.5) / 2, -0.07);
    mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.06), mat("#6f4a2a", { roughness: 0.85 }), P.whole, 0, y + h / 2, -0.01);
    const tex = canvasTex2(512, Math.round(512 * h / w), (x, W, H) => {
      x.fillStyle = "#e7c58f"; x.fillRect(0, 0, W, H);
      for (let i = 1; i < 4; i++) { x.fillStyle = "rgba(120,80,40,0.35)"; x.fillRect(0, (H * i) / 4 - 2, W, 4); }      // the plank joints
      for (let i = 0; i < 40; i++) { x.strokeStyle = "rgba(150,100,55,0.18)"; x.lineWidth = 2; const yy = (i * 37) % H; x.beginPath(); x.moveTo(0, yy); x.bezierCurveTo(W * 0.3, yy + 6, W * 0.6, yy - 6, W, yy + 3); x.stroke(); }
      x.strokeStyle = "#5b3a20"; x.lineWidth = 14; x.strokeRect(10, 10, W - 20, H - 20);
      x.fillStyle = "#4a2c18"; x.font = "900 120px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("SMILE!", W / 2, H * 0.33);
      const cx = W / 2, cy = H * 0.7; x.fillStyle = "#4a2c18";
      x.beginPath(); x.roundRect(cx - 52, cy - 30, 104, 70, 10); x.fill(); x.fillRect(cx - 20, cy - 42, 40, 14);
      x.fillStyle = "#e7c58f"; x.beginPath(); x.arc(cx, cy + 5, 21, 0, Math.PI * 2); x.fill(); x.fillStyle = "#4a2c18"; x.beginPath(); x.arc(cx, cy + 5, 12, 0, Math.PI * 2); x.fill();
      x.strokeStyle = "#c9302c"; x.lineWidth = 9; x.lineCap = "round";
      for (const s of [-1, 1]) for (const a of [-0.5, 0, 0.5]) { x.beginPath(); x.moveTo(cx + s * 72, cy + 5 + a * 40); x.lineTo(cx + s * 100, cy + 5 + a * 58); x.stroke(); }
    });
    const f = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 })); f.position.set(0, y + h / 2, 0.025); f.userData.noOutline = true; P.whole.add(f);
    return { grip: 0 };
  },

  farplate(P) {
    const S = P.spec, eye = V3(S.eye || [0, 10, 0]), look = V3(S.look || [0, 8, -10]), dist = S.dist ?? 160, vfov = ((S.vfov ?? 46) * Math.PI) / 180;
    const dir = look.clone().sub(eye).normalize(), h = 2 * dist * Math.tan(vfov / 2);
    const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3().crossVectors(right, dir);
    const m = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: true, fog: false, toneMapped: false, color: "#ffffff" });
    m.userData.noOutline = true;
    const q = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); q.renderOrder = -900; q.frustumCulled = false; q.visible = false;
    q.userData.steam = true; q.castShadow = q.receiveShadow = false;
    q.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, dir.clone().negate()));
    P.whole.add(q);
    const ready = { ok: false };
    (globalThis.__loads ||= []).push(new THREE.ImageLoader().loadAsync(`/${S.src.replace(/^\/+/, "")}`).then((img) => {
      // the top share fades out into the set's sky, so the painting's own sky meets the dome without a line
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const x = c.getContext("2d"); x.drawImage(img, 0, 0);
      const f = S.fade ?? 0.3; if (f > 0) { x.globalCompositeOperation = "destination-out"; const g = x.createLinearGradient(0, 0, 0, img.height * f); g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, img.width, img.height * f); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; m.map = t; m.needsUpdate = true;
      const w = (h * img.width) / img.height, [sx, sy] = S.shift || [0, 0];
      q.scale.set(w, h, 1);
      q.position.copy(eye).addScaledVector(dir, dist).addScaledVector(right, sx * w).addScaledVector(up, sy * h);
      ready.ok = true;
    }));
    return { grip: 0, apply(ps) { q.visible = ready.ok && (ps.show ?? 1) > 0.5; } };
  },

  pennant(P) {
    const S = P.spec, h = S.h ?? 4, fw = S.w ?? 1.1, fh = fw * 0.45;
    mesh(new THREE.CylinderGeometry(0.035, 0.045, h, 10), mat("#f1ece2"), P.whole, 0, h / 2, 0);
    mesh(new THREE.SphereGeometry(0.06, 12, 8), mat("#e0a63c", { metalness: 0.5, roughness: 0.3 }), P.whole, 0, h + 0.04, 0);
    const geo = new THREE.PlaneGeometry(fw, fh, 12, 1), pos = geo.attributes.position, base = pos.array.slice();
    for (let i = 0; i < pos.count; i++) { const u = (base[i * 3] + fw / 2) / fw; pos.setX(i, u * fw); pos.setY(i, base[i * 3 + 1] * (1 - u)); }   // a triangle: tapers to the tip
    const tri = pos.array.slice();
    const flag = mesh(geo, mat(S.color || "#d43a32", { side: THREE.DoubleSide, roughness: 0.7 }), P.whole, 0.03, h - fh / 2 - 0.05, 0); flag.castShadow = false;
    return {
      grip: 0,
      apply(ps) {
        const t = ps.wave ?? 0;
        for (let i = 0; i < pos.count; i++) { const x = tri[i * 3], u = x / fw; pos.setZ(i, Math.sin(x * 4.2 - t * 7.5) * 0.09 * u); pos.setY(i, tri[i * 3 + 1] - u * u * 0.06); }
        pos.needsUpdate = true; geo.computeVertexNormals();
      },
    };
  },

  gulls(P) {
    const S = P.spec, n = S.n ?? 4, R = S.r ?? 14, at = V3(S.at || [0, 18, -20]);
    const white = new THREE.MeshLambertMaterial({ color: "#fbfbf7" }), grey = new THREE.MeshLambertMaterial({ color: "#dfe5ea" }), tipM = new THREE.MeshLambertMaterial({ color: "#2e3236" });
    const birds = [];
    for (let i = 0; i < n; i++) {
      const g = new THREE.Group(), sc = (S.size ?? 1) * (0.85 + ((i * 37) % 10) / 30);
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), white); b.scale.set(0.8, 0.75, 2.2); g.add(b);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), white); head.position.set(0, 0.04, 0.26); g.add(head);
      const wings = [];
      for (const s of [-1, 1]) {
        const inner = new THREE.Group(); inner.position.set(s * 0.06, 0.02, 0.02); g.add(inner);
        const iw = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.015, 0.16), grey); iw.position.x = s * 0.18; inner.add(iw);
        const outer = new THREE.Group(); outer.position.x = s * 0.36; inner.add(outer);
        const ow = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.012, 0.12), grey); ow.position.x = s * 0.17; outer.add(ow);
        const tip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.013, 0.1), tipM); tip.position.x = s * 0.36; outer.add(tip);
        wings.push({ s, inner, outer });
      }
      g.traverse((o) => { if (o.material) o.material.userData.noOutline = true; o.castShadow = false; o.userData.steam = true; });
      g.scale.setScalar(sc * 2.2); P.whole.add(g);
      birds.push({ g, wings, ph: i * 1.7, rr: R * (0.6 + 0.4 * ((i * 53) % 7) / 6), y: ((i * 29) % 5) * 1.3, w: 0.18 + ((i * 13) % 5) * 0.02, dir: i % 3 ? 1 : -1 });
    }
    return {
      grip: 0,
      apply(ps) {
        const t = ps.t ?? 0;
        for (const B of birds) {
          const a = B.ph + B.dir * B.w * t, x = at.x + Math.cos(a) * B.rr, z = at.z + Math.sin(a) * B.rr * 0.6, y = at.y + B.y + Math.sin(t * 0.7 + B.ph) * 0.6;
          B.g.position.set(x, y, z); B.g.rotation.set(0, -a + (B.dir > 0 ? 0 : Math.PI), B.dir * 0.25);
          // flap a few beats, then glide with the wings held in a shallow M
          const cyc = (t * 0.5 + B.ph) % 3, flap = cyc < 1.2 ? Math.sin(cyc * Math.PI * 2 * 2.2) : 0;
          for (const W of B.wings) { W.inner.rotation.z = W.s * (0.15 + flap * 0.45); W.outer.rotation.z = W.s * (-0.3 + flap * 0.25); }
        }
      },
    };
  },
  popcornfly(P) {
    const S = P.spec, R = (i) => { const x = Math.sin(i * 91.7 + 13.1) * 43758.5453; return x - Math.floor(x); };
    const ms = ["#fff4d6", "#ffeab0", "#f2cf6e"].map((c) => mat(c, { roughness: 0.8 }));
    // one piece: a knobbly cluster of three or four puffs, about 3 cm (the cinema popcorn's size at scale 1.3)
    const piece = (i) => { const g = new THREE.Group(), n = 3 + Math.floor(R(i) * 2), sz = (S.size ?? 1) * 0.022;
      for (let k = 0; k < n; k++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(sz * (0.7 + R(i * 7 + k) * 0.5), 1), ms[(i + k) % 3]); b.position.set((R(i * 3 + k) - 0.5) * sz * 1.4, (R(i * 5 + k) - 0.5) * sz * 1.2, (R(i * 11 + k) - 0.5) * sz * 1.4); g.add(b); }
      g.traverse((o) => { o.userData.steam = true; o.castShadow = false; }); P.whole.add(g); return g; };
    const ks = (S.ks || []).map((q, i) => ({ q, g: piece(i), n: q.p.length / 3 }));
    return {
      grip: 0,
      apply(ps, clock) {
        const t = ps.t ?? clock ?? 0;
        for (const { q, g, n } of ks) {
          const f = (t - q.t0) / q.dt; g.visible = f >= 0 && f <= n - 1;
          if (!g.visible) continue;
          const i = Math.min(n - 2, Math.floor(f)), u = f - i, a = q.p, j = i * 3;
          g.position.set(a[j] + (a[j + 3] - a[j]) * u, a[j + 1] + (a[j + 4] - a[j + 1]) * u, a[j + 2] + (a[j + 5] - a[j + 2]) * u);
          g.rotation.set(q.t0 * 7 + f * 0.9, q.t0 * 3 + f * 0.6, f * 0.4);
        }
      },
    };
  },

  headsprout(P) {
    // (its size is the prop's own scale tween on the root: a spec scale 0, hidden until the hat is gone, must not be
    // baked in here, or it never shows)
    const m = mat(P.spec.color || "#6cbf3a", { roughness: 0.45, side: THREE.DoubleSide });
    const g = new THREE.Group(); P.whole.add(g);
    mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.07, 10), m, g, 0, 0.03, 0);
    for (const s of [-1, 1]) {
      const leaf = mesh(new THREE.SphereGeometry(1, 16, 10), m, g, s * 0.05, 0.085, 0); leaf.scale.set(0.06, 0.012, 0.03); leaf.rotation.set(0, s * 0.25, s * 0.55);
    }
    g.traverse((o) => { o.userData.steam = true; });
    return { grip: 0 };
  },

};
