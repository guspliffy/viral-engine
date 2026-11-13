import * as THREE from "three";
import { InkEffect } from "./ink.js";
import { OutlineEffect } from "three/addons/effects/OutlineEffect.js";

// There's a catch EP08 "pause you" (13 Nov 2026, task T3; storyboards/series/what-if/08-pause-you/DESIGN.md section 4).
//   silvertray   a round silver serving tray whose floor is a real mirror: it shows the room as the look draws it
//                (the same toon shading and ink lines as the main picture, minus the post passes, which then run over
//                the whole frame anyway), mixed with 15% of the floor colour, cel-flat, with one fixed pale streak.
//                The reflection is true (a flat mirror): looking down into it, what stands beyond it shows head-down.
//                It follows the tray's real orientation (tip / tilt / rot, a grab), so held up as a shield it shows
//                what it faces.
//     Size       0.36 across the rim (r 0.18), mirror floor 0.31 across, rolled rim 0.025 wide and 0.018 high, two flat
//                D-loop handles on local +x and -x (0.045 out from the rim, 0.09 wide, bar 0.014): 0.45 across them.
//                Put the handles left and right as the camera sees it (rot 0 with a camera on +z).
//     Origin     its bottom centre, lying flat, the mirror facing +y (0.006 up).
//     spec.r       0.18   rim radius; every size scales with it (the grips below are for 0.18: resize a held tray
//                         with spec.scale instead, which the grips follow)
//     spec.handles true   false: no handles
//     spec.reflect 0.85   mirror strength 0..1 (0: the plain floor colour #dfe6ee)
//     spec.res     512    the reflection's render-target size in px (its longer side; halved in a draft). It covers
//                         only the tray's box on screen, so 512 is sharp up to a tray ~500 px across; use 1024 for the
//                         panel 10 close-up (tray 700+ px)
//     spec.ceiling "#efe7da" what the mirror shows where the set has nothing and no background (an open-top set)
//     spec.ink     {}     only if the storyboard's set.ink overrides far / ref / min / max: the same numbers here, so
//                         the reflected lines thin with distance like the main ones
//     ps.scroll    0      slides the streak across the floor (metres, the 42 s tilt: 0.10 over 8 frames)
//   TRAY_GRIPS.silvertray (prop frame, metres, r 0.18):
//     handleL [-0.218, 0.012, 0] / handleR [0.218, 0.012, 0]: the outer bar of each D-loop, where a glove closes on it
//                (a two-hand hold, or one hand carrying or raising it by one handle);
//     rim     [0, 0.012, 0.176]: the rolled rim's front edge (+z), a one-hand hold.
// Cost: one extra scene render (colour + ink hulls) into the render target for each frame the mirror face is on screen
// and facing the camera; nothing when it is off screen or seen from behind. Override passes (pause mask, ink impact,
// silhouettes, ids, bokeh depth) skip it. Nothing is kept between frames: the target is redrawn from the current pose
// every time the floor is drawn, so any frame in any order gives the same picture.
// Known limit: the pause look's frozen grade is a 2D composite of the main view, so a frozen character's reflection
// keeps full colour.

const BASE = 0.18;
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }

const MIRROR_VS = `
uniform mat4 textureMatrix;
varying vec4 vUv4;
varying vec2 vLoc;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vUv4 = textureMatrix * wp;
  vLoc = position.xz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const MIRROR_FS = `
uniform sampler2D tMirror;
uniform vec3 uBase;
uniform float uK;
uniform vec2 uStreakN;
uniform float uStreakOff;
uniform float uStreakW;
varying vec4 vUv4;
varying vec2 vLoc;
void main() {
  vec3 c = uBase;
  if (uK > 0.0) c = mix(uBase, texture2DProj(tMirror, vUv4).rgb, uK);
  float d = abs(dot(vLoc, uStreakN) - uStreakOff), aa = fwidth(d);
  c = mix(c, vec3(1.0), 0.35 * (1.0 - smoothstep(uStreakW * 0.5 - aa, uStreakW * 0.5 + aa, d)));
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

// one mirror is drawn at a time: a tray seen in another tray's reflection shows its plain floor colour
let busy = false;
// the look's ink: InkEffect (set.ink, line widths in px) or three's OutlineEffect; found once from the converted
// materials (the look is fixed for the whole render)
let inkMode = null;
function findInkMode(scene) {
  let mode = null;
  scene.traverse((o) => {
    if (mode || !o.isMesh) return;
    for (const m of [].concat(o.material)) { const p = m && m.isMeshToonMaterial && m.userData.outlineParameters; if (p && p.visible !== false && p.thickness > 0) { mode = p.thickness > 0.1 ? "ink" : "outline"; break; } }
  });
  return mode;
}

function silvertray(P) {
  const k = (P.spec.r ?? BASE) / BASE, s = P.spec;
  const RF = 0.155 * k, FY = 0.006 * k;
  // the body: underside, the rolled rim and its lip down to the floor
  const under = mesh(new THREE.CircleGeometry(0.173 * k, 48), mat("#7b8794", { roughness: 0.5 }), P.whole, 0, 0, 0);
  under.rotation.x = Math.PI / 2;
  const prof = [[0.172, 0], [0.1775, 0.0025], [0.1803, 0.008], [0.1792, 0.0138], [0.1755, 0.0172], [0.1695, 0.018], [0.1635, 0.0163], [0.1585, 0.0118], [0.1555, 0.0075], [0.1545, 0.006]]
    .map(([r, y]) => new THREE.Vector2(r * k, y * k));
  mesh(new THREE.LatheGeometry(prof, 64), mat("#e9eef3", { roughness: 0.3 }), P.whole);
  // the handles: a flat D-loop each side (round bar 0.014), lying in the rim's plane
  if (s.handles !== false) {
    const hm = mat("#c3ccd6", { roughness: 0.3 }), HY = 0.012 * k;
    const xb = 0.182 * k, xo = 0.218 * k, zh = 0.038 * k, rc = 0.016 * k, pts = [];
    pts.push([xb, -zh], [xo - rc, -zh]);
    for (let i = 1; i < 6; i++) { const a = -Math.PI / 2 + (i / 6) * (Math.PI / 2); pts.push([xo - rc + Math.cos(a) * rc, -zh + rc + Math.sin(a) * rc]); }
    pts.push([xo, -zh + rc], [xo, 0], [xo, zh - rc]);
    for (let i = 1; i < 6; i++) { const a = (i / 6) * (Math.PI / 2); pts.push([xo - rc + Math.cos(a) * rc, zh - rc + Math.sin(a) * rc]); }
    pts.push([xo - rc, zh], [xb, zh], [xb, 0]);
    for (const sx of [1, -1]) {
      const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(sx * x, HY, z)), true, "centripetal");
      mesh(new THREE.TubeGeometry(curve, 72, 0.007 * k, 10, true), hm, P.whole);
    }
  }

  // the mirror floor
  const rt = new THREE.WebGLRenderTarget(16, 16, { type: THREE.HalfFloatType, samples: 0 });
  const textureMatrix = new THREE.Matrix4(), streakA = (25 * Math.PI) / 180;
  const fm = new THREE.ShaderMaterial({
    uniforms: {
      tMirror: { value: rt.texture }, textureMatrix: { value: textureMatrix }, uBase: { value: new THREE.Color("#dfe6ee") },
      uK: { value: 0 }, uStreakN: { value: new THREE.Vector2(-Math.sin(streakA), Math.cos(streakA)) }, uStreakOff: { value: 0.085 * k }, uStreakW: { value: 0.05 * k },
    },
    vertexShader: MIRROR_VS, fragmentShader: MIRROR_FS, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  });
  fm.userData.outlineParameters = { visible: false }; fm.userData.noOutline = true;
  const floorGeo = new THREE.CircleGeometry(RF, 64); floorGeo.rotateX(-Math.PI / 2);
  const floor = new THREE.Mesh(floorGeo, fm); floor.position.y = FY; floor.castShadow = false; floor.receiveShadow = false; P.whole.add(floor);
  const strength = Math.max(0, Math.min(1, s.reflect ?? 0.85)), res = s.res ?? 512, ceiling = new THREE.Color(s.ceiling || "#efe7da");
  const inkSpec = { far: 0.3, ref: 5, min: 0.55, max: 1.6, ...(s.ink || {}) };

  const cams = new WeakMap(), ring = [];
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; ring.push(new THREE.Vector3(Math.cos(a) * RF, 0, Math.sin(a) * RF)); }
  const nrm = new THREE.Vector3(), mpos = new THREE.Vector3(), cpos = new THREE.Vector3(), rot = new THREE.Matrix4(), look = new THREE.Vector3();
  const view = new THREE.Vector3(), target = new THREE.Vector3(), plane = new THREE.Plane(), clip = new THREE.Vector4(), q = new THREE.Vector4();
  const vp = new THREE.Matrix4(), v = new THREE.Vector4(), size = new THREE.Vector2(), cc = new THREE.Color();
  let fx = null, fxMode = null;

  floor.onBeforeRender = function (renderer, scene, camera, geometry, material) {
    // override passes (pause mask, impact ink, silhouettes, ids, depth) draw their own material: nothing to reflect
    if (material !== fm) return;
    fm.uniforms.uK.value = 0;
    if (busy || strength <= 0) return;
    floor.updateWorldMatrix(true, false);
    mpos.setFromMatrixPosition(floor.matrixWorld); cpos.setFromMatrixPosition(camera.matrixWorld);
    rot.extractRotation(floor.matrixWorld); nrm.set(0, 1, 0).applyMatrix4(rot).normalize();
    view.subVectors(mpos, cpos);
    if (view.dot(nrm) > 0) return;   // seen from behind
    // the mirrored camera (three's Reflector, MIT): the camera reflected in the floor's plane
    let rc = cams.get(camera); if (!rc) { rc = camera.clone(); cams.set(camera, rc); }
    view.reflect(nrm).negate().add(mpos);
    rot.extractRotation(camera.matrixWorld);
    look.set(0, 0, -1).applyMatrix4(rot).add(cpos);
    target.subVectors(mpos, look).reflect(nrm).negate().add(mpos);
    rc.position.copy(view); rc.up.set(0, 1, 0).applyMatrix4(rot).reflect(nrm); rc.lookAt(target);
    rc.far = camera.far; rc.near = camera.near; rc.updateMatrixWorld(true);
    rc.projectionMatrix.copy(camera.projectionMatrix); rc.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    // the floor's box on screen (the mirror floor projects to the same place for both cameras): the target covers
    // only that box, so its pixels all land on the tray
    vp.multiplyMatrices(rc.projectionMatrix, rc.matrixWorldInverse);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, behind = false;
    for (const p of ring) {
      const w = p.clone().applyMatrix4(floor.matrixWorld); v.set(w.x, w.y, w.z, 1).applyMatrix4(vp);
      if (v.w <= 1e-4) { behind = true; break; }
      const x = v.x / v.w, y = v.y / v.w; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    if (behind) { x0 = -1; x1 = 1; y0 = -1; y1 = 1; }
    const mx = (x1 - x0) * 0.02 + 0.004, my = (y1 - y0) * 0.02 + 0.004;
    x0 = Math.max(-1, x0 - mx); x1 = Math.min(1, x1 + mx); y0 = Math.max(-1, y0 - my); y1 = Math.min(1, y1 + my);
    if (x1 <= x0 || y1 <= y0) return;
    renderer.getDrawingBufferSize(size);
    const pr = renderer.getPixelRatio(), bw = ((x1 - x0) / 2) * size.x, bh = ((y1 - y0) / 2) * size.y;
    const r16 = (n) => Math.max(16, Math.round(n / 16) * 16), long = Math.min(r16(res * Math.min(1, pr)), r16(Math.max(bw, bh)));
    const tw = bw >= bh ? long : r16((long * bw) / bh), th = bw >= bh ? r16((long * bh) / bw) : long;
    // widen the short side of the box so a target pixel is square on screen
    if (bw / bh < tw / th) { const c = (x0 + x1) / 2, h = ((bh * tw) / th / size.x); x0 = c - h; x1 = c + h; }
    else { const c = (y0 + y1) / 2, h = ((bw * th) / tw / size.y); y0 = c - h; y1 = c + h; }
    const samples = pr >= 1 ? 4 : 0;
    if (rt.width !== tw || rt.height !== th) rt.setSize(tw, th);
    if (rt.samples !== samples) { rt.samples = samples; rt.dispose(); }
    // the texture lookup (crop applied below, to both)
    const E = rc.projectionMatrix.elements;
    // oblique near plane on the mirror (Lengyel): nothing behind the floor shows in it
    plane.setFromNormalAndCoplanarPoint(nrm, mpos).applyMatrix4(rc.matrixWorldInverse);
    clip.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
    q.set((Math.sign(clip.x) + E[8]) / E[0], (Math.sign(clip.y) + E[9]) / E[5], -1, (1 + E[10]) / E[14]);
    clip.multiplyScalar(2 / clip.dot(q));
    E[2] = clip.x; E[6] = clip.y; E[10] = clip.z + 1; E[14] = clip.w;
    // the crop: NDC [x0, x1] x [y0, y1] -> [-1, 1] (rows 0 and 1 only, so the clip plane above is kept)
    const sx = 2 / (x1 - x0), tx = -(x1 + x0) / (x1 - x0), sy = 2 / (y1 - y0), ty = -(y1 + y0) / (y1 - y0);
    for (const c of [0, 4, 8, 12]) { E[c] = sx * E[c] + tx * E[c + 3]; E[c + 1] = sy * E[c + 1] + ty * E[c + 3]; }
    rc.projectionMatrixInverse.copy(rc.projectionMatrix).invert();
    textureMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(rc.projectionMatrix).multiply(rc.matrixWorldInverse);

    // the look's own lines: InkEffect widths are screen px; the crop magnifies NDC by M, so the far-thinning factor
    // carries M (pow(ref' / w, p) = M pow(ref / w, p) with ref' = ref M^(1/p), its clamp scaled by M)
    if (inkMode === null) inkMode = findInkMode(scene) || "none";
    const mode = inkMode;
    if (fxMode !== mode) {
      fxMode = mode;
      fx = mode === "ink" ? new InkEffect(renderer, { defaultThickness: 2.5, defaultColor: [0.12, 0.08, 0.07], defaultAlpha: 1, defaultKeepAlive: true, ink: { res: [tw, th], ref: 0, pow: 0.3, min: 1, max: 1 } })
        : mode === "outline" ? new OutlineEffect(renderer, { defaultThickness: 0.0046, defaultColor: [0.12, 0.08, 0.07], defaultAlpha: 1, defaultKeepAlive: true }) : null;
    }
    if (fx && fx.ink) {
      const M = 2 / (x1 - x0), p = inkSpec.far || 0.3;
      Object.assign(fx.ink, { res: [tw, th], pow: p, ref: inkSpec.far ? inkSpec.ref * Math.pow(M, 1 / p) : 1, min: inkSpec.far ? inkSpec.min * M : M, max: inkSpec.far ? inkSpec.max * M : M });
    }

    const prevRT = renderer.getRenderTarget(), prevAuto = renderer.autoClear, prevShadow = renderer.shadowMap.autoUpdate, prevXr = renderer.xr.enabled;
    renderer.getClearColor(cc); const prevAlpha = renderer.getClearAlpha();
    busy = true; floor.visible = false;
    try {
      renderer.xr.enabled = false; renderer.shadowMap.autoUpdate = false;   // this frame's shadow maps are already drawn
      renderer.setRenderTarget(rt); renderer.setClearColor(ceiling, 1);
      renderer.state.buffers.depth.setMask(true); renderer.clear();
      renderer.autoClear = false;
      if (fx) { fx.autoClear = false; fx.render(scene, rc); } else renderer.render(scene, rc);
    } finally {
      busy = false; floor.visible = true;
      renderer.autoClear = prevAuto; renderer.shadowMap.autoUpdate = prevShadow; renderer.xr.enabled = prevXr;
      renderer.setClearColor(cc, prevAlpha); renderer.setRenderTarget(prevRT);
      if (camera.viewport !== undefined) renderer.state.viewport(camera.viewport);
    }
    fm.uniforms.uK.value = strength;
  };

  return {
    grip: 0,
    apply(ps) {
      fm.uniforms.uStreakOff.value = (0.085 + (ps.scroll || 0)) * k;
      // the look's light rig (light.js, "lighting": 2) reads this prop's world box for its contact shade before the
      // frame's render refreshes the matrices: without this a frame drawn after one with the tray elsewhere differed
      P.root.updateMatrixWorld(true);
    },
  };
}

export const TRAY_KINDS = { silvertray };
export const TRAY_GRIPS = {
  silvertray: { handleL: [-0.218, 0.012, 0], handleR: [0.218, 0.012, 0], rim: [0, 0.012, 0.176] },
};
