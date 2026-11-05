import * as THREE from "three";
import { clamp } from "./util.js";

// Props for "Never Looks Up" episode 3, the alien abduction (4 Nov 2026; Jonny's 8-panel board in
// /mnt/project-files/NEVER-LOOKS-UP-STORYBOARDS.zip 03-alien-abduction): stargazing in a back garden at night.
// Only existing propState keys are used (props3d.js propState), so nothing new needs a default.
//   flyingsaucer      a round silver flying saucer (no markings): origin at the middle of its rim, spec.r its radius (1.0).
//               A glass cupola on top, a band of warm amber lights round the rim, a sloped lower skirt and a round
//               green lens in the middle of its flat underside (the beam comes out of it). The hatch is a round iris in
//               the underside on its +z side, SAUCER.hatch.r from the middle (rot turns it): the alien rides a lift disc
//               down out of it (beanalien drop). State: lit 0..1 (rim lights), spin (turns of the light chase), glow 0..1 (the beam: one
//               translucent green-white cone from the lens to the ground at y 0 with sparkles rising up it and a bright
//               pool on the grass), open 0..1 (the iris blades slide back and the warm inside shows), wobble 0..1 (the
//               hover bob and sway), tilt / tip (bank; the beam stays on the lens).
//   beanalien   a small green bean with big glossy eyes, a leaf sprout, blush and the cast's black mitten gloves, standing
//               on a small lift disc. Origin: the hatch (place it at the saucer's hatch, SAUCER.hatch); drop (metres) lowers
//               the disc and the alien out of the hatch on a warm light column, feet first; at drop 0 it is inside the
//               saucer (hidden). State: lean (degrees forward about its feet), arms 0..1 (0 hands on the hatch
//               rim, 1 both mittens waving up), wobble 0..1 (the waving), gap 0..1 (a small glowing gift in both
//               mittens held out in front; 0 = no gift), happy -1..1 (1 beaming with the mouth open, 0 a small smile,
//               -1 offended: lids half down, chin up, a pout), jaw 0..1 (mouth open on top of happy), blink 0..1,
//               brow -1..1, lookX / lookY -1..1 (the pupils), glow 0..1 (the gift's glow).
//   lawnchair   a folding aluminium lawn chair with green-and-white webbing, facing +z; "sit" works on it (seat at
//               SEAT_Y 0.42). State: tilt / tip / spin to tumble it.
//   telescope   a white refractor on a black tripod (origin: the tripod's foot centre). spec.aim [yaw, pitch] in
//               degrees (0, 0 = level toward +z; + pitch up). The eyepiece is at TELESCOPE.eye.
//   popcornbowl a red-and-white striped popcorn bowl heaped with popcorn (origin: its foot). puff 0..1 makes the top
//               kernels jump out and fall back; fill 0..1 the heap (0 = empty).
//   popcorn     loose popcorn (spec.n kernels): burst 0..1 throws them from the origin out to their spots on the ground
//               round spec.to ([dx, dz] from the origin, default [0, 0]) within spec.spread metres; they stay there.
//   picnicblanket a red-and-cream gingham blanket lying on the grass (origin: its middle; spec.w along x, spec.d along z).
// The beam, its sparkles, the pool, the rim lights and the gift's glow are see-through for the checks (userData.steam).
export const SAUCER = { r: 1.0, lens: -0.215, lensR: 0.24, bottom: -0.21, hatch: { az: 0, r: 0.62, R: 0.2 } };
export const TELESCOPE = { eye: [0, 0.92, -0.32] };

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const glowy = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const ell = (rx, ry, rz, seg = 28) => { const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)); g.scale(rx, ry, rz); return g; };
const rad = (d) => (d * Math.PI) / 180;
const tube = (a, b, r, m, parent, seg = 8) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), o = mesh(new THREE.CylinderGeometry(r, r, d.length(), seg), m, parent);
  o.position.copy(A).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return o;
};
let DOT = null;   // a soft round light for sparkles and glows
const dotTex = () => (DOT ||= canvasTex(64, 64, (g) => {
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.25, "rgba(255,255,255,0.85)"); r.addColorStop(0.55, "rgba(255,255,255,0.25)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
}));
function spark(parent, color, size, opacity = 1) {
  const m = new THREE.SpriteMaterial({ map: dotTex(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  m.userData.noOutline = true;
  const s = new THREE.Sprite(m); s.scale.setScalar(size); glowy(s, 5); parent.add(s); return s;
}
const noLine = (m) => { m.userData.noOutline = true; return m; };

// a gift box with a bow (shared by the alien's hands): 0.15 m cube, gold paper, cream ribbon
function giftMesh(parent) {
  const g = new THREE.Group(); parent.add(g);
  const paper = mat("#f2c63c", { roughness: 0.4, emissive: "#6a4a00", emissiveIntensity: 0.4 }), band = mat("#fff4d6", { roughness: 0.35 });
  const S = 0.15;
  mesh(new THREE.BoxGeometry(S, S, S), paper, g, 0, 0, 0);
  mesh(new THREE.BoxGeometry(S + 0.004, S + 0.004, 0.03), band, g);
  mesh(new THREE.BoxGeometry(0.03, S + 0.004, S + 0.004), band, g);
  for (const s of [-1, 1]) { const l = mesh(new THREE.TorusGeometry(0.035, 0.011, 8, 18), band, g, s * 0.03, S / 2 + 0.025, 0); l.rotation.set(0, Math.PI / 2, s * 0.6); l.scale.set(1, 0.75, 1); }
  const halo = spark(g, "#fff1a8", 0.7, 0.6);
  return { g, halo };
}

export const UFO_KINDS = {
  flyingsaucer(P) {
    const S = P.spec, R = S.r ?? SAUCER.r, k = R / SAUCER.r;
    const root = new THREE.Group(); root.scale.setScalar(k); P.whole.add(root);
    const hull = new THREE.Group(); root.add(hull);
    const silver = mat("#c9d0da", { roughness: 0.32, metalness: 0.55 }), darker = mat("#8e98a8", { roughness: 0.4, metalness: 0.5 });
    const panel = mat("#aab3c1", { roughness: 0.35, metalness: 0.5 });
    // upper hull: a flattened dome; a teal glass cupola on top
    const top = mesh(new THREE.SphereGeometry(1, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2), silver, hull); top.scale.set(SAUCER.r, 0.36, SAUCER.r);
    mesh(new THREE.TorusGeometry(SAUCER.r * 0.62, 0.012, 6, 64), darker, hull, 0, 0.24, 0).rotation.x = Math.PI / 2;   // a panel seam
    const cup = mesh(new THREE.SphereGeometry(0.36, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), mat("#9fe3e0", { roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.82 }), hull, 0, 0.3, 0);
    cup.scale.y = 0.85; cup.castShadow = false;
    mesh(new THREE.TorusGeometry(0.37, 0.025, 8, 40), darker, hull, 0, 0.305, 0).rotation.x = Math.PI / 2;
    // the rim band
    mesh(new THREE.TorusGeometry(SAUCER.r, 0.055, 12, 96), panel, hull, 0, 0, 0).rotation.x = Math.PI / 2;
    // lower skirt: a sloped ring from the rim down to the flat underside; the underside is a disc with a round hole for the
    // hatch (its frame ring covers the edge); the lens the beam comes out of sits in its middle
    const H = SAUCER.hatch, B = SAUCER.bottom, hx = Math.sin(rad(H.az)) * H.r, hz = Math.cos(rad(H.az)) * H.r;
    const prof = [[SAUCER.r, 0], [0.97, -0.07], [0.92, -0.14], [0.88, -0.19], [0.86, B]].map(([x, y]) => new THREE.Vector2(x, y));
    const skirt = mesh(new THREE.LatheGeometry(new THREE.SplineCurve(prof).getPoints(24), 128), silver.clone(), hull); skirt.material.side = THREE.DoubleSide;
    const disc = new THREE.Shape(); disc.absarc(0, 0, 0.865, 0, Math.PI * 2, false);
    const hole = new THREE.Path(); hole.absarc(hx, -hz, H.R, 0, Math.PI * 2, true); disc.holes.push(hole);
    const under = mesh(new THREE.ShapeGeometry(disc, 64), darker.clone(), hull, 0, B, 0); under.rotation.x = Math.PI / 2; under.material.side = THREE.DoubleSide;
    mesh(new THREE.TorusGeometry(0.62, 0.012, 6, 64), panel, hull, 0, B - 0.004, 0).rotation.x = Math.PI / 2;
    // the lens the beam comes out of
    const lensM = noLine(new THREE.MeshBasicMaterial({ color: "#bfffd0" }));
    const lens = mesh(new THREE.CircleGeometry(SAUCER.lensR, 40), lensM, hull, 0, SAUCER.lens, 0); lens.rotation.x = Math.PI / 2; lens.castShadow = false;
    const lensRing = mesh(new THREE.TorusGeometry(SAUCER.lensR + 0.02, 0.022, 8, 40), darker, hull, 0, SAUCER.lens + 0.004, 0); lensRing.rotation.x = Math.PI / 2;
    // the rim lights: twelve warm amber lamps round the band
    const lampOn = noLine(new THREE.MeshBasicMaterial({ color: "#ffc45c" })), lampOff = mat("#6b5a3a", { roughness: 0.5 });
    const lamps = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.13, x = Math.sin(a) * (SAUCER.r + 0.05), z = Math.cos(a) * (SAUCER.r + 0.05);
      const l = mesh(new THREE.SphereGeometry(0.045, 12, 8), lampOn, hull, x, 0, z); l.scale.set(1.5, 0.8, 1.5); l.castShadow = false;
      const h = spark(hull, "#ffb347", 0.42, 0.75); h.position.set(x * 1.02, 0, z * 1.02);
      lamps.push({ l, h, a });
    }
    // the hatch: a frame ring in the underside, the warm inside above it and six iris blades that slide back into the frame
    const hatch = new THREE.Group(); hatch.position.set(hx, B - 0.006, hz); hatch.rotation.x = Math.PI / 2; hull.add(hatch);   // its +z faces down
    mesh(new THREE.TorusGeometry(H.R, 0.026, 10, 48), darker, hatch, 0, 0, 0.004);
    const warmM = noLine(new THREE.MeshBasicMaterial({ color: "#ffd892", side: THREE.BackSide }));
    const cave = mesh(new THREE.CylinderGeometry(H.R * 0.98, H.R * 0.98, 0.4, 32, 1, true), warmM, hatch, 0, 0, -0.2); cave.rotation.x = Math.PI / 2; cave.castShadow = false;
    const caveTop = mesh(new THREE.CircleGeometry(H.R, 32), noLine(new THREE.MeshBasicMaterial({ color: "#ffe9b8" })), hatch, 0, 0, -0.39); caveTop.castShadow = false;
    const caveGlow = spark(hatch, "#ffcf7a", H.R * 3.2, 0); caveGlow.position.z = 0.05;
    const bladeM = mat("#b9c1cd", { roughness: 0.3, metalness: 0.55, side: THREE.DoubleSide });
    const blades = [];
    for (let i = 0; i < 6; i++) {
      const sh = new THREE.Shape(); const a0 = (i / 6) * Math.PI * 2, a1 = ((i + 1.25) / 6) * Math.PI * 2;
      sh.moveTo(0, 0); for (let j = 0; j <= 8; j++) { const a = a0 + ((a1 - a0) * j) / 8; sh.lineTo(Math.cos(a) * H.R * 1.02, Math.sin(a) * H.R * 1.02); } sh.lineTo(0, 0);
      const pv = new THREE.Group(); hatch.add(pv);
      const b = mesh(new THREE.ShapeGeometry(sh, 2), bladeM, pv, 0, 0, 0.006 + i * 0.0015); b.castShadow = false;
      blades.push({ pv, b, a: (a0 + a1) / 2 });
    }
    // the beam: one open cone from the lens to the ground, brighter at the top, sparkles rising inside it, a pool below
    const beamTex = canvasTex(16, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(220,255,225,0.95)"); gr.addColorStop(0.5, "rgba(150,255,170,0.55)"); gr.addColorStop(1, "rgba(120,255,150,0.38)");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    // (normal blending: the beam tints what is inside it without turning dark lines and eyes green)
    // (only the cone's far wall is drawn, so whoever is inside the beam stands in front of its glow, untinted)
    const beamM = noLine(new THREE.MeshBasicMaterial({ map: beamTex, color: "#9dffb0", transparent: true, opacity: 0, depthWrite: false, side: THREE.BackSide }));
    const beam = glowy(new THREE.Mesh(new THREE.CylinderGeometry(SAUCER.lensR, S.beamR ?? 0.95, 1, 48, 1, true), beamM), 4); root.add(beam);
    const coreM = noLine(new THREE.MeshBasicMaterial({ map: beamTex, color: "#e8fff0", transparent: true, opacity: 0, depthWrite: false, side: THREE.BackSide }));
    const core = glowy(new THREE.Mesh(new THREE.CylinderGeometry(SAUCER.lensR * 0.6, (S.beamR ?? 0.95) * 0.55, 1, 32, 1, true), coreM), 4); root.add(core);
    const poolTex = canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.6, "rgba(255,255,255,0.7)"); r.addColorStop(0.85, "rgba(255,255,255,0.25)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
    const poolM = noLine(new THREE.MeshBasicMaterial({ map: poolTex, color: "#7dff9a", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    const pool = glowy(new THREE.Mesh(new THREE.CircleGeometry((S.beamR ?? 0.95) * 1.25, 48), poolM), 2); pool.rotation.x = -Math.PI / 2; root.add(pool);
    const sparks = Array.from({ length: 36 }, (_, i) => ({ s: spark(root, i % 3 ? "#d8ffe0" : "#ffffff", 0.05 + rnd(i) * 0.05, 0), a: rnd(i + 40) * Math.PI * 2, r: Math.sqrt(rnd(i + 80)), ph: rnd(i + 120), sp: 0.25 + rnd(i + 160) * 0.2 }));
    const lensGlow = spark(root, "#b8ffc8", 1.1, 0); lensGlow.position.y = SAUCER.lens - 0.04;
    return {
      grip: 0,
      apply(ps, t = 0) {
        const lit = clamp(ps.lit), w = clamp(ps.wobble), o = clamp(ps.open), gl = clamp(ps.glow);
        hull.position.y = w * 0.035 * Math.sin(t * 2.6);
        hull.rotation.set(w * 0.025 * Math.sin(t * 1.7 + 0.4), 0, w * 0.03 * Math.sin(t * 2.1));
        lamps.forEach(({ l, h, a }, i) => {
          const chase = 0.65 + 0.35 * Math.cos(a * 3 - (ps.spin ?? 0) * Math.PI * 2);
          l.material = lit > 0.5 ? lampOn : lampOff; h.visible = lit > 0.01; h.material.opacity = 0.75 * lit * chase;
        });
        blades.forEach(({ pv, b, a }) => { pv.position.set(Math.cos(a) * H.R * 0.95 * o, Math.sin(a) * H.R * 0.95 * o, 0); b.scale.setScalar(1 - 0.75 * o); b.visible = o < 0.99; });
        cave.visible = caveTop.visible = o > 0.01; caveGlow.material.opacity = 0.55 * o;
        // the beam reaches the ground under the lens whatever the saucer's height (world y 0); the saucer's tilt is small
        const sc = P.whole.scale.y || 1, y0 = (ps.y ?? 0) / (sc * k) + hull.position.y, L = Math.max(0.05, y0 + SAUCER.lens);
        for (const m of [beam, core]) { m.scale.set(1, L, 1); m.position.y = SAUCER.lens - L / 2 + hull.position.y; }
        beamM.opacity = 0.5 * gl; coreM.opacity = 0.25 * gl; pool.position.y = -y0 + 0.012 + hull.position.y; poolM.opacity = 0.85 * gl;
        lensM.color.set(gl > 0.05 ? "#e6fff0" : "#6f8f7c"); lensGlow.material.opacity = 0.9 * gl;
        const bR = S.beamR ?? 0.95;
        for (const s of sparks) {
          const u = (s.ph + t * s.sp) % 1, y = -y0 + 0.05 + u * (L - 0.1), rr = (SAUCER.lensR + (bR - SAUCER.lensR) * (1 - u)) * 0.85 * s.r;
          s.s.position.set(Math.cos(s.a + u * 2) * rr, y + hull.position.y, Math.sin(s.a + u * 2) * rr);
          s.s.material.opacity = gl * Math.sin(Math.PI * u) * 0.95;
        }
      },
    };
  },

  beanalien(P) {
    const S = P.spec;
    const skin = mat("#9ed34a", { roughness: 0.6 }), belly = mat("#c8ea7c", { roughness: 0.6 }), leaf = mat("#5fae2e", { roughness: 0.6 });
    const glove = mat("#1d1b22", { roughness: 0.55 }), white = noLine(new THREE.MeshBasicMaterial({ color: "#ffffff" }));
    const irisM = noLine(new THREE.MeshBasicMaterial({ color: "#3a2414" })), pupM = noLine(new THREE.MeshBasicMaterial({ color: "#0d0907" }));
    const mouthM = mat("#6a1f2a", { roughness: 0.6 }), tongueM = mat("#f07a8a", { roughness: 0.5 }), blushM = noLine(new THREE.MeshBasicMaterial({ color: "#ff8c8c", transparent: true, opacity: 0.75 }));
    const lineM = noLine(new THREE.MeshBasicMaterial({ color: "#2c3a12" }));
    const hip = new THREE.Group(); P.whole.add(hip);
    const lift = new THREE.Group(); hip.add(lift);
    const body = new THREE.Group(); lift.add(body);
    // the lift: a small silver disc under its feet on a warm column of light from the hatch
    const discM = mat("#c9d0da", { roughness: 0.3, metalness: 0.5 });
    const liftDisc = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 32), discM, lift, 0, -0.015, 0);
    const ringM = noLine(new THREE.MeshBasicMaterial({ color: "#ffd27a" }));
    mesh(new THREE.TorusGeometry(0.2, 0.01, 6, 32), ringM, lift, 0, -0.015, 0).rotation.x = Math.PI / 2;
    const colM = noLine(new THREE.MeshBasicMaterial({ color: "#ffd892", transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide }));
    const column = glowy(new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.2, 1, 24, 1, true), colM), 4); hip.add(column);
    // the bean: a soft capsule (0.56 m), a lighter belly
    const bean = mesh(new THREE.CapsuleGeometry(0.19, 0.18, 10, 28), skin, body, 0, 0.28, 0); bean.scale.set(1, 1, 0.92);
    mesh(ell(0.14, 0.16, 0.06), belly, body, 0, 0.17, 0.13);
    // the face on +z, high on the bean: big glossy eyes (the cast's look, bigger)
    const face = new THREE.Group(); face.position.set(0, 0.34, 0.15); body.add(face);
    const eyes = [-1, 1].map((s) => {
      const g = new THREE.Group(); g.position.set(s * 0.078, 0.025, 0.02); g.rotation.y = s * 0.3; face.add(g);
      const w = mesh(ell(0.068, 0.082, 0.032), white, g); w.castShadow = false;
      const pup = new THREE.Group(); g.add(pup);
      const ir = mesh(new THREE.CircleGeometry(0.052, 28), irisM, pup, 0, -0.006, 0.033); ir.scale.y = 1.12;
      mesh(new THREE.CircleGeometry(0.031, 24), pupM, pup, 0, -0.006, 0.0335);
      mesh(new THREE.CircleGeometry(0.017, 16), white, pup, 0.017, 0.02, 0.034);
      mesh(new THREE.CircleGeometry(0.008, 12), white, pup, -0.017, -0.024, 0.034);
      // the upper lid: a skin cap that comes down over the eye
      // (a top cap: rotated -90 deg about x it hides behind the eye, at 0 it covers the top half, at +90 all of it)
      const lidPivot = new THREE.Group(); g.add(lidPivot);
      const lid = mesh(new THREE.SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), skin, lidPivot); lid.scale.set(0.074, 0.088, 0.038);
      const brow = mesh(new THREE.CapsuleGeometry(0.009, 0.045, 4, 8), lineM, face, s * 0.08, 0.13, 0.045); brow.rotation.z = Math.PI / 2;
      return { g, pup, lidPivot, brow, s };
    });
    for (const s of [-1, 1]) { const b = mesh(new THREE.CircleGeometry(0.032, 20), blushM, face, s * 0.13, -0.06, 0.035); b.scale.y = 0.6; b.rotation.y = s * 0.45; b.castShadow = false; }
    // mouth: an open smile (a dark half-disc with a tongue) or a closed line; the pout for "hmph"
    const mouth = new THREE.Group(); mouth.position.set(0, -0.085, 0.04); face.add(mouth);
    const open = new THREE.Group(); mouth.add(open);
    const smileSh = new THREE.Shape(); smileSh.moveTo(-0.045, 0); smileSh.quadraticCurveTo(0, -0.07, 0.045, 0); smileSh.quadraticCurveTo(0, -0.008, -0.045, 0);
    mesh(new THREE.ShapeGeometry(smileSh, 12), mouthM, open).castShadow = false;
    const tg = mesh(new THREE.CircleGeometry(0.018, 16), tongueM, open, 0, -0.03, 0.001); tg.scale.x = 1.4; tg.castShadow = false;
    const line = mesh(new THREE.TorusGeometry(0.03, 0.004, 6, 16, Math.PI), lineM, mouth, 0, 0.01, 0.002); line.rotation.z = Math.PI;
    const pout = mesh(ell(0.016, 0.01, 0.01, 12), mouthM, mouth, 0, -0.005, 0.002);
    // the sprout: a short stem with two leaves on top
    const sprout = new THREE.Group(); sprout.position.set(0, 0.55, 0); body.add(sprout);
    tube([0, 0, 0], [0, 0.07, 0], 0.01, leaf, sprout);
    for (const s of [-1, 1]) { const l = mesh(ell(0.045, 0.012, 0.022, 14), leaf, sprout, s * 0.04, 0.085, 0); l.rotation.z = s * 0.45; }
    // arms: short green arms with black mittens (three fingers and a thumb as one mitten shape)
    const arms = [-1, 1].map((s) => {
      const sh = new THREE.Group(); sh.position.set(s * 0.185, 0.22, 0.02); body.add(sh);
      const up = mesh(new THREE.CapsuleGeometry(0.03, 0.12, 6, 12), skin, sh, 0, -0.08, 0);
      const hand = new THREE.Group(); hand.position.set(0, -0.18, 0); sh.add(hand);
      mesh(ell(0.05, 0.055, 0.04, 16), glove, hand);
      const th = mesh(ell(0.018, 0.03, 0.018, 10), glove, hand, -s * 0.04, 0.02, 0.012); th.rotation.z = s * 0.6;
      mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 16), glove, hand, 0, 0.045, 0).rotation.x = Math.PI / 2;   // the cuff
      return { sh, up, hand, s };
    });
    const gift = giftMesh(body); gift.g.position.set(0, 0.12, 0.28);
    return {
      grip: 0.3,
      apply(ps, t = 0) {
        const drop = Math.max(0, ps.drop ?? 0), happy = clamp(ps.happy ?? 0, -1, 1), wv = clamp(ps.wobble), arm = clamp(ps.arms), gp = clamp(ps.gap);
        hip.visible = drop > 0.03;
        lift.position.y = -drop;
        column.scale.set(1, Math.max(0.01, drop), 1); column.position.y = -drop / 2;
        body.rotation.x = rad(ps.lean ?? 0) + (happy < 0 ? -0.12 * -happy : 0);   // chin up when offended
        body.rotation.z = wv * 0.08 * Math.sin(t * 9);
        // arms: rim (down and forward) -> waving up; the gift pulls both forward and together
        arms.forEach(({ sh, s }) => {
          const wave = wv * 0.35 * Math.sin(t * 12 + (s > 0 ? 0 : 1.6));
          const down = [-1.1, 0, s * 0.25], upP = [-0.3, 0, s * (2.4 + wave)], giftP = [-1.25, -s * 0.55, s * 0.55];
          let r = down.map((v, i) => v + (upP[i] - v) * arm);
          r = r.map((v, i) => v + (giftP[i] - v) * gp);
          sh.rotation.set(r[0], r[1], r[2]);
        });
        gift.g.visible = gp > 0.02; gift.g.scale.setScalar(0.4 + 0.6 * gp); gift.g.position.set(0, 0.12 + 0.03 * gp, 0.14 + 0.17 * gp);
        gift.halo.material.opacity = 0.65 * clamp(ps.glow ?? 1) * gp * (0.85 + 0.15 * Math.sin(t * 5));
        // face
        const blink = clamp(ps.blink), sulk = Math.max(0, -happy), lidK = Math.max(blink, 0.5 * sulk);
        eyes.forEach(({ pup, lidPivot, brow, s }) => {
          pup.position.set(clamp(ps.lookX ?? 0, -1, 1) * 0.016, clamp(ps.lookY ?? 0, -1, 1) * 0.016, 0);
          lidPivot.rotation.x = -Math.PI / 2 + Math.PI * lidK;
          lidPivot.children[0].visible = lidK > 0.02;
          const b = clamp(ps.brow ?? 0, -1, 1) - 0.6 * sulk;
          brow.position.y = 0.105 + 0.015 * Math.max(0, b) + 0.004 * happy;
          brow.rotation.z = Math.PI / 2 + s * (-0.35 * b);
        });
        const j = clamp((ps.jaw ?? 0) + Math.max(0, happy - 0.3) * 1.2);
        open.visible = j > 0.05 && sulk < 0.3; open.scale.set(1, 0.4 + 0.8 * j, 1);
        line.visible = !open.visible && sulk < 0.3; pout.visible = sulk >= 0.3;
        pout.scale.set(1 - 0.3 * sulk, 1 + 0.2 * sulk, 1);
      },
    };
  },

  lawnchair(P) {
    const S = P.spec, alu = mat("#c7ccd3", { roughness: 0.35, metalness: 0.5 });
    const web = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = S.stripe ?? "#f4f1e6"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 8; i += 2) { g.fillStyle = S.color ?? "#3f9a4f"; g.fillRect((i * w) / 8, 0, w / 8, h); }
      for (let i = 0; i < 8; i += 2) { g.fillStyle = "rgba(30,90,40,0.35)"; g.fillRect(0, (i * h) / 8, w, h / 8); }
    });
    const cloth = new THREE.MeshStandardMaterial({ map: web, roughness: 0.85, side: THREE.DoubleSide });
    const W = 0.52, SY = 0.4;
    // the frame: two side loops (front legs up to the arm rests, back legs), the seat rails, the back's two uprights
    for (const s of [-1, 1]) {
      const x = s * W / 2;
      tube([x, 0, 0.24], [x, SY, 0.2], 0.014, alu, P.whole);             // front leg
      tube([x, 0, -0.26], [x, SY, -0.16], 0.014, alu, P.whole);          // back leg
      tube([x, SY, 0.22], [x, SY, -0.2], 0.014, alu, P.whole);           // seat rail
      tube([x, SY, -0.2], [x, 0.92, -0.38], 0.014, alu, P.whole);        // back upright
      // the arm rest and its post sit back from the seat's front edge, so a hand can reach a sitter's feet past them
      tube([x, 0.6, 0.04], [x, 0.62, -0.27], 0.016, alu, P.whole);      // arm rest
      tube([x, SY, 0.02], [x, 0.6, 0.04], 0.012, alu, P.whole);          // arm post
    }
    tube([-W / 2, 0.92, -0.38], [W / 2, 0.92, -0.38], 0.014, alu, P.whole);
    tube([-W / 2, SY, 0.22], [W / 2, SY, 0.22], 0.014, alu, P.whole);
    // the webbing: seat (a slight sag) and back
    const seat = new THREE.PlaneGeometry(W - 0.02, 0.44, 8, 8), sp = seat.attributes.position;
    for (let i = 0; i < sp.count; i++) { const x = sp.getX(i), y = sp.getY(i); sp.setXYZ(i, x, SY + 0.005 - 0.025 * (1 - (2 * x / W) ** 2) * (1 - (2 * y / 0.44) ** 2), -y); }
    seat.computeVertexNormals(); mesh(seat, cloth, P.whole, 0, 0, 0.01);
    const back = mesh(new THREE.PlaneGeometry(W - 0.02, 0.5, 2, 2), cloth, P.whole, 0, 0.67, -0.3); back.rotation.x = -0.35;
    return { grip: 0.6 };
  },

  telescope(P) {
    const S = P.spec, black = mat("#25272d", { roughness: 0.5 }), white = mat("#eef0f2", { roughness: 0.35 }), brass = mat("#c99a3b", { roughness: 0.35, metalness: 0.4 });
    const head = [0, 0.78, 0];
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5; tube([Math.sin(a) * 0.3, 0, Math.cos(a) * 0.3], head, 0.014, black, P.whole); }
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 16), black, P.whole, ...head);
    const tubeG = new THREE.Group(); tubeG.position.set(head[0], head[1] + 0.07, head[2]); tubeG.rotation.order = "YXZ";
    const [yaw, pitch] = S.aim || [0, 30]; tubeG.rotation.set(-rad(pitch), rad(yaw), 0); P.whole.add(tubeG);
    const t1 = mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.72, 24), white, tubeG, 0, 0, 0.1); t1.rotation.x = Math.PI / 2;
    const dew = mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.12, 24), white, tubeG, 0, 0, 0.5); dew.rotation.x = Math.PI / 2;
    mesh(new THREE.TorusGeometry(0.07, 0.01, 6, 24), brass, tubeG, 0, 0, 0.56);
    const lensM = noLine(new THREE.MeshBasicMaterial({ color: "#5a8fc0" })); mesh(new THREE.CircleGeometry(0.062, 24), lensM, tubeG, 0, 0, 0.555);
    const ep = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.1, 12), black, tubeG, 0, 0, -0.3); ep.rotation.x = Math.PI / 2;
    const finder = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 12), black, tubeG, 0, 0.085, 0.1); finder.rotation.x = Math.PI / 2;
    return { grip: 0.78 };
  },

  popcornbowl(P) {
    const S = P.spec;
    const stripes = canvasTex(256, 64, (g, w, h) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "#f6efe2" : "#d63a3a"; g.fillRect((i * w) / 16, 0, w / 16 + 1, h); } });
    const china = new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.5, side: THREE.DoubleSide }), inner = mat("#f3e6cf", { roughness: 0.5, side: THREE.DoubleSide });
    const RIM = 0.088, prof = [[0.062, 0], [0.066, 0.006], [0.062, 0.013], [0.092, 0.02], [0.128, 0.046], [0.146, 0.074], [0.15, RIM]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh(new THREE.LatheGeometry(prof, 48), china, P.whole);
    mesh(new THREE.CircleGeometry(0.062, 24), inner, P.whole, 0, 0.002, 0).rotation.x = -Math.PI / 2;
    const rimT = mesh(new THREE.TorusGeometry(0.15, 0.006, 6, 48), inner, P.whole, 0, RIM, 0); rimT.rotation.x = Math.PI / 2;
    const heap = new THREE.Group(); P.whole.add(heap);
    const kM = mat("#fff6dc", { roughness: 0.75 }), kY = mat("#f3d27a", { roughness: 0.7 });
    const kernels = [];
    for (let i = 0; i < 46; i++) {
      const a = rnd(i) * Math.PI * 2, r = Math.sqrt(rnd(i + 50)) * 0.13, y = 0.05 + 0.06 * (1 - (r / 0.14) ** 2) + rnd(i + 99) * 0.02;
      const k = mesh(new THREE.IcosahedronGeometry(0.02 + rnd(i + 7) * 0.008, 0), i % 5 ? kM : kY, heap, Math.cos(a) * r, y, Math.sin(a) * r);
      k.rotation.set(rnd(i + 3) * 3, rnd(i + 4) * 3, 0); k.castShadow = false;
      kernels.push({ k, y, top: y > 0.085, ph: rnd(i + 11) });
    }
    return {
      grip: RIM,
      apply(ps) {
        const f = clamp(ps.fill), pf = clamp(ps.puff);
        heap.visible = f > 0.02; heap.scale.set(1, f, 1);
        for (const k of kernels) k.k.position.y = k.y + (k.top ? pf * (0.08 + 0.12 * k.ph) * Math.sin(Math.PI * Math.min(1, pf * 1.0)) : 0);
      },
    };
  },

  popcorn(P) {
    const S = P.spec, n = S.n ?? 14, to = S.to || [0, 0], spread = S.spread ?? 0.4;
    const kM = mat("#fff6dc", { roughness: 0.75 }), kY = mat("#f3d27a", { roughness: 0.7 });
    const ks = Array.from({ length: n }, (_, i) => {
      const k = glowy(mesh(new THREE.IcosahedronGeometry(0.022 + rnd(i + 7) * 0.008, 0), i % 4 ? kM : kY, P.whole), 0);   // loose popcorn: nothing a hand or robe catches on
      const a = rnd(i + 21) * Math.PI * 2, r = Math.sqrt(rnd(i + 31)) * spread;
      return { k, end: [to[0] + Math.cos(a) * r, 0.018, to[1] + Math.sin(a) * r], h: 0.15 + rnd(i + 41) * 0.25, d: rnd(i + 51) * 0.25 };
    });
    return {
      grip: 0,
      apply(ps) {
        const b = clamp(ps.burst);
        for (const { k, end, h, d } of ks) {
          const u = clamp((b - d * 0.4) / (1 - d * 0.4));
          k.visible = b > 0.001;
          k.position.set(end[0] * u, (1 - u) * 0 + end[1] * u + 4 * h * u * (1 - u), end[2] * u);
          k.rotation.set(u * 6 + d, u * 4, 0);
        }
      },
    };
  },

  picnicblanket(P) {
    const S = P.spec, W = S.w ?? 1.6, D = S.d ?? 1.2;
    const tex = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = S.base ?? "#f1e3d0"; g.fillRect(0, 0, w, h);
      g.fillStyle = S.color ?? "rgba(196,62,78,0.55)";
      for (let i = 0; i < 8; i += 2) { g.fillRect((i * w) / 8, 0, w / 8, h); g.fillRect(0, (i * h) / 8, w, h / 8); }
    });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(W * 1.6, D * 1.6);
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, side: THREE.DoubleSide });
    const geo = new THREE.PlaneGeometry(W, D, 24, 18), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setXYZ(i, x, 0.008 + 0.012 * Math.max(0, Math.sin(x * 5.3 + y * 2.1)) * (Math.abs(x) > W * 0.42 || Math.abs(y) > D * 0.42 ? 1 : 0.3), -y); }
    geo.computeVertexNormals();
    const b = mesh(geo, m, P.whole); b.castShadow = false;
    return { grip: 0 };
  },
};
