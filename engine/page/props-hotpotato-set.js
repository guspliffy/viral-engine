import * as THREE from "three";
import { clamp } from "./util.js";
import { FIRE_U } from "./firelight.js";

// Hot Potato (pilot, 11 Nov 2026): the felt preschool-TV game-show set over a deep fryer (task T1; brief
// storyboards/series/hot-potato/01-hot-potato/BRIEF-T1.md, look: panels-sheet.png there). Soft felt and cardboard, pastel
// colours, white stitched borders, cute, and underneath it a huge steel vat of bubbling oil. Pure functions of the params
// and t (no Math.random, no wall clock). World metres, x right, y up, +z toward the camera.
//   hpstudio  origin = the world origin on the KITCHEN floor (y 0). The cast stand on the stage top (y spec.stageH 1.2).
//             stage     top x -2.2..2.2 (stageW 4.4), front edge z stageFront 0.65, back to the wall; warm cream felt top, a wooden
//                       plank fascia (y 0.9-1.2) and five square 0.14 posts (x -2.1, -1.05, 0, 1.05, 2.1) down to the floor, OPEN
//                       between the posts (a dark backing and a soft shadow under the stage). Four 0.9 x 0.9 holes through the top at
//                       x spec.tiles [-1.425, -0.475, 0.475, 1.425], z 0, each lined with a black shaft from y 1.2 down to 0.3.
//             wall      z spec.wallZ -2.7, 10 m wide, y 1.2..8, sky-blue felt (#8fc4ee) with soft darker vertical curtain folds; two
//                       cotton-wool clouds (about 1.0 x 0.45) at (-1.5, 4.0) and (1.5, 4.2).
//             bunting   a string sagging from (-2.8, 6.2) to (2.8, 6.2), lowest 5.8, 14 pennants (pink, yellow, teal, lilac in turn).
//             arch      a flat felt half ring on the stage top, centre (0, 1.2), outer radius spec.archR 2.55, band 0.55, six pastel
//                       stripes, 0.12 in front of the wall (its feet reach x +-2.55: 0.35 past the stage ends, out of the 9:16 frame).
//             sign      a wooden plank spec.signW 3.3 x 0.62 with rounded ends at (0, spec.signY 3.4), 0.25 in front of the wall,
//                       HOT POTATO in bold dark-brown letters with a cream outline, one yellow star (0.3) at each end.
//             sun       centre (0, spec.sunY 5.05), 0.4 in front of the wall: disc radius spec.sunR 0.6, 12 rays to 0.95, closed
//                       happy eyes, a wide smile, pink cheeks.
//             card      a cream rounded card 0.62 x 0.66 with a brown border and a bold digit, centre (0, spec.cardY 3.95), on two
//                       short strings from the sun.
//             Params (ps.<key>, falling back to spec.<key>; all functions of the param and t):
//               num   (1)  the digit on the card, 0..5; -1 hides the card and its strings
//               bump  (0)  0..1 the card swings (+-12 deg, damped by bump) and pops (scale 1 + 0.2 bump): a tick of the clock
//               ring  (0)  0..1 the sun shakes (+-6 deg at 10 Hz) and its rays pulse: the bell at 0
//               sing  (0)  0..1 the smile opens into a round singing mouth
//             Every mesh is userData.solid false + steam (scenery: never touched, out of the light box and ground blobs).
//   hptile    one trapdoor tile. Origin = the tile's centre at the stage top (put it at y 1.2): size spec.w 0.9 square, 0.03
//             thick, its top flush with the stage, felt in spec.color ("#f6b8d0"), a white stitched border 0.05 in from the edge.
//             Hinge along the BACK edge (-z). Params: open 0..1 (the flap swings DOWN into the shaft, 0 flat .. 1 = 95 deg),
//             hot 0..1 (the whole tile turns red #e8343f and glows: strong emissive, a flat glow on the top and a soft red halo
//             0.25 m high standing over it, additive and see-through for the checks). Not solid.
//   hpvat     the frying vat. Origin = the centre of its footprint on the floor, front toward +z. Open steel tub spec.w 4.0 (x) x
//             spec.d 2.9 (z), rim at spec.h 0.55, 5 cm walls, a rolled 6 cm lip, brushed steel (#b9bec7), dark inside (the oil's
//             amber light climbs the inside wall above the oil line). A wire fry basket (0.5 x 0.35 x 0.3, handle out over the lip)
//             hangs inside the RIGHT end near the front (decor). The oil is NOT drawn: add `fryoil` at y 0.47 (w 3.86, d 2.76).
//             spec.castLight k (0.6): the shared fire light (firelight.js FIRE_U) at the vat's centre, oil height, #ff8a2a, k with
//             a +-10 % flicker and up to +50 % with churn. spec.haze (0.35): a gentle steam haze. Param churn 0..1: a surge of
//             bigger puffs rolling up to about 2 m and amber oil droplets hopping. Steel is solid; steam and glow are see-through.
// NOTE for the director: num, sing, hot and churn are not in props3d.js propState's list, so a c.prop sets them in one step at its
// start time instead of easing (bump, ring and open ARE listed and tween). Give them a first value on the prop spec.
const DEG = Math.PI / 180;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const lin = (hex) => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r, c.g, c.b); };
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// see-through glow / steam: never solid, out of the ground blobs and the light box
const ghost = (o, order = 0) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
const scenery = (root) => root.traverse((o) => { if (o.isMesh) { o.userData.solid = false; o.userData.steam = true; } });
const VS = "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const flagged = (m) => { m.transparent = true; m.opacity = 0.4; m.userData.noOutline = true; return m; };

const quiet = (m) => { m.userData.krimK = 0; m.userData.noShine = true; return m; };
// felt: matte, a little of its own colour lifted so the pastels survive the toon lighting
const felt = (hex, k = 0.3, o = {}) => quiet(new THREE.MeshStandardMaterial({ color: hex, roughness: 1, metalness: 0, emissive: hex, emissiveIntensity: k, side: THREE.DoubleSide, ...o }));
// a painted canvas on a standard material, lifted by its own emissive map
const texMat = (map, k = 0.55, o = {}) => quiet(new THREE.MeshStandardMaterial({ map, emissive: "#ffffff", emissiveMap: map, emissiveIntensity: k, roughness: 1, metalness: 0, ...o }));
const flat = (hex, o = {}) => { const m = new THREE.MeshBasicMaterial({ color: hex, ...o }); m.userData.noOutline = true; return m; };
function add(parent, geo, mat, x = 0, y = 0, z = 0, cast = false, recv = false) { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = recv; parent.add(o); return o; }
function canvasTex(w, h, draw, rep = false) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
// felt fibres: a near-white speckle that multiplies the colour (rx, ry: tiles across the surface)
function feltTex(rx, ry) {
  const t = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = "#fff"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 520; i++) { const x = rnd(i) * w, y = rnd(i + 999) * h, a = rnd(i + 3) * 6.283, l = 2 + rnd(i + 7) * 5; g.strokeStyle = rnd(i + 11) > 0.5 ? "rgba(255,255,255,0.7)" : `rgba(120,120,130,${0.08 + 0.14 * rnd(i + 5)})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  }, true);
  t.repeat.set(rx, ry); return t;
}
// a rounded rectangle outline extruded: w along x, d along the shape's y (which becomes -z once stood up), y from y0 up
function rrect(w, d, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0); s.lineTo(x + w, y + d - r);
  s.absarc(x + w - r, y + d - r, r, 0, Math.PI / 2); s.lineTo(x + r, y + d); s.absarc(x + r, y + d - r, r, Math.PI / 2, Math.PI);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5); return s;
}
function slab(w, d, r, y0, depth, hole = null, bevel = null) {
  const sh = rrect(w, d, r); if (hole) sh.holes.push(rrect(hole[0], hole[1], hole[2]));
  const g = new THREE.ExtrudeGeometry(sh, { depth, curveSegments: 8, bevelEnabled: !!bevel, ...(bevel || {}) });
  g.rotateX(-Math.PI / 2); g.translate(0, y0, 0); return g;
}
// an extruded flat felt shape (faces +z), depth d with a small round bevel
const cut = (shape, d = 0.03, b = 0.006) => new THREE.ExtrudeGeometry(shape, { depth: d, curveSegments: 12, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2 });
function bars(list, rad, mat, sides = 5) {
  const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(rad, rad, 1, sides, 1), mat, list.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), A = new THREE.Vector3(), B = new THREE.Vector3(), d = new THREE.Vector3(), mid = new THREE.Vector3(), sc = new THREE.Vector3();
  list.forEach(([a, b], i) => {
    A.set(...a); B.set(...b); d.subVectors(B, A); const len = d.length(); mid.addVectors(A, B).multiplyScalar(0.5);
    q.setFromUnitVectors(up, d.normalize()); m4.compose(mid, q, sc.set(1, len, 1)); im.setMatrixAt(i, m4);
  });
  im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; im.castShadow = true; return im;
}
// one thin rod between two points
function rod(parent, a, b, rad, mat, sides = 6) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
  const o = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, sides), mat); o.position.copy(A).add(B).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); parent.add(o); return o;
}
// a soft radial blob (alpha) for the cheeks
const blobTex = (hex) => canvasTex(64, 64, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, hex); r.addColorStop(0.55, hex); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, w, h); });
// wood: vertical boards (n across), grain lines, dark seams, a few nail heads
const woodTex = (w, h, n) => canvasTex(w, h, (g) => {
  const bw = w / n;
  for (let i = 0; i < n; i++) {
    const tone = ["#c98d55", "#bd8049", "#d29a62", "#c08550"][i % 4]; g.fillStyle = tone; g.fillRect(i * bw, 0, bw, h);
    for (let k = 0; k < 9; k++) { g.strokeStyle = `rgba(110,60,25,${0.1 + 0.12 * rnd(i * 31 + k)})`; g.lineWidth = 1 + rnd(i * 17 + k) * 2; const x = i * bw + (0.08 + 0.84 * rnd(i * 13 + k + 4)) * bw; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (rnd(i + k) - 0.5) * 5, h); g.stroke(); }
    g.fillStyle = "rgba(70,35,14,0.65)"; g.fillRect(i * bw, 0, 3, h);
    g.fillStyle = "rgba(60,30,12,0.55)"; for (const y of [0.12, 0.88]) { g.beginPath(); g.arc(i * bw + bw / 2, y * h, 3, 0, 6.3); g.fill(); }
  }
});

// ---------------------------------------------------------------- the studio
const SUN_FACE = (parent, k) => {
  const brown = flat("#7a3a12"), z = 0.04;
  for (const sx of [-1, 1]) { const eye = add(parent, new THREE.TorusGeometry(0.072 * k, 0.021 * k, 6, 18, Math.PI), brown, sx * 0.19 * k, 0.1 * k, z); eye.renderOrder = 3; }
  const cheekM = flat("#ff7aa2", { map: blobTex("#ff7aa2"), transparent: true, depthWrite: false });
  for (const sx of [-1, 1]) { const c = add(parent, new THREE.PlaneGeometry(0.21 * k, 0.21 * k), cheekM, sx * 0.31 * k, -0.04 * k, z - 0.004); c.renderOrder = 2; }
  const smile = add(parent, new THREE.TorusGeometry(0.2 * k, 0.02 * k, 6, 24, 1.9), brown, 0, 0.12 * k, z); smile.rotation.z = -Math.PI / 2 - 0.95; smile.renderOrder = 3;
  const mouth = new THREE.Group(); mouth.position.set(0, -0.06 * k, z); parent.add(mouth);
  const m0 = add(mouth, new THREE.CircleGeometry(0.105 * k, 24), flat("#7a2c12"), 0, 0, 0); m0.scale.y = 1.25; m0.renderOrder = 3;
  const m1 = add(mouth, new THREE.CircleGeometry(0.06 * k, 20), flat("#ff8a9a"), 0, -0.05 * k, 0.003); m1.scale.set(1.15, 0.7, 1); m1.renderOrder = 4;
  return { smile, mouth };
};

const HP_STUDIO = (P) => {
  const S = P.spec, W = S.stageW ?? 4.4, SH = S.stageH ?? 1.2, SF = S.stageFront ?? 0.65, WZ = S.wallZ ?? -2.7;
  const TX = S.tiles ?? [-1.425, -0.475, 0.475, 1.425];
  const ARCH_R = S.archR ?? 2.55, SIGN_W = S.signW ?? 3.3, SIGN_Y = S.signY ?? 3.4, SUN_Y = S.sunY ?? 5.05, SUN_R = S.sunR ?? 0.6, CARD_Y = S.cardY ?? 3.95;
  const root = P.whole;

  // ---- the stage: cream felt top with four holes, a plank fascia, five posts, the open dark space under it
  const TOP_T = 0.06, FZ = SF - 0.05;   // the top runs to z FZ; the 5 cm plank strip (wood) closes the front edge at SF
  const sh = new THREE.Shape(); sh.moveTo(-W / 2, -FZ); sh.lineTo(W / 2, -FZ); sh.lineTo(W / 2, -WZ); sh.lineTo(-W / 2, -WZ); sh.closePath();
  for (const x of TX) { const h = new THREE.Path(); h.moveTo(x - 0.45, -0.45); h.lineTo(x + 0.45, -0.45); h.lineTo(x + 0.45, 0.45); h.lineTo(x - 0.45, 0.45); h.closePath(); sh.holes.push(h); }
  const topG = new THREE.ExtrudeGeometry(sh, { depth: TOP_T, bevelEnabled: false }); topG.rotateX(-Math.PI / 2); topG.translate(0, SH - TOP_T, 0);
  add(root, topG, felt("#efdcae", 0.1, { map: feltTex(1.2, 1.2), side: THREE.FrontSide }), 0, 0, 0, false, true);
  const wood = texMat(woodTex(1024, 128, 8), 0.3, {}), woodPost = texMat(woodTex(64, 256, 1), 0.3, {});
  const fas = add(root, new THREE.BoxGeometry(W, 0.3, SF - FZ), wood, 0, SH - 0.15, (SF + FZ) / 2, true, true); fas.name = "hp-fascia";   // y 0.9-1.2, front face at z SF
  for (const x of [-2.1, -1.05, 0, 1.05, 2.1]) add(root, new THREE.BoxGeometry(0.14, SH - 0.3, 0.14), woodPost, x, (SH - 0.3) / 2, SF - 0.07 + 0.006, true, true);
  // the black shafts under the holes: a black box with no top (you look down into it through the hole, and from the front,
  // between the posts, it is a black wall: a body dropping in is never seen through the stage front). Each is a little wider
  // than its hole so the four run together into one block (no grey slivers in the 5 cm between holes) and 0.11 deeper to the
  // back, so the flap of an open tile (it leans 5 degrees past straight down) hangs in front of the shaft's back wall
  const shaftM = new THREE.MeshBasicMaterial({ color: "#000000", side: THREE.DoubleSide }); shaftM.userData.noOutline = true;
  const shaftTop = new THREE.MeshBasicMaterial({ visible: false });
  for (const x of TX) add(root, new THREE.BoxGeometry(0.99, SH - 0.3, 1.0), [shaftM, shaftM, shaftTop, shaftM, shaftM, shaftM], x, 0.3 + (SH - 0.3) / 2, -0.06);
  // under the stage: a dark backing at the wall and a soft shadow on the floor
  const back = add(root, new THREE.PlaneGeometry(W + 0.2, SH), felt("#2a1f27", 0.1), 0, SH / 2 - 0.02, WZ + 0.02); back.receiveShadow = false;
  const shadeM = new THREE.ShaderMaterial({
    uniforms: {}, vertexShader: VS, transparent: true, depthWrite: false, opacity: 0.4,
    fragmentShader: "varying vec2 vUv; void main() { float f = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.82, vUv.y) * (0.55 + 0.45 * smoothstep(0.0, 0.5, 1.0 - vUv.y + 0.2)); gl_FragColor = vec4(0.0, 0.0, 0.0, 0.62 * min(1.0, f + 0.25)); }",
  }); shadeM.userData.noOutline = true;
  const shade = add(root, new THREE.PlaneGeometry(W, SF - WZ), shadeM, 0, 0.003, (SF + WZ) / 2); shade.rotation.x = -Math.PI / 2; ghost(shade, 1);

  // ---- the back wall: sky-blue felt with soft vertical curtain folds
  const WH = 8 - SH, wallTex = canvasTex(1024, 696, (g, w, h) => {
    g.fillStyle = "#7fbbf2"; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x++) {
      const f = Math.sin(x * 0.0615 + 1.4 * Math.sin(x * 0.0113)) * 0.5 + 0.5, f2 = Math.sin(x * 0.0231 + 0.7) * 0.5 + 0.5;
      g.fillStyle = `rgba(52,104,170,${0.03 + 0.16 * f * f * (0.5 + 0.5 * f2)})`; g.fillRect(x, 0, 1, h);
      g.fillStyle = `rgba(210,238,255,${0.05 * (1 - f) * f2})`; g.fillRect(x, 0, 1, h);
    }
    const v = g.createLinearGradient(0, 0, 0, h); v.addColorStop(0, "rgba(255,255,255,0)"); v.addColorStop(1, "rgba(40,80,140,0.18)"); g.fillStyle = v; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(255,255,255,${0.04 + 0.05 * rnd(i + 5)})`; g.fillRect(rnd(i) * w, rnd(i + 77) * h, 1 + rnd(i + 9) * 2, 1); }
  });
  add(root, new THREE.PlaneGeometry(10, WH), texMat(wallTex, 0.8, { side: THREE.FrontSide }), 0, SH + WH / 2, WZ, false, true);

  // ---- two cotton-wool clouds
  const cloudM = felt("#ffffff", 0.34);
  const puffs = [[-0.34, -0.03, 0.17], [-0.17, 0.07, 0.2], [0.06, 0.1, 0.21], [0.27, 0.03, 0.18], [0.4, -0.06, 0.12], [-0.45, -0.08, 0.11], [-0.05, -0.07, 0.17], [0.17, -0.08, 0.15], [-0.22, -0.09, 0.14]];
  for (const [cx, cy] of [[-1.5, 4.0], [1.5, 4.2]]) {
    const g = new THREE.Group(); g.position.set(cx, cy, WZ + 0.13); root.add(g);
    puffs.forEach(([x, y, r], i) => { const o = add(g, new THREE.SphereGeometry(r, 16, 12), cloudM, x * (cx < 0 ? 1 : -1), y, 0); o.scale.z = 0.42; });
  }

  // ---- bunting: a string sagging to y 5.8 and 14 felt pennants
  const sagY = (x) => 6.2 - 0.4 * (1 - (x / 2.8) ** 2);
  const stringPts = Array.from({ length: 29 }, (_, i) => { const x = -2.8 + (i / 28) * 5.6; return new THREE.Vector3(x, sagY(x), WZ + 0.2); });
  add(root, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(stringPts), 56, 0.009, 5), flat("#6a4a5a"), 0, 0, 0);
  const tri = new THREE.Shape(); tri.moveTo(-0.14, 0); tri.lineTo(0.14, 0); tri.lineTo(0, -0.34); tri.closePath();
  const triG = new THREE.ExtrudeGeometry(tri, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.006, bevelSegments: 1 });
  const penM = ["#f29ac0", "#f7d154", "#6fcfc3", "#b69be6"].map((c) => felt(c, 0.34));
  for (let i = 0; i < 14; i++) {
    const x = -2.8 + (i + 0.5) * (5.6 / 14), p = add(root, triG, penM[i % 4], x, sagY(x) - 0.005, WZ + 0.2);
    p.rotation.z = Math.atan2(0.4 * 2 * x / 2.8 ** 2, 1);
  }

  // ---- the rainbow arch: six felt stripes of a half ring, 0.12 in front of the wall
  const STRIPES = ["#f4a3a3", "#f8c58c", "#f9e79a", "#a9e0a5", "#9ccdf2", "#c6aef0"], BAND = 0.55, SW = BAND / 6;
  STRIPES.forEach((c, i) => {
    const ro = ARCH_R - i * SW, ri = ro - SW, s = new THREE.Shape(); s.absarc(0, 0, ro, 0, Math.PI, false); s.absarc(0, 0, ri, Math.PI, 0, true); s.closePath();
    add(root, cut(s, 0.025, 0.003), felt(c, 0.36), 0, SH, WZ + 0.12 - 0.013, false, true);
  });

  // ---- the sign: a wooden plank with rounded ends, HOT POTATO, a star at each end
  const SIGN_H = 0.62, SZ = WZ + 0.25;
  const signTex = canvasTex(2048, 386, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    rr(g, 0, 0, w, h, h / 2); g.fillStyle = "#5a2f16"; g.fill();
    g.save(); rr(g, 22, 22, w - 44, h - 44, (h - 44) / 2); g.clip(); g.fillStyle = "#d9a066"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 46; i++) { g.strokeStyle = `rgba(130,78,34,${0.07 + 0.1 * rnd(i + 2)})`; g.lineWidth = 1 + rnd(i) * 3; const y = rnd(i + 40) * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + (rnd(i + 8) - 0.5) * 16, w * 0.65, y + (rnd(i + 9) - 0.5) * 16, w, y + (rnd(i + 7) - 0.5) * 10); g.stroke(); }
    const hl = g.createLinearGradient(0, 22, 0, h - 22); hl.addColorStop(0, "rgba(255,235,190,0.28)"); hl.addColorStop(0.45, "rgba(255,235,190,0)"); hl.addColorStop(1, "rgba(90,50,20,0.16)"); g.fillStyle = hl; g.fillRect(0, 0, w, h);
    g.restore();
    const txt = "HOT POTATO"; g.font = '900 300px Inter, "Liberation Sans", sans-serif'; const m0 = g.measureText(txt), fs = 300 * Math.min(1, 1640 / m0.width);
    g.font = `900 ${fs}px Inter, "Liberation Sans", sans-serif`; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.lineJoin = "round";
    const m = g.measureText(txt), ty = h / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2 + 3;
    g.strokeStyle = "#fff1d0"; g.lineWidth = 30; g.strokeText(txt, w / 2, ty);
    g.strokeStyle = "#6b3a1f"; g.lineWidth = 9; g.strokeText(txt, w / 2, ty); g.fillStyle = "#6b3a1f"; g.fillText(txt, w / 2, ty);
  });
  const sg = new THREE.Group(); sg.position.set(0, SIGN_Y, SZ); root.add(sg);
  const signPill = rrect(SIGN_W, SIGN_H, SIGN_H / 2); 
  const bodyG = new THREE.ExtrudeGeometry(signPill, { depth: 0.04, bevelEnabled: false, curveSegments: 16 }); bodyG.translate(0, 0, -0.04);
  add(sg, bodyG, felt("#5a2f16", 0.3), 0, 0, -0.002, true, true);
  const face = add(sg, new THREE.PlaneGeometry(SIGN_W, SIGN_H), texMat(signTex, 0.35, { transparent: true, alphaTest: 0.5, side: THREE.FrontSide }), 0, 0, 0.001); face.userData.noOutline = true;
  const star = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 0.07 : 0.15; (i ? star.lineTo : star.moveTo).call(star, Math.cos(a) * r, Math.sin(a) * r); } star.closePath();
  const starG = cut(star, 0.02, 0.008), starM = felt("#ffd84a", 0.4);
  for (const sx of [-1, 1]) { const s = add(sg, starG, starM, sx * (SIGN_W / 2 + 0.03), 0.01, 0.014, false, false); s.rotation.z = sx * 12 * DEG; }

  // ---- the sun: disc, 12 rays, a happy face; shakes with `ring`, smile opens with `sing`
  const SK = SUN_R / 0.6, SZS = WZ + 0.4;
  const sun = new THREE.Group(); sun.position.set(0, SUN_Y, SZS); root.add(sun);
  const rays = new THREE.Group(); sun.add(rays);
  const rayShape = new THREE.Shape(); rayShape.moveTo(-0.15 * SK, 0); rayShape.lineTo(0.15 * SK, 0); rayShape.lineTo(0, 0.37 * SK); rayShape.closePath();
  const rayG = cut(rayShape, 0.02, 0.008), rayM = felt("#ffc431", 0.42);
  for (let i = 0; i < 12; i++) { const a = new THREE.Group(); a.rotation.z = (i / 12) * Math.PI * 2; rays.add(a); add(a, rayG, rayM, 0, 0.58 * SK, -0.03); }
  const disc = (r, t, m, z) => { const g = new THREE.CylinderGeometry(r, r, t, 40); g.rotateX(Math.PI / 2); return add(sun, g, m, 0, 0, z); };
  disc(SUN_R * 1.07, 0.03, felt("#f08a24", 0.4), 0.0); disc(SUN_R, 0.04, felt("#ffd23f", 0.44), 0.016);
  const faceG = new THREE.Group(); sun.add(faceG); const { smile, mouth } = SUN_FACE(faceG, SK);

  // ---- the number card on two short strings, swinging from the sun's lower edge
  const PIV_Y = CARD_Y + 0.53;
  const pivot = new THREE.Group(); pivot.position.set(0, PIV_Y, SZS + 0.03); root.add(pivot);
  const strM = flat("#6a4a3a");
  for (const sx of [-1, 1]) rod(pivot, [sx * 0.2, -0.02, 0], [sx * 0.2, -0.2, 0], 0.007, strM, 5);
  const cardG = new THREE.Group(); cardG.position.set(0, -0.53, 0); pivot.add(cardG);
  const cardBody = new THREE.ExtrudeGeometry(rrect(0.66, 0.7, 0.08), { depth: 0.024, bevelEnabled: false, curveSegments: 10 }); cardBody.translate(0, 0, -0.024);
  add(cardG, cardBody, felt("#7a4a28", 0.3), 0, 0, 0.0);
  const digits = [];
  for (let n = 0; n <= 5; n++) {
    const tex = canvasTex(256, 272, (g, w, h) => {
      g.clearRect(0, 0, w, h); rr(g, 0, 0, w, h, 30); g.fillStyle = "#fff3da"; g.fill();
      g.setLineDash([14, 10]); g.lineCap = "round"; g.strokeStyle = "#9a6a48"; g.lineWidth = 4.5; rr(g, 16, 16, w - 32, h - 32, 20); g.stroke(); g.setLineDash([]);
      g.font = '900 290px Inter, "Liberation Sans", sans-serif'; g.textAlign = "center"; g.textBaseline = "alphabetic"; const m = g.measureText(String(n));
      g.fillStyle = "#5b3418"; g.fillText(String(n), w / 2, h / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
    });
    const d = add(cardG, new THREE.PlaneGeometry(0.62, 0.66), texMat(tex, 0.35, { transparent: true, alphaTest: 0.5, side: THREE.FrontSide }), 0, 0, 0.002); d.userData.noOutline = true; digits.push(d);
  }
  scenery(root);

  return {
    grip: 0,
    apply(ps, t) {
      const tt = t ?? 0, num = Math.round(ps.num ?? S.num ?? 1), bump = clamp(ps.bump || (S.bump ?? 0)), ring = clamp(ps.ring || (S.ring ?? 0)), sing = clamp(ps.sing ?? S.sing ?? 0);
      // the card: swings (damped by bump) and pops; -1 hides it and its strings
      pivot.visible = num >= 0;
      digits.forEach((d, i) => { d.visible = i === num; });
      pivot.rotation.z = 12 * DEG * bump * Math.sin(tt * 20);
      cardG.scale.setScalar(1 + 0.2 * bump);
      // the sun: a +-6 degree wiggle at about 10 Hz and pulsing rays with ring; a slow sway of the rays at rest
      sun.rotation.z = 6 * DEG * ring * Math.sin(tt * Math.PI * 20);
      rays.scale.setScalar(1 + 0.16 * ring * (0.5 + 0.5 * Math.sin(tt * Math.PI * 10)));
      rays.rotation.z = 0.025 * Math.sin(tt * 0.9);
      smile.visible = sing < 0.99; smile.scale.setScalar(Math.max(0.001, 1 - sing));
      mouth.visible = sing > 0.01; mouth.scale.set(Math.max(0.001, sing), Math.max(0.001, sing), 1);
    },
  };
};

// ---------------------------------------------------------------- the trapdoor tile
const HP_TILE = (P) => {
  const S = P.spec, w = S.w ?? 0.9, col = S.color || "#f6b8d0";
  // (looks.js copies a material's colour and emissive colour once, then follows only emissiveIntensity and opacity: so the
  // tile does not recolour itself. A second, red felt body of the same shape lies over it and fades in with opacity = hot.)
  const bodyM = felt(new THREE.Color(col).multiplyScalar(0.9), 0.08, { map: feltTex(1, 1), side: THREE.FrontSide });
  const redM = felt("#e8343f", 0.0, { emissive: "#ff2230", side: THREE.FrontSide, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  // the flap hangs from its BACK edge: the hinge is a group on the back edge, positive rotation.x drops the front edge
  const hinge = new THREE.Group(); hinge.position.set(0, 0, -w / 2 + 0.002); P.whole.add(hinge);
  const bodyG = slab(w - 0.012, w - 0.012, 0.035, -0.019, 0.016, null, { bevelThickness: 0.007, bevelSize: 0.004, bevelSegments: 2 });
  const body = add(hinge, bodyG, bodyM, 0, 0, w / 2 - 0.002, false, true); body.name = "hp-tile";
  const red = add(hinge, bodyG, redM, 0, 0.0005, w / 2 - 0.002); red.scale.set(1.004, 1, 1.004); red.renderOrder = 1;
  // a dark veil fades in over the flap as it swings down, so an open tile reads as a hole from a camera 10 degrees above (it
  // would otherwise show the flap's pink face hanging at the back of the shaft)
  const dimM = felt("#160d12", 0.0, { emissive: "#000000", side: THREE.FrontSide, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const dim = add(hinge, bodyG, dimM, 0, 0.001, w / 2 - 0.002); dim.scale.set(1.006, 1, 1.006); dim.renderOrder = 2;
  // the white stitched border 0.05 in from the edge: dashes drawn on a see-through plane just over the felt
  const stitchTex = canvasTex(512, 512, (g, W, H) => {
    g.clearRect(0, 0, W, H); const k = W / w, ins = 0.05 * k;
    g.setLineDash([0.05 * k, 0.034 * k]); g.lineCap = "round"; g.strokeStyle = "#fffaf0"; g.lineWidth = 0.0125 * k; rr(g, ins, ins, W - 2 * ins, H - 2 * ins, 0.04 * k); g.stroke();
  });
  const stitchM = new THREE.MeshBasicMaterial({ map: stitchTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); stitchM.userData.noOutline = true;
  const st = add(hinge, new THREE.PlaneGeometry(w - 0.01, w - 0.01), stitchM, 0, 0.0055, w / 2 - 0.002); st.rotation.x = -Math.PI / 2; st.renderOrder = 2;
  // the hot glow: a flat red bloom on the top, and a soft red halo 0.25 m high standing over the tile (crossed, additive)
  const glowM = (fs) => { const m = new THREE.ShaderMaterial({
    uniforms: { uA: { value: 0 }, uCol: { value: lin("#ff2a36") } }, vertexShader: VS, transparent: true, depthWrite: false, opacity: 0.3, side: THREE.DoubleSide,   // normal blending: additive red cannot show on the cream stage
    fragmentShader: fs }); m.userData.noOutline = true; return m; };
  const haloFs = "uniform vec3 uCol; uniform float uA; varying vec2 vUv; void main() { float e = 1.0 - smoothstep(0.55, 1.0, abs(vUv.x - 0.5) * 2.0); float a = uA * e * pow(1.0 - vUv.y, 1.5) * smoothstep(0.0, 0.04, vUv.y); gl_FragColor = vec4(uCol, a); }";
  const topFs = "uniform vec3 uCol; uniform float uA; varying vec2 vUv; void main() { vec2 q = abs(vUv - 0.5) * 2.0; float a = uA * (1.0 - smoothstep(0.5, 1.0, max(q.x, q.y))); gl_FragColor = vec4(uCol, a); }";
  const haloA = glowM(haloFs), haloB = glowM(haloFs), topGlow = glowM(topFs);
  const hz = ghost(new THREE.Mesh(new THREE.PlaneGeometry(w * 1.5, 0.3), haloA), 4); hz.position.set(0, 0.15, w * 0.2); P.whole.add(hz);
  const hx = ghost(new THREE.Mesh(new THREE.PlaneGeometry(w * 1.1, 0.3), haloB), 4); hx.position.set(0, 0.15, 0); hx.rotation.y = Math.PI / 2; P.whole.add(hx);
  const tg = ghost(new THREE.Mesh(new THREE.PlaneGeometry(w * 1.45, w * 1.45), topGlow), 3); tg.rotation.x = -Math.PI / 2; tg.position.y = 0.009; P.whole.add(tg);
  scenery(P.whole);
  return {
    grip: 0,
    apply(ps, t) {
      const tt = t ?? 0, open = clamp(ps.open ?? S.open ?? 0), hot = clamp(ps.hot ?? S.hot ?? 0); const pulse = 0.9 + 0.1 * Math.sin(tt * 6.2);
      hinge.rotation.x = open * 95 * DEG;
      // the red body fades in over the pastel one and its emissive blazes (the camera sees the top at about 10 degrees)
      stitchM.opacity = 1 - 0.8 * open; dimM.opacity = 0.82 * clamp(open * 2); dim.visible = open > 0.01;   // the flap hangs in the dark shaft: its stitches fade so an open tile reads as a hole
      redM.opacity = hot; redM.emissiveIntensity = hot * 0.9 * pulse; red.visible = hot > 0.01;
      const on = hot > 0.01; hz.visible = hx.visible = tg.visible = on;
      haloA.uniforms.uA.value = 0.9 * hot * pulse; haloB.uniforms.uA.value = 0.4 * hot * pulse; topGlow.uniforms.uA.value = 0.5 * hot * pulse;
    },
  };
};

// ---------------------------------------------------------------- the frying vat
const steelTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#f4f5f7"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 240; i++) { const y = rnd(i) * h, l = 60 + rnd(i + 400) * 190, x = rnd(i + 800) * w, a = 0.05 + rnd(i + 1200) * 0.1; g.fillStyle = rnd(i + 5) > 0.5 ? `rgba(255,255,255,${a})` : `rgba(60,66,76,${a})`; g.fillRect(x, y, l, 1 + (rnd(i + 9) > 0.8 ? 1 : 0)); g.fillRect(x - w, y, l, 1); }
}, true);
// a puff of steam: a camera-facing disc, orange from the oil's glow low down (uLow 1), pale and cool higher up
function puffMat() {
  const m = new THREE.ShaderMaterial({
    uniforms: { uR: { value: 0.1 }, uA: { value: 0 }, uSeed: { value: 0 }, uTime: { value: 0 }, uLow: { value: 1 } },
    vertexShader: `uniform float uR; varying vec2 vUv;
      void main() { vUv = uv; vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); c.xy += (uv - 0.5) * 2.0 * uR; gl_Position = projectionMatrix * c; }`,
    fragmentShader: `uniform float uA, uSeed, uTime, uLow; varying vec2 vUv;
      void main() {
        vec2 q = (vUv - 0.5) * 2.0; float a = atan(q.y, q.x), r = length(q);
        float edge = 0.86 + 0.08 * sin(a * 4.0 + uSeed * 6.3 + uTime * 1.5) + 0.05 * sin(a * 7.0 - uSeed * 2.0 - uTime * 1.1);
        float d = r / edge; if (d > 1.0) discard;
        vec3 cool = vec3(0.62, 0.62, 0.78), warm = vec3(1.0, 0.5, 0.2);
        vec3 col = mix(cool, warm, uLow * (0.55 + 0.35 * smoothstep(-0.8, 0.8, -q.y)));
        col = mix(col, vec3(1.0, 0.95, 0.9), (1.0 - uLow) * 0.25 * (1.0 - d));
        gl_FragColor = vec4(col, uA * (1.0 - smoothstep(0.4, 1.0, d)));
      }`,
    transparent: true, depthWrite: false, opacity: 0.4,
  });
  m.userData.noOutline = true; return m;
}
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...o });

const HP_VAT = (P) => {
  const S = P.spec, W = S.w ?? 4.0, D = S.d ?? 2.9, H = S.h ?? 0.55, WT = 0.05, OIL = S.oilY ?? 0.47;
  const stTex = steelTex(); stTex.repeat.set(W / 1.2, 1);
  const steel = std(S.color || "#b9bec7", { map: stTex, roughness: 0.38, metalness: 0.5, emissive: "#6a6f78" });
  const steel2 = std("#cfd3da", { map: stTex, roughness: 0.32, metalness: 0.55, emissive: "#80858e" });
  const dark = std("#3a3d44", { roughness: 0.55, metalness: 0.4, emissive: "#1c1e24" });
  const wireM = std("#c9cdd3", { roughness: 0.3, metalness: 0.6, emissive: "#14161a" });
  const black = std("#1a1b20", { roughness: 0.45, metalness: 0.15, emissive: "#0a0a0c" });
  const root = P.whole, IW = W - 2 * WT, ID = D - 2 * WT;

  // the tub: one rounded shell with an opening, a floor plate, a rolled lip on top (rim at H)
  const shell = add(root, slab(W, D, 0.12, 0.0, H - 0.04, [IW, ID, 0.07]), steel, 0, 0, 0, true, true); shell.name = "hpvat-body";
  add(root, slab(IW + 0.01, ID + 0.01, 0.07, 0.0, 0.05), dark);
  const lipHole = [IW + 0.03, ID + 0.03, 0.065];
  add(root, slab(W - 0.03, D - 0.03, 0.11, H - 0.037, 0.02, lipHole, { bevelThickness: 0.017, bevelSize: 0.0145, bevelSegments: 4 }), steel2, 0, 0, 0, true, true);
  // a dark plinth line and a stiffening bead round the outside
  const bead = (w, d, x, z, y, h = 0.028, t = 0.014) => add(root, new THREE.BoxGeometry(w, h, d), steel2, x, y, z, false);
  bead(W - 0.22, 0.014, 0, D / 2 + 0.005, 0.27); bead(W - 0.22, 0.014, 0, -D / 2 - 0.005, 0.27); bead(0.014, D - 0.22, W / 2 + 0.005, 0, 0.27); bead(0.014, D - 0.22, -W / 2 - 0.005, 0, 0.27);
  bead(W - 0.2, 0.012, 0, D / 2 + 0.004, 0.04, 0.05); bead(W - 0.2, 0.012, 0, -D / 2 - 0.004, 0.04, 0.05);
  // two end handles
  for (const sx of [-1, 1]) for (const z of [-0.55, 0.55]) add(root, new THREE.BoxGeometry(0.1, 0.03, 0.03), dark, sx * (W / 2 + 0.05), 0.38, z, true);
  for (const sx of [-1, 1]) add(root, new THREE.BoxGeometry(0.03, 0.03, 1.14), dark, sx * (W / 2 + 0.1), 0.38, 0, true);

  // the vat's inside: dark steel, and the oil's orange light climbs the wall from the oil line
  const wallM = new THREE.ShaderMaterial({
    uniforms: { uDark: { value: lin("#2a2d34") }, uHot: { value: lin("#ff7a1a") }, uOil: { value: OIL }, uK: { value: 1 } },
    vertexShader: "varying float vH; void main() { vH = (modelMatrix * vec4(position, 1.0)).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 uDark, uHot; uniform float uOil, uK; varying float vH; void main() { float g = (1.0 - smoothstep(uOil, uOil + 0.075, vH)) * uK; gl_FragColor = vec4(mix(uDark, uHot * 1.5, g * 0.85), 1.0); }",
  }); wallM.userData.noOutline = true;
  const wall = (w, h, d, x, y, z) => add(root, new THREE.BoxGeometry(w, h, d), wallM, x, y, z, false);
  wall(IW - 0.02, H - 0.1, 0.01, 0, 0.05 + (H - 0.1) / 2, -ID / 2 + 0.01); wall(IW - 0.02, H - 0.1, 0.01, 0, 0.05 + (H - 0.1) / 2, ID / 2 - 0.01);
  wall(0.01, H - 0.1, ID - 0.02, -IW / 2 + 0.01, 0.05 + (H - 0.1) / 2, 0); wall(0.01, H - 0.1, ID - 0.02, IW / 2 - 0.01, 0.05 + (H - 0.1) / 2, 0);

  // the wire fry basket (decor): inside the right end near the front, handle out over the lip
  const bw = 0.5, bd = 0.35, bh = 0.3, bx = W / 2 - 0.45, bz = D / 2 - 0.4, by0 = 0.4;
  const bk = new THREE.Group(); bk.position.set(bx, by0, bz); root.add(bk);
  const wires = [];
  for (let u = -bw / 2; u <= bw / 2 + 1e-6; u += bw / 8) for (const s of [-1, 1]) wires.push([[u, 0, s * bd / 2], [u, bh, s * bd / 2]]);
  for (let u = -bd / 2 + bd / 4; u < bd / 2 - 1e-6; u += bd / 4) for (const s of [-1, 1]) wires.push([[s * bw / 2, 0, u], [s * bw / 2, bh, u]]);
  for (const y of [0, bh * 0.5, bh]) for (const s of [-1, 1]) { wires.push([[-bw / 2, y, s * bd / 2], [bw / 2, y, s * bd / 2]]); wires.push([[s * bw / 2, y, -bd / 2], [s * bw / 2, y, bd / 2]]); }
  for (let u = -bw / 2; u <= bw / 2 + 1e-6; u += bw / 6) wires.push([[u, 0, -bd / 2], [u, 0, bd / 2]]);
  bk.add(bars(wires, 0.0048, wireM, 4));
  // the handle: two wires from the basket's right top edge, down onto the lip (it rests there), out and up, a black grip
  const lipX = W / 2 - 0.03 - bx, lipY = H + 0.025 - by0;   // the lip's top in the basket's own frame
  for (const dz of [-0.04, 0.04]) bk.add(bars([[[bw / 2, bh, dz], [lipX, lipY, dz]], [[lipX, lipY, dz], [lipX + 0.2, lipY + 0.18, dz]]], 0.0065, wireM, 5));
  const grip = add(bk, new THREE.CylinderGeometry(0.019, 0.021, 0.26, 12), black, lipX + 0.2 + 0.1, lipY + 0.18 + 0.09, 0, true); grip.rotation.z = -Math.atan2(0.2, 0.18);

  // ---- steam, droplets, light: all see-through. Copied from ssfryer (props-sos-set.js) for a 4 x 2.9 m vat: sizes x2.2
  const haze = S.haze ?? 0.35, KS = 2.2, steam = [];
  const puff = (o) => { const m = puffMat(); m.uniforms.uSeed.value = rnd(o.i + 5); const mesh = ghost(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), 5 + (o.i % 3)); root.add(mesh); steam.push({ ...o, mesh, m }); };
  const spread = (a, b) => [(rnd(a) - 0.5) * (IW - 0.5), (rnd(b) - 0.5) * (ID - 0.6)];
  for (let i = 0; i < 12; i++) { const [x, z] = spread(i, i + 7); puff({ k: "base", i, per: 3.0 + rnd(i + 3) * 1.4, ph: rnd(i + 11), x, z }); }
  for (let i = 0; i < 16; i++) { const [x, z] = spread(i + 17, i + 27); puff({ k: "surge", i: i + 20, per: 1.45 + rnd(i + 23) * 0.35, ph: i / 16 + rnd(i + 31) * 0.05, x, z }); }
  for (let i = 0; i < 6; i++) { const [x, z] = spread(i + 47, i + 57); puff({ k: "veil", i: i + 40, per: 6.5 + rnd(i + 43) * 2, ph: rnd(i + 51), x: x * 0.8, z: z * 0.8 }); }
  const dropM = new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffb43a").multiplyScalar(1.5), transparent: true, opacity: 0.45, depthWrite: false }); dropM.userData.noOutline = true;
  const drops = Array.from({ length: 18 }, (_, i) => {
    const o = ghost(new THREE.Mesh(new THREE.SphereGeometry(0.0145 * 1.6, 8, 6), dropM), 6); root.add(o);
    return { o, h: 0.1 + 0.25 * rnd(i + 70), per: 0.9 + 0.5 * rnd(i + 80), ph: rnd(i + 90), thr: 0.04 + 0.78 * (i / 18), x: (rnd(i + 100) - 0.5) * (IW - 0.5), z: (rnd(i + 110) - 0.5) * (ID - 0.6) };
  });
  const light = new THREE.PointLight("#ff8a2a", 0, 6, 2); light.position.set(0, OIL + 0.3, 0.1); root.add(light);
  // the glow standing over the open vat: the oil's light thrown up into the air, seen over the front lip
  const capM = new THREE.ShaderMaterial({
    uniforms: { uCol: { value: lin("#ff7a1a") }, uA: { value: 0.3 } }, vertexShader: VS,
    fragmentShader: "uniform vec3 uCol; uniform float uA; varying vec2 vUv; void main() { vec2 q = (vUv - 0.5) * 2.0; float a = uA * (1.0 - smoothstep(0.0, 1.0, abs(q.x))) * pow(1.0 - smoothstep(0.0, 1.0, abs(q.y)), 1.5) * (0.4 + 0.6 * (1.0 - vUv.y)); gl_FragColor = vec4(uCol, a); }",
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.3,
  }); capM.userData.noOutline = true;
  const cap = ghost(new THREE.Mesh(new THREE.PlaneGeometry(W * 0.9, 0.4), capM), 4); cap.position.set(0, H + 0.08, D / 2 - 0.15); root.add(cap);
  const oilWorld = new THREE.Vector3();

  return {
    grip: 0,
    apply(ps, t) {
      const tt = t ?? 0, churn = clamp(ps.churn ?? S.churn ?? 0), sc = Math.max(ps.scale ?? 1, 0.0001);
      const fl = 0.9 + 0.06 * Math.sin(tt * 2.7) + 0.04 * Math.sin(tt * 6.1 + 1.3) + 0.08 * churn;
      capM.uniforms.uA.value = 0.14 * fl * (1 + 0.5 * churn); wallM.uniforms.uK.value = fl;
      // steam: every puff lives on a loop (fixed period; churn changes how far, how big and how strong, never the clock)
      for (const s of steam) {
        const u = (tt / s.per + s.ph) % 1, env = Math.sin(Math.PI * u), sw = Math.sin(u * 5 + s.i);
        let y, r, a, x = s.x, low;
        if (s.k === "base") { y = OIL + 0.07 + (0.5 + 0.25 * churn) * KS * u; r = (0.13 + (0.15 + 0.08 * churn) * u) * KS; a = 0.2 * env * (1 + 0.5 * churn); x += 0.1 * sw; low = 1 - u; }
        else if (s.k === "surge") { y = OIL + 0.08 + (0.35 + 0.72 * churn) * KS * Math.pow(u, 0.85); r = ((0.16 + 0.1 * churn) + (0.14 + 0.2 * churn) * u) * KS; a = 0.34 * Math.pow(churn, 0.8) * env * Math.min(1, u * 6); x += (0.12 + 0.1 * churn) * KS * sw * u; low = 1 - u * 0.8; }
        else { y = OIL + 0.3 + 0.5 * u; r = (0.38 + 0.2 * u) * 1.2; a = haze * 0.3 * env * (0.85 + 0.15 * Math.sin(tt * 0.5 + s.i)); x += 0.3 * sw; low = 0.35 * (1 - u); }
        s.mesh.position.set(x, y, s.z + 0.06 * sw); s.mesh.visible = a > 0.002;
        s.m.uniforms.uR.value = r; s.m.uniforms.uA.value = a; s.m.uniforms.uTime.value = tt; s.m.uniforms.uLow.value = low;
      }
      // droplets: hop off the oil, each a parabola, in and out one by one as churn rises
      for (const d of drops) {
        const k = smooth(d.thr - 0.04, d.thr + 0.12, churn), h = d.h * (0.55 + 0.45 * churn), hop = 2 * Math.sqrt((2 * h) / 9.81);
        const du = (((tt / d.per + d.ph) % 1) * d.per) / hop, on = k > 0.01 && du < 1;
        d.o.visible = on;
        if (on) { const x = d.x + 0.06 * Math.sin(du * 3 + d.ph * 9); d.o.position.set(x, OIL + 0.012 + h * 4 * du * (1 - du), d.z); d.o.scale.set(1, 1.5, 1).multiplyScalar(k * Math.pow(Math.sin(Math.PI * du), 0.35)); }
      }
      // the oil's orange light on the cast (firelight.js): k with a +-10 % flicker, up to +50 % with churn
      const k = S.castLight ?? 0.6, flick = 1 + 0.1 * Math.sin(tt * 9.1 + 0.8 * Math.sin(tt * 2.3));
      if (k > 0) {
        oilWorld.set(0, OIL, 0).multiplyScalar(sc); oilWorld.x += ps.x; oilWorld.y += ps.y; oilWorld.z += ps.z;
        FIRE_U.uFirePos.value.copy(oilWorld); FIRE_U.uFireCol.value.set("#ff8a2a"); FIRE_U.uFireK.value = k * flick * (1 + 0.5 * churn);
      }
      light.intensity = (S.light ?? 1.2) * (k > 0 ? k : 0.5) * flick * (1 + 0.5 * churn);
    },
  };
};

export const HP_SET_KINDS = { hpstudio: HP_STUDIO, hptile: HP_TILE, hpvat: HP_VAT };
