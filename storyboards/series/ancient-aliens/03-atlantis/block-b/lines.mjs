// Spud's lines in block B of EP03 (Atlantis), word for word from STORY.md (long lines split at a full stop so a cut can
// sit there). Tones: deadpan believer; the metal and the count excited, the deep blue quiet, the ask dry.
export const TONE = "calm";
export const LINES = {
  b1: "This metal should not exist.",
  b2a: "Clue two. Twenty fifteen.",
  b2b: "Divers off Sicily find thirty-nine bars of it.",
  b2c: "In a ship two thousand six hundred years old.",
  b3: "Copper and zinc. Plato called it orichalcum.",
  b4a: "So the metal was real.",
  b4b: "And Plato says where the city stood. Beyond the Pillars of Heracles.",
  b5a: "It ruled the sea.",
  b5b: "Then, one day, the ground began to shake.",
  b6a: "But the Atlantic is four kilometres deep.",
  b6b: "Most of it nobody has ever seen.",
  b7a: "Real? Type one.",
  b7b: "Made up? Type two.",
  b7c: "I'll wait.",
};
export const TONES = { b1: "excited", b2b: "excited", b5b: "question", b6b: "question" };
// the subtitle where it differs from the spoken words; a re-read (VoxCPM take n) where a take came out broken
export const SUBS = { b2a: "Clue two. 2015." };
export const TAKES = { b7a: 2 };   // take 1 of "Real? Type one." had four long gaps (6.25 s)
export const toneOf = (k) => TONES[k] ?? TONE;
