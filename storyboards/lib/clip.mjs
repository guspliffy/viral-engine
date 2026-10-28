// The clip builder every generator shares: write a clip's actions on one absolute timeline, list its shots, and
// get a beat storyboard back (docs/STORYBOARD.md). It replaces the helpers each generator used to copy.
//
//   import { clip, write } from "../lib/clip.mjs";
//   const c = clip();
//   c.A(0.4, "wiz", "look", { to: [-0.5, 0.1], dur: 0.2 });       // an action: time, who, what, options
//   c.prop(1.2, "stool", { x: 0.2 }, 0.8);                          // a prop tween
//   c.sfx(1.25, "scrape", { gain: 0.4 });  c.cap(0, 3, "That friend who never looks up.", 250);
//   const beats = c.beats([["hook", 0, SHOT_A, "hook"], ["payoff", 6, SHOT_B]], 12);
//   write(import.meta.url, { id: "my-clip", ...meta, cast, props, captions: c.captions, beats });
//
// Acting loops built on it live in acting.mjs; a new clip starts from templates/clip-template.mjs.
import { writeFileSync } from "node:fs";

export const r3 = (x) => Math.round(x * 1000) / 1000;

export function clip() {
  const items = [], captions = [];
  const at = (t, it) => items.push({ ...it, at: r3(t) });
  const A = (t, who, what, o = {}) => at(t, { who, do: what, ...o });
  return {
    items, captions, at, A,
    prop: (t, id, set, dur = 0.3, ease = "inOut") => at(t, { do: "prop", id, set, dur, ease }),
    sfx: (t, s, o = {}) => at(t, { sfx: s, ...o }),
    arm: (t, who, side, pose, dur, ease) => A(t, who, "arm", { side, pose, dur, ...(ease && { ease }) }),
    still: (t, who, dur, idle = 0.12) => A(t, who, "still", { dur, idle }),
    say: (t, who, line, dur, tone = "calm") => A(t, who, "talk", { line, tone, dur }),
    macro: (t, who, macro, o = {}) => at(t, { who, macro, ...o }),
    cap: (from, to, text, pos, pop = false) => captions.push({ from: r3(from), to: r3(to), text, pos, pop }),
    // shots: [[name, start, shot | null (keep the camera), kind?], ...] in time order; each beat gets the items from
    // its start up to the next shot, at times relative to that start. Nothing may happen at or after `end`.
    beats(shots, end) {
      items.sort((a, b) => a.at - b.at);
      const late = items.filter((x) => x.at >= end);
      if (late.length) throw new Error(`items after the end: ${JSON.stringify(late.slice(0, 3))}`);
      return shots.map(([name, start, shot, kind], i) => {
        const to = shots[i + 1]?.[1] ?? end;
        const mine = items.filter((x) => x.at >= start - 1e-6 && (i === shots.length - 1 || x.at < to - 1e-6)).map((x) => ({ ...x, at: r3(x.at - start) }));
        return { name, at: start, len: r3(to - start), ...(shot && { shot }), do: mine, ...(kind && { kind }) };
      });
    },
  };
}

// writes <id>.json next to the generator (pass its import.meta.url) and prints the length
export function write(base, sb) {
  writeFileSync(new URL(`./${sb.id}.json`, base), JSON.stringify(sb, null, 1) + "\n");
  console.log(`${sb.id}: ${sb.beats.reduce((s, b) => s + b.len, 0).toFixed(2)} s, ${sb.beats.length} beats`);
}
