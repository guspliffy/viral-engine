import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Character } from "./potato.js";
import { buildSet, buildLights } from "./sets.js";
import { actorState, cameraState, flashAt, captionsAt, lightsAt } from "./timeline.js";
import { radialTexture } from "./geo.js";
import { buildProp, propState, gripWorld } from "./props3d.js";
import { rng, clamp, ease, setLoop } from "./util.js";
import { makeStyle, STYLE_PALETTES } from "./styles.js";
import { makeLook } from "./looks.js";
import { bindText, captionBox, drawCaption, popBox, drawPop, slamBox, drawSlam } from "./text.js";
import { rigState, roadDistance, wheelTravel } from "./vehicle.js";
import { storyTime } from "../shared/holds.js";
import { buildRoadster } from "./car-roadster.js";

const W = 1080, H = 1920;
let R, scene, camera, sb, actors = [], poofs = [], styler, setObjs = [], inkMat, poseStates = {}, props = [];
let roomLights = [], lamp = null, bulb = null, charMats = [], camGates = [];   // what the "lights" effect dims (timeline.js lightsAt)
const photos = new Map();   // "photo" effects: the snapshot each one shows, taken once
let rigs = new Map();   // vehicle rigs (vehicle.js): id -> { r: the spec, g: the group riders are parented to, car }
const D2R = Math.PI / 180;
// a point in a character's own parent frame (a rig, or the world) in the world
const worldOf = (a, p) => (a.ch.root.parent && a.ch.root.parent !== scene ? a.ch.root.parent.localToWorld(p) : p);

// a seatbelt across a seated character (cast "belt": { side: "R" | "L", the shoulder it comes over, color }): a flat
// strap lying on the body from that shoulder, across the front under the face, to the other hip, a lap strap and a
// chrome buckle. It lies on the body (Character.surf), so it squashes and breathes with it.
function seatBelt(ch, B) {
  const s = B.side === "L" ? 1 : -1, m = new THREE.MeshStandardMaterial({ color: B.color || "#2a2b33", roughness: 0.8 });
  const strap = (path, w) => {
    const c = new THREE.CatmullRomCurve3(path.map(([th, ph]) => new THREE.Vector3(th, ph, 0))), N = 40, pos = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const q = c.getPoint(i / N), q2 = c.getPoint(Math.min(1, i / N + 0.01)), q0 = c.getPoint(Math.max(0, i / N - 0.01));
      const a = ch.surf(q.x, q.y), b = ch.surf(q2.x, q2.y), b0 = ch.surf(q0.x, q0.y);
      const tan = b.pos.clone().sub(b0.pos).normalize(), side = tan.clone().cross(a.normal).normalize();
      for (const [u, v] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) pos.push(...a.pos.clone().addScaledVector(side, (u * w) / 2).addScaledVector(a.normal, 0.006 + v * 0.012).toArray());
    }
    for (let i = 0; i < N; i++) for (let k = 0; k < 4; k++) { const a = i * 4 + k, b = i * 4 + ((k + 1) % 4); idx.push(a, b, a + 4, b, b + 4, a + 4); }
    for (const e of [0, N * 4]) idx.push(e, e + 1, e + 2, e, e + 2, e + 3);
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; o.name = "seatbelt"; ch.potatoParts.add(o); return o;
  };
  strap([[1.5, 0.36], [1.05, 0.06], [0.55, -0.27], [0, -0.47], [-0.6, -0.58], [-1.15, -0.6]].map(([th, ph]) => [s * th, ph]), B.width ?? 0.075);
  strap([[1.35, -0.66], [0.5, -0.74], [-0.5, -0.74], [-1.35, -0.66]], (B.width ?? 0.075) * 0.9);
  const at = ch.surf(-s * 1.08, -0.62), buckle = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.02), new THREE.MeshStandardMaterial({ color: "#d9dde4", metalness: 0.85, roughness: 0.2 }));
  buckle.position.copy(at.pos).addScaledVector(at.normal, 0.02); buckle.lookAt(at.pos.clone().addScaledVector(at.normal, 1)); buckle.castShadow = true; ch.potatoParts.add(buckle);
}

// Particle bursts ("poof"): smoke puffs and sparkles, positions are a pure function of time.
function buildPoof(f, i) {
  const rnd = rng(1000 + i * 77), g = new THREE.Group(); scene.add(g);
  const smokeTex = radialTexture([[0, "rgba(255,255,255,0.95)"], [0.5, "rgba(255,255,255,0.6)"], [1, "rgba(255,255,255,0)"]]);
  const puffs = Array.from({ length: f.puffs ?? 26 }, () => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: f.color || "#ffffff", transparent: true, depthWrite: false }));
    g.add(s);
    const a = rnd() * Math.PI * 2, el = (rnd() - 0.2) * 1.2;
    return { s, dir: new THREE.Vector3(Math.cos(a) * Math.cos(el), Math.abs(Math.sin(el)) * 0.8 + 0.2, Math.sin(a) * Math.cos(el) * 0.6), dist: 0.35 + rnd() * 0.55, size: 0.35 + rnd() * 0.45, delay: rnd() * 0.08 };
  });
  const sparkM = new THREE.MeshBasicMaterial({ color: f.spark || "#ffe27a" });
  const sparks = Array.from({ length: f.sparks ?? 22 }, () => {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.03 * (f.sparkSize ?? 1), 0), sparkM); g.add(m);
    const a = rnd() * Math.PI * 2;
    return { m, v: new THREE.Vector3(Math.cos(a) * (1.2 + rnd() * 2), 1.5 + rnd() * 2.5, Math.sin(a) * (0.6 + rnd())), spin: rnd() * 10 };
  });
  return {
    f, g,
    apply(t, origin) {
      const k = t - f.at, d = f.dur ?? 1.4;
      g.visible = k >= 0 && k <= d;
      if (!g.visible) return;
      g.position.copy(origin);
      const sz = f.size ?? 1;   // `size` scales the puffs and their spread, `lift` raises the cloud (a landing's dust: small and low)
      for (const p of puffs) {
        const q = clamp((k - p.delay) / d);
        const r = p.dist * (1 - Math.exp(-q * 7));
        p.s.position.copy(p.dir).multiplyScalar(r * sz).add(new THREE.Vector3(0, (f.lift ?? 0.45) + q * 0.25 * sz, 0));
        p.s.scale.setScalar(p.size * sz * (0.3 + 1.2 * (1 - Math.exp(-q * 5))));
        p.s.material.opacity = q <= 0 ? 0 : Math.min(1, q * 12) * Math.pow(1 - q, 1.6);
      }
      const sp = (f.speed ?? 1) * 0.7;   // `speed` scales how far the sparks fly (embers: slower, smaller with `sparkSize`)
      for (const s of sparks) {
        const q = Math.min(k, 0.9);
        s.m.position.set(s.v.x * q * sp, 0.5 + s.v.y * q * sp - 4.2 * q * q * sp, s.v.z * q * sp);
        s.m.rotation.set(s.spin * k, s.spin * k * 0.7, 0);
        s.m.visible = k < 0.9;
        s.m.scale.setScalar(1.4 * (1 - k / 0.9) + 0.2);
      }
    },
  };
}

// A sword slash ("slash"): a crescent smear along the blade's path for a few frames, the motion blur of a cut that is
// faster than a frame. pos: the arc's centre (the fist's pivot), rot: [x, y, z] degrees (the arc lies in its own xy
// plane, sweeping from angle `from` through `arc`, degrees), r: the blade's reach. It grows along the sweep, then fades.
function buildSlash(f) {
  const g = new THREE.Group(), N = 40, r = f.r ?? 0.8, w = f.width ?? 0.12, a0 = ((f.from ?? 90) * Math.PI) / 180, A = ((f.arc ?? -100) * Math.PI) / 180;
  const geo = new THREE.BufferGeometry(), pos = new Float32Array((N + 1) * 2 * 3), idx = [];
  const m = new THREE.MeshBasicMaterial({ color: f.color || "#eafff2", transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  m.userData.noOutline = true;
  for (let i = 0; i < N; i++) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
  const o = new THREE.Mesh(geo, m); o.frustumCulled = false; o.renderOrder = 4; g.add(o); scene.add(g);
  g.rotation.set(...(f.rot || [0, 0, 0]).map((d) => (d * Math.PI) / 180));
  return {
    f, g,
    apply(t, origin) {
      const k = t - f.at, d = f.dur ?? 0.16;
      g.visible = k >= 0 && k <= d;
      if (!g.visible) return;
      g.position.copy(origin);
      // the head of the smear runs ahead with the blade over the first half, the tail catches up over the second
      const head = clamp(k / (d * 0.5)), tail = clamp((k - d * 0.35) / (d * 0.65));
      for (let i = 0; i <= N; i++) {
        const u = tail + (head - tail) * (i / N), an = a0 + A * u, th = w * Math.sin(Math.PI * (i / N)) * (1 - 0.5 * tail);
        pos.set([Math.cos(an) * r, Math.sin(an) * r, 0, Math.cos(an) * (r - th), Math.sin(an) * (r - th), 0], i * 6);
      }
      geo.attributes.position.needsUpdate = true;
      m.opacity = 0.85 * (1 - tail * tail);
    },
  };
}

// Captions (text.js), flash and the safe-zone guide are drawn on a 2D canvas on top of the 3D frame, and that canvas
// is what gets captured. Reading one canvas is far faster than screenshotting the page through the compositor.
let out, ctx, showSafe = false;
// manga focus lines converging on a point
function speedLines(f, t, i) {
  const d = f.dur ?? 0.6, k = (t - f.at) / d;
  if (k < 0 || k > 1) return;
  // the pattern changes 6 times a second (drawn-frame feel without strobing); between changes it drifts inward
  const step = Math.floor(t * 6), drift = (t * 6 - step) * 40;
  const r = rng(9001 + i * 131 + step * 7), [cx, cy] = f.center || [540, 860], n = f.count ?? 120;
  ctx.save(); ctx.globalAlpha = Math.min(1, k * 8, (1 - k) * 8) * (f.alpha ?? 0.85); ctx.fillStyle = f.color || "#1a1210";
  for (let j = 0; j < n; j++) {
    const a = ((j + r() * 0.9) / n) * Math.PI * 2, inner = (f.inner ?? 420) + r() * 320 - drift, w = 0.003 + r() * 0.011, outer = 2000;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a - w) * outer, cy + Math.sin(a - w) * outer);
    ctx.lineTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a + w) * outer, cy + Math.sin(a + w) * outer);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
const fxActive = (f, t) => t >= f.at && t <= f.at + (f.dur ?? 0.1);

// screen point (output px) of a 3D point, and the screen size of 1 m at that depth
function toScreen(v) {
  const p = new THREE.Vector3().fromArray(v), d = p.distanceTo(camera.position); p.project(camera);
  return { x: (p.x + 1) / 2 * W, y: (1 - p.y) / 2 * H, m: H / (2 * d * Math.tan((camera.fov * Math.PI) / 360)) };
}
// "sparkle": four-point stars twinkling round a character's head; "notes": music notes floating up from it;
// "zzz": sleepy z's drifting up and to the right; "sweat": panic drops flicked off it; "alert": a "!" (or `text`) popping
// up above it
function star4(x, y, r) { ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, q = i % 2 ? r * 0.28 : r; ctx.lineTo(x + Math.sin(a) * q, y - Math.cos(a) * q); } ctx.closePath(); }
function headFx(f, t, i) {
  const d = f.dur ?? 1, k = (t - f.at) / d, A = f.who && poseStates[f.who];
  if (k < 0 || k > 1 || (!A && !f.pos)) return;
  // at a character's head, or at a point in the scene (`pos` [x, y, z], e.g. sparkles on a prop, z's over a box)
  const c = f.pos ? toScreen(f.pos) : toScreen(worldOf(A.a, new THREE.Vector3(A.st.x, A.st.y + A.a.ch.topY() * (A.st.scale ?? 1) * 0.85, A.st.z)).toArray()), n = f.count ?? 6, r = rng(4242 + i * 97);
  ctx.save(); ctx.lineJoin = "round";
  for (let j = 0; j < n; j++) {
    const ph = r(), ang = r() * Math.PI * 2, rad = (0.35 + r() * 0.3) * c.m, lk = clamp((k * 1.3 - ph * 0.3) / 0.75);
    if (lk <= 0 || lk >= 1) continue;
    const fade = Math.min(1, lk * 6, (1 - lk) * 5);
    if (f.do === "sparkle") {
      const x = c.x + Math.cos(ang) * rad, y = c.y + Math.sin(ang) * rad * 0.8, sz = (0.05 + 0.04 * r()) * c.m * Math.sin(lk * Math.PI);
      ctx.globalAlpha = fade; ctx.fillStyle = f.color || "#fff6c8"; ctx.strokeStyle = "rgba(60,40,0,0.55)"; ctx.lineWidth = 3;
      star4(x, y, sz); ctx.fill(); ctx.stroke();
    } else if (f.do === "sweat") {   // drops flicked off the head, both sides, falling in arcs
      const side = j % 2 ? 1 : -1, x = c.x + side * (0.25 + lk * 0.3) * c.m, y = c.y - (0.12 - 0.9 * (lk - 0.35) ** 2) * c.m, sz = 0.05 * c.m;
      ctx.globalAlpha = fade; ctx.fillStyle = f.color || "#7cc8ff"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x, y - sz * 1.6); ctx.quadraticCurveTo(x + sz, y, x, y + sz); ctx.quadraticCurveTo(x - sz, y, x, y - sz * 1.6); ctx.fill(); ctx.stroke();
    } else if (f.do === "alert") {   // one "!" that pops above the head and holds (count is ignored)
      if (j) continue;
      const pop = Math.min(1, k * 6), sc = pop < 1 ? pop * 1.25 : 1 + 0.25 * Math.max(0, 1 - (k * 6 - 1) * 2), x = c.x + 0.28 * c.m, y = c.y - 0.42 * c.m;
      ctx.globalAlpha = Math.min(1, (1 - k) * 6); ctx.font = `900 ${Math.round(0.34 * c.m * sc)}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.lineWidth = 10; ctx.strokeStyle = "#ffffff"; ctx.fillStyle = f.color || "#e8402f"; ctx.strokeText(f.text || "!", x, y); ctx.fillText(f.text || "!", x, y);
    } else if (f.do === "zzz") {
      const x = c.x + (0.25 + lk * 0.35) * c.m + Math.sin(lk * 5 + j) * 0.03 * c.m, y = c.y - (0.15 + lk * 0.5) * c.m;
      ctx.globalAlpha = fade; ctx.font = `900 ${Math.round((0.1 + 0.08 * lk) * c.m)}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.lineWidth = 6; ctx.strokeStyle = "#ffffff"; ctx.fillStyle = f.color || "#2b2934";
      ctx.strokeText("z", x, y); ctx.fillText("z", x, y);
    } else {
      const side = j % 2 ? 1 : -1, x = c.x + side * (0.2 + 0.25 * r()) * c.m + Math.sin(lk * 6 + j) * 0.05 * c.m, y = c.y - lk * 0.55 * c.m;
      ctx.globalAlpha = fade; ctx.font = `900 ${Math.round(0.16 * c.m)}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.lineWidth = 6; ctx.strokeStyle = "#ffffff"; ctx.fillStyle = f.color || "#2b2934"; const g = j % 3 === 1 ? "\u266B" : "\u266A";
      ctx.strokeText(g, x, y); ctx.fillText(g, x, y);
    }
  }
  ctx.restore();
}

// where a text pop sits: beside the head (dx, dy in head sizes) or at "xy" in output pixels; text.js keeps it in the
// safe zone
function popAnchor(f) {
  if (f.xy) return { x: f.xy[0], y: f.xy[1] };
  const A = f.who && poseStates[f.who]; if (!A) return null;
  const c = toScreen(worldOf(A.a, new THREE.Vector3(A.st.x, A.st.y + A.a.ch.topY() * (A.st.scale ?? 1) * 0.85, A.st.z)).toArray());
  return { x: c.x + (f.dx ?? 0.55) * c.m, y: c.y + (f.dy ?? -0.3) * c.m };
}

// the point of a character's held prop in the world (the blade tip of the Samurai's katana), from its shaft line
function propTip(who, k = 1) {
  const A = poseStates[who]; if (!A) return null;
  const L = A.a.ch.costume.propLine?.(); if (!L) return null;
  A.a.ch.root.updateMatrixWorld(true);
  return A.a.ch.root.localToWorld(L.a.clone().lerp(L.b, k));
}
// "glint": the anime "bling" on a blade: a four-point star that flares on the tip (who: the holder; at: 0..1 along
// the shaft, default the tip; or pos: a world point), turns a little and fades. Over 0.5 s by default.
function glintFx(f, t) {
  const d = f.dur ?? 0.5, k = (t - f.at) / d;
  if (k < 0 || k > 1) return;
  const w = f.pos ? new THREE.Vector3().fromArray(f.pos) : propTip(f.who, f.along ?? 0.98);
  if (!w) return;
  const c = toScreen(w.toArray()), grow = k < 0.25 ? ease("out")(k / 0.25) : 1 - ease("in")((k - 0.25) / 0.75);
  const r = (f.size ?? 0.22) * c.m * grow, rot = (f.turn ?? 0.6) * k;
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(rot);
  ctx.globalCompositeOperation = "lighter";
  const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.9); halo.addColorStop(0, `rgba(255,255,255,${0.8 * grow})`); halo.addColorStop(0.3, `rgba(170,255,210,${0.35 * grow})`); halo.addColorStop(1, "rgba(120,255,180,0)");
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2); ctx.fill();
  const spike = (len, wid, a) => { ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, -len); ctx.quadraticCurveTo(wid * 0.25, -wid * 0.25, wid, 0); ctx.quadraticCurveTo(wid * 0.25, wid * 0.25, 0, len); ctx.quadraticCurveTo(-wid * 0.25, wid * 0.25, -wid, 0); ctx.quadraticCurveTo(-wid * 0.25, -wid * 0.25, 0, -len); ctx.fill(); ctx.restore(); };
  ctx.fillStyle = `rgba(255,255,255,${Math.min(1, grow * 1.4)})`;
  spike(r, r * 0.09, 0); spike(r * 1.15, r * 0.08, Math.PI / 2); spike(r * 0.45, r * 0.06, Math.PI / 4); spike(r * 0.45, r * 0.06, -Math.PI / 4);
  ctx.restore();
}

// glows (sprites on a character, like the blazing Phoenix's halo) would turn into black squares in an ink render:
// hide them and return them, to be shown again after
function inkGlows() { const out = []; for (const a of actors) a.ch.root.traverse((o) => { if (o.isSprite && o.visible) { o.visible = false; out.push(o); } }); return out; }

// "photo": a phone pops up showing a snapshot taken at `shot` (default: when the effect starts) from `cam`
//   { fx: "photo", dur, cam: { pos, look, fov }, look: "normal" | "dark" | "ink", hide: [actor or prop ids], pos: [x, y], w, tilt }
// "dark" is underexposed; "ink" shows whoever is left as black silhouettes against a blinding glow (overexposed).
// The picture is the middle square of what that camera sees. It is drawn once and kept: every frame shows the same photo.
function snapshot(f, i) {
  if (photos.has(i)) return;
  const c = f.cam || {}, hideIds = f.hide || [], hidden = [];
  pose(f.shot ?? f.at);
  const pc = new THREE.PerspectiveCamera(c.fov ?? 40, W / H, 0.05, 300);
  pc.position.fromArray(c.pos || [0, 1, 3]); pc.lookAt(new THREE.Vector3().fromArray(c.look || [0, 0.8, 0]));
  const hide = (o) => { if (o.visible) { o.visible = false; hidden.push(o); } };
  for (const a of actors) if (hideIds.includes(a.c.id)) hide(a.ch.root);
  for (const p of props) if (hideIds.includes(p.spec.id) || f.look === "ink") hide(p.root);
  if (f.look === "ink") {
    hidden.push(...inkGlows());
    for (const o of setObjs) hide(o);
    for (const p of poofs) hide(p.g);
    const bg = scene.background; scene.background = new THREE.Color("#ffffff"); scene.overrideMaterial = inkMat;
    R.render(scene, pc);
    scene.overrideMaterial = null; scene.background = bg;
  } else { const progs = R.info.programs.length; styler.prepare(scene); styler.render(scene, pc); if (R.info.programs.length !== progs) { styler.prepare(scene); styler.render(scene, pc); } }
  for (const o of hidden) o.visible = true;
  // aspect: the picture's height over its width (1, a square, by default; a print can be 1.25, portrait)
  const S = 720, A = f.aspect ?? 1, cv = document.createElement("canvas"); cv.width = S; cv.height = Math.round(S * A);
  const g = cv.getContext("2d"), src = R.domElement, k = src.width / W;   // a draft draws at half resolution
  g.drawImage(src, 0, ((H - W * A) / 2) * k, W * k, W * A * k, 0, 0, S, S * A);
  if (f.look === "dark") { g.fillStyle = "rgba(14,9,22,0.82)"; g.fillRect(0, 0, S, S * A); }
  if (f.look === "ink") {
    g.globalCompositeOperation = "multiply";
    const gr = g.createRadialGradient(S / 2, S * 0.45, 0, S / 2, S * 0.45, S * 0.8);
    gr.addColorStop(0, "#fffdf4"); gr.addColorStop(0.55, "#ffeab0"); gr.addColorStop(1, "#ffbf66");
    g.fillStyle = gr; g.fillRect(0, 0, S, S); g.globalCompositeOperation = "source-over";
  }
  photos.set(i, cv);
}
// style "print": the photo as a printed picture with a white border (thicker at the bottom) filling the frame's width,
// over the scene dimmed by `dim` (0.6); it drops in with a little settle, develops from white over `develop` (0.35 s)
// and drifts closer by `push` (0.03) over its whole length. { fx: "photo", style: "print", aspect: 1.25, w: 980, ... }
function printCard(f, pic, k, d) {
  const [cx, cy] = f.pos || [W / 2, H * 0.48], w = f.w ?? 980, m = w * 0.045, pw = w - 2 * m, ph = pw * (pic.height / pic.width), h = ph + m + m * 3.2;
  const inK = ease("settle")(clamp(k / 0.35)), s = (0.9 + 0.1 * inK) * (1 + (f.push ?? 0.03) * clamp(k / d));
  ctx.save();
  ctx.globalAlpha = Math.min(1, k / 0.12) * (f.dim ?? 0.6); ctx.fillStyle = "#0d0b16"; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = Math.min(1, k / 0.08);
  ctx.translate(cx, cy + (1 - inK) * 60); ctx.rotate((((f.tilt ?? -2.5) * Math.PI) / 180) * (0.6 + 0.4 * inK)); ctx.scale(s, s);
  ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16;
  ctx.fillStyle = "#fbf8f1"; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowColor = "transparent";
  ctx.drawImage(pic, -pw / 2, -h / 2 + m, pw, ph);
  ctx.lineWidth = 2; ctx.strokeStyle = "rgba(0,0,0,0.12)"; ctx.strokeRect(-pw / 2, -h / 2 + m, pw, ph);
  const dev = 1 - clamp(k / (f.develop ?? 0.35));
  if (dev > 0) { ctx.globalAlpha *= dev; ctx.fillStyle = "#fffdf6"; ctx.fillRect(-pw / 2, -h / 2 + m, pw, ph); }
  ctx.restore();
}
function photoCard(f, i, t) {
  const d = f.dur ?? 1.5, k = t - f.at, pic = photos.get(i);
  if (k < 0 || k > d || !pic) return;
  if (f.style === "print") return printCard(f, pic, k, d);
  const [cx, cy] = f.pos || [500, 1000], w = f.w ?? 560, h = w * 1.5, m = 24, pw = w - 2 * m;
  // pops in with a little overshoot and tilt, drops away at the end
  const inK = ease("back")(clamp(k / 0.22)), outK = clamp((d - k) / 0.18), s = 0.6 + 0.4 * inK;
  ctx.save();
  ctx.globalAlpha = Math.min(1, k / 0.06) * outK;
  ctx.translate(cx, cy + (1 - outK) * 140); ctx.rotate((((f.tilt ?? -4) * Math.PI) / 180) * inK); ctx.scale(s, s);
  ctx.fillStyle = "#17171e"; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 60); ctx.fill();
  ctx.lineWidth = 7; ctx.strokeStyle = "#45454f"; ctx.stroke();
  ctx.fillStyle = "#0c0c11"; ctx.beginPath(); ctx.roundRect(-w / 2 + m, -h / 2 + m, pw, h - 2 * m, 40); ctx.fill();
  ctx.fillStyle = "#17171e"; ctx.beginPath(); ctx.roundRect(-60, -h / 2 + m + 14, 120, 30, 15); ctx.fill();
  ctx.drawImage(pic, -pw / 2, -pw / 2, pw, pw);
  // the shutter: the picture starts white and develops
  const dev = 1 - clamp(k / 0.3);
  if (dev > 0) { ctx.globalAlpha *= dev; ctx.fillStyle = "#ffffff"; ctx.fillRect(-pw / 2, -pw / 2, pw, pw); }
  ctx.restore();
}

// a dramatic shadow crossing the frame (Cookie Rescue, the hero close-up): a soft dark band at `angle` degrees from
// vertical sweeps from `from` to `to` (0..1 of the frame width) over dur, `width` (of the frame width) wide, darkening
// by up to `peak`; it fades in and out over its first and last fifth. { fx: "shade", at, dur, from, to, width, peak, angle }
function shadeFx(f, t) {
  const d = f.dur ?? 0.5, k = (t - f.at) / d;
  if (k < 0 || k > 1) return;
  const x = W * ((f.from ?? -0.4) + ((f.to ?? 1.4) - (f.from ?? -0.4)) * k), w = W * (f.width ?? 0.5), a = ((f.angle ?? 18) * Math.PI) / 180;
  const fade = Math.min(1, k * 5, (1 - k) * 5) * (f.peak ?? 0.45), c = f.color || "20,10,30";
  ctx.save(); ctx.translate(x, H / 2); ctx.rotate(a);
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(0.35, `rgba(${c},${fade})`); g.addColorStop(0.65, `rgba(${c},${fade})`); g.addColorStop(1, `rgba(${c},0)`);
  ctx.fillStyle = g; ctx.fillRect(-w / 2, -H, w, 2 * H); ctx.restore();
}

// an establishing shot ({ plate: "assets/plates/<name>.png", push }): the painted picture fills the frame instead of
// the 3D scene, centred and cropped to 9:16, pushing in slowly over the shot
const plateShots = new Map();
function establishing(t) {
  const shots = (sb.shots || []).filter((q) => q.at <= t).sort((a, b) => a.at - b.at), s = shots.at(-1), img = s?.plate && plateShots.get(s.plate);
  if (!img) return false;
  const next = (sb.shots || []).filter((q) => q.at > s.at).sort((a, b) => a.at - b.at)[0], dur = (next?.at ?? sb.duration) - s.at;
  const k = 1 + (s.push ?? 0.04) * Math.min(1, Math.max(0, (t - s.at) / dur)), c = Math.max(W / img.width, H / img.height) * k;
  ctx.drawImage(img, (W - img.width * c) / 2, (H - img.height * c) / 2, img.width * c, img.height * c);
  return true;
}

function composite(t) {
  ctx.globalAlpha = 1; if (!establishing(t)) ctx.drawImage(R.domElement, 0, 0, W, H);
  (sb.fx || []).forEach((f, i) => { if (f.do === "shade") shadeFx(f, t); else if (f.do === "speedlines") speedLines(f, t, i); else if (f.do === "sparkle" || f.do === "notes" || f.do === "zzz" || f.do === "sweat" || f.do === "alert") headFx(f, t, i); else if (f.do === "photo") photoCard(f, i, t); else if (f.do === "glint") glintFx(f, t); else if (f.do === "pop") drawPop(f, t, popAnchor(f)); });
  const fl = flashAt(sb, t);
  if (fl > 0) { ctx.globalAlpha = fl; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  for (const c of captionsAt(sb, t)) drawCaption(c, t);
  for (const f of sb.fx || []) if (f.do === "slam") drawSlam(f, t);   // slam words sit on top of everything
  if (showSafe) { ctx.save(); ctx.setLineDash([16, 10]); ctx.lineWidth = 4; ctx.strokeStyle = "rgba(255,0,180,.9)"; ctx.strokeRect(60, 210, 860, 1150); ctx.restore(); }
}

async function init(data) {
  sb = data.sb; charMats = []; photos.clear(); plateShots.clear();
  setLoop(sb);   // loop-safe idle rhythms for the costumes, props and sets (util.js), before any of them is built
  for (const s of sb.shots || []) if (s.plate && !plateShots.has(s.plate)) {
    const img = new Image(); plateShots.set(s.plate, img);
    (globalThis.__loads ||= []).push(new Promise((ok) => { img.onload = ok; img.onerror = ok; img.src = `/${s.plate.replace(/^\/+/, "")}`; }));
  }
  globalThis.__DIAG = sb.debug || null;   // storyboard "debug": { "clearance": true } logs staff/arm clearance per frame
  const canvas = document.getElementById("gl");
  const opts = data.opts || {};
  R = new THREE.WebGLRenderer({ canvas, antialias: opts.aa !== false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  // draft renders draw the 3D frame at half resolution (4x fewer pixels); captions stay sharp
  R.setPixelRatio(opts.draft ? 0.5 : 1); R.setSize(W, H, false);
  const style = opts.style || "standard", pal = { ...(STYLE_PALETTES[style] || {}), ...((sb.set && sb.set[style]) || {}) };
  R.toneMapping = THREE.NeutralToneMapping; R.toneMappingExposure = sb.exposure ?? pal.exposure ?? 1.0;
  R.outputColorSpace = THREE.SRGBColorSpace;
  R.shadowMap.enabled = true; R.shadowMap.type = opts.shadow === "pcf" ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(R);
  // image-based lighting only on the characters: on the ground and background it cost more than half the frame time
  const envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  camera = new THREE.PerspectiveCamera(32, W / H, 0.05, 300);
  buildLights(scene, sb.set);
  const before = scene.children.length;
  buildSet(scene, sb.set, STYLE_PALETTES[style] ? { sky: pal.sky, ground: pal.ground } : null, cameraState(sb, 0).pos);
  setObjs = scene.children.slice(before); // the scenery, hidden during impact frames
  // the room's own lights (props and characters bring their own: candles, a glowing pickle, a blazing Phoenix)
  roomLights = []; scene.traverse((o) => { if (o.isLight && o.name !== "set-lamp") roomLights.push({ o, base: o.intensity }); });
  lamp = scene.getObjectByName("set-lamp"); lamp = lamp ? { o: lamp, base: lamp.intensity } : null;
  bulb = scene.getObjectByName("set-bulb"); bulb = bulb ? { o: bulb, base: bulb.material.color.clone() } : null;
  // vehicle rigs (vehicle.js): characters and props with "rig" ride in them
  rigs = new Map((sb.rigs || []).map((r) => {
    const g = new THREE.Group(); g.name = `rig-${r.id}`; g.rotation.order = "YXZ"; scene.add(g);
    const car = r.kind === "roadster" ? buildRoadster(r) : null; if (car) g.add(car.root);
    return [r.id, { r, g, car }];
  }));
  const parentOf = (o) => (o.rig ? rigs.get(o.rig)?.g || (() => { throw new Error(`unknown rig: ${o.rig}`); })() : scene);
  props = (sb.props || []).map((spec) => { const p = buildProp(spec); parentOf(spec).add(p.root); return p; });
  // a clock prop replaces the kitchen's own clock
  if (props.some((p) => p.spec.kind === "clock")) { const c = scene.getObjectByName("set-clock"); if (c) c.visible = false; }
  inkMat = new THREE.MeshBasicMaterial({ color: "#000000" });
  actors = sb.cast.map((c) => {
    const def = data.chars[c.character];
    if (!def) throw new Error(`character not found: ${c.character}`);
    const ch = new Character(def, c.id); parentOf(c).add(ch.root);
    if (c.belt) seatBelt(ch, c.belt);
    ch.root.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if (m.isMeshStandardMaterial) { m.envMap = envTex; m.envMapIntensity = 0.35; charMats.push(m); } });
    return { c, def, ch };
  });
  // set pieces and props that belong to one side of a wall (set-elevator.js: the car's front wall and the hallway show
  // only while the camera is inside the car): userData.camGate(cameraPosition) says whether they show this frame
  camGates = []; scene.traverse((o) => { if (o.userData.camGate) camGates.push(o); });
  poofs = (sb.fx || []).map((f, i) => (f.do === "poof" ? buildPoof(f, i) : f.do === "slash" ? buildSlash(f) : null)).filter(Boolean);   // slashes ride with the poofs (hidden in the checks)
  // a look (looks.js) relights the scene, upgrades materials and adds post-processing; without one, the style draws
  styler = opts.look ? makeLook(opts.look, { R, scene, camera, W, H, actors, setObjs, draft: !!opts.draft, setSpec: sb.set, props, focusTrack: sb.focusTrack }) : makeStyle(style, R);
  out = document.getElementById("out"); ctx = out.getContext("2d"); bindText(ctx, sb);
  showSafe = !!(data.opts && data.opts.safe);
  await document.fonts.ready;
  await Promise.all([...document.fonts].map((f) => f.load().catch(() => null)));
  await Promise.all(globalThis.__loads || []);   // pictures the set loads (set-plate.js)
  const gl = R.getContext(), dbg = gl.getExtension("WEBGL_debug_renderer_info");
  return { ok: true, fonts: [...document.fonts].map((f) => `${f.family}:${f.status}`), gl: gl.getParameter(gl.VERSION), renderer: gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER) };
}

// places characters, effects and camera for time t without drawing anything
function pose(t) {
  for (const f of globalThis.__setTicks || []) f(t);   // set motion that runs on the clock (set-plate.js)
  // vehicle rigs first: everything riding in them is placed in their frame
  for (const V of rigs.values()) {
    const s = rigState(V.r, t), p = V.r.pivot || [0, 0.55, 0];
    V.g.rotation.set(s.pitch * D2R, s.yaw * D2R, s.roll * D2R); V.g.position.set(0, 0, 0); V.g.updateMatrix();
    const piv = new THREE.Vector3(...p).applyMatrix4(V.g.matrix);
    V.g.position.set(s.pos[0] + p[0] - piv.x, s.pos[1] + p[1] - piv.y, s.pos[2] + p[2] - piv.z); V.g.updateMatrixWorld(true);
    if (V.car) V.car.apply(s, t, roadDistance(sb.set, t), wheelTravel(V.r, sb.set, t));
  }
  const states = {};
  for (const a of actors) { const st = actorState(sb, a.c, a.def, t); a.ch.apply(st, t); states[a.c.id] = { st, a }; }
  for (const p of poofs) {
    const who = p.f.who && states[p.f.who];
    // at the character's height: a poof on someone flying, sitting or standing on a table happens where they are
    const o = who ? worldOf(who.a, new THREE.Vector3(who.st.x, who.st.y, who.st.z + 0.15)) : new THREE.Vector3().fromArray(p.f.pos || [0, 0, 0]);
    p.apply(t, o);
  }
  poseStates = states;
  // props: a held prop sits in its holder's hand (both hands: between them), a released one glides to where it is put down
  const v = new THREE.Vector3();
  // the holder's anchor: a hand (position only, so a held prop stays upright), both hands, the point of the
  // character's own prop ("tip"), or the hat ("hat": position and tilt, something stuck to the hat tips with it)
  // point "pinch": a glove's fingertip pinch (potato.js pinchPt) instead of the hand's centre
  const anchor = (who, hand, point) => {
    const A = states[who]; if (!A) return null;
    A.a.ch.root.updateMatrixWorld(true);
    if (point === "pinch" && A.a.ch.arms[hand]?.hand.userData.pinchPt) return { pos: A.a.ch.arms[hand].hand.userData.pinchPt.getWorldPosition(new THREE.Vector3()) };
    if (hand === "hat") return A.a.ch.costume.hat ? { obj: A.a.ch.costume.hat } : null;
    if (hand === "tip") return A.a.ch.costume.tip ? { pos: A.a.ch.costume.tip.getWorldPosition(new THREE.Vector3()) } : null;
    const hs = hand === "both" ? ["R", "L"] : [hand];
    return { pos: hs.reduce((acc, h) => acc.add(A.a.ch.arms[h].hand.getWorldPosition(v)), new THREE.Vector3()).multiplyScalar(1 / hs.length) };
  };
  // where a held prop sits for its holder's pose right now
  // in a rig the prop is placed in the rig's frame: hands and hats are measured in the world, then brought into it
  const inFrame = (p, v) => (p.root.parent && p.root.parent !== scene ? p.root.parent.worldToLocal(v.clone()) : v);
  const heldAt = (p, ps, hold) => {
    const k = hold.keep ? keptOffset(p, hold, ps) : null;   // first: it poses the holder at the grab and back
    const an = anchor(hold.who, hold.hand, hold.point); if (!an) return null;
    if (k) {
      if (an.obj) return inFrame(p, an.obj.localToWorld(new THREE.Vector3().fromArray(k))).toArray();
      const q = inFrame(p, an.pos); return [q.x + k[0], q.y + k[1], q.z + k[2]];
    }
    const h = inFrame(p, an.obj ? an.obj.getWorldPosition(new THREE.Vector3()) : an.pos), o = hold.off;
    // a grip point: the prop sits so that point is in the hand; otherwise its own grip height is
    const g = hold.grip ? gripWorld(p.spec, hold.grip, [0, 0, 0], ps.rot, ps.scale, ps.tilt, ps.tip) : [0, p.grip * ps.scale, 0];
    return [h.x - g[0] + o[0], h.y - g[1] + o[1], h.z - g[2] + o[2]];
  };
  // keep: the offset from the holder that leaves the prop exactly where it was at the grab (measured once, with
  // the holder posed at that moment)
  const keptOffset = (p, hold, ps) => {
    // (a let-go prop's hold carries the release time in `at` and the grab's in `grabAt`: measure at the grab)
    const at = hold.grabAt ?? hold.at, key = `${hold.who}/${hold.hand}@${at}`;
    if (!p.kept || p.kept.key !== key) {
      // a prop taken again after it was let go without a place starts where that hand left it, not at `from` (its
      // last placed spot): pose the earlier holder at the let-go once (Candy Bodyguard: the slid sweet jumped back
      // into the glove)
      let from = hold.from;
      if (hold.prev) {
        const B = states[hold.prev.who];
        if (B) {
          if (hold.prev.keep) keptOffset(p, hold.prev, ps);   // (it poses and restores the holder itself: first)
          B.a.ch.apply(actorState(sb, B.a.c, B.a.def, hold.prev.at), hold.prev.at);
          from = heldAt(p, ps, hold.prev) ?? from;
          B.a.ch.apply(B.st, t);
        }
      }
      const A = states[hold.who];
      A.a.ch.apply(actorState(sb, A.a.c, A.a.def, at), at);
      const an = anchor(hold.who, hold.hand), w = new THREE.Vector3().fromArray(from);
      const ap = an.obj ? null : inFrame(p, an.pos);
      p.kept = { key, off: an.obj ? an.obj.worldToLocal(p.root.parent && p.root.parent !== scene ? p.root.parent.localToWorld(w) : w).toArray() : [w.x - ap.x, w.y - ap.y, w.z - ap.z] };
      A.a.ch.apply(A.st, t);
    }
    return p.kept.off;
  };
  for (const p of props) {
    const ps = propState(sb, p.spec, t);
    p.held = !!ps.hold; p.holder = ps.hold ? ps.hold.who : null; p.holdHand = ps.hold ? ps.hold.hand : null;
    // let go without a place: it stays where it was when the hand let go (pose the holder at that moment once)
    if (ps.left) {
      const key = `${ps.left.who}@${ps.left.at}`;
      if (!p.leftAt || p.leftAt.key !== key) {
        const A = states[ps.left.who];
        if (A) {
          if (ps.left.keep) keptOffset(p, ps.left, ps);
          A.a.ch.apply(actorState(sb, A.a.c, A.a.def, ps.left.at), ps.left.at);
          p.leftAt = { key, pos: heldAt(p, ps, ps.left) };
          A.a.ch.apply(A.st, t);
        }
      }
      if (p.leftAt && p.leftAt.pos) [ps.x, ps.y, ps.z] = p.leftAt.pos;
    }
    if (ps.hold) {
      const at = heldAt(p, ps, ps.hold);
      if (at) {
        [ps.x, ps.y, ps.z] = ps.hold.to ? ps.hold.to.map((q, i) => q + (at[i] - q) * ps.hold.k) : at;
        if (ps.hold.arc) ps.y += ps.hold.arc;
      }
    }
    p.apply(ps, t);
  }
  // a charger's cable runs to the prop its spec.to names (props3d.js charger, props-charger.js chargebank), wherever that
  // is now (link gets its position and its root, for the way it faces)
  for (const p of props) if (p.link && p.spec.to) { const q = props.find((o) => o.spec.id === p.spec.to); if (q) { q.root.updateMatrixWorld(true); p.link(q.root.getWorldPosition(new THREE.Vector3()), q.root); } }
  // a worn prop (spec.wear: an actor id) rides on that character's body: its x, y, z (and their tweens) are a point in
  // the body's frame, so it follows every step, lean, pitch and squash, and it turns with the body (rot, tip and tilt
  // on top) unless spec.wearTurn is false (a plume that keeps its own direction). props-pumpkin.js pumpkinhelm, soot
  const _wq = new THREE.Quaternion();
  for (const p of props) if (p.spec.wear) {
    const A = states[p.spec.wear]; if (!A) continue;
    const ch = A.a.ch; ch.root.updateMatrixWorld(true);
    const w = ch.bodyGroup.localToWorld(p.root.position.clone());
    p.root.position.copy(inFrame(p, w));
    if (p.spec.wearTurn !== false) p.root.quaternion.premultiply(ch.root.getWorldQuaternion(_wq));
  }
  // a breath runs from an actor's mouth (spec.mouth) to a point on a prop (spec.target, spec.at in its frame), wherever
  // the head is now (props-candle.js breath)
  for (const p of props) if (p.aim && p.spec.mouth) {
    const a = actors.find((o) => o.c.id === p.spec.mouth), F = a && a.ch.face, q = props.find((o) => o.spec.id === p.spec.target);
    if (!F || !F.place || !q) continue;
    a.ch.root.updateMatrixWorld(true); q.root.updateMatrixWorld(true);
    p.aim(F.group.localToWorld(F.place(0, F.layout.mouthV).pos.clone()), q.root.localToWorld(new THREE.Vector3(...(p.spec.at || [0, 0, 0]))));
  }
  const L = lightsAt(sb, t);
  for (const l of roomLights) l.o.intensity = l.base * L.room;
  if (lamp) lamp.o.intensity = lamp.base * L.lamp;
  if (bulb) bulb.o.material.color.copy(bulb.base).multiplyScalar(0.12 + 0.88 * Math.min(1, L.lamp));
  for (const m of charMats) m.envMapIntensity = 0.35 * Math.min(1, L.room);
  const cam = cameraState(sb, t);
  // a shot with "rig" is fixed to that rig: its pos and look are in the rig's frame, and its up turns with it
  const shot = (sb.shots || []).filter((q) => q.at <= t).sort((a, b) => a.at - b.at).at(-1), V = shot && shot.rig && rigs.get(shot.rig);
  const cp = new THREE.Vector3().fromArray(cam.pos), cl = new THREE.Vector3().fromArray(cam.look);
  if (V) { cp.applyMatrix4(V.g.matrixWorld); cl.applyMatrix4(V.g.matrixWorld); camera.up.set(0, 1, 0).transformDirection(V.g.matrixWorld); }
  else camera.up.set(0, 1, 0);
  // a shot with "track" follows that rig across the road (its x and z, not its turns): pos and look ride along with it
  const TR = shot && shot.track && rigs.get(shot.track);
  if (TR) { const p = rigState(TR.r, t).pos; cp.x += p[0]; cp.z += p[2]; cl.x += p[0]; cl.z += p[2]; }
  // a shot with "prop" is fixed to that prop (a phone held up to the lens): pos and look in the prop's own frame;
  // the holder's head is usually between, so such a shot sets `near` past it
  const PR = shot && shot.prop && props.find((p) => p.spec.id === shot.prop);
  if (PR) { PR.root.updateWorldMatrix(true, false); const M = PR.root.matrixWorld; cp.applyMatrix4(M); cl.applyMatrix4(M); camera.up.set(0, 1, 0).transformDirection(M); }
  // roll (a dutch tilt): up turned about the view direction, so the picture turns clockwise by cam.roll degrees
  if (cam.roll) camera.up.applyAxisAngle(cl.clone().sub(cp).normalize(), (cam.roll * Math.PI) / 180);
  // near: a shot can clip what is closer than that to the lens (a point of view from inside a head)
  camera.position.copy(cp); camera.fov = cam.fov; camera.near = shot?.near ?? 0.05; camera.updateProjectionMatrix(); camera.lookAt(cl);
  // the layout and contact checks project with the camera before anything is drawn: without this they used the
  // previous sample's camera (frame 0 of a clip, and the first frame after every cut, measured the wrong shot)
  camera.updateMatrixWorld(true);
  for (const o of camGates) o.visible = !!o.userData.camGate(camera.position);
  // hide: actors left out of a shot (whoever holds the phone in a shot from behind its screen)
  for (const a of actors) if (a.hidByShot || shot?.hide?.includes(a.c.id)) { a.hidByShot = !!shot?.hide?.includes(a.c.id); a.ch.root.visible = !a.hidByShot; }
}

function frame(t) {
  (sb.fx || []).forEach((f, i) => { if (f.do === "photo" && fxActive(f, t)) snapshot(f, i); });
  pose(t);
  // impact frame: characters as solid black silhouettes on white, like a manga panel (drawn in 3D, so it works on any set)
  if ((sb.fx || []).some((f) => f.do === "impact" && fxActive(f, t))) {
    const bg = scene.background, fog = scene.fog, glows = inkGlows();
    for (const o of setObjs) o.visible = false;
    for (const p of poofs) p.g.visible = false;
    scene.background = new THREE.Color("#ffffff"); scene.fog = null; scene.overrideMaterial = inkMat;
    R.render(scene, camera);
    scene.overrideMaterial = null; scene.background = bg; scene.fog = fog;
    for (const o of setObjs) o.visible = true;
    for (const o of glows) o.visible = true;
  } else {
    // a material drawn for the first time misses what prepare() sets on its compiled shader (the hat-brim band, the
    // lids' light), so a frame that compiled a new program is drawn again: the picture no longer depends on what the
    // page drew before (a shard's first frame, a photo taken first, a prop's first appearance)
    const progs = R.info.programs.length;
    const fp = sb.set && sb.set.focus ? cameraState(sb, t).focus : undefined;   // a shot's own focus point (depth of field)
    styler.prepare(scene, t, fp);
    styler.render(scene, camera);
    if (R.info.programs.length !== progs) { styler.prepare(scene, t, fp); styler.render(scene, camera); }
  }
  composite(t);
  return true;
}

// waits until the frame is really drawn: the 3D renderer only queues GPU work, so reading one pixel back is
// what makes the software GPU finish it (render.mjs uses this to time drawing and encoding separately)
function sync() { ctx.getImageData(0, 0, 1, 1); return true; }

// the composed frame as a data URL: "jpeg" for video frames, "png" for stills and the cover
function capture(fmt = "jpeg") { return fmt === "png" ? out.toDataURL("image/png") : out.toDataURL("image/jpeg", 0.95); }

// Motion blur (render.mjs decides how many samples a frame gets, from motion()).
// screen position (output px) of points on every visible part of the characters and props, as posed now: a grid over
// its box, finer along its length (a blade crossing a close-up has its ends off screen, some of its length on)
function corners() {
  camera.updateMatrixWorld(true);
  const pts = new Map(), v = new THREE.Vector3();
  for (const root of [...actors.map((a) => a.ch.root), ...props.map((p) => p.root)]) {
    root.updateMatrixWorld(true);
    root.traverseVisible((o) => {
      if (!o.isMesh || !o.geometry) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const b = o.geometry.boundingBox, xy = [], s = b.getSize(v), long = s.x >= s.y && s.x >= s.z ? 0 : s.y >= s.z ? 1 : 2;
      const k = [0, 1, 2].map((ax) => (ax === long ? 9 : 3)), lo = b.min.toArray(), hi = b.max.toArray(), q = [0, 0, 0];
      for (let i = 0; i < k[0] * k[1] * k[2]; i++) {
        q[0] = i % k[0]; q[1] = Math.floor(i / k[0]) % k[1]; q[2] = Math.floor(i / (k[0] * k[1]));
        v.set(...q.map((n, ax) => lo[ax] + ((hi[ax] - lo[ax]) * n) / (k[ax] - 1))).applyMatrix4(o.matrixWorld).project(camera);
        xy.push(v.z < 1 ? [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H] : null);
      }
      pts.set(o, xy);
    });
  }
  return pts;
}
// the corners of the last two frames drawn, in order. A render starts by priming it with the two frames before its
// first one, so a frame gets the same samples whether it is drawn alone, in a shard or in the whole clip.
let recent = [];
// QA passes that pose but draw nothing skip meshing the seamless glove skins (potato.js _skin), the slow part of a pose
const lean = (on) => { globalThis.__noSkin = on; };
// (posed with the glove skins, as a drawn frame is: without them a shard's first two frames measured slower motion,
// got a longer shutter and a visibly longer smear than the same frames in a whole render)
function prime(times) { recent = []; for (const t of times) { pose(t); recent.push(corners()); } return true; }
// how fast the picture moves at the frame just drawn (call it right after frame(t)), in px per frame: for each point
// its larger last step when the two last steps are alike (a blade speeding up), else the smaller one, so a jump that
// happens in one step (a teleport, a part appearing) counts as nothing; the fastest point on screen wins
let mbox = [Infinity, Infinity, -Infinity, -Infinity];
function movingBox() { const b = mbox.map((x, i) => Math.round(Math.min(i % 2 ? H : W, Math.max(0, x)))); return b[2] > b[0] && b[3] > b[1] ? b : null; }
function motion() {
  mbox = [Infinity, Infinity, -Infinity, -Infinity];
  const c = corners(), [p2, p1] = recent.length === 2 ? recent : [null, recent[0]];
  const on = (q) => q && q[0] > -W * 0.1 && q[0] < W * 1.1 && q[1] > -H * 0.1 && q[1] < H * 1.1, d = (x, y) => Math.hypot(x[0] - y[0], x[1] - y[1]);
  let m = 0;
  if (p1 && p2) for (const [o, q0] of c) {
    const q1 = p1.get(o), q2 = p2.get(o); if (!q1 || !q2) continue;
    for (let i = 0; i < q0.length; i++) if (q0[i] && q1[i] && q2[i] && (on(q0[i]) || on(q1[i]))) { const s1 = d(q0[i], q1[i]), s2 = d(q1[i], q2[i]), lo = Math.min(s1, s2), hi = Math.max(s1, s2), sp = hi <= 4 * lo + 2 ? hi : lo; m = Math.max(m, sp);
      // experiment (scissored blur samples): the screen box of every point that moved 4 px or more, with its smear
      if (sp >= 4) for (const q of [q0[i], q1[i]]) { mbox[0] = Math.min(mbox[0], q[0]); mbox[1] = Math.min(mbox[1], q[1]); mbox[2] = Math.max(mbox[2], q[0]); mbox[3] = Math.max(mbox[3], q[1]); } }
  }
  recent = [...recent, c].slice(-2);
  return Math.round(m * 10) / 10;
}
// the frame as the average of the frames drawn at each sample time (a film shutter open for that stretch); with
// keep, the frame on the canvas now (the one at the frame's own time) is one of the samples
// cost trace (render.mjs --cost): pose frame t as a render would (full skins unless lean) and return motion(), without
// drawing, so a render's blur samples per frame are known before any shard starts
// Frame cache sketch (render-measure-01, used only by render.mjs --hashes): a digest of everything the picture at t depends on that the
// timeline can change. Geometry that existed after init is identified by its place in the scene graph; geometry built
// later (glove skins, brows, mouths) is hashed by content. The 2D layer is keyed by the effects and captions
// active at t plus t itself. What init builds (cast, props, set, look) goes into the key outside, as a whole.
let initGeoms = null;
function fnv(h, x) { h ^= x; return Math.imul(h, 16777619) >>> 0; }
function hashFloats(h, arr, q = 1e5) { for (let i = 0; i < arr.length; i++) h = fnv(h, Math.round(arr[i] * q) | 0); return h; }
function stateHash(t, samples = []) {
  if (!initGeoms) { initGeoms = new WeakSet(); scene.traverse((o) => { if (o.geometry) initGeoms.add(o.geometry); }); }
  const one = (tt) => {
    pose(tt); scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
    let h = 2166136261, n = 0;
    h = hashFloats(h, camera.matrixWorld.elements); h = hashFloats(h, camera.projectionMatrix.elements, 1e4);
    scene.traverseVisible((o) => {
      h = fnv(h, n++); h = hashFloats(h, o.matrixWorld.elements);
      if (o.isLight) { h = hashFloats(h, [o.intensity, o.color.r, o.color.g, o.color.b]); }
      if (o.morphTargetInfluences) h = hashFloats(h, o.morphTargetInfluences);
      if (o.geometry && !initGeoms.has(o.geometry)) { const p = o.geometry.attributes.position; if (p) h = hashFloats(h, p.array, 1e4); h = fnv(h, o.geometry.index ? o.geometry.index.count : -1); }
      for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) {
        h = hashFloats(h, [m.opacity, m.visible ? 1 : 0, m.color ? m.color.r : 0, m.color ? m.color.g : 0, m.color ? m.color.b : 0, m.emissive ? m.emissive.r + m.emissive.g + m.emissive.b : 0, m.emissiveIntensity ?? 0]);
        if (m.uniforms) for (const k of Object.keys(m.uniforms).sort()) { const v = m.uniforms[k].value; if (typeof v === "number") h = hashFloats(h, [v]); else if (v && v.isColor) h = hashFloats(h, [v.r, v.g, v.b]); else if (v && (v.isVector2 || v.isVector3 || v.isVector4)) h = hashFloats(h, v.toArray()); }
      }
    });
    return h.toString(16).padStart(8, "0");
  };
  const fxOn = (sb.fx || []).map((f, i) => [i, f]).filter(([, f]) => t >= (f.at ?? 0) - 0.05 && t <= (f.at ?? 0) + (f.dur ?? 1.5) + 0.5);
  const caps = captionsAt(sb, t);
  const two = JSON.stringify([fxOn, caps, flashAt(sb, t), showSafe, fxOn.length || caps.length ? t : null]);
  let h2 = 2166136261; for (let i = 0; i < two.length; i++) h2 = fnv(h2, two.charCodeAt(i));
  // a photo shows the scene at its shot time: that state belongs to every frame the photo is on
  const shots = fxOn.filter(([, f]) => f.do === "photo").map(([, f]) => one(f.shot ?? f.at));
  return { scene: one(t), samples: samples.map(one), overlay: h2.toString(16).padStart(8, "0"), photos: shots };
}
globalThis.__noGeomCache = new URLSearchParams(location.search).has("nocache");   // experiment: rebuild brows and glove skins every frame
function trace(t, thin) { if (thin) lean(true); pose(t); if (thin) lean(false); return motion(); }
function blur(times, keep) {
  const n = times.length + (keep ? 1 : 0);
  let acc = null;
  const add = () => { const d = ctx.getImageData(0, 0, W, H).data; if (!acc) acc = new Uint16Array(d.length); for (let i = 0; i < d.length; i++) acc[i] += d[i]; };
  if (keep) add();
  globalThis.__skinRigid = true;   // seamless glove skins ride along with their hands (potato.js _skin)
  for (const t of times) { frame(t); add(); }
  globalThis.__skinRigid = false;
  const img = ctx.createImageData(W, H), o = img.data;   // a clamped array: assigning rounds to the nearest level
  for (let i = 0; i < o.length; i++) o[i] = acc[i] / n;
  ctx.putImageData(img, 0, 0);
  return true;
}

// screen-space layout for the QA checks (qa/check.mjs): caption boxes and each character's visible bounding box,
// in output pixels. Nothing is drawn, so sampling a whole clip takes seconds.
const r3 = (x) => Math.round(x * 1000) / 1000;
function layout(t) {
  lean(true); pose(t); lean(false);
  const actorsOut = actors.map((a) => {
    const box = new THREE.Box3(), tmp = new THREE.Box3();
    a.ch.root.updateMatrixWorld(true);
    a.ch.root.traverseVisible((o) => { if (o.isMesh && o.geometry) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); box.union(tmp); } });
    if (box.isEmpty()) return { id: a.c.id, box: null };
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(camera);
      const x = (p.x + 1) / 2 * W, y = (1 - p.y) / 2 * H;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    const hat = a.ch.costume && a.ch.costume.hat ? a.ch.costume.hat.getWorldPosition(new THREE.Vector3()).toArray().map(r3) : undefined;
    const hands = Object.fromEntries(["R", "L"].map((h) => [h, a.ch.arms[h].hand.getWorldPosition(new THREE.Vector3()).toArray().map(r3)]));
    // a glove's fingertip pinch point, for a hand in a pinch (a generator aims a held straw from it, via aimAt)
    const pinch = Object.fromEntries(["R", "L"].filter((h) => a.ch.arms[h].hand.userData.pinchW > 0).map((h) => [h, a.ch.arms[h].hand.userData.pinchPt.getWorldPosition(new THREE.Vector3()).toArray().map((v) => Math.round(v * 1e4) / 1e4)]));
    // a held costume prop's shaft in the world (the katana: a = the handle's foot, b = the blade tip), for aiming
    const L = a.ch.costume.propLine?.(), prop = L ? { a: a.ch.root.localToWorld(L.a.clone()).toArray().map(r3), b: a.ch.root.localToWorld(L.b.clone()).toArray().map(r3) } : undefined;
    // world anchors for framing (engine/direct.mjs is checked against them): the eyes' midpoint and the top of the
    // character (hat or crest included)
    const E = a.ch.face?.eyes, eyes = E && E.length > 1 ? E[0].root.getWorldPosition(new THREE.Vector3()).add(E[1].root.getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5).toArray().map(r3) : undefined;
    const ep = eyes && new THREE.Vector3().fromArray(eyes).project(camera), eyesPx = ep && [Math.round((ep.x + 1) / 2 * W), Math.round((1 - ep.y) / 2 * H)];
    // the middle of the mouth on the face's surface (aiming a spoon or anything that leaves the mouth)
    const F = a.ch.face, mouth = F && F.place ? F.group.localToWorld(F.place(0, F.layout.mouthV).pos.clone()).toArray().map(r3) : undefined;
    return { id: a.c.id, box: [Math.round(x0), Math.round(y0), Math.round(x1 - x0), Math.round(y1 - y0)], hat, hands, ...(Object.keys(pinch).length && { pinch }), prop, eyes, eyesPx, mouth, top: r3(box.max.y) };
  });
  // where each prop stands in the world (metres), for aiming throws and checking what is in frame
  // and where it lands on screen (px; null when behind the camera), so qa/hook.mjs can see whether the joke's prop is in frame 0
  const propsOut = props.map((p) => {
    const w = new THREE.Vector3(); p.root.getWorldPosition(w);
    const v = w.clone().project(camera), px = v.z < 1 ? [Math.round((v.x + 1) / 2 * W), Math.round((1 - v.y) / 2 * H)] : null;
    return { id: p.spec.id, at: p.root.position.toArray().map(r3), px, visible: p.root.visible };
  });
  const caps = captionsAt(sb, t).map((c) => ({ text: c.text, box: captionBox(c) }));
  // text pops are checked for the safe zone; they sit beside a character on purpose, so not for covering one
  const pops = (sb.fx || []).filter((f) => f.do === "pop" && t >= f.at && t <= f.at + (f.dur ?? 0.8)).map((f) => ({ text: f.text, box: popBox(f, popAnchor(f)), pop: true })).filter((p) => p.box);
  // slam words are over the action on purpose too: checked for the safe zone here, for the faces by qa/hook.mjs
  for (const f of sb.fx || []) if (f.do === "slam" && t >= f.at && t <= f.at + (f.dur ?? 1.4)) { const L = slamBox(f); if (L) pops.push({ text: f.text, box: L.box, size: L.size, pop: true, slam: true }); }
  // boxes are coarse (a raised staff makes the whole box tall), so also measure how much of each caption box the
  // characters actually cover, from a quarter-resolution silhouette render
  if (caps.length) {
    const px = silhouette(), q = 4, w = W / q, h = H / q;
    for (const c of caps) {
      const [x, y, bw, bh] = c.box.map((v) => Math.round(v / q));
      let hit = 0, n = 0;
      for (let yy = Math.max(0, y); yy < Math.min(h, y + bh); yy++)
        for (let xx = Math.max(0, x); xx < Math.min(w, x + bw); xx++) { n++; if (px[((h - 1 - yy) * w + xx) * 4] > 127) hit++; }
      c.covered = n ? Math.round((hit / n) * 1000) / 1000 : 0;
    }
  }
  return { t, captions: [...caps, ...pops], actors: actorsOut, props: propsOut, clips: clipping() };
}
// Characters passing through props or each other: each body is an ellipsoid (its mesh's own bounding box), and a
// prop part or another body counts as inside when its box reaches into that ellipsoid. depth 0 = touching,
// 1 = reaching the centre. Only visible meshes; a held prop is skipped for its holder only.
function clipping() {
  const out = [], inv = new THREE.Matrix4(), m = new THREE.Matrix4();
  const bodies = actors.map((a) => ({ id: a.c.id, a, mesh: a.ch.body })).filter((b) => b.mesh && b.a.ch.root.visible && b.mesh.visible && b.a.ch.potatoParts.visible);
  const depthIn = (body, mesh) => {
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    if (!body.mesh.geometry.boundingBox) body.mesh.geometry.computeBoundingBox();
    const eb = body.mesh.geometry.boundingBox, c = eb.getCenter(new THREE.Vector3()), h = eb.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    inv.copy(body.mesh.matrixWorld).invert(); m.multiplyMatrices(inv, mesh.matrixWorld);
    // the part's own box (oriented, not re-boxed in the body's space, which swells a tilted thin panel into a cube),
    // in the body's space scaled so the ellipsoid is the unit sphere: p(u) = A u + c0 for u in [-1, 1]^3. The point
    // nearest the centre, by coordinate descent (a convex quadratic in u), gives the depth
    const pb = mesh.geometry.boundingBox, pc = pb.getCenter(new THREE.Vector3()), pe = pb.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    const e = m.elements, A = [0, 1, 2].map((i) => { const k = [pe.x, pe.y, pe.z][i]; return [e[i * 4] * k / h.x, e[i * 4 + 1] * k / h.y, e[i * 4 + 2] * k / h.z]; });
    const w = pc.clone().applyMatrix4(m).sub(c), c0 = [w.x / h.x, w.y / h.y, w.z / h.z], u = [0, 0, 0];
    const r = c0.slice();
    for (let it = 0; it < 24; it++) for (let i = 0; i < 3; i++) {
      const a = A[i], aa = a[0] * a[0] + a[1] * a[1] + a[2] * a[2]; if (aa < 1e-12) continue;
      const ui = Math.max(-1, Math.min(1, u[i] - (a[0] * r[0] + a[1] * r[1] + a[2] * r[2]) / aa)), du = ui - u[i];
      if (du) { r[0] += a[0] * du; r[1] += a[1] * du; r[2] += a[2] * du; u[i] = ui; }
    }
    const d2 = r[0] * r[0] + r[1] * r[1] + r[2] * r[2];
    return d2 < 1 ? 1 - Math.sqrt(d2) : 0;
  };
  // body vs body: points on the other ellipsoid's surface, tested against this one (boxes would overlap too early)
  const DIRS = []; for (let i = 0; i < 42; i++) { const y = 1 - (2 * (i + 0.5)) / 42, r = Math.sqrt(1 - y * y), a = i * 2.39996; DIRS.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)); }
  // (also a hat or helmet part of another character: its box taken as an ellipsoid, so a round helmet or a flat brim
  // is not judged by its box corners)
  const bodyIn = (b, o, k = 1) => {
    const om = o.mesh || o; if (!om.geometry.boundingBox) om.geometry.computeBoundingBox();
    const eb = b.mesh.geometry.boundingBox, c = eb.getCenter(new THREE.Vector3()), h = eb.getSize(new THREE.Vector3()).multiplyScalar(0.5 * k);
    const ob = om.geometry.boundingBox, oc = ob.getCenter(new THREE.Vector3()), oh = ob.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    inv.copy(b.mesh.matrixWorld).invert(); m.multiplyMatrices(inv, om.matrixWorld);
    let best = 1e9;
    for (const d of DIRS) { const q = new THREE.Vector3(oc.x + d.x * oh.x, oc.y + d.y * oh.y, oc.z + d.z * oh.z).applyMatrix4(m).sub(c); best = Math.min(best, (q.x / h.x) ** 2 + (q.y / h.y) ** 2 + (q.z / h.z) ** 2); }
    return best < 1 ? 1 - Math.sqrt(best) : 0;
  };
  // a hat or helmet's own vertices (up to ~400) against a body ellipsoid: exact enough for a round helmet or a brim
  const vertsIn = (b, q) => {
    const eb = b.mesh.geometry.boundingBox, c = eb.getCenter(new THREE.Vector3()), h = eb.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    inv.copy(b.mesh.matrixWorld).invert(); m.multiplyMatrices(inv, q.matrixWorld);
    const pos = q.geometry.attributes.position, step = Math.max(1, Math.floor(pos.count / 400)), v = new THREE.Vector3();
    let best = 1e9;
    for (let i = 0; i < pos.count; i += step) { v.fromBufferAttribute(pos, i).applyMatrix4(m).sub(c); best = Math.min(best, (v.x / h.x) ** 2 + (v.y / h.y) ** 2 + (v.z / h.z) ** 2); }
    return { depth: best < 1 ? 1 - Math.sqrt(best) : 0, touch: best < 1.1 ** 2 };
  };
  for (const b of bodies) {
    b.a.ch.root.updateMatrixWorld(true);
    for (const p of props) {
      const st = poseStates[b.id] && poseStates[b.id].st;
      // a held prop sits in its holder's hand on purpose, but it must not go through anyone else; sitting on it is fine
      if ((p.held && p.holder === b.id) || !p.root.visible || (st && st.sit > 0 && st.seat === p.spec.id)) continue;
      let worst = 0;
      p.root.updateMatrixWorld(true);
      p.root.traverseVisible((o) => { if (o.isMesh && o.geometry && !(o.material && o.material.transparent)) worst = Math.max(worst, depthIn(b, o)); });
      if (worst > 0.05) out.push({ who: b.id, with: p.spec.id || p.spec.kind, depth: Math.round(worst * 100) / 100 });
    }
    // touch: within about 10% of the body's size of each other (a warning; going in is a failure)
    for (const o of bodies) if (o !== b && o.id > b.id) {
      const d = Math.max(bodyIn(b, o), bodyIn(o, b)), touch = d > 0 || bodyIn(b, o, 1.1) > 0 || bodyIn(o, b, 1.1) > 0;
      if (touch) out.push({ who: b.id, with: o.id, depth: Math.round(d * 100) / 100, touch: true });
    }
    // another character's hat or helmet against this body (a helmet glass is see-through, but touching still reads)
    for (const o of bodies) {
      if (o === b) continue;
      const parts = [o.a.ch.costume?.hat, o.a.ch.costume?.helmet?.mesh].filter((x) => x && x.visible);
      let worst = 0, touch = false;
      for (const part of parts) { part.updateMatrixWorld(true); part.traverseVisible((q) => { if (q.isMesh && q.geometry) { const v = vertsIn(b, q); worst = Math.max(worst, v.depth); touch = touch || v.touch; } }); }
      if (touch) out.push({ who: o.id, with: b.id, part: "hat", depth: Math.round(worst * 100) / 100, touch: true });
    }
  }
  return out;
}

let silRT, silMat;
function silhouette() {
  const w = W / 4, h = H / 4;
  if (!silRT) { silRT = new THREE.WebGLRenderTarget(w, h); silMat = new THREE.MeshBasicMaterial({ color: "#ffffff" }); }
  const bg = scene.background, fog = scene.fog;
  for (const o of setObjs) o.visible = false;
  // props marked scenery (a door, a gate) count as set, not as a character covering the caption
  const sceneryProps = props.filter((p) => p.spec.scenery && p.root.visible); for (const p of sceneryProps) p.root.visible = false;
  const pv = poofs.map((p) => p.g.visible); for (const p of poofs) p.g.visible = false;
  const cars = [...rigs.values()].filter((V) => V.car && V.car.root.visible); for (const V of cars) V.car.root.visible = false;
  // props are scenery (a tree's leaves behind the title are fine); only the characters count
  const prv = props.map((p) => p.root.visible); for (const p of props) p.root.visible = false;
  // glows and other see-through parts are effects, not the character's body; so is added light (golden light's sun
  // patches on the wall, opaque but additive)
  const glass = []; scene.traverseVisible((o) => { const m = o.material; if (m && !Array.isArray(m) && (m.transparent && m.opacity < 0.95 || m.blending === THREE.AdditiveBlending) || o.isSprite || o.isPoints) glass.push(o); });
  for (const o of glass) o.visible = false;
  scene.background = new THREE.Color("#000000"); scene.fog = null; scene.overrideMaterial = silMat;
  R.setRenderTarget(silRT); R.render(scene, camera);
  const px = new Uint8Array(w * h * 4); R.readRenderTargetPixels(silRT, 0, 0, w, h, px);
  R.setRenderTarget(null);
  scene.overrideMaterial = null; scene.background = bg; scene.fog = fog;
  for (const o of setObjs) o.visible = true;
  for (const p of sceneryProps) p.root.visible = true;
  poofs.forEach((p, i) => (p.g.visible = pv[i]));
  for (const V of cars) V.car.root.visible = true;
  props.forEach((p, i) => (p.root.visible = prv[i]));
  for (const o of glass) o.visible = true;
  return px;
}

// contact measures per actor at time t (potato.js contact()), for qa/check.mjs: no pixels drawn, so a whole clip at
// full frame rate takes seconds
let contactT = 0;   // the time contact() measures (inProps: a grab a moment away)
function contact(t) {
  contactT = t; lean(true); pose(t); lean(false);
  const r = (x) => Math.round(x * 10000) / 10000;
  return { t, actors: actors.filter((a) => a.ch.contact && a.ch.root.visible).map((a) => {
    const k = a.ch.contact(), staff = k.staff && Object.fromEntries(Object.entries(k.staff).map(([n, v]) => [n, typeof v === "number" ? r(v) : v]));
    return { id: a.c.id, staff, brim: { R: r(k.brim.R), L: r(k.brim.L) }, ...(k.helmet ? { helmet: { R: r(k.helmet.R), L: r(k.helmet.L) } } : {}), q: { R: k.qR.map(r), L: k.qL.map(r) } };
  }), ...reach() };
}

// hands and held props against characters (the look busy remake: a hand in another's hood, a sword in a helmet, a fist
// sunk into its own head, a hand over a face in a close-up; none of these was measured before):
// reach: a hand or a held prop's shaft within 1 cm of, or inside, another character's body or anything on it (hood,
//   hat, helmet, face), as metres of overlap (hand radius included; > 0 is going in); and a hand whose centre is
//   inside its own body (more than half the fist sunk in: a hand resting on the face or belly stays outside)
// sprout: a held prop's fist hidden behind another character while the prop shows
// covers: also a fist holding a prop over the top of a head on screen
// covers: a hand or held prop in front of a face, on screen over the eyes, while that face is in frame
function reach() {
  const out = { reach: [], covers: [] }, v = new THREE.Vector3(), inv = new THREE.Matrix4(), sc = new THREE.Vector3();
  const live = actors.filter((a) => a.ch.contact && a.ch.root.visible && a.ch.body && a.ch.potatoParts.visible);
  for (const a of live) a.ch.root.updateMatrixWorld(true);
  const shownIn = (o, top) => { for (; o && o !== top; o = o.parent) if (!o.visible) return false; return true; };
  // what can reach: each hand (a ball), and points along a held prop's shaft away from the fist
  const reachers = live.map((a) => {
    const pts = [];
    for (const s of ["R", "L"]) {
      const h = a.ch.arms[s].hand; if (!shownIn(h, a.ch.root)) continue;
      pts.push({ part: `hand${s}`, p: h.getWorldPosition(new THREE.Vector3()), r: 0.06 * h.getWorldScale(sc).x });
    }
    const L = a.ch.costume?.propLine?.();
    if (L) for (let i = 0; i <= 12; i++) {
      const q = L.a.clone().lerp(L.b, i / 12); if (q.distanceTo(L.grip) < 0.12) continue;
      pts.push({ part: "prop", p: q.applyMatrix4(a.ch.root.matrixWorld), r: L.r * a.ch.root.getWorldScale(sc).x });
    }
    return { a, pts };
  });
  // what can be reached: another character's body and the larger parts on it (hood, hat, helmet, eyes), each as the
  // ellipsoid of its own box; signed distance from a point, in metres (negative: inside)
  const parts = (a) => {
    const list = [], seen = new Set(), hat = a.ch.costume?.hat, helm = a.ch.costume?.helmet?.mesh;
    // the body group (body, face, hood) plus the hat and helmet, which ride on their own mount
    for (const top of [a.ch.bodyGroup, hat, helm]) if (top && shownIn(top, a.ch.root)) top.traverseVisible((o) => {
      if (seen.has(o)) return; seen.add(o);
      if (!o.isMesh || !o.geometry || o.isSprite || (o.material && o.material.transparent && o.material.opacity < 0.5 && o !== helm)) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const size = o.geometry.boundingBox.getSize(new THREE.Vector3()).multiply(o.getWorldScale(sc));
      if (Math.max(size.x, size.y, size.z) < 0.08) return;   // speckles, glints, small trims
      let name = o === a.ch.body ? "body" : "costume";
      for (let q = o; q; q = q.parent) { if (q === hat) name = "hat"; if (q === helm) name = "helmet"; }
      if (a.ch.face && a.ch.face.group && name === "costume") for (let q = o; q; q = q.parent) if (q === a.ch.face.group) name = "face";
      list.push({ o, name });
    });
    return list;
  };
  const dist = (o, p) => {
    const bb = o.geometry.boundingBox, c = bb.getCenter(new THREE.Vector3()), h = bb.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    inv.copy(o.matrixWorld).invert(); v.copy(p).applyMatrix4(inv).sub(c);
    const e = Math.sqrt((v.x / Math.max(h.x, 1e-4)) ** 2 + (v.y / Math.max(h.y, 1e-4)) ** 2 + (v.z / Math.max(h.z, 1e-4)) ** 2);
    // along the line from the centre: the surface is at 1/e of the way to the point (exact for a sphere, close enough
    // for the round parts here, and never small for a far point the way a flat part's thinnest axis would make it)
    o.getWorldScale(sc); return v.multiply(sc).length() * (1 - 1 / Math.max(e, 1e-6));
  };
  const rd = (x) => Math.round(x * 1000) / 1000;
  for (const { a, pts } of reachers) {
    for (const b of live) {
      if (b === a) {
        // own body: only a hand sunk in past its centre (3 cm, as the box ellipsoid is a little fuller than the potato)
        for (const q of pts) if (q.part !== "prop") { const d = dist(a.ch.body, q.p); if (d < -0.03) out.reach.push({ who: a.c.id, by: q.part, with: a.c.id, part: "own body", depth: rd(-d) }); }
        continue;
      }
      const best = new Map();
      for (const { o, name } of parts(b)) for (const q of pts) {
        const d = q.r - dist(o, q.p), k = `${q.part}|${name}`;
        if (d > -0.01 && d > (best.get(k)?.depth ?? -1)) best.set(k, { who: a.c.id, by: q.part, with: b.c.id, part: name, depth: rd(d) });
      }
      out.reach.push(...best.values());
    }
  }
  // a held prop sprouting from a body: its fist hidden behind a character (its own head, usually) while the prop's far
  // end shows, so on screen the blade grows out of the head (the look busy sword fist "on top of his head")
  const hidden = (b, p) => {
    const g = b.ch.body.geometry, bb = g.boundingBox || (g.computeBoundingBox(), g.boundingBox), c = bb.getCenter(new THREE.Vector3()), h = bb.getSize(new THREE.Vector3()).multiplyScalar(0.5 * 0.95);
    inv.copy(b.ch.body.matrixWorld).invert();
    const o = camera.position.clone().applyMatrix4(inv).sub(c).divide(h), d = p.clone().applyMatrix4(inv).sub(c).divide(h).sub(o);
    // the segment camera -> point against the unit sphere, short of the point itself
    const A = d.dot(d), B = 2 * o.dot(d), C = o.dot(o) - 1, D = B * B - 4 * A * C;
    if (D <= 0) return false;
    const t0 = (-B - Math.sqrt(D)) / (2 * A);
    return t0 > 0 && t0 < 0.97;
  };
  out.sprout = [];
  for (const a of live) {
    const L = a.ch.costume?.propLine?.(); if (!L) continue;
    const fist = L.grip.clone().applyMatrix4(a.ch.root.matrixWorld);
    const ends = [L.a, L.b].map((q) => q.clone().applyMatrix4(a.ch.root.matrixWorld));
    // another character only: a staff held on the far side of its own body, showing above and below it, reads as held
    for (const b of live) if (b !== a && hidden(b, fist) && ends.some((e) => !hidden(b, e) && e.distanceTo(fist) > 0.2)) out.sprout.push({ who: a.c.id, behind: b.c.id });
  }
  // faces in frame, and what is drawn in front of their eyes
  for (const b of live) {
    const eyes = b.ch.face?.eyes; if (!eyes || eyes.length < 2 || !shownIn(b.ch.face.group, b.ch.root)) continue;
    const e0 = eyes[0].root.getWorldPosition(new THREE.Vector3()), e1 = eyes[1].root.getWorldPosition(new THREE.Vector3());
    const mid = e0.clone().add(e1).multiplyScalar(0.5), dm = mid.distanceTo(camera.position), m = mid.clone().project(camera);
    if (Math.abs(m.x) > 1 || Math.abs(m.y) > 1 || m.z > 1) continue;
    const px = (q) => new THREE.Vector2((q.x + 1) / 2 * W, (1 - q.y) / 2 * H);
    const mp = px(m), faceR = px(e0.clone().project(camera)).distanceTo(px(e1.clone().project(camera))) / 2 + eyes[0].r * H / (2 * dm * Math.tan((camera.fov * Math.PI) / 360));
    for (const { a, pts } of reachers) {
      let worst = null;
      for (const q of pts) {
        const dq = q.p.distanceTo(camera.position); if (dq > dm - 0.05) continue;   // behind the face, or level with it
        const s = px(q.p.clone().project(camera)), rr = q.r * H / (2 * dq * Math.tan((camera.fov * Math.PI) / 360));
        const cover = (rr + faceR - s.distanceTo(mp)) / (2 * faceR);   // 1: the eyes fully behind it
        if (cover > 0.25 && (!worst || cover > worst.cover)) worst = { face: b.c.id, by: a.c.id, part: q.part, cover: Math.round(Math.min(1, cover) * 100) / 100, px: Math.round(faceR * 2) };
      }
      if (worst) out.covers.push(worst);
    }
    // a fist holding a prop over the top of a head on screen (in front or behind): it reads as stuck on the head, with
    // the blade or staff growing out of it. The head: the body's outline on screen (its box ellipsoid, projected)
    // above the eyes
    const g = b.ch.body.geometry, bb = g.boundingBox || (g.computeBoundingBox(), g.boundingBox), c = bb.getCenter(new THREE.Vector3()), h = bb.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (let i = 0; i < 64; i++) {
      const y = 1 - (2 * (i + 0.5)) / 64, rr = Math.sqrt(1 - y * y), an = i * 2.39996;
      const q = px(new THREE.Vector3(c.x + Math.cos(an) * rr * h.x, c.y + y * h.y, c.z + Math.sin(an) * rr * h.z).applyMatrix4(b.ch.body.matrixWorld).project(camera));
      x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y);
    }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, ex = (x1 - x0) / 2, ey = (y1 - y0) / 2;
    for (const a of live) {
      const L = a.ch.costume?.propLine?.(); if (!L) continue;
      const hnd = a.ch.arms[L.hand].hand, hp = hnd.getWorldPosition(new THREE.Vector3()), dq = hp.distanceTo(camera.position);
      const s = px(hp.clone().project(camera)), rr = 0.06 * hnd.getWorldScale(sc).x * H / (2 * dq * Math.tan((camera.fov * Math.PI) / 360));
      if (s.y < mp.y - faceR && ((s.x - cx) / (ex + rr)) ** 2 + ((s.y - cy) / (ey + rr)) ** 2 < 1) out.covers.push({ head: b.c.id, by: a.c.id, part: `hand${L.hand}`, prop: true });
    }
  }
  out.faces = hiddenFaces(live, shownIn);
  Object.assign(out, inProps(live, shownIn));
  return out;
}

// what touches the scene props (DUO launch day: a glove through a box lid; the morning notes of 29 Oct: a parcel
// through Reaper's forearm, Dragon's glove inside the bowl wall it pushed, the straw through the Wizard's glove; none
// of it was measured, as reach() only knows characters and the first version of this check took props as boxes and
// skipped what a hand holds):
// - every visible part of a hand (palm, wrist, fingers, thumb, the fist's knuckles), as balls along its own axis;
//   pad: a finger or the thumb
// - each arm's tube from the shoulder to the wrist, as balls along its centre line (the hand has its own parts)
// - costume parts (hat, brim, beard, raven, hood, wings, the costume's own staff or blade), by their corners
// against every mesh of every scene prop, the props someone holds included, measured on the prop's real surface: a
// closed mesh (a box, a phone, a parcel) is solid inside, an open one (a bowl's wall, a lathe shell, a plane) a thin
// skin. Per part and prop (only parts on screen, deeper than 5 mm), in metres: depth, how far it goes past the
// surface (a finger resting on it: about 0; through a thin wall: its whole radius); seenDepth, the same where it
// comes out on a side the camera sees; core, how far its centre line goes in there. held: a prop the character works
// with (see heldBy), which qa/check.mjs judges by what shows.
// thin: a thin held prop (a straw, a pencil) and how far it shows past the fist at its shorter end, on screen (show)
// and in space (out).
const PART = new WeakMap(), SOLID = new WeakMap();
// a geometry's triangles in its own frame, whether they close round a solid (every edge shared by two triangles once
// corners at the same place are merged; a sphere's poles drop out as empty triangles), and up to 160 of its corners
function solidOf(g) {
  if (SOLID.has(g)) return SOLID.get(g);
  const pos = g.attributes.position, idx = g.index, n = idx ? idx.count : pos.count, ids = new Map(), edges = new Map(), tri = [], pts = [];
  const vid = (i) => { const k = `${Math.round(pos.getX(i) * 1e5)},${Math.round(pos.getY(i) * 1e5)},${Math.round(pos.getZ(i) * 1e5)}`; let v = ids.get(k); if (v === undefined) { ids.set(k, (v = ids.size)); pts.push(i); } return v; };
  for (let i = 0; i + 2 < n; i += 3) {
    const c = [0, 1, 2].map((j) => (idx ? idx.getX(i + j) : i + j)), v = c.map(vid);
    if (v[0] === v[1] || v[1] === v[2] || v[0] === v[2]) continue;
    for (const j of c) tri.push(pos.getX(j), pos.getY(j), pos.getZ(j));
    for (const [p, q] of [[v[0], v[1]], [v[1], v[2]], [v[2], v[0]]]) { const k = p < q ? p * 4194304 + q : q * 4194304 + p; edges.set(k, (edges.get(k) || 0) + 1); }
  }
  let closed = edges.size > 0;
  for (const c of edges.values()) if (c !== 2) { closed = false; break; }
  const step = Math.max(1, Math.ceil(pts.length / 160)), corners = [];
  for (let i = 0; i < pts.length; i += step) corners.push(pos.getX(pts[i]), pos.getY(pts[i]), pos.getZ(pts[i]));
  if (!g.boundingBox) g.computeBoundingBox();
  const s = { tri: new Float32Array(tri), closed, corners, bb: g.boundingBox };
  SOLID.set(g, s); return s;
}
// squared distance from p to triangle i of T (Ericson, Real-Time Collision Detection 5.1.5); the nearest point goes in CP
const CP = [0, 0, 0];
function triDist2(px, py, pz, T, i) {
  const ax = T[i], ay = T[i + 1], az = T[i + 2], bx = T[i + 3], by = T[i + 4], bz = T[i + 5], cx = T[i + 6], cy = T[i + 7], cz = T[i + 8];
  const abx = bx - ax, aby = by - ay, abz = bz - az, acx = cx - ax, acy = cy - ay, acz = cz - az, apx = px - ax, apy = py - ay, apz = pz - az;
  const d1 = abx * apx + aby * apy + abz * apz, d2 = acx * apx + acy * apy + acz * apz;
  const q = (x, y, z) => { CP[0] = x; CP[1] = y; CP[2] = z; return (px - x) ** 2 + (py - y) ** 2 + (pz - z) ** 2; };
  if (d1 <= 0 && d2 <= 0) return q(ax, ay, az);
  const bpx = px - bx, bpy = py - by, bpz = pz - bz, d3 = abx * bpx + aby * bpy + abz * bpz, d4 = acx * bpx + acy * bpy + acz * bpz;
  if (d3 >= 0 && d4 <= d3) return q(bx, by, bz);
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return q(ax + abx * v, ay + aby * v, az + abz * v); }
  const cpx = px - cx, cpy = py - cy, cpz = pz - cz, d5 = abx * cpx + aby * cpy + abz * cpz, d6 = acx * cpx + acy * cpy + acz * cpz;
  if (d6 >= 0 && d5 <= d6) return q(cx, cy, cz);
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); return q(ax + acx * w, ay + acy * w, az + acz * w); }
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const w = (d4 - d3) / (d4 - d3 + (d5 - d6)); return q(bx + (cx - bx) * w, by + (cy - by) * w, bz + (cz - bz) * w); }
  const dn = 1 / (va + vb + vc), v = vb * dn, w = vc * dn;
  return q(ax + abx * v + acx * w, ay + aby * v + acy * w, az + abz * v + acz * w);
}
// p (in the mesh's own frame) inside a closed mesh: a ray crosses its surface an odd number of times (a slightly
// skewed ray, so it doesn't run along an edge)
function insideOf(S, px, py, pz) {
  const T = S.tri, dx = 0.9993, dy = 0.0291, dz = 0.0237;
  let n = 0;
  for (let i = 0; i < T.length; i += 9) {
    const e1x = T[i + 3] - T[i], e1y = T[i + 4] - T[i + 1], e1z = T[i + 5] - T[i + 2], e2x = T[i + 6] - T[i], e2y = T[i + 7] - T[i + 1], e2z = T[i + 8] - T[i + 2];
    const hx = dy * e2z - dz * e2y, hy = dz * e2x - dx * e2z, hz = dx * e2y - dy * e2x, a = e1x * hx + e1y * hy + e1z * hz;
    if (Math.abs(a) < 1e-12) continue;
    const f = 1 / a, sx = px - T[i], sy = py - T[i + 1], sz = pz - T[i + 2], u = f * (sx * hx + sy * hy + sz * hz);
    if (u < 0 || u > 1) continue;
    const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x, v = f * (dx * qx + dy * qy + dz * qz);
    if (v < 0 || u + v > 1) continue;
    if (f * (e2x * qx + e2y * qy + e2z * qz) > 0) n++;
  }
  return n % 2 === 1;
}
// the nearest point of solid m's surface to lp (in its own frame): its distance in metres, and the point (world) in c
function nearest(m, lp, c) {
  let d2 = Infinity; const T = m.S.tri;
  for (let i = 0; i < T.length; i += 9) { const e = triDist2(lp.x, lp.y, lp.z, T, i); if (e < d2) { d2 = e; c.set(CP[0], CP[1], CP[2]); } }
  c.applyMatrix4(m.o.matrixWorld);
  return Math.sqrt(d2) * m.k;
}
// a part of radius r (metres) centred at world point w against solid m, or null when it is clear of it:
//   depth: how far the part goes past the surface (a finger resting on it: about 0)
//   core: how far its centre line goes past the surface (a finger resting on it: minus its radius; half sunk: 0). A thin
//     skin has no inside, so there the centre line counts as past it once it is within half the radius of the skin
//   seen: the part comes out of the prop on a side facing the camera (a hand sunk into the back of a parcel it carries
//     is hidden behind the parcel; one sunk into its front, or through a bowl's wall, shows)
const NC = new THREE.Vector3(), OUT = new THREE.Vector3();
function pastSurface(m, w, r, lp) {
  lp.copy(w).applyMatrix4(m.inv);
  const bb = m.S.bb, dx = Math.max(bb.min.x - lp.x, lp.x - bb.max.x), dy = Math.max(bb.min.y - lp.y, lp.y - bb.max.y), dz = Math.max(bb.min.z - lp.z, lp.z - bb.max.z);
  const box = (Math.hypot(Math.max(dx, 0), Math.max(dy, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dy, dz), 0)) * m.k;
  if (box >= r) return null;   // the whole mesh is inside its box: clear of the box, clear of the mesh
  const d = nearest(m, lp, NC), inside = m.S.closed && box < 0 && insideOf(m.S, lp.x, lp.y, lp.z);
  if (!inside && d >= r) return null;
  // the way out of the prop at the nearest point: from the centre to the surface when inside, else away from it
  if (inside) OUT.copy(NC).sub(w); else OUT.copy(w).sub(NC);
  const seen = !m.S.closed || OUT.dot(camera.position.clone().sub(NC)) > 0;
  return { depth: inside ? r + d : r - d, core: inside ? d : m.S.closed ? -d : r / 2 - d, seen };
}
function inProps(live, shownIn) {
  const out = [], thin = [], sc = new THREE.Vector3(), a0 = new THREE.Vector3(), a1 = new THREE.Vector3(), q = new THREE.Vector3(), lp = new THREE.Vector3(), w = new THREE.Vector3();
  const solids = [];
  const scaleK = (o) => { o.getWorldScale(sc); return Math.cbrt(Math.abs(sc.x * sc.y * sc.z)); };
  for (const p of props) {
    if (!p.root.visible || !shownIn(p.root, scene)) continue;
    p.root.updateMatrixWorld(true);
    p.root.traverseVisible((o) => {
      if (!o.isMesh || !o.geometry || o.isSprite || !o.geometry.attributes.position) return;
      const mt = Array.isArray(o.material) ? o.material[0] : o.material;
      if (mt && mt.transparent && mt.opacity < 0.5) return;   // glass, glows, shadows
      const S = solidOf(o.geometry), wb = S.bb.clone().applyMatrix4(o.matrixWorld);
      solids.push({ p, id: p.spec.id, o, S, inv: o.matrixWorld.clone().invert(), k: scaleK(o), wb });
    });
  }
  if (!solids.length) return { inProps: out, thin };
  const frustum = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
  // a hand part's axis in its own frame (a capsule's two cap centres, a ball's centre) and its radius, unscaled
  const shape = (o) => {
    if (PART.has(o)) return PART.get(o);
    const g = o.geometry, P = g.parameters || {};
    // the glove's wrist (a tapered cylinder) as a capsule of its mean radius. A capsule's straight part is `height` in
    // three r16x+ (`length` before: reading only that left every finger and thumb unmeasured)
    const L = P.height ?? P.length;
    const s = g.type === "CapsuleGeometry" ? { a: [0, -L / 2, 0], b: [0, L / 2, 0], r: P.radius } : g.type === "SphereGeometry" ? { a: [0, 0, 0], b: [0, 0, 0], r: P.radius }
      : g.type === "CylinderGeometry" ? { a: [0, -P.height / 2, 0], b: [0, P.height / 2, 0], r: (P.radiusTop + P.radiusBottom) / 2 } : null;
    PART.set(o, s); return s;
  };
  // the props a hand works with: what this character holds in either hand (a grab: the other hand's thumb scrolls on
  // the phone the first holds), what this arm is aimed at (an arm pose on the prop: a push, a cup, a pinch), and, for a
  // paw resting on a surface (grip down), whatever it rests on
  const heldBy = (a, side) => {
    const s = new Set(poseStates[a.c.id]?.st.arms?.[side]?.on || []);
    // (or will hold, or just held, within a quarter second: the fingers close round it as the hand arrives, and open
    // as it lets go)
    const mine = (h) => h && h.who === a.c.id && ["R", "L", "both"].includes(h.hand);
    for (const p of props) if (mine(p.held && { who: p.holder, hand: p.holdHand }) || [-0.25, 0.25].some((d) => mine(propState(sb, p.spec, contactT + d).hold))) s.add(p.spec.id);
    s.rest = (poseStates[a.c.id]?.st.grip?.[side]?.down || 0) > 0.5;
    return s;
  };
  const works = (held, id) => (held.rest || held.has(id) ? { held: true } : {});
  const rd = (x) => Math.round(x * 1000) / 1000;
  // per part and prop, the deepest overall and the deepest centre line coming out on a side the camera sees
  // per part and prop: the deepest overall (depth), and on a side the camera sees, the deepest part (seenDepth) and
  // centre line (core)
  const keep = (best, key, x, row) => {
    if (!x || x.depth <= 0.005) return;
    const b = best.get(key) || { ...row, depth: 0, seenDepth: 0, core: -1 };
    b.depth = Math.max(b.depth, rd(x.depth));
    if (x.seen) { b.seenDepth = Math.max(b.seenDepth, rd(x.depth)); b.core = Math.max(b.core, rd(x.core)); }
    best.set(key, b);
  };
  // each hand part as balls along its axis, in the world: [{ c, r, pad }]. pad: a finger or the thumb (on their own
  // pivots), the parts that may press into what the hand holds; the palm and the wrist hang straight off the hand
  const handBalls = (h) => {
    const balls = [];
    h.traverseVisible((o) => {
      if (!o.isMesh) return; const s = shape(o); if (!s) return;
      o.getWorldScale(sc); const r = s.r * Math.min(Math.abs(sc.x), Math.abs(sc.y), Math.abs(sc.z));
      if (r < 0.004) return;   // the fist while it is still growing in (it starts at a thousandth of its size)
      a0.fromArray(s.a).applyMatrix4(o.matrixWorld); a1.fromArray(s.b).applyMatrix4(o.matrixWorld);
      for (let i = 0; i <= 4; i++) balls.push({ c: a0.clone().lerp(a1, i / 4), r, pad: o !== h && o.parent !== h });
    });
    return balls;
  };
  for (const a of live) {
    const best = new Map();
    for (const side of ["R", "L"]) {
      const h = a.ch.arms[side].hand, held = heldBy(a, side);
      // hands
      if (shownIn(h, a.ch.root)) {
        h.updateMatrixWorld(true);
        for (const b of handBalls(h)) {
          if (!frustum.containsPoint(b.c)) continue;   // off screen: the fingers below the frame's edge
          for (const m of solids) keep(best, `hand|${side}|${b.pad}|${m.id}`, pastSurface(m, b.c, b.r, lp), { who: a.c.id, part: "hand", hand: side, prop: m.id, ...(b.pad ? { pad: true } : {}), ...works(held, m.id) });
        }
      }
      // the arm: balls along its centre line, from where it leaves the body (a fifth of the way) to the wrist
      for (const b of a.ch.armBalls?.(side) || []) {
        if (!frustum.containsPoint(b.c)) continue;
        for (const m of solids) keep(best, `arm|${side}|${m.id}`, pastSurface(m, b.c, b.r, lp), { who: a.c.id, part: "arm", hand: side, prop: m.id, ...works(held, m.id) });
      }
    }
    // costume parts: their corners inside a solid prop, and the prop's corners inside a solid costume part
    const own = new Set(props.filter((p) => p.held && p.holder === a.c.id && (p.holdHand === "hat" || p.holdHand === "tip")).map((p) => p.spec.id));   // stuck to the hat on purpose
    const withProps = new Set([...heldBy(a, "R"), ...heldBy(a, "L")]);   // what either hand works with (a parcel hugged to the cloak)
    for (const c of a.ch.costumeMeshes?.() || []) {
      const S = solidOf(c.o.geometry), cb = S.bb.clone().applyMatrix4(c.o.matrixWorld), cinv = c.o.matrixWorld.clone().invert(), ck = scaleK(c.o);
      for (const m of solids) {
        if (own.has(m.id) || !cb.intersectsBox(m.wb)) continue;
        // a corner inside a solid: how deep, and whether it comes out on a side the camera sees
        let depth = 0, core = -1;
        const corner = (into, from, x, y, z) => {
          w.set(x, y, z).applyMatrix4(from.matrixWorld);
          if (!into.wb.containsPoint(w) || !frustum.containsPoint(w)) return;
          lp.copy(w).applyMatrix4(into.inv); if (!into.S.bb.containsPoint(lp) || !insideOf(into.S, lp.x, lp.y, lp.z)) return;
          const d = nearest(into, lp, NC); depth = Math.max(depth, d);
          if (NC.clone().sub(w).dot(camera.position.clone().sub(NC)) > 0) core = Math.max(core, d);
        };
        if (m.S.closed) for (let i = 0; i < S.corners.length; i += 3) corner(m, c.o, S.corners[i], S.corners[i + 1], S.corners[i + 2]);
        // the prop's corners inside the costume: not for a prop this character works with (a parcel hugged to the cloak)
        const mine = withProps.has(m.id);
        if (S.closed && !mine) { const into = { S, inv: cinv, k: ck, o: c.o, wb: cb }; for (let i = 0; i < m.S.corners.length; i += 3) corner(into, m.o, m.S.corners[i], m.S.corners[i + 1], m.S.corners[i + 2]); }
        keep(best, `costume|${c.name}|${m.id}`, depth > 0.005 ? { depth, core, seen: core > -1 } : null, { who: a.c.id, part: "costume", what: c.name, prop: m.id, ...(mine ? { held: true } : {}) });
      }
    }
    out.push(...best.values());
  }
  // thin held props (a straw, a pencil): the prop's long axis (its corners' main direction) and the stretch of it the
  // holding fist covers (the hand parts near that axis). show: how far the prop is seen past the fist at its shorter
  // end, on screen: its corners beyond the fist that no hand part covers from the camera (a straw end held low in the
  // big glove sits behind the fingers: 0, though it reaches past them). out: the same, ignoring what covers what
  const fovK = H / (2 * Math.tan((camera.fov * Math.PI) / 360)), px = (v) => { const c = v.clone().project(camera); return new THREE.Vector2(((c.x + 1) / 2) * W, ((1 - c.y) / 2) * H); };
  for (const p of props) {
    if (!p.held || !["R", "L", "both"].includes(p.holdHand) || !p.root.visible) continue;
    const a = live.find((x) => x.c.id === p.holder); if (!a) continue;
    const pts = [];
    for (const m of solids) if (m.p === p) for (let i = 0; i < m.S.corners.length; i += 3) pts.push(new THREE.Vector3(m.S.corners[i], m.S.corners[i + 1], m.S.corners[i + 2]).applyMatrix4(m.o.matrixWorld));
    if (pts.length < 8) continue;
    const ctr = pts.reduce((s, v) => s.add(v), new THREE.Vector3()).multiplyScalar(1 / pts.length);
    const C = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (const v of pts) { const d = [v.x - ctr.x, v.y - ctr.y, v.z - ctr.z]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i * 3 + j] += d[i] * d[j]; }
    let ax = new THREE.Vector3(1, 0.7, 0.4).normalize();
    for (let it = 0; it < 24; it++) ax = new THREE.Vector3(C[0] * ax.x + C[1] * ax.y + C[2] * ax.z, C[3] * ax.x + C[4] * ax.y + C[5] * ax.z, C[6] * ax.x + C[7] * ax.y + C[8] * ax.z).normalize();
    let lo = Infinity, hi = -Infinity; const across = [], along = pts.map((v) => v.clone().sub(ctr).dot(ax));
    pts.forEach((v, i) => { lo = Math.min(lo, along[i]); hi = Math.max(hi, along[i]); across.push(v.clone().sub(ctr).addScaledVector(ax, -along[i]).length()); });
    across.sort((x, y) => x - y);
    const wide = across[Math.floor(across.length * 0.9)];   // the thickness, a bend or a cap left out
    if (wide > 0.025 || hi - lo < 0.08 || hi - lo < 6 * wide) continue;
    let f0 = Infinity, f1 = -Infinity; const balls = [];
    for (const side of p.holdHand === "both" ? ["R", "L"] : [p.holdHand]) {
      const h = a.ch.arms[side].hand; if (!shownIn(h, a.ch.root)) continue;
      h.updateMatrixWorld(true); if (!frustum.containsPoint(h.getWorldPosition(q))) continue;
      for (const b of handBalls(h)) {
        balls.push({ ...b, s: px(b.c), d: b.c.distanceTo(camera.position) });
        const d = b.c.clone().sub(ctr), s = d.dot(ax);
        if (d.addScaledVector(ax, -s).length() > b.r + wide + 0.01) continue;   // a part away from the prop (the thumb up)
        f0 = Math.min(f0, s - b.r); f1 = Math.max(f1, s + b.r);
      }
    }
    if (f0 === Infinity) continue;
    const covered = (v) => { const sv = px(v), dv = v.distanceTo(camera.position); return balls.some((b) => b.d - b.r < dv && sv.distanceTo(b.s) < (b.r * fovK) / b.d); };
    let s0 = 0, s1 = 0;
    pts.forEach((v, i) => {
      if (along[i] < f0 && frustum.containsPoint(v) && !covered(v)) s0 = Math.max(s0, f0 - along[i]);
      if (along[i] > f1 && frustum.containsPoint(v) && !covered(v)) s1 = Math.max(s1, along[i] - f1);
    });
    thin.push({ who: a.c.id, hand: p.holdHand, prop: p.spec.id, show: rd(Math.min(s0, s1)), out: rd(Math.min(f0 - lo, hi - f1)), len: rd(hi - lo) });
  }
  return { inProps: out, thin };
}

// faces: how much of each face's eyes is hidden from the camera by anything other than hands and held props (they have
// the covers check above): another character's body, hat, wings or cape, the character's own hat brim or wings, or a
// prop. Rays from the camera to 9 points on each eye; a hit in front of the point hides it. The character's own body
// (an eye turned away round the head), a face turned away from the camera and the set don't count. Only faces at
// least 0.3 hidden are listed, with who hides them most (the largest share of hidden points).
const ray = new THREE.Raycaster();
function hiddenFaces(live, shownIn) {
  const out = [], limbs = new Set();
  scene.updateMatrixWorld(true);   // props and doors move in pose() after the last render: raycast where they are now
  for (const a of live) {
    for (const s of ["R", "L"]) for (const o of [a.ch.arms[s].mesh, a.ch.arms[s].hand, a.ch.legs[s].mesh, a.ch.legs[s].foot]) if (o) o.traverse((q) => limbs.add(q));
    if (a.ch.costume?.prop) a.ch.costume.prop.traverse((q) => limbs.add(q));
  }
  // what may hide a face: each character's visible solid meshes, and the props that are not scenery
  const solid = (o) => o.isMesh && !limbs.has(o) && !(o.material && !Array.isArray(o.material) && o.material.transparent && o.material.opacity < 0.6);
  const cands = [];
  for (const a of live) a.ch.root.traverseVisible((o) => { if (solid(o)) cands.push({ o, who: a.c.id, a }); });
  for (const p of props) if (p.root.visible && !p.spec.scenery) p.root.traverseVisible((o) => { if (solid(o)) cands.push({ o, who: p.spec.id }); });
  const objs = cands.map((c) => c.o), owner = new Map(cands.map((c) => [c.o, c]));
  for (const b of live) {
    const eyes = b.ch.face?.eyes; if (!eyes || eyes.length < 2 || !shownIn(b.ch.face.group, b.ch.root)) continue;
    const mid = eyes[0].root.getWorldPosition(new THREE.Vector3()).add(eyes[1].root.getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5).project(camera);
    if (Math.abs(mid.x) > 1 || Math.abs(mid.y) > 1 || mid.z > 1) continue;
    // a face turned away from the camera (a character seen from behind) can't be seen anyway
    const em = eyes[0].root.getWorldPosition(new THREE.Vector3()).add(eyes[1].root.getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5);
    const bc = b.ch.body.getWorldPosition(new THREE.Vector3()); bc.y = em.y;
    if (em.clone().sub(bc).normalize().dot(camera.position.clone().sub(em).normalize()) < 0.2) continue;
    const own = new Set(); b.ch.face.group.traverse((q) => own.add(q)); own.add(b.ch.body);
    let hidden = 0, n = 0; const by = new Map();
    for (const e of eyes) {
      const c = e.root.getWorldPosition(new THREE.Vector3()), r = e.r * e.root.getWorldScale(new THREE.Vector3()).x * 0.7;
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
      for (const [dx, dy] of [[0, 0], ...Array.from({ length: 8 }, (_, k) => [Math.cos(k * Math.PI / 4), Math.sin(k * Math.PI / 4)])]) {
        const p = c.clone().addScaledVector(right, dx * r).addScaledVector(up, dy * r), dir = p.clone().sub(camera.position), d = dir.length();
        ray.set(camera.position, dir.normalize()); ray.far = d - 0.02; n++;
        const hit = ray.intersectObjects(objs, false).find((h) => !own.has(h.object));
        if (hit) { hidden++; const w = owner.get(hit.object).who; by.set(w, (by.get(w) || 0) + 1); }
      }
    }
    if (hidden / n < 0.3) continue;
    // and how much of the body is hidden too (or out of frame): a face behind someone else's body is staging (the
    // character stands behind them), a face hidden on a body in plain view is a hat brim, a wing or a prop across it
    const g = b.ch.body.geometry, bb = g.boundingBox || (g.computeBoundingBox(), g.boundingBox), c0 = bb.getCenter(new THREE.Vector3()).applyMatrix4(b.ch.body.matrixWorld);
    const hs = bb.getSize(new THREE.Vector3()).multiply(b.ch.body.getWorldScale(new THREE.Vector3())).multiplyScalar(0.25), right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    let bh = 0, bn = 0;
    for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) {
      const p = c0.clone().addScaledVector(right, dx * hs.x).addScaledVector(up, dy * hs.y), dir = p.clone().sub(camera.position), d = dir.length();
      const q = p.clone().project(camera); bn++;
      if (Math.abs(q.x) > 1 || Math.abs(q.y) > 1) { bh++; continue; }   // out of frame counts as unseen
      ray.set(camera.position, dir.normalize()); ray.far = d;
      if (ray.intersectObjects(objs, false).some((h) => !own.has(h.object) && owner.get(h.object).a !== b)) bh++;
    }
    out.push({ face: b.c.id, hidden: Math.round((hidden / n) * 100) / 100, body: Math.round((bh / bn) * 100) / 100, by: [...by.entries()].sort((x, y) => y[1] - x[1])[0][0] });
  }
  return out;
}

// which character covers each pixel, for qa/readability.mjs (render.mjs --stills ... --ids): each visible character
// (with what it holds and wears) in its own flat grey level (its place in the cast + 1), the set and the loose props in
// black (0) so they still hide what is behind them. Half size, no anti-aliasing, no outlines; glows, sparkles and
// see-through scenery are left out. Returns the cast ids in order and a PNG.
let idRT, idCanvas;
const idMats = [];
function ids(t) {
  pose(t);
  const w = W / 2, h = H / 2;
  if (!idRT) { idRT = new THREE.WebGLRenderTarget(w, h); idCanvas = document.createElement("canvas"); idCanvas.width = w; idCanvas.height = h; }
  // the same faces as the real material (a one-sided wall seen from behind stays see-through)
  const flat = (k, side) => idMats[k * 3 + side] || (idMats[k * 3 + side] = new THREE.ShaderMaterial({ vertexShader: "void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }", fragmentShader: `void main() { gl_FragColor = vec4(vec3(${(k / 255).toFixed(6)}), 1.0); }`, side }));
  const owner = new Map();
  actors.forEach((a, i) => a.ch.root.traverse((o) => owner.set(o, i + 1)));
  const swapped = [], hidden = [];
  scene.traverseVisible((o) => {
    const m = o.material;
    const m0 = Array.isArray(m) ? m[0] : m;
    // effects, see-through parts (a helmet glass: the shape people see is the body inside it), and what never hides
    // anything (the sky, drawn without depth) are left out
    if (o.isSprite || o.isPoints || o.isLine || (m0 && ((m0.transparent && m0.opacity < 0.95) || m0.depthWrite === false || m0.colorWrite === false || m0.visible === false))) { hidden.push(o); return; }
    if (o.isMesh) { swapped.push([o, m]); o.material = flat(owner.get(o) || 0, m0?.side ?? THREE.FrontSide); }
  });
  for (const o of hidden) o.visible = false;
  const bg = scene.background, fog = scene.fog;
  scene.background = new THREE.Color("#000000"); scene.fog = null;
  R.setRenderTarget(idRT); R.render(scene, camera);
  const px = new Uint8Array(w * h * 4); R.readRenderTargetPixels(idRT, 0, 0, w, h, px);
  R.setRenderTarget(null);
  scene.background = bg; scene.fog = fog;
  for (const [o, m] of swapped) o.material = m;
  for (const o of hidden) o.visible = true;
  // the render target is bottom-up; the PNG is top-down like the frame
  const g = idCanvas.getContext("2d"), img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = px[((h - 1 - y) * w + x) * 4], j = (y * w + x) * 4; img.data[j] = img.data[j + 1] = img.data[j + 2] = v; img.data[j + 3] = 255; }
  g.putImageData(img, 0, 0);
  return { cast: actors.map((a) => a.c.id), png: idCanvas.toDataURL("image/png") };
}

// every call takes render time; a hit-stop (engine/shared/holds.js) shows story time frozen for its frames, so the
// picture holds while the video (and its sound) runs on. Without hit-stops the two clocks are the same.
const st = (t) => storyTime(sb && sb.holds, t), rt = (o, t) => (o && typeof o === "object" && "t" in o ? { ...o, t } : o);
window.ENGINE = {
  init, sync, capture, motion, movingBox,
  frame: (t) => frame(st(t)), layout: (t) => rt(layout(st(t)), t), contact: (t) => rt(contact(st(t)), t), ids: (t) => ids(st(t)),
  prime: (times) => prime(times.map(st)), blur: (times, keep) => blur(times.map(st), keep), trace: (t, thin) => trace(st(t), thin),
  stateHash: (t, samples = []) => stateHash(st(t), samples.map(st)),
};
window.ENGINE_READY = true;
