// Potato Desk 13: VOICE PROBE. Every line once, 1 s apart, so the takes are made and measured before staging. Not a video.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import { LINES } from "./lines.mjs";
const c = clip({ faces: "strong", lines: { sub: true, blink: false } });
let t = 0.2;
for (const [who, line, tone, style, o = {}] of LINES) { const est = r3(line.split(" ").length * 0.4 + 0.5); c.macro(t, who, "say", { line, tone, style, ...o, dur: est, caption: false }); t = r3(t + est + 1.0); }
const END = r3(t);
const cast = ["spud", "devil", "chip", "wedge", "wizard", "mash"].map((id, i) => ({ id, character: `potatobrawl/${id}`, at: [-2.5 + i, 0], face: 0, expr: "kind" }));
const beats = c.beats([["probe", 0, { pos: [0, 1.2, 7], look: [0, 0.6, 0], fov: 45 }]], END);
write(import.meta.url, {
  id: "desk13-voice-probe", title: "Potato Desk 13 voice probe", idea: "line takes only", tool: "voice probe: makes and measures the line takes, never a video", fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [200, 1360], cleanStart: true, castLook: "sheet",
  set: { type: "plain", color: "#c3ccd0", floor: "#97a3a8" }, sound: { signature: false, sfx: 0.6, ambience: 0.06 },
  creative: { length: [END, END] }, cast, props: [], captions: c.captions, beats, visible: c.visible,
  notes: "Voice probe for Potato Desk 13: makes and measures every take.",
});
