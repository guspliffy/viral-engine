import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Character } from "./potato.js";
import { buildSet, buildLights } from "./sets.js";
import { actorState, cameraState, flashAt, captionsAt } from "./timeline.js";
import { radialTexture } from "./geo.js";
import { rng, clamp } from "./util.js";
import { makeStyle, STYLE_PALETTES } from "./styles.js";

const W = 1080, H = 1920;
let R, scene, camera, sb, actors = [], poofs = [], styler, setObjs = [], inkMat;

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
};
function wrap(text, maxW) {
  const words = text.split(/\s+/), lines = []; let line = "";
  for (const w of words) { const test = line ? line + " " + w : w; if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; }
  if (line) lines.push(line);
  return lines;
}
function captionLayout(c) {
  const st = CAP[c.style === "sub" ? "sub" : "main"], pos = c.pos || "top";
  const top = typeof pos === "number" ? pos : { top: 250, mid: 860, low: 1150 }[pos] ?? 250;
  // full width at the top; lower down, keep clear of TikTok's right-hand buttons
  const cx = pos === "top" ? W / 2 : 480, maxW = pos === "top" ? 860 : 780;
  ctx.font = st.font; ctx.letterSpacing = "-0.5px";
  const lines = wrap(c.text, maxW), lh = st.size * 1.12;
  return { st, top, cx, lines, lh };
}
// the caption's ink box in output pixels [x, y, w, h], stroke included
function captionBox(c) {
  ctx.save();
  const { st, top, cx, lines, lh } = captionLayout(c);
  const w = Math.max(...lines.map((ln) => ctx.measureText(ln).width)) + st.stroke;
  ctx.restore();
  return [Math.round(cx - w / 2), Math.round(top - st.stroke / 2), Math.round(w), Math.round(lines.length * lh + st.stroke)];
}
function drawCaption(c) {
  ctx.save();
  const { st, top, cx, lines, lh } = captionLayout(c), cy = top + (lines.length * lh) / 2;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.lineJoin = "round"; ctx.miterLimit = 2;
  ctx.translate(cx, cy); ctx.scale(c.scale, c.scale); ctx.translate(-cx, -cy);
  lines.forEach((ln, i) => {
    const y = top + lh * (i + 0.5);
    ctx.lineWidth = st.stroke; ctx.strokeStyle = "#111"; ctx.strokeText(ln, cx, y);
    ctx.fillStyle = "#fff"; ctx.fillText(ln, cx, y);
  });
  ctx.restore();
}
// manga focus lines converging on a point; the pattern changes 15 times a second so they flicker like drawn frames
function speedLines(f, t, i) {
  const d = f.dur ?? 0.6, k = (t - f.at) / d;
  if (k < 0 || k > 1) return;
  const r = rng(9001 + i * 131 + Math.floor(t * 15) * 7), [cx, cy] = f.center || [540, 860], n = f.count ?? 120;
  ctx.save(); ctx.globalAlpha = Math.min(1, k * 8, (1 - k) * 8) * (f.alpha ?? 0.85); ctx.fillStyle = f.color || "#1a1210";
  for (let j = 0; j < n; j++) {
    const a = ((j + r() * 0.9) / n) * Math.PI * 2, inner = (f.inner ?? 420) + r() * 320, w = 0.003 + r() * 0.011, outer = 2000;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a - w) * outer, cy + Math.sin(a - w) * outer);
    ctx.lineTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a + w) * outer, cy + Math.sin(a + w) * outer);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
const fxActive = (f, t) => t >= f.at && t <= f.at + (f.dur ?? 0.1);

function composite(t) {
  ctx.globalAlpha = 1; ctx.drawImage(R.domElement, 0, 0, W, H);
  (sb.fx || []).forEach((f, i) => { if (f.do === "speedlines") speedLines(f, t, i); });
  const fl = flashAt(sb, t);
  if (fl > 0) { ctx.globalAlpha = fl; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  for (const c of captionsAt(sb, t)) drawCaption(c);
  if (showSafe) { ctx.save(); ctx.setLineDash([16, 10]); ctx.lineWidth = 4; ctx.strokeStyle = "rgba(255,0,180,.9)"; ctx.strokeRect(60, 210, 860, 1150); ctx.restore(); }
}

async function init(data) {
  sb = data.sb;
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
  inkMat = new THREE.MeshBasicMaterial({ color: "#000000" });
  styler = makeStyle(style, R);
  actors = sb.cast.map((c) => {
    const def = data.chars[c.character];
    if (!def) throw new Error(`character not found: ${c.character}`);
    const ch = new Character(def, c.id); scene.add(ch.root);
    ch.root.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if (m.isMeshStandardMaterial) { m.envMap = envTex; m.envMapIntensity = 0.35; } });
    return { c, def, ch };
  });
  poofs = (sb.fx || []).map((f, i) => (f.do === "poof" ? buildPoof(f, i) : null)).filter(Boolean);
  out = document.getElementById("out"); ctx = out.getContext("2d");
  showSafe = !!(data.opts && data.opts.safe);
  await document.fonts.ready;
  await Promise.all([...document.fonts].map((f) => f.load().catch(() => null)));
  return { ok: true, fonts: [...document.fonts].map((f) => `${f.family}:${f.status}`), gl: R.getContext().getParameter(R.getContext().VERSION) };
}

// places characters, effects and camera for time t without drawing anything
function pose(t) {
  const states = {};
  for (const a of actors) { const st = actorState(sb, a.c, a.def, t); a.ch.apply(st, t); states[a.c.id] = { st, a }; }
  for (const p of poofs) {
    const who = p.f.who && states[p.f.who];
    const o = who ? new THREE.Vector3(who.st.x, 0, who.st.z + 0.15) : new THREE.Vector3().fromArray(p.f.pos || [0, 0, 0]);
    p.apply(t, o);
  }
  const cam = cameraState(sb, t);
  camera.position.fromArray(cam.pos); camera.fov = cam.fov; camera.updateProjectionMatrix(); camera.lookAt(new THREE.Vector3().fromArray(cam.look));
}

function frame(t) {
  pose(t);
  // impact frame: characters as solid black silhouettes on white, like a manga panel (drawn in 3D, so it works on any set)
  if ((sb.fx || []).some((f) => f.do === "impact" && fxActive(f, t))) {
    const bg = scene.background, fog = scene.fog;
    for (const o of setObjs) o.visible = false;
    for (const p of poofs) p.g.visible = false;
    scene.background = new THREE.Color("#ffffff"); scene.fog = null; scene.overrideMaterial = inkMat;
    R.render(scene, camera);
    scene.overrideMaterial = null; scene.background = bg; scene.fog = fog;
    for (const o of setObjs) o.visible = true;
  } else {
    styler.prepare(scene);
    styler.render(scene, camera);
  }
  composite(t);
  return true;
}

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
  return { t, captions: caps, actors: actorsOut };
}
let silRT, silMat;
function silhouette() {
  const w = W / 4, h = H / 4;
  if (!silRT) { silRT = new THREE.WebGLRenderTarget(w, h); silMat = new THREE.MeshBasicMaterial({ color: "#ffffff" }); }
  const bg = scene.background, fog = scene.fog;
  for (const o of setObjs) o.visible = false;
  const pv = poofs.map((p) => p.g.visible); for (const p of poofs) p.g.visible = false;
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
  for (const o of glass) o.visible = true;
  return px;
}

window.ENGINE = { init, frame, capture, layout };
window.ENGINE_READY = true;
