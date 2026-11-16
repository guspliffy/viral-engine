// Skip remote (happiness EP02): VOICE PROBE. Only the narrator lines, spaced 1 s apart on a plain set, so the farm's plan job synthesises
// every take (VoxCPM2, voice 1) and the real lengths can time the cut list before any staging. Not a video.
//   node storyboards/series/happiness/02-skip-remote/make-voice-probe.mjs -> voice-probe.json
import { clip, write, r3 } from "../../../lib/clip.mjs";
const c = clip({ faces: "strong", lines: { sub: true, blink: false } });
const LINES = [   // outline v1 + Jonny's opening (16 Nov 07:44): the narrator says "you"
  "You get a remote that skips the boring parts of life.",
  "If you've ever wished a Monday away, watch what it costs you.",
  "Traffic? Skipped.",
  "Rain? Skipped.",
  "Queues? Skipped.",
  "Mondays? Skipped.",
  "Would you press it?",
  "But most of life is the boring parts.",
  "Eighty-two. And you can't remember a single day.",
  "So you rewind, to see what you skipped.",
  "The boring parts were the good parts.",
  "And for one moment, you forget all your worries.",
  "Follow for the next question.",
];
let t = 0.2;
for (const line of LINES) { const est = r3(line.split(" ").length * 0.45 + 0.6); c.at(r3(t), { macro: "narrate", line, voice: "narrator", take: 1, dur: est, caption: true, pos: 470, gain: 4.0 }); t = r3(t + est + 1.0); }
const END = r3(t);
const SHOT = { pos: [0, 1.2, 4], look: [0, 0.6, 0], fov: 40 };
const cast = [{ id: "spud", character: "potatobrawl/spud", at: [0, 0], face: 0, expr: "kind" }];
const beats = c.beats([["probe", 0, SHOT]], END);
write(import.meta.url, {
  id: "skip-voice-probe", title: "Skip remote voice probe", idea: "narrator takes only", fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionStyle: "kinetic", captionBand: [250, 1360], cleanStart: true,
  set: { type: "env", env: "golden-city-crossing" }, sound: { signature: false, sfx: 0.65, ambience: 0.06 },
  creative: { length: [END, END] }, cast, props: [], captions: c.captions, beats, visible: c.visible,
  notes: "Voice probe for the skip remote: render only --from 0 --to 1 on the farm; the plan job makes every take.",
});
