import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Character } from "./potato.js";
import { buildSet, buildLights } from "./sets.js";
import { actorState, cameraState, flashAt, captionsAt, lightsAt } from "./timeline.js";
import { radialTexture } from "./geo.js";
import { buildProp, propState } from "./props3d.js";
import { rng, clamp, ease } from "./util.js";
import { makeStyle, STYLE_PALETTES } from "./styles.js";

const W = 1080, H = 1920;
let R, scene, camera, sb, actors = [], poofs = [], styler, setObjs = [], inkMat, poseStates = {}, props = [];
let roomLights = [], lamp = null, bulb = null, charMats = [];   // what the "lights" effect dims (timeline.js lightsAt)
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
function captionLayout(c) {
  const st = CAP[c.style] || CAP.main, pos = c.pos || "top";
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
  if (k < 0 || k > 1 || !A) return;
  const { st, a } = A, top = a.ch.topY() * (st.scale ?? 1), c = toScreen([st.x, st.y + top * 0.85, st.z]), n = f.count ?? 6, r = rng(4242 + i * 97);
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
  (sb.fx || []).forEach((f, i) => { if (f.do === "speedlines") speedLines(f, t, i); else if (f.do === "sparkle" || f.do === "notes" || f.do === "zzz" || f.do === "sweat" || f.do === "alert") headFx(f, t, i); else if (f.do === "photo") photoCard(f, i, t); });
  const fl = flashAt(sb, t);
  if (fl > 0) { ctx.globalAlpha = fl; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  for (const c of captionsAt(sb, t)) drawCaption(c);
  if (showSafe) { ctx.save(); ctx.setLineDash([16, 10]); ctx.lineWidth = 4; ctx.strokeStyle = "rgba(255,0,180,.9)"; ctx.strokeRect(60, 210, 860, 1150); ctx.restore(); }
}

async function init(data) {
  sb = data.sb; charMats = []; photos.clear();
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
  styler = makeStyle(style, R);
  actors = sb.cast.map((c) => {
    const def = data.chars[c.character];
    if (!def) throw new Error(`character not found: ${c.character}`);
    const ch = new Character(def, c.id); scene.add(ch.root);
    ch.root.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if (m.isMeshStandardMaterial) { m.envMap = envTex; m.envMapIntensity = 0.35; charMats.push(m); } });
    return { c, def, ch };
  });
  poofs = (sb.fx || []).map((f, i) => (f.do === "poof" ? buildPoof(f, i) : null)).filter(Boolean);
  out = document.getElementById("out"); ctx = out.getContext("2d");
  showSafe = !!(data.opts && data.opts.safe);
  await document.fonts.ready;
  await Promise.all([...document.fonts].map((f) => f.load().catch(() => null)));
  const gl = R.getContext(), dbg = gl.getExtension("WEBGL_debug_renderer_info");
  return { ok: true, fonts: [...document.fonts].map((f) => `${f.family}:${f.status}`), gl: gl.getParameter(gl.VERSION), renderer: gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER) };
}

// places characters, effects and camera for time t without drawing anything
function pose(t) {
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
  const v = new THREE.Vector3(), handAt = (who, hand) => {
    const A = states[who]; if (!A) return null;
    A.a.ch.root.updateMatrixWorld(true);
    if (hand === "tip") return A.a.ch.costume.tip ? A.a.ch.costume.tip.getWorldPosition(new THREE.Vector3()) : null;
    const hs = hand === "both" ? ["R", "L"] : [hand];
    return hs.reduce((acc, h) => acc.add(A.a.ch.arms[h].hand.getWorldPosition(v)), new THREE.Vector3()).multiplyScalar(1 / hs.length);
  };
  for (const p of props) {
    const ps = propState(sb, p.spec, t);
    p.held = !!ps.hold; p.holder = ps.hold ? ps.hold.who : null;
    // put down without a place: it stays where the hand was when it let go (pose the holder at that moment once)
    if (ps.left) {
      const key = `${ps.left.who}@${ps.left.at}`;
      if (!p.leftAt || p.leftAt.key !== key) {
        const A = states[ps.left.who];
        if (A) {
          A.a.ch.apply(actorState(sb, A.a.c, A.a.def, ps.left.at), ps.left.at);
          const h = handAt(ps.left.who, ps.left.hand), o = ps.left.off;
          p.leftAt = { key, pos: [h.x + o[0], h.y - p.grip * ps.scale + o[1], h.z + o[2]] };
          A.a.ch.apply(A.st, t);
        }
      }
      if (p.leftAt) [ps.x, ps.y, ps.z] = p.leftAt.pos;
    }
    if (ps.hold) {
      const h = handAt(ps.hold.who, ps.hold.hand);
      if (h) {
        const o = ps.hold.off, at = [h.x + o[0], h.y - p.grip * ps.scale + o[1], h.z + o[2]];
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
    return { id: a.c.id, box: [Math.round(x0), Math.round(y0), Math.round(x1 - x0), Math.round(y1 - y0)] };
  });
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
  return { t, captions: caps, actors: actorsOut, clips: clipping() };
}
// Characters passing through props or each other: each body is an ellipsoid (its mesh's own bounding box), and a
// prop part or another body counts as inside when its box reaches into that ellipsoid. depth 0 = touching,
// 1 = reaching the centre. Only visible meshes; a held prop is skipped for its holder only.
function clipping() {
  const out = [], tmp = new THREE.Box3(), inv = new THREE.Matrix4(), m = new THREE.Matrix4();
  const bodies = actors.map((a) => ({ id: a.c.id, a, mesh: a.ch.body })).filter((b) => b.mesh && b.a.ch.root.visible && b.mesh.visible && b.a.ch.potatoParts.visible);
  const depthIn = (body, mesh) => {
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    if (!body.mesh.geometry.boundingBox) body.mesh.geometry.computeBoundingBox();
    const eb = body.mesh.geometry.boundingBox, c = eb.getCenter(new THREE.Vector3()), h = eb.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    inv.copy(body.mesh.matrixWorld).invert(); m.multiplyMatrices(inv, mesh.matrixWorld);
    tmp.copy(mesh.geometry.boundingBox).applyMatrix4(m);   // the other part, in the body's own space
    const q = tmp.clampPoint(c, new THREE.Vector3()).sub(c);
    const d2 = (q.x / h.x) ** 2 + (q.y / h.y) ** 2 + (q.z / h.z) ** 2;
    return d2 < 1 ? 1 - Math.sqrt(d2) : 0;
  };
  // body vs body: points on the other ellipsoid's surface, tested against this one (boxes would overlap too early)
  const DIRS = []; for (let i = 0; i < 42; i++) { const y = 1 - (2 * (i + 0.5)) / 42, r = Math.sqrt(1 - y * y), a = i * 2.39996; DIRS.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)); }
  const bodyIn = (b, o) => {
    const eb = b.mesh.geometry.boundingBox, c = eb.getCenter(new THREE.Vector3()), h = eb.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    const ob = o.mesh.geometry.boundingBox, oc = ob.getCenter(new THREE.Vector3()), oh = ob.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    inv.copy(b.mesh.matrixWorld).invert(); m.multiplyMatrices(inv, o.mesh.matrixWorld);
    let best = 1e9;
    for (const d of DIRS) { const q = new THREE.Vector3(oc.x + d.x * oh.x, oc.y + d.y * oh.y, oc.z + d.z * oh.z).applyMatrix4(m).sub(c); best = Math.min(best, (q.x / h.x) ** 2 + (q.y / h.y) ** 2 + (q.z / h.z) ** 2); }
    return best < 1 ? 1 - Math.sqrt(best) : 0;
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
    for (const o of bodies) if (o !== b && o.id > b.id) { const d = Math.max(bodyIn(b, o), bodyIn(o, b)); if (d > 0.05) out.push({ who: b.id, with: o.id, depth: Math.round(d * 100) / 100 }); }
  }
  return out;
}

let silRT, silMat;
function silhouette() {
  const w = W / 4, h = H / 4;
  if (!silRT) { silRT = new THREE.WebGLRenderTarget(w, h); silMat = new THREE.MeshBasicMaterial({ color: "#ffffff" }); }
  const bg = scene.background, fog = scene.fog;
  for (const o of setObjs) o.visible = false;
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
  poofs.forEach((p, i) => (p.g.visible = pv[i]));
  props.forEach((p, i) => (p.root.visible = prv[i]));
  for (const o of glass) o.visible = true;
  return px;
}

window.ENGINE = { init, frame, sync, capture, layout };
window.ENGINE_READY = true;
