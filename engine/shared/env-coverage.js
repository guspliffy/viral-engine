// Does the camera stay where a layered painted environment covers the frame? (set "type": "env", engine/page/set-env.js)
// Pure math on env.json and the camera of every frame, so it runs in well under a second, before any render.
//
// A layered painting only exists where the painting camera saw it. A camera that moves too far sees past it:
//   ground-edge  the floor runs off the painted picture (bare background below the feet)            -> fail
//   sky-edge     the sky card ends inside the frame                                                 -> fail
//   card-edge    a layer whose painting reaches the picture's edge (a tree cut by the frame) ends
//                inside the frame, so its cut shows as a straight line in the air                   -> fail
//   behind       the floor is seen from behind the painting camera (nothing was painted there)      -> fail
//   margin       the frame shows the mirrored margin outside the real painting (fine for grass and
//                sky, but look at it)                                                                -> warn
//   gap          a near layer slides further over a far one than the far one was painted on behind
//                it (a sliver of the layer behind may show)                                          -> warn
// The safe range (envRange) is how far the camera may move from the painting camera along each axis, and how far it
// may turn, before anything fails.

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((x) => x / l); };
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

export function paintingCamera(E) {
  const p = (E.eye.pitch * Math.PI) / 180;
  return { pos: E.eye.pos, f: E.eye.f, W: E.size[0], H: E.size[1], PX: E.pad[0], PY: E.pad[1],
    right: [1, 0, 0], up: [0, Math.cos(p), -Math.sin(p)], fwd: [0, -Math.sin(p), -Math.cos(p)] };
}
// a world point -> painting pixel [u, v] and its view distance z (z <= 0: behind the painting camera)
export function toPicture(P, w) {
  const q = sub(w, P.pos), z = dot(q, P.fwd);
  return { u: P.W / 2 + (P.f * dot(q, P.right)) / z, v: P.H / 2 - (P.f * dot(q, P.up)) / z, z };
}

// one frame: cam { pos, look, fov (vertical, degrees) }, aspect = width / height. Each sample ray is traced through
// the layers like the renderer draws them: the floor and every card (its coarse alpha mask from env.json), nearest
// first; the first solid thing decides. A hole (past the floor's painted edge, past a card's cut edge, past the sky)
// is a fail; the mirrored margin outside the real painting a warning.
export function frameCoverage(E, cam, aspect = 9 / 16, grid = [9, 16]) {
  const P = paintingCamera(E), out = [];
  const fwd = norm(sub(cam.look, cam.pos)), right = norm(cross(fwd, [0, 1, 0])), up = cross(right, fwd);
  const th = Math.tan((cam.fov * Math.PI) / 360), tw = th * aspect;
  const vFar = E.ground.row * P.H, inPic = (q) => q.u >= 0 && q.u <= P.W && q.v >= 0 && q.v <= P.H;
  const inRect = (q, r) => q.u >= r[0] && q.u <= r[2] && q.v >= r[1] && q.v <= r[3];
  const solid = (c, q) => {   // the card's coarse alpha at a picture point inside its rect
    if (!c.mask) return true;
    const [x0, y0, x1, y1] = c.rect, gh = c.mask.length, gw = c.mask[0].length;
    const i = Math.min(gw - 1, Math.max(0, Math.floor(((q.u - x0) / (x1 - x0)) * gw))), j = Math.min(gh - 1, Math.max(0, Math.floor(((q.v - y0) / (y1 - y0)) * gh)));
    return c.mask[j][i] === "1";
  };
  const cut = (c, q) => {   // past the rect: does the card's painting run up to that side (a visible cut)?
    const side = q.u < c.rect[0] ? "left" : q.u > c.rect[2] ? "right" : q.v < c.rect[1] ? "top" : "bottom";
    const prof = c.border?.[side] || [], along = side === "left" || side === "right" ? (q.v - c.rect[1]) / (c.rect[3] - c.rect[1]) : (q.u - c.rect[0]) / (c.rect[2] - c.rect[0]);
    if (along < 0 || along > 1) return null;
    const a = prof.length ? prof[Math.round(along * (prof.length - 1))] : 0;
    return a > 0.15 ? side : null;
  };
  let margin = 0, n = 0;
  const sky = E.cards.find((c) => c.sky);
  for (let j = 0; j < grid[1]; j++) for (let i = 0; i < grid[0]; i++) {
    const sx = (i / (grid[0] - 1)) * 2 - 1, sy = 1 - (j / (grid[1] - 1)) * 2;
    const d = norm(add(add(fwd, right, sx * tw), up, sy * th));
    const at = `${Math.round(((sx + 1) / 2) * 100)}% across, ${Math.round(((1 - sy) / 2) * 100)}% down`;
    n++;
    const hits = [];   // { s: distance along the ray, kind: "ok" | "margin" | fail rule, msg }
    if (d[1] < -1e-6) {
      const s = -cam.pos[1] / d[1], q = toPicture(P, add(cam.pos, d, s));
      if (q.z <= 0.05) hits.push({ s, kind: "behind", msg: "the floor here is behind the painting camera (never painted)" });
      else if (q.v >= vFar - 1) {
        if (q.u < -P.PX || q.u > P.W + P.PX || q.v > P.H + P.PY) hits.push({ s, kind: "ground-edge", msg: "the painted floor ends" });
        else hits.push({ s, kind: inPic(q) ? "ok" : "margin" });
      }
    }
    const den = dot(d, P.fwd);
    for (const c of E.cards) {
      if (c.sky || den <= 1e-6) continue;
      const s = (c.z - dot(sub(cam.pos, P.pos), P.fwd)) / den; if (s <= 0) continue;
      const q = toPicture(P, add(cam.pos, d, s));
      if (inRect(q, c.rect)) { if (solid(c, q)) hits.push({ s, kind: inPic(q) ? "ok" : "margin" }); continue; }
      const side = cut(c, q);
      if (side) hits.push({ s, kind: "card-edge", msg: `the ${c.name} layer ends on its ${side} side` });
    }
    if (sky) {
      if (den <= 1e-6) hits.push({ s: 1e9, kind: "sky-edge", msg: "the camera looks away from the painting" });
      else {
        const s = (sky.z - dot(sub(cam.pos, P.pos), P.fwd)) / den, q = toPicture(P, add(cam.pos, d, s));
        hits.push({ s, kind: !inRect(q, sky.rect) ? "sky-edge" : inPic(q) ? "ok" : "margin", msg: "the sky ends" });
      }
    }
    hits.sort((a, b) => a.s - b.s);
    const h = hits[0];
    if (!h) { out.push({ rule: "sky-edge", level: "fail", at, msg: "nothing painted here" }); continue; }
    if (h.kind === "margin") margin++;
    else if (h.kind !== "ok") out.push({ rule: h.kind, level: "fail", at, msg: h.msg });
  }
  if (margin / n > 0.02) out.push({ rule: "margin", level: "warn", at: "", msg: `${Math.round((100 * margin) / n)} % of the frame shows the mirrored margin outside the painting` });
  // gaps: how far (picture pixels) a nearer layer slides over a farther one, against how far the farther one continues
  const off = sub(cam.pos, P.pos), lat = Math.hypot(dot(off, P.right), dot(off, P.up));
  const layers = [...E.cards.filter((c) => !c.sky)].sort((a, b) => a.z - b.z);
  let worst = null;
  for (let i = 0; i < layers.length; i++) for (let k = i + 1; k < layers.length; k++) {
    if (layers[i].share < 0.01 || layers[k].share < 0.01) continue;
    const [a, b] = [layers[i].rect, layers[k].rect];
    if (a[0] > b[2] || b[0] > a[2] || a[1] > b[3] || b[1] > a[3]) continue;   // never in front of each other
    const over = P.f * lat * (1 / layers[i].z - 1 / layers[k].z) - (layers[k].fill || 0);
    if (over > 0 && (!worst || over > worst.over)) worst = { over, a: layers[i], b: layers[k] };
  }
  if (worst) out.push({ rule: "gap", level: "warn", at: "", msg: `the ${worst.a.name} layer slides up to ${Math.round(worst.over)} px further over the ${worst.b.name} layer than it is painted behind (a sliver of the layer behind may show)` });
  return out;
}

// every frame of a compiled storyboard; cameraOf(t) -> { pos, look, fov }
export function envCoverage(E, cameraOf, duration, fps = 30) {
  const n = Math.max(1, Math.round(duration * fps)), fails = new Map(), warns = new Map();
  for (let i = 0; i < n; i++) {
    const t = i / fps;
    for (const r of frameCoverage(E, cameraOf(t))) {
      const m = r.level === "fail" ? fails : warns, k = `${r.rule}: ${r.msg.replace(/\(picture point.*\)/, "").replace(/\d+ px/g, "#")}`;
      const e = m.get(k) || { ...r, from: t, to: t, frames: 0 };
      e.to = t; e.frames++; m.set(k, e);
    }
  }
  return { fails: [...fails.values()], warns: [...warns.values()], frames: n };
}

// the safe range: from the painting camera looking where it looked, how far each move can go before a fail
export function envRange(E, base = null) {
  const P = paintingCamera(E), b = base || { pos: P.pos, look: add(P.pos, P.fwd, 5), fov: 36 };
  const ok = (c) => !frameCoverage(E, c).some((r) => r.level === "fail");
  const reach = (fn, max) => { let lo = 0, hi = max; if (ok(fn(hi))) return hi; for (let k = 0; k < 18; k++) { const m = (lo + hi) / 2; if (ok(fn(m))) lo = m; else hi = m; } return lo; };
  const move = (axis, k) => (m) => { const o = [0, 0, 0]; o[axis] = k * m; return { ...b, pos: add(b.pos, o), look: add(b.look, o) }; };
  const turn = (k) => (deg) => { const a = (k * deg * Math.PI) / 180, d = sub(b.look, b.pos); return { ...b, look: add(b.pos, [d[0] * Math.cos(a) + d[2] * Math.sin(a), d[1], -d[0] * Math.sin(a) + d[2] * Math.cos(a)]) }; };
  const tilt = (k) => (deg) => { const a = (k * deg * Math.PI) / 180, d = sub(b.look, b.pos), h = Math.hypot(d[0], d[2]), el = Math.atan2(d[1], h) + a; return { ...b, look: add(b.pos, [(d[0] / h) * Math.cos(el) * 5, Math.sin(el) * 5, (d[2] / h) * Math.cos(el) * 5]) }; };
  const r2 = (x) => Math.round(x * 100) / 100;
  return {
    base: { pos: b.pos.map(r2), fov: b.fov },
    left: r2(reach(move(0, -1), 6)), right: r2(reach(move(0, 1), 6)), down: r2(reach(move(1, -1), b.pos[1] - 0.05)), up: r2(reach(move(1, 1), 4)),
    in: r2(reach(move(2, -1), 8)), out: r2(reach(move(2, 1), 8)),
    panLeft: r2(reach(turn(1), 60)), panRight: r2(reach(turn(-1), 60)), tiltUp: r2(reach(tilt(1), 40)), tiltDown: r2(reach(tilt(-1), 40)),
    fovMax: r2(reach((x) => ({ ...b, fov: b.fov + x }), 60) + b.fov),
  };
}
