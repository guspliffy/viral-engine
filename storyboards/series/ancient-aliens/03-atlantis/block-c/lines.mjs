// Spud's lines in block C of EP03 (Atlantis, story 1:42-2:34, part 3), word for word from STORY.md (long lines split at a
// full stop so a cut can sit there; years written as spoken). Tones: deadpan believer; the prophecy eerie and calm, the
// road excited, the beachrock flat, the staircase questions as questions.
export const TONE = "calm";
export const LINES = {
  c1: "He named the year. Twenty-eight years early.",
  c2a: "Clue three. In nineteen forty, an American psychic said:",
  c2b: "part of Atlantis will rise. Near Bimini.",
  c2c: "In sixty-eight or sixty-nine.",
  c3a: "In nineteen sixty-eight, divers found this.",
  c3b: "Eight hundred metres of square stones.",
  c4: "In Atlantis, it was evening.",
  c5a: "But geologists say: natural beachrock.",
  c5b: "Cracked into squares.",
  c6a: "So the real question.",
  c6b: "Can a whole city sink in one day?",
  c7a: "The sea rises three millimetres a year.",
  c7b: "In one day?",
  c7c: "Nothing.",
  c8a: "But an earthquake?",
  c8b: "In sixteen ninety-two, two thirds of a town sank into the sea.",
  c8c: "In two minutes.",
  c9a: "Closer.",
  c9b: "But that was one town.",
};
export const TONES = { c3a: "excited", c6b: "question", c7b: "question", c8a: "question" };
export const toneOf = (k) => TONES[k] ?? TONE;
