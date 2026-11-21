#!/usr/bin/env node
// Camera lint: the camera moves a viewer reads as indecision, from the storyboard alone (well under a second).
//
//   node qa/camera.mjs storyboards/x.json
//
// Every frame's camera comes from engine/page/timeline.js cameraState (the one the renderer uses), with the shakes
// left out, so hand-set shots, directed shots (engine/direct.mjs) and camera paths are all checked the same way.
// Quality plan item 7 (4 Nov 2026; from the "video stuff 4" articles): each rule is a note, never a failure.
//
//   push-back   the camera pushes in and then pulls back out without a cut (in by 3 % or more of the picture, then
//               out by 3 % or more within 2.5 s; a reaction's slow push is 4 %). Pick one: hold the close framing, or cut back to the wide one.
//   line        a cut puts the camera on the other side of two characters who are in both shots (they swap sides on
//               screen: the 180-degree rule)
//   jump-cut    a cut between two framings of the same thing that differ by under 15 % in size and 20 degrees in
//               direction: it reads as a skipped frame. Change the size by a step or the angle by 30 degrees
//   short-shot  a shot under 0.4 s (an insert's minimum), too short to read on a phone
//   drift       the camera never stops: it moves through more than 80 % of the clip (a slow push on every shot
//               flattens the push that matters)
import { pathToFileURL } from "node:url";
import { loadStoryboard, loadCharacters } from "../engine/load.mjs";
import { actorState, cameraState } from "../engine/page/timeline.js";

export const LINT = { push: 0.03, backWithin: 2.5, jumpSize: 1.15, jumpAngle: 20, shortShot: 0.4, drift: 0.8, aspect: 9 / 16 };

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
// the camera without its shakes: picture height at the look point (metres), the view direction, the look point
function camAt(sb, t) {
  const c = cameraState({ ...sb, fx: (sb.fx || []).filter((f) => f.do !== "shake") }, t), d = sub(c.look, c.pos), D = len(d) || 1;
  return { t, pos: c.pos, look: c.look, fov: c.fov, shot: c.shotIndex, V: 2 * D * Math.tan((c.fov * Math.PI) / 360), dir: d.map((x) => x / D) };
}
const angle = (a, b) => (Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * 180) / Math.PI;
const f2 = (x) => x.toFixed(2);

export function cameraLint(sb, chars = null) {
  const fps = sb.fps ?? 30, n = Math.round((sb.duration ?? 0) * fps), out = [];
  const note = (rule, msg) => out.push({ group: "creative", level: "note", check: "camera", rule, msg });
  if (n < 2) return out;
  const cam = Array.from({ length: n }, (_, i) => camAt(sb, i / fps));
  // a cut: a new shot that doesn't start where the camera was (a shot that starts where the move ended is one take, as
  // the directed camera's snap-ins and "reframed with the action" moves are)
  const cuts = [];
  if (!Array.isArray(sb.camera)) for (const s of sb.shots || []) {
    if (!(s.at > 0) || s.at >= (sb.duration ?? 0)) continue;
    const a = camAt(sb, s.at - 1e-4), b = camAt(sb, s.at + 1e-6), i = Math.ceil(s.at * fps - 1e-6);
    if (i < 1 || i >= n || cuts.includes(i)) continue;
    if (len(sub(a.pos, b.pos)) > 0.02 * Math.max(a.V, 0.3) + 0.01 || Math.abs(a.fov - b.fov) > 0.5 || angle(a.dir, b.dir) > 1) cuts.push(i);
  }
  cuts.sort((x, y) => x - y);
  const edges = [0, ...cuts, n];

  // push-back: inside one take, a push in followed by a pull out
  for (let k = 0; k + 1 < edges.length; k++) {
    const seg = cam.slice(edges[k], edges[k + 1]);
    let hi = seg[0], lo = null;
    for (const c of seg) {
      if (!lo) { if (c.V > hi.V) hi = c; else if (c.V <= hi.V * (1 - LINT.push)) lo = c; continue; }
      if (c.V < lo.V) { lo = c; continue; }
      if (c.V >= lo.V * (1 + LINT.push)) {
        if (c.t - lo.t <= LINT.backWithin) {
          let top = c; for (const q of seg) if (q.t > c.t && q.V > top.V + 1e-6) top = q; else if (q.t > c.t) break;
          note("push-back", `${f2(hi.t)}-${f2(top.t)} s: the camera pushes in ${Math.round((1 - lo.V / hi.V) * 100)} % (to ${f2(lo.t)} s) and pulls back out ${Math.round((top.V / lo.V - 1) * 100)} % without a cut; hold the close framing or cut back to the wide one`);
          break;
        }
        hi = c; lo = null;
      }
    }
  }

  // across each cut: jump cuts and crossing the line
  const aspect = sb.frame === "wide" ? 16 / 9 : LINT.aspect;
  const hfov = (c) => 2 * Math.atan(Math.tan((c.fov * Math.PI) / 360) * aspect);
  const inView = (c, p) => { const d = sub(p, c.pos), D = len(d); if (D < 1e-6) return false; const a = (angle(c.dir, d.map((x) => x / D)) * Math.PI) / 180; return a < Math.max(hfov(c), (c.fov * Math.PI) / 360) * 0.95 && d[0] * c.dir[0] + d[1] * c.dir[1] + d[2] * c.dir[2] > 0; };
  const people = (t) => (sb.cast || []).flatMap((c) => { const def = chars?.[c.character]; if (!def) return []; const s = actorState(sb, c, def, t); return s.visible === false ? [] : [{ id: c.id, p: [s.x, s.y + 0.5, s.z] }]; });
  for (const i of cuts) {
    const at = (sb.shots || []).filter((q) => Math.ceil(q.at * fps - 1e-6) === i).pop()?.at ?? i / fps;
    const a = camAt(sb, at - 1e-4), b = camAt(sb, at + 1e-6), ratio = Math.max(a.V, b.V) / Math.min(a.V, b.V), turn = angle(a.dir, b.dir);
    const shift = len(sub(a.look, b.look)) / Math.min(a.V, b.V);
    if (ratio < LINT.jumpSize && turn < LINT.jumpAngle && shift < 0.25) note("jump-cut", `cut at ${f2(at)} s: the framings differ by ${Math.round((ratio - 1) * 100)} % in size and ${Math.round(turn)} degrees in direction; it reads as a skipped frame (change the size a step or the angle 30 degrees, or don't cut)`);
    if (!chars) continue;
    const pa = people(a.t), pb = people(b.t), side = (c, p, q) => Math.sign((q.p[0] - p.p[0]) * (c.pos[2] - p.p[2]) - (q.p[2] - p.p[2]) * (c.pos[0] - p.p[0]));
    for (let x = 0; x < pa.length; x++) for (let y = x + 1; y < pa.length; y++) {
      const P = pa[x], Q = pa[y], P2 = pb.find((r) => r.id === P.id), Q2 = pb.find((r) => r.id === Q.id);
      if (!P2 || !Q2 || ![P.p, Q.p].every((p) => inView(a, p)) || ![P2.p, Q2.p].every((p) => inView(b, p))) continue;
      const s1 = side(a, P, Q), s2 = side(b, P2, Q2);
      if (s1 && s2 && s1 !== s2) note("line", `cut at ${f2(at)} s: the camera crosses the line between ${P.id} and ${Q.id}, so they swap sides on screen; keep the camera on one side of them`);
    }
  }

  // shots too short to read
  for (let k = 1; k + 1 < edges.length; k++) {
    const d = (edges[k + 1] - edges[k]) / fps;
    if (d < LINT.shortShot - 1e-6) note("short-shot", `the shot at ${f2(edges[k] / fps)} s lasts ${f2(d)} s (under ${LINT.shortShot} s reads as a flash on a phone)`);
  }

  // a camera that never stops
  let moving = 0;
  for (let i = 1; i < n; i++) if (!cuts.includes(i) && (len(sub(cam[i].pos, cam[i - 1].pos)) > 1e-4 || Math.abs(cam[i].fov - cam[i - 1].fov) > 1e-3 || angle(cam[i].dir, cam[i - 1].dir) > 0.01)) moving++;
  if (moving / (n - 1) > LINT.drift) note("drift", `the camera moves through ${Math.round((moving / (n - 1)) * 100)} % of the clip; give it still shots so the moves that matter read`);

  if (!out.length) out.push({ group: "creative", level: "pass", check: "camera", msg: `${cuts.length} cut${cuts.length === 1 ? "" : "s"}, no push-back, jump cut, line cross or flash shot; the camera moves in ${Math.round((moving / (n - 1)) * 100)} % of the frames` });
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = process.argv[2];
  if (!file) { console.error("usage: node qa/camera.mjs <storyboard.json>"); process.exit(2); }
  const sb = loadStoryboard(file);
  for (const r of cameraLint(sb, loadCharacters(sb))) console.log(`  ${r.level === "pass" ? "ok  " : "note"}  camera${r.rule ? ` ${r.rule}` : ""}: ${r.msg}`);
}

// sign-cut (Potato Desk 12, 20 Nov 2026): a sign whose number the frame's side edge cuts in two reads as another
// number. Two-shots from the left kept only the "0" of the board's "10 YEARS" for 20 s of the clip, and the viewer
// (Sol round 2, item 1) read the sentence as zero before the judge had sent anyone home. Each text box a prop kind
// names here is projected through the camera every 0.1 s; a stretch of 0.3 s or more with the box cut by the left or
// right edge (some of it in frame, some out, its height mostly in) warns. Whole in, or whole out, is fine.
const SIGN_TEXT = {
  // props-court.js: the number bay of the sentence board (BAY: 0.50 x 0.33 at x -0.31, y -0.135, its face z +0.064)
  sentenceboard: [{ name: "number", x: -0.31, y: -0.135, z: 0.064, w: 0.5, h: 0.33 }],
};
export function signCut(sb) {
  const out = [], dt = 0.1, T = sb.duration ?? 0, aspect = sb.frame === "wide" ? 16 / 9 : LINT.aspect;
  for (const p of sb.props || []) for (const box of SIGN_TEXT[p.kind] || []) {
    const r = ((p.rot ?? 0) * Math.PI) / 180, at = (dx, dy) => { const lx = box.x + dx, lz = box.z; return [(p.x ?? 0) + lx * Math.cos(r) + lz * Math.sin(r), (p.y ?? 0) + box.y + dy, (p.z ?? 0) - lx * Math.sin(r) + lz * Math.cos(r)]; };
    const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => at((a * box.w) / 2, (b * box.h) / 2));
    let from = null;
    const close = (t) => { if (from != null && t - from >= 0.3 - 1e-6) out.push({ level: "warn", check: "sign-cut", msg: `${p.id}: its ${box.name} is cut in two by the frame's side edge at ${f2(from)}-${f2(t)} s: what is left can read as another number (a "10" read as "0"); frame it whole or keep it out` }); from = null; };
    for (let t = 0; t <= T + 1e-9; t += dt) {
      const c = camAt(sb, t), up = Math.abs(c.dir[1]) > 0.99 ? [0, 0, -1] : [0, 1, 0];
      const right = norm(cross(c.dir, up)), u = cross(right, c.dir), th = Math.tan((c.fov * Math.PI) / 360), tw = th * aspect;
      const px = corners.map((q) => { const d = sub(q, c.pos), z = dot(d, c.dir); return z > 0.05 ? [dot(d, right) / z / tw, dot(d, u) / z / th] : null; });
      let cut = false;
      if (px.every(Boolean)) {
        const xs = px.map((q) => q[0]), ys = px.map((q) => q[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.max(-1, Math.min(...ys)), y1 = Math.min(1, Math.max(...ys));
        const hIn = y1 > y0 ? (y1 - y0) / (Math.max(...ys) - Math.min(...ys)) : 0;
        cut = hIn > 0.5 && ((x0 < -1 && x1 > -1) || (x0 < 1 && x1 > 1));
      }
      if (cut && from == null) from = t; else if (!cut) close(t);
    }
    close(T);
  }
  return out;
}
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = len(a) || 1; return a.map((x) => x / l); };
