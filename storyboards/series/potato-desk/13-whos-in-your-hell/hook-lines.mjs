// Potato Desk 13 "Who's in your hell?": the HOOK OPTIONS' spoken lines (Jonny 25 Nov 2026: hook options as short clips
// to watch, not on paper). [who, line, tone, style, { voice }]. No names in any line (Jonny 25 Nov: no "Tato" here).
// Every voice is the character's recipe read 20 % faster (*-x12 in voices.json; Jonny 25 Nov). The Devil reads in
// the gunslinger's voice, the stand-in since Potato Desk 09.
const HOST = "bright, quick, warm game-show host, always smiling";
export const HOOK_LINES = {
  welcome: ["devil", "Welcome to HELL.", "excited", `${HOST}, grand, arms wide`, { voice: "devil-x12" }],
  who: ["spud", "Who's in my hell?", "question", "nervous, worried, quick", { voice: "spud-x12" }],
  whoLoud: ["spud", "Who's in my HELL?", "excited", "panicked, high, quick", { voice: "spud-x12" }],
  whoMine: ["spud", "Who's in mine?", "question", "nervous, small, worried", { voice: "spud-x12" }],
  rule: ["devil", "One rule. Forever... with everyone who ever annoyed you.", "calm", `${HOST}, delighted, savouring it`, { voice: "devil-x12" }],
  ruleOpen: ["devil", "In hell, there's one rule.", "calm", `${HOST}, grand, savouring it`, { voice: "devil-x12" }],
  ruleForever: ["devil", "Forever... with everyone who ever annoyed you.", "calm", `${HOST}, delighted`, { voice: "devil-x12" }],
  everyone: ["devil", "Everyone who ever annoyed you. Forever.", "calm", `${HOST}, delighted, pointing at the seats`, { voice: "devil-x12" }],
  spoil: ["mash", "He dies at the end.", "calm", "smug, casual, chewing", { voice: "mash-x12" }],
  stop: ["spud", "STOP!", "excited", "screaming, desperate", { voice: "spud-x12" }],
};
