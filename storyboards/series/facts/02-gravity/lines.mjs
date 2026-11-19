// The narrator lines of fact what-if 02 "What if gravity got stronger every five seconds?" (Jonny 19 Nov 2026, thread
// "Make gravity what-if fact video"): one line per gravity step, each starting 0.1 s after its step. Facts + sources:
// STORY.md. Step times: 2 g at 1.0 s, then one step every 5 s (3, 4, 5, then 10 ... 50 g), black 65.5, 1 g 66.5.
export const NARRATOR = "narrator-quick";   // voice 1 "deep storyteller", 15 % faster (Mona Lisa, 19 Nov)
export const TAKES = {};
export const STEPS = [[0, 1], [1.0, 2], [6.0, 3], [11.0, 4], [16.0, 5], [21.0, 10], [26.0, 15], [31.0, 20], [36.0, 25], [41.0, 30], [46.0, 35], [51.0, 40], [56.0, 45], [61.0, 50], [66.5, 1]];
export const LINES = [
  [0.1, "Every five seconds, gravity gets stronger. In twenty, you black out."],
  [6.1, "Three g. A rocket launch. Astronauts lie down for this."],
  [11.1, "Four g. Blood leaves your head. Your eyes go grey."],
  [16.1, "Five g. Pilots need special suits for this. You don't."],
  [21.1, "Ten g. Lying flat, blood reaches your head again."],
  [26.1, "Fifteen. Buildings hold about twice their weight. Not fifteen times."],
  [31.1, "Twenty. The air gets squeezed down. Clouds sink to the street."],
  [36.1, "Twenty-five. No human survives this. Good thing you're a potato."],
  [41.1, "Thirty. Every satellite is too slow now. They all fall."],
  [46.1, "Thirty-five. Air this thick turns oxygen into poison."],
  [51.1, "Forty. Mountains crush under their own weight."],
  [56.1, "Forty-five. Even the Moon is falling."],
  [61.1, "Fifty. It hits in seventeen hours."],
  [66.6, "Back to one g."],
];
