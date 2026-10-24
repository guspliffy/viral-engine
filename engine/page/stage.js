import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Character } from "./potato.js";
import { buildSet, buildLights } from "./sets.js";
import { actorState, cameraState, flashAt, captionsAt } from "./timeline.js";
import { radialTexture } from "./geo.js";
import { rng, clamp } from "./util.js";

const W = 1080, H = 1920;
let R, scene, camera, sb, actors = [], poofs = [];

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
function drawCaption(c) {
  const st = CAP[c.style === "sub" ? "sub" : "main"], pos = c.pos || "top";
  const top = typeof pos === "number" ? pos : { top: 250, mid: 860, low: 1150 }[pos] ?? 250;
  // full width at the top; lower down, keep clear of TikTok's right-hand buttons
  const cx = pos === "top" ? W / 2 : 480, maxW = pos === "top" ? 860 : 780;
  ctx.save();
  ctx.font = st.font; ctx.letterSpacing = "-0.5px"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.lineJoin = "round"; ctx.miterLimit = 2;
  const lines = wrap(c.text, maxW), lh = st.size * 1.12, cy = top + (lines.length * lh) / 2;
  ctx.translate(cx, cy); ctx.scale(c.scale, c.scale); ctx.translate(-cx, -cy);
  lines.forEach((ln, i) => {
    const y = top + lh * (i + 0.5);
    ctx.lineWidth = st.stroke; ctx.strokeStyle = "#111"; ctx.strokeText(ln, cx, y);
    ctx.fillStyle = "#fff"; ctx.fillText(ln, cx, y);
  });
  ctx.restore();
}
function composite(t) {
  ctx.globalAlpha = 1; ctx.drawImage(R.domElement, 0, 0, W, H);
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
  R.toneMapping = THREE.NeutralToneMapping; R.toneMappingExposure = sb.exposure ?? 1.0;
  R.outputColorSpace = THREE.SRGBColorSpace;
  R.shadowMap.enabled = true; R.shadowMap.type = opts.shadow === "pcf" ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(R);
  // image-based lighting only on the characters: on the ground and background it cost more than half the frame time
  const envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  camera = new THREE.PerspectiveCamera(32, W / H, 0.05, 300);
  buildLights(scene, sb.set);
  buildSet(scene, sb.set);
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

function frame(t) {
  const states = {};
  for (const a of actors) { const st = actorState(sb, a.c, a.def, t); a.ch.apply(st, t); states[a.c.id] = { st, a }; }
  for (const p of poofs) {
    const who = p.f.who && states[p.f.who];
    const o = who ? new THREE.Vector3(who.st.x, 0, who.st.z + 0.15) : new THREE.Vector3().fromArray(p.f.pos || [0, 0, 0]);
    p.apply(t, o);
  }
  const cam = cameraState(sb, t);
  camera.position.fromArray(cam.pos); camera.fov = cam.fov; camera.updateProjectionMatrix(); camera.lookAt(new THREE.Vector3().fromArray(cam.look));
  R.render(scene, camera);
  composite(t);
  return true;
}

// the composed frame as a data URL: "jpeg" for video frames, "png" for stills and the cover
function capture(fmt = "jpeg") { return fmt === "png" ? out.toDataURL("image/png") : out.toDataURL("image/jpeg", 0.95); }

window.ENGINE = { init, frame, capture };
window.ENGINE_READY = true;
