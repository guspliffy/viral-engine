// Country vs Country 02 "Waiting at a red light: Germany vs America": the spoken lines, in order (outline v1 27 Nov 2026;
// hook H1 + ending E1 picked 21:46 Berlin). [who, line, tone, style (VoxCPM2 acting direction), { voice }].
// "you" situation: nobody says the hero's name. English only. Every voice is its recipe read 15 % faster (*-x115).
// spud = you on the German street, spudus = you on the American street (same character, two lanes).
// Gap: WHO is watching you on an empty street? Teases: binoculars (line 14), every curtain (line 19); answer: line 25.
const OLD = "old, grumpy, raspy, outraged German pensioner leaning out of a window";
const DE = "clipped, cold, efficient German bus driver, a slight German accent, never blinking";
const US = "slow, cheerful, chatty American, all the time in the world";
export const LINES = [
  ["retiree", "DON'T. You. DARE.", "excited", `${OLD}, every word a command`, { voice: "retiree-x115" }],          // 0  hook: power word + the rule as a command
  ["spud", "Who's even WATCHING?!", "question", "startled, one foot in the air, looking around an empty street", { voice: "spud-x115" }], // 1 the question (the gap)
  ["retiree", "Red means STAND. Forever.", "calm", `${OLD}, deadly serious`, { voice: "retiree-x115" }],          // 2  rule + extreme word
  ["wedge", "Bus leaves in one minute.", "calm", `${DE}, flat`, { voice: "wedge-x115" }],                         // 3  stake + clock
  ["spudus", "Come on... come on.", "calm", "impatient, pressing a crosswalk button", { voice: "spud-x115" }],     // 4  US lane, same bus
  ["mash", "Right on red, hon!", "excited", `${US}, waving from a pickup truck window as he turns`, { voice: "mash-x115" }], // 5 right on red
  ["retiree", "Think. Of. The children.", "calm", `${OLD}, slow, a lecture`, { voice: "retiree-x115" }],            // 6
  ["spud", "There ARE no children!", "excited", "arms spread at the empty street", { voice: "spud-x115" }],          // 7  then the tot appears and stares
  ["spud", "...Where did YOU come from?", "question", "small, staring down at a tiny child", { voice: "spud-x115" }], // 8
  ["chip", "Morning!", "excited", "relaxed, mouth full of burger, strolling across the road", { voice: "chip-x115", take: 2 }], // 9  US jaywalker
  ["spudus", "It's RED!", "excited", "shocked, pointing at the light", { voice: "spud-x115" }],                     // 10
  ["chip", "It's a suggestion.", "calm", "shrugging, chewing", { voice: "chip-x115" }],                               // 11
  ["wedge", "Thirty seconds.", "calm", `${DE}, tapping his watch`, { voice: "wedge-x115" }],                         // 12 clock
  ["spud", "Okay. Nobody's looking...", "calm", "whispering, leaning over the kerb", { voice: "spud-x115" }],        // 13
  ["retiree", "I SEE you.", "calm", `${OLD}, low, from behind binoculars`, { voice: "retiree-x115" }],                // 14 tease 1: binoculars glint
  ["spudus", "Come ON!", "excited", "hammering a crosswalk button with both fists", { voice: "spud-x115" }],          // 15
  ["button", "Wait.", "calm", "flat robotic crosswalk speaker", { voice: "button" }],                                   // 16 the button finally talks
  ["spudus", "I AM waiting!", "excited", "yelling at the button", { voice: "spud-x115" }],                            // 17
  ["button", "Wait.", "calm", "flat robotic crosswalk speaker", { voice: "button" }],                                   // 18 (answer: the button does nothing)
  ["retiree", "Five. Euros.", "calm", `${OLD}, holding up five fingers`, { voice: "retiree-x115" }],                  // 19 tease 2: every curtain twitches as the toe slides off
  ["mash", "Go ahead, hon!", "calm", `${US}, stopping the truck, waving him across`, { voice: "mash-x115" }],          // 20 US: you just walk
  ["spudus", "...Huh. Made it.", "calm", "surprised, stepping onto the bus", { voice: "spud-x115" }],                  // 21 US resolves
  ["wedge", "Ten seconds.", "calm", `${DE}`, { voice: "wedge-x115" }],                                                 // 22 clock
  ["spud", "Come on, come on, come on...", "calm", "whispering, foot hovering, staring at the red man", { voice: "spud-x115" }], // 23
  ["wedge", "Too late.", "calm", `${DE}, doors hiss shut as the light turns green`, { voice: "wedge-x115" }],         // 24 green + the bus leaves
  ["retiree", "Good.", "calm", `${OLD}, suddenly proud, slow-clapping with the whole street`, { voice: "retiree-x115" }], // 25 punchline: everyone was watching, cut
];
