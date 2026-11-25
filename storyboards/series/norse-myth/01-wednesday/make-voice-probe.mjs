// Norse myth 01: VOICE PROBE. Every line once, 1 s apart, so the takes are made and measured before staging. Not a video.
//   node storyboards/series/norse-myth/01-wednesday/make-voice-probe.mjs; node qa/lines.mjs storyboards/series/norse-myth/01-wednesday/odin-voice-probe.json
import { clip, write, r3 } from "../../../lib/clip.mjs";
import { LINES } from "./lines.mjs";
const c = clip({ faces: "strong", lines: { sub: true, blink: false } });
const WHO = { chip: "chip", spud: "spud", odin: "odin", head: "head", raven1: "r1", raven2: "r2" };
let t = 0.2;
for (const [who, line, tone, style, o = {}] of LINES) { const est = r3(line.split(" ").length * 0.4 + 0.5); c.macro(t, WHO[who], "say", { line, tone, ...(style ? { style } : {}), ...o, dur: est, caption: false }); t = r3(t + est + 1.0); }
const END = r3(t);
const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [-2.0, 0], face: 0, expr: "kind" },
  { id: "chip", character: "potatobrawl/chip", at: [-1.0, 0], face: 0, expr: "kind" },
  { id: "odin", character: "potatobrawl/wedge", at: [0, 0], face: 0, expr: "kind" },
  { id: "head", character: "potatobrawl/mash", at: [1.0, 0], face: 0, expr: "kind" },
  { id: "r1", character: "potatobrawl/wedge", at: [2.0, 0], face: 0, expr: "kind" },
  { id: "r2", character: "potatobrawl/mash", at: [3.0, 0], face: 0, expr: "kind" },
];
const beats = c.beats([["probe", 0, { pos: [0.5, 1.2, 7], look: [0.5, 0.6, 0], fov: 45 }]], END);
write(import.meta.url, {
  id: "odin-voice-probe", title: "Norse myth 01 voice probe", idea: "line takes only", tool: "voice probe: makes and measures the line takes, never a video", fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [200, 1360], cleanStart: true, castLook: "sheet",
  set: { type: "plain", color: "#c3ccd0", floor: "#97a3a8" }, sound: { signature: false, sfx: 0.6, ambience: 0.06 },
  creative: { length: [END, END] }, cast, props: [], captions: c.captions, beats, visible: c.visible,
  notes: "Voice probe for norse myth 01: makes and measures every take.",
});
