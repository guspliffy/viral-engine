// The series overlays (engine/page/hud.js, engine/page/card.js): a HUD with the day, clock and battery, rule cards and
// a picture rule card (no words, Share or Steal) at t for dur s: top = the two playing cards ["share" | "steal", ...], bottom
// = the two icons ["gold" | "fire", ...]. o: { x (the card's centre, px, default the safe zone's centre), y (top edge px,
// default 300), w (width px, default 290; height 1.28 w) }. Pops in over 0.18 s, fades over its last 0.12 s.
export function picrule(c, t, dur, top, bottom, o = {}) { c.at(t, { fx: "picrule", dur, top, bottom, ...o }); }

// the comment-vote end card. All opt-in; times are story time.
//
//   import { hud, rule, picrule, vote } from "../lib/overlay.mjs";
//   const HUD = hud({ day: 1, clock: [[0, "18:05"], [4.2, "18:31", 0.5]], battery: [[0, 41], [5.0, 30, 0.12]], part: 1 });
//   rule(c, 3.1, 1.6, "RULE 1", "Never let Dragon cook", { who: "dra" });
//   picrule(c, 0.3, 2.0, ["steal", "share"], ["gold", "fire"], { x: 540, y: 300 });
//   vote(c, 14.0, 3.0, "PART 2: who goes into the jungle for food?", [["A", "Viking", "vik"], ["B", "Reaper", "rea"]]);
//   write(import.meta.url, { ..., hud: HUD, beats });
//
// A key is [t, value, dur?]: from t the value counts from the previous key's value over dur seconds (none: it jumps).

// the "hud" block: day / battery a number or keys, clock "HH:MM" or keys; pos "top" | "bottom", or y (px); show: [from, to]
// label: a small yellow line under DAY ("SURVIVE IT"); threat: { kind: "snow", keys } (metres, a house chip under the
// day); gauge: { kind: "warmth", keys } (°C, a thermometer after the clock). engine/page/hud.js has the details.
// Skip remote (Happiness EP02), both opt-in: age: keys [[0, 25], [4.1, 31], [15.2, 25, 1.5]] or { keys, fade: [from, dur] }
// (cake icon + number + life bar, a chip at x 72-372, y 214-332; a rise counts 0.4 s with a "+N" tag, a fall 1.5 s with a
// green "-N"); pills: [17.2, 19.4] or { show: [17.2, 19.4] } (the YES / NO question pills, x 420-900).
// money: keys [[t, dollars, dur?]] or { keys, in, fade: [from, dur], y } (a counter and 10 sack pips in the strip y 344-462);
// sun: { p: keys of 0-1 along the arc, last: [from, to] (the last minute "1:00" -> "0:00"), in, fade, y } (passed through as given).
export function hud({ day, clock, battery, part, label, threat, gauge, age, pills, money, sun, pos, y, show, clockTag } = {}) {
  return { ...(day != null && { day }), ...(clock != null && { clock }), ...(battery != null && { battery }), ...(part != null && { part }),
    ...(label && { label }), ...(threat && { threat }), ...(gauge && { gauge }),
    ...(age != null && { age: Array.isArray(age) ? { keys: age } : age }), ...(pills && { pills: Array.isArray(pills) ? { show: pills } : pills }),
    ...(money && { money }), ...(sun && { sun }),
    ...(pos && { pos }), ...(y != null && { y }), ...(show && { show }), ...(clockTag === false && { clockTag: false }) };
}

// a rule card slammed in at t for dur s: title (e.g. "RULE 1") in who's caption colour (else yellow), text in white.
// o: { who, color, y (top edge px, default 300), angle (degrees, default -3) }
export function rule(c, t, dur, title, text, o = {}) { c.at(t, { fx: "rule", dur, title, text, ...o }); }

// the comment-vote end card at t for dur s (give it the rest of the clip to hold it to the last frame). options:
// [["A", "Viking", "vik"], ...] or [{ key, text, who }]; o: { prompt (default "Comment A or B"; false: none), y (top
// edge px, default 330) }
export function vote(c, t, dur, question, options, o = {}) {
  const opts = options.map((x, i) => (Array.isArray(x) ? { key: x[0] ?? String.fromCharCode(65 + i), text: x[1], ...(x[2] && { who: x[2] }) } : x));
  c.at(t, { fx: "vote", dur, question, options: opts, ...o });
}
