// Garments for the VRM person (firebender duel, 7 Nov 2026: Jonny asked that "each character should have a unique design
// and clothing", and the engine has one CC0 body, VRoid's HairSample_Male, in a hoodie and trousers). Character JSON
// "garments": a list of opt-in changes, made once at load on that cast member's own copy of the model, before the body
// under the clothes is hidden (so skin a cut uncovers stays, and skin a garment covers goes):
//
//   { "kind": "cut", "mat": "Tops", "under": ["leftLowerArm", "rightLowerArm"] }
//       drops the material's triangles that hang on those bones (or any bone under them): sleeves rolled to the elbow,
//       the forearms bare. The cut cloth is drawn on both sides, so a sleeve's opening shows its inside, not a hole.
//   { "kind": "shell", "name": "Vest", "from": "Tops", "bones": [...], "under": [...], "y": [lo, hi], "off": 0.014,
//     "open": 0.05, "back": false, "near": { "bone": "leftHand", "d": 0.2 }, "color": "#rrggbb" }
//       a new skinned layer cut from a surface of the body (its triangles on those bones, between rest heights y, within
//       d of a bone, minus a strip "open" metres either side of the front middle: an open vest or jacket) pushed "off"
//       metres out along its normals. It bends with the same skeleton, so it never separates from the body under it.
//       Its material is named "<name>_01_CLOTH": the character's "look" entry "<name>" colours it like any cloth
//       ("plain": true drops the source texture: one flat colour).
//   { "kind": "band", "name": "Headband", "bone": "head", "y": 1.6, "of": ["Hair", "Face"], "w": 0.03, "t": 0.007,
//     "tails": { "len": 0.26, "w": 0.028, "n": 2, "at": [0, 1] } }
//       a ring round the body at rest height y, fitted to the surfaces "of" (every 1/64 turn, the farthest point plus
//       t), carried rigidly by "bone"; "tails": ribbons from its back knot that hang and trail behind the way the bone
//       moves (a pure function of story time: their shape comes from where the bone was 0.1 s before); "turn" (0..1 of
//       a turn from the front, default 0.5 = the back) places their knot.
import * as THREE from "three";

const meshesOf = (vrm, part) => { const out = []; vrm.scene.traverse((o) => { if (o.isMesh && [].concat(o.material).some((m) => (m.name || "").includes(part))) out.push(o); }); return out; };
const boneSet = (vrm, names = [], deep = false) => {
  const s = new Set();
  for (const n of names) { const b = vrm.humanoid.getRawBoneNode(n); if (!b) continue; if (deep) b.traverse((x) => s.add(x)); else s.add(b); }
  return s;
};
// the bone a vertex hangs on most
const domBone = (o, i) => {
  const SI = o.geometry.attributes.skinIndex, SW = o.geometry.attributes.skinWeight; let best = 0, bw = -1;
  for (let k = 0; k < 4; k++) { const w = SW.getComponent(i, k); if (w > bw) { bw = w; best = SI.getComponent(i, k); } }
  return o.skeleton.bones[best];
};

export function buildGarments(vrm, list, t0 = []) {
  if (!list?.length) return { tails: t0 };
  vrm.scene.updateMatrixWorld(true);
  const tails = [...t0];
  for (const g of list) {
    if (g.kind === "cut") cut(vrm, g);
    else if (g.kind === "shell") shell(vrm, g);
    else if (g.kind === "band") tails.push(...band(vrm, g));
  }
  return { tails };
}

function cut(vrm, g) {
  const bones = new Set([...boneSet(vrm, g.under, true), ...boneSet(vrm, g.bones, false)]);
  // (the skin these bones carry is bare now: hideCoveredSkin keeps it skin, not the sleeve's inside colour)
  vrm.scene.userData.bare = new Set([...(vrm.scene.userData.bare || []), ...bones]);
  for (const o of meshesOf(vrm, g.mat)) {
    const geo = o.geometry, idx = geo.index; if (!idx || !geo.attributes.skinIndex) continue;
    const keep = [];
    for (let t = 0; t < idx.count; t += 3) {
      const a = idx.getX(t), b = idx.getX(t + 1), c = idx.getX(t + 2);
      const n = [a, b, c].filter((v) => bones.has(domBone(o, v))).length;
      if (n < 2) keep.push(a, b, c);
    }
    // (a mesh shares its vertex buffers with the other materials of the model: only this one's index changes)
    // (its groups, the model's material and its MToon outline pair, each drew the whole index: they keep doing so)
    const ng = geo.clone(), gr = geo.groups.map((x) => x.materialIndex); ng.setIndex(keep); ng.clearGroups();
    for (const mi of gr) ng.addGroup(0, keep.length, mi);
    o.geometry = ng;
    for (const m of [].concat(o.material)) m.side = THREE.DoubleSide;
  }
}

// (a body split over several meshes, as the VRoid base is: the hands are not in the first one, 7 Nov Ryn's gloves)
function shell(vrm, g) { for (const src of meshesOf(vrm, g.from)) shellOf(vrm, g, src); }
function shellOf(vrm, g, src) {
  const bones = new Set([...boneSet(vrm, g.under, true), ...boneSet(vrm, g.bones, false)]);
  const near = g.near ? { b: vrm.humanoid.getRawBoneNode(g.near.bone), d: g.near.d } : null;
  const near2 = g.near && !g.near.one ? vrm.humanoid.getRawBoneNode(g.near.bone.startsWith("left") ? g.near.bone.replace("left", "right") : g.near.bone.replace("right", "left")) : null;
  const geo = src.geometry, P = geo.attributes.position, N = geo.attributes.normal, idx = geo.index, M = src.matrixWorld;
  const w = new THREE.Vector3(), nb = near?.b?.getWorldPosition(new THREE.Vector3()), nb2 = near2?.getWorldPosition(new THREE.Vector3());
  const ok = new Uint8Array(P.count);
  for (let i = 0; i < P.count; i++) {
    if (bones.size && !bones.has(domBone(src, i))) continue;
    w.fromBufferAttribute(P, i).applyMatrix4(M);
    if (g.y && (w.y < g.y[0] || w.y > g.y[1])) continue;
    // (front is +z once the model is turned to face +z: an open front drops a strip down the middle of the chest)
    if (g.open && Math.abs(w.x) < g.open && w.z > 0) continue;
    if (g.back === false && w.z < 0) continue;
    if (near && Math.min(w.distanceTo(nb), nb2 ? w.distanceTo(nb2) : Infinity) > near.d) continue;
    ok[i] = 1;
  }
  const keep = [];
  for (let t = 0; t < idx.count; t += 3) { const a = idx.getX(t), b = idx.getX(t + 1), c = idx.getX(t + 2); if (ok[a] && ok[b] && ok[c]) keep.push(a, b, c); }
  if (!keep.length) return;
  const ng = new THREE.BufferGeometry();
  for (const [k, v] of Object.entries(geo.attributes)) ng.setAttribute(k, v.clone());
  // pushed out along the normal (in the mesh's own bind space, so the skinning carries the offset)
  const p2 = ng.attributes.position, off = g.off ?? 0.012, n = new THREE.Vector3();
  for (let i = 0; i < p2.count; i++) { if (!ok[i]) continue; n.fromBufferAttribute(N, i).normalize(); p2.setXYZ(i, p2.getX(i) + n.x * off, p2.getY(i) + n.y * off, p2.getZ(i) + n.z * off); }
  ng.setIndex(keep);
  const base = [].concat(src.material)[0], mat = base.clone();
  mat.name = `M_${g.name}_01_CLOTH`; mat.side = THREE.DoubleSide;
  if (g.plain) { if (mat.map) mat.map = null; if (mat.uniforms?.map) mat.uniforms.map.value = null; }
  const mesh = new THREE.SkinnedMesh(ng, mat);
  mesh.name = g.name; mesh.frustumCulled = false;
  mesh.bind(src.skeleton, src.bindMatrix);
  src.parent.add(mesh);
}

// a closed ring band (outer wall, inner wall, top and bottom) round a profile of 64 radii, in the bone's own space
function band(vrm, g) {
  const bone = vrm.humanoid.getRawBoneNode(g.bone || "head"); if (!bone) return [];
  const ctr = bone.getWorldPosition(new THREE.Vector3()), K = 64, R = new Float32Array(K).fill(0), y0 = g.y, tol = 0.012;
  const w = new THREE.Vector3();
  for (const part of g.of || ["Hair", "Face"]) for (const o of meshesOf(vrm, part)) {
    const P = o.geometry.attributes.position;
    for (let i = 0; i < P.count; i++) {
      w.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); if (Math.abs(w.y - y0) > tol) continue;
      const dx = w.x - ctr.x, dz = w.z - ctr.z, r = Math.hypot(dx, dz); if (r > 0.2) continue;
      const k = ((Math.round((Math.atan2(dx, dz) / (2 * Math.PI)) * K) % K) + K) % K; R[k] = Math.max(R[k], r);
    }
  }
  // (gaps where nothing stood at that height: the neighbours' radius; then smoothed so the band is a clean line)
  for (let pass = 0; pass < 3; pass++) for (let k = 0; k < K; k++) if (!R[k]) R[k] = Math.max(R[(k + 1) % K], R[(k + K - 1) % K]);
  let S = R; for (let pass = 0; pass < 3; pass++) S = S.map((_, k) => Math.max(S[k], (S[(k + 1) % K] + S[k] * 2 + S[(k + K - 1) % K]) / 4));
  const t = g.t ?? 0.007, hw = (g.w ?? 0.03) / 2, pos = [], index = [];
  const ring = (rk, y) => { const base = pos.length / 3; for (let k = 0; k < K; k++) { const a = (k / K) * 2 * Math.PI, r = S[k] + rk; pos.push(ctr.x + Math.sin(a) * r, y, ctr.z + Math.cos(a) * r); } return base; };
  const o0 = ring(t + 0.002, y0 - hw), o1 = ring(t + 0.002, y0 + hw), i0 = ring(0.001, y0 - hw), i1 = ring(0.001, y0 + hw);
  const quad = (a, b) => { for (let k = 0; k < K; k++) { const k2 = (k + 1) % K; index.push(a + k, b + k, a + k2, a + k2, b + k, b + k2); } };
  quad(o0, o1); quad(i1, i0); quad(o1, i1); quad(i0, o0);
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(index);
  // into the bone's space (the bone carries it rigidly)
  const inv = new THREE.Matrix4().copy(bone.matrixWorld).invert(); geo.applyMatrix4(inv); geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: g.color || "#b02a1e", roughness: 0.9, side: THREE.DoubleSide }); mat.name = `M_${g.name}_01_CLOTH`;
  const mesh = new THREE.Mesh(geo, mat); mesh.name = g.name; mesh.frustumCulled = false; bone.add(mesh);
  if (!g.tails) return [];
  // the knot: the back of the band (rest -z: the model faces +z); tails "turn" moves it round (0.25: the left side)
  const kb = Math.round(K * (g.tails.turn ?? 0.5)) % K, ka = (kb / K) * 2 * Math.PI, knot = new THREE.Vector3(ctr.x + Math.sin(ka) * (S[kb] + t), y0, ctr.z + Math.cos(ka) * (S[kb] + t)).applyMatrix4(inv);
  const T = g.tails, out = [];
  for (let j = 0; j < (T.n ?? 2); j++) {
    const segs = 10, tg = new THREE.BufferGeometry(), arr = new Float32Array((segs + 1) * 2 * 3), ti = [];
    for (let s = 0; s < segs; s++) { const a = s * 2; ti.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
    tg.setAttribute("position", new THREE.BufferAttribute(arr, 3)); tg.setIndex(ti);
    const tm = new THREE.Mesh(tg, mat); tm.name = `${g.name}Tail${j}`; tm.frustumCulled = false; bone.add(tm);
    out.push({ mesh: tm, bone, knot: knot.clone(), len: (T.len ?? 0.26) * (j ? 0.82 : 1), w: T.w ?? 0.028, side: j ? 1 : -1, seed: j * 1.7 + (g.seed ?? 0), segs });
  }
  return out;
}

// the ribbons' shape at t: they hang from the knot, trail against the way it moved over the last 0.1 s (`vel`, world
// metres per second), and flutter (a travelling wave, faster the faster it goes); built in world space, then put into
// the bone's space. A pure function of t and the pose.
export function poseTails(tails, t, vel) {
  const down = new THREE.Vector3(0, -1, 0), tmp = new THREE.Vector3(), side = new THREE.Vector3();
  for (const T of tails) {
    const B = T.bone; B.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(B.matrixWorld).invert(), k0 = T.knot.clone().applyMatrix4(B.matrixWorld);
    // the head's backward direction (rest -z in the bone's own space)
    const back = new THREE.Vector3(0, 0, -1).transformDirection(B.matrixWorld).setY(0).normalize();
    const v = vel.clone(), sp = Math.min(6, v.length());
    const dir = down.clone().multiplyScalar(1).addScaledVector(back, 0.55).addScaledVector(v.normalize(), -0.35 * sp).normalize();
    side.copy(back).cross(down).normalize();
    const arr = T.mesh.geometry.attributes.position.array, freq = 7 + sp * 2.5, amp = 0.02 + sp * 0.012;
    let p = k0.clone().addScaledVector(side, T.side * 0.012);
    for (let s = 0; s <= T.segs; s++) {
      const u = s / T.segs, wv = Math.sin(t * freq - u * 5 + T.seed) * amp * u;
      const q = p.clone().addScaledVector(side, wv).addScaledVector(side, T.side * 0.03 * u);
      const half = (T.w / 2) * (1 - 0.35 * u);
      // (the ribbon's flat face looks back: its width runs sideways)
      const a = tmp.copy(q).addScaledVector(side, half).applyMatrix4(inv);
      const b = q.clone().addScaledVector(side, -half).applyMatrix4(inv);
      arr.set([a.x, a.y, a.z], s * 6); arr.set([b.x, b.y, b.z], s * 6 + 3);
      p = q.addScaledVector(dir, T.len / T.segs).addScaledVector(side, -wv);
    }
    T.mesh.geometry.attributes.position.needsUpdate = true; T.mesh.geometry.computeVertexNormals(); T.mesh.geometry.computeBoundingSphere();
  }
}
