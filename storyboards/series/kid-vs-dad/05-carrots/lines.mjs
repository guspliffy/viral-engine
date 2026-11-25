// Kid vs Dad 05 "Carrots help you see in the dark": the spoken lines, in order. Outline (Jonny 25 Nov 2026 12:34 Berlin:
// hook H1 + ending E1 approved; 13:00 "looks good" on the 15-panel sheet): ./OUTLINE.md, sheets/kid-vs-dad-05-panels-v1.png.
// Cast: rep = the war correspondent (ep 1, seen through night-vision green), spud = Tato (spud-kid, the only name said),
// dad = Dad B (never named). Label at 0 s: "When your dad says carrots help you see in the dark".
// Hidden twist teased 3 times: crunching from the dark kitchen, crumbs in Dad's moustache, the jar lighter every night.
// [who, line, tone, style (VoxCPM2 acting direction), { voice }]
import { readFileSync } from "node:fs";
// Reaper keeps the tempo these takes were timed with (1.25): main's 15 % rule (PR #310, 1.44) came after this clip's
// rough draft, and the rule says a clip in work keeps its takes and is sped up as a whole at the join (1.15x here).
const VOICES = JSON.parse(readFileSync(new URL("../../../../engine/voice/voices.json", import.meta.url), "utf8"));
const REP = { voice: { ...VOICES.reaper, tempo: 1.25 } }, KID = { voice: "tato" }, DAD = { voice: "dad" };
export const LINES = [
  // 0-5 s HOOK H1: power word, the lie, then the question
  ["dad", "Carrots. Eat them, and you see in the dark.", "calm", "a stern dad, dead certain, pointing at his eyes", DAD],
  ["rep", "In the dark. Is it true?", "whisper", "night vision, crouched in a dark hallway, tense", REP],
  // 5-12 s NAME + RULE + STAKE (clock: lights out)
  ["rep", "We're live. Tato, age seven, hates carrots.", "calm", "grave, low, a war correspondent under cover", REP],
  ["rep", "And in this house, there is one rule: eat your carrots, and you see in the dark.", "calm", "slow, ominous, a pause before the last words", REP],
  ["rep", "The target: the cookie jar. Top shelf. Only in the dark.", "calm", "a mission briefing, clipped, serious", REP],
  // 12-25 s NIGHT 1: one carrot, the door, crunching from the kitchen (tease 1)
  ["rep", "Night one. One carrot.", "calm", "quiet, tense", REP],
  ["rep", "Not enough carrots.", "sad", "wincing, flat, after a loud bonk", REP],
  ["rep", "...Who is crunching?", "whisper", "suspicious, very quiet, listening", REP],
  // 25-38 s NIGHT 2: a bowl at breakfast, crumbs in Dad's moustache (tease 2), the toy block
  ["dad", "Eat up.", "calm", "cheerful, innocent, sipping coffee", { ...DAD, take: 2 }], // take 1 heard as "speed up.",
  ["spud", "Dad, you have crumbs.", "calm", "flat, suspicious, a seven-year-old staring", KID],
  ["dad", "...Carrot crumbs.", "calm", "too quick, too calm, a lie", DAD],
  ["rep", "Night two. Halfway there.", "whisper", "tense, holding his breath", REP],
  // 38-50 s NIGHT 3 (extreme): the whole bag, glowing eyes, spy roll; the jar lighter every night (tease 3)
  ["rep", "Night three. The whole bag.", "calm", "awed, slow, grave", REP],
  ["rep", "He can see!", "excited", "amazed, breathless, breaking news", REP],
  ["rep", "And the cookie jar... is lighter every night.", "whisper", "suspicious, slow, ominous", REP],
  // 50-62 s THE KITCHEN: climb, reach, a second pair of eyes
  ["rep", "Contact.", "whisper", "barely audible, frozen", REP],
  // 62-70 s END E1: the fridge light, Dad in night-vision goggles, hand in the jar. CUT on "Carrots."
  ["spud", "...Dad?", "question", "flat, small, unimpressed", KID],
  ["dad", "...Carrots.", "calm", "mouth full of cookie, guilty, dead serious", DAD],
];
