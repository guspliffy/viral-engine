import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Character } from "./potato.js";
import { buildSet, buildLights } from "./sets.js";
import { actorState, cameraState, flashAt, captionsAt, lightsAt } from "./timeline.js";
import { radialTexture } from "./geo.js";
import { buildProp, propState, gripWorld } from "./props3d.js";
import { rng, clamp, ease } from "./util.js";
import { makeStyle, STYLE_PALETTES } from "./styles.js";
import { makeLook } from "./looks.js";

const W = 1080, H = 1920;
let R, scene, camera, sb, actors = [], poofs = [], styler, setObjs = [], inkMat, poseStates = {}, props = [];
let roomLights = [], lamp = null, bulb = null, charMats = [], trails = [], camGates = [];   // what the "lights" effect dims (timeline.js lightsAt)
const photos = new Map();   // "photo" effects: the snapshot each one shows, taken once

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
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.03, 0), sparkM); g.add(m);
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
      for (const p of puffs) {
        const q = clamp((k - p.delay) / d);
        const r = p.dist * (1 - Math.exp(-q * 7));
        p.s.position.copy(p.dir).multiplyScalar(r).add(new THREE.Vector3(0, 0.45 + q * 0.25, 0));
        p.s.scale.setScalar(p.size * (0.3 + 1.2 * (1 - Math.exp(-q * 5))));
        p.s.material.opacity = q <= 0 ? 0 : Math.min(1, q * 12) * Math.pow(1 - q, 1.6);
      }
      for (const s of sparks) {
        const q = Math.min(k, 0.9);
        s.m.position.set(s.v.x * q * 0.7, 0.5 + s.v.y * q * 0.7 - 4.2 * q * q * 0.7, s.v.z * q * 0.7);
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

// Captions, flash and the safe-zone guide are drawn on a 2D canvas on top of the 3D frame, and that canvas is what
// gets captured. Reading one canvas is far faster than screenshotting the page through the compositor.
let out, ctx, showSafe = false;
const CAP = {
  main: { font: '900 74px "CapBlack"', size: 74, stroke: 14 },
  sub: { font: '800 60px "CapBold"', size: 60, stroke: 12 },
  // a title plate: white letters on a dark box (the "each character vs X" format's pinned word)
  label: { font: '900 96px "CapBlack"', size: 96, stroke: 0, pad: 34, box: "#24232b" },
};
// a "\n" in the text forces a line break (to keep a word from sitting alone on the last line)
function wrap(text, maxW) {
  if (text.includes("\n")) return text.split("\n").flatMap((t) => wrap(t, maxW));
  const words = text.split(/\s+/), lines = []; let line = "";
  for (const w of words) { const test = line ? line + " " + w : w; if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; }
  if (line) lines.push(line);
  return lines;
}
// "size" (px) scales a caption's style down or up: a long pinned title that would wrap at the label's 96 px
function capStyle(c) {
  const st = CAP[c.style] || CAP.main;
  if (!c.size || c.size === st.size) return st;
  const k = c.size / st.size;
  return { ...st, size: c.size, font: st.font.replace(/\d+px/, `${c.size}px`), stroke: Math.round(st.stroke * k), ...(st.pad && { pad: Math.round(st.pad * k) }) };
}
function captionLayout(c) {
  const st = capStyle(c), pos = c.pos || "top";
  const top = typeof pos === "number" ? pos : { top: 250, mid: 860, low: 1150 }[pos] ?? 250;
  // full width at the top; lower down, keep clear of TikTok's right-hand buttons
  const cx = c.x ?? (pos === "top" ? W / 2 : 480), maxW = pos === "top" ? 860 : 780;
  ctx.font = st.font; ctx.letterSpacing = "-0.5px";
  const lines = wrap(c.text, maxW), lh = st.size * 1.12;
  return { st, top, cx, lines, lh };
}
// the caption's ink box in output pixels [x, y, w, h], stroke included
function captionBox(c) {
  ctx.save();
  const { st, top, cx, lines, lh } = captionLayout(c);
  const pad = st.pad ?? 0, w = Math.max(...lines.map((ln) => ctx.measureText(ln).width)) + st.stroke + pad * 2;
  ctx.restore();
  return [Math.round(cx - w / 2), Math.round(top - st.stroke / 2 - pad / 2), Math.round(w), Math.round(lines.length * lh + st.stroke + pad)];
}
function drawCaption(c) {
  ctx.save();
  const { st, top, cx, lines, lh } = captionLayout(c), cy = top + (lines.length * lh) / 2;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.lineJoin = "round"; ctx.miterLimit = 2;
  ctx.translate(cx, cy); ctx.scale(c.scale, c.scale); ctx.translate(-cx, -cy);
  if (st.box) { const [bx, by, bw, bh] = captionBox(c); ctx.fillStyle = st.box; ctx.fillRect(bx, by, bw, bh); }
  lines.forEach((ln, i) => {
    const y = top + lh * (i + 0.5);
    if (st.stroke) { ctx.lineWidth = st.stroke; ctx.strokeStyle = "#111"; ctx.strokeText(ln, cx, y); }
    ctx.fillStyle = "#fff"; ctx.fillText(ln, cx, y);
  });
  ctx.restore();
}
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
  const c = f.pos ? toScreen(f.pos) : toScreen([A.st.x, A.st.y + A.a.ch.topY() * (A.st.scale ?? 1) * 0.85, A.st.z]), n = f.count ?? 6, r = rng(4242 + i * 97);
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

// "trail": the arc a swung blade leaves in the air, a ribbon from the blade's middle to its tip over the last `len`
// seconds (default 0.12), bright at the blade and fading behind it. { fx: "trail", who, at, dur, color, len }
function buildTrail(f) {
  const N = 10, geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 2 * 3), age = new Float32Array(N * 2), idx = [];
  for (let i = 0; i < N; i++) { age[i * 2] = age[i * 2 + 1] = i / (N - 1); if (i < N - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("age", new THREE.BufferAttribute(age, 1)); geo.setIndex(idx);
  const m = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(f.color || "#7dffb4") }, uFade: { value: 1 } },
    vertexShader: "attribute float age; varying float vAge; void main() { vAge = age; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 uColor; uniform float uFade; varying float vAge; void main() { float a = 0.75 * (1.0 - vAge) * (1.0 - vAge) * uFade; gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.45 * (1.0 - vAge)) * a, a); }",
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  m.userData.outlineParameters = { visible: false };
  const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; mesh.renderOrder = 4; mesh.visible = false; scene.add(mesh);
  const A = () => actors.find((a) => a.c.id === f.who);
  return {
    sample(t) {
      const d = f.dur ?? 0.3, on = t >= f.at && t <= f.at + d + (f.len ?? 0.12);
      mesh.visible = on; if (!on) return;
      const a = A(); if (!a) { mesh.visible = false; return; }
      for (let i = 0; i < N; i++) {
        // the ribbon never reaches back before the swing started, and stops growing after it ends
        const u = Math.max(f.at, Math.min(f.at + d, t) - (i / (N - 1)) * (f.len ?? 0.12));
        a.ch.apply(actorState(sb, a.c, a.def, u), u); a.ch.root.updateMatrixWorld(true);
        const L = a.ch.costume.propLine?.(); if (!L) { mesh.visible = false; return; }
        const p0 = a.ch.root.localToWorld(L.a.clone().lerp(L.b, f.from ?? 0.35)), p1 = a.ch.root.localToWorld(L.a.clone().lerp(L.b, 1.0));
        pos.set([p0.x, p0.y, p0.z], i * 6); pos.set([p1.x, p1.y, p1.z], i * 6 + 3);
      }
      geo.attributes.position.needsUpdate = true;
      // it fades out over its len once the swing is over
      m.uniforms.uFade.value = t <= f.at + d ? 1 : 1 - (t - f.at - d) / (f.len ?? 0.12);
    },
  };
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
  } else { styler.prepare(scene); styler.render(scene, pc); }
  for (const o of hidden) o.visible = true;
  const S = 720, cv = document.createElement("canvas"); cv.width = cv.height = S;
  const g = cv.getContext("2d"), src = R.domElement, k = src.width / W;   // a draft draws at half resolution
  g.drawImage(src, 0, ((H - W) / 2) * k, W * k, W * k, 0, 0, S, S);
  if (f.look === "dark") { g.fillStyle = "rgba(14,9,22,0.82)"; g.fillRect(0, 0, S, S); }
  if (f.look === "ink") {
    g.globalCompositeOperation = "multiply";
    const gr = g.createRadialGradient(S / 2, S * 0.45, 0, S / 2, S * 0.45, S * 0.8);
    gr.addColorStop(0, "#fffdf4"); gr.addColorStop(0.55, "#ffeab0"); gr.addColorStop(1, "#ffbf66");
    g.fillStyle = gr; g.fillRect(0, 0, S, S); g.globalCompositeOperation = "source-over";
  }
  photos.set(i, cv);
}
function photoCard(f, i, t) {
  const d = f.dur ?? 1.5, k = t - f.at, pic = photos.get(i);
  if (k < 0 || k > d || !pic) return;
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

function composite(t) {
  ctx.globalAlpha = 1; ctx.drawImage(R.domElement, 0, 0, W, H);
  (sb.fx || []).forEach((f, i) => { if (f.do === "speedlines") speedLines(f, t, i); else if (f.do === "sparkle" || f.do === "notes" || f.do === "zzz" || f.do === "sweat" || f.do === "alert") headFx(f, t, i); else if (f.do === "photo") photoCard(f, i, t); else if (f.do === "glint") glintFx(f, t); });
  const fl = flashAt(sb, t);
  if (fl > 0) { ctx.globalAlpha = fl; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  for (const c of captionsAt(sb, t)) drawCaption(c);
  if (showSafe) { ctx.save(); ctx.setLineDash([16, 10]); ctx.lineWidth = 4; ctx.strokeStyle = "rgba(255,0,180,.9)"; ctx.strokeRect(60, 210, 860, 1150); ctx.restore(); }
}

async function init(data) {
  sb = data.sb; charMats = []; photos.clear();
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
  buildSet(scene, sb.set, STYLE_PALETTES[style] ? { sky: pal.sky, ground: pal.ground } : null);
  setObjs = scene.children.slice(before); // the scenery, hidden during impact frames
  // the room's own lights (props and characters bring their own: candles, a glowing pickle, a blazing Phoenix)
  roomLights = []; scene.traverse((o) => { if (o.isLight && o.name !== "set-lamp") roomLights.push({ o, base: o.intensity }); });
  lamp = scene.getObjectByName("set-lamp"); lamp = lamp ? { o: lamp, base: lamp.intensity } : null;
  bulb = scene.getObjectByName("set-bulb"); bulb = bulb ? { o: bulb, base: bulb.material.color.clone() } : null;
  props = (sb.props || []).map((spec) => { const p = buildProp(spec); scene.add(p.root); return p; });
  // a clock prop replaces the kitchen's own clock
  if (props.some((p) => p.spec.kind === "clock")) { const c = scene.getObjectByName("set-clock"); if (c) c.visible = false; }
  inkMat = new THREE.MeshBasicMaterial({ color: "#000000" });
  actors = sb.cast.map((c) => {
    const def = data.chars[c.character];
    if (!def) throw new Error(`character not found: ${c.character}`);
    const ch = new Character(def, c.id); scene.add(ch.root);
    ch.root.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if (m.isMeshStandardMaterial) { m.envMap = envTex; m.envMapIntensity = 0.35; charMats.push(m); } });
    return { c, def, ch };
  });
  // set pieces and props that belong to one side of a wall (set-elevator.js: the car's front wall and the hallway show
  // only while the camera is inside the car): userData.camGate(cameraPosition) says whether they show this frame
  camGates = []; scene.traverse((o) => { if (o.userData.camGate) camGates.push(o); });
  poofs = (sb.fx || []).map((f, i) => (f.do === "poof" ? buildPoof(f, i) : f.do === "slash" ? buildSlash(f) : null)).filter(Boolean);   // slashes ride with the poofs (hidden in the checks)
  trails = (sb.fx || []).filter((f) => f.do === "trail").map(buildTrail);
  // a look (looks.js) relights the scene, upgrades materials and adds post-processing; without one, the style draws
  styler = opts.look ? makeLook(opts.look, { R, scene, camera, W, H, actors, setObjs, draft: !!opts.draft, setSpec: sb.set, props }) : makeStyle(style, R);
  out = document.getElementById("out"); ctx = out.getContext("2d");
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
  const states = {};
  for (const a of actors) { const st = actorState(sb, a.c, a.def, t); a.ch.apply(st, t); states[a.c.id] = { st, a }; }
  for (const p of poofs) {
    const who = p.f.who && states[p.f.who];
    // at the character's height: a poof on someone flying, sitting or standing on a table happens where they are
    const o = who ? new THREE.Vector3(who.st.x, who.st.y, who.st.z + 0.15) : new THREE.Vector3().fromArray(p.f.pos || [0, 0, 0]);
    p.apply(t, o);
  }
  poseStates = states;
  // props: a held prop sits in its holder's hand (both hands: between them), a released one glides to where it is put down
  const v = new THREE.Vector3();
  // the holder's anchor: a hand (position only, so a held prop stays upright), both hands, the point of the
  // character's own prop ("tip"), or the hat ("hat": position and tilt, something stuck to the hat tips with it)
  const anchor = (who, hand) => {
    const A = states[who]; if (!A) return null;
    A.a.ch.root.updateMatrixWorld(true);
    if (hand === "hat") return A.a.ch.costume.hat ? { obj: A.a.ch.costume.hat } : null;
    if (hand === "tip") return A.a.ch.costume.tip ? { pos: A.a.ch.costume.tip.getWorldPosition(new THREE.Vector3()) } : null;
    const hs = hand === "both" ? ["R", "L"] : [hand];
    return { pos: hs.reduce((acc, h) => acc.add(A.a.ch.arms[h].hand.getWorldPosition(v)), new THREE.Vector3()).multiplyScalar(1 / hs.length) };
  };
  // where a held prop sits for its holder's pose right now
  const heldAt = (p, ps, hold) => {
    const k = hold.keep ? keptOffset(p, hold) : null;   // first: it poses the holder at the grab and back
    const an = anchor(hold.who, hold.hand); if (!an) return null;
    if (k) {
      return an.obj ? an.obj.localToWorld(new THREE.Vector3().fromArray(k)).toArray() : [an.pos.x + k[0], an.pos.y + k[1], an.pos.z + k[2]];
    }
    const h = an.obj ? an.obj.getWorldPosition(new THREE.Vector3()) : an.pos, o = hold.off;
    // a grip point: the prop sits so that point is in the hand; otherwise its own grip height is
    const g = hold.grip ? gripWorld(p.spec, hold.grip, [0, 0, 0], ps.rot, ps.scale, ps.tilt, ps.tip) : [0, p.grip * ps.scale, 0];
    return [h.x - g[0] + o[0], h.y - g[1] + o[1], h.z - g[2] + o[2]];
  };
  // keep: the offset from the holder that leaves the prop exactly where it was at the grab (measured once, with
  // the holder posed at that moment)
  const keptOffset = (p, hold) => {
    const key = `${hold.who}/${hold.hand}@${hold.at}`;
    if (!p.kept || p.kept.key !== key) {
      const A = states[hold.who];
      A.a.ch.apply(actorState(sb, A.a.c, A.a.def, hold.at), hold.at);
      const an = anchor(hold.who, hold.hand), w = new THREE.Vector3().fromArray(hold.from);
      p.kept = { key, off: an.obj ? an.obj.worldToLocal(w).toArray() : [w.x - an.pos.x, w.y - an.pos.y, w.z - an.pos.z] };
      A.a.ch.apply(A.st, t);
    }
    return p.kept.off;
  };
  for (const p of props) {
    const ps = propState(sb, p.spec, t);
    p.held = !!ps.hold; p.holder = ps.hold ? ps.hold.who : null;
    // let go without a place: it stays where it was when the hand let go (pose the holder at that moment once)
    if (ps.left) {
      const key = `${ps.left.who}@${ps.left.at}`;
      if (!p.leftAt || p.leftAt.key !== key) {
        const A = states[ps.left.who];
        if (A) {
          if (ps.left.keep) keptOffset(p, ps.left);
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
  // a charger's cable runs to the prop its spec.to names (props3d.js charger), wherever that is now
  for (const p of props) if (p.link && p.spec.to) { const q = props.find((o) => o.spec.id === p.spec.to); if (q) { q.root.updateMatrixWorld(true); p.link(q.root.getWorldPosition(new THREE.Vector3())); } }
  const L = lightsAt(sb, t);
  for (const l of roomLights) l.o.intensity = l.base * L.room;
  if (lamp) lamp.o.intensity = lamp.base * L.lamp;
  if (bulb) bulb.o.material.color.copy(bulb.base).multiplyScalar(0.12 + 0.88 * Math.min(1, L.lamp));
  for (const m of charMats) m.envMapIntensity = 0.35 * Math.min(1, L.room);
  const cam = cameraState(sb, t);
  camera.position.fromArray(cam.pos); camera.fov = cam.fov; camera.updateProjectionMatrix(); camera.lookAt(new THREE.Vector3().fromArray(cam.look));
  for (const o of camGates) o.visible = !!o.userData.camGate(camera.position);
}

function frame(t) {
  (sb.fx || []).forEach((f, i) => { if (f.do === "photo" && fxActive(f, t)) snapshot(f, i); });
  for (const tr of trails) tr.sample(t);   // poses the swordsman in the recent past, so it goes before pose(t)
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
    styler.prepare(scene);
    styler.render(scene, camera);
  }
  composite(t);
  return true;
}

// waits until the frame is really drawn: the 3D renderer only queues GPU work, so reading one pixel back is
// what makes the software GPU finish it (render.mjs uses this to time drawing and encoding separately)
function sync() { ctx.getImageData(0, 0, 1, 1); return true; }

// the composed frame as a data URL: "jpeg" for video frames, "png" for stills and the cover
function capture(fmt = "jpeg") { return fmt === "png" ? out.toDataURL("image/png") : out.toDataURL("image/jpeg", 0.95); }

// screen-space layout for the QA checks (qa/check.mjs): caption boxes and each character's visible bounding box,
// in output pixels. Nothing is drawn, so sampling a whole clip takes seconds.
const r3 = (x) => Math.round(x * 1000) / 1000;
function layout(t) {
  pose(t);
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
    // a held costume prop's shaft in the world (the katana: a = the handle's foot, b = the blade tip), for aiming
    const L = a.ch.costume.propLine?.(), prop = L ? { a: a.ch.root.localToWorld(L.a.clone()).toArray().map(r3), b: a.ch.root.localToWorld(L.b.clone()).toArray().map(r3) } : undefined;
    return { id: a.c.id, box: [Math.round(x0), Math.round(y0), Math.round(x1 - x0), Math.round(y1 - y0)], hat, hands, prop };
  });
  // where each prop stands in the world (metres), for aiming throws and checking what is in frame
  const propsOut = props.map((p) => ({ id: p.spec.id, at: p.root.position.toArray().map(r3), visible: p.root.visible }));
  const caps = captionsAt(sb, t).map((c) => ({ text: c.text, box: captionBox(c) }));
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
  return { t, captions: caps, actors: actorsOut, props: propsOut, clips: clipping() };
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
  // props are scenery (a tree's leaves behind the title are fine); only the characters count
  const prv = props.map((p) => p.root.visible); for (const p of props) p.root.visible = false;
  // glows and other see-through parts are effects, not the character's body
  const glass = []; scene.traverseVisible((o) => { const m = o.material; if (m && !Array.isArray(m) && m.transparent && m.opacity < 0.95 || o.isSprite || o.isPoints) glass.push(o); });
  for (const o of glass) o.visible = false;
  scene.background = new THREE.Color("#000000"); scene.fog = null; scene.overrideMaterial = silMat;
  R.setRenderTarget(silRT); R.render(scene, camera);
  const px = new Uint8Array(w * h * 4); R.readRenderTargetPixels(silRT, 0, 0, w, h, px);
  R.setRenderTarget(null);
  scene.overrideMaterial = null; scene.background = bg; scene.fog = fog;
  for (const o of setObjs) o.visible = true;
  for (const p of sceneryProps) p.root.visible = true;
  poofs.forEach((p, i) => (p.g.visible = pv[i]));
  props.forEach((p, i) => (p.root.visible = prv[i]));
  for (const o of glass) o.visible = true;
  return px;
}

// contact measures per actor at time t (potato.js contact()), for qa/check.mjs: no pixels drawn, so a whole clip at
// full frame rate takes seconds
function contact(t) {
  pose(t);
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
  return out;
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

window.ENGINE = { init, frame, sync, capture, layout, contact };
window.ENGINE_READY = true;
