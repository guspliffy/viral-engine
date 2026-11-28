import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp } from "./util.js";
import { mat, mesh, canvasTex } from "./props-trend.js";

// Country vs Country 02 "Waiting at a red light": street furniture, the American road, signs, painted backdrop and the binoculars
// (storyboards/series/country-vs-country/02-traffic-light/DESIGN.md sections 3, 7, 8; task T3). Metres, +x right, +y up, +z toward the lens,
// yaw / rot 0 faces +z, rot > 0 turns the front toward +x. NO letter, number or arrow on any piece. Deterministic: hash tables only, no
// random numbers, no clock. Self-lit paint (lenses, dots, signs, cards) is unlit; the rest is lit by the scene. Keys that no clip tweens
// are read as ps.key ?? spec.key ?? default: a tween of an UNPRIMED key snaps to its value (right for the steps), so prime a tweening key
// (hand, press, talk, glint) with a dur-0 set at t 0. All kinds are ghost (not solid) except the parts named SOLID.
//
//   pedlight     German pedestrian light. ORIGIN the foot of the pole, ground. Pole r 0.06, 2.30 tall `#7c868c` (SOLID), foot plate r 0.09.
//                Head 0.30 x 0.60 x 0.20 `#1d1f24` centred 1.52 up and 0.16 in front of the pole axis, two visors 0.06. Red lens r 0.105 at
//                +0.14 (1.66 up): a standing little man in a flat hat (wide brim, crown), arms straight out. Green lens at -0.14 (1.38 up):
//                the same man striding. Lit `#ff3b2a` / `#3ddc6a`; the unlit one shows its figure at `#3a1512` / `#12301c`. A halo r 0.22
//                at fixed opacity 0.5 takes the lit colour. Spec: `face` (default 0) the head's yaw in degrees about the pole (90 = the
//                lenses look toward +x; `rot` turns the whole prop as usual and adds). Key `go` (spec.go ?? 0): under 0.5 red, from 0.5
//                green; a step, no blend.
//   uspedpole    US pedestrian pole with its head and push button. ORIGIN the foot of the pole, ground. Pole r 0.055, 2.05 tall `#5a5f66`
//                (SOLID), foot plate. Head 0.34 x 0.34 x 0.16 `#1d1f24`, centre 1.40 up (z centre 0.135), a 0.05 visor; on its front an
//                open raised hand of 17 x 21 dots `#ff8a1c` (dot pitch 0.0143, hand about 0.24 x 0.28) over the dim dots of the grid; a halo
//                r 0.24 at fixed opacity 0.45. Box 0.20 x 0.30 x 0.12 `#8d969c` centre 0.62 up (SOLID), 4 screw heads; dome button r 0.065,
//                0.035 proud, `#f2b51f` on a black ring r 0.075, centre 0.60 up (ghost: a finger may touch it); speaker grille of 19
//                holes in a disc r 0.045 at 0.70 up (0.10 over the button); one LED r 0.008 at x +0.072 beside it. The button is the front
//                of the box toward +z; the box front plane is 0.175 from the pole axis, the dome top 0.21. Spec `face` (default 0) turns
//                head and box together about the pole (135 for the clip; `rot` adds). Keys `hand` 0..1.2 (spec.hand ?? 1; 0 = dots dark,
//                no halo; above 1 the dots brighten), `press` 0..1 (spec.press ?? 0; the dome sinks 0.015 x press), `talk` 0..1
//                (spec.talk ?? 0; over 0.5: LED `#5a5f66` -> `#ff3b2a`, holes `#c9ced6`, halo r 0.03 at 0.5).
//   spanwire     steel poles and a signal cable. Place it at (0, 0, z) rot 0: spec.a [x, z] (default [16.5, 0]) and spec.b ([7.2, 0]) are
//                the pole feet in the prop's frame, spec.foot (0.10) their ground y, spec.h (5.0) the pole height above it, r 0.07
//                `#5a5f66` (SOLID); the cable r 0.012 `#2c3038` runs between collars at spec.wireY (4.70, world y) with spec.sag (0.22)
//                at its middle, or through spec.hang = [[x, y], ...] (world, in the prop's frame: where each hanger top must touch it).
//   crossbars    painted crossing bars. ORIGIN the middle of the FIRST bar's low edge: it spans x 0..w, z -len/2..+len/2; bar i starts at
//                x = i x pitch (spec.axis "x", default); axis "z" repeats along z (bars then run along x). Spec n (4), w (0.34), len (2.0),
//                pitch (0.65), paint `#f2efe6`, lift (0.004 over the ground y 0 of the prop). Every bar has its own wavy edges and 2-4
//                scuffs `#bdb9ae`, drawn once. German: n 4 w 0.34 len 2.0 pitch 0.65 at (-8.83, 0, -0.10). American: n 10 w 0.42 len 2.0
//                pitch 0.84 at (7.81, 0, -0.10). Ghost, no shadow cast.
//   usroad       the American road, draws in WORLD metres: place at (0, 0, 0), rot 0, scale 1. Asphalt `#3d4047` road A x 7.6..16.0,
//                z -30..+26; street B z 6.5..10.7, x 5.0..22.0 (open across A); apron x 1.2..5.0 `#8a8d93`; 9 patches `#34373d`, 6
//                cracks, 5 oil stains. Double yellow line x 11.8 (two 0.06 lines 0.08 apart `#e8b923`, not across B), white dashes at
//                x 9.7 and 13.9 (0.06 x 1.2 every 3.0), stop lines 0.30 at z +1.2 (x 11.8..16.0) and z -1.4 (x 7.6..11.8). Far pavement
//                x 5.0..7.6 and plaza x 16.0..23.2 at y 0.10 `#c9c4b8` (joints every 1.5, kerb face `#b4ae9f`), both cut by street B.
//                Not solid, casts nothing, receives shadows. Spec: none.
//   busstopsign  ORIGIN the foot of the post, plate faces +z and -z (turn with rot; the clip uses 90). Post r 0.03 x 2.20 `#9aa3a8`
//                (SOLID). Plate 0.42 x 0.52 x 0.02 rounded, centre 1.85 up, blue `#2b63c4`, white border 0.025, a white bus pictogram
//                0.26 x 0.24 (front view) on both faces. Spec: none.
//   usbackdrop   a painted card, draws in WORLD metres: place at (0, 0, 0), rot 0, scale 1. Spec `view`: "w" 30 x 9 at x +1.2, z -14..+16,
//                faces +x (diner z -7..+1, gas station z +3..+11); "n" 22 x 9 at z +26, x 2..24, faces -z (the road to a vanishing point
//                at x 11.8); "e" 26 x 9 at x +23, z -12..+14, faces -x (brick store row). Unlit paint, the sky cut by alpha. Not solid.
//   binoculars   ORIGIN the middle of its 0.24 x 0.10 x 0.17 box (x across, y up, z the barrels): objectives (r 0.05) toward +z, eyepieces
//                (r 0.03) toward -z, so with rot 0 the lenses face the lens of a camera on +z. Two barrels `#22242a` at x +-0.07, a bridge
//                and a focus wheel, lenses `#5fa8c8` with one highlight stroke. Key `glint` 0..1 (spec.glint ?? 0): the LEFT objective
//                (the one at -x, on screen left of a camera on +z) goes white and a soft disc r 0.09 at fixed opacity 0.6 scales with it.
//                No grip: a `streetpotato` holds it by placement (DESIGN section 8), not a rig's hand.
//   Opt-in keys elsewhere (defaults unchanged): trafficlight `hang: true` + `housing` (props-drivethru.js), miniflag `poleH` (props-checkout-set.js).
const DS = THREE.DoubleSide, DEG = Math.PI / 180;
const hs = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const bas = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, fog: false, ...o }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; return m; };
function put(parent, geo, m, x = 0, y = 0, z = 0, solid = false) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = false; o.userData.solid = solid; parent.add(o); return o;
}
function lit(parent, geo, m, x = 0, y = 0, z = 0, solid = false) { const o = mesh(geo, m, parent, x, y, z); o.userData.solid = solid; return o; }
const finish = (root) => root.traverse((o) => { if (o.isMesh && o.userData.solid === undefined) o.userData.solid = false; });
const radial = (stops, size = 128) => canvasTex(size, size, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
const GLOW = [[0, "rgba(255,255,255,1)"], [0.25, "rgba(255,255,255,0.55)"], [0.6, "rgba(255,255,255,0.14)"], [1, "rgba(255,255,255,0)"]];
function glow(parent, tex, color, opacity, size, x, y, z) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }));
  s.material.userData.noOutline = true; s.userData.solid = false; s.userData.steam = true; s.renderOrder = 6; s.frustumCulled = false;
  s.scale.set(size, size, 1); s.position.set(x, y, z); parent.add(s); return s;
}
const rr = (w, h, r) => {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
};
// a flat rectangle on the ground (x0..x1, z0..z1) at height y
const flatRect = (x0, x1, z0, z1, y) => { const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2); return g; };
// a thin flat strip from (x0, z0) to (x1, z1), width w, at height y
const flatStrip = (x0, z0, x1, z1, w, y) => {
  const L = Math.hypot(x1 - x0, z1 - z0), g = new THREE.PlaneGeometry(L, w); g.rotateX(-Math.PI / 2); g.rotateY(-Math.atan2(z1 - z0, x1 - x0)); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2); return g;
};
// a decal material: lit, receives shadow, pulled toward the lens in depth so it never fights the ground under it
const decal = (color, k = 1) => { const m = mat(color, { roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -k, polygonOffsetUnits: -k }); return m; };
const groundMesh = (parent, geos, m, solid = false) => {
  if (!geos.length) return null;
  const o = new THREE.Mesh(geos.length === 1 ? geos[0] : mergeGeometries(geos), m); o.castShadow = false; o.receiveShadow = true; o.userData.solid = solid; parent.add(o); return o;
};

// ------------------------------------------------------------------------------------------------ pedestrian lights
// the little man, white on transparent in a 256 px square that covers the lens diameter. stand: arms straight out; stride: walking.
// The hat is drawn big (a wide brim and a crown) because it must read at 30 px.
function manTex(stride) {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = g.strokeStyle = "#ffffff"; g.lineCap = "round"; g.lineJoin = "round";
    const line = (w, pts) => { g.lineWidth = w; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); };
    const lean = stride ? 7 : 0;
    // hat: crown and a wide brim, then the head
    g.beginPath(); g.roundRect(98 + lean, 14, 60, 40, 9); g.fill();
    g.beginPath(); g.ellipse(128 + lean, 58, 72, 11, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(128 + lean, 84, 18, 0, Math.PI * 2); g.fill();
    if (!stride) {
      g.beginPath(); g.roundRect(106, 104, 44, 64, 10); g.fill();                    // torso
      line(20, [[34, 122], [222, 122]]);                                            // arms straight out
      line(20, [[118, 164], [118, 234]]); line(20, [[138, 164], [138, 234]]);       // legs together
    } else {
      line(36, [[128, 112], [124, 160]]);                                           // torso, a little forward
      line(17, [[128, 118], [78, 150]]); line(17, [[128, 118], [180, 138]]);        // arms swinging
      line(19, [[124, 160], [86, 232]]); line(19, [[124, 160], [174, 224]]);        // legs in a stride
    }
  });
}
const PED = { OFF: ["#3a1512", "#12301c"], ON: ["#ff3b2a", "#3ddc6a"] };

function pedlight(P) {
  const S = P.spec, g = P.whole, dark = mat("#1d1f24", { roughness: 0.5 }), pole = mat("#7c868c", { roughness: 0.5 });
  lit(g, new THREE.CylinderGeometry(0.06, 0.06, 2.3, 14), pole, 0, 1.15, 0, true);
  lit(g, new THREE.CylinderGeometry(0.09, 0.1, 0.03, 14), pole, 0, 0.015, 0, true);
  lit(g, new THREE.SphereGeometry(0.06, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), pole, 0, 2.3, 0);
  const face = new THREE.Group(); face.rotation.y = (S.face ?? 0) * DEG; g.add(face);
  const hd = new THREE.Group(); hd.position.set(0, 1.52, 0.16); face.add(hd);
  const hg = new THREE.ExtrudeGeometry(rr(0.3, 0.6, 0.035), { depth: 0.2, bevelEnabled: false }); hg.translate(0, 0, -0.1);
  lit(hd, hg, dark, 0, 0, 0);
  lit(face, new THREE.BoxGeometry(0.05, 0.05, 0.1), pole, 0, 1.52, 0.055);   // the bracket between pole and head
  const figs = [], halos = [], halo = radial(GLOW), tex = [manTex(false), manTex(true)];
  [0.14, -0.14].forEach((dy, i) => {
    put(hd, new THREE.CircleGeometry(0.105, 28), bas("#0d0e11"), 0, dy, 0.1005);
    const m = bas(PED.OFF[i], { map: tex[i], alphaTest: 0.5, side: DS }); figs.push(m);
    put(hd, new THREE.PlaneGeometry(0.21, 0.21), m, 0, dy, 0.101);
    const vis = lit(hd, new THREE.CylinderGeometry(0.115, 0.115, 0.06, 18, 1, true, Math.PI / 2, Math.PI), dark, 0, dy, 0.13);
    vis.rotation.x = Math.PI / 2; vis.material = dark.clone(); vis.material.side = DS;
    halos.push(glow(hd, halo, PED.ON[i], 0.5, 0.44, 0, dy, 0.12));
  });
  finish(g);
  return { grip: 0, apply(ps) {
    const a = (ps.go ?? S.go ?? 0) < 0.5 ? 0 : 1;
    figs.forEach((m, i) => { m.color.set(i === a ? PED.ON[i] : PED.OFF[i]); halos[i].visible = i === a; });
  } };
}

// the raised hand, 17 x 21 dots (true = lit)
const HAND = (() => {
  const W = 17, H = 21, a = Array.from({ length: H }, () => Array(W).fill(false));
  const fill = (c0, c1, r0, r1) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) a[r][c] = true; };
  fill(4, 5, 2, 9); fill(7, 8, 0, 9); fill(10, 11, 1, 9); fill(13, 14, 4, 9);   // index, middle, ring, little finger
  fill(3, 15, 10, 16); fill(5, 13, 17, 20);                                     // palm and wrist
  for (const [r, c] of [[10, 3], [10, 15], [16, 3], [16, 15], [17, 5], [17, 13]]) a[r][c] = false;   // soft corners
  fill(1, 2, 9, 12); fill(0, 1, 8, 10); a[13][3] = true;                          // thumb out to the left
  return a;
})();
function dotTex(cells) {
  return canvasTex(17 * 16, 21 * 16, (g) => {
    g.fillStyle = "#ffffff";
    for (let r = 0; r < 21; r++) for (let c = 0; c < 17; c++) if (cells(r, c)) { g.beginPath(); g.arc(c * 16 + 8, r * 16 + 8, 6.6, 0, Math.PI * 2); g.fill(); }
  });
}

function uspedpole(P) {
  const S = P.spec, g = P.whole, dark = mat("#1d1f24", { roughness: 0.5 }), steel = mat("#5a5f66", { roughness: 0.5 }), box = mat("#8d969c", { roughness: 0.5 });
  lit(g, new THREE.CylinderGeometry(0.055, 0.055, 2.05, 14), steel, 0, 1.025, 0, true);
  lit(g, new THREE.CylinderGeometry(0.085, 0.095, 0.03, 14), steel, 0, 0.015, 0, true);
  lit(g, new THREE.SphereGeometry(0.055, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), steel, 0, 2.05, 0);
  const face = new THREE.Group(); face.rotation.y = (S.face ?? 0) * DEG; g.add(face);
  // head
  const hd = new THREE.Group(); hd.position.set(0, 1.4, 0.135); face.add(hd);
  lit(hd, new THREE.BoxGeometry(0.34, 0.34, 0.16), dark, 0, 0, 0);
  lit(hd, new THREE.BoxGeometry(0.34, 0.012, 0.05), dark, 0, 0.176, 0.105);   // the visor
  const PIT = 0.0143, gw = 17 * PIT, gh = 21 * PIT;
  const dimM = bas("#2a1a12", { map: dotTex(() => true), alphaTest: 0.5 }), onM = bas("#ff8a1c", { map: dotTex((r, c) => HAND[r][c]), alphaTest: 0.5 });
  put(hd, new THREE.PlaneGeometry(gw, gh), dimM, 0, 0, 0.0806);
  put(hd, new THREE.PlaneGeometry(gw, gh), onM, 0, 0, 0.0812);
  const hl = glow(hd, radial(GLOW), "#ff8a1c", 0.45, 0.48, 0, 0, 0.1);
  // box
  const bx = new THREE.Group(); bx.position.set(0, 0.62, 0.115); face.add(bx);
  lit(bx, new THREE.BoxGeometry(0.2, 0.3, 0.12), box, 0, 0, 0, true);
  const front = 0.06;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const s = lit(bx, new THREE.CylinderGeometry(0.01, 0.01, 0.008, 8), mat("#6c747a", { roughness: 0.4 }), sx * 0.078, sy * 0.128, front + 0.003); s.rotation.x = Math.PI / 2; }
  const ring = put(bx, new THREE.CylinderGeometry(0.075, 0.075, 0.012, 22), bas("#0d0e11"), 0, -0.02, front + 0.006); ring.rotation.x = Math.PI / 2;
  const domeG = new THREE.SphereGeometry(0.065, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2); domeG.rotateX(Math.PI / 2); domeG.scale(1, 1, 0.035 / 0.065);
  const dome = lit(bx, domeG, mat("#f2b51f", { roughness: 0.35 }), 0, -0.02, front + 0.0); dome.userData.baseZ = front;
  // grille: 19 holes (hex of radius 2) in a disc r 0.045, 0.10 above the button
  const gy = 0.08, gm = bas("#5b5f69"), holeM = bas("#1d1e22"), holes = [], pitch = 0.017;
  put(bx, new THREE.CircleGeometry(0.045, 24), gm, 0, gy, front + 0.0015);
  for (let q = -2; q <= 2; q++) for (let w = -2; w <= 2; w++) {
    if (Math.abs(q + w) > 2) continue;
    const c = new THREE.CircleGeometry(0.0048, 8); c.translate(pitch * (q + w / 2), gy + pitch * w * 0.866, front + 0.002); holes.push(c);
  }
  put(bx, mergeGeometries(holes), holeM);
  const ledM = bas("#5a5f66"); put(bx, new THREE.CircleGeometry(0.008, 10), ledM, 0.072, gy, front + 0.0015);
  const lhl = glow(bx, radial(GLOW), "#ff3b2a", 0.5, 0.06, 0.072, gy, front + 0.01);
  finish(g);
  const dark0 = new THREE.Color("#2a1a12"), on0 = new THREE.Color("#ff8a1c");
  return { grip: 0, apply(ps) {
    const h = clamp(ps.hand ?? S.hand ?? 1, 0, 1.2), k = Math.min(1, h);
    onM.color.copy(dark0).lerp(on0, k).multiplyScalar(1 + Math.max(0, h - 1) * 1.2); hl.visible = h > 0.05;
    dome.position.z = front - 0.015 * clamp(ps.press ?? S.press ?? 0);
    const t = clamp(ps.talk ?? S.talk ?? 0) > 0.5;
    ledM.color.set(t ? "#ff3b2a" : "#5a5f66"); holeM.color.set(t ? "#c9ced6" : "#1d1e22"); lhl.visible = t;
  } };
}

function spanwire(P) {
  const S = P.spec, g = P.whole, steel = mat("#5a5f66", { roughness: 0.5 });
  const A = S.a ?? [16.5, 0], B = S.b ?? [7.2, 0], foot = S.foot ?? 0.1, H = S.h ?? 5.0, wy = S.wireY ?? 4.7, sag = S.sag ?? 0.22;
  for (const [x, z] of [A, B]) {
    lit(g, new THREE.CylinderGeometry(0.07, 0.085, H, 14), steel, x, foot + H / 2, z, true);
    lit(g, new THREE.SphereGeometry(0.07, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), steel, x, foot + H, z);
    lit(g, new THREE.CylinderGeometry(0.1, 0.1, 0.06, 12), steel, x, wy, z);   // the collar the cable ties to
  }
  const pts = [];
  if (S.hang?.length) {
    const hp = [...S.hang].sort((p, q) => Math.abs(p[0] - A[0]) - Math.abs(q[0] - A[0]));
    pts.push([A[0], wy], ...hp, [B[0], wy]);
  } else for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push([A[0] + (B[0] - A[0]) * u, wy - 4 * sag * u * (1 - u)]); }
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, A[1] + (B[1] - A[1]) * ((x - A[0]) / (B[0] - A[0])))), false, "catmullrom", 0.5);
  lit(g, new THREE.TubeGeometry(curve, 40, 0.012, 6, false), mat("#2c3038", { roughness: 0.6 }), 0, 0, 0).castShadow = false;
  finish(g);
  return { grip: 0 };
}

// ------------------------------------------------------------------------------------------------ crossing bars
function crossbars(P) {
  const S = P.spec, g = P.whole, n = S.n ?? 4, w = S.w ?? 0.34, len = S.len ?? 2.0, pitch = S.pitch ?? 0.65, lift = S.lift ?? 0.004, alongZ = S.axis === "z";
  const paint = decal(S.paint ?? "#f2efe6", 3), scuffM = decal("#bdb9ae", 4), geos = [], scuffs = [];
  const SEG = 8;
  for (let i = 0; i < n; i++) {
    // a strip along the bar's length with its two long edges wobbling by up to 0.007 and its ends 0.01 rough
    const pos = [], idx = [];
    for (let s = 0; s <= SEG; s++) {
      const t = s / SEG, l = -len / 2 + len * t, e0 = (hs(i * 31 + s, 1) - 0.5) * 0.014, e1 = (hs(i * 31 + s, 2) - 0.5) * 0.014;
      const endRough = s === 0 || s === SEG ? (hs(i, 7 + s) - 0.5) * 0.02 : 0;
      pos.push(e0, lift, l + endRough, w + e1, lift, l + endRough);
    }
    for (let s = 0; s < SEG; s++) { const a = s * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); bg.setIndex(idx);
    bg.computeVertexNormals(); if (bg.attributes.normal.getY(0) < 0) { bg.setIndex(idx.map((v, k, a) => (k % 3 === 1 ? a[k + 1] : k % 3 === 2 ? a[k - 1] : v))); bg.computeVertexNormals(); }
    bg.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
    bg.translate(i * pitch, 0, 0); geos.push(bg);
    const ns = 2 + Math.floor(hs(i, 11) * 3);   // 2-4 scuffs
    for (let k = 0; k < ns; k++) {
      const sx = w * (0.12 + 0.76 * hs(i * 7 + k, 12)), sz = len * (-0.46 + 0.92 * hs(i * 7 + k, 13)), sw = 0.03 + 0.07 * hs(i * 7 + k, 14), sl = 0.06 + 0.2 * hs(i * 7 + k, 15);
      scuffs.push(flatRect(i * pitch + sx - sw / 2, i * pitch + sx + sw / 2, sz - sl / 2, sz + sl / 2, lift + 0.0015));
    }
  }
  const wrap = new THREE.Group(); if (alongZ) wrap.rotation.y = Math.PI / 2; g.add(wrap);   // axis "z": bars repeat along z, long in x
  groundMesh(wrap, geos, paint); groundMesh(wrap, scuffs, scuffM);
  finish(g);
  return { grip: 0 };
}

// ------------------------------------------------------------------------------------------------ the American road
function usroad(P) {
  const g = P.whole, Z0 = -30, Z1 = 26, BZ = [6.5, 10.7], PV = 0.1;
  const asphalt = [flatRect(7.6, 16.0, Z0, Z1, 0), flatRect(5.0, 22.0, BZ[0], BZ[1], 0.001)];
  groundMesh(g, asphalt, decal("#3d4047", 1));
  groundMesh(g, [flatRect(1.2, 5.0, Z0, Z1, 0)], decal("#8a8d93", 1));
  // patches, oil stains, cracks: each from the hash table, once
  const patches = [], oil = [], cracks = [];
  for (let i = 0; i < 9; i++) {
    const w = 0.7 + 0.9 * hs(i, 21), d = 0.5 + 0.8 * hs(i, 22), x = 8.2 + 7.0 * hs(i, 23), z = -26 + 46 * hs(i, 24);
    if (z + d / 2 > BZ[0] - 0.2 && z - d / 2 < BZ[1] + 0.2) continue;
    patches.push(flatRect(x - w / 2, x + w / 2, z - d / 2, z + d / 2, 0.003));
  }
  for (let i = 0; i < 5; i++) {
    const r = 0.3 + 0.35 * hs(i, 31), x = 8.4 + 6.8 * hs(i, 32), z = -22 + 38 * hs(i, 33);
    const c = new THREE.CircleGeometry(r, 18); c.rotateX(-Math.PI / 2); c.scale(1, 1, 0.55 + 0.4 * hs(i, 34)); c.rotateY(hs(i, 35) * 3); c.translate(x, 0.0035, z);
    if (z > BZ[0] - 1 && z < BZ[1] + 1) c.translate(0, 0, -4);
    oil.push(c);
  }
  for (let i = 0; i < 6; i++) {
    let x = 8.0 + 7.8 * hs(i, 41), z = -24 + 40 * hs(i, 42), a = hs(i, 43) * Math.PI * 2;
    if (z > BZ[0] - 2 && z < BZ[1] + 2) z -= 8;
    for (let s = 0; s < 5; s++) {
      const L = 0.35 + 0.5 * hs(i * 9 + s, 44), nx = x + Math.cos(a) * L, nz = z + Math.sin(a) * L;
      cracks.push(flatStrip(x, z, nx, nz, 0.022, 0.0042)); x = nx; z = nz; a += (hs(i * 9 + s, 45) - 0.5) * 1.1;
    }
  }
  groundMesh(g, patches, decal("#34373d", 2)); groundMesh(g, oil, decal("#2a2c31", 3)); groundMesh(g, cracks, decal("#25272c", 4));
  // lines
  const yel = [], wht = [], inB = (z0, z1) => z1 > BZ[0] - 0.05 && z0 < BZ[1] + 0.05;
  for (const sx of [-0.07, 0.07]) for (const [a, b] of [[Z0, BZ[0]], [BZ[1], Z1]]) yel.push(flatRect(11.8 + sx - 0.03, 11.8 + sx + 0.03, a, b, 0.0045));
  for (const x of [9.7, 13.9]) for (let z = Z0 + 0.5; z < Z1 - 1.2; z += 3.0) if (!inB(z, z + 1.2)) wht.push(flatRect(x - 0.03, x + 0.03, z, z + 1.2, 0.0045));
  wht.push(flatRect(11.8, 16.0, 1.05, 1.35, 0.0045), flatRect(7.6, 11.8, -1.55, -1.25, 0.0045));
  groundMesh(g, yel, decal("#e8b923", 5)); groundMesh(g, wht, decal("#f2efe6", 5));
  // pavements: the far pavement and the plaza at y 0.10, cut by street B; kerb faces; joints every 1.5
  const concrete = decal("#c9c4b8", 1), joint = decal("#a8a294", 2), kerbM = mat("#b4ae9f", { roughness: 0.9 });
  const spans = [[Z0, BZ[0]], [BZ[1], Z1]];
  for (const [x0, x1] of [[5.0, 7.6], [16.0, 23.2]]) {
    const slabs = [], joints = [];
    for (const [a, b] of spans) {
      const s = new THREE.BoxGeometry(x1 - x0, PV, b - a); s.translate((x0 + x1) / 2, PV / 2 - 0.002, (a + b) / 2); slabs.push(s);
      for (let z = Math.ceil(a / 1.5) * 1.5; z < b; z += 1.5) joints.push(flatRect(x0, x1, z - 0.015, z + 0.015, PV + 0.0012));
      for (let x = x0 + 1.5; x < x1 - 0.1; x += 1.5) joints.push(flatRect(x - 0.015, x + 0.015, a, b, PV + 0.0012));
    }
    groundMesh(g, slabs, concrete); groundMesh(g, joints, joint);
  }
  const kerbs = [];
  for (const [a, b] of spans) { for (const kx of [7.6, 16.0]) { const k = new THREE.BoxGeometry(0.02, PV, b - a); k.translate(kx + (kx < 10 ? 0.011 : -0.011), PV / 2, (a + b) / 2); kerbs.push(k); } }
  groundMesh(g, kerbs, kerbM);
  finish(g);
  return { grip: 0 };
}

// ------------------------------------------------------------------------------------------------ bus stop sign
function busstopsign(P) {
  const g = P.whole, post = mat("#9aa3a8", { roughness: 0.5 });
  lit(g, new THREE.CylinderGeometry(0.03, 0.03, 2.2, 12), post, 0, 1.1, 0, true);
  lit(g, new THREE.CylinderGeometry(0.05, 0.055, 0.03, 12), post, 0, 0.015, 0, true);
  const pg = new THREE.ExtrudeGeometry(rr(0.42, 0.52, 0.05), { depth: 0.02, bevelEnabled: false }); pg.translate(0, 0, -0.01);
  lit(g, pg, mat("#f4f4f2", { roughness: 0.5 }), 0, 1.85, 0);
  const tex = canvasTex(256, 320, (c, w, h) => {
    c.fillStyle = "#2b63c4"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#ffffff"; c.lineJoin = "round";
    const R = (x, y, ww, hh, r, col) => { c.fillStyle = col; c.beginPath(); c.roundRect(x, y, ww, hh, r); c.fill(); };
    // the bus from the front: body 0.26 x 0.24 of a 0.37 x 0.47 face
    const k = w / 0.37, bx = (w - 0.26 * k) / 2, by = (h - 0.24 * k) / 2 - 0.01 * k, bw = 0.26 * k, bh = 0.2 * k;
    R(bx, by, bw, bh, 0.04 * k, "#ffffff");
    R(bx + 0.025 * k, by + 0.025 * k, bw - 0.05 * k, 0.085 * k, 0.015 * k, "#2b63c4");   // the windscreen
    R(bx + 0.025 * k, by + 0.025 * k, (bw - 0.05 * k) / 2 - 0.005 * k, 0.085 * k, 0.015 * k, "#2b63c4");
    c.fillStyle = "#2b63c4"; c.fillRect(bx + bw / 2 - 0.004 * k, by + 0.02 * k, 0.008 * k, 0.095 * k);
    c.fillStyle = "#2b63c4"; for (const sx of [0.07, 0.19]) { c.beginPath(); c.arc(bx + sx * k, by + 0.15 * k, 0.017 * k, 0, 7); c.fill(); }   // two lamps
    for (const sx of [0.045, 0.215]) R(bx + sx * k - 0.02 * k, by + bh - 0.004 * k, 0.04 * k, 0.05 * k, 0.012 * k, "#ffffff");   // two wheels
  });
  for (const s of [1, -1]) { const f = put(g, new THREE.PlaneGeometry(0.37, 0.47), bas("#ffffff", { map: tex }), 0, 1.85, s * 0.0105); if (s < 0) f.rotation.y = Math.PI; }
  finish(g);
  return { grip: 0 };
}

// ------------------------------------------------------------------------------------------------ the painted backdrop
const PX = 120;   // pixels a metre
function card(wm, hm, paint) {
  const W = Math.round(wm * PX), H = Math.round(hm * PX);
  return canvasTex(W, H, (g) => {
    const F = (u, y, w, h, c) => { g.fillStyle = c; g.fillRect(u * PX, H - (y + h) * PX, w * PX, h * PX); };   // u metres from the card's left, y up
    const C = (u, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(u * PX, H - y * PX, r * PX, 0, Math.PI * 2); g.fill(); };
    const Pg = (pts, c) => { g.fillStyle = c; g.beginPath(); pts.forEach(([u, y], i) => (i ? g.lineTo(u * PX, H - y * PX) : g.moveTo(u * PX, H - y * PX))); g.closePath(); g.fill(); };
    const L = (a, b, w, c) => { g.strokeStyle = c; g.lineWidth = w * PX; g.beginPath(); g.moveTo(a[0] * PX, H - a[1] * PX); g.lineTo(b[0] * PX, H - b[1] * PX); g.stroke(); };
    const RR = (u, y, w, h, r, c) => { g.fillStyle = c; g.beginPath(); g.roundRect(u * PX, H - (y + h) * PX, w * PX, h * PX, r * PX); g.fill(); };
    g.lineCap = "round"; g.lineJoin = "round";
    paint({ F, C, Pg, L, RR, g, W: wm, H: hm });
  });
}
const hill = (K, base, amp, f, ph, col, w) => { const pts = [[0, 0]]; for (let u = 0; u <= w; u += 0.25) pts.push([u, base + amp * Math.sin(u * f + ph) + amp * 0.45 * Math.sin(u * f * 2.3 + ph * 2)]); pts.push([w, 0]); K.Pg(pts, col); };
const tree = (K, u, s = 1) => { K.F(u - 0.1 * s, 0.2, 0.2 * s, 1.3 * s, "#6b4a2b"); K.C(u, 2.3 * s, 1.1 * s, "#4f8a3c"); K.C(u - 0.55 * s, 2.0 * s, 0.75 * s, "#5b9a46"); K.C(u + 0.5 * s, 1.95 * s, 0.7 * s, "#477f36"); };
function paintW(K) {
  hill(K, 1.7, 0.7, 0.45, 1, "#a5c98a", K.W); hill(K, 0.9, 0.5, 0.7, 3, "#8fb86a", K.W);
  K.F(0, 0, K.W, 0.25, "#8a8d93");
  [1.6, 13.9, 24.3, 26.6, 28.8].forEach((u, i) => tree(K, u, 0.9 + 0.2 * hs(i, 5)));
  // the diner (z -7..+1 = u 15..23): chrome car body, red bands, a rounded glass corner, a blank roof fin, 4 booths with potato heads
  K.RR(15, 0.35, 8, 2.75, 0.3, "#c9ced6");
  K.F(15.2, 0.95, 7.8, 0.32, "#c8312f"); K.F(15.2, 2.45, 7.8, 0.3, "#c8312f");
  K.RR(15, 1.35, 1.1, 1.1, 0.45, "#bfe3ee");   // the glass corner
  K.F(16.2, 1.35, 6.3, 1.1, "#bfe3ee");
  for (let i = 0; i < 4; i++) {
    const u = 16.35 + i * 1.55;
    K.RR(u, 1.4, 1.2, 0.5, 0.08, "#c8312f");
    K.C(u + 0.6, 2.0, 0.27, "#e3b36a"); K.C(u + 0.5, 2.03, 0.04, "#2a1a12"); K.C(u + 0.7, 2.03, 0.04, "#2a1a12");
    K.L([u + 0.48, 2.12], [u + 0.55, 2.16], 0.02, "#2a1a12");
    K.F(u + 1.3, 1.35, 0.1, 1.1, "#c9ced6");
  }
  K.RR(22.0, 0.35, 0.9, 1.45, 0.08, "#2a3140"); K.F(22.0, 0.35, 0.9, 0.06, "#c9ced6");
  K.RR(14.8, 3.1, 8.4, 0.28, 0.12, "#f7f4ea"); K.F(14.8, 3.1, 8.4, 0.07, "#c8312f");
  K.RR(17.6, 3.38, 3.0, 1.5, 0.3, "#f7f4ea"); K.RR(17.75, 3.5, 2.7, 1.26, 0.22, "#ffffff"); K.F(17.6, 3.38, 3.0, 0.1, "#c8312f");   // the blank fin
  // the gas station (z +3..+11 = u 5..13): flat canopy on 2 posts, a small office, 2 pumps with blank faces
  K.RR(6.8, 0, 4.4, 2.6, 0.1, "#e9dcc0"); K.F(7.1, 0.9, 1.5, 1.05, "#7fb3c9"); K.F(9.3, 0.9, 1.5, 1.05, "#7fb3c9"); K.F(8.7, 0, 0.5, 1.7, "#8a5a3a");
  K.F(5.0, 3.45, 8.0, 0.55, "#f7f4ea"); K.F(5.0, 3.45, 8.0, 0.13, "#c8312f"); K.F(5.6, 0.2, 0.25, 3.25, "#c9ced6"); K.F(12.1, 0.2, 0.25, 3.25, "#c9ced6");
  for (const u of [7.2, 9.8]) { K.RR(u, 0.2, 0.6, 1.5, 0.08, "#c8312f"); K.F(u - 0.03, 1.68, 0.66, 0.2, "#a6221f"); K.F(u + 0.1, 1.0, 0.4, 0.5, "#f4f1ea"); K.L([u + 0.6, 1.2], [u + 0.78, 0.8], 0.04, "#22242a"); }
}
function paintN(K) {
  // u metres from the left = 24 - x; the road runs to a vanishing point at x 11.8 (u 12.2) on a horizon 1.4 up
  const vu = 12.2, vh = 1.4;
  K.F(0, 0, K.W, vh, "#a9c88c");
  hill(K, 2.1, 0.5, 0.5, 2, "#a5c98a", K.W); hill(K, vh + 0.45, 0.3, 0.8, 5, "#8fb86a", K.W);
  K.F(0, 0, K.W, vh, "#a9c88c");
  const R = (xa, xb, col) => K.Pg([[24 - xa, 0], [24 - xb, 0], [vu, vh], [vu, vh]], col);
  K.Pg([[24 - 5.0, 0], [24 - 22.0, 0], [vu, vh]], "#c9c4b8");
  K.Pg([[24 - 7.6, 0], [24 - 16.0, 0], [vu, vh]], "#3d4047"); void R;
  K.L([vu, vh], [24 - 11.8, 0], 0.07, "#e8b923");
  for (const x of [9.7, 13.9]) for (let t = 0; t < 1; t += 0.2) K.L([vu + (24 - x - vu) * t, vh * (1 - t)], [vu + (24 - x - vu) * (t + 0.09), vh * (1 - t - 0.09)], 0.04 * (t + 0.3), "#f7f4ea");
  // a second diner on the left (x 17..23), a water tower with a blank tank, power poles, trees
  K.RR(0.8, vh, 5.7, 1.5, 0.2, "#c9ced6"); K.F(1.0, vh + 0.45, 5.3, 0.25, "#c8312f"); K.F(1.4, vh + 0.8, 4.6, 0.55, "#bfe3ee"); K.RR(2.4, vh + 1.5, 2.2, 0.9, 0.2, "#f7f4ea");
  K.L([16.2, vh], [16.7, 4.9], 0.06, "#6b6f78"); K.L([18.8, vh], [18.3, 4.9], 0.06, "#6b6f78"); K.L([16.2, 3.4], [18.8, 3.4], 0.04, "#6b6f78");
  K.RR(15.9, 4.9, 3.2, 2.3, 1.0, "#c9ced6"); K.Pg([[15.8, 7.0], [19.2, 7.0], [17.5, 8.3]], "#a6221f");
  for (const u of [3.2, 20.4]) { K.F(u - 0.07, vh, 0.14, 6.0, "#6b4a2b"); K.F(u - 0.8, 6.8, 1.6, 0.1, "#6b4a2b"); }
  K.L([3.2, 6.8], [20.4, 6.8], 0.015, "#2c3038"); K.L([2.5, 6.8], [21.1, 6.7], 0.015, "#2c3038");
  [8.2, 9.0, 15.4, 21.4, 0.4].forEach((u, i) => { const s = 0.5 + 0.12 * i; K.F(u - 0.06, vh, 0.12, 0.7 * s, "#6b4a2b"); K.C(u, vh + 1.0 * s, 0.7 * s, "#4f8a3c"); });
}
function paintE(K) {
  const bw = K.W / 3;
  K.F(0, 0, K.W, 6.4, "#b5533c");
  for (let r = 0; r < 29; r++) { K.F(0, r * 0.22 + 0.2, K.W, 0.012, "#9d452f"); for (let u = (r % 2) * 0.225; u < K.W; u += 0.45) K.F(u, r * 0.22 + 0.21, 0.012, 0.22, "#a64a35"); }
  K.F(0, 6.4, K.W, 0.3, "#8f3d2d"); K.F(0, 0, K.W, 0.25, "#8a8d93");
  for (let i = 0; i < 3; i++) {
    const u0 = i * bw, stripe = i === 1 ? ["#2b3f8a", "#f7f4ea"] : ["#c8312f", "#f7f4ea"];
    if (i) K.F(u0 - 0.15, 0.25, 0.3, 6.15, "#9d452f");
    K.F(u0 + 0.5, 4.75, bw - 1.0, 1.15, "#f2e8d0"); K.F(u0 + 0.6, 4.85, bw - 1.2, 0.95, "#fbf5e6");   // blank fascia
    const n = 14, sw = (bw - 0.9) / n;
    for (let s = 0; s < n; s++) { K.F(u0 + 0.45 + s * sw, 3.85, sw + 0.002, 0.85, stripe[s % 2]); K.C(u0 + 0.45 + s * sw + sw / 2, 3.85, sw / 2, stripe[s % 2]); }
    K.F(u0 + 0.7, 0.5, bw - 3.0, 2.75, "#f2e8d0"); K.F(u0 + 0.85, 0.65, bw - 3.3, 2.45, "#2a3140"); K.F(u0 + 0.85 + (bw - 3.3) / 2 - 0.04, 0.65, 0.08, 2.45, "#f2e8d0");
    K.F(u0 + bw - 2.0, 0.25, 1.1, 2.9, "#f2e8d0"); K.F(u0 + bw - 1.9, 0.25, 0.9, 2.75, "#3a4254");
  }
}
function usbackdrop(P) {
  const g = P.whole, v = P.spec.view ?? "w";
  const defs = {
    w: { w: 30, paint: paintW, pos: [1.2, 0, 1.0], ry: 90 },    // faces +x, centre z +1
    n: { w: 22, paint: paintN, pos: [13.0, 0, 26.0], ry: 180 }, // faces -z, centre x 13
    e: { w: 26, paint: paintE, pos: [23.0, 0, 1.0], ry: -90 },  // faces -x, centre z +1
  }, d = defs[v] ?? defs.w;
  const tex = card(d.w, 9, (K) => d.paint(K)); tex.anisotropy = 4;
  const m = bas("#ffffff", { map: tex, transparent: true, alphaTest: 0.04, side: THREE.FrontSide });
  const p = put(g, new THREE.PlaneGeometry(d.w, 9), m, d.pos[0], 4.5, d.pos[2]); p.rotation.y = d.ry * DEG;
  p.userData.steam = true;
  finish(g);
  return { grip: 0 };
}

// ------------------------------------------------------------------------------------------------ binoculars
function binoculars(P) {
  const g = P.whole, body = mat("#22242a", { roughness: 0.45 }), glass = "#5fa8c8";
  const lensM = [bas(glass), bas(glass)];
  for (const [i, sx] of [-0.07, 0.07].entries()) {
    const obj = lit(g, new THREE.CylinderGeometry(0.05, 0.05, 0.085, 20), body, sx, 0, 0.0425); obj.rotation.x = Math.PI / 2;
    const eye = lit(g, new THREE.CylinderGeometry(0.03, 0.03, 0.085, 16), body, sx, 0, -0.0425); eye.rotation.x = Math.PI / 2;
    const rim = lit(g, new THREE.TorusGeometry(0.05, 0.005, 6, 20), mat("#3a3d45", { roughness: 0.4 }), sx, 0, 0.085);
    void rim;
    put(g, new THREE.CircleGeometry(0.044, 20), lensM[i], sx, 0, 0.0865);
    const hl = put(g, new THREE.PlaneGeometry(0.03, 0.006), bas("#ffffff"), sx - 0.012, 0.016, 0.0872); hl.rotation.z = 0.6;
    put(g, new THREE.CircleGeometry(0.02, 12), bas("#1a2a33"), sx, 0, -0.0861).rotation.y = Math.PI;
  }
  lit(g, new THREE.BoxGeometry(0.08, 0.026, 0.06), body, 0, 0.006, 0.0);
  lit(g, new THREE.CylinderGeometry(0.014, 0.014, 0.03, 12), mat("#3a3d45", { roughness: 0.4 }), 0, 0.03, 0.0);
  const gl = glow(g, radial(GLOW), "#ffffff", 0.6, 0.18, -0.07, 0, 0.1);
  finish(g);
  const w = new THREE.Color("#ffffff"), base = new THREE.Color(glass);
  return { grip: 0, apply(ps) {
    const k = clamp(ps.glint ?? P.spec.glint ?? 0);
    lensM[0].color.copy(base).lerp(w, k); gl.visible = k > 0.01; gl.scale.set(0.18 * k, 0.18 * k, 1);
  } };
}

export const CVC_SIGNAL_KINDS = { pedlight, uspedpole, spanwire, crossbars, usroad, busstopsign, usbackdrop, binoculars };
export const CVC_SIGNAL_GRIPS = {};
