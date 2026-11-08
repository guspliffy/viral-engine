// "life": "auto" (Jonny 7 Nov 2026, "apply it to all future videos and backgrounds"): the engine fills in the living
// world for any painted outdoor set (set type "env") from the storyboard itself, so a clip gets it with one word:
//   "set": { "type": "env", "env": "meadow-path", "life": "auto" }      a living day
//   "set": { ..., "life": "storm" }                                      the same place on a stormy day
//   "set": { ..., "life": { "auto": true, "song": 0.5, ... } }           auto, with any field of set.life overriding
// What it adds, from the place (env.json) and the story:
//   - wind: gusts travelling across the grass and trees (calm day or storm), heard in the bed
//   - clouds: the sky drifts, and on a sunny day cloud shadows slide over the far hills (never on the cast)
//   - birds: a small flock of sparrows on the ground FAR behind the cast (background action stays background, Jonny
//     7 Nov 19:17), only by day, on a ground they could stand on (not water), never in the rain
//   - butterflies: by day on grass or dirt, also behind the cast
//   - startles: every loud moment in the storyboard (a shouted or excited line, an impact, a shake, a crash, a slam)
//     sends the birds off from where it happened; birds that flee stay gone
//   - rain: a light rain when the place is a rainy one (its name says so); a storm brings its own
// Night and dusk: no butterflies, no birds at night, the song quieter at dusk and silent at night.
// A set that isn't an env (a room plate, a plain set) has no life: the key is dropped, so the template can carry it.
// Pure function of the storyboard (renders are sharded and cached).
import { lifeRng } from "./life.js";

const LOUD_TONE = /excited|angry|shout|scream|yell|terrified|panic|furious|rage|cheer/i;
const LOUD_SOUND = /screech|thud|crash|slam|explo|bang|boom|smash|bonk|honk|horn|shatter|impact|crunch|clang|scream|roar|smack|whack|pop-big|thunder/i;

// where an actor stands at time t (start place, then each walk's end once it has begun)
function placeAt(sb, who, t) {
  const c = (sb.cast || []).find((k) => k.id === who);
  let p = c?.at ? [c.at[0], c.at[1]] : null;
  for (const a of sb.actions || []) {
    if (a.who !== who || a.do !== "move" || !a.to || (a.at ?? 0) > t) continue;
    const k = Math.min(1, Math.max(0, (t - (a.at ?? 0)) / Math.max(1e-3, a.dur ?? 1)));
    const from = p || a.to; p = [from[0] + (a.to[0] - from[0]) * k, from[1] + (a.to[1] - from[1]) * k];
  }
  return p;
}

// every place a character stands during the clip (start and every walk's end)
function allPlaces(sb) {
  const out = [];
  for (const c of sb.cast || []) if (Array.isArray(c.at)) out.push(c.at);
  for (const a of sb.actions || []) if (a.do === "move" && Array.isArray(a.to)) out.push(a.to);
  return out.length ? out : [[0, 0]];
}

const centre = (sb) => { const P = allPlaces(sb); return [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length]; };

// the loud moments of the story
export function loudMoments(sb) {
  const out = [], mid = centre(sb);
  const at = (who, t) => (who && placeAt(sb, who, t)) || mid;
  for (const a of sb.actions || []) {
    if (a.do !== "talk" || !a.line) continue;
    const letters = a.line.replace(/[^A-Za-z]/g, ""), caps = letters && letters.replace(/[^A-Z]/g, "").length / letters.length;
    if ((a.tone && LOUD_TONE.test(a.tone)) || (/!/.test(a.line) && caps > 0.6)) out.push({ t: a.at ?? 0, at: at(a.who, a.at ?? 0), loud: 1, why: `line "${a.line}"` });
  }
  for (const f of [...(sb.fx || []), ...(sb.actions || []).filter((a) => a.fx)]) {
    const kind = f.fx || f.do;
    if (kind === "impact" || (kind === "shake" && (f.amp ?? 0.03) >= 0.03)) out.push({ t: f.at ?? 0, at: at(f.who, f.at ?? 0), loud: 1.2, why: kind });
  }
  for (const s of sb.sfx || []) {
    const name = s.sound || s.name || s.id || "";
    if (LOUD_SOUND.test(name) && (s.gain ?? 1) >= 0.5) out.push({ t: s.at ?? 0, at: at(s.who, s.at ?? 0), loud: 1, why: `sound ${name}` });
  }
  // one startle per moment: sounds within half a second of each other are the same event
  out.sort((a, b) => a.t - b.t);
  return out.filter((s, i) => i === 0 || s.t - out[i - 1].t > 0.5);
}

// the time of day from the painting's light note
function dayPart(E) {
  const s = `${E?.light?.from || ""} ${E?.name || ""}`.toLowerCase();
  if (/moon|night|star/.test(s)) return "night";
  if (/dusk|blue-hour|sunset|twilight/.test(s)) return "dusk";
  return "day";
}

export function resolveLife(sb) {
  const set = sb.set, L = set?.life;
  if (L == null || L === false) return sb;
  const auto = L === true || L === "auto" || L === "storm" || (typeof L === "object" && L.auto);
  if (!auto) return sb;
  if (set.type !== "env") { const { life, ...rest } = set; return { ...sb, set: rest }; }   // indoors / a plain set: none yet
  const E = set.envData || {}, own = typeof L === "object" ? { ...L } : {};
  delete own.auto;
  const storm = L === "storm" || !!own.storm, part = dayPart(E), surface = E.surface || "grass";
  const rainy = /rain/.test(E.name || set.env || "");
  const seed = own.seed ?? ((sb.seed ?? [...String(sb.id || "clip")].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)) % 997) + 1;
  const r = lifeRng(seed);
  const P = allPlaces(sb), mid = centre(sb), back = Math.min(...P.map((p) => p[1]));
  const props = (sb.props || []).filter((p) => Array.isArray(p.at)).map((p) => [p.at[0], p.at.length > 2 ? p.at[2] : p.at[1]]);
  const clear = (x, z) => P.every((p) => Math.hypot(p[0] - x, p[1] - z) > 2.4) && props.every((p) => Math.hypot(p[0] - x, p[1] - z) > 2);
  const life = { seed };
  if (storm) life.storm = true;
  // birds: a flock on the ground well behind everyone, to one side of the middle, by day on firm ground, not in rain
  if (!storm && !rainy && part !== "night" && surface !== "water") {
    const side = r() < 0.5 ? -1 : 1;
    for (const dz of [3.4, 4.2, 5.2]) {
      const z = back - dz, x = mid[0] + side * (0.6 + r() * 0.6);
      if (clear(x, z)) { life.birds = [{ flock: { n: 3 + Math.floor(r() * 3), at: [+x.toFixed(2), +z.toFixed(2)], r: 0.5 } }]; break; }
    }
  }
  // butterflies: by day on grass or dirt, low over the ground behind the cast
  if (!storm && !rainy && part === "day" && /grass|dirt/.test(surface)) {
    const z = back - 2.6;
    life.butterflies = { n: 2, at: [[+(mid[0] - 1.5).toFixed(2), 0.5, +z.toFixed(2)], [+(mid[0] + 1.6).toFixed(2), 0.6, +(z - 1.2).toFixed(2)]].filter((p) => clear(p[0], p[2])), r: 0.4, color: "#f0a23a" };
    if (!life.butterflies.at.length) delete life.butterflies;
  }
  if (part === "night") life.clouds = { shadow: 0 };
  if (rainy && !storm) { life.rain = { n: 350, speed: 8, len: 0.28 }; life.clouds = { shadow: 0 }; }
  life.song = storm || rainy || part === "night" ? 0 : part === "dusk" ? 0.4 : 1;
  // a shout carries far over open ground: the flock behind the cast goes whatever its distance (up to 11 m for a line,
  // 14 m for a crash); their take-off is far off, so it is quiet in the bed
  // Birds that flee stay gone, so only one moment sends them: not the opening line (they would be gone before anyone
  // saw them), but the payoff's loud moment if it has one, else the first crash, else the first shout after 1.5 s
  const M = loudMoments(sb).filter((m) => m.t >= 1.5), pay = (sb.beatSpans || []).find((b) => b.kind === "payoff");
  const pick = (pay && M.find((m) => m.t >= pay.from - 0.3 && m.t <= pay.to)) || M.find((m) => m.loud > 1) || M[0];
  life.startle = life.birds && pick ? [{ t: +pick.t.toFixed(3), at: [+pick.at[0].toFixed(2), +pick.at[1].toFixed(2)], loud: 1,
    reach: pick.loud > 1 ? 14 : 11, wings: 0.5 }] : [];
  const out = { ...life, ...own };
  const newSet = { ...set, life: out };
  if (storm) { newSet.grade ??= "storm"; newSet.sway ??= 2; }
  return { ...sb, set: newSet };
}
