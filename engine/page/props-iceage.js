import * as THREE from "three";
import { clamp } from "./util.js";

// Props for There's a catch EP05 "back to life" (12 Nov 2026; storyboards/series/what-if/05-back-to-life/BRIEF-T2.md): the
// three living ice-age animals the Reaper's scythe wakes in the museum hall. Metres, origin on the ground between the feet
// (the pterosaur: the middle of its body), facing +z at rot 0, every prop's own `scale` scales all of it. Each is cute-menacing
// like the T. rex (big bulging eyes with pupils, upper lids, brows; never realistic, never gory) and switches from "calm and
// curious" to "starving" with its face alone: brow -1, squint 0.7, jaw 0.3, drool 1, lookY -1 (pupils down).
// Params are plain numbers in the prop state, all 0 at rest unless said. propState (props3d.js) has defaults for flap, glow,
// jaw, squint, blink, brow, lookX, lookY, headY, headP, breath, bank and tail (see the tail note) but NOT for gait, trunk,
// trunkY, ears, crouch, bound, lick, fold, drool: a first tween of one of those JUMPS, so seed it with a dur-0 `set` at time 0.
// Every prop is a pure function of its params and the clip time (small idle sways read `t`; no random numbers, no clock).
//
// SHARED PARAMS (all three)
//   glow 0..1     every material glows bright green-white #b8ff9a by emissive: 1 = a flat glowing silhouette (the
//                 moment bones become flesh), plus a soft additive halo sprite (see-through for the checks)
//   jaw 0..1      mouth open (lower jaw / lower beak drops: mammoth 34 deg, sabre-tooth 46 deg, pterosaur 29 deg at 1)
//   brow -1..1    - angry (brows slant down to the nose and drop onto the eyes), + raised
//   squint 0..1   heavy upper lids (0.7 = half closed); blink 0..1 closes them fully
//   lookX/lookY   -1..1 the pupils (+lookX toward the animal's left, +x; lookY -1 looks down)
//   headY/headP   degrees, + turns the head to the animal's left (+x), + nods it down
//   drool 0..1    two or three thin tapered pale blue-white strands (2 cm at the lip to 0.6 cm, half see-through) from the lower
//                 lip, a small teardrop at each end; they hang straight down in the world whatever the head does, 1 = 0.25 to
//                 0.35 m long at scale 1 on all three; 0 draws nothing
//   breath 0..1   the chest heaves (more with more breath)
//
//   mammoth     3.4 long, 1.7 wide, 3.1 tall at the head dome (the top of the hair mop). Origin: on the ground between the
//               feet. Shaggy red-brown coat #8a5a36 (darker #5e3b24 under the belly) of big scalloped tufts drawn once (no
//               tiling), a ragged skirt of 60 hanging tufts round the belly, a mop on the head dome, small ears, a 10-segment
//               trunk (1.9 m, wrinkle rings), two cream tusks 1.3 m out of the face curving out and up (tips 1.64 m wide),
//               four pillar legs with fur boots and three toenails each, a short tail. Feet at y 0 at gait 0.
//               gait     count of walk cycles: legs swing +-24 deg in diagonal pairs by the fraction, the body dips 4 cm
//                        twice a cycle, whole numbers = standing (feet flat on the ground)
//               trunk    -1 hanging and curled in (the tip spirals forward), 0 relaxed S, 1 raised high up over the head
//               trunkY   degrees, swings the trunk sideways (+ to the left, +x)
//               ears     0..1 the ears flare out from the head: tween up and down to flap them
//               Where the head is (scale 1, y up from the ground): eyes y 2.18, mouth y 1.5..1.6, face front z 1.78.
//   sabretooth  1.8 long (rump z -0.78 to nose z +1.0; plus the tail 0.5, 2.3 from nose to tail tip), 1.1 tall at the shoulder, 0.6 wide. Origin: on the
//               ground between the feet (z 0 = the middle of the body). Sandy coat #d9a95c with
//               ~80 brown spots drawn once each, cream muzzle and belly, heavy shoulders, bob tail, a big head with two
//               0.28 m curved fangs, pink nose, whiskers, ears. Feet at y 0 at gait 0.
//               gait     as the mammoth (swing +-32 deg, diagonal pairs)
//               bound    0..1 (extra) at speed: 0 the diagonal trot, 1 the pairs bound (front pair together, rear pair together
//                        a beat behind, bigger swing, the body pitches along)
//               crouch   0..1 the stalk: chest low (0.25 m), rump high, front legs bent, head held up
//               lick     0..1 a pink tongue comes out and sweeps across the lips: 0 and 1 hidden, 0.5 out in the middle
//               tail     -1 tucked down between the legs, 0 relaxed, 1 up and curled. NOTE propState defaults `tail` to 1
//                        (another prop's key), so give the sabre-tooth `tail: 0` in its spec for the rest pose
//   pterosaur   2.6 wingspan (1.3 each side), body 0.7 long (z -0.35..0.35; the tail vane reaches z -0.7, the beak tip
//               z +1.15 at y +0.2, the wing chord about 0.45). Origin: the middle of the body, flying toward +z; the legs
//               trail back (lowest point about y -0.4) and reach down to about y -0.7 at fold 1. Orange-tan #d98a4a, a darker head crest, long toothed beak, leathery wings:
//               ochre membrane drawn with finger bones over real arm and finger bones.
//               flap     a count of wingbeats: fraction 0 = wings level, 0.25 = up 40 deg, 0.75 = down 40 deg (a whole
//                        number is level; the body bobs 5 cm against the wings)
//               bank     degrees roll of the whole animal, + lifts the left wing (+x)
//               fold     0..1 wings folded back and down along the body (hanging / perched), the legs reach down
// The bodies are solid for the checks; drool strands and the glow halo are see-through (userData.steam, solid false).

const TAU = Math.PI * 2;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const rad = (d) => (d * Math.PI) / 180;
const GLOW = new THREE.Color("#b8ff9a");
const X_AXIS = new THREE.Vector3(1, 0, 0);

function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const ghost = (o, order = 2) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
const ell = (rx, ry, rz, seg = 24) => { const g = new THREE.SphereGeometry(1, seg, Math.max(8, Math.round(seg * 0.7))); g.scale(rx, ry, rz); return g; };
function cvs(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const memo = new Map();   // every drawn texture is made once per page and shared (they are pure functions of their key)
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };

// ---------------------------------------------------------------- materials (one palette per prop so glow reaches them all)
function palette() {
  // The look (looks.js) copies a standard material's colours once, when it first draws it, and then follows only its
  // emissiveIntensity each frame. So every standard material is made with the glow colour as its emissive at intensity 0,
  // and glow is just that intensity (1.0 = a flat green-white silhouette); basic materials (eyes) are lerped in colour.
  const list = [];
  const reg = (m) => { m.userData.c0 = m.color.clone(); list.push(m); return m; };
  return {
    m: (color, o = {}) => reg(new THREE.MeshStandardMaterial({ color, roughness: 0.8, emissive: GLOW, emissiveIntensity: 0, ...o })),
    b: (color) => reg(new THREE.MeshBasicMaterial({ color })),
    glow(g) {
      for (const m of list) { if (m.isMeshBasicMaterial) m.color.copy(m.userData.c0).lerp(GLOW, g); else m.emissiveIntensity = 1.0 * g; }
    },
  };
}
// a small drawn texture in one colour with seeded flecks (so no surface is flat): cream muzzles, pink noses, ivory, hooves
const fleck = (base, seed = 1, n = 70, a = 0.16) => once(`f${base}${seed}`, () => cvs(128, 128, (g, W, H) => {
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  for (let i = 0; i < n; i++) {
    const x = rnd(seed * 97 + i) * W, y = rnd(seed * 97 + i + 300) * H, r = 2 + rnd(seed * 97 + i + 600) * 6;
    g.fillStyle = i % 2 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a + 0.04})`; g.beginPath(); g.ellipse(x, y, r * 1.5, r, rnd(i + seed) * 3, 0, TAU); g.fill();
  }
}));
// long thin strokes along v (hair strands, tusk growth): the tufts' and tusks' texture
const strandTex = (base, seed, light = "rgba(255,225,170,0.2)", dark = "rgba(30,14,6,0.32)") => once(`s${base}${seed}`, () => cvs(128, 256, (g, W, H) => {
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) {
    const x = rnd(seed * 31 + i) * W, y0 = rnd(seed * 31 + i + 200) * H * 0.5, L = 50 + rnd(seed * 31 + i + 400) * 150;
    g.strokeStyle = i % 3 ? dark : light; g.lineWidth = 1.5 + rnd(i + seed) * 3.5;
    g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x + (rnd(i + 9) - 0.5) * 18, y0 + L / 2, x + (rnd(i + 11) - 0.5) * 24, y0 + L); g.stroke();
  }
}));
// shaggy coat: rows of big scalloped teardrop tufts, each drawn once with its own width, length, tilt and shade; the rows
// are drawn from the bottom up so every row's hanging tips lie over the one under it. c0 on top, c1 at the belly.
function tuftTex(key, W, H, seed, c0, c1, row, tw, th) {
  return once(key, () => cvs(W, H, (g) => {
    const mixC = (t, j) => `rgb(${[0, 1, 2].map((i) => Math.round(clamp(c0[i] + (c1[i] - c0[i]) * t + j, 0, 255))).join(",")})`;
    g.fillStyle = mixC(1, 0); g.fillRect(0, 0, W, H);
    const step = tw * 0.82, n = Math.ceil(W / step) + 1, rows = Math.ceil(H / row) + 3;
    for (let r = rows; r >= -1; r--) {
      const y = r * row - th * 0.35;
      for (let k = 0; k < n; k++) {
        const id = seed + r * 131 + k * 7;
        const x = (k + (r & 1) * 0.5 + (rnd(id) - 0.5) * 0.45) * step, w = tw * (0.9 + 0.3 * rnd(id + 1)), h = th * (0.85 + 0.35 * rnd(id + 2)), tip = (rnd(id + 3) - 0.5) * tw * 0.35;
        const col = mixC(clamp((y + h * 0.4) / H) ** 1.4, (rnd(id + 4) - 0.5) * 30);
        for (const dx of [-W, 0, W]) {
          const X = x + dx;
          g.beginPath(); g.moveTo(X - w / 2, y);
          g.bezierCurveTo(X - w / 2 - 5, y + h * 0.45, X - w * 0.14, y + h * 0.82, X + tip, y + h);
          g.bezierCurveTo(X + w * 0.14, y + h * 0.82, X + w / 2 + 5, y + h * 0.45, X + w / 2, y);
          g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = "rgba(38,20,9,0.55)"; g.lineWidth = 2.2; g.stroke();
          for (let s = 0; s < 3; s++) {
            const sx = X + (s - 1) * w * 0.2; g.strokeStyle = s === 1 ? "rgba(40,20,8,0.3)" : "rgba(255,214,160,0.22)"; g.lineWidth = 1.6;
            g.beginPath(); g.moveTo(sx, y + h * 0.12); g.quadraticCurveTo(sx + (rnd(id + s) - 0.5) * 8, y + h * 0.5, X + tip * (0.4 + 0.2 * s), y + h * 0.86); g.stroke();
          }
        }
      }
    }
    const sh = g.createLinearGradient(0, H * 0.55, 0, H); sh.addColorStop(0, "rgba(30,15,6,0)"); sh.addColorStop(1, "rgba(30,15,6,0.42)");
    g.fillStyle = sh; g.fillRect(0, H * 0.55, W, H * 0.45);
  }));
}

// ---------------------------------------------------------------- geometry
// a teardrop of fur hanging from the origin (y 0 down to -h), round at the top and pointed at the bottom
const tuftCache = new Map();
function tuftGeo(r, h) {
  const k = `${r}|${h}`;
  if (!tuftCache.has(k)) tuftCache.set(k, new THREE.LatheGeometry([[0.001, -1], [0.34, -0.9], [0.74, -0.72], [1, -0.5], [0.92, -0.3], [0.5, -0.1], [0.001, 0]].map(([a, b]) => new THREE.Vector2(a * r, b * h)), 8));
  return tuftCache.get(k);
}
// a tuft on `parent` at (x, y, z) hanging outward at azimuth yaw (its flat face looks that way), tipped out by `tilt`
function tuft(parent, geo, m, x, y, z, yaw, tilt, thick = 0.55) {
  const t = mesh(geo, m, parent, x, y, z); t.rotation.order = "YXZ"; t.rotation.set(tilt, yaw, 0); t.scale.set(1, 1, thick); t.castShadow = false; return t;
}
// a tapering tube along a smooth curve through pts; radius r0 at the start to r1 at the end (tusks, fangs)
function taperTube(pts, r0, r1, radial = 14, seg = 30) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), pos = [], uv = [], idx = [];
  const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), P = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const u = i / seg; curve.getPointAt(u, P); curve.getTangentAt(u, T);
    N.crossVectors(T, Math.abs(T.z) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1)).normalize(); B.crossVectors(T, N).normalize();
    const r = r0 + (r1 - r0) * Math.pow(u, 0.85);
    for (let j = 0; j <= radial; j++) { const a = (j / radial) * TAU, c = Math.cos(a) * r, s = Math.sin(a) * r; pos.push(P.x + N.x * c + B.x * s, P.y + N.y * c + B.y * s, P.z + N.z * c + B.z * s); uv.push(j / radial, u); }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + 1, c = a + radial + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// a straight tapering bone between two points
function bone(parent, a, b, r0, r1, m) {
  const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), L = d.length();
  const o = mesh(new THREE.CylinderGeometry(r1, r0, L, 8, 1), m, parent, (A.x + Bv.x) / 2, (A.y + Bv.y) / 2, (A.z + Bv.z) / 2);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); o.castShadow = false; return o;
}
// the glow halo: a soft additive disc that always faces the camera; ghost = see-through and not solid for the checks
const HALO = () => once("halo", () => cvs(128, 128, (g, W, H) => {
  const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
  gr.addColorStop(0, "rgba(214,255,176,0.95)"); gr.addColorStop(0.4, "rgba(170,255,130,0.45)"); gr.addColorStop(0.75, "rgba(150,255,110,0.1)"); gr.addColorStop(1, "rgba(150,255,110,0)");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}));
function halo(parent, size, x, y, z) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: HALO(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, opacity: 0 }));
  s.material.userData.noOutline = true; ghost(s, 6); s.position.set(x, y, z); s.scale.set(size, size, 1); s.visible = false; parent.add(s); return s;
}

// ---------------------------------------------------------------- the face (all three): eyes, lids, brows, the same rig as the T. rex
// o: x, y, z (the left eye's centre in `parent`), R, spread (turn outward, rad), iris, lidM, browM, brow: [rx, ry, rz] of a brow
function makeFace(S, parent, o) {
  const white = S.b("#f6f1e2"), irisM = S.b(o.iris), pupilM = S.b("#1a120c"), glintM = S.b("#fdfcf6"), R = o.R;
  const eyes = [-1, 1].map((s) => {
    const g = new THREE.Group(); g.position.set(s * o.x, o.y, o.z); g.rotation.y = s * o.spread; parent.add(g);
    mesh(new THREE.SphereGeometry(R * 1.12, 24, 16), o.lidM, g, 0, 0, -R * 0.25).castShadow = false;   // the socket bulge round it
    const w = new THREE.Mesh(new THREE.SphereGeometry(R, 28, 20), white); w.scale.set(1, 1.12, 0.9); g.add(w);
    const pup = new THREE.Group(); g.add(pup);
    const iris = new THREE.Mesh(new THREE.CircleGeometry(R * 0.62, 28), irisM); iris.position.z = R * 0.91; pup.add(iris);
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(R * 0.36, 24), pupilM); pupil.position.z = R * 0.915; pup.add(pupil);
    const gl = new THREE.Mesh(new THREE.CircleGeometry(R * 0.14, 16), glintM); gl.position.set(R * 0.2, R * 0.24, R * 0.92); pup.add(gl);
    // the upper lid: a shell over the top of the eye that turns down (as the T. rex's)
    const lid = new THREE.Mesh(new THREE.SphereGeometry(R * 1.07, 28, 14, 0, TAU, 0, Math.PI / 2), o.lidM); lid.scale.set(1, 1.12, 0.95);
    const lidP = new THREE.Group(); lidP.add(lid); g.add(lidP); lid.rotation.x = -Math.PI / 2; lid.castShadow = false;
    const brow = mesh(new THREE.SphereGeometry(1, 16, 10), o.browM, parent, s * o.x, o.y + R * 1.3, o.z - R * 0.05);
    brow.scale.set(...o.brow); brow.rotation.order = "ZYX"; brow.rotation.y = s * o.spread;
    return { pup, lidP, brow, s };
  });
  return {
    apply(ps) {
      const lx = clamp(ps.lookX ?? 0, -1, 1), ly = clamp(ps.lookY ?? 0, -1, 1), lidK = Math.max(clamp(ps.squint ?? 0) * 0.55, clamp(ps.blink ?? 0)), bw = clamp(ps.brow ?? 0, -1, 1);
      for (const e of eyes) {
        e.pup.rotation.set(-ly * 0.38, lx * 0.42 - e.s * 0.08, 0);
        e.lidP.rotation.x = rad(35 + 140 * lidK);
        e.brow.rotation.z = e.s * -0.4 * bw;
        e.brow.position.y = o.y + R * (1.3 + 0.45 * Math.max(0, bw) - 0.38 * Math.max(0, -bw));
      }
    },
  };
}
// drool: thin tapered strands from the lower lip (pts in the jaw's frame) that hang straight down in the world, at most 0.35 m
// at scale 1, 2 cm across at the lip to 0.6 cm at the drop, pale blue-white and about half see-through, a small teardrop at the end
function makeDrool(parent, pts) {
  const m = new THREE.MeshStandardMaterial({ color: "#dff1f7", roughness: 0.1, transparent: true, opacity: 0.5, depthWrite: false }); m.userData.noOutline = true;
  const strandG = new THREE.CylinderGeometry(0.01, 0.003, 1, 8, 1, true).translate(0, -0.5, 0), dropG = new THREE.SphereGeometry(1, 10, 8);
  const items = pts.map((p, i) => {
    const g = new THREE.Group(); g.position.set(...p); parent.add(g);
    const s = ghost(new THREE.Mesh(strandG, m)), d = ghost(new THREE.Mesh(dropG, m));
    g.add(s, d);
    return { g, s, d, len: 0.35 * (0.72 + 0.28 * rnd(i + 3)), ph: rnd(i + 9) * 6 };
  });
  return {
    apply(k, t, invQ) {
      for (const it of items) {
        it.g.visible = k > 0.01; it.g.quaternion.copy(invQ);
        const L = it.len * k * (1 + 0.04 * Math.sin(t * 3 + it.ph));
        it.s.scale.set(1, L, 1); it.d.position.y = -L - 0.006; it.d.scale.set(0.0065, 0.0095, 0.0065);
      }
    },
  };
}
// the inverse of head * jaw (* body pitch) so a drool group stays vertical in the world (the prop's own turn about y does not matter)
const hang = (...qs) => { const q = new THREE.Quaternion(); for (const x of qs) q.multiply(x); return q.invert(); };
const qE = (x, y, z, order = "YXZ") => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, order));
const qX = (a) => new THREE.Quaternion().setFromAxisAngle(X_AXIS, a);

// ================================================================================================ kinds
export const ICEAGE_KINDS = {
  // ------------------------------------------------------------------------------------------------ mammoth
  mammoth(P) {
    const S = palette();
    const fur = S.m("#ffffff", { map: tuftTex("mamBody", 1024, 512, 11, [138, 90, 54], [94, 59, 36], 30, 46, 100), roughness: 0.95 });
    const furH = S.m("#ffffff", { map: tuftTex("mamHead", 1024, 512, 71, [142, 94, 57], [110, 70, 42], 28, 44, 90), roughness: 0.95 });
    const legM = S.m("#ffffff", { map: tuftTex("mamLeg", 256, 512, 23, [124, 80, 47], [92, 58, 35], 28, 42, 80), roughness: 0.95 });
    const tuftM = S.m("#ffffff", { map: strandTex("#86562f", 41), roughness: 0.95 }), tuftD = S.m("#ffffff", { map: strandTex("#6c4428", 42), roughness: 0.95 });
    const skin = S.m("#ffffff", {
      roughness: 0.85,
      map: once("mamTrunk", () => cvs(64, 1024, (g, W, H) => {
        g.fillStyle = "#86593a"; g.fillRect(0, 0, W, H);
        for (let k = 0; k < 80; k++) {
          const y = (k + rnd(k) * 0.8) * (H / 80);
          g.strokeStyle = `rgba(52,30,16,${0.4 + 0.3 * rnd(k + 5)})`; g.lineWidth = 2 + rnd(k + 9) * 4; g.beginPath(); g.moveTo(0, y); g.quadraticCurveTo(W / 2, y + (rnd(k + 2) - 0.5) * 8, W, y); g.stroke();
          g.strokeStyle = "rgba(205,160,115,0.28)"; g.lineWidth = 2; g.beginPath(); g.moveTo(0, y + 5); g.lineTo(W, y + 5 + (rnd(k + 3) - 0.5) * 4); g.stroke();
        }
        for (let i = 0; i < 90; i++) { g.fillStyle = "rgba(40,22,12,0.25)"; g.beginPath(); g.ellipse(rnd(i) * W, rnd(i + 70) * H, 1.5 + rnd(i + 4) * 2.5, 1, 0, 0, TAU); g.fill(); }
      })),
    });
    const darkF = S.m("#ffffff", { map: strandTex("#5b3722", 44), roughness: 0.95 });
    const ivory = S.m("#ffffff", {
      roughness: 0.4,
      map: once("tusk", () => cvs(64, 256, (g, W, H) => {
        g.fillStyle = "#f1e5c6"; g.fillRect(0, 0, W, H);
        for (let k = 0; k < 28; k++) { const y = (k + rnd(k)) * (H / 28); g.strokeStyle = "rgba(150,120,70,0.16)"; g.lineWidth = 2 + rnd(k + 8) * 2; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + (rnd(k + 1) - 0.5) * 6); g.stroke(); }
        for (let i = 0; i < 24; i++) { g.strokeStyle = i % 2 ? "rgba(120,90,50,0.18)" : "rgba(255,255,255,0.35)"; g.lineWidth = 2; const x = rnd(i + 20) * W; g.beginPath(); g.moveTo(x, rnd(i) * H * 0.4); g.lineTo(x + 4, rnd(i) * H * 0.4 + 90 + rnd(i + 6) * 90); g.stroke(); }
        const gr = g.createLinearGradient(0, 0, 0, H * 0.25); gr.addColorStop(0, "rgba(120,80,40,0.35)"); gr.addColorStop(1, "rgba(120,80,40,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, H * 0.25);
      })),
    });
    const mouthM = S.m("#ffffff", { map: fleck("#8c2d3b", 4), roughness: 0.6 }), tongueM = S.m("#ffffff", { map: fleck("#e0707e", 5), roughness: 0.55 });
    const nailM = S.m("#ffffff", { map: fleck("#e9dfc6", 6), roughness: 0.5 });
    const root = new THREE.Group(); P.whole.add(root);
    const body = new THREE.Group(); root.add(body);

    // ---- torso, hump, belly skirt, back ridge
    const torso = mesh(ell(0.84, 0.92, 1.3, 34), fur, body, 0, 1.5, -0.3);
    mesh(ell(0.7, 0.55, 0.75, 24), fur, body, 0, 2.02, 0.3);
    for (const [E, n, r, h, k] of [[-0.5, 38, 0.14, 0.5, 0], [-0.95, 30, 0.12, 0.36, 1]]) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + rnd(i + k * 50) * 0.12, cE = Math.cos(E);
        tuft(body, tuftGeo(r * (0.85 + 0.3 * rnd(i + 3)), h * (0.8 + 0.4 * rnd(i + 8))), (i + k) % 2 ? tuftD : tuftM, 0.84 * cE * Math.sin(a), 1.5 + 0.92 * Math.sin(E), -0.3 + 1.3 * cE * Math.cos(a), a, -0.25 + rnd(i + 5) * 0.12, 0.55);
      }
    }
    for (let i = 0; i < 12; i++) { const z = 0.5 - i * 0.16, y = 2.5 - Math.max(0, i - 3) * 0.06; tuft(body, tuftGeo(0.17, 0.34), tuftM, (rnd(i) - 0.5) * 0.5, y, z, (rnd(i + 2) - 0.5) * 0.4, 0.9, 0.7); }   // the shaggy back, tufts lying backward

    // ---- legs: pillars with fur boots and three toenails; they swing from the hip
    const legs = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([s, f]) => {
      const g = new THREE.Group(); g.position.set(s * 0.52, 1.12, f > 0 ? 0.6 : -1.0); root.add(g);
      mesh(new THREE.SphereGeometry(0.31, 16, 12), legM, g, 0, 0, 0);
      mesh(new THREE.CylinderGeometry(0.3, 0.27, 1.0, 18, 1), legM, g, 0, -0.56, 0);
      mesh(ell(0.31, 0.1, 0.36, 20), legM, g, 0, -1.02, 0.05);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; tuft(g, tuftGeo(0.07, 0.26), i % 2 ? tuftD : tuftM, Math.sin(a) * 0.28, -0.78, Math.cos(a) * 0.28, a, -0.3, 0.6); }
      for (const k of [-1, 0, 1]) mesh(ell(0.065, 0.05, 0.045, 12), nailM, g, k * 0.12, -1.07, 0.37 - Math.abs(k) * 0.03);
      return { g, ph: (s > 0) === (f > 0) ? 0 : 0.5 };
    });

    // ---- tail
    const tail = new THREE.Group(); tail.position.set(0, 1.62, -1.58); body.add(tail);
    mesh(ell(0.09, 0.3, 0.09, 12), fur, tail, 0, -0.25, 0); tuft(tail, tuftGeo(0.14, 0.34), tuftD, 0, -0.42, 0, 0, 0, 0.9);

    // ---- head
    const head = new THREE.Group(); head.position.set(0, 2.2, 1.0); head.rotation.order = "YXZ"; body.add(head);
    mesh(ell(0.74, 0.76, 0.72, 32), furH, head, 0, 0.1, 0);
    mesh(ell(0.5, 0.5, 0.5, 24), furH, head, 0, -0.38, 0.28);
    for (let k = 0; k < 14; k++) { const a = (k / 14) * TAU + 0.1; tuft(head, tuftGeo(0.17, k < 4 || k > 10 ? 0.5 : 0.38), k % 2 ? tuftM : tuftD, 0.4 * Math.sin(a), 0.74, 0.39 * Math.cos(a), a, -0.28, 0.6); }   // the mop on the dome
    for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; tuft(head, tuftGeo(0.15, 0.36), tuftM, 0.2 * Math.sin(a), 0.84, 0.2 * Math.cos(a), a, -0.2, 0.7); }
    tuft(head, tuftGeo(0.18, 0.3), tuftD, 0, 0.86, 0.02, 0, 0, 0.9);
    mesh(ell(0.2, 0.2, 0.2, 14), skin, head, 0, -0.2, 0.7);   // the trunk's root
    const ears = [-1, 1].map((s) => {
      const g = new THREE.Group(); g.position.set(s * 0.66, 0.2, -0.05); head.add(g);
      mesh(ell(0.05, 0.27, 0.21, 16), darkF, g, s * 0.02, -0.02, -0.2); mesh(ell(0.035, 0.2, 0.15, 12), tongueM, g, -s * 0.03, -0.02, -0.2);
      return { g, s };
    });
    const face = makeFace(S, head, { x: 0.36, y: -0.02, z: 0.56, R: 0.12, spread: 0.35, iris: "#6a4220", lidM: darkF, browM: darkF, brow: [0.2, 0.08, 0.11] });
    // jaw under the trunk's root: wide, with the mouth inside
    mesh(ell(0.3, 0.05, 0.3, 14), mouthM, head, 0, -0.5, 0.4);
    const jaw = new THREE.Group(); jaw.position.set(0, -0.5, 0.15); head.add(jaw);
    mesh(ell(0.3, 0.13, 0.36, 20), skin, jaw, 0, -0.1, 0.3); mesh(ell(0.25, 0.04, 0.3, 14), mouthM, jaw, 0, 0.0, 0.3); mesh(ell(0.16, 0.04, 0.24, 12), tongueM, jaw, 0, 0.01, 0.3);
    const drool = makeDrool(jaw, [[-0.13, -0.2, 0.52], [0.1, -0.22, 0.56], [0, -0.24, 0.45]]);
    // tusks: out of the face, down and forward, then out and up (about 1.3 m clear of it)
    for (const s of [-1, 1]) mesh(taperTube([[s * 0.3, -0.3, 0.4], [s * 0.5, -0.62, 0.78], [s * 0.66, -0.66, 1.08], [s * 0.76, -0.44, 1.38], [s * 0.8, -0.08, 1.55]], 0.08, 0.012), ivory, head);
    // trunk: ten segments hanging from the root, each bent by its own angle (pose arrays: root first, radians; - bends forward)
    const trunkRoot = new THREE.Group(); trunkRoot.position.set(0, -0.2, 0.7); head.add(trunkRoot);
    const TS = [-0.1, -0.08, 0, 0.08, 0.15, 0.1, 0, -0.1, -0.2, -0.25], TC = [0.1, 0.05, 0, -0.1, -0.2, -0.35, -0.5, -0.6, -0.65, -0.7], TU = [-1.9, -0.3, -0.25, -0.2, -0.15, -0.1, -0.1, -0.1, -0.1, -0.1];
    const segs = []; let prev = trunkRoot;
    for (let i = 0; i < 10; i++) {
      const g = new THREE.Group(); if (i) g.position.y = -0.19; prev.add(g);
      const r0 = 0.2 - 0.014 * i, r1 = 0.2 - 0.014 * (i + 1), geo = new THREE.CylinderGeometry(r0, r1, 0.2, 14, 1), uv = geo.attributes.uv;
      for (let q = 0; q < uv.count; q++) uv.setY(q, (i + uv.getY(q)) / 10);
      mesh(geo, skin, g, 0, -0.095, 0); mesh(new THREE.SphereGeometry(r0 * 1.0, 12, 9), skin, g, 0, 0, 0);
      if (i === 9) { mesh(new THREE.SphereGeometry(r1 * 1.15, 12, 9), skin, g, 0, -0.2, 0); for (const k of [-1, 1]) mesh(ell(0.018, 0.012, 0.018, 8), mouthM, g, k * 0.03, -0.27, 0.0); }
      segs.push(g); prev = g;
    }
    const haloS = halo(P.whole, 4.6, 0, 1.7, 0);

    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, gt = ps.gait ?? 0, sg = Math.sin(TAU * gt), br = clamp(ps.breath ?? 0);
        body.position.y = -0.04 * sg * sg;
        for (const l of legs) l.g.rotation.x = 0.42 * Math.sin(TAU * (gt + l.ph));
        torso.scale.y = 1 + 0.012 * (1 + 2 * br) * Math.sin(tt * 2.2);
        tail.rotation.z = Math.sin(tt * 1.7) * 0.12; tail.rotation.x = 0.1 + 0.2 * Math.sin(TAU * gt * 2);
        const hy = ps.headY ?? 0, hp = ps.headP ?? 0, jw = clamp(ps.jaw ?? 0);
        head.rotation.set(rad(hp), rad(hy), 0); jaw.rotation.x = 0.6 * jw;
        const ea = clamp(ps.ears ?? 0); for (const e of ears) e.g.rotation.y = -e.s * (0.15 + 0.85 * ea);
        face.apply(ps);
        const tr = clamp(ps.trunk ?? 0, -1, 1), a = tr < 0 ? -tr : tr, pose = tr < 0 ? TC : TU;
        trunkRoot.rotation.y = rad(ps.trunkY ?? 0);
        segs.forEach((g, i) => { g.rotation.x = TS[i] + (pose[i] - TS[i]) * a + 0.03 * Math.sin(tt * 1.3 + i * 0.5) * (1 - a * 0.5); });
        drool.apply(clamp(ps.drool ?? 0), tt, hang(qE(rad(hp), rad(hy), 0), qX(0.6 * jw)));
        const gl = clamp(ps.glow ?? 0); S.glow(gl); haloS.visible = gl > 0.01; haloS.material.opacity = 0.32 * gl;
      },
    };
  },

  // ------------------------------------------------------------------------------------------------ sabre-tooth
  sabretooth(P) {
    const S = palette();
    const coat = S.m("#ffffff", {
      roughness: 0.85,
      map: once("sabCoat", () => cvs(512, 256, (g, W, H) => {
        const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#cf9c4f"); gr.addColorStop(0.55, "#dcae62"); gr.addColorStop(0.85, "#ebcf94"); gr.addColorStop(1, "#f1dcab");
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        for (let i = 0; i < 520; i++) {
          const x = rnd(i) * W, y = rnd(i + 900) * H, l = 6 + rnd(i + 5) * 9; g.strokeStyle = i % 2 ? "rgba(120,78,30,0.22)" : "rgba(255,232,170,0.3)"; g.lineWidth = 1.2;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd(i + 3) - 0.5) * 4, y + l); g.stroke();
        }
        for (let i = 0; i < 86; i++) {   // each spot once: 2 or 3 overlapping lobes, mostly on the back and flanks
          const x = rnd(i + 40) * W, y = (0.04 + rnd(i + 140) * 0.62) * H, r = 5 + rnd(i + 240) * 11;
          g.fillStyle = `rgba(${98 + rnd(i) * 22},${58 + rnd(i + 1) * 12},${24 + rnd(i + 2) * 8},0.92)`;
          for (let k = 0; k < 2 + (i % 2); k++) { g.beginPath(); g.ellipse(x + (rnd(i * 3 + k) - 0.5) * r, y + (rnd(i * 3 + k + 7) - 0.5) * r * 0.7, r * (0.55 + 0.4 * rnd(i + k)), r * (0.45 + 0.3 * rnd(i + k + 3)), rnd(i + k + 9) * 3, 0, TAU); g.fill(); }
        }
      })),
    });
    const cream = S.m("#ffffff", { map: fleck("#f0dcae", 9), roughness: 0.85 }), pinkM = S.m("#ffffff", { map: fleck("#e58a98", 10), roughness: 0.55 }), tongueM = S.m("#ffffff", { map: fleck("#df6d7c", 11), roughness: 0.55 });
    const mouthM = S.m("#ffffff", { map: fleck("#8c2d3b", 12), roughness: 0.6 }), brownM = S.m("#ffffff", { map: fleck("#8a5a2c", 13), roughness: 0.85 }), darkM = S.m("#ffffff", { map: fleck("#6a4020", 14), roughness: 0.85 });
    const fang = S.m("#ffffff", { map: fleck("#f6efdc", 15, 40, 0.1), roughness: 0.35 }), whisk = S.m("#f3ead0", { roughness: 0.5 }); whisk.userData.noOutline = true;
    const root = new THREE.Group(); P.whole.add(root);
    const bp = new THREE.Group(); bp.position.set(0, 0.72, -0.5); root.add(bp);       // the body pitches about the hips
    const body = new THREE.Group(); body.position.set(0, -0.72, 0.5); bp.add(body);

    // ---- body
    const torso = mesh(ell(0.29, 0.3, 0.62, 28), coat, body, 0, 0.72, -0.12);
    mesh(ell(0.31, 0.36, 0.33, 24), coat, body, 0, 0.76, 0.32);                         // heavy shoulders
    mesh(ell(0.27, 0.28, 0.3, 22), coat, body, 0, 0.7, -0.5);                           // hips
    mesh(ell(0.21, 0.1, 0.5, 18), cream, body, 0, 0.47, -0.08);                         // belly
    mesh(ell(0.2, 0.2, 0.2, 14), cream, body, 0, 0.62, 0.45);                           // chest
    for (const s of [-1, 1]) mesh(ell(0.15, 0.3, 0.3, 16), coat, body, s * 0.17, 0.68, -0.6);   // haunches
    const tailRoot = new THREE.Group(); tailRoot.position.set(0, 0.76, -0.76); body.add(tailRoot);
    const tseg = []; let tp = tailRoot;
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group(); if (i) g.position.z = -0.125; tp.add(g);
      mesh(ell(0.075 - 0.012 * i, 0.075 - 0.012 * i, 0.075, 12), i === 3 ? darkM : coat, g, 0, 0, -0.06); tseg.push(g); tp = g;
    }
    const TLR = [-0.35, 0, 0.15, 0.3], TLU = [0.5, 0.45, 0.4, 0.5], TLT = [-0.8, -0.4, -0.2, 0];

    // ---- legs: swing from the shoulder / hip; the front pair shortens in the crouch (pivots and lengths are set in apply)
    const legs = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([s, f]) => {
      const g = new THREE.Group(); root.add(g);
      const th = f > 0 ? 0.1 : 0.085;
      mesh(new THREE.CylinderGeometry(th, th * 0.75, 0.58, 12, 1), coat, g, 0, -0.29, 0);
      mesh(ell(0.095, 0.052, 0.13, 14), cream, g, 0, -0.59, 0.03);
      for (const k of [-1, 0, 1]) mesh(ell(0.032, 0.03, 0.04, 8), cream, g, k * 0.05, -0.6, 0.15);
      return { g, s, f };
    });

    // ---- head
    const head = new THREE.Group(); head.position.set(0, 0.84, 0.62); head.rotation.order = "YXZ"; body.add(head);
    mesh(ell(0.27, 0.25, 0.27, 26), coat, head, 0, 0, 0);
    mesh(ell(0.19, 0.14, 0.19, 20), cream, head, 0, -0.09, 0.23);
    mesh(ell(0.065, 0.045, 0.05, 12), pinkM, head, 0, -0.01, 0.405);
    for (const s of [-1, 1]) { mesh(ell(0.02, 0.012, 0.012, 8), darkM, head, s * 0.025, -0.01, 0.435); mesh(ell(0.06, 0.07, 0.08, 10), cream, head, s * 0.2, -0.08, 0.16); }   // nostrils, cheek ruff
    mesh(ell(0.12, 0.03, 0.17, 14), mouthM, head, 0, -0.17, 0.26);
    for (const s of [-1, 1]) {
      mesh(taperTube([[s * 0.14, -0.1, 0.31], [s * 0.15, -0.24, 0.33], [s * 0.14, -0.38, 0.31]], 0.04, 0.005, 10, 14), fang, head);
      for (let k = 0; k < 3; k++) {
        const dir = new THREE.Vector3(s * 0.95, 0.14 * (1 - k), -0.25 + 0.16 * (k - 1)).normalize(), b0 = new THREE.Vector3(s * 0.12, -0.08 - k * 0.02, 0.33);
        const w = mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.3, 4), whisk, head, ...b0.clone().addScaledVector(dir, 0.15).toArray()); w.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); w.castShadow = false;
      }
    }
    const ears = [-1, 1].map((s) => {
      const g = new THREE.Group(); g.position.set(s * 0.17, 0.2, -0.03); head.add(g);
      mesh(ell(0.085, 0.11, 0.04, 14), coat, g, 0, 0.07, 0); mesh(ell(0.055, 0.075, 0.03, 12), pinkM, g, 0, 0.065, 0.02);
      return { g, s };
    });
    const face = makeFace(S, head, { x: 0.15, y: 0.07, z: 0.2, R: 0.085, spread: 0.35, iris: "#dba21e", lidM: coat, browM: brownM, brow: [0.1, 0.034, 0.07] });
    const jaw = new THREE.Group(); jaw.position.set(0, -0.12, 0.08); head.add(jaw);
    mesh(ell(0.1, 0.055, 0.19, 16), cream, jaw, 0, -0.04, 0.17); mesh(ell(0.085, 0.02, 0.15, 12), mouthM, jaw, 0, 0.0, 0.17); mesh(ell(0.06, 0.018, 0.12, 10), tongueM, jaw, 0, 0.01, 0.17);
    const lickG = new THREE.Group(); lickG.position.set(0, 0.012, 0.33); jaw.add(lickG);
    mesh(ell(0.045, 0.014, 0.12, 12), tongueM, lickG, 0, 0, 0.1);
    const drool = makeDrool(jaw, [[-0.06, -0.08, 0.3], [0.05, -0.09, 0.33], [0, -0.09, 0.22]]);
    const haloS = halo(P.whole, 2.4, 0, 0.7, 0);

    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, gt = ps.gait ?? 0, bd = clamp(ps.bound ?? 0), cr = clamp(ps.crouch ?? 0), br = clamp(ps.breath ?? 0), sg = Math.sin(TAU * gt);
        // the body: crouch pitches the chest down about the hips; at speed the bound pitches it along
        const th = 0.3 * cr + bd * 0.12 * Math.sin(TAU * (gt + 0.2));
        bp.rotation.x = th; body.position.y = -0.72 - 0.015 * sg * sg * (1 - cr);
        torso.scale.y = 1 + 0.012 * (1 + 2 * br) * Math.sin(tt * 2.4);
        const ct = Math.cos(th), st = Math.sin(th);
        const PH = { fl: [0, 0], fr: [0.5, 0.05], bl: [0.5, 0.35], br: [0, 0.4] };
        for (const l of legs) {
          const dy = -0.08, dz = l.f > 0 ? 0.82 : -0.12, py = 0.72 + dy * ct - dz * st, pz = -0.5 + dz * ct + dy * st;
          const key = (l.f > 0 ? "f" : "b") + (l.s > 0 ? "l" : "r"), [p0, p1] = PH[key], ph = p0 + (p1 - p0) * bd;
          l.g.position.set(l.s * (l.f > 0 ? 0.19 : 0.18), py, pz); l.g.scale.set(1, Math.max(0.3, py / 0.64), 1);
          l.g.rotation.x = 0.55 * (1 + 0.5 * bd) * Math.sin(TAU * (gt + ph));
        }
        // tail: pose blends (relaxed -> tucked or up)
        const tl = clamp(ps.tail ?? 0, -1, 1), a = Math.abs(tl), pose = tl < 0 ? TLT : TLU;
        tailRoot.rotation.y = Math.sin(tt * 1.9) * 0.1;
        tseg.forEach((g, i) => { g.rotation.x = TLR[i] + (pose[i] - TLR[i]) * a; });
        // head: held up in the crouch so it keeps looking ahead
        const hy = ps.headY ?? 0, hp = (ps.headP ?? 0) - 0.8 * (th * 180) / Math.PI, jw = clamp(ps.jaw ?? 0);
        head.rotation.set(rad(hp), rad(hy), 0); jaw.rotation.x = 0.8 * jw;
        const bw = clamp(ps.brow ?? 0, -1, 1), back = Math.max(0, -bw);
        for (const e of ears) { e.g.rotation.z = -e.s * (0.4 + 0.5 * back); e.g.rotation.x = -0.5 * back; }
        const lk = clamp(ps.lick ?? 0); lickG.visible = lk > 0.01 && lk < 0.99;
        lickG.rotation.set(-0.35, (lk - 0.5) * 2.2, 0); lickG.scale.set(1, 1, Math.sin(Math.PI * lk) + 0.001);
        face.apply(ps);
        drool.apply(clamp(ps.drool ?? 0), tt, hang(qX(th), qE(rad(hp), rad(hy), 0), qX(0.8 * jw)));
        const gl = clamp(ps.glow ?? 0); S.glow(gl); haloS.visible = gl > 0.01; haloS.material.opacity = 0.32 * gl;
      },
    };
  },

  // ------------------------------------------------------------------------------------------------ pterosaur
  pterosaur(P) {
    const S = palette();
    const skinT = once("ptSkin", () => cvs(256, 128, (g, W, H) => {
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#c8793a"); gr.addColorStop(0.5, "#d98a4a"); gr.addColorStop(1, "#f0c08a");
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 150; i++) { g.fillStyle = i % 3 ? "rgba(120,60,22,0.22)" : "rgba(255,225,170,0.3)"; g.beginPath(); g.ellipse(rnd(i) * W, rnd(i + 300) * H, 2 + rnd(i + 5) * 5, 1.5 + rnd(i + 8) * 3, rnd(i + 2) * 3, 0, TAU); g.fill(); }
      for (let k = 0; k < 6; k++) { g.strokeStyle = "rgba(110,52,18,0.3)"; g.lineWidth = 5; g.beginPath(); g.moveTo(k * 44 + 8, 0); g.lineTo(k * 44 + 22, H * 0.55); g.stroke(); }
    }));
    const skin = S.m("#ffffff", { map: skinT, roughness: 0.75 });
    const belly = S.m("#ffffff", { map: fleck("#f0c58f", 21), roughness: 0.75 }), crestM = S.m("#ffffff", { map: fleck("#8f4720", 22), roughness: 0.75 });
    const beakM = S.m("#ffffff", { map: fleck("#e6b86e", 23), roughness: 0.6 }), tipM = S.m("#ffffff", { map: fleck("#5a3a20", 24), roughness: 0.6 });
    const toothM = S.m("#ffffff", { map: fleck("#f6efdc", 25, 30, 0.1), roughness: 0.4 }), boneM = S.m("#ffffff", { map: fleck("#c3763a", 26), roughness: 0.7 });
    const mouthM = S.m("#ffffff", { map: fleck("#8c2d3b", 27), roughness: 0.6 });
    const memb = S.m("#ffffff", {
      roughness: 0.55, side: THREE.DoubleSide,
      map: once("ptWing", () => cvs(512, 192, (g, W, H) => {
        const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#e1982f"); gr.addColorStop(0.6, "#eab552"); gr.addColorStop(1, "#f6d98e");
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        for (let i = 0; i < 90; i++) { g.fillStyle = i % 2 ? "rgba(140,76,20,0.12)" : "rgba(255,240,190,0.2)"; g.beginPath(); g.ellipse(rnd(i + 50) * W, rnd(i + 150) * H, 6 + rnd(i) * 22, 3 + rnd(i + 3) * 8, rnd(i + 4) * 3, 0, TAU); g.fill(); }
        const wx = (12 / 28) * W;   // the wrist: the finger bones fan out from here to the trailing edge
        for (const [u, w] of [[0.5, 4], [0.62, 4.5], [0.74, 4.5], [0.86, 4], [0.97, 3.5]]) { g.strokeStyle = "rgba(112,58,20,0.78)"; g.lineWidth = w; g.beginPath(); g.moveTo(wx, 0); g.quadraticCurveTo(wx + (u * W - wx) * 0.5, H * 0.45, u * W, H * 0.97); g.stroke(); }
        for (let k = 0; k < 9; k++) { g.strokeStyle = "rgba(150,84,30,0.32)"; g.lineWidth = 2; g.beginPath(); g.moveTo(k * 22, 0); g.quadraticCurveTo(k * 22 + 14, H * 0.4, k * 22 + 4 + rnd(k) * 20, H * 0.85); g.stroke(); }   // veins near the body
        g.strokeStyle = "rgba(125,66,22,0.7)"; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 1); g.lineTo(W, 1); g.stroke();
      })),
    });
    const root = new THREE.Group(); P.whole.add(root);
    const body = new THREE.Group(); root.add(body);

    // ---- body, neck, tail
    const trunk = mesh(ell(0.16, 0.15, 0.35, 24), skin, body, 0, 0, 0);
    mesh(ell(0.12, 0.09, 0.28, 18), belly, body, 0, -0.07, 0.03);
    const neck = mesh(ell(0.085, 0.085, 0.16, 14), skin, body, 0, 0.1, 0.4); neck.rotation.x = -0.5;
    mesh(new THREE.ConeGeometry(0.07, 0.3, 10), skin, body, 0, -0.02, -0.46).rotation.x = -Math.PI / 2;
    const vane = mesh(ell(0.1, 0.012, 0.09, 12), crestM, body, 0, -0.02, -0.65); vane.rotation.y = 0.0;
    // ---- legs (little dangling feet with claws; they trail back in flight and reach down when folded)
    const legs = [-1, 1].map((s) => {
      const g = new THREE.Group(); g.position.set(s * 0.09, -0.1, -0.15); body.add(g);
      mesh(ell(0.04, 0.09, 0.04, 8), skin, g, 0, -0.07, 0); const sh = new THREE.Group(); sh.position.y = -0.16; g.add(sh); mesh(ell(0.022, 0.1, 0.022, 8), skin, sh, 0, -0.08, 0);
      for (const k of [-1, 0, 1]) mesh(ell(0.012, 0.012, 0.04, 6), toothM, sh, k * 0.02, -0.18, 0.02);
      return { g, sh, s };
    });

    // ---- head: cranium, crest, long toothed beak with a hinged lower beak, eyes
    const head = new THREE.Group(); head.position.set(0, 0.2, 0.55); head.rotation.order = "YXZ"; body.add(head);
    mesh(ell(0.12, 0.11, 0.15, 20), skin, head, 0, 0, 0);
    const crest = mesh(new THREE.ConeGeometry(0.06, 0.4, 10), crestM, head, 0, 0.09, -0.2); crest.scale.set(0.35, 1, 1); crest.rotation.x = -1.25;
    mesh(new THREE.ConeGeometry(0.078, 0.46, 12), beakM, head, 0, -0.01, 0.37).rotation.x = Math.PI / 2;
    mesh(ell(0.026, 0.02, 0.03, 8), tipM, head, 0, -0.01, 0.6);
    mesh(ell(0.06, 0.016, 0.2, 12), mouthM, head, 0, -0.058, 0.27);
    for (let k = 0; k < 6; k++) { const z = 0.14 + k * 0.07, r = 0.078 * (1 - (z - 0.14) / 0.46); for (const s of [-1, 1]) mesh(new THREE.ConeGeometry(0.011, 0.045, 5), toothM, head, s * 0.8 * r, -0.02 - 0.55 * r, z).rotation.x = Math.PI; }
    const jaw = new THREE.Group(); jaw.position.set(0, -0.045, 0.1); head.add(jaw);
    const lj = mesh(new THREE.ConeGeometry(0.055, 0.34, 10), beakM, jaw, 0, -0.012, 0.19); lj.rotation.x = Math.PI / 2; lj.scale.set(1, 1, 0.8);
    for (let k = 0; k < 5; k++) { const z = 0.06 + k * 0.058, r = 0.055 * (1 - (z - 0.02) / 0.34); for (const s of [-1, 1]) mesh(new THREE.ConeGeometry(0.0095, 0.04, 5), toothM, jaw, s * 0.75 * r, -0.012 + 0.4 * r, z); }
    const face = makeFace(S, head, { x: 0.092, y: 0.03, z: 0.06, R: 0.055, spread: 0.55, iris: "#e0a21c", lidM: skin, browM: crestM, brow: [0.062, 0.02, 0.05] });
    const drool = makeDrool(jaw, [[-0.025, -0.03, 0.26], [0.025, -0.03, 0.3]]);

    // ---- wings: real arm and finger bones under a membrane drawn with finger bones; the membrane's edges are index-parallel
    const LE = [[0.1, 0.03, 0.12], [0.34, 0.07, 0.13], [0.58, 0.06, 0.18], [1.3, 0.02, -0.12]];   // shoulder, elbow, wrist, tip
    const lePts = [], N0 = [6, 6, 16];
    for (let sI = 0; sI < 3; sI++) for (let i = sI ? 1 : 0; i <= N0[sI]; i++) { const u = i / N0[sI], a = LE[sI], b = LE[sI + 1]; lePts.push([0, 1, 2].map((q) => a[q] + (b[q] - a[q]) * u)); }
    const NC = lePts.length - 1, NV = 4, Bk = [0.09, 0, -0.3], Cc = [0.7, -0.03, -0.46], Tp = LE[3];
    const wingGeo = (s) => {
      const pos = [], uv = [], idx = [];
      for (let i = 0; i <= NC; i++) {
        const u = i / NC, e = [0, 1, 2].map((q) => (1 - u) ** 2 * Bk[q] + 2 * u * (1 - u) * Cc[q] + u * u * Tp[q]);
        e[2] += 0.055 * Math.sin(Math.PI * ((u * 5) % 1)) * (u > 0.2 ? 1 : 0.3);   // the scalloped trailing edge
        for (let j = 0; j <= NV; j++) { const v = j / NV; pos.push(s * (lePts[i][0] + (e[0] - lePts[i][0]) * v), lePts[i][1] + (e[1] - lePts[i][1]) * v - 0.05 * v * v, lePts[i][2] + (e[2] - lePts[i][2]) * v); uv.push(u, 1 - v); }
      }
      for (let i = 0; i < NC; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
    };
    const wings = [-1, 1].map((s) => {
      const flap = new THREE.Group(); flap.position.set(0, 0.04, 0); body.add(flap);
      const droop = new THREE.Group(); flap.add(droop); const yaw = new THREE.Group(); droop.add(yaw);
      mesh(wingGeo(s), memb, yaw).castShadow = false;
      const q = (p) => [s * p[0], p[1], p[2]];
      bone(yaw, q(LE[0]), q(LE[1]), 0.035, 0.026, boneM); bone(yaw, q(LE[1]), q(LE[2]), 0.026, 0.02, boneM); bone(yaw, q(LE[2]), q(LE[3]), 0.02, 0.006, boneM);
      mesh(new THREE.SphereGeometry(0.04, 12, 8), boneM, yaw, ...q(LE[0])); mesh(new THREE.SphereGeometry(0.03, 10, 8), boneM, yaw, ...q(LE[2]));
      return { flap, droop, yaw, s };
    });
    const haloS = halo(P.whole, 3.0, 0, 0.1, 0.1);

    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, fl = ps.flap ?? 0, fo = clamp(ps.fold ?? 0), br = clamp(ps.breath ?? 0);
        root.rotation.z = rad(ps.bank ?? 0);
        body.position.y = -0.05 * Math.sin(TAU * fl) * (1 - fo);
        trunk.scale.y = 1 + 0.025 * (1 + 2 * br) * Math.sin(tt * 2.4);
        const ang = rad(40) * Math.sin(TAU * fl) * (1 - fo);
        for (const w of wings) { w.flap.rotation.z = w.s * ang; w.droop.rotation.x = -0.7 * fo; w.yaw.rotation.y = w.s * 1.45 * fo; w.yaw.scale.x = 1 - 0.5 * fo; }
        for (const l of legs) { l.g.rotation.x = 1.2 * (1 - fo); l.g.scale.y = 1 + 0.5 * fo; l.sh.rotation.x = -0.4 * (1 - fo); }
        const hy = ps.headY ?? 0, hp = ps.headP ?? 0, jw = clamp(ps.jaw ?? 0);
        head.rotation.set(rad(hp), rad(hy), 0); jaw.rotation.x = 0.5 * jw;
        face.apply(ps);
        drool.apply(clamp(ps.drool ?? 0), tt, hang(qE(rad(hp), rad(hy), 0), qX(0.5 * jw)));
        const gl = clamp(ps.glow ?? 0); S.glow(gl); haloS.visible = gl > 0.01; haloS.material.opacity = 0.32 * gl;
      },
    };
  },
};
