// Egypt myth 01 "Your heart vs. one feather": the spoken lines, in order (STORY.md v1, Jonny's picks 20 Nov 2026 15:07-15:35 Berlin).
// [who, line, tone, style (VoxCPM2 acting direction; null = the recipe's base + tone), { voice, take }]
// No names in any line (Jonny 18 Nov). Voices for the rough draft (Jonny judges by ear): Spud = "spud-quick" (the Potato Desk 10 voice, 15 % quicker),
// Chip = "chip-clean", jackal = "dragon" (low, gravelly) read slow, judges alternate "wedge" / "mash", the hearts = "heart".
const J1 = { voice: "wedge" }, J2 = { voice: "mash" }, CH = { voice: "chip-clean" }, SP = { voice: "spud-quick" }, HE = { voice: "heart" };
const JUDGE = "stern, slow, cold, a judge";
export const LINES = [
  ["soul", "No-", "excited", "a desperate cry cut off", { voice: "teo" }],                                    // 0
  ["chip", "She just ate his heart?!", "excited", "shocked, horrified, high, fast, stress on ate", CH],     // 1 (lower case: the TTS spelled ATE out; the caption keeps *ATE*)
  ["spud", "Don't move. Yours is next.", "calm", "calm, low, matter-of-fact, a little too relaxed", SP],       // 2
  ["chip", "Why my heart?", "excited", "panicked, high", CH],                                                 // 3
  ["spud", "Down here, your heart remembers everything you ever did.", "calm", "calm, knowing, explaining", SP], // 4
  ["spud", "Heavier than that feather, she eats it. And you're gone. Forever.", "calm", "calm, slow on 'forever'", SP], // 5
  ["chip", "Okay. How do I make it light?", "excited", "nervous, fast, eager", CH],                            // 6
  ["spud", "Forty-two judges. One question each. Say no to every one.", "calm", "calm, explaining, counting", SP], // 7
  ["judge1", "Ever stolen?", "calm", JUDGE, J1],                                                              // 8
  ["chip", "No.", "calm", "small, quick, innocent", CH],                                                      // 9
  ["judge2", "Ever lied?", "calm", JUDGE, J2],                                                                // 10
  ["chip", "No.", "calm", "small, quick, innocent", { ...CH, take: 2 }],                                      // 11
  ["judge1", "Ever killed anyone?", "calm", JUDGE, { ...J1, take: 2 }],                                       // 12
  ["chip", "No!", "excited", "big, earnest, offended", CH],                                                    // 13
  ["chip", "This is easy.", "calm", "relaxed, cocky, grinning", CH],                                           // 14
  ["heart", "He stole fries.", "calm", null, HE],                                                              // 15
  ["chip", "My heart is snitching on me?!", "excited", "outraged, betrayed, high, fast", CH],                   // 16
  ["spud", "It's a witness. It saw everything.", "calm", "calm, shrugging", SP],                               // 17
  ["judge2", "Ever angry for no reason?", "calm", JUDGE, { ...J2, take: 2 }],                                  // 18
  ["chip", "No!", "excited", "furious, shouting", { ...CH, take: 3 }],                                         // 19
  ["heart", "Right now.", "calm", null, HE],                                                                   // 20
  ["judge1", "Ever been loud?", "calm", JUDGE, { ...J1, take: 3 }],                                            // 21
  ["chip", "Noooo!", "excited", "screaming at the top of his lungs", CH],                                      // 22
  ["chip", "Do something!", "excited", "panicked, begging", CH],                                               // 23
  ["spud", "Thirty-seven to go.", "calm", "calm, dry", SP],                                                    // 24
  ["judge2", "Ever eavesdropped?", "calm", JUDGE, { ...J2, take: 3 }],                                         // 25
  ["chip", "...no.", "calm", "a tiny guilty whisper", CH],                                                     // 26
  ["heart", "Every day.", "calm", null, HE],                                                                   // 27
  ["spud", "Plan B.", "calm", "calm, decisive", SP],                                                           // 28
  ["chip", "A bug?!", "excited", "disbelief, high", CH],                                                       // 29
  ["spud", "A cheat sheet. They buried people with this on their chest. It tells your heart: don't speak against me.", "calm", "low, conspiratorial, explaining", SP], // 30
  ["chip", "No. No. No.", "calm", "calm, confident, quick", CH],                                                // 31
  ["jackal", "Pass.", "calm", "deep, slow, solemn", { voice: "dragon" }],                                       // 32
  ["chip", "So I'm safe?", "excited", "hopeful, relieved", CH],                                                // 33
  ["spud", "Forever.", "calm", "warm, smiling", SP],                                                           // 34
  ["spud", "Thousands of those beetles are in museums today. Everyone cheated.", "calm", "dry, amused, telling a secret", SP], // 35
  ["jackal", "Next.", "calm", "deep, slow, solemn", { voice: "dragon", take: 2 }],                              // 36
  ["spud", "...Can I have my beetle back?", "calm", "small, uneasy, polite", SP],                              // 37
  ["heart", "He let him steal the fries.", "calm", null, { ...HE, take: 2 }],                                 // 38
  ["chip", "Wait... why is YOUR heart on a scale?", "excited", "slow dawning horror", CH],                     // 39
];
// measured spoken lengths (qa/lines.mjs heart-voice-probe.json, 20 Nov 2026), in LINES order
export const DUR = [0.50, 1.20, 2.49, 0.80, 3.50, 5.35, 1.63, 4.02, 1.05, 0.39, 0.96, 0.36, 1.51, 0.47, 0.71, 1.45, 1.32, 1.85, 2.46, 1.35, 0.98, 1.48, 0.61, 1.08, 1.00, 1.41, 0.51, 1.03, 0.62, 0.83, 7.04, 2.65, 0.71, 0.71, 0.76, 3.90, 1.01, 1.64, 1.88, 2.31];
