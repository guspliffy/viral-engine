// There's a catch EP10: VOICE PROBE. Every line once, 1 s apart, so the takes are made and measured before staging. Not a video.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import { LINES, TOSS, STREET } from "./lines.mjs";
const c = clip({ faces: "strong", lines: { sub: true, blink: false } });
let t = 0.2;
for (const [who, line, tone, style, o = {}] of [...LINES, TOSS, ...STREET]) {
  const est = r3(line.split(" ").length * 0.45 + 0.6);
  if (who === "nar") c.at(t, { macro: "narrate", line, voice: "narrator", take: o.take ?? 1, dur: est, caption: false });
  else c.macro(t, who, "say", { line, tone, ...(style && { style }), ...o, dur: est, caption: false });
  t = r3(t + est + 1.0);
}
const END = r3(t);
const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [-0.9, 0], face: 0, expr: "kind" },
  { id: "wedge", character: "potatobrawl/wedge", at: [1.0, 0], face: 0, expr: "kind" },
  { id: "chip", character: "potatobrawl/chip", at: [0.1, 0.4], face: 0, expr: "kind" },
];
const beats = c.beats([["probe", 0, { pos: [0, 1.2, 6], look: [0, 0.6, 0], fov: 40 }]], END);
write(import.meta.url, {
  id: "catch10-voice-probe", title: "There's a catch EP10 voice probe", idea: "line takes only", fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [200, 1360], cleanStart: true, castLook: "sheet",
  set: { type: "plain", color: "#dfe6ec", floor: "#2b2e35" }, sound: { signature: false, sfx: 0.6, ambience: 0.06 },
  creative: { length: [END, END] }, cast, props: [], captions: c.captions, beats, visible: c.visible,
  notes: "Voice probe for There's a catch EP10: makes and measures every take.",
});
