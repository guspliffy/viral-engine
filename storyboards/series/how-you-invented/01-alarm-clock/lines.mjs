// How you invented 01 "The alarm clock" (Jonny picked H1 + E1, outline OK 26 Nov 2026 21:18 Berlin; OUTLINE.md here).
// A YOU situation: Spud plays you, nobody says his name; the narrator talks to you. Mash is named once by the narrator.
// Voices: narrator-quick (voice 1, deep storyteller, x1.15), viking-x115 (the boss), spud-x115 (you, one yell).
// [kind, who, line, tone, { voice, take, style }]   kind "say" = a character on screen, "narr" = the narrator
export const NARRATOR = "narrator-quick";
const B = { voice: "viking-x115", style: "deep, stern, furious, a boss at the door" }, Y = { voice: "spud-x115", style: "yelling, desperate" };
export const LINES = [
  ["say", "boss", "Sunrise. Not one minute later. Or you're BOTH fired.", "angry", B],
  ["narr", null, "One problem. Mash never wakes up."],
  ["say", "spud", "Mash! Wake UP!", "excited", Y],
  ["narr", null, "You yell. You shake. Nothing."],
  ["narr", null, "So you borrow the loudest thing in the village."],
  ["narr", null, "Now the whole village is awake. Except Mash."],
  ["narr", null, "Water. Nobody sleeps through water."],
  ["narr", null, "Wrong side."],
  ["narr", null, "But you can't stay up all night. So the candle pulls the rope for you."],
  ["narr", null, "He's not awake. He's a fountain."],
  ["narr", null, "Fine. Something heavier."],
  ["narr", null, "...Too heavy."],
  ["narr", null, "And the sun is coming up."],
  ["narr", null, "So you stop going bigger."],
  ["narr", null, "You've invented the alarm clock."],
  ["narr", null, "...and he just invented snooze."],
];
