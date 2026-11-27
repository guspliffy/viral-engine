// How you invented 02 "The shopping cart" (Jonny "go" on M1 H1 E1 L2, 27 Nov 2026 21:48 Berlin; OUTLINE.md here).
// A YOU situation: Spud plays you, nobody says his name; the narrator talks to you. Mash is named by the narrator.
// Mash's rule is his own command ("Drop it... and it's MINE."), said at frame 0 and again as the last line (the flip).
// Voices: narrator-quick (voice 1, deep storyteller, x1.15), mash-x115 (smug, lazy).
// [kind, who, line, tone, { voice, take, style }]   kind "say" = a character on screen, "narr" = the narrator
export const NARRATOR = "narrator-quick";
const M = { voice: "mash-x115", style: "smug, lazy, mouth half full, enjoying it" };
export const LINES = [
  ["say", "mash", "Drop it... and it's MINE.", "smug", M],
  ["narr", null, "Mash is the WORST friend in the village. How do you beat him?"],
  ["narr", null, "You carry more."],
  ["narr", null, "...You carry nothing."],
  ["narr", null, "A basket. Everything in one place."],
  ["narr", null, "Including your foot."],
  ["narr", null, "So you give it wheels."],
  ["narr", null, "The village is on a hill."],
  ["narr", null, "Wheels need a brake."],
  ["narr", null, "...It works."],
  ["narr", null, "Mash doesn't steal snacks anymore."],
  ["narr", null, "He steals the whole cart."],
  ["narr", null, "So you lock them up. Only a coin opens one."],
  ["narr", null, "You've invented the shopping cart."],
  ["say", "mash", "Drop it... and it's MINE.", "smug", M],
];
