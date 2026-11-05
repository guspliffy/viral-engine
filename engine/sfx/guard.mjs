// The spike guard (quality plan item 6, 5 Nov 2026): no effect jumps far out of the mix.
//
// Effect gains are set per event by hand, and the ten clips of 4-5 Nov shipped effects 20-37 dB over what played
// under them (the tent's cloth + thud, the bill's blade-cut + impact + papercut, the T-rex's grab + stomp, the alien's
// low-down + notify). With "sound": { "guard": true } the mixer does three things the ear expects:
//
//   1. caps each effect: its momentary loudness (BS.1770, 400 ms) may stand at most 9 dB over the voices, room and
//      music around it (the energy mean of their momentary loudness over the 3 s around the effect's loudest moment;
//      never less than the clip's own loudness minus 6 dB, so an effect over a near-silent stretch isn't crushed).
//      Effects whose loudest moments fall within 0.2 s of each other are measured and turned down together, as the
//      ear hears them. A hit marked "loud": true (on its sfx entry or its impact fx) may stand 12 dB over. The cap
//      is a fixed gain per effect, as if it had been set lower by hand: nothing pumps.
//   2. levels the mix to -14 LUFS (instead of scaling the whole mix down by its single loudest sample, which let one
//      spike make everything else quieter), then
//   3. gentle true-peak limiters (4x oversampled, 5 ms look-ahead, 150 ms release) after the ducking: on the effects
//      and on the voices alone (a hit's first milliseconds, the voice synth's consonants: levelled to -14 LUFS they
//      peak 5-10 dB over the ceiling), then on the whole mix, all at the master's own ceiling (-2.6 dBTP: render.mjs
//      mux aims at -2 dBTP so the AAC encoder's ringing stays under the -1 dBTP delivery limit). Before, the master's
//      hard limiter (2 ms attack, 60 ms release) took those 4-10 dB off the whole mix, music and all.
//
//   "sound": { "guard": true }                     on (thread E's template turns it on once Jonny approves)
//   "sound": { "guard": { "over": 9, "loud": 12, "around": 1.5, "floor": -6, "ceiling": -2.6 } }   tuned
//   { "sound": "thud", "at": 8.87, "loud": true }  a deliberate loud gag
//   node engine/render.mjs <sb> --guard            on for one render without editing the storyboard
//
// mixClip(sb, chars, log) is the whole mix (effects, voices, room, music) the render writes: without the guard it is
// exactly renderAudio + addMusic, as before. qa/sound.mjs measures with the same functions (effectLevelsOverMix is the
// guard's own measure), so the check and the guard agree. Deterministic: the same storyboard gives the same samples.
import { renderAudio } from "../audio.mjs";
import { addMusic } from "../music.mjs";
import { isHit, hitTime } from "./library.mjs";
import { kPower, momentary, integrated, truePeak, lufs, power } from "./loudness.mjs";

export const GUARD = { over: 9, loud: 12, around: 1.5, floor: -6, join: 0.2, target: -14, ceiling: -2.6, lookahead: 0.005, release: 0.15 };
export const guardOn = (sb) => !!sb.sound?.guard;
const guardOf = (sb) => ({ ...GUARD, ...(typeof sb.sound?.guard === "object" ? sb.sound.guard : {}) });
const add2 = (...xs) => [0, 1].map((c) => { const k = c ? "R" : "L", o = new Float32Array(xs[0][k].length); for (const x of xs) { const v = x[k]; for (let i = 0; i < o.length; i++) o[i] += v[i]; } return o; });

// an effect's loudest moment (s): a hit was placed by it (e.hit), anything else is measured (engine/music.mjs does the same)
export const topOf = (e) => (e.hit > e.start + 1e-4 || isHit(e.kind) ? e.hit : e.start + (e.samples?.length ? hitTime(e.samples) : 0));
// effects (events with samples) grouped by loudest moment: within `join` s of the one before belongs together
export function effectGroups(events, join = GUARD.join) {
  const fx = events.map((e, i) => ({ e, i })).filter(({ e }) => e.start != null && e.samples?.length).map((x) => ({ ...x, top: topOf(x.e) })).sort((a, b) => a.top - b.top || a.i - b.i);
  const groups = [];
  for (const x of fx) { const g = groups.at(-1); if (g && x.top - g.at(-1).top <= join) g.push(x); else groups.push([x]); }
  return groups;
}
const nameOf = (g) => { const k = [...new Set(g.map((x) => x.e.kind))]; return `${k.slice(0, 3).join(" + ")}${k.length > 3 ? ` +${k.length - 3} more` : ""} @${(+g[0].e.at).toFixed(2)}`; };

// the energy mean (LUFS) of momentary windows (100 ms hop) whose centre lies in [a, b], leaving out [xa, xb]
function around(m, a, b, xa = Infinity, xb = -Infinity) {
  let s = 0, n = 0;
  for (let i = 0; i < m.length; i++) { const c = i * 0.1 + 0.2; if (c < a || c > b || (c >= xa && c <= xb)) continue; s += power(m[i]); n++; }
  return n ? lufs(s / n) : -Infinity;
}

// every effect group's momentary loudness against the voices, room and music around it, as the mix would be made with
// these effect gains (fxGain: a factor per event, as renderAudio takes it). Returns the groups and the unnormalised
// effects-voices-room mix (without music) it measured. [{ name, i: [event indices], t, LM, ref, over (dB), loud }]
export function effectLevelsOverMix(sb, chars, fxGain = null, G = guardOf(sb)) {
  const sfxK = sb.sound?.sfx ?? 1, a0 = renderAudio(sb, chars, { norm: false, stems: true, fxGain }), sr = a0.sr, n = a0.L.length;
  const mus = { L: new Float32Array(n), R: new Float32Array(n), sr, events: a0.events };
  addMusic(sb, mus, { norm: false });
  const restM = momentary(kPower(add2(a0.stems.voice, a0.stems.bed, mus), sr, 0.1), 4);
  const floor = integrated(add2(a0, mus), sr) + G.floor, groups = [];
  for (const g of effectGroups(a0.events, G.join)) {
    const pad = 0.4, s0 = Math.min(...g.map((x) => x.e.start)) - pad, s1 = Math.max(...g.map((x) => x.e.start + x.e.samples.length / sr)) + pad;
    const a = Math.round(s0 * sr), buf = new Float32Array(Math.max(1, Math.round((s1 - s0) * sr)));
    for (const { e } of g) { const o = Math.round(e.start * sr) - a, k = e.gain * sfxK; for (let j = 0; j < e.samples.length; j++) if (o + j >= 0 && o + j < buf.length) buf[o + j] += e.samples[j] * k; }
    const m = momentary(kPower([buf], sr, 0.01), 40);
    let best = 0; for (let i = 1; i < m.length; i++) if (m[i] > m[best]) best = i;
    const LM = m[best], t = s0 + best * 0.01 + 0.2, ref = Math.max(around(restM, t - G.around, t + G.around), floor);
    groups.push({ name: nameOf(g), i: g.map((x) => x.i), t, LM, ref, over: LM - ref, loud: g.some((x) => x.e.loud) });
  }
  return groups;
}

export function mixClip(sb, chars, log = []) {
  if (!guardOn(sb)) { const a = renderAudio(sb, chars); log.push(...addMusic(sb, a)); return a; }
  const G = guardOf(sb);
  // 1. measure: every effect against the voices, room and music around it; over the cap, a fixed gain down
  const levels = effectLevelsOverMix(sb, chars, null, G), fxGain = [], capped = [];
  for (const L of levels) {
    const cap = L.loud ? G.loud : G.over, cut = Math.max(0, L.over - cap);
    L.after = L.over - cut;
    if (!cut) continue;
    for (const i of L.i) fxGain[i] = Math.pow(10, -cut / 20);
    capped.push({ ...L, cut });
  }
  // 2. the mix again with the capped gains (the music's ducking follows the new gains)
  const a1 = renderAudio(sb, chars, { norm: false, fxGain, stems: true }), sr = a1.sr, n = a1.L.length;
  const mus = { L: new Float32Array(n), R: new Float32Array(n), sr, events: a1.events };
  const mlog = addMusic(sb, mus, { norm: false });
  const [bL, bR] = add2(a1.stems.bed, mus), fx = a1.stems.fx, vo = a1.stems.voice;
  // 3. levelled to the target, then gentle true-peak limiters: on the effects alone (a hit's first milliseconds
  // carry peaks 10-15 dB over its loudness) and on the voices alone (the synth's consonants), so neither pulls the
  // music and the rest down with it for the release, then on the whole mix for what is left (sums).
  // The limiters take some loudness with them, so the level is set again with them in place (a few rounds land
  // within 0.1 LU), and the master's loudnorm in render.mjs has next to nothing left to do
  const I = integrated(add2(vo, a1.stems.bed, mus, fx), sr);
  let lift = Number.isFinite(I) ? G.target - I : 0, lim = null, flim = null, vlim = null, got = I;
  const bus = (x, k) => { const L = new Float32Array(n), R = new Float32Array(n); for (let i = 0; i < n; i++) { L[i] = x.L[i] * k; R[i] = x.R[i] * k; } return { L, R }; };
  for (let round = 0; round < 6; round++) {
    const k = Math.pow(10, lift / 20), L = new Float32Array(n), R = new Float32Array(n), f = bus(fx, k), v = bus(vo, k);
    flim = limit(f.L, f.R, sr, G); vlim = limit(v.L, v.R, sr, G);
    for (let i = 0; i < n; i++) { L[i] = bL[i] * k + f.L[i] + v.L[i]; R[i] = bR[i] * k + f.R[i] + v.R[i]; }
    lim = limit(L, R, sr, G); a1.L = L; a1.R = R; got = integrated([L, R], sr);
    if (!Number.isFinite(got) || Math.abs(G.target - got) < 0.1) break;
    lift += G.target - got;
  }
  delete a1.stems;
  log.push(...mlog);
  log.push(capped.length
    ? `spike guard: ${capped.length} effect${capped.length > 1 ? "s" : ""} turned down to ${G.over} dB (loud: ${G.loud}) over the voices, room and music around them: ${capped.map((c) => `${c.name} -${c.cut.toFixed(1)} dB (was +${c.over.toFixed(1)}${c.loud ? ", loud" : ""})`).join(", ")}`
    : `spike guard: every effect within ${G.over} dB of the voices, room and music around it`);
  log.push(`spike guard: mix levelled ${(lift >= 0 ? "+" : "") + lift.toFixed(1)} dB to ${got.toFixed(1)} LUFS; limiters at ${G.ceiling} dBTP took up to ${flim.max.toFixed(1)} dB off the effects' peaks, ${vlim.max.toFixed(1)} dB off the voices' and ${lim.max.toFixed(1)} dB off the whole mix (${Math.round(lim.ms)} ms over 1 dB)`);
  a1.peak = lim.peak; a1.levels = levels; a1.guard = { capped, levelled: lift, lufs: got, limiter: lim, fxLimiter: flim, voiceLimiter: vlim };
  return a1;
}

// look-ahead true-peak limiter: the gain needed under the ceiling at every sample, its minimum over the next
// `lookahead`, averaged over the same span (so it slides down ahead of the peak and is never above what the peak needs),
// then released exponentially. In place; returns { max (dB of reduction), ms over 1 dB, peak }.
export function limit(L, R, sr, G = GUARD) {
  const n = L.length, W = Math.max(1, Math.round(G.lookahead * sr)), c = Math.pow(10, G.ceiling / 20), tp = truePeak([L, R]);
  const need = new Float32Array(n); for (let i = 0; i < n; i++) need[i] = tp[i] > c ? c / tp[i] : 1;
  // minimum of need[i .. i + W] (monotone deque)
  const h = new Float32Array(n), q = new Int32Array(n + W + 1); let qh = 0, qt = 0;
  for (let j = n - 1 + W; j >= 0; j--) {
    if (j < n) { while (qt > qh && need[q[qt - 1]] >= need[j]) qt--; q[qt++] = j; }
    while (qt > qh && q[qh] > j + W) qh++;
    if (j < n) h[j] = qt > qh ? need[q[qh]] : 1;
  }
  const rel = 1 - Math.exp(-1 / (G.release * sr));
  let s = 0, g = 1, max = 0, over = 0, peak = 0;
  for (let i = 0; i < n; i++) {
    s += h[i]; if (i >= W) s -= h[i - W];
    const sm = i >= W - 1 ? s / W : (s + (W - 1 - i)) / W;   // ones before the clip starts
    g = sm < g ? sm : g + (sm - g) * rel;
    L[i] *= g; R[i] *= g;
    const d = -20 * Math.log10(g); if (d > max) max = d; if (d > 1) over++;
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  }
  return { max, ms: (over / sr) * 1000, peak };
}

// the n loudest moments of a finished mix (mono or [L, R]): 400 ms windows at least 1 s apart, with their loudness,
// how far they stand over the clip's own loudness and the effects playing there. [{ t, lufs, over, what }]
export function loudestMoments(chs, sr, events = [], n = 3, offset = 0) {
  const m = momentary(kPower(chs, sr, 0.1), 4), I = integrated(chs, sr), idx = [...m.keys()].sort((a, b) => m[b] - m[a]), out = [];
  for (const i of idx) {
    const c = i * 0.1 + 0.2, t = c - offset;
    if (out.some((o) => Math.abs(o.t - t) < 1)) continue;
    const what = events.filter((e) => e.start != null && e.samples?.length && topOf(e) >= t - 0.2 && topOf(e) <= t + 0.2).map((e) => e.kind);
    for (const e of events) if ((e.kind === "voice" || e.kind === "speech") && e.at <= t + 0.2 && e.at + (e.action?.dur ?? e.dur ?? 0.6) >= t - 0.2) what.push(`${e.who ?? "narrator"}'s line`);
    out.push({ t, lufs: m[i], over: m[i] - I, what: [...new Set(what)] });
    if (out.length >= n) break;
  }
  return out;
}
