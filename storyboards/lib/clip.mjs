// The clip builder every generator shares: write a clip's actions on one absolute timeline, list its shots, and
// get a beat storyboard back (docs/STORYBOARD.md). It replaces the helpers each generator used to copy.
//
//   import { clip, write } from "../lib/clip.mjs";
//   const c = clip();
//   c.A(0.4, "wiz", "look", { to: [-0.5, 0.1], dur: 0.2 });       // an action: time, who, what, options
//   c.prop(1.2, "stool", { x: 0.2 }, 0.8);                          // a prop tween
//   c.sfx(1.25, "scrape", { gain: 0.4 });  c.cap(0, 3, "That friend who never looks up.", 250);
//   c.textPop(6.1, "rea", "gulp", { dur: 0.8 });                    // a comic word beside a head
//   const beats = c.beats([["hook", 0, SHOT_A, "hook"], ["payoff", 6, SHOT_B]], 12);
//   write(import.meta.url, { id: "my-clip", ...meta, cast, props, captions: c.captions, beats, hitStop: c.hitStops });
//
// clip({ faces: "strong" }) makes the acting loops play stronger faces and hold them longer (Jonny's pick from the
// quality lab, 30 Oct); c.hitStop(t) freezes the picture for three frames there (engine/shared/holds.js).
// clip({ lines: LINES }) sets how c.say lines play (the clip template's defaults, quality plan item 5, 5 Nov 2026):
//   { sub: true }    every line gets a subtitle, gibberish included (Jonny, 4 Nov: "every gibberish line gets a
//                    subtitle"), at `pos` (y in px; default 1180, low, clear of the title Jonny adds at the top in the
//                    app) in `style` (default { size: 62, kinetic: false }, as the friends-try-to episodes);
//                    c.say(..., { sub: "Mine!" }) gives the subtitle its own text, { sub: false } leaves one out
//   { blink: false } no automatic blink lands on a line (an eye-blink on a key line kills it); { blink: true } on
//                    one c.say allows it again (the talk action carries blink: false; engine/page/timeline.js
//                    blinkFree reads it)
// Without it c.say writes the talk action alone, as before, so clips made before it produce the same storyboard.
//
// Acting loops built on it live in acting.mjs; a new clip starts from templates/clip-template.mjs.
import { writeFileSync } from "node:fs";

export const r3 = (x) => Math.round(x * 1000) / 1000;

export const SUB_POS = 1180, SUB_STYLE = { size: 62, kinetic: false };

export function clip({ faces = "normal", fps = 30, lines = null } = {}) {
  const items = [], captions = [], hitStops = [], visible = [], subs = [];
  const at = (t, it) => items.push({ ...it, at: r3(t) });
  const A = (t, who, what, o = {}) => at(t, { who, do: what, ...o });
  return {
    items, captions, hitStops, visible, at, A, faces, fps, lines,
    // what the viewer must see from t0 to t1 (qa/framing.mjs, checked from the layout before any render):
    // ["rea.face", "scythe", "wiz"] = Reaper's face clear, the scythe, the Wizard's body; goes in the storyboard as
    // "visible": c.visible
    see: (t0, t1, what, why, through) => visible.push({ from: r3(t0), to: r3(t1), see: [].concat(what), ...(why && { why }), ...(through && { through: [].concat(through) }) }),
    // a hit-stop: the whole picture holds for `frames` frames from t (snapped to a frame), then the clip carries on;
    // the video gets that much longer and every sound after it moves with its picture
    hitStop: (t, frames = 3) => hitStops.push({ at: r3(Math.round(t * fps) / fps), frames }),
    prop: (t, id, set, dur = 0.3, ease = "inOut") => at(t, { do: "prop", id, set, dur, ease }),
    sfx: (t, s, o = {}) => at(t, { sfx: s, ...o }),
    arm: (t, who, side, pose, dur, ease) => A(t, who, "arm", { side, pose, dur, ...(ease && { ease }) }),
    still: (t, who, dur, idle = 0.12) => A(t, who, "still", { dur, idle }),
    // a line of dialogue: the talk action (the voice and the mouth), plus what clip({ lines }) asks for: a subtitle
    // and no blink on the line. o: { sub (text | false), pos, style, blink, voice, gain } for this line only
    say(t, who, line, dur, tone = "calm", o = {}) {
      const L = lines || {}, { sub = L.sub, pos = L.pos ?? SUB_POS, style = L.style ?? SUB_STYLE, blink = L.blink, ...rest } = o;
      A(t, who, "talk", { line, tone, dur, ...(blink === false && { blink: false }), ...rest });
      // up 0.4 s past the voice (at least 0.8 s), cut short where the next line's subtitle starts (c.beats)
      if (sub) subs.push(captions[captions.push({ from: r3(t), to: r3(t + Math.max(0.8, dur + 0.4)), text: sub === true ? subText(line) : sub, pos, pop: false, ...style }) - 1]);
    },
    macro: (t, who, macro, o = {}) => at(t, { who, macro, ...o }),
    cap: (from, to, text, pos, pop = false, o = {}) => captions.push({ from: r3(from), to: r3(to), text, pos, pop, ...o }),
    // a text pop: one comic word beside a character's head (docs/STORYBOARD.md, "Text pops")
    textPop: (t, who, text, o = {}) => at(t, { fx: "pop", text, who, ...o }),
    // shots: [[name, start, shot | null (keep the camera; in a directed clip, the beat's kind picks it), kind?], ...]
    // in time order (a shot can also be "keep", a size like "close", or { size, who }); each beat gets the items from
    // its start up to the next shot, at times relative to that start. Nothing may happen at or after `end`.
    beats(shots, end) {
      items.sort((a, b) => a.at - b.at);
      const late = items.filter((x) => x.at >= end);
      if (late.length) throw new Error(`items after the end: ${JSON.stringify(late.slice(0, 3))}`);
      // a line's subtitle gives way to the next one (two quick lines: "mine!", "nuh-uh!") and ends with the clip
      subs.sort((a, b) => a.from - b.from).forEach((s, i) => { s.to = r3(Math.min(s.to, subs.slice(i + 1).find((n) => n.from > s.from)?.from ?? end, end)); });
      return shots.map(([name, start, shot, kind], i) => {
        const to = shots[i + 1]?.[1] ?? end;
        const mine = items.filter((x) => x.at >= start - 1e-6 && (i === shots.length - 1 || x.at < to - 1e-6)).map((x) => ({ ...x, at: r3(x.at - start) }));
        return { name, at: start, len: r3(to - start), ...(shot && { shot }), do: mine, ...(kind && { kind }) };
      });
    },
  };
}

// a line's subtitle text: the line with a capital first letter ("mine! mine!" -> "Mine! mine!")
export const subText = (line) => line.charAt(0).toUpperCase() + line.slice(1);

// a camera on `target` from azimuth az (degrees round y, 0 = straight from the front, - = from the left) and elevation
// el, far enough that the frame is h metres tall at the target with lens fov; push (0..1) moves it that share of the
// way in over dur seconds (Don't Touch the Charger, Dragon vs. the Candle)
export function frame(target, { az = 0, el = 0, h = 1, fov = 20, push = 0, dur = 0 } = {}) {
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180, d = h / 2 / Math.tan((fov * Math.PI) / 360);
  const dir = [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)];
  const pos = target.map((v, i) => r3(v + dir[i] * d));
  return { pos, look: target.map(r3), fov, ...(push && { to: { pos: target.map((v, i) => r3(v + dir[i] * d * (1 - push))) }, dur }) };
}

// writes <id>.json next to the generator (pass its import.meta.url) and prints the length
export function write(base, sb) {
  writeFileSync(new URL(`./${sb.id}.json`, base), JSON.stringify(sb, null, 1) + "\n");
  console.log(`${sb.id}: ${sb.beats.reduce((s, b) => s + b.len, 0).toFixed(2)} s, ${sb.beats.length} beats`);
}
