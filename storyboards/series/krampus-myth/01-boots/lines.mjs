// Krampus myth 01 "One night a year he checks your boots": the spoken lines, in order (STORY.md v1, Jonny's picks 21 Nov 2026 09:03-09:08 Berlin).
// [who, line, tone, style (VoxCPM2 acting direction; null = the recipe's base + tone), { voice, take }]
// Spoken lines stay lower case (the TTS spells an all-caps word out); emphasis lives in the caption text only.
// Voices for the rough draft (Jonny judges by ear): Spud "spud-quick", Chip "chip-clean", the door-9 kid "heart" (tiny, high).
// Saint Nick and the Krampus have no lines (Nick reads and shakes his head; the Krampus breathes and rings).
const CH = { voice: "chip-clean" }, SP = { voice: "spud-quick" }, KID = { voice: "heart" };
export const LINES = [
  ["kid", "I was gonna be good tomorr-", "excited", null, KID],                                                    // 0 (cut off by the lid)
  ["spud", "That's number nine. We're number four.", "calm", "calm, low, matter-of-fact, a little too relaxed", SP], // 1
  ["chip", "Who are they?!", "excited", "panicked, high, fast", CH],                                               // 2
  ["spud", "Saint Nick reads your whole year from the golden book. Good kids get chocolate.", "calm", "calm, knowing, explaining", SP], // 3
  ["spud", "Bad kids get him. Krampus.", "calm", "low, slow on 'Krampus'", SP],                                    // 4
  ["chip", "And really bad kids?", "excited", "small, scared, slow", CH],                                          // 5
  ["chip", "My boot is dirty. Is that bad?!", "excited", "horrified, high, fast", CH],                             // 6
  ["spud", "Kids clean their boots for him. That's the rule.", "calm", "calm, explaining", SP],                    // 7
  ["chip", "Done. Good kid.", "calm", "proud, cocky, grinning", CH],                                                // 8
  ["spud", "Oh. He doesn't check the boot. He checks the book.", "calm", "dry, a small realisation", SP],          // 9
  ["chip", "What's on my page?", "excited", "nervous, quick", CH],                                                 // 10
  ["spud", "The fries.", "calm", "dry, deadpan", SP],                                                              // 11
  ["chip", "That was one time!", "excited", "outraged, high", CH],                                                 // 12
  ["spud", "Every Tuesday.", "calm", "dry, deadpan", SP],                                                          // 13
  ["chip", "Then he doesn't find me.", "excited", "determined, fast, diving", CH],                                 // 14
  ["spud", "The bells aren't decoration. They're so you hear him coming.", "calm", "calm, low, unimpressed", SP],  // 15
  ["chip", "He can smell me?", "excited", "a shocked whisper", CH],                                                // 16
  ["spud", "His name comes from claw.", "calm", "calm, low, knowing", SP],                                         // 17
  ["chip", "This is just a story, right?", "calm", "small, hopeful, shaky", CH],                                   // 18
  ["spud", "Every December they still walk the Alps. Hundreds of them.", "calm", "low, telling a secret", SP],     // 19
  ["chip", "Okay. Last idea.", "calm", "small, sly, quiet", CH],                                                   // 20
  ["chip", "I'm a good kid!", "excited", "delighted, relieved, high", CH],                                         // 21
  ["spud", "...That's not my picture.", "calm", "slow, small, dawning", SP],                                       // 22
  ["chip", "It is now.", "calm", "mouth full, innocent, cheeky", CH],                                              // 23
];
// measured spoken lengths (qa/lines.mjs boots-voice-probe.json, 21 Nov 2026), in LINES order
export const DUR = [1.83, 2.22, 1.51, 4.69, 2.48, 1.44, 1.83, 2.30, 1.74, 4.03, 1.01, 0.80, 1.03, 0.88, 1.13, 3.29, 1.05, 1.37, 1.63, 3.58, 1.45, 1.03, 1.75, 0.69];
