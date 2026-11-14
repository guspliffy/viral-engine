// Spud's lines in EP02 block B, word for word from STORY.md (long lines split at a full stop, so a cut can sit there).
// Tones (pilot BLOCKS.md "How we explain" 6: deadpan, not flat): the clue reveal and the twist excited, the ask as questions.
export const TONE = "calm";
export const LINES = {
  b1: "This stone does not belong here.",
  b2a: "Clue two. Bluestone.",
  b2b: "About eighty of them. Two tonnes and more.",
  b3a: "The rock matches one place on Earth.",
  b3b: "The Preseli Hills, in Wales.",
  b4: "Two hundred and forty kilometres away.",
  b5a: "They tell you: dragged here.",
  b5b: "Over mountains. Across rivers. Eighty times.",
  b6a: "And then there is this one.",
  b6b: "The Altar Stone. Six tonnes.",
  b7a: "In 2024, scientists tested it.",
  b7b: "It is not from Wales.",
  b8a: "It came from the far north of Scotland.",
  b8b: "Seven hundred and fifty kilometres.",
  b9: "Nobody knows how.",
  b10a: "Aliens? Type one.",
  b10b: "Humans? Type two.",
  b11: "I'll wait.",
  // the tall cut's own hook (TikTok part 2, kit BLOCKS.md): over the cargo ship crossing Wales
  h1: "Who carried these to Stonehenge?",
};
export const TONES = { b2a: "excited", b7b: "excited", b10a: "question", b10b: "question", h1: "question" };
export const toneOf = (k) => TONES[k] ?? TONE;
