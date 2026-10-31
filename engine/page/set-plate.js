import * as THREE from "three";
import { rad, loopNow } from "./util.js";

// A painted background plate: a picture of the room (painted once per set, e.g. by the image model in engine/plates)
// hung as a backdrop behind the 3D stage, so the characters and the props they touch stay 3D in front of it.
// Use it on a "plain" set (its floor takes the shadows).
//   spec.plate: { src: "assets/plates/<name>.png", z: -2.2 (where it hangs), center: [x, y] (its middle),
//                 height: 3.2 (metres; the width follows the picture), tint: "#ffffff" (multiplies it),
//                 depth: "<name>.depth.png", relief: 0.6 (metres the nearest parts come forward),
//                 eye: [x, y, z] (where the picture looks right from; default the camera at 0 s),
//                 motion: "<name>.motion.png" (red = leaves sway, green = sunlight shimmers),
//                 dust: 40 (motes floating in the light; default 40 in golden light, else 0),
//                 dustBox: [[x0, y0, z0], [x1, y1, z1]] (default: the upper middle, a little in front of the plate),
//                 dustSize: 0.04 (m), dustOpacity: 0.85, dustColor: "#ffe0a0",
//                 follow: { push: 0.04, shift: [0, 0], cover: 1.04 } (a backdrop that rides with the camera: it fills
//                 the frame behind everything, always facing the lens, for a long ride the picture can't hold still
//                 for; push grows it by that fraction a second, shift moves it in frame heights. No relief, no dust) }
//   spec.plates: [{ src, center: [x, y], z, height, turn: -90 }]: more walls, for shots that look past the back plate's
//                 edge (a camera from the side). turn (degrees round y) swings the picture round its middle: -90 faces
//                 -x (a right-hand wall), 90 faces +x. Flat (no relief or motion) and no dust unless asked.
// Depth and motion are on by default: engine/load.mjs fills them in when the files next to the picture exist (false
// turns one off).
// depth.png and motion.png come from engine/plates/depth.py. With relief the plate becomes a relief: each point moves
// toward the eye by its depth, so from the eye it looks exactly like the picture and a moving camera sees parallax.
// Everything moving is a function of the frame time (globalThis.__setTicks, called by stage.js pose), so renders
// stay deterministic. The pictures load before the first frame: stage.js waits for globalThis.__loads.
export function addPlate(scene, P, ctx = {}) {
  if (globalThis.__DIAG?.silhouette) return;   // debug silhouettes: shapes on a plain background
  const mat = new THREE.MeshBasicMaterial({ color: P.tint || "#ffffff", fog: false, toneMapped: false });
  mat.userData.noOutline = true;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  const [x, y] = P.center || [0, (P.height ?? 3.2) / 2], z = P.z ?? -2.2, h = P.height ?? 3.2;
  mesh.name = "set-plate"; scene.add(mesh);
  const tex = (src) => new THREE.TextureLoader().loadAsync(`/${src.replace(/^\/+/, "")}`);
  const loads = [tex(P.src), P.depth && tex(P.depth), P.motion && tex(P.motion)];
  P = { eye: ctx.eye, ...P };
  if (P.follow) return followPlate(scene, mesh, mat, loads, P);
  const load = Promise.all(loads).then(([map, depth, motion]) => {
    map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
    const w = h * map.image.width / map.image.height;
    if (P.turn) { mesh.geometry = new THREE.PlaneGeometry(w, h); mesh.position.set(x, y, z); mesh.rotation.y = THREE.MathUtils.degToRad(P.turn); }
    else mesh.geometry = depth ? relief(depth.image, w, h, x, y, z, P) : new THREE.PlaneGeometry(w, h).translate(x, y, z);
    mat.map = map;
    if (motion) animate(mat, motion, map.image.width);
    mat.needsUpdate = true;
  });
  (globalThis.__loads ||= []).push(load);
  const motes = P.dust ?? (ctx.light === "golden" ? 40 : 0);
  if (motes) {
    const half = h * 0.4, box = [[x - half * 0.56, y, z + 0.5], [x + half * 0.56, y + half, z + 1.0]];
    dust(scene, { dustBox: box, ...P, dust: motes });
  }
  return mesh;
}

// a painted backdrop pinned to the camera: drawn first and behind everything (no depth), sized to cover the view
// (the set's own sky domes and painted rings, back-facing and unfogged, are hidden; fog: [colour, near, far] fades
// the 3D ground into the picture)
function followPlate(scene, mesh, mat, loads, P) {
  const F = P.follow === true ? {} : P.follow, now = { t: 0 }, v = new THREE.Vector3();
  scene.traverse((o) => { if (o !== mesh && o.isMesh && o.material?.side === THREE.BackSide && o.material.fog === false) o.visible = false; });
  if (F.fog) scene.fog = new THREE.Fog(...F.fog);
  (globalThis.__setTicks ||= []).push((t) => { now.t = t; });
  Object.assign(mat, { depthTest: false, depthWrite: false });
  mesh.renderOrder = -1000; mesh.frustumCulled = false; mesh.receiveShadow = false;
  let aspect = 9 / 16;
  const load = Promise.all(loads).then(([map, , motion]) => {
    map.colorSpace = THREE.SRGBColorSpace; mat.map = map; aspect = map.image.width / map.image.height;
    if (motion) animate(mat, motion, map.image.width);
    mat.needsUpdate = true;
  });
  (globalThis.__loads ||= []).push(load);
  mesh.onBeforeRender = (r, s, cam) => {
    const d = (cam.near + cam.far) / 2, viewH = 2 * d * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
    const k = Math.max(viewH, viewH * cam.aspect / aspect) * (F.cover ?? 1.04) * (1 + (F.push ?? 0) * now.t), [sx, sy] = F.shift || [0, 0];
    mesh.quaternion.copy(cam.quaternion);
    mesh.position.copy(cam.position).add(v.set(sx * viewH, sy * viewH, -d).applyQuaternion(cam.quaternion));
    mesh.scale.set(k * aspect, k, 1);
    mesh.updateMatrixWorld();
  };
  return mesh;
}

// a grid over the plate, each vertex slid along its ray to the eye until it is depth * relief metres nearer
function relief(img, w, h, x, y, z, P) {
  const nx = 96, ny = Math.round(nx * h / w), cv = document.createElement("canvas");
  cv.width = nx + 1; cv.height = ny + 1;
  const g = cv.getContext("2d", { willReadFrequently: true });
  g.filter = "blur(1px)"; g.drawImage(img, 0, 0, nx + 1, ny + 1);   // soft depth: edges stretch instead of tearing
  const px = g.getImageData(0, 0, nx + 1, ny + 1).data;
  const geo = new THREE.PlaneGeometry(w, h, nx, ny).translate(x, y, z), pos = geo.attributes.position;
  const eye = new THREE.Vector3().fromArray(P.eye || [0, 1.2, 4.4]), v = new THREE.Vector3(), r = P.relief ?? 0.6;
  for (let i = 0; i < pos.count; i++) {
    const d = px[4 * i] / 255;   // PlaneGeometry runs row by row from the top left, like the image
    v.fromBufferAttribute(pos, i);
    v.lerp(eye, (d * r) / (eye.z - v.z));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  return geo;
}

// leaves sway and sunlight shimmers, read from the motion mask, in the plate's own shader. With loop-safe idle
// (util.js loopNow) every rhythm, the shimmer's drift included, turns a whole number of times over the clip.
function animate(mat, motion, width) {
  const time = { value: 0 };
  (globalThis.__setTicks ||= []).push((t) => { time.value = t; });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uTime: time, uMotion: { value: motion }, uPx: { value: 1 / width } });
    const f = (w) => rad(w).toFixed(6);
    // the shimmer's drift (q moves by 0.21 and -0.08 a second) folded into the speed of each wave it feeds
    const shimmer = loopNow() ? /* glsl */`
      vec2 q = vMapUv * vec2(5.0, 9.0);
      float n = sin(q.x * 2.3 + uTime * ${f(0.21 * 2.3)} + sin(q.y * 1.7 + uTime * ${f(0.6 - 0.08 * 1.7)})) * sin(q.y * 1.9 + uTime * ${f(-0.08 * 1.9)} - sin(q.x * 1.3 + uTime * ${f(0.21 * 1.3 - 0.4)}));` : /* glsl */`
      vec2 q = vMapUv * vec2(5.0, 9.0) + vec2(uTime * 0.21, -uTime * 0.08);
      float n = sin(q.x * 2.3 + sin(q.y * 1.7 + uTime * 0.6)) * sin(q.y * 1.9 - sin(q.x * 1.3 - uTime * 0.4));`;
    sh.fragmentShader = sh.fragmentShader.replace("#include <map_fragment>", /* glsl */`
      vec4 mo = texture2D(uMotion, vMapUv);
      float ph = vMapUv.x * 23.0 + vMapUv.y * 11.0;   // nearby leaves move together, far ones out of step
      vec2 sway = vec2(sin(uTime * ${loopNow() ? f(1.3) : "1.3"} + ph) * 0.7 + sin(uTime * ${loopNow() ? f(3.7) : "3.7"} + ph * 2.1) * 0.3,
                       sin(uTime * ${loopNow() ? f(1.9) : "1.9"} + ph * 1.3) * 0.35) * uPx * 3.0;
      vec4 sampledDiffuseColor = texture2D(map, vMapUv + sway * mo.r);${shimmer}
      sampledDiffuseColor.rgb *= 1.0 + mo.g * n * 0.07;   // leaf shadows passing over the sun patches
      diffuseColor *= sampledDiffuseColor;`);
    sh.fragmentShader = "uniform float uTime; uniform sampler2D uMotion; uniform float uPx;\n" + sh.fragmentShader;
  };
  mat.customProgramCacheKey = () => (loopNow() ? `set-plate-motion-loop-${loopNow()}` : "set-plate-motion");
}

// warm dust motes drifting in the sunlight: fixed starting points from a seeded hash, moved by the frame time
function dust(scene, P) {
  const n = P.dust === true ? 40 : P.dust, [a, b] = P.dustBox || [[-1.3, 1.25, -2.0], [0.5, 2.5, -1.4]];
  const hash = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const seed = Array.from({ length: n }, (_, i) => [0, 1, 2, 3, 4].map((k) => hash(i * 5 + k)));
  const pos = new Float32Array(n * 3), geo = new THREE.BufferGeometry();
  const col = new Float32Array(n * 3);   // additive, so a darker colour is a fainter mote: they fade at the box edges
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const dot = document.createElement("canvas"); dot.width = dot.height = 32;
  const g = dot.getContext("2d"), grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.4, "rgba(255,255,255,0.5)"); grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 32, 32);
  const mat = new THREE.PointsMaterial({ color: P.dustColor || "#ffe0a0", size: P.dustSize ?? 0.04, map: new THREE.CanvasTexture(dot),
    vertexColors: true, transparent: true, opacity: P.dustOpacity ?? 0.85, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });
  mat.userData.outlineParameters = { visible: false };
  const pts = new THREE.Points(geo, mat); pts.name = "set-dust"; pts.frustumCulled = false; scene.add(pts);
  const wrap = (v, lo, hi) => lo + ((((v - lo) % (hi - lo)) + (hi - lo)) % (hi - lo));
  // loop-safe idle: a mote drifts a whole number of box widths over the clip (none when that rounds to 0), and bobs
  // and twinkles a whole number of times
  const L = loopNow(), drift = (v, span) => (L ? (Math.round((v * L) / span) * span) / L : v);
  const tick = (t) => {
    for (let i = 0; i < n; i++) {
      const [s0, s1, s2, s3, s4] = seed[i], f = 0.5 + s3;
      if (L) {
        pos[3 * i] = wrap(a[0] + s0 * (b[0] - a[0]) + t * drift(0.025 * f, b[0] - a[0]) + Math.sin(t * rad(0.7 * f) + s4 * 6.3) * 0.03, a[0], b[0]);
        pos[3 * i + 1] = wrap(a[1] + s1 * (b[1] - a[1]) - t * drift(0.012 * f, b[1] - a[1]) + Math.sin(t * rad(0.5 * f) + s3 * 6.3) * 0.04, a[1], b[1]);
      } else {
        pos[3 * i] = wrap(a[0] + s0 * (b[0] - a[0]) + t * 0.025 * f + Math.sin(t * 0.7 * f + s4 * 6.3) * 0.03, a[0], b[0]);
        pos[3 * i + 1] = wrap(a[1] + s1 * (b[1] - a[1]) - t * 0.012 * f + Math.sin(t * 0.5 * f + s3 * 6.3) * 0.04, a[1], b[1]);
      }
      pos[3 * i + 2] = a[2] + s2 * (b[2] - a[2]);
      const ex = (pos[3 * i] - a[0]) / (b[0] - a[0]), ey = (pos[3 * i + 1] - a[1]) / (b[1] - a[1]);
      const k = Math.min(1, ex * 6, (1 - ex) * 6, ey * 6, (1 - ey) * 6) * (0.6 + 0.4 * Math.sin(L ? t * rad(1.1 * f) + s0 * 6.3 : t * 1.1 * f + s0 * 6.3));
      col[3 * i] = col[3 * i + 1] = col[3 * i + 2] = Math.max(0, k);
    }
    geo.attributes.position.needsUpdate = geo.attributes.color.needsUpdate = true;
  };
  tick(0); (globalThis.__setTicks ||= []).push(tick);
}
