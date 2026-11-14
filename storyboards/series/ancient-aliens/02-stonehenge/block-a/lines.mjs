// Spud's lines in block A, word for word from STORY.md (the long contract line split at its full stop and its "...", so
// a cut can sit there). Tones (pilot BLOCKS.md "How we explain" 6: deadpan, not flat): the doubt as a question, the clue
// reveal excited.
export const TONE = "calm";
export const LINES = {
  l1: "Thirty tonnes. No wheel. No metal.",
  l2: "Eighty of them. Stood up in a perfect ring.",
  l3: "And they tell you farmers built this.",
  l4a: "Five clues.",
  l4b: "Today is the shortest day of the year.",
  l4c: "When the sun touches the tallest stone...",
  l4d: "you'll know who really built Stonehenge.",
  l5a: "Clue one. The tallest is nine metres long.",
  l5b: "Two of them are underground.",
  l6: "They tell you: rope, wooden sledges, and muscle.",
  l7: "From a quarry twenty-five kilometres away.",
  l8a: "No cranes. No iron.",
  l8b: "Just stone tools... they say.",
  l9a: "But the big stones are not the problem.",
  l9b: "The small ones are.",
};
export const TONES = { l3: "question", l5a: "excited" };
export const toneOf = (k) => TONES[k] ?? TONE;
