// A test bench for the Not Even Magic phone (story library 11): the open DUO lying screen-up on the table through
// every screen state the brief names, each a beat: working, broken (hinge gap + offset), mending, reconnected, failed
// boot, powered off, closed. The damage map must be the same picture in every broken state.
// Not a clip: `node engine/render.mjs storyboards/unboxing/test-phone-states.json --stills beats --draft`.
import { clip, write, r3 } from "../lib/clip.mjs";

const c = clip(), TH = 0.33, PH = [0, TH, 0.75];
const st = (t, set) => c.prop(t, "ph", set, 0.01);
st(0, { glow: 1, fault: 0, slip: 0, mend: 0 });
st(0.5, { crack: 1, gap: 0.03, slip: 0.012, glow: 0.6 });
st(1.0, { gap: 0.015, slip: 0.006, mend: 1 });
st(1.5, { gap: 0, slip: 0, mend: 0 });
st(2.0, { glow: 1, fault: 1 });
st(2.5, { glow: 0, fault: 0 });
const cam = (az, el, h) => { const t = [0, TH, PH[2] - 0.12], a = (az * Math.PI) / 180, e = (el * Math.PI) / 180, d = h / 2 / Math.tan((20 * Math.PI) / 360);
  return { pos: [t[0] + Math.sin(a) * Math.cos(e) * d, t[1] + Math.sin(e) * d, t[2] + Math.cos(a) * Math.cos(e) * d].map(r3), look: t.map(r3), fov: 20 }; };
const K = cam(-15, 45, 0.75);
const beats = c.beats([["working", 0, K], ["broken", 0.5, K], ["mending", 1.0, K], ["reconnected", 1.5, K], ["failed boot", 2.0, K], ["off", 2.5, K]], 3.0);
write(import.meta.url, {
  id: "test-phone-states", title: "DUO phone states test", fps: 30, look: "anime-pro", profile: "short", loop: false,
  set: { type: "plain", color: "#efe6d6", floor: "#c9b08a", light: "golden", aperture: 0, para: 0, bloom: "emissive" },
  music: false, sound: { sfx: 0, ambience: 0, speech: false },
  cast: [],
  props: [
    { id: "table", kind: "coffeetable", x: 0, z: 0.9, h: TH, w: 2.4, d: 0.9, color: "#e8cf9f", leg: "#c9a06c" },
    { id: "ph", kind: "foldphone", x: PH[0], y: PH[1], z: PH[2], open: 1, tip: -90, seed: 3, damage: "map" },
  ],
  captions: [], beats, notes: "Test bench, not a clip.",
});
