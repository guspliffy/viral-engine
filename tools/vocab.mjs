#!/usr/bin/env node
// The engine's vocabulary on one sheet, written from the code (10 Nov 2026): docs/VOCAB.md.
// In a sampled stretch of a clip build (Survive it EP1, staging) 84 of 163 tool calls were greps of engine source for
// words the director needed to write the clip: which action verbs exist and what they take, the expressions, arm
// poses, hand shapes, easings, effects, sounds, voices, the helpers of the writing library, the prop kinds, the checks'
// names. Each lookup re-reads the whole thread (6 cents and about 20 s at 300k tokens), and the same burst comes back
// after every compaction. This sheet answers them in one read. It holds names and parameters only: what a thing does
// is in docs/STORYBOARD.md (the sheet ends with that file's headings and their lines) and in the code it names.
//
//   node tools/vocab.mjs            -> writes docs/VOCAB.md
//   node tools/vocab.mjs --check    -> exits 1 when docs/VOCAB.md is not what the code gives now
//
// docs/VOCAB.md is not committed (.gitignore): the session-start hook writes it, and so does the "Rule docs" CI job
// before it lints the docs, so the sheet is never stale and two branches that both add a prop never conflict on it.
//
// Everything is read from the source text, nothing is imported or run, so it takes a second and needs no browser.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const uniq = (a) => [...new Set(a)];

// the source from the "{" that follows the first match of `start` to its closing brace (strings and comments skipped)
function block(src, start) {
  const m = src.match(start); if (!m) return null;
  let i = src.indexOf("{", m.index + m[0].length - 1); if (i < 0) return null;
  const a = i; let d = 0;
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (c === "/" && n === "/") { i = src.indexOf("\n", i); if (i < 0) break; continue; }
    if (c === "/" && n === "*") { i = src.indexOf("*/", i) + 1; continue; }
    if (c === '"' || c === "'" || c === "`") { for (i++; i < src.length && src[i] !== c; i++) if (src[i] === "\\") i++; continue; }
    if (c === "{") d++;
    else if (c === "}" && --d === 0) return src.slice(a, i + 1);
  }
  return null;
}
// the keys at the top level of an object literal (name: ..., "name": ..., name(...) {...})
function topKeys(obj) {
  if (!obj) return [];
  const keys = []; let d = 0, expect = true;
  for (let i = 0; i < obj.length; i++) {
    const c = obj[i], n = obj[i + 1];
    if (c === "/" && n === "/") { i = obj.indexOf("\n", i); if (i < 0) break; continue; }
    if (c === "/" && n === "*") { i = obj.indexOf("*/", i) + 1; continue; }
    if (d === 1 && expect) {
      const m = obj.slice(i).match(/^\s*(?:async\s+)?(?:"([^"]+)"|'([^']+)'|([A-Za-z_$][\w$]*))\s*(?=[:(,}])/);
      if (m) { const k = m[1] ?? m[2] ?? m[3]; keys.push(k); i += m[0].length - 1; expect = false; continue; }
      if (!/\s/.test(c)) expect = false;
    }
    if (c === '"' || c === "'" || c === "`") { for (i++; i < obj.length && obj[i] !== c; i++) if (obj[i] === "\\") i++; continue; }
    if (c === "{" || c === "[" || c === "(") { d++; if (d === 1) expect = true; }
    else if (c === "}" || c === "]" || c === ")") d--;
    else if (c === "," && d === 1) expect = true;
  }
  return uniq(keys);
}
const keysOf = (file, start) => topKeys(block(read(file), start));
// the body of a function: from its "export function name(" line to the first line that is just "}"
const fnBody = (src, name) => { const a = src.search(new RegExp(`^(?:export )?function ${name}\\(`, "m")); if (a < 0) return ""; const b = src.indexOf("\n}\n", a); return src.slice(a, b < 0 ? undefined : b); };

// ---- actions: the timeline's switch, and what each verb reads from its action ------------------------------------
function actions() {
  const src = read("engine/page/timeline.js"), out = new Map(), skip = new Set(["at", "do", "who"]);
  const re = /^ {6}case "([a-zA-Z]+)":/gm, hits = [...src.matchAll(re)];
  hits.forEach((h, k) => {
    const body = src.slice(h.index, k + 1 < hits.length ? hits[k + 1].index : src.indexOf("\n    }\n", h.index));
    const params = uniq([...body.matchAll(/\ba\.([a-zA-Z]\w*)/g)].map((m) => m[1])).filter((p) => !skip.has(p));
    out.set(h[1], uniq([...(out.get(h[1]) || []), ...params]));
  });
  return [...out].sort((x, y) => x[0].localeCompare(y[0]));
}
// verbs the page handles outside that switch (a prop's own moves, physics, the camera shake): the files that read them
function otherVerbs(known) {
  const out = new Map();
  for (const f of fs.readdirSync(path.join(ROOT, "engine/page")).filter((x) => x.endsWith(".js")).sort())
    for (const m of read(`engine/page/${f}`).matchAll(/\ba\.do === "([a-zA-Z]+)"/g)) if (!known.has(m[1])) out.set(m[1], uniq([...(out.get(m[1]) || []), f]));
  return [...out].sort((x, y) => x[0].localeCompare(y[0]));
}
// a shot's fields: what cameraState reads off the shot `s`, and off the objects it holds (to, dolly, yaw, hand ...)
function shotFields(tl) {
  const body = fnBody(tl, "cameraState"), alias = new Map([...body.matchAll(/\b(?:const|let) ([A-Za-z]\w*) = s\.([a-z]\w*)\b(?!\.)/g)].map((m) => [m[2], m[1]]));
  const top = uniq([...body.matchAll(/\bs\.([a-z]\w*)/g)].map((m) => m[1]));
  return top.map((k) => {
    const sub = uniq([...[...body.matchAll(new RegExp(`\\bs\\.${k}\\.([a-z]\\w*)`, "g"))].map((m) => m[1]), ...(alias.has(k) ? [...body.matchAll(new RegExp(`\\b${alias.get(k)}\\.([a-z]\\w*)`, "g"))].map((m) => m[1]) : [])]).filter((x) => !["length", "findIndex", "at", "map", "filter"].includes(x));
    return sub.length ? `${k} { ${sub.join(", ")} }` : k;
  });
}
// ---- the writing library: exported functions and constants with their arguments ---------------------------------
function exportsOf(file) {
  const out = [];
  for (const l of read(file).split("\n")) {
    let m = l.match(/^export (?:async )?function (\w+)\((.*)\)\s*\{/);
    if (m) { out.push(`${m[1]}(${m[2]})`); continue; }
    m = l.match(/^export const (\w+) = \((.*?)\) =>/);
    if (m) { out.push(`${m[1]}(${m[2]})`); continue; }
    m = l.match(/^export const ([\w, ]+?) = /);
    if (m && !/^[a-z]/.test(m[1])) out.push(m[1].split(",")[0].trim());
  }
  return out;
}
// the methods of the builder clip() returns (storyboards/lib/clip.mjs)
function clipMethods() {
  const body = block(read("storyboards/lib/clip.mjs"), /\n  return \{/);
  return topKeys(body);
}
// ---- props: every kind by the file that draws it ------------------------------------------------------------------
function propKinds() {
  const dir = "engine/page", out = [];
  for (const f of fs.readdirSync(path.join(ROOT, dir)).filter((x) => /^props.*\.js$/.test(x)).sort()) {
    const src = read(`${dir}/${f}`), kinds = [];
    for (const m of src.matchAll(/^(?:export )?const ([A-Z0-9_]*KINDS) = \{/gm)) kinds.push(...topKeys(block(src, new RegExp(`const ${m[1]} = \\{`))));
    if (kinds.length) out.push([f, uniq(kinds)]);
  }
  return out;
}

function build() {
  const gate = read("qa/gate.mjs"), list = (name) => { const m = gate.match(new RegExp(`\\b${name}: \\[([^\\]]*)\\]`)); return m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : []; };
  const tl = read("engine/page/timeline.js"), potato = read("engine/page/potato.js"), speech = read("engine/voice/speech.mjs");
  const armPoses = uniq([...fnBody(potato, "handTarget").matchAll(/^\s*case "([^"]+)":/gm)].map((m) => m[1]));
  const camFields = shotFields(tl);
  const fx = uniq(fs.readdirSync(path.join(ROOT, "engine/page")).filter((f) => f.endsWith(".js")).flatMap((f) => [...read(`engine/page/${f}`).matchAll(/\bf\.do === "([a-zA-Z]+)"/g)].map((m) => m[1]))).sort();
  const voices = Object.keys(JSON.parse(read("engine/voice/voices.json"))).filter((k) => k[0] !== "_");
  const sfxDir = path.join(ROOT, "assets/sfx"), packs = fs.existsSync(sfxDir) ? fs.readdirSync(sfxDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => `${e.name} (${fs.readdirSync(path.join(sfxDir, e.name)).length})`) : [];
  const heads = read("docs/STORYBOARD.md").split("\n").map((l, i) => [l, i + 1]).filter(([l]) => /^#{1,3} /.test(l)).map(([l, n]) => `${l.replace(/^#+ /, "").replace(/ \(.*$/, "").replace(/:.*$/, "")} L${n}`);
  const L = [], acts = actions();
  const sec = (title, from, body) => { L.push("", `## ${title}`, "", `From \`${from}\`.`, "", body); };
  L.push("# Vocabulary: what the engine understands", "",
    "Written by `node tools/vocab.mjs` from the code (at session start; run it again after adding a prop kind or a", "helper). Not committed, never edited by hand. Read this instead of grepping the engine for a name. It lists names and parameters only;", "what each one does is in `docs/STORYBOARD.md` (its headings and lines are at the end) and in the file each section names.");
  sec("Actions", "engine/page/timeline.js", "`A(t, who, \"<verb>\", { ... })`; every action also takes `at`, and most take `dur` and `ease`.\n\n" + acts.map(([v, p]) => `- \`${v}\`${p.length ? ": " + p.join(", ") : ""}`).join("\n")
    + `\n\nHandled outside the timeline's switch: ${otherVerbs(new Set(acts.map((a) => a[0]))).map(([v, f]) => `\`${v}\` (${f.join(", ")})`).join(", ")}. A prop moves with \`{ do: "prop", id, set: { x, y, z, rot, tip, tilt, roll, ... } }\` (the builder's \`c.prop\`).`);
  sec("Expressions", "engine/page/face.js EXPRESSIONS", keysOf("engine/page/face.js", /export const EXPRESSIONS = \{/).join(", "));
  sec("Arm poses", "engine/page/potato.js handTarget", `Named: ${armPoses.join(", ")}. Or a point: \`{ o: [out, up, fwd] }\` (mirrored per side) or \`{ x: [x, up, fwd] }\`.`);
  sec("Hand shapes", "engine/page/timeline.js GRIPS", keysOf("engine/page/timeline.js", /export const GRIPS = \{/).join(", "));
  sec("Easings", "engine/page/util.js EASE", keysOf("engine/page/util.js", /export const EASE = \{/).join(", "));
  sec("Effects", "engine/page/*.js", "`fx` entries by their `do`: " + fx.join(", "));
  sec("Camera shot fields", "engine/page/timeline.js cameraState", camFields.join(", "));
  sec("Sounds", "engine/audio.mjs SFX and assets/sfx", `Built in: ${keysOf("engine/audio.mjs", /\nconst SFX = \{/).join(", ")}.\n\nRecorded packs (\`ls assets/sfx/<pack>\` for the names): ${packs.join(", ")}.`);
  sec("Voices and tones", "engine/voice/voices.json and speech.mjs", `Voices: ${voices.join(", ")}.\n\nTones: ${topKeys(block(speech, /\nconst TONES = \{/)).join(", ")}.`);
  sec("Writing library", "storyboards/lib", [
    `\`clip()\` builder (clip.mjs): ${clipMethods().join(", ")}.`,
    ...["clip.mjs", "acting.mjs", "camera.mjs", "overlay.mjs", "grips.mjs"].map((f) => `\`${f}\`:\n\n${exportsOf(`storyboards/lib/${f}`).map((s) => `- \`${s.length > 150 ? s.slice(0, 147) + "..." : s}\``).join("\n")}`),
    `Grip sizes exist for (grips.mjs SIZE; a new held prop needs its entry): ${keysOf("storyboards/lib/grips.mjs", /\nconst SIZE = \{/).join(", ")}.`,
  ].join("\n\n"));
  sec("Prop kinds", "engine/page/props*.js", propKinds().map(([f, k]) => `- \`${f}\`: ${k.join(", ")}`).join("\n"));
  sec("Checks", "qa/gate.mjs GATE", `Stop a render: ${list("fails").join(", ")}.\n\nVisible glitches (may not ship as warnings): ${list("visible").join(", ")}.\n\nA window: \`{ "who": id, "with": id, "from": s, "to": s, "checks": ["<check>"], "reason": "..." }\` in \`allowClip\`, on the video clock (story time plus hit-stops, freezes and ramps; at \`"gate": 2\` the story's clock, qa/gate.mjs windowFor); only the director writes one (\`docs/rules/workflow.md\` "Check windows"). \`node qa/waivers.mjs <sb>\` counts them.`);
  L.push("", "## Where to read more", "", "`docs/STORYBOARD.md` by heading and line: " + heads.join(" · ") + ".", "");
  return L.join("\n");
}

const out = path.join(ROOT, "docs/VOCAB.md"), text = build();
if (process.argv.includes("--check")) {
  const have = fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "";
  if (have !== text) { console.error("docs/VOCAB.md is out of date: run `node tools/vocab.mjs` (a name the engine knows changed)"); process.exit(1); }
  console.log("docs/VOCAB.md matches the code");
} else { fs.writeFileSync(out, text); console.log(`wrote docs/VOCAB.md (${(text.length / 1024).toFixed(1)} KB)`); }
