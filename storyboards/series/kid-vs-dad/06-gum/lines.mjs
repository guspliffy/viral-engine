// Kid vs Dad 06 "Swallowed gum glues your stomach": the spoken lines, in order. OUTLINE.md here (Jonny 25 Nov 2026:
// hook H1 + ending E1 approved 12:34 Berlin, panel sheet kid-vs-dad-06-panels-v1.png "looks good" 13:00).
// Cast: rep = the war correspondent (ep 1), spud = Tato (spud-kid; the only name said), dad = Dad B (never named).
// Counter (natural, nothing written): Dad's bomb-squad gear grows (oven mitts -> colander helmet -> laundry-basket armour)
// and the egg timer's red wedge shrinks. Teases of the twist: Dad's own tummy gurgles, he flinches from a gum, "before".
// [who, line, tone, style (VoxCPM2 acting direction), { voice }]
const REP = { voice: "reaper" }, KID = { voice: "tato" }, DAD = { voice: "dad" };
export const LINES = [
  // 0-5 s HOOK (H1): bubble pops, Tato gulps, Dad frozen in the doorway, the reporter behind the fridge
  ["dad", "Swallowed. Don't. Move.", "calm", "frozen, deadly serious, a bomb-squad whisper, one word at a time", DAD],
  ["rep", "Swallowed. Is it deadly?", "whisper", "tense, crouched, a war correspondent under cover", REP],
  // 5-13 s NAME + WEIRD RULE + STAKE (the egg timer = dinner)
  ["rep", "We're live. Tato, age seven, swallowed his gum.", "calm", "grave, low, a correspondent under cover", REP],
  ["rep", "And in this house, there is one rule: swallow your gum, and your stomach glues shut. For seven years.", "calm", "slow, ominous, a pause before the last words", { ...REP, take: 1 }],
  ["dad", "Dinner's in one minute. If it's glued, nothing goes down.", "calm", "grim, setting the egg timer, a man defusing a bomb", DAD],
  // 13-25 s STEP 1: oven mitts, a glass on the tummy
  ["dad", "Mitts.", "calm", "short, a surgeon asking for a tool", DAD],
  ["dad", "It's sticking.", "whisper", "horrified whisper, ear on the glass", DAD],
  ["rep", "Sir... that was your stomach.", "question", "suspicious, slow, mic pushed in", REP],
  ["dad", "Mine is fine.", "calm", "too quick, too calm, a lie", DAD],
  // 25-38 s STEP 2: colander helmet, the "wires", the offered gum
  ["dad", "Helmet.", "calm", "short, grim, pulling it on", DAD],
  ["dad", "Red wire... or blue wire?", "whisper", "sweating, tongs hovering over the sweater", DAD],
  ["spud", "It's my sweater.", "calm", "flat, bored, lying on the table", KID],
  ["spud", "Want one?", "calm", "innocent, holding out a gum", KID],
  ["dad", "Get that away from me!", "excited", "panicked, jumping back as if from a snake", DAD],
  ["rep", "He's been through this before.", "whisper", "quiet, knowing, to the camera", REP],
  // 38-52 s STEP 3 (extreme): full armour, the dinner test
  ["rep", "Full armour. The moment of truth.", "calm", "hushed, tense, the countdown", REP],
  ["dad", "One spoon. Slowly... slowly...", "whisper", "trembling, behind the pot-lid shield", DAD],
  // 52-62 s THE ANSWER
  ["spud", "Still works.", "calm", "flat, after a burp, unimpressed", KID],
  ["dad", "Impossible.", "whisper", "stunned, lowering the shield", DAD],
  // 62-75 s END (E1): the X-ray, CUT on Dad sweating
  ["rep", "Then what... is this?", "question", "slow, holding up an X-ray, a reporter with proof", REP],
  ["dad", "...That's different.", "calm", "a dry swallow, sweating, caught", DAD],
];

// THE RHYMING VERSION (Jonny 25 Nov 22:52 Berlin: "i think we could make this a rhyme video again could be funny"), index
// for index with LINES, so the staging stays (make-gum.mjs KVD_RHYME=1 -> gum-rhyme.json). Draft 1 sent 22:58 Berlin.
const R = (i, line, style, extra) => { const [who, , tone, st, o] = LINES[i]; return [who, line, tone, style ?? st, extra ? { ...o, ...extra } : o]; };
export const RHYME = [
  R(0, "Swallowed. Don't move. Don't make a sound."),
  R(1, "Swallowed... is it deadly? Stay down."),
  R(2, "We're live. Tato, age seven, swallowed his gum."),
  R(3, "In this house, one rule: your stomach glues shut... for seven years. Not a crumb."),
  R(4, "One minute to dinner. If it's glued... it stays out."),
  R(5, "Mitts."),
  R(6, "It's sticking. No doubt."),
  R(7, "Sir... that was your stomach, I'm sure."),
  R(8, "Mine is fine. Mine is secure."),
  R(9, "Helmet."),
  R(10, "Red wire... or blue? Which one's the clue?"),
  R(11, "It's my sweater. It's new."),
  R(12, "Want one?"),
  R(13, "Get that away! Don't you come near!"),
  R(14, "He's been through this before, I fear."),
  R(15, "Full armour. The moment of truth. One bite."),
  R(16, "Slowly... slowly... hold on tight."),
  R(17, "Still works. Not glued. Not stuck."),
  R(18, "Impossible. Just beginner's luck."),
  R(19, "Then what... is this? Dad, ninety-five."),
  R(20, "...That's different. I survived."),
];
