// "In this town, every sorry makes you smaller" (In this town 01, Jonny's pick 19 Nov 2026, story 1 of 3).
// The spoken lines, in order: [key, who, line, tone, style (VoxCPM2 acting direction; null = the recipe's base + tone), { take, voice }]
// Voices (DECIDED, reversible): narrator = narrator-brisk (voice 1, +10 %); Spud = Chip's recipe read timid (Spud has no
// real voice yet); the big one = ryn (calm, cold, low); the baker = odin (Kokoro, jolly).
export const VOICE = { spud: "chip", big: "ryn", baker: "odin", driver: "wedge", N: "narrator-brisk" };
export const LINES = [
  ["s1", "spud", "Sorry!", "calm", "quick, polite, apologetic, a little startled"],
  ["n1", "N", "In this town, every sorry makes you smaller.", "calm", null],
  ["n2", "N", "And he says it forty times a day.", "calm", null],
  ["s2", "spud", "Sorry!", "calm", "quick, polite, apologetic, bright"],
  ["s3", "spud", "Oh, sorry.", "calm", "polite, apologetic, soft, to an object", { take: 2 }],
  ["n3", "N", "Say it too often, and you're gone.", "calm", null],
  ["n4", "N", "But some people never say it.", "calm", null],
  ["d1", "driver", "Oh! Sorry!", "calm", "startled, polite, apologetic, quick"],
  ["s4", "spud", "Excuse me, I was first...", "calm", "timid, polite, nervous, small voice"],
  ["s5", "spud", "...sorry.", "sad", "tiny, timid, giving up, quiet"],
  ["n5", "N", "That's the other half of the rule. Every sorry you say makes them bigger.", "calm", null],
  ["n5b", "N", "That's why he's so big. He has never said it once.", "calm", null],
  ["s6", "spud", "Ow! Sorry!", "sad", "pained, then apologetic, quick"],
  ["b1", "baker", "Next!", "happy", null],
  ["n6", "N", "One more sorry, and he's gone.", "calm", null],
  ["m1", "big", "You're in my way. Say sorry.", "angry", "low, cold, slow, threatening, looking down"],
  ["s7", "spud", "No.", "calm", "small but firm, quiet, brave"],
  ["m3", "big", "What did you say?", "angry", "low, cold, slow, disbelieving, leaning down"],
  ["s9", "spud", "I said no.", "calm", "small but firm, louder, brave, steady"],
  ["m2", "big", "Oh no! Sorry! Sorry! I'm so sorry!", "sad", "panicked, horrified, fast, apologising"],
  ["s10", "spud", "You're in my way.", "calm", "calm, polite, gentle, a small smile"],
  ["b2", "baker", "Oh! Good morning!", "happy", null],
  ["s8", "spud", "Sorry.", "calm", "automatic, polite, absent-minded"],
];
