#!/usr/bin/env node
// Cheap automatic checks for a rendered clip. Run them on a --draft render before spending minutes on the full one,
// and again on the final MP4. Exit code 0 = pass (warnings and notes allowed), 1 = fail, 2 = usage error.
//
//   node qa/check.mjs out/test-01-golden.mp4                       -> finds out/test-01-golden.layout.json if present
//   node qa/check.mjs clip.mp4 --sb storyboards/x.json --layout x.layout.json --json
//   node qa/check.mjs clip.mp4 --sb x.json --profile rewards           -> publishing profile (default: the storyboard's, else "short")
//   node qa/check.mjs clip.mp4 --no-flow                               -> skip the optical-flow pass (qa/glitches.mjs, ~12 s)
//   node qa/check.mjs clip.mp4 --sb x.json --ears                      -> earshot listens too (sync, floors; ~1 min, qa/sound.mjs)
//
// Results come in three groups, kept apart so a report never passes off a creative guess as a platform fact:
//   technical   defects in the file, picture or sound: blank or odd frames, loudness, clipping, hidden captions,
//               sound sync and levels (qa/sound.mjs) (fail/warn)
//   publishing  the target platform's published requirements, per profile (PROFILES), with the date they were checked
//   creative    house-style defaults (opening motion, event gaps, target length, loop seam, still holds, reading
//               speed): hypotheses to test, measured as diagnostics. They add notes and never fail a clip. A storyboard
//               changes them in a "creative" block, e.g. { "length": [8, 15], "maxEventGap": 3 }.
//
// Works for any renderer: the MP4 checks need nothing else, and the caption checks read a layout file
// { fps, samples: [{ t, captions: [[x,y,w,h]] or [{ box, covered? }], actors: [{ id, box }] }] } in output pixels.
// `covered` (0..1) is the share of the caption box hidden behind characters; renderers that can't measure it
// leave it out and the check falls back to the coarser character boxes.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";
import { loadStoryboard, loadCharacters } from "../engine/load.mjs";
import { motionResults, storyNotes, loopSeam } from "./motion.mjs";
import { soundNotes, soundMeasure, soundEars } from "./sound.mjs";
import { visibility, frontResults } from "./framing.mjs";
import { cameraLint } from "./camera.mjs";
import { rigResults, cutIn, proj } from "./rig.mjs";
import { supportResults } from "./support.mjs";
import { handResults } from "./hands.mjs";   // hand moves and palm turns against workflow.md "Hands" (9 Nov 2026)   // holds 2: every prop held, riding, in flight, resting or staged
import { GATE, gateOf, gateLevel, windowFor, storyAt, actingAt } from "./gate.mjs";
export { GATE, gateOf, gateLevel, rootFixed, windowFor, waives, storyAt, actingAt } from "./gate.mjs";
import { cutBetween } from "../engine/page/timeline.js";
import { pixelGlitches, describe as describePixel } from "./glitches.mjs";
import { storyTime } from "../engine/shared/holds.js";
import { seedOf } from "../puppet/beat.mjs";
import { lockMusic } from "../engine/music.mjs";

export const RULES = {
  size: [1080, 1920],
  safe: { x0: 60, y0: 210, x1: 920, y1: 1360 }, // outside this, TikTok's buttons, caption and bars cover the picture
  whiteY: 235, // a frame whose darkest pixel is this bright (0..255) is a blank white frame
  blackY: 20, // a frame whose brightest pixel is this dark is an empty black frame
  lufs: [-15.5, -12.5], truePeakMax: -1.0, silentLUFS: -40,
  dropoutLUFS: -50, dropoutHold: 1.0, // momentary loudness under this for this long inside the clip: the sound dropped out
  captionCross: 0.35, // two captions collide when the smaller box is crossed by over this share of its height
  coverWarn: 0.08, coverFail: 0.25, coverFailHold: 0.5, // share of a caption hidden by characters; fail if held 0.5 s
  stillDiff: 0.35, // mean |dY| per frame below which the picture counts as still
  gore: /blood|gore|splat|guts|\bmash|sever|dismember|decapit/i,
  // clean-render guards
  clipWarn: 0.1, clipFail: 0.25, clipHold: 0.2, // how deep a character goes into a prop or another character (0..1)
  selfEyes: 0.55, selfDeep: 0.25, selfHold: 0.2, // a held prop in its own holder: from this height of the body up is the eyes; this deep reads as through; this long
  bodyClip: 0.1, // two characters this far into each other (0..1) fail outright, unless an allowClip window with a reason covers it
  // inside an allowClip window (a hug, a hide) contact is fine but merging is not (Zombie Too, 4 Nov: the hug window let
  // the bodies sink 86 % into each other and every check passed; the fixed hug presses 14 %): bodies may press up to
  // allowBody (0..1 of the way to the centre). A window raises its own limit with "max" (0..1) and says why in its
  // reason. Hands in a window are not capped: reach() measures characters as box ellipsoids, which can't tell a glove
  // resting on a hood from one inside it (the fixed hug's glove on Reaper's back reads 42 cm "in")
  allowBody: 0.18,
  // a hand or arm inside a window may press into another character's body or face (potato-shaped, so measured well)
  // up to allowReach metres; a hood, hat or helmet is measured as its box and is not capped (a glove resting on
  // Reaper's hood reads 42 cm "in"). The fixed Zombie Too hug: Reaper's arm 29 cm into Phoenix's belly, glove hidden
  allowReach: 0.04,
  // a hand reaching across its own body (metres past the middle, potato.js contact().cross): from crossWarn the shoulder
  // starts to hide; from crossFail, held crossHold s, the arm reads as growing out of the chest (Zombie Too fixed hug:
  // Reaper's right hand 1 m across to Phoenix's far side; a staff held across the body is 0.2-0.3)
  crossWarn: 0.35, crossFail: 0.45, crossHold: 0.3,
  // contact (layout "contacts", every frame): an arm through the held staff or a hat brim, the staff through the body,
  // a hand that turns further in one frame than a hand can (metres, degrees, frames)
  armThroughStaff: 0, staffInBody: -0.03, brimDepth: 0.01, contactHold: 2, handTurnWarn: 60,
  armAlongShaft: 0.85, armAlongHold: 0.4, // forearm nearly along the held shaft (|forearm·shaft|) for this long: the setup for a fist flip
  // hands and held props against characters (the look busy remake): a hand or blade this far into another character
  // (metres, hand radius included) fails; within a centimetre for touchHold warns; a hand on screen over a face's
  // eyes fails from faceCoverFail (s), warns from faceCoverWarn; a fist over a head or a prop growing out of a body warns
  reachIn: 0.02, touchHold: 0.2, faceCoverFail: 0.3, faceCoverWarn: 0.1, readHold: 0.2,
  // hands, arms and costume parts in scene props (stage.js inProps), metres past the prop's surface, each for
  // contactHold frames. A prop nobody here holds (a parcel someone else carries, a bowl, a box lid): a hand part over
  // handInProp fails, over handTouchProp warns; an arm (a soft tube that may rest against it) over armInProp fails. A
  // costume part over costumeInProp fails, on a side the camera sees. The prop the character works with (holds, pushes,
  // cups, rests a paw on): fingers and thumb may press in; the palm, wrist or arm coming out of it on a side the camera
  // sees over heldInProp fails on a thin prop (a straw through the glove), warns from heldWarn on any other (a fist
  // sunk into a phone). A hand on a prop it doesn't work with fails only from handPopHold s (shorter: fingers brushing
  // a lid or a chair as a hand grabs or lets go, a warning to look at). A thin held prop must show past the fist at both ends, on screen, by thinShow (for
  // thinHold s or more: a straw picked up off the table hides an end for a moment)
  handInProp: 0.02, handTouchProp: 0.012, limbInProp: 0.01, limbTouch: 0.003, armInProp: 0.03, costumeInProp: 0.02, heldInProp: 0.01, heldWarn: 0.03, thinShow: 0.01, thinHold: 0.5, handPopHold: 0.15,
  faceHide: 0.35,   // share of the eye points hidden (stage.js hiddenFaces) that counts as a hidden face: about a third
  oddFrame: 8, oddFrameFail: 30, // a frame that differs from both neighbours while they agree (a one-frame pop), 0..255
  spinStep: 90, // degrees a character may turn between two frames before the turn strobes (front, back, front)
  strobeJump: 20, strobeMax: 3, // brightness jumps per second before it reads as strobing
};

// Creative defaults: the house style from the algorithm research (docs/PLAN.md, Studio roadmap). None of these is a
// published platform rule; they are the starting point for experiments (experiments/README.md), so they only add notes.
export const CREATIVE = {
  length: [12, 20], // target band in seconds; over the top needs an "escalation" beat
  openingMotion: 0.3, // the picture changes within this many seconds
  maxEventGap: 2.0, // longest stretch without an event start (shots, actions, effects, sounds and captions all count)
  stillHold: 2.0, // longest stretch where the picture barely changes
  loopSSIM: 0.55, // similarity of last and first frame, when the storyboard says loop: true
  wordsPerSec: 3.5, // caption reading speed
  openingCuts: 2, // hard cuts in the first 2 s that bring a note (posted clips: more early cuts, fewer viewers at 0:02)
  quietStart: -20, // dBFS: the first second's loud moments (90th percentile of 100 ms windows) under this bring a note
  frozenShare: 25, // % of frames that move less than an idle breath (qa/pace.py "frozen") above which a note comes
  longestStill: 1.0, // seconds: a frozen run this long brings a note (the best-holding posted clips stay under 0.6 s)
};

// Publishing profiles: what the target platforms publish as requirements, and when that was last checked. Length is
// the only one with hard numbers so far; the caption safe zone (RULES.safe) and cartoon-only violence apply to all.
export const PROFILES = {
  short: {
    name: "TikTok + YouTube Shorts discovery clip", checked: "2026-10-24",
    length: { max: 180, why: "YouTube treats a vertical video over 3 minutes as a regular video, not a Short" },
  },
  rewards: {
    name: "TikTok Creator Rewards (over one minute)", checked: "2026-10-24",
    length: { min: 60, warnUnder: 65, why: "Creator Rewards counts original videos over one minute; length alone doesn't make a clip eligible" },
    source: "support.tiktok.com/en/business-and-creator/creator-rewards-program",
    creative: { length: [65, 90] },
  },
};

// which group each check belongs to (anything not listed is technical)
const GROUP = { "length-limit": "publishing", "caption-safe-zone": "publishing", "caption-band": "publishing", "caption-collide": "publishing", "cartoon-only": "publishing",
  opening: "creative", "still-hold": "creative", loop: "creative", length: "creative", "event-gaps": "creative", "reading-speed": "creative",
  "eyes-lead": "creative", "reaction-hold": "creative", "payoff-sound": "creative", "loop-seam": "creative", pace: "creative",
  frozen: "creative", visible: "creative", camera: "creative" };
export const groupOf = (check) => GROUP[check] ?? "technical";

function args() {
  const a = process.argv.slice(2), o = { clip: null, sb: null, layout: null, json: false, profile: null, ears: false, flow: true };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--sb") o.sb = a[++i];
    else if (a[i] === "--profile") o.profile = a[++i];
    else if (a[i] === "--layout") o.layout = a[++i];
    else if (a[i] === "--json") o.json = true;
    else if (a[i] === "--ears") o.ears = true;
    else if (a[i] === "--no-flow") o.flow = false;
    else o.clip = a[i];
  }
  if (!o.clip) { console.error("usage: node qa/check.mjs <clip.mp4> [--sb storyboard.json] [--layout layout.json] [--profile short|rewards] [--json] [--ears]"); process.exit(2); }
  return o;
}

const run = (cmd, argv) => { const r = spawnSync(cmd, argv, { encoding: argv.includes("rawvideo") ? "buffer" : "utf8", maxBuffer: 256 << 20 }); if (r.error) throw r.error; return r; };

// One-frame glitches: a frame that differs from both its neighbours while they agree with each other, and the
// picture around it is steady (a hat that drops for a frame, a pose that flashes, a spin that strobes, see-through
// parts that swap). Measured on a 36x64 grey copy, in overlapping 12x12 blocks (a third of the width):
// score = min(|F[i]-F[i-1]|, |F[i]-F[i+1]|) - max(|F[i+1]-F[i-1]|, |F[i-1]-F[i-2]|, |F[i+2]-F[i+1]|), mean per pixel.
// Steady motion, cuts and fades score near 0; a quick symmetric bounce scores low because its neighbours move too.
// every frame at low resolution: { t, YMIN, YMAX, YAVG, YDIF } (blank frames, strobe; the draft's pops line too)
export function lumaFrames(clip) {
  const st = run("ffmpeg", ["-v", "error", "-i", clip, "-vf", "scale=108:192,signalstats,metadata=print:file=-", "-an", "-f", "null", "-"]).stdout;
  const frames = []; let cur = null;
  for (const ln of st.split("\n")) {
    const m = ln.match(/pts_time:([\d.]+)/); if (m) { cur = { t: Number(m[1]) }; frames.push(cur); continue; }
    const k = ln.match(/lavfi\.signalstats\.(YMIN|YMAX|YAVG|YDIF)=([\d.]+)/); if (k && cur) cur[k[1]] = Number(k[2]);
  }
  return frames;
}
// the most big brightness jumps (over RULES.strobeJump) inside any 1 s, and where that second starts
export function strobeOf(frames) {
  const jumps = []; for (let i = 1; i < frames.length; i++) if (Math.abs((frames[i].YAVG || 0) - (frames[i - 1].YAVG || 0)) > RULES.strobeJump) jumps.push(frames[i].t);
  let n = 0, at = 0; for (const t of jumps) { const k = jumps.filter((u) => u >= t && u < t + 1).length; if (k > n) { n = k; at = t; } }
  return { n, at };
}
export function oddFrames(clip, fps = 30) {
  const W = 36, H = 64, B = 12, N = W * H;
  const raw = run("ffmpeg", ["-v", "error", "-i", clip, "-vf", `scale=${W}:${H}:flags=area,format=gray`, "-f", "rawvideo", "-"]);
  const buf = Buffer.isBuffer(raw.stdout) ? raw.stdout : Buffer.from(raw.stdout || "", "latin1"), n = Math.floor(buf.length / N), F = (i) => buf.subarray(i * N, (i + 1) * N);
  const out = [];
  for (let i = 2; i < n - 2; i++) {
    const pp = F(i - 2), p = F(i - 1), c = F(i), q = F(i + 1), qq = F(i + 2); let best = 0, at = [0, 0];
    for (let by = 0; by + B <= H; by += B / 2) for (let bx = 0; bx + B <= W; bx += B / 2) {
      let a = 0, b = 0, m = 0, d = 0, e = 0;
      for (let y = by; y < by + B; y++) for (let x = bx; x < bx + B; x++) { const k = y * W + x; a += Math.abs(c[k] - p[k]); b += Math.abs(c[k] - q[k]); m += Math.abs(q[k] - p[k]); d += Math.abs(p[k] - pp[k]); e += Math.abs(qq[k] - q[k]); }
      const s = (Math.min(a, b) - Math.max(m, d, e)) / (B * B);
      if (s > best) { best = s; at = [bx, by]; }
    }
    if (best > 0) out.push({ t: i / fps, score: best, where: `${["left", "middle", "middle", "right", "right"][at[0] / 6]} ${at[1] < 22 ? "top" : at[1] < 42 ? "centre" : "bottom"}` });
  }
  return out.sort((x, y) => y.score - x.score);
}

// the picture's speed either side of the loop seam: mean |dY| per frame on a 72x128 grey copy for the last three and
// first three steps, and the step from the last frame to the first
export function seamSpeed(clip) {
  const W = 72, H = 128, N = W * H, grab = (pre) => { const r = run("ffmpeg", ["-v", "error", ...pre, "-i", clip, "-vf", `scale=${W}:${H}:flags=area,format=gray`, "-f", "rawvideo", "-"]); return Buffer.isBuffer(r.stdout) ? r.stdout : Buffer.from(r.stdout || "", "latin1"); };
  const head = grab(["-t", "0.15"]), tail = grab(["-sseof", "-0.2"]), nh = Math.floor(head.length / N), nt = Math.floor(tail.length / N);
  if (nh < 4 || nt < 4) return null;
  const F = (b, i) => b.subarray(i * N, (i + 1) * N), d = (p, q) => { let s = 0; for (let k = 0; k < N; k++) s += Math.abs(p[k] - q[k]); return s / N; };
  const last = (i) => F(tail, nt - 4 + i);
  return { end: [1, 2, 3].map((i) => d(last(i - 1), last(i))), start: [1, 2, 3].map((i) => d(F(head, i - 1), F(head, i))), seam: d(last(3), F(head, 0)) };
}

// characters passing through props or each other, from the layout's "clips" (stage.js clipping()). Two characters
// overlapping is a failure as soon as it shows (RULES.bodyClip): bodies merging read as a glitch at once. Touching
// (a body, hat or helmet within about 10% of another body, a few centimetres) is a warning. A storyboard
// that wants contact (a hug, a hide) allows it with "allowClip": [{ "who", "with"?, "from", "to", "reason" }]; a window
// without a reason does not count. A character in a prop fails only when held (RULES.clipHold), since a prop edge
// brushing a body for a frame or two is invisible.
export function clipResults(sb, layout) {
  const out = [], samples = layout?.samples || [];
  if (!samples.some((x) => x.clips)) return out;
  const step = samples.length > 1 ? samples[1].t - samples[0].t : 0.1;
  const windows = sb?.allowClip || [];
  for (const w of windows) if (!w.reason) out.push({ level: "warn", check: "clipping", msg: `allowClip ${w.who}${w.with ? " / " + w.with : ""} ${w.from}-${w.to}s has no reason, so it is ignored` });
  const actors = new Set((sb?.cast || []).map((c) => c.id));
  const win = (c, t) => windowFor(sb, actors.has(c.with) ? "character-overlap" : "clipping", c.who, t, c.with);
  const runs = new Map();
  const self = new Map();   // a held prop going into its own holder (stage.js clipping() "self"), judged apart below
  for (const x of samples) for (const c of x.clips || []) {
    if (c.self) { const k = `${c.who} / ${c.with}`, r = self.get(k) || { rows: [] }; r.rows.push({ t: x.t, d: c.depth, z: c.zone }); self.set(k, r); continue; }
    const w = win(c, x.t), body = actors.has(c.with);
    // a window allows contact with a prop, and bodies pressing together; bodies merging still fail
    if (w && (!body || c.depth <= (w.max ?? RULES.allowBody))) continue;
    const k = `${c.who} / ${c.with}${c.part ? " (" + c.part + ")" : ""}${w ? " in the allowClip window" : ""}`, r = runs.get(k) || { body, win: w, part: c.part ? `${c.who} / ${c.with}` : null, max: 0, at: 0, run: 0, held: 0, last: -1, from: x.t, to: x.t };
    if (c.depth > r.max) { r.max = c.depth; r.at = x.t; }
    r.to = x.t;
    if (c.depth > RULES.clipFail) { r.run = Math.abs(x.t - r.last - step) < 1e-3 ? r.run + step : step; r.last = x.t; r.held = Math.max(r.held, r.run); }
    runs.set(k, r);
  }
  for (const [k, r] of runs) {
    const pct = Math.round(r.max * 100);
    if (r.body && r.win) {
      out.push({ level: "fail", check: "character-overlap", msg: `${k}: ${r.part ? "a hat or helmet and a body" : "bodies"} merge, up to ${pct}% into each other at ${r.at.toFixed(1)}s (${r.from.toFixed(1)}-${r.to.toFixed(1)}s), past the ${Math.round((r.win.max ?? RULES.allowBody) * 100)}% a contact window allows: they may touch and press, not sink into each other. Move them apart (cheek to cheek, gloves outside the body)` });
      continue;
    }
    if (r.body) {
      const lvl = r.max > RULES.bodyClip ? "fail" : "warn", what = r.part ? `${r.part.split(" / ")[0]}'s hat or helmet against ${r.part.split(" / ")[1]}` : "bodies";
      out.push({ level: lvl, check: "character-overlap", msg: `${k}: ${what} ${lvl === "warn" ? "touching" : "up to " + pct + "% into each other at " + r.at.toFixed(1) + "s"} (${r.from.toFixed(1)}-${r.to.toFixed(1)}s)${lvl !== "pass" ? ": keep them a body-width apart, or add an allowClip window with a reason" : ""}` });
      continue;
    }
    const lvl = r.held + 1e-6 >= RULES.clipHold ? "fail" : r.max > RULES.clipWarn ? "warn" : "pass";
    out.push({ level: lvl, check: "clipping", msg: `${k}: up to ${pct}% into each other at ${r.at.toFixed(1)}s${lvl === "fail" ? ", held " + r.held.toFixed(1) + "s" : ""}` });
  }
  if (!runs.size) out.push({ level: "pass", check: "clipping", msg: "nobody passes through props or each other" });
  out.push(...selfResults(sb, self, step));
  return out;
}

// "prop-in-self" (look-2d-layer-01, 7 Nov 2026): a held cup, spoon, fork or note going into its own holder's body. The
// holder's hand puts it there on purpose, so a touch is fine (a mug against the chest, a cup at the lips); two things
// are not. At the eyes: the prop goes in high on the face (RULES.selfEyes of the body's height and up, where a potato's
// eyes are) for RULES.selfHold or longer: a sip aimed at the eyes or under a hat brim (Never Has Money 02, 7 Nov: the
// coffee cup in the eyes, caught by eye; aim a sip at the layout's mouth point). Deep: the prop sinks past
// RULES.selfDeep into the body for RULES.selfHold or longer (it reads as going through). Warnings, with the times, so
// they show on every check. An allowClip window for who / prop waives the depth; only one naming "prop-in-self"
// in its checks waives the eyes.
function selfResults(sb, self, step) {
  const out = [];
  for (const [k, r] of self) {
    const [who, what] = k.split(" / ");
    const runOf = (pred) => { let best = 0, run = 0, last = -1, at = 0, from = 0; for (const x of r.rows) { if (!pred(x)) continue; run = Math.abs(x.t - last - step) < 1e-3 ? run + step : step; if (run === step) from = x.t; last = x.t; if (run > best) { best = run; at = from; } } return { best, at, to: at + best - step }; };
    // a contact window (a sip: "lips on the cup") excuses the touch and the depth, never the height: only a window
    // naming "prop-in-self" in its checks waives a prop at the eyes
    const ok = (t) => windowFor(sb, "clipping", who, t, what), okEyes = (t) => windowFor(sb, "prop-in-self", who, t, what);
    const eyes = runOf((x) => x.z >= RULES.selfEyes && x.d > 0.05 && !okEyes(x.t)), deep = runOf((x) => x.d > RULES.selfDeep && !ok(x.t));
    const max = r.rows.reduce((m, x) => (x.d > m.d ? x : m), r.rows[0]);
    if (eyes.best + 1e-6 >= RULES.selfHold) out.push({ level: "warn", check: "prop-in-self", msg: `${who}'s ${what} goes into its own face at eye height at ${eyes.at.toFixed(1)}-${eyes.to.toFixed(1)}s (${Math.round(max.d * 100)}% in at most): a sip or a bite belongs at the mouth (the layout's mouth point), not the eyes or under a brim` });
    else if (deep.best + 1e-6 >= RULES.selfHold) out.push({ level: "warn", check: "prop-in-self", msg: `${who}'s ${what} sinks ${Math.round(max.d * 100)}% into its own body at ${deep.at.toFixed(1)}-${deep.to.toFixed(1)}s: hold it a little further out` });
  }
  if (!out.length && self.size) out.push({ level: "pass", check: "prop-in-self", msg: "held props touch their holders but never go into a face or deep into a body" });
  return out;
}

// grips and limbs, from the layout's per-frame "contacts" (potato.js contact()): the arm holding a staff passing through
// it, the staff going into the body, an arm through a hat brim or up inside a helmet's glass, and a hand that turns further in one frame than a hand
// can (a pop; it may be hidden behind what the hand holds, so it warns)
export function contactResults(layout, sb = null) {
  const out = [], rows = layout?.contacts || [];
  if (!rows.length) return out;
  const fps = layout.fps || 30, ids = [...new Set(rows.flatMap((r) => r.actors.map((a) => a.id)))], T = (i) => rows[i]?.t ?? i / fps;
  const spans = (flags) => { const s = []; let a = -1; flags.forEach((f, i) => { if (f && a < 0) a = i; if (!f && a >= 0) { s.push([a, i - 1]); a = -1; } }); if (a >= 0) s.push([a, flags.length - 1]); return s.filter(([x, y]) => y - x + 1 >= RULES.contactHold); };
  const when = ([x, y]) => `${(x / fps).toFixed(2)}-${(y / fps).toFixed(2)}s`;
  const turn = (p, q) => 2 * Math.acos(Math.min(1, Math.abs(p[0] * q[0] + p[1] * q[1] + p[2] * q[2] + p[3] * q[3]))) * 180 / Math.PI;
  let found = 0;
  for (const id of ids) {
    const st = rows.map((r) => r.actors.find((a) => a.id === id) || null);
    const staffSpans = (key, lim) => spans(st.map((a) => !!(a && a.staff && a.staff[key] < lim)));
    for (const sp of staffSpans("arm", RULES.armThroughStaff)) { found++; out.push({ level: "fail", check: "grip", msg: `${id}: the arm passes through the staff at ${when(sp)}: put the staff in front of the arm, forearm square to it` }); }
    for (const sp of spans(st.map((a) => !!(a && a.staff && a.staff.par > RULES.armAlongShaft))).filter(([x, y]) => (y - x + 1) / fps >= RULES.armAlongHold)) out.push({ level: "warn", check: "grip", msg: `${id}: the forearm runs along the staff at ${when(sp)}: the fist has nothing to turn round and can flip; hold the staff out from the side, forearm square to it` });
    for (const sp of staffSpans("body", RULES.staffInBody)) { found++; out.push({ level: "fail", check: "grip", msg: `${id}: the staff goes into the body at ${when(sp)}: hold it further out from the side` }); }
    for (const s of ["R", "L"]) {
      const far = spans(st.map((a) => !!(a && a.cross && a.cross[s] > RULES.crossWarn))).filter(([x, y]) => (y - x + 1) / fps >= RULES.crossHold);
      for (const sp of far) {
        const m = Math.max(...st.slice(sp[0], sp[1] + 1).map((a) => a?.cross?.[s] ?? 0)), deep = m > RULES.crossFail; if (deep) found++;
        out.push({ level: deep ? "fail" : "warn", check: "limb-through-costume", msg: `${id}: hand ${s} reaches ${Math.round(m * 100)} cm across its own body at ${when(sp)}: the shoulder hides and the arm reads as coming out of the chest; reach with the hand on that side, or turn the body to face the reach` });
      }
      for (const sp of spans(st.map((a) => !!(a && a.brim[s] > RULES.brimDepth)))) { found++; out.push({ level: "fail", check: "limb-through-costume", msg: `${id}: arm ${s} goes through the hat brim at ${when(sp)}: raise it wider than the brim` }); }
      for (const sp of spans(st.map((a) => !!(a && a.helmet && a.helmet[s] > RULES.brimDepth)))) { found++; out.push({ level: "fail", check: "limb-through-costume", msg: `${id}: arm ${s} runs up inside the helmet glass at ${when(sp)}: raise it wider than the helmet` }); }
      const flips = [], pops = [];
      for (let i = 1; i < st.length; i++) {
        const a = st[i - 1], b = st[i]; if (!a || !b || (sb && cutIn(sb, storyTime(sb.holds, (i - 1) / fps), storyTime(sb.holds, i / fps)))) continue;   // cuts are on the storyboard's clock
        const d = turn(a.q[s], b.q[s]);
        if (d > RULES.handTurnWarn) pops.push({ t: i / fps, d });
        // a flip anyone sees at full speed (quality plan item 3): over GATE.handTurn, the hand on screen and moving
        // slower than the motion blur's threshold (a smeared hand hides its turn), not waived by a named window
        if (d > GATE.handTurn && sb && a.w?.[`h${s}`] && b.w?.[`h${s}`] && b.on !== 0) {
          const P = proj(sb), p0 = P(T(i - 1), a.w[`h${s}`]), p1 = P(T(i), b.w[`h${s}`]);
          const shown = p1 && p1[0] >= 0 && p1[0] <= 1080 && p1[1] >= 0 && p1[1] <= 1920, px = p0 && p1 ? Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) : 0;
          if (shown && px < GATE.blurPx && !windowFor(sb, "hand-turn", id, T(i))) flips.push({ t: T(i), d });
        }
      }
      // one line per hand: every turn over handTurnWarn (the ones hand-turn doesn't report are hidden, smeared or off screen)
      const shown = pops.filter((p) => !flips.some((f) => Math.abs(f.t - p.t) < 1e-3));
      if (shown.length) out.push({ level: "warn", check: "hand-pop", msg: `${id}: hand ${s} turns over ${RULES.handTurnWarn}° in one frame at ${shown.slice(0, 6).map((p) => `${p.t.toFixed(2)}s (${Math.round(p.d)}°)`).join(", ")}${shown.length > 6 ? ` … (${shown.length} frames)` : ""}: look at it at full speed (fine if hidden)` });
      if (flips.length) {
        const lvl = gateLevel(sb, "hands"); if (lvl === "fail") found++;
        out.push({ level: lvl, check: "hand-turn", msg: `${id}: hand ${s} flips over ${GATE.handTurn}° in one frame on screen at ${flips.slice(0, 6).map((f) => `${f.t.toFixed(2)}s (${Math.round(f.d)}°)`).join(", ")}${flips.length > 6 ? ` … (${flips.length} frames)` : ""}: anyone sees it at full speed; change the move (a lower or forward path, the same palm side through it)${lvl === "warn" ? `, ${gateOf(sb) >= 2 ? "fails once the hand fix is on (\"rig\": { \"hand\": 2 }, plan item 2)" : "fails at \"gate\": 2"}` : ""}, or name it in an allowClip window ("checks": ["hand-turn"]) with a reason` });
      }
    }
  }
  if (!found) out.push({ level: "pass", check: "grip", msg: "hands stay on what they hold, arms clear of staffs and brims" });
  out.push(...reachResults(layout, sb), ...propResults(layout, sb), ...rigResults(layout, sb), ...supportResults(layout, sb), ...handResults(layout, sb));
  return out;
}

// hands, arms and costume parts in scene props (stage.js inProps), and thin held props hidden in the fist: one line
// per part and prop, all the times, the deepest. Contact a beat needs (a hand under a blanket, a straw pushed into a
// carton) goes in an allowClip window with a reason (who: the character, with: the prop's id).
function propResults(layout, sb) {
  const out = [], rows = layout?.contacts || [];
  if (!rows.some((r) => r.inProps || r.thin)) return out;
  const fps = layout.fps || 30, n = rows.length, when = ([x, y]) => `${(x / fps).toFixed(2)}-${(y / fps).toFixed(2)}s`;
  const windows = (sb?.allowClip || []).filter((w) => w.reason);
  const T = (i) => rows[i]?.t ?? i / fps;
  const allowed = (who, prop, i, check) => !!windowFor(sb, check, who, T(i), prop);
  const runs = (flags) => { const s = []; let a = -1; flags.forEach((f, i) => { if (f && a < 0) a = i; if (!f && a >= 0) { s.push([a, i - 1]); a = -1; } }); if (a >= 0) s.push([a, flags.length - 1]); return s.filter(([x, y]) => y - x + 1 >= RULES.contactHold); };
  // per part and prop, per frame: [the measure, its fail limit, its warn limit] (see RULES.handInProp)
  const m = new Map();
  rows.forEach((r, i) => {
    const thin = new Set((r.thin || []).map((t) => t.prop));
    for (const x of r.inProps || []) {
      const part = x.part || "hand";
      if (allowed(x.who, x.prop, i, { hand: "hand-in-prop", arm: "arm-in-prop", costume: "costume-in-prop", limb: "limb-in-surface" }[part])) continue;
      const held = !!x.held, k = `${x.who}|${part}|${x.hand || x.what}|${x.pad ? "pad" : ""}|${x.prop}`;
      const seen = x.seenDepth ?? x.depth;
      // a prop's own limb (a moth's wing) in another prop or the set: past limbInProp fails, past limbTouch warns
      const v = part === "limb" ? [x.depth, RULES.limbInProp, RULES.limbTouch]
        : part === "costume" ? (held ? [x.core, Infinity, RULES.costumeInProp] : [x.core, RULES.costumeInProp, RULES.handTouchProp])
        : !held ? (part === "arm" ? [x.depth, RULES.armInProp, RULES.handInProp] : [x.depth, RULES.handInProp, RULES.handTouchProp])
        : x.pad ? [x.core ?? x.depth, Infinity, Infinity]
        : [seen, thin.has(x.prop) ? RULES.heldInProp : Infinity, RULES.heldWarn];
      if (!m.has(k)) m.set(k, { x: { ...x, part }, f: [] });
      m.get(k).f[i] = { v: v[0], fail: v[1], warn: v[2], held };
    }
  });
  const check = { hand: "hand-in-prop", arm: "arm-in-prop", costume: "costume-in-prop", limb: "limb-in-surface" };
  const name = (x) => (x.part === "costume" || x.part === "limb" ? x.what : x.part === "hand" ? `hand ${x.hand}${x.pad ? " (fingers)" : " (palm)"}` : `arm ${x.hand}`);
  for (const { x, f } of m.values()) {
    const at = (k) => runs(Array.from({ length: n }, (_, i) => !!f[i] && f[i].v > f[i][k]));
    // a hand going into a prop it doesn't work with for under handPopHold s only warns (Jonny, 29 Oct)
    const brief = ([a, b]) => x.part === "hand" && (b - a + 1) / fps < RULES.handPopHold && !f.slice(a, b + 1).some((e) => e && e.held);
    const all = at("fail"), deep = all.filter((sp) => !brief(sp)), touch = [...all.filter(brief), ...at("warn")];
    const spans = deep.length ? deep : touch, max = Math.round(Math.max(...f.filter(Boolean).map((e) => e.v)) * 100);
    const held = spans.some(([a, b]) => f.slice(a, b + 1).some((e) => e && e.held));   // what the failing frames measured
    const fix = x.part === "hand" ? (held ? "hold it with the finger and thumb pads, the palm and wrist beside or behind it" : "keep the glove outside it (hold it from outside, lift it clear)")
      : x.part === "arm" ? "move the prop or the elbow so the arm passes beside it"
      : x.part === "limb" ? "fold or lift the limb clear of it, or move the prop away from the surface" : "keep the costume clear of it (move the prop, turn or lean)";
    const what = held ? `${x.prop}, which it works with,` : x.prop;
    if (deep.length) out.push({ level: "fail", check: check[x.part], msg: `${x.who}: ${name(x)} goes into ${what} at ${deep.map(when).join(", ")}, up to ${max} cm${held ? " on the side the camera sees" : ""}: ${fix}, or add an allowClip window with a reason` });
    else if (touch.length) out.push({ level: "warn", check: check[x.part], msg: `${x.who}: ${name(x)} ${held ? "sinks" : "dips"} ${max} cm into ${what} at ${touch.map(when).join(", ")}${held ? " on the side the camera sees" : ""}: look at it in a 15 fps strip` });
  }
  // thin held props: both ends show past the fist
  const t = new Map();
  rows.forEach((r, i) => { for (const x of r.thin || []) { if (allowed(x.who, x.prop, i, "thin-prop-hidden")) continue; const k = `${x.who}|${x.prop}`; if (!t.has(k)) t.set(k, { x, s: new Array(n).fill(Infinity) }); t.get(k).s[i] = x.show; } });
  for (const { x, s } of t.values()) {
    const hid = runs(s.map((v) => v < RULES.thinShow)).filter(([a, b]) => (b - a + 1) / fps >= RULES.thinHold);
    if (hid.length) out.push({ level: "fail", check: "thin-prop-hidden", msg: `${x.who}: one end of ${x.prop} doesn't show past the fist at ${hid.map(when).join(", ")}: grip it higher, so both ends show past the glove, the prop a little in front of the palm (fingers over it on the camera side)` });
  }
  if (!out.length) out.push({ level: "pass", check: "hand-in-prop", msg: "hands, arms and costumes stay out of the props, and thin props show past the fist" });
  return out;
}

// hands and held props against characters (stage.js reach): into another character (hood, hat, helmet, face, body),
// sunk into its own body, over a face's eyes on screen, a fist over a head, a held prop growing out of a body.
// Contact a beat needs (a hug, a tap on the shoulder, hands over the eyes) goes in an allowClip window with a reason.
function reachResults(layout, sb) {
  const out = [], rows = layout?.contacts || [];
  if (!rows.some((r) => r.reach)) return out;
  const fps = layout.fps || 30, n = rows.length, when = ([x, y]) => `${(x / fps).toFixed(2)}-${(y / fps).toFixed(2)}s`;
  // windows on the story's clock, each waiving only its kinds (windowFor)
  const T = (i) => rows[i]?.t ?? i / fps;
  const allowed = (a, b, i, check) => !!windowFor(sb, check, a, T(i), b);
  // inside a window: contact, not sinking into the body or face (a window's maxReach raises the limit)
  const allowedReach = (x, i) => { const w = windowFor(sb, "reach", x.who, T(i), x.with); return !!w && (!["body", "face"].includes(x.part) || (x.depth ?? 0) <= (w.maxReach ?? RULES.allowReach)); };
  // per key, the frames where it holds, then runs of at least min frames
  const track = (key, pick) => { const m = new Map(); rows.forEach((r, i) => { for (const x of pick(r)) { const k = key(x); if (!m.has(k)) m.set(k, { x, f: new Array(n).fill(false), d: new Array(n).fill(-1) }); const e = m.get(k); e.f[i] = true; e.d[i] = Math.max(e.d[i], x.depth ?? x.cover ?? 1); } }); return m; };
  const runs = (flags, min) => { const s = []; let a = -1; flags.forEach((f, i) => { if (f && a < 0) a = i; if (!f && a >= 0) { s.push([a, i - 1]); a = -1; } }); if (a >= 0) s.push([a, flags.length - 1]); return s.filter(([x, y]) => y - x + 1 >= min); };
  const frames = (sec) => Math.max(RULES.contactHold, Math.round(sec * fps));
  let found = 0;
  const list = (sps) => sps.map(when).join(", ");
  const reach = track((x) => `${x.who}|${x.by}|${x.with}|${x.part}`, (r) => (r.reach || []).filter((x) => !allowedReach(x, rows.indexOf(r))));
  // one line per hand or prop and character it reaches: the parts it goes into, all the times, the deepest
  const into = new Map(), touch = new Map();
  for (const { x, f, d } of reach.values()) {
    const by = x.by === "prop" ? "held prop" : x.by.startsWith("arm") ? `arm ${x.by.slice(3)}` : `hand ${x.by.slice(4)}`, k = `${x.who}|${by}|${x.with}`;
    const sps = x.part === "own body" ? runs(f, RULES.contactHold) : runs(d.map((v) => v > RULES.reachIn), RULES.contactHold);
    if (sps.length) {
      const e = into.get(k) || { x, by, parts: new Set(), f: new Array(n).fill(false), max: 0 };
      e.parts.add(x.part === "costume" ? "hood or costume" : x.part);
      for (const [p, q] of sps) for (let i = p; i <= q; i++) { e.f[i] = true; e.max = Math.max(e.max, d[i]); }
      into.set(k, e);
    } else if (x.part !== "own body") {
      const t = runs(f, frames(RULES.touchHold)); if (!t.length) continue;
      const e = touch.get(k) || { x, by, parts: new Set(), f: new Array(n).fill(false) };
      e.parts.add(x.part === "costume" ? "hood or costume" : x.part); for (const [p, q] of t) for (let i = p; i <= q; i++) e.f[i] = true;
      touch.set(k, e);
    }
  }
  for (const e of into.values()) {
    found++;
    if (e.x.with === e.x.who) out.push({ level: "fail", check: "limb-through-costume", msg: e.by.startsWith("arm") ? `${e.x.who}: ${e.by} passes through its own body at ${list(runs(e.f, 1))}, up to ${Math.round(e.max * 100)} cm in (it comes out of the chest, not the shoulder): bring the hand round on its own side, or turn the body so the shoulder faces the reach` : `${e.x.who}: ${e.by} sinks into its own body at ${list(runs(e.f, 1))}: keep the fist outside the body` });
    else {
      const inWin = runs(e.f, 1).some(([p]) => allowed(e.x.who, e.x.with, p, "reach"));
      out.push({ level: "fail", check: "character-overlap", msg: `${e.x.who}'s ${e.by} goes into ${e.x.with} (${[...e.parts].join(", ")}) at ${list(runs(e.f, 1))}, up to ${Math.round(e.max * 100)} cm: ${inWin ? `past the ${Math.round(RULES.allowReach * 100)} cm a contact window allows; ${e.by.startsWith("arm") ? "wrap the arm round the outside of the body (elbow out, the glove on the far side)" : "rest the glove on the surface"}` : "keep it clear, or add an allowClip window with a reason"}` });
    }
  }
  for (const [k, e] of touch) if (!into.has(k)) out.push({ level: "warn", check: "character-overlap", msg: `${e.x.who}'s ${e.by} touches ${e.x.with} (${[...e.parts].join(", ")}) at ${list(runs(e.f, 1))}: fine if the beat needs contact (allowClip with a reason), otherwise leave a gap` });
  const covers = track((x) => `${x.by}|${x.part}|${x.face}`, (r) => (r.covers || []).filter((x) => x.face && !allowed(x.by, x.face, rows.indexOf(r), "face-covered")));
  for (const { x, f } of covers.values()) {
    const who = x.by === x.face ? "its own" : `${x.face}'s`, by = x.part === "prop" ? "held prop" : `hand ${x.part.slice(4)}`, sps = runs(f, frames(RULES.faceCoverWarn));
    if (!sps.length) continue;
    const long = sps.filter(([p, q]) => (q - p + 1) / fps >= RULES.faceCoverFail), lvl = long.length ? "fail" : "warn"; if (long.length) found++;
    out.push({ level: lvl, check: "face-covered", msg: `${x.by}'s ${by} is in front of ${who} eyes at ${list(sps)}: move it off the face or change the camera, or add an allowClip window with a reason` });
  }
  // from "gate": 2 rays to the eyes ("hand") and to the middle, nose, mouth and cheeks ("low", 2 of 7 points) count another
  // character's arm or glove in front of a face too (stage.js hiddenFaces): the glove balls above miss an arm raised
  // across it (split the bill's first cut: Viking's pointing arm over the waiter's face)
  if (gateOf(sb) >= 2) {
    const arms = track((x) => `${x.hby}|${x.face}`, (r) => (r.faces || []).filter((x) => (x.hand >= RULES.faceHide || x.low >= 0.28) && x.hby && x.hby !== x.face && !allowed(x.hby, x.face, rows.indexOf(r), "face-covered")));
    for (const { x, f } of arms.values()) {
      const sps = runs(f, frames(RULES.faceCoverWarn)); if (!sps.length) continue;
      const long = sps.filter(([p, q]) => (q - p + 1) / fps >= RULES.faceCoverFail), lvl = long.length ? "fail" : "warn"; if (long.length) found++;
      out.push({ level: lvl, check: "face-covered", msg: `${x.hby}'s arm or glove is in front of ${x.face}'s face at ${list(sps)}: move it off the face or change the camera, or add an allowClip window with a reason` });
    }
  }
  const heads = track((x) => `${x.by}|${x.head}`, (r) => (r.covers || []).filter((x) => x.head));
  for (const { x, f } of heads.values()) { const sps = runs(f, frames(RULES.readHold)); if (sps.length) out.push({ level: "warn", check: "staging", msg: `${x.by}'s fist (holding the prop) sits over ${x.by === x.head ? "its own" : x.head + "'s"} head on screen at ${list(sps)}: it reads as stuck on the head; hold it out to the side` }); }
  // a face hidden by another character, a hat brim, wings or a prop (stage.js hiddenFaces) while that character acts: a
  // line, or the first second of a new expression. Hidden by RULES.faceHide or more for faceCoverFail s fails
  const acts = sb?.actions || [];
  const acting = (id, t) => actingAt(sb, id, storyAt(sb, t));
  // from "gate": 2 scenery and the set hide a face too (quality plan item 13 (b); stage.js hiddenFaces "scen")
  const g2 = gateOf(sb) >= 2, faceOf = (x) => (g2 && x.scen ? { ...x, hidden: x.hidden + x.scen, by: x.scen > x.hidden ? x.sby : x.by } : x);
  const hid = track((x) => `${x.face}|${x.by}`, (r) => (r.faces || []).map(faceOf).filter((x) => x.hidden >= RULES.faceHide && !allowed(x.by, x.face, rows.indexOf(r), "face-hidden")));
  for (const { x, f } of hid.values()) {
    const sps = runs(f.map((v, i) => v && acting(x.face, T(i))), frames(RULES.faceCoverWarn));
    if (!sps.length) continue;
    const by = x.by === x.face ? "its own hat or costume" : x.by;
    // standing behind someone (most of the body hidden too) is staging: the reaction just won't be seen
    const behind = sps.every(([p, q]) => rows.slice(p, q + 1).every((r) => (r.faces || []).some((y) => y.face === x.face && (y.body ?? 0) >= 0.5)));
    if (behind) { out.push({ level: "warn", check: "face-hidden", msg: `${x.face} acts (a line or a reaction) behind ${by} at ${list(sps)}: the face can't be seen; fine if it isn't their moment` }); continue; }
    const long = sps.filter(([p, q]) => (q - p + 1) / fps >= RULES.faceCoverFail), lvl = long.length ? "fail" : "warn"; if (long.length) found++;
    out.push({ level: lvl, check: "face-hidden", msg: `${x.face}'s eyes are hidden behind ${by} while acting (a line or a reaction) at ${list(sps)}: move one of them or the camera, or add an allowClip window with a reason` });
  }
  const sprout = track((x) => `${x.who}|${x.behind}`, (r) => r.sprout || []);
  for (const { x, f } of sprout.values()) { const sps = runs(f, frames(RULES.readHold)); if (sps.length) out.push({ level: "warn", check: "staging", msg: `${x.who}'s fist is hidden behind ${x.behind === x.who ? "its own body" : x.behind} at ${list(sps)} while the prop shows: it reads as growing out of the body` }); }
  if (!found) out.push({ level: "pass", check: "character-overlap", msg: "hands and held props stay out of the other characters and off the faces" });
  return out;
}

// qa/pace.py's measures of one clip (cuts, and per second: cuts, motion, held %, loudness), or null without python
function paceOf(clip) {
  const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "pace.py");
  for (const py of [process.env.PYTHON, "python3", "python"].filter(Boolean)) {
    const r = spawnSync(py, [script, clip, "--json"], { encoding: "utf8", maxBuffer: 64 << 20 });
    if (!r.error && r.status === 0) { try { return JSON.parse(r.stdout)[0]; } catch { return null; } }
  }
  return null;
}

export function checkClip(clip, { sb = null, layout = null, profile = null, flow = true } = {}) {
  const pname = profile || sb?.profile || "short", P = PROFILES[pname];
  if (!P) throw new Error(`unknown profile "${pname}" (known: ${Object.keys(PROFILES).join(", ")})`);
  const C = { ...CREATIVE, ...(P.creative || {}), ...(sb?.creative || {}) };
  // creative results are notes, never failures
  const res = [], add = (level, check, msg) => { const group = groupOf(check); res.push({ group, level: group === "creative" && level !== "pass" ? "note" : level, check, msg }); };
  if (!fs.existsSync(clip)) { add("fail", "file", `${clip} not found`); return res; }

  // --- container: size, duration, streams
  const probe = JSON.parse(run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", clip]).stdout || "{}");
  const v = (probe.streams || []).find((s) => s.codec_type === "video"), a = (probe.streams || []).find((s) => s.codec_type === "audio");
  if (!v) { add("fail", "video", "no video stream"); return res; }
  const [fw, fh] = [v.width, v.height], [rn, rd] = (v.r_frame_rate || "30/1").split("/").map(Number), fps = rn / (rd || 1);
  if (fw !== RULES.size[0] || fh !== RULES.size[1]) add("fail", "size", `${fw}x${fh}, expected ${RULES.size.join("x")}`);
  else add("pass", "size", `${fw}x${fh} @ ${fps.toFixed(2)} fps`);
  const dur = Number(probe.format?.duration ?? v.duration);
  if (sb?.duration != null) {
    const off = Math.abs(dur - sb.duration);
    add(off <= 1.5 / fps ? "pass" : "fail", "duration", `${dur.toFixed(3)} s, storyboard says ${sb.duration} s`);
  } else add("pass", "duration", `${dur.toFixed(3)} s (no storyboard to compare)`);

  // --- every frame, at low resolution: blank white or empty black frames
  const frames = lumaFrames(clip);
  const white = frames.filter((f) => f.YMIN >= RULES.whiteY), black = frames.filter((f) => f.YMAX <= RULES.blackY);
  const ts = (l) => l.slice(0, 6).map((f) => f.t.toFixed(2) + "s").join(", ") + (l.length > 6 ? ", ..." : "");
  if (white.length) add("fail", "white-frames", `${white.length} blank white frame(s) at ${ts(white)}`);
  if (black.length) add("fail", "black-frames", `${black.length} empty black frame(s) at ${ts(black)}`);
  if (!white.length && !black.length) add("pass", "frames", `${frames.length} frames, none blank`);

  // --- opening: frame 0 is a real picture and the picture changes at once (measures pixels, not whether the
  // premise is clear; that is for the review)
  if (frames.length) {
    const f0 = frames[0];
    if (f0.YMAX - f0.YMIN < 30 || f0.YMAX <= 40) add("note", "opening", `frame 0 is flat (Y ${f0.YMIN}-${f0.YMAX}), like a title card or fade-in`);
    else {
      const early = frames.filter((f) => f.t > 0 && f.t <= C.openingMotion + 1e-6).reduce((m, f) => Math.max(m, f.YDIF || 0), 0);
      add(early >= RULES.stillDiff ? "pass" : "note", "opening", early >= RULES.stillDiff ? `the picture changes from the first frame (dY ${early.toFixed(2)})` : `the picture barely changes in the first ${C.openingMotion} s`);
    }
    // long holds where the picture barely changes (fine when deliberate, such as a reaction hold)
    let run = 0, worst = 0, at = 0;
    for (const f of frames.slice(1)) { if ((f.YDIF || 0) < RULES.stillDiff) { run += 1 / fps; if (run > worst) { worst = run; at = f.t - run; } } else run = 0; }
    add(worst > C.stillHold ? "note" : "pass", "still-hold", `longest near-still stretch ${worst.toFixed(1)} s${worst > 1 ? " from " + at.toFixed(1) + " s" : ""}${worst > C.stillHold ? ` (house style: under ${C.stillHold} s)` : ""}`);
  }

  // --- pace of the opening (qa/pace.py): hard cuts in the first 2 s and how loud the first second is. On the 10
  // posted TikTok clips (render-measure-01 report, H5) more cuts in the first 2 s went with fewer viewers left at 0:02
  // (r -0.71: GATE 0 cuts kept 67 %, Chef 3 kept 42 %) and a quiet first second with fewer too (r +0.46 for its
  // loudness; Chef -31 dBFS). Ten clips is a lead for an A/B, not a rule, so these are notes.
  const pace = paceOf(clip);
  if (!pace) add("note", "pace", "qa/pace.py didn't run (needs python with numpy), so the opening's cuts and loudness weren't measured");
  else {
    const early = pace.cuts.filter((t) => t < 2), loud = pace.rows[0]?.db_p90;
    const many = early.length >= C.openingCuts, quiet = loud == null || loud < C.quietStart;
    add(many || quiet ? "note" : "pass", "pace", `${early.length} hard cut${early.length === 1 ? "" : "s"} in the first 2 s${early.length ? ` (${early.map((t) => t.toFixed(2)).join(", ")} s)` : ""}, first second ${loud != null ? `${loud.toFixed(1)} dBFS loud` : "without sound"}, ${pace.rows.slice(0, 2).map((r) => r.held.toFixed(0)).join("/")} % of frames held in seconds 0/1${many ? `; posted clips with ${C.openingCuts}+ early cuts held fewer viewers at 0:02 (keep the opening on one moving shot, A/B before cutting more)` : ""}${quiet ? `; the first second is quieter than ${C.quietStart} dBFS (start on full sound: a hit, a voice or the music)` : ""}`);
  }

  // --- frozen time (qa/pace.py): frames where nothing moves more than an idle breath, and the longest run of them.
  // The clips that held best on TikTok (4 Nov) sit at 3-17 % frozen with no still over 0.6 s. A deliberate hold (the
  // half second before a payoff, a hit-stop) is fine; the note says where to look.
  if (pace && pace.frozen != null) {
    const [ls, lat] = pace.longest_still || [0, null], long = ls >= C.longestStill, much = pace.frozen > C.frozenShare;
    add(long || much ? "note" : "pass", "frozen", `${pace.frozen.toFixed(0)} % of frames frozen, longest still ${ls.toFixed(2)} s${lat != null ? ` from ${lat.toFixed(2)} s` : ""}${long ? `; a still of ${C.longestStill} s or more reads as a paused video in the feed (keep an idle, a blink or a camera drift going, unless the pause is the joke)` : ""}${much ? `; over ${C.frozenShare} % of the clip doesn't move` : ""}`);
  }

  // --- clean picture: one-frame pops away from cuts and effects, strobing
  if (frames.length > 2) {
    const cuts = (sb?.shots || []).map((x) => x.at);
    // no exceptions for cuts, flashes or shakes: none of them makes a single odd frame when it works as it should
    const pops = oddFrames(clip, fps).filter((o) => o.score > RULES.oddFrame);
    add(pops.some((o) => o.score > RULES.oddFrameFail) ? "fail" : pops.length ? "warn" : "pass", "pops", pops.length ? `odd single frames at ${pops.slice(0, 6).map((o) => `${o.t.toFixed(2)}s (${o.score.toFixed(0)}, ${o.where})`).join(", ")}: something pops, flickers or strobes for one frame` : "no odd single frames");
    const { n: worstJ, at: atJ } = strobeOf(frames);
    add(worstJ > RULES.strobeMax ? "fail" : "pass", "strobe", worstJ > RULES.strobeMax ? `${worstJ} big brightness jumps within 1 s from ${atJ.toFixed(2)} s: strobing reads as a glitch` : `at most ${worstJ} big brightness jumps per second`);
    // optical flow (qa/flow.py via qa/glitches.mjs, item 15): a part that pops out and back, snaps while all around it is
    // calm, moves against its neighbours or flickers without moving; cuts, hit-stops, flashes and captions left out.
    // A warning to look at the frame, never a fail (about 12 s; --no-flow skips it)
    if (flow) {
      // (the error first: a run without OpenCV has no findings, and filtering them threw)
      const px = pixelGlitches(clip, { sb, layout }), w = (px.findings || []).filter((f) => f.level === "warn");
      if (px.error) add("pass", "pixels", `optical flow not measured (${px.error})`);
      else add(w.length ? "warn" : "pass", "pixels", w.length ? w.slice(0, 5).map(describePixel).join("; ") + (w.length > 5 ? ` (+${w.length - 5} more: node qa/glitches.mjs)` : "") : `optical flow: nothing pops, snaps or flickers (${px.findings.length} small notes: node qa/glitches.mjs --all)`);
    }
    if (sb?.shots && sb?.fx) for (const f of sb.fx.filter((x) => x.do === "flash"))
      for (const c of cuts) if (f.at - c > 0.001 && f.at - c <= 0.1) add("warn", "cut-flash", `flash at ${f.at}s starts just after the cut at ${c}s: the new shot shows a frame before the flash`);
  }

  // --- sound: present, not silent, loudness and true peak
  if (!a) add("fail", "audio", "no audio stream");
  else {
    const e = run("ffmpeg", ["-v", "info", "-nostats", "-i", clip, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr;
    const sum = e.slice(e.lastIndexOf("Summary:"));
    const I = Number((sum.match(/I:\s+(-?[\d.]+|-inf)/) || [])[1]), TP = Number((sum.match(/Peak:\s+(-?[\d.]+|-inf)/) || [])[1]);
    if (!Number.isFinite(I) || I < RULES.silentLUFS) add("fail", "audio", `audio is silent (${sum.match(/I:\s+\S+/)?.[0] ?? "no reading"})`);
    else {
      const ok = I >= RULES.lufs[0] && I <= RULES.lufs[1];
      add(ok ? "pass" : "fail", "loudness", `${I.toFixed(1)} LUFS (target ${RULES.lufs.join("..")})`);
      add(TP <= RULES.truePeakMax ? "pass" : "fail", "true-peak", `${TP.toFixed(1)} dBTP (max ${RULES.truePeakMax})`);
      // a stretch of silence inside the clip: a NaN gain in Never Has Money 04 (8 Nov) turned the effects and the music
      // silent from 4.0 s, and the whole-clip loudness above still passed. Momentary loudness (a 400 ms window, read
      // every 100 ms) under dropoutLUFS for dropoutHold s or more fails. The first 0.4 s (the window filling) and the
      // last 0.3 s (the fade) don't count
      const M = [...e.matchAll(/\bt:\s*([\d.]+)\s+TARGET:\S+\s+LUFS\s+M:\s*(\S+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
      const end = (M.length ? M[M.length - 1][0] : 0) - 0.3, runs = [];
      let run = null;
      for (const [t, m] of M) {
        if (t < 0.45 || t > end) continue;
        if (!(m >= RULES.dropoutLUFS)) { if (!run) run = { from: Math.max(0, t - 0.4), to: t, low: m }; run.to = t; if (!(m >= run.low)) run.low = m; }
        else if (run) { runs.push(run); run = null; }
      }
      if (run) runs.push(run);
      const gaps = runs.filter((r) => r.to - r.from + 1e-6 >= RULES.dropoutHold);
      if (gaps.length) add("fail", "audio-dropout", `the sound goes silent at ${gaps.map((r) => `${r.from.toFixed(1)}-${r.to.toFixed(1)} s`).join(", ")} (momentary loudness under ${RULES.dropoutLUFS} LUFS): look for a NaN or a muted bus in the mix (the render prints "sound:" lines), or a deliberate silence that needs a quiet bed under it`);
      else if (M.length) add("pass", "audio-dropout", `no silent stretch of ${RULES.dropoutHold} s or more inside the clip`);
    }
  }

  // --- loop seam: how alike the last and first frames are (similarity, not whether the replay makes sense)
  if (sb?.loop) {
    const r = run("ffmpeg", ["-v", "info", "-i", clip, "-sseof", "-0.04", "-i", clip, "-filter_complex", "[0:v]trim=end_frame=1,scale=270:480[a];[1:v]trim=end_frame=1,scale=270:480[b];[a][b]ssim", "-f", "null", "-"]).stderr;
    const ssim = Number((r.match(/All:([\d.]+)/) || [])[1]);
    if (Number.isFinite(ssim)) add(ssim >= C.loopSSIM ? "pass" : "note", "loop", `last frame vs first: similarity (SSIM) ${ssim.toFixed(2)} (house style: ${C.loopSSIM} or more)`);
    const sp = seamSpeed(clip);
    if (sp) {
      const typ = [...sp.end, ...sp.start].sort((x, y) => x - y)[2], e = sp.end.reduce((x, y) => x + y) / 3, b = sp.start.reduce((x, y) => x + y) / 3;
      const jump = sp.seam > Math.max(3 * typ, typ + 2), lurch = Math.max(e, b) > 3 * RULES.stillDiff && Math.max(e, b) > 3 * Math.min(e, b);
      add(jump || lurch ? "note" : "pass", "loop-seam", `picture across the seam: last frame to first changes ${sp.seam.toFixed(2)} (the frames either side move ${typ.toFixed(2)} a frame), speed ${e.toFixed(2)} at the end, ${b.toFixed(2)} at the start${jump ? ": the replay jumps, it reads as a skip" : lurch ? `: the picture ${e < b ? "starts moving" : "stops"} at the seam, the replay lurches` : ""}`);
    }
  }

  // --- storyboard: length (platform limits, then the house target), event gaps, reading speed, cartoon-only violence
  if (sb?.actions || sb?.shots) {
    const PL = P.length || {}, d = sb.duration, esc = (sb.beats || []).some((b) => b.kind === "escalation") || sb.escalation;
    if ((PL.min != null && d <= PL.min) || (PL.max != null && d > PL.max)) add("fail", "length-limit", `${d} s: the ${pname} profile needs ${PL.min != null ? "over " + PL.min + " s" : ""}${PL.min != null && PL.max != null ? " and " : ""}${PL.max != null ? "at most " + PL.max + " s" : ""} (${PL.why})`);
    else if (PL.warnUnder != null && d < PL.warnUnder) add("warn", "length-limit", `${d} s: close to the ${PL.min} s line of the ${pname} profile; aim for ${PL.warnUnder} s or more`);
    else add("pass", "length-limit", `${d} s fits the ${pname} profile`);
    const L = C.length;
    if (d > L[1] && !esc) add("note", "length", `${d} s: over the ${L.join("-")} s house target without an "escalation" beat`);
    else if (d < L[0] || d > L[1]) add("note", "length", `${d} s: outside the ${L.join("-")} s house target`);
    else add("pass", "length", `${d} s, inside the ${L.join("-")} s house target`);
    const ev = [0, d];
    for (const x of sb.shots || []) ev.push(x.at);
    for (const x of sb.actions || []) if (!["look", "blink", "noblink"].includes(x.do)) ev.push(x.at);
    for (const x of sb.fx || []) ev.push(x.at);
    for (const x of sb.captions || []) ev.push(x.from);
    for (const x of sb.sfx || []) ev.push(x.at);
    ev.sort((a, b) => a - b);
    let gap = 0, from = 0; for (let i = 1; i < ev.length; i++) if (ev[i] - ev[i - 1] > gap) { gap = ev[i] - ev[i - 1]; from = ev[i - 1]; }
    // counts event starts (sounds and captions included), not story information: a deliberate pause is fine
    add(gap > C.maxEventGap ? "note" : "pass", "event-gaps", `longest gap between event starts ${gap.toFixed(1)} s${gap > 1 ? " from " + from.toFixed(1) + " s" : ""} (house style: ${C.maxEventGap} s or less)`);
    for (const c of sb.captions || []) {
      const words = c.text.trim().split(/\s+/).length, wps = words / Math.max(0.1, c.to - c.from);
      if (wps > C.wordsPerSec) add("note", "reading-speed", `"${c.text.slice(0, 40)}": ${wps.toFixed(1)} words/s on screen (house style: ${C.wordsPerSec} or less)`);
    }
    // turns too fast for 30 fps strobe (the eye sees front, back, front); spins use a sine ease (top speed 1.6x average)
    for (const x of (sb.actions || []).filter((y) => y.do === "spin")) {
      const step = (360 * (x.turns ?? 1) * 1.6) / ((x.dur ?? 1) * fps);
      if (step > RULES.spinStep) add("warn", "spin-speed", `${x.who}'s spin at ${x.at}s turns up to ${step.toFixed(0)}° a frame (max ${RULES.spinStep}): give it more time or fewer turns`);
    }
    // tested without `who`: a cast id is a name, not an effect (the everyday friend "mash" matched \bmash: read minds, 12 Nov 2026)
    const bad = [...(sb.fx || []), ...(sb.actions || [])].filter(({ who, ...x }) => RULES.gore.test(JSON.stringify(x)));
    if (bad.length) add("fail", "cartoon-only", `graphic-looking effects (${bad.map((x) => x.do).join(", ")}): use stars, dust or squash instead (graphic violence isn't eligible for For You)`);
    else add("pass", "cartoon-only", "no graphic-looking effects");
  }

  // --- captions: inside the safe zone and the brief's band, not hidden behind characters
  if (layout) {
    // characters passing through props or each other (layout "clips", from the 3D engine)
    for (const r of clipResults(sb, layout)) add(r.level, r.check, r.msg);
    for (const r of contactResults(layout, sb)) add(r.level, r.check, r.msg);
    for (const r of captionResults(sb, layout)) add(r.level, r.check, r.msg);
  } else add("warn", "captions", "no layout file, caption placement not checked");
  return res;
}

// Captions judged from the layout alone (no pixels), so qa/preflight.mjs runs them before any render: all three
// Never Has Money 04 builds (8 Nov) lost a draft render and a check round to a subtitle over a face or outside the
// brief's band, which only the check on a rendered draft used to find.
//   caption-safe-zone  a caption leaves RULES.safe (the app's buttons and text cover it there): fail
//   caption-band       a subtitle (not a text pop or a card) leaves the storyboard's "captionBand": [top, bottom]
//                      (y px; Jonny's series briefs: [470, 1360]): fail. Without the field it isn't checked
//   caption-overlap    characters cover over coverFail of a caption for coverFailHold s: fail; over coverWarn: warn
//   caption-collide    a caption (not a text pop or a card) is still up when the next one comes in on top of it:
//                      their times are staggered (neither holds the other: a label with a tagline under it for
//                      its whole time is a layout, not a collision) and the smaller box is crossed by over a third
//                      of its height (a line box carries leading, so stacked lines touch by less): fail. Times
//                      come from the storyboard (exact, so 3 frames between two 0.1 s samples are found), boxes
//                      from the layout. Fight, Flight or Freeze 01 (11 Nov 2026): a shout's subtitle and the
//                      narrator's line stood on each other for 3 frames; every check passed and the full render
//                      had to be done twice
export function captionResults(sb, layout) {
  const out = [], add = (level, check, msg) => out.push({ level, check, msg });
  if (!layout?.samples?.length) return out;
  const { x0, y0, x1, y1 } = RULES.safe, outside = new Map(), held = new Map(), worst = new Map(), band = new Map();
  const B = Array.isArray(sb?.captionBand) && sb.captionBand.length === 2 ? sb.captionBand.map(Number) : null;
  const step = layout.samples.length > 1 ? layout.samples[1].t - layout.samples[0].t : 0.1;
  for (const s of layout.samples) {
    (s.captions || []).forEach((c, i) => {
      const box = Array.isArray(c) ? c : c.box, key = (c.text || `caption ${i + 1}`).slice(0, 40);
      const [x, y, w, h] = box;
      if (x < x0 || y < y0 || x + w > x1 || y + h > y1) if (!outside.has(key)) outside.set(key, s.t);
      if (c.pop || c.card) return;   // a text pop sits beside its character on purpose, a card or the HUD over the action
      // (12 px of slack: the box carries its padding, about 6 px above a line set at the band's top)
      if (B && (y < B[0] - 12 || y + h > B[1] + 12) && !band.has(key)) band.set(key, { t: s.t, top: y, bottom: y + h });
      let cov = c.covered;
      if (cov == null) { // fallback: share of the caption box inside any character box
        cov = 0;
        for (const ac of s.actors || []) {
          if (!ac.box) continue;
          const [ax, ay, aw, ah] = ac.box, ix = Math.max(0, Math.min(x + w, ax + aw) - Math.max(x, ax)), iy = Math.max(0, Math.min(y + h, ay + ah) - Math.max(y, ay));
          cov = Math.max(cov, (ix * iy) / (w * h));
        }
      }
      const wv = worst.get(key); if (!wv || cov > wv.cov) worst.set(key, { cov, t: s.t, fallback: c.covered == null });
      const hd = held.get(key) || { run: 0, max: 0, at: null };
      if (cov > RULES.coverFail) { hd.run += step; if (hd.run > hd.max) { hd.max = hd.run; hd.at = s.t; } } else hd.run = 0;
      held.set(key, hd);
    });
  }
  for (const [k, t] of outside) add("fail", "caption-safe-zone", `"${k}" leaves the safe zone at ${t.toFixed(2)}s: the app's buttons and text cover it there`);
  if (!outside.size && worst.size) add("pass", "caption-safe-zone", "every caption stays clear of the app's buttons and text");
  for (const [k, b] of band) add("fail", "caption-band", `"${k}" sits at y ${Math.round(b.top)}-${Math.round(b.bottom)} at ${b.t.toFixed(2)}s, outside the brief's subtitle band y ${B[0]}-${B[1]} ("captionBand"): move its pos (the caption's top y)`);
  if (B && !band.size && worst.size) add("pass", "caption-band", `every subtitle inside y ${B[0]}-${B[1]}`);
  for (const [k, w] of worst) {
    const hd = held.get(k), msg = `"${k}": up to ${(w.cov * 100).toFixed(0)}% hidden behind characters at ${w.t.toFixed(2)}s${w.fallback ? " (box estimate)" : ""}`;
    if (hd.max + 1e-6 >= RULES.coverFailHold) add(w.fallback ? "warn" : "fail", "caption-overlap", `${msg}, held ${hd.max.toFixed(1)}s`);
    else if (w.cov > RULES.coverWarn) add("warn", "caption-overlap", msg);
    else add("pass", "caption-overlap", msg);
  }
  const fps = sb?.fps || 30, caps = (sb?.captions || []).filter((c) => c && !c.pop && !c.card && c.text && c.to > c.from);
  const boxOf = (c) => {   // the caption's largest box while it is up: [x0, y0, x1, y1], or null when no sample caught it
    let b = null;
    for (const s of layout.samples) {
      if (s.t < c.from - 0.15 || s.t > c.to + 0.15) continue;
      for (const k of s.captions || []) {
        if (Array.isArray(k) || k.pop || k.card || k.text !== c.text) continue;
        const [x, y, w, h] = k.box;
        b = b ? [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x + w), Math.max(b[3], y + h)] : [x, y, x + w, y + h];
      }
    }
    return b;
  };
  const boxes = caps.map(boxOf);
  let collide = 0;
  for (let i = 0; i < caps.length; i++) for (let j = i + 1; j < caps.length; j++) {
    const a = caps[i], b = caps[j], t0 = Math.max(a.from, b.from), t1 = Math.min(a.to, b.to), A = boxes[i], Bx = boxes[j];
    if (t1 - t0 < 0.5 / fps || !A || !Bx) continue;
    if ((a.from - b.from) * (a.to - b.to) <= 1e-9) continue;   // one holds the other (or they start or end together): shown together on purpose
    const ix = Math.min(A[2], Bx[2]) - Math.max(A[0], Bx[0]), iy = Math.min(A[3], Bx[3]) - Math.max(A[1], Bx[1]);
    if (ix <= 8 || iy <= RULES.captionCross * Math.min(A[3] - A[1], Bx[3] - Bx[1])) continue;
    collide++;
    add("fail", "caption-collide", `"${a.text.slice(0, 40)}" and "${b.text.slice(0, 40)}" stand on each other at ${t0.toFixed(2)}-${t1.toFixed(2)}s (${Math.max(1, Math.round((t1 - t0) * fps))} frames): end the first where the second starts, or move one (pos)`);
  }
  if (!collide && caps.length > 1) add("pass", "caption-collide", "no two captions stand on each other");
  if (!worst.size) add("pass", "captions", "no captions");
  return out;
}

// everything the render gate judges from a layout (engine/render.mjs contactGate): contacts, grips, the drawn rig, the
// front of the frame and the required must-see items. A result whose check is in GATE.fails and level "fail" stops
// the render
export function gateResults(sb, lay, chars = null) {
  let seen = [];
  try { seen = visibility(sb, lay, chars || loadCharacters(sb)).results.filter((r) => r.check === "must-see"); } catch { /* no characters: nothing must be seen */ }
  return [...clipResults(sb, lay), ...contactResults(lay, sb), ...frontResults(sb, lay), ...seen];
}

// the storyboard's loop seam (qa/motion.mjs loopSeam) as one creative result
export function seamResult(seam) {
  const say = (x) => x.kind === "show" ? `${x.who} ${x.what} at the seam`
    : x.kind === "jump" ? `${x.who} ${x.what} jumps ${x.size.toFixed(2)} at the seam` : `${x.who} ${x.what} ${x.end < x.start ? "starts moving" : "stops dead"} at the seam (${Math.max(x.end, x.start).toFixed(3)} a frame)`;
  return { group: "creative", level: seam.length ? "note" : "pass", check: "loop-seam", msg: seam.length ? `storyboard across the seam: ${seam.slice(0, 5).map(say).join(", ")}${seam.length > 5 ? ", ..." : ""}: end the clip where and how it starts (the seam's row in qa/contact.mjs --cuts shows it)` : "storyboard across the seam: every actor and the camera carry on where they were, at the same speed" };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const o = args();
  const guess = o.clip.replace(/(-safe)?(-draft)?\.mp4$/, ".layout.json");
  const layoutFile = o.layout || (fs.existsSync(guess) ? guess : null);
  const layout = layoutFile ? JSON.parse(fs.readFileSync(layoutFile, "utf8")) : null;
  let sb = o.sb ? loadStoryboard(o.sb) : null;
  if (!sb && layout?.duration != null) sb = { duration: layout.duration };
  const res = checkClip(o.clip, { sb, layout, profile: o.profile, flow: o.flow });
  const profile = o.profile || sb?.profile || "short";
  // the storyboard's own motion, frame by frame (qa/motion.mjs): values that jump in one frame
  if (sb?.cast && sb?.actions) {
    if (!sb.music?.lock) sb.music = lockMusic(sb);   // the grid the render used (dance moves follow it)
    res.push(...(await motionResults(sb, sb.fps ?? 30)));
    for (const r of await storyNotes(sb, sb.fps ?? 30)) { const group = groupOf(r.check); res.push({ group, ...r, ...(group === "creative" && { level: "note" }) }); }
    if (sb.loop) res.push(seamResult(await loopSeam(sb, sb.fps ?? 30)));
    // what must be seen in each beat (qa/framing.mjs, from the layout) and the camera's moves (qa/camera.mjs)
    if (layout) res.push(...visibility(sb, layout, loadCharacters(sb)).results);
    res.push(...cameraLint(sb));
    // the sound (qa/sound.mjs): repeats, sounds with nothing on screen, the floor, the music lock, then on the file
    // its sync to the picture and how each effect stands over the bed
    res.push(...soundNotes(sb), ...(fs.existsSync(o.clip) ? soundMeasure(o.clip, sb, loadCharacters(sb)) : []));
    // --ears: earshot listens to the file too (about a minute; qa/ears.py)
    if (o.ears && fs.existsSync(o.clip)) res.push(...soundEars(o.clip, sb, loadCharacters(sb)));
  }
  const failed = res.some((r) => r.level === "fail"), notes = res.filter((r) => r.level === "note").length;
  if (o.json) console.log(JSON.stringify({ clip: o.clip, layout: layoutFile, profile, experiment: sb?.experiment ?? null, pass: !failed, results: res }, null, 2));
  else {
    console.log(`${path.basename(o.clip)}${layoutFile ? "  (layout: " + path.basename(layoutFile) + ")" : ""}`);
    if (sb?.experiment) console.log(`  experiment ${sb.experiment.id ?? "?"}, episode ${sb.experiment.episode ?? "?"}, variant ${sb.experiment.variant ?? "?"}, music seed ${seedOf(sb)}`);
    const head = { technical: "technical", publishing: `publishing (profile ${profile}: ${PROFILES[profile].name}, checked ${PROFILES[profile].checked})`, creative: "creative notes (house-style hypotheses, never a failure)" };
    for (const g of ["technical", "publishing", "creative"]) {
      const rs = res.filter((r) => (r.group ?? groupOf(r.check)) === g); if (!rs.length) continue;
      console.log(` ${head[g]}`);
      for (const r of rs) console.log(`  ${{ pass: "ok  ", warn: "WARN", fail: "FAIL", note: "note" }[r.level]}  ${r.check}: ${r.msg}`);
    }
    console.log(`${failed ? "FAIL" : "PASS"}${notes ? ` (${notes} creative note${notes > 1 ? "s" : ""})` : ""}`);
  }
  process.exit(failed ? 1 : 0);
}
