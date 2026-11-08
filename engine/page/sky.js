import * as THREE from "three";
import { skyAt, skyMax } from "../shared/sky.js";

// Night outside (Jonny 8 Nov 2026: "when we go night time in the scene the outdoor time should change as well"): when
// the night level (engine/shared/sky.js: the HUD clock, or "sky" keys) rises, the plate fades to its night picture
// (<plate>.night.png, painted by engine/plates/night.py: the same room with a night window and its lamps on) on the
// plate's own relief, the sunlight's dust motes go out, and the frame gets a cool night grade (nightGrade, drawn by
// stage.js over the 3D picture before captions and the HUD) so the cast sits in the same night as the room.
// Everything is a function of story time (__setTicks), so frames stay deterministic.

let on = false;   // a night picture is up: the grade follows it

// adds the night picture over the plate; returns null when the clip never gets dark or the plate has no night picture
export function addNight(scene, sb, setObjs = []) {
  on = false;
  const P = sb.set?.plate, src = P && typeof P === "object" && !P.follow && (typeof P.night === "string" ? P.night : P.night?.src);
  if (!src || skyMax(sb) <= 0) return null;
  const plate = scene.getObjectByName("set-plate");
  if (!plate) return null;
  // custom blending keeps it in the opaque pass, drawn right after the plate on the same surface (set-plate.js follow swap)
  const mat = new THREE.MeshBasicMaterial({ fog: false, toneMapped: false, opacity: 0, transparent: false, depthWrite: false,
    depthFunc: THREE.LessEqualDepth, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor });
  mat.userData.noOutline = true; mat.userData.outlineParameters = { visible: false };
  const mesh = new THREE.Mesh(plate.geometry, mat);
  mesh.name = "set-plate-night"; mesh.renderOrder = plate.renderOrder + 1; mesh.visible = false;
  mesh.position.copy(plate.position); mesh.rotation.copy(plate.rotation); mesh.scale.copy(plate.scale);
  scene.add(mesh);
  // the plate's relief replaces its geometry when its pictures load: share it once they have
  const before = [...(globalThis.__loads || [])];
  (globalThis.__loads ||= []).push(Promise.all([...before, new THREE.TextureLoader().loadAsync(`/${src.replace(/^\/+/, "")}`)]).then((r) => {
    const map = r[r.length - 1];
    map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
    mat.map = map; mat.needsUpdate = true;
    mesh.geometry = plate.geometry; mesh.position.copy(plate.position); mesh.rotation.copy(plate.rotation); mesh.scale.copy(plate.scale);
  }));
  const dust = scene.getObjectByName("set-dust"), dustO = dust ? dust.material.opacity : 0;
  // the 3D set around the plate (the floor, the backdrop colour past its edges) goes to night with it: each material's
  // colours are kept the first time it is seen (the look may dress the set after this is built) and scaled toward the
  // night colour
  const N = new THREE.Color(sb.set?.nightSet || "#7c7fa8"), bg = scene.background?.isColor ? scene.background.clone() : null, tmp = new THREE.Color();
  const tint = (m) => {
    const B = (m.userData.night0 ||= { color: m.color?.isColor ? m.color.clone() : null,
      u: Object.entries(m.uniforms || {}).filter(([, u]) => u.value?.isColor).map(([k, u]) => [k, u.value.clone()]) });
    if (B.color) m.color.copy(B.color).multiply(tmp);
    for (const [k, c] of B.u) m.uniforms[k].value.copy(c).multiply(tmp);
  };
  (globalThis.__setTicks ||= []).push((t) => {
    const k = skyAt(sb, t);
    mat.opacity = k; mesh.visible = k > 0.002;
    if (dust) { dust.material.opacity = dustO * (1 - k); dust.visible = k < 0.998; }
    tmp.setRGB(1 + (N.r - 1) * k, 1 + (N.g - 1) * k, 1 + (N.b - 1) * k);
    for (const root of setObjs) root.traverse((o) => {
      if (o.isLight || /^set-(plate|dust)/.test(o.name || "")) return;
      for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) tint(m);
    });
    if (bg) scene.background.copy(bg).multiply(tmp);
  });
  on = true;
  return mesh;
}
export const nightOn = () => on;

// the cast and the room under the same night: a cool multiply and a little less colour, scaled by the night level
// ("sky": false or "set": { "nightGrade": false } turns it off; a number scales it)
export function nightGrade(ctx, sb, t, W, H) {
  const g = sb.set?.nightGrade ?? 1;
  if (!g || !on) return;
  const k = skyAt(sb, t) * g;
  if (k <= 0.002) return;
  ctx.save();
  ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = Math.min(1, 0.5 * k);
  ctx.fillStyle = "#7d86c8"; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "saturation"; ctx.globalAlpha = Math.min(1, 0.18 * k);
  ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
