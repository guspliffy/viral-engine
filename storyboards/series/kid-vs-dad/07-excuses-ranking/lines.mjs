// Kid vs Dad 07 "Ranking Dad's excuses": the spoken lines, in order. Jonny 26 Nov 2026 21:05 Berlin picked hook H2 + ending E1
// (/mnt/project-files/videos/kid-vs-dad/07-excuses-ranking/OPTIONS.md; ranking R1 = trophies, starred, no rank text burned in).
// Cast: spud = Tato (spud-kid, the only name said), dad = Dad B (never named), mom = off screen, voice only (never shown).
// Rule told by the story (Dad): "Nothing in the world gets me off this sofa." Stake: the park closes at eight (wall clock).
// Natural counter: the trophy row on the rug fills 5 -> 2, smallest to big, the giant cup waits beside Tato for number one.
// Twist hidden + teased: a faint ice cream jingle at "five more minutes" (Dad's eye cracks open), his hand on his back at 4 and 2.
// Voices: tato + dad + mom at tempo 1.15 in voices.json (Jonny 25 Nov: 15 % faster for new videos).
// [who, line, tone, style (VoxCPM2 acting direction), { voice }]
const KID = { voice: "tato" }, DAD = { voice: "dad" }, MOM = { voice: "mom" };
export const LINES = [
  // 0-6 s HOOK H2 (power word "worst ... in the world"), the name, entry 5
  ["spud", "My dad has the worst excuses in the world. I ranked them.", "whisper", "a seven-year-old whispering to the camera, deadpan, like a nature documentary", KID],
  ["dad", "Tato. I'm not asleep. I'm resting my eyes.", "calm", "eyes shut, slurred, half asleep on the sofa", DAD],
  ["spud", "Number five.", "calm", "flat, dry, a judge giving a score", KID],
  // 6-14 s STAKE + RULE told by Dad
  ["spud", "Dad. The park closes at eight.", "calm", "flat, patient, standing in front of the sofa", KID],
  ["dad", "Nothing in the world gets me off this sofa.", "calm", "dead certain, proud, eyes still shut", DAD],
  ["spud", "Challenge accepted.", "whisper", "to the camera, narrowed eyes, determined", KID],
  // 14-26 s ENTRY 4: the bribe, escalated twice
  ["spud", "I'll clean my room.", "calm", "bargaining, hopeful", KID],
  ["dad", "We'll see.", "calm", "lazy, not listening", DAD],
  ["spud", "I'll clean your room.", "calm", "bigger offer, a bit desperate", KID],
  ["dad", "We'll see.", "calm", "the same lazy tone, rubbing his back", DAD],
  ["spud", "I'll clean the whole house.", "calm", "biggest offer yet, desperate, both hands out", KID],
  ["dad", "We'll see.", "calm", "lazy, not listening, the exact same", DAD],
  ["spud", "We'll see means no. Number four.", "calm", "to the camera, flat, unimpressed", KID],
  // 26-40 s ENTRY 3: the clock (six, seven, quarter to eight); tease 1 = a faint ice cream jingle, Dad's eye opens a crack
  ["spud", "Dad. It's six.", "calm", "flat, pointing at the clock", KID],
  ["dad", "Five more minutes.", "calm", "eyes on the TV, mumbling", DAD],
  ["spud", "It's seven.", "calm", "flatter, a little louder", KID],
  ["dad", "Five more minutes.", "calm", "eyes on the TV, mumbling, the exact same", DAD],
  ["spud", "Dad. The TV is off.", "calm", "flat, holding the remote, the screen just went black", KID],
  ["dad", "Five more minutes.", "calm", "eyes on the TV, mumbling, the exact same", DAD],
  ["spud", "His minutes are an hour long. Number three.", "calm", "to the camera, deadpan", KID],
  // 40-54 s ENTRY 2: around him (ask your mother), the ping-pong = the break in the ladder
  ["spud", "Can I go alone?", "question", "small, hopeful", KID],
  ["dad", "Ask your mother.", "calm", "eyes shut, waving it away", DAD],
  ["mom", "Ask your father!", "excited", "a mom shouting from the kitchen, off screen, busy", MOM],
  ["dad", "Ask your mother!", "excited", "louder, shouting back over his shoulder", DAD],
  ["mom", "Ask your father!", "excited", "louder still, from the kitchen, fed up", MOM],
  ["spud", "Number two.", "calm", "flat, head still turning back and forth", KID],
  // 54-66 s ENTRY 1: the second loop (the worst one), the last chance, "My back."
  ["spud", "And number one... the worst one.", "whisper", "to the camera, slow, a big reveal, hand on the giant cup", KID],
  ["spud", "Dad. Quarter to eight. Last chance.", "calm", "serious, quiet, holding his breath", KID],
  ["dad", "I can't, buddy. My back.", "sad", "groaning, holding his lower back, very sorry for himself", DAD],
  // 66-72 s END E1: the ice cream jingle, Dad springs up and bolts out, Tato alone with the giant cup. CUT.
  ["dad", "Ice cream!", "excited", "suddenly wide awake, shouting with joy, already running", DAD],
  ["spud", "...Number one.", "calm", "alone, deadpan, to the camera, not surprised at all", KID],
];
