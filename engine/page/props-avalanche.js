import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { clamp, rng } from "./util.js";
import { snowMaterial, farMesh, firGeometry, ridePath, slopeAt, heightAt, SNOWSLOPE, SNOWLIGHT, SNOW_GLSL } from "./set-snowslope.js";

// Survive it EP1 "Snowed in" (task T2, 9 Nov 2026): the cottage outside, the avalanche and the mountain's cap. Jonny's
// panels 06 (the cottage rides the front of an avalanche down the moonlit slope, firs flipping), 07 (DAY 100: the
// doorway in the sun, icicles on the eaves, the white cap over the roof) and 08 (the cap has come down: a smooth white
// mound with only the chimney out, the bare grey peak and its avalanche track behind). The world is set-snowslope.js;
// everything here is drawn with its shader (snowMaterial: the same sun or moon, `dark`, haze and far compression) so it
// sits in the same day or night as the mountain in any look. Motion is a function of story time (deterministic).
//   cottagesled  the cottage's whole outside round the room at the origin (set-snowcottage.js): log walls just outside
//                the room's (x -2.75..2.75, z -2.35..3.6), seen from outside only (one-sided outward: the inside cameras
//                see through them), a gabled roof (ridge along z over x 0, eaves AVALANCHE.cottage.eave) under 0.4 m of
//                snow with icicles along both eaves, a stone chimney over the hearth (x 1.05, back) 1.2 m above the
//                ridge, smoking; the window (back wall, x -1.4, 1.4 x 1.4 m from the 1.0 m sill: warm light inside at
//                night) and the door (left wall, z -0.4, 1.0 x 2.0 m, hinge at z -0.9); snow drifted to the sill,
//                cleared in front of the door. Keys: `slide` 0..1 (along SNOWSLOPE.ridePath; 1: round the origin, yaw
//                0; default 1), `tilt` (degrees of rock, +- 8: the top toward +x, the engine's tilt), `sink` 0..1
//                (0.6 m down into the valley heap at 1), `door` 0..1 (swings inward to 100 degrees), `boards` 0..1
//                (planks nailed on in order: the door's three bottom to top, then the window's; 1 all), `smoke` 0..3
//                (1 a cosy wisp, the default; 2-3 a thick stream that reads from 25 m), `trail` (m/s the smoke streams toward +x, up the slope: 0.6 at rest, ~6 riding).
//                x, y, z, rot add to the ride's place and yaw. Origin: the room's origin (the floor's middle at x 0).
//   chimneycap   the stone slab on the chimney top (1.05 m square, 0.16 m thick, a cushion of snow on it), a physics
//                body. Origin: its bottom centre. AVALANCHE.chimneyTop(slide, tilt, sink) gives where it sits.
//   snowfront    a cel avalanche wall 40 m wide (z), 8 m tall, boiling rounded tops, spray, 200 snow chunks spat
//                ahead and 12 firs flipping end over end (tumbling motion as functions of story time, drawn on the GPU:
//                no physics bodies). `run` 0..1 rides ridePath: its foot at the cottage's place for the same value,
//                the wall rising just behind the cottage's up-slope wall (local x 4.5..8.8), the body trailing up the
//                slope, a churned skirt round the cottage (cut out of its footprint). `scale` scales the whole front.
//   snowcap      the white cap on the mountain's top third (above SNOWSLOPE.capY), world-anchored (x, y, z, rot are
//                ignored). `break` 0..1 opens a crack along one line across the cap below the summit (the slab under
//                it sags); `run` 0..0.35 slides the slab down the face, narrowing into a channel; 0.35..0.95 it is a
//                snowfront at `scale` (3: the payoff wave, 120 m wide) running down the apron to the origin, 0.95..1 it
//                collapses there (raise the snowmound with it). Behind it the top third is bare grey rock and a
//                scoured track runs down the face, debris down the apron. The prop's own size is not scaled.
//                `firs: false` leaves the flipping firs out of its front.
//   snowmound    `rise` 0..1: a smooth white mound over the whole cottage at the origin, 4.9 m high (its flat top over
//                the roof), 11.5 m round; at 1 the chimney's top 0.47 m stays out. Origin: the world's origin.
// Keys a storyboard has never set start unset (propState jumps the first tween of an unset key): set each key's first
// value with a dur-0 prop action at 0, or in the prop's spec (slide, run, door, ...: read from the spec when unset).

const rad = (d) => (d * Math.PI) / 180;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const T30 = Math.tan(rad(30));
const CT = { x0: -2.75, x1: 2.75, z0: -2.35, z1: 3.6, eave: 2.6, pitch: 30, over: 0.35, gable: 0.4, board: 0.14, snow: 0.4,
  door: { z0: -0.9, z1: 0.1, h: 2.0 }, win: { x: -1.4, w: 1.4, y0: 1.0, y1: 2.4 }, chim: { x: 1.05, z: -1.9, w: 0.9, rise: 1.2 }, drift: 1.0 };
CT.ridge = CT.eave + CT.x1 * T30;
CT.chim.top = CT.ridge + CT.chim.rise;
const MOUND = { c: [0, 0.6], Rin: 3.8, R: 11.5, h: CT.chim.top - 0.47 };
const CAPRUN = { slab: 0.35, arrive: 0.95, footX: 480 };

// where the chimney's top (the cap's bottom centre) is for a cottage at slide / tilt / sink
const _o = new THREE.Object3D(); _o.rotation.order = "YXZ";
function cottageFrame(o, slide = 1, tilt = 0, sink = 0, off = [0, 0, 0], rot = 0, tip = 0) {
  const r = ridePath(slide);
  o.position.set(r.at[0] + off[0], r.at[1] + off[1] - 0.6 * clamp(sink), r.at[2] + off[2]);
  o.rotation.set(rad(tip), rad(r.yaw + rot), rad(r.pitch - tilt));
}
export const AVALANCHE = {
  cottage: CT, mound: MOUND, capRun: CAPRUN,
  chimneyTop(slide = 1, tilt = 0, sink = 0) {
    cottageFrame(_o, slide, tilt, sink); _o.updateMatrix();
    return new THREE.Vector3(CT.chim.x, CT.chim.top, CT.chim.z).applyMatrix4(_o.matrix).toArray();
  },
};

// ---------- textures (deterministic) ----------
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}
// round logs, 0.25 m each (the texture is 2 x 2 m): a lit top, a shaded underside, grain, a dark seam, a few knots
function logTexture(rnd) {
  return canvasTex(512, 512, (g, W, H) => {
    const n = 8, h = H / n;
    for (let i = 0; i < n; i++) {
      const y = i * h, gr = g.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, "#c48f5c"); gr.addColorStop(0.3, "#a87344"); gr.addColorStop(0.8, "#7c5130"); gr.addColorStop(1, "#4a2e1a");
      g.fillStyle = gr; g.fillRect(0, y, W, h);
      for (let k = 0; k < 7; k++) { g.strokeStyle = `rgba(70,40,20,${0.12 + rnd() * 0.15})`; g.lineWidth = 1 + rnd() * 1.5; const yy = y + 6 + rnd() * (h - 14); g.beginPath(); g.moveTo(0, yy); g.bezierCurveTo(W * 0.3, yy + (rnd() - 0.5) * 6, W * 0.7, yy + (rnd() - 0.5) * 6, W, yy); g.stroke(); }
      if (rnd() < 0.7) { const kx = rnd() * W, ky = y + h * (0.35 + rnd() * 0.3); g.fillStyle = "rgba(60,34,16,0.55)"; g.beginPath(); g.ellipse(kx, ky, 7 + rnd() * 5, 4 + rnd() * 2, 0, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = "#2e1c10"; g.fillRect(0, y + h - 3, W, 3);
    }
  });
}
function plankTexture(rnd) {   // vertical planks, 0.2 m wide (the texture is 1 x 1 m)
  return canvasTex(256, 256, (g, W, H) => {
    const n = 5, w = W / n;
    for (let i = 0; i < n; i++) {
      g.fillStyle = ["#8d5f3a", "#7f5533", "#946540", "#835936", "#8a5c37"][i]; g.fillRect(i * w, 0, w, H);
      for (let k = 0; k < 5; k++) { g.strokeStyle = `rgba(50,28,14,${0.15 + rnd() * 0.15})`; g.lineWidth = 1; const xx = i * w + 4 + rnd() * (w - 8); g.beginPath(); g.moveTo(xx, 0); g.bezierCurveTo(xx + 3, H * 0.3, xx - 3, H * 0.7, xx + 1, H); g.stroke(); }
      g.fillStyle = "#2c1a0e"; g.fillRect(i * w, 0, 2, H);
    }
  });
}
function stoneTexture(rnd) {   // grey field stones in mortar (the texture is 1 x 1 m)
  return canvasTex(256, 256, (g, W, H) => {
    g.fillStyle = "#4f5259"; g.fillRect(0, 0, W, H);
    let y = 0;
    while (y < H) {
      const rh = 34 + rnd() * 22; let x = -rnd() * 30;
      while (x < W) {
        const w = 40 + rnd() * 46, c = 120 + Math.floor(rnd() * 50);
        g.fillStyle = `rgb(${c},${c + 3},${c + 9})`; g.beginPath(); g.roundRect(x + 3, y + 3, w - 6, rh - 6, 9); g.fill();
        g.fillStyle = "rgba(255,255,255,0.12)"; g.beginPath(); g.roundRect(x + 6, y + 5, w - 14, (rh - 10) * 0.4, 6); g.fill();
        x += w;
      }
      y += rh;
    }
  });
}

// ---------- geometry helpers ----------
// a PlaneGeometry remapped to (x, height, z): its winding then faces down; turn it to face up
function upward(g) {
  const idx = g.index.array; for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  g.computeVertexNormals(); return g;
}
// flat faces of a wall: pieces [u0, u1, v0, v1] on the plane at `o` (u along uDir, v up), facing `nor`; uv in metres / 2
function wallGeo(o, uDir, nor, pieces, tris = []) {
  const P = [], N = [], U = [], up = new THREE.Vector3(0, 1, 0), flip = new THREE.Vector3().crossVectors(uDir, up).dot(nor) < 0;
  const at = (u, v) => new THREE.Vector3().copy(o).addScaledVector(uDir, u).addScaledVector(up, v);
  const tri = (a, b, c) => { for (const [p, uu, vv] of flip ? [a, c, b] : [a, b, c]) { P.push(p.x, p.y, p.z); N.push(nor.x, nor.y, nor.z); U.push(uu / 2, vv / 2); } };
  for (const [u0, u1, v0, v1] of pieces) {
    const a = [at(u0, v0), u0, v0], b = [at(u1, v0), u1, v0], c = [at(u1, v1), u1, v1], d = [at(u0, v1), u0, v1];
    tri(a, b, c); tri(a, c, d);
  }
  for (const [[u0, v0], [u1, v1], [u2, v2]] of tris) tri([at(u0, v0), u0, v0], [at(u1, v1), u1, v1], [at(u2, v2), u2, v2]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(U, 2));
  return g;
}
function part(geo, mat, parent, x = 0, y = 0, z = 0, solid = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.userData.solid = solid; m.userData.lookOnly = true; m.castShadow = false; m.receiveShadow = false; parent.add(m); return m;
}
const solidMat = (o) => snowMaterial({ ...o, solid: true });

// a snow drift along a wall: length L along +u from its start, D out from the wall, heights H(s) (s 0..1 along it)
function driftGeo(L, D, H, nu = 40, nd = 9) {
  const g = new THREE.PlaneGeometry(1, 1, nu, nd), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const s = p.getX(i) + 0.5, d = 0.5 - p.getY(i);   // d 0 at the wall, 1 out
    const h = H(s) * Math.pow(Math.max(0, 1 - Math.pow(d, 1.7)), 0.85);
    p.setXYZ(i, s * L, h - 0.06, d * D);
  }
  g.computeVertexNormals();
  return g;
}

// ---------- the cottage ----------
function cottagesled(P) {
  const S = P.spec, rnd = rng((S.seed || 3) * 917 + 1), G = P.whole;
  const logs = logTexture(rnd), planks = plankTexture(rnd), stone = stoneTexture(rnd);
  const logM = solidMat({ map: logs }), plankM = solidMat({ map: planks }), stoneM = solidMat({ map: stone });
  const trimM = solidMat({ color: "#6e4527" }), darkM = solidMat({ color: "#3a2416" }), roofM = solidMat({ color: "#5c3a24" });
  const snowM = solidMat({ color: "#f7faff" }), ironM = solidMat({ color: "#2b2b30" });
  const { x0, x1, z0, z1, eave, ridge } = CT;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  // the four log walls, one-sided outward; the openings left open (the room's own door and window show through)
  const D = CT.door, W = CT.win, wx0 = W.x - W.w / 2, wx1 = W.x + W.w / 2;
  part(wallGeo(V(x0, 0, 0), V(0, 0, 1), V(-1, 0, 0), [[z0, D.z0, 0, eave], [D.z1, z1, 0, eave], [D.z0, D.z1, D.h, eave]]), logM, G);   // left, the door
  part(wallGeo(V(x1, 0, 0), V(0, 0, 1), V(1, 0, 0), [[z0, z1, 0, eave]]), logM, G);   // right
  const gable = [[[x0, eave], [x1, eave], [0, ridge]]];
  part(wallGeo(V(0, 0, z0), V(1, 0, 0), V(0, 0, -1), [[x0, wx0, 0, eave], [wx1, x1, 0, eave], [wx0, wx1, 0, W.y0], [wx0, wx1, W.y1, eave]], gable), logM, G);   // back, the window
  part(wallGeo(V(0, 0, z1), V(1, 0, 0), V(0, 0, 1), [[x0, x1, 0, eave]], gable), logM, G);   // front
  // the log ends crossing at the corners, a dark sill log along the foot
  const ends = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.13, 0.14, 0.42, 10), solidMat({ color: "#8f5f38" }), 4 * 20);
  { const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); let k = 0;
    for (const [cx, cz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) for (let i = 0; i < 10; i++) for (const along of [0, 1]) {
      const y = 0.125 + i * 0.25 + (along ? 0.125 : 0); if (y > eave - 0.1) { M.makeScale(0, 0, 0); ends.setMatrixAt(k++, M); continue; }
      e.set(along ? Math.PI / 2 : 0, 0, along ? 0 : Math.PI / 2); q.setFromEuler(e);
      M.compose(V(cx + (along ? 0 : Math.sign(cx) * 0.2), y, cz + (along ? Math.sign(cz - 0.6) * 0.2 : 0)), q, V(1, 1, 1)); ends.setMatrixAt(k++, M);
    } }
  ends.userData.solid = true; ends.userData.lookOnly = true; G.add(ends);
  // the roof: two board slabs from the eaves (overhang) to the ridge, fascia and barge boards, the snow on top
  const L = (x1 + CT.over) / Math.cos(rad(CT.pitch)), RZ = z1 - z0 + 2 * CT.gable, zc = (z0 + z1) / 2;
  const ye = eave - CT.over * T30;
  for (const s of [-1, 1]) {
    const cx = (s * (x1 + CT.over)) / 2, cy = (ye + ridge) / 2, n = V(s * Math.sin(rad(CT.pitch)), Math.cos(rad(CT.pitch)), 0);   // the slope's outward normal
    const board = part(new THREE.BoxGeometry(L, CT.board, RZ), roofM, G, cx + n.x * CT.board / 2, cy + n.y * CT.board / 2, zc); board.rotation.z = -s * rad(CT.pitch);
    const sn = part(new RoundedBoxGeometry(L + 0.08, CT.snow, RZ + 0.12, 3, 0.16), snowM, G, cx + n.x * (CT.board + CT.snow / 2 - 0.03) + s * 0.03, cy + n.y * (CT.board + CT.snow / 2 - 0.03), zc); sn.rotation.z = -s * rad(CT.pitch);
    // the snow's rounded lip over the eave, where the icicles hang
    const lip = part(new THREE.CylinderGeometry(0.2, 0.2, RZ + 0.1, 12), snowM, G, s * (x1 + CT.over + 0.02), ye + 0.2, zc); lip.rotation.x = Math.PI / 2;
    part(new THREE.BoxGeometry(0.05, 0.2, RZ), trimM, G, s * (x1 + CT.over + 0.02), ye - 0.02, zc);   // fascia
    for (const gz of [z0 - CT.gable, z1 + CT.gable]) { const bb = part(new THREE.BoxGeometry(L, 0.22, 0.05), trimM, G, cx + n.x * 0.05, cy + n.y * 0.05, gz); bb.rotation.z = -s * rad(CT.pitch); }
  }
  // icicles along both eaves: clumps of long ones among many short ones
  { const n = 2 * 46, ic = new THREE.InstancedMesh(new THREE.ConeGeometry(0.05, 1, 6).rotateX(Math.PI).translate(0, -0.5, 0), snowMaterial({ color: "#dcebff", emit: "#1a2a44" }), n);
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(); let k = 0;
    for (const s of [-1, 1]) for (let i = 0; i < n / 2; i++) {
      const z = z0 - CT.gable + 0.12 + ((RZ - 0.24) * (i + rnd() * 0.6)) / (n / 2), clumpK = 0.5 + 0.5 * Math.sin(z * 1.7 + s * 2.1);
      const len = 0.1 + rnd() ** 2.4 * 0.75 * (0.4 + clumpK), w = 0.7 + rnd() * 0.6;
      M.compose(V(s * (x1 + CT.over + 0.04 + rnd() * 0.05), ye + 0.06, z), q, V(w, len, w)); ic.setMatrixAt(k++, M);
    }
    ic.userData.solid = false; ic.userData.lookOnly = true; G.add(ic); }
  // the ridge: a low rounded line of snow where the two slabs meet
  { const rc = part(new THREE.CylinderGeometry(0.18, 0.18, RZ + 0.08, 12), snowM, G, 0, ridge + 0.36, zc); rc.rotation.x = Math.PI / 2; }
  // the chimney: field stone over the hearth, from under the roof to 1.2 m above the ridge, a dark flue on top
  const C = CT.chim, base = eave + (x1 - (C.x - C.w / 2)) * T30 - 0.15, hC = C.top - base;
  part(new THREE.BoxGeometry(C.w, hC, C.w), stoneM, G, C.x, base + hC / 2, C.z).geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = v * (i % 2 ? hC : C.w); });
  { const fl = part(new THREE.PlaneGeometry(C.w * 0.55, C.w * 0.55), darkM, G, C.x, C.top + 0.003, C.z, false); fl.rotation.x = -Math.PI / 2; }
  { const col = part(new THREE.TorusGeometry(C.w * 0.62, 0.16, 6, 16), snowM, G, C.x, base + 0.48, C.z); col.rotation.x = Math.PI / 2; col.scale.set(1, 1, 0.6); }
  // the window: a frame, a cross, the glass (warm light inside at night)
  { const glassM = solidMat({ color: "#ffffff", fHead: "", fBody: `alb = mix(vec3(0.16, 0.23, 0.36), vec3(0.18, 0.12, 0.06), uDark); emit = vec3(1.0, 0.62, 0.26) * (0.06 + 1.25 * uDark) * (0.85 + 0.15 * smoothstep(0.2, 0.8, vUv.y)); glowK = 0.0;` });
    const gl = part(new THREE.PlaneGeometry(W.w, W.y1 - W.y0), glassM, G, W.x, (W.y0 + W.y1) / 2, z0 + 0.025); gl.rotation.y = Math.PI;
    for (const [w, h, x, y] of [[W.w + 0.2, 0.12, W.x, W.y0 - 0.02], [W.w + 0.2, 0.1, W.x, W.y1 + 0.04], [0.1, W.y1 - W.y0 + 0.2, wx0 - 0.05, (W.y0 + W.y1) / 2], [0.1, W.y1 - W.y0 + 0.2, wx1 + 0.05, (W.y0 + W.y1) / 2], [0.06, W.y1 - W.y0, W.x, (W.y0 + W.y1) / 2], [W.w, 0.06, W.x, (W.y0 + W.y1) / 2]])
      part(new THREE.BoxGeometry(w, h, 0.08), trimM, G, x, y, z0 - 0.06);
    part(new THREE.BoxGeometry(W.w + 0.3, 0.06, 0.22), snowM, G, W.x, W.y0 + 0.06, z0 - 0.12);   // snow on the sill
  }
  // the door: planks on strap hinges (hinge at z -0.9), swinging inward; a frame round the opening
  const hinge = new THREE.Group(); hinge.position.set(x0, 0, D.z0); G.add(hinge);
  { const dw = D.z1 - D.z0, dm = solidMat({ map: planks });
    const panel = part(new THREE.BoxGeometry(0.06, D.h - 0.02, dw - 0.02), dm, hinge, -0.035, D.h / 2, dw / 2);
    panel.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = v * (i % 2 ? D.h : dw); });
    for (const y of [0.35, 1.65]) part(new THREE.BoxGeometry(0.02, 0.07, dw * 0.8), ironM, hinge, -0.075, y, dw * 0.4);
    part(new THREE.BoxGeometry(0.03, 0.05, 0.12), ironM, hinge, -0.08, 1.0, dw - 0.12);
    for (const [h, y, z, w] of [[D.h + 0.12, D.h / 2 + 0.02, D.z0 - 0.06, 0.12], [D.h + 0.12, D.h / 2 + 0.02, D.z1 + 0.06, 0.12], [0.14, D.h + 0.07, (D.z0 + D.z1) / 2, dw + 0.24]])
      part(new THREE.BoxGeometry(0.08, h, w), trimM, G, x0 - 0.04, y, z); }
  // the boards: three across the door (bottom to top), one across the window
  const boardM = solidMat({ color: "#b98b5c" }), boards = [];
  for (const [y, a] of [[0.45, 4], [1.05, -5], [1.65, 3]]) { const b = part(new THREE.BoxGeometry(0.05, 0.17, D.z1 - D.z0 + 0.5), boardM, G, x0 - 0.13, y, (D.z0 + D.z1) / 2); b.rotation.x = rad(a); boards.push(b); }
  { const b = part(new THREE.BoxGeometry(Math.hypot(W.w + 0.3, W.y1 - W.y0 - 0.1), 0.17, 0.05), boardM, G, W.x, (W.y0 + W.y1) / 2, z0 - 0.14); b.rotation.z = Math.atan2(W.y1 - W.y0 - 0.1, W.w + 0.3); boards.push(b); }
  // the drifts: to the sill against the back, right and front walls, lower along the door's wall and cleared before it
  const wob = (s, k) => 0.88 + 0.12 * Math.sin(s * 9.1 + k) * Math.sin(s * 3.7 + k * 2.3);
  const endK = (s) => sstep(0, 0.1, s) * sstep(1, 0.9, s);
  const dLen = (a, b) => b - a + 1.6;
  // back (z0, outward -z): u along +x from x0-0.8
  { const g = driftGeo(dLen(x0, x1), 1.7, (s) => CT.drift * endK(s) * wob(s, 1)); g.rotateY(Math.PI); part(g, snowM, G, x1 + 0.8, 0, z0 - 0.02); }
  // front (z1, outward +z)
  { const g = driftGeo(dLen(x0, x1), 1.6, (s) => 0.9 * endK(s) * wob(s, 2)); part(g, snowM, G, x0 - 0.8, 0, z1 + 0.02); }
  // right (x1, outward +x): u along -z
  { const g = driftGeo(dLen(z0, z1), 1.8, (s) => CT.drift * endK(s) * wob(s, 3)); g.rotateY(Math.PI / 2); part(g, snowM, G, x1 + 0.02, 0, z1 + 0.8); }
  // left (x0, outward -x): u along +z, the door cleared
  { const len = dLen(z0, z1), g = driftGeo(len, 1.6, (s) => { const z = z0 - 0.8 + s * len; return 0.75 * endK(s) * wob(s, 4) * (1 - 0.94 * sstep(D.z0 - 0.75, D.z0 - 0.25, z) * sstep(D.z1 + 0.75, D.z1 + 0.25, z)); });
    g.rotateY(-Math.PI / 2); part(g, snowM, G, x0 - 0.02, 0, z0 - 0.8); }
  // smoke: cel puffs rising from the flue, streaming toward +x (`trail`), in the world's up
  const NS = 14, sg = new THREE.InstancedBufferGeometry().copy(new THREE.SphereGeometry(1, 12, 9));
  sg.instanceCount = NS; sg.setAttribute("aP", new THREE.InstancedBufferAttribute(new Float32Array(Array.from({ length: NS }, (_, i) => [(i + rnd() * 0.5) / NS, rnd() * 6.28, rnd() * 2 - 1, 0.6 + rnd() * 0.8]).flat()), 4));
  const smokeU = { uTime: { value: 0 }, uSmoke: { value: 1 }, uTrail: { value: 0.6 }, uTop: { value: new THREE.Vector3(C.x, C.top + 0.1, C.z) } };
  const smokeM = snowMaterial({ color: "#959ba8", uniforms: smokeU,
    vHead: "attribute vec4 aP; uniform float uTime, uSmoke, uTrail; uniform vec3 uTop;",
    vPre: `float tau = fract(aP.x + uTime * 0.36); float age = tau * 2.8;
      vec3 base = (modelMatrix * vec4(uTop, 1.0)).xyz;
      vec3 c = base + vec3(uTrail * age + (0.5 * aP.z + 0.3 * sin(aP.y + uTime * 1.3)) * tau * 1.6, 1.25 * age + 0.25 * age * age, (0.45 * sin(aP.y * 3.1) + 0.3 * sin(aP.y * 1.7 + uTime)) * tau * 1.6);
      float env = smoothstep(0.0, 0.07, tau) * (1.0 - smoothstep(0.55, 1.0, tau));
      float r = (0.16 + 0.55 * tau) * aP.w * env * uSmoke;
      pos = c + pos * r; M = mat4(1.0);` });
  const smoke = new THREE.Mesh(sg, smokeM); smoke.frustumCulled = false; smoke.userData.solid = false; smoke.userData.steam = true; G.add(smoke);
  return { grip: 0, apply(ps, t) {
    cottageFrame(P.root, ps.slide ?? S.slide ?? 1, ps.tilt ?? 0, ps.sink ?? S.sink ?? 0, [ps.x, ps.y, ps.z], ps.rot ?? 0, ps.tip ?? 0);
    hinge.rotation.y = rad(100) * clamp(ps.door ?? S.door ?? 0);
    const b = clamp(ps.boards ?? S.boards ?? 0); boards.forEach((o, i) => { o.visible = b > (i + 0.5) / boards.length - 1e-6; });
    smokeU.uTime.value = t; smokeU.uSmoke.value = clamp(ps.smoke ?? S.smoke ?? 1, 0, 3); smokeU.uTrail.value = ps.trail ?? S.trail ?? 0.6; smoke.visible = smokeU.uSmoke.value > 0.001;
  } };
}

function chimneycap(P) {
  const stoneM = solidMat({ map: stoneTexture(rng(41)) }), snowM = solidMat({ color: "#f7faff" });
  const slab = part(new RoundedBoxGeometry(1.05, 0.16, 1.05, 2, 0.03), stoneM, P.whole, 0, 0.08, 0);
  slab.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = v * 1.05; });
  part(new RoundedBoxGeometry(0.92, 0.14, 0.92, 3, 0.065), snowM, P.whole, 0, 0.2, 0);
  return { grip: 0.16 };
}

// ---------- the avalanche front (snowfront, and the snowcap's payoff wave) ----------
// local frame: origin on the ground at the ride's point, +x up the slope (behind), y up, z across; the group is pitched
// with the slope and scaled by the prop's scale. Every moving piece is placed in the vertex shader from story time.
function buildFront(parent, seed, cut = true, firs = true) {
  const rnd = rng(seed * 131 + 7), U = { uTime: { value: 0 }, uAmt: { value: 1 } }, g = new THREE.Group(); parent.add(g);
  const wz = (z) => 1 - sstep(15, 20.5, Math.abs(z));
  const hx = (x) => (x < 4.5 ? 1.3 * sstep(-8, 1, x) : x < 8.8 ? 1.3 + 6.9 * sstep(4.5, 8.8, x) : x < 13 ? 8.2 : 1.0 + 7.2 * Math.exp(-(x - 13) / 16));
  // the body: a churned hump, its face rising just behind the cottage, the skirt cut out of the cottage's footprint
  { const bg = new THREE.PlaneGeometry(1, 1, 96, 52), p = bg.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) + 0.5, v = p.getY(i), x = -9 + 79 * u ** 1.6, z = v * 44;
      let h = hx(x) * wz(z);
      if (cut && x < 4.7) h *= sstep(3.4, 4.6, Math.abs(z - 0.6));   // the cottage's footprint stays clear
      p.setXYZ(i, x, h - 0.2, z);
    }
    upward(bg);
    const m = snowMaterial({ color: "#f5f8ff", uniforms: U, vHead: "uniform float uTime, uAmt;",
      vPre: `float bk = smoothstep(1.0, 4.0, pos.y); pos.y += bk * (0.55 * sin(pos.x * 0.55 - uTime * 2.4 + sin(pos.z * 0.3)) * sin(pos.z * 0.42 + uTime * 1.6) + 0.35 * sin(pos.z * 1.1 - uTime * 3.1));` });
    farMesh(bg, m, g, "avalanche-body"); }
  // boil: puffs climbing the face and domes breathing along the crest
  { const N = 190, a = [], b = [];
    for (let i = 0; i < N; i++) {
      const crest = i >= 120, z = (rnd() * 2 - 1) * 19;
      a.push(rnd(), z, crest ? 2.2 + rnd() ** 1.5 * 2.6 : 1.6 + rnd() * 2.4, crest ? 0 : 0.28 + rnd() * 0.22);
      b.push(crest ? 1 : 0, rnd() * 6.28, rnd() * 6.28, rnd());
    }
    const pg = new THREE.InstancedBufferGeometry().copy(new THREE.SphereGeometry(1, 16, 11)); pg.instanceCount = N;
    pg.setAttribute("aP", new THREE.InstancedBufferAttribute(new Float32Array(a), 4)); pg.setAttribute("aQ", new THREE.InstancedBufferAttribute(new Float32Array(b), 4));
    const m = snowMaterial({ color: "#ffffff", uniforms: U, vHead: "attribute vec4 aP; attribute vec4 aQ; uniform float uTime, uAmt;",
      vPre: `float zc = aP.y, w = 1.0 - smoothstep(15.0, 20.5, abs(zc)); vec3 c; float r;
        if (aQ.x < 0.5) {
          float tau = fract(aQ.w + uTime * aP.w), env = smoothstep(0.0, 0.12, tau) * (1.0 - smoothstep(0.78, 1.0, tau));
          c = vec3(5.2 + 3.4 * tau + 0.6 * sin(aQ.y + uTime * 1.3), (0.6 + 8.2 * tau) * w, zc + 0.9 * sin(aQ.z + uTime * 0.9));
          r = aP.z * (0.45 + 0.6 * tau) * env * mix(0.45, 1.0, w);
        } else {
          c = vec3(8.6 + aQ.w * 5.5, 8.0 * w + 0.45 * sin(uTime * 1.7 + aQ.z), zc);
          r = aP.z * (1.0 + 0.15 * sin(uTime * 2.3 + aQ.z * 3.0)) * mix(0.3, 1.0, w);
        }
        pos = c + pos * r * uAmt; M = modelMatrix;` });
    farMesh(pg, m, g, "avalanche-boil"); }
  // spray: soft white veils over the crest and ahead of the face, drawn facing the camera
  { const N = 70, a = [], b = [];
    for (let i = 0; i < N; i++) { a.push(rnd(), (rnd() * 2 - 1) * 20, 2.2 + rnd() * 3, 0.32 + rnd() * 0.3); b.push(2 + rnd() * 8, 6 + rnd() * 4, rnd(), 0); }
    const sg = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1)); sg.instanceCount = N;
    sg.setAttribute("aP", new THREE.InstancedBufferAttribute(new Float32Array(a), 4)); sg.setAttribute("aQ", new THREE.InstancedBufferAttribute(new Float32Array(b), 4));
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
      uniforms: { ...SNOWLIGHT, ...U, uPull: { value: 0 }, uPullK: { value: 0 }, uColor: { value: new THREE.Color("#ffffff") }, uEmit: { value: new THREE.Color("#000000") }, uOpacity: { value: 1 } },
      vertexShader: `${SNOW_GLSL.vs}
attribute vec4 aP; attribute vec4 aQ; uniform float uTime, uAmt; varying float vA; varying vec2 vQ;
void main() {
  float tau = fract(aP.x + uTime * aP.w);
  float env = smoothstep(0.0, 0.25, tau) * (1.0 - smoothstep(0.45, 1.0, tau));
  vec3 c = vec3(aQ.x - 7.5 * tau, aQ.y + 4.0 * tau, aP.y);
  float w = 1.0 - smoothstep(15.0, 21.0, abs(aP.y));
  float size = aP.z * (0.6 + 0.9 * tau) * uAmt * w;
  vec4 wp = modelMatrix * vec4(c, 1.0); vW = wp.xyz; vN = vec3(0.0, 1.0, 0.0); vUv = uv;
  float sc = length(modelMatrix[0].xyz);
  vec4 mv = viewMatrix * wp; float d = length(mv.xyz); vDist = d;
  float dd = d > uFarD0 ? uFarD0 + uFarW * log(1.0 + (d - uFarD0) / uFarW) : d;
  float k = dd / max(d, 1e-5); mv.xyz *= k; mv.xy += position.xy * size * sc * k;
  gl_Position = projectionMatrix * mv; vA = env; vQ = position.xy;
}`,
      fragmentShader: `${SNOW_GLSL.fs}
varying float vA; varying vec2 vQ;
void main() {
  float a = vA * 0.3 * smoothstep(0.5, 0.12, length(vQ));
  vec3 c = mix(uLit, vec3(1.0), 0.3) + uGlow;
  c = mix(c, uHaze, hz(vDist));
  gl_FragColor = vec4(c, a);
  #include <colorspace_fragment>
}` });
    m.userData.noOutline = true; m.userData.solid = false;
    const o = farMesh(sg, m, g, "avalanche-spray"); o.renderOrder = 4; }
  // chunks spat ahead: 200 tumbling lumps on ballistic arcs, launched from the face and crest
  { const N = 200, a = [], v = [], q = [];
    for (let i = 0; i < N; i++) {
      a.push(4 + rnd() * 5, 1.5 + rnd() * 6.5, (rnd() * 2 - 1) * 18, 0.12 + rnd() ** 3 * 0.5);
      v.push(-(4 + rnd() * 7), 3 + rnd() * 5, (rnd() * 2 - 1) * 2.0, 0.9 + rnd() * 0.7);
      q.push(rnd(), 2 + rnd() * 6, rnd() * 3.14, rnd() * 6.28);
    }
    const cg = new THREE.InstancedBufferGeometry().copy(new THREE.IcosahedronGeometry(1, 1)); cg.instanceCount = N;
    cg.setAttribute("aP", new THREE.InstancedBufferAttribute(new Float32Array(a), 4)); cg.setAttribute("aV", new THREE.InstancedBufferAttribute(new Float32Array(v), 4)); cg.setAttribute("aQ", new THREE.InstancedBufferAttribute(new Float32Array(q), 4));
    const m = snowMaterial({ color: "#eef4ff", uniforms: U, vHead: "attribute vec4 aP; attribute vec4 aV; attribute vec4 aQ; uniform float uTime, uAmt;",
      vPre: `float P = aV.w, tau = fract(aQ.x + uTime / P), s = tau * P;
        vec3 c = aP.xyz + aV.xyz * s + vec3(0.0, -4.9 * s * s, 0.0); c.y = max(c.y, 0.3 * aP.w);
        vec3 ax = normalize(vec3(sin(aQ.z) * cos(aQ.w), cos(aQ.z), sin(aQ.z) * sin(aQ.w)));
        mat3 R = rotAxis(ax, aQ.y * (uTime + aQ.x * 5.0));
        float env = smoothstep(0.0, 0.06, tau) * (1.0 - smoothstep(0.8, 1.0, tau));
        pos = c + R * (pos * aP.w * env * uAmt); nor = R * nor; M = modelMatrix;` });
    farMesh(cg, m, g, "avalanche-chunks"); }
  // twelve firs torn out and flipping end over end ahead of the wall (`firs: false` on a snowcap leaves them out: at
  // scale 3 they pass a near camera as one-frame dark shapes)
  if (firs) { const N = 12, a = [], v = [], q = [], fg = new THREE.InstancedBufferGeometry().copy(firGeometry()); fg.instanceCount = N;
    for (let i = 0; i < N; i++) {
      a.push(5.5 + rnd() * 4, 6 + rnd() * 2.5, -17 + (34 * (i + rnd() * 0.8)) / N, 3 + rnd() * 3);
      v.push(-(1.2 + rnd() * 2.6), 4 + rnd() * 2.5, (rnd() * 2 - 1) * 1.2, 2.2 + rnd() * 0.9);
      q.push(rnd(), (rnd() < 0.5 ? -1 : 1) * (2.6 + rnd() * 2.6), rnd() * 6.28, 0);
    }
    fg.setAttribute("aP", new THREE.InstancedBufferAttribute(new Float32Array(a), 4)); fg.setAttribute("aV", new THREE.InstancedBufferAttribute(new Float32Array(v), 4)); fg.setAttribute("aQ", new THREE.InstancedBufferAttribute(new Float32Array(q), 4));
    const m = snowMaterial({ vcol: true, uniforms: U, vHead: "attribute vec4 aP; attribute vec4 aV; attribute vec4 aQ; uniform float uTime, uAmt;",
      vPre: `float P = aV.w, tau = fract(aQ.x + uTime / P), s = tau * P;
        vec3 c = aP.xyz + aV.xyz * s + vec3(0.0, -3.2 * s * s, 0.0); c.y = max(c.y, 0.5);
        mat3 R = rotAxis(vec3(0.0, 0.0, 1.0), aQ.y * s + aQ.x * 6.28) * rotAxis(vec3(0.0, 1.0, 0.0), aQ.z);
        float env = smoothstep(0.0, 0.07, tau) * (1.0 - smoothstep(0.85, 1.0, tau));
        pos = c + R * ((pos - vec3(0.0, 0.5, 0.0)) * aP.w * env * uAmt); nor = R * nor; M = modelMatrix;` });
    farMesh(fg, m, g, "avalanche-firs"); }
  return { g, U };
}

function snowfront(P) {
  const S = P.spec, F = buildFront(P.whole, S.seed || 5);
  return { grip: 0, apply(ps, t) {
    const r = ridePath(ps.run ?? S.run ?? 0);
    P.root.position.set(r.at[0] + ps.x, r.at[1] + ps.y, r.at[2] + ps.z);
    P.root.rotation.set(0, rad(r.yaw + (ps.rot ?? 0)), rad(r.pitch));
    F.U.uTime.value = t;
  } };
}

// ---------- the cap, its slide, the track and the payoff wave ----------
const CAP_GLSL = `
uniform float uBreak, uSlide, uWave, uCapY, uTop, uFoot, uCrack, uPeakZ, uWaveX;
// x: the slab (snow), y: the track it left (scoured), z: the crack (an open gap)
vec3 capMask(vec2 xz, float h) {
  float s = uSlide;
  float lo = mix(uCapY, uFoot, smoothstep(0.0, 1.0, s)), top = uTop + 40.0;
  float hi = mix(top, uFoot + 34.0, smoothstep(0.0, 0.85, s));
  float h0 = uCapY + (h - lo) / max(hi - lo, 1.0) * (top - uCapY);   // where this height started, on the moving slab
  float fall = clamp((uTop - h) / (uTop - uFoot), 0.0, 1.0);
  float zc = mix(uPeakZ, 0.0, fall);                                   // the fall line: under the peak to the apron
  float halfW = mix(600.0, 66.0, smoothstep(0.0, 0.9, s));
  float chan = 1.0 - smoothstep(halfW * 0.82, halfW, abs(xz.y - zc));
  float wob = (16.0 * sin(xz.y * 0.021 + 1.3) + 9.0 * sin(xz.y * 0.057 + xz.x * 0.013)) * (1.0 - s);
  float band = smoothstep(-5.0, 5.0, h0 - uCapY - wob) * (1.0 - smoothstep(hi - 3.0, hi + 3.0, h));
  float crackY = uCrack + 11.0 * sin(xz.y * 0.035) + 5.0 * sin(xz.y * 0.11 + 2.0);
  float open = step(0.001, uBreak) * (1.0 - smoothstep(0.0, 0.15, s));
  float gap = 2.0 + 10.0 * uBreak;
  float crack = (1.0 - smoothstep(gap * 0.5, gap * 0.5 + 1.5, abs(h0 - crackY))) * open;
  float slab = band * chan * (1.0 - step(0.999, s)) * (1.0 - crack);
  float tw = mix(34.0, 22.0, fall) + 5.0 * sin(h * 0.05 + xz.x * 0.01);
  float track = (1.0 - smoothstep(tw * 0.75, tw, abs(xz.y - zc))) * step(h, uCrack + 6.0) * step(hi, h) * step(0.02, s) * step(uFoot - 30.0, h);
  return vec3(slab, track * (1.0 - slab), crack);
}
// debris down the apron where the wave has run: |z| under its half width, from the wave back up to the face
float apronMask(vec2 xz) {
  float hw = 56.0 + 7.0 * sin(xz.x * 0.09) + 4.0 * sin(xz.x * 0.31 + 1.0);
  float behind = step(0.001, uWave) * smoothstep(uWaveX + 6.0, uWaveX + 16.0, xz.x) * smoothstep(20.0, 30.0, xz.x);
  return (1.0 - smoothstep(hw - 6.0, hw, abs(xz.y))) * behind;
}`;
function capPatch(x0, x1, nx, z0, z1, nz, ux) {
  const g = new THREE.PlaneGeometry(1, 1, nx, nz), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = x0 + (x1 - x0) * ux(p.getX(i) + 0.5), z = z0 + (z1 - z0) * (p.getY(i) + 0.5); p.setXYZ(i, x, heightAt(x, z), z); }
  return upward(g);
}
function snowcap(P) {
  const S = P.spec, U = { uBreak: { value: 0 }, uSlide: { value: 0 }, uWave: { value: 0 }, uWaveX: { value: CAPRUN.footX }, uCapY: { value: SNOWSLOPE.capY },
    uTop: { value: SNOWSLOPE.peak.y }, uFoot: { value: 236 }, uCrack: { value: SNOWSLOPE.capY + 0.62 * (SNOWSLOPE.peak.y - SNOWSLOPE.capY) }, uPeakZ: { value: SNOWSLOPE.peak.z }, uTime: { value: 0 } };
  // the cap and the track on the face: one terrain-following sheet over the top of the face, lifted where the slab
  // is, drawn a little nearer than the rock (pullK) and cut away where there is neither snow nor track
  const face = capPatch(380, 1780, 150, -760, 1000, 150, (u) => u);
  const fm = snowMaterial({ color: "#ffffff", pullK: 0.004, uniforms: U,
    vHead: `${CAP_GLSL}\nuniform float uTime; varying float vH;`,
    vPre: `vH = pos.y; vec3 mk = capMask(pos.xz, pos.y); pos.y += mk.x * (5.0 + 9.0 * uSlide + 3.0 * sin(pos.x * 0.05 + uTime * 2.0) * uSlide) + mk.y * 0.6;`,
    fHead: `${CAP_GLSL}\nvarying float vH;`,
    fBody: `vec3 mk = capMask(vW.xz, vH);
      if (mk.x < 0.5 && mk.y < 0.5 && mk.z < 0.5) discard;
      float streak = 0.5 + 0.5 * sin(vW.z * 0.9 + sin(vW.x * 0.02) * 6.0) * sin(vW.z * 0.23 + vW.x * 0.004);
      vec3 snow = mix(vec3(0.97, 0.98, 1.0), vec3(0.86, 0.9, 0.98), 0.3 * streak);
      vec3 track = mix(vec3(0.6, 0.66, 0.8), vec3(0.8, 0.86, 0.97), smoothstep(0.35, 0.75, streak));
      alb = mk.x >= 0.5 ? snow : mk.z >= 0.5 ? vec3(0.2, 0.25, 0.38) : track;
      if (mk.x >= 0.5) N = normalize(N + vec3(0.0, 0.35, 0.0));
      glowK = mk.x >= 0.5 ? 1.0 : 0.3;` });
  farMesh(face, fm, P.whole, "snowcap-face");
  // debris down the apron behind the wave
  const apron = capPatch(18, 540, 170, -72, 72, 40, (u) => u);
  const am = snowMaterial({ color: "#ffffff", pullK: 0.002, uniforms: U,
    vHead: `${CAP_GLSL}\nuniform float uTime;`,
    vPre: `float m = apronMask(pos.xz); pos.y += m * (0.35 + 0.5 * max(0.0, sin(pos.x * 0.7) * sin(pos.z * 0.6)));`,
    fHead: `${CAP_GLSL}
// churned lumps: the nearest of a jittered grid of points (cells 2.6 m), each lump lit on its sunny side
vec3 lumps(vec2 p) {
  vec2 c = floor(p), best = vec2(9.0); float r = 0.0;
  for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) {
    vec2 q = c + vec2(float(i), float(j)), h = fract(sin(vec2(dot(q, vec2(127.1, 311.7)), dot(q, vec2(269.5, 183.3)))) * 43758.5453);
    vec2 d = q + 0.15 + 0.7 * h - p; if (dot(d, d) < dot(best, best)) { best = d; r = 0.25 + 0.3 * h.x; }
  }
  return vec3(best, r);
}`,
    fBody: `float m = apronMask(vW.xz); if (m < 0.5) discard;
      vec3 L = lumps(vW.xz / 2.6);
      float shade = smoothstep(L.z - 0.06, L.z + 0.04, length(L.xy)) * step(0.0, dot(L.xy, normalize(uL.xz)));
      alb = mix(vec3(0.97, 0.98, 1.0), vec3(0.72, 0.8, 0.95), 0.7 * shade);` });
  farMesh(apron, am, P.whole, "snowcap-debris");
  // the payoff wave: a snowfront (scale: the prop's scale) running down the apron
  const wg = new THREE.Group(); wg.rotation.order = "YXZ"; P.whole.add(wg);
  const F = buildFront(wg, (S.seed || 9) + 3, false, S.firs !== false);
  return { grip: 0, apply(ps, t) {
    P.root.position.set(0, 0, 0); P.root.rotation.set(0, 0, 0); P.root.scale.set(1, 1, 1);
    const run = clamp(ps.run ?? S.run ?? 0), brk = clamp(ps.break ?? S.break ?? 0);
    const slide = clamp(run / CAPRUN.slab), w = clamp((run - CAPRUN.slab) / (CAPRUN.arrive - CAPRUN.slab)), fall = clamp((run - CAPRUN.arrive) / (1 - CAPRUN.arrive));
    U.uBreak.value = brk; U.uSlide.value = slide; U.uTime.value = t;
    const xw = CAPRUN.footX * (1 - w); U.uWave.value = run > CAPRUN.slab ? w : 0; U.uWaveX.value = xw;
    const sc = Math.max(ps.scale ?? 3, 0.001), on = sstep(CAPRUN.slab - 0.02, CAPRUN.slab + 0.04, run) * (1 - fall);
    wg.visible = on > 0.002;
    const pitch = Math.atan2(slopeAt(xw + 1) - slopeAt(xw - 1), 2);
    wg.position.set(xw, slopeAt(xw) - 0.6 * sc * fall, 0); wg.rotation.set(0, 0, pitch);
    wg.scale.set(sc * Math.max(on, 0.001), sc * Math.max(on * (1 - 0.85 * fall), 0.001), sc * Math.max(on, 0.001));
    F.U.uTime.value = t;
  } };
}

// ---------- the mound ----------
function snowmound(P) {
  const S = P.spec, NR = 30, NA = 80, pos = [], idx = [], [cx, cz] = MOUND.c;
  for (let i = 0; i <= NR; i++) for (let j = 0; j < NA; j++) {
    const r = (MOUND.R + 1.2) * (i / NR) ** 1.25, a = (j / NA) * Math.PI * 2, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    const rim = 0.6 * Math.sin(a * 3 + 0.7) + 0.4 * Math.sin(a * 5 + 2.1);
    const rr = Math.hypot(x - cx, z - cz) - rim * sstep(6, 11, r);
    pos.push(x, MOUND.h * (1 - sstep(MOUND.Rin, MOUND.R, rr)) - 0.08, z);
  }
  for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) {
    const a = i * NA + j, b = i * NA + ((j + 1) % NA), c = a + NA, d = b + NA;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = snowMaterial({ color: "#f7faff", uniforms: { uRise: { value: 0 } }, vHead: "uniform float uRise;", vPre: "pos.y = (pos.y + 0.08) * uRise - 0.08;" });
  const o = farMesh(g, m, P.whole, "snowmound");
  return { grip: 0, apply(ps) {
    P.root.position.set(ps.x, ps.y, ps.z);
    const k = clamp(ps.rise ?? S.rise ?? 0); m.uniforms.uRise.value = k; o.visible = k > 0.001;
  } };
}

export const AVALANCHE_KINDS = { cottagesled, chimneycap, snowfront, snowcap, snowmound };
