// Shared helpers for the "same task, each fighter does it their own way" clips (BUS and later): write the clip as one
// timeline in absolute seconds, mark where each fighter's turn starts, and finish() cuts it into a beat storyboard
// (docs/STORYBOARD.md) with the house captions: the hook line, each fighter's name and habit
// while it's their turn, and "which one are you?" at the end.
//   const c = clip({ id, title, set, ... }); c.A("ast", 0.5, "hop"); c.beat("ast", 0, "how", "habit"); c.finish(end, {...})
import { writeFileSync } from "node:fs";

export const r3 = (x) => Math.round(x * 1000) / 1000;
export const NAMES = { ast: "ASTRONAUT", rea: "REAPER", sor: "SORCERER", wiz: "WIZARD", dra: "DRAGON", phx: "PHOENIX", gun: "GUNSLINGER", sam: "SAMURAI", all: "ALLFATHER", vik: "VIKING" };
export const CHARACTER = { ast: "astronaut", rea: "reaper", sor: "sorcerer", wiz: "wizard", dra: "dragon", phx: "phoenix", gun: "gunslinger", sam: "samurai", all: "allfather", vik: "viking" };

export function clip(meta) {
  const sb = { fps: 30, sound: { sfx: 0.5 }, escalation: false, loop: true, cast: [], beats: [], shots: [], captions: [], props: [], allowClip: [], ...meta };
  const items = [], beats = [];
  const c = {
    sb, items, beats,
    A: (who, t, what, o = {}) => items.push({ who, do: what, at: r3(t), ...o }),
    prop: (id, t, set, dur = 0.3, ease = "inOut") => items.push({ do: "prop", id, at: r3(t), dur, ease, set }),
    fx: (t, o) => items.push({ ...o, at: r3(t) }),
    sfx: (t, s, o = {}) => items.push({ sfx: s, at: r3(t), ...o }),
    walk: (who, t, to, dur, ease = "out", steps = 3) => items.push({ who, do: "move", at: r3(t), to, dur, ease, steps }),
    // a fighter in the cast, standing at `at`; hidden from the start unless shown
    cast(id, at, o = {}) { sb.cast.push({ id, character: `potatobrawl/${CHARACTER[id]}`, at, face: "camera", expr: "kind", seed: 1.1 + sb.cast.length * 0.7, ...o }); if (o.hidden) { delete sb.cast.at(-1).hidden; c.A(id, 0, "hide"); } },
    beat: (id, at, how, habit) => beats.push({ id, at: r3(at), how, habit }),
    clipOk: (who, w, from = 0, to = 99) => sb.allowClip.push({ who, with: w, from: r3(from), to: r3(to) }),
    // the end: cut the timeline into beats (an item goes to the beat it starts in), add the shot and the captions
    finish(end, { shot, title, hook, hookTo = 1.0, askAt, cover, file }) {
      end = r3(end);
      beats.sort((x, y) => x.at - y.at);
      const late = items.filter((x) => x.at >= end);
      if (late.length) throw new Error(`items after the end (${end}): ${JSON.stringify(late.slice(0, 3))}`);
      for (const [i, b] of beats.entries()) {
        const nextAt = beats[i + 1]?.at ?? end, mine = items.filter((x) => (x.at >= b.at || i === 0) && x.at < nextAt);
        sb.beats.push({ name: `${b.id}: ${b.how}`, at: b.at, len: r3(nextAt - b.at), do: mine.map((x) => ({ ...x, at: r3(x.at - b.at) })) });
      }
      sb.duration = end;
      sb.shots.push({ at: 0, ...shot });
      // the hook is the top line until hookTo (the first fighter's name under it from frame 0), then just the name and
      // the habit (the title is the storyboard's, not a caption: a one-word title meant nothing on screen)
      sb.captions.push({ from: 0, to: hookTo, text: hook, pos: 230, pop: false });   // already up on frame 0
      const ask = r3(askAt);
      for (const [i, b] of beats.entries()) {
        const from = i ? r3(b.at) : 0, to = i === beats.length - 1 ? ask : beats[i + 1].at, habitFrom = i ? from : hookTo;
        if (to > from) sb.captions.push({ from, to, text: NAMES[b.id], style: "label", pos: 340, pop: false });
        if (to > habitFrom) sb.captions.push({ from: habitFrom, to, text: b.habit, pos: 425 });
      }
      sb.captions.push({ from: ask, to: end, text: "which one are you?", pos: 340 });
      sb.cover = r3(cover);
      if (end > 20) sb.escalation = true;   // over 20 s: the biggest (the Viking) is last
      writeFileSync(file, JSON.stringify(sb, null, 1));
      console.log(`${sb.id}: ${end} s, ${beats.length} beats: ${beats.map((b) => `${b.id} ${b.at}`).join(", ")}`);
    },
  };
  return c;
}
