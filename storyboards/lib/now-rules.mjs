// nowRules(sb): today's template settings for a re-cut of an older clip (the v3 openings, 7 Nov 2026).
// Jonny 7 Nov, on the shark re-cut: "the shark video isnt created by the new motion rules". An older generator keeps
// its own story and staging and only takes the template's motion and picture flags (storyboards/templates/
// clip-template.mjs): planted feet, follow-through, timing and the contact solver, hand/eye/hold rigs, physics, instant
// frame-0 poses, light 2 with half boil and no paper grain, and the sound spike guard.
// Use it behind a flag so the posted storyboard stays byte-identical:
//   import { clip, write as writeSb } from "../../lib/clip.mjs";  import { nowRules } from "../../lib/now-rules.mjs";
//   const write = (u, sb) => writeSb(u, V3 ? nowRules(sb) : sb);
export const NOW_MOTION = { feet: 2, overlap: true, timing: true, solve: true };
export const NOW_RIG = { hand: 2, eyes: 2, hold: 2 };

export function nowRules(sb, { lighting = 2 } = {}) {
  const out = { ...sb, motion: NOW_MOTION, rig: { ...NOW_RIG, ...(sb.rig || {}) }, physics: true, cleanStart: true };
  out.set = { ...(sb.set || {}), ...(lighting && { lighting }), hatch: { boil: 0.25 } };
  if (sb.drawn) out.drawn = { ...sb.drawn, paper: { ...(sb.drawn.paper || {}), grain: 0 } };
  out.sound = { ...(sb.sound || {}), guard: true };
  return out;
}
