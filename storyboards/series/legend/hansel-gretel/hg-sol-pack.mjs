// The Sol review pack for one draft: beats.txt (lines, shots, shot list) + 1 fps sheets (split at 50 s, 10 per row) + 5 fps 10 s strips.
//   node storyboards/series/legend/hansel-gretel/hg-sol-pack.mjs <video-with-subs.mp4> <out-dir> <round 1|2|3>
// The prompt.md is written here too, with the round number and the sheet/strip file names taken from the files this run writes (R2 fix: the r2 prompt still named round-1 files).
import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const [video, dir, round = "1"] = process.argv.slice(2); mkdirSync(dir, { recursive: true });
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
const dur = S.DUR, sheetNames = [], stripNames = [], ff = (...a) => execFileSync("ffmpeg", ["-v", "error", "-y", ...a], { maxBuffer: 1 << 28 });
// 1 fps: 0-49 s, 50-... s (10 per row, 180x320 tiles)
for (const [a, b] of [[0, 50], [50, Math.ceil(dur)]]) {
  if (a >= dur) continue; const n = Math.min(b, Math.ceil(dur)) - a, rows = Math.ceil(n / 10);
  const nm = `sheet-1fps-${String(a).padStart(2, "0")}-${Math.ceil(dur) - 1 < b ? Math.ceil(dur) - 1 : b - 1}s.jpg`; sheetNames.push(nm);
  ff("-ss", String(a), "-i", video, "-t", String(n), "-vf", `fps=1,scale=180:320,tile=10x${rows}`, "-frames:v", "1", "-q:v", "3", `${dir}/${nm}`);
}
for (let a = 0; a < dur; a += 10) {
  const n = Math.min(10, dur - a), rows = Math.ceil(n * 5 / 10);
  const nm = `strip-5fps-${String(a).padStart(3, "0")}s.jpg`; stripNames.push(nm);
  ff("-ss", String(a), "-i", video, "-t", String(n), "-vf", `fps=5,scale=180:320,tile=10x${rows}`, "-frames:v", "1", "-q:v", "3", `${dir}/${nm}`);
}
const prevNote = round === "1" ? "" : `This is round ${round}. The previous round asked for fixes (all applied, except: no speed-up because voices are already 1.15x, and the director's calls). Check that they landed, then list only what is still wrong or new.\n\n`;
writeFileSync(`${dir}/prompt.md`, `# Sol round ${round}: EDITOR pass (timing first) + glitch/logic review — "Hansel and Gretel" (lesson-legend, rough draft ${round})

You are the editor and checker of a ${dur.toFixed(1)} s vertical (1080x1920, 30 fps) TikTok short. You get NO video, only files in this folder:
- \`beats.txt\`: every spoken line with start-end time (s), speaker and text; every shot with start-end time and id; then the director's shot list.
- ${sheetNames.map((x) => "`" + x + "`").join(", ")}: one frame per second (10 per row, left to right, top to bottom; the second sheet starts at 50 s).
- \`${stripNames[0]}\` ... \`${stripNames[stripNames.length - 1]}\`: five frames per second, each covers 10 s (10 per row = 2 s per row), starting at the second in its name.

## The video
Grimm's Hansel and Gretel (Hesse, 1812) retold as ONE night in a black German forest. Hero = our recurring kid host (12, pink quilted jacket, carries his grandmother's candle jar = fear meter) as Hansel; Gretel = his younger sister (ginger braids, blue dress, white apron), the clever one; the witch (polka-dot raspberry headscarf, green skin, red near-blind eyes, long nose that sniffs). Speakers: N narrator, G grandmother (voice only), K kid/Hansel, R Gretel, W witch.
Built on what holds viewers in this niche: the house with RED EYES in a sugar window is on screen from frame 0, the rule is the first line ("If you smell gingerbread at night... turn around."), an opening story banner (Lebkuchen heart, 0-3 s, above the subtitles), exact times (9 p.m., midnight, 3 a.m., dawn), ONE history line (L11, 1812), the twist from the Grimm text (witches can't see far but smell like animals: he smelled her house, she smelled him first), and the rule tested + twisted at the end (Gretel baits the baiter with "Show me?"; on the way home he smells gingerbread again, Gretel: "Turn around." Kid, mouth full: "...I'm turning."). Re-hooks: blurred oven glimpse ~2.4 s (clearer later), "Midnight. Something sweet...", the 1812 line, "He smelled her house. She smelled him first.", "But a bone only works until she gets hungry."
Sound is in the video but you only get pictures; don't comment on sound.
Everything is drawn in code (flat 2D vector, thin outlines, 2.5D sets with a moving camera). Cheap to change: camera position/move/zoom per shot, cut points, shot order, holds and gaps, poses and expressions, inserts (close-ups of eyes, nose, crumbs, the bone, the oven door, hands, the candle), splitting/merging shots. Lines can be trimmed or dropped (not newly recorded easily). NEVER suggest a trim that cuts into a spoken word. The owner approved the STORY: keep every story beat.
ALREADY DECIDED, do not comment: subtitles in the upper third, word by word; the Lebkuchen banner; "I'm turning" with a full mouth as the last line.

${prevNote}## Part A — EDITOR (main task, TIMING FIRST)
TARGET LENGTH ~80-85 s (it is ${Math.round(dur)} s now; the owner speeds videos up 10-25% and wants story, not padding). Say exactly which gaps/holds to shorten, which lines or line parts (between sentences only) to drop, and which shots last too long or too short. Also: where a still shot needs a camera move or a cut, where an insert makes a beat land, where tension needs a silence, which framings repeat too often, which dark shots are too dark or faces too small to read on a phone. Numbered EDIT LIST, each item: time range, change, why (one line). Order by impact, max ~15 items.

## Part B — GLITCHES AND LOGIC
Every visible glitch (pops, flicker, a pose jumping between two frames of one shot, limbs through bodies/walls/bars, props in the air, faces lost or cut by the frame, wrong sizes between shots, semi-transparent bodies) and every logic issue (effect before cause, a character in the wrong place between cuts, Hansel outside the cage after he was locked in, the candle jar appearing/disappearing, the oven door state, crumbs back after the birds ate them), each with its time.

End with exactly one last line: \`VERDICT: PASS\` or \`VERDICT: FIX <n>\` (n = number of Part A + Part B items).
Write your full answer to \`answer.md\` in this folder.
`);
console.log("pack", dir);
