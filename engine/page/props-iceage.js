import * as THREE from "three";
import { clamp } from "./util.js";
import { makeLoft } from "./geo.js";

// Props for There's a catch EP05 "back to life" (12 Nov 2026; storyboards/series/what-if/05-back-to-life/BRIEF-R2.md): the three living
// ice-age animals the Reaper's scythe wakes in the museum hall. Metres, origin on the ground between the feet (the pterosaur: the middle
// of its body), facing +z at rot 0, every prop's own `scale` scales all of it. The mammoth and the sabre-tooth are REAL animals as a
// natural-history illustrator would draw them (rebuilt 12 Nov, R2: "real, not cute"): ONE lofted skin from the tail tip to the skull
// (engine/page/geo.js makeLoft), one lofted skin per leg (hip inside the body -> knee/elbow -> foot), small real eyes set in the skull,
// painted skins; the joints are worked out in apply() so neck, legs and tail bend as one skin. Never gory. They switch from "calm and
// curious" to "starving" with the face alone: brow -1, squint 0.7, jaw 0.3, drool 1, lookY -1 (pupils down). The pterosaur is still the
// first cartoon build (another task replaces it).
// Params are plain numbers in the prop state, all 0 at rest unless said. propState (props3d.js) has defaults for flap, glow,
// jaw, squint, blink, brow, lookX, lookY, headY, headP, breath, bank and tail (see the tail note) but NOT for gait, trunk,
// trunkY, ears, crouch, bound, lick, fold, drool: a first tween of one of those JUMPS, so seed it with a dur-0 `set` at time 0.
// Every prop is a pure function of its params and the clip time (small idle sways read `t`; no random numbers, no clock).
//
// SHARED PARAMS (all three)
//   glow 0..1     every material glows bright green-white #b8ff9a by emissive: 1 = a flat glowing silhouette (the
//                 moment bones become flesh), plus a soft additive halo sprite (see-through for the checks)
//   jaw 0..1      mouth open (lower jaw drops: mammoth 34 deg, sabre-tooth 49 deg, pterosaur 29 deg at 1)
//   brow -1..1    - angry (the brow ridges tilt and drop onto the eyes), + raised
//   squint 0..1   heavy upper lids (0.7 = half closed); blink 0..1 closes them fully
//   lookX/lookY   -1..1 the pupils (+lookX toward the animal's left, +x; lookY -1 looks down)
//   headY/headP   degrees, + turns the head to the animal's left (+x), + nods it down; the neck bends with it as one skin
//   drool 0..1    two or three thin tapered pale blue-white strands (2 cm at the lip to 0.6 cm, half see-through) from the lower
//                 lip, a small teardrop at each end; they hang straight down in the world whatever the head does, 1 = 0.25 to
//                 0.35 m long at scale 1 on all three; 0 draws nothing
//   breath 0..1   the chest heaves (more with more breath)
//
//   mammoth     Mammuthus primigenius: 3.4 long (tail root z -1.58 to face z 1.80), 1.7 wide, 3.1 tall at the head dome (skull 3.02 + the
//               hair mop). Origin: on the ground between the feet. Side profile, front to back: the head dome is the highest point (tall,
//               narrow, peaked), a clear dip at the neck (2.73), a high shoulder hump just behind it (2.88), then the back slopes down
//               steeply to low hips (2.08 = 72 % of the hump); a deep barrel (belly 1.14, 0.85 half width). Front pillar legs 0.62 z, hind
//               -0.95 z, x +-0.46: each ONE loft, nearly straight, thicker at the flat round foot, four pale toenails; the front legs are
//               longer (hip joint 1.95 against 1.70). Trunk: ONE loft from the forehead (root y 2.25, z 1.66), 1.9 m, 0.20 -> 0.07 across,
//               wrinkles painted, two finger tips. Tusks 1.5 m of ivory stained brown at the root: out of the cheeks down and outward, then
//               forward, up and inward (about 1.36 m wide at the tips). Small furry ears close to the head; a short tail with a tuft;
//               a lower jaw under the trunk's root that drops for `jaw`. Coat: painted long hanging strokes (chocolate #4a3222 on the
//               back to red-brown #7d5234 on the flanks) plus about 200 flat hanging locks: a ragged skirt round the belly, the throat,
//               the cheeks, the chin, the tops of the legs, the back and a mop on the dome. Eyes r 0.035, dark brown, deep in the side of
//               the skull under a heavy hairy brow, with lashes.
//               gait     count of walk cycles, diagonal pairs (each foot is planted for 60 % of a cycle and slides back 1.02 m while the
//                        body moves on: it does not slide on the ground when the prop travels 1.7 m per cycle at scale 1; the lifted
//                        foot rises 0.22 m with a real knee bend; the body dips up to 8 cm at the widest stance). 0 = standing with
//                        all four feet flat; the walk eases in over the first 0.15 cycle, so a whole number above 0 is a WALK pose
//                        (a foot up), not standing: tween gait back to 0 to stand
//               trunk    -1 hanging and curled in (the tip spirals forward), 0 relaxed S, 1 raised high up over the head
//               trunkY   degrees, swings the trunk sideways (+ to the left, +x)
//               ears     0..1 the ears flare out from the head: tween up and down to flap them
//               Where the head is (scale 1, y up from the ground): eyes at x +-0.35, y 2.20, z 1.52; mouth y 1.5..1.75, face front z 1.80;
//               the head turns about (0, 2.30, 0.98).
//   sabretooth  Smilodon: 1.8 long (rump z -0.78 to nose z +1.03; plus a 0.25 m bobtail), 1.1 tall at the shoulder, 0.6 wide. Origin: on the
//               ground between the feet (z 0 = the middle of the body). Built like a bear-lion, not a house cat: massive shoulders and
//               forelimbs, a deep chest (0.70), the back sloping down from the withers (1.10) to a lighter hip (0.95), a thick muscular neck
//               as long as the head, a long flat forehead into a broad muzzle, small round low ears, a short lower jaw with a chin flange,
//               two flat curved sabres 0.26 m long (tips 0.14 m below the chin when the mouth is closed). Legs: one loft each; front =
//               shoulder -> elbow (back) -> wrist -> big paw, hind = hip -> knee (forward) -> hock (back, high) -> paw (digitigrade);
//               broad four-toed paws, claws only hints. Coat: short tawny #c79a5e fur with fine hair strokes, cream throat, belly and
//               inner legs, a few faint darker rosette smudges on the shoulders and flanks, darker ear backs and tail tip. Eyes r 0.03,
//               pale amber, round pupil, dark rim, forward-facing; a pink-brown nose pad; a few thin short whiskers.
//               Where the head is: eyes at x +-0.135, y 0.885, z 0.79; mouth y 0.66; nose z 1.03; the head turns about (0, 0.84, 0.56).
//               gait     as the mammoth, diagonal pairs, planted paws 55 % of the cycle and slide back 0.72 m: no sliding at 1.3 m
//                        per cycle (bound 1 sweeps 1.5 times as far); the lifted paw rises 0.12 m, knee forward, hock back; the body dips
//                        up to a few cm. 0 = standing; the walk eases in over the first 0.15 cycle (a whole number above 0 is a walk pose)
//               bound    0..1 (extra) at speed: 0 the diagonal trot, 1 the pairs bound (front pair together, rear pair together
//                        a beat behind, bigger swing, the body pitches along)
//               crouch   0..1 the stalk: the chest drops about 0.25 m about the hips (front legs fold at the elbow), rump high, head held up
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
const X_AXIS = new THREE.Vector3(1, 0, 0), Y_AXIS = new THREE.Vector3(0, 1, 0);

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

// ---------------------------------------------------------------- real anatomy: shared by the mammoth and the sabre-tooth
// (one continuous lofted skin per body part, joints worked out in apply(), painted skins, small real eyes)
const sstep = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const nrm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const rgbOf = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixRGB = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const css = (c, a = 1, j = 0) => `rgba(${c.map((v) => Math.round(clamp(v + j, 0, 255))).join(",")},${a})`;
// a colour ramp: stops [[t, "#hex"], ...] sampled at t
function ramp(stops, t) {
  const s = stops.map(([k, h]) => [k, rgbOf(h)]);
  if (t <= s[0][0]) return s[0][1];
  for (let i = 1; i < s.length; i++) if (t <= s[i][0]) return mixRGB(s[i - 1][1], s[i][1], (t - s[i - 1][0]) / (s[i][0] - s[i - 1][0] || 1));
  return s[s.length - 1][1];
}
// 2-bone IK in the y-z plane (x is the leg's own): the middle joint between hip h and foot f ([x, y, z]); bend +1 puts it toward +z.
// The foot is never farther than 0.9995 of the leg: callers dip the body first so it is reached.
function ik2(h, f, L1, L2, bend) {
  const dy = f[1] - h[1], dz = f[2] - h[2], d = Math.hypot(dy, dz) || 1e-6;
  const dd = clamp(d, Math.abs(L1 - L2) + 0.01, (L1 + L2) * 0.9995), a = (L1 * L1 - L2 * L2 + dd * dd) / (2 * dd), hh = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const uy = dy / d, uz = dz / d, sg = uy <= 0 ? 1 : -1;   // the perpendicular with a positive z for a leg that points down
  return [h[0], h[1] + uy * a + uz * sg * hh * bend, h[2] + uz * a - uy * sg * hh * bend];
}
// one foot on its walk cycle: f the phase 0..1; stance (a share `duty` of it) sweeps the planted foot back by `S` metres at a constant
// speed, swing carries it forward over the rest, lifted by `H` at the top. Returns [forward offset, lift].
function footPath(f, S, duty, H) {
  if (f < duty) return [S * (0.5 - f / duty), 0];
  const u = (f - duty) / (1 - duty);
  return [S * (-0.5 + sstep(u)), H * Math.sin(Math.PI * u)];
}
// a flat tapered hanging lock of hair (top at the origin, hangs along -y); many are merged into one geometry
// list rows: { p: [x, y, z], yaw (the way its flat face looks), tilt (- tips the end outward, + > 1.5 lays it up and back), L, w, bend }
function locksGeo(list, seg = 5) {
  const pos = [], uv = [], idx = [], v = new THREE.Vector3(), q = new THREE.Quaternion(), qT = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, "YXZ"), m = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1), pv = new THREE.Vector3();
  let base = 0;
  for (const k of list) {
    e.set(k.tilt ?? 0, k.yaw ?? 0, 0, "YXZ"); q.setFromEuler(e); if (k.twist) q.multiply(qT.setFromAxisAngle(Y_AXIS, k.twist)); m.compose(pv.set(...k.p), q, one);
    const u0 = k.u ?? 0;
    for (let i = 0; i <= seg; i++) {
      const t = i / seg, hw = (k.w / 2) * Math.sqrt(Math.max(0.0004, 1 - Math.pow(t, 2.4))) * (1 - 0.4 * t), y = -k.L * t, z = (k.bend ?? 0.05) * t * t * k.L, wob = Math.sin(t * 3.2 + (k.u ?? 0) * 9) * 0.06 * k.L * t;
      for (let j = -1; j <= 1; j++) { v.set(j * hw + wob, y, z + (j === 0 ? 0.014 * (1 - t) : 0)).applyMatrix4(m); pos.push(v.x, v.y, v.z); uv.push(u0 + (j + 1) * 0.12, 1 - t * 0.98); }
    }
    for (let i = 0; i < seg; i++) for (let j = 0; j < 2; j++) { const a = base + i * 3 + j, b = a + 1, c = a + 3, d = c + 1; idx.push(a, c, b, b, c, d); }
    base += (seg + 1) * 3;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// the locks split over several materials (row i takes material i % mats.length): one merged mesh each
function lockMeshes(list, mats, parent) {
  return mats.map((m, k) => { const o = mesh(locksGeo(list.filter((_, i) => i % mats.length === k)), m, parent); o.castShadow = false; return o; });
}
// small real eyes: an eyeball set into the skull, sclera, a dark rim, coloured iris, round pupil and one glint (all caps of the same
// sphere, so they curve with it), an upper lid that turns down for squint / blink, lashes on it, and a brow ridge that tilts and
// drops for brow. o: x, y, z (the left eye centre in parent), R, spread (turn outward, rad), tilt (rad, + looks down), sclera, rim,
// iris, pupilTh (pupil cap, rad), irisTh, lidM, browGeo (a loft along x), browM, browUp (the brow's height over the eye in R), lashes (n)
function realEyes(S, parent, o) {
  const R = o.R, sclM = S.b(o.sclera), rimM = S.b(o.rim), irisM = S.b(o.iris), pupM = S.b("#120c08"), glM = S.b("#fdfcf6"), lashM = S.b("#1a0f08");
  [rimM, irisM, pupM, glM].forEach((m, k) => { m.polygonOffset = true; m.polygonOffsetFactor = -(k + 1); m.polygonOffsetUnits = -(k + 1); });
  const cap = (r, th, m) => { const g = new THREE.SphereGeometry(r, 24, 14, 0, TAU, 0, th); g.rotateX(Math.PI / 2); return new THREE.Mesh(g, m); };
  const eyes = [-1, 1].map((s) => {
    const g = new THREE.Group(); g.position.set(s * o.x, o.y, o.z); g.rotation.order = "YXZ"; g.rotation.set(o.tilt ?? 0, s * o.spread, 0); parent.add(g);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(R, 24, 16), sclM));
    const pup = new THREE.Group(); g.add(pup);
    pup.add(cap(R * 1.004, o.irisTh + 0.12, rimM), cap(R * 1.008, o.irisTh, irisM), cap(R * 1.012, o.pupilTh, pupM));
    const gl = new THREE.Mesh(new THREE.SphereGeometry(R * 0.11, 8, 6), glM); gl.position.set(R * 0.3, R * 0.32, R * 0.92); pup.add(gl);
    const lid = new THREE.Mesh(new THREE.SphereGeometry(R * 1.1, 24, 12, 0, TAU, 0, Math.PI / 2), o.lidM); lid.scale.set(1, 1.05, 1); lid.rotation.x = -Math.PI / 2; lid.castShadow = false;
    const lidP = new THREE.Group(); lidP.add(lid); g.add(lidP);
    for (let k = 0; k < (o.lashes ?? 0); k++) {   // lashes on the upper rim of the lid: they swing down with it
      const ph = rad(25 + (k / Math.max(1, o.lashes - 1)) * 130), d = new THREE.Vector3(Math.cos(ph), Math.sin(ph), 0), L = R * 0.75;
      const l = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.035, R * 0.012, L, 4, 1), lashM); l.position.copy(d).multiplyScalar(R * 1.1 + L * 0.45); l.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); l.castShadow = false; lidP.add(l);
    }
    const browG = new THREE.Group(); browG.position.set(s * o.x, o.y + R * o.browUp, o.z); browG.rotation.y = s * o.spread; parent.add(browG);
    const browT = new THREE.Group(); browG.add(browT); mesh(o.browGeo, o.browM, browT, 0, 0, R * 0.2);
    return { pup, lidP, browG, browT, s };
  });
  return {
    apply(ps) {
      const lx = clamp(ps.lookX ?? 0, -1, 1), ly = clamp(ps.lookY ?? 0, -1, 1), lidK = Math.max(clamp(ps.squint ?? 0) * 0.55, clamp(ps.blink ?? 0)), bw = clamp(ps.brow ?? 0, -1, 1);
      for (const e of eyes) {
        e.pup.rotation.set(-ly * 0.4, lx * 0.45 - e.s * 0.06, 0);
        e.lidP.rotation.x = rad(35 + 140 * lidK);
        e.browT.rotation.z = e.s * -0.4 * bw;
        e.browG.position.y = o.y + R * (o.browUp + 0.55 * Math.max(0, bw) - 0.45 * Math.max(0, -bw));
      }
    },
  };
}
// a brow ridge: a loft along x (hairy or furred), w = depth, up / dn = height: nodes [x, w, up]
const browLoft = (nodes) => makeLoft(nodes.map(([x, w, h]) => ({ c: [x, 0, 0], w, up: h, dn: h * 0.8, n: 2.4 })), { sub: 3, radial: 14 });

// ---------------------------------------------------------------- mammoth: painted skins (each drawn once from the seeded rnd; u along the spine = canvas x, v round it:
// back v 0.5 = the middle row, belly v 0 / 1 = the top and bottom rows)
const MAM_COAT = [[0, "#4a3222"], [0.4, "#6e4730"], [0.62, "#7d5234"], [1, "#3c281b"]];   // back -> flank -> belly
const mamCoatTex = () => once("mamCoatR", () => cvs(1024, 512, (g, W, H) => {
  const gr = g.createLinearGradient(0, 0, 0, H);
  for (let i = 0; i <= 16; i++) { const k = i / 16, t = Math.abs(k - 0.5) * 2; gr.addColorStop(k, css(ramp(MAM_COAT, t))); }
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 5200; i++) {   // long strokes from the back down the flank, hanging a little backward
    const x = rnd(i * 5 + 1) * W, y0 = H * (0.04 + 0.92 * rnd(i * 5 + 2)), dir = y0 < H / 2 ? -1 : 1, L = 36 + rnd(i * 5 + 3) * 170, t = Math.abs(y0 - H / 2) / (H / 2);
    const x1 = x - L * (0.08 + 0.12 * rnd(i * 5 + 4)), y1 = y0 + dir * L, c = ramp(MAM_COAT, clamp(t + (y1 - y0) * dir / H));
    g.strokeStyle = i % 4 ? css(c, 0.5, (rnd(i * 5 + 5) - 0.5) * 36) : css([150, 104, 68], 0.22); g.lineWidth = 1.2 + rnd(i + 77) * 2.4;
    g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x - L * 0.02, y0 + dir * L * 0.5, x1, y1); g.stroke();
  }
}));
const mamLegTex = () => once("mamLegR", () => cvs(512, 256, (g, W, H) => {   // x down the leg (top 0), y round it
  g.fillStyle = "#6e4730"; g.fillRect(0, 0, W, H);
  const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, "rgba(74,50,34,0.7)"); gr.addColorStop(0.4, "rgba(125,82,52,0.2)"); gr.addColorStop(0.7, "rgba(74,50,34,0.55)"); gr.addColorStop(1, "rgba(48,32,22,0.8)");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 1800; i++) {   // hair running down the leg, fuller and shaggier in the boot
    const boot = i % 3 === 0, x = (boot ? 0.5 + 0.48 * rnd(i * 5 + 1) : rnd(i * 5 + 1)) * W, y = rnd(i * 5 + 2) * H, L = 30 + rnd(i * 5 + 3) * (boot ? 130 : 90);
    g.strokeStyle = i % 3 ? css([66, 44, 30], 0.55, (rnd(i + 5) - 0.5) * 30) : css([150, 104, 68], 0.3); g.lineWidth = 1.5 + rnd(i * 5 + 4) * 2.5;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + L * 0.5, y + (rnd(i + 9) - 0.5) * 8, x + L, y + (rnd(i + 11) - 0.5) * 12); g.stroke();
  }
}));
const mamTrunkTex = () => once("mamTrunkR", () => cvs(1024, 128, (g, W, H) => {   // x along the trunk, y round it
  g.fillStyle = "#86593a"; g.fillRect(0, 0, W, H);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "rgba(60,36,20,0.35)"); gr.addColorStop(0.5, "rgba(60,36,20,0.0)"); gr.addColorStop(1, "rgba(60,36,20,0.35)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 96; k++) {   // wrinkle rings: a dark crease, a pale ridge beside it
    const x = (k + rnd(k) * 0.7) * (W / 96), w = 2 + rnd(k + 9) * 4;
    g.strokeStyle = `rgba(48,26,14,${0.4 + 0.3 * rnd(k + 5)})`; g.lineWidth = w; g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + (rnd(k + 2) - 0.5) * 8, H / 2, x + (rnd(k + 4) - 0.5) * 4, H); g.stroke();
    g.strokeStyle = "rgba(205,160,115,0.3)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x + w, 0); g.lineTo(x + w + (rnd(k + 3) - 0.5) * 4, H); g.stroke();
  }
  for (let i = 0; i < 400; i++) { g.fillStyle = "rgba(40,22,12,0.22)"; g.beginPath(); g.ellipse(rnd(i) * W, rnd(i + 70) * H, 1.5 + rnd(i + 4) * 2.5, 1, 0, 0, TAU); g.fill(); }
  for (let i = 0; i < 260; i++) {   // the root of the trunk is hairy
    const x = rnd(i + 500) * W * 0.12, y = rnd(i + 600) * H, L = 14 + rnd(i + 700) * 36; g.strokeStyle = css(i % 2 ? [100, 66, 44] : [125, 82, 52], 0.3); g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y + (rnd(i + 800) - 0.5) * 6); g.stroke();
  }
}));
const mamJawTex = () => once("mamJawR", () => cvs(256, 128, (g, W, H) => {   // x along the jaw, y round it: the top (middle row) is the inside of the mouth
  g.fillStyle = "#5a3b27"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) { const x = rnd(i) * W, y = rnd(i + 300) * H, L = 14 + rnd(i + 5) * 40; g.strokeStyle = css(i % 2 ? [48, 31, 21] : [125, 82, 52], 0.5); g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x - L * 0.2, y + (y < H / 2 ? -L : L) * 0.5); g.stroke(); }
  const gr = g.createLinearGradient(0, H * 0.3, 0, H * 0.7); gr.addColorStop(0, "rgba(140,45,59,0)"); gr.addColorStop(0.25, "#8c2d3b"); gr.addColorStop(0.75, "#8c2d3b"); gr.addColorStop(1, "rgba(140,45,59,0)");
  g.fillStyle = gr; g.fillRect(W * 0.12, H * 0.3, W * 0.88, H * 0.4);
  g.fillStyle = "rgba(224,112,126,0.9)"; g.beginPath(); g.ellipse(W * 0.5, H * 0.5, W * 0.3, H * 0.1, 0, 0, TAU); g.fill();   // the tongue
}));
// the tusk: u runs along it (root at the bottom of the canvas), ivory with growth rings, streaks and brown stains at the root
const tuskTex = () => once("tuskR", () => cvs(64, 256, (g, W, H) => {
  g.fillStyle = "#f1e5c6"; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 28; k++) { const y = (k + rnd(k)) * (H / 28); g.strokeStyle = "rgba(150,120,70,0.16)"; g.lineWidth = 2 + rnd(k + 8) * 2; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + (rnd(k + 1) - 0.5) * 6); g.stroke(); }
  for (let i = 0; i < 24; i++) { g.strokeStyle = i % 2 ? "rgba(120,90,50,0.18)" : "rgba(255,255,255,0.35)"; g.lineWidth = 2; const x = rnd(i + 20) * W, y = rnd(i) * H * 0.5 + H * 0.3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 4, y + 60 + rnd(i + 6) * 90); g.stroke(); }
  const gr = g.createLinearGradient(0, H, 0, H * 0.55); gr.addColorStop(0, "rgba(110,70,34,0.75)"); gr.addColorStop(1, "rgba(120,80,40,0)"); g.fillStyle = gr; g.fillRect(0, H * 0.55, W, H * 0.45);
  const gt = g.createLinearGradient(0, 0, 0, H * 0.12); gt.addColorStop(0, "rgba(150,120,70,0.4)"); gt.addColorStop(1, "rgba(150,120,70,0)"); g.fillStyle = gt; g.fillRect(0, 0, W, H * 0.12);
}));

// ================================================================================================ kinds
export const ICEAGE_KINDS = {
  // ------------------------------------------------------------------------------------------------ mammoth
  mammoth(P) {
    const S = palette(), DS = THREE.DoubleSide;
    const coat = S.m("#ffffff", { map: mamCoatTex(), roughness: 0.95 }), legM = S.m("#ffffff", { map: mamLegTex(), roughness: 0.95 });
    const trunkM = S.m("#ffffff", { map: mamTrunkTex(), roughness: 0.85 }), jawM = S.m("#ffffff", { map: mamJawTex(), roughness: 0.9 });
    const earM = S.m("#ffffff", { map: strandTex("#4f3220", 45), roughness: 0.95 }), browM = S.m("#ffffff", { map: strandTex("#3d281a", 46), roughness: 0.95 });
    const ivory = S.m("#ffffff", { map: tuskTex(), roughness: 0.4 }), nailM = S.m("#ffffff", { map: fleck("#e9dfc6", 6), roughness: 0.5 });
    const lockM = [["#6e4730", 51], ["#4a3222", 52], ["#8a5a36", 53]].map(([c, s]) => S.m("#ffffff", { map: strandTex(c, s), roughness: 0.95, side: DS }));
    const root = new THREE.Group(); P.whole.add(root);
    const bodyG = new THREE.Group(); root.add(bodyG);   // everything that rides the body's dip (locks)

    // ---- the profile (side view), tail tip to the face: [z, centre y, half width, up, down, superellipse n, share of the head's turn]
    // back line = y + up, belly line = y - dn: head dome (3.02, the mop adds a hand) > shoulder hump (2.88) > neck dip (2.73) > sloping back
    // down to the hips (2.08 = 72 % of the hump), a deep barrel (1.14 belly). The first 3 rows are the tail (set in apply).
    const NB = [
      [-1.52, 1.78, 0.38, 0.22, 0.22, 2.2, 0], [-1.30, 1.70, 0.60, 0.35, 0.36, 2.2, 0], [-0.95, 1.64, 0.74, 0.44, 0.44, 2.2, 0], [-0.50, 1.70, 0.80, 0.55, 0.55, 2.2, 0],
      [-0.05, 1.84, 0.85, 0.72, 0.70, 2.2, 0], [0.32, 1.98, 0.84, 0.83, 0.83, 2.2, 0], [0.62, 2.08, 0.76, 0.80, 0.84, 2.2, 0], [0.88, 2.18, 0.58, 0.55, 0.66, 2.2, 0.35],
      [1.05, 2.30, 0.46, 0.60, 0.46, 2.4, 1], [1.25, 2.30, 0.47, 0.72, 0.45, 2.4, 1], [1.50, 2.30, 0.38, 0.62, 0.50, 2.4, 1], [1.70, 2.25, 0.25, 0.42, 0.50, 2.4, 1], [1.80, 2.22, 0.14, 0.20, 0.48, 2.4, 1],
    ];
    const NT = 3, NN = NT + NB.length;
    const bodyAt = (z) => { let i = 0; while (i < NB.length - 2 && NB[i + 1][0] < z) i++; const a = NB[i], b = NB[i + 1], f = clamp((z - a[0]) / (b[0] - a[0])); return { cy: a[1] + (b[1] - a[1]) * f, w: a[2] + (b[2] - a[2]) * f, up: a[3] + (b[3] - a[3]) * f, dn: a[4] + (b[4] - a[4]) * f }; };
    const HP = [0, 2.30, 0.98];   // the atlas: the head turns about it
    const rel = (p) => [p[0] - HP[0], p[1] - HP[1], p[2] - HP[2]];   // a rest-pose point as a head-frame point

    // ---- the skin: tail to dome, ONE loft
    const mkSec = (c, w, up, dn, n = 2.2) => ({ c, w, up, dn, n });
    const bodyRest = [mkSec([0, 1.3, -1.8], 0.04, 0.04, 0.04), mkSec([0, 1.5, -1.7], 0.06, 0.06, 0.06), mkSec([0, 1.84, -1.58], 0.09, 0.09, 0.09), ...NB.map((r) => mkSec([0, r[1], r[0]], r[2], r[3], r[4], r[5]))];
    const bodyGeo = makeLoft(bodyRest, { sub: 5, radial: 28 }), bodyMesh = mesh(bodyGeo, coat, root);

    // ---- the four legs: ONE loft each, hip (inside the body) -> knee -> ankle -> flat round foot
    const LEG = {   // hip joint, rest foot z, upper / lower bone, ankle height, bend, rows [w, up, dn] pad..sole
      f: { hy: 1.95, z: 0.62, fz: 0.66, L1: 0.95, L2: 0.72, fh: 0.30, rows: [[0.25, 0.30, 0.30], [0.27, 0.32, 0.32], [0.28, 0.31, 0.30], [0.26, 0.28, 0.27], [0.245, 0.255, 0.25], [0.255, 0.265, 0.255], [0.29, 0.31, 0.28], [0.30, 0.32, 0.27]] },
      b: { hy: 1.58, z: -0.95, fz: -0.98, L1: 0.78, L2: 0.56, fh: 0.30, rows: [[0.24, 0.29, 0.29], [0.26, 0.31, 0.31], [0.27, 0.30, 0.29], [0.25, 0.27, 0.26], [0.235, 0.245, 0.24], [0.245, 0.255, 0.245], [0.28, 0.30, 0.27], [0.29, 0.31, 0.26]] },
    };
    const legPts = (H, K, A, sole, toe) => {
      const up = nrm3([H[0] - K[0], H[1] - K[1], H[2] - K[2]]);
      return [[H[0] + up[0] * 0.18, H[1] + up[1] * 0.18, H[2] + up[2] * 0.18], H, mix3(H, K, 0.5), K, mix3(K, A, 0.5), A, [A[0], sole[1] + (A[1] - sole[1]) * 0.4, A[2]], [sole[0], sole[1], sole[2] + toe]];
    };
    const legs = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([s, f]) => {
      const d = f > 0 ? LEG.f : LEG.b, x = s * 0.42, ph = (s > 0) === (f > 0) ? 0 : 0.5;
      const rest = legPts([x, d.hy, d.z], [x, d.hy * 0.55, d.z + 0.02], [x, d.fh, d.fz], [x, 0, d.fz], 0.02);
      const geo = makeLoft(rest.map((p, i) => mkSec(p, ...d.rows[i], 2.4)), { sub: 4, radial: 22, ref: [0, 0, 1] }); mesh(geo, legM, root);
      const nails = new THREE.Group(); root.add(nails);   // four pale toenails round the front of the foot
      for (const a of [-0.78, -0.26, 0.26, 0.78]) { const ag = new THREE.Group(); ag.rotation.y = a; nails.add(ag); const n = mesh(new THREE.ConeGeometry(0.05, 0.1, 8), nailM, ag, 0, 0.055, d.rows[7][1] - 0.01); n.rotation.x = Math.PI / 2; n.scale.set(1.3, 1, 0.45); n.castShadow = false; }
      return { s, f, d, x, ph, geo, nails };
    });

    // ---- coat: ragged curtains of long hanging locks (flat tapered strips); body ones ride the body, head ones the head
    const bodyLocks = [], headLocks = [];
    const lk = (L, p, yaw, tilt, len, w, bend = 0.05, twist = 0) => L.push({ p, yaw, tilt, twist, L: len, w, bend, u: rnd(L.length * 3 + 7 + (L === bodyLocks ? 0 : 400)) * 0.7 });
    for (const s of [-1, 1]) {
      for (let i = 0; i < 40; i++) {   // the belly skirt, two rows a side
        const z = -1.42 + i * 0.0735 + (rnd(i + s * 40) - 0.5) * 0.05; if (z > 0.96) continue;
        const r = bodyAt(z), mid = sstep(1 - Math.abs(z + 0.1) / 1.5), th = 0.85 + (rnd(i + 9) - 0.5) * 0.2;
        lk(bodyLocks, [s * r.w * Math.cos(th) * 0.97, r.cy - r.dn * Math.sin(th), z], s * Math.PI / 2 + (rnd(i + 3) - 0.5) * 0.5, -0.2 - rnd(i + 4) * 0.15, 0.28 + 0.6 * mid * (0.45 + 0.55 * rnd(i + 5)), 0.22 + 0.12 * rnd(i + 6));
        if (i % 2 === 0) { const t2 = 0.3 + rnd(i + 11) * 0.2; lk(bodyLocks, [s * r.w * Math.cos(t2) * 0.98, r.cy - r.dn * Math.sin(t2), z + 0.04], s * Math.PI / 2 + (rnd(i + 13) - 0.5) * 0.5, -0.15 - rnd(i + 14) * 0.15, 0.25 + 0.35 * mid * rnd(i + 15), 0.2 + 0.1 * rnd(i + 16)); }
      }
    }
    for (let i = 0; i < 12; i++) lk(bodyLocks, [(rnd(i + 60) - 0.5) * 0.8, 1.6 - 0.03 * (i % 3), 0.84 + 0.02 * (i % 4) + (rnd(i + 61) - 0.5) * 0.1], (rnd(i + 62) - 0.5) * 0.9, -0.12 - rnd(i + 63) * 0.12, 0.5 + 0.4 * rnd(i + 64), 0.17 + 0.07 * rnd(i + 65));   // the throat and brisket mane
    for (let i = 0; i < 30; i++) { const z = -1.4 + i * 0.077, r = bodyAt(z); lk(bodyLocks, [(rnd(i + 70) - 0.5) * 0.14, r.cy + r.up - 0.04, z], (rnd(i + 71) - 0.5) * 0.5, 2.0 + rnd(i + 72) * 0.2, 0.2 + 0.18 * rnd(i + 73), 0.12 + 0.04 * rnd(i + 74), 0.02, 1.4 + rnd(i + 75) * 0.4); }   // the shaggy back, laid backward
    for (const l of legs) for (let i = 0; i < 10; i++) {   // a ring of locks round the top of every leg hides the joint with the body
      const a = (i / 10) * TAU + rnd(i + l.x * 9 + l.d.z * 5) * 0.3, r = 0.3, bd = bodyAt(l.d.z);
      lk(bodyLocks, [l.x + Math.sin(a) * r, bd.cy - bd.dn * 0.92 + 0.12, l.d.z + Math.cos(a) * r], a, -0.2 - rnd(i + 80) * 0.12, 0.4 + 0.22 * rnd(i + 81), 0.16 + 0.07 * rnd(i + 82));
    }
    lockMeshes(bodyLocks, lockM, bodyG);
    for (const s of [-1, 1]) for (let i = 0; i < 9; i++) { const z = 1.14 + i * 0.065 + rnd(i + s * 5) * 0.04; lk(headLocks, rel([s * (0.34 + 0.02 * rnd(i + 90)), 2.0 - 0.07 * Math.abs(i - 4) * 0.5, z]), s * Math.PI / 2, -0.2 - rnd(i + 91) * 0.15, 0.3 + 0.22 * rnd(i + 92), 0.15 + 0.06 * rnd(i + 93)); }   // cheeks
    for (let i = 0; i < 6; i++) lk(headLocks, rel([(rnd(i + 100) - 0.5) * 0.3, 1.8, 1.35 + i * 0.07]), (rnd(i + 101) - 0.5) * 1.2, -0.1, 0.25 + 0.2 * rnd(i + 102), 0.1);   // chin
    for (let i = 0; i < 18; i++) { const z = 1.02 + i * 0.03, ysk = 2.3 + (z < 1.25 ? 0.6 + 0.12 * (z - 1.02) / 0.23 : 0.72 - 0.4 * (z - 1.25)); lk(headLocks, rel([(rnd(i + 110) - 0.5) * 0.3, ysk - 0.04, z]), (rnd(i + 111) - 0.5) * 0.8, 2.15 + rnd(i + 112) * 0.2, 0.2 + 0.16 * rnd(i + 113), 0.17, 0.02, 1.2 + rnd(i + 114) * 0.6); }   // the mop on the dome
    for (let i = 0; i < 9; i++) lk(headLocks, rel([(rnd(i + 120) - 0.5) * 0.36, 2.62 - 0.03 * (i % 3), 1.56 + 0.02 * (i % 2)]), (rnd(i + 121) - 0.5) * 0.7, -0.6 + rnd(i + 122) * 0.2, 0.28 + 0.14 * rnd(i + 123), 0.1, 0.02);   // forelocks over the face
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) lk(headLocks, rel([s * (0.37 + 0.01 * (i % 2)), 2.31 - 0.01 * (i % 3), 1.46 + i * 0.045]), s * (Math.PI / 2 - 0.2), -0.35 - rnd(i + 140) * 0.2, 0.1 + 0.07 * rnd(i + 141), 0.1);   // the heavy hairy brow
    const tuftG = new THREE.Group(); bodyG.add(tuftG); const tuftL = [];
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; lk(tuftL, [Math.sin(a) * 0.03, 0.02, Math.cos(a) * 0.03], a, -0.3 - rnd(i + 130) * 0.15, 0.2 + 0.12 * rnd(i + 131), 0.1); }
    lockMeshes(tuftL, lockM.slice(1), tuftG);

    // ---- head frame: everything below turns with the head about the atlas
    const headG = new THREE.Group(); headG.rotation.order = "YXZ"; root.add(headG);
    lockMeshes(headLocks, lockM, headG);
    // the lower jaw: one loft, hinged under the skull; its top is the inside of the mouth
    const J = [0, 1.80, 1.05], jawG = new THREE.Group(); jawG.position.set(...rel(J)); headG.add(jawG);
    const jr = [[1.05, 1.80, 0.27, 0.10, 0.12], [1.30, 1.66, 0.26, 0.10, 0.12], [1.50, 1.62, 0.22, 0.09, 0.11], [1.66, 1.60, 0.17, 0.08, 0.10], [1.73, 1.60, 0.11, 0.06, 0.07]];
    mesh(makeLoft(jr.map(([z, y, w, u, dn]) => mkSec([0, y - J[1], z - J[2]], w, u, dn, 2.4)), { sub: 4, radial: 20 }), jawM, jawG);
    const drool = makeDrool(jawG, [[-0.1, -0.3, 0.6], [0.08, -0.31, 0.64], [0, -0.32, 0.52]]);
    // ears: small, furry, close to the head (a thin loft hanging from the side of the skull; `ears` flares them)
    const earGeo = makeLoft([[0, 0.05, 0, 0.02, 0.08, 0.08], [0.015, -0.03, -0.005, 0.03, 0.085, 0.085], [0.04, -0.1, -0.012, 0.03, 0.08, 0.08], [0.06, -0.17, -0.016, 0.022, 0.058, 0.058], [0.068, -0.215, -0.016, 0.008, 0.02, 0.02]].map(([x, y, z, w, u, dn]) => mkSec([x, y, z], w, u, dn, 2.0)), { sub: 3, radial: 14, ref: [0, 0, 1] });
    const ears = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(...rel([s * 0.40, 2.50, 1.12])); g.scale.x = s; headG.add(g); mesh(earGeo, coat, g); return { g, s }; });
    // tusks: out of the cheeks DOWN and outward, then sweeping forward, up and inward (a wide spiral), 1.5 m, ivory stained brown at the root
    const swapUV = (g) => { const a = g.attributes.uv.array; for (let i = 0; i < a.length; i += 2) { const t = a[i]; a[i] = a[i + 1]; a[i + 1] = t; } return g; };
    for (const s of [-1, 1]) {
      const cv = new THREE.CatmullRomCurve3([[0.30, 1.92, 1.40], [0.40, 1.70, 1.66], [0.50, 1.46, 1.84], [0.60, 1.34, 2.06], [0.67, 1.36, 2.30], [0.68, 1.50, 2.50], [0.60, 1.72, 2.62]].map(([x, y, z]) => new THREE.Vector3(...rel([s * x, y, z]))));
      mesh(swapUV(makeLoft(Array.from({ length: 14 }, (_, i) => { const u = i / 13, r = 0.075 + (0.011 - 0.075) * Math.pow(u, 0.85); return mkSec(cv.getPointAt(u).toArray(), r, r, r, 2); }), { sub: 3, radial: 16 })), ivory, headG);
    }
    // eyes: small (r 0.035), dark brown, deep in the side of the skull under a heavy hairy brow, with lashes
    const face = realEyes(S, headG, { x: 0.372, y: -0.10, z: 0.54, R: 0.035, spread: 1.2, sclera: "#2b190e", rim: "#160d07", iris: "#6a4220", irisTh: 0.78, pupilTh: 0.34, lidM: browM, lashes: 6, browGeo: browLoft([[-0.10, 0.014, 0.014], [-0.05, 0.042, 0.03], [0, 0.052, 0.036], [0.05, 0.042, 0.03], [0.10, 0.014, 0.014]]), browM, browUp: 1.45 });

    // ---- trunk: ONE loft from the forehead down, 1.9 m, 0.20 -> 0.07, wrinkles painted, two finger tips; bent segment by segment
    const TR = [0, 2.25, 1.66], TS = [-0.1, -0.08, 0, 0.08, 0.15, 0.1, 0, -0.1, -0.2, -0.25], TC = [0.1, 0.05, 0, -0.1, -0.2, -0.35, -0.5, -0.6, -0.65, -0.7], TU = [-1.9, -0.3, -0.25, -0.2, -0.15, -0.1, -0.1, -0.1, -0.1, -0.1];
    const TRR = Array.from({ length: 11 }, (_, i) => 0.2 - 0.13 * Math.pow(i / 10, 0.85));
    const trunkRest = TRR.map((r, i) => mkSec([0, TR[1] - i * 0.19, TR[2]], r, r * 1.05, r * 1.05, 2.1));
    const trunkGeo = makeLoft(trunkRest, { sub: 4, radial: 20, ref: [0, 0, 1] }); mesh(trunkGeo, trunkM, root);
    const tipG = new THREE.Group(); root.add(tipG);   // the two finger tips, hung on the last node
    mesh(taperTube([[0, 0, 0.02], [0, -0.07, 0.04], [0, -0.14, 0.03]], 0.035, 0.008, 8, 8), trunkM, tipG); mesh(taperTube([[0, 0, -0.025], [0, -0.04, -0.04], [0, -0.08, -0.035]], 0.028, 0.008, 8, 6), trunkM, tipG);
    const haloS = halo(P.whole, 4.6, 0, 1.7, 0);
    const qHead = new THREE.Quaternion(), qI = new THREE.Quaternion(), vv = new THREE.Vector3(), hv = new THREE.Vector3(...HP);

    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, gt = ps.gait ?? 0, br = clamp(ps.breath ?? 0), wk = sstep(gt / 0.15), bz = 1 + 0.012 * (1 + 2 * br) * Math.sin(tt * 2.2);
        // ---- feet (stance sweeps the planted foot back 1.02 m over 60 % of the cycle: the body advances 1.7 m a cycle) and the body dip
        const foot = legs.map((l) => { const f = (((gt + l.ph) % 1) + 1) % 1, [dz, lf] = footPath(f, 1.02, 0.6, 0.22); return [l.x, lf * wk, l.d.fz + dz * wk]; });
        let dip = 0;
        legs.forEach((l, i) => { const L = (l.d.L1 + l.d.L2) * 0.997, hz = foot[i][2] - l.d.z, ay = foot[i][1] + l.d.fh; dip = Math.min(dip, ay + Math.sqrt(Math.max(0, L * L - hz * hz)) - l.d.hy); });
        bodyG.position.y = dip;
        // ---- the skin: tail (a short swinging chain with a tuft), body, then the head turned about the atlas by the weights
        const hy = ps.headY ?? 0, hp = ps.headP ?? 0, jw = clamp(ps.jaw ?? 0);
        qHead.setFromEuler(new THREE.Euler(rad(hp), rad(hy), 0, "YXZ"));
        const sec = [];
        const R = [0, 1.84, -1.58], sw = Math.sin(tt * 1.7) * 0.12, a1 = 0.35 + 0.2 * Math.sin(TAU * gt * 2), a2 = a1 + 0.15, n1 = [R[0] + sw * 0.1, R[1] - 0.22 * Math.cos(a1), R[2] - 0.22 * Math.sin(a1)], n2 = [n1[0] + sw * 0.15, n1[1] - 0.22 * Math.cos(a2), n1[2] - 0.22 * Math.sin(a2)];
        sec.push(mkSec(n2, 0.04, 0.04, 0.04), mkSec(n1, 0.06, 0.06, 0.06), mkSec(R, 0.09, 0.09, 0.09));
        for (const r of NB) {
          const c = [0, r[1], r[0]], hw = r[6];
          if (hw > 0) { qI.identity().slerp(qHead, hw); vv.set(c[0] - HP[0], c[1] - HP[1], c[2] - HP[2]).applyQuaternion(qI).add(hv); c[0] = vv.x; c[1] = vv.y; c[2] = vv.z; }
          const k = r[0] > -0.6 && r[0] < 0.7 ? bz : 1;
          sec.push({ c: [c[0], c[1] + dip, c[2]], w: r[2] * k, up: r[3] * k, dn: r[4] * k, n: r[5] });
        }
        bodyGeo.userData.set(sec);
        tuftG.position.set(n2[0], n2[1] - 0.02, n2[2]);
        headG.position.set(HP[0], HP[1] + dip, HP[2]); headG.quaternion.copy(qHead);
        jawG.rotation.x = 0.6 * jw;
        const ea = clamp(ps.ears ?? 0); for (const e of ears) e.g.rotation.z = e.s * (0.1 + 0.85 * ea);
        face.apply(ps);
        // ---- legs
        legs.forEach((l, i) => {
          const d = l.d, H = [l.x, d.hy + dip, d.z], A = [l.x, foot[i][1] + d.fh, foot[i][2]], K = ik2(H, A, d.L1, d.L2, 1), sole = [l.x, foot[i][1], foot[i][2]];
          l.geo.userData.set(legPts(H, K, A, sole, 0.02).map((p, k) => mkSec(p, ...d.rows[k], 2.4)));
          l.nails.position.set(...sole);
        });
        // ---- trunk: relaxed S <-> curled in (trunk -1) <-> raised (trunk 1); sways a little
        const tr = clamp(ps.trunk ?? 0, -1, 1), ta = Math.abs(tr), pose = tr < 0 ? TC : TU, yaw = rad(ps.trunkY ?? 0), cy = Math.cos(yaw), sy = Math.sin(yaw);
        let ang = 0, py = TR[1], pz = TR[2], dyz = [0, 0]; const nodes = [[0, py, pz]], toHead = (p) => { vv.set(p[0] - HP[0], p[1] - HP[1], p[2] - HP[2]).applyQuaternion(qHead).add(hv); return [vv.x, vv.y + dip, vv.z]; };
        for (let i = 0; i < 10; i++) {
          ang += TS[i] + (pose[i] - TS[i]) * ta + 0.03 * Math.sin(tt * 1.3 + i * 0.5) * (1 - ta * 0.5);
          dyz = [-Math.cos(ang) * 0.19, -Math.sin(ang) * 0.19]; py += dyz[0]; pz += dyz[1]; nodes.push([0, py, pz]);
        }
        const tsec = nodes.map((p, i) => { const dz = p[2] - TR[2], q = toHead([dz * sy, p[1], TR[2] + dz * cy]); return mkSec(q, TRR[i], TRR[i] * 1.05, TRR[i] * 1.05, 2.1); });
        trunkGeo.userData.set(tsec);
        const e1 = tsec[10].c, e0 = tsec[9].c; tipG.position.set(...e1); tipG.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), vv.set(e1[0] - e0[0], e1[1] - e0[1], e1[2] - e0[2]).normalize());
        drool.apply(clamp(ps.drool ?? 0), tt, hang(qHead, qX(0.6 * jw)));
        const gl = clamp(ps.glow ?? 0); S.glow(gl); haloS.visible = gl > 0.01; haloS.material.opacity = 0.32 * gl;
      },
    };
  },

  // ------------------------------------------------------------------------------------------------ sabre-tooth
  sabretooth(P) {
    const S = palette();
    const NT = 4;   // tail rows
    // ---- the profile (side view), rump to the nose: [z, centre y, half width, up, down, n, share of the head's turn]; back = y + up, belly = y - dn
    // heavy high shoulders (back 1.10, chest 0.70 deep) sloping down to a lighter hip (0.95), a thick neck, a long flat forehead into a broad muzzle
    const NB = [
      [-0.70, 0.77, 0.13, 0.13, 0.13, 2.2, 0], [-0.50, 0.75, 0.20, 0.19, 0.19, 2.2, 0], [-0.25, 0.755, 0.19, 0.20, 0.20, 2.2, 0], [0.05, 0.74, 0.25, 0.30, 0.30, 2.2, 0],
      [0.28, 0.745, 0.30, 0.355, 0.355, 2.2, 0], [0.45, 0.75, 0.275, 0.325, 0.325, 2.2, 0], [0.55, 0.75, 0.245, 0.24, 0.25, 2.2, 0.45],
      [0.64, 0.79, 0.215, 0.185, 0.195, 2.5, 1], [0.77, 0.775, 0.245, 0.195, 0.19, 2.5, 1], [0.90, 0.765, 0.18, 0.15, 0.14, 2.5, 1], [1.00, 0.75, 0.12, 0.10, 0.09, 2.5, 1], [1.04, 0.74, 0.055, 0.045, 0.05, 2.5, 1],
    ];
    const NN = NT + NB.length, uOf = (i) => i / (NN - 1);
    const coatTex = once("sabCoatR", () => cvs(1024, 512, (g, W, H) => {
      const stops = [[0, "#b3874f"], [0.35, "#c79a5e"], [0.7, "#d9b678"], [1, "#ead6a8"]];   // back -> flank -> belly (t = distance from the back row)
      const gr = g.createLinearGradient(0, 0, 0, H); for (let i = 0; i <= 16; i++) { const k = i / 16; gr.addColorStop(k, css(ramp(stops, Math.abs(k - 0.5) * 2))); }
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const nz = (x, k) => 0.5 + 0.5 * (0.6 * Math.sin(x * 0.021 + rnd(k) * 6) + 0.4 * Math.sin(x * 0.067 + rnd(k + 5) * 6));
      for (let x = 0; x < W; x += 3) {   // cream throat and belly with a soft uneven edge, wider at the throat
        const thr = sstep((x / W - uOf(NT + 5)) / (uOf(NT + 8) - uOf(NT + 5))), e = H * (0.07 + 0.07 * nz(x, 1) + 0.12 * thr * nz(x, 2));
        for (const [y0, dir] of [[0, 1], [H, -1]]) { const gg = g.createLinearGradient(0, y0, 0, y0 + dir * e); gg.addColorStop(0, "rgba(240,224,184,0.95)"); gg.addColorStop(0.7, "rgba(240,224,184,0.7)"); gg.addColorStop(1, "rgba(240,224,184,0)"); g.fillStyle = gg; g.fillRect(x, dir > 0 ? y0 : y0 - e, 3, e); }
      }
      for (let i = 0; i < 6500; i++) {   // fine short hair strokes, each drawn once
        const x = rnd(i * 3 + 1) * W, y = rnd(i * 3 + 2) * H, l = 7 + rnd(i * 3 + 3) * 10, c = ramp(stops, Math.abs(y / H - 0.5) * 2);
        g.strokeStyle = i % 2 ? css(c, 0.4, -34) : css(c, 0.4, 28); g.lineWidth = 1.1; g.beginPath(); g.moveTo(x, y); g.lineTo(x - l, y + (y < H / 2 ? -1 : 1) * l * 0.3); g.stroke();
      }
      for (let i = 0; i < 14; i++) {   // a few faint rosette smudges on the shoulders and flanks (not a leopard)
        const side = i % 2, x = W * (uOf(NT + 0) + (uOf(NT + 5) - uOf(NT + 0)) * rnd(i + 40)), y = H * (side ? 0.64 + 0.15 * rnd(i + 50) : 0.21 + 0.15 * rnd(i + 50)), r = 7 + rnd(i + 60) * 9;
        for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + rnd(i + k) * 1.2; g.fillStyle = css([122, 80, 36], 0.1 + 0.07 * rnd(i + k + 3)); g.beginPath(); g.ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8, r * 0.55, r * 0.42, a, 0, TAU); g.fill(); }
        g.fillStyle = css([205, 160, 100], 0.2); g.beginPath(); g.ellipse(x, y, r * 0.5, r * 0.4, 0, 0, TAU); g.fill();
      }
      for (const v of [0.35, 0.65]) {   // dark rims round the eyes, a tear line down the muzzle, whisker spots
        const y = (1 - v) * H, x = W * uOf(NT + 8.25);
        
        g.lineWidth = 3; g.strokeStyle = "rgba(60,38,18,0.3)"; g.beginPath(); g.moveTo(x + W * 0.012, y + (v < 0.5 ? 1 : -1) * H * 0.03); g.quadraticCurveTo(x + W * 0.05, y + (v < 0.5 ? 1 : -1) * H * 0.07, x + W * 0.085, y + (v < 0.5 ? 1 : -1) * H * 0.09); g.stroke();
        for (let k = 0; k < 9; k++) { g.fillStyle = "rgba(70,44,22,0.55)"; g.beginPath(); g.arc(W * uOf(NT + 9.5) + (k % 3) * 11 + rnd(k) * 4, (1 - (v < 0.5 ? 0.27 : 0.73)) * H + Math.floor(k / 3) * 12 - 10, 2.2, 0, TAU); g.fill(); }
      }
      g.fillStyle = "rgba(78,50,26,0.9)"; g.fillRect(0, 0, W * uOf(1.6), H);   // the tail tip is dark
      const mu = W * uOf(NN - 1.25), no = g.createLinearGradient(mu, 0, W, 0); no.addColorStop(0, "rgba(185,115,122,0)"); no.addColorStop(0.5, "#b9737a"); no.addColorStop(1, "#a05f68"); g.fillStyle = no; g.fillRect(mu, 0, W - mu, H);   // the nose pad
      g.fillStyle = "rgba(120,70,70,0.55)"; for (const k of [-1, 1]) { g.beginPath(); g.ellipse(W * 0.985, H * (0.5 + k * 0.035), 7, 4, 0, 0, TAU); g.fill(); }   // nostrils
      // mouth roof: the underside of the muzzle
      g.fillStyle = "rgba(160,80,92,0.95)"; g.fillRect(W * uOf(NN - 4.6), 0, W * (uOf(NN - 1.5) - uOf(NN - 4.6)), H * 0.045); g.fillRect(W * uOf(NN - 4.6), H * 0.955, W * (uOf(NN - 1.5) - uOf(NN - 4.6)), H * 0.045);
    }));
    const legTex = (innerTop) => once(`sabLegR${innerTop}`, () => cvs(256, 256, (g, W, H) => {   // x down the leg (top 0), y round it; the inner side is cream
      g.fillStyle = "#c79a5e"; g.fillRect(0, 0, W, H);
      const inner = innerTop ? 0.25 : 0.75, gr = g.createLinearGradient(0, 0, 0, H);
      for (let i = 0; i <= 16; i++) { const k = i / 16, d = Math.min(Math.abs(k - inner), Math.abs(k - inner + 1), Math.abs(k - inner - 1)); gr.addColorStop(k, css(mixRGB(rgbOf("#ead6a8"), rgbOf("#c79a5e"), sstep(d / 0.3)), 1)); }
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const pg = g.createLinearGradient(W * 0.8, 0, W, 0); pg.addColorStop(0, "rgba(234,214,168,0)"); pg.addColorStop(1, "rgba(234,214,168,0.85)"); g.fillStyle = pg; g.fillRect(W * 0.8, 0, W * 0.2, H);   // pale paws
      for (let i = 0; i < 1400; i++) { const x = rnd(i * 3 + 1) * W, y = rnd(i * 3 + 2) * H, l = 7 + rnd(i * 3 + 3) * 10; g.strokeStyle = i % 2 ? "rgba(110,72,34,0.3)" : "rgba(255,236,190,0.35)"; g.lineWidth = 1.1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (rnd(i + 7) - 0.5) * 3); g.stroke(); }
      g.strokeStyle = "rgba(90,58,28,0.7)"; g.lineWidth = 2; for (let k = 0; k < 3; k++) { const y = H * (0.5 + (k - 1) * 0.085 + (k === 1 ? 0 : 0)); g.beginPath(); g.moveTo(W * 0.9, y + (k - 1) * 3); g.lineTo(W, y + (k - 1) * 3); g.stroke(); }   // toe lines
    }));
    const earTex = (innerTop) => once(`sabEarR${innerTop}`, () => cvs(128, 128, (g, W, H) => {   // x up the ear, y round it: dark back, cream inside
      g.fillStyle = "#5a3a1c"; g.fillRect(0, 0, W, H);
      g.fillStyle = "#e8c9a0"; g.fillRect(W * 0.1, innerTop ? H * 0.02 : H * 0.52, W * 0.7, H * 0.46);
      for (let i = 0; i < 120; i++) { g.strokeStyle = i % 2 ? "rgba(255,225,170,0.25)" : "rgba(40,22,10,0.3)"; g.lineWidth = 1.2; const x = rnd(i) * W, y = rnd(i + 3) * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10, y + 2); g.stroke(); }
    }));
    const coat = S.m("#ffffff", { map: coatTex, roughness: 0.85 });
    const legML = S.m("#ffffff", { map: legTex(true), roughness: 0.85 }), legMR = S.m("#ffffff", { map: legTex(false), roughness: 0.85 });   // the cream inner side: the +x leg's is its -x side (v 0.75 = canvas y 0.25 H)
    const earML = S.m("#ffffff", { map: earTex(false), roughness: 0.85 }), earMR = S.m("#ffffff", { map: earTex(true), roughness: 0.85 });
    const jawM = S.m("#ffffff", {
      roughness: 0.8, map: once("sabJawR", () => cvs(256, 128, (g, W, H) => {   // the top (middle row) is the inside of the mouth
        g.fillStyle = "#e3cd9e"; g.fillRect(0, 0, W, H);
        for (let i = 0; i < 200; i++) { g.strokeStyle = i % 2 ? "rgba(255,240,200,0.3)" : "rgba(120,90,50,0.25)"; g.lineWidth = 1.1; const x = rnd(i) * W, y = rnd(i + 3) * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 9, y + 2); g.stroke(); }
        g.fillStyle = "#a04b5c"; g.fillRect(W * 0.08, H * 0.34, W * 0.9, H * 0.32); g.fillStyle = "rgba(224,112,126,0.9)"; g.beginPath(); g.ellipse(W * 0.5, H * 0.5, W * 0.3, H * 0.1, 0, 0, TAU); g.fill();
      })),
    });
    const tongueM = S.m("#ffffff", { map: fleck("#df6d7c", 11), roughness: 0.55 }), fang = S.m("#ffffff", { map: fleck("#f6efdc", 15, 40, 0.1), roughness: 0.35 });
    const clawM = S.m("#ffffff", { map: fleck("#efe6cf", 16, 20, 0.1), roughness: 0.5 }), whisk = S.m("#f3ead0", { roughness: 0.5 }); whisk.userData.noOutline = true;
    const brownM = S.m("#ffffff", { map: strandTex("#8a5a2c", 47), roughness: 0.85 });
    const root = new THREE.Group(); P.whole.add(root);

    // ---- skin: tail (a 0.25 m bobtail), body, neck and skull, ONE loft
    const mkSec = (c, w, up, dn, n = 2.2) => ({ c, w, up, dn, n });
    const PV = [0, 0.75, -0.5], HP = [0, 0.80, 0.56];   // the body pitches about the hips; the head turns about the atlas
    const rel = (p) => [p[0] - HP[0], p[1] - HP[1], p[2] - HP[2]];
    const bodyRest = [...[[0, 0.78, -1.02], [0, 0.78, -0.95], [0, 0.82, -0.88], [0, 0.86, -0.78]].map((c, i) => mkSec(c, 0.025 + 0.02 * i, 0.025 + 0.02 * i, 0.025 + 0.02 * i)), ...NB.map((r) => mkSec([0, r[1], r[0]], r[2], r[3], r[4], r[5]))];
    const bodyGeo = makeLoft(bodyRest, { sub: 5, radial: 26 }); mesh(bodyGeo, coat, root);

    // ---- legs: ONE loft each. Front: shoulder -> elbow (back) -> wrist -> big paw. Hind: hip -> knee (forward) -> hock (back, high) -> paw
    const LEG = {
      f: { hy: 0.80, hz: 0.28, hx: 0.15, fz: 0.30, L1: 0.38, L2: 0.38, fh: 0.10, bend: -1, hock: 0, toe: 0.04, rows: [[0.085, 0.12, 0.12], [0.125, 0.17, 0.17], [0.12, 0.16, 0.16], [0.10, 0.125, 0.115], [0.095, 0.115, 0.105], [0.075, 0.085, 0.08], [0.085, 0.105, 0.08], [0.085, 0.115, 0.07]] },
      b: { hy: 0.78, hz: -0.50, hx: 0.14, fz: -0.52, L1: 0.35, L2: 0.37, fh: 0.20, bend: 1, hock: -0.10, toe: 0.03, rows: [[0.05, 0.07, 0.07], [0.10, 0.14, 0.14], [0.10, 0.13, 0.12], [0.075, 0.09, 0.085], [0.06, 0.075, 0.07], [0.05, 0.06, 0.06], [0.047, 0.056, 0.052], [0.052, 0.062, 0.057], [0.058, 0.09, 0.055]] },
    };
    const legPts = (d, H, K, sole) => {
      const up = nrm3([H[0] - K[0], H[1] - K[1], H[2] - K[2]]), pad = [H[0] + up[0] * 0.09, H[1] + up[1] * 0.09, H[2] + up[2] * 0.09], x = sole[0];
      if (d.hock === 0) {   // front: pad, shoulder, mid, elbow, mid, wrist, paw top, sole
        const W = [x, sole[1] + d.fh, sole[2]];
        return [pad, H, mix3(H, K, 0.5), K, mix3(K, W, 0.5), W, [x, sole[1] + d.fh * 0.4, sole[2] + 0.01], [x, sole[1], sole[2] + d.toe]];
      }
      const hock = [x, sole[1] + d.fh, sole[2] + d.hock];   // hind: pad, hip, mid, knee, mid, hock, metatarsal, ankle, sole
      return [pad, H, mix3(H, K, 0.5), K, mix3(K, hock, 0.5), hock, [x, sole[1] + d.fh * 0.6, sole[2] + d.hock * 0.45], [x, sole[1] + 0.05, sole[2]], [x, sole[1], sole[2] + d.toe]];
    };
    const legs = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([s, f]) => {
      const d = f > 0 ? LEG.f : LEG.b, key = (f > 0 ? "f" : "b") + (s > 0 ? "l" : "r"), x = s * d.hx;
      const K0 = [x, d.hy * 0.5, d.hz + (d.bend > 0 ? 0.05 : -0.1)], rest = legPts(d, [x, d.hy, d.hz], K0, [x, 0, d.fz]);
      const geo = makeLoft(rest.map((p, i) => mkSec(p, ...d.rows[i], 2.6)), { sub: 4, radial: 20, ref: [0, 0, 1] }); mesh(geo, s > 0 ? legML : legMR, root);
      const claws = new THREE.Group(); root.add(claws);   // claws are only hints at the front of each paw
      for (const k of [-1.5, -0.5, 0.5, 1.5]) { const c = mesh(new THREE.ConeGeometry(0.012, 0.035, 6), clawM, claws, k * 0.032 * (f > 0 ? 1 : 0.85), 0.012, d.rows[d.rows.length - 1][1] + d.toe - 0.005); c.rotation.x = Math.PI / 2 + 0.3; c.castShadow = false; }
      return { s, f, d, key, x, geo, claws };
    });

    // ---- head frame: everything below turns with the head
    const headG = new THREE.Group(); headG.rotation.order = "YXZ"; root.add(headG);
    // sabres: two flat curved blades 0.26 m long out of the upper jaw, tips well below the chin when the mouth is closed
    for (const s of [-1, 1]) {
      const pts = [[0.085, 0.75, 0.905], [0.088, 0.66, 0.925], [0.09, 0.56, 0.925], [0.09, 0.46, 0.91], [0.09, 0.385, 0.89]];
      const wd = [0.016, 0.014, 0.011, 0.007, 0.002], zz = [0.04, 0.036, 0.028, 0.018, 0.004];
      mesh(makeLoft(pts.map((p, i) => mkSec(rel([s * p[0], p[1], p[2]]), wd[i], zz[i], zz[i], 2.2)), { sub: 4, radial: 12, ref: [0, 0, 1] }), fang, headG);
    }
    // lower jaw: short, with a chin flange; hinged under the skull; its top is the inside of the mouth
    const J = [0, 0.69, 0.72], jawG = new THREE.Group(); jawG.position.set(...rel(J)); headG.add(jawG);
    const jr = [[0.70, 0.675, 0.09, 0.05, 0.045], [0.78, 0.645, 0.095, 0.05, 0.05], [0.88, 0.635, 0.08, 0.045, 0.055], [0.95, 0.625, 0.06, 0.04, 0.065], [0.985, 0.63, 0.04, 0.03, 0.05]];
    mesh(makeLoft(jr.map(([z, y, w, u, dn]) => mkSec([0, y - J[1], z - J[2]], w, u, dn, 2.4)), { sub: 4, radial: 16 }), jawM, jawG);
    const lickG = new THREE.Group(); lickG.position.set(0, 0.04, 0.26); jawG.add(lickG);
    mesh(makeLoft([[0, 0, 0, 0.03, 0.006], [0, 0, 0.06, 0.036, 0.008], [0, 0, 0.12, 0.03, 0.006], [0, 0, 0.16, 0.012, 0.003]].map(([x, y, z, w, u]) => mkSec([x, y, z], w, u, u, 2.2)), { sub: 3, radial: 12 }), tongueM, lickG);
    const drool = makeDrool(jawG, [[-0.05, -0.04, 0.26], [0.05, -0.04, 0.29], [0, -0.04, 0.2]]);
    // whiskers: a few thin short ones
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
      const dir = new THREE.Vector3(s * 0.95, 0.12 * (1 - k), -0.2 + 0.16 * (k - 1)).normalize(), b0 = new THREE.Vector3(...rel([s * 0.1, 0.735 - k * 0.012, 0.97]));
      const w = mesh(new THREE.CylinderGeometry(0.0025, 0.0012, 0.16, 4), whisk, headG, ...b0.clone().addScaledVector(dir, 0.08).toArray()); w.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); w.castShadow = false;
    }
    // ears: small, round, set low on the sides of the skull (a flat rounded loft; dark back, cream inside)
    const earGeo = makeLoft([[0, -0.02, 0.045, 0.04, 0.04], [0, 0.03, 0.058, 0.032, 0.032], [0, 0.075, 0.056, 0.024, 0.024], [0, 0.108, 0.04, 0.016, 0.016], [0, 0.122, 0.014, 0.006, 0.006]].map(([x, y, w, u, dn]) => mkSec([x, y, 0], w, u, dn, 2.4)), { sub: 3, radial: 14, ref: [0, 0, 1] });
    const ears = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(...rel([s * 0.155, 0.925, 0.66])); g.scale.setScalar(0.8); g.rotation.z = -s * 0.22; headG.add(g); mesh(earGeo, s > 0 ? earML : earMR, g, 0, 0, 0); return { g, s }; });
    // eyes: small (r 0.03), pale amber, round pupil, dark rim, forward-facing
    const face = realEyes(S, headG, { x: 0.17, y: 0.925 - HP[1], z: 0.80 - HP[2], R: 0.03, spread: 0.35, tilt: 0.05, sclera: "#e8dcb8", rim: "#2a1a0a", iris: "#e8b84a", irisTh: 0.86, pupilTh: 0.4, lidM: coat, browGeo: browLoft([[-0.045, 0.01, 0.008], [-0.02, 0.022, 0.014], [0.02, 0.022, 0.014], [0.045, 0.01, 0.008]]), browM: brownM, browUp: 1.35, lashes: 0 });
    const haloS = halo(P.whole, 2.4, 0, 0.7, 0);
    const qHead = new THREE.Quaternion(), qI = new THREE.Quaternion(), qP = new THREE.Quaternion(), vv = new THREE.Vector3(), hv = new THREE.Vector3(...HP);
    const TLR = [-0.5, -0.1, 0.1], TLU = [0.5, 0.55, 0.6], TLT = [-1.3, -0.4, -0.2];
    const rotX = (p, th) => { const y = p[1] - PV[1], z = p[2] - PV[2], c = Math.cos(th), s = Math.sin(th); return [p[0], PV[1] + y * c - z * s, PV[2] + y * s + z * c]; };

    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, gt = ps.gait ?? 0, bd = clamp(ps.bound ?? 0), cr = clamp(ps.crouch ?? 0), br = clamp(ps.breath ?? 0), wk = sstep(gt / 0.15), bz = 1 + 0.012 * (1 + 2 * br) * Math.sin(tt * 2.4);
        // the body: crouch pitches the chest down about the hips; at speed the bound pitches it along
        const th = 0.3 * cr + bd * 0.12 * Math.sin(TAU * (gt + 0.2)) * wk;
        // feet: stance sweeps the planted paw back 0.72 m over 55 % of the cycle (the body advances 1.3 m a cycle; the bound sweeps more)
        const PH = { fl: [0, 0], fr: [0.5, 0.05], bl: [0.5, 0.35], br: [0, 0.4] };
        const foot = legs.map((l) => { const [p0, p1] = PH[l.key], f = ((((gt + p0 + (p1 - p0) * bd) % 1) + 1) % 1), [dz, lf] = footPath(f, 0.72 * (1 + 0.5 * bd), 0.55, 0.12 * (1 + 0.5 * bd)); return [l.x, lf * wk, l.d.fz + dz * wk]; });
        const hips = legs.map((l) => rotX([l.x, l.d.hy, l.d.hz], th));
        let dip = 0;
        legs.forEach((l, i) => { const L = (l.d.L1 + l.d.L2) * 0.997, hz = foot[i][2] - hips[i][2], ay = foot[i][1] + l.d.fh; dip = Math.min(dip, ay + Math.sqrt(Math.max(0, L * L - hz * hz)) - hips[i][1]); });
        const hy = ps.headY ?? 0, hp = (ps.headP ?? 0) - 0.8 * (th * 180) / Math.PI, jw = clamp(ps.jaw ?? 0);
        qHead.setFromEuler(new THREE.Euler(rad(hp), rad(hy), 0, "YXZ")); qP.setFromAxisAngle(X_AXIS, th);
        const sec = [], place = (c, hw) => { let p = c; if (hw > 0) { qI.identity().slerp(qHead, hw); vv.set(c[0] - HP[0], c[1] - HP[1], c[2] - HP[2]).applyQuaternion(qI).add(hv); p = [vv.x, vv.y, vv.z]; } const q = rotX(p, th); return [q[0], q[1] + dip, q[2]]; };
        // tail: a short chain from the rump, relaxed -> tucked (tail -1) or up and curled (tail 1)
        const tl = clamp(ps.tail ?? 0, -1, 1), ta = Math.abs(tl), pose = tl < 0 ? TLT : TLU, sway = Math.sin(tt * 1.9) * 0.1;
        let ang = 0, tp = [0, 0.86, -0.78]; const tn = [tp];
        for (let i = 0; i < 3; i++) { ang += TLR[i] + (pose[i] - TLR[i]) * ta; tp = [tp[0] + sway * 0.03 * (i + 1), tp[1] + 0.085 * Math.sin(ang), tp[2] - 0.085 * Math.cos(ang)]; tn.push(tp); }
        [3, 2, 1, 0].forEach((i, k) => sec.push(mkSec(place(tn[i], 0), 0.025 + 0.02 * k, 0.025 + 0.02 * k, 0.025 + 0.02 * k)));
        for (const r of NB) { const k = r[0] > -0.3 && r[0] < 0.5 ? bz : 1; sec.push({ c: place([0, r[1], r[0]], r[6]), w: r[2] * k, up: r[3] * k, dn: r[4] * k, n: r[5] }); }
        bodyGeo.userData.set(sec);
        headG.position.set(...place(HP, 0)); headG.quaternion.copy(qP).multiply(qHead);
        jawG.rotation.x = 0.85 * jw;
        const bw = clamp(ps.brow ?? 0, -1, 1), back = Math.max(0, -bw);
        for (const e of ears) { e.g.rotation.z = -e.s * (0.22 + 0.5 * back); e.g.rotation.x = -0.5 * back; }
        const lk = clamp(ps.lick ?? 0); lickG.visible = lk > 0.01 && lk < 0.99; lickG.rotation.set(-0.15, (lk - 0.5) * 2.2, 0); lickG.scale.set(1, 1, Math.sin(Math.PI * lk) + 0.001);
        face.apply(ps);
        legs.forEach((l, i) => {
          const d = l.d, H = [hips[i][0], hips[i][1] + dip, hips[i][2]], sole = foot[i], hockY = sole[1] + d.fh, A = d.hock === 0 ? [l.x, hockY, sole[2]] : [l.x, hockY, sole[2] + d.hock], K = ik2(H, A, d.L1, d.L2, d.bend);
          l.geo.userData.set(legPts(d, H, K, sole).map((p, k) => mkSec(p, ...d.rows[k], 2.6)));
          l.claws.position.set(...sole);
        });
        drool.apply(clamp(ps.drool ?? 0), tt, hang(qP, qHead, qX(0.85 * jw)));
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
