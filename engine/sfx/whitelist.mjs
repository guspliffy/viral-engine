// The sound whitelist (assets/sfx/whitelist.json): the only sounds a storyboard may name, each with a plain line on
// what it really sounds like. Lessons of 29 Oct: the library's "kenney/slime" was a sci-fi blip, not goo, and
// "kenney/low-random" a synth blip, not a string; both went into clips because only their names were read.
//
// loadStoryboard (engine/load.mjs) runs every storyboard's sfx through soundsOf() before anything else uses them:
//   - a name may be an id ("pan-bonk") or one of Jonny's words for it ("bonk", "dö-döm", "splort"); words are matched
//     without case, accents or punctuation ("Dö Döm" = "dö-döm" = "doe-doem"), and the entry keeps "asked": the word
//   - a sound with no whitelist entry is refused: describe it first (measure it: node engine/sfx/measure.mjs <id>)
//   - a sound with "scenes" (sci-fi blips, menu beeps, jingles) plays only in a clip that declares one of them:
//     "sound": { "scenes": ["ui"] } for a phone or computer on screen, "scifi", "jingle"
//   - a sound marked "pending" comes with an open branch; until it lands the error says which
//   - "asPosted": true on an sfx entry lets a scene-kept sound through in a clip that is already posted, so its
//     re-render keeps the sound Jonny posted (the Elevator orb, Chef's tension blip). Never in a new clip.
// All problems of a storyboard are reported at once, before a render starts.
//
//   node engine/sfx/whitelist.mjs              every sound by family, with its words
//   node engine/sfx/whitelist.mjs wet          search the descriptions, words and ids
//   node engine/sfx/whitelist.mjs --check      every sound the engine has is described, words are unique
import fs from "node:fs";
import path from "node:path";
import { DIR } from "./library.mjs";

let WL = null, WORDS = null, CAT = null;
const wl = () => (WL ??= JSON.parse(fs.readFileSync(path.join(DIR, "whitelist.json"), "utf8")));
const catalog = () => (CAT ??= JSON.parse(fs.readFileSync(path.join(DIR, "catalog.json"), "utf8")).sounds);

// "Dö-Döm" -> "dodom" (and "doe-doem" -> "doedoem", which the umlaut spelling of each word also indexes)
const plain = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const umlaut = (s) => plain(String(s).toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss"));
export function words() {
  if (WORDS) return WORDS;
  WORDS = new Map();
  for (const [id, e] of Object.entries(wl().sounds)) for (const w of e.words || []) for (const k of new Set([plain(w), umlaut(w)])) WORDS.set(k, [...(WORDS.get(k) || []), { id, word: w }]);
  return WORDS;
}

export const entry = (id) => wl().sounds[id] ?? null;
export const describe = (id) => entry(id)?.says ?? null;

// the id a name stands for, or null
export function idOf(name) {
  if (wl().sounds[name]) return name;
  const hit = words().get(plain(name));
  return hit ? hit[0].id : null;
}

// a few sounds whose id, words or description share a word with the query, best first
export function search(q) {
  const SKIP = new Set(["kenney", "ai", "oga", "package", "the", "and", "a", "of"]);
  const terms = String(q).toLowerCase().split(/[^a-zäöüß0-9]+/).filter((t) => t.length > 2 && !SKIP.has(t));
  const rows = Object.entries(wl().sounds).map(([id, e]) => {
    const hay = ` ${id.replace(/^[a-z-]+\//, "")} ${(e.words || []).join(" ")} ${e.says} ${e.family} `.toLowerCase().replace(/[^a-zäöüß0-9]+/g, " ");
    return { id, e, score: terms.reduce((n, t) => n + (new RegExp(`\\b${t}`).test(hay) ? ((e.words || []).some((w) => plain(w) === plain(t)) || id.endsWith(t) ? 3 : 1) : 0), 0) };
  });
  return rows.filter((r) => r.score > 0 && !r.e.same).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

const line = (id, e) => `"${id}"${e.words?.length ? ` (${e.words.map((w) => `"${w}"`).join(", ")})` : ""}: ${e.says}${e.scenes ? ` [only in a ${e.scenes.join(" or ")} scene]` : ""}`;

// one storyboard sfx name -> { id } or { problem }
export function check(name, scenes = []) {
  const id = idOf(name);
  if (!id) {
    const near = search(name).slice(0, 3);
    return { problem: `"${name}" isn't on the sound whitelist (assets/sfx/whitelist.json).${near.length ? ` Close: ${near.map((r) => `"${r.id}"`).join(", ")}.` : ""} Find one by what it sounds like (node engine/sfx/whitelist.mjs <word>), or measure a new sound and describe it first (node engine/sfx/measure.mjs).` };
  }
  const e = entry(id);
  if (e.pending && /\//.test(id) && !catalog()[id]) return { id, problem: `"${name}" = "${id}" (${e.says}) comes with ${e.pending}, which isn't in this checkout yet.` };
  if (e.scenes && !e.scenes.some((s) => scenes.includes(s))) {
    const fits = search(name).filter((r) => !r.e.scenes).slice(0, 3);
    const eg = e.scenes.includes(e.family) ? e.family : e.scenes[0];
    return { id, problem: `"${name}" is ${e.says}. It plays only in a clip that says it is a ${e.scenes.join(" or ")} scene ("sound": { "scenes": ["${eg}"] }; ${e.scenes.map((s) => `${s}: ${wl().scenes[s]}`).join("; ")}).${fits.length ? ` Otherwise: ${fits.map((r) => `"${r.id}"`).join(", ")}.` : ""}` };
  }
  return { id };
}

// a compiled storyboard with every sfx name turned into its whitelisted id; throws with every problem at once
export function soundsOf(sb) {
  if (!sb.sfx?.length) return sb;
  const scenes = sb.sound?.scenes || [], problems = new Map();   // problem -> the times it happens
  const sfx = sb.sfx.map((s) => {
    if (s.sound == null) return s;
    const r = check(s.sound, s.asPosted ? Object.keys(wl().scenes) : scenes);
    if (r.problem) { problems.set(r.problem, [...(problems.get(r.problem) || []), s.at]); return s; }
    return r.id === s.sound ? s : { ...s, sound: r.id, asked: s.sound };
  });
  if (problems.size) throw new Error(`${sb.id || "storyboard"}: ${problems.size} sound${problems.size > 1 ? "s" : ""} not allowed\n${[...problems].map(([p, at]) => `  sfx at ${at.join(", ")} s: ${p}`).join("\n")}`);
  return { ...sb, sfx };
}

// ---------- the command line ----------
async function coverage() {
  const { CODE_SOUNDS } = await import("../audio.mjs");
  const { SIGNATURES } = await import("./signature.mjs");
  const S = wl().sounds, out = [], have = new Set([...CODE_SOUNDS, ...SIGNATURES, ...Object.keys(catalog()), "speech"]);
  for (const id of have) if (!S[id]) out.push(`no description: "${id}" (measure it: node engine/sfx/measure.mjs ${id})`);
  for (const id of CODE_SOUNDS) if (catalog()[id]) out.push(`"${id}" is both a code effect and a library sound: one name, one sound (rename one)`);
  for (const [id, e] of Object.entries(S)) {
    if (!e.family || !wl().families[e.family]) out.push(`"${id}": unknown family "${e.family}"`);
    if (!e.says) out.push(`"${id}": no "says"`);
    for (const s of e.scenes || []) if (!wl().scenes[s]) out.push(`"${id}": unknown scene "${s}"`);
    if (e.same && !S[e.same]) out.push(`"${id}": "same" names "${e.same}", which isn't listed`);
    if (!have.has(id) && !e.pending) out.push(`"${id}" is described but the engine has no such sound`);
    if (have.has(id) && e.pending) out.push(`"${id}" is in this checkout now: drop its "pending"`);
  }
  for (const [k, ids] of words()) {
    const u = [...new Set(ids.map((x) => x.id))];
    if (u.length > 1) out.push(`the word "${ids[0].word}" means ${u.map((x) => `"${x}"`).join(" and ")}: give it to one`);
    if (S[k] && !u.includes(k)) out.push(`the word "${ids[0].word}" is also the id of another sound ("${k}")`);
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args[0] === "--check") {
    // no top-level await: audio.mjs imports this module back (through load.mjs)
    coverage().then((out) => {
      for (const l of out) console.log(l);
      console.log(out.length ? `whitelist: ${out.length} problem${out.length > 1 ? "s" : ""}` : `whitelist: ok, ${Object.keys(wl().sounds).length} sounds, ${words().size} word keys`);
      process.exit(out.length ? 1 : 0);
    });
  } else if (args.length) {
    const rows = search(args.join(" "));
    for (const r of rows.slice(0, 15)) console.log(line(r.id, r.e));
    if (!rows.length) console.log(`nothing matches "${args.join(" ")}"`);
  } else {
    const by = {};
    for (const [id, e] of Object.entries(wl().sounds)) if (!e.same) (by[e.family] ??= []).push(line(id, e));
    for (const [f, about] of Object.entries(wl().families)) if (by[f]) console.log(`\n${f.toUpperCase()}: ${about}\n  ${by[f].join("\n  ")}`);
  }
}
