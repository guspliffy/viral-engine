import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Character } from "./potato.js";
import { buildSet, buildLights } from "./sets.js";
import { actorState, cameraState, flashAt, captionsAt } from "./timeline.js";
import { radialTexture } from "./geo.js";
import { rng, clamp } from "./util.js";

const W = 1080, H = 1920;
let R, scene, camera, sb, actors = [], poofs = [], capEls = [];

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

function setupCaptions() {
  const box = document.getElementById("caps");
  capEls = (sb.captions || []).map((c) => {
    const el = document.createElement("div");
    el.className = "cap" + (c.style === "sub" ? " sub" : "");
    el.textContent = c.text;
    const pos = c.pos || "top";
    const y = typeof pos === "number" ? pos : { top: 250, mid: 860, low: 1150 }[pos] ?? 250;
    el.style.top = y + "px";
    if (pos !== "top") { el.style.width = "780px"; el.style.marginLeft = "-450px"; } // keep clear of TikTok's right-hand buttons
    el.style.display = "none"; box.appendChild(el);
    return el;
  });
}

async function init(data) {
  sb = data.sb;
  const canvas = document.getElementById("gl");
  R = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  R.setPixelRatio(1); R.setSize(W, H, false);
  R.toneMapping = THREE.NeutralToneMapping; R.toneMappingExposure = sb.exposure ?? 1.0;
  R.outputColorSpace = THREE.SRGBColorSpace;
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(R);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.35;
  camera = new THREE.PerspectiveCamera(32, W / H, 0.05, 300);
  buildLights(scene, sb.set);
  buildSet(scene, sb.set);
  actors = sb.cast.map((c) => {
    const def = data.chars[c.character];
    if (!def) throw new Error(`character not found: ${c.character}`);
    const ch = new Character(def, c.id); scene.add(ch.root);
    return { c, def, ch };
  });
  poofs = (sb.fx || []).map((f, i) => (f.do === "poof" ? buildPoof(f, i) : null)).filter(Boolean);
  setupCaptions();
  if (data.opts && data.opts.safe) {
    const s = document.getElementById("safe");
    Object.assign(s.style, { display: "block", left: "60px", top: "210px", width: "860px", height: "1150px" });
  }
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
  R.getContext().finish(); // finish GPU work here, so the timing split in render.mjs is honest
  document.getElementById("flash").style.opacity = String(flashAt(sb, t));
  const on = new Set(captionsAt(sb, t).map((c) => (sb.captions || []).findIndex((x) => x.text === c.text && x.from === c.from)));
  const caps = captionsAt(sb, t);
  capEls.forEach((el, i) => {
    const c = caps.find((x) => x.text === sb.captions[i].text && x.from === sb.captions[i].from);
    el.style.display = on.has(i) ? "block" : "none";
    if (c) el.style.transform = `scale(${c.scale.toFixed(4)})`;
  });
  return true;
}

window.ENGINE = { init, frame };
window.ENGINE_READY = true;
