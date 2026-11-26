import * as THREE from "three";
import { clamp } from "./util.js";
import { PACKAGE_KINDS } from "./props-package.js";

// Set pieces for Potato Desk 14 "Don't. Laugh." (storyboards/series/potato-desk/14-dont-laugh/DESIGN.md sections 0, 2, 3c, 4).
// Axes: x right, y up, z toward the camera, metres; sizes and hex colours are the DESIGN's. Every frame is a pure function of the
// keys (no random, no clock): any frame renders alone. Registry line (props3d.js): import { DESK14_SET_KINDS } from "./props-desk14-set.js";
// Object.assign(KINDS, DESK14_SET_KINDS);
//
//   jurybox        the jury box, wood of the judge's bench. Origin: the floor under its centre, front +z. Outer 2.15 (x) x 0.82 (z) x
//                  0.58 high, walls 0.06 (front, two sides) and 0.04 (back) "#58463b"; cap rail on the front and sides 0.12 x 0.05
//                  "#745b49", TOP y 0.63 (flush with the outer face, it overhangs inward); 4 front panels 0.44 x 0.38 at x -0.78, -0.26,
//                  0.26, 0.78 and one 0.56 x 0.38 panel on each side, centre y 0.30, "#624e41" with 0.012 x 0.003 bevels "#46382f";
//                  skirt 0.06 x 0.02 "#46382f". Three solid steps inside (z -0.35..+0.35, "#4c4037"), x from the origin: A -0.975..
//                  -0.275 top 0.26, C -0.275..0.335 top 0.38, R 0.335..1.015 top 0.16. spec.steps [[x0, x1, top], ...] replaces them.
//                  No keys. Solid; held at 0.63 (the rail top, for grips.rest / tap). Jurors stand on the steps (cast y = the step top).
//                  Design spot: (1.30, 0, -0.85); the juror feet: agent x 0.675, chip 1.34, rosti 1.965, z -0.87.
//   exhibitboard   the sentence board's case, blank, with a photo bay. Origin: the board's CENTRE, faces +z; case 1.30 x 0.84 x 0.09
//                  "#24323f", face "#202c38", four 0.023 brass bars, four screw discs, no lettering. The bay is 0.60 x 0.75 centred
//                  (its front stands 0.0635 off the origin, the case front is 0.045), a split-flap: a 0.60 x 0.375 leaf hinged on the
//                  bay's middle line. Key flip 0..1 (propState default 0, spec.flip is ignored: tween it from the start, 0.20 s):
//                  0 blank bay with its hinge line and two brass pins, between = the leaf turning toward the camera and down, 1 = the
//                  print: a school photo 0.54 x 0.675 turned 2.5 deg clockwise, paper "#f7f4ea" with a 0.018 border (0.027 at the foot),
//                  picture 0.504 x 0.630. spec.src (default "assets/props/desk14/school-photo.png", a repo path, 864 x 1080 fits
//                  exactly; a missing file fails the render with its name). Lit face (emissive 0.12). Not held.
//   courtdoorway   the door in the back wall. Origin: the floor at the FRONT of the back wall, centred on the opening (design
//                  (3.25, 0, -1.30)). Opening 0.90 x 1.75; recess plane 0.032 in front of the wall (clear of the rail and baseboard),
//                  gradient "#2b2420" -> "#3a302a", no outline, not solid; jambs 0.08 x 1.83 x 0.07 and head 1.06 x 0.08 x 0.07
//                  "#58463b"; threshold 0.015 "#46382f". No hole in the wall. It carries the leaf too (the engine's `frontdoor`, hinge
//                  left at x -0.45, swings out toward +z): key open 0..1 (propState default spec.open ?? 0; spec.angle 100 deg at 1;
//                  spec.color "#5c4033"). spec.leaf false = no leaf (place your own frontdoor). Leaf hinge in world: x origin - 0.45.
//   deskmic        a desk microphone. Origin: the bottom centre of the base, on the desk (design (-0.42, 1.18, 0.20)). Base 0.09 across
//                  x 0.015 "#3a3d42", stem 0.012 across x 0.15 long leaning 18 deg toward -z "#6f757c", head 0.036 x 0.055 "#2b2d33"
//                  with a 0.02 band "#8a9096"; 0.20 high. No keys. Not held.
//   snotbubble     Mash's snot bubble. Origin: the sphere CENTRE at puff 1 (r 0.055), so the DESIGN's (-0.05, 0.75, 0.246 + 0.8 r) is
//                  z 0.290 with wear "mash". When smaller the sphere slides toward the nostril (its centre stays 0.8 r off the skin
//                  at the nostril's z 0.246): never detaches. Keys: puff 0..1 (propState default spec.puff ?? 0): r = 0.055 x puff^0.6,
//                  hidden at 0; "#dff3ea" at 0.42, a fresnel rim "#9fc7b5" at 0.55, a white glint 0.3 r upper left, no outline. The
//                  radius breathes +-4 % at 3 Hz while it shows (the clip tweens the 1 -> 0.55 -> 1 pulse). pop 0..1 (default
//                  spec.pop ?? 0; tween 0.07 s): the sphere is gone from pop > 0.05 and 6 drops r 0.008 fly 0.07 m off the skin of the
//                  bubble and shrink to 0 at pop 1. See-through (userData.steam), not solid. Not held.

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const box = (w, h, d, m, parent, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z);
function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
// a lit (slightly emissive) face, like officesign's plate
const lit = (tex, k = 0.12, o = {}) => { const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: new THREE.Color("#ffffff"), emissiveMap: tex, emissiveIntensity: k, ...o }); m.userData.noHatch = true; return m; };
const litColor = (c, k = 0.12) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, emissive: new THREE.Color(c), emissiveIntensity: k }); m.userData.noHatch = true; return m; };
function plane(w, h, m, parent, x, y, z) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.castShadow = false; o.receiveShadow = true; parent.add(o); return o; }
// a face panel with a raised bevel frame (width bw, proud bd) on its +z side (props-court.js bevelPanel)
function bevelPanel(parent, w, h, d, face, edge, bw, bd, x, y, z) {
  const m = mat(face), e = mat(edge), zf = z + d / 2 + bd / 2;
  box(w, h, d, m, parent, x, y, z);
  box(w, bw, bd, e, parent, x, y + h / 2 - bw / 2, zf); box(w, bw, bd, e, parent, x, y - h / 2 + bw / 2, zf);
  box(bw, h - 2 * bw, bd, e, parent, x - w / 2 + bw / 2, y, zf); box(bw, h - 2 * bw, bd, e, parent, x + w / 2 - bw / 2, y, zf);
}
const memo = new Map(), once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
const queueLoad = (p) => (globalThis.__loads ||= []).push(p);

// ---- the jury box
const BOX = { w: 2.15, d: 0.82, h: 0.58, wall: 0.06, back: 0.04, rail: 0.63 };
const STEPS = [[-0.975, -0.275, 0.26], [-0.275, 0.335, 0.38], [0.335, 1.015, 0.16]];

// ---- the exhibit board's numbers (bay 0.60 x 0.75, canvas 1600 px per metre = 960 x 1200 per state)
const PPM = 1600, BAYW = 0.60, BAYH = 0.75, HALF = 0.375, BAYZ = { back: 0.065, hinge: 0.075 };
const SRC = "assets/props/desk14/school-photo.png";
const picImg = (src) => once("d14:" + src, () => {
  const job = new THREE.ImageLoader().loadAsync(`/${src.replace(/^\/+/, "")}`).catch(() => { throw new Error(`props-desk14-set: ${src} is missing (exhibitboard spec.src)`); });
  queueLoad(job); return job;
});
// the atlas: slot 0 the blank bay, slot 1 the print (drawn when the picture has loaded); each slot 960 x 1200
function boardAtlas(src) {
  const W = BAYW * PPM, H = BAYH * PPM;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H * 2;
  const g = cv.getContext("2d"); g.fillStyle = "#202c38"; g.fillRect(0, 0, W, H * 2);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  picImg(src).then((img) => {
    const k = PPM, cx = W / 2, cy = H + H / 2, pw = 0.54 * k, ph = 0.675 * k, b = 0.018 * k, bb = 0.027 * k, sh = 0.006 * k;
    g.save(); g.translate(cx, cy); g.rotate((2.5 * Math.PI) / 180);   // canvas y runs down: positive = clockwise on screen
    g.fillStyle = "rgba(20,28,36,0.5)"; g.fillRect(-pw / 2 + sh, -ph / 2 + sh, pw, ph);
    g.fillStyle = "#f7f4ea"; g.fillRect(-pw / 2, -ph / 2, pw, ph);
    g.drawImage(img, -pw / 2 + b, -ph / 2 + b, pw - 2 * b, ph - b - bb);
    g.restore(); tex.needsUpdate = true;
  });
  return tex;
}
const setHalf = (geo, slot, upper, slots) => {
  const uv = geo.attributes.uv, pos = geo.attributes.position, top = 1 - slot / slots, bot = 1 - (slot + 1) / slots, mid = (top + bot) / 2, lo = upper ? mid : bot, hi = upper ? top : mid;
  for (let i = 0; i < uv.count; i++) uv.setY(i, pos.getY(i) > 0 ? hi : lo);
  uv.needsUpdate = true;
};

// ---- the snot bubble's rim: a fresnel shell (alpha grows toward the silhouette)
const rimMat = () => {
  const m = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color("#9fc7b5") }, uAlpha: { value: 0.55 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uAlpha; varying vec3 vN; varying vec3 vV; void main() { float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2); gl_FragColor = vec4(uColor, uAlpha * clamp(f * 1.35, 0.0, 1.0)); }`,
    transparent: true, depthWrite: false,
  });
  m.userData.noOutline = true; return m;
};
const R_MAX = 0.055, NOSE = 0.8;
const DROPS = Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2 + 0.35, e = i % 2 ? 0.45 : 0.15; return new THREE.Vector3(Math.cos(a) * Math.cos(e), Math.sin(a) * Math.cos(e), Math.sin(e) + 0.25).normalize(); });

export const DESK14_SET_KINDS = {
  jurybox(P) {
    const S = P.spec, W = BOX.w, D = BOX.d, hw = W / 2, hd = D / 2, T = BOX.wall, wood = mat("#58463b"), cap = mat("#745b49"), dark = "#46382f";
    // walls: front, two sides, a thin back
    box(W, BOX.h, T, wood, P.whole, 0, BOX.h / 2, hd - T / 2);
    for (const s of [-1, 1]) box(T, BOX.h, D, wood, P.whole, s * (hw - T / 2), BOX.h / 2, 0);
    box(W - 2 * T, BOX.h, BOX.back, wood, P.whole, 0, BOX.h / 2, -hd + BOX.back / 2);
    // cap rail on the front and the sides (top 0.63), flush with the outer faces
    const ry = BOX.rail - 0.025;
    box(W, 0.05, 0.12, cap, P.whole, 0, ry, hd - 0.06);
    for (const s of [-1, 1]) box(0.12, 0.05, D - 0.12, cap, P.whole, s * (hw - 0.06), ry, -0.06);
    // panels: 4 on the front, one on each side
    for (const x of [-0.78, -0.26, 0.26, 0.78]) bevelPanel(P.whole, 0.44, 0.38, 0.012, "#624e41", dark, 0.012, 0.003, x, 0.30, hd + 0.006);
    for (const s of [-1, 1]) { const g = new THREE.Group(); g.position.set(s * hw, 0, 0); g.rotation.y = s * Math.PI / 2; P.whole.add(g); bevelPanel(g, 0.56, 0.38, 0.012, "#624e41", dark, 0.012, 0.003, 0, 0.30, 0.006); }
    // skirt 0.06 high x 0.02 proud round the foot of the front and sides
    const sk = mat(dark);
    box(W + 0.04, 0.06, 0.02, sk, P.whole, 0, 0.03, hd + 0.01);
    for (const s of [-1, 1]) box(0.02, 0.06, D, sk, P.whole, s * (hw + 0.01), 0.03, 0);
    // steps inside
    const stepM = mat("#4c4037");
    for (const [x0, x1, top] of S.steps ?? STEPS) box(x1 - x0, top, 0.70, stepM, P.whole, (x0 + x1) / 2, top / 2, 0);
    return { grip: BOX.rail };
  },

  exhibitboard(P) {
    const S = P.spec, brass = mat("#b08a3c", { roughness: 0.45, metalness: 0.2 });
    box(1.30, 0.84, 0.09, mat("#24323f", { roughness: 0.6 }), P.whole, 0, 0, 0);
    plane(1.298, 0.838, litColor("#202c38"), P.whole, 0, 0, 0.0455);
    for (const s of [-1, 1]) { box(1.30, 0.023, 0.006, brass, P.whole, 0, s * (0.42 - 0.0115), 0.048); box(0.023, 0.794, 0.006, brass, P.whole, s * (0.65 - 0.0115), 0, 0.048); }
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.005, 18), brass, P.whole, sx * 0.615, sy * 0.385, 0.0475).rotation.x = Math.PI / 2;
    // the bay: a dark housing, two backing halves with the seam between them, the leaf on its hinge
    box(BAYW, BAYH, 0.019, mat("#18222c", { roughness: 0.6 }), P.whole, 0, 0, 0.054);
    const atlas = boardAtlas(S.src || SRC), bayM = lit(atlas, 0.12), HH = 0.373, hy = 0.1865;
    const mk = () => new THREE.PlaneGeometry(BAYW, HH), gUp = mk(), gLo = mk(), gFront = mk(), gBack = mk();
    for (const [g, y] of [[gUp, hy], [gLo, -hy]]) { const o = new THREE.Mesh(g, bayM); o.position.set(0, y, BAYZ.back); o.receiveShadow = true; P.whole.add(o); }
    const leaf = new THREE.Group(); leaf.position.set(0, 0, BAYZ.hinge); P.whole.add(leaf);
    mesh(new THREE.BoxGeometry(BAYW, HH, 0.004), mat("#1a2430", { roughness: 0.6 }), leaf, 0, hy, 0);
    const front = new THREE.Mesh(gFront, bayM); front.position.set(0, hy, 0.0031); leaf.add(front);
    const back = new THREE.Mesh(gBack, bayM); back.position.set(0, hy, -0.0031); back.rotation.x = Math.PI; leaf.add(back);
    // the hinge line (state 0 only, 0.004 "#18222c") and the two brass pins at its ends (always)
    const line = box(BAYW, 0.004, 0.002, mat("#18222c"), P.whole, 0, 0, BAYZ.hinge + 0.0015); line.castShadow = false;
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.02, 14), brass, P.whole, s * (BAYW / 2 - 0.004), 0, BAYZ.hinge).rotation.z = Math.PI / 2;
    let seen = "";
    return {
      grip: 0,
      apply(ps) {
        const f = clamp(ps.flip ?? 0), flat = f >= 0.9999, moving = f > 1e-4 && !flat, i = flat ? 1 : 0, key = `${i}/${moving || flat ? 1 : 0}`;
        if (key !== seen) {   // front + lower backing show state i; the upper backing and the leaf's reverse show the next while it swings
          seen = key; const j = moving || flat ? 1 : 0;
          setHalf(gFront, i, true, 2); setHalf(gLo, i, false, 2); setHalf(gUp, j, true, 2); setHalf(gBack, j, false, 2);
        }
        leaf.rotation.x = flat ? 0 : f * Math.PI; line.visible = f < 0.0001;
      },
    };
  },

  courtdoorway(P) {
    const S = P.spec, W = 0.90, H = 1.75, wood = mat("#58463b", { roughness: 0.6 });
    const grad = canvasTex(8, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#2b2420"); gr.addColorStop(1, "#3a302a"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const rm = new THREE.MeshBasicMaterial({ map: grad }); rm.userData.noOutline = true; rm.userData.noHatch = true;
    const rec = plane(W, H, rm, P.whole, 0, H / 2, 0.032); rec.userData.solid = false;
    for (const s of [-1, 1]) box(0.08, 1.83, 0.07, wood, P.whole, s * (W / 2 + 0.04), 0.915, 0.035);
    box(1.06, 0.08, 0.07, wood, P.whole, 0, H + 0.04, 0.035);
    box(W, 0.015, 0.07, mat("#46382f"), P.whole, 0, 0.0075, 0.035);
    let door = null;
    if (S.leaf !== false) {   // the engine's frontdoor leaf: hinge left at the opening's left edge, outside face +z, swinging out
      const g = new THREE.Group(); g.position.set(-W / 2, 0, 0.05); P.whole.add(g);
      door = PACKAGE_KINDS.frontdoor({ whole: g, spec: { w: W - 0.004, h: H - 0.004, color: S.color ?? "#5c4033", hinge: "left", swing: "out", angle: S.angle ?? 100 } });
    }
    return { grip: 0, apply(ps, t) { if (door?.apply) door.apply({ open: ps.open ?? S.open ?? 0, latch: 1 }, t); } };
  },

  deskmic(P) {
    mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.015, 32), mat("#3a3d42", { roughness: 0.45, metalness: 0.4 }), P.whole, 0, 0.0075, 0);
    const lean = new THREE.Group(); lean.position.set(0, 0.008, 0); lean.rotation.x = -(18 * Math.PI) / 180; P.whole.add(lean);   // -x rotation tips +y toward -z
    mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.15, 12), mat("#6f757c", { roughness: 0.35, metalness: 0.6 }), lean, 0, 0.075, 0);
    const head = mesh(new THREE.CapsuleGeometry(0.018, 0.019, 6, 16), mat("#2b2d33", { roughness: 0.55 }), lean, 0, 0.15 + 0.0275, 0);
    mesh(new THREE.CylinderGeometry(0.0195, 0.0195, 0.02, 20), mat("#8a9096", { roughness: 0.35, metalness: 0.6 }), lean, 0, 0.15 + 0.0275, 0);
    head.scale.set(1, 1, 1);
    return { grip: 0.2 };
  },

  snotbubble(P) {
    const g = new THREE.Group(); P.whole.add(g);
    const bm = new THREE.MeshStandardMaterial({ color: "#dff3ea", roughness: 0.25, transparent: true, opacity: 0.42, depthWrite: false });
    bm.userData.noOutline = true; bm.userData.noHatch = true;
    const mk = (m, order) => { const o = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), m); o.castShadow = o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; o.renderOrder = order; g.add(o); return o; };
    const body = mk(bm, 4), rim = mk(rimMat(), 5);
    const gm = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.9, depthWrite: false }); gm.userData.noOutline = true;
    const glint = new THREE.Mesh(new THREE.CircleGeometry(0.15, 16), gm); glint.userData.steam = true; glint.userData.solid = false; glint.castShadow = false; glint.renderOrder = 6; g.add(glint);
    const gdir = new THREE.Vector3(-0.45, 0.5, 0.74).normalize(); glint.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), gdir);
    const dm = new THREE.MeshBasicMaterial({ color: "#dff3ea", transparent: true, opacity: 0.85, depthWrite: false }); dm.userData.noOutline = true;
    const drops = DROPS.map(() => { const o = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), dm); o.userData.steam = true; o.userData.solid = false; o.castShadow = false; o.renderOrder = 6; g.add(o); return o; });
    return {
      grip: 0,
      apply(ps, t) {
        const puff = clamp(ps.puff ?? P.spec.puff ?? 0), pop = clamp(ps.pop ?? P.spec.pop ?? 0), r0 = R_MAX * Math.pow(puff, 0.6);
        const r = r0 * (1 + 0.04 * Math.sin(2 * Math.PI * 3 * (t ?? 0)) * (pop > 0.05 ? 0 : 1)), cz = -NOSE * (R_MAX - r0);   // the nostril stays put
        const alive = puff > 0.001 && pop <= 0.05;
        body.visible = rim.visible = glint.visible = alive;
        if (alive) {
          body.scale.setScalar(r); rim.scale.setScalar(r * 1.015); body.position.set(0, 0, cz); rim.position.copy(body.position);
          glint.scale.setScalar(r); glint.position.set(gdir.x * r * 1.012, gdir.y * r * 1.012, cz + gdir.z * r * 1.012);
        }
        drops.forEach((o, i) => {
          const dr = pop > 0.02 && pop < 1 && puff > 0.001 ? 0.008 * (1 - pop) : 0;
          o.visible = dr > 0; if (!dr) return;
          const d = DROPS[i], dist = r0 + 0.07 * pop;
          o.scale.setScalar(dr); o.position.set(d.x * dist, d.y * dist, cz + d.z * dist);
        });
      },
    };
  },
};
