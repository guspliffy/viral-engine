import * as THREE from "three";
import { clamp } from "./util.js";

// Props for "Kid vs Dad" 01, "BREAKING: Dad has told 4,000 dad jokes" (22 Nov 2026; design:
// storyboards/series/kid-vs-dad/01-dad-jokes-news/DESIGN.md sections 3 and 4). Metres before spec.scale. The cast are
// round potatoes. Deterministic: every coin is placed once from a hash, every animation is a pure function of the prop's
// tween values. Nothing here tweens material.opacity (clip-lessons: that freezes in a sequential render): the jar's glass
// has a fixed opacity, the heap grows by scale and visibility.
//
// TWEEN KEYS: `fill` and `ring` are in props3d.js propState's fixed list (propState gives fill 1 when the spec has none,
// so set spec.fill: 0.82 in this film). `plink`, `hit` and `strike` are not: prime each once with a zero-length tween
// before its first real one, or the first tween jumps to its target:
//   c.prop(0, "jar", { plink: 0 }, 0)   then   c.prop(12.3, "jar", { plink: 1 }, 0.1, "linear")
//   c.prop(0, "kit", { hit: 0 }, 0)     then   c.prop(5.0, "kit", { hit: 1 }, 0.25, "linear")
//   c.prop(0, "sticks", { strike: 0 }, 0)   then   c.prop(5.0, "sticks", { strike: 1 }, 0.2, "linear")
// (0 and 1 are both at rest for plink, hit and strike.) A key never tweened reads as its spec value, then 0.
//
//   jokejar     a squat glass jar of coins, 0.30 across (0.31 at the base ring), 0.23 tall (rim top 0.226). Origin: the middle
//               of its underside, on the floor / seat. No lid, no label. Glass body (r 0.15, shoulder in to r 0.115 at y 0.195,
//               neck out to r 0.12 at the rim): tint #dff1ec, FIXED opacity 0.28 (as tipjar; marked glass, so a hand cannot
//               pass through it), a solid rim roll #bcd9d6 (tube 0.011 at y 0.215, r 0.122), a solid base ring 0.015 tall,
//               two solid white streaks on the front left. Inside: a solid mass #c98f1a and 63 plain coins (r 0.04, 0.008
//               thick, #f0b92e, edge line #9a6a10, no relief): 45 stand on the outside of the mass against the glass in five
//               rows (leaning back up to 35 degrees), 18 lie on the domed top (up to 35 degrees).
//               fill 0..1    heap level y = 0.02 + 0.135 x fill, the dome 0.035 higher in the middle (spec.fill; 0 = empty jar;
//                            this film 0.82). Wall coins above the level are hidden, the mass is scaled: scale and
//                            visibility only.
//               plink 0..1   the heap jolts up 0.004 (a half sine over the tween: tween 0 -> 1 over 3 frames, 0.1 s) and from
//                            0.5 one more coin lies on the peak (it stays until plink goes back to 0).
//               HELD: both palms flat on the sides, box hold (SIZE.jokejar = { w: 0.30, h: 0.23, d: 0.30 }; pass gap: 0.03:
//               palms at x = +-0.18, y = 0.55 x 0.23 = 0.127), the jar against the holder's belly. Never held by one hand.
//   snaredrum   a snare drum on a chrome tripod stand with a cymbal arm. Origin: the ground under the stand; the drum faces +z
//               (the yard); the head's centre is at y 0.93, the head tipped 12 degrees toward +z. Shell 0.36 across, 0.13
//               deep, #c2272d, two chrome hoops (r 0.006), 8 lugs (0.012 x 0.05) #c9ced6, head #f3efe4 with one worn smudge
//               #d9d4c6 0.09 across. Stand: three chrome legs (tube r 0.012) out to r 0.26. Cymbal arm: tube r 0.008 from the
//               stand at y 0.55, looping back (-z) and up, to the named point "cymbal".
//               hit 0..1     a strike as bassdrum's: the head dips 0.008 and the drum bobs 0.006, decaying inside the tween
//                            (0 -> 1 over 0.25 s). Not held.
//               Named points: "beat" [0, 0.93, 0] (the head's centre); "cymbal" [0.26, 1.20, -0.18]: put a `cymbal` prop
//               there (spec x/y/z = kit + the point, tip 105 = dome up, tipped 15 degrees toward +z); its `ring` is the "tss".
//   drumsticks  ONE prop, both sticks of a pair: each 0.30 long, r 0.008 at the butt down to 0.005, acorn tip r 0.009,
//               #e3c08a, the two splayed 10 degrees apart (+-5 about y). Origin: the grip point, 0.07 from the butts (+z);
//               they point along -z (away from the holder in the hold frame), tips raised 20 degrees.
//               strike 0..1  the pair tips 38 degrees down about the grip and back, lowest at 0.35 (tween 0 -> 1 over 0.2
//                            s): the tips drop 0.14.
//               HELD: Spud's LEFT fist, mug hold { side: "L" } with SIZE.drumsticks = { r: 0.008, h: 0 }, the fist on the
//               origin (the megaphone's precedent). placeFor(kind, at, yaw) as for a mug (no extra turn).

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const smooth = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const D2R = Math.PI / 180;
const chrome = () => mat("#c9ced6", { roughness: 0.3, metalness: 0.5 });
// a round bar from point a to point b
function bar(a, b, r, m, parent) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length();
  const o = mesh(new THREE.CylinderGeometry(r, r, L, 10), m, parent, ...A.clone().add(B).multiplyScalar(0.5).toArray());
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return o;
}

// the jar's numbers
const JAR = { R: 0.15, Y0: 0.02, LVL: 0.135, DOME: 0.035, MASS_R: 0.125, COIN_R: 0.04, COIN_T: 0.008, WALL_ROWS: [0.045, 0.07, 0.095, 0.12, 0.145], WALL_N: 9, TOP_N: 18 };

export const KVD_KINDS = {
  jokejar(P) {
    const glass = new THREE.MeshPhysicalMaterial({ color: "#dff1ec", roughness: 0.06, transparent: true, opacity: 0.28, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide });
    glass.userData.glass = true;
    const solid = mat("#bcd9d6", { roughness: 0.3 });
    // glass body: wall r 0.15 from 0.015 to 0.155, a rounded shoulder in to r 0.115 at 0.195, the neck out to r 0.12 at 0.215, open top
    const prof = [new THREE.Vector2(0.0001, 0.015), new THREE.Vector2(JAR.R, 0.015), new THREE.Vector2(JAR.R, 0.155)];
    for (let i = 1; i <= 8; i++) { const u = i / 8, v = 1 - u; prof.push(new THREE.Vector2(v * v * JAR.R + 2 * u * v * JAR.R + u * u * 0.115, v * v * 0.155 + 2 * u * v * 0.19 + u * u * 0.195)); }
    prof.push(new THREE.Vector2(0.12, 0.215));
    const body = mesh(new THREE.LatheGeometry(prof, 40), glass, P.whole); body.castShadow = false; body.renderOrder = 3;
    const rim = mesh(new THREE.TorusGeometry(0.122, 0.011, 8, 40), solid, P.whole, 0, 0.215, 0); rim.rotation.x = Math.PI / 2; rim.castShadow = false;
    mesh(new THREE.CylinderGeometry(JAR.R + 0.002, JAR.R + 0.002, 0.015, 40), solid, P.whole, 0, 0.0075, 0).castShadow = false;
    // two solid white streaks on the front left (theta from +z toward +x: negative = left), 0.012 wide
    const white = new THREE.MeshBasicMaterial({ color: "#ffffff" }); white.userData.noOutline = true;
    for (const [th, y0, y1] of [[-0.5, 0.04, 0.15], [-0.74, 0.06, 0.12]]) {
      const w = 0.012 / (JAR.R + 0.002), g = new THREE.CylinderGeometry(JAR.R + 0.0015, JAR.R + 0.0015, y1 - y0, 4, 1, true, th - w / 2, w);
      const s = mesh(g, white, P.whole, 0, (y0 + y1) / 2, 0); s.castShadow = s.receiveShadow = false;
    }
    // the heap: a mass of deeper gold and plain coins, each placed once
    const heap = new THREE.Group(); P.whole.add(heap);
    const massM = mat("#c98f1a", { roughness: 0.55, metalness: 0.2 });
    const mass = mesh(new THREE.CylinderGeometry(JAR.MASS_R, JAR.MASS_R, 1, 32), massM, heap, 0, JAR.Y0, 0); mass.castShadow = false;
    const domeGeo = new THREE.SphereGeometry(1, 28, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = mesh(domeGeo, massM, heap); dome.castShadow = false;
    const coinGeo = new THREE.CylinderGeometry(JAR.COIN_R, JAR.COIN_R, JAR.COIN_T, 22);
    const edgeM = mat("#9a6a10", { roughness: 0.5 }), faceM = mat("#f0b92e", { roughness: 0.42, metalness: 0.3 });
    const coinMats = [edgeM, faceM, faceM];
    const walls = [], tops = [];
    // wall coins: stand against the glass, each leaning back (top toward the axis) up to 35 degrees
    JAR.WALL_ROWS.forEach((y0, row) => {
      for (let k = 0; k < JAR.WALL_N; k++) {
        const i = row * 20 + k, ang = ((k + (row % 2) * 0.5) / JAR.WALL_N) * Math.PI * 2 + (rnd(i) - 0.5) * 0.2;
        const cy = y0 + (rnd(i + 70) - 0.5) * 0.012, lean = rnd(i + 40) ** 2 * 35 * D2R, spin = (rnd(i + 90) - 0.5) * 0.5;
        const r = 0.139 - JAR.COIN_R * Math.sin(lean) + row * 0.0004;   // the bottom edge stays inside the glass; each row a hair further out
        const c = mesh(coinGeo, coinMats, heap, Math.sin(ang) * r, cy, Math.cos(ang) * r); c.castShadow = false;
        // the face looks out along the radius; the lean tips the top toward the axis
        c.rotation.order = "YXZ"; c.rotation.set(Math.PI / 2 - lean, ang, spin);
        walls.push({ c, cy });
      }
    });
    // top coins: lie on the dome, the normal of the surface plus up to 10 degrees of jitter (35 degrees at most)
    for (let k = 0; k < JAR.TOP_N; k++) {
      const i = 300 + k, rho = (k === 0 ? 0.01 : 0.02 + 0.07 * Math.sqrt((k + rnd(i)) / JAR.TOP_N)), phi = k * 2.399 + rnd(i + 5);
      const c = mesh(coinGeo, coinMats, heap); c.castShadow = false;
      tops.push({ c, rho, phi, jit: [(rnd(i + 11) - 0.5) * 0.35, (rnd(i + 23) - 0.5) * 0.35], lift: 0.005 + k * 0.0007 });
    }
    const peak = mesh(coinGeo, coinMats, heap); peak.castShadow = false; peak.rotation.set(0.12, 0.5, -0.1);
    const up = new THREE.Vector3(0, 1, 0), n = new THREE.Vector3(), q = new THREE.Quaternion();
    let last = "";
    return {
      grip: 0.127,
      apply(ps) {
        const f = clamp(ps.fill ?? P.spec.fill ?? 0), pl = clamp(ps.plink ?? P.spec.plink ?? 0);
        const key = f + "/" + pl; if (key === last) return; last = key;
        const rise = f * JAR.LVL, level = JAR.Y0 + rise, domeH = JAR.DOME * smooth(rise / JAR.DOME), on = f > 0.002;
        heap.position.y = 0.004 * Math.sin(Math.PI * pl);
        mass.visible = dome.visible = on; mass.scale.y = Math.max(rise, 0.0001);
        dome.position.y = level; dome.scale.set(JAR.MASS_R, Math.max(domeH, 0.0001), JAR.MASS_R);
        for (const w of walls) w.c.visible = on && w.cy <= level - 0.01;
        for (const t of tops) {
          const x = t.rho * Math.cos(t.phi), z = t.rho * Math.sin(t.phi), s = (2 * domeH * t.rho) / (JAR.MASS_R * JAR.MASS_R);
          t.c.visible = on;
          t.c.position.set(x, level + domeH * (1 - (t.rho / JAR.MASS_R) ** 2) + t.lift, z);
          n.set(s * Math.cos(t.phi) + t.jit[0], 1, s * Math.sin(t.phi) + t.jit[1]).normalize();
          t.c.quaternion.copy(q.setFromUnitVectors(up, n));
        }
        peak.visible = on && pl >= 0.5; peak.position.set(0.004, level + domeH + 0.014, 0);
      },
    };
  },

  snaredrum(P) {
    const red = mat("#c2272d", { roughness: 0.35, metalness: 0.15 }), ch = chrome();
    const R = 0.18, DEEP = 0.13, HEADY = 0.93, TILT = 12 * D2R;
    // stand: three legs from the basket to r 0.26 on the ground, a short shaft under the drum
    const apex = [0, 0.77, 0];
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + Math.PI / 6; bar(apex, [Math.sin(a) * 0.26, 0.006, Math.cos(a) * 0.26], 0.012, ch, P.whole); }
    bar([0, 0.55, 0], [0, 0.8, 0], 0.012, ch, P.whole);
    // cymbal arm: from the shaft at y 0.55 back (-z) and up to the named point, ending under the cymbal's dome
    const CYM = [0.26, 1.2, -0.18];
    const curve = new THREE.CatmullRomCurve3([[0, 0.55, 0], [0.1, 0.57, -0.28], [0.26, 0.85, -0.28], [0.26, 1.0, -0.21], [CYM[0], CYM[1] - 0.012, CYM[2] - 0.01]].map((p) => new THREE.Vector3(...p)), false, "centripetal");
    mesh(new THREE.TubeGeometry(curve, 24, 0.008, 8, false), ch, P.whole);
    // the drum: a group about the head's centre, tipped 12 degrees toward +z; the shell hangs under the head plane
    const root = new THREE.Group(); root.position.y = HEADY; root.rotation.x = TILT; P.whole.add(root);
    const shell = mesh(new THREE.CylinderGeometry(R, R, DEEP, 48, 1, true), red, root, 0, -DEEP / 2, 0); shell.material.side = THREE.DoubleSide;
    for (const y of [0, -DEEP]) { const h = mesh(new THREE.TorusGeometry(R + 0.004, 0.006, 8, 48), ch, root, 0, y, 0); h.rotation.x = Math.PI / 2; }
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; mesh(new THREE.BoxGeometry(0.012, 0.05, 0.012), ch, root, Math.sin(a) * (R + 0.007), -DEEP / 2, Math.cos(a) * (R + 0.007)); }
    // the head (it dips on a hit) with one worn smudge
    const skin = canvasTex(256, 256, (g, W) => {
      g.fillStyle = "#f3efe4"; g.fillRect(0, 0, W, W);
      const k = W * 0.09 / (2 * R);   // 0.09 across
      g.fillStyle = "#d9d4c6"; g.beginPath(); g.ellipse(W * 0.6, W * 0.38, k / 2, k / 2 * 0.75, 0.5, 0, Math.PI * 2); g.fill();
    });
    const headM = new THREE.MeshStandardMaterial({ map: skin, roughness: 0.55 });
    const head = mesh(new THREE.CircleGeometry(R, 48), headM, root); head.rotation.x = -Math.PI / 2;
    let last = -1;
    return {
      grip: 0, point: { beat: [0, HEADY, 0], cymbal: CYM },
      apply(ps) {
        const h = clamp(ps.hit ?? P.spec.hit ?? 0); if (h === last) return; last = h;
        const u = clamp((h - 0.08) / 0.52), d = h < 0.08 ? h / 0.08 : (1 - u) * (1 - u);
        root.position.y = HEADY + 0.006 * d; head.position.y = -0.008 * d;
      },
    };
  },

  drumsticks(P) {
    const wood = mat("#e3c08a", { roughness: 0.55 });
    const pair = new THREE.Group(); pair.rotation.x = 20 * D2R; P.whole.add(pair);   // tips raised 20 degrees
    for (const s of [1, -1]) {
      const g = new THREE.Group(); g.rotation.y = s * 5 * D2R; pair.add(g);       // splayed 10 degrees
      const st = mesh(new THREE.CylinderGeometry(0.008, 0.005, 0.3, 12), wood, g, 0, 0, -0.08); st.rotation.x = Math.PI / 2;   // +y end = the butt on +z
      const tip = mesh(new THREE.SphereGeometry(0.009, 12, 10), wood, g, 0, 0, -0.23); tip.scale.z = 1.25;
    }
    let last = -1;
    return {
      grip: 0,
      apply(ps) {
        const k = clamp(ps.strike ?? P.spec.strike ?? 0); if (k === last) return; last = k;
        const d = k < 0.35 ? smooth(k / 0.35) : 1 - smooth((k - 0.35) / 0.65);
        pair.rotation.x = (20 - 38 * d) * D2R;
      },
    };
  },
};
