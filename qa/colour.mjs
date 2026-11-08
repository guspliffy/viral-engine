#!/usr/bin/env node
// Colour probe (look-2d-layer-01, 7 Nov 2026): does each character still wear its own colours in this clip's light?
// A night set, a storm, a phone's glow or the grade can turn Phoenix's orange crest brown or the Wizard's purple grey,
// and a recurring "friend type" should read the same in every episode and on every thumbnail. Eyes judge colour by
// mood ("looks orange to me"); this measures it against the character file's own hex values.
//
//   node qa/colour.mjs storyboards/x.json                 -> one still per beat (with the character map), per character
//                                                           and per signature colour: the median colour drawn vs its hex
//   node qa/colour.mjs storyboards/x.json --at 1,4.5      -> these times instead of the beats
//   node qa/colour.mjs storyboards/x.json --json          -> the numbers as JSON
//
// How: render.mjs draws each still and a map of which character covers each pixel (--ids, as qa/readability.mjs). A
// character's signature colours are the hex values in its file: the body colour and the costume's colours (accent,
// tip, cloak, hat...). Each of the character's coloured pixels goes to the signature colour nearest to it (within 40
// degrees of hue), so those pixels are that colour's paint as drawn; their median is compared with the hex in CIE Delta E 2000 with lightness counted half
// (kL 2: a scene may be darker or brighter, it may not change what colour a thing is). A colour that swings more than
// 10 from its own usual value in this clip warns (the light makes it another colour at that beat); one more than 12
// from its file colour all clip long is a note. Colours covering under 1.5 % of the character at that beat are skipped (not on show).
// Warnings only: a deliberate grade (a red emergency light) is a choice, and this names where it changes a character.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readRGB, lab } from "./pixels.mjs";
import { loadStoryboard, loadCharacters } from "../engine/load.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const W = 540, H = 960, HUE = 40, MIN_CHROMA = 8, MIN_SHARE = 0.015, SWING = 10, NOTE = 12;

const hexRGB = (h) => { const n = parseInt(h.replace("#", "").slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const hueOf = (a, b) => (Math.atan2(b, a) * 180) / Math.PI;
const hueGap = (x, y) => { const d = Math.abs(x - y) % 360; return d > 180 ? 360 - d : d; };

// CIEDE2000 with lightness weight kL
export function dE00(p, q, kL = 1) {
  const [L1, a1, b1] = p, [L2, a2, b2] = q, R = Math.PI / 180;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cm = (C1 + C2) / 2, G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const a1p = a1 * (1 + G), a2p = a2 * (1 + G), C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const h1 = (Math.atan2(b1, a1p) / R + 360) % 360, h2 = (Math.atan2(b2, a2p) / R + 360) % 360;
  const dL = L2 - L1, dC = C2p - C1p;
  let dh = h2 - h1; if (C1p * C2p === 0) dh = 0; else if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
  const dH = 2 * Math.sqrt(C1p * C2p) * Math.sin((dh * R) / 2), Lm = (L1 + L2) / 2, Cmp = (C1p + C2p) / 2;
  let hm = h1 + h2; if (C1p * C2p !== 0) hm = Math.abs(h1 - h2) > 180 ? (h1 + h2 + 360) / 2 : (h1 + h2) / 2;
  const T = 1 - 0.17 * Math.cos((hm - 30) * R) + 0.24 * Math.cos(2 * hm * R) + 0.32 * Math.cos((3 * hm + 6) * R) - 0.2 * Math.cos((4 * hm - 63) * R);
  const SL = 1 + (0.015 * (Lm - 50) ** 2) / Math.sqrt(20 + (Lm - 50) ** 2), SC = 1 + 0.045 * Cmp, SH = 1 + 0.015 * Cmp * T;
  const RT = -2 * Math.sqrt(Cmp ** 7 / (Cmp ** 7 + 25 ** 7)) * Math.sin(60 * Math.exp(-(((hm - 275) / 25) ** 2)) * R);
  return Math.sqrt((dL / (kL * SL)) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH));
}

// a character's signature colours: the body and every costume colour (name: hex), chromatic ones only (a black glove
// or a white cuff has no hue to drift)
export function signature(def, all = false) {
  const out = [];
  if (def?.body?.color) out.push(["body", def.body.color]);
  const walk = (o, pre) => { for (const [k, v] of Object.entries(o || {})) { if (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v)) out.push([pre + k, v]); else if (v && typeof v === "object" && !Array.isArray(v)) walk(v, pre + k + "."); } };
  walk(def?.costume, "costume.");
  // every other colour the file names (gloves, arms, eyes, brows) only claims its own pixels, it is never reported
  if (all) for (const [k, v] of Object.entries(def || {})) if (k !== "costume" && k !== "body" && v && typeof v === "object") walk(v, k + ".");
  return all ? out : out.filter(([, h]) => { const c = lab(...hexRGB(h)); return Math.hypot(c[1], c[2]) >= 18; });
}

export function probe(stillFile, idsFile, cast, defs) {
  const rgb = readRGB(stillFile, W, H), ids = readRGB(idsFile, W, H), N = W * H, res = [];
  const px = cast.map(() => []);
  for (let p = 0; p < N; p++) { const k = ids[p * 3]; if (k && k <= cast.length) px[k - 1].push(p); }
  cast.forEach((id, i) => {
    const area = px[i].length; if (area < 0.002 * N) return;
    const labs = px[i].map((p) => lab(rgb[p * 3], rgb[p * 3 + 1], rgb[p * 3 + 2]));
    const show = new Set(signature(defs[id]).map(([n]) => n));
    const sig = signature(defs[id], true).map(([name, hex]) => { const t = lab(...hexRGB(hex)); return { name, hex, t, h: hueOf(t[1], t[2]), grey: Math.hypot(t[1], t[2]) < 18, px: [] }; });
    if (!show.size) return;
    // each coloured pixel belongs to the signature colour it is nearest to (hue first, then the whole colour), so the
    // brown staff never collects the golden skin beside it, and dark sleeves or a white cuff go to the file's own dark or
    // white colours, not to the nearest bright one; a pixel far in hue from all of them (a reflection, a prop colour the
    // file doesn't name) belongs to none
    for (const c of labs) {
      const h = hueOf(c[1], c[2]), grey = Math.hypot(c[1], c[2]) < MIN_CHROMA; let best = null, bd = Infinity;
      for (const s of sig) {
        const g = s.grey || grey ? 0 : hueGap(h, s.h); if (g > HUE) continue;
        const d = dE00(s.t, c, 2) + 0.3 * g; if (d < bd) { bd = d; best = s; }
      }
      if (best && !grey) best.px.push(c);
    }
    for (const s of sig.filter((x) => show.has(x.name))) {
      const mine = s.px; if (mine.length < MIN_SHARE * area) continue;
      const med = [0, 1, 2].map((j) => { const v = mine.map((c) => c[j]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; });
      res.push({ id, colour: s.name, hex: s.hex, drawn: med.map((v) => Math.round(v)), share: Math.round((1000 * mine.length) / area) / 10, dE: Math.round(dE00(s.t, med, 2) * 10) / 10 });
    }
  });
  return res;
}

// per character colour over the clip: its usual offset from the file (the median over the beats: how this costume is
// drawn in this set's light) and the beat where the light moves it furthest from that. A swing is the finding: a glow,
// a grade or a shadow turning a character into another colour for a beat. A large offset all clip long is a note
// (the set's light, or a costume drawn off its file colour).
export function summarise(beats) {
  const by = {};
  for (const b of beats) for (const x of b.rows) (by[`${x.id} ${x.colour}`] ||= []).push({ ...x, t: b.t });
  const out = [];
  for (const v of Object.values(by)) {
    const ds = v.map((x) => x.dE).sort((p, q) => p - q), base = ds[Math.floor(ds.length / 2)];
    const w = v.reduce((p, q) => (q.dE > p.dE ? q : p)), swing = Math.round((w.dE - base) * 10) / 10, x = v[0];
    const level = swing > SWING ? "warn" : base > NOTE ? "note" : "pass";
    const msg = `${x.id} ${x.colour} ${x.hex}: usually Delta E ${base} from its file colour over ${v.length} beat(s)` +
      (swing > 3 ? `; at ${w.t.toFixed(2)} s ${w.dE}, drawn as lab(${w.drawn.join(", ")})` : "") +
      (level === "warn" ? " (the light turns it into another colour there: is that the story's light?)" : level === "note" ? " (drawn off its file colour all clip: this set's light or the costume)" : "");
    out.push({ level, check: "colour", who: x.id, colour: x.colour, base, swing, at: w.t, msg });
  }
  return out.sort((p, q) => q.swing - p.swing || q.base - p.base);
}

function main() {
  const a = process.argv.slice(2), o = { sb: null, at: "beats", json: false, out: path.join(ROOT, "out", "colour") };
  for (let i = 0; i < a.length; i++) { if (a[i] === "--at") o.at = a[++i]; else if (a[i] === "--json") o.json = true; else if (a[i] === "--out") o.out = path.resolve(a[++i]); else if (!o.sb) o.sb = a[i]; }
  if (!o.sb) { console.error("usage: node qa/colour.mjs <storyboard.json> [--at t,t | beats] [--json] [--out dir]"); process.exit(2); }
  const tmp = path.join(o.out, "stills"); fs.rmSync(tmp, { recursive: true, force: true });
  const r = spawnSync(process.execPath, [path.join(ROOT, "engine", "render.mjs"), o.sb, "--stills", o.at, "--ids", "--draft", "--out", tmp], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) { console.error((r.stderr || r.stdout).slice(-2000)); process.exit(1); }
  const sb = loadStoryboard(path.resolve(ROOT, o.sb)), chars = loadCharacters(sb);
  const defs = Object.fromEntries((sb.cast || []).map((c) => [c.id, chars[c.character] || chars[c.id] || null]));
  const metas = fs.readdirSync(tmp).filter((f) => f.endsWith(".ids.json")).map((f) => ({ f, ...JSON.parse(fs.readFileSync(path.join(tmp, f), "utf8")) })).sort((x, y) => x.t - y.t);
  const beats = metas.map((m) => ({ t: m.t, rows: probe(path.join(tmp, m.f.replace(/\.ids\.json$/, ".png")), path.join(tmp, m.f.replace(/\.json$/, ".png")), m.cast, defs) }));
  const results = summarise(beats);
  if (o.json) { console.log(JSON.stringify({ beats, results }, null, 1)); return; }
  for (const x of results) console.log(`${x.level.toUpperCase().padEnd(5)} ${x.msg}`);
  if (!results.length) console.log("no signature colour on show");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
