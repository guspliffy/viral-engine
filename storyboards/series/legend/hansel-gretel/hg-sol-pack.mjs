// The Sol review pack for one draft: beats.txt (lines, shots, shot list) + 1 fps sheets (split at 50 s, 10 per row) + 5 fps 10 s strips.
//   node storyboards/series/legend/hansel-gretel/hg-sol-pack.mjs <video-with-subs.mp4> <out-dir>
import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const [video, dir] = process.argv.slice(2); mkdirSync(dir, { recursive: true });
const S = await import("./hg.mjs");
const f2 = (x) => x.toFixed(2);
let t = "LINES (start-end s, speaker, text)\n";
for (const id of S.ORDER) { const ln = S.LINE[id]; t += `${f2(ln.at)}-${f2(ln.end)} ${ln.who} ${ln.text}\n`; }
t += "\nSHOTS (start-end s, id, note)\n";
for (const s of S.TIMELINE) t += `${f2(s.at)}-${f2(s.end)} ${s.id} \n`;
t += `\nDURATION ${f2(S.DUR)}\n\n`;
t += `SHOT LIST (the director's plan, round 2: L05 and L26 are dropped, L11 ends after "1812.", L20 ends after "chicken bone."; no speed-up; the cut splits some shots into a/b/c angle changes)
| # | Lines | Shot | Notes |
|---|---|---|---|
| 1 | L01 | FRAME 0: the frame-0 preset (house big in a black forest, RED EYES open in a sugar window), slow push-in from t=0; eyes look toward camera at ~1.5 s | Brightest thing on a dark frame. Banner + T1. Re-hook: the oven glimpse (6 frames, blurred, dark) at 2.4 s. |
| 2 | L02 | Kid close at the house, sniffing, candle jar in hand; the eyes in the same (right) window above him | Grandma never on screen. |
| 3 | L03 | 9 p.m.: campfire, the father walks away once (a, b), then the kids' faces (c) | |
| 4 | L04 | Pebble memory (a), then Hansel drops crumbs, each falls from his hand and stays (b) | |
| 5 | (L05 dropped) | 0.8 s insert: beak and crumb, each crumb gone at a beak contact, ends on bare ground | |
| 6 | L06 | Gretel close, scared, the empty path | |
| 7 | L07 | Midnight, moon shafts, warm glow far between the trunks, camera drifts toward it | Re-hook. |
| 8 | L08 | Gretel sniffs and points | |
| 9 | L09-L10 | Two-shot: Gretel worried; Hansel walks past her toward the glow; the flame shrinks on "hungry" | Candle jar in his hand. |
| 10 | L11 | One walking shot toward the house (1812 line), Hansel ahead, Gretel behind | |
| 11 | L12 | House reveal: bread wall (a), roof icing (b), the sugar pane (c) | After "clear sugar": 12-frame oven glimpse. |
| 12 | L13 | Hansel breaks a corner off the sugar window (a), bites it; the eyes open in the right window (b) | The jar stands on the ground beside him. The piece stays in his hand to the end. |
| 13 | L14 | Reaction close-up, the piece still in his hand | |
| 14 | L15 | The door opens, the beam, the witch sweet in the doorway; the kids step to the threshold | |
| 15 | L16 | 3 a.m.: both beds, moonlight patch, the jar on the floor by the bed | |
| 16 | L17 | Witch face close, red eyes (a), bedside sniff (b), over the boy (c) | |
| 17 | L18 | Hansel sniffs (a, same framing as shot 2) / witch sniffs over his pillow (b), the grab (c), the gate closing (d) | |
| 18 | L19 | Close-up: the bars, the bony hand reaches in through one gap | |
| 19 | L20 | The fist with the bone, the fingertips close on it | |
| 20 | L21 | Witch close, annoyed | |
| 21 | L22 | Hansel in the cage, tighter | No candle jar (it stays at the bed). |
| 22 | L23 | Witch points at Gretel (a, b); insert: Gretel strikes the flame, the oven catches (c) | |
| 23 | L24 | Witch beside the open oven, sweet again | |
| 24 | L25 | Gretel close, push in on "Show me?" | |
| 25 | (no line) | The shove: anticipation (a), shove with the witch clipped at the oven mouth (b), the door and the latch (c) | Fast cuts. |
| 26 | (L26 dropped) | Gretel opens the gate, Hansel steps through (a); she scoops the pearls into her apron pocket (b) | |
| 27 | L27 | Dawn: they run home hand in hand, the sugar piece in his hand, the pearls in her pocket | |
| 28 | L28 | He stops, sniffs, lifts the piece to his mouth | |
| 29 | L29 | Gretel close, deadpan | |
| 30 | L30 | He turns around chewing; picture through the last sound | |
`;
writeFileSync(`${dir}/beats.txt`, t);
const dur = S.DUR, ff = (...a) => execFileSync("ffmpeg", ["-v", "error", "-y", ...a], { maxBuffer: 1 << 28 });
// 1 fps: 0-49 s, 50-... s (10 per row, 180x320 tiles)
for (const [a, b] of [[0, 50], [50, Math.ceil(dur)]]) {
  if (a >= dur) continue; const n = Math.min(b, Math.ceil(dur)) - a, rows = Math.ceil(n / 10);
  ff("-ss", String(a), "-i", video, "-t", String(n), "-vf", `fps=1,scale=180:320,tile=10x${rows}`, "-frames:v", "1", "-q:v", "3", `${dir}/sheet-1fps-${String(a).padStart(2, "0")}-${Math.ceil(dur) - 1 < b ? Math.ceil(dur) - 1 : b - 1}s.jpg`);
}
for (let a = 0; a < dur; a += 10) {
  const n = Math.min(10, dur - a), rows = Math.ceil(n * 5 / 10);
  ff("-ss", String(a), "-i", video, "-t", String(n), "-vf", `fps=5,scale=180:320,tile=10x${rows}`, "-frames:v", "1", "-q:v", "3", `${dir}/strip-5fps-${String(a).padStart(3, "0")}s.jpg`);
}
console.log("pack", dir);
