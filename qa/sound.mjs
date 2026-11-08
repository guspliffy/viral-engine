#!/usr/bin/env node
// Sound check. Claude can't hear, so this measures what can be measured and leaves the ear to Jonny.
//
//   node qa/sound.mjs storyboards/x.json                 -> storyboard notes only (well under a second)
//   node qa/sound.mjs storyboards/x.json out/x.mp4       -> plus the measurements on the rendered file (a few seconds)
//   node qa/sound.mjs storyboards/x.json out/x.mp4 --ears -> plus earshot listening to it (about a minute)
//
// soundNotes(sb), from the storyboard alone:
//   whoosh-repeat  the same whoosh more than twice reads cheap: vary it or drop the quieter ones
//   sound-event    a named sound with nothing happening on screen near it (no action starting or ending, no effect);
//                  give it an action, move it, or say why in "reason" (an off-screen horn)
//   floor          footsteps on a floor the engine had to guess (set type not in library.mjs SURFACES)
//   music-lock     how the music grid met the story (engine/music.mjs): the payoff on beat 1, the rest on beats
// soundMeasure(clip, sb, chars), on the MP4 (plus soundTiming):
//   sound-sync     every named hit (knocks, slams, put-downs...: library.mjs isHit) peaks within a frame of the action
//                  it belongs to (a fresh render of the sound, no clip needed)
//   sound-file     the file's sound is the one this storyboard renders now, and in sync with the picture (fail over
//                  a frame: a muxing or encoder offset)
//   sound-level    how far each effect stands over what plays under it: its loudest 50 ms against the median level
//                  of the second before (music, voices, room). Under ~1 dB it is buried (footsteps: under -3 dB);
//                  over the mix, see sound-spike. Hypotheses from earshot's launch mixes (3-10 dB), warn only.
//   sound-spike    an effect's momentary loudness (400 ms) over the voices, room and music around it: over 9 dB warns,
//                  over 12 fails (12 / 15 marked "loud"); the spike guard (engine/sfx/guard.mjs) caps it at 9 / 12.
//                  loudest (note): the three loudest moments of the file, for Jonny's ears first.
//                  node qa/sound.mjs <sb> --spikes [--guard] checks a fresh mix (seconds, no render).
//   payoff-sound   (creative, a note) the payoff is the loudest moment of the clip and has a quiet dip before it: the
//                  loudest 100 ms window of the file falls in the payoff beat (within 1 dB), and the quietest 0.5 s of the
//                  4 s before it sits 12 dB or more under the payoff's peak. Idea from cth9191/animate tools/review.mjs
//                  (MIT), which wants 0.5-4 s of silence before the payoff; ours is relative because a bed or a voice
//                  rarely drops to digital silence. The payoff: "music": { "payoff": t }, else the beat marked
//                  "kind": "payoff", else one named payoff / reveal / punchline, else the last escalation (said so).
//   phone-band     (quality plan item 4, 4 Nov 2026) most viewers hear us on a phone speaker, which plays almost
//                  nothing under ~200 Hz or over ~6 kHz. The mix is filtered to that band (two 12 dB/oct high-passes at
//                  200 Hz, two low-passes at 6 kHz) and measured again: the share of the mix's energy a phone plays
//                  (under 40 %: the bass carries the mix and a phone loses it; one article mix had 80 % outside; pink
//                  noise has about half), and
//                  every hit's loudest 50 ms in the band against the band's median level in the second before (the music,
//                  voices and room a phone plays under it). Under 3 dB a hit is lost on a phone; 3-6 dB and up reads. A hit
//                  that stands 4 dB or more lower in the band than in the full mix, and so only 3-6 dB over the bed on a
//                  phone, has its punch under 200 Hz (a thud: layer a click or a slap on it). Warn only. Also runs on a fresh render with no clip (seconds):
//                  node qa/sound.mjs <sb> --phone, so a sound fix is checked without a re-render.
// soundEars(clip, sb, chars), with --ears (earshot: github.com/Leonxlnx/earshot, run through qa/ears.py, ~1 min):
//   ears-sync      earshot listens to the file and finds the onset that answers each hit's picture moment (knocks,
//                  slams, put-downs; not footsteps): the share within a frame, against what chance would score
//   ears-floor     each footstep, heard on its own as the engine placed it, against the other floors: does it sound
//                  like the set's floor (wood, carpet, concrete...). Earshot can't tell grass from snow or carpet
//                  from other indoor floors (qa/ears.py SAME), so those only fail on a clear contradiction.
//                  Install once: clone earshot next to this repo (../earshot), make its .venv with CPU torch,
//                  pip install -e ., earshot doctor --fetch. Or point EARSHOT_PYTHON at a Python that has it.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadStoryboard, loadCharacters } from "../engine/load.mjs";
import { renderAudio, soundEvents, writeWav } from "../engine/audio.mjs";
import { isHit, floorOf, SURFACES } from "../engine/sfx/library.mjs";
import { lockMusic } from "../engine/music.mjs";
import { mixClip, effectLevelsOverMix, loudestMoments } from "../engine/sfx/guard.mjs";
import { soundClock } from "../engine/shared/holds.js";
import { lineLevels, lineResults, loopSeam } from "./lines.mjs";

const SR = 44100, FRAME = 1 / 30;
// named sounds that are not a physical event on screen: music stings, jingles, UI tones, voices
const NOT_PHYSICAL = /^(sting|sadslide|jingle|ui-|notify|ringtone|gasp|speech|magic-up|kenney\/(tone|two-tone|three-tone|pep-sound|power-up))/;
const WHOOSH = /whoosh|swish/;
const QUIET_ACTIONS = new Set(["look", "blink", "noblink", "expr", "still"]);
// the physical moments of the storyboard: actions starting and ending, and every footfall of a walk (a foot lands
// every half step cycle, as in audio.mjs foley and page/potato.js)
function physicalMoments(sb) {
  const out = [];
  for (const a of sb.actions || []) {
    if (QUIET_ACTIONS.has(a.do)) continue;
    const d = a.dur ?? 0.3; out.push(a.at, a.at + d);
    if (a.do === "move" && (a.steps ?? 2.2) > 0) for (let t = 0.5 / (a.steps ?? 2.2); t < d; t += 0.5 / (a.steps ?? 2.2)) out.push(a.at + t);
  }
  for (const f of sb.fx || []) out.push(f.at);
  return out;
}
const list = (ts) => ts.slice(0, 6).map((t) => `${(+t).toFixed(2)}s`).join(", ") + (ts.length > 6 ? ", ..." : "");

export function soundNotes(sb) {
  sb = soundClock(sb);   // hit-stops: times as the video plays them (engine/shared/holds.js)
  const out = [], add = (level, check, msg) => out.push({ group: "technical", level, check, msg });
  const ev = soundEvents(sb);
  const wh = ev.filter((e) => WHOOSH.test(e.kind));
  if (wh.length > 2) add("warn", "whoosh-repeat", `${wh.length} whooshes (${list(wh.map((e) => e.at))}): more than two of the same air sound reads cheap; vary them (shing, cloth, flutter) or drop the quieter ones`);
  // physical moments: actions starting and ending, effects
  const moments = physicalMoments(sb), spans = [];
  for (const a of sb.actions || []) if (!QUIET_ACTIONS.has(a.do)) spans.push([a.at, a.at + (a.dur ?? 0.3)]);
  const lonely = [];
  for (const s of sb.sfx || []) {
    if (s.reason || NOT_PHYSICAL.test(s.sound)) continue;
    const near = moments.some((t) => Math.abs(t - s.at) <= 0.15) || ((s.dur ?? 0) >= 0.3 && spans.some(([a, b]) => s.at >= a && s.at <= b));
    if (!near) lonely.push(`${s.sound} at ${s.at}s`);
  }
  if (lonely.length) add("warn", "sound-event", `nothing starts or ends on screen near ${lonely.slice(0, 6).join(", ")}${lonely.length > 6 ? ", ..." : ""}: a sound without a physical event reads as a glitch (give it one, move it, or add a "reason")`);
  if (wh.length <= 2 && !lonely.length) add("pass", "sound-events", "every named sound has something happening on screen, at most two whooshes");
  const steps = ev.filter((e) => /^step/.test(e.kind)).length, fl = floorOf(sb);
  if (steps && fl.how === "guess") add("warn", "floor", `${steps} footsteps on a guessed floor (${fl.surface}) for set "${sb.set?.type}": add the set to SURFACES in engine/sfx/library.mjs or set sound.surface`);
  else if (steps) add("pass", "floor", `${steps} footsteps on ${fl.sound.replace("step-", "")} (${fl.how === "set" ? `the ${sb.set?.type} set's floor` : "sound.surface"})`);
  const m = sb.music?.lock ? sb.music : lockMusic(sb);
  if (m?.lock?.miss?.length) {
    const key = m.lock.miss.find((x) => x.what === "payoff" || x.what === "music stops"), on = m.lock.miss.filter((x) => x.ms <= 33).length;
    add("note", "music-lock", `music grid ${m.bpm} bpm from ${m.lock.offset.toFixed(3)}s: ${key ? `${key.what} at ${key.t}s ${key.ms} ms off beat 1, ` : "no payoff marked, "}${on}/${m.lock.miss.length} story moments within a frame of a beat`);
  }
  return out;
}

export function decodeMono(file) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-i", file, "-vn", "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 29 });
  if (r.status !== 0) throw new Error(`sound: can't decode ${file}`);
  return new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + r.stdout.length));
}
// energy in blocks of `hop` samples
export function envelope(x, hop) { const e = new Float64Array(Math.floor(x.length / hop)); for (let i = 0; i < e.length; i++) { let s = 0; for (let k = i * hop; k < (i + 1) * hop; k++) s += x[k] * x[k]; e[i] = s / hop; } return e; }
export const db = (p) => 10 * Math.log10(p + 1e-12);

// timing from a render of the sound (no clip needed): each named hit's loudest moment against the physical moment
// nearest to it (an action starting or ending, a footfall, an effect). Automatic sounds (footfalls, hops, grabs) are placed by
// the engine on its own moments and aren't re-checked.
export function soundTiming(sb, events) {
  sb = soundClock(sb);
  const out = [], add = (level, check, msg) => out.push({ group: "technical", level, check, msg });
  const moments = physicalMoments(sb);
  const named = new Set((sb.sfx || []).filter((s) => !s.reason).map((s) => `${s.sound}@${s.at}`));
  const hits = events.filter((e) => e.hit != null && isHit(e.kind) && named.has(`${e.kind}@${e.at}`)), off = [];
  for (const e of hits) {
    const near = moments.filter((t) => Math.abs(t - e.at) <= 0.15).sort((p, q) => Math.abs(p - e.hit) - Math.abs(q - e.hit))[0];
    if (near == null) continue;   // sound-event reports it
    const d = e.hit - near;
    if (Math.abs(d) > FRAME) off.push(`${e.kind}@${e.at} ${d > 0 ? "+" : ""}${Math.round(d * 1000)} ms`);
  }
  const cut = events.filter((e) => e.hit != null && e.hit - e.at > FRAME).map((e) => `${e.kind}@${e.at}`);
  if (off.length) add("warn", "sound-sync", `${off.length} of ${hits.length} named hits peak more than a frame from the action they belong to (${off.slice(0, 5).join(", ")}${off.length > 5 ? ", ..." : ""}): move them onto the contact frame`);
  if (cut.length) add("warn", "sound-sync", `${cut.join(", ")}: too close to the start for the sound to lead into its hit; it lands late`);
  if (!off.length && !cut.length) add("pass", "sound-sync", `${hits.length ? `${hits.length} named hit${hits.length > 1 ? "s peak" : " peaks"} within a frame of the action` : "no named hits"}; every hit sound peaks on its event (engine/sfx/library.mjs)`);
  return out;
}

// how far each hit stands over what plays under it in the file: its loudest 50 ms against the median level of the
// second before. { e, d (dB), buried, loud }
export function effectLevels(mix, events, offset = 0) {
  const W = 2205, e50 = envelope(mix, 441), at = (t) => Math.max(0, Math.round((t + offset) * SR / 441)), out = [];
  const lvl = (i) => { let s = 0, n = 0; for (let k = i; k < i + W / 441 && k < e50.length; k++) { s += e50[k]; n++; } return n ? s / n : 0; };
  for (const e of events.filter((x) => x.hit != null)) {
    const h = at(e.hit), top = Math.max(...Array.from({ length: 30 }, (_, j) => lvl(Math.max(0, h - 1 + j))));
    const bed = []; for (let i = at(e.hit - 1); i < at(e.hit - 0.08); i += 5) bed.push(lvl(i));
    if (!bed.length) continue;
    bed.sort((x, y) => x - y);
    const b = db(bed[Math.floor(bed.length / 2)]), d = db(top) - b, step = /^step/.test(e.kind);
    out.push({ e, d, buried: d < (step ? -3 : 1), loud: d > 20 && b > -45 });
  }
  return out;
}

// RBJ biquad, run in place over x (mono, SR): "hp" or "lp" at f Hz, Q 0.707
function biquad(x, type, f, sr = SR) {
  const w = (2 * Math.PI * f) / sr, c = Math.cos(w), al = Math.sin(w) / (2 * Math.SQRT1_2);
  const [b0, b1, b2] = type === "hp" ? [(1 + c) / 2, -(1 + c), (1 + c) / 2] : [(1 - c) / 2, 1 - c, (1 - c) / 2], a0 = 1 + al, a1 = -2 * c, a2 = 1 - al;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const v = x[i], y = (b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = v; y2 = y1; y1 = y; x[i] = y; }
  return x;
}
export const PHONE = { lo: 200, hi: 6000, share: 0.4, over: 3, good: 6, thud: 4 };
// what a phone speaker plays of a mix: 200 Hz to 6 kHz, 24 dB/oct either side
export function phoneFilter(x) {
  const y = Float32Array.from(x);
  biquad(y, "hp", PHONE.lo); biquad(y, "hp", PHONE.lo); biquad(y, "lp", PHONE.hi); biquad(y, "lp", PHONE.hi);
  return y;
}
// the phone-band results for a mix (the file, or a fresh render) and its sound events
export function phoneBand(mix, events, offset = 0) {
  const out = [], add = (level, msg) => out.push({ group: "technical", level, check: "phone-band", msg });
  const band = phoneFilter(mix);
  let eAll = 0, eBand = 0; for (let i = 0; i < mix.length; i++) { eAll += mix[i] * mix[i]; eBand += band[i] * band[i]; }
  const share = eAll ? eBand / eAll : 0;
  // hits only: footsteps, grabs, sits and automatic wing flaps are handling sounds the bed may cover (the ducking
  // skips them too)
  // (isHit: knocks, slams, impacts, put-downs...; a whoosh, a flap or a bed of bubbling is not a hit), one per moment
  const hits = [];
  for (const e of events.filter((x) => x.hit != null && isHit(x.kind) && !/(^|\/)(step|grab|sit|cloth|footstep|wing-flap)/.test(x.kind)).sort((x, y) => x.hit - y.hit)) if (!hits.length || e.hit - hits[hits.length - 1].hit > 0.05) hits.push(e);
  const full = new Map(effectLevels(mix, hits, offset).map((x) => [x.e, x.d])), inBand = effectLevels(band, hits, offset);
  const lost = [], thud = [], ds = [];
  for (const x of inBand) {
    ds.push(x.d);
    const name = `${x.e.kind}@${(+x.e.at).toFixed(2)}`;
    if (x.d < PHONE.over) lost.push(`${name} ${x.d >= 0 ? "+" : ""}${x.d.toFixed(1)} dB${full.has(x.e) ? ` (${full.get(x.e) >= 0 ? "+" : ""}${full.get(x.e).toFixed(1)} full)` : ""}`);
    const f = full.get(x.e); if (f != null && f - x.d >= PHONE.thud && x.d >= PHONE.over && x.d < PHONE.good) thud.push(`${name} (${f.toFixed(0)} dB full, ${x.d.toFixed(0)} dB on a phone)`);
  }
  ds.sort((a, b) => a - b);
  const pct = Math.round(share * 100);
  add(share < PHONE.share ? "warn" : "pass", `${pct} % of the mix's energy is in the band a phone speaker plays (${PHONE.lo} Hz-${PHONE.hi / 1000} kHz)${share < PHONE.share ? ": the low end carries the mix and a phone drops it (thin the bass of the music bed, or lift the mids)" : ""}`);
  if (!ds.length) return out;
  if (lost.length) add("warn", `${lost.length} of ${ds.length} hits stand under ${PHONE.over} dB over the bed on a phone speaker (${lost.slice(0, 5).join(", ")}${lost.length > 5 ? ", ..." : ""}): lift them, duck the bed more, or pick a take with more mids`);
  if (thud.length) add("warn", `${thud.length} hit${thud.length > 1 ? "s lose their" : " loses its"} punch on a phone, most of it is under ${PHONE.lo} Hz (${thud.slice(0, 4).join(", ")}): layer a click, slap or crack on it`);
  if (!lost.length && !thud.length) add("pass", `${ds.length > 1 ? `all ${ds.length} hits stand ${ds[0].toFixed(0)} to ${ds[ds.length - 1].toFixed(0)} dB` : `the hit stands ${ds[0].toFixed(0)} dB`} over the bed on a phone speaker (median ${ds[Math.floor(ds.length / 2)].toFixed(0)} dB; ${PHONE.over}-${PHONE.good} dB and up reads)`);
  return out;
}
// the storyboard's sound as the render would mix it now (effects, voices, room, music), mono, with its events
export function freshMix(sb, chars) {
  sb = soundClock(sb);
  const a = mixClip({ ...sb, music: sb.music?.lock ? sb.music : lockMusic(sb) }, chars);   // the spike guard too, when the storyboard has it
  const m = new Float32Array(a.L.length); for (let i = 0; i < m.length; i++) m[i] = (a.L[i] + a.R[i]) / 2;
  return { mix: m, events: a.events, a };
}

// on the rendered file: is its sound the one this storyboard makes now, in sync with the picture, and does each
// effect stand out from what plays under it
export function soundMeasure(clip, sb, chars) {
  sb = soundClock(sb);
  const out = [], add = (level, check, msg) => out.push({ group: "technical", level, check, msg });
  const a = mixClip({ ...sb, music: sb.music?.lock ? sb.music : lockMusic(sb) }, chars, [], { voice: true });
  out.push(...soundTiming(sb, a.events));
  const fresh = new Float32Array(a.L.length); for (let i = 0; i < fresh.length; i++) fresh[i] = (a.L[i] + a.R[i]) / 2;
  const mix = decodeMono(clip), H = 88, eF = envelope(fresh, H).map(Math.sqrt), eM = envelope(mix, H).map(Math.sqrt);   // 2 ms steps
  // the lag (+-150 ms) where the file's loudness curve and a fresh render's agree best
  let best = -2, lag = 0;
  for (let L = -75; L <= 75; L++) {
    let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, n = 0;
    for (let i = Math.max(0, -L); i < eF.length && i + L < eM.length; i++) { const x = eF[i], y = eM[i + L]; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y; n++; }
    const c = (n * sxy - sx * sy) / Math.sqrt(Math.max(1e-20, (n * sxx - sx * sx) * (n * syy - sy * sy)));
    if (c > best) { best = c; lag = L; }
  }
  const offset = (lag * H) / SR, ms = Math.round(offset * 1000);
  if (best < 0.8) add("warn", "sound-file", `the file's sound matches a fresh render only ${(best * 100).toFixed(0)}%: it was made by an older storyboard or engine (redo it with render.mjs --audio-only)`);
  else add(Math.abs(offset) > FRAME ? "fail" : "pass", "sound-file", `the file's sound is this storyboard's (${(best * 100).toFixed(0)}% match), ${Math.abs(offset) > FRAME ? `but ${ms} ms out of sync with the picture` : `in sync with the picture (${ms} ms)`}`);
  // 3. level over what plays under it, in the file (music included), 50 ms windows
  const buried = [], over = [];
  for (const x of effectLevels(mix, a.events, offset)) {
    over.push(x.d);
    if (x.buried) buried.push(`${x.e.kind}@${x.e.at} ${x.d.toFixed(1)} dB`);
  }
  over.sort((x, y) => x - y);
  const med = over.length ? over[Math.floor(over.length / 2)] : 0;
  if (buried.length) add("warn", "sound-level", `${buried.length} of ${over.length} effects buried under the music, voices or room (${buried.slice(0, 5).join(", ")}${buried.length > 5 ? ", ..." : ""}): raise them or duck the bed`);
  const sp = spikes(sb, chars, a);
  out.push(...sp);
  if (!buried.length && !sp.some((r) => r.level === "fail") && over.length) add("pass", "sound-level", `${over.length} effects stand ${over[0].toFixed(0)} to ${over[over.length - 1].toFixed(0)} dB over what plays under them (median ${med.toFixed(0)} dB)`);
  out.push(loudest([mix], a.events, offset));
  out.push(...payoffSound(sb, envelope(mix, 441)));
  out.push(...phoneBand(mix, a.events, offset));
  // each spoken line over the rest on a phone, and the loop seam (qa/lines.mjs, 7 Nov 2026)
  out.push(...lineResults(lineLevels(sb, chars, a)), ...loopSeam(clip));
  return out;
}

// sound-spike (quality plan item 6, 5 Nov 2026): each effect (effects within 0.2 s of each other together) measured
// alone, as the mixer makes it, against the voices, room and music around it (engine/sfx/guard.mjs
// effectLevelsOverMix: BS.1770 momentary loudness, 400 ms, against the energy mean of the 3 s around). Over 9 dB a
// warning (the spike guard turns it down to 9), over 12 dB a fail (marked "loud": true: 12 and 15). Measured on the
// mix the render makes now, as sound-sync is; sound-file says whether the file is that mix.
// Ten clips of 4-5 Nov, unguarded: the bill's charge + impact @1.95 +12.3 dB, the T-rex's grab + roar @5.42 +13.2,
// the shark's feedback @3.90 +13.9 fail; the tent's cloth + thud the old check called +20 dB stand 17-21 dB UNDER the
// mix around them: the old 50 ms check heard the payoff after the music's deliberate dip.
export const SPIKE = { warn: 9, fail: 12, loudWarn: 12, loudFail: 15 };
export function spikes(sb, chars, a = null) {
  const out = [], add = (level, msg) => out.push({ group: "technical", level, check: "sound-spike", msg });
  sb = soundClock(sb);
  const lv = a?.levels ? a.levels.map((x) => ({ ...x, over: x.after ?? x.over })) : effectLevelsOverMix({ ...sb, music: sb.music?.lock ? sb.music : lockMusic(sb) }, chars);
  const lim = (x, k) => (x.loud ? SPIKE["loud" + k[0].toUpperCase() + k.slice(1)] : SPIKE[k]);
  const say = (xs) => xs.sort((p, q) => q.over - p.over).slice(0, 5).map((x) => `${x.name} ${x.over >= 0 ? "+" : ""}${x.over.toFixed(1)} dB${x.loud ? " (loud)" : ""}`).join(", ");
  const bad = lv.filter((x) => x.over > lim(x, "fail") + 0.05), hot = lv.filter((x) => x.over > lim(x, "warn") + 0.05 && x.over <= lim(x, "fail") + 0.05);
  if (bad.length) add("fail", `${bad.length} effect${bad.length > 1 ? "s jump" : " jumps"} far out of the mix (${say(bad)}; momentary loudness over the voices, room and music around, fail over ${SPIKE.fail} dB, ${SPIKE.loudFail} marked "loud"): turn ${bad.length > 1 ? "them" : "it"} down, mark a deliberate gag "loud": true, or turn on the spike guard ("sound": { "guard": true })`);
  if (hot.length) add("warn", `${hot.length} effect${hot.length > 1 ? "s stand" : " stands"} out of the mix (${say(hot)}; over ${SPIKE.warn} dB): the spike guard would turn ${hot.length > 1 ? "them" : "it"} down to ${SPIKE.warn}`);
  if (!bad.length && !hot.length && lv.length) { const top = lv.reduce((m, x) => (x.over > m.over ? x : m)); add("pass", `no effect jumps out of the mix (the most: ${top.name} ${top.over >= 0 ? "+" : ""}${top.over.toFixed(1)} dB over the voices, room and music around it)${a?.guard ? `; spike guard on, ${a.guard.capped.length} turned down` : ""}`); }
  return out;
}
// the delivery line: the three loudest moments, for Jonny to listen to first
export function loudest(chs, events, offset = 0) {
  const L = loudestMoments(chs, SR, events, 3, offset);
  return { group: "technical", level: "note", check: "loudest", msg: `the three loudest moments (listen to these first): ${L.map((x) => `${x.t.toFixed(2)}s ${x.over >= 0 ? "+" : ""}${x.over.toFixed(1)} dB over the clip's loudness${x.what.length ? ` (${x.what.slice(0, 3).join(" + ")})` : ""}`).join("; ")}` };
}

// the payoff beat: { name, from, to, how }. "how" says when it is the music lock's fallback (the last escalation),
// which may not be the punchline
export function payoffBeat(sb) {
  sb = soundClock(sb);
  const b = sb.beatSpans || [];
  if (sb.music?.payoff != null) { const t = sb.music.payoff, s = b.find((x) => t >= x.from && t < x.to); return { name: s?.name ?? "payoff", from: t, to: s ? s.to : t + 1.5, how: "music.payoff" }; }
  const p = b.find((x) => x.kind === "payoff") ?? b.find((x) => /payoff|reveal|punch/i.test(x.name || ""));
  if (p) return { name: p.name, from: p.from, to: p.to, how: "marked" };
  const e = [...b].reverse().find((x) => x.kind === "escalation");
  return e ? { name: e.name, from: e.from, to: e.to, how: "last escalation" } : null;
}

// e10: the file's energy in 10 ms blocks (envelope(mix, 441)). Loudness in dBFS, mono
export function payoffSound(sb, e10) {
  sb = soundClock(sb);
  const out = [], add = (level, msg) => out.push({ group: "creative", level, check: "payoff-sound", msg });
  const p = payoffBeat(sb);
  if (!p) { add("note", `no payoff beat (mark the punchline "kind": "payoff"), so the payoff's sound wasn't measured`); return out; }
  const mean = (k) => { const o = new Float64Array(Math.max(0, e10.length - k + 1)); let s = 0; for (let i = 0; i < e10.length; i++) { s += e10[i]; if (i >= k) s -= e10[i - k]; if (i >= k - 1) o[i - k + 1] = db(s / k); } return o; };
  const w100 = mean(10), w500 = mean(50), T = (i) => i / 100, at = (t) => Math.max(0, Math.round(t * 100));
  const peak = (a, b) => { let m = -Infinity, k = a; for (let i = a; i < Math.min(b, w100.length); i++) if (w100[i] > m) { m = w100[i]; k = i; } return [m, k]; };
  const [top, topI] = peak(0, w100.length), end = Math.min(p.to, p.from + 3), [pk, pkI] = peak(at(p.from - 0.1), at(end));
  if (!Number.isFinite(pk)) return out;
  const beatAt = (t) => (sb.beatSpans || []).find((x) => t >= x.from && t < x.to)?.name;
  // the quietest 0.5 s in the 4 s before, and how long the level stays 12 dB under the payoff's peak around it
  let q = Infinity, qI = 0;
  for (let i = at(p.from - 4); i <= at(p.from) - 50 && i < w500.length; i++) if (w500[i] < q) { q = w500[i]; qI = i; }
  let a = qI + 25, b = qI + 25; const low = (i) => w100[Math.max(0, i - 5)] <= pk - 12;
  if (low(a)) { while (a > at(p.from - 4) && low(a - 1)) a--; while (b < at(p.from) && low(b + 1)) b++; }
  const dip = low(qI + 25) ? (b - a + 1) / 100 : 0, depth = pk - q;
  const loudOk = pk >= top - 1, dipOk = depth >= 12 && dip >= 0.5;
  const who = `payoff "${p.name}" at ${p.from}s${p.how === "last escalation" ? ` (no payoff marked: the last escalation; mark the punchline "kind": "payoff")` : ""}`;
  const loud = loudOk ? `its peak (${pk.toFixed(1)} dBFS at ${T(pkI).toFixed(2)}s) is the clip's loudest 100 ms` : `the clip's loudest 100 ms is at ${T(topI).toFixed(2)}s${beatAt(T(topI)) ? ` in "${beatAt(T(topI))}"` : ""}, ${(top - pk).toFixed(1)} dB louder than the payoff's peak (${pk.toFixed(1)} dBFS at ${T(pkI).toFixed(2)}s)`;
  const quiet = Number.isFinite(q) ? `the quietest 0.5 s before it (${T(qI).toFixed(2)}-${T(qI + 50).toFixed(2)}s) sits ${depth.toFixed(0)} dB under it${dip ? `, ${dip.toFixed(1)} s at 12 dB down` : ""}` : "no room for a dip before it";
  add(loudOk && dipOk ? "pass" : "note", `${who}: ${loud}; ${quiet}${loudOk && dipOk ? "" : " (house style: the payoff is the loudest moment, after a dip of 0.5 s or more at least 12 dB down: duck the bed or hold the voices before it)"}`);
  return out;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export function earshotPython() {
  const c = [process.env.EARSHOT_PYTHON, path.join(ROOT, "../earshot/.venv/bin/python"), path.join(ROOT, "../earshot/.venv/Scripts/python.exe")];
  return c.find((p) => p && fs.existsSync(p)) ?? null;
}

export function soundEars(clip, sb, chars) {
  sb = soundClock(sb);
  const out = [], add = (level, check, msg) => out.push({ group: "technical", level, check, msg });
  const py = earshotPython();
  if (!py) { add("note", "ears", "earshot not installed, so nothing was listened to (see qa/sound.mjs for the one-time setup)"); return out; }
  const a = renderAudio(sb, chars), dir = fs.mkdtempSync(path.join(os.tmpdir(), "ears-"));
  // each footstep on its own, as the engine placed it (no music, voices, room tone or the next step): room noise
  // and overlapping steps both make every floor sound like snow
  const norm = (x) => { let pk = 0; for (const v of x) pk = Math.max(pk, Math.abs(v)); const y = new Float32Array(x.length + Math.round(0.05 * SR)); for (let i = 0; i < x.length; i++) y[i] = pk ? (x[i] * 0.9) / pk : 0; return y; };
  const hits = a.events.filter((e) => e.hit != null && isHit(e.kind) && !/^step/.test(e.kind));
  const steps = a.events.filter((e) => e.samples && /^step/.test(e.kind)).slice(0, 12).map((e, i) => { const f = path.join(dir, `step-${i}.wav`), y = norm(e.samples); writeWav(f, y, y, SR); return { t: +e.at.toFixed(3), file: f }; });
  const fl = floorOf(sb), floors = [...new Set(Object.values(SURFACES).concat("grass", "snow"))];
  const job = { mix: path.resolve(clip), fps: sb.fps ?? 30, cues: hits.map((e) => ({ t: +e.at.toFixed(3), kind: "hit", id: `${e.kind}@${e.at}` })),
    floor: steps.length ? { surface: fl.surface, alts: floors, steps } : null };
  fs.writeFileSync(path.join(dir, "job.json"), JSON.stringify(job));
  const r = spawnSync(py, [path.join(ROOT, "qa/ears.py"), path.join(dir, "job.json"), path.join(dir, "out.json")], { encoding: "utf8", maxBuffer: 64 << 20 });
  if (r.status !== 0) { add("warn", "ears", `earshot failed: ${(r.stderr || "").trim().split("\n").pop()}`); return out; }
  const res = JSON.parse(fs.readFileSync(path.join(dir, "out.json"), "utf8"));
  fs.rmSync(dir, { recursive: true, force: true });
  const st = res.sync?.stats;
  if (st?.n) {
    const share = st.hit_within_1_frame, chance = st.chance_within_1_frame ?? 0, miss = res.sync.misses.slice(0, 5).map((m) => `${m.id} ${m.status}${m.offset_ms != null ? ` ${m.offset_ms > 0 ? "+" : ""}${Math.round(m.offset_ms)} ms` : ""}`);
    add(share >= 0.7 ? "pass" : "warn", "ears-sync", `earshot hears ${Math.round(share * 100)}% of ${st.n} hits within a frame of their picture moment (chance ${Math.round(chance * 100)}%), ${Math.round(st.hit_within_100ms * 100)}% within 100 ms${miss.length ? `; missed: ${miss.join(", ")}` : ""}`);
  }
  const f = res.floor;
  if (f?.n) {
    const heard = Object.entries(f.heard).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${v}x "${k}"`).join(", ");
    const kinds = [...new Set(a.events.filter((e) => e.samples && /^step/.test(e.kind)).map((e) => e.kind))].join(", ");
    add(f.share >= 0.5 ? "pass" : "warn", "ears-floor", `${f.top} of ${f.n} footsteps (${kinds}) sound like ${fl.surface}${["grass", "snow", "carpet", "indoor"].includes(fl.surface) ? " or a floor earshot can't tell from it" : ""} against the other floors (heard: ${heard}; median p ${f.median_p})${f.share < 0.5 && !kinds.includes(`step-${fl.surface}`) ? `: the clip uses ${kinds}, not step-${fl.surface}` : ""}`);
  }
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const flags = ["--ears", "--phone", "--spikes", "--guard"], argv = process.argv.slice(2), ears = argv.includes("--ears"), phone = argv.includes("--phone"), spk = argv.includes("--spikes"), [file, clip] = argv.filter((x) => !flags.includes(x));
  if (!file) { console.error("usage: node qa/sound.mjs <storyboard.json> [clip.mp4] [--ears] [--phone] [--spikes] [--guard]"); process.exit(2); }
  let sb = loadStoryboard(file);
  if (argv.includes("--guard")) sb = { ...sb, sound: { ...(sb.sound || {}), guard: true } };   // as render.mjs --guard
  const chars = loadCharacters(sb);
  const res = [...soundNotes(sb), ...(!clip ? soundTiming(sb, renderAudio(sb, chars).events) : fs.existsSync(clip) ? soundMeasure(clip, sb, chars) : [{ level: "fail", check: "file", msg: `${clip} not found` }])];
  // --phone with no clip: the phone-band check on the mix the render would make now (seconds, no render)
  if ((phone || spk) && !clip) {
    const f = freshMix(sb, chars);
    if (phone) res.push(...phoneBand(f.mix, f.events));
    // --spikes with no clip: the spike check and the three loudest moments on the mix the render would make now
    if (spk) res.push(...spikes(sb, chars, f.a), loudest([f.mix], f.events));
  }
  if (ears && clip && fs.existsSync(clip)) res.push(...soundEars(clip, sb, chars));
  for (const r of res) console.log(`  ${{ pass: "ok  ", warn: "WARN", fail: "FAIL", note: "note" }[r.level]}  ${r.check}: ${r.msg}`);
  process.exit(res.some((r) => r.level === "fail") ? 1 : 0);
}
