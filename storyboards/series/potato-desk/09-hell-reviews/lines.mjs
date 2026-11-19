// Potato Desk 09 "Hell has better reviews than heaven": the spoken lines, in order (STORY.md v2, Jonny's "go" 19 Nov 2026
// 13:37 Berlin). [who, line, tone, style (VoxCPM2 acting direction; null = the recipe's base + tone), { take }]
// No names in any line (Jonny 18 Nov). The Devil reads in the gunslinger's voice for the rough draft (a stand-in: no
// devil recipe yet), directed as a quick, bright game-show host who never stops smiling.
// Chip reads through "chip-clean" (the chip voice with each take denoised: Jonny 19 Nov, "chips voice is again not clean")
const HOST = "bright, quick, warm game-show host, always smiling";
export const LINES = [
  ["reaper", "Heaven or hell?", "calm", "flat, dry, bored, a clerk"],                          // 0
  ["chip", "Hell. Five stars!", "excited", "bright, fast, eager, sure of himself", { voice: "chip-clean" }],             // 1
  ["reaper", "You're sure?", "calm", "flat, dry, slow, a little amused"],                       // 2
  ["chip", "Look at the reviews!", "excited", "bright, fast, eager, pointing", { voice: "chip-clean", take: 2 }],                 // 3
  ["reaper", "Funny. Everyone picks hell.", "calm", "flat, dry, slow, knowing"],                // 4
  ["devil", "Welcome to five-star hell!", "excited", `${HOST}, loud, arms wide`],              // 5
  ["chip", "That's lava!", "excited", "shocked, outraged, high, fast", { voice: "chip-clean" }],                         // 6
  ["devil", "It's hot. It's a tub.", "calm", `${HOST}, matter-of-fact`],                        // 7
  ["chip", "Those are potatoes!", "excited", "horrified, outraged, high, fast", { voice: "chip-clean" }],                 // 8
  ["devil", "Ketchup?", "question", `${HOST}, helpful`],                                       // 9
  ["chip", "Ow! Ow!", "excited", "short sharp yelps of pain", { voice: "chip-clean" }],                                 // 10
  ["devil", "Deep tissue.", "calm", `${HOST}, soothing`],                                      // 11
  ["chip", "It's the same song!", "excited", "exasperated, outraged, fast", { voice: "chip-clean" }],                    // 12
  ["devil", "Forever!", "excited", `${HOST}, delighted`],                                      // 13
  ["devil", "Nice view, right?", "calm", `${HOST}, proud`],                                    // 14
  ["chip", "Five stars?! This is the worst!", "excited", "furious, outraged, loud, fast", { voice: "chip-clean" }],      // 15
  ["devil", "Before you go... rate your stay!", "excited", `${HOST}, sweet, pushy`],           // 16
  ["chip", "One star.", "calm", "cold, flat, firm, slow", { voice: "chip-clean" }],                                     // 17
  ["devil", "W-wait! One?!", "excited", "panicked, stammering, voice cracking, the smile slipping"],   // 18
  ["devil", "Hot tub! A real one!", "excited", "desperate, eager to please, fast"],             // 19
  ["chip", "Two stars.", "calm", "unimpressed, flat, slow", { voice: "chip-clean" }],                                   // 20
  ["devil", "Two?!", "excited", "panicked, high, voice cracking"],                              // 21
  ["chip", "Hmm. Three.", "calm", "unimpressed, considering, slow", { voice: "chip-clean" }],                           // 22
  ["chip", "Four stars.", "calm", "relaxed, lazy, content, slow", { voice: "chip-clean" }],                              // 23
  ["devil", "Four...", "sad", "sobbing, crying, heartbroken, wailing"],                         // 24
  ["reaper", "Heaven or hell?", "calm", "flat, dry, bored, a clerk"],                          // 25
  ["wedge", "Hell. One star.", "calm", "low, slow, grinning, sly"],                             // 26
  ["devil", "Nooo.", "sad", "whimpering, quiet, crying"],                                       // 27
];
