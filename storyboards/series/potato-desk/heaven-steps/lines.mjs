// Potato Desk "heaven steps" (100 points for heaven, he has 99): the spoken lines, in order (STORY.md v1, Jonny's pick
// 20 Nov 2026 17:51 Berlin, ending 1). [who, line, tone, style (VoxCPM2 acting direction; null = the recipe's base + tone), { take, voice }]
// No names in any line (Jonny 18 Nov). The first spoken line is the rule + number (20 Nov data read). The video ends ON "Minus one."
// Rough-draft stand-ins: the Angel reads in the Reaper's voice (no angel recipe yet), the Devil in the gunslinger's (as in Desk 09).
// Chip reads through "chip-clean" (Jonny 19 Nov).
const ANGEL = "flat, dry, tired, polite, a heaven clerk who has seen it all";
const C = { voice: "chip-clean" };
export const LINES = [
  ["angel", "Hundred points to get in. You've got ninety-nine.", "calm", `${ANGEL}, matter-of-fact`, { voice: "reaper" }],   // 0  shot 1-2
  ["chip", "One point? Easy.", "excited", "cocky, bright, quick, sure of himself", C],                                  // 1  shot 2
  ["chip", "Here, let me!", "excited", "eager, bright, showing off a little", C],                                     // 2  shot 3 (Spud trips)
  ["chip", "Did you SEE that?!", "excited", "proud, loud, bragging, arms up", C],                                     // 3  shot 6
  ["angel", "Bragging. Minus ten.", "calm", `${ANGEL}, unimpressed`, { voice: "reaper" }],                                // 4  shot 7
  ["chip", "Watering a flower, guys!", "excited", "fake sweet influencer voice, filming a selfie", C],                 // 5  shot 11
  ["angel", "Posting it? Minus thirty.", "calm", `${ANGEL}, slow`, { voice: "reaper" }],                                  // 6  shot 12
  ["chip", "I DONATED! EVERYONE!", "excited", "shouting into a megaphone, loud, proud, desperate", C],                 // 7  shot 16
  ["angel", "Minus sixty.", "calm", `${ANGEL}, bored`, { voice: "reaper" }],                                              // 8  shot 17
  ["devil", "Come on down!", "excited", "bright, quick, warm game-show host, always smiling, delighted"],               // 9  shot 21
  ["angel", "...Humility.", "calm", `${ANGEL}, softer, a little surprised, approving`, { voice: "reaper" }],              // 10 shot 26
  ["chip", "Did you see how humble I was?", "excited", "smug, grinning, fishing for praise", C],                       // 11 shot 31
  ["angel", "Minus one.", "calm", `${ANGEL}, without looking up`, { voice: "reaper" }],                                   // 12 shot 32
];
