// Regression cases for the engine audit of 24 Nov 2026 (ChatGPT read-only audit of main 2ec9626; each case failed on
// main before its fix). Seconds, no render, no voice model: node qa/selftest.mjs (exits 1 on a failure).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { loadStoryboard, loadCharacters } from "../engine/load.mjs";
import { renderAudio } from "../engine/audio.mjs";
import { compile } from "../engine/compile.mjs";
import { propState } from "../engine/page/props3d.js";
import { readRGB } from "./pixels.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "selftest-"));
const B3 = path.join(ROOT, "storyboards/series/ancient-aliens/03-atlantis/block-b/aa03-b3-tall.json");
const CM = path.join(ROOT, "storyboards/series/what-if/04-copy-money/copy-money-no-vo.json");
const variant = (file, name, edit) => { const j = JSON.parse(fs.readFileSync(file, "utf8")); edit(j); const f = path.join(TMP, name); fs.writeFileSync(f, JSON.stringify(j)); return f; };
const quiet = (fn) => { const w = console.warn; console.warn = () => {}; try { return fn(); } finally { console.warn = w; } };
let fails = 0;
async function test(name, fn) {
  try { await fn(); console.log(`ok    ${name}`); } catch (e) { fails++; console.log(`FAIL  ${name}: ${e.message}`); }
}

process.env.SPEECH = "off";   // a cold voice cache on every machine: the case that crashed

await test("castless offscreen lines mix from a cold voice cache (Atlantis B3)", () => {
  const sb = quiet(() => loadStoryboard(B3));
  const a = renderAudio(sb, loadCharacters(sb));
  assert.ok(a.events.some((e) => e.kind === "voice"));
});

await test("a line by someone not in the cast and without a voice is refused, naming line and speaker", () => {
  const f = variant(B3, "b3-typo.json", (j) => { for (const b of j.beats) for (const d of b.do || []) if (d.macro === "say") delete d.voice; });
  assert.throws(() => quiet(() => loadStoryboard(f)), /speaker: 2 lines .*\n.*spud: "So the metal was real\."/s);
});

await test("two props with one id are refused", () => {
  const f = variant(CM, "cm-dup.json", (j) => { const r = j.props.find((p) => p.kind === "receipt"); r.id = "bill"; });
  assert.throws(() => quiet(() => loadStoryboard(f)), /props: two props share an id: "bill" \(receipt and banknote\)/);
});

await test("Copy Money: the receipt stays on the counter while Reaper holds the banknote", () => {
  const f = variant(CM, "cm-slip.json", (j) => { j.props.find((p) => p.kind === "receipt").id = "slip"; });   // the generator's fix
  const sb = quiet(() => loadStoryboard(f));
  const at = (id) => propState(sb, sb.props.find((p) => p.id === id), 0.2).hold?.who ?? null;
  assert.equal(at("slip"), null);
  assert.equal(at("bill"), "rea");
});

await test("a laugh Whisper counts its own way is not a misread; made-up words still are (Don't Laugh, 26 Nov)", async () => {
  const { misread } = await import("../engine/voice/speech.mjs");
  assert.equal(misread("Hahaha! Ha ha!", "HA HA HA HA HA HA HA!"), null);
  assert.equal(misread("Ahahaha! Hahaha!", "Ha ha ha ha! Ha ha ha!"), null);
  assert.deepEqual(misread("Hahaha! Ha ha!", "Ha ha, this clear."), { extra: 1 });
  assert.deepEqual(misread("He lifts her off four hooks.", "He lifts her off four hooks, this clear."), { extra: 2 });
});

await test("a malformed relative time is refused with the beat's name", () => {
  const sb = (at) => ({ id: "t", duration: 3, cast: [], beats: [{ name: "one", do: [{ who: "a", do: "look", to: [0, 0], at: "+0.2" }, { who: "a", do: "look", to: [1, 0], at }] }] });
  assert.ok(Number.isFinite(compile(sb("+1.2")).actions[1].at));
  assert.throws(() => compile(sb("+1..2")), /beat "one": bad time "\+1\.\.2"/);
});

await test("a mesh worker that dies doesn't stall the next frame", async () => {
  // a worker that fails on its first job and never answers again
  let posts = 0;
  globalThis.Worker = class { constructor() { this.onmessage = null; this.onerror = null; } postMessage() { posts++; if (posts === 1) setTimeout(() => this.onerror?.({ message: "boom" }), 5); } terminate() {} };
  const { meshAll } = await import(`../engine/page/mesh-pool.js?selftest=${Date.now()}`);
  const shape = { arm: [{ lo: [0, 0, 0], hi: [1, 1, 1] }], palm: [], digits: [[]] }, jobs = [{ key: "a", shape, h: 0.1 }];
  const log = console.log; console.log = () => {};
  try {
    const frame = (n) => Promise.race([meshAll(jobs), new Promise((_, bad) => setTimeout(() => bad(new Error(`frame ${n} still waiting after 2 s`)), 2000))]);
    assert.equal((await frame(1)).size, 0);   // first frame: meshed on the page instead
    assert.equal((await frame(2)).size, 0);   // second frame: no job posted to the dead worker
  } finally { console.log = log; delete globalThis.Worker; }
  assert.equal(posts, 1);
});

await test("the id mask keeps its labels when it is shrunk (no id 2 between ids 0 and 4)", () => {
  const W = 8, H = 4, px = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ((x + y) % 2) px.fill(4, (y * W + x) * 3, (y * W + x) * 3 + 3);
  const f = path.join(TMP, "ids.png");
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-i", "-", "-frames:v", "1", f], { input: px });
  assert.equal(r.status, 0, "ffmpeg wrote the mask");
  const got = new Set(readRGB(f, W / 2, H / 2, "neighbor"));
  assert.ok([...got].every((v) => v === 0 || v === 4), `labels after the resize: ${[...got].join(", ")}`);
});

fs.rmSync(TMP, { recursive: true, force: true });
console.log(fails ? `${fails} case(s) failed` : "all cases pass");
process.exit(fails ? 1 : 0);
