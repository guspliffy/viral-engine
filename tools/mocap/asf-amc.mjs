// Reads the CMU Graphics Lab Motion Capture Database's skeleton (.asf) and motion (.amc) files and gives the world
// position of every joint on every frame, in metres, y up (the database's own axes). Forward kinematics as the
// database's own tools do it: a bone's local turn is C · R(dof) · C⁻¹ (C from the bone's "axis" line), its end is the
// parent's end plus length × (world turn · direction). Pure and deterministic.
//   import { readAsf, readAmc, pose } from "./asf-amc.mjs";
//   const sk = readAsf(fs.readFileSync("120.asf", "utf8")), frames = readAmc(fs.readFileSync("120_09.amc", "utf8"));
//   const joints = pose(sk, frames[0]);   // { root: [x, y, z], lfemur: [...], ... } (each bone's far end)
// Data: http://mocap.cs.cmu.edu/ ("free for all uses"; "may be copied, modified, or redistributed without
// permission"); the authors ask for the credit "The data used in this project was obtained from mocap.cs.cmu.edu.
// The database was created with funding from NSF EIA-0196217."

const D2R = Math.PI / 180;
// the database's lengths are in inches over the skeleton's length scale (its FAQ: (1 / 0.45) * 2.54 / 100)
const INCH = 0.0254;

const lines = (txt) => txt.replace(/\r/g, "").split("\n");

// 3x3 matrices as flat arrays, row major
const mul = (a, b) => {
  const o = new Array(9);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
  return o;
};
const tr = (a) => [a[0], a[3], a[6], a[1], a[4], a[7], a[2], a[5], a[8]];
const app = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
const rx = (a) => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; };
const ry = (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
const rz = (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
// "XYZ" in the files: turn about x first, then y, then z (M = Rz · Ry · Rx)
const euler = (x, y, z) => mul(rz(z * D2R), mul(ry(y * D2R), rx(x * D2R)));

export function readAsf(txt) {
  const sk = { scale: 1, bones: {}, children: {}, root: { order: [], axis: [0, 0, 0] } };
  let sec = "", cur = null;
  for (const raw of lines(txt)) {
    const l = raw.trim();
    if (!l || l.startsWith("#")) continue;
    if (l.startsWith(":")) {
      const [k, ...rest] = l.split(/\s+/);
      sec = k;
      if (k === ":units") continue;
      continue;
    }
    const w = l.split(/\s+/);
    if (sec === ":units" && w[0] === "length") sk.scale = Number(w[1]);
    else if (sec === ":root") {
      if (w[0] === "order") sk.root.order = w.slice(1).map((s) => s.toLowerCase());
      if (w[0] === "orientation") sk.root.axis = w.slice(1, 4).map(Number);
    } else if (sec === ":bonedata") {
      if (w[0] === "begin") cur = { dof: [], axis: [0, 0, 0], dir: [0, 0, 0], len: 0 };
      else if (w[0] === "end") { sk.bones[cur.name] = cur; cur = null; }
      else if (w[0] === "name") cur.name = w[1];
      else if (w[0] === "direction") cur.dir = w.slice(1, 4).map(Number);
      else if (w[0] === "length") cur.len = Number(w[1]);
      else if (w[0] === "axis") cur.axis = w.slice(1, 4).map(Number);
      else if (w[0] === "dof") cur.dof = w.slice(1).map((s) => s.toLowerCase());
    } else if (sec === ":hierarchy") {
      if (w[0] === "begin" || w[0] === "end") continue;
      sk.children[w[0]] = (sk.children[w[0]] || []).concat(w.slice(1));
    }
  }
  const m = INCH / sk.scale;
  for (const b of Object.values(sk.bones)) {
    b.lenM = b.len * m;
    b.C = euler(...b.axis); b.Ci = tr(b.C);
  }
  sk.m = m;
  return sk;
}

// frames: [{ root: [tx, ty, tz, rx, ry, rz] (root order), lfemur: [rx, ry, rz], ... }, ...]
export function readAmc(txt) {
  const out = [];
  let f = null;
  for (const raw of lines(txt)) {
    const l = raw.trim();
    if (!l || l.startsWith("#") || l.startsWith(":")) continue;
    if (/^\d+$/.test(l)) { f = {}; out.push(f); continue; }
    if (!f) continue;
    const w = l.split(/\s+/);
    f[w[0]] = w.slice(1).map(Number);
  }
  return out;
}

// world positions of every bone's far end (and "root"), metres, plus each bone's world turn (rot[name], row major)
export function pose(sk, frame) {
  const pos = {}, rot = {};
  const R = sk.root, v = frame.root || [0, 0, 0, 0, 0, 0], g = {};
  R.order.forEach((k, i) => (g[k] = v[i]));
  const C = euler(...R.axis), Ci = tr(C);
  rot.root = mul(C, mul(euler(g.rx || 0, g.ry || 0, g.rz || 0), Ci));
  pos.root = [(g.tx || 0) * sk.m, (g.ty || 0) * sk.m, (g.tz || 0) * sk.m];
  const walk = (parent) => {
    for (const name of sk.children[parent] || []) {
      const b = sk.bones[name], d = frame[name] || [], a = { rx: 0, ry: 0, rz: 0 };
      b.dof.forEach((k, i) => (a[k] = d[i] || 0));
      rot[name] = mul(rot[parent], mul(b.C, mul(euler(a.rx, a.ry, a.rz), b.Ci)));
      const e = app(rot[name], b.dir);
      pos[name] = [pos[parent][0] + b.lenM * e[0], pos[parent][1] + b.lenM * e[1], pos[parent][2] + b.lenM * e[2]];
      walk(name);
    }
  };
  walk("root");
  return { pos, rot };
}

// every frame's joints: { fps, n, joints: [{ name: [x, y, z] }, ...] }
export function track(sk, frames, fps = 120) {
  return { fps, n: frames.length, joints: frames.map((f) => pose(sk, f).pos) };
}
