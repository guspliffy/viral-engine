import * as THREE from "three";
import { clamp } from "./util.js";

// "I could see everyone's happiness score" (Happiness 03, 16 Nov 2026), builder task P1: the glasses, their case and the DON'T KEEP box.
// Design: storyboards/series/happiness/03-happiness-score/DESIGN.md section 1 (sizes, hex, poses), section 9 (registry). Panels 02, 26, 28, 32, 33, 42, 45, 48.
// Metres, y up, front +z. Every number below is the design's; nothing random (hashed from the item's index). Glass is userData.glass + steam (no shadow, no refraction).
// No word or numeral in 3D: the red patch on the box is blank (open question 6: the stroke writer brushes DON'T KEEP over it).
// Exports SCORE_KINDS, SCORE_GRIPS, SCORE_FITS. Registry line for props3d.js (the director adds it):
//   import { SCORE_KINDS, SCORE_GRIPS } from "./props-score.js"; Object.assign(KINDS, SCORE_KINDS); Object.assign(GRIPS, SCORE_GRIPS);
//
//   scoreglasses  The film's one pair of glasses (ONE size). Origin: the bridge's middle at lens-centre height (the bridge arches 0.012 above it); front (the lenses'
//                 outside) +z; the temples run to -z. Each rim a torus (centre radius 0.090, tube 0.011, squashed to 0.8 in depth): outer diameter 0.202, clear opening r 0.079,
//                 rim centres at x +-0.118, so the width over both rims is 0.438 and the height 0.202. Temples 0.17 long (0.006 x 0.012, a 0.04 ear tip bent 15 degrees down),
//                 hinged at x +-0.219, splayed 12 degrees outward when open. Tortoiseshell drawn once per rim (honey #c98a3a, 26 hashed blotches #5a3418 of 1.5-4 cm
//                 at about 40 % cover, 9 amber flecks #e9b25c, ink #3a2412), lens tint #fff6e0 at opacity 0.10 with one white streak (alpha 0.35, 0.05 long, 35 degrees)
//                 upper left. THE SCRATCH: on the wearer's LEFT rim (local +x; screen-left when the camera is on the wearer's side, as in 45), at 10 o'clock seen from the
//                 wearer's side: a pale line #f3d9a8 0.022 long, 0.002 wide, at 40 degrees to the rim, and a 0.006 nick; painted on the front and the back of the rim.
//                 State: spec.fold / param fold 0..1 (start value spec.fold, default 0; no propState default, so the first tween of it JUMPS: seed it with a dur-0 set
//                 at 0): the wearer's left temple (+x) folds 90 degrees inward over 0..0.5, the right (-x) over 0.5..1; folded, the pair is 0.030 deep.
//                 Two instances, swapped on cuts (set scale 0 on the one not seen): `gl-worn` (spec.wear) and `gl-loose` (held, in the case, on the bench).
//                 WORN: spec.wear: "spud" (stage.js: x, y, z are a point in Spud's body frame, y up from his feet; tip / rot turn on top). SCORE_FITS below, measured on
//                 Spud (body 0.88 x 0.76 x 0.66, eyes at +-0.095 and y 0.635, bulb apex z 0.324: his eyes are 0.19 apart, the lenses 0.236, so both eyes sit inside r 0.079 and
//                 the glasses centre on the midpoint). One `tip` = the prop's own lean: positive leans the top toward +z (away from the face).
//                   pose        panel   x   y      z      tip   (design: y offset from the eye midpoint, tilt)
//                   nose        all     0   0.640  0.349  +6    bridge on the nose, the rim bottoms clear the cheeks by 4 mm (the eyes are 25 mm behind the lenses)
//                   half        02      0   0.535  0.382  +25   slid down, hanging off the nose tip: top away from the face (the hand pulls it)
//                   forehead    28      0   0.835  0.276  -28   pushed up on the dome, lenses facing up and forward
//                   lift        42      0   0.795  0.315  -15   then y 0.975, z 0.232 (tween 0.5 s, ease out; leaves the frame top)
//                 !! The design's sign for the tilt (forehead +28, nose -6) is the opposite of the engine's `tip`; the panels (28, 42: lenses face up) decide: the table above.
//                 HELD (box hold, grips.mjs SIZE.scoreglasses): both gloves on the two hinges, 0.44 apart. SCORE_GRIPS.scoreglasses.hingeL = [0.219, 0, -0.004] (the wearer's
//                 left, local +x), .hingeR = [-0.219, 0, -0.004], .bridge = [0, 0.006, 0]. Held up, lenses facing up-forward: tip about -45 (negative: lenses face up),
//                 turned about its long axis (x) +-40 degrees. y <= 0.62 for Mash seated (design 10).
//                 LYING FOLDED (45, 48): fold 1, rot 180 (lenses face -z, the valley), tip -24: the rim bottoms touch the seat when the origin is 0.097 above it
//                 (y = seat + 0.097; at tip 0 it would be 0.101).
//   scorecase     (DESIGN calls it `glasscase`; renamed: props-museum.js already registers a museum `glasscase`.) A clamshell 0.48 (x) x 0.235 (z) x 0.09 (y) closed (base 0.05 + lid 0.04), plan corners r 0.04, hinge on the long back edge (z -0.1175, y 0.05), clasp at
//                 the front. Dark green #2f4a3a, 14 hand-placed scuffs #6f8a72 on the edges and corners (6 on the lid top, 2 on the lid front, 2 on the lid ends, 2 on the
//                 base front, 2 on the base ends), brass clasp #b08a3a 0.03 wide, felt lining #c9b78f (the pocket and the lid's inside). Origin: the middle of the bottom
//                 (lies flat on whatever it stands on). Param open 0..1 (propState default, start spec.open): 0..110 degrees, lid up and back. Solid.
//                 02: lies open in the box. 26: closed, Spud's R hand flat on its top lifts it 0.25 (grab keep: true, the hand placed first; grips.rest top 0.09).
//                 SCORE_GRIPS.scorecase.top = [0, 0.09, 0] (the lid's middle), .endL = [-0.24, 0.045, 0], .endR = [0.24, 0.045, 0] (the box hold's two ends).
//   keepbox       The DON'T KEEP box: 0.62 (x) x 0.46 (z) x 0.40 (y) kraft cardboard #b98d5a, four flaps (0.22 deep) open at 114 (front, +z), 103 (back), 124 (left) and 108
//                 (right) degrees, measured from lying shut (90 = standing up straight), one corner (front right, 0.06 below the rim) dented 0.02. On the front wall (+z) a
//                 rough red patch #b23a2e 0.34 x 0.13 (its middle 0.10 left of centre, 0.15 up; blank) with 12 hand-placed bristle strokes at its edge. Fibres and creases
//                 drawn once on the front wall; the other walls and the inside are plain kraft (inside #8f6a40). Origin: the middle of the bottom. Stands on the floor, never
//                 held, solid. Params: none (spec.red false hides the patch, for a plain box).
//
// Triangles: glasses about 1.6k, case about 0.7k, box about 0.5k.

const DEG = Math.PI / 180;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
// see-through for the checks, no shadow (glass)
const thru = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };

// where the glasses sit on Spud's body (x, y, z in his body frame; tip in degrees, the prop's own lean, + = top toward +z)
export const SCORE_FITS = {
  nose: { x: 0, y: 0.64, z: 0.349, tip: 6 },
  half: { x: 0, y: 0.535, z: 0.382, tip: 25 },
  forehead: { x: 0, y: 0.835, z: 0.276, tip: -28 },
  lift: { x: 0, y: 0.795, z: 0.315, tip: -15 },
  liftTop: { x: 0, y: 0.975, z: 0.232, tip: -15 },
};

export const SCORE_GRIPS = {
  scoreglasses: { hingeL: [0.219, 0, -0.004], hingeR: [-0.219, 0, -0.004], bridge: [0, 0.006, 0] },
  scorecase: { top: [0, 0.09, 0], endL: [-0.24, 0.045, 0], endR: [0.24, 0.045, 0] },
};

// ------------------------------------------------------------------------------------------------ the glasses
const G = { R: 0.09, tube: 0.011, zk: 0.8, cx: 0.118, open: 0.079, temple: 0.17, tw: 0.006, th: 0.012, splay: 12 };

// one rim's tortoiseshell: honey, 26 blotches (1.5-4 cm, hashed, about 40 % cover), 9 amber flecks, ink lines; the wearer's left rim (index 1) carries the scratch
function rimTexture(idx) {
  const W = 1024, H = 128, pxU = W / (2 * Math.PI * G.R), pxV = H / (2 * Math.PI * G.tube);   // px per metre round the ring and round the tube
  return canvasTex(W, H, (x) => {
    x.fillStyle = "#c98a3a"; x.fillRect(0, 0, W, H);
    // a few broad honey shifts so the base is not flat
    for (let i = 0; i < 14; i++) { const cxp = rnd(idx * 977 + i * 5 + 1) * W, cyp = rnd(idx * 977 + i * 5 + 2) * H, r = 30 + rnd(idx * 977 + i * 5 + 3) * 50; x.fillStyle = i % 2 ? "rgba(233,178,92,0.22)" : "rgba(160,100,40,0.18)"; x.beginPath(); x.ellipse(cxp, cyp, r, r * 0.45, 0, 0, 7); x.fill(); }
    const blob = (cxp, cyp, rw, rh, rot, seed, fill, line) => {
      const n = 11, pts = [];
      for (let k = 0; k < n; k++) { const a = (k / n) * 2 * Math.PI, j = 0.72 + 0.5 * rnd(seed * 31 + k * 7 + 3); pts.push([Math.cos(a) * rw * j, Math.sin(a) * rh * j]); }
      for (const oy of [-H, 0, H]) for (const ox of [-W, 0, W]) {
        x.save(); x.translate(cxp + ox, cyp + oy); x.rotate(rot); x.beginPath();
        x.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
        for (let k = 0; k < n; k++) { const p = pts[k], q = pts[(k + 1) % n]; x.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
        x.closePath(); x.fillStyle = fill; x.fill();
        if (line) { x.strokeStyle = line; x.lineWidth = 1.6; x.stroke(); }
        x.restore();
      }
    };
    for (let i = 0; i < 26; i++) {
      const s = idx * 1000 + i, d = 0.015 + 0.025 * rnd(s * 3 + 1), cxp = rnd(s * 3 + 2) * W, cyp = rnd(s * 3 + 3) * H, rot = (rnd(s * 3 + 4) - 0.5) * 1.6;
      blob(cxp, cyp, (d / 2) * pxU * 1.25, (d / 2) * pxV * 0.9, rot, s, "#5a3418", i % 3 === 0 ? "rgba(58,36,18,0.7)" : null);
      if (i % 4 === 1) blob(cxp + 3, cyp - 2, (d / 2) * pxU * 0.55, (d / 2) * pxV * 0.4, rot, s + 77, "rgba(122,74,36,0.55)", null);
    }
    for (let i = 0; i < 9; i++) { const s = idx * 500 + i + 211; blob(rnd(s * 3 + 1) * W, rnd(s * 3 + 2) * H, (0.004 + 0.004 * rnd(s)) * pxU, 0.004 * pxV, rnd(s * 3 + 3) * 3, s, "#e9b25c", null); }
    // ink: a few short veins along the ring
    x.strokeStyle = "rgba(58,36,18,0.5)"; x.lineWidth = 1.4;
    for (let i = 0; i < 10; i++) { const s = idx * 300 + i + 47, x0 = rnd(s * 3 + 1) * W, y0 = rnd(s * 3 + 2) * H, l = 30 + 60 * rnd(s * 3 + 3); x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(x0 + l / 2, y0 + (rnd(s) - 0.5) * 14, x0 + l, y0 + (rnd(s + 1) - 0.5) * 10); x.stroke(); }
    if (idx === 1) {
      // the scratch: 10 o'clock from the wearer's side = local direction 30 degrees above +x; front face (tube angle 90, canvas y 0.75 H) and back face (0.25 H)
      const u0 = (30 / 360) * W, len = 0.022, ang = 40 * DEG;
      for (const yy of [0.75 * H, 0.25 * H]) {
        x.strokeStyle = "#f3d9a8"; x.lineWidth = 0.002 * pxV * 1.0 + 1.6; x.lineCap = "round";
        x.beginPath(); x.moveTo(u0, yy); x.lineTo(u0 + Math.cos(ang) * len * pxU, yy + Math.sin(ang) * len * pxV); x.stroke();
        x.fillStyle = "#f3d9a8"; x.beginPath(); x.ellipse(u0 + Math.cos(ang) * len * pxU * 0.5 + 3, yy + Math.sin(ang) * len * pxV * 0.5 - 4, 0.003 * pxU, 0.0025 * pxV, 0.6, 0, 7); x.fill();   // the 0.006 nick beside the line
        x.strokeStyle = "rgba(58,36,18,0.55)"; x.lineWidth = 1; x.beginPath(); x.arc(u0 + Math.cos(ang) * len * pxU * 0.5 + 3, yy + Math.sin(ang) * len * pxV * 0.5 - 4, 0.0032 * pxU, 0.3, 2.4); x.stroke();
      }
    }
  });
}

function temple(parent, sx, m) {
  // hinge at the rim's outer edge, the arm runs along -z (open, before the turn about y); the ear tip bends down 15 degrees
  const g = new THREE.Group(); g.position.set(sx * (G.cx + G.R + G.tube), 0, -0.004); parent.add(g);
  const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.016, 0.012), mat("#7a4a22", { roughness: 0.4 })); hinge.position.z = 0.002; hinge.castShadow = true; g.add(hinge);
  const a = new THREE.Mesh(new THREE.BoxGeometry(G.tw, G.th, 0.13), m); a.position.z = -0.065; a.castShadow = true; g.add(a);
  const tip = new THREE.Group(); tip.position.set(0, 0, -0.13); tip.rotation.x = -15 * DEG; g.add(tip);   // - about x turns -z downward (y' = -z sin)
  const b = new THREE.Mesh(new THREE.BoxGeometry(G.tw, G.th * 0.9, 0.04), m); b.position.z = -0.02; b.castShadow = true; tip.add(b);
  return g;
}

function scoreglasses(P) {
  const S = P.spec, W = P.whole;
  const lensM = mat("#fff6e0", { roughness: 0.1, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide }); lensM.userData.glass = true;
  const streakM = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }); streakM.userData.glass = true;
  const frameM = mat("#a8702c", { roughness: 0.35 });
  for (const [idx, sx] of [[0, -1], [1, 1]]) {
    const rimM = mat("#ffffff", { roughness: 0.3, map: rimTexture(idx) });
    const rim = mesh(new THREE.TorusGeometry(G.R, G.tube, 8, 40), rimM, W, sx * G.cx, 0, 0); rim.scale.z = G.zk;
    thru(mesh(new THREE.CircleGeometry(G.open, 40), lensM, W, sx * G.cx, 0, 0));
    const st = thru(mesh(new THREE.PlaneGeometry(0.05, 0.005), streakM, W, sx * G.cx - 0.034, 0.036, 0.0008)); st.rotation.z = 35 * DEG;
  }
  // the bridge: an arched tube r 0.008, 0.034 long between the rims' inner edges, rising 0.012
  const bx = G.cx - G.R - G.tube;
  const bridge = new THREE.CatmullRomCurve3([[-bx, 0, 0], [-bx / 2, 0.0095, 0], [0, 0.012, 0], [bx / 2, 0.0095, 0], [bx, 0, 0]].map((p) => new THREE.Vector3(...p)));
  mesh(new THREE.TubeGeometry(bridge, 10, 0.008, 6), frameM, W);
  const tL = temple(W, 1, frameM), tR = temple(W, -1, frameM);   // the wearer's left is +x (the character faces +z, its right hand is at -x)
  let last = null;
  return {
    grip: 0,
    apply(ps) {
      const f = clamp(ps.fold ?? S.fold ?? 0); if (f === last) return; last = f;
      const fl = clamp(f * 2), fr = clamp(f * 2 - 1);
      tL.rotation.y = (-G.splay + (90 + G.splay) * fl) * DEG; tL.position.z = -0.004 - 0.0142 * fl;
      tR.rotation.y = (G.splay - (90 + G.splay) * fr) * DEG; tR.position.z = -0.004 - 0.0142 * fr;
    },
  };
}

// ------------------------------------------------------------------------------------------------ the case
const CASE = { w: 0.48, d: 0.235, base: 0.05, lid: 0.04, r: 0.04, wall: 0.012, hingeAngle: 110 };
function roundRect(w, d, r, hole) {
  const s = new THREE.Shape(), hw = w / 2, hd = d / 2;
  s.moveTo(-hw + r, -hd); s.lineTo(hw - r, -hd); s.absarc(hw - r, -hd + r, r, -Math.PI / 2, 0, false); s.lineTo(hw, hd - r); s.absarc(hw - r, hd - r, r, 0, Math.PI / 2, false);
  s.lineTo(-hw + r, hd); s.absarc(-hw + r, hd - r, r, Math.PI / 2, Math.PI, false); s.lineTo(-hw, -hd + r); s.absarc(-hw + r, -hd + r, r, Math.PI, Math.PI * 1.5, false);
  if (hole) { const p = new THREE.Path(), ow = w / 2 - hole, od = d / 2 - hole, or = Math.max(0.004, r - hole); p.moveTo(-ow + or, -od); p.lineTo(ow - or, -od); p.absarc(ow - or, -od + or, or, -Math.PI / 2, 0, false); p.lineTo(ow, od - or); p.absarc(ow - or, od - or, or, 0, Math.PI / 2, false); p.lineTo(-ow + or, od); p.absarc(-ow + or, od - or, or, Math.PI / 2, Math.PI, false); p.lineTo(-ow, -od + or); p.absarc(-ow + or, -od + or, or, Math.PI, Math.PI * 1.5, false); s.holes.push(p); }
  return s;
}
// an extruded plan shape standing up from y0 to y0 + h (the shape's depth axis becomes z)
function slab(w, d, r, hole, y0, h, m, parent, z = 0) {
  const g = new THREE.ExtrudeGeometry(roundRect(w, d, r, hole), { depth: h, bevelEnabled: false, curveSegments: 4 }); g.rotateX(-Math.PI / 2);
  return mesh(g, m, parent, 0, y0, z);
}

function scorecase(P) {
  const green = mat("#2f4a3a", { roughness: 0.55 }), felt = mat("#c9b78f", { roughness: 0.95 }), brass = mat("#b08a3a", { roughness: 0.3, metalness: 0.6 });
  const scuffM = mat("#6f8a72", { roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const { w, d, base, lid: LH, r, wall } = CASE, f = wall - 0.0005;
  // base: a green ring and floor with a felt liner (ring + floor), open on top
  slab(w, d, r, wall, 0, base, green, P.whole); slab(w, d, r, null, 0, 0.01, green, P.whole);
  slab(w - 2 * f, d - 2 * f, Math.max(0.004, r - f), 0.0035, 0.01, base - 0.013, felt, P.whole); slab(w - 2 * f, d - 2 * f, Math.max(0.004, r - f), null, 0.01, 0.006, felt, P.whole);
  // the lid: pivots about the back edge (z -d/2, y base); built closed, from the pivot toward +z
  const pivot = new THREE.Group(); pivot.position.set(0, base, -d / 2); P.whole.add(pivot);
  const lidG = new THREE.Group(); lidG.position.z = d / 2; pivot.add(lidG);
  slab(w, d, r, wall, 0, LH - 0.01, green, lidG); slab(w, d, r, null, LH - 0.01, 0.01, green, lidG);
  slab(w - 2 * f, d - 2 * f, Math.max(0.004, r - f), 0.0035, 0.001, LH - 0.014, felt, lidG); slab(w - 2 * f, d - 2 * f, Math.max(0.004, r - f), null, LH - 0.0145, 0.0045, felt, lidG);
  // a raised border line on the lid top, drawn as a thin ring
  const border = mesh(new THREE.ExtrudeGeometry(roundRect(w - 0.05, d - 0.05, r - 0.02, 0.0025), { depth: 0.0015, bevelEnabled: false, curveSegments: 4 }), mat("#27402f", { roughness: 0.6 }), lidG, 0, LH, 0); border.geometry.rotateX(-Math.PI / 2);
  // hinge on the back edge: a dark strip and two knuckles
  mesh(new THREE.BoxGeometry(0.09, 0.012, 0.008), brass, P.whole, 0, base, -d / 2 - 0.002);
  for (const sx of [-1, 1]) { const k = mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.03, 8), brass, P.whole, sx * 0.1, base, -d / 2 - 0.004); k.rotation.z = Math.PI / 2; }
  // the clasp: a brass tab on the lid's front (0.03 wide) and its catch on the base
  mesh(new THREE.BoxGeometry(0.03, 0.026, 0.004), brass, lidG, 0, 0.015, d / 2 + 0.002);
  mesh(new THREE.BoxGeometry(0.03, 0.014, 0.006), brass, P.whole, 0, base - 0.02, d / 2 + 0.003);
  mesh(new THREE.SphereGeometry(0.004, 8, 6), mat("#8a6a28", { roughness: 0.3, metalness: 0.5 }), lidG, 0, 0.012, d / 2 + 0.005);
  // 14 scuffs, hand-placed: [parent, face, x, y, z (case frame; lid parts in the lid's own frame), length, height, turn about the face's normal]
  const hz = d / 2, hx = w / 2;
  const SC = [
    [lidG, "top", -0.205, LH, 0.2125, 0.034, 0.005, 35], [lidG, "top", 0.21, LH, 0.2, 0.028, 0.004, -20], [lidG, "top", 0.2, LH, 0.03, 0.03, 0.005, 50],
    [lidG, "top", -0.22, LH, 0.04, 0.022, 0.004, 80], [lidG, "top", 0.02, LH, 0.225, 0.05, 0.004, 3], [lidG, "top", -0.11, LH, 0.226, 0.026, 0.004, -8],
    [lidG, "front", -0.19, 0.027, d, 0.03, 0.004, 4], [lidG, "front", 0.15, 0.014, d, 0.024, 0.004, -6],
    [lidG, "endR", hx, 0.02, 0.1, 0.03, 0.004, 15], [lidG, "endL", -hx, 0.03, 0.2, 0.024, 0.004, -30],
    [P.whole, "front", 0.2, 0.012, hz, 0.034, 0.004, 5], [P.whole, "front", -0.17, 0.04, hz, 0.028, 0.004, -4],
    [P.whole, "endR", hx, 0.012, 0.08, 0.03, 0.004, 20], [P.whole, "endL", -hx, 0.038, -0.09, 0.026, 0.004, -15],
  ];
  for (const [par, face, x, y, z, len, hgt, turn] of SC) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(len, hgt), scuffM); s.castShadow = false;
    if (face === "top") { s.rotation.x = -Math.PI / 2; s.rotation.z = turn * DEG; s.position.set(x, y + 0.0007, z); }
    else if (face === "front") { s.rotation.z = turn * DEG; s.position.set(x, y, z + 0.0007); }
    else { s.rotation.y = (face === "endR" ? 1 : -1) * Math.PI / 2; s.rotation.z = turn * DEG; s.position.set(x + (face === "endR" ? 0.0007 : -0.0007), y, z); s.rotation.order = "YXZ"; }
    par.add(s);
  }
  let last = null;
  return { grip: 0.05, apply(ps) { const o = clamp(ps.open ?? 0); if (o === last) return; last = o; pivot.rotation.x = -o * CASE.hingeAngle * DEG; } };
}

// ------------------------------------------------------------------------------------------------ the DON'T KEEP box
const BOX = { w: 0.62, d: 0.46, h: 0.40, flap: 0.22, t: 0.006, patch: [-0.10, 0.15, 0.34, 0.13], flaps: { front: 114, back: 103, left: 124, right: 108 } };
// a wall plane (local +z outward) nx x ny cells, the dent (cx, cy local, radius, depth along local z; negative = into the box) already in the vertices
function wallGeo(w, h, nx, ny, dent) {
  const g = new THREE.PlaneGeometry(w, h, nx, ny), p = g.attributes.position;
  if (dent) for (let i = 0; i < p.count; i++) { const dx = p.getX(i) - dent.cx, dy = p.getY(i) - dent.cy, q = Math.exp(-(dx * dx + dy * dy) / (dent.r * dent.r)); p.setZ(i, dent.z * q); }
  g.computeVertexNormals(); return g;
}
function kraftFront(red) {
  const W = 1024, H = Math.round(1024 * BOX.h / BOX.w), pm = W / BOX.w;
  return canvasTex(W, H, (x) => {
    x.fillStyle = "#b98d5a"; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 380; i++) { const s = i + 9000, x0 = rnd(s * 3 + 1) * W, y0 = rnd(s * 3 + 2) * H, l = 10 + 46 * rnd(s * 3 + 3), a = (rnd(s * 5) - 0.5) * 0.5; x.strokeStyle = i % 3 ? "rgba(150,108,62,0.30)" : "rgba(214,176,126,0.30)"; x.lineWidth = 1 + rnd(s * 7) * 1.4; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + Math.cos(a) * l, y0 + Math.sin(a) * l); x.stroke(); }
    // creases and a worn edge: three long soft dark lines, a darker rim at the bottom (it stood on a floor)
    x.strokeStyle = "rgba(110,76,40,0.35)"; x.lineWidth = 2;
    for (const [a, b, c, d2] of [[0.1, 0.22, 0.95, 0.27], [0.05, 0.62, 0.7, 0.58], [0.4, 0.9, 0.98, 0.86]]) { x.beginPath(); x.moveTo(a * W, b * H); x.quadraticCurveTo((a + c) * W / 2, (b + d2) * H / 2 + 6, c * W, d2 * H); x.stroke(); }
    const gr = x.createLinearGradient(0, H * 0.88, 0, H); gr.addColorStop(0, "rgba(90,60,30,0)"); gr.addColorStop(1, "rgba(90,60,30,0.35)"); x.fillStyle = gr; x.fillRect(0, H * 0.88, W, H * 0.12);
    if (!red) return;
    const [px, py, pw, ph] = BOX.patch, cx = W / 2 + px * pm, cy = H - py * pm, w2 = (pw * pm) / 2, h2 = (ph * pm) / 2;
    // the patch: a rough rectangle, brushed (long horizontal strokes of three reds), 12 bristle strokes running out at its edge
    x.fillStyle = "#b23a2e"; x.beginPath();
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (let k = 0; k < 4; k++) for (let j = 0; j < 6; j++) { const [ax, ay] = corners[k], [bx, by] = corners[(k + 1) % 4], t = j / 6, ex = ax + (bx - ax) * t, ey = ay + (by - ay) * t, jx = (rnd(k * 17 + j * 3 + 1) - 0.5) * 7, jy = (rnd(k * 17 + j * 3 + 2) - 0.5) * 7; const X = cx + ex * w2 + jx, Y = cy + ey * h2 + jy; if (!k && !j) x.moveTo(X, Y); else x.lineTo(X, Y); }
    x.closePath(); x.fill();
    for (let i = 0; i < 26; i++) { const s = i + 400, yy = cy - h2 + 4 + rnd(s * 3 + 1) * (2 * h2 - 8), x0 = cx - w2 + 6 + rnd(s * 3 + 2) * w2 * 0.5, l = w2 * (0.5 + rnd(s * 3 + 3) * 0.9); x.strokeStyle = ["rgba(196,80,63,0.5)", "rgba(146,44,36,0.45)", "rgba(178,58,46,0.6)"][i % 3]; x.lineWidth = 3 + rnd(s) * 5; x.lineCap = "round"; x.beginPath(); x.moveTo(x0, yy); x.lineTo(Math.min(cx + w2 - 4, x0 + l), yy + (rnd(s + 1) - 0.5) * 3); x.stroke(); }
    // bristle strokes: thin lines leaving the left and right edges (the stroke ends) and a few along the top and bottom
    x.strokeStyle = "#a83428"; x.lineCap = "round";
    for (let i = 0; i < 12; i++) {
      const s = i + 700, side = i % 4;
      x.lineWidth = 1.4 + rnd(s) * 1.4; x.beginPath();
      if (side < 2) { const yy = cy - h2 + 6 + rnd(s * 3 + 1) * (2 * h2 - 12), xe = side ? cx + w2 : cx - w2, dir = side ? 1 : -1; x.moveTo(xe - dir * 10, yy); x.lineTo(xe + dir * (10 + rnd(s * 3 + 2) * 24), yy + (rnd(s * 3 + 3) - 0.5) * 6); }
      else { const xx = cx - w2 + 20 + rnd(s * 3 + 1) * (2 * w2 - 40), ye = side === 2 ? cy - h2 : cy + h2, dir = side === 2 ? -1 : 1; x.moveTo(xx, ye - dir * 8); x.lineTo(xx + (rnd(s * 3 + 3) - 0.5) * 8, ye + dir * (8 + rnd(s * 3 + 2) * 16)); }
      x.stroke();
    }
  });
}

function keepbox(P) {
  const { w, d, h, flap, t } = BOX, outer = mat("#b98d5a", { roughness: 0.85, side: THREE.DoubleSide }), inner = mat("#8f6a40", { roughness: 0.9 }), flapM = mat("#b98d5a", { roughness: 0.85 });
  const front = mat("#ffffff", { roughness: 0.85, map: kraftFront(P.spec.red !== false) });
  const dentR = 0.06, dz = -0.02;   // the front-right corner, 0.06 below the rim
  // [name, plane centre, yaw, plane width, local dent centre x]: the outer plane faces out, the inner plane (turned half a turn, t inside) faces in
  const WALLS = [["front", [0, h / 2, d / 2], 0, w, w / 2], ["back", [0, h / 2, -d / 2], Math.PI, w, null], ["right", [w / 2, h / 2, 0], Math.PI / 2, d, -d / 2], ["left", [-w / 2, h / 2, 0], -Math.PI / 2, d, null]];
  for (const [name, c, yaw, ww, dx] of WALLS) {
    const dented = dx !== null, o = mesh(wallGeo(ww, h, dented ? 8 : 1, dented ? 6 : 1, dented && { cx: dx, cy: h - dentR - 0.01, r: dentR, z: dz }), name === "front" ? front : outer, P.whole, c[0], c[1], c[2]);
    o.rotation.y = yaw;
    const inw = wallGeo(ww, h, dented ? 8 : 1, dented ? 6 : 1, dented && { cx: -dx, cy: h - dentR - 0.01, r: dentR, z: -dz });
    const i = mesh(inw, inner, P.whole, c[0] - Math.sin(yaw) * t, c[1], c[2] - Math.cos(yaw) * t); i.rotation.y = yaw + Math.PI; i.castShadow = false;
  }
  const fl = mesh(new THREE.PlaneGeometry(w - t, d - t), inner, P.whole, 0, 0.002, 0); fl.rotation.x = -Math.PI / 2; fl.castShadow = false;
  // four flaps, each hinged on its wall's top edge: lying shut = pointing inward; 90 = standing up; more = leaning out. Each its own angle.
  const FL = [["front", [0, h, d / 2], 0, w], ["back", [0, h, -d / 2], Math.PI, w], ["right", [w / 2, h, 0], Math.PI / 2, d], ["left", [-w / 2, h, 0], -Math.PI / 2, d]];
  for (const [name, pos, yaw, ww] of FL) {
    const yawG = new THREE.Group(); yawG.position.set(...pos); yawG.rotation.y = yaw; P.whole.add(yawG);
    const hinge = new THREE.Group(); hinge.rotation.x = BOX.flaps[name] * DEG; yawG.add(hinge);
    mesh(new THREE.BoxGeometry(ww, t, flap), flapM, hinge, 0, 0, -flap / 2);
  }
  return { grip: 0 };
}

export const SCORE_KINDS = { scoreglasses, scorecase, keepbox };
