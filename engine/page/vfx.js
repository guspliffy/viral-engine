import * as THREE from "three";
import { Pass } from "three/addons/postprocessing/Pass.js";

// Particle effects made in Effekseer (MIT, https://effekseer.github.io), played with its WebGL runtime (vendored in
// engine/page/vendor/effekseer, v1.80.8). Opt-in: a storyboard fx item with "do": "vfx" loads the runtime; clips
// without one never touch it, so their pictures stay byte-identical.
//
//   { "do": "vfx", "effect": "toon-hit", "at": 2.9, "pos": [x, y, z] }             a burst at a point in the world
//   { "do": "vfx", "effect": "aura", "at": 3.5, "dur": 1.0, "on": "wiz", "offset": [0, 0.5, 0], "follow": true }
//   optional: "scale" (default 0.3), "speed" (1), "color" ("#rrggbb" or [r, g, b, a] 0..255, multiplies the effect),
//   "seed" (random seed, default from the item's index), "rot" [x, y, z] in degrees, "file" (an .efkefc path instead
//   of a named effect). "dur" ends the effect: its emitters stop and what is left fades out over "fade" seconds
//   (default 0.2; "fade": false lets the live particles finish on their own, which can linger a long time); without
//   "dur" the effect plays out on its own.
//
// Time: Effekseer steps in 1/60 s frames and cannot run backwards, so the whole effect clock is replayed from the
// start whenever a frame is asked for out of order (a shard's first frame, a smear in-between, the frame cache). A
// replayed frame is the same as one reached in order, except that a following effect ("follow") replays at the
// target's current place.
//
// Drawn inside the look's composer, right after the scene (and its lines), into the same buffer and against the same
// depth, so characters in front hide the effect and the glow and grade passes treat it like the rest of the picture.

export const VFX = {
  "toon-hit": "assets/vfx/effekseer/02_Tktk03/ToonHit.efkefc",       // anime impact star with streaks
  "toon-water": "assets/vfx/effekseer/02_Tktk03/ToonWater.efkefc",   // cel-shaded splash
  "light": "assets/vfx/effekseer/02_Tktk03/Light.efkefc",            // a pillar of light
  "aura": "assets/vfx/effekseer/00_Version16/Aura01.efkefc",         // a twisting magic aura
  "barrier": "assets/vfx/effekseer/00_Version16/Barrior01.efkefc",
  "tornado": "assets/vfx/effekseer/00_Version16/ForceFieldTornado.efkefc",
  "sparks": "assets/vfx/effekseer/00_Basic/Simple_Turbulence_Fireworks.efkefc",
};
const STEP = 60;   // Effekseer frames per second

function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error(`vfx: could not load ${src}`)); document.head.appendChild(s); });
}

const rgba = (c) => {
  if (Array.isArray(c)) return [c[0], c[1], c[2], c[3] ?? 255];
  const v = new THREE.Color(c); return [Math.round(v.r * 255), Math.round(v.g * 255), Math.round(v.b * 255), 255];
};

// target(id) -> THREE.Vector3 world position of a character or prop now (stage.js supplies it)
export async function makeVfx({ R, sb, target }) {
  const items = (sb.fx || []).map((f, i) => [f, i]).filter(([f]) => f.do === "vfx");
  if (!items.length) return null;
  await loadScript("/engine/page/vendor/effekseer/effekseer.min.js");
  const eff = globalThis.effekseer;
  await new Promise((res, rej) => eff.initRuntime("/engine/page/vendor/effekseer/effekseer.wasm", res, () => rej(new Error("vfx: the Effekseer runtime did not start"))));
  const ctx = eff.createContext();
  ctx.init(R.getContext(), { instanceMaxCount: 4000, squareMaxCount: 20000 });
  const files = new Map();
  for (const [f] of items) {
    const file = f.file || VFX[f.effect];
    if (!file) throw new Error(`vfx: unknown effect "${f.effect}" (effects: ${Object.keys(VFX).join(", ")})`);
    if (files.has(file)) continue;
    // the effect files are not in the repo (tools/vfx/fetch-effects.sh): a missing one fails here with a clear message
    // (Effekseer itself never calls back on a missing file, and the page would wait for ever)
    if (!(await fetch("/" + file, { method: "HEAD" })).ok) throw new Error(`vfx: ${file} is missing: run tools/vfx/fetch-effects.sh`);
    files.set(file, await new Promise((res, rej) => {
      const timer = setTimeout(() => rej(new Error(`vfx: ${file} did not load in 30 s (a texture or model it names is missing?)`)), 30000);
      const e = ctx.loadEffect("/" + file, 1.0, () => { clearTimeout(timer); res(e); }, (m, p) => { clearTimeout(timer); rej(new Error(`vfx: ${file}: ${m} ${p}`)); });
    }));
  }
  const fps = sb.fps || 30;
  const list = items.map(([f, i]) => ({
    f, i, effect: files.get(f.file || VFX[f.effect]),
    start: Math.round((f.at ?? 0) * STEP), stop: f.dur != null ? Math.round(((f.at ?? 0) + f.dur) * STEP) : Infinity,
    fade: f.dur != null && f.fade !== false ? Math.max(1, Math.round((f.fade ?? 0.2) * STEP)) : 0,
    color: rgba(f.color || [255, 255, 255, 255]), handle: null,
  }));
  const where = (it) => {
    const o = it.f.offset || [0, 0, 0];
    if (it.f.on) { const p = target(it.f.on); if (!p) throw new Error(`vfx: "${it.f.on}" is not a character or prop`); return [p.x + o[0], p.y + o[1], p.z + o[2]]; }
    const p = it.f.pos || [0, 0, 0]; return [p[0] + o[0], p[1] + o[1], p[2] + o[2]];
  };
  let clock = 0;   // Effekseer frames applied since the clip's start
  const reset = () => { ctx.stopAll(); ctx.update(0); for (const it of list) it.handle = null; clock = 0; };
  const step = () => {
    for (const it of list) {
      if (clock === it.start) {
        const h = ctx.play(it.effect, ...where(it)), s = it.f.scale ?? 0.3, r = (it.f.rot || [0, 0, 0]).map((d) => (d * Math.PI) / 180);
        h.setRandomSeed(it.f.seed ?? 1000 + it.i); h.setScale(s, s, s); h.setRotation(...r);
        if (it.f.speed) h.setSpeed(it.f.speed);
        if (it.f.color) h.setAllColor(...it.color);
        it.handle = h;
      } else if (it.handle && clock === it.stop) it.handle.stopRoot();
      if (it.handle && it.fade && clock >= it.stop) {
        // the fade after "dur": everything left dims to nothing, then the effect is gone
        const k = (clock - it.stop) / it.fade;
        if (k >= 1) { it.handle.stop(); it.handle = null; continue; }
        const [r, g, b, a] = it.color; it.handle.setAllColor(r, g, b, Math.round(a * (1 - k)));
      }
      if (it.handle && it.f.follow && clock > it.start) it.handle.setLocation(...where(it));
    }
    ctx.update(1); clock++;
    for (const it of list) if (it.handle && !it.handle.exists) it.handle = null;
  };
  // bring the effect clock to time t (seconds): forward in order, or replay from the start
  const seek = (t) => {
    const want = Math.max(0, Math.round(t * STEP));
    if (want < clock) reset();
    while (clock < want) {
      // nothing alive and nothing starting: jump to the next start
      if (!list.some((it) => it.handle)) { const next = Math.min(...list.map((it) => it.start).filter((s) => s >= clock)); if (!(next < want)) { clock = want; break; } clock = next; }
      step();
    }
  };
  let time = 0;
  const empty = new THREE.Scene();
  const draw = (camera) => {
    seek(time);
    if (!list.some((it) => it.handle)) return false;
    camera.updateMatrixWorld();
    ctx.setProjectionMatrix(camera.projectionMatrix.elements);
    ctx.setCameraMatrix(camera.matrixWorldInverse.elements);
    ctx.draw();
    R.resetState();
    return true;
  };
  // the effects at time t, for the frame cache's key: which are alive and how far along
  const key = (t) => list.filter((it) => { const k = t * STEP; return k >= it.start && k <= (it.stop === Infinity ? it.start + 10 * STEP : it.stop + (it.fade || 4 * STEP)); }).map((it) => [it.i, Math.round(t * STEP) - it.start, it.f.follow ? where(it).map((v) => Math.round(v * 1000)) : 0]);

  class VfxPass extends Pass {
    constructor(camera) { super(); this.camera = camera; this.needsSwap = false; }
    render(renderer, writeBuffer, readBuffer) {
      renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
      if (!draw(this.camera)) return;
      // a multisampled buffer is resolved at the end of three's own render call: an empty one does it after our draw
      const ac = renderer.autoClear; renderer.autoClear = false;
      renderer.setRenderTarget(this.renderToScreen ? null : readBuffer); renderer.render(empty, this.camera);
      renderer.autoClear = ac;
    }
  }
  return {
    set time(t) { time = t; }, get time() { return time; },
    pass: (camera) => new VfxPass(camera),
    // a style without a composer: draw over what is on the canvas
    drawOver: (camera) => { R.setRenderTarget(null); draw(camera); },
    key,
    count: list.length,
  };
}
