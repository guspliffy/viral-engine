// Kid vs Dad 03 "Square eyes": the spoken lines of the four test OPENINGS (Jonny 25 Nov 2026 11:58 Berlin: "create all
// the openings ... id need to watch them to judge them"). Hooks v2: /mnt/project-files/videos/kid-vs-dad/03-parent-lies/OPTIONS.md.
// Every hook starts with a power word (Jonny 11:54). Label at 0 s on all four: "Too much TV gives you square eyes".
// Cast (stand-ins until the new dad is designed): rep = the war correspondent, spud = Tato (spud-kid), wedge = Dad (never
// named), mash = the square-eyed neighbour. [who, line, tone, style, { voice }]
const REP = { voice: "reaper" }, KID = { voice: "chip-clean" }, DAD = {}, MASH = { voice: "mash" };
const RULE = [
  ["rep", "We're live. Tato, age seven, has watched TV for nine hours.", "calm", "grave, low, a correspondent under cover", REP],
  ["rep", "And in this house, there is one rule: one more hour... and your eyes go square.", "calm", "slow, ominous, a pause before the last words", REP],
];
export const OPENINGS = {
  h1: [ // proof first: extreme close-up of the neighbour's square eyes, blinking
    ["rep", "Warning. This man watched too much TV.", "calm", "deadly serious, low, a warning", REP],
    ["wedge", "One more hour, and that's you.", "calm", "flat, pointing, eyes still on his phone", DAD],
    ["spud", "Square forever? Is it true?", "whisper", "scared, small, staring at the neighbour", KID],
    ...RULE,
  ],
  h2: [ // breaking news
    ["rep", "Breaking. Square eyes are spreading.", "excited", "urgent breaking news, out of breath", REP],
    ["rep", "Is this kid next?", "question", "low, suspicious, mic pushed toward the window", REP],
    ...RULE,
  ],
  h3: [ // the lie
    ["rep", "Lies. Your parents lied to you... or did they?", "calm", "straight to camera, slow, a twist on the last words", REP],
    ...RULE,
  ],
  h4: [ // countdown
    ["wedge", "Danger. One more hour, and your eyes go square. Forever.", "calm", "a stern dad warning, not looking up from his phone", DAD],
    ["spud", "Is it true?", "whisper", "small, worried, eyes still on the TV", KID],
    RULE[0],
  ],
};
