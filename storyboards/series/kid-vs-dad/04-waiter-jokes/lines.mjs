// Kid vs Dad 04 "Dad jokes at the waiter": the spoken lines, in order. Outline (Jonny 25 Nov 2026 12:34 Berlin: hook H1 +
// ending E1, panel sheet OK 13:00): ./OUTLINE.md, sheet ./sheets/kid-vs-dad-04-panels-v1.png. Video 2 of the 8-line trial.
// Cast: rep = the war correspondent (ep 1), spud = the kid (spoken name TATO, the only name said), dad = Dad B (never named),
// mash = the waiter. Counter: Tato sinks lower in his chair after each joke (3 jokes), under the table at the end.
// [who, line, tone, style (VoxCPM2 acting direction), { voice, take }]
// Voices: kid = recipe "tato" (Jonny pick kid-4-flat, on branch kid-vs-dad-03-square-eyes), dad = recipe "dad" (Jonny pick 13:20 Berlin, same branch).
const REP = { voice: "reaper" }, KID = { voice: "tato" }, DAD = { voice: "dad" }, MASH = { voice: "mash" };
export const LINES = [
  // 0-5 s HOOK (power word, question)
  ["rep", "Danger. A dad is about to order.", "calm", "grave whisper, a war correspondent hiding behind a menu", REP],
  ["rep", "Will the waiter survive?", "question", "low, tense, slow", REP],
  // 5-12 s NAME + RULE
  ["rep", "We're live. Tato, age seven, is hungry.", "calm", "grave, low, under cover", REP],
  ["rep", "And at this table, there is one rule.", "calm", "slow, ominous, leaning in", REP],
  ["rep", "No jokes at the waiter.", "calm", "deadly serious, each word apart", REP],
  ["spud", "Dad. Please. Just order.", "sad", "small, pleading, hands pressed together", KID],
  ["dad", "Relax. I'm always normal.", "calm", "warm, far too confident", DAD],
  // 12-24 s JOKE 1
  ["mash", "Hi. Can I take your order?", "happy", "polite, nervous, a young waiter", MASH],
  ["dad", "Sure. Where are you taking it?", "happy", "delighted with himself, a classic dad joke, beaming", DAD],
  ["rep", "First joke. The waiter is still standing.", "calm", "tense, quiet, a reporter at the front line", REP],
  // 24-36 s JOKE 2
  ["mash", "Sorry for the wait.", "sad", "apologetic, a little shaky, bowing", MASH],
  ["dad", "That's okay. I've been working out.", "happy", "proud, patting his belly, pause before the punchline", DAD],
  ["spud", "Dad...", "sad", "muffled, embarrassed, sinking under the table", KID],
  ["rep", "He's sinking. Tato is sinking.", "sad", "urgent whisper, breaking news", REP],
  // 36-46 s WHY THE RULE EXISTS
  ["rep", "Wait. What's on that wall?", "question", "suspicious, slow", REP],
  ["rep", "He's been here before.", "sad", "horrified whisper", REP],
  // 46-62 s JOKE 3 (extreme)
  ["mash", "And... how would you like your steak?", "sad", "very careful, holding the notepad like a shield", MASH],
  ["dad", "Like my jokes.", "happy", "standing up, grand, a showman, slow", DAD],
  ["dad", "Well done.", "happy", "triumphant, the big finish", DAD],
  ["rep", "Man down! Man down!", "excited", "shouting, war chaos", REP],
  // 62-80 s END: the bill, cut on the punchline
  ["dad", "Tip... stop.", "sad", "reading the bill, slow, deflated, the smile gone", DAD],
];
