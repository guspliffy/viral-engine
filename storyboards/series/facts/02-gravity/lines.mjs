// The narrator lines of fact what-if 02 "What if gravity got stronger every five seconds?" (Jonny 19 Nov 2026, thread
// "Make gravity what-if fact video"; v2 20 Nov: 1-5 g go faster, every 2.5 s, then 5 g steps every 5 s; the hook keeps "every five seconds", Jonny: "every few is too undistinguished" and the clip skips time later anyway; the Moon hits).
// Facts + sources: STORY.md. [start s, spoken text, caption]: the narrator says "gee" (Jonny 20 Nov: "g" came out
// different from time to time), the caption writes "g".
export const NARRATOR = "narrator-quick";   // voice 1 "deep storyteller", 15 % faster (Mona Lisa, 19 Nov)
export const TAKES = { "Every five seconds, gravity gets stronger. At fifty, the Moon falls.": 2 };   // take 2: 4.6 s (take 1 paused 5.7 s)
export const STEPS = [[0, 1], [0.2, 2], [3.5, 3], [6.0, 4], [8.5, 5], [13.0, 10], [18.0, 15], [23.0, 20], [28.0, 25], [33.0, 30], [38.0, 35], [43.0, 40], [48.0, 45], [53.0, 50], [60.5, null], [61.5, 1]];
export const LINES = [
  [0.1, "Every five seconds, gravity gets stronger. At fifty, the Moon falls.", "Every five seconds, gravity gets stronger. At fifty, the Moon falls."],   // Jonny 20 Nov 21:12: the Moon promise replaces "In ten, you black out."
  [4.6, "Three gee.", "Three g."],   // Jonny 20 Nov 15:31: the 3 g step had no voice (a 2 s silent hold)
  [6.1, "Four gee. Your eyes go grey.", "Four g. Your eyes go grey."],
  [8.75, "Five gee. Most people black out here.", "Five g. Most people black out here."],
  [13.1, "Ten gee. Lying flat, your blood comes back.", "Ten g. Lying flat, your blood comes back."],
  [18.1, "Fifteen. Buildings only hold about twice their weight.", "Fifteen. Buildings only hold about twice their weight."],
  [23.1, "Twenty. The whole city comes down.", "Twenty. The whole city comes down."],
  [28.1, "Twenty-five. No human survives this. Good thing you're a potato.", "Twenty-five. No human survives this. Good thing you're a potato."],
  [33.1, "Thirty. Every satellite falls out of the sky.", "Thirty. Every satellite falls out of the sky."],
  [38.1, "Thirty-five. The air itself turns poisonous.", "Thirty-five. The air itself turns poisonous."],
  [43.1, "Forty. Mountains crush under their own weight.", "Forty. Mountains crush under their own weight."],
  [48.1, "Forty-five. Even the Moon is falling.", "Forty-five. Even the Moon is falling."],
  [53.1, "Fifty. Seventeen hours later, it hits.", "Fifty. Seventeen hours later, it hits."],
  [61.6, "Back to one gee.", "Back to one g."],
];
