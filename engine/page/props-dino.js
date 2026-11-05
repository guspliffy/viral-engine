import * as THREE from "three";
import { clamp } from "./util.js";
import { TREX } from "../shared/trex-rig.js";

// Props for "Never Looks Up" episode 1, the T-rex (4 Nov 2026; Jonny's 8-panel board in
// /mnt/project-files/NEVER-LOOKS-UP-STORYBOARDS.zip 01-dinosaur): a campfire in a prehistoric fern valley.
//   trex       a chunky cartoon T-rex (cute-menacing, never scary), facing +z at rot 0, origin on the ground between
//              its feet. Its joints come from engine/shared/trex-rig.js (the generator aims the snout with the same
//              numbers). State, all 0 at rest: lean (body pitch, deg), neckY / neckP / headY / headP / headR (deg),
//              jaw 0..1 (mouth open), sniff 0..1 (nostrils flare and the snout wrinkles: tween it up and down for each
//              snort), squint 0..1 (heavy upper lids), blink 0..1, brow -1..1 (- angry, + curious/raised), lookX /
//              lookY -1..1 (the pupils), wag 0..1 (the tail tip wags), curl 0..1 (the tail sweeps round its left side
//              along the ground: 1 = its tip in front of the T-rex), arms 0..1 (the tiny arms raised), breath 0..1
//              (the chest heaves), step 0..1 (the left foot lifts: a stomp is step 1 -> 0 on the contact frame).
//   firelog    a fallen log to sit on (spec.len, spec.r; seat height SEAT_Y 0.42 at r 0.21); spin (turns) rolls it.
//   campfire   a ring of stones round crossed sticks and cel-banded flames; lit 0..1 (set lit: 1 in the spec),
//              wobble -1..1 flattens the flames sideways along +x (the roar's wind from the right is -1), puff 0..1 a
//              burst of sparks.
//   mallowstick a thin green stick with up to three marshmallows near its tip (origin: its butt, grip "thin"); fall
//              0..1 hides the marshmallows on it (they jump off: a "mallows" prop takes over).
//   mallows    three loose marshmallows (origin: the middle of the cluster); burst 0..1 spreads them apart, spin
//              (turns) tumbles them.
//   mallowbag  an open red-and-white striped paper bag of marshmallows (origin: its bottom middle); spin (turns)
//              tumbles it in the air.
//   boulder    a big round mossy rock (spec.w, spec.h, spec.d, spec.seed).
//   ferns      a clump of big arching fern fronds (spec.n fronds, spec.len metres long, spec.seed, spec.color); they
//              sway; part 0..1 pushes them apart from spec.from ([x, z] in the prop's frame: where something comes through).
//   roarlines  white speed streaks blasting out along +z from the origin (a roar's wind); puff 0..1.
// Flames and sparks are see-through for the checks (userData.steam).
export const LOG = { r: 0.21 };

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const glowy = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const ell = (rx, ry, rz, seg = 28) => { const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)); g.scale(rx, ry, rz); return g; };
const rad = (d) => (d * Math.PI) / 180;

// green skin with darker speckles, lighter toward the belly (a sphere's v runs top to bottom)
let SKIN = null;
const skinTex = () => (SKIN ||= canvasTex(512, 256, (g, W, H) => {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#5f8f3a"); gr.addColorStop(0.45, "#7aa84a"); gr.addColorStop(0.75, "#a9c46a"); gr.addColorStop(1, "#e2d58e");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) {
    const x = rnd(i) * W, y = rnd(i + 500) * H * 0.62, r = 2 + rnd(i + 900) * 5;
    g.fillStyle = `rgba(52,86,34,${0.35 + 0.35 * rnd(i + 77)})`; g.beginPath(); g.ellipse(x, y, r * 1.3, r, rnd(i + 3) * 3, 0, Math.PI * 2); g.fill();
  }
}));
const skinMat = () => mat("#ffffff", { map: skinTex(), roughness: 0.75 });

export const DINO_KINDS = {
  trex(P) {
    const skin = skinMat(), green = mat("#76a447", { roughness: 0.75 }), dark = mat("#4f7d31", { roughness: 0.8 });
    const belly = mat("#e6d690", { roughness: 0.75 }), mouthM = mat("#7a2a34", { roughness: 0.6 }), tongueM = mat("#e0707e", { roughness: 0.55 });
    const toothM = mat("#fbf6e6", { roughness: 0.45 }), clawM = mat("#efe6cf", { roughness: 0.5 });
    const white = new THREE.MeshBasicMaterial({ color: "#fbfaf4" }), irisM = new THREE.MeshBasicMaterial({ color: "#7a4a1e" });
    const pupilM = new THREE.MeshBasicMaterial({ color: "#1a120c" }), glintM = new THREE.MeshBasicMaterial({ color: "#ffffff" });
    const root = new THREE.Group(); P.whole.add(root);

    // ---- legs (fixed under the hip; the left one can lift for a stomp)
    const legs = [-1, 1].map((s) => {
      const g = new THREE.Group(); g.position.set(s * 0.46, 1.2, -0.05); root.add(g);
      mesh(ell(0.36, 0.55, 0.5), skin, g, 0, 0.05, 0.05);                                     // thigh
      const shin = mesh(ell(0.17, 0.48, 0.2), green, g, 0, -0.62, -0.08); shin.rotation.x = -0.25;
      const foot = new THREE.Group(); foot.position.set(0, -1.12, 0.02); g.add(foot);
      mesh(ell(0.2, 0.09, 0.34), green, foot, 0, 0.0, 0.12);
      for (const k of [-1, 0, 1]) { const c = mesh(new THREE.ConeGeometry(0.045, 0.12, 8), clawM, foot, k * 0.1, -0.02, 0.44 - Math.abs(k) * 0.05); c.rotation.x = Math.PI / 2; }
      return { g, foot, s };
    });

    // ---- body at the hip
    const hip = new THREE.Group(); hip.position.set(...TREX.hip); hip.rotation.order = "YXZ"; root.add(hip);
    mesh(ell(0.8, 0.88, 1.15), skin, hip, 0, 0.32, 0.12);                                      // torso
    const bellyM = mesh(ell(0.62, 0.7, 0.6), belly, hip, 0, 0.12, 0.62);                       // belly plate
    bellyM.scale.z = 0.9;
    const chest = new THREE.Group(); chest.position.set(0, 0.42, 0.7); hip.add(chest);
    // tiny arms with two claws
    const arms = [-1, 1].map((s) => {
      const sh = new THREE.Group(); sh.position.set(s * 0.42, 0.0, 0.22); chest.add(sh);
      const up = mesh(ell(0.08, 0.17, 0.08), green, sh, 0, -0.12, 0.05); up.rotation.x = 0.6;
      const lo = new THREE.Group(); lo.position.set(0, -0.24, 0.14); sh.add(lo);
      mesh(ell(0.06, 0.06, 0.15), green, lo, 0, 0, 0.1);
      for (const k of [-1, 1]) { const c = mesh(new THREE.ConeGeometry(0.022, 0.08, 6), clawM, lo, k * 0.03, -0.02, 0.27); c.rotation.x = Math.PI / 2 + 0.5; }
      return { sh, s };
    });

    // ---- neck and head (the head is drawn at TREX.headScale: a big cartoon head on a thick neck)
    const neck = new THREE.Group(); neck.position.set(...TREX.neck); neck.rotation.order = "YXZ"; hip.add(neck);
    const nk = mesh(ell(0.5, 0.62, 0.52), skin, neck, 0, 0.18, 0.2); nk.rotation.x = -0.45;
    mesh(ell(0.4, 0.46, 0.36), belly, neck, 0, 0.0, 0.36);                                     // throat
    const head = new THREE.Group(); head.position.set(...TREX.head); head.rotation.order = "YXZ"; neck.add(head);
    const hd = new THREE.Group(); hd.scale.setScalar(TREX.headScale); head.add(hd);
    mesh(ell(0.42, 0.38, 0.5), skin, hd, 0, 0.14, 0.3);                                        // cranium
    const snout = mesh(ell(0.36, 0.25, 0.56), skin, hd, 0, 0.04, 0.68);                          // upper jaw
    mesh(ell(0.21, 0.05, 0.42), mouthM, hd, 0, -0.13, 0.68);                                    // the roof of the mouth (seen when open)
    // brow ridges: thick bumps over each eye that tilt for anger or curiosity
    const brows = [-1, 1].map((s) => { const b = mesh(ell(0.15, 0.05, 0.1), dark, hd, s * TREX.eye[0], TREX.eye[1] + 0.15, TREX.eye[2] - 0.02); b.rotation.order = "ZYX"; return { b, s }; });
    // nostrils
    const nostrils = [-1, 1].map((s) => { const n = mesh(ell(0.045, 0.026, 0.03), mat("#2e4a1e"), hd, s * 0.1, TREX.nose[1], TREX.nose[2] - 0.03); n.rotation.x = -0.6; return n; });
    // upper teeth: rounded, a few big ones along the jaw's lower edge (never sharp)
    for (const [x, z, h] of [[0.27, 0.5, 0.09], [0.27, 0.68, 0.12], [0.22, 0.88, 0.1], [0.12, 1.03, 0.08]]) for (const s of [-1, 1]) mesh(ell(0.042, h, 0.042, 12), toothM, hd, s * x, -0.18 - h * 0.4, z);
    // lower jaw on its hinge
    const jaw = new THREE.Group(); jaw.position.set(...TREX.jaw); hd.add(jaw);
    mesh(ell(0.33, 0.13, 0.52), belly, jaw, 0, -0.08, 0.48);
    mesh(ell(0.27, 0.05, 0.42), mouthM, jaw, 0, 0.0, 0.48);
    const tongue = mesh(ell(0.17, 0.05, 0.3), tongueM, jaw, 0, 0.03, 0.44);
    for (const [x, z, h] of [[0.25, 0.42, 0.07], [0.24, 0.62, 0.09], [0.17, 0.82, 0.07]]) for (const s of [-1, 1]) mesh(ell(0.036, h, 0.036, 12), toothM, jaw, s * x, 0.02 + h * 0.4, z);
    // eyes: big bulging whites with brown irises, black pupils and a glint; skin lids close from the top
    const eyes = [-1, 1].map((s) => {
      const g = new THREE.Group(); g.position.set(s * TREX.eye[0], TREX.eye[1], TREX.eye[2]); g.rotation.y = s * 0.3; hd.add(g);
      const R = TREX.eyeR;
      mesh(new THREE.SphereGeometry(R * 1.12, 24, 16), skin, g, 0, 0, -R * 0.25).castShadow = false;   // the socket bulge round it
      const w = new THREE.Mesh(new THREE.SphereGeometry(R, 28, 20), white); w.scale.set(1, 1.12, 0.9); g.add(w);
      const pup = new THREE.Group(); g.add(pup);
      const iris = new THREE.Mesh(new THREE.CircleGeometry(R * 0.62, 28), irisM); iris.position.z = R * 0.91; pup.add(iris);
      const pupil = new THREE.Mesh(new THREE.CircleGeometry(R * 0.36, 24), pupilM); pupil.position.z = R * 0.915; pup.add(pupil);
      const gl = new THREE.Mesh(new THREE.CircleGeometry(R * 0.14, 16), glintM); gl.position.set(R * 0.2, R * 0.24, R * 0.92); pup.add(gl);
      // the upper lid: a skin shell over the top of the eye that rotates down
      const lid = new THREE.Mesh(new THREE.SphereGeometry(R * 1.07, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), green); lid.scale.set(1, 1.12, 0.95);
      const lidP = new THREE.Group(); lidP.add(lid); g.add(lidP); lid.rotation.x = -Math.PI / 2;   // the dome toward -z; lidP turns it up and over
      lid.castShadow = false;
      return { g, pup, lidP, s };
    });

    // ---- tail: one smooth tube from the hip's back, curling round its left side along the ground at curl 1
    const tb = new THREE.Group(); tb.position.set(...TREX.tailBase); hip.add(tb);
    const NS = TREX.tailSegs, RING = 14, segL = TREX.tailLen / NS;
    const tgeo = new THREE.BufferGeometry(), tpos = new Float32Array((NS + 1) * RING * 3), tuv = new Float32Array((NS + 1) * RING * 2), tidx = [];
    for (let i = 0; i <= NS; i++) for (let j = 0; j < RING; j++) { tuv.set([j / (RING - 1), 0.15 + 0.7 * (j < RING / 2 ? j / (RING / 2) : 2 - j / (RING / 2)) * 0.5 + 0.3 * i / NS], (i * RING + j) * 2); if (i < NS) { const a = i * RING + j, b = i * RING + ((j + 1) % RING), c2 = a + RING, d = b + RING; tidx.push(a, c2, b, b, c2, d); } }
    tgeo.setAttribute("position", new THREE.BufferAttribute(tpos, 3)); tgeo.setAttribute("uv", new THREE.BufferAttribute(tuv, 2)); tgeo.setIndex(tidx);
    const tailMesh = mesh(tgeo, skin, tb, 0, 0, 0); tailMesh.frustumCulled = false;
    const tip = mesh(new THREE.SphereGeometry(0.06, 12, 8), skin, tb, 0, 0, 0);
    const tailRad = (k) => 0.52 * (1 - k) ** 1.15 + 0.06;
    function shapeTail(cu, tt, wg) {
      // walk the spine: start backward and down, every step turns toward +x by the curl (and sways), and flattens
      let x = 0, y = 0, z = 0, yaw = 0, pitch = -0.32 + 0.3 * cu;   // pitch - = down
      const pts = [];
      for (let i = 0; i <= NS; i++) {
        const k = i / NS;
        pts.push([x, y, z, yaw, pitch]);
        const w = Math.sin(tt * 2.4 - k * 4) * 0.035 + wg * Math.sin(tt * 11 - k * 5) * 0.12 * k;
        yaw += cu * 0.235 + w; pitch += (1 - cu) * 0.03 - cu * 0.0;
        // the spine heads along -z turned by yaw (toward +x) and pitch
        x += Math.sin(yaw) * Math.cos(pitch) * segL; z += -Math.cos(yaw) * Math.cos(pitch) * segL; y += Math.sin(pitch) * segL;
        // never below the ground (the hip sits TREX.hip[1] + tailBase[1] up)
        y = Math.max(y, -(TREX.hip[1] + TREX.tailBase[1]) + tailRad(Math.min(1, (i + 1) / NS)) * 0.9);
      }
      for (let i = 0; i <= NS; i++) {
        const [px, py, pz, yw] = pts[i], r = tailRad(i / NS);
        // ring perpendicular to the spine's heading: side = (cos yaw, 0, sin yaw), up = (0, 1, 0)
        const sx = Math.cos(yw), sz = Math.sin(yw);
        for (let j = 0; j < RING; j++) { const a = (j / RING) * Math.PI * 2, cx = Math.cos(a) * r, cy = Math.sin(a) * r * 0.9; tpos.set([px + sx * cx, py + cy, pz + sz * cx], (i * RING + j) * 3); }
      }
      tgeo.attributes.position.needsUpdate = true; tgeo.computeVertexNormals(); tgeo.computeBoundingSphere();
      tip.position.set(...pts[NS].slice(0, 3));
    }
    const base = { lean: 0 };
    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, br = 0.5 + 0.5 * clamp(ps.breath ?? 0);
        // idle: a slow breath and a little sway so it never freezes
        const sway = Math.sin(tt * 1.3) * 1.2, heave = Math.sin(tt * 2.2) * 0.012 * (1 + br);
        hip.rotation.set(rad((ps.lean ?? 0) + Math.sin(tt * 1.1) * 0.6), 0, 0);
        hip.position.y = TREX.hip[1] + heave;
        neck.rotation.set(rad(ps.neckP ?? 0), rad((ps.neckY ?? 0) + sway * 0.4), 0);
        head.rotation.set(rad(ps.headP ?? 0), rad(ps.headY ?? 0), rad(-(ps.headR ?? 0)));
        jaw.rotation.x = 0.62 * clamp(ps.jaw ?? 0);
        tongue.position.y = 0.03 + 0.03 * clamp(ps.jaw ?? 0);
        const sn = clamp(ps.sniff ?? 0);
        for (const n of nostrils) n.scale.set(1 + 0.6 * sn, 1 + 0.9 * sn, 1);
        snout.scale.set(1 + 0.03 * sn, 1 - 0.04 * sn, 1);
        // eyes: pupils look, lids squint and blink
        const lx = clamp(ps.lookX ?? 0, -1, 1), ly = clamp(ps.lookY ?? 0, -1, 1);
        const lidK = Math.max(clamp(ps.squint ?? 0) * 0.55, clamp(ps.blink ?? 0));
        for (const e of eyes) {
          e.pup.rotation.set(-ly * 0.38, lx * 0.42 - e.s * 0.08, 0);
          // the lid's dome turns from up and back (open, a thin lid line on top) over the front (closed)
          e.lidP.rotation.x = rad(35 + 140 * lidK);
        }
        const bw = clamp(ps.brow ?? 0, -1, 1);
        for (const b of brows) { b.b.rotation.z = b.s * (-0.35 * bw); b.b.position.y = 0.47 + 0.05 * Math.max(0, bw) - 0.03 * Math.max(0, -bw); }
        // arms
        const ar = clamp(ps.arms ?? 0);
        for (const a of arms) a.sh.rotation.set(-0.2 - 0.8 * ar + Math.sin(tt * 2 + a.s) * 0.05, 0, a.s * 0.1);
        // a stomp: the left foot (+x) lifts at step 1
        const st = clamp(ps.step ?? 0);
        legs[1].g.position.y = 1.2 + 0.28 * st; legs[1].g.rotation.x = -0.25 * st;
        // tail
        shapeTail(clamp(ps.curl ?? 0), tt, clamp(ps.wag ?? 0));
      },
    };
  },

  firelog(P) {
    const len = P.spec.len ?? 1.6, r = P.spec.r ?? LOG.r;
    const bark = canvasTex(512, 128, (g, W, H) => {
      g.fillStyle = "#6b4a2e"; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 70; i++) { const y = rnd(i) * H, x = rnd(i + 99) * W, l = 40 + rnd(i + 7) * 160; g.strokeStyle = `rgba(${40 + rnd(i + 3) * 30},${26 + rnd(i + 5) * 18},14,0.7)`; g.lineWidth = 2 + rnd(i + 11) * 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (rnd(i + 13) - 0.5) * 10); g.stroke(); }
      for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(110,140,60,${0.25 + 0.3 * rnd(i + 40)})`; g.beginPath(); g.ellipse(rnd(i + 60) * W, rnd(i + 61) * H * 0.4, 20 + rnd(i) * 30, 6 + rnd(i + 1) * 8, 0, 0, Math.PI * 2); g.fill(); }   // moss on top
    });
    bark.wrapS = bark.wrapT = THREE.RepeatWrapping; bark.repeat.set(2, 1);
    const roll = new THREE.Group(); roll.position.y = r; P.whole.add(roll);
    const body = mesh(new THREE.CylinderGeometry(r, r * 1.04, len, 22, 1, true), mat("#ffffff", { map: bark, roughness: 0.9, side: THREE.DoubleSide }), roll, 0, 0, 0);
    body.rotation.z = Math.PI / 2;
    const ring = canvasTex(128, 128, (g) => { g.fillStyle = "#c9a06a"; g.fillRect(0, 0, 128, 128); for (let k = 6; k > 0; k--) { g.strokeStyle = "rgba(120,80,40,0.5)"; g.lineWidth = 2; g.beginPath(); g.arc(64, 64, k * 10, 0, Math.PI * 2); g.stroke(); } g.strokeStyle = "#5a3d22"; g.lineWidth = 10; g.beginPath(); g.arc(64, 64, 59, 0, Math.PI * 2); g.stroke(); });
    for (const s of [-1, 1]) { const e = mesh(new THREE.CircleGeometry(r * (s > 0 ? 1.04 : 1), 22), mat("#ffffff", { map: ring, roughness: 0.85 }), roll, s * len / 2, 0, 0); e.rotation.y = s * Math.PI / 2; }
    // a broken-off branch stub
    const stub = mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.16, 8), mat("#6b4a2e", { roughness: 0.9 }), roll, -len * 0.28, r * 0.75, -r * 0.5); stub.rotation.x = -0.7;
    return { grip: 2 * r, apply(ps) { roll.rotation.x = (ps.spin ?? 0) * Math.PI * 2; } };
  },

  campfire(P) {
    const stoneM = [mat("#8d8a86", { roughness: 0.9 }), mat("#77736f", { roughness: 0.9 }), mat("#a19c94", { roughness: 0.9 })];
    const R = P.spec.r ?? 0.3;
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2 + rnd(i) * 0.2, s = 0.07 + rnd(i + 20) * 0.04;
      const st = mesh(new THREE.DodecahedronGeometry(s, 0), stoneM[i % 3], P.whole, Math.cos(a) * R, s * 0.6, Math.sin(a) * R);
      st.scale.set(1.2, 0.75, 1); st.rotation.y = rnd(i + 5) * 3;
    }
    const wood = mat("#4a321f", { roughness: 0.9 }), charM = mat("#251a12", { roughness: 1 });
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI + 0.3, st = mesh(new THREE.CylinderGeometry(0.03, 0.035, R * 1.6, 7), i % 2 ? wood : charM, P.whole, 0, 0.07, 0); st.rotation.set(Math.PI / 2 - 0.35, a, 0); }
    mesh(new THREE.CylinderGeometry(R * 0.8, R * 0.85, 0.02, 20), charM, P.whole, 0, 0.01, 0);
    // flames: cel bands, each tongue a flat-shaded double cone flickering on its own phase
    const cols = ["#ff4a1c", "#ff8a1f", "#ffc531", "#fff1a6"];
    const tongues = [];
    for (let i = 0; i < 16; i++) {
      const band = i < 6 ? 0 : i < 11 ? 1 : i < 14 ? 2 : 3, spread = [0.2, 0.15, 0.09, 0.04][band];
      const m = new THREE.MeshBasicMaterial({ color: cols[band], transparent: true, opacity: 0.95, depthWrite: false });
      const c = glowy(mesh(new THREE.ConeGeometry(0.06 - band * 0.01, 1, 7), m, P.whole, (rnd(i + 1) - 0.5) * 2 * spread, 0, (rnd(i + 2) - 0.5) * 2 * spread), 3 + band);
      tongues.push({ c, h: [0.42, 0.36, 0.28, 0.18][band] * (0.75 + 0.5 * rnd(i + 3)), ph: rnd(i + 4) * 6.28, sp: 8 + rnd(i + 5) * 7, x: c.position.x, z: c.position.z });
    }
    const light = new THREE.PointLight("#ff9a4a", 0, 4.5, 1.5); light.position.set(0, 0.45, 0); P.whole.add(light);
    // sparks rising (a puff throws many)
    const sparks = Array.from({ length: 18 }, (_, i) => {
      const s = glowy(new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), new THREE.MeshBasicMaterial({ color: i % 2 ? "#ffd27a" : "#ff8a3a" })), 6); P.whole.add(s);
      return { s, ph: rnd(i + 30), sp: 0.35 + rnd(i + 31) * 0.4, x: (rnd(i + 32) - 0.5) * 0.3, z: (rnd(i + 33) - 0.5) * 0.3, puff: i >= 6 };
    });
    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, f = clamp(ps.lit ?? 0), w = clamp(ps.wobble ?? 0, -1, 1), pf = clamp(ps.puff ?? 0);
        light.intensity = 3.2 * f * (0.9 + 0.1 * Math.sin(tt * 17));
        for (const q of tongues) {
          const k = Math.max(0.01, f * q.h * (0.82 + 0.22 * Math.sin(tt * q.sp + q.ph)) * (1 - 0.55 * Math.abs(w)));
          q.c.visible = f > 0.01;
          q.c.scale.set(1 + 0.4 * Math.abs(w), k, 1);
          // flattened: the tongue lies over toward +x (w > 0) or -x
          q.c.rotation.z = -w * 1.25;
          q.c.position.set(q.x + Math.sin(-q.c.rotation.z) * k / 2, 0.06 + Math.cos(q.c.rotation.z) * k / 2, q.z);
        }
        for (const s of sparks) {
          const on = f > 0.01 && (!s.puff || pf > 0.01), u = ((tt * s.sp + s.ph) % 1 + 1) % 1, boost = s.puff ? pf : 1;
          s.s.visible = on;
          s.s.position.set(s.x * (1 + 2 * u * boost) + w * u * 0.6, 0.15 + u * (0.7 + 0.8 * boost), s.z * (1 + 2 * u * boost));
          s.s.scale.setScalar(1 - u);
        }
      },
    };
  },

  mallowstick(P) {
    const L = P.spec.len ?? 0.9;
    const stick = mesh(new THREE.CylinderGeometry(0.008, 0.012, L, 6), mat("#7a6a3a", { roughness: 0.9 }), P.whole, 0, L / 2, 0);
    const mallowM = mat("#fbf7ee", { roughness: 0.6 }), toast = mat("#e3b979", { roughness: 0.6 });
    const ms = [0, 1, 2].map((i) => { const m = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.045, 14), i === 0 ? toast : mallowM, P.whole, 0, L - 0.04 - i * 0.055, 0); return m; });
    stick.castShadow = false;
    return { grip: 0.1, apply(ps) { const f = clamp(ps.fall ?? 0); ms.forEach((m) => (m.visible = f < 0.5)); } };
  },

  mallows(P) {
    const mallowM = mat("#fbf7ee", { roughness: 0.6 }), toast = mat("#e3b979", { roughness: 0.6 });
    const dirs = [[0.0, 0], [0.9, 0.5], [-0.7, 0.8]];
    const ms = dirs.map((d, i) => { const g = new THREE.Group(); P.whole.add(g); mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.045, 14), i === 0 ? toast : mallowM, g, 0, 0.0225, 0); return { g, d, i }; });
    return {
      grip: 0,
      apply(ps) {
        const b = clamp(ps.burst ?? 0), sp = (ps.spin ?? 0) * Math.PI * 2;
        for (const m of ms) { m.g.position.set(m.d[0] * 0.07 + m.d[0] * 0.25 * b, m.i * 0.03 * (1 - b), m.d[1] * 0.06 + m.d[1] * 0.18 * b); m.g.rotation.set(sp * (1 + m.i * 0.3), sp * 0.5, b * (m.i - 1) * 1.4); }
      },
    };
  },

  mallowbag(P) {
    const stripes = canvasTex(256, 128, (g, W, H) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f4efe6" : "#d63a32"; g.fillRect(i * W / 8, 0, W / 8, H); } });
    const g = new THREE.Group(); P.whole.add(g);
    const bag = mesh(new THREE.BoxGeometry(0.2, 0.26, 0.12, 2, 2, 2), mat("#ffffff", { map: stripes, roughness: 0.75 }), g, 0, 0.13, 0);
    // a rolled-open top and the marshmallows peeking out
    mesh(new THREE.BoxGeometry(0.21, 0.035, 0.13), mat("#f4efe6", { roughness: 0.8 }), g, 0, 0.27, 0);
    for (const [x, z] of [[-0.05, 0.01], [0.04, -0.02], [0.0, 0.03]]) mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.045, 12), mat("#fbf7ee", { roughness: 0.6 }), g, x, 0.285, z);
    bag.castShadow = true;
    return { grip: 0.15, apply(ps) { const s = (ps.spin ?? 0) * Math.PI * 2; g.rotation.set(s * 0.6, s * 0.3, s); g.position.y = Math.abs(Math.sin(s)) * 0.08; } };
  },

  ferns(P) {
    const S = P.spec, n = S.n ?? 9, L0 = S.len ?? 1.6, seed = S.seed ?? 1, col = new THREE.Color(S.color ?? "#5d9a3f");
    const tex = canvasTex(64, 256, (c, w, h) => {
      c.strokeStyle = "#b8b8b8"; c.lineWidth = 3; c.beginPath(); c.moveTo(32, h); c.lineTo(32, 0); c.stroke();
      for (let y = h - 6; y > 4; y -= 9) { const k = y / h, Lp = 4 + 27 * Math.sin(Math.PI * Math.min(1, (1 - k) * 1.15 + 0.08)); c.fillStyle = (y / 9) % 2 < 1 ? "#ffffff" : "#e2e2e2";
        for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(32, y); c.quadraticCurveTo(32 + sd * Lp * 0.6, y - 10, 32 + sd * Lp, y - 13); c.quadraticCurveTo(32 + sd * Lp * 0.45, y - 1, 32, y + 4); c.fill(); } }
    });
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    const fronds = [];
    for (let i = 0; i < n; i++) {
      const r = (k) => rnd(seed * 31 + i * 7 + k);
      const L = L0 * (0.65 + 0.5 * r(1)), W = L * 0.32, SEG = 10;
      const geo = new THREE.PlaneGeometry(W, L, 1, SEG); geo.translate(0, L / 2, 0);
      const m = new THREE.MeshStandardMaterial({ color: col.clone().multiplyScalar(0.8 + 0.35 * r(2)), map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85 });
      const f = new THREE.Mesh(geo, m); f.castShadow = true; f.receiveShadow = true;
      const pivot = new THREE.Group(); pivot.rotation.order = "YXZ"; pivot.add(f); P.whole.add(pivot);
      const yaw = (i / n) * Math.PI * 2 + r(3) * 0.7, tilt = 0.35 + 0.45 * r(4);
      pivot.position.set(Math.sin(yaw) * 0.08, 0, Math.cos(yaw) * 0.08);
      const base = geo.attributes.position.array.slice();
      fronds.push({ f, pivot, yaw, tilt, L, base, ph: r(5) * 6.28, arch: 0.6 + 0.5 * r(6) });
    }
    const from = S.from ?? [0, 1];
    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, pt = clamp(ps.part ?? 0);
        for (const q of fronds) {
          // part: fronds on the side something comes through bend away from it
          const dx = Math.sin(q.yaw), dz = Math.cos(q.yaw), facing = Math.max(0, dx * from[0] + dz * from[1]);
          q.pivot.rotation.set(q.tilt + pt * facing * 0.9 + Math.sin(tt * 1.3 + q.ph) * 0.03, q.yaw + pt * facing * 0.5 * Math.sign(Math.sin(q.ph) - 0.01), 0);
          // the frond arches over: each row of the strip bends forward by its height squared
          const a = q.f.geometry.attributes.position, b = q.base;
          for (let i = 0; i < a.count; i++) { const y = b[i * 3 + 1], u = y / q.L, bend = q.arch * (1 + 0.3 * pt * facing) * u * u; a.setXYZ(i, b[i * 3], y * Math.cos(bend * 0.9), y * Math.sin(bend * 0.9) * 0.9 + Math.sin(tt * 2 + q.ph + u * 2) * 0.02 * u); }
          a.needsUpdate = true;
        }
      },
    };
  },

  roarlines(P) {
    const lines = Array.from({ length: 16 }, (_, i) => {
      const m = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide });
      m.userData.noOutline = true;
      const g = new THREE.PlaneGeometry(1, 1); g.translate(0, 0.5, 0);
      const o = glowy(new THREE.Mesh(g, m), 7); P.whole.add(o);
      const a = rnd(i + 3) * Math.PI * 2, spread = 0.12 + 0.3 * rnd(i + 4);
      return { o, m, dir: new THREE.Vector3(Math.cos(a) * spread, Math.sin(a) * spread * 0.8, 1).normalize(), ph: rnd(i + 5), w: 0.012 + 0.02 * rnd(i + 6) };
    });
    const up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion();
    return {
      grip: 0,
      apply(ps, t) {
        const p = clamp(ps.puff ?? 0), tt = t ?? 0;
        for (const l of lines) {
          const u = ((tt * 2.6 + l.ph) % 1 + 1) % 1, len = (0.4 + 0.9 * (1 - u)) * p;
          l.o.visible = p > 0.02;
          q.setFromUnitVectors(up, l.dir); l.o.quaternion.copy(q);
          l.o.position.copy(l.dir).multiplyScalar(0.3 + u * 1.6);
          l.o.scale.set(l.w * (1 + u), Math.max(0.001, len), 1);
          l.m.opacity = 0.85 * p * (1 - u * 0.7);
        }
      },
    };
  },

  boulder(P) {
    const S = P.spec, w = S.w ?? 1.2, h = S.h ?? 0.8, d = S.d ?? 0.9, seed = S.seed ?? 1;
    const geo = new THREE.IcosahedronGeometry(1, 3), pos = geo.attributes.position;
    const tops = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const n = 1 + 0.08 * Math.sin(x * 3.1 + seed) * Math.cos(z * 2.7 + seed * 2) + 0.05 * Math.sin(y * 5 + seed * 3);
      const yy = y < -0.2 ? -0.2 + (y + 0.2) * 0.2 : y;   // a flat-ish bottom sunk in the ground
      pos.setXYZ(i, x * n * w / 2, (yy * n + 0.2) * h / 1.2, z * n * d / 2);
      tops.push(y);
    }
    geo.computeVertexNormals();
    // moss on top: vertex colours from grey to green by height
    const cols = new Float32Array(pos.count * 3), grey = new THREE.Color("#8b8579"), moss = new THREE.Color("#6f8f3e"), shade = new THREE.Color("#6e695f");
    for (let i = 0; i < pos.count; i++) { const k = clamp((tops[i] - 0.35) / 0.4), c = shade.clone().lerp(grey, clamp((tops[i] + 0.6) / 0.8)).lerp(moss, k * (0.7 + 0.3 * rnd(i))); cols.set([c.r, c.g, c.b], i * 3); }
    geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: false }), P.whole, 0, 0, 0);
    return { grip: h };
  },
};
