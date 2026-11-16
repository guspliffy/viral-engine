// Money redo: VOICE PROBE. Only the narrator lines, spaced 1 s apart on a plain set, so the farm's plan job synthesises
// every take (VoxCPM2, voice 1) and the real lengths can time the cut list before any staging. Not a video.
//   node storyboards/series/happiness/01-money-redo/make-voice-probe.mjs -> voice-probe.json
import { clip, write, r3 } from "../../../lib/clip.mjs";
const c = clip({ faces: "strong", lines: { sub: true, blink: false } });
const LINES = [   // v2: $1 billion in a week (Jonny 16 Nov 06:34)
  "One billion dollars. Gone in seven days.",
  "So he bought the whole coffee cart.",
  "But at a dollar a second, a billion takes thirty-one years.",
  "So he bought big.",
  "Every day, his best friend asked.",
  "On day five, he stopped asking.",
  "So he bought a yacht.",
  "And a plane.",
  "Day seven. One million left. One last buy.",
  "But up on the hill sat his best friend.",
  "He lost a billion dollars.",
  "But for one moment, he forgot all his worries.",
  "Follow for the next question.",
];
let t = 0.2;
for (const line of LINES) { const est = r3(line.split(" ").length * 0.45 + 0.6); c.at(r3(t), { macro: "narrate", line, voice: "narrator", take: 1, dur: est, caption: true, pos: 470, gain: 4.0 }); t = r3(t + est + 1.0); }
const END = r3(t);
const SHOT = { pos: [0, 1.2, 4], look: [0, 0.6, 0], fov: 40 };
const cast = [{ id: "spud", character: "potatobrawl/spud", at: [0, 0], face: 0, expr: "kind" }];
const beats = c.beats([["probe", 0, SHOT]], END);
write(import.meta.url, {
  id: "voice-probe", title: "Money redo voice probe", idea: "narrator takes only", fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionStyle: "kinetic", captionBand: [250, 1360], cleanStart: true,
  set: { type: "env", env: "golden-city-crossing" }, sound: { signature: false, sfx: 0.65, ambience: 0.06 },
  creative: { length: [END, END] }, cast, props: [], captions: c.captions, beats, visible: c.visible,
  notes: "Voice probe for the money redo: render only --from 0 --to 1 on the farm; the plan job makes every take.",
});
