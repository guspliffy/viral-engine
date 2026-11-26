// Bench for the rooster and the fly (engine/page/props-alarm-rooster.js, DESIGN.md sections 2.8 and 6 task C). Not a clip: tall frame,
// set plain, look anime-pro, castLook sheet, no music. One group per shot, 800 m apart on a diagonal (no camera sees another group).
//   TURN    four-view turnaround beside Spud (0.88 m): front, 3/4, side, back
//   K       each key at 0 (left bird) and 1 (right bird): crow, sleep, flap, walk, peek, and headY 1 + lid 1
//   S       strips: crow (0.2 s in, 1.3 s held), sleep settling on a 30 degree slope, flap (every frame), walk, peek in and out
//   CARRY   Spud carries the sleeping-0.35 rooster through a 1 m walk with grips.box; lens at y 1.25 in front, and a side lens
//   HEAD    the head close (the eye with its lid, the comb, the beak open and shut)
//   FLY     the fly on Spud's nose from 1.7 m, fov 36, tall frame (38 px in the film's C02); and close, buzz 0 and 1
//   node storyboards/series/how-you-invented/01-alarm-clock/bench/bench-rooster.mjs
//   node engine/render.mjs storyboards/series/how-you-invented/01-alarm-clock/bench/bench-rooster.json --stills <the printed times> --draft --out out/alarm-bench-rooster
//   node qa/contact.mjs out/alarm-bench-rooster/bench-rooster-*.png --out out/alarm-bench-rooster-sheet.png
// The keys crow, sleep, walk, peek and buzz only TWEEN once props3d.js seeds them (ALARM_ROOSTER_STATE, see the props file's last lines);
// until then every strip frame here is written as its own `prop` set with its own eased value, which reads the same.
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import * as grips from "../../../../lib/grips.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const cast = [], props = [], SHOTS = [], STILLS = [];
let slot = 0;
const origin = () => { const o = 800 * slot++; return [o, o]; };
const P = (g, x, z) => [r3(g[0] + x), r3(g[1] + z)];
const SPUD = (id, g, x, z, face, extra = {}) => ({ id, character: "potatobrawl/spud", at: P(g, x, z), face, expr: "kind", follow: 0.2, seed: 2.1, ...extra });
const view = (g, tgt, az, h, el = 0, f = 28) => {   // a camera by azimuth, elevation and the visible height h at the target (tall frame)
  const a = az * Math.PI / 180, e = el * Math.PI / 180, d = h / 2 / Math.tan(f * Math.PI / 360);
  return { pos: [r3(g[0] + tgt[0] + Math.sin(a) * Math.cos(e) * d), r3(tgt[1] + Math.sin(e) * d), r3(g[1] + tgt[2] + Math.cos(a) * Math.cos(e) * d)], look: [r3(g[0] + tgt[0]), r3(tgt[1]), r3(g[1] + tgt[2])], fov: f };
};
let T = 0.1;
// a shot: one beat at T with the stills at T + each dt; label on the frame
const shot = (name, cam, dts, label, setup) => {
  const t0 = r3(T); if (setup) setup(t0);
  const times = dts.map((d) => r3(t0 + d)); STILLS.push(...times);
  const len = r3(Math.max(...dts) + 0.35); SHOTS.push([name, t0, cam]); c.cap(t0, t0 + len - 0.05, label, 1850, false, { kinetic: false, size: 28 });
  T = r3(t0 + len);
};
const ease = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };
// a key stepped through its own eased values at each still (see the header): from `from` to `to` over [t0, t0 + dur]
const step = (id, key, from, to, t0, dur, dts, t00 = t0) => { for (const d of dts) c.prop(r3(t00 + d - 0.004), id, { [key]: r3(from + (to - from) * ease((t00 + d - t0) / dur)) }, 0); };
const base = (id, kind, g, x, z, extra = {}) => { const [wx, wz] = P(g, x, z); props.push({ id, kind, x: wx, z: wz, ...extra }); };

// ---------------------------------------------------------------- TURN: the bird at the group origin, Spud 0.9 m to the camera's right and 0.5 m behind; then the bird alone, close
for (const [n, az] of [["front", 0], ["three-quarter", 40], ["side", 90], ["back", 180]]) {
  const g = origin(), a = az * Math.PI / 180, rx = Math.cos(a), rz = -Math.sin(a), fx = Math.sin(a), fz = Math.cos(a);
  base("r" + n, "rooster", g, 0, 0);
  cast.push(SPUD("s" + n, g, r3(rx * 0.85 - fx * 0.5), r3(rz * 0.85 - fz * 0.5), az));
  shot("turn-" + n, view(g, [rx * 0.55, 0.5, rz * 0.55], az, 2.5, 6, 28), [0.55], `TURN ${n}: 0.42 tall beside Spud (0.88)`);
}
for (const [n, az] of [["front", 0], ["three-quarter", 40], ["side", 90], ["back", 150]]) {
  const g = origin(); base("l" + n, "rooster", g, 0, 0);
  shot("look-" + n, view(g, [0, 0.23, az === 90 ? -0.08 : -0.03], az, az === 90 ? 1.0 : 0.8, 4, 28), [0.55], `LOOK ${n}`);
}
// ---------------------------------------------------------------- K: each key at 0 and at 1 (two shots a key, same lens), from the front-left
const KEYS = [["crow", { crow: 1 }, 40, 0.95], ["sleep", { sleep: 1 }, 40, 0.95], ["sleep 0.35", { sleep: 0.35 }, 40, 0.95], ["flap", { flap: 1 }, 25, 1.25], ["walk", { walk: 1 }, 40, 0.95], ["peek", { peek: 1 }, 40, 0.95], ["headY+lid", { headY: 1, lid: 1 }, 20, 0.7]];
for (const [n, spec, az, H] of KEYS) for (const [v, sp] of [[0, {}], [1, spec]]) {
  const g = origin(); base("k" + v + n, "rooster", g, 0, 0, sp);
  shot(`key-${n.replace(/[ +.]/g, "")}-${v}`, view(g, [0, 0.25, -0.03], az, H, 6, 28), [0.55], `KEY ${n} = ${v}`);
}
// ---------------------------------------------------------------- S: strips
{   // crow: 0.2 s in, 1.3 s held (the still times in the 5 frames of the rise, then the hold)
  const g = origin(), dts = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.5, 0.9, 1.3, 1.55]; base("scrow", "rooster", g, 0, 0);
  shot("strip-crow", view(g, [0, 0.3, 0], 62, 0.95, 4, 28), dts, "STRIP crow 0.2 s in, 1.3 s held", (t0) => step("scrow", "crow", 0, 1, t0 + 0.1, 0.2, dts, t0));
}
{   // sleep settling on a 30 degree slope: a plank lying at 30 degrees, the bird tipped 30 with it, standing 0.6 up the plank
  const g = origin(), dts = [0.1, 0.3, 0.5, 0.7, 0.9, 1.1, 1.3, 1.6, 2.0, 2.4]; const [wx, wz] = P(g, 0, 0);
  props.push({ id: "slope", kind: "plank", x: wx, y: 0, z: wz, w: 1.0, h: 1.2, t: 0.03, tip: -60 });
  props.push({ id: "slbird", kind: "rooster", x: wx, y: 0.313, z: r3(wz - 0.5125), tip: 30 });
  shot("strip-sleep", view(g, [0, 0.45, -0.5], 90, 1.05, 4, 28), dts, "STRIP sleep 0 to 1 on a 30 degree slope", (t0) => step("slbird", "sleep", 0, 1, t0 + 0.1, 1.6, dts, t0));
}
{   // flap: wings spread over 0.2 s, then every frame for 10 frames (9 Hz beat)
  const g = origin(), dts = Array.from({ length: 12 }, (_, i) => r3(0.3 + i / 30)); base("sflap", "rooster", g, 0, 0);
  shot("strip-flap", view(g, [0, 0.3, 0], 20, 1.1, 4, 28), dts, "STRIP flap 1: 12 frames at 30 fps (9 Hz)", (t0) => { c.prop(t0 + 0.05, "sflap", { flap: 1 }, 0); });
}
{   // walk: 0.5 m forward in 1.4 s, legs and head stepping; 10 frames 0.09 s apart
  const g = origin(), dts = Array.from({ length: 10 }, (_, i) => r3(0.3 + i * 0.09)); base("swalk", "rooster", g, 0, -0.1);
  shot("strip-walk", view(g, [0, 0.27, 0.1], 85, 1.5, 3, 28), dts, "STRIP walk 1: 10 frames 0.09 s apart, 0.3 m/s", (t0) => { c.prop(t0 + 0.05, "swalk", { walk: 1 }, 0); c.prop(t0 + 0.1, "swalk", { z: r3(P(g, 0, 0.35)[1]) }, 1.4, "linear"); });
}
{   // peek in and out: neck 40 deg forward and down, the head cocked
  const g = origin(), dts = [0.1, 0.2, 0.3, 0.4, 0.5, 0.8, 1.0, 1.1, 1.2, 1.35]; base("speek", "rooster", g, 0, 0);
  shot("strip-peek", view(g, [0, 0.3, 0.05], 60, 0.9, 4, 28), dts, "STRIP peek 0 to 1 (0.4 s), back (0.3 s)", (t0) => { for (const d of dts) { const u = d < 0.9 ? ease((d - 0.1) / 0.4) : 1 - ease((d - 1.0) / 0.3); c.prop(r3(t0 + d - 0.004), "speek", { peek: r3(u) }, 0); } });
}
// ---------------------------------------------------------------- CARRY: Spud takes the bird (box hold, sleep 0.35) and walks 1 m; two groups play the same timeline, one per lens
const carry = (tag, camOf, label) => {
  const g = origin(), t0 = r3(T), [gx, gz] = g;
  const R = { id: "carried" + tag, kind: "rooster", sleep: 0.35, ...grips.placeFor("rooster", [gx, 0, gz + 0.42], 0), rot: 0 };
  props.push(R); cast.push(SPUD("scarry" + tag, g, 0, 0, 0, { follow: 0 }));
  const h = grips.box(c, "scarry" + tag, R, { gap: 0.04 });
  let t = h.take(t0 + 0.1, { reach: 0.3, settle: 0.2 });
  const at = (u) => [r3(gx), 0.12, r3(gz + 0.3 + u)];   // 0.3 in front of Spud, comb at 0.54, 0.05 under his mouth (DESIGN 2.8)
  t = h.carry(t + 0.05, at(0), 0.4, "inOut");
  const w0 = r3(t + 0.1); c.A(w0, "scarry" + tag, "move", { to: [r3(gx), r3(gz + 1.0)], dur: 1.6, ease: "linear" });
  for (let i = 1; i <= 8; i++) h.carry(r3(w0 + (i - 1) * 0.2), at(i / 8), 0.2, "linear");
  const dts = [-0.4, 0.2, 0.6, 1.0, 1.4, 1.8].map((d) => r3(w0 + d - t0));
  shot("carry-" + tag, camOf(g), dts, label);
  h.put(r3(w0 + 1.8), [r3(gx), 0, r3(gz + 1.4)]);
};
carry("front", (g) => ({ pos: [r3(g[0] + 0.5), 1.25, r3(g[1] + 3.2)], look: [r3(g[0]), 0.62, r3(g[1] + 0.9)], fov: 36 }), "CARRY lens y 1.25: box hold, sleep 0.35, 1 m walk");
carry("side", (g) => ({ pos: [r3(g[0] + 3.6), 0.75, r3(g[1] + 0.7)], look: [r3(g[0]), 0.62, r3(g[1] + 0.7)], fov: 36 }), "CARRY side lens: gloves on the flanks");
// ---------------------------------------------------------------- HEAD: close-ups, eye open / shut, beak shut / open
for (const [v, sp] of [[0, {}], [1, { crow: 1, lid: 1 }]]) {
  const g = origin(); base("h" + v, "rooster", g, 0, 0, sp);
  shot("head-front-" + v, { pos: [r3(g[0]), 0.4, r3(g[1] + 0.9)], look: [r3(g[0]), 0.37 + 0.03 * v, r3(g[1])], fov: 20 }, [0.55], v ? "HEAD front: crow 1, lid shut" : "HEAD front: lid open");
}
{
  const g = origin(); base("hs0", "rooster", g, 0, 0, { headY: 0 });
  shot("head-side", view(g, [0, 0.38, 0.14], 72, 0.28, 3, 20), [0.55], "HEAD side: eye, ear lobe, comb, wattles, beak");
}
{
  const g = origin(); base("hs1", "rooster", g, 0, 0, { crow: 1 });
  shot("head-crow", view(g, [0, 0.4, 0.12], 70, 0.34, 3, 20), [0.55], "HEAD crow 1: beak 28 deg, tongue");
}
// ---------------------------------------------------------------- FLY: on Spud's nose, 1.7 m, fov 36 (the film's C02 lens size); close, buzz 0 and 1
{
  const g = origin(); cast.push(SPUD("sfly", g, 0, 0, 0, { follow: 0 }));
  const [fx, fz] = P(g, 0, 0.335);
  props.push({ id: "fly0", kind: "fly", x: fx, y: 0.7, z: fz, tip: 90 });   // on his face between the eyes, head down (tip 90 stands it on a vertical surface)
  shot("fly-face", { pos: [r3(g[0]), 0.72, r3(g[1] + 2.03)], look: [r3(g[0]), 0.72, r3(g[1] + 0.33)], fov: 36 }, [0.55], "FLY at 1.7 m, fov 36: a fly on a face (crop it)");
}
{
  const g = origin(); base("fa", "fly", g, -0.02, 0, { y: 0.1 }); base("fb", "fly", g, 0.02, 0, { y: 0.1, buzz: 1 });
  const dts = [0.5, 0.5333, 0.5667, 0.6]; shot("fly-close", view(g, [0, 0.105, 0], 50, 0.11, 12, 20), dts, "FLY close: buzz 0 (left) and buzz 1 (right), four frames");
}

const END = r3(T + 0.1);
console.log("stills:", STILLS.join(","));
console.log("names:", SHOTS.map(([n]) => n).join(","));
write(import.meta.url, {
  id: "bench-rooster", title: "How you invented 01: rooster and fly bench", idea: "Props bench for the rooster and the fly (task C), not a clip",
  frame: "tall", fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#bcd4ea", floor: "none" }, music: false, sound: { auto: false },
  hook: { show: [cast[0].id], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS, END),
  notes: "Generated by storyboards/series/how-you-invented/01-alarm-clock/bench/bench-rooster.mjs (props bench, no reviews).",
});
