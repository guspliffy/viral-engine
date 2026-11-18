// Potato Desk 01 "Reaper's Help Desk": the spoken lines, in order (BRIEF.md episode 1, Jonny's go 17 Nov 2026).
// [who, line, tone, style (VoxCPM2 acting direction; null = the recipe's base + tone), { take }]
export const LINES = [
  ["chip", "Hi. I died three times today, and I'd like to speak to a manager.", "angry", "bright, fast, indignant, demanding"],
  ["rea", "I am the manager.", "calm", "flat, dry, deadpan, slow"],
  ["chip", "Then I'd like to speak to YOUR manager.", "angry", "bright, fast, indignant, smug", { take: 2 }],
  ["rea", "He's... busy.", "calm", "flat, dry, deadpan, slow, a little uneasy"],
  ["chip", "The first time, I slipped on a fry.", "calm", "bright, fast, complaining"],
  ["rea", "Slipped... on... fry.", "calm", "flat, slow, reading aloud while typing"],
  ["chip", "The second time, the same fry.", "calm", "bright, fast, complaining"],
  ["rea", "You didn't pick it up?", "calm", "flat, dry, deadpan, slow"],
  ["chip", "I was DEAD!", "angry", "outraged, loud, voice cracking"],
  ["rea", "And the third?", "calm", "flat, dry, deadpan, slow"],
  ["chip", "I went back for the fry.", "sad", "quiet, embarrassed, sheepish"],
  ["rea", "Okay. I can offer you Premium Afterlife. Nine ninety-nine a month. No fries.", "calm", "flat, bored salesman, slow"],
  ["chip", "Is there a free version?", "calm", "hopeful, small, bright"],
  ["rea", "Yes.", "calm", "flat, dry, deadpan"],
  ["rea", "Your waiting time is four hundred years. Please hold.", "calm", "flat, dry, deadpan, slow, bored"],
  ["rea", "NEXT.", "angry", "flat, loud, bored"],
];
