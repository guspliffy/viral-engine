#!/usr/bin/env node
// Peek at the last layout: where the cast and the props are in a stretch of the clip, as a few lines of text
// (10 Nov 2026). In a sampled clip build 13 of 163 tool calls were throwaway scripts that opened the layout JSON to
// read a box, a hand or a prop's place at some second; this is that script, written once.
//
//   node qa/peek.mjs <storyboard> --at 3.6                      -> everything at 3.6 s
//   node qa/peek.mjs <storyboard> --from 1.8 --to 2.2 --ids wiz,baton   -> those two, every 0.1 s
//   node qa/peek.mjs <storyboard> --at 3.6 --layout out/x.layout.json   -> another layout than the last one in out/
//
// Per time: a character's box on screen (x,y wxh px, cut to nothing when it is off frame), its eyes (px) and its hands
// (metres, world); a prop's place (metres), its point on screen, whether it is drawn, and how it is supported; who
// holds what (the gap between glove and prop in cm, negative = into it); bodies and props in each other (depth, m).
// Times are the video's clock. Reads only the layout: no browser, under a second. It never lays out: when the layout
// is older than the storyboard it says so and prints it anyway.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadStoryboard } from "../engine/load.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const a = process.argv.slice(2), o = { sb: null, out: path.join(ROOT, "out") };
for (let i = 0; i < a.length; i++) {
  if (a[i] === "--at") o.from = o.to = Number(a[++i]);
  else if (a[i] === "--from") o.from = Number(a[++i]);
  else if (a[i] === "--to") o.to = Number(a[++i]);
  else if (a[i] === "--ids") o.ids = a[++i].split(",");
  else if (a[i] === "--layout") o.layout = a[++i];
  else if (a[i] === "--out") o.out = path.resolve(a[++i]);
  else if (!o.sb && !a[i].startsWith("--")) o.sb = a[i];
  else { console.error(`unknown option ${a[i]}`); process.exit(2); }
}
if (!o.sb || o.from == null) { console.error("usage: node qa/peek.mjs <storyboard.json> --at <s> | --from <s> --to <s> [--ids a,b] [--layout file] [--out dir]"); process.exit(2); }
const sb = loadStoryboard(o.sb);
const file = o.layout || [`${sb.id}-${sb.look || "anime-pro"}.layout.json`, `${sb.id}.layout.json`].map((f) => path.join(o.out, f)).find((f) => fs.existsSync(f));
if (!file || !fs.existsSync(file)) { console.error(`no layout for ${sb.id} in ${path.relative(process.cwd(), o.out)}: run node engine/render.mjs ${o.sb} --layout`); process.exit(1); }
if (!o.layout && fs.statSync(file).mtimeMs < fs.statSync(o.sb).mtimeMs) console.log(`(the layout is older than the storyboard: these are the last layout's numbers)`);
const lay = JSON.parse(fs.readFileSync(file, "utf8")), fps = lay.fps || 30, W = lay.width || 1080, H = lay.height || 1920;
const want = (id) => !o.ids || o.ids.includes(id), n = (x, d = 2) => (typeof x === "number" ? x.toFixed(d) : "?"), v3 = (p) => (p ? p.map((x) => n(x)).join(",") : "?");
const to = o.to ?? o.from, rows = (lay.samples || []).filter((s) => s.t >= o.from - 0.051 && s.t <= to + 0.051);
if (!rows.length) { console.error(`no layout sample between ${o.from} and ${to} s (the clip is ${n(lay.duration, 1)} s long)`); process.exit(1); }
for (const s of rows) {
  const c = (lay.contacts || [])[Math.min((lay.contacts || []).length - 1, Math.round(s.t * fps))] || {};
  console.log(`t=${n(s.t)}`);
  for (const x of (s.actors || []).filter((x) => want(x.id))) {
    const [bx, by, bw, bh] = x.box || [], off = !x.box || bx > W || by > H || bx + bw < 0 || by + bh < 0;
    console.log(`  ${x.id.padEnd(8)} ${off ? "off frame" : `box ${Math.round(bx)},${Math.round(by)} ${Math.round(bw)}x${Math.round(bh)}`}  eyes ${x.eyesPx ? x.eyesPx.map(Math.round).join(",") : "?"}  hands R ${v3(x.hands?.R)}  L ${v3(x.hands?.L)}`);
  }
  for (const p of (s.props || []).filter((p) => want(p.id))) {
    const h = (c.held || []).find((x) => x.prop === p.id), sup = p.support && !(h && p.support.state === "held") ? p.support.state + (p.support.gap ? ` gap ${n(p.support.gap * 100, 1)} cm` : "") : "";
    console.log(`  ${p.id.padEnd(8)} at ${v3(p.at)}  px ${p.px ? p.px.map(Math.round).join(",") : "?"}  ${p.visible === false ? "not drawn" : "drawn"}  ${sup}${h ? `  held by ${h.who} ${h.hand}${typeof h.gap === "number" ? ` (glove gap ${n(h.gap * 100, 1)} cm)` : ""}` : ""}`);
  }
  const clips = (s.clips || []).filter((x) => want(x.who) || want(x.with)).map((x) => `${x.who}/${x.with} ${n(x.depth)}`);
  const inp = (c.inProps || []).filter((x) => (want(x.who) || want(x.prop)) && !x.pad).map((x) => `${x.who} ${x.part}${x.hand ? " " + x.hand : ""} in ${x.prop} ${n(x.depth * 100, 1)} cm${x.held ? " (held)" : ""}`);
  if (clips.length) console.log(`  in each other (m): ${clips.join("; ")}`);
  if (inp.length) console.log(`  into props: ${[...new Set(inp)].join("; ")}`);
}
