// Rival duel 01 "Armrest war": the spoken lines, in order. Outline v1: /mnt/project-files/videos/rival-duel/01-armrest-war/OUTLINE.md
// (Jonny 26 Nov 2026: idea "armrest war" 14:40, hook H1 + ending E3 + Wedge as the stranger 14:45 Berlin). A YOU situation: Spud plays
// you and nobody says a name (feedback 26 Nov). The rule lands as a command, never announced. Repeated gag: "Too. Dangerous."
// Cast: spud = you (window seat A), wedge = the stranger (aisle seat B, secretly the captain), att = the flight attendant (Mash body).
// [who, line, tone, style (VoxCPM2 acting direction), { voice, take }]
// Voices: x1.15 recipes (Jonny 25 Nov "voices 15% faster"); mash already carries tempo 1.44; the last two lines are Wedge over the cabin speaker.
const YOU = { voice: "spud-x115" }, WEDGE = { voice: "wedge-x115" }, ATT = { voice: "mash" }, PA = { voice: "wedge-pa" };
export const LINES = [
  // 0-8 s HOOK: the rule as a command, the question, the conflict
  ["att", "Never. Touch. The red button.", "whisper", "deadly serious whisper, slow, leaning in close", ATT],
  ["spud", "What does it do?", "question", "nervous, curious, a little scared", YOU],
  ["att", "Nobody who pressed it... came back.", "whisper", "mysterious whisper, a pause before came back", ATT],
  ["wedge", "Mine.", "calm", "smug, slow, sliding his arm over, eyes half closed", WEDGE],
  ["spud", "That armrest is MINE.", "angry", "offended, through his teeth", YOU],
  // ROUND 1: elbow
  ["spud", "Hnnngh!", "angry", "straining, pushing", YOU],
  ["att", "Too. Dangerous.", "whisper", "deadpan, flat, appearing out of nowhere", ATT],
  // ROUND 2: both elbows + chin; plant 1 (the pilot hat in his bag)
  ["spud", "Both elbows.", "happy", "smug, victorious", YOU],
  ["wedge", "Both elbows. And chin.", "calm", "calm, smug, chin coming down", WEDGE],
  ["wedge", "I fly a lot.", "calm", "relaxed, knowing", WEDGE],
  // ROUND 3: butter
  ["spud", "Oops.", "happy", "fake innocent, sly", YOU],
  ["wedge", "Whoa, whoa, whoa!", "scared", "slipping, panicking", WEDGE],
  ["att", "Too. Dangerous.", "whisper", "deadpan, flat, right in their faces", ATT],
  // ROUND 4: the fake third arm; plant 2
  ["wedge", "I know this plane better than you.", "calm", "smug, slow, pulling on a sleep mask", WEDGE],
  ["wedge", "Zzz.", "calm", "asleep", WEDGE],
  // ROUND 5: the crowbar
  ["spud", "Not on my flight.", "angry", "low, dramatic, an action hero", YOU],
  ["wedge", "Hey! Hnnngh!", "angry", "waking up, pulling back hard", WEDGE],
  ["att", "Too. DANGEROUS!", "scared", "finally losing her calm, loud", { ...ATT, take: 2 }],
  // TURN: you press it
  ["spud", "Nobody comes back, huh?", "calm", "quiet, cold, a decision made", YOU],
  ["spud", "...Mine.", "happy", "blissful sigh, eyes closed", YOU],
  // END: the captain over the speaker; cut on the punchline
  ["wedge", "Ladies and gentlemen... this is your captain.", "calm", "cabin announcement, calm, wind roaring behind him", PA],
  ["wedge", "I was in seat 14B.", "calm", "flat, a beat of silence before it", PA],
];
