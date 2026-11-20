// Potato Desk 12 "He nailed his trial like a job interview": the spoken lines, in order (story: STORY.md here; option 3 of
// /mnt/project-files/videos/potato-desk/11-court-day-new/OPTIONS-v2.md, Jonny 20 Nov 2026 18:02 Berlin "this one is also
// good", starred hook + ending). The judge only asks real court questions; the little one answers each like a job
// interview. No character names in any line. [who, line, tone, style (VoxCPM2 acting direction), { take }]
// Cast: vik = the judge, chip = the robber (tie, CV), wedge = his accomplice, the "team of two".
export const LINES = [
  ["vik", "You robbed a bank.", "angry", "deep, stern, flat, a judge reading the charge"],
  ["chip", "Thank you for having me!", "happy", "bright, polite, eager, a job applicant shaking hands", { voice: "chip-clean" }],
  ["vik", "Why this bank?", "calm", "deep, stern, slow, a judge"],
  ["chip", "I'm passionate about money.", "happy", "sincere, warm, rehearsed, a job interview answer", { voice: "chip-clean" }],
  ["vik", "Did you act alone?", "calm", "deep, stern, a judge"],
  ["chip", "I led a team of two.", "happy", "proud, confident, professional", { voice: "chip-clean" }],
  ["vik", "Where is the money?", "angry", "deep, stern, sharp"],
  ["chip", "I invested in myself.", "happy", "smooth, proud, straightening his tie", { voice: "chip-clean" }],
  ["vik", "Why were you still in the vault?", "calm", "deep, stern, tired, a judge"],
  ["chip", "Honestly? I work too hard.", "happy", "humble brag, modest, a little smile", { voice: "chip-clean" }],
  ["vik", "Ten years.", "calm", "deep, stern, flat, final"],
  ["chip", "Is that full time?", "happy", "hopeful, eager, bright, a job applicant", { voice: "chip-clean" }],
];
