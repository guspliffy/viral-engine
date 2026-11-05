#!/usr/bin/env node
// Self-test for the spike guard and render integrity (quality plan items 6 and 19). About 30 s, no render:
//   node engine/sfx/guard-test.mjs
// 1. without the guard the mix is exactly renderAudio + addMusic, as before (same samples)
// 2. an effect made 20 dB too loud fails the spike check unguarded, and the guard brings it to 9 dB over the mix
// 3. "loud": true lets it stand at 12 dB
// 4. the guarded mix is deterministic, lands at -14 LUFS and stays under its true-peak ceiling
// 5. an edit to a file in assets/models changes the shards' engine fingerprint
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadStoryboard, loadCharacters } from "../load.mjs";
import { lockMusic, addMusic } from "../music.mjs";
import { renderAudio } from "../audio.mjs";
import { mixClip, effectLevelsOverMix, GUARD } from "./guard.mjs";
import { integrated, truePeak } from "./loudness.mjs";
import { spikes } from "../../qa/sound.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SB = "storyboards/series/friends-try-to/04-split-the-bill/split-the-bill.json";
let fails = 0;
const ok = (c, msg) => { console.log(`  ${c ? "ok  " : "FAIL"}  ${msg}`); if (!c) fails++; };
const hash = (a) => crypto.createHash("sha256").update(Buffer.from(a.L.buffer)).update(Buffer.from(a.R.buffer)).digest("hex").slice(0, 16);
const base = loadStoryboard(path.join(ROOT, SB)), chars = loadCharacters(base);
const make = (sound = {}, sfx = (s) => s) => { const sb = { ...base, sound: { ...(base.sound || {}), ...sound }, sfx: base.sfx.map(sfx) }; sb.music = lockMusic(sb); return sb; };

// 1
{ const sb = make(), a = renderAudio(sb, chars); addMusic(sb, a); ok(hash(mixClip(sb, chars)) === hash(a), "unguarded mix is renderAudio + addMusic, sample for sample"); }

// 2, 3: the papercut 20 dB up (it plays alone at 6.41 s)
const target = base.sfx.find((s) => s.sound === "papercut") ?? base.sfx[0];
const hot = (loud) => (s) => (s === target ? { ...s, gain: (s.gain ?? 1) * 10, ...(loud ? { loud: true } : {}) } : s);
const named = (lv) => lv.find((x) => x.name.includes(target.sound) && Math.abs(x.t - target.at) < 0.6);
{
  const sb = make({}, hot(false)), x = named(effectLevelsOverMix(sb, chars));
  ok(x && x.over > 12, `${target.sound} @${target.at} made 20 dB louder stands ${x?.over.toFixed(1)} dB over the mix unguarded`);
  ok(spikes(sb, chars).some((r) => r.level === "fail"), "and fails the spike check");
  const g = make({ guard: true }, hot(false)), a = mixClip(g, chars), y = named(a.levels);
  ok(y && Math.abs(y.after - GUARD.over) < 0.05, `guarded: it is turned down to ${y?.after.toFixed(2)} dB over the mix (cap ${GUARD.over})`);
  ok(!spikes(g, chars, a).some((r) => r.level !== "pass"), "and the spike check passes");
  ok(Math.abs(effectLevelsOverMix(g, chars, a.levels.reduce((m, L) => { for (const i of L.i) m[i] = Math.pow(10, -(L.over - L.after) / 20); return m; }, [])).find((L) => L.name === y.name).over - GUARD.over) < 0.3, "measured again with the capped gains it stands at the cap");
  const l = make({ guard: true }, hot(true)), z = named(mixClip(l, chars).levels);
  ok(z && Math.abs(z.after - GUARD.loud) < 0.05, `marked "loud": turned down to ${z?.after.toFixed(2)} dB (cap ${GUARD.loud})`);
}

// 4
{
  const sb = make({ guard: true }), a = mixClip(sb, chars), b = mixClip(sb, chars), I = integrated([a.L, a.R], a.sr);
  let tp = 0; for (const v of truePeak([a.L, a.R])) tp = Math.max(tp, v);
  ok(hash(a) === hash(b), "guarded mix is deterministic");
  ok(Math.abs(I - GUARD.target) < 0.5, `guarded mix at ${I.toFixed(2)} LUFS (target ${GUARD.target})`);
  ok(20 * Math.log10(tp) <= GUARD.ceiling + 0.3, `true peak ${(20 * Math.log10(tp)).toFixed(2)} dBTP (ceiling ${GUARD.ceiling})`);
}

// 5
{
  const dir = path.join(ROOT, "assets/models"), file = fs.readdirSync(dir, { recursive: true }).map((f) => path.join(dir, f)).find((f) => fs.statSync(f).isFile() && /\.(gltf|glb|bin)$/.test(f));
  const fp = () => spawnSync(process.execPath, ["-e", `import("${path.join(ROOT, "engine/cache.mjs").replace(/\\/g, "/")}").then((m) => console.log(m.engineHash()))`], { encoding: "utf8" }).stdout.trim();
  const before = fp(), orig = fs.readFileSync(file);
  let after; try { fs.writeFileSync(file, Buffer.concat([orig, Buffer.from(" ")])); after = fp(); } finally { fs.writeFileSync(file, orig); }
  ok(before && after && before !== after && fp() === before, `an edit to ${path.relative(ROOT, file)} changes the engine fingerprint (${before} -> ${after})`);
}

console.log(fails ? `${fails} failed` : "all passed");
process.exit(fails ? 1 : 0);
