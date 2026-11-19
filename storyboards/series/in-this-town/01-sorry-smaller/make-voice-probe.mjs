// In this town 01: VOICE PROBE. Every line once, 1 s apart, so the takes are made and measured before staging. Not a video.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import { LINES, VOICE } from "./lines.mjs";
const c = clip({ faces: "strong", lines: { sub: false, blink: false } });
let t = 0.2;
for (const [k, who, line, tone, style, o = {}] of LINES) {
  const est = r3(line.split(" ").length * 0.42 + 0.5);
  if (who === "N") c.at(t, { macro: "narrate", line, voice: VOICE.N, take: 1, dur: est, caption: false, key: k, ...o });
  else c.macro(t, who, "say", { line, tone, ...(style && { style }), voice: VOICE[who], ...o, dur: est, caption: false, key: k });
  t = r3(t + est + 1.0);
}
const END = r3(t);
const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [-1.2, 0], face: 0, expr: "kind" },
  { id: "big", character: "happiness/mover", at: [0, 0], face: 0, expr: "kind" },
  { id: "baker", character: "happiness/baker", at: [1.2, 0], face: 0, expr: "kind" },
];
const beats = c.beats([["probe", 0, { pos: [0, 1.2, 6], look: [0, 0.6, 0], fov: 40 }]], END);
write(import.meta.url, {
  id: "town01-voice-probe", title: "In this town 01 voice probe", idea: "line takes only", tool: "voice probe: makes and measures the line takes, never a video", fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [200, 1360], cleanStart: true, castLook: "sheet",
  set: { type: "plain", color: "#c3ccd0", floor: "#97a3a8" }, sound: { signature: false, sfx: 0.6, ambience: 0.06 },
  creative: { length: [END, END] }, cast, props: [], captions: c.captions, beats, visible: c.visible,
  notes: "Voice probe for In this town 01: makes and measures every take.",
});
