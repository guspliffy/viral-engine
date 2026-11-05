// The clip template's defaults are Jonny's decisions (quality plan item 5, 5 Nov 2026). This builds the template and
// fails when one of them is lost:
//   node storyboards/templates/check-template.mjs
// It checks the built storyboard (whole frame sharp, the "sheet" cast look, music on, the spike guard, natural motion with planted feet,
// the clean start), every line (a subtitle while it is spoken, gibberish included, and no blink on it), the clean start in the loader
// (engine/load.mjs cleanStart) on the template and on a small made-up storyboard, and that clip.mjs without the new
// options writes what it wrote before (old generators keep producing the same storyboards).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { loadStoryboard, cleanStart } from "../../engine/load.mjs";
import { compile } from "../../engine/compile.mjs";
import { clip } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";

const here = (f) => fileURLToPath(new URL(f, import.meta.url));
let n = 0;
const check = (name, fn) => { fn(); n++; console.log(`ok  ${name}`); };

execFileSync(process.execPath, [here("./clip-template.mjs")], { stdio: "ignore" });
const SB = here("./template-demo.json"), sb = JSON.parse(fs.readFileSync(SB, "utf8"));
const flat = compile(sb), fps = sb.fps ?? 30;

check("the whole frame is sharp (no depth of field)", () => {
  assert.ok(!sb.set.aperture, `set.aperture is ${sb.set.aperture}`);
  assert.ok(!sb.set.focus, `set.focus is ${sb.set.focus}`);
});
check('the cast has the "sheet" look', () => assert.equal(sb.castLook, "sheet"));
check("music plays", () => assert.ok(sb.music && sb.music.style, "music is off"));
check("natural motion with planted feet", () => {
  assert.equal(sb.motion?.feet, 2);
  assert.ok(Object.values(sb.motion).every((v) => v !== false), "a natural motion part is off");
});
check("the spike guard is on (no effect jumps out of the mix)", () => assert.equal(sb.sound?.guard, true));
check("the clip opens in its pose (cleanStart)", () => assert.equal(sb.cleanStart, true));

const talks = flat.actions.filter((a) => a.do === "talk");
check("the template has lines to check", () => assert.ok(talks.length > 0));
check("every line is subtitled while it is spoken, gibberish too", () => {
  for (const a of talks) {
    const sub = flat.captions.find((c) => c.from <= a.at + 1e-6 && c.to >= a.at + Math.min(a.dur ?? 0.3, 0.4) - 1e-6);
    assert.ok(sub, `${a.who} "${a.line}" at ${a.at} s has no subtitle`);
  }
});
check("no automatic blink on a line", () => {
  for (const a of talks) assert.equal(a.blink, false, `${a.who} "${a.line}" at ${a.at} s can blink`);
});

const loaded = loadStoryboard(SB);
check("after loading, nothing at t = 0 moves for less than a frame", () => {
  const bad = loaded.actions.filter((a) => Math.abs(a.at) < 1e-6 && a.dur > 0 && a.dur < 1 / fps);
  assert.deepEqual(bad.map((a) => `${a.who ?? a.id} ${a.do}`), []);
  assert.ok(loaded.actions.some((a) => a.at === 0 && a.dur === 0 && a.do === "sit"), "the opening sit is not instant");
});

check("cleanStart: only sub-frame state actions at t = 0 become instant", () => {
  const base = { fps: 30, actions: [
    { who: "a", do: "hop", at: 0, dur: 0.01 },
    { who: "a", do: "arm", side: "R", pose: "wave", at: 0, dur: 0.01 },
    { who: "a", do: "arm", side: "R", pose: "rest", at: 0, dur: 0 },
    { who: "a", do: "look", to: [0, 0], at: 0, dur: 0.3 },
    { who: "a", do: "expr", expr: "kind", at: 0 },
    { id: "phone", do: "prop", set: { glow: 1 }, at: 0, dur: 0.01 },
    { who: "a", do: "arm", side: "L", pose: "wave", at: 0.5, dur: 0.01 },
  ] };
  assert.equal(cleanStart(base), base, "without the flag the storyboard is untouched");
  const out = cleanStart({ ...base, cleanStart: true }).actions;
  assert.deepEqual(out.map((a) => [a.do, a.pose ?? a.id ?? "", a.at, a.dur ?? null]), [
    ["hop", "", 0, 0.01], ["arm", "wave", 0, 0], ["arm", "rest", 0, 0], ["look", "", 0, 0.3], ["expr", "", 0, null],
    ["prop", "phone", 0, 0], ["arm", "wave", 0.5, 0.01],
  ]);
});

check("clip.mjs without lines writes what it wrote before", () => {
  const c = clip();
  c.say(1, "wiz", "Hm.", 0.6);
  act.opener(c, "phx", "ooh!");
  c.beats([["all", 0, null]], 3);
  assert.deepEqual(c.captions, []);
  assert.deepEqual(c.items.map(({ at, who, do: d, line, tone, dur, voice, blink }) => ({ at, who, d, line, tone, dur, voice, blink })), [
    { at: 0, who: "phx", d: "talk", line: "ooh!", tone: "excited", dur: 0.45, voice: false, blink: undefined },
    { at: 1, who: "wiz", d: "talk", line: "Hm.", tone: "calm", dur: 0.6, voice: undefined, blink: undefined },
  ]);
});

check("lines: two quick lines' subtitles don't overlap; a line can opt out", () => {
  const c = clip({ lines: { sub: true, blink: false } });
  c.say(0.3, "wiz", "mine! mine!", 0.45, "excited", { voice: false });
  c.say(0.75, "vik", "nyuh-uh!", 0.4, "excited", { sub: "Nuh-uh!", voice: false });
  c.say(2, "rea", "...", 0.3, "calm", { sub: false, blink: true });
  c.beats([["all", 0, null]], 3);
  assert.deepEqual(c.captions.map(({ from, to, text }) => [from, to, text]), [[0.3, 0.75, "Mine! mine!"], [0.75, 1.55, "Nuh-uh!"]]);
  assert.equal(c.items.find((a) => a.who === "rea").blink, undefined);
});

console.log(`template: ${n} checks passed`);
