#!/usr/bin/env node
// Hook lab: compare two or three openings of one clip before the full render (qa/HOOK.md).
// Most viewers decide in the first two seconds (Still Scrolling lost most of them at 0:02), so each opening is
// measured against the opening rules, rendered for its first seconds only, and put side by side for Jonny to pick.
//
//   node qa/hook.mjs a.json b.json c.json                -> out/hook/<id of a>/: openings-3up.mp4 (mute, side by side),
//                                                           openings-sound.mp4 (one after another, with sound),
//                                                           cold-read-<X>.png per opening, hook-report.md
//   node qa/hook.mjs a.json b.json --rules               -> the opening rules only (layout pass, about a minute each)
//   node qa/hook.mjs a.json --to 4 --draft --out dir     -> 4 s instead of 3, half-res draft, own output folder
//
// The rules are the house style's opening (CLAUDE.md, creative defaults) made measurable. They are notes, never
// failures: whether a stranger understands the opening is what the cold read (a reviewer who sees only the
// cold-read sheet, no premise) and then real posts decide.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadStoryboard } from "../engine/load.mjs";
import { contactSheet } from "./contact.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONT = path.join(ROOT, "assets/fonts/Inter-ExtraBold.otf");
const NAMES = "ABCD";

// the opening rules (qa/HOOK.md explains each); change them here, with the reason, as posts teach us more
export const OPENING = {
  bodyShare: 0.35,   // the biggest character fills at least this much of the frame height at frame 0 (face readable on a phone)
  motionBy: 0.25,    // something moves (an action, or the camera) by this time
  soundBy: 0.25,     // a sound effect or a voice line starts by this time (music alone doesn't say what happens)
  captionBy: 0.3,    // the first caption is up by this time...
  captionWords: 6,   // ...and is this many words or fewer
  setupBy: 2.5,      // the hook beat hands over to the next beat by this time (the situation is clear, the story moves)
  hintBy: 2.0,       // the viewer first sees trouble coming by this time (most of them have decided by 0:02, 28 Oct analytics)
  slamSize: 300,     // a slam word (fx "slam", in place of the caption) is drawn at least this big on the 1080 frame...
  slamWords: 2,      // ...in one or two words
};
const STILL_VERBS = new Set(["noblink", "blink", "expr", "face", "grip", "grab", "release", "still", "hide", "show", "span", "hatsway", "hatwobble", "look"]);
const COLD_TIMES =[0, 0.4, 0.8, 1.3, 2.0, 2.8]; // frames the cold reader sees (no sound, no storyboard, no premise)

// who and what must be in frame 0: the storyboard's hook.show, else everyone who acts in the hook or payoff beat
export function hookShow(sb) {
  if (Array.isArray(sb.hook?.show)) return sb.hook.show;
  const spans = sb.beatSpans || [], keep = spans.filter((b, i) => i === 0 || b.kind === "payoff");
  const ids = new Set();
  for (const a of sb.actions || []) if (a.who && keep.some((b) => a.at >= b.from - 1e-6 && a.at < b.to - 1e-6) && !["noblink", "blink"].includes(a.do)) ids.add(a.who);
  return [...ids].filter((id) => (sb.cast || []).some((c) => c.id === id));
}

const words = (s) => String(s || "").replace(/[*_]/g, "").split(/\s+/).filter(Boolean).length;

// the opening rules from the storyboard and one layout sample at t = 0
export function openingRules(sb, layout) {
  const out = [], add = (ok, rule, msg) => out.push({ level: ok ? "pass" : "note", rule, msg });
  const H = layout?.height ?? 1920, W = layout?.width ?? 1080;
  const s0 = layout?.samples?.[0];
  if (s0) {
    // actor boxes are screen-space [x, y, w, h]; clip them to the frame (a body half off-screen reads half as big)
    const vis = (s0.actors || []).filter((a) => a.box).map((a) => {
      const [x, y, w, h] = a.box, y0 = Math.max(0, y), y1 = Math.min(H, y + h), x0 = Math.max(0, x), x1 = Math.min(W, x + w);
      const area = Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
      return { id: a.id, area, share: x1 > x0 ? Math.max(0, y1 - y0) / H : 0, inFrame: w > 0 && h > 0 ? area / (w * h) : 0 };
    }).sort((a, b) => b.area - a.area);   // the one taking the most of the screen (a sliver at the edge can be full height)
    const big = vis[0];
    add(big && big.share >= OPENING.bodyShare, "face-size", big ? `biggest character at frame 0: ${big.id}, ${(big.share * 100).toFixed(0)}% of the frame height${big.inFrame < 0.8 ? `, only ${(big.inFrame * 100).toFixed(0)}% of it in frame` : ""} (rule: ${OPENING.bodyShare * 100}% or more)` : "no character on screen at frame 0");
    // two-shot at frame 0: every face the joke needs and the thing it's about. Four cold reads in a row (Alien
    // Makeup, Chef, Package, Charger) needed a second round because frame 0 was missing one of them.
    const need = hookShow(sb), inside = (p) => p && p[0] >= 0 && p[0] <= W && p[1] >= 0 && p[1] <= H;
    const missing = need.filter((id) => {
      const a = (s0.actors || []).find((q) => q.id === id);
      if (a) return !inside(a.eyesPx);
      const pr = (s0.props || []).find((q) => q.id === id);
      return !(pr && pr.visible !== false && inside(pr.px));
    });
    add(need.length > 1 && !missing.length, "two-shot-0", !need.length ? "nothing named: set \"hook\": { \"show\": [the cast ids and the prop the joke is about] }" : missing.length ? `not in frame 0: ${missing.join(", ")} (rule: ${need.join(", ")} all in frame${sb.hook?.show ? "" : "; from the hook and payoff beats' actors, name the joke's prop in hook.show"})` : `${need.join(", ")} all in frame 0`);
  } else out.push({ level: "note", rule: "face-size", msg: "no layout, so the frame-0 size wasn't measured" });

  // visible motion only: a body, a limb, a wing or a prop moving. Eye darts, thumb grips, expression changes and
  // instant pose setters (dur 0.01) don't read as movement at feed size.
  const moves = (sb.actions || []).filter((a) => a.at <= OPENING.motionBy && (a.dur ?? 0) >= 0.1 && !STILL_VERBS.has(a.do));
  const camMove = (sb.shots || []).some((s) => s.at <= OPENING.motionBy && s.to);
  add(moves.length || camMove, "motion-0", moves.length || camMove ? `moving by ${OPENING.motionBy} s: ${[...new Set(moves.map((a) => a.do === "prop" ? `${a.id} moves` : `${a.who} ${a.do}`))].slice(0, 3).join(", ")}${camMove ? (moves.length ? ", " : "") + "camera move" : ""}` : `nothing moves before ${OPENING.motionBy} s (a held pose reads as a still image in the feed)`);

  const sfx0 = (sb.sfx || []).filter((s) => s.at <= OPENING.soundBy).map((s) => s.sound);
  const talk0 = (sb.actions || []).filter((a) => a.do === "talk" && a.at <= OPENING.soundBy).map((a) => `${a.who}: "${a.line}"`);
  const music = sb.music !== false && sb.music != null;
  add(sfx0.length || talk0.length, "sound-0", sfx0.length || talk0.length ? `sound by ${OPENING.soundBy} s: ${[...sfx0, ...talk0].join(", ")}` : `no sound effect or line before ${OPENING.soundBy} s${music ? " (music only)" : ""}: a sound at 0.0 s says something is happening`);

  const caps = [...(sb.captions || [])].sort((a, b) => a.from - b.from), c0 = caps[0];
  // a slam word (text.js fx "slam") takes the caption's place: one or two huge words over the action at frame 0
  const slam = (sb.fx || []).find((f) => f.do === "slam" && (f.at ?? 0) <= OPENING.captionBy);
  if (slam) {
    const at = slam.at ?? 0, end = at + (slam.dur ?? 1.4), n = words(slam.text), L = (s0?.captions || []).find((c) => c.slam);
    add(n <= OPENING.slamWords && (!L || L.size >= OPENING.slamSize), "caption", `slam word "${String(slam.text).replace(/\n/g, " ")}" at ${at.toFixed(2)}-${end.toFixed(2)} s instead of a caption, ${n} word${n > 1 ? "s" : ""}${L ? `, drawn at ${L.size} px` : ""} (rule: ${OPENING.slamWords} words or fewer, ${OPENING.slamSize} px or more)`);
    // it sits over the action, so it must not cover a face, and nothing else written should share the screen with
    // it (PR #18: an animated caption fought the BOO! pop)
    const eyes = L ? (s0.actors || []).filter((a) => a.eyesPx && a.eyesPx[0] >= L.box[0] && a.eyesPx[0] <= L.box[0] + L.box[2] && a.eyesPx[1] >= L.box[1] && a.eyesPx[1] <= L.box[1] + L.box[3]).map((a) => a.id) : [];
    const both = caps.filter((c) => c.from < end && c.to > at);
    add(L && !eyes.length && !both.length, "slam-clear", !L ? "no layout, so the slam word's place wasn't measured" : `slam word box ${L.box.join(", ")} px at frame 0${eyes.length ? `: covers the eyes of ${eyes.join(", ")}` : ", clear of every face"}${both.length ? `; on screen with the caption "${both[0].text}"` : ""}`);
  } else add(c0 && c0.from <= OPENING.captionBy && words(c0.text) <= OPENING.captionWords, "caption", c0 ? `first caption at ${c0.from.toFixed(2)} s, ${words(c0.text)} words: "${c0.text}" (rule: by ${OPENING.captionBy} s, ${OPENING.captionWords} words or fewer, and it should raise a question, not describe the picture)` : "no caption: fine if the picture alone tells the situation, but a muted viewer gets nothing to read");

  const spans = sb.beatSpans || [], hook = spans[0];
  if (hook) add(spans.length > 1 && spans[1].from <= OPENING.setupBy, "setup-by", `first beat "${hook.name}" runs ${hook.from.toFixed(1)}-${hook.to.toFixed(1)} s (rule: the next beat starts by ${OPENING.setupBy} s)`);

  // the hint: when a viewer first sees trouble coming (a glance at the bowl, a wobble, a creak). The writer marks it,
  // "hook": { "hint": 1.2, "what": "Dragon's eyes find the biscuits" }, and the cold read confirms they saw it.
  const hint = sb.hook?.hint;
  add(hint != null && hint <= OPENING.hintBy, "hint-by", hint == null ? `no hint marked: set "hook": { "hint": <s>, "what": "..." } at the first moment trouble shows (rule: by ${OPENING.hintBy} s)` : `trouble shows at ${Number(hint).toFixed(2)} s${sb.hook.what ? `: ${sb.hook.what}` : ""} (rule: by ${OPENING.hintBy} s)`);
  return out;
}

function run(cmd, argv) {
  const r = spawnSync(cmd, argv, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`${cmd} ${argv.join(" ")} failed:\n${(r.stderr || r.stdout || "").slice(-2000)}`);
  return r.stdout;
}
const newest = (dir, test) => fs.readdirSync(dir).filter(test).map((f) => path.join(dir, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];

function args() {
  const a = process.argv.slice(2), o = { files: [], to: 3, draft: false, rules: false, out: null };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--to") o.to = Number(a[++i]);
    else if (a[i] === "--draft") o.draft = true;
    else if (a[i] === "--rules") o.rules = true;
    else if (a[i] === "--out") o.out = path.resolve(a[++i]);
    else o.files.push(a[i]);
  }
  if (!o.files.length || o.files.length > NAMES.length) { console.error("usage: node qa/hook.mjs <opening-a.json> [b.json] [c.json] [--to 3] [--draft] [--rules] [--out dir]"); process.exit(2); }
  return o;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const o = args();
  const first = loadStoryboard(o.files[0]);
  const out = o.out || path.join(ROOT, "out/hook", first.experiment?.episode || first.id);
  fs.mkdirSync(out, { recursive: true });
  const report = [];
  for (const [i, file] of o.files.entries()) {
    const name = NAMES[i], sb = loadStoryboard(file), dir = path.join(out, name);
    fs.mkdirSync(dir, { recursive: true });
    console.log(`\n${name}: ${sb.id} (${file})`);
    // a render writes the layout itself (its contact gate), so --rules is the only case that needs its own layout pass
    const entry = { name, id: sb.id, file }, t0 = Date.now();
    if (o.rules) run("node", ["engine/render.mjs", file, "--layout", "--out", dir]);
    else {
      run("node", ["engine/render.mjs", file, "--from", "0", "--to", String(o.to), "--out", dir, ...(o.draft ? ["--draft"] : [])]);
      entry.clip = newest(dir, (f) => f.endsWith(".mp4") && !f.endsWith(".video.mp4"));
      entry.cold = contactSheet(entry.clip, COLD_TIMES.filter((t) => t < o.to), { cols: 3, width: 300, out: path.join(out, `cold-read-${name}.png`) });
      console.log(`  rendered ${path.relative(ROOT, entry.clip)} in ${((Date.now() - t0) / 1000).toFixed(0)} s; cold-read sheet ${path.relative(ROOT, entry.cold)}`);
    }
    const layout = JSON.parse(fs.readFileSync(newest(dir, (f) => f.endsWith(".layout.json")), "utf8"));
    entry.rules = openingRules(sb, layout);
    for (const r of entry.rules) console.log(`  ${r.level === "pass" ? "PASS" : "note"}  ${r.rule}: ${r.msg}`);
    report.push(entry);
  }

  if (!o.rules) {
    // mute side by side (the R2 test: does it read without sound?), then one after another with sound
    const W = 360, Hh = 640, label = (n) => `drawtext=fontfile=${FONT}:text='${n}':x=14:y=12:fontsize=44:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=8`;
    const ins = report.flatMap((r) => ["-i", r.clip]);
    const scaled = report.map((r, i) => `[${i}:v]scale=${W}:${Hh},setsar=1,${label(r.name)}[v${i}]`).join(";");
    const stack = report.length > 1 ? `;${report.map((_, i) => `[v${i}]`).join("")}hstack=inputs=${report.length}[v]` : ";[v0]copy[v]";
    run("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", scaled + stack, "-map", "[v]", "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", path.join(out, "openings-3up.mp4")]);
    const seq = report.map((r, i) => `[${i}:v]scale=540:960,setsar=1,${label(r.name)},tpad=stop_mode=clone:stop_duration=0.6[s${i}];[${i}:a]apad=pad_dur=0.6[a${i}]`).join(";");
    const cat = `;${report.map((_, i) => `[s${i}][a${i}]`).join("")}concat=n=${report.length}:v=1:a=1[v][a]`;
    run("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", seq + cat, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-c:a", "aac", path.join(out, "openings-sound.mp4")]);
    console.log(`\nwrote ${path.relative(ROOT, path.join(out, "openings-3up.mp4"))} and openings-sound.mp4`);
  }

  const md = [`# Hook lab: ${first.experiment?.episode || first.id}`, "", `Openings rendered 0-${o.to} s${o.draft ? " (draft)" : ""}. Rules are notes (qa/HOOK.md); the cold read and Jonny decide.`, ""];
  for (const r of report) {
    md.push(`## ${r.name}: ${r.id}`, "", `Storyboard: \`${r.file}\``, "");
    for (const x of r.rules) md.push(`- ${x.level === "pass" ? "PASS" : "note"} **${x.rule}**: ${x.msg}`);
    md.push("", "Cold read: _(paste the reviewer's answers here)_", "");
  }
  md.push("## Pick", "", "Jonny's pick and why: _", "");
  fs.writeFileSync(path.join(out, "hook-report.md"), md.join("\n"));
  console.log(`wrote ${path.relative(ROOT, path.join(out, "hook-report.md"))}`);
}
