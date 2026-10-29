// Signature sounds: one sound per series lead, the same every time, so viewers learn it. Phoenix gets a flame
// whoosh (air rushing in, a fire bursting, embers crackling, a short bird cry on top), Reaper a low bell (one
// deep toll with slow beating, like a church bell far off), the Wizard a sparkle (a quick run up a Lydian scale on
// a celesta-like tone, a high twinkle and glitter).
//
// They play by themselves on a lead's entrance (the first time they come into frame after the opening: walking in,
// a `show`, or a cut to them), at most once each per clip. On the payoff (the beat marked "kind": "payoff") only
// when the payoff is that lead's own trick: the Wizard charging a spell, Phoenix flying or flaring its wings, Reaper's
// scythe. Anything else on the payoff stays free of them: in Don't Touch the Charger the Wizard's sparkle played on
// the catch and Jonny heard it as a "bling" that had nothing to do with the joke. A storyboard can name them as
// sounds too: { "sfx": "sig-reaper" }.
//   "sound": { "signature": false }                     none in this clip
//   "sound": { "signature": { "entrances": false } }    no entrances
//   "sound": { "signature": { "payoff": false } }       never on the payoff; true: whichever lead acts first on it
//                                                       (the old default); "<cast id>": that one
//   a cast entry's "signature": false keeps that member silent, "signature": "reaper" gives them that sound
//
// Unlike the other effects these never vary (no seeded pitch or take): a signature has to sound the same in every
// clip. Claude can't hear them: they are built and placed by measurement, and Jonny's ears decide.
import { SR, TAU, biquad, run, retune, env, buf, normalise } from "./dsp.mjs";
import { rng } from "../page/util.js";

// the lead a character file is, from its name (halloween/wizard-host is the Wizard in costume)
const LEADS = [["phoenix", /(^|\/)phoenix/], ["reaper", /(^|\/)reaper/], ["wizard", /(^|\/)wizard/]];
export const leadOf = (c) => (c.signature === false ? null : typeof c.signature === "string" ? c.signature : LEADS.find(([, re]) => re.test(c.character || ""))?.[0] ?? null);

// Phoenix: air rushing in for 0.3 s, then the flame catches (a low "fwoomp", a roar that darkens as it dies) with
// embers crackling, and a short rising bird cry on the burst. The hit (the burst) is 0.3 s in.
function phoenix() {
  const r = rng(7741), rise = 0.3, d = 1.3, x = buf(d), bp = biquad("bp", 300, 0.9);
  let lp = biquad("lp", 4000, 0.7), p = 0, pc = 0;
  for (let i = 0; i < x.length; i++) {
    const t = i / SR, n = r() * 2 - 1, k = Math.min(1, t / rise), u = t - rise;
    if (i % 32 === 0) { retune(bp, "bp", 300 + 2200 * k * k, 0.9); if (u > 0) retune(lp, "lp", 350 + 3600 * Math.exp(-u / 0.18), 0.7); }
    let y = t < rise + 0.04 ? run(bp, n) * k * k * 1.3 * Math.min(1, (rise + 0.04 - t) / 0.04) : 0;
    if (u >= 0) {
      p += TAU * (120 * Math.pow(48 / 120, Math.min(1, u / 0.3))) / SR;
      y += Math.sin(p) * env(u, 0.006, 0.12, d) * 0.9;                       // the fwoomp
      y += run(lp, n) * env(u, 0.01, 0.32, d) * 1.1;                         // the roar
      // the cry: 0.26 s, up from 1.5 to 2.6 kHz and back a little, a bit of flutter
      if (u < 0.26) { const c = u / 0.26, f = 1500 + 1100 * Math.sin(c * Math.PI * 0.75) * (1 + 0.02 * Math.sin(TAU * 32 * u)); pc += TAU * f / SR; y += (Math.sin(pc) + 0.25 * Math.sin(2 * pc)) * Math.sin(Math.PI * c) * 0.22; }
    }
    x[i] = y;
  }
  // embers: short bright ticks, dense at the burst and thinning out
  const hp = biquad("hp", 2500, 0.7);
  for (let k = 0; k < 34; k++) {
    const t0 = rise + 0.02 + Math.pow(r(), 1.8) * 0.9, a = Math.round(t0 * SR), g = (0.25 + 0.5 * r()) * Math.exp(-(t0 - rise) / 0.5);
    for (let i = 0; i < 0.006 * SR && a + i < x.length; i++) x[a + i] += run(hp, r() * 2 - 1) * Math.exp(-i / SR / 0.0012) * g;
  }
  return Object.assign(x, { hit: rise });
}

// Reaper: one toll of a low bell in D. Bell partials (hum, prime, minor third, fifth, nominal and the bright ones
// above) each ring out at their own rate, each a pair a fraction of a hertz apart so the tone slowly swells and
// fades like a real bell. A dull clank of the clapper starts it. The hit is the strike.
function reaper() {
  const f = 146.8, d = 2.8, x = buf(d), r = rng(2209);
  const P = [[0.5, 0.5, 2.6], [1, 0.6, 1.9], [1.183, 0.5, 1.4], [1.506, 0.22, 1.0], [2.0, 0.5, 1.1], [2.514, 0.16, 0.6], [2.662, 0.13, 0.5], [3.011, 0.12, 0.42], [4.166, 0.07, 0.25], [5.433, 0.04, 0.15]];
  const lp = biquad("lp", 1800, 0.7), cl = biquad("bp", 520, 3);
  for (let i = 0; i < x.length; i++) {
    const t = i / SR, fade = Math.min(1, (d - t) / 0.4);
    let y = 0;
    for (const [m, a, dec] of P) { const ff = f * m, beat = 0.35 + 0.25 * m; y += a * Math.exp(-t / dec) * (Math.sin(TAU * ff * t) + Math.sin(TAU * (ff + beat) * t + 1.1)) * 0.5; }
    y *= Math.min(1, t / 0.002);
    y += run(cl, run(lp, r() * 2 - 1)) * env(t, 0.0005, 0.02, d) * 2.2;     // the clapper
    x[i] = y * fade;
  }
  return Object.assign(x, { hit: 0.004 });
}

// Wizard: eight notes up D Lydian (the raised fourth is the "magic" colour) in 0.34 s on a celesta-like tone, a
// high double twinkle on top that shimmers out, a breath of bright air and a sprinkle of glitter. Starts on its frame.
function wizard() {
  const r = rng(5113), d = 1.4, x = buf(d);
  const NOTES = [587.3, 659.3, 740.0, 830.6, 880.0, 987.8, 1108.7, 1174.7], step = 0.045;
  NOTES.forEach((f, k) => {
    const a = Math.round(k * step * SR), g = 0.32 + 0.04 * k;
    for (let i = 0; i < 0.5 * SR && a + i < x.length; i++) { const t = i / SR; x[a + i] += (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 4 * t) * Math.exp(-t / 0.05) + 0.12 * Math.sin(TAU * f * 2 * t)) * env(t, 0.002, 0.16, 0.5) * g; }
  });
  const top = NOTES.length * step;
  for (let i = Math.round(top * SR); i < x.length; i++) {
    const t = i / SR - top, sh = 0.75 + 0.25 * Math.sin(TAU * 7 * t);
    x[i] += (Math.sin(TAU * 2349.3 * t) * 0.3 + Math.sin(TAU * 3520 * t) * 0.16) * env(t, 0.003, 0.35, d - top) * sh;
  }
  const air = biquad("hp", 6000, 0.7);
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] += run(air, r() * 2 - 1) * Math.sin(Math.PI * Math.min(1, t / 0.9)) ** 2 * (t < 0.9 ? 0.12 : 0); }
  for (let k = 0; k < 26; k++) {
    const t0 = 0.08 + r() * 0.95, f = 4200 + r() * 4800, a = Math.round(t0 * SR), g = 0.12 + 0.12 * r();
    for (let i = 0; i < 0.04 * SR && a + i < x.length; i++) x[a + i] += Math.sin(TAU * f * i / SR) * Math.exp(-i / SR / 0.008) * g;
  }
  return Object.assign(x, { hit: 0 });
}

const MAKE = { phoenix, reaper, wizard }, made = {};
// gains for the mix, set so each sits a little over the clip's other effects (qa/sound.mjs sound-level reports it)
const GAIN = { phoenix: 0.5, reaper: 0.5, wizard: 0.42 };
export const SIGNATURES = Object.keys(MAKE).map((k) => `sig-${k}`);
export const isSignature = (kind) => /^sig-/.test(kind) && !!MAKE[kind.slice(4)];
// the samples, peak 1 (with .hit, seconds from the first sample to the moment that lands on the event)
export function signatureSound(kind) { const k = kind.slice(4); if (!made[k]) { const x = MAKE[k](); made[k] = Object.assign(normalise(x, 1), { hit: x.hit }); } return made[k]; }
export const signatureGain = (kind) => GAIN[kind.slice(4)] ?? 0.45;

// ---------- where they go ----------
// each lead's own trick: the actions that make a payoff theirs (docs/character-bible.md)
export const TRICKS = { wizard: ["charge"], phoenix: ["fly", "hover", "flare", "wings"], reaper: ["slash"] };
const QUIET = new Set(["look", "blink", "noblink", "still", "expr", "face", "grip", "hatsway", "hatwobble", "hide"]);

// is a point on screen at time t: a pinhole camera from timeline.js cameraState, 9:16 frame, a little margin inside
function onScreen(cam, p, aspect = 9 / 16) {
  const f = cam.look.map((v, i) => v - cam.pos[i]), fn = Math.hypot(...f); f.forEach((v, i) => (f[i] = v / fn));
  const rn = Math.hypot(f[2], f[0]) || 1, rx = -f[2] / rn, rz = f[0] / rn;                  // right = forward x up
  const ux = -rz * f[1], uy = rz * f[0] - rx * f[2], uz = rx * f[1];                           // up = right x forward
  const d = [p[0] - cam.pos[0], p[1] - cam.pos[1], p[2] - cam.pos[2]];
  const z = d[0] * f[0] + d[1] * f[1] + d[2] * f[2]; if (z < 0.3) return false;
  const th = Math.tan((cam.fov * Math.PI) / 360), x = (d[0] * rx + d[2] * rz) / (z * th * aspect), y = (d[0] * ux + d[1] * uy + d[2] * uz) / (z * th);
  return Math.abs(x) < 0.92 && Math.abs(y) < 0.95;
}

// the punchline: "music": { "payoff": t }, else the beat marked "kind": "payoff", else one named payoff / reveal /
// punchline. Unlike the music lock (engine/music.mjs payoffOf) not the last escalation: that is the joke's second
// turn, and a signature there would give the ending away.
export function punchline(sb) {
  if (sb.music?.payoff != null) return sb.music.payoff;
  const b = sb.beatSpans || [], p = b.find((x) => x.kind === "payoff") ?? b.find((x) => /payoff|reveal|punch/i.test(x.name || ""));
  return p ? p.from : null;
}

// the signature events of a storyboard: [{ kind: "sig-reaper", at, who, why }]. tl = engine/page/timeline.js
// ({ actorState, cameraState }), chars = the loaded character files.
// Visibility is a projection of the body's middle, so a lead behind a wall still counts as on screen (no
// occlusion): one there from the start gets no entrance sound (a miss rather than a sound with nothing to see), and
// one revealed by a cut gets it on their first move after the cut (the Wizard opening his door).
export function signatureEvents(sb, chars, tl, payoff = punchline(sb)) {
  const cfg = sb.sound?.signature ?? true;
  if (cfg === false || !tl) return [];
  const opt = typeof cfg === "object" ? cfg : {}, out = [], dur = sb.duration;
  const leads = (sb.cast || []).map((c) => ({ c, lead: leadOf(c) })).filter((x) => x.lead && MAKE[x.lead]);
  const seen = (c, t) => {
    const s = tl.actorState(sb, c, chars[c.character] || {}, t);
    return s.visible !== false && onScreen(tl.cameraState(sb, t), [s.x, s.y + 0.45 * (s.scale ?? 1), s.z]);
  };
  if (opt.entrances !== false) for (const { c, lead } of leads) {
    if (seen(c, 0) || seen(c, 0.15)) continue;                     // on screen from the start: no entrance
    let t = 0.1; while (t < dur - 0.2 && !seen(c, t)) t += 0.1;
    if (t >= dur - 0.2) continue;
    let lo = t - 0.1; for (let k = 0; k < 4; k++) { const m = (lo + t) / 2; if (seen(c, m)) t = m; else lo = m; } // to about a frame
    // revealed by a cut: they may still be behind a door or a wall, so the sound waits for their first move (within 0.8 s)
    const cut = (sb.shots || []).find((x) => x.at > 0 && x.at >= lo - 1e-3 && x.at <= t + 1e-3);
    if (cut) { const a = (sb.actions || []).find((x) => x.who === c.id && !QUIET.has(x.do) && x.at >= cut.at && x.at <= cut.at + 0.8); t = a ? a.at : cut.at; }
    out.push({ kind: `sig-${lead}`, at: Math.round(t * 1000) / 1000, who: c.id, why: "entrance" });
  }
  if (payoff != null && opt.payoff !== false) {
    const pick = typeof opt.payoff === "string" ? opt.payoff : null, trick = opt.payoff === undefined;
    const isTrick = (a) => TRICKS[leads.find((l) => l.c.id === a.who).lead]?.includes(a.do);
    const acts = (sb.actions || []).filter((a) => !QUIET.has(a.do) && a.at >= payoff - 0.1 && a.at <= payoff + 1.2 && leads.some((l) => l.c.id === a.who) && (!pick || a.who === pick) && (!trick || isTrick(a))).sort((p, q) => p.at - q.at);
    const a = acts.find((x) => seen(leads.find((l) => l.c.id === x.who).c, Math.max(payoff, x.at) + 0.05));
    if (a) {
      const lead = leads.find((l) => l.c.id === a.who).lead, at = Math.round(Math.max(payoff, a.at) * 1000) / 1000;
      // one signature per lead in a few seconds: an entrance right before the payoff already said who it is
      if (!out.some((e) => e.who === a.who && Math.abs(e.at - at) < 2.5)) out.push({ kind: `sig-${lead}`, at, who: a.who, why: "payoff" });
    }
  }
  return out.sort((p, q) => p.at - q.at);
}
