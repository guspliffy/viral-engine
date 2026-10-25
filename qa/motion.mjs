#!/usr/bin/env node
// Motion check: finds pops from the storyboard alone, in seconds, before anything is rendered. It computes every
// actor's state frame by frame (the same timeline.js the renderer uses) and flags a value that jumps between two
// frames far more than it moves in the frames around it: a hand that teleports, a body that snaps, wings that flick.
//
//   node qa/motion.mjs storyboards/x.json          -> list of jumps, blinks on key lines, long hop crouches (exit 0; all warnings)
//
// Covered on purpose: frames under a flash of 0.5 or more, actors hidden or off camera, limbs in the fries form,
// whole turns.
//
// Feet: a planted foot (timeline.js st.plant) may only move during a deliberate step (a move, a turn, a hop, a dance
// step, sitting down or standing up). Anything else that slides it, even slowly, is reported as "foot slides".
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { compile } from "../engine/compile.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// how far a value may move between two frames before it counts as a jump (metres, radians, or 0..1 levels),
// and how much bigger than the steps either side it must be
const LIMIT = { x: 0.03, y: 0.03, z: 0.03, yaw: 0.12, lean: 0.1, pitch: 0.1, squash: 0.06, wings: 0.25, flap: 0.25, tuck: 0.3, hand: 0.04 };
const RATIO = 4;
const SLIDE = 0.003;   // metres a planted foot may drift in one frame (9 cm a second) outside a step
const STEPS = new Set(["move", "turn", "hop", "fly", "hover", "drop", "sit", "stand", "kneel", "grow"]);   // grow: the feet spread as it grows

export async function motionJumps(sb, fps = 30) {
  const { actorState, flashAt } = await import("../engine/page/timeline.js");
  const { handTarget } = await import("../engine/page/potato.js");
  const { isDance } = await import("../engine/page/dance.js");
  const THREE = await import("three"), cam = new THREE.PerspectiveCamera(32, 1080 / 1920, 0.05, 300), v3 = new THREE.Vector3();
  const { cameraState } = await import("../engine/page/timeline.js");
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
    const rx = def.body.width / 2, H = def.body.height, rows = [];
    for (let i = 0; i <= n; i++) {
      const t = i / fps, st = actorState(sb, c, def, t), v = {};
      for (const k of ["x", "y", "z", "yaw", "lean", "pitch", "squash", "wings", "flap", "tuck"]) v[k] = st[k] ?? 0;
      for (const [s, sx] of [["R", -1], ["L", 1]]) {
        const a = st.arms[s], f = handTarget(a.from, sx, rx, H, t), g = handTarget(a.pose, sx, rx, H, t);
        v[`hand${s}`] = f.map((q, j) => q + (g[j] - q) * a.p);
      }
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
      if (!a.feet || !b.feet || a.stepping || b.stepping || b.skip) continue;
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
        if (rows[i].skip || rows[i - 1].skip || (k.startsWith("hand") && (rows[i].fries || rows[i - 1].fries))) continue;
        const d = step(i, k), around = Math.max(step(i - 1, k), step(i + 1, k));
        if (d > lim && d > RATIO * around) out.push({ who: c.id, what: k, t: Math.round(rows[i].t * 1000) / 1000, from: rows[i - 1].v[k], to: rows[i].v[k], size: d });
      }
    }
  }
  return out.sort((a, b) => a.t - b.t);
}

// Storyboard habits that read as glitches, found from the timeline alone (warnings):
//   blink-on-line  an automatic blink (or one a look change starts) on a key line: the speaker anywhere in their own
//                  caption or talk, anyone else in a caption's first 0.6 s. A placed "blink" action is deliberate and
//                  not reported.
//   long-hop       a hop whose crouch lasts over 0.4 s (the crouch is 15-35% of each hop): a long lift reads as a
//                  stuck squat; use "fly" for a long lift-off, or shorter hops.
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
  for (const a of acts) {
    if (a.do !== "hop") continue;
    const n = a.count ?? 1, d = a.dur ?? 0.4, crouch = (hopCrouch(d, n) * d) / n;
    if (crouch > 0.4) out.push({ level: "warn", check: "long-hop", msg: `${a.who}: the hop at ${a.at.toFixed(2)}s crouches for ${crouch.toFixed(1)}s before it leaves the ground: use "fly" for a long lift-off, or shorter hops` });
  }
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const sb = compile(JSON.parse(fs.readFileSync(process.argv[2], "utf8")));
  if (sb.music !== false && !sb.music?.bpm) sb.music = { ...(sb.music || {}), bpm: 120 };
  const j = await motionJumps(sb, sb.fps ?? 30);
  if (!j.length) console.log("motion: no jumps");
  for (const x of j) console.log(x.note ? `  ${x.who}: ${x.note}` : `  ${x.t.toFixed(2)}s  ${x.who} ${x.what}: ${x.what.endsWith("slides") ? "moves" : "jumps"} ${x.size.toFixed(3)} in one frame`);
  for (const r of await storyNotes(sb, sb.fps ?? 30)) console.log(`  ${r.check}: ${r.msg}`);
}
