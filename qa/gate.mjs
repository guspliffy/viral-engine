// The render gate's rules (quality plan item 3, 5 Nov 2026), shared by qa/check.mjs, qa/rig.mjs, qa/framing.mjs and
// qa/preflight.mjs: which checks block a render, which glitches are visible at full speed, the new limits, and how a
// contact window ("allowClip") is read (on the story's clock, waiving only what it names).
import { storyTime, renderTime } from "../engine/shared/holds.js";

// Visible glitches block the render (quality plan item 3, 5 Nov 2026). A storyboard opts into the new fails with
// "gate": 2 (the template turns it on once Jonny approves); at gate 1 (today's default) they warn. A fail whose root fix
// isn't merged yet stays a warning until the storyboard turns that fix on (hands: "rig": { "hand": 2 }, plan item 2;
// feet: "motion": { "feet": 2 }, item 10; holds: "rig": { "hold": 2 }, item 7). Each can be waived for the rare beat
// that needs it by an allowClip window that names it ("checks": ["hand-turn"]) and says why ("reason").
export const GATE = {
  // the checks render.mjs refuses to render on (engine/render.mjs contactGate), and qa/preflight.mjs's verdict
  fails: ["character-overlap", "grip", "limb-through-costume", "hand-in-prop", "arm-in-prop", "costume-in-prop", "limb-in-surface", "thin-prop-hidden", "face-covered", "face-hidden", "rig-jump",
    "frame0-jump", "hand-turn", "foot-slide", "prop-pop", "lean-jump", "must-see", "front", "prop-support", "hold-owner", "palm-turn", "payoff-face", "shell", "prop-in-prop", "grip-gap"],
  // visible at full speed: a delivery may carry none of these as a warning (each needs a fix or a named window)
  visible: ["rig-jump", "air-walk", "frame0-jump", "hand-turn", "foot-slide", "stance-slide", "prop-pop", "grip-gap", "lean-jump", "eyes-readable", "motion", "prop-support", "palm-turn", "payoff-face"],
  handTurn: 90,        // degrees in one frame, on screen and not smeared by motion blur (fails)
  blurPx: 144,         // px a frame: from here a move is smeared (engine/render.mjs BLUR, Jonny 4 Nov), which hides a turn
  handTravel: 0.10,    // metres a hand may travel against its body per frame of its move, on screen (qa/hands.mjs; workflow.md "Hands")
  palmTurn: 60,        // degrees: a hand turn this big ...
  palmFrames: 6,       // ... is drawn over at least this many frames, on screen (qa/hands.mjs)
  payoffFacing: 45,    // degrees off camera a payoff face may turn to while on screen (qa/framing.mjs payoffFaces; 3/4 view)
  footSlide: 0.05,     // metres in one frame, a foot on the floor without a step (fails)
  stanceSlide: 0.02,   // metres a standing foot slides during one stance of a step (warns until item 10)
  propSlip: 0.03,      // metres a held prop slips in the hand in one frame (fails once item 7 is in)
  gripGap: 0.01,       // metres between a held prop and the glove on a held frame, for gripGapHold s (warns)
  gripGapHold: 0.2,
  gripGapFail: 0.06,   // ... and over this many metres it fails at any gate (bear camp drafts 1-2: the pot off the glove)
  frame0: 0.05,        // metres a hand, arm, foot, body or held prop moves between frame 0 and frame 1 (fails)
  front: 0.15,         // share of the acting subject's silhouette a nearer actor or prop covers, for frontHold s (fails)
  frontHold: 0.3,
  frontFail: 0.6,      // ... and it fails over this share of its outline, or with its eyes hidden by it (frontEyes of the
  frontEyes: 0.35,     // eye points), for frontHold s. Under that it is a note: the plan's 15 % flagged staging Jonny
                       // approved (the tent's Phoenix behind Reaper's hood 32 %, the bill's waiter behind the row 53 %)
  nearer: 1.5,         // m: a bystander this much nearer the camera than every subject ...
  bigger: 2,                       // ... and this many times bigger on screen than the largest, over GATE.front of their boxes
  lead: 0.75,                      // a cast member on this share of the must-see entries leads the clip: never a bystander
  waiverBudget: 10,                // check windows in frame: over this, a 15 fps strip of each before a full render (qa/waivers.mjs;
                                   // Never Has Money 04: the clean-hands cut had 7, the two others 30 and 31. A first number: set it
                                   // from the counts of the next five clips beside Jonny's notes)
};
export const gateOf = (sb) => Number(sb?.gate ?? 1);
// is the root fix of a glitch class turned on in this storyboard (so its check may fail)?
export function rootFixed(sb, root) {
  if (root === "hands") return Number(sb?.rig?.hand) >= 2;
  if (root === "feet") return typeof sb?.motion === "object" && Number(sb.motion?.feet ?? sb.motion?.gait) >= 2;
  if (root === "holds") return Number(sb?.rig?.hold) >= 2;
  return true;
}
// the level of a new visible-glitch finding: fail at gate 2 once its root fix is on, else warn
export const gateLevel = (sb, root = null) => (gateOf(sb) >= 2 && (!root || rootFixed(sb, root)) ? "fail" : "warn");

// Contact windows ("allowClip") are written on the story's clock, a layout row's time is the video's: a hit-stop holds
// the story back, so a window read on the video's clock after one waived the wrong frames (8 of 10 clips of 4-5 Nov,
// 0.1-0.2 s early). Every window and "acting" test reads story time.
export const storyAt = (sb, t) => storyTime(sb?.holds, t);
// which checks a window waives: the ones its "checks" list names (a check's name or its kind), else the contact kinds a
// window always waived (body, reach, prop, face). The visible-glitch checks of GATE are waived only by name, so an old
// hug window doesn't hide a hand that flips inside it, and so is "shell" (a tent's cloth through a head), so an "inside
// the tent" window doesn't hide the roof going through one (bear camp draft 1, 12 Nov 2026).
const KIND = { "character-overlap": "body", clipping: "prop", reach: "reach", "limb-through-costume": "reach", "hand-in-prop": "prop", "arm-in-prop": "prop", "costume-in-prop": "prop", "limb-in-surface": "prop", "thin-prop-hidden": "prop", "face-covered": "face", "face-hidden": "face", "prop-in-prop": "prop" };
export const OLD_KINDS = ["body", "reach", "prop", "face"];
export function waives(w, check) {
  if (!w?.reason) return false;
  const k = KIND[check] || check;
  return Array.isArray(w.checks) ? w.checks.some((c) => c === check || c === k) : OLD_KINDS.includes(k);
}
// the allowClip window that waives `check` for who (and, when given, with) at video time t, or undefined
// A window is read on the story clock from "gate": 2 (a hit-stop before it no longer shifts it); older storyboards keep
// the video clock their windows were written against (the tent's leaf window, 8.4-8.7 s, sits after two hit-stops)
export function windowFor(sb, check, who, t, withId = null) {
  return windowAt(sb, check, who, gateOf(sb) >= 2 ? storyAt(sb, t) : t, withId);
}
// the same for a time already on the story clock (qa/motion.mjs works on story time). Below gate 2 the windows are on
// the video clock, so the story time moves past the hit-stops before it first (a 0.7 s freeze at 1.4 s put every
// motion window after it 0.7 s off: coffee run v3, 7 Nov)
export function windowAtStory(sb, check, who, s, withId = null) {
  return windowAt(sb, check, who, gateOf(sb) >= 2 ? s : renderTime(sb?.holds, s), withId);
}
// the window at time t on the windows' own clock
function windowAt(sb, check, who, t, withId) {
  return (sb?.allowClip || []).find((w) => waives(w, check) && (w.who === who || (withId != null && w.who === withId)) && (!w.with || w.with === withId || w.with === who) && t >= w.from - 1e-6 && t <= w.to + 1e-6);
}

// who acts at story time s: a line (talk, say) or the first second of a new expression. Shared with qa/framing.mjs (the
// subject who owns the front of the frame)
export function actingAt(sb, id, s) {
  return (sb?.actions || []).some((a) => a.who === id && (((a.do === "talk" || a.do === "say") && s >= a.at - 0.1 && s <= a.at + (a.dur ?? 1)) || (a.do === "expr" && s >= a.at && s <= a.at + 1)));
}

