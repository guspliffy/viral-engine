// The sound mix for kp-draft1: voices (times from kp.mjs) + Sol's cue sheet (music, answer.md) + sfx.
//   node storyboards/series/legend/kelpie/kp-mix.mjs out/legend-kelpie/mix.wav
// music/sfx come from out/legend-kelpie/{music,sfx} (pick.py output); a missing sound is skipped and listed.
// HARD SILENCES (everything but the voices is out): fingertip contact 0.7 s, the pull 0.3 s, and all music out a beat before L28.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { LINE, DUR } from "./kp.mjs";
const OUT = "out/legend-kelpie", [mixPath = `${OUT}/mix.wav`] = process.argv.slice(2);
const man = (d) => (existsSync(`${OUT}/${d}/manifest.json`) ? JSON.parse(readFileSync(`${OUT}/${d}/manifest.json`, "utf8").replace(/NaN/g, "null")).sounds : []);
const MUS = man("music"), SFX = man("sfx"), missing = [], usedRaw = [];
const rawTake = (id, k) => { const d = `${OUT}/raw/${id}`; if (!existsSync(d)) return null; const fl = readdirSync(d).filter((x) => x.endsWith(".wav")).sort(); return fl.length ? `${d}/${fl[k % fl.length]}` : null; };
const find = (arr, dir, id, k = 0) => { const m = arr.find((s) => s.id === id); if (m && !m.files.length) { const r = rawTake(id, k); if (r) { if (!usedRaw.includes(id)) usedRaw.push(id); return r; } } if (!m) { const r = rawTake(id, k); if (r) { if (!usedRaw.includes(id)) usedRaw.push(id); return r; } if (!missing.includes(id)) missing.push(id); return null; } return `${OUT}/${dir}/${m.files[k % m.files.length]}`; };
const ins = [], f = [];
const add = (file, t0, gain, extra = "") => { if (!file) return; ins.push("-i", file); const k = ins.length / 2 - 1; f.push(`[${k}:a]${extra}volume=${gain},adelay=${Math.round(Math.max(0, t0) * 1000)}:all=1[a${k}]`); };
const loop = (file, t0, t1, gain, fi = 0.25, fo = 0.25) => { if (t1 - t0 < 0.1) return; add(file, t0, gain, `aloop=loop=-1:size=2e9,atrim=0:${(t1 - t0).toFixed(2)},afade=t=in:d=${fi},afade=t=out:st=${Math.max(0, t1 - t0 - fo).toFixed(2)}:d=${fo},`); };
const at = (id) => LINE[id].at, nw = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, "");
const w = (id, p, k = 0) => { let xs = LINE[id].words.filter((q) => nw(q[0]) === p); if (xs.length <= k) xs = LINE[id].words.filter((q) => nw(q[0]).startsWith(p)); return LINE[id].at + xs[k][1]; };
const we = (id, p, k = 0) => { let xs = LINE[id].words.filter((q) => nw(q[0]) === p); if (xs.length <= k) xs = LINE[id].words.filter((q) => nw(q[0]).startsWith(p)); return LINE[id].at + xs[k][2]; };
// voices (kid a little up: his take is the softest)
for (const ln of Object.values(LINE)) add(`${OUT}/vo/${ln.id}.wav`, ln.at, { K: 1.15, G: 1.0, A: 1.0, N: 1.0 }[ln.who]);
// the hard silences
const C0 = w("L12", "nose") - 0.05, C1 = C0 + 0.7;           // fingertip contact
const P0 = w("L21", "hard") - 0.12, P1 = P0 + 0.3;           // the pull
const END_MUSIC = at("L27") + LINE.L27.len + 0.15;           // all music out a beat before L28
// music (Sol): kneel (fiddle + drone) -> wait (one held note, harp E) -> [contact: nothing] -> drag (cellos, violas) -> under (sparse low strings) -> [pull: nothing] -> obey (harp D-A) -> croft (clarsach)
const M = (id, a, b, g, fi, fo) => loop(find(MUS, "music", id), a, b, g, fi, fo);
M("kp-kneel", 0, at("L08") - 0.05, 0.59, 0.02, 0.5);
M("kp-wait", at("L08") + 0.05, C0, 0.56, 0.4, 0.04);
M("kp-drag", C1, w("L18", "kids") - 0.05, 0.59, 0.08, 0.3);
M("kp-under", w("L18", "kids") - 0.3, P0, 0.56, 0.5, 0.04);
M("kp-obey", P1 + 0.1, at("L25") - 0.1, 0.53, 0.05, 0.4);
M("kp-croft", at("L25") + 0.1, END_MUSIC, 0.5, 0.4, 0.12);
// sfx (ambience loops are cut at the silences)
const lap = find(SFX, "sfx", "loch-lap"), under = find(SFX, "sfx", "underwater"), fire = find(SFX, "sfx", "peat-fire"), wind = find(SFX, "sfx", "night-wind");
loop(lap, 0, C0, 0.5, 0.05, 0.03); loop(lap, C1, w("L18", "kids") - 0.1, 0.45, 0.05, 0.3);
loop(under, w("L18", "kids") - 0.2, P0, 0.7, 0.3, 0.03); loop(lap, P1, at("L25") - 0.05, 0.4, 0.05, 0.4);
loop(wind, at("L04"), at("L06") + 2, 0.3, 0.4, 0.5);
loop(fire, at("L25") - 0.1, DUR, 0.5, 0.3, 0.05);
const drip = (k, t, g = 0.7) => add(find(SFX, "sfx", "water-drip", k), t, g, "atrim=0:0.8,");
drip(0, 0.6); drip(1, 1.9); drip(2, w("L10", "waited") - 0.2, 0.9); drip(3, at("L22") + 1.0);
const splash = (k, t, g = 0.7) => add(find(SFX, "sfx", "splash-in", k), t, g, "atrim=0:1.2,afade=t=out:st=0.8:d=0.4,");
splash(0, w("L06", "first") + 0.9); splash(1, w("L06", "second") + 0.9); splash(2, w("L06", "third") + 0.9);
add(find(SFX, "sfx", "horse-snort", 0), w("L10", "horse") + 0.2, 0.7, "atrim=0:1.2,"); add(find(SFX, "sfx", "horse-snort", 1), at("L22") + 0.2, 0.8, "atrim=0:1.2,");
add(find(SFX, "sfx", "sticky-stretch", 0), C0 + 0.12, 0.9, "atrim=0:1.4,afade=t=out:st=1:d=0.4,");
add(find(SFX, "sfx", "sticky-stretch", 1), at("L13") + 0.3, 0.8, "atrim=0:1.4,"); add(find(SFX, "sfx", "sticky-stretch", 2), w("L13", "it's", 1), 0.8, "atrim=0:1.4,");
for (let i = 0; i < 4; i++) add(find(SFX, "sfx", "hoof-water", i), at("L16") + 0.8 + i * 0.75, 0.75, "atrim=0:1.0,afade=t=out:st=0.6:d=0.4,");
splash(3, at("L16") + 3.0, 0.8); splash(4, w("L18", "knees") + 0.1, 0.7); splash(5, w("L18", "chest") + 0.1, 0.8);
add(find(SFX, "sfx", "bridle-rings", 0), w("L19", "little"), 0.8, "atrim=0:1.0,afade=t=out:st=0.6:d=0.4,"); add(find(SFX, "sfx", "bridle-rings", 1), w("L19", "rings"), 0.7, "atrim=0:1.0,afade=t=out:st=0.6:d=0.4,");
add(find(SFX, "sfx", "bridle-rip"), P1, 1.0, "atrim=0:1.0,afade=t=out:st=0.6:d=0.4,");
splash(6, w("L23", "kids") + 0.5, 0.8); splash(7, w("L23", "kids") + 0.9, 0.7); splash(8, w("L23", "slid") + 0.7, 0.7);
for (let i = 0; i < 3; i++) add(find(SFX, "sfx", "hoof-water", i + 4), at("L24") + 1.4 + i * 0.7, 0.5, "atrim=0:1.0,afade=t=out:st=0.6:d=0.4,");
const k = ins.length / 2;
execFileSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", f.join(";") + ";" + Array.from({ length: k }, (_, i) => `[a${i}]`).join("") + `amix=inputs=${k}:normalize=0,atrim=0:${DUR.toFixed(2)},loudnorm=I=-14:TP=-1.5[out]`, "-map", "[out]", "-ar", "44100", "-ac", "2", mixPath]);
console.log("mix", mixPath, "inputs", k, "silences", C0.toFixed(2) + "-" + C1.toFixed(2), P0.toFixed(2) + "-" + P1.toFixed(2), "music out", END_MUSIC.toFixed(2), missing.length ? "MISSING: " + missing.join(",") : "all sounds present", usedRaw.length ? "(raw takes: " + usedRaw.join(",") + ")" : "");
