#!/usr/bin/env node
// Sound check. Claude can't hear, so this measures what can be measured and leaves the ear to Jonny.
//
//   node qa/sound.mjs storyboards/x.json                 -> storyboard notes only (well under a second)
//   node qa/sound.mjs storyboards/x.json out/x.mp4       -> plus the measurements on the rendered file (a few seconds)
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
//                  over 20 dB above a real bed it jumps out. Hypotheses from earshot's launch mixes (3-10 dB), warn only.
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { loadStoryboard, loadCharacters } from "../engine/load.mjs";
import { renderAudio, soundEvents } from "../engine/audio.mjs";
import { isHit, floorOf } from "../engine/sfx/library.mjs";
import { lockMusic, addMusic } from "../engine/music.mjs";

const SR = 44100, FRAME = 1 / 30;
// named sounds that are not a physical event on screen: music stings, jingles, UI tones, voices
const NOT_PHYSICAL = /^(sting|sadslide|jingle|ui-|notify|ringtone|gasp|speech|magic-up|kenney\/(tone|two-tone|three-tone|pep-sound|power-up))/;
const WHOOSH = /whoosh|swish/;
const QUIET_ACTIONS = new Set(["look", "blink", "noblink", "expr", "still"]);
const list = (ts) => ts.slice(0, 6).map((t) => `${(+t).toFixed(2)}s`).join(", ") + (ts.length > 6 ? ", ..." : "");

export function soundNotes(sb) {
  const out = [], add = (level, check, msg) => out.push({ group: "technical", level, check, msg });
  const ev = soundEvents(sb);
  const wh = ev.filter((e) => WHOOSH.test(e.kind));
  if (wh.length > 2) add("warn", "whoosh-repeat", `${wh.length} whooshes (${list(wh.map((e) => e.at))}): more than two of the same air sound reads cheap; vary them (shing, cloth, flutter) or drop the quieter ones`);
  // physical moments: actions starting and ending, effects
  const moments = [], spans = [];
  for (const a of sb.actions || []) if (!QUIET_ACTIONS.has(a.do)) { const d = a.dur ?? 0.3; moments.push(a.at, a.at + d); spans.push([a.at, a.at + d]); }
  for (const f of sb.fx || []) moments.push(f.at);
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

function decodeMono(file) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-i", file, "-vn", "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 29 });
  if (r.status !== 0) throw new Error(`sound: can't decode ${file}`);
  return new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + r.stdout.length));
}
// energy in blocks of `hop` samples
function envelope(x, hop) { const e = new Float64Array(Math.floor(x.length / hop)); for (let i = 0; i < e.length; i++) { let s = 0; for (let k = i * hop; k < (i + 1) * hop; k++) s += x[k] * x[k]; e[i] = s / hop; } return e; }
const db = (p) => 10 * Math.log10(p + 1e-12);

// timing from a render of the sound (no clip needed): each named hit's loudest moment against the physical moment
// nearest to it (an action starting or ending, an effect). Automatic sounds (footfalls, hops, grabs) are placed by
// the engine on its own moments and aren't re-checked.
export function soundTiming(sb, events) {
  const out = [], add = (level, check, msg) => out.push({ group: "technical", level, check, msg });
  const moments = [];
  for (const a of sb.actions || []) if (!QUIET_ACTIONS.has(a.do)) moments.push(a.at, a.at + (a.dur ?? 0.3));
  for (const f of sb.fx || []) moments.push(f.at);
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

// on the rendered file: is its sound the one this storyboard makes now, in sync with the picture, and does each
// effect stand out from what plays under it
export function soundMeasure(clip, sb, chars) {
  const out = [], add = (level, check, msg) => out.push({ group: "technical", level, check, msg });
  const a = renderAudio(sb, chars);
  out.push(...soundTiming(sb, a.events));
  addMusic({ ...sb, music: sb.music?.lock ? sb.music : lockMusic(sb) }, a);
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
  const W = 2205, e50 = envelope(mix, 441), at = (t) => Math.max(0, Math.round((t + offset) * SR / 441));
  const lvl = (i) => { let s = 0, n = 0; for (let k = i; k < i + W / 441 && k < e50.length; k++) { s += e50[k]; n++; } return n ? s / n : 0; };
  const buried = [], loud = [], over = [];
  for (const e of a.events.filter((x) => x.hit != null)) {
    const h = at(e.hit), top = Math.max(...Array.from({ length: 30 }, (_, j) => lvl(Math.max(0, h - 1 + j))));
    const bed = []; for (let i = at(e.hit - 1); i < at(e.hit - 0.08); i += 5) bed.push(lvl(i));
    if (!bed.length) continue;
    bed.sort((x, y) => x - y);
    const b = db(bed[Math.floor(bed.length / 2)]), d = db(top) - b, step = /^step/.test(e.kind);
    over.push(d);
    if (d < (step ? -3 : 1)) buried.push(`${e.kind}@${e.at} ${d.toFixed(1)} dB`);
    else if (d > 20 && b > -45) loud.push(`${e.kind}@${e.at} +${d.toFixed(0)} dB`);
  }
  over.sort((x, y) => x - y);
  const med = over.length ? over[Math.floor(over.length / 2)] : 0;
  if (buried.length) add("warn", "sound-level", `${buried.length} of ${over.length} effects buried under the music, voices or room (${buried.slice(0, 5).join(", ")}${buried.length > 5 ? ", ..." : ""}): raise them or duck the bed`);
  if (loud.length) add("warn", "sound-level", `${loud.length} effects jump far out of the mix (${loud.slice(0, 5).join(", ")})`);
  if (!buried.length && !loud.length && over.length) add("pass", "sound-level", `${over.length} effects stand ${over[0].toFixed(0)} to ${over[over.length - 1].toFixed(0)} dB over what plays under them (median ${med.toFixed(0)} dB)`);
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [file, clip] = process.argv.slice(2);
  if (!file) { console.error("usage: node qa/sound.mjs <storyboard.json> [clip.mp4]"); process.exit(2); }
  const sb = loadStoryboard(file);
  const chars = loadCharacters(sb);
  const res = [...soundNotes(sb), ...(!clip ? soundTiming(sb, renderAudio(sb, chars).events) : fs.existsSync(clip) ? soundMeasure(clip, sb, chars) : [{ level: "fail", check: "file", msg: `${clip} not found` }])];
  for (const r of res) console.log(`  ${{ pass: "ok  ", warn: "WARN", fail: "FAIL", note: "note" }[r.level]}  ${r.check}: ${r.msg}`);
  process.exit(res.some((r) => r.level === "fail") ? 1 : 0);
}
