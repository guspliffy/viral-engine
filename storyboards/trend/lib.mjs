// Shared helpers for the trend clips of 25 Oct (HAUNTED HOUSE, HOW TO CATCH ME, TOO BUSY TO NOTICE): all three are
// "each fighter, one continuous scene" clips. Write the clip as one timeline in absolute seconds, mark where each
// fighter's turn starts with turn(), and finish() cuts it into a beat storyboard (docs/STORYBOARD.md) with the house
// captions: a pinned title, a small line under it, each fighter's name and their habit while it's their turn, and the
// question at the end.
import { writeFileSync } from "node:fs";

export const r3 = (x) => Math.round(x * 1000) / 1000;
export const NAMES = { ast: "ASTRONAUT", rea: "REAPER", sor: "SORCERER", wiz: "WIZARD", dra: "DRAGON", phx: "PHOENIX", gun: "GUNSLINGER", sam: "SAMURAI", all: "ALLFATHER", vik: "VIKING" };
export const CHARACTER = { ast: "astronaut", rea: "reaper", sor: "sorcerer", wiz: "wizard", dra: "dragon", phx: "phoenix", gun: "gunslinger", sam: "samurai", all: "allfather", vik: "viking" };

export function clip(meta) {
  const sb = { fps: 30, look: "anime-pro", sound: { sfx: 0.5 }, loop: true, cast: [], beats: [], shots: [], captions: [], props: [], allowClip: [], ...meta };
  const items = [], turns = [];
  const c = {
    sb, items, turns,
    A: (who, t, what, o = {}) => { items.push({ who, do: what, at: r3(t), ...o }); return t; },
    arm: (who, t, side, pose, dur, ease) => items.push({ who, do: "arm", at: r3(t), side, pose, dur, ...(ease && { ease }) }),
    prop: (id, t, set, dur = 0.3, ease = "inOut", extra = {}) => items.push({ do: "prop", id, at: r3(t), dur, ease, set, ...extra }),
    fx: (t, kind, o = {}) => items.push({ fx: kind, at: r3(t), ...o }),
    sfx: (t, s, o = {}) => items.push({ sfx: s, at: r3(t), ...o }),
    walk: (who, t, to, dur, ease = "inOut", steps = 3) => items.push({ who, do: "move", at: r3(t), to, dur, ease, steps }),
    // a prop rides on another prop (a raven's beak) from t; by: null lets it go there
    carry: (id, t, by, off) => items.push({ do: "carry", prop: id, at: r3(t), ...(by && { by, off }) }),
    grab: (who, id, hand, t, o = {}) => items.push({ who, do: "grab", prop: id, hand, at: r3(t), dur: 0.01, ...o }),
    addProp: (p) => { sb.props.push(p); return p.id; },
    // a fighter in the cast, standing at `at`; hidden from the start unless shown
    cast(id, at, o = {}) {
      const { hidden, ...rest } = o;
      sb.cast.push({ id, character: `potatobrawl/${CHARACTER[id]}`, at, face: "camera", expr: "kind", seed: 1.1 + sb.cast.length * 0.7, ...rest });
      c.A(id, 0, "noblink");
      if (hidden) c.A(id, 0, "hide");
    },
    // o.capAt: when the habit line pops (default: with the name), o.capTo: when it ends (default: the next turn)
    turn: (id, at, habit, o = {}) => turns.push({ id, at: r3(at), habit, capAt: o.capAt, capTo: o.capTo }),
    extraCaps: [],
    caption: (from, to, text, o = {}) => c.extraCaps.push({ from: r3(from), to: r3(to), text, pop: false, ...o }),
    allow: (who, w, from, to, reason) => sb.allowClip.push({ who, ...(w && { with: w }), from: r3(from), to: r3(to), reason }),
    finish(end, { shot, moves = [], title, sub, ask, askAt, namesTo, cover, file, at = {}, size = {} }) {
      const Y = { title: 232, sub: 318, name: 408, habit: 492, ask: 430, ...at };
      end = r3(end);
      turns.sort((x, y) => x.at - y.at);
      const late = items.filter((x) => x.at >= end);
      if (late.length) throw new Error(`items after the end (${end}): ${JSON.stringify(late.slice(0, 3))}`);
      for (const [i, b] of turns.entries()) {
        const nextAt = turns[i + 1]?.at ?? end, mine = items.filter((x) => (x.at >= b.at || i === 0) && x.at < nextAt);
        sb.beats.push({ name: `${b.id}: ${b.habit}`, at: b.at, len: r3(nextAt - b.at), do: mine.map((x) => ({ ...x, at: r3(x.at - b.at) })) });
      }
      sb.duration = end;
      sb.shots.push({ at: 0, ...shot }, ...moves);
      const a = r3(askAt);
      sb.captions.push({ from: 0, to: end, text: title, style: "label", pos: Y.title, ...(size.title && { size: size.title }), pop: false });
      if (sub) sb.captions.push({ from: 0, to: a, text: sub, style: "sub", pos: Y.sub, pop: false });
      for (const [i, b] of turns.entries()) {
        const nt = namesTo != null ? r3(namesTo) : a, from = i ? b.at : 0, to = Math.min(i === turns.length - 1 ? nt : turns[i + 1].at, nt);
        if (to - from > 0.2) {
          sb.captions.push({ from, to, text: NAMES[b.id], style: "label", pos: Y.name, ...(size.name && { size: size.name }), pop: false });
          const hf = b.capAt != null ? r3(b.capAt) : from, ht = b.capTo != null ? Math.min(r3(b.capTo), to) : to;
          if (ht - hf > 0.2) sb.captions.push({ from: hf, to: ht, text: b.habit, pos: Y.habit, ...(size.habit && { size: size.habit }), pop: b.capAt != null });
        }
      }
      sb.captions.push(...c.extraCaps.map((x) => ({ pos: Y.habit, ...x })));
      sb.captions.push({ from: a, to: end, text: ask, pos: Y.ask });
      sb.cover = r3(cover);
      if (end > 20) sb.escalation = true;
      writeFileSync(file, JSON.stringify(sb, null, 1));
      console.log(`${sb.id}: ${end} s, ${turns.length} turns: ${turns.map((b) => `${b.id} ${b.at}`).join(", ")}`);
    },
  };
  return c;
}
