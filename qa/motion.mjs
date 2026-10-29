#!/usr/bin/env node
// Motion check: finds pops from the storyboard alone, in seconds, before anything is rendered. It computes every
// actor's state frame by frame (the same timeline.js the renderer uses) and flags a value that jumps between two
// frames far more than it moves in the frames around it: a hand that teleports, a body that snaps, wings that flick.
//
//   node qa/motion.mjs storyboards/x.json          -> list of jumps, blinks on key lines, long hop crouches, eyes that
//                                                     don't lead a move, reactions too short to read (exit 0; all warnings)
//
// Covered on purpose: frames under a flash of 0.5 or more, actors hidden or off camera, limbs in the fries form,
// whole turns.
//
// Feet: a planted foot (timeline.js st.plant) may only move during a deliberate step (a move, a turn, a hop, a dance
// step, sitting down or standing up). Anything else that slides it, even slowly, is reported as "foot slides".
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadStoryboard } from "../engine/load.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// how far a value may move between two frames before it counts as a jump (metres, radians, or 0..1 levels),
// and how much bigger than the steps either side it must be
const LIMIT = { x: 0.03, y: 0.03, z: 0.03, yaw: 0.12, lean: 0.1, pitch: 0.1, squash: 0.06, wings: 0.25, flap: 0.25, tuck: 0.3, hand: 0.04 };
const RATIO = 4;
const SLIDE = 0.003;   // metres a planted foot may drift in one frame (9 cm a second) outside a step
const STEPS = new Set(["move", "run", "turn", "hop", "fly", "hover", "drop", "sit", "stand", "kneel", "grow"]);   // grow: the feet spread as it grows

// the values the checks follow for one actor at one moment: body position and pose, and both hands
function values(st, def, t, handTarget) {
  const rx = def.body.width / 2, H = def.body.height, v = {};
  for (const k of ["x", "y", "z", "yaw", "lean", "pitch", "squash", "wings", "flap", "tuck"]) v[k] = st[k] ?? 0;
  for (const [s, sx] of [["R", -1], ["L", 1]]) {
    const a = st.arms[s], f = handTarget(a.from, sx, rx, H, t), g = handTarget(a.pose, sx, rx, H, t);
    v[`hand${s}`] = f.map((q, j) => q + (g[j] - q) * a.p);
  }
  return v;
}

export async function motionJumps(sb, fps = 30) {
  const { actorState, flashAt } = await import("../engine/page/timeline.js");
  const { handTarget } = await import("../engine/page/potato.js");
  const { isDance } = await import("../engine/page/dance.js");
  const THREE = await import("three"), cam = new THREE.PerspectiveCamera(32, 1080 / 1920, 0.05, 300), v3 = new THREE.Vector3();
  const { cameraState, cutBetween } = await import("../engine/page/timeline.js");
  // off camera (a cheat behind a cut is fine): the body's middle projects outside the frame with a margin
  const offScreen = (st, t) => {
    const k = cameraState(sb, t); cam.position.fromArray(k.pos); cam.fov = k.fov; cam.updateProjectionMatrix(); cam.lookAt(v3.fromArray(k.look)); cam.updateMatrixWorld(true);
    const p = v3.set(st.x, st.y + 0.45 * (st.scale ?? 1), st.z).project(cam);
    return Math.abs(p.x) > 1.35 || Math.abs(p.y) > 1.2 || p.z > 1;
  };
  const n = Math.round(sb.duration * fps), out = [];
  for (const c of sb.cast || []) {
    const file = path.join(ROOT, "characters", `${c.character}.json`);
    if (!fs.existsSync(file)) { out.push({ who: c.id, what: "missing", t: 0, size: 0, note: `character file not found: ${c.character}` }); continue; }
    const def = JSON.parse(fs.readFileSync(file, "utf8"));
    const rows = [];
    for (let i = 0; i <= n; i++) {
      const t = i / fps, st = actorState(sb, c, def, t), v = values(st, def, t, handTarget);
      // the feet where the plant puts them (in the air or sitting they go with the body: not checked)
      const P = st.plant, sc = st.scale ?? 1;
      const feet = P && P.w === 0 ? [-1, 1].map((sx) => [P.x + sc * (sx * 0.13 * Math.cos(P.yaw) + 0.04 * Math.sin(P.yaw)), P.z + sc * (-sx * 0.13 * Math.sin(P.yaw) + 0.04 * Math.cos(P.yaw))]) : null;
      // a dance step eases out over its release (dance.js) after its duration
      const stepping = (sb.actions || []).some((a) => {
        const dance = isDance(a.do) && a.do !== "shake";
        return a.who === c.id && (STEPS.has(a.do) || dance) && t >= a.at - 1e-6 && t <= a.at + (a.dur ?? (dance ? 1 : 0.3)) + (dance ? a.release ?? 0.18 : 0) + 1.5 / fps;
      });
      rows.push({ t, v, feet, stepping, skip: st.visible === false || flashAt(sb, t) >= 0.5 || offScreen(st, t), fries: st.form === "fries" });
    }
    for (let i = 1; i < rows.length; i++) {
      const a = rows[i - 1], b = rows[i];
      if (!a.feet || !b.feet || a.stepping || b.stepping || b.skip || cutBetween(sb, a.t, b.t)) continue;
      for (let f = 0; f < 2; f++) {
        const d = Math.hypot(b.feet[f][0] - a.feet[f][0], b.feet[f][1] - a.feet[f][1]);
        if (d > SLIDE) out.push({ who: c.id, what: `foot ${f ? "L" : "R"} slides`, t: Math.round(b.t * 1000) / 1000, size: d });
      }
    }
    const step = (i, k) => {
      const a = rows[i - 1].v[k], b = rows[i].v[k];
      if (Array.isArray(a)) return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      const d = Math.abs(b - a);
      return k === "yaw" ? Math.min(d, Math.abs(d - 2 * Math.PI * Math.round(d / (2 * Math.PI)))) : d;
    };
    for (const k of [...Object.keys(LIMIT).filter((q) => q !== "hand"), "handR", "handL"]) {
      const lim = k.startsWith("hand") ? LIMIT.hand : LIMIT[k];
      for (let i = 2; i < rows.length - 1; i++) {
        if (rows[i].skip || rows[i - 1].skip || cutBetween(sb, rows[i - 1].t, rows[i].t) || (k.startsWith("hand") && (rows[i].fries || rows[i - 1].fries))) continue;
        const d = step(i, k), around = Math.max(step(i - 1, k), step(i + 1, k));
        if (d > lim && d > RATIO * around) out.push({ who: c.id, what: k, t: Math.round(rows[i].t * 1000) / 1000, from: rows[i - 1].v[k], to: rows[i].v[k], size: d });
      }
    }
  }
  return out.sort((a, b) => a.t - b.t);
}

// Loop seam (a storyboard with "loop": true): the replay starts where the clip ends, so the last frame should flow into
// the first the way any frame flows into the next. For every actor and the camera, from the timeline: the step from
// the last frame to the first should be what the motion either side of it predicts (a pop if it is more than a jump
// in motionJumps), and the speed should carry across (a walk that stops dead or starts from nothing at the seam).
// Idea from whaleyxbt/claude-motion (MIT); check.mjs adds the same speed test on the pixels.
export async function loopSeam(sb, fps = 30) {
  const { actorState, cameraState } = await import("../engine/page/timeline.js");
  const { handTarget } = await import("../engine/page/potato.js");
  const n = Math.round(sb.duration * fps), T = [(n - 2) / fps, (n - 1) / fps, 0, 1 / fps], out = [];
  const sub = (a, b) => (Array.isArray(a) ? Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) : Math.abs(a - b));
  const wrap = (d) => Math.abs(d - 2 * Math.PI * Math.round(d / (2 * Math.PI)));
  // seam: the step across the seam against the mean of the steps either side; speed: how much the step changes
  const test = (who, k, [a, b, c, d], lim) => {
    const vec = Array.isArray(a), yaw = k === "yaw", st = (p, q) => (vec ? q.map((x, j) => x - p[j]) : q - p);
    const e = st(a, b), s = st(c, d), seam = st(b, c), mid = vec ? e.map((x, j) => (x + s[j]) / 2) : (e + s) / 2;
    const jump = vec ? sub(seam, mid) : yaw ? wrap(seam - mid) : Math.abs(seam - mid), dv = vec ? sub(s, e) : yaw ? wrap(s - e) : Math.abs(s - e);
    const speed = (v) => (vec ? Math.hypot(...v) : yaw ? wrap(v) : Math.abs(v));
    if (jump > lim) out.push({ who, what: k, kind: "jump", size: jump });
    else if (dv > lim / 2) out.push({ who, what: k, kind: "speed", size: dv, end: speed(e), start: speed(s) });
  };
  const LIM = { x: 0.03, y: 0.03, z: 0.03, yaw: 0.12, lean: 0.1, pitch: 0.1, squash: 0.06, wings: 0.25, flap: 0.25, tuck: 0.3 };
  for (const c of sb.cast || []) {
    const file = path.join(ROOT, "characters", `${c.character}.json`);
    if (!fs.existsSync(file)) continue;
    const def = JSON.parse(fs.readFileSync(file, "utf8")), sts = T.map((t) => actorState(sb, c, def, t));
    const vis = sts.map((x) => x.visible !== false);
    if (vis[1] !== vis[2]) { out.push({ who: c.id, what: vis[1] ? "vanishes" : "appears", kind: "show" }); continue; }
    if (!vis[1]) continue;
    const v = sts.map((x, i) => values(x, def, T[i], handTarget));
    for (const k of ["pos", ...Object.keys(LIM).filter((q) => !"xyz".includes(q)), "handR", "handL"]) {
      const four = v.map((x) => (k === "pos" ? [x.x, x.y, x.z] : x[k]));
      test(c.id, k, four, k === "pos" ? 0.03 : k.startsWith("hand") ? 0.04 : LIM[k]);
    }
  }
  // the camera too: a last shot framed like the first carries on, a different one is a cut at the seam
  const cam = T.map((t) => cameraState(sb, t));
  test("camera", "position", cam.map((k) => k.pos), 0.03); test("camera", "aim", cam.map((k) => k.look), 0.03);
  return out;
}

// Storyboard habits that read as glitches, found from the timeline alone (warnings):
//   blink-on-line  an automatic blink (or one a look change starts) on a key line: the speaker anywhere in their own
//                  caption or talk, anyone else in a caption's first 0.6 s. A placed "blink" action is deliberate and
//                  not reported.
//   long-hop       a hop whose crouch lasts over 0.4 s (the crouch is 15-35% of each hop): a long lift reads as a
//                  stuck squat; use "fly" for a long lift-off, or shorter hops.
//   eyes-lead      a walk, turn or reach with no look starting just before it (the character doesn't think first).
//   reaction-hold  an expression replaced by another within 0.3 s.
export async function storyNotes(sb, fps = 30) {
  const { actorState } = await import("../engine/page/timeline.js");
  const { hopCrouch } = await import("../engine/page/util.js");
  const out = [], acts = sb.actions || [], KEY = 0.6;
  const talks = acts.filter((a) => a.do === "talk" || a.do === "say"), q = (x) => (/^["“]/.test(x) ? x : `"${x}"`);
  const windows = [];
  for (const c of sb.captions || []) {
    const who = talks.filter((a) => Math.abs(a.at - c.from) <= 0.3).map((a) => a.who);
    // the speaker: the whole caption; everyone else (or everyone, when nobody talks): its first moment
    if (who.length) windows.push({ from: c.from, to: c.to, who, what: q(c.text) });
    windows.push({ from: c.from, to: c.from + KEY, who: (sb.cast || []).map((x) => x.id).filter((id) => !who.includes(id)), what: q(c.text) });
  }
  for (const a of talks) windows.push({ from: a.at, to: a.at + (a.dur ?? KEY), who: [a.who], what: a.line ? q(a.line) : `a line at ${a.at.toFixed(2)}s` });
  const placed = (who, t) => acts.some((a) => a.who === who && a.do === "blink" && t >= a.at - 1e-6 && t <= a.at + (a.dur ?? 0.26));
  const seen = new Set();
  for (const c of sb.cast || []) {
    const file = path.join(ROOT, "characters", `${c.character}.json`);
    if (!fs.existsSync(file)) continue;
    const def = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const w of windows) {
      if (!w.who.includes(c.id)) continue;
      for (let t = Math.ceil(w.from * fps) / fps; t <= w.to + 1e-6; t += 1 / fps) {
        const st = actorState(sb, c, def, t);
        if (st.visible === false || !(st.blink > 0.5) || placed(c.id, t)) continue;
        const k = `${c.id}@${Math.round(t * 4)}`; if (seen.has(k)) break; seen.add(k);
        out.push({ level: "warn", check: "blink-on-line", msg: `${c.id} blinks at ${t.toFixed(2)}s on ${w.what}: add blink: false to the look there, or a "noblink" with placed blinks` });
        break;
      }
    }
  }
  // eyes-lead: a character thinks before it moves. A walk of 30 cm or more, a turn of 30° or more, or a reach for a
  // prop should start with a look that began in the 0.6 s before it (or on the same frame); the eyes about 4 frames
  // ahead reads best (acting.mjs eyesLead).
  // reaction-hold: a new expression replaced by another within 0.3 s doesn't read.
  const yawDeg = (v) => (typeof v === "number" ? v : { camera: 0, front: 0, right: 90, left: -90, "3q-right": 35.5, "3q-left": -35.5, back: 180 }[v] ?? 0);
  for (const c of sb.cast || []) {
    const mine = acts.filter((a) => a.who === c.id).sort((a, b) => a.at - b.at), looks = mine.filter((a) => a.do === "look");
    let pos = c.at, yaw = yawDeg(c.face ?? "camera"), last = -1;
    const ahead = (t) => looks.some((l) => l.at <= t + 1 / fps + 1e-6 && l.at >= t - 0.6);
    for (const a of mine) {
      let what = null;
      if (a.do === "move" && a.to) { if (Math.hypot(a.to[0] - pos[0], a.to[1] - pos[1]) >= 0.3) what = "walks"; pos = a.to; }
      else if (a.do === "turn") { const to = yawDeg(a.to), d = Math.abs(((to - yaw + 540) % 360) - 180); if (d >= 30) what = "turns"; yaw = to; }
      else if (a.do === "arm" && a.pose && typeof a.pose === "object" && a.pose.prop) what = `reaches for the ${a.pose.prop}`;
      if (what && a.at > 0.05 && a.at - last > 0.3 && !ahead(a.at) && (last = a.at)) out.push({ level: "warn", check: "eyes-lead", msg: `${c.id} ${what} at ${a.at.toFixed(2)}s with no look first: start a look about 0.13 s before (acting.mjs eyesLead) so the move reads as a thought` });
    }
    const ex = mine.filter((a) => a.do === "expr" && a.expr);
    for (let i = 1; i < ex.length; i++) if (ex[i].expr !== ex[i - 1].expr && ex[i].at - ex[i - 1].at < 0.3 && ex[i].at > ex[i - 1].at) out.push({ level: "warn", check: "reaction-hold", msg: `${c.id}: "${ex[i - 1].expr}" at ${ex[i - 1].at.toFixed(2)}s is replaced after ${(ex[i].at - ex[i - 1].at).toFixed(2)}s: hold a reaction 0.3 s or more so it reads` });
  }
  for (const a of acts) {
    if (a.do !== "hop") continue;
    const n = a.count ?? 1, d = a.dur ?? 0.4, crouch = (hopCrouch(d, n) * d) / n;
    if (crouch > 0.4) out.push({ level: "warn", check: "long-hop", msg: `${a.who}: the hop at ${a.at.toFixed(2)}s crouches for ${crouch.toFixed(1)}s before it leaves the ground: use "fly" for a long lift-off, or shorter hops` });
  }
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const sb = loadStoryboard(process.argv[2]);
  if (sb.music !== false && !sb.music?.bpm) sb.music = { ...(sb.music || {}), bpm: 120 };
  const j = await motionJumps(sb, sb.fps ?? 30);
  if (!j.length) console.log("motion: no jumps");
  for (const x of j) console.log(x.note ? `  ${x.who}: ${x.note}` : `  ${x.t.toFixed(2)}s  ${x.who} ${x.what}: ${x.what.endsWith("slides") ? "moves" : "jumps"} ${x.size.toFixed(3)} in one frame`);
  for (const r of await storyNotes(sb, sb.fps ?? 30)) console.log(`  ${r.check}: ${r.msg}`);
}
