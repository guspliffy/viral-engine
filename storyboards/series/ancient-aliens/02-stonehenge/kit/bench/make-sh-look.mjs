// Look bench: the stones on the land under the sky at four story times, from the kit's main cameras (wide frame).
// The director's quick check that S1 + S2 sit together; stills only.
//   node storyboards/series/ancient-aliens/02-stonehenge/kit/bench/make-sh-look.mjs
import { clip, write, r3 } from "../../../../../lib/clip.mjs";
import { FRAME, SET_OF, CAST, VIEW, shot, today, past, host, lampClip, PLACE } from "../sh-kit.mjs";
const F = FRAME[process.env.SH_FRAME || "wide"];
const O = PLACE;
const who = (id, o, x, z, face) => ({ id, character: CAST.spud, at: [r3(o[0] + x), r3(o[1] + z)], face, expr: "kind", follow: 0.2, seed: 2.1 });
const PLACES = [
  ["todayA", 25, "today", ["axis", "high", "inside"]], ["pastA", 25, "new", ["axis", "high"]],
  ["todayC", 125, "today", ["axis"]], ["pastC", 125, "new", ["axis", "top", "avenue"]],
  ["todayD", 178, "today", ["axis", "axisLong"]], ["pastD", 180, "new", ["axis", "axisLong"]],
];
for (const set of ["a", "c", "d"]) {
  const c = clip(), shots = [], cast = [], props = [];
  PLACES.filter(([n]) => n.endsWith(set.toUpperCase())).forEach(([name, T, era, views], i) => {
    const o = O(i + (set === "a" ? 0 : set === "c" ? 2 : 4));
    cast.push(who(`spud-${name}`, o, -1.2, 58.5, 5)); props.push(...(era === "today" ? today(name, o, { T }) : past(name, o, { T, grooves: "cut" })), host(`spud-${name}`));
    for (const v of views) { const t = r3(0.1 + shots.length); shots.push([`${name}-${v}`, t, shot(F, o, VIEW[v])]); c.cap(t, t + 0.9, `${name} ${v} (T ${T})`, F.H - 120, false, { kinetic: false, size: 30 }); }
  });
  const END = r3(0.1 + shots.length + 0.1), id = `sh-look-${set}-${F.key}`;
  console.log(id, "stills:", shots.map(([, t]) => r3(t + 0.55)).join(","));
  write(import.meta.url, { id, title: "Stonehenge look bench", idea: "Look bench: stones + land + sky at the film's times, not a clip", ...F.sb,
    fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false,
    set: SET_OF(PLACES.find(([n]) => n.endsWith(set.toUpperCase()))[1]), music: false, sound: { auto: false }, hook: { show: [cast[0].id], hint: 0, what: "engine test" },
    cast, props, captions: c.captions, beats: c.beats(shots, END), allowClip: lampClip(cast.map((a) => a.id), END), notes: "look bench" });
}
