import * as THREE from "three";
import { animate } from "./set-plate.js";

// A layered painted environment (set "type": "env", "env": "<name>"; built by engine/plates/env.py from one painting,
// see assets/environments/README.md). The painting is cut into the layers an anime background artist paints on
// separate cels: the sky, far hills, a band of trees, near objects, and the ground. Each layer hangs at its own
// distance on the painting camera's rays, so from that camera the layers add up to the painting exactly, and any
// other camera sees real parallax: near things slide past far ones. The ground is a real floor at y 0 carrying the
// painted path (each vertex sits where its pixel's ray meets the floor), so feet, shadows and 3D props touch the path
// where it is painted. One painting gives one palette and one light direction for every layer; the 3D key light
// comes from the same env.json (engine/load.mjs), so the cast is lit from where the painting's sun is.
//
// spec.envData (filled in by engine/load.mjs from assets/environments/<name>/env.json): eye, ground, cards, palette,
// light, sway. Storyboard options on set: "sway": 1 (leaf and grass motion strength, 0 = still), "shadow": 0.3 (how
// dark the cast's shadows fall on the painted ground), "layers": ["near", ...] (only these cards: a review tool).
// The camera must stay where the layers cover the frame: engine/load.mjs refuses a storyboard whose camera shows a
// layer's edge (qa/env.mjs prints each frame's coverage and the safe camera range).
export function buildEnv(scene, spec) {
  const E = spec.envData;
  if (!E) throw new Error(`set env "${spec.env}": env.json not loaded (engine/load.mjs fills spec.envData)`);
  const dir = `/${E.dir.replace(/^\/+/, "")}`, cam = envCamera(E);
  const [W, H] = E.size, [PX, PY] = E.pad, pw = W + 2 * PX, ph = H + 2 * PY;
  const sway = (spec.sway ?? 1) * (E.sway ?? 1);
  scene.background = new THREE.Color(E.palette?.find((p) => /^#[89a-f]/i.test(p.color))?.color || "#a8c8e8");
  const loader = new THREE.TextureLoader(), loads = [];
  const tex = (src) => { const p = loader.loadAsync(`${dir}/${src}`).then((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }); loads.push(p); return p; };
  const raw = (src) => { const p = loader.loadAsync(`${dir}/${src}`); loads.push(p); return p; };
  const only = spec.layers && new Set(spec.layers);

  // ---- the cards, far to near: a plane square to the painting camera's view at the layer's distance
  for (const c of E.cards) {
    if (only && !only.has(c.name)) continue;
    // a card is a strip of columns; each column hangs at the distance where that column of the layer meets the
    // painted floor (c.foot, env.py), so a bank along the road is a curved fence standing on the road's edge and its
    // foot stays on the floor from any camera. Without a foot (far hills) the columns all hang at c.z.
    const [x0, y0, x1, y1] = c.rect, foot = c.foot || [c.z, c.z], n = foot.length;
    const at = (u, v, z) => cam.ray(u, v).multiplyScalar(z / cam.f).add(cam.pos);
    // rows too: a tall quad whose two sides hang at different distances is not flat, and its two triangles would map
    // the picture differently (a sawtooth through the leaves); small cells keep that error under a pixel
    const rows = c.foot ? 64 : 1, g = new THREE.BufferGeometry(), p = [], uvs = [], ix = [];
    for (let i = 0; i < n; i++) {
      const s = i / (n - 1), u = x0 + (x1 - x0) * s;
      for (let j = 0; j <= rows; j++) { const t = j / rows; p.push(...at(u, y1 + (y0 - y1) * t, foot[i]).toArray()); uvs.push(s, t); }
      if (i) for (let j = 0; j < rows; j++) { const a = (i - 1) * (rows + 1) + j, b = i * (rows + 1) + j; ix.push(a, b, b + 1, a, b + 1, a + 1); }
    }
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(ix);
    const mat = new THREE.MeshBasicMaterial({ transparent: !c.sky, depthWrite: !!c.sky, fog: false, toneMapped: false, side: THREE.DoubleSide });
    mat.userData.noOutline = true;
    const mesh = new THREE.Mesh(g, mat);
    mesh.name = `set-env-${c.name}`; mesh.renderOrder = -500 + Math.round(-c.z); mesh.frustumCulled = false;
    scene.add(mesh);
    Promise.all([tex(c.src), c.motion && sway > 0 && raw(c.motion)]).then(([map, motion]) => {
      mat.map = map;
      if (motion) animate(mat, motion, x1 - x0, { amp: 3 * sway, key: `env-${c.name}` });
      mat.needsUpdate = true;
    });
  }

  // ---- the ground: a grid laid out in picture space (rows from the floor's far edge down to the bottom of the pad),
  // each vertex dropped along its ray onto y 0, its texture coordinate the pixel it came from
  const G = E.ground, vFar = G.row * H, nx = 64, ny = 90;
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= ny; j++) {
    // rows packed toward the far edge, where one row of pixels covers metres of floor
    const s = j / ny, v = vFar + (H + PY - vFar) * s * s;
    for (let i = 0; i <= nx; i++) {
      const u = -PX + (pw * i) / nx, P = cam.floor(u, v);
      pos.push(P.x, 0, P.z); uv.push((u + PX) / pw, 1 - (v + PY) / ph);
    }
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + nx + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const gg = new THREE.BufferGeometry();
  gg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); gg.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); gg.setIndex(idx);
  gg.computeVertexNormals();
  const gmat = new THREE.MeshBasicMaterial({ fog: false, toneMapped: false });
  gmat.userData.noOutline = true;
  const ground = new THREE.Mesh(gg, gmat);
  ground.name = "set-env-ground"; ground.renderOrder = -600; ground.frustumCulled = false;
  if (!only || only.has("ground")) scene.add(ground);
  Promise.all([tex(G.src), G.motion && sway > 0 && raw(G.motion)]).then(([map, motion]) => {
    gmat.map = map;
    if (motion) animate(gmat, motion, pw, { amp: 2 * sway, key: "env-ground" });
    gmat.needsUpdate = true;
  });
  // the cast's shadows on the painted ground (the painting already has the world's own shadows)
  const sh = new THREE.Mesh(gg, new THREE.ShadowMaterial({ opacity: spec.shadow ?? E.light?.shadow ?? 0.3, color: new THREE.Color(spec.shadowColor || "#2a2350") }));
  sh.position.y = 0.002; sh.receiveShadow = true; sh.material.userData.noOutline = true; sh.name = "set-env-shadow"; sh.renderOrder = -599;
  scene.add(sh);
  (globalThis.__loads ||= []).push(Promise.all(loads));
}

// the painting camera of an env.json: picture pixel (u, v) -> a world ray, and the floor point under a pixel
export function envCamera(E) {
  const [W, H] = E.size, p = (E.eye.pitch * Math.PI) / 180, f = E.eye.f;
  const pos = new THREE.Vector3(...E.eye.pos);
  const right = new THREE.Vector3(1, 0, 0), up = new THREE.Vector3(0, Math.cos(p), -Math.sin(p)), fwd = new THREE.Vector3(0, -Math.sin(p), -Math.cos(p));
  // a ray whose length along the view axis is f (so ray * Z / f sits at view distance Z)
  const ray = (u, v) => new THREE.Vector3().addScaledVector(right, u - W / 2).addScaledVector(up, -(v - H / 2)).addScaledVector(fwd, f);
  const floor = (u, v) => { const r = ray(u, v); return r.multiplyScalar(-pos.y / Math.min(-1e-6, r.y)).add(pos); };
  return { pos, f, ray, floor, right, up, fwd };
}
