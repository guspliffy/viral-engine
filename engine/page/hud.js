// A series HUD (opt-in, top-level "hud"): the day, a clock and a phone battery in two small chips, for numbered
// parts ("Survive it" day 1, 18:05, 41 %). Story time, so a hit-stop or freeze frame stops the clock with the picture.
//
//   "hud": { "day": [[0, 1]], "clock": [[0, "18:05"], [4.2, "18:31", 0.5]],
//            "battery": [[0, 41], [5.0, 30, 0.12], [5.8, 1, 0.12], [6.4, 0]], "part": 1, "pos": "top" }
//
// Each key is [t, value, dur?]: from t the value counts from the previous key's value to its own over dur seconds (no
// dur: it jumps). day and battery also take a plain number, clock a plain "HH:MM". A clock jump shows a small "+26 min"
// tag beside it for a second ("clockTag": false turns it off). The battery is green, amber under 20 %, red under 10 %,
// and at 0 reads DEAD and blinks twice; its chip gives a little kick on every drop. "part" adds a small PART line
// under the day. "show": [from, to] limits it to part of the clip.
//
// Survive it EP1 (9 Nov 2026) adds three opt-in parts, nothing changes without them: "label": "SURVIVE IT" (a small
// yellow line under DAY, like "part"); "threat": { "kind": "snow", "keys": [[t, metres, dur?]] } (a second chip under
// the day chip: a little house whose blue fill rises with the snow, buried at 7 m, "SNOW 2.0 m", red text from 7 m,
// a kick on every rise); "gauge": { "kind": "warmth", "keys": [[t, celsius, dur?]] } (a thermometer and "12 °C" after
// the clock in the right chip: green, amber under 8, blue under 0).
// You wake up mid EP03 (13 Nov 2026) adds "ammo": { "keys": [[t, rounds]], "max": 6 } (opt-in): a row of cartridges
// first in the right chip, brass while loaded, a faint outline once fired; a drop kicks the chip and the slot just
// fired glows red for 0.4 s. A counter that needs no English (82 % of the TikTok viewers are DACH).
//
// Happiness score film (16 Nov 2026) adds two opt-in chips, for a clip whose clock is a score and a train (nothing
// changes without them; both also work with the day/clock/battery chips, stacking under them):
//   "own":   keys | { "keys": [[0, 41], [42, 40], [43, 39]], "out": [172, 0.5] }
//   "train": keys | { "keys": [[6, "SUN 19:42"], [100, "09:12"], [150, "00:58", 12], [190, "00:00", 5]],
//                     "out": [194, 1], "day": 3 }
// own: Spud's own score, a glasses glyph (two #e6cf8a rings) + the number. Keys are [t, number]; the chip appears
// (0.25 s pop) at the first key, and every later key that changes the number is a check: odometer tick over 5 frames (old
// number slides down 40 % of the chip height and fades, the new one drops in; the colour steps at frame 3) and the house
// kick (scale 1.06, 0.15 s). The number is coloured by the tag's 4 steps: <= 35 #cbb98a, 36-60 #e6cf8a, 61-85 #f3dc8c,
// >= 86 #ffe9a3. "out": [t, dur = 0.5] fades the chip out for good (the glasses lift); nothing replaces it.
// train: the countdown to Mash's train, a locomotive-front pictogram + text, and 4 day pips (Thu Fri Sat Sun) in a row
// under the text, inside the chip (r 7, 12 px between pips; done days #fff8ec, today #e6cf8a, later ones outline only).
// Keys are [t, value, dur?]. A value with letters ("SUN 19:42") is a label, shown as it is; a "MM:SS" string (or a plain
// number of seconds) is the countdown: from the previous countdown key's value it counts down linearly over dur (no
// dur: it jumps), shown as MM:SS in fixed digit cells. Under 01:00 the text is amber #ffb648. The chip slides in from
// the right over 0.3 s at the first key; a label <-> countdown change rolls the text like the own chip's tick; the
// countdown reaching 00:00 gives one kick (scale 1.08, 0.2 s; the whistle is the director's sound cue); no blink.
// The pips' today is the last label's first three letters (THU FRI SAT SUN); "day": 0-3 sets it for the whole clip
// (default Sunday with no label). "out": [t, dur = 0.5] fades the chip out for good.
//
// Placement follows the frame (shared/frame.js): tall as below; "frame": "wide" (1920 x 1080) puts the same chips in
// frameSafe's corners, y 40 on top (y 888 for "bottom"): own at x 80, train's right edge at x 1840, DAY at x 92.
// Tall own chip: x 60, y 214; train right edge x 920, y 214. A chip's "y" override ("hud": { "y": n }) moves them all.
// Skip remote (Happiness EP02) adds two opt-in parts, nothing changes without them (design: DESIGN.md section 3). A clip
// without "age" or "pills" draws exactly as before.
//   "age": { "keys": [[0, 25], [4.1, 31], [9.0, 61], [15.2, 25, 1.5]], "fade": [40.2, 1.0] }
//   "pills": { "show": [17.2, 19.4] }
// age = the video's clock, no English: a birthday-cake icon (3 candle flames under 50, 1 from 50), the number in big
// digits and a life bar (90 - age) / 90 (green over 50 %, amber 25-50, red under 25) in a chip at x 72-372, y 214-332
// (the y key moves it). Keys [t, value, dur?]: a RISE counts up over dur (default 0.4 s) from the key's time, the chip
// kicks 6 px, the number flashes yellow and scales 1.18 -> 1, the lost chunk of the bar flashes for 0.35 s and a
// "+N" tag shows right of the chip for 0.9 s. A FALL (the roll-back) counts down over dur (default 1.5 s, eased in,
// one whole number per frame, the bar refilling) and a green "-N" tag shows for 1.0 s from the moment it lands. dur 0 jumps.
// "fade": [from, dur = 1] fades the chip out. The "+N" tag is 388-490 px wide: keep a jump key clear of the pills.
// pills = the "YES" / "NO" question pills x 420-900, y 214-332 (green YES, red NO, a small "or" between): fade in over
// 0.2 s at show[0], out over 0.2 s ending at show[1]. "pills": [from, to] works too.
// "The money counter" (happiness EP01, 15 Nov 2026) adds two opt-in parts for the race, drawn as their own chips in the strip
// y 344-462 (no English: a dollar sign, digits, sacks, a sun on an arc, an hourglass; everything is a pure function of story time):
//   "money": [[0.1, 10000000], [6.9, 9997000, 0.35], [14.6, 8000000, 0.45], [36.0, 0, 0.5]]      (or { keys, in, fade, y })
//   "sun":   { "p": [[0.1, 0.02], [14.0, 0.34, 0.4], [36.0, 1.0, 0.4]], "last": [23.2, 36.0] }   (or a plain key array = p only)
// money: chip at x 72 (380 wide): "$10,000,000" (CapBlack 58) and 10 sack pips, one million each (pip k fills from its bottom by
// clamp(v / 1e6 - (k - 1)); pip 1 is the last to empty). A key that lowers the value runs the number down over its dur, kicks the
// chip 5 px down and back (0.18 s) and glows every sack that empties for 0.4 s; nothing is red. A key that reaches 0 flashes the
// number and pip 1 red twice (0.15 s on / off), runs to $0 and drops the chip to 0.45 opacity.
// sun: chip with its right edge at x 908 (150 wide): a quarter arc of r 76 from straight up (noon) clockwise to a sea line;
// p 0-1 is the sun's way along it (keys as the battery's: give each cut a dur 0.4 so the sun slides), colour #ffe066 -> #ffd04a
// -> #ffb23d -> #ff7a3a (no rays from 0.85), cut by the sea line, half sunk at p 1. "last": [from, to] adds the last minute: at
// `from` the chip grows to 292 (0.2 s) and an hourglass with "1:00" pops in and runs to "0:00" at `to` (red under 0:10, with the
// chip's edge pulsing red twice a second); the chip drops to 0.45 opacity at `to`.
// Both: "in" (pop-in time, default the first key; scale 0.9 -> 1 in 0.18 s), "fade": [from, dur] (default none), "y" (top, default 344).
//
// Laugh strength (There's a catch EP10, 18 Nov 2026) adds one opt-in chip, nothing changes without it:
//   "strength": keys | { "keys": [[0.5, 10000], [2.5, 1000000], [3.2, 10000]], "drain": [[3.0, 1, 1.0]], "out": [4.5, 0.5] }
// strength: the street twin of the gym's wall board (props-gymlaugh.js strengthboard): the flexed-arm pictogram (72 px tall)
// and the number "x" + whole number with comma thousands ("x1", "x100,000", "x1,000,000"; font 60 px), left-aligned in fixed
// digit cells, so the chip width is set by the widest value in its keys. A 96 px high plate (#171A1F, 85 %), left-anchored at
// frameSafe's left (x 60 tall, x 80 wide; the preflight safe-zone check), y 214 ("y" moves it; under own if both are on), growing to the right
// and never past x 518 (a long value is squeezed to fit). Keys are [t, number]: the chip appears at the first key with a 0.25 s
// pop, but a first key at t <= 0 shows it at full from frame 0 (no pop). Every later key that changes the number is a tick:
// odometer roll over 5 frames (old number slides down and fades, the new one drops in) and a 6-frame kick (scale 1.00 -> 1.18
// -> 1.00). A key that LOWERS the number kicks the chip 5 px down and back instead (like the money counter's fall), still one
// roll. Ink (arm + number) runs #FFC65A -> #E8402F with "drain" [[t, 0..1, dur?]] (linear over dur from the previous drain
// value; no key = 0); the arm's fill is #F2C14E at drain 0. "out": [t, dur = 0.5] fades the chip out for good.
//
// pos "top" (default): DAY in the safe zone's top-left corner and the clock + battery in its top-right, y 214-284, the
// middle left free for Jonny's in-app title. "bottom": the same strip at y 1288-1356 (clear of one-line subtitles at
// 1180). "y" puts its top anywhere. Boxes go to the layout as cards, so qa/framing.mjs sees a face under one.
import { clamp, ease, lerp } from "./util.js";
import { keyed, minutes, nightOf } from "../shared/sky.js";
import { frameSafe, isWide } from "../shared/frame.js";

const CH = 70, PAD = 22, FONT = '900 44px "CapBlack"', SMALL = '800 22px "CapBold"', TAG = '900 30px "CapBlack"';
const GLYPH = 44, PIP_R = 7, PIP_GAP = 12, PIP_W = 4 * PIP_R * 2 + 3 * PIP_GAP;
const THR_FONT = '900 34px "CapBlack"', THR_H = 56;
const CHIP = "rgba(18,16,24,0.66)", EDGE = "rgba(255,255,255,0.16)", TXT = "#fff8ec";

const hhmm = (m) => { const x = ((Math.floor(m + 1e-6) % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`; };
const gap = (d) => (d >= 60 ? `+${Math.floor(d / 60)}h${d % 60 ? ` ${d % 60}m` : ""}` : `+${d} min`);

// ---- the score film's chips (own, train)
const STR_MAXR = 540, STR_H = 96, STR_PAD = 20, STR_GLYPH = 52, STR_GAP = 14, STR_FONT = '900 60px "CapBlack"', STR_PLATE = "rgba(23,26,31,0.85)";
const TICK = 5 / 30, ROLL = 0.4 * CH, AMBER = "#ffb648", SGOLD = "#e6cf8a", DAYS = ["THU", "FRI", "SAT", "SUN"];
const specKeys = (s) => (Array.isArray(s) ? s : s && Array.isArray(s.keys) ? s.keys : null);
const fadeOut = (o, t) => (o ? 1 - clamp((t - o[0]) / Math.max(o[1] ?? 0.5, 1e-6)) : 1);
const ownColour = (v) => (v <= 35 ? "#cbb98a" : v <= 60 ? "#e6cf8a" : v <= 85 ? "#f3dc8c" : "#ffe9a3");
const isLabel = (v) => /[A-Za-z]/.test(String(v));
const secsOf = (v) => { if (typeof v === "number") return v; const [m, s = 0] = String(v).split(":").map(Number); return m * 60 + s; };
const mmss = (n) => { const x = Math.max(0, Math.round(n)); return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`; };
const idxSorted = (K, t) => { let i = -1; for (let j = 0; j < K.length; j++) if (K[j][0] <= t + 1e-9) i = j; return i; };
// a train key's end text: a label as it is, a countdown as MM:SS
const trainEnd = (k) => (isLabel(k[1]) ? String(k[1]) : mmss(secsOf(k[1])));

function ownState(H, t) {
  const spec = specKeys(H.own);
  if (!spec || !spec.length) return null;
  const K = spec.map((k) => [k[0], Math.round(Number(k[1]))]).sort((a, b) => a[0] - b[0]);
  const i = idxSorted(K, t), a = fadeOut(H.own.out, t);
  if (i < 0 || a <= 0) return null;
  const since = t - K[i][0], changed = i > 0 && K[i][1] !== K[i - 1][1];
  const nd = Math.max(2, ...K.map((k) => String(k[1]).length));
  return {
    v: K[i][1], nd, a,
    born: t - K[0][0] < 0.25 ? t - K[0][0] : null,
    tick: changed && since < TICK ? since : null, prev: changed && since < TICK ? K[i - 1][1] : null,
    kick: changed && since < 0.15 ? since : null,
  };
}
const withCommas = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
function strengthState(H, t) {
  const spec = specKeys(H.strength);
  if (!spec || !spec.length) return null;
  const K = spec.map((k) => [k[0], Math.max(0, Math.round(Number(k[1])))]).sort((a, b) => a[0] - b[0]);
  const i = idxSorted(K, t), a = fadeOut(H.strength.out, t);
  if (i < 0 || a <= 0) return null;
  const since = t - K[i][0], changed = i > 0 && K[i][1] !== K[i - 1][1], fell = changed && K[i][1] < K[i - 1][1];
  const D = (Array.isArray(H.strength.drain) ? H.strength.drain : []).map((k) => [k[0], clamp(Number(k[1])), k[2] ?? 0]).sort((x, y) => x[0] - y[0]);
  const di = idxSorted(D, t);
  let drain = 0;
  if (di >= 0) { const from = di > 0 ? D[di - 1][1] : 0, [t0, to, d] = D[di]; drain = d > 0 ? lerp(from, to, clamp((t - t0) / d)) : to; }
  const widest = K.reduce((m, k) => (String(k[1]).length > String(m).length ? k[1] : m), K[0][1]);
  return {
    v: K[i][1], widest: "x" + withCommas(widest), a, drain: Math.round(drain * 1e3) / 1e3,
    born: K[0][0] > 0 && t - K[0][0] < 0.25 ? t - K[0][0] : null,
    tick: changed && since < TICK ? since : null, prev: changed && since < TICK ? K[i - 1][1] : null,
    kick: changed && since < 0.2 ? since : null, fell,
  };
}
function trainState(H, t) {
  const spec = specKeys(H.train);
  if (!spec || !spec.length) return null;
  const K = spec.map((k) => [k[0], k[1], k[2] ?? 0]).sort((a, b) => a[0] - b[0]);
  const i = idxSorted(K, t), a = fadeOut(H.train.out, t);
  if (i < 0 || a <= 0) return null;
  const [t0, val, d] = K[i], since = t - t0, label = isLabel(val), prevK = i > 0 ? K[i - 1] : null;
  let text, secs = null;
  if (label) text = String(val);
  else {
    const to = secsOf(val), from = prevK && !isLabel(prevK[1]) ? secsOf(prevK[1]) : to;
    secs = d > 0 ? lerp(from, to, clamp(since / d)) : to;
    text = mmss(Math.ceil(secs - 1e-6));
  }
  const dayOf = (s) => DAYS.indexOf(String(s).slice(0, 3).toUpperCase());
  let day = H.train.day != null ? H.train.day : 3;
  if (H.train.day == null) for (let j = 0; j <= i; j++) if (isLabel(K[j][1]) && dayOf(K[j][1]) >= 0) day = dayOf(K[j][1]);
  const kindChange = prevK && isLabel(prevK[1]) !== label;
  const zero = !label && secsOf(val) === 0 && since >= d && since - d < 0.2;
  return {
    text, count: !label, amber: !label && Math.ceil(secs - 1e-6) < 60, day, a,
    labels: [...new Set(K.filter((k) => isLabel(k[1])).map((k) => String(k[1])))],
    born: t - K[0][0] < 0.3 ? t - K[0][0] : null,
    flip: kindChange && since < 0.2 ? { since, prev: trainEnd(prevK), prevCount: !isLabel(prevK[1]), prevAmber: !isLabel(prevK[1]) && Math.ceil(secsOf(prevK[1])) < 60 } : null,
    kick: zero ? since - d : null,
  };
}

const shown = (H, t) => !H.show || (t >= H.show[0] && t < H.show[1]);

// what the HUD shows at t (also the frame cache's key for it)
export function hudState(sb, t) {
  const H = sb.hud;
  if (!H || !shown(H, t)) return null;
  const day = keyed(H.day, t), clock = keyed(H.clock, t, minutes), bat = keyed(H.battery, t);
  const out = { pos: H.pos || "top", y: H.y };
  if (isWide(sb)) out.wide = true;   // only set on a wide frame, so a tall clip's cache key never changes
  const own = ownState(H, t), train = trainState(H, t), str = H.strength ? strengthState(H, t) : null;
  if (own) out.own = own;
  if (str) out.strength = str;
  if (train) out.train = train;
  if (day) out.day = { n: Math.round(day.v), since: day.since };
  if (H.part != null) out.part = H.part;
  if (H.label) out.label = String(H.label);
  const thr = H.threat ? keyed(H.threat.keys, t) : null, gau = H.gauge ? keyed(H.gauge.keys, t) : null;
  if (thr) { const rose = thr.i > 0 && thr.K[thr.i][1] > thr.K[thr.i - 1][1]; out.threat = { kind: H.threat.kind || "snow", v: thr.v, kick: rose && thr.since >= 0 ? thr.since : null }; }
  if (gau) out.gauge = { kind: H.gauge.kind || "warmth", v: gau.v };
  const am = H.ammo ? keyed(H.ammo.keys, t) : null;
  if (am) { const fell = am.i > 0 && am.K[am.i][1] < am.K[am.i - 1][1]; out.ammo = { n: Math.max(0, Math.round(am.v)), max: H.ammo.max || 6, kick: fell && am.since >= 0 && am.since < 0.4 ? am.since : null }; }
  if (clock) {
    out.clock = { text: hhmm(clock.v), mins: clock.v };
    // the jump tag: a key that moves the clock on by a minute or more shows "+N min" for a second from its start
    const d = clock.i > 0 ? Math.round(clock.K[clock.i][1] - clock.K[clock.i - 1][1]) : 0;
    if (H.clockTag !== false && d >= 1 && clock.since >= 0 && clock.since < 1.2) out.clock.tag = { text: gap(d), since: clock.since };
  }
  if (bat) {
    const v = clamp(bat.v, 0, 100), dropped = bat.i > 0 && bat.K[bat.i][1] < bat.K[bat.i - 1][1];
    out.battery = { v, pct: Math.round(v), dead: v <= 0.001 && !bat.counting, since: bat.since - (bat.K[bat.i][2] || 0), kick: dropped ? bat.since : null };
  }
  const age = H.age ? ageState(H.age, t) : null;
  if (age) out.age = age;
  const pl = H.pills ? pillsState(H.pills, t) : null;
  if (pl) out.pills = pl;
  if (H.money) { const M = moneyState(H.money, t); if (M) out.money = M; }
  if (H.sun) { const U = sunState(H.sun, t); if (U) out.sun = U; }
  return out;
}

// ---- money + sun (opt-in) ----
const MONEY_Y = 344, STRIP_H = 118, MONEY_X = 72, MONEY_W = 380, SUN_R = 908, SUN_W = 150, SUN_W_LAST = 292, SACK = 1e6, GROW = 0.2;
const MONEY_FONT = '900 58px "CapBlack"', TIMER_FONT = '900 50px "CapBlack"';
const RED = "#ff4d4d", GOLD = "#ffd25a", SACK_FULL = "#e9dcb4";
// pop-in slap (scale 0.9 -> 1 in 0.18 s), fade-out and the opacity alpha shared by both chips
function envelope(P, t, first, dimAt) {
  const tin = P.in ?? first, k = t - tin;
  if (k < 0) return null;
  const fade = P.fade ? 1 - clamp((t - P.fade[0]) / (P.fade[1] ?? 1)) : 1;
  if (fade <= 0) return null;
  const dim = dimAt != null ? clamp((t - dimAt) / 0.3) : 0;
  return { a: Math.min(1, k / 0.1) * fade * (1 - 0.55 * dim), pop: 0.9 + 0.1 * ease("back")(clamp(k / 0.18)), y: P.y ?? MONEY_Y };
}
function moneyState(spec, t) {
  const P = Array.isArray(spec) ? { keys: spec } : spec, mk = keyed(P.keys, t);
  if (!mk) return null;
  const K = mk.K, inOut = ease("inOut");
  // the time a downward key brings the number to level `thr` (the eased run inverted by bisection)
  const crossing = (j, thr) => {
    const [t0, v1, d] = K[j], v0 = K[j - 1][1];
    if (!(d > 0)) return t0;
    const f = (v0 - thr) / (v0 - v1); let lo = 0, hi = 1;
    for (let n = 0; n < 24; n++) { const m = (lo + hi) / 2; if (inOut(m) < f) lo = m; else hi = m; }
    return t0 + hi * d;
  };
  const unit = Math.max(SACK, K[0][1] / 10), glow = [];
  for (let k = 1; k <= 10; k++) {
    let g = 0;
    for (let j = 1; j < K.length; j++) {
      const thr = (k - 1) * unit;
      if (K[j][0] > t || !(K[j - 1][1] > thr && K[j][1] <= thr)) continue;
      const since = t - crossing(j, thr);
      if (since >= 0 && since < 0.4) g = Math.max(g, 1 - since / 0.4);
    }
    glow.push(Math.round(g * 1e3) / 1e3);
  }
  let zt = null;   // the first key that spends the last of it
  for (let j = 1; j < K.length; j++) if (K[j][1] <= 0 && K[j - 1][1] > 0) { zt = K[j][0]; break; }
  if (zt != null && zt > t) zt = null;
  const E = envelope(P, t, K[0][0], zt);
  if (!E) return null;
  const dec = mk.i > 0 && K[mk.i][1] < K[mk.i - 1][1];
  const fs = zt != null ? t - zt : -1;
  return { n: Math.max(0, Math.round(mk.v)), n0: K[0][1], unit, a: E.a, pop: E.pop, y: E.y, glow,
    kick: dec && mk.since >= 0 && mk.since < 0.18 ? mk.since : null, flash: fs >= 0 && fs < 0.6 ? Math.floor(fs / 0.15) % 2 === 0 : false };
}
function sunState(spec, t) {
  const P = Array.isArray(spec) ? { p: spec } : spec, pk = keyed(P.p, t);
  if (!pk) return null;
  const last = P.last, E = envelope(P, t, pk.K[0][0], last ? last[1] : null);
  if (!E) return null;
  const out = { p: pk.v, a: E.a, pop: E.pop, y: E.y, grow: 0 };
  if (last && t >= last[0]) {
    const k = clamp((t - last[0]) / Math.max(1e-6, last[1] - last[0])), s = Math.ceil(60 * (1 - k) - 1e-6), since = t - last[0];
    out.grow = clamp(since / GROW);
    out.timer = { s, k, pop: 0.8 + 0.2 * ease("back")(clamp(since / 0.2)), a: Math.min(1, since / 0.1), red: s < 10, pulse: s < 10 ? 0.5 - 0.5 * Math.cos(t * 4 * Math.PI) : 0 };
  }
  return out;
}
const moneyBox = (M) => [MONEY_X, M.y, MONEY_W, STRIP_H];
const sunBox = (U) => { const w = SUN_W + (SUN_W_LAST - SUN_W) * ease("inOut")(U.grow); return [SUN_R - w, U.y, w, STRIP_H]; };
export const hudKey = (sb, t) => { const s = hudState(sb, t); return s ? JSON.stringify(s, (k, v) => (typeof v === "number" ? Math.round(v * 1e3) / 1e3 : v)) : ""; };

// ---- age (the skip remote's clock) and the YES / NO pills ----
const AGE_RISE = 0.4, AGE_FALL = 1.5, AGE_MAX = 90;
// the age at t from keys [t, value, dur?]: a rise eases out, a fall (the roll-back) eases in
function ageEval(spec, t) {
  const K = (Array.isArray(spec) ? spec : [[0, spec]]).map((k) => [k[0], +k[1], k[2]]).sort((a, b) => a[0] - b[0]);
  K.forEach((k, i) => { const prev = i > 0 ? K[i - 1][1] : k[1]; if (k[2] == null) k[2] = i === 0 || k[1] === prev ? 0 : k[1] > prev ? AGE_RISE : AGE_FALL; });
  let i = -1; for (let j = 0; j < K.length; j++) if (K[j][0] <= t + 1e-9) i = j;
  if (i < 0) return { v: K[0][1], i: -1 };
  const [t0, to, dur] = K[i], prev = i > 0 ? K[i - 1][1] : to, k = dur > 0 ? clamp((t - t0) / dur) : 1;
  const e = to >= prev ? ease("out")(k) : k * k;
  return { v: dur > 0 ? prev + (to - prev) * e : to, i, since: t - t0, dur, prev, to };
}
function ageState(A, t) {
  const spec = Array.isArray(A) ? A : A.keys ?? A;
  const f = Array.isArray(A) || !A.fade ? null : A.fade, fo = f ? (Array.isArray(f) ? f : [f, 1]) : null;
  const fade = fo ? 1 - clamp((t - fo[0]) / (fo[1] || 1)) : 1;
  if (fade <= 0) return null;
  const e = ageEval(spec, t), out = { v: e.v, fade };
  if (e.i > 0 && e.since >= 0 && Math.abs(e.to - e.prev) >= 0.5) {
    const rise = e.to > e.prev, end = rise ? 0.9 : e.dur + 1.0;
    if (e.since < Math.max(end, 0.4) + 0.05) out.key = { rise, since: e.since, dur: e.dur, prev: e.prev, to: e.to };
  }
  return out;
}
function pillsState(P, t) {
  const sh = Array.isArray(P) ? P : P.show;
  if (!sh || t < sh[0] || t >= sh[1]) return null;
  const a = Math.min(clamp((t - sh[0]) / 0.2), clamp((sh[1] - t) / 0.2));
  return { a, pop: t - sh[0] < 0.2 ? t - sh[0] : null };
}
const AGE_BOX = [72, 214, 300, 118], PILLS_BOX = [420, 214, 480, 118];
const AGE_GREEN = "#8fd14f", AGE_AMBER = "#ffb23d", AGE_RED = "#ff4d4d";
const ageColour = (v) => { const f = (AGE_MAX - v) / AGE_MAX; return f > 0.5 ? AGE_GREEN : f >= 0.25 ? AGE_AMBER : AGE_RED; };

// the chips' boxes in output px: { left, threat, right, own, strength, train } ([x, y, w, h] each)
function layout(ctx, S) {
  const safe = frameSafe(S.wide ? { frame: "wide" } : null);
  const y = S.y ?? (S.pos === "bottom" ? safe.y1 - 72 : S.wide ? safe.y0 : 214);
  ctx.save(); ctx.font = FONT; ctx.letterSpacing = "0.5px";
  const dayW = S.day ? ctx.measureText(`DAY ${S.day.n}`).width + PAD * 2 : 0;
  const dig = Math.max(...[..."0123456789"].map((d) => ctx.measureText(d).width)), colon = ctx.measureText(":").width;
  const pctW = Math.max(dig * 3 + ctx.measureText("%").width, ctx.measureText("DEAD").width);
  const gauW = S.gauge ? 26 + 10 + dig * 3 + ctx.measureText("-").width + ctx.measureText(" °C").width : 0;
  const ownW = S.own ? PAD * 2 + GLYPH + 10 + S.own.nd * dig : 0;
  const trainTextW = S.train ? Math.max(dig * 4 + colon, ...S.train.labels.map((l) => ctx.measureText(l).width)) : 0;
  const trainW = S.train ? Math.max(PAD * 2 + GLYPH + 12 + trainTextW, PAD * 2 + PIP_W) : 0;
  ctx.font = STR_FONT; ctx.letterSpacing = "0px";
  const sdig = Math.max(...[..."0123456789"].map((d) => ctx.measureText(d).width)), xW = ctx.measureText("x").width, commaW = ctx.measureText(",").width;
  const cellW = (ch) => (ch === "x" ? xW : ch === "," ? commaW : sdig);
  const strText = S.strength ? [...S.strength.widest].reduce((a, ch) => a + cellW(ch), 0) : 0;
  const strLeft = safe.x0, strK = S.strength ? Math.min(1, (STR_MAXR - strLeft - STR_PAD * 2 - STR_GLYPH - STR_GAP) / strText) : 1;
  const strW = S.strength ? STR_PAD * 2 + STR_GLYPH + STR_GAP + strText * strK : 0;
  ctx.font = THR_FONT; const thrW = S.threat ? 40 + 12 + ctx.measureText("SNOW 0.0 m").width + PAD * 2 : 0;
  ctx.restore();
  const clockW = S.clock ? 34 + 12 + dig * 4 + colon : 0, batW = S.battery ? 56 + 10 + pctW : 0;
  const ammoW = S.ammo ? S.ammo.max * AMMO_STEP - (AMMO_STEP - AMMO_W) : 0;
  const parts = [ammoW, clockW, batW, gauW].filter((w) => w > 0);
  const rw = parts.reduce((a, w) => a + w, 0) + 26 * Math.max(0, parts.length - 1) + PAD * 2;
  const hL = S.part != null || S.label ? CH + 22 : CH;
  const left = S.day || S.part != null || S.label ? [safe.x0 + 12, y, Math.max(dayW, 150), hL] : null;
  const threat = S.threat ? [safe.x0 + 12, y + (left ? hL + 10 : 0), thrW, THR_H] : null;
  const right = S.clock || S.battery || S.gauge || S.ammo ? [safe.x1 - 12 - rw, y, rw, S.ammo ? AMMO_H + 26 : CH] : null;
  // the score film's chips sit in the corners themselves (own x 80 / 60, train's right edge 1840 / 920); next to the
  // older chips they stack under them
  const ownY = y + (left ? hL + 10 : 0) + (threat ? THR_H + 10 : 0), trainY = y + (right ? right[3] + 10 : 0);
  return {
    y, dig, colon, sdig, xW, commaW, strK, clockW, batW, gauW, ammoW, safe, trainTextW,
    left, threat, right,
    own: S.own ? [safe.x0, ownY, ownW, CH] : null,
    strength: S.strength ? [strLeft, ownY + (S.own ? CH + 10 : 0), strW, STR_H] : null,
    train: S.train ? [safe.x1 - trainW, trainY, trainW, CH + 24] : null,
  };
}
export function hudBoxes(ctx, sb, t) {
  const S = hudState(sb, t);
  if (!S) return [];
  const L = layout(ctx, S);
  const oy = (S.y ?? 214) - 214;
  const extra = [S.age && AGE_BOX, S.pills && PILLS_BOX].filter(Boolean).map((b) => [b[0], b[1] + oy, b[2], b[3]]);
  return [L.left, L.threat, L.right, L.own, L.strength, L.train, ...extra, S.money && moneyBox(S.money), S.sun && sunBox(S.sun)].filter(Boolean).map((b) => ({ text: "hud", box: b.map(Math.round), card: true }));
}

function chip(ctx, [x, y, w, h], edge = EDGE, lw = 2, fill = CHIP) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 20);
  ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = edge; ctx.stroke();
}
// digits in fixed cells, so a changing clock or battery never jiggles sideways
function digits(ctx, s, x, y, cell, colon) {
  for (const ch of s) {
    const w = ch === ":" ? colon : ch === "%" ? ctx.measureText("%").width : cell;
    ctx.fillText(ch, x + w / 2, y); x += w;
  }
  return x;
}
// a small sun, sunset or moon for the hour
function sky(ctx, cx, cy, mins) {
  const h = (((mins / 60) % 24) + 24) % 24, night = nightOf(mins) >= 0.5;   // the moon when the window is mostly night (shared/sky.js)
  ctx.save(); ctx.translate(cx, cy);
  if (!night && h >= 6.5 && h < 17) {
    ctx.fillStyle = "#ffd25a"; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#ffd25a"; ctx.lineWidth = 3; ctx.lineCap = "round";
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 13, Math.sin(a) * 13); ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 17); ctx.stroke(); }
  } else if (!night) {
    ctx.fillStyle = "#ff9a4a"; ctx.beginPath(); ctx.arc(0, 4, 12, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = "#ff9a4a"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-16, 8); ctx.lineTo(16, 8); ctx.stroke();
  } else {
    ctx.fillStyle = "#e9e4ff"; ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = "destination-out"; ctx.beginPath(); ctx.arc(6, -4, 11, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
// a little house buried to `fill` (0..1) in blue snow
function house(ctx, x, y, fill) {
  const w = 30, h = 28, roof = 12;
  ctx.save();
  const path = () => { ctx.beginPath(); ctx.moveTo(x, y + roof); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w, y + roof); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); };
  if (fill > 0) { path(); ctx.save(); ctx.clip(); ctx.fillStyle = "#7cc4ff"; ctx.fillRect(x - 2, y + h - (h + 2) * fill, w + 4, (h + 2) * fill + 2); ctx.restore(); }
  path(); ctx.lineWidth = 3.5; ctx.lineJoin = "round"; ctx.strokeStyle = TXT; ctx.stroke();
  ctx.restore();
}
const warmColour = (v) => (v < 0 ? "#7cc4ff" : v < 8 ? "#ffb02e" : "#5fe07a");
// a small thermometer: the stem fills with the warmth's colour
function thermo(ctx, cx, cy, v) {
  const col = warmColour(v), k = clamp((v + 45) / 60);
  ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = TXT;
  ctx.beginPath(); ctx.roundRect(cx - 5, cy - 18, 10, 26, 5); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy + 12, 8, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
  ctx.fillStyle = col; ctx.fillRect(cx - 2, cy + 6 - 20 * k, 4, 20 * k + 2);
  ctx.restore();
}
const AMMO_W = 26, AMMO_H = 74, AMMO_STEP = 38;
// one revolver cartridge standing up, centred on cy: a brass case and a copper nose; spent = a faint outline
function cartridge(ctx, x, cy, live, glow) {
  const w = AMMO_W, h = AMMO_H, nose = 24, y = cy - h / 2;
  const shape = () => { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + nose); ctx.quadraticCurveTo(x, y, x + w / 2, y); ctx.quadraticCurveTo(x + w, y, x + w, y + nose); ctx.lineTo(x + w, y + h); ctx.closePath(); };
  ctx.save();
  if (live) {
    shape(); ctx.fillStyle = "#e0ac46"; ctx.fill();
    ctx.save(); shape(); ctx.clip(); ctx.fillStyle = "#c56f3e"; ctx.fillRect(x - 1, y - 1, w + 2, nose + 1); ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(x + 4, y + nose + 4, 4, h - nose - 12); ctx.restore();
    ctx.fillStyle = "#b9862f"; ctx.fillRect(x - 1, y + h - 7, w + 2, 7);
  } else {
    shape(); ctx.lineWidth = 3; ctx.strokeStyle = glow > 0 ? `rgba(255,77,77,${0.35 + 0.65 * glow})` : "rgba(255,248,236,0.32)"; ctx.stroke();
  }
  ctx.restore();
}
// the glasses glyph (two rings and a bridge), GLYPH px wide, centred on (cx, cy)
function glasses(ctx, cx, cy) {
  ctx.save(); ctx.strokeStyle = SGOLD; ctx.lineWidth = 4; ctx.lineCap = "round";
  for (const dx of [-11, 11]) { ctx.beginPath(); ctx.arc(cx + dx, cy, 9, 0, Math.PI * 2); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(cx, cy - 1, 4, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 20, cy - 2); ctx.lineTo(cx - 22, cy - 6); ctx.moveTo(cx + 20, cy - 2); ctx.lineTo(cx + 22, cy - 6); ctx.stroke();
  ctx.restore();
}
// the flexed arm of the strengthboard face (props-gymlaugh.js drawArm: same outline, metres v up), 72 px tall (about 51 wide), filled `col`
function flex(ctx, cx, cy, col, ink) {
  const s = 72 / 0.34, P = (x, y) => [cx + (x - 0.015) * s, cy - (y - 0.01) * s];
  const pts = [[0.135, -0.16], [-0.02, -0.16], [-0.075, -0.10], [-0.075, 0.07], [-0.10, 0.08], [-0.105, 0.165], [-0.02, 0.18], [0.005, 0.10], [0, 0]];
  ctx.save();
  ctx.beginPath(); ctx.moveTo(...P(...pts[0])); for (const p of pts.slice(1)) ctx.lineTo(...P(...p));
  const b0 = [0, 0], b1 = [0.135, -0.02], pk = [0.07, 0.055], c = [2 * pk[0] - (b0[0] + b1[0]) / 2, 2 * pk[1] - (b0[1] + b1[1]) / 2];
  ctx.quadraticCurveTo(...P(...c), ...P(...b1)); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.strokeStyle = "#0E1014"; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.lineWidth = 1.6;
  for (const [a, b] of [[[-0.100, 0.145], [-0.045, 0.155]], [[-0.098, 0.115], [-0.035, 0.125]], [[0.045, 0.012], [0.085, 0.032]]]) { ctx.beginPath(); ctx.moveTo(...P(...a)); ctx.lineTo(...P(...b)); ctx.stroke(); }
  ctx.restore();
}
// a locomotive seen from the front, GLYPH px, centred on (cx, cy): cab, windscreen, two lamps, cowcatcher, rails
function loco(ctx, cx, cy) {
  const x = cx - 22, y = cy - 22;
  ctx.save(); ctx.strokeStyle = TXT; ctx.fillStyle = TXT; ctx.lineWidth = 3.5; ctx.lineJoin = "round"; ctx.lineCap = "round";
  ctx.beginPath(); ctx.roundRect(x + 8, y + 3, 28, 29, 8); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(x + 13, y + 9, 18, 9, 3); ctx.stroke();
  ctx.fillStyle = "#ffd25a"; for (const dx of [15, 29]) { ctx.beginPath(); ctx.arc(x + dx, y + 25, 2.8, 0, Math.PI * 2); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(x + 6, y + 40); ctx.lineTo(x + 12, y + 33); ctx.moveTo(x + 38, y + 40); ctx.lineTo(x + 32, y + 33); ctx.moveTo(x + 3, y + 41); ctx.lineTo(x + 41, y + 41); ctx.stroke();
  ctx.restore();
}

const batColour = (v) => (v < 10 ? "#ff4d4d" : v < 20 ? "#ffb02e" : "#5fe07a");

// a birthday cake in a 64 px box at (x, y): candles lit by age (3 flames under 50, 1 from 50, the others burnt out)
function cake(ctx, x, y, v) {
  const lit = v < 50 ? 3 : 1, cx = [20, 32, 44];
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = "round";
  ctx.fillStyle = "#e9dcb4"; ctx.beginPath(); ctx.roundRect(1, 56, 62, 7, 3.5); ctx.fill();
  ctx.fillStyle = "#ff8fb1"; ctx.beginPath(); ctx.roundRect(6, 38, 52, 19, 5); ctx.fill();
  ctx.fillStyle = "#ff6f9a"; ctx.beginPath(); ctx.roundRect(15, 26, 34, 13, 4); ctx.fill();
  ctx.fillStyle = TXT; ctx.beginPath(); ctx.roundRect(6, 38, 52, 8, 4); ctx.fill();   // icing band with three drips
  for (const dx of [14, 30, 46]) { ctx.beginPath(); ctx.roundRect(dx - 3, 42, 6, 9, 3); ctx.fill(); }
  ctx.beginPath(); ctx.roundRect(15, 26, 34, 6, 3); ctx.fill();
  cx.forEach((x0, i) => {
    const on = lit === 3 || i === 1;
    ctx.fillStyle = i === 1 ? "#ffd25a" : "#7cc4ff"; ctx.beginPath(); ctx.roundRect(x0 - 2.5, 15, 5, 12, 1.5); ctx.fill();
    if (on) {
      ctx.fillStyle = "#ffb23d"; ctx.beginPath(); ctx.moveTo(x0, 1); ctx.quadraticCurveTo(x0 + 5.5, 8, x0, 14); ctx.quadraticCurveTo(x0 - 5.5, 8, x0, 1); ctx.fill();
      ctx.fillStyle = "#fff0a0"; ctx.beginPath(); ctx.ellipse(x0, 10, 1.9, 3, 0, 0, Math.PI * 2); ctx.fill();
    } else { ctx.strokeStyle = "rgba(255,248,236,0.4)"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x0, 14); ctx.lineTo(x0 + 1, 9); ctx.stroke(); }
  });
  ctx.restore();
}
// the number in fixed 50 px cells from x: always one whole integer (a count over dur shows 82, 81, ... one per frame)
function ageNumber(ctx, v, x, y, cell, col) {
  const a = String(Math.max(0, Math.round(v)));
  ctx.fillStyle = col;
  for (let j = 0; j < a.length; j++) ctx.fillText(a[j], x + j * cell + cell / 2, y);
}
function drawAge(ctx, S) {
  const A = S.age, K = A.key, oy = (S.y ?? 214) - 214, [bx, by, bw, bh] = AGE_BOX;
  const kick = K && K.rise && K.since < 0.18 ? Math.sin((K.since / 0.18) * Math.PI) * 6 : 0;
  ctx.save(); ctx.globalAlpha = A.fade; ctx.translate(0, oy); ctx.textBaseline = "middle"; ctx.textAlign = "center"; ctx.letterSpacing = "0px";
  ctx.save(); ctx.translate(kick, 0);
  chip(ctx, AGE_BOX);
  cake(ctx, 94, 230, A.v);
  // the number: yellow flash and 1.18 -> 1 on a rise
  const fl = K && K.rise && K.since < 0.4 ? K.since / 0.4 : null, sc = fl != null ? 1 + 0.18 * (1 - ease("out")(fl)) : 1;
  const col = fl != null ? (fl < 0.7 ? "#ffd25a" : TXT) : TXT, len = String(Math.max(0, Math.round(A.v))).length, ncx = 176 + (len * 50) / 2;
  ctx.font = '900 84px "CapBlack"';
  ctx.save(); ctx.translate(ncx, 266); ctx.scale(sc, sc); ctx.translate(-ncx, -266);
  ageNumber(ctx, A.v, 176, 266, 50, col);
  ctx.restore();
  // the life bar
  const f = clamp((AGE_MAX - A.v) / AGE_MAX), tx = 94, tw = 256, ty = 308, th = 12;
  ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, 6); ctx.fillStyle = "rgba(255,255,255,0.16)"; ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, 6); ctx.clip();
  if (K && K.rise && K.since < 0.35) {   // the lost chunk flashes cream
    const f0 = clamp((AGE_MAX - K.prev) / AGE_MAX);
    ctx.globalAlpha = A.fade * (1 - K.since / 0.35); ctx.fillStyle = TXT; ctx.fillRect(tx + tw * f, ty, tw * (f0 - f), th); ctx.globalAlpha = A.fade;
  }
  ctx.fillStyle = ageColour(A.v); ctx.fillRect(tx, ty, tw * f, th);
  ctx.restore();
  ctx.restore();
  // the tag right of the chip: "+N" for 0.9 s on a rise, a green "-N" for 1.0 s once the roll-back has landed
  if (K) {
    const k = K.rise ? K.since : K.since - K.dur, span = K.rise ? 0.9 : 1.0;
    if (k >= 0 && k < span) {
      const text = `${K.rise ? "+" : "-"}${Math.round(Math.abs(K.to - K.prev))}`, a = Math.min(1, k / 0.1) * (1 - clamp((k - (span - 0.2)) / 0.2));
      const dx = 18 * (1 - ease("back")(clamp(k / 0.22)));
      ctx.font = '900 40px "CapBlack"'; const tw2 = ctx.measureText(text).width + 36, th2 = 58;
      ctx.globalAlpha = A.fade * a;
      ctx.beginPath(); ctx.roundRect(bx + bw + 16 - dx, by + 48 - th2 / 2 + 0.5, tw2, th2, 20); ctx.fillStyle = "rgba(18,16,24,0.78)"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = EDGE; ctx.stroke();
      ctx.fillStyle = K.rise ? AGE_AMBER : AGE_GREEN; ctx.fillText(text, bx + bw + 16 - dx + tw2 / 2, by + 50);
    }
  }
  ctx.restore();
}
// the YES / NO pills: two pills with a small "or" between, x 420-900
function drawPills(ctx, S) {
  const P = S.pills, oy = (S.y ?? 214) - 214, [x0, y0, w, h] = PILLS_BOX, cy = y0 + h / 2, pop = P.pop != null ? 0.92 + 0.08 * ease("out")(P.pop / 0.2) : 1;
  ctx.save(); ctx.globalAlpha = P.a; ctx.translate(0, oy); ctx.translate(x0 + w / 2, cy); ctx.scale(pop, pop); ctx.translate(-(x0 + w / 2), -cy);
  ctx.textBaseline = "middle"; ctx.textAlign = "center"; ctx.letterSpacing = "0px"; ctx.lineJoin = "round";
  const shape = (x, text, fill) => {
    ctx.beginPath(); ctx.roundRect(x, y0, 220, h, 20); ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = EDGE; ctx.stroke();
    ctx.font = '900 88px "CapBlack"'; ctx.lineWidth = 8; ctx.strokeStyle = "rgba(18,16,24,0.55)"; ctx.strokeText(text, x + 110, cy + 4);
    ctx.fillStyle = TXT; ctx.fillText(text, x + 110, cy + 4);
  };
  shape(x0, "YES", "rgba(143,209,79,0.85)"); shape(x0 + w - 220, "NO", "rgba(255,77,77,0.85)");
  ctx.font = '900 40px "CapBlack"'; ctx.lineWidth = 7; ctx.strokeStyle = "rgba(18,16,24,0.7)"; ctx.strokeText("or", 660, cy + 3); ctx.fillStyle = TXT; ctx.fillText("or", 660, cy + 3);
  ctx.restore();
}

// a money sack 24 x 28 (top-left x, y) with a tied neck, filled from its bottom to `f`; glow 0-1 lights it gold
function sack(ctx, x, y, f, glow, col) {
  const path = () => { ctx.beginPath(); ctx.moveTo(x + 8, y); ctx.lineTo(x + 16, y); ctx.lineTo(x + 15, y + 7); ctx.quadraticCurveTo(x + 24, y + 10, x + 24, y + 20); ctx.quadraticCurveTo(x + 24, y + 28, x + 20, y + 28);
    ctx.lineTo(x + 4, y + 28); ctx.quadraticCurveTo(x, y + 28, x, y + 20); ctx.quadraticCurveTo(x, y + 10, x + 9, y + 7); ctx.closePath(); };
  ctx.save(); ctx.lineWidth = 3; ctx.lineJoin = "round";
  path(); ctx.strokeStyle = "rgba(255,248,236,0.32)"; ctx.stroke();
  if (f > 0.001) { ctx.save(); path(); ctx.clip(); ctx.fillStyle = col; ctx.fillRect(x - 2, y + 28 - 28 * f, 28, 28 * f + 1); ctx.restore(); }
  if (f > 0.999) { path(); ctx.strokeStyle = col; ctx.stroke(); }
  if (glow > 0) { ctx.save(); ctx.globalAlpha *= glow; ctx.shadowColor = GOLD; ctx.shadowBlur = 14; path(); ctx.strokeStyle = GOLD; ctx.lineWidth = 4; ctx.stroke(); ctx.restore(); }
  ctx.restore();
}
function mix(a, b, k) { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",")})`; }
// the sun's colour along its way: #ffe066 to 0.3, #ffd04a at 0.6, #ffb23d at 0.85, #ff7a3a from 0.95
const sunColour = (p) => (p <= 0.3 ? "#ffe066" : p < 0.6 ? mix("#ffe066", "#ffd04a", (p - 0.3) / 0.3) : p < 0.85 ? mix("#ffd04a", "#ffb23d", (p - 0.6) / 0.25) : p < 0.95 ? mix("#ffb23d", "#ff7a3a", (p - 0.85) / 0.1) : "#ff7a3a");
function hourglass(ctx, x, y, f, col) {   // 22 x 30; f = share of the sand run down (0-1)
  const path = () => { ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x + 22, y + 2); ctx.lineTo(x + 11, y + 15); ctx.lineTo(x + 22, y + 28); ctx.lineTo(x, y + 28); ctx.lineTo(x + 11, y + 15); ctx.closePath(); };
  ctx.save();
  ctx.save(); path(); ctx.clip(); ctx.fillStyle = GOLD; ctx.fillRect(x, y + 15 - 13 * (1 - f), 22, 13 * (1 - f)); ctx.fillRect(x, y + 28 - 13 * f, 22, 13 * f + 1); ctx.restore();
  path(); ctx.lineWidth = 3; ctx.lineJoin = "round"; ctx.strokeStyle = col; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 2, y + 1); ctx.lineTo(x + 24, y + 1); ctx.moveTo(x - 2, y + 29); ctx.lineTo(x + 24, y + 29); ctx.lineCap = "round"; ctx.stroke();
  ctx.restore();
}
function popAbout(ctx, [x, y, w, h], s) { ctx.translate(x + w / 2, y + h / 2); ctx.scale(s, s); ctx.translate(-(x + w / 2), -(y + h / 2)); }

function drawMoney(ctx, M) {
  const box = moneyBox(M), [x, y, w] = box, kick = M.kick != null ? Math.sin((M.kick / 0.18) * Math.PI) : 0;
  ctx.save(); ctx.globalAlpha = M.a; popAbout(ctx, box, M.pop); ctx.translate(0, kick * 5);
  chip(ctx, box);
  // row 1 (centre y + 42): "$" and the number in fixed cells of 34 (a comma 14), left-aligned so the dollar sign never moves
  ctx.font = MONEY_FONT; ctx.letterSpacing = "0px"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const fmt = (n) => "$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","), text = fmt(M.n), top = fmt(M.n0 ?? 1e7);
  const full = [...top].reduce((a, ch) => a + (ch === "," ? 14 : 34), 0), k = Math.min(1, (w - 28) / full);   // a bigger start squeezes the row
  ctx.save(); ctx.translate(x + w / 2, y + 44); ctx.scale(k, k); ctx.translate(-(x + w / 2), -(y + 44));
  let cx = x + (w - full) / 2;
  for (const ch of text) { const cw = ch === "," ? 14 : 34; ctx.fillStyle = ch === "$" ? (M.flash ? RED : GOLD) : M.flash ? RED : TXT; ctx.fillText(ch, cx + cw / 2, y + 42 + 2); cx += cw; }
  ctx.restore();
  // row 2 (centre y + 92): ten sacks, one every 34
  const sx = x + (w - (9 * 34 + 24)) / 2;
  for (let k = 1; k <= 10; k++) sack(ctx, sx + (k - 1) * 34, y + 92 - 14, clamp(M.n / (M.unit ?? SACK) - (k - 1)), M.glow[k - 1], k === 1 && M.flash ? RED : SACK_FULL);
  ctx.restore();
}
function drawSun(ctx, U) {
  const box = sunBox(U), [x, y, w] = box, T = U.timer;
  ctx.save(); ctx.globalAlpha = U.a; popAbout(ctx, box, U.pop);
  chip(ctx, box, T && T.red ? `rgba(255,77,77,${0.2 + 0.8 * T.pulse})` : EDGE, T && T.red ? 2 + T.pulse : 2);
  const R = 76, ex = SUN_R - 14 - 30, cx = ex - R, sea = y + 100, p = clamp(U.p, 0, 1.2), th = (Math.PI / 2) * clamp(p), ang = -Math.PI / 2 + th, col = sunColour(p);
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(cx, sea, R, -Math.PI / 2, ang); ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,248,236,0.25)"; ctx.stroke();
  if (th < Math.PI / 2 - 0.001) { ctx.beginPath(); ctx.arc(cx, sea, R, ang, 0); ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke(); }
  const sx = cx + R * Math.cos(ang), sy = sea + R * Math.sin(ang) + (p > 1 ? (p - 1) * 80 : 0);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, sea - y); ctx.clip();   // the sea line cuts it off
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(sx, sy, 16, 0, Math.PI * 2); ctx.fill();
  const rays = 1 - clamp((p - 0.85) / 0.05);
  if (rays > 0) { ctx.globalAlpha *= rays; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = "butt";
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(sx + Math.cos(a) * 18, sy + Math.sin(a) * 18); ctx.lineTo(sx + Math.cos(a) * 23, sy + Math.sin(a) * 23); ctx.stroke(); } }
  ctx.restore();
  // the sea line (60 long, 3 bumps) and the sun's reflection under it
  ctx.beginPath(); ctx.moveTo(ex - 30, sea); for (let i = 0; i < 3; i++) ctx.quadraticCurveTo(ex - 30 + i * 20 + 10, sea - 7, ex - 30 + (i + 1) * 20, sea);
  ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.strokeStyle = "#7cc4ff"; ctx.stroke();
  const rf = clamp((p - 0.8) / 0.2) * 0.6;
  if (rf > 0) { ctx.save(); ctx.globalAlpha *= rf; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx - 12, sea + 6); ctx.lineTo(sx + 12, sea + 6); ctx.moveTo(sx - 7, sea + 12); ctx.lineTo(sx + 7, sea + 12); ctx.stroke(); ctx.restore(); }
  if (T) {   // the last minute: hourglass + m:ss in the zone left of the arc, centred on its final spot
    ctx.font = TIMER_FONT; ctx.letterSpacing = "0px"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const dig = Math.max(...[..."0123456789"].map((d) => ctx.measureText(d).width)), colon = ctx.measureText(":").width - 5, cell = dig - 3, tw = 22 + 8 + cell * 3 + colon;   // tight cells: the zone is 142 wide
    const zx = SUN_R - SUN_W_LAST + (SUN_W_LAST - SUN_W) / 2 + 15, tcol = T.red ? RED : TXT;
    ctx.save(); ctx.globalAlpha *= T.a; ctx.translate(zx, y + 59); ctx.scale(T.pop, T.pop); ctx.translate(-zx, -(y + 59));
    hourglass(ctx, zx - tw / 2, y + 59 - 15, T.k, tcol);
    ctx.fillStyle = tcol; digits(ctx, `${Math.floor(T.s / 60)}:${String(T.s % 60).padStart(2, "0")}`, zx - tw / 2 + 30, y + 59 + 2, cell, colon);
    ctx.restore();
  }
  ctx.restore();
}

export function drawHud(ctx, sb, t) {
  const S = hudState(sb, t);
  if (!S) return;
  const L = layout(ctx, S);
  ctx.save();
  ctx.textBaseline = "middle"; ctx.textAlign = "center";
  if (L.left) {
    // a new day pops the chip
    const pop = S.day && S.day.since >= 0 && S.day.since < 0.25 && S.day.since !== -Infinity ? 1 + 0.12 * Math.sin((S.day.since / 0.25) * Math.PI) : 1;
    const [x, y, w, h] = L.left;
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(pop, pop); ctx.translate(-(x + w / 2), -(y + h / 2));
    chip(ctx, L.left);
    ctx.fillStyle = TXT; ctx.font = FONT; ctx.letterSpacing = "0.5px";
    if (S.day) ctx.fillText(`DAY ${S.day.n}`, x + w / 2, y + CH / 2 + 2);
    if (S.part != null || S.label) { ctx.font = SMALL; ctx.letterSpacing = "2px"; ctx.fillStyle = "#ffd25a"; ctx.fillText(S.label || `PART ${S.part}`, x + w / 2, y + h - 18); }
    ctx.restore();
  }
  if (L.threat) {
    const T = S.threat, [x, y, w, h] = L.threat, kick = T.kick != null && T.kick < 0.2 ? Math.sin((T.kick / 0.2) * Math.PI) : 0;
    ctx.save(); ctx.translate(0, -kick * 4);
    chip(ctx, L.threat);
    house(ctx, x + PAD, y + (h - 28) / 2 - 1, clamp(T.v / 7));
    ctx.font = THR_FONT; ctx.letterSpacing = "0.5px"; ctx.textAlign = "left"; ctx.fillStyle = T.v >= 7 ? "#ff6b5e" : TXT;
    ctx.fillText(`SNOW ${T.v < 10 ? (Math.round(T.v * 10) / 10).toFixed(1) : Math.round(T.v)} m`, x + PAD + 30 + 12, y + h / 2 + 2);
    ctx.restore();
  }
  if (L.right) {
    const [x, y, w, h] = L.right, kick = S.battery && S.battery.kick != null && S.battery.kick < 0.18 ? Math.sin((S.battery.kick / 0.18) * Math.PI)
      : S.ammo && S.ammo.kick != null && S.ammo.kick < 0.18 ? Math.sin((S.ammo.kick / 0.18) * Math.PI) : 0;
    ctx.save(); ctx.translate(kick * 5, 0);
    chip(ctx, L.right);
    let cx = x + PAD;
    const mid = y + h / 2 + 2;
    ctx.font = FONT; ctx.letterSpacing = "0px"; ctx.fillStyle = TXT;
    if (S.ammo) {
      const A = S.ammo, glow = A.kick != null ? 1 - clamp(A.kick / 0.4) : 0;
      for (let i = 0; i < A.max; i++) cartridge(ctx, cx + i * AMMO_STEP, mid - 2, i < A.n, i === A.n ? glow : 0);
      cx += L.ammoW + 26;
    }
    if (S.clock) {
      sky(ctx, cx + 17, mid - 2, S.clock.mins); cx += 34 + 12;
      digits(ctx, S.clock.text, cx, mid, L.dig, L.colon); cx += L.clockW - 46 + 26;
    }
    if (S.battery) {
      const B = S.battery, dead = B.dead, blink = dead && B.since >= 0 && B.since < 0.6 && Math.floor(B.since / 0.15) % 2 === 1;
      if (!blink) {
        const col = dead ? "#ff4d4d" : batColour(B.v), bx = cx, by = mid - 14;
        ctx.lineWidth = 3.5; ctx.strokeStyle = dead ? col : TXT;
        ctx.beginPath(); ctx.roundRect(bx, by, 46, 26, 6); ctx.stroke();
        ctx.fillStyle = dead ? col : TXT; ctx.beginPath(); ctx.roundRect(bx + 47, by + 8, 5, 10, 2); ctx.fill();
        if (B.v > 0) { ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(bx + 4, by + 4, Math.max(3, 38 * (B.v / 100)), 18, 3); ctx.fill(); }
        ctx.textAlign = "left"; ctx.fillStyle = dead ? col : B.v < 10 ? "#ff7a7a" : TXT;
        if (dead) ctx.fillText("DEAD", bx + 56 + 10, mid);
        else { ctx.textAlign = "center"; digits(ctx, `${B.pct}%`, bx + 56 + 10, mid, L.dig, L.colon); }
      }
      cx += L.batW + 26;
    }
    if (S.gauge) {
      const v = Math.round(S.gauge.v);
      thermo(ctx, cx + 12, mid - 4, S.gauge.v); cx += 26 + 10;
      ctx.textAlign = "left"; ctx.fillStyle = v < 0 ? "#bfe3ff" : TXT;
      ctx.fillText(`${v} °C`, cx, mid);
    }
    ctx.restore();
    // the clock's jump tag: a yellow pill that slides out to the left of the chip on the same row, then fades
    if (S.clock && S.clock.tag) {
      const k = S.clock.tag.since, a = Math.min(1, k / 0.1) * (1 - clamp((k - 0.9) / 0.3)), dx = 24 * (1 - ease("back")(clamp(k / 0.22)));
      ctx.save(); ctx.globalAlpha = a; ctx.font = TAG; ctx.letterSpacing = "0px"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      // left of the clock chip, never over the day chip (with no room there it sits just under the clock chip)
      const tw = ctx.measureText(S.clock.tag.text).width + 32, th = 46, room = x - 14 - tw >= (L.left ? L.left[0] + L.left[2] + 12 : L.safe.x0);
      const tx = room ? x - 14 - tw + dx : x + w - tw, ty = room ? y + (h - th) / 2 : y + h + 8 - dx / 3;
      ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, th / 2); ctx.fillStyle = "#ffd25a"; ctx.fill();
      ctx.fillStyle = "#1a1720"; ctx.fillText(S.clock.tag.text, tx + tw / 2, ty + th / 2 + 2);
      ctx.restore();
    }
  }
  if (L.own) {
    const O = S.own, [x, y, w, h] = L.own, kick = O.kick != null ? 1 + 0.06 * Math.sin((O.kick / 0.15) * Math.PI) : 1;
    const born = O.born != null ? ease("back")(clamp(O.born / 0.25)) : 1, sc = kick * (0.9 + 0.1 * born);
    ctx.save(); ctx.globalAlpha *= O.a * (O.born != null ? clamp(O.born / 0.12) : 1);
    ctx.translate(x + w / 2, y + h / 2); ctx.scale(sc, sc); ctx.translate(-(x + w / 2), -(y + h / 2));
    chip(ctx, L.own); ctx.beginPath(); ctx.roundRect(x, y, w, h, 20); ctx.clip();   // a rolling number stays in the chip
    glasses(ctx, x + PAD + GLYPH / 2, y + h / 2);
    const nx = x + PAD + GLYPH + 10, my = y + h / 2 + 2;
    ctx.font = FONT; ctx.letterSpacing = "0px"; ctx.textAlign = "center";
    const num = (v, col, dy, a) => {
      const str = String(v); ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col;
      digits(ctx, str, nx + ((O.nd - str.length) * L.dig) / 2, my + dy, L.dig, L.colon); ctx.restore();
    };
    if (O.tick != null) {
      const k = clamp(O.tick / TICK), newCol = O.tick >= 3 / 30 ? ownColour(O.v) : ownColour(O.prev);
      num(O.prev, ownColour(O.prev), k * ROLL, 1 - k);
      num(O.v, newCol, -(1 - k) * ROLL, k);
    } else num(O.v, ownColour(O.v), 0, 1);
    ctx.restore();
  }
  if (L.strength) {
    const G = S.strength, [x, y, w, h] = L.strength;
    const kick = !G.fell && G.kick != null ? 1 + 0.18 * Math.sin((G.kick / 0.2) * Math.PI) : 1, down = G.fell && G.kick != null && G.kick < 0.15 ? Math.sin((G.kick / 0.15) * Math.PI) * 5 : 0;
    const born = G.born != null ? ease("back")(clamp(G.born / 0.25)) : 1, sc = kick * (0.9 + 0.1 * born), col = mix("#FFC65A", "#E8402F", G.drain), fill = mix("#F2C14E", "#E8402F", G.drain);
    ctx.save(); ctx.globalAlpha *= G.a * (G.born != null ? clamp(G.born / 0.12) : 1);
    ctx.translate(0, down); ctx.translate(x + w / 2, y + h / 2); ctx.scale(sc, sc); ctx.translate(-(x + w / 2), -(y + h / 2));
    chip(ctx, L.strength, EDGE, 2, STR_PLATE); ctx.beginPath(); ctx.roundRect(x, y, w, h, 20); ctx.clip();   // a rolling number stays in the chip
    flex(ctx, x + STR_PAD + STR_GLYPH / 2, y + h / 2, fill);
    const nx = x + STR_PAD + STR_GLYPH + STR_GAP, my = y + h / 2 + 3, K = L.strK;
    ctx.font = STR_FONT; ctx.letterSpacing = "0px"; ctx.textAlign = "center";
    const num = (v, dy, a) => {
      ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col; ctx.translate(nx, 0); ctx.scale(K, 1); ctx.translate(-nx, 0);
      let cx = nx;
      for (const ch of "x" + withCommas(v)) { const cw = ch === "x" ? L.xW : ch === "," ? L.commaW : L.sdig; ctx.fillText(ch, cx + cw / 2, my + dy); cx += cw; }
      ctx.restore();
    };
    const roll = 0.4 * h;
    if (G.tick != null) { const k = clamp(G.tick / TICK); num(G.prev, k * roll, 1 - k); num(G.v, -(1 - k) * roll, k); }
    else num(G.v, 0, 1);
    ctx.restore();
  }
  if (L.train) {
    const T = S.train, [x, y, w, h] = L.train, kick = T.kick != null ? 1 + 0.08 * Math.sin((T.kick / 0.2) * Math.PI) : 1;
    const slide = T.born != null ? ease("out")(clamp(T.born / 0.3)) : 1;
    ctx.save(); ctx.globalAlpha *= T.a * slide; ctx.translate((1 - slide) * 60, 0);
    ctx.translate(x + w / 2, y + h / 2); ctx.scale(kick, kick); ctx.translate(-(x + w / 2), -(y + h / 2));
    chip(ctx, L.train); ctx.beginPath(); ctx.roundRect(x, y, w, h, 20); ctx.clip();
    loco(ctx, x + PAD + GLYPH / 2, y + CH / 2);
    // the text area: label or countdown centred in it
    const ax = x + PAD + GLYPH + 12, aw = w - (PAD * 2 + GLYPH + 12), cx = ax + aw / 2, my = y + CH / 2 + 2;
    ctx.font = FONT; ctx.letterSpacing = "0.5px";
    const text = (str, count, amber, dy, a) => {
      ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = amber ? AMBER : TXT;
      if (count) { ctx.textAlign = "center"; ctx.letterSpacing = "0px"; digits(ctx, str, cx - (L.dig * 4 + L.colon) / 2, my + dy, L.dig, L.colon); }
      else { ctx.textAlign = "center"; ctx.fillText(str, cx, my + dy); }
      ctx.restore();
    };
    if (T.flip) {
      const k = clamp(T.flip.since / 0.2);
      text(T.flip.prev, T.flip.prevCount, T.flip.prevAmber, k * ROLL, 1 - k);
      text(T.text, T.count, T.amber, -(1 - k) * ROLL, k);
    } else text(T.text, T.count, T.amber, 0, 1);
    // 4 day pips: done days filled, today gold, later ones outline only
    const px = x + w / 2 - PIP_W / 2 + PIP_R, py = y + h - 16;
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const cxp = px + i * (PIP_R * 2 + PIP_GAP);
      ctx.beginPath(); ctx.arc(cxp, py, PIP_R, 0, Math.PI * 2);
      if (i <= T.day) { ctx.fillStyle = i === T.day ? SGOLD : TXT; ctx.fill(); }
      else { ctx.strokeStyle = "rgba(255,248,236,0.55)"; ctx.stroke(); }
    }
    ctx.restore();
  }
  if (S.money) drawMoney(ctx, S.money);
  if (S.sun) drawSun(ctx, S.sun);
  ctx.restore();
  if (S.age) drawAge(ctx, S);
  if (S.pills) drawPills(ctx, S);
}
