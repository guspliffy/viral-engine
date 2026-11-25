// Potato Desk 14 "Heaven reads your search history" (heaven/hell 4B): the spoken lines, in order (OUTLINE-B.md v2, Jonny's
// pick H1 + E1, 25 Nov 2026 13:56 Berlin). [who, line, tone, style (VoxCPM2 acting direction; null = the recipe's base + tone), { take, voice }]
// The hero is UNNAMED (no "Tato", as in idea A). First word with weight is HELL (Jonny's hook pattern); the video ends ON "Hell."
// Voices 20 % faster (Jonny 25 Nov): spud-x12 / chip-x12 / wedge-x12 (same recipes as Desk 13). The Angel keeps the reaper
// recipe (tempo 1.25 since 23 Nov), as in heaven steps (Jonny 20 Nov 22:13: keep that voice).
const ANGEL = "flat, dry, tired, polite, a heaven clerk who has seen it all, reading from a list";
const A = { voice: "reaper" }, S = { voice: "spud-x12" }, C = { voice: "chip-x12" }, Q = { voice: "wedge-x12" };
export const LINES = [
  ["angel", "How to cheat at poker. HELL.", "calm", `${ANGEL}, reading, then the last word flat and final`, A],     // 0  hook: Gunslinger drops (panel 01)
  ["angel", "Next.", "calm", `${ANGEL}, bored`, A],                                                                   // 1
  ["spud", "Wait. Out loud?", "whisper", "small, nervous, horrified whisper", S],                                     // 2  panel 03
  ["angel", "At heaven's gate, there's one rule. Hide nothing.", "calm", `${ANGEL}, slow, clear`, A],                // 3  series opener + rule (panel 04)
  ["angel", "Is it normal to talk to my plants.", "calm", `${ANGEL}, deadpan reading`, A],                          // 4  search 1 (panel 05)
  ["angel", "Fine.", "calm", `${ANGEL}, shrugging`, A],                                                               // 5
  ["angel", "Why does my best friend never pay me back.", "calm", `${ANGEL}, deadpan reading`, A],                  // 6  search 2 (panel 06)
  ["chip", "...What?", "sad", "small, hurt, confused", C],                                                            // 7
  ["angel", "How to pretend I like my best friend's cooking.", "calm", `${ANGEL}, deadpan reading`, A],             // 8  search 3 (panel 07)
  ["chip", "My casserole?", "sad", "offended, hurt, voice cracking", C],                                             // 9
  ["angel", "How to save a baby bird.", "calm", `${ANGEL}, a little softer`, A],                                     // 10 break in the ladder (panel 08)
  ["queue", "Awww.", "calm", "melting, warm, touched, a crowd sigh", Q],                                              // 11
  ["angel", "How to get a new best friend.", "calm", `${ANGEL}, deadpan reading`, A],                               // 12 search 5 (panel 09)
  ["chip", "A NEW one?", "excited", "shocked, betrayed, gasping", C],                                                // 13
  ["spud", "That's out of context!", "excited", "panicked, fast, both hands up", S],                                 // 14
  ["angel", "Oh. The last one.", "calm", `${ANGEL}, slowing down, eyebrows up, almost amused`, A],                  // 15 tease 3 (panel 11)
  ["spud", "Not the last one. Please!", "excited", "begging, desperate, on his knees", S],                           // 16 panel 12
  ["angel", "How. To. Delete. Search history.", "calm", `${ANGEL}, very slow, one word at a time`, A],               // 17 panel 13
  ["angel", "Hell.", "calm", `${ANGEL}, flat, final`, A],                                                             // 18 panel 15 -> 16, cut ~0.5 s after
];
