// Pebble's acting library (thread "Build Pebble the tortoise in the engine", 5 Nov 2026): the six expressions of Jonny's
// master brief as named, reusable beats, so every Pebble clip plays the same character. Pebble's resting face (half
// lids, a small smile) lives in characters/pebble/pebble.json (face.final.rest); these move off it and back.
//
//   import * as peb from "./pebble-acting.mjs";
//   peb.calmSmile(c, t, "peb");                 // the default: he already knows everything will be fine
//   peb.contentBlink(c, t, "peb");              // a slow, happy eyes-closed beat (the sheet's CONTENT BLINK)
//   peb.amusedGlance(c, t, "peb", [0.6, 0]);    // eyes slide to one side, a lopsided smile (AMUSED GLANCE)
//   peb.surprisedOh(c, t, "peb");               // a small "oh": round mouth, eyes up a little (SURPRISED "OH"), never a panic
//   peb.gentleConcern(c, t, "peb");             // brows up in the middle, a soft mouth (someone else is having a bad day)
//   peb.thoughtful(c, t, "peb");                // a look up and aside, a hand to the chin
//
// His resting face (face.final.rest: half lids, a small smile) shows in full only on the plain "kind" expression and
// fades as a face moves away from it (potato.js restBias), so a calm beat goes back to plain "kind", never a tuned one.
// Pebble's rules (master brief): he moves at his own pace (slow moves, dur 0.35 s and up; eases, never snaps), he never
// panics or shouts, one short line per appearance (4-12 words), the eyes say more than the mouth.
import * as act from "../lib/acting.mjs";

export const SLOW = 0.4;   // his shortest face change
// his resting upper lids (the sheet's half-lidded eyes): a "face" lid sets the lid outright, so every calm beat comes back
// to this, never to 0 (0 opens the eyes wide; with his big round eyes a lid starts to show from about 0.6)
export const LID = 0.68;

export function calmSmile(c, t, who, { dur = SLOW } = {}) {
  c.A(t, who, "expr", { expr: "kind", dur });
  c.A(t, who, "face", { lid: LID, brow: 0, dur });
}

export function contentBlink(c, t, who, { hold = 0.55, dur = 0.3 } = {}) {
  c.A(t, who, "expr", { expr: "serene", set: { curve: 0.7 }, dur });
  c.A(t + 0.04, who, "squash", { amount: 0.012, dur: 0.4 });
  c.A(t + dur + hold, who, "expr", { expr: "kind", dur: SLOW });
}

export function amusedGlance(c, t, who, to = [0.6, 0], { hold = 0.8 } = {}) {
  act.eyesLead(c, t, who, to, { lead: 0.15, dur: 0.3 });
  c.A(t + 0.1, who, "expr", { expr: "smug", set: { smirk: 0.45, curve: 0.55, eye: 0.82 }, dur: SLOW });
  c.A(t + 0.3 + hold, who, "look", { to: [0, 0], dur: 0.35 });
  c.A(t + 0.35 + hold, who, "expr", { expr: "kind", dur: SLOW });
}

export function surprisedOh(c, t, who, { hold = 0.7, look = [0, 0.15] } = {}) {
  c.A(t, who, "expr", { expr: "shocked", set: { open: 0.38, eye: 1.15, curve: 0.0 }, dur: 0.18 });
  c.A(t, who, "face", { lid: 0.35, brow: 0.3, dur: 0.2 });
  c.A(t, who, "look", { to: look, dur: 0.18, blink: false });
  c.A(t, who, "squash", { amount: -0.02, dur: 0.25 });
  c.A(t + 0.2 + hold, who, "face", { lid: LID, brow: 0, dur: SLOW });
}

export function gentleConcern(c, t, who, { dur = SLOW } = {}) {
  c.A(t, who, "expr", { expr: "sad", set: { curve: 0.05, eye: 0.85, tilt: 0.35 }, dur });
}

export function thoughtful(c, t, who, { side = "R", hold = 0.9 } = {}) {
  act.eyesLead(c, t, who, [0.35, 0.4], { lead: 0.15, dur: 0.35 });
  act.thinkChin(c, t + 0.1, who, { side, hold, big: 0.7 });
}

// his own pose for "arms at rest": hanging easily in front of the hips (the generic rest hangs them out wide over his
// short torso, which reads as hands on hips)
export const REST = { R: { o: [-0.03, 0.12, 0.15] }, L: { o: [-0.03, 0.12, 0.15] } };
export function restArms(c, t, who, { dur = 0.45, sides = ["R", "L"] } = {}) { for (const side of sides) c.A(t, who, "arm", { side, pose: REST[side], dur }); }

// one line in his calm voice (subtitled by the clip's lines setting), the half lids held while he talks: the mouth's
// open shape would otherwise fade his resting face (face.final.rest) out the way a big reaction does
export function line(c, t, who, text, dur, { lid = LID, ...o } = {}) {
  c.A(t - 0.1, who, "face", { lid, dur: 0.3 });
  c.say(t, who, text, dur, "calm", o);
  c.A(t + dur + 0.1, who, "face", { lid: LID, dur: 0.4 });
}
