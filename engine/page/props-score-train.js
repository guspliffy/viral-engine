import * as THREE from "three";

// "I could see everyone's happiness score" (Happiness 03, 16 Nov 2026), builder task P6: the train on the viaduct (panel 47, the last image of the goodbye).
// Design: storyboards/series/happiness/03-happiness-score/DESIGN.md section 9 (scoretrain), section 8 (HT-W2), the 47 beauty shot. Panel 47 is in happy-score-sheet-4.png.
// Metres, y up. Far scenery: a cut card of a train, seen from the side (its +z face), 250 m behind the painted plate's viaduct. Nothing random (windows hashed from their index).
// Exports TRAIN_KINDS, TRAIN_GRIPS = {}. Registry line for props3d.js (the director adds it):
//   import { TRAIN_KINDS, TRAIN_GRIPS } from "./props-score-train.js"; Object.assign(KINDS, TRAIN_KINDS); Object.assign(GRIPS, TRAIN_GRIPS);
//
//   scoretrain  Loco + 4 coaches (spec.cars 5), each 20 long (19.6 of body, 0.4 dark vestibule between) x 2.8 wide x 3.6 tall, dark green #2d4a3e, roof #243630, a cream band
//               #e8dcc0 under the windows and a thin one under the roof, 9 lit windows a side (1.3 x 0.95, #ffd98a, each a hashed 0.85..1.0 bright, a seated head in
//               about a third of them), 3 roof vents a coach. The loco is car 0: a yellow #e0b030 nose cap, 4 windows at its back and 5 dark grilles at its front.
//               It is a cut card: the bottom `hide` metres (spec.hide, default 0.9) of the 3.6 are behind the plate's parapet, so they are not built: the origin's y 0 is
//               the parapet line, the train stands y 0 .. 2.7, flat underneath, no wheels, no bogies. Look-only: no shadow, no contact oval, no hand ray, no check box.
//               Layers: bands, frames, windows, heads and the arm stand 0.1, 0.2, 0.3, 0.4 and 0.6 m proud of the side (the depth buffer is only 7 cm deep at 250 m, so closer layers z-fight).
//               Far: it is meant to be 250 m from the camera (6.4 px a metre in 47: 100 m = 640 px; the default camera far plane is 300). Fine detail below 0.1 m is not drawn.
//   ORIGIN      x, y, z of the spec: the train's NOSE at path 0 (= clip time t0), on the parapet line (y), on the track's near-side face (z; the train's own +z side faces the camera,
//               the track's middle is 1.4 behind it). It runs along x. The tail trails 100 m behind the nose.
//   SPEC KEYS (all optional)
//     dir     -1 (default) the train runs toward -x, screen LEFT when the camera looks down -z, as in 47 (loco at the left); +1 runs to +x. The coaches trail on the other side.
//     speed   20 m/s.   t0 193.5 (clip time s: 3:13.5), t1 198.5 (3:18.5): the train shows only from t0 to t1 (not at all outside; a `path` below is shown whenever it is set).
//     cars    5 (1..8; car 0 is the loco).   hide 0.9.   wave 0 (start value; 1 = Mash waves from t0)   waveCar 2 (the coach: 0 loco, 1 first coach, 2 second)
//             waveWin 3 (the window of it, 1 = nearest the loco).   waveHz 2   waveDeg 35   color "#2d4a3e"   lit "#ffd98a"
//   PATH        the train's place is a function of the clip time: path = speed * (t - t0) metres (nose x = origin x + dir * path). `path` (metres) as a param overrides it: tween it with
//               { do:"prop", id, set:{ path: 60 }, dur }, but seed it first with a dur-0 set at 0 (no propState default, so the first tween of it JUMPS).
//   KEY wave    0 or 1 (a step, not a tween: propState has no `wave`; { do:"prop", id, set:{ wave: 1 } } switches it at that time, spec.wave is the start value).
//               Mash's sleeve (charcoal #4a4642, 0.42 long, 0.10 .. 0.14 thick) and white glove #f4f1ea (0.18) = 0.6 in all, stand on the sill of window `waveWin` of coach `waveCar`,
//               proud of the glass so they are a dark shape on the lit window, and swing +-35 degrees about the sill (about z) at 2 Hz: sin(2 pi * 2 * t) on the world clock.
//               About 4-10 px at 250 m: it is read by its motion. wave 0: the arm is not there (the window is lit and empty, no head).
//   Triangles: about 6k (5 body extrusions 0.1k, instanced windows and heads 1.6k, the rest boxes).

const DEG = Math.PI / 180;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
// everything here is far scenery: no shadow, no contact oval, no hand ray, nothing for the checks to box
function far(o) { o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false; o.userData.lookOnly = true; return o; }
function box(w, h, d, m, parent, x, y, z) { const o = far(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)); o.position.set(x, y, z); parent.add(o); return o; }

const CAR = { len: 20, body: 19.6, w: 2.8, h: 3.6, win: { w: 1.3, h: 0.95, y0: 1.95 }, n: 9 };

function scoretrain(P) {
  const S = P.spec, DIR = S.dir === 1 ? 1 : -1, HIDE = S.hide ?? 0.9, N = Math.max(1, Math.min(8, Math.round(S.cars ?? 5)));
  const SPEED = S.speed ?? 20, T0 = S.t0 ?? 193.5, T1 = S.t1 ?? 198.5;
  const WC = S.waveCar ?? 2, WW = Math.max(1, Math.min(CAR.n, Math.round(S.waveWin ?? 3))), HZ = S.waveHz ?? 2, DEGW = S.waveDeg ?? 35;
  const yl = (y) => y - HIDE;                     // a height measured from the rail, as the design gives it, into the cut card's frame
  const hz = CAR.w / 2, pitch = CAR.body / CAR.n;
  const train = new THREE.Group(); P.whole.add(train);
  const green = mat(S.color ?? "#2d4a3e"), roof = mat("#243630"), cream = mat("#e8dcc0", { roughness: 0.8 }), dark = mat("#1b231f", { roughness: 0.9 }), yellow = mat("#e0b030"), vent = mat("#55605c");
  const glow = new THREE.Color(S.lit ?? "#ffd98a");
  const winM = new THREE.MeshStandardMaterial({ color: "#000000", emissive: glow, emissiveIntensity: 1.25, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const frameM = new THREE.MeshStandardMaterial({ color: "#16201b", roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const headM = new THREE.MeshStandardMaterial({ color: "#3a2a22", roughness: 1, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const grilleM = new THREE.MeshStandardMaterial({ color: "#101714", roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });

  // one coach: the walls (a box up to 3.0 from the rail) and the roof arch above them, two extrusions that only touch (nothing coincident: the depth buffer is 7 cm deep at 250 m)
  const wallH = yl(3.0);
  const wallGeo = new THREE.BoxGeometry(CAR.body, wallH, CAR.w);
  const arch = new THREE.Shape();
  arch.moveTo(-hz, 0); arch.lineTo(hz, 0); arch.quadraticCurveTo(hz - 0.02, 0.5, 0.7, 0.58); arch.lineTo(-0.7, 0.58); arch.quadraticCurveTo(-hz + 0.02, 0.5, -hz, 0); arch.closePath();
  const roofGeo = new THREE.ExtrudeGeometry(arch, { depth: CAR.body, bevelEnabled: false }); roofGeo.translate(0, 0, -CAR.body / 2); roofGeo.rotateY(Math.PI / 2);

  // instanced windows (both sides of every coach), frames, heads and grilles: [x (along the train), y, z, side] -> a matrix
  const wins = [], grilles = [], heads = [], bands = [];
  const WY = yl(CAR.win.y0 + CAR.win.h / 2);   // window centre height
  const carX = (k) => -DIR * (k * CAR.len + CAR.len / 2);   // the car's middle: the nose at x 0, the tail trailing the other way
  let waveX = null;
  for (let k = 0; k < N; k++) {
    const cx = carX(k);
    // the vestibule between this car and the one behind it
    if (k < N - 1) box(0.5, yl(3.15), 2.9, dark, train, cx - DIR * (CAR.len / 2), yl(3.15) / 2, 0);
    const body = far(new THREE.Mesh(wallGeo, green)); body.position.set(cx, wallH / 2, 0); train.add(body);
    const cap = far(new THREE.Mesh(roofGeo, roof)); cap.position.set(cx, wallH, 0); train.add(cap);
    for (const s of [-1, 1]) {
      // the cream band under the windows (1.30 .. 1.50 from the rail) and the thin one under the roof (3.0 .. 3.07), proud of the side by 0.03
      box(CAR.body, 0.2, 0.2, cream, train, cx, yl(1.4), s * hz); box(CAR.body, 0.07, 0.2, cream, train, cx, yl(2.93), s * hz);
      for (let i = 0; i < CAR.n; i++) {
        const x = cx + DIR * (CAR.body / 2 - (i + 0.5) * pitch);   // window i, counted from the nose end of the car
        const loco = k === 0, front = loco && i < 5;
        if (front) { grilles.push([x, yl(1.9), s, 1.1, 1.5, 0]); continue; }
        const id = k * 40 + i * 2 + (s > 0 ? 1 : 0);
        wins.push([x, WY, s, 1, 1, 0.85 + 0.15 * rnd(id + 3)]);
        const isWave = k === WC && i === WW - 1 && s === 1;
        if (isWave) waveX = x;
        else if (rnd(id + 91) < 0.34) heads.push([x + (rnd(id + 7) - 0.5) * 0.7, yl(CAR.win.y0) + 0.17, s]);
      }
    }
    // three roof vents a coach, hashed along it
    for (let v = 0; v < 3; v++) box(1.5, 0.14, 0.45, vent, train, cx + (rnd(k * 7 + v) - 0.5) * 12 + (v - 1) * 4, yl(3.6) + 0.04, (rnd(k * 11 + v) - 0.5) * 0.5);
  }
  // the loco's nose cap (yellow, the front 0.35), a darker plate under it
  box(0.35, yl(3.2), CAR.w + 0.5, yellow, train, -DIR * 0.025, yl(3.2) / 2, 0);
  const inst = (geo, m, list, order) => {
    const im = far(new THREE.InstancedMesh(geo, m, Math.max(1, list.length))); im.renderOrder = order; im.count = list.length;
    const d = new THREE.Object3D();
    list.forEach(([x, y, s, sx, sy, shade], i) => {
      d.position.set(x, y, s * (hz + 0.1 + order * 0.1)); d.rotation.set(0, s > 0 ? 0 : Math.PI, 0); d.scale.set(sx, sy, 1); d.updateMatrix(); im.setMatrixAt(i, d.matrix);
      if (shade) im.setColorAt(i, new THREE.Color().setScalar(shade));
    });
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.instanceMatrix.needsUpdate = true; train.add(im); return im;
  };
  inst(new THREE.PlaneGeometry(CAR.win.w + 0.12, CAR.win.h + 0.12), frameM, wins.map((w) => [w[0], w[1], w[2], 1, 1, 0]), 1);
  inst(new THREE.PlaneGeometry(CAR.win.w, CAR.win.h), winM, wins, 2);
  inst(new THREE.CircleGeometry(0.2, 10), headM, heads.map((h) => [h[0], h[1], h[2], 1, 1.15, 0]), 3);
  if (grilles.length) inst(new THREE.PlaneGeometry(1, 1), grilleM, grilles, 2);

  // Mash's arm: out of the wave window, pivoting on its sill
  const arm = new THREE.Group(); arm.visible = false; far(arm);
  if (waveX !== null) {
    arm.position.set(waveX, WY - CAR.win.h / 2 + 0.05, hz + 0.6); train.add(arm);
    const sleeveM = mat("#4a4642", { roughness: 0.9 }), gloveM = mat("#f4f1ea", { roughness: 0.6 });
    const sl = far(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.42, 8), sleeveM)); sl.position.y = 0.21; arm.add(sl);
    const gl = far(new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), gloveM)); gl.scale.set(1.1, 0.9, 0.7); gl.position.y = 0.42 + 0.09; arm.add(gl);
    const th = far(new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), gloveM)); th.position.set(-0.11 * DIR, 0.42 + 0.06, 0.02); arm.add(th);
  }

  return {
    grip: 0,
    apply(ps, t) {
      const tt = t || 0, set = typeof ps.path === "number";
      const path = set ? ps.path : SPEED * (tt - T0);
      train.position.x = DIR * path;
      train.visible = set || (tt >= T0 && tt <= T1);
      const wv = ps.wave ?? S.wave ?? 0;
      arm.visible = wv > 0.5;
      arm.rotation.z = arm.visible ? DEGW * DEG * Math.sin(2 * Math.PI * HZ * tt) : 0;
    },
  };
}

export const TRAIN_KINDS = { scoretrain };
export const TRAIN_GRIPS = {};
