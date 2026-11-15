// Ancient aliens EP03 "Where did Atlantis go?": the helpers every block builds its scenes from, so four blocks get ONE
// Atlantis, one clock, one light per time of day, one score. Design numbers: BOARD.md (next to this file); the spec of
// every new piece: /mnt/project-files/videos/ancient-aliens/03-atlantis/DESIGNS.md and the usage header of its owner file
// (engine/page/props-at-{city,far,sea,seabed,towns}.js, costumes-plato.js). The pilot's kit (../../kit/aa-kit.mjs: ring
// ship, aliens, headlamp, the host's voice) and EP02's (../../02-stonehenge/kit/sh-kit.mjs: two frames, counters) are reused.
//
// TWO FRAMES, ONE GENERATOR (as EP02): build(F) for FRAME.wide (the film, the master) and FRAME.tall (the part, after
// Jonny's OK on the wide animatic); parts 2-4 open on their own HOOK shot (hookOf). Every camera is a pair { wide, tall }.
//
// THE CLOCK is the time Atlantis has left: 24:00 at story time 0, 00:00 at story time CLOCK_END (178 s, the climax), top
// right, in jumps of one clock minute (0.124 s). atlantisClock(c, F, T0, t0, t1) writes it for clip times [t0, t1] of a
// storyboard that starts at story time T0; leave it off over the maps, the page and other full-frame inserts.
import { CAST, HOST_VOICE, host, lampClip, cam } from "../../kit/aa-kit.mjs";
export { CAST, HOST_VOICE, host, lampClip, cam };

const r3 = (x) => Math.round(x * 1000) / 1000;
// places on a 20 km grid (BOARD section 1): PLACE(0) is the city
export const PLACE = (i) => [(i % 4) * 20000, Math.floor(i / 4) * 20000];
export const P = { city: PLACE(0), gibraltar: PLACE(1), sicily: PLACE(2), bimini: PLACE(3), step: PLACE(4), portroyal: PLACE(5), helike: PLACE(6), night: PLACE(7), plato: PLACE(8), maps: PLACE(9), page: PLACE(10), canal: PLACE(11) };
export const FAR = { city: 9000, other: 1500 };
export const FRAME = {
  wide: { key: "wide", sb: (far = FAR.other) => ({ frame: "wide", far }), W: 1920, H: 1080, SUB: 150, subSize: 54, NUM: 250, numSize: 120, tag: { y: 52, x: 210, size: 38 }, clock: { y: 52, x: 1690, size: 38 } },
  tall: { key: "tall", sb: (far = FAR.other) => ({ far }), W: 1080, H: 1920, SUB: 400, subSize: 62, NUM: 580, numSize: 110, tag: { y: 240, x: 250, size: 44 }, clock: { y: 240, x: 730, size: 44 } },
};

// ---- the light: one set.lighting per storyboard (BOARD section 2) ----
const keyOf = ([az, el]) => { const a = az * Math.PI / 180, e = Math.max(el, 6) * Math.PI / 180; return [r3(-Math.sin(a) * Math.cos(e) * 10), r3(Math.sin(e) * 10), r3(-Math.cos(a) * Math.cos(e) * 10)]; };
const light = (color, sun, o) => ({ type: "plain", color, floor: "shadow", lighting: { v: 2, measure: false, ao: 0, key: keyOf(sun), ...o } });
export const SUN = { dawn: [35, 8], noon: [10, 65], day: [20, 55], eve: [60, 6], night: [30, 35] };
export const AT_DAWN = light("#bcd6ee", SUN.dawn, { light: "#ffe6c0", shadow: "#8a90c4", exposure: 1.0 });
export const AT_NOON = light("#3f86d6", SUN.noon, { light: "#fff6e0", shadow: "#7f88c0", exposure: 1.0 });
export const AT_DAY = light("#8fd0ea", SUN.day, { light: "#fff8e6", shadow: "#7a9cc4", exposure: 1.0 });
export const AT_EVE = light("#b3683a", SUN.eve, { light: "#ffb070", shadow: "#5a4a7a", exposure: 0.9 });
export const AT_NIGHT = light("#141c33", SUN.night, { light: "#a8b8e8", shadow: "#26305c", exposure: 0.6, night: true });
export const AT_UNDER = light("#2a8f96", [20, 70], { light: "#d8fff4", shadow: "#2f6a7a", exposure: 0.92 });

// ---- the voice, the texts, the clock, the score ----
// Spud hosts with Reaper's voice: ALWAYS hostSay (c.say in a beat storyboard is never voiced). Subtitle at F.SUB.
export function hostSay(c, F, t, who, line, dur, tone = "calm", { sub = true, hold = 0.4, pos = F.SUB, size = F.subSize } = {}) {
  c.at(r3(t), { macro: "say", who, line, tone, dur, voice: HOST_VOICE, caption: false });
  if (sub) c.cap(r3(t), r3(t + dur + hold), sub === true ? line : sub, pos, false, { size, kinetic: false });
}
// "CLUE n/4", top left
export const clueTag = (c, F, t0, t1, n) => c.cap(r3(t0), r3(t1), `CLUE ${n}/4`, F.tag.y, false, { style: "label", size: F.tag.size, kinetic: false, x: F.tag.x });
export const CLOCK_END = 178;
const MIN = CLOCK_END / (24 * 60);
export function atlantisClock(c, F, T0, t0, t1) {
  const b = Math.min(t1, CLOCK_END + 4 - T0);
  for (let t = Math.max(0, t0); t < b - 1e-6;) {
    const T = T0 + t, left = Math.max(0, Math.ceil((CLOCK_END - T) / MIN - 1e-6));
    const next = left > 0 ? Math.min(b, CLOCK_END - (left - 1) * MIN - T0) : b;
    // write in steps of at least 0.1 s (one caption per step), the minute shown is the one at the step's start
    const end = Math.max(r3(t + 0.1), r3(next));
    c.cap(r3(t), Math.min(r3(b), end), `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`, F.clock.y, false, { style: "label", size: F.clock.size, kinetic: false, x: F.clock.x });
    t = end;
  }
}
// a number that counts: from a to b over [t0, t1] in steps of 0.1 s (eased out), then holds to `hold`.
export function count(c, F, t0, t1, hold, a, b, fmt = (v) => String(Math.round(v)), o = {}) {
  const n = Math.max(1, Math.round((t1 - t0) / 0.1));
  for (let i = 0; i <= n; i++) {
    const v = a + (b - a) * (1 - Math.pow(1 - i / n, 3)), ts = r3(t0 + i * 0.1);
    c.cap(ts, i === n ? r3(hold) : r3(ts + 0.1), fmt(i === n ? b : v), o.pos ?? F.NUM, false, { size: F.numSize, kinetic: false, ...o });
  }
}
// THE SCORE (kit/score.py on STORY.md's times): `music: score(<story time of the storyboard's first frame>)`, animatics included.
export const score = (storyTime = 0, o = {}) => ({ file: "ancient-aliens/aa03-score.ogg", from: 0, skip: storyTime, gain: 0.6, lowCut: 90, dip: false, duck: { voice: -6 }, mood: "dramatic", ...o });
export const HOOK = 3;
export const hookOf = (F, block) => (F.key === "tall" && block !== "a" ? HOOK : 0);
export const partScore = (block, o = {}) => (block === "a" ? score(0, o) : score(0, { file: `ancient-aliens/aa03-part-${block}.ogg`, ...o }));
export const shot = (F, o, v) => cam(o, v[F.key] ?? v);
// The set helpers (city(), sea(), seabed(), ...) are added here when the builders' kinds are in (BOARD section 3).
