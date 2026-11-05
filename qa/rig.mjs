#!/usr/bin/env node
// Rig motion check: pops in what is actually drawn. qa/motion.mjs follows the storyboard's hand targets (a straight
// blend between two poses) and misses what the rig adds on top: the arc, the walk's arm swing, pinch offsets, the
// elbow guide, the body's turn and lean. This reads the final world positions the layout pass records every frame
// (render.mjs --layout, stage.js contact(): each actor's hands hR/hL, arm middles eR/eL, feet fR/fL and body b, and
// every held prop with its offset from the holding hand), and reports:
//
//   rig-jump    a hand, arm middle (an elbow flip), foot or body that moves far more in one frame than in the frames
//               either side (a one-frame pop). Warn; a big jump in a still moment (over failJump mm, failRatio times
//               its neighbours) fails, as nothing on screen hides it
//   foot-slide  a foot on the floor sliding while its actor takes no step (move, turn, hop, dance ...)
//   prop-pop    a held prop jumping in the world, or slipping in the hand (its offset from the fist changes in one
//               frame while the hand itself barely moves: a regrab, a hold switching anchors)
//
//   node qa/rig.mjs out/<id>.layout.json --sb storyboards/<id>.json      -> the list (exit 1 on a fail)
//
// Hands, elbows and feet are followed relative to the body, so a whole actor moved in one go (a stand-in swapped
// in, a "dur": 0 move) is one body jump, not seven. Skipped: cuts (a cheat behind a cut is fine), frames with the
// actor off screen, feet while riding a prop or while the body itself jumps (TELEPORT, a cheat qa/motion.mjs judges). Run by qa/check.mjs and render.mjs --layout through contactResults.
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { cutBetween } from "../engine/page/timeline.js";
import { isDance } from "../engine/page/dance.js";
import { steppingAt } from "./motion.mjs";
import { storyTime } from "../engine/shared/holds.js";
import * as THREE from "three";
import { cameraState } from "../engine/page/timeline.js";
import { GATE, gateOf, gateLevel, windowFor } from "./gate.mjs";

// world (mm) to screen pixels at video time t, through the storyboard's camera (null behind it); one per storyboard
const PROJ = new WeakMap();
export function proj(sb) {
  if (PROJ.has(sb)) return PROJ.get(sb);
  const cam = new THREE.PerspectiveCamera(32, 1080 / 1920, 0.05, 300), v = new THREE.Vector3(), l = new THREE.Vector3();
  const f = (t, p) => {
    const k = cameraState(sb, storyTime(sb.holds, t));
    cam.position.fromArray(k.pos); cam.fov = k.fov ?? 32; cam.updateProjectionMatrix(); cam.lookAt(l.fromArray(k.look)); cam.updateMatrixWorld(true);
    const q = v.set(p[0] / 1000, p[1] / 1000, p[2] / 1000).project(cam);
    return q.z > 1 ? null : [((q.x + 1) / 2) * 1080, ((1 - q.y) / 2) * 1920];
  };
  PROJ.set(sb, f); return f;
}

// a cut between two frames, judged the way the camera picks its shot (timeline.js cameraState: the last shot with
// at <= t). cutBetween's 1e-6 margin misses a cut that lands exactly on a frame after a hit-stop (4.1 s on the video
// is 3.9999999 on the storyboard), which turned every cheat at Not Yet's 4 s cut into a "jump"
export function cutIn(sb, t0, t1) {
  if (Array.isArray(sb.camera) && sb.camera.length) return false;
  const k = (t) => (sb.shots || []).filter((s) => s.at > 0 && s.at <= t).length;
  return k(t1) !== k(t0) || cutBetween(sb, t0, t1);
}

// millimetres per frame (at 30 fps); ratio: how much bigger than both neighbouring steps a step must be to be a pop
export const RIG = { hand: 40, elbow: 45, foot: 30, body: 30, prop: 40, slip: 30, ratio: 4, slide: 4, floor: 60, failJump: 120, failRatio: 8, teleport: 250 };
const NAME = { hR: "hand R", hL: "hand L", eR: "arm R (elbow)", eL: "arm L (elbow)", fR: "foot R", fL: "foot L", b: "body" };
const LIM = (k) => (k[0] === "h" ? RIG.hand : k[0] === "e" ? RIG.elbow : k[0] === "f" ? RIG.foot : RIG.body);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// one row per finding: { level, check, who, what, t, size (mm) }
export function rigFindings(layout, sb) {
  const rows = layout?.contacts || [], out = [];
  if (!rows.some((r) => r.actors?.some((a) => a.w))) return out;
  // T: the video's clock (reported); S: the storyboard's (cuts, steps), which a hit-stop holds back
  const fps = layout.fps || 30, sc = 30 / fps, n = rows.length, T = (i) => rows[i].t ?? i / fps, S = (i) => storyTime(sb?.holds, T(i));
  const cut = (i) => sb && cutIn(sb, S(i - 1), S(i)), frozen = (i) => i > 0 && i < n && Math.abs(S(i) - S(i - 1)) < 1e-6;
  // per series key: the position each frame (null where missing)
  const pops = (series, lim, who, what, check) => {
    const step = (i) => (series[i] && series[i - 1] && !cut(i) ? dist(series[i], series[i - 1]) : null);
    for (let i = 2; i < n - 1; i++) {
      const d = step(i); if (d == null || d <= lim * sc) continue;
      // both neighbouring steps must be known: next to a cut or a hidden frame there is nothing to compare with
      // and not frozen by a hit-stop (the move carrying on after the hold is the point of it)
      const a = step(i - 1), b = step(i + 1); if (a == null || b == null || frozen(i - 1) || frozen(i + 1)) continue;
      const around = Math.max(a, b);
      if (d <= RIG.ratio * around) continue;
      const big = d > RIG.failJump * sc && d > RIG.failRatio * Math.max(around, 1);
      out.push({ level: big ? "fail" : "warn", check, who, what, t: Math.round(T(i) * 1000) / 1000, size: Math.round(d) });
    }
  };
  const ids = [...new Set(rows.flatMap((r) => (r.actors || []).map((a) => a.id)))];
  const waived = (check, who, i) => !!(sb && windowFor(sb, check, who, T(i)));
  // frame 0 to frame 1 (quality plan items 1 and 3): an opening pose set by a short move at t = 0 is drawn half-way on
  // frame 0 and done on frame 1 (IKEA: Reaper's hand 60 cm). Only frame 2 on has two neighbours, so pops() never sees it
  const first = (who, what, a, b, c) => {
    if (!a || !b || !c || n < 3 || (sb && cut(1))) return;
    const d = dist(a, b), next = dist(b, c);
    if (d > GATE.frame0 * 1000 * sc && d > RIG.ratio * Math.max(next, 1) && !waived("frame0-jump", who, 1)) out.push({ level: gateLevel(sb), check: "frame0-jump", who, what, t: Math.round(T(1) * 1000) / 1000, size: Math.round(d) });
  };
  // riding a prop (timeline.js "ride"): the feet go with it
  const rides = (id) => { const s = [], acts = (sb?.actions || []).filter((a) => a.who === id && a.do === "ride").sort((a, b) => a.at - b.at); let on = null; for (const a of acts) { if (on != null) { s.push([on, a.at]); on = null; } if (a.prop) on = a.at; } if (on != null) s.push([on, Infinity]); return s; };
  for (const id of ids) {
    const st = rows.map((r) => { const a = r.actors.find((x) => x.id === id); return a?.w && a.on !== 0 ? a.w : null; });
    const keys = [...new Set(st.flatMap((w) => (w ? Object.keys(w) : [])))];
    const rel = (w, k) => (w?.[k] && w.b && k !== "b" ? w[k].map((v, j) => v - w.b[j]) : w?.[k] || null);
    for (const k of keys) pops(st.map((w) => rel(w, k)), LIM(k), id, NAME[k] || k, "rig-jump");
    for (const k of keys) first(id, NAME[k] || k, st[0]?.[k], st[1]?.[k], st[2]?.[k]);
    const R = rides(id), jumped = (i) => st[i]?.b && st[i - 1]?.b && dist(st[i].b, st[i - 1].b) > RIG.teleport * sc;
    // feet on the floor that slide while no step is taken
    for (const k of keys.filter((q) => q[0] === "f")) {
      const floor = Math.min(...st.filter((w) => w?.[k]).map((w) => w[k][1]));
      for (let i = 1; i < n; i++) {
        const a = st[i - 1]?.[k], b = st[i]?.[k]; if (!a || !b || cut(i)) continue;
        if (a[1] - floor > RIG.floor || b[1] - floor > RIG.floor || jumped(i) || R.some(([p, q]) => S(i) >= p - 1e-6 && S(i) <= q + 0.3)) continue;   // lifted (a step, a hop, sitting), moved whole, riding
        const d = Math.hypot(b[0] - a[0], b[2] - a[2]);
        // over GATE.footSlide in one frame anyone sees it skate: a fail once the feet fix is on (plan item 10)
        if (d > RIG.slide * sc && !steppingAt(sb || {}, id, S(i), fps, isDance)) out.push({ level: d > GATE.footSlide * 1000 * sc && !waived("foot-slide", id, i) ? gateLevel(sb, "feet") : "warn", check: "foot-slide", who: id, what: NAME[k], t: Math.round(T(i) * 1000) / 1000, size: Math.round(d) });
      }
      // a standing foot during a step (the walk, run or shuffle itself, which the check above skips): a stance is the
      // foot at floor height (within 3 mm of its lowest) for 2+ frames while the body travels; its slide is the foot's
      // path along the floor. Over GATE.stanceSlide it skates (IKEA's eased moves: 8 cm a stance; zombies' run 64 cm)
      const lo = Math.min(...st.filter((w) => w?.[k]).map((w) => w[k][1])), down = (i) => st[i]?.[k] && st[i]?.b && st[i][k][1] - lo < 3 && !(sb && i > 0 && cut(i));
      for (let i = 1; i < n; i++) {
        if (!down(i) || !down(i - 1)) continue;
        let j = i; while (j + 1 < n && down(j + 1)) j++;
        let body = 0, slide = 0, stepping = false;
        for (let q = i; q <= j; q++) {
          const db = Math.hypot(st[q].b[0] - st[q - 1].b[0], st[q].b[2] - st[q - 1].b[2]); if (db > RIG.teleport * sc) continue;
          body += db; slide += Math.hypot(st[q][k][0] - st[q - 1][k][0], st[q][k][2] - st[q - 1][k][2]);
          stepping ||= steppingAt(sb || {}, id, S(q), fps, isDance);
        }
        if (stepping && body > 50 && slide > GATE.stanceSlide * 1000 && !waived("stance-slide", id, i)) out.push({ level: gateLevel(sb, "feet"), check: "stance-slide", who: id, what: NAME[k], t: Math.round(T(i - 1) * 1000) / 1000, size: Math.round(slide), body: Math.round(body), frames: j - i + 2 });
        i = j;
      }
    }
  }
  // held props: a jump in the world, or a slip in the hand
  const props = new Map();
  rows.forEach((r, i) => { for (const h of r.held || []) { const k = `${h.who}|${h.prop}`; if (!props.has(k)) props.set(k, { h, pos: new Array(n).fill(null), off: new Array(n).fill(null), loc: new Array(n).fill(null), hand: new Array(n).fill(null), gap: new Array(n).fill(null) }); const e = props.get(k); e.pos[i] = h.pos; e.off[i] = h.off || null; e.loc[i] = h.loc || null; e.hand[i] = h.hand; e.gap[i] = h.gap ?? null; } });
  // a grab or a release of this prop near story time s (the fingers close round it as the hand arrives)
  const handling = (who, prop, s) => (sb?.actions || []).some((a) => a.who === who && ["grab", "release", "pass", "give", "take"].includes(a.do) && (!a.prop || a.prop === prop) && Math.abs(s - a.at) <= 0.25 + (a.dur ?? 0));
  for (const { h, pos, off, loc, hand, gap } of props.values()) {
    first(h.who, `held ${h.prop}`, pos[0], hand[1] === hand[0] ? pos[1] : null, hand[2] === hand[1] ? pos[2] : null);
    // a held prop floating off the glove (quality plan item 3 (d)): its nearest surface over GATE.gripGap from every
    // hand part, held that long, not while the hand closes or opens on it. Warns; fails once the holds fix is on (item 7)
    let run = 0;
    for (let i = 0; i <= n; i++) {
      const g = i < n && gap[i] != null && gap[i] > GATE.gripGap && !handling(h.who, h.prop, S(i)) && !waived("grip-gap", h.who, i);
      if (g) { run++; continue; }
      if (run / fps >= GATE.gripGapHold) { const a = i - run, m = Math.max(...gap.slice(a, i)); out.push({ level: gateLevel(sb, "holds"), check: "grip-gap", who: h.who, what: `${h.prop} floats off the glove`, t: Math.round(T(a) * 1000) / 1000, size: Math.round(m * 1000), to: Math.round(T(i - 1) * 1000) / 1000 }); }
      run = 0;
    }
    // a change of hand (R to both, a pass) re-anchors the prop on purpose: only the frames of one hold count
    const same = (i) => hand[i] === hand[i - 1];
    pops(pos.map((p, i) => (i && !same(i) ? null : p)), RIG.prop, h.who, `held ${h.prop}`, "prop-pop");
    for (let i = 1; i < n; i++) {
      if (!off[i] || !off[i - 1] || !same(i) || cut(i)) continue;
      // a slip moves it both from where the hand is and within the hand's turn: an upright hold keeps the first, a
      // pinch (which turns with the hand) the second
      const d = Math.min(dist(off[i], off[i - 1]), loc[i] && loc[i - 1] ? dist(loc[i], loc[i - 1]) : Infinity);
      if (d > RIG.slip * sc) out.push({ level: d > GATE.propSlip * 1000 * sc && !waived("prop-pop", h.who, i) ? gateLevel(sb, "holds") : "warn", check: "prop-pop", who: h.who, what: `${h.prop} slips in the hand`, t: Math.round(T(i) * 1000) / 1000, size: Math.round(d) });
    }
  }
  return out.sort((a, b) => a.t - b.t);
}

// check.mjs results: one line per actor, part and kind, with all its times
export function rigResults(layout, sb) {
  const f = rigFindings(layout, sb), out = [], g = new Map();
  if (!(layout?.contacts || []).some((r) => r.actors?.some((a) => a.w))) return out;
  // frame 0 jumps: one line for the whole opening (every part that jumps, with its size)
  const f0 = f.filter((x) => x.check === "frame0-jump");
  for (const lvl of ["fail", "warn"]) {
    const xs = f0.filter((x) => x.level === lvl); if (!xs.length) continue;
    out.push({ level: lvl, check: "frame0-jump", msg: `the opening pose jumps between frame 0 and frame 1 (final drawn rig): ${xs.map((x) => `${x.who} ${x.what} ${(x.size / 10).toFixed(0)} cm`).join(", ")}: start it instantly ("dur": 0 at t = 0, not a 0.01 s move), so frame 0 is already in its pose${lvl === "warn" ? '; fails at "gate": 2' : ""}, or name it in an allowClip window ("checks": ["frame0-jump"]) with a reason` });
  }
  for (const x of f) { if (x.check === "frame0-jump") continue; const k = `${x.level}|${x.check}|${x.who}|${x.what}`; if (!g.has(k)) g.set(k, { x, ts: [], max: 0 }); const e = g.get(k); e.ts.push(x.t); e.max = Math.max(e.max, x.size); }
  const tips = { "rig-jump": "look at it in a 15 fps strip; smooth the pose change or hide it behind a cut", "foot-slide": "plant the foot (a step, or keep it still)", "prop-pop": "keep the same hold (grip, keep) through the move",
    "frame0-jump": "start the opening pose instantly (\"dur\": 0 at t = 0, not 0.01 s), so frame 0 is already in its pose",
    "stance-slide": "the standing foot skates during the step: use a move with the default ease, a slower move, or more steps",
    "grip-gap": "close the hold on the prop (the grip library's hold for it), or keep the hand on the prop through the move" };
  const later = { "foot-slide": "feet", "stance-slide": "feet", "prop-pop": "holds", "grip-gap": "holds" };
  for (const { x, ts, max } of g.values()) {
    const list = ts.length > 6 ? `${ts.slice(0, 6).map((t) => t.toFixed(2)).join(", ")} … (${ts.length} ${x.check === "stance-slide" ? "stances" : "frames"})` : ts.map((t) => t.toFixed(2)).join(", ");
    const what = x.check === "foot-slide" ? `${x.what} slides on the floor without a step` : x.check === "stance-slide" ? `${x.what} slides while standing in a step` : x.check === "frame0-jump" ? `${x.what} jumps between frame 0 and frame 1` : x.check === "grip-gap" || x.what.includes("slips") ? x.what : `${x.what} jumps`;
    const unit = x.check === "stance-slide" ? "in one stance" : x.check === "grip-gap" ? "from the glove" : "in one frame";
    // a visible-glitch check that only warns: say when it starts to fail
    const when = x.level === "warn" && ((x.check === "foot-slide" && max > GATE.footSlide * 1000) || (x.check === "prop-pop" && x.what.includes("slips") && max > GATE.propSlip * 1000) || ["frame0-jump", "stance-slide", "grip-gap"].includes(x.check))
      ? (gateOf(sb) >= 2 ? `; fails once the ${later[x.check]} fix is on (quality plan item ${later[x.check] === "feet" ? 10 : 7})` : `; fails at "gate": 2${later[x.check] ? ` once the ${later[x.check]} fix is on` : ""}`) : "";
    out.push({ level: x.level, check: x.check, msg: `${x.who}: ${what} at ${list}s, up to ${(max / 10).toFixed(1)} cm ${unit} (final drawn rig): ${tips[x.check]}${when}` });
  }
  if (!out.length) out.push({ level: "pass", check: "rig-jump", msg: "the drawn hands, elbows, feet and held props move without one-frame pops" });
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2), lay = JSON.parse(fs.readFileSync(a[0], "utf8")), si = a.indexOf("--sb");
  const { loadStoryboard } = await import("../engine/load.mjs");
  const sb = si >= 0 ? loadStoryboard(a[si + 1]) : null;
  const res = rigResults(lay, sb);
  if (!res.length) console.log("rig: this layout has no rig positions (made before qa/rig.mjs: run render.mjs --layout again)");
  for (const r of res) console.log(`  ${r.level} ${r.check}: ${r.msg}`);
  if (res.some((r) => r.level === "fail")) process.exitCode = 1;
}
