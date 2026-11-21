// The narrator lines of fact what-if 03 "Earth spins faster" (Jonny 21 Nov 2026, thread "Make Earth spins faster
// what-if"). Facts + sources: STORY.md. The spin chip is s = 2 + 0.3 t (written "2.0x", ticks every second, his pick 1+3).
// [start s, spoken text, caption]. Every number said matches the chip at that moment (weight lost = 0.35 % x s^2).
export const NARRATOR = "narrator-quick";   // voice 1 "deep storyteller", 15 % faster (as gravity)
export const SPIN = (t) => 2 + 0.3 * t;
export const END = 77.5;   // cut on the punchline
export const LINES = [
  [0.1, "Every second, Earth spins faster. In one minute, it rips itself apart.", "Every second, Earth spins faster. In one minute, it rips itself apart."],
  [5.2, "The oceans run to the equator. Everything low drowns.", "The oceans run to the equator. Everything low drowns."],
  [9.0, "Satellites drift out of place.", "Satellites drift out of place."],
  [11.6, "Storms spin faster, and hit harder.", "Storms spin faster, and hit harder."],
  [15.0, "A day lasts under four hours.", "A day lasts under four hours."],
  [19.2, "You're getting lighter.", "You're getting lighter."],
  [26.8, "A third of your weight, gone.", "A third of your weight, gone."],
  [33.4, "Half your weight. Best day ever?", "Half your weight. Best day ever?"],
  [38.0, "Every step is a jump now.", "Every step is a jump now."],
  [45.0, "Lighter than on the Moon.", "Lighter than on the Moon."],
  [47.4, "Hold on.", "Hold on."],
  [50.0, "You weigh nothing. Neither does the ocean.", "You weigh nothing. Neither does the ocean."],
  [55.2, "Higher than the clouds.", "Higher than the clouds."],
  [60.0, "The oceans and the air fly into space.", "The oceans and the air fly into space."],
  [66.0, "The ground cracks. The poles squash flat.", "The ground cracks. The poles squash flat."],
  [73.3, "Good news: the flat-earthers were right.", "Good news: the flat-earthers were right."],
];
