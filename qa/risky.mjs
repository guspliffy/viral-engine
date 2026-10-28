#!/usr/bin/env node
// The five moments most likely to sound wrong, for Jonny to check with headphones on every delivery. Claude can't
// hear, so instead of "the sound is fine" a delivery names where to listen and what for (habit from
// Barty-Bart/motion-graphics, MIT). See qa/REVIEW.md, "Delivering".
//
//   node qa/risky.mjs out/x.mp4 --sb storyboards/x.json      -> five timestamps, earliest first, each with what to listen for
//
// Candidates, most important first: the payoff (does the hit land, is it the loudest thing), effects the file buries
// or blares (qa/sound.mjs effectLevels), the loudest moment when it isn't the payoff, a line spoken over a hit, the
// loop seam (does the sound restart cleanly), the first second, and the cut with the biggest jump in loudness.
// Moments closer than 0.8 s count once.
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { loadStoryboard, loadCharacters } from "../engine/load.mjs";
import { renderAudio } from "../engine/audio.mjs";
import { decodeMono, envelope, db, effectLevels, payoffBeat } from "./sound.mjs";

const SR = 44100;
const clock = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, "0")}`;
const name = (k) => k.replace(/^(oga|kenney|ai)\//, "");

export function riskyMoments(clip, sb, chars, n = 5) {
  const mix = decodeMono(clip), e10 = envelope(mix, 441), dur = sb.duration, c = [];
  const lvl = (a, b) => { let s = 0, k = 0; for (let i = Math.max(0, Math.round(a * 100)); i < Math.min(e10.length, Math.round(b * 100)); i++) { s += e10[i]; k++; } return k ? db(s / k) : -120; };
  const add = (p, t, why) => c.push({ p, t: Math.max(0, Math.min(dur - 0.05, t)), why });
  // the payoff and the loudest 100 ms
  const pay = payoffBeat(sb);
  let top = -Infinity, topT = 0;
  for (let i = 0; i + 10 <= e10.length; i++) { const v = lvl(i / 100, i / 100 + 0.1); if (v > top) { top = v; topT = i / 100; } }
  if (pay) add(0, pay.from, `payoff "${pay.name}"${pay.how === "last escalation" ? " (not marked; the last escalation)" : ""}: does the hit land on the action, is it the loudest thing so far, is there a breath before it`);
  if (!pay || topT < pay.from - 0.1 || topT > pay.to) add(2, topT, `the loudest moment of the clip${pay ? `, not the payoff` : ""}: should this be the loudest thing?`);
  // effects buried under the bed or jumping out of it
  const a = renderAudio(sb, chars);
  for (const x of effectLevels(mix, a.events)) {
    if (x.buried) add(1 + (x.d > -1 ? 0.5 : 0), x.e.hit ?? x.e.at, `${name(x.e.kind)} only ${x.d.toFixed(1)} dB over what plays under it: can you hear it?`);
    else if (x.loud) add(1.5, x.e.hit ?? x.e.at, `${name(x.e.kind)} jumps ${x.d.toFixed(0)} dB out of the mix: too loud?`);
  }
  // a line spoken over a hit
  const hits = a.events.filter((e) => e.hit != null && !/^step/.test(e.kind));
  for (const t of (sb.actions || []).filter((x) => (x.do === "talk" || x.do === "say") && x.line)) {
    const h = hits.find((e) => e.hit >= t.at - 0.05 && e.hit <= t.at + (t.dur ?? 0.6));
    if (h) add(2.5, t.at, `"${t.line}" over the ${name(h.kind)}: can you make out the words?`);
  }
  if (sb.loop) add(3, dur - 0.4, "the loop seam (end into the start): does the sound restart cleanly, no cut-off word or music jump?");
  add(3.5, 0, "the first second: what do you hear first, and is it there from frame 0?");
  // the cut with the biggest jump in loudness across it
  const cuts = (sb.shots || []).map((s) => s.at).filter((t) => t > 0.3 && t < dur - 0.3);
  const jumps = cuts.map((t) => ({ t, d: Math.abs(lvl(t, t + 0.25) - lvl(t - 0.25, t)) })).sort((x, y) => y.d - x.d);
  if (jumps[0]?.d >= 6) add(4, jumps[0].t, `the cut with the biggest change in loudness (${jumps[0].d.toFixed(0)} dB): does the sound edit feel like a jump?`);
  const out = [];
  for (const x of c.sort((p, q) => p.p - q.p)) if (out.length < n && !out.some((y) => Math.abs(y.t - x.t) < 0.8)) out.push(x);
  return out.sort((p, q) => p.t - q.t);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2), i = a.indexOf("--sb"), file = i >= 0 ? a[i + 1] : null, clip = a.find((x, k) => k !== i && k !== i + 1);
  if (!clip || !file || !fs.existsSync(clip)) { console.error("usage: node qa/risky.mjs <clip.mp4> --sb <storyboard.json>"); process.exit(2); }
  const sb = loadStoryboard(file);
  console.log("Listen with headphones at:");
  for (const m of riskyMoments(clip, sb, loadCharacters(sb))) console.log(`  ${clock(m.t)}  ${m.why}`);
}
