// Country vs Country 01 "Paying at the supermarket: Germany vs America": the spoken lines, in order (outline 26 Nov 2026;
// hook H1 + ending E2 picked 14:43 Berlin, plus the producer's sighing retiree in the German line).
// [who, line, tone, style (VoxCPM2 acting direction), { voice, take }]. "you" situation: nobody says the hero's name.
// English only. Every voice is its recipe read 15 % faster (*-x115 in voices.json). spud = you in the German lane,
// spudus = you in the American lane (same character, two lanes).
const DE = "clipped, cold, efficient cashier, a slight German accent, never blinking";
const US = "slow, cheerful, chatty American bagger, all the time in the world";
const OLD = "old, grumpy, raspy, impatient";
export const LINES = [
  ["wedge", "Don't. Stop. Packing.", "calm", `${DE}, every word a command`, { voice: "wedge-x115" }],             // 0  hook: the rule as a command
  ["wedge", "Nobody survives this line.", "calm", `${DE}, flat, a threat`, { voice: "wedge-x115" }],             // 1  power words (extreme)
  ["spud", "Survives... WHAT?", "question", "panicked, a card in his teeth, arms full", { voice: "spud-x115" }],  // 2  the question (the gap)
  ["mash", "Paper or plastic?", "calm", `${US}, warm`, { voice: "mash-x115" }],                                    // 3  US lane
  ["mash", "For each grape?", "question", `${US}, holding one grape up, delighted`, { voice: "mash-x115" }],       // 4
  ["retiree", "Hhhhhhh.", "calm", `${OLD}, a long loud sigh through the nose`, { voice: "retiree-x115" }],         // 5  sigh 1
  ["wedge", "Faster.", "calm", `${DE}`, { voice: "wedge-x115" }],                                                   // 6  belt speeds up
  ["spud", "Not the eggs!", "excited", "desperate, catching", { voice: "spud-x115" }],                                   // 7
  ["mash", "So... how's your mom?", "calm", `${US}, leaning on the counter, genuinely curious`, { voice: "mash-x115" }],   // 8
  ["spudus", "Please. Just. Bag.", "calm", "tired, polite, through his teeth", { voice: "spud-x115" }],             // 9
  ["retiree", "Hhhhhhhhh. Too slow.", "calm", `${OLD}, sighing, tapping his watch`, { voice: "retiree-x115" }],    // 10 sigh 2
  ["retiree", "A card. Pah.", "calm", `${OLD}, disgusted, shaking his head`, { voice: "retiree-x115" }],           // 11 tease 1 (card)
  ["wedge", "Use your feet.", "calm", `${DE}, deadpan, scanner sparking`, { voice: "wedge-x115" }],               // 12 peak DE
  ["retiree", "TOO. SLOW.", "excited", `${OLD}, outraged`, { voice: "retiree-x115" }],                             // 13 sigh 3
  ["mash", "Need help to your car, hon?", "calm", `${US}, sweet, behind a mountain of bags`, { voice: "mash-x115" }],   // 14 peak US
  ["mash", "Is that... paper money?", "question", `${US}, amazed, as if it were a fossil`, { voice: "mash-x115" }],    // 15 tease 2 (cash)
  ["wedge", "Twelve forty.", "calm", `${DE}`, { voice: "wedge-x115" }],                                             // 16 totals
  ["mash", "Three hundred twelve forty!", "excited", `${US}, proud, beaming`, { voice: "mash-x115" }],             // 17
  ["wedge", "Cash. Only.", "calm", `${DE}, cold, staring at the card`, { voice: "wedge-x115" }],                  // 18 payoff DE
  ["mash", "Oh, hon... Card only.", "calm", `${US}, pitying, gentle`, { voice: "mash-x115" }],                      // 19 payoff US
  ["spud", "I just want to go home.", "calm", "small, defeated, arms full", { voice: "spud-x115" }],                // 20 low point
  ["retiree", "Move.", "calm", `${OLD}, pushing past`, { voice: "retiree-x115" }],                                  // 21 tag
  ["retiree", "One cent. Two cent. Three cent...", "calm", `${OLD}, very slow, counting coins one by one`, { voice: "retiree-x115" }],   // 22
  ["wedge", "Take your time.", "calm", "suddenly warm, smiling, patient, a slight German accent", { voice: "wedge-x115" }],             // 23 punchline, cut
  // added 26 Nov for length (real beats, the 80 s rule): used out of order in the generator, by index
  ["mash", "And grape number two!", "excited", `${US}, delighted, holding up the next grape`, { voice: "mash-x115" }],        // 24 US escalation
  ["spudus", "It's money.", "calm", "flat, tired, holding up the cash", { voice: "spud-x115" }],                            // 25 tease 2 answer
  ["mash", "Cute.", "calm", `${US}, pitying smile`, { voice: "mash-x115" }],                                                // 26
  ["wedge", "What. Is. This?", "calm", `${DE}, cold, staring at the card as if it were dirty`, { voice: "wedge-x115" }],     // 27 DE: before the payoff
];
