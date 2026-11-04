#!/usr/bin/env node
// Framing report: where each shot actually puts the faces, measured from the render layout (render.mjs --layout),
// so a directed camera (engine/direct.mjs) can be checked against its rules without drawing a frame.
//
//   node qa/framing.mjs <storyboard> <layout.json>
//
// Per shot, at its middle: the eye line of each face in frame (share of the frame from the top; the rule is about a
// third, never under half), the top of each character (headroom: above 0 means the hat or head is cropped), and the
// lowest point (the app's caption bar covers below ~0.71). Notes only: framing is judged on the contact sheet.
//
// Must be visible: the storyboard says what each beat needs the viewer to see, and the layout says whether it can be
// seen, before a frame is drawn (quality plan item 3, 4 Nov 2026: a face hidden behind a prop used to cost a full
// re-render; now it costs a one-minute layout pass).
//
//   "visible": [
//     { "from": 0.4, "to": 1.2, "see": ["rea.face", "scythe"], "why": "Reaper's face, nothing in front" },
//     { "at": 6.0, "see": ["phx.face", "wiz"] }                  (at: a 0.5 s window from there)
//   ]
//   (storyboards/lib/clip.mjs: c.see(from, to, ["rea.face", "scythe"], "why"))
//   "through": ["glass"] on an entry: things the view goes through (a window pane the raycast counts as solid)
//
//   "<id>.face"  the eyes are in frame (inside a 4 % margin), the face is turned to the camera, nothing hides a third
//                of the eyes (another character, a hat brim, wings, a prop: stage.js hiddenFaces), no hand or held
//                prop is in front of them, and no caption box sits over them
//   "<id>"       a cast member: the eyes in frame or half the body's box in frame (a medium shot crops the feet), and
//                the body not hidden behind someone
//                a prop: shown, its centre in frame, and not behind a character who stands nearer the camera
//                (held props are left to the hand checks)
// Without a "visible" list it checks two things by itself, marked "auto": the faces in hook.show at 0-0.2 s, and the
// faces of whoever acts (a line or a new expression) in the first 0.6 s of the payoff beat.
// A miss lasting 0.2 s or more (or most of a shorter window) is a note in qa/check.mjs and render.mjs --layout prints
// it: never a failure, because the fix is a judgement (move the prop, the character or the camera).
import fs from "node:fs";
import { loadStoryboard, loadCharacters } from "../engine/load.mjs";
import { actorState, cameraState } from "../engine/page/timeline.js";
import { hookShow } from "./hook.mjs";

export function framing(sb, lay) {
  const H = lay.height || 1920, shots = [...(sb.shots || [])].sort((a, b) => a.at - b.at), out = [];
  shots.forEach((s, i) => {
    const t1 = shots[i + 1]?.at ?? sb.duration, tm = s.to ? Math.min(t1 - 0.05, s.at + (s.dur ?? 1) + (t1 - s.at - (s.dur ?? 1)) / 2) : (s.at + t1) / 2;
    const smp = lay.samples.reduce((b, q) => (Math.abs(q.t - tm) < Math.abs(b.t - tm) ? q : b), lay.samples[0]);
    const d = (sb.directed || []).find((q) => Math.abs(q.at - s.at) < 1e-3);
    const faces = (smp.actors || []).filter((a) => a.eyesPx && a.eyesPx[0] >= 0 && a.eyesPx[0] <= (lay.width || 1080) && a.eyesPx[1] >= 0 && a.eyesPx[1] <= H)
      .map((a) => ({ id: a.id, eye: +(a.eyesPx[1] / H).toFixed(2), top: +(a.box[1] / H).toFixed(2), bottom: +((a.box[1] + a.box[3]) / H).toFixed(2) }));
    out.push({ at: s.at, until: +t1.toFixed(2), t: smp.t, ...(d && { size: d.size, kind: d.kind, why: d.why }), faces });
  });
  return out;
}

export const VISIBLE = { margin: 0.04, body: 0.5, faceHide: 0.3, facing: 0.2, minRun: 0.2, window: 0.5, hookWindow: 0.2, payoffWindow: 0.6 };

// the "visible" list as windows: { from, to, see: [...], why, auto }
export function visibleList(sb) {
  const cast = new Set((sb.cast || []).map((c) => c.id)), out = [];
  for (const v of sb.visible || []) {
    const from = v.from ?? v.at ?? 0, to = v.to ?? from + VISIBLE.window;
    out.push({ from, to, see: [].concat(v.see || []), why: v.why || null, through: [].concat(v.through || []) });
  }
  if (out.length) return out;
  const show = hookShow(sb).map((id) => (cast.has(id) ? `${id}.face` : id));
  if (show.length) out.push({ from: 0, to: VISIBLE.hookWindow, see: show, why: "hook.show at frame 0", auto: true, through: [] });
  const p = (sb.beatSpans || []).find((b) => b.kind === "payoff");
  if (p) {
    const who = [...new Set((sb.actions || []).filter((a) => a.who && cast.has(a.who) && ["talk", "say", "expr", "face"].includes(a.do) && a.at >= p.from - 1e-6 && a.at < Math.min(p.to, p.from + VISIBLE.payoffWindow)).map((a) => a.who))];
    if (who.length) out.push({ from: p.from, to: Math.min(p.to, p.from + VISIBLE.payoffWindow), see: who.map((id) => `${id}.face`), why: `who acts in the payoff "${p.name}"`, auto: true, through: [] });
  }
  return out;
}

// For each window and each thing in it: the moments it can't be seen, and why. Returns { rows, results } (results are
// creative "visible" notes for qa/check.mjs). chars: loadCharacters(sb), for which way each face turns.
export function visibility(sb, lay, chars = null) {
  const W = lay.width || 1080, H = lay.height || 1920, fps = lay.fps || sb.fps || 30, list = visibleList(sb), rows = [], results = [];
  const cast = Object.fromEntries((sb.cast || []).map((c) => [c.id, c])), m = VISIBLE.margin;
  const inside = (p) => p && p[0] >= W * m && p[0] <= W * (1 - m) && p[1] >= H * m && p[1] <= H * (1 - m);
  const near = (t) => lay.samples.reduce((b, q) => (Math.abs(q.t - t) < Math.abs(b.t - t) ? q : b), lay.samples[0]);
  // who holds each prop (a grab with no later release), so a held prop is left to the hand checks
  const holder = (id, t) => { let h = null; for (const a of [...(sb.actions || [])].sort((x, y) => x.at - y.at)) { if (a.at > t) break; if (a.do === "grab" && a.prop === id) h = a.who; if (a.do === "release" && (a.prop === id || (!a.prop && h === a.who))) h = null; } return h; };
  const facing = (id, t) => {
    const c = cast[id], def = chars?.[c?.character]; if (!def) return true;
    const st = actorState(sb, c, def, t), cam = cameraState(sb, t), d = [cam.pos[0] - st.x, cam.pos[2] - st.z], n = Math.hypot(d[0], d[1]) || 1;
    return Math.sin(st.yaw ?? 0) * d[0] / n + Math.cos(st.yaw ?? 0) * d[1] / n >= VISIBLE.facing;
  };
  const dist = (p, t) => { const c = cameraState(sb, t).pos; return Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]); };
  // why `item` can't be seen at time t (null: it can)
  const miss = (item, t, through = []) => {
    const s = near(t), f = lay.contacts?.[Math.round(t * fps)], [id, part] = item.split(".");
    const a = (s.actors || []).find((q) => q.id === id);
    if (part === "face") {
      if (!a) return "not in the scene";
      if (!inside(a.eyesPx)) return "out of frame";
      if (!facing(id, t)) return "turned away";
      const hid = (f?.faces || []).find((x) => x.face === id && x.hidden >= VISIBLE.faceHide && !through.includes(x.by));
      if (hid) return `behind ${hid.by === id ? "its own hat or costume" : hid.by}`;
      const cov = (f?.covers || []).find((x) => x.face === id);
      if (cov) return `${cov.by === id ? "its own" : `${cov.by}'s`} ${cov.part === "prop" ? "held prop" : "hand"} in front`;
      const cap = (s.captions || []).find((c) => !c.pop && c.box && a.eyesPx[0] >= c.box[0] && a.eyesPx[0] <= c.box[0] + c.box[2] && a.eyesPx[1] >= c.box[1] && a.eyesPx[1] <= c.box[1] + c.box[3]);
      if (cap) return `under the caption "${String(cap.text).slice(0, 24)}"`;
      return null;
    }
    if (a) {
      if (!a.box) return "not shown";
      const [x, y, w, h] = a.box, iw = Math.max(0, Math.min(W, x + w) - Math.max(0, x)), ih = Math.max(0, Math.min(H, y + h) - Math.max(0, y));
      if (!inside(a.eyesPx) && (w * h <= 0 || (iw * ih) / (w * h) < VISIBLE.body)) return "mostly out of frame";
      const hid = (f?.faces || []).find((x) => x.face === id && (x.body ?? 0) >= 0.5 && x.by !== id && !through.includes(x.by));
      return hid ? `behind ${hid.by}` : null;
    }
    const p = (s.props || []).find((q) => q.id === id);
    if (!p) return `no actor or prop "${id}"`;
    if (p.visible === false) return "not shown";
    if (!p.px || p.px[0] < 0 || p.px[0] > W || p.px[1] < 0 || p.px[1] > H) return "out of frame";
    if (holder(id, t)) return null;
    const pd = dist(p.at, t);
    for (const b of s.actors || []) {
      if (!b.box || !b.eyes) continue;
      const [x, y, w, h] = b.box, k = 0.15;
      if (!through.includes(b.id) && p.px[0] > x + w * k && p.px[0] < x + w * (1 - k) && p.px[1] > y + h * k && p.px[1] < y + h * (1 - k) && dist(b.eyes, t) < pd - 0.15) return `behind ${b.id}`;
    }
    return null;
  };
  for (const v of list) {
    const f0 = Math.max(0, Math.round(v.from * fps)), f1 = Math.max(f0 + 1, Math.round(v.to * fps)), need = Math.min(VISIBLE.minRun * fps, Math.ceil((f1 - f0) * 0.5));
    for (const item of v.see) {
      // runs of frames with the same reason
      const runs = []; let cur = null;
      for (let i = f0; i < f1; i++) {
        const why = miss(item, i / fps, v.through);
        if (why && cur && cur.why === why && cur.b === i - 1) cur.b = i;
        else if (why) runs.push((cur = { why, a: i, b: i }));
      }
      const bad = runs.filter((r) => r.b - r.a + 1 >= need), total = runs.reduce((n, r) => n + r.b - r.a + 1, 0);
      const row = { from: v.from, to: v.to, item, why: v.why, auto: !!v.auto, ok: !bad.length, misses: bad.map((r) => ({ from: +(r.a / fps).toFixed(2), to: +((r.b + 1) / fps).toFixed(2), why: r.why })), seen: 1 - total / (f1 - f0) };
      rows.push(row);
    }
  }
  const label = (r) => `${r.item.replace(/\.face$/, "'s face")} at ${r.from.toFixed(2)}-${r.to.toFixed(2)} s${r.why ? ` (${r.why}${r.auto ? ", auto" : ""})` : ""}`;
  const bad = rows.filter((r) => !r.ok);
  for (const r of bad) results.push({ group: "creative", level: "note", check: "visible", msg: `${label(r)}: ${r.misses.slice(0, 3).map((x) => `${x.why} ${x.from.toFixed(2)}-${x.to.toFixed(2)} s`).join("; ")}: move the prop, the character or the camera so it reads` });
  if (rows.length && !bad.length) results.push({ group: "creative", level: "pass", check: "visible", msg: `${rows.length} must-see item${rows.length > 1 ? "s" : ""} in view: ${rows.map((r) => r.item).join(", ")}${rows.some((r) => r.auto) ? " (auto: no \"visible\" list in the storyboard)" : ""}` });
  if (!rows.length) results.push({ group: "creative", level: "note", check: "visible", msg: "nothing to check: add a \"visible\" list (what each beat needs the viewer to see), or hook.show and a payoff beat" });
  return { rows, results };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop())) {
  const [sbFile, layFile] = process.argv.slice(2);
  if (!sbFile || !layFile) { console.error("usage: node qa/framing.mjs <storyboard> <layout.json>"); process.exit(2); }
  const sb = loadStoryboard(sbFile), lay = JSON.parse(fs.readFileSync(layFile, "utf8"));
  for (const r of framing(sb, lay)) {
    const f = r.faces.map((q) => `${q.id} eyes ${q.eye} top ${q.top} low ${q.bottom}`).join(" | ") || "no face in frame";
    console.log(`${r.at.toFixed(2)}-${r.until.toFixed(2)} s ${r.size ?? "set by hand"}${r.kind ? ` (${r.kind})` : ""}: ${f}${r.why ? `  [${r.why}]` : ""}`);
  }
  console.log("must be visible:");
  const { rows, results } = visibility(sb, lay, loadCharacters(sb));
  for (const r of rows) console.log(`  ${r.ok ? "ok  " : "MISS"}  ${r.from.toFixed(2)}-${r.to.toFixed(2)} s ${r.item}${r.why ? ` (${r.why}${r.auto ? ", auto" : ""})` : ""}: ${r.ok ? `seen ${Math.round(r.seen * 100)} %` : r.misses.map((x) => `${x.why} ${x.from.toFixed(2)}-${x.to.toFixed(2)} s`).join("; ")}`);
  if (!rows.length) console.log(`  ${results[0].msg}`);
}
