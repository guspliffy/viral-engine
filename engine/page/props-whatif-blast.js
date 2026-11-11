import * as THREE from "three";
import { libstackBooks } from "./props-library.js";

// What if, episode 2 "faster than sound" (9 Nov 2026), the BOOM's books (storyboards/series/what-if/02-library/BOARD.md
// §5 T3; panels 07 and 08). All three are instanced (one draw for the covers, one for the pages), see-through for the
// contact checks (userData.solid false + steam), never culled, and posed only from exact inputs: the same spec and
// clock give the same frame in any order. Their specs are world metres: place each at x 0, z 0, rot 0.
//   bookstorm  every book on the room side (+z face) of every spec.stacks bookcase (the libstack specs themselves: x, z,
//              rot, l, h, d, shelves, seed) flies out at spec.t0: it slides straight out of its slot, then flies on
//              forward 2.5-6 m/s, up 2-5 m/s, sideways +-1.5 with a seeded spin, falls (g 9.81), hits the floor or a
//              spec.boxes top ([[x, z, w, d, top], ...] axis-aligned, the reading table), bounces (restitution 0.3,
//              friction 0.6), lands on books already lying there and comes to rest within ~2.4 s. spec.keepout
//              [[x, z, r], ...]: vertical circles (up to spec.keepoutH 1.6 m) no part of a book ever enters (the cast).
//              Param clock (the clip time; the engine's t when nothing sets it): hidden before t0; at t0 every book
//              is in its slot, so the libstacks' `bare` steps to 1 at t0 (the shelves bare, the storm has the books).
//              Physics: a fixed 1/240 s step from t0, kept between frames only as a cache of the step it reached
//              (any other clock steps again from t0), so a frame never depends on the frames drawn before it.
//   pagefall   spec.n (30) loose pages (the libpage look) released one after another from spec.box [x0, x1, y, z0, z1]
//              over the first 70 % of spec.dur from spec.t0, fluttering down at 0.5-0.8 m/s with a side-to-side sway,
//              a rocking tilt, a slow turn and now and then a tumble; each lands flat on spec.floorY (0) and stays.
//              Param clock. A page is hidden until it is released at the box's height: put y above the frame.
//   bookpile   a heap of spec.count (150) books (the libbook look: cloth covers, cream pages; one in eight lies open)
//              covering spec.mounds [{x, z, r, h, y?}, ...] (each a dome of radius r and height h on y), over a dark
//              body of more books underneath; spec.holes [[x, z, r], ...] stay empty (the seats). Param fill 0..1
//              (the engine's default 1): the heap grows from the bottom up, each book dropping in from 1.2 m above
//              its place, the top books arriving last.
const DEG = Math.PI / 180, STEP = 1 / 240, G = 9.81;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x ?? 0));
const clockOf = (ps, t) => (typeof ps.clock === "number" ? ps.clock : t ?? 0);
function rng(seed) { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const CLOTH = ["#7a2e2a", "#8c3b2e", "#5a3a26", "#2f4a3a", "#35506b", "#6b5a2e", "#4b2f45", "#7d6a4a", "#9a4a2a", "#3d3a5c", "#2c5a5a", "#a8743a", "#5e6b3a", "#8a2c3c"];
const PAPER = ["#efe4c8", "#f3ead2", "#e8dab8"];
// Not solid for the checks. The body-in-prop check (stage.js clipping) boxes a mesh by its geometry's own box at the
// mesh's place, which for an instanced book or page is one unit box at the prop's origin, where no book is: that box
// is put far under the floor so the check never meets a book that is not there (keepout keeps the storm off the cast,
// the pile's holes are the seats).
const FAR = new THREE.Box3(new THREE.Vector3(0, -1000, 0), new THREE.Vector3(0, -1000, 0));
// No ink line on the instanced parts: the ink hull (ink.js, three's OutlineEffect) moves instances but not their
// normals, so a turned book's hull came out inside out, a grey lid over its cover.
const see = (o) => {
  o.userData.solid = false; o.userData.steam = true; o.frustumCulled = false;
  if (o.isInstancedMesh) { o.geometry.boundingBox = FAR.clone(); o.material.userData.noOutline = true; }
  return o;
};

// a closed book in a unit box, lying: x along the spine (its height), y its thickness, z across the cover with the
// spine at +z. Two boards and the spine take the cloth colour (instance colour), the page block is cream. half: one
// board (at -y) and the page block up to +y, so two halves make a closed book and an open one shows its pages.
function bookGeos(half) {
  const box = (sx, sy, sz, x, y, z) => { const b = new THREE.BoxGeometry(sx, sy, sz).toNonIndexed(); b.translate(x, y, z); b.deleteAttribute("uv"); return b; };
  const merge = (gs) => { const n = gs.reduce((s, g) => s + g.attributes.position.count, 0), p = new Float32Array(n * 3), q = new Float32Array(n * 3); let o = 0; for (const g of gs) { p.set(g.attributes.position.array, o * 3); q.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; } const m = new THREE.BufferGeometry(); m.setAttribute("position", new THREE.BufferAttribute(p, 3)); m.setAttribute("normal", new THREE.BufferAttribute(q, 3)); return m; };
  const b = half ? 0.26 : 0.14, s = 0.06;
  const cover = half ? [box(1, b, 1, 0, -0.5 + b / 2, 0), box(1, 1, s, 0, 0, 0.5 - s / 2)] : [box(1, b, 1, 0, -0.5 + b / 2, 0), box(1, b, 1, 0, 0.5 - b / 2, 0), box(1, 1 - 2 * b, s, 0, 0, 0.5 - s / 2)];
  const pages = half ? box(0.96, 1 - b, 0.92, 0, b / 2, -0.02 - s / 2 + 0.03) : box(0.96, 1 - 2 * b, 0.92, 0, 0, -0.02 - s / 2 + 0.03);
  return { cover: merge(cover), pages: merge([pages]) };
}
// covers and pages as two instanced meshes sharing every matrix
function bookMeshes(parent, n, half) {
  const g = bookGeos(half);
  const cover = see(new THREE.InstancedMesh(g.cover, new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.75 }), n));
  const pages = see(new THREE.InstancedMesh(g.pages, new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.9 }), n));
  for (const m of [cover, pages]) { m.castShadow = m.receiveShadow = true; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); parent.add(m); }
  return { cover, pages, set(i, mtx) { cover.setMatrixAt(i, mtx); pages.setMatrixAt(i, mtx); }, done() { cover.instanceMatrix.needsUpdate = true; pages.instanceMatrix.needsUpdate = true; } };
}
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

// ---------------------------------------------------------------------------------------------------- bookstorm
// rigid boxes: 8 corners against a height field (the floor plus books that came to rest) and the box tops; one
// averaged contact per step (the penetrating corners' middle), so a book lying flat gets no false spin
function makeStorm(S) {
  const t0 = S.t0 ?? 0, keep = S.keepout || [], KH = S.keepoutH ?? 1.6, boxes = S.boxes || [], floorY = S.floorY ?? 0;
  const books = [];
  for (const st of S.stacks || []) {
    const a = (st.rot ?? 0) * DEG, ca = Math.cos(a), sa = Math.sin(a), fwd = [sa, 0, ca], side = [ca, 0, -sa], qs = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a);
    const D = st.d ?? 0.44;
    libstackBooks(st).forEach((k, i) => {
      if (k.face !== 1) return;
      const r = rng((st.seed ?? 3) * 7919 + i * 31 + (S.seed ?? 0) * 104729 + 17);
      const q = qs.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), k.rz));
      let ext;
      if (k.flat) ext = [k.w, k.h, k.d];   // already lying: x along the shelf, thin in y
      else { q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2)); ext = [k.h, k.w, k.d]; }
      const x = (st.x ?? 0) + k.x * ca + k.z * sa, y = (st.y ?? 0) + k.y, z = (st.z ?? 0) - k.x * sa + k.z * ca;
      // the blast: mostly the slower ones, a few fast (copy nature: many small, few big); away from the room's middle
      const vf = 2.5 + 3.5 * Math.pow(r(), 1.4), vu = 2 + 3 * r(), ox = S.origin ? S.origin[0] : -0.6;
      const vs = clamp(1.5 * (2 * r() - 1) * 0.75 + 0.5 * clamp((x - ox) / 2.5, -1, 1), -1.5, 1.5);
      const ax = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), spin = 3 + 11 * r() * r();
      // straight out of the slot first (no spin, no rise, no gravity: the shelf holds it) until it clears the front
      const clear = D / 2 - k.z + k.d / 2 + 0.03;
      books.push({ x, y, z, q, ext, color: k.color, fwd, side, vf, vu, vs, w: ax.multiplyScalar(spin), clear, delay: 0.03 * r(),
        br: 0.5 * Math.hypot(ext[0], ext[1], ext[2]), inv: [12 / (ext[1] ** 2 + ext[2] ** 2), 12 / (ext[0] ** 2 + ext[2] ** 2), 12 / (ext[0] ** 2 + ext[1] ** 2)] });
    });
  }
  const n = books.length;
  // the height field: books at rest raise it (cells of 5 cm over spec.area [x0, x1, z0, z1])
  const [AX0, AX1, AZ0, AZ1] = S.area || [-9, 9, -10, 7], CELL = 0.05, NX = Math.ceil((AX1 - AX0) / CELL) + 1, NZ = Math.ceil((AZ1 - AZ0) / CELL) + 1;
  const st = { step: -1 };
  const P = new Float64Array(n * 3), V = new Float64Array(n * 3), W = new Float64Array(n * 3), Q = new Float64Array(n * 4);
  const phase = new Uint8Array(n), slid = new Float64Array(n), still = new Uint16Array(n), land = new Int32Array(n), hf = new Float32Array(NX * NZ), hfOld = new Float32Array(NX * NZ), hfAt = new Int32Array(NX * NZ);
  let hfMax = floorY, awake = n;
  const topMax = boxes.reduce((m, b) => Math.max(m, b[4]), floorY);
  const reset = () => {
    for (let i = 0; i < n; i++) { const b = books[i]; P.set([b.x, b.y, b.z], i * 3); V.fill(0, i * 3, i * 3 + 3); W.fill(0, i * 3, i * 3 + 3); Q.set([b.q.x, b.q.y, b.q.z, b.q.w], i * 4); phase[i] = 0; slid[i] = 0; still[i] = 0; land[i] = 0x7fffffff; }
    hf.fill(floorY); hfOld.fill(floorY); hfAt.fill(-1); hfMax = floorY; awake = n; st.step = 0;
  };
  const NB = boxes.length, BX = Float64Array.from(boxes.flatMap((b) => [b[0], b[1], b[2] / 2, b[3] / 2, b[4]]));
  // the height field's nodes, read bilinearly (a smooth surface: a corner sliding onto a book rides up its ramp)
  // A book that is already lying where another one comes to rest is not lifted by it (that would pop it up): a book
  // corner more than 3 cm under the books' surface goes by the floor and the box tops alone (the two just overlap).
  // A node raised after this book first touched down reads as it was before (one level of history, hfOld / hfAt).
  const node = (k, L) => (hfAt[k] > L ? hfOld[k] : hf[k]);
  const ground = (x, z, cy, py, L) => {
    let g = floorY, h = floorY;
    for (let j = 0; j < NB * 5; j += 5) if (cy > BX[j + 4] - 0.02 && BX[j + 4] > g && Math.abs(x - BX[j]) <= BX[j + 2] && Math.abs(z - BX[j + 1]) <= BX[j + 3]) g = BX[j + 4];
    const fx = (x - AX0) / CELL, fz = (z - AZ0) / CELL, ix = Math.floor(fx), iz = Math.floor(fz);
    if (ix >= 0 && iz >= 0 && ix < NX - 1 && iz < NZ - 1) {
      const u = fx - ix, w = fz - iz, k = iz * NX + ix;
      h = (node(k, L) * (1 - u) + node(k + 1, L) * u) * (1 - w) + (node(k + NX, L) * (1 - u) + node(k + NX + 1, L) * u) * w;
    }
    return h > g && h - py <= 0.03 ? h : g;
  };
  // scratch
  const R = new Float64Array(9), C = new Float64Array(24);
  const rot = (i) => {   // rotation matrix of book i (row-major)
    const x = Q[i * 4], y = Q[i * 4 + 1], z = Q[i * 4 + 2], w = Q[i * 4 + 3];
    R[0] = 1 - 2 * (y * y + z * z); R[1] = 2 * (x * y - z * w); R[2] = 2 * (x * z + y * w);
    R[3] = 2 * (x * y + z * w); R[4] = 1 - 2 * (x * x + z * z); R[5] = 2 * (y * z - x * w);
    R[6] = 2 * (x * z - y * w); R[7] = 2 * (y * z + x * w); R[8] = 1 - 2 * (x * x + y * y);
  };
  // world inverse inertia times a vector: R diag(inv) R^T v
  const iinv = (b, vx, vy, vz, out) => {
    const lx = R[0] * vx + R[3] * vy + R[6] * vz, ly = R[1] * vx + R[4] * vy + R[7] * vz, lz = R[2] * vx + R[5] * vy + R[8] * vz;
    const a = lx * b.inv[0], c = ly * b.inv[1], d = lz * b.inv[2];
    out[0] = R[0] * a + R[1] * c + R[2] * d; out[1] = R[3] * a + R[4] * c + R[5] * d; out[2] = R[6] * a + R[7] * c + R[8] * d;
  };
  const tmp = [0, 0, 0];
  // an impulse j along (nx, ny, nz) at the arm (rx, ry, rz); returns the effective mass's inverse
  const kOf = (b, rx, ry, rz, nx, ny, nz) => {
    const cx = ry * nz - rz * ny, cy = rz * nx - rx * nz, cz = rx * ny - ry * nx;
    iinv(b, cx, cy, cz, tmp);
    const ux = tmp[1] * rz - tmp[2] * ry, uy = tmp[2] * rx - tmp[0] * rz, uz = tmp[0] * ry - tmp[1] * rx;
    return 1 + nx * ux + ny * uy + nz * uz;
  };
  const push = (i, b, rx, ry, rz, jx, jy, jz) => {
    V[i * 3] += jx; V[i * 3 + 1] += jy; V[i * 3 + 2] += jz;
    iinv(b, ry * jz - rz * jy, rz * jx - rx * jz, rx * jy - ry * jx, tmp);
    W[i * 3] += tmp[0]; W[i * 3 + 1] += tmp[1]; W[i * 3 + 2] += tmp[2];
  };
  const sleep = (i, b) => {
    phase[i] = 3; awake--;
    rot(i);
    const px = P[i * 3], py = P[i * 3 + 1], pz = P[i * 3 + 2];
    let top = -1e9, x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let c = 0; c < 8; c++) {
      const sx = (c & 1 ? 0.5 : -0.5) * b.ext[0], sy = (c & 2 ? 0.5 : -0.5) * b.ext[1], sz = (c & 4 ? 0.5 : -0.5) * b.ext[2];
      const wx = px + R[0] * sx + R[1] * sy + R[2] * sz, wy = py + R[3] * sx + R[4] * sy + R[5] * sz, wz = pz + R[6] * sx + R[7] * sy + R[8] * sz;
      top = Math.max(top, wy); x0 = Math.min(x0, wx); x1 = Math.max(x1, wx); z0 = Math.min(z0, wz); z1 = Math.max(z1, wz);
    }
    // the footprint: the two book axes that lie flattest, their half lengths in x/z
    const ax = [0, 1, 2].sort((p, q) => Math.abs(R[3 + p]) - Math.abs(R[3 + q]) || p - q).slice(0, 2);
    const ux = R[ax[0]] * b.ext[ax[0]] / 2, uz = R[6 + ax[0]] * b.ext[ax[0]] / 2, vx = R[ax[1]] * b.ext[ax[1]] / 2, vz = R[6 + ax[1]] * b.ext[ax[1]] / 2;
    const det = ux * vz - uz * vx, hu = Math.sqrt(ux * ux + uz * uz), hv = Math.sqrt(vx * vx + vz * vz), RAMP = 0.08;
    if (Math.abs(det) < 1e-6) return;
    // the nodes under it rise to its top, the ones just round it to a 45 degree ramp down to what was there
    for (let iz = Math.max(0, Math.floor((z0 - RAMP - AZ0) / CELL)); iz <= Math.min(NZ - 1, Math.ceil((z1 + RAMP - AZ0) / CELL)); iz++)
      for (let ix = Math.max(0, Math.floor((x0 - RAMP - AX0) / CELL)); ix <= Math.min(NX - 1, Math.ceil((x1 + RAMP - AX0) / CELL)); ix++) {
        const dx = AX0 + ix * CELL - px, dz = AZ0 + iz * CELL - pz;
        const a = (dx * vz - dz * vx) / det, c = (ux * dz - uz * dx) / det;
        const out = Math.sqrt((Math.max(0, Math.abs(a) - 1) * hu) ** 2 + (Math.max(0, Math.abs(c) - 1) * hv) ** 2);
        if (out > RAMP) continue;
        const h = top - 0.004 - out, k = iz * NX + ix;
        if (hf[k] < h) { if (hfAt[k] !== st.step) { hfOld[k] = hf[k]; hfAt[k] = st.step; } hf[k] = h; if (h > hfMax) hfMax = h; }
      }
  };
  const MU = 0.6;
  function step() {
    const tt = st.step * STEP;   // seconds since t0 at the start of this step
    for (let i = 0; i < n; i++) {
      if (phase[i] === 3) continue;
      const b = books[i], o = i * 3;
      if (tt < b.delay) continue;
      if (phase[i] === 0) {   // sliding out of the slot
        const d = b.vf * STEP; P[o] += b.fwd[0] * d; P[o + 2] += b.fwd[2] * d; slid[i] += d;
        if (slid[i] >= b.clear) {
          phase[i] = 1;
          V[o] = b.fwd[0] * b.vf + b.side[0] * b.vs; V[o + 1] = b.vu; V[o + 2] = b.fwd[2] * b.vf + b.side[2] * b.vs;
          W[o] = b.w.x; W[o + 1] = b.w.y; W[o + 2] = b.w.z;
        }
        continue;
      }
      // flight: gravity, a little air drag, then move and turn
      const age = tt - b.delay;
      V[o + 1] -= G * STEP;
      const drag = 1 - 0.04 * STEP;
      V[o] *= drag; V[o + 1] *= drag; V[o + 2] *= drag;
      P[o] += V[o] * STEP; P[o + 1] += V[o + 1] * STEP; P[o + 2] += V[o + 2] * STEP;
      {
        const q = i * 4, wx = W[o], wy = W[o + 1], wz = W[o + 2], x = Q[q], y = Q[q + 1], z = Q[q + 2], w = Q[q + 3], h = 0.5 * STEP;
        const nx = x + h * (wx * w + wy * z - wz * y), ny = y + h * (wy * w + wz * x - wx * z), nz = z + h * (wz * w + wx * y - wy * x), nw = w - h * (wx * x + wy * y + wz * z);
        const l = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz + nw * nw); Q[q] = nx * l; Q[q + 1] = ny * l; Q[q + 2] = nz * l; Q[q + 3] = nw * l;
      }
      // the cast: no part of a book inside a keepout circle (up to its height)
      for (const k of keep) {
        if (P[o + 1] - b.br > KH) continue;
        const dx = P[o] - k[0], dz = P[o + 2] - k[1], R0 = k[2] + b.br, d2 = dx * dx + dz * dz;
        if (d2 >= R0 * R0) continue;
        const d = Math.sqrt(d2), nx = d > 1e-6 ? dx / d : 0, nz = d > 1e-6 ? dz / d : 1;
        P[o] = k[0] + nx * R0; P[o + 2] = k[1] + nz * R0;
        const vr = V[o] * nx + V[o + 2] * nz;
        if (vr < 0) { V[o] -= 1.3 * vr * nx; V[o + 2] -= 1.3 * vr * nz; }
      }
      // box sides (a book below a box top is pushed out sideways)
      for (const bx of boxes) {
        if (P[o + 1] >= bx[4]) continue;
        const ex = bx[2] / 2 + b.br * 0.5 - Math.abs(P[o] - bx[0]), ez = bx[3] / 2 + b.br * 0.5 - Math.abs(P[o + 2] - bx[1]);
        if (ex <= 0 || ez <= 0) continue;
        if (ex < ez) { const s = Math.sign(P[o] - bx[0]) || 1; P[o] += s * ex; if (V[o] * s < 0) V[o] *= -0.3; }
        else { const s = Math.sign(P[o + 2] - bx[1]) || 1; P[o + 2] += s * ez; if (V[o + 2] * s < 0) V[o + 2] *= -0.3; }
      }
      // the ground: the penetrating corners' middle takes one impulse
      let touch = 0;
      if (P[o + 1] - b.br < Math.max(hfMax, topMax) + 0.01) {
        rot(i);
        let cnt = 0, cx = 0, cy = 0, cz = 0, wsum = 0, pen = 0;
        for (let c = 0; c < 8; c++) {
          const sx = (c & 1 ? 0.5 : -0.5) * b.ext[0], sy = (c & 2 ? 0.5 : -0.5) * b.ext[1], sz = (c & 4 ? 0.5 : -0.5) * b.ext[2];
          const rx = R[0] * sx + R[1] * sy + R[2] * sz, ry = R[3] * sx + R[4] * sy + R[5] * sz, rz = R[6] * sx + R[7] * sy + R[8] * sz;
          const g = ground(P[o] + rx, P[o + 2] + rz, P[o + 1], P[o + 1] + ry, land[i]), d = g - (P[o + 1] + ry);
          if (d > 0) { const wt = d + 1e-4; cnt++; cx += rx * wt; cy += ry * wt; cz += rz * wt; wsum += wt; if (d > pen) pen = d; }
        }
        if (cnt) {
          touch = cnt;
          if (land[i] > st.step) land[i] = st.step;
          const rx = cx / wsum, ry = cy / wsum, rz = cz / wsum;
          const vpx = V[o] + W[o + 1] * rz - W[o + 2] * ry, vpy = V[o + 1] + W[o + 2] * rx - W[o] * rz, vpz = V[o + 2] + W[o] * ry - W[o + 1] * rx;
          let jn = 0;
          if (vpy < 0) {
            const e = vpy < -0.8 ? 0.3 : 0;
            jn = (-(1 + e) * vpy) / kOf(b, rx, ry, rz, 0, 1, 0);
            push(i, b, rx, ry, rz, 0, jn, 0);
            // a book is no rigid brick: a hard landing flops its covers and pages, and the spin and the skid go with it
            if (vpy < -0.8) { const k = 1 / (1 + 0.35 * -vpy); W[o] *= k; W[o + 1] *= k; W[o + 2] *= k; V[o] *= 0.5 + 0.5 * k; V[o + 2] *= 0.5 + 0.5 * k; }
          }
          // friction (Coulomb, at most MU times the normal impulse, plus the weight's share while it rests)
          const ux = V[o] + W[o + 1] * rz - W[o + 2] * ry, uz = V[o + 2] + W[o] * ry - W[o + 1] * rx, vt = Math.sqrt(ux * ux + uz * uz);
          if (vt > 1e-7) {
            const tx = -ux / vt, tz = -uz / vt, kt = kOf(b, rx, ry, rz, tx, 0, tz);
            const jt = Math.min(vt / kt, MU * (jn + G * STEP));
            push(i, b, rx, ry, rz, tx * jt, 0, tz * jt);
          }
          P[o + 1] += Math.min(pen, 0.01);
          // rolling resistance: a box does not roll like a log (flat on the floor, much more); a slow one settles
          // without rocking (paper and cloth soak it up)
          const slow = V[o] * V[o] + V[o + 1] * V[o + 1] + V[o + 2] * V[o + 2] < 0.09;
          const f = slow ? 0.94 : cnt >= 3 ? 0.97 : 0.99; W[o] *= f; W[o + 1] *= f; W[o + 2] *= f;
          if (slow) { V[o] *= 0.97; V[o + 2] *= 0.97; }
        }
      }
      // late on, anything still sliding near the floor slows smoothly to rest: all at rest by ~2.4 s after its launch
      if (age > 1.7 && P[o + 1] - b.br < Math.max(hfMax, topMax) + 0.05) { const f = 1 - 8 * STEP * clamp((age - 1.7) / 0.3); for (let k = 0; k < 3; k++) { V[o + k] *= f; W[o + k] *= f; } }
      const v2 = V[o] ** 2 + V[o + 1] ** 2 + V[o + 2] ** 2, w2 = W[o] ** 2 + W[o + 1] ** 2 + W[o + 2] ** 2;
      if (touch && v2 < 0.01 && w2 < 0.5) still[i]++; else still[i] = 0;
      if (still[i] > 24 || (touch && age > 2.4) || age > 4) sleep(i, b);
    }
    st.step++;
  }
  // the pose at s steps after t0 (fractional: blended between the two steps around it)
  const A = new Float64Array(n * 7);
  const snap = () => { for (let i = 0; i < n; i++) { A.set(P.subarray(i * 3, i * 3 + 3), i * 7); A.set(Q.subarray(i * 4, i * 4 + 4), i * 7 + 3); } };
  const to = (k) => { while (st.step < k) { if (!awake) { st.step = k; break; } step(); } };
  return {
    n, books,
    pose(s, out) {
      const k = Math.floor(s + 1e-6), f = Math.max(0, s - k);
      if (st.step < 0 || st.step > k + 1 || (st.step === k + 1 && st.snapAt !== k)) reset();
      if (st.step <= k) { to(k); snap(); st.snapAt = k; to(k + 1); }
      // A holds step k, P/Q step k + 1
      for (let i = 0; i < n; i++) {
        const a = i * 7, o = i * 3, q = i * 4;
        if (f < 1e-9) { out(i, A[a], A[a + 1], A[a + 2], A[a + 3], A[a + 4], A[a + 5], A[a + 6]); continue; }
        let qx = Q[q], qy = Q[q + 1], qz = Q[q + 2], qw = Q[q + 3];
        if (qx * A[a + 3] + qy * A[a + 4] + qz * A[a + 5] + qw * A[a + 6] < 0) { qx = -qx; qy = -qy; qz = -qz; qw = -qw; }
        out(i, A[a] + (P[o] - A[a]) * f, A[a + 1] + (P[o + 1] - A[a + 1]) * f, A[a + 2] + (P[o + 2] - A[a + 2]) * f,
          A[a + 3] + (qx - A[a + 3]) * f, A[a + 4] + (qy - A[a + 4]) * f, A[a + 5] + (qz - A[a + 5]) * f, A[a + 6] + (qw - A[a + 6]) * f);
      }
    },
    t0,
  };
}

// ---------------------------------------------------------------------------------------------------- pagefall
function pageTex() {
  const c = document.createElement("canvas"); c.width = 192; c.height = 272; const g = c.getContext("2d");
  g.fillStyle = "#f3ead2"; g.fillRect(0, 0, 192, 272);
  g.strokeStyle = "rgba(160,130,90,0.35)"; g.lineWidth = 6; g.strokeRect(0, 0, 192, 272);
  g.fillStyle = "#8a2c3c"; g.fillRect(22, 26, 30, 32);   // the drop cap block
  g.fillStyle = "#9a948a";
  let y = 30;
  for (let i = 0; y < 246; i++, y += 11) { const x0 = y < 62 ? 60 : 22, len = i % 9 === 8 ? 70 : 148 - (x0 - 22) - ((i * 37) % 3) * 6; g.fillRect(x0, y, len, 4); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function pageGeo() {
  const geo = new THREE.PlaneGeometry(0.17, 0.24, 6, 1), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const u = p.getX(i) / 0.085; p.setZ(i, 0.012 * (1 - u * u)); }   // a gentle bow
  geo.rotateX(-Math.PI / 2); geo.computeVertexNormals(); return geo;
}
function makePages(S) {
  const n = S.n ?? 30, [x0, x1, y0, z0, z1] = S.box || [-1, 1, 3, -1, 1], dur = S.dur ?? 4.3, fy = S.floorY ?? 0, r = rng(S.seed ?? 11);
  const pages = [];
  for (let i = 0; i < n; i++) {
    const p = { x: x0 + (x1 - x0) * r(), z: z0 + (z1 - z0) * r(), tr: dur * 0.7 * ((i + r()) / n), vt: 0.5 + 0.3 * r(), w: 2.4 + 1.6 * r(), ph: r() * 6.283, ph2: r() * 6.283,
      ax: 0.18 + 0.25 * r(), az: 0.1 * r(), yaw: r() * 6.283, yr: (r() < 0.5 ? -1 : 1) * (0.3 + 0.9 * r()), roll: 0.5 + 0.4 * r(),
      tum: r() < 0.25 ? (r() < 0.5 ? -1 : 1) * (5 + 4 * r()) : 0, rest: fy + 0.003 + 0.0006 * i };
    p.ay = (0.3 * p.vt) / (2 * p.w);
    // where it lands: y(tau) only falls, so bisect
    let lo = 0, hi = 120;
    for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (pageY(p, y0, m) > p.rest) lo = m; else hi = m; }
    p.land = hi; pages.push(p);
  }
  return { pages, y0 };
}
// drops at 1.6 m/s easing to its own speed vt (k 0.4 s), a little faster at each end of a sway
function pageY(p, y0, tau) { return y0 - (p.vt * tau + (1.6 - p.vt) * 0.4 * (1 - Math.exp(-tau / 0.4))) - p.ay * (1 - Math.cos(2 * p.w * tau)); }

// ---------------------------------------------------------------------------------------------------- bookpile
function makePile(S) {
  const mounds = S.mounds || [], holes = S.holes || [], N = S.count ?? 150, r = rng(S.seed ?? 7);
  const surf = (x, z) => {
    let h = 0;
    for (const m of mounds) { const d = Math.hypot(x - m.x, z - m.z) / m.r; if (d < 1) h = Math.max(h, (m.y ?? 0) + m.h * Math.pow(Math.cos((Math.PI / 2) * d), 1.3)); }
    for (const [hx, hz, hr] of holes) { const d = Math.hypot(x - hx, z - hz), u = clamp((d - hr) / 0.22); h *= u * u * (3 - 2 * u); }
    return h;
  };
  let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9;
  for (const m of mounds) { bx0 = Math.min(bx0, m.x - m.r); bx1 = Math.max(bx1, m.x + m.r); bz0 = Math.min(bz0, m.z - m.r); bz1 = Math.max(bz1, m.z + m.r); }
  if (!mounds.length) bx0 = bx1 = bz0 = bz1 = 0;
  // books lying on books: a height field of the books already placed (4 cm cells)
  const CELL = 0.04, NX = Math.max(1, Math.ceil((bx1 - bx0) / CELL) + 1), NZ = Math.max(1, Math.ceil((bz1 - bz0) / CELL) + 1), hf = new Float32Array(NX * NZ);
  const under = (x, z) => surf(x, z) - 0.035;
  const top = (x, z) => { const ix = Math.round((x - bx0) / CELL), iz = Math.round((z - bz0) / CELL); const b = ix >= 0 && iz >= 0 && ix < NX && iz < NZ ? hf[iz * NX + ix] : 0; return Math.max(under(x, z), b); };
  const books = [], up = new THREE.Vector3(0, 1, 0);
  // even cover: a low-discrepancy sweep (R2) of the mounds' box, from a seeded start
  const g1 = 0.7548776662466927, g2 = 0.5698402909980532;
  let u0 = r(), v0 = r();
  for (let k = 0; books.length < N && k < N * 40; k++) {
    const x = bx0 + (bx1 - bx0) * ((u0 + g1 * k) % 1), z = bz0 + (bz1 - bz0) * ((v0 + g2 * k) % 1), hs = surf(x, z);
    if (hs < 0.05) continue;
    if (holes.some(([hx, hz, hr]) => Math.hypot(x - hx, z - hz) < hr + 0.1)) continue;
    // many small, few big; one in eight open; a few stood on edge in the jumble
    const s = r() * r(), W = 0.15 + 0.12 * s + 0.02 * r(), L = W * (1.3 + 0.2 * r()), T = 0.028 + 0.045 * Math.pow(r(), 1.5);
    const open = r() < 0.125 ? Math.PI * (0.72 + 0.28 * r()) : 0, yaw = r() * Math.PI * 2, jumble = r() < 0.12;
    const e = 0.04, n = new THREE.Vector3(-(surf(x + e, z) - surf(x - e, z)) / (2 * e), 1, -(surf(x, z + e) - surf(x, z - e)) / (2 * e)).normalize();
    const tilt = jumble ? 0.5 + 0.5 * r() : 0.22 * r(), ta = r() * Math.PI * 2;
    n.applyAxisAngle(new THREE.Vector3(Math.cos(ta), 0, Math.sin(ta)), tilt).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(up, n).multiply(new THREE.Quaternion().setFromAxisAngle(up, yaw));
    const ca = Math.cos(yaw), sa = Math.sin(yaw), hx = L / 2, hz = (open ? 2 : 1) * W / 2;
    let base = top(x, z), cs = 0;
    for (const [px, pz] of [[hx, hz], [-hx, hz], [hx, -hz], [-hx, -hz]]) cs += top(x + px * ca + pz * sa, z - px * sa + pz * ca) / 4;
    base = Math.max(base, cs) + Math.sin(tilt) * W * (jumble ? 0.45 : 0.15);
    const y = base + T / 2;
    if (y - T / 2 > hs + 0.06) continue;   // already deep enough here
    // raise the height field under it
    const rr = Math.hypot(hx, hz);
    for (let iz = Math.max(0, Math.floor((z - rr - bz0) / CELL)); iz <= Math.min(NZ - 1, Math.ceil((z + rr - bz0) / CELL)); iz++)
      for (let ix = Math.max(0, Math.floor((x - rr - bx0) / CELL)); ix <= Math.min(NX - 1, Math.ceil((x + rr - bx0) / CELL)); ix++) {
        const dx = bx0 + ix * CELL - x, dz = bz0 + iz * CELL - z, lx = dx * ca - dz * sa, lz = dx * sa + dz * ca;
        if (Math.abs(lx) <= hx && Math.abs(lz) <= hz) hf[iz * NX + ix] = Math.max(hf[iz * NX + ix], y + T / 2);
      }
    books.push({ x, y, z, q, W, L, T, open, color: CLOTH[Math.floor(r() * CLOTH.length)], paper: PAPER[Math.floor(r() * PAPER.length)], drop: new THREE.Vector3(r() - 0.5, 0, r() - 0.5).normalize(), spin: (r() - 0.5) * 2.5 });
  }
  books.sort((a, b) => a.y - b.y || a.x - b.x || a.z - b.z);
  return { books, surf, under, box: [bx0, bx1, bz0, bz1] };
}
function heapTex() {
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d"), r = rng(5);
  g.fillStyle = "#2a1d16"; g.fillRect(0, 0, 256, 256);
  const dark = (hex, k) => { const v = parseInt(hex.slice(1), 16); return `rgb(${((v >> 16) & 255) * k | 0},${((v >> 8) & 255) * k | 0},${(v & 255) * k | 0})`; };
  for (let i = 0; i < 140; i++) {
    const x = r() * 256, y = r() * 256, w = 26 + r() * 30, h = 34 + r() * 36, a = r() * Math.PI;
    g.save(); g.translate(x, y); g.rotate(a);
    g.fillStyle = dark("#e8dab8", 0.5 + 0.2 * r()); g.fillRect(-w / 2 - 3, -h / 2 + 3, w, h);   // a page edge peeking
    g.fillStyle = dark(CLOTH[Math.floor(r() * CLOTH.length)], 0.55 + 0.25 * r()); g.fillRect(-w / 2, -h / 2, w, h);
    g.restore();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

const M = new THREE.Matrix4(), V3 = new THREE.Vector3(), S3 = new THREE.Vector3(), Qt = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), E = new THREE.Euler();

export const WHATIFBLAST_KINDS = {
  bookstorm(P) {
    const sim = makeStorm(P.spec), n = sim.n;
    const m = bookMeshes(P.whole, Math.max(1, n), false), col = new THREE.Color();
    sim.books.forEach((b, i) => { m.cover.setColorAt(i, col.set(b.color)); m.pages.setColorAt(i, col.set(PAPER[i % 3])); });
    if (m.cover.instanceColor) m.cover.instanceColor.needsUpdate = true;
    if (m.pages.instanceColor) m.pages.instanceColor.needsUpdate = true;
    let drawn = null;
    return {
      grip: 0,
      apply(ps, t) {
        const c = clockOf(ps, t), on = n > 0 && c >= sim.t0 - 1e-9;
        P.whole.visible = on;
        if (!on) return;
        const s = Math.max(0, (c - sim.t0) * 240);
        if (s === drawn) return;
        drawn = s;
        sim.pose(s, (i, x, y, z, qx, qy, qz, qw) => {
          const b = sim.books[i];
          M.compose(V3.set(x, y, z), Qt.set(qx, qy, qz, qw).normalize(), S3.set(b.ext[0], b.ext[1], b.ext[2]));
          m.set(i, M);
        });
        m.done();
      },
    };
  },

  pagefall(P) {
    const S = P.spec, { pages, y0 } = makePages(S), t0 = S.t0 ?? 0, n = pages.length;
    const mesh = see(new THREE.InstancedMesh(pageGeo(), new THREE.MeshStandardMaterial({ map: pageTex(), side: THREE.DoubleSide, roughness: 0.85 }), Math.max(1, n)));
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); P.whole.add(mesh);
    let drawn = null;
    return {
      grip: 0,
      apply(ps, t) {
        const c = clockOf(ps, t);
        if (c === drawn) return;
        drawn = c;
        pages.forEach((p, i) => {
          const tau0 = c - t0 - p.tr;
          if (tau0 < 0) { mesh.setMatrixAt(i, ZERO); return; }
          const tau = Math.min(tau0, p.land), k = clamp((p.land - tau) / 0.35), ramp = clamp(tau / 0.5);
          const x = p.x + p.ax * ramp * Math.sin(p.w * tau + p.ph) - p.ax * ramp * Math.sin(p.ph), z = p.z + p.az * Math.sin(0.7 * p.w * tau + p.ph2) - p.az * Math.sin(p.ph2);
          const y = tau >= p.land ? p.rest : Math.max(p.rest, pageY(p, y0, tau));
          // rocks with the sway (the low side leading), a small pitch, a slow turn; a tumbler ends face up or down
          const roll = p.roll * Math.cos(p.w * tau + p.ph) * k * (0.3 + 0.7 * ramp);
          let pitch = 0.25 * Math.sin(1.3 * p.w * tau + p.ph2) * k;
          if (p.tum) { const raw = p.tum * tau, end = Math.round((p.tum * p.land) / Math.PI) * Math.PI; pitch += end + (raw - end) * k; }
          Q2.setFromEuler(E.set(pitch, p.yaw + p.yr * tau, roll, "YXZ"));
          M.compose(V3.set(x, y, z), Q2, S3.set(1, 1, 1));
          mesh.setMatrixAt(i, M);
        });
        mesh.instanceMatrix.needsUpdate = true;
      },
    };
  },

  bookpile(P) {
    const S = P.spec, pile = makePile(S), N = pile.books.length;
    const m = bookMeshes(P.whole, Math.max(1, N * 2), true), col = new THREE.Color();
    pile.books.forEach((b, i) => { for (const h of [0, 1]) { m.cover.setColorAt(i * 2 + h, col.set(b.color)); m.pages.setColorAt(i * 2 + h, col.set(b.paper)); } });
    if (m.cover.instanceColor) m.cover.instanceColor.needsUpdate = true;
    if (m.pages.instanceColor) m.pages.instanceColor.needsUpdate = true;
    // the two halves of each book in its own frame (closed, or opened about the spine at +z)
    const halves = pile.books.map((b) => {
      const A = new THREE.Matrix4().compose(new THREE.Vector3(0, -b.T / 4, 0), new THREE.Quaternion(), new THREE.Vector3(b.L, b.T / 2, b.W));
      const B = new THREE.Matrix4().compose(new THREE.Vector3(0, b.T / 4, 0), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI), new THREE.Vector3(b.L, b.T / 2, b.W));
      if (b.open) {
        const hinge = new THREE.Vector3(0, 0, b.W / 2);
        B.premultiply(new THREE.Matrix4().makeTranslation(-hinge.x, -hinge.y, -hinge.z)).premultiply(new THREE.Matrix4().makeRotationX(b.open)).premultiply(new THREE.Matrix4().makeTranslation(hinge.x, hinge.y, hinge.z));
        const shift = new THREE.Matrix4().makeTranslation(0, 0, (-b.W / 2) * (b.open / Math.PI));
        A.premultiply(shift); B.premultiply(shift);
      }
      return [A, B];
    });
    // the dark body of more books under the top ones: a height field mesh, cut flat at the level the fill has reached
    const [bx0, bx1, bz0, bz1] = pile.box, GC = 0.06, gx = Math.max(2, Math.ceil((bx1 - bx0) / GC) + 1), gz = Math.max(2, Math.ceil((bz1 - bz0) / GC) + 1);
    const ug = new THREE.PlaneGeometry(bx1 - bx0 || 1, bz1 - bz0 || 1, gx - 1, gz - 1); ug.rotateX(-Math.PI / 2); ug.translate((bx0 + bx1) / 2, 0, (bz0 + bz1) / 2);
    const up = ug.attributes.position, uv = ug.attributes.uv, base = new Float32Array(up.count);
    for (let i = 0; i < up.count; i++) { const x = up.getX(i), z = up.getZ(i), h = pile.under(x, z); base[i] = h > 0.004 ? h : -0.03; uv.setXY(i, x / 0.9, z / 0.9); }
    const body = see(new THREE.Mesh(ug, new THREE.MeshStandardMaterial({ map: heapTex(), roughness: 0.85 })));
    body.receiveShadow = true; body.castShadow = false; P.whole.add(body);
    let cutNow = null, drawn = null;
    const setCut = (cut) => {
      if (cut === cutNow) return;
      cutNow = cut;
      for (let i = 0; i < up.count; i++) up.setY(i, base[i] < 0 ? base[i] : Math.min(base[i], cut));
      up.needsUpdate = true; ug.computeVertexNormals();
    };
    return {
      grip: 0,
      apply(ps) {
        const f = clamp(ps.fill ?? 1);
        if (f === drawn) return;
        drawn = f;
        // book k (bottom up) arrives over fill [0.88 k / N, + 0.12]
        let reached = -1;
        pile.books.forEach((b, i) => {
          const p = clamp((f - (0.88 * i) / N) / 0.12);
          if (p <= 0) { m.set(i * 2, ZERO); m.set(i * 2 + 1, ZERO); return; }
          if (p >= 1) reached = i;
          const fall = (1 - p) * (1 - p), lift = 1.2 * fall;
          Qt.copy(b.q);
          if (fall > 0) Qt.premultiply(Q2.setFromAxisAngle(V3.set(b.drop.z, 0, -b.drop.x), 0.9 * fall)).multiply(Q2.setFromAxisAngle(S3.set(0, 1, 0), b.spin * fall));
          const W0 = new THREE.Matrix4().compose(V3.set(b.x, b.y + lift, b.z), Qt, S3.set(1, 1, 1));
          m.set(i * 2, M.multiplyMatrices(W0, halves[i][0])); m.set(i * 2 + 1, M.multiplyMatrices(W0, halves[i][1]));
        });
        m.done();
        body.visible = f > 0;
        setCut(f >= 1 ? 99 : reached < 0 ? 0 : Math.max(0, pile.books[reached].y - 0.05));
      },
    };
  },
};
