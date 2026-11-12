import * as THREE from "three";
import { clamp } from "./util.js";
import { TREX } from "../shared/trex-rig.js";

// Props for There's a catch EP05 "back to life" (storyboards/series/what-if/05-back-to-life/BRIEF-T3.md): the four mounted
// museum skeletons the Reaper's scythe wakes, and the sparks of the waking. Metres at scale 1, facing +z at rot 0; the prop's
// own `scale` scales all of it. Chunky cartoon bones (cream #e9dfc4 with darker joints #b9a984, drawn textures, never a
// medical model), nine to eleven rib pairs, fat vertebrae. Every frame is a pure function of the params and the clip time
// (no random numbers, no clock). All skeleton parts are solid for the checks; halo, ground pool, wires' glow and sparks are
// see-through and not solid (userData.steam + solid false).
//
// PARAMS (plain numbers, all 0 at rest). propState (props3d.js) has a default for glow (spec.glow) and rise (spec.rise) but
// NOT for rattle, and the first tween of a key without a default JUMPS: seed glow, rattle and rise with a dur-0 `set` at time 0.
//   glow 0..1     (all four skeletons) the bones turn bright green-white #b8ff9a by emissive (1 = a flat glowing silhouette,
//                 the moment before the animal appears) and a soft additive green halo sprite grows round the whole skeleton
//                 (at 1 the silhouette reads from 270 px); on the floor skeletons a green pool of light spreads under them.
//   rattle 0..1   (all four skeletons) every bone jitters about 4 degrees and 2 cm times the value, each from its own index
//                 and the clip time (a held 1 is a shudder, tween 0 -> 1 -> 0 for a rattle past the scythe). 0 is exactly at rest.
//   rise 0..1     (lifesparks) the ring of light climbs from the floor (0) to spec.h (1); nothing is drawn at 0 and at 1.
// SPEC KEYS (all optional): scale (the engine's, 1), rods true (the three floor skeletons: false draws no steel support rods at all), wire 3.5 (pterobones: the wires' length up to the roof), r 1.5 and h 3 (lifesparks).
//
//   trexbones    the `trex` (props-dino.js) as a skeleton at rest, from its own joint numbers (TREX). Origin: on the ground
//                between the feet. Skull top 3.95 tall (the animal's own head), 4.9 long from the snout to the tail tip: big
//                skull with eye sockets, open jaw (0.45 rad) and teeth, short thick neck, ribcage of 10 pairs, hips, both legs with
//                three-clawed feet, tiny two-clawed arms, 14 shrinking tail vertebrae held out level behind. Two dark steel
//                rods from the floor to the spine at z -0.3 and z 0.8 (x 0). At the same x, z, rot and scale as a `trex` the
//                skull sits on its head and the feet on its feet.
//   mammothbones 3.4 long (rump z -1.5 to face z 1.85), 3.1 tall at the skull dome, 1.7 wide over the tusks (body 1.0).
//                Origin: on the ground between the feet. Domed skull with nose hole, sockets and a small jaw, two 1.35 m
//                ivory tusks curving out and up (tips x +-0.82), 11 rib pairs, spine with tall shoulder spines, pelvis,
//                four pillar legs with round foot pads, a short tail. Steel rods at z -0.4 and z 0.5.
//   sabrebones   1.8 long (rump z -0.8 to nose z 1.0; tail to z -1.3), 1.1 tall at the shoulder, 0.5 wide. Origin: on the
//                ground between the feet. Big skull with open jaw and two 0.28 m fangs, 9 rib pairs, four legs with toes, a
//                short tail. Steel rods at z -0.45 and z 0.2.
//   pterobones   2.6 wingspan. Origin: the middle of the body, flying toward +z (nose z 1.2, tail z -0.8). Long beak skull with
//                a crest, neck, small ribcage of 5 pairs, wing bones (arm, forearm, a four-joint wing finger), hind legs; hangs
//                from two thin steel wires from its back (z 0.2 and z -0.3) up to spec.wire (3.5) above the origin.
//   lifesparks   origin on the ground. A bright green ring of light (radius spec.r 1.5) climbs from the floor to spec.h (3)
//                with a soft curtain of light under it and 40 sparkles trailing below it, fading. Additive, see-through.
//                Nothing is drawn at rise 0 and 1.
export const FOSSILS = {
  bone: "#e9dfc4", joint: "#b9a984", glow: "#b8ff9a",
  trex: { skull: 3.95, long: 4.9 }, mammoth: { long: 3.4, tall: 3.1, wide: 1.7, tusk: 1.35 }, sabre: { long: 1.8, tall: 1.1, fang: 0.28 }, ptero: { span: 2.6, wire: 3.5 },
};

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const hs = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const rad = (d) => (d * Math.PI) / 180;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const cvs = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; };
const ctex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const TX = {};
const once = (k, f) => (TX[k] ||= f());

// ------------------------------------------------------------------------------------------------ drawn textures
// aged cream bone: soft tan stains, grain along the bone, pits with a lit rim, a few hairline cracks; each mark from rnd(i)
const boneTex = () => once("bone", () => ctex(cvs(512, 512, (g, W, H) => {
  g.fillStyle = "#e9dfc4"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 18; i++) {
    const x = rnd(i * 3 + 1) * W, y = rnd(i * 3 + 2) * H, r = 50 + rnd(i * 3 + 3) * 110, gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(186,160,108,${0.16 + 0.16 * rnd(i + 40)})`); gr.addColorStop(1, "rgba(186,160,108,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 70; i++) { const x = rnd(i + 100) * W, y = rnd(i + 200) * H, l = 50 + rnd(i + 300) * 220; g.strokeStyle = `rgba(160,138,96,${0.12 + 0.14 * rnd(i + 400)})`; g.lineWidth = 1 + rnd(i + 500) * 2.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd(i + 600) - 0.5) * 8, y + l); g.stroke(); }
  for (let i = 0; i < 150; i++) {
    const x = rnd(i + 700) * W, y = rnd(i + 800) * H, r = 1.5 + rnd(i + 900) * 4;
    g.fillStyle = `rgba(118,98,64,${0.35 + 0.3 * rnd(i + 1000)})`; g.beginPath(); g.ellipse(x, y, r * 1.2, r, rnd(i + 1100) * 3, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(255,250,232,0.55)"; g.beginPath(); g.ellipse(x + r * 0.5, y + r * 0.6, r * 0.7, r * 0.3, 0.6, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 10; i++) {
    let x = rnd(i + 1200) * W, y = rnd(i + 1300) * H; g.strokeStyle = "rgba(100,84,54,0.65)"; g.lineWidth = 1.3; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += (rnd(i * 9 + k + 1400) - 0.5) * 26; y += 10 + rnd(i * 9 + k + 1500) * 26; g.lineTo(x, y); }
    g.stroke();
  }
})));
// the darker joint knobs: the same bone gone brown, speckled
const jointTex = () => once("joint", () => ctex(cvs(256, 256, (g, W, H) => {
  g.fillStyle = "#b9a984"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 14; i++) { const x = rnd(i + 1600) * W, y = rnd(i + 1700) * H, r = 20 + rnd(i + 1800) * 50, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(120,100,66,0.35)"); gr.addColorStop(1, "rgba(120,100,66,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  for (let i = 0; i < 90; i++) { const x = rnd(i + 1900) * W, y = rnd(i + 2000) * H, r = 1 + rnd(i + 2100) * 3; g.fillStyle = `rgba(${rnd(i + 2200) < 0.5 ? "84,68,44" : "226,214,176"},${0.35 + 0.3 * rnd(i + 2300)})`; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
})));
// ivory for the tusks: long grain lines, yellowing toward the tip (v runs along the tusk)
const ivoryTex = () => once("ivory", () => ctex(cvs(256, 512, (g, W, H) => {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#f2e9cf"); gr.addColorStop(0.7, "#eadcb6"); gr.addColorStop(1, "#d9c490"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 110; i++) { const x = rnd(i + 2400) * W; g.strokeStyle = rnd(i + 2500) < 0.5 ? `rgba(196,172,120,${0.18 + 0.2 * rnd(i + 2600)})` : `rgba(255,252,240,${0.2 + 0.25 * rnd(i + 2700)})`; g.lineWidth = 1 + rnd(i + 2800) * 3; g.beginPath(); g.moveTo(x, rnd(i + 2900) * H * 0.3); g.lineTo(x + (rnd(i + 3000) - 0.5) * 6, H * (0.5 + 0.5 * rnd(i + 3100))); g.stroke(); }
  for (let i = 0; i < 5; i++) { let x = rnd(i + 3200) * W, y = rnd(i + 3300) * H * 0.7; g.strokeStyle = "rgba(120,98,60,0.5)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (rnd(i * 7 + k + 3400) - 0.5) * 12; y += 14 + rnd(i * 7 + k + 3500) * 30; g.lineTo(x, y); } g.stroke(); }
})));
const steelTex = () => once("steel", () => ctex(cvs(128, 128, (g, W, H) => {
  g.fillStyle = "#4b5460"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(${rnd(i + 3600) < 0.5 ? "170,184,200" : "30,36,44"},${0.15 + 0.2 * rnd(i + 3700)})`; g.lineWidth = 1 + rnd(i + 3800); const x = rnd(i + 3900) * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
})));
const radialTex = (key, stops) => once(key, () => ctex(cvs(128, 128, (g, W, H) => {
  const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2); for (const [o, c] of stops) gr.addColorStop(o, c); g.fillStyle = gr; g.fillRect(0, 0, W, H);
})));
const HALO = () => radialTex("halo", [[0, "rgba(170,255,140,0.95)"], [0.3, "rgba(120,255,110,0.55)"], [0.65, "rgba(80,230,100,0.16)"], [1, "rgba(60,220,90,0)"]]);
const SPARK = () => radialTex("spark", [[0, "rgba(240,255,225,1)"], [0.25, "rgba(184,255,154,0.9)"], [0.6, "rgba(110,255,110,0.28)"], [1, "rgba(80,240,100,0)"]]);
// the curtain of light under the ring: bright at the top (the top of a cylinder is v = 1), a few lit streaks up it
const curtainTex = () => once("curtain", () => ctex(cvs(256, 128, (g, W, H) => {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "rgba(170,255,130,0.95)"); gr.addColorStop(0.35, "rgba(100,255,100,0.45)"); gr.addColorStop(1, "rgba(80,230,100,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { const x = rnd(i + 4000) * W, l = H * (0.3 + 0.7 * rnd(i + 4100)); const lg = g.createLinearGradient(0, 0, 0, l); lg.addColorStop(0, `rgba(230,255,210,${0.3 + 0.4 * rnd(i + 4200)})`); lg.addColorStop(1, "rgba(230,255,210,0)"); g.fillStyle = lg; g.fillRect(x, 0, 1 + rnd(i + 4300) * 3, l); }
})));

// flags: never solid, out of the ground blobs and the light box
const ghost = (o, order = 5) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
const addMat = (map, o = {}) => { const m = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false, ...o }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; return m; };
const spriteMat = (map, opacity) => { const m = new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, opacity }); m.userData.noOutline = true; return m; };

// ------------------------------------------------------------------------------------------------ geometry
const ell = (rx, ry, rz, seg = 14) => { const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)); g.scale(rx, ry, rz); return g; };
// a bone along +y: radius r0 at the bottom to r1 at the top, swelling to 1 + bulge at both ends (chunky, not a pipe)
function boneGeo(len, r0, r1, bulge = 0.55) {
  const pts = [new THREE.Vector2(0, -len / 2)], N = 8;
  for (let i = 0; i <= N; i++) { const t = i / N; pts.push(new THREE.Vector2((r0 + (r1 - r0) * t) * (1 + bulge * Math.abs(2 * t - 1) ** 3), -len / 2 + len * t)); }
  pts.push(new THREE.Vector2(0, len / 2));
  return new THREE.LatheGeometry(pts, 10);
}
// a tube along a curve through pts, radius r0 -> r1 (x (1 + bulge) at the ends), closed ends; uv u round, v along
function taperGeo(pts, r0, r1, seg = 16, ring = 8, bulge = 0) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))), fr = curve.computeFrenetFrames(seg, false);
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg, c = curve.getPointAt(t), N = fr.normals[i], B = fr.binormals[i], r = (r0 + (r1 - r0) * t) * (1 + bulge * Math.abs(2 * t - 1) ** 3);
    for (let j = 0; j <= ring; j++) { const a = (j / ring) * Math.PI * 2, cx = Math.cos(a) * r, cy = Math.sin(a) * r; pos.push(c.x + N.x * cx + B.x * cy, c.y + N.y * cx + B.y * cy, c.z + N.z * cx + B.z * cy); uv.push(j / ring, t); }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < ring; j++) { const a = i * (ring + 1) + j, b = a + ring + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  for (const [i, flip] of [[0, true], [seg, false]]) {
    const c = curve.getPointAt(i / seg), ci = pos.length / 3; pos.push(c.x, c.y, c.z); uv.push(0.5, i / seg);
    for (let j = 0; j < ring; j++) { const a = i * (ring + 1) + j; if (flip) idx.push(ci, a + 1, a); else idx.push(ci, a, a + 1); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------------------------------------------------ the skeleton kit
// one context per prop: its materials (all with the glow colour as emissive at intensity 0), its parts (every bone is a
// group that rattle jitters about its own middle) and the halo and pool
function ctx(P, { haloSize, haloAt, pool = 0, poolAt = [0, 0] }) {
  const root = new THREE.Group(); P.whole.add(root);
  const mats = [];
  const mk = (map, k, o = {}) => { const m = new THREE.MeshStandardMaterial({ map, color: "#ffffff", roughness: 0.78, emissive: new THREE.Color(FOSSILS.glow), emissiveIntensity: 0, ...o }); mats.push([m, k]); return m; };
  const M = { bone: mk(boneTex(), 1), joint: mk(jointTex(), 0.9), ivory: mk(ivoryTex(), 1), cavity: mk(boneTex(), 0.35, { color: "#4c3e2c" }) };
  M.steel = new THREE.MeshStandardMaterial({ map: steelTex(), color: "#ffffff", roughness: 0.42, metalness: 0.55 });
  const parts = [];
  const S = { root, M, parts, mk };
  S.mesh = (parent, geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  // a registered part: its middle is (x, y, z); everything in it is placed relative to that
  S.part = (x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); root.add(g); parts.push({ g, p: [x, y, z], i: parts.length, k: 0.6 + 0.6 * hs(parts.length, 7) }); return g; };
  const halo = new THREE.Sprite(spriteMat(HALO(), 0)); halo.scale.set(haloSize, haloSize, 1); halo.position.set(...haloAt); ghost(halo, 6); root.add(halo);
  let poolM = null;
  if (pool) { poolM = new THREE.Mesh(new THREE.CircleGeometry(pool, 40), addMat(HALO(), { opacity: 0, side: THREE.FrontSide })); poolM.rotation.x = -Math.PI / 2; poolM.position.set(poolAt[0], 0.025, poolAt[1]); ghost(poolM, 2); root.add(poolM); }
    S.apply = (ps, t) => {
    const gl = clamp(ps.glow ?? 0), r = clamp(ps.rattle ?? 0), tt = t ?? 0;
    // (the look copies a standard material's colours once and then follows only emissiveIntensity, so glow is that alone)
    for (const [m, k] of mats) m.emissiveIntensity = gl * k * 0.85;
    halo.visible = gl > 0.01; halo.material.opacity = 0.32 * gl; halo.scale.setScalar(haloSize * (0.62 + 0.38 * gl));
    if (poolM) { poolM.visible = gl > 0.01; poolM.material.opacity = 0.45 * gl; poolM.scale.setScalar(0.5 + 0.5 * gl); }
    for (const p of parts) {
      if (r <= 0) { p.g.position.set(p.p[0], p.p[1], p.p[2]); p.g.rotation.set(0, 0, 0); continue; }
      const a = tt * 43 + r * 17 + p.i * 2.399, kk = r * p.k;
      p.g.position.set(p.p[0] + 0.022 * kk * Math.sin(a), p.p[1] + 0.02 * kk * Math.sin(a * 1.37 + 1), p.p[2] + 0.022 * kk * Math.sin(a * 1.71 + 2));
      p.g.rotation.set(rad(4) * kk * Math.sin(a * 1.11 + 3), rad(4) * kk * Math.sin(a * 0.93 + 4), rad(4) * kk * Math.sin(a * 1.53 + 5));
    }
  };

  // ---- bones
  const UP = new THREE.Vector3(0, 1, 0), mid = (a, b) => a.map((v, i) => (v + b[i]) / 2);
  // a bone from a to b (radius r0 at a, r1 at b), a dark joint knob at the end(s): knob 2 both, 1 the b end, 0 none
  S.limb = (a, b, r0, r1 = r0, o = {}) => {
    const m = o.m ?? M.bone, c = mid(a, b), g = S.part(...c), d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), len = d.length();
    const bone = S.mesh(g, boneGeo(len, r0, r1, o.bulge ?? 0.55), m); bone.quaternion.setFromUnitVectors(UP, d.normalize());
    if (o.sx) bone.scale.x = o.sx;
    const kn = o.knob ?? 2;
    if (kn >= 2) S.mesh(g, new THREE.SphereGeometry(r0 * 1.2, 10, 8), M.joint, a[0] - c[0], a[1] - c[1], a[2] - c[2]);
    if (kn >= 1) S.mesh(g, new THREE.SphereGeometry(r1 * 1.2, 10, 8), M.joint, b[0] - c[0], b[1] - c[1], b[2] - c[2]);
    return g;
  };
  // joined bones through pts with radii rs (one per point)
  S.chain = (pts, rs, o = {}) => pts.slice(1).map((p, i) => S.limb(pts[i], p, rs[i], rs[i + 1], { ...o, knob: i === 0 ? (o.knob ?? 2) : 1 }));
  // one ellipsoid of bone (a skull plate, a pelvis wing) at c with radii r, turned rot (xyz euler)
  S.blob = (c, r, o = {}) => { const g = S.part(...c); const m = S.mesh(g, ell(r[0], r[1], r[2], o.seg ?? 14), o.m ?? M.bone); if (o.rot) m.rotation.set(...o.rot); return g; };
  // a tapered tube along pts (tusk, rib, beak): a part at its first point
  S.tube = (pts, r0, r1, o = {}) => { const g = S.part(...pts[0]); S.mesh(g, taperGeo(pts.map((p) => p.map((v, i) => v - pts[0][i])), r0, r1, o.seg ?? 16, o.ring ?? 8, o.bulge ?? 0), o.m ?? M.bone); return g; };
  // a vertebra at p along tangent tan: a fat disc, a neural spine up (length sp) and a dark knob between it and the next
  S.vert = (p, tan, r, sp = 0) => {
    const g = S.part(...p), o = new THREE.Group(); g.add(o); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...tan).normalize());
    S.mesh(o, ell(r * 0.95, r * 0.85, r * 1.05, 12), M.bone);
    if (sp > 0) S.mesh(o, new THREE.ConeGeometry(r * 0.3, sp, 6), M.bone, 0, r * 0.75 + sp / 2, -r * 0.1);
    S.mesh(o, new THREE.SphereGeometry(r * 0.5, 8, 6), M.joint, 0, 0, r * 1.0);
    return g;
  };
  // vertebrae along a curve through pts: n of them, radius rf(u), neural spine length sf(u)
  S.spine = (pts, n, rf, sf = () => 0) => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    for (let i = 0; i < n; i++) { const u = n > 1 ? i / (n - 1) : 0, c = curve.getPointAt(u), t = curve.getTangentAt(u); S.vert([c.x, c.y, c.z], [t.x, t.y, t.z], rf(u), sf(u)); }
    return curve;
  };
  // a pair of ribs hung from the spine at (0, y, z): k = half width, L = length scale, fwd = how far the lower end swings forward
  S.ribs = (y, z, k, L, r = 0.05, fwd = 0.1) => {
    const g = S.part(0, y, z);
    for (const s of [-1, 1]) {
      const pts = [[0, 0, 0], [0.2 * k * s, -0.07 * L, 0], [0.5 * k * s, -0.32 * L, fwd * 0.2], [0.62 * k * s, -0.66 * L, fwd * 0.55], [0.5 * k * s, -0.96 * L, fwd * 0.85], [0.2 * k * s, -1.14 * L, fwd]];
      S.mesh(g, taperGeo(pts, r, r * 0.7, 14, 7, 0.1), M.bone);
      S.mesh(g, new THREE.SphereGeometry(r * 1.25, 8, 6), M.joint, 0.03 * s, 0, 0);
    }
    return g;
  };
  // a cone tooth in parent: tip up (up = true) or down
  S.tooth = (parent, x, y, z, r, h, up, m = M.ivory) => { const o = S.mesh(parent, new THREE.ConeGeometry(r, h, 8), m, x, y, z); if (!up) o.rotation.x = Math.PI; return o; };
  // a steel rod from the floor to y at (x, z), a plate at the foot and a clamp at the top
  S.rod = (x, z, y, r = 0.026) => {
    if (P.spec.rods === false) return;   // spec.rods false: no steel rods (a camera between the legs)
    S.mesh(root, new THREE.CylinderGeometry(r, r, y, 10), M.steel, x, y / 2, z);
    S.mesh(root, new THREE.CylinderGeometry(r * 3.4, r * 4, 0.022, 14), M.steel, x, 0.011, z);
    S.mesh(root, new THREE.TorusGeometry(r * 1.9, r * 0.8, 6, 12), M.steel, x, y, z).rotation.x = Math.PI / 2;
  };
  return S;
}

// ------------------------------------------------------------------------------------------------ kinds
export const FOSSILS_KINDS = {
  trexbones(P) {
    const S = ctx(P, { haloSize: 8.2, haloAt: [0, 2.2, -0.7], pool: 3.2, poolAt: [0, -0.8] }), M = S.M, T = TREX;
    // legs: femur, tibia, metatarsus, then three claws
    for (const s of [-1, 1]) {
      S.chain([[s * 0.4, 1.9, -0.1], [s * 0.5, 1.15, 0.4], [s * 0.46, 0.4, -0.12], [s * 0.46, 0.1, 0.12]], [0.19, 0.15, 0.105, 0.085]);
      for (const k of [-1, 0, 1]) {
        const x = s * 0.46 + k * 0.15, z1 = 0.52 - Math.abs(k) * 0.05;
        S.limb([s * 0.46 + k * 0.04, 0.09, 0.14], [x, 0.08, z1], 0.06, 0.05, { knob: 1 });
        const g = S.part(x, 0.06, z1 + 0.07); const c = S.mesh(g, new THREE.ConeGeometry(0.055, 0.2, 8), M.ivory); c.rotation.x = Math.PI / 2 - 0.15;
      }
      // pelvis: ilium plate, pubis boot and ischium
      S.blob([s * 0.3, 2.2, -0.25], [0.11, 0.3, 0.6]);
      S.limb([s * 0.32, 1.95, 0.2], [s * 0.34, 1.45, 0.7], 0.08, 0.06);
      S.limb([s * 0.32, 1.9, -0.3], [s * 0.3, 1.4, -0.7], 0.08, 0.055);
      // tiny arms: upper arm, forearm, two claws
      S.chain([[s * 0.4, 2.22, 0.92], [s * 0.45, 1.98, 1.12], [s * 0.45, 1.9, 1.36]], [0.07, 0.055, 0.045]);
      for (const k of [-1, 1]) { const g = S.part(s * 0.45 + k * 0.03, 1.88, 1.5); const c = S.mesh(g, new THREE.ConeGeometry(0.03, 0.14, 6), M.ivory); c.rotation.x = Math.PI / 2 - 0.2; }
    }
    // spine: sacrum, back, neck; the tail walks out level behind like the animal's own
    S.spine([[0, 2.2, -0.7], [0, 2.45, -0.4], [0, 2.62, -0.1], [0, 2.74, 0.25], [0, 2.8, 0.6], [0, 2.8, 0.9], [0, 2.9, 1.04], [0, 3.02, 1.16], [0, 3.1, 1.26], [0, 3.16, 1.32]], 10, (u) => 0.19 - 0.05 * u, (u) => (u > 0.1 && u < 0.7 ? 0.16 : 0));
    const segL = T.tailLen / T.tailSegs, tail = [[0, 2.03, -0.95]]; { let y = 2.03, z = -0.95, pitch = -0.32; for (let i = 0; i < T.tailSegs; i++) { y += Math.sin(pitch) * segL; z -= Math.cos(pitch) * segL; pitch += 0.03; tail.push([0, y, z]); } }
    for (let i = 0; i < T.tailSegs; i++) { const k = i / (T.tailSegs - 1), a = tail[i], b = tail[i + 1]; S.vert(a, [b[0] - a[0], b[1] - a[1], b[2] - a[2]], 0.27 * (1 - k) ** 1.1 + 0.06, 0.16 * (1 - k) + 0.03); }
    // ribcage: 10 pairs on a barrel
    for (let i = 0; i < 10; i++) { const u = i / 9, z = -0.35 + 1.2 * u, ys = 2.45 + 0.35 * smooth(0, 0.8, u) - 0.02, k = 0.34 + 0.34 * Math.sin(Math.PI * (0.1 + 0.8 * u)); S.ribs(ys, z, k + 0.1, 1.25 - 0.3 * Math.abs(u - 0.4), 0.052, 0.12); }
    S.limb([0, 1.5, -0.3], [0, 1.5, 0.95], 0.06, 0.055, { knob: 2 });
    // skull in the head's frame, drawn at the animal's headScale
    const sk = S.part(0, 3.2, 1.32); sk.scale.setScalar(T.headScale);
    const m = (geo, mt, x, y, z) => S.mesh(sk, geo, mt, x, y, z);
    m(ell(0.34, 0.28, 0.38), M.bone, 0, 0.2, 0.26); m(ell(0.3, 0.17, 0.22), M.bone, 0, 0.3, 0.52); m(ell(0.25, 0.17, 0.55), M.bone, 0, 0.06, 0.72); m(ell(0.12, 0.06, 0.38), M.bone, 0, 0.2, 0.74);
    for (const s of [-1, 1]) {
      m(ell(0.1, 0.045, 0.12), M.bone, s * 0.22, 0.4, 0.55);                       // brow
      m(ell(0.08, 0.11, 0.07), M.cavity, s * 0.28, 0.3, 0.54);                      // eye socket
      m(ell(0.04, 0.1, 0.17), M.cavity, s * 0.23, 0.07, 0.9);                       // the big window in the snout
      m(ell(0.05, 0.04, 0.03), M.cavity, s * 0.07, 0.13, 1.2);                      // nostril
      m(ell(0.05, 0.05, 0.07), M.joint, s * 0.27, -0.03, 0.18);                     // jaw hinge
    }
    for (const z of [0.5, 0.67, 0.85, 1.02, 1.14]) for (const s of [-1, 1]) S.tooth(sk, s * (0.19 - (z - 0.5) * 0.17), -0.11, z, 0.045, 0.14, false);
    const jaw = new THREE.Group(); jaw.position.set(...T.jaw); jaw.rotation.x = 0.45; sk.add(jaw);
    S.mesh(jaw, ell(0.22, 0.08, 0.5), M.bone, 0, -0.04, 0.48); S.mesh(jaw, ell(0.26, 0.05, 0.12), M.bone, 0, -0.08, 0.85);
    for (const z of [0.42, 0.6, 0.78, 0.95]) for (const s of [-1, 1]) S.tooth(jaw, s * 0.16, 0.07, z, 0.034, 0.1, true);
    S.rod(0, -0.3, 2.55); S.rod(0, 0.8, 2.75);
    return { grip: 0, apply: S.apply };
  },

  mammothbones(P) {
    const S = ctx(P, { haloSize: 6.2, haloAt: [0, 1.6, 0.1], pool: 2.6, poolAt: [0, 0.1] }), M = S.M;
    // legs: shoulder / hip bone, long straight shin, a round foot pad with four nails
    const leg = (s, top, knee, foot, z) => {
      S.chain([top, knee, foot], [0.14, 0.12, 0.1]);
      const g = S.part(foot[0], 0.07, z); S.mesh(g, new THREE.CylinderGeometry(0.22, 0.26, 0.14, 14), M.joint);
      for (let k = 0; k < 4; k++) S.mesh(g, ell(0.055, 0.04, 0.06, 8), M.ivory, (k - 1.5) * 0.1, 0.0, 0.22);
    };
    for (const s of [-1, 1]) {
      leg(s, [s * 0.4, 2.3, 0.6], [s * 0.43, 1.35, 0.75], [s * 0.43, 0.2, 0.8], 0.8);
      leg(s, [s * 0.46, 2.1, -0.85], [s * 0.48, 1.25, -0.7], [s * 0.46, 0.2, -0.92], -0.92);
      S.blob([s * 0.44, 2.42, 0.5], [0.05, 0.27, 0.15], { rot: [0.35, 0, s * 0.15] });      // shoulder blade
      S.blob([s * 0.46, 2.12, -0.82], [0.07, 0.2, 0.34], { rot: [0.2, 0, s * -0.3] });   // pelvis wing
    }
    // spine with tall shoulder spines, the neck up to the skull, a short tail down behind
    S.spine([[0, 1.95, -1.0], [0, 2.12, -0.7], [0, 2.3, -0.4], [0, 2.45, -0.1], [0, 2.58, 0.2], [0, 2.66, 0.5], [0, 2.62, 0.8], [0, 2.52, 1.0]], 9, (u) => 0.16 - 0.02 * u, (u) => (u > 0.3 && u < 0.85 ? 0.12 + 0.3 * Math.sin(Math.PI * (u - 0.2) / 0.7) : 0.05));
    S.spine([[0, 1.9, -1.1], [0, 1.78, -1.28], [0, 1.6, -1.4], [0, 1.4, -1.48]], 6, (u) => 0.1 * (1 - u) + 0.035);
    for (let i = 0; i < 11; i++) { const u = i / 10, z = -0.62 + 1.46 * u, ys = 2.18 + 0.52 * u - 0.03 * (1 - u), k = 0.28 + 0.27 * Math.sin(Math.PI * (0.08 + 0.84 * u)); S.ribs(ys, z, k + 0.12, 1.4 - 0.35 * Math.abs(u - 0.35), 0.058, 0.1); }
    S.limb([0, 1.45, -0.4], [0, 1.4, 0.85], 0.07, 0.06);
    // skull: dome, face, nose hole, sockets, tusk roots, small jaw
    const sk = S.part(0, 2.15, 1.35);
    const m = (geo, mt, x, y, z) => S.mesh(sk, geo, mt, x, y, z);
    m(ell(0.5, 0.6, 0.65), M.bone, 0, 0.35, -0.15); m(ell(0.34, 0.5, 0.4), M.bone, 0, -0.3, 0.1); m(ell(0.3, 0.1, 0.24), M.joint, 0, 0.0, 0.0);
    m(ell(0.17, 0.14, 0.06), M.cavity, 0, -0.05, 0.47);
    for (const s of [-1, 1]) {
      m(ell(0.07, 0.11, 0.1), M.cavity, s * 0.39, 0.05, 0.05); m(ell(0.13, 0.13, 0.17), M.joint, s * 0.26, -0.52, 0.27); m(ell(0.07, 0.07, 0.3), M.bone, s * 0.43, -0.12, -0.35);
    }
    for (const s of [-1, 1]) S.limb([s * 0.3, 0.7, 0.0], [s * 0.16, 0.95, 0.3], 0.05, 0.05, { knob: 0 });
    S.limb([-0.24, -0.76, 0.05], [-0.1, -0.98, 0.5], 0.06, 0.06); S.limb([0.24, -0.76, 0.05], [0.1, -0.98, 0.5], 0.06, 0.06); S.limb([-0.1, -0.98, 0.5], [0.1, -0.98, 0.5], 0.05, 0.05);
    // tusks: 1.35 m out of the face, curving out and up
    for (const s of [-1, 1]) S.tube([[s * 0.26, 1.6, 1.62], [s * 0.52, 1.3, 1.97], [s * 0.78, 1.22, 2.32], [s * 0.84, 1.55, 2.58]], 0.1, 0.014, { m: M.ivory, seg: 20, ring: 10 });
    S.rod(0, -0.4, 2.3); S.rod(0, 0.5, 2.55);
    return { grip: 0, apply: S.apply };
  },

  sabrebones(P) {
    const S = ctx(P, { haloSize: 3.8, haloAt: [0, 0.75, -0.1], pool: 1.5, poolAt: [0, -0.1] }), M = S.M;
    for (const s of [-1, 1]) {
      // front leg: shoulder blade, humerus, forearm, paw; hind leg: femur, tibia, hock, paw
      S.blob([s * 0.14, 1.0, 0.28], [0.03, 0.14, 0.1], { rot: [0, 0, s * 0.15] });
      S.chain([[s * 0.15, 0.96, 0.3], [s * 0.17, 0.55, 0.2], [s * 0.16, 0.18, 0.32], [s * 0.16, 0.07, 0.38]], [0.055, 0.045, 0.04, 0.04]);
      S.chain([[s * 0.16, 0.86, -0.55], [s * 0.17, 0.52, -0.35], [s * 0.17, 0.3, -0.64], [s * 0.17, 0.06, -0.5]], [0.065, 0.05, 0.04, 0.04]);
      S.blob([s * 0.13, 0.9, -0.6], [0.045, 0.14, 0.2], { rot: [0.25, 0, 0] });
      for (const [z0, z1] of [[0.38, 0.5], [-0.5, -0.38]]) for (const k of [-1, 0, 1]) S.limb([s * 0.16 + k * 0.02, 0.05, z0], [s * 0.16 + k * 0.04, 0.035, z1], 0.022, 0.02, { knob: 1 });
    }
    S.spine([[0, 0.85, -0.75], [0, 0.9, -0.5], [0, 0.97, -0.22], [0, 1.04, 0.05], [0, 1.08, 0.3], [0, 1.06, 0.45], [0, 1.0, 0.56]], 8, () => 0.07, (u) => (u > 0.25 && u < 0.85 ? 0.1 : 0.04));
    S.spine([[0, 0.82, -0.82], [0, 0.78, -0.98], [0, 0.72, -1.14], [0, 0.66, -1.3]], 5, (u) => 0.065 * (1 - 0.5 * u));
    for (let i = 0; i < 9; i++) { const u = i / 8, z = -0.4 + 0.72 * u, ys = 0.95 + 0.11 * Math.sin(u * 2.3) * 0.8, k = 0.12 + 0.1 * Math.sin(Math.PI * (0.1 + 0.8 * u)); S.ribs(ys, z, k + 0.04, 0.6 - 0.12 * Math.abs(u - 0.4), 0.03, 0.05); }
    S.limb([0, 0.48, -0.35], [0, 0.46, 0.35], 0.035, 0.03);
    // skull: cranium, big muzzle, sockets, two 0.28 m fangs, the jaw open
    const sk = S.part(0, 0.9, 0.68);
    const m = (geo, mt, x, y, z) => S.mesh(sk, geo, mt, x, y, z);
    m(ell(0.17, 0.15, 0.2), M.bone, 0, 0.03, 0.0); m(ell(0.13, 0.11, 0.24), M.bone, 0, -0.07, 0.24); m(ell(0.06, 0.04, 0.2), M.bone, 0, 0.05, 0.22); m(ell(0.03, 0.12, 0.08), M.bone, 0, 0.12, -0.12);
    for (const s of [-1, 1]) {
      m(ell(0.045, 0.05, 0.045), M.cavity, s * 0.14, 0.03, 0.09); m(ell(0.03, 0.04, 0.07), M.cavity, s * 0.115, -0.04, 0.2); m(ell(0.05, 0.05, 0.05), M.joint, s * 0.13, -0.12, 0.0);
      S.mesh(sk, taperGeo([[s * 0.08, -0.14, 0.3], [s * 0.095, -0.27, 0.315], [s * 0.1, -0.42, 0.29]], 0.046, 0.007, 10, 7), M.ivory);
    }
    for (const z of [0.18, 0.26, 0.34]) for (const s of [-1, 1]) S.tooth(sk, s * 0.085, -0.17, z, 0.014, 0.05, false);
    const jaw = new THREE.Group(); jaw.position.set(0, -0.1, 0.02); jaw.rotation.x = 0.62; sk.add(jaw);
    S.mesh(jaw, ell(0.08, 0.04, 0.2), M.bone, 0, -0.02, 0.2); S.mesh(jaw, ell(0.05, 0.05, 0.05), M.joint, 0, -0.03, 0.4);
    for (const z of [0.3, 0.38]) for (const s of [-1, 1]) S.tooth(jaw, s * 0.055, 0.03, z, 0.013, 0.04, true);
    S.rod(0, -0.45, 0.96); S.rod(0, 0.2, 1.06, 0.02);
    return { grip: 0, apply: S.apply };
  },

  pterobones(P) {
    const W = P.spec.wire ?? FOSSILS.ptero.wire;
    const S = ctx(P, { haloSize: 4.0, haloAt: [0, 0.1, 0.1] }), M = S.M;
    S.spine([[0, 0.1, -0.5], [0, 0.11, -0.3], [0, 0.12, -0.05], [0, 0.12, 0.2]], 6, (u) => 0.062 - 0.012 * u, () => 0.05);
    S.spine([[0, 0.12, 0.26], [0, 0.18, 0.4], [0, 0.28, 0.52], [0, 0.34, 0.6]], 5, () => 0.04);
    for (let i = 0; i < 5; i++) S.ribs(0.12, -0.12 + 0.07 * i, 0.12 - 0.01 * Math.abs(i - 2), 0.26, 0.016, 0.03);
    for (const s of [-1, 1]) {
      // wing: arm, forearm, a four-joint wing finger, three little fingers at the wrist
      S.chain([[s * 0.07, 0.09, 0.14], [s * 0.4, 0.2, 0.08], [s * 0.76, 0.14, -0.14]], [0.04, 0.034, 0.03]);
      S.chain([[s * 0.76, 0.14, -0.14], [s * 0.98, 0.115, -0.25], [s * 1.14, 0.09, -0.36], [s * 1.24, 0.07, -0.44], [s * 1.3, 0.05, -0.5]], [0.03, 0.026, 0.022, 0.016, 0.01]);
      for (const k of [0, 1, 2]) S.limb([s * 0.76, 0.14, -0.14], [s * (0.8 + 0.03 * k), 0.17, 0.0 + 0.07 * k], 0.014, 0.01, { knob: 1 });
      S.chain([[s * 0.06, 0.02, -0.4], [s * 0.1, -0.15, -0.55], [s * 0.1, -0.3, -0.72]], [0.03, 0.022, 0.014]);
    }
    // skull: cranium, crest swept back, a long beak, the lower jaw a little open
    const sk = S.part(0, 0.36, 0.7);
    const m = (geo, mt, x, y, z) => S.mesh(sk, geo, mt, x, y, z);
    m(ell(0.075, 0.07, 0.11), M.bone, 0, 0, 0); m(ell(0.02, 0.1, 0.17), M.bone, 0, 0.1, -0.1);
    S.mesh(sk, taperGeo([[0, 0.0, 0.05], [0, -0.01, 0.3], [0, -0.03, 0.55]], 0.05, 0.009, 12, 8), M.bone);
    for (const s of [-1, 1]) { m(ell(0.032, 0.04, 0.04), M.cavity, s * 0.062, 0.015, 0.04); m(ell(0.012, 0.03, 0.05), M.cavity, s * 0.04, -0.02, 0.17); m(ell(0.04, 0.04, 0.05), M.joint, s * 0.05, -0.05, -0.02); }
    for (const z of [0.2, 0.3, 0.4, 0.5]) for (const s of [-1, 1]) S.tooth(sk, s * 0.014, -0.055 + (0.5 - z) * 0.03, z, 0.008, 0.035, false);
    const jaw = new THREE.Group(); jaw.position.set(0, -0.05, 0.0); jaw.rotation.x = 0.22; sk.add(jaw);
    S.mesh(jaw, taperGeo([[0, 0, 0.04], [0, -0.005, 0.25], [0, -0.01, 0.45]], 0.032, 0.007, 12, 8), M.bone);
    // the two wires from the back up to the roof
    for (const z of [0.2, -0.3]) { S.mesh(S.root, new THREE.CylinderGeometry(0.009, 0.009, W - 0.1, 6), M.steel, 0, 0.12 + (W - 0.1) / 2, z); S.mesh(S.root, new THREE.TorusGeometry(0.02, 0.008, 6, 12), M.steel, 0, 0.12, z).rotation.x = Math.PI / 2; }
    return { grip: 0, apply: S.apply };
  },

  lifesparks(P) {
    const R = P.spec.r ?? 1.5, H = P.spec.h ?? 3, N = 40, g = P.whole;
    const ringM = addMat(null, { color: "#a6ff80", opacity: 0 }), ring2M = addMat(null, { color: "#3ccf3a", opacity: 0 });
    const ring = ghost(new THREE.Mesh(new THREE.TorusGeometry(R, 0.035, 8, 72), ringM), 7), ring2 = ghost(new THREE.Mesh(new THREE.TorusGeometry(R, 0.11, 8, 72), ring2M), 6);
    ring.rotation.x = ring2.rotation.x = Math.PI / 2;
    const curtainM = addMat(curtainTex(), { opacity: 0 }), curtain = ghost(new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.96, 1.0, 56, 1, true), curtainM), 4);
    const poolM = addMat(HALO(), { opacity: 0, side: THREE.FrontSide }), pool = ghost(new THREE.Mesh(new THREE.CircleGeometry(R * 1.2, 40), poolM), 2); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.025;
    g.add(ring, ring2, curtain, pool);
    const sparks = Array.from({ length: N }, (_, i) => { const s = new THREE.Sprite(spriteMat(SPARK(), 0)); ghost(s, 8); g.add(s); return s; });
    return {
      grip: 0,
      apply(ps) {
        const rise = clamp(ps.rise ?? 0), on = rise > 0.002 && rise < 0.998; g.visible = on;
        if (!on) return;
        const f = smooth(0, 0.07, rise) * (1 - smooth(0.9, 1, rise)), y = rise * H;
        ring.position.y = ring2.position.y = y; ringM.opacity = 0.9 * f; ring2M.opacity = 0.35 * f;
        const pulse = 1 + 0.03 * Math.sin(rise * 40); ring.scale.set(pulse, pulse, 1); ring2.scale.set(pulse, pulse, 1);
        curtain.position.y = y - 0.5; curtainM.opacity = 0.4 * f; curtain.visible = true;
        poolM.opacity = 0.4 * f * (1 - rise); pool.scale.setScalar(0.7 + 0.5 * rise);
        sparks.forEach((s, i) => {
          const a = hs(i, 0) * Math.PI * 2 + rise * 2.6 * (hs(i, 5) < 0.5 ? 1 : -1), rho = R * (0.45 + 0.6 * hs(i, 1)), lag = 0.12 + 1.6 * hs(i, 2) ** 1.3, sy = y - lag - 0.12 * Math.sin(rise * 22 + i);
          const fs = f * (1 - lag / 1.8) ** 1.2 * smooth(0, 0.05, sy);
          s.visible = fs > 0.01 && sy > 0.01; s.position.set(Math.cos(a) * rho, sy, Math.sin(a) * rho);
          s.material.opacity = fs; s.scale.setScalar((0.1 + 0.16 * hs(i, 4)) * (0.6 + 0.4 * fs) * 2.2);
        });
      },
    };
  },
};
