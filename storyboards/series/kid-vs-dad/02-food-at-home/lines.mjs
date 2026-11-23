// Kid vs Dad 02 "We have food at home": the spoken lines, in order. Outline v2:
// /mnt/project-files/videos/kid-vs-dad/02-food-at-home/OUTLINE.md (Jonny 22 Nov 2026: hook H1 + ending E1 22:32 Berlin,
// story spine "scene + name + weird rule -> stakes -> hide/tease the twist -> ending" 22:48-22:53, panel sheet OK 23:11).
// Cast: rep = the war correspondent (ep 1), spud = the kid (the main character, spoken name TATO, the only name said),
// wedge = the dad (never named), chip = the helmeted correspondent at the house, mash = the drive-thru speaker + window.
// Tally: the kid draws one mark on the fogged window after each "We have food at home" from the dad (4 in all).
// [who, line, tone, style (VoxCPM2 acting direction), { voice, take }]
// Voices: the kid keeps ep 1's kid voice ("chip-clean") so the series sounds the same; Chip at the house = "phoenix" (lively, bright; the kid already has the chip voice). Proposals until Jonny hears them.
const REP = { voice: "reaper" }, KID = { voice: "chip-clean" }, DAD = {}, HOUSE = { voice: "phoenix" }, MASH = { voice: "mash" };
export const LINES = [
  // 0-3 s SCENE: the trigger line first
  ["spud", "Dad, can we get burgers?", "question", "hopeful, bright, a little kid in the back seat, pointing", KID],
  ["wedge", "We have food at home.", "calm", "flat, instant, not even looking, the classic dad line", DAD],
  // 3-9 s NAME + WEIRD RULE
  ["rep", "We're live. Tato, age seven, just asked for burgers.", "calm", "grave, low, a war correspondent under cover", REP],
  ["rep", "And in this car, there is one rule.", "calm", "slow, ominous, leaning in", REP],
  ["rep", "Whoever says \"We have food at home\"... has to eat it.", "calm", "deadly serious, a pause before the last words", REP],
  // 9-14 s STAKES: the red light is the clock
  ["rep", "The light turns green in one minute. Then the burger place is gone.", "sad", "urgent, tense, a countdown", REP],
  ["spud", "But I'm hungry.", "sad", "small, pleading, face against the window", KID],
  ["wedge", "We have food at home.", "calm", "flat, firm, eyes on the road", DAD],
  // 14-25 s TEASE 1: the stomach growl (sound), the coin
  ["rep", "Sir... was that you?", "question", "suspicious, slow, mic pushed in", REP],
  ["wedge", "That was the engine.", "calm", "too quick, too calm, a lie", DAD],
  ["spud", "I have my own money.", "excited", "hopeful, holding up a coin", KID],
  ["wedge", "We have food at home.", "calm", "smug, eyes closed, hand up", DAD],
  ["rep", "What food, sir?", "question", "sharp, a reporter pressing", REP],
  ["wedge", "Food.", "calm", "short, flat, no details", DAD],
  // 25-40 s TEASE 2: live from the house, the fridge
  ["rep", "Let's go live to the house.", "calm", "urgent, handing over", REP],
  ["chip", "I'm at the house. There is one pickle.", "sad", "shaken, whispering, a correspondent in a disaster zone", HOUSE],
  ["chip", "And rice. From Tuesday.", "sad", "horrified, quiet", HOUSE],
  ["chip", "Under the rule... this is his dinner.", "sad", "grave, slow, delivering terrible news", HOUSE],
  ["wedge", "...That's a meal.", "calm", "a dry swallow, unconvinced, sweating", DAD],
  // 40-55 s FORCED IN: green light, the cone, the drive-thru lane
  ["rep", "He's entering the drive-thru! Repeat, he is entering!", "excited", "running, out of breath, breaking news", REP],
  ["mash", "Welcome! Can I take your order?", "happy", "bright, bored, a drive-thru speaker voice", MASH],
  ["wedge", "We have food at home.", "calm", "firm, to the speaker, dead serious", DAD],
  ["mash", "...Then why are you here?", "question", "confused, flat, honest", MASH],
  // 55-70 s THE CRACK
  ["wedge", "...One burger. For the drive.", "sad", "a guilty whisper, leaning to the speaker", DAD],
  ["rep", "Did he just...", "question", "stunned, quiet, lowering the mic", REP],
  // 70-80 s ENDING (E1): the kid turns the line on him. CUT on the dad frozen.
  ["spud", "We have food at home.", "calm", "flat, calm, exactly the dad's tone, a little kid being his dad", KID],
];
