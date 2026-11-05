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
// it. An entry marked "required": true is a must (quality plan item 13, 5 Nov 2026): its miss is a "must-see" fail
// that blocks the render like a contact fail, unless an "allowHide" window ({ "see", "from", "to", "reason" } in the
// storyboard, or on the entry) says why the hide is deliberate. From "gate": 2 scenery and the set hide faces too.
//
// The subject owns the front (item 13 (c), Jonny 5 Nov on the tent: a bystander on the phone covered the main action):
// in each moment the subject is whoever acts (a line or a new expression) and the characters the beat's "visible" list
// names. From the layout's "front" measure (stage.js fronts()), another character or a prop someone holds covering
// over 15 % of the subject's outline for 0.3 s is a "front" fail at "gate": 2 (a warning before). Furniture and the set in
// front of a character are staging, not a bystander.
import fs from "node:fs";
import { loadStoryboard, loadCharacters } from "../engine/load.mjs";
import { actorState, cameraState } from "../engine/page/timeline.js";
import { hookShow } from "./hook.mjs";
import { GATE, gateOf, gateLevel, windowFor, actingAt, storyAt } from "./gate.mjs";

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
    out.push({ from, to, see: [].concat(v.see || []), why: v.why || null, through: [].concat(v.through || []), required: !!v.required, allowHide: [].concat(v.allowHide || []) });
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
  // from "gate": 2 a face hidden by scenery or the set counts (stage.js hiddenFaces "scen")
  const g2 = gateOf(sb) >= 2, faceOf = (x) => (g2 && x.scen ? { ...x, hidden: x.hidden + x.scen, by: x.scen > x.hidden ? x.sby : x.by } : x);
  // why `item` can't be seen at time t (null: it can)
  const miss = (item, t, through = []) => {
    const s = near(t), f = lay.contacts?.[Math.round(t * fps)], [id, part] = item.split(".");
    const a = (s.actors || []).find((q) => q.id === id);
    if (part === "face") {
      if (!a) return "not in the scene";
      if (!inside(a.eyesPx)) return "out of frame";
      if (!facing(id, t)) return "turned away";
      const hid = (f?.faces || []).map(faceOf).find((x) => x.face === id && x.hidden >= VISIBLE.faceHide && !through.includes(x.by));
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
  // a deliberate hide of a required item: an allowHide window with a reason, on the storyboard or the entry
  const hides = (v, item, t) => [...(sb.allowHide || []), ...v.allowHide].some((w) => w.reason && (!w.see || [].concat(w.see).includes(item) || [].concat(w.see).includes(item.split(".")[0])) && t >= (w.from ?? 0) - 1e-6 && t <= (w.to ?? Infinity) + 1e-6);
  for (const v of list) {
    const f0 = Math.max(0, Math.round(v.from * fps)), f1 = Math.max(f0 + 1, Math.round(v.to * fps)), need = Math.min(VISIBLE.minRun * fps, Math.ceil((f1 - f0) * 0.5));
    for (const item of v.see) {
      // runs of frames with the same reason
      const runs = []; let cur = null;
      for (let i = f0; i < f1; i++) {
        const why = v.required && hides(v, item, i / fps) ? null : miss(item, i / fps, v.through);
        if (why && cur && cur.why === why && cur.b === i - 1) cur.b = i;
        else if (why) runs.push((cur = { why, a: i, b: i }));
      }
      const bad = runs.filter((r) => r.b - r.a + 1 >= need), total = runs.reduce((n, r) => n + r.b - r.a + 1, 0);
      const row = { from: v.from, to: v.to, item, why: v.why, auto: !!v.auto, required: v.required, ok: !bad.length, misses: bad.map((r) => ({ from: +(r.a / fps).toFixed(2), to: +((r.b + 1) / fps).toFixed(2), why: r.why })), seen: 1 - total / (f1 - f0) };
      rows.push(row);
    }
  }
  const label = (r) => `${r.item.replace(/\.face$/, "'s face")} at ${r.from.toFixed(2)}-${r.to.toFixed(2)} s${r.why ? ` (${r.why}${r.auto ? ", auto" : ""})` : ""}`;
  const bad = rows.filter((r) => !r.ok);
  for (const r of bad) results.push(r.required
    ? { group: "technical", level: "fail", check: "must-see", msg: `required: ${label(r)}: ${r.misses.slice(0, 3).map((x) => `${x.why} ${x.from.toFixed(2)}-${x.to.toFixed(2)} s`).join("; ")}: move the prop, the character or the camera so it reads, or add an allowHide window with a reason for a deliberate hide` }
    : { group: "creative", level: "note", check: "visible", msg: `${label(r)}: ${r.misses.slice(0, 3).map((x) => `${x.why} ${x.from.toFixed(2)}-${x.to.toFixed(2)} s`).join("; ")}: move the prop, the character or the camera so it reads` });
  if (rows.length && !bad.length) results.push({ group: "creative", level: "pass", check: "visible", msg: `${rows.length} must-see item${rows.length > 1 ? "s" : ""} in view: ${rows.map((r) => r.item).join(", ")}${rows.some((r) => r.auto) ? " (auto: no \"visible\" list in the storyboard)" : ""}` });
  if (!rows.length) results.push({ group: "creative", level: "note", check: "visible", msg: "nothing to check: add a \"visible\" list (what each beat needs the viewer to see), or hook.show and a payoff beat" });
  return { rows, results };
}

// The subject owns the front (quality plan item 13 (c)): per frame, the subjects are who acts and the characters the
// "visible" list names for that moment; a character or a held prop covering over GATE.front of a subject's outline
// (layout "front", stage.js fronts()) for GATE.frontHold s is a "front" finding (fail at "gate": 2, warn before),
// waived by an allowClip window naming "front". Returns check results.
export function frontResults(sb, lay) {
  const rows = lay?.contacts || [], fps = lay?.fps || 30, out = [];
  if (!rows.some((r) => r.front)) return out;
  const cast = new Set((sb.cast || []).map((c) => c.id)), list = (sb.visible || []).map((v) => ({ from: v.from ?? v.at ?? 0, to: v.to ?? (v.from ?? v.at ?? 0) + VISIBLE.window, see: [].concat(v.see || []) }));
  const subjects = (s) => new Set([...[...cast].filter((id) => actingAt(sb, id, s)), ...list.filter((v) => s >= v.from && s <= v.to).flatMap((v) => v.see.map((x) => x.split(".")[0]).filter((id) => cast.has(id)))]);
  const tracks = new Map();
  rows.forEach((r, i) => {
    const t = r.t ?? i / fps, s = storyAt(sb, t), subj = subjects(s);
    for (const f of r.front || []) {
      if (!subj.has(f.id) || !f.byActor || f.byActor <= GATE.front || f.by === f.id || windowFor(sb, "front", f.id, t, f.by)) continue;
      const k = `${f.id}|${f.by}`; if (!tracks.has(k)) tracks.set(k, { id: f.id, by: f.by, f: new Array(rows.length).fill(0) });
      tracks.get(k).f[i] = f.byActor;
    }
  });
  const need = Math.max(2, Math.round(GATE.frontHold * fps)), lvl = gateLevel(sb);
  for (const { id, by, f } of tracks.values()) {
    const sps = []; let a = -1;
    f.forEach((v, i) => { if (v && a < 0) a = i; if (!v && a >= 0) { sps.push([a, i - 1]); a = -1; } }); if (a >= 0) sps.push([a, f.length - 1]);
    const long = sps.filter(([p, q]) => q - p + 1 >= need); if (!long.length) continue;
    const max = Math.round(Math.max(...f) * 100), when = long.map(([p, q]) => `${(rows[p].t ?? p / fps).toFixed(2)}-${(rows[q].t ?? q / fps).toFixed(2)}s`).join(", ");
    out.push({ group: "technical", level: lvl, check: "front", msg: `${by} stands in front of ${id} while ${id} is the subject (acting, or on the beat's must-see list) at ${when}, covering up to ${max} % of ${id}: the subject owns the front of the frame. Swap their depths, move the camera to the other side, or move ${by} behind or aside${lvl === "warn" ? '; fails at "gate": 2' : ""}` });
  }
  if (!out.length) out.push({ group: "technical", level: "pass", check: "front", msg: "no bystander covers whoever the beat is about" });
  return out;
}

// Eyes that read (quality plan item 4, the eyes thread): with "rig": { "eyes": 2 } the layout records how much of each
// pupil the lids leave showing (stage.js layout, actors[].pupils, from face.js; a number or one per eye, 0..1). A face in
// frame showing under 60 % of a pupil for 0.3 s or more warns (the split-the-bill waiter: a pupil under the lid read
// as a glitch). Nothing is reported for a layout without the measure.
export const EYES = { shown: 0.6, hold: 0.3 };
export function eyesResults(sb, lay) {
  const S = lay?.samples || [], W = lay?.width || 1080, H = lay?.height || 1920, out = [];
  const val = (p) => { const v = typeof p === "number" ? [p] : Array.isArray(p) ? p : p && typeof p === "object" ? Object.values(p) : []; const n = v.filter((x) => typeof x === "number"); return n.length ? Math.min(...n) : null; };
  if (!S.some((s) => (s.actors || []).some((a) => a.pupils != null))) return out;
  const step = S.length > 1 ? S[1].t - S[0].t : 0.1, ids = [...new Set(S.flatMap((s) => (s.actors || []).map((a) => a.id)))];
  for (const id of ids) {
    const spans = []; let a = null, low = 1;
    S.forEach((s, i) => {
      const x = (s.actors || []).find((q) => q.id === id), v = x && x.eyesPx && x.eyesPx[0] >= 0 && x.eyesPx[0] <= W && x.eyesPx[1] >= 0 && x.eyesPx[1] <= H ? val(x.pupils) : null;
      if (v != null && v < EYES.shown) { if (a == null) { a = s.t; low = v; } low = Math.min(low, v); }
      if ((v == null || v >= EYES.shown || i === S.length - 1) && a != null) { const b = v != null && v < EYES.shown ? s.t + step : s.t; if (b - a >= EYES.hold - 1e-6) spans.push([a, b, low]); a = null; }
    });
    if (spans.length) out.push({ group: "technical", level: "warn", check: "eyes-readable", msg: `${id}: a pupil shows under ${Math.round(EYES.shown * 100)} % at ${spans.map(([p, q, l]) => `${p.toFixed(1)}-${q.toFixed(1)}s (${Math.round(l * 100)} %)`).join(", ")}: the lid hides the eye and it reads as a glitch; lift the lid or bring the look nearer the middle` });
  }
  return out;
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
