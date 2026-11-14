import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";
import { Character, setRig } from "./potato.js";
import { HumanCharacter, preloadHumans } from "./rigs/human.js";
import { VrmCharacter, preloadVrms } from "./rigs/vrm.js";
import { setFaceRig } from "./face.js";
import { buildSet, buildLights } from "./sets.js";
import { preloadModels } from "./assets-gltf.js";
import { actorState, cameraState, flashAt, flashColorAt, captionsAt, lightsAt, registerCast } from "./timeline.js";
import { radialTexture } from "./geo.js";
import { buildProp, propState, gripWorld, setPhysicsPose } from "./props3d.js";
import { rng, clamp, ease, setLoop } from "./util.js";
import { makeStyle, STYLE_PALETTES } from "./styles.js";
import { makeLook } from "./looks.js";
import { frameSize } from "../shared/frame.js";
import { bindText, captionBox, drawCaption, popBox, drawPop, slamBox, drawSlam, accentOf } from "./text.js";
import { drawHud, hudBoxes, hudKey } from "./hud.js";
import { drawCards, cardBoxes, cardKey } from "./card.js";
import { freezeAt, drawFrozen, drawFreezeLabel, freezeKey } from "./freeze.js";
import { addNight, nightGrade, nightOn } from "./sky.js";
import { skyAt } from "../shared/sky.js";
import { rigState, roadDistance, wheelTravel } from "./vehicle.js";
import { storyTime } from "../shared/holds.js";
import { pausesOf, pauseLookAt, keptProps, worldTime, actorTime } from "../shared/pause.js";
import { drawnSpec, onTwos } from "./drawn.js";
import { makeAnimeTiming } from "../shared/anime-timing.js";
import { buildRoadster } from "./car-roadster.js";
import { buildHatchback } from "./car-hatchback.js";
import { meshAll } from "./mesh-pool.js";
import { makeAttach } from "./attach.js";
import { makeVfx } from "./vfx.js";
import { buildCel } from "./fxcel.js";

let W = 1080, H = 1920;   // the output frame; "frame": "wide" in the storyboard makes it 1920 x 1080 (init)
let R, scene, camera, sb, actors = [], poofs = [], styler, setObjs = [], inkMat, poseStates = {}, props = [];
let attach2 = null;
let vfx = null, vfxOver = false;       // Effekseer particle effects (vfx.js): a storyboard with "do": "vfx" fx items
let phys = null;      // prop physics (physics.js, quality plan item 17): a storyboard with "physics" actions   // holds 2 (attach.js): "rig": { "hold": 2 }
let roomLights = [], lamp = null, bulb = null, charMats = [], camGates = [];   // what the "lights" effect dims (timeline.js lightsAt)
const photos = new Map();   // "photo" effects: the snapshot each one shows, taken once
let drawnD = null;   // the storyboard's drawn look (drawn.js drawnSpec), null when off
let animeT = null;   // storyboard "animeTiming" (shared/anime-timing.js): each character's drawing time at t, null when off
// the cuts anime timing restarts its drawings on: the shots' starts (as qa/rig.mjs cutIn), none with keyed camera moves
const animeCuts = (sb) => (Array.isArray(sb.camera) && sb.camera.length ? [] : (sb.shots || []).map((s) => s.at).filter((x) => x > 0));
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
    s.userData.inkVeil = true;   // the drawn look's lines stop where the puff is thick (drawn.js)
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
// the render time of the frame being drawn (a freeze frame's look runs on it while the story's clock stands still)
let tvNow = null;
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
    } else if (f.do === "zzz") {   // scale: bigger z's (z's over a far door stay readable)
      const zm = c.m * (f.scale ?? 1), x = c.x + (0.25 + lk * 0.35) * zm + Math.sin(lk * 5 + j) * 0.03 * zm, y = c.y - (0.15 + lk * 0.5) * zm;
      ctx.globalAlpha = fade; ctx.font = `900 ${Math.round((0.1 + 0.08 * lk) * zm)}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
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
function snapshot(f, i, key = i, extra = []) {
  if (photos.has(key)) return;
  const c = f.cam || {}, hideIds = [...(f.hide || []), ...extra], hidden = [];
  pose(f.shot ?? f.at);
  const pc = new THREE.PerspectiveCamera(c.fov ?? 40, W / H, 0.05, sb.far ?? 300);
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
  } else {
    // a look (looks.js) keeps the main camera it was made with for its passes (ink, depth): lend it the photo camera's
    // place for this one render, then put it back (13 Nov 2026: the snapshot showed the main view under "anime-pro")
    const keep = { p: camera.position.clone(), q: camera.quaternion.clone(), fov: camera.fov, near: camera.near, far: camera.far };
    camera.position.copy(pc.position); camera.quaternion.copy(pc.quaternion); camera.fov = pc.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
    const progs = R.info.programs.length; styler.prepare(scene); styler.render(scene, camera); if (R.info.programs.length !== progs) { styler.prepare(scene); styler.render(scene, camera); }
    camera.position.copy(keep.p); camera.quaternion.copy(keep.q); camera.fov = keep.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
  }
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
  photos.set(key, cv);
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
// style "screen" (There's a catch 09, 13 Nov 2026): an insert of a phone held up to us, filling the frame: the dark
// phone and a gallery screen showing the snapshot, no pop, a slow push of `push` (0.02). `fade: { hide: [ids], at, dur }`
// cross-fades to a second snapshot of the same shot with those ids hidden, from `at` (s after the effect starts) over
// `dur`: someone fading out of the photo. No letters: the screen's bars are plain shapes.
function screenCard(f, pic, picB, k, d) {
  const [cx, cy] = f.pos || [W / 2, H / 2], w = f.w ?? 900, h = Math.min(H - 40, w * 2.05), m = 26, pw = w - 2 * m, ph = pw * (pic.height / pic.width);
  const s = 1 + (f.push ?? 0.02) * clamp(k / d);
  ctx.save();
  ctx.fillStyle = f.bg ?? "#2a2230"; ctx.fillRect(0, 0, W, H);
  ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.fillStyle = "#17171e"; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 96); ctx.fill();
  ctx.lineWidth = 8; ctx.strokeStyle = "#4a4a55"; ctx.stroke();
  ctx.fillStyle = "#050507"; ctx.beginPath(); ctx.roundRect(-w / 2 + m, -h / 2 + m, pw, h - 2 * m, 70); ctx.fill();
  ctx.fillStyle = "#17171e"; ctx.beginPath(); ctx.roundRect(-70, -h / 2 + m + 18, 140, 34, 17); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.22)"; ctx.beginPath(); ctx.roundRect(-pw / 2 + 40, -h / 2 + m + 110, 46, 46, 23); ctx.fill();
  ctx.beginPath(); ctx.roundRect(-pw / 2 + 110, -h / 2 + m + 122, 220, 22, 11); ctx.fill();
  const py = -ph / 2 - 30;
  ctx.drawImage(pic, -pw / 2, py, pw, ph);
  if (picB && f.fade) {
    const a = clamp((k - (f.fade.at ?? 0)) / (f.fade.dur ?? 1)), e = a * a * (3 - 2 * a);
    if (e > 0) { ctx.globalAlpha = e; ctx.drawImage(picB, -pw / 2, py, pw, ph); ctx.globalAlpha = 1; }
  }
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.roundRect(-pw / 2 + 30 + j * ((pw - 60) / 4), py + ph + 60, (pw - 60) / 4 - 16, (pw - 60) / 4 - 16, 12); ctx.fill(); }
  ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.roundRect(-110, h / 2 - m - 40, 220, 12, 6); ctx.fill();
  ctx.restore();
}
function photoCard(f, i, t) {
  const d = f.dur ?? 1.5, k = t - f.at, pic = photos.get(i);
  if (k < 0 || k > d || !pic) return;
  if (f.style === "print") return printCard(f, pic, k, d);
  if (f.style === "screen") return screenCard(f, pic, photos.get(`${i}f`), k, d);
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

// "skin" action (timeline.js): the skin's materials (the body and the eyelids, after the look converted them, so found by
// their colour on the first use) take a mix of the base colour and st.skinColor. A function of the state only.
function skinTint(a, st) {
  if (!st.skinColor && !a._skinTint) return;
  if (!a._skinTint) a._skinTint = { base: new THREE.Color(a.ch.skin?.color?.getHex()), mats: new Set() };
  const T = a._skinTint, c = T.base.clone().lerp(new THREE.Color(st.skinColor || T.base), clamp(st.skin || 0));
  // the look swaps materials for its own copies (looks.js), so pick up every skin-coloured one each frame
  a.ch.root.traverse((o) => { if (o.isMesh) for (const m of [].concat(o.material)) if (m?.color && !T.mats.has(m) && m.color.equals(T.base)) T.mats.add(m); });
  if (a.ch.skin) T.mats.add(a.ch.skin);
  for (const m of T.mats) m.color.copy(c);
}

// Pause time's look (shared/pause.js): a flat mask of what keeps its colour (the keepers and what they carry in white,
// everything else drawn to depth only, so whatever stands in front of a keeper still hides them; "dark" keeps only the
// keepers' eyes), read back into an alpha mask; then the 2D composite drains the rest. Half size in a draft, like the
// 3D picture. The wave starts at the origin keeper's chest, projected with this frame's camera.
let pauseRT = null, pauseA = null, pauseTmp = null, pauseCol = null, pauseState = null;
const pauseMats = new Map();
function pauseMask(t, L) {
  const w = R.domElement.width, h = R.domElement.height;
  if (!pauseRT || pauseRT.width !== w || pauseRT.height !== h) {
    pauseRT = new THREE.WebGLRenderTarget(w, h);
    pauseA = document.createElement("canvas"); pauseA.width = w; pauseA.height = h;
  }
  const mat = (keep, side) => {
    const k = `${keep ? 1 : 0}|${side}`;
    if (!pauseMats.has(k)) pauseMats.set(k, new THREE.MeshBasicMaterial({ color: keep ? "#ffffff" : "#000000", colorWrite: !!keep, side }));
    return pauseMats.get(k);
  };
  const keepIds = L.w.keep, propIds = new Set(keptProps(L.w, t)), keep = new Set();
  for (const a of actors) if (keepIds.has(a.c.id) && a.ch.root.visible) {
    if (L.look === "dark") for (const e of a.ch.face?.eyes || []) e.root.traverse((o) => keep.add(o));
    else a.ch.root.traverse((o) => keep.add(o));
  }
  if (L.look !== "dark") for (const p of props) if (propIds.has(p.spec.id)) p.root.traverse((o) => keep.add(o));
  const swapped = [], hidden = [];
  scene.traverseVisible((o) => {
    const m = o.material, m0 = Array.isArray(m) ? m[0] : m;
    // effects and see-through parts never hide anything (as in ids())
    if (o.isSprite || o.isPoints || o.isLine || (m0 && ((m0.transparent && m0.opacity < 0.95) || m0.depthWrite === false || m0.colorWrite === false || m0.visible === false))) { if (!keep.has(o)) hidden.push(o); return; }
    if (o.isMesh) { swapped.push([o, m]); o.material = mat(keep.has(o), m0?.side ?? THREE.FrontSide); }
  });
  for (const o of hidden) o.visible = false;
  const bg = scene.background, fog = scene.fog;
  scene.background = new THREE.Color("#000000"); scene.fog = null;
  R.setRenderTarget(pauseRT); R.render(scene, camera);
  const px = new Uint8Array(w * h * 4); R.readRenderTargetPixels(pauseRT, 0, 0, w, h, px);
  R.setRenderTarget(null);
  scene.background = bg; scene.fog = fog;
  for (const [o, m] of swapped) o.material = m;
  for (const o of hidden) o.visible = true;
  // white -> opaque, black -> clear (the render target is bottom-up; the canvas is top-down)
  const g = pauseA.getContext("2d"), img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = px[((h - 1 - y) * w + x) * 4], j = (y * w + x) * 4; img.data[j] = img.data[j + 1] = img.data[j + 2] = 255; img.data[j + 3] = v; }
  g.putImageData(img, 0, 0);
  // the wave's centre: the origin keeper's chest on screen
  const o = actors.find((a) => a.c.id === L.origin);
  let cx = W / 2, cy = H * 0.55;
  if (o) { o.ch.root.updateMatrixWorld(true); const v = o.ch.root.localToWorld(new THREE.Vector3(0, 0.5 * (o.def.body?.height ?? 1) * (o.c.scale ?? 1), 0)).project(camera); cx = (v.x + 1) / 2 * W; cy = (1 - v.y) / 2 * H; }
  pauseState = { t, cx, cy };
}
function pauseGrade(t) {
  const L = pauseLookAt(sb, t);
  if (!L || !pauseState || pauseState.t !== t) return;
  if (!pauseCol) { for (const k of ["pauseCol", "pauseTmp"]) { const c = document.createElement("canvas"); c.width = W; c.height = H; if (k === "pauseCol") pauseCol = c; else pauseTmp = c; } }
  const G = L.w.grade, { cx, cy } = pauseState;
  const far = Math.max(...[[0, 0], [W, 0], [0, H], [W, H]].map(([x, y]) => Math.hypot(x - cx, y - cy))) + 40;
  const ease3 = (u) => 1 - Math.pow(1 - u, 3);
  const rIn = ease3(L.ring) * far, rOut = ease3(L.back) * far;
  if (rIn <= rOut + 0.5) return;
  const gc = pauseCol.getContext("2d"); gc.clearRect(0, 0, W, H); gc.drawImage(out, 0, 0);   // the frame in colour
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, rIn, 0, Math.PI * 2); if (rOut > 0) { ctx.moveTo(cx + rOut, cy); ctx.arc(cx, cy, rOut, 0, Math.PI * 2, true); } ctx.clip("evenodd");
  if (L.look === "dark") { ctx.fillStyle = G.color || "#000000"; ctx.fillRect(0, 0, W, H); }
  else {
    // grey: the colour drained (saturate), a little darker and flatter, then a cool wash over it
    ctx.filter = `saturate(${G.sat ?? 0.12}) brightness(${G.bright ?? 0.92}) contrast(${G.contrast ?? 0.92})`; ctx.drawImage(pauseCol, 0, 0); ctx.filter = "none";
    ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = G.wash ?? 0.55; ctx.fillStyle = G.tint || "#bccbe6"; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
  }
  // the keepers in colour on top (the mask scaled up from a draft's half size, its edge softened by a pixel)
  const tc = pauseTmp.getContext("2d"); tc.globalCompositeOperation = "source-over"; tc.clearRect(0, 0, W, H); tc.drawImage(pauseCol, 0, 0);
  tc.globalCompositeOperation = "destination-in"; tc.filter = "blur(0.6px)"; tc.drawImage(pauseA, 0, 0, W, H); tc.filter = "none"; tc.globalCompositeOperation = "source-over";
  ctx.drawImage(pauseTmp, 0, 0);
  ctx.restore();
  // the wave fronts: a pale ring going out, and one where the colour floods back
  const ring = (r, a) => { if (r <= 1 || r >= far || a <= 0) return; ctx.save(); ctx.strokeStyle = G.ring || "#e8f1ff"; for (const [lw, k] of [[34, 0.12], [14, 0.3], [5, 0.75]]) { ctx.globalAlpha = a * k; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); } ctx.restore(); };
  if (L.look !== "dark") { if (L.ring < 1) ring(rIn, 1 - L.ring * 0.6); if (L.back > 0) ring(rOut, 1 - L.back * 0.6); }
}

function composite(t) {
  // a freeze frame (freeze.js) draws the stopped picture pushed in and toned, on the video's clock
  const fz = freezeAt(sb, tvNow ?? t);
  ctx.globalAlpha = 1; if (!establishing(t)) { if (fz) drawFrozen(ctx, R.domElement, fz, fz.f.xy ? { x: fz.f.xy[0], y: fz.f.xy[1] } : fz.f.on ? popAnchor({ who: fz.f.on, dx: 0, dy: 0.25 }) : null); else ctx.drawImage(R.domElement, 0, 0, W, H); nightGrade(ctx, sb, t, W, H); }
  if (pausesOf(sb)) pauseGrade(t);
  (sb.fx || []).forEach((f, i) => { if (f.do === "shade") shadeFx(f, t); else if (f.do === "speedlines") speedLines(f, t, i); else if (f.do === "sparkle" || f.do === "notes" || f.do === "zzz" || f.do === "sweat" || f.do === "alert") headFx(f, t, i); else if (f.do === "photo") photoCard(f, i, t); else if (f.do === "glint") glintFx(f, t); else if (f.do === "pop") drawPop(f, t, popAnchor(f)); });
  const fl = flashAt(sb, t);
  if (fl > 0) { ctx.globalAlpha = fl; ctx.fillStyle = flashColorAt(sb, t); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  // "letterbox": { "top": 390, "bottom": 390 } (px): black film bars over the picture, under the captions (Then I'm a
  // Zombie Too: the trend's widescreen shot with its text on the upper bar)
  if (sb.letterbox) { ctx.fillStyle = sb.letterbox.color || "#000"; ctx.fillRect(0, 0, W, sb.letterbox.top ?? 0); ctx.fillRect(0, H - (sb.letterbox.bottom ?? 0), W, sb.letterbox.bottom ?? 0); }
  if (sb.hud) drawHud(ctx, sb, t);   // the series HUD (hud.js): under the captions, in the safe zone's corners
  for (const c of captionsAt(sb, t)) drawCaption(c, t);
  for (const f of sb.fx || []) if (f.do === "slam") drawSlam(f, t);   // slam words sit on top of everything
  drawCards(ctx, sb, t, accentOf);   // rule and vote cards (card.js) over the captions
  if (fz) drawFreezeLabel(ctx, fz, accentOf);
  if (showSafe) { ctx.save(); ctx.setLineDash([16, 10]); ctx.lineWidth = 4; ctx.strokeStyle = "rgba(255,0,180,.9)"; ctx.strokeRect(60, 210, 860, 1150); ctx.restore(); }
}

async function init(data) {
  sb = data.sb; ({ W, H } = frameSize(sb));
  if (W !== 1080) for (const id of ["stage", "gl", "out"]) { const e = document.getElementById(id); e.style.width = `${W}px`; e.style.height = `${H}px`; if (id !== "stage") { e.width = W; e.height = H; } }
  drawnD = drawnSpec(sb.drawn, sb.actions); animeT = makeAnimeTiming(sb.animeTiming, sb.actions, sb.fps || 30, animeCuts(sb)); charMats = []; photos.clear(); plateShots.clear();
  setRig(sb);    // the rig options (potato.js): "rig": { "hand": 2 } turns on the hand that can't flip (quality plan item 2)
  setFaceRig(sb);   // the eye rig options (face.js): "rig": { "eyes": 2 } (quality plan item 4)
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
  camera = new THREE.PerspectiveCamera(32, W / H, 0.05, sb.far ?? 300);   // "far": how far the cameras see (300 m; a real-scale landscape asks for more, docs/STORYBOARD.md "The frame")
  await preloadHumans(data.chars, sb); await preloadVrms(data.chars, sb);   // rigs/human.js: a person's body and the motion clips the cast performs
  await preloadModels(sb, data.chars);   // assets-gltf.js: glTF models the set and costumes name, loaded before anything is built
  buildLights(scene, sb.set);
  const before = scene.children.length;
  buildSet(scene, sb.set, STYLE_PALETTES[style] ? { sky: pal.sky, ground: pal.ground } : null, cameraState(sb, 0).pos, sb.duration);
  addNight(scene, sb, scene.children.slice(before));   // sky.js: the plate's night picture when the HUD clock reaches night
  setObjs = scene.children.slice(before); // the scenery, hidden during impact frames
  // the room's own lights (props and characters bring their own: candles, a glowing pickle, a blazing Phoenix)
  roomLights = []; scene.traverse((o) => { if (o.isLight && o.name !== "set-lamp") roomLights.push({ o, base: o.intensity }); });
  lamp = scene.getObjectByName("set-lamp"); lamp = lamp ? { o: lamp, base: lamp.intensity } : null;
  bulb = scene.getObjectByName("set-bulb"); bulb = bulb ? { o: bulb, base: bulb.material.color.clone() } : null;
  // vehicle rigs (vehicle.js): characters and props with "rig" ride in them
  rigs = new Map((sb.rigs || []).map((r) => {
    const g = new THREE.Group(); g.name = `rig-${r.id}`; g.rotation.order = "YXZ"; scene.add(g);
    const car = r.kind === "roadster" ? buildRoadster(r) : r.kind === "hatchback" ? buildHatchback(r) : null; if (car) g.add(car.root);
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
    const ch = def.rig === "human-v1" ? new HumanCharacter(def, c.id, c) : def.rig === "vrm-v1" ? new VrmCharacter(def, c.id, c) : new Character(def, c.id); parentOf(c).add(ch.root);
    // the actor's state at any time in the story (potato.js rig 2 smooths a hand's turn over the frames around it)
    ch.stateAt = (tt) => (tt < 0 || tt > (sb.storyDuration ?? sb.duration) ? null : actorState(sb, c, def, tt));
    if (c.belt) seatBelt(ch, c.belt);
    ch.root.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if (m.isMeshStandardMaterial) { m.envMap = envTex; m.envMapIntensity = 0.35; charMats.push(m); } });
    return { c, def, ch };
  });
  // the motion layer's contact solver ("motion": { "solve": true }, solve.js) keeps hands out of every other body too
  registerCast(sb, actors.map(({ c, def }) => ({ c, def })));
  // set pieces and props that belong to one side of a wall (set-elevator.js: the car's front wall and the hallway show
  // only while the camera is inside the car): userData.camGate(cameraPosition) says whether they show this frame
  camGates = []; scene.traverse((o) => { if (o.userData.camGate) camGates.push(o); });
  poofs = (sb.fx || []).map((f, i) => (f.do === "poof" ? buildPoof(f, i) : f.do === "slash" ? buildSlash(f) : f.do === "cel" ? buildCel(f, i, scene, sb.fps || 30) : null)).filter(Boolean);   // drawn effect cels (fxcel.js) ride with them too   // slashes ride with the poofs (hidden in the checks)
  // a look (looks.js) relights the scene, upgrades materials and adds post-processing; without one, the style draws
  // holds 2 (quality plan item 7): one attachment model for held props, drops that land, a support record per prop
  setPhysicsPose(null);
  attach2 = Number(sb.rig?.hold) >= 2 ? makeAttach({ sb, scene, props, states: () => poseStates, setMeshes: setObjs }) : null;
  // prop physics (quality plan item 17): "physics" actions bake rigid bodies for the whole clip, once, here
  // "physics": true (the template) also bakes every let-go (holds 2 gives the hand's pose and speed); the bake runs
  // with the cast posed at 0 (holders are posed at other moments the way holds 2 does it)
  if (sb.physics || (sb.actions || []).some((a) => a.do === "physics") || (sb.props || []).some((s) => s.body?.settle)) {
    poseStates = Object.fromEntries(actors.map((a) => { const st = actorState(sb, a.c, a.def, 0); a.ch.apply(st, 0); return [a.c.id, { st, a }]; }));
    if (attach2) attach2.begin(0);
    phys = await (await import("./physics.js")).makePhysics({ sb, scene, props, actors, setMeshes: setObjs, attach: attach2, releasePose: (p, time, tr) => attach2?.releasePose(p, time, tr), setPose: setPhysicsPose });
    if (!phys) setPhysicsPose(null);
  } else phys = null;
  vfx = opts.vfx === false ? null : await makeVfx({ R, sb, target: (id) => {
    const a = actors.find((x) => x.c.id === id), p = !a && props.find((x) => x.spec.id === id), o = a ? a.ch.root : p ? p.root : rigs.get(id)?.g;   // a character, a prop or a vehicle rig
    return o ? o.getWorldPosition(new THREE.Vector3()) : null;
  } });
  styler = opts.look ? makeLook(opts.look, { R, scene, camera, W, H, actors, setObjs, draft: !!opts.draft, setSpec: sb.set, props, focusTrack: sb.focusTrack, drawn: sb.drawn, vfx }) : makeStyle(style, R);
  vfxOver = !!vfx && !opts.look;
  out = document.getElementById("out"); ctx = out.getContext("2d"); bindText(ctx, sb);
  showSafe = !!(data.opts && data.opts.safe);
  await document.fonts.ready;
  await Promise.all([...document.fonts].map((f) => f.load().catch(() => null)));
  await Promise.all(globalThis.__loads || []);   // pictures the set loads (set-plate.js)
  const gl = R.getContext(), dbg = gl.getExtension("WEBGL_debug_renderer_info");
  return { ok: true, fonts: [...document.fonts].map((f) => `${f.family}:${f.status}`), gl: gl.getParameter(gl.VERSION), renderer: gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER) };
}

// places characters, effects and camera for time t without drawing anything
function pose(t0) {
  // the drawn look on 2s (drawn.js): everything holds each drawing for 2 frames, the camera too unless the storyboard
  // puts it on every frame (drawn.camera: 1); a camera that follows a moving rider on 1s makes the rider judder
  // "animeTiming" (shared/anime-timing.js): only the characters snap and hold; camera, set and effects on every frame
  const t = smearRaw || animeT ? t0 : onTwos(drawnD, t0), tc = smearRaw || animeT || (drawnD && drawnD.camera === 1) ? t0 : t;
  // pause time (shared/pause.js): the set's life, prop idles and particle effects run on the world clock, which stops
  // in every pause (equal to t in a clip without one)
  const tw = worldTime(sb, t);
  for (const f of globalThis.__setTicks || []) f(tw);   // set motion that runs on the clock (set-plate.js)
  if (vfx) vfx.time = tw;   // the particle effects drawn with this pose (vfx.js)
  // vehicle rigs first: everything riding in them is placed in their frame
  for (const V of rigs.values()) {
    const s = rigState(V.r, t), p = V.r.pivot || [0, 0.55, 0];
    V.g.rotation.set(s.pitch * D2R, s.yaw * D2R, s.roll * D2R); V.g.position.set(0, 0, 0); V.g.updateMatrix();
    const piv = new THREE.Vector3(...p).applyMatrix4(V.g.matrix);
    V.g.position.set(s.pos[0] + p[0] - piv.x, s.pos[1] + p[1] - piv.y, s.pos[2] + p[2] - piv.z); V.g.updateMatrixWorld(true);
    if (V.car) V.car.apply(s, t, roadDistance(sb.set, t), wheelTravel(V.r, sb.set, t));
  }
  const states = {};
  // (a frozen actor's idle, flames and wings run on its own clock: actorState moves its timeline, apply gets the time)
  for (const a of actors) { const ta = animeT && !smearRaw ? animeT(a.c.id, t) : t; const st = actorState(sb, a.c, a.def, ta); a.ch.apply(st, actorTime(sb, a.c.id, ta)); skinTint(a, st); states[a.c.id] = { st, a }; }
  for (const p of poofs) {
    if (p.f.do === "cel") continue;   // drawn effect cels: placed below, once the props are posed
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
    if (hand === "hat") { const o = A.a.ch.costume.hat || A.a.ch.costume.head; return o ? { obj: o } : null; }
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
  if (attach2) attach2.begin(t);
  for (const p of props) {
    const ps = propState(sb, p.spec, t);
    p.held = !!ps.hold; p.holder = ps.hold ? ps.hold.who : null; p.holdHand = ps.hold ? ps.hold.hand : null;
    p.ps = ps;
    // a body of the physics bake (from its start on): its baked pose, after its own state gave it its size and parts
    if (phys && phys.owns(p, t)) { p.held = false; p.apply(ps, tw); phys.place(p, t); continue; }
    // holds 2: attach.js places a held or let-go prop after its own state is applied (its size, parts and own turn)
    if (attach2 && (ps.hold || ps.left)) { p.apply(ps, tw); if (attach2.place(p, ps)) continue; }
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
    p.apply(ps, tw);
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
  const L = lightsAt(sb, tc);
  for (const l of roomLights) l.o.intensity = l.base * L.room;
  if (lamp) lamp.o.intensity = lamp.base * L.lamp;
  if (bulb) bulb.o.material.color.copy(bulb.base).multiplyScalar(0.12 + 0.88 * Math.min(1, L.lamp));
  for (const m of charMats) m.envMapIntensity = 0.35 * Math.min(1, L.room);
  // drawn effect cels (fxcel.js), once the props are posed: on a character ("who", where a poof would be), a prop or a
  // vehicle rig ("on"), or a point ("pos"); a bolt's "to" can name a character or prop too
  const celAt = (id) => {
    const A = states[id]; if (A) return worldOf(A.a, new THREE.Vector3(A.st.x, A.st.y, A.st.z + 0.15));
    const q = props.find((x) => x.spec.id === id), o = q ? q.root : rigs.get(id)?.g;
    if (!o) throw new Error(`fx cel: "${id}" is not a character, a prop or a vehicle rig`);
    o.updateWorldMatrix(true, false); return o.getWorldPosition(new THREE.Vector3());
  };
  for (const p of poofs) if (p.f.do === "cel") p.apply(t, p.f.on || p.f.who ? celAt(p.f.on || p.f.who) : new THREE.Vector3().fromArray(p.f.pos || [0, 0, 0]), celAt);
  const cam = cameraState(sb, tc);
  // a shot with "rig" is fixed to that rig: its pos and look are in the rig's frame, and its up turns with it
  const shot = (sb.shots || []).filter((q) => q.at <= tc).sort((a, b) => a.at - b.at).at(-1), V = shot && shot.rig && rigs.get(shot.rig);
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
  if (cam.hroll) camera.rotateZ((cam.hroll * Math.PI) / 180);   // a handheld shot's horizon tilt (timeline.js cameraState)
  // the layout and contact checks project with the camera before anything is drawn: without this they used the
  // previous sample's camera (frame 0 of a clip, and the first frame after every cut, measured the wrong shot)
  camera.updateMatrixWorld(true);
  for (const o of camGates) o.visible = !!o.userData.camGate(camera.position);
  // hide: actors left out of a shot (whoever holds the phone in a shot from behind its screen)
  for (const a of actors) if (a.hidByShot || shot?.hide?.includes(a.c.id)) { a.hidByShot = !!shot?.hide?.includes(a.c.id); a.ch.root.visible = !a.hidByShot; }
}

let drawnQ = null, smearRaw = false;   // smearRaw: pose() takes the time as given (the in-betweens of a smear drawing)   // the held drawing on the canvas (drawn look on 2s): a frame that shows the same drawing only redraws the captions
function frame(t) {
  (sb.fx || []).forEach((f, i) => { if (f.do === "photo" && fxActive(f, t)) { snapshot(f, i); if (f.fade) snapshot(f, i, `${i}f`, f.fade.hide || []); } });
  const q = drawnD && drawnD.twos > 1 && drawnD.camera !== 1 ? onTwos(drawnD, t) : null;
  if (q !== null && q === drawnQ) { composite(t); return true; }
  drawnQ = null;
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
    const pl = pausesOf(sb) && pauseLookAt(sb, t);   // pause time: which pixels keep their colour, before the styled render
    if (pl) pauseMask(t, pl);
    const progs = R.info.programs.length;
    const fp = sb.set && sb.set.focus ? cameraState(sb, t).focus : undefined;   // a shot's own focus point (depth of field)
    styler.prepare(scene, t, fp);
    styler.render(scene, camera);
    if (R.info.programs.length !== progs) { styler.prepare(scene, t, fp); styler.render(scene, camera); }
    if (vfxOver) vfx.drawOver(camera);   // a look draws them inside its composer
  }
  drawnQ = q;
  composite(t);
  return true;
}

// Glove skins meshed ahead on workers (mesh-pool.js, render-speed-02). A pose that only collects the shapes that need a
// new mesh (potato.js _skin, collect mode) runs first, the workers mesh them in parallel, and the real pose takes each
// finished mesh made for exactly its shape (anything else is meshed on the page as before, so the picture never
// depends on the workers). A video frame also starts the next frame's meshes as soon as its own drawing is queued, so
// the workers mesh while the CPU renderer draws; the scene is then posed back at t (its skins are already meshed, so
// that pose is quick) before anything else reads it. A frame that only redraws the captions (a held drawing) poses
// nothing, so nothing is collected for it.
const held = (t) => { const q = drawnD && drawnD.twos > 1 && drawnD.camera !== 1 ? onTwos(drawnD, t) : null; return q !== null && q === drawnQ; };
function collect(t) {
  const pre = { collect: true, jobs: [] };
  globalThis.__skinPre = pre;
  try { pose(t); } finally { globalThis.__skinPre = null; }
  return pre.jobs;
}
let ahead = null;   // { t, done }: the meshes started for the next frame
async function premesh(t, always = false) {
  if (!always && held(t)) return;
  const early = ahead && ahead.t === t ? await ahead.done : new Map(); ahead = null;
  const jobs = collect(t), ready = await meshAll(jobs.filter((j) => !early.has(j.key)));
  for (const [k, m] of early) ready.set(k, m);
  globalThis.__skinPre = { ready };
}
const meshed = async (t, always, then) => { await premesh(t, always); try { return then(); } finally { globalThis.__skinPre = null; } };
// ENGINE.frame: tv is the video time (the next frame's story time can jump at a hit-stop)
async function videoFrame(tv) {
  tvNow = tv;
  const t = st(tv), posed = !held(t), r = await meshed(t, false, () => frame(t));
  const tn = st(tv + 1 / (sb.fps || 30));
  if (posed && !held(tn)) { ahead = { t: tn, done: meshAll(collect(tn)) }; pose(t); }
  return r;
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
async function prime(times) { recent = []; for (const t of times) await meshed(t, true, () => { pose(t); recent.push(corners()); }); return true; }
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
// Frame cache key (render.mjs, engine/cache.mjs): a digest of everything the picture at t depends on that the timeline
// (actions, say lines, captions, effects) can change. render.mjs adds the frame's own time and everything else the
// storyboard holds (cast, set, camera, shots, look, focus track...) as a whole, so this only has to tell whether an edit
// to the timeline reached this frame. It covers: the camera; every visible object's matrix, visibility, shadow and
// draw order; morphs; lights; every geometry's attributes by content (memoised per attribute version, so a set built
// once is read once); instance matrices; materials (colours, opacity, flags, numeric uniforms) and their textures by
// content (canvases by their pixels, images by URL, data textures by their data, memoised per texture version, plus
// the uv transform); the background, fog and exposure; the drawn look's timing; and the 2D layer: captions on screen,
// flash level and every effect within a generous window of t. render.mjs spot-checks reused frames by drawing some again.
function fnv(h, x) { h ^= x; return Math.imul(h, 16777619) >>> 0; }
function hashFloats(h, arr, q = 1e5) { for (let i = 0; i < arr.length; i++) h = fnv(h, Math.round(arr[i] * q) | 0); return h; }
function hashStr(h, s) { for (let i = 0; i < s.length; i++) h = fnv(h, s.charCodeAt(i)); return h; }
const contentMemo = new WeakMap();
// a typed array's digest, recomputed only when its owner's version moved
function memo(owner, ver, f) { const m = contentMemo.get(owner); if (m && m.v === ver) return m.h; const h = f(); contentMemo.set(owner, { v: ver, h }); return h; }
function hashArray(h, a) { if (!a) return fnv(h, 0); if (a instanceof Float32Array || a instanceof Float64Array) return hashFloats(h, a, 1e4); for (let i = 0; i < a.length; i++) h = fnv(h, a[i] | 0); return h; }
function attrHash(at) { return at ? memo(at, at.version, () => hashArray(fnv(2166136261, at.itemSize), at.array)) : 0; }
function geomHash(g) {
  let h = fnv(2166136261, g.index ? attrHash(g.index) : 1);
  for (const k of Object.keys(g.attributes).sort()) { h = hashStr(h, k); h = fnv(h, attrHash(g.attributes[k])); }
  for (const k of Object.keys(g.morphAttributes || {}).sort()) for (const at of g.morphAttributes[k]) h = fnv(h, attrHash(at));
  return hashFloats(h, [g.drawRange.start, Math.min(g.drawRange.count, 1e9)], 1);
}
function texHash(tex) {
  if (!tex || !tex.isTexture) return 0;
  let h = hashFloats(2166136261, [tex.offset.x, tex.offset.y, tex.repeat.x, tex.repeat.y, tex.rotation, tex.center.x, tex.center.y, tex.flipY ? 1 : 0]);
  if (tex.isRenderTargetTexture || tex.isFramebufferTexture) return fnv(h, 7);   // drawn from the scene, which is hashed
  const img = tex.image;
  return fnv(h, memo(tex, tex.version, () => {
    let c = fnv(2166136261, img?.width | 0); c = fnv(c, img?.height | 0);
    if (!img) return c;
    if (img.data) return hashArray(c, img.data);   // data texture
    if (typeof HTMLImageElement !== "undefined" && img instanceof HTMLImageElement) return hashStr(c, (img.currentSrc || img.src || "").replace(/^https?:\/\/[^/]+/, ""));   // without the server's port
    if (img.getContext) { const g = img.getContext("2d"); if (g && img.width && img.height) return hashArray(c, new Uint32Array(g.getImageData(0, 0, img.width, img.height).data.buffer)); }
    if (Array.isArray(img)) { for (const x of img) c = x?.src ? hashStr(c, x.src) : fnv(c, x?.width | 0); return c; }   // cube faces
    return fnv(c, tex.version);   // an image the page cannot read back: keyed by how often it changed
  }));
}
function matHash(h, m) {
  h = hashFloats(h, [m.opacity, m.visible ? 1 : 0, m.transparent ? 1 : 0, m.side, m.blending, m.depthTest ? 1 : 0, m.depthWrite ? 1 : 0, m.colorWrite ? 1 : 0, m.alphaTest ?? 0, m.wireframe ? 1 : 0,
    m.color ? m.color.r : 0, m.color ? m.color.g : 0, m.color ? m.color.b : 0, m.emissive ? m.emissive.r + m.emissive.g + m.emissive.b : 0, m.emissiveIntensity ?? 0, m.roughness ?? 0, m.metalness ?? 0]);
  for (const k in m) { const v = m[k]; if (v && v.isTexture) { h = hashStr(h, k); h = fnv(h, texHash(v)); } }
  if (m.uniforms) for (const k of Object.keys(m.uniforms).sort()) {
    const v = m.uniforms[k].value;
    if (typeof v === "number" || typeof v === "boolean") h = hashFloats(h, [+v]);
    else if (v && v.isColor) h = hashFloats(h, [v.r, v.g, v.b]);
    else if (v && (v.isVector2 || v.isVector3 || v.isVector4 || v.isMatrix3 || v.isMatrix4 || v.isQuaternion)) h = hashFloats(h, v.toArray());
    else if (v && v.isTexture) h = fnv(h, texHash(v));
    else if (Array.isArray(v)) for (const x of v) h = typeof x === "number" ? hashFloats(h, [x]) : x?.toArray ? hashFloats(h, x.toArray()) : h;
  }
  return h;
}
function stateHash(t, samples = [], tv = null) {
  // posed lean (no glove skins: they are meshed from the hand parts, which are hashed (seamless glove parts stay
  // visible on a layer the camera skips), and meshing them is 97 % of a pose), so a key costs ~20 ms where a drawn pose
  // costs ~800. Hidden parts count only as hidden.
  const one = (tt) => {
    lean(true); pose(tt); lean(false); scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
    let h = 2166136261, n = 0;
    h = hashFloats(h, camera.matrixWorld.elements); h = hashFloats(h, camera.projectionMatrix.elements, 1e4);
    h = hashFloats(h, [R.toneMappingExposure]);
    const bg = scene.background; h = bg && bg.isColor ? hashFloats(h, [bg.r, bg.g, bg.b]) : fnv(h, texHash(bg));
    const fog = scene.fog; if (fog) h = hashFloats(h, [fog.color.r, fog.color.g, fog.color.b, fog.near ?? 0, fog.far ?? 0, fog.density ?? 0]);
    const walk = (o) => {
      h = fnv(h, n++); h = fnv(h, o.visible ? 1 : 0);
      if (!o.visible) return;   // a hidden part keeps whatever transform it last had: it draws nothing
      h = hashFloats(h, o.matrixWorld.elements);
      {
        h = fnv(h, (o.castShadow ? 1 : 0) + (o.receiveShadow ? 2 : 0) + ((o.renderOrder | 0) << 2));
        if (o.isLight) { h = hashFloats(h, [o.intensity, o.color.r, o.color.g, o.color.b, o.distance ?? 0, o.angle ?? 0, o.penumbra ?? 0, o.castShadow ? 1 : 0]); if (o.groundColor) h = hashFloats(h, [o.groundColor.r, o.groundColor.g, o.groundColor.b]); }
        if (o.morphTargetInfluences) h = hashFloats(h, o.morphTargetInfluences);
        if (o.geometry) h = fnv(h, memo(o.geometry, Object.values(o.geometry.attributes).reduce((v, a) => v + "," + a.version, String(o.geometry.index?.version ?? -1)), () => geomHash(o.geometry)));
        if (o.isInstancedMesh) { h = fnv(h, o.count); h = fnv(h, attrHash(o.instanceMatrix)); if (o.instanceColor) h = fnv(h, attrHash(o.instanceColor)); }
        for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) h = matHash(h, m);
      }
      for (const c of o.children) walk(c);
    };
    walk(scene);
    return h.toString(16).padStart(8, "0");
  };
  // the 2D layer: captions on screen and every effect near t (generous: a fade or a card that lingers stays covered),
  // the flash, the safe frame; the drawn look's timing (which drawing, on 2s or 1s) as a whole
  const fxOn = (sb.fx || []).map((f, i) => [i, f]).filter(([, f]) => f.do === "photo" || (t >= (f.at ?? 0) - 0.5 && t <= (f.at ?? 0) + (f.dur ?? 1.5) + 2));
  const two = JSON.stringify([fxOn, ...(vfx ? [vfx.key(t)] : []), captionsAt(sb, t), flashAt(sb, t), ...(flashAt(sb, t) > 0 && flashColorAt(sb, t) !== "#fff" ? [flashColorAt(sb, t)] : []), showSafe, drawnD || null, sb.set && sb.set.focus ? cameraState(sb, t).focus ?? null : null, ...(sb.hud ? [hudKey(sb, t)] : []), ...((sb.fx || []).some((f) => f.do === "rule" || f.do === "vote" || f.do === "picrule") ? [cardKey(sb, t)] : []), ...(tv != null && freezeAt(sb, tv) ? [freezeKey(freezeAt(sb, tv))] : []), ...(nightOn() && skyAt(sb, t) > 0 ? [Math.round(skyAt(sb, t) * 1e4) / 1e4] : [])]);
  const h2 = hashStr(2166136261, two);
  // a photo shows the scene at its shot time: that state belongs to every frame the photo is on
  const shots = fxOn.filter(([, f]) => f.do === "photo").map(([, f]) => one(f.shot ?? f.at));
  return { scene: one(t), samples: samples.map(one), overlay: h2.toString(16).padStart(8, "0"), photos: shots };
}
// a render that skips frames it already has (render.mjs frame cache) starts each stretch it draws like a shard: the
// drawn look's held drawing is forgotten, so the first frame draws its own
function reset() { drawnQ = null; return true; }
globalThis.__noGeomCache = new URLSearchParams(location.search).has("nocache");   // experiment: rebuild brows and glove skins every frame
function trace(t, thin) { if (thin) lean(true); pose(t); if (thin) lean(false); return motion(); }
// the drawn look's smear (drawn.smear): a drawing whose characters or props travel more than S.min px since the
// drawing before it gets a trail of fading in-betweens behind it, posed at the real times in between, so the trail
// follows the move's own arc. The drawing itself stays solid on top (its silhouette is the mask); only while the
// camera holds still (a moving camera would trail the whole set), never across a cut, impact frame or flash (S.walls,
// story time). The next frame of the same drawing redraws and smears again, so the held drawing stays the same.
function smear(t, S) {
  if (!drawnD || drawnD.twos <= 1) return false;
  const ones = drawnD.ones.some(([a, b]) => t >= a - 1e-6 && t < b), td = onTwos(drawnD, t), q = (ones ? 1 : drawnD.twos) / (sb.fps || 30);
  const t0 = Math.max(0, td - q * S.span);
  if (t0 >= td - 1e-6 || (S.walls || []).some((w) => w > t0 + 1e-6 && w <= td + 1e-6)) return false;
  if ((sb.fx || []).some((f) => (f.do === "impact" || f.do === "photo") && fxActive(f, t))) return false;
  smearRaw = true;
  try {
    pose(t0); camera.updateMatrixWorld(true); const cam0 = camera.matrixWorld.clone(), A = corners();
    pose(td); camera.updateMatrixWorld(true); const B = corners();
    let dc = 0; for (let i = 0; i < 16; i++) dc = Math.max(dc, Math.abs(camera.matrixWorld.elements[i] - cam0.elements[i]));
    if (dc > 1e-3) return false;
    let m = 0;
    for (const [o, pb] of B) { const pa = A.get(o); if (pa) for (let i = 0; i < pb.length; i++) if (pa[i] && pb[i]) m = Math.max(m, Math.hypot(pa[i][0] - pb[i][0], pa[i][1] - pb[i][1])); }
    if (m < S.min) return false;
    const cur = ctx.getImageData(0, 0, W, H).data;
    // the drawing's silhouette (characters and props, black on white), the same way an impact frame draws them
    const bg = scene.background, fog = scene.fog, glows = inkGlows(), shown = setObjs.filter((o) => o.visible), puffs = poofs.filter((p) => p.g.visible);
    for (const o of shown) o.visible = false;
    for (const p of puffs) p.g.visible = false;
    scene.background = new THREE.Color("#ffffff"); scene.fog = null; scene.overrideMaterial = inkMat;
    R.render(scene, camera);
    scene.overrideMaterial = null; scene.background = bg; scene.fog = fog;
    for (const o of shown) o.visible = true;
    for (const p of puffs) p.g.visible = true;
    for (const o of glows) o.visible = true;
    ctx.drawImage(R.domElement, 0, 0, W, H);
    const mask = ctx.getImageData(0, 0, W, H).data;
    // the in-betweens, oldest first, each a little stronger
    const acc = new Float32Array(cur.length); let wsum = 1;
    for (let i = 0; i < cur.length; i++) acc[i] = cur[i];
    for (let k = 0; k < S.n; k++) {
      const ts = t0 + ((td - t0) * k) / S.n, w = S.ghost * (k + 1) / S.n;
      pose(ts);
      const progs = R.info.programs.length;
      styler.prepare(scene, ts); styler.render(scene, camera);
      if (R.info.programs.length !== progs) { styler.prepare(scene, ts); styler.render(scene, camera); }
      composite(t);
      const g = ctx.getImageData(0, 0, W, H).data;
      for (let i = 0; i < g.length; i++) acc[i] += g[i] * w;
      wsum += w;
    }
    const img = ctx.createImageData(W, H), out = img.data;
    for (let i = 0; i < out.length; i += 4) {
      const a = 1 - mask[i] / 255;
      for (let c = 0; c < 3; c++) out[i + c] = a * cur[i + c] + (1 - a) * acc[i + c] / wsum;
      out[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    drawnQ = null;   // the canvas no longer holds this drawing: its next frame draws (and smears) it again
    return true;
  } finally { smearRaw = false; }
}
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
    return { id: a.c.id, box: [Math.round(x0), Math.round(y0), Math.round(x1 - x0), Math.round(y1 - y0)], hat, hands, ...(Object.keys(pinch).length && { pinch }), prop, eyes, eyesPx, mouth, ...(F?.shown && { pupils: F.shown }), top: r3(box.max.y) };
  });
  // where each prop stands in the world (metres), for aiming throws and checking what is in frame
  // and where it lands on screen (px; null when behind the camera), so qa/hook.mjs can see whether the joke's prop is in frame 0
  const propsOut = props.map((p) => {
    const w = new THREE.Vector3(); p.root.getWorldPosition(w);
    const v = w.clone().project(camera), px = v.z < 1 ? [Math.round((v.x + 1) / 2 * W), Math.round((1 - v.y) / 2 * H)] : null;
    // holds 2: is it held, riding, in flight, resting on something (within 1 cm), staged with a reason, or unsupported
    const support = (phys && phys.support(p, t)) || (attach2 && p.ps ? attach2.support(p, p.ps) : null);
    return { id: p.spec.id, at: p.root.position.toArray().map(r3), px, visible: p.root.visible, ...(support && { support }) };
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
  // rule and vote cards and the HUD are over the action on purpose: checked for the safe zone and, as captions, for
  // faces under them (qa/framing.mjs), never for characters covering them
  const cards = [...cardBoxes(ctx, sb, t), ...(sb.hud ? hudBoxes(ctx, sb, t) : [])];
  return { t, captions: [...caps, ...pops, ...cards], actors: actorsOut, props: propsOut, clips: clipping(), ...(phys && { physics: phys.info }) };
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
  // the exact surface of a mesh against a unit sphere: U maps the mesh's own space to the sphere's (an ellipsoid scaled to
  // the unit sphere stays exact, a triangle stays a triangle). Returns the depth of the triangle nearest the centre
  // (0 = touching, 1 = through the centre). A box says nothing for a mesh round a body (a tent's cloth, a car's shell:
  // the body is always "inside" its box), the cloth itself does (bear camp draft 1, 12 Nov 2026: the tent's roof
  // through three heads, waived by the "inside the tent" window).
  const U = new THREE.Matrix4(), vq = new THREE.Vector3();
  const surfIn = (o, M) => {
    const g = o.geometry, pos = g.attributes.position; if (!pos || o.isInstancedMesh) return 0;
    if (!g.boundingBox) g.computeBoundingBox();
    // cheap reject: the mesh's box (its 8 corners in the sphere's space, re-boxed) clear of the sphere
    const bb = g.boundingBox, lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    for (let k = 0; k < 8; k++) { vq.set(k & 1 ? bb.max.x : bb.min.x, k & 2 ? bb.max.y : bb.min.y, k & 4 ? bb.max.z : bb.min.z).applyMatrix4(M); const a = [vq.x, vq.y, vq.z]; for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], a[i]); hi[i] = Math.max(hi[i], a[i]); } }
    let dd = 0; for (let i = 0; i < 3; i++) { const v = lo[i] > 0 ? lo[i] : hi[i] < 0 ? -hi[i] : 0; dd += v * v; }
    if (dd >= 1) return 0;
    const n = pos.count, P = new Float32Array(n * 3), e = M.elements;
    for (let i = 0; i < n; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); P[i * 3] = e[0] * x + e[4] * y + e[8] * z + e[12]; P[i * 3 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; P[i * 3 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14]; }
    const ix = g.index ? g.index.array : null, nt = ix ? ix.length / 3 : n / 3;
    // a cloth cut by its texture's alpha (the tent's door, window and claw slits: alphaTest) has no cloth there
    const cut = alphaCut(o), uv = cut && g.attributes.uv;
    let best = 1;
    for (let t = 0; t < nt; t++) {
      const a = ix ? ix[t * 3] : t * 3, b = ix ? ix[t * 3 + 1] : t * 3 + 1, cc = ix ? ix[t * 3 + 2] : t * 3 + 2, ia = a * 3, ib = b * 3, ic = cc * 3;
      const d2 = triOrigin2(P[ia], P[ia + 1], P[ia + 2], P[ib], P[ib + 1], P[ib + 2], P[ic], P[ic + 1], P[ic + 2]);
      if (d2 < best && !(uv && cut((uv.getX(a) + uv.getX(b) + uv.getX(cc)) / 3, (uv.getY(a) + uv.getY(b) + uv.getY(cc)) / 3))) best = d2;
    }
    return best < 1 ? 1 - Math.sqrt(best) : 0;
  };
  // a body's ellipsoid as the unit sphere: world -> unit space
  const unitOf = (b) => {
    const eb = b.mesh.geometry.boundingBox, c = eb.getCenter(new THREE.Vector3()), h = eb.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    return new THREE.Matrix4().makeScale(1 / h.x, 1 / h.y, 1 / h.z).multiply(new THREE.Matrix4().makeTranslation(-c.x, -c.y, -c.z)).multiply(new THREE.Matrix4().copy(b.mesh.matrixWorld).invert());
  };
  for (const b of bodies) {
    b.a.ch.root.updateMatrixWorld(true);
    if (!b.mesh.geometry.boundingBox) b.mesh.geometry.computeBoundingBox();
    const W2U = unitOf(b);
    for (const p of props) {
      const st = poseStates[b.id] && poseStates[b.id].st;
      // a held prop sits in its holder's hand on purpose, but it must not go through anyone else; sitting on it is fine.
      // Into its own holder is measured apart ("self", 7 Nov 2026: the coffee cup in the eyes and under the hat
      // brim on a sip, 7 Nov 2026, was caught only by eye): how deep, and at which height of the body it goes in
      // (zone: the body's height from its feet, 0..1; a sip belongs at the mouth, about 0.3-0.5 of a potato)
      // Only what a hand holds: a pile of popcorn on a head or a kernel on a hood is held by "hat" / "tip" on purpose
      if (p.held && p.holder === b.id && p.root.visible && !(p.holdHand === "R" || p.holdHand === "L" || p.holdHand === "both")) continue;
      if (p.held && p.holder === b.id && p.root.visible) {
        let worst = 0, wo = null;
        p.root.updateMatrixWorld(true);
        p.root.traverseVisible((o) => { if (o.isMesh && o.geometry && !(o.material && o.material.transparent)) { const d = depthIn(b, o); if (d > worst) { worst = d; wo = o; } } });
        if (worst > 0.03 && wo) {
          // the height in the body's own frame, so a rider upside down in a loop (Never Looks Up 07) is still measured
          // feet to head: in world y a body on its side has no height, and the zone ran to +-500
          const eb = b.mesh.geometry.boundingBox, pc = new THREE.Box3().setFromObject(wo).getCenter(new THREE.Vector3());
          pc.applyMatrix4(inv.copy(b.mesh.matrixWorld).invert());
          out.push({ who: b.id, with: p.spec.id || p.spec.kind, depth: Math.round(worst * 100) / 100, self: true, zone: Math.round(((pc.y - eb.min.y) / Math.max(1e-6, eb.max.y - eb.min.y)) * 100) / 100 });
        }
        continue;
      }
      if ((p.held && p.holder === b.id) || !p.root.visible || (st && st.sit > 0 && st.seat === p.spec.id)) continue;
      let worst = 0, shell = 0;
      p.root.updateMatrixWorld(true);
      // (a mesh a prop marks see-through for the checks, userData.steam: a cloth mask on a face, a net, a glow, is not a body in a body)
      // Each part that reaches in is also measured by its own surface ("shell": a tent's cloth or a torn strip of it
      // through a head), which an "inside the tent" window does not waive: a box says nothing for a part round a body
      const seen = new Set(); let part = null;
      // A merged scenery mesh (a whole stone circle, a plain 580 m across: userData.surfaceOnly) has a box that holds every
      // body that stands in it, so its box says nothing either: it is judged by its surface alone (Stonehenge kit, 14 Nov 2026)
      p.root.traverseVisible((o) => {
        if (!(o.isMesh && o.geometry && !(o.material && o.material.transparent) && !o.userData.steam)) return;
        const d = depthIn(b, o); if (!o.userData.surfaceOnly) worst = Math.max(worst, d);
        if (d > 0.05 && !seen.has(o.geometry)) { seen.add(o.geometry); const sd = surfIn(o, U.multiplyMatrices(W2U, o.matrixWorld)); if (sd > shell) { shell = sd; part = o.name || null; } }
      });
      if (worst > 0.05) out.push({ who: b.id, with: p.spec.id || p.spec.kind, depth: Math.round(worst * 100) / 100 });
      if (shell > 0.05) out.push({ who: b.id, with: p.spec.id || p.spec.kind, depth: Math.round(shell * 100) / 100, shell: true, mesh: part });
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
  // a creature prop in another prop (bear camp draft 1, 12 Nov 2026: the bear's body inside the car). A creature's
  // trunk mesh lists its loft sections in userData.cores ({ c, w, up, dn } in the mesh's space, props-bear.js); each
  // section is a sphere inside the trunk, tested against the other prop's surface: only crossing it shows, a bear
  // wholly hidden in a box or a cloth draped over it is not a glitch of this kind. Record: who = the creature.
  for (const p of props) {
    if (!p.root.visible) continue;
    const trunks = []; p.root.traverseVisible((o) => { if (o.isMesh && Array.isArray(o.userData.cores)) trunks.push(o); });
    if (!trunks.length) continue;
    p.root.updateMatrixWorld(true);
    const spheres = [];
    for (const o of trunks) {
      const sc = new THREE.Vector3().setFromMatrixScale(o.matrixWorld), k = Math.min(sc.x, sc.y, sc.z);
      for (const s of o.userData.cores) { if (!s || !s.c) continue; const r = Math.min(s.w, s.up, s.dn) * k; if (r > 0.02) spheres.push({ c: new THREE.Vector3(...s.c).applyMatrix4(o.matrixWorld), r }); }
    }
    for (const q of props) {
      if (q === p || !q.root.visible || (q.held && q.holder === (p.spec.id || p.spec.kind))) continue;
      q.root.updateMatrixWorld(true);
      let worst = 0, part = null;
      q.root.traverseVisible((o) => {
        if (!(o.isMesh && o.geometry && !(o.material && o.material.transparent) && !o.userData.steam && !o.userData.cores)) return;
        for (const s of spheres) { const d = surfIn(o, U.makeScale(1 / s.r, 1 / s.r, 1 / s.r).multiply(m.makeTranslation(-s.c.x, -s.c.y, -s.c.z)).multiply(o.matrixWorld)); if (d > worst) { worst = d; part = o.name || null; } }
      });
      if (worst > 0.05) out.push({ who: p.spec.id || p.spec.kind, with: q.spec.id || q.spec.kind, depth: Math.round(worst * 100) / 100, creature: true, mesh: part });
    }
  }
  return out;
}
// a mesh's alpha cut (material alphaTest with a map's alpha or an alphaMap's green): (u, v) -> true where the texture
// leaves no surface, or null for a mesh without one. The texture is read once per version, at most 512 px wide
const alphaCache = new Map();
function alphaCut(o) {
  const m = Array.isArray(o.material) ? null : o.material, at = m && m.alphaTest;
  const tx = at > 0 && (m.alphaMap || m.map), img = tx && tx.image;
  if (!img || !(img.width > 0) || typeof document === "undefined") return null;
  const key = tx.uuid, hit = alphaCache.get(key);
  let A = hit && hit.v === tx.version ? hit : null;
  if (!A) {
    const w = Math.min(512, img.width), h = Math.max(1, Math.round((img.height * w) / img.width)), cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const g2 = cv.getContext("2d", { willReadFrequently: true });
    try { g2.drawImage(img, 0, 0, w, h); } catch { return null; }
    A = { v: tx.version, w, h, d: g2.getImageData(0, 0, w, h).data, ch: tx === m.alphaMap ? 1 : 3 };
    alphaCache.set(key, A);
  }
  tx.updateMatrix(); const e = tx.matrix.elements, op = m.opacity ?? 1;
  return (u, v) => {
    let x = e[0] * u + e[3] * v + e[6], y = e[1] * u + e[4] * v + e[7];
    x -= Math.floor(x); y -= Math.floor(y);
    const px = Math.min(A.w - 1, Math.floor(x * A.w)), py = Math.min(A.h - 1, Math.floor((tx.flipY ? 1 - y : y) * A.h));
    return (A.d[(py * A.w + px) * 4 + A.ch] / 255) * op < at;
  };
}
// the squared distance from the origin to the triangle abc (Ericson, Real-Time Collision Detection 5.1.5)
function triOrigin2(ax, ay, az, bx, by, bz, cx, cy, cz) {
  const abx = bx - ax, aby = by - ay, abz = bz - az, acx = cx - ax, acy = cy - ay, acz = cz - az;
  const d1 = -(abx * ax + aby * ay + abz * az), d2 = -(acx * ax + acy * ay + acz * az);
  const sq = (x, y, z) => x * x + y * y + z * z;
  if (d1 <= 0 && d2 <= 0) return sq(ax, ay, az);
  const d3 = -(abx * bx + aby * by + abz * bz), d4 = -(acx * bx + acy * by + acz * bz);
  if (d3 >= 0 && d4 <= d3) return sq(bx, by, bz);
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return sq(ax + abx * v, ay + aby * v, az + abz * v); }
  const d5 = -(abx * cx + aby * cy + abz * cz), d6 = -(acx * cx + acy * cy + acz * cz);
  if (d6 >= 0 && d5 <= d6) return sq(cx, cy, cz);
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); return sq(ax + acx * w, ay + acy * w, az + acz * w); }
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const w = (d4 - d3) / ((d4 - d3) + (d5 - d6)); return sq(bx + (cx - bx) * w, by + (cy - by) * w, bz + (cz - bz) * w); }
  const den = 1 / (va + vb + vc), v = vb * den, w = vc * den;
  return sq(ax + abx * v + acx * w, ay + aby * v + acy * w, az + abz * v + acz * w);
}

let silRT, silMat, silBlack;
// the characters as white on black, at quarter size, for the caption cover measure. Opaque props, the set and cars
// are drawn first in black: they never count as covering a caption themselves, but they hide whatever stands behind
// them (Look Busy, 4 Nov: the boss behind the desk "covered" 39 % of a caption drawn on the desk's front, though the
// desk hid him). Effects, glows and see-through parts are left out entirely
function silhouette() {
  const w = W / 4, h = H / 4;
  if (!silRT) { silRT = new THREE.WebGLRenderTarget(w, h); silMat = new THREE.MeshBasicMaterial({ color: "#ffffff" }); silBlack = new THREE.MeshBasicMaterial({ color: "#000000" }); }
  const bg = scene.background, fog = scene.fog, auto = R.autoClear;
  const pv = poofs.map((p) => p.g.visible); for (const p of poofs) p.g.visible = false;
  // glows and other see-through parts are effects, not the character's body; so is added light (golden light's sun
  // patches on the wall, opaque but additive)
  const glass = []; scene.traverseVisible((o) => { const m = o.material; if (m && !Array.isArray(m) && (m.transparent && m.opacity < 0.95 || m.blending === THREE.AdditiveBlending) || o.isSprite || o.isPoints) glass.push(o); });
  for (const o of glass) o.visible = false;
  scene.background = new THREE.Color("#000000"); scene.fog = null;
  // pass 1: everything but the characters, in black, writing depth
  const av = actors.map((a) => a.ch.root.visible); for (const a of actors) a.ch.root.visible = false;
  scene.overrideMaterial = silBlack;
  R.setRenderTarget(silRT); R.render(scene, camera);
  actors.forEach((a, i) => (a.ch.root.visible = av[i]));
  // pass 2: only the characters, in white, depth-tested against pass 1
  const setV = setObjs.map((o) => o.visible); for (const o of setObjs) o.visible = false;
  const prv = props.map((p) => p.root.visible); for (const p of props) p.root.visible = false;
  const cars = [...rigs.values()].filter((V) => V.car && V.car.root.visible); for (const V of cars) V.car.root.visible = false;
  scene.overrideMaterial = silMat; scene.background = null; R.autoClear = false;
  R.render(scene, camera);
  R.autoClear = auto;
  const px = new Uint8Array(w * h * 4); R.readRenderTargetPixels(silRT, 0, 0, w, h, px);
  R.setRenderTarget(null);
  scene.overrideMaterial = null; scene.background = bg; scene.fog = fog;
  setObjs.forEach((o, i) => (o.visible = setV[i]));
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
  const out = actors.filter((a) => a.ch.contact && a.ch.root.visible).map((a) => {
    const k = a.ch.contact(), staff = k.staff && Object.fromEntries(Object.entries(k.staff).map(([n, v]) => [n, typeof v === "number" ? r(v) : v]));
    return { id: a.c.id, staff, brim: { R: r(k.brim.R), L: r(k.brim.L) }, ...(k.helmet ? { helmet: { R: r(k.helmet.R), L: r(k.helmet.L) } } : {}), q: { R: k.qR.map(r), L: k.qL.map(r) }, ...(k.dbgR || k.dbgL ? { dbg: { R: k.dbgR, L: k.dbgL } } : {}), cross: { R: r(k.cross.R), L: r(k.cross.L) }, ...rigOf(a) };
  });
  try {
    const { gaps, ...near } = reach(), held = heldNow();
    for (const h of held) { const g = (gaps || []).find((x) => x.who === h.who && x.prop === h.prop); if (g) h.gap = g.gap; }
    return { t, actors: out, ...near, held, front: fronts() };
  } finally { bvhDone(); }   // the ray trees are for the contact rays only: every mesh gets three's raycast back
}

// the final world positions the rig drew (potato.js rig()): hands, arm middles, feet, in millimetres, for the rig
// motion check (qa/rig.mjs). qa/motion.mjs guesses hands from the storyboard alone; this is what is on screen
const mm = (v) => [Math.round(v.x * 1000), Math.round(v.y * 1000), Math.round(v.z * 1000)];
function rigOf(a) {
  if (!a.ch.rig) return {};
  a.ch.root.updateMatrixWorld(true);
  const w = {}, k = a.ch.rig(), body = a.ch.body;
  for (const [n, v] of Object.entries(k)) w[n] = mm(v.clone().applyMatrix4(a.ch.root.matrixWorld));
  let on = 0;
  if (body) {
    const c = body.getWorldPosition(new THREE.Vector3()); w.b = mm(c);
    const p = c.project(camera); on = Math.abs(p.x) < 1.15 && Math.abs(p.y) < 1.1 && p.z < 1 ? 1 : 0;   // the body's middle in frame
  }
  return { w, on };
}
// held props: where each one is in the world and in its holder's hand space (a prop slipping or popping in the hand)
function heldNow() {
  const out = [];
  for (const p of props) {
    if (!p.held || !p.root.visible) continue;
    const A = actors.find((a) => a.c.id === p.holder); if (!A) continue;
    p.root.updateMatrixWorld(true);
    const pos = p.root.getWorldPosition(new THREE.Vector3()), hs = p.holdHand === "both" ? ["R", "L"] : ["R", "L"].includes(p.holdHand) ? [p.holdHand] : [];
    const hand = hs.length ? hs.reduce((s, h) => s.add(A.ch.arms[h].hand.getWorldPosition(new THREE.Vector3())), new THREE.Vector3()).multiplyScalar(1 / hs.length) : null;
    // off: from the hand in the world (an upright hold keeps it); loc: in the hand's own turn (a pinch keeps it)
    const off = hand && pos.clone().sub(hand), loc = off && hs.length === 1 ? off.clone().applyQuaternion(A.ch.arms[hs[0]].hand.getWorldQuaternion(new THREE.Quaternion()).invert()) : null;
    out.push({ prop: p.spec.id || p.spec.kind, who: p.holder, hand: p.holdHand, pos: mm(pos), ...(off ? { off: mm(off) } : {}), ...(loc ? { loc: mm(loc) } : {}) });
  }
  return out;
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
    // the arm tubes between shoulder and wrist (the fixed Zombie Too hug, 4 Nov: Reaper's arm ran straight through
    // Phoenix's belly with the glove hidden inside, and only the glove was measured). Into other characters only
    for (const s of ["R", "L"]) {
      const A = a.ch.arms[s]; if (!A.elbow || !A.shoulder || !A.mesh?.visible || !shownIn(A.hand, a.ch.root)) continue;
      const curve = a.ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), rr = a.ch.limbW * a.ch.root.getWorldScale(sc).x;
      for (const u of [0.3, 0.42, 0.54, 0.66, 0.78]) pts.push({ part: `arm${s}`, p: curve.getPoint(u).applyMatrix4(a.ch.root.matrixWorld), r: rr, arm: true });
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
        for (const q of pts) if (q.part.startsWith("hand")) { const d = dist(a.ch.body, q.p); if (d < -0.03) out.reach.push({ who: a.c.id, by: q.part, with: a.c.id, part: "own body", depth: rd(-d) }); }
        // an arm through its own body: past the shoulder the tube's centre stays outside (Zombie Too, Jonny 4 Nov: Reaper's
        // arm came out of his chest, not his shoulder, to reach round Phoenix). Deepest point, per arm
        const own = new Map();
        for (const q of pts) if (q.arm) { const d = dist(a.ch.body, q.p); if (d < -0.05 && -d > (own.get(q.part) ?? 0)) own.set(q.part, -d); }
        for (const [part, d] of own) out.reach.push({ who: a.c.id, by: part, with: a.c.id, part: "own body", depth: rd(d) });
        continue;
      }
      const best = new Map();
      for (const { o, name } of parts(b)) for (const q of pts) {
        if (q.arm && name !== "body" && name !== "face") continue;   // a hood or hat is measured as its box: too coarse for an arm passing by
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
        if (q.arm) continue;
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
// Solid is a property, not a look (quality plan item 3 (c), 5 Nov 2026). Whether a part could be touched followed its
// opacity, so two clips made the phone's glow fainter to pass (71f192b, ffdce32). A part now says it: userData.solid
// true or false (on the mesh or its material); a glow (userData.glow), steam, flames and sparks (userData.steam),
// sprites, points, lines and added light (additive blending) are never solid. Returns true, false, or null for a part
// that says nothing, which keeps the old rule (see-through under half opacity is glass, a glow or a shadow) until its
// prop marks it. Glass (material userData.glass, set where it is made for the looks) is solid for hands.
function solidMark(o) {
  const m = Array.isArray(o.material) ? o.material[0] : o.material, v = o.userData.solid ?? m?.userData?.solid;
  if (v != null) return !!v;
  if (m?.userData?.glass) return true;   // glass (the jar, the water glass): see-through, but a hand can't pass through it
  if (o.isSprite || o.isPoints || o.isLine || o.userData.glow || o.userData.steam || m?.userData?.glow || m?.blending === THREE.AdditiveBlending) return false;
  return null;
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
      const mt = Array.isArray(o.material) ? o.material[0] : o.material, k = solidMark(o);
      if (k === false) return;                                              // glows, steam, flames, sparks, light: nothing to touch
      if (k == null && mt && mt.transparent && mt.opacity < 0.5) return;   // unmarked see-through: glass, glows, shadows (the old rule)
      const S = solidOf(o.geometry), wb = S.bb.clone().applyMatrix4(o.matrixWorld);
      solids.push({ p, id: p.spec.id, o, S, inv: o.matrixWorld.clone().invert(), k: scaleK(o), wb });
    });
  }
  if (!solids.length) return { inProps: out, thin, gaps: [] };
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
  // a held prop's gap to the glove (quality plan item 3 (d)): the nearest any part of the holding hand(s) comes to the
  // prop's surface, in metres (negative: sunk in). A held prop is rigid in the hand with no gap (CLAUDE.md grip rule 2);
  // qa/rig.mjs warns over 1 cm held 0.2 s
  const gaps = [];
  for (const p of props) {
    if (!p.held || !["R", "L", "both"].includes(p.holdHand) || !p.root.visible) continue;
    const a = live.find((x) => x.c.id === p.holder); if (!a) continue;
    const mine = solids.filter((m) => m.p === p); if (!mine.length) continue;
    let gap = Infinity;
    for (const side of p.holdHand === "both" ? ["R", "L"] : [p.holdHand]) {
      const h = a.ch.arms[side].hand; if (!shownIn(h, a.ch.root)) continue;
      h.updateMatrixWorld(true);
      for (const b of handBalls(h)) for (const m of mine) {
        lp.copy(b.c).applyMatrix4(m.inv);
        const bb = m.S.bb, dx = Math.max(bb.min.x - lp.x, lp.x - bb.max.x), dy = Math.max(bb.min.y - lp.y, lp.y - bb.max.y), dz = Math.max(bb.min.z - lp.z, lp.z - bb.max.z);
        const box = Math.hypot(Math.max(dx, 0), Math.max(dy, 0), Math.max(dz, 0)) * m.k;
        if (box - b.r >= gap) continue;   // no nearer than the best so far
        const d = nearest(m, lp, NC), inside = m.S.closed && dx < 0 && dy < 0 && dz < 0 && insideOf(m.S, lp.x, lp.y, lp.z);
        gap = Math.min(gap, inside ? -d - b.r : d - b.r);
      }
    }
    if (gap < Infinity) gaps.push({ who: a.c.id, prop: p.spec.id || p.spec.kind, gap: rd(gap) });
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
  limbsIn(out, solids, keep);
  return { inProps: out, thin, gaps };
}

// A prop's own limbs (a moth's wings and antennae: userData.limb on the mesh, its name) against every other prop and
// the set's own solids (walls, a window frame, furniture built into the set). A wing never cuts into a surface (Mott,
// Jonny 5 Nov 2026: the folded wings went into the pillow, the wall and the nightstand, and no check saw it). Each limb
// is sampled over its whole face (a post through the middle of a wing misses every corner), about every 2 cm. Rows go
// into inProps as part "limb" (qa/check.mjs limb-in-surface): who is the prop, prop what it went into.
const LIMB = new WeakMap();
function limbPoints(g) {
  if (LIMB.has(g)) return LIMB.get(g);
  const T = solidOf(g).tri, pts = [];
  for (let i = 0; i < T.length; i += 9) {
    const a = [T[i], T[i + 1], T[i + 2]], b = [T[i + 3], T[i + 4], T[i + 5]], c = [T[i + 6], T[i + 7], T[i + 8]];
    const e = Math.max(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), Math.hypot(b[0] - c[0], b[1] - c[1], b[2] - c[2]), Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]));
    const n = Math.min(40, Math.max(1, Math.ceil(e / 0.02)));
    for (let u = 0; u <= n; u++) for (let v = 0; u + v <= n; v++) { const w = n - u - v; for (let k = 0; k < 3; k++) pts.push((a[k] * u + b[k] * v + c[k] * w) / n); }
  }
  const out = new Float32Array(pts); LIMB.set(g, out); return out;
}
function limbsIn(out, solids, keep) {
  const rd = (x) => Math.round(x * 1000) / 1000;
  const limbs = [];
  for (const p of props) { if (p.root.visible) p.root.traverseVisible((o) => { if (o.isMesh && o.userData.limb) limbs.push({ p, o }); }); }
  if (!limbs.length) return;
  const others = solids.slice(), sc = new THREE.Vector3();
  for (const top of setObjs) {
    if (!top.visible) continue;
    top.updateMatrixWorld(true);
    top.traverseVisible((o) => {
      if (!o.isMesh || !o.geometry?.attributes?.position || o.isSprite || o.isInstancedMesh) return;
      const mt = Array.isArray(o.material) ? o.material[0] : o.material, k = solidMark(o);
      if (k === false || (k == null && mt && mt.transparent && mt.opacity < 0.5)) return;
      // a room seen from inside (its walls drawn on the back side) is a skin to stay off, not a solid to be outside of
      let S = solidOf(o.geometry); if (mt?.side === THREE.BackSide && S.closed) S = { ...S, closed: false };
      o.getWorldScale(sc);
      others.push({ p: null, id: `set:${o.name || o.geometry.type}`, o, S, inv: o.matrixWorld.clone().invert(), k: Math.cbrt(Math.abs(sc.x * sc.y * sc.z)), wb: S.bb.clone().applyMatrix4(o.matrixWorld) });
    });
  }
  const w = new THREE.Vector3(), lp = new THREE.Vector3(), best = new Map();
  for (const { p, o } of limbs) {
    o.updateMatrixWorld(true);
    const P = limbPoints(o.geometry), box = new THREE.Box3().setFromBufferAttribute(o.geometry.attributes.position).applyMatrix4(o.matrixWorld).expandByScalar(0.01);
    for (const m of others) {
      if (m.p === p || !box.intersectsBox(m.wb)) continue;
      const mb = m.wb.clone().expandByScalar(0.01);
      for (let i = 0; i < P.length; i += 3) {
        w.set(P[i], P[i + 1], P[i + 2]).applyMatrix4(o.matrixWorld);
        if (!mb.containsPoint(w)) continue;
        const key = `${p.spec.id}|${o.userData.limb}|${m.id}`, x = pastSurface(m, w, 0.002, lp), was = best.get(key)?.depth ?? 0;
        keep(best, key, x, { who: p.spec.id, part: "limb", what: o.userData.limb, prop: m.id });
        if (x && x.depth > was && best.has(key)) best.get(key).at = [rd(w.x), rd(w.y), rd(w.z)];   // the deepest point, world
      }
    }
  }
  for (const b of best.values()) out.push(b);
}

// faces: how much of each face's eyes is hidden from the camera by anything other than hands and held props (they have
// the covers check above): another character's body, hat, wings or cape, the character's own hat brim or wings, or a
// prop. Rays from the camera to 9 points on each eye; a hit in front of the point hides it. The character's own body
// (an eye turned away round the head), a face turned away from the camera and the set don't count. Only faces at
// least 0.3 hidden are listed, with who hides them most (the largest share of hidden points).
const ray = new THREE.Raycaster();
// The contact rays (hiddenFaces, fronts) search a bounding-volume tree per mesh (three-mesh-bvh) instead of testing
// every triangle: the same hits, and a layout 3.5 to 8 times faster (8 Nov 2026; the rays were 96 % of a layout pass).
// - a tree is rebuilt whenever the mesh's vertices, index, draw range or groups change (attribute versions), and it never
//   writes the geometry's own bounds (setBoundingBox: false), so nothing else in the page sees a difference
// - skinned and morphed meshes, and any mesh with a raycast of its own, keep three's raycast
// - every mesh gets its own raycast back at the end of contact()
// - three's raycast first culls by the geometry's bounding sphere and box; a mesh bent every frame that refreshes its
//   sphere but not its box (split the bill's receipt strip) was missed there, the tree sees it where it is drawn
// - ?nobvh on the page (CONTACT_BVH=0 for engine/render.mjs) measures the old way, for comparisons
const BVH = { on: !/[?&]nobvh/.test(location.search), built: 0, reused: 0, prepped: [] };
const bvhVer = (a) => (a ? `${a.isInterleavedBufferAttribute ? a.data.version : a.version}:${a.count}` : "-");
function bvhPrep(list) {
  if (!BVH.on) return;
  for (const o of list) {
    if (o.__bvhOn || !o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || o.isBatchedMesh || Object.hasOwn(o, "raycast") || o.morphTargetInfluences?.length) continue;
    const g = o.geometry, pos = g?.attributes?.position; if (!pos || g.morphAttributes?.position?.length) continue;
    const key = `${bvhVer(pos)}:${bvhVer(g.index)}:${g.drawRange.start}:${g.drawRange.count}:${g.groups.length}`;
    if (!g.boundsTree || g.__bvhKey !== key) { g.boundsTree = new MeshBVH(g, { indirect: true, setBoundingBox: false }); g.__bvhKey = key; BVH.built++; } else BVH.reused++;
    o.raycast = acceleratedRaycast; o.__bvhOn = true; BVH.prepped.push(o);
  }
}
function bvhDone() { for (const o of BVH.prepped) { delete o.raycast; delete o.__bvhOn; } BVH.prepped.length = 0; }
function hiddenFaces(live, shownIn) {
  const out = [], limbs = new Set();
  scene.updateMatrixWorld(true);   // props and doors move in pose() after the last render: raycast where they are now
  for (const a of live) {
    for (const s of ["R", "L"]) for (const o of [a.ch.arms[s].mesh, a.ch.arms[s].hand, a.ch.arms[s].skin, a.ch.arms[s].ink, a.ch.arms[s].tubeInk, a.ch.legs[s].mesh, a.ch.legs[s].foot]) if (o) o.traverse((q) => limbs.add(q));
    if (a.ch.costume?.prop) a.ch.costume.prop.traverse((q) => limbs.add(q));
  }
  // another character's arm, hand or glove in front of the eyes, ray by ray (the covers check samples glove balls and
  // misses an arm raised across a face: split the bill's first cut, Viking's pointing arm over the waiter's face). "hand" in the
  // output; qa/check.mjs reads it from "gate": 2
  const handObjs = [], handOf = new Map();
  for (const a of live) for (const s of ["R", "L"]) for (const o of [a.ch.arms[s].mesh, a.ch.arms[s].hand, a.ch.arms[s].skin, a.ch.arms[s].tubeInk]) if (o?.visible !== false) o?.traverse((q) => { if (q.isMesh) { handObjs.push(q); handOf.set(q, a.c.id); } });
  // what may hide a face: each character's visible solid meshes, every prop, and the set (quality plan item 13 (b), 5 Nov
  // 2026: scenery never counted, so a face behind a tree or a wall passed). Glows never hide; see-through parts (glass,
  // under 0.6 opacity) don't either, whatever their solid mark (a hand can't pass through glass, the eye can)
  const solid = (o) => o.isMesh && !limbs.has(o) && solidMark(o) !== false && !(o.material && !Array.isArray(o.material) && o.material.transparent && o.material.opacity < 0.6);
  const cands = [];
  for (const a of live) a.ch.root.traverseVisible((o) => { if (solid(o)) cands.push({ o, who: a.c.id, a }); });
  for (const p of props) if (p.root.visible) p.root.traverseVisible((o) => { if (solid(o)) cands.push({ o, who: p.spec.id, scenery: !!p.spec.scenery }); });
  for (const o of setOccluders()) cands.push({ o, who: "the set", scenery: true });
  const objs = cands.map((c) => c.o), owner = new Map(cands.map((c) => [c.o, c]));
  bvhPrep(objs); bvhPrep(handObjs);
  for (const b of live) {
    const eyes = b.ch.face?.eyes; if (!eyes || eyes.length < 2 || !shownIn(b.ch.face.group, b.ch.root)) continue;
    const mid = eyes[0].root.getWorldPosition(new THREE.Vector3()).add(eyes[1].root.getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5).project(camera);
    if (Math.abs(mid.x) > 1 || Math.abs(mid.y) > 1 || mid.z > 1) continue;
    // a face turned away from the camera (a character seen from behind) can't be seen anyway
    const em = eyes[0].root.getWorldPosition(new THREE.Vector3()).add(eyes[1].root.getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5);
    const bc = b.ch.body.getWorldPosition(new THREE.Vector3()); bc.y = em.y;
    if (em.clone().sub(bc).normalize().dot(camera.position.clone().sub(em).normalize()) < 0.2) continue;
    const own = new Set(); b.ch.face.group.traverse((q) => own.add(q)); own.add(b.ch.body); if (b.ch.head) b.ch.head.group.traverse((q) => own.add(q));   // the core build's own head
    let hidden = 0, scen = 0, n = 0, hand = 0; const by = new Map(), sby = new Map(), hby = new Map();
    for (const e of eyes) {
      const c = e.root.getWorldPosition(new THREE.Vector3()), r = e.r * e.root.getWorldScale(new THREE.Vector3()).x * 0.7;
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
      for (const [dx, dy] of [[0, 0], ...Array.from({ length: 8 }, (_, k) => [Math.cos(k * Math.PI / 4), Math.sin(k * Math.PI / 4)])]) {
        const p = c.clone().addScaledVector(right, dx * r).addScaledVector(up, dy * r), dir = p.clone().sub(camera.position), d = dir.length();
        ray.set(camera.position, dir.normalize()); ray.far = d - 0.02; n++;
        const hit = ray.intersectObjects(objs, false).find((h) => !own.has(h.object) && opaqueAt(h));
        if (hit) { const c = owner.get(hit.object), M = c.scenery ? sby : by; if (c.scenery) scen++; else hidden++; M.set(c.who, (M.get(c.who) || 0) + 1); }
        // only where nothing else hides the point: an arm in front of a body that hides the face is that body's staging
        const hh = !hit && ray.intersectObjects(handObjs, false).find((h) => handOf.get(h.object) !== b.c.id);
        if (hh) { hand++; const w = handOf.get(hh.object); hby.set(w, (hby.get(w) || 0) + 1); }
      }
    }
    // hidden: by characters and props, as before; scen: by scenery and the set too (counted from "gate": 2, qa/check.mjs)
    // the rest of the face (between the eyes, the nose, the mouth and the cheeks: 7 points): another character's arm or
    // glove across it (an arm raised through the middle of a face misses the eye points)
    let low = 0;
    {
      const e0 = eyes[0].root.getWorldPosition(new THREE.Vector3()), e1 = eyes[1].root.getWorldPosition(new THREE.Vector3()), ed = e0.distanceTo(e1), mid = e0.clone().add(e1).multiplyScalar(0.5);
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
      for (const [dx, dy] of [[0, 0], [0, -0.35], [0, -0.75], [-0.45, -0.65], [0.45, -0.65], [-0.6, -0.25], [0.6, -0.25]]) {
        const p = mid.clone().addScaledVector(right, dx * ed).addScaledVector(up, dy * ed), dir = p.clone().sub(camera.position), d = dir.length();
        ray.set(camera.position, dir.normalize()); ray.far = d - 0.02;
        const hh = !ray.intersectObjects(objs, false).some((h) => !own.has(h.object) && opaqueAt(h)) && ray.intersectObjects(handObjs, false).find((h) => handOf.get(h.object) !== b.c.id);
        if (hh) { low++; const w = handOf.get(hh.object); hby.set(w, (hby.get(w) || 0) + 1); }
      }
      low = Math.round((low / 7) * 100) / 100;
    }
    const hd = hand || low ? { hand: Math.round((hand / n) * 100) / 100, ...(low ? { low } : {}), hby: [...hby.entries()].sort((x, y) => y[1] - x[1])[0][0] } : {};
    if ((hidden + scen) / n < 0.3) { if (hand / n >= 0.2 || low >= 0.28) out.push({ face: b.c.id, hidden: Math.round((hidden / n) * 100) / 100, ...hd }); continue; }
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
      if (ray.intersectObjects(objs, false).some((h) => !own.has(h.object) && owner.get(h.object).a !== b && !owner.get(h.object).scenery)) bh++;
    }
    const top = (M) => (M.size ? [...M.entries()].sort((x, y) => y[1] - x[1])[0][0] : undefined);
    out.push({ face: b.c.id, hidden: Math.round((hidden / n) * 100) / 100, body: Math.round((bh / bn) * 100) / 100, by: top(by) ?? top(sby), ...(scen ? { scen: Math.round((scen / n) * 100) / 100, sby: top(sby) } : {}), ...hd });
  }
  return out;
}

// the set's parts that can stand between the camera and a character: opaque meshes that rise above the floor (a
// wall, a tree, a counter). Cut-outs (alpha-tested painted layers, leaves) are left out, as a ray can't see their holes;
// so are the floor, rugs and anything lower than 15 cm. Cached per set object (the set doesn't change shape)
const OCC = new WeakMap();
// is a ray hit on something the eye can't see through? A painted card (the env layers: a quad whose texture's alpha
// cuts the rock or the tree out) hides only where its paint is: the alpha is read from the texture at the hit (a copy of
// the image at up to 256 px, kept per image)
const ALPHA = new WeakMap();
function opaqueAt(h) {
  const m = Array.isArray(h.object.material) ? h.object.material[0] : h.object.material, tex = m?.alphaMap || m?.map;
  if (!m || !(m.transparent || m.alphaTest > 0) || !tex?.image || !h.uv) return true;
  let a = ALPHA.get(tex.image);
  if (a === undefined) {
    try {
      const im = tex.image, iw = im.width || im.videoWidth, ih = im.height || im.videoHeight, k = Math.min(1, 256 / Math.max(iw, ih)), w = Math.max(1, Math.round(iw * k)), hh = Math.max(1, Math.round(ih * k));
      const cv = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(w, hh) : Object.assign(document.createElement("canvas"), { width: w, height: hh });
      const cx = cv.getContext("2d", { willReadFrequently: true }); cx.drawImage(im, 0, 0, w, hh);
      a = { w, h: hh, d: cx.getImageData(0, 0, w, hh).data, ch: m.alphaMap ? 1 : 3 };   // an alpha map keeps it in green
    } catch { a = null; }
    ALPHA.set(tex.image, a);
  }
  if (!a) return true;
  const uv = tex.transformUv(h.uv.clone()), x = Math.min(a.w - 1, Math.max(0, Math.floor(uv.x * a.w))), y = Math.min(a.h - 1, Math.max(0, Math.floor(uv.y * a.h)));
  return a.d[(y * a.w + x) * 4 + a.ch] / 255 >= Math.max(0.5, m.alphaTest || 0);
}
function setOccluders() {
  const out = [], bb = new THREE.Box3();
  for (const top of setObjs) {
    if (!top.visible) continue;
    top.traverseVisible((o) => {
      if (!o.isMesh || !o.geometry || o.isSprite || o.isInstancedMesh) return;
      let k = OCC.get(o);
      if (k === undefined) {
        const m = Array.isArray(o.material) ? o.material[0] : o.material;
        k = !!m && !(m.transparent && m.opacity < 0.95) && !(m.alphaTest > 0) && m.visible !== false && m.colorWrite !== false && solidMark(o) !== false;
        if (k) { o.updateMatrixWorld(true); if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); k = bb.max.y > 0.15 && bb.max.y - bb.min.y > 0.02; }
        OCC.set(o, k);
      }
      if (k) out.push(o);
    });
  }
  return out;
}

// who owns the front of the frame (quality plan item 13 (c), 5 Nov 2026: in the tent's first cut Phoenix on the phone
// stood in front of the main action). For each character in frame, the share of its body's outline that something
// nearer the camera covers: another character (arms and held props included), any prop, the set. Rays from the camera
// to 19 points spread over the camera side of the body's ellipsoid (the middle and an inner ring of 7, an outer ring
// of 12); points out of frame don't count. byActor: the share a character (or a prop it holds) covers; core: the same
// for the inner 7 (the face and the middle of the body: a neighbour overlapping the edge in a group shot doesn't reach
// it). qa/framing.mjs decides who the subject is (who acts) and when it fails. Listed when over 5 % is covered.
const FRONT = []; for (let i = 0; i < 19; i++) { const r = i === 0 ? 0 : i < 7 ? 0.5 : 0.85, a = i === 0 ? 0 : i < 7 ? ((i - 1) / 6) * Math.PI * 2 : ((i - 7) / 12) * Math.PI * 2 + 0.26; FRONT.push([Math.cos(a) * r, Math.sin(a) * r]); }
function fronts() {
  const live = actors.filter((a) => a.ch.root.visible && a.ch.body && a.ch.potatoParts?.visible !== false);
  if (!live.length) return [];
  scene.updateMatrixWorld(true);
  const mine = new Map(), cands = [];
  for (const a of live) a.ch.root.traverseVisible((o) => { if (o.isMesh && solidMark(o) !== false && !(o.material && !Array.isArray(o.material) && o.material.transparent && o.material.opacity < 0.6)) { cands.push(o); mine.set(o, a.c.id); } });
  for (const p of props) if (p.root.visible) p.root.traverseVisible((o) => { if (o.isMesh && solidMark(o) !== false && !(o.material && !Array.isArray(o.material) && o.material.transparent && o.material.opacity < 0.6)) { cands.push(o); mine.set(o, p.held ? `${p.spec.id}@${p.holder}` : p.spec.id); } });
  for (const o of setOccluders()) { cands.push(o); mine.set(o, "the set"); }
  bvhPrep(cands);
  const out = [], right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  for (const a of live) {
    const g = a.ch.body.geometry, bb = g.boundingBox || (g.computeBoundingBox(), g.boundingBox), c = bb.getCenter(new THREE.Vector3()).applyMatrix4(a.ch.body.matrixWorld);
    const hs = bb.getSize(new THREE.Vector3()).multiply(a.ch.body.getWorldScale(new THREE.Vector3())).multiplyScalar(0.5);
    const m = c.clone().project(camera); if (Math.abs(m.x) > 1.1 || Math.abs(m.y) > 1.1 || m.z > 1) continue;
    const toCam = camera.position.clone().sub(c).normalize();
    let n = 0, hid = 0, hidA = 0, nc = 0, core = 0; const by = new Map();
    for (const [k, [u, v]] of FRONT.entries()) {
      // a point on the camera side of the ellipsoid, seen at (u, v) of its outline
      const p = c.clone().addScaledVector(right, u * hs.x).addScaledVector(up, v * hs.y).addScaledVector(toCam, Math.sqrt(Math.max(0, 1 - u * u - v * v)) * hs.z * 0.9);
      const q = p.clone().project(camera); if (Math.abs(q.x) > 1 || Math.abs(q.y) > 1 || q.z > 1) continue;
      n++; if (k < 7) nc++;
      const dir = p.clone().sub(camera.position), d = dir.length();
      ray.set(camera.position, dir.normalize()); ray.far = d - 0.03;
      const hit = ray.intersectObjects(cands, false).find((h) => { const w = mine.get(h.object); return w !== a.c.id && !String(w).endsWith(`@${a.c.id}`) && opaqueAt(h); });
      if (!hit) continue;
      hid++;
      // a character, or a prop someone holds (counted as its holder): a bystander. Furniture, scenery and the set in
      // front are staging (a table before a seated character), counted in cover only
      const w = String(mine.get(hit.object)), who = w.includes("@") ? w.split("@")[1] : w, actor = live.some((x) => x.c.id === who);
      if (actor) { hidA++; if (k < 7) core++; by.set(who, (by.get(who) || 0) + 1); }
    }
    if (n < 4 || hid / n <= 0.05) continue;
    const r2 = (x) => Math.round(x * 100) / 100;
    out.push({ id: a.c.id, cover: r2(hid / n), ...(hidA ? { byActor: r2(hidA / n), core: nc ? r2(core / nc) : 0, by: [...by.entries()].sort((x, y) => y[1] - x[1])[0][0] } : {}), dist: r2(c.distanceTo(camera.position)) });
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
  frame: videoFrame, layout: (t) => rt(layout(st(t)), t), contact: (t) => rt(contact(st(t)), t), ids: (t) => ids(st(t)),
  prime: (times) => prime(times.map(st)), blur: (times, keep) => blur(times.map(st), keep), smear: (t, S) => smear(st(t), S), trace: (t, thin) => trace(st(t), thin),
  stateHash: (t, samples = []) => stateHash(st(t), samples.map(st), t),
  reset,
};
window.ENGINE_READY = true;
