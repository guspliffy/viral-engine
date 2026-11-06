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
export const LID = 0.8;

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
// (correction brief 6 Nov: wrists beside the lower vest, a little forward, elbows close to the sides, not bowed out)
export const REST = { R: { o: [0.1, 0.2, 0.09], elbow: 0.0, margin: 1.05, swing: 1 }, L: { o: [0.1, 0.2, 0.09], elbow: 0.0, margin: 1.05, swing: 1 } };
export function restArms(c, t, who, { dur = 0.45, sides = ["R", "L"] } = {}) { for (const side of sides) c.A(t, who, "arm", { side, pose: REST[side], dur }); }

// the grass straw (Garden Guardian pack, 6 Nov 2026): in his lips at the LEFT mouth corner by default. Before a sip or a
// longer line his LEFT hand takes it out (up to the corner, a pinch, out and down: one continuous move, the "straw"
// action blends lips -> hand), and puts it back the same way. strawHeld: already in the hand at t (frame 0 of a scene).
export const STRAW_MOUTH = { x: [0.15, 1.22, 0.36] }, STRAW_LOW = { x: [0.3, 0.55, 0.3] };
export function strawOut(c, t, who, { low = STRAW_LOW } = {}) {
  c.A(t, who, "arm", { side: "L", pose: STRAW_MOUTH, dur: 0.6 });
  c.A(t + 0.45, who, "grip", { side: "L", shape: "pinch", dur: 0.2 });
  c.A(t + 0.65, who, "straw", { side: "L", hand: 1, dur: 0.35 });
  c.A(t + 0.75, who, "arm", { side: "L", pose: low, dur: 0.6 });
  return t + 1.35;
}
export function strawIn(c, t, who) {
  c.A(t, who, "arm", { side: "L", pose: STRAW_MOUTH, dur: 0.6 });
  c.A(t + 0.6, who, "straw", { side: "L", hand: 0, dur: 0.3 });
  c.A(t + 0.9, who, "grip", { side: "L", shape: "open", dur: 0.2 });
  c.A(t + 1.0, who, "arm", { side: "L", pose: REST.L, dur: 0.6 });
  return t + 1.6;
}
export function strawHeld(c, t, who, pose = STRAW_LOW) {
  c.A(t, who, "arm", { side: "L", pose, dur: 0 });
  c.A(t, who, "grip", { side: "L", shape: "pinch", dur: 0 });
  c.A(t, who, "straw", { side: "L", hand: 1, dur: 0 });
}

// his walk (Jonny 6 Nov: "a fluent natural walk like the most recent potatoes"): the planted gait ("motion": { "feet": 2 })
// with his arms hanging close at his sides and swinging against the legs (an arm pose with `swing`, potato.js), short
// unhurried steps, and the hands back to rest a moment after he stops. A tortoise pace: about 0.5 m/s.
export const WALK = { R: { o: [-0.01, 0.1, 0.05], swing: 1 }, L: { o: [-0.01, 0.1, 0.05], swing: 1 } };
export function walk(c, t, who, to, dur, { steps = 2.2, rest = true, arms = 0.35 } = {}) {
  for (const side of ["R", "L"]) c.A(Math.max(0, t - arms * 0.5), who, "arm", { side, pose: WALK[side], dur: t > 0 ? arms : 0 });
  c.A(t, who, "move", { to, dur, steps });
  if (rest) restArms(c, t + dur + 0.15, who, { dur: 0.5 });
}

// one line in his own calm voice (Kokoro, voices.json "pebble"; never gibberish, Jonny 6 Nov), with its caption in the
// sky above his cap (pos), the half lids held while he talks: the mouth's open shape would otherwise fade his resting
// face (face.final.rest) out the way a big reaction does. The say macro speaks real words for a character with "tts";
// the clip builder's c.say is the gibberish-and-subtitle line of the potato clips, so it is not used here.
export function line(c, t, who, text, dur, { lid = LID, pos = 230, voice, ...o } = {}) {
  c.A(t - 0.1, who, "face", { lid, dur: 0.3 });
  c.macro(t, who, "say", { line: text, tone: "calm", pos, ...(voice && { voice }), ...o });
  c.A(t - 0.15, who, "still", { dur: dur + 0.3, idle: 0.85 });   // no automatic blink on his line (a still hold skips them)
  c.A(t + dur + 0.1, who, "face", { lid: LID, dur: 0.4 });
}
