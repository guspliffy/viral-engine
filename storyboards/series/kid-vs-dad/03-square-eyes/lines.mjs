// Kid vs Dad 03 "Square eyes": the spoken lines of the four test OPENINGS (Jonny 25 Nov 2026 11:58 Berlin: "create all
// the openings ... id need to watch them to judge them"). Hooks v2: /mnt/project-files/videos/kid-vs-dad/03-parent-lies/OPTIONS.md.
// Every hook starts with a power word (Jonny 11:54). Label at 0 s on all four: "Too much TV gives you square eyes".
// Cast (stand-ins until the new dad is designed): rep = the war correspondent, spud = Tato (spud-kid), wedge = Dad (never
// named), mash = the square-eyed neighbour. [who, line, tone, style, { voice }]
const REP = { voice: "reaper" }, KID = { voice: "tato" }, DAD = { voice: "dad" }, MASH = { voice: "mash" };
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

// THE EPISODE (rough draft, opening H1 starred + ending E1 starred; Jonny 25 Nov 14:05 Berlin left for a few hours: "results
// which werent on hold because of some approvements"). Story: OPTIONS.md v3 outline, setting S2 breaking news. The rule pushed
// three times (8 pm ruler, 11 pm eye chart, 3 am torch), the reason it exists (the neighbour, 1998), Dad's three teases
// (never looks up, can't read his phone, low battery), the flip: Dad's eyes are phones. Clock on the wall = the counter.
export const EPISODE = [
  ...OPENINGS.h1,
  // 8 pm: hour nine, the ruler
  ["spud", "One more.", "calm", "flat, eyes glued to the TV, as the next episode starts", KID],
  ["rep", "Hour nine. Eye check.", "whisper", "a war correspondent under fire, whispering, crawling in", REP],
  ["rep", "Still round.", "whisper", "relieved, quick, a field report", REP],
  ["wedge", "Last warning.", "calm", "flat, bored, scrolling, not looking up", DAD],
  // 11 pm: hour twelve, the eye chart
  ["rep", "Hour twelve. Read the top line.", "calm", "tense, a doctor in a war zone", { ...REP, take: 2 }],
  ["spud", "E.", "calm", "flat, not taking his eyes off the TV", KID],
  ["rep", "Still... round.", "calm", "suspicious, slow, squinting at the kid", REP],
  ["wedge", "Who made the letters so small?", "calm", "annoyed, squinting at his phone, holding it closer", DAD],
  // why the rule exists
  ["wedge", "You want to end up like him?", "calm", "flat warning, thumb at the window, eyes on the phone", DAD],
  ["rep", "Sir. How long did you watch?", "question", "serious, an interview through the window", REP],
  ["mash", "One summer. Nineteen ninety-eight.", "calm", "slow, haunted, staring", MASH],
  ["rep", "And now?", "question", "quiet, afraid of the answer", REP],
  ["mash", "Now everything is widescreen.", "calm", "deadpan, slow", MASH],
  // 3 am: hour sixteen, the torch
  ["rep", "Hour sixteen. He's going for the whole season.", "excited", "urgent, out of breath, breaking news", REP],
  ["rep", "Still... round?", "question", "baffled, shining a torch in the kid's eyes", REP],
  ["wedge", "Five more minutes.", "calm", "mumbling, half asleep, scrolling", DAD],
  // the flip
  ["spud", "No.", "calm", "flat, to the TV", KID],
  ["spud", "See? Still round.", "calm", "proud, smug, turning to his dad", KID],
  ["spud", "Screens.", "calm", "flat, dry, a seven-year-old's verdict, a clear S at the start", { ...KID, take: 2 }],
];
