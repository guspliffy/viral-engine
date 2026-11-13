import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp, rng } from "./util.js";
import { taperedTube } from "./geo.js";

// Survive it "How to survive a zombie apocalypse" v3 (12 Nov 2026), task T6: the gun fight in the street. World metres, x
// right, y up, z toward the camera; `rot` degrees about y (rot 0 faces +z). Hand-drawn look: painted canvases, every mark drawn
// once from an index and `spec.seed`, nothing tiled. Everything is a pure function of the spec, its state and the clip time t.
// State keys are read ps.<key> ?? spec.<key> ?? default and all of them tween with a "prop" action (ZFIGHT_STATE below).
// NO blood, no wounds: a zombie that is hit jolts back and falls flat on its back, that is all.
//
// ===== zrevolver  the Gunslinger's revolver (the look of costumes-cast.js pistol(), scale 1.35, plus a hammer, trigger guard,
//   front sight, ejector rod and six chambers). Solid for the checks (a held thing, like zphone); the flash and the smoke are not.
//   ORIGIN: the centre of the wooden handle. The barrel points +z at rot 0, the handle slopes down and back (-z), the hammer is
//   on top. Barrel tip (muzzle) at (0, 0.0945, 0.324); the drum is at z -0.0 .. 0.12 about; length tip to butt about 0.43.
//   spec  scale 1 (about the origin; the gun is already built at the pistol's 1.35)
//   state flash 0..1 (0)  a muzzle flash at the tip: a hot-white core 0.09 m, a five-point yellow-orange star 0.28 m (its
//                         size follows the state), two crossed flame cards 0.22 m long along the barrel, a soft warm glow 0.7 m,
//                         all flat painted cards, no outline, not solid. The director pulses 0 -> 1 -> 0 over 2-3 frames a shot.
//         smoke 0..1 (0)  a thin grey wisp rising from the muzzle along the prop's +y: eight soft puffs that each climb 0.7 m,
//                         grow from 0.06 to 0.24 m and fade, looping every 3.6 s on t (any frame gives the same picture).
//   GRIPS hand [0, 0, 0]: the fist closes on the handle: `grab { grip: "hand" }` puts it in the glove, barrel forward.
//         muzzle [0, 0.0945, 0.324]: the tip, for aiming and for where the flash and the smoke are (not a grip to hold by).
//
// ===== zshot  n (3) single zombies of the zhorde look at full detail (grey-green wrinkled skin, many pale sprouts, milky blank
//   eyes with sad brows, a dark open mouth, thin dark limbs with clawed hands, boots, a torn shirt in a dull grey or brown,
//   a torn sleeve each), standing on a flat ground, all facing +z (toward the shooter), spaced along x by `gap` around the origin.
//   ORIGIN: the middle of the ground between them, y 0 = the feet. Each is 0.95 m (+-8 % hashed) tall. Outlines on the body, the
//   shirt, limbs; the face and the sprouts are flat painted. Bodies are solid for the checks; sprouts and the face are not.
//   spec  n 3 (1..6; only the first three can fall), gap 1.1, seed 1 (height, sprout layout, yaw, shirt colour, stride length;
//         dull greys and browns), stop [] (per zombie, the `adv` at which it is hit: a hit one's advance is capped there, so a
//         fallen one stays where it fell while `adv` keeps growing for the others; e.g. [0.9, 1.4, 1.8]; none = no cap)
//   state adv 0      metres each has lurched forward along +z (0 = standing at home; the stagger is +-0.2 m hashed). The walk is
//                    driven by adv (one stride per 0.4-0.5 m, so no foot slides, and the cycle stops when adv stops): stiff arms
//                    out forward (one higher), a limp (one leg swings half as far), a forward lurch each step, head lolling and
//                    an idle sway on t. The legs are together at adv = 0, 0.45, 0.9 ... (a stop there is a neutral stance).
//         d1 d2 d3 0..1 (0)  zombie 1, 2, 3 (left to right) is hit and drops: 0 -> 0.15 a jolt back (body snaps back 15 degrees,
//                    head snaps, arms fly up, 0.1 m slide back), 0.15 -> 0.85 it topples backward (rotation about its feet, slowly
//                    then faster) and ends flat on its back, face up, feet toward +z, arms slack at its sides, 0.85 -> 1 a small
//                    settle (a hop of 2 cm). 1 = lying 0.76 m wide, flat on the ground. A fallen one stays down at 1.
//
// ===== zstreetdoor  our building's street entrance: a shallow porch IN FRONT of the facade (the facade plane stays solid).
//   ORIGIN: on the ground at the middle of the porch's back wall; +z (local) = out into the street. Stand it at
//   { x: -4.88, y: -15, z: <the facade z>, rot: 90 } (rot 90 faces +x, into the street; zstreet's facade plane is x -4.9).
//   Door at z 0: the facade has no window there. In WORLD axes at rot 90: local +z = +x (out), local +x = -z, local -x = +z.
//   Size: stone frame 1.7 wide (x +-0.85) x 2.5 high x 0.7 deep (z 0..0.7), a drip cap above it (1.86 x 0.07 x 0.78), a step 1.1
//   wide x 0.32 deep in front (z 0.7..1.02, top y 0.21), a house number plate "27" and a doorbell plate on the front jambs.
//   FLOORS: the pavement of zstreet is 0.15 above the street floor, and hides anything at y -15, so the porch floor (chequered
//   tiles) is flush with the pavement: local y 0.155 = world y -14.845. A character standing on the pavement stands in the porch.
//   OPENING: 1.0 wide (x +-0.5 between the stone jambs), 2.15 high (y 0.155..2.30), the door leaf 1.0 x 2.15 x 0.05, heavy dark
//   green wood with a small glass panel, brass lever handle, three brass hinges, a brass kick plate. Hinged on its -z side in world
//   at rot 90 (local x +0.5, z 0.65); it swings INWARD (toward -z local = toward the facade).
//   BEHIND IT (the porch's back wall, painted and lit warm): the first four steps of a stair going up to the right, a bank of
//   eight mailboxes and a notice board on the left, a dado, a dim yellow ceiling lamp (a glass dome and a soft glow).
//   state open 0..1 (0)  0 shut, 1 swung 90 degrees, parallel to the right jamb (clear opening the full 1.0). The leaf is 1.0 long
//                        but the porch is only 0.65 deep behind the door's hinge: at open > about 0.65 the leaf's end goes into the
//                        facade and is hidden by it (reads as a door swung into the stairwell); from the side (a camera along z)
//                        you see that end vanish into the wall.
//         shake 0..1 (0) fists on the shut door: it trembles in its frame (0.9 degrees, two frequencies, 6.5 and 4 Hz); only
//                        meaningful at open 0 (it fades out as the door opens).
//   Every mesh is userData.solid = false: the cast stands in and on it (the leaf too: a hand on it is a contact, not a collision).
export const ZFIGHT_GRIPS = {
  zrevolver: { hand: [0, 0, 0], muzzle: [0, 0.0945, 0.324] },
};
export const ZFIGHT_STATE = {
  zrevolver: { flash: 0, smoke: 0 },
  zshot: { adv: 0, d1: 0, d2: 0, d3: 0 },
  zstreetdoor: { open: 0, shake: 0 },
};

// ---------------------------------------------------------------------------------------------------- helpers
const rad = (d) => (d * Math.PI) / 180;
const sm = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const V3 = THREE.Vector3, Qt = THREE.Quaternion, Eu = THREE.Euler, M4 = THREE.Matrix4;

function tex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const stdM = (o = {}) => new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...o });
const basicM = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, ...o }); m.userData.noOutline = true; return m; };
// a mesh of a set piece: nobody collides with it
function put(parent, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = false; m.receiveShadow = false; m.userData.solid = false; parent.add(m); return m;
}
// a flat painted card or glow: not solid, no outline, never part of a body-in-body test
const glow = (o, order = 5) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; if (o.material) o.material.userData.noOutline = true; return o; };
const BX = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const CY = (r0, r1, h, n = 8) => new THREE.CylinderGeometry(r0, r1, h, n);
const PL = (w, h) => new THREE.PlaneGeometry(w, h);

function bake() {
  const list = [], Mx = new M4(), Qx = new Qt(), Ex = new Eu();
  return {
    add(geo, { p = [0, 0, 0], r = [0, 0, 0], q = null, s = [1, 1, 1], c = "#888888", uv = null } = {}) {
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
      if (uv) { const a = g.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, uv[0] + (uv[2] - uv[0]) * a.getX(i), uv[1] + (uv[3] - uv[1]) * a.getY(i)); }
      Mx.compose(new V3(...p), q || Qx.setFromEuler(Ex.set(r[0], r[1], r[2])), new V3(...s)); g.applyMatrix4(Mx);
      const col = new THREE.Color(c), n = g.attributes.position.count, a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { a[i * 3] = col.r; a[i * 3 + 1] = col.g; a[i * 3 + 2] = col.b; }
      g.setAttribute("color", new THREE.BufferAttribute(a, 3)); list.push(g); return this;
    },
    geo() { return list.length ? mergeGeometries(list) : null; },
  };
}

// painterly strokes: n rotated flat rectangles, colours from cols, alpha range, length/thickness ranges
function strokes(g, R, W, H, n, cols, lenR, thR, aR, angR = [0, Math.PI]) {
  for (let i = 0; i < n; i++) {
    g.save(); g.globalAlpha = aR[0] + R() * (aR[1] - aR[0]); g.fillStyle = cols[(R() * cols.length) | 0];
    g.translate(R() * W, R() * H); g.rotate(angR[0] + R() * (angR[1] - angR[0]));
    g.fillRect(-lenR[0] / 2 - R() * lenR[1] / 2, 0, lenR[0] + R() * lenR[1], thR[0] + R() * (thR[1] - thR[0])); g.restore();
  }
  g.globalAlpha = 1;
}
function crack(g, R, x, y, len, col, w = 1.6) {
  g.strokeStyle = col; g.lineWidth = w; g.lineCap = "round"; g.beginPath(); g.moveTo(x, y);
  let a = Math.PI / 2 + (R() - 0.5) * 1.2;
  for (let i = 0; i < len; i++) { a += (R() - 0.5) * 0.9; x += Math.cos(a) * (4 + R() * 7); y += Math.sin(a) * (4 + R() * 7); g.lineTo(x, y); }
  g.stroke();
}
let DOT = null;
const dotTex = () => (DOT ||= tex(64, 64, (g) => {
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.25, "rgba(255,255,255,0.85)"); r.addColorStop(0.55, "rgba(255,255,255,0.25)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
}));

// =============================================================================================================== revolver
// the pistol() of costumes-cast.js (copied, not imported: it is not exported): parts in its own frame, scaled 1.35 as there
const GUN_K = 1.35, GUN_HANDLE = new V3(0, -0.02, -0.04).multiplyScalar(GUN_K);
const MUZZLE = new V3(0, 0.05, 0.2).multiplyScalar(GUN_K).sub(GUN_HANDLE);

function starTex() {
  return tex(256, 256, (g) => {
    const R = rng(31), cx = 128, cy = 128, np = 5, pts = [];
    for (let i = 0; i < np * 2; i++) { const a = -Math.PI / 2 + (i / (np * 2)) * 6.2832, r = i % 2 ? 44 + R() * 8 : 104 + R() * 22; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    const star = (k, c0, c1, c2) => {
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 126 * k); gr.addColorStop(0, c0); gr.addColorStop(0.35, c1); gr.addColorStop(1, c2);
      g.fillStyle = gr; g.beginPath(); pts.forEach(([x, y], i) => { const px = cx + (x - cx) * k, py = cy + (y - cy) * k; if (i) g.lineTo(px, py); else g.moveTo(px, py); }); g.closePath(); g.fill();
    };
    star(1, "#fff3a8", "#ffbe2e", "#ff7a14"); g.strokeStyle = "#e0560c"; g.lineWidth = 3; g.lineJoin = "round"; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.stroke();
    star(0.55, "#ffffff", "#fff6c0", "#ffe27a");
  });
}
function flameTex() {   // a tapered flame, wide at the left (the muzzle) to a point at the right
  return tex(256, 96, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.3, "#ffe27a"); gr.addColorStop(0.75, "#ff9a1a"); gr.addColorStop(1, "#ff6a10");
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, H * 0.2); g.quadraticCurveTo(W * 0.5, H * 0.02, W, H * 0.5); g.quadraticCurveTo(W * 0.5, H * 0.98, 0, H * 0.8); g.closePath(); g.fill();
  });
}
function puffTex() {
  return tex(128, 128, (g) => {
    const R = rng(47); g.clearRect(0, 0, 128, 128);
    for (let i = 0; i < 9; i++) {
      const x = 64 + (R() - 0.5) * 44, y = 64 + (R() - 0.5) * 44, r = 22 + R() * 22, gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, "rgba(235,236,240,0.8)"); gr.addColorStop(0.6, "rgba(215,217,222,0.4)"); gr.addColorStop(1, "rgba(215,217,222,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    }
  });
}

function revolver(P) {
  const S = P.spec, W = P.whole, sc = S.scale ?? 1;
  const metal = stdM({ color: "#3b3e45", metalness: 0.7, roughness: 0.35 }), dark = stdM({ color: "#272a30", metalness: 0.6, roughness: 0.4 }), wood = stdM({ color: "#6a3f22", roughness: 0.6 }), steel = stdM({ color: "#5a5e66", metalness: 0.75, roughness: 0.3 });
  const root = new THREE.Group(); root.scale.setScalar(sc); W.add(root);
  const g = new THREE.Group(); g.scale.setScalar(GUN_K); g.position.copy(GUN_HANDLE).multiplyScalar(-1); root.add(g);
  const mk = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; g.add(m); return m; };
  // exactly the pistol(): barrel, frame, drum, handle
  mk(new THREE.CylinderGeometry(0.016, 0.016, 0.2, 10), metal, 0, 0.05, 0.1, Math.PI / 2);
  mk(new THREE.BoxGeometry(0.045, 0.06, 0.09), metal, 0, 0.04, 0.0);
  mk(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 12), metal, 0, 0.04, 0.02, Math.PI / 2);
  mk(new THREE.BoxGeometry(0.04, 0.1, 0.045), wood, 0, -0.02, -0.04, 0.35);
  // the little extras of a revolver
  mk(new THREE.BoxGeometry(0.012, 0.03, 0.022), dark, 0, 0.082, -0.032, -0.5);                  // hammer
  mk(new THREE.BoxGeometry(0.008, 0.012, 0.012), dark, 0, 0.068, 0.196);                          // front sight
  mk(new THREE.CylinderGeometry(0.0055, 0.0055, 0.14, 6), steel, 0, 0.026, 0.12, Math.PI / 2);     // ejector rod under the barrel
  mk(new THREE.BoxGeometry(0.01, 0.026, 0.01), dark, 0, 0.002, -0.004, -0.3);                     // trigger
  const guard = mk(new THREE.TorusGeometry(0.02, 0.0035, 6, 14, Math.PI), metal, 0, 0.012, 0.014, 0, Math.PI / 2, Math.PI); guard.rotation.set(0, Math.PI / 2, Math.PI);
  mk(new THREE.BoxGeometry(0.046, 0.014, 0.05), metal, 0, -0.075, -0.07, 0.35);                   // butt cap
  mk(new THREE.BoxGeometry(0.044, 0.014, 0.01), dark, 0, 0.0, -0.062, 0.0);                       // frame to handle strap
  for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.2832; mk(new THREE.CircleGeometry(0.0072, 8), dark, Math.cos(a) * 0.018, 0.04 + Math.sin(a) * 0.018, 0.0452); }   // the chambers on the drum's face
  for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.2832 + 0.26; mk(new THREE.BoxGeometry(0.004, 0.012, 0.03), dark, Math.cos(a) * 0.0295, 0.04 + Math.sin(a) * 0.0295, 0.02, 0, 0, a - Math.PI / 2); }   // flutes
  root.traverse((o) => { if (o.isMesh) { o.userData.solid = true; } });

  // --- the flash (flat cards at the muzzle; the prop's scale is applied by `root`, the cards sit in W so keep it in step)
  const FL = new THREE.Group(); FL.position.copy(MUZZLE).multiplyScalar(sc); FL.scale.setScalar(sc); W.add(FL);
  const spr = (map, color, size, o = {}) => {
    const m = new THREE.SpriteMaterial({ map, color, transparent: true, depthWrite: false, fog: false, opacity: 0, ...o }); m.userData.noOutline = true;
    const s = new THREE.Sprite(m); s.scale.setScalar(size); glow(s, 7); s.visible = false; return s;
  };
  const halo = spr(dotTex(), "#ff9a2a", 0.7, { blending: THREE.AdditiveBlending }), star = spr(starTex(), "#ffffff", 0.28), core = spr(dotTex(), "#ffffff", 0.09);
  halo.renderOrder = 6; star.renderOrder = 7; core.renderOrder = 8; star.position.z = 0.02; core.position.z = 0.03;
  FL.add(halo, star, core);
  const fm = new THREE.MeshBasicMaterial({ map: flameTex(), transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0, fog: false }); fm.userData.noOutline = true;
  const flames = [0, Math.PI / 2].map((rz) => { const f = glow(new THREE.Mesh(PL(0.22, 0.09), fm), 7); f.position.z = 0.11; f.rotation.set(0, Math.PI / 2, 0); const h = new THREE.Group(); h.rotation.z = rz; h.add(f); FL.add(h); f.visible = false; return f; });
  // --- the smoke: eight soft puffs rising from the muzzle (positions in W, along the prop's +y)
  const pm = puffTex(), puffs = [];
  for (let k = 0; k < 8; k++) { const m = new THREE.SpriteMaterial({ map: pm, color: "#9a9ea6", transparent: true, depthWrite: false, fog: false, opacity: 0 }); m.userData.noOutline = true; const s = new THREE.Sprite(m); glow(s, 4); s.visible = false; W.add(s); puffs.push({ s, k, h: hash(k * 3.7 + 1), h2: hash(k * 5.3 + 2) }); }
  return {
    grip: 0,
    apply(ps, t) {
      const f = clamp(ps.flash ?? S.flash ?? 0), sk = clamp(ps.smoke ?? S.smoke ?? 0), tt = t ?? 0, on = f > 0.01;
      for (const o of [halo, star, core]) o.visible = on; for (const o of flames) o.visible = on;
      halo.material.opacity = 0.85 * f; halo.scale.setScalar(0.7 * (0.5 + 0.5 * f)); star.material.opacity = Math.min(1, f * 1.6); star.scale.setScalar(0.28 * (0.45 + 0.55 * f)); star.material.rotation = 0.32 + 0.5 * f;
      core.material.opacity = Math.min(1, f * 2); core.scale.setScalar(0.09 * (0.6 + 0.4 * f)); fm.opacity = 0.9 * f; for (const o of flames) o.scale.set(0.5 + 0.5 * f, 1, 1);
      for (const { s, k: pk, h, h2 } of puffs) {
        const u = (((tt / 3.6 + h * 0.37 + pk / 8) % 1) + 1) % 1, k = sk * Math.pow(Math.sin(Math.PI * u), 0.8) * (0.6 + 0.4 * h2);
        s.visible = k > 0.01; s.material.opacity = 0.7 * k; s.scale.setScalar((0.06 + 0.18 * u) * sc);
        s.position.set((0.045 * Math.sin(6.2832 * (u * 1.1 + h)) + 0.12 * u * (h2 - 0.4)) * sc, MUZZLE.y * sc + (0.03 + 0.7 * u) * sc, MUZZLE.z * sc + (0.02 + 0.08 * u) * sc);
        s.material.rotation = h * 6.28 + u;
      }
    },
  };
}

// =============================================================================================================== zshot
const RX = 0.43, RY = 0.5, RZ = 0.38;   // the zhorde body, size 1 (props-zstreet.js)
const SHIRTS = ["#7a7872", "#6b5a48", "#58524a", "#7d6a52", "#625f5a", "#5c4a3a", "#6f6a5c", "#50463c"];

function skinTex() {
  return tex(1024, 512, (g, W, H) => {
    const Rr = rng(808); g.fillStyle = "#7f8c6c"; g.fillRect(0, 0, W, H);
    const wrap = (fn) => { for (const o of [-W, 0, W]) { g.save(); g.translate(o, 0); fn(); g.restore(); } };
    strokes(g, Rr, W, H, 620, ["#8d9a78", "#6f7d62", "#7b8a68", "#93a07f", "#66745a"], [30, 90], [8, 34], [0.1, 0.28]);
    for (let i = 0; i < 220; i++) { const x = Rr() * W, y = Rr() * H, a = Rr() * 6.28; g.strokeStyle = `rgba(${Rr() < 0.3 ? "52,64,46" : "58,66,50"},${0.35 + Rr() * 0.3})`; g.lineWidth = 2 + Rr() * 2.6; wrap(() => { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * 28, y + Math.sin(a) * 28 + 12, x + Math.cos(a) * 60, y + Math.sin(a) * 60); g.stroke(); }); }
    for (let i = 0; i < 40; i++) { const x = Rr() * W, y = H * (0.15 + 0.7 * Rr()); wrap(() => { g.fillStyle = "rgba(52,56,40,0.7)"; g.beginPath(); g.ellipse(x, y, 8 + Rr() * 8, 6 + Rr() * 6, 0, 0, 6.283); g.fill(); g.fillStyle = "rgba(40,44,32,0.35)"; g.beginPath(); g.ellipse(x, y, 18, 14, 0, 0, 6.283); g.fill(); }); }
    for (let i = 0; i < 20; i++) { const x = Rr() * W, y = Rr() * H; wrap(() => { g.fillStyle = "rgba(96,80,98,0.28)"; g.beginPath(); g.ellipse(x, y, 32 + Rr() * 60, 20 + Rr() * 36, Rr() * 3, 0, 6.283); g.fill(); }); }
    for (let i = 0; i < 14; i++) { const x = Rr() * W, y = Rr() * H; wrap(() => { g.fillStyle = "rgba(122,100,70,0.3)"; g.beginPath(); g.ellipse(x, y, 14 + Rr() * 24, 10 + Rr() * 16, Rr() * 3, 0, 6.283); g.fill(); }); }   // brown bruised patches
  });
}
function clothTex() {   // greyscale-ish woven cloth with patches and dirt; the shirt colour multiplies it
  return tex(512, 256, (g, W, H) => {
    const R = rng(909); g.fillStyle = "#e2dfd8"; g.fillRect(0, 0, W, H);
    strokes(g, R, W, H, 380, ["#f0ede6", "#cfcbc2", "#d9d5cb", "#bdb9b0"], [30, 120], [4, 16], [0.15, 0.4], [-0.08, 0.08]);
    g.strokeStyle = "rgba(90,86,80,0.16)"; g.lineWidth = 1; for (let x = 0; x < W; x += 6) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    for (let i = 0; i < 7; i++) { const x = R() * W, y = R() * H, w = 36 + R() * 60, h = 26 + R() * 50; g.fillStyle = `rgba(${R() < 0.5 ? "140,130,115" : "90,84,76"},0.5)`; g.fillRect(x, y, w, h); g.strokeStyle = "rgba(40,36,32,0.6)"; g.setLineDash([6, 5]); g.lineWidth = 2; g.strokeRect(x + 3, y + 3, w - 6, h - 6); g.setLineDash([]); }   // stitched patches
    for (let i = 0; i < 24; i++) { g.fillStyle = `rgba(60,52,40,${0.12 + R() * 0.2})`; g.beginPath(); g.ellipse(R() * W, R() * H, 10 + R() * 40, 6 + R() * 24, R() * 3, 0, 6.283); g.fill(); }
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0.7, "rgba(50,42,32,0)"); gr.addColorStop(1, "rgba(50,42,32,0.5)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  });
}
// the torn shirt: a ragged shell round the body, high at the back, below the mouth at the front, a fringe of tatters at the hem
function shirtGeo(seed) {
  const R = rng(seed), N = 40, M = 5, pos = [], uv = [], idx = [], K = 1.1;
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * 6.2832, rear = (1 - Math.cos(th)) / 2;
    const top = -1.0 + 1.55 * rear + (R() - 0.5) * 0.14, bot = -1.28 - (i % 3 === 0 ? 0.12 * R() : 0) - (i % 5 === 2 ? 0.2 : 0) + (R() - 0.5) * 0.1;
    for (let j = 0; j <= M; j++) {
      const lat = top + (bot - top) * (j / M), w = 1 + 0.02 * Math.sin(th * 7 + j * 1.3);
      pos.push(RX * Math.sin(th) * Math.cos(lat) * K * w, RY * Math.sin(lat) * K, RZ * Math.cos(th) * Math.cos(lat) * K * w); uv.push(i / N, j / M);
    }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, b = a + M + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

function zshot(P) {
  const S = P.spec, G = P.whole, n = Math.max(1, Math.min(6, Math.floor(S.n ?? 3))), gap = S.gap ?? 1.1, seed = S.seed ?? 1, stop = S.stop ?? [];
  const skin = skinTex(), cloth = clothTex();
  const bodyGeo = new THREE.SphereGeometry(1, 28, 20), bp = bodyGeo.attributes.position;
  for (let i = 0; i < bp.count; i++) { const x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i), k = 1 + 0.045 * Math.sin(x * 4.1 + y * 2.3) * Math.cos(z * 3.7 + 1.1) + 0.03 * Math.sin(y * 6.0 + z * 2.0); bp.setXYZ(i, x * k * RX, y * k * RY, z * k * RZ); }
  bodyGeo.computeVertexNormals();
  const onBody = (th, ph) => { const p = new V3(RX * Math.sin(th) * Math.cos(ph), RY * Math.sin(ph), RZ * Math.cos(th) * Math.cos(ph)), nn = new V3(Math.sin(th) * Math.cos(ph) / RX, Math.sin(ph) / RY, Math.cos(th) * Math.cos(ph) / RZ).normalize(); return [p, nn]; };
  // the face (same decals as zhorde, plus two sad brows)
  const fb = bake(), Zv = new V3(0, 0, 1), decal = (th, ph, rx, ry, rz, col, lift = 0, roll = 0) => { const [p, nn] = onBody(th, ph); const q = new Qt().setFromUnitVectors(Zv, nn).multiply(new Qt().setFromAxisAngle(Zv, roll)); fb.add(new THREE.SphereGeometry(1, 12, 9), { p: p.addScaledVector(nn, lift).toArray(), q, s: [rx, ry, rz], c: col }); };
  for (const s of [-1, 1]) {
    decal(s * 0.44, 0.32, 0.185, 0.2, 0.05, "#4f5b45", -0.018); decal(s * 0.44, 0.32, 0.15, 0.165, 0.055, "#eceed9", -0.005); decal(s * 0.44, 0.32, 0.085, 0.09, 0.057, "#d3d8c2", 0.0);
    decal(s * 0.5, 0.76, 0.13, 0.026, 0.045, "#46543c", -0.01, -s * 0.38);   // a sad brow: the outer end low
  }
  decal(0, -0.45, 0.2, 0.235, 0.05, "#3d4934", -0.02); decal(0, -0.45, 0.14, 0.18, 0.06, "#1a1613", -0.005); decal(0, -0.1, 0.045, 0.06, 0.05, "#5a6a4e", -0.01);
  const faceGeo = fb.geo(), faceMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 }); faceMat.userData.noOutline = true;
  const sproutGeo = (sd) => {
    const Rs = rng(sd), PALE = new THREE.Color("#e9e2c8"), BASE = new THREE.Color("#aeb496"), MAUVE = new THREE.Color("#b794b6"), pts = [];
    const one = (th, ph, L, upk, droop, side) => {
      const [p, nn] = onBody(th, ph), d = nn.clone().multiplyScalar(1 - upk).add(new V3(0, upk, 0)).add(new V3(side * 0.3, 0, 0)).normalize(), lat = new V3((Rs() - 0.5) * 0.35, 0, (Rs() - 0.5) * 0.35);
      const a = p.clone().addScaledVector(nn, -0.03), b = p.clone().addScaledVector(d, L * 0.5).add(lat), c = p.clone().addScaledVector(d, L).add(lat.clone().multiplyScalar(2)).add(new V3(0, -droop, 0));
      const geo = taperedTube(new THREE.CatmullRomCurve3([a, p.clone().addScaledVector(d, L * 0.15), b, c]), 0.017, 0.0035, 6, 5), uvA = geo.attributes.uv, cnt = geo.attributes.position.count, cols = new Float32Array(cnt * 3), mauve = Rs() < 0.4;
      for (let i = 0; i < cnt; i++) { const t = uvA.getX(i), col = t < 0.2 ? BASE.clone().lerp(PALE, t / 0.2) : mauve && t > 0.72 ? PALE.clone().lerp(MAUVE, (t - 0.72) / 0.28) : PALE; cols[i * 3] = col.r; cols[i * 3 + 1] = col.g; cols[i * 3 + 2] = col.b; }
      geo.setAttribute("color", new THREE.BufferAttribute(cols, 3)); pts.push(geo.toNonIndexed());
    };
    for (let k = 0; k < 15; k++) one(Rs() * 6.283, 0.7 + Rs() * 0.55, 0.28 + Rs() * 0.34, 0.45, 0.06 + Rs() * 0.12, 0);
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) one(s * (1.15 + Rs() * 0.3), 0.15 + Rs() * 0.3, 0.2 + Rs() * 0.24, -0.1, 0.12 + Rs() * 0.12, s);
    for (let k = 0; k < 4; k++) one(Math.PI + (Rs() - 0.5) * 1.0, 0.3 + Rs() * 0.5, 0.2 + Rs() * 0.2, 0.2, 0.08 + Rs() * 0.08, 0);
    for (const g of pts) for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "color"].includes(k)) g.deleteAttribute(k);
    return mergeGeometries(pts);
  };
  const sproutMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }); sproutMat.userData.noOutline = true;
  const darkMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
  const legB = bake(); legB.add(CY(0.03, 0.026, 0.12, 8), { p: [0, -0.06, 0], c: "#2d2f2a" }); legB.add(BX(0.1, 0.06, 0.17), { p: [0, -0.15, 0.03], c: "#262522" }); legB.add(BX(0.103, 0.022, 0.1), { p: [0, -0.172, 0.06], c: "#181715" });
  const legGeo = legB.geo();

  const Z = [];
  for (let i = 0; i < n; i++) {
    const h = (k) => hash(seed * 131 + i * 17 + k), s = 0.95 * (1 + (h(1) - 0.5) * 0.16), shirt = new THREE.Color(SHIRTS[(h(5) * SHIRTS.length) | 0]).offsetHSL((h(6) - 0.5) * 0.03, 0, (h(7) - 0.5) * 0.06);
    const root = new THREE.Group(); root.position.set((i - (n - 1) / 2) * gap + (h(2) - 0.5) * 0.2, 0, (h(3) - 0.5) * 0.4); root.rotation.y = (h(4) - 0.5) * 0.3; G.add(root);
    const fall = new THREE.Group(); root.add(fall);
    const lean = new THREE.Group(); lean.position.y = 0.18 * s; fall.add(lean);
    const bodyG = new THREE.Group(); bodyG.position.y = (0.65 - 0.18) * s; bodyG.scale.setScalar(s); lean.add(bodyG);
    const bm = new THREE.MeshStandardMaterial({ map: skin, roughness: 0.92, color: new THREE.Color("#ffffff").lerp(new THREE.Color("#b9c4aa"), h(8) * 0.9) });
    const body = new THREE.Mesh(bodyGeo, bm); bodyG.add(body);
    const face = new THREE.Mesh(faceGeo, faceMat); face.userData.solid = false; bodyG.add(face);
    const sp = new THREE.Mesh(sproutGeo(seed * 977 + i * 31 + 5), sproutMat); sp.userData.solid = false; bodyG.add(sp);
    const sh = new THREE.Mesh(shirtGeo(seed * 313 + i * 7 + 1), new THREE.MeshStandardMaterial({ map: cloth, color: shirt, roughness: 0.95, side: THREE.DoubleSide })); bodyG.add(sh);
    for (const m of [body, face, sp, sh]) { m.castShadow = true; m.receiveShadow = true; }
    // arms: pivot at the shoulder (in the leaning frame), the limb hangs down; a torn sleeve of the shirt colour on the upper arm
    const armB = bake(); armB.add(CY(0.028, 0.022, 0.42, 7), { p: [0, -0.21, 0], c: "#2f322c" }); armB.add(new THREE.SphereGeometry(0.052, 10, 8), { p: [0, -0.45, 0], s: [1, 1.1, 0.8], c: "#7d8a70" });
    armB.add(CY(0.046, 0.05, 0.17, 9), { p: [0, -0.085, 0], c: "#" + shirt.getHexString() });
    for (const f of [-1, 0, 1]) armB.add(CY(0.011, 0.006, 0.075, 5), { p: [f * 0.028, -0.5, 0.008], r: [0.2, 0, f * 0.25], c: "#7d8a70" });   // clawed fingers
    const armGeo = armB.geo(), arms = [-1, 1].map((sg) => { const pv = new THREE.Group(); pv.position.set(sg * 0.4 * s, (0.47 + 0.1) * s, 0.02 * s); lean.add(pv); const m = new THREE.Mesh(armGeo, darkMat); m.scale.setScalar(s); m.castShadow = true; pv.add(m); return pv; });
    const legs = [-1, 1].map((sg) => { const pv = new THREE.Group(); pv.position.set(sg * 0.15 * s, 0.18 * s, 0); fall.add(pv); const m = new THREE.Mesh(legGeo, darkMat); m.scale.setScalar(s); m.castShadow = true; pv.add(m); return pv; });
    Z.push({ i, s, root, fall, lean, bodyG, arms, legs, x: root.position.x, z0: root.position.z, ph: h(9) * 6.283, stride: 0.4 + 0.1 * h(10), side: h(11) < 0.5 ? 1 : -1 });
  }
  // the fall angle (0 standing .. pi/2 flat on its back) and its phases
  const FALL = Math.PI / 2, JOLT = 0.26;
  return {
    grip: 0,
    apply(ps, t) {
      const adv = Math.max(0, ps.adv ?? S.adv ?? 0), tt = t ?? 0;
      for (const z of Z) {
        const d = z.i < 3 ? clamp(ps["d" + (z.i + 1)] ?? S["d" + (z.i + 1)] ?? 0) : 0, a = stop[z.i] != null ? Math.min(adv, stop[z.i]) : adv;
        const j = sm(d / 0.15), u = clamp((d - 0.15) / 0.7), up = Math.pow(u, 1.7), settle = d > 0.85 ? Math.sin(Math.PI * clamp((d - 0.85) / 0.15)) : 0, alive = 1 - j;
        const ang = JOLT * j + (FALL - JOLT) * up, s = z.s, c = Math.cos(ang), sn = Math.sin(ang);
        const phi = (a / z.stride) * Math.PI, wk = Math.sin(phi), wk2 = Math.cos(phi * 2);
        const lift = Math.max(0, s * Math.hypot(RY * c, RZ * sn) - 0.65 * s * c) + 0.004 * Math.min(1, ang * 4) + 0.02 * s * settle;
        z.root.position.z = z.z0 + a - (0.08 * j + 0.22 * up) * 1.0;
        z.fall.rotation.x = -ang; z.fall.position.y = lift;
        // the lurch: forward lean each step, limp roll, idle sway, head loll
        z.lean.rotation.set(alive * (0.1 + 0.05 * (1 - wk2) * Math.min(1, a * 8)), 0, alive * (z.side * 0.05 * wk + 0.035 * Math.sin(tt * 0.9 + z.ph)));
        z.lean.position.y = 0.18 * s + alive * 0.03 * s * Math.abs(wk) * Math.min(1, a * 8);
        z.bodyG.rotation.set(-0.3 * j * (1 - sm(u * 1.4)) + alive * 0.04 * Math.sin(tt * 0.6 + z.ph * 2), 0, alive * (0.1 * Math.sin(tt * 0.7 + z.ph) + 0.07 * Math.sin(tt * 1.7 + z.ph * 3)));
        // arms: stiff out forward (one higher), up when hit, slack at the sides when down
        z.arms.forEach((pv, k) => {
          const sg = k ? 1 : -1, base = (sg === z.side ? -1.5 : -1.22) + 0.1 * wk2 * Math.min(1, a * 8), flop = -0.28 - 0.1 * k;
          const x0 = base + (-2.75 - base) * j, x1 = x0 + (flop - x0) * sm((d - 0.15) / 0.5), xx = d < 0.15 ? x0 : x1;
          pv.rotation.set(xx, 0, sg * (0.09 + 0.28 * sm((d - 0.2) / 0.4) + 0.12 * j));
        });
        z.legs.forEach((pv, k) => { const sg = k ? 1 : -1, amp = sg === z.side ? 0.26 : 0.52; pv.rotation.set(amp * Math.sin(phi + (k ? Math.PI : 0)) * alive * Math.min(1, a * 8) * (1 - up), 0, sg * 0.16 * up); });
      }
    },
  };
}

// =============================================================================================================== zstreetdoor
function stoneTex() {
  return tex(1024, 1024, (g, W, H) => {
    const R = rng(555), cols = ["#d4ccb6", "#cbc3ac", "#d9d2bf", "#c4bca5", "#cfc4a8", "#bdb59e", "#d6cfba"];
    g.fillStyle = "#b9b19b"; g.fillRect(0, 0, W, H);
    for (let y = 0, row = 0; y < H; row++) {
      const bh = 70 + R() * 44; let x = -R() * 140;
      while (x < W) { const bw = 150 + R() * 170; g.fillStyle = cols[(R() * cols.length) | 0]; g.fillRect(x + 4, y + 4, bw - 8, bh - 8); g.save(); g.beginPath(); g.rect(x + 4, y + 4, bw - 8, bh - 8); g.clip(); strokes(g, R, W, H, 14, ["#e2dcc9", "#b5ad96", "#d0c7ae"], [30, 90], [4, 14], [0.12, 0.3], [-0.1, 0.1]); g.restore(); g.fillStyle = "rgba(255,250,235,0.35)"; g.fillRect(x + 4, y + 4, bw - 8, 5); g.fillStyle = "rgba(60,52,40,0.3)"; g.fillRect(x + 4, y + bh - 9, bw - 8, 5); x += bw; }
      y += bh;
    }
    g.fillStyle = "rgba(70,62,50,0.5)"; for (let i = 0; i < 40; i++) g.fillRect(R() * W, R() * H, 20 + R() * 40, 2);
    for (let i = 0; i < 18; i++) crack(g, R, R() * W, R() * H, 5 + ((R() * 8) | 0), "rgba(60,52,42,0.5)");
    for (let i = 0; i < 26; i++) { const x = R() * W, y0 = R() * H * 0.7, len = 60 + R() * 200, gr = g.createLinearGradient(0, y0, 0, y0 + len); gr.addColorStop(0, "rgba(70,60,46,0.3)"); gr.addColorStop(1, "rgba(70,60,46,0)"); g.fillStyle = gr; g.fillRect(x, y0, 8 + R() * 14, len); }
  });
}
function leafTex() {   // the door leaf, 1.0 x 2.15 m at 512 px per m; the free edge (the handle) at the left, the hinges at the right
  return tex(512, 1100, (g, W, H) => {
    const R = rng(808); g.fillStyle = "#2c4a37"; g.fillRect(0, 0, W, H);
    strokes(g, R, W, H, 520, ["#35563f", "#264130", "#2f4e3a", "#3a5c44", "#233a2b"], [60, 300], [3, 14], [0.12, 0.3], [Math.PI / 2 - 0.05, Math.PI / 2 + 0.05]);
    const panel = (x, y, w, h) => { g.fillStyle = "#213a29"; g.fillRect(x, y, w, h); g.fillStyle = "rgba(190,225,190,0.3)"; g.fillRect(x, y, w, 7); g.fillRect(x, y, 7, h); g.fillStyle = "rgba(0,0,0,0.42)"; g.fillRect(x, y + h - 7, w, 7); g.fillRect(x + w - 7, y, 7, h); g.strokeStyle = "rgba(14,26,18,0.6)"; g.lineWidth = 2; g.strokeRect(x + 14, y + 14, w - 28, h - 28); };
    panel(78, 480, 170, 520); panel(264, 480, 170, 520);
    // the small glass panel, a warm stairwell light behind it
    g.fillStyle = "#1c3226"; g.fillRect(158, 104, 196, 330); const gl = g.createLinearGradient(0, 120, 0, 420); gl.addColorStop(0, "#f0d78a"); gl.addColorStop(1, "#b88c3e"); g.fillStyle = gl; g.fillRect(172, 118, 168, 302);
    g.fillStyle = "rgba(110,70,30,0.45)"; g.beginPath(); g.moveTo(172, 420); g.lineTo(172, 330); g.lineTo(220, 330); g.lineTo(220, 360); g.lineTo(270, 360); g.lineTo(270, 390); g.lineTo(340, 390); g.lineTo(340, 420); g.closePath(); g.fill();   // a stair behind the glass
    g.fillStyle = "#1c3226"; g.fillRect(252, 118, 6, 302); g.fillRect(172, 262, 168, 6);
    g.fillStyle = "rgba(255,255,255,0.28)"; g.beginPath(); g.moveTo(180, 126); g.lineTo(226, 126); g.lineTo(190, 300); g.lineTo(180, 300); g.fill();
    g.fillStyle = "rgba(190,225,190,0.3)"; g.fillRect(158, 104, 196, 5); g.fillRect(158, 104, 5, 330); g.fillStyle = "rgba(0,0,0,0.4)"; g.fillRect(158, 429, 196, 5); g.fillRect(349, 104, 5, 330);
    // brass kick plate with screws
    const kp = g.createLinearGradient(0, 1020, 0, 1096); kp.addColorStop(0, "#d6b45e"); kp.addColorStop(0.5, "#a98428"); kp.addColorStop(1, "#7c5e1c"); g.fillStyle = kp; g.fillRect(46, 1020, 420, 76);
    g.fillStyle = "#6a5018"; for (const x of [62, 150, 256, 362, 450]) for (const y of [1034, 1082]) { g.beginPath(); g.arc(x, y, 4, 0, 6.283); g.fill(); }
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${R() < 0.5 ? "170,200,160" : "10,18,12"},${0.1 + R() * 0.2})`; g.fillRect(R() * W, R() * H, 3 + R() * 22, 1 + R() * 2); }   // scratches
    for (let i = 0; i < 12; i++) { g.fillStyle = "rgba(150,120,80,0.55)"; g.beginPath(); g.ellipse(R() * W, R() * H, 2 + R() * 5, 1 + R() * 3, R() * 3, 0, 6.283); g.fill(); }   // chips down to the wood
    const gr = g.createLinearGradient(0, H * 0.7, 0, H); gr.addColorStop(0, "rgba(30,26,20,0)"); gr.addColorStop(1, "rgba(30,26,20,0.35)"); g.fillStyle = gr; g.fillRect(0, H * 0.7, W, H * 0.3);
  });
}
function stairTex() {   // the porch's back wall, 1.44 x 2.145 m (y 0.155 .. 2.30) at 533 px per m, lit warm from a lamp at the top
  return tex(768, 1143, (g, W, H) => {
    const R = rng(212), px = (x) => (x + 0.72) * 533, py = (y) => (2.3 - y) * 533;
    g.fillStyle = "#cdb47a"; g.fillRect(0, 0, W, H);
    strokes(g, R, W, H, 520, ["#d6bf86", "#c4aa6e", "#dac690", "#bda266"], [30, 160], [8, 40], [0.08, 0.2], [-0.1, 0.1]);
    for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(120,98,60,0.22)"; g.beginPath(); g.ellipse(R() * W, R() * H * 0.6, 30 + R() * 50, 20 + R() * 40, R() * 3, 0, 6.283); g.fill(); }   // peeled paint
    g.fillStyle = "#5a6040"; g.fillRect(0, py(0.95), W, H - py(0.95)); g.save(); g.beginPath(); g.rect(0, py(0.95), W, H); g.clip(); strokes(g, R, W, H, 160, ["#666c48", "#4e5436", "#6f734f"], [40, 140], [8, 30], [0.1, 0.25], [-0.08, 0.08]); g.restore();
    g.fillStyle = "#948f62"; g.fillRect(0, py(0.95) - 6, W, 10); g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(0, py(0.95) + 4, W, 6);
    g.fillStyle = "#3b3228"; g.fillRect(0, H - 30, W, 30);
    // the stair, going up to the right: a stepped silhouette, lit treads, shaded risers
    const sx = [0.05, 0.22, 0.39, 0.56, 0.72], sy = [0.155, 0.365, 0.575, 0.785, 0.995];
    g.fillStyle = "#3d2a18"; g.beginPath(); g.moveTo(px(0.3), py(2.3)); g.lineTo(px(0.72), py(2.3)); g.lineTo(px(0.72), py(0.995)); g.lineTo(px(0.56), py(0.995)); g.closePath(); const dk = g.createLinearGradient(0, py(2.3), 0, py(1.0)); dk.addColorStop(0, "#150f09"); dk.addColorStop(1, "#4a3320"); g.fillStyle = dk; g.fill();   // the flight going up into the dark
    g.fillStyle = "#684628"; g.beginPath(); g.moveTo(px(sx[0]), py(0.155)); for (let k = 0; k < 4; k++) { g.lineTo(px(sx[k]), py(sy[k + 1])); g.lineTo(px(sx[k + 1]), py(sy[k + 1])); } g.lineTo(px(0.72), py(0.155)); g.closePath(); g.fill();
    for (let k = 0; k < 4; k++) { g.fillStyle = "#7d5733"; g.fillRect(px(sx[k]), py(sy[k + 1] - 0.0) + 14, px(sx[k + 1]) - px(sx[k]), (sy[k + 1] - (k ? sy[k] : 0.155)) * 533 - 14); g.fillStyle = "#cfa86e"; g.fillRect(px(sx[k]) - 4, py(sy[k + 1]), px(sx[k + 1]) - px(sx[k]) + 8, 16); g.fillStyle = "rgba(0,0,0,0.3)"; g.fillRect(px(sx[k]), py(sy[k + 1]) + 16, px(sx[k + 1]) - px(sx[k]), 8); }
    g.strokeStyle = "#2c1d10"; g.lineWidth = 7; g.beginPath(); g.moveTo(px(0.05), py(1.17)); g.lineTo(px(0.72), py(2.1)); g.stroke();   // the handrail
    g.lineWidth = 3; for (let k = 0; k < 7; k++) { const x = 0.07 + k * 0.1, y1 = 1.17 + ((x - 0.05) / 0.67) * 0.93, y0 = sy[Math.min(4, Math.floor((x - 0.05) / 0.17) + 1)]; g.beginPath(); g.moveTo(px(x), py(y1)); g.lineTo(px(x), py(Math.min(y0, y1 - 0.2))); g.stroke(); }
    // eight mailboxes (two rows of four) and a notice board
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
      const x = px(-0.68 + c * 0.14), y = py(1.1 + (1 - r) * 0.23 + 0.22), w = 0.13 * 533, h = 0.22 * 533, gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, "#a7adb2"); gr.addColorStop(1, "#6e747a");
      g.fillStyle = gr; g.fillRect(x, y, w, h); g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(x, y, w, 3); g.fillRect(x, y, 3, h); g.fillStyle = "rgba(0,0,0,0.4)"; g.fillRect(x, y + h - 3, w, 3); g.fillRect(x + w - 3, y, 3, h);
      g.fillStyle = "#1c1a18"; g.fillRect(x + 8, y + 22, w - 16, 5); g.fillStyle = "#e8e2cf"; g.fillRect(x + 10, y + h * 0.5, w - 20, 22); g.fillStyle = "rgba(40,36,30,0.7)"; g.fillRect(x + 14, y + h * 0.5 + 6, (w - 28) * (0.5 + R() * 0.4), 2); g.fillRect(x + 14, y + h * 0.5 + 13, (w - 28) * (0.3 + R() * 0.4), 2);
      g.fillStyle = "#b8923c"; g.beginPath(); g.arc(x + w - 14, y + h - 18, 4, 0, 6.283); g.fill();
    }
    g.fillStyle = "#8a6038"; g.fillRect(px(-0.6), py(2.08), 0.36 * 533, 0.36 * 533); g.fillStyle = "#4b3420"; g.strokeStyle = "#4b3420"; g.lineWidth = 5; g.strokeRect(px(-0.6), py(2.08), 0.36 * 533, 0.36 * 533);
    for (const [dx, dy, w, h, rt] of [[0.03, 0.04, 0.12, 0.16, -0.06], [0.18, 0.05, 0.13, 0.12, 0.05], [0.07, 0.2, 0.1, 0.11, 0.08], [0.2, 0.2, 0.11, 0.1, -0.04]]) { g.save(); g.translate(px(-0.6 + dx) + w * 266, py(2.08 - dy) + h * 266); g.rotate(rt); g.fillStyle = "#e9e4d2"; g.fillRect(-w * 266, -h * 266, w * 533, h * 533); g.fillStyle = "rgba(50,44,36,0.6)"; for (let l = 0; l < 4; l++) g.fillRect(-w * 230, -h * 230 + l * 14, w * 460 * (0.5 + R() * 0.5), 2); g.fillStyle = "#b53a2e"; g.beginPath(); g.arc(0, -h * 266 + 5, 3.5, 0, 6.283); g.fill(); g.restore(); }
    // the lamp's pool of light and the dark in the corners
    const lg = g.createRadialGradient(W * 0.5, 0, 0, W * 0.5, 0, 620); lg.addColorStop(0, "rgba(255,236,150,0.6)"); lg.addColorStop(0.5, "rgba(255,226,130,0.22)"); lg.addColorStop(1, "rgba(255,226,130,0)"); g.fillStyle = lg; g.fillRect(0, 0, W, H);
    for (const x of [0, W]) { const eg = g.createLinearGradient(x, 0, x ? W - 90 : 90, 0); eg.addColorStop(0, "rgba(40,28,14,0.45)"); eg.addColorStop(1, "rgba(40,28,14,0)"); g.fillStyle = eg; g.fillRect(x ? W - 90 : 0, 0, 90, H); }
    for (let i = 0; i < 7; i++) crack(g, R, R() * W, R() * H * 0.5, 5 + ((R() * 6) | 0), "rgba(70,54,34,0.45)");
  });
}
function sideWallTex(seed) {
  return tex(256, 512, (g, W, H) => {
    const R = rng(seed); g.fillStyle = "#cbb27a"; g.fillRect(0, 0, W, H); strokes(g, R, W, H, 160, ["#d6bf86", "#c0a66a", "#d9c58f"], [20, 90], [6, 26], [0.1, 0.22]);
    const y = H * (1 - 0.8 / 2.145); g.fillStyle = "#5a6040"; g.fillRect(0, y, W, H - y); g.fillStyle = "#948f62"; g.fillRect(0, y - 4, W, 7);
    const gr = g.createLinearGradient(0, 0, 0, H * 0.4); gr.addColorStop(0, "rgba(255,230,140,0.3)"); gr.addColorStop(1, "rgba(255,230,140,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  });
}
function floorTex() {
  return tex(480, 240, (g, W, H) => {
    const R = rng(66); for (let y = 0; y < 6; y++) for (let x = 0; x < 12; x++) { g.fillStyle = (x + y) % 2 ? "#ded5bd" : "#2e2a27"; g.fillRect(x * 40, y * 40, 40, 40); }
    strokes(g, R, W, H, 120, ["#b8ae96", "#4a4540", "#e8e0cc"], [10, 40], [3, 12], [0.1, 0.22]);
    g.strokeStyle = "rgba(90,82,70,0.6)"; g.lineWidth = 2; for (let x = 0; x <= W; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y <= H; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    for (let i = 0; i < 6; i++) crack(g, R, R() * W, R() * H, 4, "rgba(40,36,30,0.6)", 1.4);
    const gr = g.createLinearGradient(0, H, 0, 0); gr.addColorStop(0, "rgba(40,32,20,0)"); gr.addColorStop(1, "rgba(40,32,20,0.45)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  });
}
function plateTex() {
  return tex(256, 176, (g, W, H) => {
    const R = rng(27); g.fillStyle = "#1f4a78"; g.fillRect(0, 0, W, H); g.strokeStyle = "#f2f0e6"; g.lineWidth = 7; g.strokeRect(10, 10, W - 20, H - 20);
    g.fillStyle = "#f2f0e6"; g.font = "bold 112px 'Arial Black', Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("27", W / 2, H / 2 + 6);
    for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(190,180,160,${0.3 + R() * 0.3})`; g.fillRect(R() * W, R() * H, 2 + R() * 5, 2 + R() * 4); }
    g.fillStyle = "#b8b4a8"; for (const [x, y] of [[20, 20], [W - 20, 20], [20, H - 20], [W - 20, H - 20]]) { g.beginPath(); g.arc(x, y, 5, 0, 6.283); g.fill(); }
  });
}

function streetdoor(P) {
  const G = P.whole, FLOOR = 0.155, TOP = 2.3, IW = 0.72;
  const stone = stdM({ map: stoneTex(), vertexColors: true }), brass = stdM({ color: "#b8923c", metalness: 0.6, roughness: 0.35 }), green = stdM({ color: "#2b4636", roughness: 0.7 });
  const warm = (o = {}) => stdM({ emissive: "#6b4a1f", emissiveIntensity: 0.5, ...o });
  // --- the stone frame, each piece a different window of the painted atlas (uv rects)
  const sb = bake();
  sb.add(BX(0.13, 2.5, 0.7), { p: [-0.785, 1.25, 0.35], c: "#ffffff", uv: [0.0, 0.0, 0.12, 1.0] }); sb.add(BX(0.13, 2.5, 0.7), { p: [0.785, 1.25, 0.35], c: "#f4f1e8", uv: [0.2, 0.0, 0.32, 1.0] });
  sb.add(BX(0.19, 2.3, 0.12), { p: [-0.625, 1.15, 0.64], c: "#ffffff", uv: [0.4, 0.0, 0.5, 1.0] }); sb.add(BX(0.19, 2.3, 0.12), { p: [0.625, 1.15, 0.64], c: "#f4f1e8", uv: [0.6, 0.0, 0.7, 1.0] });
  sb.add(BX(1.7, 0.2, 0.7), { p: [0, 2.4, 0.35], c: "#fbf8ee", uv: [0.1, 0.5, 0.9, 0.7] });
  sb.add(BX(1.86, 0.07, 0.78), { p: [0, 2.535, 0.35 + 0.04], c: "#ffffff", uv: [0.1, 0.3, 0.9, 0.38] });
  sb.add(BX(1.1, 0.13, 0.32), { p: [0, 0.145, 0.86], c: "#e8e4d6", uv: [0.2, 0.7, 0.8, 0.82] });
  put(G, sb.geo(), stone);
  // --- inside: floor tiles, side walls, ceiling, the painted back wall, the lamp
  put(G, PL(1.44, 0.7).rotateX(-Math.PI / 2), warm({ map: floorTex() }), 0, FLOOR, 0.35);
  for (const s of [-1, 1]) put(G, PL(0.7, 2.145).rotateY(-s * Math.PI / 2), warm({ map: sideWallTex(80 + s) }), s * IW, (FLOOR + TOP) / 2, 0.35);
  put(G, PL(1.44, 0.7).rotateX(Math.PI / 2), warm({ color: "#d8c690" }), 0, TOP, 0.35);
  put(G, PL(1.44, 2.145), basicM("#ffffff", { map: stairTex() }), 0, (FLOOR + TOP) / 2, 0.006);
  put(G, BX(1.06, 0.03, 0.12), stdM({ color: "#8a8a82", metalness: 0.4, roughness: 0.5 }), 0, FLOOR + 0.012, 0.65);
  const dome = put(G, new THREE.SphereGeometry(0.075, 14, 10, 0, 6.2832, 0, Math.PI * 0.6), basicM("#ffe8a0"), 0, TOP - 0.11, 0.3); dome.scale.y = 0.8;
  put(G, CY(0.012, 0.012, 0.045, 6), stdM({ color: "#3a3630" }), 0, TOP - 0.022, 0.3); put(G, CY(0.05, 0.05, 0.012, 12), stdM({ color: "#3a3630" }), 0, TOP - 0.006, 0.3);
  const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: "#ffcc66", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.5 })); lampGlow.scale.setScalar(0.9); lampGlow.position.set(0, TOP - 0.15, 0.32); glow(lampGlow, 6); G.add(lampGlow);
  // --- plates on the front jambs: the number and the doorbells
  put(G, BX(0.2, 0.14, 0.012), stdM({ map: plateTex(), roughness: 0.4 }), -0.625, 1.85, 0.706);
  put(G, BX(0.075, 0.2, 0.01), brass, 0.625, 1.3, 0.705); for (let k = 0; k < 3; k++) put(G, CY(0.011, 0.011, 0.01, 8), stdM({ color: "#efe6cc", roughness: 0.4 }), 0.625, 1.37 - k * 0.07, 0.715).rotation.x = Math.PI / 2;
  // --- the leaf: hinged at local x +0.5, z 0.65; its own frame runs from the hinge along -x
  const hinge = new THREE.Group(); hinge.position.set(0.5, FLOOR + 0.02, 0.65); G.add(hinge); hinge.userData.solid = false;
  const lt = leafTex(), LW = 0.99, LH = 2.13;
  put(hinge, BX(LW, LH, 0.05), green, -0.505, LH / 2, 0);
  const front = put(hinge, PL(LW, LH), stdM({ map: lt, roughness: 0.75 }), -0.505, LH / 2, 0.0255);
  const back = put(hinge, PL(LW, LH), stdM({ map: lt, roughness: 0.75 }), -0.505, LH / 2, -0.0255); back.rotation.y = Math.PI;
  for (const sg of [1, -1]) {   // brass lever on a rose plate on both faces, and a keyhole plate
    put(hinge, BX(0.045, 0.16, 0.008), brass, -0.9, 1.0, sg * 0.029); put(hinge, CY(0.016, 0.016, 0.03, 10), brass, -0.9, 1.0, sg * 0.04).rotation.x = Math.PI / 2;
    put(hinge, BX(0.13, 0.016, 0.016), brass, -0.835, 1.0, sg * 0.058);
  }
  for (const y of [0.28, 1.06, 1.84]) put(hinge, CY(0.017, 0.017, 0.12, 8), brass, 0.002, y, 0);
  // the whole leaf
  const shape = (ps, t) => {
    const open = clamp(ps.open ?? P.spec.open ?? 0), sk = clamp(ps.shake ?? P.spec.shake ?? 0) * (1 - sm(open * 6)), tt = t ?? 0;
    hinge.rotation.y = -open * Math.PI / 2 + sk * (0.0095 * Math.sin(tt * 41) + 0.0065 * Math.sin(tt * 25.1 + 1.3));
    hinge.position.x = 0.5 + sk * 0.004 * Math.sin(tt * 33 + 0.7);
  };
  return { grip: 0, apply: shape };
}

export const ZFIGHT_KINDS = {
  zrevolver: revolver,
  zshot,
  zstreetdoor: streetdoor,
};
