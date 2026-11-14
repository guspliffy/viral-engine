// Block D's host lines (STORY.md 2:36-3:28, word for word) and their tones; measure-lines.mjs records them and the
// generator reads the spoken lengths from lines.json.
export const LINES = {
  ago: "Nine hundred years ago, nobody believed humans built this either.",
  giants: "Clue five. The oldest story about Stonehenge says giants brought the stones.",
  picture: "And the oldest picture shows one, setting the top stone.",
  low: "Five clues. Still no proof. And the sun is almost down.",
  across: "Thirty metres across. Perfectly level. It was never a temple.",
  parking: "It's a parking space.",
  closed: "Case closed.",
  nobody: "...nobody saw that.",
  hook: "Wait for the sunset. Trust me.",   // the tall part's own hook (kit BLOCKS.md)
};
// the clue reveal is read excited; the low is quiet
export const TONES = { giants: "excited", low: "sad" };
