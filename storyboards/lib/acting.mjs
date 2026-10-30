// Acting loops: short performances that came out of finished clips, as functions on a clip builder (clip.mjs).
// Each takes the builder, a start time, who, and the eye targets of the shot (face look space: + right on screen,
// + up). They only add actions, so a clip can still add its own beats around them. Times are tuned from the clips
// they came from; pass options rather than copying the code when a clip needs a variant.
//
//   import { clip } from "./clip.mjs";  import * as act from "./acting.mjs";
//   act.blinksAt(c, "phx", [1.95, 5.2]);  act.idea(c, 0.25, "wiz", { at: [-0.75, -0.45] });
//   act.defeated(c, 9.7, "wiz", { hold: 1.4 });
//
// Add a loop here when the same group of actions shows up in a second clip (the first clip keeps working: the
// loop must give the same actions it used to write by hand).

import { EXPRESSIONS } from "../../engine/page/face.js";
import { r3 } from "./clip.mjs";

// no automatic blinks; blinks only where they don't land on a key beat
export function blinksAt(c, who, times, dur = 0.22) {
  c.A(0, who, "noblink");
  for (const t of times) c.A(t, who, "blink", { dur });
}

// the eyes lead a move: a look toward where the body is about to go, starting `lead` s (about 4 frames) before the walk,
// turn or reach at t (qa/motion.mjs eyes-lead). Add the move itself at t as usual.
export function eyesLead(c, t, who, to, { lead = 0.13, dur = 0.2 } = {}) {
  c.A(Math.max(0, t - lead), who, "look", { to, dur, blink: false });
}

// a phone held in both hands: the right thumb lifts and flicks once at each time (Still Scrolling)
export function scrollPhone(c, who, times) {
  for (const t of times) { c.A(t, who, "grip", { side: "R", shape: "scroll", dur: 0.1 }); c.A(t + 0.16, who, "grip", { side: "R", shape: "hold", dur: 0.12 }); }
}

// gets an idea: the eyes drop to `at`, one brow goes up, a sly smile; the body holds still while it lands
export function idea(c, t, who, { at, hold = 0.7 }) {
  c.A(t, who, "look", { to: at, dur: 0.3, blink: false });
  c.A(t + 0.25, who, "expr", { set: { raise: 0.05 }, dur: 0.15 });
  c.A(t + 0.25, who, "face", { brow: 0.3, dur: 0.2 });
  c.A(t + 0.35, who, "expr", { set: { smirk: 0.35, curve: 0.3 }, dur: 0.2 });
  c.A(t + 0.25, who, "still", { dur: hold, idle: 0.2 });
}

// checks someone's face: eyes up to `at`, a held beat, eyes back to `back`
export function checkOn(c, t, who, { at, back, hold = 0.6 }) {
  c.A(t, who, "look", { to: at, dur: 0.2, blink: false });
  c.A(t, who, "still", { dur: hold + 0.15, idle: 0.1 });
  c.A(t + hold, who, "look", { to: back, dur: 0.2, blink: false });
}

// a quiet shock: wide eyes, brows up, the mouth drops a little, and the body holds (`set` adds face numbers)
export function shock(c, t, who, { open = 0.25, eye = 1.25, curve = -0.05, brow = 0.45, hold = 1.0, dur = 0.15 } = {}) {
  if (strong(c)) { open = r3(open + 0.2); eye = r3(eye * 1.14); if (curve != null) curve = r3(curve * 1.5); hold += 0.2; dur = Math.max(dur, FACE_MIN); }
  c.A(t, who, "expr", { expr: "shocked", set: { open, eye, ...(curve != null && { curve }) }, dur });
  c.A(t, who, "face", { brow, dur });
  c.A(t, who, "still", { dur: hold, idle: 0.08 });
}

// a closed-eye grin at something (a notification), then the eyes go back to it
export function grin(c, t, who, { back = 0.93, lid = 0.42, rest = { curve: 0.4, eye: 0.95 } } = {}) {
  if (strong(c)) back += 0.2;
  c.A(t, who, "expr", { expr: "happy", set: { curve: strong(c) ? 0.72 : 0.6 }, dur: 0.25 });
  c.A(t, who, "face", { lid: 0.9, dur: 0.2 });
  c.A(t + 0.08, who, "squash", { amount: 0.025, dur: 0.25 });
  c.A(t + back, who, "face", { lid, dur: 0.3 });
  c.A(t + back, who, "expr", { expr: "kind", set: rest, dur: 0.35 });
}

// defeated: a sigh, a flat face, the shoulders drop, a turn to the camera and a long look into it (one slow blink
// near the end unless `blink: false`). `turn` is the yaw that faces the camera from where they stand.
export function defeated(c, t, who, { turn = -12, hold = 1.4, blink = true } = {}) {
  if (strong(c)) hold += 0.3;
  c.macro(t, who, "sigh");
  c.A(t + 0.05, who, "expr", { expr: "deadpan", set: { curve: -0.12 }, dur: 0.35 });
  c.A(t + 0.05, who, "face", { lid: 0.42, brow: -0.25, dur: 0.4 });
  c.arm(t + 0.1, who, "R", { o: [0.03, 0.2, 0.03] }, 0.5, "inOut");
  c.arm(t + 0.1, who, "L", { o: [0.03, 0.2, 0.03] }, 0.5, "inOut");
  c.A(t + 0.4, who, "turn", { to: turn, dur: 0.5 });
  c.A(t + 0.5, who, "look", { to: [0, 0], dur: 0.35, blink: false });
  c.A(t + 0.9, who, "still", { dur: hold, idle: 0.1, sink: 0.012 });
  if (blink) { c.A(t + 1.6, who, "face", { lid: 0.85, dur: 0.15 }); c.A(t + 1.78, who, "face", { lid: 0.42, dur: 0.15 }); }
}

// a loop tail: everyone named eases back to how they started (place, facing, face, eyes) by `end`, so the last
// frame runs into the first. `start` is the cast list; `look` the eye targets at frame 0 by id.
export function backToStart(c, t, end, start, look = {}) {
  const d = Math.max(0.3, end - t - 0.15);
  for (const m of start) {
    c.A(t, m.id, "move", { to: m.at, dur: d, ease: "inOut", steps: 1 });
    c.A(t, m.id, "turn", { to: m.face ?? "camera", dur: d });
    c.A(t, m.id, "expr", { expr: m.expr || "kind", dur: Math.min(0.4, d) });
    c.A(t, m.id, "face", { lid: 0, brow: 0, dur: Math.min(0.4, d) });
    if (look[m.id]) c.A(t + 0.1, m.id, "look", { to: look[m.id], dur: 0.3, blink: false });
  }
}

// Reactions play at full strength by default (Jonny, 29 Oct: the Wizard "should look a bit more angry and annoyed",
// and he asked for an "annoyed" word over Reaper). At phone size a medium face reads as no reaction; pass a lower
// `strength` only when the story wants a small one.

// a mood lands: brows first, then the mouth, a small squash, and the body holds while it reads. mood: "angry",
// "annoyed" or any expression in engine/page/face.js. `word` adds an emotion word over the head for the hold.
export function mood(c, t, who, mood, { strength = 1, hold = 0.8, brow, lid, word, squash = 0.02 } = {}) {
  const k = Math.max(0, Math.min(1, strength));
  // Jonny's eyebrow sheet (29 Oct): focus and anger come from an inward brow angle (the preset's tilt) and a lid squint,
  // never from pushing the brows down into the eyes. A brow tilt steeper than about -0.35 reads surprised on a face
  // with browShape.clear (the whole brow lifts until its inner end clears the eye); a lid past ~0.4 on top of the
  // presets' eye 0.74 eats the white. Faces without browShape.clear (all but lookdev/wizard-crisp so far) have no
  // guard against a brow in the eye: keep `brow` at 0 there and check the close-up.
  const BROW = { sad: 0.35, shocked: 0.45 }, LID = { angry: 0.38, annoyed: 0.38, stern: 0.3, focused: 0.3 };
  // strong faces (the lab's e-faces): a harder squint (annoyed 0.46) and a longer hold
  if (strong(c)) { lid = lid ?? (LID[mood] != null ? Math.min(0.46, LID[mood] + 0.08) : undefined); hold += 0.2; }
  c.A(t, who, "face", { brow: (brow ?? BROW[mood] ?? 0) * k, lid: (lid ?? LID[mood] ?? 0) * k, dur: 0.25 });
  c.A(t + 0.05, who, "expr", { expr: mood, dur: 0.25, ...(k < 1 && { set: scaled(mood, k) }) });
  if (squash) c.A(t + 0.05, who, "squash", { amount: squash * k, dur: 0.2 });
  c.A(t + 0.1, who, "still", { dur: hold, idle: 0.06 });
  if (word) emote(c, t + 0.1, who, word, { dur: Math.max(0.6, hold) });
}
// a weaker version of a preset: each number moved toward "kind" (the resting face) by 1 - k
function scaled(mood, k) {
  const m = EXPRESSIONS[mood], kind = EXPRESSIONS.kind; if (!m) return undefined;
  return Object.fromEntries(Object.entries(m).map(([key, v]) => [key, Math.round((kind[key] + (v - kind[key]) * k) * 1000) / 1000]));
}

// an emotion word over a head ("annoyed", "?!", "..."): small, in the character's caption colour, held while the
// reaction reads. One or two per clip, on a reaction a face alone might not carry at phone size.
export function emote(c, t, who, word, { dur = 1.0, size = 88, dx = 0.35, dy = -0.95, angle = -4 } = {}) {
  c.textPop(t, who, word, { dur, size, dx, dy, angle, color: "speaker" });
}

// arms pumping with the footfalls of a `run` (R: { t0, t1, rate } of the run, its rate keys [[t, steps a second], ...]
// from its start): forward and up, back and down, the other arm opposite, on the same phase the legs use; at the end
// both arms go back to rest (rest: false keeps them). From Don't Let Dragon Light the Pumpkin; Real Footage of Hell.
export function pump(c, who, R, { FWD = { o: [0.04, 0.5, 0.26] }, BACK = { o: [0.1, 0.28, -0.14] }, rest = true, until = R.t1 } = {}) {
  const RATE = R.rate;
  const phase = (T) => { let ph = 0; for (let i = 0; i < RATE.length && T > RATE[i][0]; i++) { const a = RATE[i], b = RATE[i + 1], u = Math.min(T, b ? b[0] : T) - a[0]; ph += u * a[1] + (b ? ((b[1] - a[1]) * u * u) / (2 * (b[0] - a[0])) : 0); } return ph; };
  let k = 0;
  for (let t = R.t0; t < until - 0.1; t += 0.02) {
    const ph = phase(t - R.t0);
    if (ph >= k * 0.5) {
      const dur = Math.max(0.12, Math.min(0.55, 0.5 / (RATE.find((r, i) => !RATE[i + 1] || RATE[i + 1][0] > t - R.t0)[1]) * 1.1));
      c.arm(t, who, k % 2 ? "R" : "L", FWD, dur, "inOut"); c.arm(t, who, k % 2 ? "L" : "R", BACK, dur, "inOut");
      k++;
    }
  }
  if (rest) { c.arm(R.t1 - 0.1, who, "R", "rest", 0.35); c.arm(R.t1 - 0.1, who, "L", "rest", 0.35); }
}

// ---------------------------------------------------------------- the quality lab picks (Jonny, 30 Oct 2026)
// Stronger faces: clip({ faces: "strong" }) pushes these loops to the extremes Jonny picked from the lab's e-faces
// (same face shapes, bigger numbers) and holds every reaction 0.2 s longer. Face changes still ease over 0.25 s or more
// and brows only move up or tilt (his eyebrow sheet), so a stronger face never pushes a brow into the eye.
const strong = (c) => c.faces === "strong";
const FACE_MIN = 0.25;

// the opener: a lead says a short line in the first half second, so the clip opens on a voice with the music. Gibberish
// by default (no subtitle: there are no words to read); words: true speaks it for real (the character's voice) and
// subtitles it at `pos`. A clip opts out by not calling it (the template's OPENER = false).
export function opener(c, who, line, { at = 0, dur = 0.45, tone = "excited", words = false, pos = 1180 } = {}) {
  c.A(at, who, "talk", { line, tone, dur, ...(!words && { voice: false }) });
  if (words) c.cap(at, at + Math.max(1.0, dur + 0.6), line, pos);
}

// comic force on a hit (the lab's d-comic-force): the victim's eyes go wide as it lands (eased in from just before),
// two frames of black-on-white impact, a short shake, stars round the head, a deep squash and a big recoil, then a
// three-frame hit-stop (the picture holds; c.hitStop) right after the impact frames. `sound` lands on the impact.
// t is the contact frame; the attacker's own anticipation is windUp(), the landing landDust().
export function impact(c, t, who, { frames = 2, stop = 3, shake = 0.035, stars = true, squash = 0.26, recoil = -11, look = [0, 0.35], sound = "thud-soft", gain = 0.6, take = true } = {}) {
  const f = 1 / c.fps, at = Math.round(t * c.fps) / c.fps;
  c.at(at, { fx: "impact", dur: r3((frames - 0.5) * f) });   // an effect shows through its end time: half a frame short draws exactly `frames`
  c.at(at, { fx: "shake", dur: 0.25, amp: shake });
  if (stars) c.at(at + 0.1, { fx: "sparkle", who, dur: 0.9, count: 5, color: "#fff2a8" });
  if (sound) c.sfx(at, sound, { gain });
  if (stop) c.hitStop(at + frames * f, stop);
  if (!take) return;
  const S = strong(c), hold = S ? 0.55 : 0.35;
  c.A(at - 0.15, who, "expr", { expr: "shocked", set: S ? { eye: 1.42, open: 0.72, curve: -0.75 } : { eye: 1.25, open: 0.5, curve: -0.5 }, dur: FACE_MIN });
  c.A(at, who, "still", { dur: hold + 0.35, idle: 0.5, fade: 0.05 });
  c.A(at + 0.02, who, "squash", { amount: squash, dur: 0.3 });
  c.A(at + 0.03, who, "pitch", { to: recoil, dur: 0.12, ease: "out" });
  c.A(at + 0.2, who, "pitch", { to: 0, dur: 0.3, ease: "settle" });
  c.A(at + 0.07, who, "look", { to: look, dur: 0.08, blink: false });
}

// anticipation before a big move: a deep crouch-squash (the lab's stronger force: 0.2 instead of 0.14)
export function windUp(c, t, who, { amount = 0.2, dur = 0.25 } = {}) {
  c.A(t, who, "squash", { amount, dur });
}

// a dust puff where a character lands (x, z on the floor): small and low, so it stays round the feet and off the face
export function landDust(c, t, at, { color = "#e9d8c0", puffs = 8 } = {}) {
  c.at(t, { fx: "poof", pos: [at[0], 0.02, at[1] + 0.15], dur: 0.45, color, puffs, sparks: 0, size: 0.4, lift: 0.06 });
}

// a sheepish grin at someone: a tilted half smile, brows up, wings or arms come down; strong faces push it further
export function sheepish(c, t, who, { brow } = {}) {
  const S = strong(c);
  c.A(t, who, "expr", { expr: "kind", set: S ? { tilt: 0.45, curve: 0.42, open: 0.16, eye: 1.08, smirk: 0.4 } : { tilt: 0.34, curve: 0.38, open: 0.12, eye: 1.02, smirk: 0.32 }, dur: 0.3 });
  c.A(t, who, "face", { brow: brow ?? (S ? 0.4 : 0.25), dur: 0.3 });
}

// how much longer a reaction holds with strong faces
export const holdOf = (c, hold) => (strong(c) ? hold + 0.2 : hold);
