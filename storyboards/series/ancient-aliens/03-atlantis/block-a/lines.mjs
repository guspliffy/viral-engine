// Spud's lines in block A of EP03 (Atlantis), word for word from STORY.md (long lines split at a full stop so a cut can
// sit there). Tones: deadpan believer; the doubt as a question, the clue reveal and the metal excited.
export const TONE = "calm";
export const LINES = {
  l1: "A whole island. Gone in one day.",
  l2: "Rings of land and water. Walls of red metal.",
  l3: "And they tell you it never existed.",
  l4a: "Plato wrote it down. Twenty-four hundred years ago.",
  l4b: "Four clues.",
  l4c: "By midnight, you'll know where Atlantis went.",
  l5: "Clue one. He gave the size of every ring.",
  l6a: "A canal thirty metres deep.",
  l6b: "Deeper than the Suez Canal.",
  l7a: "White, black and red stone.",
  l7b: "Brass. Tin. And a red metal nobody had ever seen.",
  l8a: "But in twenty-four hundred years, nobody has found one stone.",
  l8b: "They found the metal.",
};
export const TONES = { l3: "question", l5: "excited", l8b: "excited" };
export const toneOf = (k) => TONES[k] ?? TONE;
