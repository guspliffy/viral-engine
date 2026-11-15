// Spud's lines in block D of EP03 (Atlantis), word for word from STORY.md (long lines split at a full stop so a cut can
// sit there). Numbers are written as spoken; SUBS gives the subtitle where it differs (digits read without English).
// Tones: deadpan believer; the hook and the reveal excited, the low quiet, the cost soft.
export const TONE = "calm";
export const LINES = {
  d1: "Three seventy-three BC. A city sank overnight.",
  d2a: "Clue four. Helike, Greece.",
  d2b: "An earthquake, then the sea. By morning, it was gone.",
  d2c: "And Plato was alive.",
  d3a: "But Atlantis was bigger than Libya and Asia together.",
  d3b: "Nothing sinks that in one day.",
  d4: "Four clues. No city. And it is almost midnight.",
  d5a: "It didn't sink.",
  d5b: "It left.",
  d6: "Somebody had to tell you.",
  d7: "Case closed.",
  d8: "Nobody saw that.",
};
export const SUBS = { d1: "373 BC. A city sank overnight." };
export const TONES = { d1: "excited", d2c: "excited", d3b: "question", d4: "whisper", d5b: "excited", d6: "whisper" };
export const toneOf = (k) => TONES[k] ?? TONE;
