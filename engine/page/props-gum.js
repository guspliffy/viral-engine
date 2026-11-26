import * as THREE from "three";
import { clamp } from "./util.js";

// Kid vs Dad 06 "Swallowed gum glues your stomach" (design: storyboards/series/kid-vs-dad/06-gum/DESIGN.md section 2). Eight kinds.
// Metres before spec.scale. Deterministic: fixed tables and a sine hash only (no Math.random, no clock); every animation is a pure function of
// the prop's keys. No alpha material, no light: things appear by visibility or scale, never by opacity. No letters or digits anywhere except
// "DAD 1995" on the X-ray. Body frame (worn kinds) = x, y, z on the wearer, y up from its FEET, +z out of the face, th round the body from the
// front, + toward its left (+x). A WORN kind sits in the wearer's frame and follows its squash (wearSquash below), and every mesh of it is
// userData.steam (the checks see through it). Triangle budgets: mitts 4000 together, colander 3000, basket 4000, the rest 2000.
//
// KEYS THAT ARE NOT propState KEYS (props3d.js propState has a fixed list): `blow`, `stuck`, `togo`. Prime each once with a dur-0 set at time 0,
// c.prop(0, id, { blow: 0.5 }, 0), and then tween it as usual (a tween of a key that was never primed snaps to its end value). `pop`, `ring` and `on`
// are propState keys. The eggtimer's "time left" key is `togo`, NOT `left`: propState's `left` is the let-go record of a released prop (attach.js
// reads it), so a number there would stage the timer as dropped.
//
//   gumbubble    Tato's bubble gum (panel 01). WORN: wear "spud", x 0, y 0, z 0 (it places itself from the numbers in his body frame).
//                gum #f58fb5, shade #e0709c, highlight #ffd3e3. Opaque.
//     blow 0..1  (default spec.blow ?? 1; prime it) the sphere: r = 0.02 + 0.10 blow, centre (0, 0.385 - 0.25 r, 0.215 + 0.92 r); at 1: 0.24 across,
//                top at 0.475 (his eyes stay over it). A highlight patch (radius 0.35 r) on the upper left, a shade patch on the lower right.
//     pop 0..1   (default spec.pop ?? 0; tween it over 0.3 s) above 0 the sphere is hidden. 0..0.25: a flat burst star (9 uneven lobes, r 0.19, 0.01
//                thick, facing +z at the bubble's last centre, scale 0.6 to 1.15). 0..1: 8 bits (r 0.012 to 0.022) fly out along 8 fixed
//                directions 0.22 to 0.40 m, drop 0.10 pop^2, shrink to 0 from pop 0.7.
//     stuck 0|1  (default spec.stuck ?? 1; prime it) 5 flat blobs on his skin (forehead, a brow-side blob, both cheeks, the chin with a drip),
//                shown while pop > 0.15 and stuck is 1. None within th +-0.6 between y 0.40 and 0.58: eyes, brows and mouth stay clean.
//
//   gumstick     one stick of gum, standing (panel 09). Origin bottom centre, +z to the lens. 0.11 tall x 0.034 wide x 0.008, 4 cross grooves; the
//                lower 0.062 in a foil sleeve (0.036 x 0.010) with a torn top of 5 teeth and a paper band 0.03 tall with a pink stripe. No letters.
//                Twice life size on purpose. SIZE gumstick { len: 0.11, r: 0.005 }. HELD: grips.thin from 0.25 (a pinch on the foil, y 0.0275,
//                just under the band). Solid. No keys.
//
//   eggtimer     the kitchen egg timer, the episode's counter (panels 04, 05, 10, 13). Origin bottom centre, the dial facing +z; 0.18 across,
//                0.17 tall with the stem. A red egg on a flat foot, the front cut flat at z 0.070 for a cream dial: 12 plain ticks, a red zero
//                mark at 12 o'clock, NO digits; a red pie wedge (60 slices of 5 degrees) and a needle. Solid, no hold (it stands on the table).
//     togo 0..1  (default spec.togo ?? spec.left ?? 1; prime it) time left: the wedge spans 300 degrees x togo (slice i shown while i < round(60 x
//                togo)), the needle sits on its moving edge, the top (grooves, sepals, stem) turns 300 degrees x togo.
//     ring 0..1  (tween it over 1.2 s) everything above the foot shakes: x 0.004 sin(40 pi ring), roll 4 degrees sin(40 pi ring + 1.3), hop
//                0.006 abs(sin(20 pi ring)), all x sin(pi ring): still at 0 and at 1.
//
//   ovenmitts    Dad's two red quilted oven mitts. WORN: wear "dad", x 0, y 0, z 0. ONE prop that follows both of his hands: each frame it takes the
//                two glove groups of his rig (userData.side "L" / "R"), and each mitt takes that glove's world matrix x scale(1 / hands.size), so
//                it is a pure function of the pose and never lags. The real glove stays inside, unseen. Size 0.33 long, 0.22 wide with the thumb,
//                0.136 thick; the glove's frame: +y to the fingertips, +z out of the palm, +x to the thumb. One extra lump (0.046 x 0.072 x 0.050 at
//                (0.055, 0.015, 0.045)) over the thumb of a closed fist, which stood 1 cm out of the specified shell; the palm face at x 0 is still 0.076.
//     on 0|1     (propState key, default 0: give `on: 1` in a set at the cut) visibility; also off while that glove is hidden.
//                Holding in mitts: the shell does not close, so a held thing comes OUT of the mitt. Put the grip point at the glove's centre for anything
//                gripped in a fist (tongs, spoon); gap 0.085 where a palm lies on a surface (the shell's palm face is 0.076 from the glove's centre).
//
//   colanderhat  Dad's helmet. WORN: wear "dad", x 0, y 1.07, z 0, tip -5 (back), rot 6. Origin the centre of the rim circle (unworn it stands on its
//                rim). A steel dome 0.30 radius at the rim, 0.24 high, a rolled rim, a foot ring on top, 2 handles out to x +-0.39 (top 1.32 worn),
//                115 painted dark dots. Steel #b9c2cc, shade and inside #8e98a4. No keys.
//
//   basketarmour Dad's laundry basket, bottom out, worn like a barrel. WORN: wear "dad", x 0, y 0.20, z 0. Origin the centre of its lower edge. White,
//                an oval ring 0.24 high (0.455 x 0.425 at the bottom, 0.497 x 0.467 at the top), a rolled lip, painted holes (his shirt shows in
//                shade), 2 handle slots at th +-pi/2, and 2 leather straps (his own, #7a4b2a) up each side of the body from the lip. No keys.
//                spec.grow (default 0.03, metres): the wall's half axes are the design's + grow: at the design's 0.455 x 0.425 his holster (out to
//                0.46 at th -0.95) comes through the wall (checked: 0.015 is not enough). The lip and the slot frames grow with it.
//                It does NOT keep his arms off the wall: while it is worn the director gives an idle arm GUARD (GUM_GUARD below) instead of `rest`.
//
//   potlid       the shield (panels 10, 12). Built facing +z: origin the centre of the rim plane, dome and knob toward +z. 0.44 across, a cap 0.045
//                high, a rolled rim, 2 pressed ring lines, a black knob on a washer. Steel, underside #8e98a4. Solid. Rigid hold in his RIGHT mitt:
//                the glove's centre at GUM_GRIPS.potlid.back = [0, 0, -0.04] (0.04 behind the rim plane). SIZE potlid { w: 0.44, h: 0.44, d: 0.07 }.
//
//   xrayfilm     the X-ray (panels 14, 15). Origin bottom centre, 0.34 wide x 0.46 tall x 0.008 thick, corner r 0.02. The picture is on the -z face
//                (away from the holder, as reviewtablet: stand the film at rot 180 to show it to a lens at +z); the +z face is plain #14284a.
//                Self-lit (MeshBasicMaterial): it glows with no window behind it. Dad's outline, nothing inside it but a pink gum ball, and a label
//                "DAD 1995". HELD: grips.box, both palms on the side edges at y 0.253. SIZE xrayfilm { w: 0.34, h: 0.46, d: 0.02 }.
//
// Exports: GUM_KINDS (props3d.js registry), GUM_GRIPS, GUM_FIT (the dad's body fit, a local copy of potato.js bodyPoint without lumps), GUM_GUARD.
export const GUM_GRIPS = { potlid: { back: [0, 0, -0.04] } };
export const GUM_FIT = { dad: { rx: 0.43, rz: 0.38, cy: 0.69, ry: 0.49, taper: 0.14, square: 2.3 } };
export const GUM_GUARD = { o: [0.19, 0.31, 0.08], elbow: 0.12 };   // an idle arm while the basket is worn: the mitt at (+-0.62, 0.504, 0.08)

const DEG = Math.PI / 180;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
const basic = (o) => { const m = new THREE.MeshBasicMaterial(o); m.userData.noOutline = true; return m; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const ellipsoid = (rx, ry, rz, ws = 20, hs = 14) => { const g = new THREE.SphereGeometry(1, ws, hs); g.scale(rx, ry, rz); return g; };
const see = (root) => { root.traverse((o) => { if (o.isMesh) { o.userData.steam = true; o.frustumCulled = false; } }); };   // worn: the checks see through it

// ------------------------------------------------------------------------------------------------- the worn props' squash
// Same finder as props-spree.js / props-heist.js, with one difference: those worn kinds sit at the body's origin; these are placed at a body-frame
// point (the colander at y 1.07), so the wearer is the potato whose body-frame point (x, y, z) -- the numbers apply() last got -- lies where the prop's
// root is (stage.js puts it at bodyGroup.localToWorld(x, y, z)). `note(ps)` records those numbers. Returns { note, wearer() }.
const _wp = new THREE.Vector3(), _bp = new THREE.Vector3();
function potatoRoots(scene) {
  const out = [];
  scene.traverse((o) => { const bg = o.children[0], pp = bg && bg.children[0], body = pp && pp.children[0]; if (o.isGroup && bg && bg.isGroup && pp && pp.isGroup && body && body.isMesh && body.geometry.attributes.position.count === 12513) out.push(o); });
  return out;
}
function wearSquash(P) {
  const whole = P.whole, sup = whole.updateMatrixWorld, at = [P.spec.x ?? 0, P.spec.y ?? 0, P.spec.z ?? 0];
  let roots = [], last = null;
  const find = () => {
    if (!roots.length) { let s = P.root; while (s.parent) s = s.parent; roots = potatoRoots(s); }   // the cast is built once, before the first frame
    P.root.getWorldPosition(_wp);
    for (const r of roots) { _bp.set(at[0], at[1], at[2]).applyMatrix4(r.children[0].matrixWorld); if (_bp.distanceToSquared(_wp) < 4e-6) return r; }
    return null;
  };
  whole.updateMatrixWorld = function (force) {
    const r = P.root.parent ? find() : null; last = r;
    if (r) { const b = r.children[0].scale; this.scale.set(b.x * r.scale.x, b.y * r.scale.y, b.z * r.scale.z); } else this.scale.set(1, 1, 1);
    sup.call(this, force);
  };
  return { note(ps) { at[0] = ps.x; at[1] = ps.y; at[2] = ps.z; }, wearer: () => last };
}

// the dad's skin at (th, y) and its outward normal: potato.js bodyPoint (no lumps) with th the azimuth of the unit direction, y found by bisection on the elevation
const dirOf = (th, el) => new THREE.Vector3(Math.sin(th) * Math.cos(el), Math.sin(el), Math.cos(th) * Math.cos(el));
function fitPoint(F, d) {
  let r = 1; const q = F.square; if (q) r /= Math.pow(Math.abs(d.x) ** q + Math.abs(d.y) ** q + Math.abs(d.z) ** q, 1 / q);
  const tp = 1 - F.taper * d.y;
  return new THREE.Vector3(d.x * F.rx * tp * r, F.cy + d.y * F.ry * r, d.z * F.rz * tp * r);
}
function fitAt(F, th, y) {
  let lo = -Math.PI / 2 + 1e-4, hi = Math.PI / 2 - 1e-4;
  for (let i = 0; i < 44; i++) { const m = (lo + hi) / 2; if (fitPoint(F, dirOf(th, m)).y < y) lo = m; else hi = m; }
  const el = (lo + hi) / 2, p = fitPoint(F, dirOf(th, el)), e = 1e-4;
  const a = fitPoint(F, dirOf(th + e, el)).sub(p), b = fitPoint(F, dirOf(th, el + e)).sub(p), n = new THREE.Vector3().crossVectors(a, b).normalize();
  if (n.dot(new THREE.Vector3(p.x, p.y - F.cy, p.z)) < 0) n.negate();
  return { p, n };
}
// a basis with +z along n and +y as far up as the surface allows
function frameOf(n) {
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), n); if (right.lengthSq() < 1e-8) right.set(1, 0, 0); right.normalize();
  const up = new THREE.Vector3().crossVectors(n, right).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, n));
}
// a wobbly flat blob (a Shape) of radius r: n lobes with a fixed seed
function blobShape(r, seed, n = 11) {
  const s = new THREE.Shape();
  for (let i = 0; i <= n; i++) { const a = (i % n) / n * Math.PI * 2, k = r * (0.82 + 0.3 * rnd(seed * 13 + i)), x = Math.cos(a) * k, y = Math.sin(a) * k; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  s.closePath(); return s;
}

// ====================================================================================================== kinds
export const GUM_KINDS = {
  // ------------------------------------------------------------------------------------------------ gumbubble
  gumbubble(P) {
    const S = P.spec, G = P.whole, gum = mat("#f58fb5", { roughness: 0.3 }), shade = "#e0709c", hi = "#ffd3e3";
    const W = wearSquash(P);
    const bub = new THREE.Group(); G.add(bub);
    mesh(new THREE.SphereGeometry(1, 30, 22), gum, bub);
    // the highlight patch (upper left) and a shade patch (lower right): flat ovals lying on the sphere, in units of r
    const patch = (dir, rx, ry, color, roll) => {
      const d = new THREE.Vector3(...dir).normalize(), g = new THREE.Group(); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d); g.position.copy(d).multiplyScalar(1.004);
      const m = new THREE.Mesh(new THREE.CircleGeometry(1, 20), basic({ color, side: THREE.DoubleSide })); m.scale.set(rx, ry, 1); m.rotation.z = roll; m.castShadow = false; g.add(m); bub.add(g);
    };
    patch([-0.45, 0.52, 0.72], 0.35, 0.22, hi, 0.6); patch([0.5, -0.5, 0.7], 0.5, 0.3, shade, -0.6);
    // the burst star (a flat splat) and its inner star
    const star = (R, seed) => { const s = new THREE.Shape(), n = 9; for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2 + 0.2, k = i % 2 ? R * 0.46 : R * (0.78 + 0.22 * rnd(seed + i)), x = Math.cos(a) * k, y = Math.sin(a) * k; i ? s.lineTo(x, y) : s.moveTo(x, y); } s.closePath(); return new THREE.ExtrudeGeometry(s, { depth: 0.01, bevelEnabled: false }); };
    const burst = new THREE.Group(); G.add(burst);
    mesh(star(0.19, 3), gum, burst); mesh(star(0.12, 40), mat(hi, { roughness: 0.5 }), burst, 0, 0, 0.004);
    // 8 bits on 8 fixed directions
    const bits = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2 + 0.3 + 0.2 * rnd(i + 5), up = 0.35 + 0.9 * rnd(i + 20), d = new THREE.Vector3(Math.cos(a) * 0.9, up, Math.sin(a) * 0.55 + 0.75).normalize();
      const o = mesh(new THREE.SphereGeometry(0.012 + 0.01 * rnd(i + 50), 10, 8), gum, G); return { o, d, dist: 0.22 + 0.18 * rnd(i + 80) };
    });
    // the 5 stuck blobs: (th, y, r) on his skin, an ellipsoid 0.25 x 0.275 x 0.22 about y 0.415
    const skin = (th, y) => { const dy = (y - 0.415) / 0.275, c = Math.sqrt(Math.max(0, 1 - dy * dy)), p = new THREE.Vector3(0.25 * c * Math.sin(th), y, 0.22 * c * Math.cos(th)); return { p, n: new THREE.Vector3(p.x / 0.0625, dy / 0.275, p.z / 0.0484).normalize() }; };
    const stuckG = new THREE.Group(); G.add(stuckG);
    [[0.15, 0.625, 0.040], [-0.50, 0.61, 0.026], [-0.85, 0.40, 0.050], [0.80, 0.36, 0.036], [0.10, 0.315, 0.040, 0.05]].forEach(([th, y, r, drip], i) => {
      const { p, n } = skin(th, y), g = new THREE.Group(); g.position.copy(p).addScaledVector(n, 0.004); g.quaternion.copy(frameOf(n)); stuckG.add(g);
      mesh(new THREE.ExtrudeGeometry(blobShape(r, i + 1), { depth: 0.012, bevelEnabled: false }), gum, g);
      if (drip) { const ds = new THREE.Shape(); ds.moveTo(-0.008, 0); ds.lineTo(0.008, 0); ds.lineTo(0.006, -drip); ds.quadraticCurveTo(0, -drip - 0.012, -0.006, -drip); ds.closePath(); mesh(new THREE.ExtrudeGeometry(ds, { depth: 0.012, bevelEnabled: false }), gum, g, 0, -r * 0.4, 0); }
    });
    see(G);
    return {
      grip: 0,
      apply(ps) {
        W.note(ps);
        const blow = clamp(ps.blow ?? S.blow ?? 1), pop = clamp(ps.pop ?? 0), stuck = (ps.stuck ?? S.stuck ?? 1) > 0.5;
        const r = 0.02 + 0.10 * blow, cy = 0.385 - 0.25 * r, cz = 0.215 + 0.92 * r;
        bub.position.set(0, cy, cz); bub.scale.setScalar(r); bub.visible = pop <= 0.001;
        burst.visible = pop > 0.001 && pop <= 0.25; burst.position.set(0, cy, cz); burst.scale.setScalar(0.6 + 0.55 * clamp(pop / 0.25));
        const k = pop >= 0.7 ? 1 - (pop - 0.7) / 0.3 : 1, e = 1 - (1 - pop) * (1 - pop);
        for (const b of bits) { b.o.visible = pop > 0.001 && k > 0.001; b.o.position.set(b.d.x * b.dist * e, cy + b.d.y * b.dist * e - 0.10 * pop * pop, cz + b.d.z * b.dist * e); b.o.scale.setScalar(Math.max(k, 0.001)); }
        stuckG.visible = pop > 0.15 && stuck;
      },
    };
  },

  // ------------------------------------------------------------------------------------------------ gumstick
  gumstick(P) {
    const G = P.whole, pink = mat("#f58fb5", { roughness: 0.5 }), groove = mat("#e0709c", { roughness: 0.6 }), foil = mat("#dfe4ea", { roughness: 0.3, metalness: 0.5 }), paper = mat("#f4f1ea", { roughness: 0.8 }), stripe = mat("#f58fb5", { roughness: 0.6 });
    mesh(new THREE.BoxGeometry(0.034, 0.11, 0.008), pink, G, 0, 0.055, 0);
    for (let i = 0; i < 4; i++) { const y = 0.072 + i * 0.0105; mesh(new THREE.BoxGeometry(0.0345, 0.0016, 0.0086), groove, G, 0, y, 0); }
    // the foil sleeve (the lower 0.062) with a torn top: 5 teeth 0.006 deep along the top edge
    mesh(new THREE.BoxGeometry(0.036, 0.056, 0.010), foil, G, 0, 0.028, 0);
    const ts = new THREE.Shape(); ts.moveTo(-0.018, 0); for (let i = 0; i < 5; i++) { const x0 = -0.018 + (i / 5) * 0.036, x1 = x0 + 0.0072; ts.lineTo(x0 + 0.0036, i % 2 ? 0.004 : 0.006 + 0.0 * i); ts.lineTo(x1, 0.0005 * (i % 3)); } ts.lineTo(0.018, 0); ts.closePath();
    mesh(new THREE.ExtrudeGeometry(ts, { depth: 0.010, bevelEnabled: false }), foil, G, 0, 0.056, -0.005);
    // the paper band round the sleeve (0.03 tall, one pink stripe 0.006)
    mesh(new THREE.BoxGeometry(0.0385, 0.030, 0.0125), paper, G, 0, 0.045, 0);
    mesh(new THREE.BoxGeometry(0.0392, 0.006, 0.0132), stripe, G, 0, 0.045, 0);
    return { grip: 0.0275 };
  },

  // ------------------------------------------------------------------------------------------------ eggtimer
  eggtimer(P) {
    const S = P.spec, G = P.whole, red = mat("#d8322b", { roughness: 0.45 }), dark = mat("#b8242a", { roughness: 0.5 });
    const CY = 0.074, RX = 0.09, RY = 0.072, ZC = 0.070;
    // the foot stays; everything above it shakes
    mesh(new THREE.CylinderGeometry(0.045, 0.047, 0.012, 24), dark, G, 0, 0.006, 0);
    const sh = new THREE.Group(); G.add(sh);
    const cut = (g) => { const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getZ(i) > ZC) p.setZ(i, ZC); g.computeVertexNormals(); return g; };   // the front cut flat
    const half = (up) => { const g = new THREE.SphereGeometry(1, 32, 10, 0, Math.PI * 2, up ? 0 : Math.PI / 2, Math.PI / 2); g.scale(RX, RY, RX); g.translate(0, CY, 0); return cut(g); };
    mesh(half(true), red, sh); mesh(half(false), dark, sh);
    { const g = new THREE.TorusGeometry(0.0905, 0.002, 4, 48); g.rotateX(Math.PI / 2); g.scale(1, 1, 0.9945); g.translate(0, CY, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getZ(i) > ZC + 0.0005) p.setZ(i, ZC + 0.0005); mesh(g, mat("#8f1f1c", { roughness: 0.6 }), sh); }
    // the dial boss and the fixed dial (z from 0.0705): plate, bezel, ticks, zero mark, wedge, needle
    mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.032, 32).rotateX(Math.PI / 2), red, sh, 0, CY, ZC - 0.016 + 0.0005);
    const dial = new THREE.Group(); dial.position.set(0, CY, ZC); sh.add(dial);
    const flat = (color, z, geo) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.55, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); const o = mesh(geo, m, dial, 0, 0, z); o.castShadow = false; return o; };
    flat("#f4efe2", 0.0005, new THREE.CircleGeometry(0.057, 36));
    { const b = mesh(new THREE.TorusGeometry(0.058, 0.005, 6, 40), mat("#fbf7ec", { roughness: 0.4 }), dial, 0, 0, 0.0008); b.scale.z = 0.5; }
    for (let i = 0; i < 12; i++) {
      const big = i % 3 === 0, r0 = big ? 0.042 : 0.046, w = big ? 0.0045 : 0.003, a = i * 30 * DEG, len = 0.054 - r0;
      const t = flat("#11101c", 0.0010, new THREE.PlaneGeometry(w, len)); t.position.set(Math.sin(a) * (r0 + len / 2), Math.cos(a) * (r0 + len / 2), 0.0010); t.rotation.z = -a;
    }
    { const s = new THREE.Shape(); s.moveTo(-0.006, 0.0645); s.lineTo(0.006, 0.0645); s.lineTo(0, 0.0525); s.closePath(); flat("#e0392b", 0.0042, new THREE.ShapeGeometry(s)); }
    const wedge = Array.from({ length: 60 }, (_, i) => flat("#e0392b", 0.0013, new THREE.CircleGeometry(0.040, 2, (90 - (i + 1) * 5) * DEG, 5 * DEG)));
    const needle = new THREE.Group(); dial.add(needle);
    { const m = new THREE.MeshStandardMaterial({ color: "#11101c", roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); const n = mesh(new THREE.PlaneGeometry(0.004, 0.040), m, needle, 0, 0.020, 0.0020); n.castShadow = false;
      const h = mesh(new THREE.CircleGeometry(0.007, 14), m, needle, 0, 0, 0.0022); h.castShadow = false; }
    // the top: 5 grooves from the stem to the seam, 5 sepals, the stem; it turns 300 degrees x togo
    const top = new THREE.Group(); sh.add(top);
    const gm = mat("#b8242a", { roughness: 0.5 });
    // each groove is 14 short tubes; apply() hides the ones that the turn carries in front of the dial (they go under its bezel)
    const grooves = [];
    for (let k = 0; k < 5; k++) {
      const az = (k / 5) * Math.PI * 2 + 0.4, pts = [];
      for (let j = 0; j <= 14; j++) { const e = (Math.PI / 2) * (1 - j / 14) * 0.97, c = Math.cos(e); pts.push(new THREE.Vector3(RX * 1.004 * c * Math.sin(az), CY + RY * 1.004 * Math.sin(e), RX * 1.004 * c * Math.cos(az))); }
      for (let j = 0; j < 14; j++) grooves.push({ o: mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([pts[j], pts[j + 1]]), 1, 0.002, 4, false), gm, top), m: pts[j].clone().add(pts[j + 1]).multiplyScalar(0.5) });
    }
    const sepal = (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(0.02, 0.022, 0, 0.05); s.quadraticCurveTo(-0.02, 0.022, 0, 0); const g = new THREE.ShapeGeometry(s, 6); g.rotateX(Math.PI / 2); return g; })();
    const green = mat("#3f9a3a", { roughness: 0.6, side: THREE.DoubleSide });
    for (let k = 0; k < 5; k++) { const g = new THREE.Group(); g.rotation.order = "YXZ"; g.position.y = CY + RY - 0.002; g.rotation.y = (k / 5) * Math.PI * 2 + 0.9; g.rotation.x = 20 * DEG; top.add(g); mesh(sepal, green, g, 0, 0, 0.006); }
    { const st = new THREE.Group(); st.position.y = CY + RY - 0.003; st.rotation.z = 15 * DEG; top.add(st); mesh(new THREE.CylinderGeometry(0.0075, 0.009, 0.022, 10), mat("#2f7a2e", { roughness: 0.6 }), st, 0, 0.011, 0); }
    return {
      grip: 0,
      apply(ps) {
        const t = clamp(ps.togo ?? S.togo ?? S.left ?? 1), ring = clamp(ps.ring ?? 0), sw = Math.sin(Math.PI * ring);
        const n = Math.round(60 * t); wedge.forEach((w, i) => { w.visible = i < n; });
        needle.rotation.z = -300 * DEG * t; top.rotation.y = -300 * DEG * t;
        { const ph = -300 * DEG * t, cs = Math.cos(ph), sn = Math.sin(ph);
          for (const g of grooves) { const x = g.m.x * cs + g.m.z * sn, z = -g.m.x * sn + g.m.z * cs; g.o.visible = !(z > 0 && Math.hypot(x, g.m.y - CY) < 0.064); } }
        sh.position.set(0.004 * Math.sin(40 * Math.PI * ring) * sw, 0.006 * Math.abs(Math.sin(20 * Math.PI * ring)) * sw, 0);
        sh.rotation.z = 4 * DEG * Math.sin(40 * Math.PI * ring + 1.3) * sw;
      },
    };
  },

  // ------------------------------------------------------------------------------------------------ ovenmitts
  ovenmitts(P) {
    const G = P.whole, W = wearSquash(P);
    // the quilt: ONE 256 x 256 canvas = 0.19 m (5 diamonds of 0.038), mapped once by a planar projection on the glove's x, y
    const tex = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = "#c8352c"; g.fillRect(0, 0, w, h);
      const st = w / 5; g.strokeStyle = "#8f241d"; g.lineWidth = 5.4; g.lineCap = "round";
      for (let k = -6; k <= 12; k++) { g.beginPath(); g.moveTo(k * st, 0); g.lineTo(k * st - h, h); g.stroke(); g.beginPath(); g.moveTo(k * st, 0); g.lineTo(k * st + h, h); g.stroke(); }
      g.fillStyle = "#d9483e";
      for (let k = -2; k <= 12; k++) for (let m = -12; m <= 12; m++) { const x = (st * (k + m + 1)) / 2, y = (st * (k - m)) / 2; if (x > -8 && x < w + 8 && y > -8 && y < h + 8) { g.beginPath(); g.arc(x, y, 3.4, 0, Math.PI * 2); g.fill(); } }
    });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    const quilt = mat("#ffffff", { map: tex, roughness: 0.85 }), band = mat("#a82a22", { roughness: 0.8 });
    // the quilt wraps round each part's long axis (the sphere's own UVs: u round it, v pole to pole), tiled so the seam closes
    const tile = (g, nu, nv) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * nu, uv.getY(i) * nv); return g; };
    const shellG = tile(ellipsoid(0.095, 0.135, 0.068, 26, 18), 3, 2.2); shellG.translate(0, 0.025, 0.008);
    const capG = tile(ellipsoid(0.046, 0.072, 0.050, 14, 10), 1, 1); capG.translate(0.055, 0.015, 0.045);   // the curled thumb of a fist stands 1 cm out of the specified shell: a lump over it, off the palm's middle
    const thumbG = tile(ellipsoid(0.040, 0.062, 0.040, 16, 12), 1, 1);
    const cuffG = new THREE.CylinderGeometry(0.066, 0.074, 0.08, 28, 1, true); cuffG.scale(1, 1, 0.052 / 0.066); tile(cuffG, 3, 0.5);
    const bandG = new THREE.CylinderGeometry(0.0745, 0.0755, 0.024, 28, 1, true); bandG.scale(1, 1, 0.060 / 0.0745);
    const loopG = new THREE.TorusGeometry(0.012, 0.003, 6, 14);
    const mitts = {};
    for (const side of ["L", "R"]) {
      const m = new THREE.Group(); m.matrixAutoUpdate = false; G.add(m);
      mesh(shellG, quilt, m); mesh(capG, quilt, m);
      const th = mesh(thumbG, quilt, m, 0.088, 0.015, 0.012); th.rotation.z = -30 * DEG;
      mesh(cuffG, quilt, m, 0, -0.135, 0);
      mesh(bandG, band, m, 0, -0.163, 0);
      const lp = mesh(loopG, band, m, -0.072, -0.17, 0); lp.rotation.y = Math.PI / 2; lp.scale.y = 1.5;
      mitts[side] = m;
    }
    see(G);
    // each frame, before the matrices are used: a mitt = that glove's world matrix x scale(1 / hands.size) (the glove's own mirror puts both thumbs right)
    let on = false; const S1 = new THREE.Matrix4();
    for (const side of ["L", "R"]) {
      const m = mitts[side];
      m.updateMatrixWorld = function () {
        const r = W.wearer(), g = r && r.children.find((c) => c.userData && c.userData.side === side);
        if (!on || !g || !g.visible) { this.visible = false; return; }
        this.visible = true; g.updateWorldMatrix(true, false);
        const k = 1 / (g.userData.size || 1.3); S1.makeScale(k, k, k);
        this.matrixWorld.copy(g.matrixWorld).multiply(S1);
        for (const c of this.children) c.updateMatrixWorld(true);
      };
    }
    return { grip: 0, apply(ps) { W.note(ps); on = (ps.on ?? 0) > 0.5; } };
  },

  // ------------------------------------------------------------------------------------------------ colanderhat
  colanderhat(P) {
    const S = P.spec, G = P.whole, W = wearSquash(P);
    const R = 0.300, H = 0.24, N = 16, SEG = 36;
    // profile r(h) = R (1 - (h/H)^3)^(1/3), sampled finely toward the crown; arc length -> the canvas row
    const prof = [];
    for (let i = 0; i <= N; i++) { const t = i / N, u = 1 - Math.pow(1 - t, 3), h = H * u; prof.push([R * Math.cbrt(Math.max(0, 1 - u * u * u)), h]); }
    prof[N][0] = 0;
    const arc = [0]; for (let i = 1; i <= N; i++) arc.push(arc[i - 1] + Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]));
    const L = arc[N];
    // the one painted canvas: 1024 x 512, u = angle round the dome (0 = front, + toward +x), row = arc length (rim at the bottom, crown at the top)
    const RS = [[0.04, 28], [0.08, 26], [0.12, 22], [0.16, 18], [0.195, 12]];
    const sAt = (h) => { for (let i = 1; i <= N; i++) if (h <= prof[i][1]) return arc[i - 1] + ((arc[i] - arc[i - 1]) * (h - prof[i - 1][1])) / (prof[i][1] - prof[i - 1][1]); return L; };
    const rAt = (h) => { for (let i = 1; i <= N; i++) if (h <= prof[i][1]) return prof[i - 1][0] + ((prof[i][0] - prof[i - 1][0]) * (h - prof[i - 1][1])) / (prof[i][1] - prof[i - 1][1]); return 0; };
    const tex = canvasTex(1024, 512, (g, w, h) => {
      g.fillStyle = "#b9c2cc"; g.fillRect(0, 0, w, h);
      const px = (s) => h * (1 - s / L), kx = w / (Math.PI * 2);
      // the painted highlight streak, 0.02 wide, front left
      g.fillStyle = "#e6ecf2"; { const u = ((-0.6 + Math.PI * 2) % (Math.PI * 2)) * kx, wd = (0.02 / 0.27) * kx; g.beginPath(); g.moveTo(u - wd / 2, px(0.05)); g.lineTo(u + wd / 2, px(0.05)); g.lineTo(u + wd * 0.2, px(0.62 * L)); g.lineTo(u - wd * 0.2, px(0.62 * L)); g.closePath(); g.fill(); }
      g.fillStyle = "#3d444d";
      const dot = (th, s, rr) => { const x = th * kx, ry = (0.008 / L) * h, rx = (0.008 / rr) * kx; for (const dx of [-w, 0, w]) { g.beginPath(); g.ellipse(x + dx, px(s), Math.min(rx, w / 4), ry, 0, 0, Math.PI * 2); g.fill(); } };
      RS.forEach(([hh, n], j) => { const rr = rAt(hh), step = (Math.PI * 2) / n; for (let k = 0; k < n; k++) dot(k * step + (j % 2) * step * 0.5, sAt(hh), rr); });
      // the crown: 1 in the middle (a full-width band at the top row) and 8 round it
      g.fillRect(0, 0, w, (0.008 / L) * h);
      for (let k = 0; k < 8; k++) dot((k / 8) * Math.PI * 2, L - 0.052, 0.052);
    });
    const outG = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), SEG);
    { const uv = outG.attributes.uv; for (let i = 0; i <= SEG; i++) for (let j = 0; j <= N; j++) uv.setXY(i * (N + 1) + j, i / SEG, arc[j] / L); }
    const steel = new THREE.MeshStandardMaterial({ color: "#ffffff", map: tex, roughness: 0.35, metalness: 0.6, side: THREE.DoubleSide });
    mesh(outG, steel, G);
    const inn = new THREE.LatheGeometry(prof.filter((_, i) => i % 2 === 0 || i === N).map(([r, y]) => new THREE.Vector2(Math.max(0, r - 0.006), Math.max(0, y - 0.006))), 24);
    mesh(inn, new THREE.MeshStandardMaterial({ color: "#8e98a4", roughness: 0.5, metalness: 0.5, side: THREE.DoubleSide }), G);
    const rimM = new THREE.MeshStandardMaterial({ color: "#b9c2cc", roughness: 0.35, metalness: 0.6 });
    { const g = new THREE.TorusGeometry(0.302, 0.009, 6, 44); g.rotateX(Math.PI / 2); mesh(g, rimM, G); }
    { const g = new THREE.TorusGeometry(0.095, 0.008, 6, 22); g.rotateX(Math.PI / 2); mesh(g, rimM, G, 0, H, 0); }
    // 2 handles: half loops r 0.045 in the vertical plane through the rim axis, tipped 25 degrees down, each on two rivet plates
    for (const s of [1, -1]) {
      const g = new THREE.Group(); g.position.set(s * 0.300, 0.035, 0); g.rotation.z = -s * 25 * DEG; G.add(g);
      const lg = new THREE.TorusGeometry(0.045, 0.008, 6, 14, Math.PI); lg.rotateZ(-Math.PI / 2); if (s < 0) lg.scale(-1, 1, 1);
      mesh(lg, rimM, g);
      for (const e of [1, -1]) mesh(new THREE.BoxGeometry(0.014, 0.020, 0.020), rimM, g, -s * 0.004, e * 0.045, 0);
    }
    see(G);
    return { grip: 0, apply(ps) { W.note(ps); } };
  },

  // ------------------------------------------------------------------------------------------------ basketarmour
  basketarmour(P) {
    const G = P.whole, W = wearSquash(P), H = 0.24, SEG = 72, F = GUM_FIT.dad, GR = P.spec.grow ?? 0.03;
    const half = (h, k = 0) => [0.455 + GR + (0.497 - 0.455) * (h / H) - k, 0.425 + GR + (0.467 - 0.425) * (h / H) - k];   // the wall's half axes at height h, k inside
    // the one painted canvas 1024 x 256 (u = th round, v = height): the mould lines, 3 rows of 28 holes in his shirt's shade, 2 handle slots
    const TH = (th) => ((th + Math.PI) / (Math.PI * 2)) * 1024, VH = (h) => 256 - (h / H) * 256, kx = 1024 / (Math.PI * 2);
    const tex = canvasTex(1024, 256, (g) => {
      g.fillStyle = "#f1f2ee"; g.fillRect(0, 0, 1024, 256);
      g.fillStyle = "#cfd3d0"; g.fillRect(0, VH(0.03), 1024, 256 - VH(0.03));
      g.strokeStyle = "#e0e3df"; g.lineWidth = 3; for (let i = 0; i < 6; i++) { const x = TH(-Math.PI + (i + 0.5) * (Math.PI / 3)); g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
      g.fillStyle = "#6c7f95";
      const rr = (cx, cy, w, h, r) => { g.beginPath(); g.roundRect(cx - w / 2, cy - h / 2, w, h, r); g.fill(); };
      [0.055, 0.115, 0.175].forEach((hh, j) => {
        for (let k = 0; k < 28; k++) {
          const th = -Math.PI + ((k + 0.5 + (j % 2) * 0.5) / 28) * Math.PI * 2, rad = Math.hypot(0.455 * Math.cos(th), 0.425 * Math.sin(th));
          if (Math.abs(Math.abs(th) - Math.PI / 2) < 0.2 && hh > 0.15) continue;   // the slots' frames
          rr(TH(th), VH(hh), (0.030 / rad) * kx, (0.044 / H) * 256, 3);
        }
      });
      for (const s of [1, -1]) rr(TH(s * Math.PI / 2), VH(0.195), (0.11 / 0.425) * kx, (0.03 / H) * 256, 4);
    });
    const white = new THREE.MeshStandardMaterial({ color: "#ffffff", map: tex, roughness: 0.6, side: THREE.DoubleSide });
    const inner = new THREE.MeshStandardMaterial({ color: "#dfe2de", roughness: 0.7, side: THREE.DoubleSide });
    const wall = (k, m, mapped) => {
      const rows = 4, pos = [], uv = [], idx = [];
      for (let j = 0; j <= rows; j++) for (let i = 0; i <= SEG; i++) { const th = -Math.PI + (i / SEG) * Math.PI * 2, h = (j / rows) * H, [a, b] = half(h, k); pos.push(a * Math.sin(th), h, b * Math.cos(th)); uv.push(i / SEG, j / rows); }
      for (let j = 0; j < rows; j++) for (let i = 0; i < SEG; i++) { const a = j * (SEG + 1) + i, b = a + SEG + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      mesh(g, m, G);
    };
    wall(0, white); wall(0.012, inner);
    // the rolled lip (0.022 tall, 0.014 proud: 0.511 x 0.481 outside)
    { const pts = []; for (let i = 0; i < 64; i++) { const th = (i / 64) * Math.PI * 2; pts.push(new THREE.Vector3((0.500 + GR) * Math.sin(th), H - 0.011, (0.470 + GR) * Math.cos(th))); }
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 64, 0.011, 6, true), mat("#f1f2ee", { roughness: 0.55 }), G); }
    // handle slots: a raised frame 0.006 round each (4 bars), turned to the wall
    for (const s of [1, -1]) {
      const fr = new THREE.Group(); fr.position.set(s * (half(0.195)[0] + 0.002), 0.195, 0); fr.rotation.y = s * Math.PI / 2; G.add(fr);
      const fm = mat("#f1f2ee", { roughness: 0.55 });
      mesh(new THREE.BoxGeometry(0.13, 0.010, 0.006), fm, fr, 0, 0.020, 0.003); mesh(new THREE.BoxGeometry(0.13, 0.010, 0.006), fm, fr, 0, -0.020, 0.003);
      mesh(new THREE.BoxGeometry(0.010, 0.05, 0.006), fm, fr, 0.060, 0, 0.003); mesh(new THREE.BoxGeometry(0.010, 0.05, 0.006), fm, fr, -0.060, 0, 0.003);
    }
    // the 2 straps: his own leather, over the skin + 0.026 along the normal, a stitch line near each edge, a brass rivet at the lip
    const leather = mat("#7a4b2a", { roughness: 0.7, side: THREE.DoubleSide }), stitch = mat("#a06a3c", { roughness: 0.7, side: THREE.DoubleSide }), brass = mat("#dba935", { roughness: 0.35, metalness: 0.6 });
    const strapG = new THREE.Group(); strapG.position.y = -0.20; G.add(strapG);   // the basket's origin is at y 0.20 in the body frame
    const ribbon = (cps, ns, hw, ht, off, offN, m) => {
      const curve = new THREE.CatmullRomCurve3(cps), nc = new THREE.CatmullRomCurve3(ns), n = 28, pos = [], idx = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n, p = curve.getPoint(u), t = curve.getTangent(u), nn = nc.getPoint(u).normalize(), b = new THREE.Vector3().crossVectors(t, nn).normalize();
        const c = p.clone().addScaledVector(b, off).addScaledVector(nn, offN);
        for (const [sb, sn] of [[-1, 1], [1, 1], [1, -1], [-1, -1]]) { const q = c.clone().addScaledVector(b, sb * hw).addScaledVector(nn, sn * ht); pos.push(q.x, q.y, q.z); }
      }
      for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) { const a = i * 4 + k, b = i * 4 + (k + 1) % 4; idx.push(a, b, a + 4, b, b + 4, a + 4); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const o = mesh(g, m, strapG); o.castShadow = false;
    };
    for (const sg of [1, -1]) {
      const cps = [], ns = [];
      for (const [th, y] of [[0.64, 0.44], [0.74, 0.50], [0.86, 0.57], [1.02, 0.625], [1.33, 0.69], [1.69, 0.72]]) { const { p, n } = fitAt(F, sg * th, y); cps.push(p.clone().addScaledVector(n, 0.026)); ns.push(n); }
      ribbon(cps, ns, 0.018, 0.003, 0, 0, leather);
      for (const o of [-0.012, 0.012]) ribbon(cps, ns, 0.002, 0.0006, o, 0.0034, stitch);
      const rv = mesh(new THREE.SphereGeometry(0.009, 10, 8), brass, strapG, cps[0].x, cps[0].y, cps[0].z); rv.scale.set(1, 1, 0.6); rv.quaternion.copy(frameOf(ns[0]));
    }
    see(G);
    return { grip: 0, apply(ps) { W.note(ps); } };
  },

  // ------------------------------------------------------------------------------------------------ potlid
  potlid(P) {
    const G = P.whole, R = 0.22, SAG = 0.045, RC = (R * R + SAG * SAG) / (2 * SAG), A = Math.asin(R / RC);
    const steel = new THREE.MeshStandardMaterial({ color: "#b9c2cc", roughness: 0.35, metalness: 0.6, side: THREE.DoubleSide });
    const under = new THREE.MeshStandardMaterial({ color: "#8e98a4", roughness: 0.5, metalness: 0.5, side: THREE.DoubleSide });
    const cap = (off) => { const pts = [], Ro = RC - off; for (let i = 0; i <= 14; i++) { const a = (1 - i / 14) * A; pts.push(new THREE.Vector2(Ro * Math.sin(a), Ro * Math.cos(a) - RC * Math.cos(A))); } const g = new THREE.LatheGeometry(pts, 40); g.rotateX(Math.PI / 2); return g; };
    mesh(cap(0), steel, G); mesh(cap(0.005), under, G);
    { const g = new THREE.TorusGeometry(R, 0.007, 6, 48); mesh(g, new THREE.MeshStandardMaterial({ color: "#b9c2cc", roughness: 0.35, metalness: 0.6 }), G); }
    for (const r of [0.10, 0.17]) { const z = Math.sqrt(RC * RC - r * r) - RC * Math.cos(A); mesh(new THREE.TorusGeometry(r, 0.0015, 4, 40), mat("#8e98a4", { roughness: 0.5, metalness: 0.5 }), G, 0, 0, z + 0.0005); }
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.004, 20).rotateX(Math.PI / 2), steel, G, 0, 0, SAG + 0.001);
    const black = mat("#2b2d33", { roughness: 0.5 });
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.022, 12).rotateX(Math.PI / 2), black, G, 0, 0, SAG + 0.012);
    mesh(ellipsoid(0.030, 0.030, 0.018, 18, 12), black, G, 0, 0, SAG + 0.022 + 0.008);
    return { grip: 0 };
  },

  // ------------------------------------------------------------------------------------------------ xrayfilm
  xrayfilm(P) {
    const G = P.whole, W = 0.34, Ht = 0.46, T = 0.008, CR = 0.02, K = 2000;
    const rr = new THREE.Shape(); rr.moveTo(-W / 2 + CR, 0); rr.lineTo(W / 2 - CR, 0); rr.quadraticCurveTo(W / 2, 0, W / 2, CR); rr.lineTo(W / 2, Ht - CR); rr.quadraticCurveTo(W / 2, Ht, W / 2 - CR, Ht); rr.lineTo(-W / 2 + CR, Ht); rr.quadraticCurveTo(-W / 2, Ht, -W / 2, Ht - CR); rr.lineTo(-W / 2, CR); rr.quadraticCurveTo(-W / 2, 0, -W / 2 + CR, 0);
    const body = mesh(new THREE.ExtrudeGeometry(rr, { depth: T, bevelEnabled: false, curveSegments: 5 }), mat("#14284a", { roughness: 0.6 }), G, 0, 0, -T / 2);
    // the picture: one canvas 680 x 920 (2000 px per metre), self-lit, on the -z face; x from the middle, y from the lower edge, as the viewer of the picture sees it
    const tex = canvasTex(680, 920, (g, w, h) => {
      const X = (x) => w / 2 + x * K, Y = (y) => h - y * K;
      const egg = (cx, cy, hw, hh, steps = 72) => { g.beginPath(); for (let i = 0; i <= steps; i++) { const t = (i / steps) * Math.PI * 2, x = hw * Math.sin(t) * (1 - 0.09 * Math.cos(t)), y = cy + hh * Math.cos(t); i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); } g.closePath(); };
      // the ground (kept on a copy: the potato's inside is put back from it, so the ball is the only thing in there)
      const bg = document.createElement("canvas"); bg.width = w; bg.height = h; const b = bg.getContext("2d");
      b.fillStyle = "#0f2444"; b.fillRect(0, 0, w, h);
      const grad = b.createRadialGradient(X(0), Y(0.25), 0, X(0), Y(0.25), 0.26 * K); grad.addColorStop(0, "#1c3f6e"); grad.addColorStop(0.6, "rgba(28,63,110,0.55)"); grad.addColorStop(1, "rgba(28,63,110,0)");
      b.fillStyle = grad; b.fillRect(0, 0, w, h);
      b.strokeStyle = "#2a5488"; b.lineWidth = 2; b.lineCap = "round"; b.globalAlpha = 0.5;
      [[-0.12, 0.43, -0.03, 0.30], [0.10, 0.20, 0.15, 0.36], [-0.14, 0.18, -0.06, 0.22]].forEach(([x0, y0, x1, y1]) => { b.beginPath(); b.moveTo(X(x0), Y(y0)); b.lineTo(X(x1), Y(y1)); b.stroke(); });
      b.globalAlpha = 1; b.strokeStyle = "#0a1830"; b.lineWidth = 0.012 * K * 2; b.strokeRect(0, 0, w, h);
      g.drawImage(bg, 0, 0);
      // the outline's parts that stand out of the body: legs, sandals, arms, leaves
      g.lineJoin = "round"; g.lineCap = "round";
      const glow = (fn) => { g.save(); g.shadowColor = "#6fb6e8"; g.shadowBlur = 0.012 * K * 2; g.strokeStyle = "#cfeaff"; g.lineWidth = 0.004 * K; fn(); g.stroke(); g.restore(); };
      for (const s of [-1, 1]) {
        glow(() => { g.beginPath(); g.moveTo(X(s * 0.034), Y(0.150)); g.lineTo(X(s * 0.034), Y(0.110)); g.moveTo(X(s * 0.056), Y(0.150)); g.lineTo(X(s * 0.056), Y(0.110)); });
        glow(() => { g.beginPath(); g.ellipse(X(s * 0.049 + s * 0.006), Y(0.102), 0.025 * K, 0.009 * K, 0, 0, Math.PI * 2); });
        glow(() => { const ax = s * 0.113, ay = 0.300, dx = s * Math.sin(20 * DEG), dy = -Math.cos(20 * DEG), L = 0.075, r = 0.012, nx = -dy, ny = dx; g.beginPath();
          g.moveTo(X(ax + nx * r), Y(ay + ny * r)); g.lineTo(X(ax + dx * L + nx * r), Y(ay + dy * L + ny * r)); g.arc(X(ax + dx * L), Y(ay + dy * L), r * K, Math.atan2(-(ny), nx), Math.atan2(-(ny), nx) + Math.PI * (s > 0 ? 1 : -1), s < 0); g.lineTo(X(ax - nx * r), Y(ay - ny * r)); });
      }
      [[-0.022, 0.426, 0.092], [0.0, 0.435, 0.090], [0.022, 0.430, 0.086]].forEach(([x0, ty, len]) => {
        g.save(); g.fillStyle = "rgba(111,182,232,0.30)"; g.beginPath(); g.moveTo(X(x0), Y(0.402)); g.quadraticCurveTo(X(x0 + len * 0.55), Y(ty + 0.014), X(x0 + len), Y(ty)); g.quadraticCurveTo(X(x0 + len * 0.45), Y(ty - 0.004), X(x0 + 0.006), Y(0.399)); g.closePath(); g.fill(); g.restore();
        glow(() => { g.beginPath(); g.moveTo(X(x0), Y(0.402)); g.quadraticCurveTo(X(x0 + len * 0.55), Y(ty + 0.014), X(x0 + len), Y(ty)); g.quadraticCurveTo(X(x0 + len * 0.45), Y(ty - 0.004), X(x0 + 0.006), Y(0.399)); });
      });
      // the inside of the outline is put back to the ground; then the rim glows, the outline, the moustache and the ball
      g.save(); egg(0, 0.273, 0.115, 0.131); g.clip(); g.drawImage(bg, 0, 0);
      for (let k = 0; k < 8; k++) { g.globalAlpha = 0.07; g.strokeStyle = "#2f6fa8"; g.lineWidth = 2 * 0.03 * K * (1 - k / 8); egg(0, 0.273, 0.115, 0.131); g.stroke(); }
      g.globalAlpha = 1; g.restore();
      g.save(); g.shadowColor = "#7fc4f0"; g.shadowBlur = 0.01 * K; g.fillStyle = "rgba(150,205,245,0.55)";
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(X(s * 0.03), Y(0.258 + 0.004), 0.034 * K, 0.014 * K, -s * 0.18, 0, Math.PI * 2); g.fill(); }
      g.restore();
      glow(() => egg(0, 0.273, 0.115, 0.131));
      // the gum ball: 37 % of the body's width, the only warm colour
      { const cx = X(0), cy = Y(0.193), R = 0.044 * K, gr = g.createRadialGradient(cx - R * 0.25, cy - R * 0.25, 0, cx, cy, R); gr.addColorStop(0, "#ffd3e3"); gr.addColorStop(1, "#f58fb5");
        g.save(); g.shadowColor = "rgba(245,143,181,0.85)"; g.shadowBlur = 0.012 * K * 2; g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill(); g.restore();
        g.strokeStyle = "#ffe9f1"; g.lineWidth = 0.003 * K; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
        g.strokeStyle = "#ffffff"; g.lineCap = "round"; g.lineWidth = 0.004 * K; g.beginPath(); g.arc(cx, cy, R * 0.68, Math.PI * 1.05, Math.PI * 1.45); g.stroke(); g.lineWidth = 0.0025 * K; g.beginPath(); g.arc(cx, cy, R * 0.5, Math.PI * 1.62, Math.PI * 1.8); g.stroke(); }
      // the label: a white strip 0.28 x 0.068, turned 2 degrees, "DAD 1995" in bold condensed capitals, cap height 0.042
      g.save(); g.translate(X(-0.02), Y(0.054)); g.rotate(-2 * DEG);
      g.fillStyle = "#f4f1ea"; g.beginPath(); g.roundRect(-0.14 * K, -0.034 * K, 0.28 * K, 0.068 * K, 0.006 * K); g.fill();
      const face = (px) => `bold ${px}px "DejaVu Sans Condensed", "Liberation Sans Narrow", "Arial Narrow", "DejaVu Sans", sans-serif`;
      g.font = face(100); const asc = g.measureText("D").actualBoundingBoxAscent, fs = (100 * 0.042 * K) / asc; g.font = face(fs);
      const tw = g.measureText("DAD 1995").width, sx = Math.min(1, (0.25 * K) / tw);
      g.fillStyle = "#1a2233"; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.scale(sx, 1); g.fillText("DAD 1995", 0, 0.021 * K); g.restore();
    });
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(W, Ht), basic({ map: tex, toneMapped: false, side: THREE.FrontSide })); pic.rotation.y = Math.PI; pic.position.set(0, Ht / 2, -T / 2 - 0.0004); pic.castShadow = false; G.add(pic);
    return { grip: 0.253 };
  },
};
