// THE FRIEND WHO CAN'T HEAR (Test 2: quiet relatable gags, 30 Oct 2026), built from the clip template.
// node storyboards/quiet/make-the-friend-who-cant-hear.mjs -> storyboards/quiet/the-friend-who-cant-hear.json
//
// THE BRIEF (two-week-test-plan.md, Test 2: one lead, one shot with at most a slow push, a plain strong-colour
// backdrop, one line on screen, a gibberish voice or sound as the joke, no hand contact with small props, 8-12 s)
//   Joke:        a POV: you talk to the Wizard and he can't hear a thing, however loud you get; then you whisper
//                "free pizza" and he hears it at once.
//   Wants:       you want him to hear you (off screen, behind the camera, in gibberish).
//   Consequence: each "Huh?" pulls him closer to the lens; the last shout blows his hat off and he still says "Huh?".
//   Ending:      the whisper: he snaps up, "Where?!", and his hat lands back on his head (he only hears what he wants).
//
//   0.00 the friend is already talking; the Wizard leans in, a hand cupped beside his head      (gibberish)
//   1.35 "Huh?"                                                                                   (Wizard B voice)
//   2.00 louder; he leans further, squinting; "Huh?"
//   3.75 the shout: the camera shakes, the hat flies off behind him, his face squashed in the blast
//   5.15 eyes open, deadpan: "...Huh?"
//   6.00 a beat of quiet, then the whisper "free pizza"                                         (Reaper A, whisper)
//   6.70 payoff: eyes wide, a hop, "Where?!"; 7.7 the hat drops back onto his head
//
// One shot: a medium close-up from the friend's eye line with a slow push over the whole clip. Plain warm yellow
// backdrop. The friend is a hidden cast member behind the camera, so his voice comes from the front.
import { clip, write, frame } from "../lib/clip.mjs";

const c = clip(), { A, sfx, cap } = c;
const END = 8.9;

const WIZ = [0, 0], FRIEND = [0.15, 6.5];
const AT_YOU = [0.02, 0.02];   // eye target: into the lens
const EAR = { x: [-0.47, 0.6, 0.12], palm: [-0.3, 0.62, 1.2] };   // his right hand cupped beside his face, palm to you

const cast = [
  { id: "wiz", character: "lookdev/wizard-crisp", at: WIZ, face: "camera", expr: "kind", follow: 0.2, seed: 2.6, signature: false,
    arms: { R: EAR }, grip: { R: "cup" } },
  { id: "you", character: "lookdev/reaper-crisp", at: FRIEND, face: 180, expr: "kind", seed: 4.1, signature: false },
];
const props = [];

// the friend: hidden behind the camera, only a voice. Gibberish lines get louder (gain) and higher (excited).
A(0, "you", "hide");
A(0, "you", "noblink");
const talk = (t, line, dur, gain, tone = "calm") => A(t, "you", "talk", { line, dur, tone, gain });
talk(0, "so are you coming tonight or not", 1.25, 0.9);
talk(2.0, "ARE YOU COMING TONIGHT", 1.2, 1.5, "excited");
talk(3.75, "ARE. YOU. COMING", 1.0, 2.4, "excited");
c.macro(6.0, "you", "say", { line: "Free pizza.", tone: "whisper", caption: false, gain: 0.8 });

// ---------------------------------------------------------------- the Wizard
A(0, "wiz", "noblink");
A(0, "wiz", "look", { to: AT_YOU, dur: 0, blink: false });
A(0, "wiz", "expr", { expr: "kind", set: { eye: 0.9, curve: -0.2, tilt: 0.25 }, dur: 0 });
A(0, "wiz", "face", { lid: 0.25, dur: 0 });
A(0, "wiz", "pitch", { to: 4, dur: 0 });
// 1 the first "Huh?": he tips his head toward you
A(0.3, "wiz", "pitch", { to: 9, dur: 0.6, ease: "inOut" });
A(0.35, "wiz", "move", { to: [0, 0.35], dur: 0.5, ease: "inOut", steps: 2 });
A(0.3, "wiz", "lean", { to: -10, dur: 0.6, ease: "inOut" });
A(0.9, "wiz", "expr", { expr: "kind", set: { eye: 0.85, curve: -0.25, tilt: 0.3, open: 0.05 }, dur: 0.25 });
c.macro(1.35, "wiz", "say", { line: "Huh?", tone: "question", voice: "wizard", caption: false });
// 2 louder: he leans further, squinting
A(2.1, "wiz", "pitch", { to: 15, dur: 0.6, ease: "inOut" });
A(2.15, "wiz", "move", { to: [0, 0.7], dur: 0.5, ease: "inOut", steps: 2 });
A(2.1, "wiz", "lean", { to: -12, dur: 0.6, ease: "inOut" });
A(2.2, "wiz", "face", { lid: 0.3, dur: 0.3 });
A(2.2, "wiz", "expr", { expr: "kind", set: { eye: 0.8, curve: -0.25, tilt: 0.35, open: 0.08 }, dur: 0.3 });
c.macro(3.25, "wiz", "say", { line: "Huh?", tone: "question", voice: "wizard", caption: false, seed: 2 });
// 3 the shout: blasted back, eyes squeezed, the hat flies off behind him
const SHOUT = 3.75;
A(SHOUT, "wiz", "pitch", { to: -10, dur: 0.18, ease: "out" });
A(SHOUT, "wiz", "lean", { to: 0, dur: 0.18, ease: "out" });
A(SHOUT, "wiz", "face", { lid: 0.95, dur: 0.08 });
A(SHOUT, "wiz", "expr", { expr: "shocked", set: { eye: 0.3, open: 0.15, curve: -0.4 }, dur: 0.08 });
A(SHOUT, "wiz", "squash", { amount: 0.1, dur: 0.3 });
A(SHOUT, "wiz", "move", { to: [0, 0.3], dur: 0.25, ease: "out", steps: 1 });
A(SHOUT + 0.02, "wiz", "hat", { off: [1.9, 1.1, -0.6], spin: [-40, 60, -70], dur: 0.55, ease: "linear" });   // blown off to screen right
A(SHOUT + 0.6, "wiz", "hat", { on: false, dur: 0 });
A(SHOUT + 0.3, "wiz", "still", { dur: 0.8, idle: 0.05 });
// he straightens, eyes open: "...Huh?"
A(4.8, "wiz", "pitch", { to: 6, dur: 0.4, ease: "inOut" });
A(4.85, "wiz", "face", { lid: 0.35, dur: 0.3 });
A(4.85, "wiz", "expr", { expr: "deadpan", set: { curve: -0.05 }, dur: 0.3 });
c.macro(5.2, "wiz", "say", { line: "Huh?", tone: "question", voice: "wizard", caption: false, seed: 3 });
A(5.6, "wiz", "still", { dur: 0.4, idle: 0.08 });
// the whisper: the smallest tell that something got through
A(6.0, "wiz", "face", { brow: 0.15, dur: 0.25 });
A(6.0, "wiz", "lean", { to: -3, dur: 0.25, ease: "inOut" });
// 4 the whisper lands: payoff
const PAY = 6.7;
A(PAY, "wiz", "face", { lid: 0, brow: 0.4, dur: 0.1 });
A(PAY, "wiz", "expr", { expr: "delighted", set: { eye: 1.25, open: 0.45 }, dur: 0.1 });
A(PAY, "wiz", "pitch", { to: -2, dur: 0.15, ease: "out" });
A(PAY + 0.02, "wiz", "hop", { dur: 0.32 });
c.arm(PAY, "wiz", "R", { x: [-0.5, 0.5, 0.15] }, 0.2, "out");
A(PAY, "wiz", "grip", { side: "R", shape: "open", dur: 0.15 });
c.macro(PAY + 0.1, "wiz", "say", { line: "Where?!", tone: "excited", voice: "wizard", caption: false });
c.arm(PAY + 0.6, "wiz", "R", { o: [0.03, 0.2, 0.03] }, 0.45, "inOut");
A(PAY + 0.7, "wiz", "look", { to: [-0.5, 0.05], dur: 0.15, blink: false });
A(PAY + 1.05, "wiz", "look", { to: [0.5, 0.05], dur: 0.15, blink: false });
// the hat comes back down onto his head
A(7.55, "wiz", "hat", { on: true, off: [0.05, 1.5, 0], spin: [0, 0, 8], dur: 0 });
A(7.57, "wiz", "hat", { off: [0, 0, 0], spin: [0, 0, 0], dur: 0.5, ease: "out" });
A(8.02, "wiz", "squash", { amount: 0.03, dur: 0.2 });
sfx(8.02, "land", { gain: 0.12 });
A(8.3, "wiz", "look", { to: AT_YOU, dur: 0.2, blink: false });

// the one line on screen, from frame 0 until the shout
cap(0, SHOUT + 0.6, "POV: your friend can't hear", 250, false, { kinetic: false });

// ---------------------------------------------------------------- one shot, a slow push the whole clip
const S = frame([0, 0.92, 0], { el: 3, h: 2.35, fov: 30, push: 0.08, dur: END });
const beats = c.beats([
  ["talking", 0, S, "hook"],
  ["louder", 2.0, "keep", "escalation"],
  ["the shout", SHOUT, "keep", "escalation"],
  ["still nothing", 4.8, "keep"],
  ["the whisper", 5.9, "keep"],
  ["where?!", PAY, "keep", "payoff"],
], END);

write(import.meta.url, {
  id: "the-friend-who-cant-hear",
  title: "The Friend Who Can't Hear",
  cover: 4.1,
  idea: "Test 2 quiet gag: POV, the Wizard can't hear you however loud you shout, but hears a whispered 'free pizza'",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  creative: { length: [8, 12], loop: false },
  set: { type: "plain", color: "#ffc93c", floor: "#f0b21f", light: "golden", aperture: 0, para: 0, bloom: "emissive" },
  music: { style: "bounce", seed: 21, gain: 0.3, payoff: PAY },
  sound: { sfx: 0.7, ambience: 0, signature: false, auto: false },
  fx: [{ do: "shake", at: SHOUT, dur: 0.6, amp: 0.05 }],
  experiment: { id: "test-2-quiet", episode: "the-friend-who-cant-hear", variant: "quiet" },
  hook: { show: ["wiz"], hint: 0, what: "the Wizard leans in with a hand cupped by his head: he can't hear you" },
  cast, props, captions: c.captions, beats,
  notes: "Generated by storyboards/quiet/make-the-friend-who-cant-hear.mjs (Test 2, quiet relatable gags).",
});
