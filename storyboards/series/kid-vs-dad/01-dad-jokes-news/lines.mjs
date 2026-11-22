// Kid vs Dad 01 "BREAKING: Dad has told 4,000 dad jokes": the spoken lines, in order. Outline v1:
// /mnt/project-files/videos/kid-vs-dad/01-dad-jokes-news/OUTLINE.md (Jonny 22 Nov 2026: pilot P1, hook H1, ending E1,
// new war-correspondent reporter, 70-90 s; "go for it" 09:15 Berlin). No character names in any line.
// Cast: rep = the war correspondent (new), chip = the kid, wedge = the dad, spud = the neighbour with the snare drum.
// Every "I'm X" said near the dad is a trap he can't resist; his jokes are delivered big (style says so).
// [who, line, tone, style (VoxCPM2 acting direction), { voice, take }]
const REP = { voice: "reaper" }, KID = { voice: "chip-clean" };
export const LINES = [
  // 0-12 s HOOK
  ["rep", "We're live. Sir, are you okay?", "calm", "dry, grave, a war correspondent under fire, low voice", REP],
  ["wedge", "No. I'm Dad.", "happy", "big, warm, proud, a showman landing his best line, slow", {}],
  ["rep", "It's worse than we feared.", "sad", "grave, quiet, haunted, straight into the camera", REP],
  ["chip", "Every. Single. Day.", "sad", "exhausted, flat, a survivor wrapped in a blanket", KID],
  // 12-25 s THE RULE
  ["rep", "How are you holding up, son?", "calm", "gentle, careful, a reporter talking to a survivor", REP],
  ["chip", "I'm tired.", "sad", "small, flat, worn out", KID],
  ["wedge", "Hi Tired. I'm Dad.", "happy", "huge, theatrical, arms wide, the biggest stage voice", {}],
  ["rep", "Sir. We are live. No more jokes.", "angry", "firm, clipped, an order, controlled anger", REP],
  ["wedge", "Fine.", "calm", "short, sulky, trying to look innocent", {}],
  ["rep", "Son, how long has this been going on?", "question", "soft, grave, a reporter asking a survivor", REP],
  ["chip", "Since I was born.", "sad", "flat, tired, matter of fact", KID],
  ["rep", "I'm...", "calm", "starting a sentence, then stopping dead, realising the danger", REP],
  ["rep", "We are sorry to hear that.", "calm", "careful, slow, choosing every word, relieved", REP],
  // 25-40 s TURN 1: THE JAR
  ["chip", "This is the jar. One euro per joke.", "calm", "flat, explaining, holding up evidence", KID],
  ["chip", "He paid for my bike.", "calm", "deadpan, a little proud", KID],
  ["rep", "So the jar stops him?", "question", "hopeful, dry", REP],
  ["chip", "No. He pays in advance.", "sad", "flat, defeated, deadpan", KID],
  ["wedge", "I'm reading a book about anti-gravity.", "happy", "slow, dramatic, savouring every word, building up", {}],
  ["wedge", "I can't put it down.", "happy", "triumphant, huge, the punchline of his life", {}],
  // 40-52 s TURN 2: WHO PLAYS THE DRUM
  ["rep", "Where is that drum coming from?!", "angry", "sharp, alarmed, spinning round", REP],
  ["spud", "He pays me too.", "sad", "quiet, guilty, ashamed, mumbled", {}],
  ["rep", "Who are you?", "question", "suspicious, sharp", REP],
  ["spud", "I'm the neighbour.", "calm", "plain, tired, then realising too late", {}],
  ["wedge", "Hi Neighbour. I'm Dad.", "happy", "fast, delighted, pouncing", { take: 1 }],
  // 52-66 s TURN 3: THE REPORTER CRACKS
  ["rep", "Studio, it's too dangerous here.", "sad", "urgent, low, losing control, to the camera", REP],
  ["rep", "Somebody call me a taxi.", "sad", "desperate, pleading", REP],
  ["wedge", "Okay. You're a taxi.", "happy", "gentle, helpful, enormously pleased", {}],
  ["rep", "I'm leaving!", "angry", "loud, cracking", REP],
  ["wedge", "Hi Leaving!", "excited", "quick, bright, instant", { take: 1 }],
  ["rep", "I'm serious!", "angry", "louder, desperate", REP],
  ["wedge", "Hi Serious!", "excited", "quick, bright, instant", {}],
  ["rep", "I've covered wars.", "sad", "quiet, broken, staring into nothing", REP],
  ["rep", "Nothing like this.", "sad", "barely a whisper, haunted", REP],
  // 66-80 s ENDING (E1)
  ["chip", "Dad. Just say sorry.", "calm", "serious, firm, grown up, quiet", KID],
  ["wedge", "Okay... I'm sorry.", "sad", "sincere, soft, no joke, real", {}],
  ["chip", "Hi Sorry, I'm...", "calm", "automatic, cheerful, then stopping in horror", KID],
  ["wedge", "My boy.", "sad", "teary, proud, whispered, deeply moved", {}],
];
