import * as THREE from "three";

// Props for "That one friend with too much energy", episode 3: camping at 6 am (Jonny's eight panels, 5 Nov 2026), in
// their own file so parallel clips never edit the same one (props3d.js merges CAMP_KINDS, CAMP_GRIPS and CAMP_PARTS on
// their own line). The lake, the hills and the sky are painted plates (assets/plates/camp-dawn.png, camp-sunrise.png).
//   ridgetent  a khaki ridge (A-frame) tent, origin the middle of its footprint, its door end facing +z. spec.w (2.3),
//              d (1.9), h (1.45). Two upright poles at the ends, the roof cloth over the ridge, a closed back wall and a
//              door of two flaps on a zip up the middle of the front: open 0..1 is the zip (0: the slider at the
//              bottom, the door shut; 1: the slider at the top and both flaps tied back). Below the slider the flaps
//              part, more the lower they are, as a real door hangs open under its zip. fall 0..1 collapses it: the
//              poles tip out over their feet, the ridge comes down and the cloth lies in folds on the grass.
//              A lantern hangs inside from the front of the ridge (spec.lantern false: none); lit 0..1 its glow. As the
//              tent falls the lantern comes down onto the grass in front of the door (LANTERN_DOWN).
//              The arm part "zip" is the zip slider (the hand on it, through props3d partPoint).
//   sleepbag   a quilted mummy sleeping bag (spec.color) for a sitter who rides it ({ do: "ride", prop, sit: true }):
//              origin = where its sitter sits on the ground. A puffy shell round the body, up to the chin, open on the
//              face, and the leg tube along the grass to its tied foot end at +z (spec.len 0.95). cover 0..1 pulls the
//              hood up: at 0.6 only the eyes and nose show, at 1 it is closed over the head. spec.recline (degrees,
//              18) leans the shell back with its sitter. Grip "foot": the tied foot end, where it is dragged from.
//   tentcord   a thin cord from the origin (tied round the Wizard's bag: it rides it with { do: "carry", by }) to the
//              lantern: spec.a0 [x, y, z] the lantern while the tent stands, spec.a1 where it lies after the fall
//              (world), fall 0..1 as the tent's. It sags while slack (spec.len longer than the gap), taut when not.
//   campclock  a little travel alarm clock with a red LED face (origin its bottom middle, facing +z): time below 0.5
//              reads spec.text0 ("05:59"), from 0.5 spec.text1 ("06:00"); lit 0..1 flashes the face (the beep).
// Cloth, bags, the clock and the lantern's metal are solid; the lantern's glow is light.
const clamp = (x) => Math.min(1, Math.max(0, x ?? 0));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const noise = (a, b) => Math.sin(a * 12.9898 + b * 78.233) * 0.5 + Math.sin(a * 4.1 - b * 3.3) * 0.5;   // smooth enough for folds
const light = (o) => { o.traverse((c) => { c.userData.glow = true; c.castShadow = false; }); return o; };

export const TENT_DIM = { w: 3.4, d: 2.1, h: 2.3 };   // bigger than a real two-man tent: the Wizard's hat clears the roof
// the lantern under the front of the ridge (tent frame), and where it lies on the grass after the fall
export const LANTERN_UP = (S = TENT_DIM) => [0, S.h - 0.36, S.d / 2 - 0.55];
export const LANTERN_DOWN = (S = TENT_DIM) => [0.95, 0.09, S.d / 2 + 0.15];
export const BAG_LEN = 0.95;

// the tent's shape for its state: ridge height, how far the poles tip, the eaves
// The poles are jointed (shock-corded) and buckle at their middle joint as the cord pulls the ridge: the ridge comes
// down almost straight, leaning a little toward the pull (+z), and the cloth spreads out flat round it.
function tentShape(S, ps) {
  const f = smooth(ps.fall), hR = S.h * (1 - f) + 0.04 * f;
  const th = Math.acos(Math.min(1, hR / S.h)), lean = 0.3 * f;    // th: each pole half's angle from upright
  const L = Math.hypot(S.w / 2, S.h), xe = Math.sqrt(Math.max(0, L * L - hR * hR));   // the roof cloth keeps its width
  return { f, hR, th, lean, xe, zr: S.d / 2 + hR * lean };
}
// a point of an end wall at height fraction v (side 1 the door end at +z, -1 the back): squashed down with the ridge,
// leaning with the pull
const wallY = (S, T, v) => v * T.hR;
const wallZ = (S, T, v, side) => side * (S.d / 2 + 0.01) + v * T.hR * T.lean;
// a point of the door flap (side -1 left, 1 right; u 0 at the seam .. 1 at the door's edge; v 0 ground .. 1 apex)
function flapAt(S, ps, side, u, v) {
  const T = tentShape(S, ps), open = clamp(ps.open), ys = 0.06 + 0.86 * open;   // the slider's height (of the door)
  // below the slider the seam parts: wider lower down, and wide open once the slider is near the top (tied back)
  const part = v < ys ? Math.pow(Math.min(1, ((ys - v) / ys) * 2.2), 0.6) * Math.min(1, 0.2 + open * 1.4) : 0;   // tied back like curtains below the slider
  const tie = smooth((open - 0.82) / 0.18);                       // the last bit of the zip ties both flaps back
  const k = Math.min(1, part + tie * (1 - part) * (1 - v) ** 0.3);
  const hw = (S.w / 2) * (1 - v);                                 // the door triangle's half width at that height
  const x = side * hw * lerp(lerp(0, 1, k), 1, u);                // between the parted inner edge and the door's edge
  const sag = 0.05 * k * (1 - u) * Math.sin(Math.PI * v);         // a parted flap hangs a little out
  // the front wall comes down with the ridge as the tent falls
  return [x * (T.xe / (S.w / 2) * 0.35 + 0.65), wallY(S, T, v) + T.f * 0.03 * noise(u * 5 + side, v * 7), wallZ(S, T, v, 1) + sag];
}
export const CAMP_PARTS = {
  ridgetent: (ps, part, p, dir) => {
    if (dir) return p;
    const S = TENT_DIM, T = tentShape(S, ps), v = 0.06 + 0.86 * clamp(ps.open);
    const o = [0, wallY(S, T, v), wallZ(S, T, v, 1) + 0.04];
    return [o[0] + p[0], o[1] + p[1], o[2] + p[2]];
  },
};
export const CAMP_GRIPS = {
  sleepbag: { foot: [0, 0.13, BAG_LEN + 0.15] },   // the tied end: a fist round the drawcord's knot
};

function canvasCloth(base, seams, h = 512) {
  const [c, g] = canvas(512, h); g.fillStyle = base; g.fillRect(0, 0, 512, h);
  for (let i = 0; i < 140; i++) { const r1 = Math.abs(noise(i, 1)), r2 = Math.abs(noise(i, 2)); g.fillStyle = `rgba(${i % 2 ? "70,55,30" : "255,245,220"},0.05)`; g.beginPath(); g.ellipse(r1 * 512, r2 * h, 20 + r1 * 50, 6 + r2 * 14, i, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = "rgba(80,62,38,0.5)"; g.lineWidth = 3;
  for (const s of seams) { g.beginPath(); g.moveTo(s * 512, 0); g.lineTo(s * 512, h); g.stroke(); }
  return tex(c);
}

function gridGeo(nu, nv) {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array((nu + 1) * (nv + 1) * 3), uv = new Float32Array((nu + 1) * (nv + 1) * 2), idx = [];
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const k = i * (nv + 1) + j; uv[k * 2] = i / nu; uv[k * 2 + 1] = j / nv; }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + nv + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
  return geo;
}
function fill(geo, nu, nv, f) {
  const pos = geo.attributes.position.array;
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const k = (i * (nv + 1) + j) * 3, p = f(i / nu, j / nv); pos[k] = p[0]; pos[k + 1] = p[1]; pos[k + 2] = p[2]; }
  geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingBox(); geo.computeBoundingSphere();
}

export const CAMP_KINDS = {
  ridgetent(P) {
    const S = { ...TENT_DIM, ...P.spec }, KHAKI = S.color ?? "#b7a27a";
    const cloth = mat("#ffffff", { map: canvasCloth(KHAKI, [0.25, 0.5, 0.75]), side: THREE.DoubleSide, roughness: 0.9 });
    const dark = mat("#8d7a58", { map: canvasCloth("#9c8862", [0.5]), side: THREE.DoubleSide, roughness: 0.95 });
    const inner = mat("#5b4a33", { side: THREE.BackSide, roughness: 1 });
    const NU = 10, NZ = 14, NF = 8;
    const roof = [-1, 1].map(() => { const g = gridGeo(NU, NZ), m = mesh(g, cloth, P.whole); m.frustumCulled = false; return { g, m }; });
    const roofIn = [-1, 1].map((s, n) => { const m = mesh(roof[n].g, inner, P.whole); m.castShadow = false; m.frustumCulled = false; return m; });
    const back = gridGeo(NF, NF), backM = mesh(back, dark, P.whole); backM.frustumCulled = false;
    const flaps = [-1, 1].map(() => { const g = gridGeo(NF, NF), m = mesh(g, cloth, P.whole); m.frustumCulled = false; return { g, m }; });
    // the floor (a dark groundsheet just inside) and the two poles, the zip line and its slider
    const sheet = mesh(new THREE.BoxGeometry(S.w - 0.1, 0.012, S.d - 0.05), mat("#4b4f3a", { roughness: 1 }), P.whole, 0, 0.006, 0); sheet.receiveShadow = true;
    const poleM = mat("#6c6f74", { roughness: 0.35, metalness: 0.6 });
    const poles = [-1, 1].map(() => {
      const g = new THREE.Group(), lo = new THREE.Group(), hi = new THREE.Group(); P.whole.add(g); g.add(lo); g.add(hi);
      mesh(new THREE.CylinderGeometry(0.016, 0.016, S.h / 2, 8), poleM, lo, 0, S.h / 4, 0); mesh(new THREE.CylinderGeometry(0.016, 0.016, S.h / 2, 8), poleM, hi, 0, S.h / 4, 0);
      mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.05, 8), poleM, hi, 0, 0, 0);   // the joint's ferrule
      Object.assign(g.userData, { lo, hi }); return g;
    });
    const zipM = mat("#3b352a", { roughness: 0.6 });
    const zipLine = mesh(new THREE.BufferGeometry(), zipM, P.whole); zipLine.frustumCulled = false; zipLine.castShadow = false;
    const slider = new THREE.Group(); P.whole.add(slider);
    mesh(new THREE.BoxGeometry(0.035, 0.05, 0.02), mat("#c9ccd2", { roughness: 0.3, metalness: 0.8 }), slider, 0, 0, 0.012);
    mesh(new THREE.BoxGeometry(0.018, 0.05, 0.006), mat("#2b2b30", { roughness: 0.5 }), slider, 0, -0.045, 0.024);
    const rollM = mat(KHAKI, { roughness: 0.9 });
    const rolls = [-1, 1].map(() => { const m = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.75, 10), rollM, P.whole); return m; });
    // guy ropes from the pole tops to pegs on the grass (the pegs are tentpeg props at spec.pegs; the ropes end there)
    const ropeM = mat("#d8c79c", { roughness: 0.9 });
    const ropes = [0, 1].map(() => { const m = mesh(new THREE.BufferGeometry(), ropeM, P.whole); m.frustumCulled = false; m.castShadow = false; return m; });
    // the lantern: a green cap, a glass with a warm flame, a wire handle on a hook under the ridge
    const lan = new THREE.Group(); if (S.lantern !== false) P.whole.add(lan);
    const capM = mat("#2f5a3c", { roughness: 0.45, metalness: 0.4 });
    mesh(new THREE.CylinderGeometry(0.035, 0.07, 0.05, 12), capM, lan, 0, 0.11, 0);
    mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.025, 12), capM, lan, 0, -0.07, 0);
    const glassM = mat("#ffe2a0", { roughness: 0.15, transparent: true, opacity: 0.55, emissive: new THREE.Color("#ffb347"), emissiveIntensity: 0.4 }); glassM.userData.glass = true;
    mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.13, 14), glassM, lan, 0, 0.02, 0);
    const flame = mesh(new THREE.SphereGeometry(0.022, 10, 8), new THREE.MeshBasicMaterial({ color: "#ffd27a", toneMapped: false }), lan, 0, 0.015, 0); flame.scale.set(1, 1.6, 1); light(flame);
    const hdl = mesh(new THREE.TorusGeometry(0.05, 0.004, 6, 16, Math.PI), poleM, lan, 0, 0.13, 0);
    const [gc, gg] = canvas(128, 128), gr = gg.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,190,90,0.9)"); gr.addColorStop(0.4, "rgba(255,160,60,0.35)"); gr.addColorStop(1, "rgba(255,150,50,0)"); gg.fillStyle = gr; gg.fillRect(0, 0, 128, 128);
    const glowM = new THREE.SpriteMaterial({ map: tex(gc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }); glowM.userData.noOutline = true;
    const glow = new THREE.Sprite(glowM); glow.scale.setScalar(0.9); lan.add(glow); light(glow);
    const lamp = new THREE.PointLight("#ffb860", 0, 3.2, 1.6); lamp.position.set(0, -0.05, 0.05); lan.add(lamp);
    const tube = (m, pts, r) => { m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(4, pts.length * 3), r, 6, false); };
    let last = "";
    return {
      grip: 0,
      apply(ps) {
        const key = [ps.open, ps.fall, ps.lit].join("|"); if (key === last) return; last = key;
        const T = tentShape(S, ps), f = T.f;
        // roof: u 0 at the ridge .. 1 at the eave, v along z; folds grow as it falls
        roof.forEach(({ g }, n) => {
          const sd = n ? 1 : -1;
          fill(g, NU, NZ, (u, v) => {
            const zr = lerp(-T.zr, T.zr, v), ze = lerp(-S.d / 2, S.d / 2, v), z = lerp(zr, ze, u) + f * 0.12 * noise(u * 4 + n, v * 6);
            const y = Math.max(0.015 + 0.02 * f, lerp(T.hR, 0.01, u) + f * (0.05 + 0.07 * Math.abs(noise(u * 6 + n * 3, v * 9))));
            return [sd * lerp(0, T.xe, u) * (1 - 0.18 * f * Math.abs(noise(v * 3, u * 2))), y, z];
          });
        });
        // the back wall: a triangle tipping back with its pole
        fill(back, NF, NF, (u, v) => {
          const x = lerp(-1, 1, u) * (S.w / 2) * (1 - v) * (0.65 + 0.35 * T.xe / (S.w / 2));
          return [x, wallY(S, T, v) + f * 0.02, -S.d / 2 - 0.01 + v * T.hR * T.lean];
        });
        flaps.forEach(({ g }, n) => fill(g, NF, NF, (u, v) => flapAt(S, ps, n ? 1 : -1, u, v)));
        // the poles tip out over their feet; the ropes run from their tops to the pegs
        // each pole buckles at its middle joint: the lower half kicks out to the side, the upper half back in
        poles.forEach((pg, n) => {
          const zb = (n ? -1 : 1) * (S.d / 2 + 0.02), zt = n ? -S.d / 2 - 0.02 + T.hR * T.lean : S.d / 2 + 0.02 + T.hR * T.lean;
          pg.position.set(0, 0, zb); pg.userData.lo.rotation.z = -T.th; pg.userData.hi.position.set(Math.sin(T.th) * S.h / 2, Math.cos(T.th) * S.h / 2, 0); pg.userData.hi.rotation.z = T.th;
          pg.rotation.x = Math.atan2(zt - zb, Math.max(0.05, T.hR));
        });
        const tops = [[0, T.hR, T.zr], [0, T.hR, -S.d / 2 - 0.02 + T.hR * T.lean]];
        (S.ropes || [[0, 0.02, S.d / 2 + 0.75], [0, 0.02, -S.d / 2 - 0.75]]).forEach((e, n) => {
          const a = tops[n], pts = []; const slack = f;
          for (let i = 0; i <= 10; i++) { const k = i / 10; pts.push(new THREE.Vector3(lerp(a[0], e[0], k), Math.max(0.01, lerp(a[1], e[1], k) - slack * 0.1 * Math.sin(Math.PI * k)), lerp(a[2], e[2], k))); }
          tube(ropes[n], pts, 0.005);
        });
        // the zip line up the seam (shut part only) and the slider on it
        const ys = 0.06 + 0.86 * clamp(ps.open), zp = [];
        for (let i = 0; i <= 8; i++) { const v = lerp(ys, 1, i / 8); zp.push(new THREE.Vector3(0, wallY(S, T, v), wallZ(S, T, v, 1) + 0.008)); }
        tube(zipLine, zp, 0.006); zipLine.visible = f < 0.6;
        slider.position.set(0, wallY(S, T, ys), wallZ(S, T, ys, 1) + 0.01); slider.visible = f < 0.6;
        const tie = smooth((clamp(ps.open) - 0.82) / 0.18);
        rolls.forEach((m, n) => { const sd = n ? 1 : -1; m.visible = tie > 0.02 && f < 0.5; m.scale.set(0.4 + 0.6 * tie, 1, 0.4 + 0.6 * tie); m.position.set(sd * (S.w / 2) * 0.62, 0.42, S.d / 2 + 0.04); m.rotation.z = sd * 0.62; });
        // the lantern comes down with the ridge onto the grass in front of the door
        const up = LANTERN_UP(S), dn = LANTERN_DOWN(S), k = smooth((f - 0.15) / 0.85);
        lan.position.set(lerp(up[0], dn[0], k), lerp(up[1], dn[1], k), lerp(up[2], dn[2], k)); lan.rotation.z = -1.35 * k;
        hdl.visible = true;
        const lt = clamp(ps.lit); glassM.emissiveIntensity = 0.3 + 1.4 * lt; flame.visible = lt > 0.02; glowM.opacity = 0.75 * lt; glow.visible = lt > 0.02; lamp.intensity = (S.lamp ?? 2.4) * lt;
      },
    };
  },

  sleepbag(P) {
    const S = P.spec, col = new THREE.Color(S.color ?? "#2c3e78"), len = S.len ?? BAG_LEN, rec = ((S.recline ?? 18) * Math.PI) / 180;
    const css = (k) => `rgb(${[col.r, col.g, col.b].map((v) => Math.round(Math.min(1, v * k) * 255)).join(",")})`;
    // quilting: puffy baffles across the bag, each lighter in the middle
    const [c, g] = canvas(256, 512);
    for (let i = 0; i < 8; i++) { const gr = g.createLinearGradient(0, i * 64, 0, i * 64 + 64); gr.addColorStop(0, css(0.72)); gr.addColorStop(0.5, css(1.12)); gr.addColorStop(1, css(0.72)); g.fillStyle = gr; g.fillRect(0, i * 64, 256, 64); }
    const fab = mat("#ffffff", { map: tex(c), roughness: 0.75, side: THREE.DoubleSide });
    const trim = mat(css(0.6), { roughness: 0.8 });
    // the shell round the body (a body 0.96 tall sitting at the origin): an egg leaning back by rec
    const RX = S.rx ?? 0.36, RY = 0.56, RZ = 0.36, CY = 0.56, NA = 28, NB = 16;
    const shell = gridGeo(NA, NB), shellM = mesh(shell, fab, P.whole); shellM.frustumCulled = false;
    const rimG = new THREE.BufferGeometry(), rimM = mesh(rimG, trim, P.whole); rimM.frustumCulled = false;
    const knot = new THREE.Group(); P.whole.add(knot);
    mesh(new THREE.SphereGeometry(0.03, 10, 8), trim, knot); for (const s of [-1, 1]) { const st = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 6), trim, knot, s * 0.02, -0.06, 0.005); st.rotation.z = s * 0.25; }
    // the leg tube along the grass to the tied foot end
    const pts = [new THREE.Vector3(0, 0.24, 0.05), new THREE.Vector3(0, 0.17, 0.35), new THREE.Vector3(0, 0.14, 0.65), new THREE.Vector3(0, 0.13, len - 0.08)];
    const legs = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 1, 16, false);
    const lp = legs.attributes.position, la = new THREE.Vector3();
    for (let i = 0; i < lp.count; i++) {   // taper from 0.3 at the hips to 0.17 at the feet, flatter underneath
      la.fromBufferAttribute(lp, i); const t = Math.min(1, Math.max(0, la.z / (len - 0.08))), r = 0.27 - 0.14 * t, base = new THREE.Vector3(0, lerp(0.24, 0.13, t), la.z);
      const d = la.clone().sub(base).multiplyScalar(r); d.y *= 0.8; la.copy(base).add(d); if (la.y < 0.01) la.y = 0.01 + (la.y - 0.01) * 0.1; lp.setXYZ(i, la.x, la.y, la.z);
    }
    legs.computeVertexNormals(); mesh(legs, fab, P.whole);
    const cap = mesh(new THREE.SphereGeometry(0.13, 14, 10), fab, P.whole, 0, 0.13, len - 0.08); cap.scale.set(1, 0.8, 0.9);
    const tie = mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 14), trim, P.whole, 0, 0.13, len + 0.04); tie.rotation.x = Math.PI / 2;
    mesh(new THREE.ConeGeometry(0.06, 0.08, 10), fab, P.whole, 0, 0.13, len + 0.08).rotation.x = Math.PI / 2;
    let last = "";
    return {
      grip: 0,
      apply(ps) {
        const cv = clamp(ps.cover), key = String(cv); if (key === last) return; last = key;
        // the rim's height (in the egg's frame, -1 bottom .. 1 top) round the body: under the chin at the front, up the
        // back of the head behind; the hood pulls it up the face, and closes it over the head at 1
        const front = lerp(-0.05, 1.1, cv), backH = lerp(0.75, 1.1, cv);
        const rimAt = (ang) => lerp(front, backH, (1 - Math.cos(ang)) / 2);   // ang 0 = straight ahead (+z)
        const at = (ang, yl) => { const r = Math.sqrt(Math.max(0, 1 - yl * yl)); let x = Math.sin(ang) * r * RX, y = yl * RY, z = Math.cos(ang) * r * RZ;
          [y, z] = [y * Math.cos(rec) + z * Math.sin(rec), -y * Math.sin(rec) + z * Math.cos(rec)]; return [x * 1.04, CY + y, z]; };
        fill(shell, NA, NB, (u, v) => { const ang = u * Math.PI * 2, top = Math.min(1, rimAt(ang)); return at(ang, lerp(-1, top, v)); });
        const rp = []; for (let i = 0; i <= 40; i++) { const ang = (i / 40) * Math.PI * 2, top = Math.min(0.995, rimAt(ang)), p = at(ang, top); rp.push(new THREE.Vector3(p[0], p[1], p[2])); }
        rimM.geometry.dispose(); rimM.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp, true), 80, 0.035, 8, true); rimM.visible = cv < 0.98;
        const kp = at(0, Math.min(0.99, rimAt(0))); knot.position.set(kp[0], kp[1] - 0.01, kp[2] + 0.03); knot.visible = cv < 0.98;
      },
    };
  },

  tentcord(P) {
    const S = P.spec, m = mesh(new THREE.BufferGeometry(), mat("#e2d3a8", { roughness: 0.9 }), P.whole); m.frustumCulled = false; m.castShadow = false;
    const knot = mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 12), mat("#e2d3a8", { roughness: 0.9 }), P.whole); knot.rotation.x = Math.PI / 2;
    let last = "";
    return {
      grip: 0,
      apply(ps) {
        const key = [ps.x, ps.y, ps.z, ps.fall].map((v) => (v ?? 0).toFixed(4)).join("|"); if (key === last) return; last = key;
        const k = smooth((clamp(ps.fall) - 0.15) / 0.85), a0 = S.a0, a1 = S.a1 || S.a0;
        const A = [lerp(a0[0], a1[0], k) - ps.x, lerp(a0[1], a1[1], k) - ps.y, lerp(a0[2], a1[2], k) - ps.z];
        const dist = Math.hypot(...A), slack = Math.max(0, (S.len ?? dist) - dist), sag = Math.min(0.35, slack * 0.6);
        const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push(new THREE.Vector3(A[0] * t, Math.max(-ps.y + 0.01, A[1] * t - sag * Math.sin(Math.PI * t)), A[2] * t)); }
        m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.006, 6, false);
      },
    };
  },

  // a light in the scene (the sun as it clears the hills): a point light spec.color, spec.power, spec.dist; glow 0..1
  camplight(P) {
    const S = P.spec, l = new THREE.PointLight(S.color ?? "#ffc46b", 0, S.dist ?? 30, S.decay ?? 0.6); P.whole.add(l);
    return { grip: 0, apply(ps) { l.intensity = (S.power ?? 3) * clamp(ps.glow); } };
  },

  campclock(P) {
    const S = P.spec, w = 0.2, h = 0.11, d = 0.07;
    const body = mat("#e9e4da", { roughness: 0.5 });
    mesh(new THREE.BoxGeometry(w, h, d), body, P.whole, 0, h / 2 + 0.012, 0);
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.03, 0.012, 0.05), mat("#7d7a74", { roughness: 0.6 }), P.whole, s * 0.07, 0.006, 0);
    mesh(new THREE.BoxGeometry(0.05, 0.014, 0.03), mat("#d9534f", { roughness: 0.4 }), P.whole, 0.05, h + 0.02, 0);   // the snooze button
    const [c, g] = canvas(256, 120), t = tex(c);
    const face = new THREE.MeshBasicMaterial({ map: t, toneMapped: false }); face.userData.noOutline = true;
    mesh(new THREE.PlaneGeometry(w * 0.84, h * 0.7), face, P.whole, 0, h / 2 + 0.012, d / 2 + 0.002).castShadow = false;
    let last = "";
    return {
      grip: h + 0.012,
      apply(ps) {
        const txt = (ps.time ?? 0) < 0.5 ? S.text0 ?? "05:59" : S.text1 ?? "06:00", lt = clamp(ps.lit), key = txt + "|" + lt.toFixed(2);
        if (key === last) return; last = key;
        g.fillStyle = `rgb(${Math.round(16 + 60 * lt)},${Math.round(10 + 20 * lt)},${Math.round(12 + 14 * lt)})`; g.fillRect(0, 0, 256, 120);
        g.fillStyle = lt > 0.5 ? "#ff8a7a" : "#ff3b2e"; g.font = "bold 92px monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, 128, 64);
        t.needsUpdate = true;
      },
    };
  },
};
