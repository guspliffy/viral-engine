// Potato Desk 13 "Who's in your hell?": the spoken lines, in order (outline v3, 25 Nov 2026; hook H1 picked 13:49 Berlin,
// ending E1 the default while the producer is away). [who, line, tone, style (VoxCPM2 acting direction), { voice, take }]
// No names in any line (Jonny 25 Nov). Every voice is its character's recipe read 20 % faster (*-x12 in voices.json).
// The Devil reads in the gunslinger's voice (the stand-in since Potato Desk 09).
const HOST = "bright, quick, warm game-show host, always smiling";
export const LINES = [
  ["devil", "Welcome to HELL.", "excited", `${HOST}, grand, arms wide`, { voice: "devil-x12" }],                       // 0  hook: power word
  ["spud", "Who's in my hell?", "question", "nervous, worried, quick", { voice: "spud-x12" }],                          // 1  hook: the question
  ["devil", "One rule. Forever... with everyone who ever annoyed you.", "calm", `${HOST}, delighted, savouring it`, { voice: "devil-x12" }],   // 2  the rule
  ["devil", "Two seats left. And this one...", "calm", `${HOST}, teasing, slow`, { voice: "devil-x12" }],              // 3  the stake
  ["devil", "...is for the worst one.", "calm", `${HOST}, a whisper, delighted`, { voice: "devil-x12", take: 2 }],                 // 4  tease 1
  ["spud", "Could you chew... quieter?", "calm", "polite, strained, through his teeth", { voice: "spud-x12" }],        // 5  arrival 1
  ["chip", "Nope.", "calm", "mouth full, cheerful, chewing", { voice: "chip-x12" }],                                  // 6
  ["wedge", "Reply all.", "calm", "focused, typing, low", { voice: "wedge-x12" }],                                     // 7  arrival 2
  ["wedge", "Thanks. Thanks. THANKS!", "excited", "typing faster and faster, proud", { voice: "wedge-x12" }],          // 8
  ["spud", "I'm DEAD. Why do I still have a phone?", "excited", "outraged, high, fast", { voice: "spud-x12" }],        // 9
  ["devil", "Hell.", "calm", `${HOST}, a shrug, deadpan`, { voice: "devil-x12" }],                                     // 10
  ["wizard", "He dies at the end.", "calm", "smug, mysterious, whispering in his ear", { voice: "wizard-x12" }],       // 11 arrival 3
  ["spud", "Who?", "question", "alarmed, quick", { voice: "spud-x12" }],                                                // 12
  ["wizard", "Everyone. In every movie you haven't seen.", "calm", "smug, mysterious, delighted", { voice: "wizard-x12" }],   // 13
  ["spud", "I'm ALREADY dead!", "excited", "screaming, desperate", { voice: "spud-x12" }],                              // 14
  ["devil", "And the worst one...", "calm", `${HOST}, slow, ominous, savouring it`, { voice: "devil-x12" }],          // 15 tease 2 (the door rattles)
  ["spud", "Please be another chewer.", "calm", "a small desperate prayer, squashed", { voice: "spud-x12" }],          // 16 tease 3 (the pen clicks, they flinch)
  ["devil", "Hm. Wrong page.", "calm", `${HOST}, puzzled, flipping a page`, { voice: "devil-x12" }],                   // 17 the turn
  ["spud", "I'm free?", "question", "hopeful, small", { voice: "spud-x12" }],                                          // 18
  ["devil", "You're his hell.", "excited", `${HOST}, delighted, pointing, stressing the word his`, { voice: "devil-x12" }],                    // 19
  ["mash", "Hey, buddy!", "calm", "cheerful, relaxed, walking in", { voice: "mash-x12" }],                               // 20 ending
  ["mash", "NOT THE PEN!", "excited", "screaming in horror", { voice: "mash-x12" }],                                   // 21
];
