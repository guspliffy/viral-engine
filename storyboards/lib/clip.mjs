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
//                    a subtitle ends where the next line's subtitle starts, and where any other caption (c.cap) starts
//                    in the same band, so two texts never stand on each other
//   { blink: false } no automatic blink lands on a line (an eye-blink on a key line kills it); { blink: true } on
//                    one c.say allows it again (the talk action carries blink: false; engine/page/timeline.js
//                    blinkFree reads it)
// Without it c.say writes the talk action alone, as before, so clips made before it produce the same storyboard.
//
// Acting loops built on it live in acting.mjs; a new clip starts from templates/clip-template.mjs.
import { writeFileSync } from "node:fs";

export const r3 = (x) => Math.round(x * 1000) / 1000;
const warnedSay = new Set();
function warnSay(line) {
  if (warnedSay.has(line)) return; warnedSay.add(line);
  console.warn(`c.say: "${line}" asks for a real voice (voice, style or take), but c.say plays gibberish in a beat clip: use c.macro(t, who, "say", { line, tone, style, take, caption: false }) for real speech`);
}

export const SUB_POS = 1180, SUB_STYLE = { size: 62, kinetic: false };
// two captions whose tops are closer than this stand on each other (a two-line subtitle at size 62 is 150-180 px tall)
export const SUB_CLEAR = 180;

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
      // c.say writes a talk action, which a beat clip plays as gibberish: real speech (engine/voice/speech.mjs) reads only
      // the "say" and "narrate" MACROS. A voice name, a VoxCPM2 "style" (a string; the subtitle style is an object) or a
      // "take" asks for real speech, so say so at
      // once (Potato Desk 01, 17 Nov 2026: a whole voice probe ran as gibberish before the macro was found)
      if (typeof o.voice === "string" || typeof o.style === "string" || o.take != null) warnSay(line);
      A(t, who, "talk", { line, tone, dur, ...(blink === false && { blink: false }), ...rest });
      // up 0.4 s past the voice (at least 0.8 s), cut short where the next line's subtitle starts (c.beats)
      if (sub) subs.push(captions[captions.push({ from: r3(t), to: r3(t + Math.max(0.8, dur + 0.4)), text: sub === true ? subText(line) : sub, pos, pop: false, ...style }) - 1]);
    },
    macro: (t, who, macro, o = {}) => at(t, { who, macro, ...o }),
    // real physics (engine/page/physics.js, on with "physics": true): a prop leaves its own tween and becomes a rigid
    // body that tumbles into the set, the cast and other props. o: { v: [x, y, z] m/s, spin: [x, y, z] rad/s, or
    // to: [x, y, z] + in: seconds (aimed: it gets there in that time, so it lands on its sound) }. A let-go
    // ("release") is a body on its own; these are for props no hand holds
    drop: (t, id, o = {}) => at(t, { do: "physics", prop: id, mode: "drop", ...o }),
    throw: (t, id, o = {}) => at(t, { do: "physics", prop: id, mode: "throw", ...o }),
    knock: (t, id, o = {}) => at(t, { do: "physics", prop: id, mode: "knock", ...o }),
    // the world's gravity eases to g (m/s², up +: 0 is zero-g, -9.81 normal) over dur; damp: air drag per second
    float: (t, g = 0, o = {}) => at(t, { do: "physics", mode: "float", g, ...o }),
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
      // ... and to any other caption that starts while it is up and would stand on it (a narrator's c.cap in the same
      // band: Fight, Flight or Freeze 01, 11 Nov 2026, two subtitles on each other for 3 frames, which cost a second
      // farm render). Text pops and cards sit elsewhere on purpose; a caption SUB_CLEAR px or more away is clear
      const others = captions.filter((k) => !subs.includes(k) && !k.pop && !k.card && k.pos != null);
      for (const s of subs) {
        const n = others.filter((k) => k.from > s.from && k.from < s.to && Math.abs(k.pos - s.pos) < SUB_CLEAR).sort((x, y) => x.from - y.from)[0];
        if (n) s.to = r3(n.from);
      }
      // every shot starts ON a frame (Potato Desk 11, 20 Nov 2026): the renderer shows a shot from the first frame with
      // t >= its start, so a start r3 rounded UP (31.36667 -> 31.367) cut one frame late, and every hide, show, place or
      // prop set a director put at "start - 0.02" (on purpose before the cut) showed on the OLD shot's last frame: Sol
      // found 6 such one-frame pops in two rounds (costumes, an ice bag, a mug, the LCD). Snap each start down to its frame
      const onFrame = (x) => (x <= 0 ? x : Math.floor(Math.floor(x * fps + 1e-6) / fps * 1000 + 1e-6) / 1000);
      shots = shots.map(([name, start, ...rest]) => [name, onFrame(start), ...rest]);
      // every caption ends at the next cut (Potato Desk 11, Sol rounds 1-2, 20 Nov 2026: a line's caption carried into the
      // next shot over a face or the set's board, 6 of 40 findings). A caption made to run across cuts says so: across: true
      const cutAt = shots.map((k) => k[1]).filter((t) => t > 0).sort((x, y) => x - y);
      // ... but two cases lost whole narrator lines (Earth spins faster, Sol round 1, 21 Nov 2026: 9 of 29 findings): a line
      // spoken on a cut, its caption led in 0.12 s before it, was cut to a 0.1 s flash in the old shot and never showed;
      // a two-sentence line ended at a cut mid-line lost its second sentence. So a caption that starts under 0.3 s before
      // a cut starts ON the cut, and one the cut would leave under 60 % of its time keeps running across it (the
      // caption-overlap check still guards the faces of the next shot)
      for (const k of captions) {
        if (k.pop || k.card || k.across) continue;
        const lead = cutAt.find((t) => t > k.from && t - k.from < 0.3 && t < k.to - 0.3);
        if (lead != null) k.from = r3(lead);
        const nx = cutAt.find((t) => t > k.from + 0.1);
        if (nx != null && k.to > nx && (nx - k.from) >= 0.6 * (k.to - k.from)) k.to = r3(nx - 0.02);
      }
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
