import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp } from "./util.js";

// Props for the King's Guard London clip (4 Nov 2026, Jonny's board 02-kings-guard-panels.png). Studied from the real
// place before building: a Foot Guards sentry box is a narrow wooden hut a little taller than a man with a pitched
// roof, open at the front, painted with the regiment's stripes on its front edges; the forecourt railings are black
// cast iron bars about a hand apart with gilded spear tips and two rails, set in a stone kerb; the gate piers are
// square stone blocks of big pale Portland stone courses with a projecting cap. Pigeons are plump grey birds with a
// darker grey head, a green-purple sheen round the neck, two black wing bars, an orange eye and pink feet.
//   sentrybox  the guard's hut: spec.w (inside width, 1.2), spec.d (inside depth, 0.85), spec.h (wall height, 2.1).
//              Open toward +z; origin at the middle of its floor. White walls, red and white diagonal stripes down the
//              front posts and along the gable, a slate roof, a low plinth.
//   railings   forecourt railings along x from spec.x0 to spec.x1 (spec.gaps [[a, b]] left out), spec.h tall, on a
//              stone kerb. Origin on the floor line.
//   stoneblock a block of pale ashlar: spec.w (x), spec.h, spec.d (z), spec.cap (a projecting cap stone, m), origin at
//              its bottom centre. Courses darken toward the wet foot.
//   pigeon     a London pigeon facing +z, origin between its feet: `flap` 0..1 spreads and beats the wings (flight),
//              `happy` 0..1 the head bobs (perched, looking about), `peck` 0..1 the head dips. Move it with x/y/z tweens.
//   fireball   one juggled fireball: a camera-facing cel-banded flame (white core, yellow, orange, a red rim) that
//              flickers; `on` 0..1. spec.r its radius. See-through (steam) for the checks.
//   tear       a laughter tear worn on a face (spec.wear): a bright drop at the origin with a wet trail up along +y
//              (`fill` 0..1 of spec.length), `on` 0..1. spec.stream: a long streaming tear (panel 7). Steam for the checks.
//   tongue     a pink tongue stuck out of a mouth (spec.wear on the face): `on` 0..1 (0 hidden). Steam for the checks.
//   wetpuddle  a grey rain puddle on the paving (spec.rx, spec.rz), reflecting the overcast sky; `splash` 0..1 throws a
//              crown of drops out and back, `ring` 0..1 runs rings out from the middle. Flat, see-through for the checks.
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const steamy = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.userData.steam = true; return o; };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function canvasTex(w, h, draw, rep) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}
// red and white diagonal stripes, as on the sentry box's front posts
const stripeTex = (rep) => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = "#f4f1ea"; g.fillRect(0, 0, w, h); g.fillStyle = "#c2242c";
  for (let k = -2; k < 4; k++) { g.beginPath(); g.moveTo(k * 64, 0); g.lineTo(k * 64 + 32, 0); g.lineTo(k * 64 + 32 + 128, h); g.lineTo(k * 64 + 128, h); g.closePath(); g.fill(); }
}, rep);
// Portland stone courses: blocks 0.6 x 0.3 m in staggered courses, each block a little different, thin mortar joints,
// a darker damp band at the foot (texture = 1 x 1 m of wall)
function ashlarTex(rep, seed = 1, wet = true) {
  return canvasTex(256, 256, (g, W, H) => {
    const rows = 10 / 3, bw = W * 0.6, bh = H / rows;
    for (let r = 0; r < Math.ceil(rows) + 1; r++) for (let c = -1; c < 3; c++) {
      const x = c * bw + (r % 2 ? bw / 2 : 0), y = H - (r + 1) * bh, k = rnd(seed * 31 + r * 7 + c * 3);
      const v = 222 - 16 * k, warm = 6 * rnd(seed + r + c * 11);
      g.fillStyle = `rgb(${v + warm},${v + warm * 0.6 - 2},${v - 10})`; g.fillRect(x, y, bw, bh);
      g.fillStyle = "rgba(120,110,100,0.08)"; for (let i = 0; i < 6; i++) g.fillRect(x + rnd(i + r * 13 + c) * bw, y + rnd(i * 3 + r) * bh, 6 + 10 * rnd(i + c), 2);
    }
    g.strokeStyle = "rgba(110,102,92,0.75)"; g.lineWidth = 2.2;
    for (let r = 0; r <= Math.ceil(rows); r++) { const y = H - r * bh; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); for (let c = -1; c < 3; c++) { const x = c * bw + (r % 2 ? bw / 2 : 0); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - bh); g.stroke(); } }
    if (wet) { const gr = g.createLinearGradient(0, H, 0, H * 0.72); gr.addColorStop(0, "rgba(70,72,80,0.35)"); gr.addColorStop(1, "rgba(70,72,80,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  }, rep);
}

export const GUARD_KINDS = {
  sentrybox(P) {
    const S = P.spec, W = S.w ?? 1.2, D = S.d ?? 0.85, H = S.h ?? 2.1, T = 0.06, ridge = S.ridge ?? 0.42;
    const white = mat("#ece8de", { roughness: 0.6 }), inside = mat("#d9d4c8", { roughness: 0.8 }), slate = mat("#4a4d55", { roughness: 0.55 });
    const plinth = mat("#9b978f", { roughness: 0.85 });
    mesh(new THREE.BoxGeometry(W + 2 * T + 0.08, 0.06, D + T + 0.08), plinth, P.whole, 0, 0.03, -T / 2);
    // back and side walls (outside white, inside a shadowed grey-white)
    mesh(new THREE.BoxGeometry(W + 2 * T, H, T), white, P.whole, 0, H / 2 + 0.06, -D / 2 - T / 2);
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(T, H, D), white, P.whole, s * (W / 2 + T / 2), H / 2 + 0.06, 0);
    mesh(new THREE.PlaneGeometry(W, H), inside, P.whole, 0, H / 2 + 0.06, -D / 2 + 0.001).receiveShadow = true;
    // the striped front posts (a little proud of the side walls) and the lintel
    const postW = 0.13, stripes = stripeTex([1, H / 0.5]);
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(postW, H, 0.08), mat("#ffffff", { map: stripes, roughness: 0.6 }), P.whole, s * (W / 2 + T - postW / 2 + 0.02), H / 2 + 0.06, D / 2 + 0.02);
    mesh(new THREE.BoxGeometry(W + 2 * T + 0.06, 0.12, 0.1), white, P.whole, 0, H + 0.0, D / 2 + 0.02);
    // the gable: a pitched slate roof over a white pediment with striped bargeboards
    const rw = W / 2 + T + 0.1, slope = Math.hypot(rw, ridge), ang = Math.atan2(ridge, rw);
    for (const s of [-1, 1]) { const r = mesh(new THREE.BoxGeometry(slope, 0.05, D + T + 0.22), slate, P.whole, s * rw / 2, H + 0.06 + ridge / 2, -T / 2 + 0.03); r.rotation.z = -s * ang; }
    const tri = new THREE.Shape(); tri.moveTo(-rw + 0.05, 0); tri.lineTo(rw - 0.05, 0); tri.lineTo(0, ridge - 0.04); tri.closePath();
    mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.04, bevelEnabled: false }), white, P.whole, 0, H + 0.06, D / 2 + 0.03);
    const bstripe = stripeTex([slope / 0.4, 1]);
    for (const s of [-1, 1]) { const b = mesh(new THREE.BoxGeometry(slope + 0.04, 0.09, 0.03), mat("#ffffff", { map: bstripe, roughness: 0.6 }), P.whole, s * rw / 2, H + 0.06 + ridge / 2 - 0.03, D / 2 + 0.1); b.rotation.z = -s * ang; }
    mesh(new THREE.SphereGeometry(0.045, 12, 8), mat("#c9a23a", { roughness: 0.35, metalness: 0.6 }), P.whole, 0, H + 0.06 + ridge + 0.02, D / 2 + 0.05);
    return { grip: 0 };
  },

  railings(P) {
    const S = P.spec, x0 = S.x0 ?? -3, x1 = S.x1 ?? 3, H = S.h ?? 1.9, step = S.step ?? 0.13, gaps = S.gaps || [];
    const iron = mat("#17181c", { roughness: 0.4, metalness: 0.3 }), gilt = mat("#d8ab3a", { roughness: 0.3, metalness: 0.75 }), stone = mat("#cfc9bd", { roughness: 0.85 });
    const free = (x) => !gaps.some(([a, b]) => x > a - 0.02 && x < b + 0.02);
    const bars = [], tips = [], rails = [], kerbs = [];
    for (let x = x0; x <= x1 + 1e-6; x += step) {
      if (!free(x)) continue;
      const b = new THREE.CylinderGeometry(0.011, 0.011, H - 0.22, 6); b.translate(x, 0.22 + (H - 0.22) / 2, 0); bars.push(b);
      const t = new THREE.ConeGeometry(0.026, 0.11, 6); t.translate(x, H + 0.055, 0); tips.push(t);
      const c = new THREE.SphereGeometry(0.02, 8, 6); c.translate(x, H - 0.005, 0); tips.push(c);
    }
    // rails and the kerb, cut where the gaps are
    const spans = []; let a = x0;
    for (const [g0, g1] of [...gaps].sort((p, q) => p[0] - q[0])) { if (g0 > a) spans.push([a, g0]); a = Math.max(a, g1); }
    if (x1 > a) spans.push([a, x1]);
    for (const [s0, s1] of spans) {
      for (const y of [0.32, H - 0.18]) { const r = new THREE.BoxGeometry(s1 - s0, 0.03, 0.025); r.translate((s0 + s1) / 2, y, 0); rails.push(r); }
      const k = new THREE.BoxGeometry(s1 - s0 + 0.04, 0.22, 0.3); k.translate((s0 + s1) / 2, 0.11, 0); kerbs.push(k);
    }
    if (bars.length) mesh(mergeGeometries([...bars, ...rails]), iron, P.whole);
    if (tips.length) mesh(mergeGeometries(tips), gilt, P.whole);
    if (kerbs.length) mesh(mergeGeometries(kerbs), stone, P.whole);
    return { grip: 0 };
  },

  stoneblock(P) {
    const S = P.spec, W = S.w ?? 0.7, H = S.h ?? 2.6, D = S.d ?? 0.7, cap = S.cap ?? 0;
    const face = (u, v) => mat("#ffffff", { map: ashlarTex([u, v], S.seed ?? 1), roughness: 0.8 });
    // six faces, each texture repeated to the face's size in metres so the courses line up and stay 0.3 m high
    const mats = [face(D, H), face(D, H), face(W, D), face(W, D), face(W, H), face(W, H)];
    const b = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), mats); b.position.y = H / 2; b.castShadow = b.receiveShadow = true; P.whole.add(b);
    if (cap) {
      const capM = mat("#ddd7cb", { roughness: 0.75 });
      mesh(new THREE.BoxGeometry(W + 2 * cap, 0.14, D + 2 * cap), capM, P.whole, 0, H + 0.07, 0);
      mesh(new THREE.BoxGeometry(W + cap, 0.1, D + cap), capM, P.whole, 0, H + 0.19, 0);
      mesh(new THREE.BoxGeometry(W + 2 * cap, 0.16, D + 2 * cap), mat("#bdb6a8", { roughness: 0.85 }), P.whole, 0, 0.08, 0);   // a plinth course at the foot
    }
    return { grip: 0 };
  },

  pigeon(P) {
    const grey = mat("#8e939e", { roughness: 0.6 }), head = mat("#6e7280", { roughness: 0.55 }), sheen = mat("#5f7f72", { roughness: 0.3, metalness: 0.25, emissive: new THREE.Color("#2a2240"), emissiveIntensity: 0.4 });
    const wingM = mat("#a3a8b2", { roughness: 0.6 }), barM = mat("#2b2c33", { roughness: 0.6 }), feetM = mat("#d9737e", { roughness: 0.6 }), beakM = mat("#3b3a40", { roughness: 0.5 });
    const bird = new THREE.Group(); P.whole.add(bird);
    const body = mesh(new THREE.SphereGeometry(0.07, 20, 14), grey, bird, 0, 0.07, 0); body.scale.set(0.95, 0.95, 1.35);
    const neck = new THREE.Group(); neck.position.set(0, 0.11, 0.05); bird.add(neck);
    const nk = mesh(new THREE.SphereGeometry(0.045, 16, 12), sheen, neck, 0, 0.0, 0.0); nk.scale.set(1, 1.1, 1);
    const hd = new THREE.Group(); hd.position.set(0, 0.045, 0.02); neck.add(hd);
    mesh(new THREE.SphereGeometry(0.035, 16, 12), head, hd, 0, 0, 0);
    const beak = mesh(new THREE.ConeGeometry(0.009, 0.03, 8), beakM, hd, 0, -0.004, 0.044); beak.rotation.x = Math.PI / 2;
    mesh(new THREE.SphereGeometry(0.008, 8, 6), mat("#e8e4dc"), hd, 0, 0.004, 0.034);   // the cere
    for (const s of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 10, 8), new THREE.MeshBasicMaterial({ color: "#e8812a" })); e.position.set(s * 0.027, 0.01, 0.018); hd.add(e);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 8, 6), new THREE.MeshBasicMaterial({ color: "#121212" })); p.position.set(s * 0.032, 0.011, 0.021); hd.add(p);
    }
    const wingShape = new THREE.Shape(); wingShape.moveTo(0, 0.03); wingShape.quadraticCurveTo(0.12, 0.07, 0.22, 0.03); wingShape.lineTo(0.25, -0.01);
    for (let i = 0; i < 4; i++) { const x = 0.25 - i * 0.06; wingShape.lineTo(x - 0.02, -0.055); wingShape.lineTo(x - 0.045, -0.02); }
    wingShape.lineTo(0, -0.04); wingShape.closePath();
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.008, bevelEnabled: false }); wingGeo.rotateX(-Math.PI / 2);
    const wings = [-1, 1].map((s) => {
      const pivot = new THREE.Group(); pivot.position.set(s * 0.05, 0.1, 0.01); bird.add(pivot);
      const w = new THREE.Mesh(wingGeo, wingM); w.castShadow = true; w.scale.x = s; pivot.add(w);
      for (const k of [0.09, 0.14]) { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.0095, 0.05), barM); bar.position.set(s * k, 0.001, 0.0); pivot.add(bar); }
      return { pivot, s };
    });
    const tail = mesh(new THREE.ConeGeometry(0.04, 0.11, 4), barM, bird, 0, 0.06, -0.12); tail.rotation.x = -Math.PI / 2 - 0.3; tail.scale.set(1.6, 1, 0.3);
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.04, 4), feetM, bird, s * 0.02, 0.0, 0.01);
    return {
      grip: 0.02,
      apply(ps, t) {
        const fl = clamp(ps.flap ?? 0), pk = clamp(ps.peck ?? 0), bob = clamp(ps.happy ?? 0), tt = t ?? 0, beat = Math.sin(tt * 26);
        for (const { pivot, s } of wings) { const fold = 1 - fl; pivot.rotation.set(0, s * fold * 1.35, s * (fl * (0.15 + 0.8 * beat) - fold * 1.2)); }
        bird.rotation.x = 0.35 * fl + 0.5 * pk * (1 - fl);
        // a pigeon's head jerks forward and holds while the body catches up (the bob), and turns to look about
        const ph = (tt * 2.2) % 1, jerk = ph < 0.18 ? ph / 0.18 : 1 - (ph - 0.18) / 0.82;
        hd.position.z = 0.02 + bob * 0.02 * jerk; hd.rotation.y = bob * 0.5 * Math.sin(tt * 1.3);
        neck.rotation.x = 0.7 * pk;
        bird.position.y = fl * 0.012 * beat;
      },
    };
  },

  fireball(P) {
    const S = P.spec, R = S.r ?? 0.07;
    const tex = canvasTex(128, 128, (g, w, h) => {
      // cel bands: red rim, orange, yellow, a white core, with three flame licks rising off the top
      const bands = [["#d8361e", 1], ["#ff7a1c", 0.82], ["#ffc93c", 0.6], ["#fff6d8", 0.32]];
      for (const [c, k] of bands) {
        g.fillStyle = c; g.beginPath(); const r = 40 * k, cx = 64, cy = 74;
        g.moveTo(cx - r, cy);
        g.bezierCurveTo(cx - r, cy - r * 1.2, cx - r * 0.3, cy - r * 1.3, cx - r * 0.35, cy - r * 2.0);
        g.quadraticCurveTo(cx - r * 0.05, cy - r * 1.3, cx + r * 0.1, cy - r * 2.3);
        g.quadraticCurveTo(cx + r * 0.35, cy - r * 1.35, cx + r * 0.6, cy - r * 1.8);
        g.bezierCurveTo(cx + r * 0.7, cy - r * 1.1, cx + r, cy - r * 0.8, cx + r, cy);
        g.arc(cx, cy, r, 0, Math.PI); g.closePath(); g.fill();
      }
    });
    const m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }); m.userData.noOutline = true;
    const sp = steamy(new THREE.Sprite(m), 6); P.whole.add(sp);
    const halo = new THREE.SpriteMaterial({ map: canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, "rgba(255,170,60,0.55)"); gr.addColorStop(1, "rgba(255,120,30,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), transparent: true, depthWrite: false, toneMapped: false });
    halo.userData.noOutline = true;
    const hs = steamy(new THREE.Sprite(halo), 5); P.whole.add(hs);
    const seed = S.seed ?? 0;
    return {
      grip: 0,
      apply(ps, t) {
        const on = clamp(ps.on ?? 1), tt = t ?? 0, fl = 1 + 0.08 * Math.sin(tt * 31 + seed * 5) + 0.05 * Math.sin(tt * 17 + seed);
        sp.visible = hs.visible = on > 0.02;
        sp.scale.set(R * 2.4 * on, R * 2.4 * on * fl * 1.15, 1); sp.position.y = R * 0.35 * on;
        hs.scale.set(R * 5 * on, R * 5 * on, 1); halo.opacity = 0.8 * on;
      },
    };
  },

  tear(P) {
    const S = P.spec, L = S.length ?? (S.stream ? 0.16 : 0.07), water = new THREE.MeshBasicMaterial({ color: "#7fd2ff", transparent: true, opacity: 0.95, depthWrite: false });
    water.userData.noOutline = true;
    const g = new THREE.Group(); P.whole.add(g);
    // the drop: a round bead with a pointed top, a white glint
    const drop = new THREE.Shape(); drop.moveTo(0, 0.026); drop.quadraticCurveTo(0.017, 0.006, 0.017, -0.006); drop.absarc(0, -0.006, 0.017, 0, Math.PI, true); drop.quadraticCurveTo(-0.017, 0.006, 0, 0.026);
    const d = steamy(new THREE.Mesh(new THREE.ShapeGeometry(drop, 16), water), 8); g.add(d);
    const gl = steamy(new THREE.Mesh(new THREE.CircleGeometry(0.0055, 10), new THREE.MeshBasicMaterial({ color: "#ffffff", depthWrite: false, transparent: true })), 9); gl.position.set(-0.006, -0.002, 0.001); g.add(gl);
    gl.material.userData.noOutline = true;
    // the wet trail up to the eye: a thin tapered strip (a stream is wider and wavy)
    const trailM = new THREE.MeshBasicMaterial({ color: "#a8e2ff", transparent: true, opacity: 0.85, depthWrite: false }); trailM.userData.noOutline = true;
    const trail = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 1, 8), trailM), 7); g.add(trail);
    return {
      grip: 0,
      apply(ps, t) {
        const on = clamp(ps.on ?? 0), tr = clamp(ps.fill ?? 1), tt = t ?? 0;
        g.visible = on > 0.02; g.scale.setScalar(Math.max(0.001, on));
        const w = S.stream ? 0.022 : 0.008, len = L * tr;
        trail.scale.set(w, Math.max(0.001, len), 1); trail.position.set(S.stream ? 0.003 * Math.sin(tt * 20) : 0, 0.018 + len / 2, -0.0005);
        d.scale.set(1, S.stream ? 1 + 0.15 * Math.sin(tt * 25) : 1, 1);
      },
    };
  },

  tongue(P) {
    const m = mat("#e8606e", { roughness: 0.45 }); m.userData.noHatch = true;
    const g = new THREE.Group(); P.whole.add(g);
    const tg = mesh(new THREE.SphereGeometry(0.05, 18, 12), m, g, 0, -0.04, 0.0); tg.scale.set(0.95, 1.25, 0.42); steamy(tg, 4);
    const groove = mesh(new THREE.BoxGeometry(0.004, 0.06, 0.004), mat("#b8404e"), g, 0, -0.035, 0.022); steamy(groove, 5);
    return { grip: 0, apply(ps, t) { const o = clamp(ps.on ?? 0); g.visible = o > 0.02; g.scale.set(1, Math.max(0.01, o), 1); g.rotation.z = 0.12 * Math.sin((t ?? 0) * 14) * o; } };
  },

  wetpuddle(P) {
    const S = P.spec, rx = S.rx ?? 0.45, rz = S.rz ?? 0.3;
    const tex = canvasTex(256, 256, (g, w, h) => {
      const gr = g.createRadialGradient(128, 128, 30, 128, 128, 128); gr.addColorStop(0, "rgba(118,130,146,0.8)"); gr.addColorStop(0.7, "rgba(92,102,116,0.72)"); gr.addColorStop(1, "rgba(80,88,100,0)");   // dark water on wet stone, lighter than the stone only in its sky streak
      g.fillStyle = gr; g.beginPath(); for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2, r = 118 * (0.86 + 0.14 * Math.sin(a * 3 + 1) * Math.sin(a * 5)); i ? g.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r) : g.moveTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } g.fill();
      g.strokeStyle = "rgba(226,234,242,0.6)"; g.lineWidth = 4; g.beginPath(); g.ellipse(100, 108, 50, 14, -0.2, 0, Math.PI * 0.9); g.stroke();
    });
    const wm = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }); wm.userData.noOutline = true;
    const pool = steamy(new THREE.Mesh(new THREE.PlaneGeometry(rx * 2, rz * 2), wm), 2); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.004; P.whole.add(pool);
    const ringM = new THREE.MeshBasicMaterial({ color: "#eef3f7", transparent: true, depthWrite: false }); ringM.userData.noOutline = true;
    const rings = [0, 1, 2].map(() => { const r = steamy(new THREE.Mesh(new THREE.RingGeometry(0.94, 1, 40), ringM.clone()), 3); r.rotation.x = -Math.PI / 2; r.position.y = 0.006; P.whole.add(r); return r; });
    const dropM = new THREE.MeshBasicMaterial({ color: "#dde8f0", transparent: true, opacity: 0.9, depthWrite: false }); dropM.userData.noOutline = true;
    const drops = Array.from({ length: 22 }, (_, i) => { const o = steamy(new THREE.Mesh(new THREE.SphereGeometry(0.014 + 0.01 * rnd(i), 8, 6), dropM), 6); P.whole.add(o); return { o, a: (i / 22) * Math.PI * 2 + rnd(i + 3) * 0.4, v: 0.6 + 0.6 * rnd(i + 9), up: 0.45 + 0.5 * rnd(i + 21) }; });
    return {
      grip: 0,
      apply(ps) {
        const sp = clamp(ps.splash ?? 0), rp = clamp(ps.ring ?? 0);
        for (const d of drops) {
          d.o.visible = sp > 0.01 && sp < 0.99;
          const r = (0.12 + d.v * 0.55 * sp), y = 0.02 + d.up * 4 * sp * (1 - sp) * 0.55;
          d.o.position.set(Math.cos(d.a) * r * (rx / 0.45), y, Math.sin(d.a) * r * (rz / 0.3));
        }
        rings.forEach((r, i) => { const k = clamp(rp * 1.3 - i * 0.15); r.visible = k > 0.01 && k < 0.99; const s = 0.1 + 0.9 * k; r.scale.set(rx * s, rz * s, 1); r.material.opacity = 0.7 * (1 - k); });
      },
    };
  },
};
