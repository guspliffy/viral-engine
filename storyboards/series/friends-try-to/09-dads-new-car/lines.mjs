// Friends try to 09 "Dad's new car" (18 Nov 2026): the spoken lines, in order. [who, line, tone, style (VoxCPM2 acting
// direction; null = the recipe's base + tone), { take }]. Simple words a 10-year-old non-native speaker can decode.
export const LINES = [
  ["narrator", "Dad's new car. Three tries.", "calm", "deep, serious storyteller, brisk and clear, a little ominous"],
  ["wedge", "Trust me. Back, back, back!", "happy", "loud, confident, cheerful, waving a car back"],
  ["mash", "Nice.", "calm", "flat, calm, bored, not looking up from his phone"],
  ["chip", "Your left!", "angry", "high, fast, outraged, shouting", { take: 2 }],
  ["wedge", "MY left!", "angry", "loud, upset, defensive"],
  ["narrator", "Last try.", "calm", "deep, serious storyteller, brisk, tense"],
  ["chip", "Yes! We did it!", "happy", "high, overjoyed, shouting, cheering"],
  ["wedge", "Trust me. Good car.", "happy", "warm, proud, gentle, slow"],
];
