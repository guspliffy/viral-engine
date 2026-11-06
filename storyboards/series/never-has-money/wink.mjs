// THE WINK (never has money, every episode 8.80-10.00 on the video's clock): Gunslinger tips his hat with two fingers,
// winks and says "Next time's on me!" (gibberish, subtitled). The moth lifts off the brim as the hat tips, flutters
// once and settles back. One friend reacts (the episode passes it in: Reaper's left eye twitches, or the Wizard
// facepalms). Hard cut at 10.00, no outro. 00-SERIES-FORMAT.md.
// t: when it starts on the story's clock (8.8 minus the hit-stops before it); brimTouch: the arm pose of the two
// fingers on the brim (body frame); brim: the moth's seat. until (story clock): the clip's end: the fingers stay on the
// brim and he winks again into the cut, so the last frame is the payoff, not a "done" pose.
import { r3 } from "../../lib/clip.mjs";
import { BRIM } from "./pocket-pat.mjs";

export function wink(c, { who = "gsl", t, until, line = "next time's on me!", sub = "Next time's on me!", side = "R", brim = BRIM, brimTouch = { o: [0.24, 0.95, 0.1] }, look = [0.05, 0.05], pos, react }) {
  const { A, sfx } = c;
  // eyes to camera first, then the hand comes up to the brim (two fingers) and tips it
  A(t, who, "look", { to: look, dur: 0.1, blink: false });
  A(t, who, "expr", { expr: "cocky", set: { curve: 0.8, open: 0.35, smirk: 0.5 }, dur: 0.15 });
  A(r3(t + 0.04), who, "grip", { side, shape: "point", set: { curl: 1.0, index: 0.0, thumb: 0.9 }, dur: 0.08 });
  c.arm(r3(t + 0.02), who, side, brimTouch, 0.18, "out");
  // the wink (his left eye: lidL is the character's own left)
  A(r3(t + 0.24), who, "face", { lidL: 1, dur: 0.06 });
  A(r3(t + 0.62), who, "face", { lidL: 0, dur: 0.08 });
  c.say(r3(t + 0.2), who, line, 0.75, "excited", { voice: false, sub, ...(pos && { pos }) });
  // the moth lifts as the hat tips, flutters once and settles back on the brim
  const M = (tt, p, set = {}, dur = 0.1, ease = "inOut") => c.prop(tt, "moth", { x: p[0], y: p[1], z: p[2], ...set }, dur, ease);
  c.prop(r3(t + 0.2), "moth", { open: 1, flap: 1 }, 0.05, "out");
  M(r3(t + 0.22), [brim[0] + 0.04, brim[1] + 0.12, brim[2] + 0.04], { bank: 15 }, 0.12, "out");
  M(r3(t + 0.42), [brim[0] - 0.02, brim[1] + 0.08, brim[2] + 0.08], { bank: -10 }, 0.14);
  M(r3(t + 0.6), brim, { bank: 0 }, 0.12, "inOut");
  c.prop(r3(t + 0.72), "moth", { open: 0, flap: 0 }, 0.12, "inOut");
  sfx(r3(t + 0.2), "wings", { gain: 0.1, dur: 0.45, reason: "the moth lifting off the brim as he tips his hat" });
  // the hand comes back down after the line
  if (until != null) A(r3(until - 0.32), who, "face", { lidL: 1, dur: 0.06 });
  else { c.arm(r3(t + 0.7), who, side, "rest", 0.3, "inOut"); A(r3(t + 0.72), who, "grip", { side, shape: "relaxed", dur: 0.2 }); }
  if (react) react(r3(t + 0.3));
  return r3(t + 1.2);
}
